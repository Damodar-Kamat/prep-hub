/* CS fundamentals — OOP, OS, DBMS, Networking, concurrency (deep-dive edition). */
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
        "<b>Encapsulation</b>: bundle data + behavior, hide internals behind an interface; expose via methods, validate in setters, protect invariants.",
        "<b>Abstraction</b>: expose <i>what</i>, hide <i>how</i>; depend on interfaces/abstract types, not concrete classes.",
        "<b>Inheritance</b>: 'is-a' reuse + subtype polymorphism; prefer <b>composition ('has-a')</b> to avoid fragile hierarchies.",
        "<b>Polymorphism</b>: one interface, many implementations. Compile-time (overloading, generics) vs runtime (overriding via dynamic dispatch / vtable).",
        "Overriding: same signature, subclass behavior, resolved at runtime. Overloading: same name, different params, resolved at compile time from static types.",
        "Association ⊂ Aggregation (weak 'has-a', independent lifetimes) ⊂ Composition (strong 'part-of', owned lifetime).",
        "Coupling (dependencies between modules) low is good; cohesion (how focused a module is) high is good.",
      ],
      detail: `
<h2>Encapsulation — protecting invariants</h2>
<p>Make fields private and mutate them only through methods that can enforce rules. The payoff: you can change the internal representation later without breaking callers, and illegal states become unrepresentable.</p>
<pre><code>class BankAccount {
  #balance = 0;                       // private field (真の private in modern JS)
  #frozen = false;
  deposit(amt){
    if (this.#frozen) throw new Error("account frozen");
    if (amt &lt;= 0) throw new Error("amount must be positive");
    this.#balance += amt;
  }
  withdraw(amt){
    if (amt &gt; this.#balance) throw new Error("insufficient funds");   // invariant: balance ≥ 0
    this.#balance -= amt;
  }
  get balance(){ return this.#balance; }
}</code></pre>
<p><b>Leaky encapsulation</b> — returning a reference to an internal mutable collection lets a caller bypass every rule:</p>
<pre><code>get transactions(){ return this.#txns; }              // BAD — caller can .push()
get transactions(){ return [...this.#txns]; }         // OK — defensive copy
get transactions(){ return Object.freeze([...this.#txns]); }  // stronger</code></pre>

<h2>Abstraction — programming to a contract</h2>
<p>A <code>PaymentGateway</code> interface with <code>charge(amount): Result</code> hides whether it's Stripe, PayPal, or an in-memory fake. Callers depend on the <em>contract</em>; you can swap implementations, add a caching decorator, or inject a mock in tests without touching call sites.</p>
<p>Abstraction vs encapsulation: abstraction is a <em>design</em> decision about which concepts to expose; encapsulation is the <em>mechanism</em> (access modifiers, methods) that enforces the boundary.</p>

<h2>Inheritance vs composition</h2>
<p>Inheritance couples the subclass to the parent's <em>implementation</em>, not just its interface. Classic breakage: <code>class Stack extends ArrayList</code> — now callers can call <code>add(index, x)</code> or <code>remove(0)</code> and corrupt the stack's contract. Composition exposes only what you intend:</p>
<pre><code>class Stack {
  #items = [];                        // HAS-A list, not IS-A list
  push(x){ this.#items.push(x); }
  pop(){ return this.#items.pop(); }
  peek(){ return this.#items[this.#items.length - 1]; }
  get size(){ return this.#items.length; }
}</code></pre>
<p>Use inheritance only when: it's a genuine "is-a", the subclass is <b>Liskov-substitutable</b> for the base, and you actually want to inherit behavior (not just share code — that's what composition/mixins are for).</p>

<h2>Polymorphism — dynamic dispatch</h2>
<pre><code>class Shape { area(){ throw new Error("abstract"); } }
class Circle extends Shape { constructor(r){ super(); this.r = r; } area(){ return Math.PI * this.r ** 2; } }
class Rect   extends Shape { constructor(w, h){ super(); this.w = w; this.h = h; } area(){ return this.w * this.h; } }

const shapes = [new Circle(2), new Rect(3, 4)];
const total = shapes.reduce((s, sh) =&gt; s + sh.area(), 0);   // each call dispatches on the real type
</code></pre>
<p>How the JVM/CLR do it: each class has a <b>vtable</b> (array of method pointers). An object header points to its class's vtable. A virtual call is "load vtable pointer, index into it, jump" — one extra indirection. <code>final</code>/<code>sealed</code> methods and JIT devirtualization remove even that.</p>

<h2>Relationship types (UML)</h2>
<table>
<tr><th>Relationship</th><th>Meaning</th><th>Lifetime</th><th>Example</th></tr>
<tr><td>Dependency</td><td>uses temporarily (parameter, local)</td><td>—</td><td>OrderService uses a Logger</td></tr>
<tr><td>Association</td><td>knows / holds a reference</td><td>independent</td><td>Student — Course</td></tr>
<tr><td>Aggregation</td><td>has-a, shared ownership</td><td>independent (part can outlive whole)</td><td>Team — Player</td></tr>
<tr><td>Composition</td><td>owns, exclusive</td><td>bound (part dies with whole)</td><td>House — Room, Order — OrderLine</td></tr>
<tr><td>Inheritance</td><td>is-a</td><td>—</td><td>Circle — Shape</td></tr>
</table>

<h2>Common interview traps</h2>
<ul>
<li><b>equals/hashCode</b> (Java): override both together and keep them consistent, or hash collections silently break.</li>
<li><b>Constructor calling an overridable method</b>: the subclass override runs before the subclass constructor initializes its fields.</li>
<li><b>Covariance/contravariance</b>: an override may return a more specific type (covariant return) but must accept the same or wider parameters.</li>
<li><b>Diamond problem</b>: multiple inheritance of state is banned in Java/C#; default interface methods reintroduce a limited form and require explicit resolution.</li>
</ul>`,
      diagram: `<svg viewBox="0 0 360 160" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="12">
<rect x="130" y="12" width="120" height="30" rx="4" fill="#3b82f6"/><text x="190" y="32" fill="#fff" text-anchor="middle">«abstract» Shape</text>
<rect x="20" y="110" width="100" height="30" rx="4" fill="#16a34a"/><text x="70" y="130" fill="#fff" text-anchor="middle">Circle</text>
<rect x="140" y="110" width="100" height="30" rx="4" fill="#16a34a"/><text x="190" y="130" fill="#fff" text-anchor="middle">Rectangle</text>
<rect x="260" y="110" width="90" height="30" rx="4" fill="#16a34a"/><text x="305" y="130" fill="#fff" text-anchor="middle">Triangle</text>
<g stroke="#888" stroke-width="1.5" fill="none"><path d="M190 42 L70 110"/><path d="M190 42 L190 110"/><path d="M190 42 L305 110"/></g>
<text x="190" y="70" text-anchor="middle" fill="#888">area() overridden by each</text>
</svg>`,
      diagramCaption: "Subtype polymorphism: client code calls area() on a Shape reference; the real subclass method runs.",
      pitfalls: [
        "Deep inheritance trees — brittle, hard to reason about. Favor composition + small interfaces.",
        "Leaky encapsulation: returning a reference to an internal mutable list/map.",
        "Overriding equals() without hashCode() (Java) — breaks HashSet/HashMap.",
        "Confusing overloading (static, by declared type) with overriding (dynamic, by runtime type).",
        "Calling an overridable method from a constructor.",
        "Using inheritance purely to reuse code — use composition/mixins instead.",
      ],
      interviewQs: [
        "Difference between abstraction and encapsulation, with an example.",
        "When would you choose composition over inheritance? Give a concrete case.",
        "Explain runtime polymorphism and how the JVM implements it (vtables).",
        "Overloading vs overriding — how is each resolved?",
        "What's the Liskov Substitution Principle and how does Square/Rectangle violate it?",
        "Aggregation vs composition — how do you decide in a design?",
      ],
    },

    {
      id: "cs-solid",
      title: "SOLID Principles",
      tags: ["oop", "design"],
      brushup: [
        "<b>S</b>ingle Responsibility: a class has one reason to change (one actor/stakeholder it answers to).",
        "<b>O</b>pen/Closed: open for extension, closed for modification — add behavior via new types, not by editing existing code.",
        "<b>L</b>iskov Substitution: a subtype must be usable anywhere the base type is expected, with no surprising behavior or strengthened preconditions.",
        "<b>I</b>nterface Segregation: many small client-specific interfaces beat one fat interface nobody fully implements.",
        "<b>D</b>ependency Inversion: high-level modules and low-level modules both depend on abstractions; details depend on abstractions, not vice versa.",
        "Net effect: low coupling, high cohesion, testable (inject fakes), extensible without regression risk.",
        "All five are guidelines, not laws — over-applying SRP/DIP produces its own unmaintainable sprawl.",
      ],
      detail: `
<h2>S — Single Responsibility</h2>
<p>"Reason to change" = a stakeholder or axis of change. A <code>UserService</code> that validates input, persists to a DB, <em>and</em> sends a welcome email serves three masters: the product team (validation rules), the DBA (schema), and marketing (email copy). A change from any of them risks the others.</p>
<pre><code>class RegisterUser {
  constructor(validator, users, mailer){ this.validator = validator; this.users = users; this.mailer = mailer; }
  async run(dto){
    this.validator.check(dto);                 // rules change → change validator only
    const user = await this.users.create(dto); // schema change → change repository only
    await this.mailer.sendWelcome(user);       // copy change → change mailer only
    return user;
  }
}</code></pre>

<h2>O — Open/Closed</h2>
<pre><code>// closed: adding a shipping method forces edits + retesting of this function
function shippingCost(order){
  if (order.method === "standard") return 5;
  if (order.method === "express")  return 15;
  // ...every new method edits here
}
// open: a new method is a new class; this code never changes
interface ShippingStrategy { cost(order): number }
class StandardShipping implements ShippingStrategy { cost(o){ return 5; } }
class ExpressShipping  implements ShippingStrategy { cost(o){ return 15; } }
class DroneShipping    implements ShippingStrategy { cost(o){ return o.weight * 2; } }   // added later</code></pre>
<p>Mechanisms: polymorphism, strategy injection, plugin registries, configuration. The goal is that likely future changes are additive.</p>

<h2>L — Liskov Substitution</h2>
<p>Formally: if S is a subtype of T, then objects of T may be replaced with objects of S without altering desirable properties. Violations:</p>
<ul>
<li><code>Square extends Rectangle</code>: <code>setWidth(5)</code> on a Square must also change height, breaking any code that expects width and height to be independent.</li>
<li>A <code>ReadOnlyList</code> that <code>extends List</code> but throws on <code>add()</code> — it strengthened a precondition.</li>
<li>An override that returns <code>null</code> where the base contract promised non-null.</li>
</ul>
<p>Rules of thumb: subtypes may <b>weaken preconditions</b> and <b>strengthen postconditions</b>, never the reverse; don't throw new exception types the caller can't anticipate; preserve invariants.</p>

<h2>I — Interface Segregation</h2>
<pre><code>// fat interface: a SimplePrinter is forced to stub scan() and fax()
interface Machine { print(d); scan(d); fax(d); }
// segregated:
interface Printer { print(d); }
interface Scanner { scan(d); }
interface Fax     { fax(d); }
class SimplePrinter implements Printer { print(d){ /* ... */ } }
class AllInOne implements Printer, Scanner, Fax { /* ... */ }</code></pre>
<p>Small interfaces also make mocking trivial and reduce the "recompile the world" blast radius.</p>

<h2>D — Dependency Inversion</h2>
<pre><code>// OrderService (high-level policy) must not import MySqlOrderRepo (low-level detail)
interface OrderRepository { save(order): Promise&lt;void&gt;; findById(id): Promise&lt;Order&gt;; }

class OrderService {
  constructor(private repo: OrderRepository){}
  async place(order){ await this.repo.save(order); }
}

new OrderService(new MySqlOrderRepo());     // production
new OrderService(new InMemoryOrderRepo());  // tests — fast, no DB</code></pre>
<p>DI (dependency <em>injection</em>) is the common technique; DIP is the principle. The abstraction (<code>OrderRepository</code>) is owned by the high-level module's package, so the dependency arrow points inward (hexagonal / ports-and-adapters architecture).</p>

<h2>When SOLID goes wrong</h2>
<ul>
<li>15 one-method classes and 6 interfaces for a CRUD screen — cohesion collapsed into fragmentation.</li>
<li>Interfaces with exactly one implementation, forever — premature abstraction; extract it when the second implementation appears.</li>
<li>A DI container wiring 40 constructor args — the design is the problem, not the wiring.</li>
</ul>
<p>Apply SOLID where change actually happens. Stable, simple code doesn't need the ceremony.</p>`,
      pitfalls: [
        "Over-applying: excessive tiny classes/interfaces that obscure the flow.",
        "Confusing SRP ('one reason to change') with 'one public method'.",
        "Liskov violations via inheritance where a 'is-a' doesn't truly hold (Square/Rectangle, Ostrich/Bird).",
        "DIP without owning the abstraction — depending on a vendor's interface still couples you to the vendor.",
        "Adding an interface 'for testability' when the concrete class is already trivially fakeable.",
      ],
      interviewQs: [
        "Give a real example where you refactored toward SRP or OCP.",
        "Explain a Liskov Substitution violation you've encountered.",
        "How does the Dependency Inversion Principle improve testing?",
        "Difference between Dependency Inversion and Dependency Injection.",
        "When is applying SOLID counterproductive?",
      ],
    },

    {
      id: "cs-patterns",
      title: "Design Patterns (GoF essentials)",
      tags: ["design", "patterns"],
      brushup: [
        "<b>Creational</b>: Singleton, Factory Method, Abstract Factory, Builder, Prototype — how objects get made.",
        "<b>Structural</b>: Adapter, Decorator, Facade, Proxy, Composite, Bridge, Flyweight — how objects compose.",
        "<b>Behavioral</b>: Strategy, Observer, Command, Template Method, State, Iterator, Chain of Responsibility, Mediator, Visitor — how objects collaborate.",
        "Strategy: swap an interchangeable algorithm at runtime via a common interface (payment, compression, pricing).",
        "Observer: publish/subscribe — a subject notifies dependents on state change (event buses, reactive UIs).",
        "Factory: centralize construction so callers don't `new` concrete classes.",
        "Decorator: wrap an object to add behavior while keeping the same interface (streams, middleware, retries).",
        "Adapter changes an interface; Decorator adds behavior; Proxy controls access — all keep the wrapped type's interface.",
      ],
      detail: `
<h2>Strategy</h2>
<pre><code>class Compressor {
  constructor(strategy){ this.strategy = strategy; }
  compress(data){ return this.strategy.compress(data); }
}
const gzip  = { compress: d =&gt; /* ... */ };
const brotli = { compress: d =&gt; /* ... */ };
new Compressor(brotli).compress(payload);</code></pre>
<p>Strategy vs <b>State</b>: same structure (delegate to a swappable object), different intent. Strategy is chosen by the client and usually stable for an operation; State transitions itself based on events (a <code>Document</code> moving Draft → Review → Published, each state allowing different actions).</p>

<h2>Observer</h2>
<pre><code>class Subject {
  #observers = new Set();
  subscribe(fn){ this.#observers.add(fn); return () =&gt; this.#observers.delete(fn); }
  notify(event){ for (const fn of [...this.#observers]) fn(event); }
}
const stock = new Subject();
const unsub = stock.subscribe(e =&gt; console.log("price", e.price));
stock.notify({ price: 42 });
unsub();</code></pre>
<p>Concerns in production: synchronous vs async dispatch, error isolation (one bad observer shouldn't break others), ordering, memory leaks from observers that never unsubscribe, re-entrancy (an observer that mutates the subject).</p>

<h2>Factory Method / Abstract Factory</h2>
<pre><code>function createLogger(env){
  switch (env){
    case "prod": return new CloudLogger();
    case "test": return new NoopLogger();
    default:     return new ConsoleLogger();
  }
}
// Abstract Factory = a factory that produces a *family* of related objects
// (e.g. a UIFactory yielding matching Button + Checkbox + Menu for a theme)</code></pre>

<h2>Builder</h2>
<pre><code>const query = new QueryBuilder()
  .select("id", "name")
  .from("users")
  .where("age &gt; 18")
  .orderBy("name")
  .limit(50)
  .build();</code></pre>
<p>Use when an object has many optional parameters (avoids "telescoping constructors") or needs step-by-step construction with validation at <code>build()</code>.</p>

<h2>Decorator</h2>
<pre><code>const withRetry = (fn, n, delay = 100) =&gt; async (...args) =&gt; {
  for (let i = 0; i &lt; n; i++){
    try { return await fn(...args); }
    catch (e){ if (i === n - 1) throw e; await sleep(delay * 2 ** i); }
  }
};
const withTimeout = (fn, ms) =&gt; (...args) =&gt;
  Promise.race([fn(...args), sleep(ms).then(() =&gt; { throw new Error("timeout"); })]);

const robustFetch = withRetry(withTimeout(fetch, 3000), 3);   // composable, same call signature</code></pre>

<h2>Facade & Proxy</h2>
<p><b>Facade</b>: one simple entry point over a messy subsystem (a <code>MediaConverter.convert(file)</code> hiding codecs, containers, muxing). <b>Proxy</b>: same interface as the real object, but adds a concern — lazy loading (virtual proxy), access control (protection proxy), caching, remote calls (RPC stub), logging.</p>

<h2>Singleton — and its costs</h2>
<pre><code>// holder idiom: lazy + thread-safe without locking (JVM class-init guarantees)
class Config {
  static #instance;
  static get(){ return Config.#instance ??= new Config(); }
  #load(){ /* ... */ }
}</code></pre>
<p>Downsides: hidden global state (hard to reason about), tight coupling (callers reach for <code>Config.get()</code> everywhere), painful to test (shared mutable state across tests), concurrency pitfalls. Often a single instance <b>provided by DI</b> gives the "one instance" benefit without the global.</p>

<h2>Pattern selection cheat sheet</h2>
<table>
<tr><th>Problem</th><th>Pattern</th></tr>
<tr><td>Interchangeable algorithms chosen at runtime</td><td>Strategy</td></tr>
<tr><td>Object behavior changes with its lifecycle state</td><td>State</td></tr>
<tr><td>One-to-many "notify on change"</td><td>Observer</td></tr>
<tr><td>Decouple request from handler; queue/undo/log operations</td><td>Command</td></tr>
<tr><td>Add responsibilities without subclass explosion</td><td>Decorator</td></tr>
<tr><td>Incompatible interfaces need to work together</td><td>Adapter</td></tr>
<tr><td>Tree of part-whole objects treated uniformly</td><td>Composite</td></tr>
<tr><td>Simplify a complex subsystem for clients</td><td>Facade</td></tr>
<tr><td>Pass a request along a chain of potential handlers</td><td>Chain of Responsibility</td></tr>
</table>`,
      pitfalls: [
        "Reaching for patterns before you have the problem — adds indirection with no payoff (YAGNI).",
        "Singleton as a dumping ground for global mutable state.",
        "Confusing Adapter (change interface) / Decorator (add behavior) / Proxy (control access) — all wrap, different intent.",
        "Observer memory leaks — subscriptions that are never disposed.",
        "Deep decorator stacks that make debugging a stack trace miserable.",
        "Template Method with a base class that dictates too much — often Strategy composes better.",
      ],
      interviewQs: [
        "Design a notification system — which patterns and why?",
        "Strategy vs State — what's the difference in intent?",
        "How would you make a thread-safe Singleton, and would you use one?",
        "Where would you use the Decorator pattern in a real codebase?",
        "Adapter vs Facade — when each?",
        "Implement an event emitter / observer with unsubscribe.",
      ],
    },

    {
      id: "cs-os-process-thread",
      title: "OS — Processes, Threads & Context Switching",
      tags: ["os"],
      brushup: [
        "Process = program in execution: own virtual address space, PCB, file descriptor table, at least one thread.",
        "Thread = unit of scheduling: own stack, registers, PC, thread-local storage; shares code/heap/globals/FDs with sibling threads.",
        "Thread pros: cheap to create, direct data sharing. Cons: no memory isolation, need synchronization, one bad pointer crashes the whole process.",
        "Context switch: save registers/PC/SP of current, load next. µs of direct cost + cache/TLB pollution (indirect). Process switch also flushes the TLB / reloads page tables.",
        "User threads (cheap, cooperative, kernel-invisible) vs kernel threads (preemptible, blocking-safe). M:N models: goroutines, virtual threads, green threads.",
        "IPC: pipes, named pipes/FIFOs, message queues, shared memory (fastest, needs sync), Unix domain sockets, signals, memory-mapped files.",
        "fork() = copy the process (copy-on-write pages); exec() = replace the image; a thread pool avoids per-task creation cost.",
      ],
      detail: `
<h2>Address space layout</h2>
<pre><code> high ┌─────────────┐
      │   stack     │  grows down — locals, return addresses, saved regs (per thread)
      │     ↓       │
      │             │
      │     ↑       │
      │   heap      │  grows up — malloc/new
      ├─────────────┤
      │  BSS / data │  globals & statics
      │   text      │  machine code (read-only, shareable)
  low └─────────────┘</code></pre>
<p>All threads of a process share text, data, BSS, and heap. Each thread gets its own stack (a few MB reserved, lazily paged).</p>

<h2>Process vs thread</h2>
<table>
<tr><th></th><th>Process</th><th>Thread</th></tr>
<tr><td>Address space</td><td>private</td><td>shared with siblings</td></tr>
<tr><td>Creation cost</td><td>high (page tables, FD table)</td><td>low (just a stack + TCB)</td></tr>
<tr><td>Context switch cost</td><td>higher (TLB flush)</td><td>lower</td></tr>
<tr><td>Crash blast radius</td><td>isolated</td><td>whole process</td></tr>
<tr><td>Communication</td><td>IPC (copy or shared-mem + sync)</td><td>shared memory + locks</td></tr>
<tr><td>Use when</td><td>fault isolation, security boundary, independent lifecycle</td><td>shared work, low latency, many concurrent I/O ops</td></tr>
</table>
<p>Chrome uses a process per site for isolation (a compromised renderer can't read another tab). A database server uses threads/thread-pools for shared buffer-pool access.</p>

<h2>What a context switch costs</h2>
<ul>
<li><b>Direct</b>: kernel saves ~16–32 registers + PC + SP, updates the run queue, restores the next thread's state. ~1–5 µs.</li>
<li><b>Indirect</b>: the new thread's working set isn't in L1/L2 — cold cache misses for a while. On a <em>process</em> switch, the TLB is flushed (or PCID-tagged) and page-table root changes.</li>
</ul>
<p>Implication: spawning thousands of threads that each do a little work spends most of the CPU switching. Thread pools, event loops, and async I/O all exist to cut switch churn.</p>

<h2>Concurrency vs parallelism</h2>
<p><b>Concurrency</b> = structuring a program as independently progressing tasks (a property of the design). <b>Parallelism</b> = actually running things simultaneously (needs multiple cores). A single-threaded async web server is highly concurrent, zero parallel. A parallel matrix multiply may be barely concurrent in design.</p>

<h2>Thread states</h2>
<pre><code>New → Runnable ⇄ Running → Terminated
              ↘ Blocked/Waiting (I/O, lock, sleep, condition) ↗</code></pre>

<h2>fork() gotchas</h2>
<ul>
<li>Copy-on-write: pages are shared read-only until one side writes, then that page is copied. Makes <code>fork()+exec()</code> cheap.</li>
<li>In a multithreaded process, <code>fork()</code> duplicates only the calling thread — locks held by other threads are copied in a locked state ⇒ deadlock risk. Only async-signal-safe calls are allowed between fork and exec.</li>
</ul>`,
      pitfalls: [
        "Assuming more threads = more speed — past core count (for CPU-bound work) you just add switching overhead.",
        "Sharing mutable state between threads without synchronization → data races (UB in C/C++, torn reads elsewhere).",
        "fork() in a multithreaded program and expecting all threads/locks to be sane in the child.",
        "Blocking a thread-pool thread on I/O — starves the pool; use async I/O or a dedicated pool.",
        "Thread-local storage leaking when threads are pooled and reused.",
      ],
      interviewQs: [
        "Process vs thread — and when would you use multiprocessing over multithreading?",
        "Walk through exactly what happens during a context switch.",
        "Concurrency vs parallelism with an example of each.",
        "What is copy-on-write and how does it make fork() efficient?",
        "Why is a thread pool better than creating a thread per task?",
      ],
    },

    {
      id: "cs-os-scheduling",
      title: "OS — CPU Scheduling",
      tags: ["os"],
      brushup: [
        "Goals: maximize CPU utilization & throughput; minimize turnaround, waiting, and response time; ensure fairness and avoid starvation.",
        "Non-preemptive: FCFS, SJF, priority (non-preemptive). Preemptive: Round Robin, SRTF, priority (preemptive), MLFQ.",
        "FCFS → convoy effect. SJF → provably optimal average waiting time but needs burst prediction & can starve long jobs.",
        "Round Robin: time quantum q. Small q → responsive, high switch overhead; large q → degrades toward FCFS.",
        "MLFQ (real OSes): multiple priority queues; a job that uses its full quantum is demoted; periodic priority boost prevents starvation; short/interactive jobs float to the top.",
        "Linux CFS: no fixed quanta — tracks per-task virtual runtime, always runs the task with the least, stored in a red-black tree; 'nice' scales the vruntime rate.",
      ],
      detail: `
<h2>Metrics (know the formulas)</h2>
<ul>
<li><b>Turnaround time</b> = completion − arrival</li>
<li><b>Waiting time</b> = turnaround − CPU burst = time spent in the ready queue</li>
<li><b>Response time</b> = first time on CPU − arrival (the metric interactive systems optimize)</li>
<li><b>Throughput</b> = jobs completed per unit time</li>
</ul>

<h2>Worked example</h2>
<p>Jobs arrive at t=0: A (burst 7), B (2), C (4).</p>
<table>
<tr><th>Policy</th><th>Order</th><th>Waiting times</th><th>Avg wait</th></tr>
<tr><td>FCFS</td><td>A, B, C</td><td>0, 7, 9</td><td>5.33</td></tr>
<tr><td>SJF</td><td>B, C, A</td><td>0, 2, 6</td><td>2.67</td></tr>
</table>
<p>SJF minimizes average waiting time because putting a short job first delays only one job a little, while putting a long job first delays many jobs a lot.</p>

<h2>Round Robin</h2>
<p>Each ready job runs for at most <code>q</code>, then goes to the back of the queue. Response time ≤ (n−1)·q. Tuning: q too small → the CPU spends a large fraction on context switches (if switch cost is 10 µs and q is 100 µs, that's 9% overhead); q too big → long jobs monopolize and it becomes FCFS. Typical q: 10–100 ms.</p>

<h2>Multilevel Feedback Queue</h2>
<pre><code>Q0: quantum 8ms   (highest priority)
Q1: quantum 16ms
Q2: FCFS           (lowest)

- new job enters Q0
- uses full quantum without blocking  → demote one level  (likely CPU-bound)
- blocks for I/O before quantum ends   → stay / promote     (likely interactive)
- every ~1s: move everything back to Q0 (aging → no starvation)</code></pre>
<p>This <em>learns</em> a job's nature from its behavior — no need to know burst lengths in advance.</p>

<h2>Linux CFS (Completely Fair Scheduler)</h2>
<p>Idea: give every runnable task an equal share of CPU over time. Each task has a <code>vruntime</code> (virtual runtime) that advances as it runs, scaled by its weight (from <code>nice</code>). The scheduler always picks the task with the <em>smallest</em> vruntime — kept in a red-black tree keyed by vruntime, so "pick next" is O(log n). A task that sleeps doesn't accumulate vruntime, so I/O-bound tasks naturally get priority when they wake.</p>

<h2>Priority scheduling & starvation</h2>
<p>Strict priority can starve low-priority tasks forever if high-priority work keeps arriving. <b>Aging</b> gradually raises a waiting task's priority. <b>Priority inversion</b>: a high-priority task blocks on a lock held by a low-priority task that a medium task keeps preempting — fixed by <b>priority inheritance</b> (the low task temporarily inherits the high priority) or priority ceiling.</p>

<h2>Real-time scheduling</h2>
<p>Hard real-time needs guarantees: <b>Rate-Monotonic</b> (static priorities by period, schedulable if utilization ≤ ~69% for many tasks) or <b>Earliest-Deadline-First</b> (dynamic, optimal, schedulable up to 100% utilization).</p>`,
      pitfalls: [
        "SJF/SRTF are ideals — you can't know burst length; real schedulers estimate via exponential averaging of past bursts.",
        "Choosing a tiny RR quantum and drowning in context switches.",
        "Ignoring the I/O-bound vs CPU-bound mix — the whole point of MLFQ/CFS is favoring interactivity.",
        "Forgetting starvation when proposing priority scheduling — always mention aging.",
        "Confusing response time (first dispatch) with turnaround time (completion).",
      ],
      interviewQs: [
        "Compare SJF and Round Robin — which for an interactive OS and why?",
        "What is the convoy effect and which policy causes it?",
        "How does an MLFQ decide a job's priority?",
        "Explain how Linux CFS achieves fairness.",
        "What is priority inversion and how is it solved?",
        "Given these arrival/burst times, compute average waiting time for FCFS/SJF/RR.",
      ],
    },

    {
      id: "cs-os-memory",
      title: "OS — Memory, Paging & Virtual Memory",
      tags: ["os"],
      brushup: [
        "Virtual memory: each process sees a private contiguous address space; the MMU translates virtual→physical on every access, with the OS managing the mapping.",
        "Paging: fixed-size pages (e.g. 4 KB) → frames, via a (multi-level) page table. Kills external fragmentation; small internal fragmentation.",
        "TLB caches recent translations; a miss triggers a page-table walk (hardware or software).",
        "Page fault: referenced page not resident → OS loads it from disk/zero-fills, or SIGSEGV on an invalid access. Minor (in memory, just not mapped) vs major (disk I/O).",
        "Replacement: Optimal (theoretical), LRU (approximated by clock/second-chance/aging), FIFO (suffers Belady's anomaly), LFU.",
        "Thrashing: working set > RAM → the system spends all its time paging. Fix: more RAM, fewer processes, working-set / PFF control, or kill something.",
        "Demand paging, copy-on-write, memory-mapped files, and swap are all built on the page-fault mechanism.",
      ],
      detail: `
<h2>Address translation</h2>
<p>A virtual address splits into <code>[page number | offset]</code>. The page number indexes the page table to get a frame number; the physical address is <code>[frame number | offset]</code>. x86-64 uses a <b>4-level</b> page table (PML4 → PDPT → PD → PT) so the table is itself sparse and paged; a full walk is up to 4 memory accesses, which is why the TLB matters.</p>
<pre><code>access a[i]
  → split VA into VPN + offset
  → TLB hit?  yes → get PFN, done (1 cycle-ish)
             no  → walk page table (tens of cycles) → fill TLB
  → page present bit set? no → PAGE FAULT → trap to kernel</code></pre>

<h2>Page fault handling</h2>
<ol>
<li>MMU traps to the kernel with the faulting address.</li>
<li>Kernel checks the VMA: is this address valid for this process? If not → SIGSEGV.</li>
<li>Find a free frame (or evict one via the replacement policy, writing it back if dirty).</li>
<li>Load the page: from the file (mmap), from swap, or zero-fill (fresh anonymous page).</li>
<li>Update the page table + TLB; restart the faulting instruction.</li>
</ol>

<h2>Replacement policies</h2>
<table>
<tr><th>Policy</th><th>Idea</th><th>Notes</th></tr>
<tr><td>Optimal (Belady)</td><td>evict the page used furthest in the future</td><td>unimplementable; a benchmark</td></tr>
<tr><td>LRU</td><td>evict least-recently-used</td><td>needs per-access timestamp/list — too costly exactly; approximated</td></tr>
<tr><td>Clock / second-chance</td><td>circular scan; ref-bit 1 → clear &amp; skip, 0 → evict</td><td>cheap LRU approximation used in practice</td></tr>
<tr><td>FIFO</td><td>evict oldest-loaded</td><td>simple; Belady's anomaly (more frames → more faults)</td></tr>
</table>

<h2>Copy-on-write</h2>
<p>After <code>fork()</code>, parent and child share every physical page, marked read-only. The first write by either triggers a fault; the kernel copies just that page and makes it writable for that process. Real memory is only spent on pages that actually diverge.</p>

<h2>Memory-mapped files</h2>
<p><code>mmap()</code> maps a file's bytes into the address space. Reads become page faults that pull file blocks; writes mark pages dirty and get flushed by the page cache. Enables shared memory between processes and lets you treat a big file as an array without explicit <code>read()</code>/<code>write()</code>.</p>

<h2>Thrashing & the working-set model</h2>
<p>The <b>working set</b> W(t, Δ) is the set of pages a process touched in the last Δ references. If the sum of working sets exceeds physical frames, every process constantly evicts pages another process needs → CPU utilization craters while disk saturates. Detection: page-fault frequency (PFF) too high. Response: suspend/swap out whole processes to give the rest enough frames.</p>

<h2>Segmentation vs paging</h2>
<p>Segmentation divides memory by logical unit (code, stack, heap, a specific data structure) with variable sizes → external fragmentation, but natural protection/sharing boundaries. Paging uses fixed blocks → no external fragmentation, simpler allocation. Modern systems are paging-first; x86 keeps a vestigial segmentation layer mostly unused in 64-bit mode.</p>`,
      diagram: `<svg viewBox="0 0 360 150" xmlns="http://www.w3.org/2000/svg" font-family="monospace" font-size="11">
<rect x="10" y="20" width="120" height="100" fill="none" stroke="#888"/><text x="70" y="14" text-anchor="middle" fill="#888">virtual pages</text>
<rect x="230" y="20" width="120" height="100" fill="none" stroke="#888"/><text x="290" y="14" text-anchor="middle" fill="#888">physical frames</text>
<g fill="#3b82f6"><rect x="12" y="22" width="116" height="18"/><rect x="12" y="62" width="116" height="18"/><rect x="12" y="82" width="116" height="18"/></g>
<g fill="#16a34a"><rect x="232" y="42" width="116" height="18"/><rect x="232" y="82" width="116" height="18"/><rect x="232" y="22" width="116" height="18"/></g>
<g stroke="#d97706" stroke-width="1.5"><line x1="128" y1="31" x2="232" y2="91"/><line x1="128" y1="71" x2="232" y2="31"/><line x1="128" y1="91" x2="232" y2="51"/></g>
<text x="180" y="140" text-anchor="middle" fill="#888">page table maps VPN → PFN (non-contiguous)</text>
</svg>`,
      diagramCaption: "Paging: contiguous virtual pages map to scattered physical frames; unmapped pages live on disk until faulted in.",
      pitfalls: [
        "Confusing internal fragmentation (waste inside a page) with external (gaps between allocations).",
        "Assuming true LRU is implemented — it's approximated (clock/aging) because exact LRU is too expensive.",
        "Belady's anomaly: with FIFO, adding frames can increase page faults.",
        "Ignoring that a page fault on a hot path can cost milliseconds (disk) — 10,000× a cache hit.",
        "Forgetting that the page table itself consumes memory (multi-level tables mitigate this).",
      ],
      interviewQs: [
        "Walk through what happens on a page fault, step by step.",
        "Why paging over pure segmentation?",
        "What is thrashing, how do you detect it, and how do you fix it?",
        "Explain copy-on-write and where the OS uses it.",
        "Difference between a minor and a major page fault.",
        "How does a TLB improve performance, and what happens on a TLB miss?",
      ],
    },

    {
      id: "cs-os-deadlock",
      title: "OS — Deadlock & Synchronization",
      tags: ["os", "concurrency"],
      brushup: [
        "Deadlock requires ALL four Coffman conditions: mutual exclusion, hold-and-wait, no preemption, circular wait. Break any one to prevent deadlock.",
        "Strategies: prevention (structurally break a condition), avoidance (Banker's algorithm — only grant if the resulting state is safe), detection + recovery (resource-allocation graph / kill/rollback), or ignore (the 'ostrich' — most general-purpose OSes).",
        "Most practical prevention: impose a global lock ordering to eliminate circular wait.",
        "Race condition: result depends on thread interleaving over shared state. Fixed by mutual exclusion or by making the op atomic.",
        "Primitives: mutex (ownership, one holder), semaphore (counter, signaling), condition variable (wait/notify with a lock), monitor (lock + CVs bundled), atomics/CAS (lock-free).",
        "Livelock: threads keep reacting to each other, changing state but not progressing. Starvation: a thread never acquires the resource (unfair locks, priority).",
      ],
      detail: `
<h2>The four conditions and how to break each</h2>
<table>
<tr><th>Condition</th><th>Break it by…</th></tr>
<tr><td>Mutual exclusion</td><td>make the resource shareable (read-only), or use lock-free structures — often not possible</td></tr>
<tr><td>Hold and wait</td><td>acquire all locks at once, or release all before requesting more (two-phase locking)</td></tr>
<tr><td>No preemption</td><td>allow the OS/runtime to revoke a resource (rollback in DBs; not viable for a mutex)</td></tr>
<tr><td>Circular wait</td><td><b>global lock ordering</b> — everyone acquires locks in the same total order (most common fix)</td></tr>
</table>

<h2>The classic deadlock and its fix</h2>
<pre><code>// Thread 1: lock(A); lock(B);
// Thread 2: lock(B); lock(A);      // opposite order → they can each hold one and wait for the other

// Fix: define an order (e.g. by address / id) and always lock lower first
function transfer(from, to, amt){
  const [first, second] = from.id &lt; to.id ? [from, to] : [to, from];
  lock(first); lock(second);
  try { from.balance -= amt; to.balance += amt; }
  finally { unlock(second); unlock(first); }
}</code></pre>

<h2>Producer–consumer (bounded buffer)</h2>
<pre><code>// counting semaphores: empty = N, full = 0; binary mutex = 1
producer(): wait(empty); wait(mutex); buf.push(x); signal(mutex); signal(full);
consumer(): wait(full);  wait(mutex); x = buf.pop(); signal(mutex); signal(empty);</code></pre>
<p>Order matters: taking <code>mutex</code> before <code>empty</code>/<code>full</code> would let a producer hold the mutex while blocked on a full buffer → deadlock.</p>

<h2>Condition variables</h2>
<pre><code>lock(m);
while (!predicate())        // ALWAYS a while, never an if — spurious wakeups + races
  cond.wait(m);             // atomically releases m and sleeps; reacquires m on wake
// ... use the resource ...
unlock(m);

// other side:
lock(m); changeState(); cond.signal(); unlock(m);</code></pre>

<h2>Banker's algorithm (avoidance)</h2>
<p>Each process declares its maximum resource need up front. Before granting a request, the OS simulates the allocation and checks whether the resulting state is <b>safe</b> — i.e. there is some ordering in which every process can obtain its maximum and finish. If no safe sequence exists, the request blocks. Rarely used in practice (needs max claims in advance) but a classic exam topic.</p>

<h2>Dining philosophers</h2>
<p>5 philosophers, 5 forks, each needs both neighbors' forks. Naive "grab left then right" deadlocks when all grab left simultaneously. Fixes: (a) global ordering — pick the lower-numbered fork first; (b) allow at most 4 to sit at once (a semaphore of 4); (c) an arbiter/waiter that hands out fork-pairs; (d) odd philosophers grab left first, even grab right first.</p>

<h2>Lock-free with CAS</h2>
<pre><code>// atomic compare-and-swap: set *p = newVal iff *p == expected, return success
let old, next;
do {
  old = counter;
  next = old + 1;
} while (!CAS(&amp;counter, old, next));    // retry on contention, never blocks</code></pre>
<p>Lock-free structures avoid deadlock and priority inversion entirely, but are hard to get right (ABA problem, memory reclamation, memory ordering) — use the standard library's.</p>

<h2>Memory ordering (the reason <code>volatile</code> exists)</h2>
<p>Compilers and CPUs reorder memory operations for speed. Without a memory barrier/fence, one thread's writes can become visible to another thread out of order, breaking double-checked locking and hand-rolled flags. Java <code>volatile</code> / C++ <code>std::atomic</code> insert the necessary barriers and establish happens-before.</p>`,
      pitfalls: [
        "Holding a lock while doing I/O or calling out to unknown/user code.",
        "Releasing a lock only on the happy path — use RAII / try-finally / defer.",
        "`if` instead of `while` around `cond.wait` (spurious wakeups, and the condition may change before you run).",
        "Double-checked locking without `volatile`/atomic — the partially constructed object can leak.",
        "Priority inversion left unaddressed (mention priority inheritance).",
        "Assuming `synchronized`/`lock` gives ordering guarantees across unrelated variables — it doesn't beyond the critical section.",
      ],
      interviewQs: [
        "Name the four conditions for deadlock and how to break each.",
        "Difference between a mutex and a semaphore; when would you use a binary semaphore vs a mutex?",
        "Solve dining philosophers without deadlock — give two approaches.",
        "Why must you loop on a condition variable's predicate?",
        "Explain the Banker's algorithm.",
        "What is a race condition? Show one and fix it.",
        "What does `volatile` (Java) actually guarantee?",
      ],
    },

    {
      id: "cs-dbms-normalization",
      title: "DBMS — Normalization & Keys",
      tags: ["dbms"],
      brushup: [
        "Normalization decomposes tables to remove redundancy and the update/insert/delete anomalies it causes.",
        "1NF: atomic column values, no repeating groups / arrays in a cell.",
        "2NF: 1NF + every non-key column depends on the WHOLE composite key (no partial dependency).",
        "3NF: 2NF + no transitive dependency (non-key column depending on another non-key column).",
        "BCNF: for every functional dependency X → Y, X is a superkey (stricter 3NF; resolves some 3NF edge cases).",
        "Denormalization: deliberately reintroduce redundancy for read performance (reporting, star schemas, precomputed aggregates) — you then own keeping copies consistent.",
        "Keys: superkey ⊇ candidate key ⊇ primary key; alternate keys are the non-chosen candidates; foreign key references another relation's key; surrogate (auto id) vs natural key.",
      ],
      detail: `
<h2>The anomalies normalization removes</h2>
<ul>
<li><b>Update anomaly</b>: an instructor's office is stored on every course row they teach — moving offices means updating many rows; miss one and the data contradicts itself.</li>
<li><b>Insertion anomaly</b>: you can't record a new department until it has at least one employee (because department data only lives in the employee table).</li>
<li><b>Deletion anomaly</b>: deleting the last student enrolled in a course also erases the course's existence.</li>
</ul>

<h2>Functional dependencies</h2>
<p><code>X → Y</code> means "X determines Y": any two rows with the same X must have the same Y. Normalization is the process of decomposing so that every FD's left side is a key. To find candidate keys, compute attribute closures: X is a candidate key if X⁺ = all attributes and no proper subset does.</p>

<h2>Step by step</h2>
<p><b>Unnormalized:</b> <code>Student(id, name, courses="CS101;CS102", advisor, advisor_dept)</code></p>
<p><b>→ 1NF:</b> remove the multivalued <code>courses</code> — one row per enrolment: <code>Enrolment(student_id, course)</code>, and <code>Student(id, name, advisor, advisor_dept)</code>.</p>
<p><b>→ 2NF:</b> if <code>Enrolment</code>'s PK were <code>(student_id, course)</code> and it also held <code>grade_points_for_student</code> depending only on <code>student_id</code>, that's a partial dependency — move it to <code>Student</code>. (Here <code>Enrolment</code> is already 2NF.)</p>
<p><b>→ 3NF:</b> in <code>Student</code>, <code>advisor_dept</code> depends on <code>advisor</code>, not on <code>id</code> (transitive: id → advisor → advisor_dept). Split: <code>Student(id, name, advisor)</code> and <code>Advisor(advisor, dept)</code>.</p>

<h2>3NF vs BCNF</h2>
<p>3NF allows <code>X → Y</code> where X isn't a superkey <em>if</em> Y is a prime attribute (part of some candidate key). BCNF forbids that entirely. Example where they differ: <code>(student, subject) → teacher</code> and <code>teacher → subject</code>. Candidate keys are <code>(student, subject)</code> and <code>(student, teacher)</code>. It's 3NF (subject is prime) but not BCNF (<code>teacher → subject</code>, teacher not a superkey). BCNF decomposition can lose the ability to enforce some FDs by a single-table constraint — a rare trade-off.</p>

<h2>Where to stop</h2>
<p>OLTP: aim for 3NF/BCNF — it keeps writes consistent and the schema evolvable. Analytics / data warehouse: use a <b>star schema</b> — one wide fact table (events/measurements) joined to small denormalized dimension tables, optimized for scanning and aggregation, not for updates. 4NF/5NF address multivalued and join dependencies and rarely come up in interviews beyond the name.</p>`,
      pitfalls: [
        "Over-normalizing OLTP so every read needs 6 joins — 3NF, not maximal decomposition.",
        "Denormalizing with no plan to keep the duplicated data consistent (triggers, app logic, CDC).",
        "Confusing a candidate key with the primary key — there can be several candidates; you pick one.",
        "Storing CSV / JSON blobs in a column and calling it 1NF when you actually query into it.",
        "Assuming surrogate keys are always right — natural keys can prevent duplicate rows for free.",
      ],
      interviewQs: [
        "Normalize this table to 3NF and explain each transformation.",
        "Difference between 3NF and BCNF with an example.",
        "When would you denormalize, and how do you keep the copies in sync?",
        "What is a functional dependency? How do you find candidate keys?",
        "Surrogate key vs natural key — trade-offs.",
      ],
    },

    {
      id: "cs-dbms-index-txn",
      title: "DBMS — Indexing, Transactions & Isolation",
      tags: ["dbms"],
      brushup: [
        "Index = auxiliary structure (usually a B+ tree) for fast lookup / range scans / ordering. Speeds reads, slows writes, costs space.",
        "Clustered index = table rows physically stored in index order (one per table, usually the PK). Non-clustered index stores keys + a pointer/PK to the row.",
        "Composite index (a, b, c) serves queries filtering a leftmost prefix (a; a,b; a,b,c); order matters. Covering index answers a query entirely from the index.",
        "A function or leading wildcard on an indexed column (WHERE YEAR(d)=2024, LIKE '%foo') disables the index.",
        "ACID: Atomicity (all-or-nothing via WAL/undo), Consistency (constraints hold), Isolation (concurrent ≈ some serial order), Durability (committed survives crash via WAL + fsync).",
        "Isolation levels: Read Uncommitted → Read Committed → Repeatable Read → Serializable. Higher = fewer anomalies, less concurrency.",
        "Anomalies: dirty read, non-repeatable read, phantom read, lost update, write skew.",
      ],
      detail: `
<h2>Why B+ trees for indexes</h2>
<p>Balanced, very high fan-out (hundreds of keys per node because a node = a disk page), so tree height is 3–4 even for hundreds of millions of rows ⇒ a lookup is 3–4 page reads. Leaf nodes are linked in order ⇒ range scans and ORDER BY are cheap. Hash indexes give O(1) equality lookups but can't do ranges, ordering, or prefix matches.</p>
<pre><code>-- helped by INDEX(status, created_at):
SELECT * FROM orders WHERE status = 'PAID' AND created_at &gt; '2024-01-01' ORDER BY created_at;
-- NOT helped (function on column):
SELECT * FROM orders WHERE DATE(created_at) = '2024-01-01';
-- partially helped by INDEX(a, b): filters on a, but b alone can't use it
SELECT * FROM t WHERE b = 5;</code></pre>

<h2>Reading a query plan</h2>
<p>Run <code>EXPLAIN [ANALYZE]</code>. Watch for: full table scans on big tables, "Using filesort" / "Using temporary", nested-loop joins over unindexed keys, row estimates far off from reality (stale statistics — run ANALYZE). Fixes: add/adjust indexes, rewrite to be sargable, denormalize, or add a covering index.</p>

<h2>Isolation levels vs anomalies</h2>
<table>
<tr><th>Level</th><th>Dirty read</th><th>Non-repeatable read</th><th>Phantom</th></tr>
<tr><td>Read Uncommitted</td><td>possible</td><td>possible</td><td>possible</td></tr>
<tr><td>Read Committed <i>(PostgreSQL default)</i></td><td>no</td><td>possible</td><td>possible</td></tr>
<tr><td>Repeatable Read <i>(MySQL InnoDB default)</i></td><td>no</td><td>no</td><td>no in InnoDB (next-key locks); possible in the SQL standard</td></tr>
<tr><td>Serializable</td><td>no</td><td>no</td><td>no</td></tr>
</table>
<ul>
<li><b>Dirty read</b>: read another transaction's uncommitted change.</li>
<li><b>Non-repeatable read</b>: re-read the same row, get a different value (someone committed an update in between).</li>
<li><b>Phantom</b>: re-run the same <code>WHERE</code>, get new rows (someone inserted matching rows).</li>
<li><b>Write skew</b> (Serializable prevents, Snapshot Isolation doesn't): two transactions read an overlapping set, each updates a different row based on it, together violating an invariant (e.g. "at least one doctor on call").</li>
</ul>

<h2>Concurrency control</h2>
<ul>
<li><b>Pessimistic (2-phase locking)</b>: acquire shared/exclusive locks, hold until commit (growing then shrinking phase). Guarantees serializability; can deadlock (the DB detects a cycle and aborts a victim).</li>
<li><b>Optimistic / MVCC</b>: readers get a consistent snapshot (a version as of transaction start); writers create new row versions; conflicts are detected at commit and one transaction is rolled back. Readers never block writers and vice versa. Used by PostgreSQL, Oracle, InnoDB. Cost: version bloat, vacuum/GC.</li>
</ul>

<h2>Durability mechanics</h2>
<p><b>Write-ahead logging</b>: before modifying a data page, append the change to a sequential log and <code>fsync</code> it. On crash, replay committed log records (redo) and undo uncommitted ones. Group commit batches multiple transactions' fsyncs. <code>synchronous_commit=off</code> / relaxed <code>innodb_flush_log_at_trx_commit</code> trade a few ms of possible data loss for throughput.</p>`,
      pitfalls: [
        "Indexing every column — writes and storage suffer, and the optimizer can pick a worse plan.",
        "Composite index with the wrong column order for the query's filter/sort pattern.",
        "Non-sargable predicates: functions on columns, leading `%` in LIKE, implicit type casts.",
        "Assuming 'Repeatable Read' means the same thing across engines — it doesn't (phantom behavior differs).",
        "Long-running transactions holding locks / bloating MVCC version chains / blocking vacuum.",
        "Relying on Snapshot Isolation to prevent write skew — it doesn't; you need Serializable or explicit locking.",
      ],
      interviewQs: [
        "How does a B+ tree index make lookups fast? Why not a hash index?",
        "Explain each isolation level and the anomaly it does/doesn't allow.",
        "Optimistic vs pessimistic concurrency control — when to use which?",
        "What makes a query non-sargable? Rewrite one to use an index.",
        "How does the database guarantee durability across a crash?",
        "What is write skew and which isolation level prevents it?",
      ],
    },

    {
      id: "cs-sql-nosql",
      title: "DBMS — SQL vs NoSQL, CAP & PACELC",
      tags: ["dbms", "system-design"],
      brushup: [
        "SQL/RDBMS: relational model, schema-on-write, ACID transactions, joins, mature tooling. The right default for OLTP and anything with evolving query needs.",
        "NoSQL families: key-value (Redis, DynamoDB), document (MongoDB), wide-column (Cassandra, Bigtable, HBase), graph (Neo4j).",
        "NoSQL strengths: horizontal scale, flexible/sparse schema, high write throughput, latency at scale. Weaknesses: limited multi-entity transactions, weak ad-hoc querying, you model by access pattern.",
        "CAP: during a network PARTITION you must choose Consistency (reject/block) or Availability (serve possibly stale). It's not a general 'pick 2 of 3'.",
        "PACELC: if Partitioned → choose A or C; Else (normal operation) → choose Latency or Consistency.",
        "Tunable consistency (Dynamo-style): with N replicas, if R + W > N a read quorum overlaps a write quorum ⇒ strong-ish reads.",
        "Real systems are polyglot: relational for core data + Redis cache + search index + object store + a queue.",
      ],
      detail: `
<h2>Pick by workload, not by hype</h2>
<table>
<tr><th>Need</th><th>Lean toward</th></tr>
<tr><td>Transactions across entities, reporting, unknown future queries, referential integrity</td><td>Relational (Postgres/MySQL)</td></tr>
<tr><td>Simple key lookups at massive scale, predictable single-partition access</td><td>Key-value / wide-column (DynamoDB, Cassandra)</td></tr>
<tr><td>Nested/variable documents, per-tenant schema drift, developer velocity</td><td>Document (MongoDB)</td></tr>
<tr><td>Relationship-heavy traversals (social graph, fraud rings, recommendations)</td><td>Graph (Neo4j)</td></tr>
<tr><td>Full-text search, faceting, relevance ranking</td><td>Search engine (Elasticsearch, OpenSearch)</td></tr>
<tr><td>Time series / metrics</td><td>Time-series DB (TimescaleDB, InfluxDB)</td></tr>
</table>
<p>"NoSQL for scale" at 10k rows just trades away joins and transactions for nothing. Postgres comfortably handles millions of rows and tens of thousands of TPS on one box; reach for distributed stores when you genuinely outgrow that or need multi-region writes.</p>

<h2>Modeling for NoSQL</h2>
<p>You design around <b>queries first</b>. In DynamoDB you pick a partition key that spreads load and a sort key that supports your range queries; you <em>denormalize and duplicate</em> data so each query hits one partition; you may keep multiple item "views" of the same entity. There are no joins — you either embed related data or do application-side joins.</p>

<h2>CAP, concretely</h2>
<ul>
<li><b>CP</b> (consistency + partition tolerance): during a partition, the minority side stops serving writes (and often reads). Examples: HBase, MongoDB (default majority writes), etcd/ZooKeeper/Consul, Spanner.</li>
<li><b>AP</b> (availability + partition tolerance): every node keeps serving; replicas reconcile afterward (eventual consistency, last-write-wins or CRDTs or vector clocks). Examples: Cassandra, DynamoDB, Riak.</li>
</ul>
<p>You never sacrifice P — partitions happen whether you like it or not. And partitions are rare; PACELC's "Else Latency vs Consistency" is the everyday trade-off (a synchronous cross-region write for strong consistency costs you 100+ ms).</p>

<h2>Tunable consistency (quorums)</h2>
<pre><code>N = 3 replicas
W = 2, R = 2   → W + R (4) &gt; N (3) → any read quorum intersects the last write quorum → fresh reads
W = 3, R = 1   → strong, but any replica down blocks writes
W = 1, R = 1   → lowest latency, eventual consistency
</code></pre>
<p>Dynamo-style systems also use hinted handoff (temporarily store a write meant for a down node elsewhere) and read repair (fix stale replicas during reads) + anti-entropy (Merkle-tree background sync).</p>

<h2>NewSQL / distributed SQL</h2>
<p>Spanner, CockroachDB, YugabyteDB: relational model + ACID transactions + horizontal scale, using consensus (Paxos/Raft) per shard and (for Spanner) synchronized clocks. They pay latency for global consistency. Good when you truly need both SQL semantics and multi-region scale.</p>`,
      pitfalls: [
        "Choosing NoSQL 'for scale' before you've hit a relational DB's limits.",
        "Treating 'eventually consistent' as 'occasionally permanently wrong' — it converges, but you must design for stale reads.",
        "Misquoting CAP as 'always pick 2 of 3' — the choice only bites during a partition.",
        "Last-write-wins conflict resolution silently dropping concurrent updates.",
        "Modeling a document DB like a relational one (deep references, app-side joins everywhere).",
        "Ignoring the operational cost of running several data stores (backups, monitoring, expertise).",
      ],
      interviewQs: [
        "When would you pick NoSQL over a relational database? Give a concrete scenario.",
        "Explain CAP and place MongoDB vs Cassandra on it.",
        "What is PACELC and why is it more useful day-to-day than CAP?",
        "How does quorum (R/W/N) tuning trade consistency for availability?",
        "How would you model a shopping cart / activity feed in DynamoDB?",
        "What problem do Spanner/CockroachDB solve that classic RDBMS and NoSQL don't?",
      ],
    },

    {
      id: "cs-net-model",
      title: "Networking — TCP/IP Model, TCP vs UDP",
      tags: ["networking"],
      brushup: [
        "Layers (TCP/IP): Link (Ethernet/Wi-Fi, MAC) → Internet (IP, ICMP, routing) → Transport (TCP/UDP, ports) → Application (HTTP, DNS, TLS, SMTP). OSI splits the top into session/presentation/application.",
        "IP: best-effort, connectionless, unreliable packet delivery; routers forward by destination IP; no ordering or delivery guarantee.",
        "TCP: connection-oriented, reliable, ordered byte stream, flow control + congestion control. 3-way handshake (SYN, SYN-ACK, ACK); graceful 4-way close (FIN/ACK each way).",
        "UDP: connectionless, unreliable, unordered, 8-byte header, no congestion control. Used by DNS, DHCP, VoIP, video, gaming, QUIC.",
        "TCP reliability = sequence numbers + cumulative ACKs + retransmission (timeout or 3 duplicate ACKs) + sliding window.",
        "Congestion control: slow start (exponential) → congestion avoidance (linear / AIMD) → on loss, multiplicative decrease; fast retransmit/recovery.",
        "TCP head-of-line blocking (one lost segment stalls all bytes behind it) motivated QUIC / HTTP/3 over UDP.",
      ],
      detail: `
<h2>Encapsulation as data goes down the stack</h2>
<pre><code>[ HTTP request                      ]   application
[ TCP header | HTTP request         ]   segment
[ IP header  | TCP header | payload ]   packet
[ Eth header | IP packet | Eth FCS  ]   frame</code></pre>
<p>Each layer adds its own header (and the link layer a trailer); the receiver strips them on the way up. Ports (TCP/UDP) demultiplex to the right process; IP addresses route between hosts; MAC addresses deliver within a link.</p>

<h2>3-way handshake</h2>
<pre><code>Client → SYN,  seq = x
Server → SYN-ACK, seq = y, ack = x + 1
Client → ACK,  ack = y + 1        // established; data can now flow both ways</code></pre>
<p>Why three and not two: each side must (a) announce its initial sequence number and (b) confirm it received the other's. Two messages can't prove the client got the server's ISN. The random ISN also guards against stale segments from a previous connection on the same 4-tuple.</p>

<h2>TCP vs UDP</h2>
<table>
<tr><th></th><th>TCP</th><th>UDP</th></tr>
<tr><td>Connection</td><td>yes (handshake, state)</td><td>no</td></tr>
<tr><td>Reliability / ordering</td><td>yes</td><td>no (app must handle)</td></tr>
<tr><td>Flow &amp; congestion control</td><td>yes</td><td>no</td></tr>
<tr><td>Header size</td><td>20–60 bytes</td><td>8 bytes</td></tr>
<tr><td>Model</td><td>byte stream (you frame messages yourself)</td><td>datagrams (message boundaries preserved)</td></tr>
<tr><td>Best for</td><td>HTTP, SSH, DB, file transfer</td><td>DNS, DHCP, real-time media, QUIC, game state</td></tr>
</table>

<h2>Flow control vs congestion control</h2>
<ul>
<li><b>Flow control</b> protects the <em>receiver</em>: it advertises a receive window (rwnd); the sender never has more unACKed data outstanding than rwnd.</li>
<li><b>Congestion control</b> protects the <em>network</em>: the sender maintains a congestion window (cwnd) inferred from loss/delay signals. Effective window = min(rwnd, cwnd).</li>
</ul>
<pre><code>slow start:          cwnd doubles each RTT until ssthresh or loss
congestion avoidance: cwnd += 1 MSS per RTT (linear)
loss via 3 dup ACKs:  cwnd = cwnd/2 (fast recovery)   — mild signal
loss via timeout:     cwnd = 1 MSS, back to slow start — severe signal</code></pre>
<p>Modern variants: CUBIC (default on Linux), BBR (models bandwidth × RTT instead of reacting to loss).</p>

<h2>Retransmission</h2>
<p>Each segment has a sequence number; the receiver sends cumulative ACKs ("I have everything up to byte N"). The sender retransmits if the retransmission timer (RTO, based on smoothed RTT + variance) expires, or on <b>3 duplicate ACKs</b> (fast retransmit — don't wait for the timeout). Selective ACK (SACK) lets the receiver report non-contiguous received ranges so the sender resends only the gaps.</p>

<h2>TIME_WAIT</h2>
<p>The side that sends the final ACK of the close stays in TIME_WAIT for 2×MSL (~1–4 min). This absorbs any retransmitted FIN and ensures a delayed duplicate segment from this connection can't be misinterpreted by a new connection reusing the same 4-tuple. Servers that open many short-lived outbound connections can exhaust ephemeral ports — mitigations: connection pooling, <code>SO_REUSEADDR</code>, keep-alive.</p>`,
      pitfalls: [
        "Saying 'UDP is faster' without nuance — it's lower overhead/latency, but you reimplement reliability if you need it.",
        "Forgetting TCP is a byte stream — a single `send` can arrive split or coalesced; you must frame messages (length-prefix or delimiter).",
        "Nagle's algorithm + delayed ACK interacting to add ~40 ms latency to small request/response — disable Nagle (`TCP_NODELAY`) for RPC.",
        "Assuming a successful `write()` means the peer received the data — it's just in the send buffer.",
        "Ignoring TIME_WAIT accumulation on a busy client/proxy.",
      ],
      interviewQs: [
        "Walk through the TCP 3-way handshake and the connection teardown.",
        "Why 3 messages for the handshake and not 2?",
        "When would you choose UDP over TCP?",
        "How does TCP achieve reliability? How does congestion control work?",
        "What is TCP head-of-line blocking and how does QUIC address it?",
        "What is TIME_WAIT and why does it exist?",
      ],
    },

    {
      id: "cs-net-http-dns",
      title: "Networking — HTTP(S), DNS, 'What happens when you type a URL'",
      tags: ["networking", "web"],
      brushup: [
        "DNS resolves a name to an IP: browser cache → OS cache → configured resolver → root → TLD → authoritative. Records: A/AAAA, CNAME, MX, TXT, NS, SOA. TTL controls caching.",
        "HTTP is stateless request/response. Methods: GET/HEAD (safe, idempotent), PUT/DELETE (idempotent), POST (neither), PATCH (not necessarily idempotent).",
        "Status classes: 1xx info, 2xx success, 3xx redirect, 4xx client error, 5xx server error. Know 200/201/204/301/302/304/307/400/401/403/404/409/422/429/500/502/503/504.",
        "HTTPS = HTTP over TLS: server authentication (X.509 cert chain to a trusted CA), confidentiality, integrity. TLS 1.3 handshake = 1 RTT (0-RTT for resumption), ECDHE key exchange.",
        "HTTP/1.1 (keep-alive, one request at a time per connection, head-of-line blocking) → HTTP/2 (multiplexed streams, header compression, server push) → HTTP/3 (over QUIC/UDP, no TCP HoL blocking, faster handshake).",
        "Caching: Cache-Control (max-age, no-store, private), ETag / If-None-Match → 304, Last-Modified / If-Modified-Since, CDN edge caching.",
        "Browser security model: same-origin policy, CORS (server opt-in for cross-origin reads), cookies (SameSite, HttpOnly, Secure), CSP.",
      ],
      detail: `
<h2>Type <code>example.com</code> and press Enter</h2>
<ol>
<li>Browser checks HSTS list &amp; its cache; decides http vs https.</li>
<li><b>DNS</b>: browser cache → OS cache → resolver. If uncached, the recursive resolver queries a root server (→ ".com" TLD servers), then the TLD (→ authoritative name servers), then the authoritative server (→ the A/AAAA record). Result cached per TTL.</li>
<li><b>TCP</b> handshake to the resolved IP on port 443 (or the CDN edge nearest you, via anycast/GeoDNS).</li>
<li><b>TLS</b> handshake: ClientHello (supported ciphers, SNI) → ServerHello + certificate chain → client verifies the chain to a trusted root, checks hostname (SAN) &amp; validity &amp; revocation → ECDHE key agreement → symmetric keys established.</li>
<li>Browser sends <code>GET / HTTP/2</code> with Host, Cookie, Accept, User-Agent, Accept-Encoding headers.</li>
<li>Server side: load balancer → API gateway → app server → cache/DB → HTML response (often from a CDN edge cache).</li>
<li>Browser parses HTML → builds the DOM; discovers CSS/JS/images and fetches them (many in parallel, HTTP/2 multiplexed); builds CSSOM; runs blocking JS; computes layout; paints; composites.</li>
</ol>

<h2>Idempotency &amp; safety</h2>
<table>
<tr><th>Method</th><th>Safe (no state change)</th><th>Idempotent (repeat = same effect)</th></tr>
<tr><td>GET, HEAD</td><td>yes</td><td>yes</td></tr>
<tr><td>PUT, DELETE</td><td>no</td><td>yes</td></tr>
<tr><td>POST</td><td>no</td><td>no</td></tr>
<tr><td>PATCH</td><td>no</td><td>not necessarily</td></tr>
</table>
<p>Consequences: crawlers/prefetchers freely issue GETs (never GET a "delete" link); clients can safely retry PUT/DELETE on timeout; POST needs an idempotency key or the Post/Redirect/Get pattern to avoid double submits.</p>

<h2>Status codes worth memorizing</h2>
<ul>
<li><b>301</b> permanent redirect (cached by browsers, passes SEO weight) vs <b>302/307</b> temporary (307 preserves the method).</li>
<li><b>304</b> Not Modified — revalidation succeeded, use your cached copy, no body.</li>
<li><b>401</b> not authenticated vs <b>403</b> authenticated but not authorized.</li>
<li><b>409</b> conflict (e.g. optimistic-lock version mismatch), <b>422</b> unprocessable (validation), <b>429</b> rate limited (send Retry-After).</li>
<li><b>502</b> bad gateway / <b>503</b> unavailable / <b>504</b> gateway timeout — all point at the upstream, not the client.</li>
</ul>

<h2>Caching &amp; revalidation</h2>
<pre><code>GET /app.js                 → 200, Cache-Control: max-age=31536000, immutable, ETag: "v3"
(within max-age)            → served from browser cache, no request
(after max-age)             → GET /app.js  If-None-Match: "v3"  → 304 (no body) or 200 (new body)</code></pre>
<p>Pattern: long max-age + content-hashed filenames (<code>app.4f2a.js</code>) so a deploy changes the URL and busts the cache automatically.</p>

<h2>HTTPS trust chain</h2>
<p>Leaf cert (for <code>example.com</code>) → signed by an intermediate CA → signed by a root CA present in the OS/browser trust store. The browser verifies each signature up the chain, that the hostname matches a SAN entry, that nothing is expired, and revocation status (OCSP stapling / CRL). Certificate Transparency logs make mis-issued certs detectable. HSTS forces https and prevents SSL-strip downgrade.</p>

<h2>Same-origin, CORS, cookies</h2>
<p>Origin = scheme + host + port. The <b>same-origin policy</b> blocks a page from reading responses from another origin by default. <b>CORS</b> is the server saying "these origins may read my responses" via <code>Access-Control-Allow-Origin</code> (+ a preflight <code>OPTIONS</code> for non-simple requests). CORS is <em>not</em> a server-side security control — it only constrains browsers. Cookies: <code>HttpOnly</code> (no JS access, mitigates XSS theft), <code>Secure</code> (https only), <code>SameSite=Lax/Strict</code> (mitigates CSRF).</p>`,
      pitfalls: [
        "Using GET for state-changing actions — prefetch, crawlers, and browser history replay will fire them.",
        "Confusing 401 (auth missing/invalid) with 403 (auth fine, not allowed).",
        "Assuming HTTP/2 removes head-of-line blocking — it removes it at the HTTP layer, but TCP packet loss still stalls all streams; HTTP/3 fixes that.",
        "Thinking CORS protects your API — it only restrains browsers; use real authz.",
        "301 when you might need to change the target later (browsers cache it hard).",
        "Not setting SameSite/HttpOnly/Secure on session cookies.",
      ],
      interviewQs: [
        "Explain everything that happens between typing a URL and seeing the page.",
        "301 vs 302 vs 307; PUT vs PATCH; 401 vs 403.",
        "How does HTTPS establish trust and a shared symmetric key?",
        "How does ETag-based caching work?",
        "What is CORS, and is it a security feature?",
        "HTTP/1.1 vs HTTP/2 vs HTTP/3 — what problem does each solve?",
      ],
    },
  ],
});
