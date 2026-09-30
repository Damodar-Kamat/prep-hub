// Self-check for DSA practice problems: runs each problem's reference `code` against its tests
// and writes Java/Python starters to a temp dir for compilation. Usage: node scripts/check-problems.js data/problems-3.js [...]
const fs = require("fs"), vm = require("vm"), path = require("path"), os = require("os");
const w = {}; w.window = w; vm.createContext(w);
for (const f of process.argv.slice(2)) vm.runInContext(fs.readFileSync(f, "utf8"), w, { filename: f });
const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// mirrors assets/js/runner.js normalize(): unordered ⇒ sort the outer array by JSON (applied to both sides)
const norm = (v, t) => (t.unordered && Array.isArray(v) ? [...v].sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)) : v);
let fail = 0, n = 0;
const out = process.env.STARTER_OUT || path.join(os.tmpdir(), "prob-starters");
require("child_process").execSync("rm -rf '" + out + "' && mkdir -p '" + out + "'");
for (const p of w.STUDY_PROBLEMS.filter(p => p.code)) {
  n++;
  const fn = new Function(p.code + "\n; return " + p.fnName + ";")();
  p.tests.forEach((t, i) => {
    const got = fn(...JSON.parse(JSON.stringify(t.input)));
    const exp = norm(t.expected, t);
    if (!deepEq(norm(got, t), exp)) { fail++; console.log(`FAIL ${p.id} test ${i}: got ${JSON.stringify(got)} expected ${JSON.stringify(t.expected)}`); }
  });
  const st = w.STUDY_STARTERS[p.id] || {};
  if (st.java) { fs.mkdirSync(path.join(out, "java", p.id), { recursive: true }); fs.writeFileSync(path.join(out, "java", p.id, "Main.java"), st.java); }
  if (st.python) { fs.mkdirSync(path.join(out, "py"), { recursive: true }); fs.writeFileSync(path.join(out, "py", p.id.replace(/-/g, "_") + ".py"), st.python); }
  for (const k of ["stuck", "companies", "pattern", "complexity", "lc"]) if (!p[k]) { fail++; console.log(`MISSING ${k} in ${p.id}`); }
}
console.log(`${n} problems checked, ${fail} failures. Starters in ${out}`);
process.exit(fail ? 1 : 0);
