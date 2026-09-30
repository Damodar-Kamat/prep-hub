/* Python for interviews and production. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "python",
  title: "Python",
  icon: "🐍",
  blurb: "Python's data model and semantics, built-in data structures and their complexity, functions/decorators/generators, OOP internals, concurrency (GIL, asyncio, multiprocessing), typing, testing and performance.",
  topics: [
    {
      id: "py-core",
      title: "Python Semantics: Objects, Mutability, Scope, the Data Model",
      summary: "Everything in Python is an object with an identity, type and value — how names bind to objects, mutability, scoping rules and dunder methods.",
      tags: ["python", "must-know"],
      brushup: [
        "Variables are <b>names bound to objects</b>; assignment never copies. Arguments are passed by <b>object reference</b> (\"call by sharing\").",
        "Mutable: list, dict, set, bytearray, most user objects. Immutable: int, float, str, tuple, frozenset, bytes.",
        "<code>is</code> compares identity; <code>==</code> compares value (<code>__eq__</code>). Only use <code>is</code> for None/sentinels.",
        "<b>LEGB</b> scope lookup: Local → Enclosing → Global → Built-in; <code>nonlocal</code>/<code>global</code> to rebind outer names.",
        "Mutable default arguments are evaluated once at definition → shared across calls (use None).",
        "Shallow vs deep copy: <code>list(x)</code>/<code>x.copy()</code>/<code>copy.copy</code> vs <code>copy.deepcopy</code>.",
        "Data model: <code>__init__</code>, <code>__repr__</code>, <code>__eq__</code>/<code>__hash__</code>, <code>__len__</code>, <code>__iter__</code>, <code>__getitem__</code>, <code>__enter__/__exit__</code>, <code>__call__</code>.",
        "Truthiness: empty containers, 0, None, False are falsy.",
      ],
      detail: `
<h2>Names and objects</h2>
<pre><code>a = [1, 2]
b = a            # same object
b.append(3)      # a is now [1, 2, 3]
def f(xs): xs.append(4)     # mutates caller's list
def g(xs): xs = [9]         # rebinds local name only; caller unaffected</code></pre>

<h2>The mutable default trap</h2>
<pre><code>def add(item, bucket=[]):      # evaluated ONCE
    bucket.append(item); return bucket
add(1); add(2)                 # → [1, 2]  (surprise)
def add(item, bucket=None):
    if bucket is None: bucket = []
    bucket.append(item); return bucket</code></pre>

<h2>Closures and late binding</h2>
<pre><code>fns = [lambda: i for i in range(3)]
[f() for f in fns]             # [2, 2, 2] — i looked up at call time
fns = [lambda i=i: i for i in range(3)]   # [0, 1, 2]</code></pre>

<h2>Hashability</h2>
<p>Dict keys/set members need <code>__hash__</code> consistent with <code>__eq__</code>. Defining <code>__eq__</code> sets <code>__hash__ = None</code> unless you define it. Tuples are hashable only if their contents are.</p>

<h2>Dataclasses</h2>
<pre><code>from dataclasses import dataclass, field
@dataclass(frozen=True, slots=True)
class Point:
    x: float
    y: float
    tags: tuple[str, ...] = ()
# generated __init__, __repr__, __eq__, and (frozen) __hash__; slots saves memory</code></pre>`,
      pitfalls: [
        "Mutable default arguments.",
        "Using `is` to compare strings or numbers.",
        "[[0] * 3] * 3 creates three references to the same inner list.",
        "Modifying a list while iterating over it.",
      ],
      interviewQs: [
        "Is Python pass-by-value or pass-by-reference?",
        "Explain mutable default arguments.",
        "What's the difference between is and ==?",
        "Shallow vs deep copy?",
        "What does LEGB mean?",
        "When is an object hashable?",
      ],
      resources: [
        { t: "Fluent Python (2nd ed.) — Luciano Ramalho", u: "https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/", k: "book", n: "best book for deep Python" },
        { t: "Python data model (official)", u: "https://docs.python.org/3/reference/datamodel.html", k: "docs" },
        { t: "Ned Batchelder — Facts and myths about Python names and values", u: "https://nedbatchelder.com/text/names.html", k: "article" },
      ],
    },
    {
      id: "py-ds",
      title: "Built-in Data Structures, Complexity & the Standard Library Toolkit",
      summary: "How lists, dicts and sets work internally, their time complexities, and the collections/heapq/bisect/itertools tools that make interview code short.",
      tags: ["python", "dsa", "must-know"],
      brushup: [
        "<b>list</b>: dynamic array — O(1) index/append (amortized), O(n) insert/delete at front, O(n) <code>in</code>.",
        "<b>dict</b>: open-addressing hash table, insertion-ordered (3.7+), O(1) average get/set/delete.",
        "<b>set</b>: hash table of keys; O(1) membership; set algebra (| &amp; - ^).",
        "<b>collections</b>: deque (O(1) both ends — BFS), Counter, defaultdict, OrderedDict (move_to_end for LRU), namedtuple.",
        "<b>heapq</b>: min-heap on a list (heappush/heappop/nlargest); negate for max-heap; tuples for priority.",
        "<b>bisect</b>: binary search on sorted lists (bisect_left/insort).",
        "<b>itertools</b>: permutations, combinations, product, accumulate, groupby, chain, islice; <b>functools</b>: lru_cache/cache, reduce, partial.",
        "Strings are immutable → build with ''.join(parts), not += in loops.",
      ],
      detail: `
<h2>Complexity cheat sheet</h2>
<table>
<tr><th>Operation</th><th>list</th><th>dict / set</th><th>deque</th></tr>
<tr><td>index / get</td><td>O(1)</td><td>O(1) avg</td><td>O(n) middle</td></tr>
<tr><td>append / add</td><td>O(1)*</td><td>O(1) avg</td><td>O(1) both ends</td></tr>
<tr><td>pop(0) / popleft</td><td>O(n)</td><td>—</td><td>O(1)</td></tr>
<tr><td>x in c</td><td>O(n)</td><td>O(1) avg</td><td>O(n)</td></tr>
<tr><td>sort</td><td>O(n log n) Timsort, stable</td><td>—</td><td>—</td></tr>
</table>

<h2>Interview idioms</h2>
<pre><code>from collections import Counter, defaultdict, deque
import heapq, bisect
from functools import cache

Counter("mississippi").most_common(2)            # [('i', 4), ('s', 4)]
graph = defaultdict(list); graph[u].append(v)
q = deque([start]); q.popleft()                   # BFS
heapq.nsmallest(3, nums); heapq.heappush(h, (dist, node))
i = bisect.bisect_left(sorted_list, target)
@cache
def fib(n): return n if n &lt; 2 else fib(n-1) + fib(n-2)
sorted(people, key=lambda p: (-p.age, p.name))    # multi-key sort
anagram_groups = defaultdict(list)
for w in words: anagram_groups["".join(sorted(w))].append(w)</code></pre>

<h2>LRU cache with OrderedDict</h2>
<pre><code>from collections import OrderedDict
class LRU:
    def __init__(self, cap): self.cap, self.d = cap, OrderedDict()
    def get(self, k):
        if k not in self.d: return -1
        self.d.move_to_end(k); return self.d[k]
    def put(self, k, v):
        self.d[k] = v; self.d.move_to_end(k)
        if len(self.d) &gt; self.cap: self.d.popitem(last=False)</code></pre>`,
      pitfalls: [
        "list.pop(0) or list.insert(0, x) in a loop (O(n²)) — use deque.",
        "x in list inside a loop — convert to a set first.",
        "Recursion depth limit (~1000) for deep DFS — use iteration or sys.setrecursionlimit carefully.",
        "heapq is min-heap only; comparing tuples with non-comparable payloads (add a counter tiebreaker).",
      ],
      interviewQs: [
        "How is a Python dict implemented?",
        "Why is deque better than list for a queue?",
        "How would you implement a max-heap with heapq?",
        "What does functools.lru_cache do?",
        "Time complexity of `x in list` vs `x in set`?",
      ],
      resources: [
        { t: "Python wiki — Time complexity", u: "https://wiki.python.org/moin/TimeComplexity", k: "docs" },
        { t: "collections — container datatypes", u: "https://docs.python.org/3/library/collections.html", k: "docs" },
        { t: "itertools recipes", u: "https://docs.python.org/3/library/itertools.html#itertools-recipes", k: "docs" },
      ],
    },
    {
      id: "py-functions",
      title: "Functions, Decorators, Generators & Context Managers",
      summary: "Python's first-class functions and the three power tools built on them: decorators, lazy generators and context managers.",
      tags: ["python", "decorators", "generators"],
      brushup: [
        "Functions are objects: pass them, return them, store them; closures capture enclosing variables.",
        "<b>Decorator</b> = callable taking a function and returning a replacement; use <code>functools.wraps</code> to keep metadata; decorators with arguments add one more level.",
        "<b>Generators</b> (yield) produce values lazily and keep state between calls → constant memory pipelines; <code>yield from</code> delegates.",
        "Generator expressions <code>(x*x for x in xs)</code> vs list comprehensions (eager).",
        "Iterator protocol: <code>__iter__</code> + <code>__next__</code>, StopIteration.",
        "<b>Context managers</b>: <code>with</code> guarantees cleanup via <code>__enter__/__exit__</code> or <code>@contextmanager</code>.",
        "*args/**kwargs, keyword-only (after *) and positional-only (before /) parameters.",
      ],
      detail: `
<h2>Decorators</h2>
<pre><code>import functools, time
def timed(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        t = time.perf_counter()
        try: return fn(*args, **kwargs)
        finally: print(f"{fn.__name__} took {time.perf_counter() - t:.3f}s")
    return wrapper

def retry(times=3, exceptions=(Exception,)):
    def deco(fn):
        @functools.wraps(fn)
        def wrapper(*a, **kw):
            for i in range(times):
                try: return fn(*a, **kw)
                except exceptions:
                    if i == times - 1: raise
                    time.sleep(2 ** i)
        return wrapper
    return deco

@retry(times=5, exceptions=(TimeoutError,))
@timed
def fetch(url): ...</code></pre>

<h2>Generators for streaming data</h2>
<pre><code>def read_lines(path):
    with open(path) as f:
        for line in f: yield line.rstrip("\\n")
def parse(lines):
    for l in lines:
        if l: yield json.loads(l)
errors = (r for r in parse(read_lines("app.log")) if r["level"] == "ERROR")
for e in itertools.islice(errors, 10): print(e)       # processes a 50 GB file in constant memory</code></pre>

<h2>Context managers</h2>
<pre><code>from contextlib import contextmanager
@contextmanager
def transaction(conn):
    cur = conn.cursor()
    try:
        yield cur
        conn.commit()
    except Exception:
        conn.rollback(); raise
    finally:
        cur.close()
with transaction(conn) as cur: cur.execute(...)</code></pre>`,
      pitfalls: [
        "Forgetting functools.wraps (breaks introspection, logging, frameworks).",
        "Consuming a generator twice (it's exhausted after one pass).",
        "Catching exceptions inside a contextmanager without re-raising.",
      ],
      interviewQs: [
        "Write a decorator that retries a function with backoff.",
        "What is a generator and when would you use one?",
        "Generator vs list comprehension?",
        "How do context managers work?",
        "Explain *args and **kwargs.",
      ],
      resources: [
        { t: "Real Python — Primer on decorators", u: "https://realpython.com/primer-on-python-decorators/", k: "article" },
        { t: "Real Python — Introduction to generators", u: "https://realpython.com/introduction-to-python-generators/", k: "article" },
      ],
    },
    {
      id: "py-oop",
      title: "Python OOP Internals: Classes, MRO, Descriptors, Metaclasses",
      summary: "How Python classes really work — attribute lookup, inheritance and MRO, properties and descriptors, abstract base classes and protocols.",
      tags: ["python", "oop"],
      brushup: [
        "Attribute lookup: instance __dict__ → class → base classes following the <b>MRO</b> (C3 linearization); <code>super()</code> follows the MRO, not just the parent.",
        "<b>@property</b> for computed/validated attributes; built on the <b>descriptor</b> protocol (__get__/__set__).",
        "@classmethod (alternate constructors), @staticmethod (namespaced function).",
        "<b>__slots__</b> removes per-instance __dict__ → less memory, faster attribute access.",
        "ABCs (abc.ABC, @abstractmethod) vs <b>Protocols</b> (typing.Protocol) for structural typing / duck typing.",
        "Dunder methods make objects behave like built-ins (operators, iteration, containers, callables).",
        "Metaclasses customize class creation (rarely needed; __init_subclass__ and decorators cover most cases).",
        "Composition over inheritance; mixins for reusable behaviour.",
      ],
      detail: `
<h2>MRO and cooperative super()</h2>
<pre><code>class A:
    def hi(self): print("A")
class B(A):
    def hi(self): print("B"); super().hi()
class C(A):
    def hi(self): print("C"); super().hi()
class D(B, C):
    def hi(self): print("D"); super().hi()
D().hi()          # D B C A
D.__mro__         # (D, B, C, A, object)</code></pre>

<h2>Properties and validation</h2>
<pre><code>class Account:
    def __init__(self, balance=0): self.balance = balance
    @property
    def balance(self): return self._balance
    @balance.setter
    def balance(self, v):
        if v &lt; 0: raise ValueError("negative")
        self._balance = v</code></pre>

<h2>Protocols (structural typing)</h2>
<pre><code>from typing import Protocol
class Closeable(Protocol):
    def close(self) -&gt; None: ...
def shutdown(resources: list[Closeable]) -&gt; None:
    for r in resources: r.close()     # any object with close() type-checks — no inheritance needed</code></pre>`,
      pitfalls: [
        "Class attributes holding mutable defaults shared by all instances.",
        "Calling parent __init__ directly in diamond hierarchies instead of super().",
        "Overusing metaclasses/inheritance where functions or composition would do.",
      ],
      interviewQs: [
        "What is the MRO and how does super() use it?",
        "classmethod vs staticmethod?",
        "What are descriptors?",
        "What does __slots__ do?",
        "ABC vs Protocol?",
      ],
      resources: [
        { t: "Descriptor HowTo Guide (official)", u: "https://docs.python.org/3/howto/descriptor.html", k: "docs" },
        { t: "The Python 2.3 MRO (C3) explanation", u: "https://docs.python.org/3/howto/mro.html", k: "docs" },
      ],
    },
    {
      id: "py-concurrency",
      title: "Python Concurrency: GIL, Threads, Multiprocessing, asyncio",
      summary: "Choosing the right concurrency model in Python given the GIL — threads for I/O, processes for CPU, asyncio for massive I/O concurrency.",
      tags: ["python", "concurrency", "asyncio", "must-know"],
      brushup: [
        "The <b>GIL</b> lets only one thread execute Python bytecode at a time per process (CPython) → threads don't speed up CPU-bound Python code.",
        "The GIL is released during blocking I/O and in many C extensions (NumPy) → threads help for I/O-bound work.",
        "CPU-bound → <b>multiprocessing</b> / ProcessPoolExecutor (separate interpreters; pickling overhead).",
        "<b>asyncio</b>: single-threaded event loop, coroutines (async/await), cooperative scheduling → thousands of concurrent sockets.",
        "Never block the event loop (time.sleep, requests, CPU loops) — use await asyncio.sleep, aiohttp/httpx, run_in_executor.",
        "concurrent.futures gives one API for thread and process pools.",
        "Python 3.13+ has an experimental free-threaded (no-GIL) build; 3.12+ per-interpreter GIL for subinterpreters.",
        "Synchronization: threading.Lock, Queue (thread-safe), asyncio.Lock/Queue/Semaphore.",
      ],
      detail: `
<h2>Decision table</h2>
<table>
<tr><th>Workload</th><th>Tool</th></tr>
<tr><td>Many HTTP/DB calls, moderate concurrency</td><td>ThreadPoolExecutor</td></tr>
<tr><td>Thousands of concurrent connections</td><td>asyncio (+ uvloop)</td></tr>
<tr><td>CPU-heavy pure Python</td><td>ProcessPoolExecutor / multiprocessing</td></tr>
<tr><td>Numeric work</td><td>NumPy/Polars (release the GIL, vectorized)</td></tr>
</table>

<h2>asyncio fan-out with limits and timeouts</h2>
<pre><code>import asyncio, httpx
async def fetch_all(urls, limit=20):
    sem = asyncio.Semaphore(limit)
    async with httpx.AsyncClient(timeout=5) as client:
        async def one(u):
            async with sem:
                r = await client.get(u)
                return u, r.status_code
        return await asyncio.gather(*(one(u) for u in urls), return_exceptions=True)
results = asyncio.run(fetch_all(urls))</code></pre>

<h2>Thread and process pools</h2>
<pre><code>from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed
with ThreadPoolExecutor(max_workers=16) as ex:
    futures = {ex.submit(download, u): u for u in urls}
    for f in as_completed(futures): print(futures[f], f.result())
with ProcessPoolExecutor() as ex:              # defaults to CPU count
    hashes = list(ex.map(expensive_hash, chunks, chunksize=64))</code></pre>`,
      pitfalls: [
        "Using threads for CPU-bound Python and expecting speed-ups.",
        "Calling blocking libraries (requests, time.sleep) inside async functions.",
        "Unbounded asyncio.gather over 100k tasks without a semaphore.",
        "Sharing large objects with multiprocessing (pickling cost) — use shared memory or chunking.",
      ],
      interviewQs: [
        "What is the GIL and how does it affect multithreading?",
        "Threads vs processes vs asyncio — when to use each?",
        "How does asyncio work under the hood?",
        "How do you run a blocking function from async code?",
        "How would you download 10,000 URLs quickly in Python?",
      ],
      resources: [
        { t: "asyncio documentation", u: "https://docs.python.org/3/library/asyncio.html", k: "docs" },
        { t: "Real Python — Speed up your program with concurrency", u: "https://realpython.com/python-concurrency/", k: "article" },
        { t: "PEP 703 — Making the GIL optional", u: "https://peps.python.org/pep-0703/", k: "docs" },
      ],
    },
    {
      id: "py-production",
      title: "Production Python: Typing, Testing, Packaging, Performance",
      summary: "Writing maintainable Python services — type hints and checkers, pytest, dependency management, profiling and common performance fixes.",
      tags: ["python", "testing", "typing"],
      brushup: [
        "Type hints + a checker (<b>mypy</b>/pyright) catch bugs early; pydantic validates data at runtime (FastAPI).",
        "<b>pytest</b>: plain asserts, fixtures (scope, yield teardown), parametrize, monkeypatch, tmp_path; mock at boundaries.",
        "Dependencies: virtual environments; pyproject.toml; lock files (uv, Poetry, pip-tools); pin for apps, ranges for libraries.",
        "Lint/format: ruff (lint + format), black.",
        "Profile before optimizing: cProfile, py-spy (sampling, production-safe), line_profiler, memray/tracemalloc for memory.",
        "Speed-ups: better algorithms, built-ins and comprehensions, avoiding attribute lookups in hot loops, vectorization (NumPy/Polars), caching, C extensions/Cython/Rust (PyO3).",
        "Web: FastAPI (async, typed), Django (batteries included), Flask (minimal); run behind gunicorn/uvicorn workers.",
        "Logging with the logging module (structured), not print; config via env vars.",
      ],
      detail: `
<h2>pytest essentials</h2>
<pre><code>import pytest
@pytest.fixture
def repo(tmp_path):
    r = Repo(tmp_path / "db.sqlite"); yield r; r.close()

@pytest.mark.parametrize("amount,ok", [(10, True), (0, False), (-5, False)])
def test_withdraw(repo, amount, ok):
    acct = repo.create(balance=10)
    if ok: acct.withdraw(amount); assert acct.balance == 10 - amount
    else:
        with pytest.raises(ValueError): acct.withdraw(amount)</code></pre>

<h2>Profiling</h2>
<pre><code>python -m cProfile -s cumtime app.py | head -30
py-spy top --pid 1234                  # live view of a running process
py-spy record -o flame.svg --pid 1234</code></pre>

<h2>FastAPI with typed models</h2>
<pre><code>from fastapi import FastAPI
from pydantic import BaseModel, Field
app = FastAPI()
class Order(BaseModel):
    sku: str
    qty: int = Field(gt=0, le=100)
@app.post("/orders")
async def create(order: Order) -&gt; dict:
    return {"ok": True, "sku": order.sku}      # validation, docs (OpenAPI) generated automatically</code></pre>`,
      pitfalls: [
        "Unpinned dependencies in applications → broken deploys.",
        "Mocking so much that tests only test the mocks.",
        "Optimizing without profiling.",
        "Running a single-process dev server in production.",
      ],
      interviewQs: [
        "How do you structure tests in pytest? What are fixtures?",
        "How do you find why a Python service is slow?",
        "How do you manage dependencies reproducibly?",
        "What do type hints buy you in Python?",
        "FastAPI vs Django vs Flask?",
      ],
      resources: [
        { t: "pytest documentation", u: "https://docs.pytest.org/", k: "docs" },
        { t: "mypy documentation", u: "https://mypy.readthedocs.io/", k: "docs" },
        { t: "uv — Python package manager", u: "https://docs.astral.sh/uv/", k: "tool" },
        { t: "py-spy sampling profiler", u: "https://github.com/benfred/py-spy", k: "tool" },
      ],
    },
  ],
});
