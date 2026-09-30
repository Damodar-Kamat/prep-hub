/* Engineering Leadership — what a tech lead / lead engineer is expected to know beyond code. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "leadership",
  title: "Engineering Leadership",
  icon: "🧑‍✈️",
  blurb: "The lead engineer's toolkit: the role itself, design docs & ADRs, planning & estimation, code review, mentoring, hiring, tech debt & migrations, incidents, stakeholder communication, metrics, build-vs-buy and prioritization.",
  topics: [
    {
      id: "lead-role",
      title: "The Tech Lead Role: Responsibilities, Balance & Career Paths",
      summary: "What a tech lead actually owns, how it differs from an engineering manager or staff engineer, and how to balance hands-on work with leading.",
      tags: ["leadership", "must-know"],
      brushup: [
        "A tech lead owns the <b>technical outcome</b> of a team: direction, quality, delivery risk, and how the team works — not just their own tickets.",
        "Typical split: 30–60% hands-on (often the critical or unblocking work), the rest design, reviews, planning, mentoring, cross-team alignment.",
        "<b>Tech lead vs EM</b>: TL owns 'how we build it' and technical health; EM owns people (performance, careers, hiring, team health). They must be tight partners.",
        "<b>Staff engineer</b> archetypes (Will Larson): tech lead, architect, solver, right hand — scope beyond one team.",
        "Your output = the team's output. Unblocking two engineers beats writing one more feature yourself.",
        "Avoid the 'hero' trap: taking all hard tasks creates a bus factor and stunts others' growth.",
        "Protect focus time for the team; say no to low-value work; make decisions explicit and written.",
        "Leading without authority: build trust through competence, consistency, listening and giving credit.",
      ],
      detail: `
<h2>What you own as a tech lead</h2>
<table>
<tr><th>Area</th><th>Concretely</th></tr>
<tr><td>Technical direction</td><td>Architecture, design reviews, tech choices, a 6–12 month technical vision for the team's systems</td></tr>
<tr><td>Delivery</td><td>Breaking down projects, sequencing, identifying risks early, keeping scope honest</td></tr>
<tr><td>Quality & operations</td><td>Standards, reviews, testing strategy, on-call health, incident follow-ups</td></tr>
<tr><td>People (with the EM)</td><td>Mentoring, delegating stretch work, feedback on technical growth</td></tr>
<tr><td>Communication</td><td>Status, trade-offs and decisions to product, stakeholders and other teams</td></tr>
</table>

<h2>A lead's week (example)</h2>
<ul>
<li>Mon: planning/refinement, unblock tickets, 1:1 pairing with a junior engineer.</li>
<li>Tue–Wed: deep work on the riskiest technical piece; design review for another team's RFC.</li>
<li>Thu: code reviews in focused blocks, architecture discussion, sync with product on scope trade-offs.</li>
<li>Fri: write/update design doc or ADR, check metrics/on-call, demo, retro actions.</li>
</ul>

<h2>Common failure modes</h2>
<ul>
<li><b>Bottleneck</b>: every decision and review goes through you → delegate ownership of components.</li>
<li><b>Ivory tower</b>: designs without coding → lose context and credibility; stay hands-on in critical paths.</li>
<li><b>Silent risk</b>: knowing the project will slip and not saying it early.</li>
<li><b>Consensus paralysis</b>: when disagreement persists, decide (disagree and commit) and document why.</li>
</ul>

<h2>Answering "what does a tech lead do?" in interviews</h2>
<p>"I own the technical outcome of the team — I set direction for our systems, make sure we deliver the right thing safely, keep quality and operations healthy, and grow the engineers around me. I still code, but I pick the work that unblocks the most people or carries the most risk."</p>`,
      pitfalls: ["Measuring yourself by personal commits.", "Keeping all critical knowledge in your head.", "Avoiding conflict and letting technical disagreements fester.", "Over-committing the team to please stakeholders."],
      interviewQs: ["What does a tech lead do in your view?", "How do you balance coding with leading?", "How do you lead without formal authority?", "Tell me about a time you had to make an unpopular technical decision."],
      resources: [
        { t: "The Staff Engineer's Path — Tanya Reilly", u: "https://www.oreilly.com/library/view/the-staff-engineers/9781098118723/", k: "book" },
        { t: "StaffEng — archetypes & stories", u: "https://staffeng.com/guides/staff-archetypes/", k: "article" },
        { t: "The Manager's Path — Camille Fournier", u: "https://www.oreilly.com/library/view/the-managers-path/9781491973882/", k: "book" },
      ],
    },
    {
      id: "lead-design-docs",
      title: "Design Docs, RFCs & Architecture Decision Records",
      summary: "Writing the documents that align teams before code is written — structure, review process, and lightweight ADRs that preserve the 'why'.",
      tags: ["leadership", "writing", "architecture"],
      brushup: [
        "A design doc makes a decision reviewable before it's expensive to change: context, goals/non-goals, proposal, alternatives, trade-offs, risks.",
        "<b>Non-goals</b> prevent scope creep and endless debate.",
        "Always include <b>alternatives considered</b> and why they were rejected — reviewers will ask.",
        "Cover operations: rollout plan, migration, monitoring, failure modes, cost, security/privacy.",
        "Review process: circulate async, collect comments, hold a focused review meeting for open questions, record the decision.",
        "<b>ADR</b> (Architecture Decision Record): one short file per significant decision — context, decision, consequences — kept in the repo.",
        "Length follows risk: a 1-page doc for a small change, 6–10 pages for a new system.",
        "Write for the reader: summary first, diagrams, concrete numbers.",
      ],
      detail: `
<h2>Design doc template</h2>
<pre><code># Title  (author, reviewers, status: draft | in review | approved | superseded, date)
## Summary            — 3–5 sentences: problem, proposal, impact
## Context & problem  — what's broken or needed, with data
## Goals / Non-goals
## Proposal           — architecture diagram, components, APIs, data model
## Alternatives       — option B, option C, why not
## Trade-offs & risks — what we give up, what could go wrong, mitigations
## Rollout & migration — phases, feature flags, backfill, rollback plan
## Operations         — SLOs, monitoring, alerting, on-call impact, capacity & cost
## Security & privacy — data classification, access, threat model
## Open questions
## Timeline & milestones</code></pre>

<h2>ADR example</h2>
<pre><code># ADR-014: Use Apache Flink for real-time aggregation
Status: Accepted (2026-09-12)
Context: Alert latency is 15 min with hourly Spark batches; product needs &lt; 30 s. State per device ~2 KB × 5M devices.
Decision: Adopt Flink on Kubernetes (operator), RocksDB state backend, exactly-once to Kafka.
Alternatives: Kafka Streams (simpler, but our joins span 3 topics and need large state); Spark Structured Streaming (latency ~seconds, OK, but team has Flink experience).
Consequences: +1 platform to operate; need savepoint discipline for upgrades; enables sub-10 s alerts.</code></pre>

<h2>Running a good review</h2>
<ul>
<li>Name the decision you need and a deadline.</li>
<li>Invite the right reviewers (owners of affected systems, security, SRE), not everyone.</li>
<li>Resolve comments in writing; escalate only genuine disagreements.</li>
<li>After launch, update the doc with what changed — or write a retrospective.</li>
</ul>`,
      pitfalls: ["Docs written after the code to justify it.", "No alternatives section.", "Walls of text without diagrams or numbers.", "Decisions made in meetings but never recorded."],
      interviewQs: ["How do you document architectural decisions?", "Walk me through a design doc you wrote.", "How do you handle strong disagreement during a design review?"],
      resources: [
        { t: "Design Docs at Google — Malte Ubl", u: "https://www.industrialempathy.com/posts/design-docs-at-google/", k: "article" },
        { t: "ADR GitHub organization (templates)", u: "https://adr.github.io/", k: "docs" },
        { t: "Documenting architecture decisions — Michael Nygard", u: "https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions", k: "article" },
      ],
    },
    {
      id: "lead-planning",
      title: "Estimation, Planning & Project Execution",
      summary: "Turning an ambiguous initiative into a plan that ships: decomposition, estimation, milestones, risk management and keeping scope honest.",
      tags: ["leadership", "execution", "must-know"],
      brushup: [
        "Decompose until tasks are ≤ 2–3 days; the unknowns you discover while decomposing are the real value.",
        "Estimate in ranges with confidence levels; call out assumptions. Add buffer for integration, testing, reviews, on-call.",
        "<b>De-risk first</b>: spike the scariest unknown (new tech, perf, integration) in week 1.",
        "Milestones that deliver <b>user-visible value</b> or verifiable progress (thin vertical slices), not 'backend done'.",
        "Identify the <b>critical path</b> and dependencies on other teams early; get commitments in writing.",
        "Track weekly: planned vs actual, risks, decisions needed. Communicate slips as soon as you know, with options.",
        "Levers when late: cut scope, add time, change approach — adding people late rarely helps (Brooks' law).",
        "Definition of done includes tests, docs, monitoring, rollout and cleanup.",
      ],
      detail: `
<h2>From idea to plan</h2>
<ol>
<li><b>Clarify the outcome</b>: what metric moves, what does success look like, what's the deadline and why?</li>
<li><b>Shape the solution</b>: design doc, main components, unknowns.</li>
<li><b>Break down</b>: milestones → epics → tasks; mark dependencies and owners.</li>
<li><b>Estimate</b>: ranges (best/likely/worst); sum per milestone; add explicit buffer (20–30%).</li>
<li><b>Sequence</b>: risky and blocking work first; parallelize along independent streams.</li>
<li><b>Communicate</b>: plan, assumptions, risks, what stakeholders must provide.</li>
</ol>

<h2>Weekly status format (for stakeholders)</h2>
<pre><code>Project: Streaming alerts v1          Status: 🟡 at risk (was 🟢)
Done this week: Flink job in staging; schema registry integration
Next week: load test at 2× peak; on-call runbook
Risks: Kafka partition increase needs platform team (ETA unknown) → asked for date by Wed; fallback: keep 24 partitions, accept +2 s latency
Decisions needed: drop per-user alert throttling from v1? (saves ~1 week)
Target: Oct 28 (unchanged if decision by Friday)</code></pre>

<h2>Estimation techniques</h2>
<ul>
<li>Compare with similar past work (reference class), not wishful thinking.</li>
<li>Three-point estimate: (optimistic + 4·likely + pessimistic) / 6.</li>
<li>Time-box research spikes; re-estimate after.</li>
<li>Track actuals to calibrate the team over time.</li>
</ul>`,
      pitfalls: ["Single-point estimates presented as promises.", "Leaving integration and testing to the end.", "Hiding delays until the deadline.", "Milestones that can't be demoed or verified."],
      interviewQs: ["How do you estimate a project with many unknowns?", "Tell me about a project that slipped — what did you do?", "How do you manage dependencies on other teams?", "How do you decide what to cut when you're behind?"],
      resources: [
        { t: "Shape Up — Basecamp (free book)", u: "https://basecamp.com/shapeup", k: "book" },
        { t: "The Mythical Man-Month — Fred Brooks", u: "https://en.wikipedia.org/wiki/The_Mythical_Man-Month", k: "book" },
        { t: "Software Estimation — Steve McConnell", u: "https://www.microsoftpressstore.com/store/software-estimation-demystifying-the-black-art-9780735605350", k: "book" },
      ],
    },
    {
      id: "lead-code-review",
      title: "Code Review & Engineering Standards",
      summary: "Running reviews that improve code and people without slowing the team — what to look for, how to comment, and which standards to automate.",
      tags: ["leadership", "quality"],
      brushup: [
        "Review for: correctness, design/fit, readability, tests, security, performance hot spots, operability (logs/metrics), backward compatibility.",
        "Automate the trivial: formatting, linting, static analysis, dependency and secret scanning — humans focus on design and logic.",
        "Small PRs (&lt; ~400 lines) get better, faster reviews; stack changes when needed.",
        "Turnaround matters: aim for first response within a few working hours.",
        "Comment style: explain why, ask questions, label severity (nit / suggestion / blocking), praise good work.",
        "Author responsibility: context in the description, self-review first, tests included, screenshots for UI.",
        "Standards live in writing: style guides, a PR checklist, 'golden path' templates.",
        "Reviews are also mentoring and knowledge-sharing — rotate reviewers to spread ownership.",
      ],
      detail: `
<h2>Review checklist</h2>
<ul>
<li><b>Does it do the right thing?</b> Requirements, edge cases, error handling, concurrency.</li>
<li><b>Is it the right design?</b> Fits architecture, right layer, no unnecessary abstraction, minimal public surface.</li>
<li><b>Is it tested?</b> Meaningful tests at the right level; failure cases covered.</li>
<li><b>Can we run it?</b> Logging, metrics, feature flag, config, migration safety, rollback.</li>
<li><b>Is it safe?</b> Input validation, authz checks, secrets, PII handling, injection.</li>
<li><b>Can others read it?</b> Names, comments where intent isn't obvious, consistent style.</li>
</ul>

<h2>Comment examples</h2>
<table>
<tr><th>Less helpful</th><th>Better</th></tr>
<tr><td>"This is wrong."</td><td>"blocking: if <code>items</code> is empty, <code>items[0]</code> throws — can we return early?"</td></tr>
<tr><td>"Use a map."</td><td>"suggestion: a Map keyed by id would make this lookup O(1); this runs per request."</td></tr>
<tr><td>"Rename."</td><td>"nit: <code>data2</code> → <code>pendingOrders</code>? Makes the next block read more clearly."</td></tr>
</table>

<h2>Google's standard</h2>
<p>Approve once the change <b>definitely improves the overall code health</b>, even if it isn't perfect. Perfection blocks progress; continuous improvement compounds.</p>`,
      pitfalls: ["Gatekeeping on personal style preferences.", "Rubber-stamp approvals of large PRs.", "Days-long review latency.", "Debating formatting that a tool could enforce."],
      interviewQs: ["What do you look for in a code review?", "How do you handle disagreements in reviews?", "How do you keep review quality high without slowing down?"],
      resources: [
        { t: "Google Engineering Practices — Code review", u: "https://google.github.io/eng-practices/review/", k: "docs" },
        { t: "Conventional Comments", u: "https://conventionalcomments.org/", k: "article" },
      ],
    },
    {
      id: "lead-mentoring",
      title: "Mentoring, Delegation & Feedback",
      summary: "Growing the engineers around you — delegating real ownership, giving feedback that lands, and tailoring support to experience level.",
      tags: ["leadership", "people"],
      brushup: [
        "Delegate <b>outcomes</b>, not tasks: 'own the rate limiter end to end' beats 'write this class'.",
        "Match support to the person: <b>directing</b> for new people, <b>coaching</b> for developing, <b>supporting</b>/<b>delegating</b> for experienced (situational leadership).",
        "Feedback: timely, specific, behaviour-focused — <b>SBI</b> (Situation, Behaviour, Impact). Praise in public, correct in private.",
        "Ask more than you tell: 'What options did you consider?' builds judgement.",
        "Stretch assignments with a safety net: pair on the first design review, then step back.",
        "Make growth visible: help them write design docs, present demos, lead incidents.",
        "Regular 1:1s or pairing sessions; track goals together.",
        "Sponsorship: put their name forward for visible work — not just advice.",
      ],
      detail: `
<h2>SBI feedback examples</h2>
<ul>
<li><b>Positive</b>: "In yesterday's incident (S), you posted clear 10-minute updates with impact and next steps (B) — support could answer customers without pinging us (I). Please keep doing that."</li>
<li><b>Constructive</b>: "In the design review (S), you dismissed the caching concern without data (B); the reviewer disengaged and we may have missed a real issue (I). Next time, could you ask for the numbers or propose a quick test?"</li>
</ul>

<h2>Delegation ladder</h2>
<ol>
<li>I do it, you watch.</li><li>We do it together.</li><li>You do it, I review closely.</li><li>You do it, I'm available.</li><li>You own it and teach others.</li>
</ol>

<h2>Growing different levels</h2>
<table>
<tr><th>Level</th><th>Focus</th></tr>
<tr><td>Junior</td><td>Well-scoped tasks, fast feedback loops, pairing, code review teaching</td></tr>
<tr><td>Mid</td><td>Own features end to end, write small design docs, handle on-call</td></tr>
<tr><td>Senior</td><td>Own systems and projects, lead designs, mentor others, cross-team work</td></tr>
</table>`,
      pitfalls: ["Delegating only boring work.", "Rescuing people at the first sign of struggle.", "Feedback saved up for performance reviews.", "One-size-fits-all mentoring."],
      interviewQs: ["Tell me about someone you mentored and how they grew.", "How do you give difficult feedback?", "How do you decide what to delegate?", "How do you handle an underperforming teammate?"],
      resources: [
        { t: "Radical Candor — Kim Scott", u: "https://www.radicalcandor.com/", k: "book" },
        { t: "Center for Creative Leadership — SBI feedback model", u: "https://www.ccl.org/articles/leading-effectively-articles/closing-the-gap-between-intent-vs-impact-sbii/", k: "article" },
      ],
    },
    {
      id: "lead-hiring",
      title: "Hiring & Interviewing Engineers",
      summary: "Designing fair, predictive interview loops, writing rubrics, conducting interviews well and making calibrated hiring decisions.",
      tags: ["leadership", "hiring"],
      brushup: [
        "Define the role first: level, must-have vs nice-to-have skills, what success looks like in 6 months.",
        "Structured interviews with <b>consistent questions and rubrics</b> are far more predictive than unstructured chats.",
        "Each interview tests specific signals (coding, design, collaboration, ownership) — no duplicated coverage.",
        "Write feedback independently before the debrief to avoid anchoring; focus on evidence, not vibes.",
        "Be a good interviewer: explain the format, let candidates think, give hints consistently, leave time for their questions.",
        "Reduce bias: diverse panels, blind resume screening where possible, avoid 'culture fit' as a veto — look for values/'culture add'.",
        "Candidate experience matters: fast scheduling, clear communication, timely decisions.",
      ],
      detail: `
<h2>Sample rubric (coding round)</h2>
<table>
<tr><th>Signal</th><th>Strong</th><th>Weak</th></tr>
<tr><td>Problem solving</td><td>Clarifies, brute force → optimal, reasons about complexity</td><td>Jumps to code, stuck without progress</td></tr>
<tr><td>Coding</td><td>Clean, correct, idiomatic; tests own code</td><td>Buggy, hard to follow</td></tr>
<tr><td>Communication</td><td>Explains thinking, takes hints well</td><td>Silent or defensive</td></tr>
</table>

<h2>Debrief discipline</h2>
<ul>
<li>Everyone submits a written decision (strong hire → strong no hire) with evidence before discussing.</li>
<li>Discuss mixed signals: is a gap trainable? is it level-relevant?</li>
<li>The bar is the same for every candidate at a level.</li>
</ul>`,
      pitfalls: ["Asking trivia instead of job-relevant problems.", "Changing questions per candidate.", "Group-think debriefs.", "'Would I have a beer with them' as a criterion."],
      interviewQs: ["How would you design an interview loop for a senior backend engineer?", "What makes a good interviewer?", "How do you reduce bias in hiring?"],
      resources: [
        { t: "Google re:Work — Use structured interviewing", u: "https://rework.withgoogle.com/print/guides/5770012979658752/", k: "article" },
        { t: "Who: The A Method for Hiring", u: "https://whothebook.com/", k: "book" },
      ],
    },
    {
      id: "lead-tech-debt",
      title: "Technical Debt, Migrations & Legacy Modernization",
      summary: "Deciding which debt to pay, making the business case, and migrating live systems safely with patterns like strangler fig and parallel runs.",
      tags: ["leadership", "architecture", "migrations"],
      brushup: [
        "Debt is a trade-off, not a sin — track it, quantify its cost (incidents, slow delivery, on-call load), and pay down what blocks strategy.",
        "Make the case in business terms: 'this costs ~2 engineer-days per feature and caused 3 incidents last quarter'.",
        "Budget continuously (e.g. 15–20% of capacity) instead of begging for a 'refactoring quarter'.",
        "<b>Strangler fig</b>: route traffic through a facade; move functionality to the new system piece by piece; retire the old one.",
        "Migration safety: dual writes/reads, <b>shadow traffic</b>, <b>parallel runs with diffing</b>, feature flags, incremental cutover, easy rollback.",
        "Data migrations: backfill in batches, verify with checksums/row counts, keep both sides in sync via CDC until cutover.",
        "Finish migrations — two half-migrated systems are worse than one old one. Track % migrated publicly.",
      ],
      detail: `
<h2>Classifying debt (Fowler's quadrant)</h2>
<table>
<tr><th></th><th>Reckless</th><th>Prudent</th></tr>
<tr><td>Deliberate</td><td>"We don't have time for design"</td><td>"Ship now, refactor after launch" (tracked)</td></tr>
<tr><td>Inadvertent</td><td>"What's layering?"</td><td>"Now we know how we should have done it"</td></tr>
</table>

<h2>Strangler fig migration plan</h2>
<ol>
<li>Put a routing layer (API gateway/proxy) in front of the legacy system.</li>
<li>Pick a thin, low-risk slice; build it in the new system.</li>
<li>Shadow traffic: send copies of requests to the new system and diff responses.</li>
<li>Gradually route real traffic (1% → 10% → 100%) behind a flag; monitor.</li>
<li>Repeat per slice; delete legacy code and data at the end.</li>
</ol>

<h2>Prioritizing debt</h2>
<pre><code>priority ≈ (pain per week × weeks remaining in the system's life) / effort
Pain: incidents, on-call pages, slowed features, onboarding time, security/compliance risk</code></pre>`,
      pitfalls: ["Big-bang rewrites.", "Refactoring without tests.", "Migrations abandoned at 80%.", "Debt discussions without data."],
      interviewQs: ["How do you decide when to pay down tech debt?", "Describe a migration you led.", "How do you migrate a live system without downtime?", "Rewrite or refactor?"],
      resources: [
        { t: "Martin Fowler — Strangler Fig Application", u: "https://martinfowler.com/bliki/StranglerFigApplication.html", k: "article" },
        { t: "Martin Fowler — Technical Debt Quadrant", u: "https://martinfowler.com/bliki/TechnicalDebtQuadrant.html", k: "article" },
        { t: "Working Effectively with Legacy Code — Michael Feathers", u: "https://www.oreilly.com/library/view/working-effectively-with/0131177052/", k: "book" },
      ],
    },
    {
      id: "lead-incidents",
      title: "Incident Leadership, On-Call Health & Operational Excellence",
      summary: "Leading through production incidents, running blameless postmortems, and keeping on-call sustainable.",
      tags: ["leadership", "sre", "operations"],
      brushup: [
        "Roles: <b>incident commander</b> (coordinates, decides), ops/tech lead (investigates, mitigates), communications lead (status updates), scribe.",
        "Priority order: <b>mitigate first</b> (rollback, failover, flag off, shed load) → then root cause.",
        "Communicate on a cadence (every 15–30 min) with impact, current actions, next update time.",
        "Severity levels with clear criteria and escalation paths.",
        "<b>Blameless postmortems</b>: timeline, impact, contributing factors (5 whys / systems thinking), what went well, action items with owners and dates.",
        "On-call health: pages per shift, off-hours pages, toil; every page must be actionable; fix the top recurring alerts.",
        "Operational readiness reviews before launch: SLOs, dashboards, alerts, runbooks, capacity, rollback.",
      ],
      detail: `
<h2>Incident timeline template</h2>
<pre><code>14:02 Alert: checkout error rate 12% (SLO burn 20×)
14:05 IC declared SEV-2, #inc-checkout opened, status page updated
14:11 Correlated with deploy v2.41 at 13:58 → rollback started
14:19 Error rate back to 0.2%; monitoring
14:40 Resolved. Impact: 21 min, ~3,100 failed checkouts
Follow-ups: canary analysis missed error spike (threshold too high); add contract test for payment API change</code></pre>

<h2>Postmortem questions</h2>
<ul>
<li>How did we detect it — could we have detected it sooner?</li>
<li>What made mitigation fast or slow?</li>
<li>Which safeguards should have caught it (tests, canary, review)?</li>
<li>Is this a class of problem we'll see again?</li>
</ul>

<h2>On-call metrics</h2>
<table>
<tr><th>Metric</th><th>Healthy</th></tr>
<tr><td>Pages per week per rotation</td><td>≤ 2 (Google SRE aims for few incidents per shift)</td></tr>
<tr><td>Off-hours pages</td><td>Rare; review each</td></tr>
<tr><td>Actionable alerts</td><td>~100%</td></tr>
<tr><td>Toil</td><td>&lt; 50% of SRE time</td></tr>
</table>`,
      pitfalls: ["Debugging root cause while customers are still impacted.", "Postmortems naming individuals.", "Action items with no owner or date.", "Tolerating noisy alerts."],
      interviewQs: ["Walk me through a major incident you handled.", "How do you run a postmortem?", "How do you reduce on-call burden?", "What should be in place before launching a new service?"],
      resources: [
        { t: "Google SRE book — Managing incidents", u: "https://sre.google/sre-book/managing-incidents/", k: "book" },
        { t: "Google SRE book — Postmortem culture", u: "https://sre.google/sre-book/postmortem-culture/", k: "book" },
        { t: "PagerDuty incident response guide", u: "https://response.pagerduty.com/", k: "docs" },
      ],
    },
    {
      id: "lead-stakeholders",
      title: "Stakeholder Management, Communication & Influence",
      summary: "Working with product, leadership and other teams — writing for executives, negotiating scope, saying no well, and building alignment.",
      tags: ["leadership", "communication", "must-know"],
      brushup: [
        "Know your stakeholders: what they care about (revenue, deadlines, risk, customers) and how they like to receive information.",
        "<b>Bottom line up front</b> (BLUF): decision or ask first, details after.",
        "Translate technical trade-offs into business impact: time, money, risk, customer experience.",
        "Say no by offering options: 'We can do A by the 15th, or A+B by the 30th — which matters more?'",
        "Pre-wire important decisions with key people 1:1 before big meetings.",
        "Disagree openly and early with data; once decided, commit fully.",
        "Over-communicate status and risk; surprises destroy trust faster than bad news.",
        "Build relationships before you need them — help other teams, credit others.",
      ],
      detail: `
<h2>Writing for executives</h2>
<pre><code>Subject: Decision needed by Fri — streaming alerts scope
Ask: Approve dropping per-user throttling from v1 (saves 1 week, keeps Oct 28 date).
Why: Platform dependency slipped 5 days; throttling affects &lt;2% of users (data link).
Options: (A) drop throttling from v1 — recommended; (B) move date to Nov 4; (C) add 1 engineer — risky, ramp-up time.
Risk if no decision: date slips by default.</code></pre>

<h2>Influence without authority</h2>
<ul>
<li>Start from their goals; show how your proposal serves them.</li>
<li>Bring data and a prototype, not just opinions.</li>
<li>Find allies early; address objections privately first.</li>
<li>Make it easy to say yes: small, reversible first step.</li>
</ul>

<h2>Handling conflict with product</h2>
<p>Separate the <b>problem</b> (what users need, by when) from the <b>solution</b>. Offer technical alternatives that meet the need with less risk; make trade-offs explicit and let the right owner decide.</p>`,
      pitfalls: ["Leading with technical detail to non-technical audiences.", "Saying yes to everything, then missing dates.", "Escalating before talking directly.", "Bad news delivered late."],
      interviewQs: ["Tell me about a time you pushed back on a product requirement.", "How do you communicate a delay to leadership?", "How do you get buy-in for a technical initiative?", "Tell me about a conflict with another team."],
      resources: [
        { t: "Crucial Conversations", u: "https://cruciallearning.com/crucial-conversations-book/", k: "book" },
        { t: "The Pyramid Principle — Barbara Minto (structured writing)", u: "https://www.barbaraminto.com/", k: "book" },
      ],
    },
    {
      id: "lead-metrics",
      title: "Engineering Metrics & Team Health (DORA, SPACE)",
      summary: "Measuring delivery and team health without gaming — DORA's four keys, the SPACE framework, and how to use metrics to improve rather than judge.",
      tags: ["leadership", "metrics"],
      brushup: [
        "<b>DORA four keys</b>: deployment frequency, lead time for changes, change failure rate, time to restore service (plus reliability).",
        "<b>SPACE</b>: Satisfaction, Performance, Activity, Communication & collaboration, Efficiency & flow — use several dimensions, never one number.",
        "Goodhart's law: when a measure becomes a target, it ceases to be a good measure — never rank individuals by commits/story points.",
        "Use metrics to find bottlenecks (review wait time, CI duration, flaky tests, deploy friction).",
        "Pair quantitative data with developer surveys and retros.",
        "Product/business metrics connect engineering work to outcomes (adoption, latency, conversion, cost).",
      ],
      detail: `
<h2>DORA benchmarks (elite performers, typical)</h2>
<table>
<tr><th>Metric</th><th>Elite</th><th>Low</th></tr>
<tr><td>Deployment frequency</td><td>On demand, multiple per day</td><td>Monthly or less</td></tr>
<tr><td>Lead time for changes</td><td>&lt; 1 day</td><td>&gt; 1 month</td></tr>
<tr><td>Change failure rate</td><td>~0–15%</td><td>&gt; 45%</td></tr>
<tr><td>Time to restore</td><td>&lt; 1 hour</td><td>&gt; 1 week</td></tr>
</table>

<h2>Flow bottlenecks to measure</h2>
<ul><li>PR time to first review and to merge.</li><li>CI pipeline duration and flakiness rate.</li><li>Time from merge to production.</li><li>Work in progress per engineer; context switching.</li></ul>`,
      pitfalls: ["Individual productivity leaderboards.", "Story points as a performance metric.", "Measuring only speed and ignoring quality/sustainability."],
      interviewQs: ["How do you measure your team's effectiveness?", "What are the DORA metrics?", "How would you improve a team's delivery speed?"],
      resources: [
        { t: "DORA research", u: "https://dora.dev/", k: "docs" },
        { t: "The SPACE of Developer Productivity (ACM Queue)", u: "https://queue.acm.org/detail.cfm?id=3454124", k: "paper" },
      ],
    },
    {
      id: "lead-build-vs-buy",
      title: "Technology Selection & Build vs Buy",
      summary: "Choosing technologies and vendors deliberately — evaluation criteria, total cost of ownership, proofs of concept and avoiding résumé-driven development.",
      tags: ["leadership", "architecture", "decision-making"],
      brushup: [
        "Default to <b>boring technology</b>: proven tools the team knows; spend 'innovation tokens' only where it differentiates.",
        "Build when it's core to your competitive advantage or nothing fits; buy/use managed for commodity capabilities (auth, payments, observability, email).",
        "Total cost of ownership: licences + infrastructure + engineering time to build, operate, upgrade, secure, and hire for.",
        "Evaluation matrix with weighted criteria: fit to requirements, scalability, operability, security/compliance, ecosystem, team skills, cost, vendor viability, exit/lock-in.",
        "Run a time-boxed proof of concept against real workloads before committing.",
        "Plan the exit: data export, abstraction boundaries, contract terms.",
        "Record the decision (ADR) including what would make you revisit it.",
      ],
      detail: `
<h2>Weighted evaluation example</h2>
<table>
<tr><th>Criterion (weight)</th><th>Kafka (self-managed)</th><th>Managed Kafka</th><th>Kinesis</th></tr>
<tr><td>Throughput & replay (5)</td><td>5</td><td>5</td><td>4</td></tr>
<tr><td>Operational burden (4)</td><td>2</td><td>4</td><td>5</td></tr>
<tr><td>Ecosystem / connectors (3)</td><td>5</td><td>5</td><td>3</td></tr>
<tr><td>Cost at our scale (3)</td><td>4</td><td>3</td><td>3</td></tr>
<tr><td>Lock-in (2)</td><td>5</td><td>4</td><td>2</td></tr>
<tr><td><b>Weighted total</b></td><td>63</td><td><b>71</b></td><td>61</td></tr>
</table>

<h2>Questions to ask vendors</h2>
<ul><li>SLA and historical uptime; incident communication.</li><li>Security certifications (SOC 2, ISO 27001), data residency, encryption, SSO/SCIM.</li><li>Pricing at 10× current scale; egress costs.</li><li>Data export and termination terms; roadmap and support tiers.</li></ul>`,
      pitfalls: ["Choosing tech because it's trendy.", "Underestimating operating cost of 'free' open source.", "No exit strategy from a vendor.", "Deciding without a POC on real data."],
      interviewQs: ["How do you choose between building and buying?", "Tell me about a technology choice you'd make differently.", "How do you evaluate a new database/framework?"],
      resources: [
        { t: "Choose Boring Technology — Dan McKinley", u: "https://mcfunley.com/choose-boring-technology", k: "article" },
        { t: "Thoughtworks Technology Radar", u: "https://www.thoughtworks.com/radar", k: "article" },
      ],
    },
    {
      id: "lead-prioritization",
      title: "Prioritization, Roadmaps & OKRs",
      summary: "Deciding what the team works on — prioritization frameworks, balancing features vs platform work, and connecting work to goals.",
      tags: ["leadership", "product"],
      brushup: [
        "Prioritize by <b>impact vs effort</b>, with risk and dependencies considered; kill low-value work explicitly.",
        "RICE = Reach × Impact × Confidence / Effort — useful for comparing features.",
        "Balance the portfolio: features, reliability/tech debt, developer productivity, security — agree on rough percentages.",
        "OKRs: an ambitious objective + 2–4 measurable key results (outcomes, not outputs).",
        "Roadmaps communicate intent and sequencing, not guaranteed dates: Now / Next / Later.",
        "Protect the team from thrash: limit WIP, finish before starting, batch interrupts.",
      ],
      detail: `
<h2>RICE example</h2>
<table>
<tr><th>Item</th><th>Reach/qtr</th><th>Impact</th><th>Confidence</th><th>Effort (pw)</th><th>RICE</th></tr>
<tr><td>Real-time alerts</td><td>20k</td><td>2</td><td>80%</td><td>8</td><td>4,000</td></tr>
<tr><td>CSV export</td><td>3k</td><td>1</td><td>100%</td><td>1</td><td>3,000</td></tr>
<tr><td>New dashboard theme</td><td>50k</td><td>0.25</td><td>50%</td><td>4</td><td>1,563</td></tr>
</table>

<h2>Good vs bad key results</h2>
<ul><li>✗ "Ship streaming pipeline" (output)</li><li>✓ "Alert latency p95 from 15 min to &lt; 30 s for 95% of devices" (outcome)</li><li>✓ "Reduce on-call pages from 12/week to 3/week"</li></ul>`,
      pitfalls: ["Everything is priority 1.", "Roadmaps treated as contracts.", "No capacity reserved for reliability work.", "Output-based OKRs."],
      interviewQs: ["How do you prioritize competing requests?", "How do you balance tech debt against features?", "How do you write good OKRs?"],
      resources: [
        { t: "Intercom — RICE prioritization", u: "https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/", k: "article" },
        { t: "Measure What Matters — John Doerr", u: "https://www.whatmatters.com/", k: "book" },
      ],
    },
  ],
});
