"""Classic, dependency-free NLP: tokenising, light stemming, TF-IDF, extractive
summarisation (query relevance + centrality + MMR diversity), key-phrase
extraction (RAKE-style) and interview-question mining."""
import math
import re
from collections import Counter

STOP = set("""a about above after again against all almost also am an and any are aren't as at be because been before
being below between both but by can cannot could couldn't did didn't do does doesn't doing don't down during each either
else ever every few for from further get gets got had hadn't has hasn't have haven't having he her here hers herself him
himself his how however i if in into is isn't it it's its itself just let's like may me might more most much must my
myself need no nor not now of off often on once one only or other ought our ours ourselves out over own per quite rather
really same say says shall she should shouldn't since so some such than that that's the their theirs them themselves then
there there's these they they're this those though through thus to too two under until up upon us use used uses using
very via was wasn't we we're were weren't what what's when where which while who whom whose why will with within without
won't would wouldn't yet you you're your yours yourself yourselves also e.g i.e etc vs let lets make makes made many way
ways well want see new first last get like will one can thing things lot lots actually basically simply example
""".split())

JUNK = re.compile(r"(please help improve|citation needed|this article|this section|additional citations|reliable sources|"
                  r"unsourced material|may be challenged|you might also like|related articles|table of contents|"
                  r"all rights reserved|cookies?|sign up|log ?in|subscribe|newsletter|advertis|sponsored|"
                  r"read more|click here|follow us|share this|comments? section)", re.I)

WORD = re.compile(r"[A-Za-z][A-Za-z0-9+#.\-']*[A-Za-z0-9+#]|[A-Za-z]")


def stem(w):
    w = w.lower()
    if len(w) <= 3:
        return w
    for suf, rep in (("ational", "ate"), ("ization", "ize"), ("iveness", "ive"), ("fulness", "ful"), ("ousness", "ous"),
                     ("ingly", ""), ("ically", "ic"), ("ities", "ity"), ("ation", "ate"), ("ments", "ment"),
                     ("ness", ""), ("ing", ""), ("ies", "y"), ("ied", "y"), ("ers", "er"), ("edly", ""),
                     ("ed", ""), ("ly", ""), ("es", ""), ("s", "")):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            if suf == "s" and w.endswith("ss"):
                return w
            if suf == "es" and not re.search(r"(ss|x|ch|sh|z)es$", w):
                return w[:-1]
            return w[: -len(suf)] + rep
    return w


def words(text):
    return WORD.findall(text or "")


def tokens(text, keep_stop=False):
    out = []
    for w in words(text):
        lw = w.lower().strip(".'-")
        if not lw or (not keep_stop and lw in STOP):
            continue
        out.append(stem(lw))
    return out


_ABBR = r"(?<!\be\.g)(?<!\bi\.e)(?<!\betc)(?<!\bvs)(?<!\bMr)(?<!\bDr)(?<!\bSt)"


def sentences(text):
    out = []
    for line in (text or "").split("\n"):
        line = re.sub(r"\s+", " ", line.replace("**", "")).strip()
        line = re.sub(r"^(Figure|Fig\.|Image|Source)\s*\d*\s*[:.-][^.]*?(?=[A-Z][a-z]+ [a-z])", "", line).strip()
        if not line:
            continue
        parts = re.split(_ABBR + r"(?<=[.!?])\s+(?=[A-Z0-9\"'(\[])", line)
        out.extend(p.strip() for p in parts if 30 <= len(p.strip()) <= 600)
    return out


class TfIdf:
    def __init__(self, docs_tokens):
        self.n = len(docs_tokens)
        df = Counter()
        for toks in docs_tokens:
            df.update(set(toks))
        self.idf = {t: math.log((1 + self.n) / (1 + c)) + 1 for t, c in df.items()}

    def vec(self, toks):
        tf = Counter(toks)
        v = {t: (1 + math.log(c)) * self.idf.get(t, 1.0) for t, c in tf.items()}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        return {t: x / norm for t, x in v.items()}


def cos(a, b):
    if len(a) > len(b):
        a, b = b, a
    return sum(x * b.get(t, 0.0) for t, x in a.items())


def summarize(docs, query="", k=10, max_per_doc=4, lambda_=0.7):
    """docs: list of {"id", "text"}. Returns ranked sentence dicts {text, doc, score}.
    Score = relevance to query + centrality to the corpus; MMR keeps them diverse."""
    cand = []
    for d in docs:
        for i, s in enumerate(sentences(d["text"])[:400]):
            if JUNK.search(s) or s.count(" ") < 5 or (not s.endswith(".") and s.count(" ") < 10) or s.endswith("?") or s.endswith(":") or re.search(r"(click|subscribe|cookie|newsletter|sign in|log in|share this|read more|advertis)", s, re.I):
                continue
            cand.append({"text": s, "doc": d["id"], "pos": i})
    if not cand:
        return []
    toks = [tokens(c["text"]) for c in cand]
    tf = TfIdf(toks)
    vecs = [tf.vec(t) for t in toks]
    qv = tf.vec(tokens(query)) if query else {}
    # corpus centroid
    centroid = Counter()
    for v in vecs:
        for t, x in v.items():
            centroid[t] += x
    cn = math.sqrt(sum(x * x for x in centroid.values())) or 1.0
    centroid = {t: x / cn for t, x in centroid.items()}
    # how many documents mention each sentence's key terms (cross-source agreement)
    for c, v, t in zip(cand, vecs, toks):
        rel = cos(qv, v) if qv else 0.0
        cen = cos(centroid, v)
        pos_bonus = 0.08 if c["pos"] < 3 else 0.0
        length_pen = 0.0 if 60 <= len(c["text"]) <= 320 else -0.05
        first_person = -0.12 if re.match(r"^(i|i'm|i've|my|we're|hi|hello|thanks)\b", c["text"], re.I) or re.search(r"\b(i think|i believe|i guess|in my opinion|my question)\b", c["text"], re.I) else 0.0
        definitional = 0.06 if re.search(r"\b(is a|is an|refers to|means|allows|ensures|guarantees|is used to)\b", c["text"]) else 0.0
        c["base"] = 0.55 * rel + 0.45 * cen + pos_bonus + length_pen + definitional + first_person
        c["vec"] = v
    chosen, per_doc = [], Counter()
    pool = sorted(cand, key=lambda c: -c["base"])[:300]
    while pool and len(chosen) < k:
        best, best_s = None, -1e9
        for c in pool:
            if per_doc[c["doc"]] >= max_per_doc:
                continue
            red = max((cos(c["vec"], s["vec"]) for s in chosen), default=0.0)
            s = lambda_ * c["base"] - (1 - lambda_) * red
            if red > 0.6:
                continue
            if s > best_s:
                best, best_s = c, s
        if not best:
            break
        chosen.append(best)
        per_doc[best["doc"]] += 1
        pool.remove(best)
    return [{"text": c["text"], "doc": c["doc"], "score": round(c["base"], 3)} for c in chosen]


def keyphrases(text, k=15, min_count=1):
    """RAKE-ish: candidate phrases split on stopwords/punctuation, scored by word degree/frequency."""
    text = (text or "")[:200_000]
    chunks = re.split(r"[.,;:!?()\[\]{}\"“”\n|/\\]+", text)
    phrases = []
    for ch in chunks:
        cur = []
        for w in re.findall(r"[A-Za-z][A-Za-z0-9+#\-]*", ch):
            if w.lower() in STOP or len(w) < 2:
                if cur:
                    phrases.append(cur)
                cur = []
            else:
                cur.append(w.lower())
        if cur:
            phrases.append(cur)
    phrases = [p for p in phrases if 1 <= len(p) <= 4]
    freq, deg = Counter(), Counter()
    for p in phrases:
        for w in p:
            freq[w] += 1
            deg[w] += len(p) - 1
    score = Counter()
    for p in phrases:
        key = " ".join(p)
        score[key] += sum((deg[w] + freq[w]) / freq[w] for w in p)
    counts = Counter(" ".join(p) for p in phrases)
    out = []
    for ph, s in score.most_common(200):
        if counts[ph] < min_count or len(ph) < 3 or ph.isdigit() or JUNK.search(ph) or re.search(r"(articles|references|wikipedia|retrieved|isbn|archived|default (true|false)|environment variable)", ph):
            continue
        if any(ph in o or o in ph for o, _ in out):
            continue
        out.append((ph, round(s / max(1, counts[ph]) * math.log(1 + counts[ph]), 2)))
        if len(out) >= k:
            break
    return [p for p, _ in out]


Q_START = re.compile(r"^(what|why|how|when|which|explain|describe|design|implement|compare|difference|tell me|walk me|"
                     r"can you|could you|given|write|find|should|is it|do you|have you|would you|define|list)\b", re.I)


IMPERATIVE = re.compile(r"^(explain|describe|design|implement|compare|tell me about|walk me through|write|define|"
                        r"differentiate|discuss|list)\b", re.I)


def mine_questions(text, topic="", limit=40):
    """Pull interview-style questions out of arbitrary page text."""
    out, seen = [], set()
    cands = re.split(r"(?<=[?])\s+|\n+", text or "")
    for c in cands:
        c = re.sub(r"^\s*(q(uestion)?\s*\d*[:.)-]|\d+[.)]|[-*•])\s*", "", c.strip(), flags=re.I).strip()
        if not (15 <= len(c) <= 260):
            continue
        if not (c.endswith("?") or Q_START.match(c)):
            continue
        if not c.endswith("?") and not IMPERATIVE.match(c):
            continue
        if re.search(r"(cookie|subscribe|newsletter|sign up|log ?in|comment|share|ads?\b|privacy|click here)", c, re.I):
            continue
        if c.endswith("?") is False and len(c) > 160:
            continue
        key = " ".join(tokens(c))
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(c if c.endswith("?") or c.endswith(".") else c + "?")
        if len(out) >= limit:
            break
    if topic:
        tt = set(tokens(topic))
        out.sort(key=lambda q: -len(tt & set(tokens(q))))
    return out


GENERIC = {stem(w) for w in """company time team work thing way good great people project problem issue result
specific concrete example clear keep make show give data system user users high low small large""".split()}
SYN = {"latency": ["fast", "slow", "millisecond", "ms", "p99", "response"], "scale": ["scalab", "horizontal", "shard", "partition"],
       "cache": ["redis", "memcach", "cdn"], "queue": ["kafka", "sqs", "rabbitmq", "pubsub", "broker"],
       "database": ["db", "postgres", "mysql", "sql", "nosql", "cassandra", "dynamo", "mongo"],
       "measur": ["metric", "number", "percent", "%", "reduc", "increas"], "quantifi": ["percent", "%", "reduc", "increas", "saved"],
       "stakehold": ["manager", "team", "product", "customer", "client"], "complex": ["o(", "big-o", "linear", "logarithm"]}


def overlap_score(answer, points):
    """For each expected point, fraction of its distinctive tokens (with light synonym
    expansion) present in the answer. Returns (coverage 0..1, per-point list)."""
    at = set(tokens(answer))
    low = (answer or "").lower()
    per = []
    has_num = bool(re.search(r"\d", low))
    for p in points:
        alts = re.findall(r"\(([^)]*)\)", p)
        if alts:  # "results (latency, cost, revenue)" → any listed alternative counts for the whole list
            alt_toks = set(tokens(" ".join(alts)))
            main = [t for t in set(tokens(re.sub(r"\([^)]*\)", " ", p))) if len(t) > 2 and t not in GENERIC]
            alt_hit = bool(alt_toks & at)
            main_hit = sum(1 for t in main if t in at or (t.startswith(("quantif", "measur", "number", "metric")) and has_num))
            ok = alt_hit and (not main or main_hit >= 1)
            per.append({"point": p, "hit": round((alt_hit + main_hit) / (1 + len(main)), 2), "covered": ok})
            continue
        pt = [t for t in set(tokens(p)) if len(t) > 2 and t not in GENERIC]
        if not pt:
            continue
        hits = 0
        for t in pt:
            if t in at or any(t.startswith(k) and any(x in low for x in v) for k, v in SYN.items()):
                hits += 1
        hit = hits / len(pt)
        need = 1 if len(pt) <= 2 else 2
        per.append({"point": p, "hit": round(hit, 2), "covered": hit >= 0.45 and hits >= need})
    cov = sum(1 for x in per if x["covered"]) / len(per) if per else 0.0
    return cov, per
