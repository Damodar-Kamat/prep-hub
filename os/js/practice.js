/* Learn hub + Practice: MCQ quizzes, SQL sandbox, debugging exercises, production scenarios. */
(function () {
  const { h, esc, get, post } = OS;

  // ---------------------------------------------------------------- shared helpers
  // Prep Hub progress lives in this origin's localStorage (same server) — read it directly.
  if (!OS.prephub) OS.prephub = () => { let d = {}; try { d = JSON.parse(localStorage.getItem("prephub.progress.v1") || "{}") || {}; } catch (_) {} return Object.assign({ topics: {}, problems: {}, code: {}, plan: {}, activity: {} }, d); };
  // what the server needs for analytics (skip saved code — it can be large)
  OS.progressLite = () => { const d = OS.prephub(); return { topics: d.topics, problems: d.problems, plan: d.plan }; };
  OS.topicHref = (sec, id) => `/index.html#/topic/${sec}/${id}`;

  let bmCache = null;
  OS.bookmarks = async (force) => {
    if (!bmCache || force) { try { bmCache = (await get("/bookmarks")).bookmarks; } catch (_) { bmCache = []; } }
    return bmCache;
  };
  window.addEventListener("hashchange", () => { bmCache = null; });
  // ☆ / ★ toggle; `kind`+`ref` identify the item
  OS.bmBtn = (kind, ref, title, href) => {
    const b = h(`<button class="btn sm ghost bm" title="Bookmark">☆</button>`);
    OS.bookmarks().then((all) => { if (all.find((x) => x.kind === kind && x.ref === String(ref))) { b.textContent = "★"; b.classList.add("on"); } });
    b.onclick = async (e) => {
      e.preventDefault(); e.stopPropagation();
      const r = await post("/bookmarks", { kind, ref: String(ref), title, href: href || "" });
      b.textContent = r.bookmarked ? "★" : "☆"; b.classList.toggle("on", r.bookmarked);
      bmCache = null; OS.toast(r.bookmarked ? "🔖 Bookmarked" : "Bookmark removed");
    };
    return b;
  };
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const accBadge = (a) => a == null ? `<span class="badge">—</span>` : `<span class="badge ${a >= 75 ? "ok" : a >= 50 ? "warn" : "bad"}">${a}%</span>`;

  // ---------------------------------------------------------------- Learn hub
  OS.views["/learn"] = async (el, p, path) => {
    const { subjects } = await get("/learn");
    const done = OS.prephub().topics || {};
    const sid = path.split("/")[2];
    if (sid) return learnSubject(el, subjects.find((s) => s.id === sid) || subjects[0], done);
    el.appendChild(h(`<div class="page-h"><div><h1>📚 Learn</h1><p>Every subject in one place — curated topics with key points and deep dives, quizzes and mock rounds for each. Topic ticks come from the study library.</p></div><a class="btn" href="/index.html#/topics">📖 Open full library ↗</a></div>`));
    const g = h(`<div class="grid g3"></div>`);
    for (const s of subjects) {
      const d = s.topics.filter((t) => done[t.id]).length;
      g.appendChild(h(`<a class="card subj" href="#/learn/${s.id}" style="color:inherit;text-decoration:none">
        <div class="spread"><span style="font-size:1.6rem">${s.icon}</span><span class="xs dim">${d}/${s.topics.length} done</span></div>
        <h3 style="margin:6px 0 2px">${esc(s.name)}</h3><div class="small muted">${esc(s.blurb)}</div>
        <div class="bar mt"><i style="width:${pct(d, s.topics.length)}%"></i></div>
        <div class="row mt xs dim"><span>${s.topics.length} topics</span>${s.mcq ? `<span>· ${s.mcq} MCQs</span>` : ""}<span>· ${s.tracks.length} mock tracks</span></div></a>`));
    }
    el.appendChild(g);
  };

  function learnSubject(el, s, done) {
    el.appendChild(h(`<div class="page-h"><div><div class="small muted"><a href="#/learn">Learn</a> /</div><h1>${s.icon} ${esc(s.name)}</h1><p>${esc(s.blurb)}</p></div>
      <div class="row">${s.mcq ? `<a class="btn" href="#/mcq?subject=${s.id}">✅ Quiz (${s.mcq})</a>` : ""}${s.tracks.map((t) => `<a class="btn" href="#/mock?start=1&track=${t}">🎙️ ${esc(t)} mock</a>`).join("")}<a class="btn" href="#/ask?q=${encodeURIComponent(s.name + " interview questions")}">🔭 Research</a></div></div>`));
    const d = s.topics.filter((t) => done[t.id]).length;
    el.appendChild(h(`<div class="card mb"><div class="spread"><b>${d} of ${s.topics.length} topics done</b><span class="xs dim">Mark topics done in the library</span></div><div class="bar mt"><i style="width:${pct(d, s.topics.length)}%"></i></div></div>`));
    const list = h(`<div class="card"><div class="list"></div></div>`);
    for (const t of s.topics) {
      const row = h(`<div class="item spread" style="align-items:flex-start"><div style="min-width:0;flex:1">
        <a href="${OS.topicHref(t.section, t.id)}"><b>${done[t.id] ? "✅ " : ""}${esc(t.title)}</b></a>
        ${t.summary ? `<div class="small muted">${esc(t.summary)}</div>` : ""}
        <div class="row xs mt" style="gap:12px"><a href="${OS.topicHref(t.section, t.id)}?m=key">★ Key points</a><a href="${OS.topicHref(t.section, t.id)}?m=deep">📖 Deep dive</a><a href="#/mock?track=custom&topic=${encodeURIComponent(t.title)}">🎙️ Mock on this</a></div></div></div>`);
      row.appendChild(OS.bmBtn("topic", t.id, t.title, OS.topicHref(t.section, t.id)));
      list.firstElementChild.appendChild(row);
    }
    el.appendChild(list);
  }

  // ---------------------------------------------------------------- Practice hub
  OS.views["/practice"] = async (el) => {
    const [a, sql, dbg, sc] = await Promise.all([post("/analytics", { progress: OS.progressLite() }), get("/sql"), get("/debug"), get("/scenarios")]);
    const pr = a.progress;
    el.appendChild(h(`<div class="page-h"><div><h1>💻 Practice</h1><p>Graded practice of every kind. Every answer feeds your accuracy, weak topics and mistakes log.</p></div></div>`));
    const tiles = [
      ["🧩", "Coding — DSA problems", `${pr.problems_solved}/${pr.problems_total} solved · ${pr.plan_attempted}/${pr.plan_total} plan problems`, "/index.html#/practice", "Run Java/Python/C++/JS against tests, with 'if stuck' ladders and an interview timer.", pct(pr.problems_solved, pr.problems_total)],
      ["✅", "MCQ quizzes", `${pr.mcq_answered}/${pr.mcq_total} answered`, "#/mcq", "Quick concept checks across 14 subjects with explanations.", pct(pr.mcq_answered, pr.mcq_total)],
      ["🗄️", "SQL", `${pr.sql_solved}/${pr.sql_total} solved`, "#/sql", "Write real queries against a seeded database — graded on the result set.", pct(pr.sql_solved, pr.sql_total)],
      ["🐞", "Debugging", `${pr.debug_solved}/${pr.debug_total} fixed`, "#/debug", "Find and fix the bug — your fix is run against hidden tests.", pct(pr.debug_solved, pr.debug_total)],
      ["🚨", "Scenarios", `${pr.scenarios_done}/${pr.scenarios_total} attempted`, "#/scenarios", "Production incidents & judgement calls, graded against a rubric.", pct(pr.scenarios_done, pr.scenarios_total)],
      ["⌨️", "Code lab", "free-form runner", "#/lab", "Scratchpad with real stdin for Java, Python, C++, Node.", null],
    ];
    const g = h(`<div class="grid g3"></div>`);
    for (const [ic, name, stat, href, desc, p] of tiles) {
      g.appendChild(h(`<a class="card subj" href="${href}" style="color:inherit;text-decoration:none"><div class="spread"><span style="font-size:1.6rem">${ic}</span><span class="xs dim">${stat}</span></div>
        <h3 style="margin:6px 0 2px">${name}</h3><div class="small muted">${desc}</div>${p == null ? "" : `<div class="bar mt"><i style="width:${p}%"></i></div>`}</a>`));
    }
    el.appendChild(g);
    const acc = a.kinds.length ? a.kinds.map((k) => `<div class="spread small"><span>${esc(k.label)} <span class="dim">· ${k.n} attempts</span></span>${accBadge(k.accuracy)}</div>`).join("") : `<div class="muted small">No attempts yet — start anywhere above.</div>`;
    el.appendChild(h(`<div class="grid g2 mt"><div class="card"><h3>🎯 Accuracy by practice type</h3><div class="col">${acc}</div><a class="small mt" style="display:block" href="#/analytics">Full analytics →</a></div>
      <div class="card"><h3>❌ Fix your mistakes</h3><div class="small muted">Questions you got wrong stay in the Mistakes log until you get them right.</div><div class="row mt"><a class="btn" href="#/revision?tab=mistakes">Open mistakes log</a><a class="btn" href="#/mcq?mode=mistakes">Retry wrong MCQs</a></div></div></div>`));
  };

  // ---------------------------------------------------------------- MCQ
  OS.views["/mcq"] = async (el, p) => {
    if (p.retry || p.ids) return quiz(el, { ids: p.retry || p.ids });
    if (p.start || p.mode === "mistakes") return quiz(el, { subject: p.subject || "", mode: p.mode || "", count: p.count || 10 });
    const { subjects } = await get("/mcq?count=0");
    el.appendChild(h(`<div class="page-h"><div><h1>✅ MCQ quizzes</h1><p>10 quick questions at a time. Wrong answers go to your Mistakes log; get them right later to clear them.</p></div>
      <div class="row"><a class="btn" href="#/mcq?start=1&mode=new">🆕 Unseen questions</a><a class="btn" href="#/mcq?mode=mistakes">❌ Retry mistakes</a><a class="btn primary" href="#/mcq?start=1">🎲 Mixed quiz</a></div></div>`));
    const g = h(`<div class="grid g4"></div>`);
    for (const s of subjects) {
      g.appendChild(h(`<a class="card subj" href="#/mcq?start=1&subject=${s.id}" style="color:inherit;text-decoration:none"><div class="spread"><b>${esc(s.name)}</b>${accBadge(s.accuracy)}</div>
        <div class="xs dim mt">${s.answered}/${s.total} answered</div><div class="bar mt"><i style="width:${pct(s.answered, s.total)}%"></i></div></a>`));
    }
    el.appendChild(g);
    if (p.subject) OS.go("#/mcq?start=1&subject=" + p.subject);
  };

  async function quiz(el, o) {
    const qs = o.ids ? `ids=${encodeURIComponent(o.ids)}` : `subject=${o.subject || ""}&mode=${o.mode || ""}&count=${o.count || 10}`;
    const { questions } = await get("/mcq?" + qs);
    if (!questions.length) {
      el.appendChild(h(`<div class="card empty"><div class="big">🎉</div>${o.mode === "mistakes" ? "No open MCQ mistakes — nice." : "No questions here."}<div class="mt"><a class="btn" href="#/mcq">Back to quizzes</a></div></div>`));
      return;
    }
    let i = 0, right = 0;
    const wrong = [];
    const wrap = h(`<div style="max-width:820px"><div class="spread mb"><div><div class="small muted"><a href="#/mcq">MCQ</a> / ${esc(o.subject || (o.mode === "mistakes" ? "mistakes" : "mixed"))}</div><h2 style="margin:0" id="qn"></h2></div><span class="badge acc" id="sc"></span></div>
      <div class="bar mb"><i id="prog" style="width:0"></i></div><div id="box"></div></div>`);
    el.appendChild(wrap);
    const box = OS.$("#box", wrap);
    function show() {
      const q = questions[i];
      OS.$("#qn", wrap).textContent = `Question ${i + 1} of ${questions.length}`;
      OS.$("#sc", wrap).textContent = `${right} correct`;
      OS.$("#prog", wrap).style.width = (100 * i) / questions.length + "%";
      box.innerHTML = "";
      const c = h(`<div class="card pad-lg"><div class="spread" style="align-items:flex-start"><div class="mock-q" style="flex:1">${esc(q.q)}</div></div><div class="col mt" id="opts"></div><div id="why"></div></div>`);
      OS.$(".spread", c).appendChild(OS.bmBtn("mcq", q.id, q.q, "#/mcq?ids=" + q.id));
      q.options.forEach((opt, k) => {
        const b = h(`<button class="opt-btn"><span class="k">${"ABCD"[k]}</span>${esc(opt)}</button>`);
        b.onclick = () => answer(k);
        OS.$("#opts", c).appendChild(b);
      });
      box.appendChild(c);
      const keys = (e) => { const k = "abcd1234".indexOf(e.key.toLowerCase()); if (k >= 0 && !c.dataset.done) { e.preventDefault(); answer(k % 4); } };
      document.onkeydown = keys;
      async function answer(k) {
        if (c.dataset.done || k >= q.options.length) return;
        c.dataset.done = 1;
        const r = await post("/mcq/answer", { id: q.id, choice: k });
        if (r.correct) right++; else wrong.push(q);
        OS.$$(".opt-btn", c).forEach((b, j) => { b.disabled = true; if (j === r.answer) b.classList.add("ok"); else if (j === k) b.classList.add("bad"); });
        OS.$("#why", c).appendChild(h(`<div class="def mt small">${r.correct ? "✅ Correct." : "❌ Not quite."} ${esc(r.why)}</div>`));
        OS.$("#why", c).appendChild(h(`<div class="row mt"><button class="btn primary" id="nx">${i === questions.length - 1 ? "Finish" : "Next →"}</button><span class="xs dim">Enter ↵</span></div>`));
        OS.$("#sc", wrap).textContent = `${right} correct`;
        const nx = OS.$("#nx", c); nx.focus();
        nx.onclick = () => { i++; if (i >= questions.length) finish(); else show(); };
      }
    }
    function finish() {
      document.onkeydown = null;
      const s = Math.round((10 * right) / questions.length);
      box.innerHTML = "";
      OS.$("#prog", wrap).style.width = "100%";
      box.appendChild(h(`<div class="card pad-lg"><div class="row" style="gap:18px">${OS.ring(s, 88, pct(right, questions.length) + "%")}<div><h2 style="margin:0">${right} / ${questions.length} correct</h2><div class="muted small">${wrong.length ? wrong.length + " added to your Mistakes log" : "Clean sweep!"}</div></div></div>
        ${wrong.length ? `<h3 class="mt2">Review</h3>${wrong.map((q) => `<div class="point small">${esc(q.q)}</div>`).join("")}` : ""}
        <div class="row mt2"><a class="btn primary" href="#/mcq?start=1&subject=${o.subject || ""}&r=${Date.now()}">Another quiz</a>${wrong.length ? `<a class="btn" href="#/mcq?ids=${wrong.map((q) => q.id).join(",")}">↻ Retry the ${wrong.length} wrong</a>` : ""}<a class="btn" href="#/mcq">All subjects</a></div></div>`));
    }
    show();
  }

  // ---------------------------------------------------------------- SQL
  OS.views["/sql"] = async (el, p) => {
    const d = await get("/sql");
    const solved = new Set(d.solved);
    let cur = d.challenges.find((c) => c.id === p.id) || d.challenges.find((c) => !solved.has(c.id)) || d.challenges[0];
    el.appendChild(h(`<div class="page-h"><div><h1>🗄️ SQL practice</h1><p>Real SQLite. Every run uses a fresh copy of the database, so experiment freely. Graded by comparing your result set with the expected one.</p></div><span class="badge acc">${solved.size}/${d.challenges.length} solved</span></div>`));
    const w = h(`<div class="grid" style="grid-template-columns:260px minmax(0,1fr)"><div class="card side-list" id="list"></div><div class="col" id="main"></div></div>`);
    el.appendChild(w);
    const lv = ["", "Easy", "Medium", "Hard"];
    const drawList = () => {
      OS.$("#list", w).innerHTML = d.challenges.map((c, i) => `<a class="sl-item ${c.id === cur.id ? "on" : ""}" data-id="${c.id}"><span>${solved.has(c.id) ? "✅" : `<span class="dim">${i + 1}.</span>`}</span><span style="flex:1">${esc(c.title)}</span><span class="xs lv${c.level}">${lv[c.level]}</span></a>`).join("");
      OS.$$("[data-id]", w).forEach((a) => (a.onclick = () => { cur = d.challenges.find((c) => c.id === a.dataset.id); history.replaceState(null, "", "#/sql?id=" + cur.id); drawList(); drawMain(); }));
    };
    const schemaHtml = d.schema.map((t) => `<div class="small"><b class="mono">${t.name}</b> <span class="dim xs">(${t.rows} rows)</span><div class="mono xs muted">${t.columns.map((c) => c[0] + " " + c[1].toLowerCase()).join(", ")}</div></div>`).join("");
    const table = (cols, rows) => `<div class="tbl-wrap"><table class="tbl"><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((v) => `<td>${v == null ? '<span class="dim">NULL</span>' : esc(v)}</td>`).join("")}</tr>`).join("")}</table></div>`;
    function drawMain() {
      const m = OS.$("#main", w); m.innerHTML = "";
      const key = "sql.draft." + cur.id;
      const c = h(`<div class="card pad-lg"><div class="spread"><h2 style="margin:0">${esc(cur.title)} <span class="badge lv${cur.level}">${lv[cur.level]}</span> <span class="badge">${esc(cur.topic)}</span></h2></div>
        <p>${esc(cur.prompt)}</p>${cur.ordered ? `<div class="xs dim">Row order matters for this one.</div>` : ""}
        <details class="mt"><summary class="small muted" style="cursor:pointer">🗂️ Schema</summary><div class="col mt">${schemaHtml}</div></details>
        <textarea class="editor mt" id="q" spellcheck="false" style="min-height:160px" placeholder="SELECT …"></textarea>
        <div class="row mt"><button class="btn primary" id="run">▶ Run & check <kbd style="color:#fff;border-color:rgba(255,255,255,.4);background:transparent">⌘↵</kbd></button><button class="btn" id="hint">💡 Hint</button><button class="btn ghost" id="sol">Show solution</button></div><div id="hintbox"></div></div>`);
      OS.$(".spread", c).appendChild(OS.bmBtn("sql", cur.id, cur.title, "#/sql?id=" + cur.id));
      m.appendChild(c);
      const out = h(`<div id="out"></div>`); m.appendChild(out);
      const ta = OS.$("#q", c);
      ta.value = OS.ls.get(key, "");
      ta.addEventListener("input", () => OS.ls.set(key, ta.value));
      ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(); } if (e.key === "Tab") { e.preventDefault(); ta.setRangeText("  ", ta.selectionStart, ta.selectionEnd, "end"); } });
      OS.$("#hint", c).onclick = () => (OS.$("#hintbox", c).innerHTML = `<div class="def mt small">💡 ${esc(cur.hint)}</div>`);
      OS.$("#sol", c).onclick = async () => { const r = await get("/sql/solution/" + cur.id); OS.$("#hintbox", c).innerHTML = `<pre class="mt">${esc(r.solution)}</pre>`; };
      OS.$("#run", c).onclick = run;
      async function run() {
        out.innerHTML = `<div class="card"><span class="spinner"></span> running…</div>`;
        const r = await post("/sql/run", { id: cur.id, sql: ta.value });
        if (!r.ok) { out.innerHTML = `<div class="card"><div class="result-b bad">Error</div><pre>${esc(r.error)}</pre></div>`; return; }
        if (r.correct) { solved.add(cur.id); drawList(); }
        out.innerHTML = `<div class="card"><div class="result-b ${r.correct ? "ok" : "bad"}">${r.correct ? "✅ Correct — matches the expected result" : "❌ " + esc(r.feedback || "Not the expected result")}</div>
          <div class="xs dim mt">${r.rows.length} row(s)${r.truncated ? " (truncated)" : ""} · ${r.ms} ms</div>${table(r.columns, r.rows)}
          ${!r.correct && r.expected ? `<details class="mt"><summary class="small muted" style="cursor:pointer">Expected result</summary>${table(r.expected.columns, r.expected.rows)}</details>` : ""}
          ${r.correct ? `<div class="row mt"><button class="btn primary" id="next">Next challenge →</button></div>` : ""}</div>`;
        const nx = OS.$("#next", out);
        if (nx) nx.onclick = () => { const i = d.challenges.indexOf(cur); cur = d.challenges.slice(i + 1).find((x) => !solved.has(x.id)) || d.challenges[(i + 1) % d.challenges.length]; history.replaceState(null, "", "#/sql?id=" + cur.id); drawList(); drawMain(); };
      }
    }
    drawList(); drawMain();
  };

  // ---------------------------------------------------------------- Debugging
  OS.views["/debug"] = async (el, p) => {
    const d = await get("/debug");
    const solved = new Set(d.solved);
    let cur = d.exercises.find((x) => x.id === p.id) || d.exercises.find((x) => !solved.has(x.id)) || d.exercises[0];
    el.appendChild(h(`<div class="page-h"><div><h1>🐞 Debugging</h1><p>Each snippet has a real bug that hidden tests catch. Fix it, run, and the tests decide. Read the story first — it's what the bug report would say.</p></div><span class="badge acc">${solved.size}/${d.exercises.length} fixed</span></div>`));
    const w = h(`<div class="grid" style="grid-template-columns:280px minmax(0,1fr)"><div class="card side-list" id="list"></div><div class="col" id="main"></div></div>`);
    el.appendChild(w);
    const lv = ["", "Easy", "Medium", "Hard"];
    const drawList = () => {
      OS.$("#list", w).innerHTML = d.exercises.map((x) => `<a class="sl-item ${x.id === cur.id ? "on" : ""}" data-id="${x.id}"><span>${solved.has(x.id) ? "✅" : "🐞"}</span><span style="flex:1">${esc(x.title)}<div class="xs dim">${x.lang} · ${esc(x.topic)}</div></span><span class="xs lv${x.level}">${lv[x.level]}</span></a>`).join("");
      OS.$$("[data-id]", w).forEach((a) => (a.onclick = () => { cur = d.exercises.find((x) => x.id === a.dataset.id); history.replaceState(null, "", "#/debug?id=" + cur.id); drawList(); drawMain(); }));
    };
    function drawMain() {
      const m = OS.$("#main", w); m.innerHTML = "";
      const key = "debug.draft." + cur.id;
      const can = d.langs[cur.lang];
      const c = h(`<div class="card pad-lg"><div class="spread"><h2 style="margin:0">${esc(cur.title)} <span class="badge">${cur.lang}</span> <span class="badge lv${cur.level}">${lv[cur.level]}</span></h2></div>
        <div class="def mt small">🐛 <b>Bug report:</b> ${esc(cur.story)}</div>
        ${can ? "" : `<div class="small mt" style="color:var(--warn)">⚠ ${cur.lang} isn't installed on this server — you can still read and reason about it.</div>`}
        <textarea class="editor mt" id="code" spellcheck="false" style="min-height:280px"></textarea>
        <details class="mt"><summary class="small muted" style="cursor:pointer">🧪 Tests that will run (appended to your code)</summary><pre>${esc(cur.test)}</pre></details>
        <div class="row mt"><button class="btn primary" id="run" ${can ? "" : "disabled"}>▶ Run tests <kbd style="color:#fff;border-color:rgba(255,255,255,.4);background:transparent">⌘↵</kbd></button><button class="btn" id="hint">💡 Hint</button><button class="btn ghost" id="reset">↺ Reset</button><button class="btn ghost" id="sol">Reveal fix</button></div><div id="hintbox"></div></div>`);
      OS.$(".spread", c).appendChild(OS.bmBtn("debug", cur.id, cur.title, "#/debug?id=" + cur.id));
      m.appendChild(c);
      const out = h(`<div></div>`); m.appendChild(out);
      const ta = OS.$("#code", c);
      ta.value = OS.ls.get(key, cur.code);
      ta.addEventListener("input", () => OS.ls.set(key, ta.value));
      ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(); } if (e.key === "Tab") { e.preventDefault(); ta.setRangeText("    ", ta.selectionStart, ta.selectionEnd, "end"); } });
      OS.$("#hint", c).onclick = () => (OS.$("#hintbox", c).innerHTML = `<div class="def mt small">💡 ${esc(cur.hint)}</div>`);
      OS.$("#reset", c).onclick = () => { ta.value = cur.code; OS.ls.set(key, ta.value); };
      OS.$("#sol", c).onclick = async () => {
        if (!confirm("Reveal the fix? Try the hint first.")) return;
        const r = await get("/debug/solution/" + cur.id);
        OS.$("#hintbox", c).innerHTML = `<div class="def mt small">🔧 ${esc(r.explain)}</div><pre class="mt">${esc(r.solution)}</pre>`;
      };
      OS.$("#run", c).onclick = run;
      async function run() {
        out.innerHTML = `<div class="card"><span class="spinner"></span> compiling & running tests…</div>`;
        const r = await post("/debug/run", { id: cur.id, code: ta.value });
        if (r.passed) { solved.add(cur.id); drawList(); }
        out.innerHTML = `<div class="card"><div class="result-b ${r.passed ? "ok" : "bad"}">${r.passed ? "✅ All tests pass — bug fixed" : "❌ Tests still failing"}</div>
          ${r.stdout ? `<div class="xs dim mt">stdout</div><pre>${esc(r.stdout)}</pre>` : ""}${r.stderr ? `<div class="xs dim mt">stderr</div><pre>${esc(r.stderr)}</pre>` : ""}
          ${r.passed ? `<div class="row mt"><button class="btn" id="why">Compare with reference fix</button><button class="btn primary" id="next">Next bug →</button></div><div id="whybox"></div>` : ""}</div>`;
        const nx = OS.$("#next", out);
        if (nx) {
          nx.onclick = () => { const i = d.exercises.indexOf(cur); cur = d.exercises.slice(i + 1).find((x) => !solved.has(x.id)) || d.exercises[(i + 1) % d.exercises.length]; history.replaceState(null, "", "#/debug?id=" + cur.id); drawList(); drawMain(); };
          OS.$("#why", out).onclick = async () => { const s = await get("/debug/solution/" + cur.id); OS.$("#whybox", out).innerHTML = `<div class="def mt small">${esc(s.explain)}</div><pre class="mt">${esc(s.solution)}</pre>`; };
        }
      }
    }
    drawList(); drawMain();
  };

  // ---------------------------------------------------------------- Scenarios
  OS.views["/scenarios"] = async (el, p) => {
    const { scenarios } = await get("/scenarios");
    if (p.id != null && scenarios[+p.id]) return scenario(el, scenarios[+p.id], scenarios);
    el.appendChild(h(`<div class="page-h"><div><h1>🚨 Production scenarios</h1><p>The questions senior interviews love: incidents, debugging under pressure, risky migrations, judgement calls. Answer like you're on the call — mitigate first, then root-cause.</p></div>
      <div class="row"><a class="btn primary" href="#/mock?start=1&track=scenarios">🎙️ Timed scenario mock (5)</a></div></div>`));
    const list = h(`<div class="card"><div class="list"></div></div>`);
    scenarios.forEach((s, i) => {
      const row = h(`<a class="item spread" href="#/scenarios?id=${i}" style="color:inherit;text-decoration:none"><div style="flex:1;min-width:0"><div>${esc(s.q)}</div><div class="xs dim">${esc(s.theme || "")} · ${["", "warm-up", "medium", "hard"][s.level] || ""}${s.tries ? " · " + s.tries + " attempt(s)" : ""}</div></div>
        ${s.best != null ? `<b style="color:${OS.scoreColor(s.best)}">${s.best}</b>` : `<span class="badge">new</span>`}</a>`);
      row.appendChild(OS.bmBtn("scenario", String(i), s.q.slice(0, 120), "#/scenarios?id=" + i));
      list.firstElementChild.appendChild(row);
    });
    el.appendChild(list);
  };

  function scenario(el, s, all) {
    const i = all.indexOf(s);
    const c = h(`<div style="max-width:900px"><div class="small muted"><a href="#/scenarios">Scenarios</a> / ${i + 1} of ${all.length}</div>
      <div class="card pad-lg mt"><div class="row" style="align-items:flex-start;gap:14px"><div style="font-size:1.8rem">🚨</div><div class="mock-q" style="flex:1">${esc(s.q)}</div></div></div>
      <div class="card mt"><div class="spread mb"><b>Your answer</b><div class="row"><span class="xs dim" id="wc">0 words</span><button class="btn sm ghost" id="hint">💡 Hint</button></div></div>
        <textarea id="ans" rows="12" placeholder="1) Mitigate…  2) Investigate…  3) Fix…  4) Prevent…"></textarea>
        <div class="row mt"><span style="flex:1" class="small muted" id="hb"></span><button class="btn primary" id="go">Grade my answer ↵</button></div></div><div id="fb"></div></div>`);
    el.appendChild(c);
    const ta = OS.$("#ans", c), key = "scn.draft." + i;
    ta.value = OS.ls.get(key, "");
    let hints = 0, t0 = Date.now();
    ta.addEventListener("input", () => { OS.ls.set(key, ta.value); OS.$("#wc", c).textContent = ta.value.trim().split(/\s+/).filter(Boolean).length + " words"; });
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) grade(); });
    OS.$("#hint", c).onclick = () => { if (hints < s.points.length) OS.$("#hb", c).innerHTML += `<div>💡 ${esc(s.points[hints++])}</div>`; };
    OS.$("#go", c).onclick = grade;
    async function grade() {
      if (!ta.value.trim()) return ta.focus();
      const fb = OS.$("#fb", c); fb.innerHTML = `<div class="card mt"><span class="spinner"></span> grading…</div>`;
      const ev = await post("/mock/evaluate", { track: "scenarios", question: s, answer: ta.value, seconds: (Date.now() - t0) / 1000 });
      await post("/attempts", { kind: "scenario", ref: s.ref, title: s.q, subject: "scenarios", correct: ev.score >= 6.5, score: ev.score, detail: { hints } });
      fb.innerHTML = "";
      fb.appendChild(h(`<div class="card pad-lg mt"><div class="row" style="gap:18px">${OS.ring(ev.score)}<div class="kpi"><span class="v" style="color:${OS.scoreColor(ev.score)}">${esc(ev.verdict)}</span><span class="l">${Math.round(ev.coverage * 100)}% of the rubric · ${ev.delivery.words} words</span></div></div>
        <div class="grid g2 mt"><div><h3>✅ Strengths</h3><ul class="small">${ev.strengths.map((x) => `<li>${esc(x)}</li>`).join("") || "<li class='dim'>—</li>"}</ul></div><div><h3>🛠️ Improve</h3><ul class="small">${ev.improvements.map((x) => `<li>${esc(x)}</li>`).join("") || "<li class='dim'>Great answer.</li>"}</ul></div></div>
        <details class="qa" open><summary>📋 What a strong answer covers</summary><div class="a">${ev.points.map((p) => `<div>${p.covered ? "✅" : "⬜"} ${esc(p.point)}</div>`).join("")}</div></details>
        ${s.followups && s.followups.length ? `<div class="card mt" style="background:var(--panel2)"><b>🧑‍💼 Follow-ups to think about:</b><ul class="small">${s.followups.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>` : ""}
        <div class="row mt"><a class="btn primary" href="#/scenarios?id=${(i + 1) % all.length}">Next scenario →</a><button class="btn ghost" id="card">🃏 Rubric → flashcard</button></div></div>`));
      OS.$("#card", fb).onclick = () => OS.saveCards([{ front: s.q, back: s.points.map((p) => "• " + p).join("\n") }], "Scenarios", "scenario");
    }
  }
})();
