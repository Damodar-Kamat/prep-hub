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
| **DSA Concepts** | 13 topics — Big-O, arrays, hashing, two pointers, stacks, linked lists, recursion, trees, heaps, graphs, DP, sorting/binary search, tries/DSU/bits |
| **CS Fundamentals** | OOP, SOLID, design patterns, OS (processes, scheduling, memory, deadlock), DBMS (normalization, indexing/transactions, SQL vs NoSQL), networking (TCP/IP, HTTP/DNS) |
| **Computer Hardware** | CPU & pipelining, memory hierarchy & caches, number representation, storage (HDD/SSD/RAID), I/O & interrupts |
| **Low-Level Design** | LLD method + worked designs: parking lot, LRU/LFU, rate limiter, Splitwise, concurrency patterns |
| **System Design (HLD)** | Framework, scaling, load balancing, caching, DB scaling, messaging, consistency/CAP, microservices; worked: URL shortener, news feed |
| **Behavioral & Career** | STAR + story bank, common questions, negotiation, a 10–12 week prep plan |
| **DSA Practice** | 20 problems with a real in-browser JavaScript runner (example + hidden tests), concept tab, hints, editorial |
| **Last-Minute Prep** | Every topic's key points on one searchable page |

## How studying works

- Each topic has **★ Key points** (fast brush-up) and **📖 Deep dive** (full explanation, code, diagrams, pitfalls, likely interview questions).
- Tick the checkbox when a topic is solid.
- Progress + your problem code are always cached in the browser's `localStorage`.

## Not losing your data

### Durable file (Chrome / Edge / Brave)

The footer has **Connect progress file**. Click it once and pick `progress.json` in this
folder. From then on the app **auto-saves to that real file on disk** (debounced, ~1s) on
every checkbox tick and code edit, and reloads from it on startup. The footer shows
`Saved → progress.json` when it's active.

- The browser remembers the file across restarts. After a full browser restart it may need
  one click on **Reconnect progress file** (a browser security requirement for a fresh
  file-permission grant).
- Firefox does **not** support this API, so on Firefox the app stays on `localStorage` and
  you use **Export / Import** in the footer to move data. (This was a deliberate call — the
  feature can't be built for Firefox.)

### Git auto-backup

`progress.json` is tracked in this git repo. Two scripts:

```
./scripts/watch-backup.sh      # run in a terminal tab while studying — auto-commits changes (every 15s, or on fs events if `fswatch` is installed)
./scripts/backup.sh            # one-shot: commit right now if there's anything to commit
```

So the flow is: **Connect progress file** in the browser → run `./scripts/watch-backup.sh`
→ study. Every change lands in `progress.json` and gets committed automatically with a
timestamp. Your history accumulates; roll back with normal `git` if you ever need to.

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
