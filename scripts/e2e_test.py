#!/usr/bin/env python3
"""End-to-end test of every Interview OS feature over HTTP.

    BASE=http://localhost:8791 IOS_TEST_PASSWORD=... python3 scripts/e2e_test.py [--skip-web]

Uses its own cookie jar; creates and then deletes its own test records. --skip-web skips the
agents that need internet (research, company, mine, digest, web search, feeds).
"""
import http.cookiejar
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = os.environ.get("BASE", "http://localhost:8791").rstrip("/")
PW = os.environ.get("IOS_TEST_PASSWORD", "")
SKIP_WEB = "--skip-web" in sys.argv

jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


raw = urllib.request.build_opener(NoRedirect, urllib.request.HTTPCookieProcessor(jar))
results = []


def req(method, path, body=None, form=None, follow=True, timeout=120):
    data, headers = None, {}
    if body is not None:
        data, headers = json.dumps(body).encode(), {"Content-Type": "application/json"}
    if form is not None:
        data, headers = urllib.parse.urlencode(form).encode(), {"Content-Type": "application/x-www-form-urlencoded"}
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        resp = (opener if follow else raw).open(r, timeout=timeout)
        return resp.status, resp.headers, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.headers, e.read()


def api(method, path, body=None, timeout=120):
    st, _, b = req(method, "/api" + path, body=body, timeout=timeout)
    try:
        return st, json.loads(b.decode() or "{}")
    except Exception:
        return st, {"_raw": b[:200]}


def check(name, cond, detail=""):
    results.append((bool(cond), name, detail))
    print(("  PASS " if cond else "  FAIL ") + name + (("  — " + str(detail)[:160]) if detail and not cond else ""))
    return cond


def job(kind, params, timeout=240):
    st, j = api("POST", "/agent/" + kind, params)
    if st != 200:
        return None, "start failed %s %s" % (st, j)
    jid, t0 = j["job"], time.time()
    while time.time() - t0 < timeout:
        st, v = api("GET", "/jobs/" + jid)
        if v.get("status") in ("done", "error"):
            return v, v.get("error")
        time.sleep(1.5)
    return None, "timeout"


def main():
    print("Interview OS E2E →", BASE)
    # ---------------------------------------------------------------- auth
    print("\n[auth]")
    st, _, _ = req("GET", "/api/health")
    check("health is public", st == 200)
    st, j = api("GET", "/health")
    auth_on = bool(j.get("auth"))
    print("  info: auth enabled =", auth_on, "| version =", j.get("version"))
    if auth_on:
        st, h, _ = req("GET", "/os/", follow=False)
        check("unauthenticated page → login redirect", st == 302 and "/login" in (h.get("Location") or ""))
        st, _ = api("GET", "/dashboard")
        check("unauthenticated API → 401", st == 401)
        st, _, b = req("GET", "/login")
        check("login page renders", st == 200 and b"name=\"password\"" in b)
        st, h, _ = req("POST", "/api/login", form={"password": "definitely-wrong", "next": "/os/"}, follow=False)
        check("wrong password rejected", st == 302 and "e=" in (h.get("Location") or ""))
        st, h, _ = req("POST", "/api/login", form={"password": PW, "next": "/os/#/cards"}, follow=False)
        check("correct password → session cookie", st == 302 and "ios_session" in (h.get("Set-Cookie") or ""), h.get("Location"))
        st, h, _ = req("POST", "/api/login", form={"password": PW, "next": "//evil.com"}, follow=False)
        check("open redirect blocked", st == 302 and not (h.get("Location") or "").startswith("//"))
    # ---------------------------------------------------------------- static
    print("\n[static files]")
    st, _, b = req("GET", "/os/")
    check("Interview OS page", st == 200 and b"Interview OS" in b)
    st, _, b = req("GET", "/index.html")
    check("Prep Hub library page", st == 200)
    scripts = re.findall(rb'src="([^"]+\.js)"', b)
    bad = [s.decode() for s in scripts if req("GET", "/" + s.decode())[0] != 200]
    check("all %d library scripts load" % len(scripts), not bad, bad)
    st, _, b = req("GET", "/os/")
    os_assets = re.findall(rb'(?:src|href)="((?:js/)?[^"]+\.(?:js|css))"', b)
    bad = [a.decode() for a in os_assets if req("GET", "/os/" + a.decode())[0] != 200]
    check("all %d Interview OS assets load" % len(os_assets), not bad, bad)
    for p in ("/private/progress.json", "/os-data/user.db", "/interview_os/db.py", "/.git/config", "/server.py", "/Dockerfile", "/render.yaml", "/scripts/e2e_test.py", "/README.md"):
        st, _, _ = req("GET", p)
        check("blocked: " + p, st in (403, 404))
    # ---------------------------------------------------------------- core APIs
    print("\n[core APIs]")
    st, j = api("GET", "/status")
    check("status", st == 200 and "runner" in j, j)
    langs = j.get("runner", {})
    st, j = api("GET", "/library")
    check("library has sections & problems", st == 200 and len(j.get("sections", [])) >= 15 and len(j.get("problems", [])) >= 100, (len(j.get("sections", [])), len(j.get("problems", []))))
    st, j = api("GET", "/dashboard")
    check("dashboard", st == 200 and "cards" in j and "streak" in j)
    st, j = api("POST", "/activity", {"minutes": 1})
    check("activity bump", st == 200)
    st, j = api("GET", "/local?q=kafka%20consumer")
    check("local library search", st == 200 and j.get("library"), j)
    # ---------------------------------------------------------------- notes
    print("\n[notebook]")
    st, j = api("POST", "/notes", {"title": "E2E note zebrafish", "body": "- watermarks handle late events\n- checkpoints"})
    nid = j.get("id")
    check("create note", st == 200 and nid)
    st, j = api("GET", "/notes?q=zebrafish")
    check("full-text search finds note", any(n["id"] == nid for n in j.get("notes", [])))
    st, j = api("PUT", "/notes/%s" % nid, {"body": "updated body", "pinned": 1})
    st, j = api("GET", "/notes/%s" % nid)
    check("update + read note", j.get("body") == "updated body" and j.get("pinned") == 1)
    st, j = api("DELETE", "/notes/%s" % nid)
    st, j = api("GET", "/notes/%s" % nid)
    check("delete note", st == 404)
    # ---------------------------------------------------------------- flashcards
    print("\n[flashcards]")
    st, j = api("GET", "/cards/stats")
    check("card stats", st == 200 and j.get("total", 0) > 1000, j.get("total"))
    st, j = api("GET", "/cards/due?limit=5")
    check("due cards (daily new-card cap)", st == 200 and 0 < len(j.get("cards", [])) <= 5)
    st, j = api("POST", "/cards", {"cards": [{"front": "E2E front", "back": "E2E back"}], "deck": "E2E deck"})
    check("add card", st == 200 and j.get("added") == 1)
    cid = j.get("ids", [None])[0]
    st, j = api("POST", "/cards/%s/review" % cid, {"grade": 2})
    check("review card (SM-2)", st == 200 and j.get("interval_days", 0) >= 1, j)
    st, j = api("PUT", "/cards/%s" % cid, {"back": "edited"})
    st, j = api("GET", "/cards?deck=E2E%20deck")
    check("edit + list card", any(c["back"] == "edited" for c in j.get("cards", [])))
    st, j = api("DELETE", "/cards/%s" % cid)
    check("delete card", st == 200)
    st, j = api("POST", "/cards/seed")
    check("sync library (idempotent)", st == 200 and j.get("added") == 0, j)
    # ---------------------------------------------------------------- mock interviews
    print("\n[mock interviews]")
    st, j = api("GET", "/mock/tracks")
    tracks = [t["id"] for t in j.get("tracks", [])]
    check("tracks listed (15)", len(tracks) >= 15, tracks)
    bad = []
    for t in tracks:
        st, s = api("POST", "/mock/session", {"track": t, "count": 3})
        if st != 200 or not s.get("questions"):
            bad.append(t)
    check("session builds for every track", not bad, bad)
    st, s = api("POST", "/mock/session", {"track": "behavioral", "count": 2, "company": "Amazon"})
    check("company-tailored behavioral session", s.get("values") and s["values"]["title"] == "Leadership Principles")
    q = s["questions"][1]
    ans = ("When I was at my previous company our pipeline latency was 40 seconds. My goal was to cut it below 5 seconds. "
           "I analyzed the job, I proposed unaligned checkpoints and I implemented partition changes. As a result latency dropped 90% and cost fell 30%.")
    st, e = api("POST", "/mock/evaluate", {"track": "behavioral", "question": q, "answer": ans, "seconds": 90})
    check("grade behavioral answer (STAR)", st == 200 and all(e.get("star", {}).values()) and 0 <= e.get("score", -1) <= 10, e.get("star"))
    st, e2 = api("POST", "/mock/evaluate", {"track": "system-design", "question": {"q": "Design a URL shortener", "points": ["cache hot codes in Redis"]}, "answer": "We need requirements, 100M DAU, QPS, API POST /urls, cache in redis, database shard by key, trade-off between consistency and latency.", "seconds": 300})
    check("grade system-design answer", st == 200 and "phases" in e2)
    st, sv = api("POST", "/mock/save", {"track": "behavioral", "company": "E2E", "started": time.time() - 120, "ended": time.time(), "answers": [{"q": q["q"], "answer": ans, "eval": e}]})
    check("save session", st == 200 and sv.get("id"))
    st, g = api("GET", "/mock/%s" % sv.get("id"))
    check("load past session", st == 200 and g.get("data", {}).get("answers"))
    # ---------------------------------------------------------------- question bank
    print("\n[question bank]")
    st, j = api("GET", "/questions")
    check("question bank", st == 200 and len(j.get("questions", [])) >= 140, len(j.get("questions", [])))
    st, j = api("POST", "/questions", {"track": "java", "q": "E2E: what is a record?", "points": ["immutable data carrier"]})
    st, j = api("GET", "/questions?track=java")
    mine = [x for x in j.get("questions", []) if x["q"].startswith("E2E:")]
    check("add custom question", mine)
    if mine:
        st, _ = api("DELETE", "/questions/%s" % mine[0]["id"])
        check("delete custom question", st == 200)
    # ---------------------------------------------------------------- stories, pipeline, jd, plan
    print("\n[stories · applications · JD · plan]")
    st, j = api("POST", "/stories", {"title": "E2E story", "situation": "At my previous company the pipeline was slow", "task": "My goal was to cut latency", "action": "I designed a Flink job", "result": "As a result latency dropped 80%", "themes": "impact,dive-deep"})
    sid = j.get("id")
    st, sc = api("POST", "/stories/score", {"situation": "At my previous company", "task": "My goal was", "action": "I built", "result": "As a result it improved 50%"})
    check("create + score story", sid and sc.get("star", {}).get("Result"))
    api("DELETE", "/stories/%s" % sid)
    st, j = api("POST", "/companies", {"name": "E2E Corp", "role": "SDE2", "stage": "Applied", "next_date": "2030-01-01"})
    cid = j.get("id")
    st, j = api("POST", "/companies", {"id": cid, "name": "E2E Corp", "role": "SDE2", "stage": "Onsite"})
    st, j = api("GET", "/companies")
    check("application create + move stage", any(c["id"] == cid and c["stage"] == "Onsite" for c in j.get("companies", [])))
    api("DELETE", "/companies/%s" % cid)
    st, j = api("POST", "/jd", {"jd": "Senior Data Engineer\nRequirements:\n- Kafka, Flink, Java, AWS, Kubernetes\n- mentoring", "resume": "Java Kafka Flink engineer"})
    check("JD matcher", st == 200 and j.get("match") is not None and j.get("skills"), j.get("match"))
    st, j = api("POST", "/plan", {"date": time.strftime("%Y-%m-%d", time.localtime(time.time() + 14 * 86400)), "hours": 2, "focus": ["dsa", "system-design"]})
    check("build study plan", st == 200 and len(j.get("days", [])) >= 13)
    day = j["days"][0]
    st, t1 = api("POST", "/plan/toggle", {"date": day["date"], "title": day["items"][0]["title"]})
    st, t2 = api("POST", "/plan/toggle", {"date": day["date"], "title": day["items"][0]["title"]})
    check("toggle plan item on/off", t1.get("done") is True and t2.get("done") is False)
    # ---------------------------------------------------------------- code runner
    print("\n[code lab]")
    progs = {
        "python": ("import sys\nprint(sum(map(int, sys.stdin.read().split())))", "2 3 4", "9"),
        "java": ("import java.util.*;\npublic class Main { public static void main(String[] a) { Scanner s = new Scanner(System.in); int t = 0; while (s.hasNextInt()) t += s.nextInt(); System.out.println(t); } }", "2 3 4", "9"),
        "cpp": ("#include <bits/stdc++.h>\nint main(){int x,t=0;while(std::cin>>x)t+=x;std::cout<<t<<std::endl;}", "2 3 4", "9"),
        "javascript": ("const s=require('fs').readFileSync(0,'utf8').trim().split(/\\s+/).map(Number);console.log(s.reduce((a,b)=>a+b,0))", "2 3 4", "9"),
    }
    for lang, (code, stdin, want) in progs.items():
        if not langs.get(lang):
            check("run %s (runtime not installed — skipped)" % lang, True)
            continue
        st, r = api("POST", "/run", {"lang": lang, "code": code, "stdin": stdin}, timeout=120)
        check("run %s with stdin" % lang, r.get("ok") and r.get("stdout", "").strip() == want, r.get("stderr") or r.get("stdout"))
    st, r = api("POST", "/run", {"lang": "python", "code": "while True: pass", "timeout": 2})
    check("infinite loop hits time limit", not r.get("ok") and "Time limit" in r.get("stderr", ""))
    st, r = api("POST", "/run", {"lang": "python", "code": "print(1/0)"})
    check("runtime error reported", not r.get("ok") and "ZeroDivisionError" in r.get("stderr", ""))
    # ---------------------------------------------------------------- settings, export/import, progress
    print("\n[settings · backup · progress]")
    st, s0 = api("GET", "/settings")
    st, _ = api("POST", "/settings", {"profile": {"name": "E2E", "role": "tester"}, "new_per_day": 25})
    st, s1 = api("GET", "/settings")
    check("settings save", s1.get("profile", {}).get("name") == "E2E" and s1.get("new_per_day") == 25)
    api("POST", "/settings", {"profile": s0.get("profile", {}), "new_per_day": s0.get("new_per_day", 30)})
    st, ex = api("GET", "/export")
    check("export all data", st == 200 and len(ex.get("cards", [])) > 1000)
    st, im = api("POST", "/import", {"notes": []})
    check("import endpoint", st == 200)
    st, pg = api("GET", "/progress")
    check("read library progress", st == 200 and isinstance(pg, dict))
    st, ps = api("POST", "/progress", pg or {"topics": {}, "problems": {}, "code": {}, "plan": {}, "activity": {}})
    check("save library progress", st == 200 and ps.get("ok"))
    # ---------------------------------------------------------------- learn / practice / revision / resume / analytics
    st, j = api("GET", "/learn")
    subj = {x["id"]: x for x in j.get("subjects", [])}
    check("learn hub: all IA subjects", st == 200 and all(k in subj for k in ("dsa", "java", "spring", "databases", "kafka", "microservices", "system-design", "kubernetes", "cloud", "networking", "devops")), list(subj))
    check("learn hub: subjects have topics", all(len(subj[k]["topics"]) >= 4 for k in subj), {k: len(v["topics"]) for k, v in subj.items()})
    st, j = api("GET", "/mcq?subject=kafka&count=3")
    qs = j.get("questions", [])
    check("mcq quiz", st == 200 and len(qs) == 3 and len(j.get("subjects", [])) >= 10)
    st, j = api("POST", "/mcq/answer", {"id": "kafka-1", "choice": 0})
    check("mcq wrong answer graded", st == 200 and j.get("correct") is False and j.get("answer") == 1)
    st, j = api("GET", "/mistakes")
    check("wrong mcq lands in mistakes log", any(m["ref"] == "kafka-1" and m["kind"] == "mcq" for m in j.get("mistakes", [])))
    st, j = api("POST", "/mcq/answer", {"id": "kafka-1", "choice": 1})
    st2, j2 = api("GET", "/mistakes")
    check("correct retry resolves the mistake", j.get("correct") is True and not any(m["ref"] == "kafka-1" for m in j2.get("mistakes", [])))
    st, j = api("GET", "/sql")
    check("sql challenges + schema", st == 200 and len(j.get("challenges", [])) >= 20 and len(j.get("schema", [])) >= 5)
    st, j = api("POST", "/sql/run", {"id": "sql-3", "sql": "SELECT name FROM employees"})
    check("sql wrong result graded", st == 200 and j.get("ok") and j.get("correct") is False and j.get("feedback"))
    st, j = api("POST", "/sql/run", {"id": "sql-3", "sql": "SELECT name FROM employees WHERE department_id IS NULL"})
    check("sql correct result graded", j.get("correct") is True)
    st, j = api("POST", "/sql/run", {"sql": "DROP TABLE employees; SELECT 1"})
    check("sql sandbox: one statement only", j.get("ok") is False)
    st, j = api("POST", "/sql/run", {"sql": "WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM c) SELECT count(*) FROM c"})
    check("sql sandbox: runaway query stopped", j.get("ok") is False and "long" in j.get("error", ""), j)
    st, j = api("GET", "/debug")
    check("debugging exercises", st == 200 and len(j.get("exercises", [])) >= 15)
    ex = next(x for x in j["exercises"] if x["id"] == "dbg-kth-largest")
    st, j = api("POST", "/debug/run", {"id": ex["id"], "code": ex["code"]})
    check("buggy code fails its tests", st == 200 and j.get("passed") is False)
    st, j = api("POST", "/debug/run", {"id": ex["id"], "code": ex["code"].replace("heap[-1]", "heap[0]")})
    check("fixed code passes its tests", j.get("passed") is True, j.get("stderr"))
    st, j = api("GET", "/scenarios")
    check("scenarios list", st == 200 and len(j.get("scenarios", [])) >= 15)
    st, j = api("POST", "/mock/session", {"track": "scenarios", "count": 3})
    check("scenario mock track", st == 200 and len(j.get("questions", [])) == 3)
    st, j = api("POST", "/project", {"name": "E2E pipeline", "text": "Built Kafka and Spring Boot microservices on Kubernetes; cut p99 latency by 40% for 2 million users."})
    check("project saved, skills detected", st == 200 and "Kafka" in j.get("skills", []), j)
    st, j = api("POST", "/mock/session", {"track": "project", "count": 6})
    check("project round questions", st == 200 and len(j.get("questions", [])) == 6 and "E2E pipeline" in j["questions"][0]["q"])
    st, j = api("POST", "/bookmarks", {"kind": "topic", "ref": "e2e-topic", "title": "E2E topic", "href": "#"})
    check("bookmark add", st == 200 and j.get("bookmarked") is True)
    st, j = api("GET", "/bookmarks")
    check("bookmark listed", any(b["ref"] == "e2e-topic" for b in j.get("bookmarks", [])))
    st, j = api("POST", "/bookmarks", {"kind": "topic", "ref": "e2e-topic", "title": "E2E topic"})
    check("bookmark remove", j.get("bookmarked") is False)
    st, j = api("POST", "/attempts", {"kind": "code", "ref": "e2e-problem", "title": "E2E", "subject": "dsa", "correct": False})
    check("attempt recorded", st == 200 and j.get("id"))
    st, j = api("POST", "/mistakes/resolve", {"kind": "code", "ref": "e2e-problem"})
    check("mistake resolved manually", st == 200)
    st, j = api("POST", "/weak", {"progress": {"topics": {}, "plan": {}}})
    check("weak topics", st == 200 and "subjects" in j and "decks" in j)
    st, j = api("POST", "/revision", {"progress": {}})
    check("revision due today", st == 200 and "cards" in j and "plan_due" in j)
    st, j = api("GET", "/roles")
    check("role prep paths", st == 200 and len(j.get("roles", [])) >= 6 and all(r["topics"] for r in j["roles"]))
    st, j = api("GET", "/company-bank?company=Amazon")
    check("company question bank", st == 200 and len(j.get("problems", [])) >= 10, len(j.get("problems", [])))
    st, j = api("POST", "/interviews", {"company": "E2E Corp", "round": "DSA", "date": "2026-01-01", "questions": "E2E: design a rate limiter for an API gateway"})
    iid = j.get("id")
    check("log real interview", st == 200 and iid)
    st, j = api("DELETE", "/interviews/%s" % iid)
    check("delete real interview", st == 200)
    st, j = api("POST", "/resume/analyze", {"text": "Summary\nExperience\n- Responsible for Kafka pipelines\n- Reduced p99 latency by 40% using Redis caching\nSkills: Java, Spring Boot, AWS\nEducation: B.Tech", "jd": "Java Kafka Kubernetes"})
    check("resume analysis", st == 200 and 0 <= j.get("score", -1) <= 100 and j.get("weak") and j.get("jd", {}).get("missing") == ["Kubernetes"], j.get("jd"))
    st, j = api("POST", "/resume/questions", {})
    check("resume questions", st == 200 and len(j.get("questions", [])) >= 3)
    st, j = api("POST", "/analytics", {"progress": {"topics": {"spring-rest": True}}})
    check("analytics", st == 200 and j.get("kinds") and len(j.get("trend", [])) == 12 and j.get("skills") and j["progress"]["topics_done"] == 1)
    t0 = time.time()
    st, j = api("POST", "/project", {"name": "E2E pipeline", "text": "x"})
    check("writes are not blocked (no leaked transaction)", st == 200 and time.time() - t0 < 3, time.time() - t0)

    # ---------------------------------------------------------------- web agents
    if SKIP_WEB:
        print("\n[web agents] skipped (--skip-web)")
    else:
        print("\n[web agents — need internet]")
        st, j = api("GET", "/search?q=consistent%20hashing&sources=web,wikipedia,stackoverflow", timeout=90)
        check("meta web search", st == 200 and len(j.get("results", [])) >= 5, (len(j.get("results", [])), j.get("errors")))
        st, j = api("GET", "/quick?q=raft%20consensus", timeout=90)
        check("quick answer", st == 200 and (j.get("web") or j.get("wiki")))
        v, err = job("research", {"query": "bloom filter", "depth": "quick"})
        check("research agent", v and v["result"] and v["result"].get("key_points"), err)
        v, err = job("compare", {"a": "TCP", "b": "UDP"})
        check("compare agent", v and v["result"] and v["result"].get("sources"), err)
        v, err = job("digest", {"url": "https://en.wikipedia.org/wiki/Consistent_hashing"})
        check("digest agent", v and v["result"] and v["result"].get("key_points"), err)
        v, err = job("mine", {"topic": "Redis", "track": "", "save": False})
        check("question miner", v and v["result"] and len(v["result"].get("pairs", [])) >= 3, err)
        v, err = job("company", {"name": "Atlassian", "role": "Software Engineer"}, timeout=300)
        check("company intel agent", v and v["result"] and v["result"].get("rounds") is not None, err)
        st, j = api("GET", "/feed?limit=10", timeout=120)
        check("engineering blog feed", st == 200 and len(j.get("items", [])) > 0, len(j.get("items", [])))
        st, j = api("GET", "/hn", timeout=60)
        check("hacker news trending", st == 200)
        st, j = api("GET", "/read?url=" + urllib.parse.quote("https://en.wikipedia.org/wiki/Bloom_filter"), timeout=60)
        check("reader", st == 200 and j.get("chars", 0) > 1000)
    # ---------------------------------------------------------------- logout
    if auth_on:
        st, _, _ = req("GET", "/logout", follow=False)
        jar.clear()
        st, _ = api("GET", "/dashboard")
        check("after logout API → 401", st == 401)

    passed = sum(1 for ok, _, _ in results if ok)
    print("\n%d/%d checks passed" % (passed, len(results)))
    for ok, name, d in results:
        if not ok:
            print("  ✗", name, "—", str(d)[:200])
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
