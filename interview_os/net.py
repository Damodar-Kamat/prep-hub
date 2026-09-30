"""HTTP client with browser-like headers, gzip, charset handling and a SQLite response cache."""
import gzip
import json
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib

from . import db

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0 Safari/537.36")
API_UA = "InterviewOS/1.0 (local personal study tool; python-urllib)"

_ctx = ssl.create_default_context()
try:  # macOS system python sometimes lacks a CA bundle; fall back to certifi if present
    import certifi  # type: ignore
    _ctx = ssl.create_default_context(cafile=certifi.where())
except Exception:
    pass


class FetchError(Exception):
    pass


def _decode(raw, headers):
    enc = (headers.get("Content-Encoding") or "").lower()
    if enc == "gzip":
        raw = gzip.decompress(raw)
    elif enc == "deflate":
        try:
            raw = zlib.decompress(raw)
        except zlib.error:
            raw = zlib.decompress(raw, -zlib.MAX_WBITS)
    return raw


def _charset(ctype, raw):
    m = re.search(r"charset=([\w-]+)", ctype or "", re.I)
    if m:
        return m.group(1)
    m = re.search(rb'<meta[^>]+charset=["\']?([\w-]+)', raw[:4000], re.I)
    return m.group(1).decode() if m else "utf-8"


def fetch(url, *, ttl=6 * 3600, api=False, headers=None, data=None, timeout=15, max_bytes=4_000_000):
    """Return (status, content_type, text). Cached by URL for `ttl` seconds (GET only)."""
    use_cache = data is None and ttl > 0
    if use_cache:
        r = db.cache().execute("SELECT ts, status, ctype, body FROM http WHERE url=?", (url,)).fetchone()
        if r and time.time() - r["ts"] < ttl:
            return r["status"], r["ctype"], r["body"]
    h = {
        "User-Agent": API_UA if api else UA,
        "Accept": "application/json" if api else "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
    }
    if headers:
        h.update(headers)
    body = None
    if data is not None:
        body = data if isinstance(data, bytes) else urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(url, headers=h, data=body)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=_ctx) as resp:
            raw = _decode(resp.read(max_bytes), resp.headers)
            status = resp.status
            ctype = resp.headers.get("Content-Type", "")
    except urllib.error.HTTPError as e:
        try:
            raw = _decode(e.read(200_000), e.headers)
        except Exception:
            raw = b""
        status, ctype = e.code, e.headers.get("Content-Type", "") if e.headers else ""
    except Exception as e:  # timeouts, DNS, TLS…
        raise FetchError("%s: %s" % (url, e))
    text = raw.decode(_charset(ctype, raw), errors="replace")
    if use_cache and status == 200:
        with db.WLOCK:
            db.cache().execute("INSERT OR REPLACE INTO http(url, ts, status, ctype, body) VALUES (?,?,?,?,?)",
                               (url, time.time(), status, ctype, text))
            db.cache().commit()
    return status, ctype, text


def get_json(url, ttl=6 * 3600, **kw):
    status, _, text = fetch(url, ttl=ttl, api=True, **kw)
    if status != 200:
        raise FetchError("%s -> HTTP %s" % (url, status))
    return json.loads(text)


def qs(params):
    return urllib.parse.urlencode(params)


def domain(url):
    try:
        d = urllib.parse.urlparse(url).netloc.lower()
        return d[4:] if d.startswith("www.") else d
    except Exception:
        return ""
