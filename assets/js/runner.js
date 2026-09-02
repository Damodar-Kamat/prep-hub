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
})();
