/* DSA meta-topics appended to the DSA section: pattern recognition, the "stuck" method, company frequency lists. */
(function () {
  const dsa = (window.STUDY_SECTIONS || []).find((s) => s.id === "dsa");
  if (!dsa) return;
  dsa.topics.unshift({
    id: "dsa-patterns",
    title: "Pattern Recognition & What To Do When You're Stuck",
    summary: "The signals in a problem statement that point to the right pattern, a step-by-step method for getting unstuck, and the problems each big company asks most.",
    tags: ["patterns", "strategy", "must-know"],
    brushup: [
      "<b>Sorted array / find a pair</b> → two pointers or binary search. <b>Contiguous subarray/substring</b> → sliding window (non-negative) or prefix sums + hash map (negatives).",
      "<b>'Have I seen X?' / counts / pairs summing to k</b> → hash map. <b>Top/kth/k most</b> → heap (or quickselect).",
      "<b>Next greater/smaller, matching brackets, histogram</b> → (monotonic) stack. <b>Window max/min</b> → monotonic deque.",
      "<b>Tree</b> → DFS (recursion returning values) or BFS (levels). <b>Grid/graph connectivity</b> → DFS/BFS/Union-Find. <b>Shortest path unweighted</b> → BFS; weighted → Dijkstra. <b>Dependencies/ordering</b> → topological sort.",
      "<b>All combinations/permutations/subsets</b> → backtracking. <b>'Number of ways', 'min/max cost', 'can you reach'</b> with overlapping choices → DP.",
      "<b>Minimum X such that condition holds</b> (monotonic) → binary search on the answer. <b>Intervals</b> → sort by start (merge) or end (greedy selection).",
      "Stuck method: restate → examples → brute force → find the repeated work → match a pattern → optimize → code → test.",
      "Say your thinking out loud; ask for a hint after ~5 silent minutes — silence costs more than a hint.",
    ],
    detail: `
<h2>Signal → pattern table</h2>
<table>
<tr><th>If the problem says / has…</th><th>Think</th><th>Examples (in-app)</th></tr>
<tr><td>Sorted input, pair/triplet with a target</td><td>Two pointers, binary search</td><td>Two Sum II, 3Sum, Container With Most Water</td></tr>
<tr><td>Longest/shortest substring or subarray with a property</td><td>Sliding window (expand right, shrink left)</td><td>Longest Substring, Min Window Substring</td></tr>
<tr><td>Subarray sum equals k, with negatives</td><td>Prefix sums + hash map of counts</td><td>Subarray Sum Equals K</td></tr>
<tr><td>Frequency, duplicates, grouping</td><td>Hash map / set, canonical keys</td><td>Group Anagrams, Longest Consecutive</td></tr>
<tr><td>k largest/smallest/closest, merge sorted streams, running median</td><td>Heap(s)</td><td>Kth Largest, K Closest, Merge k Lists, Median Stream</td></tr>
<tr><td>Next greater element, spans, histogram areas</td><td>Monotonic stack</td><td>Daily Temperatures, Largest Rectangle</td></tr>
<tr><td>Max/min of every window</td><td>Monotonic deque</td><td>Sliding Window Maximum</td></tr>
<tr><td>Nested structure, undo, expression evaluation</td><td>Stack</td><td>Valid Parentheses, Decode String, Basic Calculator II</td></tr>
<tr><td>Tree path/height/validity</td><td>DFS returning a value to the parent</td><td>Diameter, Max Path Sum, Validate BST</td></tr>
<tr><td>Level-by-level, nearest, minimum steps</td><td>BFS (multi-source when many starts)</td><td>Level Order, Rotting Oranges, Word Ladder</td></tr>
<tr><td>Connected components, grouping, cycle in undirected graph</td><td>Union-Find or DFS</td><td>Number of Provinces, Redundant Connection</td></tr>
<tr><td>Prerequisites, ordering constraints</td><td>Topological sort (Kahn)</td><td>Course Schedule I/II, Alien Dictionary</td></tr>
<tr><td>Weighted shortest path</td><td>Dijkstra (non-negative), Bellman-Ford (k limits/negatives)</td><td>Network Delay Time</td></tr>
<tr><td>Generate all subsets/permutations/combinations/boards</td><td>Backtracking (choose → explore → un-choose)</td><td>Subsets, Permutations, N-Queens, Word Search</td></tr>
<tr><td>Count ways / min cost / feasibility over choices</td><td>DP (define state, recurrence, base cases)</td><td>Coin Change I/II, Decode Ways, Edit Distance</td></tr>
<tr><td>"Minimum capacity/speed/time such that…"</td><td>Binary search on the answer</td><td>Koko Eating Bananas</td></tr>
<tr><td>Intervals: merge/insert/rooms/removals</td><td>Sort by start or by end; sweep line; heap of ends</td><td>Merge/Insert Intervals, Meeting Rooms II</td></tr>
<tr><td>Prefix lookups over many words</td><td>Trie</td><td>Implement Trie, Word Search II</td></tr>
<tr><td>O(1) extra space with values in [1, n]</td><td>Index-as-hash, cyclic placement, Floyd's cycle</td><td>First Missing Positive, Find the Duplicate</td></tr>
<tr><td>Design with O(1) operations</td><td>Hash map + linked list / auxiliary stacks</td><td>LRU Cache, Min Stack</td></tr>
</table>

<h2>The "I'm stuck" method (use it out loud)</h2>
<ol>
<li><b>Restate & clarify</b>: inputs, outputs, constraints (n ≤ 10⁵ means O(n log n) or better; n ≤ 20 allows 2ⁿ), duplicates? negatives? empty?</li>
<li><b>Examples by hand</b>: a normal case and 2 edge cases. Watch what your brain does — that's often the algorithm.</li>
<li><b>Brute force first</b>: say it and its complexity. It proves you understand the problem and gives a fallback.</li>
<li><b>Find the waste</b>: what is recomputed? What do you search for repeatedly? That's where a hash map, prefix sum, heap, sorting or memoization helps.</li>
<li><b>Match the signals</b> in the table above; try the top 2 candidates on your example.</li>
<li><b>Simplify the problem</b>: solve for k = 1, for a sorted input, for a single row — then generalize.</li>
<li><b>Work backwards</b> from the answer: what must be true about the last step? (key for DP and greedy).</li>
<li><b>Ask a targeted question</b>: "I'm thinking of a sliding window but negatives break it — am I on the right track?"</li>
</ol>

<h2>Complexity budget from constraints</h2>
<table>
<tr><th>n up to</th><th>Acceptable complexity</th></tr>
<tr><td>≤ 12</td><td>O(n!)</td></tr><tr><td>≤ 25</td><td>O(2ⁿ)</td></tr><tr><td>≤ 500</td><td>O(n³)</td></tr>
<tr><td>≤ 5,000</td><td>O(n²)</td></tr><tr><td>≤ 10⁶</td><td>O(n log n)</td></tr><tr><td>≥ 10⁷</td><td>O(n) or O(log n)</td></tr>
</table>

<h2>Most-reported problems by company (practise these before the loop)</h2>
<table>
<tr><th>Company</th><th>Frequently reported</th></tr>
<tr><td>Amazon</td><td>LRU Cache, Number of Islands, Rotting Oranges, Merge k Sorted Lists, Two Sum, Trapping Rain Water, Word Ladder, Course Schedule, Top K Frequent, Meeting Rooms II, Min Stack, Kth Largest</td></tr>
<tr><td>Google</td><td>Median of Two Sorted Arrays, Next Permutation, Decode String, Edit Distance, Longest Increasing Subsequence, Network Delay Time, Time Based Key-Value Store, Insert Interval, Alien Dictionary, Regular Expression Matching</td></tr>
<tr><td>Meta</td><td>Subarray Sum Equals K, Valid Palindrome II, Basic Calculator II, Kth Largest, K Closest Points, LCA of Binary Tree, Right Side View, Merge Intervals, Minimum Window Substring, Decode Ways, Max Path Sum</td></tr>
<tr><td>Microsoft</td><td>Reverse Linked List, Spiral Matrix, Rotate Image, Sort Colors, Validate BST, Level Order, Group Anagrams, Longest Palindromic Substring, LRU Cache</td></tr>
<tr><td>Uber / Lyft</td><td>Word Ladder, Time Based Key-Value Store, Meeting Rooms II, Alien Dictionary, Asteroid Collision, Subsets, Merge k Lists</td></tr>
<tr><td>Bloomberg / finance</td><td>Min Stack, Decode String, Design Underground/Stock systems, Valid Parentheses, Sliding Window Maximum</td></tr>
</table>
<p class="muted">Frequencies drift over time — use Interview OS → Company intel to pull the latest reported questions for your target company.</p>`,
    pitfalls: [
      "Jumping to code before the brute force and the pattern are agreed.",
      "Memorizing solutions instead of recognizing signals — interviewers change one detail.",
      "Ignoring the constraints (they tell you the target complexity).",
      "Staying silent when stuck.",
    ],
    interviewQs: ["(Process) How would you approach a problem you've never seen?", "What's the brute force here and what's its complexity?", "Can you do better? What work is repeated?"],
    resources: [
      { t: "Tech Interview Handbook — algorithms cheatsheets", u: "https://www.techinterviewhandbook.org/algorithms/study-cheatsheet/", k: "article" },
      { t: "Sean Prashad — LeetCode patterns (by pattern & company)", u: "https://seanprashad.com/leetcode-patterns/", k: "practice" },
      { t: "NeetCode roadmap", u: "https://neetcode.io/roadmap", k: "practice" },
    ],
  });
})();
