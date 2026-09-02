/* CS fundamentals — OOP, OS, DBMS, Networking, concurrency. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "cs",
  title: "CS Fundamentals",
  icon: "🎓",
  blurb: "OOP & SOLID, design patterns, operating systems, DBMS, computer networks, concurrency — the theory rounds.",
  topics: [
    {
      id: "cs-oop",
      title: "OOP — Four Pillars",
      tags: ["oop"],
      brushup: [
        "<b>Encapsulation</b>: bundle data + behavior, hide internals behind an interface; expose via methods, validate in setters.",
        "<b>Abstraction</b>: expose <i>what</i>, hide <i>how</i>; program to interfaces/abstract classes.",
        "<b>Inheritance</b>: 'is-a' reuse; prefer <b>composition ('has-a')</b> to avoid fragile hierarchies.",
        "<b>Polymorphism</b>: one interface, many implementations. Compile-time (overloading) vs runtime (overriding / dynamic dispatch).",
        "Overriding: same signature, subclass behavior, resolved at runtime via vtable. Overloading: same name, different params, resolved at compile time.",
        "Association ⊂ Aggregation (weak, independent lifetime) ⊂ Composition (strong, owned lifetime).",
      ],
      detail: `
<h2>Encapsulation</h2>
<p>Keep fields private; mutate only through methods that can enforce invariants. This lets you change the representation later without breaking callers.</p>
<pre><code>class BankAccount {
  #balance = 0;                       // private field
  deposit(amt){ if (amt &lt;= 0) throw new Error("bad amount"); this.#balance += amt; }
  get balance(){ return this.#balance; }
}</code></pre>
<h2>Abstraction</h2>
<p>A <code>PaymentGateway</code> interface with <code>charge(amount)</code> hides whether it's Stripe, PayPal, or a mock. Callers depend on the contract, not the vendor.</p>
<h2>Inheritance vs composition</h2>
<p>Inheritance couples the subclass to the parent's implementation. If <code>Stack extends ArrayList</code>, callers can call <code>add(index, x)</code> and corrupt the stack. Composition (<code>Stack</code> <i>has</i> a list) exposes only what you intend. Rule of thumb: use inheritance only for true "is-a" + Liskov-substitutable relationships.</p>
<h2>Polymorphism</h2>
<pre><code>class Shape { area(){ throw new Error("abstract"); } }
class Circle extends Shape { constructor(r){ super(); this.r = r; } area(){ return Math.PI * this.r ** 2; } }
class Square extends Shape { constructor(s){ super(); this.s = s; } area(){ return this.s * this.s; } }

const shapes = [new Circle(2), new Square(3)];
const total = shapes.reduce((s, sh) =&gt; s + sh.area(), 0);   // dynamic dispatch</code></pre>`,
      diagram: `<svg viewBox="0 0 340 150" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="12">
<rect x="120" y="10" width="100" height="34" rx="4" fill="#3b82f6"/><text x="170" y="32" fill="#fff" text-anchor="middle">Shape (abstract)</text>
<rect x="30" y="100" width="110" height="34" rx="4" fill="#16a34a"/><text x="85" y="122" fill="#fff" text-anchor="middle">Circle</text>
<rect x="200" y="100" width="110" height="34" rx="4" fill="#16a34a"/><text x="255" y="122" fill="#fff" text-anchor="middle">Square</text>
<g stroke="#888" stroke-width="1.5" fill="none"><path d="M170 44 L85 100"/><path d="M170 44 L255 100"/></g>
</svg>`,
      diagramCaption: "Circle and Square override area(); client code calls area() on Shape.",
      pitfalls: [
        "Deep inheritance trees — brittle, hard to reason about. Favor composition + interfaces.",
        "Leaky encapsulation: returning a reference to an internal mutable list.",
        "Overriding equals() without hashCode() (Java) breaks hash collections.",
        "Confusing overloading (static) with overriding (dynamic).",
      ],
      interviewQs: [
        "Difference between abstraction and encapsulation with an example.",
        "When would you choose composition over inheritance?",
        "Explain runtime polymorphism and how the JVM implements it (vtables).",
      ],
    },
    {
      id: "cs-solid",
      title: "SOLID Principles",
      tags: ["oop", "design"],
      brushup: [
        "<b>S</b>ingle Responsibility: a class has one reason to change.",
        "<b>O</b>pen/Closed: open for extension, closed for modification — add behavior via new classes, not edits.",
        "<b>L</b>iskov Substitution: a subtype must be usable anywhere its base type is, without surprises.",
        "<b>I</b>nterface Segregation: many small client-specific interfaces beat one fat interface.",
        "<b>D</b>ependency Inversion: depend on abstractions; high-level modules shouldn't import low-level details.",
        "SOLID reduces coupling and makes code testable (inject fakes) and extensible.",
      ],
      detail: `
<h2>Single Responsibility</h2>
<p>A <code>UserService</code> that validates, persists, <i>and</i> emails is three responsibilities. Split into <code>UserValidator</code>, <code>UserRepository</code>, <code>EmailService</code>. Each changes for one reason.</p>
<h2>Open/Closed</h2>
<pre><code>// Bad: edit this every time a new shape appears
function area(shape){
  if (shape.type === "circle") return Math.PI * shape.r ** 2;
  if (shape.type === "square") return shape.s ** 2;
}
// Good: new shape = new class, no edits here
class Circle { area(){ /*...*/ } }
class Triangle { area(){ /*...*/ } }   // added later, nothing else changes</code></pre>
<h2>Liskov Substitution</h2>
<p>Classic violation: <code>Square extends Rectangle</code>. Setting width on a Square must also change height, breaking code that assumes <code>setWidth</code> leaves height alone. They shouldn't be in an inheritance relationship.</p>
<h2>Interface Segregation</h2>
<p>Don't force a <code>SimplePrinter</code> to implement <code>scan()</code> and <code>fax()</code> from a giant <code>Machine</code> interface. Split into <code>Printer</code>, <code>Scanner</code>, <code>Fax</code>.</p>
<h2>Dependency Inversion</h2>
<pre><code>// High-level OrderService depends on an abstraction, not on MySQL
class OrderService {
  constructor(repo /* : OrderRepository */){ this.repo = repo; }
  place(order){ this.repo.save(order); }
}
new OrderService(new MySqlOrderRepo());   // prod
new OrderService(new InMemoryOrderRepo()); // test</code></pre>`,
      pitfalls: [
        "Over-applying: 15 one-method classes for a CRUD app is its own kind of unmaintainable.",
        "Confusing SRP ('one reason to change') with 'one method'.",
        "DI without a container becomes constructor-argument sprawl — that's a smell, not a rule to fight.",
      ],
      interviewQs: [
        "Give a real code example where you refactored toward SRP or OCP.",
        "Explain a Liskov violation you've seen.",
        "How does dependency inversion help testing?",
      ],
    },
    {
      id: "cs-patterns",
      title: "Design Patterns (GoF essentials)",
      tags: ["design", "patterns"],
      brushup: [
        "<b>Creational</b>: Singleton, Factory Method, Abstract Factory, Builder, Prototype.",
        "<b>Structural</b>: Adapter, Decorator, Facade, Proxy, Composite, Bridge.",
        "<b>Behavioral</b>: Strategy, Observer, Command, Template Method, State, Iterator, Chain of Responsibility.",
        "Strategy: swap an algorithm at runtime via a common interface (payment methods, sorting).",
        "Observer: publish/subscribe; subject notifies observers on state change (event systems).",
        "Factory: centralize object creation so callers don't `new` concrete classes.",
        "Decorator: wrap an object to add behavior without subclassing (I/O streams).",
      ],
      detail: `
<h2>Strategy</h2>
<pre><code>class Checkout {
  constructor(payStrategy){ this.pay = payStrategy; }
  process(amount){ return this.pay.charge(amount); }
}
const card = { charge: a =&gt; \`charged \${a} to card\` };
const upi  = { charge: a =&gt; \`charged \${a} via UPI\` };
new Checkout(upi).process(500);</code></pre>
<h2>Observer</h2>
<pre><code>class Subject {
  #observers = new Set();
  subscribe(fn){ this.#observers.add(fn); return () =&gt; this.#observers.delete(fn); }
  notify(data){ for (const fn of this.#observers) fn(data); }
}</code></pre>
<h2>Factory Method</h2>
<pre><code>function createLogger(env){
  switch (env){
    case "prod": return new CloudLogger();
    case "test": return new NoopLogger();
    default:     return new ConsoleLogger();
  }
}</code></pre>
<h2>Singleton (and why to be careful)</h2>
<p>One instance, global access point (config, connection pool). Downsides: hidden global state, hard to test, concurrency needs care (double-checked locking / eager init). Often a DI-provided single instance is better.</p>
<h2>Decorator</h2>
<pre><code>const withRetry = (fn, n) =&gt; async (...args) =&gt; {
  for (let i = 0; i &lt; n; i++){
    try { return await fn(...args); } catch (e){ if (i === n - 1) throw e; }
  }
};</code></pre>`,
      pitfalls: [
        "Reaching for patterns before you have the problem — YAGNI.",
        "Singleton as a dumping ground for global mutable state.",
        "Confusing Adapter (change interface) with Decorator (add behavior, same interface) with Proxy (control access, same interface).",
      ],
      interviewQs: [
        "Design a notification system — which patterns and why?",
        "Strategy vs State pattern — what's the difference?",
        "How would you make a thread-safe Singleton?",
      ],
    },
    {
      id: "cs-os-process-thread",
      title: "OS — Processes, Threads & Context Switching",
      tags: ["os"],
      brushup: [
        "Process = program in execution with its own address space, file descriptors, PCB. Threads share the process's memory but have own stack + registers + PC.",
        "Thread pros: cheaper to create, share data directly. Cons: no isolation, need synchronization, one crash can take down the process.",
        "Context switch: save registers/PC of current, load next; costs µs + cache/TLB pollution.",
        "User threads (cheap, kernel-invisible) vs kernel threads (schedulable, blocking-safe). Modern runtimes: M:N / green threads / goroutines.",
        "IPC: pipes, message queues, shared memory (fastest, needs sync), sockets, signals.",
        "fork() duplicates the process (copy-on-write pages); exec() replaces the image.",
      ],
      detail: `
<h2>Process vs thread memory</h2>
<table>
<tr><th></th><th>Process</th><th>Thread</th></tr>
<tr><td>Address space</td><td>private</td><td>shared with siblings</td></tr>
<tr><td>Creation cost</td><td>high</td><td>low</td></tr>
<tr><td>Crash blast radius</td><td>isolated</td><td>whole process</td></tr>
<tr><td>Communication</td><td>IPC</td><td>shared memory (+ locks)</td></tr>
</table>
<h2>What a context switch costs</h2>
<p>Direct cost: saving/restoring CPU state (~1–10 µs). Indirect: the new thread's working set isn't in L1/L2, and on a process switch the TLB flushes and page tables reload. This is why thread pools and async I/O exist — to avoid switch churn.</p>
<h2>Thread states</h2>
<p>New → Runnable → Running → (Blocked/Waiting on I/O or lock) → Runnable → … → Terminated.</p>
<h2>Concurrency vs parallelism</h2>
<p>Concurrency = dealing with many things at once (structure). Parallelism = doing many things at once (execution, needs multiple cores). An async single-threaded server is concurrent, not parallel.</p>`,
      pitfalls: [
        "Assuming more threads = more speed. Past core count you just add switching overhead (unless I/O-bound).",
        "Sharing mutable state between threads without synchronization → data races.",
        "Forgetting that fork() in a multithreaded program only copies the calling thread.",
      ],
      interviewQs: [
        "Difference between a process and a thread; when would you use multiprocessing over multithreading?",
        "What happens during a context switch?",
        "Explain concurrency vs parallelism.",
      ],
    },
    {
      id: "cs-os-scheduling",
      title: "OS — CPU Scheduling",
      tags: ["os"],
      brushup: [
        "Goal: maximize CPU utilization & throughput; minimize turnaround, waiting, response time. Fairness vs efficiency trade-off.",
        "Non-preemptive: FCFS, SJF. Preemptive: Round Robin, SRTF, Priority (preemptive), Multilevel Feedback Queue.",
        "FCFS → convoy effect (short jobs stuck behind long ones). SJF → optimal average waiting time but needs burst prediction + can starve long jobs.",
        "Round Robin: time quantum q. Small q → responsive but high context-switch overhead; large q → degrades to FCFS.",
        "MLFQ (used by real OSes): multiple priority queues, jobs demoted for using full quantum, periodically boosted to prevent starvation.",
      ],
      detail: `
<h2>Metrics</h2>
<ul>
<li><b>Turnaround</b> = completion − arrival.</li>
<li><b>Waiting</b> = turnaround − burst.</li>
<li><b>Response</b> = first-run − arrival (matters for interactive systems).</li>
</ul>
<h2>Worked example (FCFS vs SJF)</h2>
<p>Jobs: A(burst 7), B(2), C(4), all arrive at t=0.</p>
<p>FCFS order A,B,C → waits 0, 7, 9 → avg 5.33.<br>
SJF order B,C,A → waits 0, 2, 6 → avg 2.67.</p>
<h2>Round Robin</h2>
<p>Each ready job gets q ms, then goes to the back of the queue. Guarantees response time ≤ (n−1)·q. Linux's CFS is a fair-share variant: it tracks per-task "virtual runtime" and always runs the task with the least, using a red-black tree.</p>
<h2>Starvation & aging</h2>
<p>Priority scheduling can starve low-priority tasks forever. <b>Aging</b> gradually raises the priority of waiting tasks.</p>`,
      pitfalls: [
        "SJF/SRTF are theoretical ideals — you can't know burst length in advance, only estimate (exponential averaging).",
        "Choosing a tiny RR quantum and drowning in context switches.",
        "Ignoring I/O-bound vs CPU-bound mix — real schedulers boost I/O-bound tasks for responsiveness.",
      ],
      interviewQs: [
        "Compare SJF and Round Robin; which for an interactive OS?",
        "What is the convoy effect?",
        "How does Linux CFS achieve fairness?",
      ],
    },
    {
      id: "cs-os-memory",
      title: "OS — Memory, Paging & Virtual Memory",
      tags: ["os"],
      brushup: [
        "Virtual memory: each process sees a private linear address space; MMU translates virtual→physical per access.",
        "Paging: fixed-size pages (e.g. 4 KB) mapped to frames via a page table. Eliminates external fragmentation; small internal fragmentation.",
        "TLB caches recent translations; a miss walks the (multi-level) page table.",
        "Page fault: page not resident → OS loads from disk (or kills on invalid access). Major (disk) vs minor (already in memory) fault.",
        "Replacement policies: LRU (approximated by clock/second-chance), FIFO (suffers Belady's anomaly), Optimal (theoretical).",
        "Thrashing: too little RAM for the working set → CPU spends all its time paging. Fix: more RAM, fewer processes, working-set model.",
      ],
      detail: `
<h2>Address translation</h2>
<p>Virtual address = [page number | offset]. Page number indexes the page table → frame number. Physical address = [frame number | offset]. Real systems use 4-level page tables (x86-64) so the table itself is sparse/paged.</p>
<h2>Demand paging</h2>
<p>Pages load lazily on first touch. A page fault traps to the kernel: find a free frame (or evict one), issue disk read, update page table, restart the faulting instruction.</p>
<h2>Page replacement — Clock (second chance)</h2>
<pre><code>// Each frame has a reference bit. Hand sweeps a circular buffer:
//   ref bit 1 -> clear it, advance (give a second chance)
//   ref bit 0 -> evict this frame</code></pre>
<h2>Segmentation vs paging</h2>
<p>Segmentation splits memory by logical unit (code, stack, heap) with variable sizes → external fragmentation. Modern systems use paging, sometimes with a thin segmentation layer.</p>
<h2>Copy-on-write</h2>
<p>After fork(), parent and child share physical pages marked read-only. On the first write, the OS copies just that page. Makes fork()+exec() cheap.</p>`,
      pitfalls: [
        "Confusing internal fragmentation (wasted space inside a page) with external (gaps between allocations).",
        "Assuming LRU is implemented exactly — it's approximated because true LRU needs per-access bookkeeping.",
        "Belady's anomaly: with FIFO, more frames can mean more faults.",
      ],
      interviewQs: [
        "Walk through what happens on a page fault.",
        "Why paging over segmentation?",
        "What is thrashing and how do you detect/fix it?",
      ],
    },
    {
      id: "cs-os-deadlock",
      title: "OS — Deadlock & Synchronization",
      tags: ["os", "concurrency"],
      brushup: [
        "Deadlock needs all 4 (Coffman) conditions: mutual exclusion, hold-and-wait, no preemption, circular wait.",
        "Handling: prevention (break a condition), avoidance (Banker's algorithm), detection + recovery, or ignore (ostrich — most OSes).",
        "Most practical fix: impose a global lock ordering to kill circular wait.",
        "Race condition: outcome depends on thread interleaving over shared state. Fix with mutual exclusion.",
        "Primitives: mutex (ownership), semaphore (counter), condition variable (wait/signal), monitor (lock + CVs), atomics/CAS.",
        "Livelock: threads keep changing state in response to each other, no progress. Starvation: a thread never gets the resource.",
      ],
      detail: `
<h2>The classic deadlock</h2>
<pre><code>// Thread 1: lock(A); lock(B);
// Thread 2: lock(B); lock(A);   // opposite order → circular wait
// Fix: everyone locks A before B.</code></pre>
<h2>Producer–consumer with a bounded buffer</h2>
<pre><code>// semaphores: empty = N, full = 0, mutex = 1
producer: wait(empty); wait(mutex); buf.push(x); signal(mutex); signal(full);
consumer: wait(full);  wait(mutex); x = buf.pop(); signal(mutex); signal(empty);</code></pre>
<h2>Banker's algorithm (avoidance)</h2>
<p>Before granting a request, check whether the resulting state is "safe" — i.e. there exists an ordering in which every process can still finish. If not, make the requester wait.</p>
<h2>Dining philosophers</h2>
<p>5 philosophers, 5 forks, each needs both neighbors' forks. Naive "pick left then right" deadlocks. Fixes: pick lower-numbered fork first (ordering), allow at most 4 to sit, or use an arbiter.</p>
<h2>CAS / lock-free</h2>
<pre><code>// compare-and-swap: atomically set *p = new if *p == expected
while (!CAS(&amp;counter, old = counter, old + 1)) { /* retry */ }</code></pre>`,
      pitfalls: [
        "Holding a lock while doing I/O or calling out to unknown code.",
        "Forgetting to release a lock on an exception path (use RAII / try-finally).",
        "Double-checked locking without a memory barrier / volatile.",
        "Priority inversion — a high-priority task waits on a lock held by a low-priority one (fix: priority inheritance).",
      ],
      interviewQs: [
        "Name the four conditions for deadlock and how to break each.",
        "Difference between a mutex and a semaphore.",
        "Solve dining philosophers without deadlock.",
      ],
    },
    {
      id: "cs-dbms-normalization",
      title: "DBMS — Normalization & Keys",
      tags: ["dbms"],
      brushup: [
        "Normalization removes redundancy & update/insert/delete anomalies by decomposing tables.",
        "1NF: atomic values, no repeating groups. 2NF: 1NF + no partial dependency on part of a composite key. 3NF: 2NF + no transitive dependency (non-key → non-key).",
        "BCNF: every determinant is a candidate key (stricter 3NF).",
        "Denormalization: deliberately add redundancy for read performance (reporting, caching) — trade write complexity.",
        "Keys: super key ⊇ candidate key ⊇ primary key; foreign key references another table's key; composite key = multiple columns.",
      ],
      detail: `
<h2>Anomalies normalization fixes</h2>
<ul>
<li><b>Update</b>: instructor's phone stored in every course row — change it in one place, others go stale.</li>
<li><b>Insertion</b>: can't add a new department until it has at least one employee.</li>
<li><b>Deletion</b>: deleting the last enrolment in a course also deletes the course info.</li>
</ul>
<h2>Step by step</h2>
<p><b>Unnormalized:</b> <code>Student(id, name, courses="CS101,CS102", advisor, advisor_dept)</code></p>
<p><b>1NF:</b> split the multivalued <code>courses</code> into rows → <code>Enrolment(student_id, course)</code>.</p>
<p><b>2NF:</b> if PK is <code>(student_id, course)</code>, then <code>name</code>/<code>advisor</code> depend only on <code>student_id</code> → move to <code>Student</code>.</p>
<p><b>3NF:</b> <code>advisor_dept</code> depends on <code>advisor</code>, not on <code>student_id</code> (transitive) → move to <code>Advisor(advisor, dept)</code>.</p>
<h2>When to stop</h2>
<p>3NF/BCNF is the usual target for OLTP. Analytics/warehouse schemas (star schema) are intentionally denormalized: one big fact table + dimension tables, optimized for aggregate reads.</p>`,
      pitfalls: [
        "Over-normalizing an OLTP schema so every query needs 6 joins.",
        "Denormalizing without a plan to keep the copies consistent (triggers, app logic, CDC).",
        "Confusing a candidate key with the primary key — there can be several candidates.",
      ],
      interviewQs: [
        "Normalize this table to 3NF and explain each step.",
        "When would you denormalize?",
        "Difference between 3NF and BCNF with an example.",
      ],
    },
    {
      id: "cs-dbms-index-txn",
      title: "DBMS — Indexing, Transactions & Isolation",
      tags: ["dbms"],
      brushup: [
        "Index = extra data structure (usually B+ tree) for fast lookup/range scans; speeds reads, slows writes, costs space.",
        "Clustered index defines physical row order (one per table, often the PK). Non-clustered points to rows.",
        "Composite index (a,b,c) helps queries filtering a leftmost prefix; column order matters. Covering index answers a query from the index alone.",
        "ACID: Atomicity (all-or-nothing), Consistency (constraints hold), Isolation (concurrent = some serial order), Durability (committed survives crash).",
        "Isolation levels: Read Uncommitted → Read Committed → Repeatable Read → Serializable. Higher = fewer anomalies, less concurrency.",
        "Anomalies: dirty read, non-repeatable read, phantom read, lost update, write skew.",
      ],
      detail: `
<h2>Why B+ trees</h2>
<p>Balanced, high fan-out (hundreds of keys per node) → tree height 3–4 for millions of rows → few disk seeks. Leaves are linked → efficient range scans. Hash indexes are O(1) point lookups but can't do ranges or ordering.</p>
<h2>Isolation levels vs anomalies</h2>
<table>
<tr><th>Level</th><th>Dirty read</th><th>Non-repeatable</th><th>Phantom</th></tr>
<tr><td>Read Uncommitted</td><td>possible</td><td>possible</td><td>possible</td></tr>
<tr><td>Read Committed</td><td>no</td><td>possible</td><td>possible</td></tr>
<tr><td>Repeatable Read</td><td>no</td><td>no</td><td>possible*</td></tr>
<tr><td>Serializable</td><td>no</td><td>no</td><td>no</td></tr>
</table>
<p>*MySQL InnoDB's Repeatable Read prevents phantoms via next-key locks; PostgreSQL uses snapshot isolation.</p>
<h2>Concurrency control</h2>
<ul>
<li><b>Pessimistic (2PL)</b>: acquire locks, hold until commit. Can deadlock.</li>
<li><b>Optimistic (MVCC)</b>: readers see a snapshot, writers create new versions, conflicts detected at commit. PostgreSQL, Oracle, modern MySQL.</li>
</ul>
<h2>Query tuning checklist</h2>
<p>Read the <code>EXPLAIN</code> plan · index the columns in WHERE/JOIN/ORDER BY · watch for full scans · avoid functions on indexed columns (<code>WHERE YEAR(d)=2024</code> kills the index) · keep selective columns first in composite indexes.</p>`,
      pitfalls: [
        "Indexing every column — writes and storage suffer, optimizer gets confused.",
        "Composite index column order wrong for the query's filter pattern.",
        "Assuming 'Repeatable Read' means the same across engines — it doesn't.",
        "Long-running transactions holding locks / bloating MVCC version chains.",
      ],
      interviewQs: [
        "How does a B+ tree index make lookups fast?",
        "Explain the isolation levels and which anomaly each allows.",
        "Optimistic vs pessimistic locking — when to use which?",
      ],
    },
    {
      id: "cs-sql-nosql",
      title: "DBMS — SQL vs NoSQL, CAP",
      tags: ["dbms", "system-design"],
      brushup: [
        "SQL (RDBMS): relational, schema-on-write, strong consistency, joins, ACID transactions. Great default for OLTP.",
        "NoSQL families: key-value (Redis, DynamoDB), document (MongoDB), wide-column (Cassandra, HBase), graph (Neo4j).",
        "NoSQL wins: horizontal scale, flexible schema, high write throughput, specific access patterns. Loses: ad-hoc queries, multi-entity transactions.",
        "CAP: under a network partition you must choose Consistency or Availability. Not a free choice the rest of the time — that's PACELC (else: Latency vs Consistency).",
        "Model NoSQL by query pattern first (denormalize, duplicate data), not by entities.",
      ],
      detail: `
<h2>Pick by workload</h2>
<table>
<tr><th>Need</th><th>Lean</th></tr>
<tr><td>Transactions across entities, reporting, unknown future queries</td><td>SQL</td></tr>
<tr><td>Massive scale, simple key lookups, predictable access</td><td>Key-value / wide-column</td></tr>
<tr><td>Nested/variable documents, per-tenant schema drift</td><td>Document</td></tr>
<tr><td>Relationship-heavy traversals (social, fraud rings)</td><td>Graph</td></tr>
</table>
<h2>CAP in practice</h2>
<ul>
<li><b>CP</b> (consistency + partition tolerance): HBase, MongoDB (default), etcd/ZooKeeper. Rejects/blocks writes during a partition.</li>
<li><b>AP</b> (availability + partition tolerance): Cassandra, DynamoDB, Riak. Stays writable, reconciles later (eventual consistency, tunable quorums).</li>
</ul>
<h2>Tunable consistency (Dynamo-style)</h2>
<p>With N replicas, require W acks on write and R responses on read. <code>R + W &gt; N</code> ⇒ strong-ish consistency. <code>W=1, R=1</code> ⇒ fast, eventual.</p>
<h2>Polyglot persistence</h2>
<p>Real systems mix: Postgres for orders, Redis for sessions/cache, Elasticsearch for search, S3 for blobs, a queue for events. Use the right store per job.</p>`,
      pitfalls: [
        "Choosing NoSQL for 'scale' at 10k rows — you lose joins and transactions for nothing.",
        "Treating 'eventually consistent' as 'occasionally wrong forever' — it converges, but design for stale reads.",
        "Misquoting CAP as 'pick 2 of 3' always — partitions are rare; the everyday tradeoff is latency vs consistency.",
      ],
      interviewQs: [
        "When would you pick NoSQL over a relational DB?",
        "Explain CAP and where Cassandra vs MongoDB sit.",
        "How does quorum (R/W/N) tuning work?",
      ],
    },
    {
      id: "cs-net-model",
      title: "Networking — TCP/IP Model, TCP vs UDP",
      tags: ["networking"],
      brushup: [
        "Layers (TCP/IP): Link → Internet (IP) → Transport (TCP/UDP) → Application (HTTP, DNS, SMTP). OSI splits app into 5/6/7.",
        "IP: best-effort, unreliable, packet routing via addresses. No delivery guarantee.",
        "TCP: connection-oriented, reliable, ordered, flow + congestion control. 3-way handshake (SYN, SYN-ACK, ACK), 4-way close.",
        "UDP: connectionless, no reliability/ordering, tiny header, low latency. Used by DNS, VoIP, video, QUIC, gaming.",
        "TCP reliability = sequence numbers + ACKs + retransmission + sliding window. Congestion control: slow start, AIMD, fast retransmit/recovery.",
        "Head-of-line blocking in TCP motivated QUIC (HTTP/3) over UDP.",
      ],
      detail: `
<h2>3-way handshake</h2>
<pre><code>Client → SYN (seq=x)
Server → SYN-ACK (seq=y, ack=x+1)
Client → ACK (ack=y+1)      // connection established</code></pre>
<h2>Why 3 and not 2</h2>
<p>Both sides must confirm the other's initial sequence number and that the path works in both directions. Two messages can't prove the client received the server's ISN.</p>
<h2>TCP vs UDP</h2>
<table>
<tr><th></th><th>TCP</th><th>UDP</th></tr>
<tr><td>Connection</td><td>yes (handshake)</td><td>no</td></tr>
<tr><td>Reliable / ordered</td><td>yes</td><td>no</td></tr>
<tr><td>Header</td><td>20+ bytes</td><td>8 bytes</td></tr>
<tr><td>Use</td><td>HTTP, SSH, DB</td><td>DNS, streaming, games, QUIC</td></tr>
</table>
<h2>Flow vs congestion control</h2>
<p><b>Flow control</b>: receiver advertises a window so a fast sender doesn't overrun a slow receiver. <b>Congestion control</b>: sender infers network capacity from loss/delay and backs off (slow start → congestion avoidance → on loss, cut the window).</p>
<h2>TIME_WAIT</h2>
<p>The side that closes first waits 2×MSL to absorb stray retransmissions and prevent an old duplicate from corrupting a new connection on the same port pair.</p>`,
      pitfalls: [
        "Saying UDP is 'faster' without nuance — it's lower overhead/latency, but you re-implement reliability if you need it.",
        "Forgetting TCP is a byte stream, not messages — you must frame your own message boundaries.",
        "Nagle's algorithm + delayed ACK causing latency spikes for small writes.",
      ],
      interviewQs: [
        "Walk through the TCP handshake and connection teardown.",
        "When would you choose UDP?",
        "How does TCP achieve reliability and congestion control?",
      ],
    },
    {
      id: "cs-net-http-dns",
      title: "Networking — HTTP(S), DNS, 'What happens when you type a URL'",
      tags: ["networking", "web"],
      brushup: [
        "DNS resolves a name to an IP: browser cache → OS cache → resolver → root → TLD → authoritative. Records: A/AAAA, CNAME, MX, TXT, NS.",
        "HTTP is stateless request/response. Methods: GET (safe, idempotent), POST (not), PUT/DELETE (idempotent), PATCH.",
        "Status classes: 1xx info, 2xx success, 3xx redirect, 4xx client error, 5xx server error. Know 200/201/204/301/302/304/400/401/403/404/409/429/500/502/503.",
        "HTTPS = HTTP over TLS: authentication (cert chain), encryption, integrity. TLS handshake negotiates keys (ECDHE) + cipher.",
        "HTTP/1.1 keep-alive + pipelining limits → HTTP/2 multiplexing over one TCP conn → HTTP/3 over QUIC/UDP (no TCP HoL blocking).",
        "Caching: Cache-Control, ETag/If-None-Match (304), CDN edge caching. Cookies, CORS, and same-origin policy govern browser behavior.",
      ],
      detail: `
<h2>Type google.com and hit enter</h2>
<ol>
<li>Browser checks its cache / HSTS list; decides scheme.</li>
<li><b>DNS</b> resolution to an IP (recursive resolver walks root → .com TLD → authoritative NS).</li>
<li><b>TCP</b> handshake to the server IP on port 443.</li>
<li><b>TLS</b> handshake: cert validation against a trusted CA, key exchange, cipher agreed.</li>
<li>Browser sends <code>GET / HTTP/2</code> with Host, cookies, Accept headers.</li>
<li>Server (often via load balancer → app server → DB/cache) returns HTML.</li>
<li>Browser parses HTML, builds the DOM, fetches CSS/JS/images (may be from a CDN), runs JS, renders, paints.</li>
</ol>
<h2>Idempotency & safety</h2>
<p>GET/HEAD are <i>safe</i> (no state change) and idempotent. PUT/DELETE are idempotent (repeat = same result). POST is neither — hence "confirm resubmission" prompts and the PRG (Post/Redirect/Get) pattern.</p>
<h2>ETag revalidation</h2>
<pre><code>GET /avatar.png            → 200, ETag: "abc123"
GET /avatar.png
If-None-Match: "abc123"     → 304 Not Modified (no body, save bandwidth)</code></pre>
<h2>HTTPS trust chain</h2>
<p>Server cert → signed by an intermediate CA → signed by a root CA in the OS/browser trust store. The browser verifies signatures up the chain, the hostname matches SAN, and the cert isn't expired/revoked (OCSP/CRL).</p>`,
      pitfalls: [
        "Using GET for state-changing actions (crawlers and prefetch will fire them).",
        "Confusing 401 (not authenticated) with 403 (authenticated but not allowed).",
        "Assuming HTTP/2 multiplexing removes TCP head-of-line blocking — packet loss still stalls all streams; that's HTTP/3's fix.",
        "Forgetting CORS is browser-enforced, not server security.",
      ],
      interviewQs: [
        "Explain what happens when you type a URL and press enter.",
        "Difference between 301 and 302; PUT vs PATCH; 401 vs 403.",
        "How does HTTPS establish trust and a shared key?",
      ],
    },
  ],
});
