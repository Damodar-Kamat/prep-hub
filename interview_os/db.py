"""SQLite storage: user data (user.db, back it up) and a web cache (cache.db, disposable)."""
import json
import os
import sqlite3
import threading
import time

from . import DATA_DIR

USER_DB = os.path.join(DATA_DIR, "user.db")
CACHE_DB = os.path.join(DATA_DIR, "cache.db")

_local = threading.local()
# SQLite allows one writer at a time; agents write the web cache from many threads, so serialise writes.
WLOCK = threading.RLock()


def _conn(path):
    key = "c_" + os.path.basename(path)
    c = getattr(_local, key, None)
    if c is None:
        c = sqlite3.connect(path, timeout=30, check_same_thread=False)
        c.row_factory = sqlite3.Row
        c.execute("PRAGMA journal_mode=WAL")
        c.execute("PRAGMA foreign_keys=ON")
        setattr(_local, key, c)
    return c


def user():
    return _conn(USER_DB)


def cache():
    return _conn(CACHE_DB)


SCHEMA_USER = """
CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT);

CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck TEXT NOT NULL DEFAULT 'General',
  front TEXT NOT NULL,
  back TEXT NOT NULL DEFAULT '',
  source TEXT DEFAULT '',
  ext_id TEXT UNIQUE,
  ease REAL NOT NULL DEFAULT 2.5,
  interval REAL NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  due REAL NOT NULL DEFAULT 0,
  created REAL NOT NULL,
  suspended INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS cards_due ON cards(due);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER, grade INTEGER, ts REAL
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'note',   -- note | research | company | jd
  tags TEXT NOT NULL DEFAULT '',
  meta TEXT NOT NULL DEFAULT '{}',
  created REAL NOT NULL,
  updated REAL NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0
);

CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(title, body, tags, content='notes', content_rowid='id');
CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, title, body, tags) VALUES (new.id, new.title, new.body, new.tags);
END;
CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, body, tags) VALUES ('delete', old.id, old.title, old.body, old.tags);
END;
CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, body, tags) VALUES ('delete', old.id, old.title, old.body, old.tags);
  INSERT INTO notes_fts(rowid, title, body, tags) VALUES (new.id, new.title, new.body, new.tags);
END;

CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'Wishlist',  -- Wishlist, Applied, OA, Phone, Onsite, Offer, Rejected
  next_date TEXT DEFAULT '',
  link TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  salary TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created REAL NOT NULL,
  updated REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  situation TEXT DEFAULT '', task TEXT DEFAULT '', action TEXT DEFAULT '', result TEXT DEFAULT '',
  themes TEXT DEFAULT '',     -- comma separated theme ids
  created REAL NOT NULL, updated REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS mock_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track TEXT, company TEXT DEFAULT '', started REAL, ended REAL,
  score REAL, data TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS activity (
  day TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0, minutes REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS custom_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track TEXT NOT NULL, q TEXT NOT NULL UNIQUE, points TEXT DEFAULT '[]', source TEXT DEFAULT '', created REAL
);
"""

SCHEMA_CACHE = """
CREATE TABLE IF NOT EXISTS http (url TEXT PRIMARY KEY, ts REAL, status INTEGER, ctype TEXT, body BLOB);
CREATE TABLE IF NOT EXISTS results (key TEXT PRIMARY KEY, ts REAL, data TEXT);
CREATE TABLE IF NOT EXISTS feed (
  url TEXT PRIMARY KEY, title TEXT, source TEXT, summary TEXT, published REAL, fetched REAL, tags TEXT DEFAULT ''
);
"""


def init():
    user().executescript(SCHEMA_USER)
    cache().executescript(SCHEMA_CACHE)
    user().commit()
    cache().commit()


def rows(cur):
    return [dict(r) for r in cur.fetchall()]


def kv_get(k, default=None):
    r = user().execute("SELECT v FROM kv WHERE k=?", (k,)).fetchone()
    return json.loads(r["v"]) if r else default


def kv_set(k, v):
    with WLOCK:
        user().execute("INSERT OR REPLACE INTO kv(k, v) VALUES (?, ?)", (k, json.dumps(v)))
        user().commit()


def result_get(key, max_age):
    r = cache().execute("SELECT ts, data FROM results WHERE key=?", (key,)).fetchone()
    if r and time.time() - r["ts"] < max_age:
        return json.loads(r["data"])
    return None


def result_set(key, data):
    with WLOCK:
        cache().execute("INSERT OR REPLACE INTO results(key, ts, data) VALUES (?,?,?)", (key, time.time(), json.dumps(data)))
        cache().commit()


def bump_activity(minutes=0.0):
    day = time.strftime("%Y-%m-%d")
    with WLOCK:
        _bump(day, minutes)


def _bump(day, minutes):
    user().execute(
        "INSERT INTO activity(day, count, minutes) VALUES (?, 1, ?) "
        "ON CONFLICT(day) DO UPDATE SET count = count + 1, minutes = minutes + excluded.minutes",
        (day, minutes),
    )
    user().commit()
