/* Daily drill, full interview loop (multi-round onsite simulation) and the focus timer. */
(function () {
  const { h, esc, get, post } = OS;

  // ---------------------------------------------------------------- daily drill
  OS.todayCard = async (compact) => {
    const t = await post("/today", { progress: OS.progressLite() });
    const pctDone = Math.round((100 * t.done) / t.total);
    const c = h(`<div class="card ${compact ? "" : "pad-lg"}"><div class="spread"><h3 style="margin:0">🎯 Today's drill <span class="xs dim">~${t.minutes} min · focus: ${t.focus.map((f) => esc(f.name)).join(" & ")}</span></h3>
      <span class="badge ${t.done === t.total ? "ok" : "acc"}">${t.done}/${t.total} done</span></div><div class="bar mt"><i style="width:${pctDone}%"></i></div>
      <div class="list mt">${t.items.map((i) => `<a class="item spread" style="color:inherit;text-decoration:none" href="${esc(i.href)}"><span>${i.done ? "✅" : i.icon} <span style="${i.done ? "text-decoration:line-through;opacity:.6" : ""}">${esc(i.title)}</span></span><span class="xs dim">${i.progress ? i.progress + " · " : ""}${i.mins} min</span></a>`).join("")}</div>
      ${t.done === t.total ? `<div class="def small mt">🎉 Drill complete — that's how streaks are built. Bonus: <a href="#/loop">run a full interview loop</a>.</div>` : ""}</div>`);
    return c;
  };

  OS.views["/today"] = async (el) => {
    el.appendChild(h(`<div class="page-h"><div><h1>🎯 Today's drill</h1><p>A fresh ~30-minute session every day: MCQs on your two weakest subjects, one SQL challenge, one bug to fix, one production scenario, due flashcards, due DSA problems and open mistakes. Items tick off as you finish them.</p></div><a class="btn" href="#/loop">🏢 Full interview loop</a></div>`));
    el.appendChild(await OS.todayCard());
  };

  // ---------------------------------------------------------------- full interview loop
  const LOOPS = {
    "backend-sde2": { name: "Backend SDE 2 onsite", rounds: [["patterns", 2, "Coding — approach & patterns"], ["lld", 1, "Low-level design"], ["system-design", 1, "System design"], ["behavioral", 3, "Hiring manager / behavioral"]] },
    "senior-backend": { name: "Senior backend onsite", rounds: [["patterns", 2, "Coding — approach & patterns"], ["system-design", 1, "System design"], ["scenarios", 2, "Production scenarios"], ["project", 3, "Project deep dive"], ["behavioral", 3, "Behavioral"]] },
    lead: { name: "Tech lead / staff loop", rounds: [["system-design", 1, "System design"], ["architecture", 2, "Architecture & strategy"], ["project", 3, "Project & impact"], ["leadership", 3, "Leadership & people"]] },
    "data-engineer": { name: "Data engineer onsite", rounds: [["databases", 3, "SQL & databases"], ["data-eng", 3, "Pipelines — Kafka, Flink, Spark"], ["system-design", 1, "Data system design"], ["behavioral", 2, "Behavioral"]] },
    "sre-devops": { name: "SRE / platform onsite", rounds: [["cs", 3, "OS & networking"], ["cloud", 3, "Cloud & Kubernetes"], ["scenarios", 2, "Incident scenarios"], ["behavioral", 2, "Behavioral"]] },
    quick: { name: "Quick 3-round loop (≈30 min)", rounds: [["patterns", 1, "Coding approach"], ["system-design", 1, "System design"], ["behavioral", 2, "Behavioral"]] },
  };

  OS.views["/loop"] = async (el, p) => {
    if (p.go && LOOPS[p.go]) return runLoop(el, p.go, p.company || "");
    el.appendChild(h(`<div class="page-h"><div><h1>🏢 Full interview loop</h1><p>Simulates an onsite: several rounds back to back with different interviewers, then a hiring-committee debrief that combines every round — like the real thing, one weak round can sink the loop.</p></div></div>`));
    const company = h(`<div class="card mb"><div class="row"><div class="field" style="flex:1;min-width:200px"><label>Company (optional — tailors behavioral rounds to its values)</label><input id="co" placeholder="e.g. Amazon" value="${esc(p.company || "")}"></div></div></div>`);
    el.appendChild(company);
    const g = h(`<div class="grid g3"></div>`);
    for (const [id, L] of Object.entries(LOOPS)) {
      const mins = L.rounds.reduce((a, r) => a + r[1] * ({ "system-design": 15, project: 6, lld: 10, scenarios: 6 }[r[0]] || 4), 0);
      const c = h(`<a class="card subj" style="color:inherit;text-decoration:none;cursor:pointer"><h3 style="margin:0 0 6px">${esc(L.name)}</h3><div class="xs dim">${L.rounds.length} rounds · ≈${mins} min</div>
        <ol class="small" style="margin:8px 0 0;padding-left:18px">${L.rounds.map((r) => `<li>${esc(r[2])} <span class="dim">(${r[1]} q)</span></li>`).join("")}</ol></a>`);
      c.onclick = () => OS.go(`#/loop?go=${id}&company=${encodeURIComponent(OS.$("#co", company).value.trim())}`);
      g.appendChild(c);
    }
    el.appendChild(g);
  };

  async function runLoop(el, id, company) {
    const L = LOOPS[id];
    const results = [];
    let i = 0;
    const next = async () => {
      el.innerHTML = "";
      if (i >= L.rounds.length) return debrief();
      const [track, count, label] = L.rounds[i];
      el.appendChild(h(`<div class="card pad-lg" style="max-width:760px"><div class="xs dim">${esc(L.name)}${company ? " · " + esc(company) : ""}</div>
        <h2 style="margin:6px 0">Round ${i + 1} of ${L.rounds.length}: ${esc(label)}</h2>
        <div class="row mt">${L.rounds.map((r, k) => `<span class="badge ${k < i ? "ok" : k === i ? "acc" : ""}">${k + 1}. ${esc(r[2])}</span>`).join("")}</div>
        <p class="muted mt">${count} question${count > 1 ? "s" : ""}. A new interviewer — take a breath, then start.${track === "project" ? " Uses the project you described on the Project round page." : ""}</p>
        <div class="row mt"><button class="btn primary lg" id="go">Start round →</button><button class="btn ghost" id="skip">Skip round</button><a class="btn ghost" href="#/loop">Abandon loop</a></div></div>`));
      OS.$("#skip", el).onclick = () => { results.push({ label, track, skipped: true }); i++; next(); };
      OS.$("#go", el).onclick = async () => {
        const s = await post("/mock/session", { track, count, level: 0, company });
        if (!s.questions.length) { OS.toast("No questions for " + label); results.push({ label, track, skipped: true }); i++; return next(); }
        el.innerHTML = "";
        OS.runMockSession(el, s, (state, saved) => {
          const graded = state.answers.filter((a) => a.eval);
          const avg = saved && saved.score != null ? saved.score : graded.length ? graded.reduce((a, x) => a + x.eval.score, 0) / graded.length : null;
          results.push({ label, track, score: avg == null ? null : Math.round(avg * 10) / 10, id: saved && saved.id, answers: state.answers.length, graded: graded.length });
          i++; next();
        });
      };
    };
    function debrief() {
      const scored = results.filter((r) => r.score != null);
      const avg = scored.length ? scored.reduce((a, r) => a + r.score, 0) / scored.length : null;
      const low = scored.filter((r) => r.score < 5), strong = scored.filter((r) => r.score >= 8);
      // hiring-committee style: average matters, but any clearly weak round is a red flag
      let verdict;
      if (avg == null) verdict = ["No data", "Answer at least one round to get a debrief."];
      else if (low.length >= 2 || avg < 5) verdict = ["No Hire", "Multiple weak signals. Focus on the weakest rounds below before the real loop."];
      else if (low.length === 1) verdict = [avg >= 7 ? "Lean Hire" : "Lean No Hire", `Strong overall but “${low[0].label}” was a red flag — committees often reject on one weak round.`];
      else if (avg >= 8 && strong.length >= Math.ceil(scored.length / 2)) verdict = ["Strong Hire", "Consistently strong across rounds."];
      else if (avg >= 6.5) verdict = ["Hire", "Solid across the loop. Push one or two rounds to “strong” to stand out."];
      else verdict = ["Lean No Hire", "No disasters, but no round was convincing. Depth and structure are the gap."];
      el.appendChild(h(`<div><div class="page-h"><div><h1>🧑‍⚖️ Hiring committee debrief</h1><p>${esc(L.name)}${company ? " · " + esc(company) : ""}</p></div><div class="row"><a class="btn" href="#/loop">New loop</a><a class="btn primary" href="#/loop?go=${id}&company=${encodeURIComponent(company)}">Run it again</a></div></div>
        <div class="card pad-lg"><div class="row" style="gap:18px">${OS.ring(avg == null ? 0 : Math.round(avg * 10) / 10)}<div class="kpi"><span class="v" style="color:${OS.scoreColor(avg || 0)}">${verdict[0]}</span><span class="small muted">${esc(verdict[1])}</span></div></div></div>
        <div class="card mt"><h3>Rounds</h3><div class="list">${results.map((r) => `<${r.id ? `a href="#/mock?session=${r.id}"` : "div"} class="item spread" style="color:inherit"><span>${esc(r.label)}${r.skipped ? ' <span class="dim">— skipped</span>' : ` <span class="xs dim">${r.graded}/${r.answers} answered</span>`}</span><b style="color:${OS.scoreColor(r.score || 0)}">${r.score == null ? "–" : r.score}</b></${r.id ? "a" : "div"}>`).join("")}</div><div class="xs dim mt">Open a round for per-question feedback. Low-scoring answers are already in your <a href="#/revision?tab=mistakes">mistakes log</a>.</div></div></div>`));
    }
    next();
  }

  // ---------------------------------------------------------------- focus timer (topbar)
  const FKEY = "focus.until", FMIN = "focus.mins";
  function mountFocus() {
    const bar = OS.$(".topbar"); if (!bar || OS.$("#focusBtn")) return;
    const b = h(`<button class="btn sm ghost" id="focusBtn" title="Focus timer — logs study minutes">⏱️ Focus</button>`);
    bar.appendChild(b);
    let tick = null;
    const draw = () => {
      const until = OS.ls.get(FKEY, 0), left = Math.round((until - Date.now()) / 1000);
      if (until && left > 0) { b.textContent = `⏱️ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; b.classList.add("on"); return; }
      if (until && left <= 0) {
        const mins = OS.ls.get(FMIN, 25);
        OS.ls.set(FKEY, 0); clearInterval(tick); tick = null;
        post("/focus", { minutes: mins }).catch(() => {});
        OS.toast(`✅ ${mins}-minute focus block done — logged. Take 5.`, 5000);
        try { if (window.Notification && Notification.permission === "granted") new Notification("Focus block done", { body: mins + " minutes logged. Take a break." }); } catch (_) {}
      }
      b.textContent = "⏱️ Focus"; b.classList.remove("on");
    };
    const start = () => { if (!tick) tick = setInterval(draw, 1000); draw(); };
    b.onclick = () => {
      const until = OS.ls.get(FKEY, 0);
      if (until > Date.now()) {
        if (!confirm("Stop the focus timer? Minutes so far will be logged.")) return;
        const done = Math.round((OS.ls.get(FMIN, 25) * 60 - (until - Date.now()) / 1000) / 60);
        OS.ls.set(FKEY, 0); if (done > 0) post("/focus", { minutes: done }).catch(() => {});
        return draw();
      }
      const m = parseInt(prompt("Focus for how many minutes?", String(OS.ls.get(FMIN, 25))) || "0", 10);
      if (!m || m < 1) return;
      OS.ls.set(FMIN, Math.min(180, m)); OS.ls.set(FKEY, Date.now() + Math.min(180, m) * 60000);
      try { if (window.Notification && Notification.permission === "default") Notification.requestPermission(); } catch (_) {}
      start();
    };
    if (OS.ls.get(FKEY, 0)) start();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountFocus); else mountFocus();
})();
