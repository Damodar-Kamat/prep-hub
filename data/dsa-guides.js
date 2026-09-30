/* DSA solving guides: pattern, companies, "if stuck" steps and complexity for roadmap problems that
   aren't runnable in-app, plus wiring: roadmap entries link to in-app problems by LeetCode slug, and a
   "Big-Tech Frequent Extras" group lists in-app problems that aren't in the 150 roadmap. Loaded after problems + roadmap. */
(function () {
  const G = (window.STUDY_GUIDES = window.STUDY_GUIDES || {});
  const add = (slug, pattern, companies, steps, complexity) => (G[slug] = { pattern, companies, steps, complexity });
  const FAANG = ["Amazon", "Google", "Meta", "Microsoft"];

  // Arrays / strings / stack
  add("encode-and-decode-strings", "Length-prefix encoding", ["Google", "Meta", "LinkedIn"], ["A delimiter alone fails if strings contain it.", "Prefix each string with its length and a separator: '4#word'.", "Decode by reading digits up to '#', then exactly that many characters."], "O(total length)");
  add("valid-sudoku", "Hash sets per row / column / box", ["Amazon", "Apple", "Uber"], ["Each filled cell must be unique in its row, column and 3×3 box.", "Box index = Math.floor(r/3)*3 + Math.floor(c/3).", "One pass with 27 sets (or string keys like 'r3-5')."], "O(81) = O(1)");
  add("car-fleet", "Sort by position, stack of arrival times", ["Google", "Amazon"], ["Sort cars by position descending (closest to target first).", "Compute time to target for each: (target − pos) / speed.", "A car catching up (time ≤ fleet ahead's time) joins it; otherwise it starts a new fleet. Count fleets."], "O(n log n)");
  add("find-the-duplicate-number", "Floyd's cycle detection on indices", FAANG, ["Treat nums as a function i → nums[i]; the duplicate creates a cycle.", "Phase 1: slow/fast pointers meet inside the cycle.", "Phase 2: reset one pointer to 0; step both by one — they meet at the duplicate. (Binary search on value counts is an O(n log n) alternative.)"], "O(n) time, O(1) space");
  add("set-matrix-zeroes", "Use first row/column as markers", ["Amazon", "Microsoft", "Meta"], ["O(m+n) space: record zero rows and columns in two sets.", "O(1) space: use the first row and column as flags, plus one variable for whether the first column itself has a zero.", "Zero cells from the flags, then handle the first row/column last."], "O(m·n) time, O(1) space");
  add("happy-number", "Cycle detection (fast/slow)", ["Amazon", "Apple"], ["Repeatedly replace n with the sum of squares of its digits.", "Either you reach 1 or you loop — detect loops with a set or fast/slow pointers."], "O(log n) per step");
  add("plus-one", "Carry from the end", ["Google", "Amazon"], ["Walk from the last digit: if < 9, increment and return.", "Otherwise set to 0 and continue.", "If all were 9, prepend 1."], "O(n)");
  add("powx-n", "Fast exponentiation (binary)", ["Meta", "Amazon", "Google"], ["x^n = (x^(n/2))² — halve the exponent each step.", "Handle negative n by inverting x.", "Iterative: while n: if n odd multiply result; x *= x; n >>= 1."], "O(log n)");
  add("multiply-strings", "Grade-school multiplication into a position array", ["Meta", "Google", "Amazon"], ["Result has at most m + n digits.", "digit i × digit j contributes to positions i + j and i + j + 1.", "Accumulate, carry, strip leading zeros."], "O(m·n)");
  add("detect-squares", "Count points; enumerate diagonal partner", ["Google"], ["Store counts of each point.", "For a query point, iterate points p sharing neither coordinate but with |dx| = |dy| (the diagonal).", "Multiply counts of the two remaining corners."], "O(n) per query");
  // Linked lists
  add("merge-two-sorted-lists", "Dummy head + two pointers", FAANG, ["Create a dummy node and a tail pointer.", "Attach the smaller head each step and advance.", "Attach the remainder."], "O(m + n)");
  add("linked-list-cycle", "Floyd fast/slow pointers", FAANG, ["Move slow by 1, fast by 2.", "If they meet there's a cycle; if fast hits null there isn't."], "O(n) time, O(1) space");
  add("copy-list-with-random-pointer", "Hash map old→new (or interleaving)", ["Meta", "Amazon", "Microsoft", "Bloomberg"], ["Pass 1: create a copy of every node, map old → new.", "Pass 2: set next and random through the map.", "O(1)-space trick: interleave copies after originals, set randoms, then split."], "O(n)");
  add("add-two-numbers", "Digit-by-digit addition with carry", FAANG, ["Digits are stored in reverse — add from the heads.", "Sum = a + b + carry; node = sum % 10; carry = sum / 10.", "Continue while either list or carry remains."], "O(max(m, n))");
  add("reverse-nodes-in-k-group", "Reverse k-sized chunks with pointer surgery", ["Microsoft", "Amazon", "Meta"], ["Check that k nodes remain; if not, stop.", "Reverse exactly k nodes (standard reversal).", "Connect the previous group's tail to the new head; move on. A dummy head simplifies the first group."], "O(n) time, O(1) space");
  // Trees
  add("invert-binary-tree", "Recursive swap", ["Google", "Amazon"], ["Swap left and right children.", "Recurse into both subtrees (pre- or post-order)."], "O(n)");
  add("maximum-depth-of-binary-tree", "DFS height", FAANG, ["Depth = 1 + max(depth(left), depth(right)); empty tree = 0.", "Or BFS counting levels."], "O(n)");
  add("balanced-binary-tree", "Height with early -1 sentinel", ["Amazon", "Google"], ["A tree is balanced if subtree heights differ by ≤ 1 at every node.", "Return height, or -1 if unbalanced; propagate -1 upward to stay O(n)."], "O(n)");
  add("same-tree", "Simultaneous DFS", ["Amazon", "Microsoft"], ["Both null → true; one null → false; values differ → false.", "Recurse left with left, right with right."], "O(n)");
  add("subtree-of-another-tree", "Same-tree check at every node", ["Amazon", "Meta"], ["For each node of root, check sameTree(node, subRoot).", "Optimization: serialize both trees and use substring search (with null markers)."], "O(m·n), O(m+n) with serialization");
  add("lowest-common-ancestor-of-a-binary-search-tree", "Use BST ordering", ["Meta", "Amazon", "Microsoft"], ["If both values < node, go left; if both > node, go right.", "Otherwise the current node splits them — it's the LCA."], "O(h)");
  add("count-good-nodes-in-binary-tree", "DFS carrying max so far", ["Microsoft", "Amazon"], ["A node is good if its value ≥ every value on the path from the root.", "DFS with the path maximum; count nodes where val ≥ max."], "O(n)");
  add("serialize-and-deserialize-binary-tree", "Pre-order with null markers", ["Meta", "Amazon", "Google", "LinkedIn", "Microsoft"], ["Serialize with pre-order DFS writing '#' for nulls, comma separated.", "Deserialize by reading tokens with a shared index: token '#' → null, else node, then build left then right.", "BFS level order also works."], "O(n)");
  // Heaps
  add("kth-largest-element-in-a-stream", "Min-heap of size k", ["Amazon", "Meta"], ["Keep only the k largest seen in a min-heap.", "After each add, pop while size > k; the root is the answer."], "O(log k) per add");
  add("last-stone-weight", "Max-heap simulation", ["Amazon", "Google"], ["Put all stones in a max-heap.", "Pop two, push their difference if non-zero, until ≤ 1 stone."], "O(n log n)");
  add("design-twitter", "Per-user tweet lists + k-way merge with a heap", ["Amazon", "Twitter", "Microsoft"], ["Store tweets per user with a global timestamp; follows as sets.", "News feed = merge the recent tweets of the user and followees: heap of (time, user, index), pop 10."], "O(F log F) per feed");
  // Backtracking / tries
  add("subsets-ii", "Sort + skip duplicates at the same depth", ["Amazon", "Meta"], ["Sort so duplicates are adjacent.", "Standard subsets backtracking, but in the loop skip nums[j] if j > start and nums[j] === nums[j−1]."], "O(n · 2ⁿ)");
  add("combination-sum-ii", "Sort + skip duplicates, use each once", ["Amazon", "Meta", "LinkedIn"], ["Sort candidates; recurse with i + 1 (single use).", "Skip equal values at the same depth: i > start && c[i] === c[i−1].", "Break when a candidate exceeds the remaining sum."], "Exponential");
  add("n-queens", "Row-by-row backtracking with column/diagonal sets", ["Amazon", "Microsoft", "Google"], ["One queen per row; track columns, r−c and r+c diagonals in sets.", "Build the board strings when row === n.", "Practise the in-app N-Queens (count) first."], "O(n!)");
  add("implement-trie-prefix-tree", "Trie nodes with children map + end flag", FAANG, ["Node = {children: Map, end: boolean}.", "insert walks/creates nodes; search needs end; startsWith doesn't."], "O(L) per operation");
  add("design-add-and-search-words-data-structure", "Trie + DFS for '.' wildcards", ["Meta", "Amazon", "Google"], ["Insert words into a trie.", "Search recursively: normal char follows one child; '.' tries every child."], "O(L) insert, up to O(26^L) search worst case");
  add("word-search-ii", "Trie of words + grid DFS with pruning", ["Amazon", "Microsoft", "Google", "Uber"], ["Running Word Search per word is too slow — insert all words into a trie.", "DFS from each cell following trie children; record words at end nodes.", "Prune: remove found words/empty trie branches; mark cells visited in place."], "O(m·n·4^L) worst case, much faster with pruning");
  // Graphs
  add("max-area-of-island", "DFS flood fill with size", ["Amazon", "Google", "Meta"], ["For each unvisited land cell, DFS and count the component size.", "Mark visited by sinking cells (set to 0); track the max."], "O(m·n)");
  add("clone-graph", "DFS/BFS with old→new map", ["Meta", "Google", "Amazon", "Microsoft"], ["Map each original node to its clone as you first see it (prevents cycles).", "For each neighbour, clone if unseen and connect."], "O(V + E)");
  add("walls-and-gates", "Multi-source BFS from all gates", ["Meta", "Google", "Amazon"], ["Start BFS simultaneously from every gate (distance 0).", "Each empty room's first visit gives its shortest distance."], "O(m·n)");
  add("surrounded-regions", "Flood fill from the border", ["Google", "Amazon", "Microsoft"], ["'O's connected to the border can't be captured.", "DFS from every border 'O' marking them safe.", "Flip all other 'O' to 'X', then restore the safe ones."], "O(m·n)");
  add("graph-valid-tree", "n−1 edges + connected (Union-Find)", ["Google", "Meta", "LinkedIn"], ["A tree has exactly n − 1 edges and no cycle.", "Union-Find: if any edge joins already-connected nodes → false.", "Check edges.length === n − 1."], "O(E α(n))");
  add("number-of-connected-components-in-an-undirected-graph", "Union-Find component counting", ["Google", "Meta", "Amazon"], ["Start with n components.", "Each successful union reduces the count by 1."], "O(E α(n))");
  add("reconstruct-itinerary", "Hierholzer's algorithm (Eulerian path)", ["Google", "Meta", "Uber"], ["Build adjacency lists sorted lexicographically (use them as stacks/queues).", "DFS from JFK consuming edges; append airport after its edges are exhausted.", "Reverse the post-order to get the itinerary."], "O(E log E)");
  add("min-cost-to-connect-all-points", "Minimum spanning tree (Prim)", ["Amazon", "Google"], ["Complete graph with Manhattan distances → MST.", "Prim's with a simple O(n²) array scan is ideal for dense graphs.", "Kruskal + Union-Find also works (O(n² log n))."], "O(n²)");
  add("swim-in-rising-water", "Dijkstra / binary search + BFS on max-edge", ["Google", "Amazon"], ["Cost of a path = the maximum height on it; minimize it.", "Dijkstra where the 'distance' is max(current, cell height), using a min-heap.", "Or binary search the time t and check reachability with BFS."], "O(n² log n)");
  add("cheapest-flights-within-k-stops", "Bellman-Ford limited to k+1 rounds / BFS by stops", ["Amazon", "Google", "Airbnb", "Meta"], ["Dijkstra alone ignores the stop limit.", "Run Bellman-Ford for k + 1 iterations, relaxing from a copy of the previous distances.", "Or BFS level by level (stops) keeping the best cost per node."], "O(k · E)");
  // DP
  add("palindromic-substrings", "Expand around centers (count)", ["Meta", "Amazon"], ["Same as Longest Palindromic Substring, but count every successful expansion.", "2n − 1 centers."], "O(n²)");
  add("best-time-to-buy-and-sell-stock-with-cooldown", "State machine DP (hold / sold / rest)", ["Amazon", "Google"], ["Three states per day: holding a stock, just sold (cooldown next), resting.", "hold = max(hold, rest − price); sold = hold + price; rest = max(rest, prevSold).", "Answer = max(sold, rest)."], "O(n) time, O(1) space");
  add("target-sum", "Subset-sum transformation or memo DFS", ["Meta", "Google", "Amazon"], ["Assign + or − to each number to reach target.", "P − N = target and P + N = total ⇒ P = (target + total) / 2: count subsets summing to P (0/1 knapsack counting).", "Check parity and bounds first."], "O(n · sum)");
  add("interleaving-string", "2-D DP on prefixes", ["Google", "Microsoft"], ["dp[i][j] = can s1[0..i) and s2[0..j) interleave into s3[0..i+j).", "dp[i][j] = (dp[i−1][j] && s1[i−1]==s3[i+j−1]) || (dp[i][j−1] && s2[j−1]==s3[i+j−1]).", "Lengths must add up."], "O(m·n)");
  add("longest-increasing-path-in-a-matrix", "DFS with memoization (DAG longest path)", ["Google", "Meta", "Amazon"], ["Increasing moves form a DAG — no cycles, so memoize.", "memo[i][j] = 1 + max over larger neighbours.", "Answer = max over all cells."], "O(m·n)");
  add("distinct-subsequences", "2-D DP counting matches", ["Google", "Amazon"], ["dp[i][j] = ways s[0..i) contains t[0..j) as a subsequence.", "dp[i][j] = dp[i−1][j] + (s[i−1]==t[j−1] ? dp[i−1][j−1] : 0); dp[i][0] = 1."], "O(m·n)");
  add("burst-balloons", "Interval DP on the LAST balloon burst", ["Google", "Amazon", "Microsoft"], ["Choosing the first balloon creates dependent subproblems — choose the LAST one in an interval instead.", "Pad with 1s; dp[l][r] = max over k in (l, r) of nums[l]·nums[k]·nums[r] + dp[l][k] + dp[k][r].", "Fill by increasing interval length."], "O(n³)");
  // Greedy / intervals
  add("jump-game-ii", "Greedy BFS by reach windows", ["Amazon", "Google", "Microsoft"], ["Treat each 'jump' as a BFS level: the range reachable with j jumps.", "Track currentEnd and farthest; when i reaches currentEnd, jumps++ and currentEnd = farthest."], "O(n)");
  add("hand-of-straights", "Greedy from the smallest card with counts", ["Google", "Amazon"], ["If n % groupSize ≠ 0 → false.", "Sort distinct values; from the smallest remaining card, try to consume a run of groupSize consecutive values."], "O(n log n)");
  add("merge-triplets-to-form-target-triplet", "Greedy filtering", ["Google"], ["Ignore triplets with any value exceeding the target.", "Among the rest, check that each target coordinate is achieved by some triplet."], "O(n)");
  add("partition-labels", "Last occurrence + greedy cut", ["Amazon", "Meta"], ["Record the last index of every character.", "Extend the current partition's end to the max last-index seen; cut when i reaches it."], "O(n)");
  add("valid-parenthesis-string", "Greedy range of open counts", ["Meta", "Amazon"], ["Track min and max possible open parentheses ('*' can be '(' ')' or empty).", "'(' → both +1; ')' → both −1; '*' → min −1, max +1; clamp min at 0; if max < 0 → false.", "Valid iff min == 0 at the end."], "O(n)");
  add("meeting-rooms", "Sort by start, check adjacent overlap", ["Meta", "Amazon", "Google"], ["Sort intervals by start.", "If any start < previous end → cannot attend all."], "O(n log n)");
  add("minimum-interval-to-include-each-query", "Sort queries + min-heap of intervals", ["Google"], ["Sort intervals by start and queries ascending (keep original indices).", "For each query, push intervals starting ≤ q into a heap keyed by size; pop those ending before q.", "Heap top's size is the answer."], "O((n + q) log n)");
  // Bits
  add("number-of-1-bits", "n & (n − 1) clears the lowest set bit", ["Apple", "Microsoft"], ["Count how many times you can do n &= n − 1 until 0.", "Use unsigned shifts in JS/Java (>>>)."], "O(bits set)");
  add("counting-bits", "DP: bits[i] = bits[i >> 1] + (i & 1)", ["Amazon", "Google"], ["i >> 1 is i without its last bit — already computed.", "Add the last bit."], "O(n)");
  add("reverse-bits", "Shift out / shift in 32 times", ["Apple", "Airbnb"], ["For 32 iterations: result = (result << 1) | (n & 1); n >>>= 1.", "Return result >>> 0 in JS for unsigned."], "O(32)");
  add("missing-number", "XOR or Gauss sum", ["Amazon", "Microsoft", "Meta"], ["Expected sum n(n+1)/2 minus actual sum.", "Or XOR all indices and values — pairs cancel, leaving the missing one."], "O(n) time, O(1) space");
  add("sum-of-two-integers", "Bitwise add: XOR sum + AND carry", ["Meta", "Amazon"], ["a ^ b adds without carry; (a & b) << 1 is the carry.", "Repeat until carry is 0 (mask to 32 bits in Python)."], "O(32)");
  add("reverse-integer", "Pop/push digits with overflow check", ["Apple", "Amazon", "Bloomberg"], ["Pop the last digit, push onto the result.", "Before pushing, check the result won't exceed the 32-bit range; return 0 if it would."], "O(log n)");

  // ---- wire roadmap ↔ in-app problems, and add in-app problems not in the roadmap as an extra group
  const R = window.STUDY_ROADMAP;
  const P = window.STUDY_PROBLEMS || [];
  if (!R || !R.groups) return;
  const byLc = {};
  P.forEach((p) => { if (p.lc) byLc[p.lc] = p; });
  const inRoadmap = new Set();
  R.groups.forEach((g) => g.problems.forEach((rp) => {
    inRoadmap.add(rp.lc);
    if (!rp.local && byLc[rp.lc]) rp.local = byLc[rp.lc].id;
  }));
  const extras = P.filter((p) => p.lc && !inRoadmap.has(p.lc));
  if (extras.length && !R.groups.some((g) => g.id === "bigtech-extras")) {
    R.groups.push({
      id: "bigtech-extras", name: "Big-Tech Frequent Extras", concept: "#/topic/dsa/dsa-patterns?m=deep",
      note: "Frequently reported at Amazon, Google, Meta, Microsoft, Uber and others but not in the NeetCode 150 — all runnable in-app with tests.",
      problems: extras.map((p) => ({ id: "x-" + p.id, title: p.title, diff: p.difficulty, lc: p.lc, local: p.id })),
    });
  }
})();
