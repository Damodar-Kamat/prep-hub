/* Software Architecture & Engineering Craft — the cross-cutting knowledge expected from lead engineers. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "architecture",
  title: "Software Architecture & Craft",
  icon: "🏗️",
  blurb: "Architecture styles, DDD, event-driven design with CQRS/event sourcing, API evolution, multi-tenancy, privacy & compliance, clean code, testing strategy, performance & capacity, Git workflows, concurrency models and the language landscape.",
  topics: [
    {
      id: "arch-styles",
      title: "Architecture Styles: Layered, Hexagonal, Modular Monolith, Microservices, Serverless",
      summary: "The major ways to structure systems, what each optimizes for, and how to choose — including why a modular monolith is often the right start.",
      tags: ["architecture", "must-know"],
      brushup: [
        "<b>Layered</b> (controller → service → repository): simple, common; risk of anemic models and leaky layers.",
        "<b>Hexagonal / Ports & Adapters / Clean</b>: domain at the center, depends on nothing; adapters (DB, HTTP, Kafka) plug into ports → testable, swappable infrastructure.",
        "<b>Modular monolith</b>: one deployable, strong module boundaries (enforced) — most of microservices' design benefits without distributed-systems costs.",
        "<b>Microservices</b>: independently deployable services per bounded context; team autonomy and independent scaling at the cost of network calls, distributed data, operations.",
        "<b>Event-driven</b>: services communicate via events → loose coupling, async, harder to trace and reason about consistency.",
        "<b>Serverless</b>: functions/managed services; no servers to run, pay per use; cold starts, limits, vendor lock-in.",
        "Conway's law: architecture mirrors the org's communication structure — design teams and systems together.",
        "Choose by team size, domain clarity, scaling needs and operational maturity — not fashion.",
      ],
      detail: `
<h2>Hexagonal architecture</h2>
<pre><code>          HTTP adapter        Kafka consumer adapter
                 \\                 /
             [ inbound ports: PlaceOrderUseCase ]
                        DOMAIN (entities, rules)
             [ outbound ports: OrderRepository, PaymentGateway, EventPublisher ]
                 /                 \\
        Postgres adapter        Stripe adapter / Kafka producer adapter</code></pre>
<p>The domain has no imports from frameworks; tests use in-memory adapters; swapping Postgres for DynamoDB touches only an adapter.</p>

<h2>Comparison</h2>
<table>
<tr><th>Style</th><th>Best when</th><th>Main cost</th></tr>
<tr><td>Modular monolith</td><td>One or a few teams, evolving domain</td><td>Discipline to keep module boundaries</td></tr>
<tr><td>Microservices</td><td>Many teams, clear domains, different scaling/release needs</td><td>Distributed complexity, platform investment</td></tr>
<tr><td>Event-driven</td><td>Many consumers of the same facts, async workflows</td><td>Observability, eventual consistency</td></tr>
<tr><td>Serverless</td><td>Spiky/low traffic, glue code, small teams</td><td>Limits, cold starts, lock-in, local testing</td></tr>
</table>

<h2>Microservices prerequisites ("you must be this tall")</h2>
<ul><li>CI/CD with fast, independent deploys.</li><li>Observability: centralized logs, metrics, tracing.</li><li>Service ownership and on-call per team.</li><li>Platform basics: service discovery, config, secrets, resilience libraries.</li></ul>`,
      pitfalls: ["Microservices for a 4-person team (distributed monolith).", "Services sharing one database schema.", "Hexagonal ceremony for trivial CRUD apps.", "Ignoring Conway's law."],
      interviewQs: ["Monolith vs microservices — how do you decide?", "What is hexagonal architecture and why use it?", "What is a modular monolith?", "Explain Conway's law with an example."],
      resources: [
        { t: "Fundamentals of Software Architecture — Richards & Ford", u: "https://www.oreilly.com/library/view/fundamentals-of-software/9781492043447/", k: "book" },
        { t: "Martin Fowler — Microservice prerequisites", u: "https://martinfowler.com/bliki/MicroservicePrerequisites.html", k: "article" },
        { t: "Alistair Cockburn — Hexagonal architecture", u: "https://alistair.cockburn.us/hexagonal-architecture/", k: "article" },
      ],
    },
    {
      id: "arch-ddd",
      title: "Domain-Driven Design: Bounded Contexts, Aggregates, Ubiquitous Language",
      summary: "Modeling complex business domains so code matches how the business thinks — and using bounded contexts to draw service boundaries.",
      tags: ["ddd", "architecture"],
      brushup: [
        "<b>Ubiquitous language</b>: the same terms in conversations, docs and code, agreed with domain experts.",
        "<b>Bounded context</b>: a boundary within which a model and its language are consistent ('Customer' in Billing ≠ 'Customer' in Support).",
        "Bounded contexts are the best candidates for service/module boundaries.",
        "<b>Context mapping</b>: relationships between contexts — customer/supplier, conformist, anti-corruption layer, shared kernel, published language.",
        "Tactical patterns: <b>entities</b> (identity), <b>value objects</b> (immutable, equality by value), <b>aggregates</b> (consistency boundary with one root), repositories, domain events, domain services.",
        "One transaction modifies one aggregate; cross-aggregate consistency is eventual via domain events.",
        "Strategic design first; tactical patterns only where the domain is complex (core domain).",
        "Event storming workshops discover events, commands, aggregates and boundaries.",
      ],
      detail: `
<h2>Aggregate example</h2>
<pre><code>class Order {                          // aggregate root
    private final OrderId id;
    private final List&lt;OrderLine&gt; lines = new ArrayList&lt;&gt;();   // only modified through Order
    private OrderStatus status = OrderStatus.DRAFT;

    void addLine(ProductId p, Quantity q, Money price) {
        if (status != OrderStatus.DRAFT) throw new IllegalStateException("order is placed");
        lines.add(new OrderLine(p, q, price));        // invariant enforced inside the boundary
    }
    OrderPlaced place() {
        if (lines.isEmpty()) throw new IllegalStateException("empty order");
        status = OrderStatus.PLACED;
        return new OrderPlaced(id, total());         // domain event → inventory, payments react
    }
}</code></pre>

<h2>Context map example</h2>
<pre><code>[Catalog] --published language (product events)--> [Ordering]
[Ordering] --customer/supplier--> [Payments]
[Ordering] --anti-corruption layer--> [Legacy ERP]   (translate ERP's model, don't let it leak in)</code></pre>

<h2>Subdomain types</h2>
<ul><li><b>Core</b>: differentiates the business — invest in rich modeling.</li><li><b>Supporting</b>: needed, specific — simpler design.</li><li><b>Generic</b>: solved problems (auth, payments) — buy/use off-the-shelf.</li></ul>`,
      pitfalls: ["Anemic domain models (getters/setters only, logic in services).", "Huge aggregates that lock everything.", "Using DDD tactics for simple CRUD.", "One shared 'enterprise model' for all contexts."],
      interviewQs: ["What is a bounded context?", "How do you decide microservice boundaries?", "What's an aggregate and why only one per transaction?", "Entity vs value object?"],
      resources: [
        { t: "Domain-Driven Design Distilled — Vaughn Vernon", u: "https://www.oreilly.com/library/view/domain-driven-design-distilled/9780134434964/", k: "book" },
        { t: "Martin Fowler — Bounded Context", u: "https://martinfowler.com/bliki/BoundedContext.html", k: "article" },
        { t: "EventStorming — Alberto Brandolini", u: "https://www.eventstorming.com/", k: "article" },
      ],
    },
    {
      id: "arch-eda",
      title: "Event-Driven Architecture, Event Sourcing & CQRS",
      summary: "Designing systems around events — notification vs state transfer, event sourcing for auditability, CQRS read models, and the consistency trade-offs.",
      tags: ["event-driven", "cqrs", "event-sourcing"],
      brushup: [
        "Event types: <b>event notification</b> (something happened, fetch details), <b>event-carried state transfer</b> (event contains the data), <b>domain events</b>.",
        "Events are facts in the past tense (OrderPlaced), immutable; commands are requests (PlaceOrder) that may fail.",
        "<b>Event sourcing</b>: store the sequence of events as the source of truth; current state = fold over events; snapshots for speed. Full audit, time travel, rebuild projections.",
        "<b>CQRS</b>: separate write model (commands, invariants) from read models (projections optimized for queries), often updated asynchronously.",
        "Costs: eventual consistency in read models, event schema evolution (upcasting/versioning), replay tooling, more moving parts.",
        "Choreography vs orchestration for workflows (see sagas).",
        "Contracts: schema registry, versioned events, consumer-driven contract tests.",
      ],
      detail: `
<h2>Event sourcing in one picture</h2>
<pre><code>Account 42 event stream:
  AccountOpened(42, owner=Dee)
  MoneyDeposited(42, 500)
  MoneyWithdrawn(42, 120)
  MoneyDeposited(42, 50)
state = fold(events) → balance 430
Projections: balances table (for queries), monthly statements, fraud features — all rebuildable by replay</code></pre>

<h2>CQRS flow</h2>
<pre><code>command → validate against write model (aggregate) → append events → publish
events → projector → read model (denormalized table/search index/cache) → queries</code></pre>

<h2>When to use</h2>
<table>
<tr><th>Use</th><th>Avoid</th></tr>
<tr><td>Strong audit/regulatory needs (finance, healthcare), complex domains, many read shapes</td><td>Simple CRUD, teams new to the patterns, strong read-after-write needs everywhere</td></tr>
</table>`,
      pitfalls: ["Event sourcing everything by default.", "Events that leak internal database structure.", "No plan for event versioning.", "Assuming read models are instantly consistent."],
      interviewQs: ["What is event sourcing and when would you use it?", "Explain CQRS.", "Event notification vs event-carried state transfer?", "How do you evolve event schemas?"],
      resources: [
        { t: "Martin Fowler — What do you mean by 'Event-Driven'?", u: "https://martinfowler.com/articles/201701-event-driven.html", k: "article" },
        { t: "Martin Fowler — CQRS", u: "https://martinfowler.com/bliki/CQRS.html", k: "article" },
        { t: "Microsoft — Event Sourcing pattern", u: "https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing", k: "docs" },
      ],
    },
    {
      id: "arch-api-evolution",
      title: "API & Schema Evolution, Backward Compatibility, Deprecation",
      summary: "Changing interfaces that others depend on without breaking them — compatibility rules for APIs, events and databases, and how to deprecate.",
      tags: ["api", "compatibility"],
      brushup: [
        "<b>Backward compatible</b> (new server, old clients work): add optional fields, new endpoints, new enum values only if clients tolerate unknowns.",
        "Breaking: removing/renaming fields, changing types or semantics, making optional fields required, changing defaults.",
        "<b>Postel's law</b> for clients: be tolerant readers — ignore unknown fields.",
        "Versioning strategies: URL (/v2), header/media type, or evolve-without-versions (additive only) + GraphQL field deprecation.",
        "Protobuf: never reuse field numbers; mark removed fields reserved. Avro: defaults for new fields.",
        "Database: expand → migrate → contract; never break the currently deployed code.",
        "Deprecation: announce, measure usage, provide migration guide, sunset date (Sunset header), then remove.",
        "Consumer-driven contract tests (Pact) catch breaking changes in CI.",
      ],
      detail: `
<h2>Safe vs breaking changes</h2>
<table>
<tr><th>Change</th><th>Safe?</th></tr>
<tr><td>Add optional response field</td><td>✅</td></tr>
<tr><td>Add optional request field with default</td><td>✅</td></tr>
<tr><td>Add new endpoint</td><td>✅</td></tr>
<tr><td>Add enum value</td><td>⚠️ only if clients handle unknown values</td></tr>
<tr><td>Rename / remove field</td><td>❌ (add new, deprecate old)</td></tr>
<tr><td>Change field type or units</td><td>❌</td></tr>
<tr><td>Tighten validation</td><td>❌ for existing callers</td></tr>
</table>

<h2>Deprecation playbook</h2>
<ol><li>Ship the replacement; document migration.</li><li>Mark deprecated (docs, OpenAPI deprecated: true, Deprecation/Sunset headers).</li><li>Track callers by API key/user-agent; reach out to the top consumers.</li><li>Brownouts (scheduled short outages of the old API) before removal.</li><li>Remove after the sunset date.</li></ol>`,
      pitfalls: ["Renaming fields for aesthetics.", "Reusing protobuf field numbers.", "Deploying a DB migration that breaks the running version.", "Removing APIs without usage data."],
      interviewQs: ["How do you evolve an API without breaking clients?", "How do you version APIs?", "How do you deprecate an endpoint used by 50 teams?"],
      resources: [
        { t: "Google API Design Guide — Compatibility", u: "https://cloud.google.com/apis/design/compatibility", k: "docs" },
        { t: "Protocol Buffers — Updating a message type", u: "https://protobuf.dev/programming-guides/proto3/#updating", k: "docs" },
        { t: "Pact — consumer-driven contract testing", u: "https://docs.pact.io/", k: "docs" },
      ],
    },
    {
      id: "arch-multitenancy",
      title: "Multi-Tenancy & SaaS Architecture",
      summary: "Serving many customers from shared infrastructure — isolation models, noisy neighbours, per-tenant limits, data partitioning and tenant-aware operations.",
      tags: ["saas", "architecture"],
      brushup: [
        "Isolation models: <b>silo</b> (dedicated stack per tenant), <b>pool</b> (shared everything, tenant_id everywhere), <b>bridge/hybrid</b> (shared app, per-tenant DB or schema).",
        "Trade-off: isolation & compliance vs cost & operational simplicity.",
        "Enforce tenant isolation at every layer: auth context carries tenant_id, row-level security, per-tenant encryption keys.",
        "<b>Noisy neighbour</b> protection: per-tenant rate limits, quotas, fair queuing, workload isolation for big tenants.",
        "Shard by tenant; move large tenants to dedicated shards (tiered offerings).",
        "Tenant-aware observability: metrics and logs tagged with tenant for support and billing.",
        "Onboarding/offboarding automation; per-tenant data export and deletion.",
      ],
      detail: `
<h2>Isolation models</h2>
<table>
<tr><th>Model</th><th>Isolation</th><th>Cost</th><th>Typical use</th></tr>
<tr><td>Silo</td><td>Strongest</td><td>Highest</td><td>Regulated enterprise customers</td></tr>
<tr><td>Bridge (DB per tenant)</td><td>Strong data isolation</td><td>Medium</td><td>Mid-market SaaS</td></tr>
<tr><td>Pool (shared tables)</td><td>Logical only</td><td>Lowest</td><td>SMB / self-serve</td></tr>
</table>

<h2>Row-level security (Postgres)</h2>
<pre><code>ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invoices USING (tenant_id = current_setting('app.tenant_id')::uuid);
-- app sets: SET app.tenant_id = '...' per request/transaction</code></pre>`,
      pitfalls: ["Forgetting tenant_id in one query → data leak.", "One big tenant degrading everyone.", "No per-tenant cost visibility.", "Hard-coded tenant assumptions preventing migration between tiers."],
      interviewQs: ["How would you design a multi-tenant SaaS database?", "How do you prevent noisy neighbours?", "Silo vs pool tenancy?"],
      resources: [
        { t: "AWS SaaS Lens (Well-Architected)", u: "https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/saas-lens.html", k: "docs" },
        { t: "PostgreSQL — Row security policies", u: "https://www.postgresql.org/docs/current/ddl-rowsecurity.html", k: "docs" },
      ],
    },
    {
      id: "arch-privacy",
      title: "Data Privacy, Compliance & Governance for Engineers",
      summary: "What engineers must build for GDPR/DPDP-style regulations — PII classification, minimization, retention, deletion, consent, audit and data residency.",
      tags: ["privacy", "compliance", "security"],
      brushup: [
        "Classify data (public, internal, confidential, PII, sensitive PII) and handle each class by policy.",
        "<b>Data minimization</b>: collect only what you need; keep it only as long as needed (retention policies with automated deletion).",
        "User rights: access/export, correction, <b>deletion</b> (including backups, caches, analytics, downstream systems).",
        "Consent and purpose limitation: record why data was collected; honor opt-outs.",
        "Pseudonymize/tokenize identifiers in analytics; encrypt sensitive fields; restrict access with audit logs.",
        "<b>Data residency</b>: some laws require data to stay in a region.",
        "Regimes to know by name: GDPR (EU), India's DPDP Act 2023, CCPA/CPRA (California), HIPAA (US health), PCI DSS (cards), SOC 2 (controls audit).",
        "Privacy by design: include a privacy section in every design doc.",
      ],
      detail: `
<h2>Deletion architecture</h2>
<pre><code>DeleteUser(42) request
 → identity service marks user deleted, publishes UserDeletionRequested(42)
 → every service owning user data consumes the event, deletes/anonymizes, emits UserDataDeleted(service, 42)
 → orchestrator tracks completion across services; SLA (e.g. 30 days); audit record kept (without PII)
 → analytics: drop or re-key rows; backups: expire naturally within retention window, or crypto-shred (delete per-user key)</code></pre>

<h2>Checklist for a new feature</h2>
<ul><li>What personal data? Why needed? Legal basis/consent?</li><li>Where stored, replicated, logged? (logs are a common PII leak)</li><li>Who can access it? Audited?</li><li>Retention period and deletion path?</li><li>Cross-border transfers?</li></ul>`,
      pitfalls: ["PII in logs and error messages.", "Deletion that misses analytics copies and caches.", "No retention policy — data kept forever.", "Production data copied to dev environments."],
      interviewQs: ["How would you implement 'delete my account' across microservices?", "How do you keep PII out of logs?", "What is crypto-shredding?", "What does GDPR mean for system design?"],
      resources: [
        { t: "GDPR — official text & guides", u: "https://gdpr.eu/", k: "docs" },
        { t: "OWASP — Logging cheat sheet (sensitive data)", u: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", k: "docs" },
      ],
    },
    {
      id: "craft-clean-code",
      title: "Clean Code & Refactoring",
      summary: "Writing code others can change safely — naming, functions, cohesion and coupling, common code smells and the refactorings that fix them.",
      tags: ["clean-code", "refactoring"],
      brushup: [
        "Names reveal intent; functions do one thing at one level of abstraction; small, focused modules.",
        "<b>High cohesion, low coupling</b>: things that change together live together; depend on abstractions at boundaries.",
        "Prefer composition over inheritance; immutability by default; make illegal states unrepresentable (types).",
        "Code smells: long method, large class, long parameter list, duplicated code, feature envy, shotgun surgery, primitive obsession, data clumps, speculative generality.",
        "Refactor in small, behaviour-preserving steps with tests green: extract method/class, rename, introduce parameter object, replace conditional with polymorphism.",
        "Boy-scout rule: leave code better than you found it — within reason and scope.",
        "YAGNI / KISS: don't build for hypothetical futures; but DRY knowledge, not just text.",
        "Comments explain <i>why</i>, not <i>what</i>.",
      ],
      detail: `
<h2>Smell → refactoring</h2>
<table>
<tr><th>Smell</th><th>Refactoring</th></tr>
<tr><td>Long method</td><td>Extract Method, Decompose Conditional</td></tr>
<tr><td>Switch on type everywhere</td><td>Replace Conditional with Polymorphism / Strategy</td></tr>
<tr><td>Long parameter list / data clumps</td><td>Introduce Parameter Object</td></tr>
<tr><td>Primitive obsession (String email)</td><td>Replace Primitive with Value Object</td></tr>
<tr><td>Feature envy</td><td>Move Method to the data's owner</td></tr>
<tr><td>Shotgun surgery</td><td>Move/Inline to gather the change in one place</td></tr>
</table>

<h2>Before / after</h2>
<pre><code>// before
double price(Order o) {
    if (o.type == 1) return o.base * 0.9;          // what is 1?
    else if (o.type == 2) return o.base * 0.8 + 5;
    return o.base;
}
// after
interface PricingPolicy { Money price(Money base); }
record MemberPricing() implements PricingPolicy { public Money price(Money b) { return b.times(0.9); } }
record WholesalePricing() implements PricingPolicy { public Money price(Money b) { return b.times(0.8).plus(Money.of(5)); } }</code></pre>`,
      pitfalls: ["Big-bang refactors mixed with feature changes.", "Abstractions for one use case.", "Clever code over clear code.", "Refactoring without tests."],
      interviewQs: ["What makes code 'clean' to you?", "Name code smells and how you'd fix them.", "How do you refactor safely in a legacy codebase?"],
      resources: [
        { t: "Refactoring (2nd ed.) — Martin Fowler", u: "https://martinfowler.com/books/refactoring.html", k: "book" },
        { t: "Refactoring.Guru — code smells", u: "https://refactoring.guru/refactoring/smells", k: "article" },
        { t: "A Philosophy of Software Design — John Ousterhout", u: "https://web.stanford.edu/~ouster/cgi-bin/book.php", k: "book" },
      ],
    },
    {
      id: "craft-testing",
      title: "Testing Strategy: Pyramid, Contracts, Property-Based, TDD",
      summary: "Designing a test suite that gives confidence fast — which tests at which level, test doubles, contract and property-based testing, and flaky-test hygiene.",
      tags: ["testing", "quality", "must-know"],
      brushup: [
        "<b>Test pyramid</b>: many fast unit tests, fewer integration tests, few end-to-end tests. (Testing 'trophy': emphasize integration tests for web apps.)",
        "Test behaviour through public interfaces, not implementation details.",
        "Test doubles: <b>stub</b> (canned answers), <b>mock</b> (verify interactions), <b>fake</b> (working lightweight impl), spy. Prefer fakes/real dependencies (Testcontainers) over deep mocking.",
        "<b>Contract tests</b> (Pact) verify service integrations without full end-to-end environments.",
        "<b>Property-based testing</b> (jqwik, Hypothesis): generate many inputs, assert invariants → finds edge cases.",
        "<b>TDD</b>: red → green → refactor; drives design and small steps.",
        "Mutation testing measures test quality (does the suite catch injected bugs?). Coverage is a floor, not a goal.",
        "Flaky tests destroy trust: quarantine, fix root causes (time, ordering, shared state, async waits).",
      ],
      detail: `
<h2>What to test where</h2>
<table>
<tr><th>Level</th><th>Scope</th><th>Speed</th><th>Examples</th></tr>
<tr><td>Unit</td><td>A function/class, no I/O</td><td>ms</td><td>Pricing rules, parsers, algorithms</td></tr>
<tr><td>Integration</td><td>Component + real DB/broker (Testcontainers)</td><td>seconds</td><td>Repository queries, Kafka consumer</td></tr>
<tr><td>Contract</td><td>API/event compatibility between services</td><td>seconds</td><td>Pact provider verification</td></tr>
<tr><td>End-to-end</td><td>Whole system via UI/API</td><td>minutes</td><td>Critical user journeys only</td></tr>
</table>

<h2>Property-based test (Python Hypothesis)</h2>
<pre><code>from hypothesis import given, strategies as st
@given(st.lists(st.integers()))
def test_sort_is_idempotent_and_ordered(xs):
    s = my_sort(xs)
    assert s == my_sort(s)
    assert all(a &lt;= b for a, b in zip(s, s[1:]))
    assert sorted(xs) == s</code></pre>

<h2>Integration test with Testcontainers (Java)</h2>
<pre><code>@Testcontainers
class OrderRepositoryIT {
    @Container static PostgreSQLContainer&lt;?&gt; pg = new PostgreSQLContainer&lt;&gt;("postgres:16");
    @Test void savesAndLoads() { /* real SQL against a real Postgres */ }
}</code></pre>`,
      pitfalls: ["Mocking everything so tests pass while production breaks.", "Huge slow end-to-end suites as the main safety net.", "Chasing 100% coverage with meaningless asserts.", "Ignoring flaky tests."],
      interviewQs: ["How do you design a test strategy for a microservice?", "Mock vs stub vs fake?", "What is contract testing?", "How do you deal with flaky tests?", "Do you practise TDD? When is it valuable?"],
      resources: [
        { t: "Martin Fowler — The Practical Test Pyramid", u: "https://martinfowler.com/articles/practical-test-pyramid.html", k: "article" },
        { t: "Testcontainers", u: "https://testcontainers.com/", k: "tool" },
        { t: "Hypothesis (property-based testing)", u: "https://hypothesis.readthedocs.io/", k: "docs" },
      ],
    },
    {
      id: "craft-performance",
      title: "Performance Engineering, Load Testing & Capacity Planning",
      summary: "Making systems fast and sizing them correctly — measuring before optimizing, load-test design, queueing intuition and capacity planning.",
      tags: ["performance", "capacity"],
      brushup: [
        "Measure first: define the SLO (p99 latency, throughput), profile, find the bottleneck — then optimize the biggest one.",
        "Latency percentiles and <b>tail latency</b> matter more than averages; fan-out amplifies tails.",
        "<b>Little's law</b>: concurrency = throughput × latency (L = λW) — sizes thread pools and connection pools.",
        "Queueing: latency explodes as utilization approaches 100% — keep headroom (target ~60–70% at peak).",
        "Load test types: <b>load</b> (expected peak), <b>stress</b> (beyond peak to find limits), <b>soak</b> (hours, finds leaks), <b>spike</b> (sudden bursts).",
        "Use realistic traffic mix and data volumes; test in production-like environments; watch the load generator itself.",
        "Capacity planning: forecast demand, measure per-instance capacity, add headroom for failures (N+1/N+2) and growth.",
        "Tools: k6, Gatling, JMeter, Locust; profilers (async-profiler, py-spy, pprof).",
      ],
      detail: `
<h2>Little's law in practice</h2>
<pre><code>Target 2,000 req/s, average latency 50 ms  →  concurrency = 2000 × 0.05 = 100 in-flight requests
Each downstream DB call takes 10 ms and every request makes 3 → DB concurrency ≈ 2000 × 3 × 0.01 = 60 connections</code></pre>

<h2>Why utilization headroom matters (M/M/1 intuition)</h2>
<table>
<tr><th>Utilization</th><th>Relative wait time</th></tr>
<tr><td>50%</td><td>1×</td></tr><tr><td>80%</td><td>4×</td></tr><tr><td>90%</td><td>9×</td></tr><tr><td>95%</td><td>19×</td></tr>
</table>

<h2>k6 load test</h2>
<pre><code>import http from "k6/http";
import { check } from "k6";
export const options = {
  stages: [{ duration: "2m", target: 200 }, { duration: "10m", target: 200 }, { duration: "2m", target: 0 }],
  thresholds: { http_req_duration: ["p(99)&lt;300"], http_req_failed: ["rate&lt;0.01"] },
};
export default function () {
  const r = http.get("https://staging.example.com/api/orders?limit=20");
  check(r, { "200": (res) =&gt; res.status === 200 });
}</code></pre>

<h2>Capacity plan template</h2>
<ol><li>Peak demand forecast (next 12 months, events/sales).</li><li>Per-instance capacity at SLO (from load tests).</li><li>Instances = peak / capacity × (1 + headroom) + failure allowance (lose one AZ).</li><li>Check dependencies scale too (DB, cache, third parties).</li><li>Cost estimate and review cadence.</li></ol>`,
      pitfalls: ["Optimizing without profiling.", "Load testing with unrealistic data (empty caches, tiny DB).", "Reporting averages only.", "Running at 90% utilization 'to save cost'."],
      interviewQs: ["How would you load test a new service?", "Explain Little's law and use it.", "Why does latency spike as utilization rises?", "How do you do capacity planning?", "An endpoint's p99 doubled — how do you investigate?"],
      resources: [
        { t: "Systems Performance — Brendan Gregg", u: "https://www.brendangregg.com/systems-performance-2nd-edition-book.html", k: "book" },
        { t: "k6 documentation", u: "https://grafana.com/docs/k6/latest/", k: "docs" },
        { t: "The Tail at Scale — Dean & Barroso", u: "https://research.google/pubs/the-tail-at-scale/", k: "paper" },
      ],
    },
    {
      id: "craft-git",
      title: "Git Internals & Team Workflows",
      summary: "How Git stores history, and the branching, merging and repository strategies teams use — trunk-based development, monorepos, rebase vs merge.",
      tags: ["git", "workflow"],
      brushup: [
        "Git stores <b>snapshots</b>: blobs (content), trees (directories), commits (tree + parents + metadata), all content-addressed by hash; branches are movable pointers.",
        "<b>Merge</b> preserves history with a merge commit; <b>rebase</b> rewrites commits onto a new base for linear history — never rebase shared branches.",
        "<b>Trunk-based development</b>: short-lived branches (&lt; 1–2 days), merge to main often, feature flags for unfinished work — enables CI/CD.",
        "GitFlow (long-lived develop/release branches) suits versioned releases, not continuous delivery.",
        "<b>Monorepo</b> (one repo, atomic cross-project changes, shared tooling; needs build tooling like Bazel/Nx) vs <b>polyrepo</b> (independent, simpler per repo, harder cross-cutting changes).",
        "Useful commands: bisect (find the bad commit), reflog (recover lost work), cherry-pick, revert (undo safely on shared branches), blame, stash.",
        "Commit hygiene: small commits, meaningful messages (what & why), conventional commits for changelogs.",
      ],
      detail: `
<h2>Object model</h2>
<pre><code>commit c3 ──tree──► root tree ──► blob (README), tree (src/) ──► blob (App.java)
   │ parent
commit c2 ──► ...
branch main ──► c3        HEAD ──► main</code></pre>

<h2>Everyday power tools</h2>
<pre><code>git bisect start; git bisect bad; git bisect good v2.40   # binary search for the commit that broke things
git reflog                                              # find "lost" commits after a bad reset/rebase
git revert &lt;sha&gt;                                          # undo on a shared branch without rewriting history
git rebase -i origin/main                                 # clean up local commits before a PR (locally only)
git log --oneline --graph --decorate --all</code></pre>

<h2>Choosing a workflow</h2>
<table>
<tr><th>Workflow</th><th>Fits</th></tr>
<tr><td>Trunk-based + flags</td><td>Web services with continuous deployment</td></tr>
<tr><td>GitHub flow (PR per feature)</td><td>Most teams; simple</td></tr>
<tr><td>GitFlow / release branches</td><td>Mobile apps, on-prem software with versioned releases</td></tr>
</table>`,
      pitfalls: ["Rebasing/force-pushing shared branches.", "Week-long feature branches with painful merges.", "Committing secrets (rotate immediately — history keeps them).", "Giant commits mixing refactors and features."],
      interviewQs: ["Merge vs rebase?", "What is trunk-based development?", "Monorepo vs polyrepo trade-offs?", "How would you find which commit introduced a bug?"],
      resources: [
        { t: "Pro Git (free book)", u: "https://git-scm.com/book/en/v2", k: "book" },
        { t: "trunkbaseddevelopment.com", u: "https://trunkbaseddevelopment.com/", k: "article" },
        { t: "monorepo.tools", u: "https://monorepo.tools/", k: "article" },
      ],
    },
    {
      id: "craft-concurrency-models",
      title: "Concurrency Models Across Languages: Threads, Async, Actors, CSP, Reactive",
      summary: "The major ways languages structure concurrent work, their trade-offs, and when each fits — the comparative view expected from a lead.",
      tags: ["concurrency", "languages"],
      brushup: [
        "<b>Shared-memory threads + locks</b> (Java, C++, C#): flexible, fast; risks of races, deadlocks; needs a memory model.",
        "<b>Async/await on an event loop</b> (JavaScript, Python asyncio, Rust tokio, C#): great for I/O concurrency; blocking the loop is fatal; 'function colouring'.",
        "<b>Green/virtual threads</b> (Java 21 virtual threads, Go goroutines, Erlang processes): blocking-style code with cheap concurrency.",
        "<b>CSP</b> (Go channels): communicate by passing messages over channels instead of sharing memory; select for multiplexing.",
        "<b>Actors</b> (Erlang/Elixir, Akka): isolated state, mailboxes, supervision trees for fault tolerance; location transparency.",
        "<b>Reactive streams</b> (Reactor, RxJava): composable async pipelines with backpressure; steep learning curve.",
        "<b>Data parallelism</b>: parallel streams, fork/join, SIMD, GPU; MapReduce-style for bulk work.",
        "Rust's ownership model prevents data races at compile time (Send/Sync).",
      ],
      detail: `
<h2>Same task, different models: fetch 3 URLs concurrently</h2>
<pre><code>// Go (CSP)
ch := make(chan string)
for _, u := range urls { go func(u string) { ch &lt;- fetch(u) }(u) }
for range urls { fmt.Println(&lt;-ch) }

// Java 21 (virtual threads)
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    var fs = urls.stream().map(u -&gt; ex.submit(() -&gt; fetch(u))).toList();
    for (var f : fs) System.out.println(f.get());
}

// JavaScript (event loop)
const results = await Promise.all(urls.map(u =&gt; fetch(u).then(r =&gt; r.text())));

// Elixir (actors/processes)
urls |&gt; Task.async_stream(&amp;fetch/1) |&gt; Enum.to_list()</code></pre>

<h2>Choosing</h2>
<table>
<tr><th>Need</th><th>Model</th></tr>
<tr><td>Massive I/O concurrency, simple code</td><td>Virtual threads / goroutines</td></tr>
<tr><td>Browser/UI, Node services</td><td>Event loop + async/await</td></tr>
<tr><td>Fault-tolerant, distributed, stateful entities</td><td>Actors with supervision</td></tr>
<tr><td>CPU-heavy parallel computation</td><td>Thread pools / fork-join / data parallelism</td></tr>
<tr><td>Streaming with backpressure</td><td>Reactive streams or stream processors</td></tr>
</table>`,
      pitfalls: ["Blocking calls inside event loops or reactive pipelines.", "Mixing models arbitrarily in one codebase.", "Assuming async makes CPU work faster."],
      interviewQs: ["Compare threads, async/await and actors.", "How do Go goroutines differ from OS threads?", "When would you choose reactive programming?", "What makes Rust concurrency safe?"],
      resources: [
        { t: "Seven Concurrency Models in Seven Weeks", u: "https://pragprog.com/titles/pb7con/seven-concurrency-models-in-seven-weeks/", k: "book" },
        { t: "Go blog — Share memory by communicating", u: "https://go.dev/blog/codelab-share", k: "article" },
        { t: "Erlang/OTP design principles", u: "https://www.erlang.org/doc/system/design_principles.html", k: "docs" },
      ],
    },
    {
      id: "craft-languages",
      title: "The Language Landscape: Go, Rust, Kotlin, TypeScript, C#, Scala — When to Use What",
      summary: "A lead engineer's comparative view of mainstream languages — strengths, ecosystems and typical use cases — for technology decisions and polyglot teams.",
      tags: ["languages", "decision-making"],
      brushup: [
        "<b>Java</b>: mature JVM ecosystem, enterprise backends, big data (Kafka/Flink/Spark), virtual threads modernized concurrency.",
        "<b>Kotlin</b>: concise JVM language, null safety, coroutines; Android default; great with Spring.",
        "<b>Go</b>: simple, fast compile, static binaries, goroutines — cloud infrastructure (Kubernetes, Docker, Terraform), network services.",
        "<b>Rust</b>: memory safety without GC, C-level performance — systems, infra, performance-critical services, WebAssembly; steeper learning curve.",
        "<b>Python</b>: data, ML, scripting, glue; slower CPU-bound unless using native libs.",
        "<b>TypeScript</b>: typed JavaScript for web frontends and Node backends; one language across the stack.",
        "<b>C#/.NET</b>: modern, fast runtime, strong tooling; enterprise, games (Unity), Azure.",
        "<b>Scala</b>: functional + OO on the JVM; Spark, Akka; smaller hiring pool.",
        "Choose by: team skills and hiring, ecosystem/libraries for the domain, performance needs, operational fit, long-term maintainability.",
      ],
      detail: `
<table>
<tr><th>Language</th><th>Memory</th><th>Concurrency</th><th>Typical domains</th></tr>
<tr><td>Java/Kotlin</td><td>GC (JVM)</td><td>Threads, virtual threads, coroutines (Kotlin)</td><td>Enterprise backends, data platforms, Android</td></tr>
<tr><td>Go</td><td>GC (low latency)</td><td>Goroutines + channels</td><td>Cloud-native infra, CLIs, microservices</td></tr>
<tr><td>Rust</td><td>Ownership, no GC</td><td>async (tokio), threads, compile-time race safety</td><td>Systems, databases, proxies, embedded, WASM</td></tr>
<tr><td>Python</td><td>GC + refcounting</td><td>asyncio, multiprocessing, GIL</td><td>ML/AI, data, automation</td></tr>
<tr><td>TypeScript</td><td>GC (V8)</td><td>Event loop</td><td>Web frontends, BFFs, full-stack</td></tr>
<tr><td>C#</td><td>GC (.NET)</td><td>async/await, tasks</td><td>Enterprise, games, Windows/Azure</td></tr>
</table>
<h2>Polyglot guidance</h2>
<ul><li>Limit the number of languages per org to what you can support (libraries, CI templates, on-call expertise).</li><li>Standardize cross-language concerns: gRPC/OpenAPI contracts, OpenTelemetry, logging format, security scanning.</li></ul>`,
      pitfalls: ["Picking a language because one engineer loves it.", "Rewriting working systems in a new language without a strong reason.", "Too many languages for the team to operate."],
      interviewQs: ["Why would you pick Go over Java for a service?", "When is Rust worth its learning curve?", "How do you manage a polyglot architecture?"],
      resources: [
        { t: "Go — A Tour of Go", u: "https://go.dev/tour/", k: "course" },
        { t: "The Rust Programming Language (free book)", u: "https://doc.rust-lang.org/book/", k: "book" },
        { t: "Kotlin documentation", u: "https://kotlinlang.org/docs/home.html", k: "docs" },
      ],
    },
  ],
});
