/* Networking — deep dive beyond the CS Fundamentals overview. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "networking",
  title: "Networking",
  icon: "🔌",
  blurb: "IP addressing & subnets, TCP internals (handshake, flow & congestion control), UDP & QUIC, HTTP/1.1→2→3, DNS in depth, load balancers & proxies, TLS, WebSockets/gRPC, cloud networking and debugging.",
  topics: [
    {
      id: "net-ip-subnets",
      title: "IP Addressing, Subnets, CIDR, NAT & Routing",
      summary: "How hosts are addressed and packets find their way — IPv4/IPv6, CIDR math, private ranges, NAT and routing tables.",
      tags: ["networking", "ip"],
      brushup: [
        "IPv4 = 32 bits (a.b.c.d); IPv6 = 128 bits. CIDR <code>10.0.0.0/16</code> = first 16 bits are the network → 65,536 addresses.",
        "Hosts in a /24: 256 − 2 (network + broadcast); cloud providers reserve a few more per subnet.",
        "Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16; loopback 127.0.0.0/8; link-local 169.254.0.0/16 (cloud metadata lives here).",
        "<b>NAT</b> maps private addresses to a public IP (with ports: PAT) — how private subnets reach the internet.",
        "Routing: longest-prefix match in the route table; default route 0.0.0.0/0 → gateway.",
        "ARP maps IP → MAC on a LAN; switches forward by MAC (L2), routers by IP (L3).",
        "TTL decrements per hop; traceroute uses it to discover the path.",
      ],
      detail: `
<h2>CIDR quick math</h2>
<table><tr><th>Prefix</th><th>Addresses</th><th>Typical use</th></tr>
<tr><td>/32</td><td>1</td><td>single host (security group rule)</td></tr><tr><td>/28</td><td>16</td><td>tiny subnet</td></tr>
<tr><td>/24</td><td>256</td><td>subnet per AZ/tier</td></tr><tr><td>/20</td><td>4,096</td><td>Kubernetes node/pod subnets</td></tr>
<tr><td>/16</td><td>65,536</td><td>a VPC</td></tr></table>
<p>Addresses = 2^(32 − prefix). 10.0.1.0/24 spans 10.0.1.0 – 10.0.1.255.</p>
<h2>Designing a VPC</h2>
<pre><code>VPC 10.0.0.0/16
  public  10.0.0.0/24  (AZ a)   → route 0.0.0.0/0 → internet gateway   (load balancers, NAT gateway)
  public  10.0.1.0/24  (AZ b)
  private 10.0.10.0/24 (AZ a)   → route 0.0.0.0/0 → NAT gateway         (app servers)
  private 10.0.11.0/24 (AZ b)
  data    10.0.20.0/24 (AZ a/b) → no internet route                      (databases)</code></pre>
<p>Plan non-overlapping ranges across VPCs/on-prem if you'll ever peer or connect them via VPN.</p>`,
      pitfalls: ["Overlapping CIDRs between VPCs you later need to peer.", "Subnets too small for Kubernetes pod IPs.", "Forgetting return routes."],
      interviewQs: ["How many hosts in a /26?", "What does NAT do and why do private subnets need it?", "How does a router choose a route?", "Design subnets for a three-tier app in two AZs."],
      resources: [{ t: "Cloudflare Learning — What is a subnet?", u: "https://www.cloudflare.com/learning/network-layer/what-is-a-subnet/", k: "article" }, { t: "CIDR calculator", u: "https://cidr.xyz/", k: "tool" }],
    },
    {
      id: "net-tcp",
      title: "TCP Deep Dive: Handshake, Reliability, Flow & Congestion Control",
      summary: "What TCP actually does — connection setup and teardown, sequence numbers, retransmission, windows, congestion control and the states you see in production.",
      tags: ["networking", "tcp", "must-know"],
      brushup: [
        "3-way handshake: SYN → SYN-ACK → ACK (1 RTT before data). Teardown: FIN/ACK each way; the closer waits in TIME_WAIT (2×MSL).",
        "Reliability: sequence numbers, cumulative ACKs, retransmission on timeout or 3 duplicate ACKs (fast retransmit).",
        "<b>Flow control</b>: receiver advertises a window — sender never overruns the receiver's buffer.",
        "<b>Congestion control</b>: slow start (exponential), congestion avoidance (additive increase), multiplicative decrease on loss; CUBIC default on Linux, BBR models bandwidth/RTT.",
        "Throughput ≲ window / RTT → long fat pipes need big windows (window scaling).",
        "Head-of-line blocking: one lost segment stalls everything behind it in the stream.",
        "Nagle's algorithm batches small writes; disable with TCP_NODELAY for latency-sensitive protocols.",
        "Keep-alive and connection pooling amortize handshake cost.",
      ],
      detail: `
<h2>Connection lifecycle</h2>
<pre><code>Client                      Server
SYN (seq=x)          ─────►
                     ◄───── SYN-ACK (seq=y, ack=x+1)
ACK (ack=y+1)        ─────►            ESTABLISHED
... data ...
FIN                  ─────►            (client: FIN_WAIT_1 → FIN_WAIT_2)
                     ◄───── ACK        (server: CLOSE_WAIT until app closes)
                     ◄───── FIN
ACK                  ─────►            client: TIME_WAIT (2×MSL) → CLOSED</code></pre>
<h2>States that matter in production</h2>
<table><tr><th>State</th><th>If you see many</th></tr>
<tr><td>TIME_WAIT</td><td>Lots of short-lived outbound connections → pool/keep-alive</td></tr>
<tr><td>CLOSE_WAIT</td><td>Your app isn't closing sockets → leak/bug</td></tr>
<tr><td>SYN_RECV</td><td>SYN flood or backlog too small</td></tr></table>
<h2>Why latency dominates small transfers</h2>
<p>A new HTTPS connection costs TCP handshake (1 RTT) + TLS 1.3 (1 RTT) before the first byte; at 100 ms RTT that's 200 ms. Connection reuse, CDNs (shorter RTT) and HTTP/3 (combined handshake) attack exactly this.</p>`,
      pitfalls: ["Opening a new connection per request.", "Ignoring CLOSE_WAIT build-up (socket leaks).", "Assuming TCP preserves message boundaries (it's a byte stream — frame your messages)."],
      interviewQs: ["Walk through the TCP 3-way handshake and teardown.", "Flow control vs congestion control?", "Why do servers accumulate TIME_WAIT sockets?", "What is head-of-line blocking?"],
      resources: [{ t: "High Performance Browser Networking — Building blocks of TCP", u: "https://hpbn.co/building-blocks-of-tcp/", k: "book" }],
    },
    {
      id: "net-udp-quic",
      title: "UDP, QUIC & HTTP/3",
      summary: "Why UDP exists, and how QUIC rebuilds reliability, encryption and multiplexing on top of it to fix TCP's head-of-line blocking.",
      tags: ["networking", "udp", "quic"],
      brushup: [
        "UDP: connectionless datagrams, no ordering/retransmission/congestion control — minimal latency. Used by DNS, VoIP, games, video, QUIC.",
        "QUIC (RFC 9000): transport over UDP with TLS 1.3 built in, 0/1-RTT handshakes, <b>independent streams</b> (no cross-stream HOL blocking), connection migration via connection IDs (Wi-Fi → 4G).",
        "HTTP/3 = HTTP semantics over QUIC.",
        "Middleboxes/firewalls sometimes block UDP → clients fall back to HTTP/2 over TCP.",
      ],
      detail: `
<table><tr><th></th><th>TCP + TLS</th><th>QUIC</th></tr>
<tr><td>Handshake</td><td>TCP 1 RTT + TLS 1 RTT</td><td>1 RTT (0-RTT on resumption)</td></tr>
<tr><td>Loss impact</td><td>Blocks all streams</td><td>Blocks only the affected stream</td></tr>
<tr><td>Network change</td><td>Connection breaks</td><td>Survives (connection ID)</td></tr>
<tr><td>Implementation</td><td>Kernel</td><td>User space (fast iteration)</td></tr></table>`,
      pitfalls: ["Using UDP and re-implementing half of TCP badly.", "0-RTT data is replayable — only for idempotent requests."],
      interviewQs: ["When would you use UDP over TCP?", "How does QUIC solve head-of-line blocking?", "What is 0-RTT and its risk?"],
      resources: [{ t: "Cloudflare — HTTP/3: the past, the present, and the future", u: "https://blog.cloudflare.com/http3-the-past-present-and-future/", k: "blog" }],
    },
    {
      id: "net-http",
      title: "HTTP in Depth: Methods, Headers, Keep-Alive, HTTP/2 Multiplexing",
      summary: "The protocol every backend engineer lives in — semantics, headers that matter, connection management and what HTTP/2 changed.",
      tags: ["networking", "http", "must-know"],
      brushup: [
        "Request = method + path + headers + body; response = status + headers + body.",
        "Safe methods (GET, HEAD) don't change state; idempotent: GET, PUT, DELETE (not POST, PATCH).",
        "Headers to know: Host, Content-Type, Accept, Authorization, Cache-Control, ETag/If-None-Match, Cookie/Set-Cookie, X-Forwarded-For, Retry-After, traceparent.",
        "HTTP/1.1 keep-alive reuses connections but one request at a time per connection (browsers open ~6 per host).",
        "HTTP/2: binary frames, many concurrent streams on one connection, HPACK header compression, server push (deprecated).",
        "HTTP/2 still suffers TCP-level head-of-line blocking → HTTP/3.",
        "Chunked transfer encoding and streaming responses (SSE) for incremental output.",
      ],
      detail: `
<h2>Raw request/response</h2>
<pre><code>GET /v1/orders/42 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJ...
Accept: application/json
If-None-Match: "v7"

HTTP/1.1 304 Not Modified
ETag: "v7"
Cache-Control: private, max-age=0</code></pre>
<h2>Status code families</h2>
<table><tr><th>Class</th><th>Meaning</th><th>Examples</th></tr>
<tr><td>2xx</td><td>Success</td><td>200, 201, 202 (accepted, async), 204</td></tr>
<tr><td>3xx</td><td>Redirect/cache</td><td>301, 302, 304, 307/308 (keep method)</td></tr>
<tr><td>4xx</td><td>Client error</td><td>400, 401, 403, 404, 409, 422, 429</td></tr>
<tr><td>5xx</td><td>Server error</td><td>500, 502, 503, 504</td></tr></table>`,
      pitfalls: ["Using GET for state changes.", "Ignoring 429/503 Retry-After.", "Treating 502 vs 504 the same when debugging (bad upstream response vs upstream timeout)."],
      interviewQs: ["Which HTTP methods are idempotent?", "What did HTTP/2 improve over HTTP/1.1?", "502 vs 503 vs 504?", "How do ETags work?"],
      resources: [{ t: "MDN — HTTP overview", u: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview", k: "docs" }, { t: "HPBN — HTTP/2", u: "https://hpbn.co/http2/", k: "book" }],
    },
    {
      id: "net-dns",
      title: "DNS in Depth: Resolution, Records, TTLs, DNS-Based Routing",
      summary: "How names become IPs, the record types you'll configure, caching and TTL trade-offs, and how DNS is used for failover and geo-routing.",
      tags: ["networking", "dns"],
      brushup: [
        "Resolution: stub resolver → recursive resolver → root → TLD (.com) → authoritative server → answer cached per TTL at every level.",
        "Records: A/AAAA (IP), CNAME (alias; not at the zone apex), ALIAS/ANAME (apex alias, provider-specific), MX, TXT (SPF/verification), NS, SRV, CAA.",
        "Low TTL = faster failover, more queries; high TTL = cache efficiency, slower changes. Lower TTL before a migration.",
        "DNS load balancing/failover: weighted, latency-based, geo, health-checked records (Route 53, Cloudflare).",
        "Clients and JVMs cache DNS (Java: networkaddress.cache.ttl) — can defeat failover.",
        "Kubernetes: CoreDNS; service names resolve to cluster IPs; search domains + ndots cause extra lookups.",
      ],
      detail: `
<pre><code>dig +trace api.example.com          # walk root → TLD → authoritative
dig api.example.com A +short
dig -x 93.184.216.34                  # reverse lookup</code></pre>
<p>Migration playbook: lower TTL to 60 s a day ahead → switch the record → verify → raise TTL again.</p>`,
      pitfalls: ["CNAME at the zone apex.", "Long TTLs before a planned cutover.", "Relying on DNS for instant failover when clients cache aggressively."],
      interviewQs: ["Walk through DNS resolution for api.example.com.", "CNAME vs A record?", "How can DNS be used for load balancing and failover?"],
      resources: [{ t: "Cloudflare Learning — What is DNS?", u: "https://www.cloudflare.com/learning/dns/what-is-dns/", k: "article" }, { t: "How DNS works (comic)", u: "https://howdns.works/", k: "article" }],
    },
    {
      id: "net-load-balancers",
      title: "Load Balancers, Reverse Proxies, API Gateways & CDNs",
      summary: "L4 vs L7 load balancing, algorithms, health checks, TLS termination, sticky sessions, proxies like NGINX/Envoy and where CDNs fit.",
      tags: ["networking", "load-balancing", "must-know"],
      brushup: [
        "<b>L4</b> (TCP/UDP) balancers route by IP/port — fast, protocol-agnostic (AWS NLB). <b>L7</b> (HTTP) route by path/host/headers, terminate TLS, retry, rewrite (ALB, NGINX, Envoy).",
        "Algorithms: round robin, least connections/requests, weighted, consistent hashing (affinity), power of two choices.",
        "Health checks remove bad backends; connection draining on deploys.",
        "Sticky sessions tie a user to a backend — avoid by keeping services stateless.",
        "Reverse proxy = single entry point in front of servers (TLS, compression, caching, rate limits). Forward proxy = acts for clients.",
        "API gateway adds auth, rate limiting, request transformation, API keys; service mesh sidecars (Envoy) do L7 LB between services.",
        "Client IP preserved via X-Forwarded-For / PROXY protocol.",
        "CDN = distributed reverse proxies caching content near users; also DDoS/WAF.",
      ],
      detail: `
<h2>NGINX as a reverse proxy/load balancer</h2>
<pre><code>upstream orders {
    least_conn;
    server 10.0.10.11:8080 max_fails=3 fail_timeout=10s;
    server 10.0.10.12:8080;
    keepalive 64;
}
server {
    listen 443 ssl http2;
    location /v1/orders/ {
        proxy_pass http://orders;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 5s;
    }
}</code></pre>
<h2>Where each layer sits</h2>
<pre><code>Client → DNS → CDN edge (cache, WAF) → cloud L7 LB / API gateway (TLS, auth, rate limit)
       → Kubernetes ingress → service mesh sidecar → pod</code></pre>`,
      pitfalls: ["Sticky sessions hiding statefulness.", "Health checks that are too shallow or too deep.", "Retries at the LB plus the client plus the service (retry storms).", "Losing the client IP behind proxies."],
      interviewQs: ["L4 vs L7 load balancing?", "Which load-balancing algorithm would you use and why?", "Reverse proxy vs API gateway vs service mesh?", "How do you deploy without dropping connections?"],
      resources: [{ t: "NGINX — Load balancing", u: "https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/", k: "docs" }, { t: "Envoy — What is Envoy", u: "https://www.envoyproxy.io/docs/envoy/latest/intro/what_is_envoy", k: "docs" }],
    },
    {
      id: "net-realtime",
      title: "Real-Time & RPC Protocols: WebSockets, SSE, gRPC, Long Polling",
      summary: "How persistent and streaming connections work, their scaling challenges, and when to choose each.",
      tags: ["networking", "websocket", "grpc"],
      brushup: [
        "WebSocket: HTTP Upgrade handshake → full-duplex frames over one TCP connection; needs sticky routing or a pub/sub backplane to fan out across servers.",
        "SSE: one-way server → client stream over plain HTTP with auto-reconnect and Last-Event-ID.",
        "gRPC: HTTP/2 + Protobuf; unary, server-streaming, client-streaming, bidirectional; deadlines and cancellation built in.",
        "Scaling persistent connections: connection limits per server (file descriptors, memory), heartbeats, graceful drain on deploy, reconnect with jittered backoff.",
        "Load balancers must support long-lived connections (idle timeouts!).",
      ],
      detail: `
<pre><code>WebSocket handshake:
GET /chat HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
→ HTTP/1.1 101 Switching Protocols</code></pre>
<h2>Fan-out across many WebSocket servers</h2>
<pre><code>user A (ws-server-1) sends msg → publish to Redis/Kafka channel "room:42"
ws-server-2 and ws-server-3 subscribed to "room:42" → push to their connected members</code></pre>`,
      pitfalls: ["LB idle timeout (e.g. 60 s) silently killing idle WebSockets — send heartbeats.", "All clients reconnecting at once after a deploy — add jitter.", "Using WebSockets when SSE would do."],
      interviewQs: ["How would you scale a WebSocket service to 1M connections?", "SSE vs WebSocket?", "Why gRPC for internal services?"],
      resources: [{ t: "MDN — WebSockets API", u: "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API", k: "docs" }, { t: "gRPC — Core concepts", u: "https://grpc.io/docs/what-is-grpc/core-concepts/", k: "docs" }],
    },
    {
      id: "net-debugging",
      title: "Network Debugging Toolkit",
      summary: "The commands and reasoning to diagnose connectivity, DNS, TLS, latency and packet loss issues across hosts, containers and Kubernetes.",
      tags: ["networking", "debugging"],
      brushup: [
        "Layer by layer: DNS (dig) → reachability (ping/mtr) → port (nc/telnet) → TLS (openssl s_client) → HTTP (curl -v).",
        "<b>Connection refused</b> = host reachable, nothing listening; <b>timeout</b> = firewall/security group/routing drop.",
        "<code>curl -w</code> timing breaks latency into DNS, connect, TLS, TTFB, total.",
        "<code>ss -tanp</code> shows sockets and states; <code>tcpdump</code> captures packets.",
        "In Kubernetes: debug from inside the pod/namespace (<code>kubectl debug</code>, ephemeral containers) — cluster DNS and network policies differ from your laptop.",
      ],
      detail: `
<pre><code>curl -o /dev/null -s -w 'dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\\n' https://api.example.com/health
mtr -rw api.example.com                         # per-hop loss/latency
openssl s_client -connect api.example.com:443 -servername api.example.com   # cert chain, expiry, SNI
tcpdump -i any -nn host 10.0.10.11 and port 5432
kubectl run -it --rm netshoot --image=nicolaka/netshoot -- bash    # swiss-army debug pod</code></pre>`,
      pitfalls: ["Testing from the wrong network location.", "Forgetting SNI when testing TLS.", "Blaming the network before checking the app's own timeouts and pools."],
      interviewQs: ["A service can't reach another service — how do you debug?", "Connection refused vs connection timed out?", "How do you find where latency comes from in an HTTP call?"],
      resources: [{ t: "netshoot — network troubleshooting container", u: "https://github.com/nicolaka/netshoot", k: "tool" }, { t: "Julia Evans — networking zines", u: "https://wizardzines.com/", k: "article" }],
    },
  ],
});
