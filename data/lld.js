/* Low-Level Design / machine coding. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "lld",
  title: "Low-Level Design",
  icon: "🧱",
  blurb: "Machine-coding rounds: turning requirements into clean class models. Method + worked designs (parking lot, LRU, rate limiter, Splitwise…).",
  topics: [
    {
      id: "lld-method",
      title: "LLD Interview Method",
      tags: ["process", "oop"],
      brushup: [
        "1) Clarify scope & requirements (functional + non-functional), list assumptions, agree on what's out of scope.",
        "2) Identify core entities/nouns → classes; verbs → methods. Define enums for fixed sets of states.",
        "3) Draw relationships: association / aggregation / composition / inheritance. Prefer composition + interfaces.",
        "4) Apply SOLID: one responsibility per class, program to interfaces, inject dependencies.",
        "5) Pick patterns where they fit: Strategy, Factory, Observer, State, Singleton, Builder — don't force them.",
        "6) Handle concurrency (locks, atomics, thread-safe collections) and edge cases. Then code the core flow.",
        "Keep it extensible: 'how would you add X?' should be a new class, not a rewrite.",
      ],
      detail: `
<h2>Time-box (for a 60–90 min round)</h2>
<ul>
<li><b>10 min</b> — requirements, assumptions, API surface. Write them down.</li>
<li><b>15 min</b> — entities, enums, class diagram, relationships.</li>
<li><b>10 min</b> — identify variability points → which pattern absorbs future change.</li>
<li><b>Rest</b> — code the happy path cleanly (compilable), then edge cases & concurrency, then a quick demo in <code>main</code>.</li>
</ul>
<h2>Requirement clarification checklist</h2>
<p>Who are the actors? What are the main use cases? Single machine or distributed? Concurrent users? Persistence needed or in-memory? What must be configurable/pluggable? Scale numbers? What's explicitly out of scope?</p>
<h2>From requirements to classes</h2>
<pre><code>"A user books a seat for a show in a theatre."
nouns  → User, Booking, Seat, Show, Theatre, Screen, Movie
verbs  → book(), cancel(), searchShows(), holdSeat()
states → SeatStatus { AVAILABLE, HELD, BOOKED }, BookingStatus { ... }</code></pre>
<h2>Relationship cheat sheet</h2>
<table>
<tr><th>Relationship</th><th>Meaning</th><th>Lifetime</th><th>Example</th></tr>
<tr><td>Association</td><td>uses / knows</td><td>independent</td><td>Driver — Car</td></tr>
<tr><td>Aggregation</td><td>has-a (shared)</td><td>independent</td><td>Team — Player</td></tr>
<tr><td>Composition</td><td>owns / part-of</td><td>bound</td><td>House — Room</td></tr>
<tr><td>Inheritance</td><td>is-a</td><td>—</td><td>Circle — Shape</td></tr>
</table>
<h2>Red flags interviewers watch for</h2>
<p>God classes, everything <code>public</code>, no interfaces, <code>instanceof</code> ladders, hard-coded values, ignoring thread safety, not asking a single clarifying question.</p>`,
      pitfalls: [
        "Jumping straight to code without listing requirements/assumptions.",
        "Over-engineering: 12 patterns for a to-do app.",
        "One giant class that does everything.",
        "Ignoring concurrency when the prompt clearly implies multiple users.",
      ],
      interviewQs: [
        "How do you decide between aggregation and composition?",
        "Walk me through your process for a machine-coding problem.",
        "Where would you put a Strategy vs a State pattern in your design?",
      ],
    },
    {
      id: "lld-parking-lot",
      title: "Design: Parking Lot",
      tags: ["design", "classic"],
      brushup: [
        "Entities: ParkingLot, Floor/Level, ParkingSpot (with SpotType), Vehicle (hierarchy), Ticket, EntryGate/ExitGate, PaymentProcessor.",
        "SpotType enum { COMPACT, LARGE, BIKE, EV }; VehicleType maps to allowed spot types.",
        "Spot allocation = Strategy (nearest-to-entrance, first-available, least-used floor).",
        "Pricing = Strategy (flat hourly, slab-based, day/night). PaymentProcessor + PaymentStrategy (cash/card/UPI).",
        "Concurrency: assigning a free spot must be atomic — lock per floor or a concurrent free-spot structure; avoid double-allocation.",
        "Extensibility: new vehicle type, new pricing model, multiple lots — all should be additive.",
      ],
      detail: `
<h2>Class sketch</h2>
<pre><code>enum VehicleType { BIKE, CAR, TRUCK, EV }
enum SpotType   { BIKE, COMPACT, LARGE, EV }

abstract class Vehicle { String plate; VehicleType type; }
class Car extends Vehicle { ... }

class ParkingSpot {
  String id; SpotType type; boolean free = true; Vehicle vehicle;
  synchronized boolean assign(Vehicle v){ if(!free) return false; free=false; vehicle=v; return true; }
  synchronized void release(){ free=true; vehicle=null; }
}

class ParkingFloor {
  int level; Map&lt;SpotType, List&lt;ParkingSpot&gt;&gt; spots;
  Optional&lt;ParkingSpot&gt; findSpot(SpotType t){ /* first free */ }
}

interface SpotAllocationStrategy { Optional&lt;ParkingSpot&gt; allocate(List&lt;ParkingFloor&gt; floors, Vehicle v); }

interface PricingStrategy { double price(Ticket t, Instant exit); }

class Ticket { String id; ParkingSpot spot; Instant entryTime; Vehicle vehicle; }

class ParkingLot {                       // facade
  List&lt;ParkingFloor&gt; floors;
  SpotAllocationStrategy allocation;
  PricingStrategy pricing;

  Ticket park(Vehicle v){
    ParkingSpot spot = allocation.allocate(floors, v).orElseThrow(LotFullException::new);
    return new Ticket(UUID.randomUUID().toString(), spot, Instant.now(), v);
  }
  double unpark(Ticket t){
    double amount = pricing.price(t, Instant.now());
    t.spot.release();
    return amount;
  }
}</code></pre>
<h2>Patterns used</h2>
<ul>
<li><b>Strategy</b> — allocation and pricing are pluggable.</li>
<li><b>Factory</b> — build the right <code>Vehicle</code> subclass from input.</li>
<li><b>Singleton / DI</b> — one <code>ParkingLot</code> instance.</li>
<li><b>Observer</b> (optional) — a display board subscribes to free-count changes.</li>
</ul>
<h2>Concurrency</h2>
<p>Two cars at two gates must not get the same spot. Options: <code>synchronized</code> on the spot's <code>assign()</code> (shown), a per-floor lock, or a <code>ConcurrentLinkedQueue</code> of free spots per type where <code>poll()</code> is atomic.</p>`,
      pitfalls: [
        "Modeling spots as booleans in an array — no room for spot type, EV charging, sensor state.",
        "Pricing logic hard-coded in ParkingLot instead of a strategy.",
        "Race condition on allocation left unaddressed.",
      ],
      interviewQs: [
        "How would you add EV charging spots and reserved spots?",
        "Support multiple parking lots in a city under one system.",
        "How do you guarantee no two vehicles get the same spot?",
      ],
    },
    {
      id: "lld-lru",
      title: "Design: LRU / LFU Cache",
      tags: ["design", "data-structures"],
      brushup: [
        "LRU: evict the least-recently-used key when full. Need O(1) get and put.",
        "Structure: HashMap&lt;key, Node&gt; + doubly linked list ordered by recency (head = MRU, tail = LRU).",
        "get: move node to head. put: upsert, move to head, if size &gt; capacity remove tail and its map entry.",
        "Use a dummy head + dummy tail to avoid null checks.",
        "LFU: HashMap key→node, HashMap freq→DLL of nodes, track minFreq; on access bump freq and move lists.",
        "Thread-safe version: guard with a lock, or use a segmented/striped design; Java's LinkedHashMap(accessOrder=true) is the shortcut.",
      ],
      detail: `
<h2>LRU in code</h2>
<pre><code>class Node { constructor(k, v){ this.k = k; this.v = v; this.prev = this.next = null; } }

class LRUCache {
  constructor(capacity){
    this.cap = capacity;
    this.map = new Map();                 // key -> Node
    this.head = new Node(0, 0);           // dummy MRU
    this.tail = new Node(0, 0);           // dummy LRU
    this.head.next = this.tail; this.tail.prev = this.head;
  }
  _remove(n){ n.prev.next = n.next; n.next.prev = n.prev; }
  _addFront(n){
    n.next = this.head.next; n.prev = this.head;
    this.head.next.prev = n; this.head.next = n;
  }
  get(key){
    if (!this.map.has(key)) return -1;
    const n = this.map.get(key);
    this._remove(n); this._addFront(n);
    return n.v;
  }
  put(key, value){
    if (this.map.has(key)){
      const n = this.map.get(key); n.v = value;
      this._remove(n); this._addFront(n);
      return;
    }
    if (this.map.size === this.cap){
      const lru = this.tail.prev;
      this._remove(lru); this.map.delete(lru.k);
    }
    const n = new Node(key, value);
    this._addFront(n); this.map.set(key, n);
  }
}</code></pre>
<h2>Why a doubly linked list</h2>
<p>You must remove an arbitrary node (the one you just accessed) in O(1); a singly linked list needs the predecessor. The HashMap gives O(1) lookup of the node; the list gives O(1) reordering.</p>
<h2>Design extensions interviewers ask</h2>
<ul>
<li><b>TTL / expiry</b>: store <code>expireAt</code>; lazily evict on access + a background sweeper.</li>
<li><b>Thread safety</b>: one mutex around get/put, or read-write lock, or sharding by key hash.</li>
<li><b>Write policies</b>: write-through vs write-back to the backing store.</li>
<li><b>Metrics</b>: hit rate, evictions (Observer / counters).</li>
</ul>`,
      pitfalls: [
        "Using an array + shifting → O(n) per access.",
        "Forgetting to delete the evicted key from the map (memory leak + stale hits).",
        "Not updating recency on `get` (only on `put`).",
      ],
      interviewQs: [
        "Implement LRU with O(1) get/put.",
        "Extend it to LFU.",
        "Make it thread-safe and add per-entry TTL.",
      ],
    },
    {
      id: "lld-rate-limiter",
      title: "Design: Rate Limiter",
      tags: ["design", "concurrency"],
      brushup: [
        "Algorithms: Token Bucket (allows bursts up to bucket size), Leaky Bucket (smooths to a fixed rate), Fixed Window Counter (simple, boundary spikes), Sliding Window Log (accurate, memory-heavy), Sliding Window Counter (good balance).",
        "Token bucket: refill tokens at rate r up to capacity b; a request costs 1 token; no token ⇒ reject/queue.",
        "Key the limiter by user / IP / API key / route. Store counters in memory (single node) or Redis (distributed, atomic INCR + EXPIRE or Lua).",
        "Return 429 with Retry-After; expose X-RateLimit-* headers.",
        "Distributed: clock skew, atomicity, and the hot-key problem matter; Redis + Lua or a cell-based approach.",
      ],
      detail: `
<h2>Token bucket</h2>
<pre><code>class TokenBucket {
  constructor(capacity, refillPerSec){
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillPerSec = refillPerSec;
    this.last = Date.now();
  }
  _refill(){
    const now = Date.now();
    const add = (now - this.last) / 1000 * this.refillPerSec;
    this.tokens = Math.min(this.capacity, this.tokens + add);
    this.last = now;
  }
  allow(cost = 1){
    this._refill();
    if (this.tokens &gt;= cost){ this.tokens -= cost; return true; }
    return false;
  }
}</code></pre>
<h2>Algorithm comparison</h2>
<table>
<tr><th>Algorithm</th><th>Bursts</th><th>Accuracy</th><th>Memory</th></tr>
<tr><td>Fixed window</td><td>2× at boundary</td><td>low</td><td>O(1)</td></tr>
<tr><td>Sliding window log</td><td>none</td><td>exact</td><td>O(requests)</td></tr>
<tr><td>Sliding window counter</td><td>minor</td><td>good</td><td>O(1)</td></tr>
<tr><td>Token bucket</td><td>up to capacity (intended)</td><td>good</td><td>O(1)</td></tr>
<tr><td>Leaky bucket</td><td>none (smoothed)</td><td>good</td><td>O(queue)</td></tr>
</table>
<h2>Distributed with Redis</h2>
<pre><code>-- atomic sliding-window-ish via Lua: INCR key, if == 1 then PEXPIRE key window
-- reject when count &gt; limit
</code></pre>
<p>Per-node local buckets (approximate, cheap) + a shared store for hard limits is a common hybrid.</p>
<h2>Class design</h2>
<pre><code>interface RateLimiter { boolean allow(String clientKey); }
class TokenBucketRateLimiter implements RateLimiter { Map&lt;String, TokenBucket&gt; buckets; }
// Strategy: swap the algorithm without touching the filter/middleware that calls allow()</code></pre>`,
      pitfalls: [
        "Fixed-window boundary burst — 2× the limit across the window edge.",
        "Non-atomic check-then-increment under concurrency (needs a lock or atomic op).",
        "Unbounded per-key map growth — evict idle buckets.",
        "Using wall-clock differences across nodes without accounting for skew.",
      ],
      interviewQs: [
        "Compare token bucket and leaky bucket.",
        "Design a distributed rate limiter for an API gateway.",
        "How do you make the counter update atomic?",
      ],
    },
    {
      id: "lld-splitwise",
      title: "Design: Splitwise / Expense Sharing",
      tags: ["design", "classic"],
      brushup: [
        "Entities: User, Group, Expense, Split (abstract) → EqualSplit / ExactSplit / PercentSplit, BalanceSheet.",
        "Split type = Strategy/polymorphism: each computes each participant's share; validate (exacts sum to total, percents sum to 100).",
        "Balance representation: map (userA, userB) → amount, or per-user net balance. On each expense, update pairwise balances.",
        "Simplify debts: minimize the number of transactions — greedy settle max creditor with max debtor (heap-based).",
        "Concurrency: adding expenses concurrently to a group must serialize balance updates (lock per group).",
      ],
      detail: `
<h2>Class sketch</h2>
<pre><code>abstract class Split { User user; double amount; }
class EqualSplit  extends Split {}
class ExactSplit  extends Split {}
class PercentSplit extends Split { double percent; }

class Expense {
  String id; String desc; double total;
  User paidBy;
  List&lt;Split&gt; splits;
  ExpenseType type;   // EQUAL, EXACT, PERCENT
}

interface SplitValidator { boolean validate(Expense e); }

class ExpenseManager {
  // balances[u1][u2] = how much u1 owes u2
  Map&lt;String, Map&lt;String, Double&gt;&gt; balances = new ConcurrentHashMap&lt;&gt;();

  synchronized void addExpense(Expense e){
    for (Split s : e.splits){
      if (s.user.equals(e.paidBy)) continue;
      adjust(s.user.id, e.paidBy.id, s.amount);   // user owes payer
    }
  }
  private void adjust(String from, String to, double amt){
    balances.computeIfAbsent(from, k -&gt; new HashMap&lt;&gt;()).merge(to, amt, Double::sum);
    balances.computeIfAbsent(to, k -&gt; new HashMap&lt;&gt;()).merge(from, -amt, Double::sum);
  }
}</code></pre>
<h2>Debt simplification (greedy)</h2>
<pre><code>1. Compute each person's net balance (sum of all they're owed minus all they owe).
2. Put positives in a max-heap (creditors), negatives in a max-heap by magnitude (debtors).
3. Repeatedly: settle min(topCreditor, topDebtor); push back the remainder.
   → at most n-1 transactions.</code></pre>
<h2>Validation by split type</h2>
<ul><li>EQUAL: <code>total / n</code> each (handle rounding — give the remainder cent to the payer).</li>
<li>EXACT: shares must sum to <code>total</code>.</li>
<li>PERCENT: percents must sum to 100; amount = <code>total * pct/100</code>.</li></ul>`,
      pitfalls: [
        "Floating-point money — use integer cents or BigDecimal; equal splits don't divide evenly.",
        "Storing only net balances loses the pairwise detail users expect to see.",
        "Not validating that exact/percent splits are consistent with the total.",
      ],
      interviewQs: [
        "How do you model different split types cleanly?",
        "Implement debt simplification.",
        "How do you handle rounding for a 3-way equal split of ₹100?",
      ],
    },
    {
      id: "lld-concurrency-patterns",
      title: "Concurrency in LLD",
      tags: ["concurrency", "design"],
      brushup: [
        "Prefer immutability and message passing over shared mutable state.",
        "Java toolkit: synchronized/ReentrantLock, ReadWriteLock, ConcurrentHashMap, BlockingQueue, AtomicInteger/CAS, ExecutorService, CompletableFuture, CountDownLatch, Semaphore.",
        "Thread pool > raw threads: bounded resource use, reuse, backpressure via a bounded queue.",
        "Producer–consumer: BlockingQueue decouples rate. Publish–subscribe: Observer + async dispatch.",
        "Singleton thread-safety: eager init, or holder idiom, or double-checked locking with volatile.",
        "Avoid deadlock: consistent lock ordering, tryLock with timeout, minimize critical sections, no I/O under a lock.",
      ],
      detail: `
<h2>Thread-safe Singleton (holder idiom)</h2>
<pre><code>class Config {
  private Config(){}
  private static class Holder { static final Config INSTANCE = new Config(); }
  public static Config get(){ return Holder.INSTANCE; }   // lazy + thread-safe, no locking
}</code></pre>
<h2>Producer–consumer</h2>
<pre><code>BlockingQueue&lt;Task&gt; queue = new ArrayBlockingQueue&lt;&gt;(1000);
// producers:  queue.put(task);        // blocks when full → backpressure
// consumers:  Task t = queue.take();  // blocks when empty
ExecutorService pool = Executors.newFixedThreadPool(8);</code></pre>
<h2>Read-heavy shared state</h2>
<pre><code>ReadWriteLock rw = new ReentrantReadWriteLock();
rw.readLock().lock();  try { /* many concurrent readers */ } finally { rw.readLock().unlock(); }
rw.writeLock().lock(); try { /* exclusive */ }             finally { rw.writeLock().unlock(); }</code></pre>
<h2>Lock-free counter</h2>
<pre><code>AtomicLong hits = new AtomicLong();
hits.incrementAndGet();          // CAS loop under the hood, no blocking</code></pre>
<h2>Design checklist</h2>
<p>What's shared? Who writes it? Can it be made immutable or thread-local? What's the smallest critical section? Is there a bounded queue for backpressure? What happens on shutdown (drain vs drop)?</p>`,
      pitfalls: [
        "`Collections.synchronizedMap` still needs external sync for compound (check-then-act) operations — use ConcurrentHashMap's atomic methods.",
        "Unbounded queues hide overload until OOM — bound them.",
        "Catching InterruptedException and swallowing it (lose cancellation).",
        "Holding a lock while calling a listener/callback of unknown duration.",
      ],
      interviewQs: [
        "Make this cache/counter/registry thread-safe with minimal contention.",
        "Design a thread pool with graceful shutdown.",
        "Explain double-checked locking and why `volatile` is required.",
      ],
    },
  ],
});
