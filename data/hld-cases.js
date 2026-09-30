/* System Design Case Studies — worked designs beyond the classics in hld.js. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
(function () {
  // Every case follows the same interview structure so you can practise the rhythm.
  const card = (o) => `
<h2>1 · Requirements</h2>${o.req}
<h2>2 · Estimates</h2>${o.est}
<h2>3 · API</h2><pre><code>${o.api}</code></pre>
<h2>4 · High-level design</h2><pre><code>${o.hld}</code></pre>${o.hldNotes || ""}
<h2>5 · Data model</h2>${o.data}
<h2>6 · Deep dives</h2>${o.deep}
<h2>7 · Bottlenecks, failure modes & trade-offs</h2>${o.tradeoffs}`;

  window.STUDY_SECTIONS.push({
    id: "hld-cases",
    title: "System Design Case Studies",
    icon: "🏛️",
    blurb: "Fifteen fully worked designs in interview order — requirements, estimates, API, architecture, data model, deep dives and trade-offs — plus the numbers cheat sheet.",
    topics: [
      {
        id: "sd-numbers",
        title: "Estimation Cheat Sheet: Latency Numbers & Back-of-Envelope Math",
        summary: "The numbers and shortcuts to size any system in two minutes: latencies, throughput per machine, storage math and QPS conversions.",
        tags: ["estimation", "must-know"],
        brushup: [
          "1 day ≈ 86,400 s ≈ <b>10⁵ s</b>; 1 M requests/day ≈ <b>12 QPS</b>; 100 M/day ≈ 1,200 QPS; peak ≈ 2–3× average.",
          "L1 cache 1 ns · RAM 100 ns · SSD random read ~100 µs · same-datacenter round trip ~0.5 ms · disk seek ~10 ms · cross-continent ~100–150 ms.",
          "Read 1 MB: RAM ~10 µs, SSD ~0.2–1 ms, network 1 Gbps ~10 ms, HDD ~5–20 ms.",
          "Rough capacity per node: web/app server 1–10k simple req/s; Postgres ~5–20k simple queries/s; Redis ~100k ops/s; Kafka broker ~100s MB/s.",
          "Storage = objects/day × size × retention × replication (×3); round aggressively.",
          "Bandwidth = QPS × payload; 1 Gbps ≈ 125 MB/s.",
          "Powers of two: 2¹⁰ ≈ 1 thousand (KB), 2²⁰ ≈ 1 million (MB), 2³⁰ ≈ 1 billion (GB), 2⁴⁰ ≈ 1 trillion (TB).",
          "State the assumptions out loud; the interviewer cares about reasoning, not precision.",
        ],
        detail: `
<h2>Latency numbers (order of magnitude)</h2>
<table>
<tr><th>Operation</th><th>Time</th></tr>
<tr><td>L1 cache reference</td><td>~1 ns</td></tr>
<tr><td>Branch mispredict</td><td>~3 ns</td></tr>
<tr><td>L2 cache reference</td><td>~4 ns</td></tr>
<tr><td>Mutex lock/unlock</td><td>~17 ns</td></tr>
<tr><td>Main memory reference</td><td>~100 ns</td></tr>
<tr><td>Compress 1 KB (fast codec)</td><td>~2 µs</td></tr>
<tr><td>Read 1 MB sequentially from memory</td><td>~3–10 µs</td></tr>
<tr><td>SSD random read (4 KB)</td><td>~16–100 µs</td></tr>
<tr><td>Round trip within same datacenter</td><td>~0.5 ms</td></tr>
<tr><td>Read 1 MB sequentially from SSD</td><td>~50–200 µs</td></tr>
<tr><td>HDD seek</td><td>~2–10 ms</td></tr>
<tr><td>Packet California → Netherlands → California</td><td>~150 ms</td></tr>
</table>

<h2>Worked example: photo-sharing app</h2>
<pre><code>Assume 100 M DAU, each views 50 photos/day and uploads 0.2 photos/day.
Reads:  100M × 50 / 10⁵ s        ≈ 50,000 QPS avg → ~150k peak   (mostly served by CDN)
Writes: 100M × 0.2 / 10⁵         ≈ 200 uploads/s
Storage: 20 M photos/day × 2 MB   = 40 TB/day → ×365 ≈ 15 PB/year (+ thumbnails, ×replication in object storage)
Metadata: 20 M rows/day × 500 B   = 10 GB/day → 3.6 TB/year → needs sharding over years
Bandwidth egress: 150k/s × 200 KB (thumbnail) ≈ 30 GB/s at peak → CDN mandatory</code></pre>

<h2>Availability quick table</h2>
<table>
<tr><th>SLO</th><th>Downtime/year</th><th>Downtime/month</th></tr>
<tr><td>99%</td><td>3.65 days</td><td>7.2 h</td></tr>
<tr><td>99.9%</td><td>8.8 h</td><td>43 min</td></tr>
<tr><td>99.99%</td><td>52.6 min</td><td>4.3 min</td></tr>
<tr><td>99.999%</td><td>5.3 min</td><td>26 s</td></tr>
</table>`,
        pitfalls: [
          "Spending 10 minutes on precise arithmetic.",
          "Forgetting peak vs average, replication factor, or metadata vs blob storage.",
          "Not using the estimates to drive design decisions (e.g. 'this needs sharding').",
        ],
        interviewQs: [
          "Estimate the storage needed for a year of tweets.",
          "How many servers do you need for 100k QPS?",
          "Estimate the bandwidth for a video streaming service.",
          "What's the latency of reading from memory vs SSD vs network?",
        ],
        resources: [
          { t: "Latency numbers every programmer should know", u: "https://gist.github.com/jboner/2841832", k: "article" },
          { t: "Interactive latency numbers", u: "https://colin-scott.github.io/personal_website/research/interactive_latency.html", k: "tool" },
          { t: "ByteByteGo — Back-of-the-envelope estimation", u: "https://bytebytego.com/courses/system-design-interview/back-of-the-envelope-estimation", k: "course" },
        ],
      },
      {
        id: "sd-rate-limiter",
        title: "Design a Distributed Rate Limiter",
        summary: "Limit requests per user/API key across a fleet of servers with low latency — algorithms, Redis-based counters, placement and failure behaviour.",
        tags: ["rate-limiting", "redis"],
        brushup: [
          "Place it at the <b>API gateway</b>/edge (or a sidecar) so every request passes through once.",
          "Algorithms: token bucket (bursts allowed), leaky bucket (smooth output), fixed window (simple, edge bursts), sliding log (exact, memory-heavy), <b>sliding window counter</b> (good approximation).",
          "Shared state in <b>Redis</b> with atomic Lua scripts; key = limiter:{client}:{window}.",
          "Return <b>429</b> with Retry-After and X-RateLimit-Remaining headers.",
          "Rules config: per tier, per endpoint, per IP; hot-reloadable.",
          "Low latency: local in-memory pre-check / token leasing to cut Redis round trips.",
          "Failure mode decision: <b>fail open</b> (availability) vs fail closed (protection) when Redis is down.",
          "Multi-region: per-region limits or async global sync — exact global limits cost latency.",
        ],
        detail: card({
          req: `<ul><li>Limit by user ID / API key / IP with configurable rules (e.g. 100 req/min, burst 20).</li><li>Distributed across hundreds of API servers; accuracy within a few %.</li><li>Added latency &lt; 1–2 ms; highly available.</li><li>Out of scope: billing quotas across months.</li></ul>`,
          est: `<p>1 M active clients, 50k QPS total. Redis keys: ~1 M × ~100 B = 100 MB — fits one Redis shard; 50k Lua calls/s → a small Redis cluster.</p>`,
          api: `allow(clientId, route) → {allowed: bool, remaining: int, resetAt: ts}
HTTP: 429 Too Many Requests, Retry-After: 12, X-RateLimit-Limit: 100, X-RateLimit-Remaining: 0`,
          hld: `client → LB → API gateway [rate-limit middleware] → services
                         │  (Lua script, 1 RTT)
                         ▼
                   Redis cluster (sharded by client key)
rules service → config store → pushed/cached in gateways`,
          data: `<p>Token bucket per key: hash {tokens, last_refill_ts} with TTL. Sliding window counter: two counters (current and previous window) per key.</p>`,
          deep: `<h3>Sliding window counter</h3><pre><code>count ≈ curr_window_count + prev_window_count × (1 − elapsed_in_curr / window)</code></pre><p>O(1) memory, smooths the fixed-window boundary burst; error is small in practice.</p>
<h3>Race conditions</h3><p>Read-then-write from app servers races; do check-and-decrement atomically in a Lua script (or INCR + EXPIRE semantics).</p>
<h3>Reducing Redis load</h3><p>Each gateway leases batches of tokens (e.g. 10) from Redis and serves locally; slight over-admission, big latency and load savings.</p>`,
          tradeoffs: `<ul><li>Fail open keeps the product up if Redis dies but removes protection — often combined with coarse local limits as a backstop.</li><li>Exact global limits across regions need synchronous coordination; most systems accept per-region limits.</li><li>Hot keys (one huge customer) → shard their counter or give dedicated limits.</li></ul>`,
        }),
        pitfalls: ["Non-atomic read-modify-write on counters.", "Rate limiting inside each service separately (inconsistent).", "No headers telling clients when to retry."],
        interviewQs: ["Compare token bucket and sliding window.", "Where would you put the rate limiter?", "What happens if Redis goes down?", "How do you rate limit across regions?"],
        resources: [
          { t: "Stripe — Scaling your API with rate limiters", u: "https://stripe.com/blog/rate-limiters", k: "blog" },
          { t: "Cloudflare — How we built rate limiting capable of scaling to millions of domains", u: "https://blog.cloudflare.com/counting-things-a-lot-of-different-things/", k: "blog" },
        ],
      },
      {
        id: "sd-notification",
        title: "Design a Notification System (Push, SMS, Email)",
        summary: "A multi-channel notification platform with templates, user preferences, reliable delivery, retries, deduplication and rate limits.",
        tags: ["notifications", "queues"],
        brushup: [
          "Producers call a <b>notification service</b> API with (user, template, data, channels, priority).",
          "Service checks <b>preferences</b>/opt-outs, quiet hours, frequency caps; renders templates; enqueues per channel.",
          "<b>Per-channel queues</b> + workers → providers (APNs/FCM, Twilio, SES/SendGrid).",
          "Reliability: at-least-once queues, retries with exponential backoff, <b>dead-letter queue</b>, provider failover.",
          "<b>Idempotency</b>: dedupe key per notification to avoid double sends on retries.",
          "Priorities: separate queues so OTPs aren't stuck behind marketing blasts.",
          "Track status (sent, delivered, opened, bounced) via provider callbacks/webhooks.",
          "Bulk campaigns: fan-out jobs with throttling to respect provider limits.",
        ],
        detail: card({
          req: `<ul><li>Channels: mobile push, SMS, email, in-app. Transactional (OTP, order shipped) and marketing.</li><li>Respect user preferences and unsubscribes; no duplicates; OTP latency &lt; seconds.</li><li>Scale: 10 M notifications/day, campaign spikes of 1 M in minutes.</li></ul>`,
          est: `<p>10 M/day ≈ 115/s average; campaign spikes 1 M in 10 min ≈ 1,700/s → queue buffers and provider rate limits dominate.</p>`,
          api: `POST /v1/notifications
{ "idempotency_key": "order-9001-shipped", "user_id": 42, "template": "order_shipped",
  "data": {"order_id": 9001}, "channels": ["push","email"], "priority": "high" }`,
          hld: `services ─► Notification API ─► validate, dedupe (idempotency store), preferences + rate caps
                                   │
                         render template (i18n)
                   ┌──────────┼───────────┬───────────┐
               push queue  sms queue  email queue  in-app (WebSocket/inbox table)
                   │          │           │
               workers ─► APNs/FCM   Twilio/SNS   SES/SendGrid   (retries, DLQ, provider failover)
provider webhooks ─► status updates ─► analytics (Kafka → warehouse)`,
          data: `<p><b>notifications</b>(id, user_id, template, channel, status, created_at, idempotency_key UNIQUE); <b>preferences</b>(user_id, channel, category, enabled, quiet_hours); <b>device_tokens</b>(user_id, platform, token, last_seen).</p>`,
          deep: `<h3>Exactly-once-ish delivery</h3><p>At-least-once queues + an idempotency record per (notification, channel) checked before calling the provider; providers may still duplicate rarely — accept for push/email.</p>
<h3>Priority isolation</h3><p>High-priority queue with reserved workers; marketing throttled per provider limits and per user frequency caps.</p>
<h3>Token hygiene</h3><p>Remove device tokens that providers report invalid; respect platform rules.</p>`,
          tradeoffs: `<ul><li>Synchronous send (simple, slow, fragile) vs queued (resilient, eventual).</li><li>Build vs buy (OneSignal, Braze) for campaigns.</li><li>Stale preferences cache could send to someone who opted out — keep TTL short or check the source for marketing.</li></ul>`,
        }),
        pitfalls: ["One shared queue for OTPs and campaigns.", "Retrying without idempotency → duplicate SMS charges.", "Ignoring provider rate limits and getting throttled/banned."],
        interviewQs: ["Design a notification system.", "How do you avoid sending duplicates?", "How do you prioritize OTPs over marketing?", "How do you handle provider outages?"],
        resources: [
          { t: "Uber — Scaling push notifications (RAMEN)", u: "https://www.uber.com/blog/real-time-push-platform/", k: "blog" },
          { t: "ByteByteGo — Design a notification system", u: "https://bytebytego.com/courses/system-design-interview/design-a-notification-system", k: "course" },
        ],
      },
      {
        id: "sd-payment",
        title: "Design a Payment System",
        summary: "Moving money correctly: idempotent payment APIs, a double-entry ledger, PSP integration, state machines, reconciliation and exactly-once effects.",
        tags: ["payments", "consistency", "idempotency"],
        brushup: [
          "Correctness over latency: <b>strong consistency</b>, ACID relational DB, auditability.",
          "<b>Idempotency keys</b> on every payment request end to end (client → service → PSP).",
          "Payment <b>state machine</b>: CREATED → AUTHORIZED → CAPTURED → SETTLED / FAILED / REFUNDED.",
          "<b>Double-entry ledger</b>: every movement = balanced debit + credit entries; immutable, append-only; balances derived.",
          "PSP (Stripe/Adyen) handles cards; store tokens, never raw PANs (PCI scope).",
          "Timeouts are ambiguous → never blindly retry charges; query PSP status or use its idempotency.",
          "<b>Reconciliation</b>: daily compare internal ledger with PSP settlement reports; alert on mismatches.",
          "Async events via outbox (payment succeeded → order service), webhooks from PSP verified and deduplicated.",
        ],
        detail: card({
          req: `<ul><li>Customers pay for orders by card/wallet; refunds; payouts to sellers.</li><li>No double charges, no lost money, full audit trail; 99.99% availability for checkout.</li><li>Scale: 1 M payments/day (~12/s avg, peaks 100s/s).</li></ul>`,
          est: `<p>Low QPS but extremely high correctness requirements; storage small (KBs per payment + ledger rows).</p>`,
          api: `POST /v1/payments   Idempotency-Key: 7b1c...
{ "order_id": 9001, "amount": 49900, "currency": "INR", "payment_method_token": "pm_abc" }
→ 201 {"payment_id": "pay_123", "status": "AUTHORIZED"}
POST /v1/payments/pay_123/refunds {"amount": 10000}   Idempotency-Key: ...
PSP webhook → POST /v1/psp/events (signature verified, deduped by event id)`,
          hld: `checkout ─► Payment Service ─► idempotency table (same DB txn)
                   │         ─► payments table (state machine) ─► outbox ─► Kafka ─► order/notification services
                   │         ─► ledger (double-entry, append-only)
                   └─► PSP adapter (retries, circuit breaker, timeouts) ─► Stripe/Adyen
PSP webhooks ─► webhook handler ─► state transitions
nightly: reconciliation job ─► compare ledger vs PSP settlement files ─► discrepancies queue`,
          data: `<pre><code>payments(id, order_id, amount, currency, status, psp_ref, idempotency_key UNIQUE, version, created_at)
ledger_entries(id, txn_id, account_id, direction DEBIT|CREDIT, amount, currency, created_at)   -- sum(debits) = sum(credits) per txn
accounts(id, type: customer|merchant|platform_fees|psp_clearing, currency)</code></pre>`,
          deep: `<h3>Handling a PSP timeout</h3><ol><li>Payment stays in PENDING with the PSP request id.</li><li>Retry the PSP call with the <b>same PSP idempotency key</b> (safe), or poll PSP status.</li><li>Webhooks eventually confirm; the state machine only allows valid transitions (optimistic locking on version).</li></ol>
<h3>Ledger example</h3><pre><code>Customer pays 499: DEBIT customer_receivable 499 / CREDIT merchant_payable 474 / CREDIT platform_fees 25</code></pre>`,
          tradeoffs: `<ul><li>Synchronous authorization in checkout vs async capture later.</li><li>Relational DB for payments + ledger (consistency) vs NoSQL (scale not needed here).</li><li>Exactly-once is achieved via idempotency + reconciliation, not by the network.</li></ul>`,
        }),
        pitfalls: ["Retrying a charge after a timeout without idempotency.", "Mutable balance columns without a ledger.", "Floating-point money — use integer minor units."],
        interviewQs: ["Design a payment system.", "How do you guarantee no double charge?", "What is a double-entry ledger and why use it?", "How does reconciliation work?", "How do you handle PSP webhooks reliably?"],
        resources: [
          { t: "Stripe — Idempotency", u: "https://stripe.com/blog/idempotency", k: "blog" },
          { t: "Airbnb — Avoiding double payments in a distributed payments system", u: "https://medium.com/airbnb-engineering/avoiding-double-payments-in-a-distributed-payments-system-2981f6b070bb", k: "blog" },
          { t: "Modern Treasury — Accounting for developers", u: "https://www.moderntreasury.com/journal/accounting-for-developers-part-i", k: "article" },
        ],
      },
      {
        id: "sd-video",
        title: "Design a Video Streaming Platform (YouTube/Netflix)",
        summary: "Uploading, transcoding and streaming video globally — resumable uploads, a transcoding DAG, adaptive bitrate streaming and CDN delivery.",
        tags: ["video", "cdn", "storage"],
        brushup: [
          "Upload: <b>resumable, chunked</b> uploads directly to object storage via presigned URLs.",
          "Processing pipeline (DAG): validate → extract metadata → <b>transcode</b> into many resolutions/bitrates/codecs → thumbnails → captions → content checks.",
          "<b>Adaptive bitrate streaming</b> (HLS/DASH): video split into 2–10 s segments at multiple bitrates; the player switches based on bandwidth.",
          "Delivery via <b>CDN</b>; popular content cached at the edge; Netflix-style appliances inside ISPs (Open Connect).",
          "Metadata DB (titles, owners, visibility) separate from blob storage; search index; view counters aggregated asynchronously.",
          "Cost is dominated by storage + egress + transcoding compute → tiered storage, per-title encoding, transcode popular videos to more formats.",
          "Resume playback: store position per (user, video) periodically.",
        ],
        detail: card({
          req: `<ul><li>Upload videos (up to GBs), watch with low startup time and minimal buffering on any network.</li><li>Scale: 500 hours uploaded/minute; billions of views/day.</li></ul>`,
          est: `<p>500 h/min ≈ 720k hours/day uploaded. At ~1 GB/hour source + ~3× for renditions → ~2 PB/day storage growth. Egress: 1 B views × 50 MB ≈ 50 PB/day → CDN is the system.</p>`,
          api: `POST /v1/uploads → {upload_id, presigned part URLs}
PUT  <presigned-url-part-n>   (client → object storage directly)
POST /v1/uploads/{id}/complete → video_id (status: PROCESSING)
GET  /v1/videos/{id} → metadata + manifest URL (master.m3u8 on CDN)
POST /v1/videos/{id}/progress {position_s}`,
          hld: `client ─(presigned multipart)─► object storage (raw)
                    └─► upload complete event ─► Kafka ─► processing orchestrator (DAG)
                          ├─► transcoding workers (GPU/CPU pool, per segment in parallel) ─► object storage (renditions + manifests)
                          ├─► thumbnails, captions, moderation
                          └─► metadata DB (status READY) + search indexer
viewer ─► API (metadata, auth, DRM license) ─► player fetches manifest + segments from CDN edge ─► origin shield ─► storage`,
          data: `<p>videos(id, owner_id, title, status, duration, visibility, created_at); renditions(video_id, resolution, bitrate, codec, manifest_path); watch_progress(user_id, video_id, position, updated_at) in a key-value store.</p>`,
          deep: `<h3>Parallel transcoding</h3><p>Split the source into GOP-aligned chunks, transcode chunks in parallel, then stitch → minutes instead of hours for long videos.</p>
<h3>ABR ladder</h3><pre><code>240p 400 kbps · 480p 1 Mbps · 720p 3 Mbps · 1080p 6 Mbps · 4K 16 Mbps  (H.264 / VP9 / AV1)</code></pre>
<h3>View counts</h3><p>Stream view events into Kafka, aggregate in Flink per minute, write to a counter store; approximate real-time counts, exact counts via batch.</p>`,
          tradeoffs: `<ul><li>Transcode everything eagerly (storage cost) vs on-demand for long-tail videos.</li><li>Own CDN (Netflix) vs commercial CDNs.</li><li>DRM adds license servers and complexity for premium content.</li></ul>`,
        }),
        pitfalls: ["Uploading through application servers instead of directly to storage.", "Single-bitrate video.", "Synchronous processing in the upload request."],
        interviewQs: ["Design YouTube.", "How does adaptive bitrate streaming work?", "How would you speed up transcoding?", "How do you handle a viral video?"],
        resources: [
          { t: "Netflix Tech Blog — encoding & Open Connect", u: "https://netflixtechblog.com/", k: "blog" },
          { t: "Apple — HTTP Live Streaming overview", u: "https://developer.apple.com/streaming/", k: "docs" },
        ],
      },
      {
        id: "sd-ridesharing",
        title: "Design a Ride-Sharing Service (Uber/Lyft)",
        summary: "Matching riders to nearby drivers in real time — location ingestion, geospatial indexing, dispatch, trip state and surge pricing.",
        tags: ["geospatial", "real-time"],
        brushup: [
          "Drivers send location every ~4 s → high write volume of ephemeral data → in-memory geospatial index, not a relational DB.",
          "Geo indexing: <b>geohash</b>, <b>quadtree</b>, or <b>H3</b> hexagons; query nearby cells for candidates.",
          "Dispatch/matching service: find available drivers near pickup, rank by ETA, offer to one (or a few) with timeouts.",
          "Prevent double assignment: atomic driver state change (compare-and-set / lock with TTL).",
          "Trip lifecycle as a state machine persisted durably; payments via the payment system.",
          "Real-time updates to apps via <b>WebSockets</b>/push; ETAs from a routing service over a road graph.",
          "Partition by city/region (cells) for scale and blast-radius isolation.",
          "Surge pricing from supply/demand per geo cell computed in streaming.",
        ],
        detail: card({
          req: `<ul><li>Riders request rides; nearby drivers get offers; live tracking; fare estimates; payments; ratings.</li><li>Scale: 5 M active drivers, location every 4 s → 1.25 M writes/s globally; match within seconds.</li></ul>`,
          est: `<p>Location update ~100 B → 125 MB/s ingest. Only the latest location matters for matching; history goes to cold storage for analytics.</p>`,
          api: `WS /v1/driver/stream   ← {lat, lng, heading, ts} every 4 s; → ride offers
POST /v1/rides {pickup, dropoff, product} → ride_id (status: MATCHING)
POST /v1/rides/{id}/accept (driver)   GET /v1/rides/{id} (live state)`,
          hld: `driver app ─WS─► gateway ─► location service ─► geo index (Redis GEO / in-memory H3 cells, sharded by city)
                                            └─► Kafka (history, analytics, surge)
rider ─► ride service (state machine, DB) ─► dispatch service ─► query geo index ─► ETA service (routing graph)
                                         └─► offer to best driver via WS/push; timeout → next driver
surge service (Flink: demand/supply per cell) ─► pricing`,
          data: `<p>Ephemeral: driver_location(driver_id → cell, lat, lng, status, ts) in memory/Redis. Durable: rides(id, rider_id, driver_id, status, pickup, dropoff, fare, timestamps) in a sharded SQL/NewSQL DB.</p>`,
          deep: `<h3>Geo query</h3><pre><code>cell = h3.latlng_to_cell(lat, lng, res=8)
candidates = drivers_in(k_ring(cell, 1)) filter status=AVAILABLE → rank by ETA</code></pre>
<h3>Atomic assignment</h3><pre><code>SET driver:77:lock ride:123 NX PX 15000   -- only one ride can hold the driver during the offer window</code></pre>`,
          tradeoffs: `<ul><li>Greedy nearest-driver vs batched global matching (better overall ETAs, slight delay).</li><li>Consistency of location data is relaxed (seconds stale is fine); trips and payments are strongly consistent.</li></ul>`,
        }),
        pitfalls: ["Storing every location update in a relational DB.", "No lock on driver assignment.", "One global cluster instead of region cells."],
        interviewQs: ["Design Uber.", "How do you find nearby drivers efficiently?", "Geohash vs quadtree vs H3?", "How do you prevent two riders getting the same driver?"],
        resources: [
          { t: "Uber — H3 hexagonal hierarchical spatial index", u: "https://www.uber.com/blog/h3/", k: "blog" },
          { t: "Hello Interview — Design Uber", u: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber", k: "article" },
        ],
      },
      {
        id: "sd-dropbox",
        title: "Design Cloud File Storage & Sync (Dropbox/Google Drive)",
        summary: "Storing and syncing files across devices — chunking, content-addressed dedup, metadata service, sync protocol, conflicts and sharing.",
        tags: ["storage", "sync"],
        brushup: [
          "Split files into <b>chunks</b> (~4 MB); address each by its hash → <b>deduplication</b> and resumable/delta uploads.",
          "Separate <b>metadata</b> (files, versions, chunk lists, sharing) in a strongly consistent DB from <b>blob storage</b> (chunks in object storage).",
          "Sync: clients keep a local journal; server keeps a per-namespace <b>change log</b> with cursors; clients long-poll/WebSocket for changes then fetch deltas.",
          "Upload flow: client asks which chunk hashes are missing → uploads only those → commits a new file version atomically.",
          "Conflicts: concurrent edits → keep both ('conflicted copy') or last-writer-wins for metadata.",
          "Sharing & permissions on folders (ACLs), links with tokens.",
          "Scale metadata by sharding on namespace/user; hot shared folders need care.",
        ],
        detail: card({
          req: `<ul><li>Upload/download, automatic sync across devices, version history, sharing.</li><li>500 M users, 100 PB stored, files up to 50 GB.</li></ul>`,
          est: `<p>Dedup saves 30–50% for common files. Metadata rows ~ files × versions: billions → sharded DB.</p>`,
          api: `POST /v1/files/prepare {path, size, chunk_hashes[]} → {missing_hashes[], upload_urls[]}
PUT  <chunk url>  (direct to storage)
POST /v1/files/commit {path, chunk_hashes[], base_version} → {version} | 409 conflict
GET  /v1/changes?cursor=... (long poll) → [changes], new_cursor`,
          hld: `client (watcher + chunker + local DB)
   ├─► metadata service ─► sharded SQL (files, versions, chunks, namespaces, ACLs) + change log per namespace
   ├─► block service / presigned URLs ─► object storage (content-addressed chunks)
   └─► notification service (long poll/WebSocket) ◄── change log events`,
          data: `<pre><code>files(namespace_id, file_id, path, latest_version, deleted)
file_versions(file_id, version, chunk_hashes[], size, modified_by, ts)
chunks(hash PK, size, storage_key, refcount)
changes(namespace_id, seq, file_id, op)      -- cursor = seq</code></pre>`,
          deep: `<h3>Delta sync</h3><p>Only changed chunks are uploaded; content-defined chunking (rolling hash) keeps chunk boundaries stable when bytes are inserted in the middle of a file.</p>
<h3>Consistency</h3><p>Commit is a metadata transaction: new version only visible after all chunks exist. Garbage collect chunks whose refcount drops to zero after retention.</p>`,
          tradeoffs: `<ul><li>Fixed-size vs content-defined chunking.</li><li>Client-side encryption breaks server dedup.</li><li>Strong metadata consistency limits write scalability per namespace.</li></ul>`,
        }),
        pitfalls: ["Uploading whole files on every change.", "Storing blobs in the metadata database.", "Making partially uploaded versions visible."],
        interviewQs: ["Design Dropbox.", "How does deduplication work?", "How do clients learn about changes?", "How do you handle edit conflicts?"],
        resources: [
          { t: "Dropbox Tech — Rewriting the heart of our sync engine", u: "https://dropbox.tech/infrastructure/rewriting-the-heart-of-our-sync-engine", k: "blog" },
          { t: "Dropbox Tech — Magic Pocket (exabyte storage)", u: "https://dropbox.tech/infrastructure/inside-the-magic-pocket", k: "blog" },
        ],
      },
      {
        id: "sd-crawler",
        title: "Design a Web Crawler",
        summary: "Crawling billions of pages politely and efficiently — URL frontier, politeness, deduplication, parsing, storage and recrawl scheduling.",
        tags: ["crawler", "distributed"],
        brushup: [
          "Components: seed URLs → <b>URL frontier</b> (prioritized, per-host queues) → fetchers → parsers/link extractors → dedup → storage → back to frontier.",
          "<b>Politeness</b>: robots.txt, per-host rate limits (one connection per host), crawl-delay.",
          "Dedup URLs with normalization + a <b>Bloom filter</b>/key-value store of seen URLs; dedup content with hashes/SimHash for near-duplicates.",
          "DNS caching (resolution is a bottleneck at scale).",
          "Traps: infinite calendars, session IDs in URLs → depth limits, URL pattern limits.",
          "Distribute by hashing hostnames to crawler nodes (keeps politeness local).",
          "Recrawl priority by page importance and change frequency.",
        ],
        detail: card({
          req: `<ul><li>Crawl 1 B pages/month, store HTML for indexing; respect robots.txt; handle failures.</li></ul>`,
          est: `<p>1 B / (30 × 10⁵ s) ≈ 400 pages/s; 100 KB each → 40 MB/s, 100 TB/month raw (compress ~5×).</p>`,
          api: `internal: enqueue(url, priority) · fetch(url) → content · store(url, content, headers)`,
          hld: `seed ─► URL frontier (priority queues → per-host FIFO queues, host → node by hash)
          ─► fetcher pool (async HTTP, DNS cache, robots cache) ─► content store (object storage) + crawl DB
          ─► parser ─► link extractor ─► URL normalizer ─► seen-URL filter (Bloom + KV) ─► frontier
          ─► content dedup (SimHash) · indexer consumers (Kafka)`,
          data: `<p>crawl_state(url_hash, url, last_crawled, status, content_hash, next_crawl_at); robots cache per host with TTL.</p>`,
          deep: `<h3>Frontier design (Mercator)</h3><p>Front queues order by priority; back queues are one per host with a heap of next-allowed-fetch times → the fetcher always takes a host that's allowed to be hit now.</p>`,
          tradeoffs: `<ul><li>BFS breadth vs priority by PageRank-like importance.</li><li>Headless browsers for JS-heavy sites are 10–100× more expensive.</li></ul>`,
        }),
        pitfalls: ["Hammering a single host.", "No URL normalization → infinite duplicates.", "Ignoring robots.txt."],
        interviewQs: ["Design a web crawler.", "How do you ensure politeness?", "How do you detect duplicate content?", "How do you avoid crawler traps?"],
        resources: [
          { t: "Mercator: A scalable, extensible web crawler (paper)", u: "https://www.cs.cornell.edu/courses/cs685/2002fa/mercator.pdf", k: "paper" },
        ],
      },
      {
        id: "sd-typeahead",
        title: "Design Search Autocomplete / Typeahead",
        summary: "Returning the top suggestions for every keystroke in tens of milliseconds — tries with precomputed top-K, offline aggregation and caching.",
        tags: ["search", "trie", "caching"],
        brushup: [
          "Latency budget ~50–100 ms per keystroke; client debounces (~100–200 ms) and caches.",
          "Data: query logs aggregated (counts, recency) offline/streaming → top-K per prefix.",
          "Serving structure: <b>trie</b> with top-K suggestions cached at each node, or a prefix → top-K key-value table.",
          "Rebuild periodically (hourly/daily) and hot-swap; trending via a streaming layer.",
          "Shard by prefix (first chars) with care for skew; replicate for read throughput.",
          "Filter offensive content; personalize by blending global with user history.",
          "Browser/CDN caching of popular prefixes.",
        ],
        detail: card({
          req: `<ul><li>Top 5–10 suggestions per prefix, ranked by popularity and freshness; &lt; 100 ms p99.</li><li>10 M DAU × 10 searches × ~6 keystrokes ≈ 600 M requests/day ≈ 7k QPS avg, 20k peak.</li></ul>`,
          est: `<p>Distinct prefixes of popular queries: tens of millions × 10 suggestions × ~50 B ≈ tens of GB → fits in memory across a few shards.</p>`,
          api: `GET /v1/suggest?q=kaf&amp;locale=en → ["kafka", "kafka streams", "kafka vs rabbitmq", ...]`,
          hld: `query logs ─► Kafka ─► aggregation (Spark daily + Flink trending) ─► top-K per prefix builder ─► snapshot
                                                                                    │ load & swap
client (debounce, local cache) ─► CDN/edge cache ─► suggest service (in-memory trie / prefix table, sharded + replicated)`,
          data: `<p>prefix_topk(prefix → [(query, score)]) in memory; source counts in the warehouse.</p>`,
          deep: `<h3>Why precompute top-K</h3><p>Walking a subtree at request time is too slow for short prefixes ("a" has millions of completions); storing top-K at each node makes lookup O(prefix length).</p>`,
          tradeoffs: `<ul><li>Freshness vs build cost: daily batch + small real-time trending overlay.</li><li>Personalization increases cache misses.</li></ul>`,
        }),
        pitfalls: ["Computing suggestions from raw logs at request time.", "No debouncing → 3× unnecessary traffic.", "Unfiltered suggestions (offensive/legal risk)."],
        interviewQs: ["Design Google autocomplete.", "Why store top-K at each trie node?", "How do you add trending queries?", "How would you shard the trie?"],
        resources: [
          { t: "ByteByteGo — Design a search autocomplete system", u: "https://bytebytego.com/courses/system-design-interview/design-a-search-autocomplete-system", k: "course" },
        ],
      },
      {
        id: "sd-kv-store",
        title: "Design a Distributed Key-Value Store (Dynamo-style)",
        summary: "Putting partitioning, replication, quorums, failure detection and repair together into a highly available key-value database.",
        tags: ["dynamo", "storage", "must-know"],
        brushup: [
          "API: get(key), put(key, value); values small (&lt; 1 MB).",
          "<b>Consistent hashing</b> with virtual nodes for partitioning; replicate to N successors (preference list).",
          "Tunable consistency: <b>N, R, W</b> quorums (e.g. 3, 2, 2).",
          "Availability under failure: <b>sloppy quorum</b> + <b>hinted handoff</b>.",
          "Conflicts: vector clocks + client/app resolution, or last-write-wins.",
          "Repair: read repair + <b>Merkle-tree anti-entropy</b>; membership & failure detection via <b>gossip</b>.",
          "Storage engine per node: commit log + memtable + SSTables (LSM) + Bloom filters.",
          "It's AP by default; CP variants use consensus per partition (e.g. Raft groups).",
        ],
        detail: card({
          req: `<ul><li>High availability for writes (shopping cart), low latency, horizontal scale to PBs, tunable consistency.</li></ul>`,
          est: `<p>1 M ops/s, 100 TB data, RF=3 → 300 TB raw; ~100 nodes with 3 TB each.</p>`,
          api: `put(key, value, context?) → ok        get(key) → [values] + context (vector clock)`,
          hld: `client ─► any node (coordinator via consistent hashing ring / client library routing)
coordinator ─► N replicas in parallel; success after W acks (writes) / R responses (reads)
each node: commit log → memtable → SSTables (compaction) · gossip · Merkle trees per range · hinted handoff store`,
          data: `<p>Key → (value, vector clock/timestamp, tombstone flag). Ranges owned per vnode.</p>`,
          deep: `<h3>Write path</h3><ol><li>Coordinator = first healthy node in preference list.</li><li>Sends to N replicas; if one is down, writes to the next node with a hint; returns after W acks.</li><li>Hints replayed when the node recovers.</li></ol>
<h3>Read path</h3><p>Query R replicas; if versions differ, return the newest (or siblings) and asynchronously repair stale replicas.</p>`,
          tradeoffs: `<ul><li>R + W &gt; N improves consistency at a latency/availability cost.</li><li>LWW is simple but loses concurrent writes.</li><li>Leaderless is great for availability; hard for transactions.</li></ul>`,
        }),
        pitfalls: ["Consistent hashing without vnodes.", "Tombstones never purged → read slowdown.", "Claiming strong consistency with sloppy quorums."],
        interviewQs: ["Design a key-value store like DynamoDB/Cassandra.", "Explain quorum reads/writes.", "How do replicas repair divergence?", "What is hinted handoff?"],
        resources: [
          { t: "Dynamo: Amazon's Highly Available Key-value Store", u: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf", k: "paper" },
          { t: "Cassandra architecture docs", u: "https://cassandra.apache.org/doc/latest/cassandra/architecture/index.html", k: "docs" },
        ],
      },
      {
        id: "sd-ticketing",
        title: "Design a Ticket Booking System (BookMyShow/Ticketmaster)",
        summary: "Selling limited seats under extreme contention without overselling — seat holds with TTL, strong consistency and virtual waiting rooms.",
        tags: ["booking", "concurrency"],
        brushup: [
          "Core invariant: <b>a seat is sold at most once</b> → strong consistency on seat inventory.",
          "Flow: browse → <b>hold</b> seats (TTL ~10 min) → pay → confirm; expired holds release automatically.",
          "Implement holds with conditional updates (UPDATE seats SET status='HELD' WHERE id IN … AND status='AVAILABLE') or Redis SET NX with TTL + DB confirmation.",
          "Hot events: <b>virtual waiting room</b> (queue users, admit at a controlled rate), rate limiting, bot protection.",
          "Read-heavy browsing (events, seat maps) cached; seat availability can be slightly stale in the UI but checked at hold time.",
          "Payments with idempotency; if payment fails or times out, release the hold.",
          "Shard by event_id.",
        ],
        detail: card({
          req: `<ul><li>Search events, view seat maps, reserve specific seats, pay, get tickets.</li><li>Flash sales: 1 M users for 50k seats in minutes; zero overselling.</li></ul>`,
          est: `<p>Browse traffic huge (cacheable); hold/confirm writes bounded by seats (50k) — contention, not volume, is the challenge.</p>`,
          api: `GET  /v1/events/{id}/seats → seat map (cached, short TTL)
POST /v1/events/{id}/holds {seat_ids} → {hold_id, expires_at} | 409 seats taken
POST /v1/holds/{hold_id}/checkout (Idempotency-Key) → payment → booking confirmed`,
          hld: `users ─► CDN (static) ─► waiting room (token admission) ─► API
API ─► inventory service ─► seats table (sharded by event, conditional updates) + hold expiry worker
    ─► booking service ─► payment service ─► booking confirmed ─► tickets (QR) + notifications`,
          data: `<pre><code>seats(event_id, seat_id, status AVAILABLE|HELD|SOLD, hold_id, hold_expires_at, version)
holds(hold_id, user_id, event_id, seat_ids[], expires_at, status)
bookings(id, hold_id, user_id, payment_id, status)</code></pre>`,
          deep: `<h3>Atomic hold</h3><pre><code>UPDATE seats SET status='HELD', hold_id=:h, hold_expires_at=now()+interval '10 min'
WHERE event_id=:e AND seat_id = ANY(:ids) AND (status='AVAILABLE' OR (status='HELD' AND hold_expires_at &lt; now()));
-- rows updated must equal len(ids), otherwise roll back → 409</code></pre>
<h3>Waiting room</h3><p>Users get a signed queue token; a controller admits N users/second based on backend capacity; the protected checkout path only accepts admitted tokens.</p>`,
          tradeoffs: `<ul><li>Pessimistic holds improve UX but seats may sit unpaid; tune TTL.</li><li>General admission can use counters instead of per-seat rows.</li></ul>`,
        }),
        pitfalls: ["Check-then-update races causing overselling.", "Holding seats forever when payment is abandoned.", "Letting a flash crowd hit the database directly."],
        interviewQs: ["Design BookMyShow/Ticketmaster.", "How do you prevent double booking?", "How do you handle 1 M users for 50k seats?", "Pessimistic vs optimistic locking here?"],
        resources: [
          { t: "Hello Interview — Design Ticketmaster", u: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster", k: "article" },
          { t: "Cloudflare — Waiting Room", u: "https://blog.cloudflare.com/cloudflare-waiting-room/", k: "blog" },
        ],
      },
      {
        id: "sd-job-scheduler",
        title: "Design a Distributed Job Scheduler",
        summary: "Running millions of scheduled and delayed jobs reliably — storage, time-bucketed polling, leasing, retries and exactly-once-ish execution.",
        tags: ["scheduler", "queues"],
        brushup: [
          "Jobs: one-off delayed (run at T) and recurring (cron); payload + handler + retry policy.",
          "Store jobs in a DB indexed by next_run_at; <b>schedulers</b> poll due jobs in small time buckets and enqueue them.",
          "Avoid double scheduling: partition jobs across scheduler instances (hash ranges) or claim with <code>SELECT … FOR UPDATE SKIP LOCKED</code>.",
          "Workers pull from a queue with <b>visibility timeout/lease</b>; heartbeat long jobs; ack on success.",
          "Retries with backoff, max attempts, dead-letter; handlers must be <b>idempotent</b>.",
          "Observability: lag between scheduled and actual start, failures, stuck jobs.",
          "Alternatives: Kafka + delay topics, Redis sorted sets (ZADD by timestamp), Temporal/Quartz.",
        ],
        detail: card({
          req: `<ul><li>Schedule jobs at a time or cron expression; at-least-once execution within ~seconds of schedule; retries; visibility.</li><li>10 M jobs/day, peaks at round hours.</li></ul>`,
          est: `<p>~120 jobs/s average, spikes 10–50× at :00 → enqueue ahead and spread load.</p>`,
          api: `POST /v1/jobs {handler, payload, run_at | cron, retry: {max: 5, backoff: "exp"}, idempotency_key}
GET /v1/jobs/{id}   DELETE /v1/jobs/{id}`,
          hld: `API ─► jobs DB (sharded, index on next_run_at)
scheduler instances (each owns shard ranges) ─ every second: claim due jobs (SKIP LOCKED) ─► queue (SQS/Kafka)
workers ─ lease ─► execute handler ─► ack / retry (update next_run_at) / DLQ
recurring jobs: after run, compute next occurrence and upsert next_run_at`,
          data: `<pre><code>jobs(id, handler, payload, status, next_run_at, attempts, max_attempts, cron, shard, idempotency_key)
job_runs(job_id, run_id, started_at, finished_at, status, error)</code></pre>`,
          deep: `<h3>Claiming due jobs</h3><pre><code>WITH due AS (
  SELECT id FROM jobs WHERE shard = ANY(:my_shards) AND status='SCHEDULED' AND next_run_at &lt;= now()
  ORDER BY next_run_at LIMIT 500 FOR UPDATE SKIP LOCKED)
UPDATE jobs SET status='ENQUEUED' FROM due WHERE jobs.id = due.id RETURNING jobs.*;</code></pre>`,
          tradeoffs: `<ul><li>DB polling (simple, precise) vs timing wheels in memory (fast, needs persistence).</li><li>Exactly-once execution is impractical; at-least-once + idempotency.</li></ul>`,
        }),
        pitfalls: ["Every scheduler scanning all jobs (thundering herd, double execution).", "No lease/heartbeat → long jobs run twice.", "Non-idempotent job handlers."],
        interviewQs: ["Design a distributed cron.", "How do you ensure a job runs only once?", "How do you handle a worker crashing mid-job?", "How do you scale for spikes at the top of the hour?"],
        resources: [
          { t: "Temporal documentation", u: "https://docs.temporal.io/", k: "docs" },
          { t: "Slack — Scaling Slack's job queue", u: "https://slack.engineering/scaling-slacks-job-queue/", k: "blog" },
        ],
      },
      {
        id: "sd-metrics",
        title: "Design Real-Time Analytics / Metrics Monitoring (Datadog-style)",
        summary: "Ingesting millions of events or metric points per second, aggregating them in real time and querying them fast — the streaming design interview.",
        tags: ["streaming", "time-series", "kafka", "flink"],
        brushup: [
          "Ingest via collectors/agents → <b>Kafka</b> (partitioned by metric/tenant) for buffering and replay.",
          "Stream processing (<b>Flink</b>): event-time windows, watermarks, pre-aggregation (per minute), late data handling.",
          "Storage: <b>time-series DB</b> (Prometheus/M3/VictoriaMetrics/Druid/ClickHouse) with downsampling and retention tiers.",
          "Cardinality is the enemy: limit tag combinations; roll up high-cardinality dimensions.",
          "Query service with caching; dashboards query rollups, not raw points.",
          "Alerting engine evaluates rules on streams or short-interval queries; dedupes and routes alerts.",
          "Hot/warm/cold tiers: raw 1s data for days, 1-minute rollups for months, hourly for years.",
          "Exactly-once aggregation via checkpoints + idempotent upserts keyed by (series, window).",
        ],
        detail: card({
          req: `<ul><li>Collect metrics from 1 M hosts, 100 series each, every 10 s; dashboards and alerts within ~1 min; 13 months retention.</li></ul>`,
          est: `<p>1 M × 100 / 10 s = 10 M points/s × 16 B (compressed ~2 B with Gorilla encoding) → raw ~20–160 MB/s; downsampling keeps long-term storage manageable.</p>`,
          api: `POST /v1/series [{metric, tags, ts, value}, ...]   (batched, compressed)
GET  /v1/query?q=avg:cpu.user{service:orders} by {host}&amp;from=-1h&amp;step=60s`,
          hld: `agents ─► ingestion gateways (auth, validation, cardinality limits) ─► Kafka (partition by series hash)
   ─► Flink: parse → window (event time, 1-min) → rollups ─► TSDB (hot, sharded by series) ─► object storage (cold, Parquet)
   ─► alert evaluator (streaming rules) ─► notification system
query service ─► TSDB / cold store with caching ─► dashboards`,
          data: `<p>Series ID = hash(metric + sorted tags); chunks of (timestamp, value) compressed with delta-of-delta + XOR (Gorilla); inverted index tag → series IDs.</p>`,
          deep: `<h3>Why pre-aggregate</h3><p>Dashboards over 30 days at 10 s resolution would scan billions of points; 1-min/1-hour rollups (min, max, sum, count, sketches for percentiles like t-digest/DDSketch) make queries cheap.</p>`,
          tradeoffs: `<ul><li>Push vs pull collection (Prometheus pulls).</li><li>Percentiles can't be averaged — store sketches/histograms.</li><li>Late data: allowed lateness vs accuracy.</li></ul>`,
        }),
        pitfalls: ["Unbounded tag cardinality (user_id as a tag).", "Averaging percentiles across hosts.", "Processing-time windows (wrong under lag/replay)."],
        interviewQs: ["Design a metrics monitoring system.", "How do you handle high-cardinality metrics?", "How do you compute p99 across many servers?", "How do you handle late events?"],
        resources: [
          { t: "Gorilla: Facebook's in-memory time series database (paper)", u: "https://www.vldb.org/pvldb/vol8/p1816-teller.pdf", k: "paper" },
          { t: "Uber — M3 metrics platform", u: "https://www.uber.com/blog/m3/", k: "blog" },
        ],
      },
      {
        id: "sd-collab-editing",
        title: "Design Collaborative Editing (Google Docs)",
        summary: "Letting many users edit the same document concurrently in real time — OT vs CRDTs, sessions, persistence and presence.",
        tags: ["real-time", "crdt", "websocket"],
        brushup: [
          "Clients connect via <b>WebSockets</b> to a document session server (one owner per document for ordering).",
          "Concurrent edits resolved with <b>Operational Transformation</b> (server transforms ops against concurrent ones — Google Docs) or <b>CRDTs</b> (Yjs/Automerge — merge without central ordering).",
          "Local-first: apply edits optimistically, send ops, reconcile with server acknowledgements.",
          "Persistence: append op log + periodic snapshots; version history from the log.",
          "Presence (cursors, selections) is ephemeral — broadcast, don't persist.",
          "Route all editors of a document to the same session server (consistent hashing by doc_id); failover rebuilds from snapshot + log.",
          "Permissions checked on connect and per op; comments/suggestions as separate models.",
        ],
        detail: card({
          req: `<ul><li>Multiple users edit simultaneously, see changes &lt; 200 ms; offline edits sync later; history.</li></ul>`,
          est: `<p>Most docs have 1–5 concurrent editors; ops are tiny (~100 B) → per-doc session servers handle many docs each.</p>`,
          api: `WS /v1/docs/{id}/session  → {op: insert|delete, pos, text, base_rev} ; ← {ack rev} {remote ops} {presence}`,
          hld: `clients ─WS─► gateway ─► doc session server (owner of doc_id via consistent hashing)
    session: in-memory doc state + OT/CRDT merge ─► op log (append, durable) ─► snapshots (object storage)
    presence broadcast ─► other clients
doc metadata & permissions ─► SQL; search indexer consumes snapshots`,
          data: `<p>ops(doc_id, rev, user_id, op, ts) append-only; snapshots(doc_id, rev, blob_key); docs(id, owner, acl, latest_rev).</p>`,
          deep: `<h3>OT in one example</h3><pre><code>Doc "abc". A inserts "X" at 1 (rev 5); B deletes pos 2 (rev 5) concurrently.
Server applies A first → "aXbc"; transforms B's delete(2) → delete(3) → "aXb".</code></pre>`,
          tradeoffs: `<ul><li>OT needs a central server ordering ops; CRDTs work peer-to-peer/offline but carry metadata overhead.</li><li>Single session owner per doc simplifies ordering but needs fast failover.</li></ul>`,
        }),
        pitfalls: ["Last-write-wins on whole documents (lost edits).", "Persisting cursor positions.", "Spreading one document's editors across servers without coordination."],
        interviewQs: ["Design Google Docs.", "OT vs CRDT?", "How do you persist and version documents?", "How do you handle offline editing?"],
        resources: [
          { t: "Figma — How multiplayer technology works", u: "https://www.figma.com/blog/how-figmas-multiplayer-technology-works/", k: "blog" },
          { t: "Yjs documentation", u: "https://docs.yjs.dev/", k: "docs" },
        ],
      },
      {
        id: "sd-leaderboard",
        title: "Design a Real-Time Leaderboard & Counters",
        summary: "Ranking millions of players with live updates, and counting likes/views at massive write rates without hot keys.",
        tags: ["redis", "counters"],
        brushup: [
          "Leaderboard: Redis <b>sorted set</b> (ZINCRBY, ZREVRANGE, ZREVRANK) — O(log n) updates and rank queries.",
          "Shard very large boards by score range or keep top-N exact + approximate ranks for the long tail.",
          "Persist scores in a DB; Redis is the fast view (rebuildable).",
          "Periodic boards (daily/weekly) as separate keys with TTL.",
          "Counters at high write rates: buffer increments in memory/stream and flush aggregated deltas; shard hot counters (like:post:1#0..#9).",
          "Approximate counts are fine for views; exact for money/inventory.",
          "Friends leaderboards: fetch friends' scores (ZMSCORE) and sort client/server side.",
        ],
        detail: card({
          req: `<ul><li>Global and friends leaderboards for a game with 50 M players; score updates 100k/s; show top 100 and my rank in real time.</li></ul>`,
          est: `<p>50 M members × ~50 B in a sorted set ≈ 2.5 GB → fits one Redis node (replicate for reads).</p>`,
          api: `POST /v1/scores {player_id, delta}   GET /v1/leaderboard?top=100   GET /v1/leaderboard/me`,
          hld: `game servers ─► score service ─► Kafka (score events) ─► DB (durable totals)
                            └─► Redis sorted set (ZINCRBY) ─► reads (top N, rank, around-me)
batch job rebuilds Redis from DB after failures`,
          data: `<p>scores(player_id, season, total) in SQL/DynamoDB; Redis ZSET lb:{season}.</p>`,
          deep: `<h3>Around me</h3><pre><code>r = ZREVRANK lb:s1 player:7
ZREVRANGE lb:s1 (r-5) (r+5) WITHSCORES</code></pre>`,
          tradeoffs: `<ul><li>Single sorted set is simple until memory/CPU limits; sharding makes global rank queries approximate.</li><li>Ties: add a timestamp component to the score for deterministic ordering.</li></ul>`,
        }),
        pitfalls: ["Computing ranks with SQL ORDER BY on every request.", "Single hot counter key for viral content.", "Redis as the only copy of scores."],
        interviewQs: ["Design a real-time game leaderboard.", "How do you get a player's rank quickly?", "How do you count likes on a viral post?"],
        resources: [
          { t: "Redis — Sorted sets", u: "https://redis.io/docs/latest/develop/data-types/sorted-sets/", k: "docs" },
        ],
      },
      {
        id: "sd-message-queue",
        title: "Design a Distributed Message Queue (Kafka-like)",
        summary: "Building a durable, partitioned, replicated log with consumer groups — the internals of Kafka as a design exercise.",
        tags: ["kafka", "log", "must-know"],
        brushup: [
          "Topic → partitions → append-only segment files; offsets as positions.",
          "Producers route by key hash; batch + compress; acks after replication to in-sync replicas.",
          "Leader/follower replication per partition; controller (consensus) tracks leaders and ISR.",
          "Consumers pull; consumer groups assign partitions; offsets stored in an internal compacted topic.",
          "Retention by time/size; compaction by key; tiered storage for long retention.",
          "Performance: sequential I/O, page cache, zero-copy, batching.",
          "Delivery semantics from offset commit timing + idempotent producers + transactions.",
        ],
        detail: card({
          req: `<ul><li>Publish/subscribe with ordering per key, durability (no loss after ack), replay, 1 GB/s ingest, many consumer groups.</li></ul>`,
          est: `<p>1 GB/s × 86,400 ≈ 86 TB/day × RF 3 ≈ 260 TB/day raw → 7-day retention ≈ 1.8 PB (tiered storage helps).</p>`,
          api: `produce(topic, key, value) → (partition, offset)
fetch(topic, partition, offset, max_bytes) → records
commit(group, topic, partition, offset)`,
          hld: `producers ─► brokers (partition leaders) ─► followers replicate (pull) ─► ack when ISR has it
controller quorum (Raft) ─ metadata: topics, partitions, leaders, ISR
consumers (groups) ─ fetch from leaders (or nearest follower) ─ commit offsets to __consumer_offsets`,
          data: `<p>Per partition: segment files (log + offset index + time index); metadata log in the controller quorum.</p>`,
          deep: `<h3>Why pull-based consumers</h3><p>Consumers control their pace (natural backpressure), batch efficiently, and can rewind for replay — push systems must track per-consumer state and flow control.</p>`,
          tradeoffs: `<ul><li>Per-partition ordering vs parallelism.</li><li>acks=all durability vs latency.</li><li>Log (Kafka) vs queue (RabbitMQ/SQS) semantics: replay and fan-out vs per-message acks and routing.</li></ul>`,
        }),
        pitfalls: ["Global ordering expectations.", "Too few partitions to scale consumers later.", "Treating a log like a task queue with per-message acks."],
        interviewQs: ["Design Kafka.", "How does replication guarantee no data loss?", "Why is Kafka pull-based?", "Log-based broker vs traditional queue?"],
        resources: [
          { t: "Kafka: a Distributed Messaging System for Log Processing (paper)", u: "https://notes.stephenholiday.com/Kafka.pdf", k: "paper" },
          { t: "Kafka documentation — Design", u: "https://kafka.apache.org/documentation/#design", k: "docs" },
        ],
      },
    ],
  });
})();
