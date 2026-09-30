"""Mock interviewer: builds sessions, grades answers (rubric + STAR + delivery analysis),
chooses follow-up probes. Uses a local LLM for richer grading if one is running."""
import json
import random
import re

from . import bank, db, knowledge, llm, nlp

FILLERS = ["um", "uh", "erm", "like", "basically", "you know", "sort of", "kind of", "actually", "literally", "i mean", "so yeah"]
STAR = {
    "Situation": r"\b(when i was|at my (previous|last|current)|in my (previous|last|current)|we (had|were)|our (team|system|service)|the (situation|context|project) was|back in|a few (months|years) ago|last year)\b",
    "Task": r"\b(my (goal|task|job|responsibility|role) was|i was (responsible|asked|tasked)|i needed to|we needed to|the goal was|had to (deliver|fix|build|reduce|improve))\b",
    "Action": r"\b(i (decided|built|designed|implemented|proposed|led|wrote|created|set up|analy[sz]ed|investigated|talked|reached out|organized|convinced|introduced|migrated|refactored|automated))\b",
    "Result": r"\b(as a result|resulted in|result was|in the end|ultimately|outcome|reduced|increased|improved|saved|cut|grew|launched|shipped|delivered)\b",
}
TRADEOFF = r"\b(trade-?offs?|however|on the other hand|depends|alternatively|downside|drawback|versus|vs\.?|instead of|pros|cons|at the cost of)\b"
SD_PHASE_RX = [
    ("Requirements", r"\b(requirements?|functional|non-functional|scope|clarify|assume|assumption|use cases?)\b"),
    ("Estimation", r"\b(qps|dau|mau|per second|requests?/s|storage|terabytes?|tb|gb|petabytes?|bandwidth|\d+\s*(k|m|million|billion))\b"),
    ("API", r"\b(api|endpoint|post /|get /|rest|grpc|request|response)\b"),
    ("Components", r"\b(load balancer|cache|redis|database|queue|kafka|cdn|service|gateway|worker)\b"),
    ("Data model", r"\b(schema|table|partition key|shard|primary key|index|nosql|sql|cassandra|dynamo)\b"),
    ("Scale & reliability", r"\b(replica|replication|shard|horizontal|failover|availability|consisten|bottleneck|hot key|single point of failure|monitor)\b"),
]


def tracks():
    out = []
    counts = {r["track"]: r["n"] for r in db.rows(db.user().execute("SELECT track, COUNT(*) n FROM custom_questions GROUP BY track"))}
    for k, v in bank.TRACKS.items():
        out.append(dict(v, id=k, count=len(bank.Q.get(k, [])) + counts.get(k, 0), custom=counts.get(k, 0)))
    return out


def _custom(track):
    rs = db.rows(db.user().execute("SELECT q, points, source FROM custom_questions WHERE track=?", (track,)))
    return [{"q": r["q"], "points": json.loads(r["points"] or "[]"), "followups": [], "level": 2, "source": r["source"], "custom": True} for r in rs]


def build_session(track, count=5, level=0, company="", include_custom=True, seed=None):
    rnd = random.Random(seed)
    pool = list(bank.Q.get(track, []))
    if include_custom:
        pool += [c for c in _custom(track) if c["points"]]
    if level:
        lv = [q for q in pool if q.get("level") == level]
        pool = lv if len(lv) >= count else pool
    rnd.shuffle(pool)
    if track == "behavioral":
        intro = [q for q in pool if q["q"].startswith("Tell me about yourself")]
        rest = [q for q in pool if q not in intro]
        pool = intro + rest
    qs = pool[:count]
    vals = knowledge.company_values(company) if company else None
    if vals and track == "behavioral":
        qs = [dict(q, value_hint=rnd.choice(vals["values"])) if i else q for i, q in enumerate(qs)]
    return {"track": track, "track_name": bank.TRACKS.get(track, {}).get("name", track), "company": company,
            "minutes_per_q": bank.TRACKS.get(track, {}).get("minutes", 4), "questions": qs,
            "phases": bank.SD_PHASES if track == "system-design" else None, "values": vals}


def _delivery(answer, seconds):
    low = " " + answer.lower() + " "
    words = len(answer.split())
    fillers = {}
    for f in FILLERS:
        n = len(re.findall(r"\b%s\b" % re.escape(f), low))
        if f == "like":  # only count "like" used as filler (", like," / "like, ")
            n = len(re.findall(r"(,\s*like\b|\blike,)", low))
        if n:
            fillers[f] = n
    wpm = round(words / (seconds / 60.0)) if seconds and seconds > 10 else None
    numbers = len(re.findall(r"\b\d+(\.\d+)?\s*(%|x|ms|s|k|m|million|hours?|days?|weeks?|users?|requests?|qps|tb|gb)?\b", low))
    i_count = len(re.findall(r"\bi\b", low))
    we_count = len(re.findall(r"\bwe\b", low))
    return {"words": words, "fillers": fillers, "filler_total": sum(fillers.values()), "wpm": wpm, "numbers": numbers,
            "i_count": i_count, "we_count": we_count, "tradeoffs": len(re.findall(TRADEOFF, low))}


def evaluate(track, question, answer, seconds=0, spoken=False):
    answer = (answer or "").strip()
    points = question.get("points") or []
    cov, per = nlp.overlap_score(answer, points)
    d = _delivery(answer, seconds if spoken else 0)
    strengths, improve = [], []
    score = 0.0

    if track == "behavioral":
        star = {k: bool(re.search(p, answer, re.I)) for k, p in STAR.items()}
        star_score = sum(star.values()) / 4.0
        quant = min(1.0, d["numbers"] / 2.0)
        ownership = 1.0 if d["i_count"] >= max(3, d["we_count"] * 0.6) else 0.5 if d["i_count"] else 0.0
        length = 1.0 if 150 <= d["words"] <= 450 else 0.6 if 80 <= d["words"] < 150 or 450 < d["words"] <= 650 else 0.25
        score = 10 * (0.30 * star_score + 0.25 * cov + 0.15 * quant + 0.15 * ownership + 0.15 * length)
        missing = [k for k, v in star.items() if not v]
        if not missing:
            strengths.append("Clear STAR structure — situation, task, action and result all present.")
        else:
            improve.append("STAR gaps: add the %s. %s" % (", ".join(missing),
                           "End with a concrete, measurable result." if "Result" in missing else ""))
        if d["numbers"] >= 2:
            strengths.append("Quantified impact (%d numbers) — interviewers love measurable results." % d["numbers"])
        else:
            improve.append("Quantify: add numbers (% improvement, latency, $ saved, users affected, time to deliver).")
        if ownership < 1:
            improve.append("Say “I” more than “we” (%d × I vs %d × we) — make YOUR actions and decisions explicit." % (d["i_count"], d["we_count"]))
        else:
            strengths.append("Strong ownership language — your personal actions are clear.")
        if d["words"] < 150:
            improve.append("Too short (%d words). Aim for ~2 minutes / 250–400 words with specifics." % d["words"])
        elif d["words"] > 650:
            improve.append("Too long (%d words). Trim context; spend 60%% of the time on your actions." % d["words"])
        extra = {"star": star}
    elif track == "system-design":
        phases = {k: bool(re.search(p, answer, re.I)) for k, p in SD_PHASE_RX}
        ph = sum(phases.values()) / len(phases)
        depth = min(1.0, d["words"] / 500.0)
        to = min(1.0, d["tradeoffs"] / 3.0)
        score = 10 * (0.35 * cov + 0.30 * ph + 0.20 * to + 0.15 * depth)
        miss_ph = [k for k, v in phases.items() if not v]
        if miss_ph:
            improve.append("You skipped: %s. Structure: requirements → estimates → API → high-level → data model → deep dive → bottlenecks." % ", ".join(miss_ph))
        else:
            strengths.append("Covered every phase of the design framework.")
        if d["tradeoffs"] >= 3:
            strengths.append("Good trade-off discussion (%d explicit trade-offs)." % d["tradeoffs"])
        else:
            improve.append("Discuss trade-offs explicitly (“X gives us …, at the cost of …; alternatively …”).")
        extra = {"phases": phases}
    else:
        depth = 1.0 if 60 <= d["words"] <= 400 else 0.6 if d["words"] > 400 else max(0.2, d["words"] / 60.0)
        to = min(1.0, d["tradeoffs"] / 2.0)
        cx = 1.0 if (track != "dsa" or re.search(r"o\s*\(|complexity|linear|logarithmic|quadratic", answer, re.I)) else 0.0
        score = 10 * (0.6 * cov + 0.15 * depth + 0.15 * to + 0.10 * cx)
        if track == "dsa" and not cx:
            improve.append("State time and space complexity (Big-O) for your approach.")
        if d["tradeoffs"]:
            strengths.append("Mentioned trade-offs / alternatives.")
        else:
            improve.append("Mention a trade-off or an alternative approach to show depth.")
        if d["words"] < 40:
            improve.append("Answer is thin (%d words) — explain the why, give an example." % d["words"])
        extra = {}

    covered = [p["point"] for p in per if p["covered"]]
    missed = [p["point"] for p in per if not p["covered"]]
    if covered:
        strengths.insert(0, "Covered %d/%d key points: %s." % (len(covered), len(per), "; ".join(covered[:4])))
    if missed:
        improve.insert(0, "Missed key points: " + "; ".join(missed[:5]) + ".")
    if d["filler_total"] >= 4:
        improve.append("Filler words: %s — pause instead." % ", ".join("%s×%d" % (k, v) for k, v in sorted(d["fillers"].items(), key=lambda x: -x[1])[:4]))
    if d["wpm"] and d["wpm"] > 190:
        improve.append("Speaking fast (%d wpm). Slow down to ~130–160 wpm." % d["wpm"])

    llm_fb = None
    if llm.ready() and answer:
        try:
            raw = llm.chat([
                {"role": "system", "content": "You are a strict senior interviewer at a top tech company. Grade candidly. Reply JSON only."},
                {"role": "user", "content": json.dumps({"question": question["q"], "track": track, "expected_points": points, "answer": answer}) +
                 '\nReturn {"score": 0-10, "strengths": [..], "improvements": [..], "better_answer": "a concise model answer"}'}],
                json_mode=True, max_tokens=700, temperature=0.2)
            llm_fb = json.loads(raw[raw.find("{"): raw.rfind("}") + 1])
            score = 0.5 * score + 0.5 * float(llm_fb.get("score", score))
        except Exception:
            llm_fb = None

    score = round(max(0.0, min(10.0, score)), 1)
    verdict = "Strong Hire" if score >= 8 else "Hire" if score >= 6.5 else "Lean Hire" if score >= 5 else "Lean No Hire" if score >= 3.5 else "No Hire"
    followup = None
    if missed and track != "behavioral":
        followup = "You didn't touch on “%s”. How would that factor into your answer?" % missed[0]
    elif question.get("followups"):
        followup = random.choice(question["followups"])
    elif track == "behavioral":
        followup = random.choice(["What would you do differently if it happened again?", "How did you measure success?",
                                  "What was the hardest part for you personally?", "What did your manager say about it?"])
    return {"score": score, "verdict": verdict, "coverage": round(cov, 2), "points": per, "strengths": strengths,
            "improvements": improve, "delivery": d, "followup": followup, "model_points": points, "llm": llm_fb, **extra}


def save_session(data):
    scores = [a.get("eval", {}).get("score") for a in data.get("answers", []) if a.get("eval")]
    avg = round(sum(scores) / len(scores), 1) if scores else None
    cur = db.user().execute("INSERT INTO mock_sessions(track, company, started, ended, score, data) VALUES (?,?,?,?,?,?)",
                            (data.get("track"), data.get("company", ""), data.get("started"), data.get("ended"), avg, json.dumps(data)))
    db.user().commit()
    db.bump_activity(minutes=max(0, ((data.get("ended") or 0) - (data.get("started") or 0)) / 60.0))
    return {"id": cur.lastrowid, "score": avg}
