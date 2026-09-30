/* Distributed Systems — the theory behind every system design answer. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "distributed",
  title: "Distributed Systems",
  icon: "🌐",
  blurb: "Failure models, replication, consensus, clocks, consistency models, distributed transactions, partitioning, coordination and resilience patterns.",
  topics: [
    {
      id: "ds-fundamentals",
      title: "Distributed Systems Fundamentals: Failures, Networks & the 8 Fallacies",
      summary: "Why distributed systems are hard: partial failure, unreliable networks, no shared clock — and the assumptions you must not make.",
      tags: ["fundamentals", "must-know"],
      brushup: [
        "A distributed system = independent nodes communicating over a network, appearing as one system. Hard because of <b>partial failure</b>: some parts fail while others work.",
        "The <b>8 fallacies</b>: network is reliable, latency is zero, bandwidth is infinite, network is secure, topology doesn't change, one administrator, transport cost is zero, network is homogeneous.",
        "Failure models: <b>crash-stop</b>, <b>crash-recovery</b>, <b>omission</b>, <b>Byzantine</b> (arbitrary/malicious). Most datacenter systems assume crash-recovery.",
        "Timing models: synchronous (bounded delays), <b>asynchronous</b> (no bounds), <b>partially synchronous</b> (bounded most of the time) — real systems.",
        "You <b>cannot distinguish</b> a slow node from a dead one → timeouts are guesses → need leases, fencing, idempotency.",
        "<b>FLP impossibility</b>: no deterministic consensus in a fully asynchronous system with even one crash — practical protocols rely on timeouts (partial synchrony).",
        "Two Generals problem: no protocol guarantees agreement over an unreliable channel → exactly-once delivery is impossible; exactly-once <i>processing</i> uses idempotency.",
      ],
      detail: `
<h2>Why it's hard</h2>
<p>On one machine, an operation either happens or the whole machine crashes. In a distributed system a request can be <b>lost</b>, <b>delayed</b>, <b>duplicated</b>, or <b>succeed but the reply is lost</b>. The client sees the same thing in all cases: a timeout.</p>
<pre><code>client ──request──► server        outcomes the client cannot tell apart:
       ◄──(nothing)──              1. request lost      2. server crashed before acting
                                   3. server slow       4. server acted, reply lost</code></pre>
<p>Consequence: every remote call needs a <b>timeout</b>, a <b>retry policy</b>, and the operation must be <b>idempotent</b> so retries are safe.</p>

<h2>The eight fallacies (Deutsch/Gosling)</h2>
<ol>
<li>The network is reliable</li><li>Latency is zero</li><li>Bandwidth is infinite</li><li>The network is secure</li>
<li>Topology doesn't change</li><li>There is one administrator</li><li>Transport cost is zero</li><li>The network is homogeneous</li>
</ol>

<h2>Failure & timing models</h2>
<table>
<tr><th>Model</th><th>Meaning</th><th>Handled by</th></tr>
<tr><td>Crash-stop</td><td>Node halts forever</td><td>Replication, failover</td></tr>
<tr><td>Crash-recovery</td><td>Node restarts, may lose in-memory state</td><td>Durable logs (WAL), rejoin protocols</td></tr>
<tr><td>Omission</td><td>Messages dropped</td><td>Retries, acknowledgements</td></tr>
<tr><td>Byzantine</td><td>Arbitrary/malicious behaviour</td><td>BFT protocols (PBFT), blockchains — rare inside a company</td></tr>
</table>

<h2>Timeouts and failure detection</h2>
<ul>
<li>Too short → false positives, unnecessary failovers, split brain risk. Too long → slow recovery.</li>
<li><b>Phi accrual detector</b> (Cassandra, Akka): outputs a suspicion level based on heartbeat inter-arrival history.</li>
<li>Gray failures: node is "up" but degraded (slow disk, packet loss) — health checks must test real work.</li>
</ul>

<h2>Key impossibility results (know the names)</h2>
<ul>
<li><b>FLP (1985)</b>: consensus impossible deterministically in async systems with one faulty process → Raft/Paxos guarantee safety always, liveness only when the network behaves.</li>
<li><b>CAP</b>: under a partition choose consistency or availability.</li>
<li><b>Two Generals</b>: no certainty over lossy links → end-to-end acknowledgements + idempotency.</li>
</ul>`,
      pitfalls: [
        "Treating a timeout as 'the operation failed' — it may have succeeded.",
        "Retrying non-idempotent operations (double charges).",
        "Health checks that only test that the process is alive.",
        "Assuming clocks on different machines agree.",
      ],
      interviewQs: [
        "Why are distributed systems hard? Give concrete failure scenarios.",
        "What are the fallacies of distributed computing?",
        "How can a client tell whether a timed-out request was executed?",
        "What does FLP impossibility mean in practice?",
        "Is exactly-once delivery possible? How do systems claim exactly-once?",
      ],
      resources: [
        { t: "Designing Data-Intensive Applications — ch. 8 'The trouble with distributed systems'", u: "https://dataintensive.net/", k: "book" },
        { t: "MIT 6.824 Distributed Systems (lectures + labs)", u: "https://pdos.csail.mit.edu/6.824/", k: "course" },
        { t: "Distributed Systems for fun and profit (free)", u: "https://book.mixu.net/distsys/", k: "book" },
        { t: "Martin Kleppmann — Distributed Systems lecture series", u: "https://www.youtube.com/playlist?list=PLeKd45zvjcDFUEv_ohr_HdUFe97RItdiB", k: "video" },
      ],
    },
    {
      id: "ds-replication",
      title: "Replication: Leader-Follower, Multi-Leader, Leaderless & Quorums",
      summary: "Keeping copies of data on multiple nodes for availability and read scale — and the consistency problems each replication style creates.",
      tags: ["replication", "quorum", "must-know"],
      brushup: [
        "<b>Single-leader</b>: all writes to the leader, replicated to followers via a log. Simple, strong ordering; the leader is a write bottleneck and failover is tricky.",
        "<b>Synchronous</b> replication = no data loss on failover but higher latency; <b>asynchronous</b> = fast but can lose recent writes; <b>semi-sync</b> = one sync follower.",
        "<b>Replication lag</b> anomalies: read-your-writes, monotonic reads, consistent prefix reads.",
        "<b>Multi-leader</b>: writes in several datacenters; needs <b>conflict resolution</b> (LWW, merge, CRDTs, app logic).",
        "<b>Leaderless</b> (Dynamo, Cassandra): write to N replicas, succeed after W acks; read from R; <b>R + W &gt; N</b> → quorum overlap.",
        "Repair: <b>read repair</b>, <b>hinted handoff</b>, <b>anti-entropy</b> with Merkle trees.",
        "Failover risks: lost async writes, <b>split brain</b> (two leaders), stale leader still serving → fencing.",
      ],
      detail: `
<h2>Single-leader replication</h2>
<pre><code>clients ──writes──► Leader ──replication log──► Follower 1 ──reads──► clients
                            └──────────────────► Follower 2 ──reads──►</code></pre>
<p>Log shipping methods: statement-based (fragile: NOW(), RAND()), <b>WAL shipping</b> (tied to storage format), <b>logical/row-based</b> (MySQL binlog row format, Postgres logical replication — also powers CDC).</p>

<h2>Replication lag problems and fixes</h2>
<table>
<tr><th>Anomaly</th><th>Example</th><th>Fix</th></tr>
<tr><td>Read-your-writes</td><td>User updates profile, refreshes, sees old value</td><td>Read own data from leader for a while; track last write LSN</td></tr>
<tr><td>Monotonic reads</td><td>Comment appears then disappears (two different replicas)</td><td>Pin a user to one replica</td></tr>
<tr><td>Consistent prefix</td><td>Answer seen before question</td><td>Causally related writes to the same partition</td></tr>
</table>

<h2>Failover</h2>
<ol>
<li>Detect leader failure (timeout).</li><li>Elect the most up-to-date follower (consensus).</li><li>Reconfigure clients and the old leader.</li>
</ol>
<p>Risks: unreplicated writes lost (async), the old leader coming back believing it's still leader (<b>split brain</b>) → use <b>fencing tokens</b>/epochs, STONITH.</p>

<h2>Multi-leader</h2>
<p>Use cases: multi-datacenter active-active, offline clients (calendars, notes apps), collaborative editing. Conflicts are inevitable:</p>
<ul>
<li><b>Last-write-wins</b> by timestamp — simple, silently loses data.</li>
<li><b>Merge</b> values (union of sets), <b>CRDTs</b>, <b>operational transformation</b> (Google Docs).</li>
<li>Application resolution on read (Dynamo shopping cart via vector clocks).</li>
</ul>

<h2>Leaderless & quorums</h2>
<pre><code>N = 3 replicas, W = 2, R = 2  →  R + W = 4 &gt; 3: every read quorum overlaps the latest write quorum
W = 1, R = 1 → fast, eventually consistent
W = N, R = 1 → fast reads, writes fail if any replica is down</code></pre>
<ul>
<li><b>Sloppy quorum + hinted handoff</b>: if home replicas are unreachable, write to others temporarily (higher availability, weaker guarantee).</li>
<li>Even with R + W &gt; N, edge cases (concurrent writes, failed partial writes, sloppy quorums) mean it isn't linearizable.</li>
<li>Cassandra consistency levels: ONE, QUORUM, LOCAL_QUORUM, ALL; per-query tunable.</li>
</ul>`,
      pitfalls: [
        "Async replication + automatic failover = silently lost writes.",
        "Believing R + W > N gives linearizability.",
        "LWW with unsynchronized clocks dropping legitimate writes.",
        "Reading from a follower right after a write without read-your-writes handling.",
      ],
      interviewQs: [
        "Compare synchronous and asynchronous replication.",
        "What problems does replication lag cause and how do you mitigate them?",
        "How does a leaderless system like Cassandra handle reads and writes?",
        "Explain R + W > N.",
        "How do multi-leader systems resolve write conflicts?",
        "What is split brain and how do you prevent it?",
      ],
      resources: [
        { t: "DDIA — ch. 5 Replication", u: "https://dataintensive.net/", k: "book" },
        { t: "Amazon Dynamo paper (2007)", u: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf", k: "paper" },
        { t: "Cassandra — data replication & consistency", u: "https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html", k: "docs" },
      ],
    },
    {
      id: "ds-consensus",
      title: "Consensus: Raft, Paxos, ZAB",
      summary: "How a group of nodes agrees on a single ordered log despite crashes — the foundation of leader election, config stores and replicated state machines.",
      tags: ["raft", "paxos", "consensus", "must-know"],
      brushup: [
        "Consensus: nodes agree on a value/sequence; properties: <b>agreement</b>, <b>validity</b>, <b>termination</b>. Tolerates f failures with <b>2f + 1</b> nodes (majority quorum).",
        "<b>Replicated state machine</b>: agree on an ordered log of commands; every node applies it deterministically.",
        "Raft roles: <b>leader</b>, <b>follower</b>, <b>candidate</b>; time split into <b>terms</b>; randomized election timeouts avoid split votes.",
        "Raft log replication: leader appends, sends AppendEntries, entry <b>committed</b> once a majority stores it; then applied.",
        "Safety: a candidate only wins if its log is at least as up-to-date as a majority (election restriction) → committed entries never lost.",
        "Paxos: proposers/acceptors/learners, prepare/promise + accept/accepted; Multi-Paxos elects a stable leader. Raft = Paxos made understandable.",
        "Used by: etcd, Consul, ZooKeeper (ZAB), Kafka KRaft, CockroachDB, TiKV, Spanner (Paxos).",
        "Consensus is expensive (majority round trips) → use it for metadata/coordination, not every data write (unless you need linearizability).",
      ],
      detail: `
<h2>Raft in three parts</h2>
<h3>1. Leader election</h3>
<pre><code>follower ──(election timeout 150–300ms, no heartbeat)──► candidate: term++, vote for self, RequestVote to all
candidate ──(majority votes)──► leader: send heartbeats (empty AppendEntries)
candidate ──(sees higher term or new leader)──► follower</code></pre>
<p>Each node votes at most once per term. Randomized timeouts make simultaneous candidacies rare.</p>
<h3>2. Log replication</h3>
<pre><code>client → leader: append (term=5, idx=12, "x=3")
leader → followers: AppendEntries(prevIdx=11, prevTerm=5, entries=[12])
majority ack → commitIndex = 12 → apply to state machine → reply to client
followers learn commitIndex in the next AppendEntries</code></pre>
<p>The consistency check (prevIdx/prevTerm) makes followers truncate divergent entries and adopt the leader's log.</p>
<h3>3. Safety</h3>
<ul>
<li>Election restriction: voters reject candidates whose log is less up-to-date (compare last term, then last index).</li>
<li>A leader only commits entries from its own term by counting replicas (earlier-term entries commit indirectly).</li>
</ul>

<h2>Cluster sizes</h2>
<table><tr><th>Nodes</th><th>Majority</th><th>Failures tolerated</th></tr>
<tr><td>3</td><td>2</td><td>1</td></tr><tr><td>5</td><td>3</td><td>2</td></tr><tr><td>4</td><td>3</td><td>1 (no gain over 3)</td></tr></table>
<p>Even sizes add cost without adding fault tolerance. Spread nodes across availability zones.</p>

<h2>Practical concerns</h2>
<ul>
<li><b>Log compaction/snapshots</b> keep the log bounded; slow followers get InstallSnapshot.</li>
<li><b>Membership changes</b> via joint consensus or single-server changes.</li>
<li><b>Linearizable reads</b>: go through the log, or ReadIndex (confirm leadership with a heartbeat round), or leader leases (needs bounded clock drift).</li>
<li>Writes cost at least one round trip to a majority → cross-region consensus is slow (tens–hundreds of ms).</li>
</ul>

<h2>Paxos in one paragraph</h2>
<p>Phase 1: a proposer picks ballot n and asks acceptors to <b>promise</b> not to accept lower ballots; they reply with any value already accepted. Phase 2: the proposer sends <b>accept(n, v)</b> using the highest previously-accepted value if any; once a majority accepts, v is chosen. Multi-Paxos skips phase 1 while a leader is stable — which is essentially Raft's leader.</p>`,
      pitfalls: [
        "Running 2 or 4 consensus nodes.",
        "Putting all consensus nodes in one availability zone.",
        "Serving reads from a leader that may have been deposed (stale reads) without ReadIndex/lease.",
        "Using consensus for high-volume data writes when eventual consistency would do.",
      ],
      interviewQs: [
        "Explain how Raft elects a leader and replicates the log.",
        "Why does Raft use randomized election timeouts?",
        "How does Raft guarantee a committed entry is never lost?",
        "Why do consensus clusters have an odd number of nodes?",
        "Raft vs Paxos?",
        "Where does your favourite system use consensus?",
      ],
      resources: [
        { t: "The Raft paper — In Search of an Understandable Consensus Algorithm", u: "https://raft.github.io/raft.pdf", k: "paper" },
        { t: "Raft visualization (The Secret Lives of Data)", u: "https://thesecretlivesofdata.com/raft/", k: "tool" },
        { t: "raft.github.io — implementations & talks", u: "https://raft.github.io/", k: "docs" },
        { t: "Paxos Made Simple — Leslie Lamport", u: "https://lamport.azurewebsites.net/pubs/paxos-simple.pdf", k: "paper" },
      ],
    },
    {
      id: "ds-time",
      title: "Time & Ordering: Clocks, Lamport, Vector Clocks, HLC, TrueTime",
      summary: "Physical clocks drift, so distributed systems order events with logical clocks — or bound uncertainty like Google Spanner.",
      tags: ["clocks", "ordering"],
      brushup: [
        "Physical clocks drift; NTP sync error is typically ms but can jump. <b>Time-of-day</b> clocks can go backwards; use <b>monotonic</b> clocks for durations.",
        "<b>Happens-before</b> (→): a → b if same process order, send→receive, or transitive. Otherwise events are <b>concurrent</b>.",
        "<b>Lamport clock</b>: counter incremented on each event, max(local, received)+1 on receive → consistent with causality, but can't detect concurrency.",
        "<b>Vector clock</b>: one counter per node; compare element-wise → detects concurrent (conflicting) updates. Size grows with nodes.",
        "<b>Hybrid Logical Clocks</b>: physical time + logical counter — close to wall time, causally consistent (CockroachDB, YugabyteDB).",
        "<b>TrueTime</b> (Spanner): API returns [earliest, latest]; commit-wait until uncertainty passes → external consistency with GPS/atomic clocks.",
        "Never use LWW timestamps from unsynchronized clients as the source of truth.",
      ],
      detail: `
<h2>Lamport clocks</h2>
<pre><code>on local event:   L = L + 1
on send(m):       L = L + 1; attach L
on receive(m,Lm): L = max(L, Lm) + 1
Total order: sort by (L, nodeId)</code></pre>
<p>If a → b then L(a) &lt; L(b). The converse is false: L(a) &lt; L(b) doesn't mean a caused b.</p>

<h2>Vector clocks</h2>
<pre><code>Nodes A, B, C. Each keeps V = [a, b, c].
A writes x:        VA = [1,0,0]
B receives, writes: VB = [1,1,0]   → VB dominates VA (descendant)
C (saw only VA) writes: VC = [1,0,1]
VB vs VC: neither ≤ the other → concurrent → conflict to resolve (Dynamo returns both "siblings")</code></pre>

<h2>Hybrid logical clocks (HLC)</h2>
<p>Timestamp = (physical_ms, logical). Stays within clock skew of real time, preserves happens-before, fits in 64 bits. Used for MVCC timestamps in CockroachDB; combined with a max-offset bound and uncertainty intervals to provide serializable transactions.</p>

<h2>Spanner's TrueTime</h2>
<ul>
<li><code>TT.now()</code> returns an interval [earliest, latest], with ε ≈ a few ms thanks to GPS + atomic clocks.</li>
<li>A transaction picks commit timestamp s = TT.now().latest and <b>waits</b> until TT.now().earliest &gt; s before releasing locks (commit wait ≈ 2ε).</li>
<li>Result: if T1 commits before T2 starts (in real time), T1's timestamp &lt; T2's → <b>external consistency</b> (linearizability for transactions).</li>
</ul>

<h2>Practical rules</h2>
<ul>
<li>Measure elapsed time with monotonic clocks (<code>System.nanoTime()</code>, <code>time.monotonic()</code>).</li>
<li>Use server-assigned sequence numbers or logical versions for ordering and optimistic concurrency.</li>
<li>If you must use wall time (LWW), synchronize clocks and accept data loss on conflicts — or use CRDTs.</li>
</ul>`,
      pitfalls: [
        "Using wall-clock timestamps to order writes from different servers.",
        "Measuring timeouts with System.currentTimeMillis() (can jump).",
        "Unbounded vector clocks in systems with many clients.",
      ],
      interviewQs: [
        "Why can't we rely on physical clocks for ordering?",
        "Explain Lamport clocks and their limitation.",
        "How do vector clocks detect concurrent updates?",
        "How does Spanner achieve external consistency?",
        "What is a hybrid logical clock?",
      ],
      resources: [
        { t: "Time, Clocks, and the Ordering of Events — Lamport (1978)", u: "https://lamport.azurewebsites.net/pubs/time-clocks.pdf", k: "paper" },
        { t: "Spanner: Google's Globally-Distributed Database", u: "https://research.google/pubs/spanner-googles-globally-distributed-database-2/", k: "paper" },
        { t: "DDIA — ch. 8 Unreliable clocks", u: "https://dataintensive.net/", k: "book" },
      ],
    },
    {
      id: "ds-consistency-models",
      title: "Consistency Models: Linearizability to Eventual Consistency",
      summary: "The precise guarantees a replicated system can give about what reads return — from strongest (linearizable) to weakest (eventual) — and their cost.",
      tags: ["consistency", "CAP", "must-know"],
      brushup: [
        "<b>Linearizability</b>: every operation appears to take effect atomically at one instant between its start and end; reads see the latest write. Needed for locks, leader election, uniqueness constraints.",
        "<b>Sequential consistency</b>: all nodes see the same order, consistent with each client's program order (not real time).",
        "<b>Causal consistency</b>: causally related operations are seen in order by everyone; concurrent ones may differ. Strongest model that stays available under partitions.",
        "<b>Session guarantees</b>: read-your-writes, monotonic reads, monotonic writes, writes-follow-reads.",
        "<b>Eventual consistency</b>: if writes stop, replicas converge. No ordering guarantee meanwhile.",
        "Transaction isolation (serializable, snapshot) is a <b>different axis</b> from replica consistency; <b>strict serializability</b> = serializable + linearizable.",
        "CAP: under a partition, linearizability and availability can't both hold. <b>PACELC</b>: else, trade latency vs consistency.",
      ],
      detail: `
<h2>The spectrum</h2>
<pre><code>strict serializability ─ linearizability ─ sequential ─ causal ─ session guarantees ─ eventual
      stronger, slower, less available  ◄──────────────────────►  weaker, faster, more available</code></pre>

<h2>Linearizability example</h2>
<pre><code>Client A:  write(x=1) |-------------|
Client B:                  read(x) |----| → must return 1 if its start is after A's write completed
Client C:        read(x) |------|        → overlapping: may return 0 or 1, but once any read returns 1, later reads can't return 0</code></pre>
<p>Implementations: single leader with synchronous reads from the leader (and fencing), consensus (Raft/Paxos). Not: async replicas, multi-leader, most leaderless setups.</p>

<h2>Where each model fits</h2>
<table>
<tr><th>Need</th><th>Model</th></tr>
<tr><td>Distributed lock, leader election, unique username, bank balance check</td><td>Linearizable</td></tr>
<tr><td>Comments and replies, chat threads</td><td>Causal</td></tr>
<tr><td>User sees their own profile edit</td><td>Read-your-writes</td></tr>
<tr><td>Like counts, view counters, recommendations</td><td>Eventual</td></tr>
</table>

<h2>CAP, correctly stated</h2>
<ul>
<li>C = linearizability, A = every request to a non-failed node gets a (non-error) response, P = network partitions happen (not optional).</li>
<li>So the real choice is <b>CP</b> (refuse some requests during a partition: ZooKeeper, etcd, HBase, Spanner) or <b>AP</b> (serve possibly stale data: Cassandra, DynamoDB default, CouchDB).</li>
<li><b>PACELC</b> (Abadi): if Partition → A or C; Else → Latency or Consistency. DynamoDB/Cassandra: PA/EL. Spanner: PC/EC.</li>
</ul>

<h2>Tunable consistency</h2>
<p>Many stores let you choose per request: DynamoDB <code>ConsistentRead=true</code>, Cassandra QUORUM vs ONE, MongoDB read/write concerns (majority, linearizable), Cosmos DB's five levels (strong, bounded staleness, session, consistent prefix, eventual).</p>`,
      pitfalls: [
        "Saying 'we chose AP so we have no consistency' — you still pick session/causal guarantees.",
        "Confusing ACID's C (invariants) with CAP's C (linearizability).",
        "Assuming serializable transactions imply linearizable reads across replicas.",
      ],
      interviewQs: [
        "What is linearizability? Give a case where you need it.",
        "Explain CAP and PACELC with real databases as examples.",
        "What's the difference between serializability and linearizability?",
        "Which consistency model would you choose for a social feed, and why?",
        "How does Cosmos DB/DynamoDB let you tune consistency?",
      ],
      resources: [
        { t: "Jepsen — consistency models map", u: "https://jepsen.io/consistency", k: "article" },
        { t: "Linearizability vs Serializability — Peter Bailis", u: "http://www.bailis.org/blog/linearizability-versus-serializability/", k: "blog" },
        { t: "Please stop calling databases CP or AP — Kleppmann", u: "https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html", k: "article" },
      ],
    },
    {
      id: "ds-transactions",
      title: "Distributed Transactions: 2PC, Sagas, Outbox, Idempotency",
      summary: "Keeping data consistent across services and databases — atomic commit with 2PC, long-running workflows with sagas, and the idempotency that makes retries safe.",
      tags: ["transactions", "saga", "2pc", "must-know"],
      brushup: [
        "<b>Two-phase commit</b>: coordinator asks all participants to <b>prepare</b> (vote), then <b>commit/abort</b>. Atomic but <b>blocking</b> if the coordinator dies after prepare; holds locks; latency.",
        "<b>3PC</b> reduces blocking under synchronous assumptions; rarely used. Modern DBs combine 2PC with consensus (Spanner: each participant is a Paxos group).",
        "<b>Saga</b>: a sequence of local transactions, each with a <b>compensating action</b>; eventual consistency; no isolation (need semantic locks/countermeasures).",
        "Choreography (services react to events) vs <b>orchestration</b> (central workflow engine — Temporal, Step Functions, Camunda).",
        "<b>Transactional outbox</b> + CDC/relay to publish events atomically with state changes.",
        "<b>Idempotency keys</b>: client sends a unique key; server stores the result per key and returns it on retries.",
        "Exactly-once processing = at-least-once delivery + idempotent handling (dedupe by message ID).",
      ],
      detail: `
<h2>Two-phase commit</h2>
<pre><code>Coordinator                    Participants (DB1, DB2)
  ── PREPARE ───────────────►  write redo/undo, lock rows, vote YES/NO
  ◄── YES / YES ─────────────
  (log decision COMMIT)
  ── COMMIT ────────────────►  make durable, release locks
  ◄── ACK ───────────────────</code></pre>
<p>If the coordinator crashes after participants voted YES, they're <b>in doubt</b>: they can't commit or abort on their own and keep holding locks until it recovers. XA transactions across heterogeneous systems inherit this problem — which is why microservices avoid them.</p>

<h2>Sagas</h2>
<pre><code>Order saga (orchestrated):
1. OrderService.createOrder (PENDING)      ↩ compensate: cancelOrder
2. PaymentService.charge                   ↩ compensate: refund
3. InventoryService.reserve                ↩ compensate: release
4. OrderService.approve
If step 3 fails → run refund, then cancelOrder.</code></pre>
<ul>
<li>Compensations must be idempotent and <b>semantic</b> (a refund, not a rollback).</li>
<li>Lack of isolation: other transactions see intermediate states → use PENDING states, semantic locks, commutative updates, re-reading values.</li>
<li>Orchestration gives visibility, timeouts and retries in one place; choreography reduces coupling but workflows become implicit.</li>
</ul>

<h2>Idempotency keys (Stripe-style)</h2>
<pre><code>POST /v1/charges
Idempotency-Key: 7b1c...           (client-generated UUID, reused on retry)

server:
  row = SELECT * FROM idempotency WHERE key = ?
  if row and row.status == 'done': return row.response        # replay stored result
  if row and row.status == 'in_progress': return 409           # concurrent retry
  INSERT key (status='in_progress')   -- unique constraint guards races
  result = do_charge()                -- inside the same DB transaction when possible
  UPDATE key SET status='done', response=result
  return result</code></pre>

<h2>Choosing</h2>
<table>
<tr><th>Situation</th><th>Approach</th></tr>
<tr><td>Single database</td><td>Local ACID transaction — don't distribute what you don't have to</td></tr>
<tr><td>One DB + publish an event</td><td>Transactional outbox</td></tr>
<tr><td>Several services, business workflow</td><td>Saga (orchestrated for complex flows)</td></tr>
<tr><td>Need atomic cross-shard transactions</td><td>Database with built-in distributed transactions (Spanner, CockroachDB, Yugabyte)</td></tr>
</table>`,
      pitfalls: [
        "Using 2PC across microservices owned by different teams.",
        "Sagas without compensations for every step, or compensations that can fail silently.",
        "Retrying payment calls without idempotency keys.",
        "Dedup tables without TTL/cleanup growing forever.",
      ],
      interviewQs: [
        "Explain two-phase commit and its failure modes.",
        "What is a saga? Orchestration vs choreography?",
        "Design idempotent payment processing.",
        "How do you publish an event reliably when a DB row changes?",
        "How do you handle lack of isolation in sagas?",
      ],
      resources: [
        { t: "microservices.io — Saga pattern", u: "https://microservices.io/patterns/data/saga.html", k: "article" },
        { t: "Stripe — Designing robust and predictable APIs with idempotency", u: "https://stripe.com/blog/idempotency", k: "blog" },
        { t: "Temporal — durable execution docs", u: "https://docs.temporal.io/", k: "docs" },
      ],
    },
    {
      id: "ds-partitioning",
      title: "Partitioning & Consistent Hashing",
      summary: "Splitting data across nodes for scale: range vs hash partitioning, consistent hashing with virtual nodes, rebalancing, hot keys and secondary indexes.",
      tags: ["sharding", "consistent-hashing", "must-know"],
      brushup: [
        "<b>Range partitioning</b>: contiguous key ranges per partition → efficient range scans; risk of hot ranges (timestamps).",
        "<b>Hash partitioning</b>: hash(key) → even spread, no range scans.",
        "<b>hash mod N</b> remaps almost every key when N changes; <b>consistent hashing</b> remaps only ~K/N keys.",
        "<b>Virtual nodes</b>: each physical node owns many ring positions → balanced load, smooth rebalancing, weighting by capacity.",
        "Alternatives: fixed number of partitions (Kafka, Elasticsearch shards, Redis Cluster's 16,384 slots), dynamic splitting (HBase, DynamoDB).",
        "<b>Hot keys</b>: celebrity problem → salting/splitting keys, caching, write buffering.",
        "Secondary indexes: <b>local</b> (per partition, scatter-gather reads) vs <b>global</b> (partitioned by the indexed term, async updates).",
        "Routing: client-aware, routing tier/proxy, or any node forwards (gossip-based metadata, ZooKeeper).",
      ],
      detail: `
<h2>Consistent hashing</h2>
<pre><code>          0
     N3 ●   ● N1         key k → hash(k) on the ring → walk clockwise → first node
        ring              add N4 between N1 and N2 → only keys in (N1, N4] move to N4
     N2 ●</code></pre>
<pre><code>import bisect, hashlib
class Ring:
    def __init__(self, nodes, vnodes=100):
        self.ring = sorted((self._h(f"{n}#{i}"), n) for n in nodes for i in range(vnodes))
        self.keys = [h for h, _ in self.ring]
    def _h(self, s): return int(hashlib.md5(s.encode()).hexdigest(), 16)
    def node(self, key):
        i = bisect.bisect(self.keys, self._h(key)) % len(self.keys)
        return self.ring[i][1]</code></pre>
<p>Replication on a ring: store on the first N distinct physical nodes clockwise (the "preference list").</p>
<p>Variants: <b>rendezvous (HRW) hashing</b> (pick the node with the highest hash(key, node)), <b>jump consistent hash</b> (no memory, for numbered buckets).</p>

<h2>Rebalancing strategies</h2>
<table>
<tr><th>Strategy</th><th>How</th><th>Examples</th></tr>
<tr><td>Fixed partitions</td><td>Create many more partitions than nodes; move whole partitions</td><td>Redis Cluster (16384 slots), Elasticsearch, Riak</td></tr>
<tr><td>Dynamic split/merge</td><td>Split a partition when it grows too big</td><td>HBase regions, DynamoDB, MongoDB chunks</td></tr>
<tr><td>Proportional to nodes</td><td>Fixed partitions per node, split on join</td><td>Cassandra vnodes</td></tr>
</table>
<p>Throttle data movement; rebalance automatically only with care (a flapping node can trigger cascades).</p>

<h2>Choosing a shard key</h2>
<ul>
<li>High cardinality, evenly distributed, present in most queries (to avoid scatter-gather).</li>
<li>Keep data you query/transact together on the same shard (tenant_id for SaaS, user_id for user data).</li>
<li>Avoid monotonically increasing keys for hash-less range partitioning (all writes hit the last shard).</li>
</ul>

<h2>Hot spots</h2>
<ul><li>Append a random suffix (0–9) to hot keys; reads fan out to all 10 and merge.</li>
<li>Cache hot reads; batch/aggregate hot writes (counters) in memory before flushing.</li>
<li>Detect with per-key metrics; split heavy tenants onto dedicated shards.</li></ul>`,
      pitfalls: [
        "Choosing a shard key that forces every query to hit every shard.",
        "Sharding by timestamp → all writes on one shard.",
        "Consistent hashing without virtual nodes → very uneven load.",
        "Cross-shard transactions and joins introduced casually.",
      ],
      interviewQs: [
        "Explain consistent hashing and why virtual nodes help.",
        "How would you choose a shard key for a multi-tenant SaaS app?",
        "How do you handle a hot partition?",
        "Local vs global secondary indexes?",
        "How would you reshard a live database without downtime?",
      ],
      resources: [
        { t: "Consistent Hashing and Random Trees — Karger et al.", u: "https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf", k: "paper" },
        { t: "DDIA — ch. 6 Partitioning", u: "https://dataintensive.net/", k: "book" },
        { t: "A Fast, Minimal Memory, Consistent Hash Algorithm (jump hash)", u: "https://arxiv.org/abs/1406.2294", k: "paper" },
      ],
    },
    {
      id: "ds-resilience",
      title: "Resilience Patterns: Timeouts, Retries, Circuit Breakers, Backpressure",
      summary: "How services survive slow and failing dependencies without cascading failure — the patterns and the numbers to configure them.",
      tags: ["resilience", "microservices", "must-know"],
      brushup: [
        "Every network call needs a <b>timeout</b> (set from the dependency's p99 + margin) and an overall <b>deadline</b> propagated downstream.",
        "<b>Retries</b> only for transient errors and idempotent operations; <b>exponential backoff + jitter</b>; cap attempts; use a <b>retry budget</b> (e.g. ≤ 10% extra load).",
        "<b>Circuit breaker</b>: closed → open after failure threshold (fail fast) → half-open probes → closed.",
        "<b>Bulkheads</b>: isolate resources (thread pools, connection pools) per dependency so one slow service can't exhaust everything.",
        "<b>Load shedding</b> and <b>rate limiting</b>: reject early (429/503) when overloaded; prioritize critical traffic.",
        "<b>Backpressure</b>: bounded queues; slow consumers signal producers to slow down instead of buffering forever.",
        "<b>Graceful degradation</b>: serve cached/stale/partial results; feature flags to switch off expensive features.",
        "Retry storms and cascading failures come from retries at every layer multiplying load.",
      ],
      detail: `
<h2>Timeouts and deadlines</h2>
<pre><code>Client deadline 800ms ─► API (budget left 780) ─► Service A (budget 700) ─► DB (timeout min(300, remaining))</code></pre>
<p>Propagate the remaining deadline (gRPC does this natively) so downstream work stops when nobody is waiting for the answer.</p>

<h2>Retries done right</h2>
<pre><code>def call_with_retry(fn, attempts=3, base=0.1, cap=2.0):
    for i in range(attempts):
        try:
            return fn()
        except TransientError:
            if i == attempts - 1: raise
            sleep(random.uniform(0, min(cap, base * 2 ** i)))   # "full jitter"</code></pre>
<ul>
<li>Retry only on timeouts, 503, connection resets — never on 400s.</li>
<li>Retry at <b>one layer</b> (usually the edge or the client library), not at every hop: 3 retries × 3 layers = 27× load.</li>
<li>Honor <code>Retry-After</code>; use hedged requests for tail latency (send a second request after p95 delay) only for idempotent reads.</li>
</ul>

<h2>Circuit breaker states</h2>
<pre><code>CLOSED ──(failure rate &gt; 50% over 20 calls)──► OPEN ──(after 30s)──► HALF_OPEN
   ▲                                               │ fail fast          │ allow a few probes
   └──────────────(probes succeed)─────────────────┴──(probe fails)─────┘ back to OPEN</code></pre>
<p>Libraries: Resilience4j (Java), Polly (.NET), Envoy/Istio outlier detection in the mesh.</p>

<h2>Bulkheads, shedding, backpressure</h2>
<ul>
<li>Separate thread/connection pools per dependency; semaphores limit concurrent calls.</li>
<li>Admission control: when queue wait time exceeds X, reject new work — a fast 503 is better than a slow timeout.</li>
<li>Prioritize: drop analytics/prefetch traffic before checkout traffic.</li>
<li>Queues must be <b>bounded</b>; unbounded queues turn overload into memory exhaustion and huge latency.</li>
<li>Reactive streams / gRPC flow control / Kafka pull model provide backpressure.</li>
</ul>

<h2>Cascading failure story (interview gold)</h2>
<p>DB slows → API threads block waiting → thread pool exhausted → health checks fail → load balancer removes instances → remaining instances get more load → they fail too. Defences: timeouts, bulkheads, circuit breakers, load shedding, health checks that don't depend on the DB, and autoscaling limits.</p>`,
      pitfalls: [
        "No timeout (or default infinite timeouts in HTTP clients).",
        "Retrying non-idempotent writes.",
        "Synchronized retries without jitter → thundering herd.",
        "Health checks that call dependencies, causing the whole fleet to be marked unhealthy together.",
      ],
      interviewQs: [
        "How do you choose timeout values?",
        "Explain exponential backoff with jitter. Why jitter?",
        "How does a circuit breaker work?",
        "Describe a cascading failure and how you'd prevent it.",
        "What is backpressure?",
      ],
      resources: [
        { t: "AWS Builders' Library — Timeouts, retries and backoff with jitter", u: "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/", k: "article" },
        { t: "AWS Builders' Library — Using load shedding to avoid overload", u: "https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/", k: "article" },
        { t: "Release It! — Michael Nygard", u: "https://pragprog.com/titles/mnee2/release-it-second-edition/", k: "book" },
        { t: "Google SRE book — Handling overload / cascading failures", u: "https://sre.google/sre-book/addressing-cascading-failures/", k: "book" },
      ],
    },
    {
      id: "ds-coordination",
      title: "Coordination: Leader Election, Distributed Locks, Leases, Fencing",
      summary: "How nodes safely decide who is in charge or who holds a lock — using ZooKeeper/etcd, leases and fencing tokens — and why Redis locks are subtle.",
      tags: ["locks", "zookeeper", "etcd"],
      brushup: [
        "Coordination services (<b>ZooKeeper</b>, <b>etcd</b>, Consul) provide linearizable storage, watches and sessions/leases built on consensus.",
        "Leader election: create an ephemeral/leased key; the holder is leader; others watch and take over when it expires.",
        "<b>Leases</b> = locks with expiry; a paused (GC, VM stall) holder may still think it holds the lease after expiry.",
        "<b>Fencing tokens</b>: monotonically increasing number with each lock grant; the storage rejects writes with an older token.",
        "Redis <code>SET key val NX PX 30000</code> works for efficiency locks; for correctness, prefer consensus-backed locks + fencing (Redlock is debated).",
        "Use locks sparingly: prefer partitioning (single owner per key), idempotency and optimistic concurrency (compare-and-set, version columns).",
        "ZooKeeper primitives: ephemeral + sequential znodes → locks, queues, barriers; watches for change notification.",
      ],
      detail: `
<h2>The GC-pause problem</h2>
<pre><code>Client 1: acquire lock (lease 10s) ─ long GC pause (15s) ─────────► write to storage  ✗ corrupts!
Client 2:                          lease expired → acquire lock ─► write to storage</code></pre>
<p>Fix with <b>fencing tokens</b>: lock service returns token 33 to client 1, token 34 to client 2. Storage remembers the highest token seen and rejects client 1's late write with 33.</p>

<h2>Leader election with etcd (concept)</h2>
<pre><code>lease = grant(ttl=10s); keepalive(lease)
txn: if key "/election/leader" does not exist → put it with my id, attached to lease
else: watch "/election/leader"; on delete → try again
leader work uses revision number of the key as fencing token</code></pre>

<h2>ZooKeeper lock recipe</h2>
<ol>
<li>Create ephemeral sequential node <code>/lock/n-0000000017</code>.</li>
<li>List children; if yours is the lowest, you hold the lock.</li>
<li>Otherwise watch the node just before yours (avoids herd effect); retry when it disappears.</li>
<li>Session loss deletes your ephemeral node → lock released.</li>
</ol>

<h2>Alternatives to locks</h2>
<table>
<tr><th>Technique</th><th>Example</th></tr>
<tr><td>Optimistic concurrency</td><td><code>UPDATE ... SET v = v+1 WHERE id = ? AND version = ?</code></td></tr>
<tr><td>Single-writer partitioning</td><td>Kafka partition per key; one consumer owns it</td></tr>
<tr><td>Unique constraints</td><td>DB guarantees uniqueness instead of a lock</td></tr>
<tr><td>Idempotency</td><td>Duplicated work becomes harmless</td></tr>
</table>`,
      pitfalls: [
        "Distributed locks without fencing for correctness-critical writes.",
        "Lease TTL shorter than worst-case pauses (GC, network).",
        "Every waiter watching the same node → thundering herd on release.",
        "Using a single Redis instance as a 'distributed' lock with failover (async replication loses locks).",
      ],
      interviewQs: [
        "How would you implement leader election?",
        "Design a distributed lock. What can go wrong?",
        "What is a fencing token?",
        "Is Redis a good choice for distributed locks?",
        "When can you avoid locks entirely?",
      ],
      resources: [
        { t: "How to do distributed locking — Martin Kleppmann", u: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html", k: "article" },
        { t: "ZooKeeper recipes", u: "https://zookeeper.apache.org/doc/current/recipes.html", k: "docs" },
        { t: "The Chubby lock service (Google paper)", u: "https://research.google/pubs/the-chubby-lock-service-for-loosely-coupled-distributed-systems/", k: "paper" },
      ],
    },
    {
      id: "ds-gossip-crdt",
      title: "Gossip, Membership, Anti-Entropy, Bloom Filters & CRDTs",
      summary: "Decentralized techniques for cluster membership, failure detection, replica repair and conflict-free merging — plus the probabilistic structures that make them cheap.",
      tags: ["gossip", "crdt", "bloom-filter", "merkle"],
      brushup: [
        "<b>Gossip</b>: each node periodically exchanges state with a few random peers → information spreads in O(log N) rounds; robust, no central coordinator.",
        "<b>SWIM</b>: membership + failure detection with direct and indirect probes; used by Consul/Serf, memberlist.",
        "<b>Anti-entropy</b> with <b>Merkle trees</b>: compare tree hashes to find divergent key ranges and sync only those (Cassandra repair, Dynamo).",
        "<b>Bloom filter</b>: bit array + k hashes; 'definitely not present' or 'probably present'. Used to skip SSTable reads, dedupe URLs.",
        "HyperLogLog (cardinality), Count-Min Sketch (frequencies), t-digest (quantiles) — approximate but tiny.",
        "<b>CRDTs</b>: data types whose replicas merge deterministically without coordination (G-Counter, PN-Counter, OR-Set, LWW-Register, sequence CRDTs for text).",
        "CRDT requirement: merge is commutative, associative, idempotent → strong eventual consistency.",
      ],
      detail: `
<h2>Gossip dissemination</h2>
<pre><code>every T seconds:
  peer = random(members)
  send(peer, my_state_digest)       # push-pull: exchange versions, send newer entries
  merge(received)</code></pre>
<p>With fanout f, an update reaches all N nodes in ~log_f(N) rounds. Cassandra gossips endpoint state and heartbeats every second.</p>

<h2>Merkle trees for repair</h2>
<pre><code>        root = h(h12, h34)
       /                 \\
  h12 = h(h1,h2)     h34 = h(h3,h4)
   /     \\             /     \\
 h1       h2        h3       h4     ← hashes of key ranges
Compare roots; if different, descend only into mismatching children → transfer only differing ranges.</code></pre>

<h2>Bloom filter math</h2>
<ul>
<li>m bits, k hash functions, n items: false-positive rate ≈ (1 − e^(−kn/m))^k; optimal k = (m/n)·ln 2.</li>
<li>~10 bits per item → ~1% false positives. No deletes (use counting Bloom or cuckoo filters).</li>
</ul>

<h2>CRDT examples</h2>
<pre><code>G-Counter (grow-only): state = {nodeA: 5, nodeB: 3}; value = sum; merge = element-wise max
PN-Counter: two G-Counters (increments P, decrements N); value = P − N
OR-Set (observed-remove): each add gets a unique tag; remove deletes observed tags → add wins over concurrent remove
LWW-Register: (value, timestamp); merge keeps the higher timestamp</code></pre>
<p>Used in Redis Enterprise active-active, Riak, Figma/Automerge/Yjs for collaboration, shopping carts, like counters across regions.</p>`,
      pitfalls: [
        "Using a Bloom filter where false positives are unacceptable without a fallback check.",
        "CRDTs that grow unbounded (tombstones) without garbage collection.",
        "Relying on gossip for strongly consistent metadata.",
      ],
      interviewQs: [
        "How does gossip-based membership work?",
        "How do Merkle trees help replicas sync?",
        "Explain Bloom filters and a use case.",
        "What is a CRDT? Design a distributed counter.",
        "How would you count unique visitors across a huge site cheaply?",
      ],
      resources: [
        { t: "SWIM paper", u: "https://www.cs.cornell.edu/projects/Quicksilver/public_pdfs/SWIM.pdf", k: "paper" },
        { t: "CRDT.tech — resources", u: "https://crdt.tech/", k: "article" },
        { t: "Bloom filters by example", u: "https://llimllib.github.io/bloomfilter-tutorial/", k: "tool" },
      ],
    },
  ],
});
