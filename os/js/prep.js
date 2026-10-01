/* Interview (project round), Companies (questions, roles, interview log), Revision, Resume, Analytics. */
(function () {
  const { h, esc, get, post } = OS;
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const tabs = (el, names, cur, base) => {
    const t = h(`<div class="tabs">${names.map(([k, label]) => `<button class="${k === cur ? "on" : ""}" data-k="${k}">${label}</button>`).join("")}</div>`);
    OS.$$("[data-k]", t).forEach((b) => (b.onclick = () => OS.go(base + "?tab=" + b.dataset.k)));
    el.appendChild(t);
  };
  const libHref = (r) => (r.local ? "/index.html#/problem/" + r.local : r.lc ? "https://leetcode.com/problems/" + r.lc + "/" : "/index.html#/plan");

  // ---------------------------------------------------------------- Project round
  OS.views["/project"] = async (el) => {
    const { project } = await get("/project");
    el.appendChild(h(`<div class="page-h"><div><h1>📁 Project round</h1><p>“Walk me through a project you're proud of” — then 30 minutes of drilling. Describe your project once; the interviewer asks about its architecture, your decisions, failures, scale and every number you claim, plus deep probes for each technology it detects.</p></div></div>`));
    const f = h(`<div class="card pad-lg"><div class="field"><label>Project name</label><input id="pn" placeholder="e.g. Real-time order tracking platform" value="${esc(project.name || "")}"></div>
      <div class="field mt"><label>Describe it — problem, architecture, tech stack, your role, scale, results (paste resume bullets + more)</label><textarea id="pt" rows="10" placeholder="Built an event-driven order tracking system on Kafka and Spring Boot microservices running on Kubernetes (EKS). I designed the consumer architecture and the outbox pattern… Reduced delivery-status latency from 5 min to 3 s for 2M daily orders…">${esc(project.text || "")}</textarea></div>
      <div class="row mt"><button class="btn" id="save">💾 Save & preview questions</button><button class="btn primary lg" id="start">🎙️ Start project round</button><select id="cnt" style="width:auto"><option>4</option><option selected>6</option><option>8</option><option>10</option></select></div><div id="pv" class="mt"></div></div>`);
    el.appendChild(f);
    const save = async () => {
      const name = OS.$("#pn", f).value.trim(), text = OS.$("#pt", f).value.trim();
      if (!text) { OS.toast("Describe your project first"); return false; }
      const r = await post("/project", { name, text });
      const s = await post("/mock/session", { track: "project", count: 40, project: { name, text } });
      OS.$("#pv", f).innerHTML = `<div class="small muted">Detected: ${r.skills.map((x) => `<span class="badge acc">${esc(x)}</span>`).join(" ") || "no specific technologies — add your stack for sharper probes"}</div>
        <details class="qa mt"><summary>👀 Question pool (${s.questions.length}) — a session picks from these</summary><div class="a"><ol class="small">${s.questions.map((q) => `<li>${esc(q.q)}</li>`).join("")}</ol></div></details>`;
      return true;
    };
    OS.$("#save", f).onclick = save;
    OS.$("#start", f).onclick = async () => { if (await save()) OS.go("#/mock?start=1&track=project&count=" + OS.$("#cnt", f).value); };
    if (project.text) save();
  };

  // ---------------------------------------------------------------- Roles
  OS.views["/roles"] = async (el, p) => {
    const [{ roles }, rd] = await Promise.all([get("/roles"), post("/roles/readiness", { progress: OS.progressLite() }).catch(() => ({ readiness: {} }))]);
    const ready = rd.readiness || {};
    el.appendChild(h(`<div class="page-h"><div><h1>🧭 Role prep paths</h1><p>What each role is actually interviewed on — the rounds, the focus, a week-by-week plan and the exact topics and mock tracks to use.</p></div></div>`));
    const chips = h(`<div class="row mb">${roles.map((r) => `<a class="chip ${r.id === (p.id || roles[0].id) ? "on" : ""}" href="#/roles?id=${r.id}">${r.icon} ${esc(r.name)}${ready[r.id] ? ` <b style="color:${OS.scoreColor(ready[r.id].score / 10)}">${ready[r.id].score}%</b>` : ""}</a>`).join("")}</div>`);
    el.appendChild(chips);
    const r = roles.find((x) => x.id === p.id) || roles[0];
    el.appendChild(h(`<div class="card pad-lg"><div class="spread"><h2 style="margin:0">${r.icon} ${esc(r.name)} <span class="badge">${esc(r.years)}</span></h2><span class="row"><a class="btn" href="#/plan">🗓️ Build a dated plan</a><a class="btn primary" href="#/loop?go=${{ "backend-sde2": "backend-sde2", "senior-backend": "senior-backend", lead: "lead", "data-engineer": "data-engineer", "sre-devops": "sre-devops" }[r.id] || "quick"}">🏢 Run this role's loop</a></span></div>
      <div class="def mt">${esc(r.focus)}</div>
      ${ready[r.id] ? `<div class="row mt" style="gap:16px">${OS.ring(ready[r.id].score / 10, 72, ready[r.id].score + "%")}<div class="small"><b>Readiness for this role</b> — from your skill scores in its subjects and your latest mock scores in its rounds.
        <div class="mt">Biggest gaps: ${ready[r.id].gaps.map((g) => `<a class="chip" href="#/learn/${g.id}">${esc(g.name)} · ${g.score}</a>`).join(" ")}</div>
        ${ready[r.id].untried_tracks.length ? `<div class="mt muted">Rounds you haven't practised: ${ready[r.id].untried_tracks.map((t) => esc(t.name)).join(", ")}</div>` : ""}</div></div>` : ""}
      <div class="grid g2 mt"><div><h3>🎤 Typical rounds</h3><ol class="small">${r.rounds.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></div>
      <div><h3>🗓️ Plan</h3><ul class="small">${r.weeks.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
      <div class="grid g2 mt"><div><h3>📚 Must-know topics</h3><div class="col">${r.topics.map((t) => `<a class="small" href="${OS.topicHref(t.section, t.id)}">→ ${esc(t.title)}</a>`).join("")}</div>
        <div class="row mt">${r.subjects.map((s) => `<a class="chip" href="#/learn/${s.id}">${esc(s.name)}</a>`).join("")}</div></div>
      <div><h3>🎙️ Practice rounds</h3><div class="col">${r.tracks.map((t) => `<a class="btn" style="justify-content:flex-start" href="${t.id === "project" ? "#/project" : "#/mock?start=1&track=" + t.id}">${t.icon} ${esc(t.name)}</a>`).join("")}</div></div></div></div>`));
  };

  // ---------------------------------------------------------------- Company questions
  OS.views["/companyq"] = async (el, p) => {
    const d = await get("/company-bank?company=" + encodeURIComponent(p.c || ""));
    el.appendChild(h(`<div class="page-h"><div><h1>🏢 Company questions</h1><p>Problems from the library tagged by company, the company's values for behavioral rounds, questions you mined from the web and questions you were actually asked.</p></div>
      <div class="row"><input id="cq" placeholder="Company…" value="${esc(p.c || "")}" style="width:200px"><button class="btn primary" id="go">Show</button></div></div>`));
    const go = () => OS.go("#/companyq?c=" + encodeURIComponent(OS.$("#cq", el).value.trim()));
    OS.$("#go", el).onclick = go; OS.$("#cq", el).onkeydown = (e) => e.key === "Enter" && go();
    el.appendChild(h(`<div class="row mb">${d.companies.slice(0, 24).map(([c, n]) => `<a class="chip ${c.toLowerCase() === (p.c || "").toLowerCase() ? "on" : ""}" href="#/companyq?c=${encodeURIComponent(c)}">${esc(c)} <span class="dim">${n}</span></a>`).join("")}</div>`));
    if (!p.c) { el.appendChild(h(`<div class="card empty"><div class="big">🏢</div>Pick a company above.</div>`)); return; }
    const lv = { Easy: "lv1", Medium: "lv2", Hard: "lv3" };
    el.appendChild(h(`<div class="grid g2"><div class="card"><div class="spread"><h3>🧩 Coding problems (${d.problems.length})</h3><a class="btn sm" href="/index.html#/practice">All problems ↗</a></div>
        <div class="list">${d.problems.map((x) => `<a class="item spread" href="/index.html#/problem/${x.id}" style="color:inherit"><span>${esc(x.title)}<div class="xs dim">${esc(x.pattern || "")}</div></span><span class="badge ${lv[x.difficulty] || ""}">${x.difficulty}</span></a>`).join("") || `<div class="empty">No tagged problems yet.</div>`}</div></div>
      <div class="col"><div class="card"><h3>💎 ${d.values ? esc(d.values.title) : "Values"}</h3>${d.values ? `<div class="row">${d.values.values.map((v) => `<span class="badge acc">${esc(v)}</span>`).join("")}</div>` : `<div class="small muted">No values on file — the intel agent may find them.</div>`}
        <div class="row mt"><a class="btn sm primary" href="#/mock?start=1&track=behavioral&company=${encodeURIComponent(d.company)}">🎙️ ${esc(d.company)}-style behavioral mock</a></div></div>
      <div class="card"><h3>📰 Interview experiences</h3><div class="small muted">Run the intel agent to read real experiences (rounds, hot topics, problems asked, tips).</div><div class="row mt"><a class="btn sm" href="#/company?name=${encodeURIComponent(d.company)}">🕵️ Build ${esc(d.company)} dossier</a><a class="btn sm" href="#/questions?mine=${encodeURIComponent(d.company + " interview questions")}">⛏️ Mine questions</a></div></div>
      <div class="card"><h3>📝 Your ${esc(d.company)} interviews (${d.interviews.length})</h3>${d.interviews.map((i) => `<div class="small">${esc(i.date)} · ${esc(i.round)} · <b>${esc(i.outcome)}</b></div>`).join("") || `<div class="small muted">None logged. <a href="#/interviews">Log one</a></div>`}</div></div></div>`));
    if (d.mined.length) el.appendChild(h(`<div class="card mt"><h3>⛏️ Questions saved for ${esc(d.company)} (${d.mined.length})</h3><ol class="small">${d.mined.map((m) => `<li>${esc(m.q)} <span class="xs dim">${esc(m.track)}</span></li>`).join("")}</ol></div>`));
  };

  // ---------------------------------------------------------------- Real interview log / history
  OS.views["/interviews"] = async (el, p) => {
    const { interviews } = await get("/interviews");
    el.appendChild(h(`<div class="page-h"><div><h1>📝 Interview experiences</h1><p>Log every real interview — the questions you were asked become practice questions in the matching mock track, and your history shows up in Analytics.</p></div></div>`));
    const OUT = ["Pending", "Passed", "Rejected", "Offer", "Withdrew"];
    const ed = interviews.find((x) => String(x.id) === p.edit) || {};
    const f = h(`<div class="card pad-lg"><h3>${ed.id ? "Edit" : "➕ Log an interview"}</h3><div class="grid g4">
      <div class="field"><label>Company</label><input id="co" value="${esc(ed.company || "")}"></div><div class="field"><label>Role</label><input id="ro" value="${esc(ed.role || "")}"></div>
      <div class="field"><label>Round</label><input id="rd" placeholder="DSA / HLD / HM…" value="${esc(ed.round || "")}"></div><div class="field"><label>Date</label><input type="date" id="dt" value="${esc(ed.date || new Date().toISOString().slice(0, 10))}"></div></div>
      <div class="grid g2 mt"><div class="field"><label>Questions asked (one per line)</label><textarea id="qs" rows="5">${esc(ed.questions || "")}</textarea></div><div class="field"><label>Notes — what went well, what to fix</label><textarea id="nt" rows="5">${esc(ed.notes || "")}</textarea></div></div>
      <div class="row mt"><div class="field" style="width:160px"><label>Outcome</label><select id="oc">${OUT.map((o) => `<option ${o === ed.outcome ? "selected" : ""}>${o}</option>`).join("")}</select></div>
      <div class="field" style="width:160px"><label>How it felt (1–5)</label><select id="rt">${[0, 1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${n === (ed.rating || 0) ? "selected" : ""}>${n ? "★".repeat(n) : "—"}</option>`).join("")}</select></div>
      <span style="flex:1"></span><button class="btn primary" id="sv" style="align-self:flex-end">Save</button></div></div>`);
    el.appendChild(f);
    OS.$("#sv", f).onclick = async () => {
      const b = { id: ed.id, company: OS.$("#co", f).value.trim(), role: OS.$("#ro", f).value, round: OS.$("#rd", f).value, date: OS.$("#dt", f).value, questions: OS.$("#qs", f).value, notes: OS.$("#nt", f).value, outcome: OS.$("#oc", f).value, rating: +OS.$("#rt", f).value };
      if (!b.company) return OS.toast("Company is required");
      const r = await post("/interviews", b);
      OS.toast("Saved" + (r.questions_added ? ` · ${r.questions_added} questions added to the mock bank` : ""));
      OS.go("#/interviews?r=" + Date.now());
    };
    const list = h(`<div class="card mt"><h3>History (${interviews.length})</h3><div class="list"></div></div>`);
    if (!interviews.length) list.lastElementChild.appendChild(h(`<div class="empty">No interviews logged yet.</div>`));
    for (const i of interviews) {
      const oc = { Passed: "ok", Offer: "ok", Rejected: "bad", Pending: "warn" }[i.outcome] || "";
      const row = h(`<div class="item"><div class="spread"><div><b>${esc(i.company)}</b> · ${esc(i.round || "")} ${i.role ? `<span class="dim">· ${esc(i.role)}</span>` : ""}<div class="xs dim">${esc(i.date)} ${i.rating ? "· " + "★".repeat(i.rating) : ""}</div></div>
        <div class="row"><span class="badge ${oc}">${esc(i.outcome)}</span><a class="btn sm ghost" href="#/interviews?edit=${i.id}">Edit</a><button class="btn sm ghost danger" data-del="${i.id}">✕</button></div></div>
        ${i.questions ? `<details class="mt"><summary class="small muted" style="cursor:pointer">Questions</summary><ul class="small">${i.questions.split("\n").filter((x) => x.trim()).map((q) => `<li>${esc(q)}</li>`).join("")}</ul></details>` : ""}${i.notes ? `<div class="small muted mt" style="white-space:pre-wrap">${esc(i.notes)}</div>` : ""}</div>`);
      OS.$("[data-del]", row).onclick = async () => { if (confirm("Delete this interview?")) { await OS.del("/interviews/" + i.id); row.remove(); } };
      list.lastElementChild.appendChild(row);
    }
    el.appendChild(list);
  };

  // ---------------------------------------------------------------- Revision
  OS.views["/revision"] = async (el, p) => {
    const tab = p.tab || "due";
    el.appendChild(h(`<div class="page-h"><div><h1>🔄 Revision</h1><p>What to review today, what you saved, where you're weak and every mistake you haven't fixed yet.</p></div></div>`));
    tabs(el, [["due", "📅 Due today"], ["bookmarks", "🔖 Bookmarks"], ["weak", "📉 Weak topics"], ["mistakes", "❌ Mistakes"]], tab, "#/revision");
    const body = h(`<div></div>`); el.appendChild(body);
    if (tab === "bookmarks") return bookmarksTab(body);
    if (tab === "weak") return weakTab(body);
    if (tab === "mistakes") return mistakesTab(body, p);
    const r = await post("/revision", { progress: OS.progressLite() });
    const c = r.cards;
    body.appendChild(h(`<div class="grid g3">
      <div class="card"><div class="kpi"><span class="v">${c.due}</span><span class="l">flashcards due</span></div><div class="xs dim">${c.reviews_due} reviews · ${c.new_today} new</div><a class="btn primary mt" href="#/cards?review=1">Review now</a></div>
      <div class="card"><div class="kpi"><span class="v">${r.plan_due.length}</span><span class="l">DSA problems due</span></div><div class="xs dim">spaced repetition from your DSA plan</div><a class="btn mt" href="/index.html#/plan">Open plan ↗</a></div>
      <div class="card"><div class="kpi"><span class="v">${r.mistakes_total}</span><span class="l">open mistakes</span></div><div class="xs dim">${r.bookmarks} bookmarks</div><a class="btn mt" href="#/revision?tab=mistakes">Fix mistakes</a></div></div>`));
    if (r.plan_due.length) body.appendChild(h(`<div class="card mt"><h3>🧩 Re-solve these today</h3><div class="list">${r.plan_due.map((x) => `<a class="item spread" style="color:inherit" href="${libHref(x)}" ${x.local ? "" : 'target="_blank"'}><span>${esc(x.title)}</span><span class="row"><span class="badge ${x.rating === "bombed" ? "bad" : x.rating === "shaky" ? "warn" : "ok"}">${esc(x.rating || "")}</span><span class="xs dim">due ${esc(x.due)}</span></span></a>`).join("")}</div></div>`));
    if (r.mistakes.length) body.appendChild(h(`<div class="card mt"><h3>❌ Most recent mistakes</h3><div class="list">${r.mistakes.map((m) => `<a class="item spread" style="color:inherit" href="${esc(m.href)}"><span>${esc(m.title || m.ref)}</span><span class="badge">${esc(m.label)}</span></a>`).join("")}</div></div>`));
    if (!r.plan_due.length && !r.mistakes.length && !c.due) body.appendChild(h(`<div class="card empty mt"><div class="big">🎉</div>Nothing due. Learn something new in <a href="#/learn">Learn</a> or take a <a href="#/mcq?start=1&mode=new">quiz</a>.</div>`));
  };

  async function bookmarksTab(body) {
    const all = await OS.bookmarks(true);
    if (!all.length) { body.appendChild(h(`<div class="card empty"><div class="big">🔖</div>No bookmarks yet. Use ☆ on topics, problems, MCQs, SQL, debugging exercises and scenarios.</div>`)); return; }
    const KIND = { topic: "📘 Topics", problem: "🧩 Problems", mcq: "✅ MCQs", sql: "🗄️ SQL", debug: "🐞 Debugging", scenario: "🚨 Scenarios", question: "❓ Questions" };
    const by = {}; all.forEach((b) => (by[b.kind] = by[b.kind] || []).push(b));
    for (const [k, items] of Object.entries(by)) {
      const c = h(`<div class="card mb"><h3>${KIND[k] || esc(k)} <span class="dim xs">${items.length}</span></h3><div class="list"></div></div>`);
      for (const b of items) {
        const row = h(`<div class="item spread"><a href="${esc(b.href || "#")}">${esc(b.title)}</a><span class="row"><span class="xs dim">${OS.ago(b.created)}</span><button class="btn sm ghost">✕</button></span></div>`);
        OS.$("button", row).onclick = async () => { await post("/bookmarks", { kind: b.kind, ref: b.ref, title: b.title }); row.remove(); };
        c.lastElementChild.appendChild(row);
      }
      body.appendChild(c);
    }
  }

  async function weakTab(body) {
    const w = await post("/weak", { progress: OS.progressLite() });
    if (!w.subjects.length && !w.decks.length && !w.plan.length) {
      body.appendChild(h(`<div class="card empty"><div class="big">📉</div>Not enough data yet. Weak topics appear after a few quizzes, SQL/debug attempts, mock rounds, flashcard reviews or DSA plan ratings.<div class="row mt" style="justify-content:center"><a class="btn" href="#/mcq?start=1">Take a quiz</a><a class="btn" href="#/mock">Mock round</a></div></div>`));
      return;
    }
    if (w.subjects.length) {
      const c = h(`<div class="card mb"><h3>🎯 Subjects by accuracy (last 90 days)</h3><div class="col"></div></div>`);
      for (const s of w.subjects) {
        c.lastElementChild.appendChild(h(`<div><div class="spread small"><b>${esc(s.name)}</b><span class="row"><span class="xs dim">${s.n} graded answers · ${Object.entries(s.kinds).map(([k, v]) => k + (v.avg != null ? " " + v.avg + "/10" : " " + v.acc + "%")).join(" · ")}</span><b style="color:${OS.scoreColor((s.accuracy || 0) / 10)}">${s.accuracy}%</b></span></div>
          <div class="bar"><i style="width:${s.accuracy}%;background:${OS.scoreColor((s.accuracy || 0) / 10)}"></i></div>
          ${s.study ? `<div class="row xs mt">${s.study.map((t) => `<a class="chip" href="${OS.topicHref(t.section, t.id)}">📘 ${esc(t.title.split(":")[0])}</a>`).join("")}${s.id && OS.$ ? `<a class="chip" href="#/mcq?start=1&subject=${s.id}">✅ quiz</a>` : ""}</div>` : ""}</div>`));
      }
      body.appendChild(c);
    }
    if (w.plan.length) body.appendChild(h(`<div class="card mb"><h3>🧩 DSA problems you bombed or were shaky on (${w.plan.length})</h3><div class="list">${w.plan.map((x) => `<a class="item spread" style="color:inherit" href="${libHref(x)}" ${x.local ? "" : 'target="_blank"'}><span>${esc(x.title)} <span class="xs dim">${esc(x.group)}</span></span><span class="badge ${x.rating === "bombed" ? "bad" : "warn"}">${x.rating}</span></a>`).join("")}</div></div>`));
    if (w.decks.length) body.appendChild(h(`<div class="card"><h3>🃏 Flashcard decks you keep forgetting</h3><div class="list">${w.decks.map((d) => `<div class="item spread small"><span>${esc(d.deck)}</span><span class="dim">${d.lapses} lapses / ${d.cards} cards · ease ${d.ease}</span></div>`).join("")}</div><a class="btn mt" href="#/cards?review=1">Review cards</a></div>`));
  }

  async function mistakesTab(body, p) {
    const { mistakes } = await get("/mistakes" + (p.all ? "?all=1" : ""));
    const kinds = [...new Set(mistakes.map((m) => m.kind))];
    let f = p.kind || "";
    const bar = h(`<div class="row mb"><a class="chip ${!f ? "on" : ""}" href="#/revision?tab=mistakes">All (${mistakes.length})</a>${kinds.map((k) => { const m = mistakes.find((x) => x.kind === k); return `<a class="chip ${f === k ? "on" : ""}" href="#/revision?tab=mistakes&kind=${k}">${esc(m.label)} (${mistakes.filter((x) => x.kind === k).length})</a>`; }).join("")}
      <span style="flex:1"></span>${mistakes.some((m) => m.kind === "mcq") ? `<a class="btn sm" href="#/mcq?mode=mistakes">↻ Retry wrong MCQs</a>` : ""}<a class="btn sm ghost" href="#/revision?tab=mistakes${p.all ? "" : "&all=1"}">${p.all ? "Hide resolved" : "Show resolved"}</a></div>`);
    body.appendChild(bar);
    const rows = mistakes.filter((m) => !f || m.kind === f);
    if (!rows.length) { body.appendChild(h(`<div class="card empty"><div class="big">✨</div>No open mistakes. Wrong MCQs, failed SQL/debug runs, low-scoring mock & scenario answers and failed test submissions all land here.</div>`)); return; }
    const c = h(`<div class="card"><div class="list"></div></div>`);
    for (const m of rows) {
      const row = h(`<div class="item"><div class="spread" style="align-items:flex-start"><div style="flex:1;min-width:0"><a href="${esc(m.href)}">${esc(m.title || m.ref)}</a>
        <div class="xs dim">${esc(m.label)}${m.subject_name ? " · " + esc(m.subject_name) : ""} · missed ${m.misses}× · ${OS.ago(m.last)}${m.worst != null ? " · worst " + m.worst + "/10" : ""}${m.resolved ? " · ✅ resolved" : ""}</div>
        ${m.answer ? `<div class="small mt">✔ <b>${esc(m.answer)}</b> — <span class="muted">${esc(m.why)}</span></div>` : ""}</div>
        <span class="row"><a class="btn sm" href="${esc(m.href)}">Retry</a>${m.resolved ? "" : `<button class="btn sm ghost" title="Mark as understood">✓ Got it</button>`}</span></div></div>`);
      const b = OS.$("button", row);
      if (b) b.onclick = async () => { await post("/mistakes/resolve", { kind: m.kind, ref: m.ref }); row.remove(); };
      c.lastElementChild.appendChild(row);
    }
    body.appendChild(c);
  }

  // ---------------------------------------------------------------- Resume
  OS.views["/resume"] = async (el, p) => {
    const tab = p.tab || "analysis";
    const { resume } = await get("/resume");
    el.appendChild(h(`<div class="page-h"><div><h1>📄 Resume</h1><p>Score your resume like a recruiter skims it, match it to a job description, and practice the questions an interviewer will ask from it. Stays on your server.</p></div></div>`));
    tabs(el, [["analysis", "🔍 Resume analysis"], ["questions", "❓ Resume questions"]], tab, "#/resume");
    const f = h(`<div class="grid g2"><div class="field"><label>Resume (paste plain text)</label><textarea id="rt" rows="14" placeholder="Paste your resume text…">${esc(resume.text || "")}</textarea></div>
      <div class="field"><label>Job description (optional — for match %)</label><textarea id="jd" rows="14" placeholder="Paste the JD…">${esc(resume.jd || "")}</textarea></div></div>`);
    el.appendChild(f);
    const btn = h(`<div class="row mt"><button class="btn primary lg" id="go">${tab === "questions" ? "❓ Generate interview questions" : "🔍 Analyze"}</button></div>`);
    el.appendChild(btn);
    const out = h(`<div class="mt"></div>`); el.appendChild(out);
    const run = async () => {
      const text = OS.$("#rt", f).value, jd = OS.$("#jd", f).value;
      if (!text.trim()) return OS.toast("Paste your resume first");
      out.innerHTML = `<div class="card"><span class="spinner"></span> working…</div>`;
      try {
        if (tab === "questions") {
          await post("/resume/analyze", { text, jd });
          const r = await post("/resume/questions", { text });
          out.innerHTML = "";
          const c = h(`<div class="card pad-lg"><div class="spread"><h2 style="margin:0">${r.questions.length} questions an interviewer could ask you</h2><div class="row"><button class="btn" id="cards">🃏 All → flashcards</button><button class="btn primary" id="mock">🎙️ Practice 6 of them</button></div></div>
            <div class="small muted mt">Based on: ${r.skills.map((s) => `<span class="badge">${esc(s)}</span>`).join(" ")}</div><div class="list mt"></div></div>`);
          for (const q of r.questions) c.lastElementChild.appendChild(h(`<details class="item qa"><summary><span class="badge acc">${esc(q.kind)}</span> ${esc(q.q)}</summary><div class="a small">${(q.points || []).map((x) => `<div>• ${esc(x)}</div>`).join("")}</div></details>`));
          out.appendChild(c);
          OS.$("#cards", c).onclick = () => OS.saveCards(r.questions.map((q) => ({ front: q.q, back: (q.points || []).map((x) => "• " + x).join("\n") })), "Resume questions", "resume");
          OS.$("#mock", c).onclick = () => { OS.state.customMock = { track: "resume", track_name: "Resume deep dive", company: "", minutes_per_q: 4, questions: r.questions.slice(0, 6).map((q) => ({ q: q.q, points: q.points || [], followups: [] })) }; OS.go("#/mock?custom=1"); };
        } else {
          const r = await post("/resume/analyze", { text, jd });
          out.innerHTML = "";
          const sec = Object.entries(r.sections).map(([k, v]) => `<span class="badge ${v ? "ok" : "warn"}">${v ? "✓" : "✗"} ${k}</span>`).join(" ");
          const ln = Object.entries(r.links).map(([k, v]) => `<span class="badge ${v ? "ok" : ""}">${v ? "✓" : "✗"} ${k}</span>`).join(" ");
          out.appendChild(h(`<div><div class="grid g3"><div class="card row" style="gap:16px">${OS.ring(r.score / 10, 88, r.score)}<div class="kpi"><span class="v">${r.score >= 80 ? "Strong" : r.score >= 60 ? "Good" : r.score >= 40 ? "Needs work" : "Weak"}</span><span class="l">resume score / 100</span></div></div>
            <div class="card"><div class="kpi"><span class="v">${r.quantified}/${r.bullets}</span><span class="l">bullets with numbers</span></div><div class="bar mt"><i style="width:${pct(r.quantified, r.bullets)}%"></i></div><div class="xs dim mt">${r.verb_led}/${r.bullets} start with an action verb · ${r.words} words</div></div>
            ${r.jd ? `<div class="card"><div class="kpi"><span class="v">${r.jd.coverage == null ? "–" : r.jd.coverage + "%"}</span><span class="l">JD skill match</span></div><div class="small mt">✗ Missing: ${r.jd.missing.map((s) => `<span class="badge bad">${esc(s)}</span>`).join(" ") || "—"}</div></div>` : `<div class="card"><div class="kpi"><span class="v">${r.skills.length}</span><span class="l">skills detected</span></div><div class="xs dim mt">Add a JD for a match score</div></div>`}</div>
            <div class="grid g2 mt"><div class="card"><h3>🛠️ Fix these first</h3>${r.tips.map((t) => `<div class="point small">${esc(t)}</div>`).join("") || `<div class="small muted">Looks solid.</div>`}</div>
            <div class="card"><h3>🧱 Structure</h3><div class="row">${sec}</div><h3 class="mt">🔗 Contact & links</h3><div class="row">${ln}</div><h3 class="mt">🧠 Skills found</h3><div class="row">${r.skills.map((s) => `<span class="badge acc">${esc(s)}</span>`).join(" ") || "—"}</div>${r.jd && r.jd.matched.length ? `<h3 class="mt">✅ Matches JD</h3><div class="row">${r.jd.matched.map((s) => `<span class="badge ok">${esc(s)}</span>`).join(" ")}</div>` : ""}</div></div>
            ${r.weak.length ? `<div class="card mt"><h3>✏️ Weak phrasing (${r.weak.length})</h3>${r.weak.map((w) => `<div class="point small">${esc(w.bullet)} <span class="xs" style="color:var(--warn)">→ “${w.phrases.map(esc).join("”, “")}”</span></div>`).join("")}<div class="xs dim mt">Rewrite as: Action verb + what you did + how + measurable result (e.g. “Cut p99 latency 40% by adding Redis read-through caching for 2M daily users”).</div></div>` : ""}
            <div class="row mt"><a class="btn" href="#/resume?tab=questions">❓ Generate the questions they'll ask →</a><a class="btn" href="#/jd">🎯 Full JD matcher + study plan</a></div></div>`));
        }
      } catch (e) { out.innerHTML = `<div class="card">❌ ${esc(e.message)}</div>`; }
    };
    OS.$("#go", btn).onclick = run;
    if (resume.text) run();
  };

  // ---------------------------------------------------------------- Analytics
  OS.views["/analytics"] = async (el, p) => {
    const tab = p.tab || "progress";
    const a = await post("/analytics", { progress: OS.progressLite() });
    el.appendChild(h(`<div class="page-h"><div><h1>📊 Analytics</h1><p>Where you stand, what's improving and what isn't — built from every quiz, run, review and mock you do.</p></div></div>`));
    el.appendChild(h(`<div class="grid g4 mb">
      <div class="card kpi"><span class="v">${a.totals.attempts}</span><span class="l">graded answers</span></div>
      <div class="card kpi"><span class="v">${a.totals.days}</span><span class="l">active days</span></div>
      <div class="card kpi"><span class="v">${a.mocks.length}</span><span class="l">mock sessions</span></div>
      <div class="card kpi"><span class="v">${a.cards.retention30 == null ? "–" : a.cards.retention30 + "%"}</span><span class="l">card retention (30d)</span></div></div>`));
    tabs(el, [["progress", "📈 Progress"], ["skills", "🧠 Skills"], ["accuracy", "🎯 Accuracy"], ["history", "🗂️ Interview history"]], tab, "#/analytics");
    const body = h(`<div></div>`); el.appendChild(body);
    const P = a.progress;
    if (tab === "progress") {
      const rows = [["📘 Topics done", P.topics_done, P.topics_total, "/index.html#/topics"], ["🧩 Practice problems solved", P.problems_solved, P.problems_total, "/index.html#/practice"],
        ["🗓️ DSA plan attempted", P.plan_attempted, P.plan_total, "/index.html#/plan"], ["🏆 DSA plan mastered", P.plan_mastered, P.plan_total, "/index.html#/plan"],
        ["✅ MCQs answered", P.mcq_answered, P.mcq_total, "#/mcq"], ["🗄️ SQL solved", P.sql_solved, P.sql_total, "#/sql"], ["🐞 Bugs fixed", P.debug_solved, P.debug_total, "#/debug"],
        ["🚨 Scenarios attempted", P.scenarios_done, P.scenarios_total, "#/scenarios"], ["🃏 Flashcards learned", a.cards.learned || 0, a.cards.total || 0, "#/cards"], ["🌳 Flashcards mature (21d+)", a.cards.mature || 0, a.cards.total || 0, "#/cards"]];
      body.appendChild(h(`<div class="card"><div class="col">${rows.map(([l, x, n, href]) => `<a href="${href}" style="color:inherit;text-decoration:none"><div class="spread small"><span>${l}</span><span><b>${x}</b> <span class="dim">/ ${n} · ${pct(x, n)}%</span></span></div><div class="bar"><i style="width:${pct(x, n)}%"></i></div></a>`).join("")}</div></div>`));
      body.appendChild(h(`<div class="card mt"><h3>🗓️ Weekly activity</h3>${chart(a.trend.map((t) => ({ l: t.week, v: t.attempts + t.reviews + t.mocks })), "items")}</div>`));
    } else if (tab === "skills") {
      const sk = a.skills.slice().sort((x, y) => y.score - x.score);
      body.appendChild(h(`<div class="card"><div class="small muted mb">Skill score = 40% topic coverage + 40% practice accuracy + 20% mock score (whatever data exists).</div><div class="col">${sk.map((s) => `<a href="#/learn/${s.id}" style="color:inherit;text-decoration:none"><div class="spread small"><span>${s.icon} <b>${esc(s.name)}</b> <span class="xs dim">${s.done}% topics${s.accuracy != null ? " · " + s.accuracy + "% accuracy" : ""}${s.mock != null ? " · mock " + s.mock : ""} · ${s.attempts} answers</span></span><b style="color:${OS.scoreColor(s.score / 10)}">${s.score}</b></div><div class="bar"><i style="width:${s.score}%;background:${OS.scoreColor(s.score / 10)}"></i></div></a>`).join("")}</div></div>`));
      body.appendChild(h(`<div class="row mt"><a class="btn" href="#/revision?tab=weak">📉 Weak topics & what to study</a></div>`));
    } else if (tab === "accuracy") {
      body.appendChild(h(`<div class="grid g2"><div class="card"><h3>🎯 By practice type</h3>${a.kinds.length ? `<table class="tbl"><tr><th>Type</th><th>All time</th><th>Last 30 days</th></tr>${a.kinds.map((k) => `<tr><td>${esc(k.label)}</td><td>${k.accuracy}% <span class="dim xs">(${k.n})</span></td><td>${k.accuracy30 == null ? "–" : k.accuracy30 + "%"} <span class="dim xs">(${k.n30})</span></td></tr>`).join("")}</table>` : `<div class="muted small">No graded answers yet.</div>`}</div>
        <div class="card"><h3>🎙️ Mock scores by track</h3>${a.tracks.length ? `<table class="tbl"><tr><th>Track</th><th>Sessions</th><th>Avg</th><th>First → last</th><th>Best</th></tr>${a.tracks.map((t) => `<tr><td>${esc(t.name)}</td><td>${t.sessions}</td><td><b style="color:${OS.scoreColor(t.avg)}">${t.avg}</b></td><td>${t.first} → ${t.last} ${t.last > t.first ? "📈" : t.last < t.first ? "📉" : ""}</td><td>${t.best}</td></tr>`).join("")}</table>` : `<div class="muted small">No mock sessions yet.</div>`}</div></div>`));
      body.appendChild(h(`<div class="grid g2 mt"><div class="card"><h3>📈 Weekly accuracy</h3>${chart(a.trend.map((t) => ({ l: t.week, v: t.accuracy })), "%", 100)}</div>
        <div class="card"><h3>🎙️ Weekly mock average</h3>${chart(a.trend.map((t) => ({ l: t.week, v: t.mock })), "/10", 10)}</div>
        <div class="card"><h3>🃏 Weekly flashcard retention</h3>${chart(a.trend.map((t) => ({ l: t.week, v: t.retention })), "%", 100)}</div></div>`));
    } else {
      const items = [...a.mocks.map((m) => ({ ts: m.started, kind: "mock", m })), ...a.interviews.map((i) => ({ ts: Date.parse(i.date || "") / 1000 || i.created, kind: "real", i }))].sort((x, y) => y.ts - x.ts);
      const real = a.interviews, passed = real.filter((i) => ["Passed", "Offer"].includes(i.outcome)).length, decided = real.filter((i) => i.outcome !== "Pending" && i.outcome !== "Withdrew").length;
      body.appendChild(h(`<div class="grid g3 mb"><div class="card kpi"><span class="v">${real.length}</span><span class="l">real interviews</span></div><div class="card kpi"><span class="v">${decided ? pct(passed, decided) + "%" : "–"}</span><span class="l">pass rate</span></div><div class="card kpi"><span class="v">${a.mocks.length}</span><span class="l">mock sessions</span></div></div>`));
      const c = h(`<div class="card"><div class="spread"><h3>Timeline</h3><a class="btn sm" href="#/interviews">➕ Log a real interview</a></div><div class="list"></div></div>`);
      if (!items.length) c.lastElementChild.appendChild(h(`<div class="empty">No interviews yet — do a <a href="#/mock">mock</a> or log a real one.</div>`));
      for (const it of items) {
        if (it.kind === "mock") c.lastElementChild.appendChild(h(`<a class="item spread" style="color:inherit" href="#/mock?session=${it.m.id}"><span>🎙️ Mock · ${esc(it.m.track)}${it.m.company ? " · " + esc(it.m.company) : ""}<div class="xs dim">${OS.fmtDate(it.m.started)} · ${Math.round(((it.m.ended || it.m.started) - it.m.started) / 60)} min</div></span><b style="color:${OS.scoreColor(it.m.score || 0)}">${it.m.score == null ? "–" : it.m.score}</b></a>`));
        else c.lastElementChild.appendChild(h(`<a class="item spread" style="color:inherit" href="#/interviews?edit=${it.i.id}"><span>🏢 <b>${esc(it.i.company)}</b> · ${esc(it.i.round || "interview")}<div class="xs dim">${esc(it.i.date)} ${it.i.role ? "· " + esc(it.i.role) : ""}</div></span><span class="badge ${["Passed", "Offer"].includes(it.i.outcome) ? "ok" : it.i.outcome === "Rejected" ? "bad" : "warn"}">${esc(it.i.outcome)}</span></a>`));
      }
      body.appendChild(c);
    }
  };

  // tiny SVG bar chart; null values render as gaps
  function chart(pts, unit, max) {
    const vals = pts.map((x) => x.v).filter((v) => v != null);
    if (!vals.length) return `<div class="muted small">No data yet.</div>`;
    const M = max || Math.max(1, ...vals), W = 560, H = 140, bw = W / pts.length;
    return `<svg viewBox="0 0 ${W} ${H + 22}" style="width:100%;height:auto">${pts.map((x, i) => {
      if (x.v == null) return `<text x="${i * bw + bw / 2}" y="${H + 16}" font-size="10" text-anchor="middle" fill="var(--dim)">${esc(x.l.split(" ")[1] || x.l)}</text>`;
      const bh = Math.max(2, (x.v / M) * (H - 16));
      return `<rect x="${i * bw + 4}" y="${H - bh}" width="${bw - 8}" height="${bh}" rx="3" fill="var(--accent)" opacity=".85"><title>${esc(x.l)}: ${x.v}${unit === "items" ? " items" : unit}</title></rect>
        <text x="${i * bw + bw / 2}" y="${H - bh - 4}" font-size="10" text-anchor="middle" fill="var(--muted)">${x.v}</text><text x="${i * bw + bw / 2}" y="${H + 16}" font-size="10" text-anchor="middle" fill="var(--dim)">${esc(x.l.split(" ")[1] || x.l)}</text>`;
    }).join("")}</svg>`;
  }
})();
