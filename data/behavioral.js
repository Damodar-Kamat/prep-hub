/* Behavioral, career & job-switch prep. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "career",
  title: "Behavioral & Career",
  icon: "🎯",
  blurb: "STAR stories, leadership-principle style questions, negotiation, and a switch-focused prep plan for a lead engineer.",
  topics: [
    {
      id: "career-star",
      title: "STAR Method & Story Bank",
      tags: ["behavioral"],
      brushup: [
        "STAR = Situation (brief context) → Task (your responsibility) → Action (what YOU did, specifically) → Result (measurable outcome + learning).",
        "Spend ~70% on Action. Use 'I', not 'we'. Quantify results (latency −40%, incidents −60%, shipped in 3 weeks).",
        "Prepare 8–10 stories that flex to many questions: a hard bug, a conflict, a leadership moment, a failure, an ambiguous project, a mentoring win, a tech decision/tradeoff, missing a deadline, pushing back on a stakeholder, driving a cross-team effort.",
        "As a lead (3 yrs): show scope beyond code — design ownership, mentoring, unblocking others, influencing without authority.",
        "End failure stories with the concrete change you made afterwards.",
        "Keep each answer 2–3 minutes; pause for follow-ups instead of front-loading everything.",
      ],
      detail: `
<h2>Story template</h2>
<pre><code>Situation (1-2 sentences): the team/product context and why it mattered.
Task:      what you were on the hook for.
Action:    3-5 specific things you did — decisions, tradeoffs, how you brought people along.
Result:    the number, the ship, the outcome + what you learned / changed permanently.</code></pre>
<h2>Worked example — "Tell me about a hard technical problem"</h2>
<blockquote>
<b>S:</b> Our checkout API's p99 latency spiked to 4s during peak sale traffic, causing ~5% cart abandonment.<br>
<b>T:</b> I owned checkout; I had two days before the next sale event.<br>
<b>A:</b> I added tracing and found 80% of the time was in a synchronous fraud-check call. I moved the non-blocking parts of fraud scoring to an async queue, kept only a fast rules check inline, added a 200 ms timeout with a conservative fallback, and load-tested at 3× peak. I wrote a runbook and briefed the on-call.<br>
<b>R:</b> p99 dropped to 600 ms; abandonment during the next sale fell to 1.2%; we adopted "async by default for third-party calls" as a team guideline.
</blockquote>
<h2>Map questions to stories</h2>
<table>
<tr><th>Question theme</th><th>Story to use</th></tr>
<tr><td>Conflict / disagreement</td><td>pushed back on a rushed design, reached a middle path</td></tr>
<tr><td>Failure / mistake</td><td>an outage you caused; the guardrail you added</td></tr>
<tr><td>Leadership / influence</td><td>drove a migration across 3 teams without being their manager</td></tr>
<tr><td>Ambiguity</td><td>vague requirements → you framed the problem and scoped an MVP</td></tr>
<tr><td>Mentoring</td><td>leveled up a junior; delegated a risky task with a safety net</td></tr>
</table>`,
      pitfalls: [
        "Rambling context; the interviewer loses the point before you reach the Action.",
        "'We' everywhere — the interviewer can't tell what you did.",
        "No numbers. 'It got faster' vs 'p99 went 4s → 600ms'.",
        "Failure stories with no ownership ('the requirements were bad').",
      ],
      interviewQs: [
        "Tell me about a time you disagreed with a senior engineer or manager.",
        "Describe a project that failed or slipped. What did you change?",
        "Tell me about a time you led without formal authority.",
      ],
    },
    {
      id: "career-questions",
      title: "Common Behavioral Questions (Lead level)",
      tags: ["behavioral"],
      brushup: [
        "Ownership: 'a time you went beyond your role', 'took a project from ambiguity to done'.",
        "Conflict: 'disagreed with your manager', 'a difficult teammate', 'convinced others of an unpopular decision'.",
        "Delivery: 'tight deadline', 'had to cut scope', 'competing priorities'.",
        "Failure/learning: 'biggest mistake', 'negative feedback you received', 'something you'd do differently'.",
        "Leadership: 'mentored someone', 'improved a team process', 'handled an underperformer', 'made a call with incomplete data'.",
        "Tech judgment: 'a tradeoff you made', 'chose between two designs', 'introduced/deprecated a technology', 'tech debt you paid down'.",
      ],
      detail: `
<h2>What each competency is really testing</h2>
<table>
<tr><th>Bucket</th><th>They're checking</th></tr>
<tr><td>Ownership</td><td>Do you drive outcomes or wait to be told? Do you follow through past the fun part?</td></tr>
<tr><td>Conflict</td><td>Can you disagree respectfully, use data, and commit once decided?</td></tr>
<tr><td>Dealing with ambiguity</td><td>Can you turn a fuzzy ask into a scoped plan and communicate assumptions?</td></tr>
<tr><td>Leadership</td><td>Do you multiply the team (mentor, unblock, set standards) or just output code?</td></tr>
<tr><td>Judgment</td><td>Do you weigh tradeoffs explicitly, consider cost/risk/time, and revisit decisions?</td></tr>
<tr><td>Learning</td><td>Do you seek feedback and actually change behavior?</td></tr>
</table>
<h2>High-value answers for a switching lead</h2>
<ul>
<li><b>Scope story</b>: you identified a problem nobody owned, built the case, got buy-in, delivered, measured.</li>
<li><b>Multiplier story</b>: you turned a struggling junior into a reliable contributor — how you set them up, delegated, gave feedback.</li>
<li><b>Cross-team story</b>: influencing peers/other teams toward a shared goal without authority.</li>
<li><b>Hard call story</b>: a decision with real downside risk, incomplete data, and how you de-risked it.</li>
</ul>
<h2>Answering "Why are you leaving?"</h2>
<p>Frame forward, not bitter: growth ceiling, want larger scope/scale, want to work on X. Never trash your current employer — interviewers extrapolate how you'll talk about them later.</p>
<h2>"Where do you see yourself / why us?"</h2>
<p>Tie your trajectory (more design ownership, mentoring, bigger systems) to something specific about the company (their scale, product, engineering culture, a public tech blog post).</p>`,
      pitfalls: [
        "Generic answers not backed by a specific incident.",
        "Badmouthing current/past employer or colleagues.",
        "Only technical stories at lead level — they want people impact too.",
        "Not preparing 'why leaving' / 'why us' — these sink otherwise strong candidates.",
      ],
      interviewQs: [
        "Why do you want to leave your current job?",
        "Tell me about a time you had to influence a decision you didn't own.",
        "What's the most significant piece of critical feedback you've received?",
      ],
    },
    {
      id: "career-negotiation",
      title: "Offer Evaluation & Salary Negotiation",
      tags: ["career"],
      brushup: [
        "Never give the first number. Deflect: 'I'm focused on fit; I'm sure you'll make a competitive offer based on my level.' If pushed, give a researched range with your target near the bottom.",
        "Get the full picture: base, bonus (target vs typical payout), equity (RSU value, vesting schedule/cliff, refresh policy), sign-on, benefits, level/title, WFH, growth path.",
        "Negotiate on total comp and level, not just base. Leveling drives every future raise.",
        "Leverage = competing offers + a clear reason you're worth more. Be honest about competing offers; don't bluff specifics.",
        "Always negotiate — a polite counter rarely rescinds an offer. Ask once or twice, be specific, stay warm.",
        "Get it in writing before resigning. Compare offers on 4-year expected value, not year-1 headline.",
      ],
      detail: `
<h2>The recruiter's first question</h2>
<blockquote>"What are your salary expectations?"</blockquote>
<p>Options, best to worst:</p>
<ol>
<li><i>"I'd like to understand the role and level first — what's the budgeted range for this position?"</i> (turn it around)</li>
<li><i>"Based on my research for this level and market, I'm targeting X–Y total comp."</i> (anchored range)</li>
<li>A single number (avoid — you've capped yourself).</li>
</ol>
<h2>Counter-offer script</h2>
<blockquote>"Thank you — I'm excited about the team and the problems. Based on my experience leading [X] and the competing conversation I'm in, I was hoping we could get the total comp to [specific number]. Is there flexibility on base or the equity grant?"</blockquote>
<h2>Evaluate the offer</h2>
<table>
<tr><th>Component</th><th>Ask</th></tr>
<tr><td>Level / title</td><td>What level is this? What's the promo path and timeline to the next?</td></tr>
<tr><td>Equity</td><td>Grant value, vesting (e.g. 25/25/25/25 or back-loaded?), 1-yr cliff, refresh grants?</td></tr>
<tr><td>Bonus</td><td>Target %, and what did it actually pay out the last 2 years?</td></tr>
<tr><td>Growth</td><td>Who would I report to? What does success at 6/12 months look like?</td></tr>
</table>
<h2>Red flags</h2>
<p>Pressure to decide in 24–48h, refusal to put comp in writing, vague leveling, "we don't negotiate" combined with a below-market number, evasiveness about bonus history or attrition.</p>`,
      pitfalls: [
        "Anchoring low by blurting your current salary (illegal to ask in some places — you can decline).",
        "Negotiating only base and ignoring level, equity vesting shape, and refreshers.",
        "Accepting on the call out of relief — always take 1–2 days.",
        "Bluffing a competing offer that doesn't exist.",
      ],
      interviewQs: [
        "What are your compensation expectations? (practice the deflection)",
        "What would make you accept or decline this offer?",
        "How do you compare two offers with different equity structures?",
      ],
    },
    {
      id: "career-plan",
      title: "A 10-12 Week Switch Prep Plan",
      tags: ["career", "process"],
      brushup: [
        "Weeks 1–2: fundamentals refresh (this site's CS + DSA concept sections) + set up a coding routine.",
        "Weeks 3–7: DSA by pattern — arrays/hashing, two pointers/sliding window, stacks, linked lists, trees, graphs, DP. ~3–5 problems/day, review mistakes.",
        "Weeks 4–8 (parallel): LLD — practice 6–8 machine-coding problems out loud with a timer.",
        "Weeks 6–10 (parallel): HLD — one full mock design every few days; build a component library in your head.",
        "Weeks 8–12: behavioral story bank (8–10 STAR stories), mock interviews, company-specific prep.",
        "Throughout: track every problem (solved/review), do spaced repetition on failures, and do real mocks (peers or paid).",
      ],
      detail: `
<h2>Weekly structure (while working full-time, ~10–12 h/week)</h2>
<table>
<tr><th>Day</th><th>Focus</th></tr>
<tr><td>Mon/Wed/Fri (1h)</td><td>DSA — 2–3 problems on the current pattern; redo any you failed last week</td></tr>
<tr><td>Tue/Thu (1h)</td><td>LLD or HLD — alternate; one timed exercise</td></tr>
<tr><td>Sat (2–3h)</td><td>One full mock (DSA or design), then review; add a STAR story</td></tr>
<tr><td>Sun</td><td>Light: read editorials, revise the Last-Minute Prep tab, plan next week</td></tr>
</table>
<h2>DSA pattern order (do in this sequence)</h2>
<ol>
<li>Arrays, hashing, prefix sums</li>
<li>Two pointers &amp; sliding window</li>
<li>Stack / queue / monotonic stack</li>
<li>Linked lists</li>
<li>Binary search (incl. on the answer)</li>
<li>Trees &amp; BST, then heaps</li>
<li>Graphs — BFS/DFS, topo sort, union-find, Dijkstra</li>
<li>Recursion &amp; backtracking</li>
<li>DP — 1D, 2D, knapsack, LIS/LCS, intervals</li>
<li>Tries, bit manipulation, greedy</li>
</ol>
<h2>Quality bar per problem</h2>
<p>Solve it → if stuck &gt;25–30 min, read the editorial, understand it, close it, re-implement from scratch the next day. Log: pattern, mistake, time. Re-attempt anything you rated "review" after 3 and 10 days.</p>
<h2>Mocks matter</h2>
<p>You underestimate how much talking + coding + nerves degrade performance. Do at least 6–8 live mocks (peers, Pramp-style, or paid). Design and behavioral especially need spoken reps.</p>
<h2>Applications</h2>
<p>Start applying in week ~6 (not week 1 — you want to be ~70% ready when first-rounds land). Batch companies so offers arrive close together for leverage. Warm referrals &gt; cold applications by a wide margin.</p>`,
      pitfalls: [
        "Grinding problem count without reviewing mistakes — you re-fail the same patterns.",
        "Skipping design/behavioral until the end, then cramming.",
        "No mocks — first real interview becomes the practice run.",
        "Applying to your top choice first, before you're warmed up.",
      ],
      interviewQs: [
        "(Self-check) Can you list the 10 DSA patterns and one signature problem each?",
        "(Self-check) Can you do a 45-min LLD problem out loud, on a timer?",
        "(Self-check) Do you have 8 STAR stories written down?",
      ],
    },
  ],
});
