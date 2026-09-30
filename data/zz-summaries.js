/* Loaded LAST. Adds a one-line summary + curated resources to every topic that lacks them,
   and assigns each section to a dashboard group. Keep entries short; long content lives in the topic files. */
(function () {
  const S = window.STUDY_SECTIONS || [];

  const GROUPS = {
    dsa: "Core CS & Algorithms", cs: "Core CS & Algorithms", hw: "Core CS & Algorithms",
    lld: "System & Software Design", hld: "System & Software Design", "hld-cases": "System & Software Design",
    java: "Languages & Runtimes", python: "Languages & Runtimes", web: "Languages & Runtimes",
    databases: "Data, Distributed & Infrastructure", distributed: "Data, Distributed & Infrastructure",
    "data-eng": "Data, Distributed & Infrastructure", cloud: "Data, Distributed & Infrastructure", security: "Data, Distributed & Infrastructure",
    ml: "AI & Machine Learning",
    career: "Career & Behavioral",
    resources: "Resource Hub",
  };
  const ORDER = {};
  Object.keys(GROUPS).forEach((k, i) => { if (!(GROUPS[k] in ORDER)) ORDER[GROUPS[k]] = i; });
  const ord = (g) => (g in ORDER ? ORDER[g] : 99);

  const R = (t, u, k, n) => ({ t, u, k, n });
  const NEET = R("NeetCode roadmap & video solutions", "https://neetcode.io/roadmap", "practice");
  const TIH = R("Tech Interview Handbook", "https://www.techinterviewhandbook.org/", "article");
  const CPA = R("CP-Algorithms (reference implementations)", "https://cp-algorithms.com/", "docs");
  const SDP = R("System Design Primer (GitHub)", "https://github.com/donnemartin/system-design-primer", "repo");
  const DDIA = R("Designing Data-Intensive Applications — Martin Kleppmann", "https://dataintensive.net/", "book", "the single best book for backend/distributed interviews");
  const OSTEP = R("Operating Systems: Three Easy Pieces (free book)", "https://pages.cs.wisc.edu/~remzi/OSTEP/", "book");
  const REFACT = R("Refactoring.Guru — design patterns explained", "https://refactoring.guru/design-patterns", "article");
  const HELLO = R("Hello Interview — system design guides", "https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction", "article");
  const BBG = R("ByteByteGo blog (Alex Xu)", "https://blog.bytebytego.com/", "blog");

  const SUM = {
    // DSA
    "dsa-bigo": ["How to reason about an algorithm's time and memory growth — the language every coding interview is scored in.", [R("Big-O Cheat Sheet", "https://www.bigocheatsheet.com/", "article"), TIH]],
    "dsa-arrays": ["Contiguous memory, index arithmetic and string manipulation — the base layer for most interview problems.", [NEET, R("Tech Interview Handbook — Array", "https://www.techinterviewhandbook.org/algorithms/array/", "article")]],
    "dsa-hashing": ["Hash maps and sets give O(1) average lookup; the go-to tool for 'have I seen this before?' problems.", [NEET, R("Tech Interview Handbook — Hash table", "https://www.techinterviewhandbook.org/algorithms/hash-table/", "article")]],
    "dsa-twopointers": ["Move two indices through a sequence (or grow/shrink a window) to turn O(n²) scans into O(n).", [NEET, R("Sliding window patterns (LeetCode discuss)", "https://leetcode.com/problem-list/sliding-window/", "practice")]],
    "dsa-stackqueue": ["LIFO and FIFO containers, monotonic stacks and deques — for parsing, 'next greater element' and BFS.", [NEET, R("Monotonic stack problem list", "https://leetcode.com/problem-list/monotonic-stack/", "practice")]],
    "dsa-linkedlist": ["Pointer-based sequences: reversal, fast/slow pointers, dummy heads and in-place re-linking.", [NEET, R("Visualgo — linked list animations", "https://visualgo.net/en/list", "tool")]],
    "dsa-recursion": ["Solve a problem by solving smaller copies of it; backtracking explores and undoes choices.", [NEET, R("Backtracking problem list", "https://leetcode.com/problem-list/backtracking/", "practice")]],
    "dsa-trees": ["Hierarchical structures, traversals and the BST ordering invariant — the most-asked data structure after arrays.", [NEET, R("Visualgo — BST / AVL", "https://visualgo.net/en/bst", "tool")]],
    "dsa-heaps": ["A priority queue returns the min/max in O(log n) — the tool for top-K, merging and scheduling problems.", [NEET, R("Visualgo — binary heap", "https://visualgo.net/en/heap", "tool")]],
    "dsa-graphs": ["Nodes and edges: BFS/DFS, topological sort, shortest paths and spanning trees.", [NEET, CPA, R("Visualgo — graph traversal", "https://visualgo.net/en/dfsbfs", "tool")]],
    "dsa-dp": ["Break a problem into overlapping subproblems and cache their answers; the most feared (and most learnable) topic.", [NEET, R("DP patterns (LeetCode discuss classic)", "https://leetcode.com/discuss/study-guide/458695/Dynamic-Programming-Patterns", "article"), R("MIT 6.006 DP lectures", "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/", "course")]],
    "dsa-sorting": ["Comparison sorts, their trade-offs, and binary search — including binary search on the answer.", [NEET, R("Visualgo — sorting", "https://visualgo.net/en/sorting", "tool")]],
    "dsa-advanced": ["Tries, Union-Find, Fenwick/segment trees and bit tricks — the specialist tools for 'hard' problems.", [CPA, NEET]],
    // CS
    "cs-oop": ["Encapsulation, abstraction, inheritance and polymorphism — how object-oriented code models the world.", [REFACT]],
    "cs-solid": ["Five design principles that keep object-oriented code easy to change.", [REFACT, R("Uncle Bob — The Principles of OOD", "http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod", "article")]],
    "cs-patterns": ["Reusable GoF solutions (Strategy, Factory, Observer, Decorator…) and when each earns its keep.", [REFACT, R("Head First Design Patterns (book)", "https://www.oreilly.com/library/view/head-first-design/9781492077992/", "book")]],
    "cs-os-process-thread": ["Processes isolate memory; threads share it. Context switches, states and what the kernel does.", [OSTEP]],
    "cs-os-scheduling": ["How the OS decides which runnable task gets the CPU next, and the fairness/latency trade-offs.", [OSTEP]],
    "cs-os-memory": ["Virtual memory, paging, TLBs and page faults — how every process gets its own address space.", [OSTEP]],
    "cs-os-deadlock": ["Locks, semaphores, the four deadlock conditions and how to prevent or detect deadlock.", [OSTEP, R("The Little Book of Semaphores (free)", "https://greenteapress.com/wp/semaphores/", "book")]],
    "cs-dbms-normalization": ["Keys and normal forms remove redundancy and update anomalies; denormalise deliberately for reads.", [R("Use The Index, Luke", "https://use-the-index-luke.com/", "article")]],
    "cs-dbms-index-txn": ["B-tree indexes, ACID transactions and isolation levels — the database questions every backend interview asks.", [R("Use The Index, Luke", "https://use-the-index-luke.com/", "article"), DDIA]],
    "cs-sql-nosql": ["Relational vs document/key-value/wide-column/graph stores, and CAP/PACELC trade-offs.", [DDIA, SDP]],
    "cs-net-model": ["The layered network model, and how TCP (reliable, ordered) differs from UDP (fast, fire-and-forget).", [R("High Performance Browser Networking (free book)", "https://hpbn.co/", "book")]],
    "cs-net-http-dns": ["HTTP versions, TLS, DNS resolution and the classic 'what happens when you type a URL'.", [R("What happens when… (GitHub)", "https://github.com/alex/what-happens-when", "repo"), R("High Performance Browser Networking", "https://hpbn.co/", "book")]],
    // HW
    "hw-cpu": ["Instruction pipelines, branch prediction and superscalar execution — why some code runs 10× faster.", [R("Computer Systems: A Programmer's Perspective", "https://csapp.cs.cmu.edu/", "book")]],
    "hw-memory-hierarchy": ["Registers → caches → RAM → disk: latency gaps of 1000× and why locality dominates performance.", [R("Latency numbers every programmer should know", "https://gist.github.com/jboner/2841832", "article"), R("What every programmer should know about memory", "https://people.freebsd.org/~lstewart/articles/cpumemory.pdf", "paper")]],
    "hw-numbers": ["Two's complement, overflow, IEEE-754 floating point and why 0.1 + 0.2 ≠ 0.3.", [R("What Every Computer Scientist Should Know About Floating-Point", "https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html", "paper")]],
    "hw-storage": ["HDD vs SSD internals, RAID levels, and what fsync/durability really cost.", [R("Coding for SSDs", "https://codecapsule.com/2014/02/12/coding-for-ssds-part-1-introduction-and-table-of-contents/", "article")]],
    "hw-io": ["Interrupts, DMA, system calls and the user/kernel boundary.", [OSTEP]],
    // LLD
    "lld-method": ["A repeatable 45-minute approach: requirements → entities → relationships → patterns → code → extensions.", [R("awesome-low-level-design (GitHub)", "https://github.com/ashishps1/awesome-low-level-design", "repo"), REFACT]],
    "lld-parking-lot": ["Classic OOD: spots, vehicles, tickets and fees, with strategy-based allocation and thread safety.", [R("awesome-low-level-design", "https://github.com/ashishps1/awesome-low-level-design", "repo")]],
    "lld-lru": ["O(1) get/put via hash map + doubly linked list; LFU adds frequency buckets.", [R("LeetCode 146 — LRU Cache", "https://leetcode.com/problems/lru-cache/", "practice"), R("LeetCode 460 — LFU Cache", "https://leetcode.com/problems/lfu-cache/", "practice")]],
    "lld-rate-limiter": ["Token bucket, leaky bucket and window algorithms, implemented as clean, thread-safe classes.", [R("Stripe — scaling your API with rate limiters", "https://stripe.com/blog/rate-limiters", "blog")]],
    "lld-splitwise": ["Users, groups, expenses and split strategies, plus debt simplification.", [R("awesome-low-level-design", "https://github.com/ashishps1/awesome-low-level-design", "repo")]],
    "lld-elevator": ["State machines and scheduling (SCAN/LOOK) for one or many elevators.", [R("awesome-low-level-design", "https://github.com/ashishps1/awesome-low-level-design", "repo")]],
    "lld-vending-machine": ["The canonical State-pattern problem: idle, has-money, dispensing, out-of-stock.", [REFACT]],
    "lld-concurrency-patterns": ["Locks, conditions, producer-consumer, thread pools and immutability inside OOD answers.", [R("Java Concurrency in Practice (book)", "https://jcip.net/", "book")]],
    // HLD
    "hld-framework": ["The 6-step structure for a 45-minute design round: requirements, estimates, API, diagram, deep dive, trade-offs.", [HELLO, SDP, BBG]],
    "hld-scaling": ["Vertical vs horizontal scaling, statelessness and designing for failure.", [SDP, HELLO]],
    "hld-load-balancing": ["L4 vs L7 load balancers, algorithms, health checks, API gateways and service discovery.", [SDP, R("NGINX — What is load balancing?", "https://www.nginx.com/resources/glossary/load-balancing/", "article")]],
    "hld-caching": ["Cache-aside, write-through/back, eviction, invalidation, stampedes and CDNs.", [SDP, R("AWS — Caching best practices", "https://aws.amazon.com/caching/best-practices/", "docs")]],
    "hld-db-scaling": ["Read replicas, partitioning strategies and sharding — and what breaks when you shard.", [DDIA, SDP]],
    "hld-messaging": ["Queues vs logs, pub/sub, delivery guarantees and asynchronous processing patterns.", [DDIA, R("Kafka documentation — design", "https://kafka.apache.org/documentation/#design", "docs")]],
    "hld-consistency": ["Consistency models, CAP/PACELC and how consensus (Raft/Paxos) keeps replicas agreeing.", [DDIA, R("Raft visualisation", "https://thesecretlivesofdata.com/raft/", "tool")]],
    "hld-microservices": ["When to split a monolith, how services talk, and the observability/SLO toolkit that keeps them alive.", [R("Martin Fowler — Microservices", "https://martinfowler.com/articles/microservices.html", "article"), R("Google SRE book (free)", "https://sre.google/sre-book/table-of-contents/", "book")]],
    "hld-design-url-shortener": ["The warm-up design: key generation, redirects, caching and analytics at scale.", [SDP, HELLO]],
    "hld-design-feed": ["Fan-out on write vs read, the celebrity problem, ranking and timeline caches.", [SDP, HELLO]],
    "hld-design-chat": ["Persistent connections, message ordering, delivery receipts, presence and offline sync.", [HELLO, R("Discord — how Discord stores trillions of messages", "https://discord.com/blog/how-discord-stores-trillions-of-messages", "blog")]],
    // Career
    "career-star": ["Structure every behavioral answer as Situation → Task → Action → Result, and prepare 6–8 reusable stories.", [TIH, R("Amazon — interview tips (STAR)", "https://www.amazon.jobs/content/en/how-we-hire/interviewing-at-amazon", "article")]],
    "career-questions": ["The behavioral questions senior and lead engineers get, and what each is really testing.", [TIH]],
    "career-negotiation": ["Evaluating total compensation and negotiating an offer without burning goodwill.", [R("Levels.fyi — compensation data", "https://www.levels.fyi/", "tool"), R("Haseeb Qureshi — Ten rules for negotiating a job offer", "https://haseebq.com/my-ten-rules-for-negotiating-a-job-offer/", "article")]],
    "career-plan": ["A week-by-week plan to go from rusty to interview-ready in about three months.", [TIH, NEET]],
  };

  for (const s of S) {
    if (!s.group) s.group = GROUPS[s.id] || "More";
    for (const t of s.topics || []) {
      const e = SUM[t.id];
      if (!e) continue;
      if (!t.summary) t.summary = e[0];
      if (!t.resources && e[1]) t.resources = e[1];
    }
  }
  // stable order: by group (in GROUPS order), then original order
  const idx = new Map(S.map((s, i) => [s, i]));
  S.sort((a, b) => (ord(a.group) - ord(b.group)) || (idx.get(a) - idx.get(b)));
})();
