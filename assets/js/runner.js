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

  /* ---- Remote execution for Java / Python / C++ via the Wandbox API ----
     Runs the code AS A COMPLETE PROGRAM (the starter for these languages ships a
     main / entry point that prints results). Needs internet. No automated grading
     for these languages — the user compares printed output to the examples.
     JavaScript keeps using the local worker above with full test-case checking. */
  const WANDBOX = 'https://wandbox.org/api';
  // language -> [regex to match a compiler name (newest first in the list), fallback name]
  const WANDBOX_LANG = {
    java:   { lang: 'Java',   re: /^openjdk-jdk-/,        fallback: 'openjdk-jdk-22+36' },
    python: { lang: 'Python', re: /^cpython-3\.\d+\.\d+$/, fallback: 'cpython-3.12.7' },
    cpp:    { lang: 'C++',    re: /^gcc-\d[\d.]*$/,        fallback: 'gcc-13.2.0' },
  };
  let compilerListPromise = null;
  function loadCompilerList() {
    if (!compilerListPromise) {
      compilerListPromise = fetch(WANDBOX + '/list.json').then((r) => r.json()).catch(() => null);
    }
    return compilerListPromise;
  }
  async function compilerFor(lang) {
    const cfg = WANDBOX_LANG[lang];
    if (!cfg) return null;
    const list = await loadCompilerList();
    if (list) {
      const hit = list.find((c) => c.language === cfg.lang && cfg.re.test(c.name));
      if (hit) return hit.name;
    }
    return cfg.fallback;
  }

  window.runRemote = async function ({ lang, code, stdin = '' }) {
    if (!WANDBOX_LANG[lang]) return { error: 'Unsupported language: ' + lang };
    let compiler;
    try {
      compiler = await compilerFor(lang);
    } catch (_) {
      return { error: 'Could not reach the code-execution service. Java/Python/C++ need internet; JavaScript runs offline.' };
    }
    try {
      const res = await fetch(WANDBOX + '/compile.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compiler, code, stdin, save: false }),
      });
      if (res.status === 429) return { error: 'Rate limited by the execution service — wait a few seconds and retry.' };
      if (!res.ok) return { error: 'Execution service returned HTTP ' + res.status };
      const d = await res.json();
      return {
        compiler,
        compileOutput: (d.compiler_error || d.compiler_output || '').trim(),
        stdout: (d.program_output || '').trim(),
        stderr: (d.program_error || '').trim(),
        code: d.status === undefined ? null : Number(d.status),
        signal: d.signal || '',
      };
    } catch (err) {
      return { error: 'Could not reach the code-execution service (' + err.message + '). Java/Python/C++ need internet; JavaScript runs offline.' };
    }
  };
})();
