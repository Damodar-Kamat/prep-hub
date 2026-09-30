/* DSA Patterns — one topic per pattern: signals, core idea, Java + Python templates, a traced worked example,
   variations, pitfalls and an ordered list of related problems (LeetCode slugs; the UI links in-app versions).
   Code is written raw and HTML-escaped by the builder below. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
(function () {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const code = (s) => `<pre><code>${esc(s.replace(/^\n/, ""))}</code></pre>`;
  const P = (o) => ({
    id: o.id, title: o.title, summary: o.summary, tags: ["pattern"].concat(o.tags || []),
    problems: o.problems,
    brushup: [
      "<b>Use when:</b> " + o.signals.join(" · "),
      ...o.keys,
      "<b>Complexity:</b> " + o.complexity,
    ],
    detail: `
<h2>🔎 Recognize it — signals in the problem statement</h2><ul>${o.signals.map((s) => `<li>${s}</li>`).join("")}</ul>
<h2>💡 Core idea</h2>${o.idea}
<h2>🧱 Template — Java</h2>${code(o.java)}
<h2>🧱 Template — Python</h2>${code(o.python)}
<h2>🧪 Worked example — ${o.example.title}</h2>${o.example.body}
${o.variations ? `<h2>🔀 Variations</h2><ul>${o.variations.map((v) => `<li>${v}</li>`).join("")}</ul>` : ""}
<h2>⏱️ Complexity</h2><p>${o.complexity}</p>`,
    pitfalls: o.pitfalls,
    interviewQs: o.qs || [],
    resources: o.resources || [],
  });

  window.STUDY_SECTIONS.push({
    id: "patterns",
    title: "DSA Patterns",
    icon: "🧬",
    blurb: "22 problem-solving patterns that cover ~90% of coding interviews — each with recognition signals, the core idea, Java & Python templates, a traced example and a curated problem ladder (runnable in-app where available).",
    topics: [
      P({
        id: "pat-two-pointers", title: "Two Pointers", tags: ["arrays"],
        summary: "Two indices moving toward each other or in the same direction over a sequence, replacing a nested loop with one linear pass.",
        signals: ["Sorted array or string", "Find a pair/triplet with a target sum", "Palindrome checks", "In-place removal or partitioning", "Compare from both ends"],
        keys: ["Opposite ends: move the pointer whose move can improve the answer.", "Same direction (read/write pointers): compact or partition in place.", "Sorting first often unlocks two pointers (O(n log n) total)."],
        idea: `<p>With a <b>sorted</b> array and a pair-sum target, if <code>a[l] + a[r]</code> is too small, only moving <code>l</code> right can increase it; if too big, only moving <code>r</code> left can decrease it. Each step discards one candidate forever → O(n) instead of O(n²).</p>`,
        java: `
int[] pairWithSum(int[] a, int target) {     // a is sorted
    int l = 0, r = a.length - 1;
    while (l < r) {
        int s = a[l] + a[r];
        if (s == target) return new int[]{l, r};
        if (s < target) l++; else r--;
    }
    return new int[]{-1, -1};
}
// same-direction variant: remove duplicates in place
int dedupe(int[] a) {
    int w = 0;
    for (int r = 0; r < a.length; r++) if (r == 0 || a[r] != a[r - 1]) a[w++] = a[r];
    return w;
}`,
        python: `
def pair_with_sum(a, target):          # a is sorted
    l, r = 0, len(a) - 1
    while l < r:
        s = a[l] + a[r]
        if s == target: return [l, r]
        if s < target: l += 1
        else: r -= 1
    return [-1, -1]`,
        example: { title: "Two Sum II: a = [2, 7, 11, 15], target = 18", body: `<table><tr><th>step</th><th>l</th><th>r</th><th>a[l]+a[r]</th><th>action</th></tr>
<tr><td>1</td><td>0 (2)</td><td>3 (15)</td><td>17</td><td>&lt; 18 → l++</td></tr>
<tr><td>2</td><td>1 (7)</td><td>3 (15)</td><td>22</td><td>&gt; 18 → r--</td></tr>
<tr><td>3</td><td>1 (7)</td><td>2 (11)</td><td>18</td><td>found [1, 2]</td></tr></table>` },
        variations: ["3Sum: fix one element, two-pointer the rest; skip duplicates.", "Container With Most Water: move the shorter side.", "Trapping Rain Water: move the side with the smaller max.", "Dutch flag (Sort Colors): three pointers."],
        complexity: "O(n) after sorting (O(n log n) if you sort), O(1) extra space",
        pitfalls: ["Using it on unsorted data without sorting.", "Forgetting to skip duplicates in 3Sum.", "Off-by-one with l < r vs l <= r."],
        problems: ["valid-palindrome", "two-sum-ii-input-array-is-sorted", "move-zeroes", "3sum", "container-with-most-water", "sort-colors", "valid-palindrome-ii", "trapping-rain-water"],
      }),
      P({
        id: "pat-sliding-window", title: "Sliding Window", tags: ["arrays", "strings"],
        summary: "Maintain a window [left, right] over a sequence, expanding right and shrinking left to track the best contiguous subarray/substring in O(n).",
        signals: ["Contiguous subarray or substring", "Longest/shortest/max/min window satisfying a condition", "At most / exactly K distinct, replacements, or sum ≥ target (non-negative numbers)", "Fixed-size window of k"],
        keys: ["Variable window: expand right each step; while the window is invalid, shrink left; update answer.", "Fixed window: add the new element, remove the one leaving.", "Keep window state in a counter/map/sum so each move is O(1)."],
        idea: `<p>Each element enters the window once (right pointer) and leaves at most once (left pointer), so the total work is O(n). The window must have a <b>monotonic</b> property: growing it can only make it 'more invalid' (e.g. more distinct chars, bigger sum with non-negative values). With negative numbers use prefix sums instead.</p>`,
        java: `
int longestWindow(String s, int k) {           // e.g. longest substring with at most k distinct chars
    Map<Character, Integer> cnt = new HashMap<>();
    int left = 0, best = 0;
    for (int right = 0; right < s.length(); right++) {
        cnt.merge(s.charAt(right), 1, Integer::sum);          // expand
        while (cnt.size() > k) {                               // shrink until valid
            char c = s.charAt(left++);
            if (cnt.merge(c, -1, Integer::sum) == 0) cnt.remove(c);
        }
        best = Math.max(best, right - left + 1);               // window is valid here
    }
    return best;
}`,
        python: `
from collections import Counter
def longest_window(s, k):
    cnt, left, best = Counter(), 0, 0
    for right, ch in enumerate(s):
        cnt[ch] += 1
        while len(cnt) > k:
            cnt[s[left]] -= 1
            if cnt[s[left]] == 0: del cnt[s[left]]
            left += 1
        best = max(best, right - left + 1)
    return best`,
        example: { title: "Longest substring without repeating characters: s = \"abcabcbb\"", body: `<table><tr><th>right</th><th>char</th><th>window after shrinking</th><th>best</th></tr>
<tr><td>0</td><td>a</td><td>a</td><td>1</td></tr><tr><td>1</td><td>b</td><td>ab</td><td>2</td></tr><tr><td>2</td><td>c</td><td>abc</td><td>3</td></tr>
<tr><td>3</td><td>a</td><td>bca (dropped a)</td><td>3</td></tr><tr><td>4</td><td>b</td><td>cab</td><td>3</td></tr><tr><td>5</td><td>c</td><td>abc</td><td>3</td></tr>
<tr><td>6</td><td>b</td><td>cb</td><td>3</td></tr><tr><td>7</td><td>b</td><td>b</td><td>3</td></tr></table><p>Answer 3.</p>` },
        variations: ["Minimum window: shrink while valid and record the minimum inside the while loop.", "Count of subarrays with at most K ⇒ exactly K = atMost(K) − atMost(K−1).", "Fixed window max → monotonic deque (Sliding Window Maximum)."],
        complexity: "O(n) time, O(alphabet or k) space",
        pitfalls: ["Using a sliding window when numbers can be negative (sum isn't monotonic).", "Updating the answer while the window is invalid.", "Forgetting to remove zero-count keys from the map."],
        problems: ["best-time-to-buy-and-sell-stock", "longest-substring-without-repeating-characters", "longest-repeating-character-replacement", "permutation-in-string", "minimum-window-substring", "sliding-window-maximum"],
      }),
      P({
        id: "pat-prefix-sum", title: "Prefix Sums (+ Hash Map)", tags: ["arrays"],
        summary: "Precompute running totals so any range sum is O(1); combined with a hash map it counts subarrays with a target sum even with negatives.",
        signals: ["Range sum queries", "Subarray sum equals / divisible by k", "Negative numbers present (sliding window fails)", "Product of array except self (prefix/suffix products)", "2-D region sums"],
        keys: ["sum(i..j) = prefix[j+1] − prefix[i].", "Count subarrays with sum k: for each prefix p, add count[p − k]; seed count[0] = 1.", "Prefix/suffix arrays avoid division (product except self)."],
        idea: `<p>Store <code>prefix[i]</code> = sum of the first i elements. A subarray (i, j] has sum <code>prefix[j] − prefix[i]</code>. Looking for sum k means looking for an earlier prefix equal to <code>prefix[j] − k</code> — a hash map lookup.</p>`,
        java: `
int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> seen = new HashMap<>();
    seen.put(0, 1);                       // empty prefix
    int sum = 0, count = 0;
    for (int x : nums) {
        sum += x;
        count += seen.getOrDefault(sum - k, 0);
        seen.merge(sum, 1, Integer::sum);
    }
    return count;
}`,
        python: `
def subarray_sum(nums, k):
    seen, s, count = {0: 1}, 0, 0
    for x in nums:
        s += x
        count += seen.get(s - k, 0)
        seen[s] = seen.get(s, 0) + 1
    return count`,
        example: { title: "nums = [1, 2, 3], k = 3", body: `<table><tr><th>x</th><th>prefix</th><th>need prefix − k</th><th>count added</th><th>seen</th></tr>
<tr><td>1</td><td>1</td><td>−2</td><td>0</td><td>{0:1, 1:1}</td></tr><tr><td>2</td><td>3</td><td>0</td><td>1 ([1,2])</td><td>{0:1,1:1,3:1}</td></tr>
<tr><td>3</td><td>6</td><td>3</td><td>1 ([3])</td><td>…</td></tr></table><p>Answer 2.</p>` },
        variations: ["Divisible by k: key on prefix mod k.", "Longest subarray with sum k: store the first index of each prefix.", "Binary arrays (equal 0s and 1s): map 0 → −1, find equal prefixes.", "2-D prefix sums for matrix region queries."],
        complexity: "O(n) time, O(n) space",
        pitfalls: ["Forgetting the seed {0: 1}.", "Updating the map before querying (counts empty subarrays).", "Integer overflow on large sums (use long in Java)."],
        problems: ["product-of-array-except-self", "subarray-sum-equals-k", "contiguous-array", "continuous-subarray-sum", "range-sum-query-2d-immutable"],
      }),
      P({
        id: "pat-hashing", title: "Hash Map / Set & Frequency Counting", tags: ["hashing"],
        summary: "Trade memory for speed: O(1) lookups for 'seen before', complements, counts and grouping by a canonical key.",
        signals: ["'Have we seen this before?'", "Find a complement (two-sum style) in unsorted data", "Count frequencies, anagrams, duplicates", "Group items by a derived key", "Longest consecutive sequence"],
        keys: ["Complement lookup: store value → index as you scan.", "Canonical key: sorted string or count signature for anagram grouping.", "Set for O(1) membership; only start counting sequences at their start (x−1 absent)."],
        idea: `<p>Most O(n²) 'search for a matching element' loops become O(n) when the inner search is a hash lookup. Think about <b>what to store</b> (value, index, count, first position) and <b>when</b> to insert it (before or after querying).</p>`,
        java: `
int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> idx = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        Integer j = idx.get(target - nums[i]);
        if (j != null) return new int[]{j, i};
        idx.put(nums[i], i);                 // insert AFTER querying (no self-pairing)
    }
    return new int[0];
}`,
        python: `
def two_sum(nums, target):
    idx = {}
    for i, x in enumerate(nums):
        if target - x in idx: return [idx[target - x], i]
        idx[x] = i`,
        example: { title: "Longest consecutive sequence: [100, 4, 200, 1, 3, 2]", body: `<p>Put everything in a set. Only start counting from numbers whose predecessor is absent: 100 (no 99) → length 1; 200 → 1; 1 (no 0) → 1,2,3,4 → length 4. Numbers 2, 3, 4 are skipped as starts because their predecessor exists → each number visited O(1) times → O(n).</p>` },
        variations: ["Top K frequent: count, then bucket sort by frequency.", "Isomorphic strings / word pattern: two maps for a bijection.", "Rolling hash for substring matching (Rabin-Karp)."],
        complexity: "O(n) average time, O(n) space",
        pitfalls: ["Inserting before querying in two-sum (pairs an element with itself).", "Using mutable objects as keys.", "Assuming hash maps are ordered (except LinkedHashMap / Python dict insertion order)."],
        problems: ["contains-duplicate", "valid-anagram", "two-sum", "group-anagrams", "top-k-frequent-elements", "longest-consecutive-sequence", "encode-and-decode-strings"],
      }),
      P({
        id: "pat-binary-search", title: "Binary Search (on Index and on the Answer)", tags: ["binary-search"],
        summary: "Halve the search space each step — on a sorted array, a rotated array, or a monotonic 'is this answer feasible?' function.",
        signals: ["Sorted or rotated sorted input", "'Find the first/last position where…'", "'Minimum capacity / speed / days such that…'", "Answer space is numeric and feasibility is monotonic", "O(log n) required"],
        keys: ["Use the half-open template: lo = 0, hi = n; while lo < hi; mid; if condition(mid) hi = mid else lo = mid + 1 → lo is the first true.", "On the answer: binary search the value range with a feasible(x) check.", "Rotated arrays: one half is always sorted — decide which side the target is on."],
        idea: `<p>Binary search works whenever a predicate over the search space is <b>monotonic</b> (false…false true…true). Find the first true. That covers lower/upper bound, search in rotated arrays, and 'minimize the maximum' problems like Koko Eating Bananas.</p>`,
        java: `
// first index in [0, n) where pred is true (n if none)
int firstTrue(int n, java.util.function.IntPredicate pred) {
    int lo = 0, hi = n;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;          // avoids overflow
        if (pred.test(mid)) hi = mid; else lo = mid + 1;
    }
    return lo;
}
// binary search on the answer: minimum eating speed
int minEatingSpeed(int[] piles, int h) {
    int lo = 1, hi = java.util.Arrays.stream(piles).max().getAsInt();
    while (lo < hi) {
        int k = lo + (hi - lo) / 2;
        long hours = 0;
        for (int p : piles) hours += (p + k - 1) / k;
        if (hours <= h) hi = k; else lo = k + 1;
    }
    return lo;
}`,
        python: `
def first_true(lo, hi, pred):      # search [lo, hi)
    while lo < hi:
        mid = (lo + hi) // 2
        if pred(mid): hi = mid
        else: lo = mid + 1
    return lo

def min_eating_speed(piles, h):
    return first_true(1, max(piles) + 1, lambda k: sum((p + k - 1) // k for p in piles) <= h)`,
        example: { title: "Koko: piles = [3, 6, 7, 11], h = 8", body: `<table><tr><th>lo</th><th>hi</th><th>k = mid</th><th>hours</th><th>feasible?</th></tr>
<tr><td>1</td><td>11</td><td>6</td><td>1+1+2+2 = 6</td><td>yes → hi = 6</td></tr><tr><td>1</td><td>6</td><td>3</td><td>1+2+3+4 = 10</td><td>no → lo = 4</td></tr>
<tr><td>4</td><td>6</td><td>5</td><td>1+2+2+3 = 8</td><td>yes → hi = 5</td></tr><tr><td>4</td><td>5</td><td>4</td><td>1+2+2+3 = 8</td><td>yes → hi = 4</td></tr></table><p>lo = hi = 4 → answer 4.</p>` },
        variations: ["Search in rotated sorted array / find minimum.", "Median of two sorted arrays: binary search the partition.", "Split array largest sum, capacity to ship packages: minimize the maximum."],
        complexity: "O(log n) searches; on the answer: O(n log range)",
        pitfalls: ["Infinite loops from lo = mid with lo < hi (use lo = mid + 1).", "Overflow in (lo + hi) / 2 in Java/C++.", "Predicate that isn't actually monotonic."],
        problems: ["binary-search", "search-a-2d-matrix", "koko-eating-bananas", "find-minimum-in-rotated-sorted-array", "search-in-rotated-sorted-array", "time-based-key-value-store", "median-of-two-sorted-arrays"],
      }),
      P({
        id: "pat-fast-slow", title: "Fast & Slow Pointers (Floyd's Cycle)", tags: ["linked-list"],
        summary: "Two pointers moving at different speeds detect cycles, find midpoints and locate cycle starts in O(1) space.",
        signals: ["Linked list cycle detection", "Middle of a linked list", "Cycle in a function/number sequence (happy number)", "Find the duplicate with O(1) extra space"],
        keys: ["slow moves 1, fast moves 2; they meet iff there's a cycle.", "Cycle start: reset one pointer to head, move both by 1 — they meet at the entrance.", "When fast reaches the end, slow is at the middle."],
        idea: `<p>Inside a cycle, the gap between fast and slow shrinks by one every step, so they must meet. If the distance from head to the cycle start is a, a second pointer from head and the meeting-point pointer walking at the same speed meet exactly at the cycle start.</p>`,
        java: `
ListNode cycleStart(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next; fast = fast.next.next;
        if (slow == fast) {                    // cycle found
            ListNode p = head;
            while (p != slow) { p = p.next; slow = slow.next; }
            return p;                          // entrance
        }
    }
    return null;
}`,
        python: `
def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    return slow`,
        example: { title: "Find the duplicate: nums = [1, 3, 4, 2, 2]", body: `<p>Treat i → nums[i] as a linked list: 0→1→3→2→4→2→4… The cycle entrance is 2 — the duplicate. Phase 1 meets inside the cycle; phase 2 from index 0 meets at 2.</p>` },
        variations: ["Palindrome linked list: find middle, reverse second half, compare.", "Reorder list: middle + reverse + weave."],
        complexity: "O(n) time, O(1) space",
        pitfalls: ["Checking fast.next.next without checking fast.next.", "Comparing values instead of node identity."],
        problems: ["linked-list-cycle", "middle-of-the-linked-list", "happy-number", "reorder-list", "find-the-duplicate-number"],
      }),
      P({
        id: "pat-linked-list-reversal", title: "In-Place Linked List Manipulation", tags: ["linked-list"],
        summary: "Rewire next pointers with prev/cur/next and dummy heads to reverse, merge, reorder and remove nodes without extra memory.",
        signals: ["Reverse a whole list or a sub-list / k-groups", "Merge sorted lists", "Remove nodes (nth from end)", "Reorder / rotate lists"],
        keys: ["Reversal loop: next = cur.next; cur.next = prev; prev = cur; cur = next.", "A dummy head removes special cases for the first node.", "Gap pointers (n apart) find the nth from end in one pass."],
        idea: `<p>Draw the arrows. Save the pointer you're about to overwrite, rewire, advance. Most list problems are compositions of: find middle, reverse, merge, and gap pointers.</p>`,
        java: `
ListNode reverse(ListNode head) {
    ListNode prev = null, cur = head;
    while (cur != null) {
        ListNode next = cur.next;
        cur.next = prev;
        prev = cur;
        cur = next;
    }
    return prev;
}
ListNode merge(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), t = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) { t.next = a; a = a.next; } else { t.next = b; b = b.next; }
        t = t.next;
    }
    t.next = (a != null) ? a : b;
    return dummy.next;
}`,
        python: `
def reverse(head):
    prev, cur = None, head
    while cur:
        cur.next, prev, cur = prev, cur, cur.next
    return prev`,
        example: { title: "Reverse 1 → 2 → 3", body: `<table><tr><th>step</th><th>prev</th><th>cur</th><th>list state</th></tr>
<tr><td>0</td><td>null</td><td>1</td><td>1→2→3</td></tr><tr><td>1</td><td>1</td><td>2</td><td>1→null, 2→3</td></tr><tr><td>2</td><td>2</td><td>3</td><td>2→1→null</td></tr><tr><td>3</td><td>3</td><td>null</td><td>3→2→1 (return prev)</td></tr></table>` },
        variations: ["Reverse between positions m and n.", "Reverse nodes in k-group.", "Copy list with random pointer (interleaving trick)."],
        complexity: "O(n) time, O(1) space",
        pitfalls: ["Losing the rest of the list by overwriting next before saving it.", "Not handling empty/one-node lists.", "Forgetting to cut the list when splitting (cycles)."],
        problems: ["reverse-linked-list", "merge-two-sorted-lists", "remove-nth-node-from-end-of-list", "reorder-list", "add-two-numbers", "copy-list-with-random-pointer", "reverse-nodes-in-k-group"],
      }),
      P({
        id: "pat-monotonic-stack", title: "Monotonic Stack & Deque", tags: ["stack"],
        summary: "Keep a stack (or deque) in increasing/decreasing order to answer 'next greater/smaller' and window max/min questions in O(n).",
        signals: ["Next greater / next smaller element", "Days until a warmer temperature, stock span", "Largest rectangle / trapping water", "Maximum of every window of size k (deque)"],
        keys: ["Store indices; pop while the new element breaks the order — each pop resolves the popped element's answer.", "Decreasing stack → next greater; increasing stack → next smaller.", "Deque for windows: pop from back to keep order, pop from front when out of window."],
        idea: `<p>When a new element arrives, every element in the stack that it 'beats' has found its answer (the new element is their next greater/smaller). Each index is pushed and popped once → O(n).</p>`,
        java: `
int[] dailyTemperatures(int[] t) {
    int[] ans = new int[t.length];
    Deque<Integer> st = new ArrayDeque<>();          // indices, temperatures decreasing
    for (int i = 0; i < t.length; i++) {
        while (!st.isEmpty() && t[st.peek()] < t[i]) {
            int j = st.pop();
            ans[j] = i - j;                             // next warmer day for j is i
        }
        st.push(i);
    }
    return ans;
}`,
        python: `
def next_greater(nums):
    ans, st = [-1] * len(nums), []
    for i, x in enumerate(nums):
        while st and nums[st[-1]] < x:
            ans[st.pop()] = x
        st.append(i)
    return ans`,
        example: { title: "Daily temperatures: [73, 74, 75, 71, 69, 72, 76]", body: `<p>i=1 (74) pops 73 → ans[0]=1; i=2 (75) pops 74 → ans[1]=1; 71, 69 pushed; i=5 (72) pops 69 → ans[4]=1, pops 71 → ans[3]=2; i=6 (76) pops 72 → ans[5]=1, pops 75 → ans[2]=4. Result [1,1,4,2,1,1,0].</p>` },
        variations: ["Largest rectangle in histogram (increasing stack + sentinel).", "Sliding window maximum (decreasing deque).", "Remove K digits / smallest subsequence (greedy + monotonic stack)."],
        complexity: "O(n) time, O(n) space",
        pitfalls: ["Storing values instead of indices when you need distances/widths.", "Strict vs non-strict comparison with duplicates.", "Forgetting to flush the stack at the end (sentinel)."],
        problems: ["valid-parentheses", "min-stack", "daily-temperatures", "car-fleet", "asteroid-collision", "largest-rectangle-in-histogram", "sliding-window-maximum"],
      }),
      P({
        id: "pat-intervals", title: "Intervals: Merge, Insert, Sweep Line", tags: ["intervals", "sorting"],
        summary: "Sort intervals (by start or end) and sweep once to merge, count overlaps, schedule rooms or remove the fewest intervals.",
        signals: ["List of [start, end] ranges", "Merge / insert overlapping ranges", "Minimum rooms / maximum overlap at any time", "Remove minimum intervals to avoid overlap", "Free time between meetings"],
        keys: ["Merge: sort by start; extend the last merged end when overlapping.", "Max overlap: sweep starts/ends (or a min-heap of end times).", "Max non-overlapping set: sort by END, greedy keep."],
        idea: `<p>Sorting makes overlaps local — each interval only needs to be compared with the previous merged one. Sweep-line thinking turns intervals into +1/−1 events on a timeline.</p>`,
        java: `
int[][] merge(int[][] iv) {
    Arrays.sort(iv, (a, b) -> Integer.compare(a[0], b[0]));
    List<int[]> out = new ArrayList<>();
    for (int[] cur : iv) {
        if (out.isEmpty() || out.get(out.size() - 1)[1] < cur[0]) out.add(cur);
        else out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], cur[1]);
    }
    return out.toArray(new int[0][]);
}`,
        python: `
def merge(iv):
    iv.sort(key=lambda x: x[0])
    out = []
    for s, e in iv:
        if not out or out[-1][1] < s: out.append([s, e])
        else: out[-1][1] = max(out[-1][1], e)
    return out`,
        example: { title: "Merge [[1,3],[2,6],[8,10],[15,18]]", body: `<p>[1,3] → out; [2,6] overlaps (2 ≤ 3) → [1,6]; [8,10] doesn't (6 &lt; 8) → add; [15,18] → add. Result [[1,6],[8,10],[15,18]].</p>` },
        variations: ["Meeting rooms II: min-heap of end times or two sorted arrays.", "Insert interval: left part, merge middle, right part.", "Minimum arrows to burst balloons: sort by end."],
        complexity: "O(n log n) for sorting, O(n) sweep",
        pitfalls: ["Sorting by the wrong key for greedy selection (use end).", "Closed vs half-open intervals ([1,5] and [5,8] overlap?).", "Mutating input unexpectedly."],
        problems: ["meeting-rooms", "merge-intervals", "insert-interval", "non-overlapping-intervals", "meeting-rooms-ii", "minimum-interval-to-include-each-query"],
      }),
      P({
        id: "pat-top-k-heap", title: "Heaps: Top-K, K-way Merge, Two Heaps", tags: ["heap"],
        summary: "Priority queues keep the best K items, merge K sorted streams, and maintain running medians in O(log n) per operation.",
        signals: ["k largest / smallest / closest / most frequent", "Merge k sorted lists or arrays", "Running median of a stream", "Always process the current smallest/largest (scheduling, Dijkstra)"],
        keys: ["Top-K largest: MIN-heap of size k (evict the smallest); root = k-th largest.", "K-way merge: heap of (value, list, index) heads.", "Median: max-heap for the low half + min-heap for the high half, balanced."],
        idea: `<p>A heap gives O(1) access to the min (or max) and O(log n) insert/remove. Keeping it at size k makes Top-K O(n log k) — better than sorting when k ≪ n.</p>`,
        java: `
int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> pq = new PriorityQueue<>();     // min-heap
    for (int x : nums) {
        pq.offer(x);
        if (pq.size() > k) pq.poll();                       // drop the smallest
    }
    return pq.peek();
}
// k closest points: max-heap by distance
PriorityQueue<int[]> far = new PriorityQueue<>((a, b) -> (b[0]*b[0] + b[1]*b[1]) - (a[0]*a[0] + a[1]*a[1]));`,
        python: `
import heapq
def kth_largest(nums, k):
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k: heapq.heappop(h)
    return h[0]
# max-heap in Python: push negatives, or heapq.nlargest(k, nums)`,
        example: { title: "Kth largest, nums = [3,2,1,5,6,4], k = 2", body: `<table><tr><th>push</th><th>heap (min at left)</th><th>size &gt; k?</th></tr>
<tr><td>3</td><td>[3]</td><td>no</td></tr><tr><td>2</td><td>[2, 3]</td><td>no</td></tr><tr><td>1</td><td>[1, 2, 3] → pop 1 → [2, 3]</td><td>yes</td></tr>
<tr><td>5</td><td>[2, 3, 5] → pop 2 → [3, 5]</td><td>yes</td></tr><tr><td>6</td><td>[3, 5, 6] → pop 3 → [5, 6]</td><td>yes</td></tr>
<tr><td>4</td><td>[4, 5, 6] → pop 4 → [5, 6]</td><td>yes</td></tr></table><p>Root = 5 = 2nd largest.</p>` },
        variations: ["Task scheduler (max-heap + cooldown queue).", "Reorganize string.", "Find median from data stream (two heaps).", "Merge k sorted lists."],
        complexity: "O(n log k) for top-k, O(N log k) for k-way merge, O(log n) per median insert",
        pitfalls: ["Using a max-heap for top-k largest (O(n log n)).", "Java comparator overflow with subtraction on large values — use Integer.compare.", "Python heapq is min-only."],
        problems: ["kth-largest-element-in-a-stream", "last-stone-weight", "k-closest-points-to-origin", "kth-largest-element-in-an-array", "task-scheduler", "merge-k-sorted-lists", "find-median-from-data-stream"],
      }),
      P({
        id: "pat-tree-dfs", title: "Tree DFS (Recursion Returning Values)", tags: ["trees"],
        summary: "Solve tree problems by defining what a recursive call returns for a subtree and combining children's answers — with a global for 'path through node' answers.",
        signals: ["Height, depth, diameter, balance", "Path sums, max path", "Validate BST, LCA", "Any property computed bottom-up from subtrees"],
        keys: ["Define f(node) precisely, handle null, combine f(left) and f(right).", "Pass constraints DOWN (bounds for BST validation), return summaries UP (heights, sums).", "When the answer can 'bend' at a node, update a global and return a one-sided value."],
        idea: `<p>Trust the recursion: assume f works for children, then express f(node) from them. Many 'hard' tree problems are diameter-shaped: best answer through a node = left + right + node, but you can only return one branch upward.</p>`,
        java: `
int best = Integer.MIN_VALUE;
int maxGain(TreeNode n) {                  // max path sum
    if (n == null) return 0;
    int l = Math.max(0, maxGain(n.left));
    int r = Math.max(0, maxGain(n.right));
    best = Math.max(best, n.val + l + r); // path bending here
    return n.val + Math.max(l, r);          // only one side continues up
}
boolean validBST(TreeNode n, long lo, long hi) {
    if (n == null) return true;
    if (n.val <= lo || n.val >= hi) return false;
    return validBST(n.left, lo, n.val) && validBST(n.right, n.val, hi);
}`,
        python: `
def diameter(root):
    best = 0
    def height(n):
        nonlocal best
        if not n: return 0
        l, r = height(n.left), height(n.right)
        best = max(best, l + r)
        return 1 + max(l, r)
    height(root)
    return best`,
        example: { title: "Diameter of [1,2,3,4,5]", body: `<p>height(4)=1, height(5)=1 → at node 2: best = 1+1 = 2, returns 2. height(3)=1. At root: best = 2 + 1 = 3, returns 3. Diameter = 3 edges (4→2→1→3).</p>` },
        variations: ["Pre-order (top-down with accumulated path) vs post-order (bottom-up).", "Serialize/deserialize with pre-order + null markers.", "Build tree from preorder + inorder."],
        complexity: "O(n) time, O(h) recursion stack",
        pitfalls: ["Checking only parent-child relations in BST validation.", "Returning both branches upward in path problems.", "Deep recursion on skewed trees (stack overflow) — consider iterative."],
        problems: ["invert-binary-tree", "maximum-depth-of-binary-tree", "diameter-of-binary-tree", "balanced-binary-tree", "validate-binary-search-tree", "lowest-common-ancestor-of-a-binary-tree", "construct-binary-tree-from-preorder-and-inorder-traversal", "binary-tree-maximum-path-sum"],
      }),
      P({
        id: "pat-tree-bfs", title: "Tree BFS (Level Order)", tags: ["trees", "bfs"],
        summary: "Process a tree level by level with a queue — for level lists, views, depths and anything 'per level'.",
        signals: ["Level order / zigzag traversal", "Right/left side view", "Minimum depth", "Average or max per level", "Connect nodes at the same level"],
        keys: ["Snapshot size = queue.size() at the start of each level.", "Process exactly size nodes, enqueue children for the next level.", "Right view = last node of each level."],
        idea: `<p>The queue always holds one level followed by the next; counting the level size lets you group nodes by depth without storing depths.</p>`,
        java: `
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    Deque<TreeNode> q = new ArrayDeque<>();
    if (root != null) q.add(root);
    while (!q.isEmpty()) {
        int size = q.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode n = q.poll();
            level.add(n.val);
            if (n.left != null) q.add(n.left);
            if (n.right != null) q.add(n.right);
        }
        out.add(level);
    }
    return out;
}`,
        python: `
from collections import deque
def level_order(root):
    out, q = [], deque([root] if root else [])
    while q:
        out.append([n.val for n in q])
        for _ in range(len(q)):
            n = q.popleft()
            if n.left: q.append(n.left)
            if n.right: q.append(n.right)
    return out`,
        example: { title: "[3,9,20,null,null,15,7]", body: `<p>Queue [3] → level [3], enqueue 9, 20 → level [9,20], enqueue 15, 7 → level [15,7]. Right side view = [3, 20, 7].</p>` },
        variations: ["Zigzag: reverse every other level.", "Minimum depth: return at the first leaf.", "Vertical order: BFS with column indices."],
        complexity: "O(n) time, O(width) space",
        pitfalls: ["Reading queue.size() inside the loop condition (it changes).", "Using DFS where the first-found-is-shallowest property of BFS is needed."],
        problems: ["binary-tree-level-order-traversal", "binary-tree-right-side-view", "count-good-nodes-in-binary-tree", "serialize-and-deserialize-binary-tree"],
      }),
      P({
        id: "pat-graph-traversal", title: "Graph & Grid Traversal (DFS / BFS / Multi-source BFS)", tags: ["graphs"],
        summary: "Explore connected components, flood fills and unweighted shortest paths on adjacency lists and grids.",
        signals: ["Grid of cells with 4/8-directional moves", "Count islands / regions / components", "Minimum steps in an unweighted graph", "Spread from many sources at once (rotting, walls & gates)", "Clone a graph"],
        keys: ["Mark visited when you ENQUEUE (BFS) to avoid duplicates.", "BFS = shortest path in unweighted graphs; DFS = reachability/components.", "Multi-source BFS: enqueue all sources at distance 0.", "Reverse the direction when many start points need the same target (Pacific–Atlantic)."],
        idea: `<p>A grid is an implicit graph: neighbours are the valid adjacent cells. The same two traversals solve most problems; the art is choosing what counts as a node, when to mark visited, and where BFS should start.</p>`,
        java: `
int numIslands(char[][] g) {
    int m = g.length, n = g[0].length, count = 0;
    int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
    for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) {
        if (g[i][j] != '1') continue;
        count++;
        Deque<int[]> q = new ArrayDeque<>();
        q.add(new int[]{i, j}); g[i][j] = '0';               // mark on enqueue
        while (!q.isEmpty()) {
            int[] c = q.poll();
            for (int[] d : dirs) {
                int a = c[0] + d[0], b = c[1] + d[1];
                if (a >= 0 && b >= 0 && a < m && b < n && g[a][b] == '1') { g[a][b] = '0'; q.add(new int[]{a, b}); }
            }
        }
    }
    return count;
}`,
        python: `
from collections import deque
def shortest_steps(grid, start, goal):
    m, n = len(grid), len(grid[0])
    q, seen = deque([(start, 0)]), {start}
    while q:
        (i, j), d = q.popleft()
        if (i, j) == goal: return d
        for a, b in ((i+1, j), (i-1, j), (i, j+1), (i, j-1)):
            if 0 <= a < m and 0 <= b < n and grid[a][b] == 0 and (a, b) not in seen:
                seen.add((a, b)); q.append(((a, b), d + 1))
    return -1`,
        example: { title: "Rotting oranges (multi-source BFS)", body: `<p>Enqueue every rotten orange at minute 0. Each BFS level is one minute; fresh neighbours rot and join the next level. When the queue empties, if any fresh orange remains the answer is −1, otherwise the number of levels processed.</p>` },
        variations: ["Word ladder: nodes are words, edges differ by one letter.", "Surrounded regions / Pacific-Atlantic: flood fill from the border.", "Bipartite check: BFS 2-coloring."],
        complexity: "O(V + E); grids O(m·n)",
        pitfalls: ["Marking visited on dequeue (duplicates explode the queue).", "Recursion depth limits for DFS on big grids.", "Forgetting bounds checks."],
        problems: ["number-of-islands", "max-area-of-island", "clone-graph", "rotting-oranges", "pacific-atlantic-water-flow", "surrounded-regions", "walls-and-gates", "word-ladder"],
      }),
      P({
        id: "pat-topo-sort", title: "Topological Sort (Kahn's Algorithm)", tags: ["graphs"],
        summary: "Order the nodes of a directed acyclic graph so every edge points forward — and detect cycles in dependency graphs.",
        signals: ["Prerequisites / dependencies / build order", "'Is it possible to finish?' (cycle detection in a directed graph)", "Derive an order from pairwise constraints (alien dictionary)"],
        keys: ["Compute in-degrees; queue all nodes with in-degree 0.", "Pop, append to order, decrement neighbours; enqueue new zeros.", "If the order has fewer than V nodes, there's a cycle."],
        idea: `<p>A node with no remaining prerequisites can always go next. Removing it may free others. If you get stuck before placing every node, the rest form a cycle.</p>`,
        java: `
int[] topoOrder(int n, int[][] edges) {                // edge {a, b} means a -> b
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    int[] indeg = new int[n];
    for (int[] e : edges) { adj.get(e[0]).add(e[1]); indeg[e[1]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.add(i);
    int[] order = new int[n]; int k = 0;
    while (!q.isEmpty()) {
        int u = q.poll(); order[k++] = u;
        for (int v : adj.get(u)) if (--indeg[v] == 0) q.add(v);
    }
    return k == n ? order : new int[0];                // empty ⇒ cycle
}`,
        python: `
from collections import deque, defaultdict
def topo(n, edges):
    adj, indeg = defaultdict(list), [0] * n
    for a, b in edges: adj[a].append(b); indeg[b] += 1
    q, order = deque(i for i in range(n) if indeg[i] == 0), []
    while q:
        u = q.popleft(); order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0: q.append(v)
    return order if len(order) == n else []`,
        example: { title: "4 courses, prereqs 1←0, 2←0, 3←1, 3←2", body: `<p>in-degree: [0,1,1,2]. Queue [0] → order 0, free 1 and 2 → order 0,1,2 → 3's in-degree hits 0 → order [0,1,2,3].</p>` },
        variations: ["DFS with three colors (white/gray/black) for cycle detection.", "Alien dictionary: build edges from adjacent word pairs.", "Longest path in a DAG via DP over topological order."],
        complexity: "O(V + E)",
        pitfalls: ["Reversing edge direction (b before a).", "Missing nodes that appear in no edge.", "Assuming a unique order."],
        problems: ["course-schedule", "course-schedule-ii", "alien-dictionary", "longest-increasing-path-in-a-matrix"],
      }),
      P({
        id: "pat-union-find", title: "Union-Find (Disjoint Set Union)", tags: ["graphs"],
        summary: "Track connected components under merges in near-constant time — components, redundant edges, and Kruskal's MST.",
        signals: ["Dynamic connectivity: 'are these connected?' as edges arrive", "Number of components / provinces", "Cycle detection in an undirected graph", "Grouping equivalent items (accounts merge)", "Minimum spanning tree (Kruskal)"],
        keys: ["find with path compression, union by rank/size.", "union returns false if already connected → cycle / redundant edge.", "Components = n − successful unions."],
        idea: `<p>Each set has a representative root. Path compression flattens trees during find; union by rank keeps them shallow. Together operations are O(α(n)) ≈ constant.</p>`,
        java: `
class DSU {
    int[] parent, rank;
    DSU(int n) { parent = new int[n]; rank = new int[n]; for (int i = 0; i < n; i++) parent[i] = i; }
    int find(int x) { return parent[x] == x ? x : (parent[x] = find(parent[x])); }
    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;                     // already connected
        if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        if (rank[ra] == rank[rb]) rank[ra]++;
        return true;
    }
}`,
        python: `
class DSU:
    def __init__(self, n): self.p = list(range(n)); self.r = [0] * n
    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]      # path halving
            x = self.p[x]
        return x
    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb: return False
        if self.r[ra] < self.r[rb]: ra, rb = rb, ra
        self.p[rb] = ra
        self.r[ra] += self.r[ra] == self.r[rb]
        return True`,
        example: { title: "Redundant connection [[1,2],[1,3],[2,3]]", body: `<p>union(1,2) ✓, union(1,3) ✓, union(2,3): find(2) = find(3) = 1 → already connected → [2,3] is redundant.</p>` },
        variations: ["Number of connected components / provinces.", "Graph valid tree: n − 1 edges and no failed union.", "Kruskal's MST: sort edges by weight, union if not connected."],
        complexity: "O(α(n)) amortized per operation",
        pitfalls: ["Forgetting path compression (degenerates to O(n)).", "Unioning nodes instead of their roots.", "1-indexed vs 0-indexed nodes."],
        problems: ["number-of-provinces", "redundant-connection", "number-of-connected-components-in-an-undirected-graph", "graph-valid-tree", "accounts-merge", "min-cost-to-connect-all-points"],
      }),
      P({
        id: "pat-shortest-path", title: "Weighted Shortest Paths (Dijkstra, Bellman-Ford)", tags: ["graphs"],
        summary: "Dijkstra with a min-heap for non-negative weights; Bellman-Ford for negative edges or 'at most k edges' constraints.",
        signals: ["Weighted edges, minimum total cost/time", "Network delay, cheapest route", "Path cost = max edge (minimize the maximum) — modified Dijkstra", "At most k stops — Bellman-Ford rounds"],
        keys: ["Dijkstra: pop the smallest distance, skip stale entries, relax neighbours.", "Only valid with non-negative weights.", "Bellman-Ford: relax all edges V−1 (or k+1) times; copy distances each round for the k-limited version."],
        idea: `<p>Dijkstra finalizes the closest unsettled node each step — with non-negative weights nothing later can make it shorter. The heap holds (distance, node); duplicates are fine if you skip entries whose distance is outdated.</p>`,
        java: `
int[] dijkstra(List<List<int[]>> adj, int src) {       // adj[u] = list of {v, w}
    int[] dist = new int[adj.size()];
    Arrays.fill(dist, Integer.MAX_VALUE); dist[src] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.add(new int[]{0, src});
    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int d = cur[0], u = cur[1];
        if (d > dist[u]) continue;                       // stale entry
        for (int[] e : adj.get(u)) {
            int v = e[0], nd = d + e[1];
            if (nd < dist[v]) { dist[v] = nd; pq.add(new int[]{nd, v}); }
        }
    }
    return dist;
}`,
        python: `
import heapq
def dijkstra(adj, src, n):          # adj[u] = [(v, w)]
    dist = [float('inf')] * n; dist[src] = 0
    pq = [(0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue
        for v, w in adj[u]:
            if d + w < dist[v]:
                dist[v] = d + w; heapq.heappush(pq, (dist[v], v))
    return dist`,
        example: { title: "Network delay: edges 2→1 (1), 2→3 (1), 3→4 (1), source 2", body: `<p>dist[2]=0 → relax 1 and 3 to 1 → pop 1 (no edges), pop 3 → relax 4 to 2. Max distance = 2 → answer 2.</p>` },
        variations: ["Swim in rising water: 'distance' = max height on the path.", "Cheapest flights within k stops: Bellman-Ford for k+1 rounds.", "0-1 BFS with a deque when weights are 0/1."],
        complexity: "Dijkstra O(E log V); Bellman-Ford O(V·E) or O(k·E)",
        pitfalls: ["Dijkstra with negative weights.", "Not skipping stale heap entries (slow).", "Using BFS on weighted graphs."],
        problems: ["network-delay-time", "path-with-minimum-effort", "swim-in-rising-water", "cheapest-flights-within-k-stops", "min-cost-to-connect-all-points"],
      }),
      P({
        id: "pat-backtracking", title: "Backtracking (Subsets, Permutations, Combinations, Boards)", tags: ["recursion"],
        summary: "Explore a decision tree with choose → explore → un-choose, pruning dead branches — for generating all solutions or constrained searches.",
        signals: ["'Return all' combinations / subsets / permutations / partitions", "Placement puzzles (N-Queens, Sudoku)", "Word search in a grid", "Small n (≤ ~20) with exponential answer size"],
        keys: ["Template: if goal → record copy; for each choice: if valid → choose, recurse, undo.", "Subsets/combinations use a start index (avoid reordering duplicates).", "Permutations use a used[] array.", "Sort + skip equal neighbours at the same depth to avoid duplicate results."],
        idea: `<p>Backtracking is DFS over partial solutions. The two levers are the <b>choice set</b> at each step and <b>pruning</b> (stop as soon as a partial solution can't succeed).</p>`,
        java: `
List<List<Integer>> out = new ArrayList<>();
void backtrack(int[] nums, int start, Deque<Integer> path) {
    out.add(new ArrayList<>(path));                        // record (subsets: every node)
    for (int i = start; i < nums.length; i++) {
        if (i > start && nums[i] == nums[i - 1]) continue; // skip duplicates (nums sorted)
        path.addLast(nums[i]);                             // choose
        backtrack(nums, i + 1, path);                      // explore (i for unlimited reuse)
        path.removeLast();                                 // un-choose
    }
}`,
        python: `
def permutations(nums):
    out, path, used = [], [], [False] * len(nums)
    def bt():
        if len(path) == len(nums): out.append(path[:]); return
        for i, x in enumerate(nums):
            if used[i]: continue
            used[i] = True; path.append(x)
            bt()
            path.pop(); used[i] = False
    bt()
    return out`,
        example: { title: "Subsets of [1, 2, 3]", body: `<pre><code>[]
├─ [1] ─ [1,2] ─ [1,2,3]
│        └ [1,3]
├─ [2] ─ [2,3]
└─ [3]
Every node is recorded → 8 subsets</code></pre>` },
        variations: ["Combination sum (reuse → recurse with i).", "Palindrome partitioning (choose a prefix cut).", "N-Queens (sets for columns and diagonals).", "Word search (mark cells in place)."],
        complexity: "Exponential: O(2ⁿ·n) subsets, O(n!·n) permutations — pruning matters",
        pitfalls: ["Appending the path reference instead of a copy.", "Forgetting to undo state after recursion.", "Duplicate results without sorting + skipping."],
        problems: ["subsets", "combination-sum", "permutations", "subsets-ii", "combination-sum-ii", "letter-combinations-of-a-phone-number", "palindrome-partitioning", "word-search", "n-queens"],
      }),
      P({
        id: "pat-dp-1d", title: "Dynamic Programming — 1-D (Sequences)", tags: ["dp"],
        summary: "Define dp[i] as the answer for the first i elements (or ending at i), find the recurrence from the last choice, and fill it left to right.",
        signals: ["Count ways / min cost / max value over a sequence", "Choices at each step depend on previous steps (take/skip, 1 or 2 steps)", "Overlapping subproblems in the naive recursion", "'Can you reach / partition / decode…'"],
        keys: ["1) State: what does dp[i] mean? 2) Recurrence from the LAST decision. 3) Base cases. 4) Order. 5) Space optimize to O(1) when only the last few states are used.", "Start with memoized recursion if the recurrence is clearer top-down.", "Ending-at-i state for subarray problems (Kadane)."],
        idea: `<p>DP = recursion + caching. If the brute-force recursion recomputes the same (i) many times, store dp[i]. House Robber: at house i either skip it (dp[i−1]) or rob it (dp[i−2] + value).</p>`,
        java: `
int rob(int[] nums) {
    int prev2 = 0, prev1 = 0;                  // dp[i-2], dp[i-1]
    for (int x : nums) {
        int cur = Math.max(prev1, prev2 + x);  // skip vs rob
        prev2 = prev1; prev1 = cur;
    }
    return prev1;
}
int coinChange(int[] coins, int amount) {       // min coins
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1); dp[0] = 0;
    for (int s = 1; s <= amount; s++)
        for (int c : coins) if (c <= s) dp[s] = Math.min(dp[s], dp[s - c] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}`,
        python: `
from functools import cache
def climb(n):
    @cache
    def ways(i):                # top-down version of the same idea
        if i <= 1: return 1
        return ways(i - 1) + ways(i - 2)
    return ways(n)`,
        example: { title: "House robber [2, 7, 9, 3, 1]", body: `<table><tr><th>i</th><th>value</th><th>dp = max(skip, rob)</th></tr>
<tr><td>0</td><td>2</td><td>max(0, 0+2) = 2</td></tr><tr><td>1</td><td>7</td><td>max(2, 0+7) = 7</td></tr><tr><td>2</td><td>9</td><td>max(7, 2+9) = 11</td></tr>
<tr><td>3</td><td>3</td><td>max(11, 7+3) = 11</td></tr><tr><td>4</td><td>1</td><td>max(11, 11+1) = 12</td></tr></table><p>Answer 12.</p>` },
        variations: ["Kadane (max subarray), max product subarray (track min too).", "Decode ways (1- or 2-digit steps with validity).", "Word break (dp[i] = any dp[j] && s[j..i) in dict).", "LIS O(n log n) with patience sorting."],
        complexity: "Usually O(n) or O(n·k) time, O(1)–O(n) space",
        pitfalls: ["Unclear state definition — write it in one sentence first.", "Wrong base cases (dp[0]).", "Greedy where DP is needed (coin change with arbitrary coins)."],
        problems: ["climbing-stairs", "min-cost-climbing-stairs", "house-robber", "house-robber-ii", "decode-ways", "coin-change", "maximum-product-subarray", "word-break", "longest-increasing-subsequence"],
      }),
      P({
        id: "pat-dp-2d", title: "Dynamic Programming — 2-D (Grids & Two Strings)", tags: ["dp"],
        summary: "dp[i][j] over two dimensions — grid paths, or prefixes of two strings (LCS, edit distance, interleaving, regex).",
        signals: ["Grid with moves right/down: count paths, min path sum", "Two strings: common subsequence, edit distance, interleaving, matching", "Intervals of one array (burst balloons, palindromes): dp[l][r]"],
        keys: ["Two strings: dp[i][j] = answer for s1[0..i) and s2[0..j); look at the last characters.", "Grid: dp[i][j] from dp[i−1][j] and dp[i][j−1].", "Roll to one row when only the previous row is needed.", "Interval DP: fill by increasing length."],
        idea: `<p>For two sequences, the last characters either match (move diagonally) or you choose which one to drop/edit (move up or left). That single observation gives LCS, edit distance and many variants.</p>`,
        java: `
int lcs(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                ? dp[i - 1][j - 1] + 1
                : Math.max(dp[i - 1][j], dp[i][j - 1]);
    return dp[m][n];
}`,
        python: `
def edit_distance(a, b):
    prev = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        cur = [i]
        for j in range(1, len(b) + 1):
            cur.append(prev[j-1] if a[i-1] == b[j-1] else 1 + min(prev[j], cur[j-1], prev[j-1]))
        prev = cur
    return prev[-1]`,
        example: { title: "LCS of \"abcde\" and \"ace\"", body: `<table><tr><th></th><th>""</th><th>a</th><th>c</th><th>e</th></tr>
<tr><td>a</td><td>0</td><td>1</td><td>1</td><td>1</td></tr><tr><td>b</td><td>0</td><td>1</td><td>1</td><td>1</td></tr><tr><td>c</td><td>0</td><td>1</td><td>2</td><td>2</td></tr>
<tr><td>d</td><td>0</td><td>1</td><td>2</td><td>2</td></tr><tr><td>e</td><td>0</td><td>1</td><td>2</td><td>3</td></tr></table><p>Answer 3 ("ace").</p>` },
        variations: ["Unique paths / min path sum.", "Longest palindromic subsequence (LCS of s and reverse(s)).", "Distinct subsequences, interleaving string, regex/wildcard matching.", "Burst balloons (interval DP on the last balloon)."],
        complexity: "O(m·n) time, O(n) space with rolling rows",
        pitfalls: ["Off-by-one between string indices and dp indices (use i−1 for characters).", "Wrong fill order for interval DP.", "Forgetting base row/column initialization."],
        problems: ["unique-paths", "longest-common-subsequence", "edit-distance", "interleaving-string", "longest-palindromic-substring", "distinct-subsequences", "regular-expression-matching", "burst-balloons"],
      }),
      P({
        id: "pat-knapsack", title: "Knapsack DP (0/1, Unbounded, Counting)", tags: ["dp"],
        summary: "Choose items under a capacity/target: 0/1 (each once, iterate capacity downward) vs unbounded (reuse, iterate upward); count combinations vs minimize.",
        signals: ["Subset that sums to a target / partition into equal sums", "Assign + or − to reach a target", "Coins with unlimited supply: number of ways or minimum count", "Items with weight and value under a limit"],
        keys: ["0/1: for item: for s from target DOWN to w: dp[s] |= dp[s−w].", "Unbounded: iterate s UP (item can be reused).", "Counting combinations: items in the OUTER loop; permutations: amounts in the outer loop."],
        idea: `<p>dp[s] summarizes 'what's achievable with sum s using the items seen so far'. The loop direction decides whether an item can be used again within the same pass.</p>`,
        java: `
boolean canPartition(int[] nums) {
    int total = Arrays.stream(nums).sum();
    if (total % 2 != 0) return false;
    boolean[] dp = new boolean[total / 2 + 1];
    dp[0] = true;
    for (int x : nums)
        for (int s = total / 2; s >= x; s--)           // downward: each item once
            dp[s] |= dp[s - x];
    return dp[total / 2];
}
int change(int amount, int[] coins) {                  // number of combinations
    int[] ways = new int[amount + 1]; ways[0] = 1;
    for (int c : coins)
        for (int s = c; s <= amount; s++) ways[s] += ways[s - c];   // upward: reuse
    return ways[amount];
}`,
        python: `
def target_sum(nums, target):
    total = sum(nums)
    if (total + target) % 2 or abs(target) > total: return 0
    goal = (total + target) // 2
    dp = [1] + [0] * goal
    for x in nums:
        for s in range(goal, x - 1, -1): dp[s] += dp[s - x]
    return dp[goal]`,
        example: { title: "Partition [1, 5, 11, 5] → target 11", body: `<p>After 1: {0,1}; after 5: {0,1,5,6}; after 11: {…, 11, 12, 16, 17}; target 11 reachable → true.</p>` },
        variations: ["Last stone weight II (minimize difference = partition).", "Ones and zeroes (2-D capacity).", "Coin change (min coins) vs coin change II (ways)."],
        complexity: "O(n · target) time, O(target) space",
        pitfalls: ["Iterating upward in 0/1 knapsack (reuses items).", "Swapping loops in combination counting (counts permutations).", "Not checking parity/feasibility first."],
        problems: ["partition-equal-subset-sum", "target-sum", "coin-change", "coin-change-ii", "last-stone-weight-ii"],
      }),
      P({
        id: "pat-greedy", title: "Greedy", tags: ["greedy"],
        summary: "Make the locally optimal choice at each step when an exchange argument shows it's globally optimal — usually after sorting.",
        signals: ["Scheduling / selecting max non-overlapping items", "Reachability with jumps", "Gas station, partition labels", "Problems where 'take the best available now' never hurts"],
        keys: ["Find the invariant or exchange argument: swapping any optimal solution's choice with the greedy one doesn't make it worse.", "Often: sort by end time / ratio / deadline, then one pass.", "If you can build a counterexample, it's DP, not greedy."],
        idea: `<p>Jump Game: track the farthest index reachable so far; if the current index exceeds it you're stuck. No need to explore every jump — the farthest reach dominates all others.</p>`,
        java: `
boolean canJump(int[] nums) {
    int reach = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > reach) return false;
        reach = Math.max(reach, i + nums[i]);
    }
    return true;
}
int jumpII(int[] nums) {                   // min jumps: BFS by windows
    int jumps = 0, end = 0, far = 0;
    for (int i = 0; i < nums.length - 1; i++) {
        far = Math.max(far, i + nums[i]);
        if (i == end) { jumps++; end = far; }
    }
    return jumps;
}`,
        python: `
def can_complete_circuit(gas, cost):
    if sum(gas) < sum(cost): return -1
    tank = start = 0
    for i in range(len(gas)):
        tank += gas[i] - cost[i]
        if tank < 0: start, tank = i + 1, 0     # nothing before i+1 can be the start
    return start`,
        example: { title: "Jump game [2, 3, 1, 1, 4]", body: `<p>i=0 reach 2; i=1 reach 4 (≥ last index) → true. For [3,2,1,0,4]: reach stays 3, i=4 &gt; 3 → false.</p>` },
        variations: ["Partition labels (last occurrence).", "Valid parenthesis string (range of open counts).", "Hand of straights (smallest card first)."],
        complexity: "Usually O(n) or O(n log n) with sorting",
        pitfalls: ["Applying greedy without justification (coin change with coins [1,3,4], amount 6).", "Sorting by the wrong key."],
        problems: ["maximum-subarray", "jump-game", "jump-game-ii", "gas-station", "partition-labels", "hand-of-straights", "valid-parenthesis-string"],
      }),
      P({
        id: "pat-trie", title: "Trie (Prefix Tree)", tags: ["trie", "strings"],
        summary: "A tree of characters for fast prefix queries — autocomplete, dictionary search with wildcards, and multi-word grid search.",
        signals: ["Many prefix / startsWith queries", "Search words with wildcards", "Find many dictionary words in a grid (word search II)", "Longest common prefix, autocomplete"],
        keys: ["Node = children map/array + end-of-word flag.", "Insert/search O(word length).", "Combine with DFS: walk the trie while walking the grid, prune when no child matches."],
        idea: `<p>Words sharing a prefix share a path, so a prefix query is just walking down L nodes, independent of how many words exist.</p>`,
        java: `
class Trie {
    private final Trie[] next = new Trie[26];
    private boolean end;
    void insert(String w) {
        Trie t = this;
        for (char c : w.toCharArray()) {
            if (t.next[c - 'a'] == null) t.next[c - 'a'] = new Trie();
            t = t.next[c - 'a'];
        }
        t.end = true;
    }
    private Trie walk(String s) {
        Trie t = this;
        for (char c : s.toCharArray()) { t = t.next[c - 'a']; if (t == null) return null; }
        return t;
    }
    boolean search(String w) { Trie t = walk(w); return t != null && t.end; }
    boolean startsWith(String p) { return walk(p) != null; }
}`,
        python: `
class Trie:
    def __init__(self): self.root = {}
    def insert(self, w):
        node = self.root
        for c in w: node = node.setdefault(c, {})
        node['$'] = True
    def starts_with(self, p):
        node = self.root
        for c in p:
            if c not in node: return False
            node = node[c]
        return True`,
        example: { title: "Insert apple, app; search \"app\", startsWith \"ap\"", body: `<p>Path a→p→p (end ✓)→l→e (end ✓). search("app") → true (end flag on the second p); startsWith("ap") → true; search("ap") → false (no end flag).</p>` },
        variations: ["Wildcard search ('.' tries all children).", "Word search II (trie + grid DFS + pruning).", "Maximum XOR pair (binary trie)."],
        complexity: "O(L) per operation; space O(total characters)",
        pitfalls: ["Forgetting the end-of-word flag (prefix vs word).", "Not pruning found words in Word Search II (TLE)."],
        problems: ["implement-trie-prefix-tree", "design-add-and-search-words-data-structure", "word-search-ii"],
      }),
      P({
        id: "pat-bits", title: "Bit Manipulation", tags: ["bits", "math"],
        summary: "Use binary tricks — XOR cancellation, masks, shifts and n & (n − 1) — for O(1)-space counting and set tricks.",
        signals: ["Find the element that appears once (others twice)", "Count set bits, powers of two", "Subsets as bitmasks (n ≤ 20)", "Add without + / reverse bits / missing number"],
        keys: ["x ^ x = 0 and x ^ 0 = x → XOR cancels pairs.", "n & (n − 1) clears the lowest set bit; n & −n isolates it.", "Mask iteration: for mask in 0..2ⁿ−1, bit i set ⇒ element i chosen."],
        idea: `<p>XOR is addition without carry and is its own inverse, which makes it perfect for 'cancel out duplicates'. Bitmasks encode subsets in a single integer for DP over subsets.</p>`,
        java: `
int singleNumber(int[] nums) { int x = 0; for (int v : nums) x ^= v; return x; }
int popcount(int n) { int c = 0; while (n != 0) { n &= n - 1; c++; } return c; }
boolean isPowerOfTwo(int n) { return n > 0 && (n & (n - 1)) == 0; }
int[] countBits(int n) { int[] r = new int[n + 1]; for (int i = 1; i <= n; i++) r[i] = r[i >> 1] + (i & 1); return r; }`,
        python: `
def missing_number(nums):
    x = len(nums)
    for i, v in enumerate(nums): x ^= i ^ v
    return x

def all_subsets(nums):
    return [[nums[i] for i in range(len(nums)) if mask >> i & 1] for mask in range(1 << len(nums))]`,
        example: { title: "Single number [4, 1, 2, 1, 2]", body: `<p>0^4 = 4; ^1 = 5; ^2 = 7; ^1 = 6; ^2 = 4 → answer 4 (pairs cancel).</p>` },
        variations: ["Single number II (count bits mod 3).", "Sum of two integers with XOR + carry.", "DP over subsets (travelling salesman style)."],
        complexity: "O(n) or O(bits) time, O(1) space",
        pitfalls: ["Signed shifts in Java/JS (use >>> for unsigned).", "Python ints are unbounded — mask with 0xFFFFFFFF.", "Operator precedence: wrap bit ops in parentheses."],
        problems: ["single-number", "number-of-1-bits", "counting-bits", "missing-number", "reverse-bits", "sum-of-two-integers"],
      }),
      P({
        id: "pat-cyclic-sort", title: "Cyclic Sort & Index-as-Hash", tags: ["arrays"],
        summary: "When values lie in 1..n, place each value at its own index (or mark indices) to find missing/duplicate numbers in O(n) time and O(1) space.",
        signals: ["Array of n numbers in range 1..n (or 0..n)", "Find missing / duplicate / first missing positive", "O(1) extra space required"],
        keys: ["Swap nums[i] into position nums[i] − 1 until it's placed or out of range.", "Then scan for the first index i where nums[i] ≠ i + 1.", "Alternative: mark presence by negating nums[abs(v) − 1]."],
        idea: `<p>The array itself is a hash table whose keys are indices. Each swap puts one value in its final place, so the total number of swaps is ≤ n.</p>`,
        java: `
int firstMissingPositive(int[] a) {
    int n = a.length;
    for (int i = 0; i < n; i++)
        while (a[i] > 0 && a[i] <= n && a[a[i] - 1] != a[i]) {
            int j = a[i] - 1; int t = a[i]; a[i] = a[j]; a[j] = t;
        }
    for (int i = 0; i < n; i++) if (a[i] != i + 1) return i + 1;
    return n + 1;
}`,
        python: `
def find_disappeared(nums):
    for v in nums:
        i = abs(v) - 1
        nums[i] = -abs(nums[i])          # mark index i as seen
    return [i + 1 for i, v in enumerate(nums) if v > 0]`,
        example: { title: "[3, 4, −1, 1]", body: `<p>i=0: 3 → swap to index 2 → [−1,4,3,1]; −1 out of range. i=1: 4 → index 3 → [−1,1,3,4]; 1 → index 0 → [1,−1,3,4]. Scan: index 1 holds −1 ≠ 2 → answer 2.</p>` },
        variations: ["Find all duplicates (negation marking).", "Find the duplicate (Floyd) when modifying is not allowed.", "Missing number (XOR or sum)."],
        complexity: "O(n) time, O(1) space",
        pitfalls: ["Infinite loop with duplicates — check the target already holds the value.", "Mutating input when the problem forbids it."],
        problems: ["missing-number", "find-all-numbers-disappeared-in-an-array", "find-the-duplicate-number", "first-missing-positive"],
      }),
    ],
  });
})();
