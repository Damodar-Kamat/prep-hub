/* Boot: wire chrome, load profile + LLM status, start router. */
(function () {
  OS.$("#omni").onclick = () => OS.palette();
  OS.$("#themeBtn").onclick = () => OS.toggleTheme();
  OS.$("#menuBtn").onclick = () => OS.$("#side").classList.toggle("open");
  if (window.speechSynthesis) speechSynthesis.getVoices();
  OS.get("/settings").then((s) => { OS.state.profile = s.profile || {}; }).catch(() => {});
  OS.get("/status").then((s) => {
    OS.$("#llmStatus").innerHTML = s.llm.ready
      ? `🤖 Local LLM: <b>${OS.esc(s.llm.model)}</b>`
      : `🤖 Agents: classic NLP · <a href="#/settings">add local LLM</a>`;
  }).catch(() => { OS.$("#llmStatus").innerHTML = `<span style="color:var(--bad)">⚠ server offline — run <code>./start.sh</code></span>`; });
  OS.start();
})();
