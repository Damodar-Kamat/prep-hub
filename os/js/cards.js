/* Flashcards with SM-2 spaced repetition: review session, deck overview, browser, quick add. */
(function () {
  const { h, esc, get, post } = OS;

  OS.views["/cards"] = async (el, p) => {
    const st = await get("/cards/stats");
    el.appendChild(h(`<div class="page-h"><div><h1>🃏 Flashcards</h1><p>Spaced repetition (SM-2). Seeded from your whole library + the question bank; research reports, mocks and digests add more. <b>${st.due}</b> due today (${st.reviews_due} reviews + ${st.new_today} new) · ${st.reviewed_today} reviewed today · ${st.total} total, ${st.new_total} not yet started · <a href="#/settings">${st.new_per_day} new/day</a>.</p></div>
      <div class="row"><button class="btn primary" id="rev" ${st.due ? "" : "disabled"}>▶ Review ${st.due} due</button><button class="btn" id="add">＋ Add card</button><button class="btn ghost" id="seed" title="Re-import library topics & question bank">⟳ Sync library</button></div></div>`));
    const tabs = h(`<div class="tabs"><button class="on" data-t="decks">Decks</button><button data-t="browse">Browse</button></div>`);
    el.appendChild(tabs);
    const body = h(`<div></div>`); el.appendChild(body);
    OS.$("#rev", el).onclick = () => review(el, null);
    OS.$("#add", el).onclick = () => addDialog(el);
    OS.$("#seed", el).onclick = async () => { const r = await post("/cards/seed"); OS.toast(`Synced — ${r.added} new cards`); OS.go("#/cards"); };
    const showDecks = () => {
      body.innerHTML = "";
      const g = h(`<div class="grid g3"></div>`);
      for (const d of st.decks) {
        const c = h(`<div class="card"><div class="spread"><b>${esc(d.deck)}</b><span class="badge ${d.due ? "acc" : ""}">${d.due || 0} due</span></div>
          <div class="bar mt"><i style="width:${Math.round(100 * (d.mature || 0) / Math.max(1, d.total))}%"></i></div>
          <div class="spread mt xs dim"><span>${d.total} cards · ${d.mature || 0} mature</span><button class="btn sm" ${d.due ? "" : "disabled"}>Review</button></div></div>`);
        c.querySelector("button").onclick = () => review(el, d.deck);
        g.appendChild(c);
      }
      body.appendChild(st.decks.length ? g : h(`<div class="empty"><div class="big">🃏</div>No cards yet.</div>`));
    };
    const showBrowse = async () => {
      body.innerHTML = "";
      const bar = h(`<div class="row mb"><input placeholder="Search cards…" style="max-width:360px"><select style="width:auto"><option value="">All decks</option>${st.decks.map((d) => `<option>${esc(d.deck)}</option>`).join("")}</select></div>`);
      const list = h(`<div class="card list"></div>`);
      body.append(bar, list);
      const load = OS.debounce(async () => {
        const r = await get(`/cards?q=${encodeURIComponent(bar.children[0].value)}&deck=${encodeURIComponent(bar.children[1].value)}`);
        list.innerHTML = "";
        for (const c of r.cards) {
          const it = h(`<div class="item"><div class="spread"><b>${esc(c.front)}</b><span class="row"><span class="xs dim">${esc(c.deck)} · next ${c.due < Date.now() / 1000 ? "now" : OS.fmtDate(c.due)}</span><button class="btn sm ghost" data-a="edit">✎</button><button class="btn sm ghost danger" data-a="del">🗑</button></span></div><div class="small muted" style="white-space:pre-wrap">${esc(c.back.slice(0, 400))}</div></div>`);
          it.querySelector('[data-a="del"]').onclick = async () => { await OS.del("/cards/" + c.id); it.remove(); };
          it.querySelector('[data-a="edit"]').onclick = () => addDialog(el, c, load);
          list.appendChild(it);
        }
        if (!r.cards.length) list.innerHTML = `<div class="empty">No matching cards</div>`;
      }, 200);
      bar.children[0].oninput = load; bar.children[1].onchange = load; load();
    };
    OS.$$("button", tabs).forEach((b) => (b.onclick = () => { OS.$$("button", tabs).forEach((x) => x.classList.toggle("on", x === b)); b.dataset.t === "decks" ? showDecks() : showBrowse(); }));
    showDecks();
    if (p.review) review(el, p.deck || null);
  };

  function addDialog(el, card, after) {
    const bg = h(`<div class="palette-bg"><div class="palette" style="padding:18px"><h3>${card ? "Edit" : "New"} card</h3>
      <div class="field"><label>Deck</label><input id="dk" value="${esc(card ? card.deck : OS.ls.get("cards.deck", "General"))}"></div>
      <div class="field mt"><label>Front (question)</label><textarea id="fr" rows="3">${esc(card ? card.front : "")}</textarea></div>
      <div class="field mt"><label>Back (answer)</label><textarea id="bk" rows="6">${esc(card ? card.back : "")}</textarea></div>
      <div class="row mt"><button class="btn primary" id="sv">Save</button><button class="btn ghost" id="cx">Cancel</button></div></div></div>`);
    document.body.appendChild(bg);
    OS.$("#cx", bg).onclick = () => bg.remove();
    OS.$("#fr", bg).focus();
    OS.$("#sv", bg).onclick = async () => {
      const d = { deck: OS.$("#dk", bg).value || "General", front: OS.$("#fr", bg).value, back: OS.$("#bk", bg).value };
      if (!d.front.trim()) return;
      OS.ls.set("cards.deck", d.deck);
      if (card) await OS.put("/cards/" + card.id, d); else await post("/cards", d);
      bg.remove(); OS.toast("Saved"); after ? after() : OS.go("#/cards");
    };
  }

  async function review(el, deck) {
    const r = await get("/cards/due?limit=200" + (deck ? "&deck=" + encodeURIComponent(deck) : ""));
    let queue = r.cards, i = 0, shown = false, done = 0, t0 = Date.now();
    el.innerHTML = "";
    const wrap = h(`<div style="max-width:780px;margin:0 auto">
      <div class="spread mb"><a href="#/cards" class="small">← Decks</a><span class="muted small" id="cnt"></span></div>
      <div class="bar mb"><i id="pg"></i></div>
      <div class="card flash" id="fc"></div>
      <div class="mt" id="ctrl"></div>
      <div class="xs dim mt" style="text-align:center">Space = flip · 1 again · 2 hard · 3 good · 4 easy · E edit</div></div>`);
    el.appendChild(wrap);
    const fc = OS.$("#fc", wrap), ctrl = OS.$("#ctrl", wrap);
    function draw() {
      OS.$("#cnt", wrap).textContent = `${done} done · ${queue.length - i} left${deck ? " · " + deck : ""}`;
      OS.$("#pg", wrap).style.width = (100 * i / Math.max(1, queue.length)) + "%";
      if (i >= queue.length) {
        fc.innerHTML = `<div><div style="font-size:2.4rem">🎉</div><h2>Session complete</h2><div class="muted">${done} cards in ${Math.round((Date.now() - t0) / 60000)} min</div></div>`;
        ctrl.innerHTML = `<div class="row" style="justify-content:center"><a class="btn primary" href="#/cards">Back to decks</a><a class="btn" href="#/mock">Try a mock →</a></div>`;
        OS.refreshBadges(); return;
      }
      const c = queue[i];
      fc.innerHTML = `<div class="xs dim">${esc(c.deck)}${c.source && c.source.startsWith("/") ? ` · <a href="${esc(c.source)}" onclick="event.stopPropagation()">source</a>` : ""}</div><div style="font-weight:650;margin-top:8px">${esc(c.front)}</div>${shown ? `<div class="back">${esc(c.back)}</div>` : `<div class="xs dim mt">click or press space to reveal</div>`}`;
      ctrl.innerHTML = shown ? `<div class="grades">
        <button class="btn" data-g="0" style="color:var(--bad)">Again<small>&lt;10m</small></button>
        <button class="btn" data-g="1" style="color:var(--warn)">Hard<small>${iv(c, 1)}</small></button>
        <button class="btn" data-g="2" style="color:var(--info)">Good<small>${iv(c, 2)}</small></button>
        <button class="btn" data-g="3" style="color:var(--ok)">Easy<small>${iv(c, 3)}</small></button></div>`
        : `<div class="row" style="justify-content:center"><button class="btn primary lg" id="flip">Show answer</button></div>`;
      OS.$$("[data-g]", ctrl).forEach((b) => (b.onclick = () => grade(+b.dataset.g)));
      const f = OS.$("#flip", ctrl); if (f) f.onclick = flip;
    }
    function iv(c, g) {
      if (c.reps === 0) return g === 1 ? "1d" : g === 2 ? "1d" : "3d";
      const d = c.interval * c.ease * (g === 1 ? 0.8 : g === 3 ? 1.3 : 1);
      return d < 30 ? Math.round(d) + "d" : Math.round(d / 30) + "mo";
    }
    function flip() { shown = true; draw(); }
    async function grade(g) {
      const c = queue[i];
      await post(`/cards/${c.id}/review`, { grade: g });
      if (g === 0) queue.push(c);
      i++; done++; shown = false; draw();
    }
    fc.onclick = () => { if (!shown && i < queue.length) flip(); };
    const key = (e) => {
      if (!document.body.contains(wrap)) return document.removeEventListener("keydown", key);
      if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      if (e.code === "Space") { e.preventDefault(); if (!shown) flip(); }
      else if (shown && "1234".includes(e.key)) grade(+e.key - 1);
      else if (e.key === "e" && queue[i]) addDialog(el, queue[i], () => {});
    };
    document.addEventListener("keydown", key);
    draw();
  }
})();
