/* DSA practice problems. Each: statement/examples/concept/hints/solution + a JS test harness.
   tests[i] = { input: [args...], expected, hidden?, unordered? } */
window.STUDY_PROBLEMS = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    tags: ["Array", "Hashing"],
    relatedTopic: "/topic/dsa/dsa-hashing?m=deep",
    statement: `<p>Given an array <code>nums</code> and an integer <code>target</code>, return the indices of the two numbers that add up to <code>target</code>. Exactly one solution exists; you may not use the same element twice. Return the indices in ascending order.</p>`,
    examples: [
      { in: "nums = [2,7,11,15], target = 9", out: "[0,1]", explain: "nums[0] + nums[1] = 2 + 7 = 9." },
      { in: "nums = [3,2,4], target = 6", out: "[1,2]" },
    ],
    constraints: ["2 <= nums.length <= 1e4", "-1e9 <= nums[i], target <= 1e9"],
    concept: `<p>The brute force checks every pair — O(n²). The key idea: as you scan, for each <code>x</code> you need <code>target - x</code>. A hash map of <em>value → index</em> lets you check "have I already seen the complement?" in O(1), so one pass is O(n) time, O(n) space.</p>
<pre><code>seen = {}
for i, x in nums:
    if (target - x) in seen: return [seen[target - x], i]
    seen[x] = i</code></pre>`,
    fnName: "twoSum",
    starter: `function twoSum(nums, target) {\n  // return [i, j] with nums[i] + nums[j] === target\n}\n`,
    tests: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] },
      { input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4], hidden: true },
      { input: [[0, 4, 3, 0], 0], expected: [0, 3], hidden: true },
    ],
    hints: [
      "Brute force is two nested loops. What repeated work can you cache?",
      "For each number x, you're looking for target - x. A hash map answers 'seen it?' in O(1).",
      "Store each number's index as you go; check for the complement <em>before</em> inserting the current number.",
    ],
    solution: `<p><b>O(n) / O(n)</b> — single pass with a complement map.</p>
<pre><code>function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i &lt; nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}</code></pre>
<p>Because we insert <em>after</em> checking, we never pair an element with itself. Indices come out ascending since the earlier index was stored first.</p>`,
  },

  {
    id: "valid-anagram",
    title: "Valid Anagram",
    difficulty: "Easy",
    tags: ["String", "Hashing", "Sorting"],
    relatedTopic: "/topic/dsa/dsa-hashing?m=deep",
    statement: `<p>Given two strings <code>s</code> and <code>t</code>, return <code>true</code> if <code>t</code> is an anagram of <code>s</code> (same characters, same counts), else <code>false</code>.</p>`,
    examples: [
      { in: 's = "anagram", t = "nagaram"', out: "true" },
      { in: 's = "rat", t = "car"', out: "false" },
    ],
    concept: `<p>Two approaches: (1) sort both and compare — O(n log n); (2) count character frequencies and compare the counts — O(n) time, O(1) space for a fixed alphabet. Frequency counting is the canonical hashing pattern: increment for one string, decrement for the other, then check all zero.</p>`,
    fnName: "isAnagram",
    starter: `function isAnagram(s, t) {\n  \n}\n`,
    tests: [
      { input: ["anagram", "nagaram"], expected: true },
      { input: ["rat", "car"], expected: false },
      { input: ["a", "ab"], expected: false },
      { input: ["", ""], expected: true, hidden: true },
      { input: ["aacc", "ccac"], expected: false, hidden: true },
    ],
    hints: [
      "If the lengths differ, it's an immediate false.",
      "A Map<char, count> (or a 26-length array for lowercase) is enough.",
      "Add for s, subtract for t; any non-zero count at the end means not an anagram.",
    ],
    solution: `<pre><code>function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const count = new Map();
  for (const c of s) count.set(c, (count.get(c) || 0) + 1);
  for (const c of t) {
    if (!count.get(c)) return false;
    count.set(c, count.get(c) - 1);
  }
  return true;
}</code></pre>`,
  },

  {
    id: "contains-duplicate",
    title: "Contains Duplicate",
    difficulty: "Easy",
    tags: ["Array", "Hashing"],
    statement: `<p>Return <code>true</code> if any value appears at least twice in <code>nums</code>, and <code>false</code> if every element is distinct.</p>`,
    examples: [
      { in: "nums = [1,2,3,1]", out: "true" },
      { in: "nums = [1,2,3,4]", out: "false" },
    ],
    concept: `<p>A <code>Set</code> gives O(1) membership. Insert as you scan; if a value is already present, you've found a duplicate. O(n) time, O(n) space. (Sorting first would be O(n log n) time, O(1) extra space.)</p>`,
    fnName: "containsDuplicate",
    starter: `function containsDuplicate(nums) {\n  \n}\n`,
    tests: [
      { input: [[1, 2, 3, 1]], expected: true },
      { input: [[1, 2, 3, 4]], expected: false },
      { input: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true },
      { input: [[]], expected: false, hidden: true },
      { input: [[-1, -1]], expected: true, hidden: true },
    ],
    hints: ["A hash set answers 'have I seen this before?' in O(1).", "You can also compare nums.length to new Set(nums).size."],
    solution: `<pre><code>function containsDuplicate(nums) {
  const seen = new Set();
  for (const x of nums) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}
// one-liner: return new Set(nums).size !== nums.length;</code></pre>`,
  },

  {
    id: "best-time-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    tags: ["Array", "Greedy", "DP"],
    relatedTopic: "/topic/dsa/dsa-arrays?m=deep",
    statement: `<p><code>prices[i]</code> is the price of a stock on day <code>i</code>. Buy on one day and sell on a later day. Return the maximum profit, or <code>0</code> if no profit is possible.</p>`,
    examples: [
      { in: "prices = [7,1,5,3,6,4]", out: "5", explain: "Buy at 1 (day 1), sell at 6 (day 4)." },
      { in: "prices = [7,6,4,3,1]", out: "0", explain: "Prices only fall; don't trade." },
    ],
    concept: `<p>Track the minimum price seen so far. For each day, the best profit ending today is <code>price - minSoFar</code>. Keep the running max. One pass, O(n) time, O(1) space — no need to consider all pairs.</p>`,
    fnName: "maxProfit",
    starter: `function maxProfit(prices) {\n  \n}\n`,
    tests: [
      { input: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { input: [[7, 6, 4, 3, 1]], expected: 0 },
      { input: [[1]], expected: 0 },
      { input: [[2, 4, 1]], expected: 2, hidden: true },
      { input: [[3, 2, 6, 5, 0, 3]], expected: 4, hidden: true },
    ],
    hints: [
      "You want to buy low and sell high, with buy before sell.",
      "As you scan left to right, keep the cheapest price so far.",
      "Best sell today = today's price minus cheapest-so-far. Track the max of that.",
    ],
    solution: `<pre><code>function maxProfit(prices) {
  let minPrice = Infinity, best = 0;
  for (const p of prices) {
    minPrice = Math.min(minPrice, p);
    best = Math.max(best, p - minPrice);
  }
  return best;
}</code></pre>`,
  },

  {
    id: "max-subarray",
    title: "Maximum Subarray",
    difficulty: "Medium",
    tags: ["Array", "DP", "Greedy"],
    relatedTopic: "/topic/dsa/dsa-arrays?m=deep",
    statement: `<p>Find the contiguous subarray (at least one element) with the largest sum and return that sum.</p>`,
    examples: [
      { in: "nums = [-2,1,-3,4,-1,2,1,-5,4]", out: "6", explain: "[4,-1,2,1] sums to 6." },
      { in: "nums = [5,4,-1,7,8]", out: "23" },
    ],
    concept: `<p><b>Kadane's algorithm.</b> Let <code>cur</code> be the best subarray sum ending at the current index. Either extend the previous one (<code>cur + x</code>) or start fresh at <code>x</code> — take the larger. The answer is the max <code>cur</code> over all indices. The insight: a prefix with negative sum can only hurt what follows, so drop it.</p>`,
    fnName: "maxSubArray",
    starter: `function maxSubArray(nums) {\n  \n}\n`,
    tests: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { input: [[5, 4, -1, 7, 8]], expected: 23 },
      { input: [[-1]], expected: -1 },
      { input: [[-2, -1]], expected: -1, hidden: true },
      { input: [[1, 2, 3, 4, 5]], expected: 15, hidden: true },
      { input: [[-5, -2, -8, -1]], expected: -1, hidden: true },
    ],
    hints: [
      "Think about the best subarray that ends exactly at index i.",
      "At each element decide: extend the previous run, or restart here.",
      "cur = max(x, cur + x); best = max(best, cur). Initialize both to nums[0].",
    ],
    solution: `<pre><code>function maxSubArray(nums) {
  let cur = nums[0], best = nums[0];
  for (let i = 1; i &lt; nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}</code></pre>
<p>O(n) time, O(1) space. Handles all-negative arrays because we start <code>best</code> at <code>nums[0]</code>, not 0.</p>`,
  },

  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    tags: ["Stack", "String"],
    relatedTopic: "/topic/dsa/dsa-stackqueue?m=deep",
    statement: `<p>Given a string of <code>()[]{}</code>, decide whether every bracket is closed by the matching type in the correct order.</p>`,
    examples: [
      { in: 's = "()[]{}"', out: "true" },
      { in: 's = "(]"', out: "false" },
      { in: 's = "([)]"', out: "false" },
    ],
    concept: `<p>Bracket matching is the textbook stack use. Push every opening bracket. On a closing bracket, the top of the stack must be its partner — otherwise fail. At the end the stack must be empty (no unclosed brackets).</p>`,
    fnName: "isValid",
    starter: `function isValid(s) {\n  \n}\n`,
    tests: [
      { input: ["()[]{}"], expected: true },
      { input: ["(]"], expected: false },
      { input: ["([)]"], expected: false },
      { input: ["{[]}"], expected: true },
      { input: ["("], expected: false, hidden: true },
      { input: [""], expected: true, hidden: true },
      { input: ["]"], expected: false, hidden: true },
    ],
    hints: [
      "Which structure gives you 'most recently opened' in O(1)? A stack.",
      "Map each closing bracket to its opening bracket.",
      "Closing bracket with an empty stack or a mismatched top ⇒ false. Non-empty stack at the end ⇒ false.",
    ],
    solution: `<pre><code>function isValid(s) {
  const st = [];
  const match = { ')': '(', ']': '[', '}': '{' };
  for (const c of s) {
    if (c in match) {
      if (st.pop() !== match[c]) return false;
    } else {
      st.push(c);
    }
  }
  return st.length === 0;
}</code></pre>`,
  },

  {
    id: "move-zeroes",
    title: "Move Zeroes",
    difficulty: "Easy",
    tags: ["Array", "Two Pointers"],
    relatedTopic: "/topic/dsa/dsa-twopointers?m=deep",
    statement: `<p>Move all <code>0</code>s in <code>nums</code> to the end while keeping the relative order of the non-zero elements. Do it in place and <b>return the array</b>.</p>`,
    examples: [
      { in: "nums = [0,1,0,3,12]", out: "[1,3,12,0,0]" },
      { in: "nums = [0]", out: "[0]" },
    ],
    concept: `<p>Two-pointer, slow/fast. <code>write</code> marks where the next non-zero belongs. Scan with <code>read</code>; whenever <code>nums[read]</code> is non-zero, put it at <code>nums[write]</code> and advance <code>write</code>. Then fill the rest with zeros. O(n) time, O(1) space, order preserved.</p>`,
    fnName: "moveZeroes",
    starter: `function moveZeroes(nums) {\n  // modify nums in place, then:\n  return nums;\n}\n`,
    tests: [
      { input: [[0, 1, 0, 3, 12]], expected: [1, 3, 12, 0, 0] },
      { input: [[0]], expected: [0] },
      { input: [[1, 2, 3]], expected: [1, 2, 3] },
      { input: [[0, 0, 1]], expected: [1, 0, 0], hidden: true },
      { input: [[4, 0, 5, 0, 0, 6]], expected: [4, 5, 6, 0, 0, 0], hidden: true },
    ],
    hints: [
      "Keep a pointer for the position where the next non-zero value should land.",
      "First pass: compact all non-zeros to the front. Second pass: zero-fill the tail.",
      "Or swap nums[write] and nums[read] when nums[read] != 0 to do it in one pass.",
    ],
    solution: `<pre><code>function moveZeroes(nums) {
  let write = 0;
  for (let read = 0; read &lt; nums.length; read++) {
    if (nums[read] !== 0) {
      [nums[write], nums[read]] = [nums[read], nums[write]];
      write++;
    }
  }
  return nums;
}</code></pre>`,
  },

  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    tags: ["String", "Sliding Window", "Hashing"],
    relatedTopic: "/topic/dsa/dsa-twopointers?m=deep",
    statement: `<p>Given a string <code>s</code>, return the length of the longest substring with no repeated characters.</p>`,
    examples: [
      { in: 's = "abcabcbb"', out: "3", explain: '"abc".' },
      { in: 's = "bbbbb"', out: "1" },
      { in: 's = "pwwkew"', out: "3", explain: '"wke" (note "pwke" is a subsequence, not substring).' },
    ],
    concept: `<p><b>Variable sliding window.</b> Maintain a window <code>[start, end]</code> that always has distinct characters. Expand <code>end</code>; when <code>s[end]</code> was already inside the window, jump <code>start</code> to just past its previous position. Track the max window size. Each index is visited once ⇒ O(n).</p>`,
    fnName: "lengthOfLongestSubstring",
    starter: `function lengthOfLongestSubstring(s) {\n  \n}\n`,
    tests: [
      { input: ["abcabcbb"], expected: 3 },
      { input: ["bbbbb"], expected: 1 },
      { input: ["pwwkew"], expected: 3 },
      { input: [""], expected: 0 },
      { input: [" "], expected: 1, hidden: true },
      { input: ["dvdf"], expected: 3, hidden: true },
      { input: ["abba"], expected: 2, hidden: true },
    ],
    hints: [
      "Keep a window of unique characters; grow the right side each step.",
      "Store the last index where you saw each character.",
      "When you see a repeat, move start to max(start, lastIndex[c] + 1) — don't let start move backward.",
    ],
    solution: `<pre><code>function lengthOfLongestSubstring(s) {
  const last = new Map();
  let start = 0, best = 0;
  for (let end = 0; end &lt; s.length; end++) {
    const c = s[end];
    if (last.has(c) &amp;&amp; last.get(c) &gt;= start) start = last.get(c) + 1;
    last.set(c, end);
    best = Math.max(best, end - start + 1);
  }
  return best;
}</code></pre>`,
  },

  {
    id: "product-except-self",
    title: "Product of Array Except Self",
    difficulty: "Medium",
    tags: ["Array", "Prefix Sum"],
    relatedTopic: "/topic/dsa/dsa-arrays?m=deep",
    statement: `<p>Return an array <code>answer</code> where <code>answer[i]</code> is the product of all elements of <code>nums</code> except <code>nums[i]</code>. Do it without division, in O(n).</p>`,
    examples: [
      { in: "nums = [1,2,3,4]", out: "[24,12,8,6]" },
      { in: "nums = [-1,1,0,-3,3]", out: "[0,0,9,0,0]" },
    ],
    concept: `<p><code>answer[i] = (product of everything left of i) × (product of everything right of i)</code>. Compute prefix products in one left-to-right pass, then multiply by suffix products in a right-to-left pass using a single running variable. O(n) time, O(1) extra space (output aside).</p>`,
    fnName: "productExceptSelf",
    starter: `function productExceptSelf(nums) {\n  \n}\n`,
    tests: [
      { input: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
      { input: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0] },
      { input: [[2, 3]], expected: [3, 2] },
      { input: [[0, 0]], expected: [0, 0], hidden: true },
      { input: [[5, 1, 1, 1]], expected: [1, 5, 5, 5], hidden: true },
    ],
    hints: [
      "answer[i] splits into left product and right product.",
      "First fill answer[i] with the product of everything to the left of i.",
      "Then sweep from the right with a running suffix product, multiplying into answer[i].",
    ],
    solution: `<pre><code>function productExceptSelf(nums) {
  const n = nums.length, res = new Array(n).fill(1);
  let prefix = 1;
  for (let i = 0; i &lt; n; i++) { res[i] = prefix; prefix *= nums[i]; }
  let suffix = 1;
  for (let i = n - 1; i &gt;= 0; i--) { res[i] *= suffix; suffix *= nums[i]; }
  return res;
}</code></pre>`,
  },

  {
    id: "top-k-frequent",
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    tags: ["Array", "Hashing", "Heap", "Bucket Sort"],
    relatedTopic: "/topic/dsa/dsa-heaps?m=deep",
    statement: `<p>Return the <code>k</code> most frequent elements of <code>nums</code>. The answer is unique. Order of the output does not matter.</p>`,
    examples: [
      { in: "nums = [1,1,1,2,2,3], k = 2", out: "[1,2]" },
      { in: "nums = [1], k = 1", out: "[1]" },
    ],
    concept: `<p>Count frequencies with a Map (O(n)). Then either: (a) a min-heap of size k over (freq, value) ⇒ O(n log k); or (b) <b>bucket sort</b> — index buckets by frequency (0..n), drop each value into <code>bucket[freq]</code>, then read buckets from high to low ⇒ O(n).</p>`,
    fnName: "topKFrequent",
    starter: `function topKFrequent(nums, k) {\n  \n}\n`,
    tests: [
      { input: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2], unordered: true },
      { input: [[1], 1], expected: [1], unordered: true },
      { input: [[4, 4, 4, 6, 6, 2, 2, 2, 2], 2], expected: [2, 4], unordered: true },
      { input: [[5, 5, 5, 5], 1], expected: [5], unordered: true, hidden: true },
      { input: [[-1, -1, -2, -2, -2, 3], 2], expected: [-2, -1], unordered: true, hidden: true },
    ],
    hints: [
      "Step 1 is always a frequency map.",
      "You don't need a full sort — you need the top k. Heap of size k, or bucket by frequency.",
      "Frequencies range from 1 to n, so an array of buckets indexed by frequency works.",
    ],
    solution: `<pre><code>function topKFrequent(nums, k) {
  const freq = new Map();
  for (const x of nums) freq.set(x, (freq.get(x) || 0) + 1);

  const buckets = Array.from({ length: nums.length + 1 }, () =&gt; []);
  for (const [val, f] of freq) buckets[f].push(val);

  const res = [];
  for (let f = buckets.length - 1; f &gt;= 0 &amp;&amp; res.length &lt; k; f--) {
    for (const val of buckets[f]) {
      res.push(val);
      if (res.length === k) break;
    }
  }
  return res;
}</code></pre>`,
  },

  {
    id: "binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    tags: ["Binary Search", "Array"],
    relatedTopic: "/topic/dsa/dsa-sorting?m=deep",
    statement: `<p>Given a sorted ascending array of distinct integers <code>nums</code> and a <code>target</code>, return its index, or <code>-1</code> if absent. Must run in O(log n).</p>`,
    examples: [
      { in: "nums = [-1,0,3,5,9,12], target = 9", out: "4" },
      { in: "nums = [-1,0,3,5,9,12], target = 2", out: "-1" },
    ],
    concept: `<p>Maintain a candidate range <code>[lo, hi]</code>. Compare the middle element to the target and discard half the range each step. The tricky parts are the loop condition (<code>lo &lt;= hi</code>) and updating with <code>mid ± 1</code> to guarantee progress and avoid infinite loops.</p>`,
    fnName: "search",
    starter: `function search(nums, target) {\n  \n}\n`,
    tests: [
      { input: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { input: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
      { input: [[5], 5], expected: 0 },
      { input: [[5], -5], expected: -1 },
      { input: [[2, 5], 5], expected: 1, hidden: true },
      { input: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1], expected: 0, hidden: true },
    ],
    hints: [
      "Two pointers lo and hi bounding where the target could be.",
      "mid = lo + ((hi - lo) >> 1) avoids overflow in fixed-width languages.",
      "If nums[mid] < target, the answer is in [mid+1, hi]; if greater, [lo, mid-1].",
    ],
    solution: `<pre><code>function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo &lt;= hi) {
    const mid = lo + ((hi - lo) &gt;&gt; 1);
    if (nums[mid] === target) return mid;
    if (nums[mid] &lt; target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}</code></pre>`,
  },

  {
    id: "search-rotated",
    title: "Search in Rotated Sorted Array",
    difficulty: "Medium",
    tags: ["Binary Search", "Array"],
    relatedTopic: "/topic/dsa/dsa-sorting?m=deep",
    statement: `<p>An ascending array of distinct integers was rotated at an unknown pivot (e.g. <code>[0,1,2,4,5,6,7]</code> → <code>[4,5,6,7,0,1,2]</code>). Given <code>nums</code> and <code>target</code>, return its index or <code>-1</code>, in O(log n).</p>`,
    examples: [
      { in: "nums = [4,5,6,7,0,1,2], target = 0", out: "4" },
      { in: "nums = [4,5,6,7,0,1,2], target = 3", out: "-1" },
    ],
    concept: `<p>At any midpoint, at least one half <code>[lo..mid]</code> or <code>[mid..hi]</code> is properly sorted (compare endpoints). Determine which half is sorted, check whether the target lies within its range, and recurse into the correct half. Still O(log n).</p>`,
    fnName: "search",
    starter: `function search(nums, target) {\n  \n}\n`,
    tests: [
      { input: [[4, 5, 6, 7, 0, 1, 2], 0], expected: 4 },
      { input: [[4, 5, 6, 7, 0, 1, 2], 3], expected: -1 },
      { input: [[1], 0], expected: -1 },
      { input: [[5, 1, 3], 5], expected: 0, hidden: true },
      { input: [[3, 1], 1], expected: 1, hidden: true },
      { input: [[1, 2, 3, 4, 5], 4], expected: 3, hidden: true },
    ],
    hints: [
      "One side of mid is always sorted. Figure out which by comparing nums[lo] with nums[mid].",
      "If the left side is sorted and target is in [nums[lo], nums[mid]), go left; else go right.",
      "Mirror the logic when the right side is the sorted one.",
    ],
    solution: `<pre><code>function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo &lt;= hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] &lt;= nums[mid]) {                 // left half sorted
      if (nums[lo] &lt;= target &amp;&amp; target &lt; nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {                                     // right half sorted
      if (nums[mid] &lt; target &amp;&amp; target &lt;= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}</code></pre>`,
  },

  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "Easy",
    tags: ["DP", "Math"],
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p>You climb a staircase of <code>n</code> steps, taking 1 or 2 steps at a time. How many distinct ways can you reach the top?</p>`,
    examples: [
      { in: "n = 2", out: "2", explain: "1+1, or 2." },
      { in: "n = 3", out: "3", explain: "1+1+1, 1+2, 2+1." },
    ],
    concept: `<p>To reach step <code>n</code> your last move came from step <code>n-1</code> or <code>n-2</code>, so <code>ways(n) = ways(n-1) + ways(n-2)</code> — Fibonacci. Bottom-up with two rolling variables: O(n) time, O(1) space.</p>`,
    fnName: "climbStairs",
    starter: `function climbStairs(n) {\n  \n}\n`,
    tests: [
      { input: [2], expected: 2 },
      { input: [3], expected: 3 },
      { input: [1], expected: 1 },
      { input: [5], expected: 8, hidden: true },
      { input: [10], expected: 89, hidden: true },
      { input: [45], expected: 1836311903, hidden: true },
    ],
    hints: [
      "How can you arrive at step n? Only from n-1 (one step) or n-2 (two steps).",
      "That recurrence is exactly Fibonacci.",
      "Iterate with two variables instead of recursion to avoid recomputation / stack depth.",
    ],
    solution: `<pre><code>function climbStairs(n) {
  let a = 1, b = 1;            // ways(0), ways(1)
  for (let i = 2; i &lt;= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}</code></pre>`,
  },

  {
    id: "coin-change",
    title: "Coin Change",
    difficulty: "Medium",
    tags: ["DP", "Knapsack"],
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p>Given coin denominations <code>coins</code> (unlimited supply of each) and an <code>amount</code>, return the fewest coins that sum to <code>amount</code>, or <code>-1</code> if it can't be made.</p>`,
    examples: [
      { in: "coins = [1,2,5], amount = 11", out: "3", explain: "5 + 5 + 1." },
      { in: "coins = [2], amount = 3", out: "-1" },
    ],
    concept: `<p>Unbounded knapsack. <code>dp[a]</code> = min coins to make amount <code>a</code>. Base <code>dp[0] = 0</code>. Transition: <code>dp[a] = min(dp[a - c] + 1)</code> over all coins <code>c ≤ a</code>. Fill <code>a</code> from 1 to <code>amount</code>. O(amount × coins). Greedy (largest coin first) is wrong in general — e.g. coins [1,3,4], amount 6.</p>`,
    fnName: "coinChange",
    starter: `function coinChange(coins, amount) {\n  \n}\n`,
    tests: [
      { input: [[1, 2, 5], 11], expected: 3 },
      { input: [[2], 3], expected: -1 },
      { input: [[1], 0], expected: 0 },
      { input: [[1, 3, 4], 6], expected: 2, hidden: true },
      { input: [[2, 5, 10, 1], 27], expected: 4, hidden: true },
      { input: [[186, 419, 83, 408], 6249], expected: 20, hidden: true },
    ],
    hints: [
      "Define dp[a] = minimum coins to make amount a.",
      "dp[a] depends on dp[a - coin] for each coin that fits.",
      "Initialize dp with Infinity except dp[0] = 0; the answer is dp[amount] (or -1 if still Infinity).",
    ],
    solution: `<pre><code>function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a &lt;= amount; a++) {
    for (const c of coins) {
      if (c &lt;= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}</code></pre>`,
  },

  {
    id: "house-robber",
    title: "House Robber",
    difficulty: "Medium",
    tags: ["DP"],
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p><code>nums[i]</code> is the money in house <code>i</code>. You can't rob two adjacent houses. Return the maximum you can rob.</p>`,
    examples: [
      { in: "nums = [1,2,3,1]", out: "4", explain: "Rob house 0 and 2 → 1 + 3." },
      { in: "nums = [2,7,9,3,1]", out: "12", explain: "Houses 0, 2, 4 → 2 + 9 + 1." },
    ],
    concept: `<p>At house <code>i</code> you either skip it (keep <code>dp[i-1]</code>) or rob it (<code>dp[i-2] + nums[i]</code>). <code>dp[i] = max(dp[i-1], dp[i-2] + nums[i])</code>. Only the last two values matter ⇒ O(1) space.</p>`,
    fnName: "rob",
    starter: `function rob(nums) {\n  \n}\n`,
    tests: [
      { input: [[1, 2, 3, 1]], expected: 4 },
      { input: [[2, 7, 9, 3, 1]], expected: 12 },
      { input: [[5]], expected: 5 },
      { input: [[2, 1, 1, 2]], expected: 4, hidden: true },
      { input: [[]], expected: 0, hidden: true },
      { input: [[100, 1, 1, 100]], expected: 200, hidden: true },
    ],
    hints: [
      "For each house: is it better to rob it (and skip the previous) or not?",
      "dp[i] = max(dp[i-1], dp[i-2] + nums[i]).",
      "Track just prev1 and prev2 as you sweep.",
    ],
    solution: `<pre><code>function rob(nums) {
  let prev2 = 0, prev1 = 0;   // best up to i-2, i-1
  for (const money of nums) {
    const cur = Math.max(prev1, prev2 + money);
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}</code></pre>`,
  },

  {
    id: "num-islands",
    title: "Number of Islands",
    difficulty: "Medium",
    tags: ["Graph", "BFS", "DFS", "Matrix"],
    relatedTopic: "/topic/dsa/dsa-graphs?m=deep",
    statement: `<p>Given a 2D grid of <code>'1'</code> (land) and <code>'0'</code> (water), count the islands. An island is land connected 4-directionally (up/down/left/right). You may mutate the grid.</p>`,
    examples: [
      { in: '[["1","1","0"],["1","0","0"],["0","0","1"]]', out: "2" },
    ],
    concept: `<p>Scan every cell. When you hit an unvisited <code>'1'</code>, that's a new island — increment the count and flood-fill (DFS or BFS) all connected land, marking it visited (set to <code>'0'</code>) so it isn't counted again. Each cell is visited O(1) times ⇒ O(rows × cols).</p>`,
    fnName: "numIslands",
    starter: `function numIslands(grid) {\n  \n}\n`,
    tests: [
      { input: [[["1", "1", "0"], ["1", "0", "0"], ["0", "0", "1"]]], expected: 2 },
      { input: [[["1", "1", "1"], ["0", "1", "0"], ["1", "1", "1"]]], expected: 1 },
      { input: [[["0", "0"], ["0", "0"]]], expected: 0 },
      { input: [[["1"]]], expected: 1, hidden: true },
      { input: [[["1", "0", "1", "0", "1"]]], expected: 3, hidden: true },
      { input: [[["1", "1", "1", "1", "0"], ["1", "1", "0", "1", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "0", "0", "0"]]], expected: 1, hidden: true },
    ],
    hints: [
      "Every time you find land that hasn't been visited, you've found one more island.",
      "Flood-fill from that cell, sinking all connected land so you don't recount it.",
      "DFS recursion or a BFS queue both work; guard the grid bounds.",
    ],
    solution: `<pre><code>function numIslands(grid) {
  if (!grid.length) return 0;
  const rows = grid.length, cols = grid[0].length;
  let count = 0;

  function sink(r, c) {
    if (r &lt; 0 || c &lt; 0 || r &gt;= rows || c &gt;= cols || grid[r][c] !== '1') return;
    grid[r][c] = '0';
    sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);
  }

  for (let r = 0; r &lt; rows; r++) {
    for (let c = 0; c &lt; cols; c++) {
      if (grid[r][c] === '1') { count++; sink(r, c); }
    }
  }
  return count;
}</code></pre>`,
  },

  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    tags: ["Two Pointers", "String"],
    relatedTopic: "/topic/dsa/dsa-twopointers?m=deep",
    statement: `<p>Return <code>true</code> if <code>s</code>, considering only alphanumeric characters and ignoring case, reads the same forwards and backwards.</p>`,
    examples: [
      { in: 's = "A man, a plan, a canal: Panama"', out: "true" },
      { in: 's = "race a car"', out: "false" },
    ],
    concept: `<p>Converging two pointers from both ends. Skip non-alphanumeric characters, lowercase, and compare. Mismatch ⇒ false; pointers cross ⇒ true. O(n) time, O(1) space (no need to build a cleaned string).</p>`,
    fnName: "isPalindrome",
    starter: `function isPalindrome(s) {\n  \n}\n`,
    tests: [
      { input: ["A man, a plan, a canal: Panama"], expected: true },
      { input: ["race a car"], expected: false },
      { input: [" "], expected: true },
      { input: ["0P"], expected: false, hidden: true },
      { input: ["ab_a"], expected: true, hidden: true },
    ],
    hints: [
      "Two pointers, one at each end, moving toward the middle.",
      "Advance a pointer past any character that isn't a letter or digit.",
      "Compare lowercased; if they ever differ, return false.",
    ],
    solution: `<pre><code>function isPalindrome(s) {
  const ok = c =&gt; /[a-z0-9]/i.test(c);
  let i = 0, j = s.length - 1;
  while (i &lt; j) {
    while (i &lt; j &amp;&amp; !ok(s[i])) i++;
    while (i &lt; j &amp;&amp; !ok(s[j])) j--;
    if (s[i].toLowerCase() !== s[j].toLowerCase()) return false;
    i++; j--;
  }
  return true;
}</code></pre>`,
  },

  {
    id: "three-sum",
    title: "3Sum",
    difficulty: "Medium",
    tags: ["Two Pointers", "Sorting", "Array"],
    relatedTopic: "/topic/dsa/dsa-twopointers?m=deep",
    statement: `<p>Return all unique triplets <code>[a,b,c]</code> from <code>nums</code> with <code>a + b + c === 0</code>. For a stable check: return each triplet sorted ascending, and the list of triplets sorted lexicographically.</p>`,
    examples: [
      { in: "nums = [-1,0,1,2,-1,-4]", out: "[[-1,-1,2],[-1,0,1]]" },
      { in: "nums = [0,1,1]", out: "[]" },
      { in: "nums = [0,0,0]", out: "[[0,0,0]]" },
    ],
    concept: `<p>Sort first (O(n log n)). Fix each index <code>i</code> as the smallest element, then use two pointers <code>l</code>, <code>r</code> on the remainder to find pairs summing to <code>-nums[i]</code> — O(n) per <code>i</code>, O(n²) overall. Skip duplicate values for <code>i</code>, <code>l</code>, and <code>r</code> to keep triplets unique.</p>`,
    fnName: "threeSum",
    starter: `function threeSum(nums) {\n  \n}\n`,
    tests: [
      { input: [[-1, 0, 1, 2, -1, -4]], expected: [[-1, -1, 2], [-1, 0, 1]] },
      { input: [[0, 1, 1]], expected: [] },
      { input: [[0, 0, 0]], expected: [[0, 0, 0]] },
      { input: [[-2, 0, 1, 1, 2]], expected: [[-2, 0, 2], [-2, 1, 1]], hidden: true },
      { input: [[3, -2, 1, 0]], expected: [], hidden: true },
      { input: [[-4, -2, -2, -2, 0, 1, 2, 2, 2, 3, 3, 4, 4, 6, 6]], expected: [[-4, -2, 6], [-4, 0, 4], [-4, 1, 3], [-4, 2, 2], [-2, -2, 4], [-2, 0, 2]], hidden: true },
    ],
    hints: [
      "Sorting unlocks the two-pointer technique and makes deduping easy.",
      "For each i, search the subarray to its right for two numbers summing to -nums[i].",
      "After recording a triplet, skip over equal values at l and r; also skip equal nums[i].",
    ],
    solution: `<pre><code>function threeSum(nums) {
  nums.sort((a, b) =&gt; a - b);
  const res = [];
  for (let i = 0; i &lt; nums.length - 2; i++) {
    if (i &gt; 0 &amp;&amp; nums[i] === nums[i - 1]) continue;      // skip dup anchor
    if (nums[i] &gt; 0) break;                              // no way to reach 0
    let l = i + 1, r = nums.length - 1;
    while (l &lt; r) {
      const sum = nums[i] + nums[l] + nums[r];
      if (sum === 0) {
        res.push([nums[i], nums[l], nums[r]]);
        while (l &lt; r &amp;&amp; nums[l] === nums[l + 1]) l++;
        while (l &lt; r &amp;&amp; nums[r] === nums[r - 1]) r--;
        l++; r--;
      } else if (sum &lt; 0) l++;
      else r--;
    }
  }
  return res;
}</code></pre>`,
  },

  {
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "Medium",
    tags: ["Sorting", "Array", "Intervals"],
    statement: `<p>Given an array of intervals <code>[start, end]</code>, merge all overlapping intervals and return the result sorted by start.</p>`,
    examples: [
      { in: "[[1,3],[2,6],[8,10],[15,18]]", out: "[[1,6],[8,10],[15,18]]", explain: "[1,3] and [2,6] overlap → [1,6]." },
      { in: "[[1,4],[4,5]]", out: "[[1,5]]", explain: "Touching counts as overlapping." },
    ],
    concept: `<p>Sort by start. Walk through; keep the current merged interval. If the next interval's start ≤ current end, extend the end to <code>max(end, next.end)</code>; otherwise push the current and start a new one. O(n log n) for the sort, O(n) sweep.</p>`,
    fnName: "merge",
    starter: `function merge(intervals) {\n  \n}\n`,
    tests: [
      { input: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
      { input: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
      { input: [[[1, 4], [0, 4]]], expected: [[0, 4]] },
      { input: [[[1, 4], [2, 3]]], expected: [[1, 4]], hidden: true },
      { input: [[[2, 3], [4, 5], [6, 7], [8, 9], [1, 10]]], expected: [[1, 10]], hidden: true },
    ],
    hints: [
      "Sort by start time first — overlaps can then only be with the immediately previous interval.",
      "Track the last interval in your output; either extend it or append a new one.",
      "Remember touching intervals ([1,4] and [4,5]) merge.",
    ],
    solution: `<pre><code>function merge(intervals) {
  intervals.sort((a, b) =&gt; a[0] - b[0]);
  const res = [intervals[0].slice()];
  for (let i = 1; i &lt; intervals.length; i++) {
    const last = res[res.length - 1];
    const [s, e] = intervals[i];
    if (s &lt;= last[1]) last[1] = Math.max(last[1], e);
    else res.push([s, e]);
  }
  return res;
}</code></pre>`,
  },

  {
    id: "lcs",
    title: "Longest Common Subsequence",
    difficulty: "Medium",
    tags: ["DP", "String"],
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p>Given strings <code>text1</code> and <code>text2</code>, return the length of their longest common subsequence (characters in order, not necessarily contiguous). Return 0 if there is none.</p>`,
    examples: [
      { in: 'text1 = "abcde", text2 = "ace"', out: "3", explain: '"ace".' },
      { in: 'text1 = "abc", text2 = "def"', out: "0" },
    ],
    concept: `<p>2D DP. <code>dp[i][j]</code> = LCS length of the first <code>i</code> chars of text1 and first <code>j</code> of text2. If <code>text1[i-1] === text2[j-1]</code>, <code>dp[i][j] = dp[i-1][j-1] + 1</code>; otherwise <code>max(dp[i-1][j], dp[i][j-1])</code>. O(m·n) time; can compress to O(min(m,n)) space with two rows.</p>`,
    fnName: "longestCommonSubsequence",
    starter: `function longestCommonSubsequence(text1, text2) {\n  \n}\n`,
    tests: [
      { input: ["abcde", "ace"], expected: 3 },
      { input: ["abc", "def"], expected: 0 },
      { input: ["abc", "abc"], expected: 3 },
      { input: ["bl", "yby"], expected: 1, hidden: true },
      { input: ["ezupkr", "ubmrapg"], expected: 2, hidden: true },
      { input: ["oxcpqrsvwf", "shmtulqrypy"], expected: 2, hidden: true },
    ],
    hints: [
      "Think about the last characters of each string.",
      "If they match, both strings 'use' that character and you recurse on the shorter prefixes.",
      "If they don't, drop the last char of one string or the other and take the better result.",
    ],
    solution: `<pre><code>function longestCommonSubsequence(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () =&gt; new Array(n + 1).fill(0));
  for (let i = 1; i &lt;= m; i++) {
    for (let j = 1; j &lt;= n; j++) {
      dp[i][j] = text1[i - 1] === text2[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}</code></pre>`,
  },
];
