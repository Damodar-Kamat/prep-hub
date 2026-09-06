/* DSA practice — batch 2. Appends to the set from problems.js.
   Same shape: statement / examples / concept / fnName / starter / tests / hints / solution. */
window.STUDY_PROBLEMS = window.STUDY_PROBLEMS || [];
window.STUDY_PROBLEMS.push(
  {
    id: "longest-consecutive",
    title: "Longest Consecutive Sequence",
    difficulty: "Medium",
    tags: ["Array", "Hashing"],
    relatedTopic: "/topic/dsa/dsa-hashing?m=deep",
    statement: `<p>Given an unsorted array <code>nums</code>, return the length of the longest run of consecutive integers (order in the array doesn't matter). Must run in O(n).</p>`,
    examples: [
      { in: "nums = [100,4,200,1,3,2]", out: "4", explain: "The run [1,2,3,4]." },
      { in: "nums = [0,3,7,2,5,8,4,6,0,1]", out: "9" },
    ],
    concept: `<p>Put everything in a <code>Set</code>. A number <code>x</code> is the <em>start</em> of a run only if <code>x-1</code> is not in the set — count upward from each start. Every element is visited at most twice total, so it's O(n) despite the inner loop.</p>`,
    fnName: "longestConsecutive",
    starter: `function longestConsecutive(nums) {\n  \n}\n`,
    tests: [
      { input: [[100, 4, 200, 1, 3, 2]], expected: 4 },
      { input: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9 },
      { input: [[]], expected: 0 },
      { input: [[1, 2, 0, 1]], expected: 3, hidden: true },
      { input: [[9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6]], expected: 7, hidden: true },
    ],
    hints: ["Sorting is O(n log n) — the target is O(n).", "A hash set gives O(1) 'is x present?'.", "Only start counting a run at its smallest element (no x-1 in the set)."],
    solution: `<pre><code>function longestConsecutive(nums) {
  const set = new Set(nums);
  let best = 0;
  for (const x of set) {
    if (set.has(x - 1)) continue;      // not the start of a run
    let len = 1;
    while (set.has(x + len)) len++;
    best = Math.max(best, len);
  }
  return best;
}</code></pre>`,
  },

  {
    id: "two-sum-ii",
    title: "Two Sum II — Input Array Is Sorted",
    difficulty: "Medium",
    tags: ["Two Pointers", "Binary Search"],
    relatedTopic: "/topic/dsa/dsa-twopointers?m=deep",
    statement: `<p><code>numbers</code> is sorted ascending. Return the <b>1-indexed</b> positions <code>[i, j]</code> (i &lt; j) of the two values that sum to <code>target</code>. Exactly one solution; O(1) extra space.</p>`,
    examples: [
      { in: "numbers = [2,7,11,15], target = 9", out: "[1,2]" },
      { in: "numbers = [2,3,4], target = 6", out: "[1,3]" },
    ],
    concept: `<p>Because it's sorted, converging two pointers work: if the sum is too small, move <code>left</code> up; too big, move <code>right</code> down. O(n) time, O(1) space (beats the hash-map version's space).</p>`,
    fnName: "twoSum",
    starter: `function twoSum(numbers, target) {\n  // return [i, j], 1-indexed, i < j\n}\n`,
    tests: [
      { input: [[2, 7, 11, 15], 9], expected: [1, 2] },
      { input: [[2, 3, 4], 6], expected: [1, 3] },
      { input: [[-1, 0], -1], expected: [1, 2] },
      { input: [[1, 2, 3, 4, 4, 9, 56, 90], 8], expected: [4, 5], hidden: true },
      { input: [[5, 25, 75], 100], expected: [2, 3], hidden: true },
    ],
    hints: ["The array is sorted — what does that unlock?", "Two pointers from both ends.", "sum < target → left++; sum > target → right--; else done."],
    solution: `<pre><code>function twoSum(numbers, target) {
  let l = 0, r = numbers.length - 1;
  while (l < r) {
    const s = numbers[l] + numbers[r];
    if (s === target) return [l + 1, r + 1];
    s < target ? l++ : r--;
  }
  return [];
}</code></pre>`,
  },

  {
    id: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: "Medium",
    tags: ["Two Pointers", "Greedy"],
    relatedTopic: "/topic/dsa/dsa-twopointers?m=deep",
    statement: `<p><code>height[i]</code> is a vertical line at position <code>i</code>. Pick two lines that with the x-axis form a container holding the most water. Return that maximum area.</p>`,
    examples: [
      { in: "height = [1,8,6,2,5,4,8,3,7]", out: "49", explain: "Lines at index 1 and 8: min(8,7) × (8−1) = 49." },
      { in: "height = [1,1]", out: "1" },
    ],
    concept: `<p>Area = <code>min(h[l], h[r]) × (r − l)</code>. Start wide (<code>l=0, r=n-1</code>) and always move the <em>shorter</em> line inward — moving the taller one can only shrink the width without a chance of a taller minimum. O(n).</p>`,
    fnName: "maxArea",
    starter: `function maxArea(height) {\n  \n}\n`,
    tests: [
      { input: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
      { input: [[1, 1]], expected: 1 },
      { input: [[4, 3, 2, 1, 4]], expected: 16 },
      { input: [[1, 2, 1]], expected: 2, hidden: true },
      { input: [[2, 3, 4, 5, 18, 17, 6]], expected: 17, hidden: true },
    ],
    hints: ["Brute force is O(n²) over all pairs.", "Start with the widest container.", "Move whichever pointer has the shorter line — the taller line can't help there."],
    solution: `<pre><code>function maxArea(height) {
  let l = 0, r = height.length - 1, best = 0;
  while (l < r) {
    best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
    height[l] < height[r] ? l++ : r--;
  }
  return best;
}</code></pre>`,
  },

  {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    tags: ["Two Pointers", "DP", "Stack"],
    relatedTopic: "/topic/dsa/dsa-twopointers?m=deep",
    statement: `<p>Given an elevation map <code>height[]</code> (each bar width 1), compute how much rain water it traps.</p>`,
    examples: [
      { in: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", out: "6" },
      { in: "height = [4,2,0,3,2,5]", out: "9" },
    ],
    concept: `<p>Water above bar <code>i</code> = <code>min(maxLeft[i], maxRight[i]) − height[i]</code>. Two pointers avoid the O(n) prefix arrays: move the side with the smaller running max, because that side's water level is determined. O(n) time, O(1) space.</p>`,
    fnName: "trap",
    starter: `function trap(height) {\n  \n}\n`,
    tests: [
      { input: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 },
      { input: [[4, 2, 0, 3, 2, 5]], expected: 9 },
      { input: [[]], expected: 0 },
      { input: [[2, 0, 2]], expected: 2, hidden: true },
      { input: [[5, 4, 1, 2]], expected: 1, hidden: true },
      { input: [[1, 2, 3, 4, 5]], expected: 0, hidden: true },
    ],
    hints: ["Water over a bar depends on the tallest bar to its left and to its right.", "You can precompute maxLeft[] and maxRight[] (O(n) space)…", "…or use two pointers moving the side with the smaller max (O(1) space)."],
    solution: `<pre><code>function trap(height) {
  let l = 0, r = height.length - 1;
  let leftMax = 0, rightMax = 0, water = 0;
  while (l < r) {
    if (height[l] < height[r]) {
      leftMax = Math.max(leftMax, height[l]);
      water += leftMax - height[l];
      l++;
    } else {
      rightMax = Math.max(rightMax, height[r]);
      water += rightMax - height[r];
      r--;
    }
  }
  return water;
}</code></pre>`,
  },

  {
    id: "longest-repeating-char-replacement",
    title: "Longest Repeating Character Replacement",
    difficulty: "Medium",
    tags: ["Sliding Window", "Hashing"],
    relatedTopic: "/topic/dsa/dsa-twopointers?m=deep",
    statement: `<p>Given a string <code>s</code> of uppercase letters and an integer <code>k</code>, you may replace at most <code>k</code> characters with any letter. Return the length of the longest substring containing a single repeated letter you can obtain.</p>`,
    examples: [
      { in: 's = "ABAB", k = 2', out: "4" },
      { in: 's = "AABABBA", k = 1', out: "4", explain: 'Replace the one B in "AABA" → "AAAA", or similar.' },
    ],
    concept: `<p>Sliding window. A window is valid when <code>(window length − count of its most frequent char) ≤ k</code> — that many replacements make it uniform. Grow the right edge; when invalid, slide the left edge. Tracking the running max frequency (not decrementing it) is the classic trick and still correct for the answer.</p>`,
    fnName: "characterReplacement",
    starter: `function characterReplacement(s, k) {\n  \n}\n`,
    tests: [
      { input: ["ABAB", 2], expected: 4 },
      { input: ["AABABBA", 1], expected: 4 },
      { input: ["AAAA", 0], expected: 4 },
      { input: ["ABCDE", 1], expected: 2, hidden: true },
      { input: ["AAAABBBB", 2], expected: 6, hidden: true },
    ],
    hints: ["Window is valid if len − maxFreqInWindow ≤ k.", "Grow right; if the window becomes invalid, move left by one.", "You can keep a running max frequency without ever decreasing it."],
    solution: `<pre><code>function characterReplacement(s, k) {
  const count = {};
  let start = 0, maxFreq = 0, best = 0;
  for (let end = 0; end < s.length; end++) {
    count[s[end]] = (count[s[end]] || 0) + 1;
    maxFreq = Math.max(maxFreq, count[s[end]]);
    while ((end - start + 1) - maxFreq > k) {
      count[s[start]]--;
      start++;
    }
    best = Math.max(best, end - start + 1);
  }
  return best;
}</code></pre>`,
  },

  {
    id: "permutation-in-string",
    title: "Permutation in String",
    difficulty: "Medium",
    tags: ["Sliding Window", "Hashing"],
    relatedTopic: "/topic/dsa/dsa-twopointers?m=deep",
    statement: `<p>Return <code>true</code> if <code>s2</code> contains a permutation of <code>s1</code> as a contiguous substring.</p>`,
    examples: [
      { in: 's1 = "ab", s2 = "eidbaooo"', out: "true", explain: '"ba" is a permutation of "ab".' },
      { in: 's1 = "ab", s2 = "eidboaoo"', out: "false" },
    ],
    concept: `<p>A fixed-size window of length <code>s1.length</code> slides over <code>s2</code>; it's a match when its character-frequency vector equals <code>s1</code>'s. Maintain the window counts incrementally (add entering char, remove leaving char). O(n).</p>`,
    fnName: "checkInclusion",
    starter: `function checkInclusion(s1, s2) {\n  \n}\n`,
    tests: [
      { input: ["ab", "eidbaooo"], expected: true },
      { input: ["ab", "eidboaoo"], expected: false },
      { input: ["adc", "dcda"], expected: true },
      { input: ["hello", "ooolleoooleh"], expected: false, hidden: true },
      { input: ["a", "ab"], expected: true, hidden: true },
      { input: ["abc", "ccccbbbbaaaa"], expected: false, hidden: true },
    ],
    hints: ["The window size is fixed = s1.length.", "Compare frequency counts, not the substring itself.", "Update counts in O(1) as the window slides."],
    solution: `<pre><code>function checkInclusion(s1, s2) {
  if (s1.length > s2.length) return false;
  const need = new Array(26).fill(0), win = new Array(26).fill(0);
  const idx = c => c.charCodeAt(0) - 97;
  for (const c of s1) need[idx(c)]++;
  for (let i = 0; i < s2.length; i++) {
    win[idx(s2[i])]++;
    if (i >= s1.length) win[idx(s2[i - s1.length])]--;
    if (i >= s1.length - 1 && need.every((v, j) => v === win[j])) return true;
  }
  return false;
}</code></pre>`,
  },

  {
    id: "min-window-substring",
    title: "Minimum Window Substring",
    difficulty: "Hard",
    tags: ["Sliding Window", "Hashing"],
    relatedTopic: "/topic/dsa/dsa-twopointers?m=deep",
    statement: `<p>Given strings <code>s</code> and <code>t</code>, return the shortest substring of <code>s</code> that contains every character of <code>t</code> (including duplicates). If none exists, return <code>""</code>. The answer is unique for the given tests.</p>`,
    examples: [
      { in: 's = "ADOBECODEBANC", t = "ABC"', out: '"BANC"' },
      { in: 's = "a", t = "a"', out: '"a"' },
      { in: 's = "a", t = "aa"', out: '""' },
    ],
    concept: `<p>Variable sliding window. <code>need</code> = required counts; <code>have</code> = how many required characters the window currently satisfies. Expand right until the window is valid, then shrink from the left while it stays valid, recording the smallest. O(|s| + |t|).</p>`,
    fnName: "minWindow",
    starter: `function minWindow(s, t) {\n  \n}\n`,
    tests: [
      { input: ["ADOBECODEBANC", "ABC"], expected: "BANC" },
      { input: ["a", "a"], expected: "a" },
      { input: ["a", "aa"], expected: "" },
      { input: ["cabwefgewcwaefgcf", "cae"], expected: "cwae", hidden: true },
      { input: ["aa", "aa"], expected: "aa", hidden: true },
      { input: ["abc", "b"], expected: "b", hidden: true },
    ],
    hints: ["Track how many distinct required chars are fully satisfied (`have` vs `need` size).", "Expand right to become valid; then contract left while still valid.", "Record the window whenever it's valid and shorter than the best so far."],
    solution: `<pre><code>function minWindow(s, t) {
  if (!t || s.length < t.length) return "";
  const need = new Map();
  for (const c of t) need.set(c, (need.get(c) || 0) + 1);
  let required = need.size, formed = 0;
  const win = new Map();
  let l = 0, bestLen = Infinity, bestL = 0;
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    win.set(c, (win.get(c) || 0) + 1);
    if (need.has(c) && win.get(c) === need.get(c)) formed++;
    while (formed === required) {
      if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
      const lc = s[l];
      win.set(lc, win.get(lc) - 1);
      if (need.has(lc) && win.get(lc) < need.get(lc)) formed--;
      l++;
    }
  }
  return bestLen === Infinity ? "" : s.slice(bestL, bestL + bestLen);
}</code></pre>`,
  },

  {
    id: "evaluate-rpn",
    title: "Evaluate Reverse Polish Notation",
    difficulty: "Medium",
    tags: ["Stack", "Math"],
    relatedTopic: "/topic/dsa/dsa-stackqueue?m=deep",
    statement: `<p>Evaluate an arithmetic expression in Reverse Polish Notation. Valid operators are <code>+ - * /</code>; division truncates toward zero. Return the integer result.</p>`,
    examples: [
      { in: 'tokens = ["2","1","+","3","*"]', out: "9", explain: "(2 + 1) × 3." },
      { in: 'tokens = ["4","13","5","/","+"]', out: "6", explain: "4 + (13 / 5) = 4 + 2." },
    ],
    concept: `<p>Push numbers onto a stack. On an operator, pop the top two (order matters: <code>b</code> then <code>a</code>, compute <code>a op b</code>), push the result. One value remains at the end. O(n).</p>`,
    fnName: "evalRPN",
    starter: `function evalRPN(tokens) {\n  \n}\n`,
    tests: [
      { input: [["2", "1", "+", "3", "*"]], expected: 9 },
      { input: [["4", "13", "5", "/", "+"]], expected: 6 },
      { input: [["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]], expected: 22 },
      { input: [["3", "-4", "+"]], expected: -1, hidden: true },
      { input: [["-7", "2", "/"]], expected: -3, hidden: true },
    ],
    hints: ["A stack of operands.", "An operator pops two, pushes one.", "Mind the operand order for `-` and `/`, and truncate division toward zero."],
    solution: `<pre><code>function evalRPN(tokens) {
  const st = [];
  const ops = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => Math.trunc(a / b),
  };
  for (const tok of tokens) {
    if (tok in ops && tok.length <= 2 && isNaN(Number(tok))) {
      const b = st.pop(), a = st.pop();
      st.push(ops[tok](a, b));
    } else {
      st.push(Number(tok));
    }
  }
  return st.pop();
}</code></pre>`,
  },

  {
    id: "generate-parentheses",
    title: "Generate Parentheses",
    difficulty: "Medium",
    tags: ["Backtracking", "Stack"],
    relatedTopic: "/topic/dsa/dsa-recursion?m=deep",
    statement: `<p>Given <code>n</code> pairs of parentheses, return all combinations of well-formed parentheses. Order of the returned list does not matter.</p>`,
    examples: [
      { in: "n = 3", out: '["((()))","(()())","(())()","()(())","()()()"]' },
      { in: "n = 1", out: '["()"]' },
    ],
    concept: `<p>Backtracking. Track how many <code>(</code> and <code>)</code> you've placed. You may add <code>(</code> while <code>open &lt; n</code>, and <code>)</code> while <code>close &lt; open</code> (never close more than you've opened). Record when the string reaches length <code>2n</code>. There are Catalan(n) results.</p>`,
    fnName: "generateParenthesis",
    starter: `function generateParenthesis(n) {\n  \n}\n`,
    tests: [
      { input: [3], expected: ["((()))", "(()())", "(())()", "()(())", "()()()"], unordered: true },
      { input: [1], expected: ["()"], unordered: true },
      { input: [2], expected: ["(())", "()()"], unordered: true },
      { input: [4], expected: ["(((())))", "((()()))", "((())())", "((()))()", "(()(()))", "(()()())", "(()())()", "(())(())", "(())()()", "()((()))", "()(()())", "()(())()", "()()(())", "()()()()"], unordered: true, hidden: true },
    ],
    hints: ["Build the string character by character.", "Add '(' only if you have opens left; add ')' only if it wouldn't exceed the opens placed.", "Record the result when the string length is 2n."],
    solution: `<pre><code>function generateParenthesis(n) {
  const res = [];
  function bt(cur, open, close) {
    if (cur.length === 2 * n) { res.push(cur); return; }
    if (open < n) bt(cur + '(', open + 1, close);
    if (close < open) bt(cur + ')', open, close + 1);
  }
  bt('', 0, 0);
  return res;
}</code></pre>`,
  },

  {
    id: "daily-temperatures",
    title: "Daily Temperatures",
    difficulty: "Medium",
    tags: ["Stack", "Monotonic Stack"],
    relatedTopic: "/topic/dsa/dsa-stackqueue?m=deep",
    statement: `<p>Given daily <code>temperatures</code>, return an array where <code>answer[i]</code> is the number of days until a warmer temperature, or <code>0</code> if there is none.</p>`,
    examples: [
      { in: "temperatures = [73,74,75,71,69,72,76,73]", out: "[1,1,4,2,1,1,0,0]" },
      { in: "temperatures = [30,40,50,60]", out: "[1,1,1,0]" },
    ],
    concept: `<p>Monotonic decreasing stack of <em>indices</em>. When today's temperature exceeds the temperature at the stack top, pop it and record the day gap. Each index is pushed and popped once ⇒ O(n).</p>`,
    fnName: "dailyTemperatures",
    starter: `function dailyTemperatures(temperatures) {\n  \n}\n`,
    tests: [
      { input: [[73, 74, 75, 71, 69, 72, 76, 73]], expected: [1, 1, 4, 2, 1, 1, 0, 0] },
      { input: [[30, 40, 50, 60]], expected: [1, 1, 1, 0] },
      { input: [[30, 60, 90]], expected: [1, 1, 0] },
      { input: [[90, 80, 70]], expected: [0, 0, 0], hidden: true },
      { input: [[55, 55, 55, 60]], expected: [3, 2, 1, 0], hidden: true },
    ],
    hints: ["For each day you want the next strictly greater value to its right.", "Keep a stack of indices whose answer is still unknown.", "When temperatures[i] beats the stack top, that top's answer is i − top."],
    solution: `<pre><code>function dailyTemperatures(temperatures) {
  const res = new Array(temperatures.length).fill(0);
  const st = []; // indices, temperatures decreasing
  for (let i = 0; i < temperatures.length; i++) {
    while (st.length && temperatures[i] > temperatures[st[st.length - 1]]) {
      const j = st.pop();
      res[j] = i - j;
    }
    st.push(i);
  }
  return res;
}</code></pre>`,
  },

  {
    id: "koko-eating-bananas",
    title: "Koko Eating Bananas",
    difficulty: "Medium",
    tags: ["Binary Search"],
    relatedTopic: "/topic/dsa/dsa-sorting?m=deep",
    statement: `<p><code>piles[i]</code> bananas in pile <code>i</code>. Koko eats at speed <code>k</code> bananas/hour: each hour she picks a pile and eats <code>k</code> from it (or the whole pile if smaller). Return the minimum integer <code>k</code> so she finishes all piles within <code>h</code> hours.</p>`,
    examples: [
      { in: "piles = [3,6,7,11], h = 8", out: "4" },
      { in: "piles = [30,11,23,4,20], h = 5", out: "30" },
    ],
    concept: `<p>Binary search on the answer. Hours needed at speed <code>k</code> is <code>Σ ceil(pile / k)</code>, which decreases as <code>k</code> grows — monotonic. Search <code>k</code> in <code>[1, max(piles)]</code> for the smallest feasible value.</p>`,
    fnName: "minEatingSpeed",
    starter: `function minEatingSpeed(piles, h) {\n  \n}\n`,
    tests: [
      { input: [[3, 6, 7, 11], 8], expected: 4 },
      { input: [[30, 11, 23, 4, 20], 5], expected: 30 },
      { input: [[30, 11, 23, 4, 20], 6], expected: 23 },
      { input: [[312884470], 968709470], expected: 1, hidden: true },
      { input: [[1000000000], 2], expected: 500000000, hidden: true },
    ],
    hints: ["The answer is a speed between 1 and max(piles).", "feasible(k) = total hours at speed k ≤ h, and it's monotonic in k.", "Binary search for the smallest feasible k."],
    solution: `<pre><code>function minEatingSpeed(piles, h) {
  const hoursAt = k => piles.reduce((s, p) => s + Math.ceil(p / k), 0);
  let lo = 1, hi = Math.max(...piles);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (hoursAt(mid) <= h) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}</code></pre>`,
  },

  {
    id: "find-min-rotated",
    title: "Find Minimum in Rotated Sorted Array",
    difficulty: "Medium",
    tags: ["Binary Search"],
    relatedTopic: "/topic/dsa/dsa-sorting?m=deep",
    statement: `<p>An ascending array of <b>distinct</b> integers was rotated some number of times. Return the minimum element in O(log n).</p>`,
    examples: [
      { in: "nums = [3,4,5,1,2]", out: "1" },
      { in: "nums = [4,5,6,7,0,1,2]", out: "0" },
      { in: "nums = [11,13,15,17]", out: "11" },
    ],
    concept: `<p>Binary search on the rotation. If <code>nums[mid] &gt; nums[hi]</code>, the pivot (minimum) is in <code>(mid, hi]</code>; otherwise it's in <code>[lo, mid]</code>. Converge until <code>lo === hi</code>.</p>`,
    fnName: "findMin",
    starter: `function findMin(nums) {\n  \n}\n`,
    tests: [
      { input: [[3, 4, 5, 1, 2]], expected: 1 },
      { input: [[4, 5, 6, 7, 0, 1, 2]], expected: 0 },
      { input: [[11, 13, 15, 17]], expected: 11 },
      { input: [[2, 1]], expected: 1, hidden: true },
      { input: [[5, 1, 2, 3, 4]], expected: 1, hidden: true },
      { input: [[1]], expected: 1, hidden: true },
    ],
    hints: ["Compare nums[mid] to nums[hi], not nums[lo].", "nums[mid] > nums[hi] ⇒ the min is strictly right of mid.", "Otherwise the min is at mid or to its left."],
    solution: `<pre><code>function findMin(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] > nums[hi]) lo = mid + 1;
    else hi = mid;
  }
  return nums[lo];
}</code></pre>`,
  },

  {
    id: "search-2d-matrix",
    title: "Search a 2D Matrix",
    difficulty: "Medium",
    tags: ["Binary Search", "Matrix"],
    relatedTopic: "/topic/dsa/dsa-sorting?m=deep",
    statement: `<p>Each row of <code>matrix</code> is sorted ascending, and the first integer of each row is greater than the last integer of the previous row. Return <code>true</code> if <code>target</code> is present. O(log(m·n)).</p>`,
    examples: [
      { in: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3", out: "true" },
      { in: "same matrix, target = 13", out: "false" },
    ],
    concept: `<p>The whole matrix is one sorted sequence read row by row. Binary search over indices <code>0 … m·n−1</code>, mapping index <code>x</code> to <code>matrix[Math.floor(x / cols)][x % cols]</code>.</p>`,
    fnName: "searchMatrix",
    starter: `function searchMatrix(matrix, target) {\n  \n}\n`,
    tests: [
      { input: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3], expected: true },
      { input: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13], expected: false },
      { input: [[[1]], 1], expected: true },
      { input: [[[1, 1]], 2], expected: false, hidden: true },
      { input: [[[1, 3], [5, 7]], 5], expected: true, hidden: true },
    ],
    hints: ["Treat the matrix as a flat sorted array of length m*n.", "index x ↔ row x/cols, col x%cols.", "Standard binary search on [0, m*n-1]."],
    solution: `<pre><code>function searchMatrix(matrix, target) {
  const rows = matrix.length, cols = matrix[0].length;
  let lo = 0, hi = rows * cols - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const v = matrix[Math.floor(mid / cols)][mid % cols];
    if (v === target) return true;
    if (v < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}</code></pre>`,
  },

  {
    id: "min-cost-climbing-stairs",
    title: "Min Cost Climbing Stairs",
    difficulty: "Easy",
    tags: ["DP"],
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p><code>cost[i]</code> is the cost of step <code>i</code>. You can climb 1 or 2 steps at a time, starting from step 0 or step 1. Return the minimum cost to reach the top (just past the last step).</p>`,
    examples: [
      { in: "cost = [10,15,20]", out: "15", explain: "Start at index 1, pay 15, step 2 to the top." },
      { in: "cost = [1,100,1,1,1,100,1,1,100,1]", out: "6" },
    ],
    concept: `<p><code>dp[i]</code> = min cost to <em>stand on</em> step <code>i</code> = <code>cost[i] + min(dp[i-1], dp[i-2])</code>. The answer is <code>min(dp[n-1], dp[n-2])</code> (you can finish from either of the last two). O(1) space with two rolling variables.</p>`,
    fnName: "minCostClimbingStairs",
    starter: `function minCostClimbingStairs(cost) {\n  \n}\n`,
    tests: [
      { input: [[10, 15, 20]], expected: 15 },
      { input: [[1, 100, 1, 1, 1, 100, 1, 1, 100, 1]], expected: 6 },
      { input: [[0, 0, 0, 0]], expected: 0 },
      { input: [[1, 2]], expected: 1, hidden: true },
      { input: [[10, 15]], expected: 10, hidden: true },
    ],
    hints: ["dp[i] = cost to reach step i.", "dp[i] = cost[i] + min(dp[i-1], dp[i-2]).", "Answer = min of the last two dp values (top is past the last step)."],
    solution: `<pre><code>function minCostClimbingStairs(cost) {
  let a = 0, b = 0;                 // dp[i-2], dp[i-1]
  for (let i = 2; i <= cost.length; i++) {
    const cur = Math.min(b + cost[i - 1], a + cost[i - 2]);
    a = b; b = cur;
  }
  return b;
}</code></pre>`,
  },

  {
    id: "house-robber-ii",
    title: "House Robber II",
    difficulty: "Medium",
    tags: ["DP"],
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p>Houses are arranged in a <b>circle</b> — the first and last are adjacent. You can't rob two adjacent houses. Return the max you can rob.</p>`,
    examples: [
      { in: "nums = [2,3,2]", out: "3", explain: "Can't rob houses 0 and 2 (adjacent in the circle)." },
      { in: "nums = [1,2,3,1]", out: "4" },
    ],
    concept: `<p>The circle breaks into two linear problems: rob houses <code>[0 … n-2]</code> (exclude the last) or <code>[1 … n-1]</code> (exclude the first). Run the linear House Robber on each and take the max. Handle <code>n === 1</code> separately.</p>`,
    fnName: "rob",
    starter: `function rob(nums) {\n  \n}\n`,
    tests: [
      { input: [[2, 3, 2]], expected: 3 },
      { input: [[1, 2, 3, 1]], expected: 4 },
      { input: [[1]], expected: 1 },
      { input: [[1, 2, 3]], expected: 3, hidden: true },
      { input: [[200, 3, 140, 20, 10]], expected: 340, hidden: true },
    ],
    hints: ["The first and last houses can't both be robbed.", "So take max(rob(nums without last), rob(nums without first)).", "Each of those is the plain linear House Robber."],
    solution: `<pre><code>function rob(nums) {
  if (nums.length === 1) return nums[0];
  const linear = arr => {
    let prev2 = 0, prev1 = 0;
    for (const x of arr) {
      const cur = Math.max(prev1, prev2 + x);
      prev2 = prev1; prev1 = cur;
    }
    return prev1;
  };
  return Math.max(linear(nums.slice(0, -1)), linear(nums.slice(1)));
}</code></pre>`,
  },

  {
    id: "word-break",
    title: "Word Break",
    difficulty: "Medium",
    tags: ["DP", "Hashing"],
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p>Given a string <code>s</code> and a dictionary <code>wordDict</code>, return <code>true</code> if <code>s</code> can be segmented into a space-separated sequence of one or more dictionary words (words may be reused).</p>`,
    examples: [
      { in: 's = "leetcode", wordDict = ["leet","code"]', out: "true" },
      { in: 's = "applepenapple", wordDict = ["apple","pen"]', out: "true" },
      { in: 's = "catsandog", wordDict = ["cats","dog","sand","and","cat"]', out: "false" },
    ],
    concept: `<p><code>dp[i]</code> = "can <code>s[0..i)</code> be segmented". <code>dp[0] = true</code>. <code>dp[i]</code> is true if some <code>j &lt; i</code> has <code>dp[j]</code> true and <code>s[j..i)</code> is in the dictionary. O(n²) (times word length).</p>`,
    fnName: "wordBreak",
    starter: `function wordBreak(s, wordDict) {\n  \n}\n`,
    tests: [
      { input: ["leetcode", ["leet", "code"]], expected: true },
      { input: ["applepenapple", ["apple", "pen"]], expected: true },
      { input: ["catsandog", ["cats", "dog", "sand", "and", "cat"]], expected: false },
      { input: ["a", ["a"]], expected: true, hidden: true },
      { input: ["aaaaaaa", ["aaaa", "aaa"]], expected: true, hidden: true },
      { input: ["abcd", ["a", "abc", "b", "cd"]], expected: true, hidden: true },
    ],
    hints: ["dp[i] = can the first i characters be segmented.", "dp[i] is true if dp[j] is true and s.slice(j, i) is a word.", "Base case dp[0] = true."],
    solution: `<pre><code>function wordBreak(s, wordDict) {
  const words = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && words.has(s.slice(j, i))) { dp[i] = true; break; }
    }
  }
  return dp[s.length];
}</code></pre>`,
  },

  {
    id: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence",
    difficulty: "Medium",
    tags: ["DP", "Binary Search"],
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p>Return the length of the longest strictly increasing subsequence of <code>nums</code> (elements need not be contiguous).</p>`,
    examples: [
      { in: "nums = [10,9,2,5,3,7,101,18]", out: "4", explain: "[2,3,7,101] or [2,3,7,18]." },
      { in: "nums = [0,1,0,3,2,3]", out: "4" },
      { in: "nums = [7,7,7,7]", out: "1" },
    ],
    concept: `<p>O(n²): <code>dp[i]</code> = LIS ending at <code>i</code> = <code>1 + max(dp[j])</code> over <code>j &lt; i</code> with <code>nums[j] &lt; nums[i]</code>. O(n log n): keep <code>tails[]</code> where <code>tails[k]</code> is the smallest possible tail of an increasing subsequence of length <code>k+1</code>; binary-search each number's slot.</p>`,
    fnName: "lengthOfLIS",
    starter: `function lengthOfLIS(nums) {\n  \n}\n`,
    tests: [
      { input: [[10, 9, 2, 5, 3, 7, 101, 18]], expected: 4 },
      { input: [[0, 1, 0, 3, 2, 3]], expected: 4 },
      { input: [[7, 7, 7, 7]], expected: 1 },
      { input: [[1]], expected: 1, hidden: true },
      { input: [[4, 10, 4, 3, 8, 9]], expected: 3, hidden: true },
      { input: [[1, 3, 6, 7, 9, 4, 10, 5, 6]], expected: 6, hidden: true },
    ],
    hints: ["O(n²): dp[i] over all earlier smaller elements.", "O(n log n): maintain the smallest tail for each achievable length.", "Binary-search where each new value replaces a tail (or extends)."],
    solution: `<pre><code>// O(n log n) patience sorting
function lengthOfLIS(nums) {
  const tails = [];
  for (const x of nums) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1; else hi = mid;
    }
    tails[lo] = x;                 // replace, or append if lo === tails.length
  }
  return tails.length;
}</code></pre>`,
  },

  {
    id: "jump-game",
    title: "Jump Game",
    difficulty: "Medium",
    tags: ["Greedy", "DP"],
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p><code>nums[i]</code> is the maximum jump length from index <code>i</code>. Starting at index 0, return <code>true</code> if you can reach the last index.</p>`,
    examples: [
      { in: "nums = [2,3,1,1,4]", out: "true" },
      { in: "nums = [3,2,1,0,4]", out: "false", explain: "You always land on index 3 (value 0) and get stuck." },
    ],
    concept: `<p>Greedy: track the furthest index reachable so far. Scan left to right; if the current index exceeds <code>reach</code>, you're stuck → false. Update <code>reach = max(reach, i + nums[i])</code>. O(n).</p>`,
    fnName: "canJump",
    starter: `function canJump(nums) {\n  \n}\n`,
    tests: [
      { input: [[2, 3, 1, 1, 4]], expected: true },
      { input: [[3, 2, 1, 0, 4]], expected: false },
      { input: [[0]], expected: true },
      { input: [[2, 0, 0]], expected: true, hidden: true },
      { input: [[1, 0, 1, 0]], expected: false, hidden: true },
      { input: [[5, 0, 0, 0, 0, 0]], expected: true, hidden: true },
    ],
    hints: ["You don't need which path — just whether the end is reachable.", "Track the furthest index you can currently reach.", "If i ever exceeds that furthest reach, return false."],
    solution: `<pre><code>function canJump(nums) {
  let reach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return false;
    reach = Math.max(reach, i + nums[i]);
  }
  return true;
}</code></pre>`,
  },

  {
    id: "gas-station",
    title: "Gas Station",
    difficulty: "Medium",
    tags: ["Greedy"],
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p><code>gas[i]</code> is fuel available at station <code>i</code>; <code>cost[i]</code> is fuel to drive from <code>i</code> to <code>i+1</code> (circular). Return the starting station index from which you can complete the loop, or <code>-1</code>. The answer is unique if it exists.</p>`,
    examples: [
      { in: "gas = [1,2,3,4,5], cost = [3,4,5,1,2]", out: "3" },
      { in: "gas = [2,3,4], cost = [3,4,3]", out: "-1" },
    ],
    concept: `<p>If <code>Σgas &lt; Σcost</code>, it's impossible → <code>-1</code>. Otherwise a unique start exists. Track a running tank; whenever it goes negative at station <code>i</code>, no start in <code>[start … i]</code> works, so set <code>start = i + 1</code> and reset the tank. O(n).</p>`,
    fnName: "canCompleteCircuit",
    starter: `function canCompleteCircuit(gas, cost) {\n  \n}\n`,
    tests: [
      { input: [[1, 2, 3, 4, 5], [3, 4, 5, 1, 2]], expected: 3 },
      { input: [[2, 3, 4], [3, 4, 3]], expected: -1 },
      { input: [[5, 1, 2, 3, 4], [4, 4, 1, 5, 1]], expected: 4 },
      { input: [[3, 3, 4], [3, 4, 4]], expected: -1, hidden: true },
      { input: [[4], [5]], expected: -1, hidden: true },
      { input: [[2], [2]], expected: 0, hidden: true },
    ],
    hints: ["First check feasibility: total gas vs total cost.", "Walk once, keeping a running tank.", "When the tank dips below 0, restart the candidate at the next station."],
    solution: `<pre><code>function canCompleteCircuit(gas, cost) {
  let total = 0, tank = 0, start = 0;
  for (let i = 0; i < gas.length; i++) {
    const diff = gas[i] - cost[i];
    total += diff;
    tank += diff;
    if (tank < 0) { start = i + 1; tank = 0; }
  }
  return total >= 0 ? start : -1;
}</code></pre>`,
  },

  {
    id: "single-number",
    title: "Single Number",
    difficulty: "Easy",
    tags: ["Bit Manipulation"],
    relatedTopic: "/topic/dsa/dsa-advanced?m=deep",
    statement: `<p>Every element in <code>nums</code> appears twice except one. Find that one, in O(n) time and O(1) extra space.</p>`,
    examples: [
      { in: "nums = [2,2,1]", out: "1" },
      { in: "nums = [4,1,2,1,2]", out: "4" },
    ],
    concept: `<p>XOR is its own inverse: <code>x ^ x = 0</code> and <code>x ^ 0 = x</code>. XOR-ing every element cancels the pairs and leaves the unique value. O(n) time, O(1) space (a hash set would be O(n) space).</p>`,
    fnName: "singleNumber",
    starter: `function singleNumber(nums) {\n  \n}\n`,
    tests: [
      { input: [[2, 2, 1]], expected: 1 },
      { input: [[4, 1, 2, 1, 2]], expected: 4 },
      { input: [[1]], expected: 1 },
      { input: [[7, 3, 7, 3, 9]], expected: 9, hidden: true },
      { input: [[-1, -1, -3]], expected: -3, hidden: true },
    ],
    hints: ["Which operation cancels a value with itself?", "XOR: a ^ a = 0.", "Fold XOR across the whole array."],
    solution: `<pre><code>function singleNumber(nums) {
  return nums.reduce((acc, x) => acc ^ x, 0);
}</code></pre>`,
  },
);
