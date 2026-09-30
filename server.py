#!/usr/bin/env python3
"""Interview OS server — serves the Prep Hub library + the Interview OS app + a JSON API.

    python3 server.py            # http://localhost:8777
    python3 server.py --port 9000 --no-browser

Pure standard library. Data lives in ./os-data (user.db = your stuff, cache.db = disposable).
"""
import argparse
import json
import mimetypes
import os
import re
import subprocess
import sys
import threading
import time
import traceback
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

from interview_os import agents, bank, db, interviewer, jobs, knowledge, llm, search, tools  # noqa: E402
from interview_os import reader as rdr  # noqa: E402

ROUTES = []


def route(method, pattern):
    rx = re.compile("^" + pattern + "$")

    def deco(fn):
        ROUTES.append((method, rx, fn))
        return fn
    return deco


class HttpError(Exception):
    def __init__(self, code, msg):
        super().__init__(msg)
        self.code = code


def need(body, *keys):
    for k in keys:
        if not str(body.get(k, "")).strip():
            raise HttpError(400, "missing '%s'" % k)


# ------------------------------------------------------------------ status / dashboard
@route("GET", "/api/health")
def health(q, b):
    return {"ok": True, "app": "Interview OS", "time": time.time()}


@route("GET", "/api/status")
def status(q, b):
    return {"llm": llm.status(force="force" in q), "runner": tools.runner_langs(), "library": bool(knowledge.library()["sections"]),
            "data_dir": db.USER_DB}


@route("GET", "/api/library")
def library(q, b):
    lib = knowledge.library()
    return {"sections": [{"id": s["id"], "title": s["title"], "icon": s.get("icon", ""), "topics": [{"id": t["id"], "title": t["title"]} for t in s["topics"]]}
                         for s in lib["sections"]],
            "roadmap": lib.get("roadmap", []), "problems": [{"id": p["id"], "title": p["title"], "difficulty": p["difficulty"]} for p in lib["problems"]]}


@route("GET", "/api/dashboard")
def dashboard(q, b):
    u = db.user()
    act = db.rows(u.execute("SELECT day, count, minutes FROM activity ORDER BY day DESC LIMIT 120"))
    days = {a["day"] for a in act}
    streak, d = 0, time.time()
    while time.strftime("%Y-%m-%d", time.localtime(d)) in days:
        streak += 1
        d -= 86400
    if not streak and time.strftime("%Y-%m-%d", time.localtime(time.time() - 86400)) in days:
        d = time.time() - 86400
        while time.strftime("%Y-%m-%d", time.localtime(d)) in days:
            streak += 1
            d -= 86400
    mocks = db.rows(u.execute("SELECT id, track, company, started, score FROM mock_sessions ORDER BY started DESC LIMIT 40"))
    by_track = {}
    for m in mocks:
        if m["score"] is not None:
            by_track.setdefault(m["track"], []).append(m["score"])
    comps = db.rows(u.execute("SELECT * FROM companies WHERE stage NOT IN ('Rejected','Offer') AND next_date!='' ORDER BY next_date LIMIT 6"))
    plan = db.kv_get("plan")
    today = time.strftime("%Y-%m-%d")
    todays = next((d for d in (plan or {}).get("days", []) if d["date"] == today), None)
    return {"streak": streak, "activity": act, "cards": tools.card_stats(), "mocks": mocks[:8],
            "mock_avg": {k: round(sum(v[:5]) / len(v[:5]), 1) for k, v in by_track.items()},
            "upcoming": comps, "plan_today": todays, "plan_meta": {k: plan[k] for k in ("interview_date", "company", "focus")} if plan else None,
            "notes": u.execute("SELECT COUNT(*) n FROM notes").fetchone()["n"],
            "stories": u.execute("SELECT COUNT(*) n FROM stories").fetchone()["n"],
            "companies": u.execute("SELECT COUNT(*) n FROM companies").fetchone()["n"]}


@route("POST", "/api/activity")
def activity(q, b):
    db.bump_activity(float(b.get("minutes", 0)))
    return {"ok": True}


# ------------------------------------------------------------------ search / agents
@route("GET", "/api/search")
def api_search(q, b):
    query = q.get("q", "").strip()
    if not query:
        raise HttpError(400, "q required")
    srcs = [s for s in q.get("sources", "").split(",") if s] or None
    res, errs = search.multi(query, srcs, per=int(q.get("n", 10)))
    return {"query": query, "results": res[:60], "errors": errs}


@route("GET", "/api/quick")
def api_quick(q, b):
    return agents.quick(q.get("q", ""))


@route("GET", "/api/local")
def api_local(q, b):
    query = q.get("q", "").strip()
    out = {"library": knowledge.local_topic_hits(query, 8), "notes": [], "cards": []}
    if query:
        fts = " ".join('"%s"*' % w.replace('"', "") for w in query.split()[:8])
        try:
            out["notes"] = db.rows(db.user().execute(
                "SELECT n.id, n.title, n.kind, snippet(notes_fts, 1, '<mark>', '</mark>', '…', 16) snip FROM notes_fts "
                "JOIN notes n ON n.id = notes_fts.rowid WHERE notes_fts MATCH ? ORDER BY rank LIMIT 8", (fts,)))
        except Exception:
            pass
        out["cards"] = db.rows(db.user().execute("SELECT id, deck, front FROM cards WHERE front LIKE ? LIMIT 6", ("%" + query + "%",)))
    return out


@route("GET", "/api/read")
def api_read(q, b):
    url = q.get("url", "")
    if not rdr.is_url(url):
        raise HttpError(400, "valid url required")
    doc = rdr.read(url)
    if not doc:
        raise HttpError(422, "could not read page")
    return doc


AGENTS = {"research": agents.research, "compare": agents.compare, "company": agents.company, "mine": agents.mine, "digest": agents.digest}


@route("POST", "/api/agent/(\\w+)")
def api_agent(q, b, kind):
    fn = AGENTS.get(kind)
    if not fn:
        raise HttpError(404, "unknown agent")
    params = {k: v for k, v in b.items() if k in fn.__code__.co_varnames[: fn.__code__.co_argcount]}
    job = jobs.start(kind, fn, params)
    return {"job": job.id}


@route("GET", "/api/jobs/(\\w+)")
def api_job(q, b, jid):
    j = jobs.get(jid)
    if not j:
        raise HttpError(404, "no such job (server restarted?)")
    return j.view(int(q.get("since", 0)))


@route("GET", "/api/jobs")
def api_jobs(q, b):
    return {"jobs": jobs.recent()}


@route("GET", "/api/history")
def api_history(q, b):
    rs = db.rows(db.cache().execute("SELECT key, ts FROM results WHERE key LIKE 'research:%' OR key LIKE 'company:%' ORDER BY ts DESC LIMIT 40"))
    return {"items": [{"key": r["key"], "kind": r["key"].split(":")[0], "query": r["key"].split(":")[1], "ts": r["ts"]} for r in rs]}


@route("GET", "/api/hn")
def api_hn(q, b):
    return {"items": tools.hn_top(days=int(q.get("days", 7)))}


# ------------------------------------------------------------------ notes (FTS)
@route("GET", "/api/notes")
def notes_list(q, b):
    kind = q.get("kind")
    s = q.get("q", "").strip()
    if s:
        fts = " ".join('"%s"*' % w.replace('"', "") for w in s.split()[:8])
        return {"notes": db.rows(db.user().execute(
            "SELECT n.id, n.title, n.kind, n.tags, n.updated, n.pinned, snippet(notes_fts, 1, '<mark>', '</mark>', '…', 20) snip "
            "FROM notes_fts JOIN notes n ON n.id = notes_fts.rowid WHERE notes_fts MATCH ? ORDER BY rank LIMIT 100", (fts,)))}
    sql = "SELECT id, title, kind, tags, updated, pinned, substr(body, 1, 220) snip FROM notes"
    args = []
    if kind:
        sql += " WHERE kind=?"
        args.append(kind)
    return {"notes": db.rows(db.user().execute(sql + " ORDER BY pinned DESC, updated DESC LIMIT 300", args))}


@route("GET", "/api/notes/(\\d+)")
def notes_get(q, b, nid):
    r = db.user().execute("SELECT * FROM notes WHERE id=?", (nid,)).fetchone()
    if not r:
        raise HttpError(404, "not found")
    d = dict(r)
    d["meta"] = json.loads(d["meta"] or "{}")
    return d


@route("POST", "/api/notes")
def notes_create(q, b):
    need(b, "title")
    now = time.time()
    cur = db.user().execute("INSERT INTO notes(title, body, kind, tags, meta, created, updated) VALUES (?,?,?,?,?,?,?)",
                            (b["title"], b.get("body", ""), b.get("kind", "note"), b.get("tags", ""), json.dumps(b.get("meta", {})), now, now))
    db.user().commit()
    db.bump_activity(0.5)
    return {"id": cur.lastrowid}


@route("PUT", "/api/notes/(\\d+)")
def notes_update(q, b, nid):
    fields = {k: b[k] for k in ("title", "body", "tags", "kind", "pinned") if k in b}
    if "meta" in b:
        fields["meta"] = json.dumps(b["meta"])
    if not fields:
        return {"ok": True}
    fields["updated"] = time.time()
    db.user().execute("UPDATE notes SET %s WHERE id=?" % ", ".join("%s=?" % k for k in fields), list(fields.values()) + [nid])
    db.user().commit()
    return {"ok": True}


@route("DELETE", "/api/notes/(\\d+)")
def notes_delete(q, b, nid):
    db.user().execute("DELETE FROM notes WHERE id=?", (nid,))
    db.user().commit()
    return {"ok": True}


# ------------------------------------------------------------------ flashcards
@route("GET", "/api/cards/due")
def cards_due(q, b):
    return {"cards": tools.cards_due(q.get("deck") or None, int(q.get("limit", 50))), "stats": tools.card_stats()}


@route("GET", "/api/cards/stats")
def cards_stats(q, b):
    return tools.card_stats()


@route("GET", "/api/cards")
def cards_list(q, b):
    deck, s = q.get("deck"), q.get("q", "")
    sql, args = "SELECT * FROM cards WHERE 1=1", []
    if deck:
        sql += " AND deck=?"
        args.append(deck)
    if s:
        sql += " AND (front LIKE ? OR back LIKE ?)"
        args += ["%" + s + "%"] * 2
    return {"cards": db.rows(db.user().execute(sql + " ORDER BY created DESC LIMIT 500", args))}


@route("POST", "/api/cards")
def cards_add(q, b):
    items = b.get("cards") or [b]
    ids = [tools.card_add(c.get("front", ""), c.get("back", ""), c.get("deck") or b.get("deck") or "General", c.get("source", b.get("source", "")))
           for c in items if c.get("front")]
    return {"added": len([i for i in ids if i]), "ids": ids}


@route("POST", "/api/cards/(\\d+)/review")
def cards_review(q, b, cid):
    return tools.card_review(int(cid), int(b.get("grade", 2)))


@route("PUT", "/api/cards/(\\d+)")
def cards_update(q, b, cid):
    fields = {k: b[k] for k in ("front", "back", "deck", "suspended") if k in b}
    if fields:
        db.user().execute("UPDATE cards SET %s WHERE id=?" % ", ".join("%s=?" % k for k in fields), list(fields.values()) + [cid])
        db.user().commit()
    return {"ok": True}


@route("DELETE", "/api/cards/(\\d+)")
def cards_delete(q, b, cid):
    db.user().execute("DELETE FROM cards WHERE id=?", (cid,))
    db.user().commit()
    return {"ok": True}


@route("POST", "/api/cards/seed")
def cards_seed(q, b):
    return {"added": tools.seed_library_cards()}


# ------------------------------------------------------------------ mock interviews
@route("GET", "/api/mock/tracks")
def mock_tracks(q, b):
    return {"tracks": interviewer.tracks(), "themes": bank.BEHAVIORAL_THEMES}


@route("POST", "/api/mock/session")
def mock_session(q, b):
    return interviewer.build_session(b.get("track", "behavioral"), int(b.get("count", 5)), int(b.get("level", 0)), b.get("company", ""))


@route("POST", "/api/mock/evaluate")
def mock_eval(q, b):
    return interviewer.evaluate(b.get("track", ""), b.get("question", {}), b.get("answer", ""), float(b.get("seconds", 0)), bool(b.get("spoken")))


@route("POST", "/api/mock/save")
def mock_save(q, b):
    return interviewer.save_session(b)


@route("GET", "/api/mock/history")
def mock_history(q, b):
    return {"sessions": db.rows(db.user().execute("SELECT id, track, company, started, ended, score FROM mock_sessions ORDER BY started DESC LIMIT 100"))}


@route("GET", "/api/mock/(\\d+)")
def mock_get(q, b, sid):
    r = db.user().execute("SELECT * FROM mock_sessions WHERE id=?", (sid,)).fetchone()
    if not r:
        raise HttpError(404, "not found")
    d = dict(r)
    d["data"] = json.loads(d["data"])
    return d


@route("GET", "/api/questions")
def questions(q, b):
    track = q.get("track")
    out = []
    for t, qs in bank.Q.items():
        if track and t != track:
            continue
        out += [dict(x, track=t) for x in qs]
    rs = db.rows(db.user().execute("SELECT id, track, q, points, source FROM custom_questions" + (" WHERE track=?" if track else ""), (track,) if track else ()))
    out += [{"id": r["id"], "track": r["track"], "q": r["q"], "points": json.loads(r["points"] or "[]"), "source": r["source"], "custom": True} for r in rs]
    return {"questions": out, "tracks": bank.TRACKS}


@route("POST", "/api/questions")
def questions_add(q, b):
    need(b, "track", "q")
    db.user().execute("INSERT OR IGNORE INTO custom_questions(track, q, points, source, created) VALUES (?,?,?,?,?)",
                      (b["track"], b["q"], json.dumps(b.get("points", [])), b.get("source", "manual"), time.time()))
    db.user().commit()
    return {"ok": True}


@route("DELETE", "/api/questions/(\\d+)")
def questions_del(q, b, qid):
    db.user().execute("DELETE FROM custom_questions WHERE id=?", (qid,))
    db.user().commit()
    return {"ok": True}


# ------------------------------------------------------------------ stories (STAR bank)
@route("GET", "/api/stories")
def stories(q, b):
    return {"stories": db.rows(db.user().execute("SELECT * FROM stories ORDER BY updated DESC")), "themes": bank.BEHAVIORAL_THEMES}


@route("POST", "/api/stories")
def stories_save(q, b):
    now = time.time()
    f = [b.get(k, "") for k in ("title", "situation", "task", "action", "result", "themes")]
    if b.get("id"):
        db.user().execute("UPDATE stories SET title=?, situation=?, task=?, action=?, result=?, themes=?, updated=? WHERE id=?", f + [now, b["id"]])
        sid = b["id"]
    else:
        sid = db.user().execute("INSERT INTO stories(title, situation, task, action, result, themes, created, updated) VALUES (?,?,?,?,?,?,?,?)",
                                f + [now, now]).lastrowid
    db.user().commit()
    db.bump_activity(1)
    return {"id": sid}


@route("DELETE", "/api/stories/(\\d+)")
def stories_del(q, b, sid):
    db.user().execute("DELETE FROM stories WHERE id=?", (sid,))
    db.user().commit()
    return {"ok": True}


@route("POST", "/api/stories/score")
def stories_score(q, b):
    text = "\n".join(b.get(k, "") for k in ("situation", "task", "action", "result"))
    return interviewer.evaluate("behavioral", {"q": b.get("title", ""), "points": []}, text, 0)


# ------------------------------------------------------------------ companies (pipeline)
@route("GET", "/api/companies")
def companies(q, b):
    return {"companies": db.rows(db.user().execute("SELECT * FROM companies ORDER BY updated DESC"))}


@route("POST", "/api/companies")
def companies_save(q, b):
    need(b, "name")
    now = time.time()
    keys = ("name", "role", "stage", "next_date", "link", "contact", "salary", "notes")
    vals = [b.get(k, "") or ("Wishlist" if k == "stage" else "") for k in keys]
    if b.get("id"):
        db.user().execute("UPDATE companies SET %s, updated=? WHERE id=?" % ", ".join("%s=?" % k for k in keys), vals + [now, b["id"]])
        cid = b["id"]
    else:
        cid = db.user().execute("INSERT INTO companies(%s, created, updated) VALUES (%s)" % (", ".join(keys), ",".join("?" * (len(keys) + 2))),
                                vals + [now, now]).lastrowid
    db.user().commit()
    return {"id": cid}


@route("DELETE", "/api/companies/(\\d+)")
def companies_del(q, b, cid):
    db.user().execute("DELETE FROM companies WHERE id=?", (cid,))
    db.user().commit()
    return {"ok": True}


# ------------------------------------------------------------------ JD, planner, runner, feed
@route("POST", "/api/jd")
def jd(q, b):
    need(b, "jd")
    return tools.analyze_jd(b["jd"], b.get("resume", ""))


@route("POST", "/api/plan")
def plan_make(q, b):
    return tools.make_plan(b.get("date", ""), float(b.get("hours", 2)), b.get("focus"), b.get("company", ""))


@route("GET", "/api/plan")
def plan_get(q, b):
    return db.kv_get("plan") or {}


@route("POST", "/api/plan/toggle")
def plan_toggle(q, b):
    done = db.kv_get("plan_done", {})
    k = "%s|%s" % (b.get("date"), b.get("title"))
    done[k] = not done.get(k)
    db.kv_set("plan_done", done)
    if done[k]:
        db.bump_activity(10)
    return {"done": done[k]}


@route("GET", "/api/plan/done")
def plan_done(q, b):
    return db.kv_get("plan_done", {})


@route("POST", "/api/run")
def run(q, b):
    need(b, "lang", "code")
    r = tools.run_code(b["lang"], b["code"], b.get("stdin", ""), min(30, int(b.get("timeout", 10))))
    db.bump_activity(0.5)
    return r


@route("GET", "/api/feed")
def feed(q, b):
    if db.kv_get("feed_refreshed", 0) == 0:
        tools.refresh_feed()
    return {"items": tools.feed(int(q.get("limit", 80)), q.get("tag") or None, q.get("q") or None),
            "refreshed": db.kv_get("feed_refreshed", 0), "sources": list(tools.FEEDS)}


@route("POST", "/api/feed/refresh")
def feed_refresh(q, b):
    return tools.refresh_feed(force=True)


# ------------------------------------------------------------------ settings, export, prep-hub progress
@route("GET", "/api/settings")
def settings_get(q, b):
    return {"llm": llm.config(), "profile": db.kv_get("profile", {})}


@route("POST", "/api/settings")
def settings_set(q, b):
    if "llm" in b:
        db.kv_set("llm", b["llm"])
        llm.status(force=True)
    if "profile" in b:
        db.kv_set("profile", b["profile"])
    return {"ok": True}


@route("GET", "/api/export")
def export(q, b):
    u = db.user()
    out = {"exported": time.time()}
    for t in ("kv", "cards", "notes", "companies", "stories", "mock_sessions", "activity", "custom_questions", "reviews"):
        out[t] = db.rows(u.execute("SELECT * FROM %s" % t))
    return out


@route("POST", "/api/import")
def import_(q, b):
    u = db.user()
    n = 0
    for t in ("kv", "cards", "notes", "companies", "stories", "mock_sessions", "activity", "custom_questions", "reviews"):
        for r in b.get(t, []):
            cols = list(r.keys())
            u.execute("INSERT OR IGNORE INTO %s(%s) VALUES (%s)" % (t, ",".join(cols), ",".join("?" * len(cols))), [r[c] for c in cols])
            n += 1
    u.commit()
    return {"imported": n}


PROGRESS = os.path.join(ROOT, "progress.json")


@route("GET", "/api/progress")
def progress_get(q, b):
    try:
        with open(PROGRESS) as f:
            return json.load(f)
    except Exception:
        return {}


@route("POST", "/api/progress")
def progress_save(q, b):
    """Prep Hub's Save button posts here when served by Interview OS: writes progress.json and commits it."""
    with open(PROGRESS, "w") as f:
        f.write(json.dumps(b, indent=2, sort_keys=False) + "\n")
    committed = False
    if os.path.isdir(os.path.join(ROOT, ".git")):
        try:
            subprocess.run(["git", "add", "progress.json"], cwd=ROOT, capture_output=True, timeout=10)
            r = subprocess.run(["git", "commit", "-m", "progress: " + time.strftime("%Y-%m-%d %H:%M"), "--", "progress.json"],
                               cwd=ROOT, capture_output=True, timeout=10)
            committed = r.returncode == 0
        except Exception:
            pass
    db.bump_activity(1)
    return {"ok": True, "committed": committed}


# ------------------------------------------------------------------ HTTP plumbing
class Handler(BaseHTTPRequestHandler):
    server_version = "InterviewOS/1.0"

    def log_message(self, fmt, *args):
        if "/api/jobs/" in (args[0] if args else ""):
            return
        sys.stderr.write("%s  %s\n" % (time.strftime("%H:%M:%S"), fmt % args))

    def _send(self, code, body, ctype="application/json; charset=utf-8", extra=None):
        data = body if isinstance(body, bytes) else json.dumps(body, default=str).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def _api(self, method):
        u = urllib.parse.urlparse(self.path)
        q = {k: v[-1] for k, v in urllib.parse.parse_qs(u.query).items()}
        body = {}
        if method in ("POST", "PUT"):
            n = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(n) if n else b""
            try:
                body = json.loads(raw.decode() or "{}")
            except Exception:
                return self._send(400, {"error": "invalid JSON"})
        for m, rx, fn in ROUTES:
            if m != method:
                continue
            mt = rx.match(u.path)
            if mt:
                try:
                    if method != "GET" and not u.path.startswith(("/api/run", "/api/agent", "/api/feed/refresh", "/api/mock/evaluate")):
                        with db.WLOCK:  # one writer at a time for user.db
                            res = fn(q, body, *mt.groups())
                    else:
                        res = fn(q, body, *mt.groups())
                    return self._send(200, res)
                except HttpError as e:
                    return self._send(e.code, {"error": str(e)})
                except Exception as e:
                    traceback.print_exc()
                    return self._send(500, {"error": "%s: %s" % (type(e).__name__, e)})
        return self._send(404, {"error": "no route %s %s" % (method, u.path)})

    def _static(self):
        path = urllib.parse.unquote(urllib.parse.urlparse(self.path).path)
        if path in ("/", ""):
            return self._send(302, b"", extra={"Location": "/os/"})
        if path.endswith("/"):
            path += "index.html"
        full = os.path.realpath(os.path.join(ROOT, path.lstrip("/")))
        if not full.startswith(ROOT) or "/os-data" in full or "/.git" in full or "/interview_os" in full:
            return self._send(403, {"error": "forbidden"})
        if not os.path.isfile(full):
            return self._send(404, b"Not found", "text/plain")
        ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
            ctype += "; charset=utf-8"
        with open(full, "rb") as f:
            self._send(200, f.read(), ctype)

    def do_GET(self):
        if self.path.startswith("/api/"):
            return self._api("GET")
        return self._static()

    def do_HEAD(self):
        return self._static()

    def do_POST(self):
        return self._api("POST")

    def do_PUT(self):
        return self._api("PUT")

    def do_DELETE(self):
        return self._api("DELETE")


def background():
    """Keep the blog feed fresh and the library compiled."""
    time.sleep(3)
    while True:
        try:
            knowledge.build_library()
            tools.refresh_feed()
        except Exception as e:
            sys.stderr.write("background refresh failed: %s\n" % e)
        time.sleep(3 * 3600)


def backup_loop():
    """Every 10 min, if your data changed, write os-data/backup.json (text → git-friendly, human-readable)."""
    path = os.path.join(ROOT, "os-data", "backup.json")
    last = None
    while True:
        time.sleep(600)
        try:
            data = export({}, {})
            data.pop("exported", None)
            blob = json.dumps(data, indent=1, sort_keys=True, default=str)
            if blob != last:
                with open(path + ".tmp", "w") as f:
                    f.write(blob)
                os.replace(path + ".tmp", path)
                last = blob
        except Exception as e:
            sys.stderr.write("backup failed: %s\n" % e)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8777)))
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--no-browser", action="store_true")
    a = ap.parse_args()
    db.init()
    knowledge.build_library()
    if db.user().execute("SELECT COUNT(*) n FROM cards").fetchone()["n"] == 0:
        n = tools.seed_library_cards()
        print("seeded %d flashcards from the library + question bank" % n)
    threading.Thread(target=background, daemon=True).start()
    threading.Thread(target=backup_loop, daemon=True).start()
    srv = ThreadingHTTPServer((a.host, a.port), Handler)
    url = "http://localhost:%d/" % a.port
    print("\n  ⚡ Interview OS running → %s   (Prep Hub library at %sindex.html)\n  Ctrl+C to stop.\n" % (url, url))
    if not a.no_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nbye")


if __name__ == "__main__":
    main()
