/* Prep Hub — core app: hash router, progress store, views. Vanilla JS. */
(function () {
  "use strict";

  const SECTIONS = window.STUDY_SECTIONS || [];
  const PROBLEMS = window.STUDY_PROBLEMS || [];
  const PKEY = "prephub.progress.v1";
  const TKEY = "prephub.theme";

  // ---------- progress store ----------
  const LKEY = "prephub.lang";
  const LANGS = [["java", "Java"], ["python", "Python"], ["cpp", "C++"], ["javascript", "JavaScript"]];
  const store = load();
  function load() {
    let s;
    try { s = Object.assign({ topics: {}, problems: {}, code: {}, plan: {}, activity: {} }, JSON.parse(localStorage.getItem(PKEY) || "{}")); }
    catch (_) { s = { topics: {}, problems: {}, code: {}, plan: {}, activity: {} }; }
    s.plan = s.plan || {};
    s.activity = s.activity || {};
    // migrate: code[pid] used to be a plain JS string; now it's { lang: source }
    for (const pid of Object.keys(s.code || {})) {
      if (typeof s.code[pid] === "string") s.code[pid] = { javascript: s.code[pid] };
    }
    return s;
  }
  function save() { try { localStorage.setItem(PKEY, JSON.stringify(store)); } catch (_) {} refreshGlobal(); markDirty(); }
  const isTopicDone = (id) => !!store.topics[id];
  const toggleTopic = (id) => { store.topics[id] ? delete store.topics[id] : (store.topics[id] = true); save(); };
  const problemState = (id) => store.problems[id] || null;
  const setProblem = (id, s) => { s ? (store.problems[id] = s) : delete store.problems[id]; save(); };
  const getLang = () => { try { return localStorage.getItem(LKEY) || "java"; } catch (_) { return "java"; } };
  const setLang = (l) => { try { localStorage.setItem(LKEY, l); } catch (_) {} };
  const codeFor = (pid, lang) => (store.code[pid] && store.code[pid][lang] != null) ? store.code[pid][lang] : null;
  const setCodeFor = (pid, lang, val) => { (store.code[pid] || (store.code[pid] = {}))[lang] = val; save(); };

  // ---------- study plan / spaced repetition ----------
  const ROADMAP = (window.STUDY_ROADMAP && window.STUDY_ROADMAP.groups) || [];
  const ROADMAP_PROBLEMS = ROADMAP.flatMap(g => g.problems.map(p => ({ ...p, groupId: g.id, groupName: g.name })));
  const REVIEW_DAYS = { bombed: 2, shaky: 3, got: 10 };
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const todayYMD = () => ymd(new Date());
  const addDaysYMD = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
  const planEntry = (pid) => store.plan[pid] || null;
  function bumpActivity() {
    const t = todayYMD();
    store.activity[t] = (store.activity[t] || 0) + 1;
  }
  function ratePlan(pid, rating) {
    const e = store.plan[pid] || { got: 0 };
    e.r = rating;
    e.ts = Date.now();
    if (rating === "got") {
      e.got = (e.got || 0) + 1;
      e.due = e.got >= 2 ? null : addDaysYMD(REVIEW_DAYS.got);   // mastered after 2 clean recalls
    } else {
      e.got = 0;
      e.due = addDaysYMD(REVIEW_DAYS[rating]);
    }
    store.plan[pid] = e;
    bumpActivity();
    save();
  }
  function clearPlan(pid) { delete store.plan[pid]; save(); }
  const isMastered = (pid) => { const e = store.plan[pid]; return !!(e && e.got >= 2 && e.due == null); };
  function currentStreak() {
    let n = 0;
    const d = new Date();
    if (!store.activity[ymd(d)]) d.setDate(d.getDate() - 1);   // today not done yet ⇒ count from yesterday
    while (store.activity[ymd(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function dueProblems() {
    const t = todayYMD();
    return ROADMAP_PROBLEMS
      .filter(p => { const e = store.plan[p.id]; return e && e.due && e.due <= t; })
      .sort((a, b) => (store.plan[a.id].due < store.plan[b.id].due ? -1 : 1));
  }

  const allTopics = () => SECTIONS.flatMap(s => s.topics.map(t => ({ ...t, sid: s.id, section: s.title })));
  function sectionStats(s) {
    const done = s.topics.filter(t => isTopicDone(t.id)).length;
    return { done, total: s.topics.length, pct: s.topics.length ? Math.round(done / s.topics.length * 100) : 0 };
  }
  function refreshGlobal() {
    const ts = allTopics(), td = ts.filter(t => isTopicDone(t.id)).length;
    const ps = PROBLEMS.length, pd = PROBLEMS.filter(p => problemState(p.id) === "solved").length;
    const total = ts.length + ps, done = td + pd;
    document.getElementById("globalProgress").textContent = (total ? Math.round(done / total * 100) : 0) + "%";
  }

  // ---------- helpers ----------
  const el = (h) => { const d = document.createElement("div"); d.innerHTML = h.trim(); return d.firstElementChild; };
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const view = document.getElementById("view");
  function setView(node, wide) {
    view.innerHTML = ""; view.classList.toggle("wide", !!wide);
    document.querySelector("main").classList.toggle("wide", !!wide);
    view.appendChild(node); window.scrollTo(0, 0);
  }
  function chk(done) { return `<span class="chk ${done ? "on" : ""}">${done ? "✓" : ""}</span>`; }
  function diffPill(d) { return `<span class="pill ${d.toLowerCase()}">${d}</span>`; }
  // fallback starter when a problem doesn't ship a language-specific one
  function genericStarter(p, lang) {
    const fn = p.fnName || "solution";
    if (lang === "python") return `def ${fn}(*args):\n    # TODO: implement\n    pass\n\n\nif __name__ == "__main__":\n    # call ${fn}(...) with the example inputs and print the result\n    pass\n`;
    if (lang === "cpp") return `#include <bits/stdc++.h>\nusing namespace std;\n\n// TODO: implement ${fn}\n\nint main() {\n    // call ${fn}(...) with the example inputs and print the result\n    return 0;\n}\n`;
    if (lang === "java") return `import java.util.*;\n\nclass Main {\n    // TODO: implement ${fn}\n\n    public static void main(String[] args) {\n        // call ${fn}(...) with the example inputs and print the result\n    }\n}\n`;
    return `function ${fn}() {\n  // TODO\n}\n`;
  }

  // ---------- tabs ----------
  const TABS = [
    ["#/", "Dashboard"],
    ...SECTIONS.map(s => ["#/section/" + s.id, s.title]),
    ...(ROADMAP.length ? [["#/plan", "DSA Plan"]] : []),
    ["#/practice", "DSA Practice"],
    ["#/cram", "Last-Minute Prep"],
  ];
  function renderTabs() {
    const nav = document.getElementById("tabs");
    nav.innerHTML = TABS.map(([h, t]) => `<a href="${h}">${esc(t)}</a>`).join("");
    const cur = location.hash || "#/";
    nav.querySelectorAll("a").forEach(a => {
      const h = a.getAttribute("href");
      a.classList.toggle("active", h === "#/" ? cur === "#/" : cur.startsWith(h));
    });
  }

  // ---------- views ----------
  function vDashboard() {
    const wrap = el(`<div></div>`);
    wrap.appendChild(el(`<h1>Interview Prep Workspace</h1>`));
    wrap.appendChild(el(`<p class="muted">Study every section, tick topics off as you go, and use <b>Key points</b> for a fast brush-up or <b>Deep dive</b> for the full explanation. The <b>DSA Practice</b> tab is a coding playground with a real test runner.</p>`));

    const tp = allTopics(), tpd = tp.filter(t => isTopicDone(t.id)).length;
    const pd = PROBLEMS.filter(p => problemState(p.id) === "solved").length;
    wrap.appendChild(el(`<div class="card" style="margin:16px 0">
      <b>Overall</b> — ${tpd}/${tp.length} topics · ${pd}/${PROBLEMS.length} problems solved
      <div class="progress-bar"><i style="width:${tp.length + PROBLEMS.length ? (tpd + pd) / (tp.length + PROBLEMS.length) * 100 : 0}%"></i></div>
    </div>`));

    const grid = el(`<div class="grid"></div>`);
    SECTIONS.forEach(s => {
      const st = sectionStats(s);
      const c = el(`<div class="card section-card" data-nav="#/section/${s.id}">
        <div class="big">${s.icon || "📄"}</div>
        <h3>${esc(s.title)}</h3>
        <p class="muted">${esc(s.blurb || "")}</p>
        <div class="muted">${st.done}/${st.total} done</div>
        <div class="progress-bar"><i style="width:${st.pct}%"></i></div>
      </div>`);
      grid.appendChild(c);
    });
    if (ROADMAP_PROBLEMS.length) {
      const att = ROADMAP_PROBLEMS.filter(x => planEntry(x.id)).length;
      const streak = currentStreak();
      const due = dueProblems().length;
      grid.appendChild(el(`<div class="card section-card" data-nav="#/plan">
        <div class="big">🗺️</div><h3>DSA Mastery Plan</h3>
        <p class="muted">The 150-problem curriculum, in order, with spaced-repetition review and a streak. Start here.</p>
        <div class="muted">🔥 ${streak}-day streak · ${att}/${ROADMAP_PROBLEMS.length} attempted${due ? ` · ${due} due` : ""}</div>
        <div class="progress-bar"><i style="width:${att / ROADMAP_PROBLEMS.length * 100}%"></i></div>
      </div>`));
    }
    const pc = el(`<div class="card section-card" data-nav="#/practice">
      <div class="big">🧑‍💻</div><h3>DSA Practice</h3>
      <p class="muted">Solve problems in-browser (Java / Python / C++ / JS) with example + hidden tests, hints, editorial.</p>
      <div class="muted">${pd}/${PROBLEMS.length} solved</div>
      <div class="progress-bar"><i style="width:${PROBLEMS.length ? pd / PROBLEMS.length * 100 : 0}%"></i></div>
    </div>`);
    grid.appendChild(pc);
    wrap.appendChild(grid);

    wrap.appendChild(el(`<h2>How to use this</h2>
      <ul>
        <li><b>Key points</b> button on every topic → condensed bullets for revision.</li>
        <li><b>Deep dive</b> button → full explanation, code, diagrams, gotchas.</li>
        <li>Tick the checkbox when a topic is solid. Progress is stored in this browser (export from the footer to back it up).</li>
        <li><b>Last-Minute Prep</b> tab → every topic's key points on one scrollable page for the night before.</li>
      </ul>`));
    return wrap;
  }

  function vSection(sid) {
    const s = SECTIONS.find(x => x.id === sid);
    if (!s) return el(`<p>Section not found.</p>`);
    const wrap = el(`<div></div>`);
    const st = sectionStats(s);
    wrap.appendChild(el(`<div class="crumbs"><a href="#/">Dashboard</a> / ${esc(s.title)}</div>`));
    wrap.appendChild(el(`<h1>${s.icon || ""} ${esc(s.title)}</h1>`));
    wrap.appendChild(el(`<p class="muted">${esc(s.blurb || "")}</p>`));
    wrap.appendChild(el(`<div class="progress-bar" style="margin-bottom:16px"><i style="width:${st.pct}%"></i></div>`));

    const bar = el(`<div class="toolbar">
      <input type="search" placeholder="Filter topics…" />
      <label class="muted"><input type="checkbox" class="hidedone"/> hide done</label>
    </div>`);
    wrap.appendChild(bar);
    const list = el(`<div></div>`);
    wrap.appendChild(list);

    function draw() {
      const q = bar.querySelector("input[type=search]").value.toLowerCase();
      const hd = bar.querySelector(".hidedone").checked;
      list.innerHTML = "";
      s.topics.forEach(t => {
        const done = isTopicDone(t.id);
        if (hd && done) return;
        if (q && !(t.title + " " + (t.tags || []).join(" ")).toLowerCase().includes(q)) return;
        const row = el(`<div class="topic-row ${done ? "done" : ""}">
          ${chk(done)}
          <span class="t-title">${esc(t.title)}</span>
          <button class="btn small" data-act="key">Key points</button>
          <button class="btn small primary" data-act="deep">Deep dive</button>
        </div>`);
        row.querySelector(".chk").onclick = () => { toggleTopic(t.id); draw(); };
        row.querySelector(".t-title").onclick = () => go(`#/topic/${s.id}/${t.id}`);
        row.querySelector('[data-act=key]').onclick = () => go(`#/topic/${s.id}/${t.id}?m=key`);
        row.querySelector('[data-act=deep]').onclick = () => go(`#/topic/${s.id}/${t.id}?m=deep`);
        list.appendChild(row);
      });
      if (!list.children.length) list.appendChild(el(`<p class="muted">Nothing matches.</p>`));
    }
    bar.querySelector("input[type=search]").oninput = draw;
    bar.querySelector(".hidedone").onchange = draw;
    draw();
    return wrap;
  }

  function vTopic(sid, tid, mode) {
    const s = SECTIONS.find(x => x.id === sid);
    const t = s && s.topics.find(x => x.id === tid);
    if (!t) return el(`<p>Topic not found.</p>`);
    const done = isTopicDone(t.id);
    const wrap = el(`<div></div>`);
    wrap.appendChild(el(`<div class="crumbs"><a href="#/">Dashboard</a> / <a href="#/section/${s.id}">${esc(s.title)}</a> / ${esc(t.title)}</div>`));
    wrap.appendChild(el(`<h1>${esc(t.title)}</h1>`));
    if (t.tags) wrap.appendChild(el(`<div class="tag-row">${t.tags.map(x => `<span class="pill">${esc(x)}</span>`).join("")}</div>`));

    const actions = el(`<div class="detail-actions">
      <button class="btn ${mode !== "deep" ? "primary" : ""}" data-m="key">★ Key points</button>
      <button class="btn ${mode === "deep" ? "primary" : ""}" data-m="deep">📖 Deep dive</button>
      <button class="btn" data-done>${done ? "✓ Marked done — undo" : "Mark as done"}</button>
    </div>`);
    wrap.appendChild(actions);
    const body = el(`<div></div>`);
    wrap.appendChild(body);

    function render(m) {
      body.innerHTML = "";
      if (m === "deep") {
        body.appendChild(el(`<div>${t.detail || "<p class='muted'>Deep-dive content coming soon.</p>"}</div>`));
        if (t.diagram) body.appendChild(el(`<figure class="diagram">${t.diagram}${t.diagramCaption ? `<figcaption>${esc(t.diagramCaption)}</figcaption>` : ""}</figure>`));
        if (t.pitfalls) body.appendChild(el(`<h3>Common pitfalls / gotchas</h3><ul>${t.pitfalls.map(p => `<li>${p}</li>`).join("")}</ul>`));
        if (t.interviewQs) body.appendChild(el(`<h3>Likely interview questions</h3><ul>${t.interviewQs.map(p => `<li>${esc(p)}</li>`).join("")}</ul>`));
      } else {
        body.appendChild(el(`<div class="brushup-box"><h4>★ Key points — ${esc(t.title)}</h4><ul>${(t.brushup || []).map(b => `<li>${b}</li>`).join("")}</ul></div>`));
      }
      actions.querySelectorAll("[data-m]").forEach(b => b.classList.toggle("primary", b.dataset.m === (m === "deep" ? "deep" : "key")));
    }
    actions.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { render(b.dataset.m); history.replaceState(null, "", `#/topic/${sid}/${tid}?m=${b.dataset.m}`); });
    actions.querySelector("[data-done]").onclick = (e) => {
      toggleTopic(t.id);
      e.target.textContent = isTopicDone(t.id) ? "✓ Marked done — undo" : "Mark as done";
    };
    render(mode === "deep" ? "deep" : "key");

    // prev / next within section
    const idx = s.topics.indexOf(t);
    const nav = el(`<div class="detail-actions" style="margin-top:28px;border-top:1px solid var(--border);padding-top:16px"></div>`);
    if (idx > 0) { const p = s.topics[idx - 1]; nav.appendChild(el(`<button class="btn">← ${esc(p.title)}</button>`)).onclick = () => go(`#/topic/${sid}/${p.id}?m=${mode || "key"}`); }
    if (idx < s.topics.length - 1) { const n = s.topics[idx + 1]; nav.appendChild(el(`<button class="btn">${esc(n.title)} →</button>`)).onclick = () => go(`#/topic/${sid}/${n.id}?m=${mode || "key"}`); }
    wrap.appendChild(nav);
    return wrap;
  }

  function vCram() {
    const wrap = el(`<div></div>`);
    wrap.appendChild(el(`<h1>Last-Minute Prep</h1>`));
    wrap.appendChild(el(`<p class="muted">Every topic's key points on one page. Use browser find (Ctrl/Cmd-F). Filter below.</p>`));
    const bar = el(`<div class="toolbar"><input type="search" placeholder="Filter across all sections…"/>
      <select><option value="">All sections</option>${SECTIONS.map(s => `<option value="${s.id}">${esc(s.title)}</option>`).join("")}</select></div>`);
    wrap.appendChild(bar);
    const out = el(`<div></div>`);
    wrap.appendChild(out);
    function draw() {
      const q = bar.querySelector("input").value.toLowerCase();
      const sf = bar.querySelector("select").value;
      out.innerHTML = "";
      SECTIONS.forEach(s => {
        if (sf && s.id !== sf) return;
        const topics = s.topics.filter(t => !q || (t.title + " " + (t.brushup || []).join(" ")).toLowerCase().includes(q));
        if (!topics.length) return;
        out.appendChild(el(`<h2>${s.icon || ""} ${esc(s.title)}</h2>`));
        topics.forEach(t => {
          const b = el(`<div class="card" style="margin-bottom:12px">
            <h3 style="margin-top:0">${esc(t.title)} ${isTopicDone(t.id) ? '<span class="pill easy">done</span>' : ""}
              <a href="#/topic/${s.id}/${t.id}?m=deep" style="font-size:.8rem;float:right">deep dive →</a></h3>
            <ul>${(t.brushup || []).map(x => `<li>${x}</li>`).join("")}</ul></div>`);
          out.appendChild(b);
        });
      });
      if (!out.children.length) out.appendChild(el(`<p class="muted">Nothing matches.</p>`));
    }
    bar.querySelector("input").oninput = draw;
    bar.querySelector("select").onchange = draw;
    draw();
    return wrap;
  }

  function vPractice() {
    const wrap = el(`<div></div>`);
    wrap.appendChild(el(`<h1>DSA Practice</h1>`));
    const solved = PROBLEMS.filter(p => problemState(p.id) === "solved").length;
    wrap.appendChild(el(`<p class="muted">${solved}/${PROBLEMS.length} solved · JavaScript runner with a 4s timeout. Keep the function name as given.</p>`));
    const tags = [...new Set(PROBLEMS.flatMap(p => p.tags || []))].sort();
    const bar = el(`<div class="toolbar">
      <input type="search" placeholder="Search problems…"/>
      <select data-f="diff"><option value="">Any difficulty</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
      <select data-f="tag"><option value="">Any topic</option>${tags.map(t => `<option>${esc(t)}</option>`).join("")}</select>
      <select data-f="status"><option value="">Any status</option><option value="solved">Solved</option><option value="unsolved">Unsolved</option></select>
    </div>`);
    wrap.appendChild(bar);
    const list = el(`<div></div>`);
    wrap.appendChild(list);
    function draw() {
      const q = bar.querySelector("input").value.toLowerCase();
      const fd = bar.querySelector('[data-f=diff]').value, ft = bar.querySelector('[data-f=tag]').value, fs = bar.querySelector('[data-f=status]').value;
      list.innerHTML = "";
      PROBLEMS.forEach((p, i) => {
        const st = problemState(p.id);
        if (q && !p.title.toLowerCase().includes(q)) return;
        if (fd && p.difficulty !== fd) return;
        if (ft && !(p.tags || []).includes(ft)) return;
        if (fs === "solved" && st !== "solved") return;
        if (fs === "unsolved" && st === "solved") return;
        const row = el(`<div class="topic-row ${st === "solved" ? "done" : ""}">
          <span class="chk ${st === "solved" ? "on" : ""}">${st === "solved" ? "✓" : ""}</span>
          <span class="t-title">${i + 1}. ${esc(p.title)}</span>
          ${diffPill(p.difficulty)}
          ${(p.tags || []).slice(0, 2).map(t => `<span class="pill">${esc(t)}</span>`).join("")}
          <button class="btn small primary">Solve</button>
        </div>`);
        row.querySelector(".t-title").onclick = row.querySelector("button").onclick = () => go("#/problem/" + p.id);
        list.appendChild(row);
      });
      if (!list.children.length) list.appendChild(el(`<p class="muted">No problems match.</p>`));
    }
    bar.querySelectorAll("input,select").forEach(x => x.oninput = x.onchange = draw);
    draw();
    return wrap;
  }

  function vProblem(pid) {
    const p = PROBLEMS.find(x => x.id === pid);
    if (!p) return el(`<p>Problem not found.</p>`);
    const idx = PROBLEMS.indexOf(p);
    const wrap = el(`<div></div>`);
    wrap.appendChild(el(`<div class="crumbs"><a href="#/practice">DSA Practice</a> / ${esc(p.title)}</div>`));
    const pw = el(`<div class="pw"></div>`);
    wrap.appendChild(pw);

    // LEFT
    const left = el(`<div class="pw-left"></div>`);
    const tabs = el(`<div class="pw-tabs">
      <button data-t="desc" class="active">Description</button>
      <button data-t="concept">Concept</button>
      <button data-t="hints">Hints</button>
      <button data-t="sol">Editorial</button>
    </div>`);
    const pane = el(`<div class="pw-pane"></div>`);
    left.appendChild(tabs); left.appendChild(pane);

    const panes = {
      desc: `<h2 style="margin-top:0">${idx + 1}. ${esc(p.title)} ${diffPill(p.difficulty)}</h2>
        <div class="tag-row">${(p.tags || []).map(t => `<span class="pill">${esc(t)}</span>`).join("")}</div>
        ${p.statement}
        <h3>Examples</h3>
        ${(p.examples || []).map((e, i) => `<div class="case"><div><span class="k">Input:</span> <code>${esc(e.in)}</code></div>
          <div><span class="k">Output:</span> <code>${esc(e.out)}</code></div>
          ${e.explain ? `<div class="k" style="margin-top:6px">${esc(e.explain)}</div>` : ""}</div>`).join("")}
        ${p.constraints ? `<h3>Constraints</h3><ul>${p.constraints.map(c => `<li><code>${esc(c)}</code></li>`).join("")}</ul>` : ""}`,
      concept: `<h3 style="margin-top:0">Concept refresher</h3>${p.concept || "<p class='muted'>—</p>"}
        ${p.relatedTopic ? `<p><a href="#${p.relatedTopic}">→ Full topic in study notes</a></p>` : ""}`,
      hints: `<h3 style="margin-top:0">Hints</h3>${(p.hints || []).map((h, i) => `<details class="spoiler"><summary>Hint ${i + 1}</summary><div style="padding-bottom:12px">${h}</div></details>`).join("") || "<p class='muted'>—</p>"}`,
      sol: `<details class="spoiler"><summary>Show editorial &amp; solution</summary><div style="padding-bottom:14px">${p.solution || "<p class='muted'>—</p>"}</div></details>`,
    };
    function showTab(t) {
      tabs.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.t === t));
      pane.innerHTML = panes[t];
    }
    tabs.querySelectorAll("button").forEach(b => b.onclick = () => showTab(b.dataset.t));
    showTab("desc");

    // RIGHT
    const right = el(`<div class="pw-right"></div>`);
    let lang = getLang();
    const starterFor = (l) => {
      const ext = window.STUDY_STARTERS && window.STUDY_STARTERS[p.id];
      if (ext && ext[l] != null) return ext[l];
      if (p.starters && p.starters[l] != null) return p.starters[l];
      return l === "javascript" ? (p.starter || "") : genericStarter(p, l);
    };

    const langBar = el(`<div class="pw-langbar">
      <label>Language
        <select id="langSel">${LANGS.map(([v, n]) => `<option value="${v}"${v === lang ? " selected" : ""}>${n}</option>`).join("")}</select>
      </label>
      <span class="muted lang-note"></span>
    </div>`);
    const langSel = langBar.querySelector("#langSel");
    const langNote = langBar.querySelector(".lang-note");

    const editor = el(`<div class="pw-editor"><textarea spellcheck="false"></textarea></div>`);
    const ta = editor.querySelector("textarea");
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Tab") { e.preventDefault(); const s = ta.selectionStart; ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s + 2; }
    });
    ta.addEventListener("input", () => setCodeFor(p.id, lang, ta.value));

    const toolbar = el(`<div class="pw-toolbar">
      <button class="btn" data-run="ex">▶ Run examples</button>
      <button class="btn primary" data-run="all">✓ Submit (all tests)</button>
      <button class="btn" data-reset>Reset code</button>
      <span class="muted toolbar-hint" style="margin-left:auto"></span>
    </div>`);
    const consoleBox = el(`<div class="pw-console"><span class="muted">Run your code to see results.</span></div>`);
    right.appendChild(langBar); right.appendChild(editor); right.appendChild(toolbar); right.appendChild(consoleBox);

    const btnEx = toolbar.querySelector('[data-run=ex]');
    const btnAll = toolbar.querySelector('[data-run=all]');
    const hint = toolbar.querySelector('.toolbar-hint');

    function loadLangIntoEditor() {
      ta.value = codeFor(p.id, lang) != null ? codeFor(p.id, lang) : starterFor(lang);
      const isJs = lang === "javascript";
      btnEx.textContent = isJs ? "▶ Run examples" : "▶ Run";
      btnAll.hidden = !isJs;
      hint.innerHTML = isJs
        ? `graded locally · fn: <code>${esc(p.fnName)}</code>`
        : `runs on a public sandbox (needs internet) · check output vs the examples`;
      langNote.textContent = isJs
        ? "JavaScript runs offline and is auto-graded against hidden tests."
        : "Java/Python/C++ compile & run remotely; the ✓ grader is JavaScript-only.";
    }
    langSel.addEventListener("change", () => {
      setCodeFor(p.id, lang, ta.value);      // persist current buffer
      lang = langSel.value;
      setLang(lang);
      loadLangIntoEditor();
      consoleBox.innerHTML = `<span class="muted">Run your code to see results.</span>`;
    });

    async function run(all) {
      if (lang === "javascript") return runJs(all);
      return runRemote();
    }

    async function runJs(all) {
      const tests = (all ? p.tests : p.tests.filter(t => !t.hidden)).map(t => ({ ...t, hidden: all ? t.hidden : false }));
      consoleBox.innerHTML = `<span class="muted">Running ${tests.length} case(s)…</span>`;
      const res = await window.runSolution({ code: ta.value, fnName: p.fnName, tests });
      consoleBox.innerHTML = "";
      if (res.error) { consoleBox.appendChild(el(`<div class="result-banner fail">Error</div>`)); consoleBox.appendChild(el(`<pre style="margin:0">${esc(res.error)}</pre>`)); return; }
      const passed = res.results.filter(r => r.ok).length, total = res.results.length;
      const okAll = passed === total;
      consoleBox.appendChild(el(`<div class="result-banner ${okAll ? "pass" : "fail"}">${passed}/${total} passed${okAll && all ? " — Accepted 🎉" : ""}</div>`));
      res.results.forEach((r, i) => {
        consoleBox.appendChild(el(`<div class="case ${r.ok ? "pass" : "fail"}">
          <div><span class="k">Case ${i + 1}${r.hidden ? " (hidden)" : ""}:</span> ${r.ok ? "✓ pass" : "✗ fail"} <span class="k">${r.ms}ms</span></div>
          ${r.hidden && r.ok ? "" : `<div><span class="k">input:</span> <code>${esc(JSON.stringify(r.input))}</code></div>
          <div><span class="k">expected:</span> <code>${esc(JSON.stringify(r.expected))}</code></div>
          <div><span class="k">got:</span> <code>${esc(typeof r.got === "string" ? r.got : JSON.stringify(r.got))}</code></div>`}
        </div>`));
      });
      if (res.logs && res.logs.length) consoleBox.appendChild(el(`<div style="margin-top:8px"><span class="k">console:</span><pre style="margin:4px 0 0">${esc(res.logs.join("\n"))}</pre></div>`));
      if (okAll && all) { setProblem(p.id, "solved"); draw(); }
    }

    async function runRemote() {
      consoleBox.innerHTML = `<span class="muted">Compiling &amp; running remotely…</span>`;
      const res = await window.runRemote({ lang, code: ta.value });
      consoleBox.innerHTML = "";
      if (res.error) { consoleBox.appendChild(el(`<div class="result-banner fail">Error</div>`)); consoleBox.appendChild(el(`<pre style="margin:0">${esc(res.error)}</pre>`)); return; }
      const failed = res.code !== 0 || !!res.signal;
      const compileFailed = failed && res.compileOutput && !res.stdout;
      consoleBox.appendChild(el(`<div class="result-banner ${failed ? "fail" : "pass"}">${
        compileFailed ? "Compile error"
          : failed ? `exited ${res.code}${res.signal ? " (" + res.signal + ")" : ""}`
          : "ran OK — compare the output to the examples"
      }</div>`));
      if (res.compileOutput) consoleBox.appendChild(el(`<div><span class="k">compiler:</span><pre style="margin:4px 0 0">${esc(res.compileOutput)}</pre></div>`));
      if (res.stdout) consoleBox.appendChild(el(`<div style="margin-top:6px"><span class="k">stdout:</span><pre style="margin:4px 0 0">${esc(res.stdout)}</pre></div>`));
      if (res.stderr) consoleBox.appendChild(el(`<div style="margin-top:6px"><span class="k">stderr:</span><pre style="margin:4px 0 0">${esc(res.stderr)}</pre></div>`));
      if (!res.compileOutput && !res.stdout && !res.stderr) consoleBox.appendChild(el(`<span class="muted">(no output — did your program print anything?)</span>`));
      consoleBox.appendChild(el(`<div class="k" style="margin-top:6px">via wandbox · ${esc(res.compiler || lang)}</div>`));
    }

    btnEx.onclick = () => run(false);
    btnAll.onclick = () => run(true);
    toolbar.querySelector('[data-reset]').onclick = () => {
      if (confirm("Reset the " + LANGS.find(x => x[0] === lang)[1] + " editor to the starter code?")) {
        ta.value = starterFor(lang);
        setCodeFor(p.id, lang, ta.value);
      }
    };
    loadLangIntoEditor();

    pw.appendChild(left); pw.appendChild(right);

    const foot = el(`<div class="detail-actions" style="margin-top:16px"></div>`);
    const mark = el(`<button class="btn">${problemState(p.id) === "solved" ? "✓ Solved — mark unsolved" : "Mark solved manually"}</button>`);
    mark.onclick = () => { setProblem(p.id, problemState(p.id) === "solved" ? null : "solved"); draw(); };
    foot.appendChild(mark);
    if (idx > 0) { const b = el(`<button class="btn">← Prev</button>`); b.onclick = () => go("#/problem/" + PROBLEMS[idx - 1].id); foot.appendChild(b); }
    if (idx < PROBLEMS.length - 1) { const b = el(`<button class="btn">Next →</button>`); b.onclick = () => go("#/problem/" + PROBLEMS[idx + 1].id); foot.appendChild(b); }
    wrap.appendChild(foot);

    function draw() { mark.textContent = problemState(p.id) === "solved" ? "✓ Solved — mark unsolved" : "Mark solved manually"; refreshGlobal(); }
    return wrap;
  }

  // ---------- study plan ----------
  function vPlan() {
    const wrap = el(`<div></div>`);
    const total = ROADMAP_PROBLEMS.length;

    wrap.appendChild(el(`<h1>DSA Mastery Plan</h1>`));
    wrap.appendChild(el(`<div class="brushup-box" style="background:var(--panel);border-color:var(--border)">
      <b>The method</b> — one resource, 45 min a day, patterns in order.
      Per problem: brute force → 25 min timer → if stuck, study the editorial, then
      <b>re-implement from a blank file</b> → rate your recall below. Re-do "shaky"/"bombed"
      in a few days (they'll appear in <i>Due for review</i>). Don't break the streak.
      <a href="#/topic/career/career-plan?m=deep" style="display:inline-block;margin-top:6px">Full plan &amp; schedule →</a>
    </div>`));

    // ---- stats row ----
    const attempted = ROADMAP_PROBLEMS.filter(p => planEntry(p.id)).length;
    const mastered = ROADMAP_PROBLEMS.filter(p => isMastered(p.id)).length;
    const due = dueProblems();
    const streak = currentStreak();
    const doneToday = !!store.activity[todayYMD()];
    const stats = el(`<div class="plan-stats">
      <div class="plan-stat"><b>${streak}</b><span>🔥 day streak${streak && !doneToday ? " · do one today!" : ""}</span></div>
      <div class="plan-stat"><b>${attempted}/${total}</b><span>attempted</span></div>
      <div class="plan-stat"><b>${mastered}</b><span>mastered ✅</span></div>
      <div class="plan-stat ${due.length ? "hot" : ""}"><b>${due.length}</b><span>due for review</span></div>
    </div>`);
    wrap.appendChild(stats);
    wrap.appendChild(el(`<div class="progress-bar" style="margin:4px 0 18px"><i style="width:${total ? attempted / total * 100 : 0}%"></i></div>`));

    // ---- activity heatmap (last 13 weeks) ----
    wrap.appendChild(heatmap());

    // ---- due for review ----
    if (due.length) {
      const box = el(`<div class="card" style="border-color:var(--warn);margin:16px 0"><h3 style="margin-top:0">🔁 Due for review — ${due.length}</h3></div>`);
      due.slice(0, 40).forEach(p => box.appendChild(planRow(p, redraw)));
      if (due.length > 40) box.appendChild(el(`<p class="muted">…and ${due.length - 40} more.</p>`));
      wrap.appendChild(box);
    }

    // ---- toolbar ----
    const bar = el(`<div class="toolbar">
      <input type="search" placeholder="Filter problems…"/>
      <label class="muted"><input type="checkbox" class="hide-mastered"/> hide mastered</label>
      <label class="muted"><input type="checkbox" class="only-local"/> only in-app runnable</label>
    </div>`);
    wrap.appendChild(bar);

    const groupsWrap = el(`<div></div>`);
    wrap.appendChild(groupsWrap);

    function drawGroups() {
      const qf = bar.querySelector("input[type=search]").value.toLowerCase();
      const hm = bar.querySelector(".hide-mastered").checked;
      const ol = bar.querySelector(".only-local").checked;
      groupsWrap.innerHTML = "";
      ROADMAP.forEach((g, gi) => {
        let probs = g.problems.filter(p => {
          if (qf && !p.title.toLowerCase().includes(qf)) return false;
          if (hm && isMastered(p.id)) return false;
          if (ol && !(p.local && PROBLEMS.some(x => x.id === p.local))) return false;
          return true;
        });
        if (!probs.length) return;
        const att = g.problems.filter(p => planEntry(p.id)).length;
        const mas = g.problems.filter(p => isMastered(p.id)).length;
        const det = el(`<details class="plan-group"${(qf || att < g.problems.length) && gi < 6 ? " open" : ""}>
          <summary>
            <span class="pg-name">${gi + 1}. ${esc(g.name)}</span>
            <span class="pg-count muted">${att}/${g.problems.length} attempted · ${mas} mastered</span>
          </summary>
          <p class="muted pg-note">${esc(g.note || "")} ${g.concept ? `<a href="${g.concept}">concept →</a>` : ""}</p>
        </details>`);
        probs.forEach(p => det.appendChild(planRow(p, redraw)));
        groupsWrap.appendChild(det);
      });
      if (!groupsWrap.children.length) groupsWrap.appendChild(el(`<p class="muted">Nothing matches.</p>`));
    }
    bar.querySelectorAll("input").forEach(x => { x.oninput = drawGroups; x.onchange = drawGroups; });
    drawGroups();

    function redraw() { go("#/plan"); route(); }   // simplest: re-render after a rating
    return wrap;
  }

  function planRow(p, onChange) {
    const e = planEntry(p.id);
    const t = todayYMD();
    const overdue = e && e.due && e.due < t;
    const dueToday = e && e.due === t;
    const row = el(`<div class="topic-row plan-row ${isMastered(p.id) ? "mastered" : ""}">
      <span class="rate">
        <button data-r="bombed" class="${e && e.r === "bombed" ? "on" : ""}" title="Bombed — couldn't do it">😖</button>
        <button data-r="shaky" class="${e && e.r === "shaky" ? "on" : ""}" title="Shaky — needed the editorial">🤔</button>
        <button data-r="got" class="${e && e.r === "got" ? "on" : ""}" title="Got it — solved it cleanly">✅</button>
      </span>
      <span class="t-title">${esc(p.title)}</span>
      ${diffPill(p.diff)}
      ${isMastered(p.id) ? `<span class="pill easy">mastered</span>`
        : e && e.due ? `<span class="pill ${overdue ? "hard" : dueToday ? "medium" : ""}" title="next review">${overdue ? "overdue" : dueToday ? "review today" : "review " + e.due.slice(5)}</span>`
        : ""}
      <span class="row-links">
        ${p.local && PROBLEMS.some(x => x.id === p.local) ? `<a href="#/problem/${p.local}" title="Solve in-app">▶ solve</a>` : ""}
        <a href="https://leetcode.com/problems/${p.lc}/" target="_blank" rel="noopener" title="Open on LeetCode">LC ↗</a>
      </span>
    </div>`);
    row.querySelectorAll(".rate button").forEach(b => {
      b.onclick = () => {
        const cur = planEntry(p.id);
        if (cur && cur.r === b.dataset.r && b.classList.contains("on")) clearPlan(p.id);
        else ratePlan(p.id, b.dataset.r);
        onChange();
      };
    });
    return row;
  }

  function heatmap() {
    const WEEKS = 13, cell = 13, gap = 3;
    const today = new Date();
    const start = new Date(today); start.setDate(start.getDate() - (WEEKS * 7 - 1));
    // align start to the previous Sunday
    start.setDate(start.getDate() - start.getDay());
    let max = 1;
    for (const k in store.activity) max = Math.max(max, store.activity[k]);
    const colFor = (n) => n === 0 ? "var(--panel-2)"
      : n === 1 ? "#9be9a8" : n === 2 ? "#40c463" : n >= max ? "#216e39" : "#30a14e";
    let rects = "";
    const cur = new Date(start);
    for (let w = 0; w < WEEKS + 1; w++) {
      for (let d = 0; d < 7; d++) {
        if (cur <= today) {
          const key = ymd(cur);
          const n = store.activity[key] || 0;
          rects += `<rect x="${w * (cell + gap)}" y="${d * (cell + gap)}" width="${cell}" height="${cell}" rx="2" fill="${colFor(n)}"><title>${key}: ${n} action${n === 1 ? "" : "s"}</title></rect>`;
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    const W = (WEEKS + 1) * (cell + gap);
    return el(`<figure class="diagram" style="text-align:left;padding:12px 14px">
      <svg viewBox="0 0 ${W} ${7 * (cell + gap)}" width="${W}" style="max-width:100%">${rects}</svg>
      <figcaption>Activity — each square is a day; darker = more problems rated. Keep the row unbroken.</figcaption>
    </figure>`);
  }

  // ---------- router ----------
  function go(hash) { location.hash = hash; }
  window.__go = go;
  function route() {
    renderTabs();
    const raw = (location.hash || "#/").slice(1);
    const [path, query] = raw.split("?");
    const q = new URLSearchParams(query || "");
    const parts = path.split("/").filter(Boolean);
    if (!parts.length) return setView(vDashboard());
    switch (parts[0]) {
      case "section": return setView(vSection(parts[1]));
      case "topic": return setView(vTopic(parts[1], parts[2], q.get("m")));
      case "practice": return setView(vPractice(), true);
      case "problem": return setView(vProblem(parts[1]), true);
      case "plan": return setView(vPlan(), true);
      case "cram": return setView(vCram());
      default: return setView(vDashboard());
    }
  }
  window.addEventListener("hashchange", route);
  document.addEventListener("click", (e) => {
    const n = e.target.closest("[data-nav]");
    if (n) { e.preventDefault(); go(n.getAttribute("data-nav")); }
  });

  // ---------- theme ----------
  const root = document.documentElement;
  try { const s = localStorage.getItem(TKEY); if (s) root.setAttribute("data-theme", s); } catch (_) {}
  document.getElementById("themeToggle").onclick = () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(TKEY, next); } catch (_) {}
  };

  // ---------- durable file + Save button (File System Access API — Chrome/Edge/Brave) ----------
  // Progress is always cached in localStorage automatically. The Save button writes
  // progress.json to a real file on disk; a running ./scripts/watch-backup.sh then makes
  // exactly one Git commit per Save. Firefox has no File System Access API, so there Save
  // downloads progress.json instead.
  const FS_SUPPORTED = typeof window.showOpenFilePicker === "function" && typeof window.showSaveFilePicker === "function";
  const HKEY = "prephub-handle";
  let fileHandle = null;
  let syncing = false;
  let dirty = false;
  let lastSavedAt = null;

  function fmtTime(d) { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

  function refreshSyncUI() {
    const s = document.getElementById("syncStatus");
    const saveBtn = document.getElementById("saveBtn");
    if (!s || !saveBtn) return;
    let txt, color = "";
    if (dirty) {
      txt = "● Unsaved changes"; color = "var(--warn)";
      saveBtn.textContent = "Save";
      saveBtn.classList.add("attn");
    } else {
      saveBtn.classList.remove("attn");
      saveBtn.textContent = "Save";
      if (fileHandle) {
        txt = "Saved → " + fileHandle.name + (lastSavedAt ? " · " + fmtTime(lastSavedAt) : "");
        color = "var(--ok)";
      } else if (FS_SUPPORTED) {
        txt = "Saved in this browser · Connect a file, then Save writes it to disk + Git";
      } else {
        txt = "Saved in this browser · Save downloads a progress.json backup (Firefox)";
      }
    }
    s.textContent = txt;
    s.style.color = color;
  }
  function markDirty() { dirty = true; refreshSyncUI(); }
  function markClean() { dirty = false; lastSavedAt = new Date(); refreshSyncUI(); }

  // tiny IndexedDB wrapper just to persist the FileSystemFileHandle across reloads
  function idb(mode, fn) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("prephub", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("kv");
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const tx = req.result.transaction("kv", mode);
        const st = tx.objectStore("kv");
        const r = fn(st);
        tx.oncomplete = () => resolve(r && r.result);
        tx.onerror = () => reject(tx.error);
      };
    });
  }
  const idbGet = (k) => idb("readonly", (st) => st.get(k));
  const idbSet = (k, v) => idb("readwrite", (st) => st.put(v, k));
  const idbDel = (k) => idb("readwrite", (st) => st.delete(k));

  function mergeFromFileData(d) {
    if (!d || typeof d !== "object") return;
    // Union so connecting a file never silently drops a tick made in this browser.
    store.topics = Object.assign({}, store.topics, d.topics || {});
    store.problems = Object.assign({}, store.problems, d.problems || {});
    // code is nested { pid: { lang: source } } — deep-merge so per-language solutions aren't lost
    const mergedCode = Object.assign({}, store.code);
    for (const [pid, langs] of Object.entries(d.code || {})) {
      const nn = typeof langs === "string" ? { javascript: langs } : langs;
      mergedCode[pid] = Object.assign({}, mergedCode[pid], nn);
    }
    store.code = mergedCode;
    // plan / activity: take the entry with the most recent timestamp / higher count
    store.plan = store.plan || {}; store.activity = store.activity || {};
    for (const [pid, fe] of Object.entries(d.plan || {})) {
      const le = store.plan[pid];
      if (!le || (fe.ts || 0) >= (le.ts || 0)) store.plan[pid] = fe;
    }
    for (const [day, c] of Object.entries(d.activity || {})) {
      store.activity[day] = Math.max(store.activity[day] || 0, c || 0);
    }
  }

  const deepSort = (x) => {
    if (Array.isArray(x)) return x.map(deepSort);
    if (x && typeof x === "object") {
      const out = {};
      for (const k of Object.keys(x).sort()) out[k] = deepSort(x[k]);
      return out;
    }
    return x;
  };
  const norm = (o) => JSON.stringify(deepSort({ topics: o.topics || {}, problems: o.problems || {}, code: o.code || {}, plan: o.plan || {}, activity: o.activity || {} }));

  // returns true if the in-memory store ended up different from the file
  // (i.e. this browser has changes not yet on disk — Save needed)
  async function loadFromHandle() {
    const file = await fileHandle.getFile();
    const text = (await file.text()).trim();
    let fileSnapshot = norm({});
    if (text) {
      try {
        const d = JSON.parse(text);
        fileSnapshot = norm(d);
        mergeFromFileData(d);
      } catch (_) { /* corrupt file: keep local, Save will overwrite it */ }
    }
    try { localStorage.setItem(PKEY, JSON.stringify(store)); } catch (_) {}
    return norm(store) !== fileSnapshot;
  }

  function downloadProgress() {
    const blob = new Blob([JSON.stringify(store, null, 2) + "\n"], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "progress.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function writeToHandle() {
    const w = await fileHandle.createWritable();
    await w.write(JSON.stringify(store, null, 2) + "\n");
    await w.close();
  }

  async function doSave() {
    if (syncing) return;
    syncing = true;
    const s = document.getElementById("syncStatus");
    if (s) { s.textContent = "Saving…"; s.style.color = "var(--warn)"; }
    try {
      if (fileHandle) {
        if (!(await ensurePermission(fileHandle, true))) { refreshSyncUI(); return; }
        await writeToHandle();
      } else {
        downloadProgress();
      }
      markClean();
    } catch (err) {
      console.warn("save failed", err);
      if (s) { s.textContent = "Save failed — data is still in this browser"; s.style.color = "var(--err)"; }
    } finally {
      syncing = false;
    }
  }

  async function ensurePermission(handle, request) {
    const opts = { mode: "readwrite" };
    if ((await handle.queryPermission(opts)) === "granted") return true;
    if (request && (await handle.requestPermission(opts)) === "granted") return true;
    return false;
  }

  async function connectFile() {
    try {
      let handle;
      const existing = await idbGet(HKEY).catch(() => null);
      if (existing) {
        handle = existing;
        if (!(await ensurePermission(handle, true))) handle = null;
      }
      if (!handle) {
        [handle] = await window.showOpenFilePicker({
          id: "prephub-progress",
          types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
        });
        if (!(await ensurePermission(handle, true))) return;
      }
      fileHandle = handle;
      await idbSet(HKEY, handle);
      await loadFromHandle();       // pull any progress already in the file
      await writeToHandle();        // write back the merged result (explicit user action)
      markClean();
      route();
      const btn = document.getElementById("connectFileBtn");
      if (btn) btn.textContent = "Change progress file";
    } catch (err) {
      if (err && err.name === "AbortError") return; // user cancelled the picker
      console.warn("connectFile failed", err);
      const s = document.getElementById("syncStatus");
      if (s) { s.textContent = "Could not connect file"; s.style.color = "var(--warn)"; }
    }
  }

  async function initFileSync() {
    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) { saveBtn.hidden = false; saveBtn.onclick = doSave; }

    if (!FS_SUPPORTED) { refreshSyncUI(); return; }

    const btn = document.getElementById("connectFileBtn");
    btn.hidden = false;
    btn.onclick = connectFile;

    const existing = await idbGet(HKEY).catch(() => null);
    if (!existing) { refreshSyncUI(); return; }

    if (await ensurePermission(existing, false)) {
      fileHandle = existing;
      const drifted = await loadFromHandle();
      drifted ? markDirty() : markClean();
      route();
      btn.textContent = "Change progress file";
    } else {
      // handle remembered but the browser needs a fresh click to re-grant permission
      const s = document.getElementById("syncStatus");
      if (s) { s.textContent = "Click “Reconnect progress file” to point Save at your file again"; s.style.color = "var(--warn)"; }
      btn.textContent = "Reconnect progress file";
    }
  }

  window.addEventListener("beforeunload", (e) => {
    if (dirty && fileHandle) { e.preventDefault(); e.returnValue = ""; }
  });

  // ---------- footer: export / import / reset ----------
  document.getElementById("exportBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "prephub-progress.json"; a.click();
  };
  document.getElementById("importBtn").onclick = () => document.getElementById("importFile").click();
  document.getElementById("importFile").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        Object.assign(store, { topics: d.topics || {}, problems: d.problems || {}, code: d.code || {}, plan: d.plan || {}, activity: d.activity || {} });
        save(); route(); alert("Progress imported.");
      } catch (_) { alert("Invalid file."); }
    };
    r.readAsText(f);
  };
  document.getElementById("resetBtn").onclick = async () => {
    if (!confirm("Erase all progress and saved code in this browser?")) return;
    localStorage.removeItem(PKEY);
    if (confirm("Also disconnect the progress file? (The file on disk is kept; auto-save stops.)")) {
      await idbDel(HKEY).catch(() => {});
      fileHandle = null;
    }
    location.reload();
  };

  refreshGlobal();
  route();
  initFileSync();
})();
