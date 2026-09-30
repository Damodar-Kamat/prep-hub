"""Interview OS — local interview-prep backend.

Pure Python standard library (3.9+). No API keys, no Claude, no pip installs.
Agents pull knowledge from the open web (Brave/Bing search, Wikipedia,
StackExchange, Hacker News, GitHub, dev.to, arXiv, engineering-blog RSS) and
process it locally with classic NLP (TF-IDF, TextRank-style ranking, MMR).
An optional local LLM (Ollama / LM Studio / llama.cpp, OpenAI-compatible)
is used when present, never required.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.environ.get("IOS_DATA_DIR", os.path.join(ROOT, "os-data"))
os.makedirs(DATA_DIR, exist_ok=True)
