/* JD matcher, STAR story bank, study planner, settings. */
(function () {
  const { h, esc, get, post } = OS;

  // ---------------------------------------------------------------- JD matcher
  OS.views["/jd"] = async (el) => {
    el.appendChild(h(`<div class="page-h"><div><h1>🎯 JD matcher</h1><p>Paste a job description (and optionally your resume). Get the skills they weight, your match score, gaps to study and the questions you're likely to face. Runs fully locally.</p></div></div>`));
    const f = h(`<div class="grid g2">
      <div class="card"><label>Job description</label><textarea id="jd" rows="14" placeholder="Paste the full JD…">${esc(OS.ls.get("jd.jd", ""))}</textarea></div>
      <div class="card"><label>Your resume (plain text, optional — stored only in this browser)</label><textarea id="cv" rows="14" placeholder="Paste your resume text…">${esc(OS.ls.get("jd.cv", ""))}</textarea></div></div>`);
    el.appendChild(f);
    el.appendChild(h(`<div class="row mt"><button class="btn primary lg" id="go">Analyse</button></div>`));
    const out = h(`<div class="mt"></div>`); el.appendChild(out);
    OS.$("#go", el).onclick = async () => {
      const jd = OS.$("#jd", f).value, cv = OS.$("#cv", f).value;
      if (!jd.trim()) return;
      OS.ls.set("jd.jd", jd); OS.ls.set("jd.cv", cv);
      const r = await post("/jd", { jd, resume: cv });
      out.innerHTML = "";
      const maxW = Math.max(1, ...r.skills.map((s) => s.weight));
      out.appendChild(h(`<div>
        <div class="grid g3">
          <div class="card row" style="gap:16px">${OS.ring(r.match != null ? r.match / 10 : null, 88, r.match != null ? r.match + "%" : "–")}<div class="kpi"><span class="v">${r.match != null ? (r.match >= 75 ? "Strong match" : r.match >= 50 ? "Decent match" : "Stretch role") : "No resume"}</span><span class="l">resume ↔ JD</span></div></div>
          <div class="card"><div class="kpi"><span class="v">${esc(r.level)}</span><span class="l">seniority${r.years.length ? " · " + r.years.join("/") + "+ yrs" : ""}</span></div><div class="small muted mt">${esc(r.title)}</div></div>
          <div class="card"><h3>🧭 Interview tracks to drill</h3><div class="row">${r.tracks.map((t) => `<a class="chip" href="#/mock?start=1&track=${t}">${esc(t)}</a>`).join("")}</div></div>
        </div>
        <div class="card mt"><h3>🧱 Skills they ask for (weighted)</h3><div class="col">${r.skills.map((s) => `<div><div class="spread small"><span><b>${esc(s.skill)}</b> <span class="dim">${esc(s.category)}</span> ${s.in_resume === true ? '<span class="badge ok">on resume</span>' : s.in_resume === false ? '<span class="badge bad">missing</span>' : ""}</span>
          <span class="row" style="gap:6px">${s.local.map((l) => `<a class="xs" href="${l.href}">📘 ${esc(l.title.slice(0, 32))}</a>`).join("")}<a class="xs" href="#/ask?q=${encodeURIComponent(s.study)}">🔭 research</a></span></div><div class="bar"><i style="width:${100 * s.weight / maxW}%"></i></div></div>`).join("") || '<div class="muted">No known skills detected.</div>'}</div></div>
        ${r.missing_keywords.length ? `<div class="card mt"><h3>🔑 JD keywords missing from your resume</h3><div class="row">${r.missing_keywords.map((k) => `<span class="badge warn">${esc(k)}</span>`).join("")}</div><div class="small muted mt">If you genuinely have the experience, weave these exact phrases into your resume bullets (ATS matching).</div></div>` : ""}
        <div class="card mt"><div class="spread"><h3>❓ Likely questions</h3><button class="btn sm" id="lq">🃏 → flashcards</button></div><ol class="small">${r.likely_questions.map((q) => `<li>${esc(q.q)} <span class="dim xs">${esc(q.track)}</span></li>`).join("")}</ol></div>
        <div class="row mt"><a class="btn primary" href="#/plan">🗓️ Build a plan from this</a><button class="btn" id="sv">📝 Save analysis</button></div>
      </div>`));
      OS.$("#lq", out).onclick = () => OS.saveCards(r.likely_questions.map((q) => ({ front: q.q, back: "Likely for this role (" + q.track + "). Practise out loud." })), "JD · " + (r.title || "role").slice(0, 30), "jd");
      OS.$("#sv", out).onclick = () => OS.saveNote("JD analysis — " + (r.title || "role"), ["# " + r.title, "", "Match: " + (r.match ?? "n/a") + "%", "", "## Skills", ...r.skills.map((s) => `- ${s.skill} (${s.weight})${s.in_resume === false ? " — MISSING" : ""}`), "", "## Likely questions", ...r.likely_questions.map((q) => "- " + q.q)].join("\n"), "jd");
    };
  };

  // ---------------------------------------------------------------- story bank
  OS.views["/stories"] = async (el) => {
    const r = await get("/stories");
    const T = r.themes;
    el.appendChild(h(`<div class="page-h"><div><h1>⭐ Story bank</h1><p>6–8 strong STAR stories, each mapped to several themes, answer ~90% of behavioral questions. Coverage shows which themes still need a story.</p></div><button class="btn primary" id="new">＋ New story</button></div>`));
    const cov = {}; for (const k in T) cov[k] = 0;
    r.stories.forEach((s) => (s.themes || "").split(",").filter(Boolean).forEach((t) => (cov[t] = (cov[t] || 0) + 1)));
    el.appendChild(h(`<div class="card"><h3>🗺️ Theme coverage</h3><div class="row">${Object.entries(T).map(([k, v]) => `<span class="badge ${cov[k] ? "ok" : "bad"}">${cov[k] ? "✓" : "✗"} ${esc(v)}${cov[k] > 1 ? " ×" + cov[k] : ""}</span>`).join("")}</div></div>`));
    const list = h(`<div class="grid g2 mt"></div>`); el.appendChild(list);
    if (!r.stories.length) list.appendChild(h(`<div class="card empty"><div class="big">⭐</div>No stories yet. Start with your most impactful project, a conflict, and a failure.</div>`));
    for (const s of r.stories) {
      const c = h(`<div class="card"><div class="spread"><b>${esc(s.title)}</b><span class="row"><button class="btn sm ghost" data-a="e">✎ Edit</button><button class="btn sm ghost" data-a="p">🎙️ Practise</button></span></div>
        <div class="row mt">${(s.themes || "").split(",").filter(Boolean).map((t) => `<span class="badge acc">${esc(T[t] || t)}</span>`).join("")}</div>
        <div class="small muted mt"><b>S</b> ${esc(s.situation.slice(0, 140))}${s.situation.length > 140 ? "…" : ""}</div><div class="small muted"><b>R</b> ${esc(s.result.slice(0, 140))}</div></div>`);
      c.querySelector('[data-a="e"]').onclick = () => edit(s);
      c.querySelector('[data-a="p"]').onclick = () => OS.go("#/mock?start=1&track=behavioral");
      list.appendChild(c);
    }
    OS.$("#new", el).onclick = () => edit({});
    function edit(s) {
      const sel = new Set((s.themes || "").split(",").filter(Boolean));
      const bg = h(`<div class="palette-bg" style="padding-top:4vh"><div class="palette" style="padding:18px;width:min(860px,94vw);max-height:92vh;overflow:auto"><h3>${s.id ? "Edit" : "New"} STAR story</h3>
        <div class="field"><label>Title</label><input data-k="title" value="${esc(s.title || "")}" placeholder="e.g. Cut pipeline latency 80% by moving to Flink"></div>
        <div class="grid g2 mt">
          <div class="field"><label>S — Situation (context, stakes; 2–3 sentences)</label><textarea data-k="situation" rows="4">${esc(s.situation || "")}</textarea></div>
          <div class="field"><label>T — Task (your goal / responsibility)</label><textarea data-k="task" rows="4">${esc(s.task || "")}</textarea></div>
          <div class="field"><label>A — Action (what YOU did; the bulk of the story)</label><textarea data-k="action" rows="7">${esc(s.action || "")}</textarea></div>
          <div class="field"><label>R — Result (numbers! + what you learned)</label><textarea data-k="result" rows="7">${esc(s.result || "")}</textarea></div>
        </div>
        <label class="mt">Themes this story can answer</label><div class="row" id="th">${Object.entries(T).map(([k, v]) => `<span class="chip ${sel.has(k) ? "on" : ""}" data-t="${k}">${esc(v)}</span>`).join("")}</div>
        <div id="sc" class="mt"></div>
        <div class="row mt"><button class="btn primary" id="sv">Save</button><button class="btn" id="chk">🧪 Score this story</button>${s.id ? '<button class="btn danger" id="dl">Delete</button>' : ""}<button class="btn ghost" id="cx">Cancel</button></div></div></div>`);
      document.body.appendChild(bg);
      OS.$$("[data-t]", bg).forEach((c) => (c.onclick = () => { c.classList.toggle("on"); sel.has(c.dataset.t) ? sel.delete(c.dataset.t) : sel.add(c.dataset.t); }));
      const data = () => { const d = { id: s.id, themes: [...sel].join(",") }; OS.$$("[data-k]", bg).forEach((i) => (d[i.dataset.k] = i.value)); return d; };
      OS.$("#cx", bg).onclick = () => bg.remove();
      OS.$("#sv", bg).onclick = async () => { const d = data(); if (!d.title.trim()) return; await post("/stories", d); bg.remove(); OS.go("#/stories"); };
      OS.$("#chk", bg).onclick = async () => {
        const e = await post("/stories/score", data());
        OS.$("#sc", bg).innerHTML = `<div class="card" style="background:var(--panel2)"><div class="row">${OS.ring(e.score, 60)}<div class="star" style="flex:1">${Object.entries(e.star).map(([k, v]) => `<div style="background:${v ? "var(--ok-bg)" : "var(--bad-bg)"};color:${v ? "var(--ok)" : "var(--bad)"}">${v ? "✓" : "✗"} ${k}</div>`).join("")}</div></div><ul class="small">${e.improvements.concat(e.strengths).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
      };
      const dl = OS.$("#dl", bg); if (dl) dl.onclick = async () => { if (confirm("Delete story?")) { await OS.del("/stories/" + s.id); bg.remove(); OS.go("#/stories"); } };
    }
  };

  // ---------------------------------------------------------------- study plan
  OS.views["/plan"] = async (el) => {
    const [plan, done] = await Promise.all([get("/plan"), get("/plan/done")]);
    el.appendChild(h(`<div class="page-h"><div><h1>🗓️ Study plan</h1><p>A day-by-day schedule to your interview: DSA roadmap problems in order, concept deep-dives, mocks every 3 days, weekly reviews, flashcards daily, taper before the day.</p></div></div>`));
    const f = h(`<div class="card"><div class="grid g4">
      <div class="field"><label>Interview date</label><input type="date" id="dt" value="${esc(plan.interview_date || new Date(Date.now() + 28 * 864e5).toISOString().slice(0, 10))}"></div>
      <div class="field"><label>Hours per day</label><select id="hr">${[1, 1.5, 2, 3, 4, 6].map((x) => `<option ${x == (plan.hours || 2) ? "selected" : ""}>${x}</option>`).join("")}</select></div>
      <div class="field"><label>Target company (optional)</label><input id="co" value="${esc(plan.company || "")}"></div>
      <div class="field"><label>&nbsp;</label><button class="btn primary" id="mk">${plan.days ? "Rebuild plan" : "Build plan"}</button></div></div>
      <label class="mt">Focus areas</label><div class="row" id="fc">${[["dsa", "DSA"], ["system-design", "System design"], ["lld", "LLD"], ["cs", "CS fundamentals"], ["behavioral", "Behavioral"]].map(([k, v]) => `<span class="chip ${(plan.focus || ["dsa", "system-design", "behavioral", "cs"]).includes(k) ? "on" : ""}" data-f="${k}">${v}</span>`).join("")}</div></div>`);
    el.appendChild(f);
    OS.$$("[data-f]", f).forEach((c) => (c.onclick = () => c.classList.toggle("on")));
    OS.$("#mk", f).onclick = async () => {
      await post("/plan", { date: OS.$("#dt", f).value, hours: +OS.$("#hr", f).value, company: OS.$("#co", f).value, focus: OS.$$("[data-f].on", f).map((c) => c.dataset.f) });
      OS.toast("Plan ready"); OS.go("#/plan");
    };
    if (!plan.days) return;
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const total = plan.days.reduce((a, d) => a + d.items.length, 0), dn = Object.values(done).filter(Boolean).length;
    el.appendChild(h(`<div class="card mt"><div class="spread"><b>${plan.days.length} days · ${total} tasks</b><span class="muted small">${dn} done</span></div><div class="bar mt"><i style="width:${100 * dn / Math.max(1, total)}%"></i></div></div>`));
    const g = h(`<div class="grid g3 mt"></div>`); el.appendChild(g);
    for (const d of plan.days) {
      if (d.date < today) continue;
      const c = h(`<div class="day ${d.date === today ? "today" : ""}"><div class="spread"><b>${d.weekday} ${d.date.slice(5)}</b><span class="xs dim">${d.days_left}d left</span></div></div>`);
      for (const it of d.items) {
        const k = d.date + "|" + it.title;
        const row = h(`<div class="it ${done[k] ? "done" : ""}"><input type="checkbox" ${done[k] ? "checked" : ""}><span style="flex:1">${{ problem: "🧩", topic: "📘", mock: "🎙️", review: "🔁", cards: "🃏", company: "🏢" }[it.kind] || "•"} <a href="${it.href}" ${it.href.startsWith("http") ? 'target="_blank"' : ""}>${esc(it.title)}</a></span></div>`);
        row.querySelector("input").onchange = async () => { const r = await post("/plan/toggle", { date: d.date, title: it.title }); row.classList.toggle("done", r.done); };
        c.appendChild(row);
      }
      g.appendChild(c);
    }
  };

  // ---------------------------------------------------------------- settings
  OS.views["/settings"] = async (el) => {
    const [s, st] = await Promise.all([get("/settings"), get("/status?force=1")]);
    el.appendChild(h(`<div class="page-h"><div><h1>⚙️ Settings</h1><p>Everything runs locally. Your data: <code>${esc(st.data_dir)}</code></p></div></div>`));
    const voices = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    el.appendChild(h(`<div class="grid g2">
      <div class="card"><h3>👤 Profile</h3><div class="field"><label>Your name</label><input id="nm" value="${esc((s.profile || {}).name || "")}"></div>
        <div class="field mt"><label>Target role</label><input id="rl" value="${esc((s.profile || {}).role || "")}" placeholder="e.g. Senior Data Engineer"></div><button class="btn primary mt" id="svp">Save</button></div>
      <div class="card"><h3>🤖 Optional local LLM <span class="badge ${st.llm.ready ? "ok" : ""}">${st.llm.ready ? "connected · " + esc(st.llm.model) : "not detected"}</span></h3>
        <div class="small muted">Never Claude, never required. If you run <a href="https://ollama.com" target="_blank">Ollama</a> / LM Studio / llama.cpp, agents add synthesized answers and the interviewer grades like a human. Setup: <code>brew install ollama && ollama serve & ollama pull llama3.1:8b</code></div>
        <div class="field mt"><label>Base URL (OpenAI-compatible)</label><input id="lu" value="${esc(s.llm.base_url)}"></div>
        <div class="field mt"><label>Model ${st.llm.models.length ? "(" + st.llm.models.length + " found)" : ""}</label>${st.llm.models.length ? `<select id="lm">${st.llm.models.map((m) => `<option ${m === s.llm.model ? "selected" : ""}>${esc(m)}</option>`).join("")}</select>` : `<input id="lm" value="${esc(s.llm.model || "")}" placeholder="auto">`}</div>
        <label class="row mt" style="font-weight:500"><input type="checkbox" id="le" style="width:auto" ${s.llm.enabled ? "checked" : ""}> Use local LLM when available</label>
        <button class="btn primary mt" id="svl">Save & test</button></div>
      <div class="card"><h3>🎙️ Mock interview voice</h3><div class="field"><label>Interviewer voice</label><select id="vn"><option value="">Auto</option>${voices.filter((v) => /^en/i.test(v.lang)).map((v) => `<option ${v.name === OS.ls.get("mock.voiceName", "") ? "selected" : ""}>${esc(v.name)}</option>`).join("")}</select></div>
        <div class="field mt"><label>Dictation language</label><select id="sl">${["en-US", "en-GB", "en-IN", "en-AU"].map((x) => `<option ${x === OS.ls.get("mock.lang", "en-US") ? "selected" : ""}>${x}</option>`).join("")}</select></div>
        <div class="row mt"><button class="btn" id="tv">🔊 Test voice</button></div></div>
      <div class="card"><h3>💾 Data</h3><div class="small muted">Back up or move everything (cards, notes, stories, mocks, pipeline, plan). Prep Hub progress is saved to <code>progress.json</code> + git when you click Save in the library.</div>
        <div class="row mt"><button class="btn" id="ex">⬇ Export JSON</button><button class="btn" id="im">⬆ Import JSON</button><input type="file" id="imf" accept="application/json" class="hide"></div>
        <h3 class="mt">🧰 Local runtimes</h3><div class="row">${Object.entries(st.runner).map(([k, v]) => `<span class="badge ${v ? "ok" : "bad"}">${v ? "✓" : "✗"} ${k}</span>`).join("")}</div></div>
    </div>`));
    OS.$("#svp", el).onclick = async () => { const p = { name: OS.$("#nm", el).value, role: OS.$("#rl", el).value }; await post("/settings", { profile: p }); OS.state.profile = p; OS.toast("Saved"); };
    OS.$("#svl", el).onclick = async () => { await post("/settings", { llm: { base_url: OS.$("#lu", el).value, model: OS.$("#lm", el).value, enabled: OS.$("#le", el).checked, timeout: 120 } }); OS.go("#/settings"); };
    OS.$("#vn", el).onchange = (e) => OS.ls.set("mock.voiceName", e.target.value);
    OS.$("#sl", el).onchange = (e) => OS.ls.set("mock.lang", e.target.value);
    OS.$("#tv", el).onclick = () => { const u = new SpeechSynthesisUtterance("Tell me about a time you disagreed with your manager."); const v = speechSynthesis.getVoices().find((x) => x.name === OS.ls.get("mock.voiceName", "")); if (v) u.voice = v; speechSynthesis.speak(u); };
    OS.$("#ex", el).onclick = async () => {
      const d = await get("/export");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 1)], { type: "application/json" }));
      a.download = "interview-os-backup-" + new Date().toISOString().slice(0, 10) + ".json"; a.click();
    };
    OS.$("#im", el).onclick = () => OS.$("#imf", el).click();
    OS.$("#imf", el).onchange = async (e) => { const t = await e.target.files[0].text(); const r = await post("/import", JSON.parse(t)); OS.toast("Imported " + r.imported + " rows"); };
  };
})();
