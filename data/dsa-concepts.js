/* DSA concepts — study notes (deep-dive edition). */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "dsa",
  title: "DSA Concepts",
  icon: "🧩",
  blurb: "Data structures & algorithm patterns from fundamentals to interview-grade. Pair with the DSA Practice tab.",
  topics: [
    {
      id: "dsa-bigo",
      title: "Time & Space Complexity (Big-O)",
      tags: ["fundamentals", "analysis"],
      brushup: [
        "Big-O = <b>asymptotic upper bound</b> on growth as input n → ∞; drop constants and lower-order terms (3n²+n ⇒ O(n²)).",
        "Θ (tight bound), Ω (lower bound), O (upper bound). Interviewers say 'Big-O' but usually want the tight bound.",
        "Common ladder: O(1) &lt; O(log n) &lt; O(n) &lt; O(n log n) &lt; O(n²) &lt; O(n³) &lt; O(2ⁿ) &lt; O(n!).",
        "log n ⇒ you halve the problem each step (binary search, balanced BST, heap ops).",
        "n log n ⇒ efficient comparison sorts, divide-and-conquer with linear merge.",
        "Amortized: occasional expensive op averaged over many cheap ones (dynamic array push = O(1) amortized).",
        "Space complexity counts <b>extra</b> memory: recursion stack depth counts; the input and (usually) the output don't.",
        "State best/avg/worst when they differ (quicksort avg O(n log n), worst O(n²)).",
      ],
      detail: `
<h2>Why we use asymptotic analysis</h2>
<p>Real runtime depends on the machine, the language, the compiler, caches, and the exact input. Big-O throws all of that away and keeps only how the cost <em>scales</em> with input size. Two benefits: (1) it's a property of the algorithm, not the laptop, so it's comparable and durable; (2) for large inputs the growth term dominates everything else, so it predicts which algorithm wins where it matters.</p>
<p>Formally, <code>f(n) = O(g(n))</code> means there exist constants <code>c &gt; 0</code> and <code>n₀</code> such that <code>f(n) ≤ c·g(n)</code> for all <code>n ≥ n₀</code>. That's why constants and lower-order terms vanish: <code>3n² + 100n + 7 = O(n²)</code> because for large enough n, <code>4n²</code> dominates it.</p>
<h3>O vs Θ vs Ω</h3>
<ul>
<li><b>O(g)</b> — grows no faster than g (upper bound). "This runs in at most…"</li>
<li><b>Ω(g)</b> — grows at least as fast as g (lower bound). "This can't be faster than…"</li>
<li><b>Θ(g)</b> — both: grows exactly like g. When people ask "what's the Big-O", give Θ if you know it.</li>
</ul>
<p>Example: linear search is <code>O(n)</code> and <code>Ω(1)</code> (best case: first element). Its <em>worst-case</em> is <code>Θ(n)</code>.</p>

<h2>Deriving complexity from code</h2>
<ul>
<li>Sequential statements ⇒ <b>add</b>, then keep the biggest: O(a) + O(b) = O(max(a, b)).</li>
<li>Nested loops over the same n ⇒ <b>multiply</b>: O(n·n) = O(n²).</li>
<li>Loop that multiplies/divides the counter by a constant ⇒ O(log n).</li>
<li>Loop <code>for j in 0..i</code> inside <code>for i in 0..n</code> ⇒ 0+1+2+…+(n−1) = n(n−1)/2 = O(n²).</li>
<li>Recursion: write the recurrence and solve it (see below).</li>
</ul>
<pre><code>function f(a){                     // n = a.length
  let s = 0;
  for (const x of a) s += x;        // O(n)
  a.sort((p,q)=&gt;p-q);               // O(n log n)   ← dominates
  for (let i=0;i&lt;a.length;i++)
    for (let j=i+1;j&lt;a.length;j++)  // O(n^2)       ← dominates everything
      if (a[i]+a[j]===0) return true;
  return false;
}
// total: O(n^2)</code></pre>

<h2>The Master Theorem (for divide & conquer)</h2>
<p>For <code>T(n) = a·T(n/b) + O(nᵈ)</code> (a subproblems, each size n/b, plus O(nᵈ) to split/combine):</p>
<table>
<tr><th>Condition</th><th>Result</th><th>Example</th></tr>
<tr><td>d &lt; log_b(a)</td><td>T(n) = O(n^log_b a)</td><td>Karatsuba: T=3T(n/2)+O(n) ⇒ O(n^1.585)</td></tr>
<tr><td>d = log_b(a)</td><td>T(n) = O(nᵈ log n)</td><td>Merge sort: T=2T(n/2)+O(n) ⇒ O(n log n)</td></tr>
<tr><td>d &gt; log_b(a)</td><td>T(n) = O(nᵈ)</td><td>T=2T(n/2)+O(n²) ⇒ O(n²)</td></tr>
</table>

<h2>Reference table & performance budget</h2>
<table>
<tr><th>Complexity</th><th>n = 10</th><th>n = 1,000</th><th>n = 1,000,000</th><th>Typical source</th></tr>
<tr><td>O(1)</td><td>1</td><td>1</td><td>1</td><td>hash lookup, array index, math</td></tr>
<tr><td>O(log n)</td><td>~3</td><td>~10</td><td>~20</td><td>binary search, heap push/pop</td></tr>
<tr><td>O(n)</td><td>10</td><td>10³</td><td>10⁶</td><td>single scan, two-pointer</td></tr>
<tr><td>O(n log n)</td><td>~33</td><td>~10⁴</td><td>~2×10⁷</td><td>merge/heap sort, sort-then-sweep</td></tr>
<tr><td>O(n²)</td><td>100</td><td>10⁶</td><td>10¹²</td><td>nested loops, naive pair compare</td></tr>
<tr><td>O(2ⁿ)</td><td>1,024</td><td>astronomical</td><td>—</td><td>subsets, naive recursion</td></tr>
<tr><td>O(n!)</td><td>3.6M</td><td>—</td><td>—</td><td>permutations, brute-force TSP</td></tr>
</table>
<p>Rule of thumb: a modern machine does ~10⁸–10⁹ simple operations per second in a compiled language, ~10⁷–10⁸ in a scripting language. <b>Read the constraints to infer the target complexity:</b></p>
<table>
<tr><th>n ≤</th><th>Feasible complexity</th></tr>
<tr><td>10–12</td><td>O(n!), O(2ⁿ·n)</td></tr>
<tr><td>20–25</td><td>O(2ⁿ), meet-in-the-middle O(2^(n/2))</td></tr>
<tr><td>500</td><td>O(n³)</td></tr>
<tr><td>5,000</td><td>O(n²)</td></tr>
<tr><td>10⁵–10⁶</td><td>O(n log n) or O(n)</td></tr>
<tr><td>10⁹+</td><td>O(log n) or O(1) — probably math</td></tr>
</table>

<h2>Amortized analysis</h2>
<p>Some operations are usually cheap but occasionally expensive; amortized cost averages the expensive ones over the cheap ones. The classic: a dynamic array (JS <code>Array</code>, C++ <code>vector</code>). Most <code>push</code>es are O(1). When capacity is full it doubles and copies everything — O(n). But doublings happen at sizes 1, 2, 4, 8, …, so across n pushes the total copy work is <code>1 + 2 + 4 + … + n ≈ 2n</code> = O(n), i.e. <b>O(1) amortized per push</b>.</p>
<p>Three techniques to prove it: aggregate (total / count), accounting (prepay cheap ops to bank credit for expensive ones), potential (define a potential function).</p>

<h2>Space complexity — what counts</h2>
<ul>
<li><b>Counts:</b> auxiliary arrays/maps/sets you allocate; the recursion call stack (each frame holds locals + return address).</li>
<li><b>Usually excluded:</b> the input itself; the output array (some interviewers ask for "extra space excluding output").</li>
</ul>
<pre><code>// O(n) space: recursion stack is n deep on a skewed tree / linked list
function sumList(node){ return node ? node.val + sumList(node.next) : 0; }

// O(1) space: same result, iterative
function sumListIter(node){ let s = 0; while (node){ s += node.val; node = node.next; } return s; }</code></pre>

<h2>How to talk about it in an interview</h2>
<ol>
<li>State the brute force and its complexity immediately ("nested loop, O(n²) time, O(1) space").</li>
<li>Name the bottleneck ("the repeated inner scan").</li>
<li>Propose the improvement and its new complexity ("hash the complements → O(n) time, O(n) space").</li>
<li>Call out the space/time tradeoff explicitly.</li>
<li>After coding, re-derive the complexity out loud from the final code.</li>
</ol>`,
      pitfalls: [
        "Forgetting the recursion stack in space analysis (a recursive DFS on a skewed tree is O(n) space, not O(1)).",
        "Saying O(n) when there's a hidden `.includes()` / `indexOf` / `in` on an array inside a loop — that's O(n²).",
        "Treating `Array.sort` / building a sorted structure as free — it's O(n log n).",
        "Confusing 'average case' with 'amortized' — average is over random inputs, amortized is over a sequence of ops on any input.",
        "Assuming hash operations are O(1) worst-case (they're O(n) worst-case; O(1) average).",
        "Analyzing only the happy path when the worst case is what breaks the constraints.",
      ],
      interviewQs: [
        "What's the time and space complexity of your solution, and can you do better?",
        "Why is HashMap lookup O(1) average but O(n) worst case?",
        "Explain amortized O(1) for dynamic array append.",
        "Given n ≤ 20, what complexity are they hinting you can afford?",
        "Difference between O(n) auxiliary space and O(1) in-place here?",
      ],
    },

    {
      id: "dsa-arrays",
      title: "Arrays & Strings",
      tags: ["arrays", "strings", "fundamentals"],
      brushup: [
        "Contiguous memory ⇒ O(1) random access by index, O(n) insert/delete in the middle (shift).",
        "Dynamic array: amortized O(1) append, O(n) worst-case (resize + copy).",
        "Prefix sums: precompute so any range sum is O(1). <code>pre[i+1] = pre[i] + a[i]</code>; rangeSum(l,r) = pre[r+1] − pre[l].",
        "Difference array: range-update in O(1), then one prefix-sum pass to materialize.",
        "In-place tricks: reverse, cyclic rotation (reverse 3×), Dutch-national-flag 3-way partition, cyclic sort for 1..n.",
        "Strings are immutable in JS/Java — build with an array + join, not <code>+=</code> in a loop (O(n²)).",
        "Kadane's algorithm: max subarray sum in O(n).",
        "Sorting first often unlocks two-pointer / greedy / dedup solutions (cost: O(n log n)).",
      ],
      detail: `
<h2>Memory model & why operations cost what they do</h2>
<p>An array is a single contiguous block. Element <code>i</code> lives at <code>base + i · elementSize</code>, so indexing is one multiply-add: O(1). That contiguity is also why arrays are <b>cache-friendly</b> — reading <code>a[i]</code> pulls a whole 64-byte line into cache, so <code>a[i+1..i+15]</code> are then free. This is why an O(n²) array algorithm can beat an O(n) pointer-chasing one for small n.</p>
<p>The cost is structural change: inserting at index 0 shifts every element right by one — O(n). Deleting is the same. So <code>arr.shift()</code>, <code>arr.unshift()</code>, and <code>arr.splice(i, …)</code> are O(n); <code>push</code>/<code>pop</code> are O(1) amortized.</p>

<h2>Prefix sums</h2>
<p>Precompute cumulative sums once; then any subarray sum is a subtraction.</p>
<pre><code>const pre = [0];
for (let i = 0; i &lt; a.length; i++) pre.push(pre[i] + a[i]);
const rangeSum = (l, r) =&gt; pre[r + 1] - pre[l];   // sum of a[l..r] inclusive, O(1)</code></pre>
<p>Extensions: <b>2D prefix sums</b> (submatrix sum in O(1) via inclusion-exclusion), <b>prefix XOR</b> (range XOR, "count subarrays with XOR = k"), <b>prefix count</b> + hashmap ("number of subarrays summing to k", even with negatives — the sliding window can't do that).</p>
<pre><code>// count subarrays with sum === k  (handles negatives)
function subarraySum(nums, k){
  const seen = new Map([[0, 1]]);   // prefix sum 0 seen once
  let sum = 0, count = 0;
  for (const x of nums){
    sum += x;
    count += seen.get(sum - k) || 0;
    seen.set(sum, (seen.get(sum) || 0) + 1);
  }
  return count;
}</code></pre>

<h2>Difference array (range updates)</h2>
<pre><code>// apply many "+v to a[l..r]" updates in O(1) each, then rebuild in O(n)
const diff = new Array(n + 1).fill(0);
for (const [l, r, v] of updates){ diff[l] += v; diff[r + 1] -= v; }
const res = []; let run = 0;
for (let i = 0; i &lt; n; i++){ run += diff[i]; res.push(run); }</code></pre>

<h2>Kadane's algorithm (max subarray sum)</h2>
<pre><code>function maxSubArray(a){
  let best = a[0], cur = a[0];
  for (let i = 1; i &lt; a.length; i++){
    cur = Math.max(a[i], cur + a[i]);   // extend the run, or restart at a[i]
    best = Math.max(best, cur);
  }
  return best;
}</code></pre>
<p>Intuition: a prefix with negative sum can only <em>hurt</em> whatever follows, so the moment your running sum goes negative you throw it away and start fresh. To also return the indices, record where <code>cur</code> restarted.</p>

<h2>In-place rotation by k</h2>
<pre><code>function rotate(a, k){
  k %= a.length;
  const rev = (i, j) =&gt; { while (i &lt; j) { [a[i], a[j]] = [a[j], a[i]]; i++; j--; } };
  rev(0, a.length - 1);   // reverse all
  rev(0, k - 1);          // reverse first k
  rev(k, a.length - 1);   // reverse the rest
}</code></pre>

<h2>Dutch National Flag (3-way partition)</h2>
<p>Sort an array of 0s/1s/2s (or partition around a pivot) in one pass, O(1) space:</p>
<pre><code>function sortColors(a){
  let low = 0, mid = 0, high = a.length - 1;
  while (mid &lt;= high){
    if (a[mid] === 0) { [a[low], a[mid]] = [a[mid], a[low]]; low++; mid++; }
    else if (a[mid] === 1) mid++;
    else { [a[mid], a[high]] = [a[high], a[mid]]; high--; }   // don't advance mid
  }
}</code></pre>

<h2>Cyclic sort (values are 1..n)</h2>
<p>When an array holds a permutation of 1..n (or 0..n−1), you can sort it in O(n) by repeatedly swapping each value to its correct index. Powers "find the missing / duplicate / first missing positive" in O(1) space.</p>
<pre><code>let i = 0;
while (i &lt; n){
  const correct = a[i] - 1;
  if (a[i] &gt;= 1 &amp;&amp; a[i] &lt;= n &amp;&amp; a[i] !== a[correct]) [a[i], a[correct]] = [a[correct], a[i]];
  else i++;
}</code></pre>

<h2>Strings</h2>
<p>Treat a string as a read-only char array. Because strings are immutable, <b>never build one with <code>+=</code> in a loop</b> — each concat copies the whole prefix, making it O(n²). Push chars into an array and <code>join('')</code> at the end.</p>
<p>Frequency counting with a 26-length array (or a Map) handles anagrams, permutations-in-a-window, "first unique character", "can form palindrome" (≤ 1 odd count). For substring search beyond brute force, know that <b>KMP</b> and <b>Rabin–Karp</b> exist and run in O(n + m); rolling hashes also power "longest duplicate substring".</p>
<pre><code>// group anagrams: key by sorted letters (or by a 26-count signature)
function groupAnagrams(words){
  const groups = new Map();
  for (const w of words){
    const key = [...w].sort().join('');
    (groups.get(key) || groups.set(key, []).get(key)).push(w);
  }
  return [...groups.values()];
}</code></pre>

<h2>How to recognize array/string problems</h2>
<ul>
<li>"Sum / count over every subarray" → prefix sums (+ hashmap if negatives or a target count).</li>
<li>"Many range updates then query" → difference array or a Fenwick/segment tree.</li>
<li>"Values are bounded 1..n" → cyclic sort or index-as-hash (negate <code>a[abs(x)-1]</code>).</li>
<li>"Rearrange / partition in place, O(1) space" → two/three pointers.</li>
<li>"Contiguous window with a constraint" → sliding window (see that topic).</li>
</ul>`,
      pitfalls: [
        "`arr.splice` / `shift` / `unshift` inside a loop turns O(n) into O(n²).",
        "String concatenation in a loop is O(n²) — accumulate in an array and join once.",
        "Off-by-one on inclusive vs exclusive bounds in prefix sums (`pre[r+1] - pre[l]`).",
        "Mutating an array while iterating it (indices shift under you).",
        "Sliding window on 'subarray sum = k' when the array has negatives — it breaks; use prefix sum + hashmap.",
        "Forgetting `k %= n` before rotating (k can exceed length).",
      ],
      interviewQs: [
        "Maximum subarray sum, and return the actual subarray.",
        "Subarray sum equals K — count them (with negatives).",
        "Product of array except self, without division, O(n).",
        "Move zeroes to the end in-place, preserving order.",
        "Rotate an array by k in O(1) extra space.",
        "First missing positive integer in O(n) time, O(1) space.",
      ],
    },

    {
      id: "dsa-hashing",
      title: "Hashing — Maps & Sets",
      tags: ["hashing", "fundamentals"],
      brushup: [
        "Hash table = array of buckets + hash function; average O(1) insert/lookup/delete.",
        "Collisions: separate chaining (list/tree per bucket) or open addressing (linear/quadratic probing, double hashing).",
        "Load factor α = entries / buckets; kept low by resizing (rehash everything, amortized O(1)).",
        "Worst case O(n) if every key collides (bad hash / adversarial input). Java 8 upgrades a long bucket to a red-black tree ⇒ O(log n).",
        "Use a Set for membership, a Map for key→value, a Map&lt;key,count&gt; for frequency, a Map&lt;key,list&gt; for grouping.",
        "Trade space for time: precompute a lookup table to turn an O(n²) scan into O(n).",
        "JS: plain object keys are stringified — use <code>Map</code> for non-string keys and to preserve insertion order.",
        "For sorted order / range queries / floor-ceil, use a balanced BST (TreeMap), not a hash map.",
      ],
      detail: `
<h2>How a hash table works</h2>
<p>A hash function maps an arbitrary key to an integer, which is reduced (mod bucket-count) to a bucket index. If the hash spreads keys uniformly, each bucket holds ~α entries and all operations are O(1 + α) ≈ O(1).</p>
<h3>Collision resolution</h3>
<ul>
<li><b>Separate chaining</b>: each bucket is a linked list (or tree). Simple, tolerates α &gt; 1, but pointer overhead and poor cache locality.</li>
<li><b>Open addressing</b>: all entries live in the bucket array itself; on collision, probe for the next free slot (linear: i+1, i+2…; quadratic: i+1, i+4, i+9…; double hashing: step by a second hash). Cache-friendly, no pointers, but degrades sharply as α → 1 and deletions need tombstones.</li>
</ul>
<h3>Resizing</h3>
<p>When α exceeds a threshold (~0.75), the table allocates a bigger bucket array (usually 2×) and re-inserts every entry (rehash). A single insert can thus be O(n), but across n inserts the total is O(n) ⇒ <b>amortized O(1)</b>. Latency-sensitive systems pre-size the map or use incremental rehashing (Redis) to avoid the spike.</p>
<h3>Why worst case is O(n)</h3>
<p>If all keys hash to one bucket (pathological input, or an attacker crafting keys — "hash flooding" DoS), every operation walks the whole chain. Mitigations: randomized hash seeds (SipHash), and tree-ifying long buckets (Java) so it's O(log n) instead of O(n).</p>

<h2>The canonical pattern: complement / seen-before lookup</h2>
<pre><code>// Two Sum in O(n): map each value to its index as you scan
function twoSum(nums, target){
  const seen = new Map();
  for (let i = 0; i &lt; nums.length; i++){
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);        // insert AFTER checking ⇒ never pair an element with itself
  }
  return [];
}</code></pre>

<h2>Frequency map</h2>
<pre><code>function firstUniqChar(s){
  const f = new Map();
  for (const c of s) f.set(c, (f.get(c) || 0) + 1);
  for (let i = 0; i &lt; s.length; i++) if (f.get(s[i]) === 1) return i;
  return -1;
}</code></pre>

<h2>Grouping</h2>
<pre><code>// group by a derived key
const groups = new Map();
for (const item of items){
  const k = keyOf(item);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(item);
}</code></pre>

<h2>Longest consecutive sequence — a subtle O(n) use</h2>
<pre><code>function longestConsecutive(nums){
  const set = new Set(nums);
  let best = 0;
  for (const x of set){
    if (set.has(x - 1)) continue;          // only start counting from a sequence's left end
    let len = 1;
    while (set.has(x + len)) len++;
    best = Math.max(best, len);
  }
  return best;
}</code></pre>
<p>Looks like it could be O(n²), but the inner <code>while</code> runs only for sequence-starts and each element is visited once across all sequences ⇒ O(n).</p>

<h2>When NOT to use a hash map</h2>
<table>
<tr><th>Need</th><th>Use instead</th></tr>
<tr><td>Sorted iteration, range queries, floor/ceiling of a key</td><td>Balanced BST / TreeMap / skip list</td></tr>
<tr><td>Keys are a small bounded integer range</td><td>Plain array indexed by the key (faster, no hashing)</td></tr>
<tr><td>Prefix / autocomplete queries on strings</td><td>Trie</td></tr>
<tr><td>Approximate membership, huge set, memory-bound</td><td>Bloom filter</td></tr>
<tr><td>Predictable worst-case latency (real-time)</td><td>Perfect hashing or a tree</td></tr>
</table>

<h2>Hashing your own composite keys</h2>
<p>To key a map by a pair/tuple in JS, serialize deterministically: <code>seen.set(r + ',' + c, …)</code> for grid coords, or <code>JSON.stringify</code> for small objects. In Java, implement <code>hashCode</code> and <code>equals</code> together (unequal-consistent) or use a record. A common bug: <code>hashCode</code> using a mutable field, then mutating the key after insertion — it's now unfindable.</p>`,
      pitfalls: [
        "Relying on iteration order — JS `Map` preserves insertion order, plain objects mostly do, but a `Set`/`Map` is not sorted.",
        "Using an array or object as a plain-object key — it collapses to \"[object Object]\". Use `Map`.",
        "Mutating a key (or a field its hashCode depends on) after inserting it.",
        "Assuming O(1) worst-case in a latency-critical path — it's O(n) worst-case.",
        "`obj[key]` where key collides with a prototype property (`__proto__`, `constructor`) — use `Map` or `Object.create(null)`.",
        "Counting with `map[k]++` when `map[k]` is undefined ⇒ NaN. Initialize with `|| 0`.",
      ],
      interviewQs: [
        "Two Sum / 3Sum / 4Sum — how does hashing help each?",
        "Group anagrams together.",
        "Longest consecutive sequence in O(n).",
        "First non-repeating character in a stream.",
        "Subarray sum equals K (count).",
        "How is a HashMap implemented, and why is worst case O(n)?",
      ],
    },

    {
      id: "dsa-twopointers",
      title: "Two Pointers & Sliding Window",
      tags: ["patterns", "arrays", "strings"],
      brushup: [
        "Converging pointers: sorted array, pair/triplet sum, palindrome check, container-with-most-water.",
        "Fast/slow pointers: cycle detection, middle of list, k-th from end, happy number.",
        "Fixed-size sliding window: add the entering element, remove the leaving one each step.",
        "Variable sliding window: expand right greedily; while the window is invalid, shrink from the left.",
        "Window state: a running sum/product, a frequency map, a count of distinct/violating elements, or a monotonic deque.",
        "Turns many O(n²) brute forces into O(n) because each index enters and leaves the window at most once.",
        "Sliding window needs <b>monotonic</b> validity — shrinking must be able to restore a valid window. Negatives often break this.",
      ],
      detail: `
<h2>Two pointers on a sorted array (converging)</h2>
<pre><code>function pairSumSorted(a, target){
  let i = 0, j = a.length - 1;
  while (i &lt; j){
    const s = a[i] + a[j];
    if (s === target) return [i, j];
    s &lt; target ? i++ : j--;      // too small ⇒ need a bigger left; too big ⇒ smaller right
  }
  return [];
}</code></pre>
<p>Why it's correct: at each step, moving the pointer that makes the sum "worse in the wrong direction" can only discard pairs that couldn't have worked. Every pair is implicitly considered ⇒ O(n).</p>

<h3>3Sum (sort + fix one + two pointers)</h3>
<pre><code>function threeSum(nums){
  nums.sort((a, b) =&gt; a - b);
  const res = [];
  for (let i = 0; i &lt; nums.length - 2; i++){
    if (i &gt; 0 &amp;&amp; nums[i] === nums[i - 1]) continue;   // skip duplicate anchor
    if (nums[i] &gt; 0) break;
    let l = i + 1, r = nums.length - 1;
    while (l &lt; r){
      const s = nums[i] + nums[l] + nums[r];
      if (s === 0){
        res.push([nums[i], nums[l], nums[r]]);
        while (l &lt; r &amp;&amp; nums[l] === nums[l + 1]) l++;
        while (l &lt; r &amp;&amp; nums[r] === nums[r - 1]) r--;
        l++; r--;
      } else if (s &lt; 0) l++; else r--;
    }
  }
  return res;
}</code></pre>

<h2>Fast / slow pointers (Floyd's cycle detection)</h2>
<pre><code>function hasCycle(head){
  let slow = head, fast = head;
  while (fast &amp;&amp; fast.next){
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;   // pointers meet inside the loop
  }
  return false;                       // fast reached the end ⇒ no cycle
}</code></pre>
<p>To find the cycle's <b>start</b>: after they meet, reset one pointer to head and advance both by 1; they meet at the entry node. (Math: distance from head to entry equals distance from meeting point to entry, modulo the loop length.)</p>
<p>Same trick finds the <b>middle</b> (slow is at the middle when fast hits the end) and the <b>k-th from the end</b> (advance one pointer k steps first, then move both).</p>

<h2>Sliding window — fixed size</h2>
<pre><code>// max sum of any window of size k
function maxSumK(a, k){
  let sum = 0;
  for (let i = 0; i &lt; k; i++) sum += a[i];
  let best = sum;
  for (let i = k; i &lt; a.length; i++){
    sum += a[i] - a[i - k];      // slide: add new, drop old
    best = Math.max(best, sum);
  }
  return best;
}</code></pre>

<h2>Sliding window — variable size</h2>
<pre><code>// smallest subarray with sum ≥ target (positive numbers)
function minSubArrayLen(target, nums){
  let start = 0, sum = 0, best = Infinity;
  for (let end = 0; end &lt; nums.length; end++){
    sum += nums[end];
    while (sum &gt;= target){                  // window valid ⇒ try to shrink
      best = Math.min(best, end - start + 1);
      sum -= nums[start++];
    }
  }
  return best === Infinity ? 0 : best;
}</code></pre>
<p>General template:</p>
<pre><code>let start = 0;
for (let end = 0; end &lt; n; end++){
  add(s[end]);                         // include the new element
  while (windowInvalid()){             // or: while (windowValid()) for "shrink to best"
    remove(s[start]); start++;
  }
  updateAnswer(end - start + 1);
}</code></pre>

<h3>Longest substring without repeating characters</h3>
<pre><code>function lengthOfLongestSubstring(s){
  const last = new Map();
  let start = 0, best = 0;
  for (let end = 0; end &lt; s.length; end++){
    const c = s[end];
    if (last.has(c) &amp;&amp; last.get(c) &gt;= start) start = last.get(c) + 1;
    last.set(c, end);
    best = Math.max(best, end - start + 1);
  }
  return best;
}</code></pre>

<h3>"At most K distinct" ↔ "exactly K distinct"</h3>
<p>A useful identity: <code>exactly(K) = atMost(K) − atMost(K−1)</code>. Many "exactly K" window problems (subarrays with exactly K distinct integers, exactly K odd numbers) are easier as two "at most" sliding windows.</p>

<h2>Monotonic deque (sliding window maximum)</h2>
<pre><code>function maxSlidingWindow(nums, k){
  const dq = [];       // holds indices, values decreasing front→back
  const res = [];
  for (let i = 0; i &lt; nums.length; i++){
    while (dq.length &amp;&amp; nums[dq[dq.length - 1]] &lt;= nums[i]) dq.pop();
    dq.push(i);
    if (dq[0] &lt;= i - k) dq.shift();          // drop indices that fell out of the window
    if (i &gt;= k - 1) res.push(nums[dq[0]]);
  }
  return res;
}</code></pre>

<h2>When each applies</h2>
<table>
<tr><th>Signal</th><th>Technique</th></tr>
<tr><td>Sorted array, find pair/triplet with a property</td><td>Converging two pointers</td></tr>
<tr><td>Linked list: cycle, middle, n-th from end</td><td>Fast/slow pointers</td></tr>
<tr><td>Longest/shortest contiguous window meeting a constraint</td><td>Variable sliding window</td></tr>
<tr><td>Every window of a fixed size k</td><td>Fixed sliding window</td></tr>
<tr><td>Window min/max as it slides</td><td>Monotonic deque</td></tr>
<tr><td>Subarray sum = k with negatives present</td><td>NOT sliding window — prefix sum + hashmap</td></tr>
</table>`,
      pitfalls: [
        "Sliding window on non-monotonic validity (negatives in 'subarray sum = k') — use prefix sums + hashmap.",
        "Updating the answer at the wrong moment — before vs after shrinking changes the result.",
        "Fast pointer null checks: test `fast && fast.next` before `fast.next.next`.",
        "Letting `start` move backward in 'longest substring' — clamp with `max(start, lastIndex + 1)`.",
        "Forgetting to skip duplicates in sorted-array multi-sum problems ⇒ duplicate results.",
        "Using `dq.shift()` on a plain array in a hot monotonic-deque loop (O(n) shift) for very large n.",
      ],
      interviewQs: [
        "Minimum window substring containing all characters of T.",
        "Longest substring with at most K distinct characters.",
        "3Sum / 3Sum Closest.",
        "Container with most water.",
        "Find the node where a linked-list cycle begins.",
        "Sliding window maximum.",
        "Subarrays with exactly K distinct integers.",
      ],
    },

    {
      id: "dsa-stackqueue",
      title: "Stack & Queue",
      tags: ["fundamentals", "linear"],
      brushup: [
        "Stack = LIFO. Uses: undo, call stack / recursion→iteration, expression parsing & evaluation, DFS, backtracking, 'next greater' (monotonic stack), histogram problems.",
        "Queue = FIFO. Uses: BFS, level-order traversal, scheduling, buffering, rate limiting, producer–consumer.",
        "Deque = insert/remove both ends in O(1); powers sliding-window-maximum and 0-1 BFS.",
        "Monotonic stack: keep the stack increasing or decreasing to answer 'nearest greater/smaller element' in O(n) total.",
        "Min-stack: push (value, currentMin) pairs to get O(1) getMin.",
        "JS: array push/pop = stack; push/shift = queue but `shift` is O(n) — use an index pointer or a real deque for hot loops.",
        "Queue from two stacks: amortized O(1) per op (in-stack + out-stack, move only when out is empty).",
      ],
      detail: `
<h2>Stack applications</h2>
<h3>Balanced brackets</h3>
<pre><code>function isValid(s){
  const st = [], pair = { ')': '(', ']': '[', '}': '{' };
  for (const c of s){
    if (c in pair){ if (st.pop() !== pair[c]) return false; }
    else st.push(c);
  }
  return st.length === 0;
}</code></pre>
<h3>Evaluate Reverse Polish Notation</h3>
<pre><code>function evalRPN(tokens){
  const st = [];
  for (const t of tokens){
    if ("+-*/".includes(t) &amp;&amp; t.length === 1){
      const b = st.pop(), a = st.pop();
      st.push(t === '+' ? a+b : t === '-' ? a-b : t === '*' ? a*b : Math.trunc(a/b));
    } else st.push(Number(t));
  }
  return st.pop();
}</code></pre>
<h3>Min-stack (O(1) getMin)</h3>
<pre><code>class MinStack {
  constructor(){ this.st = []; }             // each item: [value, minSoFar]
  push(x){
    const min = this.st.length ? Math.min(x, this.st[this.st.length-1][1]) : x;
    this.st.push([x, min]);
  }
  pop(){ this.st.pop(); }
  top(){ return this.st[this.st.length-1][0]; }
  getMin(){ return this.st[this.st.length-1][1]; }
}</code></pre>

<h2>Monotonic stack</h2>
<p>Keep the stack sorted (say strictly decreasing by value). When a new element breaks the order, pop the smaller elements — for each popped element, the new element is its "next greater". Each index is pushed and popped once ⇒ O(n) despite the nested <code>while</code>.</p>
<pre><code>// next greater element to the right (indices)
function nextGreater(nums){
  const res = new Array(nums.length).fill(-1);
  const st = [];                              // indices, values decreasing
  for (let i = 0; i &lt; nums.length; i++){
    while (st.length &amp;&amp; nums[st[st.length - 1]] &lt; nums[i]) res[st.pop()] = nums[i];
    st.push(i);
  }
  return res;
}</code></pre>
<p>Direction & strictness matter:</p>
<table>
<tr><th>Question</th><th>Stack keeps</th><th>Scan</th></tr>
<tr><td>Next greater to the right</td><td>decreasing</td><td>left → right</td></tr>
<tr><td>Previous greater to the left</td><td>decreasing</td><td>left → right, answer on push</td></tr>
<tr><td>Next smaller to the right</td><td>increasing</td><td>left → right</td></tr>
</table>
<h3>Largest rectangle in a histogram</h3>
<p>For each bar, the maximal rectangle using it as the height extends left to the previous shorter bar and right to the next shorter bar — exactly what a monotonic (increasing) stack gives you in O(n). "Maximal rectangle" in a binary matrix reduces to running this per row.</p>

<h2>Queue & BFS</h2>
<pre><code>function bfs(start, neighbors){
  const q = [start], seen = new Set([start]);
  let head = 0;                               // index pointer avoids O(n) shift()
  while (head &lt; q.length){
    const node = q[head++];
    for (const nb of neighbors(node)){
      if (!seen.has(nb)){ seen.add(nb); q.push(nb); }
    }
  }
}</code></pre>
<p>Mark <code>seen</code> when you <b>enqueue</b>, not when you dequeue — otherwise the same node gets pushed multiple times before it's processed.</p>

<h2>Queue from two stacks (amortized O(1))</h2>
<pre><code>class Queue {
  constructor(){ this.inS = []; this.outS = []; }
  enqueue(x){ this.inS.push(x); }
  dequeue(){
    if (!this.outS.length) while (this.inS.length) this.outS.push(this.inS.pop());
    return this.outS.pop();
  }
}</code></pre>
<p>Each element is moved from <code>inS</code> to <code>outS</code> exactly once, so n operations cost O(n) total.</p>

<h2>Recursion ↔ explicit stack</h2>
<p>Any recursive algorithm can be made iterative with an explicit stack holding the "frames" (state + which child to visit next). Do this when recursion depth could overflow the call stack (deep trees, long lists), or when you need to pause/resume traversal.</p>`,
      pitfalls: [
        "Using `array.shift()` for a queue in a tight loop — O(n) per call, O(n²) total.",
        "Popping an empty stack — guard with `st.length`.",
        "Monotonic stack: wrong order (increasing vs decreasing) or wrong strictness (`<` vs `<=`) for the question — handles ties incorrectly.",
        "BFS marking visited on dequeue instead of enqueue ⇒ duplicates, blown-up queue.",
        "Min-stack that stores only the global min without history — pop breaks it.",
        "Forgetting integer-truncation-toward-zero semantics in RPN division.",
      ],
      interviewQs: [
        "Valid parentheses / min add to make valid / longest valid parentheses.",
        "Daily temperatures — days until a warmer day.",
        "Next greater element I & II (circular).",
        "Largest rectangle in histogram; maximal rectangle in a matrix.",
        "Implement a queue using stacks and analyze amortized cost.",
        "Min stack with O(1) getMin.",
        "Evaluate an arithmetic expression with +−×÷ and parentheses.",
      ],
    },

    {
      id: "dsa-linkedlist",
      title: "Linked Lists",
      tags: ["fundamentals", "pointers"],
      brushup: [
        "Node = value + next (doubly linked also has prev). O(1) insert/delete given the node; O(n) to reach position i.",
        "vs arrays: no random access, extra pointer memory, poor cache locality — but O(1) splice and no resize.",
        "Core tricks: dummy head node, reverse via 3 pointers, fast/slow for middle & cycle, merge two sorted lists, in-place partition.",
        "Reverse: <code>prev=null; while(cur){ next=cur.next; cur.next=prev; prev=cur; cur=next; } return prev;</code>",
        "Use a dummy node whenever the head might change (deletion at head, merge, partition) to avoid special cases.",
        "Always save <code>cur.next</code> before you rewire <code>cur.next</code>.",
        "Cycle start: after slow/fast meet, move one pointer to head, advance both by 1, they meet at the entry.",
      ],
      detail: `
<h2>When a linked list actually helps</h2>
<p>Arrays win almost always in practice (cache locality, no per-node allocation). Linked lists earn their place when you need <b>O(1) insertion/removal at a known position</b> without shifting — e.g. an LRU cache's recency list, a free list in an allocator, an intrusive queue, or when you can't afford the amortized O(n) copy of a growing array (real-time systems). They're a favorite interview topic because pointer manipulation exposes bugs.</p>

<h2>Reverse a linked list</h2>
<pre><code>function reverse(head){
  let prev = null, cur = head;
  while (cur){
    const next = cur.next;   // 1. save
    cur.next = prev;         // 2. rewire
    prev = cur;              // 3. advance prev
    cur = next;              // 4. advance cur
  }
  return prev;               // new head
}</code></pre>
<p>Recursive version (O(n) stack): reverse the tail, then <code>head.next.next = head; head.next = null;</code>.</p>

<h2>Dummy node pattern</h2>
<pre><code>// remove all nodes with a given value
function removeElements(head, val){
  const dummy = { next: head };
  let cur = dummy;
  while (cur.next){
    if (cur.next.val === val) cur.next = cur.next.next;   // skip it
    else cur = cur.next;
  }
  return dummy.next;   // correct even if the original head was removed
}</code></pre>

<h2>Merge two sorted lists</h2>
<pre><code>function mergeTwoLists(a, b){
  const dummy = { next: null };
  let tail = dummy;
  while (a &amp;&amp; b){
    if (a.val &lt;= b.val){ tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = a || b;      // attach the remainder
  return dummy.next;
}</code></pre>
<p>Merge <b>k</b> sorted lists: pairwise-merge in a tournament (O(N log k)) or use a min-heap of the k current heads (O(N log k)).</p>

<h2>Fast / slow: middle, cycle, palindrome</h2>
<pre><code>function middle(head){
  let slow = head, fast = head;
  while (fast &amp;&amp; fast.next){ slow = slow.next; fast = fast.next.next; }
  return slow;   // for even length, this is the second middle
}

// is the list a palindrome? find middle → reverse second half → compare
function isPalindrome(head){
  let slow = head, fast = head;
  while (fast &amp;&amp; fast.next){ slow = slow.next; fast = fast.next.next; }
  let second = reverse(slow), p = head;
  while (second){ if (p.val !== second.val) return false; p = p.next; second = second.next; }
  return true;
}</code></pre>

<h2>Remove N-th node from the end in one pass</h2>
<pre><code>function removeNthFromEnd(head, n){
  const dummy = { next: head };
  let fast = dummy, slow = dummy;
  for (let i = 0; i &lt; n; i++) fast = fast.next;   // gap of n
  while (fast.next){ fast = fast.next; slow = slow.next; }
  slow.next = slow.next.next;
  return dummy.next;
}</code></pre>

<h2>Reverse nodes in k-group (harder, common)</h2>
<pre><code>function reverseKGroup(head, k){
  let node = head, count = 0;
  while (node &amp;&amp; count &lt; k){ node = node.next; count++; }
  if (count &lt; k) return head;             // fewer than k left ⇒ leave as-is
  let prev = reverseKGroup(node, k);      // recurse on the rest first
  let cur = head;
  for (let i = 0; i &lt; k; i++){
    const next = cur.next;
    cur.next = prev;
    prev = cur;
    cur = next;
  }
  return prev;
}</code></pre>

<h2>Deep-copy a list with random pointers</h2>
<p>Two passes with a <code>Map&lt;oldNode, newNode&gt;</code>: first create all clones, then wire <code>clone.next</code> and <code>clone.random</code> by lookup. Or the O(1)-space interleaving trick (weave clones between originals, set randoms, then unweave).</p>`,
      pitfalls: [
        "Losing the rest of the list — always save `next` before reassigning `cur.next`.",
        "Not handling empty list / single node / removing the head.",
        "Accidentally creating a cycle when reversing a sublist (tail still points forward).",
        "Returning `head` when the head was deleted — return `dummy.next`.",
        "Off-by-one in fast/slow gaps (`removeNthFromEnd` needs the gap set on the dummy, not head).",
        "Comparing nodes by value when you need identity (cycle detection uses `===` on nodes).",
      ],
      interviewQs: [
        "Reverse a linked list (iterative and recursive).",
        "Detect a cycle and return the node where it starts.",
        "Merge two / k sorted lists.",
        "Remove the N-th node from the end in one pass.",
        "Reorder list (L0→Ln→L1→Ln-1→…).",
        "Reverse nodes in k-group.",
        "Copy a list with random pointers.",
        "Add two numbers represented as linked lists.",
      ],
    },

    {
      id: "dsa-recursion",
      title: "Recursion & Backtracking",
      tags: ["patterns", "recursion"],
      brushup: [
        "Every recursion = base case(s) + a recursive step that provably moves toward a base case.",
        "Trust the recursion: assume the recursive call is correct for smaller input, then combine.",
        "Recursion tree depth = stack space. Deep linear recursion (~10⁴–10⁵ frames) can stack-overflow.",
        "Backtracking = DFS over a decision tree: choose → recurse → un-choose (restore state).",
        "Prune early: bounds checks, sort + skip duplicates, feasibility cutoffs — turns exponential into tractable.",
        "Counts to estimate feasibility: subsets 2ⁿ, permutations n!, combinations C(n,k), Catalan for balanced structures.",
        "Escape hatches: memoization (→ DP), convert to iteration with an explicit stack, tail-call rewriting.",
      ],
      detail: `
<h2>The mindset: "leap of faith"</h2>
<p>Don't trace the whole call tree in your head. Define what the function returns for input of size n, assume it already works for n−1 (or n/2), and write the one step that builds the size-n answer from smaller answers. If the base case is right and the step is right, induction does the rest.</p>
<pre><code>// count the leaves of a binary tree
function leaves(node){
  if (!node) return 0;                       // base
  if (!node.left &amp;&amp; !node.right) return 1;    // base
  return leaves(node.left) + leaves(node.right);   // trust the calls
}</code></pre>

<h2>Recurrences → complexity</h2>
<table>
<tr><th>Recurrence</th><th>Solves to</th><th>Example</th></tr>
<tr><td>T(n) = T(n−1) + O(1)</td><td>O(n)</td><td>list length, factorial</td></tr>
<tr><td>T(n) = T(n−1) + O(n)</td><td>O(n²)</td><td>selection/insertion-style</td></tr>
<tr><td>T(n) = 2T(n−1) + O(1)</td><td>O(2ⁿ)</td><td>naive Fibonacci, Tower of Hanoi</td></tr>
<tr><td>T(n) = 2T(n/2) + O(n)</td><td>O(n log n)</td><td>merge sort</td></tr>
<tr><td>T(n) = T(n/2) + O(1)</td><td>O(log n)</td><td>binary search</td></tr>
</table>

<h2>Backtracking template</h2>
<pre><code>function backtrack(state){
  if (isComplete(state)){ record(state); return; }
  for (const choice of choicesFrom(state)){
    if (!isValid(state, choice)) continue;   // prune
    apply(state, choice);                    // choose
    backtrack(state);                        // explore
    undo(state, choice);                     // un-choose  ← the crucial line
  }
}</code></pre>

<h3>Subsets (2ⁿ)</h3>
<pre><code>function subsets(nums){
  const res = [], path = [];
  function dfs(i){
    if (i === nums.length){ res.push([...path]); return; }   // copy!
    dfs(i + 1);                       // skip nums[i]
    path.push(nums[i]);
    dfs(i + 1);                       // take nums[i]
    path.pop();
  }
  dfs(0);
  return res;
}</code></pre>

<h3>Permutations (n!)</h3>
<pre><code>function permute(nums){
  const res = [], path = [], used = new Array(nums.length).fill(false);
  function dfs(){
    if (path.length === nums.length){ res.push([...path]); return; }
    for (let i = 0; i &lt; nums.length; i++){
      if (used[i]) continue;
      used[i] = true; path.push(nums[i]);
      dfs();
      used[i] = false; path.pop();
    }
  }
  dfs();
  return res;
}</code></pre>

<h3>Combinations & duplicate handling</h3>
<pre><code>// combination sum II — each number used once, no duplicate combos
function combinationSum2(candidates, target){
  candidates.sort((a, b) =&gt; a - b);
  const res = [], path = [];
  function dfs(start, remain){
    if (remain === 0){ res.push([...path]); return; }
    for (let i = start; i &lt; candidates.length; i++){
      if (i &gt; start &amp;&amp; candidates[i] === candidates[i - 1]) continue;   // skip dup at same depth
      if (candidates[i] &gt; remain) break;                               // prune (sorted)
      path.push(candidates[i]);
      dfs(i + 1, remain - candidates[i]);
      path.pop();
    }
  }
  dfs(0, target);
  return res;
}</code></pre>

<h2>Pruning strategies</h2>
<ul>
<li><b>Sort + break</b>: once a choice exceeds the remaining budget, all later (larger) choices fail too.</li>
<li><b>Skip duplicates at the same tree level</b>: <code>if (i &gt; start &amp;&amp; a[i] === a[i-1]) continue;</code></li>
<li><b>Constraint propagation</b>: N-Queens tracks attacked columns/diagonals as sets so validity is O(1).</li>
<li><b>Bound function</b>: estimate the best possible completion; abandon if it can't beat the current best (branch &amp; bound).</li>
</ul>

<h2>Recursion → iteration</h2>
<pre><code>// iterative inorder traversal with an explicit stack
function inorder(root){
  const res = [], st = [];
  let node = root;
  while (node || st.length){
    while (node){ st.push(node); node = node.left; }
    node = st.pop();
    res.push(node.val);
    node = node.right;
  }
  return res;
}</code></pre>
<p>Do this when depth risks a stack overflow, or when the platform lacks tail-call optimization (most JS engines don't apply it).</p>

<h2>Memoization turns recursion into DP</h2>
<pre><code>function fib(n, memo = new Map()){
  if (n &lt; 2) return n;
  if (memo.has(n)) return memo.get(n);
  const v = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, v);
  return v;
}
// O(2^n) → O(n) once each subproblem is computed once</code></pre>`,
      pitfalls: [
        "Pushing `path` (a reference) into results instead of a copy `[...path]` — every result ends up the same array.",
        "Forgetting to undo state after the recursive call (the `path.pop()` / `used[i] = false`).",
        "No base case, or a base case that's unreachable ⇒ stack overflow.",
        "Recomputing overlapping subproblems without memoization (exponential when it should be polynomial).",
        "Duplicate results from not skipping equal choices at the same recursion depth.",
        "Mutating shared input arrays across sibling branches.",
      ],
      interviewQs: [
        "Subsets / subsets II (with duplicates).",
        "Permutations / permutations II.",
        "Combination sum I & II.",
        "Generate all valid parentheses for n pairs.",
        "N-Queens — count and return all boards.",
        "Word search in a grid.",
        "Palindrome partitioning.",
        "Letter combinations of a phone number.",
      ],
    },

    {
      id: "dsa-trees",
      title: "Trees & Binary Search Trees",
      tags: ["trees", "recursion"],
      brushup: [
        "Binary tree: ≤ 2 children per node. BST: left subtree &lt; node &lt; right subtree ⇒ in-order traversal is sorted.",
        "Traversals: pre (N,L,R — copy/serialize), in (L,N,R — sorted for BST), post (L,R,N — delete/aggregate), level-order (BFS queue).",
        "Height h: balanced ⇒ log n, skewed ⇒ n. BST search/insert/delete = O(h).",
        "Self-balancing: AVL (strict, fast lookups), Red-Black (looser, fewer rotations — used in TreeMap/std::map), B-tree (disk).",
        "Recursive patterns: return a value up (height, sum, isBalanced), or pass context down (bounds for isValidBST), or both.",
        "LCA, diameter, max path sum, 'distance k', serialize/deserialize are all one clean DFS.",
        "k-th smallest in a BST = in-order traversal, stop at k. Successor = leftmost of right subtree (or nearest ancestor).",
      ],
      detail: `
<h2>Traversals</h2>
<pre><code>function preorder(root, out = []){ if (!root) return out; out.push(root.val); preorder(root.left, out); preorder(root.right, out); return out; }
function inorder (root, out = []){ if (!root) return out; inorder(root.left, out); out.push(root.val); inorder(root.right, out); return out; }
function postorder(root, out = []){ if (!root) return out; postorder(root.left, out); postorder(root.right, out); out.push(root.val); return out; }

function levelOrder(root){
  if (!root) return [];
  const res = [], q = [root];
  while (q.length){
    const level = [], n = q.length;
    for (let i = 0; i &lt; n; i++){
      const node = q.shift();
      level.push(node.val);
      if (node.left) q.push(node.left);
      if (node.right) q.push(node.right);
    }
    res.push(level);
  }
  return res;
}</code></pre>
<p><b>Which traversal?</b> Pre-order clones or serializes (you see a node before its children). Post-order aggregates from the bottom (compute children, then combine — heights, subtree sums, "prune"). In-order visits a BST in sorted order. Level-order (BFS) answers "by depth" questions: right-side view, level averages, min depth, zigzag.</p>

<h2>Two recursive shapes</h2>
<h3>Return a value up the tree</h3>
<pre><code>function height(node){
  if (!node) return 0;
  return 1 + Math.max(height(node.left), height(node.right));
}

// diameter: longest path between any two nodes (edges)
function diameter(root){
  let best = 0;
  function depth(node){
    if (!node) return 0;
    const l = depth(node.left), r = depth(node.right);
    best = Math.max(best, l + r);      // path through this node
    return 1 + Math.max(l, r);
  }
  depth(root);
  return best;
}</code></pre>
<h3>Pass context down the tree</h3>
<pre><code>function isValidBST(root, lo = -Infinity, hi = Infinity){
  if (!root) return true;
  if (root.val &lt;= lo || root.val &gt;= hi) return false;
  return isValidBST(root.left, lo, root.val) &amp;&amp; isValidBST(root.right, root.val, hi);
}</code></pre>
<p>Common bug: validating a BST by comparing a node only to its immediate children. A node deep on the left must still be less than a far-away ancestor — you need the min/max window carried down.</p>

<h2>Lowest Common Ancestor</h2>
<pre><code>// general binary tree
function lca(root, p, q){
  if (!root || root === p || root === q) return root;
  const L = lca(root.left, p, q), R = lca(root.right, p, q);
  if (L &amp;&amp; R) return root;         // p and q are on different sides ⇒ this is the LCA
  return L || R;
}
// BST version is simpler: walk down; the split point (p ≤ node ≤ q) is the LCA — O(h)</code></pre>

<h2>BST operations</h2>
<pre><code>function insert(root, val){
  if (!root) return { val, left: null, right: null };
  if (val &lt; root.val) root.left = insert(root.left, val);
  else root.right = insert(root.right, val);
  return root;
}

function deleteNode(root, key){
  if (!root) return null;
  if (key &lt; root.val) root.left = deleteNode(root.left, key);
  else if (key &gt; root.val) root.right = deleteNode(root.right, key);
  else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    let succ = root.right;                       // in-order successor
    while (succ.left) succ = succ.left;
    root.val = succ.val;
    root.right = deleteNode(root.right, succ.val);
  }
  return root;
}</code></pre>

<h2>Serialize / deserialize</h2>
<pre><code>function serialize(root){
  const out = [];
  (function dfs(n){
    if (!n){ out.push('#'); return; }
    out.push(n.val);
    dfs(n.left); dfs(n.right);
  })(root);
  return out.join(',');
}
function deserialize(data){
  const vals = data.split(','); let i = 0;
  function build(){
    const v = vals[i++];
    if (v === '#') return null;
    return { val: Number(v), left: build(), right: build() };
  }
  return build();
}</code></pre>

<h2>Balancing, briefly</h2>
<table>
<tr><th>Structure</th><th>Balance rule</th><th>Notes</th></tr>
<tr><td>AVL</td><td>|height(L) − height(R)| ≤ 1</td><td>strict ⇒ faster lookups, more rotations on write</td></tr>
<tr><td>Red-Black</td><td>no red-red, equal black-height on all paths</td><td>≤ 2 rotations per op ⇒ used by TreeMap, std::map, Linux CFS</td></tr>
<tr><td>B-tree / B+ tree</td><td>high fan-out, all leaves same depth</td><td>disk/DB indexes — minimize seeks</td></tr>
</table>`,
      diagram: `<svg viewBox="0 0 340 190" xmlns="http://www.w3.org/2000/svg" font-family="monospace" font-size="12">
<g stroke="#888" stroke-width="1.5">
<line x1="170" y1="30" x2="95" y2="85"/><line x1="170" y1="30" x2="245" y2="85"/>
<line x1="95" y1="85" x2="55" y2="140"/><line x1="95" y1="85" x2="135" y2="140"/>
<line x1="245" y1="85" x2="285" y2="140"/></g>
<g fill="#3b82f6"><circle cx="170" cy="30" r="17"/><circle cx="95" cy="85" r="17"/><circle cx="245" cy="85" r="17"/>
<circle cx="55" cy="140" r="17"/><circle cx="135" cy="140" r="17"/><circle cx="285" cy="140" r="17"/></g>
<g fill="#fff" text-anchor="middle" dominant-baseline="middle">
<text x="170" y="30">8</text><text x="95" y="85">3</text><text x="245" y="85">10</text>
<text x="55" y="140">1</text><text x="135" y="140">6</text><text x="285" y="140">14</text></g>
<text x="170" y="180" text-anchor="middle" fill="#888">in-order: 1 · 3 · 6 · 8 · 10 · 14   (sorted)</text>
</svg>`,
      diagramCaption: "A BST: every left descendant < node < every right descendant, so in-order traversal is sorted.",
      pitfalls: [
        "Validating a BST against immediate children only — carry min/max bounds from ancestors.",
        "`q.shift()` level-order on a huge tree is O(n²) in JS — use an index pointer.",
        "Deep recursion on a skewed tree overflows the stack — iterate with an explicit stack.",
        "In serialize/deserialize, forgetting null markers ⇒ ambiguous structure.",
        "Confusing height (edges/nodes on longest path) with depth (distance from root) — be consistent.",
        "LCA when one node might not exist in the tree (some variants require you to verify presence).",
      ],
      interviewQs: [
        "All four traversals, recursive and iterative.",
        "Validate a BST.",
        "Lowest common ancestor (BST and general tree).",
        "Diameter of a binary tree; maximum path sum.",
        "Serialize and deserialize a binary tree.",
        "Level-order variants: right-side view, zigzag, average of levels.",
        "k-th smallest element in a BST.",
        "Convert a sorted array to a height-balanced BST.",
      ],
    },

    {
      id: "dsa-heaps",
      title: "Heaps & Priority Queues",
      tags: ["heaps", "greedy"],
      brushup: [
        "Binary heap = complete tree stored in an array; parent i, children 2i+1 / 2i+2, parent of i is (i−1)/2.",
        "Min-heap: parent ≤ children (heap property, not full order). push/pop = O(log n), peek = O(1).",
        "Build-heap from an array = O(n) (sift-down from the last internal node up), not O(n log n).",
        "Top-K largest ⇒ keep a MIN-heap of size k; if new &gt; heap.top, replace. O(n log k), O(k) space.",
        "Two heaps (max-heap of lower half + min-heap of upper half) ⇒ streaming median in O(log n) per insert.",
        "Powers: Dijkstra, Prim's MST, Huffman coding, merge-k-sorted, task scheduling, 'k closest points'.",
        "JS has no built-in heap — implement one, or for tiny k use sorted insert.",
      ],
      detail: `
<h2>Why a heap over a sorted array or a BST</h2>
<table>
<tr><th>Structure</th><th>peek min</th><th>insert</th><th>pop min</th><th>Notes</th></tr>
<tr><td>Unsorted array</td><td>O(n)</td><td>O(1)</td><td>O(n)</td><td>—</td></tr>
<tr><td>Sorted array</td><td>O(1)</td><td>O(n)</td><td>O(1) (end) / O(n) (front)</td><td>expensive inserts</td></tr>
<tr><td>Balanced BST</td><td>O(log n)</td><td>O(log n)</td><td>O(log n)</td><td>also does ordered iteration/range</td></tr>
<tr><td><b>Binary heap</b></td><td><b>O(1)</b></td><td><b>O(log n)</b></td><td><b>O(log n)</b></td><td>tiny constants, array-backed, no ordered iteration</td></tr>
</table>
<p>When you only ever need "the extreme element" while data keeps arriving, the heap is the tightest fit.</p>

<h2>Implementation</h2>
<pre><code>class MinHeap {
  constructor(cmp = (a, b) =&gt; a - b){ this.a = []; this.cmp = cmp; }
  size(){ return this.a.length; }
  peek(){ return this.a[0]; }
  push(v){
    const a = this.a; a.push(v);
    let i = a.length - 1;
    while (i &gt; 0){
      const p = (i - 1) &gt;&gt; 1;
      if (this.cmp(a[p], a[i]) &lt;= 0) break;
      [a[p], a[i]] = [a[i], a[p]]; i = p;
    }
  }
  pop(){
    const a = this.a, top = a[0], last = a.pop();
    if (a.length){ a[0] = last; this._down(0); }
    return top;
  }
  _down(i){
    const a = this.a, n = a.length;
    while (true){
      let s = i, l = 2*i + 1, r = 2*i + 2;
      if (l &lt; n &amp;&amp; this.cmp(a[l], a[s]) &lt; 0) s = l;
      if (r &lt; n &amp;&amp; this.cmp(a[r], a[s]) &lt; 0) s = r;
      if (s === i) break;
      [a[s], a[i]] = [a[i], a[s]]; i = s;
    }
  }
}</code></pre>
<p>For a max-heap, pass <code>(a, b) =&gt; b - a</code>. To store tuples like <code>[distance, node]</code>, compare on the first element.</p>

<h2>Top-K pattern</h2>
<pre><code>function kthLargest(nums, k){
  const h = new MinHeap();
  for (const x of nums){
    h.push(x);
    if (h.size() &gt; k) h.pop();     // evict the smallest ⇒ heap holds the k largest
  }
  return h.peek();
}

// k closest points to origin
function kClosest(points, k){
  const h = new MinHeap((a, b) =&gt; b[0] - a[0]);   // max-heap by distance
  for (const [x, y] of points){
    h.push([x*x + y*y, x, y]);
    if (h.size() &gt; k) h.pop();
  }
  return h.a.map(([, x, y]) =&gt; [x, y]);
}</code></pre>
<p>Alternative for top-K: <b>quickselect</b> (Hoare partition) gives O(n) average, O(1) space, but O(n²) worst-case and it reorders the array.</p>

<h2>Two-heap streaming median</h2>
<pre><code>class MedianFinder {
  constructor(){
    this.lo = new MinHeap((a, b) =&gt; b - a);   // max-heap: smaller half
    this.hi = new MinHeap((a, b) =&gt; a - b);   // min-heap: larger half
  }
  addNum(x){
    this.lo.push(x);
    this.hi.push(this.lo.pop());               // balance value
    if (this.hi.size() &gt; this.lo.size()) this.lo.push(this.hi.pop());  // balance size
  }
  findMedian(){
    return this.lo.size() &gt; this.hi.size()
      ? this.lo.peek()
      : (this.lo.peek() + this.hi.peek()) / 2;
  }
}</code></pre>

<h2>Heapsort</h2>
<p>Build a max-heap in O(n), then repeatedly swap the root to the end and sift down the reduced heap. O(n log n), in-place, not stable. Rarely the fastest in practice (poor cache behavior vs quicksort) but has a guaranteed bound and no recursion.</p>

<h2>Where heaps show up in system design</h2>
<p>Priority queues for job scheduling, timeout/timer wheels, rate-limiter token refill ordering, Dijkstra in routing, event simulation, "top N trending" with a bounded min-heap over a stream.</p>`,
      pitfalls: [
        "Using a max-heap for 'top K largest' — that's O(n log n). The trick is a size-k MIN-heap.",
        "Assuming a heap is fully sorted — it only guarantees the root; siblings are unordered.",
        "Comparator sign errors for tuples (`[dist, node]`) — decide min vs max explicitly.",
        "Mutating an element's priority in place without re-heapifying (need decrease-key or lazy deletion).",
        "Building a heap by n pushes (O(n log n)) when a one-shot heapify is O(n).",
        "Forgetting JS has no PriorityQueue — bring your own to the interview.",
      ],
      interviewQs: [
        "Kth largest element in an array / in a stream.",
        "Merge k sorted lists / arrays.",
        "Find median from a data stream.",
        "Top K frequent elements / words.",
        "K closest points to the origin.",
        "Task scheduler / reorganize string (greedy with a max-heap).",
        "Sliding window median.",
      ],
    },

    {
      id: "dsa-graphs",
      title: "Graphs — BFS, DFS, Topo Sort, Shortest Path, MST",
      tags: ["graphs", "bfs", "dfs"],
      brushup: [
        "Represent as adjacency list (sparse, O(V+E) space — the default) or matrix (dense, O(V²), O(1) edge check).",
        "BFS ⇒ shortest path in UNWEIGHTED graphs, level order. DFS ⇒ connectivity, cycle detection, topo sort, bridges/articulation points, SCCs.",
        "Always track visited. For grids, an in-place marker or a visited matrix; mark on enqueue for BFS.",
        "Topological sort (DAG only): Kahn's (BFS on in-degree) or DFS post-order reversed. Detects cycles as a side effect.",
        "Weighted shortest path: Dijkstra (non-negative weights, min-heap, O(E log V)); Bellman-Ford (negative edges, detects negative cycles, O(VE)); 0-1 BFS (weights 0/1, deque).",
        "All-pairs: Floyd-Warshall O(V³).",
        "MST: Kruskal (sort edges + union-find) or Prim (grow a tree with a min-heap). Both O(E log V).",
        "Union-Find (DSU) for dynamic connectivity, cycle detection in undirected graphs, Kruskal.",
      ],
      detail: `
<h2>Building the graph</h2>
<pre><code>function buildAdj(n, edges, directed = false){
  const adj = Array.from({ length: n }, () =&gt; []);
  for (const [u, v, w = 1] of edges){
    adj[u].push([v, w]);
    if (!directed) adj[v].push([u, w]);
  }
  return adj;
}</code></pre>

<h2>BFS — shortest path in an unweighted graph</h2>
<pre><code>function bfsDist(adj, src){
  const dist = new Array(adj.length).fill(Infinity);
  dist[src] = 0;
  const q = [src]; let head = 0;
  while (head &lt; q.length){
    const u = q[head++];
    for (const [v] of adj[u]){
      if (dist[v] === Infinity){ dist[v] = dist[u] + 1; q.push(v); }
    }
  }
  return dist;
}</code></pre>
<p><b>Multi-source BFS</b>: seed the queue with all sources at distance 0 (e.g. "rotting oranges", "walls and gates", "01 matrix"). <b>Bidirectional BFS</b>: search from both ends and meet in the middle — roughly square-roots the frontier (word ladder).</p>

<h2>DFS & cycle detection</h2>
<pre><code>// directed cycle detection via 3-color DFS
function hasCycleDirected(adj){
  const color = new Array(adj.length).fill(0);   // 0 white, 1 gray (on stack), 2 black
  function dfs(u){
    color[u] = 1;
    for (const [v] of adj[u]){
      if (color[v] === 1) return true;             // back edge to an ancestor
      if (color[v] === 0 &amp;&amp; dfs(v)) return true;
    }
    color[u] = 2;
    return false;
  }
  for (let i = 0; i &lt; adj.length; i++) if (color[i] === 0 &amp;&amp; dfs(i)) return true;
  return false;
}
// undirected: a cycle exists if DFS reaches an already-visited node that isn't the parent
</code></pre>

<h2>Topological sort (Kahn's / BFS)</h2>
<pre><code>function topoSort(n, edges){
  const adj = Array.from({ length: n }, () =&gt; []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges){ adj[u].push(v); indeg[v]++; }
  const q = []; for (let i = 0; i &lt; n; i++) if (!indeg[i]) q.push(i);
  const order = []; let head = 0;
  while (head &lt; q.length){
    const u = q[head++]; order.push(u);
    for (const v of adj[u]) if (--indeg[v] === 0) q.push(v);
  }
  return order.length === n ? order : null;   // null ⇒ graph has a cycle
}</code></pre>

<h2>Dijkstra (non-negative weighted shortest path)</h2>
<pre><code>function dijkstra(adj, src){
  const n = adj.length;
  const dist = new Array(n).fill(Infinity); dist[src] = 0;
  const pq = new MinHeap((a, b) =&gt; a[0] - b[0]);    // [distance, node]
  pq.push([0, src]);
  while (pq.size()){
    const [d, u] = pq.pop();
    if (d &gt; dist[u]) continue;                       // stale entry ⇒ skip
    for (const [v, w] of adj[u]){
      if (d + w &lt; dist[v]){ dist[v] = d + w; pq.push([dist[v], v]); }
    }
  }
  return dist;
}</code></pre>
<p>Dijkstra fails with negative edges because it "finalizes" a node when popped, assuming no cheaper path can appear later — a negative edge violates that. Use <b>Bellman-Ford</b>: relax all E edges V−1 times; a further relaxation on the V-th pass means a negative cycle.</p>

<h2>Minimum Spanning Tree</h2>
<pre><code>// Kruskal: sort edges ascending, add an edge if it connects two components
function kruskal(n, edges){
  edges.sort((a, b) =&gt; a[2] - b[2]);
  const dsu = new DSU(n);
  let cost = 0, used = 0;
  for (const [u, v, w] of edges){
    if (dsu.union(u, v)){ cost += w; used++; }
  }
  return used === n - 1 ? cost : Infinity;   // Infinity ⇒ graph not connected
}</code></pre>

<h2>Grid problems (a graph in disguise)</h2>
<pre><code>const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
function numIslands(grid){
  const R = grid.length, C = grid[0].length; let count = 0;
  function sink(r, c){
    if (r &lt; 0 || c &lt; 0 || r &gt;= R || c &gt;= C || grid[r][c] !== '1') return;
    grid[r][c] = '0';
    for (const [dr, dc] of DIRS) sink(r + dr, c + dc);
  }
  for (let r = 0; r &lt; R; r++) for (let c = 0; c &lt; C; c++)
    if (grid[r][c] === '1'){ count++; sink(r, c); }
  return count;
}</code></pre>

<h2>Choosing the algorithm</h2>
<table>
<tr><th>Problem</th><th>Algorithm</th></tr>
<tr><td>Shortest path, unweighted</td><td>BFS</td></tr>
<tr><td>Shortest path, weights ≥ 0</td><td>Dijkstra</td></tr>
<tr><td>Shortest path, negative edges</td><td>Bellman-Ford (SPFA)</td></tr>
<tr><td>Shortest path, weights ∈ {0,1}</td><td>0-1 BFS (deque)</td></tr>
<tr><td>All-pairs shortest path, small V</td><td>Floyd-Warshall</td></tr>
<tr><td>Ordering with prerequisites</td><td>Topological sort</td></tr>
<tr><td>Cheapest way to connect everything</td><td>MST (Kruskal / Prim)</td></tr>
<tr><td>Dynamic "are u and v connected?"</td><td>Union-Find</td></tr>
</table>`,
      pitfalls: [
        "Marking visited on dequeue instead of enqueue in BFS ⇒ the same node queued many times.",
        "Running Dijkstra with negative edges — silently wrong; use Bellman-Ford.",
        "Topological sort on a graph that has a cycle — check `order.length === n`.",
        "Grid DFS without bounds checks, or forgetting to mark cells visited ⇒ infinite recursion.",
        "Forgetting disconnected components — loop over every node as a potential DFS/BFS root.",
        "Adjacency matrix for a sparse graph — O(V²) memory when O(V+E) would do.",
        "Not skipping stale heap entries in Dijkstra (`if (d > dist[u]) continue;`).",
      ],
      interviewQs: [
        "Number of islands / connected components / number of provinces.",
        "Course schedule I & II (cycle detection + topo order).",
        "Word ladder (BFS / bidirectional BFS).",
        "Clone a graph.",
        "Network delay time / cheapest flights within K stops (Dijkstra / Bellman-Ford).",
        "Rotting oranges / walls and gates (multi-source BFS).",
        "Redundant connection (union-find).",
        "Min cost to connect all points (MST).",
      ],
    },

    {
      id: "dsa-dp",
      title: "Dynamic Programming",
      tags: ["dp", "optimization"],
      brushup: [
        "DP applies with <b>optimal substructure</b> (optimal answer built from optimal sub-answers) + <b>overlapping subproblems</b> (same sub-answer needed many times).",
        "Top-down = recursion + memo (write the recurrence, cache results). Bottom-up = fill a table in dependency order.",
        "Recipe: define the STATE, write the TRANSITION, set BASE CASES, choose ITERATION ORDER, read the ANSWER, then optimize SPACE.",
        "Families: linear (house robber, decode ways), 0/1 knapsack, unbounded knapsack (coin change), LIS, LCS / edit distance, matrix/grid paths, interval DP (burst balloons, MCM), DP on trees, bitmask DP (TSP, assignment), digit DP.",
        "Space: if dp[i] depends only on dp[i−1], dp[i−2] ⇒ O(1). If dp[i][j] depends only on the previous row ⇒ O(cols).",
        "If a greedy choice is provably optimal, use greedy — it's simpler and faster.",
        "0/1 knapsack: iterate the weight loop DOWNWARD to avoid reusing an item.",
      ],
      detail: `
<h2>The five questions</h2>
<ol>
<li><b>State</b> — what parameters uniquely identify a subproblem? Fewer dimensions = faster. e.g. <code>dp[i]</code> = LIS ending at index i; <code>dp[i][j]</code> = edit distance of prefixes of length i and j.</li>
<li><b>Transition</b> — express <code>dp[state]</code> using strictly smaller states.</li>
<li><b>Base case</b> — the smallest states, filled directly.</li>
<li><b>Order</b> — iterate so every state's dependencies are already computed (that's why knapsack sometimes loops backward).</li>
<li><b>Answer</b> — one specific state, or a max/sum/min over a set of states.</li>
</ol>

<h2>Top-down template (recursion + memo)</h2>
<pre><code>function solve(i, j, memo = new Map()){
  const key = i + ',' + j;
  if (isBase(i, j)) return baseValue(i, j);
  if (memo.has(key)) return memo.get(key);
  let ans = /* combine solve(smaller states) */;
  memo.set(key, ans);
  return ans;
}</code></pre>
<p>Top-down is easier to derive (it's just the brute-force recursion + a cache) and only computes reachable states. Bottom-up avoids recursion overhead and makes space optimization obvious. Convert once you trust the recurrence.</p>

<h2>Linear DP — House Robber</h2>
<pre><code>function rob(nums){
  let prev2 = 0, prev1 = 0;                        // best up to i-2, i-1
  for (const x of nums){
    const cur = Math.max(prev1, prev2 + x);        // skip i, or rob i
    prev2 = prev1; prev1 = cur;
  }
  return prev1;
}</code></pre>

<h2>Unbounded knapsack — Coin Change (min coins)</h2>
<pre><code>function coinChange(coins, amount){
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a &lt;= amount; a++){
    for (const c of coins){
      if (c &lt;= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
// greedy (largest coin first) is WRONG in general: coins [1,3,4], amount 6 → greedy 4+1+1=3, optimal 3+3=2</code></pre>

<h2>0/1 knapsack (each item once)</h2>
<pre><code>function knapsack(wt, val, W){
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i &lt; wt.length; i++){
    for (let w = W; w &gt;= wt[i]; w--){              // DOWNWARD ⇒ item i used at most once
      dp[w] = Math.max(dp[w], dp[w - wt[i]] + val[i]);
    }
  }
  return dp[W];
}</code></pre>
<p>If the inner loop went upward, <code>dp[w - wt[i]]</code> could already include item i, letting you take it again — that's the unbounded variant.</p>

<h2>2D DP — Longest Common Subsequence</h2>
<pre><code>function lcs(a, b){
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () =&gt; new Array(n + 1).fill(0));
  for (let i = 1; i &lt;= m; i++){
    for (let j = 1; j &lt;= n; j++){
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[m][n];
}
// Edit distance is the same shape with three transitions (insert/delete/replace).</code></pre>

<h2>LIS in O(n log n)</h2>
<pre><code>function lengthOfLIS(nums){
  const tails = [];                                 // tails[k] = smallest tail of an LIS of length k+1
  for (const x of nums){
    let lo = 0, hi = tails.length;
    while (lo &lt; hi){ const mid = (lo + hi) &gt;&gt; 1; tails[mid] &lt; x ? lo = mid + 1 : hi = mid; }
    tails[lo] = x;
  }
  return tails.length;
}</code></pre>

<h2>Interval DP — shape</h2>
<p><code>dp[i][j]</code> = best for the subarray/substring <code>i..j</code>; try every split point <code>k</code> or every "last operation" in <code>[i, j]</code>. Iterate by increasing interval length. Examples: matrix-chain multiplication, burst balloons, "minimum cost to cut a stick", palindrome partitioning II.</p>

<h2>Bitmask DP — shape</h2>
<p>State includes a bitmask over ≤ ~20 elements representing a subset "already used/visited". Examples: Travelling Salesman <code>dp[mask][i]</code> = min cost to visit <code>mask</code> ending at <code>i</code> (O(2ⁿ·n²)); assignment problems; "partition to k equal subsets".</p>

<h2>Recognizing DP</h2>
<ul>
<li>"Count the number of ways…", "minimum / maximum … over choices", "is it possible to …" with sequential decisions.</li>
<li>Brute-force recursion has parameters that repeat with the same values → memoize.</li>
<li>Choices at each step, and the future depends only on a small summary of the past (the state).</li>
</ul>`,
      pitfalls: [
        "0/1 knapsack with a forward inner loop — silently becomes unbounded (item reused).",
        "Wrong iteration order so a state reads an uncomputed neighbor.",
        "Memo key doesn't capture the full state (forgot a dimension) ⇒ wrong cached answers.",
        "Off-by-one between 1-indexed DP tables and 0-indexed strings/arrays.",
        "Using greedy where it isn't optimal (coin change with arbitrary denominations).",
        "Not initializing 'impossible' states (should be +Infinity for min, 0 or −Infinity for max/count).",
        "O(2ⁿ) memoized recursion that still TLEs because the state space itself is exponential — need a better state.",
      ],
      interviewQs: [
        "Climbing stairs / min cost climbing stairs / decode ways.",
        "House robber I, II (circular), III (tree).",
        "Coin change (min coins) & coin change 2 (number of combinations).",
        "0/1 knapsack; partition equal subset sum; target sum.",
        "Longest common subsequence; edit distance; longest palindromic subsequence.",
        "Longest increasing subsequence (O(n²) and O(n log n)).",
        "Unique paths / minimum path sum / with obstacles.",
        "Word break; longest valid parentheses; maximal square.",
        "Best time to buy/sell stock with cooldown / with fee / at most k transactions.",
      ],
    },

    {
      id: "dsa-sorting",
      title: "Sorting & Binary Search",
      tags: ["sorting", "searching"],
      brushup: [
        "Comparison sorts are Ω(n log n) in the worst case (decision-tree lower bound).",
        "Merge sort: O(n log n) always, stable, O(n) space; ideal for linked lists & external sort.",
        "Quicksort: O(n log n) avg, O(n²) worst (bad pivots — randomize or median-of-three), in-place, not stable.",
        "Heapsort: O(n log n) always, in-place, not stable, cache-unfriendly.",
        "Non-comparison: counting sort O(n+k), radix sort O(d·(n+b)), bucket sort — for bounded integer/string keys.",
        "Introsort (C++ std::sort) = quicksort → heapsort fallback; Timsort (Python/Java objects) = merge + runs, stable.",
        "Binary search needs a MONOTONIC predicate: 'smallest x such that f(x) is true'. Not just a sorted array.",
        "'Binary search on the answer': guess a value, check feasibility in O(n), narrow the range.",
      ],
      detail: `
<h2>Why O(n log n) is the comparison-sort floor</h2>
<p>Any comparison sort is a decision tree; n! possible orderings means ≥ n! leaves; a binary tree of height h has ≤ 2ʰ leaves; so <code>2ʰ ≥ n!</code> ⇒ <code>h ≥ log₂(n!) = Θ(n log n)</code>. Counting/radix sort beat this by not comparing elements — they use the key's structure directly.</p>

<h2>Merge sort</h2>
<pre><code>function mergeSort(a){
  if (a.length &lt;= 1) return a;
  const mid = a.length &gt;&gt; 1;
  const L = mergeSort(a.slice(0, mid)), R = mergeSort(a.slice(mid));
  const out = []; let i = 0, j = 0;
  while (i &lt; L.length &amp;&amp; j &lt; R.length) out.push(L[i] &lt;= R[j] ? L[i++] : R[j++]);  // &lt;= keeps it stable
  while (i &lt; L.length) out.push(L[i++]);
  while (j &lt; R.length) out.push(R[j++]);
  return out;
}</code></pre>
<p>The merge step is also how you <b>count inversions</b> (add <code>L.length - i</code> whenever you take from R) and solve "count of smaller numbers after self".</p>

<h2>Quicksort & quickselect</h2>
<pre><code>function quickselect(a, k){        // k-th smallest (0-indexed), average O(n)
  let lo = 0, hi = a.length - 1;
  while (true){
    const p = partition(a, lo, hi);
    if (p === k) return a[p];
    p &lt; k ? lo = p + 1 : hi = p - 1;
  }
}
function partition(a, lo, hi){
  const pivot = a[hi];             // (randomize: swap a[hi] with a random index first)
  let i = lo;
  for (let j = lo; j &lt; hi; j++) if (a[j] &lt; pivot) { [a[i], a[j]] = [a[j], a[i]]; i++; }
  [a[i], a[hi]] = [a[hi], a[i]];
  return i;
}</code></pre>

<h2>Counting sort (bounded keys)</h2>
<pre><code>function countingSort(a, maxVal){
  const count = new Array(maxVal + 1).fill(0);
  for (const x of a) count[x]++;
  const out = [];
  for (let v = 0; v &lt;= maxVal; v++) for (let c = 0; c &lt; count[v]; c++) out.push(v);
  return out;
}
// radix sort = counting sort digit by digit, least-significant first (needs a stable inner sort)</code></pre>

<h2>Binary search — the two safe templates</h2>
<pre><code>// 1) exact match
function search(a, target){
  let lo = 0, hi = a.length - 1;
  while (lo &lt;= hi){
    const mid = lo + ((hi - lo) &gt;&gt; 1);      // avoids overflow in fixed-width int languages
    if (a[mid] === target) return mid;
    if (a[mid] &lt; target) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}

// 2) boundary: first index where predicate(i) is true  (predicate must be false...false,true...true)
function lowerBound(a, pred){
  let lo = 0, hi = a.length;                // [lo, hi)
  while (lo &lt; hi){
    const mid = (lo + hi) &gt;&gt; 1;
    if (pred(mid)) hi = mid; else lo = mid + 1;
  }
  return lo;                                // a.length if never true
}</code></pre>
<p>Template 2 handles "first/last position of a target", "search insert position", "smallest element ≥ x", rotated arrays, and "peak element". The whole game is defining a boolean predicate that flips exactly once.</p>

<h2>Binary search on the answer</h2>
<pre><code>// minimum eating speed so all piles are finished within h hours
function minEatingSpeed(piles, h){
  const hoursAt = k =&gt; piles.reduce((s, p) =&gt; s + Math.ceil(p / k), 0);
  let lo = 1, hi = Math.max(...piles);
  while (lo &lt; hi){
    const mid = (lo + hi) &gt;&gt; 1;
    if (hoursAt(mid) &lt;= h) hi = mid; else lo = mid + 1;
  }
  return lo;
}</code></pre>
<p>Recognize it when the answer is a number in a range, checking "can we achieve X?" is easy and monotonic in X, and you want the min/max feasible X. Examples: "split array to k parts minimizing the largest sum", "capacity to ship packages in D days", "minimum days to make m bouquets", "aggressive cows".</p>

<h2>Sorting stability & when it matters</h2>
<p>Stable = equal keys keep their original relative order. Matters when you sort by multiple keys in passes (sort by secondary key, then stably by primary), or when records carry a payload you don't want reordered. JS <code>Array.sort</code> is stable (spec since ES2019). It sorts <b>lexicographically by default</b> — always pass a comparator for numbers: <code>a.sort((x, y) =&gt; x - y)</code>.</p>`,
      pitfalls: [
        "`(lo + hi) / 2` integer overflow in fixed-width languages — use `lo + ((hi - lo) >> 1)`.",
        "Infinite loop from an inconsistent boundary update (`mid` vs `mid ± 1`) — pick a template and keep it.",
        "JS `arr.sort()` without a comparator sorts as strings: `[10, 9, 1].sort()` → `[1, 10, 9]`.",
        "Binary search when the predicate isn't monotonic.",
        "Quicksort with a fixed pivot on already-sorted input → O(n²); randomize.",
        "Assuming a sort is stable when it isn't (heapsort, plain quicksort, C++ `std::sort`).",
        "Off-by-one on the search space: `[lo, hi]` inclusive vs `[lo, hi)` half-open — be consistent.",
      ],
      interviewQs: [
        "Search in a rotated sorted array (I & II with duplicates).",
        "Find first and last position of a target.",
        "Find peak element; find minimum in rotated sorted array.",
        "Median of two sorted arrays (O(log(m+n))).",
        "Kth smallest element in a sorted matrix.",
        "Split array largest sum / capacity to ship packages in D days.",
        "Count of smaller numbers after self / count inversions.",
        "Sort colors (Dutch national flag).",
      ],
    },

    {
      id: "dsa-advanced",
      title: "Tries, Union-Find, Fenwick/Segment Trees & Bit Manipulation",
      tags: ["trie", "dsu", "bits", "segment-tree"],
      brushup: [
        "Trie: prefix tree, each node has ≤ alphabet children + isEnd flag. Insert/search a word in O(L). Great for autocomplete, prefix counts, wildcard match, max-XOR.",
        "Union-Find (DSU): near-O(1) union & find with path compression + union by rank/size (inverse-Ackermann, effectively constant).",
        "DSU uses: connected components, undirected cycle detection, Kruskal's MST, 'number of provinces', 'accounts merge', offline dynamic connectivity.",
        "Fenwick (BIT): prefix sums with point updates in O(log n), tiny code. Segment tree: range query + range update (with lazy propagation), O(log n).",
        "Bit tricks: <code>x &amp; (x-1)</code> clears the lowest set bit; <code>x &amp; -x</code> isolates it; XOR finds the unique element; a bitmask is a set of ≤ 32 (or 53 in JS) items.",
        "JS bitwise ops are 32-bit signed — beware <code>1 &lt;&lt; 31</code> and values above 2³¹.",
      ],
      detail: `
<h2>Trie</h2>
<pre><code>class Trie {
  constructor(){ this.root = {}; }
  insert(word){
    let node = this.root;
    for (const c of word) node = (node[c] ||= {});
    node.$ = true;                       // end-of-word marker
  }
  _walk(prefix){
    let node = this.root;
    for (const c of prefix){ if (!node[c]) return null; node = node[c]; }
    return node;
  }
  search(word){ const n = this._walk(word); return !!(n &amp;&amp; n.$); }
  startsWith(prefix){ return this._walk(prefix) !== null; }
}</code></pre>
<p><b>Wildcard search</b> ("." matches any char): when you hit ".", recurse into every child. <b>Max XOR of two numbers</b>: insert numbers as 32-bit binary strings into a trie; for each number, greedily walk toward the opposite bit to maximize XOR — O(32n).</p>

<h2>Union-Find (Disjoint Set Union)</h2>
<pre><code>class DSU {
  constructor(n){ this.p = [...Array(n).keys()]; this.r = new Array(n).fill(0); this.count = n; }
  find(x){ return this.p[x] === x ? x : (this.p[x] = this.find(this.p[x])); }   // path compression
  union(a, b){
    a = this.find(a); b = this.find(b);
    if (a === b) return false;                    // already connected ⇒ this edge closes a cycle
    if (this.r[a] &lt; this.r[b]) [a, b] = [b, a];   // union by rank
    this.p[b] = a;
    if (this.r[a] === this.r[b]) this.r[a]++;
    this.count--;
    return true;
  }
}</code></pre>
<p>With both optimizations, m operations on n elements cost O(m·α(n)) where α is the inverse Ackermann function — ≤ 4 for any n you'll ever see. DSU is for <b>merging</b> sets; it can't split them. If you need deletions, that's "offline" DSU (process queries in reverse) or a link-cut tree.</p>

<h2>Fenwick tree (Binary Indexed Tree)</h2>
<pre><code>class Fenwick {
  constructor(n){ this.n = n; this.t = new Array(n + 1).fill(0); }
  update(i, delta){ for (i++; i &lt;= this.n; i += i &amp; -i) this.t[i] += delta; }
  query(i){ let s = 0; for (i++; i &gt; 0; i -= i &amp; -i) s += this.t[i]; return s; }  // prefix sum [0..i]
  range(l, r){ return this.query(r) - this.query(l - 1); }
}</code></pre>
<p>Use for: dynamic prefix sums, "count of smaller elements to the right" (coordinate-compress + BIT), "range sum with point updates". A segment tree does everything a Fenwick does plus range-min/max/gcd and range updates (with lazy propagation), at ~4n memory and more code.</p>

<h2>Segment tree (range sum, point update)</h2>
<pre><code>class SegTree {
  constructor(a){
    this.n = a.length; this.t = new Array(2 * this.n).fill(0);
    for (let i = 0; i &lt; this.n; i++) this.t[this.n + i] = a[i];
    for (let i = this.n - 1; i &gt; 0; i--) this.t[i] = this.t[2*i] + this.t[2*i+1];
  }
  update(i, val){
    i += this.n; this.t[i] = val;
    for (i &gt;&gt;= 1; i &gt; 0; i &gt;&gt;= 1) this.t[i] = this.t[2*i] + this.t[2*i+1];
  }
  query(l, r){                        // sum of [l, r)
    let res = 0;
    for (l += this.n, r += this.n; l &lt; r; l &gt;&gt;= 1, r &gt;&gt;= 1){
      if (l &amp; 1) res += this.t[l++];
      if (r &amp; 1) res += this.t[--r];
    }
    return res;
  }
}</code></pre>

<h2>Bit manipulation essentials</h2>
<pre><code>const isSet     = (x, i) =&gt; (x &gt;&gt; i) &amp; 1;
const setBit    = (x, i) =&gt; x | (1 &lt;&lt; i);
const clearBit  = (x, i) =&gt; x &amp; ~(1 &lt;&lt; i);
const toggleBit = (x, i) =&gt; x ^ (1 &lt;&lt; i);
const lowestSet = x =&gt; x &amp; -x;                 // isolate lowest 1 bit
const dropLowest= x =&gt; x &amp; (x - 1);            // clear lowest 1 bit
const popcount  = x =&gt; { let c = 0; while (x){ x &amp;= x - 1; c++; } return c; };
const isPow2    = x =&gt; x &gt; 0 &amp;&amp; (x &amp; (x - 1)) === 0;

// unique element when every other appears twice
const singleNumber = nums =&gt; nums.reduce((a, b) =&gt; a ^ b, 0);

// enumerate every subset of a bitmask
for (let sub = mask; sub &gt; 0; sub = (sub - 1) &amp; mask) { /* use sub */ }

// two elements appear once, the rest twice: XOR all, split by any set bit of the XOR
</code></pre>
<p>Bitmask as a set: <code>dp[mask]</code> where bit i = "item i chosen/visited" powers TSP, "partition to k equal subsets", "shortest path visiting all nodes".</p>

<h2>Choosing the structure</h2>
<table>
<tr><th>Need</th><th>Use</th></tr>
<tr><td>Prefix / autocomplete / wildcard word queries</td><td>Trie</td></tr>
<tr><td>Dynamic "connected?" + merging groups</td><td>Union-Find</td></tr>
<tr><td>Prefix sums with point updates</td><td>Fenwick</td></tr>
<tr><td>Range min/max/sum + range updates</td><td>Segment tree (lazy)</td></tr>
<tr><td>Subset state over ≤ ~20 items</td><td>Bitmask DP</td></tr>
</table>`,
      pitfalls: [
        "DSU without path compression AND union by rank ⇒ O(n) per op, defeating the purpose.",
        "Trie memory blow-up — use an object/Map per node; free branches if the dataset is huge.",
        "JS bitwise operators are 32-bit signed: `1 << 31` is negative, and numbers ≥ 2³¹ misbehave; use `>>> 0` to read as unsigned.",
        "XOR 'single number' trick only works when all-but-one (or all-but-two) appear an even number of times.",
        "Fenwick is 1-indexed internally — off-by-one bugs if you forget the `i++`.",
        "Segment tree range bounds: `[l, r)` half-open vs `[l, r]` inclusive — mixing them breaks queries.",
      ],
      interviewQs: [
        "Implement a trie; add/search word with '.' wildcard; word search II (trie + DFS on a grid).",
        "Number of connected components / redundant connection / accounts merge (union-find).",
        "Maximum XOR of two numbers in an array.",
        "Range sum query — mutable (Fenwick or segment tree).",
        "Count of smaller numbers after self.",
        "Single number I / II / III.",
        "Subsets via bitmask; partition to k equal-sum subsets.",
      ],
    },
  ],
});
