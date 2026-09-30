/* Java & JVM — language, collections, concurrency, JVM internals, Spring. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "java",
  title: "Java & JVM",
  icon: "☕",
  blurb: "Core Java, collections internals, generics & streams, concurrency and the memory model, modern Java (records → virtual threads), JVM memory & GC, class loading & JIT, Spring Boot and production troubleshooting.",
  topics: [
    {
      id: "java-core",
      title: "Core Java: Types, Strings, equals/hashCode, Immutability",
      summary: "The language fundamentals behind half of all Java interview questions — value vs reference semantics, String internals, object contracts and immutable design.",
      tags: ["java", "must-know"],
      brushup: [
        "Java is <b>pass-by-value</b>; for objects the value passed is the reference (you can mutate the object, not rebind the caller's variable).",
        "8 primitives vs wrapper classes; <b>autoboxing</b> pitfalls: <code>Integer</code> cache −128..127 makes <code>==</code> accidentally work for small values.",
        "<b>String</b> is immutable, interned literals live in the string pool; use <b>StringBuilder</b> in loops; Java 9+ compact strings (Latin-1 byte[]).",
        "<b>equals/hashCode contract</b>: equal objects must have equal hash codes; override both, use the same fields; keep fields used in them immutable for map keys.",
        "<b>Immutable class</b>: final class, private final fields, no setters, defensive copies of mutable inputs/outputs → thread-safe and cache-friendly (records help).",
        "<b>final</b> (variable/method/class), <b>static</b> (class-level), <b>abstract class vs interface</b> (default/static/private methods since Java 8/9; interfaces have no state).",
        "Access modifiers: private &lt; package-private &lt; protected &lt; public.",
        "Checked vs unchecked exceptions; <b>try-with-resources</b> for AutoCloseable.",
      ],
      detail: `
<h2>Pass-by-value demonstration</h2>
<pre><code>void reassign(StringBuilder sb) { sb = new StringBuilder("new"); }   // caller unaffected
void mutate(StringBuilder sb)   { sb.append("!"); }                  // caller sees "!"
</code></pre>

<h2>equals and hashCode</h2>
<pre><code>public final class Point {
    private final int x, y;
    public Point(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point p)) return false;       // pattern matching (Java 16+)
        return x == p.x &amp;&amp; y == p.y;
    }
    @Override public int hashCode() { return Objects.hash(x, y); }
}
// or simply: public record Point(int x, int y) {}   → equals/hashCode/toString generated</code></pre>
<p>If you override equals but not hashCode, two equal points land in different HashMap buckets → <code>map.get(new Point(1,2))</code> returns null.</p>

<h2>String facts</h2>
<ul>
<li><code>"a" == "a"</code> is true (same pooled literal); <code>new String("a") == "a"</code> is false; always compare with <code>equals</code>.</li>
<li>Immutability benefits: safe sharing across threads, cached hashCode (great map keys), security (class names, URLs, passwords can't be altered after checks).</li>
<li><code>s1 + s2</code> in a loop creates many objects (javac uses StringBuilder/invokedynamic per expression, not across iterations).</li>
<li>Store passwords in <code>char[]</code> so they can be wiped (strings linger in memory).</li>
</ul>

<h2>Immutable class checklist</h2>
<pre><code>public final class Money {
    private final BigDecimal amount;
    private final List&lt;String&gt; tags;
    public Money(BigDecimal amount, List&lt;String&gt; tags) {
        this.amount = amount;
        this.tags = List.copyOf(tags);                 // defensive, unmodifiable copy
    }
    public List&lt;String&gt; tags() { return tags; }       // already unmodifiable
    public Money plus(Money o) { return new Money(amount.add(o.amount), tags); }  // returns new instance
}</code></pre>

<h2>Abstract class vs interface</h2>
<table>
<tr><th></th><th>Abstract class</th><th>Interface</th></tr>
<tr><td>State (fields)</td><td>Yes</td><td>Only constants</td></tr>
<tr><td>Constructors</td><td>Yes</td><td>No</td></tr>
<tr><td>Multiple inheritance</td><td>No (one superclass)</td><td>Yes (many interfaces)</td></tr>
<tr><td>Use for</td><td>Shared base implementation for close relatives</td><td>Capabilities/contracts (Comparable, Runnable)</td></tr>
</table>`,
      pitfalls: [
        "Comparing Integer or String objects with ==.",
        "Mutable objects as HashMap keys whose fields change after insertion.",
        "BigDecimal created from double (new BigDecimal(0.1)) — use BigDecimal.valueOf or string constructor.",
        "Catching Exception/Throwable broadly and swallowing it.",
      ],
      interviewQs: [
        "Is Java pass-by-value or pass-by-reference?",
        "Why is String immutable?",
        "What happens if you override equals but not hashCode?",
        "How do you make a class immutable?",
        "Abstract class vs interface in modern Java?",
        "What's the difference between final, finally and finalize?",
      ],
      resources: [
        { t: "Effective Java (3rd ed.) — Joshua Bloch", u: "https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/", k: "book", n: "the most important Java book for interviews" },
        { t: "Dev.java — official Java learning", u: "https://dev.java/learn/", k: "course" },
        { t: "Baeldung — Java guides", u: "https://www.baeldung.com/java-tutorial", k: "article" },
      ],
    },
    {
      id: "java-collections",
      title: "Collections Internals: HashMap, ConcurrentHashMap, TreeMap, Lists",
      summary: "How the core collections work under the hood and how to pick the right one — the #1 source of Java interview deep-dive questions.",
      tags: ["java", "collections", "must-know"],
      brushup: [
        "<b>HashMap</b>: array of buckets; index = (n−1) &amp; (h ^ h&gt;&gt;&gt;16); collisions chain in linked lists, <b>treeified</b> into red-black trees when a bucket has ≥ 8 entries (and table ≥ 64); resize ×2 at load factor 0.75.",
        "HashMap allows one null key; not thread-safe (concurrent resize could corrupt; lost updates).",
        "<b>ConcurrentHashMap</b> (Java 8+): CAS on empty bins, synchronized on the bin head for updates, lock-free reads; no null keys/values; atomic compute/merge/putIfAbsent.",
        "<b>LinkedHashMap</b> keeps insertion (or access) order → LRU cache via removeEldestEntry. <b>TreeMap</b>: red-black tree, O(log n), sorted, floor/ceiling/range views.",
        "<b>ArrayList</b>: dynamic array, O(1) random access, amortized O(1) append (grows 1.5×). <b>LinkedList</b>: rarely better; poor cache locality. Use <b>ArrayDeque</b> for stacks/queues.",
        "<b>PriorityQueue</b> = binary heap. <b>Set</b> implementations are backed by maps.",
        "Fail-fast iterators throw ConcurrentModificationException; concurrent collections have weakly consistent iterators.",
        "Immutable factories: List.of, Map.of, Set.of (no nulls); Collections.unmodifiableX is only a view.",
      ],
      detail: `
<h2>HashMap put() walkthrough</h2>
<pre><code>put(k, v):
  h = k.hashCode(); h ^= (h &gt;&gt;&gt; 16)            // spread high bits into low bits
  i = (table.length - 1) &amp; h                     // table length is a power of two
  bin empty?  → new Node
  else walk bin: key equals? → replace value
                else append; if bin size ≥ 8 (TREEIFY_THRESHOLD) and table ≥ 64 → red-black tree
  if ++size &gt; capacity * 0.75 → resize(): double table, split each bin into lo/hi lists (no rehash of hashCode)</code></pre>
<p>Worst case lookup: O(log n) per bin thanks to treeification (was O(n) before Java 8) — protects against hash-flooding.</p>

<h2>ConcurrentHashMap</h2>
<ul>
<li>Java 7: segments (16 locks). Java 8+: per-bin locking — CAS to insert into an empty bin, <code>synchronized(binHead)</code> otherwise; <b>reads take no locks</b> (volatile node fields).</li>
<li>Resizing is cooperative: threads help transfer bins.</li>
<li>size() is an estimate under concurrency (LongAdder-style counter cells).</li>
<li>Use atomic operations: <code>map.merge(word, 1, Integer::sum)</code> or <code>computeIfAbsent(k, x -&gt; new ConcurrentLinkedQueue&lt;&gt;())</code> — never check-then-put.</li>
</ul>

<h2>Choosing a collection</h2>
<table>
<tr><th>Need</th><th>Use</th></tr>
<tr><td>Key → value, fast</td><td>HashMap</td></tr>
<tr><td>Sorted keys, range queries</td><td>TreeMap / ConcurrentSkipListMap</td></tr>
<tr><td>Insertion order / LRU</td><td>LinkedHashMap (accessOrder = true)</td></tr>
<tr><td>Thread-safe map</td><td>ConcurrentHashMap</td></tr>
<tr><td>Stack / queue / deque</td><td>ArrayDeque</td></tr>
<tr><td>Top-K, scheduling</td><td>PriorityQueue</td></tr>
<tr><td>Read-mostly list shared by threads</td><td>CopyOnWriteArrayList</td></tr>
<tr><td>Producer-consumer</td><td>ArrayBlockingQueue / LinkedBlockingQueue</td></tr>
<tr><td>Enum keys</td><td>EnumMap / EnumSet (array/bit-vector backed)</td></tr>
</table>

<h2>LRU cache in 6 lines</h2>
<pre><code>class LRU&lt;K, V&gt; extends LinkedHashMap&lt;K, V&gt; {
    private final int cap;
    LRU(int cap) { super(16, 0.75f, true); this.cap = cap; }        // accessOrder = true
    @Override protected boolean removeEldestEntry(Map.Entry&lt;K, V&gt; e) { return size() &gt; cap; }
}</code></pre>

<h2>Complexities</h2>
<table>
<tr><th></th><th>get/contains</th><th>add</th><th>remove</th></tr>
<tr><td>ArrayList</td><td>O(1) index / O(n) contains</td><td>O(1)*</td><td>O(n)</td></tr>
<tr><td>LinkedList</td><td>O(n)</td><td>O(1) ends</td><td>O(1) with iterator</td></tr>
<tr><td>HashMap/HashSet</td><td>O(1) avg</td><td>O(1) avg</td><td>O(1) avg</td></tr>
<tr><td>TreeMap/TreeSet</td><td>O(log n)</td><td>O(log n)</td><td>O(log n)</td></tr>
<tr><td>PriorityQueue</td><td>peek O(1)</td><td>O(log n)</td><td>poll O(log n), remove(obj) O(n)</td></tr>
</table>`,
      pitfalls: [
        "Modifying a list while iterating with for-each (ConcurrentModificationException) — use Iterator.remove or removeIf.",
        "Collections.synchronizedMap + compound check-then-act is still racy.",
        "LinkedList for random access.",
        "Arrays.asList is fixed-size; List.of rejects nulls.",
      ],
      interviewQs: [
        "How does HashMap work internally? What changed in Java 8?",
        "Why is HashMap capacity a power of two?",
        "How does ConcurrentHashMap achieve thread safety without locking the whole map?",
        "HashMap vs Hashtable vs ConcurrentHashMap vs synchronizedMap?",
        "Implement an LRU cache in Java.",
        "ArrayList vs LinkedList — when would you use LinkedList?",
      ],
      resources: [
        { t: "OpenJDK HashMap source", u: "https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/HashMap.java", k: "repo" },
        { t: "Java Collections tutorial (dev.java)", u: "https://dev.java/learn/api/collections-framework/", k: "docs" },
      ],
    },
    {
      id: "java-generics-streams",
      title: "Generics, Lambdas, Functional Interfaces & Streams",
      summary: "Type-safe generics (and erasure), lambdas and method references, and the Stream API — including when streams are the wrong tool.",
      tags: ["java", "streams", "generics"],
      brushup: [
        "Generics are checked at compile time and <b>erased</b> at runtime (List&lt;String&gt; and List&lt;Integer&gt; are the same class) → no <code>new T()</code>, no generic arrays.",
        "<b>PECS</b>: Producer Extends, Consumer Super — <code>List&lt;? extends Number&gt;</code> to read, <code>List&lt;? super Integer&gt;</code> to write.",
        "Functional interfaces: Function, BiFunction, Supplier, Consumer, Predicate, UnaryOperator; lambdas capture <b>effectively final</b> variables.",
        "Streams: source → lazy intermediate ops (map, filter, flatMap, sorted, distinct) → terminal op (collect, reduce, forEach, count).",
        "Collectors: toList, toMap (merge function for duplicates!), groupingBy, partitioningBy, joining, counting, summingInt.",
        "Optional is for return types — not fields or parameters; avoid get() without check.",
        "Parallel streams use the common ForkJoinPool — only for CPU-bound, large, stateless work.",
        "Streams are single-use; don't mutate external state inside them.",
      ],
      detail: `
<h2>Stream examples</h2>
<pre><code>// word frequency, top 3
Map&lt;String, Long&gt; freq = words.stream()
    .map(String::toLowerCase)
    .collect(Collectors.groupingBy(w -&gt; w, Collectors.counting()));
List&lt;String&gt; top3 = freq.entrySet().stream()
    .sorted(Map.Entry.&lt;String, Long&gt;comparingByValue().reversed())
    .limit(3).map(Map.Entry::getKey).toList();

// employees by department → average salary
Map&lt;String, Double&gt; avg = emps.stream()
    .collect(Collectors.groupingBy(Employee::dept, Collectors.averagingDouble(Employee::salary)));

// flatten
List&lt;String&gt; allTags = posts.stream().flatMap(p -&gt; p.tags().stream()).distinct().toList();

// toMap with duplicate keys → must supply merge function
Map&lt;String, Employee&gt; byEmail = emps.stream()
    .collect(Collectors.toMap(Employee::email, e -&gt; e, (a, b) -&gt; a));</code></pre>

<h2>Laziness</h2>
<pre><code>Stream.of(1, 2, 3, 4)
  .filter(x -&gt; { System.out.println("filter " + x); return x % 2 == 0; })
  .map(x -&gt; { System.out.println("map " + x); return x * 10; })
  .findFirst();
// prints: filter 1, filter 2, map 2  → stops early (short-circuit)</code></pre>

<h2>Generics and wildcards</h2>
<pre><code>static double sum(Collection&lt;? extends Number&gt; nums) {      // producer → extends
    return nums.stream().mapToDouble(Number::doubleValue).sum();
}
static void fill(List&lt;? super Integer&gt; out) { out.add(42); }  // consumer → super
static &lt;T extends Comparable&lt;? super T&gt;&gt; T max(List&lt;T&gt; xs) { ... }   // bounded type parameter</code></pre>
<p>Erasure means overloads like <code>f(List&lt;String&gt;)</code> and <code>f(List&lt;Integer&gt;)</code> clash; type tokens (<code>Class&lt;T&gt;</code>) pass type info at runtime.</p>

<h2>When not to use streams</h2>
<ul>
<li>Complex control flow with early exits/checked exceptions — loops are clearer.</li>
<li>Hot paths where boxing matters — use IntStream/primitive loops.</li>
<li>Parallel streams on I/O or small collections, or inside a server handling many requests (shared common pool).</li>
</ul>`,
      pitfalls: [
        "Collectors.toMap throwing IllegalStateException on duplicate keys.",
        "Using parallelStream for blocking I/O.",
        "Optional.get() without isPresent; Optional as a field.",
        "Side effects in map/filter (modifying external lists).",
      ],
      interviewQs: [
        "What is type erasure and what are its consequences?",
        "Explain PECS with an example.",
        "Intermediate vs terminal operations; what does lazy mean?",
        "map vs flatMap?",
        "When would you avoid parallel streams?",
        "Group employees by department and find the highest paid in each.",
      ],
      resources: [
        { t: "Java Stream API guide (dev.java)", u: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/package-summary.html", k: "docs" },
        { t: "Java Generics FAQ — Angelika Langer", u: "http://www.angelikalanger.com/GenericsFAQ/JavaGenericsFAQ.html", k: "article" },
      ],
    },
    {
      id: "java-concurrency",
      title: "Java Concurrency: Threads, Executors, Locks, JMM, CompletableFuture",
      summary: "Writing correct concurrent Java — the memory model and happens-before, synchronization tools, executors, atomics and async composition.",
      tags: ["java", "concurrency", "must-know"],
      brushup: [
        "<b>Java Memory Model</b>: without a happens-before relationship, one thread may never see another's writes (or see them reordered).",
        "Happens-before via: <b>synchronized</b> unlock→lock, <b>volatile</b> write→read, Thread.start/join, final fields after construction, concurrent collections, Future.get.",
        "<b>volatile</b> = visibility + ordering, <b>not atomicity</b> (count++ is still racy). Use AtomicInteger/LongAdder or locks.",
        "<b>synchronized</b>: intrinsic reentrant lock + visibility; <b>ReentrantLock</b> adds tryLock, timeouts, fairness, multiple Conditions; <b>ReadWriteLock</b>/<b>StampedLock</b> for read-heavy data.",
        "Always use <b>ExecutorService</b> (ThreadPoolExecutor: core, max, queue, rejection policy) instead of raw threads; shut it down.",
        "<b>CompletableFuture</b>: thenApply/thenCompose/thenCombine/allOf/exceptionally; pass your own executor for blocking work.",
        "Coordination: CountDownLatch, CyclicBarrier, Semaphore, Phaser, BlockingQueue (producer-consumer).",
        "Deadlock prevention: lock ordering, tryLock with timeout, minimize lock scope; detect with thread dumps.",
      ],
      detail: `
<h2>Visibility bug</h2>
<pre><code>class Worker implements Runnable {
    private boolean running = true;          // BUG: not volatile → loop may never see false
    public void run() { while (running) { /* work */ } }
    public void stop() { running = false; }
}
// fix: private volatile boolean running = true;</code></pre>

<h2>Double-checked locking (correct version)</h2>
<pre><code>class Config {
    private static volatile Config instance;      // volatile prevents seeing a half-constructed object
    static Config get() {
        Config c = instance;
        if (c == null) {
            synchronized (Config.class) {
                c = instance;
                if (c == null) instance = c = new Config();
            }
        }
        return c;
    }
}
// simpler: holder idiom or enum singleton</code></pre>

<h2>ThreadPoolExecutor</h2>
<pre><code>ExecutorService pool = new ThreadPoolExecutor(
    8, 32,                                   // core, max threads
    60, TimeUnit.SECONDS,                    // idle keep-alive for extra threads
    new ArrayBlockingQueue&lt;&gt;(1000),         // BOUNDED queue
    Thread.ofPlatform().name("orders-", 0).factory(),   // named threads (Java 21)
    new ThreadPoolExecutor.CallerRunsPolicy()); // backpressure when saturated</code></pre>
<p>Tasks go: core threads → queue → extra threads up to max → rejection. With an unbounded queue, max is never reached (Executors.newFixedThreadPool uses an unbounded LinkedBlockingQueue — memory risk).</p>
<p>Sizing: CPU-bound ≈ cores; I/O-bound ≈ cores × (1 + wait/compute) — or use virtual threads.</p>

<h2>CompletableFuture composition</h2>
<pre><code>CompletableFuture&lt;User&gt; user = supplyAsync(() -&gt; userApi.get(id), ioPool);
CompletableFuture&lt;List&lt;Order&gt;&gt; orders = supplyAsync(() -&gt; orderApi.list(id), ioPool);
CompletableFuture&lt;Profile&gt; profile = user.thenCombine(orders, Profile::new)
    .orTimeout(800, TimeUnit.MILLISECONDS)
    .exceptionally(ex -&gt; Profile.fallback(id));</code></pre>

<h2>Producer–consumer</h2>
<pre><code>BlockingQueue&lt;Job&gt; q = new ArrayBlockingQueue&lt;&gt;(100);
// producer: q.put(job)      → blocks when full (backpressure)
// consumer: Job j = q.take() → blocks when empty</code></pre>

<h2>Atomics</h2>
<ul>
<li>AtomicInteger/AtomicReference use CAS (compare-and-swap) loops; beware ABA (AtomicStampedReference).</li>
<li><b>LongAdder</b> spreads contention across cells — faster counters under heavy writes.</li>
<li>ConcurrentHashMap.compute/merge for atomic per-key updates.</li>
</ul>`,
      pitfalls: [
        "count++ on a volatile field.",
        "Executors.newCachedThreadPool under load → unbounded threads; newFixedThreadPool → unbounded queue.",
        "Blocking calls inside CompletableFuture default (common) pool.",
        "Calling wait() outside a loop (spurious wakeups) or without holding the monitor.",
        "Holding a lock while calling out to unknown code (alien method) → deadlocks.",
      ],
      interviewQs: [
        "What does volatile guarantee? Is it enough for a counter?",
        "Explain happens-before.",
        "synchronized vs ReentrantLock?",
        "How does ThreadPoolExecutor decide to queue vs create a thread vs reject?",
        "How would you run three API calls in parallel and combine the results with a timeout?",
        "How do you detect and prevent deadlocks?",
      ],
      resources: [
        { t: "Java Concurrency in Practice — Goetz et al.", u: "https://jcip.net/", k: "book" },
        { t: "JSR-133 (Java Memory Model) FAQ", u: "https://www.cs.umd.edu/~pugh/java/memoryModel/jsr-133-faq.html", k: "article" },
        { t: "Jenkov — Java concurrency tutorial", u: "https://jenkov.com/tutorials/java-concurrency/index.html", k: "article" },
      ],
    },
    {
      id: "java-modern",
      title: "Modern Java (11–21+): Records, Sealed Types, Pattern Matching, Virtual Threads",
      summary: "The features that change how Java is written today — and virtual threads, which change how Java servers scale.",
      tags: ["java", "java21", "virtual-threads"],
      brushup: [
        "<b>var</b> (10), HTTP Client (11), switch expressions (14), text blocks (15), <b>records</b> (16), pattern matching for instanceof (16), <b>sealed classes</b> (17), <b>pattern matching for switch</b> + record patterns (21), <b>virtual threads</b> (21), sequenced collections (21).",
        "Records = transparent, immutable data carriers with generated constructor/accessors/equals/hashCode/toString; compact constructors for validation.",
        "Sealed interfaces + records + switch patterns = algebraic data types with <b>exhaustiveness checking</b>.",
        "<b>Virtual threads</b>: cheap JVM-managed threads mounted on carrier threads; blocking I/O unmounts them → thread-per-request scales to millions.",
        "Use virtual threads for I/O-bound concurrency; don't pool them; limit concurrency with semaphores; avoid long synchronized blocks around blocking I/O (pinning, largely fixed in Java 24).",
        "Structured concurrency (preview) and scoped values (preview/final in later releases) complement virtual threads.",
        "LTS versions: 8, 11, 17, 21, 25.",
      ],
      detail: `
<h2>Records and validation</h2>
<pre><code>public record Money(BigDecimal amount, String currency) {
    public Money {                                   // compact constructor
        Objects.requireNonNull(currency);
        if (amount.signum() &lt; 0) throw new IllegalArgumentException("negative");
    }
    public Money plus(Money o) { return new Money(amount.add(o.amount), currency); }
}</code></pre>

<h2>Sealed hierarchies + pattern matching</h2>
<pre><code>sealed interface Shape permits Circle, Rect, Square {}
record Circle(double r) implements Shape {}
record Rect(double w, double h) implements Shape {}
record Square(double s) implements Shape {}

static double area(Shape s) {
    return switch (s) {                               // compiler checks all cases are covered
        case Circle c        -&gt; Math.PI * c.r() * c.r();
        case Rect(var w, var h) -&gt; w * h;             // record pattern
        case Square sq when sq.s() &gt; 0 -&gt; sq.s() * sq.s();
        case Square sq       -&gt; 0;
    };
}</code></pre>

<h2>Virtual threads</h2>
<pre><code>try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    List&lt;Future&lt;String&gt;&gt; fs = urls.stream().map(u -&gt; exec.submit(() -&gt; http.get(u))).toList();
    for (var f : fs) System.out.println(f.get());
}   // 10,000 concurrent blocking calls, simple sequential code
// Spring Boot 3.2+: spring.threads.virtual.enabled=true</code></pre>
<table>
<tr><th></th><th>Platform thread</th><th>Virtual thread</th></tr>
<tr><td>Backed by</td><td>OS thread (1:1)</td><td>JVM, M:N on carrier threads</td></tr>
<tr><td>Memory</td><td>~1 MB stack reserved</td><td>Few KB, grows on heap</td></tr>
<tr><td>Count</td><td>Thousands</td><td>Millions</td></tr>
<tr><td>Best for</td><td>CPU-bound work</td><td>Blocking I/O-bound work</td></tr>
</table>
<p>Virtual threads don't make CPU work faster; they make waiting cheap. Downstream limits (DB connection pools) still apply — protect them with a Semaphore.</p>

<h2>Other useful additions</h2>
<ul>
<li>Text blocks for SQL/JSON; <code>String.formatted()</code>, <code>strip()</code>, <code>isBlank()</code>, <code>lines()</code>.</li>
<li>Helpful NullPointerExceptions (name the null variable).</li>
<li><code>Stream.toList()</code>, <code>Collectors.teeing</code>, <code>SequencedCollection.getFirst()/reversed()</code>.</li>
<li>ZGC/Generational ZGC for sub-millisecond pauses.</li>
</ul>`,
      pitfalls: [
        "Pooling virtual threads (defeats the purpose).",
        "Using virtual threads for CPU-bound parallel work.",
        "Unlimited virtual threads hammering a DB with a 20-connection pool.",
        "ThreadLocal-heavy frameworks with millions of virtual threads (memory).",
      ],
      interviewQs: [
        "What are records and when would you not use one?",
        "What problem do sealed classes solve?",
        "How do virtual threads work and when should you use them?",
        "What is thread pinning?",
        "Which Java version are you on and what features do you use daily?",
      ],
      resources: [
        { t: "JEP 444: Virtual Threads", u: "https://openjdk.org/jeps/444", k: "docs" },
        { t: "JEP 441: Pattern Matching for switch", u: "https://openjdk.org/jeps/441", k: "docs" },
        { t: "Inside Java — news & deep dives", u: "https://inside.java/", k: "blog" },
      ],
    },
    {
      id: "jvm-memory-gc",
      title: "JVM Memory Model & Garbage Collection",
      summary: "How the JVM lays out memory, how generational garbage collectors work, and how to choose and tune G1, ZGC and friends.",
      tags: ["jvm", "gc", "must-know"],
      brushup: [
        "Runtime areas: <b>heap</b> (objects, shared), <b>stack</b> per thread (frames, locals), <b>metaspace</b> (class metadata, native), code cache, direct buffers.",
        "Generational hypothesis: most objects die young → <b>young gen</b> (Eden + 2 survivor spaces, copying minor GC) and <b>old gen</b> (promoted long-lived objects).",
        "GC roots: thread stacks, static fields, JNI refs; reachability from roots = live.",
        "Collectors: <b>Serial</b>, <b>Parallel</b> (throughput), <b>G1</b> (default: region-based, pause-time goal), <b>ZGC</b> / <b>Shenandoah</b> (concurrent, sub-ms pauses, large heaps).",
        "Stop-the-world pauses vs concurrent phases; allocation rate and live set size drive GC cost.",
        "Memory leaks in Java = unintentionally reachable objects (static maps, caches without eviction, listeners, ThreadLocals).",
        "Key flags: -Xms/-Xmx, -XX:+UseG1GC / -XX:+UseZGC, -XX:MaxGCPauseMillis, -XX:+HeapDumpOnOutOfMemoryError, GC logging -Xlog:gc*.",
        "In containers, size the heap relative to the memory limit (-XX:MaxRAMPercentage=75).",
      ],
      detail: `
<h2>Heap layout (generational)</h2>
<pre><code>Young generation                          Old generation
[ Eden | S0 | S1 ]  ── objects surviving N minor GCs (tenuring threshold) ──►  [ long-lived objects ]
new objects allocated in Eden (thread-local allocation buffers, bump pointer)</code></pre>

<h2>G1 in brief</h2>
<ul>
<li>Heap split into equal <b>regions</b> (1–32 MB); each region is Eden, Survivor, Old or Humongous (objects ≥ half a region).</li>
<li>Young collections evacuate live objects from Eden/Survivor regions.</li>
<li>Concurrent marking finds garbage-dense old regions; <b>mixed collections</b> evacuate the best ones ("garbage first") within the pause goal (<code>MaxGCPauseMillis</code>, default 200 ms).</li>
<li>Full GC = failure mode (evacuation failure, humongous allocation pressure).</li>
</ul>

<h2>Choosing a collector</h2>
<table>
<tr><th>Collector</th><th>Pauses</th><th>Best for</th></tr>
<tr><td>Parallel</td><td>Longer STW</td><td>Batch jobs, max throughput</td></tr>
<tr><td>G1</td><td>~10–200 ms target</td><td>General-purpose services (default)</td></tr>
<tr><td>ZGC (generational)</td><td>&lt; 1 ms, independent of heap size</td><td>Latency-sensitive, large heaps (TBs)</td></tr>
<tr><td>Shenandoah</td><td>Low, concurrent compaction</td><td>Latency-sensitive (OpenJDK/Red Hat)</td></tr>
</table>

<h2>Reference types</h2>
<ul>
<li><b>Strong</b> — normal; <b>Soft</b> — cleared under memory pressure (caches, but prefer explicit caches); <b>Weak</b> — cleared at next GC (WeakHashMap, canonicalizing maps); <b>Phantom</b> — post-mortem cleanup (Cleaner).</li>
</ul>

<h2>Common OutOfMemoryErrors</h2>
<table>
<tr><th>Message</th><th>Likely cause</th></tr>
<tr><td>Java heap space</td><td>Leak or heap too small for live set</td></tr>
<tr><td>GC overhead limit exceeded</td><td>Spending &gt;98% time in GC recovering &lt;2%</td></tr>
<tr><td>Metaspace</td><td>Classloader leak (redeploys, dynamic proxies)</td></tr>
<tr><td>Direct buffer memory</td><td>NIO/Netty buffers not released</td></tr>
<tr><td>unable to create native thread</td><td>Too many threads / ulimit</td></tr>
</table>`,
      pitfalls: [
        "Setting -Xmx equal to the container memory limit (no room for metaspace, threads, direct memory) → OOM-killed.",
        "Calling System.gc() in code.",
        "Static collections used as caches without size limits.",
        "Tuning GC flags before measuring allocation rate and live set.",
      ],
      interviewQs: [
        "Describe the JVM memory areas.",
        "How does generational garbage collection work?",
        "G1 vs ZGC — how would you choose?",
        "How can a garbage-collected language leak memory?",
        "How do you size the JVM heap in Kubernetes?",
      ],
      resources: [
        { t: "Oracle — HotSpot GC tuning guide", u: "https://docs.oracle.com/en/java/javase/21/gctuning/", k: "docs" },
        { t: "JEP 439: Generational ZGC", u: "https://openjdk.org/jeps/439", k: "docs" },
        { t: "GCeasy — GC log analyzer", u: "https://gceasy.io/", k: "tool" },
      ],
    },
    {
      id: "jvm-classloading-jit",
      title: "Class Loading, Bytecode & JIT Compilation",
      summary: "How .java becomes running machine code — class loaders, bytecode, interpretation and tiered JIT compilation with its optimizations.",
      tags: ["jvm", "jit"],
      brushup: [
        "javac → <b>bytecode</b> (.class) → JVM loads, links (verify, prepare, resolve), initializes classes lazily.",
        "Class loaders: <b>bootstrap</b> → <b>platform</b> → <b>application</b>; <b>parent delegation</b> asks the parent first (prevents spoofing java.lang.String).",
        "Custom class loaders power app servers, plugins, hot reload; classloader leaks → metaspace OOM.",
        "Execution: interpreter first, then <b>tiered JIT</b>: C1 (fast compile, profiling) → C2/Graal (aggressive optimization) for hot methods.",
        "JIT optimizations: inlining, escape analysis (scalar replacement → no heap allocation), loop unrolling, lock elision, devirtualization, intrinsics.",
        "<b>Deoptimization</b> when assumptions break (new subclass loaded).",
        "Warm-up matters: benchmarks need JMH; startup options: CDS/AppCDS, GraalVM native image, CRaC.",
      ],
      detail: `
<h2>Loading pipeline</h2>
<pre><code>Loading (find bytes, define Class) → Linking: Verification → Preparation (static fields default values) → Resolution (symbolic → direct refs)
→ Initialization (static initializers run, on first active use)</code></pre>

<h2>Parent delegation</h2>
<pre><code>AppClassLoader.loadClass("com.x.Foo")
  → ask PlatformClassLoader → ask Bootstrap → not found
  → PlatformClassLoader tries → not found
  → AppClassLoader finds it on the classpath</code></pre>
<p>Same class loaded by two loaders = two distinct classes (ClassCastException "X cannot be cast to X").</p>

<h2>Tiered compilation</h2>
<table>
<tr><th>Tier</th><th>What</th></tr>
<tr><td>0</td><td>Interpreter</td></tr>
<tr><td>1–3</td><td>C1 compiled, with increasing profiling</td></tr>
<tr><td>4</td><td>C2 fully optimized using the profile</td></tr>
</table>
<p>Escape analysis example: a small object created inside a hot method that never escapes is broken into registers — zero allocation.</p>

<h2>Benchmarking correctly</h2>
<pre><code>@Benchmark
public int sum(MyState s) { return s.list.stream().mapToInt(i -&gt; i).sum(); }
// JMH handles warm-up, forks, dead-code elimination (Blackhole) — naive System.nanoTime loops lie.</code></pre>

<h2>Startup options</h2>
<ul><li><b>CDS/AppCDS</b>: share pre-parsed class data → faster startup.</li>
<li><b>GraalVM native-image</b>: AOT compile to a native binary (ms startup, lower memory; reflection needs config).</li>
<li><b>CRaC</b>: checkpoint a warmed JVM and restore it.</li></ul>`,
      pitfalls: [
        "Micro-benchmarks without warm-up/JMH.",
        "Classloader leaks from ThreadLocals or static references across redeploys.",
        "Heavy static initializers that fail → NoClassDefFoundError later.",
      ],
      interviewQs: [
        "Explain the class loading process and parent delegation.",
        "ClassNotFoundException vs NoClassDefFoundError?",
        "How does the JIT compiler optimize code?",
        "What is escape analysis?",
        "How would you improve JVM startup time for serverless?",
      ],
      resources: [
        { t: "JVM Specification — Loading, Linking, Initializing", u: "https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html", k: "docs" },
        { t: "JMH — Java Microbenchmark Harness", u: "https://github.com/openjdk/jmh", k: "repo" },
      ],
    },
    {
      id: "spring-boot",
      title: "Spring & Spring Boot: DI, Beans, AOP, Transactions, JPA",
      summary: "How Spring's container wires applications, how proxies implement transactions and AOP, and the JPA/Hibernate behaviours that bite in production.",
      tags: ["spring", "jpa", "must-know"],
      brushup: [
        "<b>IoC/DI</b>: the container creates beans and injects dependencies; prefer <b>constructor injection</b> (immutable, testable, explicit).",
        "Bean scopes: singleton (default), prototype, request, session; singletons must be thread-safe (stateless).",
        "Lifecycle: instantiate → populate → Aware callbacks → BeanPostProcessors (before) → @PostConstruct/afterPropertiesSet → BPP (after, <b>proxies created here</b>) → … → @PreDestroy.",
        "Spring Boot: <b>auto-configuration</b> via @Conditional* classes, starters, externalized config (profiles, application.yml, env vars), Actuator for health/metrics.",
        "<b>@Transactional</b> works through proxies: <b>self-invocation</b> bypasses it; private/final methods aren't proxied; rollback by default only on unchecked exceptions.",
        "Propagation: REQUIRED (default), REQUIRES_NEW, NESTED, SUPPORTS…; isolation per transaction.",
        "JPA: persistence context (first-level cache, dirty checking), lazy loading, <b>N+1</b>, LazyInitializationException, open-session-in-view (disable it).",
        "Spring WebFlux = reactive, non-blocking; Spring MVC + virtual threads is often the simpler choice now.",
      ],
      detail: `
<h2>Constructor injection</h2>
<pre><code>@Service
public class OrderService {
    private final OrderRepository repo;
    private final PaymentClient payments;
    public OrderService(OrderRepository repo, PaymentClient payments) {   // no @Autowired needed
        this.repo = repo; this.payments = payments;
    }
}</code></pre>

<h2>The @Transactional self-invocation trap</h2>
<pre><code>@Service
public class ReportService {
    public void generateAll() {
        for (var id : ids) generateOne(id);     // calls this.generateOne → NOT through the proxy → no transaction!
    }
    @Transactional
    public void generateOne(long id) { ... }
}
// fixes: move generateOne to another bean, inject self (lazy), or use TransactionTemplate</code></pre>
<p>Also: <code>@Transactional</code> on a checked exception won't roll back unless <code>rollbackFor = Exception.class</code>; long transactions holding connections while calling remote APIs are a classic outage cause.</p>

<h2>How AOP proxies work</h2>
<ul>
<li>JDK dynamic proxies (interfaces) or CGLIB subclasses (classes; Boot's default).</li>
<li>The proxy wraps calls with advice: transactions, caching (@Cacheable), security (@PreAuthorize), retries, metrics.</li>
<li>Only external calls through the proxy are intercepted.</li>
</ul>

<h2>JPA/Hibernate essentials</h2>
<table>
<tr><th>Concept</th><th>What to know</th></tr>
<tr><td>Entity states</td><td>transient, managed, detached, removed</td></tr>
<tr><td>Dirty checking</td><td>Managed entities are flushed automatically at commit — no save() needed</td></tr>
<tr><td>Fetching</td><td>@ManyToOne is EAGER by default → make it LAZY; use fetch joins / entity graphs per use case</td></tr>
<tr><td>N+1</td><td>Detect with SQL logging/statistics; fix with join fetch or batch size</td></tr>
<tr><td>IDs</td><td>SEQUENCE with allocationSize for batch inserts; IDENTITY disables JDBC batching</td></tr>
<tr><td>Bulk ops</td><td>JPQL update/delete bypasses the persistence context</td></tr>
</table>

<h2>Production-ready Boot</h2>
<ul>
<li>Actuator: /health (liveness/readiness groups for Kubernetes), /metrics via Micrometer → Prometheus, /info.</li>
<li>Config via environment; secrets from a vault, never in the repo.</li>
<li>Graceful shutdown (<code>server.shutdown=graceful</code>), timeouts on RestClient/WebClient, Resilience4j.</li>
<li>Testing: @SpringBootTest sparingly; slice tests (@WebMvcTest, @DataJpaTest); Testcontainers for real DBs.</li>
</ul>`,
      pitfalls: [
        "Field injection (@Autowired on fields) — hides dependencies and hurts testing.",
        "@Transactional on private methods or self-invoked methods.",
        "Stateful singleton beans shared across requests.",
        "open-in-view=true hiding lazy loading in the view layer.",
        "Eager fetching everything to 'fix' LazyInitializationException.",
      ],
      interviewQs: [
        "How does dependency injection work in Spring?",
        "Explain the bean lifecycle.",
        "Why does @Transactional not work on self-invoked methods?",
        "What is transaction propagation? When would you use REQUIRES_NEW?",
        "How does Spring Boot auto-configuration work?",
        "How do you solve N+1 in JPA?",
      ],
      resources: [
        { t: "Spring Framework reference — Core (IoC)", u: "https://docs.spring.io/spring-framework/reference/core.html", k: "docs" },
        { t: "Spring Boot reference", u: "https://docs.spring.io/spring-boot/index.html", k: "docs" },
        { t: "Vlad Mihalcea — High-Performance Java Persistence", u: "https://vladmihalcea.com/tutorials/hibernate/", k: "blog" },
      ],
    },
    {
      id: "java-troubleshooting",
      title: "Java Performance Troubleshooting: Profiling, Thread & Heap Dumps",
      summary: "The toolkit and procedure for diagnosing slow, stuck or memory-hungry Java services in production.",
      tags: ["java", "performance", "debugging"],
      brushup: [
        "Start with metrics: latency percentiles, throughput, error rate, CPU, GC time, heap after GC, thread counts, pool saturation.",
        "<b>High CPU</b>: find hot threads (top -H) → match to thread dump (nid hex) → async-profiler / JFR flame graph.",
        "<b>Hung/slow</b>: take 3 thread dumps a few seconds apart (jstack/jcmd Thread.print) → BLOCKED threads, lock owners, deadlocks, all threads waiting on one pool.",
        "<b>Memory</b>: heap after full GC trending up = leak → heap dump (jcmd GC.heap_dump) → Eclipse MAT dominator tree / leak suspects.",
        "<b>JFR (Java Flight Recorder)</b>: low-overhead always-on profiling; analyze in JDK Mission Control.",
        "<b>async-profiler</b>: CPU, allocation, lock and wall-clock flame graphs without safepoint bias.",
        "GC logs (-Xlog:gc*) → pause times, allocation rate, promotion; analyze with GCeasy.",
        "Tools: jcmd (Swiss army knife), jstat, jmap, jstack, VisualVM.",
      ],
      detail: `
<h2>Commands you should know</h2>
<pre><code>jcmd                                  # list JVMs
jcmd &lt;pid&gt; Thread.print &gt; t1.txt       # thread dump
jcmd &lt;pid&gt; GC.heap_info
jcmd &lt;pid&gt; GC.heap_dump /tmp/heap.hprof
jcmd &lt;pid&gt; JFR.start duration=60s filename=/tmp/rec.jfr
jstat -gcutil &lt;pid&gt; 1000              # GC utilization every second
./asprof -d 30 -e cpu -f /tmp/cpu.html &lt;pid&gt;   # async-profiler flame graph</code></pre>

<h2>Reading a thread dump</h2>
<pre><code>"http-nio-8080-exec-17" #53 daemon prio=5 nid=0x6b03 waiting for monitor entry
   java.lang.Thread.State: BLOCKED (on object monitor)
    at com.acme.Cache.get(Cache.java:42)
    - waiting to lock &lt;0x0000000712a3c2f0&gt; (a com.acme.Cache)
"http-nio-8080-exec-3" ... RUNNABLE
    at java.net.SocketInputStream.read(...)          ← holding the Cache lock while doing I/O!
    - locked &lt;0x0000000712a3c2f0&gt; (a com.acme.Cache)</code></pre>
<p>Patterns: many threads BLOCKED on the same monitor (contention), all request threads WAITING in <code>HikariPool.getConnection</code> (pool exhaustion), "Found one Java-level deadlock" section.</p>

<h2>High CPU procedure</h2>
<ol>
<li><code>top -H -p &lt;pid&gt;</code> → hottest thread id (decimal) → convert to hex.</li>
<li>Find <code>nid=0x…</code> in the thread dump → the stack shows what it's doing.</li>
<li>If it's GC threads → memory problem, not code. Otherwise profile with async-profiler.</li>
</ol>

<h2>Memory leak procedure</h2>
<ol>
<li>Confirm: old gen after full GC keeps rising over hours/days.</li>
<li>Heap dump (ideally two, hours apart) → MAT → <b>dominator tree</b>: which object retains the most memory? → path to GC roots.</li>
<li>Typical culprits: unbounded caches/maps, listeners never removed, ThreadLocals in pools, large collections in sessions.</li>
</ol>`,
      pitfalls: [
        "Taking a single thread dump and drawing conclusions.",
        "Heap dumps on a huge heap in production without disk space/time planning (pauses the JVM).",
        "Profiling with safepoint-biased sampling tools and misreading hot spots.",
      ],
      interviewQs: [
        "Your Java service has 100% CPU — walk me through debugging it.",
        "Requests are hanging but CPU is idle — what do you check?",
        "How do you find a memory leak in a Java application?",
        "What is JFR?",
        "How do you read a flame graph?",
      ],
      resources: [
        { t: "async-profiler", u: "https://github.com/async-profiler/async-profiler", k: "tool" },
        { t: "Eclipse Memory Analyzer (MAT)", u: "https://eclipse.dev/mat/", k: "tool" },
        { t: "JDK Mission Control", u: "https://www.oracle.com/java/technologies/jdk-mission-control.html", k: "tool" },
        { t: "Brendan Gregg — Flame graphs", u: "https://www.brendangregg.com/flamegraphs.html", k: "article" },
      ],
    },
    {
      id: "java-exceptions-io",
      title: "Exceptions, I/O, NIO & Networking in Java",
      summary: "Exception design, the classic and NIO I/O models, non-blocking servers (Netty) and Java's HTTP client.",
      tags: ["java", "io", "nio"],
      brushup: [
        "Hierarchy: Throwable → Error (don't catch) / Exception → checked vs RuntimeException (unchecked).",
        "Throw specific exceptions, preserve the cause, don't use exceptions for control flow, translate at layer boundaries.",
        "<b>try-with-resources</b> closes in reverse order; suppressed exceptions are attached.",
        "Blocking I/O (java.io): one thread per connection. <b>NIO</b>: channels, buffers, <b>selectors</b> → one thread multiplexes many connections.",
        "Netty: event loops over NIO/epoll, pipelines of handlers, pooled ByteBufs — basis of gRPC-java, Kafka clients' peers, Spring WebFlux (Reactor Netty).",
        "java.net.http.HttpClient (11+): HTTP/2, async with CompletableFuture; always set timeouts.",
        "Files: java.nio.file.Files/Path; memory-mapped files for huge files; zero-copy transferTo.",
      ],
      detail: `
<h2>Exception best practices</h2>
<pre><code>try (var in = Files.newInputStream(path); var out = Files.newOutputStream(target)) {
    in.transferTo(out);
} catch (NoSuchFileException e) {
    throw new ImportFailedException("missing input " + path, e);   // keep the cause
}</code></pre>
<ul>
<li>Checked for recoverable conditions the caller must handle; unchecked for programming errors — modern codebases lean unchecked.</li>
<li>Log once, at the boundary that handles it — not at every layer (duplicate stack traces).</li>
</ul>

<h2>Blocking vs non-blocking I/O</h2>
<table>
<tr><th>Model</th><th>Threads</th><th>Complexity</th></tr>
<tr><td>Blocking (thread per connection)</td><td>One per connection</td><td>Simple</td></tr>
<tr><td>NIO selector / event loop</td><td>Few event loop threads</td><td>Callbacks, never block the loop</td></tr>
<tr><td>Virtual threads + blocking API</td><td>Millions of cheap threads</td><td>Simple again</td></tr>
</table>

<h2>HttpClient with timeouts</h2>
<pre><code>HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(2)).version(HttpClient.Version.HTTP_2).build();
HttpRequest req = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(3)).GET().build();
HttpResponse&lt;String&gt; res = client.send(req, HttpResponse.BodyHandlers.ofString());</code></pre>`,
      pitfalls: [
        "Catching and ignoring InterruptedException (restore the interrupt flag).",
        "Blocking calls on a Netty/Reactor event loop thread.",
        "Forgetting timeouts on HTTP clients.",
        "Reading whole large files into memory.",
      ],
      interviewQs: [
        "Checked vs unchecked exceptions — when to use each?",
        "How does try-with-resources work?",
        "Explain Java NIO selectors.",
        "How does Netty achieve high throughput?",
        "How do you handle InterruptedException properly?",
      ],
      resources: [
        { t: "Netty user guide", u: "https://netty.io/wiki/user-guide-for-4.x.html", k: "docs" },
        { t: "Java NIO tutorial (Jenkov)", u: "https://jenkov.com/tutorials/java-nio/index.html", k: "article" },
      ],
    },
  ],
});
