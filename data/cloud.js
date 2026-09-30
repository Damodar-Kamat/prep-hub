/* Cloud, DevOps & Kubernetes. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "cloud",
  title: "Cloud, DevOps & Kubernetes",
  icon: "☁️",
  blurb: "Containers, Kubernetes architecture and operations, core AWS services, cloud architecture for HA/DR, CI/CD and deployment strategies, Terraform, observability/SRE and Linux troubleshooting.",
  topics: [
    {
      id: "docker",
      title: "Containers & Docker",
      summary: "What a container really is (namespaces + cgroups + an image), how images are built in layers, and how to write small, secure, fast-building Dockerfiles.",
      tags: ["docker", "containers", "must-know"],
      brushup: [
        "A container = a normal Linux process isolated with <b>namespaces</b> (pid, net, mnt, uts, ipc, user) and limited with <b>cgroups</b> (CPU, memory), running from an <b>image</b> filesystem.",
        "Containers share the host kernel → lighter and faster than VMs, weaker isolation (use gVisor/Kata/Firecracker for untrusted code).",
        "Images are stacks of read-only <b>layers</b> (one per instruction); a writable layer is added at runtime; layers are cached and shared.",
        "Order Dockerfile instructions from least to most frequently changing (dependencies before source) for cache hits.",
        "<b>Multi-stage builds</b>: compile in a builder image, copy only artifacts into a slim/distroless runtime image.",
        "Run as non-root, pin base image versions/digests, scan images (Trivy), no secrets in layers (use build secrets).",
        "One process per container; log to stdout/stderr; handle SIGTERM for graceful shutdown (PID 1 signal handling → exec form / tini).",
        "Storage: volumes for persistent data; networking: bridge, host, overlay; Compose for local multi-container setups.",
      ],
      detail: `
<h2>Container vs VM</h2>
<table>
<tr><th></th><th>Container</th><th>Virtual machine</th></tr>
<tr><td>Isolation</td><td>Kernel namespaces/cgroups, shared kernel</td><td>Hypervisor, separate kernel</td></tr>
<tr><td>Startup</td><td>Milliseconds</td><td>Seconds–minutes</td></tr>
<tr><td>Size</td><td>MBs</td><td>GBs</td></tr>
<tr><td>Density</td><td>Hundreds per host</td><td>Tens per host</td></tr>
</table>

<h2>A good multi-stage Dockerfile (Java)</h2>
<pre><code>FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q dependency:go-offline          # cached unless pom.xml changes
COPY src ./src
RUN mvn -q package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN adduser -D app
USER app
COPY --from=build /src/target/app.jar /app/app.jar
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]     # exec form → the JVM is PID 1 and receives SIGTERM</code></pre>

<h2>Image hygiene checklist</h2>
<ul>
<li>Small base (alpine, distroless, -slim); remove build tools from the final stage.</li>
<li><code>.dockerignore</code> (.git, node_modules, target) to shrink context and avoid leaking files.</li>
<li>Combine apt-get update + install + cleanup in one RUN.</li>
<li>Pin versions; rebuild regularly for security patches.</li>
<li>Health: HEALTHCHECK locally; Kubernetes uses probes instead.</li>
</ul>

<h2>Under the hood</h2>
<ul>
<li>Image format = OCI; registries store layers by content digest.</li>
<li>Runtime chain: docker CLI → dockerd → containerd → runc (creates namespaces/cgroups). Kubernetes talks to containerd/CRI-O directly via CRI.</li>
<li>Overlay filesystem (overlay2) merges layers; copy-on-write on modification.</li>
</ul>`,
      pitfalls: [
        "COPY . . before installing dependencies → cache busted on every code change.",
        "Running as root; secrets baked into image layers (they stay in history).",
        "Shell-form ENTRYPOINT → app doesn't receive SIGTERM → 30s kill on every deploy.",
        "Using :latest tags in production.",
      ],
      interviewQs: [
        "What is a container? How is it different from a VM?",
        "How do Docker image layers and caching work?",
        "How do you make a Docker image small and secure?",
        "What happens when you run docker run?",
        "How do containers get graceful shutdown right?",
      ],
      resources: [
        { t: "Docker docs — Build best practices", u: "https://docs.docker.com/build/building/best-practices/", k: "docs" },
        { t: "Containers from scratch — Liz Rice (talk)", u: "https://www.youtube.com/watch?v=8fi7uSYlOdc", k: "video" },
        { t: "Trivy — vulnerability scanner", u: "https://trivy.dev/", k: "tool" },
      ],
    },
    {
      id: "k8s-core",
      title: "Kubernetes Architecture & Core Objects",
      summary: "How Kubernetes' control plane reconciles desired state, and the objects you use daily: Pods, Deployments, Services, ConfigMaps, Secrets, StatefulSets, Jobs.",
      tags: ["kubernetes", "must-know"],
      brushup: [
        "Control plane: <b>kube-apiserver</b> (front door, the only thing talking to etcd), <b>etcd</b> (state), <b>scheduler</b> (assigns pods to nodes), <b>controller-manager</b> (reconciliation loops), cloud-controller-manager.",
        "Nodes: <b>kubelet</b> (runs pods via CRI), <b>kube-proxy</b> (Service routing with iptables/IPVS; or eBPF CNIs like Cilium), container runtime.",
        "Declarative model: you submit desired state; controllers loop to make actual state match (<b>reconciliation</b>).",
        "<b>Pod</b> = one or more containers sharing network namespace and volumes; ephemeral. <b>Deployment</b> → ReplicaSet → Pods (stateless, rolling updates).",
        "<b>Service</b> (ClusterIP, NodePort, LoadBalancer) gives a stable virtual IP/DNS in front of pods selected by labels; <b>Ingress/Gateway API</b> for HTTP routing.",
        "<b>StatefulSet</b>: stable identity (pod-0, pod-1), ordered rollout, per-pod PersistentVolumeClaims — databases, Kafka.",
        "<b>DaemonSet</b> (one per node: log agents), <b>Job/CronJob</b> (run to completion).",
        "Config: <b>ConfigMap</b>, <b>Secret</b> (base64, not encrypted by default — enable encryption at rest / external secrets).",
      ],
      detail: `
<h2>What happens on kubectl apply</h2>
<ol>
<li>kubectl sends the Deployment to the API server (authn, authz/RBAC, admission controllers, validation) → stored in etcd.</li>
<li>Deployment controller sees it → creates a ReplicaSet → ReplicaSet controller creates Pod objects (no node yet).</li>
<li>Scheduler watches unscheduled pods → filters nodes (resources, taints, affinity) → scores → binds pod to a node.</li>
<li>Kubelet on that node sees the binding → pulls image via containerd → starts containers → reports status.</li>
<li>Endpoints/EndpointSlice controller adds ready pod IPs to the Service; kube-proxy programs routing.</li>
</ol>

<h2>Minimal production-ish manifest</h2>
<pre><code>apiVersion: apps/v1
kind: Deployment
metadata: { name: orders }
spec:
  replicas: 3
  selector: { matchLabels: { app: orders } }
  strategy: { rollingUpdate: { maxSurge: 1, maxUnavailable: 0 } }
  template:
    metadata: { labels: { app: orders } }
    spec:
      containers:
      - name: app
        image: registry/orders:1.4.2
        ports: [{ containerPort: 8080 }]
        resources:
          requests: { cpu: 250m, memory: 512Mi }
          limits:   { memory: 512Mi }
        readinessProbe: { httpGet: { path: /actuator/health/readiness, port: 8080 }, periodSeconds: 5 }
        livenessProbe:  { httpGet: { path: /actuator/health/liveness,  port: 8080 }, initialDelaySeconds: 30 }
        envFrom: [{ configMapRef: { name: orders-config } }, { secretRef: { name: orders-secrets } }]
---
apiVersion: v1
kind: Service
metadata: { name: orders }
spec: { selector: { app: orders }, ports: [{ port: 80, targetPort: 8080 }] }</code></pre>

<h2>Workload types</h2>
<table>
<tr><th>Object</th><th>Use</th></tr>
<tr><td>Deployment</td><td>Stateless services</td></tr>
<tr><td>StatefulSet</td><td>Databases, brokers — stable names, persistent volumes</td></tr>
<tr><td>DaemonSet</td><td>Per-node agents (logging, monitoring, CNI)</td></tr>
<tr><td>Job / CronJob</td><td>Batch and scheduled tasks</td></tr>
<tr><td>HPA</td><td>Scale replicas on CPU/memory/custom metrics</td></tr>
</table>

<h2>Networking model</h2>
<ul>
<li>Every pod gets its own IP; all pods can reach each other without NAT (implemented by the CNI plugin: Calico, Cilium, AWS VPC CNI).</li>
<li>Service DNS: <code>orders.default.svc.cluster.local</code>. Headless services (clusterIP: None) return pod IPs — used by StatefulSets.</li>
<li>NetworkPolicies restrict pod-to-pod traffic (default allow-all otherwise).</li>
</ul>`,
      pitfalls: [
        "No resource requests → scheduler can't place pods sensibly; noisy neighbours.",
        "Liveness probe checking dependencies → restarts the whole fleet when the DB blips.",
        "Treating Secrets as encrypted by default.",
        "Using Deployments for stateful systems that need stable identity and storage.",
      ],
      interviewQs: [
        "Explain the Kubernetes control plane components.",
        "What happens when you run kubectl apply for a Deployment?",
        "Deployment vs StatefulSet vs DaemonSet?",
        "How does a Service route traffic to pods?",
        "How does the scheduler choose a node?",
      ],
      resources: [
        { t: "Kubernetes documentation — Concepts", u: "https://kubernetes.io/docs/concepts/", k: "docs" },
        { t: "Kubernetes the Hard Way — Kelsey Hightower", u: "https://github.com/kelseyhightower/kubernetes-the-hard-way", k: "repo" },
        { t: "Kubernetes Up & Running (book)", u: "https://www.oreilly.com/library/view/kubernetes-up-and/9781098110192/", k: "book" },
      ],
    },
    {
      id: "k8s-ops",
      title: "Kubernetes in Production: Probes, Resources, Autoscaling, Helm, Troubleshooting",
      summary: "Running real workloads on Kubernetes — resource management, health probes, autoscaling, rollouts, configuration packaging and debugging failing pods.",
      tags: ["kubernetes", "operations"],
      brushup: [
        "<b>Requests</b> drive scheduling; <b>limits</b> cap usage. Exceeding memory limit → OOMKilled; CPU limit → throttling (many teams set no CPU limit, only requests).",
        "QoS classes: Guaranteed (requests = limits), Burstable, BestEffort — evicted in reverse order under node pressure.",
        "<b>Readiness</b> = receive traffic? <b>Liveness</b> = restart me? <b>Startup</b> = give slow apps time before liveness starts.",
        "Autoscaling: <b>HPA</b> (replicas on metrics), <b>VPA</b> (right-size requests), <b>Cluster Autoscaler/Karpenter</b> (nodes), <b>KEDA</b> (event-driven, e.g. Kafka lag).",
        "PodDisruptionBudgets keep minimum replicas during node drains; topology spread/anti-affinity across zones.",
        "Packaging: <b>Helm</b> charts (templated), <b>Kustomize</b> (overlays); GitOps with Argo CD/Flux.",
        "Troubleshooting ladder: get pods → describe (events) → logs (--previous) → exec → check probes/resources/image/config.",
        "Common statuses: CrashLoopBackOff, ImagePullBackOff, Pending (no resources/unschedulable), OOMKilled, CreateContainerConfigError.",
      ],
      detail: `
<h2>Debugging commands</h2>
<pre><code>kubectl get pods -o wide                        # status, restarts, node
kubectl describe pod orders-7d9c-x2k            # events: scheduling, probes, OOMKilled, image pulls
kubectl logs orders-7d9c-x2k --previous         # logs of the crashed container
kubectl exec -it orders-7d9c-x2k -- sh          # poke around (curl localhost:8080/actuator/health)
kubectl get events --sort-by=.lastTimestamp
kubectl top pods / kubectl top nodes            # needs metrics-server
kubectl rollout status deploy/orders; kubectl rollout undo deploy/orders
kubectl port-forward svc/orders 8080:80</code></pre>

<h2>Status → cause</h2>
<table>
<tr><th>Status</th><th>Usual causes</th></tr>
<tr><td>Pending</td><td>Not enough CPU/memory on any node, taints, PVC not bound, affinity too strict</td></tr>
<tr><td>ImagePullBackOff</td><td>Wrong tag, private registry credentials missing</td></tr>
<tr><td>CrashLoopBackOff</td><td>App exits: bad config/env, missing secret, failing migration, liveness probe too aggressive</td></tr>
<tr><td>OOMKilled (exit 137)</td><td>Memory limit too low or leak; JVM heap not sized to limit</td></tr>
<tr><td>Running but not Ready</td><td>Readiness probe failing (dependency down, wrong path/port)</td></tr>
</table>

<h2>Autoscaling</h2>
<pre><code>apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: orders }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: orders }
  minReplicas: 3
  maxReplicas: 30
  metrics:
  - type: Resource
    resource: { name: cpu, target: { type: Utilization, averageUtilization: 65 } }</code></pre>
<p>HPA uses <b>requests</b> as the utilization baseline. For queue consumers, scale on lag with KEDA. Node autoscaling (Karpenter) adds capacity when pods are Pending.</p>

<h2>Zero-downtime deploys checklist</h2>
<ul>
<li>Readiness probes + maxUnavailable 0.</li>
<li>Graceful shutdown: handle SIGTERM, stop accepting, finish in-flight requests; <code>preStop</code> sleep a few seconds so endpoints are removed before the app stops; terminationGracePeriodSeconds long enough.</li>
<li>PodDisruptionBudget + multiple zones.</li>
<li>Backward-compatible DB migrations (expand/contract).</li>
</ul>`,
      pitfalls: [
        "Memory limit lower than JVM heap + overhead.",
        "CPU limits causing throttling and latency spikes.",
        "Liveness probe that restarts pods during GC pauses or slow startups (use startupProbe).",
        "No PDB → a node drain takes down all replicas.",
      ],
      interviewQs: [
        "Requests vs limits? What happens when each is exceeded?",
        "Liveness vs readiness vs startup probes?",
        "A pod is in CrashLoopBackOff — how do you debug?",
        "How do you achieve zero-downtime deployments on Kubernetes?",
        "How would you autoscale a Kafka consumer deployment?",
      ],
      resources: [
        { t: "Kubernetes — Configure liveness, readiness, startup probes", u: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/", k: "docs" },
        { t: "Learnk8s — Troubleshooting deployments (flowchart)", u: "https://learnk8s.io/troubleshooting-deployments", k: "article" },
        { t: "KEDA — event-driven autoscaling", u: "https://keda.sh/", k: "docs" },
        { t: "Helm documentation", u: "https://helm.sh/docs/", k: "docs" },
      ],
    },
    {
      id: "aws-core",
      title: "AWS Core Services for Engineers",
      summary: "The AWS building blocks that show up in system design and backend interviews — compute, storage, databases, messaging, networking and IAM — and when to use each.",
      tags: ["aws", "cloud", "must-know"],
      brushup: [
        "Compute: <b>EC2</b> (VMs), <b>ECS/Fargate</b> (containers), <b>EKS</b> (Kubernetes), <b>Lambda</b> (functions, 15-min max, cold starts).",
        "Storage: <b>S3</b> (object, 11 nines durability, strong read-after-write consistency, storage classes/lifecycle), <b>EBS</b> (block, AZ-bound), <b>EFS</b> (shared NFS).",
        "Databases: <b>RDS/Aurora</b> (managed SQL, Multi-AZ, read replicas), <b>DynamoDB</b> (serverless key-value), <b>ElastiCache</b> (Redis/Memcached), Redshift (warehouse), OpenSearch.",
        "Messaging: <b>SQS</b> (queue; standard = at-least-once, FIFO = ordered, exactly-once processing within dedupe window), <b>SNS</b> (pub/sub fan-out), <b>Kinesis/MSK</b> (streams), <b>EventBridge</b> (event bus).",
        "Networking: <b>VPC</b>, public/private subnets, NAT gateway, security groups (stateful) vs NACLs (stateless), <b>ALB</b> (L7) / <b>NLB</b> (L4), <b>Route 53</b>, <b>CloudFront</b> (CDN), API Gateway.",
        "<b>IAM</b>: users/roles/policies; least privilege; roles for services (instance profiles, IRSA/Pod Identity for EKS); never long-lived keys in code.",
        "Regions → Availability Zones (isolated datacenters); design across ≥ 2 AZs.",
        "Observability: CloudWatch metrics/logs/alarms, X-Ray tracing, CloudTrail (API audit).",
      ],
      detail: `
<h2>Classic three-tier web app on AWS</h2>
<pre><code>Route 53 → CloudFront (static + cache) → ALB (public subnets, 2+ AZs)
         → ECS/EKS services (private subnets, autoscaling)
         → Aurora (Multi-AZ writer + readers), ElastiCache Redis
         → S3 (uploads), SQS + workers (async jobs), SNS/EventBridge (fan-out)
Private subnets reach the internet via NAT gateway; S3/DynamoDB via VPC endpoints.</code></pre>

<h2>Choosing messaging</h2>
<table>
<tr><th>Service</th><th>Model</th><th>Use</th></tr>
<tr><td>SQS Standard</td><td>Queue, at-least-once, best-effort order</td><td>Work queues, decoupling</td></tr>
<tr><td>SQS FIFO</td><td>Ordered per message group, dedupe</td><td>Order-sensitive workflows (lower throughput)</td></tr>
<tr><td>SNS</td><td>Push pub/sub</td><td>Fan-out to many SQS queues/lambdas/emails</td></tr>
<tr><td>EventBridge</td><td>Event bus with rules</td><td>Event-driven integration, SaaS events</td></tr>
<tr><td>Kinesis / MSK</td><td>Partitioned log, replay</td><td>Streaming analytics, event sourcing</td></tr>
</table>

<h2>S3 essentials</h2>
<ul>
<li>Flat key namespace; prefixes scale automatically (thousands of req/s per prefix).</li>
<li>Storage classes: Standard, Intelligent-Tiering, Standard-IA, Glacier tiers; lifecycle rules move/expire objects.</li>
<li>Presigned URLs for direct client uploads/downloads; multipart upload for big files.</li>
<li>Versioning + Object Lock for protection; block public access by default.</li>
</ul>

<h2>Lambda trade-offs</h2>
<ul><li>Pay per request, scales to zero, no servers; 15-minute limit, cold starts (mitigate with provisioned concurrency, SnapStart for Java), connection storms to RDS (use RDS Proxy).</li></ul>

<h2>Security basics</h2>
<ul>
<li>Security groups on every resource, least-open; private subnets for data stores.</li>
<li>KMS encryption at rest; TLS in transit; Secrets Manager/Parameter Store for secrets.</li>
<li>IAM policies scoped to resources and actions; separate accounts per environment (AWS Organizations).</li>
</ul>`,
      pitfalls: [
        "Everything in one AZ.",
        "Public S3 buckets / overly broad IAM policies (\"Action\": \"*\").",
        "NAT gateway data charges from chatty private services (use VPC endpoints).",
        "Lambda → RDS without a proxy (connection exhaustion).",
      ],
      interviewQs: [
        "SQS vs SNS vs Kinesis vs EventBridge?",
        "Design a highly available web application on AWS.",
        "Security groups vs NACLs?",
        "When would you use Lambda vs ECS vs EKS?",
        "How do you give an application access to S3 securely?",
      ],
      resources: [
        { t: "AWS Well-Architected Framework", u: "https://aws.amazon.com/architecture/well-architected/", k: "docs" },
        { t: "AWS Builders' Library", u: "https://aws.amazon.com/builders-library/", k: "article", n: "how Amazon builds and operates systems" },
        { t: "AWS Skill Builder (free courses)", u: "https://skillbuilder.aws/", k: "course" },
      ],
    },
    {
      id: "cloud-architecture",
      title: "Cloud Architecture: High Availability, Disaster Recovery, Multi-Region, Cost",
      summary: "Designing for failure at the zone and region level — availability math, RTO/RPO, DR strategies, multi-region patterns and cost-awareness.",
      tags: ["architecture", "availability", "dr"],
      brushup: [
        "Availability: 99.9% ≈ 8.8 h/year downtime, 99.99% ≈ 52 min, 99.999% ≈ 5 min. Serial dependencies multiply (0.999 × 0.999 ≈ 0.998).",
        "Redundancy in parallel raises availability: 1 − (1 − a)^n.",
        "<b>RPO</b> = how much data you can lose; <b>RTO</b> = how long you can be down.",
        "DR strategies (cost ↑, RTO ↓): <b>backup & restore</b> → <b>pilot light</b> → <b>warm standby</b> → <b>multi-site active-active</b>.",
        "Multi-AZ first (cheap, handles most failures); multi-region for regional outages, latency to users, data residency.",
        "Active-active across regions needs conflict handling for writes (home region per user, CRDTs, global DBs like DynamoDB global tables/Spanner).",
        "Cell-based architecture limits blast radius; static stability (keep working when the control plane fails).",
        "Cost: right-size, autoscale, spot/preemptible for stateless/batch, reserved/savings plans for baseline, watch data transfer.",
      ],
      detail: `
<h2>Availability math</h2>
<pre><code>Service → DB (99.95%) → Cache (99.9%) → Payment API (99.9%) in series:
0.9995 × 0.999 × 0.999 ≈ 0.9975 → 99.75% (≈ 22 h/year)
Two independent replicas each 99%: 1 − 0.01² = 99.99%</code></pre>
<p>Lesson: every hard dependency lowers your ceiling. Make dependencies soft (cache, degrade, async) where possible.</p>

<h2>DR strategies</h2>
<table>
<tr><th>Strategy</th><th>RPO/RTO</th><th>How</th></tr>
<tr><td>Backup & restore</td><td>hours / hours</td><td>Snapshots copied to another region; rebuild with IaC</td></tr>
<tr><td>Pilot light</td><td>minutes / tens of minutes</td><td>Data replicated; minimal core running; scale up on failover</td></tr>
<tr><td>Warm standby</td><td>seconds / minutes</td><td>Scaled-down full copy serving no/low traffic</td></tr>
<tr><td>Active-active</td><td>~0 / ~0</td><td>Both regions serve traffic; routing shifts on failure</td></tr>
</table>

<h2>Multi-region patterns</h2>
<ul>
<li><b>Read-local, write-global</b>: one primary region for writes, replicas elsewhere for reads (simple, higher write latency remotely).</li>
<li><b>Partitioned by user/tenant</b>: each user homed in a region; global routing layer.</li>
<li><b>Globally replicated DB</b> with conflict resolution (DynamoDB global tables LWW, Spanner/CockroachDB consensus).</li>
<li>Route with latency/geo DNS or anycast (Global Accelerator, Cloudflare); health-checked failover.</li>
</ul>

<h2>Testing resilience</h2>
<ul><li>Game days and chaos engineering (kill instances, inject latency, AZ evacuation drills).</li>
<li>Regularly restore backups and fail over for real — an untested DR plan is a hope.</li></ul>`,
      pitfalls: [
        "Claiming 99.99% while depending on a single-region database.",
        "DR runbooks never exercised.",
        "Active-active writes without a conflict strategy.",
        "Cross-region replication costs and latency ignored.",
      ],
      interviewQs: [
        "What's the difference between RTO and RPO?",
        "Compare DR strategies and their costs.",
        "How would you make a service survive a full region outage?",
        "Calculate the availability of a system with three serial dependencies.",
        "How do you reduce cloud costs without hurting reliability?",
      ],
      resources: [
        { t: "AWS — Disaster recovery options in the cloud", u: "https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html", k: "docs" },
        { t: "AWS — Reducing blast radius with cell-based architecture", u: "https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/reducing-scope-of-impact-with-cell-based-architecture.html", k: "docs" },
        { t: "Google SRE — Service level objectives", u: "https://sre.google/sre-book/service-level-objectives/", k: "book" },
      ],
    },
    {
      id: "cicd",
      title: "CI/CD & Deployment Strategies",
      summary: "Building pipelines that ship safely many times a day — stages, testing pyramid, artifact promotion, and rolling/blue-green/canary deployments with feature flags.",
      tags: ["cicd", "deployment", "devops"],
      brushup: [
        "<b>CI</b>: every commit builds, lints, unit-tests, scans; fast feedback (&lt; 10 min). <b>CD</b>: every green build is deployable (delivery) or deployed automatically (deployment).",
        "Build once, <b>promote the same artifact</b> (image digest) through environments; config differs by environment.",
        "Testing pyramid: many unit tests, fewer integration tests (Testcontainers), few end-to-end; plus contract tests between services.",
        "<b>Rolling</b>: replace instances gradually. <b>Blue-green</b>: switch traffic between two full environments (fast rollback, double capacity). <b>Canary</b>: small % first, compare metrics, then ramp.",
        "<b>Feature flags</b> decouple deploy from release; enable per user/percentage; clean up old flags.",
        "Automated rollback on SLO/metric regression (Argo Rollouts, Flagger, Spinnaker).",
        "Trunk-based development + small PRs reduce merge pain; DORA metrics: deploy frequency, lead time, change failure rate, MTTR.",
        "Supply-chain security: dependency scanning, SBOMs, signed images (cosign), least-privilege CI credentials (OIDC).",
      ],
      detail: `
<h2>A typical pipeline</h2>
<pre><code>PR opened → build + unit tests + lint + SAST + dependency scan → review
merge to main → build image (tag = git SHA) → integration tests → push to registry → sign
→ deploy to staging (GitOps commit) → smoke tests → canary 5% in prod → automated analysis
→ ramp 25% → 50% → 100%  (auto-rollback if error rate/latency regress)</code></pre>

<h2>Deployment strategies</h2>
<table>
<tr><th>Strategy</th><th>Pros</th><th>Cons</th></tr>
<tr><td>Recreate</td><td>Simple</td><td>Downtime</td></tr>
<tr><td>Rolling</td><td>No extra capacity, default in K8s</td><td>Mixed versions during rollout; slower rollback</td></tr>
<tr><td>Blue-green</td><td>Instant switch & rollback</td><td>2× capacity; DB must support both versions</td></tr>
<tr><td>Canary</td><td>Limits blast radius, real-traffic validation</td><td>Needs good metrics and traffic splitting</td></tr>
<tr><td>Shadow</td><td>Test with mirrored traffic, zero user impact</td><td>Side effects must be suppressed</td></tr>
</table>

<h2>GitHub Actions example</h2>
<pre><code>name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    permissions: { contents: read, id-token: write }     # OIDC to the cloud, no stored keys
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '21', cache: maven }
      - run: mvn -B verify
      - run: docker build -t registry/app:\${{ github.sha }} .</code></pre>

<h2>Safe database changes in CD</h2>
<p>Deployments and schema changes must be backward compatible for at least one version (expand → deploy → contract), so rollbacks don't break.</p>`,
      pitfalls: [
        "Rebuilding artifacts per environment (what you tested isn't what you ship).",
        "Flaky tests tolerated until nobody trusts CI.",
        "Canary without automated metric analysis.",
        "Feature flags never removed (flag debt).",
        "Long-lived branches and big-bang releases.",
      ],
      interviewQs: [
        "Describe a CI/CD pipeline you built or would build.",
        "Blue-green vs canary vs rolling deployments?",
        "How do you roll back safely when a DB migration is involved?",
        "What are feature flags and their risks?",
        "What are the DORA metrics?",
      ],
      resources: [
        { t: "Martin Fowler — Continuous Integration", u: "https://martinfowler.com/articles/continuousIntegration.html", k: "article" },
        { t: "Accelerate — Forsgren, Humble, Kim", u: "https://itrevolution.com/product/accelerate/", k: "book" },
        { t: "Argo Rollouts — progressive delivery", u: "https://argo-rollouts.readthedocs.io/", k: "docs" },
      ],
    },
    {
      id: "terraform",
      title: "Infrastructure as Code: Terraform",
      summary: "Declaring cloud infrastructure in code — Terraform's plan/apply model, state, modules and the workflow that keeps teams from stepping on each other.",
      tags: ["terraform", "iac"],
      brushup: [
        "IaC: infrastructure defined in versioned code → reviewable, repeatable, reproducible environments.",
        "Terraform: providers + resources in HCL; <b>plan</b> shows the diff between code, state and reality; <b>apply</b> executes it.",
        "<b>State</b> maps code to real resources; store remotely (S3 + DynamoDB lock, Terraform Cloud) with locking; never commit it (may contain secrets).",
        "<b>Modules</b> for reuse; variables/outputs; separate state per environment/component to limit blast radius.",
        "Drift: manual console changes diverge from state → detect with plan; import existing resources.",
        "Lifecycle: create_before_destroy, prevent_destroy for critical resources; watch for resources that force replacement.",
        "Alternatives: CloudFormation/CDK (AWS), Pulumi (general-purpose languages), Crossplane (Kubernetes-native).",
      ],
      detail: `
<pre><code>terraform {
  backend "s3" { bucket = "acme-tfstate" key = "prod/network.tfstate" region = "ap-south-1" dynamodb_table = "tf-locks" }
  required_providers { aws = { source = "hashicorp/aws", version = "~&gt; 5.0" } }
}
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  name    = "prod"
  cidr    = "10.0.0.0/16"
  azs     = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  enable_nat_gateway = true
}</code></pre>
<h2>Team workflow</h2>
<ol>
<li>PR with code change → CI runs <code>fmt</code>, <code>validate</code>, <code>plan</code>, policy checks (OPA/Sentinel, tfsec/Checkov) and posts the plan.</li>
<li>Review the plan (look for destroy/replace!).</li>
<li>Merge → apply from CI with a locked remote state (Atlantis, Terraform Cloud, Spacelift).</li>
</ol>`,
      pitfalls: [
        "Local state files or state in git.",
        "One giant state for everything (slow plans, huge blast radius).",
        "Applying without reading the plan (surprise destroy/recreate of a database).",
        "Secrets in plain variables/outputs.",
      ],
      interviewQs: [
        "What is Terraform state and why does it matter?",
        "How do you manage Terraform across multiple environments?",
        "How do you handle drift?",
        "Terraform vs CloudFormation vs Pulumi?",
      ],
      resources: [
        { t: "Terraform documentation", u: "https://developer.hashicorp.com/terraform/docs", k: "docs" },
        { t: "Terraform: Up & Running — Yevgeniy Brikman", u: "https://www.terraformupandrunning.com/", k: "book" },
      ],
    },
    {
      id: "observability-sre",
      title: "Observability & SRE: SLIs/SLOs, Metrics, Logs, Traces, Incidents",
      summary: "Knowing what your system is doing — the three pillars, golden signals, SLOs with error budgets, alerting that doesn't burn people out, and incident response.",
      tags: ["observability", "sre", "must-know"],
      brushup: [
        "Three pillars: <b>metrics</b> (cheap aggregates over time), <b>logs</b> (detailed events), <b>traces</b> (a request's path across services); plus profiles.",
        "<b>Golden signals</b>: latency, traffic, errors, saturation. RED (rate, errors, duration) for services; USE (utilization, saturation, errors) for resources.",
        "<b>SLI</b> = measured indicator (e.g. % of requests &lt; 300 ms); <b>SLO</b> = target (99.9% over 30 days); <b>SLA</b> = contractual promise; <b>error budget</b> = 1 − SLO.",
        "Alert on <b>symptoms</b> users feel (SLO burn rate), not every cause; every page must be actionable.",
        "Use percentiles (p50/p95/p99), not averages; histograms for aggregation.",
        "Structured logs (JSON) with trace IDs; sample traces; <b>OpenTelemetry</b> as the vendor-neutral standard.",
        "Metric cardinality: labels like user_id explode storage.",
        "Incidents: detect → triage → mitigate first (rollback, failover) → resolve → <b>blameless postmortem</b> with action items.",
      ],
      detail: `
<h2>SLO and error budget example</h2>
<pre><code>SLI: fraction of checkout requests that succeed in &lt; 500 ms
SLO: 99.9% over a rolling 30 days
Error budget: 0.1% ≈ 43 minutes of full outage-equivalent per month
Policy: budget exhausted → freeze risky launches, prioritize reliability work</code></pre>

<h2>Burn-rate alerting</h2>
<p>Alert when you're consuming budget too fast: e.g. page if 2% of the monthly budget burns in 1 hour (burn rate 14.4) confirmed over a short window too; ticket if 10% burns in 3 days. Multi-window burn rates catch both fast and slow burns with few false alarms.</p>

<h2>Prometheus-style metrics</h2>
<pre><code>http_server_requests_seconds_bucket{route="/orders",status="200",le="0.3"}   # histogram
# p99 latency over 5 minutes:
histogram_quantile(0.99, sum by (le, route) (rate(http_server_requests_seconds_bucket[5m])))
# error ratio:
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) / sum(rate(http_server_requests_seconds_count[5m]))</code></pre>

<h2>Distributed tracing</h2>
<ul>
<li>A trace = tree of spans; context (trace ID, span ID) propagated via headers (W3C traceparent).</li>
<li>Find which hop adds latency; correlate logs by trace ID.</li>
<li>Sampling: head-based (decide at start) vs tail-based (keep slow/error traces).</li>
<li>Stack: OpenTelemetry SDK/collector → Jaeger/Tempo/Datadog/Honeycomb.</li>
</ul>

<h2>Incident response</h2>
<ol>
<li>Declare, assign an incident commander, open a channel, communicate status regularly.</li>
<li>Mitigate first: roll back recent changes, fail over, shed load, disable a feature flag.</li>
<li>Find root cause after stabilization; blameless postmortem: timeline, impact, contributing factors, what went well, action items with owners.</li>
</ol>`,
      pitfalls: [
        "Alerting on CPU > 80% (cause) instead of user-facing symptoms.",
        "Averages hiding tail latency.",
        "High-cardinality labels (user IDs, request IDs) in metrics.",
        "Logs without request/trace IDs; unstructured logs.",
        "Postmortems that blame individuals.",
      ],
      interviewQs: [
        "SLI vs SLO vs SLA? What is an error budget?",
        "What would you monitor for a new service?",
        "How do you design alerts that aren't noisy?",
        "Metrics vs logs vs traces — when do you use each?",
        "Walk me through an incident you handled.",
      ],
      resources: [
        { t: "Google SRE books (free)", u: "https://sre.google/books/", k: "book" },
        { t: "OpenTelemetry documentation", u: "https://opentelemetry.io/docs/", k: "docs" },
        { t: "Observability Engineering — Majors, Fong-Jones, Miranda", u: "https://www.oreilly.com/library/view/observability-engineering/9781492076438/", k: "book" },
        { t: "Prometheus — best practices", u: "https://prometheus.io/docs/practices/naming/", k: "docs" },
      ],
    },
    {
      id: "linux-troubleshooting",
      title: "Linux & Network Troubleshooting for Engineers",
      summary: "The commands and mental checklist for diagnosing CPU, memory, disk, network and DNS problems on a Linux host or container.",
      tags: ["linux", "debugging", "networking"],
      brushup: [
        "USE method per resource: utilization, saturation, errors.",
        "CPU: <code>top/htop</code>, <code>uptime</code> (load average vs cores), <code>mpstat</code>, <code>pidstat</code>; high %wa = I/O wait, high %st = noisy neighbour.",
        "Memory: <code>free -h</code> (available, not free), <code>vmstat 1</code> (si/so = swapping), dmesg for OOM killer.",
        "Disk: <code>df -h</code>, <code>du -sh</code>, <code>iostat -xz 1</code> (await, %util), inode exhaustion (<code>df -i</code>), deleted-but-open files (<code>lsof +L1</code>).",
        "Network: <code>ss -tanp</code> (connections, states, TIME_WAIT), <code>curl -v</code>, <code>dig</code>/<code>nslookup</code>, <code>traceroute/mtr</code>, <code>tcpdump</code>.",
        "Processes & files: <code>ps aux</code>, <code>lsof -p</code>, <code>strace -p</code> (syscalls), ulimit -n (file descriptors).",
        "Logs: <code>journalctl -u svc -f</code>, <code>/var/log</code>, container logs.",
        "Brendan Gregg's 60-second checklist is the gold standard.",
      ],
      detail: `
<h2>The 60-second checklist (Netflix / Brendan Gregg)</h2>
<pre><code>uptime                 # load averages trend
dmesg -T | tail        # OOM kills, disk errors, network drops
vmstat 1               # run queue (r), swapping (si/so), CPU split
mpstat -P ALL 1        # per-CPU imbalance
pidstat 1              # which processes use CPU
iostat -xz 1           # disk latency (await) and saturation (%util)
free -m                # memory
sar -n DEV 1           # network throughput
sar -n TCP,ETCP 1      # TCP connections, retransmits
top                    # overview</code></pre>

<h2>"The service can't reach X" ladder</h2>
<ol>
<li>DNS: <code>dig api.internal</code> — right IP? (In K8s: <code>nslookup svc.namespace</code> from the pod.)</li>
<li>Routing/firewall: <code>nc -vz host 443</code> or <code>curl -v</code> — connection refused (nothing listening) vs timeout (firewall/security group/route).</li>
<li>TLS: <code>openssl s_client -connect host:443 -servername host</code> — certificate chain, expiry, SNI.</li>
<li>Application: HTTP status, response time, server logs.</li>
<li>Packet level: <code>tcpdump -i any host 10.0.1.5 and port 443</code>.</li>
</ol>

<h2>Classic puzzles</h2>
<table>
<tr><th>Symptom</th><th>Cause</th></tr>
<tr><td>Disk full but du shows little</td><td>Deleted files still held open by a process (lsof +L1) → restart/truncate</td></tr>
<tr><td>"No space left" with free space</td><td>Inodes exhausted (millions of small files)</td></tr>
<tr><td>"Too many open files"</td><td>fd limit (ulimit -n) or fd leak</td></tr>
<tr><td>Thousands of TIME_WAIT</td><td>Many short-lived outbound connections → keep-alive / connection pooling</td></tr>
<tr><td>Load 50 on 8 cores, CPU idle</td><td>Processes stuck in uninterruptible I/O (D state)</td></tr>
</table>`,
      pitfalls: [
        "Reading 'free' memory instead of 'available' and panicking about page cache.",
        "Restarting before capturing evidence (dumps, logs, metrics).",
        "Debugging from your laptop instead of from inside the failing network path (pod/host).",
      ],
      interviewQs: [
        "A Linux server is slow — what commands do you run first?",
        "Disk is full but you can't find large files — why?",
        "How do you debug 'connection timed out' vs 'connection refused'?",
        "What does load average mean?",
        "How would you inspect traffic between two services?",
      ],
      resources: [
        { t: "Linux performance analysis in 60,000 ms — Brendan Gregg", u: "https://netflixtechblog.com/linux-performance-analysis-in-60-000-milliseconds-accc10403c55", k: "article" },
        { t: "Brendan Gregg — Linux performance", u: "https://www.brendangregg.com/linuxperf.html", k: "article" },
        { t: "Julia Evans — zines & debugging posts", u: "https://jvns.ca/", k: "blog" },
      ],
    },
  ],
});
