# -*- coding: utf-8 -*-
"""Find-the-bug exercises. Each has buggy `code`, a `test` harness appended at run time
(prints ALL TESTS PASSED), a hint, an explanation and the fixed `solution`.
Run with tools.run_code; verified by scripts/check-debug.py (buggy fails, solution passes)."""

PASS = "ALL TESTS PASSED"

EXERCISES = [
    # ------------------------------------------------------------------ python
    {"id": "dbg-binary-search", "title": "Binary search never terminates", "lang": "python", "level": 1, "topic": "dsa",
     "story": "The search hangs (or misses the last element) on some inputs.",
     "code": '''def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid
        else:
            hi = mid - 1
    return -1
''',
     "solution": '''def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
''',
     "test": '''
import signal
signal.signal(signal.SIGALRM, lambda *a: (_ for _ in ()).throw(TimeoutError("infinite loop")))
signal.alarm(2)
assert search([1, 3, 5, 7], 7) == 3
assert search([1, 3, 5, 7], 1) == 0
assert search([1, 3, 5, 7], 4) == -1
assert search([5], 5) == 0
assert search([], 1) == -1
print("ALL TESTS PASSED")
''',
     "hint": "Look at the loop condition and at how lo moves when nums[mid] < target.",
     "explain": "lo = mid can loop forever when hi = lo + 1, and `lo < hi` skips checking the final remaining element. Use `while lo <= hi` with `lo = mid + 1`."},

    {"id": "dbg-mutable-default", "title": "Shopping carts share items", "lang": "python", "level": 1, "topic": "python",
     "story": "Every new cart already contains items from previous carts.",
     "code": '''def add_item(item, cart=[]):
    cart.append(item)
    return cart
''',
     "solution": '''def add_item(item, cart=None):
    if cart is None:
        cart = []
    cart.append(item)
    return cart
''',
     "test": '''
assert add_item("apple") == ["apple"]
assert add_item("pear") == ["pear"]
assert add_item("x", ["a"]) == ["a", "x"]
print("ALL TESTS PASSED")
''',
     "hint": "When is a default argument value created?",
     "explain": "Default values are evaluated once at function definition, so the same list is reused across calls. Default to None and create a new list inside."},

    {"id": "dbg-sliding-window", "title": "Longest unique substring is off", "lang": "python", "level": 2, "topic": "dsa",
     "story": "Returns wrong lengths for inputs like 'abba'.",
     "code": '''def longest_unique(s):
    last = {}
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best
''',
     "solution": '''def longest_unique(s):
    last = {}
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best
''',
     "test": '''
assert longest_unique("abcabcbb") == 3
assert longest_unique("bbbbb") == 1
assert longest_unique("pwwkew") == 3
assert longest_unique("abba") == 2
assert longest_unique("") == 0
print("ALL TESTS PASSED")
''',
     "hint": "Can `left` ever move backwards?",
     "explain": "A character last seen before the current window must not move left backwards. Only jump when last[ch] >= left (or use left = max(left, last[ch] + 1))."},

    {"id": "dbg-merge-intervals", "title": "Merge intervals misses overlaps", "lang": "python", "level": 2, "topic": "dsa",
     "story": "Some overlapping meetings are not merged.",
     "code": '''def merge(intervals):
    out = []
    for s, e in intervals:
        if out and s <= out[-1][1]:
            out[-1][1] = e
        else:
            out.append([s, e])
    return out
''',
     "solution": '''def merge(intervals):
    out = []
    for s, e in sorted(intervals):
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out
''',
     "test": '''
assert merge([[1, 3], [2, 6], [8, 10]]) == [[1, 6], [8, 10]]
assert merge([[8, 10], [1, 3], [2, 6]]) == [[1, 6], [8, 10]]
assert merge([[1, 10], [2, 3]]) == [[1, 10]]
assert merge([]) == []
print("ALL TESTS PASSED")
''',
     "hint": "Two bugs: input order, and what happens when one interval contains another.",
     "explain": "Intervals must be sorted by start first, and the merged end is max(previous end, e) — a contained interval must not shrink it."},

    {"id": "dbg-lru", "title": "LRU cache evicts the wrong key", "lang": "python", "level": 2, "topic": "dsa",
     "story": "Recently read keys get evicted.",
     "code": '''from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.d = OrderedDict()

    def get(self, key):
        return self.d.get(key, -1)

    def put(self, key, value):
        self.d[key] = value
        self.d.move_to_end(key)
        if len(self.d) > self.cap:
            self.d.popitem(last=True)
''',
     "solution": '''from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.d = OrderedDict()

    def get(self, key):
        if key not in self.d:
            return -1
        self.d.move_to_end(key)
        return self.d[key]

    def put(self, key, value):
        self.d[key] = value
        self.d.move_to_end(key)
        if len(self.d) > self.cap:
            self.d.popitem(last=False)
''',
     "test": '''
c = LRUCache(2)
c.put(1, 1); c.put(2, 2)
assert c.get(1) == 1
c.put(3, 3)
assert c.get(2) == -1
assert c.get(3) == 3
c.put(4, 4)
assert c.get(1) == -1
assert c.get(3) == 3 and c.get(4) == 4
print("ALL TESTS PASSED")
''',
     "hint": "Does get() refresh recency? Which end of the OrderedDict is least recently used?",
     "explain": "get must move the key to the end (most recent), and eviction must pop the FIRST item (last=False), which is the least recently used."},

    {"id": "dbg-retry", "title": "Retry helper hammers the server", "lang": "python", "level": 2, "topic": "microservices",
     "story": "During an outage this retry wrapper makes things worse, and it retries errors that can never succeed.",
     "code": '''class NotRetryable(Exception):
    pass

def with_retry(fn, attempts=4, base=0.1, sleep=None):
    delays = []
    for i in range(attempts):
        try:
            return fn(), delays
        except Exception:
            if i == attempts - 1:
                raise
            delays.append(base)
            if sleep:
                sleep(base)
''',
     "solution": '''class NotRetryable(Exception):
    pass

def with_retry(fn, attempts=4, base=0.1, sleep=None):
    delays = []
    for i in range(attempts):
        try:
            return fn(), delays
        except NotRetryable:
            raise
        except Exception:
            if i == attempts - 1:
                raise
            d = base * (2 ** i)
            delays.append(d)
            if sleep:
                sleep(d)
''',
     "test": '''
calls = {"n": 0}
def flaky():
    calls["n"] += 1
    if calls["n"] < 4:
        raise IOError("boom")
    return "ok"
res, delays = with_retry(flaky)
assert res == "ok"
assert delays == [0.1, 0.2, 0.4], delays
n = {"c": 0}
def bad():
    n["c"] += 1
    raise NotRetryable("400")
try:
    with_retry(bad)
except NotRetryable:
    pass
assert n["c"] == 1, "non-retryable errors must not be retried"
print("ALL TESTS PASSED")
''',
     "hint": "Constant delay → synchronized retry storms. And some errors (4xx) should fail fast.",
     "explain": "Use exponential backoff (base × 2^i, plus jitter in production) and re-raise non-retryable errors immediately."},

    {"id": "dbg-race", "title": "Counter loses increments under threads", "lang": "python", "level": 2, "topic": "os",
     "story": "A metrics counter reports fewer events than happened.",
     "code": '''import threading

class Counter:
    def __init__(self):
        self.value = 0

    def incr(self):
        v = self.value
        for _ in range(50):
            pass
        self.value = v + 1
''',
     "solution": '''import threading

class Counter:
    def __init__(self):
        self.value = 0
        self.lock = threading.Lock()

    def incr(self):
        with self.lock:
            v = self.value
            for _ in range(50):
                pass
            self.value = v + 1
''',
     "test": '''
import sys
sys.setswitchinterval(1e-6)
c = Counter()
def work():
    for _ in range(2000):
        c.incr()
ts = [threading.Thread(target=work) for _ in range(8)]
[t.start() for t in ts]; [t.join() for t in ts]
assert c.value == 16000, c.value
print("ALL TESTS PASSED")
''',
     "hint": "Read-modify-write on shared state without synchronization.",
     "explain": "Two threads can read the same value and both write v+1. Guard the read-modify-write with a lock (or use an atomic)."},

    {"id": "dbg-pagination", "title": "Pagination skips and repeats records", "lang": "python", "level": 2, "topic": "databases",
     "story": "A job paginates through orders by page number while new orders keep arriving; some orders are processed twice and some never.",
     "code": '''def fetch_page(rows, page, size):
    # rows: list of dicts sorted by id; simulates SELECT ... ORDER BY id LIMIT size OFFSET page*size
    return rows[page * size:(page + 1) * size]

def process_all(db, size, on_page=None):
    seen, page = [], 0
    while True:
        batch = fetch_page(db, page, size)
        if not batch:
            return seen
        seen += [r["id"] for r in batch]
        if on_page:
            on_page()
        page += 1
''',
     "solution": '''def fetch_after(rows, last_id, size):
    # simulates SELECT ... WHERE id > last_id ORDER BY id LIMIT size   (keyset pagination)
    return [r for r in rows if r["id"] > last_id][:size]

def process_all(db, size, on_page=None):
    seen, last = [], 0
    while True:
        batch = fetch_after(db, last, size)
        if not batch:
            return seen
        seen += [r["id"] for r in batch]
        last = batch[-1]["id"]
        if on_page:
            on_page()
''',
     "test": '''
db = [{"id": i} for i in range(1, 11)]
state = {"n": 0}
def delete_processed():
    # after each page, an archiver deletes the oldest row (already processed)
    state["n"] += 1
    db.pop(0)
seen = process_all(db, 3, delete_processed)
assert sorted(seen) == list(range(1, 11)), seen
assert len(seen) == len(set(seen))
print("ALL TESTS PASSED")
''',
     "hint": "OFFSET is positional — what if rows before the offset disappear or appear between pages?",
     "explain": "OFFSET pagination shifts when the underlying data changes. Keyset (seek) pagination — WHERE id > last_seen ORDER BY id LIMIT n — is stable and also faster on large tables."},

    {"id": "dbg-idempotency", "title": "Duplicate charges on retries", "lang": "python", "level": 3, "topic": "microservices",
     "story": "Clients retry POST /payments on timeouts; customers get charged twice.",
     "code": '''class PaymentService:
    def __init__(self):
        self.charges = []

    def charge(self, idempotency_key, customer, amount):
        charge_id = "ch_%d" % (len(self.charges) + 1)
        self.charges.append((charge_id, customer, amount))
        return charge_id
''',
     "solution": '''class PaymentService:
    def __init__(self):
        self.charges = []
        self.by_key = {}

    def charge(self, idempotency_key, customer, amount):
        if idempotency_key in self.by_key:
            prev = self.by_key[idempotency_key]
            if prev[1:] != (customer, amount):
                raise ValueError("idempotency key reused with different parameters")
            return prev[0]
        charge_id = "ch_%d" % (len(self.charges) + 1)
        self.charges.append((charge_id, customer, amount))
        self.by_key[idempotency_key] = (charge_id, customer, amount)
        return charge_id
''',
     "test": '''
s = PaymentService()
a = s.charge("k1", "c1", 100)
b = s.charge("k1", "c1", 100)
assert a == b and len(s.charges) == 1
c = s.charge("k2", "c1", 100)
assert c != a and len(s.charges) == 2
try:
    s.charge("k1", "c1", 999)
    assert False, "reusing a key with different params must fail"
except ValueError:
    pass
print("ALL TESTS PASSED")
''',
     "hint": "The idempotency key is passed in but never used.",
     "explain": "Store key → result; on a repeat return the stored result instead of charging again, and reject a key reused with different parameters. In production, store it in the same DB transaction as the charge with a unique constraint."},

    {"id": "dbg-rate-limiter", "title": "Token bucket lets bursts through", "lang": "python", "level": 3, "topic": "system-design",
     "story": "After an idle hour, a client can fire thousands of requests at once.",
     "code": '''class TokenBucket:
    def __init__(self, rate, capacity, now):
        self.rate, self.capacity = rate, capacity
        self.tokens, self.last = capacity, now

    def allow(self, now):
        self.tokens += (now - self.last) * self.rate
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False
''',
     "solution": '''class TokenBucket:
    def __init__(self, rate, capacity, now):
        self.rate, self.capacity = rate, capacity
        self.tokens, self.last = capacity, now

    def allow(self, now):
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False
''',
     "test": '''
b = TokenBucket(rate=1, capacity=5, now=0)
assert sum(b.allow(0) for _ in range(10)) == 5
allowed = sum(b.allow(3600) for _ in range(100))
assert allowed == 5, allowed
assert b.allow(3600) is False
assert b.allow(3601) is True
print("ALL TESTS PASSED")
''',
     "hint": "What bounds the number of tokens?",
     "explain": "Refill must be capped at capacity; otherwise idle time accumulates unlimited tokens."},

    {"id": "dbg-topo", "title": "Course schedule says a cycle is fine", "lang": "python", "level": 3, "topic": "dsa",
     "story": "can_finish returns True for impossible prerequisite graphs.",
     "code": '''def can_finish(n, prereqs):
    graph = {i: [] for i in range(n)}
    for a, b in prereqs:
        graph[b].append(a)
    visited = set()
    def dfs(u):
        if u in visited:
            return True
        visited.add(u)
        return all(dfs(v) for v in graph[u])
    return all(dfs(i) for i in range(n))
''',
     "solution": '''def can_finish(n, prereqs):
    graph = {i: [] for i in range(n)}
    for a, b in prereqs:
        graph[b].append(a)
    state = [0] * n          # 0 = new, 1 = on current path, 2 = done
    def dfs(u):
        if state[u] == 1:
            return False     # back edge -> cycle
        if state[u] == 2:
            return True
        state[u] = 1
        ok = all(dfs(v) for v in graph[u])
        state[u] = 2
        return ok
    return all(dfs(i) for i in range(n))
''',
     "test": '''
assert can_finish(2, [[1, 0]]) is True
assert can_finish(2, [[1, 0], [0, 1]]) is False
assert can_finish(3, [[1, 0], [2, 1], [0, 2]]) is False
assert can_finish(4, [[1, 0], [2, 0], [3, 1], [3, 2]]) is True
print("ALL TESTS PASSED")
''',
     "hint": "A single visited set can't distinguish 'finished' from 'currently on the recursion stack'.",
     "explain": "Cycle detection in a directed graph needs three colours: white/gray/black. Revisiting a GRAY node (on the current path) is a cycle; revisiting a BLACK node is fine."},

    {"id": "dbg-cache-stampede", "title": "Cache returns stale data after update", "lang": "python", "level": 2, "topic": "system-design",
     "story": "Users update their profile but keep seeing the old name.",
     "code": '''class ProfileService:
    def __init__(self, db, cache):
        self.db, self.cache = db, cache

    def get(self, uid):
        if uid in self.cache:
            return self.cache[uid]
        v = self.db[uid]
        self.cache[uid] = v
        return v

    def update(self, uid, name):
        self.cache[uid] = self.db.get(uid)
        self.db[uid] = name
''',
     "solution": '''class ProfileService:
    def __init__(self, db, cache):
        self.db, self.cache = db, cache

    def get(self, uid):
        if uid in self.cache:
            return self.cache[uid]
        v = self.db[uid]
        self.cache[uid] = v
        return v

    def update(self, uid, name):
        self.db[uid] = name
        self.cache.pop(uid, None)      # invalidate AFTER the write (cache-aside)
''',
     "test": '''
s = ProfileService({1: "Asha"}, {})
assert s.get(1) == "Asha"
s.update(1, "Asha K")
assert s.get(1) == "Asha K"
s.update(2, "New")
assert s.get(2) == "New"
print("ALL TESTS PASSED")
''',
     "hint": "In cache-aside, what should happen to the cache entry on write, and in which order?",
     "explain": "Write the database first, then delete (invalidate) the cache key so the next read repopulates it. Writing the old value into the cache guarantees staleness."},

    {"id": "dbg-float-money", "title": "Invoice totals are off by a paisa", "lang": "python", "level": 1, "topic": "python",
     "story": "Finance reports totals like 0.30000000000000004.",
     "code": '''def invoice_total(items):
    # items: list of (price_string, qty)
    total = 0.0
    for price, qty in items:
        total += float(price) * qty
    return total
''',
     "solution": '''from decimal import Decimal

def invoice_total(items):
    total = Decimal("0")
    for price, qty in items:
        total += Decimal(price) * qty
    return total
''',
     "test": '''
from decimal import Decimal
assert invoice_total([("0.10", 1), ("0.20", 1)]) == Decimal("0.30")
assert invoice_total([("19.99", 3)]) == Decimal("59.97")
print("ALL TESTS PASSED")
''',
     "hint": "Binary floating point can't represent 0.1 exactly.",
     "explain": "Use Decimal (or integer minor units like paise/cents) for money, never float."},

    {"id": "dbg-kth-largest", "title": "Kth largest returns the kth smallest", "lang": "python", "level": 1, "topic": "dsa",
     "story": "The leaderboard shows the wrong score.",
     "code": '''import heapq

def kth_largest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[-1]
''',
     "solution": '''import heapq

def kth_largest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]
''',
     "test": '''
assert kth_largest([3, 2, 1, 5, 6, 4], 2) == 5
assert kth_largest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4) == 4
assert kth_largest([1], 1) == 1
print("ALL TESTS PASSED")
''',
     "hint": "In a min-heap of the k largest, where is the smallest of them?",
     "explain": "heapq is a min-heap stored as a list: the minimum is heap[0]. heap[-1] is just some leaf."},

    # ------------------------------------------------------------------ javascript
    {"id": "dbg-js-closure", "title": "All buttons log the same index", "lang": "javascript", "level": 1, "topic": "frontend",
     "story": "Every handler reports the last index.",
     "code": '''function makeHandlers(n) {
  var handlers = [];
  for (var i = 0; i < n; i++) {
    handlers.push(function () { return i; });
  }
  return handlers;
}
''',
     "solution": '''function makeHandlers(n) {
  const handlers = [];
  for (let i = 0; i < n; i++) {
    handlers.push(function () { return i; });
  }
  return handlers;
}
''',
     "test": '''
const hs = makeHandlers(3);
if (hs.map((h) => h()).join(",") !== "0,1,2") throw new Error("got " + hs.map((h) => h()).join(","));
console.log("ALL TESTS PASSED");
''',
     "hint": "var is function-scoped; how many `i` bindings exist?",
     "explain": "With var there is one shared i, which is n when handlers run. let creates a fresh binding per iteration."},

    {"id": "dbg-js-async", "title": "Totals computed before data arrives", "lang": "javascript", "level": 2, "topic": "frontend",
     "story": "The dashboard total is always 0.",
     "code": '''const fetchPrice = (id) => new Promise((r) => setTimeout(() => r(id * 10), 5));

async function total(ids) {
  let sum = 0;
  ids.forEach(async (id) => {
    sum += await fetchPrice(id);
  });
  return sum;
}
''',
     "solution": '''const fetchPrice = (id) => new Promise((r) => setTimeout(() => r(id * 10), 5));

async function total(ids) {
  const prices = await Promise.all(ids.map((id) => fetchPrice(id)));
  return prices.reduce((a, b) => a + b, 0);
}
''',
     "test": '''
total([1, 2, 3]).then((v) => {
  if (v !== 60) throw new Error("expected 60, got " + v);
  console.log("ALL TESTS PASSED");
});
''',
     "hint": "Does forEach wait for async callbacks?",
     "explain": "forEach ignores returned promises, so total returns before any await resolves. Use Promise.all (parallel) or a for…of loop with await (sequential)."},

    # ------------------------------------------------------------------ java
    {"id": "dbg-java-equals", "title": "HashSet keeps 'duplicate' users", "lang": "java", "level": 1, "topic": "java",
     "story": "Deduplicating users with a HashSet doesn't remove duplicates.",
     "code": '''import java.util.*;

class User {
    final String email;
    User(String email) { this.email = email; }

    @Override public boolean equals(Object o) {
        return o instanceof User && ((User) o).email.equals(email);
    }
}
''',
     "solution": '''import java.util.*;

class User {
    final String email;
    User(String email) { this.email = email; }

    @Override public boolean equals(Object o) {
        return o instanceof User && ((User) o).email.equals(email);
    }

    @Override public int hashCode() { return email.hashCode(); }
}
''',
     "test": '''
public class Main {
    public static void main(String[] a) {
        Set<User> s = new HashSet<>();
        s.add(new User("a@x.com")); s.add(new User("a@x.com")); s.add(new User("b@x.com"));
        if (s.size() != 2) throw new AssertionError("size " + s.size());
        System.out.println("ALL TESTS PASSED");
    }
}
''',
     "hint": "What contract does HashSet rely on besides equals?",
     "explain": "Equal objects must have equal hash codes. Without hashCode(), each instance uses identity hashing and lands in a different bucket."},

    {"id": "dbg-java-concurrent-mod", "title": "ConcurrentModificationException when removing", "lang": "java", "level": 1, "topic": "java",
     "story": "Removing inactive sessions crashes.",
     "code": '''import java.util.*;

class Sessions {
    static List<Integer> removeOdd(List<Integer> ids) {
        for (Integer id : ids) {
            if (id % 2 == 1) ids.remove(id);
        }
        return ids;
    }
}
''',
     "solution": '''import java.util.*;

class Sessions {
    static List<Integer> removeOdd(List<Integer> ids) {
        ids.removeIf(id -> id % 2 == 1);
        return ids;
    }
}
''',
     "test": '''
public class Main {
    public static void main(String[] a) {
        List<Integer> r = Sessions.removeOdd(new ArrayList<>(List.of(1, 2, 3, 4, 5, 6)));
        if (!r.equals(List.of(2, 4, 6))) throw new AssertionError(r.toString());
        System.out.println("ALL TESTS PASSED");
    }
}
''',
     "hint": "You can't structurally modify a list while a for-each iterator walks it.",
     "explain": "Use Iterator.remove() or Collection.removeIf; the for-each iterator detects the modification and throws."},

    {"id": "dbg-java-deadlock", "title": "Bank transfers deadlock", "lang": "java", "level": 3, "topic": "os",
     "story": "Two simultaneous transfers A→B and B→A hang forever.",
     "code": '''class Account {
    final int id; int balance;
    Account(int id, int balance) { this.id = id; this.balance = balance; }
}

class Bank {
    static void transfer(Account from, Account to, int amt) {
        synchronized (from) {
            try { Thread.sleep(5); } catch (InterruptedException e) {}
            synchronized (to) {
                from.balance -= amt; to.balance += amt;
            }
        }
    }
}
''',
     "solution": '''class Account {
    final int id; int balance;
    Account(int id, int balance) { this.id = id; this.balance = balance; }
}

class Bank {
    static void transfer(Account from, Account to, int amt) {
        Account first = from.id < to.id ? from : to, second = first == from ? to : from;
        synchronized (first) {
            try { Thread.sleep(5); } catch (InterruptedException e) {}
            synchronized (second) {
                from.balance -= amt; to.balance += amt;
            }
        }
    }
}
''',
     "test": '''
public class Main {
    public static void main(String[] args) throws Exception {
        Account a = new Account(1, 100), b = new Account(2, 100);
        Thread t1 = new Thread(() -> { for (int i = 0; i < 20; i++) Bank.transfer(a, b, 1); });
        Thread t2 = new Thread(() -> { for (int i = 0; i < 20; i++) Bank.transfer(b, a, 1); });
        t1.setDaemon(true); t2.setDaemon(true);
        t1.start(); t2.start(); t1.join(3000); t2.join(3000);
        if (t1.isAlive() || t2.isAlive()) { System.out.println("DEADLOCK"); System.exit(1); }
        if (a.balance + b.balance != 200) throw new AssertionError("money lost");
        System.out.println("ALL TESTS PASSED");
    }
}
''',
     "hint": "Coffman's circular-wait condition: both threads take the same two locks in opposite orders.",
     "explain": "Acquire locks in a global order (e.g. by account id) so a cycle of waiting can never form. Alternatives: tryLock with timeout, or a single-writer design."},
]

BY_ID = {e["id"]: e for e in EXERCISES}


def public():
    return [{k: e[k] for k in ("id", "title", "lang", "level", "topic", "story", "code", "test", "hint")} for e in EXERCISES]


def reveal(eid):
    e = BY_ID.get(eid)
    return {"solution": e["solution"], "explain": e["explain"]} if e else None
