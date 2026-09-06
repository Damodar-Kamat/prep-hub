# Prep Hub

A local, offline study workspace for a software-engineering job switch.

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
- **Chrome / Edge / Brave:** click **Connect progress file** once and pick `progress.json`
  in this folder. After that, **Save** writes your progress straight into that file on disk.
  The browser remembers the file; after a full browser restart click **Reconnect progress
  file** once (a browser security rule for re-granting file permission).
- **Firefox:** no File System Access API, so **Save** downloads a `progress.json` you drop
  into this folder (and **Import** loads one back). Deliberate — the silent-file feature
  can't be built for Firefox.
- The browser warns you if you try to close the tab with unsaved changes.

### Git backup — one commit per Save

`progress.json` is tracked in this git repo.

```
./scripts/watch-backup.sh      # run in a terminal tab while studying — commits each Save automatically
./scripts/backup.sh            # or just run this by hand whenever you want a checkpoint
```

Flow: **Connect progress file** (once) → optionally start `./scripts/watch-backup.sh` →
study → click **Save** when you want it persisted. Each Save writes the file and (if the
watcher is running) becomes one timestamped commit. Roll back anytime with normal `git`.

For off-machine backup, add a private remote and push (or just keep the folder in
iCloud/Dropbox):

```
git remote add origin <your-private-repo-url>
git push -u origin main
```

## Extending

- Add a study topic: edit the relevant file in `data/` and push a new object into that section's `topics` array (fields: `id`, `title`, `tags`, `brushup[]`, `detail` HTML, optional `diagram` SVG, `pitfalls[]`, `interviewQs[]`).
- Add a practice problem: append to `data/problems.js` (fields include `fnName`, `starter`, `tests[]` with `{input:[...args], expected, hidden?, unordered?}`, `hints[]`, `solution`).

Tell me what to add or change next.
