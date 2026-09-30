/* Interview OS — core: API client, router, DOM helpers, agent runner, command palette. */
(function () {
  "use strict";
  const OS = (window.OS = { views: {}, state: {} });

  // ---------------------------------------------------------------- helpers
  OS.esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  OS.h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  OS.$ = (sel, root) => (root || document).querySelector(sel);
  OS.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  OS.fmtDate = (ts) => new Date(ts * 1000).toLocaleDateString([], { month: "short", day: "numeric" });
  OS.ago = (ts) => {
    const s = Date.now() / 1000 - ts;
    if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago"; if (s < 86400 * 30) return Math.floor(s / 86400) + "d ago";
    return OS.fmtDate(ts);
  };
  OS.domain = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (_) { return ""; } };
  OS.toast = (msg, ms) => {
    const t = OS.h(`<div class="toast">${msg}</div>`); document.body.appendChild(t);
    setTimeout(() => t.remove(), ms || 2600);
  };
  OS.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  OS.ls = {
    get(k, d) { try { const v = localStorage.getItem("ios." + k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem("ios." + k, JSON.stringify(v)); } catch (_) {} },
  };

  // tiny, safe markdown (headings, lists, code, bold, italics, links)
  OS.md = (src) => {
    const lines = String(src || "").split("\n"); let html = "", inCode = false, inList = false, code = [];
    const inline = (s) => OS.esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<i>$2</i>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+|#[^)\s]*|\/[^)\s]*)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
    for (const ln of lines) {
      if (ln.trim().startsWith("```")) { if (inCode) { html += "<pre><code>" + OS.esc(code.join("\n")) + "</code></pre>"; code = []; } inCode = !inCode; continue; }
      if (inCode) { code.push(ln); continue; }
      const m = ln.match(/^(#{1,4})\s+(.*)/), li = ln.match(/^\s*([-*•]|\d+\.)\s+(.*)/);
      if (li) { if (!inList) { html += "<ul>"; inList = true; } html += "<li>" + inline(li[2]) + "</li>"; continue; }
      if (inList) { html += "</ul>"; inList = false; }
      if (m) html += `<h${m[1].length + 1}>${inline(m[2])}</h${m[1].length + 1}>`;
      else if (ln.trim()) html += "<p>" + inline(ln) + "</p>";
    }
    if (inList) html += "</ul>"; if (inCode) html += "<pre><code>" + OS.esc(code.join("\n")) + "</code></pre>";
    return html;
  };

  // ---------------------------------------------------------------- API
  OS.api = async (path, opts) => {
    opts = opts || {};
    const init = { method: opts.method || (opts.body ? "POST" : "GET"), headers: {} };
    if (opts.body !== undefined) { init.body = JSON.stringify(opts.body); init.headers["Content-Type"] = "application/json"; }
    const r = await fetch("/api" + path, init);
    if (r.status === 401) { location.href = "/login?next=" + encodeURIComponent(location.pathname + location.hash); throw new Error("login required"); }
    let j; try { j = await r.json(); } catch (_) { j = { error: "bad response" }; }
    if (!r.ok) throw new Error(j.error || "HTTP " + r.status);
    return j;
  };
  OS.get = (p) => OS.api(p);
  OS.post = (p, b) => OS.api(p, { body: b || {} });
  OS.put = (p, b) => OS.api(p, { method: "PUT", body: b || {} });
  OS.del = (p) => OS.api(p, { method: "DELETE" });

  // Run a background agent, streaming its log into `logEl`; resolves with the result.
  OS.runAgent = (kind, params, logEl, onProgress) => new Promise(async (resolve, reject) => {
    let job;
    try { job = (await OS.post("/agent/" + kind, params)).job; } catch (e) { return reject(e); }
    let since = 0;
    const tick = async () => {
      let v;
      try { v = await OS.get(`/jobs/${job}?since=${since}`); } catch (e) { return reject(e); }
      since = v.log_count;
      if (logEl) {
        for (const l of v.logs) logEl.appendChild(OS.h(`<div><span class="t">${l.t.toFixed(1)}s</span>${OS.esc(l.msg)}</div>`));
        logEl.scrollTop = logEl.scrollHeight;
      }
      if (onProgress) onProgress(v.progress);
      if (v.status === "done") return resolve(v.result);
      if (v.status === "error") return reject(new Error(v.error));
      setTimeout(tick, 450);
    };
    tick();
  });

  // ---------------------------------------------------------------- router
  OS.nav = [
    ["Prepare", null],
    ["#/", "🏠", "Home"],
    ["#/ask", "🔭", "Research agent"],
    ["#/mock", "🎙️", "Mock interview"],
    ["#/cards", "🃏", "Flashcards"],
    ["#/plan", "🗓️", "Study plan"],
    ["Target", null],
    ["#/company", "🏢", "Company intel"],
    ["#/pipeline", "📋", "Applications"],
    ["#/jd", "🎯", "JD matcher"],
    ["#/stories", "⭐", "Story bank"],
    ["Build & learn", null],
    ["#/lab", "⌨️", "Code lab"],
    ["#/questions", "❓", "Question bank"],
    ["#/notes", "📝", "Notebook"],
    ["#/feed", "📰", "Eng. blogs & HN"],
    ["#/settings", "⚙️", "Settings"],
  ];
  function renderNav() {
    const nav = OS.$("#nav"); nav.innerHTML = "";
    const cur = location.hash.split("?")[0] || "#/";
    for (const [href, ic, label] of OS.nav) {
      if (!ic) { nav.appendChild(OS.h(`<div class="nav-h">${href}</div>`)); continue; }
      const a = OS.h(`<a href="${href}"><span class="ic">${ic}</span>${label}<span class="badge hide" data-badge="${href}"></span></a>`);
      if (href === cur || (href !== "#/" && cur.startsWith(href))) a.classList.add("active");
      nav.appendChild(a);
    }
    OS.refreshBadges();
  }
  OS.refreshBadges = async () => {
    try {
      const s = await OS.get("/cards/stats");
      const b = OS.$('[data-badge="#/cards"]');
      if (b && s.due) { b.textContent = s.due > 999 ? "999+" : s.due; b.classList.remove("hide"); b.classList.add("acc"); }
    } catch (_) {}
  };
  OS.params = () => { const q = (location.hash.split("?")[1] || ""); return Object.fromEntries(new URLSearchParams(q)); };
  OS.go = (h) => { if (location.hash === h) route(); else location.hash = h; };
  async function route() {
    const path = (location.hash.split("?")[0] || "#/").slice(1) || "/";
    const key = "/" + (path.split("/")[1] || "");
    const view = OS.views[key] || OS.views["/"];
    const el = OS.$("#view");
    el.innerHTML = "";
    OS.$("#side").classList.remove("open");
    renderNav();
    window.scrollTo(0, 0);
    try { await view(el, OS.params(), path); }
    catch (e) { console.error(e); el.appendChild(OS.h(`<div class="card"><b>Something went wrong:</b> ${OS.esc(e.message)}</div>`)); }
  }
  window.addEventListener("hashchange", route);
  OS.start = () => { route(); };

  // ---------------------------------------------------------------- command palette (⌘K)
  const COMMANDS = () => [
    ...OS.nav.filter((n) => n[1]).map((n) => ({ grp: "Go to", icon: n[1], label: n[2], run: () => OS.go(n[0]) })),
    { grp: "Go to", icon: "📚", label: "Prep Hub library (DSA plan, concepts, practice)", run: () => (location.href = "/index.html") },
    { grp: "Go to", icon: "⚡", label: "Last-minute cram sheet", run: () => (location.href = "/index.html#/cram") },
    { grp: "Do", icon: "🎙️", label: "Start a behavioral mock", run: () => OS.go("#/mock?track=behavioral&start=1") },
    { grp: "Do", icon: "🏗️", label: "Start a system design mock", run: () => OS.go("#/mock?track=system-design&start=1") },
    { grp: "Do", icon: "🃏", label: "Review due flashcards", run: () => OS.go("#/cards?review=1") },
    { grp: "Do", icon: "🌗", label: "Toggle theme", run: () => OS.toggleTheme() },
  ];
  OS.palette = (initial) => {
    if (OS.$(".palette-bg")) return;
    const bg = OS.h(`<div class="palette-bg"><div class="palette"><input placeholder="Research a topic, paste a URL, ask a question, or jump to…" /><div class="opts"></div></div></div>`);
    document.body.appendChild(bg);
    const inp = OS.$("input", bg), opts = OS.$(".opts", bg);
    let sel = 0, items = [];
    const close = () => bg.remove();
    bg.addEventListener("mousedown", (e) => { if (e.target === bg) close(); });
    const localSearch = OS.debounce(async (q) => {
      if (q.length < 3) return;
      try {
        const r = await OS.get("/local?q=" + encodeURIComponent(q));
        if (inp.value.trim() !== q) return;
        const extra = [
          ...r.library.slice(0, 5).map((x) => ({ grp: "In your library", icon: x.kind === "problem" ? "🧩" : "📘", label: x.title, sub: x.section, run: () => (location.href = x.href) })),
          ...r.notes.slice(0, 4).map((n) => ({ grp: "In your notebook", icon: "📝", label: n.title, run: () => OS.go("#/notes?id=" + n.id) })),
        ];
        draw(q, extra);
      } catch (_) {}
    }, 220);
    function draw(q, extra) {
      const ql = q.toLowerCase();
      const isUrl = /^https?:\/\//i.test(q);
      const top = [];
      if (q) {
        if (isUrl) top.push({ grp: "Agents", icon: "📖", label: "Read & digest this page", sub: OS.domain(q), run: () => OS.go("#/ask?url=" + encodeURIComponent(q)) });
        else {
          top.push({ grp: "Agents", icon: "🔭", label: `Research “${q}” across the web`, sub: "cited cheat-sheet · ~10s", run: () => OS.go("#/ask?q=" + encodeURIComponent(q)) });
          top.push({ grp: "Agents", icon: "🔬", label: `Deep research “${q}”`, sub: "more sources · ~30s", run: () => OS.go("#/ask?deep=1&q=" + encodeURIComponent(q)) });
          top.push({ grp: "Agents", icon: "🏢", label: `Company intel: “${q}”`, run: () => OS.go("#/company?name=" + encodeURIComponent(q)) });
          top.push({ grp: "Agents", icon: "⛏️", label: `Mine interview questions about “${q}”`, run: () => OS.go("#/questions?mine=" + encodeURIComponent(q)) });
          top.push({ grp: "Agents", icon: "🌐", label: `Quick web search “${q}”`, run: () => OS.go("#/ask?search=1&q=" + encodeURIComponent(q)) });
        }
      }
      const cmds = COMMANDS().filter((c) => !q || c.label.toLowerCase().includes(ql));
      items = [...(extra || []), ...top, ...cmds];
      if (sel >= items.length) sel = 0;
      let grp = "", html = "";
      items.forEach((it, i) => {
        if (it.grp !== grp) { grp = it.grp; html += `<div class="grp">${grp}</div>`; }
        html += `<div class="opt ${i === sel ? "sel" : ""}" data-i="${i}"><span>${it.icon}</span><span>${OS.esc(it.label)}</span>${it.sub ? `<span class="k">${OS.esc(it.sub)}</span>` : ""}</div>`;
      });
      opts.innerHTML = html || `<div class="empty">Type to research anything</div>`;
      OS.$$(".opt", opts).forEach((o) => o.onclick = () => { close(); items[+o.dataset.i].run(); });
    }
    inp.addEventListener("input", () => { sel = 0; draw(inp.value.trim()); localSearch(inp.value.trim()); });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowDown") { sel = Math.min(items.length - 1, sel + 1); draw(inp.value.trim(), items.filter((x) => x.grp.startsWith("In your"))); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); draw(inp.value.trim(), items.filter((x) => x.grp.startsWith("In your"))); e.preventDefault(); }
      else if (e.key === "Enter" && items[sel]) { close(); items[sel].run(); }
    });
    if (initial) inp.value = initial;
    draw(inp.value.trim()); inp.focus();
  };
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); OS.palette(); }
    else if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { e.preventDefault(); OS.palette(); }
  });

  // ---------------------------------------------------------------- theme
  OS.toggleTheme = () => {
    const r = document.documentElement, n = r.dataset.theme === "dark" ? "light" : "dark";
    r.dataset.theme = n; OS.ls.set("theme", n);
  };
  document.documentElement.dataset.theme = OS.ls.get("theme", window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

  // shared UI bits
  OS.scoreColor = (s) => s >= 8 ? "var(--ok)" : s >= 6.5 ? "var(--info)" : s >= 5 ? "var(--warn)" : "var(--bad)";
  // score 0..10 → ring; `label` overrides the text in the middle (e.g. "72%")
  OS.ring = (s, size, label) => `<div class="score-ring" style="flex:none;width:${size || 88}px;height:${size || 88}px;font-size:${(size || 88) / 88 * 1.4}rem;background:conic-gradient(${OS.scoreColor(s || 0)} ${(s || 0) * 36}deg, var(--panel2) 0);"><div style="width:78%;height:78%;border-radius:50%;background:var(--panel);display:grid;place-items:center">${label != null ? label : s == null ? "–" : s}</div></div>`;
  OS.saveCards = async (cards, deck, source) => {
    if (!cards || !cards.length) return OS.toast("No cards to add");
    const r = await OS.post("/cards", { cards, deck, source });
    OS.toast(`🃏 Added ${r.added} flashcards to “${deck}”`); OS.refreshBadges();
  };
  OS.saveNote = async (title, body, kind, meta) => {
    const r = await OS.post("/notes", { title, body, kind: kind || "note", meta: meta || {} });
    OS.toast(`📝 Saved to notebook · <a href="#/notes?id=${r.id}">open</a>`);
    return r.id;
  };
})();
