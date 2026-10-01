# -*- coding: utf-8 -*-
"""Practice tracking + the IA pages that sit on top of it:
attempts (every graded answer: MCQ, SQL, debugging, scenario, code, plan rating, mock answer),
bookmarks, mistakes log, weak topics, analytics, Learn-hub subjects, role paths, resume analysis
and your own real-interview log."""
import json
import re
import time

from . import bank, db, knowledge, mcq, scenarios, sqlbank, debugbank

SCHEMA = """
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,          -- mcq | sql | debug | scenario | code | plan | mock | project
  ref TEXT NOT NULL,           -- question / problem id
  title TEXT DEFAULT '',
  subject TEXT DEFAULT '',     -- Learn subject id (dsa, java, kafka, ...)
  correct INTEGER NOT NULL,    -- 1 right / 0 wrong
  score REAL,                  -- 0..10 when graded on a scale
  detail TEXT DEFAULT '{}',
  resolved INTEGER NOT NULL DEFAULT 0,
  ts REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS attempts_ts ON attempts(ts);
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL, ref TEXT NOT NULL, title TEXT NOT NULL, href TEXT DEFAULT '', note TEXT DEFAULT '',
  created REAL NOT NULL, UNIQUE(kind, ref)
);
CREATE TABLE IF NOT EXISTS interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL, role TEXT DEFAULT '', round TEXT DEFAULT '', date TEXT DEFAULT '',
  outcome TEXT DEFAULT 'Pending', rating INTEGER DEFAULT 0, questions TEXT DEFAULT '', notes TEXT DEFAULT '',
  created REAL NOT NULL
);
"""

TABLES = ("attempts", "bookmarks", "interviews")


def init():
    db.user().executescript(SCHEMA)
    db.user().commit()


# ------------------------------------------------------------------ Learn hub subjects
# Each subject pulls topics from one or more library sections plus individual topic ids.
LEARN = [
    {"id": "dsa", "name": "DSA", "icon": "🧠", "sections": ["dsa", "patterns"], "topics": [], "tracks": ["dsa", "patterns"],
     "blurb": "Data structures, algorithms and the 24 problem-solving patterns."},
    {"id": "java", "name": "Java", "icon": "☕", "sections": ["java"], "topics": ["lld-concurrency-patterns"], "tracks": ["java"],
     "blurb": "Core Java, collections, concurrency, modern Java and the JVM."},
    {"id": "spring", "name": "Spring Boot", "icon": "🌱", "sections": ["spring"], "topics": ["spring-boot"], "tracks": ["java"],
     "blurb": "Auto-configuration, REST, JPA, transactions, security, testing, Actuator."},
    {"id": "databases", "name": "Databases", "icon": "🗄️", "sections": ["databases"], "topics": ["cs-dbms-normalization", "cs-dbms-index-txn", "cs-sql-nosql"], "tracks": ["databases"],
     "blurb": "SQL, indexing, MVCC & isolation, storage engines, NoSQL, Redis, query tuning."},
    {"id": "kafka", "name": "Kafka", "icon": "🌊", "sections": ["kafka"], "topics": ["kafka-architecture", "kafka-clients", "kafka-eos-ops", "de-cdc", "hld-messaging", "sd-message-queue"], "tracks": ["data-eng"],
     "blurb": "Architecture, producers & consumers, exactly-once, operations, streams & CDC."},
    {"id": "microservices", "name": "Microservices", "icon": "🧱", "sections": ["microservices"], "topics": ["hld-microservices", "arch-ddd", "arch-eda", "arch-api-evolution", "ds-transactions", "ds-resilience"], "tracks": ["architecture", "distributed"],
     "blurb": "Boundaries, communication, data ownership, sagas, resilience, testing, migration."},
    {"id": "system-design", "name": "System Design", "icon": "🏗️", "sections": ["hld", "hld-cases", "lld", "distributed"], "topics": [], "tracks": ["system-design", "lld", "distributed"],
     "blurb": "HLD framework, building blocks, 19 case studies, LLD and distributed systems."},
    {"id": "kubernetes", "name": "Kubernetes", "icon": "☸️", "sections": ["kubernetes"], "topics": ["docker", "k8s-core", "k8s-ops"], "tracks": ["cloud"],
     "blurb": "Containers, workloads, networking, scheduling & autoscaling, security, operations."},
    {"id": "cloud", "name": "Cloud", "icon": "☁️", "sections": [], "topics": ["aws-core", "cloud-architecture", "sec-cloud", "arch-multitenancy"], "tracks": ["cloud"],
     "blurb": "AWS core services, cloud architecture, cloud security and multi-tenancy."},
    {"id": "networking", "name": "Networking", "icon": "🔌", "sections": ["networking"], "topics": ["cs-net-model", "cs-net-http-dns", "http-caching", "api-styles"], "tracks": ["cs"],
     "blurb": "IP & subnets, TCP/UDP/QUIC, HTTP, DNS, load balancers, real-time protocols, debugging."},
    {"id": "devops", "name": "DevOps", "icon": "🚀", "sections": ["devops"], "topics": ["cicd", "terraform", "observability-sre", "linux-troubleshooting", "craft-git"], "tracks": ["cloud"],
     "blurb": "CI/CD, IaC, GitOps, deployment strategies, observability, SRE and Linux."},
    {"id": "os", "name": "CS Fundamentals", "icon": "💻", "sections": ["cs", "hw"], "topics": [], "tracks": ["cs"],
     "blurb": "OOP, SOLID, design patterns, operating systems, hardware numbers."},
    {"id": "security", "name": "Security", "icon": "🔐", "sections": ["security"], "topics": [], "tracks": ["cloud"],
     "blurb": "AuthN/AuthZ, OAuth/OIDC, OWASP, crypto, API and cloud security."},
    {"id": "python", "name": "Python", "icon": "🐍", "sections": ["python"], "topics": [], "tracks": ["python"], "blurb": "Core Python, data structures, concurrency, production Python."},
    {"id": "data-eng", "name": "Data Engineering", "icon": "🌊", "sections": ["data-eng"], "topics": [], "tracks": ["data-eng"], "blurb": "Flink, Spark, modeling, lakehouse, orchestration, CDC."},
    {"id": "ml", "name": "AI & ML", "icon": "🤖", "sections": ["ml"], "topics": [], "tracks": ["ml"], "blurb": "ML fundamentals, ML system design, LLMs, RAG."},
    {"id": "leadership", "name": "Leadership", "icon": "🧑‍✈️", "sections": ["leadership", "architecture"], "topics": [], "tracks": ["leadership", "architecture"], "blurb": "Tech lead skills, design docs, architecture & craft."},
    {"id": "behavioral", "name": "Behavioral & Career", "icon": "🗣️", "sections": ["career"], "topics": [], "tracks": ["behavioral"], "blurb": "STAR stories, questions, negotiation, resume."},
]
SUBJECT_NAMES = dict(mcq.SUBJECTS, **{s["id"]: s["name"] for s in LEARN})

# which Learn subject a library section / mock track feeds
SECTION_SUBJECT = {}
for _s in LEARN:
    for _sec in _s["sections"]:
        SECTION_SUBJECT.setdefault(_sec, _s["id"])
TRACK_SUBJECT = {"dsa": "dsa", "patterns": "dsa", "java": "java", "databases": "databases", "data-eng": "kafka", "system-design": "system-design",
                 "lld": "system-design", "distributed": "system-design", "cloud": "cloud", "cs": "os", "python": "python", "frontend": "frontend",
                 "ml": "ml", "leadership": "leadership", "architecture": "microservices", "behavioral": "behavioral", "scenarios": "scenarios", "project": "project"}


def learn_subjects():
    lib = knowledge.library()
    secs = {s["id"]: s for s in lib["sections"]}
    tmap = {t["id"]: (s, t) for s in lib["sections"] for t in s["topics"]}
    out = []
    for sub in LEARN:
        seen, topics = set(), []
        for sid in sub["sections"]:
            for t in (secs.get(sid) or {}).get("topics", []):
                if t["id"] not in seen:
                    seen.add(t["id"])
                    topics.append({"id": t["id"], "title": t["title"], "section": sid, "summary": t.get("summary", "")})
        for tid in sub["topics"]:
            if tid in tmap and tid not in seen:
                s, t = tmap[tid]
                seen.add(tid)
                topics.append({"id": tid, "title": t["title"], "section": s["id"], "summary": t.get("summary", "")})
        out.append(dict({k: sub[k] for k in ("id", "name", "icon", "blurb", "tracks")}, topics=topics,
                        mcq=sum(1 for q in mcq.QUESTIONS if q["subject"] == sub["id"])))
    return out


# ------------------------------------------------------------------ attempts
def record(kind, ref, correct, title="", subject="", score=None, detail=None):
    with db.WLOCK:
        cur = db.user().execute("INSERT INTO attempts(kind, ref, title, subject, correct, score, detail, ts) VALUES (?,?,?,?,?,?,?,?)",
                                (kind, str(ref), title or "", subject or "", 1 if correct else 0, score, json.dumps(detail or {}), time.time()))
        # a correct retry resolves earlier mistakes on the same item
        if correct:
            db.user().execute("UPDATE attempts SET resolved=1 WHERE kind=? AND ref=? AND correct=0", (kind, str(ref)))
        db.user().commit()
    db.bump_activity(0.5)
    return cur.lastrowid


def mcq_answer(qid, choice):
    q = mcq.BY_ID.get(qid)
    if not q:
        return None
    ok = int(choice) == q["a"]
    record("mcq", qid, ok, q["q"], q["subject"], detail={"choice": int(choice)})
    return {"correct": ok, "answer": q["a"], "why": q["why"]}


def mcq_quiz(subject="", count=10, mode=""):
    import random
    pool = [q for q in mcq.QUESTIONS if not subject or q["subject"] == subject]
    if mode == "mistakes":
        wrong = {r["ref"] for r in db.rows(db.user().execute("SELECT DISTINCT ref FROM attempts WHERE kind='mcq' AND correct=0 AND resolved=0"))}
        pool = [q for q in pool if q["id"] in wrong]
    elif mode == "new":
        done = {r["ref"] for r in db.rows(db.user().execute("SELECT DISTINCT ref FROM attempts WHERE kind='mcq'"))}
        pool = [q for q in pool if q["id"] not in done] or pool
    random.shuffle(pool)
    return [{k: q[k] for k in ("id", "subject", "q", "options")} for q in pool[:count]]


def mcq_stats():
    rows = db.rows(db.user().execute("SELECT subject, COUNT(*) n, SUM(correct) c, COUNT(DISTINCT ref) u FROM attempts WHERE kind='mcq' GROUP BY subject"))
    by = {r["subject"]: r for r in rows}
    return [{"id": k, "name": v, "total": sum(1 for q in mcq.QUESTIONS if q["subject"] == k), "answered": (by.get(k) or {}).get("u", 0),
             "accuracy": round(100.0 * by[k]["c"] / by[k]["n"]) if k in by and by[k]["n"] else None} for k, v in mcq.SUBJECTS.items()]


def sql_run(sql, cid=None):
    r = sqlbank.run(sql, cid)
    ch = sqlbank.BY_ID.get(cid or "")
    if ch and r.get("ok"):
        record("sql", cid, r.get("correct"), ch["title"], "databases", detail={"sql": sql[:2000]})
    elif ch:
        record("sql", cid, False, ch["title"], "databases", detail={"sql": sql[:2000], "error": r.get("error", "")})
    return r


def solved_set(kind):
    return {r["ref"] for r in db.rows(db.user().execute("SELECT DISTINCT ref FROM attempts WHERE kind=? AND correct=1", (kind,)))}


def debug_run(eid, code, run_code):
    e = debugbank.BY_ID.get(eid)
    if not e:
        return None
    r = run_code(e["lang"], code + "\n" + e["test"], timeout=10)
    ok = debugbank.PASS in (r.get("stdout") or "")
    record("debug", eid, ok, e["title"], e["topic"], detail={"stderr": (r.get("stderr") or "")[-500:]})
    r["passed"] = ok
    return r


# ------------------------------------------------------------------ bookmarks
def bookmarks(kind=None):
    if kind:
        return db.rows(db.user().execute("SELECT * FROM bookmarks WHERE kind=? ORDER BY created DESC", (kind,)))
    return db.rows(db.user().execute("SELECT * FROM bookmarks ORDER BY created DESC"))


def bookmark_toggle(kind, ref, title, href="", note=""):
    with db.WLOCK:
        u = db.user()
        r = u.execute("SELECT id FROM bookmarks WHERE kind=? AND ref=?", (kind, ref)).fetchone()
        if r:
            u.execute("DELETE FROM bookmarks WHERE id=?", (r["id"],))
            u.commit()
            return {"bookmarked": False}
        u.execute("INSERT INTO bookmarks(kind, ref, title, href, note, created) VALUES (?,?,?,?,?,?)", (kind, ref, title, href, note, time.time()))
        u.commit()
        return {"bookmarked": True}


# ------------------------------------------------------------------ mistakes & weak topics
KIND_LABEL = {"mcq": "MCQ", "sql": "SQL", "debug": "Debugging", "scenario": "Scenario", "code": "Coding", "plan": "DSA plan", "mock": "Mock answer", "project": "Project round"}


def _href(kind, ref, detail):
    return {"mcq": "#/mcq?retry=" + ref, "sql": "#/sql?id=" + ref, "debug": "#/debug?id=" + ref, "scenario": "#/scenarios",
            "code": "/index.html#/problem/" + ref, "plan": "/index.html#/plan", "mock": "#/mock?session=" + ref.split(":")[0],
            "project": "#/project"}.get(kind, "#/")


def mistakes(include_resolved=False, limit=300):
    where = "" if include_resolved else "AND resolved=0"
    rows = db.rows(db.user().execute(
        "SELECT kind, ref, MAX(title) title, MAX(subject) subject, COUNT(*) misses, MAX(ts) last, MIN(score) worst, MAX(detail) detail, MIN(resolved) resolved "
        "FROM attempts WHERE correct=0 %s GROUP BY kind, ref ORDER BY last DESC LIMIT ?" % where, (limit,)))
    for r in rows:
        r["label"] = KIND_LABEL.get(r["kind"], r["kind"])
        r["href"] = _href(r["kind"], r["ref"], r["detail"])
        r["subject_name"] = SUBJECT_NAMES.get(r["subject"], r["subject"])
        if r["kind"] == "mcq" and r["ref"] in mcq.BY_ID:
            q = mcq.BY_ID[r["ref"]]
            r["answer"] = q["options"][q["a"]]
            r["why"] = q["why"]
        r.pop("detail", None)
    return rows


def resolve(kind, ref):
    with db.WLOCK:
        db.user().execute("UPDATE attempts SET resolved=1 WHERE kind=? AND ref=?", (kind, ref))
        db.user().commit()
    return {"ok": True}


def subject_accuracy(days=90):
    since = time.time() - days * 86400
    rows = db.rows(db.user().execute("SELECT subject, kind, COUNT(*) n, SUM(correct) c, AVG(score) s FROM attempts WHERE ts>? AND subject!='' GROUP BY subject, kind", (since,)))
    by = {}
    for r in rows:
        b = by.setdefault(r["subject"], {"n": 0, "c": 0, "kinds": {}})
        b["n"] += r["n"]
        b["c"] += r["c"] or 0
        b["kinds"][r["kind"]] = {"n": r["n"], "acc": round(100.0 * (r["c"] or 0) / r["n"])}
    # mock scores per track feed their subject (score ≥ 6.5 counts as "correct")
    for m in db.rows(db.user().execute("SELECT track, score FROM mock_sessions WHERE started>? AND score IS NOT NULL", (since,))):
        sub = TRACK_SUBJECT.get(m["track"], m["track"])
        b = by.setdefault(sub, {"n": 0, "c": 0, "kinds": {}})
        k = b["kinds"].setdefault("mock", {"n": 0, "sum": 0.0})
        k["n"] += 1
        k["sum"] = k.get("sum", 0.0) + m["score"]
        b["n"] += 1
        b["c"] += 1 if m["score"] >= 6.5 else 0
    for sub, b in by.items():
        if "mock" in b["kinds"] and "sum" in b["kinds"]["mock"]:
            k = b["kinds"]["mock"]
            k["avg"] = round(k.pop("sum") / k["n"], 1)
        b["accuracy"] = round(100.0 * b["c"] / b["n"]) if b["n"] else None
        b["name"] = SUBJECT_NAMES.get(sub, sub)
    return by


def weak_topics(progress=None):
    """Subjects ranked by weakness, plus flashcard decks with many lapses and DSA plan problems you bombed."""
    acc = subject_accuracy()
    subjects = sorted([dict(v, id=k) for k, v in acc.items() if v["n"] >= 2], key=lambda x: (x["accuracy"] if x["accuracy"] is not None else 100))
    decks = db.rows(db.user().execute(
        "SELECT deck, COUNT(*) cards, SUM(lapses) lapses, ROUND(AVG(ease), 2) ease FROM cards WHERE reps > 0 GROUP BY deck HAVING SUM(lapses) > 0 ORDER BY SUM(lapses) * 1.0 / COUNT(*) DESC LIMIT 12"))
    plan = []
    for pid, e in ((progress or {}).get("plan") or {}).items():
        if isinstance(e, dict) and e.get("r") in ("bombed", "shaky"):
            plan.append({"id": pid, "rating": e["r"], "due": e.get("due")})
    lib = knowledge.library()
    titles = {r["id"]: r for r in lib.get("roadmap", [])}
    for p in plan:
        r = titles.get(p["id"]) or {}
        p["title"], p["group"], p["local"], p["lc"] = r.get("title", p["id"]), r.get("group", ""), r.get("local", ""), r.get("lc", "")
    plan.sort(key=lambda x: (x["rating"] != "bombed", x.get("due") or ""))
    # recommended topics for the weakest subjects
    subs = {s["id"]: s for s in learn_subjects()}
    for s in subjects[:5]:
        s["study"] = [dict(t) for t in (subs.get(s["id"]) or {}).get("topics", [])[:4]]
    return {"subjects": subjects, "decks": decks, "plan": plan}


# ------------------------------------------------------------------ analytics
def analytics(progress=None):
    u = db.user()
    now = time.time()
    # accuracy by kind (all time + last 30 days)
    kinds = []
    for r in db.rows(u.execute("SELECT kind, COUNT(*) n, SUM(correct) c, SUM(CASE WHEN ts>? THEN 1 ELSE 0 END) n30, "
                               "SUM(CASE WHEN ts>? THEN correct ELSE 0 END) c30 FROM attempts GROUP BY kind", (now - 30 * 86400, now - 30 * 86400))):
        kinds.append({"kind": r["kind"], "label": KIND_LABEL.get(r["kind"], r["kind"]), "n": r["n"], "accuracy": round(100.0 * (r["c"] or 0) / r["n"]),
                      "n30": r["n30"] or 0, "accuracy30": round(100.0 * (r["c30"] or 0) / r["n30"]) if r["n30"] else None})
    # weekly accuracy trend (12 weeks)
    trend = []
    for w in range(11, -1, -1):
        a, b = now - (w + 1) * 7 * 86400, now - w * 7 * 86400
        r = u.execute("SELECT COUNT(*) n, SUM(correct) c FROM attempts WHERE ts>? AND ts<=?", (a, b)).fetchone()
        m = u.execute("SELECT AVG(score) s, COUNT(*) n FROM mock_sessions WHERE started>? AND started<=? AND score IS NOT NULL", (a, b)).fetchone()
        rv = u.execute("SELECT COUNT(*) n, SUM(CASE WHEN grade>=3 THEN 1 ELSE 0 END) ok FROM reviews WHERE ts>? AND ts<=?", (a, b)).fetchone()
        trend.append({"week": time.strftime("%b %d", time.localtime(b)), "attempts": r["n"], "accuracy": round(100.0 * (r["c"] or 0) / r["n"]) if r["n"] else None,
                      "mock": round(m["s"], 1) if m["s"] is not None else None, "mocks": m["n"], "reviews": rv["n"],
                      "retention": round(100.0 * (rv["ok"] or 0) / rv["n"]) if rv["n"] else None})
    # flashcard retention
    rv = u.execute("SELECT COUNT(*) n, SUM(CASE WHEN grade>=3 THEN 1 ELSE 0 END) ok FROM reviews WHERE ts>?", (now - 30 * 86400,)).fetchone()
    cards = {"retention30": round(100.0 * (rv["ok"] or 0) / rv["n"]) if rv["n"] else None, "reviews30": rv["n"]}
    cards.update(dict(u.execute("SELECT COUNT(*) total, SUM(CASE WHEN interval>=21 THEN 1 ELSE 0 END) mature, SUM(CASE WHEN reps>0 THEN 1 ELSE 0 END) learned FROM cards").fetchone()))
    # mock history per track
    mocks = db.rows(u.execute("SELECT id, track, company, started, ended, score FROM mock_sessions ORDER BY started DESC LIMIT 200"))
    tracks = {}
    for m in reversed(mocks):
        if m["score"] is not None:
            tracks.setdefault(m["track"], []).append(m["score"])
    track_stats = [{"track": k, "name": bank.TRACKS.get(k, {}).get("name", k), "sessions": len(v), "avg": round(sum(v) / len(v), 1),
                    "last": v[-1], "best": max(v), "first": v[0]} for k, v in tracks.items()]
    # skills radar: per Learn subject → blend of topic completion, practice accuracy and mock score
    acc = subject_accuracy(365)
    done = set(((progress or {}).get("topics") or {}).keys())
    skills = []
    for s in learn_subjects():
        ids = [t["id"] for t in s["topics"]]
        cov = round(100.0 * len([i for i in ids if i in done]) / len(ids)) if ids else 0
        a = acc.get(s["id"]) or {}
        mock_avg = (a.get("kinds", {}).get("mock") or {}).get("avg")
        parts = [(cov, 0.4)]
        if a.get("accuracy") is not None:
            parts.append((a["accuracy"], 0.4))
        if mock_avg is not None:
            parts.append((mock_avg * 10, 0.2))
        wsum = sum(w for _, w in parts)
        skills.append({"id": s["id"], "name": s["name"], "icon": s["icon"], "topics": len(ids), "done": cov, "accuracy": a.get("accuracy"),
                       "attempts": a.get("n", 0), "mock": mock_avg, "score": round(sum(v * w for v, w in parts) / wsum)})
    # progress (library)
    lib = knowledge.library()
    all_topics = sum(len(s["topics"]) for s in lib["sections"])
    probs = (progress or {}).get("problems") or {}
    plan = (progress or {}).get("plan") or {}
    prog = {"topics_done": len(done), "topics_total": all_topics,
            "problems_solved": sum(1 for v in probs.values() if v == "solved"), "problems_total": len(lib["problems"]),
            "plan_attempted": len(plan), "plan_mastered": sum(1 for e in plan.values() if isinstance(e, dict) and e.get("got", 0) >= 2 and e.get("due") is None),
            "plan_total": len(lib.get("roadmap", [])),
            "mcq_answered": u.execute("SELECT COUNT(DISTINCT ref) n FROM attempts WHERE kind='mcq'").fetchone()["n"], "mcq_total": len(mcq.QUESTIONS),
            "sql_solved": len(solved_set("sql")), "sql_total": len(sqlbank.CHALLENGES),
            "debug_solved": len(solved_set("debug")), "debug_total": len(debugbank.EXERCISES),
            "scenarios_done": u.execute("SELECT COUNT(DISTINCT ref) n FROM attempts WHERE kind='scenario'").fetchone()["n"], "scenarios_total": len(scenarios.SCENARIOS)}
    activity = db.rows(u.execute("SELECT day, count, minutes FROM activity ORDER BY day DESC LIMIT 180"))
    interviews = db.rows(u.execute("SELECT * FROM interviews ORDER BY date DESC, created DESC"))
    return {"kinds": kinds, "trend": trend, "cards": cards, "mocks": mocks[:60], "tracks": track_stats, "skills": skills,
            "progress": prog, "activity": activity, "interviews": interviews,
            "totals": {"attempts": u.execute("SELECT COUNT(*) n FROM attempts").fetchone()["n"],
                       "minutes": round(sum(a["minutes"] or 0 for a in activity)), "days": len(activity)}}


# ------------------------------------------------------------------ real interview log
def interviews():
    return db.rows(db.user().execute("SELECT * FROM interviews ORDER BY date DESC, created DESC"))


def interview_save(b):
    f = {k: b.get(k, "") for k in ("company", "role", "round", "date", "outcome", "questions", "notes")}
    f["rating"] = int(b.get("rating") or 0)
    with db.WLOCK:
        u = db.user()
        if b.get("id"):
            u.execute("UPDATE interviews SET company=?, role=?, round=?, date=?, outcome=?, questions=?, notes=?, rating=? WHERE id=?",
                      (f["company"], f["role"], f["round"], f["date"], f["outcome"], f["questions"], f["notes"], f["rating"], int(b["id"])))
            iid = int(b["id"])
        else:
            iid = u.execute("INSERT INTO interviews(company, role, round, date, outcome, questions, notes, rating, created) VALUES (?,?,?,?,?,?,?,?,?)",
                            (f["company"], f["role"], f["round"], f["date"], f["outcome"], f["questions"], f["notes"], f["rating"], time.time())).lastrowid
        u.commit()
    # every question you were actually asked becomes practice material
    added = 0
    for line in (f["questions"] or "").splitlines():
        q = line.strip(" -•*\t")
        if len(q) > 12:
            try:
                with db.WLOCK:
                    db.user().execute("INSERT OR IGNORE INTO custom_questions(track, q, points, source, created) VALUES (?,?,?,?,?)",
                                      (_guess_track(q), q, "[]", "interview: %s %s" % (f["company"], f["round"]), time.time()))
                    db.user().commit()
                added += 1
            except Exception:
                pass
    return {"id": iid, "questions_added": added}


def _guess_track(q):
    ql = q.lower()
    if re.search(r"tell me about|time when|describe a situation|conflict|disagree|failure|proud", ql):
        return "behavioral"
    if re.search(r"design (a|an|the)|scale|architecture|system", ql):
        return "system-design"
    if re.search(r"kafka|spark|flink|pipeline|stream", ql):
        return "data-eng"
    if re.search(r"sql|index|database|transaction", ql):
        return "databases"
    if re.search(r"java|jvm|spring|thread", ql):
        return "java"
    return "dsa"


def interview_delete(iid):
    with db.WLOCK:
        db.user().execute("DELETE FROM interviews WHERE id=?", (iid,))
        db.user().commit()
    return {"ok": True}


# ------------------------------------------------------------------ roles
ROLES = [
    {"id": "backend-sde2", "name": "Backend Engineer (SDE 2)", "icon": "⚙️", "years": "2–5 yrs",
     "rounds": ["Online assessment / DSA (2 Medium in 60–90 min)", "DSA round ×1–2", "Low-level design / machine coding", "System design (HLD basics)", "Hiring manager + behavioral"],
     "focus": "Strong DSA (Mediums), clean LLD with patterns, one solid HLD, production experience stories.",
     "subjects": ["dsa", "java", "spring", "databases", "system-design", "microservices"],
     "tracks": ["patterns", "lld", "system-design", "java", "behavioral"],
     "topics": ["dsa-patterns", "lld-method", "lld-parking-lot", "lld-lru", "hld-framework", "hld-caching", "spring-transactions", "db-indexing", "java-concurrency"],
     "weeks": ["Weeks 1–3: DSA patterns (arrays → graphs), 3 problems/day", "Week 4: LLD — 6 classic designs + SOLID", "Week 5: HLD framework + 4 case studies", "Week 6: Java/Spring/DB deep dives + mocks"]},
    {"id": "senior-backend", "name": "Senior Backend Engineer", "icon": "🛠️", "years": "5–8 yrs",
     "rounds": ["DSA ×1–2 (Medium/Hard)", "System design ×1–2 (deep)", "LLD / code quality round", "Project deep dive", "Behavioral / leadership"],
     "focus": "System design depth (trade-offs, failure modes, numbers), owning production systems, mentoring.",
     "subjects": ["system-design", "microservices", "kafka", "databases", "kubernetes", "dsa"],
     "tracks": ["system-design", "distributed", "scenarios", "project", "behavioral"],
     "topics": ["hld-framework", "sd-numbers", "ds-replication", "ds-transactions", "ms-data", "kafka-eos-ops", "db-mvcc", "k8s-ops", "observability-sre"],
     "weeks": ["Week 1: DSA refresh — patterns drill + 15 Mediums", "Weeks 2–3: 10 HLD case studies with deep dives", "Week 4: distributed systems & data (replication, consistency, Kafka)", "Week 5: project round prep + scenarios + behavioral stories"]},
    {"id": "lead", "name": "Tech Lead / Staff Engineer", "icon": "🧑‍✈️", "years": "8+ yrs",
     "rounds": ["System design (ambiguous, org-scale)", "Architecture / technical strategy discussion", "Project & impact deep dive", "Leadership & people (mentoring, conflict, influence)", "Coding (often lighter)"],
     "focus": "Scope and influence: technical strategy, design reviews, trade-offs across teams, incidents, hiring, mentoring.",
     "subjects": ["leadership", "system-design", "microservices", "devops", "security"],
     "tracks": ["leadership", "architecture", "system-design", "scenarios", "project"],
     "topics": ["lead-role", "lead-design-docs", "lead-tech-debt", "lead-incidents", "lead-stakeholders", "arch-styles", "arch-api-evolution", "ms-migration", "lead-build-vs-buy"],
     "weeks": ["Week 1: leadership stories (8–10 STAR stories mapped to themes)", "Week 2: architecture & strategy (styles, migration, API evolution, build vs buy)", "Week 3: org-scale system design + scenarios", "Week 4: project deep dive + mock leadership rounds"]},
    {"id": "data-engineer", "name": "Data Engineer", "icon": "🌊", "years": "any",
     "rounds": ["SQL round (window functions, modeling)", "Coding (Python/Scala, DSA easy–medium)", "Data pipeline / system design", "Data modeling", "Behavioral"],
     "focus": "SQL fluency, streaming & batch (Kafka/Flink/Spark), modeling, data quality and pipeline design.",
     "subjects": ["databases", "kafka", "data-eng", "python", "system-design"],
     "tracks": ["data-eng", "databases", "python", "system-design", "behavioral"],
     "topics": ["sql-window", "de-modeling", "de-lakehouse", "kafka-architecture", "flink-time", "spark-tuning", "de-orchestration", "de-cdc"],
     "weeks": ["Week 1: SQL — all 22 SQL challenges + window functions", "Week 2: Kafka + Flink/Spark internals", "Week 3: modeling, lakehouse, orchestration, CDC", "Week 4: pipeline design mocks + Python DSA"]},
    {"id": "fullstack", "name": "Full-Stack Engineer", "icon": "🧩", "years": "any",
     "rounds": ["DSA", "Frontend (JS/React) deep dive", "Backend/API design", "System design (product-focused)", "Behavioral"],
     "focus": "JavaScript/React fundamentals, API design, web performance & security, product system design.",
     "subjects": ["dsa", "networking", "security", "system-design", "databases"],
     "tracks": ["frontend", "dsa", "system-design", "behavioral"],
     "topics": ["js-core", "react", "browser-rendering", "api-styles", "http-caching", "sec-owasp", "net-http", "hld-framework"],
     "weeks": ["Week 1–2: DSA patterns", "Week 3: JS/React/browser", "Week 4: APIs, HTTP, security", "Week 5: product system design + mocks"]},
    {"id": "sre-devops", "name": "SRE / DevOps / Platform", "icon": "🚀", "years": "any",
     "rounds": ["Linux & troubleshooting", "Networking", "Kubernetes & cloud", "System design for reliability", "Incident scenarios", "Coding (scripting)"],
     "focus": "Troubleshooting under pressure, Kubernetes, networking, observability, IaC and incident management.",
     "subjects": ["kubernetes", "devops", "networking", "cloud", "os"],
     "tracks": ["cloud", "scenarios", "cs", "system-design"],
     "topics": ["linux-troubleshooting", "net-debugging", "net-tcp", "k8s-ops", "observability-sre", "terraform", "cicd", "lead-incidents"],
     "weeks": ["Week 1: Linux + networking deep dive", "Week 2: Kubernetes & cloud", "Week 3: observability, SRE, IaC", "Week 4: scenario drills + reliability design"]},
    {"id": "ml-engineer", "name": "ML / GenAI Engineer", "icon": "🤖", "years": "any",
     "rounds": ["Coding (DSA + Python)", "ML fundamentals", "ML system design", "LLM / RAG design", "Behavioral"],
     "focus": "ML fundamentals, ML system design, LLM applications (RAG, evaluation), production ML.",
     "subjects": ["ml", "python", "dsa", "system-design"],
     "tracks": ["ml", "python", "dsa", "behavioral"],
     "topics": ["ml-fundamentals", "ml-system-design", "recsys", "llm-fundamentals", "rag", "llm-production", "py-concurrency"],
     "weeks": ["Week 1: ML fundamentals", "Week 2: ML system design + recsys", "Week 3: LLMs, RAG, evaluation", "Week 4: Python DSA + mocks"]},
]


def roles():
    lib = knowledge.library()
    tmap = {t["id"]: (s["id"], t["title"]) for s in lib["sections"] for t in s["topics"]}
    out = []
    for r in ROLES:
        rr = dict(r)
        rr["topics"] = [{"id": t, "section": tmap[t][0], "title": tmap[t][1]} for t in r["topics"] if t in tmap]
        rr["tracks"] = [{"id": t, "name": bank.TRACKS.get(t, {}).get("name", t), "icon": bank.TRACKS.get(t, {}).get("icon", "")} for t in r["tracks"]]
        rr["subjects"] = [{"id": s, "name": SUBJECT_NAMES.get(s, s)} for s in r["subjects"]]
        out.append(rr)
    return out


# ------------------------------------------------------------------ company question bank
def company_bank(company):
    """Library problems tagged with this company + its values + questions you mined/logged for it."""
    lib = knowledge.library()
    c = (company or "").strip().lower()
    probs = [p for p in lib["problems"] if any(c == x.lower() for x in p.get("companies") or [])] if c else []
    counts = {}
    for p in lib["problems"]:
        for x in p.get("companies") or []:
            counts[x] = counts.get(x, 0) + 1
    mined = db.rows(db.user().execute("SELECT id, track, q, source FROM custom_questions WHERE lower(source) LIKE ? ORDER BY created DESC LIMIT 200", ("%" + c + "%",))) if c else []
    logged = db.rows(db.user().execute("SELECT * FROM interviews WHERE lower(company)=? ORDER BY date DESC", (c,))) if c else []
    return {"company": company, "problems": [{k: p.get(k) for k in ("id", "title", "difficulty", "pattern", "lc")} for p in probs],
            "values": knowledge.company_values(company) if c else None, "mined": mined, "interviews": logged,
            "companies": sorted(counts.items(), key=lambda kv: -kv[1])}


# ------------------------------------------------------------------ resume
VERBS = r"\b(led|built|designed|architected|implemented|developed|reduced|increased|improved|migrated|launched|owned|scaled|optimi[sz]ed|automated|mentored|delivered|drove|created|shipped|cut|saved)\b"
WEAK = [r"\bresponsible for\b", r"\bworked on\b", r"\bhelped\b", r"\binvolved in\b", r"\bparticipated in\b", r"\bvarious\b", r"\betc\.?\b", r"\bteam player\b", r"\bhard[- ]working\b"]
SECTIONS = {"Summary": r"\b(summary|profile|objective|about me)\b", "Experience": r"\b(experience|employment|work history)\b", "Skills": r"\bskills\b",
            "Projects": r"\bprojects?\b", "Education": r"\b(education|b\.?tech|b\.?e\.?|m\.?tech|bachelor|master|university|college)\b",
            "Achievements": r"\b(achievements?|awards?|certifications?)\b"}


def resume_analyze(text, jd=""):
    text = (text or "").strip()
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    bullets = [l.strip(" •*-–·\t") for l in lines if re.match(r"^\s*([•*\-–·]|\d+\.)\s+", l) or (len(l.split()) >= 7 and re.search(VERBS, l, re.I))]
    quantified = [b for b in bullets if re.search(r"\d", b)]
    verb_led = [b for b in bullets if re.match(r"^\W*" + VERBS, b, re.I)]
    weak = [(b, [re.search(w, b, re.I).group(0) for w in WEAK if re.search(w, b, re.I)]) for b in bullets]
    weak = [{"bullet": b, "phrases": p} for b, p in weak if p]
    words = len(text.split())
    skills = knowledge.detect_skills(text)
    sections = {k: bool(re.search(v, text, re.I)) for k, v in SECTIONS.items()}
    links = {"github": bool(re.search(r"github\.com/", text, re.I)), "linkedin": bool(re.search(r"linkedin\.com/", text, re.I)),
             "email": bool(re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", text)), "phone": bool(re.search(r"\+?\d[\d\s-]{8,}\d", text))}
    tips = []
    if bullets and len(quantified) / len(bullets) < 0.5:
        tips.append("Only %d of %d bullets have numbers. Quantify impact: latency, throughput, cost, users, % improvement." % (len(quantified), len(bullets)))
    if bullets and len(verb_led) / len(bullets) < 0.6:
        tips.append("Start bullets with strong action verbs (Led, Designed, Reduced, Migrated…) — %d of %d do." % (len(verb_led), len(bullets)))
    if weak:
        tips.append("Replace weak phrases like “responsible for / worked on / helped” with what YOU did and the result (%d bullets)." % len(weak))
    if words > 900:
        tips.append("~%d words — aim for 1 page (≤ 600 words) under 8 years of experience, 2 pages max otherwise." % words)
    if words < 200:
        tips.append("Very short (%d words) — add projects and impact." % words)
    for k, v in sections.items():
        if not v and k in ("Experience", "Skills", "Education"):
            tips.append("No clear “%s” section found." % k)
    if not links["github"] and not links["linkedin"]:
        tips.append("Add LinkedIn and GitHub (or portfolio) links.")
    long_b = [b for b in bullets if len(b.split()) > 35]
    if long_b:
        tips.append("%d bullets are over 35 words — keep each to 1–2 lines." % len(long_b))
    score = 0
    score += 25 * (len(quantified) / len(bullets) if bullets else 0)
    score += 20 * (len(verb_led) / len(bullets) if bullets else 0)
    score += 15 * min(1, len(skills) / 10.0)
    score += 15 * (sum(sections[k] for k in ("Experience", "Skills", "Education", "Projects")) / 4.0)
    score += 10 * (1 if 250 <= words <= 900 else 0.5)
    score += 10 * (1 - min(1, len(weak) / max(1, len(bullets))))
    score += 5 * (1 if links["github"] or links["linkedin"] else 0)
    out = {"score": round(score), "words": words, "bullets": len(bullets), "quantified": len(quantified), "verb_led": len(verb_led),
           "weak": weak[:15], "skills": sorted(skills, key=lambda k: -skills[k]), "sections": sections, "links": links, "tips": tips}
    if jd.strip():
        jd_sk = knowledge.detect_skills(jd)
        out["jd"] = {"matched": sorted(k for k in jd_sk if k in skills), "missing": sorted(k for k in jd_sk if k not in skills),
                     "coverage": round(100.0 * len([k for k in jd_sk if k in skills]) / len(jd_sk)) if jd_sk else None}
    return out


def resume_questions(text):
    """Interview questions an interviewer would ask from THIS resume."""
    text = text or ""
    lines = [l.strip(" •*-–·\t") for l in text.splitlines() if len(l.split()) >= 6]
    qs = []
    for l in lines:
        if re.search(r"\d", l) and re.search(VERBS, l, re.I):
            qs.append({"q": "Walk me through this: “%s”. What was the baseline, what exactly did you do, and how did you measure the result?" % l[:220],
                       "kind": "Impact claim", "points": ["baseline and measurement", "your specific actions", "technical approach", "trade-offs", "result verification"]})
    for l in lines:
        if re.search(r"\b(led|mentored|owned|drove|architected)\b", l, re.I) and not re.search(r"\d", l):
            qs.append({"q": "You wrote “%s”. Tell me about a specific moment from that — what decision did you make and what happened?" % l[:200],
                       "kind": "Ownership / leadership", "points": ["specific situation", "your decision", "how you influenced others", "outcome"]})
    skills = knowledge.detect_skills(text)
    track_for = {"Java": "java", "Spring Boot": "java", "Python": "python", "Kafka": "data-eng", "Flink": "data-eng", "Spark": "data-eng", "SQL": "databases",
                 "PostgreSQL/MySQL": "databases", "NoSQL": "databases", "Redis/Caching": "system-design", "Microservices": "architecture",
                 "Distributed Systems": "distributed", "System Design": "system-design", "Kubernetes": "cloud", "Docker": "cloud", "AWS": "cloud",
                 "Concurrency": "java", "React": "frontend", "JavaScript/TypeScript": "frontend", "Machine Learning": "ml", "LLMs/GenAI": "ml",
                 "Leadership/Mentoring": "leadership", "Low-Level Design / OOP": "lld"}
    import random
    rnd = random.Random(len(text))
    for sk in sorted(skills, key=lambda k: -skills[k])[:10]:
        if sk in scenarios.TECH_PROBES:
            q, pts = scenarios.TECH_PROBES[sk]
            qs.append({"q": q.format(p="your work"), "kind": sk, "points": pts})
        tr = track_for.get(sk)
        pool = [x for x in bank.Q.get(tr, []) if re.search(re.escape(sk.split("/")[0].split(" ")[0]), x["q"], re.I)] or bank.Q.get(tr, [])
        for x in rnd.sample(pool, min(2, len(pool))):
            qs.append({"q": x["q"], "kind": sk, "points": x.get("points", [])})
    seen, out = set(), []
    for q in qs:
        if q["q"] not in seen:
            seen.add(q["q"])
            out.append(q)
    return {"questions": out[:40], "skills": sorted(skills, key=lambda k: -skills[k])}


# ------------------------------------------------------------------ daily drill
def _done_today(kind):
    start = time.mktime(time.strptime(time.strftime("%Y-%m-%d"), "%Y-%m-%d"))
    return {r["ref"]: r["c"] for r in db.rows(db.user().execute(
        "SELECT ref, MAX(correct) c FROM attempts WHERE kind=? AND ts>=? GROUP BY ref", (kind, start)))}


def today(progress=None):
    """A fresh ~30-minute drill every day, biased to your weakest subjects and things you haven't done.
    Picks are stable for the whole day (seeded by date) and tick off as you complete them."""
    import random
    day = time.strftime("%Y-%m-%d")
    rnd = random.Random(day)
    acc = subject_accuracy(30)
    seen_mcq = {r["ref"] for r in db.rows(db.user().execute("SELECT DISTINCT ref FROM attempts WHERE kind='mcq'"))}
    # weakest 2 subjects that have MCQs (unknown subjects count as weak so you explore them)
    subs = sorted(mcq.SUBJECTS, key=lambda s: ((acc.get(s) or {}).get("accuracy") if (acc.get(s) or {}).get("accuracy") is not None else 40, rnd.random()))
    focus = subs[:2]
    pool = [q for q in mcq.QUESTIONS if q["subject"] in focus]
    pool.sort(key=lambda q: (q["id"] in seen_mcq, rnd.random()))
    mcqs = pool[:6]
    sql_done, dbg_done = solved_set("sql"), solved_set("debug")
    sql_open = [c for c in sqlbank.CHALLENGES if c["id"] not in sql_done] or sqlbank.CHALLENGES
    dbg_open = [e for e in debugbank.EXERCISES if e["id"] not in dbg_done] or debugbank.EXERCISES
    sql_pick = sorted(sql_open, key=lambda c: (c["level"], rnd.random()))[0]
    dbg_pick = rnd.choice(sorted(dbg_open, key=lambda e: e["level"])[:6])
    scn_i = rnd.randrange(len(scenarios.SCENARIOS))
    td_mcq, td_sql, td_dbg, td_scn = _done_today("mcq"), _done_today("sql"), _done_today("debug"), _done_today("scenario")
    scn_ref = "scenarios:" + scenarios.SCENARIOS[scn_i]["q"][:120]
    from . import tools
    cs = tools.card_stats()
    open_mistakes = len(mistakes())
    plan_due = 0
    for e in ((progress or {}).get("plan") or {}).values():
        if isinstance(e, dict) and e.get("due") and e["due"] <= day:
            plan_due += 1
    items = [
        {"id": "mcq", "icon": "✅", "title": "6 quick MCQs — %s" % " & ".join(mcq.SUBJECTS[s] for s in focus), "mins": 5,
         "href": "#/mcq?ids=" + ",".join(q["id"] for q in mcqs), "done": all(q["id"] in td_mcq for q in mcqs),
         "progress": "%d/%d" % (sum(1 for q in mcqs if q["id"] in td_mcq), len(mcqs))},
        {"id": "sql", "icon": "🗄️", "title": "SQL: " + sql_pick["title"], "mins": 8, "href": "#/sql?id=" + sql_pick["id"], "done": bool(td_sql.get(sql_pick["id"]))},
        {"id": "debug", "icon": "🐞", "title": "Fix the bug: " + dbg_pick["title"], "mins": 8, "href": "#/debug?id=" + dbg_pick["id"], "done": bool(td_dbg.get(dbg_pick["id"]))},
        {"id": "scenario", "icon": "🚨", "title": "Scenario: " + scenarios.SCENARIOS[scn_i]["q"][:90] + "…", "mins": 6, "href": "#/scenarios?id=%d" % scn_i, "done": scn_ref in td_scn},
        {"id": "cards", "icon": "🃏", "title": "Review %d due flashcards" % cs["due"], "mins": max(2, cs["due"] // 6), "href": "#/cards?review=1", "done": cs["due"] == 0},
    ]
    if plan_due:
        items.append({"id": "plan", "icon": "🧩", "title": "Re-solve %d DSA plan problem%s due today" % (plan_due, "" if plan_due == 1 else "s"), "mins": 20 * min(plan_due, 2), "href": "#/revision", "done": False})
    if open_mistakes:
        items.append({"id": "mistakes", "icon": "❌", "title": ("Fix 3 of your %d open mistakes" % open_mistakes) if open_mistakes > 3 else "Fix your %d open mistake%s" % (open_mistakes, "" if open_mistakes == 1 else "s"), "mins": 6, "href": "#/revision?tab=mistakes", "done": False})
    return {"date": day, "focus": [{"id": s, "name": mcq.SUBJECTS[s]} for s in focus], "items": items,
            "done": sum(1 for i in items if i["done"]), "total": len(items), "minutes": sum(i["mins"] for i in items)}


# ------------------------------------------------------------------ role readiness
def role_readiness(progress=None):
    """0–100 readiness per role: the role's subjects' skill scores + its mock tracks' recent averages."""
    a = analytics(progress)
    skills = {s["id"]: s["score"] for s in a["skills"]}
    tracks = {t["track"]: t for t in a["tracks"]}
    out = {}
    for r in ROLES:
        subj = [skills.get(s, 0) for s in r["subjects"]]
        mk = [tracks[t]["last"] * 10 for t in r["tracks"] if t in tracks]
        parts = [(sum(subj) / len(subj), 0.65)] + ([(sum(mk) / len(mk), 0.35)] if mk else [])
        score = round(sum(v * w for v, w in parts) / sum(w for _, w in parts))
        gaps = sorted(r["subjects"], key=lambda s: skills.get(s, 0))[:2]
        untried = [t for t in r["tracks"] if t not in tracks]
        out[r["id"]] = {"score": score, "gaps": [{"id": g, "name": SUBJECT_NAMES.get(g, g), "score": skills.get(g, 0)} for g in gaps],
                        "untried_tracks": [{"id": t, "name": bank.TRACKS.get(t, {}).get("name", t)} for t in untried]}
    return out
