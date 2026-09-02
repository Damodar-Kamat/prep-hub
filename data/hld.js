/* High-Level / System Design. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "hld",
  title: "System Design (HLD)",
  icon: "🏗️",
  blurb: "Scalability building blocks + a framework for the design round, plus worked designs (URL shortener, feed, chat).",
  topics: [
    {
      id: "hld-framework",
      title: "The System Design Interview Framework",
      tags: ["process"],
      brushup: [
        "1) Requirements: functional, non-functional (scale, latency, availability, consistency), and out-of-scope.",
        "2) Estimate: DAU, QPS (read vs write), data size/day, bandwidth, storage over 5 years. Round aggressively.",
        "3) API design: a few key endpoints with request/response.",
        "4) High-level diagram: client → LB → services → data stores → async workers. Name each component's job.",
        "5) Deep-dive: data model, partitioning/sharding key, caching, the hardest 1–2 problems.",
        "6) Bottlenecks & tradeoffs: single points of failure, hot keys, consistency choices, how it degrades.",
        "Drive the conversation; state assumptions; there's no single right answer — justify tradeoffs.",
      ],
      detail: `
<h2>Back-of-envelope cheatsheet</h2>
<ul>
<li>1 day ≈ 86,400 s ≈ 10⁵ s. So 1 M/day ≈ 12 writes/s; 1 B/day ≈ 12 K/s.</li>
<li>Read:write ratio is usually 10:1 to 100:1 for consumer apps — design reads to scale.</li>
<li>Char ≈ 1 byte, UUID ≈ 16 B, typical row 100 B–1 KB, image 100 KB–1 MB.</li>
<li>1 server ≈ a few K simple QPS; SSD random read ~100 µs; same-DC RTT ~0.5 ms; cross-region ~100 ms.</li>
</ul>
<h2>Latency numbers to quote</h2>
<table>
<tr><td>L1 cache</td><td>~1 ns</td></tr><tr><td>Main memory</td><td>~100 ns</td></tr>
<tr><td>SSD random read</td><td>~100 µs</td></tr><tr><td>DC round trip</td><td>~500 µs</td></tr>
<tr><td>HDD seek</td><td>~10 ms</td></tr><tr><td>CA→Netherlands round trip</td><td>~150 ms</td></tr>
</table>
<h2>Non-functional checklist</h2>
<p>Scalability · Availability (99.9% = 8.7 h/yr down; 99.99% = 52 min) · Latency/throughput targets · Consistency model · Durability · Security · Cost · Observability.</p>
<h2>Diagram vocabulary</h2>
<p>Client, DNS, CDN, Load Balancer (L4/L7), API Gateway, Service, Cache (Redis), Primary DB + Replicas, Search index, Object store (S3), Message Queue (Kafka/SQS), Stream processor, Worker/Cron, Data warehouse.</p>`,
      pitfalls: [
        "Jumping to microservices/Kafka before establishing requirements and scale.",
        "Not doing the math — you can't justify sharding without a data-size estimate.",
        "Designing for 1000× the stated scale.",
        "Silence — the interviewer is grading your communication and tradeoff reasoning.",
      ],
      interviewQs: [
        "How would you estimate QPS and storage for this system?",
        "What availability target and why; how do you achieve it?",
        "Where's the single point of failure in your design?",
      ],
    },
    {
      id: "hld-scaling",
      title: "Scaling: Vertical, Horizontal, Statelessness",
      tags: ["scalability"],
      brushup: [
        "Vertical scaling: bigger machine — simple, limited ceiling, single point of failure, expensive at the top.",
        "Horizontal scaling: more machines behind a load balancer — near-linear, needs statelessness + coordination.",
        "Keep app servers stateless: push session/state to Redis or a signed token so any server can handle any request.",
        "Scale reads with replicas + cache; scale writes with sharding/partitioning or a write-optimized store.",
        "Add async: move slow/non-critical work (emails, thumbnails, analytics) to a queue + workers.",
        "Design for failure: health checks, retries with backoff + jitter, circuit breakers, graceful degradation, bulkheads.",
      ],
      detail: `
<h2>The usual scaling path</h2>
<ol>
<li>Single server (app + DB).</li>
<li>Split DB onto its own host; add a cache.</li>
<li>Multiple stateless app servers behind a load balancer.</li>
<li>DB read replicas; route reads to replicas, writes to primary.</li>
<li>CDN for static assets; object store for blobs.</li>
<li>Message queue + workers for async jobs.</li>
<li>Shard the database when a single primary can't take the write volume or dataset.</li>
<li>Split into services along team/domain boundaries when the monolith slows delivery.</li>
</ol>
<h2>Stateless services</h2>
<pre><code>// Bad: session stored in server memory → sticky sessions, lost on restart/scale-in
// Good: session in Redis, or a stateless JWT the client sends each request
GET /api/orders   Authorization: Bearer &lt;jwt&gt;    // any replica can serve it</code></pre>
<h2>Resilience patterns</h2>
<ul>
<li><b>Retry</b> with exponential backoff + jitter (idempotent ops only).</li>
<li><b>Circuit breaker</b>: after N failures, fail fast for a cooldown instead of piling on a dying dependency.</li>
<li><b>Timeouts everywhere</b> — a call without a timeout is a latent outage.</li>
<li><b>Bulkhead</b>: isolate resource pools so one slow dependency can't exhaust all threads.</li>
<li><b>Graceful degradation</b>: serve stale cache / a reduced feature set instead of an error.</li>
</ul>`,
      pitfalls: [
        "Sticky sessions as a scaling strategy — they break auto-scaling and deploys.",
        "Retries without idempotency → duplicate charges/orders.",
        "Retry storms with no jitter → synchronized retry spikes take down the recovering service.",
        "No timeout on downstream calls.",
      ],
      interviewQs: [
        "Vertical vs horizontal scaling tradeoffs.",
        "How do you make a service horizontally scalable?",
        "Explain circuit breakers and where you'd place them.",
      ],
    },
    {
      id: "hld-load-balancing",
      title: "Load Balancing & API Gateway",
      tags: ["networking", "scalability"],
      brushup: [
        "LB spreads traffic, does health checks, enables zero-downtime deploys, terminates TLS.",
        "L4 (transport): routes by IP/port, fast, protocol-agnostic. L7 (application): routes by URL/header/cookie, can do rewrites, auth, rate limiting.",
        "Algorithms: round robin, weighted RR, least connections, least response time, IP/consistent hash (for cache affinity).",
        "Global: DNS-based / GeoDNS / Anycast to route users to the nearest healthy region.",
        "API Gateway: single entry point — auth, rate limiting, routing, request aggregation, protocol translation, observability.",
        "LB itself must be HA: active-passive pair with a floating VIP, or a managed LB (ELB/GCLB).",
      ],
      detail: `
<h2>L4 vs L7</h2>
<table>
<tr><th></th><th>L4</th><th>L7</th></tr>
<tr><td>Sees</td><td>IP, port, TCP</td><td>HTTP method, path, headers, body</td></tr>
<tr><td>Speed</td><td>higher</td><td>lower (parses HTTP)</td></tr>
<tr><td>Features</td><td>NAT, pass-through</td><td>path routing, TLS term, WAF, rate limit, retries</td></tr>
</table>
<h2>Algorithm choice</h2>
<ul>
<li><b>Round robin</b> — uniform backends, uniform requests.</li>
<li><b>Least connections</b> — long-lived / variable-duration requests.</li>
<li><b>Consistent hashing</b> — you want the same key to hit the same backend (local cache, sticky sharding). Adding/removing a node only remaps 1/N of keys.</li>
</ul>
<h2>Health checks</h2>
<p>Active (LB pings <code>/healthz</code>) + passive (eject a backend after consecutive 5xx). Distinguish liveness (is the process up?) from readiness (can it serve traffic right now?).</p>
<h2>Consistent hashing (why it matters)</h2>
<pre><code>// Place nodes and keys on a hash ring; a key belongs to the next node clockwise.
// Virtual nodes (100s per physical node) smooth out the distribution.
// Node failure: only its keys move, to the next node — not a full reshuffle.</code></pre>`,
      pitfalls: [
        "Modulo hashing (<code>hash % N</code>) for sharding — changing N remaps almost everything. Use consistent hashing.",
        "The load balancer as a single point of failure.",
        "L7 features (auth, rate limiting) duplicated in every service instead of at the gateway.",
        "Health check that only checks the port, not the dependencies.",
      ],
      interviewQs: [
        "L4 vs L7 load balancing — when each?",
        "Why consistent hashing over modulo?",
        "What does an API gateway do that a plain LB doesn't?",
      ],
    },
    {
      id: "hld-caching",
      title: "Caching Strategies",
      tags: ["performance", "caching"],
      brushup: [
        "Layers: client → CDN → API/reverse proxy → application (in-process) → distributed cache (Redis) → DB buffer pool.",
        "Patterns: cache-aside (lazy, app manages), read-through, write-through (write cache+DB together), write-back (write cache, flush later — fast, risky), write-around.",
        "Eviction: LRU (common), LFU, TTL, FIFO. Always set a TTL to bound staleness and memory.",
        "Invalidation is the hard part: TTL, explicit delete on write, versioned keys, or event-driven invalidation.",
        "Failure modes: cache stampede/thundering herd, hot keys, cache penetration (missing keys), big-key/hot-shard.",
        "Mitigations: request coalescing / single-flight, jittered TTLs, negative caching, local + distributed tiers, lock-on-miss.",
      ],
      detail: `
<h2>Cache-aside (most common)</h2>
<pre><code>function getUser(id){
  let u = cache.get("user:" + id);
  if (u) return u;                        // hit
  u = db.query("SELECT * FROM users WHERE id = ?", id);   // miss
  cache.set("user:" + id, u, { ttl: 300 });
  return u;
}
// on update: db.update(...); cache.del("user:" + id);</code></pre>
<h2>Write policies</h2>
<table>
<tr><th>Policy</th><th>Write path</th><th>Risk</th></tr>
<tr><td>Write-through</td><td>cache + DB synchronously</td><td>slower writes, always consistent</td></tr>
<tr><td>Write-back</td><td>cache now, DB async</td><td>data loss if cache dies before flush</td></tr>
<tr><td>Write-around</td><td>DB only; cache fills on next read</td><td>first read after write is a miss</td></tr>
</table>
<h2>Cache stampede</h2>
<p>A popular key expires; thousands of requests miss simultaneously and all hit the DB. Fixes:</p>
<ul>
<li><b>Single-flight</b>: only one request recomputes; others wait for its result.</li>
<li><b>Early/probabilistic recomputation</b>: refresh before expiry with some probability.</li>
<li><b>Jittered TTL</b> so keys don't expire in lockstep.</li>
</ul>
<h2>Cache penetration</h2>
<p>Queries for keys that don't exist bypass the cache every time (possibly malicious). Fix: cache the "not found" result briefly, or a Bloom filter of existing keys.</p>`,
      pitfalls: [
        "No TTL → unbounded memory + permanent stale data after a missed invalidation.",
        "Caching per-user data under a shared key (data leak).",
        "Write-back cache for data you can't afford to lose.",
        "Ignoring the stampede until the first viral post takes down the DB.",
      ],
      interviewQs: [
        "Cache-aside vs write-through — tradeoffs.",
        "How do you prevent a cache stampede?",
        "How do you keep the cache consistent with the DB?",
      ],
    },
    {
      id: "hld-db-scaling",
      title: "Database Scaling: Replication, Sharding, Partitioning",
      tags: ["database", "scalability"],
      brushup: [
        "Replication: copy data to replicas. Primary-replica (async = fast, replica lag; sync = consistent, slower). Multi-primary = write conflicts.",
        "Read scaling: route reads to replicas. Beware read-your-writes (route a user's reads to primary briefly after their write, or use sticky/versioned reads).",
        "Partitioning (one DB, many tables/segments) vs Sharding (data split across independent DB instances).",
        "Shard key choice is critical: high cardinality, even distribution, matches query patterns, avoids hotspots. Bad key ⇒ hot shard + cross-shard queries.",
        "Sharding strategies: range, hash, geo, directory/lookup. Rebalancing is painful — use consistent hashing or many virtual shards.",
        "Cross-shard joins/transactions are hard: denormalize, application-side joins, or a distributed transaction (2PC / saga).",
      ],
      detail: `
<h2>Replication topologies</h2>
<pre><code>Primary  ──async──▶  Replica 1 (reads)
         ──async──▶  Replica 2 (reads, analytics)
Failover: promote a replica to primary (automated via Raft/consensus or an orchestrator).</code></pre>
<p>Async replication means a replica can be seconds behind. Sync replication to at least one replica bounds data loss on failover (RPO) at the cost of write latency.</p>
<h2>Sharding example — by user_id hash</h2>
<pre><code>shard = consistentHash(user_id) % NUM_VIRTUAL_SHARDS
// keep a shard-map service: virtual shard -> physical node
// moving a virtual shard = copy + cutover, no key-level rehash</code></pre>
<h2>Choosing a shard key</h2>
<table>
<tr><th>Key</th><th>Problem</th></tr>
<tr><td>Auto-increment ID</td><td>all new writes hit the last shard (hotspot)</td></tr>
<tr><td>Timestamp</td><td>same — today's shard is hot</td></tr>
<tr><td>Low-cardinality (country)</td><td>uneven; can't split further</td></tr>
<tr><td>user_id / entity_id hash</td><td>usually good: even, stable, matches access</td></tr>
</table>
<h2>Cross-shard operations</h2>
<ul>
<li><b>Fan-out read</b>: query all shards, merge (scatter-gather) — bounded by the slowest shard.</li>
<li><b>Saga</b>: a sequence of local transactions + compensating actions for rollback — for cross-service workflows.</li>
<li><b>Denormalize</b>: duplicate the fields you need so the join disappears.</li>
</ul>
<h2>Other tools</h2>
<p>CDC (change data capture) to stream DB changes to search/cache/warehouse; CQRS to separate the write model from read-optimized projections.</p>`,
      pitfalls: [
        "Sharding on a monotonically increasing key → permanent hot shard.",
        "Assuming replicas are current — stale reads surprise users right after they write.",
        "Sharding too early; try replicas + caching + a bigger box first.",
        "Designing a system that needs frequent cross-shard transactions.",
      ],
      interviewQs: [
        "How would you pick a shard key for this system?",
        "How do you handle replica lag / read-your-writes?",
        "How do you do a transaction across two shards?",
      ],
    },
    {
      id: "hld-messaging",
      title: "Message Queues, Streams & Async Processing",
      tags: ["async", "scalability"],
      brushup: [
        "Queues decouple producers from consumers: absorb spikes (buffer), smooth load, retry failures, enable independent scaling.",
        "Queue (SQS/RabbitMQ): a message is consumed by one worker, then deleted. Log/stream (Kafka/Kinesis): ordered, partitioned, retained; many consumer groups replay independently.",
        "Delivery semantics: at-most-once, at-least-once (common — needs idempotent consumers), exactly-once (hard; usually at-least-once + dedup).",
        "Ordering is per-partition/key only. Choose a partition key that preserves the order you need.",
        "Backpressure: bounded queues + consumer autoscaling on lag. Dead-letter queue for poison messages.",
        "Use cases: async jobs, event-driven microservices, fan-out notifications, log/metrics pipelines, stream processing.",
      ],
      detail: `
<h2>Why async</h2>
<pre><code>// Sync: user waits for email + thumbnail + search-index + analytics → slow, fragile
POST /upload → save file → return 202
             └─▶ enqueue {generate-thumbnail, index, notify-followers}
workers process independently; a failure retries without blocking the user</code></pre>
<h2>Queue vs log</h2>
<table>
<tr><th></th><th>Queue (SQS, RabbitMQ)</th><th>Log (Kafka)</th></tr>
<tr><td>Consumption</td><td>competing consumers, message removed</td><td>offset per consumer group, retained</td></tr>
<tr><td>Replay</td><td>no</td><td>yes (rewind offset)</td></tr>
<tr><td>Ordering</td><td>limited</td><td>per partition</td></tr>
<tr><td>Fan-out</td><td>needs one queue per consumer</td><td>native (multiple groups)</td></tr>
</table>
<h2>Idempotent consumer</h2>
<pre><code>function handle(msg){
  if (processed.has(msg.id)) return;      // dedup store (Redis SETNX / DB unique key)
  doWork(msg);
  processed.add(msg.id, { ttl: '7d' });
}</code></pre>
<p>At-least-once delivery means the same message can arrive twice (visibility timeout expiry, consumer crash after work but before ack). Make the effect idempotent — natural keys, upserts, or a dedup table.</p>
<h2>Outbox pattern</h2>
<p>To publish an event <i>and</i> commit a DB change atomically: write the event to an <code>outbox</code> table in the same transaction; a relay polls the outbox and publishes. Avoids the "DB committed but message lost" gap.</p>`,
      pitfalls: [
        "Assuming exactly-once — design consumers to tolerate duplicates.",
        "One giant partition / bad key → no parallelism or lost ordering.",
        "No dead-letter queue → one poison message blocks the partition forever.",
        "Dual-write (DB + queue) without the outbox pattern → inconsistency on partial failure.",
      ],
      interviewQs: [
        "Kafka vs SQS/RabbitMQ — when each?",
        "How do you achieve exactly-once processing?",
        "How do you publish an event and a DB write atomically?",
      ],
    },
    {
      id: "hld-consistency",
      title: "Consistency, CAP & Consensus",
      tags: ["distributed", "theory"],
      brushup: [
        "CAP: during a network partition, choose Consistency (reject writes) or Availability (serve possibly-stale). PACELC adds: else, Latency vs Consistency.",
        "Consistency spectrum: strong (linearizable) → sequential → causal → read-your-writes / monotonic reads → eventual.",
        "Quorum: with N replicas, W + R > N gives overlap ⇒ strong-ish reads. Tune W/R for latency vs consistency.",
        "Consensus (Raft, Paxos): agree on a value/log order despite failures; needs a majority; used for leader election, config, metadata, distributed locks.",
        "Idempotency + versioning (vector clocks, last-write-wins, CRDTs) resolve concurrent updates in AP systems.",
        "Two-phase commit gives atomicity across nodes but blocks on coordinator failure; sagas trade atomicity for availability.",
      ],
      detail: `
<h2>Consistency models, concretely</h2>
<ul>
<li><b>Strong / linearizable</b>: every read sees the latest write; behaves like one copy. Costs latency + availability.</li>
<li><b>Read-your-writes</b>: you see your own updates (route your reads to primary or a session-pinned replica).</li>
<li><b>Monotonic reads</b>: you never see time go backwards.</li>
<li><b>Causal</b>: operations that are causally related are seen in order by everyone.</li>
<li><b>Eventual</b>: replicas converge if writes stop. Fine for like-counts, not for bank balances.</li>
</ul>
<h2>Quorum math</h2>
<pre><code>N = 3 replicas
W = 2, R = 2  → W + R = 4 &gt; 3  → a read quorum always overlaps a write quorum (fresh reads)
W = 1, R = 1  → fast, eventual
W = 3         → strong writes, but any replica down blocks writes</code></pre>
<h2>Raft in one paragraph</h2>
<p>One elected leader accepts all writes, appends them to a replicated log, and commits an entry once a majority has stored it. Followers redirect writes to the leader. On leader failure, followers time out and elect a new leader with the most up-to-date log. A minority partition cannot elect a leader ⇒ it stops accepting writes (chooses C over A).</p>
<h2>Where consensus shows up</h2>
<p>etcd/ZooKeeper/Consul (config, service discovery, locks), Kafka controller & ISR, database leader election, distributed schedulers.</p>`,
      pitfalls: [
        "Claiming 'CAP means pick 2 of 3' — you only choose during a partition; normally it's latency vs consistency.",
        "Last-write-wins silently dropping concurrent updates.",
        "Using a distributed lock (Redis SETNX / ZooKeeper) without fencing tokens → a paused lock holder corrupts data.",
        "Running 2PC across services and being surprised by coordinator-failure stalls.",
      ],
      interviewQs: [
        "Explain CAP with a concrete example for this design.",
        "How does quorum tuning affect consistency and availability?",
        "How does Raft elect a leader and commit entries?",
      ],
    },
    {
      id: "hld-microservices",
      title: "Monolith vs Microservices, Observability",
      tags: ["architecture"],
      brushup: [
        "Start monolith (modular). Split to services when team size, deploy independence, or scaling isolation demands it — not for résumé reasons.",
        "Service boundaries follow business domains (DDD bounded contexts), owned end-to-end by one team, with their own datastore (no shared DB).",
        "Costs: network calls, partial failure, distributed transactions, versioning, harder local dev, need for platform tooling.",
        "Communication: sync (REST/gRPC) for queries, async (events) for decoupling. Prefer choreography; use orchestration for complex workflows.",
        "Observability = logs (structured, correlated) + metrics (RED: Rate, Errors, Duration / USE) + traces (distributed, request-scoped). Plus alerting on SLOs.",
        "Cross-cutting: API gateway, service mesh (mTLS, retries, LB), centralized config, feature flags, CI/CD per service.",
      ],
      detail: `
<h2>When to split</h2>
<table>
<tr><th>Signal</th><th>Reading</th></tr>
<tr><td>One team, &lt;10 devs, early product</td><td>modular monolith</td></tr>
<tr><td>Multiple teams blocked on one deploy pipeline</td><td>split for deploy independence</td></tr>
<tr><td>One component needs 10× the resources of the rest</td><td>extract it for scaling isolation</td></tr>
<tr><td>Different components have very different reliability/latency needs</td><td>split</td></tr>
</table>
<h2>Don't do this</h2>
<p>Distributed monolith: services that must be deployed together, share a database, and chat synchronously in deep call chains. You get every microservice cost and no benefit.</p>
<h2>Observability — the three pillars</h2>
<ul>
<li><b>Logs</b>: structured JSON, include a <code>trace_id</code> so you can stitch a request across services.</li>
<li><b>Metrics</b>: RED (Rate, Errors, Duration) per endpoint; USE (Utilization, Saturation, Errors) per resource. Cheap, aggregate, good for dashboards & alerts.</li>
<li><b>Traces</b>: one span per service hop, parent/child, shows where the latency went.</li>
</ul>
<h2>SLI / SLO / SLA</h2>
<p>SLI = a measured number (p99 latency, success rate). SLO = your internal target (99.9% of requests &lt; 300 ms). SLA = the contractual promise to customers (with penalties). Error budget = 1 − SLO; spend it on shipping features vs reliability work.</p>`,
      pitfalls: [
        "Microservices with a shared database — you can't evolve schemas independently.",
        "Synchronous call chains 5 deep — latency and failure probability multiply.",
        "No distributed tracing → debugging is guesswork.",
        "Splitting by technical layer (a 'controller service', a 'DAO service') instead of by domain.",
      ],
      interviewQs: [
        "When would you NOT use microservices?",
        "How do you trace a slow request across 6 services?",
        "Difference between SLI, SLO, and SLA.",
      ],
    },
    {
      id: "hld-design-url-shortener",
      title: "Worked Design: URL Shortener",
      tags: ["design", "worked-example"],
      brushup: [
        "Functional: shorten(longUrl) → shortCode; GET /{code} → 301 redirect; optional custom alias, expiry, analytics.",
        "Scale math: 100M new URLs/day ≈ 1.2K writes/s, reads ~100× ⇒ ~120K/s. 5 yr ≈ 180B URLs ⇒ need ~7-char base62 (62⁷ ≈ 3.5T).",
        "Code generation: (a) base62 of an auto-increment / distributed counter (Snowflake / ticket server / Redis INCR ranges), or (b) hash(longUrl) + collision check, or (c) pre-generated key pool.",
        "Storage: key-value (code → longUrl, metadata). Heavily read → cache hot codes (Redis), CDN the redirect.",
        "Redirect: 301 (permanent, cached by browser, loses analytics) vs 302 (temporary, every hit reaches you).",
        "Bottlenecks: counter coordination, hot links, abuse/malware scanning, analytics write volume (async pipeline).",
      ],
      detail: `
<h2>API</h2>
<pre><code>POST /api/shorten { "url": "https://…", "alias?": "promo", "ttlDays?": 90 }
   → 201 { "short": "https://sho.rt/aB3xK9" }
GET /aB3xK9  → 302 Location: https://…   (+ fire an async click event)</code></pre>
<h2>Code generation — distributed counter</h2>
<pre><code>// Each app node grabs a range of IDs from a central store, hands them out locally.
range = redis.incrby("url:id:counter", 1000)   // node owns [range-1000, range)
id    = nextLocalId()
code  = base62(id)   // 62 chars: 0-9 a-z A-Z</code></pre>
<p>No per-request coordination; gaps on node restart are harmless. Alternative: Snowflake-style 64-bit ID (timestamp | machineId | seq).</p>
<h2>Data model</h2>
<pre><code>urls:  code (PK) | long_url | created_at | expires_at | owner_id | disabled
// Sharded by hash(code). ~200 bytes/row × 180B rows ≈ 36 TB over 5 years.</code></pre>
<h2>Read path</h2>
<pre><code>GET /{code}
  → CDN edge cache (hit? redirect immediately)
  → Redis cache: code → long_url
  → DB (shard by code), populate cache with TTL
  → 302 + enqueue {code, ts, ip, ua, referer} to Kafka → analytics store</code></pre>
<h2>Extra concerns</h2>
<ul>
<li><b>Custom alias</b>: check uniqueness (conditional insert); reserve a namespace to avoid collisions with generated codes.</li>
<li><b>Abuse</b>: rate-limit creation per account/IP; scan destinations against a malware list; allow takedown (the <code>disabled</code> flag).</li>
<li><b>Analytics</b>: never write to the hot path DB synchronously — stream events, aggregate offline.</li>
<li><b>Expiry</b>: lazy check on read + a background purge job.</li>
</ul>`,
      pitfalls: [
        "Hashing the URL and truncating without collision handling.",
        "Synchronous analytics writes on the redirect path.",
        "301 when you need click analytics (browser caches it and never comes back).",
        "A single global auto-increment as a write bottleneck.",
      ],
      interviewQs: [
        "How do you generate short codes without collisions at scale?",
        "301 vs 302 for the redirect — tradeoffs.",
        "How do you handle custom aliases and abusive links?",
      ],
    },
    {
      id: "hld-design-feed",
      title: "Worked Design: News Feed / Twitter Timeline",
      tags: ["design", "worked-example"],
      brushup: [
        "Two models: fan-out on write (push to each follower's feed cache when you post) vs fan-out on read (pull + merge followees' posts at read time).",
        "Push: fast reads, expensive for celebrities (millions of writes per post), wastes space for inactive users.",
        "Pull: cheap writes, expensive reads (merge many timelines), bad tail latency.",
        "Hybrid (real systems): push for normal users; for celebrities, don't fan out — merge their recent posts at read time.",
        "Feed store: per-user list of postIds in Redis (capped, e.g. latest 800); hydrate post content from a post service + cache.",
        "Ranking: chronological is simplest; ML ranking needs feature stores + a scoring service; keep the retrieval/ranking split clean.",
      ],
      detail: `
<h2>Components</h2>
<pre><code>Post Service (write)  → Post DB (sharded by postId) + object store for media
Fan-out Service       → consumes "new post" events, writes to Feed Cache
Feed Cache (Redis)    → user_id → [postId, postId, …] (capped list / sorted set by time)
Timeline Service (read) → read feed list → hydrate posts (Post Cache) → rank → return
Graph Service         → followers/following (who to fan out to)</code></pre>
<h2>Write path (fan-out on write)</h2>
<pre><code>POST /tweet → save to Post DB → publish {postId, authorId, ts}
Fan-out worker:
  followers = graph.followers(authorId)
  if len(followers) &gt; CELEBRITY_THRESHOLD: skip (handled at read time)
  else: for f in followers: redis.lpush("feed:"+f, postId); redis.ltrim("feed:"+f, 0, 799)</code></pre>
<h2>Read path (hybrid)</h2>
<pre><code>GET /feed
  base   = redis.lrange("feed:"+me, 0, 50)          // pushed posts
  celebs = graph.following(me).filter(isCelebrity)
  extra  = for c in celebs: recentPosts(c, since=lastSeen)   // pulled
  merged = mergeByTime(base, extra)
  posts  = postCache.multiGet(merged)               // hydrate
  return rank(posts)</code></pre>
<h2>Scale notes</h2>
<ul>
<li>Fan-out is async and idempotent (dedup on postId per feed).</li>
<li>Inactive users: skip fan-out, rebuild their feed on next login (pull).</li>
<li>Feed list capped ⇒ bounded memory; older history via the pull path / profile view.</li>
<li>Media on a CDN; post text small enough to cache aggressively.</li>
</ul>
<h2>Follow/unfollow</h2>
<p>Don't rewrite feeds on unfollow — filter at read time, or let capped lists age out.</p>`,
      pitfalls: [
        "Pure fan-out-on-write with no celebrity carve-out → a 50M-follower post triggers 50M writes.",
        "Pure fan-out-on-read → p99 read latency explodes for users following thousands.",
        "Storing full post content in every follower's feed (huge duplication) instead of postIds.",
        "Synchronous fan-out in the POST request.",
      ],
      interviewQs: [
        "Fan-out on write vs read — and what do real systems do?",
        "How do you handle a celebrity with 100M followers?",
        "How do you keep feed storage bounded?",
      ],
    },
  ],
});
