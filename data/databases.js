/* Databases & SQL — beyond the basics in CS Fundamentals. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "databases",
  title: "Databases & SQL",
  icon: "🗄️",
  blurb: "SQL you must write fluently, window functions, index internals, MVCC & isolation, storage engines, NoSQL modeling, Redis, query optimization and Postgres/MySQL specifics.",
  topics: [
    {
      id: "sql-fundamentals",
      title: "SQL Fundamentals: Joins, Grouping, Subqueries, NULLs",
      summary: "The SQL every engineering interview expects you to write without hesitation — joins, aggregation, subqueries, CTEs and NULL semantics.",
      tags: ["sql", "must-know"],
      brushup: [
        "Logical order: <b>FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT</b> (why aliases from SELECT can't be used in WHERE).",
        "INNER JOIN keeps matches; LEFT JOIN keeps all left rows (NULLs for missing right); FULL OUTER keeps both; CROSS JOIN = Cartesian product; SELF JOIN for hierarchies/pairs.",
        "WHERE filters rows before grouping; <b>HAVING</b> filters groups after aggregation.",
        "NULL is 'unknown': <code>NULL = NULL</code> is not true → use <code>IS NULL</code>; COUNT(col) skips NULLs, COUNT(*) doesn't; <code>NOT IN</code> with a NULL in the list returns nothing.",
        "Subqueries: scalar, IN/EXISTS, correlated (runs per outer row). EXISTS is often clearer and safer than IN with NULLs.",
        "<b>CTEs</b> (WITH) for readability; <b>recursive CTEs</b> for trees/graphs.",
        "UNION removes duplicates (sort/hash); UNION ALL keeps them (faster).",
        "Anti-join pattern: LEFT JOIN … WHERE right.id IS NULL, or NOT EXISTS.",
      ],
      detail: `
<h2>Joins by example</h2>
<pre><code>-- customers with their order count, including customers with zero orders
SELECT c.id, c.name, COUNT(o.id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name;

-- customers who never ordered (anti-join)
SELECT c.* FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);

-- employees and their managers (self join)
SELECT e.name AS employee, m.name AS manager
FROM employees e LEFT JOIN employees m ON e.manager_id = m.id;</code></pre>
<p>A condition on the right table in WHERE turns a LEFT JOIN into an INNER JOIN — put it in the ON clause instead:</p>
<pre><code>SELECT c.id, COUNT(o.id)
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'PAID'   -- keeps customers without paid orders
GROUP BY c.id;</code></pre>

<h2>Grouping</h2>
<pre><code>SELECT department, COUNT(*) AS n, AVG(salary) AS avg_sal
FROM employees
WHERE hired_at &gt;= '2020-01-01'
GROUP BY department
HAVING COUNT(*) &gt;= 5
ORDER BY avg_sal DESC;

-- conditional aggregation (pivot)
SELECT customer_id,
       SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END)     AS paid,
       SUM(CASE WHEN status = 'REFUNDED' THEN amount ELSE 0 END) AS refunded
FROM orders GROUP BY customer_id;</code></pre>

<h2>Recursive CTE</h2>
<pre><code>WITH RECURSIVE chain AS (
  SELECT id, name, manager_id, 1 AS depth FROM employees WHERE id = 42
  UNION ALL
  SELECT e.id, e.name, e.manager_id, c.depth + 1
  FROM employees e JOIN chain c ON e.id = c.manager_id
)
SELECT * FROM chain;       -- 42's management chain up to the CEO</code></pre>

<h2>NULL traps</h2>
<table>
<tr><th>Expression</th><th>Result</th></tr>
<tr><td>NULL = NULL</td><td>NULL (not true)</td></tr>
<tr><td>1 NOT IN (2, NULL)</td><td>NULL → row filtered out</td></tr>
<tr><td>COUNT(col)</td><td>ignores NULLs</td></tr>
<tr><td>AVG(col)</td><td>average of non-NULL values</td></tr>
<tr><td>COALESCE(a, b, 0)</td><td>first non-NULL</td></tr>
</table>`,
      pitfalls: [
        "Filtering the outer-joined table in WHERE (accidental inner join).",
        "NOT IN with a subquery that can return NULL.",
        "Selecting non-aggregated columns not in GROUP BY (MySQL allows it and returns arbitrary values).",
        "Joining two one-to-many tables at once and double-counting sums (fan-out).",
      ],
      interviewQs: [
        "Find customers who placed no orders.",
        "Find departments with more than 5 employees and their average salary.",
        "What's the difference between WHERE and HAVING?",
        "Explain the logical order of SQL execution.",
        "Why can NOT IN return no rows?",
        "Write a query to get an employee's full management chain.",
      ],
      resources: [
        { t: "SQLBolt — interactive SQL lessons", u: "https://sqlbolt.com/", k: "practice" },
        { t: "LeetCode SQL 50", u: "https://leetcode.com/studyplan/top-sql-50/", k: "practice" },
        { t: "Mode SQL tutorial", u: "https://mode.com/sql-tutorial/", k: "course" },
        { t: "PostgreSQL tutorial (official)", u: "https://www.postgresql.org/docs/current/tutorial.html", k: "docs" },
      ],
    },
    {
      id: "sql-window",
      title: "Window Functions & Classic SQL Interview Queries",
      summary: "Ranking, running totals, gaps-and-islands and top-N-per-group — the window-function problems that separate strong SQL candidates.",
      tags: ["sql", "window-functions", "must-know"],
      brushup: [
        "<code>fn() OVER (PARTITION BY … ORDER BY … ROWS/RANGE …)</code> computes per row without collapsing rows (unlike GROUP BY).",
        "<b>ROW_NUMBER</b> (1,2,3,4), <b>RANK</b> (1,2,2,4), <b>DENSE_RANK</b> (1,2,2,3), NTILE(n).",
        "<b>LAG/LEAD</b> access previous/next rows → deltas, retention, session gaps.",
        "Running total: <code>SUM(x) OVER (PARTITION BY u ORDER BY t ROWS UNBOUNDED PRECEDING)</code>; moving average with ROWS BETWEEN 6 PRECEDING AND CURRENT ROW.",
        "FIRST_VALUE/LAST_VALUE (mind the default frame!), PERCENT_RANK, CUME_DIST.",
        "Top-N per group: ROW_NUMBER in a subquery/CTE, filter rn ≤ N (window functions can't go in WHERE directly; some DBs have QUALIFY).",
        "Gaps & islands: <code>date − ROW_NUMBER()</code> is constant within a consecutive streak.",
      ],
      detail: `
<h2>Second highest salary (and Nth)</h2>
<pre><code>SELECT salary FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS r FROM employees
) t WHERE r = 2 LIMIT 1;</code></pre>

<h2>Top 3 earners per department</h2>
<pre><code>WITH ranked AS (
  SELECT e.*, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS r
  FROM employees e
)
SELECT * FROM ranked WHERE r &lt;= 3;</code></pre>

<h2>Running total and 7-day moving average</h2>
<pre><code>SELECT day, revenue,
       SUM(revenue) OVER (ORDER BY day ROWS UNBOUNDED PRECEDING)          AS running_total,
       AVG(revenue) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS ma7
FROM daily_revenue;</code></pre>

<h2>Month-over-month growth</h2>
<pre><code>SELECT month, revenue,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month), 1) AS mom_pct
FROM monthly_revenue;</code></pre>

<h2>Gaps and islands — longest login streak</h2>
<pre><code>WITH d AS (SELECT DISTINCT user_id, login_date FROM logins),
g AS (
  SELECT user_id, login_date,
         login_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date)) * INTERVAL '1 day' AS grp
  FROM d
)
SELECT user_id, MIN(login_date) AS start_day, MAX(login_date) AS end_day, COUNT(*) AS streak
FROM g GROUP BY user_id, grp
ORDER BY streak DESC;</code></pre>

<h2>Sessionization (30-minute gap)</h2>
<pre><code>WITH e AS (
  SELECT *, CASE WHEN ts - LAG(ts) OVER (PARTITION BY user_id ORDER BY ts) &gt; INTERVAL '30 minutes'
                  OR LAG(ts) OVER (PARTITION BY user_id ORDER BY ts) IS NULL THEN 1 ELSE 0 END AS new_session
  FROM events
)
SELECT *, SUM(new_session) OVER (PARTITION BY user_id ORDER BY ts) AS session_id FROM e;</code></pre>

<h2>Deduplicate keeping the latest row</h2>
<pre><code>DELETE FROM users_raw WHERE ctid IN (      -- Postgres; use a CTE + ROW_NUMBER elsewhere
  SELECT ctid FROM (
    SELECT ctid, ROW_NUMBER() OVER (PARTITION BY email ORDER BY updated_at DESC) rn FROM users_raw
  ) t WHERE rn &gt; 1);</code></pre>

<h2>Day-1 retention</h2>
<pre><code>WITH first_day AS (SELECT user_id, MIN(activity_date) d0 FROM activity GROUP BY user_id)
SELECT f.d0,
       COUNT(*) AS new_users,
       ROUND(100.0 * COUNT(a.user_id) / COUNT(*), 1) AS d1_retention_pct
FROM first_day f
LEFT JOIN activity a ON a.user_id = f.user_id AND a.activity_date = f.d0 + 1
GROUP BY f.d0 ORDER BY f.d0;</code></pre>`,
      pitfalls: [
        "LAST_VALUE with the default frame (RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) returns the current row — specify the frame.",
        "Using RANK when the question implies DENSE_RANK (ties).",
        "Trying to filter on a window function in WHERE.",
        "RANGE vs ROWS frames behaving differently with duplicate ORDER BY values.",
      ],
      interviewQs: [
        "Find the Nth highest salary.",
        "Top 3 products by revenue in each category.",
        "Compute a 7-day rolling average.",
        "Find users with 3+ consecutive days of logins.",
        "RANK vs DENSE_RANK vs ROW_NUMBER?",
        "Compute day-1 retention by signup cohort.",
      ],
      resources: [
        { t: "PostgreSQL — Window functions tutorial", u: "https://www.postgresql.org/docs/current/tutorial-window.html", k: "docs" },
        { t: "DataLemur — SQL interview questions", u: "https://datalemur.com/sql-interview-questions", k: "practice" },
        { t: "StrataScratch — real company SQL questions", u: "https://www.stratascratch.com/", k: "practice" },
      ],
    },
    {
      id: "db-indexing",
      title: "Index Internals: B+Trees, Composite & Covering Indexes, EXPLAIN",
      summary: "How indexes really work, how the planner decides to use them, and how to design the right index for a query.",
      tags: ["indexes", "performance", "must-know"],
      brushup: [
        "<b>B+tree</b>: balanced, high fan-out (hundreds of keys per page), leaves linked → O(log n) lookup and efficient range scans; 3–4 levels cover billions of rows.",
        "<b>Clustered</b> index = table stored in index order (InnoDB primary key); secondary indexes point to the PK. Postgres heap tables: indexes point to tuple IDs.",
        "<b>Composite index (a, b, c)</b> serves filters on a, (a,b), (a,b,c) — the <b>leftmost prefix</b> rule; equality columns first, then range column, then sort column.",
        "<b>Covering index</b>: all queried columns in the index → index-only scan, no table lookup (INCLUDE columns in Postgres).",
        "Index won't be used: low selectivity, function on the column (<code>WHERE lower(email)=…</code> without expression index), leading wildcard LIKE '%x', implicit type casts, OR across columns.",
        "Other index types: hash, GIN (arrays, JSONB, full text), GiST/BRIN (geo, ranges, huge append-only tables), bitmap (warehouses).",
        "Every index slows writes and uses memory; drop unused ones.",
        "<b>EXPLAIN (ANALYZE, BUFFERS)</b>: look for Seq Scan on big tables, rows estimate vs actual, sort spills, nested loops over many rows.",
      ],
      detail: `
<h2>B+tree shape</h2>
<pre><code>                 [ 40 | 80 ]                     root (internal: keys + child pointers)
        ┌──────────┼──────────┐
   [10|20|30]   [50|60|70]   [90|95]              internal
     │  │  │
  leaves: [1..9]→[10..19]→[20..29]→ ... →[95..99]  (keys + row pointers, linked for range scans)</code></pre>

<h2>Designing a composite index</h2>
<pre><code>Query: SELECT id, total FROM orders
       WHERE customer_id = ? AND status = 'PAID' AND created_at &gt;= ?
       ORDER BY created_at DESC LIMIT 20;

Index: CREATE INDEX ON orders (customer_id, status, created_at DESC) INCLUDE (total);
       equality, equality, range+sort                             covering</code></pre>
<p>Rule of thumb (ESR): <b>E</b>quality columns first, then <b>S</b>ort, then <b>R</b>ange — when the range and sort column are the same, as here, it goes last.</p>

<h2>Reading EXPLAIN</h2>
<pre><code>EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;

Limit (actual time=0.05..0.09 rows=20)
  -&gt; Index Scan Backward using orders_cust_created_idx on orders (rows=20)
       Index Cond: (customer_id = 42)
       Buffers: shared hit=5</code></pre>
<table>
<tr><th>Node</th><th>Meaning</th></tr>
<tr><td>Seq Scan</td><td>Reads the whole table — fine for small tables or low selectivity</td></tr>
<tr><td>Index Scan</td><td>Walks index, fetches rows from heap</td></tr>
<tr><td>Index Only Scan</td><td>Covering; no heap fetch (needs visibility map)</td></tr>
<tr><td>Bitmap Heap Scan</td><td>Collects many matches, reads pages in order</td></tr>
<tr><td>Nested Loop / Hash Join / Merge Join</td><td>Join algorithms: small outer / big unsorted / both sorted</td></tr>
</table>
<p>Big gap between estimated and actual rows → stale statistics (<code>ANALYZE</code>) or correlated columns (extended statistics).</p>

<h2>Specialized indexes</h2>
<ul>
<li><b>Partial</b>: <code>CREATE INDEX ON orders (created_at) WHERE status = 'PENDING'</code> — small and hot.</li>
<li><b>Expression</b>: <code>CREATE INDEX ON users (lower(email))</code>.</li>
<li><b>GIN</b> on JSONB/arrays/tsvector; <b>BRIN</b> for time-ordered append-only tables (tiny, block-range summaries).</li>
<li>Full-text beyond basics → Elasticsearch/OpenSearch (inverted index + BM25).</li>
</ul>`,
      pitfalls: [
        "An index per column instead of one composite index matching the query.",
        "Wrapping indexed columns in functions or casting types in WHERE.",
        "Indexing low-cardinality columns (boolean) alone.",
        "Random UUIDv4 primary keys in clustered indexes → page splits and poor locality (prefer UUIDv7/ULID or bigint).",
        "Never checking pg_stat_user_indexes for unused indexes.",
      ],
      interviewQs: [
        "How does a B+tree index work and why are databases using B+trees?",
        "Design an index for a given query with filters and ORDER BY.",
        "What is a covering index?",
        "When will the optimizer ignore an index?",
        "Clustered vs non-clustered index?",
        "How do you find and fix a slow query?",
      ],
      resources: [
        { t: "Use The Index, Luke — SQL indexing explained", u: "https://use-the-index-luke.com/", k: "book" },
        { t: "PostgreSQL — Using EXPLAIN", u: "https://www.postgresql.org/docs/current/using-explain.html", k: "docs" },
        { t: "explain.dalibo.com — visualize Postgres plans", u: "https://explain.dalibo.com/", k: "tool" },
      ],
    },
    {
      id: "db-mvcc",
      title: "Transactions, Isolation Levels, MVCC & Locking",
      summary: "What each isolation level actually prevents, how MVCC gives readers a snapshot without blocking writers, and how locks and deadlocks work.",
      tags: ["transactions", "mvcc", "isolation", "must-know"],
      brushup: [
        "Anomalies: <b>dirty read</b>, <b>non-repeatable read</b>, <b>phantom</b>, <b>lost update</b>, <b>write skew</b>.",
        "Read Uncommitted → Read Committed (Postgres/Oracle default) → Repeatable Read (MySQL InnoDB default) → Serializable.",
        "<b>MVCC</b>: writers create new row versions; readers see a consistent snapshot based on transaction IDs → readers don't block writers.",
        "Postgres: tuples have xmin/xmax; old versions cleaned by <b>VACUUM</b>. InnoDB: undo logs hold old versions; purge threads clean them.",
        "<b>Snapshot isolation</b> prevents dirty/non-repeatable reads and phantoms (mostly) but allows <b>write skew</b>.",
        "Serializable: 2PL (locks) or <b>SSI</b> (Postgres: detect dangerous dependency cycles, abort one transaction → retry).",
        "Lost update fixes: atomic UPDATE x = x + 1, <code>SELECT … FOR UPDATE</code>, optimistic version check.",
        "Deadlocks: DB detects cycles and aborts a victim; prevent with consistent lock ordering and short transactions.",
      ],
      detail: `
<h2>Isolation levels vs anomalies</h2>
<table>
<tr><th>Level</th><th>Dirty read</th><th>Non-repeatable</th><th>Phantom</th><th>Write skew</th></tr>
<tr><td>Read uncommitted</td><td>possible</td><td>possible</td><td>possible</td><td>possible</td></tr>
<tr><td>Read committed</td><td>—</td><td>possible</td><td>possible</td><td>possible</td></tr>
<tr><td>Repeatable read / Snapshot</td><td>—</td><td>—</td><td>mostly prevented*</td><td>possible</td></tr>
<tr><td>Serializable</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
</table>
<p>*InnoDB uses next-key (gap) locks for locking reads; Postgres RR is true snapshot isolation.</p>

<h2>Write skew example</h2>
<pre><code>Rule: at least one doctor must be on call.
T1: SELECT count(*) FROM oncall WHERE shift=1;  -- 2
T2: SELECT count(*) FROM oncall WHERE shift=1;  -- 2
T1: DELETE FROM oncall WHERE doctor='alice';
T2: DELETE FROM oncall WHERE doctor='bob';
Both commit under snapshot isolation → nobody on call.</code></pre>
<p>Fixes: SERIALIZABLE, <code>SELECT … FOR UPDATE</code> on the rows the decision depends on, or materialize the conflict (a row you can lock), or a constraint.</p>

<h2>Lost update fixes</h2>
<pre><code>-- atomic
UPDATE accounts SET balance = balance - 100 WHERE id = 1 AND balance &gt;= 100;
-- pessimistic
BEGIN; SELECT balance FROM accounts WHERE id = 1 FOR UPDATE; ... UPDATE ...; COMMIT;
-- optimistic
UPDATE docs SET body = ?, version = version + 1 WHERE id = ? AND version = ?;  -- 0 rows → conflict, retry</code></pre>

<h2>MVCC in Postgres</h2>
<ul>
<li>Every row version stores <b>xmin</b> (creating txn) and <b>xmax</b> (deleting/updating txn). An UPDATE = new tuple + old tuple marked dead.</li>
<li>A snapshot = which transaction IDs were committed when it started; visibility is checked per tuple.</li>
<li>Dead tuples cause bloat → <b>autovacuum</b>; long-running transactions prevent cleanup (watch <code>pg_stat_activity</code> for idle-in-transaction).</li>
<li>Transaction ID wraparound → aggressive vacuum; monitor <code>age(datfrozenxid)</code>.</li>
</ul>

<h2>Locks</h2>
<ul>
<li>Row locks (FOR UPDATE / FOR SHARE), table locks (DDL takes ACCESS EXCLUSIVE — beware on big tables), advisory locks.</li>
<li><code>SKIP LOCKED</code> turns a table into a work queue: <code>SELECT … FOR UPDATE SKIP LOCKED LIMIT 10</code>.</li>
<li>Deadlock: T1 locks A then B; T2 locks B then A. Always lock in a consistent order.</li>
</ul>`,
      pitfalls: [
        "Assuming the default isolation level prevents all race conditions.",
        "Read-modify-write in application code without locks or version checks.",
        "Long-running transactions blocking vacuum and holding locks.",
        "Running ALTER TABLE on a hot table without lock_timeout.",
        "Not retrying serialization failures under SERIALIZABLE.",
      ],
      interviewQs: [
        "Explain the isolation levels and the anomalies each prevents.",
        "What is MVCC and how does Postgres implement it?",
        "What is write skew? How do you prevent it?",
        "How do you prevent lost updates?",
        "How do databases detect and resolve deadlocks?",
        "How would you implement a job queue in Postgres?",
      ],
      resources: [
        { t: "PostgreSQL — Transaction isolation", u: "https://www.postgresql.org/docs/current/transaction-iso.html", k: "docs" },
        { t: "A Critique of ANSI SQL Isolation Levels (paper)", u: "https://www.microsoft.com/en-us/research/publication/a-critique-of-ansi-sql-isolation-levels/", k: "paper" },
        { t: "DDIA — ch. 7 Transactions", u: "https://dataintensive.net/", k: "book" },
      ],
    },
    {
      id: "db-storage",
      title: "Storage Engines: B-Trees vs LSM Trees, WAL, Buffer Pool",
      summary: "How databases lay data out on disk — update-in-place B-trees vs log-structured merge trees — and the write-ahead log that makes them durable.",
      tags: ["storage", "lsm", "wal"],
      brushup: [
        "<b>WAL</b> (write-ahead log): append changes to a sequential log and fsync before acknowledging; data pages are written lazily; crash recovery replays the log.",
        "<b>B-tree engines</b> (InnoDB, Postgres): update pages in place (plus WAL); fast reads; random writes; page splits.",
        "<b>LSM trees</b> (RocksDB, Cassandra, ScyllaDB, LevelDB): writes go to an in-memory <b>memtable</b> + WAL; flushed as immutable sorted <b>SSTables</b>; background <b>compaction</b> merges them.",
        "LSM reads may check memtable + several SSTables → <b>Bloom filters</b> and block indexes skip files.",
        "Amplification trade-offs: <b>write</b> (bytes written per byte of data), <b>read</b>, <b>space</b>. LSM: low write amp, higher read amp; B-tree the opposite.",
        "Compaction strategies: size-tiered (write-optimized) vs leveled (read/space-optimized).",
        "<b>Buffer pool</b> caches pages in memory; checkpoints bound recovery time.",
        "Row stores for OLTP; column stores for OLAP.",
      ],
      detail: `
<h2>Write path comparison</h2>
<pre><code>B-tree:  write WAL (sequential) → modify page in buffer pool → later flush dirty page (random I/O)
LSM:     write WAL (sequential) → insert into memtable (skip list) → when full, flush SSTable (sequential)
         → background compaction merges SSTables, drops overwritten/deleted (tombstoned) keys</code></pre>

<h2>LSM read path</h2>
<pre><code>get(k): memtable → immutable memtables → L0 SSTables (newest first) → L1 … Ln
        each SSTable: Bloom filter says "maybe" → block index → read block</code></pre>

<h2>Trade-offs</h2>
<table>
<tr><th></th><th>B-tree</th><th>LSM</th></tr>
<tr><td>Writes</td><td>Random page writes, write amp from full-page writes</td><td>Sequential, high throughput</td></tr>
<tr><td>Reads</td><td>One tree lookup</td><td>Possibly several SSTables</td></tr>
<tr><td>Space</td><td>Fragmentation from page splits</td><td>Compresses well; old versions until compaction</td></tr>
<tr><td>Latency</td><td>Predictable</td><td>Compaction can cause spikes</td></tr>
<tr><td>Examples</td><td>Postgres, MySQL InnoDB, Oracle</td><td>RocksDB, Cassandra, HBase, Kafka Streams state</td></tr>
</table>

<h2>Durability details</h2>
<ul>
<li>fsync on commit is the expensive part → <b>group commit</b> batches fsyncs from concurrent transactions.</li>
<li><code>synchronous_commit=off</code> (Postgres) / <code>innodb_flush_log_at_trx_commit=2</code> trade a small loss window for speed.</li>
<li>Torn pages: InnoDB doublewrite buffer, Postgres full-page writes after checkpoints.</li>
<li>ARIES recovery: analysis → redo → undo.</li>
</ul>`,
      pitfalls: [
        "Choosing an LSM store for read-heavy point lookups without tuning Bloom filters/cache.",
        "Ignoring compaction debt until disk fills and latency spikes.",
        "Turning off fsync for benchmarks and shipping it.",
      ],
      interviewQs: [
        "What is a write-ahead log and why is it needed?",
        "Compare B-trees and LSM trees.",
        "How does an LSM tree serve a read?",
        "What is write amplification?",
        "Why do time-series and write-heavy databases favour LSM trees?",
      ],
      resources: [
        { t: "DDIA — ch. 3 Storage and retrieval", u: "https://dataintensive.net/", k: "book" },
        { t: "RocksDB wiki — overview", u: "https://github.com/facebook/rocksdb/wiki/RocksDB-Overview", k: "docs" },
        { t: "Database Internals — Alex Petrov", u: "https://www.databass.dev/", k: "book" },
      ],
    },
    {
      id: "db-nosql",
      title: "NoSQL Data Modeling: DynamoDB, Cassandra, MongoDB",
      summary: "Designing schemas around access patterns — partition and sort keys, single-table design, wide rows, denormalization and their limits.",
      tags: ["nosql", "dynamodb", "cassandra", "mongodb"],
      brushup: [
        "NoSQL modeling starts from <b>access patterns</b>, not entities: list every query first, then design keys.",
        "<b>DynamoDB</b>: partition key (hash) + optional sort key; queries by PK (+ SK range); GSIs for other patterns (eventually consistent); single-table design groups related items.",
        "<b>Cassandra</b>: partition key decides the node; clustering columns sort within the partition; one table per query; avoid unbounded partitions (&gt; ~100 MB).",
        "<b>MongoDB</b>: documents; embed what's read together and bounded, reference what's shared or unbounded; indexes like relational; transactions exist but are costly.",
        "Denormalize and duplicate data; keep copies in sync via application writes, streams (DynamoDB Streams/CDC) or batch.",
        "Hot partitions: high-cardinality keys, write sharding (suffixes), adaptive capacity.",
        "Choose NoSQL for massive scale, predictable key access and flexible schema; choose SQL for ad-hoc queries, joins and complex transactions.",
      ],
      detail: `
<h2>DynamoDB single-table example</h2>
<pre><code>PK              SK                       attributes
USER#42         PROFILE                  name, email
USER#42         ORDER#2026-09-01#9001    total, status
USER#42         ORDER#2026-09-15#9002    total, status
ORDER#9001      ITEM#1                   sku, qty

Query: PK = USER#42 AND begins_with(SK, "ORDER#")           → user's orders, sorted by date
GSI1:  GSI1PK = status, GSI1SK = created_at                  → "all PENDING orders by time"</code></pre>
<ul>
<li>Strongly consistent reads available on the base table (not GSIs).</li>
<li>Transactions (TransactWriteItems) up to 100 items; conditional writes for optimistic locking.</li>
<li>Capacity: on-demand vs provisioned; partition limits ~3000 RCU / 1000 WCU per partition.</li>
</ul>

<h2>Cassandra: query-first tables</h2>
<pre><code>CREATE TABLE messages_by_conversation (
  conversation_id uuid,
  bucket          int,          -- e.g. month, bounds partition size
  sent_at         timeuuid,
  sender_id       uuid,
  body            text,
  PRIMARY KEY ((conversation_id, bucket), sent_at)
) WITH CLUSTERING ORDER BY (sent_at DESC);</code></pre>
<p>Writes are cheap (LSM); reads should hit one partition. Deletes create tombstones — heavy deletes hurt reads. Use LOCAL_QUORUM for strong-enough consistency within a DC.</p>

<h2>MongoDB: embed vs reference</h2>
<table>
<tr><th>Embed when</th><th>Reference when</th></tr>
<tr><td>Data read together, one-to-few, bounded (addresses of a user)</td><td>One-to-many unbounded (comments on a viral post), many-to-many, shared entities</td></tr>
</table>
<p>Documents are limited to 16 MB; the aggregation pipeline handles analytics-style queries; sharding by a shard key similar to other systems.</p>

<h2>SQL or NoSQL?</h2>
<ul>
<li>Unknown or evolving query patterns, reporting, joins, strong multi-row transactions → relational (Postgres).</li>
<li>Known key-based access, huge scale, low-latency at any size, multi-region → DynamoDB/Cassandra.</li>
<li>Many teams use both: Postgres as system of record, NoSQL/caches for specific high-scale paths.</li>
</ul>`,
      pitfalls: [
        "Modeling NoSQL like a normalized relational schema, then needing joins.",
        "Unbounded partitions (all events of a device forever in one partition).",
        "Scans in DynamoDB/Cassandra for regular queries.",
        "Low-cardinality partition keys (status, country) → hot partitions.",
      ],
      interviewQs: [
        "How do you model data in DynamoDB? Explain partition and sort keys.",
        "What is single-table design?",
        "Design a Cassandra schema for a chat application.",
        "Embed vs reference in MongoDB?",
        "When would you choose Postgres over DynamoDB?",
      ],
      resources: [
        { t: "The DynamoDB Book — Alex DeBrie", u: "https://www.dynamodbbook.com/", k: "book" },
        { t: "AWS — Best practices for designing with DynamoDB", u: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html", k: "docs" },
        { t: "Cassandra data modeling", u: "https://cassandra.apache.org/doc/latest/cassandra/developing/data-modeling/index.html", k: "docs" },
        { t: "MongoDB data modeling", u: "https://www.mongodb.com/docs/manual/data-modeling/", k: "docs" },
      ],
    },
    {
      id: "db-redis",
      title: "Redis Deep Dive: Data Structures, Persistence, Cluster, Patterns",
      summary: "Redis beyond GET/SET — its data structures, single-threaded execution, persistence options, clustering, and the caching/rate-limiting/leaderboard patterns built on it.",
      tags: ["redis", "cache"],
      brushup: [
        "In-memory, single-threaded command execution (I/O threads optional) → each command is atomic; latency ~sub-ms.",
        "Structures: strings, <b>hashes</b>, <b>lists</b>, <b>sets</b>, <b>sorted sets</b> (skip list + hash), streams, bitmaps, HyperLogLog, geo, JSON (module).",
        "Persistence: <b>RDB</b> snapshots (compact, can lose minutes) and <b>AOF</b> (append every write; fsync everysec) — often both.",
        "Replication is <b>asynchronous</b>; Sentinel provides failover; <b>Redis Cluster</b> shards over 16,384 hash slots (hash tags {user42} keep keys together).",
        "Eviction policies: allkeys-lru, allkeys-lfu, volatile-ttl, noeviction; set <b>maxmemory</b>.",
        "Atomic multi-step logic: <b>Lua scripts</b> / functions, MULTI/EXEC transactions, WATCH for optimistic locking.",
        "Patterns: cache-aside, rate limiting (INCR + EXPIRE or sorted-set sliding window), leaderboards (ZADD/ZREVRANGE), sessions, queues (Streams with consumer groups), pub/sub, distributed locks (with caveats).",
        "Avoid O(N) commands on big keys (KEYS *, HGETALL on huge hashes); use SCAN.",
      ],
      detail: `
<h2>Patterns in commands</h2>
<pre><code># cache-aside with TTL
GET product:42                  → miss → load from DB → SET product:42 &lt;json&gt; EX 300

# fixed-window rate limit: 100 req/min per user
INCR rl:u42:202609301830        → n; if n == 1: EXPIRE rl:u42:202609301830 60; if n &gt; 100: reject

# sliding-window log
ZADD rl:u42 &lt;now_ms&gt; &lt;uuid&gt;; ZREMRANGEBYSCORE rl:u42 0 &lt;now_ms-60000&gt;; ZCARD rl:u42

# leaderboard
ZINCRBY lb:weekly 50 player:7
ZREVRANGE lb:weekly 0 9 WITHSCORES      # top 10
ZREVRANK lb:weekly player:7              # my rank

# unique visitors (approx)
PFADD uv:2026-09-30 user:42 ; PFCOUNT uv:2026-09-30

# queue with consumer groups
XADD jobs * type email to a@b.c
XREADGROUP GROUP workers w1 COUNT 10 BLOCK 5000 STREAMS jobs &gt;
XACK jobs workers &lt;id&gt;</code></pre>

<h2>Atomic token bucket in Lua</h2>
<pre><code>-- KEYS[1]=bucket  ARGV: capacity, refill_per_sec, now_ms
local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local cap, rate, now = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])
local tokens = tonumber(b[1]) or cap
local ts = tonumber(b[2]) or now
tokens = math.min(cap, tokens + (now - ts) / 1000 * rate)
local allowed = tokens &gt;= 1
if allowed then tokens = tokens - 1 end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate * 1000))
return allowed and 1 or 0</code></pre>

<h2>Persistence & HA</h2>
<table>
<tr><th>Option</th><th>Loss window</th><th>Notes</th></tr>
<tr><td>No persistence</td><td>Everything on restart</td><td>Pure cache</td></tr>
<tr><td>RDB every N min</td><td>Up to N min</td><td>Fork + copy-on-write; fast restart</td></tr>
<tr><td>AOF everysec</td><td>~1 s</td><td>Rewrite compacts the log</td></tr>
<tr><td>AOF always</td><td>~0</td><td>Slow</td></tr>
</table>
<p>Async replication means a failover can lose acknowledged writes — don't treat Redis as the system of record for money.</p>

<h2>Cache problems & fixes</h2>
<ul>
<li><b>Stampede</b> (many misses at once): request coalescing / single-flight lock, probabilistic early refresh, stale-while-revalidate.</li>
<li><b>Penetration</b> (queries for non-existent keys): cache negatives with short TTL, Bloom filter.</li>
<li><b>Avalanche</b> (many keys expire together): jittered TTLs.</li>
<li><b>Hot key</b>: local in-process cache, key replication (key#1..#n).</li>
<li><b>Big keys</b>: split; they block the single thread and skew cluster memory.</li>
</ul>`,
      pitfalls: [
        "KEYS * or FLUSHALL in production.",
        "Using Redis as the only copy of important data with async replication.",
        "Same TTL on millions of keys → synchronized expiry.",
        "Multi-key operations across slots in Redis Cluster without hash tags.",
      ],
      interviewQs: [
        "Why is Redis fast even though it's single-threaded?",
        "RDB vs AOF?",
        "Implement a rate limiter with Redis.",
        "Design a real-time leaderboard.",
        "How do you prevent a cache stampede?",
        "How does Redis Cluster shard data?",
      ],
      resources: [
        { t: "Redis documentation — data types", u: "https://redis.io/docs/latest/develop/data-types/", k: "docs" },
        { t: "Redis University (free courses)", u: "https://university.redis.io/", k: "course" },
        { t: "Redis persistence", u: "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/", k: "docs" },
      ],
    },
    {
      id: "db-query-perf",
      title: "Query Optimization & ORM Pitfalls: N+1, Pagination, Connection Pools",
      summary: "The everyday performance problems in application-to-database code, and the fixes interviewers expect you to know.",
      tags: ["performance", "orm", "postgres"],
      brushup: [
        "<b>N+1 queries</b>: loading a list then querying per item → use joins / batch fetch (JOIN FETCH, IN queries, DataLoader).",
        "<b>OFFSET pagination</b> gets slower with depth and skips/duplicates on concurrent inserts → <b>keyset (cursor) pagination</b>: WHERE (created_at, id) &lt; (?, ?) ORDER BY … LIMIT n.",
        "SELECT only needed columns; avoid SELECT * in hot paths.",
        "<b>Connection pools</b> (HikariCP, PgBouncer): DB connections are expensive; pool size ≈ cores × 2–4 per DB, not thousands.",
        "Batch writes (multi-row INSERT, COPY) instead of row-by-row.",
        "Keep transactions short; never call remote services inside a DB transaction.",
        "Use EXPLAIN ANALYZE, slow query logs, pg_stat_statements to find the top offenders.",
        "Read replicas for heavy reads; caching for hot, rarely changing data; materialized views for expensive aggregates.",
      ],
      detail: `
<h2>N+1 in an ORM</h2>
<pre><code>// JPA — 1 query for orders + N queries for customers
List&lt;Order&gt; orders = repo.findAll();
orders.forEach(o -&gt; o.getCustomer().getName());      // lazy load per order!

// fix
@Query("select o from Order o join fetch o.customer")
List&lt;Order&gt; findAllWithCustomer();
// or @EntityGraph(attributePaths = "customer"), or hibernate.default_batch_fetch_size=100</code></pre>

<h2>Keyset pagination</h2>
<pre><code>-- page 1
SELECT id, created_at, title FROM posts ORDER BY created_at DESC, id DESC LIMIT 20;
-- next page: pass the last row's (created_at, id) as the cursor
SELECT id, created_at, title FROM posts
WHERE (created_at, id) &lt; ('2026-09-30 10:00:00', 981234)
ORDER BY created_at DESC, id DESC LIMIT 20;
-- index: (created_at DESC, id DESC)</code></pre>
<p>Constant time per page regardless of depth; stable under inserts. Trade-off: no "jump to page 57".</p>

<h2>Connection pool sizing</h2>
<ul>
<li>A Postgres connection is a process (~several MB); thousands of connections thrash the server.</li>
<li>HikariCP guidance: pool ≈ (cores × 2) + effective spindles; start small (10–20) and measure.</li>
<li>Many app instances × pool size must stay under max_connections → PgBouncer in transaction mode.</li>
<li>Symptoms of too-small pools: threads waiting for connections; too big: DB CPU saturation and lock contention.</li>
</ul>

<h2>Checklist for a slow endpoint</h2>
<ol>
<li>Count queries per request (N+1?).</li><li>EXPLAIN ANALYZE the slowest query; missing index? bad estimate?</li>
<li>Rows returned vs needed (pagination, columns).</li><li>Lock waits (pg_locks), long transactions.</li>
<li>Cache or precompute (materialized view, denormalized column, summary table).</li>
</ol>`,
      pitfalls: [
        "Eager loading everything to fix N+1 → giant Cartesian joins.",
        "OFFSET 100000 on large tables.",
        "HTTP calls inside @Transactional methods holding connections and locks.",
        "Pool size of 200 per instance × 50 instances.",
      ],
      interviewQs: [
        "What is the N+1 query problem and how do you fix it?",
        "OFFSET vs keyset pagination?",
        "How do you size a connection pool?",
        "An API endpoint got slow after data grew 10× — how do you investigate?",
        "When would you use a materialized view?",
      ],
      resources: [
        { t: "HikariCP — About pool sizing", u: "https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing", k: "article" },
        { t: "Use The Index, Luke — Paging through results", u: "https://use-the-index-luke.com/no-offset", k: "article" },
        { t: "pg_stat_statements", u: "https://www.postgresql.org/docs/current/pgstatstatements.html", k: "docs" },
      ],
    },
    {
      id: "db-postgres-ops",
      title: "Running Relational Databases: Postgres/MySQL Operations, Migrations, Scaling",
      summary: "What senior engineers know about operating Postgres/MySQL: replication setups, zero-downtime migrations, vacuum, partitioning and scaling paths.",
      tags: ["postgres", "mysql", "operations"],
      brushup: [
        "Scaling path: indexes/queries → bigger instance → read replicas → caching → table partitioning → functional split → sharding (Citus, Vitess) or distributed SQL.",
        "<b>Zero-downtime migrations</b>: expand → migrate → contract; add nullable columns, backfill in batches, then add constraints (NOT VALID + VALIDATE).",
        "Create indexes <b>CONCURRENTLY</b> (Postgres) / online DDL (MySQL, gh-ost, pt-online-schema-change).",
        "Set <b>lock_timeout</b> and statement_timeout for DDL so a blocked migration doesn't queue all traffic behind it.",
        "Declarative <b>partitioning</b> (range by month) for huge tables: fast pruning and cheap retention (DROP partition).",
        "Backups: base backups + WAL archiving → point-in-time recovery (PITR); test restores regularly.",
        "Postgres HA: streaming replication + Patroni/managed (RDS Multi-AZ, Aurora); MySQL: semi-sync, Group Replication, Aurora.",
        "Monitor: replication lag, connections, cache hit ratio, bloat, long transactions, slow queries, disk.",
      ],
      detail: `
<h2>Expand–migrate–contract (rename a column safely)</h2>
<ol>
<li><b>Expand</b>: add new column <code>full_name</code> (nullable). Deploy code that writes both columns.</li>
<li><b>Migrate</b>: backfill in batches (<code>UPDATE … WHERE id BETWEEN … </code>, sleep between batches).</li>
<li>Switch reads to the new column; verify.</li>
<li><b>Contract</b>: stop writing the old column; drop it in a later release.</li>
</ol>

<h2>Dangerous DDL and safe alternatives (Postgres)</h2>
<table>
<tr><th>Risky</th><th>Safer</th></tr>
<tr><td>CREATE INDEX</td><td>CREATE INDEX CONCURRENTLY</td></tr>
<tr><td>ADD COLUMN … DEFAULT volatile / NOT NULL on old versions</td><td>Add nullable, backfill, then set NOT NULL via CHECK … NOT VALID + VALIDATE</td></tr>
<tr><td>ADD FOREIGN KEY</td><td>ADD CONSTRAINT … NOT VALID, then VALIDATE CONSTRAINT</td></tr>
<tr><td>ALTER COLUMN TYPE</td><td>New column + backfill + swap</td></tr>
</table>
<pre><code>SET lock_timeout = '3s';
ALTER TABLE orders ADD COLUMN coupon_code text;</code></pre>

<h2>Partitioning a time-series table</h2>
<pre><code>CREATE TABLE events (id bigint, created_at timestamptz, payload jsonb) PARTITION BY RANGE (created_at);
CREATE TABLE events_2026_09 PARTITION OF events FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
-- retention: DROP TABLE events_2025_09;   (instant, no DELETE + vacuum)</code></pre>

<h2>When to leave a single node</h2>
<ul>
<li>Write throughput or dataset beyond the largest instance, or multi-region writes.</li>
<li>Options: <b>Citus</b> (distributed Postgres), <b>Vitess</b> (MySQL sharding, used by YouTube/Slack), <b>CockroachDB/Yugabyte/Spanner</b> (distributed SQL with serializable transactions).</li>
</ul>`,
      pitfalls: [
        "Migrations that take an exclusive lock on a hot table during peak traffic.",
        "Backfilling millions of rows in one transaction.",
        "Backups never tested by restoring.",
        "Sharding too early instead of fixing queries and indexes.",
      ],
      interviewQs: [
        "How do you perform a zero-downtime schema migration?",
        "How would you scale a Postgres database that is hitting its limits?",
        "What is point-in-time recovery?",
        "When would you partition a table?",
        "How do Vitess or Citus shard a relational database?",
      ],
      resources: [
        { t: "Braintree — Safe operations for high volume PostgreSQL", u: "https://www.braintreepayments.com/blog/safe-operations-for-high-volume-postgresql/", k: "blog" },
        { t: "PostgreSQL — Table partitioning", u: "https://www.postgresql.org/docs/current/ddl-partitioning.html", k: "docs" },
        { t: "Vitess documentation", u: "https://vitess.io/docs/", k: "docs" },
      ],
    },
  ],
});
