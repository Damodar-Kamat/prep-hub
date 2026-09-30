/* Web & Frontend fundamentals. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "web",
  title: "Web & Frontend",
  icon: "🧭",
  blurb: "JavaScript's runtime model, TypeScript, how browsers render, React, API styles (REST, GraphQL, gRPC, WebSockets), HTTP caching and web performance.",
  topics: [
    {
      id: "js-core",
      title: "JavaScript Core: Event Loop, Closures, this, Prototypes, Promises",
      summary: "The JavaScript behaviours every frontend and Node interview probes — the single-threaded event loop, closures, `this` binding, prototypes and async/await.",
      tags: ["javascript", "must-know"],
      brushup: [
        "One call stack; async work handled by the host (browser/Node) and queued back: <b>microtasks</b> (promises, queueMicrotask) run before the next <b>macrotask</b> (setTimeout, I/O, events).",
        "<b>Closures</b>: functions remember variables of the scope where they were created → data privacy, factories, memoization.",
        "<b>this</b> depends on how a function is called: method call → object; plain call → undefined (strict); new → new object; call/apply/bind → explicit; <b>arrow functions</b> capture lexical this.",
        "<b>Prototypes</b>: objects delegate property lookups up the prototype chain; class syntax is sugar over prototypes.",
        "var (function-scoped, hoisted) vs let/const (block-scoped, temporal dead zone).",
        "Promises: pending → fulfilled/rejected; async/await is sugar; Promise.all (fail fast), allSettled, race, any.",
        "== coerces types, === doesn't; typeof null is 'object'; NaN !== NaN.",
        "Debounce (wait until calm) vs throttle (at most once per interval).",
      ],
      detail: `
<h2>Event loop ordering</h2>
<pre><code>console.log("1");
setTimeout(() =&gt; console.log("2"), 0);
Promise.resolve().then(() =&gt; console.log("3"));
queueMicrotask(() =&gt; console.log("4"));
console.log("5");
// 1 5 3 4 2  — sync, then all microtasks, then the timer macrotask</code></pre>

<h2>Closures</h2>
<pre><code>function counter() {
  let n = 0;                       // private
  return { inc: () =&gt; ++n, get: () =&gt; n };
}
// classic bug: var in loops
for (var i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i));  // 3 3 3
for (let i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i));  // 0 1 2 (new binding per iteration)</code></pre>

<h2>this</h2>
<pre><code>const obj = { name: "a", regular() { return this.name; }, arrow: () =&gt; this?.name };
obj.regular();            // "a"
const f = obj.regular; f(); // undefined (strict) — lost receiver
obj.arrow();              // undefined — arrow takes this from the enclosing scope
setTimeout(obj.regular.bind(obj), 0);   // fix with bind</code></pre>

<h2>Debounce</h2>
<pre><code>function debounce(fn, ms) {
  let t;
  return (...args) =&gt; { clearTimeout(t); t = setTimeout(() =&gt; fn(...args), ms); };
}
const onSearch = debounce(q =&gt; fetchResults(q), 300);</code></pre>

<h2>Implement Promise.all</h2>
<pre><code>function all(promises) {
  return new Promise((resolve, reject) =&gt; {
    const out = []; let done = 0;
    if (!promises.length) return resolve(out);
    promises.forEach((p, i) =&gt; Promise.resolve(p).then(v =&gt; {
      out[i] = v; if (++done === promises.length) resolve(out);
    }, reject));
  });
}</code></pre>`,
      pitfalls: [
        "Forgetting to await (or return) a promise → unhandled rejections and races.",
        "Using await inside forEach (doesn't wait) — use for...of or Promise.all.",
        "Losing `this` when passing methods as callbacks.",
        "Long synchronous work blocking the event loop (UI freezes, Node latency).",
      ],
      interviewQs: [
        "Explain the event loop, microtasks and macrotasks. What does this code print?",
        "What is a closure? Give a practical use.",
        "How is `this` determined?",
        "Implement debounce / throttle / Promise.all.",
        "var vs let vs const?",
      ],
      resources: [
        { t: "javascript.info — The Modern JavaScript Tutorial", u: "https://javascript.info/", k: "course" },
        { t: "Jake Archibald — In the loop (event loop talk)", u: "https://www.youtube.com/watch?v=cCOL7MC4Pl0", k: "video" },
        { t: "You Don't Know JS Yet (free)", u: "https://github.com/getify/You-Dont-Know-JS", k: "book" },
      ],
    },
    {
      id: "browser-rendering",
      title: "How Browsers Render: Critical Path, Reflow, Core Web Vitals",
      summary: "From HTML bytes to pixels — the critical rendering path, layout/paint/composite, and how to optimize LCP, INP and CLS.",
      tags: ["browser", "performance"],
      brushup: [
        "Pipeline: HTML → <b>DOM</b>; CSS → <b>CSSOM</b>; DOM + CSSOM → render tree → <b>layout</b> (geometry) → <b>paint</b> → <b>composite</b> layers (GPU).",
        "CSS is render-blocking; synchronous scripts are parser-blocking → use <code>defer</code>/<code>async</code>, inline critical CSS.",
        "Changing geometry (width, top) triggers layout (<b>reflow</b>); color triggers paint; <b>transform/opacity</b> only composite → smooth animations.",
        "Layout thrashing: interleaving DOM reads (offsetHeight) and writes in loops.",
        "<b>Core Web Vitals</b>: LCP (largest contentful paint &lt; 2.5 s), INP (interaction to next paint &lt; 200 ms), CLS (layout shift &lt; 0.1).",
        "Improve LCP: fast TTFB, CDN, preload hero image, avoid render-blocking resources. INP: break up long tasks, less JS. CLS: set image dimensions, reserve space.",
        "Rendering strategies: CSR, SSR, SSG, ISR, streaming SSR, islands/hydration costs.",
      ],
      detail: `
<h2>Loading scripts</h2>
<table>
<tr><th>Attribute</th><th>Download</th><th>Execute</th></tr>
<tr><td>(none)</td><td>Blocks parsing</td><td>Immediately</td></tr>
<tr><td>async</td><td>In parallel</td><td>As soon as downloaded (order not guaranteed)</td></tr>
<tr><td>defer</td><td>In parallel</td><td>After parsing, in order</td></tr>
<tr><td>type=module</td><td>In parallel</td><td>Deferred by default</td></tr>
</table>

<h2>Avoiding layout thrashing</h2>
<pre><code>// bad: read-write-read-write
items.forEach(el =&gt; el.style.height = el.offsetHeight + 10 + "px");
// good: batch reads, then writes (or use requestAnimationFrame)
const hs = items.map(el =&gt; el.offsetHeight);
items.forEach((el, i) =&gt; el.style.height = hs[i] + 10 + "px");</code></pre>

<h2>Rendering strategies</h2>
<table>
<tr><th>Strategy</th><th>Good for</th><th>Trade-off</th></tr>
<tr><td>CSR (SPA)</td><td>App-like dashboards behind login</td><td>Slow first paint, SEO harder</td></tr>
<tr><td>SSR</td><td>Personalized, SEO pages</td><td>Server cost, hydration cost</td></tr>
<tr><td>SSG</td><td>Docs, marketing</td><td>Rebuild on change</td></tr>
<tr><td>ISR / edge caching</td><td>Large catalogs</td><td>Staleness windows</td></tr>
</table>`,
      pitfalls: [
        "Animating top/left/width instead of transform.",
        "Images without width/height causing layout shift.",
        "Shipping megabytes of JS to render static content.",
      ],
      interviewQs: [
        "Explain the critical rendering path.",
        "Reflow vs repaint vs composite?",
        "async vs defer?",
        "What are Core Web Vitals and how do you improve them?",
        "CSR vs SSR vs SSG?",
      ],
      resources: [
        { t: "web.dev — Learn performance", u: "https://web.dev/learn/performance", k: "course" },
        { t: "How browsers work (web.dev)", u: "https://web.dev/articles/howbrowserswork", k: "article" },
        { t: "Core Web Vitals", u: "https://web.dev/articles/vitals", k: "docs" },
      ],
    },
    {
      id: "react",
      title: "React: Rendering, Hooks, State Management, Performance",
      summary: "How React decides what to re-render, the rules and patterns of hooks, where state should live, and how to keep large apps fast.",
      tags: ["react", "frontend"],
      brushup: [
        "UI = f(state). A state/prop change re-renders the component and its children; React <b>reconciles</b> the new virtual tree with the old and commits minimal DOM changes.",
        "<b>Keys</b> identify list items across renders — stable IDs, not array indexes (for reorderable lists).",
        "Hooks: useState, useEffect (sync with external systems; cleanup!), useMemo/useCallback (memoize), useRef (mutable box, DOM refs), useReducer, useContext.",
        "Rules of hooks: call at the top level, same order every render, only in components/custom hooks.",
        "State placement: local first; lift up when shared; context for rarely-changing globals; server state via React Query/SWR; global client state via Zustand/Redux Toolkit.",
        "Performance: React.memo, useMemo/useCallback for expensive work or referential stability, virtualization for long lists, code splitting (lazy/Suspense).",
        "React 18+: automatic batching, concurrent rendering (useTransition, useDeferredValue), Server Components (Next.js App Router).",
        "Controlled vs uncontrolled inputs.",
      ],
      detail: `
<h2>Effects done right</h2>
<pre><code>function UserCard({ id }) {
  const [user, setUser] = useState(null);
  useEffect(() =&gt; {
    const ctrl = new AbortController();
    fetch("/api/users/" + id, { signal: ctrl.signal })
      .then(r =&gt; r.json()).then(setUser).catch(() =&gt; {});
    return () =&gt; ctrl.abort();                 // cleanup avoids race conditions when id changes
  }, [id]);                                   // dependency array must list everything used
  return user ? &lt;h3&gt;{user.name}&lt;/h3&gt; : &lt;Spinner /&gt;;
}</code></pre>
<p>Many effects are unnecessary: derive values during render instead of syncing them into state.</p>

<h2>Memoization</h2>
<pre><code>const visible = useMemo(() =&gt; todos.filter(t =&gt; t.done === showDone), [todos, showDone]);
const onToggle = useCallback(id =&gt; dispatch({ type: "toggle", id }), []);
const Row = React.memo(function Row({ todo, onToggle }) { ... });   // skips re-render if props equal</code></pre>

<h2>Where state lives</h2>
<table>
<tr><th>Kind</th><th>Tool</th></tr>
<tr><td>Form input, toggles</td><td>useState</td></tr>
<tr><td>Complex local transitions</td><td>useReducer</td></tr>
<tr><td>Theme, auth user</td><td>Context</td></tr>
<tr><td>Server data (cache, refetch, dedupe)</td><td>TanStack Query / SWR</td></tr>
<tr><td>Cross-app client state</td><td>Zustand / Redux Toolkit</td></tr>
<tr><td>URL-shareable state</td><td>Router search params</td></tr>
</table>`,
      pitfalls: [
        "Missing effect dependencies → stale closures.",
        "Array index as key in dynamic lists.",
        "Putting everything in one giant context → whole app re-renders.",
        "Copying props into state and letting them drift.",
      ],
      interviewQs: [
        "How does React reconciliation work? Why do keys matter?",
        "When does a component re-render?",
        "useMemo vs useCallback vs React.memo?",
        "How do you fetch data in React correctly?",
        "How would you optimize a list of 10,000 rows?",
      ],
      resources: [
        { t: "react.dev — official docs", u: "https://react.dev/learn", k: "docs" },
        { t: "You Might Not Need an Effect", u: "https://react.dev/learn/you-might-not-need-an-effect", k: "docs" },
        { t: "GreatFrontEnd — frontend interview prep", u: "https://www.greatfrontend.com/", k: "practice" },
      ],
    },
    {
      id: "api-styles",
      title: "API Design: REST, GraphQL, gRPC, WebSockets, SSE, Webhooks",
      summary: "Choosing and designing the right API style — resource modeling, versioning, pagination, errors, idempotency and real-time options.",
      tags: ["api", "rest", "grpc", "must-know"],
      brushup: [
        "<b>REST</b>: resources + HTTP verbs; GET safe/idempotent, PUT/DELETE idempotent, POST not; proper status codes; stateless.",
        "Design: plural nouns (/orders/42/items), filtering/sorting via query params, <b>cursor pagination</b>, consistent error body, versioning (URL /v1 or header).",
        "Idempotency keys for POST that create/charge; ETags + If-Match for optimistic concurrency.",
        "<b>GraphQL</b>: client selects fields from a typed schema — no over/under-fetching; watch N+1 resolvers (DataLoader), caching and query cost limits.",
        "<b>gRPC</b>: Protobuf over HTTP/2, strongly typed contracts, streaming, fast — great service-to-service; less browser-friendly.",
        "Real-time: <b>polling</b> → <b>long polling</b> → <b>SSE</b> (server→client stream over HTTP) → <b>WebSockets</b> (full duplex).",
        "<b>Webhooks</b>: server-to-server callbacks — sign payloads (HMAC), retry with backoff, receivers must be idempotent.",
        "API gateway concerns: auth, rate limiting, request validation, observability.",
      ],
      detail: `
<h2>REST resource design</h2>
<pre><code>GET    /v1/orders?status=PAID&amp;limit=20&amp;cursor=eyJpZCI6OTl9   list (cursor pagination)
POST   /v1/orders                     create  (Idempotency-Key header) → 201 + Location
GET    /v1/orders/42                  read    → 200 / 404
PATCH  /v1/orders/42                  partial update (If-Match: "etag") → 200 / 412
DELETE /v1/orders/42                  → 204
POST   /v1/orders/42/cancel           action that isn't CRUD

Error body: {"error": {"code": "INSUFFICIENT_FUNDS", "message": "...", "request_id": "..."}}</code></pre>

<h2>Status codes to know</h2>
<table>
<tr><th>Code</th><th>Meaning</th></tr>
<tr><td>200/201/204</td><td>OK / Created / No content</td></tr>
<tr><td>301/302/304</td><td>Moved / Found / Not modified (caching)</td></tr>
<tr><td>400/401/403/404</td><td>Bad request / Unauthenticated / Forbidden / Not found</td></tr>
<tr><td>409/412/422/429</td><td>Conflict / Precondition failed / Validation error / Too many requests</td></tr>
<tr><td>500/502/503/504</td><td>Server error / Bad gateway / Unavailable / Gateway timeout</td></tr>
</table>

<h2>Comparison</h2>
<table>
<tr><th></th><th>REST</th><th>GraphQL</th><th>gRPC</th></tr>
<tr><td>Contract</td><td>OpenAPI (optional)</td><td>Schema (required)</td><td>.proto (required)</td></tr>
<tr><td>Transport</td><td>HTTP/1.1+, JSON</td><td>HTTP, JSON</td><td>HTTP/2, binary</td></tr>
<tr><td>Caching</td><td>HTTP caching works</td><td>Harder (POST, per-query)</td><td>Custom</td></tr>
<tr><td>Best for</td><td>Public APIs, CRUD</td><td>Many clients with different data needs (mobile/web BFF)</td><td>Internal microservices, streaming</td></tr>
</table>

<h2>Real-time options</h2>
<table>
<tr><th>Technique</th><th>Direction</th><th>Use</th></tr>
<tr><td>Short polling</td><td>Client pulls</td><td>Simple, wasteful</td></tr>
<tr><td>Long polling</td><td>Client pulls, server holds</td><td>Fallback when others unavailable</td></tr>
<tr><td>SSE</td><td>Server → client</td><td>Live feeds, notifications, LLM token streaming</td></tr>
<tr><td>WebSocket</td><td>Bidirectional</td><td>Chat, collaboration, games</td></tr>
</table>`,
      pitfalls: [
        "Returning 200 with an error body.",
        "Offset pagination on large, changing datasets.",
        "Breaking changes without versioning/deprecation.",
        "GraphQL without depth/complexity limits (DoS).",
        "Webhook receivers that aren't idempotent or don't verify signatures.",
      ],
      interviewQs: [
        "Design the REST API for an e-commerce order service.",
        "Which HTTP methods are idempotent? Why does it matter?",
        "REST vs GraphQL vs gRPC — when would you pick each?",
        "How do you version an API?",
        "WebSockets vs SSE vs long polling?",
      ],
      resources: [
        { t: "Microsoft REST API guidelines", u: "https://github.com/microsoft/api-guidelines", k: "repo" },
        { t: "Google API design guide", u: "https://cloud.google.com/apis/design", k: "docs" },
        { t: "GraphQL — learn", u: "https://graphql.org/learn/", k: "docs" },
        { t: "gRPC — core concepts", u: "https://grpc.io/docs/what-is-grpc/core-concepts/", k: "docs" },
      ],
    },
    {
      id: "http-caching",
      title: "HTTP Caching, CDNs & Web Performance at Scale",
      summary: "Cache-Control semantics, validators, CDN behaviour and invalidation — the cheapest performance and scalability win on the web.",
      tags: ["http", "cdn", "caching"],
      brushup: [
        "<b>Cache-Control</b>: max-age, s-maxage (shared caches), no-cache (revalidate), no-store (never store), private/public, immutable, stale-while-revalidate.",
        "Validators: <b>ETag</b> + If-None-Match, Last-Modified + If-Modified-Since → 304 Not Modified.",
        "Static assets: fingerprinted filenames (app.3f9a.js) + Cache-Control: public, max-age=31536000, immutable.",
        "HTML/API responses: short TTL or no-cache with ETags; personalize carefully (Vary, private).",
        "<b>CDN</b>: edge caching close to users, TLS termination, DDoS protection, origin shielding; cache key design (path, query, headers, cookies).",
        "Invalidation: purge by URL/tag, or version URLs so you never need to purge.",
        "Compression (Brotli/gzip), HTTP/2+/3, connection reuse, image formats (AVIF/WebP), lazy loading.",
      ],
      detail: `
<h2>Headers by resource type</h2>
<table>
<tr><th>Resource</th><th>Header</th></tr>
<tr><td>/assets/app.3f9a.js</td><td>Cache-Control: public, max-age=31536000, immutable</td></tr>
<tr><td>index.html</td><td>Cache-Control: no-cache (revalidate each time via ETag)</td></tr>
<tr><td>Public API list</td><td>Cache-Control: public, s-maxage=60, stale-while-revalidate=300</td></tr>
<tr><td>User account page</td><td>Cache-Control: private, no-store</td></tr>
</table>

<h2>Revalidation flow</h2>
<pre><code>GET /api/catalog            → 200, ETag: "v42", Cache-Control: no-cache
GET /api/catalog
If-None-Match: "v42"        → 304 Not Modified (no body; cheap)</code></pre>

<h2>CDN cache key pitfalls</h2>
<ul>
<li>Including irrelevant query params/cookies in the key → near-zero hit rate.</li>
<li>Forgetting Vary: Accept-Encoding / Accept-Language → wrong variant served.</li>
<li>Caching responses with Set-Cookie or user data → data leaks between users.</li>
</ul>`,
      pitfalls: [
        "Long max-age on non-fingerprinted files → users stuck on old versions.",
        "no-cache misunderstood as 'don't cache' (that's no-store).",
        "Caching authenticated responses at a shared CDN.",
      ],
      interviewQs: [
        "Explain Cache-Control directives and ETags.",
        "How would you cache a static website and its API?",
        "How does a CDN work and what should be cached there?",
        "no-cache vs no-store?",
        "How do you invalidate cached content?",
      ],
      resources: [
        { t: "MDN — HTTP caching", u: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching", k: "docs" },
        { t: "Cloudflare Learning Center — CDN", u: "https://www.cloudflare.com/learning/cdn/what-is-a-cdn/", k: "article" },
      ],
    },
    {
      id: "typescript",
      title: "TypeScript Essentials",
      summary: "The type-system features that matter in interviews and real code — structural typing, unions and narrowing, generics and utility types.",
      tags: ["typescript", "frontend"],
      brushup: [
        "Structural typing: compatibility by shape, not by name.",
        "Union types + <b>narrowing</b> (typeof, instanceof, in, discriminated unions with a literal kind field).",
        "<b>Generics</b> with constraints (&lt;T extends { id: string }&gt;).",
        "Utility types: Partial, Required, Readonly, Pick, Omit, Record, ReturnType, Awaited, NonNullable.",
        "unknown (safe: must narrow) vs any (unsafe: opts out).",
        "type vs interface: interfaces merge and extend; types handle unions/mapped/conditional types.",
        "Exhaustiveness checks with never in switch statements.",
        "Types are erased at runtime → validate external data (zod) at boundaries.",
      ],
      detail: `
<pre><code>type Shape =
  | { kind: "circle"; r: number }
  | { kind: "rect"; w: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;      // narrowed
    case "rect":   return s.w * s.h;
    default: { const _exhaustive: never = s; return _exhaustive; }   // compile error if a case is missing
  }
}

function byId&lt;T extends { id: string }&gt;(items: T[]): Record&lt;string, T&gt; {
  return Object.fromEntries(items.map(i =&gt; [i.id, i]));
}

type UserPatch = Partial&lt;Omit&lt;User, "id" | "createdAt"&gt;&gt;;</code></pre>`,
      pitfalls: [
        "Sprinkling any to silence errors.",
        "Trusting API responses typed with `as` without runtime validation.",
        "Over-engineered conditional types nobody can read.",
      ],
      interviewQs: [
        "interface vs type?",
        "What is a discriminated union?",
        "unknown vs any?",
        "Write a generic function with a constraint.",
        "Explain Partial/Pick/Omit.",
      ],
      resources: [
        { t: "TypeScript Handbook", u: "https://www.typescriptlang.org/docs/handbook/intro.html", k: "docs" },
        { t: "Type Challenges", u: "https://github.com/type-challenges/type-challenges", k: "practice" },
      ],
    },
  ],
});
