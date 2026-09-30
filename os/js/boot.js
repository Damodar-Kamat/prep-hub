/* Boot: wire chrome, load profile + LLM status, start router. */
(function () {
  OS.$("#omni").onclick = () => OS.palette();
  OS.$("#themeBtn").onclick = () => OS.toggleTheme();
  OS.$("#menuBtn").onclick = () => OS.$("#side").classList.toggle("open");
  if (window.speechSynthesis) speechSynthesis.getVoices();

  // Static hosting (e.g. GitHub Pages) has no Python server: explain how to run the full app.
  function offline() {
    OS.$("#llmStatus").innerHTML = `<span style="color:var(--warn)">⚠ server not running</span>`;
    OS.$("#view").innerHTML = `<div class="hero" style="max-width:760px">
      <h1>⚡ Interview OS needs its server</h1>
      <p class="muted">The agents, mock-interview grading, flashcards and code runner run in a small Python server.</p>
      <div class="col mt">
        <div><b>On your machine:</b> <code>./start.sh</code> then open <code>http://localhost:8777</code></div>
        <div><b>In the cloud (free):</b> deploy the repo to Render — see “Deploy to Render” in the README.</div>
        <a class="btn lg" href="../index.html">📚 Open the study library (works without the server)</a>
      </div></div>`;
  }

  fetch("/api/health", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).catch(() => null).then((h) => {
    if (!h || h.app !== "Interview OS") return offline();
    if (h.auth) OS.$(".side-foot .row").appendChild(OS.h(`<a class="btn sm ghost" href="/logout">⎋ Sign out</a>`));
    OS.get("/settings").then((s) => { OS.state.profile = s.profile || {}; }).catch(() => {});
    OS.get("/status").then((s) => {
      OS.$("#llmStatus").innerHTML = s.llm.ready
        ? `🤖 Local LLM: <b>${OS.esc(s.llm.model)}</b>`
        : `🤖 Agents: classic NLP · <a href="#/settings">add local LLM</a>`;
    }).catch(() => {});
    OS.start();
  });
})();
