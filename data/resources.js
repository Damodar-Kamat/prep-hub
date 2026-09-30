/* Resource Hub — the curated one-stop directory of the best external resources, by area. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
(function () {
  const K = { book: "📘", course: "🎓", video: "🎬", article: "📄", docs: "📚", practice: "🧩", repo: "📦", tool: "🛠️", blog: "📰", paper: "📄", newsletter: "✉️" };
  // table of resources with the "why" for each
  const table = (rows) => `<table><tr><th>Resource</th><th>Type</th><th>Why use it</th></tr>${rows
    .map(([t, u, k, why]) => `<tr><td><a href="${u}" target="_blank" rel="noopener">${t}</a></td><td>${K[k] || "🔗"} ${k}</td><td>${why}</td></tr>`)
    .join("")}</table>`;
  const res = (rows) => rows.map(([t, u, k, n]) => ({ t, u, k, n }));

  const DSA = [
    ["NeetCode 150 + roadmap", "https://neetcode.io/roadmap", "practice", "The best-ordered problem list with video solutions — mirrors this app's DSA Plan."],
    ["LeetCode", "https://leetcode.com/problemset/", "practice", "The standard practice platform; company-tagged problems (premium) and contests."],
    ["Blind 75 (Tech Interview Handbook)", "https://www.techinterviewhandbook.org/grind75/", "practice", "Grind 75: a time-boxed plan generator if you have only a few weeks."],
    ["Tech Interview Handbook — algorithms", "https://www.techinterviewhandbook.org/algorithms/study-cheatsheet/", "article", "Concise per-topic cheat sheets and pitfalls."],
    ["CP-Algorithms", "https://cp-algorithms.com/", "docs", "Reference implementations of advanced algorithms (graphs, strings, number theory)."],
    ["Visualgo", "https://visualgo.net/en", "tool", "Animations of data structures and algorithms — great for intuition."],
    ["AlgoExpert / AlgoMonster", "https://algo.monster/", "course", "Pattern-based courses if you prefer structured paid content."],
    ["Introduction to Algorithms (CLRS)", "https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/", "book", "The reference textbook — for depth, not for interview cramming."],
    ["MIT 6.006 Introduction to Algorithms", "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/", "course", "Free university lectures on the fundamentals."],
  ];
  const SD = [
    ["System Design Primer", "https://github.com/donnemartin/system-design-primer", "repo", "Free, comprehensive overview of building blocks with Anki cards."],
    ["Designing Data-Intensive Applications (DDIA)", "https://dataintensive.net/", "book", "The single most valuable book for system design and distributed systems depth."],
    ["System Design Interview Vol. 1 & 2 — Alex Xu", "https://bytebytego.com/", "book", "Worked interview problems in exactly the interview format."],
    ["Hello Interview — system design", "https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction", "article", "Excellent free breakdowns by ex-FAANG interviewers, with level expectations."],
    ["ByteByteGo blog & newsletter", "https://blog.bytebytego.com/", "newsletter", "Visual explanations of real architectures every week."],
    ["High Scalability", "https://highscalability.com/", "blog", "Real-world architecture case studies."],
    ["AWS Builders' Library", "https://aws.amazon.com/builders-library/", "article", "How Amazon actually builds resilient systems (timeouts, shedding, cells)."],
    ["Google SRE books (free)", "https://sre.google/books/", "book", "Reliability, SLOs, incident response, cascading failures."],
    ["Excalidraw", "https://excalidraw.com/", "tool", "The whiteboard most remote design interviews use — practise drawing on it."],
  ];
  const BACKEND = [
    ["MIT 6.824 Distributed Systems", "https://pdos.csail.mit.edu/6.824/", "course", "Lectures + labs (Raft, sharded KV) — the best way to truly learn distributed systems."],
    ["Martin Kleppmann — Distributed Systems lectures", "https://www.youtube.com/playlist?list=PLeKd45zvjcDFUEv_ohr_HdUFe97RItdiB", "video", "Clear Cambridge lecture series on clocks, replication, consensus."],
    ["Database Internals — Alex Petrov", "https://www.databass.dev/", "book", "Storage engines and distributed database internals."],
    ["Use The Index, Luke", "https://use-the-index-luke.com/", "article", "Free guide to SQL indexing and performance."],
    ["Jepsen analyses", "https://jepsen.io/analyses", "article", "How real databases behave under partitions — superb for consistency intuition."],
    ["Release It! — Michael Nygard", "https://pragprog.com/titles/mnee2/release-it-second-edition/", "book", "Stability patterns: timeouts, circuit breakers, bulkheads."],
    ["microservices.io", "https://microservices.io/patterns/index.html", "article", "Pattern catalogue: sagas, outbox, API gateway, CQRS."],
  ];
  const DATA = [
    ["Fundamentals of Data Engineering", "https://www.oreilly.com/library/view/fundamentals-of-data/9781098108298/", "book", "The best overview of the modern data engineering lifecycle."],
    ["Data Engineering Zoomcamp (free)", "https://github.com/DataTalksClub/data-engineering-zoomcamp", "course", "Hands-on: Docker, Terraform, Airflow/Kestra, dbt, Spark, Kafka."],
    ["Streaming Systems — Akidau et al.", "https://www.oreilly.com/library/view/streaming-systems/9781491983867/", "book", "Event time, watermarks, windows — the theory behind Flink and Beam."],
    ["Confluent Developer courses", "https://developer.confluent.io/courses/", "course", "Free Kafka, Kafka Streams, Flink SQL courses."],
    ["Apache Flink documentation", "https://nightlies.apache.org/flink/flink-docs-stable/", "docs", "Concepts, state, checkpointing, SQL."],
    ["The Data Warehouse Toolkit — Kimball", "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/books/data-warehouse-dw-toolkit/", "book", "Dimensional modeling bible."],
    ["Seattle Data Guy / Data Engineering Weekly", "https://www.dataengineeringweekly.com/", "newsletter", "Weekly curated data engineering articles."],
    ["Start Data Engineering", "https://www.startdataengineering.com/", "blog", "Practical project-based data engineering posts and interview prep."],
  ];
  const LANG = [
    ["Effective Java (3rd ed.)", "https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/", "book", "The Java book interviewers expect you to know."],
    ["Java Concurrency in Practice", "https://jcip.net/", "book", "Still the definitive concurrency reference."],
    ["dev.java", "https://dev.java/learn/", "course", "Official modern Java learning path."],
    ["Baeldung", "https://www.baeldung.com/", "article", "Practical Java/Spring articles for every API."],
    ["Fluent Python (2nd ed.)", "https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/", "book", "Deep, idiomatic Python."],
    ["Real Python", "https://realpython.com/", "article", "High-quality Python tutorials."],
    ["javascript.info", "https://javascript.info/", "course", "The best free JavaScript tutorial."],
    ["Go by Example", "https://gobyexample.com/", "course", "If you need Go quickly."],
  ];
  const CLOUD = [
    ["Kubernetes documentation", "https://kubernetes.io/docs/home/", "docs", "Concepts and tasks — surprisingly readable."],
    ["Kubernetes the Hard Way", "https://github.com/kelseyhightower/kubernetes-the-hard-way", "repo", "Build a cluster by hand to understand every component."],
    ["AWS Well-Architected Framework", "https://aws.amazon.com/architecture/well-architected/", "docs", "The pillars (reliability, security, cost…) interviewers reference."],
    ["AWS Skill Builder", "https://skillbuilder.aws/", "course", "Free official AWS training."],
    ["Terraform tutorials", "https://developer.hashicorp.com/terraform/tutorials", "course", "Official hands-on IaC tutorials."],
    ["OpenTelemetry docs", "https://opentelemetry.io/docs/", "docs", "Vendor-neutral observability standard."],
    ["Brendan Gregg — Linux performance", "https://www.brendangregg.com/linuxperf.html", "article", "The authority on performance analysis tools."],
  ];
  const CAREER = [
    ["Tech Interview Handbook", "https://www.techinterviewhandbook.org/", "article", "Free end-to-end guide: resume, behavioral, coding, negotiation."],
    ["Levels.fyi", "https://www.levels.fyi/", "tool", "Real compensation data by company and level."],
    ["interviewing.io", "https://interviewing.io/", "practice", "Anonymous mock interviews with senior engineers + a public recordings library."],
    ["Exponent", "https://www.tryexponent.com/", "practice", "Mock interviews, peer practice, company guides."],
    ["Glassdoor interviews", "https://www.glassdoor.com/Interview/index.htm", "article", "Company-specific interview reports (use Company intel in Interview OS to aggregate)."],
    ["LeetCode Discuss — interview experiences", "https://leetcode.com/discuss/interview-experience", "article", "Recent real interview loops by company."],
    ["Cracking the Coding Interview", "https://www.crackingthecodinginterview.com/", "book", "Classic overview of the process and fundamentals."],
    ["Haseeb Qureshi — Ten rules for negotiating", "https://haseebq.com/my-ten-rules-for-negotiating-a-job-offer/", "article", "The best free guide to negotiating offers."],
  ];
  const BLOGS = [
    ["Netflix Tech Blog", "https://netflixtechblog.com/", "blog", "Streaming, resilience, data platform at extreme scale."],
    ["Uber Engineering", "https://www.uber.com/blog/engineering/", "blog", "Geospatial, real-time, data infrastructure."],
    ["Meta Engineering", "https://engineering.fb.com/", "blog", "Infrastructure, storage, ML systems."],
    ["Cloudflare Blog", "https://blog.cloudflare.com/", "blog", "Networking, edge computing, incident write-ups."],
    ["Discord Engineering", "https://discord.com/blog", "blog", "Messaging at scale (Cassandra → ScyllaDB, Elixir, Rust)."],
    ["Stripe Engineering", "https://stripe.com/blog/engineering", "blog", "APIs, payments reliability, idempotency."],
    ["The Pragmatic Engineer", "https://newsletter.pragmaticengineer.com/", "newsletter", "Industry insights, how big tech works, leveling."],
    ["ByteByteGo YouTube", "https://www.youtube.com/@ByteByteGo", "video", "Short animated system design explainers."],
    ["Hussein Nasser (YouTube)", "https://www.youtube.com/@hnasr", "video", "Backend engineering, databases and networking deep dives."],
    ["Gaurav Sen (YouTube)", "https://www.youtube.com/@gkcs", "video", "System design interview walkthroughs."],
    ["NeetCode (YouTube)", "https://www.youtube.com/@NeetCode", "video", "Clear DSA problem explanations."],
  ];
  const PAPERS = [
    ["MapReduce (2004)", "https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/", "paper", "Origin of large-scale batch processing."],
    ["The Google File System (2003)", "https://research.google/pubs/the-google-file-system/", "paper", "Distributed storage design classic."],
    ["Bigtable (2006)", "https://research.google/pubs/bigtable-a-distributed-storage-system-for-structured-data/", "paper", "Wide-column stores, LSM trees in practice."],
    ["Dynamo (2007)", "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf", "paper", "Consistent hashing, quorums, vector clocks, hinted handoff."],
    ["Kafka (2011)", "https://notes.stephenholiday.com/Kafka.pdf", "paper", "The log as the core abstraction."],
    ["Raft (2014)", "https://raft.github.io/raft.pdf", "paper", "Understandable consensus."],
    ["Spanner (2012)", "https://research.google/pubs/spanner-googles-globally-distributed-database-2/", "paper", "Globally distributed transactions with TrueTime."],
    ["Lightweight Asynchronous Snapshots (Flink, 2015)", "https://arxiv.org/abs/1506.08603", "paper", "How Flink checkpoints work."],
    ["Attention Is All You Need (2017)", "https://arxiv.org/abs/1706.03762", "paper", "The transformer architecture behind LLMs."],
    ["Time, Clocks, and the Ordering of Events (1978)", "https://lamport.azurewebsites.net/pubs/time-clocks.pdf", "paper", "Logical clocks and causality."],
  ];
  const COMPANY = [
    ["Amazon — How we hire & interview prep", "https://www.amazon.jobs/content/en/how-we-hire/interviewing-at-amazon", "article", "Loop structure, Leadership Principles, STAR."],
    ["Google — How we hire", "https://www.google.com/about/careers/applications/how-we-hire/", "article", "Process, interview types, tips."],
    ["Microsoft — Interview tips", "https://careers.microsoft.com/v2/global/en/hiring-tips/interview-tips", "article", "Process and what they look for."],
  ];

  window.STUDY_SECTIONS.push({
    id: "resources",
    title: "Resource Hub",
    icon: "🧭",
    blurb: "The curated directory: the best books, courses, practice sites, channels, blogs, papers and company prep pages for every area — with why each is worth your time.",
    topics: [
      {
        id: "res-start-here",
        title: "Start Here: How to Use This Workspace (and the Only 10 Resources You Truly Need)",
        summary: "A study system that works, how the library, DSA plan and Interview OS fit together, and a shortlist of resources if time is tight.",
        tags: ["plan", "must-know"],
        brushup: [
          "Daily loop (≈2 h): 1 DSA pattern block (DSA Plan) → 1 concept deep dive → 15 min flashcards → 3×/week a mock interview out loud.",
          "Weekly: one system design problem end to end on a whiteboard; update your STAR story bank; review weak flashcards.",
          "Use <b>Key points</b> for revision, <b>Deep dive</b> for learning, <b>Last-Minute Prep</b> the day before.",
          "Interview OS agents fill gaps: <b>Research</b> any topic, <b>Company intel</b> before each loop, <b>JD matcher</b> per application.",
          "If time is short: NeetCode 150, DDIA, Alex Xu's System Design Interview, Hello Interview guides, Tech Interview Handbook, your story bank.",
          "Speak answers out loud — recognition is not recall.",
        ],
        detail: `
<h2>The 10 resources that cover 90%</h2>
${table([
  ["NeetCode 150", "https://neetcode.io/roadmap", "practice", "Coding interviews."],
  ["Designing Data-Intensive Applications", "https://dataintensive.net/", "book", "Backend + distributed depth."],
  ["System Design Interview Vol 1/2 (Alex Xu)", "https://bytebytego.com/", "book", "Design interview format."],
  ["Hello Interview", "https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction", "article", "Design breakdowns with level expectations."],
  ["Tech Interview Handbook", "https://www.techinterviewhandbook.org/", "article", "Process, resume, behavioral, negotiation."],
  ["Effective Java / Fluent Python", "https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/", "book", "Language depth for your main language."],
  ["Kafka & Flink docs", "https://kafka.apache.org/documentation/", "docs", "For data/streaming roles."],
  ["AWS Builders' Library", "https://aws.amazon.com/builders-library/", "article", "Production reliability judgement."],
  ["interviewing.io", "https://interviewing.io/", "practice", "Realistic mocks."],
  ["Levels.fyi", "https://www.levels.fyi/", "tool", "Know your market before negotiating."],
])}

<h2>How the pieces fit</h2>
<table>
<tr><th>Need</th><th>Where in this workspace</th></tr>
<tr><td>Learn a concept</td><td>All topics → Deep dive; Interview OS → Research agent for anything missing</td></tr>
<tr><td>Practise DSA</td><td>DSA Plan (150 problems, spaced repetition) + DSA Practice runner</td></tr>
<tr><td>Remember it</td><td>Interview OS → Flashcards (auto-seeded from every topic)</td></tr>
<tr><td>Say it well</td><td>Interview OS → Mock interview (voice), Story bank</td></tr>
<tr><td>Target a company</td><td>Company intel, JD matcher, Applications board, Study plan</td></tr>
</table>`,
        pitfalls: ["Collecting resources instead of practising.", "Watching solutions without solving from a blank page.", "Skipping mocks until the week before."],
        interviewQs: ["(Meta) How are you preparing, and what's your weakest area?"],
        resources: res([["Tech Interview Handbook", "https://www.techinterviewhandbook.org/", "article"], ["NeetCode roadmap", "https://neetcode.io/roadmap", "practice"]]),
      },
      { id: "res-dsa", title: "DSA & Coding Practice Resources", summary: "Where to practise coding problems and learn algorithms — ranked by usefulness for interviews.", tags: ["dsa"],
        brushup: ["Primary: NeetCode 150 in order, re-solve from memory after 3 and 7 days.", "Pattern cheat sheets from Tech Interview Handbook.", "Visualgo for intuition on trees/graphs/heaps.", "Company-tagged LeetCode lists in the final 2 weeks.", "Contests sharpen speed once fundamentals are solid."],
        detail: `<h2>Resources</h2>${table(DSA)}`, resources: res(DSA.slice(0, 4)), interviewQs: [], pitfalls: ["Solving 500 easy problems instead of mastering patterns."] },
      { id: "res-sd", title: "System Design Resources", summary: "The books, guides, blogs and tools for high-level and low-level design preparation.", tags: ["system-design"],
        brushup: ["Read DDIA for depth; Alex Xu + Hello Interview for interview format.", "Practise out loud on Excalidraw with a timer.", "Read one real architecture post per week.", "Study the case studies in this library in order."],
        detail: `<h2>Resources</h2>${table(SD)}<h2>Low-level design</h2>${table([
          ["awesome-low-level-design", "https://github.com/ashishps1/awesome-low-level-design", "repo", "Problems + solutions in several languages."],
          ["Refactoring.Guru — design patterns", "https://refactoring.guru/design-patterns", "article", "Best visual explanation of every GoF pattern."],
          ["Head First Design Patterns", "https://www.oreilly.com/library/view/head-first-design/9781492077992/", "book", "Beginner-friendly patterns book."],
        ])}`, resources: res(SD.slice(0, 4)), interviewQs: [], pitfalls: ["Memorizing diagrams instead of reasoning from requirements."] },
      { id: "res-backend", title: "Backend, Databases & Distributed Systems Resources", summary: "Courses, books and analyses to build real depth in backend engineering and distributed systems.", tags: ["distributed", "databases"],
        brushup: ["MIT 6.824 labs are the gold standard for distributed systems.", "Jepsen analyses build consistency intuition.", "Use The Index, Luke for SQL performance.", "Release It! for production stability patterns."],
        detail: `<h2>Resources</h2>${table(BACKEND)}`, resources: res(BACKEND.slice(0, 4)), interviewQs: [], pitfalls: [] },
      { id: "res-data", title: "Data Engineering & Streaming Resources", summary: "The best material for Kafka, Flink, Spark, warehousing and modern data platforms.", tags: ["data-engineering", "kafka", "flink"],
        brushup: ["Fundamentals of Data Engineering for the big picture.", "Streaming Systems for time/watermark theory.", "Confluent Developer for hands-on Kafka/Flink SQL.", "Kimball for modeling interviews."],
        detail: `<h2>Resources</h2>${table(DATA)}`, resources: res(DATA.slice(0, 4)), interviewQs: [], pitfalls: [] },
      { id: "res-languages", title: "Language Resources: Java, Python, JavaScript, Go", summary: "The definitive books and tutorials for mastering your interview language.", tags: ["java", "python", "javascript"],
        brushup: ["Pick one language for coding rounds and know its standard library cold.", "Effective Java / Fluent Python for depth questions.", "Practise writing code without an IDE."],
        detail: `<h2>Resources</h2>${table(LANG)}`, resources: res(LANG.slice(0, 4)), interviewQs: [], pitfalls: [] },
      { id: "res-cloud", title: "Cloud, DevOps & SRE Resources", summary: "Hands-on and conceptual resources for Kubernetes, AWS, Terraform and observability.", tags: ["cloud", "kubernetes"],
        brushup: ["Do Kubernetes the Hard Way once.", "Skim the Well-Architected pillars before cloud-heavy interviews.", "Know the SRE book's SLO chapter."],
        detail: `<h2>Resources</h2>${table(CLOUD)}`, resources: res(CLOUD.slice(0, 4)), interviewQs: [], pitfalls: [] },
      { id: "res-career", title: "Career, Behavioral, Mock Interview & Negotiation Resources", summary: "Everything around the technical content: mocks, company reports, compensation data and negotiation.", tags: ["career"],
        brushup: ["Do at least 3 external mocks before real loops.", "Check Levels.fyi before recruiter calls.", "Read recent interview experiences for each target company (Company intel agent does this)."],
        detail: `<h2>Resources</h2>${table(CAREER)}`, resources: res(CAREER.slice(0, 4)), interviewQs: [], pitfalls: [] },
      { id: "res-blogs", title: "Engineering Blogs, Newsletters & YouTube Channels", summary: "Keep learning from how real companies build systems — the feeds worth following.", tags: ["blogs", "learning"],
        brushup: ["Follow 3–5 blogs relevant to your target companies.", "Use real incidents/architectures as examples in design interviews.", "Interview OS → Eng. blogs aggregates 24 feeds automatically."],
        detail: `<h2>Resources</h2>${table(BLOGS)}`, resources: res(BLOGS.slice(0, 4)), interviewQs: [], pitfalls: [] },
      { id: "res-papers", title: "Classic Papers Reading List", summary: "Ten papers that shaped modern infrastructure — reading summaries of these sets you apart in senior interviews.", tags: ["papers", "distributed"],
        brushup: ["Read the abstract, architecture section and evaluation first.", "Connect each paper to a modern system (Dynamo → Cassandra/DynamoDB, GFS → HDFS, Bigtable → HBase).", "Use them as examples when justifying design choices."],
        detail: `<h2>Papers</h2>${table(PAPERS)}<p>Also see <a href="https://www.the-paper-trail.org/" target="_blank" rel="noopener">The Paper Trail</a> and <a href="https://blog.acolyer.org/" target="_blank" rel="noopener">The Morning Paper archive</a> for accessible summaries.</p>`, resources: res(PAPERS.slice(0, 4)), interviewQs: [], pitfalls: [] },
      { id: "res-companies", title: "Official Company Interview Prep Pages", summary: "What each big company officially says about its interview process — read before every loop.", tags: ["companies"],
        brushup: ["Read the official prep page first, then candidate reports.", "Note the round types and values/principles.", "Build a company dossier with Interview OS → Company intel."],
        detail: `<h2>Official pages</h2>${table(COMPANY)}`, resources: res(COMPANY.slice(0, 4)), interviewQs: [], pitfalls: [] },
    ],
  });
})();
