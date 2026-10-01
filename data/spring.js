/* Spring Boot — dedicated section (the Java section has the overview topic). */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "spring",
  title: "Spring Boot",
  icon: "🌱",
  blurb: "Auto-configuration & the container, building REST APIs (validation, errors, versioning), Spring Data JPA in depth, transactions, Spring Security with JWT/OAuth2, testing, Actuator/observability, WebFlux and Spring Cloud.",
  topics: [
    {
      id: "spring-autoconfig",
      title: "How Spring Boot Works: Auto-Configuration, Starters, Profiles, Configuration",
      summary: "What happens between SpringApplication.run() and a running app — condition-based auto-configuration, starters, externalized configuration and profiles.",
      tags: ["spring-boot", "must-know"],
      brushup: [
        "<code>@SpringBootApplication</code> = <code>@Configuration</code> + <code>@EnableAutoConfiguration</code> + <code>@ComponentScan</code>.",
        "Auto-configuration classes (listed in <code>META-INF/spring/…AutoConfiguration.imports</code>) create beans only when conditions hold: <code>@ConditionalOnClass</code>, <code>@ConditionalOnMissingBean</code>, <code>@ConditionalOnProperty</code>.",
        "Your own bean of the same type wins because of <code>@ConditionalOnMissingBean</code> — that's how you override defaults.",
        "Starters are dependency bundles (spring-boot-starter-web = Spring MVC + Jackson + embedded Tomcat).",
        "Config precedence (high → low): command-line args, env vars, application-{profile}.yml, application.yml, defaults. Bind typed config with <code>@ConfigurationProperties</code>.",
        "Profiles (<code>spring.profiles.active=prod</code>) switch beans and config per environment.",
        "Debug auto-config with <code>--debug</code> (condition evaluation report) or Actuator's /conditions endpoint.",
        "Startup: create ApplicationContext → load bean definitions → run auto-config → instantiate singletons → start embedded server → run CommandLineRunner/ApplicationRunner.",
      ],
      detail: `
<h2>Typed configuration</h2>
<pre><code>@ConfigurationProperties(prefix = "payments")
@Validated
public record PaymentsProps(@NotBlank String baseUrl, Duration timeout, int maxRetries) {}

# application.yml
payments:
  base-url: https://psp.example.com
  timeout: 2s
  max-retries: 3
---
spring:
  config:
    activate:
      on-profile: prod
payments:
  timeout: 1s</code></pre>
<p>Enable with <code>@EnableConfigurationProperties(PaymentsProps.class)</code> or <code>@ConfigurationPropertiesScan</code>. Relaxed binding maps <code>PAYMENTS_BASE_URL</code> env vars too.</p>

<h2>Writing your own auto-configuration (library/starter)</h2>
<pre><code>@AutoConfiguration
@ConditionalOnClass(AuditClient.class)
@EnableConfigurationProperties(AuditProps.class)
public class AuditAutoConfiguration {
    @Bean @ConditionalOnMissingBean
    AuditClient auditClient(AuditProps props) { return new AuditClient(props.url()); }
}</code></pre>

<h2>Common interview questions answered</h2>
<ul>
<li><b>How do you disable an auto-configuration?</b> <code>@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)</code> or <code>spring.autoconfigure.exclude</code>.</li>
<li><b>Why is my bean not created?</b> Check the conditions report; component scan base package; missing @Component.</li>
<li><b>Embedded server?</b> Tomcat by default; swap to Jetty/Undertow by excluding tomcat and adding another starter.</li>
</ul>`,
      pitfalls: ["Components outside the main class's package tree aren't scanned.", "Secrets in application.yml committed to git.", "Profile-specific beans silently missing in production.", "Using @Value everywhere instead of typed, validated properties."],
      interviewQs: ["How does Spring Boot auto-configuration work?", "How do you override an auto-configured bean?", "Explain the configuration property precedence.", "What happens during Spring Boot startup?"],
      resources: [{ t: "Spring Boot reference — Auto-configuration", u: "https://docs.spring.io/spring-boot/reference/using/auto-configuration.html", k: "docs" }, { t: "Spring Boot — Externalized configuration", u: "https://docs.spring.io/spring-boot/reference/features/external-config.html", k: "docs" }],
    },
    {
      id: "spring-rest",
      title: "Building REST APIs: Controllers, Validation, Error Handling, Versioning",
      summary: "Production-grade REST endpoints in Spring MVC — DTOs, bean validation, consistent error responses with @ControllerAdvice, pagination and API versioning.",
      tags: ["spring-boot", "rest"],
      brushup: [
        "<code>@RestController</code> + <code>@GetMapping/@PostMapping</code>; return DTOs, never JPA entities.",
        "Validate input with Jakarta Bean Validation: <code>@Valid @RequestBody CreateOrder req</code> + <code>@NotNull</code>, <code>@Size</code>, <code>@Email</code>, custom constraints.",
        "Centralize errors with <code>@RestControllerAdvice</code> + <code>@ExceptionHandler</code>; return RFC 7807 <code>ProblemDetail</code>.",
        "Correct status codes: 201 + Location on create, 204 on delete, 400/404/409/422.",
        "Pagination: <code>Pageable</code> / keyset cursors; never unbounded lists.",
        "Versioning: URL (/v1), header, or media type; keep changes additive.",
        "Idempotency keys for POSTs that create resources or charge money.",
        "Document with springdoc-openapi (Swagger UI).",
      ],
      detail: `
<pre><code>@RestController
@RequestMapping("/v1/orders")
@RequiredArgsConstructor
class OrderController {
    private final OrderService service;

    @PostMapping
    ResponseEntity&lt;OrderDto&gt; create(@Valid @RequestBody CreateOrderRequest req, UriComponentsBuilder uri) {
        OrderDto dto = service.create(req);
        return ResponseEntity.created(uri.path("/v1/orders/{id}").build(dto.id())).body(dto);
    }

    @GetMapping("/{id}")
    OrderDto get(@PathVariable UUID id) { return service.get(id); }   // throws OrderNotFound

    @GetMapping
    Page&lt;OrderDto&gt; list(@RequestParam(required = false) OrderStatus status, Pageable pageable) {
        return service.list(status, pageable);
    }
}

record CreateOrderRequest(@NotNull UUID customerId, @NotEmpty List&lt;@Valid Line&gt; lines) {
    record Line(@NotBlank String sku, @Min(1) @Max(100) int qty) {}
}

@RestControllerAdvice
class ApiErrors {
    @ExceptionHandler(OrderNotFound.class)
    ProblemDetail notFound(OrderNotFound e) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
        pd.setProperty("code", "ORDER_NOT_FOUND");
        return pd;
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail invalid(MethodArgumentNotValidException e) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setProperty("errors", e.getFieldErrors().stream().map(f -&gt; f.getField() + ": " + f.getDefaultMessage()).toList());
        return pd;
    }
}</code></pre>

<h2>Request lifecycle in Spring MVC</h2>
<p>Servlet container → filters (security, logging) → <code>DispatcherServlet</code> → handler mapping → interceptors → argument resolvers (@RequestBody via HttpMessageConverter/Jackson, validation) → controller → return value handler → message converter → response.</p>`,
      pitfalls: ["Returning entities (lazy-loading exceptions, leaking fields, tight coupling).", "Catching exceptions in every controller instead of one advice.", "200 OK with an error body.", "Unbounded list endpoints."],
      interviewQs: ["How do you validate request bodies and return helpful errors?", "What does DispatcherServlet do?", "How do you version a Spring REST API?", "Why use DTOs instead of entities?"],
      resources: [{ t: "Spring MVC reference", u: "https://docs.spring.io/spring-framework/reference/web/webmvc.html", k: "docs" }, { t: "springdoc-openapi", u: "https://springdoc.org/", k: "docs" }],
    },
    {
      id: "spring-data-jpa",
      title: "Spring Data JPA & Hibernate in Depth",
      summary: "Repositories, the persistence context, fetching strategies, N+1, projections, locking, batching and when to drop to SQL.",
      tags: ["spring-boot", "jpa", "hibernate"],
      brushup: [
        "Repository interfaces generate queries from method names; <code>@Query</code> for JPQL/native.",
        "Persistence context = first-level cache + dirty checking; changes to managed entities are flushed automatically at commit.",
        "Make all associations LAZY; fetch what a use case needs with <code>JOIN FETCH</code> or <code>@EntityGraph</code>.",
        "N+1: 1 query for parents + N for children — detect via SQL logs/Hibernate statistics.",
        "Projections (interfaces/records/DTO queries) for read-only views — faster than loading entities.",
        "Locking: <code>@Version</code> for optimistic locking; <code>@Lock(PESSIMISTIC_WRITE)</code> for SELECT … FOR UPDATE.",
        "Batch inserts need SEQUENCE ids with <code>allocationSize</code> + <code>hibernate.jdbc.batch_size</code> (IDENTITY disables batching).",
        "Bulk updates via JPQL bypass the persistence context — clear it afterwards.",
      ],
      detail: `
<pre><code>@Entity
class Order {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
    @SequenceGenerator(name = "order_seq", allocationSize = 50)
    Long id;
    @Version Long version;                                   // optimistic locking
    @ManyToOne(fetch = FetchType.LAZY) Customer customer;
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    List&lt;OrderLine&gt; lines = new ArrayList&lt;&gt;();
}

interface OrderRepository extends JpaRepository&lt;Order, Long&gt; {
    @EntityGraph(attributePaths = {"customer", "lines"})
    Optional&lt;Order&gt; findWithDetailsById(Long id);

    @Query("select new com.acme.OrderSummary(o.id, c.name, o.total) from Order o join o.customer c where o.status = :s")
    List&lt;OrderSummary&gt; summaries(@Param("s") Status s);                 // DTO projection

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.id = :id")
    Optional&lt;Order&gt; lockById(Long id);
}</code></pre>

<h2>Entity lifecycle</h2>
<table><tr><th>State</th><th>Meaning</th></tr>
<tr><td>Transient</td><td>new object, not tracked</td></tr><tr><td>Managed</td><td>in the persistence context, changes auto-flushed</td></tr>
<tr><td>Detached</td><td>was managed, context closed (merge to reattach)</td></tr><tr><td>Removed</td><td>scheduled for delete</td></tr></table>

<h2>Performance checklist</h2>
<ul><li>Log SQL in dev (<code>spring.jpa.show-sql</code> or datasource-proxy) and count queries per request.</li><li><code>spring.jpa.open-in-view=false</code>.</li><li>Pagination with fetch joins on collections loads everything in memory — paginate ids first.</li><li>Second-level cache only for read-mostly reference data.</li></ul>`,
      pitfalls: ["Eager @ManyToOne defaults causing hidden joins.", "Paginating a JOIN FETCH on a collection (in-memory pagination warning).", "equals/hashCode on generated ids in entities used in Sets.", "Long transactions holding persistence contexts with thousands of entities."],
      interviewQs: ["What is the persistence context and dirty checking?", "How do you fix N+1 queries?", "Optimistic vs pessimistic locking in JPA?", "Why doesn't IDENTITY generation batch inserts?"],
      resources: [{ t: "Vlad Mihalcea — Hibernate tutorials", u: "https://vladmihalcea.com/tutorials/hibernate/", k: "blog" }, { t: "Spring Data JPA reference", u: "https://docs.spring.io/spring-data/jpa/reference/", k: "docs" }],
    },
    {
      id: "spring-transactions",
      title: "Transactions in Spring: @Transactional, Propagation, Isolation, Pitfalls",
      summary: "How declarative transactions work through proxies, what each propagation mode does, rollback rules and the classic bugs.",
      tags: ["spring-boot", "transactions", "must-know"],
      brushup: [
        "@Transactional is applied by an AOP proxy: only calls coming through the proxy (from another bean) are transactional.",
        "Self-invocation, private and final methods bypass the proxy → no transaction.",
        "Rollback by default only on RuntimeException/Error; use <code>rollbackFor = Exception.class</code> for checked exceptions.",
        "Propagation: REQUIRED (join or create), REQUIRES_NEW (suspend outer, new tx — audit logs), NESTED (savepoint), SUPPORTS, MANDATORY, NEVER, NOT_SUPPORTED.",
        "Isolation per transaction (READ_COMMITTED default on Postgres).",
        "<code>readOnly = true</code> hints optimizations (no dirty checking flush).",
        "Never call remote services inside a DB transaction; publish events after commit (<code>@TransactionalEventListener(phase = AFTER_COMMIT)</code>) or use the outbox pattern.",
        "TransactionTemplate for programmatic control.",
      ],
      detail: `
<h2>Propagation cheat sheet</h2>
<table><tr><th>Mode</th><th>Existing tx?</th><th>Behaviour</th></tr>
<tr><td>REQUIRED</td><td>yes / no</td><td>join / create</td></tr>
<tr><td>REQUIRES_NEW</td><td>yes / no</td><td>suspend outer, always new — commits independently</td></tr>
<tr><td>NESTED</td><td>yes</td><td>savepoint inside the outer (JDBC only)</td></tr>
<tr><td>MANDATORY</td><td>no</td><td>throws</td></tr>
<tr><td>SUPPORTS</td><td>—</td><td>joins if present, else non-transactional</td></tr></table>

<h2>The classic bugs</h2>
<pre><code>@Service class Billing {
    public void chargeAll(List&lt;Long&gt; ids) { ids.forEach(this::charge); }   // self-call → NO transaction
    @Transactional public void charge(Long id) { ... }
}

@Transactional
public void placeOrder(Order o) throws IOException {
    repo.save(o);
    paymentClient.charge(o);            // remote call inside tx: holds DB connection + locks for seconds
    throw new IOException("x");         // checked → COMMITS unless rollbackFor = Exception.class
}</code></pre>

<h2>After-commit side effects</h2>
<pre><code>@Transactional
public void place(Order o) { repo.save(o); events.publishEvent(new OrderPlaced(o.getId())); }

@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
void onPlaced(OrderPlaced e) { kafkaTemplate.send("orders", e); }   // only if the DB commit succeeded</code></pre>`,
      pitfalls: ["Self-invocation.", "Checked exceptions not rolling back.", "Catching exceptions inside a @Transactional method and swallowing them (marks rollback-only → UnexpectedRollbackException).", "HTTP calls inside transactions."],
      interviewQs: ["Why doesn't @Transactional work on a private or self-invoked method?", "When would you use REQUIRES_NEW?", "Which exceptions trigger rollback?", "How do you send a Kafka event only after the DB commit?"],
      resources: [{ t: "Spring Framework — Transaction management", u: "https://docs.spring.io/spring-framework/reference/data-access/transaction.html", k: "docs" }],
    },
    {
      id: "spring-security",
      title: "Spring Security: Filter Chain, JWT Resource Servers, OAuth2 Login, Method Security",
      summary: "How requests are authenticated and authorized in Spring Security 6 — the filter chain, stateless JWT APIs, OAuth2/OIDC login and method-level rules.",
      tags: ["spring-boot", "security"],
      brushup: [
        "Security is a chain of servlet filters (<code>SecurityFilterChain</code>) before the DispatcherServlet.",
        "Configure with a <code>SecurityFilterChain</code> bean (the old WebSecurityConfigurerAdapter is removed).",
        "Stateless APIs: <code>oauth2ResourceServer().jwt()</code> validates bearer tokens against the issuer's JWKS; sessions disabled.",
        "Browser apps: <code>oauth2Login()</code> for OIDC SSO; keep CSRF protection on for cookie sessions.",
        "Authorization: URL rules (<code>requestMatchers(...).hasRole</code>) + method security (<code>@PreAuthorize(\"hasAuthority('SCOPE_orders:write')\")</code>).",
        "Passwords: <code>PasswordEncoder</code> (bcrypt/argon2 via DelegatingPasswordEncoder).",
        "CORS must be configured in Spring Security, not only in MVC.",
        "Object-level checks (does this user own order 42?) belong in the service layer.",
      ],
      detail: `
<pre><code>@Configuration
@EnableMethodSecurity
class SecurityConfig {
    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -&gt; csrf.disable())                       // stateless bearer-token API
            .sessionManagement(s -&gt; s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -&gt; a
                .requestMatchers("/actuator/health/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/v1/orders/**").hasAuthority("SCOPE_orders:read")
                .anyRequest().authenticated())
            .oauth2ResourceServer(o -&gt; o.jwt(Customizer.withDefaults()))
            .build();
    }
}
// application.yml: spring.security.oauth2.resourceserver.jwt.issuer-uri: https://auth.example.com/

@PreAuthorize("hasAuthority('SCOPE_orders:write') and @orderGuard.owns(#id, authentication)")
public void cancel(UUID id) { ... }</code></pre>
<h2>Request flow</h2>
<p>SecurityContextHolderFilter → CorsFilter → CsrfFilter → BearerTokenAuthenticationFilter (JWT decode + validate) → AuthorizationFilter → your controller. Failures go through AuthenticationEntryPoint (401) / AccessDeniedHandler (403).</p>`,
      pitfalls: ["Disabling CSRF on cookie-session apps.", "Only checking roles, not resource ownership (IDOR).", "Validating JWTs without checking audience/issuer.", "Custom filters placed in the wrong order."],
      interviewQs: ["Explain the Spring Security filter chain.", "How do you secure a stateless REST API with JWT?", "401 vs 403 in Spring Security?", "How do you implement resource ownership checks?"],
      resources: [{ t: "Spring Security reference", u: "https://docs.spring.io/spring-security/reference/", k: "docs" }],
    },
    {
      id: "spring-testing",
      title: "Testing Spring Boot Applications",
      summary: "Fast, reliable tests for Spring apps — slice tests, MockMvc, Testcontainers, test configuration and avoiding slow context reloads.",
      tags: ["spring-boot", "testing"],
      brushup: [
        "Unit-test services with plain JUnit + Mockito (no Spring context) — milliseconds.",
        "Slice tests load part of the context: <code>@WebMvcTest</code> (controllers + MockMvc), <code>@DataJpaTest</code> (repositories), <code>@JsonTest</code>.",
        "<code>@SpringBootTest</code> for full integration; with <code>webEnvironment = RANDOM_PORT</code> + TestRestTemplate/WebTestClient.",
        "Use <b>Testcontainers</b> for real Postgres/Kafka/Redis; <code>@ServiceConnection</code> (Boot 3.1+) wires them automatically.",
        "Context caching: tests with identical configuration reuse the context — avoid unnecessary @MockBean variations (each creates a new context).",
        "WireMock for external HTTP dependencies.",
      ],
      detail: `
<pre><code>@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;

    @Test void returns404WhenMissing() throws Exception {
        when(service.get(any())).thenThrow(new OrderNotFound("x"));
        mvc.perform(get("/v1/orders/{id}", UUID.randomUUID()))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.code").value("ORDER_NOT_FOUND"));
    }
}

@SpringBootTest
@Testcontainers
class OrderFlowIT {
    @Container @ServiceConnection static PostgreSQLContainer&lt;?&gt; pg = new PostgreSQLContainer&lt;&gt;("postgres:16");
    @Container @ServiceConnection static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("apache/kafka:3.8.0"));
    @Autowired OrderService service;
    @Test void placesOrderAndPublishesEvent() { ... }
}</code></pre>`,
      pitfalls: ["@SpringBootTest for everything → slow suites.", "Different @MockBean sets in every test class → context reloads.", "H2 instead of the real database (different SQL dialect/behaviour)."],
      interviewQs: ["@WebMvcTest vs @SpringBootTest?", "How do you test repository queries?", "How do you test Kafka integration?", "How do you keep Spring test suites fast?"],
      resources: [{ t: "Spring Boot — Testing", u: "https://docs.spring.io/spring-boot/reference/testing/index.html", k: "docs" }, { t: "Testcontainers — Spring Boot", u: "https://testcontainers.com/guides/testing-spring-boot-rest-api-using-testcontainers/", k: "article" }],
    },
    {
      id: "spring-actuator-observability",
      title: "Actuator, Micrometer & Production Readiness",
      summary: "Health checks, metrics, tracing and graceful operation of Spring Boot services in Kubernetes.",
      tags: ["spring-boot", "observability"],
      brushup: [
        "Actuator endpoints: /health (liveness & readiness groups), /metrics, /prometheus, /info, /loggers (change log levels at runtime), /threaddump, /heapdump — expose only what you need and secure them.",
        "Micrometer = metrics facade (Prometheus, Datadog…); auto-instruments HTTP, JDBC pools, JVM, Kafka.",
        "Micrometer Tracing (+ OpenTelemetry bridge) propagates trace IDs; logs include traceId/spanId.",
        "Kubernetes: map liveness/readiness probes to /actuator/health/liveness and /readiness.",
        "Graceful shutdown: <code>server.shutdown=graceful</code> + <code>spring.lifecycle.timeout-per-shutdown-phase</code>.",
        "Custom health indicators for critical dependencies — but don't fail liveness on a dependency outage.",
      ],
      detail: `
<pre><code>management:
  endpoints.web.exposure.include: health,info,prometheus,loggers
  endpoint.health:
    probes.enabled: true
    group.readiness.include: readinessState,db,kafka
  tracing.sampling.probability: 0.1
server.shutdown: graceful

@Component
class OrdersMetrics {
    private final Counter placed;
    OrdersMetrics(MeterRegistry reg) { placed = Counter.builder("orders.placed").tag("channel", "web").register(reg); }
    void onPlaced() { placed.increment(); }
}

@Timed(value = "psp.charge", percentiles = {0.5, 0.95, 0.99})
public ChargeResult charge(...) { ... }</code></pre>`,
      pitfalls: ["Exposing /heapdump or /env publicly.", "Liveness probes that check the database.", "High-cardinality metric tags (user ids)."],
      interviewQs: ["How do you make a Spring Boot service production-ready?", "Liveness vs readiness in Spring Boot?", "How do you add custom metrics?", "How does distributed tracing work in Spring?"],
      resources: [{ t: "Spring Boot — Actuator", u: "https://docs.spring.io/spring-boot/reference/actuator/index.html", k: "docs" }, { t: "Micrometer docs", u: "https://docs.micrometer.io/micrometer/reference/", k: "docs" }],
    },
    {
      id: "spring-reactive-cloud",
      title: "WebFlux, Virtual Threads & Spring Cloud",
      summary: "When to go reactive vs virtual threads, and the Spring Cloud building blocks for microservices (gateway, config, discovery, resilience, streams).",
      tags: ["spring-boot", "reactive", "microservices"],
      brushup: [
        "WebFlux: non-blocking, Reactor (Mono/Flux), backpressure; great for streaming and very high concurrency, but viral complexity and blocking calls are fatal.",
        "Spring MVC + virtual threads (<code>spring.threads.virtual.enabled=true</code>) gives most of the scalability with simple blocking code.",
        "Spring Cloud Gateway: routing, filters, rate limiting at the edge.",
        "Spring Cloud Config / Kubernetes ConfigMaps for centralized config; service discovery via Kubernetes DNS or Eureka.",
        "Resilience4j (circuit breaker, retry, bulkhead, rate limiter, time limiter) with Spring Boot starters.",
        "Spring Cloud Stream / Spring Kafka for messaging; RestClient/WebClient/HTTP interface clients for sync calls.",
      ],
      detail: `
<h2>MVC vs WebFlux vs virtual threads</h2>
<table><tr><th></th><th>MVC (platform threads)</th><th>MVC + virtual threads</th><th>WebFlux</th></tr>
<tr><td>Code style</td><td>Blocking, simple</td><td>Blocking, simple</td><td>Reactive chains</td></tr>
<tr><td>Concurrency</td><td>Thread-pool bound</td><td>Very high</td><td>Very high</td></tr>
<tr><td>Streaming/backpressure</td><td>Limited</td><td>Limited</td><td>Native</td></tr>
<tr><td>Debugging</td><td>Easy</td><td>Easy</td><td>Harder</td></tr></table>

<h2>Resilience4j</h2>
<pre><code>@CircuitBreaker(name = "psp", fallbackMethod = "queueForLater")
@Retry(name = "psp")
@TimeLimiter(name = "psp")
public CompletableFuture&lt;ChargeResult&gt; charge(Order o) { ... }

resilience4j.circuitbreaker.instances.psp:
  failure-rate-threshold: 50
  sliding-window-size: 20
  wait-duration-in-open-state: 30s</code></pre>`,
      pitfalls: ["Blocking JDBC calls inside WebFlux handlers.", "Retrying non-idempotent calls.", "Adopting Spring Cloud components you don't need on Kubernetes (Eureka + k8s DNS)."],
      interviewQs: ["When would you choose WebFlux over Spring MVC?", "How do virtual threads change that decision?", "How do you implement a circuit breaker in Spring?", "What does Spring Cloud Gateway do?"],
      resources: [{ t: "Spring WebFlux reference", u: "https://docs.spring.io/spring-framework/reference/web/webflux.html", k: "docs" }, { t: "Resilience4j — Spring Boot 3", u: "https://resilience4j.readme.io/docs/getting-started-3", k: "docs" }],
    },
  ],
});
