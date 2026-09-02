/* DSA concepts — study notes. */
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
        "Big-O = <b>upper bound</b> on growth as input n → ∞; drop constants and lower-order terms (3n²+n ⇒ O(n²)).",
        "Common ladder: O(1) &lt; O(log n) &lt; O(n) &lt; O(n log n) &lt; O(n²) &lt; O(2ⁿ) &lt; O(n!).",
        "log n ⇒ you halve the problem each step (binary search, balanced BST, heap ops).",
        "n log n ⇒ efficient comparison sorts, divide-and-conquer.",
        "Amortized: occasional expensive op averaged over many cheap ones (dynamic array push = O(1) amortized).",
        "Space complexity counts <b>extra</b> memory: recursion stack depth counts; output usually doesn't.",
        "Always state best/avg/worst when they differ (quicksort avg O(n log n), worst O(n²)).",
      ],
      detail: `
<h2>What Big-O actually measures</h2>
<p>Big-O describes how running time or memory <em>scales</em> with input size, ignoring machine-specific constants. It's about the shape of the curve, not the stopwatch. Interviewers want you to reason about scalability, then optimize.</p>
<h3>Deriving it</h3>
<ul>
<li>Sequential statements ⇒ add: O(a) + O(b).</li>
<li>Nested loops over the same n ⇒ multiply: O(n·n) = O(n²).</li>
<li>Loop that divides range by 2 ⇒ O(log n).</li>
<li>Recurrence T(n) = 2T(n/2) + O(n) ⇒ O(n log n) (Master Theorem).</li>
</ul>
<h3>Reference table</h3>
<table>
<tr><th>Complexity</th><th>n = 10</th><th>n = 1,000</th><th>Typical source</th></tr>
<tr><td>O(1)</td><td>1</td><td>1</td><td>hash lookup, array index</td></tr>
<tr><td>O(log n)</td><td>~3</td><td>~10</td><td>binary search, heap push/pop</td></tr>
<tr><td>O(n)</td><td>10</td><td>1,000</td><td>single scan</td></tr>
<tr><td>O(n log n)</td><td>~33</td><td>~10,000</td><td>merge/heap sort</td></tr>
<tr><td>O(n²)</td><td>100</td><td>1,000,000</td><td>nested loops, naive pair compare</td></tr>
<tr><td>O(2ⁿ)</td><td>1,024</td><td>huge</td><td>subsets, naive recursion</td></tr>
</table>
<h3>Rough performance budget</h3>
<p>Assume ~10⁸ simple operations per second. If constraints say n ≤ 10⁵, an O(n²) = 10¹⁰ solution is too slow; you need O(n log n) or better. Reading constraints tells you the target complexity.</p>
<pre><code>// O(n) time, O(1) extra space
function maxOfArray(a){ let m = -Infinity; for (const x of a) m = Math.max(m, x); return m; }

// O(n^2) — nested loops
function hasDupPair(a){ for(let i=0;i&lt;a.length;i++) for(let j=i+1;j&lt;a.length;j++) if(a[i]===a[j]) return true; return false; }

// O(n) with a hash set instead
function hasDup(a){ const s=new Set(); for(const x of a){ if(s.has(x)) return true; s.add(x);} return false; }</code></pre>`,
      pitfalls: [
        "Forgetting recursion stack in space analysis (a recursive DFS on a skewed tree is O(n) space).",
        "Saying O(n) when there's a hidden `.includes()` / `indexOf` inside a loop — that's O(n²).",
        "Treating `Array.sort` as free — it's O(n log n).",
        "Confusing O(log n) base: base doesn't matter for Big-O, but it matters for intuition.",
      ],
      interviewQs: [
        "What's the complexity of your solution, and can you do better?",
        "Difference between O(n) space and O(1) space here?",
        "Why is HashMap lookup O(1) average but O(n) worst case?",
      ],
    },
    {
      id: "dsa-arrays",
      title: "Arrays & Strings",
      tags: ["arrays", "strings", "fundamentals"],
      brushup: [
        "Contiguous memory ⇒ O(1) random access by index, O(n) insert/delete in the middle (shift).",
        "Prefix sums: precompute so any range sum is O(1). <code>pre[i] = pre[i-1] + a[i]</code>.",
        "In-place tricks: reverse, cyclic rotation (reverse 3×), Dutch-national-flag partition.",
        "Strings are immutable in JS/Java — build with an array + join, not <code>+=</code> in a loop.",
        "Kadane's algorithm: max subarray sum in O(n) — track running sum, reset to 0 when negative.",
        "Sorting first often unlocks two-pointer / greedy solutions (cost: O(n log n)).",
      ],
      detail: `
<h2>Arrays</h2>
<p>The workhorse structure. Access is O(1) because the address is <code>base + index·size</code>. The cost is structural change: inserting at the front is O(n) because every later element shifts.</p>
<h3>Prefix sums</h3>
<pre><code>// range sum [l..r] inclusive in O(1) after O(n) build
const pre = [0];
for (let i = 0; i &lt; a.length; i++) pre.push(pre[i] + a[i]);
const rangeSum = (l, r) =&gt; pre[r + 1] - pre[l];</code></pre>
<h3>Kadane's algorithm</h3>
<pre><code>function maxSubArray(a){
  let best = a[0], cur = a[0];
  for (let i = 1; i &lt; a.length; i++){
    cur = Math.max(a[i], cur + a[i]);   // extend or restart
    best = Math.max(best, cur);
  }
  return best;
}</code></pre>
<h3>In-place rotation by k</h3>
<pre><code>function rotate(a, k){
  k %= a.length;
  const rev = (i, j) =&gt; { while (i &lt; j) [a[i], a[j]] = [a[j], a[i]], i++, j--; };
  rev(0, a.length - 1); rev(0, k - 1); rev(k, a.length - 1);
}</code></pre>
<h2>Strings</h2>
<p>Treat as a char array. Frequency counting with a 26-length array or a Map handles anagrams, permutations, and "first unique char". For pattern search beyond brute force, know that KMP / Rabin-Karp exist (O(n+m)).</p>`,
      pitfalls: [
        "`arr.splice` / `shift` inside a loop turns O(n) into O(n²).",
        "String concatenation in a loop is O(n²) in most languages — accumulate in an array.",
        "Off-by-one on inclusive vs exclusive range bounds in prefix sums.",
        "Mutating an array while iterating it.",
      ],
      interviewQs: [
        "Find the max subarray sum (and return the indices).",
        "Move all zeros to the end in-place, keeping order.",
        "Given prices, max profit with one buy/sell.",
      ],
    },
    {
      id: "dsa-hashing",
      title: "Hashing — Maps & Sets",
      tags: ["hashing", "fundamentals"],
      brushup: [
        "Hash table = array of buckets + hash function; average O(1) insert/lookup/delete.",
        "Collisions handled by chaining (linked list/tree per bucket) or open addressing.",
        "Worst case O(n) if every key collides (adversarial input, bad hash) — Java 8 upgrades buckets to trees.",
        "Use a Set for membership, a Map for key→value, a Map&lt;key,count&gt; for frequency.",
        "Trade space for time: precompute a lookup table to turn an O(n²) scan into O(n).",
        "Keys must be immutable / hashable; in JS object keys are stringified — use a Map for non-string keys.",
      ],
      detail: `
<h2>How it works</h2>
<p>A hash function maps a key to a bucket index. Good hash ⇒ uniform spread ⇒ O(1) average. When two keys land in the same bucket (collision), the table either chains entries in that bucket or probes for the next free slot. Load factor (entries / buckets) is kept low by resizing (rehash everything, amortized O(1)).</p>
<h3>The canonical pattern: complement lookup</h3>
<pre><code>// Two Sum in O(n): seen value -> its index
function twoSum(nums, target){
  const seen = new Map();
  for (let i = 0; i &lt; nums.length; i++){
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}</code></pre>
<h3>Frequency map</h3>
<pre><code>function isAnagram(a, b){
  if (a.length !== b.length) return false;
  const f = new Map();
  for (const c of a) f.set(c, (f.get(c) || 0) + 1);
  for (const c of b){
    if (!f.get(c)) return false;
    f.set(c, f.get(c) - 1);
  }
  return true;
}</code></pre>
<h3>When NOT to use a hash map</h3>
<ul><li>You need sorted order or range queries ⇒ use a balanced BST / sorted structure (TreeMap).</li>
<li>Keys are a small bounded integer range ⇒ a plain array is faster and simpler.</li>
<li>Memory is tight and n is huge ⇒ hashing has overhead per entry.</li></ul>`,
      pitfalls: [
        "Relying on iteration order (JS Map preserves insertion order; plain objects mostly do, but don't lean on it).",
        "Using objects/arrays as plain-object keys — they collapse to \"[object Object]\". Use Map.",
        "Mutating a key after insertion.",
        "Assuming O(1) in the worst case for latency-sensitive systems.",
      ],
      interviewQs: [
        "Group anagrams together.",
        "Longest consecutive sequence in O(n).",
        "First non-repeating character in a stream.",
      ],
    },
    {
      id: "dsa-twopointers",
      title: "Two Pointers & Sliding Window",
      tags: ["patterns", "arrays", "strings"],
      brushup: [
        "Two pointers: converging (sorted array, pair sum), or fast/slow (cycle detection, middle of list).",
        "Sliding window: contiguous subarray/substring problems — grow the right edge, shrink the left when a constraint breaks.",
        "Fixed-size window ⇒ add new, remove old each step. Variable window ⇒ while-loop to shrink.",
        "Turns many O(n²) brute forces into O(n).",
        "Track window state with a running sum, or a frequency map for 'at most K distinct' style problems.",
      ],
      detail: `
<h2>Two pointers on a sorted array</h2>
<pre><code>function pairSumSorted(a, target){
  let i = 0, j = a.length - 1;
  while (i &lt; j){
    const s = a[i] + a[j];
    if (s === target) return [i, j];
    s &lt; target ? i++ : j--;
  }
  return [];
}</code></pre>
<h2>Fast / slow (Floyd's cycle detection)</h2>
<pre><code>function hasCycle(head){
  let slow = head, fast = head;
  while (fast &amp;&amp; fast.next){
    slow = slow.next; fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}</code></pre>
<h2>Variable sliding window</h2>
<pre><code>// Longest substring without repeating characters
function lengthOfLongestSubstring(s){
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
<p>The mental model: the window <code>[start, end]</code> always satisfies the constraint. Expand <code>end</code> greedily; when adding <code>s[end]</code> violates the rule, advance <code>start</code> until valid again. Each index enters and leaves the window once ⇒ O(n).</p>`,
      pitfalls: [
        "Sliding window only works when shrinking the window can restore validity (monotonic). 'Subarray sum equals K' with negatives needs prefix sums + hashmap instead.",
        "Forgetting to update the answer at the right moment (before vs after shrinking).",
        "Fast pointer null checks: check `fast && fast.next` before `fast.next.next`.",
      ],
      interviewQs: [
        "Minimum window substring containing all chars of T.",
        "Longest substring with at most K distinct characters.",
        "3Sum — find all unique triplets summing to zero.",
      ],
    },
    {
      id: "dsa-stackqueue",
      title: "Stack & Queue",
      tags: ["fundamentals", "linear"],
      brushup: [
        "Stack = LIFO. Uses: undo, recursion/call stack, expression parsing, DFS, 'next greater element' (monotonic stack).",
        "Queue = FIFO. Uses: BFS, scheduling, buffering, level-order traversal.",
        "Deque = both ends O(1); powers sliding-window-maximum and monotonic-deque problems.",
        "Monotonic stack: keep elements in increasing/decreasing order to answer 'nearest greater/smaller' in O(n).",
        "In JS: array push/pop = stack; push/shift = queue (shift is O(n) — use a real deque or index pointer for hot loops).",
      ],
      detail: `
<h2>Monotonic stack — Next Greater Element</h2>
<pre><code>function nextGreater(nums){
  const res = new Array(nums.length).fill(-1);
  const st = []; // indices, values decreasing
  for (let i = 0; i &lt; nums.length; i++){
    while (st.length &amp;&amp; nums[st[st.length - 1]] &lt; nums[i]){
      res[st.pop()] = nums[i];
    }
    st.push(i);
  }
  return res;
}</code></pre>
<p>Each index is pushed and popped at most once ⇒ O(n) even though there's a nested while.</p>
<h2>Valid parentheses</h2>
<pre><code>function isValid(s){
  const st = [], pair = { ')': '(', ']': '[', '}': '{' };
  for (const c of s){
    if (c in pair){ if (st.pop() !== pair[c]) return false; }
    else st.push(c);
  }
  return st.length === 0;
}</code></pre>
<h2>Queue via two stacks / BFS skeleton</h2>
<pre><code>function bfs(start, neighbors){
  const q = [start], seen = new Set([start]);
  let head = 0;                       // index pointer avoids O(n) shift
  while (head &lt; q.length){
    const node = q[head++];
    for (const nb of neighbors(node)) if (!seen.has(nb)){ seen.add(nb); q.push(nb); }
  }
}</code></pre>`,
      pitfalls: [
        "Using `array.shift()` for a queue in a tight loop — O(n) per call, O(n²) total.",
        "Popping an empty stack (guard `st.length`).",
        "Monotonic stack: choosing the wrong direction (increasing vs decreasing) for the question asked.",
      ],
      interviewQs: [
        "Evaluate Reverse Polish Notation.",
        "Daily temperatures — days until a warmer day.",
        "Implement a queue using two stacks (and analyze amortized cost).",
      ],
    },
    {
      id: "dsa-linkedlist",
      title: "Linked Lists",
      tags: ["fundamentals", "pointers"],
      brushup: [
        "Node = value + next pointer (doubly linked also has prev). O(1) insert/delete given the node; O(n) to find by position.",
        "No random access, extra pointer overhead, poor cache locality vs arrays.",
        "Core tricks: dummy head node, reverse via 3 pointers, fast/slow for middle & cycle, merge two sorted lists.",
        "Reverse in place: prev=null; while(cur){ next=cur.next; cur.next=prev; prev=cur; cur=next }.",
        "Use a dummy node whenever the head might change (deletion, merge) to avoid special-casing.",
      ],
      detail: `
<h2>Reverse a linked list</h2>
<pre><code>function reverse(head){
  let prev = null, cur = head;
  while (cur){
    const next = cur.next;
    cur.next = prev;
    prev = cur;
    cur = next;
  }
  return prev;
}</code></pre>
<h2>Find the middle (slow/fast)</h2>
<pre><code>function middle(head){
  let slow = head, fast = head;
  while (fast &amp;&amp; fast.next){ slow = slow.next; fast = fast.next.next; }
  return slow;                 // for even length, returns second middle
}</code></pre>
<h2>Merge two sorted lists with a dummy node</h2>
<pre><code>function mergeTwoLists(a, b){
  const dummy = { next: null }; let tail = dummy;
  while (a &amp;&amp; b){
    if (a.val &lt;= b.val){ tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = a || b;
  return dummy.next;
}</code></pre>
<h2>Detect start of cycle</h2>
<p>After slow/fast meet, reset one pointer to head and advance both by 1; they meet at the cycle entry (Floyd's).</p>`,
      pitfalls: [
        "Losing the rest of the list — always save `next` before rewiring `cur.next`.",
        "Not handling empty list / single node.",
        "Creating a cycle by accident when reversing a sublist.",
        "Returning `head` when the head was deleted — return `dummy.next`.",
      ],
      interviewQs: [
        "Remove the N-th node from the end in one pass.",
        "Detect a cycle and return the node where it begins.",
        "Reverse nodes in k-group.",
      ],
    },
    {
      id: "dsa-recursion",
      title: "Recursion & Backtracking",
      tags: ["patterns", "recursion"],
      brushup: [
        "Every recursion needs a base case + a recursive step that moves toward it.",
        "Recursion tree depth = stack space. Deep linear recursion can stack-overflow (~10⁴–10⁵ frames).",
        "Backtracking = DFS over choices: choose → explore → un-choose (restore state).",
        "Prune early (bounds, sorting, skip duplicates) to cut exponential trees.",
        "Subsets: 2ⁿ. Permutations: n!. Combinations: C(n,k). Know these to estimate feasibility.",
        "Tail recursion / memoization / converting to iteration are the escape hatches.",
      ],
      detail: `
<h2>Backtracking template</h2>
<pre><code>function subsets(nums){
  const res = [], path = [];
  function dfs(i){
    if (i === nums.length){ res.push([...path]); return; }
    // choice 1: skip nums[i]
    dfs(i + 1);
    // choice 2: take nums[i]
    path.push(nums[i]);
    dfs(i + 1);
    path.pop();                 // un-choose
  }
  dfs(0);
  return res;
}</code></pre>
<h2>Permutations with a used[] array</h2>
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
<h2>Pruning: skip duplicates</h2>
<pre><code>nums.sort((a,b)=&gt;a-b);
// inside the loop:
if (i &gt; start &amp;&amp; nums[i] === nums[i - 1]) continue;</code></pre>
<p>The key insight: backtracking explores a decision tree. The path array is shared mutable state — anything you push, you must pop on the way back up.</p>`,
      pitfalls: [
        "Pushing `path` (a reference) into results instead of a copy `[...path]`.",
        "Forgetting to undo state after the recursive call.",
        "No base case, or base case unreachable ⇒ stack overflow.",
        "Exponential blowup you could have pruned (e.g. not sorting to skip duplicates).",
      ],
      interviewQs: [
        "Generate all valid combinations of n pairs of parentheses.",
        "N-Queens — count/return all board configurations.",
        "Word search in a grid (DFS + visited).",
      ],
    },
    {
      id: "dsa-trees",
      title: "Trees & Binary Search Trees",
      tags: ["trees", "recursion"],
      brushup: [
        "Binary tree: each node ≤ 2 children. BST: left subtree &lt; node &lt; right subtree ⇒ in-order traversal is sorted.",
        "Traversals: pre (root,L,R), in (L,root,R), post (L,R,root), level-order (BFS with a queue).",
        "BST search/insert/delete = O(h); h = log n if balanced, n if degenerate. Balanced variants: AVL, Red-Black.",
        "Height-balanced check, LCA, diameter, path sum — all clean recursive DFS.",
        "Serialize/deserialize with pre-order + null markers.",
        "For 'k-th smallest in BST' do an in-order traversal and stop at k.",
      ],
      detail: `
<h2>Traversals</h2>
<pre><code>function inorder(root, out = []){
  if (!root) return out;
  inorder(root.left, out);
  out.push(root.val);
  inorder(root.right, out);
  return out;
}

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
<h2>Validate a BST (bounds pattern)</h2>
<pre><code>function isValidBST(root, lo = -Infinity, hi = Infinity){
  if (!root) return true;
  if (root.val &lt;= lo || root.val &gt;= hi) return false;
  return isValidBST(root.left, lo, root.val) &amp;&amp; isValidBST(root.right, root.val, hi);
}</code></pre>
<h2>Lowest Common Ancestor (binary tree)</h2>
<pre><code>function lca(root, p, q){
  if (!root || root === p || root === q) return root;
  const L = lca(root.left, p, q), R = lca(root.right, p, q);
  if (L &amp;&amp; R) return root;      // p and q split here
  return L || R;
}</code></pre>`,
      diagram: `<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" font-family="monospace" font-size="12">
<g stroke="#888" stroke-width="1.5">
<line x1="160" y1="30" x2="90" y2="80"/><line x1="160" y1="30" x2="230" y2="80"/>
<line x1="90" y1="80" x2="55" y2="130"/><line x1="90" y1="80" x2="125" y2="130"/>
<line x1="230" y1="80" x2="265" y2="130"/></g>
<g fill="#3b82f6"><circle cx="160" cy="30" r="16"/><circle cx="90" cy="80" r="16"/><circle cx="230" cy="80" r="16"/>
<circle cx="55" cy="130" r="16"/><circle cx="125" cy="130" r="16"/><circle cx="265" cy="130" r="16"/></g>
<g fill="#fff" text-anchor="middle" dominant-baseline="middle">
<text x="160" y="30">8</text><text x="90" y="80">3</text><text x="230" y="80">10</text>
<text x="55" y="130">1</text><text x="125" y="130">6</text><text x="265" y="130">14</text></g>
</svg>`,
      diagramCaption: "A BST — in-order traversal yields 1, 3, 6, 8, 10, 14 (sorted).",
      pitfalls: [
        "Validating a BST by only comparing node to its immediate children — you need min/max bounds from ancestors.",
        "level-order with `q.shift()` is O(n²) worst-case in JS; use an index pointer for large trees.",
        "Stack overflow on a skewed tree with deep recursion — consider iterative traversal with an explicit stack.",
      ],
      interviewQs: [
        "Serialize and deserialize a binary tree.",
        "Maximum path sum (path may not pass through root).",
        "Convert a sorted array to a height-balanced BST.",
      ],
    },
    {
      id: "dsa-heaps",
      title: "Heaps & Priority Queues",
      tags: ["heaps", "greedy"],
      brushup: [
        "Binary heap = complete tree in an array; parent at i, children at 2i+1 / 2i+2.",
        "Min-heap: parent ≤ children. push/pop = O(log n), peek = O(1), build-heap = O(n).",
        "Use for: top-K, k-th largest, merge k sorted lists, streaming median (two heaps), Dijkstra/Prim.",
        "Top-K largest ⇒ maintain a MIN-heap of size k; if new &gt; heap top, replace. O(n log k).",
        "JS has no built-in heap — implement, or use sorted insert for small k.",
      ],
      detail: `
<h2>Why a heap and not a sorted array</h2>
<p>A sorted array gives O(1) min but O(n) insert. A heap gives O(log n) for both. When you repeatedly need "the smallest/largest so far" while data keeps changing, a heap wins.</p>
<h2>Minimal min-heap</h2>
<pre><code>class MinHeap {
  constructor(){ this.a = []; }
  size(){ return this.a.length; }
  peek(){ return this.a[0]; }
  push(v){
    const a = this.a; a.push(v);
    let i = a.length - 1;
    while (i &gt; 0){
      const p = (i - 1) &gt;&gt; 1;
      if (a[p] &lt;= a[i]) break;
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
      let s = i, l = 2*i+1, r = 2*i+2;
      if (l &lt; n &amp;&amp; a[l] &lt; a[s]) s = l;
      if (r &lt; n &amp;&amp; a[r] &lt; a[s]) s = r;
      if (s === i) break;
      [a[s], a[i]] = [a[i], a[s]]; i = s;
    }
  }
}</code></pre>
<h2>K-th largest element</h2>
<pre><code>function kthLargest(nums, k){
  const h = new MinHeap();
  for (const x of nums){
    h.push(x);
    if (h.size() &gt; k) h.pop();   // keep only k largest
  }
  return h.peek();
}</code></pre>
<h2>Streaming median (two heaps)</h2>
<p>Keep a max-heap of the lower half and a min-heap of the upper half, balanced in size. Median is a heap top (or the average of both tops).</p>`,
      pitfalls: [
        "Using a max-heap for top-K largest (that's O(n log n)); the trick is a size-k min-heap.",
        "Forgetting to re-heapify after modifying an element.",
        "Comparator sign errors when storing tuples like [dist, node].",
      ],
      interviewQs: [
        "Merge k sorted linked lists.",
        "Find median from a data stream.",
        "Top K frequent elements.",
      ],
    },
    {
      id: "dsa-graphs",
      title: "Graphs — BFS, DFS, Topo Sort, Shortest Path",
      tags: ["graphs", "bfs", "dfs"],
      brushup: [
        "Represent as adjacency list (sparse, common) or matrix (dense, O(V²) space).",
        "BFS ⇒ shortest path in unweighted graphs, level-by-level. DFS ⇒ connectivity, cycle detection, topological sort.",
        "Always track visited to avoid infinite loops. For grids, visited can be an in-place marker.",
        "Topological sort (DAG): Kahn's (BFS on in-degree) or DFS post-order reversed. Detects cycles.",
        "Weighted shortest path: Dijkstra (non-negative, min-heap, O(E log V)); Bellman-Ford (handles negatives, O(VE)).",
        "Union-Find (DSU) for connected components / cycle detection in undirected graphs / Kruskal's MST.",
      ],
      detail: `
<h2>BFS shortest path (unweighted)</h2>
<pre><code>function bfsDist(adj, src){
  const dist = new Map([[src, 0]]);
  const q = [src]; let head = 0;
  while (head &lt; q.length){
    const u = q[head++];
    for (const v of adj.get(u) || []){
      if (!dist.has(v)){ dist.set(v, dist.get(u) + 1); q.push(v); }
    }
  }
  return dist;
}</code></pre>
<h2>Cycle detection in a directed graph (DFS colors)</h2>
<pre><code>function hasCycle(adj, n){
  const color = new Array(n).fill(0);  // 0=unseen,1=in-stack,2=done
  const dfs = u =&gt; {
    color[u] = 1;
    for (const v of adj[u]){
      if (color[v] === 1) return true;       // back edge
      if (color[v] === 0 &amp;&amp; dfs(v)) return true;
    }
    color[u] = 2;
    return false;
  };
  for (let i = 0; i &lt; n; i++) if (color[i] === 0 &amp;&amp; dfs(i)) return true;
  return false;
}</code></pre>
<h2>Topological sort (Kahn's)</h2>
<pre><code>function topoSort(n, edges){
  const adj = Array.from({length: n}, () =&gt; []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges){ adj[u].push(v); indeg[v]++; }
  const q = []; for (let i = 0; i &lt; n; i++) if (!indeg[i]) q.push(i);
  const order = []; let head = 0;
  while (head &lt; q.length){
    const u = q[head++]; order.push(u);
    for (const v of adj[u]) if (--indeg[v] === 0) q.push(v);
  }
  return order.length === n ? order : null;   // null ⇒ cycle
}</code></pre>
<h2>Dijkstra</h2>
<pre><code>function dijkstra(adj, src, n){ // adj[u] = [[v, w], ...]
  const dist = new Array(n).fill(Infinity); dist[src] = 0;
  const pq = new MinHeap();      // stores [d, node], compare on d
  pq.push([0, src]);
  while (pq.size()){
    const [d, u] = pq.pop();
    if (d &gt; dist[u]) continue;
    for (const [v, w] of adj[u]){
      if (d + w &lt; dist[v]){ dist[v] = d + w; pq.push([dist[v], v]); }
    }
  }
  return dist;
}</code></pre>`,
      pitfalls: [
        "Marking visited when popping instead of when pushing in BFS ⇒ duplicates in the queue.",
        "Using Dijkstra with negative edges (silently wrong) — use Bellman-Ford.",
        "Grid DFS without bounds checks or without restoring/marking visited.",
        "Forgetting disconnected components — loop over all nodes as DFS/BFS roots.",
      ],
      interviewQs: [
        "Number of islands / connected components.",
        "Course schedule (can all courses be finished?) — cycle detection.",
        "Word ladder — shortest transformation sequence (BFS).",
        "Clone a graph.",
      ],
    },
    {
      id: "dsa-dp",
      title: "Dynamic Programming",
      tags: ["dp", "optimization"],
      brushup: [
        "DP applies when a problem has <b>optimal substructure</b> + <b>overlapping subproblems</b>.",
        "Two forms: top-down (recursion + memo) or bottom-up (fill a table).",
        "Steps: define the state, write the recurrence/transition, set base cases, decide iteration order, optimize space.",
        "Classic families: 0/1 knapsack, unbounded knapsack (coin change), LIS, LCS/edit distance, matrix path, interval DP, DP on trees, bitmask DP.",
        "Often you only need the last row/column ⇒ reduce O(n·m) space to O(m).",
        "If greedy gives the right answer, prefer it — DP is heavier.",
      ],
      detail: `
<h2>The recipe</h2>
<ol>
<li><b>State</b>: what parameters uniquely describe a subproblem? e.g. <code>dp[i]</code> = LIS ending at i.</li>
<li><b>Transition</b>: express <code>dp[state]</code> from smaller states.</li>
<li><b>Base case</b>: smallest states directly.</li>
<li><b>Order</b>: iterate so dependencies are computed first.</li>
<li><b>Answer</b>: which state (or max/sum over states)?</li>
</ol>
<h2>Coin change (min coins) — unbounded knapsack</h2>
<pre><code>function coinChange(coins, amount){
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a &lt;= amount; a++){
    for (const c of coins){
      if (c &lt;= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}</code></pre>
<h2>Longest Common Subsequence</h2>
<pre><code>function lcs(a, b){
  const m = a.length, n = b.length;
  const dp = Array.from({length: m + 1}, () =&gt; new Array(n + 1).fill(0));
  for (let i = 1; i &lt;= m; i++)
    for (let j = 1; j &lt;= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1
                                   : Math.max(dp[i-1][j], dp[i][j-1]);
  return dp[m][n];
}</code></pre>
<h2>0/1 Knapsack</h2>
<pre><code>function knapsack(wt, val, W){
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i &lt; wt.length; i++)
    for (let w = W; w &gt;= wt[i]; w--)          // iterate weight downward for 0/1
      dp[w] = Math.max(dp[w], dp[w - wt[i]] + val[i]);
  return dp[W];
}</code></pre>
<h2>Top-down template</h2>
<pre><code>function solve(i, memo = new Map()){
  if (baseCase(i)) return baseValue;
  if (memo.has(i)) return memo.get(i);
  const ans = /* combine solve(smaller) */;
  memo.set(i, ans);
  return ans;
}</code></pre>`,
      pitfalls: [
        "0/1 knapsack with a forward inner loop — that becomes unbounded (item reused).",
        "Wrong iteration order so a state reads an uncomputed neighbor.",
        "Memo key doesn't capture full state (e.g. forgot a dimension).",
        "Off-by-one between 1-indexed strings and 0-indexed arrays in LCS/edit distance.",
      ],
      interviewQs: [
        "Edit distance between two strings.",
        "House robber (I and II — circular).",
        "Longest increasing subsequence in O(n log n).",
        "Word break — can s be segmented using the dictionary?",
        "Unique paths in a grid with obstacles.",
      ],
    },
    {
      id: "dsa-sorting",
      title: "Sorting & Binary Search",
      tags: ["sorting", "searching"],
      brushup: [
        "Merge sort: O(n log n) always, stable, O(n) space, good for linked lists / external sort.",
        "Quicksort: O(n log n) avg, O(n²) worst (bad pivots), in-place, not stable. Randomize pivot.",
        "Heap sort: O(n log n), in-place, not stable.",
        "Counting/radix sort: O(n + k) for bounded integer keys — beats the comparison lower bound O(n log n).",
        "Binary search needs a monotonic predicate, not just a sorted array: 'smallest x such that f(x) is true'.",
        "Binary search on the answer: guess a value, check feasibility in O(n), narrow the range.",
      ],
      detail: `
<h2>Binary search — the safe template</h2>
<pre><code>// lower_bound: first index where a[i] &gt;= target
function lowerBound(a, target){
  let lo = 0, hi = a.length;          // [lo, hi)
  while (lo &lt; hi){
    const mid = (lo + hi) &gt;&gt; 1;
    if (a[mid] &lt; target) lo = mid + 1;
    else hi = mid;
  }
  return lo;                          // 0..a.length
}</code></pre>
<h2>Binary search on the answer</h2>
<pre><code>// Koko eating bananas: min speed k so she finishes piles in h hours
function minEatingSpeed(piles, h){
  const feasible = k =&gt; piles.reduce((s, p) =&gt; s + Math.ceil(p / k), 0) &lt;= h;
  let lo = 1, hi = Math.max(...piles);
  while (lo &lt; hi){
    const mid = (lo + hi) &gt;&gt; 1;
    if (feasible(mid)) hi = mid; else lo = mid + 1;
  }
  return lo;
}</code></pre>
<h2>Merge sort core</h2>
<pre><code>function mergeSort(a){
  if (a.length &lt;= 1) return a;
  const mid = a.length &gt;&gt; 1;
  const L = mergeSort(a.slice(0, mid)), R = mergeSort(a.slice(mid));
  const out = []; let i = 0, j = 0;
  while (i &lt; L.length &amp;&amp; j &lt; R.length) out.push(L[i] &lt;= R[j] ? L[i++] : R[j++]);
  return out.concat(L.slice(i), R.slice(j));
}</code></pre>
<h3>Quickselect — k-th smallest in O(n) average</h3>
<p>Partition like quicksort, but recurse into only the side containing k.</p>`,
      pitfalls: [
        "`(lo + hi) / 2` overflow in languages with fixed-width ints — use `lo + (hi - lo) / 2`.",
        "Infinite loop from wrong boundary update (mid vs mid±1).",
        "Assuming JS `arr.sort()` sorts numbers — it sorts lexicographically without a comparator.",
        "Binary search when the predicate isn't monotonic.",
      ],
      interviewQs: [
        "Search in a rotated sorted array.",
        "Find first and last position of a target.",
        "Median of two sorted arrays (hard, O(log(m+n))).",
        "Split array into k parts minimizing the largest sum.",
      ],
    },
    {
      id: "dsa-advanced",
      title: "Tries, Union-Find & Bit Manipulation",
      tags: ["trie", "dsu", "bits"],
      brushup: [
        "Trie: prefix tree, each node has ≤ 26 children + isEnd flag. Insert/search word in O(L).",
        "Use tries for autocomplete, prefix search, word dictionaries, XOR-maximization.",
        "Union-Find (DSU): near-O(1) union & find with path compression + union by rank/size.",
        "DSU uses: connected components, cycle detection (undirected), Kruskal's MST, dynamic connectivity.",
        "Bit tricks: x &amp; (x-1) clears lowest set bit; x &amp; -x isolates it; XOR finds the unique element; use a bitmask as a set of ≤ 32 items.",
      ],
      detail: `
<h2>Trie</h2>
<pre><code>class Trie {
  constructor(){ this.root = {}; }
  insert(word){
    let node = this.root;
    for (const c of word) node = node[c] ??= {};
    node.$ = true;                 // end-of-word marker
  }
  search(word){
    let node = this.root;
    for (const c of word){ if (!node[c]) return false; node = node[c]; }
    return !!node.$;
  }
  startsWith(prefix){
    let node = this.root;
    for (const c of prefix){ if (!node[c]) return false; node = node[c]; }
    return true;
  }
}</code></pre>
<h2>Union-Find</h2>
<pre><code>class DSU {
  constructor(n){ this.p = [...Array(n).keys()]; this.r = new Array(n).fill(0); }
  find(x){ return this.p[x] === x ? x : (this.p[x] = this.find(this.p[x])); }
  union(a, b){
    a = this.find(a); b = this.find(b);
    if (a === b) return false;                 // already connected ⇒ cycle
    if (this.r[a] &lt; this.r[b]) [a, b] = [b, a];
    this.p[b] = a;
    if (this.r[a] === this.r[b]) this.r[a]++;
    return true;
  }
}</code></pre>
<h2>Bit manipulation essentials</h2>
<pre><code>const isSet   = (x, i) =&gt; (x &gt;&gt; i) &amp; 1;
const setBit  = (x, i) =&gt; x | (1 &lt;&lt; i);
const clearLow = x =&gt; x &amp; (x - 1);       // remove lowest set bit
const lowest  = x =&gt; x &amp; -x;             // isolate lowest set bit
const countBits = x =&gt; { let c = 0; while (x){ x &amp;= x - 1; c++; } return c; };

// single number: every element appears twice except one
function singleNumber(nums){ return nums.reduce((a, b) =&gt; a ^ b, 0); }

// iterate all subsets of a bitmask
for (let sub = mask; sub &gt; 0; sub = (sub - 1) &amp; mask) { /* use sub */ }</code></pre>`,
      pitfalls: [
        "DSU without path compression + rank ⇒ O(n) find, defeats the purpose.",
        "Trie memory blow-up — use a Map or object, free unused branches if needed.",
        "JS bitwise ops are 32-bit signed; `1 << 31` is negative, and numbers above 2³¹ break.",
        "XOR trick only works when all-but-one appear an even number of times.",
      ],
      interviewQs: [
        "Implement an autocomplete / word dictionary with wildcard '.'.",
        "Number of connected components in an undirected graph (DSU).",
        "Maximum XOR of two numbers in an array (bitwise trie).",
        "Subsets via bitmask enumeration.",
      ],
    },
  ],
});
