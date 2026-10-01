# -*- coding: utf-8 -*-
"""Scenario-based (production / troubleshooting / judgement) questions and the Project Round generator.
Registered into bank.TRACKS / bank.Q on import so the mock interviewer grades them like any track."""
import re

from . import bank, knowledge

SCENARIOS = [
    {"q": "p99 latency of your checkout API jumped from 200 ms to 2 s after a deploy, but p50 is unchanged. Walk me through how you investigate and mitigate.", "level": 2, "theme": "latency",
     "points": ["mitigate first rollback or feature flag off if deploy correlates", "compare dashboards before and after deploy", "tail latency points to contention or a slow dependency", "distributed traces for slow requests", "check connection pool and thread pool saturation", "GC pauses", "slow queries or missing index", "communicate status to stakeholders", "postmortem with action items"],
     "followups": ["Rollback didn't help — what next?", "How would you have caught this before production?"]},
    {"q": "Kafka consumer lag on the orders topic is growing steadily and customers see delayed notifications. What do you do?", "level": 2, "theme": "kafka",
     "points": ["check consumer health errors and rebalances", "poison message retrying forever send to dead letter topic", "processing time per message and slow downstream", "scale consumers up to partition count", "increase partitions if needed", "batching and max.poll.records tuning", "max.poll.interval.ms causing rebalance storms", "alert on lag", "backfill and catch-up plan"],
     "followups": ["Consumers equal partitions already — how do you go faster?", "How do you keep per-order ordering while parallelizing?"]},
    {"q": "Your database CPU is pinned at 100% during peak hours. How do you find the cause and fix it short and long term?", "level": 2, "theme": "database",
     "points": ["find top queries pg_stat_statements slow query log", "EXPLAIN ANALYZE the worst queries", "missing index or sequential scans", "N+1 queries from the application", "connection storms and pool sizing", "cache hot reads", "read replicas for read traffic", "kill or throttle runaway jobs", "long term partitioning or sharding capacity plan"],
     "followups": ["The top query already has an index — why might it still be slow?"]},
    {"q": "A Kubernetes pod keeps restarting with OOMKilled for a Java service. How do you debug and fix it?", "level": 2, "theme": "kubernetes",
     "points": ["kubectl describe and logs previous", "compare memory limit to JVM heap settings", "MaxRAMPercentage container aware sizing", "non heap memory metaspace threads direct buffers", "heap dump or native memory tracking", "memory leak versus under provisioning", "set requests and limits appropriately", "load test to confirm"],
     "followups": ["Heap is only 50% used but the pod is still OOMKilled — why?"]},
    {"q": "Users report they were charged twice for the same order. How do you handle the incident and prevent it?", "level": 3, "theme": "payments",
     "points": ["stop the bleeding and refund affected customers", "quantify blast radius with a query", "root cause retries without idempotency", "idempotency keys with unique constraint", "timeouts causing client retries", "reconciliation job with payment provider", "exactly once is effectively idempotent processing", "communicate with support and customers", "postmortem blameless"],
     "followups": ["How does the idempotency key survive a service restart?"]},
    {"q": "A downstream dependency (payment provider) starts timing out 30% of the time. Your service's threads are exhausted and the whole site slows down. What do you do?", "level": 2, "theme": "resilience",
     "points": ["timeouts shorter than current", "circuit breaker to fail fast", "bulkhead separate thread pool per dependency", "retries with backoff and jitter only if idempotent", "graceful degradation queue payments for later", "rate limit and shed load", "status page and communication", "alert on dependency error rate"],
     "followups": ["What's the risk of adding retries here?"]},
    {"q": "Memory usage of a service grows slowly over days until it crashes. How do you find the leak?", "level": 2, "theme": "memory",
     "points": ["confirm with metrics trend after GC", "heap dump at two points and compare", "dominator tree largest retained objects", "common causes unbounded caches listeners static collections thread locals", "reproduce in staging with load", "fix and verify with soak test", "interim mitigation restart schedule"],
     "followups": ["You can't take a heap dump in production — alternatives?"]},
    {"q": "A deploy went out and error rate spiked to 5%. Nobody knows which change caused it. What's your process?", "level": 1, "theme": "incident",
     "points": ["rollback immediately don't debug in production first", "declare incident assign incident commander", "check what changed deploys config flags", "correlate errors with version", "communicate timeline to stakeholders", "root cause after mitigation", "blameless postmortem", "improve canary and automated rollback"],
     "followups": ["Rollback isn't possible because of a DB migration — what now?"]},
    {"q": "You need to add a NOT NULL column to a table with 500 million rows serving live traffic. How do you do it without downtime?", "level": 3, "theme": "migration",
     "points": ["add column as nullable first", "backfill in small batches with throttling", "application writes the new column dual write", "then add default and not null constraint validated", "avoid long locks check lock behavior of DDL", "online schema change tools gh-ost pt-online-schema-change", "expand and contract pattern", "rollback plan"],
     "followups": ["How do you verify the backfill is complete and correct?"]},
    {"q": "Your Redis cache cluster goes down. The database gets 20× traffic and starts failing. What happens and how should the system be designed to survive this?", "level": 3, "theme": "cache",
     "points": ["cache stampede thundering herd on database", "load shedding and rate limiting to protect database", "circuit breaker around cache", "request coalescing single flight", "serve stale or degraded responses", "gradual cache warm up", "replicated cache high availability", "capacity plan database for cache failure"],
     "followups": ["How do you warm the cache without melting the DB again?"]},
    {"q": "A customer reports that data they deleted still appears in search results for hours. How do you investigate?", "level": 2, "theme": "consistency",
     "points": ["trace the data flow from database to search index", "CDC or event pipeline lag", "failed or dropped delete events", "caches with long TTL", "tombstones and idempotent deletes", "reconciliation job", "monitor pipeline lag and dead letters", "privacy obligations for deletion"],
     "followups": ["How would you guarantee deletes eventually reach every copy?"]},
    {"q": "An on-call engineer is paged 30 times a week, mostly for alerts that resolve themselves. How do you fix on-call health?", "level": 2, "theme": "sre",
     "points": ["audit alerts actionable or not", "alert on symptoms and SLO burn rate not causes", "delete or downgrade noisy alerts", "runbooks for every page", "fix root causes of recurring pages", "track pages per shift as a metric", "error budget policy", "share load fair rotation"],
     "followups": ["Leadership wants more alerts after an incident — how do you respond?"]},
    {"q": "You discover an API key for your production database committed to a public GitHub repository 3 days ago. What do you do?", "level": 2, "theme": "security",
     "points": ["rotate and revoke the credential immediately", "assume compromise check access logs", "scope of exposure what data could be accessed", "remove from git history but rotation matters more", "notify security team and follow incident process", "legal or customer notification if data accessed", "secret scanning pre commit and in CI", "use a secrets manager"],
     "followups": ["Logs show the key was used from an unknown IP — next steps?"]},
    {"q": "A batch job that used to take 1 hour now takes 9 hours as data grew. How do you approach it?", "level": 2, "theme": "performance",
     "points": ["profile where the time goes", "algorithmic complexity quadratic behavior", "database queries per row versus bulk", "parallelize or partition the work", "incremental processing instead of full recompute", "skew in data partitions", "checkpointing and restartability", "SLA and monitoring for duration"],
     "followups": ["The job must finish before 6 AM — what's your short-term fix?"]},
    {"q": "Two services disagree on an order's status (Orders says PAID, Payments says FAILED). How did this happen and how do you fix the design?", "level": 3, "theme": "consistency",
     "points": ["dual write without atomicity", "lost or out of order events", "transactional outbox", "idempotent consumers", "single source of truth for payment status", "saga with compensation", "reconciliation job", "event versioning and ordering by key"],
     "followups": ["How do you repair the existing inconsistent orders?"]},
    {"q": "Traffic is expected to grow 10× for a sale event in 3 weeks. How do you prepare?", "level": 2, "theme": "capacity",
     "points": ["forecast peak QPS per service", "load test at 10x plus headroom", "find bottlenecks database connections dependencies", "autoscaling limits and pre-scaling", "caching and CDN for hot content", "rate limiting and queueing for spikes", "feature freeze and runbooks", "war room and dashboards", "graceful degradation plan"],
     "followups": ["Load test shows the DB fails at 4× — what now?"]},
    {"q": "A junior engineer's PR introduces a design you think will cause problems at scale, but it works and the deadline is tomorrow. What do you do?", "level": 2, "theme": "leadership",
     "points": ["assess real risk and timeline", "explain concerns with concrete scenarios not authority", "ask questions coach rather than rewrite", "options ship with follow-up ticket or small change now", "document tech debt with owner", "pair with them on the fix", "keep psychological safety"],
     "followups": ["They disagree with your assessment — how do you resolve it?"]},
    {"q": "Your service's error rate is fine, but the business says conversions dropped 20% since yesterday. How do you investigate?", "level": 3, "theme": "business",
     "points": ["check business funnel metrics by step", "recent deploys experiments feature flags", "client side errors not visible in server metrics", "segment by platform region browser version", "third party dependencies payment or analytics", "synthetic monitoring of user journey", "work with product and data teams", "add business KPI alerts"],
     "followups": ["It's only Safari users — what might it be?"]},
    {"q": "Disk on your Kafka brokers is 90% full and rising. What do you do right now and afterwards?", "level": 2, "theme": "kafka",
     "points": ["identify largest topics and partitions", "reduce retention temporarily on non critical topics", "check for stuck consumers blocking compaction", "add brokers or disk and reassign partitions", "compression settings", "alert at lower thresholds", "capacity planning per topic"],
     "followups": ["Why can't you just delete old segment files by hand?"]},
    {"q": "Your team is asked to reduce cloud costs by 30% without hurting reliability. Where do you start?", "level": 2, "theme": "cost",
     "points": ["cost visibility by service and team tags", "rightsize over provisioned instances and pods", "autoscaling and scale to zero for non prod", "reserved or savings plans and spot for batch", "storage lifecycle policies", "data transfer costs across AZs", "delete unused resources", "track cost per request as a metric"],
     "followups": ["What would you NOT cut?"]},
]

PROJECT_GENERIC = [
    {"q": "Give me a 2-minute overview of {p}: the problem it solves, who uses it, and your role.", "points": ["business problem and users", "scale numbers users traffic data", "your specific role and ownership", "team size", "main outcome with metrics"]},
    {"q": "Draw the architecture of {p}. Walk me through a request end to end.", "points": ["main components and responsibilities", "data flow of a request", "data stores and why", "sync vs async communication", "external dependencies"]},
    {"q": "What was the hardest technical problem in {p} and how did you solve it?", "points": ["concrete hard problem", "options considered", "trade-offs of the chosen approach", "how you validated it", "measurable result"]},
    {"q": "Which design decision in {p} would you change today, and why?", "points": ["honest reflection", "what you know now that you didn't then", "cost of changing it", "how you would migrate"]},
    {"q": "How does {p} handle failures — a dependency down, a node crash, bad data?", "points": ["timeouts retries circuit breakers", "idempotency", "data durability and backups", "graceful degradation", "alerting and runbooks"]},
    {"q": "How would {p} cope with 10× the current load? What breaks first?", "points": ["current bottleneck identified", "horizontal scaling plan", "database scaling caching partitioning", "load testing evidence", "cost implications"]},
    {"q": "How did you test {p}, and how did you deploy changes safely?", "points": ["unit integration contract tests", "CI pipeline", "canary or blue green", "feature flags", "rollback strategy"]},
    {"q": "How did you monitor {p} in production? Tell me about an incident.", "points": ["key metrics and SLOs", "logs and traces", "alerting", "specific incident timeline", "root cause and follow-ups"]},
    {"q": "What measurable impact did {p} have? How do you know?", "points": ["baseline before", "metric after", "how it was measured", "business impact", "your contribution vs team"]},
    {"q": "How is data modeled in {p}? Why that database?", "points": ["entities and relationships", "access patterns", "database choice trade-offs", "indexes or partition keys", "consistency requirements"]},
    {"q": "Tell me about a disagreement on the {p} team and how it was resolved.", "points": ["specific disagreement", "understood other view", "data or prototype", "decision and commitment", "outcome"]},
    {"q": "How is {p} secured? Authentication, authorization, secrets, data protection.", "points": ["authentication method", "authorization checks per resource", "secrets management", "encryption in transit and at rest", "input validation"]},
]

TECH_PROBES = {
    "Kafka": ("Why Kafka in {p}? How did you choose the partition key, and how do you handle duplicates, ordering and poison messages?", ["partition key and ordering", "consumer groups and scaling", "idempotent consumers", "dead letter topic", "monitoring consumer lag"]),
    "Spring Boot": ("How is {p}'s Spring Boot service structured? How do you handle transactions, validation and errors?", ["layering controller service repository", "@Transactional boundaries and pitfalls", "validation and global exception handling", "configuration per environment", "actuator health metrics"]),
    "Microservices": ("How did you define service boundaries in {p}, and how do services communicate and stay consistent?", ["bounded contexts", "sync vs async communication", "database per service", "saga or outbox for consistency", "distributed tracing"]),
    "Kubernetes": ("How is {p} deployed on Kubernetes? Probes, resources, scaling and rollouts?", ["deployments and services", "readiness and liveness probes", "requests and limits", "HPA autoscaling", "rolling or canary rollouts"]),
    "Redis/Caching": ("How does {p} use caching? How do you keep it consistent and avoid stampedes?", ["what is cached and TTL", "cache aside invalidation", "stampede protection", "eviction policy", "behavior when cache is down"]),
    "PostgreSQL/MySQL": ("What were the heaviest queries in {p}, and how did you optimize them?", ["indexes and query plans", "N plus one avoidance", "connection pooling", "transactions and isolation", "migrations without downtime"]),
    "NoSQL": ("Why a NoSQL store for {p}? How did you design keys around access patterns?", ["access patterns first", "partition key choice and hot partitions", "consistency settings", "secondary indexes trade-offs"]),
    "AWS": ("Which AWS services does {p} use and why? How is it made highly available?", ["service choices", "multi AZ", "IAM least privilege", "cost awareness", "managed vs self hosted trade-offs"]),
    "Flink": ("How does {p} use Flink? Explain state, checkpoints and event-time handling.", ["keyed state", "checkpointing and exactly once", "watermarks and late data", "backpressure", "savepoints for upgrades"]),
    "Spark": ("How does {p} process data with Spark? How did you tune it?", ["partitioning and shuffles", "data skew handling", "caching", "file formats", "cluster sizing"]),
    "Data Warehousing": ("How is data modeled in {p}'s warehouse or lakehouse?", ["star schema facts and dimensions", "slowly changing dimensions", "incremental loads", "data quality checks", "partitioning"]),
    "Elasticsearch": ("How does {p} use Elasticsearch? How do you keep the index in sync with the source of truth?", ["index mapping and analyzers", "sync via CDC or events", "reindexing strategy", "relevance tuning", "shard sizing"]),
    "React": ("How is {p}'s frontend structured? State management and performance?", ["component structure", "state management", "data fetching and caching", "rendering performance", "testing"]),
    "LLMs/GenAI": ("How does {p} use LLMs? How did you evaluate quality and control cost and latency?", ["retrieval or prompting design", "evaluation set and metrics", "hallucination mitigation", "latency and cost controls", "guardrails and safety"]),
    "Security": ("How does {p} handle authentication and authorization end to end?", ["identity provider and tokens", "token validation", "authorization per resource", "secrets handling", "audit logging"]),
    "CI/CD": ("Describe {p}'s CI/CD pipeline. How long does it take and how do you keep it reliable?", ["stages build test deploy", "test pyramid", "artifact promotion", "deployment strategy", "pipeline duration and flakiness"]),
    "Observability": ("What dashboards and alerts exist for {p}? Which SLOs?", ["SLIs and SLOs", "RED or USE metrics", "tracing", "alerting on symptoms", "runbooks"]),
}


def project_questions(text, name=""):
    """Interview questions for the Project Round, tailored to the technologies found in the description."""
    text = (text or "").strip()
    p = name.strip() or "this project"
    qs = [dict(q, q=q["q"].format(p=p), level=2, theme="project", followups=["Can you go one level deeper?", "What numbers can you share?"]) for q in PROJECT_GENERIC]
    skills = knowledge.detect_skills(text)
    for sk in sorted(skills, key=lambda k: -skills[k]):
        if sk in TECH_PROBES:
            q, pts = TECH_PROBES[sk]
            qs.append({"q": q.format(p=p), "points": pts, "level": 3, "theme": "tech", "skill": sk, "followups": ["What would you do differently?"]})
    # claims with numbers → "how did you measure that?"
    for m in re.finditer(r"([^.\n]*?\b\d+(?:\.\d+)?\s*(?:%|x|ms|k\b|m\b|million|tb|gb|qps|rps|users|requests)[^.\n]*)", text, re.I):
        claim = m.group(1).strip(" -•*")
        if 15 < len(claim) < 220:
            qs.append({"q": "You said: “%s”. How did you measure that, and what was your specific contribution?" % claim,
                       "points": ["baseline and measurement method", "your specific actions", "trade-offs", "how it was verified"], "level": 2, "theme": "claim", "followups": []})
    return qs, sorted(skills, key=lambda k: -skills[k])


def register():
    bank.TRACKS.setdefault("scenarios", {"name": "Production scenarios & troubleshooting", "icon": "🚨", "minutes": 6})
    bank.TRACKS.setdefault("project", {"name": "Project round — deep dive on YOUR project", "icon": "📁", "minutes": 6})
    bank.Q["scenarios"] = SCENARIOS


register()
