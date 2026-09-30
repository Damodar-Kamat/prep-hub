"""Readability-style main-content extraction using only html.parser.

Produces an ordered list of blocks: {"t": "h"|"p"|"li"|"code", "text": str, "level": int}
and picks the densest content container, ignoring nav/footer/aside/script noise.
"""
import html
import re
from html.parser import HTMLParser

SKIP = {"script", "style", "noscript", "svg", "nav", "footer", "header", "aside", "form",
        "button", "select", "iframe", "template", "canvas", "figure"}
BLOCK = {"p", "li", "h1", "h2", "h3", "h4", "h5", "h6", "pre", "blockquote", "td", "dd", "dt", "div", "section", "article", "tr"}
NOISE_ATTR = re.compile(r"(comment|sidebar|footer|header|nav|menu|breadcrumb|share|social|related|advert|promo|"
                        r"cookie|banner|popup|modal|newsletter|subscribe|signup|login|toolbar|widget|recommend)", re.I)
VOID = {"br", "img", "hr", "input", "meta", "link", "area", "base", "col", "embed", "source", "track", "wbr", "param"}


class _P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []          # (tag, skipping)
        self.skip_depth = 0
        self.blocks = []
        self.buf = []
        self.cur_tag = "p"
        self.title = ""
        self.in_title = False
        self.meta = {}
        self.in_pre = 0
        self.container_stack = [0]  # index into containers
        self.containers = [{"text": 0, "links": 0, "blocks": []}]
        self.in_a = 0

    # -- helpers
    def _flush(self):
        text = "".join(self.buf)
        self.buf = []
        if self.in_pre:
            text = text.strip("\n")
        else:
            text = re.sub(r"\s+", " ", text).strip()
        if not text:
            return
        t = self.cur_tag
        kind = "h" if t in ("h1", "h2", "h3", "h4", "h5", "h6") else "code" if t == "pre" else "li" if t == "li" else "p"
        blk = {"t": kind, "text": text, "level": int(t[1]) if kind == "h" else 0}
        idx = len(self.blocks)
        self.blocks.append(blk)
        for ci in set(self.container_stack):
            c = self.containers[ci]
            c["text"] += len(text)
            c["blocks"].append(idx)

    def handle_starttag(self, tag, attrs):
        if tag == "title":
            self.in_title = True
        if tag == "meta":
            a = dict(attrs)
            k = (a.get("property") or a.get("name") or "").lower()
            if k in ("og:title", "description", "og:description", "og:site_name", "article:published_time", "og:type"):
                self.meta[k] = a.get("content", "")
            return
        if tag in VOID:
            if tag == "br" and not self.skip_depth:
                self.buf.append("\n" if self.in_pre else " ")
            return
        a = dict(attrs)
        attr_s = (a.get("class") or "") + " " + (a.get("id") or "") + " " + (a.get("role") or "")
        noisy = tag in SKIP or (tag in ("div", "section", "ul", "ol", "span") and NOISE_ATTR.search(attr_s) and
                                not re.search(r"(content|article|post|entry|main|body|text)", attr_s, re.I))
        if a.get("aria-hidden") == "true" or "display:none" in (a.get("style") or "").replace(" ", ""):
            noisy = True
        pushed_container = False
        if noisy or self.skip_depth:
            self.skip_depth += 1
        else:
            if tag in BLOCK:
                self._flush()
                if tag not in ("div", "section", "article", "tr", "td"):
                    self.cur_tag = tag
            if tag == "pre":
                self.in_pre += 1
            if tag == "a":
                self.in_a += 1
            if tag in ("article", "main", "section", "div"):
                self.containers.append({"text": 0, "links": 0, "blocks": [], "tag": tag,
                                        "bonus": 1.6 if tag in ("article", "main") or re.search(r"(article|content|post|entry|markdown|prose)", attr_s, re.I) else 1.0})
                self.container_stack.append(len(self.containers) - 1)
                pushed_container = True
        self.stack.append((tag, noisy or self.skip_depth > 0, pushed_container))

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag in VOID:
            return
        # pop until matching tag (tolerate sloppy html)
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                while len(self.stack) > i:
                    t, skipping, pushed = self.stack.pop()
                    if skipping:
                        self.skip_depth = max(0, self.skip_depth - 1)
                    else:
                        if t in BLOCK:
                            self._flush()
                            self.cur_tag = "p"
                        if t == "pre":
                            self.in_pre = max(0, self.in_pre - 1)
                        if t == "a":
                            self.in_a = max(0, self.in_a - 1)
                        if pushed and len(self.container_stack) > 1:
                            self.container_stack.pop()
                break

    def handle_data(self, data):
        if self.in_title:
            self.title += data
            return
        if self.skip_depth:
            return
        self.buf.append(data)
        if self.in_a:
            for ci in set(self.container_stack):
                self.containers[ci]["links"] += len(data.strip())


def extract(page_html, url=""):
    p = _P()
    try:
        p.feed(page_html)
        p.close()
    except Exception:
        pass
    p._flush()
    # choose best container: most text, penalise link density, reward semantic tags
    best, best_score = p.containers[0], 0
    for c in p.containers[1:]:
        if c["text"] < 200:
            continue
        link_density = c["links"] / max(1, c["text"])
        score = c["text"] * (1 - min(0.9, link_density)) * c.get("bonus", 1.0)
        if score > best_score:
            best, best_score = c, score
    whole = p.containers[0]
    # if the chosen container holds much less than the page's prose, fall back to whole page
    chosen = best if best_score and best["text"] > 0.35 * whole["text"] else whole
    blocks = [p.blocks[i] for i in sorted(set(chosen["blocks"]))]
    # drop navigation-like runs: 5+ consecutive short items with no sentence punctuation
    def _short(b):
        return b["t"] in ("li", "p", "h") and len(b["text"]) < 45 and not re.search(r"[.!?:]$", b["text"])
    keep = [True] * len(blocks)
    i = 0
    while i < len(blocks):
        j = i
        while j < len(blocks) and _short(blocks[j]):
            j += 1
        if j - i >= 5:
            for x in range(i, j):
                keep[x] = False
        i = max(j, i + 1)
    blocks = [b for b, k in zip(blocks, keep) if k]
    # drop tiny / boilerplate lines
    clean = []
    seen = set()
    for b in blocks:
        t = b["text"]
        if b["t"] != "code":
            if len(t) < 25 and b["t"] == "p":
                continue
            if re.search(r"(cookie|all rights reserved|sign up|log in|subscribe|privacy policy|terms of (use|service)|©)", t, re.I) and len(t) < 200:
                continue
        key = t[:120]
        if key in seen:
            continue
        seen.add(key)
        clean.append(b)
    title = html.unescape(p.meta.get("og:title") or p.title or "").strip()
    return {
        "url": url,
        "title": re.sub(r"\s+", " ", title),
        "description": html.unescape(p.meta.get("og:description") or p.meta.get("description") or ""),
        "site": p.meta.get("og:site_name", ""),
        "published": p.meta.get("article:published_time", ""),
        "blocks": clean,
        "text": "\n".join(b["text"] for b in clean if b["t"] != "code"),
        "code": [b["text"] for b in clean if b["t"] == "code" and len(b["text"]) > 30][:12],
        "chars": sum(len(b["text"]) for b in clean),
    }


def strip_tags(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()
