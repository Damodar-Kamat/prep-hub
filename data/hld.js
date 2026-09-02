/* High-Level / System Design (deep-dive edition). */
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
        "1) Requirements: functional, non-functional (scale, latency, availability, consistency, durability), and explicitly out-of-scope.",
        "2) Estimate: DAU, QPS (read vs write, average vs peak), payload sizes, storage/day and over 5 years, bandwidth. Round hard.",
        "3) API: a handful of endpoints with request/response shapes.",
        "4) High-level diagram: client → DNS/CDN → LB → services → caches → data stores → async workers/queues. Name each box's job.",
        "5) Data model + the deep dive: schema, the partition/shard key, the caching strategy, the 1–2 hardest problems.",
        "6) Bottlenecks & trade-offs: single points of failure, hot keys/partitions, consistency choices, failure modes, how it degrades.",
        "Drive the conversation, state assumptions out loud, and justify every trade-off — there is no single right answer.",
      ],
      detail: `
<h2>Back-of-envelope numbers you should know cold</h2>
<ul>
<li>1 day ≈ 86,400 s ≈ 10⁵ s. So 1 M events/day ≈ 12/s; 1 B/day ≈ 12 K/s; 100 M/day ≈ 1.2 K/s.</li>
<li>Read:write ratio for consumer apps is typically 10:1 to 1000:1 — design the read path to scale independently.</li>
<li>Average vs peak: peak is often 2–10× average; size for peak (or autoscale + a buffer queue).</li>
<li>1 char ≈ 1 byte; UUID ≈ 16 B; a typical row 0.1–1 KB; a tweet ≈ 300 B; a photo 0.5–5 MB; a minute of video ≈ 10–50 MB.</li>
<li>One commodity server: a few K simple QPS; ~64–256 GB RAM; ~10–40 Gbps NIC.</li>
<li>Postgres on one box: comfortably 10⁴+ TPS, terabytes of data.</li>
</ul>

<h2>Latency numbers to quote</h2>
<table>
<tr><td>L1 cache</td><td>~1 ns</td></tr><tr><td>Main memory</td><td>~100 ns</td></tr>
<tr><td>SSD random read</td><td>~16–100 µs</td></tr><tr><td>Datacenter round trip</td><td>~0.5 ms</td></tr>
<tr><td>HDD seek</td><td>~5–10 ms</td></tr><tr><td>US ↔ Europe round trip</td><td>~80–150 ms</td></tr>
</table>

<h2>Availability math</h2>
<table>
<tr><th>"Nines"</th><th>Downtime / year</th><th>Downtime / day</th></tr>
<tr><td>99% (two nines)</td><td>3.65 days</td><td>~14 min</td></tr>
<tr><td>99.9%</td><td>8.77 hours</td><td>~1.4 min</td></tr>
<tr><td>99.99%</td><td>52 min</td><td>~8.6 s</td></tr>
<tr><td>99.999%</td><td>5.3 min</td><td>~0.86 s</td></tr>
</table>
<p>Components in series multiply: two 99.9% services in a request path ⇒ ~99.8%. Redundancy (parallel paths, N+1) claws it back.</p>

<h2>Worked estimate — a Twitter-like feed</h2>
<pre><code>300 M DAU, each opens the app 10×/day        → 3 B feed reads/day  → ~35 K reads/s avg, ~150 K peak
each posts 2×/day                            → 600 M writes/day    → ~7 K writes/s avg
avg 200 followers ⇒ fan-out on write         → 600M × 200 = 1.2e11 feed-cache writes/day → ~1.4 M/s (⇒ need a celebrity carve-out)
tweet storage: 300 B × 600 M/day             → ~180 GB/day → ~65 TB/year (text only; media on object store + CDN)</code></pre>

<h2>Diagram vocabulary</h2>
<p>Client · DNS · CDN · L4/L7 Load Balancer · API Gateway · Service (stateless) · Cache (Redis) · Primary DB + Read Replicas · Sharded DB · Search index (Elasticsearch) · Object store (S3) · Message queue (Kafka/SQS) · Stream processor (Flink) · Worker / Cron · Data warehouse · CDC pipeline.</p>

<h2>Common non-functional checklist</h2>
<p>Scalability (reads &amp; writes separately) · Availability target &amp; how · Latency/throughput SLOs · Consistency model per data type · Durability (RPO/RTO) · Security &amp; privacy · Cost · Observability · Multi-region &amp; disaster recovery.</p>`,
      pitfalls: [
        "Jumping to microservices / Kafka / sharding before establishing requirements and doing the math.",
        "Not estimating — you can't justify sharding without a data-size and write-rate number.",
        "Designing for 1000× the stated scale (or ignoring peak vs average).",
        "Going silent — the interviewer grades communication and trade-off reasoning, not just the final box diagram.",
        "Ignoring the failure modes: what happens when the cache, a shard, or a whole AZ goes down?",
        "One consistency model for everything — likes can be eventual, payments cannot.",
      ],
      interviewQs: [
        "Estimate QPS, storage, and bandwidth for this system.",
        "What availability target would you pick and how do you achieve it?",
        "Where is the single point of failure in your design?",
        "Which data needs strong consistency and which can be eventual?",
        "How does the system degrade under 5× unexpected load?",
      ],
    },

    {
      id: "hld-scaling",
      title: "Scaling: Vertical, Horizontal, Statelessness, Resilience",
      tags: ["scalability"],
      brushup: [
        "Vertical scaling: bigger machine — zero code change, hard ceiling, single point of failure, superlinear cost at the top.",
        "Horizontal scaling: more machines behind a load balancer — near-linear, but needs stateless services + coordination.",
        "Keep app servers stateless: session/state in Redis or a signed token, so any instance can serve any request (no sticky sessions).",
        "Scale reads with replicas + cache; scale writes with sharding/partitioning or a write-optimized store (LSM, append log).",
        "Move slow / non-critical work off the request path: queue + workers (emails, thumbnails, indexing, analytics).",
        "Design for failure: timeouts everywhere, retries with exponential backoff + jitter (idempotent ops only), circuit breakers, bulkheads, graceful degradation.",
        "Autoscaling on a leading signal (queue depth, CPU, p99) with headroom for the scale-up lag.",
      ],
      detail: `
<h2>The usual scaling path</h2>
<ol>
<li>Single box (app + DB together).</li>
<li>Split the DB onto its own host; add a cache (Redis) for hot reads.</li>
<li>Multiple stateless app servers behind a load balancer.</li>
<li>DB read replicas; route reads to replicas, writes to the primary.</li>
<li>CDN for static assets and cacheable API responses; object store for blobs.</li>
<li>Message queue + workers for async jobs; decouple write bursts.</li>
<li>Shard the database when one primary can't hold the dataset or take the write volume.</li>
<li>Split into services along team/domain seams when the monolith slows delivery (not before).</li>
<li>Multi-region for latency and disaster recovery.</li>
</ol>

<h2>Stateless services</h2>
<pre><code>// bad: session in server memory ⇒ sticky sessions, lost on deploy/scale-in, uneven load
// good: session in Redis (or a stateless JWT the client re-sends)
GET /api/orders   Authorization: Bearer &lt;jwt&gt;      // any replica can serve this</code></pre>
<p>Anything that must be remembered between requests goes to a shared store: sessions → Redis, uploads-in-progress → object store + a DB row, rate-limit counters → Redis, feature flags → a config service.</p>

<h2>Resilience patterns</h2>
<table>
<tr><th>Pattern</th><th>What it does</th></tr>
<tr><td>Timeout</td><td>Every network call has one. A call without a timeout is a latent outage.</td></tr>
<tr><td>Retry + backoff + jitter</td><td>Ride out transient failures. Idempotent ops only. Jitter prevents synchronized retry storms.</td></tr>
<tr><td>Circuit breaker</td><td>After N failures, fail fast for a cooldown instead of hammering a dying dependency; half-open probes to recover.</td></tr>
<tr><td>Bulkhead</td><td>Separate thread/connection pools per dependency, so one slow downstream can't exhaust everything.</td></tr>
<tr><td>Load shedding</td><td>Under overload, reject low-priority requests early (return 429/503) to protect the core.</td></tr>
<tr><td>Graceful degradation</td><td>Serve stale cache, a default, or a reduced feature set instead of an error.</td></tr>
<tr><td>Idempotency keys</td><td>Client sends a unique key; the server dedupes retried writes (payments, orders).</td></tr>
</table>

<h2>Retry storm — the anti-pattern</h2>
<p>A service hiccups; every client retries immediately and in lockstep; the recovering service is hit with a synchronized spike and falls over again. Fixes: exponential backoff, full jitter (<code>sleep = random(0, base·2^attempt)</code>), a retry budget (cap retries as a fraction of traffic), and circuit breakers so clients stop trying a known-down dependency.</p>

<h2>Autoscaling</h2>
<p>Scale on a signal that <em>leads</em> the problem: queue depth or p99 latency beats CPU for I/O-bound services. Account for warm-up time (new instances need JIT/cache warm-up and connection pools). Keep a buffer (target 60–70% utilization) so a spike doesn't saturate before new capacity arrives. Scale <em>down</em> slowly to avoid flapping.</p>`,
      pitfalls: [
        "Sticky sessions as a scaling strategy — breaks autoscaling and rolling deploys.",
        "Retries without idempotency ⇒ duplicate charges/orders/emails.",
        "Retries with no jitter ⇒ synchronized retry spikes finish off the recovering service.",
        "No timeout on a downstream call.",
        "Autoscaling on CPU for an I/O-bound service that's actually blocked on a slow dependency.",
        "Adding a cache/queue without a plan for when it's unavailable.",
      ],
      interviewQs: [
        "Vertical vs horizontal scaling — trade-offs and when each.",
        "How do you make a service horizontally scalable?",
        "Explain circuit breakers, bulkheads, and where you'd place them.",
        "How do you prevent a retry storm?",
        "What signal would you autoscale on for this service and why?",
      ],
    },

    {
      id: "hld-load-balancing",
      title: "Load Balancing, API Gateway & Service Discovery",
      tags: ["networking", "scalability"],
      brushup: [
        "An LB spreads traffic, health-checks backends, enables zero-downtime deploys, and often terminates TLS.",
        "L4 (transport): routes by IP/port, protocol-agnostic, fast. L7 (application): routes by path/header/cookie, can rewrite, auth, rate-limit, retry, and do content-based routing.",
        "Algorithms: round robin, weighted RR, least connections, least response time, IP hash / consistent hash (for cache/shard affinity).",
        "Global routing: GeoDNS, Anycast, or a global LB routes users to the nearest healthy region.",
        "API Gateway: one front door — auth, rate limiting, routing, request aggregation, protocol translation (REST↔gRPC), observability.",
        "Service discovery: a registry (Consul, etcd, Eureka, k8s DNS) that maps a logical service name to healthy instance addresses.",
        "The LB itself must be HA: an active-passive pair with a floating VIP, or a managed cloud LB.",
      ],
      detail: `
<h2>L4 vs L7</h2>
<table>
<tr><th></th><th>L4</th><th>L7</th></tr>
<tr><td>Inspects</td><td>IP, port, TCP/UDP</td><td>HTTP method, path, headers, cookies, body</td></tr>
<tr><td>Throughput</td><td>very high (kernel/NIC offload possible)</td><td>lower (parses HTTP, may buffer)</td></tr>
<tr><td>Capabilities</td><td>NAT, connection pass-through, DSR</td><td>path routing, TLS termination, WAF, rate limit, retries, canary splits, header injection</td></tr>
<tr><td>TLS</td><td>pass-through (opaque)</td><td>terminate + re-encrypt</td></tr>
</table>
<p>Common setup: an L4 LB (or Anycast) at the very edge for raw throughput and DDoS absorption, then L7 (Envoy/NGINX/ALB) for smart routing and app concerns.</p>

<h2>Choosing an algorithm</h2>
<ul>
<li><b>Round robin / weighted RR</b> — homogeneous backends, roughly uniform request cost.</li>
<li><b>Least connections / least outstanding requests</b> — variable request durations (long polls, streaming, heavy queries). Avoids piling onto a slow backend.</li>
<li><b>Consistent hashing</b> — you want the same key to hit the same backend (local cache warmth, session affinity, sticky sharding). Adding/removing one node remaps only ~1/N of keys.</li>
</ul>

<h2>Consistent hashing</h2>
<pre><code>// Place both nodes and keys on a hash ring (0 .. 2^32).
// A key is owned by the first node clockwise from its hash.
// Each physical node gets many VIRTUAL nodes (100s) sprinkled around the ring
//   → smooths the load distribution and the impact of add/remove.
// Node fails → only its key range moves, to the next node — no global reshuffle.</code></pre>
<p>Used by CDNs, distributed caches (memcached clients), Dynamo/Cassandra partitioning, and sharded proxies. Contrast with <code>hash(key) % N</code>: changing N remaps almost every key.</p>

<h2>Health checks</h2>
<p><b>Active</b>: the LB periodically hits <code>/healthz</code>. <b>Passive</b>: eject a backend after consecutive 5xx / timeouts, re-add after it recovers. Distinguish <b>liveness</b> (process is up — restart if not) from <b>readiness</b> (can serve traffic <em>right now</em> — remove from the pool during warm-up, migrations, or when a critical dependency is down, without restarting).</p>

<h2>API Gateway responsibilities</h2>
<ul>
<li>AuthN/AuthZ (validate JWT / API key), so services trust an internal header.</li>
<li>Rate limiting &amp; quota enforcement per client.</li>
<li>Routing &amp; versioning (<code>/v1/...</code> → service A, <code>/v2/...</code> → service B).</li>
<li>Request aggregation / BFF (one client call fans out to several services).</li>
<li>Protocol translation, response caching, request/response transformation.</li>
<li>Centralized logging, tracing headers, metrics.</li>
</ul>
<p>Risk: the gateway becomes a fat monolith and a bottleneck. Keep it thin; push business logic into services.</p>

<h2>Service discovery</h2>
<p><b>Client-side</b>: the client queries the registry and load-balances itself (Eureka + Ribbon). <b>Server-side</b>: the client hits a stable LB/VIP that consults the registry (k8s Service, AWS ALB + target groups). Kubernetes gives you DNS-based discovery (<code>orders.default.svc.cluster.local</code>) plus kube-proxy/iptables/IPVS load balancing for free.</p>`,
      pitfalls: [
        "`hash(key) % N` for sharding/cache routing — changing N remaps nearly everything. Use consistent hashing.",
        "The load balancer as an unreplicated single point of failure.",
        "Health check that only checks the TCP port, not the app or its critical dependencies.",
        "L7 concerns (auth, rate limiting) reimplemented in every service instead of at the gateway.",
        "Long-lived connections (WebSocket, gRPC streams) + round robin ⇒ imbalance after scale-out; rebalance or use least-connections.",
        "API gateway accreting business logic until it's the new monolith.",
      ],
      interviewQs: [
        "L4 vs L7 load balancing — when would you use each?",
        "Why consistent hashing over modulo hashing?",
        "What does an API gateway do that a plain LB doesn't?",
        "Liveness vs readiness checks — why both?",
        "Client-side vs server-side service discovery.",
      ],
    },

    {
      id: "hld-caching",
      title: "Caching Strategies",
      tags: ["performance", "caching"],
      brushup: [
        "Layers: browser → CDN → reverse proxy → application (in-process / near cache) → distributed cache (Redis/Memcached) → DB buffer pool.",
        "Patterns: cache-aside (lazy, app-managed — the default), read-through, write-through (write cache + DB together), write-back (write cache now, flush later — fast, risky), write-around (write DB, cache fills on read).",
        "Eviction: LRU (common), LFU, FIFO, TTL. Always set a TTL to bound staleness and memory.",
        "Invalidation is the hard part: TTL, explicit delete on write, versioned keys, or event-driven invalidation via CDC.",
        "Failure modes: stampede / thundering herd, hot key, cache penetration (missing keys), big key, cache avalanche (mass simultaneous expiry).",
        "Mitigations: single-flight / request coalescing, jittered TTLs, negative caching, local + distributed tiers, lock-on-miss, pre-warming.",
      ],
      detail: `
<h2>Cache-aside (lazy loading) — the workhorse</h2>
<pre><code>async function getUser(id){
  const key = "user:" + id;
  let u = await cache.get(key);
  if (u) return u;                                  // hit
  u = await db.query("SELECT * FROM users WHERE id = ?", id);   // miss
  if (u) await cache.set(key, u, { ttl: 300 + jitter() });
  else await cache.set(key, NULL_SENTINEL, { ttl: 30 });        // negative cache
  return u;
}
// on update:  await db.update(...);  await cache.del(key);      // delete, don't try to update in place</code></pre>
<p>Delete-on-write beats update-on-write because two concurrent writers can race and leave a stale value in the cache; deleting forces the next reader to reload the source of truth.</p>

<h2>Write policies</h2>
<table>
<tr><th>Policy</th><th>Write path</th><th>Read after write</th><th>Risk</th></tr>
<tr><td>Write-through</td><td>cache + DB synchronously</td><td>hot</td><td>slower writes; cache holds data that may never be read</td></tr>
<tr><td>Write-back</td><td>cache now, DB flushed async/batched</td><td>hot</td><td>data loss if the cache dies before flush</td></tr>
<tr><td>Write-around</td><td>DB only; cache populated on next read</td><td>miss (cold)</td><td>write-heavy keys never pollute the cache</td></tr>
</table>

<h2>The failure modes</h2>
<h3>Stampede / thundering herd</h3>
<p>A popular key expires; thousands of concurrent requests all miss and hit the DB simultaneously. Fixes:</p>
<ul>
<li><b>Single-flight / lock-on-miss</b>: only one request recomputes; the rest wait for its result (per-key mutex, or <code>SETNX</code> a "rebuilding" flag).</li>
<li><b>Probabilistic early expiration</b>: refresh <em>before</em> TTL with a probability that rises as expiry nears (XFetch), so one request refreshes early and others keep using the still-valid value.</li>
<li><b>Stale-while-revalidate</b>: serve the stale value and refresh in the background.</li>
</ul>
<h3>Cache avalanche</h3>
<p>Many keys expire at the same instant (e.g. all set with TTL 3600 at deploy time). Add <b>jitter</b>: <code>ttl = base + random(0, base·0.1)</code>.</p>
<h3>Cache penetration</h3>
<p>Repeated queries for keys that don't exist (bugs, or an attacker) bypass the cache every time and pound the DB. Fixes: cache the "not found" result briefly (negative caching), or a <b>Bloom filter</b> of existing keys to reject impossible lookups cheaply.</p>
<h3>Hot key</h3>
<p>One key (a viral post) gets so much traffic it saturates a single Redis shard. Fixes: replicate the key across shards with a random suffix and pick one per read, add a small in-process near-cache in front, or push it to the CDN.</p>

<h2>CDN caching</h2>
<p>Edge PoPs cache static assets and cacheable API responses close to users. Control with <code>Cache-Control</code>, <code>Surrogate-Control</code>, and cache keys (vary by path, query, a few headers). Invalidate via purge API or, better, content-hashed URLs (<code>app.4f2a.js</code>) so a deploy changes the URL. Dynamic-but-cacheable responses can use short TTLs + stale-while-revalidate at the edge.</p>

<h2>Consistency vs the cache</h2>
<p>A cache is a second copy ⇒ it can be stale. Decide per data type how stale is acceptable (like counts: minutes; account balance: never — don't cache it, or cache with immediate invalidation + short TTL). For "must be fresh right after my own write", read from the primary/source for a short window after a write (read-your-writes).</p>`,
      pitfalls: [
        "No TTL ⇒ unbounded memory and permanent stale data after one missed invalidation.",
        "Caching per-user data under a shared key (data leak between users).",
        "Write-back cache for data you can't afford to lose on a node crash.",
        "All keys sharing one TTL set at deploy time ⇒ synchronized avalanche.",
        "Trying to keep the cache perfectly consistent with the DB (update-in-place races) instead of deleting on write.",
        "Ignoring the stampede until the first viral event takes down the database.",
      ],
      interviewQs: [
        "Cache-aside vs write-through vs write-back — trade-offs.",
        "How do you prevent a cache stampede on a hot key?",
        "How do you keep the cache consistent with the database?",
        "What is cache penetration and how do you defend against it?",
        "Where would you cache in this design, and with what TTL?",
      ],
    },

    {
      id: "hld-db-scaling",
      title: "Database Scaling: Replication, Partitioning, Sharding",
      tags: ["database", "scalability"],
      brushup: [
        "Replication: copy data to replicas. Async (fast, replica lag, possible data loss on failover) vs sync (consistent, higher write latency) vs semi-sync. Multi-primary ⇒ write-conflict resolution.",
        "Read scaling: route reads to replicas. Watch read-your-writes: pin a user's reads to the primary briefly after their write, or use causal tokens.",
        "Partitioning = splitting one database's data (by table, or horizontally into segments). Sharding = spreading data across independent database instances.",
        "Shard key must be: high cardinality, evenly distributed, aligned with the dominant query, and stable. A bad key ⇒ hot shard + cross-shard queries.",
        "Sharding strategies: hash (even, no range scans), range (range scans, hotspot risk), geo, directory/lookup (flexible, extra hop). Use many virtual shards + a shard map so rebalancing is a copy-and-cutover, not a key-level rehash.",
        "Cross-shard joins/transactions are hard: denormalize, app-side joins, scatter-gather, or a saga.",
        "Also in the toolbox: connection pooling, read replicas, CQRS, CDC, materialized views, archiving cold data.",
      ],
      detail: `
<h2>Replication topologies</h2>
<pre><code>Primary ──async──▶ Replica 1  (serves reads)
        ──async──▶ Replica 2  (reads + analytics)
        ──sync───▶ Replica 3  (bounds data loss on failover)

failover: promote a replica (orchestrator or built-in consensus); apps re-discover the new primary</code></pre>
<p>Async replication means a replica can be milliseconds-to-seconds behind. That's fine for "list my past orders" but wrong for "did my payment go through?". Semi-sync (wait for ≥1 replica ack) bounds <b>RPO</b> at the cost of a round trip per commit.</p>

<h2>Partitioning vs sharding</h2>
<ul>
<li><b>Vertical partitioning</b>: move some columns/tables to another store (e.g. large BLOBs to object storage, rarely-used columns to a separate table).</li>
<li><b>Horizontal partitioning within one DB</b>: native table partitions by range/hash — the DB routes queries; good for time-series and easy archival.</li>
<li><b>Sharding</b>: independent DB instances, each holding a subset of rows. The <em>application</em> (or a proxy like Vitess/Citus) routes. Needed when a single primary can't hold the dataset or take the write throughput.</li>
</ul>

<h2>Choosing a shard key</h2>
<table>
<tr><th>Candidate</th><th>Problem</th></tr>
<tr><td>Auto-increment ID</td><td>every new write hits the last shard → permanent hotspot</td></tr>
<tr><td>Timestamp</td><td>same — "today's shard" is hot; old shards idle</td></tr>
<tr><td>Low-cardinality (country, status)</td><td>uneven; a few huge shards; can't split further</td></tr>
<tr><td><b>Entity id hash (user_id, tenant_id)</b></td><td>usually right: even spread, stable, and most queries filter by it</td></tr>
</table>
<pre><code>NUM_VIRTUAL_SHARDS = 4096
vshard = murmur3(user_id) % NUM_VIRTUAL_SHARDS
physical_node = shardMap[vshard]        // a small, cached lookup table

// rebalance = move some vshards to a new node: copy → catch up → flip the map entry → done
// no per-row rehash; only the moved vshards' clients see a brief cutover</code></pre>

<h2>Cross-shard operations</h2>
<ul>
<li><b>Scatter-gather read</b>: query all shards, merge results. Latency = the slowest shard; add a per-shard timeout + partial results.</li>
<li><b>Denormalize</b>: duplicate the fields you'd join on so the query stays single-shard (keep copies in sync via events).</li>
<li><b>Saga</b>: a multi-step workflow as a sequence of local transactions + compensating actions on failure — for cross-service/shard consistency without a distributed lock.</li>
<li><b>Two-phase commit</b>:真の atomicity across shards, but the coordinator is a failure point and participants block holding locks — avoid for anything latency-sensitive.</li>
</ul>

<h2>CQRS &amp; CDC</h2>
<p><b>CQRS</b>: separate the write model (normalized, transactional) from one or more read models (denormalized projections optimized per query), kept in sync by events. <b>CDC</b> (change data capture): stream the DB's write-ahead log (Debezium → Kafka) to keep search indexes, caches, read models, and the warehouse current without dual writes.</p>

<h2>Before you shard</h2>
<p>Sharding adds permanent operational complexity (cross-shard queries, rebalancing, schema migrations × N, hot shards). Exhaust the cheaper options first: a bigger box, read replicas + caching, better indexes and queries, archiving cold rows, vertical partitioning, connection pooling.</p>`,
      pitfalls: [
        "Sharding on a monotonically increasing key → permanent hot shard.",
        "Assuming replicas are current — stale reads surprise users right after they write.",
        "Sharding prematurely; try replicas + cache + a bigger instance first.",
        "A design that constantly needs cross-shard transactions or joins.",
        "Rebalancing by re-hashing every row instead of using virtual shards + a shard map.",
        "Dual-writing to the DB and a search index/cache without CDC or the outbox pattern.",
      ],
      interviewQs: [
        "How would you pick a shard key for this system?",
        "How do you handle replica lag and read-your-writes consistency?",
        "How do you run a transaction that spans two shards?",
        "How do you rebalance shards when adding capacity, with minimal disruption?",
        "When would you reach for CQRS or CDC?",
      ],
    },

    {
      id: "hld-messaging",
      title: "Message Queues, Streams & Async Processing",
      tags: ["async", "scalability"],
      brushup: [
        "Queues decouple producers from consumers: absorb spikes (buffer), smooth load, retry failures, and let each side scale independently.",
        "Queue (SQS, RabbitMQ): a message is delivered to one consumer, then removed. Log/stream (Kafka, Kinesis, Pulsar): ordered, partitioned, retained; each consumer group tracks its own offset and can replay.",
        "Delivery semantics: at-most-once (may lose), at-least-once (may duplicate — the common default; needs idempotent consumers), exactly-once (hard; usually at-least-once + dedup or transactional processing).",
        "Ordering holds only within a partition/key — pick a partition key that groups messages that must be ordered.",
        "Backpressure: bounded queues + autoscale consumers on lag. Dead-letter queue for poison messages after N retries.",
        "Publish a DB change AND an event atomically → the Outbox pattern (or CDC).",
        "Uses: async jobs, event-driven services, fan-out notifications, log/metrics pipelines, stream processing, buffering writes.",
      ],
      detail: `
<h2>Why async</h2>
<pre><code>// synchronous: the user waits for everything, and any failure fails the whole request
POST /upload → save file → generate thumbnail → index for search → notify followers → return

// asynchronous: fast response, each step retried independently
POST /upload → save file → enqueue {thumbnail, index, notify} → return 202 Accepted
workers consume the queue; a failure retries that step without blocking the user or the others</code></pre>

<h2>Queue vs log</h2>
<table>
<tr><th></th><th>Queue (SQS, RabbitMQ)</th><th>Log (Kafka)</th></tr>
<tr><td>Consumption model</td><td>competing consumers; message deleted after ack</td><td>consumer groups with independent offsets; message retained</td></tr>
<tr><td>Replay</td><td>no (once consumed, it's gone)</td><td>yes — rewind the offset</td></tr>
<tr><td>Ordering</td><td>limited / best-effort (FIFO queues exist, lower throughput)</td><td>total order per partition</td></tr>
<tr><td>Fan-out to many consumers</td><td>one queue per consumer (or a topic exchange)</td><td>native — add a consumer group</td></tr>
<tr><td>Throughput</td><td>high</td><td>very high (sequential disk, batching, zero-copy)</td></tr>
<tr><td>Typical use</td><td>task/job distribution</td><td>event streaming, CDC, analytics, replayable pipelines</td></tr>
</table>

<h2>Idempotent consumer (because delivery is at-least-once)</h2>
<pre><code>async function handle(msg){
  // dedup store: Redis SETNX with TTL, or a unique constraint on (message_id) in the DB
  const fresh = await dedup.setIfAbsent(msg.id, { ttl: "7d" });
  if (!fresh) return ack(msg);            // already processed — safe to drop

  await applyEffect(msg);                 // make this idempotent too: upsert, not insert; natural keys
  await ack(msg);
}</code></pre>
<p>At-least-once duplicates happen when a consumer crashes after doing the work but before acking, or when the visibility timeout expires because processing was slow. Design the <em>effect</em> to be idempotent and you don't need exactly-once.</p>

<h2>The Outbox pattern</h2>
<pre><code>BEGIN;
  INSERT INTO orders (...);
  INSERT INTO outbox (id, topic, payload) VALUES (...);   -- same transaction ⇒ atomic
COMMIT;
-- a relay process polls the outbox table (or tails the WAL via CDC) and publishes to Kafka,
-- then marks the row sent. No "DB committed but the event was lost" gap.</code></pre>
<p>The naive alternative — write to the DB, then publish to the queue as two separate operations — loses the event if the process dies in between (or publishes a phantom event if the DB later rolls back).</p>

<h2>Consumer scaling &amp; ordering</h2>
<p>Kafka parallelism = number of partitions (one consumer per partition per group). More partitions ⇒ more parallelism but weaker global ordering and more overhead. Choose the partition key so that everything requiring order shares a key (e.g. all events for one <code>account_id</code>) while load still spreads across partitions.</p>

<h2>Dead-letter queue &amp; retries</h2>
<p>Retry transient failures with backoff. After N attempts, move the message to a DLQ so it stops blocking the partition/queue, alert, and inspect/replay it later. Without a DLQ, one malformed ("poison") message can stall a partition forever.</p>

<h2>Stream processing</h2>
<p>Frameworks (Kafka Streams, Flink, Spark Structured Streaming) do windowed aggregation, joins, and enrichment over event streams with state, watermarks for late data, and checkpointing for exactly-once <em>within the pipeline</em>. Used for real-time metrics, fraud detection, materialized views, sessionization.</p>`,
      pitfalls: [
        "Assuming exactly-once delivery — design consumers to tolerate duplicates.",
        "A bad partition key: one giant partition (no parallelism) or ordering you needed is now lost.",
        "No dead-letter queue ⇒ one poison message blocks the partition indefinitely.",
        "Dual-write (DB + queue) without the outbox pattern or CDC ⇒ inconsistency on partial failure.",
        "Unbounded consumer lag with no autoscaling or backpressure signal.",
        "Putting a queue in the synchronous request path and still blocking on the result.",
      ],
      interviewQs: [
        "Kafka vs SQS/RabbitMQ — when would you choose each?",
        "How do you achieve exactly-once processing (or avoid needing it)?",
        "How do you publish a domain event and a DB write atomically?",
        "How do you preserve ordering while still parallelizing consumers?",
        "What is a dead-letter queue and why do you need one?",
      ],
    },

    {
      id: "hld-consistency",
      title: "Consistency, CAP/PACELC & Consensus",
      tags: ["distributed", "theory"],
      brushup: [
        "CAP: during a network PARTITION, choose Consistency (reject/block) or Availability (serve possibly stale). PACELC adds: Else (no partition), choose Latency or Consistency.",
        "Consistency spectrum: strong / linearizable → sequential → causal → read-your-writes / monotonic reads → eventual.",
        "Quorum: with N replicas, W + R > N makes a read quorum overlap the last write quorum ⇒ fresh reads. Tune W/R for latency vs consistency.",
        "Consensus (Raft, Paxos, Zab): agree on a single value / a total order of a log despite crashes; needs a majority; used for leader election, config, metadata, distributed locks.",
        "Conflict resolution in AP systems: last-write-wins (lossy), vector clocks / version vectors (detect concurrency), CRDTs (auto-merge).",
        "2PC gives cross-node atomicity but blocks on coordinator failure; sagas trade atomicity for availability with compensations.",
        "Idempotency + fencing tokens are prerequisites for correctness under retries and distributed locks.",
      ],
      detail: `
<h2>Consistency models, concretely</h2>
<ul>
<li><b>Linearizable / strong</b>: every operation appears to take effect atomically at some point between its call and return; reads see the latest completed write. Behaves like a single copy. Costs latency and availability.</li>
<li><b>Sequential</b>: all clients see operations in the same order, but not necessarily real-time order.</li>
<li><b>Causal</b>: operations that are causally related (A "happened before" B) are seen in that order by everyone; concurrent ops may be seen in different orders.</li>
<li><b>Read-your-writes</b>: you always see your own updates (route your reads to the primary, or carry a version token).</li>
<li><b>Monotonic reads</b>: you never see time go backwards (once you've seen version 5, you won't later see version 3).</li>
<li><b>Eventual</b>: if writes stop, all replicas converge. Fine for like counts, view counts, presence — not for balances or inventory-of-record.</li>
</ul>

<h2>Quorum math</h2>
<pre><code>N = 3 replicas
W = 2, R = 2  → W + R = 4 &gt; 3  → every read quorum intersects the last write quorum ⇒ fresh reads
W = 3, R = 1  → strong reads, fast reads, but any replica down blocks writes
W = 1, R = 1  → lowest latency, eventual consistency
</code></pre>
<p>Dynamo-style extras: <b>hinted handoff</b> (store a write meant for a down node on a neighbor, deliver later), <b>read repair</b> (fix stale replicas noticed during a read), <b>anti-entropy</b> (Merkle-tree background reconciliation).</p>

<h2>Raft in one paragraph</h2>
<p>One elected <b>leader</b> handles all writes: it appends each command to its log and replicates to followers. An entry is <b>committed</b> once a majority has stored it; only then is it applied to the state machine and acknowledged to the client. Followers redirect client writes to the leader and reset an election timer on each heartbeat; if it fires, a follower becomes a candidate and requests votes, and a node only votes for a candidate whose log is at least as up-to-date as its own. A minority partition can't get a majority ⇒ it can't elect a leader ⇒ it stops accepting writes (CAP: chooses C over A).</p>

<h2>Where consensus shows up</h2>
<p>etcd / ZooKeeper / Consul (config, service discovery, leader election, distributed locks), Kafka's controller and ISR, database leader election and replicated commit (Spanner, CockroachDB per-range Raft groups), distributed schedulers.</p>

<h2>Distributed locks — do it right</h2>
<p>A naive "SETNX a key with a TTL" lock is unsafe: the holder can pause (GC, page fault) past the TTL, the lock expires, someone else takes it, then the paused holder wakes and acts — two holders. Fix: a monotonically increasing <b>fencing token</b> issued with the lock; the protected resource rejects any write with a token lower than the highest it has seen.</p>

<h2>2PC vs Saga</h2>
<table>
<tr><th></th><th>Two-Phase Commit</th><th>Saga</th></tr>
<tr><td>Atomicity</td><td>true (all or nothing)</td><td>eventual; each step commits locally</td></tr>
<tr><td>Failure handling</td><td>coordinator failure ⇒ participants block holding locks</td><td>run compensating transactions to undo prior steps</td></tr>
<tr><td>Isolation</td><td>yes (locks held to commit)</td><td>no — intermediate states are visible</td></tr>
<tr><td>Fit</td><td>a few tightly-coupled resources, short transactions</td><td>long-running, cross-service workflows (order → payment → shipping)</td></tr>
</table>`,
      pitfalls: [
        "Reciting 'CAP = pick 2 of 3' as a general rule — the choice only bites during a partition; day to day it's PACELC's latency-vs-consistency.",
        "Last-write-wins silently dropping concurrent updates (needs vector clocks or CRDTs to even detect the conflict).",
        "A distributed lock (Redis SETNX / ZooKeeper) used without fencing tokens.",
        "Running 2PC across microservices and being surprised by coordinator-failure stalls.",
        "One consistency level for the whole system instead of per-data-type.",
        "Assuming a quorum read is linearizable without also doing quorum writes and handling read-repair.",
      ],
      interviewQs: [
        "Explain CAP (and PACELC) with a concrete example for this design.",
        "Walk through how Raft elects a leader and commits a log entry.",
        "How does quorum (R/W/N) tuning trade consistency for availability?",
        "Why is a TTL-based distributed lock unsafe, and how do fencing tokens fix it?",
        "2PC vs Saga — when would you use each?",
        "Which parts of your system need strong consistency and which can be eventual?",
      ],
    },

    {
      id: "hld-microservices",
      title: "Monolith vs Microservices, Observability, SLOs",
      tags: ["architecture"],
      brushup: [
        "Start with a modular monolith. Split into services when team size, deploy independence, or scaling isolation demand it — not for the résumé.",
        "Service boundaries follow business domains (DDD bounded contexts), each owned end-to-end by one team, with its own datastore (no shared DB).",
        "Costs of microservices: network calls, partial failure, distributed transactions, versioning, harder local dev, and a mandatory platform investment (CI/CD, service mesh, tracing).",
        "Communication: sync (REST/gRPC) for queries needing an immediate answer; async events for decoupling and fan-out. Prefer choreography; use orchestration for complex multi-step workflows.",
        "Observability = logs (structured, correlated by trace id) + metrics (RED per endpoint, USE per resource) + traces (distributed spans). Alert on SLO burn, not raw metrics.",
        "SLI = a measurement; SLO = your internal target; SLA = the external promise with penalties; error budget = 1 − SLO.",
      ],
      detail: `
<h2>When to split (and when not to)</h2>
<table>
<tr><th>Signal</th><th>Reading</th></tr>
<tr><td>One team, &lt; ~10 engineers, product still finding fit</td><td>modular monolith — fastest iteration</td></tr>
<tr><td>Multiple teams blocked on one shared deploy pipeline</td><td>split for deploy independence</td></tr>
<tr><td>One component needs 10× the resources / different scaling curve</td><td>extract it for scaling isolation</td></tr>
<tr><td>Components have very different reliability or compliance needs</td><td>split to contain blast radius</td></tr>
<tr><td>You want microservices because they're "best practice"</td><td>don't</td></tr>
</table>

<h2>The distributed monolith anti-pattern</h2>
<p>Services that must be deployed together, share a database, and call each other synchronously in deep chains. You pay every microservice cost (network, partial failure, ops) and get none of the benefits (independent deploy, independent scale, fault isolation). Symptoms: a schema change requires coordinating 5 teams; one service down means everything is down.</p>

<h2>Inter-service communication</h2>
<ul>
<li><b>Synchronous (REST/gRPC)</b>: simple mental model, immediate response, but latency and failure probability compound down a call chain (5 hops at 99.9% each ⇒ 99.5%).</li>
<li><b>Asynchronous (events)</b>: producers don't know consumers; add a consumer without touching the producer; natural buffering. Cost: eventual consistency, harder to reason about end-to-end, need idempotency.</li>
<li><b>Orchestration</b> (a central workflow service drives the steps) vs <b>choreography</b> (services react to each other's events). Orchestration is easier to observe and change; choreography is more decoupled but can become an implicit, undocumented workflow.</li>
</ul>

<h2>Observability — the three pillars</h2>
<table>
<tr><th>Pillar</th><th>What / how</th></tr>
<tr><td>Logs</td><td>Structured JSON; every line carries <code>trace_id</code>, <code>span_id</code>, <code>user_id</code>. Centralized (ELK / Loki). Sampled or dropped at high volume.</td></tr>
<tr><td>Metrics</td><td><b>RED</b> per endpoint: Rate, Errors, Duration (histogram → p50/p95/p99). <b>USE</b> per resource: Utilization, Saturation, Errors. Cheap, aggregated, great for dashboards and alerts.</td></tr>
<tr><td>Traces</td><td>One span per service hop, parent/child linked, propagated via headers (W3C traceparent). Shows exactly where a slow request spent its time.</td></tr>
</table>

<h2>SLI / SLO / SLA / error budget</h2>
<ul>
<li><b>SLI</b>: a concrete measurement — "proportion of requests served &lt; 300 ms", "successful requests / total".</li>
<li><b>SLO</b>: the target — "99.9% of requests &lt; 300 ms over 28 days". Internal.</li>
<li><b>SLA</b>: the contractual version with customer-facing consequences (credits/penalties). Always looser than the SLO.</li>
<li><b>Error budget</b> = 1 − SLO (e.g. 0.1% ⇒ ~43 min/month of allowed failure). If you're burning it fast, freeze risky launches and fix reliability; if there's budget to spare, ship faster.</li>
</ul>

<h2>Deployment safety</h2>
<p>Blue-green (two full environments, flip traffic), canary (route 1% → 5% → 50% → 100%, watch metrics, auto-rollback on SLO breach), feature flags (decouple deploy from release, kill-switch a feature without redeploying). Backward-compatible schema changes (expand-migrate-contract) so old and new code coexist during a rollout.</p>`,
      pitfalls: [
        "Microservices sharing a database — you can't evolve schemas independently; it's a distributed monolith.",
        "Deep synchronous call chains — latency and failure probability multiply.",
        "No distributed tracing — debugging a slow cross-service request becomes guesswork.",
        "Splitting by technical layer ('a controller service', 'a DAO service') instead of by business domain.",
        "Alerting on every metric threshold instead of on SLO burn rate → alert fatigue.",
        "Adopting microservices without the platform investment (CI/CD per service, mesh, observability).",
      ],
      interviewQs: [
        "When would you NOT use microservices?",
        "What's a distributed monolith and how do you avoid one?",
        "How do you trace a slow request across 6 services?",
        "Orchestration vs choreography for a multi-step workflow.",
        "Define SLI, SLO, SLA, and error budget.",
        "How would you roll out a risky change safely?",
      ],
    },

    {
      id: "hld-design-url-shortener",
      title: "Worked Design: URL Shortener",
      tags: ["design", "worked-example"],
      brushup: [
        "Functional: shorten(longUrl) → shortCode; GET /{code} → redirect; optional custom alias, expiry, per-link analytics, user accounts.",
        "Scale math: 100 M new URLs/day ≈ 1.2 K writes/s; reads ~100× ⇒ ~120 K/s; 5 yr ≈ 180 B URLs ⇒ 7-char base62 (62⁷ ≈ 3.5 T) is plenty.",
        "Code generation: (a) base62 of a distributed counter (ID ranges / ticket server / Snowflake), (b) hash(longUrl)[:n] + collision check, (c) pre-generated key pool.",
        "Storage: a KV store (code → longUrl + metadata), sharded by code hash. Extremely read-heavy ⇒ cache hot codes in Redis and at the CDN.",
        "Redirect: 301 (permanent, browser-cached, loses repeat analytics) vs 302 (temporary, every hit reaches you).",
        "Hard parts: counter coordination without a global bottleneck, hot links, abuse/malware, analytics write volume (async pipeline).",
      ],
      concept: null,
      detail: `
<h2>API</h2>
<pre><code>POST /api/shorten
  { "url": "https://example.com/very/long/path", "alias?": "promo", "ttlDays?": 90 }
  → 201 { "short": "https://sho.rt/aB3xK9", "code": "aB3xK9" }

GET /aB3xK9
  → 302 Location: https://example.com/very/long/path
     (also: fire an async click event; do NOT block the redirect on it)</code></pre>

<h2>Capacity &amp; storage</h2>
<pre><code>writes:   100 M/day  ≈ 1.2 K/s  (peak ~5 K/s)
reads:    ~10 B/day  ≈ 120 K/s  (peak higher)
row:      code(8) + long_url(~200) + metadata(~50) ≈ 260 B
5-year:   180 B rows × 260 B ≈ 47 TB  →  shard by hash(code) across ~20–50 nodes
</code></pre>

<h2>Generating the code</h2>
<h3>Option A — distributed counter + base62 (recommended)</h3>
<pre><code>// each app node leases a block of IDs from a central allocator, hands them out locally
block = redis.INCRBY("shortener:id_seq", 1000)   // node owns [block-1000, block)
id    = nextLocalId()
code  = base62(id)                                // 0-9 a-z A-Z, ~7 chars for our range</code></pre>
<p>No per-request coordination (one round trip per 1000 codes). Gaps on node restart are harmless. Alternative: a <b>Snowflake</b>-style 64-bit id (timestamp | datacenter | machine | sequence) — no central allocator at all, roughly time-ordered.</p>
<h3>Option B — hash the URL</h3>
<p><code>code = base62(md5(longUrl))[:7]</code>. Deduplicates identical URLs for free, but you must handle collisions (append a discriminator and retry) and it leaks nothing useful. Custom aliases still need a separate uniqueness check.</p>

<h2>Data model</h2>
<pre><code>urls:  code (PK) | long_url | created_at | expires_at | owner_id | disabled
       -- sharded by hash(code)
       -- optional: aliases table for reserved/custom codes with a uniqueness constraint</code></pre>

<h2>Read path (the hot path)</h2>
<pre><code>GET /{code}
  → CDN edge: cached 302 for popular codes? serve immediately
  → Redis: GET url:{code}  (hit ratio very high for a Zipfian link distribution)
  → DB shard for {code}; populate Redis with a TTL
  → respond 302 + enqueue {code, ts, ip, ua, referer, geo} to Kafka
Kafka → stream processor → per-link counters (Redis/ClickHouse) + raw events (data lake)</code></pre>

<h2>301 vs 302</h2>
<table>
<tr><th></th><th>301 Permanent</th><th>302 Found</th></tr>
<tr><td>Browser caches the redirect</td><td>yes (aggressively)</td><td>no</td></tr>
<tr><td>Repeat-visit analytics</td><td>lost after first hit</td><td>every hit counted</td></tr>
<tr><td>Can change the target later</td><td>hard (cached)</td><td>easy</td></tr>
<tr><td>Latency for repeat visits</td><td>zero (no request)</td><td>one request</td></tr>
</table>
<p>Most shorteners choose 302 (or 307) so they keep analytics and control.</p>

<h2>Extra concerns</h2>
<ul>
<li><b>Custom alias</b>: conditional insert / unique constraint; reserve a namespace so generated codes never collide with aliases (e.g. aliases must contain a letter and be ≥ 5 chars, generated codes are exactly 7 from a different alphabet slice).</li>
<li><b>Abuse</b>: rate-limit creation per account/IP; scan destination URLs against Google Safe Browsing / a blocklist async; support takedown via the <code>disabled</code> flag; show an interstitial for flagged links.</li>
<li><b>Analytics</b>: never write to the hot-path DB synchronously — stream events, aggregate in ClickHouse/Druid, precompute dashboards.</li>
<li><b>Expiry</b>: lazy check on read (expired ⇒ 404/410) + a background purge job to reclaim storage.</li>
<li><b>Availability</b>: the redirect path should stay up even if the create path is degraded; separate them.</li>
</ul>`,
      pitfalls: [
        "Hashing the URL and truncating without collision handling.",
        "Synchronous analytics writes on the redirect path — adds latency and a failure dependency.",
        "301 when you need repeat-visit analytics or the ability to change the target.",
        "A single global auto-increment sequence as the write bottleneck.",
        "Custom aliases colliding with generated codes (no reserved namespace).",
        "Not separating the (critical) redirect path from the (less critical) creation path.",
      ],
      interviewQs: [
        "How do you generate short codes without collisions at scale, without a central bottleneck?",
        "301 vs 302 for the redirect — what do you pick and why?",
        "How do you handle custom aliases?",
        "How does the analytics pipeline avoid slowing down redirects?",
        "How would you detect and disable abusive / malware links?",
      ],
    },

    {
      id: "hld-design-feed",
      title: "Worked Design: News Feed / Twitter Timeline",
      tags: ["design", "worked-example"],
      brushup: [
        "Two models: fan-out on write (push a post into every follower's feed cache when it's created) vs fan-out on read (pull and merge followees' recent posts at read time).",
        "Push: fast reads, but a celebrity post = millions of writes; wasteful for inactive users.",
        "Pull: cheap writes, but reads that merge thousands of timelines have terrible tail latency.",
        "Hybrid (what real systems do): push for normal users; for celebrities, skip fan-out and merge their recent posts at read time.",
        "Feed store: a per-user capped list of post IDs (Redis sorted set by timestamp/score); hydrate content from a post service + cache.",
        "Ranking: chronological is trivial; ML ranking needs a feature store + a scoring service; keep retrieval and ranking as separate stages.",
      ],
      concept: null,
      detail: `
<h2>Components</h2>
<pre><code>Post Service        → Post DB (sharded by post_id) + object store/CDN for media
Graph Service       → follower / following edges (who to fan out to)
Fan-out Service     → consumes "new post" events, writes post_ids into follower feed caches
Feed Cache (Redis)  → user_id → sorted set of post_ids (capped at ~800), score = timestamp
Timeline Service    → read feed ids → hydrate posts (Post Cache) → rank → return
Ranking Service     → optional: scores candidates using features (recency, affinity, engagement)</code></pre>

<h2>Write path — fan-out on write (with a celebrity carve-out)</h2>
<pre><code>POST /tweet
  → persist to Post DB
  → publish {post_id, author_id, created_at} to Kafka

Fan-out worker:
  followers = graph.followers(author_id)
  if len(followers) &gt; CELEBRITY_THRESHOLD (e.g. 100k):
      skip fan-out; mark author as "pull at read time"
  else:
      for f in followers:                    # batched
          redis.ZADD("feed:"+f, created_at, post_id)
          redis.ZREMRANGEBYRANK("feed:"+f, 0, -801)   # keep newest 800</code></pre>
<p>Fan-out is asynchronous and idempotent (ZADD with the same member is a no-op). Skip fan-out to inactive users entirely and rebuild their feed on next login.</p>

<h2>Read path — hybrid</h2>
<pre><code>GET /feed
  pushed   = ZREVRANGE("feed:"+me, 0, 50)                     # from fan-out-on-write
  celebs   = graph.following(me).filter(isCelebrity)
  pulled   = flatMap(c =&gt; recentPosts(c, since = my_last_seen)) # fan-out-on-read for the few celebs
  merged   = mergeByScore(pushed, pulled)[:50]
  posts    = postCache.multiGet(merged)                        # hydrate content (heavily cached)
  return chronological ? merged : rank(posts, viewer=me)</code></pre>

<h2>Why the split works</h2>
<table>
<tr><th></th><th>Pure fan-out on write</th><th>Pure fan-out on read</th><th>Hybrid</th></tr>
<tr><td>Write cost</td><td>O(followers) — brutal for celebrities</td><td>O(1)</td><td>O(followers) for non-celebs only</td></tr>
<tr><td>Read cost</td><td>O(1) — read your list</td><td>O(followees) merge — brutal for power users</td><td>O(1) + O(few celebs)</td></tr>
<tr><td>Storage</td><td>post_ids duplicated per follower</td><td>none extra</td><td>bounded (capped lists, no celeb fan-out)</td></tr>
</table>

<h2>Scale notes</h2>
<ul>
<li>Store <b>post IDs</b>, not post content, in feeds — content lives once in the Post store + cache; a viral post is one cache entry, not millions of copies.</li>
<li>Capped feed lists bound Redis memory; older history is served by the pull path or the author's profile.</li>
<li>Inactive users: no fan-out; lazily rebuild on login (pull the last N from each followee).</li>
<li>Media on a CDN; post text is small and cached aggressively (hit ratio &gt; 95%).</li>
<li>Unfollow: don't rewrite feeds — filter at read time, or let capped lists age the posts out.</li>
</ul>

<h2>Ranking (if not chronological)</h2>
<p>Two stages: <b>retrieval</b> (gather a few hundred candidates from follow graph + "networks you may like" + ads) then <b>ranking</b> (a model scores each candidate on p(engage) using features: author affinity, recency, content type, past behavior). Keep them separate so you can iterate on ranking without touching retrieval, and so you can fall back to chronological if the ranker is down.</p>`,
      pitfalls: [
        "Pure fan-out-on-write with no celebrity carve-out — one 50 M-follower post triggers 50 M writes.",
        "Pure fan-out-on-read — p99 read latency explodes for users following thousands of accounts.",
        "Storing full post content in every follower's feed instead of post IDs.",
        "Synchronous fan-out inside the POST request.",
        "Fanning out to inactive accounts that will never open the app.",
        "Coupling retrieval and ranking so you can't ship one without the other.",
      ],
      interviewQs: [
        "Fan-out on write vs on read — and what do real systems actually do?",
        "How do you handle a celebrity with 100 M followers?",
        "How do you keep feed storage bounded?",
        "What happens on follow / unfollow?",
        "How would you add ML ranking without a big rewrite?",
      ],
    },

    {
      id: "hld-design-chat",
      title: "Worked Design: Chat / Messaging System",
      tags: ["design", "worked-example"],
      brushup: [
        "Functional: 1:1 and group messaging, delivery + read receipts, online presence, message history, push notifications, media attachments.",
        "Real-time transport: persistent connections (WebSocket, or MQTT for mobile battery) to stateful gateway servers; a connection registry maps user → gateway.",
        "Send flow: client → gateway → message service → persist → fan out to recipients' gateways (or a per-user inbox) → push if offline.",
        "Storage: messages keyed by conversation_id + timestamp (or a snowflake message_id); wide-column (Cassandra) or a sharded relational store; per-conversation ordering.",
        "Delivery semantics: at-least-once + client-side dedup by message_id; per-conversation sequence numbers give ordering and gap detection.",
        "Presence: heartbeats + TTL keys in Redis; fan out presence changes only to interested contacts; accept mild staleness.",
        "Group messaging: small groups fan-out-on-write; large groups/channels lean toward fan-out-on-read.",
      ],
      concept: null,
      detail: `
<h2>Connection layer</h2>
<pre><code>Client ──WebSocket──▶ Chat Gateway (stateful, holds N live connections)
                          │
                          ├─ registers {user_id → gateway_id, conn_id} in a Connection Registry (Redis)
                          └─ heartbeats every ~30s; registry entries have a TTL

Gateways are behind an L4 LB; connections are sticky for their lifetime.
A gateway going down drops its connections; clients reconnect (with backoff) and re-register.</code></pre>

<h2>Send a message (1:1)</h2>
<pre><code>1. client → gateway:  {to: bob, client_msg_id, body}
2. gateway → Message Service
3. Message Service:
     msg_id = snowflake()                       // globally unique, time-sortable
     seq    = INCR(conversation:{cid}:seq)      // per-conversation ordering
     persist(msg) to the Message store
     ack back to sender  {msg_id, seq, status: SENT}
4. delivery: look up bob in the Connection Registry
     online  → push over bob's gateway → bob's client ACKs → status: DELIVERED
     offline → write to bob's "undelivered" queue + send a push notification (APNs/FCM)
5. bob's client later opens chat → marks read → READ receipt flows back to the sender</code></pre>
<p>Idempotency: the client sends a <code>client_msg_id</code>; retries (after a flaky network) are deduped server-side. The server's <code>msg_id</code> + per-conversation <code>seq</code> let the client detect gaps ("I have seq 5 and 7, request 6").</p>

<h2>Storage model</h2>
<pre><code>messages:
  PK  = conversation_id
  CK  = seq (or msg_id)          -- clustering key ⇒ rows stored sorted per conversation
  cols: sender_id, body, media_ref, created_at, deleted

conversations_by_user:            -- a user's chat list, sorted by last activity
  PK = user_id
  CK = last_message_ts desc
  cols: conversation_id, unread_count, last_message_preview</code></pre>
<p>Wide-column (Cassandra/ScyllaDB) fits: huge write volume, partition-per-conversation, range scans for "load older messages". Shard by <code>conversation_id</code>. Media goes to object storage; the message row holds a reference + thumbnail.</p>

<h2>Group messaging</h2>
<ul>
<li><b>Small groups (≤ ~500)</b>: fan-out on write — write the message once to the conversation, then enqueue delivery to each member's gateway/inbox.</li>
<li><b>Large groups / broadcast channels (10k–millions)</b>: fan-out on read — members poll/subscribe to the channel's message stream; don't write per-member state. Presence and read receipts are aggregated or dropped at that scale.</li>
</ul>

<h2>Presence</h2>
<pre><code>online:  SET presence:{user} "online" EX 40      -- refreshed by heartbeat
offline: key expires (no heartbeat for 40s) → a sweeper or lazy check marks offline
fan-out: on a transition, notify only this user's contacts who currently have the chat open</code></pre>
<p>Presence is best-effort — a few seconds of staleness is acceptable and far cheaper than making it strongly consistent.</p>

<h2>Ordering &amp; consistency</h2>
<p>Per-conversation total order via the sequence number (assigned by a single writer per conversation, or a per-partition counter). Across conversations, no global order needed. Messages are effectively immutable; edits/deletes are new events (<code>tombstone</code> / <code>edited_body</code>) the client applies.</p>

<h2>Extras</h2>
<table>
<tr><th>Feature</th><th>Approach</th></tr>
<tr><td>End-to-end encryption</td><td>client-side keys (Signal protocol / double ratchet); the server stores ciphertext and can't read it — changes how search/backup work</td></tr>
<tr><td>Typing indicators</td><td>ephemeral gateway-to-gateway events, never persisted</td></tr>
<tr><td>Multi-device</td><td>message fan-out per device; per-device read state; a sync protocol on reconnect</td></tr>
<tr><td>Search</td><td>async index to Elasticsearch (server-side); for E2EE, on-device only</td></tr>
</table>`,
      pitfalls: [
        "Stateless HTTP polling for real-time chat — latency and load; use persistent connections.",
        "No per-conversation sequence numbers — clients can't detect or recover missing messages.",
        "Trying to make presence strongly consistent — expensive and unnecessary.",
        "Fan-out-on-write for a 1 M-member channel.",
        "Losing messages when a gateway crashes — persist before acking, and keep an undelivered queue.",
        "No client_msg_id ⇒ network retries create duplicate messages.",
      ],
      interviewQs: [
        "How does a message get from sender to an offline recipient?",
        "How do you guarantee per-conversation ordering and detect gaps?",
        "How does presence work, and why is eventual consistency OK there?",
        "How do small groups vs large channels differ in your design?",
        "What changes if messages must be end-to-end encrypted?",
        "How do you handle a chat gateway server crashing?",
      ],
    },
  ],
});
