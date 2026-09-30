"""Autonomous web agents. None of them use Claude or any paid API.

research(query)      — plans sub-queries, meta-searches, reads the best pages, and builds a
                       structured, cited cheat-sheet (definition, how it works, trade-offs,
                       use-cases, pitfalls, interview Qs, code, further reading).
compare(a, b)        — side-by-side comparison report.
company(name, role)  — interview-intel dossier: process/rounds, asked questions, hot topics,
                       LeetCode problems mentioned, tips, values, news, sources.
mine(topic)          — harvests interview Q&A pairs from the web into your question bank.
digest(url)          — read any URL and turn it into summary + key points + flashcards.
"""
import re
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor

from . import db, knowledge, llm, net, nlp, reader, search

SKIP_READ = ("youtube.com", "youtu.be", "twitter.com", "x.com", "linkedin.com", "facebook.com", "instagram.com",
             "amazon.com", "amazon.in", "udemy.com", "coursera.org", "pinterest.com")

FACETS = [
    ("definition", "What it is", r"\b(is an?|refers to|is defined as|is the (process|practice|technique)|stands for)\b"),
    ("how", "How it works", r"\b(works by|when a|first,|then|step|process|algorithm|each (node|server|request|key)|is stored|is sent|mechanism)\b"),
    ("pros", "Advantages", r"\b(advantage|benefit|pros?\b|improves?|reduces?|faster|scalab|efficient|allows|enables|helps)\b"),
    ("cons", "Trade-offs & disadvantages", r"\b(disadvantage|drawback|downside|cons?\b|trade-?off|limitation|overhead|cost|complex|however|but)\b"),
    ("uses", "Real-world use", r"\b(used (in|by|for)|use cases?|for example|e\.g\.|such as|in production|companies like|netflix|amazon|google|uber|meta|cassandra|dynamo|kafka|redis)\b"),
    ("pitfalls", "Pitfalls & gotchas", r"\b(pitfall|mistake|avoid|gotcha|careful|beware|common error|anti-?pattern|don't|never)\b"),
]


def _pick_pages(results, k, per_domain=2):
    picked, per = [], Counter()
    for r in results:
        d = r["domain"]
        if any(s in d for s in SKIP_READ) or r["source"] in ("arxiv", "github", "hackernews") or d == "github.com":
            continue
        if per[d] >= per_domain:
            continue
        per[d] += 1
        picked.append(r)
        if len(picked) >= k:
            break
    return picked


def _read_many(job, pages, workers=5):
    docs = []

    def one(i_r):
        i, r = i_r
        if r.get("answer_id") and r["source"] in ("stackoverflow", "softwareengineering", "cs", "dba"):
            try:  # StackExchange API instead of scraping: question + accepted answer
                ans = search.se_answer(r["answer_id"], r["source"])
                if ans:
                    from .extract import extract as _ex
                    doc = _ex("<article><h1>%s</h1><p>%s</p>%s</article>" % (r["title"], r["snippet"], ans), r["url"])
                    doc["via"] = "stackexchange-api"
                    job.log("read [%d] %s accepted answer (%s chars via API)" % (i + 1, r["source"], doc["chars"]))
                    return i, r, doc
            except Exception:
                pass
        doc = reader.read(r["url"])
        if doc:
            job.log("read [%d] %s (%s chars via %s)" % (i + 1, r["domain"], doc["chars"], doc.get("via")))
        else:
            job.log("could not read %s — using snippet" % r["domain"])
        return i, r, doc

    with ThreadPoolExecutor(max_workers=workers) as ex:
        for i, r, doc in ex.map(one, list(enumerate(pages))):
            if doc:
                docs.append({"id": len(docs), "url": r["url"], "title": doc["title"] or r["title"], "domain": r["domain"],
                             "text": doc["text"][:60000], "blocks": doc["blocks"], "code": doc["code"], "snippet": r["snippet"]})
            elif r.get("snippet"):
                docs.append({"id": len(docs), "url": r["url"], "title": r["title"], "domain": r["domain"],
                             "text": r["snippet"], "blocks": [], "code": [], "snippet": r["snippet"]})
    return docs


def qa_pairs(blocks, limit=60):
    """Walk content blocks; a question-looking heading/paragraph followed by prose = a Q&A pair."""
    pairs, i = [], 0
    while i < len(blocks) and len(pairs) < limit:
        b = blocks[i]
        t = re.sub(r"^\s*(q(uestion)?\s*\d*[:.)-]|\d+[.)]\s*)", "", b["text"], flags=re.I).strip()
        is_q = (b["t"] in ("h", "p", "li") and 12 < len(t) < 220 and
                (t.endswith("?") or (b["t"] == "h" and nlp.IMPERATIVE.match(t))))
        if is_q:
            ans, j = [], i + 1
            while j < len(blocks) and len(ans) < 5:
                nb = blocks[j]
                if nb["t"] == "h" or (nb["text"].strip().endswith("?") and len(nb["text"]) < 220):
                    break
                if nb["t"] in ("p", "li") and len(nb["text"]) > 25:
                    ans.append(nb["text"])
                j += 1
            if ans:
                pairs.append({"q": t, "a": ans})
            i = j
        else:
            i += 1
    return pairs


def _cite(sent, docs):
    return {"text": sent["text"], "src": sent["doc"] + 1, "domain": docs[sent["doc"]]["domain"]}


def _facet_sections(docs, query, per=4):
    out = []
    used = set()
    for fid, label, pat in FACETS:
        rx = re.compile(pat, re.I)
        sub = []
        for d in docs:
            keep = "\n".join(s for s in nlp.sentences(d["text"]) if rx.search(s))
            if keep:
                sub.append({"id": d["id"], "text": keep})
        sents = nlp.summarize(sub, query, k=per + 3, max_per_doc=2)
        items = []
        for s in sents:
            key = s["text"][:80]
            if key in used:
                continue
            used.add(key)
            items.append(_cite(s, docs))
            if len(items) >= per:
                break
        if items:
            out.append({"id": fid, "title": label, "items": items})
    return out


def _further(results):
    buckets = {"videos": [], "repos": [], "discussions": [], "papers": [], "qa": []}
    for r in results:
        if "youtube.com" in r["domain"]:
            buckets["videos"].append(r)
        elif r["source"] == "github":
            buckets["repos"].append(r)
        elif r["source"] == "hackernews" or "reddit.com" in r["domain"]:
            buckets["discussions"].append(r)
        elif r["source"] == "arxiv":
            buckets["papers"].append(r)
        elif r["source"] in ("stackoverflow", "softwareengineering", "cs", "dba"):
            buckets["qa"].append(r)
    return {k: [{"title": x["title"], "url": x["url"], "snippet": x["snippet"][:200]} for x in v[:6]] for k, v in buckets.items() if v}


def _flashcards_from(query, definition, sections, qas):
    cards = []
    if definition:
        cards.append({"front": "What is %s?" % query, "back": definition})
    for sec in sections:
        if sec["id"] == "definition":
            continue
        q = {"how": "How does %s work?", "pros": "What are the advantages of %s?", "cons": "What are the trade-offs / disadvantages of %s?",
             "uses": "Where is %s used in practice?", "pitfalls": "Common pitfalls with %s?"}.get(sec["id"])
        if q:
            cards.append({"front": q % query, "back": "\n".join("• " + i["text"] for i in sec["items"][:4])})
    for p in qas[:8]:
        cards.append({"front": p["q"], "back": "\n".join(p["a"][:3])[:900]})
    return cards


def _llm_synthesis(job, query, points, mode="research"):
    if not llm.ready():
        return None
    job.log("local LLM detected — writing a synthesized answer")
    ctx = "\n".join("[%d] %s" % (p["src"], p["text"]) for p in points[:18])
    try:
        return llm.chat([
            {"role": "system", "content": "You are an expert software-engineering interview coach. Answer using ONLY the numbered notes; cite like [2]. Be crisp, structured, interview-ready."},
            {"role": "user", "content": "Topic: %s\n\nNotes:\n%s\n\nWrite: 1) a 2-sentence answer you'd say in an interview, 2) key points as bullets, 3) one likely follow-up question with a short answer." % (query, ctx)},
        ], max_tokens=700)
    except Exception as e:
        job.log("LLM synthesis skipped: %s" % e)
        return None


# ------------------------------------------------------------------ research
def research(job, query, depth="quick"):
    query = query.strip()
    deep = depth == "deep"
    ck = "research:%s:%s" % (query.lower(), depth)
    cached = db.result_get(ck, 24 * 3600)
    if cached:
        job.log("found a fresh report in cache (<24h)", 1.0)
        return cached
    m = re.match(r"^(.+?)\s+(?:vs\.?|versus|or|compared to|v/s)\s+(.+)$", query, re.I) or \
        re.match(r"^difference between (.+?) and (.+)$", query, re.I)
    if m and len(query) < 90:
        job.log("looks like a comparison — switching to compare mode")
        return compare(job, m.group(1).strip(" ?"), m.group(2).strip(" ?"))

    job.log("planning sub-queries", 0.05)
    subs = [query, query + " explained", query + " interview questions"]
    if deep:
        subs += [query + " trade-offs best practices", query + " in production at scale", query + " common mistakes"]
    all_results, seen = [], set()
    for i, sq in enumerate(subs):
        srcs = ["web"] + (["wikipedia", "stackoverflow", "hackernews", "github"] if i == 0 else [])
        if deep and i == 0:
            srcs += ["arxiv", "youtube", "softwareengineering"]
        job.log("searching: “%s” on %s" % (sq, ", ".join(srcs)), 0.05 + 0.25 * i / len(subs))
        res, errs = search.multi(sq, srcs, per=10, log=None)
        for r in res:
            if r["url"] not in seen:
                seen.add(r["url"])
                r["q"] = sq
                all_results.append(r)
    all_results.sort(key=lambda r: -r["rrf"])
    job.log("%d unique results across the web" % len(all_results), 0.32)
    pages = _pick_pages(all_results, 12 if deep else 7)
    job.log("reading %d best pages in parallel" % len(pages), 0.35)
    docs = _read_many(job, pages)
    if not docs:
        raise RuntimeError("no readable sources found — check your internet connection")

    job.log("extracting a definition", 0.7)
    definition, wiki = "", None
    wres = [r for r in all_results if r["source"] == "wikipedia"]
    if wres:
        wiki = search.wiki_summary(wres[0]["title"])
        qt = set(nlp.tokens(query))
        if wiki and qt & set(nlp.tokens(wiki["title"] + " " + wiki["extract"][:200])):
            definition = wiki["extract"]
    job.log("ranking %d sentences (TF-IDF relevance × centrality, MMR diversity)" % sum(len(nlp.sentences(d["text"])) for d in docs), 0.75)
    key = [_cite(s, docs) for s in nlp.summarize(docs, query, k=14 if deep else 10)]
    if not definition and key:
        qwords = [w for w in re.findall(r"[a-z0-9+#]+", query.lower()) if w not in nlp.STOP]
        defs = [k for k in key if re.search(r"\b(is an?|refers to|is defined as|stands for|is the)\b", k["text"]) and
                any(w in k["text"].lower()[:80] for w in qwords)]
        definition = (defs or key)[0]["text"]
    sections = _facet_sections(docs, query, per=5 if deep else 3)
    job.log("mining interview questions & Q/A pairs", 0.85)
    qas = []
    for d in docs:
        for p in qa_pairs(d["blocks"]):
            p["src"] = d["id"] + 1
            qas.append(p)
    qtoks = set(nlp.tokens(query))
    qas.sort(key=lambda p: -len(qtoks & set(nlp.tokens(p["q"]))))
    questions = []
    seenq = set()
    for d in docs:
        for q in nlp.mine_questions(d["text"], query, 30):
            k = " ".join(sorted(set(nlp.tokens(q))))
            if k not in seenq:
                seenq.add(k)
                questions.append(q)
    for r in all_results:
        if r["source"] == "stackoverflow" and r["title"].endswith("?"):
            questions.append(r["title"])
    questions.sort(key=lambda q: -len(qtoks & set(nlp.tokens(q))))
    code = []
    for d in docs:
        for c in d["code"][:2]:
            if 40 < len(c) < 2500:
                code.append({"src": d["id"] + 1, "code": c})
    related = [p for p in nlp.keyphrases("\n".join(d["text"] for d in docs), 24)
               if not set(nlp.tokens(p)) <= qtoks][:14]
    report = {
        "type": "research", "query": query, "depth": depth, "created": time.time(),
        "definition": definition, "wiki": wiki,
        "key_points": key, "sections": sections,
        "qa": qas[:15], "questions": questions[:25], "code": code[:5], "related": related,
        "further": _further(all_results),
        "sources": [{"n": d["id"] + 1, "title": d["title"], "url": d["url"], "domain": d["domain"]} for d in docs],
        "local_topics": knowledge.local_topic_hits(query),
    }
    report["flashcards"] = _flashcards_from(query, definition, sections, qas)
    report["llm_answer"] = _llm_synthesis(job, query, key)
    db.result_set(ck, report)
    job.log("done — %d sources, %d key points, %d questions" % (len(docs), len(key), len(report["questions"])), 1.0)
    return report


# ------------------------------------------------------------------ compare
def compare(job, a, b):
    q = "%s vs %s" % (a, b)
    job.log("searching comparisons of %s and %s" % (a, b), 0.1)
    results, seen = [], set()
    for sq, srcs in ((q, ["web", "stackoverflow", "hackernews"]), ("difference between %s and %s" % (a, b), ["web"]),
                     (a, ["wikipedia"]), (b, ["wikipedia"])):
        res, _ = search.multi(sq, srcs, per=10)
        for r in res:
            if r["url"] not in seen:
                seen.add(r["url"])
                results.append(r)
    results.sort(key=lambda r: -r["rrf"])
    pages = _pick_pages(results, 8)
    job.log("reading %d comparison pages" % len(pages), 0.35)
    docs = _read_many(job, pages)
    at, bt = set(nlp.tokens(a)), set(nlp.tokens(b))
    only_a, only_b, both = [], [], []
    for d in docs:
        for s in nlp.sentences(d["text"]):
            st = set(nlp.tokens(s))
            ha, hb = bool(at & st) if at else False, bool(bt & st) if bt else False
            if ha and hb:
                both.append(s)
            elif ha:
                only_a.append(s)
            elif hb:
                only_b.append(s)
    job.log("ranking differences", 0.75)

    def top(lst, qq, k):
        return [s["text"] for s in nlp.summarize([{"id": 0, "text": "\n".join(lst)}], qq, k=k, max_per_doc=k)]

    diff = [s for s in top(both, q + " difference whereas while unlike faster better", 10)]
    report = {
        "type": "compare", "query": q, "a": a, "b": b, "created": time.time(),
        "a_def": (search.wiki_summary(a) or {}).get("extract", ""), "b_def": (search.wiki_summary(b) or {}).get("extract", ""),
        "differences": diff, "a_points": top(only_a, a, 7), "b_points": top(only_b, b, 7),
        "when_a": [s for s in only_a + both if re.search(r"\b(use|choose|prefer|better|ideal|suited|when)\b", s, re.I) and at & set(nlp.tokens(s))][:4],
        "when_b": [s for s in only_b + both if re.search(r"\b(use|choose|prefer|better|ideal|suited|when)\b", s, re.I) and bt & set(nlp.tokens(s))][:4],
        "questions": [x for d in docs for x in nlp.mine_questions(d["text"], q, 8)][:12],
        "sources": [{"n": d["id"] + 1, "title": d["title"], "url": d["url"], "domain": d["domain"]} for d in docs],
        "further": _further(results),
    }
    report["flashcards"] = [{"front": "%s vs %s — key differences?" % (a, b), "back": "\n".join("• " + x for x in diff[:5])}]
    job.log("done", 1.0)
    return report


# ------------------------------------------------------------------ company intel
ROUND_PATTERNS = [
    ("Online assessment / OA", r"\b(online assessment|\bOA\b|hackerrank|codility|coding test|codesignal)"),
    ("Recruiter / HR screen", r"\b(recruiter (call|screen)|hr (round|screen|call))"),
    ("Phone / technical screen", r"\b(phone screen|technical screen|telephonic|phone interview|screening round)"),
    ("DSA / coding rounds", r"\b(coding round|dsa round|data structures? (and|&) algorithms? round|leetcode (easy|medium|hard))"),
    ("System design (HLD)", r"\b(system design|hld|high[- ]level design)"),
    ("Low-level design / OOD", r"\b(lld|low[- ]level design|object[- ]oriented design|machine coding)"),
    ("Behavioral / culture fit", r"\b(behaviou?ral|leadership principles?|culture fit|values round|googleyness|star format)"),
    ("Hiring manager round", r"\b(hiring manager|hm round|managerial round)"),
    ("Bar raiser", r"\bbar[- ]raiser"),
    ("Team matching", r"\bteam match"),
]
TIP_RX = re.compile(r"\b(tip|advice|recommend|make sure|focus on|prepare|practice|don't forget|be ready|i suggest|key is|helped me)\b", re.I)


def company(job, name, role="Software Engineer"):
    name, role = name.strip(), (role or "Software Engineer").strip()
    ck = "company:%s:%s" % (name.lower(), role.lower())
    cached = db.result_get(ck, 24 * 3600)
    if cached:
        job.log("found fresh dossier in cache", 1.0)
        return cached
    plan = [
        ("%s %s interview experience" % (name, role), ["web", "hackernews"]),
        ("%s %s interview questions" % (name, role), ["web"]),
        ("%s interview process rounds %s" % (name, role), ["web"]),
        ("%s interview experience" % name, ["reddit", "leetcode"]),
        ("%s system design interview" % name, ["web"]),
        ("%s engineering blog" % name, ["web"]),
        ("%s company values culture principles" % name, ["web"]),
        (name + " company", ["wikipedia"]),
    ]
    results, seen = [], set()
    for i, (q, srcs) in enumerate(plan):
        job.log("searching: “%s”" % q, 0.03 + 0.3 * i / len(plan))
        try:
            res, _ = search.multi(q, srcs, per=10)
        except Exception as e:
            job.log("  failed: %s" % e)
            continue
        for r in res:
            if r["url"] not in seen:
                seen.add(r["url"])
                r["q"] = q
                results.append(r)
    exp = [r for r in results if re.search(r"(interview|experience|question|round|process|onsite|loop)", r["title"] + r["url"], re.I)]
    exp.sort(key=lambda r: -r["rrf"])
    pages = _pick_pages(exp, 10, per_domain=3)
    job.log("reading %d interview-experience pages" % len(pages), 0.4)
    docs = _read_many(job, pages)
    corpus = "\n".join(d["text"] for d in docs) + "\n" + "\n".join(r["snippet"] for r in results)
    job.log("analysing rounds, topics, problems and tips", 0.75)
    rounds = []
    for label, pat in ROUND_PATTERNS:
        n = len(re.findall(pat, corpus, re.I))
        if n:
            rounds.append({"round": label, "mentions": n})
    rounds.sort(key=lambda r: -r["mentions"])
    topics = knowledge.topic_mentions(corpus)
    problems = knowledge.problem_mentions(corpus)
    questions, seenq = [], set()
    for d in docs:
        for q in nlp.mine_questions(d["text"], role, 40):
            k = " ".join(sorted(set(nlp.tokens(q))))
            if k and k not in seenq and not re.search(r"\b(you|your) (think|guys|recommend)\b", q, re.I):
                seenq.add(k)
                questions.append({"q": q, "src": d["id"] + 1})
    tips = []
    for s in nlp.summarize([{"id": d["id"], "text": "\n".join(x for x in nlp.sentences(d["text"]) if TIP_RX.search(x))} for d in docs],
                           "interview preparation tips advice focus", k=10, max_per_doc=3):
        tips.append(_cite(s, docs))
    overview = [_cite(s, docs) for s in nlp.summarize(docs, "%s %s interview process rounds" % (name, role), k=8)]
    wiki_r = [r for r in results if r["source"] == "wikipedia"]
    wiki = search.wiki_summary(wiki_r[0]["title"]) if wiki_r else None
    values = knowledge.company_values(name)
    blog = [{"title": r["title"], "url": r["url"]} for r in results if "engineering blog" in r.get("q", "") or re.search(r"(engineering|tech)\b.*blog|blog.*engineering", r["title"], re.I)][:6]
    dossier = {
        "type": "company", "company": name, "role": role, "created": time.time(),
        "about": wiki, "values": values, "rounds": rounds, "overview": overview, "tips": tips,
        "topics": topics[:20], "problems": problems[:30], "questions": questions[:40],
        "engineering_blog": blog,
        "experiences": [{"title": r["title"], "url": r["url"], "domain": r["domain"], "snippet": r["snippet"][:240]} for r in exp[:25]],
        "discussions": [{"title": r["title"], "url": r["url"]} for r in results if r["source"] in ("hackernews", "reddit")][:10],
        "sources": [{"n": d["id"] + 1, "title": d["title"], "url": d["url"], "domain": d["domain"]} for d in docs],
    }
    if llm.ready():
        try:
            job.log("local LLM: drafting a prep strategy")
            dossier["llm_plan"] = llm.chat([{"role": "user", "content":
                "Company: %s, role: %s. Rounds seen: %s. Hot topics: %s. Write a focused 7-day prep strategy as bullets." %
                (name, role, ", ".join(r["round"] for r in rounds[:6]), ", ".join(t["topic"] for t in topics[:10]))}], max_tokens=500)
        except Exception:
            pass
    db.result_set(ck, dossier)
    job.log("dossier ready — %d sources, %d questions, %d problems" % (len(docs), len(questions), len(problems)), 1.0)
    return dossier


# ------------------------------------------------------------------ question miner
def mine(job, topic, track="", save=True, limit=40):
    job.log("hunting for interview Q&A on “%s”" % topic, 0.05)
    results, seen = [], set()
    for q, srcs in ((topic + " interview questions and answers", ["web", "gfg"]),
                    ("top " + topic + " interview questions", ["web"]),
                    (topic + " interview", ["stackoverflow", "softwareengineering"])):
        res, _ = search.multi(q, srcs, per=10)
        for r in res:
            if r["url"] not in seen:
                seen.add(r["url"])
                results.append(r)
    results.sort(key=lambda r: -r["rrf"])
    pages = _pick_pages(results, 8, per_domain=2)
    job.log("reading %d question pages" % len(pages), 0.3)
    docs = _read_many(job, pages)
    pairs, seenk = [], set()
    tt = set(nlp.tokens(topic))
    for d in docs:
        for p in qa_pairs(d["blocks"], 120):
            k = " ".join(sorted(set(nlp.tokens(p["q"]))))
            if not k or k in seenk:
                continue
            seenk.add(k)
            pts = [s["text"] for s in nlp.summarize([{"id": 0, "text": "\n".join(p["a"])}], p["q"], k=4, max_per_doc=4)] or p["a"][:3]
            pairs.append({"q": p["q"], "answer": " ".join(p["a"])[:1500], "points": pts, "src": d["url"],
                          "rel": len(tt & set(nlp.tokens(p["q"] + " " + " ".join(p["a"][:2]))))})
    pairs.sort(key=lambda p: -p["rel"])
    pairs = pairs[:limit]
    added = 0
    if save and track:
        for p in pairs:
            try:
                db.user().execute("INSERT INTO custom_questions(track, q, points, source, created) VALUES (?,?,?,?,?)",
                                  (track, p["q"], __import__("json").dumps(p["points"]), p["src"], time.time()))
                added += 1
            except Exception:
                pass
        db.user().commit()
    job.log("mined %d Q&A pairs (%d new added to track “%s”)" % (len(pairs), added, track or "-"), 1.0)
    return {"type": "mine", "topic": topic, "track": track, "pairs": pairs, "added": added,
            "sources": [{"n": d["id"] + 1, "title": d["title"], "url": d["url"], "domain": d["domain"]} for d in docs]}


# ------------------------------------------------------------------ digest any URL
def digest(job, url):
    job.log("reading " + url, 0.1)
    doc = reader.read(url, log=job.log)
    if not doc:
        raise RuntimeError("could not read that page (blocked or empty)")
    job.log("read %d chars via %s; summarising" % (doc["chars"], doc.get("via")), 0.5)
    d = [{"id": 0, "text": doc["text"]}]
    title = doc["title"] or url
    points = [s["text"] for s in nlp.summarize(d, title, k=12, max_per_doc=12)]
    outline = [b["text"] for b in doc["blocks"] if b["t"] == "h"][:30]
    qas = qa_pairs(doc["blocks"])
    cards = [{"front": p["q"], "back": "\n".join(p["a"][:3])[:900]} for p in qas[:15]]
    if not cards:
        cards = [{"front": "%s — key point %d" % (title[:60], i + 1), "back": p} for i, p in enumerate(points[:6])]
    job.log("done", 1.0)
    return {"type": "digest", "url": url, "title": title, "site": doc.get("site") or net.domain(url), "via": doc.get("via"),
            "description": doc.get("description", ""), "outline": outline, "key_points": points,
            "questions": nlp.mine_questions(doc["text"], title, 25), "qa": qas[:20], "code": doc["code"][:6],
            "keyphrases": nlp.keyphrases(doc["text"], 15), "flashcards": cards, "chars": doc["chars"],
            "reading_minutes": round(len(doc["text"].split()) / 230, 1)}


# ------------------------------------------------------------------ quick answer (sync, for the omnibox)
def quick(query):
    """Fast, synchronous: local hits + Wikipedia summary + top web results (no page reads)."""
    out = {"query": query, "local": knowledge.local_topic_hits(query), "wiki": None, "web": [], "so": []}
    try:
        res, _ = search.multi(query, ["web", "wikipedia", "stackoverflow"], per=8)
        out["web"] = [r for r in res if r["source"] == "web"][:8]
        out["so"] = [r for r in res if r["source"] == "stackoverflow"][:4]
        w = [r for r in res if r["source"] == "wikipedia"]
        if w:
            out["wiki"] = search.wiki_summary(w[0]["title"])
    except Exception as e:
        out["error"] = str(e)
    return out
