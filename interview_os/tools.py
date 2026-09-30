"""Flashcards (SM-2), study planner, JD/resume analyser, local code runner, engineering-blog feed."""
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from xml.etree import ElementTree as ET

from . import bank, db, knowledge, net, nlp
from .extract import strip_tags

DAY = 86400.0


# ================================================================== flashcards (SM-2)
def card_add(front, back, deck="General", source="", ext_id=None):
    try:
        cur = db.user().execute("INSERT INTO cards(deck, front, back, source, ext_id, created, due) VALUES (?,?,?,?,?,?,?)",
                                (deck, front.strip(), back.strip(), source, ext_id, time.time(), time.time()))
        db.user().commit()
        return cur.lastrowid
    except Exception:
        return None


def card_review(card_id, grade):
    """grade: 0 again · 1 hard · 2 good · 3 easy  (mapped onto SM-2 quality 1/3/4/5)."""
    c = db.user().execute("SELECT * FROM cards WHERE id=?", (card_id,)).fetchone()
    if not c:
        return None
    q = {0: 1, 1: 3, 2: 4, 3: 5}.get(int(grade), 4)
    ease, interval, reps, lapses = c["ease"], c["interval"], c["reps"], c["lapses"]
    if q < 3:
        reps, lapses, interval = 0, lapses + 1, 10 / 1440.0  # relearn in 10 minutes
    else:
        reps += 1
        if reps == 1:
            interval = 1.0 if q < 5 else 3.0
        elif reps == 2:
            interval = 3.0 if q < 5 else 6.0
        else:
            interval = interval * ease * (0.8 if q == 3 else 1.0) * (1.3 if q == 5 else 1.0)
        ease = max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
    due = time.time() + interval * DAY
    db.user().execute("UPDATE cards SET ease=?, interval=?, reps=?, lapses=?, due=? WHERE id=?", (ease, interval, reps, lapses, due, card_id))
    db.user().execute("INSERT INTO reviews(card_id, grade, ts) VALUES (?,?,?)", (card_id, grade, time.time()))
    db.user().commit()
    db.bump_activity(minutes=0.3)
    return {"id": card_id, "interval_days": round(interval, 2), "due": due, "ease": round(ease, 2)}


def _today_start():
    lt = time.localtime()
    return time.mktime((lt.tm_year, lt.tm_mon, lt.tm_mday, 0, 0, 0, 0, 0, -1))


def new_per_day():
    return int(db.kv_get("new_per_day", 30))


def _new_left_today():
    """New cards still allowed today = daily limit − cards first reviewed today."""
    seen_today = db.user().execute(
        "SELECT COUNT(*) n FROM (SELECT card_id, MIN(ts) first FROM reviews GROUP BY card_id) WHERE first >= ?",
        (_today_start(),)).fetchone()["n"]
    return max(0, new_per_day() - seen_today)


def cards_due(deck=None, limit=50):
    """Reviews that are due first, then new cards up to the daily new-card limit."""
    now = time.time()
    cond, args = "", []
    if deck:
        cond, args = " AND deck=?", [deck]
    u = db.user()
    reviews = db.rows(u.execute("SELECT * FROM cards WHERE suspended=0 AND reps>0 AND due<=?" + cond + " ORDER BY due LIMIT ?",
                                [now] + args + [limit]))
    room = min(limit - len(reviews), _new_left_today())
    new = db.rows(u.execute("SELECT * FROM cards WHERE suspended=0 AND reps=0 AND lapses=0" + cond + " ORDER BY id LIMIT ?",
                            args + [max(0, room)])) if room > 0 else []
    return reviews + new


def card_stats():
    u = db.user()
    now = time.time()
    decks = db.rows(u.execute(
        "SELECT deck, COUNT(*) total, SUM(CASE WHEN reps>0 AND due<=? AND suspended=0 THEN 1 ELSE 0 END) due_reviews, "
        "SUM(CASE WHEN reps=0 AND lapses=0 AND suspended=0 THEN 1 ELSE 0 END) new, "
        "SUM(CASE WHEN reps>=3 AND interval>=21 THEN 1 ELSE 0 END) mature FROM cards GROUP BY deck ORDER BY deck", (now,)))
    new_left = _new_left_today()
    for d in decks:
        d["due"] = (d["due_reviews"] or 0) + min(d["new"] or 0, new_left)
    today = u.execute("SELECT COUNT(*) n FROM reviews WHERE ts>=?", (_today_start(),)).fetchone()["n"]
    reviews_due = sum(d["due_reviews"] or 0 for d in decks)
    new_total = sum(d["new"] or 0 for d in decks)
    return {"decks": decks, "reviewed_today": today, "total": sum(d["total"] for d in decks),
            "due": reviews_due + min(new_total, new_left), "reviews_due": reviews_due, "new_today": min(new_total, new_left),
            "new_total": new_total, "new_per_day": new_per_day()}


def seed_library_cards():
    """One card per library topic key point + interview Q from prep-hub (idempotent via ext_id)."""
    lib = knowledge.library()
    added = 0
    for s in lib["sections"]:
        for t in s["topics"]:
            if t.get("summary"):
                if card_add("What is “%s” about? (one line)" % t["title"], t["summary"], deck=s["title"],
                            source="/index.html#/topic/%s/%s?m=key" % (s["id"], t["id"]), ext_id="libsum:%s:%s" % (s["id"], t["id"])):
                    added += 1
            if t["brushup"]:
                if card_add("%s — key points?" % t["title"], "\n".join("• " + b for b in t["brushup"]), deck=s["title"],
                            source="/index.html#/topic/%s/%s?m=key" % (s["id"], t["id"]), ext_id="lib:%s:%s" % (s["id"], t["id"])):
                    added += 1
            for i, q in enumerate(t.get("interviewQs") or []):
                if isinstance(q, dict):
                    front, back = q.get("q", ""), q.get("a", "")
                else:
                    front, back = q, "Open the deep dive and answer out loud. Key points:\n" + "\n".join("• " + b for b in t["brushup"][:4])
                if front and card_add(front, back, deck=s["title"], source="/index.html#/topic/%s/%s?m=deep" % (s["id"], t["id"]),
                                      ext_id="libq:%s:%s:%d" % (s["id"], t["id"], i)):
                    added += 1
    for track, qs in bank.Q.items():
        for i, q in enumerate(qs):
            if card_add(q["q"], "\n".join("• " + p for p in q["points"]), deck="Q-bank · " + bank.TRACKS[track]["name"],
                        source="bank", ext_id="bank:%s:%d" % (track, i)):
                added += 1
    return added


# ================================================================== study planner
def make_plan(interview_date, hours_per_day=2.0, focus=None, company=""):
    """Day-by-day plan until the interview, interleaving DSA roadmap, concept topics, mocks and review."""
    focus = focus or ["dsa", "system-design", "behavioral", "cs"]
    today = dt.date.today()
    try:
        end = dt.date.fromisoformat(interview_date)
    except Exception:
        end = today + dt.timedelta(days=28)
    days = max(1, (end - today).days)
    lib = knowledge.library()
    roadmap = lib.get("roadmap", [])
    sec = {s["id"]: s for s in lib["sections"]}
    topic_q = []
    order = {"system-design": ["hld"], "lld": ["lld"], "cs": ["cs", "hardware"], "dsa": ["dsa"], "behavioral": ["behavioral"]}
    for f in focus:
        for sid in order.get(f, []):
            for s_id, s in sec.items():
                if s_id.startswith(sid):
                    topic_q += [(s, t) for t in s["topics"]]
    per_day_problems = max(1, int(hours_per_day * 1.5)) if "dsa" in focus else 0
    per_day_topics = 1 if hours_per_day < 3 else 2
    plan, pi, ti = [], 0, 0
    for d in range(days):
        date = today + dt.timedelta(days=d)
        left = days - d
        items = []
        if left <= 2:
            items.append({"kind": "review", "title": "Light review only: cram sheet, your story bank, flashcards. Sleep well.", "href": "/index.html#/cram"})
            if left == 1:
                items.append({"kind": "mock", "title": "One short behavioral warm-up mock", "href": "#/mock?track=behavioral"})
        else:
            for _ in range(per_day_problems):
                if pi < len(roadmap):
                    p = roadmap[pi]
                    pi += 1
                    items.append({"kind": "problem", "title": "%s (%s · %s)" % (p["title"], p["diff"], p["group"]),
                                  "href": ("/index.html#/problem/" + p["local"]) if p.get("local") else "https://leetcode.com/problems/%s/" % p["lc"]})
            for _ in range(per_day_topics):
                if topic_q:
                    s, t = topic_q[ti % len(topic_q)]
                    ti += 1
                    items.append({"kind": "topic", "title": "%s — %s" % (s["title"], t["title"]), "href": "/index.html#/topic/%s/%s?m=deep" % (s["id"], t["id"])})
            if d % 3 == 2:
                tr = ["system-design", "behavioral", "dsa", "data-eng", "cs"][(d // 3) % 5]
                if tr in focus or tr in ("behavioral", "dsa"):
                    items.append({"kind": "mock", "title": "Mock interview: " + bank.TRACKS[tr]["name"], "href": "#/mock?track=" + tr})
            if d % 7 == 6:
                items.append({"kind": "review", "title": "Weekly review: redo shaky problems, update story bank", "href": "/index.html#/plan"})
            if company and d % 5 == 1:
                items.append({"kind": "company", "title": "Company intel refresh: " + company, "href": "#/company?name=" + company})
        items.append({"kind": "cards", "title": "Flashcard review (~15 min)", "href": "#/cards"})
        plan.append({"date": date.isoformat(), "weekday": date.strftime("%a"), "days_left": left, "items": items})
    db.kv_set("plan", {"interview_date": end.isoformat(), "hours": hours_per_day, "focus": focus, "company": company,
                       "created": time.time(), "days": plan})
    return db.kv_get("plan")


# ================================================================== JD / resume analyser
REQ_RX = re.compile(r"(required|must have|must|minimum qualifications|requirements|you have|you bring|what you.ll need)", re.I)
NICE_RX = re.compile(r"(nice to have|preferred|bonus|plus|good to have|preferred qualifications)", re.I)


def analyze_jd(jd, resume=""):
    jd_sk = knowledge.detect_skills(jd)
    # weight: frequency + appears in a 'required' section
    lines = jd.split("\n")
    section = "req"
    weight = {}
    for ln in lines:
        if NICE_RX.search(ln) and len(ln) < 80:
            section = "nice"
        elif REQ_RX.search(ln) and len(ln) < 80:
            section = "req"
        for sk, n in knowledge.detect_skills(ln).items():
            weight[sk] = weight.get(sk, 0) + n * (2 if section == "req" else 1)
    res_sk = knowledge.detect_skills(resume) if resume else {}
    skills = []
    for sk, w in sorted(weight.items(), key=lambda x: -x[1]):
        cat, _, q = knowledge.SKILLS[sk]
        skills.append({"skill": sk, "category": cat, "weight": w, "in_resume": sk in res_sk if resume else None,
                       "study": q, "local": knowledge.local_topic_hits(q, 2)})
    yrs = re.findall(r"(\d+)\+?\s*(?:-|to)?\s*\d*\s*years?", jd, re.I)
    level = ("Senior/Staff" if re.search(r"\b(senior|staff|principal|lead|sr\.?)\b", jd, re.I) else
             "Junior/Entry" if re.search(r"\b(junior|entry|graduate|new grad|intern)\b", jd, re.I) else "Mid-level")
    title = next((l.strip() for l in lines if l.strip() and len(l.strip()) < 90), "")
    kp = [p for p in nlp.keyphrases(jd, 25) if len(p) > 3]
    match = None
    missing_kw = []
    if resume:
        tot = sum(s["weight"] for s in skills) or 1
        have = sum(s["weight"] for s in skills if s["in_resume"])
        rt = set(nlp.tokens(resume))
        kw_hit = [p for p in kp if set(nlp.tokens(p)) <= rt]
        missing_kw = [p for p in kp if p not in kw_hit][:15]
        match = round(100 * (0.7 * have / tot + 0.3 * len(kw_hit) / max(1, len(kp))))
    # likely questions: map skills → tracks
    track_map = {"Kafka": "data-eng", "Flink": "data-eng", "Spark": "data-eng", "Stream Processing": "data-eng", "Data Warehousing": "data-eng",
                 "Java": "java", "Spring Boot": "java", "Python": "python", "System Design": "system-design",
                 "Distributed Systems": "distributed", "Microservices": "distributed", "PostgreSQL/MySQL": "databases", "SQL": "databases",
                 "NoSQL": "databases", "Kubernetes": "cloud", "AWS": "cloud", "Docker": "cloud", "CI/CD": "cloud",
                 "Data Structures & Algorithms": "dsa", "Low-Level Design / OOP": "lld", "Operating Systems": "cs", "Networking": "cs",
                 "JavaScript/TypeScript": "frontend", "React": "frontend", "Machine Learning": "ml", "LLMs/GenAI": "ml",
                 "Leadership/Mentoring": "leadership", "Communication": "behavioral"}
    tracks = []
    for s in skills:
        t = track_map.get(s["skill"])
        if t and t not in tracks:
            tracks.append(t)
    for t in ("dsa", "system-design", "behavioral"):
        if t not in tracks:
            tracks.append(t)
    likely = []
    for t in tracks[:6]:
        for q in bank.Q.get(t, [])[:3]:
            likely.append({"track": t, "q": q["q"]})
    for s in skills[:6]:
        likely.append({"track": "behavioral", "q": "Tell me about a project where you used %s. What was hard about it?" % s["skill"]})
    return {"title": title, "level": level, "years": sorted({int(y) for y in yrs if int(y) < 30})[:3], "skills": skills,
            "keyphrases": kp, "match": match, "missing_keywords": missing_kw, "tracks": tracks, "likely_questions": likely,
            "gaps": [s for s in skills if resume and not s["in_resume"]][:10]}


# ================================================================== local code runner
LANGS = {
    "python": {"file": "main.py", "run": [["python3", "main.py"]]},
    "java": {"file": "Main.java", "run": [["javac", "Main.java"], ["java", "-Xss64m", "Main"]]},
    "cpp": {"file": "main.cpp", "run": [["g++", "-std=c++17", "-O2", "-o", "main", "main.cpp"], ["./main"]]},
    "javascript": {"file": "main.js", "run": [["node", "main.js"]]},
}


def runner_langs():
    out = {}
    for k, v in LANGS.items():
        out[k] = all(shutil.which(cmd[0]) or cmd[0].startswith("./") for cmd in v["run"])
    return out


def run_code(lang, code, stdin="", timeout=10):
    spec = LANGS.get(lang)
    if not spec:
        return {"ok": False, "stderr": "unsupported language"}
    if lang == "java":
        m = re.search(r"public\s+class\s+(\w+)", code)
        if m and m.group(1) != "Main":
            spec = {"file": m.group(1) + ".java", "run": [["javac", m.group(1) + ".java"], ["java", "-Xss64m", m.group(1)]]}
    with tempfile.TemporaryDirectory(prefix="ios-run-") as d:
        with open(os.path.join(d, spec["file"]), "w") as f:
            f.write(code)
        out = {"ok": True, "stdout": "", "stderr": "", "steps": []}
        for i, cmd in enumerate(spec["run"]):
            last = i == len(spec["run"]) - 1
            t0 = time.time()
            try:
                p = subprocess.run(cmd, cwd=d, input=stdin if last else "", capture_output=True, text=True, timeout=timeout if last else 60)
            except subprocess.TimeoutExpired:
                out.update(ok=False, stderr="⏱ Time limit exceeded (%ss)" % timeout)
                return out
            except FileNotFoundError:
                out.update(ok=False, stderr="%s is not installed" % cmd[0])
                return out
            out["steps"].append({"cmd": " ".join(cmd), "ms": int((time.time() - t0) * 1000), "code": p.returncode})
            if not last and p.returncode != 0:
                out.update(ok=False, stderr=p.stderr[-8000:], phase="compile")
                return out
            if last:
                out.update(stdout=p.stdout[-20000:], stderr=p.stderr[-8000:], ok=p.returncode == 0, exit=p.returncode,
                           ms=out["steps"][-1]["ms"])
        return out


# ================================================================== engineering-blog feed
FEEDS = {
    "Netflix Tech Blog": "https://netflixtechblog.com/feed",
    "Meta Engineering": "https://engineering.fb.com/feed/",
    "Cloudflare": "https://blog.cloudflare.com/rss/",
    "AWS Architecture": "https://aws.amazon.com/blogs/architecture/feed/",
    "Martin Fowler": "https://martinfowler.com/feed.atom",
    "ByteByteGo": "https://blog.bytebytego.com/feed",
    "High Scalability": "https://highscalability.com/rss/",
    "Discord": "https://discord.com/blog/rss.xml",
    "Slack Engineering": "https://slack.engineering/feed/",
    "Stripe": "https://stripe.com/blog/feed.rss",
    "Airbnb Tech": "https://medium.com/feed/airbnb-engineering",
    "Pragmatic Engineer": "https://blog.pragmaticengineer.com/rss/",
    "Confluent": "https://www.confluent.io/rss.xml",
    "Google Developers": "https://developers.googleblog.com/feeds/posts/default",
    "GitHub Engineering": "https://github.blog/engineering/feed/",
    "Dropbox Tech": "https://dropbox.tech/feed",
    "Shopify Engineering": "https://shopify.engineering/blog.atom",
    "Spotify Engineering": "https://engineering.atspotify.com/feed",
    "Pinterest Engineering": "https://medium.com/feed/@Pinterest_Engineering",
    "Salesforce Engineering": "https://engineering.salesforce.com/feed/",
    "Instacart Tech": "https://tech.instacart.com/feed",
    "Grab Engineering": "https://engineering.grab.com/feed",
    "Flipkart Tech": "https://blog.flipkart.tech/feed",
    "Apache Flink": "https://flink.apache.org/index.xml",
}
_feed_lock = threading.Lock()


def _parse_date(s):
    s = (s or "").strip()
    for fmt in ("%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S %Z", "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%S.%f%z", "%Y-%m-%d"):
        try:
            return dt.datetime.strptime(s.replace("Z", "+0000") if "T" in s else s, fmt).timestamp()
        except Exception:
            continue
    return time.time()


def _parse_feed(xml, source):
    xml = re.sub(r'\sxmlns(:\w+)?="[^"]+"', "", xml, count=20)
    xml = re.sub(r"<(/?)(\w+):(\w+)", r"<\1\2_\3", xml)
    root = ET.fromstring(xml.encode("utf-8", "ignore"))
    items = []
    for it in root.iter():
        if it.tag not in ("item", "entry"):
            continue
        title = (it.findtext("title") or "").strip()
        link = it.findtext("link") or ""
        if not link:
            le = it.find("link")
            if le is not None:
                link = le.get("href", "")
        for le in it.findall("link"):
            if le.get("rel") in (None, "alternate") and le.get("href"):
                link = le.get("href")
        summ = it.findtext("description") or it.findtext("summary") or it.findtext("content_encoded") or it.findtext("content") or ""
        pub = it.findtext("pubDate") or it.findtext("published") or it.findtext("updated") or it.findtext("dc_date") or ""
        if title and link:
            items.append({"title": strip_tags(title), "url": link.strip(), "summary": strip_tags(summ)[:400], "published": _parse_date(pub), "source": source})
    return items


def refresh_feed(force=False):
    last = db.kv_get("feed_refreshed", 0)
    if not force and time.time() - last < 3 * 3600:
        return {"skipped": True}
    if not _feed_lock.acquire(blocking=False):
        return {"busy": True}
    try:
        ok, bad = 0, {}

        def one(kv):
            name, url = kv
            try:
                st, _, body = net.fetch(url, ttl=2 * 3600, timeout=15)
                if st != 200:
                    return name, None, "HTTP %s" % st
                return name, _parse_feed(body, name)[:15], None
            except Exception as e:
                return name, None, str(e)[:100]

        with ThreadPoolExecutor(max_workers=8) as ex:
            for name, items, err in ex.map(one, FEEDS.items()):
                if err:
                    bad[name] = err
                    continue
                with db.WLOCK:
                    for it in items:
                        tags = ",".join(list(knowledge.detect_skills(it["title"] + " " + it["summary"]).keys())[:5])
                        db.cache().execute("INSERT OR IGNORE INTO feed(url, title, source, summary, published, fetched, tags) VALUES (?,?,?,?,?,?,?)",
                                           (it["url"], it["title"], it["source"], it["summary"], it["published"], time.time(), tags))
                    db.cache().commit()
                ok += 1
        db.kv_set("feed_refreshed", time.time())
        return {"ok": ok, "failed": bad}
    finally:
        _feed_lock.release()


def feed(limit=60, tag=None, q=None):
    sql, args = "SELECT * FROM feed", []
    conds = []
    if tag:
        conds.append("tags LIKE ?")
        args.append("%" + tag + "%")
    if q:
        conds.append("(title LIKE ? OR summary LIKE ?)")
        args += ["%" + q + "%", "%" + q + "%"]
    if conds:
        sql += " WHERE " + " AND ".join(conds)
    return db.rows(db.cache().execute(sql + " ORDER BY published DESC LIMIT ?", args + [limit]))


def hn_top(q="system design OR distributed OR database OR interview OR scalability", days=7, n=20):
    since = int(time.time() - days * DAY)
    try:
        j = net.get_json("https://hn.algolia.com/api/v1/search?" + net.qs({"query": "", "tags": "story", "numericFilters": "created_at_i>%d,points>150" % since, "hitsPerPage": 50}), ttl=3600)
    except Exception:
        return []
    kw = re.compile(r"(database|postgres|sql|kafka|distributed|scal|latency|system|architecture|engineering|interview|rust|go\b|java|python|kubernetes|cloud|aws|llm|cache|performance|outage|postmortem)", re.I)
    out = [{"title": h["title"], "url": h.get("url") or "https://news.ycombinator.com/item?id=" + h["objectID"], "points": h["points"],
            "comments": h.get("num_comments", 0), "hn": "https://news.ycombinator.com/item?id=" + h["objectID"]}
           for h in j.get("hits", []) if kw.search(h.get("title") or "")]
    return sorted(out, key=lambda x: -x["points"])[:n]
