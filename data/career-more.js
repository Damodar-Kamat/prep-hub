/* More Career & Behavioral topics — appended to the existing career section. */
(function () {
  const career = (window.STUDY_SECTIONS || []).find((s) => s.id === "career");
  if (!career) return;
  career.topics.push(
    {
      id: "career-intro",
      title: "“Tell Me About Yourself” & Your Career Narrative",
      summary: "The 90-second pitch that opens almost every interview — a structure, a template and examples that set up the rest of the conversation.",
      tags: ["behavioral", "must-know"],
      brushup: [
        "Structure: <b>present</b> (role, scope, domain) → <b>past</b> (2–3 highlights with numbers) → <b>future</b> (why this role/company now).",
        "60–120 seconds; tailored to the job description's top 3 requirements.",
        "Lead with impact and scope, not a chronological CV walk-through.",
        "Plant hooks you want to be asked about (a big migration, a scaling win).",
        "End with a clear, positive 'why now' — never badmouth your current employer.",
        "Rehearse out loud until it sounds conversational, not memorized.",
      ],
      detail: `
<h2>Template</h2>
<pre><code>"I'm a [role] with [N] years building [domain/systems]. Currently at [company] I own [scope — team size, systems, scale].
Two things I'm proud of: [highlight 1 with a number] and [highlight 2 with a number].
Before that, [one line on earlier experience that supports this role].
I'm looking for [what this role offers — scale, domain, ownership], which is why [company]'s [specific product/challenge] excites me."</code></pre>

<h2>Example (data/backend engineer)</h2>
<p>"I'm a backend engineer with five years building data-intensive services. At my current company I own our real-time device telemetry platform — Kafka and Flink pipelines processing about two million events a minute that feed alerting and dashboards. I led the move from batch jobs to streaming, which cut alert latency from 15 minutes to under 10 seconds, and I redesigned our storage layer on Iceberg, reducing query costs by about 40%. Before that I built Spring Boot microservices for payments. I'm now looking for a team where streaming data is core to the product and the scale is larger — which is why your real-time analytics platform is exciting to me."</p>

<h2>Checklist</h2>
<ul><li>Does it answer "why should we keep listening"?</li><li>Numbers: users, events/s, latency, cost, team size.</li><li>Matches the level you're interviewing for (ownership, influence for senior roles).</li></ul>`,
      pitfalls: ["Reciting the resume chronologically from college.", "Going over 3 minutes.", "Personal life details instead of professional story.", "Negative reasons for leaving."],
      interviewQs: ["Tell me about yourself.", "Walk me through your resume.", "Why are you looking to leave?", "Why this company?"],
      resources: [{ t: "Tech Interview Handbook — Self introduction", u: "https://www.techinterviewhandbook.org/self-introduction/", k: "article" }],
    },
    {
      id: "career-amazon-lp",
      title: "Amazon Leadership Principles & Values-Based Interviews",
      summary: "How Amazon (and other values-driven companies) interview, what each Leadership Principle probes, and how to map your stories to them.",
      tags: ["behavioral", "amazon"],
      brushup: [
        "Every Amazon interviewer is assigned 2–3 LPs; expect 2 behavioral questions per round, even in technical rounds; the <b>Bar Raiser</b> guards the hiring bar.",
        "Most probed: Customer Obsession, Ownership, Dive Deep, Deliver Results, Bias for Action, Have Backbone; Disagree and Commit, Earn Trust, Invent and Simplify.",
        "Prepare 8–10 STAR stories, each mapped to 2–3 LPs; have backup stories for the top LPs.",
        "Expect deep follow-ups: 'What exactly did YOU do?', 'What data did you use?', 'What would you do differently?'.",
        "Quantify results and state your personal role; 'we' answers score poorly.",
        "Failure stories are expected — show learning and mechanisms you created.",
      ],
      detail: `
<h2>LP → what they probe → sample question</h2>
<table>
<tr><th>Principle</th><th>Signal</th><th>Question</th></tr>
<tr><td>Customer Obsession</td><td>Start from customer needs, earn trust</td><td>Tell me about a time you went above and beyond for a customer.</td></tr>
<tr><td>Ownership</td><td>Long-term thinking, act beyond your role</td><td>Tell me about a time you took on something outside your responsibilities.</td></tr>
<tr><td>Invent and Simplify</td><td>Innovation, simplification</td><td>Tell me about a time you simplified a complex process.</td></tr>
<tr><td>Are Right, A Lot</td><td>Judgement, seeking diverse views</td><td>Tell me about a decision you made with incomplete data.</td></tr>
<tr><td>Learn and Be Curious</td><td>Growth</td><td>What's something you learned recently and applied?</td></tr>
<tr><td>Insist on the Highest Standards</td><td>Quality bar</td><td>Tell me about a time you refused to compromise on quality.</td></tr>
<tr><td>Think Big</td><td>Bold direction</td><td>Tell me about a time you proposed a big, non-obvious idea.</td></tr>
<tr><td>Bias for Action</td><td>Calculated risk, speed</td><td>Tell me about a time you made a quick decision without full information.</td></tr>
<tr><td>Frugality</td><td>Doing more with less</td><td>Tell me about a time you delivered with limited resources.</td></tr>
<tr><td>Earn Trust</td><td>Candour, self-criticism</td><td>Tell me about a time you received tough feedback.</td></tr>
<tr><td>Dive Deep</td><td>Data, root cause</td><td>Tell me about the hardest problem you debugged.</td></tr>
<tr><td>Have Backbone; Disagree and Commit</td><td>Respectful conflict</td><td>Tell me about a time you disagreed with your manager.</td></tr>
<tr><td>Deliver Results</td><td>Outcomes despite setbacks</td><td>Tell me about a time you delivered under a tight deadline.</td></tr>
</table>

<h2>Other companies' value interviews</h2>
<ul><li><b>Google</b>: "Googleyness" & leadership — ambiguity, collaboration, humility, doing the right thing.</li>
<li><b>Meta</b>: move fast, impact, directness; behavioral round focuses on conflict, growth, ambiguity.</li>
<li><b>Microsoft</b>: growth mindset, collaboration, customer focus.</li>
<li>Research values on the company's careers page; map stories the same way.</li></ul>`,
      pitfalls: ["Hypothetical answers ('I would…') instead of real stories.", "One story reused for every LP.", "No metrics or unclear personal contribution."],
      interviewQs: ["Tell me about a time you disagreed and committed.", "Tell me about a time you failed.", "Tell me about a time you had to dive deep into data to find a root cause.", "Tell me about your most innovative idea."],
      resources: [
        { t: "Amazon Leadership Principles (official)", u: "https://www.amazon.jobs/content/en/our-workplace/leadership-principles", k: "docs" },
        { t: "Amazon — Interview prep & STAR", u: "https://www.amazon.jobs/content/en/how-we-hire/interviewing-at-amazon", k: "article" },
      ],
    },
    {
      id: "career-questions-to-ask",
      title: "Questions to Ask Your Interviewers",
      summary: "Smart questions that show seniority, uncover red flags and help you choose the right team — organized by interviewer type.",
      tags: ["behavioral", "career"],
      brushup: [
        "Always have 2–3 questions per interviewer; tailor to their role.",
        "Engineers: codebase health, deploy process, on-call, tech debt, how decisions are made.",
        "Managers: team goals, how success is measured in 6 months, growth/promotion, team challenges.",
        "Leadership: strategy, biggest risks, how engineering influences product.",
        "Use questions to verify red flags (constant firefighting, unclear ownership, attrition).",
        "Avoid questions answered on the website, or compensation in early technical rounds.",
      ],
      detail: `
<h2>Engineer / peer</h2>
<ul><li>What does a typical week look like? How much time goes to meetings vs building?</li>
<li>How does code get from a PR to production? How often do you deploy?</li>
<li>What does on-call look like — pages per week?</li>
<li>What's the biggest piece of tech debt and is there a plan for it?</li>
<li>What's something you'd change about how the team works?</li></ul>
<h2>Hiring manager</h2>
<ul><li>What would success look like for this role at 3, 6 and 12 months?</li>
<li>What are the team's biggest challenges this year?</li>
<li>How do you support growth and promotions? Who was promoted recently and why?</li>
<li>How are priorities set between product and engineering?</li>
<li>Why is this position open?</li></ul>
<h2>Senior leadership</h2>
<ul><li>What are the biggest bets and risks for the org next year?</li>
<li>How does engineering influence product strategy?</li>
<li>What do the best engineers here do differently?</li></ul>`,
      pitfalls: ["Saying 'no questions'.", "Asking about perks/vacation in the first technical round.", "Generic questions not tailored to what you heard."],
      interviewQs: ["Do you have any questions for me?"],
      resources: [{ t: "Reverse interview questions (GitHub)", u: "https://github.com/viraptor/reverse-interview", k: "repo" }],
    },
    {
      id: "career-resume",
      title: "Resume, LinkedIn & Getting Interviews",
      summary: "Writing a resume that passes ATS filters and impresses engineers, a LinkedIn that recruiters find, and a job-search pipeline that produces interviews.",
      tags: ["career", "resume", "job-search"],
      brushup: [
        "One page (two max for 10+ years); reverse chronological; clean single-column format for ATS.",
        "Bullets = <b>action verb + what you built + technology + measurable impact</b> (XYZ formula: accomplished X measured by Y by doing Z).",
        "Mirror the job description's keywords where truthful (use the JD matcher in Interview OS).",
        "Top section: title + 2-line summary + skills grouped (Languages, Data, Cloud).",
        "LinkedIn: headline with target role + stack, 'Open to work' (recruiters only), about section with impact, skills endorsed.",
        "Channels by effectiveness: <b>referrals</b> &gt; recruiters reaching out &gt; direct applications; track a pipeline (Applications board).",
        "Apply in batches so offers land close together (negotiation leverage).",
      ],
      detail: `
<h2>Bullet makeover</h2>
<table>
<tr><th>Weak</th><th>Strong</th></tr>
<tr><td>Worked on Kafka pipelines.</td><td>Built a Kafka → Flink streaming pipeline processing 2M events/min, cutting alert latency from 15 min to &lt;10 s.</td></tr>
<tr><td>Responsible for database performance.</td><td>Reduced p99 API latency 70% (800 → 240 ms) by redesigning Postgres indexes and eliminating N+1 queries across 12 endpoints.</td></tr>
<tr><td>Helped migrate to cloud.</td><td>Led migration of 30 services to EKS with Terraform and GitOps, enabling 20 deploys/day and saving $180k/year.</td></tr>
</table>

<h2>Referral message template</h2>
<pre><code>Hi [Name] — I'm a [role] with [N] years in [domain] (Kafka/Flink, Java). I'm applying for [Job title + link] on your team.
I've [one relevant achievement]. Would you be open to referring me? Happy to send my resume and a 3-line summary. Thanks!</code></pre>

<h2>Weekly job-search cadence</h2>
<ul><li>10–15 targeted applications, 5 referral asks, 3 recruiter conversations.</li><li>Keep every company in the pipeline with next steps and dates.</li><li>Parallelize loops so offers arrive within 1–2 weeks of each other.</li></ul>`,
      pitfalls: ["Responsibilities instead of results.", "Keyword stuffing with skills you can't discuss.", "Fancy multi-column templates that ATS can't parse.", "Only applying through job portals."],
      interviewQs: ["Walk me through the most impactful item on your resume.", "Which of these technologies are you strongest in?"],
      resources: [
        { t: "Tech Interview Handbook — Resume", u: "https://www.techinterviewhandbook.org/resume/", k: "article" },
        { t: "Google careers — How we hire (resume tips)", u: "https://www.google.com/about/careers/applications/how-we-hire/", k: "article" },
      ],
    },
    {
      id: "career-senior-signals",
      title: "Senior/Staff Signals: Communication, Leadership & Design Discussions",
      summary: "What separates mid-level from senior and staff candidates in every round — scope, trade-off reasoning, influence and how you run the conversation.",
      tags: ["career", "leveling", "system-design"],
      brushup: [
        "Seniority is judged by <b>scope</b> (team → multiple teams → org), <b>ambiguity</b> handled, and <b>impact</b> — not years.",
        "In coding: clarify, reason aloud, write clean code, test, discuss complexity and alternatives unprompted.",
        "In design: drive the conversation, make and justify decisions, quantify, discuss failure modes, operations and cost, know when 'good enough' wins.",
        "In behavioral: stories about influencing without authority, mentoring, cross-team alignment, technical strategy, handling conflict and failure.",
        "Staff signals: setting technical direction, multi-quarter initiatives, raising the bar for others, writing design docs that change decisions.",
        "Say 'it depends' and then say on what — and pick.",
      ],
      detail: `
<h2>Level expectations (typical)</h2>
<table>
<tr><th></th><th>Mid (SDE II)</th><th>Senior</th><th>Staff</th></tr>
<tr><td>Scope</td><td>Features, own service</td><td>Team's systems, projects across a few teams</td><td>Org-wide problems, multi-team strategy</td></tr>
<tr><td>Ambiguity</td><td>Well-defined tasks</td><td>Defines the solution</td><td>Defines the problem</td></tr>
<tr><td>Design interview</td><td>Reasonable components</td><td>Drives, deep dives, trade-offs, ops</td><td>Frames business context, evolution, org impact</td></tr>
<tr><td>Influence</td><td>Own work</td><td>Team, mentoring</td><td>Multiple teams, leadership</td></tr>
</table>

<h2>Phrases that show judgement</h2>
<ul>
<li>"Given 10k writes/s, a single Postgres primary is fine for now; I'd shard by tenant when we pass ~50k, and here's how we'd migrate."</li>
<li>"We could use exactly-once transactions, but an idempotent upsert is simpler and gives the same outcome here."</li>
<li>"The riskiest part is X, so I'd prototype it first and add a kill switch."</li>
</ul>`,
      pitfalls: ["Listing technologies without reasons.", "Waiting for the interviewer to drive the design.", "Stories where the team did everything and your role is unclear."],
      interviewQs: ["Tell me about a technical decision you drove across teams.", "How do you mentor engineers?", "Describe a time you changed your team's technical direction."],
      resources: [
        { t: "StaffEng — stories and guides", u: "https://staffeng.com/", k: "article" },
        { t: "The Staff Engineer's Path — Tanya Reilly", u: "https://www.oreilly.com/library/view/the-staff-engineers/9781098118723/", k: "book" },
      ],
    },
    {
      id: "career-interview-day",
      title: "Interview Day Playbook: Coding Round, Design Round, Nerves",
      summary: "A minute-by-minute approach for live coding and design rounds, plus what to do when you're stuck, and how to handle nerves and remote setups.",
      tags: ["career", "strategy", "must-know"],
      brushup: [
        "Coding round (45 min): clarify 3–5 min → examples & edge cases → brute force → optimize → code 15–20 min → test with examples → complexity.",
        "Think out loud; interviewers score communication and problem solving as much as the final code.",
        "Stuck? Restate the problem, try small examples, think of patterns (two pointers, hash map, BFS, DP), ask for a hint — hints cost less than silence.",
        "Design round: requirements (5) → estimates (3) → API (3) → high-level (10) → deep dive (15) → wrap-up/trade-offs (5).",
        "Remote: test audio/video, have a whiteboard tool ready (Excalidraw), quiet room, water, notes with your stories.",
        "After each round, reset — one bad round rarely sinks a loop.",
        "Send a short thank-you note; debrief yourself (what to practise next).",
      ],
      detail: `
<h2>Coding round script</h2>
<ol>
<li>"Let me restate the problem…" — confirm input/output types, constraints (n up to?), duplicates, negatives, empty input.</li>
<li>Walk a small example by hand.</li>
<li>"A brute force would be O(n²) by…; we can do better with a hash map because…"</li>
<li>Get agreement, then code with meaningful names; talk while coding.</li>
<li>Dry-run your code on the example and an edge case; fix bugs calmly.</li>
<li>State time and space complexity; mention further optimizations.</li>
</ol>

<h2>When you're stuck</h2>
<ul><li>Is there a sorted order to exploit? (binary search, two pointers)</li><li>Can a hash map remember something? (complements, counts)</li><li>Is it a graph/tree traversal in disguise? (BFS/DFS)</li><li>Does the answer depend on sub-answers? (DP)</li><li>Can a heap keep the best K?</li></ul>

<h2>Managing nerves</h2>
<ul><li>Mock interviews out loud (Interview OS mock room) until the format feels familiar.</li><li>Slow breathing before the call; it's fine to pause and think for 20 seconds.</li><li>Treat the interviewer as a collaborator — ask questions.</li></ul>`,
      pitfalls: ["Jumping into code before clarifying.", "Silence while thinking.", "Not testing the code.", "Letting one bad round affect the next."],
      interviewQs: ["(Any coding or design question — this is about process.)"],
      resources: [
        { t: "Tech Interview Handbook — Coding interview cheatsheet", u: "https://www.techinterviewhandbook.org/coding-interview-cheatsheet/", k: "article" },
        { t: "interviewing.io — mock interviews with engineers", u: "https://interviewing.io/", k: "practice" },
        { t: "Exponent — mock interviews & peer practice", u: "https://www.tryexponent.com/", k: "practice" },
      ],
    },
  );
})();
