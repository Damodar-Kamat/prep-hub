/* Research agent UI: research / deep research / compare / digest URL / raw web search. */
(function () {
  const { h, esc, get, post } = OS;

  const cite = (n, sources) => {
    const s = sources && sources.find((x) => x.n === n);
    return s ? `<a class="cite" href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">[${n}]</a>` : "";
  };

  function toMarkdown(r) {
    const L = [];
    if (r.type === "compare") {
      L.push(`# ${r.a} vs ${r.b}`, "", `**${r.a}:** ${r.a_def || ""}`, "", `**${r.b}:** ${r.b_def || ""}`, "", "## Key differences");
      r.differences.forEach((x) => L.push("- " + x));
      L.push("", `## ${r.a}`); r.a_points.forEach((x) => L.push("- " + x));
      L.push("", `## ${r.b}`); r.b_points.forEach((x) => L.push("- " + x));
    } else if (r.type === "digest") {
      L.push(`# ${r.title}`, "", r.url, "", "## Key points"); r.key_points.forEach((x) => L.push("- " + x));
      if (r.questions.length) { L.push("", "## Questions"); r.questions.forEach((x) => L.push("- " + x)); }
    } else {
      L.push(`# ${r.query}`, "", r.definition || "", "", "## Key points");
      r.key_points.forEach((k) => L.push(`- ${k.text} [${k.src}]`));
      for (const s of r.sections) { L.push("", "## " + s.title); s.items.forEach((i) => L.push(`- ${i.text} [${i.src}]`)); }
      if (r.questions.length) { L.push("", "## Likely interview questions"); r.questions.slice(0, 15).forEach((q) => L.push("- " + q)); }
      if (r.llm_answer) L.push("", "## Synthesized answer (local LLM)", r.llm_answer);
    }
    if (r.sources) { L.push("", "## Sources"); r.sources.forEach((s) => L.push(`${s.n}. [${s.title}](${s.url})`)); }
    return L.join("\n");
  }

  function actions(r, title) {
    const bar = h(`<div class="row mt"></div>`);
    const b1 = h(`<button class="btn sm">📝 Save to notebook</button>`); b1.onclick = () => OS.saveNote(title, toMarkdown(r), r.type === "company" ? "company" : "research", { query: r.query || r.url });
    const b2 = h(`<button class="btn sm">🃏 Add ${r.flashcards ? r.flashcards.length : 0} flashcards</button>`); b2.onclick = () => OS.saveCards(r.flashcards, "Research · " + title.slice(0, 40), r.url || "research");
    const b3 = h(`<button class="btn sm">📋 Copy markdown</button>`); b3.onclick = () => { navigator.clipboard.writeText(toMarkdown(r)); OS.toast("Copied"); };
    bar.append(b1, b2, b3);
    if (r.type === "research") {
      const b4 = h(`<a class="btn sm" href="#/mock?track=custom&topic=${encodeURIComponent(r.query)}">🎙️ Mock me on this</a>`);
      const b5 = h(`<a class="btn sm" href="#/questions?mine=${encodeURIComponent(r.query)}">⛏️ Mine more Q&A</a>`);
      bar.append(b4, b5);
    }
    return bar;
  }

  function sourcesBlock(sources) {
    return `<h2>🔗 Sources</h2>${sources.map((s) => `<div class="src"><span class="n">[${s.n}]</span><div><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.url)}</a> <span class="dim xs">${esc(s.domain)}</span> <a class="xs" href="#/ask?url=${encodeURIComponent(s.url)}">digest</a></div></div>`).join("")}`;
  }

  function further(f) {
    if (!f) return "";
    const lab = { videos: "🎬 Videos", repos: "📦 Repos", discussions: "💬 Discussions", papers: "📄 Papers", qa: "❔ Stack Overflow" };
    const parts = Object.entries(f).map(([k, v]) => `<div><h3>${lab[k] || k}</h3>${v.map((x) => `<div class="small" style="margin:4px 0"><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a></div>`).join("")}</div>`);
    return parts.length ? `<h2>📚 Further reading</h2><div class="grid g2">${parts.join("")}</div>` : "";
  }

  OS.renderResearch = (r) => {
    const box = h(`<div class="report"></div>`);
    if (r.type === "compare") {
      box.appendChild(h(`<div><h1>${esc(r.a)} <span class="dim">vs</span> ${esc(r.b)}</h1>
        <div class="grid g2"><div class="def"><b>${esc(r.a)}</b><br><span class="small">${esc(r.a_def || "—")}</span></div><div class="def"><b>${esc(r.b)}</b><br><span class="small">${esc(r.b_def || "—")}</span></div></div>
        <h2>⚖️ Key differences</h2>${r.differences.map((x) => `<div class="point">${esc(x)}</div>`).join("") || '<div class="muted">No explicit comparison sentences found.</div>'}
        <div class="grid g2"><div><h2>${esc(r.a)}</h2>${r.a_points.map((x) => `<div class="point">${esc(x)}</div>`).join("")}${r.when_a.length ? `<h3 class="mt">When to choose</h3>${r.when_a.map((x) => `<div class="point small">${esc(x)}</div>`).join("")}` : ""}</div>
        <div><h2>${esc(r.b)}</h2>${r.b_points.map((x) => `<div class="point">${esc(x)}</div>`).join("")}${r.when_b.length ? `<h3 class="mt">When to choose</h3>${r.when_b.map((x) => `<div class="point small">${esc(x)}</div>`).join("")}` : ""}</div></div>
        ${r.questions.length ? `<h2>❓ Interview questions</h2><ul>${r.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>` : ""}
        ${further(r.further)}${sourcesBlock(r.sources)}</div>`));
      box.appendChild(actions(r, r.query));
      return box;
    }
    if (r.type === "digest") {
      box.appendChild(h(`<div><div class="dim small">${esc(r.site)} · ${r.reading_minutes} min read · via ${esc(r.via)}</div><h1>${esc(r.title)}</h1><a class="small" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url)}</a>
        ${r.description ? `<div class="def mt">${esc(r.description)}</div>` : ""}
        <h2>🎯 Key points</h2>${r.key_points.map((x) => `<div class="point">${esc(x)}</div>`).join("")}
        ${r.outline.length ? `<h2>🗂️ Outline</h2><div class="row">${r.outline.map((x) => `<span class="badge">${esc(x)}</span>`).join("")}</div>` : ""}
        ${r.qa.length ? `<h2>💬 Q&A found on the page</h2>${r.qa.map((p) => `<details class="qa"><summary>${esc(p.q)}</summary><div class="a">${p.a.map((a) => `<p>${esc(a)}</p>`).join("")}</div></details>`).join("")}` : ""}
        ${r.questions.length ? `<h2>❓ Questions raised</h2><ul>${r.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>` : ""}
        ${r.code.length ? `<h2>💻 Code</h2>${r.code.map((c) => `<pre><code>${esc(c)}</code></pre>`).join("")}` : ""}
        <h2>🏷️ Key phrases</h2><div class="row">${r.keyphrases.map((k) => `<a class="chip" href="#/ask?q=${encodeURIComponent(k)}">${esc(k)}</a>`).join("")}</div></div>`));
      box.appendChild(actions(r, r.title));
      return box;
    }
    const S = r.sources;
    box.appendChild(h(`<div>
      <div class="spread"><h1 style="margin:0">${esc(r.query)}</h1><span class="badge acc">${r.depth === "deep" ? "deep research" : "research"} · ${S.length} sources · ${OS.ago(r.created)}</span></div>
      ${r.definition ? `<div class="def mt">${esc(r.definition)}${r.wiki && r.wiki.url ? ` <a class="xs" href="${esc(r.wiki.url)}" target="_blank" rel="noopener">Wikipedia ↗</a>` : ""}</div>` : ""}
      ${r.llm_answer ? `<h2>🤖 Synthesized answer <span class="badge">local LLM</span></h2><div class="card md">${OS.md(r.llm_answer)}</div>` : ""}
      ${r.local_topics && r.local_topics.length ? `<h2>📘 In your library</h2><div class="row">${r.local_topics.map((t) => `<a class="chip" href="${t.href}">${t.kind === "problem" ? "🧩" : "📘"} ${esc(t.title)}</a>`).join("")}</div>` : ""}
      <h2>🎯 Key points</h2>${r.key_points.map((k) => `<div class="point">${esc(k.text)}${cite(k.src, S)}</div>`).join("")}
      ${r.sections.map((s) => `<h2>${{ definition: "📖", how: "⚙️", pros: "✅", cons: "⚖️", uses: "🏭", pitfalls: "⚠️" }[s.id] || "•"} ${esc(s.title)}</h2>${s.items.map((i) => `<div class="point">${esc(i.text)}${cite(i.src, S)}</div>`).join("")}`).join("")}
      ${r.qa.length ? `<h2>💬 Interview Q&A harvested from the web</h2>${r.qa.slice(0, 12).map((p) => `<details class="qa"><summary>${esc(p.q)}${cite(p.src, S)}</summary><div class="a">${p.a.map((a) => `<p>${esc(a)}</p>`).join("")}</div></details>`).join("")}` : ""}
      ${r.questions.length ? `<h2>❓ Questions interviewers ask</h2><ul>${r.questions.slice(0, 18).map((q) => `<li>${esc(q)} <a class="xs" href="#/ask?q=${encodeURIComponent(q)}">research</a></li>`).join("")}</ul>` : ""}
      ${r.code.length ? `<h2>💻 Code from sources</h2>${r.code.map((c) => `<div class="xs dim">from ${cite(c.src, S)}</div><pre><code>${esc(c.code)}</code></pre>`).join("")}` : ""}
      ${r.related.length ? `<h2>🧭 Related — keep exploring</h2><div class="row">${r.related.map((k) => `<a class="chip" href="#/ask?q=${encodeURIComponent(k)}">${esc(k)}</a>`).join("")}</div>` : ""}
      ${further(r.further)}${sourcesBlock(S)}</div>`));
    box.appendChild(actions(r, r.query));
    return box;
  };

  OS.views["/ask"] = async (el, p) => {
    el.appendChild(h(`<div class="page-h"><div><h1>🔭 Research agent</h1><p>Searches the open web (DuckDuckGo, Brave, Wikipedia, Stack Overflow, Hacker News, GitHub, arXiv…), reads the best pages and writes a cited, interview-ready cheat-sheet — no API keys.</p></div></div>`));
    const form = h(`<div class="card">
      <div class="row"><input id="q" placeholder="e.g. consistent hashing · kafka vs rabbitmq · how does raft work · https://any-article-url" style="flex:1;min-width:240px;font-size:1.02rem;padding:11px 14px">
      <select id="mode" style="width:auto"><option value="quick">Research</option><option value="deep">Deep research</option><option value="search">Web search only</option></select>
      <button class="btn primary lg" id="go">Go</button></div>
      <div class="row mt xs"><span class="dim">Try:</span>${["consistent hashing", "Kafka vs RabbitMQ", "Flink watermarks", "database isolation levels", "how does Raft consensus work", "Java virtual threads", "CQRS and event sourcing", "rate limiter design"].map((x) => `<a class="chip" data-t="${esc(x)}">${esc(x)}</a>`).join("")}</div>
    </div>`);
    el.appendChild(form);
    const out = h(`<div class="mt"></div>`); el.appendChild(out);
    const hist = h(`<div class="card mt"><h3>🕘 Recent research</h3><div class="row"></div></div>`); el.appendChild(hist);
    get("/history").then((r) => {
      const row = hist.lastElementChild;
      if (!r.items.length) return hist.remove();
      r.items.forEach((it) => row.appendChild(h(`<a class="chip" href="${it.kind === "company" ? "#/company?name=" + encodeURIComponent(it.query) : "#/ask?q=" + encodeURIComponent(it.query) + (it.key.endsWith(":deep") ? "&deep=1" : "")}">${it.kind === "company" ? "🏢" : "🔭"} ${esc(it.query)}</a>`)));
    });

    const inp = OS.$("#q", form), mode = OS.$("#mode", form);
    OS.$$("[data-t]", form).forEach((c) => (c.onclick = () => { inp.value = c.dataset.t; run(); }));
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
    OS.$("#go", form).onclick = run;

    async function run() {
      const q = inp.value.trim(); if (!q) return;
      const m = mode.value;
      const isUrl = /^https?:\/\//i.test(q);
      const nh = isUrl ? "#/ask?url=" + encodeURIComponent(q) : "#/ask?q=" + encodeURIComponent(q) + (m === "deep" ? "&deep=1" : m === "search" ? "&search=1" : "");
      if (location.hash !== nh) { history.replaceState(null, "", nh); }
      out.innerHTML = "";
      if (m === "search" && !isUrl) return webSearch(q);
      const card = h(`<div class="card"><div class="spread"><b><span class="spinner"></span> ${isUrl ? "Reading & digesting" : "Researching"} <span class="muted">${esc(q)}</span></b><span class="dim xs" id="pct"></span></div><div class="bar mt"><i style="width:3%"></i></div><div class="agent-log mt"></div></div>`);
      out.appendChild(card);
      try {
        const r = await OS.runAgent(isUrl ? "digest" : "research", isUrl ? { url: q } : { query: q, depth: m === "deep" ? "deep" : "quick" },
          OS.$(".agent-log", card), (p) => { OS.$(".bar i", card).style.width = Math.max(3, p * 100) + "%"; OS.$("#pct", card).textContent = Math.round(p * 100) + "%"; });
        card.querySelector("b").innerHTML = "✅ Done";
        const det = h(`<details class="mt"><summary class="small muted" style="cursor:pointer">Agent trace</summary></details>`);
        card.replaceWith(det); det.appendChild(card);
        out.appendChild(h(`<div class="card pad-lg mt"></div>`)).appendChild(OS.renderResearch(r));
        OS.post("/activity", { minutes: 2 });
      } catch (e) {
        card.querySelector("b").innerHTML = "❌ " + esc(e.message);
      }
    }

    async function webSearch(q) {
      const card = h(`<div class="card"><div class="muted"><span class="spinner"></span> searching the web…</div></div>`); out.appendChild(card);
      const srcs = ["web", "wikipedia", "stackoverflow", "hackernews", "github", "reddit", "youtube"];
      try {
        const r = await get("/search?q=" + encodeURIComponent(q) + "&sources=" + srcs.join(","));
        card.innerHTML = `<div class="spread"><h3>${r.results.length} results for “${esc(q)}”</h3><button class="btn sm primary" id="rs">🔭 Research this instead</button></div>
          <div class="row mb">${srcs.map((s) => `<span class="chip" data-s="${s}">${s} (${r.results.filter((x) => x.source === s || (x.also || []).includes(s)).length})</span>`).join("")}</div><div id="rl"></div>`;
        OS.$("#rs", card).onclick = () => { mode.value = "quick"; run(); };
        const rl = OS.$("#rl", card);
        const draw = (f) => {
          rl.innerHTML = "";
          r.results.filter((x) => !f || x.source === f || (x.also || []).includes(f)).forEach((x) => rl.appendChild(h(`<div class="result"><div class="u">${esc(x.domain)} · ${esc(x.source)}${x.date ? " · " + esc(x.date) : ""}</div><div class="t"><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a></div><div class="s">${esc(x.snippet)}</div><div class="row xs"><a href="#/ask?url=${encodeURIComponent(x.url)}">📖 digest with agent</a></div></div>`)));
        };
        OS.$$("[data-s]", card).forEach((c) => (c.onclick = () => { const on = !c.classList.contains("on"); OS.$$("[data-s]", card).forEach((x) => x.classList.remove("on")); if (on) c.classList.add("on"); draw(on ? c.dataset.s : null); }));
        draw(null);
        if (Object.keys(r.errors).length) card.appendChild(h(`<div class="xs dim mt">Some sources failed: ${esc(Object.keys(r.errors).join(", "))}</div>`));
      } catch (e) { card.innerHTML = "❌ " + esc(e.message); }
    }

    if (p.url) { inp.value = p.url; run(); }
    else if (p.q) { inp.value = p.q; mode.value = p.deep ? "deep" : p.search ? "search" : "quick"; run(); }
    else inp.focus();
  };
})();
