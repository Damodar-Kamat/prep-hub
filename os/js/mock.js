/* Mock interview room: voice or text, timers, rubric grading, STAR analysis, follow-ups, session reports. */
(function () {
  const { h, esc, get, post } = OS;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  function speak(text) {
    if (!OS.ls.get("mock.voice", true) || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const pref = OS.ls.get("mock.voiceName", "");
    const vs = speechSynthesis.getVoices();
    const v = vs.find((x) => x.name === pref) || vs.find((x) => /en[-_](US|GB|IN)/i.test(x.lang) && /(Samantha|Daniel|Google|Natural|Premium|Enhanced)/i.test(x.name)) || vs.find((x) => /^en/i.test(x.lang));
    if (v) u.voice = v;
    u.rate = 1.0; speechSynthesis.speak(u);
  }

  OS.views["/mock"] = async (el, p) => {
    if (p.session) return showPast(el, +p.session);
    const t = await get("/mock/tracks");
    const hist = await get("/mock/history");
    if (p.track === "custom" && p.topic) return topicSession(el, p.topic);
    if (p.start && p.track) return startSession(el, { track: p.track, count: 5, level: 0, company: p.company || "" });

    el.appendChild(h(`<div class="page-h"><div><h1>🎙️ Mock interview</h1><p>The interviewer reads questions aloud; answer by voice (Chrome/Edge/Safari) or typing. Each answer is graded against a rubric: key-point coverage, STAR structure, quantified impact, trade-offs, filler words, pace.</p></div></div>`));
    const setup = h(`<div class="card pad-lg">
      <h3>1 · Pick a round</h3><div class="grid g4" id="tracks"></div>
      <div class="grid g4 mt2">
        <div class="field"><label>Questions</label><select id="count"><option>3</option><option selected>5</option><option>8</option><option>12</option></select></div>
        <div class="field"><label>Difficulty</label><select id="level"><option value="0">Mixed</option><option value="1">Warm-up</option><option value="2">Medium</option><option value="3">Hard</option></select></div>
        <div class="field"><label>Company (tailors behavioral to its values)</label><input id="company" placeholder="e.g. Amazon" value="${esc(p.company || "")}"></div>
        <div class="field"><label>Interviewer voice</label><select id="voice"><option value="1">🔊 Speak questions</option><option value="0">🔇 Silent</option></select></div>
      </div>
      <div class="row mt2"><button class="btn primary lg" id="start">Start interview →</button><span class="muted small">${SR ? "🎤 Voice answers supported in this browser." : "🎤 Voice input not supported in this browser — you'll type (Chrome/Edge/Safari support it)."}</span></div>
    </div>`);
    el.appendChild(setup);
    let chosen = p.track || OS.ls.get("mock.track", "behavioral");
    const tr = OS.$("#tracks", setup);
    for (const x of t.tracks) {
      const c = h(`<div class="chip" style="border-radius:12px;padding:12px;flex-direction:column;align-items:flex-start;gap:2px" data-id="${x.id}"><span style="font-size:1.3rem">${x.icon}</span><b style="color:var(--text)">${esc(x.name)}</b><span class="xs dim">${x.count} questions${x.custom ? " · " + x.custom + " mined" : ""}</span></div>`);
      c.onclick = () => { chosen = x.id; OS.$$("[data-id]", tr).forEach((y) => y.classList.toggle("on", y.dataset.id === chosen)); };
      if (x.id === chosen) c.classList.add("on");
      tr.appendChild(c);
    }
    OS.$("#voice", setup).value = OS.ls.get("mock.voice", true) ? "1" : "0";
    OS.$("#start", setup).onclick = () => {
      OS.ls.set("mock.track", chosen); OS.ls.set("mock.voice", OS.$("#voice", setup).value === "1");
      el.innerHTML = "";
      startSession(el, { track: chosen, count: +OS.$("#count", setup).value, level: +OS.$("#level", setup).value, company: OS.$("#company", setup).value.trim() });
    };

    const hc = h(`<div class="card mt"><h3>🗂️ Past sessions</h3><div class="list"></div></div>`);
    if (!hist.sessions.length) hc.lastElementChild.appendChild(h(`<div class="empty">No sessions yet.</div>`));
    for (const s of hist.sessions.slice(0, 20)) hc.lastElementChild.appendChild(h(`<a class="item spread" style="color:inherit" href="#/mock?session=${s.id}"><span>${esc(s.track)}${s.company ? " · " + esc(s.company) : ""}</span><span class="row"><span class="xs dim">${OS.ago(s.started)} · ${Math.round(((s.ended || s.started) - s.started) / 60)} min</span><b style="color:${OS.scoreColor(s.score || 0)}">${s.score == null ? "–" : s.score}</b></span></a>`));
    el.appendChild(hc);
  };

  async function topicSession(el, topic) {
    el.appendChild(h(`<div class="card"><span class="spinner"></span> Building a mock on <b>${esc(topic)}</b> from web research…<div class="agent-log mt"></div></div>`));
    try {
      const r = await OS.runAgent("research", { query: topic, depth: "quick" }, OS.$(".agent-log", el));
      const qs = r.qa.slice(0, 5).map((x) => ({ q: x.q, points: x.a.slice(0, 4), followups: [] }));
      for (const q of r.questions) { if (qs.length >= 5) break; if (!qs.find((x) => x.q === q)) qs.push({ q, points: r.key_points.slice(0, 5).map((k) => k.text), followups: [] }); }
      if (!qs.length) qs.push({ q: "Explain " + topic + " as you would in an interview.", points: r.key_points.slice(0, 6).map((k) => k.text), followups: [] });
      el.innerHTML = "";
      runSession(el, { track: "custom", track_name: "Topic: " + topic, company: "", minutes_per_q: 4, questions: qs });
    } catch (e) { el.innerHTML = `<div class="card">❌ ${esc(e.message)}</div>`; }
  }

  async function startSession(el, opts) {
    const s = await post("/mock/session", opts);
    if (!s.questions.length) { el.appendChild(h(`<div class="card">No questions for this track yet.</div>`)); return; }
    runSession(el, s);
  }

  function runSession(el, s) {
    const state = { track: s.track, company: s.company, started: Date.now() / 1000, answers: [] };
    let idx = 0, timer = null, secs = 0, rec = null, listening = false, hintsUsed = 0, spoken = false;
    const evalTrack = s.track === "custom" ? "cs" : s.track;

    const wrap = h(`<div>
      <div class="spread mb"><div><div class="muted small">${esc(s.track_name)}${s.company ? " · " + esc(s.company) : ""}</div><h2 style="margin:0" id="qn"></h2></div>
      <div class="row"><span class="timer" id="timer">0:00</span><span class="dim small" id="target"></span><button class="btn sm ghost" id="quit">End session</button></div></div>
      <div class="bar mb"><i id="prog" style="width:0"></i></div>
      <div class="grid" style="grid-template-columns:minmax(0,1fr) ${s.track === "system-design" ? "280px" : "0px"}">
        <div class="col">
          <div class="card pad-lg"><div class="row" style="align-items:flex-start;gap:14px"><div style="font-size:1.8rem">🧑‍💼</div><div style="flex:1"><div class="mock-q" id="q"></div><div class="small muted mt" id="qhint"></div></div><button class="btn sm ghost" id="say" title="Repeat question">🔊</button></div></div>
          <div class="card">
            <div class="spread mb"><b>Your answer</b><div class="row"><span class="xs dim" id="wc">0 words</span><button class="btn sm ghost" id="hint">💡 Hint</button></div></div>
            <textarea id="ans" rows="10" placeholder="${SR ? "Press the mic and talk, or type. Think out loud — structure beats speed." : "Type your answer. Think out loud — structure beats speed."}"></textarea>
            <div class="row mt"><button class="mic ${SR ? "" : "hide"}" id="mic" title="Dictate">🎤</button><span class="small muted" id="micst">${SR ? "Click the mic to answer by voice" : ""}</span><span style="flex:1"></span><button class="btn" id="skip">Skip</button><button class="btn primary" id="submit">Submit answer ↵</button></div>
          </div>
          <div id="fb"></div>
        </div>
        <div class="${s.track === "system-design" ? "" : "hide"}"><div class="card" style="position:sticky;top:70px"><h3>🧭 Design framework</h3><div class="phase-list">${(s.phases || []).map((ph, i) => `<div class="ph" data-ph="${i}"><b>${i + 1}. ${esc(ph[0])}</b><div class="xs muted">${esc(ph[1])}</div></div>`).join("")}</div></div></div>
      </div></div>`);
    el.appendChild(wrap);
    const $ = (id) => OS.$("#" + id, wrap);
    const ans = $("ans");
    ans.addEventListener("input", () => { $("wc").textContent = ans.value.trim().split(/\s+/).filter(Boolean).length + " words"; phaseHighlight(); });
    ans.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); });

    function phaseHighlight() {
      if (s.track !== "system-design") return;
      const t = ans.value.toLowerCase();
      const rx = [/requirement|scope|functional|assum/, /qps|dau|per second|storage|tb\b|gb\b|million|billion/, /api|endpoint|post \/|get \//, /load balancer|cache|queue|service|cdn|gateway/, /schema|table|partition|shard key|index/, /deep dive|hot|fan-?out|consisten|bottleneck/, /bottleneck|failure|monitor|single point|trade-?off/];
      OS.$$("[data-ph]", wrap).forEach((d, i) => d.classList.toggle("on", rx[i].test(t)));
    }

    function tick() {
      secs++; const m = Math.floor(secs / 60), ss = String(secs % 60).padStart(2, "0");
      $("timer").textContent = m + ":" + ss; $("timer").classList.toggle("over", secs > s.minutes_per_q * 60);
    }
    function show() {
      const q = s.questions[idx];
      $("qn").textContent = `Question ${idx + 1} of ${s.questions.length}`;
      $("q").textContent = q.q;
      $("qhint").innerHTML = q.value_hint ? `💎 ${esc(s.company)} values this: <b>${esc(q.value_hint)}</b>` : q.theme ? `Theme: ${esc(q.theme)}` : "";
      $("target").textContent = "target ≈ " + s.minutes_per_q + " min";
      $("prog").style.width = (100 * idx / s.questions.length) + "%";
      ans.value = ""; ans.disabled = false; $("wc").textContent = "0 words"; $("fb").innerHTML = ""; hintsUsed = 0; spoken = false;
      $("submit").disabled = false; $("skip").disabled = false;
      secs = 0; clearInterval(timer); timer = setInterval(tick, 1000); $("timer").textContent = "0:00";
      speak(q.q); phaseHighlight(); ans.focus();
    }
    $("say").onclick = () => speak(s.questions[idx].q);
    $("hint").onclick = () => {
      const q = s.questions[idx]; const pts = q.points || [];
      if (hintsUsed >= pts.length) return OS.toast("No more hints");
      $("qhint").innerHTML += `<div class="mt">💡 ${esc(pts[hintsUsed++])}</div>`;
    };

    // speech recognition
    if (SR) {
      $("mic").onclick = () => {
        if (listening) { rec && rec.stop(); return; }
        rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = OS.ls.get("mock.lang", "en-US");
        const base = ans.value ? ans.value.trimEnd() + " " : "";
        let finalText = "";
        rec.onresult = (e) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalText += r[0].transcript.trim() + ". "; else interim += r[0].transcript;
          }
          ans.value = base + finalText + interim; ans.dispatchEvent(new Event("input"));
        };
        rec.onstart = () => { listening = true; spoken = true; $("mic").classList.add("on"); $("micst").textContent = "Listening… click again to stop"; if (window.speechSynthesis) speechSynthesis.cancel(); };
        rec.onend = () => { listening = false; $("mic").classList.remove("on"); $("micst").textContent = "Click the mic to continue dictating"; };
        rec.onerror = (e) => { $("micst").textContent = "Mic error: " + e.error; };
        rec.start();
      };
    }

    async function submit(isSkip) {
      if (listening && rec) rec.stop();
      clearInterval(timer);
      const q = s.questions[idx];
      $("submit").disabled = true; $("skip").disabled = true;
      const answer = isSkip ? "" : ans.value.trim();
      let ev = null;
      if (answer) {
        $("fb").innerHTML = `<div class="card"><span class="spinner"></span> grading…</div>`;
        try { ev = await post("/mock/evaluate", { track: evalTrack, question: q, answer, seconds: secs, spoken }); } catch (e) { OS.toast(e.message); }
      }
      state.answers.push({ q: q.q, answer, seconds: secs, hints: hintsUsed, eval: ev, points: q.points });
      renderFeedback(q, ev, answer);
    }
    $("submit").onclick = () => submit(false);
    $("skip").onclick = () => submit(true);

    function renderFeedback(q, ev, answer) {
      const fb = $("fb"); fb.innerHTML = "";
      const last = idx === s.questions.length - 1;
      if (!ev) {
        fb.appendChild(h(`<div class="card"><b>Skipped.</b> What a strong answer covers:<ul>${(q.points || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul><button class="btn primary" id="next">${last ? "Finish" : "Next question →"}</button></div>`));
      } else {
        const d = ev.delivery;
        fb.appendChild(h(`<div class="card pad-lg">
          <div class="row" style="gap:18px">${OS.ring(ev.score)}<div><div class="kpi"><span class="v" style="color:${OS.scoreColor(ev.score)}">${esc(ev.verdict)}</span><span class="l">${Math.round(ev.coverage * 100)}% key points · ${d.words} words · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}${d.wpm ? " · " + d.wpm + " wpm" : ""}${hintsUsed ? " · " + hintsUsed + " hints" : ""}</span></div></div></div>
          ${ev.star ? `<div class="star mt">${Object.entries(ev.star).map(([k, v]) => `<div style="background:${v ? "var(--ok-bg)" : "var(--bad-bg)"};color:${v ? "var(--ok)" : "var(--bad)"}">${v ? "✓" : "✗"} ${k}</div>`).join("")}</div>` : ""}
          <div class="grid g2 mt"><div><h3>✅ Strengths</h3><ul class="fb small">${ev.strengths.map((x) => `<li>${esc(x)}</li>`).join("") || "<li class='dim'>—</li>"}</ul></div>
          <div><h3>🛠️ Improve</h3><ul class="fb small">${ev.improvements.map((x) => `<li>${esc(x)}</li>`).join("") || "<li class='dim'>Nothing major — great answer.</li>"}</ul></div></div>
          ${ev.llm && ev.llm.better_answer ? `<details class="qa"><summary>🤖 Model answer (local LLM)</summary><div class="a md">${OS.md(ev.llm.better_answer)}</div></details>` : ""}
          <details class="qa"><summary>📋 Rubric — what a strong answer covers</summary><div class="a">${ev.points.length ? ev.points.map((p) => `<div>${p.covered ? "✅" : "⬜"} ${esc(p.point)} <span class="xs dim">${Math.round(p.hit * 100)}%</span></div>`).join("") : (q.points || []).map((p) => `<div>• ${esc(p)}</div>`).join("")}</div></details>
          ${ev.followup ? `<div class="card mt" style="background:var(--panel2)"><b>🧑‍💼 Follow-up:</b> ${esc(ev.followup)}<div class="row mt"><button class="btn sm" id="fu">Answer the follow-up</button></div></div>` : ""}
          <div class="row mt"><button class="btn primary" id="next">${last ? "Finish & see report" : "Next question →"}</button><button class="btn" id="retry">↻ Retry this question</button><button class="btn ghost" id="cardit">🃏 Missed points → flashcard</button></div>
        </div>`));
        const fu = OS.$("#fu", fb);
        if (fu) fu.onclick = () => {
          s.questions.splice(idx + 1, 0, { q: ev.followup, points: ev.points.filter((p) => !p.covered).map((p) => p.point).slice(0, 4), followups: [], theme: "follow-up" });
          go();
        };
        OS.$("#retry", fb).onclick = () => { state.answers.pop(); const prev = ans.value; show(); ans.value = prev; ans.dispatchEvent(new Event("input")); };
        OS.$("#cardit", fb).onclick = () => OS.saveCards([{ front: q.q, back: (q.points || []).map((p) => "• " + p).join("\n") }], "Mock misses", "mock");
        if (s.track !== "behavioral") speak(ev.verdict + ". " + (ev.followup ? "Follow up: " + ev.followup : ""));
      }
      ans.disabled = true;
      OS.$("#next", fb).onclick = go;
      fb.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function go() {
      idx++;
      if (idx >= s.questions.length) return finish();
      show();
    }
    async function finish() {
      clearInterval(timer); if (window.speechSynthesis) speechSynthesis.cancel();
      state.ended = Date.now() / 1000;
      let saved = null;
      if (state.answers.length) { try { saved = await post("/mock/save", state); } catch (_) {} }
      el.innerHTML = "";
      report(el, state, saved && saved.score, saved && saved.id);
    }
    $("quit").onclick = () => { if (confirm("End the session and see the report?")) finish(); };
    show();
  }

  function report(el, st, avg, id) {
    const graded = st.answers.filter((a) => a.eval);
    avg = avg != null ? avg : graded.length ? Math.round(10 * graded.reduce((a, x) => a + x.eval.score, 0) / graded.length) / 10 : null;
    const missed = [];
    graded.forEach((a) => a.eval.points.filter((p) => !p.covered).forEach((p) => missed.push({ q: a.q, p: p.point })));
    const imp = {};
    graded.forEach((a) => a.eval.improvements.slice(1).forEach((x) => { const k = x.split(":")[0].split("(")[0].trim(); imp[k] = (imp[k] || 0) + 1; }));
    el.appendChild(h(`<div>
      <div class="page-h"><div><h1>📊 Interview report</h1><p>${esc(st.track)}${st.company ? " · " + esc(st.company) : ""} · ${Math.round(((st.ended || st.started) - st.started) / 60)} minutes · ${st.answers.length} questions</p></div><div class="row"><a class="btn" href="#/mock">New session</a><a class="btn primary" href="#/mock?start=1&track=${esc(st.track)}&company=${encodeURIComponent(st.company || "")}">Go again</a></div></div>
      <div class="grid g3"><div class="card row" style="gap:16px">${OS.ring(avg)}<div class="kpi"><span class="v">${avg == null ? "–" : avg >= 8 ? "Strong Hire" : avg >= 6.5 ? "Hire" : avg >= 5 ? "Lean Hire" : "Keep practising"}</span><span class="l">overall</span></div></div>
      <div class="card"><h3>🔁 Recurring feedback</h3>${Object.entries(imp).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => `<div class="small">• ${esc(k)} <span class="dim">×${n}</span></div>`).join("") || '<div class="muted small">None — solid session.</div>'}</div>
      <div class="card"><h3>🎯 Gaps to study</h3><div class="small muted">${missed.length} key points missed</div><button class="btn sm mt" id="gapcards" ${missed.length ? "" : "disabled"}>🃏 Turn gaps into flashcards</button></div></div>
      <div class="col mt" id="qs"></div></div>`));
    const qs = OS.$("#qs", el);
    st.answers.forEach((a, i) => {
      const e = a.eval;
      qs.appendChild(h(`<details class="qa" ${i === 0 ? "open" : ""}><summary><span style="color:${OS.scoreColor(e ? e.score : 0)}">${e ? e.score : "skipped"}</span> · ${esc(a.q)}</summary><div class="a">
        ${a.answer ? `<div class="card" style="white-space:pre-wrap;background:var(--bg2)">${esc(a.answer)}</div>` : ""}
        ${e ? `<div class="grid g2 mt"><div><b>Strengths</b><ul class="small">${e.strengths.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div><div><b>Improve</b><ul class="small">${e.improvements.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div>` : `<ul>${(a.points || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`}
      </div></details>`));
    });
    const gb = OS.$("#gapcards", el);
    if (gb) gb.onclick = () => {
      const by = {}; missed.forEach((m) => (by[m.q] = by[m.q] || []).push(m.p));
      OS.saveCards(Object.entries(by).map(([q, ps]) => ({ front: q, back: ps.map((p) => "• " + p).join("\n") })), "Mock misses", "mock:" + (id || ""));
    };
  }

  async function showPast(el, id) {
    const s = await get("/mock/" + id);
    report(el, s.data, s.score, s.id);
  }
})();
