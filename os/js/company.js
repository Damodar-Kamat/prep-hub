/* Company intel agent + application pipeline (kanban). */
(function () {
  const { h, esc, get, post } = OS;
  const STAGES = ["Wishlist", "Applied", "OA", "Phone", "Onsite", "Offer", "Rejected"];

  OS.views["/company"] = async (el, p) => {
    el.appendChild(h(`<div class="page-h"><div><h1>🏢 Company intel</h1><p>An agent that scours interview experiences (GeeksforGeeks, LeetCode Discuss, Reddit, Glassdoor snippets, blogs, HN) and builds a dossier: rounds, hot topics, actual problems asked, tips, values.</p></div></div>`));
    const form = h(`<div class="card"><div class="row"><input id="cn" placeholder="Company (e.g. Amazon, Google, Uber, Atlassian, Flipkart)" style="flex:2;min-width:200px"><input id="cr" placeholder="Role (e.g. SDE 2, Senior Data Engineer)" style="flex:1;min-width:180px"><button class="btn primary lg" id="go">Build dossier</button></div>
      <div class="row mt xs"><span class="dim">Popular:</span>${["Amazon", "Google", "Microsoft", "Meta", "Uber", "Atlassian", "Flipkart", "Netflix", "Stripe", "Databricks"].map((c) => `<a class="chip" data-c="${c}">${c}</a>`).join("")}</div></div>`);
    el.appendChild(form);
    const out = h(`<div class="mt"></div>`); el.appendChild(out);
    const cn = OS.$("#cn", form), cr = OS.$("#cr", form);
    OS.$$("[data-c]", form).forEach((c) => (c.onclick = () => { cn.value = c.dataset.c; run(); }));
    OS.$("#go", form).onclick = run;
    [cn, cr].forEach((i) => i.addEventListener("keydown", (e) => e.key === "Enter" && run()));

    async function run() {
      const name = cn.value.trim(); if (!name) return cn.focus();
      const role = cr.value.trim() || "Software Engineer";
      history.replaceState(null, "", `#/company?name=${encodeURIComponent(name)}&role=${encodeURIComponent(role)}`);
      out.innerHTML = "";
      const card = h(`<div class="card"><b><span class="spinner"></span> Investigating ${esc(name)} · ${esc(role)}</b><div class="bar mt"><i style="width:3%"></i></div><div class="agent-log mt"></div></div>`);
      out.appendChild(card);
      try {
        const r = await OS.runAgent("company", { name, role }, OS.$(".agent-log", card), (pp) => (OS.$(".bar i", card).style.width = Math.max(3, pp * 100) + "%"));
        const det = h(`<details><summary class="small muted" style="cursor:pointer">Agent trace</summary></details>`); card.replaceWith(det); det.appendChild(card);
        out.appendChild(render(r));
      } catch (e) { card.querySelector("b").textContent = "❌ " + e.message; }
    }
    if (p.name) { cn.value = p.name; cr.value = p.role || ""; run(); }
  };

  function render(r) {
    const S = r.sources;
    const cite = (n) => { const s = S.find((x) => x.n === n); return s ? `<a class="cite" href="${esc(s.url)}" target="_blank" rel="noopener">[${n}]</a>` : ""; };
    const maxR = Math.max(1, ...r.rounds.map((x) => x.mentions)), maxT = Math.max(1, ...r.topics.map((x) => x.mentions));
    const box = h(`<div class="report mt">
      <div class="card pad-lg">
        <div class="spread"><h1 style="margin:0">${esc(r.company)} <span class="muted" style="font-weight:500">· ${esc(r.role)}</span></h1>
          <div class="row"><button class="btn sm" id="track">＋ Track application</button><a class="btn sm primary" href="#/mock?start=1&track=behavioral&company=${encodeURIComponent(r.company)}">🎙️ ${esc(r.company)}-style mock</a></div></div>
        ${r.about ? `<div class="def mt small">${esc(r.about.extract)}</div>` : ""}
        ${r.llm_plan ? `<h2>🤖 Prep strategy (local LLM)</h2><div class="md">${OS.md(r.llm_plan)}</div>` : ""}
      </div>
      <div class="grid g2 mt">
        <div class="card"><h3>🧭 Interview process signals</h3><div class="col">${r.rounds.map((x) => `<div><div class="spread small"><span>${esc(x.round)}</span><span class="dim">${x.mentions} mentions</span></div><div class="bar"><i style="width:${100 * x.mentions / maxR}%"></i></div></div>`).join("") || '<div class="muted">No clear signals</div>'}</div></div>
        <div class="card"><h3>🔥 Hot topics</h3><div class="col">${r.topics.slice(0, 12).map((x) => `<div><div class="spread small"><a href="#/ask?q=${encodeURIComponent(x.topic.replace("DSA · ", "") + " interview")}">${esc(x.topic)}</a><span class="dim">${x.mentions}</span></div><div class="bar"><i style="width:${100 * x.mentions / maxT}%"></i></div></div>`).join("")}</div></div>
      </div>
      ${r.values ? `<div class="card mt"><h3>💎 ${esc(r.values.title)}</h3><div class="row">${r.values.values.map((v) => `<span class="badge acc">${esc(v)}</span>`).join("")}</div><div class="small muted mt">Map one STAR story to each of these in your <a href="#/stories">Story bank</a>.</div></div>` : ""}
      ${r.problems.length ? `<div class="card mt"><h3>🧩 Problems mentioned in experiences</h3><div class="row">${r.problems.map((x) => `<a class="chip" href="${x.local ? "/index.html#/problem/" + x.local : x.lc ? "https://leetcode.com/problems/" + x.lc + "/" : "#/ask?q=" + encodeURIComponent(x.title)}" target="${x.local ? "" : "_blank"}">${esc(x.title)} <span class="dim">×${x.mentions}</span></a>`).join("")}</div></div>` : ""}
      <div class="grid g2 mt">
        <div class="card"><h3>📋 What candidates report</h3>${r.overview.map((x) => `<div class="point small">${esc(x.text)}${cite(x.src)}</div>`).join("")}</div>
        <div class="card"><h3>💡 Tips from candidates</h3>${r.tips.map((x) => `<div class="point small">${esc(x.text)}${cite(x.src)}</div>`).join("") || '<div class="muted small">—</div>'}</div>
      </div>
      ${r.questions.length ? `<div class="card mt"><div class="spread"><h3>❓ Questions reported (${r.questions.length})</h3><button class="btn sm" id="qcards">🃏 All → flashcards</button></div><ol class="small">${r.questions.map((q) => `<li>${esc(q.q)}${cite(q.src)} <a class="xs" href="#/ask?q=${encodeURIComponent(q.q)}">research</a></li>`).join("")}</ol></div>` : ""}
      <div class="grid g2 mt">
        <div class="card"><h3>📰 Interview experiences</h3>${r.experiences.map((x) => `<div class="result"><div class="u">${esc(x.domain)}</div><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a><div class="s">${esc(x.snippet)}</div><a class="xs" href="#/ask?url=${encodeURIComponent(x.url)}">📖 digest</a></div>`).join("")}</div>
        <div class="card"><h3>🛠️ Engineering blog & discussions</h3>${r.engineering_blog.map((x) => `<div class="small" style="margin:5px 0"><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a></div>`).join("")}<hr>${r.discussions.map((x) => `<div class="small" style="margin:5px 0"><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a></div>`).join("") || '<div class="muted small">—</div>'}
        <h3 class="mt">🔗 Sources read</h3>${S.map((s) => `<div class="src"><span class="n">[${s.n}]</span><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></div>`).join("")}</div>
      </div>
      <div class="row mt"><button class="btn" id="save">📝 Save dossier to notebook</button></div>
    </div>`);
    OS.$("#track", box).onclick = async () => { await post("/companies", { name: r.company, role: r.role, stage: "Wishlist" }); OS.toast(`Tracking ${esc(r.company)} · <a href="#/pipeline">pipeline</a>`); };
    const qc = OS.$("#qcards", box);
    if (qc) qc.onclick = () => OS.saveCards(r.questions.map((q) => ({ front: q.q, back: "Reported in a " + r.company + " interview. Practise answering out loud; research it for key points." })), r.company + " questions", "company");
    OS.$("#save", box).onclick = () => {
      const md = [`# ${r.company} — ${r.role}`, "", "## Process", ...r.rounds.map((x) => `- ${x.round} (${x.mentions})`), "", "## Hot topics", ...r.topics.slice(0, 12).map((x) => `- ${x.topic}`),
        "", "## Problems", ...r.problems.map((x) => `- ${x.title}`), "", "## Tips", ...r.tips.map((x) => `- ${x.text}`), "", "## Questions", ...r.questions.map((q) => `- ${q.q}`),
        "", "## Sources", ...S.map((s) => `${s.n}. [${s.title}](${s.url})`)].join("\n");
      OS.saveNote(`${r.company} — interview dossier`, md, "company", { company: r.company });
    };
    return box;
  }

  // ---------------------------------------------------------------- pipeline
  OS.views["/pipeline"] = async (el) => {
    const r = await get("/companies");
    el.appendChild(h(`<div class="page-h"><div><h1>📋 Applications</h1><p>Drag cards between stages. Set the next interview date to get countdowns on Home and a tailored plan.</p></div><button class="btn primary" id="new">＋ Add company</button></div>`));
    const kb = h(`<div class="kanban"></div>`); el.appendChild(kb);
    for (const s of STAGES) {
      const items = r.companies.filter((c) => c.stage === s);
      const col = h(`<div class="kcol" data-stage="${s}"><h4><span>${s}</span><span>${items.length}</span></h4></div>`);
      col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("drag"); });
      col.addEventListener("dragleave", () => col.classList.remove("drag"));
      col.addEventListener("drop", async (e) => {
        e.preventDefault(); col.classList.remove("drag");
        const c = r.companies.find((x) => x.id == e.dataTransfer.getData("id"));
        if (c && c.stage !== s) { c.stage = s; await post("/companies", c); OS.go("#/pipeline"); }
      });
      for (const c of items) {
        const k = h(`<div class="kcard" draggable="true"><b>${esc(c.name)}</b><div class="xs muted">${esc(c.role || "")}</div>${c.next_date ? `<div class="xs mt">📅 ${esc(c.next_date)}</div>` : ""}${c.salary ? `<div class="xs dim">💰 ${esc(c.salary)}</div>` : ""}
          <div class="row mt" style="gap:4px"><button class="btn sm ghost" data-a="e">✎</button><a class="btn sm ghost" href="#/company?name=${encodeURIComponent(c.name)}&role=${encodeURIComponent(c.role || "")}">🔎</a><a class="btn sm ghost" href="#/mock?start=1&track=behavioral&company=${encodeURIComponent(c.name)}">🎙️</a></div></div>`);
        k.addEventListener("dragstart", (e) => e.dataTransfer.setData("id", c.id));
        k.querySelector('[data-a="e"]').onclick = () => edit(c);
        col.appendChild(k);
      }
      kb.appendChild(col);
    }
    OS.$("#new", el).onclick = () => edit({});
    function edit(c) {
      const bg = h(`<div class="palette-bg"><div class="palette" style="padding:18px;max-height:88vh;overflow:auto"><h3>${c.id ? "Edit" : "Add"} application</h3>
        <div class="grid g2">
          <div class="field"><label>Company</label><input data-k="name" value="${esc(c.name || "")}"></div>
          <div class="field"><label>Role</label><input data-k="role" value="${esc(c.role || "")}"></div>
          <div class="field"><label>Stage</label><select data-k="stage">${STAGES.map((s) => `<option ${s === (c.stage || "Wishlist") ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field"><label>Next interview date</label><input type="date" data-k="next_date" value="${esc(c.next_date || "")}"></div>
          <div class="field"><label>Job link</label><input data-k="link" value="${esc(c.link || "")}"></div>
          <div class="field"><label>Recruiter / contact</label><input data-k="contact" value="${esc(c.contact || "")}"></div>
          <div class="field"><label>Compensation</label><input data-k="salary" value="${esc(c.salary || "")}"></div>
        </div>
        <div class="field mt"><label>Notes</label><textarea data-k="notes" rows="5">${esc(c.notes || "")}</textarea></div>
        <div class="row mt"><button class="btn primary" id="sv">Save</button>${c.id ? '<button class="btn danger" id="dl">Delete</button>' : ""}<button class="btn ghost" id="cx">Cancel</button></div></div></div>`);
      document.body.appendChild(bg);
      OS.$("#cx", bg).onclick = () => bg.remove();
      OS.$("#sv", bg).onclick = async () => {
        const d = { id: c.id }; OS.$$("[data-k]", bg).forEach((i) => (d[i.dataset.k] = i.value));
        if (!d.name.trim()) return;
        await post("/companies", d); bg.remove(); OS.go("#/pipeline");
      };
      const dl = OS.$("#dl", bg); if (dl) dl.onclick = async () => { if (confirm("Delete?")) { await OS.del("/companies/" + c.id); bg.remove(); OS.go("#/pipeline"); } };
    }
  };
})();
