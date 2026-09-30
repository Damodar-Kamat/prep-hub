/* Code lab (local runner), question bank + miner, notebook, engineering feed. */
(function () {
  const { h, esc, get, post } = OS;

  // ---------------------------------------------------------------- code lab
  const TEMPLATES = {
    java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println("Hello from Java " + Runtime.version());\n    }\n}\n`,
    python: `import sys\nfrom collections import defaultdict, deque, Counter\nimport heapq\n\ndef solve():\n    data = sys.stdin.read().split()\n    print("Hello from Python", sys.version.split()[0])\n\nsolve()\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    cout << "Hello from C++" << endl;\n    return 0;\n}\n`,
    javascript: `const lines = require("fs").readFileSync(0, "utf8").split("\\n");\nconsole.log("Hello from Node", process.version);\n`,
  };
  OS.views["/lab"] = async (el) => {
    const st = await get("/status");
    let lang = OS.ls.get("lab.lang", "java");
    el.appendChild(h(`<div class="page-h"><div><h1>⌨️ Code lab</h1><p>Runs on your machine (javac/java, python3, g++, node) — no sandbox limits, real stdin. For graded DSA practice use the <a href="/index.html#/practice">Prep Hub practice runner</a>.</p></div></div>`));
    const w = h(`<div class="grid g2" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)">
      <div class="card"><div class="spread mb"><div class="row">${Object.keys(TEMPLATES).map((k) => `<span class="chip ${k === lang ? "on" : ""} ${st.runner[k] ? "" : "dim"}" data-l="${k}">${k}${st.runner[k] ? "" : " ✗"}</span>`).join("")}</div>
        <div class="row"><button class="btn sm ghost" id="reset">Reset</button><button class="btn primary" id="run">▶ Run <kbd style="color:#fff;border-color:rgba(255,255,255,.4);background:transparent">⌘↵</kbd></button></div></div>
        <textarea class="editor" id="code" spellcheck="false"></textarea></div>
      <div class="col"><div class="card"><label>stdin</label><textarea id="stdin" rows="5" class="mono"></textarea></div>
        <div class="card"><div class="spread"><b>Output</b><span class="xs dim" id="meta"></span></div><div class="out mt" id="out"><span class="dim">Run your code to see output.</span></div></div></div></div>`);
    el.appendChild(w);
    const code = OS.$("#code", w);
    const load = () => { code.value = OS.ls.get("lab.code." + lang, TEMPLATES[lang]); };
    load();
    code.addEventListener("input", () => OS.ls.set("lab.code." + lang, code.value));
    code.addEventListener("keydown", (e) => {
      if (e.key === "Tab") { e.preventDefault(); const s = code.selectionStart; code.setRangeText("    ", s, code.selectionEnd, "end"); OS.ls.set("lab.code." + lang, code.value); }
      else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(); }
      else if (e.key === "Enter") {
        const s = code.selectionStart, line = code.value.slice(code.value.lastIndexOf("\n", s - 1) + 1, s);
        const ind = (line.match(/^\s*/) || [""])[0] + (/[{:(\[]\s*$/.test(line) ? "    " : "");
        e.preventDefault(); code.setRangeText("\n" + ind, s, code.selectionEnd, "end");
      }
    });
    OS.$$("[data-l]", w).forEach((c) => (c.onclick = () => { lang = c.dataset.l; OS.ls.set("lab.lang", lang); OS.$$("[data-l]", w).forEach((x) => x.classList.toggle("on", x === c)); load(); }));
    OS.$("#reset", w).onclick = () => { if (confirm("Reset to template?")) { code.value = TEMPLATES[lang]; OS.ls.set("lab.code." + lang, code.value); } };
    OS.$("#run", w).onclick = run;
    async function run() {
      const out = OS.$("#out", w); out.innerHTML = `<span class="spinner"></span> running…`;
      try {
        const r = await post("/run", { lang, code: code.value, stdin: OS.$("#stdin", w).value });
        out.innerHTML = (r.stdout ? esc(r.stdout) : "") + (r.stderr ? `<span class="err">${esc(r.stderr)}</span>` : "") || '<span class="dim">(no output)</span>';
        OS.$("#meta", w).textContent = (r.ok ? "✓ " : "✗ ") + (r.steps || []).map((s) => s.cmd.split(" ")[0] + " " + s.ms + "ms").join(" · ");
      } catch (e) { out.innerHTML = `<span class="err">${esc(e.message)}</span>`; }
    }
  };

  // ---------------------------------------------------------------- question bank + miner
  OS.views["/questions"] = async (el, p) => {
    const r = await get("/questions");
    el.appendChild(h(`<div class="page-h"><div><h1>❓ Question bank</h1><p>${r.questions.length} questions with rubrics. Use the ⛏️ miner agent to harvest Q&A for any topic from the web — mined questions join mock interviews.</p></div></div>`));
    const miner = h(`<div class="card"><h3>⛏️ Question miner agent</h3><div class="row"><input id="mt" placeholder="Topic, e.g. Apache Flink, Spring Boot, Redis, Kubernetes, React hooks" style="flex:1;min-width:220px">
      <select id="mk" style="width:auto">${Object.entries(r.tracks).map(([k, v]) => `<option value="${k}">${esc(v.name)}</option>`).join("")}</select><button class="btn primary" id="mg">Mine</button></div><div id="mo"></div></div>`);
    el.appendChild(miner);
    const tabs = h(`<div class="tabs mt"><button class="on" data-t="">All</button>${Object.entries(r.tracks).map(([k, v]) => `<button data-t="${k}">${v.icon} ${esc(v.name.split(" (")[0])}</button>`).join("")}</div>`);
    el.appendChild(tabs);
    const inp = h(`<input placeholder="Filter questions…" class="mb" style="max-width:380px">`); el.appendChild(inp);
    const list = h(`<div class="col"></div>`); el.appendChild(list);
    let track = "";
    const draw = () => {
      const f = inp.value.toLowerCase(); list.innerHTML = "";
      r.questions.filter((q) => (!track || q.track === track) && (!f || q.q.toLowerCase().includes(f))).slice(0, 300).forEach((q) => {
        const d = h(`<details class="qa"><summary>${esc(q.q)} <span class="badge">${esc(q.track)}</span>${q.custom ? ' <span class="badge acc">mined</span>' : ""}${q.level ? ` <span class="badge">${["", "easy", "medium", "hard"][q.level]}</span>` : ""}</summary><div class="a">
          <b>Strong answer covers:</b><ul>${(q.points || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>${q.followups && q.followups.length ? `<b>Follow-ups:</b><ul>${q.followups.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
          <div class="row"><a class="btn sm" href="#/ask?q=${encodeURIComponent(q.q)}">🔭 Research</a><button class="btn sm" data-a="c">🃏 Card</button>${q.source && q.source.startsWith("http") ? `<a class="btn sm ghost" href="${esc(q.source)}" target="_blank">source</a>` : ""}${q.custom ? '<button class="btn sm ghost danger" data-a="d">Delete</button>' : ""}</div></div></details>`);
        d.querySelector('[data-a="c"]').onclick = () => OS.saveCards([{ front: q.q, back: (q.points || []).map((x) => "• " + x).join("\n") }], "Q-bank · " + ((r.tracks[q.track] || {}).name || q.track), "bank");
        const del = d.querySelector('[data-a="d"]'); if (del) del.onclick = async () => { await OS.del("/questions/" + q.id); d.remove(); };
        list.appendChild(d);
      });
    };
    OS.$$("button", tabs).forEach((b) => (b.onclick = () => { track = b.dataset.t; OS.$$("button", tabs).forEach((x) => x.classList.toggle("on", x === b)); draw(); }));
    inp.oninput = OS.debounce(draw, 150);
    draw();
    const mine = async () => {
      const topic = OS.$("#mt", miner).value.trim(); if (!topic) return;
      const mo = OS.$("#mo", miner);
      mo.innerHTML = `<div class="agent-log mt"></div>`;
      try {
        const res = await OS.runAgent("mine", { topic, track: OS.$("#mk", miner).value, save: true }, OS.$(".agent-log", mo));
        mo.appendChild(h(`<div class="mt"><div class="spread"><b>${res.pairs.length} Q&A pairs · ${res.added} added to “${esc(res.track)}”</b><button class="btn sm" id="mc">🃏 All → flashcards</button></div>
          ${res.pairs.map((p) => `<details class="qa"><summary>${esc(p.q)}</summary><div class="a"><ul>${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><a class="xs" href="${esc(p.src)}" target="_blank">source</a></div></details>`).join("")}</div>`));
        OS.$("#mc", mo).onclick = () => OS.saveCards(res.pairs.map((p) => ({ front: p.q, back: p.points.map((x) => "• " + x).join("\n") })), "Mined · " + topic, "mine");
      } catch (e) { mo.innerHTML = "❌ " + esc(e.message); }
    };
    OS.$("#mg", miner).onclick = mine;
    if (p.mine) { OS.$("#mt", miner).value = p.mine; mine(); }
  };

  // ---------------------------------------------------------------- notebook
  OS.views["/notes"] = async (el, p) => {
    el.appendChild(h(`<div class="page-h"><div><h1>📝 Notebook</h1><p>Markdown notes + everything you saved from agents. Full-text search (SQLite FTS5).</p></div><button class="btn primary" id="nn">＋ New note</button></div>`));
    const lay = h(`<div class="notes-layout"><div class="card" style="padding:10px"><input id="ns" placeholder="Search notes…"><div class="row mt xs">${["", "note", "research", "company", "jd"].map((k) => `<span class="chip ${k === "" ? "on" : ""}" data-k="${k}">${k || "all"}</span>`).join("")}</div><div id="nl" class="mt"></div></div><div class="card" id="ne"><div class="empty"><div class="big">📝</div>Select or create a note</div></div></div>`);
    el.appendChild(lay);
    let kind = "", cur = null;
    const nl = OS.$("#nl", lay), ne = OS.$("#ne", lay);
    const list = async () => {
      const q = OS.$("#ns", lay).value.trim();
      const r = await get(`/notes?q=${encodeURIComponent(q)}${kind ? "&kind=" + kind : ""}`);
      nl.innerHTML = "";
      r.notes.forEach((n) => {
        const it = h(`<div class="note-item ${cur === n.id ? "on" : ""}"><div class="spread"><b class="small">${n.pinned ? "📌 " : ""}${esc(n.title)}</b><span class="badge">${esc(n.kind)}</span></div><div class="xs dim">${n.updated ? OS.ago(n.updated) : ""}</div><div class="xs muted">${n.snip ? n.snip.replace(/<(?!\/?mark>)[^>]*>/g, "").slice(0, 140) : ""}</div></div>`);
        it.onclick = () => open(n.id);
        nl.appendChild(it);
      });
      if (!r.notes.length) nl.innerHTML = `<div class="empty small">No notes</div>`;
    };
    const open = async (id) => {
      cur = id; list();
      const n = await get("/notes/" + id);
      ne.innerHTML = "";
      const v = h(`<div><div class="spread"><input id="tt" value="${esc(n.title)}" style="font-size:1.2rem;font-weight:700;border:0;background:transparent;padding:4px 0;flex:1">
        <div class="row"><button class="btn sm ghost" id="pv">👁 Preview</button><button class="btn sm ghost" id="pn">${n.pinned ? "📌 Unpin" : "📌 Pin"}</button><button class="btn sm ghost" id="mc">🃏 Bullets → cards</button><button class="btn sm ghost danger" id="dl">🗑</button></div></div>
        <div class="xs dim">${esc(n.kind)} · created ${OS.ago(n.created)} · <span id="svst">saved</span></div>
        <textarea id="bd" class="mono mt" style="min-height:60vh">${esc(n.body)}</textarea><div id="pvw" class="md hide mt"></div></div>`);
      ne.appendChild(v);
      const save = OS.debounce(async () => { await OS.put("/notes/" + id, { title: OS.$("#tt", v).value, body: OS.$("#bd", v).value }); OS.$("#svst", v).textContent = "saved"; list(); }, 600);
      ["#tt", "#bd"].forEach((s) => OS.$(s, v).addEventListener("input", () => { OS.$("#svst", v).textContent = "editing…"; save(); }));
      OS.$("#pv", v).onclick = () => { const pv = OS.$("#pvw", v), bd = OS.$("#bd", v); pv.innerHTML = OS.md(bd.value); pv.classList.toggle("hide"); bd.classList.toggle("hide"); };
      OS.$("#pn", v).onclick = async () => { await OS.put("/notes/" + id, { pinned: n.pinned ? 0 : 1 }); open(id); };
      OS.$("#dl", v).onclick = async () => { if (confirm("Delete note?")) { await OS.del("/notes/" + id); cur = null; ne.innerHTML = ""; list(); } };
      OS.$("#mc", v).onclick = () => {
        const b = OS.$("#bd", v).value.split("\n").filter((l) => /^\s*[-*•]\s+/.test(l)).map((l) => l.replace(/^\s*[-*•]\s+/, ""));
        OS.saveCards(b.map((x, i) => ({ front: `${OS.$("#tt", v).value} — point ${i + 1}: ${x.split(/[,.:;]/)[0].slice(0, 60)}…?`, back: x })), "Notes · " + OS.$("#tt", v).value.slice(0, 30), "note:" + id);
      };
      if (!n.body) OS.$("#bd", v).focus();
    };
    OS.$("#ns", lay).oninput = OS.debounce(list, 200);
    OS.$$("[data-k]", lay).forEach((c) => (c.onclick = () => { kind = c.dataset.k; OS.$$("[data-k]", lay).forEach((x) => x.classList.toggle("on", x === c)); list(); }));
    OS.$("#nn", el).onclick = async () => { const r = await post("/notes", { title: "Untitled note", body: "" }); open(r.id); };
    await list();
    if (p.id) open(+p.id);
  };

  // ---------------------------------------------------------------- feed
  OS.views["/feed"] = async (el) => {
    el.appendChild(h(`<div class="page-h"><div><h1>📰 Engineering blogs & HN</h1><p>Real-world system design from Netflix, Uber, Meta, Cloudflare, Discord, Stripe, AWS, ByteByteGo… refreshed every 3 hours. Digest any post into key points + flashcards.</p></div><button class="btn" id="rf">⟳ Refresh now</button></div>`));
    const bar = h(`<div class="row mb"><input id="fq" placeholder="Filter (e.g. kafka, cache, postgres)" style="max-width:320px"><select id="ft" style="width:auto"><option value="">All topics</option>${["Kafka", "Distributed Systems", "System Design", "PostgreSQL/MySQL", "Redis/Caching", "Kubernetes", "AWS", "Microservices", "Stream Processing", "LLMs/GenAI", "Observability", "Java", "Python"].map((t) => `<option>${t}</option>`).join("")}</select></div>`);
    el.appendChild(bar);
    const list = h(`<div class="card list"><div class="muted"><span class="spinner"></span> fetching feeds (first load takes ~10s)…</div></div>`); el.appendChild(list);
    const load = async () => {
      const r = await get(`/feed?q=${encodeURIComponent(OS.$("#fq", bar).value)}&tag=${encodeURIComponent(OS.$("#ft", bar).value)}`);
      list.innerHTML = "";
      r.items.forEach((it) => list.appendChild(h(`<div class="item"><div class="spread"><a href="${esc(it.url)}" target="_blank" rel="noopener"><b>${esc(it.title)}</b></a><span class="xs dim">${esc(it.source)} · ${OS.fmtDate(it.published)}</span></div>
        <div class="small muted">${esc(it.summary.slice(0, 240))}</div><div class="row xs mt">${(it.tags || "").split(",").filter(Boolean).map((t) => `<span class="badge">${esc(t)}</span>`).join("")}<a href="#/ask?url=${encodeURIComponent(it.url)}">📖 digest</a></div></div>`)));
      if (!r.items.length) list.innerHTML = `<div class="empty">No items${r.refreshed ? "" : " yet — click refresh"}.</div>`;
    };
    OS.$("#fq", bar).oninput = OS.debounce(load, 250); OS.$("#ft", bar).onchange = load;
    OS.$("#rf", el).onclick = async () => { list.innerHTML = `<div class="muted"><span class="spinner"></span> refreshing ${"22"} feeds…</div>`; const r = await post("/feed/refresh"); OS.toast(`Refreshed ${r.ok || 0} feeds`); load(); };
    load();
  };
})();
