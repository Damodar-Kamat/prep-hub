/* Data Engineering & Streaming — Kafka, Flink, Spark, modeling, lakehouse, orchestration, CDC. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "data-eng",
  title: "Data Engineering & Streaming",
  icon: "🌊",
  blurb: "Kafka internals, Flink state & time, Spark execution, warehouse modeling, lakehouse table formats, orchestration, CDC — the data-platform interview.",
  topics: [
    {
      id: "de-landscape",
      title: "The Data Platform Landscape: Batch vs Streaming, Lambda vs Kappa",
      summary: "How modern data platforms are assembled — sources, ingestion, storage, processing, serving — and when to process in batch vs in real time.",
      tags: ["architecture", "batch", "streaming"],
      brushup: [
        "Pipeline stages: <b>sources</b> (OLTP DBs, events, SaaS APIs) → <b>ingestion</b> (CDC, Kafka, connectors) → <b>storage</b> (lake/warehouse) → <b>processing</b> (Spark, Flink, dbt) → <b>serving</b> (BI, OLAP stores, feature stores, APIs).",
        "<b>Batch</b>: bounded data, high throughput, minutes–hours latency, simple reprocessing. <b>Streaming</b>: unbounded data, seconds latency, needs state, time semantics and exactly-once care.",
        "<b>Lambda</b> = batch layer (correct, slow) + speed layer (fast, approximate) merged at query time → two codebases. <b>Kappa</b> = one streaming pipeline; reprocess by replaying the log.",
        "ETL (transform before load) vs <b>ELT</b> (load raw into the warehouse, transform with SQL/dbt) — ELT dominates with cheap cloud warehouses.",
        "Lakehouse = object storage + open table format (Iceberg/Delta/Hudi) giving ACID, time travel and schema evolution on files.",
        "Choose streaming only when latency creates business value (fraud, alerting, personalization); otherwise micro-batch or batch is cheaper and simpler.",
        "Idempotency + replayability are the two properties that make any pipeline recoverable.",
      ],
      detail: `
<h2>The reference architecture</h2>
<pre><code>OLTP DB ──CDC (Debezium)──┐
App events ──────────────┼──► Kafka ──► Flink (streaming) ──► OLAP store (Pinot/Druid/ClickHouse) ──► dashboards, alerts
SaaS APIs ──(Airbyte/Fivetran)┘     │
                                    └──► object storage (raw, Parquet) ──► Iceberg/Delta tables
                                                                            │
                                            Spark / dbt (batch ELT) ◄───────┘──► warehouse marts ──► BI, ML features</code></pre>
<p>Interviewers want to see that you can place each tool on this map and justify it. Name the <b>contract</b> between stages (schemas, partitioning keys, SLAs) — that is where platforms break.</p>

<h2>Batch vs streaming — the real trade-offs</h2>
<table>
<tr><th></th><th>Batch</th><th>Streaming</th></tr>
<tr><td>Data</td><td>Bounded (a day's partition)</td><td>Unbounded, arrives out of order</td></tr>
<tr><td>Latency</td><td>Minutes → hours</td><td>Milliseconds → seconds</td></tr>
<tr><td>Correctness</td><td>Easy: recompute the whole partition</td><td>Needs event time, watermarks, state, exactly-once</td></tr>
<tr><td>Cost/ops</td><td>Cheap, ephemeral clusters</td><td>Always-on, stateful, on-call burden</td></tr>
<tr><td>Reprocessing</td><td>Re-run the job</td><td>Replay from the log (Kafka retention/tiered storage) or backfill with batch</td></tr>
</table>

<h2>Lambda vs Kappa</h2>
<p><b>Lambda architecture</b> (Nathan Marz) runs a batch layer that recomputes truth from immutable raw data and a speed layer that covers the gap since the last batch. The serving layer merges both. Downside: <b>two implementations of the same logic</b> that drift apart.</p>
<p><b>Kappa architecture</b> (Jay Kreps) keeps one streaming job; to fix a bug you deploy v2, replay the log from the beginning into a new output table, then switch readers. It needs long log retention and a stream processor with good state handling (Flink, Kafka Streams).</p>
<p>In practice most companies run a <b>hybrid</b>: streaming for low-latency products + a lakehouse with batch jobs for heavy history, backfills and ML.</p>

<h2>ETL vs ELT and the "modern data stack"</h2>
<ul>
<li><b>Ingestion</b>: Fivetran/Airbyte (SaaS), Debezium/Kafka Connect (CDC), custom producers.</li>
<li><b>Storage/compute</b>: Snowflake, BigQuery, Redshift, Databricks; open formats on S3/GCS.</li>
<li><b>Transformation</b>: dbt (SQL models, tests, lineage); Spark for heavy/complex jobs.</li>
<li><b>Orchestration</b>: Airflow, Dagster, Prefect.</li>
<li><b>Quality & observability</b>: dbt tests, Great Expectations, Monte Carlo-style freshness/volume monitors.</li>
<li><b>Serving</b>: BI (Looker, Superset), reverse ETL, feature stores, OLAP engines for user-facing analytics.</li>
</ul>

<h2>Design principles interviewers listen for</h2>
<ul>
<li><b>Immutable raw zone</b> — never lose the original data; everything downstream can be rebuilt.</li>
<li><b>Idempotent writes</b> — overwrite partitions or MERGE on keys so retries don't duplicate.</li>
<li><b>Partition by time and a business key</b> for pruning and parallelism.</li>
<li><b>Schema contracts</b> (Avro/Protobuf + schema registry) between producers and consumers.</li>
<li><b>Backfill strategy</b> designed up front, not after the first bug.</li>
<li><b>SLAs</b> on freshness and completeness, with alerts.</li>
</ul>`,
      pitfalls: [
        "Choosing streaming because it's fashionable — the always-on cost and complexity must buy real latency value.",
        "No replay path: if the log retention is 7 days and the bug is 30 days old, Kappa can't fix it.",
        "Lambda's two code paths silently diverging.",
        "Treating the warehouse as the only copy of raw data (no immutable landing zone).",
      ],
      interviewQs: [
        "When would you choose streaming over batch? Give a concrete example.",
        "Explain Lambda vs Kappa architecture and their trade-offs.",
        "How would you design a pipeline so that a bug discovered next month can be fixed retroactively?",
        "ETL vs ELT — why has ELT become the default?",
        "Walk me through the data platform at your last company.",
      ],
      resources: [
        { t: "Fundamentals of Data Engineering — Reis & Housley", u: "https://www.oreilly.com/library/view/fundamentals-of-data/9781098108298/", k: "book" },
        { t: "Designing Data-Intensive Applications — ch. 10–12", u: "https://dataintensive.net/", k: "book" },
        { t: "Questioning the Lambda Architecture — Jay Kreps", u: "https://www.oreilly.com/radar/questioning-the-lambda-architecture/", k: "article" },
        { t: "The Log: what every engineer should know — Jay Kreps", u: "https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying", k: "article" },
        { t: "Data Engineering Zoomcamp (free course)", u: "https://github.com/DataTalksClub/data-engineering-zoomcamp", k: "course" },
      ],
    },
    {
      id: "kafka-architecture",
      title: "Kafka Architecture: Topics, Partitions, Replication, KRaft",
      summary: "Kafka is a distributed, replicated, append-only commit log; partitions give ordering and parallelism, replication gives durability.",
      tags: ["kafka", "streaming", "must-know"],
      brushup: [
        "A <b>topic</b> is split into <b>partitions</b>; each partition is an ordered, immutable log where records get increasing <b>offsets</b>. Ordering is guaranteed <i>only within a partition</i>.",
        "Records with the same <b>key</b> go to the same partition (hash(key) mod N) → per-key ordering.",
        "Each partition has one <b>leader</b> and N−1 <b>followers</b>; producers/consumers talk to the leader. The <b>ISR</b> (in-sync replicas) are followers caught up within replica.lag.time.max.ms.",
        "A write with <b>acks=all</b> is committed once all ISR members have it; <b>min.insync.replicas=2</b> with RF=3 tolerates one broker loss without data loss.",
        "<b>High watermark</b> = last offset replicated to all ISR; consumers only read up to it.",
        "<b>KRaft</b> (Kafka Raft) replaced ZooKeeper: a controller quorum stores cluster metadata in an internal log.",
        "Storage: segment files per partition, sequential writes, OS page cache, zero-copy (sendfile) → very high throughput.",
        "Retention by time/size, or <b>log compaction</b> (keep latest value per key) for changelog/state topics.",
      ],
      detail: `
<h2>The mental model</h2>
<p>Kafka is not a queue that deletes messages when read — it's a <b>durable log</b>. Many consumer groups can read the same data independently at their own pace, and can rewind. That property enables replay, fan-out and event sourcing.</p>
<pre><code>Topic "orders" (3 partitions, RF=3)
P0: [0][1][2][3][4][5] ...   leader: broker 1, followers: 2,3
P1: [0][1][2][3] ...         leader: broker 2, followers: 3,1
P2: [0][1][2][3][4] ...      leader: broker 3, followers: 1,2</code></pre>

<h2>Partitioning</h2>
<ul>
<li>The default partitioner hashes the key (murmur2) → same key, same partition → ordering per key (e.g. all events of one order).</li>
<li>Null keys use the <b>sticky partitioner</b> (fill a batch for one partition, then switch) for better batching.</li>
<li><b>Partition count</b> caps consumer parallelism in a group (one partition → at most one consumer per group). Choose for peak throughput: partitions ≥ target throughput / per-partition throughput, with headroom. Adding partitions later <b>breaks key→partition mapping</b>.</li>
<li>Hot keys create hot partitions — mitigate with key salting or splitting heavy tenants.</li>
</ul>

<h2>Replication and durability</h2>
<table>
<tr><th>Setting</th><th>Meaning</th><th>Typical</th></tr>
<tr><td>replication.factor</td><td>Copies of each partition</td><td>3</td></tr>
<tr><td>acks (producer)</td><td>0 = fire & forget, 1 = leader only, all = all ISR</td><td>all</td></tr>
<tr><td>min.insync.replicas</td><td>Minimum ISR for acks=all writes to succeed</td><td>2</td></tr>
<tr><td>unclean.leader.election.enable</td><td>Allow out-of-sync replica to become leader (data loss)</td><td>false</td></tr>
</table>
<p>With RF=3, min.insync=2, acks=all: one broker can fail with no data loss and writes continue; if two fail, writes are rejected (availability sacrificed for durability — a CP choice).</p>

<h2>Why Kafka is fast</h2>
<ul>
<li><b>Sequential disk I/O</b> on append-only segment files (sequential disk ≈ faster than random memory access patterns at scale).</li>
<li><b>Page cache</b> instead of a JVM heap cache; <b>zero-copy</b> sendfile from page cache to socket.</li>
<li><b>Batching + compression</b> (lz4/zstd) end to end; the broker stores compressed batches as-is.</li>
<li>Simple consumer protocol: the consumer tracks its own offset.</li>
</ul>

<h2>KRaft vs ZooKeeper</h2>
<p>Older Kafka stored metadata (brokers, topics, ISR, controller election) in ZooKeeper. <b>KRaft</b> moves this into a Raft-replicated <code>__cluster_metadata</code> log managed by controller nodes: faster failover, millions of partitions, one system to operate. ZooKeeper mode was removed in Kafka 4.0.</p>

<h2>Retention, compaction, tiered storage</h2>
<ul>
<li><b>Delete policy</b>: drop segments older than retention.ms or beyond retention.bytes.</li>
<li><b>Compact policy</b>: keep the latest record per key (tombstone = null value deletes). Used for changelogs, <code>__consumer_offsets</code>, KTable state.</li>
<li><b>Tiered storage</b>: old segments offloaded to object storage → months of retention cheaply, enabling Kappa-style replay.</li>
</ul>`,
      pitfalls: [
        "Assuming global ordering across a topic — ordering is per partition only.",
        "acks=all with min.insync.replicas=1 gives no real durability guarantee.",
        "Increasing partitions on a keyed topic — keys remap and per-key ordering breaks during the transition.",
        "Thousands of tiny topics/partitions per broker — metadata and file-handle overhead.",
        "Enabling unclean leader election on critical topics (silent data loss).",
      ],
      interviewQs: [
        "How does Kafka guarantee ordering? What if you need global ordering?",
        "Explain ISR, high watermark and what acks=all really means.",
        "How do you choose the number of partitions for a topic?",
        "Why is Kafka so fast?",
        "What is log compaction and when would you use it?",
        "What changed with KRaft?",
      ],
      resources: [
        { t: "Apache Kafka documentation — Design", u: "https://kafka.apache.org/documentation/#design", k: "docs" },
        { t: "Kafka: The Definitive Guide (2nd ed.)", u: "https://www.confluent.io/resources/kafka-the-definitive-guide-v2/", k: "book" },
        { t: "Confluent Developer — Kafka internals course", u: "https://developer.confluent.io/courses/architecture/get-started/", k: "course" },
      ],
    },
    {
      id: "kafka-clients",
      title: "Kafka Producers, Consumers, Consumer Groups & Rebalancing",
      summary: "How clients write and read: batching, idempotent producers, offset commits, consumer groups, partition assignment and rebalances.",
      tags: ["kafka", "consumers", "producers"],
      brushup: [
        "Producer: records are batched per partition (<b>batch.size</b>, <b>linger.ms</b>) and compressed; <b>enable.idempotence=true</b> (default) removes duplicates from retries via producer ID + sequence numbers.",
        "<b>Consumer group</b>: partitions are divided among members; each partition is read by exactly one consumer in the group. Different groups read independently.",
        "Offsets are committed to <code>__consumer_offsets</code>. Commit <b>after</b> processing → at-least-once; commit before → at-most-once.",
        "Auto-commit commits on poll interval — can lose or duplicate on crash; prefer manual commit after the side effect.",
        "<b>Rebalance</b> triggers: member join/leave, crash (session.timeout.ms), slow processing (max.poll.interval.ms exceeded), subscription change.",
        "Use the <b>cooperative-sticky</b> assignor + <b>static membership</b> (group.instance.id) to avoid stop-the-world rebalances.",
        "Consumer lag = log end offset − committed offset; the #1 health metric.",
        "Scaling consumers beyond the partition count gives idle consumers.",
      ],
      detail: `
<h2>Producer path</h2>
<pre><code>send(record) → serializer → partitioner → RecordAccumulator (batch per partition)
             → Sender thread → broker leader → (replicate to ISR) → ack → callback</code></pre>
<ul>
<li><b>linger.ms</b> (wait to fill batches) and <b>batch.size</b> trade latency for throughput; <b>compression.type=lz4|zstd</b> cuts network and disk.</li>
<li><b>Idempotent producer</b>: broker dedupes by (producerId, partition, sequence) — safe retries with <code>max.in.flight.requests.per.connection ≤ 5</code> while preserving order.</li>
<li><b>delivery.timeout.ms</b> bounds total time including retries; handle the callback exception — otherwise failures are silent.</li>
</ul>

<h2>Consumer path</h2>
<pre><code>while (true) {
  ConsumerRecords&lt;K,V&gt; recs = consumer.poll(Duration.ofMillis(500));
  for (var r : recs) process(r);          // side effects first
  consumer.commitSync();                   // then commit → at-least-once
}</code></pre>
<p>Make processing <b>idempotent</b> (upsert by key, dedupe table) and at-least-once becomes effectively-once.</p>

<h2>Delivery semantics</h2>
<table>
<tr><th>Semantic</th><th>How</th><th>Risk</th></tr>
<tr><td>At-most-once</td><td>Commit before processing</td><td>Lost messages on crash</td></tr>
<tr><td>At-least-once</td><td>Commit after processing</td><td>Duplicates on crash/retry</td></tr>
<tr><td>Exactly-once</td><td>Transactions (read-process-write within Kafka) or idempotent sinks</td><td>Complexity, external sinks need 2PC/idempotency</td></tr>
</table>

<h2>Consumer groups and rebalancing</h2>
<p>The <b>group coordinator</b> (a broker) tracks membership via heartbeats; one member (the leader) computes the assignment. Assignors: <b>Range</b>, <b>RoundRobin</b>, <b>Sticky</b>, <b>CooperativeSticky</b>.</p>
<ul>
<li><b>Eager</b> rebalancing revokes all partitions from everyone → processing pauses ("stop the world").</li>
<li><b>Cooperative (incremental)</b> rebalancing only moves the partitions that must move.</li>
<li><b>Static membership</b>: a restarting pod with the same group.instance.id rejoins without triggering a rebalance (within session timeout) — great for rolling deploys.</li>
<li>KIP-848 (the new consumer rebalance protocol) moves assignment to the broker for faster, less disruptive rebalances.</li>
</ul>

<h2>Tuning knobs you should know</h2>
<ul>
<li><b>max.poll.records</b>, <b>max.poll.interval.ms</b> — if processing a batch takes longer than the interval, the consumer is kicked out → rebalance storm.</li>
<li><b>fetch.min.bytes</b> / <b>fetch.max.wait.ms</b> — batching on the fetch side.</li>
<li><b>auto.offset.reset</b> = earliest | latest — what a new group reads first.</li>
<li><b>isolation.level=read_committed</b> — skip aborted transactional records.</li>
</ul>

<h2>Handling poison messages</h2>
<p>Retry with backoff a few times, then send to a <b>dead-letter topic</b> with error metadata; alert on DLQ volume. Never block a partition forever on one bad record.</p>`,
      pitfalls: [
        "Slow processing inside the poll loop → max.poll.interval.ms exceeded → endless rebalances.",
        "Auto-commit + async processing → committed offsets for work that never finished.",
        "More consumers than partitions → idle consumers, no extra throughput.",
        "Ignoring producer send callbacks → silent data loss.",
        "Not handling rebalance callbacks (onPartitionsRevoked) when you keep per-partition state.",
      ],
      interviewQs: [
        "What happens when a consumer in a group crashes?",
        "How do you achieve at-least-once and make it effectively-once?",
        "What causes rebalance storms and how do you prevent them?",
        "How does the idempotent producer work?",
        "How would you handle a poison-pill message?",
        "How do you monitor consumer health?",
      ],
      resources: [
        { t: "Kafka docs — Consumer configs", u: "https://kafka.apache.org/documentation/#consumerconfigs", k: "docs" },
        { t: "Confluent — Incremental cooperative rebalancing", u: "https://www.confluent.io/blog/incremental-cooperative-rebalancing-in-kafka/", k: "blog" },
        { t: "KIP-848: The next generation consumer rebalance protocol", u: "https://cwiki.apache.org/confluence/display/KAFKA/KIP-848%3A+The+Next+Generation+of+the+Consumer+Rebalance+Protocol", k: "article" },
      ],
    },
    {
      id: "kafka-eos-ops",
      title: "Kafka Exactly-Once, Kafka Streams/Connect & Operations",
      summary: "Transactions for exactly-once processing, the Kafka Streams and Connect ecosystems, schema registry, and running Kafka in production.",
      tags: ["kafka", "exactly-once", "operations"],
      brushup: [
        "EOS = <b>idempotent producer</b> + <b>transactions</b> (atomic writes across partitions, including the consumer offset commit) + consumers with <b>read_committed</b>.",
        "Transactional ID survives restarts; <b>epoch fencing</b> blocks zombie producers.",
        "Exactly-once holds <b>inside Kafka</b>; external sinks need idempotent upserts or two-phase commit.",
        "<b>Kafka Streams</b>: a library (no cluster) for stateful stream processing; state in RocksDB backed by compacted changelog topics; KStream vs KTable duality.",
        "<b>Kafka Connect</b>: framework for source/sink connectors (Debezium, JDBC, S3, Elasticsearch) with SMTs for light transforms.",
        "<b>Schema Registry</b>: Avro/Protobuf/JSON schemas with compatibility modes (BACKWARD default) → safe schema evolution.",
        "Ops: monitor under-replicated partitions, offline partitions, request latency, consumer lag, disk usage; rebalance partitions with Cruise Control.",
      ],
      detail: `
<h2>Exactly-once in Kafka</h2>
<pre><code>producer.initTransactions();
while (true) {
  records = consumer.poll(...);
  producer.beginTransaction();
  for (r : records) producer.send(transform(r));
  producer.sendOffsetsToTransaction(offsets(records), consumer.groupMetadata());
  producer.commitTransaction();          // outputs + input offsets committed atomically
}</code></pre>
<p>The <b>transaction coordinator</b> writes transaction state to <code>__transaction_state</code> and places commit/abort markers in each partition. Downstream consumers with <code>isolation.level=read_committed</code> never see aborted data. A restarted producer with the same <code>transactional.id</code> bumps the epoch and fences the zombie.</p>
<p>Cost: extra latency per transaction and throughput trade-offs — batch many records per transaction.</p>

<h2>Kafka Streams in one screen</h2>
<ul>
<li><b>KStream</b> = event stream (inserts); <b>KTable</b> = changelog (upserts, latest per key); <b>GlobalKTable</b> = fully replicated table for joins without co-partitioning.</li>
<li>Stateful ops (aggregate, join, windowing) use local <b>RocksDB</b> stores, each backed by a compacted <b>changelog topic</b> for recovery; standby replicas speed failover.</li>
<li>Joins require <b>co-partitioning</b> (same key, same partition count) — otherwise repartition topics are created.</li>
<li><code>processing.guarantee=exactly_once_v2</code> turns on EOS.</li>
<li>Scales by running more instances; tasks = partitions.</li>
</ul>

<h2>Kafka Connect</h2>
<ul>
<li>Distributed workers run connector <b>tasks</b>; config/offsets/status stored in Kafka topics.</li>
<li><b>Source</b> connectors: Debezium (CDC), JDBC, files. <b>Sink</b>: S3, JDBC, Elasticsearch, BigQuery, Snowflake.</li>
<li>Single Message Transforms (SMTs) for renames/masking/routing; heavier logic belongs in a stream processor.</li>
<li>Error handling: <code>errors.tolerance=all</code> + dead letter queue topic.</li>
</ul>

<h2>Schema Registry and evolution</h2>
<table>
<tr><th>Mode</th><th>Allowed change</th><th>Upgrade order</th></tr>
<tr><td>BACKWARD</td><td>Delete fields, add optional fields</td><td>Consumers first</td></tr>
<tr><td>FORWARD</td><td>Add fields, delete optional fields</td><td>Producers first</td></tr>
<tr><td>FULL</td><td>Add/delete optional fields only</td><td>Any order</td></tr>
</table>

<h2>Running Kafka in production</h2>
<ul>
<li><b>Key metrics</b>: UnderReplicatedPartitions (should be 0), OfflinePartitionsCount, ActiveControllerCount (exactly 1), request/produce latency p99, network/IO thread idle %, disk usage, consumer lag per group.</li>
<li><b>Capacity</b>: size by throughput × retention × RF; keep disks &lt; 70–80%.</li>
<li><b>Partition rebalancing</b> after adding brokers (Cruise Control / reassign tool).</li>
<li><b>Security</b>: TLS, SASL (SCRAM/OAuth), ACLs per topic/group.</li>
<li><b>Multi-DC</b>: MirrorMaker 2 / Cluster Linking for DR and aggregation.</li>
</ul>`,
      pitfalls: [
        "Claiming end-to-end exactly-once when the sink is a non-idempotent external system.",
        "Joining two KStreams that are not co-partitioned.",
        "Breaking schema compatibility (renaming a required field) and crashing every consumer.",
        "Running Connect with errors.tolerance=all but no DLQ — silently dropping records.",
      ],
      interviewQs: [
        "Explain how Kafka transactions provide exactly-once semantics.",
        "What is a zombie producer and how is it fenced?",
        "KStream vs KTable — when do you use each?",
        "How does Kafka Streams recover state after a crash?",
        "How do you evolve a schema without breaking consumers?",
        "Which Kafka metrics would you alert on?",
      ],
      resources: [
        { t: "Confluent — Exactly-once semantics are possible", u: "https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/", k: "blog" },
        { t: "Kafka Streams documentation", u: "https://kafka.apache.org/documentation/streams/", k: "docs" },
        { t: "Confluent Schema Registry — compatibility", u: "https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html", k: "docs" },
      ],
    },
    {
      id: "flink-core",
      title: "Apache Flink Fundamentals: Dataflow, Parallelism, Operators",
      summary: "Flink is a true streaming engine: a job is a dataflow graph of parallel operators with managed state, running on a JobManager/TaskManager cluster.",
      tags: ["flink", "streaming"],
      brushup: [
        "Architecture: <b>JobManager</b> (scheduling, checkpoint coordination, recovery) + <b>TaskManagers</b> (workers with <b>task slots</b>).",
        "A job = <b>dataflow graph</b> of sources → transformations → sinks; each operator runs with a <b>parallelism</b>; chained operators share a thread (operator chaining).",
        "Stateless ops: map, filter, flatMap. Keyed ops after <b>keyBy</b>: reduce, aggregate, windows, process functions with keyed state.",
        "Network shuffle happens at keyBy/rebalance boundaries; data flows in buffers with <b>credit-based flow control</b> → natural backpressure.",
        "APIs: DataStream (Java), Table API / <b>Flink SQL</b> (declarative, same engine), ProcessFunction (low level, timers, side outputs).",
        "Unified batch + stream: bounded streams run in batch execution mode.",
        "Deploy: standalone, YARN, <b>Kubernetes (native or Flink Kubernetes Operator)</b>; application mode is the modern default.",
      ],
      detail: `
<h2>Architecture</h2>
<pre><code>Client ──submit JobGraph──► JobManager (Dispatcher, ResourceManager, JobMaster per job)
                                   │ deploys tasks, triggers checkpoints
                   ┌───────────────┼────────────────┐
             TaskManager 1    TaskManager 2     TaskManager 3
             [slot][slot]     [slot][slot]      [slot][slot]   ← each slot runs a slice of the pipeline</code></pre>
<p>A <b>slot</b> is a share of a TaskManager's resources. With slot sharing, one slot can hold one parallel instance of every operator in the pipeline, so parallelism p needs p slots.</p>

<h2>A typical job</h2>
<pre><code>DataStream&lt;Event&gt; events = env.fromSource(kafkaSource, watermarkStrategy, "events");
events
  .filter(e -&gt; e.type.equals("click"))
  .keyBy(e -&gt; e.userId)                                  // hash-partition by key (network shuffle)
  .window(TumblingEventTimeWindows.of(Duration.ofMinutes(1)))
  .aggregate(new CountAgg())                              // incremental, O(1) state per window
  .sinkTo(kafkaSink);                                     // exactly-once via 2PC
env.execute("clicks-per-user");</code></pre>

<h2>Keyed state and process functions</h2>
<p>After <code>keyBy</code>, each key has its own state, stored in the state backend and scoped automatically:</p>
<ul>
<li><b>ValueState</b>, <b>ListState</b>, <b>MapState</b>, <b>ReducingState</b>, <b>AggregatingState</b>.</li>
<li><b>Timers</b> (event-time or processing-time) in <code>KeyedProcessFunction.onTimer</code> — for timeouts, sessionization, delayed emission.</li>
<li><b>State TTL</b> to expire idle keys and bound state size.</li>
<li><b>Broadcast state</b>: stream rules/config to all parallel instances.</li>
</ul>

<h2>Flink SQL</h2>
<pre><code>CREATE TABLE clicks (user_id STRING, url STRING, ts TIMESTAMP(3),
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND) WITH ('connector'='kafka', ...);

SELECT window_start, user_id, COUNT(*) AS clicks
FROM TABLE(TUMBLE(TABLE clicks, DESCRIPTOR(ts), INTERVAL '1' MINUTE))
GROUP BY window_start, window_end, user_id;</code></pre>
<p>Dynamic tables + continuous queries: the result is itself a changelog (insert/update/delete). Great for 80% of pipelines; drop to DataStream for custom state/timers.</p>

<h2>Flink vs Spark Structured Streaming vs Kafka Streams</h2>
<table>
<tr><th></th><th>Flink</th><th>Spark SS</th><th>Kafka Streams</th></tr>
<tr><td>Model</td><td>Record-at-a-time, true streaming</td><td>Micro-batch (continuous mode limited)</td><td>Record-at-a-time library</td></tr>
<tr><td>Latency</td><td>ms</td><td>~100ms–seconds</td><td>ms</td></tr>
<tr><td>State</td><td>Very large (RocksDB, incremental checkpoints)</td><td>Moderate (RocksDB provider)</td><td>RocksDB + changelog topics</td></tr>
<tr><td>Deployment</td><td>Cluster</td><td>Cluster</td><td>Just your app</td></tr>
<tr><td>Sources/sinks</td><td>Many</td><td>Many</td><td>Kafka in/out</td></tr>
</table>

<h2>Backpressure</h2>
<p>Flink uses <b>credit-based flow control</b>: a downstream task grants credits (free buffers) to upstream; when it's slow, upstream stops sending and eventually the source slows reading from Kafka. The Web UI shows backpressure per operator (busy/backpressured ratios). Fixes: increase parallelism of the slow operator, fix data skew, async I/O for external lookups, tune RocksDB.</p>`,
      pitfalls: [
        "Parallelism higher than Kafka partitions on the source — idle source subtasks and stalled watermarks.",
        "Synchronous external calls (DB lookups) inside map → use Async I/O.",
        "Unbounded keyed state without TTL → state grows forever.",
        "Changing operator UIDs between versions → state can't be restored from a savepoint.",
      ],
      interviewQs: [
        "Explain the Flink runtime architecture (JobManager, TaskManager, slots).",
        "How does Flink handle backpressure?",
        "When would you use a KeyedProcessFunction instead of a window?",
        "Flink vs Spark Structured Streaming — when would you choose each?",
        "How do you scale a Flink job?",
      ],
      resources: [
        { t: "Apache Flink documentation — Concepts", u: "https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/overview/", k: "docs" },
        { t: "Stream Processing with Apache Flink (O'Reilly)", u: "https://www.oreilly.com/library/view/stream-processing-with/9781491974285/", k: "book" },
        { t: "Flink training exercises (GitHub)", u: "https://github.com/apache/flink-training", k: "repo" },
      ],
    },
    {
      id: "flink-time",
      title: "Flink Time, Watermarks & Windows",
      summary: "Event time vs processing time, how watermarks track progress in out-of-order streams, window types and late data handling.",
      tags: ["flink", "watermarks", "windows", "must-know"],
      brushup: [
        "<b>Event time</b> = when it happened (in the record); <b>processing time</b> = wall clock of the machine. Use event time for correct, reproducible results.",
        "A <b>watermark W(t)</b> declares 'no more events with timestamp ≤ t are expected'. Windows fire when the watermark passes their end.",
        "<b>BoundedOutOfOrderness(5s)</b>: watermark = max seen timestamp − 5s.",
        "An operator's watermark = <b>min</b> over its input channels → one idle partition stalls everything → use <b>withIdleness</b>.",
        "Windows: <b>tumbling</b> (fixed, non-overlapping), <b>sliding</b> (overlapping), <b>session</b> (gap-based), <b>global</b> (custom trigger).",
        "Late data: <b>allowedLateness</b> re-fires windows with updates; beyond that → <b>side output</b> for late records.",
        "Incremental aggregation (reduce/aggregate) keeps O(1) state per window; ProcessWindowFunction buffers all elements.",
      ],
      detail: `
<h2>Why event time</h2>
<p>A phone goes offline in a tunnel and uploads 10 minutes of events later. With processing time they'd be counted in the wrong minute; with event time they land in the right window — as long as the watermark hasn't passed.</p>

<h2>Watermarks</h2>
<pre><code>WatermarkStrategy
  .&lt;Event&gt;forBoundedOutOfOrderness(Duration.ofSeconds(5))
  .withTimestampAssigner((e, ts) -&gt; e.eventTimeMillis)
  .withIdleness(Duration.ofMinutes(1));</code></pre>
<pre><code>events:     t=10  t=12  t=8  t=15  t=11 ...
max seen:   10    12    12   15    15
watermark:  5     7     7    10    10          (max − 5s)
→ window [0,10) fires when the watermark reaches 10</code></pre>
<p>Trade-off: a <b>larger bound</b> = more complete results but higher latency and more state; smaller = faster but more late data.</p>
<p>Watermarks are generated per source split (per Kafka partition) and combined by taking the <b>minimum</b>. If a partition stops receiving data, its watermark stops advancing and the whole job waits → <code>withIdleness</code> marks it idle.</p>

<h2>Window types</h2>
<table>
<tr><th>Type</th><th>Example</th><th>Notes</th></tr>
<tr><td>Tumbling</td><td>Clicks per minute</td><td>Each event in exactly one window</td></tr>
<tr><td>Sliding</td><td>Last 10 min, updated every minute</td><td>Each event in size/slide windows — costlier</td></tr>
<tr><td>Session</td><td>User session with 30-min inactivity gap</td><td>Windows merge dynamically per key</td></tr>
<tr><td>Global + trigger</td><td>Every 100 events per key</td><td>Custom trigger/evictor</td></tr>
</table>

<h2>Late data</h2>
<pre><code>OutputTag&lt;Event&gt; late = new OutputTag&lt;&gt;("late"){};
var result = events.keyBy(Event::userId)
  .window(TumblingEventTimeWindows.of(Duration.ofMinutes(1)))
  .allowedLateness(Duration.ofMinutes(5))     // re-fire with corrected results
  .sideOutputLateData(late)                   // anything later goes here
  .aggregate(new CountAgg());
result.getSideOutput(late).sinkTo(lateSink);</code></pre>
<p>Downstream must handle <b>updated results</b> (upsert by window+key), not just appends.</p>

<h2>Joins over time</h2>
<ul>
<li><b>Window join</b>: both streams in the same window.</li>
<li><b>Interval join</b>: b.ts between a.ts − x and a.ts + y (e.g. payment within 15 min of order).</li>
<li><b>Temporal table join</b> (SQL): join each event with the version of a dimension valid at that event time.</li>
<li>Regular (unbounded) joins keep all state forever — needs TTL.</li>
</ul>`,
      pitfalls: [
        "One idle Kafka partition freezing all windows (forgot withIdleness).",
        "Using processing-time windows and then wondering why replays give different numbers.",
        "Sliding windows with tiny slide → each event copied into many windows (state blow-up).",
        "Sinks that only append — allowedLateness produces updates that must be upserts.",
      ],
      interviewQs: [
        "What is a watermark and how is it generated?",
        "What happens if one Kafka partition has no data?",
        "How do you handle late events?",
        "Tumbling vs sliding vs session windows — examples for each.",
        "How would you join an order stream with a payment stream arriving up to 15 minutes later?",
      ],
      resources: [
        { t: "Flink docs — Timely stream processing", u: "https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/", k: "docs" },
        { t: "Streaming 101 & 102 — Tyler Akidau", u: "https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/", k: "article" },
        { t: "Streaming Systems (book) — Akidau, Chernyak, Lax", u: "https://www.oreilly.com/library/view/streaming-systems/9781491983867/", k: "book" },
      ],
    },
    {
      id: "flink-state",
      title: "Flink State, Checkpoints, Savepoints & Exactly-Once",
      summary: "How Flink stores huge state, snapshots it consistently with asynchronous barriers, recovers from failures, and delivers end-to-end exactly-once.",
      tags: ["flink", "checkpoints", "exactly-once", "must-know"],
      brushup: [
        "State backends: <b>HashMapStateBackend</b> (heap, fast, limited by memory) vs <b>EmbeddedRocksDBStateBackend</b> (disk, TBs of state, incremental checkpoints).",
        "Checkpoints use <b>asynchronous barrier snapshotting</b> (Chandy–Lamport variant): barriers flow with data; each operator snapshots when barriers from all inputs arrive.",
        "<b>Aligned</b> checkpoints (exactly-once) buffer faster inputs until barriers align; <b>unaligned</b> checkpoints store in-flight buffers → fast checkpoints under backpressure.",
        "On failure: restart from the last completed checkpoint, <b>rewind sources</b> (Kafka offsets stored in the checkpoint), replay.",
        "<b>Savepoints</b> = user-triggered, portable snapshots for upgrades, rescaling, migrations. Set <b>uid()</b> on every stateful operator.",
        "End-to-end exactly-once needs replayable sources + <b>two-phase-commit sinks</b> (Kafka transactional sink, FileSink) or idempotent sinks.",
        "Rescaling redistributes keyed state via <b>key groups</b> (max parallelism fixes the number of key groups).",
      ],
      detail: `
<h2>Checkpoint mechanics</h2>
<pre><code>Source(P0) ──[r][r][B#7][r][r]──► keyBy ──► Window ──► Sink
Source(P1) ──[r][B#7][r][r][r]──►
1. JobManager triggers checkpoint #7; sources record their Kafka offsets and emit barrier B#7.
2. Each operator, when B#7 arrived on ALL inputs (aligned), snapshots its state asynchronously and forwards B#7.
3. Sinks pre-commit (2PC) and acknowledge.
4. When every task acked, checkpoint #7 is complete → sinks commit their transactions.</code></pre>

<h2>Aligned vs unaligned</h2>
<ul>
<li><b>Aligned</b>: while waiting for the slow channel's barrier, the operator buffers records from channels that already delivered it. Under backpressure alignment can take minutes → checkpoints time out.</li>
<li><b>Unaligned</b>: the barrier overtakes in-flight data; the in-flight buffers become part of the checkpoint. Checkpoint duration becomes independent of backpressure, at the cost of larger checkpoints.</li>
<li><b>Buffer debloating</b> reduces in-flight data to keep checkpoints small.</li>
</ul>

<h2>State backends</h2>
<table>
<tr><th></th><th>HashMap (heap)</th><th>RocksDB</th></tr>
<tr><td>Where</td><td>JVM heap objects</td><td>Local disk, serialized</td></tr>
<tr><td>Size</td><td>GBs (GC pressure)</td><td>TBs</td></tr>
<tr><td>Access cost</td><td>Fast</td><td>Serialization per access</td></tr>
<tr><td>Checkpoints</td><td>Full snapshots</td><td>Incremental (only new SST files)</td></tr>
</table>
<p>Checkpoints go to durable storage (S3/HDFS/GCS). Tune: checkpoint interval (trade recovery time vs overhead), min pause between checkpoints, timeout, <b>changelog state backend</b> for faster checkpoints.</p>

<h2>Savepoints and upgrades</h2>
<pre><code>flink savepoint &lt;jobId&gt; s3://bucket/savepoints
flink run -s s3://bucket/savepoints/savepoint-xxxx new-job.jar</code></pre>
<ul>
<li>Assign stable <code>.uid("dedupe-state")</code> to every stateful operator — state is matched by UID.</li>
<li>Changing state types needs <b>state schema evolution</b> (POJO/Avro types support adding fields).</li>
<li>Rescale by restarting from a savepoint with a new parallelism (≤ max parallelism).</li>
</ul>

<h2>End-to-end exactly-once</h2>
<ol>
<li>Source is replayable and its position is in the checkpoint (Kafka offsets).</li>
<li>Operator state is restored consistently with that position.</li>
<li>Sink is <b>transactional</b>: writes go into a transaction pre-committed at the barrier and committed only when the checkpoint completes (<code>TwoPhaseCommitSinkFunction</code>, KafkaSink with DeliveryGuarantee.EXACTLY_ONCE). Consumers downstream must use read_committed → output visibility latency ≈ checkpoint interval.</li>
<li>Or the sink is <b>idempotent</b> (upsert by deterministic key) — simpler and often good enough.</li>
</ol>`,
      pitfalls: [
        "No uid() on operators → after a code change the savepoint can't be mapped.",
        "Checkpoint interval shorter than checkpoint duration → back-to-back checkpoints starving processing.",
        "Kafka transactional sink with transaction.timeout.ms smaller than checkpoint interval + recovery time → data loss/aborts.",
        "Heap backend with large state → long GC pauses.",
        "Downstream reading read_uncommitted and seeing duplicates.",
      ],
      interviewQs: [
        "Explain how Flink checkpoints work.",
        "Aligned vs unaligned checkpoints — when do you use unaligned?",
        "Checkpoint vs savepoint?",
        "How does Flink achieve end-to-end exactly-once with Kafka?",
        "How do you upgrade a stateful job without losing state?",
        "Heap vs RocksDB state backend — how do you choose?",
      ],
      resources: [
        { t: "Flink docs — Checkpointing", u: "https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/fault-tolerance/checkpointing/", k: "docs" },
        { t: "Lightweight Asynchronous Snapshots for Distributed Dataflows (paper)", u: "https://arxiv.org/abs/1506.08603", k: "paper" },
        { t: "Flink — An overview of end-to-end exactly-once", u: "https://flink.apache.org/2018/02/28/an-overview-of-end-to-end-exactly-once-processing-in-apache-flink-with-apache-kafka-too/", k: "blog" },
      ],
    },
    {
      id: "spark-core",
      title: "Apache Spark Internals: DAG, Stages, Shuffle, Catalyst",
      summary: "How Spark turns DataFrame code into an optimized physical plan of stages and tasks, and why the shuffle is where performance lives or dies.",
      tags: ["spark", "batch", "must-know"],
      brushup: [
        "Driver builds a <b>logical plan</b> → <b>Catalyst</b> optimizes it (predicate pushdown, column pruning, constant folding) → physical plan → <b>Tungsten</b> codegen.",
        "<b>Transformations</b> are lazy; <b>actions</b> (count, collect, write) trigger a <b>job</b>.",
        "A job splits into <b>stages</b> at <b>shuffle</b> boundaries (wide dependencies: groupBy, join, repartition); each stage has one <b>task</b> per partition.",
        "Narrow dependencies (map, filter) pipeline within a stage; wide ones write shuffle files and read them over the network.",
        "Executors run tasks in parallel (cores); memory is split into execution (shuffles, joins) and storage (cache).",
        "Joins: <b>broadcast hash join</b> (small side ≤ threshold), <b>sort-merge join</b> (default for big-big), shuffle hash join.",
        "<b>AQE</b> (adaptive query execution) re-optimizes at runtime: coalesces shuffle partitions, switches to broadcast, splits skewed partitions.",
        "Structured Streaming = the same DataFrame API on unbounded tables, run as micro-batches.",
      ],
      detail: `
<h2>From code to tasks</h2>
<pre><code>df = (spark.read.parquet("s3://lake/orders")          # scan
        .filter("country = 'IN'")                         # narrow → pushed to the scan
        .groupBy("customer_id").agg(F.sum("amount"))      # wide → shuffle
        .join(customers, "customer_id"))                  # maybe broadcast
df.write.mode("overwrite").partitionBy("dt").parquet(out)  # action → job

Job → Stage 1: scan + filter + partial aggregation (map side)
      ── shuffle by customer_id ──
      Stage 2: final aggregation + join + write</code></pre>
<p><code>df.explain("formatted")</code> shows the physical plan: look for <b>Exchange</b> (shuffle), <b>BroadcastHashJoin</b> vs <b>SortMergeJoin</b>, <b>PushedFilters</b>.</p>

<h2>Why shuffles are expensive</h2>
<p>Every map task writes partitioned files to local disk; every reduce task fetches its piece from every map task over the network (M × R fetches), then sorts/merges. Cost = disk I/O + serialization + network + possible spills. The number of shuffle partitions (<code>spark.sql.shuffle.partitions</code>, default 200) decides task size — too few → huge tasks that spill; too many → overhead.</p>

<h2>Join strategies</h2>
<table>
<tr><th>Strategy</th><th>When</th><th>Cost</th></tr>
<tr><td>Broadcast hash join</td><td>One side small (&lt; autoBroadcastJoinThreshold, 10 MB default; hint broadcast())</td><td>No shuffle of the big side</td></tr>
<tr><td>Sort-merge join</td><td>Both sides large, equi-join</td><td>Shuffle + sort both sides</td></tr>
<tr><td>Shuffle hash join</td><td>One side fits in memory per partition</td><td>Shuffle, no sort</td></tr>
<tr><td>Broadcast nested loop</td><td>Non-equi joins</td><td>Very expensive</td></tr>
</table>

<h2>Memory model</h2>
<ul>
<li>Executor memory = JVM heap (unified memory: execution + storage, default 60% of heap) + overhead (off-heap, Python workers).</li>
<li>Spills happen when execution memory is exhausted; OOMs often come from skew or collect() on the driver.</li>
<li>Cache (<code>persist(StorageLevel.MEMORY_AND_DISK)</code>) only data reused by multiple actions; unpersist after.</li>
</ul>

<h2>RDD vs DataFrame vs Dataset</h2>
<p>RDDs are low-level, opaque to the optimizer. DataFrames/Datasets carry a schema so Catalyst can optimize and Tungsten can use compact binary rows. Use DataFrames/SQL by default; Python UDFs break optimization and cost serialization — prefer built-in functions or pandas (Arrow) UDFs.</p>

<h2>Structured Streaming</h2>
<ul>
<li>Each trigger processes new data as a micro-batch; state in a state store (RocksDB provider for large state).</li>
<li>Watermarks with <code>withWatermark("ts", "10 minutes")</code>; output modes append / update / complete.</li>
<li>Exactly-once via checkpointed offsets + idempotent/transactional sinks (Delta).</li>
</ul>`,
      pitfalls: [
        "collect() on a large DataFrame → driver OOM.",
        "Python UDFs where a built-in function exists.",
        "Leaving shuffle partitions at 200 for a 5 TB job (or a 5 MB one).",
        "Caching everything → evicting useful data and spilling.",
        "Writing thousands of tiny files per partition (small-files problem).",
      ],
      interviewQs: [
        "What is the difference between a transformation and an action?",
        "Explain jobs, stages and tasks.",
        "What causes a shuffle and why is it expensive?",
        "Broadcast join vs sort-merge join?",
        "What does Adaptive Query Execution do?",
        "RDD vs DataFrame — why is DataFrame faster?",
      ],
      resources: [
        { t: "Spark documentation — SQL performance tuning", u: "https://spark.apache.org/docs/latest/sql-performance-tuning.html", k: "docs" },
        { t: "Learning Spark (2nd ed., free from Databricks)", u: "https://www.databricks.com/resources/ebook/learning-spark-from-oreilly", k: "book" },
        { t: "Spark: The Definitive Guide", u: "https://www.oreilly.com/library/view/spark-the-definitive/9781491912201/", k: "book" },
      ],
    },
    {
      id: "spark-tuning",
      title: "Spark Performance Tuning: Skew, Partitioning, Small Files",
      summary: "The practical playbook for slow or failing Spark jobs — reading the UI, fixing skew, sizing partitions and files, and choosing join strategies.",
      tags: ["spark", "performance"],
      brushup: [
        "Start in the <b>Spark UI</b>: find the slowest stage, compare max vs median task time (skew), check spill and shuffle read sizes.",
        "<b>Skew</b> fixes: AQE skew join (<code>spark.sql.adaptive.skewJoin.enabled</code>), broadcast the small side, <b>salt</b> hot keys, pre-aggregate, isolate hot keys and process separately.",
        "Target ~100–200 MB per shuffle partition; let AQE coalesce small partitions.",
        "<b>Partition pruning</b>: partition tables by a low-cardinality filter column (date); avoid over-partitioning (millions of dirs).",
        "Small files: <code>repartition</code>/<code>coalesce</code> before write, optimize/compact table formats, target 128–1024 MB files.",
        "<b>repartition(n)</b> = full shuffle, even sizes; <b>coalesce(n)</b> = merge without shuffle (only reduces).",
        "Filter and select columns early; use Parquet/ORC for predicate pushdown and column pruning.",
        "Right-size executors: ~4–5 cores each, memory per core ~4–8 GB; enable dynamic allocation.",
      ],
      detail: `
<h2>Debugging workflow</h2>
<ol>
<li>Spark UI → <b>Jobs</b> → longest job → <b>Stages</b>: sort by duration.</li>
<li>Stage details: task duration percentiles. <b>max ≫ median</b> = skew. High <b>spill (disk)</b> = partitions too big or memory too small. Huge <b>shuffle read</b> = consider broadcast or pre-aggregation.</li>
<li><b>SQL tab</b>: physical plan with rows per operator — spot row explosions from bad joins.</li>
<li>Executors tab: GC time &gt; 10% → memory pressure.</li>
</ol>

<h2>Skew — salting example</h2>
<pre><code>SALT = 16
big = big.withColumn("salt", (F.rand() * SALT).cast("int"))
small = small.withColumn("salt", F.explode(F.array([F.lit(i) for i in range(SALT)])))
joined = big.join(small, ["customer_id", "salt"]).drop("salt")</code></pre>
<p>The hot key is spread over 16 tasks; the small side is replicated 16×. With Spark 3 AQE, try <code>skewJoin</code> first — it splits skewed partitions automatically.</p>

<h2>Partitioning decisions</h2>
<table>
<tr><th>Problem</th><th>Fix</th></tr>
<tr><td>Task takes 30 min, others 30 s</td><td>Skew → AQE skew join / salting / broadcast</td></tr>
<tr><td>Thousands of tasks of a few KB</td><td>Too many partitions → coalesce / AQE coalescePartitions</td></tr>
<tr><td>Spill to disk, OOM</td><td>Too few partitions → increase shuffle partitions, more memory</td></tr>
<tr><td>Reads scan whole table</td><td>Partition by date, filter on partition column; Z-order/cluster on common filters</td></tr>
<tr><td>Output has 50k tiny files</td><td>repartition by partition column before write; table compaction</td></tr>
</table>

<h2>Configuration cheat sheet</h2>
<pre><code>spark.sql.adaptive.enabled=true
spark.sql.adaptive.coalescePartitions.enabled=true
spark.sql.adaptive.skewJoin.enabled=true
spark.sql.autoBroadcastJoinThreshold=64MB      # if the small side is known
spark.sql.shuffle.partitions=auto/sized to data
spark.serializer=org.apache.spark.serializer.KryoSerializer
spark.dynamicAllocation.enabled=true</code></pre>

<h2>Code-level wins</h2>
<ul>
<li>Push filters before joins; select only needed columns.</li>
<li>Replace <code>groupByKey</code> (RDD) with <code>reduceByKey</code>/<code>agg</code> — map-side combine.</li>
<li>Avoid <code>count()</code> just to check emptiness — use <code>limit(1)</code>/<code>isEmpty</code>.</li>
<li>Window functions over a partition with one giant key = skew too.</li>
<li>Cache a DataFrame reused by several actions; checkpoint very long lineages.</li>
</ul>`,
      pitfalls: [
        "coalesce(1) to 'make one file' on a huge dataset — one task does all the work.",
        "Partitioning by a high-cardinality column (user_id) → millions of tiny directories.",
        "Tuning memory before looking at skew.",
        "Relying on default 200 shuffle partitions without AQE.",
      ],
      interviewQs: [
        "A Spark job is slow — how do you debug it?",
        "What is data skew and how do you fix it?",
        "repartition vs coalesce?",
        "How do you handle the small-files problem?",
        "How do you size executors?",
      ],
      resources: [
        { t: "Databricks — Comprehensive guide to optimizations", u: "https://www.databricks.com/discover/pages/optimize-data-workloads-guide", k: "article" },
        { t: "Spark docs — Adaptive Query Execution", u: "https://spark.apache.org/docs/latest/sql-performance-tuning.html#adaptive-query-execution", k: "docs" },
      ],
    },
    {
      id: "de-modeling",
      title: "Data Modeling & Warehousing: Kimball, Star Schema, SCDs, OLAP",
      summary: "How analytical data is modeled for fast, understandable queries — facts, dimensions, grain, slowly changing dimensions and OLAP engines.",
      tags: ["warehouse", "modeling", "sql"],
      brushup: [
        "<b>OLTP</b> (row stores, normalized, many small transactions) vs <b>OLAP</b> (columnar, denormalized, big scans and aggregations).",
        "<b>Star schema</b>: central <b>fact</b> table (measurements, foreign keys) + <b>dimension</b> tables (who/what/where/when). Snowflake schema normalizes dimensions.",
        "Always declare the <b>grain</b> first: 'one row per order line' — every fact must match it.",
        "Fact types: transaction, periodic snapshot, accumulating snapshot; additive vs semi-additive (balances) vs non-additive (ratios) measures.",
        "<b>SCD Type 1</b> overwrite; <b>Type 2</b> new row with valid_from/valid_to/is_current (full history); Type 3 previous-value column.",
        "Use <b>surrogate keys</b> in dimensions; conformed dimensions shared across facts enable drill-across.",
        "Other styles: <b>Data Vault</b> (hubs/links/satellites for auditability), <b>One Big Table</b> (wide denormalized for BI speed), medallion bronze/silver/gold.",
        "Columnar warehouses (Snowflake, BigQuery, Redshift) + OLAP engines (ClickHouse, Druid, Pinot) for sub-second user-facing analytics.",
      ],
      detail: `
<h2>Kimball's four steps</h2>
<ol>
<li>Choose the <b>business process</b> (orders, shipments, page views).</li>
<li>Declare the <b>grain</b> (one row per order line item).</li>
<li>Identify the <b>dimensions</b> (date, customer, product, store).</li>
<li>Identify the <b>facts</b> (quantity, amount, discount).</li>
</ol>
<pre><code>             dim_date
                 │
dim_customer ── fact_order_line ── dim_product
                 │
             dim_store
fact_order_line(order_line_id, date_key, customer_key, product_key, store_key, qty, amount)</code></pre>

<h2>Slowly changing dimensions</h2>
<table>
<tr><th>Type</th><th>Behaviour</th><th>Use when</th></tr>
<tr><td>0</td><td>Never changes</td><td>Date of birth</td></tr>
<tr><td>1</td><td>Overwrite</td><td>Typos, history irrelevant</td></tr>
<tr><td>2</td><td>New row + validity range + current flag</td><td>Customer moves city and historical sales must stay in the old city</td></tr>
<tr><td>3</td><td>Previous value column</td><td>Only the last change matters</td></tr>
<tr><td>4/6</td><td>History table / hybrid</td><td>Fast current lookups + full history</td></tr>
</table>
<pre><code>-- SCD2 merge (simplified)
MERGE INTO dim_customer d
USING staged s ON d.customer_id = s.customer_id AND d.is_current
WHEN MATCHED AND d.city &lt;&gt; s.city THEN
  UPDATE SET is_current = false, valid_to = s.updated_at
WHEN NOT MATCHED THEN
  INSERT (customer_id, city, valid_from, valid_to, is_current)
  VALUES (s.customer_id, s.city, s.updated_at, '9999-12-31', true);
-- a second pass inserts the new current rows for changed customers</code></pre>

<h2>Columnar storage — why OLAP is fast</h2>
<ul>
<li>Read only the columns a query touches; values of one column compress extremely well (dictionary, RLE, delta).</li>
<li>Vectorized execution over column batches; min/max statistics per block skip data (zone maps).</li>
<li>Clustering/sorting on common filter columns multiplies pruning.</li>
</ul>

<h2>Choosing a serving layer</h2>
<table>
<tr><th>Need</th><th>Choice</th></tr>
<tr><td>Internal BI, ad-hoc SQL, big joins</td><td>Snowflake / BigQuery / Redshift / Databricks SQL</td></tr>
<tr><td>User-facing analytics, sub-second, high concurrency</td><td>ClickHouse, Apache Pinot, Druid</td></tr>
<tr><td>Point lookups by key at scale</td><td>Key-value store (DynamoDB, Cassandra, Redis)</td></tr>
</table>

<h2>Medallion layers</h2>
<p><b>Bronze</b> = raw as ingested; <b>Silver</b> = cleaned, deduplicated, conformed; <b>Gold</b> = business-level marts/aggregates. It maps well to data contracts and access control.</p>`,
      pitfalls: [
        "Mixing grains in one fact table (orders and order lines).",
        "Using natural keys from source systems as dimension keys — breaks with SCD2 and source changes.",
        "Summing semi-additive measures (account balance) across time.",
        "Over-normalizing an analytical model → many joins, slow BI.",
      ],
      interviewQs: [
        "Design the data model for an e-commerce analytics warehouse.",
        "What is the grain of a fact table and why does it matter?",
        "Explain SCD Type 1 vs Type 2 with an example; write the SQL.",
        "Star vs snowflake schema?",
        "Why are columnar databases faster for analytics?",
        "When would you use ClickHouse/Pinot instead of Snowflake?",
      ],
      resources: [
        { t: "The Data Warehouse Toolkit — Ralph Kimball", u: "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/books/data-warehouse-dw-toolkit/", k: "book" },
        { t: "Kimball dimensional modeling techniques", u: "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/", k: "article" },
        { t: "dbt — How we structure our dbt projects", u: "https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview", k: "docs" },
      ],
    },
    {
      id: "de-lakehouse",
      title: "File Formats & Lakehouse Tables: Parquet, Avro, Iceberg, Delta, Hudi",
      summary: "Row vs columnar file formats, and the open table formats that bring ACID transactions, time travel and schema evolution to data lakes.",
      tags: ["parquet", "iceberg", "delta", "lakehouse"],
      brushup: [
        "<b>Parquet/ORC</b>: columnar, compressed, with min/max stats per row group → predicate pushdown + column pruning. Default for analytics.",
        "<b>Avro</b>: row-based, schema embedded/registered, great schema evolution → messages in Kafka, landing raw records.",
        "JSON/CSV: human-readable, no types, slow and large — only at the edges.",
        "Plain files on S3 lack atomic commits, consistent listing and safe concurrent writers → <b>table formats</b> add a transactional metadata layer.",
        "<b>Iceberg</b>: metadata tree (metadata.json → manifest list → manifests → data files); hidden partitioning, partition evolution, snapshot isolation, time travel.",
        "<b>Delta Lake</b>: ordered JSON transaction log (_delta_log) + checkpoints; tight Spark/Databricks integration; OPTIMIZE/Z-ORDER.",
        "<b>Hudi</b>: upsert-heavy workloads; copy-on-write vs merge-on-read tables.",
        "Maintenance: compaction of small files, expiring snapshots, removing orphan files.",
      ],
      detail: `
<h2>Parquet internals</h2>
<pre><code>file
 ├─ row group 1 (≈128 MB)
 │    ├─ column chunk "user_id"  → pages (dictionary/RLE encoded, compressed) + min/max stats
 │    └─ column chunk "amount"   → pages ...
 ├─ row group 2 ...
 └─ footer: schema + row group metadata (stats used for skipping)</code></pre>
<p>A query <code>WHERE amount &gt; 1000</code> reads the footer, skips row groups whose max amount ≤ 1000 and reads only the needed column chunks.</p>

<h2>Why table formats exist</h2>
<ul>
<li>Writers replace many files — readers must never see a half-written state (<b>atomicity</b>).</li>
<li>Listing millions of files in object storage is slow — track files in metadata instead.</li>
<li>Concurrent writers need <b>optimistic concurrency</b> (commit fails if someone committed first; retry).</li>
<li>Schema and partitioning change over years — evolve without rewriting data.</li>
<li>Reproducibility and debugging need <b>time travel</b> (query as of a snapshot).</li>
</ul>

<h2>Iceberg vs Delta vs Hudi</h2>
<table>
<tr><th></th><th>Iceberg</th><th>Delta Lake</th><th>Hudi</th></tr>
<tr><td>Metadata</td><td>Snapshot tree of manifests</td><td>Transaction log + checkpoints</td><td>Timeline of instants</td></tr>
<tr><td>Strength</td><td>Engine-neutral, hidden partitioning, partition evolution</td><td>Spark/Databricks ecosystem, simplicity</td><td>Record-level upserts, incremental pulls</td></tr>
<tr><td>Engines</td><td>Spark, Flink, Trino, Snowflake, BigQuery, Athena</td><td>Spark, Trino, Flink (delta-rs, UniForm)</td><td>Spark, Flink, Presto</td></tr>
</table>

<h2>Row-level changes</h2>
<ul>
<li><b>Copy-on-write</b>: an update rewrites the affected data files — fast reads, slow writes.</li>
<li><b>Merge-on-read</b>: write delete/delta files, merge at read time; compact periodically — fast writes, slower reads.</li>
<li>MERGE INTO for CDC upserts from Kafka/Debezium streams.</li>
</ul>

<h2>Table maintenance</h2>
<pre><code>-- Iceberg (Spark procedures)
CALL system.rewrite_data_files('db.events');           -- compact small files
CALL system.expire_snapshots('db.events', TIMESTAMP '2026-09-01');
CALL system.remove_orphan_files(table =&gt; 'db.events');
-- Delta
OPTIMIZE events ZORDER BY (user_id);
VACUUM events RETAIN 168 HOURS;</code></pre>`,
      pitfalls: [
        "Streaming writes creating thousands of tiny files per hour without compaction.",
        "Never expiring snapshots → metadata and storage grow forever.",
        "Using CSV/JSON as the analytical storage format.",
        "Partitioning by a high-cardinality column in Hive-style tables.",
      ],
      interviewQs: [
        "Parquet vs Avro — when would you use each?",
        "How does predicate pushdown work with Parquet?",
        "What problems do Iceberg/Delta solve over plain Parquet files on S3?",
        "Copy-on-write vs merge-on-read?",
        "How would you implement CDC upserts into a lakehouse table?",
      ],
      resources: [
        { t: "Apache Iceberg — Spec & docs", u: "https://iceberg.apache.org/docs/latest/", k: "docs" },
        { t: "Delta Lake documentation", u: "https://docs.delta.io/latest/index.html", k: "docs" },
        { t: "Apache Parquet — file format", u: "https://parquet.apache.org/docs/file-format/", k: "docs" },
      ],
    },
    {
      id: "de-orchestration",
      title: "Orchestration, dbt, Data Quality & Observability",
      summary: "Scheduling and dependency management with Airflow, SQL transformation with dbt, and the tests, contracts and monitors that keep data trustworthy.",
      tags: ["airflow", "dbt", "data-quality"],
      brushup: [
        "<b>Airflow</b>: DAGs of tasks in Python; scheduler, executor (Celery/Kubernetes), metadata DB; tasks should be <b>idempotent</b> and operate on a <b>logical date</b> partition.",
        "Backfills and catchup re-run past intervals — only safe with idempotent tasks (overwrite partition, MERGE).",
        "Sensors wait for upstream data (prefer deferrable sensors); XCom only for small metadata.",
        "<b>dbt</b>: SELECT-based models, ref() builds the DAG, materializations (view, table, incremental, ephemeral), tests, docs and lineage.",
        "Data quality dimensions: <b>freshness, volume, schema, distribution, uniqueness, referential integrity</b>.",
        "<b>Data contracts</b>: producer-owned schema + semantics + SLAs, enforced in CI and the schema registry.",
        "Write-audit-publish: write to staging, run checks, then atomically publish.",
        "Alternatives: Dagster (asset-based, typed), Prefect (Pythonic dynamic flows).",
      ],
      detail: `
<h2>An idempotent Airflow DAG</h2>
<pre><code>from airflow.decorators import dag, task
import pendulum

@dag(schedule="@daily", start_date=pendulum.datetime(2026, 1, 1), catchup=True, max_active_runs=3)
def orders_daily():
    @task(retries=3, retry_delay=pendulum.duration(minutes=5))
    def extract(ds=None):                 # ds = logical date, e.g. 2026-09-29
        return f"s3://raw/orders/dt={ds}/"

    @task
    def load(path: str, ds=None):
        # overwrite the partition → re-runs and backfills are safe
        spark_sql(f"INSERT OVERWRITE TABLE silver.orders PARTITION (dt='{ds}') SELECT ... FROM parquet.\`{path}\`")

    load(extract())
orders_daily()</code></pre>
<p>Principles: tasks are <b>atomic and idempotent</b>, parameterized by the logical date, never use <code>now()</code> for data selection, keep heavy compute out of the scheduler (push to Spark/warehouse).</p>

<h2>dbt essentials</h2>
<pre><code>-- models/marts/fct_orders.sql
{{ config(materialized='incremental', unique_key='order_id') }}
select o.order_id, o.customer_id, o.amount, o.created_at
from {{ ref('stg_orders') }} o
{% if is_incremental() %}
  where o.created_at &gt; (select max(created_at) from {{ this }})
{% endif %}</code></pre>
<pre><code># models/marts/schema.yml
models:
  - name: fct_orders
    columns:
      - name: order_id
        tests: [unique, not_null]
      - name: customer_id
        tests:
          - relationships: {to: ref('dim_customer'), field: customer_id}</code></pre>
<p>Layering: <b>staging</b> (1:1 with sources, renames/casts) → <b>intermediate</b> → <b>marts</b> (facts/dimensions). Run <code>dbt build</code> in CI on changed models (slim CI with state:modified+).</p>

<h2>Data quality & observability</h2>
<table>
<tr><th>Check</th><th>Example</th></tr>
<tr><td>Freshness</td><td>Latest partition &lt; 2h old</td></tr>
<tr><td>Volume</td><td>Row count within ±30% of 7-day average</td></tr>
<tr><td>Schema</td><td>No dropped/renamed columns vs contract</td></tr>
<tr><td>Validity</td><td>amount ≥ 0, country in ISO list</td></tr>
<tr><td>Uniqueness</td><td>order_id unique</td></tr>
<tr><td>Referential</td><td>Every fact customer_id exists in dim_customer</td></tr>
</table>
<p>Pattern: <b>write-audit-publish</b> — write to a staging branch/table (Iceberg branches, Delta clones), run checks, publish atomically; failed data never reaches consumers. Track <b>lineage</b> (OpenLineage) so you know who is affected by an incident.</p>`,
      pitfalls: [
        "Tasks that append without dedupe → backfills double the data.",
        "Doing heavy processing inside Airflow workers instead of pushing down to Spark/warehouse.",
        "Tests only on the final mart, none on sources — garbage in, garbage out discovered too late.",
        "Huge XComs (dataframes) in the metadata DB.",
      ],
      interviewQs: [
        "How do you make an Airflow task idempotent?",
        "How would you backfill a year of data safely?",
        "What is an incremental model in dbt and how does it work?",
        "What data quality checks would you put on a critical pipeline?",
        "What is a data contract?",
      ],
      resources: [
        { t: "Airflow best practices", u: "https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html", k: "docs" },
        { t: "dbt documentation", u: "https://docs.getdbt.com/docs/introduction", k: "docs" },
        { t: "Great Expectations docs", u: "https://docs.greatexpectations.io/docs/", k: "docs" },
      ],
    },
    {
      id: "de-cdc",
      title: "CDC, Outbox & Streaming Patterns",
      summary: "Capturing database changes as events (Debezium), the transactional outbox, stream-table duality, streaming joins, dedup and enrichment patterns.",
      tags: ["cdc", "debezium", "patterns"],
      brushup: [
        "<b>CDC</b> reads the DB's replication log (MySQL binlog, Postgres WAL/logical decoding) → every insert/update/delete as an event; no dual writes, low source load.",
        "<b>Debezium</b> (Kafka Connect) emits before/after images, op type and source metadata; initial <b>snapshot</b> then streaming.",
        "Polling CDC (updated_at queries) misses deletes and intermediate updates.",
        "<b>Dual writes</b> (DB + Kafka in app code) are unsafe; use the <b>transactional outbox</b>: write the event to an outbox table in the same transaction, relay it via CDC.",
        "<b>Stream–table duality</b>: a table is the latest state of a changelog stream; a stream is the history of a table.",
        "Patterns: dedup by event ID with TTL state, enrichment via lookup/temporal join, sessionization, top-K, fraud rules with CEP.",
        "Ordering: key CDC events by primary key so all changes to a row go to one partition.",
      ],
      detail: `
<h2>Debezium event (simplified)</h2>
<pre><code>{
  "before": {"id": 42, "status": "PENDING"},
  "after":  {"id": 42, "status": "PAID"},
  "op": "u",                       // c=create, u=update, d=delete, r=snapshot read
  "source": {"db": "shop", "table": "orders", "lsn": 283746, "ts_ms": 1790000000000},
  "ts_ms": 1790000000123
}</code></pre>

<h2>Transactional outbox</h2>
<pre><code>BEGIN;
  UPDATE orders SET status = 'PAID' WHERE id = 42;
  INSERT INTO outbox(id, aggregate_type, aggregate_id, type, payload)
       VALUES (gen_random_uuid(), 'order', 42, 'OrderPaid', '{...}');
COMMIT;
-- Debezium outbox event router streams outbox rows → topic "order.events", keyed by aggregate_id</code></pre>
<p>The state change and the event are atomic. Consumers must still be idempotent (events can be delivered more than once).</p>

<h2>Common streaming patterns</h2>
<table>
<tr><th>Pattern</th><th>How</th></tr>
<tr><td>Deduplication</td><td>keyBy(eventId) + ValueState seen-flag with TTL</td></tr>
<tr><td>Enrichment</td><td>Broadcast small dimension; async I/O lookup with cache; temporal join with CDC table</td></tr>
<tr><td>Sessionization</td><td>Session windows per user with inactivity gap</td></tr>
<tr><td>Running top-K</td><td>Per-window aggregate then global top-K operator</td></tr>
<tr><td>Rules/fraud</td><td>Keyed state machines, CEP patterns, broadcast rules</td></tr>
<tr><td>Materialized views</td><td>CDC → stream processor → upsert into serving store</td></tr>
</table>

<h2>Operational concerns</h2>
<ul>
<li>Postgres logical replication slots retain WAL until consumed — a stuck connector can fill the disk. Monitor slot lag.</li>
<li>Schema changes on the source must flow through the schema registry compatibly.</li>
<li>Snapshots of big tables: incremental snapshotting (Debezium signal table) avoids long locks.</li>
<li>Deletes → tombstones for compacted topics.</li>
</ul>`,
      pitfalls: [
        "Dual writes to DB and Kafka — one succeeds, the other fails, systems diverge.",
        "Unmonitored replication slot growing until the primary runs out of disk.",
        "Keying CDC events randomly → updates to the same row processed out of order.",
        "Assuming CDC gives business events — it gives row changes; derive domain events deliberately (outbox).",
      ],
      interviewQs: [
        "What is CDC and how does Debezium work?",
        "Why are dual writes dangerous and how does the outbox pattern fix it?",
        "Explain stream–table duality.",
        "How would you deduplicate events in a streaming pipeline?",
        "How would you build a real-time materialized view of orders for a dashboard?",
      ],
      resources: [
        { t: "Debezium documentation", u: "https://debezium.io/documentation/reference/stable/index.html", k: "docs" },
        { t: "microservices.io — Transactional outbox", u: "https://microservices.io/patterns/data/transactional-outbox.html", k: "article" },
        { t: "Turning the database inside-out — Martin Kleppmann", u: "https://martin.kleppmann.com/2015/03/04/turning-the-database-inside-out.html", k: "article" },
      ],
    },
  ],
});
