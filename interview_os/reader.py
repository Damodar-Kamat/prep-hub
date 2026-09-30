"""Read any URL into clean text blocks, with fallbacks for bot-protected sites:
direct fetch -> r.jina.ai reader proxy -> Wayback Machine snapshot."""
import re
import urllib.parse

from . import db, net
from .extract import extract

BLOCK_MARKERS = re.compile(r"(Just a moment\.\.\.|Attention Required|cf-browser-verification|Access denied|"
                           r"You've been blocked|enable JavaScript|Security \| Glassdoor|captcha)", re.I)
KNOWN_BLOCKED = ("reddit.com", "medium.com", "leetcode.com", "glassdoor.", "quora.com", "linkedin.com",
                 "towardsdatascience.com", "levelup.gitconnected.com", "betterprogramming.pub")


def _md_to_doc(md, url):
    title = ""
    m = re.search(r"^Title:\s*(.*)$", md, re.M)
    if m:
        title = m.group(1).strip()
    body = md.split("Markdown Content:", 1)[-1]
    blocks, in_code, code = [], False, []
    for line in body.split("\n"):
        if line.strip().startswith("```"):
            if in_code:
                blocks.append({"t": "code", "text": "\n".join(code), "level": 0})
                code = []
            in_code = not in_code
            continue
        if in_code:
            code.append(line)
            continue
        s = line.strip()
        if not s or re.match(r"^(\[!\[|!\[|\* \* \*|---|===)", s):
            continue
        s = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", s)
        s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)
        s = s.replace("**", "").replace("__", "").strip()
        h = re.match(r"^(#{1,6})\s+(.*)", s)
        if h:
            blocks.append({"t": "h", "text": h.group(2), "level": len(h.group(1))})
        elif re.match(r"^([-*+]|\d+\.)\s+", s):
            t = re.sub(r"^([-*+]|\d+\.)\s+", "", s)
            if len(t) > 2:
                blocks.append({"t": "li", "text": t, "level": 0})
        elif len(s) > 20:
            blocks.append({"t": "p", "text": s, "level": 0})
    text = "\n".join(b["text"] for b in blocks if b["t"] != "code")
    return {"url": url, "title": title, "description": "", "site": net.domain(url), "published": "",
            "blocks": blocks, "text": text, "code": [b["text"] for b in blocks if b["t"] == "code"][:12],
            "chars": len(text)}


def _good(doc):
    return doc and doc["chars"] > 400 and not BLOCK_MARKERS.search(doc["title"] + " " + doc["text"][:600])


def read(url, log=None, allow_proxy=True):
    key = "read:" + url
    c = db.result_get(key, 3 * 86400)
    if c:
        return c
    doc, via = None, "direct"
    d = net.domain(url)
    if not any(k in d for k in KNOWN_BLOCKED):
        try:
            st, ctype, body = net.fetch(url, timeout=12)
            if st == 200 and ("html" in ctype or body.lstrip().startswith("<")):
                doc = extract(body, url)
            elif st == 200 and "text/plain" in ctype:
                doc = {"url": url, "title": url, "description": "", "site": d, "published": "",
                       "blocks": [{"t": "p", "text": p, "level": 0} for p in body.split("\n\n") if p.strip()],
                       "text": body, "code": [], "chars": len(body)}
        except Exception as e:
            if log:
                log("direct read failed for %s: %s" % (d, str(e)[:80]))
    if not _good(doc) and allow_proxy:
        via = "reader-proxy"
        try:
            st, _, md = net.fetch("https://r.jina.ai/" + url, timeout=30, headers={"Accept": "text/plain", "X-Return-Format": "markdown"})
            if st == 200 and "Warning: Target URL returned error" not in md[:600]:
                doc = _md_to_doc(md, url)
        except Exception:
            pass
    if not _good(doc) and allow_proxy:
        via = "wayback"
        try:
            st, ctype, body = net.fetch("https://web.archive.org/web/2026id_/" + url, timeout=25)
            if st == 200:
                doc = extract(body, url)
        except Exception:
            pass
    if not _good(doc):
        return None
    doc["via"] = via
    doc["blocks"] = doc["blocks"][:600]
    db.result_set(key, doc)
    return doc


def is_url(s):
    try:
        p = urllib.parse.urlparse(s.strip())
        return p.scheme in ("http", "https") and "." in p.netloc
    except Exception:
        return False
