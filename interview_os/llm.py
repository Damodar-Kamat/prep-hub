"""Optional local LLM (never Claude, never required).

Works with any OpenAI-compatible local server — Ollama (http://localhost:11434),
LM Studio (http://localhost:1234), llama.cpp server (http://localhost:8080).
Everything in Interview OS has a non-LLM path; when a local model is available,
agents use it to polish answers, act as a conversational interviewer and grade.
"""
import json
import urllib.request

from . import db

DEFAULTS = {"enabled": True, "base_url": "http://localhost:11434/v1", "model": "", "timeout": 120}
CANDIDATES = ["http://localhost:11434/v1", "http://localhost:1234/v1", "http://localhost:8080/v1"]


def config():
    c = dict(DEFAULTS)
    c.update(db.kv_get("llm", {}) or {})
    return c


def _get(url, timeout=2):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return json.loads(r.read().decode())


def detect():
    """Return {"available": bool, "base_url", "models": [...]}"""
    c = config()
    urls = [c["base_url"]] + [u for u in CANDIDATES if u != c["base_url"]]
    for u in urls:
        try:
            j = _get(u.rstrip("/") + "/models")
            models = [m.get("id") for m in j.get("data", []) if m.get("id")]
            if models:
                return {"available": True, "base_url": u, "models": models}
        except Exception:
            continue
    return {"available": False, "base_url": c["base_url"], "models": []}


_status = {"checked": 0, "info": None}


def status(force=False):
    import time
    if force or not _status["info"] or time.time() - _status["checked"] > 60:
        _status["info"] = detect()
        _status["checked"] = time.time()
    info = dict(_status["info"])
    c = config()
    info["enabled"] = c["enabled"]
    info["model"] = c["model"] or (info["models"][0] if info["models"] else "")
    info["ready"] = bool(info["available"] and c["enabled"] and info["model"])
    return info


def chat(messages, temperature=0.4, max_tokens=900, json_mode=False):
    st = status()
    if not st["ready"]:
        raise RuntimeError("no local LLM available")
    body = {"model": st["model"], "messages": messages, "temperature": temperature, "max_tokens": max_tokens, "stream": False}
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    req = urllib.request.Request(st["base_url"].rstrip("/") + "/chat/completions", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=config()["timeout"]) as r:
        j = json.loads(r.read().decode())
    return j["choices"][0]["message"]["content"].strip()


def ready():
    try:
        return status()["ready"]
    except Exception:
        return False
