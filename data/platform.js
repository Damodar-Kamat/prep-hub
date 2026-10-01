/* Kafka, Kubernetes and DevOps — dedicated sections (the Learn hub also pulls in the related
   topics that live in Data Engineering and Cloud). */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];

window.STUDY_SECTIONS.push({
  id: "kafka",
  title: "Kafka",
  icon: "🌊",
  blurb: "Beyond the basics: partitioning & data modeling for topics, Kafka Streams, Connect & Schema Registry, performance tuning and the production troubleshooting playbook.",
  topics: [
    {
      id: "kafka-design",
      title: "Designing Topics, Keys, Partitions & Event Schemas",
      summary: "How to model events in Kafka — topic granularity, choosing keys for ordering and load spread, partition counts, retention and compaction, and schema evolution.",
      tags: ["kafka", "design", "must-know"],
      brushup: [
        "One topic per event type / entity stream (orders.v1), not per consumer.",
        "The <b>key</b> decides the partition → ordering per key; pick the entity whose events must stay ordered (orderId, accountId).",
        "Hot keys (one huge customer) overload a partition — salt the key or split that tenant.",
        "Partitions = max consumer parallelism; size for peak throughput ÷ per-consumer throughput, with headroom (increasing later remaps keys).",
        "Retention by time/size for event streams; <b>compaction</b> for changelog/state topics (latest value per key; tombstone = null value deletes).",
        "Schemas (Avro/Protobuf/JSON Schema) in a Schema Registry with BACKWARD compatibility: add optional fields, never reuse/rename.",
        "Event types: notification (id only), event-carried state transfer (full state), delta. Prefer self-contained events for consumers' independence.",
        "Include event id, type, version, timestamp, trace id in headers/envelope.",
      ],
      detail: `
<h2>Sizing partitions</h2>
<pre><code>peak = 50 MB/s produce, one consumer instance handles ≈ 5 MB/s
partitions ≥ 50 / 5 = 10  → choose 24 for 2× headroom and future growth
replication.factor = 3, min.insync.replicas = 2, producer acks=all</code></pre>
<h2>Envelope</h2>
<pre><code>key:     order-8812
headers: event_type=OrderPlaced, schema_version=3, traceparent=00-…
value:   { "eventId": "…uuid…", "occurredAt": "2025-02-01T10:00:00Z",
           "orderId": "order-8812", "customerId": "c-19", "total": 1499.00, "lines": [...] }</code></pre>
<h2>Compatibility rules</h2>
<table><tr><th>Mode</th><th>Guarantee</th><th>Safe changes</th></tr>
<tr><td>BACKWARD</td><td>New consumers read old data</td><td>add optional fields, delete fields</td></tr>
<tr><td>FORWARD</td><td>Old consumers read new data</td><td>add fields, delete optional fields</td></tr>
<tr><td>FULL</td><td>Both</td><td>add/remove optional fields only</td></tr></table>`,
      pitfalls: ["Random keys when ordering matters.", "Too few partitions, then adding more breaks key affinity.", "Breaking schema changes without a new topic version.", "Giant messages (>1 MB) — store in S3 and send a pointer."],
      interviewQs: ["How do you choose a partition key?", "How many partitions would you create and why?", "Compaction vs retention?", "How do you evolve event schemas safely?"],
      resources: [{ t: "Confluent — How to choose the number of partitions", u: "https://www.confluent.io/blog/how-choose-number-topics-partitions-kafka-cluster/", k: "blog" }, { t: "Confluent — Schema evolution and compatibility", u: "https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html", k: "docs" }],
    },
    {
      id: "kafka-streams-connect",
      title: "Kafka Streams, ksqlDB & Kafka Connect",
      summary: "Stream processing inside your service with Kafka Streams (KStream/KTable, state stores, joins, windows) and moving data in/out with Connect and Debezium.",
      tags: ["kafka", "streams", "connect"],
      brushup: [
        "Kafka Streams is a <b>library</b> (no cluster): scales by running more instances; partitions are the unit of parallelism.",
        "<b>KStream</b> = event stream; <b>KTable</b> = changelog (latest per key); GlobalKTable = fully replicated lookup table.",
        "State stores (RocksDB) backed by compacted changelog topics → fault tolerant; standby replicas speed failover.",
        "Joins need co-partitioning (same key, same partition count) — otherwise repartition.",
        "Windows: tumbling, hopping, sliding, session; grace period for late events.",
        "processing.guarantee=exactly_once_v2 for read-process-write atomicity.",
        "Kafka Connect: source/sink connectors (JDBC, S3, Elasticsearch, Debezium CDC) run in a Connect cluster; SMTs for light transforms; DLQ for bad records.",
        "ksqlDB: SQL over streams for simpler pipelines.",
      ],
      detail: `
<pre><code>StreamsBuilder b = new StreamsBuilder();
KStream&lt;String, Order&gt; orders = b.stream("orders.v1");
KTable&lt;String, Customer&gt; customers = b.table("customers.v1");

orders.filter((k, o) -&gt; o.total() &gt; 0)
      .selectKey((k, o) -&gt; o.customerId())                 // repartition by customer
      .join(customers, (o, c) -&gt; new EnrichedOrder(o, c))    // KStream-KTable join
      .groupByKey()
      .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(5), Duration.ofMinutes(1)))
      .count(Materialized.as("orders-per-customer-5m"))
      .toStream()
      .to("customer-order-counts");</code></pre>
<h2>Debezium CDC → Kafka</h2>
<p>Debezium reads the database's WAL/binlog and emits a change event per row (before/after). Combined with the outbox table pattern it gives reliable event publishing without dual writes.</p>`,
      pitfalls: ["Joining non-co-partitioned topics.", "Unbounded state from missing window retention.", "Running heavy transformations in Connect SMTs."],
      interviewQs: ["KStream vs KTable?", "How does Kafka Streams achieve fault tolerance for state?", "What is Debezium and how does it relate to the outbox pattern?"],
      resources: [{ t: "Kafka Streams docs", u: "https://kafka.apache.org/documentation/streams/", k: "docs" }, { t: "Debezium docs", u: "https://debezium.io/documentation/", k: "docs" }],
    },
    {
      id: "kafka-troubleshooting",
      title: "Kafka in Production: Tuning & Troubleshooting Playbook",
      summary: "Producer/consumer tuning knobs and a playbook for the incidents you'll actually face — lag, rebalances, under-replicated partitions, disk, duplicates.",
      tags: ["kafka", "operations"],
      brushup: [
        "Producer throughput: <code>batch.size</code>, <code>linger.ms</code> (5–20 ms), <code>compression.type=lz4/zstd</code>; durability: <code>acks=all</code>, idempotence on.",
        "Consumer: <code>max.poll.records</code>, <code>max.poll.interval.ms</code> (processing time budget), <code>fetch.min.bytes</code>, cooperative-sticky assignor, static membership (<code>group.instance.id</code>) to avoid rebalances on restart.",
        "Key metrics: consumer lag (per partition), under-replicated partitions, offline partitions, request latency, ISR shrinks, disk usage, rebalance rate.",
        "Lag growing: slow processing, poison message, rebalance storm, too few partitions/consumers, downstream slowness.",
        "Duplicates: at-least-once + retries → idempotent consumers (dedupe by event id / upsert).",
        "Under-replicated partitions: broker down, disk or network saturation, slow follower.",
      ],
      detail: `
<h2>Lag playbook</h2>
<ol>
<li>Is lag on all partitions or a few? Few → hot key or a stuck consumer/poison message.</li>
<li>Rebalances in consumer logs? → processing exceeds <code>max.poll.interval.ms</code>; lower <code>max.poll.records</code> or speed up.</li>
<li>Processing time per record and downstream latency (DB, HTTP) — usually the real cause.</li>
<li>Scale consumers up to the partition count; beyond that, parallelize within a consumer (per-key ordering preserved with keyed worker queues).</li>
<li>Send poison messages to a DLT after N retries; alert on DLT volume.</li>
</ol>
<pre><code>kafka-consumer-groups.sh --bootstrap-server b:9092 --describe --group orders-svc
kafka-topics.sh --describe --under-replicated-partitions --bootstrap-server b:9092</code></pre>`,
      pitfalls: ["Auto-commit with async processing (commits before work is done).", "Huge max.poll.records with slow handlers → rebalance loops.", "No alerting on lag or DLT."],
      interviewQs: ["Consumer lag keeps growing — what do you check?", "How do you avoid rebalance storms?", "How do you handle duplicate messages?", "What producer settings give durability without losing throughput?"],
      resources: [{ t: "Confluent — Kafka consumer lag monitoring", u: "https://docs.confluent.io/platform/current/monitor/monitor-consumer-lag.html", k: "docs" }, { t: "Kafka docs — Operations", u: "https://kafka.apache.org/documentation/#operations", k: "docs" }],
    },
  ],
});

window.STUDY_SECTIONS.push({
  id: "kubernetes",
  title: "Kubernetes",
  icon: "☸️",
  blurb: "Deeper Kubernetes: cluster networking & ingress, scheduling & autoscaling, configuration/secrets/RBAC security, Helm & GitOps packaging, and a troubleshooting playbook.",
  topics: [
    {
      id: "k8s-networking",
      title: "Kubernetes Networking: Services, DNS, Ingress, Network Policies",
      summary: "How pods talk to each other and the outside world — pod IPs, Services and kube-proxy, CoreDNS, Ingress/Gateway API and network policies.",
      tags: ["kubernetes", "networking"],
      brushup: [
        "Every pod gets its own IP (CNI plugin: Calico, Cilium, AWS VPC CNI); pods talk directly without NAT.",
        "Service = stable virtual IP + DNS name over a changing set of pods (selected by labels). Types: ClusterIP, NodePort, LoadBalancer, Headless (for StatefulSets).",
        "kube-proxy (iptables/IPVS) or eBPF (Cilium) implements Service load balancing.",
        "DNS: <code>svc.namespace.svc.cluster.local</code> via CoreDNS.",
        "Ingress (NGINX, ALB controller) or the newer Gateway API for L7 HTTP routing and TLS termination.",
        "NetworkPolicies are default-allow until you add one; then only allowed traffic flows — start with default-deny per namespace.",
      ],
      detail: `
<pre><code>apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: orders-allow-from-gateway, namespace: shop }
spec:
  podSelector: { matchLabels: { app: orders } }
  policyTypes: [Ingress]
  ingress:
    - from:
        - namespaceSelector: { matchLabels: { name: edge } }
          podSelector: { matchLabels: { app: gateway } }
      ports: [{ port: 8080 }]</code></pre>
<h2>Request path</h2>
<pre><code>Client → cloud LB → Ingress controller pod → Service (ClusterIP) → kube-proxy/eBPF → one of the ready pods</code></pre>`,
      pitfalls: ["Service selector labels not matching pod labels (no endpoints).", "Readiness probe failing → pods removed from endpoints silently.", "No network policies at all in multi-tenant clusters."],
      interviewQs: ["How does a request reach a pod from the internet?", "ClusterIP vs NodePort vs LoadBalancer vs Headless?", "How do network policies work?"],
      resources: [{ t: "Kubernetes — Services, load balancing and networking", u: "https://kubernetes.io/docs/concepts/services-networking/", k: "docs" }],
    },
    {
      id: "k8s-scheduling-scaling",
      title: "Scheduling, Resources & Autoscaling (HPA, VPA, Cluster Autoscaler, KEDA)",
      summary: "How pods are placed on nodes and how clusters scale — requests/limits and QoS, affinity and taints, PDBs, HPA/VPA, cluster autoscaling and event-driven scaling.",
      tags: ["kubernetes", "scaling"],
      brushup: [
        "Scheduler places pods by <b>requests</b> (not actual usage); limits cap usage (CPU throttled, memory OOMKilled).",
        "QoS classes: Guaranteed (requests = limits), Burstable, BestEffort — BestEffort evicted first under pressure.",
        "Affinity/anti-affinity and topology spread constraints spread replicas across nodes/zones.",
        "Taints repel pods; tolerations allow them (dedicated GPU nodes, spot pools).",
        "HPA scales replicas on CPU/memory/custom/external metrics; VPA right-sizes requests; Cluster Autoscaler / Karpenter adds nodes for pending pods.",
        "KEDA scales on event sources (Kafka lag, queue depth), including to zero.",
        "PodDisruptionBudgets keep enough replicas during drains/upgrades.",
      ],
      detail: `
<pre><code>apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: orders }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: orders }
  minReplicas: 3
  maxReplicas: 30
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 65 } }
  behavior:
    scaleDown: { stabilizationWindowSeconds: 300 }</code></pre>
<p>Rule of thumb for JVM services: set memory request = limit, heap via <code>-XX:MaxRAMPercentage=70</code>, CPU request realistic and CPU limit generous or unset to avoid throttling.</p>`,
      pitfalls: ["No requests → noisy neighbours and bad scheduling.", "Tight CPU limits causing latency from throttling.", "HPA on CPU for I/O-bound services (scale on lag/RPS instead).", "All replicas on one node/zone."],
      interviewQs: ["Requests vs limits and what happens when each is exceeded?", "How does the HPA decide to scale?", "How would you autoscale a Kafka consumer deployment?", "How do you keep replicas spread across zones?"],
      resources: [{ t: "Kubernetes — Resource management", u: "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/", k: "docs" }, { t: "KEDA", u: "https://keda.sh/", k: "docs" }],
    },
    {
      id: "k8s-security-config",
      title: "Config, Secrets, RBAC & Pod Security",
      summary: "Managing configuration and secrets, least-privilege access with RBAC and service accounts, and hardening pods.",
      tags: ["kubernetes", "security"],
      brushup: [
        "ConfigMaps for config, Secrets for credentials (base64, not encrypted by default — enable encryption at rest or use External Secrets / Vault / CSI driver).",
        "RBAC: Role/ClusterRole (verbs on resources) bound to users/groups/ServiceAccounts via (Cluster)RoleBinding.",
        "Each workload gets its own ServiceAccount; map to cloud IAM (IRSA / Workload Identity) instead of static keys.",
        "Pod Security Standards (restricted): runAsNonRoot, readOnlyRootFilesystem, drop capabilities, no privilege escalation.",
        "Admission control (Kyverno/OPA Gatekeeper) enforces policies; image signing and scanning in CI.",
      ],
      detail: `
<pre><code>securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities: { drop: ["ALL"] }</code></pre>`,
      pitfalls: ["Secrets committed to git in manifests.", "cluster-admin bound to CI service accounts.", "Containers running as root with writable filesystems."],
      interviewQs: ["How do you manage secrets in Kubernetes?", "Explain RBAC with an example.", "How would you harden a pod?"],
      resources: [{ t: "Kubernetes — Security concepts", u: "https://kubernetes.io/docs/concepts/security/", k: "docs" }],
    },
    {
      id: "k8s-helm-gitops",
      title: "Packaging & Delivery: Helm, Kustomize, GitOps (Argo CD)",
      summary: "How teams package Kubernetes apps and deploy them declaratively — Helm charts, Kustomize overlays, GitOps reconciliation and progressive delivery.",
      tags: ["kubernetes", "gitops"],
      brushup: [
        "Helm: templated charts + values per environment; releases with history and rollback.",
        "Kustomize: patch-based overlays (base + dev/prod) without templating.",
        "GitOps: desired state in git; Argo CD/Flux continuously reconcile the cluster; drift detected and corrected; deploy = merge a PR.",
        "Progressive delivery: Argo Rollouts / Flagger for canary with automatic metric analysis and rollback.",
        "Promote the same immutable image digest across environments.",
      ],
      detail: `<pre><code>repo: platform-config/
  apps/orders/base/          (deployment, service, hpa)
  apps/orders/overlays/staging/kustomization.yaml   (image tag, replicas)
  apps/orders/overlays/prod/kustomization.yaml
CI builds image → opens PR bumping the tag in overlays/staging → Argo CD syncs → tests pass → PR to prod</code></pre>`,
      pitfalls: ["Manual kubectl changes that GitOps then reverts.", "Different images per environment.", "Secrets in Helm values files."],
      interviewQs: ["Helm vs Kustomize?", "What is GitOps and its benefits?", "How would you implement canary releases on Kubernetes?"],
      resources: [{ t: "Argo CD docs", u: "https://argo-cd.readthedocs.io/", k: "docs" }, { t: "Helm docs", u: "https://helm.sh/docs/", k: "docs" }],
    },
    {
      id: "k8s-troubleshooting",
      title: "Kubernetes Troubleshooting Playbook",
      summary: "A systematic approach to Pending, CrashLoopBackOff, ImagePullBackOff, OOMKilled, failing probes and unreachable services.",
      tags: ["kubernetes", "debugging", "must-know"],
      brushup: [
        "Start with <code>kubectl get pods -o wide</code>, <code>describe</code> (events!), <code>logs --previous</code>.",
        "<b>Pending</b>: insufficient CPU/memory for requests, taints, affinity, unbound PVC.",
        "<b>ImagePullBackOff</b>: wrong tag, private registry auth, rate limits.",
        "<b>CrashLoopBackOff</b>: app exits — config/secret missing, failing migrations, bad command; check logs of the previous container.",
        "<b>OOMKilled</b>: memory limit too low or leak; JVM heap vs container limit.",
        "<b>Running but not Ready</b>: readiness probe failing (wrong path/port, slow startup → startupProbe).",
        "Service unreachable: endpoints empty (selector mismatch / not ready), network policy, wrong port/targetPort.",
      ],
      detail: `
<pre><code>kubectl get events -n shop --sort-by=.lastTimestamp | tail -20
kubectl describe pod orders-7c9f -n shop            # Events, Last State, exit code, OOMKilled
kubectl logs orders-7c9f -n shop --previous
kubectl get endpoints orders -n shop                  # empty → selector/readiness problem
kubectl top pod -n shop                               # actual usage vs requests
kubectl debug -it orders-7c9f --image=nicolaka/netshoot --target=app   # ephemeral debug container</code></pre>
<table><tr><th>Exit code</th><th>Meaning</th></tr><tr><td>1</td><td>app error</td></tr><tr><td>137</td><td>SIGKILL (often OOMKilled)</td></tr><tr><td>143</td><td>SIGTERM (graceful stop)</td></tr></table>`,
      pitfalls: ["Liveness probes that kill slow-starting apps (use startupProbe).", "Debugging from your laptop instead of inside the cluster network.", "Ignoring events."],
      interviewQs: ["A pod is in CrashLoopBackOff — walk me through debugging.", "A pod is Running but gets no traffic — why?", "What does exit code 137 mean?"],
      resources: [{ t: "Kubernetes — Debug running pods", u: "https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/", k: "docs" }, { t: "Learnk8s — Troubleshooting deployments (flowchart)", u: "https://learnk8s.io/troubleshooting-deployments", k: "article" }],
    },
  ],
});

window.STUDY_SECTIONS.push({
  id: "devops",
  title: "DevOps & SRE",
  icon: "🚀",
  blurb: "Delivery and reliability practices: deployment strategies, SLOs & error budgets, incident management, release engineering, GitOps/IaC workflows and platform engineering.",
  topics: [
    {
      id: "devops-deploy-strategies",
      title: "Deployment Strategies: Rolling, Blue-Green, Canary, Feature Flags",
      summary: "How to release changes safely and roll back fast — trade-offs between deployment strategies, database changes, and decoupling deploy from release.",
      tags: ["devops", "deployment", "must-know"],
      brushup: [
        "<b>Rolling</b>: replace instances gradually — default in Kubernetes; mixed versions run together.",
        "<b>Blue-green</b>: two full environments, switch traffic at once; instant rollback, double capacity.",
        "<b>Canary</b>: route 1% → 10% → 50% → 100% with automated metric checks (errors, latency, business KPIs).",
        "<b>Feature flags</b>: ship dark, enable per user/segment; kill switches; clean up old flags.",
        "Shadow/dark traffic: mirror requests to the new version without serving its responses.",
        "DB changes: expand/contract so old and new code both work during rollout.",
        "Automated rollback on SLO regression.",
      ],
      detail: `
<table><tr><th>Strategy</th><th>Rollback</th><th>Cost</th><th>Risk exposure</th></tr>
<tr><td>Rolling</td><td>Minutes (roll back)</td><td>Low</td><td>Gradual, all users eventually</td></tr>
<tr><td>Blue-green</td><td>Seconds (switch)</td><td>2× env</td><td>All users at once</td></tr>
<tr><td>Canary</td><td>Seconds (shift back)</td><td>Low–medium</td><td>Small % first</td></tr>
<tr><td>Feature flag</td><td>Instant (toggle)</td><td>Code complexity</td><td>Targeted segments</td></tr></table>`,
      pitfalls: ["Canary without automated analysis (nobody watches).", "Breaking DB migrations deployed with the code.", "Flags that live forever."],
      interviewQs: ["Compare blue-green and canary deployments.", "How do you roll back a release that included a DB migration?", "What are feature flags good and bad for?"],
      resources: [{ t: "Martin Fowler — BlueGreenDeployment", u: "https://martinfowler.com/bliki/BlueGreenDeployment.html", k: "article" }, { t: "Argo Rollouts", u: "https://argoproj.github.io/rollouts/", k: "docs" }],
    },
    {
      id: "devops-slo",
      title: "SLIs, SLOs, Error Budgets & Alerting",
      summary: "Defining reliability in user terms, spending error budgets deliberately, and building alerts that page only for real user impact.",
      tags: ["devops", "sre"],
      brushup: [
        "SLI = measurement (e.g. % of requests < 300 ms and non-5xx). SLO = target for the SLI over a window (99.9% over 30 days). SLA = contractual promise with penalties.",
        "Error budget = 1 − SLO (99.9% → 43 min/month). Budget left → ship faster; budget burnt → freeze features, fix reliability.",
        "Alert on <b>burn rate</b> (multi-window: fast 1h/5m for pages, slow 6h/30m for tickets), not on raw CPU.",
        "Every page needs a runbook and must be actionable.",
        "Measure SLOs at the edge closest to users (load balancer), per critical user journey.",
      ],
      detail: `
<h2>Nines</h2>
<table><tr><th>SLO</th><th>Downtime / 30 days</th></tr><tr><td>99%</td><td>7.2 h</td></tr><tr><td>99.9%</td><td>43.2 min</td></tr><tr><td>99.95%</td><td>21.6 min</td></tr><tr><td>99.99%</td><td>4.3 min</td></tr></table>
<h2>Burn-rate alert</h2>
<p>Burn rate 14.4 over 1 h (and over 5 min) = 2% of a 30-day budget gone in an hour → page. Burn rate 1 = budget lasts exactly the window.</p>`,
      pitfalls: ["100% targets.", "SLOs nobody looks at.", "Alerting on causes instead of symptoms."],
      interviewQs: ["SLI vs SLO vs SLA?", "What is an error budget and how is it used?", "How would you design alerting for an API?"],
      resources: [{ t: "Google SRE book — Service Level Objectives", u: "https://sre.google/sre-book/service-level-objectives/", k: "book" }, { t: "Google SRE workbook — Alerting on SLOs", u: "https://sre.google/workbook/alerting-on-slos/", k: "book" }],
    },
    {
      id: "devops-incidents",
      title: "Incident Management & Postmortems",
      summary: "Running an incident from page to postmortem — roles, communication, mitigation-first mindset and blameless learning.",
      tags: ["devops", "sre", "incidents"],
      brushup: [
        "Severity levels define response (SEV1 = customer-facing outage).",
        "Roles: incident commander (coordinates), ops/tech lead (fixes), communications lead (status page, stakeholders), scribe.",
        "<b>Mitigate first</b> (rollback, failover, feature flag off, scale), root-cause later.",
        "Regular status updates with next-update time.",
        "Blameless postmortem: timeline, impact, root cause(s) & contributing factors, what went well, action items with owners and dates.",
        "Track MTTD/MTTR and recurring causes; run game days / chaos experiments.",
      ],
      detail: `<h2>Postmortem template</h2><ol><li>Summary & impact (users, duration, revenue)</li><li>Timeline (detection → mitigation → resolution)</li><li>Root cause & contributing factors (5 whys)</li><li>What went well / poorly / where we got lucky</li><li>Action items (prevent, detect, mitigate) with owners</li></ol>`,
      pitfalls: ["Debugging root cause while users are down.", "Blaming individuals.", "Action items never done."],
      interviewQs: ["Walk me through how you handled a major incident.", "What makes a good postmortem?", "How do you reduce MTTR?"],
      resources: [{ t: "PagerDuty Incident Response docs", u: "https://response.pagerduty.com/", k: "docs" }, { t: "Google SRE — Postmortem culture", u: "https://sre.google/sre-book/postmortem-culture/", k: "book" }],
    },
    {
      id: "devops-release-eng",
      title: "Release Engineering: Pipelines, Artifacts, Branching, Supply-Chain Security",
      summary: "Fast, reliable, secure delivery pipelines — trunk-based development, build once/promote, test stages, caching and SBOM/signing.",
      tags: ["devops", "cicd"],
      brushup: [
        "Trunk-based development with short-lived branches + feature flags beats long-lived release branches.",
        "Build once, promote the same immutable artifact (image digest) through environments.",
        "Pipeline stages: lint/unit → build → integration/contract → security scans → deploy staging → smoke/e2e → progressive prod.",
        "Keep CI under ~10 minutes: caching, parallelism, test selection, fix flaky tests.",
        "Supply chain: pin dependencies, SBOM, image scanning, signing (Sigstore/cosign), SLSA provenance, least-privilege CI credentials (OIDC to cloud).",
      ],
      detail: `<pre><code># GitHub Actions sketch
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    permissions: { id-token: write, contents: read }     # OIDC to the cloud, no static keys
    steps:
      - uses: actions/checkout@v4
      - run: ./gradlew test build
      - run: docker build -t $REG/orders:$GITHUB_SHA .
      - run: trivy image --exit-code 1 --severity CRITICAL $REG/orders:$GITHUB_SHA
      - run: cosign sign $REG/orders@$DIGEST</code></pre>`,
      pitfalls: ["Rebuilding per environment.", "Long-lived secrets in CI.", "Ignoring flaky tests until nobody trusts CI."],
      interviewQs: ["Design a CI/CD pipeline for a microservice.", "Trunk-based vs GitFlow?", "How do you secure the software supply chain?"],
      resources: [{ t: "DORA — Capabilities", u: "https://dora.dev/capabilities/", k: "article" }, { t: "SLSA framework", u: "https://slsa.dev/", k: "docs" }],
    },
    {
      id: "devops-platform",
      title: "Platform Engineering & Developer Experience",
      summary: "Building internal platforms (golden paths, self-service infra, templates) that make the right way the easy way.",
      tags: ["devops", "platform"],
      brushup: [
        "Platform as a product: internal developers are customers; measure adoption and satisfaction.",
        "Golden paths: service templates with CI/CD, observability, security built in.",
        "Self-service infra via IaC modules / Crossplane / portals (Backstage).",
        "Paved road, not a cage — allow escape hatches.",
        "Metrics: lead time, onboarding time to first deploy, DORA metrics, developer surveys.",
      ],
      detail: `<p>A new service from the template should get: repo + CI pipeline, container build, Kubernetes manifests/Helm, dashboards + SLO alerts, secrets wiring, service catalog entry — in minutes.</p>`,
      pitfalls: ["Building a platform nobody asked for.", "Mandating adoption instead of earning it."],
      interviewQs: ["What is platform engineering?", "How would you improve developer productivity for 100 engineers?"],
      resources: [{ t: "Backstage", u: "https://backstage.io/docs/overview/what-is-backstage", k: "docs" }, { t: "Team Topologies", u: "https://teamtopologies.com/", k: "book" }],
    },
  ],
});
