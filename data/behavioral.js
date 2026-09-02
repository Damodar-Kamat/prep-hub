/* Behavioral, career & job-switch prep (deep-dive edition). */
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
        "STAR = Situation (brief context) → Task (your responsibility) → Action (what YOU specifically did) → Result (measurable outcome + what you learned).",
        "Spend ~60–70% of the answer on Action. Say 'I', not 'we'. Quantify results (p99 −40%, incidents −60%, shipped in 3 weeks, 4 engineers onboarded).",
        "Prepare 8–10 flexible stories covering: hard bug, conflict, leadership/influence, failure, ambiguity, mentoring, tech trade-off/decision, missed deadline, pushing back on a stakeholder, cross-team delivery.",
        "As a lead (3 yrs): show scope beyond code — design ownership, unblocking others, influence without authority, raising the team's bar.",
        "End every failure story with the concrete, permanent change you made afterward.",
        "Keep answers to 2–3 minutes; leave hooks for follow-up questions instead of front-loading everything.",
        "Practise out loud and on a timer — a story that reads well often rambles when spoken.",
      ],
      detail: `
<h2>Why behavioral rounds exist</h2>
<p>Past behavior predicts future behavior better than hypotheticals. Interviewers are checking specific competencies (ownership, dealing with ambiguity, conflict, judgment, learning, collaboration) and whether your self-reported seniority matches the scope of your stories. At lead level they also want evidence you make other people more effective, not just that you write good code.</p>

<h2>The structure, with time budget</h2>
<pre><code>Situation (10–15s):  the team/product context and why it mattered. One or two sentences.
Task (10s):          what YOU were on the hook for — your goal, your constraint, your deadline.
Action (60–90s):     3–5 specific things you did. Decisions and trade-offs. How you brought
                     people along. This is the part they're grading.
Result (15–20s):     the number, the ship, the outcome — plus what you learned or changed
                     permanently as a result.</code></pre>

<h2>Worked example — "Tell me about a hard technical problem"</h2>
<blockquote>
<b>S:</b> Our checkout API's p99 latency spiked to 4 seconds during a flash sale, driving ~5% cart abandonment during our highest-revenue hour.<br>
<b>T:</b> I owned the checkout service. I had two days before the next scheduled sale.<br>
<b>A:</b> I added distributed tracing and found ~80% of the time was in a synchronous third-party fraud-check call. I split fraud scoring into a fast inline rules check plus an asynchronous deep-scoring step on a queue; added a 200 ms timeout with a conservative "hold for manual review" fallback; load-tested at 3× projected peak; wrote a runbook and briefed the on-call engineer. I also proposed "async by default for third-party calls" as a team guideline and got buy-in in a design review.<br>
<b>R:</b> p99 dropped to ~600 ms. Abandonment during the next sale was 1.2% vs 5%. The async-by-default guideline caught two similar issues in the next quarter before they shipped.
</blockquote>

<h2>Mapping question themes to stories</h2>
<table>
<tr><th>Theme</th><th>Story to reach for</th></tr>
<tr><td>Conflict / disagreement</td><td>You pushed back on a rushed design or a stakeholder ask, used data, reached a middle path, then committed.</td></tr>
<tr><td>Failure / mistake</td><td>An outage or slip you caused or owned; the guardrail (test, alert, process) you added so it can't recur.</td></tr>
<tr><td>Leadership / influence without authority</td><td>You drove a migration or standard across teams that don't report to you — how you built the case and momentum.</td></tr>
<tr><td>Ambiguity</td><td>A vague ask you turned into a scoped plan; the assumptions you made explicit; the MVP you shipped.</td></tr>
<tr><td>Mentoring</td><td>You leveled up a struggling teammate — how you set them up, delegated a stretch task with a safety net, gave feedback.</td></tr>
<tr><td>Technical judgment</td><td>A real trade-off: build vs buy, two designs, introduce/deprecate a technology, pay down debt vs ship.</td></tr>
<tr><td>Delivery under pressure</td><td>A hard deadline where you cut scope deliberately and communicated it, rather than shipping something broken.</td></tr>
</table>

<h2>Building your story bank (do this on paper)</h2>
<ol>
<li>List 10–12 concrete situations from the last 2–3 years — projects, incidents, disagreements, mentoring moments.</li>
<li>For each: write S/T/A/R in bullet points. Force a number into every Result.</li>
<li>Tag each story with the 3–4 competencies it demonstrates. Aim to cover every competency with ≥ 2 stories.</li>
<li>Draft the "Why are you leaving?" and "Why us?" answers — these sink otherwise-strong candidates.</li>
<li>Do 3–4 mock behavioral rounds out loud. You'll discover which stories ramble.</li>
</ol>

<h2>Delivery tips</h2>
<ul>
<li>Front-load the point: "This is a story about pushing back on my manager and being right — and about how I handled being wrong the previous time."</li>
<li>Pause after the Result. Let them ask follow-ups instead of pre-answering everything.</li>
<li>If asked for a failure, pick a real one with real stakes and real ownership. A humble-brag ("I work too hard") reads as evasive.</li>
<li>Numbers over adjectives: "latency went 4s → 600ms" beats "it got much faster".</li>
</ul>`,
      pitfalls: [
        "Rambling Situation/context so the interviewer loses the thread before the Action.",
        "'We' everywhere — the interviewer can't tell what YOU did or decided.",
        "No numbers in the Result.",
        "Failure stories with no ownership ('the requirements were bad', 'QA missed it').",
        "One story stretched to answer every question — prepare variety.",
        "Not preparing 'why are you leaving' and 'why this company'.",
        "Memorizing a script — it sounds rehearsed; memorize the beats, not the words.",
      ],
      interviewQs: [
        "Tell me about a time you disagreed with a senior engineer or your manager.",
        "Describe a project that failed or slipped significantly. What did you change afterward?",
        "Tell me about a time you led an effort without formal authority.",
        "Walk me through the hardest technical problem you've solved.",
        "Tell me about a time you had to deliver with an impossible deadline.",
        "Describe a time you mentored someone who was struggling.",
      ],
    },

    {
      id: "career-questions",
      title: "Common Behavioral Questions (Lead level)",
      tags: ["behavioral"],
      brushup: [
        "Ownership: 'went beyond your role', 'took a project from ambiguity to done', 'saw a problem nobody owned and fixed it'.",
        "Conflict: 'disagreed with your manager', 'a difficult teammate', 'convinced others of an unpopular decision', 'disagree and commit'.",
        "Delivery: 'tight deadline', 'had to cut scope', 'competing priorities', 'a launch that went wrong'.",
        "Failure & learning: 'biggest mistake', 'critical feedback you received', 'something you'd do differently', 'a time you were wrong'.",
        "Leadership / people: 'mentored someone', 'improved a team process', 'handled an underperformer', 'gave difficult feedback', 'made a call with incomplete data'.",
        "Technical judgment: 'a trade-off you made', 'chose between two designs', 'introduced or deprecated a technology', 'paid down tech debt', 'build vs buy'.",
        "Customer / impact: 'went out of your way for a user', 'used data to change direction', 'said no to a feature request'.",
      ],
      detail: `
<h2>What each competency is actually testing</h2>
<table>
<tr><th>Bucket</th><th>They're really checking</th></tr>
<tr><td>Ownership / bias for action</td><td>Do you drive outcomes or wait to be assigned work? Do you follow through past the fun part (docs, on-call handoff, cleanup)?</td></tr>
<tr><td>Conflict / "disagree and commit"</td><td>Can you disagree with data and without ego, and then fully commit once a decision is made — even against you?</td></tr>
<tr><td>Dealing with ambiguity</td><td>Can you convert a fuzzy ask into a scoped plan, state assumptions, and start delivering value before everything is clear?</td></tr>
<tr><td>Leadership / "are you a multiplier?"</td><td>Do you raise the team's output — mentoring, unblocking, setting standards, reviewing well — or just your own?</td></tr>
<tr><td>Judgment</td><td>Do you weigh cost / risk / time explicitly, make a call, and revisit it when new information arrives?</td></tr>
<tr><td>Learning / self-awareness</td><td>Do you actively seek feedback and actually change behavior, or get defensive?</td></tr>
<tr><td>Customer focus</td><td>Do you connect technical work to user or business impact?</td></tr>
</table>

<h2>High-value stories for a switching lead</h2>
<ul>
<li><b>The scope story</b>: you spotted a problem nobody owned, built the case (data, a one-pager), got buy-in, delivered it, and measured the impact.</li>
<li><b>The multiplier story</b>: you turned a struggling or junior engineer into a reliable contributor — specifically how you set them up, what you delegated, how you gave feedback, and what they can now do independently.</li>
<li><b>The cross-team story</b>: you aligned two or three teams toward a shared goal without being anyone's manager — how you found the shared interest and kept momentum.</li>
<li><b>The hard-call story</b>: a decision with real downside risk and incomplete information — how you de-risked it (spike, phased rollout, reversible first step) and what you'd do differently.</li>
<li><b>The "I was wrong" story</b>: you argued a position, new evidence proved you wrong, and you changed course publicly and quickly.</li>
</ul>

<h2>"Why are you leaving your current job?"</h2>
<p>Frame it forward, never bitter. Good reasons: growth ceiling (you've outgrown the scope / the tech / the team size), you want to work on a specific problem domain or scale, you want more design ownership or people leadership. Never criticize your current employer, manager, or teammates — interviewers extrapolate how you'll talk about <em>them</em> in two years. If there was a genuine negative (layoffs, a reorg, a bad manager), state it factually and briefly, then pivot to what you're looking for.</p>

<h2>"Why this company / why us?"</h2>
<p>Connect your trajectory to something specific and verifiable: their scale or a hard problem they've written about, a product you actually use, their engineering culture as evidenced by a public blog post or talk, the team's mandate. "You're big and pay well" is not an answer. Do 20 minutes of homework per company.</p>

<h2>"Where do you see yourself in 3–5 years?"</h2>
<p>Show direction without boxing yourself in. For a lead switching: "Owning the architecture and delivery of a significant product area, and growing 2–3 engineers into strong seniors" — whether that's a staff IC track or an EM track you can decide with your manager. Tie it to what this role would let you build toward.</p>

<h2>Questions to ASK the interviewer</h2>
<ul>
<li>"What does success in this role look like at 6 and 12 months?"</li>
<li>"What's the biggest technical challenge the team is facing right now?"</li>
<li>"How are technical decisions made and disagreements resolved?"</li>
<li>"What's the on-call situation, and how healthy is it?"</li>
<li>"Why is this role open? What happened to the person who had it?"</li>
<li>"What would you change about the team if you could?"</li>
</ul>`,
      pitfalls: [
        "Generic answers not anchored to a specific, dated incident.",
        "Badmouthing a current or former employer, manager, or colleague.",
        "Only technical stories at lead level — they want evidence of people impact.",
        "No prepared 'why leaving' / 'why us' — these are almost always asked.",
        "Asking zero questions, or only asking about comp and perks.",
        "Claiming credit for team work, or hiding your role behind 'we'.",
      ],
      interviewQs: [
        "Why do you want to leave your current job?",
        "Why this company, specifically?",
        "Tell me about a time you influenced a decision you didn't own.",
        "What's the most significant piece of critical feedback you've received, and what did you do with it?",
        "Tell me about a time you had to say no to a stakeholder.",
        "Where do you want to be in 3–5 years?",
      ],
    },

    {
      id: "career-negotiation",
      title: "Offer Evaluation & Salary Negotiation",
      tags: ["career"],
      brushup: [
        "Don't give the first number. Deflect to the role/level first; if pushed, give a researched range with your target near the bottom of it.",
        "Get the full picture: base, bonus (target % AND actual recent payout), equity (grant value, vesting schedule/shape, cliff, refresh policy), sign-on, level/title, benefits, growth path.",
        "Negotiate on total comp AND level — leveling drives every future raise, promo timeline, and scope.",
        "Leverage = competing offers + a clear articulation of your value. Be honest about competing offers; don't invent specifics.",
        "Always counter once or twice — a polite, specific counter almost never rescinds an offer. Stay warm and collaborative.",
        "Get everything in writing before you resign. Compare offers on ~4-year expected value, not the year-1 headline.",
        "Take 1–2 days before accepting, even if you're sure. Never accept on the call out of relief.",
      ],
      detail: `
<h2>The recruiter's opening question</h2>
<blockquote>"What are your salary expectations?"</blockquote>
<p>Options, best to worst:</p>
<ol>
<li><b>Turn it around</b>: "I'd like to understand the role and level first — what's the budgeted range for this position?" Most recruiters will share a band.</li>
<li><b>Anchored range</b>: "Based on my research for this level and the market, I'm targeting X–Y total comp." Pick a range where you'd be happy at the bottom.</li>
<li><b>A single number</b> — avoid; you've capped yourself and revealed your hand.</li>
</ol>
<p>If asked for your <em>current</em> comp: in many places it's illegal to require it and you can decline ("I'd prefer to focus on the value of this role; my expectations are X–Y"). Anchoring on a low current salary is the most common way people leave money on the table.</p>

<h2>Counter-offer script</h2>
<blockquote>"Thank you — I'm genuinely excited about the team and the problems you're solving. Based on my experience leading [X] and the other conversation I'm in, I was hoping we could get total comp closer to [specific number]. Is there flexibility on the base, or on the equity grant?"</blockquote>
<p>Anchor slightly above your target, be specific (a number, not "more"), give a brief justification, and name which lever you'd prefer they pull. Then stop talking.</p>

<h2>Evaluate the whole offer</h2>
<table>
<tr><th>Component</th><th>Questions to ask</th></tr>
<tr><td>Level / title</td><td>What level is this mapped to? What's the promo path and typical timeline to the next level? Who decides?</td></tr>
<tr><td>Equity</td><td>Grant value and how it's calculated (share count × price, or a $ target?). Vesting schedule and <b>shape</b> (25/25/25/25 vs back-loaded 5/15/40/40?). Cliff length. Refresh grant policy — without refreshers, comp drops off a cliff in year 4.</td></tr>
<tr><td>Bonus</td><td>Target %, and what did it <em>actually</em> pay out the last 2 years? Company-performance vs individual?</td></tr>
<tr><td>Growth / manager</td><td>Who would I report to? What does success look like at 6/12 months? What's the team's mandate and headcount plan?</td></tr>
<tr><td>Work</td><td>On-call load and health. Remote/hybrid policy in writing. Team's recent attrition.</td></tr>
</table>

<h2>Comparing two offers</h2>
<pre><code>4-year expected value ≈
   base × 4
 + expected bonus × 4                     (use the actual recent payout %, not target)
 + equity grant value                     (for public: current price; for private: haircut it — 409A ≠ exit value)
 + expected refresh grants years 2–4
 + sign-on
 − cost-of-living / tax differences
 ± non-comp factors (growth, manager, product, risk, commute, brand)</code></pre>
<p>Private-company equity is a lottery ticket — weight it heavily down unless you have real conviction about the outcome and liquidity.</p>

<h2>Red flags in the process</h2>
<ul>
<li>Pressure to decide in 24–48 hours ("exploding offer").</li>
<li>Refusal to put compensation or the leveling in writing.</li>
<li>Vague or evasive answers about bonus history, attrition, or why the role is open.</li>
<li>"We don't negotiate" paired with a below-market number.</li>
<li>The manager you'd report to is unavailable to talk before you sign.</li>
</ul>

<h2>Timing for leverage</h2>
<p>Batch your applications so offers land within a week or two of each other. A real competing offer (even at a similar number) is the strongest lever. Referrals dramatically beat cold applications — spend your energy there. Start interviewing when you're ~70% prepared, not 100%, because the process itself takes 4–8 weeks.</p>`,
      pitfalls: [
        "Anchoring low by volunteering your current salary.",
        "Negotiating only base and ignoring level, equity vesting shape, and refresh policy.",
        "Accepting on the call out of relief — always take a day or two.",
        "Bluffing a competing offer that doesn't exist (recruiters talk; it can blow up).",
        "Treating private-company equity at its stated value.",
        "Not getting the level and comp in writing before resigning.",
      ],
      interviewQs: [
        "(Practice) 'What are your salary expectations?' — deliver the deflection out loud.",
        "(Practice) Deliver a counter-offer for a number 15% above the initial offer.",
        "How would you compare two offers with very different equity structures?",
        "What would make you decline an otherwise strong offer?",
        "How do you create leverage without a competing offer in hand?",
      ],
    },

    {
      id: "career-plan",
      title: "A 10–12 Week Switch Prep Plan",
      tags: ["career", "process"],
      brushup: [
        "Weeks 1–2: refresh fundamentals (this site's CS + DSA concept sections), set up a daily coding + tracking routine.",
        "Weeks 3–7: DSA by pattern — arrays/hashing, two pointers/sliding window, stacks, linked lists, binary search, trees/heaps, graphs, backtracking, DP. ~3–5 problems/day; review every mistake.",
        "Weeks 4–8 (parallel): LLD — 6–8 machine-coding problems, out loud, on a timer.",
        "Weeks 6–10 (parallel): HLD — one full mock design every few days; build a mental component library.",
        "Weeks 8–12: behavioral story bank (8–10 STAR stories written), mock interviews, company-specific prep.",
        "Throughout: track every problem (solved / review), spaced repetition on failures, and do 6–8 real mock interviews.",
        "Start applying around week 6 (not week 1) so first-rounds land when you're ~70% ready; batch companies for offer-timing leverage.",
      ],
      detail: `
<h2>Weekly structure (working full-time, ~10–12 h/week)</h2>
<table>
<tr><th>Day</th><th>Focus (~1–3 h)</th></tr>
<tr><td>Mon / Wed / Fri</td><td>DSA — 2–3 problems on the current pattern; re-do anything you failed last week</td></tr>
<tr><td>Tue / Thu</td><td>LLD or HLD, alternating — one timed exercise, spoken</td></tr>
<tr><td>Sat (longer block)</td><td>One full mock (DSA or design), then review; add or refine one STAR story</td></tr>
<tr><td>Sun</td><td>Light: read editorials, revise the Last-Minute Prep tab, plan next week, track progress</td></tr>
</table>

<h2>DSA pattern order (follow this sequence)</h2>
<ol>
<li>Arrays, hashing, prefix sums</li>
<li>Two pointers &amp; sliding window</li>
<li>Stack / queue / monotonic stack</li>
<li>Linked lists</li>
<li>Binary search (including on the answer)</li>
<li>Trees &amp; BST, then heaps</li>
<li>Graphs — BFS/DFS, topological sort, union-find, Dijkstra</li>
<li>Recursion &amp; backtracking</li>
<li>DP — 1D, 2D, knapsack, LIS/LCS, intervals</li>
<li>Tries, bit manipulation, greedy, math</li>
</ol>

<h2>Quality bar per problem (this matters more than count)</h2>
<ul>
<li>Attempt for 25–30 min. If stuck, read the editorial, understand it fully, then <b>close it and re-implement from scratch</b> the next day.</li>
<li>Log every problem: pattern, the specific mistake or insight, time taken, and a rating (got-it / shaky / review).</li>
<li>Re-attempt "shaky" and "review" problems after ~3 days and again after ~10 (spaced repetition). Failing the same pattern twice means you don't own it yet.</li>
<li>After solving, always state time and space complexity out loud and ask "can I do better?".</li>
</ul>

<h2>LLD practice list</h2>
<p>Parking lot, LRU cache, rate limiter, Splitwise, elevator, vending machine, a logging framework, a notification service, an in-memory key-value store, a snake-and-ladders / chess engine, a booking system (movie/hotel). Do each in 45–60 min, spoken, ending with a compilable core and an extension discussion.</p>

<h2>HLD practice list</h2>
<p>URL shortener, Twitter feed, chat/WhatsApp, Instagram, a rate limiter, a notification/fan-out system, Google Docs (collab), Uber (matching + location), YouTube/Netflix (video), a distributed cache, a web crawler, Dropbox, a payment system, a ticketing/booking system (with the inventory/overbooking problem), an ad click aggregator. For each: requirements → estimates → API → diagram → deep-dive on 1–2 hard parts → bottlenecks.</p>

<h2>Mocks are non-negotiable</h2>
<p>You badly underestimate how much talking + coding + nerves degrade your performance. Do at least 6–8 live mocks — peers, Pramp-style platforms, or paid interviewers — split across DSA, design, and behavioral. Design and behavioral especially need spoken reps; you cannot practice them silently.</p>

<h2>Applications &amp; timing</h2>
<ul>
<li>Start applying around week 6, when you're ~70% ready — the pipeline takes 4–8 weeks and you'll warm up during early rounds.</li>
<li>Apply to your <b>middle-tier</b> targets first as practice; save top choices for weeks 9–12.</li>
<li>Batch so offers arrive within ~2 weeks of each other for negotiation leverage.</li>
<li>Warm referrals beat cold applications by a wide margin — ask your network first.</li>
<li>Keep a simple tracker: company, stage, dates, contact, next action.</li>
</ul>

<h2>Two weeks out from an onsite</h2>
<p>Shift from learning to sharpening: re-do your "review" problems, run 2–3 full mocks, re-read the Last-Minute Prep tab, rehearse your top 6 STAR stories out loud, and do 20 minutes of company-specific homework (product, recent eng blog posts, the team's domain, the interviewers' backgrounds if known).</p>`,
      pitfalls: [
        "Grinding problem count without reviewing mistakes — you re-fail the same patterns.",
        "Leaving design and behavioral until the last two weeks, then cramming.",
        "No mock interviews — your first real interview becomes the practice run.",
        "Applying to your #1 choice first, before you're warmed up.",
        "Studying passively (watching solutions) instead of re-implementing from a blank editor.",
        "Not tracking progress, so you can't tell what's weak.",
      ],
      interviewQs: [
        "(Self-check) Can you name the 10 DSA patterns and one signature problem for each?",
        "(Self-check) Can you do a 45-minute LLD problem out loud, on a timer, ending compilable?",
        "(Self-check) Can you run a full HLD mock: requirements → estimates → API → diagram → deep-dive → bottlenecks?",
        "(Self-check) Do you have 8+ STAR stories written down, each with a number in the Result?",
        "(Self-check) Have you done at least 6 live mock interviews?",
      ],
    },
  ],
});
