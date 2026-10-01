// Evaluate prep-hub's data/*.js (browser globals) and emit a JSON library for the backend.
// Usage: node build_library.js <prep-hub root> <out.json>   (works on Node >= 8)
var fs = require("fs"), path = require("path"), vm = require("vm");
var root = process.argv[2], out = process.argv[3];
var sandbox = { window: {} }; sandbox.window.window = sandbox.window; vm.createContext(sandbox);
// load in the same order index.html does (problems.js must run before problems-2.js)
var idx = fs.readFileSync(path.join(root, "index.html"), "utf8");
var files = [], re = /src="data\/([^"]+\.js)"/g, m;
while ((m = re.exec(idx))) files.push(m[1]);
fs.readdirSync(path.join(root, "data")).forEach(function (f) { if (/\.js$/.test(f) && files.indexOf(f) < 0) files.push(f); });
files.forEach(function (f) {
  try { vm.runInContext(fs.readFileSync(path.join(root, "data", f), "utf8"), sandbox, { filename: f }); }
  catch (e) { console.error("skip " + f + ": " + e.message); }
});
var w = sandbox.window;
var strip = function (h) { return String(h || "").replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim(); };
var lib = { sections: [], problems: [], roadmap: [] };
(w.STUDY_SECTIONS || []).forEach(function (s) {
  lib.sections.push({ id: s.id, title: s.title, icon: s.icon, group: s.group || "", topics: (s.topics || []).map(function (t) {
    return { id: t.id, title: t.title, tags: t.tags || [], summary: strip(t.summary || ""), problems: t.problems || [], resources: (t.resources || []).map(function (r) { return { t: r.t, u: r.u, k: r.k }; }),
             brushup: (t.brushup || []).map(strip),
             pitfalls: (t.pitfalls || []).map(strip), interviewQs: (t.interviewQs || []).map(function (q) { return typeof q === "string" ? strip(q) : { q: strip(q.q || q.question), a: strip(q.a || q.answer) }; }),
             text: strip(t.detail).slice(0, 20000) };
  }) });
});
(w.STUDY_PROBLEMS || []).forEach(function (p) {
  lib.problems.push({ id: p.id, lc: p.lc || "", companies: p.companies || [], pattern: p.pattern || "", stuck: (p.stuck || []).map(strip), complexity: p.complexity || "", title: p.title, difficulty: p.difficulty, tags: p.tags || [], statement: strip(p.statement), hints: (p.hints || []).map(strip) });
});
var rm = w.STUDY_ROADMAP || {};
(rm.groups || []).forEach(function (g) { (g.problems || []).forEach(function (p) { lib.roadmap.push({ id: p.id, title: p.title, diff: p.diff, lc: p.lc, local: p.local, group: g.name }); }); });
lib.guides = w.STUDY_GUIDES || {};
fs.writeFileSync(out, JSON.stringify(lib));
console.log("library: " + lib.sections.length + " sections, " + lib.sections.reduce(function (a, s) { return a + s.topics.length; }, 0) + " topics, " + lib.problems.length + " problems, " + lib.roadmap.length + " roadmap");
