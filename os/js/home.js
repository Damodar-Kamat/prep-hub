/* Home dashboard: readiness, streak, today's plan, due cards, upcoming interviews, activity. */
(function () {
  const { h, esc, get } = OS;

  OS.prephub = () => {
    try { return Object.assign({ topics: {}, problems: {}, plan: {}, activity: {} }, JSON.parse(localStorage.getItem("prephub.progress.v1") || "{}")); }
    catch (_) { return { topics: {}, problems: {}, plan: {}, activity: {} }; }
  };

  OS.views["/"] = async (el) => {
    const [d, lib] = await Promise.all([get("/dashboard"), get("/library")]);
    const ph = OS.prephub();
    const name = (OS.state.profile && OS.state.profile.name) || "";
    const hr = new Date().getHours();
    const greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
    const iDate = d.plan_meta && d.plan_meta.interview_date;
    const daysLeft = iDate ? Math.ceil((new Date(iDate) - new Date(new Date().toDateString())) / 86400000) : null;

    // readiness per area: library topic completion + mock average + card maturity
    const secPct = {};
    for (const s of lib.sections) secPct[s.id] = s.topics.length ? s.topics.filter((t) => ph.topics[t.id]).length / s.topics.length : 0;
    const rm = lib.roadmap || [];
    const dsaPlan = rm.length ? rm.filter((p) => { const e = ph.plan[p.id]; return e && e.got >= 1; }).length / rm.length : 0;
    const mock = (t) => (d.mock_avg[t] != null ? d.mock_avg[t] / 10 : null);
    const mix = (...xs) => { const v = xs.filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };
    const sid = (p) => (lib.sections.find((s) => s.id.startsWith(p)) || {}).id;
    const areas = [
      ["DSA", mix(dsaPlan, secPct[sid("dsa")], mock("dsa")), "#/mock?track=dsa", "/index.html#/plan"],
      ["System design", mix(secPct[sid("hld")], mock("system-design")), "#/mock?track=system-design", "/index.html#/section/" + sid("hld")],
      ["Low-level design", mix(secPct[sid("lld")], mock("lld")), "#/mock?track=lld", "/index.html#/section/" + sid("lld")],
      ["CS fundamentals", mix(secPct[sid("cs")], secPct[sid("hardware")], mock("cs")), "#/mock?track=cs", "/index.html#/section/" + sid("cs")],
      ["Behavioral", mix(secPct[sid("behavioral")], mock("behavioral"), Math.min(1, d.stories / 8)), "#/mock?track=behavioral", "#/stories"],
    ];
    const overall = Math.round(100 * areas.reduce((a, x) => a + x[1], 0) / areas.length);

    // merged activity (OS + Prep Hub)
    const act = {};
    for (const a of d.activity) act[a.day] = (act[a.day] || 0) + a.count;
    for (const k in ph.activity) act[k] = (act[k] || 0) + ph.activity[k];
    let streak = 0; const dd = new Date(); const ymd = (x) => x.toISOString().slice(0, 10);
    const loc = (x) => new Date(x.getTime() - x.getTimezoneOffset() * 60000);
    if (!act[ymd(loc(dd))]) dd.setDate(dd.getDate() - 1);
    while (act[ymd(loc(dd))]) { streak++; dd.setDate(dd.getDate() - 1); }

    el.appendChild(h(`<div class="hero">
      <div class="spread">
        <div>
          <div class="muted small">${new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</div>
          <h1 style="margin:.2em 0">${greet}${name ? ", " + esc(name) : ""} 👋</h1>
          <div class="muted">${daysLeft != null ? `<b style="color:var(--accent)">${daysLeft} day${daysLeft === 1 ? "" : "s"}</b> to your ${esc(d.plan_meta.company || "")} interview.` : `No interview date yet — <a href="#/plan">build a study plan</a>.`}
          ${streak ? ` 🔥 <b>${streak}-day streak</b>.` : " Start a streak today."}</div>
        </div>
        <div class="row">${OS.ring(overall / 10, 96, overall + "%")}<div class="kpi"><span class="l">Interview readiness</span><span class="small muted">library · mocks · stories</span></div></div>
      </div>
      <div class="row mt">
        <button class="btn primary" onclick="OS.palette()">🔭 Research anything</button>
        <a class="btn" href="#/mock?start=1&track=behavioral">🎙️ Quick mock</a>
        <a class="btn" href="#/cards?review=1">🃏 Review ${d.cards.due} cards</a>
        <a class="btn" href="/index.html#/plan">🧠 DSA plan</a>
        <a class="btn" href="#/company">🏢 Company intel</a>
      </div>
    </div>`));

    const grid = h(`<div class="grid g3 mt"></div>`); el.appendChild(grid);

    // readiness bars
    const rd = h(`<div class="card"><h3>📈 Readiness by area</h3><div class="col"></div></div>`);
    for (const [n, v, mockHref, studyHref] of areas) {
      rd.lastElementChild.appendChild(h(`<div><div class="spread small"><b>${n}</b><span class="row" style="gap:6px"><a class="xs" href="${studyHref}">study</a><a class="xs" href="${mockHref}">mock</a><span class="muted">${Math.round(v * 100)}%</span></span></div><div class="bar"><i style="width:${Math.round(v * 100)}%"></i></div></div>`));
    }
    grid.appendChild(rd);

    // today
    const td = h(`<div class="card"><h3>🗓️ Today</h3><div class="list"></div></div>`);
    const done = await get("/plan/done").catch(() => ({}));
    if (d.plan_today) {
      for (const it of d.plan_today.items) {
        const k = d.plan_today.date + "|" + it.title;
        const row = h(`<label class="item row" style="gap:8px;cursor:pointer;font-weight:500;color:var(--text)"><input type="checkbox" style="width:auto" ${done[k] ? "checked" : ""}><span style="flex:1">${esc(it.title)}</span><a href="${it.href}" class="xs">open →</a></label>`);
        row.querySelector("input").onchange = () => OS.post("/plan/toggle", { date: d.plan_today.date, title: it.title });
        td.lastElementChild.appendChild(row);
      }
    } else {
      td.lastElementChild.appendChild(h(`<div class="empty"><div class="big">🗓️</div>No plan for today.<div class="mt"><a class="btn sm primary" href="#/plan">Create a plan</a></div></div>`));
    }
    grid.appendChild(td);

    // Today's DSA focus: weakest pattern (by ladder progress) and its next problem
    const pats = (lib.sections.find((x) => x.id === "patterns") || { topics: [] }).topics;
    if (pats.length) {
      const byLc = {};
      (lib.roadmap || []).forEach((r) => (byLc[r.lc] = Object.assign(byLc[r.lc] || {}, { rid: r.id, title: r.title, diff: r.diff, local: r.local })));
      (lib.problems || []).forEach((p) => { if (p.lc) byLc[p.lc] = Object.assign(byLc[p.lc] || {}, { local: p.id, title: (byLc[p.lc] || {}).title || p.title, diff: (byLc[p.lc] || {}).diff || p.difficulty }); });
      const isDone = (slug) => {
        const x = byLc[slug] || {};
        const pe = x.rid && ph.plan[x.rid];
        return (x.local && ph.problems[x.local] === "solved") || !!(pe && (pe.r === "got" || pe.got >= 1));
      };
      const scored = pats.map((t) => {
        const ps = t.problems || [];
        const done = ps.filter(isDone).length;
        return { t, done, total: ps.length, pct: ps.length ? done / ps.length : 1, next: ps.find((sl) => !isDone(sl)) };
      }).filter((x) => x.next);
      scored.sort((a, b) => a.pct - b.pct);
      const f = scored[0];
      if (f) {
        const n = byLc[f.next] || {};
        const title = n.title || f.next.replace(/-/g, " ");
        const href = n.local ? "/index.html#/problem/" + n.local : "https://leetcode.com/problems/" + f.next + "/";
        OS.state.dsaFocus = { pattern: f.t.title, next: title };
        grid.appendChild(h(`<div class="card"><h3>🧬 Today's DSA focus</h3>
          <div class="muted small">Weakest pattern by ladder progress</div>
          <div style="font-size:1.1rem;font-weight:700;margin:6px 0">${esc(f.t.title)}</div>
          <div class="bar"><i style="width:${Math.round(f.pct * 100)}%"></i></div>
          <div class="small muted" style="margin-top:4px">${f.done}/${f.total} ladder problems done</div>
          <div class="row mt"><a class="btn sm" href="/index.html#/topic/patterns/${f.t.id}?m=deep">📖 Learn</a>
            <a class="btn sm primary" href="${href}" ${n.local ? "" : 'target="_blank" rel="noopener"'}>▶ Next: ${esc(title)}</a></div>
          <div class="xs dim mt"><a href="/index.html#/patterns">All ${pats.length} patterns →</a></div></div>`));
      }
    }

    // KPIs
    const solved = Object.values(ph.problems).filter((s) => s === "solved").length;
    const mastered = Object.values(ph.plan).filter((e) => e && e.got >= 2 && e.due == null).length;
    grid.appendChild(h(`<div class="card"><h3>⚡ Snapshot</h3>
      <div class="grid g2">
        <div class="kpi"><span class="v">${streak}</span><span class="l">day streak</span></div>
        <div class="kpi"><span class="v">${d.cards.due}</span><span class="l">cards due</span></div>
        <div class="kpi"><span class="v">${mastered}<span class="dim small">/${rm.length}</span></span><span class="l">DSA mastered</span></div>
        <div class="kpi"><span class="v">${solved}</span><span class="l">problems solved</span></div>
        <div class="kpi"><span class="v">${d.mocks.length}</span><span class="l">mocks done</span></div>
        <div class="kpi"><span class="v">${d.stories}</span><span class="l">STAR stories</span></div>
      </div></div>`));

    const g2 = h(`<div class="grid g2 mt"></div>`); el.appendChild(g2);
    // upcoming
    const up = h(`<div class="card"><div class="spread"><h3>🏢 Upcoming interviews</h3><a class="small" href="#/pipeline">pipeline →</a></div><div class="list"></div></div>`);
    if (d.upcoming.length) for (const c of d.upcoming) {
      const dl = Math.ceil((new Date(c.next_date) - new Date(new Date().toDateString())) / 86400000);
      up.lastElementChild.appendChild(h(`<div class="item spread"><div><b>${esc(c.name)}</b> <span class="muted small">${esc(c.role || "")}</span><div class="xs dim">${esc(c.stage)} · ${esc(c.next_date)}</div></div>
        <div class="row"><span class="badge ${dl <= 3 ? "bad" : dl <= 7 ? "warn" : "acc"}">${dl >= 0 ? "in " + dl + "d" : "past"}</span><a class="btn sm" href="#/company?name=${encodeURIComponent(c.name)}&role=${encodeURIComponent(c.role || "")}">intel</a></div></div>`));
    } else up.lastElementChild.appendChild(h(`<div class="empty">Track applications and interview dates in <a href="#/pipeline">Applications</a>.</div>`));
    g2.appendChild(up);

    // recent mocks
    const mk = h(`<div class="card"><div class="spread"><h3>🎙️ Recent mocks</h3><a class="small" href="#/mock">new →</a></div><div class="list"></div></div>`);
    if (d.mocks.length) for (const m of d.mocks.slice(0, 6)) {
      mk.lastElementChild.appendChild(h(`<a class="item spread" href="#/mock?session=${m.id}" style="color:inherit;text-decoration:none"><span>${esc(m.track)}${m.company ? " · " + esc(m.company) : ""}</span><span class="row"><span class="dim xs">${OS.ago(m.started)}</span><b style="color:${OS.scoreColor(m.score || 0)}">${m.score == null ? "–" : m.score}</b></span></a>`));
    } else mk.lastElementChild.appendChild(h(`<div class="empty">No mocks yet. Speaking answers out loud is the #1 multiplier.</div>`));
    g2.appendChild(mk);

    // heatmap
    const heat = h(`<div class="card mt"><div class="spread"><h3>🔥 Activity (last 26 weeks)</h3><span class="xs dim">Interview OS + Prep Hub combined</span></div><div class="heat"></div></div>`);
    const start = new Date(); start.setDate(start.getDate() - 7 * 26 + 1 - start.getDay());
    for (let i = 0; i < 7 * 26; i++) {
      const x = new Date(start); x.setDate(start.getDate() + i);
      const n = act[ymd(loc(x))] || 0;
      heat.lastElementChild.appendChild(h(`<i title="${ymd(loc(x))}: ${n}" class="${n ? "l" + Math.min(4, Math.ceil(n / 3)) : ""}"></i>`));
    }
    el.appendChild(heat);

    // HN trending (non-blocking)
    const hn = h(`<div class="card mt"><div class="spread"><h3>🟧 Trending engineering on Hacker News (7 days)</h3><a class="small" href="#/feed">all feeds →</a></div><div class="list"><div class="muted small"><span class="spinner"></span> loading…</div></div></div>`);
    el.appendChild(hn);
    get("/hn").then((r) => {
      const l = hn.lastElementChild; l.innerHTML = "";
      for (const it of r.items.slice(0, 8)) l.appendChild(h(`<div class="item spread"><a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.title)}</a><span class="row xs dim"><span>▲ ${it.points}</span><a href="${esc(it.hn)}" target="_blank" rel="noopener">${it.comments} comments</a><a href="#/ask?url=${encodeURIComponent(it.url)}">digest</a></span></div>`));
      if (!r.items.length) l.innerHTML = `<div class="muted small">Offline or nothing trending.</div>`;
    }).catch(() => { hn.lastElementChild.innerHTML = `<div class="muted small">Could not reach Hacker News.</div>`; });
  };
})();
