/* Microservices — the dedicated section tying design, communication, data and operations together. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "microservices",
  title: "Microservices",
  icon: "🧱",
  blurb: "Decomposition, synchronous vs asynchronous communication, API gateway & BFF, data ownership, distributed transactions, resilience, observability, deployment & service mesh, testing and migration from a monolith.",
  topics: [
    {
      id: "ms-decomposition",
      title: "Decomposing Into Services: Boundaries, Size & Anti-Patterns",
      summary: "How to split a system into services along business capabilities and bounded contexts — and how to recognize a distributed monolith.",
      tags: ["microservices", "must-know"],
      brushup: [
        "Split by <b>business capability / bounded context</b> (Orders, Payments, Catalog), not by technical layer (a 'DB service').",
        "A service owns its data and can be deployed independently; teams own services end to end.",
        "Right size = one team can own it, changes rarely require coordinating other services.",
        "Signals of a bad split: chatty synchronous calls, shared database, lock-step deployments, a change touching 5 services.",
        "<b>Distributed monolith</b>: all the costs of microservices, none of the independence.",
        "Start with a modular monolith; extract services where scaling, team autonomy or release cadence demands it.",
      ],
      detail: `
<h2>Decomposition heuristics</h2>
<table><tr><th>Heuristic</th><th>Question</th></tr>
<tr><td>Business capability</td><td>What does the business do? (take orders, bill customers, ship goods)</td></tr>
<tr><td>Bounded context</td><td>Where does the meaning of a term change?</td></tr>
<tr><td>Change frequency</td><td>What changes together? Keep it together.</td></tr>
<tr><td>Scaling profile</td><td>Does one part need 50× the resources?</td></tr>
<tr><td>Team topology</td><td>Can one team own it end to end?</td></tr></table>
<h2>Anti-patterns</h2>
<ul><li>Shared database between services.</li><li>Entity services (CustomerService with only CRUD) that everyone calls synchronously.</li><li>Nano-services: one endpoint each, network calls everywhere.</li><li>Shared libraries containing domain logic that force coordinated releases.</li></ul>`,
      pitfalls: ["Splitting before the domain is understood.", "Sharing a database 'temporarily'.", "Creating services per developer, not per capability."],
      interviewQs: ["How do you decide service boundaries?", "What is a distributed monolith?", "When would you not use microservices?"],
      resources: [{ t: "Building Microservices (2nd ed.) — Sam Newman", u: "https://samnewman.io/books/building_microservices_2nd_edition/", k: "book" }, { t: "microservices.io — Decompose by business capability", u: "https://microservices.io/patterns/decomposition/decompose-by-business-capability.html", k: "article" }],
    },
    {
      id: "ms-communication",
      title: "Service Communication: Sync (REST/gRPC) vs Async (Events, Queues)",
      summary: "Choosing request/response or messaging between services, the coupling each creates, and patterns like request-reply over queues.",
      tags: ["microservices", "messaging"],
      brushup: [
        "<b>Synchronous</b> (REST/gRPC): simple, immediate answer; temporal coupling — caller fails when callee is down; latency adds up along call chains.",
        "<b>Asynchronous</b> (Kafka, SQS, RabbitMQ): producers don't wait; resilient to downstream outages; eventual consistency and harder debugging.",
        "Commands (do X) vs events (X happened) — events decouple more.",
        "Avoid deep synchronous call chains: availability multiplies (5 services × 99.9% ≈ 99.5%).",
        "Use sync for queries needing an immediate answer; async for workflows, notifications, propagating state changes.",
        "Always: timeouts, retries with backoff + idempotency, circuit breakers, correlation IDs.",
      ],
      detail: `
<table><tr><th></th><th>Sync</th><th>Async</th></tr>
<tr><td>Coupling</td><td>Temporal + location</td><td>Loose</td></tr>
<tr><td>Failure</td><td>Propagates to caller</td><td>Buffered in the broker</td></tr>
<tr><td>Consistency</td><td>Immediate (per call)</td><td>Eventual</td></tr>
<tr><td>Debuggability</td><td>Easy traces</td><td>Needs tracing through messages</td></tr>
<tr><td>Examples</td><td>Price lookup, auth check</td><td>OrderPlaced → inventory, email, analytics</td></tr></table>`,
      pitfalls: ["Synchronous chains 6 services deep.", "Events that carry commands in disguise (tight coupling).", "No dead-letter handling for poison messages."],
      interviewQs: ["When would you use synchronous vs asynchronous communication?", "Commands vs events?", "How do you trace a request across services and queues?"],
      resources: [{ t: "Enterprise Integration Patterns", u: "https://www.enterpriseintegrationpatterns.com/", k: "book" }],
    },
    {
      id: "ms-gateway-bff",
      title: "API Gateway, BFF, Service Discovery & Configuration",
      summary: "The edge and plumbing of a microservice platform — single entry point, client-specific backends, finding services and managing configuration.",
      tags: ["microservices", "api-gateway"],
      brushup: [
        "API gateway: routing, auth, rate limiting, TLS, request aggregation, API keys — keep business logic out of it.",
        "<b>BFF</b> (Backend for Frontend): one API layer per client type (web, mobile) shaping responses for that UI.",
        "Service discovery: client-side (Eureka + client LB) or server-side/platform (Kubernetes Services + DNS, service mesh).",
        "Configuration: externalized per environment (ConfigMaps, Spring Cloud Config, Parameter Store); secrets in a vault.",
        "Feature flags for runtime toggles without deploys.",
      ],
      detail: `
<pre><code>Mobile app ─► Mobile BFF ─┐
Web app    ─► Web BFF    ─┼─► API gateway (auth, rate limit) ─► Orders, Catalog, Users, Payments services
Partners   ─► Public API ─┘</code></pre>`,
      pitfalls: ["Business logic accumulating in the gateway.", "One generic API forcing mobile clients into many round trips.", "Hard-coded service URLs."],
      interviewQs: ["What does an API gateway do?", "What's the BFF pattern?", "How do services discover each other on Kubernetes?"],
      resources: [{ t: "microservices.io — API gateway / BFF", u: "https://microservices.io/patterns/apigateway.html", k: "article" }],
    },
    {
      id: "ms-data",
      title: "Data in Microservices: Database per Service, Queries Across Services, Consistency",
      summary: "Owning data per service and still answering cross-service queries — API composition, CQRS views, event-carried state, sagas and the outbox.",
      tags: ["microservices", "data", "must-know"],
      brushup: [
        "<b>Database per service</b>: no other service reads your tables; share data via APIs or events.",
        "Cross-service queries: <b>API composition</b> (call several services, join in memory) or <b>CQRS read models</b> built from events.",
        "Keep local copies of other services' data you need (event-carried state transfer) — eventually consistent.",
        "Business transactions spanning services → <b>sagas</b> with compensations (see Distributed Transactions).",
        "Publish events reliably with the <b>transactional outbox</b> + CDC.",
        "Idempotent consumers everywhere.",
      ],
      detail: `
<h2>Answering "show order with customer name and payment status"</h2>
<ul>
<li><b>API composition</b>: Order service calls Customer and Payment APIs → simple, but latency and availability depend on all three.</li>
<li><b>Read model</b>: an OrderView service consumes OrderPlaced, CustomerUpdated, PaymentCaptured events and stores a denormalized row → fast reads, eventual consistency.</li>
</ul>`,
      pitfalls: ["Shared database 'for reporting'.", "Distributed joins via synchronous calls in loops.", "Dual writes without an outbox."],
      interviewQs: ["How do you query data owned by multiple services?", "How do you keep data consistent across services?", "Why database per service?"],
      resources: [{ t: "microservices.io — Database per service", u: "https://microservices.io/patterns/data/database-per-service.html", k: "article" }, { t: "microservices.io — CQRS", u: "https://microservices.io/patterns/data/cqrs.html", k: "article" }],
    },
    {
      id: "ms-observability",
      title: "Observability for Microservices: Tracing, Correlation, Logs, Metrics",
      summary: "Seeing through a distributed system — trace context propagation, correlated logs, RED metrics per service and service dependency maps.",
      tags: ["microservices", "observability"],
      brushup: [
        "Distributed tracing: propagate W3C <code>traceparent</code> across HTTP, gRPC and message headers.",
        "Structured JSON logs with traceId, spanId, service, version; centralized (ELK/Loki).",
        "RED metrics per endpoint: rate, errors, duration percentiles; plus saturation of pools and queues.",
        "Consumer lag per topic/queue as a first-class metric.",
        "Service maps and SLOs per user journey, not just per service.",
      ],
      detail: `
<pre><code>checkout-api  ──(traceparent)──►  orders-svc ──(Kafka header traceparent)──► inventory-consumer
      span A                           span B                                      span C (same trace)</code></pre>
<p>OpenTelemetry SDKs/agents auto-instrument common frameworks; the collector exports to Jaeger/Tempo/Datadog.</p>`,
      pitfalls: ["Trace context lost at message boundaries.", "Logs without correlation IDs.", "Alerting per service instead of per user journey."],
      interviewQs: ["How do you debug a slow request that crosses 6 services?", "How is trace context propagated through Kafka?", "What metrics would you put on every service?"],
      resources: [{ t: "OpenTelemetry — Context propagation", u: "https://opentelemetry.io/docs/concepts/context-propagation/", k: "docs" }],
    },
    {
      id: "ms-deployment-mesh",
      title: "Deploying Microservices: Containers, Kubernetes, Service Mesh, Versioning",
      summary: "Independent deployability in practice — pipelines per service, backward-compatible releases, progressive delivery and what a service mesh adds.",
      tags: ["microservices", "kubernetes", "service-mesh"],
      brushup: [
        "Each service: own repo/module, own pipeline, own container image, own deploy schedule.",
        "Backward compatibility across versions (APIs, events, DB) makes independent deploys safe.",
        "Progressive delivery: canary/blue-green with automated metric analysis.",
        "Service mesh (Istio, Linkerd): sidecars/eBPF provide mTLS, retries, timeouts, traffic splitting, telemetry without code changes.",
        "Mesh cost: operational complexity, latency, resource overhead — adopt when you have many services and need uniform policy.",
      ],
      detail: `
<table><tr><th>Concern</th><th>In-library (Resilience4j, OTel SDK)</th><th>Service mesh</th></tr>
<tr><td>mTLS</td><td>Manual</td><td>Automatic</td></tr>
<tr><td>Retries/timeouts</td><td>Per language</td><td>Uniform config</td></tr>
<tr><td>Traffic splitting</td><td>Needs gateway</td><td>Built in</td></tr>
<tr><td>Overhead</td><td>Low</td><td>Sidecar CPU/memory/latency</td></tr></table>`,
      pitfalls: ["Breaking API/event contracts on deploy.", "Retries configured both in the mesh and in code.", "Adopting a mesh for 5 services."],
      interviewQs: ["How do you deploy one microservice without breaking others?", "What does a service mesh give you?", "How do you roll out a breaking API change?"],
      resources: [{ t: "Istio — Concepts", u: "https://istio.io/latest/docs/concepts/", k: "docs" }, { t: "Linkerd — Overview", u: "https://linkerd.io/2/overview/", k: "docs" }],
    },
    {
      id: "ms-testing",
      title: "Testing Microservices: Contracts, Component Tests, Environments",
      summary: "A test strategy that scales with many services — component tests with real infra, consumer-driven contracts, and minimal end-to-end tests.",
      tags: ["microservices", "testing"],
      brushup: [
        "Unit tests + component tests (service with real DB/broker via Testcontainers, dependencies stubbed with WireMock).",
        "<b>Consumer-driven contract tests</b> (Pact) replace most cross-service integration tests.",
        "Few end-to-end tests for critical journeys; run in staging or ephemeral environments.",
        "Test in production safely: canaries, synthetic monitoring, feature flags, dark launches.",
      ],
      detail: `<p>Pact flow: consumer tests generate a contract ("I call GET /orders/42 and expect {id, status}") → published to a broker → provider CI verifies it against the real provider → deploys are gated with <code>can-i-deploy</code>.</p>`,
      pitfalls: ["A shared, always-broken staging environment as the main safety net.", "Mocks drifting from real providers (use contracts)."],
      interviewQs: ["How do you test interactions between services?", "What is consumer-driven contract testing?", "How many end-to-end tests should you have?"],
      resources: [{ t: "Pact docs", u: "https://docs.pact.io/", k: "docs" }, { t: "Martin Fowler — Testing strategies in a microservice architecture", u: "https://martinfowler.com/articles/microservice-testing/", k: "article" }],
    },
    {
      id: "ms-migration",
      title: "Monolith to Microservices Migration",
      summary: "A pragmatic path from monolith to services — modularize first, strangle incrementally, split data carefully and know when to stop.",
      tags: ["microservices", "migration"],
      brushup: [
        "Modularize the monolith first; enforce module boundaries (ArchUnit, Java modules).",
        "Extract the service with the clearest boundary and highest value first (scaling or team autonomy).",
        "Strangler fig routing; parallel run and compare; incremental traffic shift.",
        "Split the data: new service owns its tables; sync via CDC during transition; then cut over writes.",
        "Measure success: deploy frequency, lead time, incidents — not the number of services.",
      ],
      detail: `<ol><li>Identify seams (modules with few dependencies).</li><li>Put an API in front of the module inside the monolith.</li><li>Build the service behind the same API; route a small % of traffic.</li><li>Move data ownership (CDC sync → cutover).</li><li>Delete the module from the monolith.</li></ol>`,
      pitfalls: ["Extracting everything at once.", "Leaving the data shared (distributed monolith).", "No metric for whether the migration helped."],
      interviewQs: ["How would you migrate a monolith to microservices?", "Which service would you extract first?", "How do you split a shared database?"],
      resources: [{ t: "Monolith to Microservices — Sam Newman", u: "https://samnewman.io/books/monolith-to-microservices/", k: "book" }],
    },
  ],
});
