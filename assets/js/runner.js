/* In-browser JavaScript code runner using a sandboxed Web Worker.
   Runs the user's solution function against an array of test cases,
   with a hard timeout so infinite loops can't freeze the page. */
(function () {
  const workerSrc = `
    self.onmessage = function (e) {
      const { code, fnName, tests } = e.data;
      const logs = [];
      const origLog = (...a) => logs.push(a.map(fmt).join(' '));
      self.console = { log: origLog, error: origLog, warn: origLog, info: origLog };
      function fmt(v){ try { return typeof v === 'string' ? v : JSON.stringify(v); } catch(_){ return String(v); } }
      let solution;
      try {
        const factory = new Function(code + '\\n; return (typeof ' + fnName + ' !== "undefined") ? ' + fnName + ' : undefined;');
        solution = factory();
      } catch (err) {
        self.postMessage({ error: 'Compile error: ' + err.message, logs });
        return;
      }
      if (typeof solution !== 'function') {
        self.postMessage({ error: 'Could not find a function named "' + fnName + '". Define it (do not rename the function).', logs });
        return;
      }
      const results = [];
      for (const tc of tests) {
        const args = JSON.parse(JSON.stringify(tc.input));
        let got, ok = false, errMsg = null;
        const start = Date.now();
        try {
          got = solution.apply(null, args);
        } catch (err) {
          errMsg = err.message;
        }
        const ms = Date.now() - start;
        if (errMsg === null) ok = deepEq(normalize(got, tc), tc.expected);
        results.push({ input: tc.input, expected: tc.expected, got: errMsg ? '(threw) ' + errMsg : got, ok, ms, hidden: !!tc.hidden });
      }
      self.postMessage({ results, logs });

      function normalize(v, tc){
        if (tc.unordered && Array.isArray(v)) return [...v].sort(cmp);
        return v;
      }
      function cmp(a,b){ return JSON.stringify(a) < JSON.stringify(b) ? -1 : 1; }
      function deepEq(a, b){
        if (a === b) return true;
        if (typeof a !== typeof b) return false;
        if (a && b && typeof a === 'object') {
          const ka = Object.keys(a), kb = Object.keys(b);
          if (ka.length !== kb.length) return false;
          return ka.every(k => deepEq(a[k], b[k]));
        }
        return false;
      }
    };
  `;

  let blobUrl;
  function getUrl() {
    if (!blobUrl) blobUrl = URL.createObjectURL(new Blob([workerSrc], { type: 'text/javascript' }));
    return blobUrl;
  }

  window.runSolution = function ({ code, fnName, tests, timeoutMs = 4000 }) {
    return new Promise((resolve) => {
      const worker = new Worker(getUrl());
      const timer = setTimeout(() => {
        worker.terminate();
        resolve({ error: 'Time Limit Exceeded (' + timeoutMs + 'ms). Check for an infinite loop or heavy complexity.', logs: [] });
      }, timeoutMs);
      worker.onmessage = (e) => { clearTimeout(timer); worker.terminate(); resolve(e.data); };
      worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); resolve({ error: e.message, logs: [] }); };
      worker.postMessage({ code, fnName, tests });
    });
  };

  /* ---- Remote execution for Java / Python / C++ via the public Piston API ----
     Runs the code AS A COMPLETE PROGRAM (the starter for these languages includes
     a main / entry point that prints results). Needs internet. No automated
     grading for these languages — the user compares printed output to the examples.
     JavaScript keeps using the local worker above with full test-case checking. */
  const PISTON = 'https://emkc.org/api/v2/piston';
  const PISTON_LANG = {
    java:       { language: 'java',       filename: 'Main.java' },
    python:     { language: 'python',     filename: 'main.py' },
    cpp:        { language: 'c++',        filename: 'main.cpp' },
    javascript: { language: 'javascript', filename: 'main.js' },
  };
  let runtimesPromise = null;
  function loadRuntimes() {
    if (!runtimesPromise) {
      runtimesPromise = fetch(PISTON + '/runtimes')
        .then((r) => r.json())
        .catch(() => null);
    }
    return runtimesPromise;
  }
  async function versionFor(pistonLang) {
    const runtimes = await loadRuntimes();
    if (!runtimes) return '*';
    const match = runtimes.filter((rt) => rt.language === pistonLang || (rt.aliases || []).includes(pistonLang));
    return match.length ? match[match.length - 1].version : '*';
  }

  window.runRemote = async function ({ lang, code, stdin = '' }) {
    const cfg = PISTON_LANG[lang];
    if (!cfg) return { error: 'Unsupported language: ' + lang };
    let version;
    try {
      version = await versionFor(cfg.language);
    } catch (_) {
      return { error: 'Could not reach the code-execution service. Check your internet connection (Java/Python/C++ need it).' };
    }
    try {
      const res = await fetch(PISTON + '/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: cfg.language,
          version,
          files: [{ name: cfg.filename, content: code }],
          stdin,
          compile_timeout: 10000,
          run_timeout: 5000,
        }),
      });
      if (res.status === 429) return { error: 'Rate limited by the public execution service — wait a few seconds and try again.' };
      if (!res.ok) return { error: 'Execution service returned HTTP ' + res.status };
      const data = await res.json();
      const compile = data.compile || {};
      const run = data.run || {};
      return {
        compileOutput: (compile.stderr || compile.output || '').trim(),
        stdout: (run.stdout || '').trim(),
        stderr: (run.stderr || '').trim(),
        code: run.code,
        signal: run.signal,
        version: data.version,
      };
    } catch (err) {
      return { error: 'Could not reach the code-execution service (' + err.message + '). Java/Python/C++ need internet; JavaScript runs offline.' };
    }
  };
})();
