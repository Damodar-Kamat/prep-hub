/* Low-Level Design / machine coding (deep-dive edition). */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "lld",
  title: "Low-Level Design",
  icon: "🧱",
  blurb: "Machine-coding rounds: turning requirements into clean class models. Method + worked designs (parking lot, LRU, rate limiter, Splitwise, elevator, vending machine).",
  topics: [
    {
      id: "lld-method",
      title: "LLD Interview Method",
      tags: ["process", "oop"],
      brushup: [
        "1) Clarify: functional requirements, non-functional (scale, concurrency, persistence), explicit assumptions, out-of-scope. Write them down.",
        "2) Identify entities (nouns → classes), behaviors (verbs → methods), fixed value sets (→ enums).",
        "3) Relationships: association / aggregation / composition / inheritance. Default to composition + interfaces.",
        "4) Apply SOLID: one responsibility per class, depend on interfaces, inject dependencies.",
        "5) Choose patterns where variability lives: Strategy, Factory, Observer, State, Builder, Singleton — never force them.",
        "6) Concurrency (locks / atomics / thread-safe collections) + edge cases. Then code the core happy path cleanly.",
        "7) Answer 'how would you extend it?' — a good design absorbs new requirements as new classes, not rewrites.",
      ],
      detail: `
<h2>Time-box (60–90 minute round)</h2>
<table>
<tr><th>Minutes</th><th>Do</th></tr>
<tr><td>0–10</td><td>Requirements, assumptions, the public API / main use cases. Get agreement before designing.</td></tr>
<tr><td>10–25</td><td>Entities, enums, class diagram, relationships and multiplicities.</td></tr>
<tr><td>25–35</td><td>Identify the axes of change → which pattern absorbs each. Sketch key method signatures.</td></tr>
<tr><td>35–75</td><td>Code the core flow — compilable, clean names, real encapsulation. Then edge cases + concurrency.</td></tr>
<tr><td>75–90</td><td>A short <code>main()</code> demo; discuss extensions and trade-offs.</td></tr>
</table>

<h2>Requirement clarification checklist</h2>
<ul>
<li>Who are the actors? What are the top 3–5 use cases?</li>
<li>Single machine (in-memory) or distributed? Do we persist? To what?</li>
<li>Concurrent users / threads? Consistency expectations?</li>
<li>What must be pluggable / configurable (pricing, allocation, matching, notification channel…)?</li>
<li>Scale numbers (helps decide data structures, not distributed architecture — that's HLD).</li>
<li>What is explicitly out of scope (auth, payments gateway internals, UI)?</li>
</ul>

<h2>From requirements to a model</h2>
<pre><code>"A user books a seat for a show in a theatre; they can cancel; payment is external."
nouns  → User, Booking, Seat, Show, Screen, Movie, Theatre, Payment
verbs  → search(), hold(), confirm(), cancel(), refund()
states → SeatStatus { AVAILABLE, HELD, BOOKED }
         BookingStatus { CREATED, CONFIRMED, CANCELLED, EXPIRED }
rules  → a HELD seat expires after N minutes if not confirmed</code></pre>
<p>Turn each rule into code: an invariant enforced in a method, a state machine, or a scheduled expiry task.</p>

<h2>Relationship cheat sheet</h2>
<table>
<tr><th>Relationship</th><th>Meaning</th><th>Lifetime</th><th>Example</th></tr>
<tr><td>Dependency</td><td>uses transiently (param/local)</td><td>—</td><td>BookingService uses a Clock</td></tr>
<tr><td>Association</td><td>holds a reference</td><td>independent</td><td>Booking — User</td></tr>
<tr><td>Aggregation</td><td>has-a, shared</td><td>independent</td><td>Theatre — Screen (screen could be modeled standalone)</td></tr>
<tr><td>Composition</td><td>owns, exclusive</td><td>bound</td><td>Show — ShowSeat (a show seat has no meaning without the show)</td></tr>
<tr><td>Inheritance</td><td>is-a, substitutable</td><td>—</td><td>PercentSplit — Split</td></tr>
</table>

<h2>Where patterns typically land</h2>
<table>
<tr><th>Axis of change</th><th>Pattern</th></tr>
<tr><td>"There are several algorithms for X, and which one is used varies"</td><td>Strategy (pricing, allocation, matching, eviction)</td></tr>
<tr><td>"An object behaves differently depending on its lifecycle stage"</td><td>State (vending machine, order, document)</td></tr>
<tr><td>"Things need to react when something changes"</td><td>Observer (display boards, notifications, audit log)</td></tr>
<tr><td>"Construction is complex / has many options"</td><td>Builder / Factory</td></tr>
<tr><td>"One well-known instance"</td><td>Singleton (or DI-provided single instance)</td></tr>
<tr><td>"A request should pass through a series of handlers"</td><td>Chain of Responsibility (validation, middleware, approval)</td></tr>
</table>

<h2>Red flags interviewers watch for</h2>
<ul>
<li>God class that does everything; every field <code>public</code>.</li>
<li>No interfaces anywhere; <code>if (type == …)</code> / <code>instanceof</code> ladders instead of polymorphism.</li>
<li>Business rules hard-coded where they can't be swapped or tested.</li>
<li>Ignoring concurrency when the prompt clearly implies multiple users.</li>
<li>Not asking a single clarifying question; coding before modeling.</li>
<li>Over-engineering: 10 patterns and 20 interfaces for a to-do list.</li>
</ul>`,
      pitfalls: [
        "Jumping straight to code without listing requirements and assumptions.",
        "Over-engineering — patterns for their own sake add indirection with no benefit.",
        "One giant class; anemic domain objects with all logic in a 'Manager'.",
        "Ignoring concurrency when the problem obviously has concurrent actors.",
        "Modeling with primitives (booleans, strings, arrays) where a small class would carry intent and invariants.",
        "Designing for imaginary future requirements instead of the ones stated.",
      ],
      interviewQs: [
        "Walk me through your process for a machine-coding problem.",
        "How do you decide between aggregation and composition?",
        "Where would you put a Strategy vs a State pattern in your design?",
        "How would you make this design testable?",
        "How would you add feature X without modifying existing classes?",
      ],
    },

    {
      id: "lld-parking-lot",
      title: "Design: Parking Lot",
      tags: ["design", "classic"],
      brushup: [
        "Entities: ParkingLot (facade), ParkingFloor, ParkingSpot (+ SpotType), Vehicle hierarchy (+ VehicleType), Ticket, Entry/ExitGate, DisplayBoard, PaymentProcessor.",
        "SpotType { BIKE, COMPACT, LARGE, EV }; a VehicleType maps to the spot types it can use.",
        "SpotAllocationStrategy = Strategy: nearest-to-entrance / first-available / least-loaded-floor.",
        "PricingStrategy = Strategy: flat hourly / slab-based / day-night / vehicle-specific.",
        "Concurrency: assigning a free spot must be atomic — synchronized spot.assign(), per-floor lock, or a concurrent free-spot queue per type.",
        "Observer: DisplayBoard subscribes to free-count changes per floor/type.",
        "Extensibility targets: new vehicle type, new pricing model, reserved/handicapped/EV spots, multiple lots.",
      ],
      detail: `
<h2>Class model</h2>
<pre><code>enum VehicleType { BIKE, CAR, TRUCK, EV }
enum SpotType    { BIKE, COMPACT, LARGE, EV }
enum TicketStatus { ACTIVE, PAID, CLOSED }

abstract class Vehicle {
  final String plate; final VehicleType type;
  abstract Set&lt;SpotType&gt; allowedSpots();
}
class Car extends Vehicle { Set&lt;SpotType&gt; allowedSpots(){ return EnumSet.of(COMPACT, LARGE); } }

class ParkingSpot {
  final String id; final SpotType type; final int floor;
  private Vehicle vehicle;               // null ⇒ free
  synchronized boolean assign(Vehicle v){
    if (vehicle != null) return false;
    vehicle = v; return true;
  }
  synchronized void release(){ vehicle = null; }
  synchronized boolean isFree(){ return vehicle == null; }
}

class ParkingFloor {
  final int level;
  final Map&lt;SpotType, List&lt;ParkingSpot&gt;&gt; spots;
  Optional&lt;ParkingSpot&gt; firstFree(SpotType t){
    return spots.getOrDefault(t, List.of()).stream().filter(ParkingSpot::isFree).findFirst();
  }
}

interface SpotAllocationStrategy {
  Optional&lt;ParkingSpot&gt; allocate(List&lt;ParkingFloor&gt; floors, Vehicle v);
}
interface PricingStrategy { BigDecimal price(Ticket t, Instant exit); }

class Ticket {
  final String id; final ParkingSpot spot; final Vehicle vehicle;
  final Instant entryTime; TicketStatus status = TicketStatus.ACTIVE;
}

class ParkingLot {                        // facade / aggregate root
  private final List&lt;ParkingFloor&gt; floors;
  private final SpotAllocationStrategy allocation;
  private final PricingStrategy pricing;
  private final List&lt;ParkingObserver&gt; observers = new CopyOnWriteArrayList&lt;&gt;();

  Ticket park(Vehicle v){
    ParkingSpot spot = allocation.allocate(floors, v)
        .orElseThrow(() -&gt; new LotFullException(v.type));
    if (!spot.assign(v)) return park(v);   // lost a race — retry
    Ticket t = new Ticket(UUID.randomUUID().toString(), spot, v, Instant.now());
    notifyObservers();
    return t;
  }

  BigDecimal unpark(Ticket t, PaymentProcessor payment){
    BigDecimal amount = pricing.price(t, Instant.now());
    payment.charge(amount);               // out of scope internally
    t.spot.release();
    t.status = TicketStatus.CLOSED;
    notifyObservers();
    return amount;
  }
}</code></pre>

<h2>Allocation strategy examples</h2>
<pre><code>class NearestFirst implements SpotAllocationStrategy {
  public Optional&lt;ParkingSpot&gt; allocate(List&lt;ParkingFloor&gt; floors, Vehicle v){
    for (ParkingFloor f : floors)                       // floors ordered by proximity
      for (SpotType t : v.allowedSpots()){
        Optional&lt;ParkingSpot&gt; s = f.firstFree(t);
        if (s.isPresent()) return s;
      }
    return Optional.empty();
  }
}</code></pre>

<h2>Concurrency</h2>
<p>Two cars at two gates must never get the same spot. Options, cheapest first:</p>
<ul>
<li><b>Optimistic</b>: <code>allocate()</code> returns a candidate; <code>spot.assign()</code> is synchronized and returns false if taken; retry on false. (Shown above — simple, scales well when contention is low.)</li>
<li><b>Per-type concurrent queue</b>: <code>ConcurrentLinkedQueue&lt;ParkingSpot&gt;</code> of free spots; <code>poll()</code> is atomic; <code>release()</code> re-offers.</li>
<li><b>Per-floor lock</b>: coarser, simpler reasoning, less parallelism.</li>
</ul>

<h2>Patterns used</h2>
<ul>
<li><b>Facade</b> — <code>ParkingLot</code> is the single entry point.</li>
<li><b>Strategy</b> — allocation and pricing are injected and swappable.</li>
<li><b>Factory</b> — build the right <code>Vehicle</code> subclass from gate input.</li>
<li><b>Observer</b> — display boards react to occupancy changes.</li>
<li><b>Singleton / DI</b> — one <code>ParkingLot</code> instance for the site.</li>
</ul>

<h2>Extension prompts &amp; answers</h2>
<table>
<tr><th>"Add…"</th><th>Change</th></tr>
<tr><td>EV charging spots</td><td>New <code>SpotType.EV</code> + <code>EVSpot</code> subclass with a charger; <code>EV.allowedSpots()</code> prefers EV then LARGE.</td></tr>
<tr><td>Reserved / handicapped spots</td><td>Spot gains a <code>reservation</code> field; allocation strategy filters by the vehicle's permit.</td></tr>
<tr><td>Multiple lots across a city</td><td>New <code>ParkingLotManager</code> aggregating lots; routing strategy picks a lot by location/availability.</td></tr>
<tr><td>Monthly pass holders</td><td><code>PricingStrategy</code> checks a <code>PassRegistry</code>; pass holders price 0 and may use reserved spots.</td></tr>
</table>`,
      pitfalls: [
        "Modeling spots as a boolean array — no room for spot type, EV charger, sensor state, reservation.",
        "Pricing logic hard-coded inside ParkingLot instead of an injected strategy.",
        "Race condition on allocation left unaddressed.",
        "Vehicle → allowed spot mapping duplicated in multiple places instead of on the Vehicle type.",
        "Ticket holding a mutable reference that lets callers change the entry time / spot.",
      ],
      interviewQs: [
        "How would you guarantee two vehicles never get the same spot?",
        "Add EV charging and reserved spots without touching existing classes.",
        "Support multiple parking lots in a city under one system.",
        "How does pricing stay flexible for promotions and pass holders?",
        "How would you persist tickets so the system survives a restart?",
      ],
    },

    {
      id: "lld-lru",
      title: "Design: LRU / LFU Cache",
      tags: ["design", "data-structures"],
      brushup: [
        "LRU: on capacity overflow, evict the least-recently-used key. Requires O(1) get and put.",
        "Structure: HashMap<key, Node> + doubly linked list ordered by recency (head = MRU, tail = LRU). Dummy head + tail avoid null checks.",
        "get(k): move the node to head, return value. put(k,v): upsert + move to head; if size > capacity, drop the tail node AND its map entry.",
        "Why a DOUBLY linked list: you must unlink an arbitrary node (the one you just accessed) in O(1); a singly linked list needs its predecessor.",
        "LFU: HashMap<key, Node> + HashMap<freq, DLL of nodes> + minFreq pointer; on access bump freq and move the node between frequency lists.",
        "Thread-safe: a single lock around get/put, or a striped/segmented design; Java shortcut: LinkedHashMap(accessOrder=true) + removeEldestEntry.",
        "Extensions: per-entry TTL, write-through vs write-back, size-weighted eviction, hit-rate metrics.",
      ],
      detail: `
<h2>LRU implementation</h2>
<pre><code>class Node {
  constructor(key, val){ this.key = key; this.val = val; this.prev = this.next = null; }
}

class LRUCache {
  constructor(capacity){
    this.cap = capacity;
    this.map = new Map();                       // key -> Node
    this.head = new Node(null, null);           // dummy: most-recently-used side
    this.tail = new Node(null, null);           // dummy: least-recently-used side
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  _unlink(n){ n.prev.next = n.next; n.next.prev = n.prev; }
  _pushFront(n){
    n.prev = this.head; n.next = this.head.next;
    this.head.next.prev = n; this.head.next = n;
  }
  get(key){
    const n = this.map.get(key);
    if (!n) return -1;
    this._unlink(n); this._pushFront(n);        // mark as most-recently-used
    return n.val;
  }
  put(key, value){
    let n = this.map.get(key);
    if (n){ n.val = value; this._unlink(n); this._pushFront(n); return; }
    if (this.map.size === this.cap){
      const lru = this.tail.prev;               // the real LRU node
      this._unlink(lru);
      this.map.delete(lru.key);                 // ← must also remove from the map
    }
    n = new Node(key, value);
    this._pushFront(n);
    this.map.set(key, n);
  }
}</code></pre>
<p>Every operation is O(1): the map finds the node, the list reorders it.</p>

<h2>LFU — the harder cousin</h2>
<pre><code>// state:
//   valueMap: key -> {value, freq}
//   freqMap:  freq -> ordered set/DLL of keys with that frequency
//   minFreq:  smallest frequency currently present
//
// get(k):  freq++ ; move k from freqMap[old] to freqMap[old+1] ;
//          if freqMap[old] is now empty and old === minFreq, minFreq++
// put(k):  if full, evict the LRU key within freqMap[minFreq] ; insert with freq = 1 ; minFreq = 1</code></pre>
<p>Tie-break within a frequency by recency (that's why each frequency bucket is itself an ordered list).</p>

<h2>Making it production-grade</h2>
<table>
<tr><th>Concern</th><th>Approach</th></tr>
<tr><td>Thread safety</td><td>One mutex around get/put (contention if hot). Or shard by <code>hash(key) % N</code> into N independent LRUs. Or a lock-free approximation (CLOCK / segmented LRU like Caffeine's TinyLFU).</td></tr>
<tr><td>TTL / expiry</td><td>Store <code>expireAt</code>; check lazily on <code>get</code> (treat expired as miss) + a background sweeper for memory.</td></tr>
<tr><td>Write policy</td><td>Write-through: update cache + backing store synchronously. Write-back: update cache, flush dirty entries asynchronously (risk on crash).</td></tr>
<tr><td>Size-weighted</td><td>Evict based on total bytes, not entry count; each node carries a weight.</td></tr>
<tr><td>Observability</td><td>Counters for hits, misses, evictions, load time; expose hit ratio.</td></tr>
<tr><td>Stampede protection</td><td>On miss, a per-key lock so only one loader recomputes; others await it (single-flight).</td></tr>
</table>

<h2>Why not just a HashMap + timestamps?</h2>
<p>Finding the minimum timestamp to evict would be O(n) per eviction (or O(log n) with a heap, plus the heap needs decrease-key on every access). The doubly-linked-list order gives eviction and reordering in O(1) with tiny constants.</p>`,
      pitfalls: [
        "Using an array + shift for recency order → O(n) per access.",
        "Forgetting to delete the evicted key from the map — memory leak + stale hits later.",
        "Not updating recency on `get` (only on `put`) — that's not LRU.",
        "Singly linked list — can't unlink the accessed node in O(1).",
        "LFU: forgetting to advance/repair `minFreq` when a frequency bucket empties.",
        "A single global lock making the cache a scalability bottleneck under heavy read load.",
      ],
      interviewQs: [
        "Implement LRU with O(1) get and put.",
        "Now make it LFU.",
        "Make it thread-safe with minimal contention.",
        "Add per-entry TTL and a background eviction sweeper.",
        "How would you prevent a cache stampede on a hot key?",
        "Design a size-bounded (bytes, not count) cache.",
      ],
    },

    {
      id: "lld-rate-limiter",
      title: "Design: Rate Limiter",
      tags: ["design", "concurrency"],
      brushup: [
        "Algorithms: Fixed Window Counter (simple, 2× burst at edges), Sliding Window Log (exact, O(requests) memory), Sliding Window Counter (weighted blend, O(1)), Token Bucket (allows controlled bursts up to bucket size), Leaky Bucket (smooths to a constant rate, queues).",
        "Token bucket: refill r tokens/sec up to capacity b; a request costs 1 token; empty ⇒ reject (or queue / shape).",
        "Key by user / IP / API key / route / tenant. Store counters in-process (single node) or Redis (distributed, atomic INCR+EXPIRE or a Lua script).",
        "Return HTTP 429 with Retry-After; expose X-RateLimit-Limit / Remaining / Reset headers.",
        "Distributed concerns: atomic check-and-increment, clock skew, hot keys, and failure mode (fail-open vs fail-closed).",
        "Design it as Strategy behind a RateLimiter interface so the algorithm is swappable per route.",
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
    this.tokens = Math.min(this.capacity, this.tokens + (now - this.last) / 1000 * this.refillPerSec);
    this.last = now;
  }
  tryAcquire(cost = 1){
    this._refill();
    if (this.tokens &gt;= cost){ this.tokens -= cost; return true; }
    return false;
  }
}</code></pre>
<p>Lazy refill (compute on access from elapsed time) avoids a background timer per bucket. <b>Leaky bucket</b> is the dual: requests enter a fixed-capacity queue; a worker drains it at a constant rate; a full queue rejects. Token bucket permits bursts; leaky bucket enforces a smooth output rate.</p>

<h2>Algorithm comparison</h2>
<table>
<tr><th>Algorithm</th><th>Burst behavior</th><th>Accuracy</th><th>Memory / key</th></tr>
<tr><td>Fixed window counter</td><td>up to 2× at the window boundary</td><td>low</td><td>O(1)</td></tr>
<tr><td>Sliding window log</td><td>none</td><td>exact</td><td>O(requests in window)</td></tr>
<tr><td>Sliding window counter</td><td>minor</td><td>good</td><td>O(1)</td></tr>
<tr><td>Token bucket</td><td>up to bucket capacity (by design)</td><td>good</td><td>O(1)</td></tr>
<tr><td>Leaky bucket</td><td>none (output smoothed)</td><td>good</td><td>O(queue)</td></tr>
</table>
<p>Fixed-window boundary problem: with a limit of 100/min, 100 requests at 00:59 and 100 at 01:00 = 200 in ~1 second. Sliding-window-counter fixes this cheaply: <code>count ≈ prevWindowCount × (overlap fraction) + curWindowCount</code>.</p>

<h2>Class design (Strategy)</h2>
<pre><code>interface RateLimiter { boolean allow(String clientKey); }

class TokenBucketRateLimiter implements RateLimiter {
  private final int capacity, refillPerSec;
  private final ConcurrentHashMap&lt;String, TokenBucket&gt; buckets = new ConcurrentHashMap&lt;&gt;();
  public boolean allow(String key){
    return buckets.computeIfAbsent(key, k -&gt; new TokenBucket(capacity, refillPerSec))
                  .tryAcquire();
  }
}

// used by a servlet filter / middleware:
if (!rateLimiter.allow(clientKey(request))) {
  response.setStatus(429);
  response.setHeader("Retry-After", "1");
  return;
}</code></pre>

<h2>Distributed rate limiting</h2>
<pre><code>-- Redis, atomic fixed-window via Lua (avoids check-then-set races across nodes)
local current = redis.call('INCR', KEYS[1])
if current == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return current &lt;= tonumber(ARGV[2]) and 1 or 0</code></pre>
<ul>
<li><b>Atomicity</b>: a single Lua script or <code>INCR</code>/<code>EXPIRE</code> pipeline so two app nodes can't both "just fit".</li>
<li><b>Hot key</b>: a very popular tenant hammers one Redis slot — shard the key, or use a local approximate bucket + periodic reconciliation with the global counter.</li>
<li><b>Failure mode</b>: if Redis is down, do you fail-open (allow, risk overload) or fail-closed (reject, hurt availability)? Usually fail-open for a soft limit, fail-closed for abuse protection.</li>
<li><b>Clock skew</b>: prefer Redis server time (<code>TIME</code>) over per-node wall clocks for window math.</li>
</ul>

<h2>Where it sits</h2>
<p>Edge/API gateway (coarse, per-IP, DDoS-ish), then per-service (per-API-key, per-endpoint), then sometimes per-resource (per-account write throughput). Layered limits with different windows (per-second burst + per-day quota).</p>`,
      pitfalls: [
        "Fixed-window boundary burst — up to 2× the intended rate across the edge.",
        "Non-atomic check-then-increment under concurrency (needs a lock or a server-side atomic op).",
        "Unbounded per-key map growth — evict idle buckets (LRU / TTL on the entry).",
        "Using per-node wall clocks for window boundaries in a distributed limiter.",
        "Not deciding fail-open vs fail-closed when the counter store is unavailable.",
        "Returning 429 without Retry-After / rate-limit headers, so clients can't back off intelligently.",
      ],
      interviewQs: [
        "Compare token bucket and leaky bucket — when would you pick each?",
        "Fix the fixed-window boundary burst without O(n) memory.",
        "Design a distributed rate limiter for an API gateway.",
        "How do you make the counter update atomic across many app servers?",
        "What happens when the central counter store goes down?",
        "How would you support both a per-second burst limit and a per-day quota?",
      ],
    },

    {
      id: "lld-splitwise",
      title: "Design: Splitwise / Expense Sharing",
      tags: ["design", "classic"],
      brushup: [
        "Entities: User, Group, Expense, Split (abstract) → EqualSplit / ExactSplit / PercentSplit, ExpenseManager, BalanceSheet.",
        "Split type = polymorphism/Strategy: each computes participants' shares; a validator checks consistency (exacts sum to total, percents sum to 100).",
        "Balances: either pairwise map (userA, userB) → amount, or per-user net balance. Update on every expense.",
        "Simplify debts: minimize transaction count — greedy settle the largest creditor against the largest debtor using two heaps; at most n−1 transfers.",
        "Money: integer minor units or BigDecimal; equal splits rarely divide evenly — assign the remainder deterministically (to the payer).",
        "Concurrency: serialize balance updates per group (lock per group id) so concurrent expenses don't corrupt totals.",
      ],
      detail: `
<h2>Class model</h2>
<pre><code>abstract class Split {
  final User user;
  double amount;                                   // computed share
  Split(User u){ this.user = u; }
}
class EqualSplit  extends Split { EqualSplit(User u){ super(u); } }
class ExactSplit  extends Split { ExactSplit(User u, double a){ super(u); this.amount = a; } }
class PercentSplit extends Split { final double percent; PercentSplit(User u, double p){ super(u); this.percent = p; } }

enum ExpenseType { EQUAL, EXACT, PERCENT }

class Expense {
  final String id, description;
  final double total;
  final User paidBy;
  final ExpenseType type;
  final List&lt;Split&gt; splits;
}

interface ExpenseValidator { void validate(Expense e); }   // throws on inconsistency

class ExpenseManager {
  // balances.get(a).get(b) = how much a owes b  (negative ⇒ b owes a)
  private final Map&lt;String, Map&lt;String, Double&gt;&gt; balances = new ConcurrentHashMap&lt;&gt;();
  private final ExpenseValidator validator;

  void addExpense(Expense e){
    validator.validate(e);
    computeShares(e);
    synchronized (lockFor(e)){                       // lock per group (or per involved user set)
      for (Split s : e.splits){
        if (s.user.equals(e.paidBy)) continue;
        adjust(s.user.id, e.paidBy.id, s.amount);    // user now owes payer s.amount more
      }
    }
  }

  private void adjust(String from, String to, double amt){
    balances.computeIfAbsent(from, k -&gt; new HashMap&lt;&gt;()).merge(to, amt, Double::sum);
    balances.computeIfAbsent(to,   k -&gt; new HashMap&lt;&gt;()).merge(from, -amt, Double::sum);
  }

  List&lt;String&gt; balancesOf(String userId){ /* format non-zero entries */ }
}</code></pre>

<h2>Computing shares by type</h2>
<pre><code>void computeShares(Expense e){
  switch (e.type){
    case EQUAL: {
      long cents = Math.round(e.total * 100);
      int n = e.splits.size();
      long base = cents / n, rem = cents - base * n;   // distribute the leftover cents
      for (int i = 0; i &lt; n; i++)
        e.splits.get(i).amount = (base + (i &lt; rem ? 1 : 0)) / 100.0;
      break;
    }
    case EXACT:   /* amounts given; validator checks Σ == total */ break;
    case PERCENT:
      for (Split s : e.splits)
        s.amount = e.total * ((PercentSplit) s).percent / 100.0;
      // validator checks Σ percent == 100
      break;
  }
}</code></pre>

<h2>Debt simplification (greedy, ≤ n−1 transactions)</h2>
<pre><code>function simplify(netBalance){                 // map userId -> net (owed positive, owes negative)
  const creditors = [], debtors = [];
  for (const [u, bal] of Object.entries(netBalance)){
    if (bal &gt; 0) creditors.push([bal, u]);
    else if (bal &lt; 0) debtors.push([-bal, u]);
  }
  creditors.sort((a,b)=&gt;b[0]-a[0]);
  debtors.sort((a,b)=&gt;b[0]-a[0]);
  const txns = [];
  let i = 0, j = 0;
  while (i &lt; creditors.length &amp;&amp; j &lt; debtors.length){
    const pay = Math.min(creditors[i][0], debtors[j][0]);
    txns.push([debtors[j][1], creditors[i][1], pay]);
    creditors[i][0] -= pay; debtors[j][0] -= pay;
    if (creditors[i][0] === 0) i++;
    if (debtors[j][0] === 0) j++;
  }
  return txns;
}</code></pre>
<p>(Minimizing transactions exactly is NP-hard — this greedy is the standard "good enough" that never exceeds n−1.)</p>

<h2>Design discussion points</h2>
<ul>
<li><b>Pairwise vs net balances</b>: users want to see "you owe Alice ₹200 and Bob ₹50", so keep pairwise; derive net for simplification.</li>
<li><b>Concurrency granularity</b>: lock per group is simplest; per-user-pair allows more parallelism but risks deadlock (order the pair).</li>
<li><b>Auditability</b>: never mutate an Expense; corrections are new compensating expenses. Store an immutable event log.</li>
<li><b>Currencies</b>: an Expense carries a currency; balances are per-currency; conversion is a separate concern.</li>
</ul>`,
      pitfalls: [
        "Floating-point money — use integer minor units or BigDecimal; equal splits don't divide evenly.",
        "Storing only net balances — you lose the pairwise detail users expect to see.",
        "Not validating that exact amounts sum to the total / percentages sum to 100.",
        "Mutating past expenses for corrections instead of appending compensating entries.",
        "Deadlock from locking two users' balances in inconsistent order — order by id.",
      ],
      interviewQs: [
        "Model EQUAL / EXACT / PERCENT splits cleanly and extensibly.",
        "How do you split ₹100 three ways without losing a paisa?",
        "Implement debt simplification.",
        "How do you keep concurrent expense additions from corrupting balances?",
        "How would you support multiple currencies?",
      ],
    },

    {
      id: "lld-elevator",
      title: "Design: Elevator / Lift System",
      tags: ["design", "state", "classic"],
      brushup: [
        "Entities: ElevatorSystem (dispatcher), ElevatorCar, Request (hall call: floor + direction; car call: target floor), Door, Display, SchedulingStrategy.",
        "Car state: Direction { UP, DOWN, IDLE }, DoorState { OPEN, CLOSED }, a sorted set of stops.",
        "Scheduling = Strategy. Classic: SCAN / 'elevator algorithm' — keep going in the current direction serving stops, then reverse. Alternatives: nearest-car, look-ahead, destination-dispatch.",
        "Dispatcher picks which car serves a hall call (minimize wait / travel; consider direction match and current load).",
        "Each car maintains up-stops (min-heap) and down-stops (max-heap); serve the active-direction heap, switch when it empties.",
        "Concurrency: requests arrive from many floors concurrently — a thread-safe queue per car; the car loop consumes it.",
      ],
      detail: `
<h2>Class model</h2>
<pre><code>enum Direction { UP, DOWN, IDLE }
enum DoorState { OPEN, CLOSED }

class Request {
  final int floor;               // origin (hall) or target (car)
  final Direction direction;     // null for a car call
  final long createdAt;
}

class ElevatorCar {
  final int id;
  int currentFloor = 0;
  Direction direction = Direction.IDLE;
  DoorState door = DoorState.CLOSED;
  final TreeSet&lt;Integer&gt; upStops = new TreeSet&lt;&gt;();          // ascending
  final TreeSet&lt;Integer&gt; downStops = new TreeSet&lt;&gt;(Collections.reverseOrder());

  void addStop(int floor){
    if (floor &gt; currentFloor) upStops.add(floor);
    else if (floor &lt; currentFloor) downStops.add(floor);
    // == currentFloor ⇒ open doors now
  }

  // called on each 'tick' (or event) by the car's control loop
  void step(){
    if (direction == Direction.UP){
      if (upStops.isEmpty()){ direction = downStops.isEmpty() ? Direction.IDLE : Direction.DOWN; return; }
      currentFloor++;
      if (upStops.remove(currentFloor)) openThenClose();
    } else if (direction == Direction.DOWN){
      if (downStops.isEmpty()){ direction = upStops.isEmpty() ? Direction.IDLE : Direction.UP; return; }
      currentFloor--;
      if (downStops.remove(currentFloor)) openThenClose();
    } else {                                 // IDLE
      if (!upStops.isEmpty()) direction = Direction.UP;
      else if (!downStops.isEmpty()) direction = Direction.DOWN;
    }
  }
}

interface DispatchStrategy { ElevatorCar chooseCar(List&lt;ElevatorCar&gt; cars, Request hallCall); }

class ElevatorSystem {
  final List&lt;ElevatorCar&gt; cars;
  final DispatchStrategy dispatch;

  void hallCall(int floor, Direction dir){
    ElevatorCar car = dispatch.chooseCar(cars, new Request(floor, dir));
    car.addStop(floor);
  }
  void carCall(int carId, int target){ cars.get(carId).addStop(target); }
}</code></pre>

<h2>Dispatch strategies</h2>
<pre><code>class NearestCar implements DispatchStrategy {
  public ElevatorCar chooseCar(List&lt;ElevatorCar&gt; cars, Request r){
    return cars.stream().min(Comparator.comparingInt(c -&gt; cost(c, r))).orElseThrow();
  }
  private int cost(ElevatorCar c, Request r){
    int dist = Math.abs(c.currentFloor - r.floor);
    boolean sameWay = c.direction == r.direction || c.direction == Direction.IDLE;
    boolean willPass = sameWay &amp;&amp;
      ((r.direction == Direction.UP   &amp;&amp; c.currentFloor &lt;= r.floor) ||
       (r.direction == Direction.DOWN &amp;&amp; c.currentFloor &gt;= r.floor));
    return willPass ? dist : dist + 1000;    // heavy penalty if the car must reverse
  }
}</code></pre>
<p><b>Destination dispatch</b> (modern buildings): passengers enter their target <em>before</em> boarding; the system groups people going to similar floors into the same car, reducing stops. Model it as the hall call carrying the target, and a grouping strategy.</p>

<h2>The SCAN / elevator algorithm</h2>
<p>Keep moving in the current direction, servicing every stop encountered, until there are no more stops that way; then reverse. This is the same algorithm used for disk-head scheduling. It bounds the worst-case wait (unlike "serve nearest", which can starve a far floor) and is simple.</p>

<h2>Concurrency &amp; timing</h2>
<ul>
<li>Each car runs its own control loop (thread) consuming a thread-safe request queue; the dispatcher only enqueues.</li>
<li>Real systems are event-driven (sensor at each floor) rather than tick-based; the model above simplifies to ticks.</li>
<li>Door timing, overload sensor, emergency stop, and fire-service mode are additional states — a full <b>State pattern</b> per car (Moving, Stopped, DoorsOpen, Maintenance, Emergency) keeps transitions explicit.</li>
</ul>

<h2>Extensions</h2>
<table>
<tr><th>"Add…"</th><th>Change</th></tr>
<tr><td>Weight/overload limit</td><td>Car has a <code>load</code>; on overload it refuses new car calls and signals; dispatcher deprioritizes it.</td></tr>
<tr><td>Express / zoned elevators</td><td>Car has an allowed-floor set; dispatch filters by it.</td></tr>
<tr><td>Peak-hour modes</td><td>Strategy swaps at 9am (lobby-heavy) vs 6pm; observer on a schedule.</td></tr>
<tr><td>Maintenance mode</td><td>Car transitions to a state that drains its stops then parks and leaves the dispatch pool.</td></tr>
</table>`,
      pitfalls: [
        "One global request queue with no notion of direction — the car thrashes up and down.",
        "'Serve nearest request' with no SCAN discipline → a distant floor can starve.",
        "Storing stops in an unordered list — you can't efficiently find the next stop in the travel direction.",
        "Ignoring that hall calls have a direction; a down-traveller shouldn't be picked up by an up-going car mid-trip.",
        "No State model for doors/emergency — transitions get tangled in if-statements.",
      ],
      interviewQs: [
        "Which scheduling algorithm and why? How does it bound waiting time?",
        "How does the dispatcher choose which car answers a hall call?",
        "Model the car as a state machine — what are the states and transitions?",
        "How would you support destination dispatch?",
        "How do multiple cars coordinate without both rushing to the same call?",
      ],
    },

    {
      id: "lld-vending-machine",
      title: "Design: Vending Machine",
      tags: ["design", "state", "classic"],
      brushup: [
        "The textbook State pattern problem. States: Idle → HasMoney → Dispensing → (back to Idle); plus OutOfStock.",
        "Entities: VendingMachine (context), State interface + concrete states, Inventory (slot → {product, count}), CoinManager / cash box, Product.",
        "Each state implements the same actions (insertCoin, selectProduct, dispense, refund) but responds appropriately or rejects.",
        "The machine delegates every action to its current state object; the state decides the next state.",
        "Change-making: greedy with available denominations; if exact change can't be made, refuse or warn.",
        "Concurrency: a single machine is effectively single-user, but guard inventory + cash box if modeling a service backend.",
      ],
      detail: `
<h2>Why State, not a pile of booleans</h2>
<p>Without the pattern you get <code>if (hasMoney &amp;&amp; !dispensing &amp;&amp; productSelected &amp;&amp; inStock) …</code> everywhere, and every new state multiplies the conditionals. The State pattern gives each state its own class where the valid transitions are explicit and the invalid actions are politely rejected in one place.</p>

<h2>Class model</h2>
<pre><code>interface State {
  void insertCoin(Coin c);
  void selectProduct(String code);
  void dispense();
  void refund();
}

class VendingMachine {
  State idle, hasMoney, dispensing, outOfStock;
  State current;
  final Inventory inventory;
  final CashBox cashBox;
  int balance = 0;               // coins inserted for the current session
  String selectedCode;

  VendingMachine(Inventory inv, CashBox cash){
    this.inventory = inv; this.cashBox = cash;
    idle = new IdleState(this);
    hasMoney = new HasMoneyState(this);
    dispensing = new DispensingState(this);
    outOfStock = new OutOfStockState(this);
    current = idle;
  }
  void setState(State s){ current = s; }

  // public API just delegates
  void insertCoin(Coin c){ current.insertCoin(c); }
  void selectProduct(String code){ current.selectProduct(code); }
  void dispense(){ current.dispense(); }
  void refund(){ current.refund(); }
}

class IdleState implements State {
  private final VendingMachine m;
  IdleState(VendingMachine m){ this.m = m; }
  public void insertCoin(Coin c){ m.balance += c.value; m.cashBox.add(c); m.setState(m.hasMoney); }
  public void selectProduct(String code){ throw new IllegalStateException("insert coins first"); }
  public void dispense(){ throw new IllegalStateException("nothing selected"); }
  public void refund(){ /* nothing to refund */ }
}

class HasMoneyState implements State {
  private final VendingMachine m;
  HasMoneyState(VendingMachine m){ this.m = m; }
  public void insertCoin(Coin c){ m.balance += c.value; m.cashBox.add(c); }
  public void selectProduct(String code){
    Slot slot = m.inventory.slot(code);
    if (slot == null || slot.count == 0){ System.out.println("out of stock"); return; }
    if (m.balance &lt; slot.product.price){ System.out.println("insufficient: need " + slot.product.price); return; }
    m.selectedCode = code;
    m.setState(m.dispensing);
    m.dispense();                                  // auto-proceed
  }
  public void dispense(){ throw new IllegalStateException("select a product"); }
  public void refund(){ m.cashBox.returnCoins(m.balance); m.balance = 0; m.setState(m.idle); }
}

class DispensingState implements State {
  private final VendingMachine m;
  DispensingState(VendingMachine m){ this.m = m; }
  public void insertCoin(Coin c){ m.cashBox.returnCoin(c); }   // reject mid-dispense
  public void selectProduct(String code){ /* ignore */ }
  public void dispense(){
    Slot slot = m.inventory.slot(m.selectedCode);
    int change = m.balance - slot.product.price;
    if (change &gt; 0 &amp;&amp; !m.cashBox.canMakeChange(change)){
      System.out.println("cannot make exact change — refunding");
      m.cashBox.returnCoins(m.balance);
    } else {
      slot.count--;
      m.cashBox.dispenseChange(change);
      System.out.println("dispensed " + slot.product.name + ", change " + change);
    }
    m.balance = 0; m.selectedCode = null;
    m.setState(m.inventory.isEmpty() ? m.outOfStock : m.idle);
  }
  public void refund(){ /* too late */ }
}</code></pre>

<h2>State transition diagram</h2>
<pre><code>        insertCoin            selectProduct(valid, funded)
IDLE ───────────────▶ HAS_MONEY ──────────────────────────▶ DISPENSING
  ▲                      │  │                                    │
  │        refund        │  │ selectProduct(invalid) → stay      │ dispense done
  └──────────────────────┘  └───────────────────────────────────┘
                                                              ▼
                                                    IDLE (or OUT_OF_STOCK)</code></pre>

<h2>Making change</h2>
<pre><code>// greedy over available denominations, highest first; fails if it can't hit the amount exactly
boolean dispenseChange(int amount){
  List&lt;Integer&gt; result = new ArrayList&lt;&gt;();
  for (int coin : DENOMS_DESC){
    while (amount &gt;= coin &amp;&amp; countOf(coin) &gt; 0){ amount -= coin; result.add(coin); }
  }
  if (amount != 0) return false;      // caller should refund instead
  result.forEach(this::release);
  return true;
}</code></pre>
<p>Greedy is correct for canonical coin systems (1/5/10/25…); if denominations were arbitrary you'd need the DP coin-change from the DSA section.</p>

<h2>Extensions</h2>
<ul>
<li><b>Card / UPI payment</b>: a <code>PaymentStrategy</code>; the "HasMoney" concept becomes "PaymentAuthorized".</li>
<li><b>Multiple simultaneous machines / telemetry</b>: an Observer publishing low-stock and cash-full events to a back office.</li>
<li><b>Admin mode</b>: a state for restocking and emptying the cash box, guarded by a key/code.</li>
</ul>`,
      pitfalls: [
        "Encoding state as a tangle of boolean flags instead of state objects.",
        "Putting transition logic in the context (VendingMachine) instead of in the states.",
        "Forgetting the 'cannot make exact change' path — must refund, not shortchange.",
        "Not returning coins inserted mid-dispense or after a failed selection.",
        "Greedy change-making assumed correct for non-canonical denominations.",
      ],
      interviewQs: [
        "Why the State pattern here? Draw the state machine.",
        "What happens when the machine can't make exact change?",
        "How would you add card payment?",
        "Where does inventory / cash-box concurrency matter?",
        "How do you add an admin restock mode safely?",
      ],
    },

    {
      id: "lld-concurrency-patterns",
      title: "Concurrency in LLD",
      tags: ["concurrency", "design"],
      brushup: [
        "Prefer immutability and message passing over shared mutable state — the safest concurrency is none.",
        "Java toolkit: synchronized / ReentrantLock, ReadWriteLock / StampedLock, ConcurrentHashMap, BlockingQueue, Atomic* / VarHandle (CAS), ExecutorService, CompletableFuture, CountDownLatch, CyclicBarrier, Semaphore, Phaser.",
        "Thread pool > raw threads: bounded resources, reuse, backpressure via a bounded queue + a rejection policy.",
        "Producer–consumer: a BlockingQueue decouples rates and provides backpressure. Pub–sub: Observer + async dispatch.",
        "Singleton thread-safety: eager init, holder idiom (best), or double-checked locking with volatile.",
        "Deadlock avoidance: global lock ordering, tryLock with timeout, minimal critical sections, never do I/O or call unknown code under a lock.",
        "Know the difference: race condition, visibility bug (needs volatile/atomic), deadlock, livelock, starvation.",
      ],
      detail: `
<h2>Thread-safe Singleton — the holder idiom</h2>
<pre><code>class Config {
  private Config(){ /* expensive load */ }
  private static class Holder { static final Config INSTANCE = new Config(); }
  public static Config get(){ return Holder.INSTANCE; }   // lazy + thread-safe, zero locking
}</code></pre>
<p>The JVM guarantees a class is initialized exactly once, under a lock it manages, and only on first use — so <code>Holder</code> loads lazily and safely. Double-checked locking is the fallback when you can't use a static holder (e.g. the instance depends on a runtime parameter): the field <b>must be <code>volatile</code></b> or another thread can see a non-null but partially constructed object.</p>

<h2>Producer–consumer with backpressure</h2>
<pre><code>BlockingQueue&lt;Task&gt; queue = new ArrayBlockingQueue&lt;&gt;(1000);
ExecutorService workers = Executors.newFixedThreadPool(8);

// producer:  queue.put(task);           // BLOCKS when full ⇒ upstream slows down (backpressure)
// consumer:  Task t = queue.take();     // BLOCKS when empty

// or a managed pool with an explicit bounded queue + rejection policy:
new ThreadPoolExecutor(8, 8, 0L, TimeUnit.MILLISECONDS,
    new ArrayBlockingQueue&lt;&gt;(1000),
    new ThreadPoolExecutor.CallerRunsPolicy());   // overloaded ⇒ run on the caller's thread, throttling it</code></pre>

<h2>Read-heavy shared state</h2>
<pre><code>ReadWriteLock rw = new ReentrantReadWriteLock();
rw.readLock().lock();
try { /* many concurrent readers */ } finally { rw.readLock().unlock(); }

rw.writeLock().lock();
try { /* exclusive writer */ } finally { rw.writeLock().unlock(); }</code></pre>
<p>If reads vastly dominate and the structure is a map, <code>ConcurrentHashMap</code> (lock striping + CAS) usually beats a hand-rolled RW lock. For "read often, write rarely, tolerate a stale snapshot", <code>CopyOnWriteArrayList</code> (used above for observer lists) is ideal.</p>

<h2>Lock-free counters &amp; accumulators</h2>
<pre><code>AtomicLong hits = new AtomicLong();
hits.incrementAndGet();                 // CAS retry loop under the hood, never blocks

LongAdder busyCounter = new LongAdder(); // striped: even better under high contention
busyCounter.increment();
long total = busyCounter.sum();</code></pre>

<h2>Coordinating startup / phases</h2>
<pre><code>CountDownLatch ready = new CountDownLatch(3);
// each of 3 init threads: doWork(); ready.countDown();
ready.await();                          // main thread proceeds once all 3 finish

CyclicBarrier barrier = new CyclicBarrier(4);  // reusable: N threads meet, then all proceed, repeat</code></pre>

<h2>Design checklist for any shared component</h2>
<ol>
<li>What is shared, and who writes it?</li>
<li>Can it be made immutable, or thread-local, or confined to one owner thread?</li>
<li>What is the <em>smallest</em> critical section? (Compute outside the lock, mutate inside.)</li>
<li>Is there a bounded queue somewhere providing backpressure, or can memory grow unbounded under load?</li>
<li>What is the shutdown behavior — drain in-flight work, or drop it?</li>
<li>Any compound "check-then-act" that needs to be atomic? (Use <code>computeIfAbsent</code>, <code>putIfAbsent</code>, CAS, or a lock — not two separate calls.)</li>
</ol>`,
      pitfalls: [
        "`Collections.synchronizedMap` still needs external synchronization for check-then-act — use ConcurrentHashMap's atomic methods.",
        "Unbounded queues that hide overload until OutOfMemoryError — always bound + pick a rejection policy.",
        "Catching InterruptedException and swallowing it — you lose cancellation; restore the flag or propagate.",
        "Holding a lock while calling a listener/callback/RPC of unknown duration.",
        "Double-checked locking without a volatile field.",
        "Assuming `synchronized` gives you cross-variable visibility guarantees beyond its own critical section.",
      ],
      interviewQs: [
        "Make this cache / counter / registry thread-safe with minimal contention.",
        "Design a bounded thread pool with graceful shutdown and backpressure.",
        "Explain double-checked locking and why `volatile` is required.",
        "Producer–consumer — how does a BlockingQueue provide backpressure?",
        "Difference between a race condition and a visibility bug.",
        "When would you use CountDownLatch vs CyclicBarrier vs Semaphore vs Phaser?",
      ],
    },
  ],
});
