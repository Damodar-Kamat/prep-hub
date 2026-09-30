"""Meta-search across the open web with no API keys.

General web:  Brave Search (HTML) -> Bing (HTML) fallback
Specialised:  Wikipedia, StackExchange (SO, SE, CS, DBA), Hacker News (Algolia),
              GitHub repositories, dev.to, arXiv, YouTube/Reddit via site: filters.
Results are fused with Reciprocal Rank Fusion and de-duplicated by URL.
"""
import base64
import html
import re
import threading
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

from . import db, net
from .extract import strip_tags

TRUSTED = {  # small prior so authoritative interview/engineering sources surface first
    "en.wikipedia.org": 1.25, "geeksforgeeks.org": 1.15, "stackoverflow.com": 1.2, "leetcode.com": 1.2,
    "github.com": 1.1, "martinfowler.com": 1.3, "highscalability.com": 1.2, "bytebytego.com": 1.25,
    "blog.bytebytego.com": 1.25, "hellointerview.com": 1.25, "systemdesign.one": 1.2, "neetcode.io": 1.2,
    "aws.amazon.com": 1.15, "docs.aws.amazon.com": 1.1, "cloud.google.com": 1.1, "learn.microsoft.com": 1.05,
    "developer.mozilla.org": 1.2, "baeldung.com": 1.2, "kafka.apache.org": 1.2, "nightlies.apache.org": 1.15,
    "confluent.io": 1.15, "engineering.fb.com": 1.25, "netflixtechblog.com": 1.25, "uber.com": 1.1,
    "cloudflare.com": 1.1, "blog.cloudflare.com": 1.2, "discord.com": 1.1, "slack.engineering": 1.2,
    "interviewing.io": 1.25, "glassdoor.com": 1.05, "glassdoor.co.in": 1.05, "reddit.com": 1.0, "medium.com": 0.95,
    "news.ycombinator.com": 1.05, "arxiv.org": 1.0, "techinterviewhandbook.org": 1.3, "programiz.com": 1.0,
    "cp-algorithms.com": 1.25, "docs.python.org": 1.2, "docs.oracle.com": 1.15, "postgresql.org": 1.2,
    "redis.io": 1.2, "mongodb.com": 1.05, "allthingsdistributed.com": 1.25, "jepsen.io": 1.25,
    "levelup.gitconnected.com": 0.9, "youtube.com": 0.9, "quora.com": 0.8, "pinterest.com": 0.3,
}
BLOCK_DOMAINS = {"pinterest.com", "facebook.com", "instagram.com", "tiktok.com", "x.com", "twitter.com"}


def _r(title, url, snippet, source, **extra):
    d = {"title": strip_tags(title)[:200], "url": url, "snippet": strip_tags(snippet)[:500],
         "source": source, "domain": net.domain(url)}
    d.update(extra)
    return d


# ---------------------------------------------------------------- general web
_brave_lock = threading.Lock()
_brave_state = {"last": 0.0, "blocked_until": 0.0}
BRAVE_GAP = 1.6  # seconds between uncached requests — keeps us a polite, low-volume client


def brave(q, n=15):
    url = "https://search.brave.com/search?" + net.qs({"q": q, "source": "web"})
    if not db.cache().execute("SELECT 1 FROM http WHERE url=? AND ts>?", (url, time.time() - 12 * 3600)).fetchone():
        if time.time() < _brave_state["blocked_until"]:
            raise net.FetchError("brave cooling down after rate limit")
        with _brave_lock:
            wait = _brave_state["last"] + BRAVE_GAP - time.time()
            if wait > 0:
                time.sleep(wait)
            _brave_state["last"] = time.time()
    st, _, page = net.fetch(url, ttl=12 * 3600)
    if st == 429:
        _brave_state["blocked_until"] = time.time() + 45
    if st != 200:
        raise net.FetchError("brave HTTP %s" % st)
    out = []
    for ch in page.split('data-type="web"')[1:]:
        ch = ch[:12000]
        m = re.search(r'<a href="(https?://[^"]+)"', ch)
        if not m:
            continue
        url = html.unescape(m.group(1))
        if "brave.com" in url:
            continue
        tm = re.search(r'class="title[^"]*"[^>]*title="([^"]*)"', ch) or re.search(r'class="title[^"]*"[^>]*>(.*?)</div>', ch, re.S)
        title = html.unescape(tm.group(1)) if tm else url
        sm = (re.search(r'class="content[^"]*"[^>]*>(.*?)</div>', ch, re.S) or
              re.search(r'class="snippet-description[^"]*"[^>]*>(.*?)</(?:p|div)>', ch, re.S))
        snippet = sm.group(1) if sm else ""
        dm = re.search(r'<span class="[^"]*\bt-secondary[^"]*">([^<]{4,30}ago|[A-Z][a-z]{2} \d{1,2}, \d{4})', ch)
        out.append(_r(title, url, snippet, "web", date=dm.group(1) if dm else ""))
        if len(out) >= n:
            break
    if not out:
        raise net.FetchError("brave: no parseable results (rate-limited?)")
    return out


_ddg_lock = threading.Lock()
_ddg_state = {"last": 0.0, "blocked_until": 0.0}
LYNX = "Lynx/2.9.0dev.12 libwww-FM/2.14 SSL-MM/1.4.1 GNUTLS/3.7.8"


def ddg(q, n=15):
    """DuckDuckGo Lite — plain HTML meant for text browsers; best general-web quality without keys."""
    url = "https://lite.duckduckgo.com/lite/?" + net.qs({"q": q, "kl": "us-en"})
    if not db.cache().execute("SELECT 1 FROM http WHERE url=? AND ts>?", (url, time.time() - 12 * 3600)).fetchone():
        if time.time() < _ddg_state["blocked_until"]:
            raise net.FetchError("ddg cooling down")
        with _ddg_lock:
            wait = _ddg_state["last"] + 1.2 - time.time()
            if wait > 0:
                time.sleep(wait)
            _ddg_state["last"] = time.time()
    st, _, page = net.fetch(url, ttl=12 * 3600, headers={"User-Agent": LYNX})
    links = re.findall(r'<a[^>]+href="([^"]+)"[^>]*class=\'result-link\'>(.*?)</a>', page, re.S)
    snips = re.findall(r"class='result-snippet'>(.*?)</td>", page, re.S)
    if st != 200 or not links:
        if "anomaly" in page or "challenge" in page or st in (202, 403, 429):
            _ddg_state["blocked_until"] = time.time() + 60
            with db.WLOCK:
                db.cache().execute("DELETE FROM http WHERE url=?", (url,))
                db.cache().commit()
        raise net.FetchError("ddg: no results (HTTP %s)" % st)
    out = []
    for i, (u, t) in enumerate(links):
        u = html.unescape(u)
        m = re.search(r"uddg=([^&]+)", u)
        if m:
            u = urllib.parse.unquote(m.group(1))
        if u.startswith("//"):
            u = "https:" + u
        if "duckduckgo.com/y.js" in u:  # sponsored
            continue
        out.append(_r(html.unescape(t), u, html.unescape(snips[i]) if i < len(snips) else "", "web"))
    return out[:n]


def _bing_url(u):
    u = html.unescape(u)
    m = re.search(r"[?&]u=a1([^&]+)", u)
    if m:
        s = m.group(1)
        try:
            return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4)).decode()
        except Exception:
            pass
    return u


def bing(q, n=15):
    st, _, page = net.fetch("https://www.bing.com/search?" + net.qs({"q": q, "setlang": "en", "count": n}), ttl=12 * 3600)
    out = []
    for m in re.finditer(r'<li class="b_algo"(.*?)</li>', page, re.S):
        blk = m.group(1)
        a = re.search(r'<h2[^>]*><a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', blk, re.S)
        if not a:
            continue
        sn = re.search(r'<p[^>]*>(.*?)</p>', blk, re.S)
        out.append(_r(a.group(2), _bing_url(a.group(1)), sn.group(1) if sn else "", "web"))
    if not out:
        raise net.FetchError("bing: no results")
    return out[:n]


def web(q, n=15):
    errors = []
    for eng in (ddg, brave, bing):
        try:
            return eng(q, n)
        except Exception as e:
            errors.append(str(e))
    raise net.FetchError("; ".join(errors))


# ---------------------------------------------------------------- specialised
def wikipedia(q, n=4):
    j = net.get_json("https://en.wikipedia.org/w/api.php?" + net.qs(
        {"action": "query", "list": "search", "srsearch": q, "format": "json", "srlimit": n}))
    out = []
    for it in j.get("query", {}).get("search", []):
        t = it["title"]
        out.append(_r(t, "https://en.wikipedia.org/wiki/" + urllib.parse.quote(t.replace(" ", "_")),
                      it.get("snippet", ""), "wikipedia"))
    return out


def wiki_summary(title):
    try:
        j = net.get_json("https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title.replace(" ", "_")), ttl=7 * 86400)
        return {"title": j.get("title"), "extract": j.get("extract", ""), "url": j.get("content_urls", {}).get("desktop", {}).get("page", ""),
                "thumb": (j.get("thumbnail") or {}).get("source", "")}
    except Exception:
        return None


def stackexchange(q, n=6, site="stackoverflow"):
    j = net.get_json("https://api.stackexchange.com/2.3/search/advanced?" + net.qs(
        {"order": "desc", "sort": "relevance", "q": q, "site": site, "pagesize": n, "filter": "withbody"}))
    out = []
    for it in j.get("items", []):
        out.append(_r(html.unescape(it["title"]), it["link"], strip_tags(it.get("body", ""))[:400], site,
                      score=it.get("score", 0), answered=it.get("is_answered", False),
                      answer_id=it.get("accepted_answer_id")))
    return out


def se_answer(answer_id, site="stackoverflow"):
    j = net.get_json("https://api.stackexchange.com/2.3/answers/%s?%s" % (answer_id, net.qs({"site": site, "filter": "withbody"})), ttl=30 * 86400)
    items = j.get("items") or []
    return items[0]["body"] if items else ""


def hackernews(q, n=6):
    j = net.get_json("https://hn.algolia.com/api/v1/search?" + net.qs({"query": q, "tags": "story", "hitsPerPage": n}))
    out = []
    for h in j.get("hits", []):
        url = h.get("url") or "https://news.ycombinator.com/item?id=%s" % h["objectID"]
        out.append(_r(h.get("title") or "", url, "%s points · %s comments · HN discussion: https://news.ycombinator.com/item?id=%s"
                      % (h.get("points", 0), h.get("num_comments", 0), h["objectID"]), "hackernews",
                      points=h.get("points", 0), date=(h.get("created_at") or "")[:10]))
    return out


def github(q, n=6):
    j = net.get_json("https://api.github.com/search/repositories?" + net.qs({"q": q, "sort": "stars", "per_page": n}),
                     headers={"Accept": "application/vnd.github+json"})
    return [_r(r["full_name"], r["html_url"], (r.get("description") or "") + " · ★%s" % r.get("stargazers_count", 0),
               "github", stars=r.get("stargazers_count", 0)) for r in j.get("items", [])]


def devto(q, n=6):
    tag = re.sub(r"[^a-z0-9]", "", q.lower().split()[0]) if q.split() else "interview"
    j = net.get_json("https://dev.to/api/articles?" + net.qs({"tag": tag, "per_page": n, "top": 365}))
    return [_r(a["title"], a["url"], a.get("description", ""), "dev.to", date=(a.get("published_at") or "")[:10]) for a in j]


def arxiv(q, n=4):
    st, _, xml = net.fetch("http://export.arxiv.org/api/query?" + net.qs({"search_query": "all:" + q, "max_results": n}), api=True)
    out = []
    for e in re.findall(r"<entry>(.*?)</entry>", xml, re.S):
        t = re.search(r"<title>(.*?)</title>", e, re.S)
        l = re.search(r"<id>(.*?)</id>", e)
        s = re.search(r"<summary>(.*?)</summary>", e, re.S)
        if t and l:
            out.append(_r(t.group(1), l.group(1), s.group(1) if s else "", "arxiv"))
    return out


def site(q, domain, n=8):
    base = domain.split("/")[0]
    res = [dict(r, source=base.split(".")[0]) for r in web("%s site:%s" % (q, domain), n)]
    return [r for r in res if r["domain"] == base or r["domain"].endswith("." + base)]


SOURCES = {
    "web": web, "wikipedia": wikipedia, "stackoverflow": stackexchange, "hackernews": hackernews,
    "github": github, "devto": devto, "arxiv": arxiv,
    "reddit": lambda q, n=8: site(q, "reddit.com", n),
    "youtube": lambda q, n=6: site(q, "youtube.com", n),
    "leetcode": lambda q, n=8: site(q, "leetcode.com", n),
    "gfg": lambda q, n=8: site(q, "geeksforgeeks.org", n),
    "glassdoor": lambda q, n=6: site(q, "glassdoor.com", n),
    "softwareengineering": lambda q, n=5: stackexchange(q, n, "softwareengineering"),
    "cs": lambda q, n=5: stackexchange(q, n, "cs"),
    "dba": lambda q, n=5: stackexchange(q, n, "dba"),
}
DEFAULT = ["web", "wikipedia", "stackoverflow", "hackernews", "github"]


def multi(q, sources=None, per=8, log=None):
    """Query several sources in parallel and fuse with RRF. Returns (results, errors)."""
    sources = [s for s in (sources or DEFAULT) if s in SOURCES]
    key = "search:%s:%s:%s" % (q.lower().strip(), ",".join(sorted(sources)), per)
    cached = db.result_get(key, 6 * 3600)
    if cached:
        if log:
            log("cache hit for search '%s'" % q)
        return cached["results"], cached["errors"]
    lists, errors = {}, {}
    with ThreadPoolExecutor(max_workers=len(sources) or 1) as ex:
        futs = {ex.submit(SOURCES[s], q, per): s for s in sources}
        for f in as_completed(futs):
            s = futs[f]
            try:
                lists[s] = f.result()
                if log:
                    log("%s → %d results" % (s, len(lists[s])))
            except Exception as e:
                errors[s] = str(e)[:200]
                if log:
                    log("%s failed: %s" % (s, str(e)[:120]))
    fused = {}
    for s, lst in lists.items():
        w = 1.0 if s == "web" else 0.8
        for rank, r in enumerate(lst):
            u = re.sub(r"[#?].*$", "", r["url"]).rstrip("/") if r["domain"] not in ("news.ycombinator.com", "youtube.com") else r["url"]
            if r["domain"] in BLOCK_DOMAINS:
                continue
            prior = TRUSTED.get(r["domain"], 1.0)
            sc = w * prior / (60 + rank)
            if u in fused:
                fused[u]["rrf"] += sc
                fused[u]["also"].append(s)
            else:
                fused[u] = dict(r, rrf=sc, also=[s])
    results = sorted(fused.values(), key=lambda r: -r["rrf"])
    for r in results:
        r["rrf"] = round(r["rrf"] * 1000, 2)
    db.result_set(key, {"results": results, "errors": errors, "ts": time.time()})
    return results, errors
