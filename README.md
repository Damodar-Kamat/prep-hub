# Prep Hub + ⚡ Interview OS

A local, offline-first study workspace for a software-engineering job switch — now with
**Interview OS**: web-research agents, a voice mock interviewer, spaced-repetition
flashcards, company intel, a JD matcher, a story bank and a study planner.

## ⚡ Interview OS — start here

```
./start.sh            # or double-click "Interview OS.command" in Finder
# → http://localhost:8777   (Prep Hub library at http://localhost:8777/index.html)
```

Pure Python 3.9+ standard library. **No pip installs, no API keys, no Claude/OpenAI.**
Press **⌘K** (or `/`) anywhere: research any topic, paste any URL, jump anywhere.

| Screen | What it does |
| --- | --- |
| **Home** | Readiness per area (library progress + mock scores + stories), streak, today's plan, due cards, upcoming interviews, activity heatmap, trending engineering on HN |
| **Research agent** | Plans sub-queries → meta-searches DuckDuckGo / Brave / Bing, Wikipedia, Stack Overflow (via API, incl. accepted answers), Hacker News, GitHub, arXiv, dev.to → reads the best pages (with reader-proxy & Wayback fallbacks for blocked sites) → cited cheat-sheet: definition, how it works, advantages, trade-offs, real-world use, pitfalls, harvested interview Q&A, code, related topics, further reading. **Deep** mode reads 12+ sources. “X vs Y” auto-switches to a comparison report. Paste a URL to **digest** any article |
| **Mock interview** | 13 tracks (~200 rubric'd questions + everything you mine). Interviewer speaks (TTS); you answer by **voice** (speech recognition) or typing. Graded on key-point coverage, STAR structure, quantified impact, “I vs we” ownership, trade-offs, Big-O, fillers, pace; follow-up probes; hints; retry; session reports; gaps → flashcards. Company-tailored behavioral (e.g. Amazon LPs). System design shows a live framework checklist |
| **Flashcards** | SM-2 spaced repetition. Auto-seeded from every library topic + interview question + the question bank; agents/mocks/notes add more. Keyboard: space, 1–4 |
| **Study plan** | Day-by-day plan to your interview date: DSA roadmap in order, concept deep dives, mocks every 3 days, weekly reviews, taper before the day |
| **Company intel** | Agent reads interview experiences (GfG, LeetCode Discuss, Reddit, Glassdoor snippets, blogs, HN) → process/rounds, hot topics, LeetCode problems actually mentioned, reported questions, candidate tips, company values, engineering blog |
| **Applications** | Kanban pipeline (Wishlist → Offer) with interview dates, comp, notes |
| **JD matcher** | Weighted skills from a JD, resume match %, missing ATS keywords, gaps with study links, likely questions, which mock tracks to drill |
| **Story bank** | STAR stories mapped to 15 behavioral themes, coverage matrix, story scoring |
| **Code lab** | Runs Java / Python / C++ / JS **locally** with stdin |
| **Question bank** | All questions + rubrics; **⛏️ Question miner** agent harvests Q&A pairs for any topic from the web into your mock tracks |
| **Notebook** | Markdown notes + saved agent reports, SQLite FTS5 full-text search |
| **Eng. blogs & HN** | 24 engineering blogs (Netflix, Meta, Cloudflare, Discord, Stripe, AWS, ByteByteGo, Confluent…) refreshed every 3h, auto-tagged by skill; digest any post |

**Optional local LLM** (still not Claude): run [Ollama](https://ollama.com) / LM Studio / llama.cpp
(`brew install ollama && ollama pull llama3.1:8b`). Interview OS auto-detects it and adds
synthesized answers, LLM grading + model answers in mocks, and prep strategies. Everything works without it.

**Your data stays private.** This repo is public code only. Personal data lives in `private/`
(ignored here), which is its own git repo pushed to a **private** GitHub repo (`prep-hub-data`):
`private/progress.json` (library progress — the **Save** button writes it, commits and pushes, no file picker)
and `private/backup.json` (Interview OS snapshot, refreshed every 10 min when it changes).
The live database is `os-data/user.db`; `os-data/cache.db` is a disposable web cache.

New machine: clone this repo, then `git clone https://github.com/<you>/prep-hub-data private`
inside it, run `./start.sh`, and Settings → Import `private/backup.json`.

Architecture: `server.py` (router + static) · `interview_os/` — `search.py` (meta-search + RRF fusion),
`reader.py` + `extract.py` (readability extraction), `nlp.py` (TF-IDF, extractive summarisation with MMR,
RAKE key-phrases, question mining, rubric matching), `agents.py` (research/compare/company/mine/digest),
`interviewer.py` + `bank.py` (mock interviews), `tools.py` (SM-2, planner, JD analyser, code runner, feeds),
`knowledge.py` (library index, skills taxonomy, company values) · `os/` — vanilla JS front end.

---

## 📚 Prep Hub library

## Run it

No build step. Either:

- **Double-click `index.html`** (works in most browsers), or
- Serve the folder (recommended, avoids any file:// quirks):

  ```
  cd prep-hub
  python3 -m http.server 8000
  # open http://localhost:8000
  ```

## What's inside

| Tab | Contents |
| --- | --- |
| **Dashboard** | Progress overview per section |
| **DSA Plan** | The 150-problem NeetCode-style roadmap in study order, per-problem recall rating, spaced-repetition review queue, day-streak + activity heatmap. **Start here.** |
| **DSA Concepts** | 13 topics — Big-O, arrays, hashing, two pointers, stacks, linked lists, recursion, trees, heaps, graphs, DP, sorting/binary search, tries/DSU/Fenwick/bits |
| **CS Fundamentals** | 12 topics — OOP, SOLID, design patterns, OS (processes, scheduling, memory, deadlock), DBMS (normalization, indexing/transactions, SQL vs NoSQL/CAP), networking (TCP/IP, HTTP/DNS) |
| **Computer Hardware** | 5 topics — CPU & pipelining, memory hierarchy & caches, number representation & floats, storage (HDD/SSD/RAID), I/O / interrupts / DMA / syscalls |
| **Low-Level Design** | 8 topics — LLD method + worked designs: parking lot, LRU/LFU, rate limiter, Splitwise, elevator, vending machine, concurrency patterns |
| **System Design (HLD)** | 11 topics — framework, scaling, load balancing, caching, DB scaling, messaging, consistency/CAP/consensus, microservices/observability; worked: URL shortener, news feed, chat |
| **Behavioral & Career** | STAR + story bank, common lead-level questions, offer evaluation & negotiation, a 10–12 week prep plan |
| **DSA Practice** | 40 problems · language selector (**Java** default, Python, C++, JavaScript) · concept tab, progressive hints, editorial |
| **Last-Minute Prep** | Every topic's key points on one searchable page |

Each concept topic has **★ Key points** (fast revision) and a deep **📖 Deep dive** — multi-section explanation, worked code, complexity analysis, comparison tables, an SVG diagram where it helps, common pitfalls, and likely interview questions.

### DSA Practice — languages

- **JavaScript** runs **offline** in a sandboxed Web Worker and is **auto-graded** against the visible + hidden test cases (▶ Run examples / ✓ Submit).
- **Java / Python / C++** compile and run on the public [Wandbox](https://wandbox.org) sandbox — **needs internet**. The starter is a complete program with a `main()` that runs the example inputs; hit **▶ Run** and compare the printed output to the examples. The ✓ auto-grader is JavaScript-only.
- Your choice is remembered per browser (`prephub.lang`, default **Java**); code is saved **per problem per language**.

## How to actually master DSA (the method)

Open the **DSA Plan** tab and work the patterns in order. One resource, ~45 min a day, don't break the streak.

**Per problem:** brute force → set a 25-min timer → if stuck, study the editorial, then
**re-implement from a blank file** → rate your recall (😖 bombed / 🤔 shaky / ✅ got it).
Shaky/bombed problems auto-schedule a review in 2–3 days; "got it" twice = mastered.
The **Due for review** panel and the streak counter keep it compounding instead of leaking.

## How studying works

- Each topic has **★ Key points** (fast brush-up) and **📖 Deep dive** (full explanation, code, diagrams, pitfalls, likely interview questions).
- Tick the checkbox when a topic is solid.
- Progress + your problem code are always cached in the browser's `localStorage`.

## Not losing your data

Every change is always cached in the browser's `localStorage` immediately. To persist it
outside the browser you click **Save** (like a document editor).

### The Save button

- The footer shows **● Unsaved changes** (pulsing **Save** button) whenever you have
  changes not yet written out.
- **Served by Interview OS (`./start.sh`, recommended):** **Save** writes `private/progress.json`,
  commits it and pushes it to your private `prep-hub-data` repo. Nothing else to set up.
- **Opened as a plain file (`file://`) in Chrome / Edge / Brave:** click **Connect progress file**
  once and pick `private/progress.json`; **Save** then writes it on disk.
- **Firefox (file mode):** **Save** downloads a `progress.json` — drop it into `private/`.
- The browser warns you if you try to close the tab with unsaved changes.

### Git backup — private, one commit per Save

`progress.json` is **not** in this public repo. It lives in `private/`, a separate git repo
pushed to a private GitHub repo. With Interview OS running, every Save is committed + pushed
automatically. In file mode, use the scripts (they only touch `private/`):

```
./scripts/watch-backup.sh      # run in a terminal tab while studying — commits + pushes each Save
./scripts/backup.sh            # or run by hand for a checkpoint
```

## Extending

- Add a study topic: edit the relevant file in `data/` and push a new object into that section's `topics` array (fields: `id`, `title`, `tags`, `brushup[]`, `detail` HTML, optional `diagram` SVG, `pitfalls[]`, `interviewQs[]`).
- Add a practice problem: append to `data/problems.js` (fields include `fnName`, `starter`, `tests[]` with `{input:[...args], expected, hidden?, unordered?}`, `hints[]`, `solution`).

Tell me what to add or change next.
