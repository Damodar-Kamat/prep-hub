/* DSA practice — batch 3: big-tech frequent problems (arrays, strings, intervals, heaps, stacks, design).
   Extra fields used by the UI: lc (LeetCode slug), companies[], pattern, stuck[] (step-by-step "if you're stuck" ladder),
   complexity, and java/python starters registered in STUDY_STARTERS. `code` is the reference JS solution
   (it is also what the automated self-check runs against the tests). */
window.STUDY_PROBLEMS = window.STUDY_PROBLEMS || [];
window.STUDY_STARTERS = window.STUDY_STARTERS || {};
window.__addProblems = window.__addProblems || function (list) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  for (const p of list) {
    const t = (x) => ({ input: x[0], expected: x[1], hidden: !!x[2], unordered: !!x[3] });
    window.STUDY_PROBLEMS.push({
      id: p.id, title: p.title, difficulty: p.difficulty, tags: p.tags, lc: p.lc, companies: p.companies, pattern: p.pattern,
      relatedTopic: p.relatedTopic, statement: p.statement, examples: p.examples, constraints: p.constraints,
      concept: p.concept, stuck: p.stuck, complexity: p.complexity, fnName: p.fnName,
      starter: p.starter, tests: p.tests.map(t), hints: p.hints, code: p.code,
      solution: `<p>${p.explain}</p><p><b>Complexity:</b> ${p.complexity}</p><pre><code>${esc(p.code)}</code></pre>`,
    });
    if (p.java || p.python) window.STUDY_STARTERS[p.id] = { java: p.java, python: p.python };
  }
};

window.__addProblems([
  // ------------------------------------------------------------------ Arrays & hashing
  {
    id: "group-anagrams", title: "Group Anagrams", difficulty: "Medium", lc: "group-anagrams",
    tags: ["Array", "Hashing", "String"], companies: ["Amazon", "Meta", "Google", "Microsoft", "Uber"], pattern: "Hash map with a canonical key",
    relatedTopic: "/topic/dsa/dsa-hashing?m=deep",
    statement: `<p>Given an array of strings, group the anagrams together. Return the groups sorted: each group's words sorted alphabetically, and groups sorted by their first word.</p>`,
    examples: [{ in: 'strs = ["eat","tea","tan","ate","nat","bat"]', out: '[["ate","eat","tea"],["bat"],["nat","tan"]]' }],
    constraints: ["1 <= strs.length <= 10^4", "strings contain lowercase letters"],
    concept: `<p>Anagrams share the same multiset of letters. Map every word to a <b>canonical key</b> — its sorted letters, or a 26-count signature — and bucket words by key in a hash map.</p>`,
    stuck: ["What do 'eat', 'tea' and 'ate' have in common that other words don't? (same letters)", "Can you turn each word into a single key that is identical for all its anagrams? Try sorting its letters.", "Use a map: key → list of words. One pass over the input.", "Finally sort each group and sort the groups (only needed for this app's deterministic output)."],
    complexity: "O(n · k log k) time with sorted keys (O(n · k) with count keys), O(n · k) space",
    fnName: "groupAnagrams",
    starter: "function groupAnagrams(strs) {\n  \n}\n",
    tests: [[[["eat", "tea", "tan", "ate", "nat", "bat"]], [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]]], [[[""]], [[""]]], [[["a"]], [["a"]]], [[["abc", "bca", "cab", "xyz", "zyx", "q"]], [["abc", "bca", "cab"], ["q"], ["xyz", "zyx"]], true]],
    hints: ["Two words are anagrams iff their sorted letters are equal.", "Use the sorted word as a hash map key.", "Collect the map's values; sort for stable output."],
    explain: "Bucket words by their sorted-letter key.",
    code: `function groupAnagrams(strs) {
  const m = new Map();
  for (const s of strs) {
    const k = [...s].sort().join("");
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(s);
  }
  return [...m.values()].map(g => g.sort()).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}`,
    java: `import java.util.*;

class Main {
    static List<List<String>> groupAnagrams(String[] strs) {
        // your code: map sorted-letters key -> list of words
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        System.out.println(groupAnagrams(new String[]{"eat","tea","tan","ate","nat","bat"}));
        // expected groups: [ate, eat, tea], [bat], [nat, tan] (any order)
    }
}
`,
    python: `def groupAnagrams(strs):
    # your code: dict sorted-letters -> list
    return []


if __name__ == "__main__":
    print(groupAnagrams(["eat","tea","tan","ate","nat","bat"]))
`,
  },
  {
    id: "subarray-sum-k", title: "Subarray Sum Equals K", difficulty: "Medium", lc: "subarray-sum-equals-k",
    tags: ["Array", "Hashing", "Prefix Sum"], companies: ["Meta", "Google", "Amazon", "Microsoft"], pattern: "Prefix sums + hash map of counts",
    relatedTopic: "/topic/dsa/dsa-hashing?m=deep",
    statement: `<p>Given an integer array <code>nums</code> (may contain negatives) and an integer <code>k</code>, return the number of contiguous subarrays whose sum equals <code>k</code>.</p>`,
    examples: [{ in: "nums = [1,1,1], k = 2", out: "2" }, { in: "nums = [1,2,3], k = 3", out: "2" }],
    constraints: ["1 <= nums.length <= 2*10^4", "-1000 <= nums[i] <= 1000"],
    concept: `<p>sum(i..j) = prefix[j] − prefix[i−1]. We need prefix[i−1] = prefix[j] − k. Walk left to right keeping a count of every prefix sum seen so far; for each position add count[prefix − k]. Sliding window fails because of negative numbers.</p>`,
    stuck: ["Brute force: every (i, j) pair, O(n²). Can you compute any subarray sum in O(1)? (prefix sums)", "Rewrite 'sum(i..j) = k' using prefix sums: prefix[j] − prefix[i−1] = k.", "So at position j you need to know how many earlier prefixes equal prefix[j] − k → keep a hash map of prefix counts.", "Initialize the map with {0: 1} so subarrays starting at index 0 are counted."],
    complexity: "O(n) time, O(n) space",
    fnName: "subarraySum",
    starter: "function subarraySum(nums, k) {\n  \n}\n",
    tests: [[[[1, 1, 1], 2], 2], [[[1, 2, 3], 3], 2], [[[1, -1, 0], 0], 3], [[[3, 4, 7, 2, -3, 1, 4, 2], 7], 4, true], [[[1], 0], 0, true], [[[-1, -1, 1], 0], 1, true]],
    hints: ["Why doesn't a sliding window work here? (negatives)", "prefix[j] − prefix[i] = k ⇒ look up prefix[j] − k.", "Seed the map with prefix 0 seen once."],
    explain: "Count prefix sums seen so far; each time, add how many earlier prefixes equal current − k.",
    code: `function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]);
  let sum = 0, count = 0;
  for (const x of nums) {
    sum += x;
    count += seen.get(sum - k) || 0;
    seen.set(sum, (seen.get(sum) || 0) + 1);
  }
  return count;
}`,
    java: `import java.util.*;

class Main {
    static int subarraySum(int[] nums, int k) {
        // your code: prefix sum + HashMap<Integer,Integer> counts (seed with 0 -> 1)
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(subarraySum(new int[]{1, 1, 1}, 2)); // 2
        System.out.println(subarraySum(new int[]{1, 2, 3}, 3)); // 2
    }
}
`,
    python: `def subarraySum(nums, k):
    # your code
    return 0


if __name__ == "__main__":
    print(subarraySum([1, 1, 1], 2))  # 2
    print(subarraySum([1, 2, 3], 3))  # 2
`,
  },
  {
    id: "sort-colors", title: "Sort Colors (Dutch National Flag)", difficulty: "Medium", lc: "sort-colors",
    tags: ["Array", "Two Pointers"], companies: ["Microsoft", "Amazon", "Meta", "Adobe"], pattern: "Three pointers (low / mid / high)",
    relatedTopic: "/topic/dsa/dsa-twopointers?m=deep",
    statement: `<p>An array contains only 0s, 1s and 2s. Sort it in place in one pass without using a library sort, and return it.</p>`,
    examples: [{ in: "nums = [2,0,2,1,1,0]", out: "[0,0,1,1,2,2]" }],
    constraints: ["1 <= n <= 300"],
    concept: `<p>Maintain three regions: [0, low) are 0s, [low, mid) are 1s, (high, end] are 2s. Look at nums[mid]: 0 → swap with low, advance both; 1 → advance mid; 2 → swap with high, shrink high (don't advance mid — the swapped-in value is unexamined).</p>`,
    stuck: ["Counting sort (count 0s,1s,2s then overwrite) works in two passes — say it first.", "For one pass, think of three growing/shrinking regions for 0s, 1s and 2s.", "Use pointers low, mid, high. What should happen when nums[mid] is 0? 1? 2?", "After swapping with high, why must you NOT advance mid?"],
    complexity: "O(n) time, O(1) space",
    fnName: "sortColors",
    starter: "function sortColors(nums) {\n  // sort in place, then return nums\n  return nums;\n}\n",
    tests: [[[[2, 0, 2, 1, 1, 0]], [0, 0, 1, 1, 2, 2]], [[[2, 0, 1]], [0, 1, 2]], [[[0]], [0]], [[[1, 2, 0, 0, 2, 1, 1]], [0, 0, 1, 1, 1, 2, 2], true], [[[2, 2, 2]], [2, 2, 2], true]],
    hints: ["Three regions: 0s | 1s | unknown | 2s.", "Swap 0s to the low boundary and 2s to the high boundary.", "Loop while mid <= high."],
    explain: "Dijkstra's Dutch national flag partitioning.",
    code: `function sortColors(nums) {
  let lo = 0, mid = 0, hi = nums.length - 1;
  while (mid <= hi) {
    if (nums[mid] === 0) { [nums[lo], nums[mid]] = [nums[mid], nums[lo]]; lo++; mid++; }
    else if (nums[mid] === 1) mid++;
    else { [nums[mid], nums[hi]] = [nums[hi], nums[mid]]; hi--; }
  }
  return nums;
}`,
    java: `import java.util.*;

class Main {
    static void sortColors(int[] nums) {
        // your code: low / mid / high pointers
    }

    public static void main(String[] args) {
        int[] a = {2, 0, 2, 1, 1, 0};
        sortColors(a);
        System.out.println(Arrays.toString(a)); // [0, 0, 1, 1, 2, 2]
    }
}
`,
    python: `def sortColors(nums):
    # your code (in place)
    return nums


if __name__ == "__main__":
    print(sortColors([2, 0, 2, 1, 1, 0]))  # [0, 0, 1, 1, 2, 2]
`,
  },
  {
    id: "next-permutation", title: "Next Permutation", difficulty: "Medium", lc: "next-permutation",
    tags: ["Array", "Two Pointers"], companies: ["Google", "Meta", "Amazon", "Microsoft", "Bloomberg"], pattern: "Find pivot from the right, swap, reverse suffix",
    relatedTopic: "/topic/dsa/dsa-arrays?m=deep",
    statement: `<p>Rearrange <code>nums</code> into the lexicographically next greater permutation, in place. If none exists (array is descending), rearrange into ascending order. Return the array.</p>`,
    examples: [{ in: "nums = [1,2,3]", out: "[1,3,2]" }, { in: "nums = [3,2,1]", out: "[1,2,3]" }, { in: "nums = [1,1,5]", out: "[1,5,1]" }],
    constraints: ["1 <= n <= 100"],
    concept: `<p>The suffix that is non-increasing is already the largest arrangement of its digits. The pivot is the element just before that suffix: swap it with the smallest suffix element larger than it (the rightmost such), then reverse the suffix to make it the smallest arrangement.</p>`,
    stuck: ["Write out the permutations of [1,2,3] in order. What changes between neighbours?", "Scan from the right for the first i with nums[i] < nums[i+1] (the pivot). Everything after it is descending.", "Swap the pivot with the rightmost element greater than it.", "Reverse the suffix after the pivot. If no pivot exists, reverse the whole array."],
    complexity: "O(n) time, O(1) space",
    fnName: "nextPermutation",
    starter: "function nextPermutation(nums) {\n  // modify in place, then return nums\n  return nums;\n}\n",
    tests: [[[[1, 2, 3]], [1, 3, 2]], [[[3, 2, 1]], [1, 2, 3]], [[[1, 1, 5]], [1, 5, 1]], [[[1, 3, 2]], [2, 1, 3], true], [[[2, 3, 1]], [3, 1, 2], true], [[[1]], [1], true], [[[1, 5, 8, 4, 7, 6, 5, 3, 1]], [1, 5, 8, 5, 1, 3, 4, 6, 7], true]],
    hints: ["Find the longest non-increasing suffix.", "The element before it is the pivot.", "Swap with the rightmost larger element, then reverse the suffix."],
    explain: "Classic three-step algorithm: pivot, swap, reverse.",
    code: `function nextPermutation(nums) {
  let i = nums.length - 2;
  while (i >= 0 && nums[i] >= nums[i + 1]) i--;
  if (i >= 0) {
    let j = nums.length - 1;
    while (nums[j] <= nums[i]) j--;
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  for (let l = i + 1, r = nums.length - 1; l < r; l++, r--) [nums[l], nums[r]] = [nums[r], nums[l]];
  return nums;
}`,
    java: `import java.util.*;

class Main {
    static void nextPermutation(int[] nums) {
        // your code: pivot from right, swap with rightmost larger, reverse suffix
    }

    public static void main(String[] args) {
        int[] a = {1, 2, 3}; nextPermutation(a); System.out.println(Arrays.toString(a)); // [1, 3, 2]
        int[] b = {3, 2, 1}; nextPermutation(b); System.out.println(Arrays.toString(b)); // [1, 2, 3]
    }
}
`,
    python: `def nextPermutation(nums):
    # your code (in place)
    return nums


if __name__ == "__main__":
    print(nextPermutation([1, 2, 3]))  # [1, 3, 2]
    print(nextPermutation([3, 2, 1]))  # [1, 2, 3]
`,
  },
  {
    id: "spiral-matrix", title: "Spiral Matrix", difficulty: "Medium", lc: "spiral-matrix",
    tags: ["Array", "Matrix", "Simulation"], companies: ["Amazon", "Microsoft", "Google", "Apple"], pattern: "Shrinking boundaries simulation",
    relatedTopic: "/topic/dsa/dsa-arrays?m=deep",
    statement: `<p>Return all elements of an m × n matrix in spiral order (clockwise from the top-left).</p>`,
    examples: [{ in: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", out: "[1,2,3,6,9,8,7,4,5]" }],
    constraints: ["1 <= m, n <= 10"],
    concept: `<p>Keep four boundaries: top, bottom, left, right. Traverse the top row left→right then top++; right column top→bottom then right--; bottom row right→left (if top ≤ bottom) then bottom--; left column bottom→top (if left ≤ right) then left++.</p>`,
    stuck: ["Trace a 3×3 and a 3×4 by hand — which rows/columns are consumed in each lap?", "Keep four boundaries and shrink one after each side.", "Guard the bottom-row and left-column passes: the remaining area may be a single row or column."],
    complexity: "O(m·n) time, O(1) extra space",
    fnName: "spiralOrder",
    starter: "function spiralOrder(matrix) {\n  \n}\n",
    tests: [[[[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], [1, 2, 3, 6, 9, 8, 7, 4, 5]], [[[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]], [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]], [[[[1]]], [1]], [[[[1, 2], [3, 4], [5, 6]]], [1, 2, 4, 6, 5, 3], true], [[[[1, 2, 3]]], [1, 2, 3], true], [[[[1], [2], [3]]], [1, 2, 3], true]],
    hints: ["Four pointers: top, bottom, left, right.", "Shrink after each side.", "Check top <= bottom and left <= right before the 3rd and 4th passes."],
    explain: "Simulate with shrinking boundaries.",
    code: `function spiralOrder(matrix) {
  const out = [];
  let top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(matrix[top][c]);
    top++;
    for (let r = top; r <= bottom; r++) out.push(matrix[r][right]);
    right--;
    if (top <= bottom) { for (let c = right; c >= left; c--) out.push(matrix[bottom][c]); bottom--; }
    if (left <= right) { for (let r = bottom; r >= top; r--) out.push(matrix[r][left]); left++; }
  }
  return out;
}`,
    java: `import java.util.*;

class Main {
    static List<Integer> spiralOrder(int[][] matrix) {
        // your code: top/bottom/left/right boundaries
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        System.out.println(spiralOrder(new int[][]{{1,2,3},{4,5,6},{7,8,9}})); // [1, 2, 3, 6, 9, 8, 7, 4, 5]
    }
}
`,
    python: `def spiralOrder(matrix):
    # your code
    return []


if __name__ == "__main__":
    print(spiralOrder([[1,2,3],[4,5,6],[7,8,9]]))  # [1, 2, 3, 6, 9, 8, 7, 4, 5]
`,
  },
  {
    id: "rotate-image", title: "Rotate Image (90° in place)", difficulty: "Medium", lc: "rotate-image",
    tags: ["Array", "Matrix"], companies: ["Amazon", "Microsoft", "Apple", "Meta"], pattern: "Transpose + reverse rows",
    relatedTopic: "/topic/dsa/dsa-arrays?m=deep",
    statement: `<p>Rotate an n × n matrix by 90 degrees clockwise in place, and return it.</p>`,
    examples: [{ in: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", out: "[[7,4,1],[8,5,2],[9,6,3]]" }],
    constraints: ["1 <= n <= 20"],
    concept: `<p>A clockwise rotation equals a <b>transpose</b> (swap m[i][j] with m[j][i]) followed by <b>reversing each row</b>. Both steps are in place.</p>`,
    stuck: ["Where does element (i, j) end up after rotating? (row j, column n−1−i)", "Can you get there with two simpler operations? Try transposing a 3×3 on paper.", "After transposing, what does reversing each row do?"],
    complexity: "O(n²) time, O(1) space",
    fnName: "rotate",
    starter: "function rotate(matrix) {\n  // rotate in place, then return matrix\n  return matrix;\n}\n",
    tests: [[[[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], [[7, 4, 1], [8, 5, 2], [9, 6, 3]]], [[[[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]]], [[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]]], [[[[1]]], [[1]], true], [[[[1, 2], [3, 4]]], [[3, 1], [4, 2]], true]],
    hints: ["Transpose first.", "Only swap j > i in the transpose loop.", "Then reverse each row."],
    explain: "Transpose then reverse rows.",
    code: `function rotate(matrix) {
  const n = matrix.length;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
  for (const row of matrix) row.reverse();
  return matrix;
}`,
    java: `import java.util.*;

class Main {
    static void rotate(int[][] m) {
        // your code: transpose, then reverse each row
    }

    public static void main(String[] args) {
        int[][] m = {{1,2,3},{4,5,6},{7,8,9}};
        rotate(m);
        System.out.println(Arrays.deepToString(m)); // [[7, 4, 1], [8, 5, 2], [9, 6, 3]]
    }
}
`,
    python: `def rotate(matrix):
    # your code (in place)
    return matrix


if __name__ == "__main__":
    print(rotate([[1,2,3],[4,5,6],[7,8,9]]))  # [[7,4,1],[8,5,2],[9,6,3]]
`,
  },
  {
    id: "first-missing-positive", title: "First Missing Positive", difficulty: "Hard", lc: "first-missing-positive",
    tags: ["Array", "Hashing"], companies: ["Amazon", "Google", "Meta", "Microsoft"], pattern: "Index as hash (cyclic placement)",
    relatedTopic: "/topic/dsa/dsa-arrays?m=deep",
    statement: `<p>Given an unsorted integer array, return the smallest missing positive integer, in O(n) time and O(1) extra space.</p>`,
    examples: [{ in: "nums = [1,2,0]", out: "3" }, { in: "nums = [3,4,-1,1]", out: "2" }, { in: "nums = [7,8,9,11,12]", out: "1" }],
    constraints: ["1 <= n <= 10^5"],
    concept: `<p>The answer is in [1, n+1]. Use the array itself as a hash table: place every value v in [1, n] at index v−1 by repeated swaps. Then the first index i where nums[i] ≠ i+1 gives the answer i+1; if all match, answer n+1.</p>`,
    stuck: ["What's the largest possible answer for an array of length n? (n+1)", "With a hash set it's easy (O(n) space). How can the array itself act as the set?", "Try putting value v at index v−1 using swaps; ignore values outside 1..n.", "Scan for the first position that doesn't hold its own index+1."],
    complexity: "O(n) time (each swap places a value permanently), O(1) space",
    fnName: "firstMissingPositive",
    starter: "function firstMissingPositive(nums) {\n  \n}\n",
    tests: [[[[1, 2, 0]], 3], [[[3, 4, -1, 1]], 2], [[[7, 8, 9, 11, 12]], 1], [[[1]], 2, true], [[[2, 2, 1, 1]], 3, true], [[[1, 2, 3, 4, 5]], 6, true], [[[-5, 0, 2]], 1, true]],
    hints: ["Answer ∈ [1, n+1].", "Cyclic sort: swap nums[i] into position nums[i]−1 while it's in range and not already there.", "Beware infinite loops with duplicates: stop when the target already holds the value."],
    explain: "Cyclic placement, then scan.",
    code: `function firstMissingPositive(nums) {
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
      const j = nums[i] - 1;
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
  }
  for (let i = 0; i < n; i++) if (nums[i] !== i + 1) return i + 1;
  return n + 1;
}`,
    java: `import java.util.*;

class Main {
    static int firstMissingPositive(int[] nums) {
        // your code: cyclic placement, then scan
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(firstMissingPositive(new int[]{3, 4, -1, 1})); // 2
        System.out.println(firstMissingPositive(new int[]{7, 8, 9, 11, 12})); // 1
    }
}
`,
    python: `def firstMissingPositive(nums):
    # your code
    return 0


if __name__ == "__main__":
    print(firstMissingPositive([3, 4, -1, 1]))  # 2
`,
  },
  // ------------------------------------------------------------------ Intervals
  {
    id: "insert-interval", title: "Insert Interval", difficulty: "Medium", lc: "insert-interval",
    tags: ["Array", "Intervals"], companies: ["Google", "Meta", "Amazon", "LinkedIn"], pattern: "Three-phase interval sweep",
    relatedTopic: "/topic/dsa/dsa-sorting?m=deep",
    statement: `<p>Given non-overlapping intervals sorted by start and a new interval, insert it and merge overlaps. Return the result.</p>`,
    examples: [{ in: "intervals = [[1,3],[6,9]], newInterval = [2,5]", out: "[[1,5],[6,9]]" }],
    constraints: ["0 <= intervals.length <= 10^4"],
    concept: `<p>Three phases: add all intervals ending before the new one starts; merge all that overlap (extend start/end); add the rest.</p>`,
    stuck: ["Draw the intervals on a number line with the new one.", "Which intervals are entirely to the left? Entirely to the right? The rest overlap.", "Merge overlapping ones by taking min start and max end."],
    complexity: "O(n) time, O(n) output",
    fnName: "insert",
    starter: "function insert(intervals, newInterval) {\n  \n}\n",
    tests: [[[[[1, 3], [6, 9]], [2, 5]], [[1, 5], [6, 9]]], [[[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]], [[1, 2], [3, 10], [12, 16]]], [[[], [5, 7]], [[5, 7]]], [[[[1, 5]], [2, 3]], [[1, 5]], true], [[[[1, 5]], [6, 8]], [[1, 5], [6, 8]], true], [[[[3, 5]], [1, 2]], [[1, 2], [3, 5]], true]],
    hints: ["Intervals are sorted — one pass is enough.", "Overlap test: a.start <= b.end && b.start <= a.end.", "Push the merged new interval once, between the two phases."],
    explain: "Left part, merged middle, right part.",
    code: `function insert(intervals, newInterval) {
  const out = [];
  let [s, e] = newInterval, i = 0;
  while (i < intervals.length && intervals[i][1] < s) out.push(intervals[i++]);
  while (i < intervals.length && intervals[i][0] <= e) { s = Math.min(s, intervals[i][0]); e = Math.max(e, intervals[i][1]); i++; }
  out.push([s, e]);
  while (i < intervals.length) out.push(intervals[i++]);
  return out;
}`,
    java: `import java.util.*;

class Main {
    static int[][] insert(int[][] intervals, int[] newInterval) {
        // your code: left part, merge overlaps, right part
        return new int[0][];
    }

    public static void main(String[] args) {
        System.out.println(Arrays.deepToString(insert(new int[][]{{1,3},{6,9}}, new int[]{2,5}))); // [[1, 5], [6, 9]]
    }
}
`,
    python: `def insert(intervals, newInterval):
    # your code
    return []


if __name__ == "__main__":
    print(insert([[1,3],[6,9]], [2,5]))  # [[1, 5], [6, 9]]
`,
  },
  {
    id: "non-overlapping-intervals", title: "Non-overlapping Intervals", difficulty: "Medium", lc: "non-overlapping-intervals",
    tags: ["Intervals", "Greedy", "Sorting"], companies: ["Amazon", "Google", "Meta"], pattern: "Greedy by earliest end",
    relatedTopic: "/topic/dsa/dsa-sorting?m=deep",
    statement: `<p>Return the minimum number of intervals to remove so the rest don't overlap (touching at endpoints is fine).</p>`,
    examples: [{ in: "intervals = [[1,2],[2,3],[3,4],[1,3]]", out: "1" }, { in: "intervals = [[1,2],[1,2],[1,2]]", out: "2" }],
    constraints: ["1 <= n <= 10^5"],
    concept: `<p>Equivalent to keeping the maximum number of non-overlapping intervals (activity selection). Sort by end; greedily keep an interval if it starts at or after the last kept end. Answer = n − kept.</p>`,
    stuck: ["Flip the question: what's the most intervals you can keep?", "Classic greedy: which interval should you keep first to leave the most room? (the one that ends earliest)", "Sort by end, keep if start >= lastEnd, otherwise count a removal."],
    complexity: "O(n log n) time, O(1) extra",
    fnName: "eraseOverlapIntervals",
    starter: "function eraseOverlapIntervals(intervals) {\n  \n}\n",
    tests: [[[[[1, 2], [2, 3], [3, 4], [1, 3]]], 1], [[[[1, 2], [1, 2], [1, 2]]], 2], [[[[1, 2], [2, 3]]], 0], [[[[1, 100], [11, 22], [1, 11], [2, 12]]], 2, true], [[[[0, 2], [1, 3], [2, 4], [3, 5], [4, 6]]], 2, true]],
    hints: ["Sort by end time.", "Track the end of the last kept interval.", "Overlap iff start < lastEnd."],
    explain: "Activity selection: keep earliest-ending intervals.",
    code: `function eraseOverlapIntervals(intervals) {
  intervals.sort((a, b) => a[1] - b[1]);
  let end = -Infinity, removed = 0;
  for (const [s, e] of intervals) {
    if (s >= end) end = e; else removed++;
  }
  return removed;
}`,
    java: `import java.util.*;

class Main {
    static int eraseOverlapIntervals(int[][] intervals) {
        // your code: sort by end, greedy keep
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(eraseOverlapIntervals(new int[][]{{1,2},{2,3},{3,4},{1,3}})); // 1
    }
}
`,
    python: `def eraseOverlapIntervals(intervals):
    # your code
    return 0


if __name__ == "__main__":
    print(eraseOverlapIntervals([[1,2],[2,3],[3,4],[1,3]]))  # 1
`,
  },
  {
    id: "meeting-rooms-ii", title: "Meeting Rooms II (minimum rooms)", difficulty: "Medium", lc: "meeting-rooms-ii",
    tags: ["Intervals", "Heap", "Sorting"], companies: ["Google", "Meta", "Amazon", "Microsoft", "Uber", "Bloomberg"], pattern: "Sweep line / min-heap of end times",
    relatedTopic: "/topic/dsa/dsa-heaps?m=deep",
    statement: `<p>Given meeting time intervals <code>[start, end)</code>, return the minimum number of conference rooms required.</p>`,
    examples: [{ in: "intervals = [[0,30],[5,10],[15,20]]", out: "2" }, { in: "intervals = [[7,10],[2,4]]", out: "1" }],
    constraints: ["1 <= n <= 10^4"],
    concept: `<p>The answer is the maximum number of meetings happening at the same moment. Sweep line: sort starts and ends separately; walk starts, and each time a start comes before the earliest unfinished end, you need another room. Equivalent: min-heap of end times.</p>`,
    stuck: ["Rephrase: at the busiest moment, how many meetings overlap?", "Create +1 events at starts and −1 at ends; sort; track the running max. (end before start at equal times, since [s,e) is half-open)", "Or: sort by start and keep a min-heap of end times; pop if the earliest end ≤ current start; heap size is the room count."],
    complexity: "O(n log n) time, O(n) space",
    fnName: "minMeetingRooms",
    starter: "function minMeetingRooms(intervals) {\n  \n}\n",
    tests: [[[[[0, 30], [5, 10], [15, 20]]], 2], [[[[7, 10], [2, 4]]], 1], [[[[1, 5], [5, 10]]], 1], [[[[1, 10], [2, 7], [3, 19], [8, 12], [10, 20], [11, 30]]], 4, true], [[[[1, 2], [1, 2], [1, 2]]], 3, true]],
    hints: ["Maximum overlap = rooms.", "Separate sorted arrays of starts and ends.", "Two pointers: if start < end[j] need a room, else reuse (j++)."],
    explain: "Two sorted arrays of starts and ends; count concurrent meetings.",
    code: `function minMeetingRooms(intervals) {
  const starts = intervals.map(i => i[0]).sort((a, b) => a - b);
  const ends = intervals.map(i => i[1]).sort((a, b) => a - b);
  let rooms = 0, j = 0;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] < ends[j]) rooms++; else j++;
  }
  return rooms;
}`,
    java: `import java.util.*;

class Main {
    static int minMeetingRooms(int[][] intervals) {
        // your code: sort by start + PriorityQueue<Integer> of end times
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(minMeetingRooms(new int[][]{{0,30},{5,10},{15,20}})); // 2
    }
}
`,
    python: `import heapq

def minMeetingRooms(intervals):
    # your code
    return 0


if __name__ == "__main__":
    print(minMeetingRooms([[0,30],[5,10],[15,20]]))  # 2
`,
  },
  // ------------------------------------------------------------------ Heaps / selection
  {
    id: "kth-largest", title: "Kth Largest Element in an Array", difficulty: "Medium", lc: "kth-largest-element-in-an-array",
    tags: ["Heap", "Quickselect", "Sorting"], companies: ["Meta", "Amazon", "Microsoft", "Google", "LinkedIn"], pattern: "Min-heap of size k / quickselect",
    relatedTopic: "/topic/dsa/dsa-heaps?m=deep",
    statement: `<p>Return the k-th largest element in the array (not the k-th distinct).</p>`,
    examples: [{ in: "nums = [3,2,1,5,6,4], k = 2", out: "5" }, { in: "nums = [3,2,3,1,2,4,5,5,6], k = 4", out: "4" }],
    constraints: ["1 <= k <= n <= 10^5"],
    concept: `<p>Options: sort O(n log n); keep a <b>min-heap of size k</b> (root = k-th largest) O(n log k); <b>quickselect</b> average O(n) — partition around a pivot and recurse only into the side containing index n−k.</p>`,
    stuck: ["Say the O(n log n) sort answer first.", "Can you avoid sorting everything? Keep only the k largest seen so far — which structure makes 'drop the smallest of them' cheap? (min-heap)", "For average O(n): quickselect — partition like quicksort and recurse into one side only. Randomize the pivot."],
    complexity: "Heap: O(n log k) time, O(k) space · Quickselect: O(n) average",
    fnName: "findKthLargest",
    starter: "function findKthLargest(nums, k) {\n  \n}\n",
    tests: [[[[3, 2, 1, 5, 6, 4], 2], 5], [[[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], 4], [[[1], 1], 1], [[[7, 7, 7, 7], 2], 7, true], [[[-1, -2, -3, 10], 4], -3, true], [[[5, 2, 4, 1, 3, 6, 0], 3], 4, true]],
    hints: ["Min-heap of size k.", "Or quickselect targeting index n − k.", "Random pivot avoids O(n²) on sorted input."],
    explain: "Quickselect with random pivot (iterative).",
    code: `function findKthLargest(nums, k) {
  const target = nums.length - k;
  let lo = 0, hi = nums.length - 1;
  while (true) {
    const p = lo + Math.floor(Math.random() * (hi - lo + 1));
    [nums[p], nums[hi]] = [nums[hi], nums[p]];
    let store = lo;
    for (let i = lo; i < hi; i++) if (nums[i] < nums[hi]) { [nums[i], nums[store]] = [nums[store], nums[i]]; store++; }
    [nums[store], nums[hi]] = [nums[hi], nums[store]];
    if (store === target) return nums[store];
    if (store < target) lo = store + 1; else hi = store - 1;
  }
}`,
    java: `import java.util.*;

class Main {
    static int findKthLargest(int[] nums, int k) {
        // your code: PriorityQueue<Integer> min-heap of size k (or quickselect)
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(findKthLargest(new int[]{3,2,1,5,6,4}, 2)); // 5
        System.out.println(findKthLargest(new int[]{3,2,3,1,2,4,5,5,6}, 4)); // 4
    }
}
`,
    python: `import heapq

def findKthLargest(nums, k):
    # your code
    return 0


if __name__ == "__main__":
    print(findKthLargest([3,2,1,5,6,4], 2))  # 5
`,
  },
  {
    id: "k-closest-points", title: "K Closest Points to Origin", difficulty: "Medium", lc: "k-closest-points-to-origin",
    tags: ["Heap", "Sorting", "Geometry"], companies: ["Meta", "Amazon", "Google", "Uber", "LinkedIn"], pattern: "Max-heap of size k by distance",
    relatedTopic: "/topic/dsa/dsa-heaps?m=deep",
    statement: `<p>Return the k points closest to (0, 0), sorted by distance (ties broken by x then y for a deterministic answer here).</p>`,
    examples: [{ in: "points = [[1,3],[-2,2]], k = 1", out: "[[-2,2]]" }],
    constraints: ["1 <= k <= n <= 10^4"],
    concept: `<p>Compare squared distances (no sqrt needed). Keep a max-heap of size k (evict the farthest), or sort, or quickselect. Interviews usually want the heap answer and its O(n log k) complexity.</p>`,
    stuck: ["Distance comparison doesn't need sqrt: compare x² + y².", "Sorting works — O(n log n). Can a heap of size k do better when k ≪ n?", "Which heap? You need to evict the farthest of the current k → max-heap."],
    complexity: "O(n log k) with a heap; O(n log n) with sorting",
    fnName: "kClosest",
    starter: "function kClosest(points, k) {\n  \n}\n",
    tests: [[[[[1, 3], [-2, 2]], 1], [[-2, 2]]], [[[[3, 3], [5, -1], [-2, 4]], 2], [[3, 3], [-2, 4]]], [[[[0, 1], [1, 0]], 2], [[0, 1], [1, 0]], true], [[[[1, 1], [2, 2], [3, 3], [-1, -1]], 2], [[-1, -1], [1, 1]], true]],
    hints: ["Use squared distance.", "Max-heap keyed by distance, pop when size > k.", "Sort the final k for output."],
    explain: "Sort by squared distance (simple, deterministic); in interviews explain the size-k max-heap alternative.",
    code: `function kClosest(points, k) {
  const d = p => p[0] * p[0] + p[1] * p[1];
  return [...points].sort((a, b) => d(a) - d(b) || a[0] - b[0] || a[1] - b[1]).slice(0, k);
}`,
    java: `import java.util.*;

class Main {
    static int[][] kClosest(int[][] points, int k) {
        // your code: PriorityQueue<int[]> max-heap by x*x + y*y, keep size k
        return new int[0][];
    }

    public static void main(String[] args) {
        System.out.println(Arrays.deepToString(kClosest(new int[][]{{3,3},{5,-1},{-2,4}}, 2))); // [[3, 3], [-2, 4]]
    }
}
`,
    python: `import heapq

def kClosest(points, k):
    # your code
    return []


if __name__ == "__main__":
    print(kClosest([[3,3],[5,-1],[-2,4]], 2))  # [[3, 3], [-2, 4]]
`,
  },
  {
    id: "task-scheduler", title: "Task Scheduler", difficulty: "Medium", lc: "task-scheduler",
    tags: ["Greedy", "Heap", "Counting"], companies: ["Meta", "Amazon", "Microsoft", "Google"], pattern: "Greedy on the most frequent task",
    relatedTopic: "/topic/dsa/dsa-heaps?m=deep",
    statement: `<p>Tasks are letters; identical tasks need at least <code>n</code> idle/other slots between them. Return the minimum number of time units to finish all tasks.</p>`,
    examples: [{ in: 'tasks = ["A","A","A","B","B","B"], n = 2', out: "8", explain: "A B idle A B idle A B" }],
    constraints: ["1 <= tasks.length <= 10^4", "0 <= n <= 100"],
    concept: `<p>The most frequent task (count maxF) forces (maxF − 1) full blocks of length (n + 1), plus a final block containing every task with frequency maxF. Answer = max(total tasks, (maxF − 1)(n + 1) + countOfMax).</p>`,
    stuck: ["Schedule the most frequent task first — where must its copies go?", "Its copies create (maxF − 1) gaps of size n that other tasks can fill.", "If there are more tasks than slots, no idle time is needed → answer is tasks.length.", "Alternative simulation: max-heap of counts + cooldown queue."],
    complexity: "O(N) time, O(1) space (26 letters)",
    fnName: "leastInterval",
    starter: "function leastInterval(tasks, n) {\n  \n}\n",
    tests: [[[["A", "A", "A", "B", "B", "B"], 2], 8], [[["A", "A", "A", "B", "B", "B"], 0], 6], [[["A", "A", "A", "A", "A", "A", "B", "C", "D", "E", "F", "G"], 2], 16], [[["A", "B", "C", "D"], 3], 4, true], [[["A", "A", "B", "B", "C", "C", "D", "D"], 1], 8, true]],
    hints: ["Count frequencies.", "maxF = highest count; m = how many tasks have it.", "max(len, (maxF−1)(n+1)+m)."],
    explain: "Closed-form greedy from the most frequent task.",
    code: `function leastInterval(tasks, n) {
  const cnt = {};
  for (const t of tasks) cnt[t] = (cnt[t] || 0) + 1;
  const freqs = Object.values(cnt);
  const maxF = Math.max(...freqs);
  const m = freqs.filter(f => f === maxF).length;
  return Math.max(tasks.length, (maxF - 1) * (n + 1) + m);
}`,
    java: `import java.util.*;

class Main {
    static int leastInterval(char[] tasks, int n) {
        // your code: counts[26], maxF, count of maxF
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(leastInterval("AAABBB".toCharArray(), 2)); // 8
    }
}
`,
    python: `def leastInterval(tasks, n):
    # your code
    return 0


if __name__ == "__main__":
    print(leastInterval(list("AAABBB"), 2))  # 8
`,
  },
  {
    id: "sliding-window-max", title: "Sliding Window Maximum", difficulty: "Hard", lc: "sliding-window-maximum",
    tags: ["Sliding Window", "Monotonic Queue", "Deque"], companies: ["Amazon", "Google", "Microsoft", "Citadel"], pattern: "Monotonic decreasing deque of indices",
    relatedTopic: "/topic/dsa/dsa-stackqueue?m=deep",
    statement: `<p>Return the maximum of every contiguous window of size <code>k</code>.</p>`,
    examples: [{ in: "nums = [1,3,-1,-3,5,3,6,7], k = 3", out: "[3,3,5,5,6,7]" }],
    constraints: ["1 <= k <= n <= 10^5"],
    concept: `<p>Keep a deque of indices whose values are strictly decreasing. When a new value arrives, pop smaller values from the back (they can never be a max while it's in the window). Pop the front if it left the window. The front is the current max.</p>`,
    stuck: ["Brute force is O(n·k). Heap gives O(n log n) with lazy deletion — mention it.", "When a bigger element enters, can any smaller element before it ever be a window max again? (no) → you can discard them.", "Store indices (to know when the front leaves the window) in a deque that stays decreasing by value."],
    complexity: "O(n) time (each index pushed/popped once), O(k) space",
    fnName: "maxSlidingWindow",
    starter: "function maxSlidingWindow(nums, k) {\n  \n}\n",
    tests: [[[[1, 3, -1, -3, 5, 3, 6, 7], 3], [3, 3, 5, 5, 6, 7]], [[[1], 1], [1]], [[[9, 8, 7, 6], 2], [9, 8, 7]], [[[1, 3, 1, 2, 0, 5], 3], [3, 3, 2, 5], true], [[[4, 4, 4, 4], 2], [4, 4, 4], true], [[[-7, -8, 7, 5, 7, 1, 6, 0], 4], [7, 7, 7, 7, 7], true]],
    hints: ["Deque of indices, values decreasing.", "Pop back while nums[back] <= new value.", "Pop front if index <= i − k; record front once i >= k − 1."],
    explain: "Monotonic deque.",
    code: `function maxSlidingWindow(nums, k) {
  const dq = [], out = [];
  let head = 0;
  for (let i = 0; i < nums.length; i++) {
    while (dq.length > head && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
    dq.push(i);
    if (dq[head] <= i - k) head++;
    if (i >= k - 1) out.push(nums[dq[head]]);
  }
  return out;
}`,
    java: `import java.util.*;

class Main {
    static int[] maxSlidingWindow(int[] nums, int k) {
        // your code: ArrayDeque<Integer> of indices, decreasing values
        return new int[0];
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(maxSlidingWindow(new int[]{1,3,-1,-3,5,3,6,7}, 3))); // [3, 3, 5, 5, 6, 7]
    }
}
`,
    python: `from collections import deque

def maxSlidingWindow(nums, k):
    # your code
    return []


if __name__ == "__main__":
    print(maxSlidingWindow([1,3,-1,-3,5,3,6,7], 3))  # [3, 3, 5, 5, 6, 7]
`,
  },
  // ------------------------------------------------------------------ Stacks & strings
  {
    id: "largest-rectangle-histogram", title: "Largest Rectangle in Histogram", difficulty: "Hard", lc: "largest-rectangle-in-histogram",
    tags: ["Stack", "Monotonic Stack"], companies: ["Amazon", "Google", "Microsoft", "Meta"], pattern: "Monotonic increasing stack",
    relatedTopic: "/topic/dsa/dsa-stackqueue?m=deep",
    statement: `<p>Given bar heights of width 1, return the area of the largest rectangle in the histogram.</p>`,
    examples: [{ in: "heights = [2,1,5,6,2,3]", out: "10" }],
    constraints: ["1 <= n <= 10^5"],
    concept: `<p>For each bar, the widest rectangle using it as the shortest bar extends to the nearest shorter bar on each side. A stack of increasing heights finds both: when a shorter bar arrives, pop taller bars — for each popped bar, the right boundary is the current index and the left boundary is the new stack top.</p>`,
    stuck: ["For a fixed bar as the minimum height, how wide can the rectangle be?", "You need the nearest smaller bar to the left and to the right of every bar.", "An increasing stack gives 'nearest smaller' in O(1) amortized. Pop when the current bar is shorter.", "Append a sentinel 0 at the end to flush the stack."],
    complexity: "O(n) time, O(n) space",
    fnName: "largestRectangleArea",
    starter: "function largestRectangleArea(heights) {\n  \n}\n",
    tests: [[[[2, 1, 5, 6, 2, 3]], 10], [[[2, 4]], 4], [[[1]], 1], [[[6, 2, 5, 4, 5, 1, 6]], 12, true], [[[2, 2, 2, 2]], 8, true], [[[1, 2, 3, 4, 5]], 9, true]],
    hints: ["Nearest smaller on both sides.", "Stack of indices with increasing heights.", "Width = i − stack.top − 1 after popping (or i if the stack is empty)."],
    explain: "Monotonic stack with a sentinel.",
    code: `function largestRectangleArea(heights) {
  const st = [];
  let best = 0;
  for (let i = 0; i <= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i];
    while (st.length && heights[st[st.length - 1]] > h) {
      const height = heights[st.pop()];
      const width = st.length ? i - st[st.length - 1] - 1 : i;
      best = Math.max(best, height * width);
    }
    st.push(i);
  }
  return best;
}`,
    java: `import java.util.*;

class Main {
    static int largestRectangleArea(int[] heights) {
        // your code: Deque<Integer> stack of indices with increasing heights
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(largestRectangleArea(new int[]{2,1,5,6,2,3})); // 10
    }
}
`,
    python: `def largestRectangleArea(heights):
    # your code
    return 0


if __name__ == "__main__":
    print(largestRectangleArea([2,1,5,6,2,3]))  # 10
`,
  },
  {
    id: "asteroid-collision", title: "Asteroid Collision", difficulty: "Medium", lc: "asteroid-collision",
    tags: ["Stack", "Simulation"], companies: ["Amazon", "Uber", "Google", "Meta"], pattern: "Stack simulation",
    relatedTopic: "/topic/dsa/dsa-stackqueue?m=deep",
    statement: `<p>Positive values move right, negative left, same speed. When two meet, the smaller (by absolute value) explodes; equal sizes both explode. Return the final state.</p>`,
    examples: [{ in: "asteroids = [5,10,-5]", out: "[5,10]" }, { in: "asteroids = [8,-8]", out: "[]" }, { in: "asteroids = [10,2,-5]", out: "[10]" }],
    constraints: ["2 <= n <= 10^4"],
    concept: `<p>Only a right-mover followed by a left-mover can collide. Push asteroids on a stack; when a negative arrives, resolve collisions with positive tops until it dies, destroys them all, or meets a negative/empty stack.</p>`,
    stuck: ["When do two asteroids collide? Only when the earlier one moves right and the later one moves left.", "Process left to right; survivors so far live on a stack.", "For a negative asteroid, loop: compare with the positive top; pop smaller tops; stop if it's destroyed."],
    complexity: "O(n) time, O(n) space",
    fnName: "asteroidCollision",
    starter: "function asteroidCollision(asteroids) {\n  \n}\n",
    tests: [[[[5, 10, -5]], [5, 10]], [[[8, -8]], []], [[[10, 2, -5]], [10]], [[[-2, -1, 1, 2]], [-2, -1, 1, 2], true], [[[1, -2, -2, -2]], [-2, -2, -2], true], [[[-2, 1, -1, -2]], [-2, -2], true]],
    hints: ["Stack of survivors.", "Collision only if top > 0 and current < 0.", "Use a flag for whether the current asteroid survives."],
    explain: "Stack simulation.",
    code: `function asteroidCollision(asteroids) {
  const st = [];
  for (const a of asteroids) {
    let alive = true;
    while (alive && a < 0 && st.length && st[st.length - 1] > 0) {
      const top = st[st.length - 1];
      if (top < -a) st.pop();
      else { if (top === -a) st.pop(); alive = false; }
    }
    if (alive) st.push(a);
  }
  return st;
}`,
    java: `import java.util.*;

class Main {
    static int[] asteroidCollision(int[] asteroids) {
        // your code: Deque<Integer> stack
        return new int[0];
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(asteroidCollision(new int[]{10, 2, -5}))); // [10]
    }
}
`,
    python: `def asteroidCollision(asteroids):
    # your code
    return []


if __name__ == "__main__":
    print(asteroidCollision([10, 2, -5]))  # [10]
`,
  },
  {
    id: "decode-string", title: "Decode String", difficulty: "Medium", lc: "decode-string",
    tags: ["Stack", "String", "Recursion"], companies: ["Google", "Amazon", "Meta", "Microsoft", "Bloomberg"], pattern: "Stack of (count, partial string)",
    relatedTopic: "/topic/dsa/dsa-stackqueue?m=deep",
    statement: `<p>Decode strings of the form <code>k[encoded]</code> (repeat encoded k times), possibly nested, e.g. <code>3[a2[c]]</code> → <code>accaccacc</code>.</p>`,
    examples: [{ in: 's = "3[a]2[bc]"', out: '"aaabcbc"' }, { in: 's = "3[a2[c]]"', out: '"accaccacc"' }],
    constraints: ["1 <= s.length <= 30", "counts are 1..300"],
    concept: `<p>Nested brackets = stack. On '[' push (current string, current number) and reset; on ']' pop and set current = prev + current.repeat(num). Digits may be multi-digit.</p>`,
    stuck: ["What happens at '[' and at ']' in terms of 'saving' and 'restoring' context?", "Keep a current string and a current number while scanning.", "On '[': push both and reset. On ']': pop (prevString, k) and current = prevString + current repeated k times.", "Parse multi-digit numbers: num = num * 10 + digit."],
    complexity: "O(output length) time and space",
    fnName: "decodeString",
    starter: "function decodeString(s) {\n  \n}\n",
    tests: [[["3[a]2[bc]"], "aaabcbc"], [["3[a2[c]]"], "accaccacc"], [["2[abc]3[cd]ef"], "abcabccdcdcdef"], [["10[a]"], "aaaaaaaaaa", true], [["abc"], "abc", true], [["2[a2[b2[c]]]"], "abccbccabccbcc", true]],
    hints: ["Stack for nested context.", "Handle multi-digit counts.", "Build strings with arrays/join for efficiency."],
    explain: "Stack of saved (string, count) pairs.",
    code: `function decodeString(s) {
  const st = [];
  let cur = "", num = 0;
  for (const c of s) {
    if (c >= "0" && c <= "9") num = num * 10 + (c.charCodeAt(0) - 48);
    else if (c === "[") { st.push([cur, num]); cur = ""; num = 0; }
    else if (c === "]") { const [prev, k] = st.pop(); cur = prev + cur.repeat(k); }
    else cur += c;
  }
  return cur;
}`,
    java: `import java.util.*;

class Main {
    static String decodeString(String s) {
        // your code: Deque<StringBuilder> strings + Deque<Integer> counts
        return "";
    }

    public static void main(String[] args) {
        System.out.println(decodeString("3[a2[c]]")); // accaccacc
    }
}
`,
    python: `def decodeString(s):
    # your code
    return ""


if __name__ == "__main__":
    print(decodeString("3[a2[c]]"))  # accaccacc
`,
  },
  {
    id: "basic-calculator-ii", title: "Basic Calculator II", difficulty: "Medium", lc: "basic-calculator-ii",
    tags: ["Stack", "String", "Math"], companies: ["Meta", "Amazon", "Microsoft", "Airbnb"], pattern: "Stack with deferred + and −",
    relatedTopic: "/topic/dsa/dsa-stackqueue?m=deep",
    statement: `<p>Evaluate an expression with non-negative integers, <code>+ - * /</code> and spaces (integer division truncates toward zero). No parentheses.</p>`,
    examples: [{ in: 's = "3+2*2"', out: "7" }, { in: 's = " 3/2 "', out: "1" }, { in: 's = " 3+5 / 2 "', out: "5" }],
    constraints: ["1 <= s.length <= 3*10^5"],
    concept: `<p>Precedence: apply * and / immediately to the last pushed number; defer + and − by pushing ±number. The answer is the sum of the stack. (O(1)-space variant keeps just the last term.)</p>`,
    stuck: ["Why can't you evaluate strictly left to right? (precedence)", "Keep the previous operator; when a number completes, decide based on that operator.", "+/− push the number (negated for −); */÷ pop the last number, combine, push back.", "Sum the stack at the end; truncate division toward zero."],
    complexity: "O(n) time, O(n) space (O(1) with a running last term)",
    fnName: "calculate",
    starter: "function calculate(s) {\n  \n}\n",
    tests: [[["3+2*2"], 7], [[" 3/2 "], 1], [[" 3+5 / 2 "], 5], [["14-3/2"], 13, true], [["1-1+1"], 1, true], [["2*3*4-10/3"], 21, true], [["42"], 42, true]],
    hints: ["Track the operator before the current number.", "Process when you hit an operator or the end.", "Math.trunc for division."],
    explain: "Stack of signed terms.",
    code: `function calculate(s) {
  const st = [];
  let num = 0, op = "+";
  for (let i = 0; i <= s.length; i++) {
    const c = s[i];
    if (c >= "0" && c <= "9") { num = num * 10 + (c.charCodeAt(0) - 48); continue; }
    if (c === " ") continue;
    if (op === "+") st.push(num);
    else if (op === "-") st.push(-num);
    else if (op === "*") st.push(st.pop() * num);
    else st.push(Math.trunc(st.pop() / num));
    op = c; num = 0;
  }
  return st.reduce((a, b) => a + b, 0);
}`,
    java: `import java.util.*;

class Main {
    static int calculate(String s) {
        // your code
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(calculate("3+2*2")); // 7
        System.out.println(calculate(" 3+5 / 2 ")); // 5
    }
}
`,
    python: `def calculate(s):
    # your code (use int(a / b) to truncate toward zero)
    return 0


if __name__ == "__main__":
    print(calculate("3+2*2"))  # 7
`,
  },
  {
    id: "valid-palindrome-ii", title: "Valid Palindrome II (delete at most one)", difficulty: "Easy", lc: "valid-palindrome-ii",
    tags: ["Two Pointers", "String"], companies: ["Meta", "Microsoft", "Amazon"], pattern: "Two pointers with one skip",
    relatedTopic: "/topic/dsa/dsa-twopointers?m=deep",
    statement: `<p>Return true if the string can be a palindrome after deleting at most one character.</p>`,
    examples: [{ in: 's = "aba"', out: "true" }, { in: 's = "abca"', out: "true" }, { in: 's = "abc"', out: "false" }],
    constraints: ["1 <= s.length <= 10^5"],
    concept: `<p>Move two pointers inward. At the first mismatch you get one chance: check whether skipping the left char OR the right char leaves a palindrome.</p>`,
    stuck: ["Standard palindrome check with two pointers first.", "At the first mismatch, which characters could be the one to delete?", "Try both: is s[l+1..r] a palindrome, or s[l..r−1]?"],
    complexity: "O(n) time, O(1) space",
    fnName: "validPalindrome",
    starter: "function validPalindrome(s) {\n  \n}\n",
    tests: [[["aba"], true], [["abca"], true], [["abc"], false], [["deeee"], true, true], [["eccer"], true, true], [["abcda"], false, true], [["cbbcc"], true, true]],
    hints: ["Two pointers.", "On mismatch, try skipping either side once.", "Helper isPal(l, r)."],
    explain: "Two pointers, branch once on mismatch.",
    code: `function validPalindrome(s) {
  const isPal = (l, r) => { while (l < r) if (s[l++] !== s[r--]) return false; return true; };
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l] !== s[r]) return isPal(l + 1, r) || isPal(l, r - 1);
    l++; r--;
  }
  return true;
}`,
    java: `class Main {
    static boolean validPalindrome(String s) {
        // your code
        return false;
    }

    public static void main(String[] args) {
        System.out.println(validPalindrome("abca")); // true
        System.out.println(validPalindrome("abc"));  // false
    }
}
`,
    python: `def validPalindrome(s):
    # your code
    return False


if __name__ == "__main__":
    print(validPalindrome("abca"))  # True
`,
  },
  {
    id: "longest-palindromic-substring", title: "Longest Palindromic Substring", difficulty: "Medium", lc: "longest-palindromic-substring",
    tags: ["String", "Two Pointers", "Dynamic Programming"], companies: ["Amazon", "Microsoft", "Google", "Meta", "Adobe"], pattern: "Expand around center",
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p>Return the longest palindromic substring (if several have the same length, return the one that starts first).</p>`,
    examples: [{ in: 's = "babad"', out: '"bab"' }, { in: 's = "cbbd"', out: '"bb"' }],
    constraints: ["1 <= s.length <= 1000"],
    concept: `<p>Every palindrome has a center: a character (odd length) or a gap between two characters (even length). Expand from each of the 2n−1 centers while ends match. O(n²) time, O(1) space — simpler than the DP table. (Manacher's algorithm is O(n) but rarely expected.)</p>`,
    stuck: ["Brute force checks all O(n²) substrings in O(n) each → O(n³).", "A palindrome mirrors around its middle — how many possible middles are there? (2n − 1)", "From each center expand while s[l] === s[r]; track the best."],
    complexity: "O(n²) time, O(1) space",
    fnName: "longestPalindrome",
    starter: "function longestPalindrome(s) {\n  \n}\n",
    tests: [[["babad"], "bab"], [["cbbd"], "bb"], [["a"], "a"], [["forgeeksskeegfor"], "geeksskeeg", true], [["abacdfgdcaba"], "aba", true], [["aaaa"], "aaaa", true]],
    hints: ["2n − 1 centers.", "Expand while characters match.", "Keep start and max length; prefer earlier start on ties."],
    explain: "Expand around every center.",
    code: `function longestPalindrome(s) {
  let start = 0, len = 0;
  const expand = (l, r) => {
    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
    const L = r - l - 1;
    if (L > len || (L === len && l + 1 < start)) { len = L; start = l + 1; }
  };
  for (let i = 0; i < s.length; i++) { expand(i, i); expand(i, i + 1); }
  return s.slice(start, start + len);
}`,
    java: `class Main {
    static String longestPalindrome(String s) {
        // your code: expand around each center (i,i) and (i,i+1)
        return "";
    }

    public static void main(String[] args) {
        System.out.println(longestPalindrome("babad")); // bab
        System.out.println(longestPalindrome("cbbd"));  // bb
    }
}
`,
    python: `def longestPalindrome(s):
    # your code
    return ""


if __name__ == "__main__":
    print(longestPalindrome("babad"))  # bab
`,
  },
  // ------------------------------------------------------------------ Design (operation-sequence harness)
  {
    id: "lru-cache", title: "LRU Cache", difficulty: "Medium", lc: "lru-cache",
    tags: ["Design", "Hashing", "Linked List"], companies: ["Amazon", "Meta", "Microsoft", "Google", "Apple", "Bloomberg", "Uber"], pattern: "Hash map + doubly linked list",
    relatedTopic: "/topic/lld/lld-lru?m=deep",
    statement: `<p>Design an LRU cache with O(1) <code>get(key)</code> (−1 if absent) and <code>put(key, value)</code> that evicts the least recently used key when capacity is exceeded.</p>
<p><b>Harness:</b> implement <code>lruCache(capacity, ops, args)</code> — run each op (<code>"get"</code>/<code>"put"</code>) with its args and return an array of results (<code>null</code> for put).</p>`,
    examples: [{ in: 'capacity=2, ops=["put","put","get","put","get","put","get","get","get"], args=[[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', out: "[null,null,1,null,-1,null,-1,3,4]" }],
    constraints: ["1 <= capacity <= 3000", "up to 2*10^5 calls"],
    concept: `<p>A hash map gives O(1) lookup; a doubly linked list gives O(1) move-to-front and remove-from-tail. Map key → list node. In JavaScript a <code>Map</code> preserves insertion order, so delete+re-set moves a key to the end and <code>map.keys().next()</code> is the LRU key — mention the linked-list design in interviews anyway.</p>`,
    stuck: ["Which two operations must be O(1)? (lookup by key, and find/remove the least recently used)", "A hash map handles lookup. What handles 'order of use' with O(1) moves? (doubly linked list)", "Map key → node; on get/put move the node to the head; evict the tail when over capacity.", "Use dummy head/tail nodes to avoid null checks."],
    complexity: "O(1) per operation, O(capacity) space",
    fnName: "lruCache",
    starter: "function lruCache(capacity, ops, args) {\n  // implement the cache, run ops, return results\n  const out = [];\n  return out;\n}\n",
    tests: [[[2, ["put", "put", "get", "put", "get", "put", "get", "get", "get"], [[1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]], [null, null, 1, null, -1, null, -1, 3, 4]], [[1, ["put", "get", "put", "get", "get"], [[2, 1], [2], [3, 2], [2], [3]]], [null, 1, null, -1, 2]], [[2, ["put", "put", "put", "get", "get"], [[1, 1], [1, 5], [2, 2], [1], [2]]], [null, null, null, 5, 2], true], [[2, ["get", "put", "get", "put", "put", "get", "get"], [[2], [2, 6], [1], [1, 5], [1, 2], [1], [2]]], [-1, null, -1, null, null, 2, 6], true]],
    hints: ["Map + doubly linked list.", "get() counts as a use — move to front.", "put() on an existing key updates and moves it."],
    explain: "Ordered Map as LRU (insertion order = recency).",
    code: `function lruCache(capacity, ops, args) {
  const m = new Map(), out = [];
  ops.forEach((op, i) => {
    const [k, v] = args[i];
    if (op === "get") {
      if (!m.has(k)) { out.push(-1); return; }
      const val = m.get(k); m.delete(k); m.set(k, val); out.push(val);
    } else {
      if (m.has(k)) m.delete(k);
      m.set(k, v);
      if (m.size > capacity) m.delete(m.keys().next().value);
      out.push(null);
    }
  });
  return out;
}`,
    java: `import java.util.*;

class Main {
    static class LRUCache {
        // your code: HashMap<Integer, Node> + doubly linked list with dummy head/tail
        LRUCache(int capacity) { }
        int get(int key) { return -1; }
        void put(int key, int value) { }
    }

    public static void main(String[] args) {
        LRUCache c = new LRUCache(2);
        c.put(1, 1); c.put(2, 2);
        System.out.println(c.get(1)); // 1
        c.put(3, 3);
        System.out.println(c.get(2)); // -1
        c.put(4, 4);
        System.out.println(c.get(1) + " " + c.get(3) + " " + c.get(4)); // -1 3 4
    }
}
`,
    python: `class LRUCache:
    def __init__(self, capacity):
        pass  # your code: dict + doubly linked list (or collections.OrderedDict)

    def get(self, key):
        return -1

    def put(self, key, value):
        pass


if __name__ == "__main__":
    c = LRUCache(2); c.put(1, 1); c.put(2, 2)
    print(c.get(1))  # 1
    c.put(3, 3); print(c.get(2))  # -1
`,
  },
  {
    id: "min-stack", title: "Min Stack", difficulty: "Medium", lc: "min-stack",
    tags: ["Design", "Stack"], companies: ["Amazon", "Bloomberg", "Microsoft", "Google"], pattern: "Auxiliary stack of minimums",
    relatedTopic: "/topic/dsa/dsa-stackqueue?m=deep",
    statement: `<p>Design a stack supporting <code>push</code>, <code>pop</code>, <code>top</code> and <code>getMin</code>, all O(1).</p>
<p><b>Harness:</b> <code>minStack(ops, args)</code> returns results per op (<code>null</code> for push/pop).</p>`,
    examples: [{ in: 'ops=["push","push","push","getMin","pop","top","getMin"], args=[[-2],[0],[-3],[],[],[],[]]', out: "[null,null,null,-3,null,0,-2]" }],
    constraints: ["up to 3*10^4 calls; pop/top/getMin called on non-empty stacks"],
    concept: `<p>Store, alongside each value, the minimum of the stack at that height (or keep a second stack of minimums). getMin reads the top pair.</p>`,
    stuck: ["When you pop, the minimum may change — how do you know the previous minimum without scanning?", "Remember the minimum 'as of' each push.", "Push pairs (value, minSoFar)."],
    complexity: "O(1) per operation, O(n) space",
    fnName: "minStack",
    starter: "function minStack(ops, args) {\n  const out = [];\n  return out;\n}\n",
    tests: [[[["push", "push", "push", "getMin", "pop", "top", "getMin"], [[-2], [0], [-3], [], [], [], []]], [null, null, null, -3, null, 0, -2]], [[["push", "push", "getMin", "pop", "getMin"], [[1], [1], [], [], []]], [null, null, 1, null, 1]], [[["push", "push", "push", "getMin", "pop", "getMin", "pop", "getMin"], [[5], [3], [7], [], [], [], [], []]], [null, null, null, 3, null, 3, null, 5], true]],
    hints: ["Pairs of (value, min so far).", "getMin = top pair's min.", "Duplicates of the minimum must be handled — pairs do it naturally."],
    explain: "Stack of [value, minSoFar] pairs.",
    code: `function minStack(ops, args) {
  const st = [], out = [];
  ops.forEach((op, i) => {
    if (op === "push") { const v = args[i][0]; st.push([v, st.length ? Math.min(v, st[st.length - 1][1]) : v]); out.push(null); }
    else if (op === "pop") { st.pop(); out.push(null); }
    else if (op === "top") out.push(st[st.length - 1][0]);
    else out.push(st[st.length - 1][1]);
  });
  return out;
}`,
    java: `import java.util.*;

class Main {
    static class MinStack {
        // your code: Deque<int[]> of {value, minSoFar}
        void push(int v) { }
        void pop() { }
        int top() { return 0; }
        int getMin() { return 0; }
    }

    public static void main(String[] args) {
        MinStack s = new MinStack();
        s.push(-2); s.push(0); s.push(-3);
        System.out.println(s.getMin()); // -3
        s.pop();
        System.out.println(s.top() + " " + s.getMin()); // 0 -2
    }
}
`,
    python: `class MinStack:
    def __init__(self):
        self.st = []  # (value, min_so_far)

    def push(self, v): pass
    def pop(self): pass
    def top(self): return 0
    def getMin(self): return 0


if __name__ == "__main__":
    s = MinStack(); s.push(-2); s.push(0); s.push(-3)
    print(s.getMin())  # -3
`,
  },
  {
    id: "median-data-stream", title: "Find Median from Data Stream", difficulty: "Hard", lc: "find-median-from-data-stream",
    tags: ["Design", "Heap"], companies: ["Amazon", "Google", "Microsoft", "Meta", "Apple"], pattern: "Two heaps (max-heap low half, min-heap high half)",
    relatedTopic: "/topic/dsa/dsa-heaps?m=deep",
    statement: `<p>Support <code>addNum(x)</code> and <code>findMedian()</code> over a stream.</p>
<p><b>Harness:</b> <code>medianFinder(ops, args)</code> returns results (<code>null</code> for addNum).</p>`,
    examples: [{ in: 'ops=["addNum","addNum","findMedian","addNum","findMedian"], args=[[1],[2],[],[3],[]]', out: "[null,null,1.5,null,2]" }],
    constraints: ["up to 5*10^4 calls"],
    concept: `<p>Keep the lower half in a <b>max-heap</b> and the upper half in a <b>min-heap</b>, sizes differing by at most one. The median is the top of the bigger heap, or the average of both tops. Each insert is O(log n).</p>`,
    stuck: ["Sorting after each insert is O(n log n) — too slow. What do you actually need? (just the middle)", "Split the numbers into a lower half and an upper half — which element of each half matters? (max of lower, min of upper)", "Two heaps: push to lower, move lower's max to upper, rebalance so lower has ≥ upper's size.", "Median = lower.top if sizes differ, else average of tops."],
    complexity: "addNum O(log n), findMedian O(1), O(n) space",
    fnName: "medianFinder",
    starter: "function medianFinder(ops, args) {\n  const out = [];\n  return out;\n}\n",
    tests: [[[["addNum", "addNum", "findMedian", "addNum", "findMedian"], [[1], [2], [], [3], []]], [null, null, 1.5, null, 2]], [[["addNum", "findMedian", "addNum", "findMedian"], [[5], [], [5], []]], [null, 5, null, 5]], [[["addNum", "addNum", "addNum", "addNum", "findMedian", "addNum", "findMedian"], [[6], [10], [2], [6], [], [5], []]], [null, null, null, null, 6, null, 6], true], [[["addNum", "addNum", "findMedian"], [[-1], [-2], []]], [null, null, -1.5], true]],
    hints: ["Max-heap for the low half, min-heap for the high half.", "Keep sizes balanced (low may have one extra).", "In JS you need your own binary heap."],
    explain: "Two binary heaps.",
    code: `function medianFinder(ops, args) {
  class Heap {
    constructor(cmp) { this.a = []; this.cmp = cmp; }
    get size() { return this.a.length; }
    peek() { return this.a[0]; }
    push(x) { const a = this.a; a.push(x); let i = a.length - 1;
      while (i > 0) { const p = (i - 1) >> 1; if (this.cmp(a[i], a[p]) >= 0) break; [a[i], a[p]] = [a[p], a[i]]; i = p; } }
    pop() { const a = this.a, top = a[0], last = a.pop();
      if (a.length) { a[0] = last; let i = 0;
        for (;;) { let l = 2 * i + 1, r = l + 1, m = i;
          if (l < a.length && this.cmp(a[l], a[m]) < 0) m = l;
          if (r < a.length && this.cmp(a[r], a[m]) < 0) m = r;
          if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; } }
      return top; }
  }
  const lo = new Heap((x, y) => y - x), hi = new Heap((x, y) => x - y), out = [];
  ops.forEach((op, i) => {
    if (op === "addNum") {
      lo.push(args[i][0]); hi.push(lo.pop());
      if (hi.size > lo.size) lo.push(hi.pop());
      out.push(null);
    } else out.push(lo.size > hi.size ? lo.peek() : (lo.peek() + hi.peek()) / 2);
  });
  return out;
}`,
    java: `import java.util.*;

class Main {
    static class MedianFinder {
        PriorityQueue<Integer> lo = new PriorityQueue<>(Collections.reverseOrder()); // max-heap
        PriorityQueue<Integer> hi = new PriorityQueue<>();                           // min-heap
        void addNum(int x) { /* your code */ }
        double findMedian() { return 0; }
    }

    public static void main(String[] args) {
        MedianFinder m = new MedianFinder();
        m.addNum(1); m.addNum(2);
        System.out.println(m.findMedian()); // 1.5
        m.addNum(3);
        System.out.println(m.findMedian()); // 2.0
    }
}
`,
    python: `import heapq

class MedianFinder:
    def __init__(self):
        self.lo = []  # max-heap via negatives
        self.hi = []  # min-heap

    def addNum(self, x): pass
    def findMedian(self): return 0.0


if __name__ == "__main__":
    m = MedianFinder(); m.addNum(1); m.addNum(2); print(m.findMedian())  # 1.5
`,
  },
  {
    id: "time-based-kv", title: "Time Based Key-Value Store", difficulty: "Medium", lc: "time-based-key-value-store",
    tags: ["Design", "Binary Search", "Hashing"], companies: ["Google", "Amazon", "Netflix", "Uber", "Lyft"], pattern: "Map of sorted lists + binary search",
    relatedTopic: "/topic/dsa/dsa-sorting?m=deep",
    statement: `<p><code>set(key, value, timestamp)</code> stores a value (timestamps per key strictly increase). <code>get(key, timestamp)</code> returns the value with the largest timestamp ≤ the given one, or "".</p>
<p><b>Harness:</b> <code>timeMap(ops, args)</code> returns results (<code>null</code> for set).</p>`,
    examples: [{ in: 'ops=["set","get","get","set","get","get"], args=[["foo","bar",1],["foo",1],["foo",3],["foo","bar2",4],["foo",4],["foo",5]]', out: '[null,"bar","bar",null,"bar2","bar2"]' }],
    constraints: ["up to 2*10^5 calls"],
    concept: `<p>Per key keep an append-only list of (timestamp, value) — already sorted because timestamps increase. get = binary search for the rightmost timestamp ≤ t (upper bound − 1).</p>`,
    stuck: ["Store history per key.", "Timestamps arrive in increasing order — what does that give you for free? (a sorted list)", "Binary search for the last timestamp ≤ t."],
    complexity: "set O(1), get O(log n)",
    fnName: "timeMap",
    starter: "function timeMap(ops, args) {\n  const out = [];\n  return out;\n}\n",
    tests: [[[["set", "get", "get", "set", "get", "get"], [["foo", "bar", 1], ["foo", 1], ["foo", 3], ["foo", "bar2", 4], ["foo", 4], ["foo", 5]]], [null, "bar", "bar", null, "bar2", "bar2"]], [[["get", "set", "get"], [["a", 1], ["a", "x", 5], ["a", 4]]], ["", null, ""]], [[["set", "set", "get", "get", "get"], [["k", "v1", 10], ["k", "v2", 20], ["k", 15], ["k", 25], ["k", 5]]], [null, null, "v1", "v2", ""], true]],
    hints: ["Map<string, Array<[t, v]>>.", "Binary search the last t_i ≤ t.", "Return '' if none."],
    explain: "Per-key sorted history with binary search.",
    code: `function timeMap(ops, args) {
  const m = new Map(), out = [];
  ops.forEach((op, i) => {
    if (op === "set") {
      const [k, v, t] = args[i];
      if (!m.has(k)) m.set(k, []);
      m.get(k).push([t, v]); out.push(null);
    } else {
      const [k, t] = args[i], a = m.get(k) || [];
      let lo = 0, hi = a.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (a[mid][0] <= t) lo = mid + 1; else hi = mid; }
      out.push(lo ? a[lo - 1][1] : "");
    }
  });
  return out;
}`,
    java: `import java.util.*;

class Main {
    static class TimeMap {
        // your code: HashMap<String, TreeMap<Integer,String>> (floorEntry) or lists + binary search
        void set(String k, String v, int t) { }
        String get(String k, int t) { return ""; }
    }

    public static void main(String[] args) {
        TimeMap tm = new TimeMap();
        tm.set("foo", "bar", 1);
        System.out.println(tm.get("foo", 3)); // bar
        tm.set("foo", "bar2", 4);
        System.out.println(tm.get("foo", 5)); // bar2
    }
}
`,
    python: `import bisect

class TimeMap:
    def __init__(self): self.d = {}
    def set(self, k, v, t): pass
    def get(self, k, t): return ""


if __name__ == "__main__":
    tm = TimeMap(); tm.set("foo", "bar", 1); print(tm.get("foo", 3))  # bar
`,
  },
  {
    id: "median-two-sorted", title: "Median of Two Sorted Arrays", difficulty: "Hard", lc: "median-of-two-sorted-arrays",
    tags: ["Binary Search", "Array"], companies: ["Google", "Amazon", "Microsoft", "Apple", "Goldman Sachs"], pattern: "Binary search on the partition",
    relatedTopic: "/topic/dsa/dsa-sorting?m=deep",
    statement: `<p>Return the median of two sorted arrays in O(log(min(m, n))).</p>`,
    examples: [{ in: "nums1 = [1,3], nums2 = [2]", out: "2" }, { in: "nums1 = [1,2], nums2 = [3,4]", out: "2.5" }],
    constraints: ["0 <= m, n <= 1000", "m + n >= 1"],
    concept: `<p>Binary search a cut i in the smaller array A (cut j = half − i in B) so that every element left of the cuts ≤ every element right: A[i−1] ≤ B[j] and B[j−1] ≤ A[i]. Then the median comes from the max of the left sides and min of the right sides.</p>`,
    stuck: ["Merge-and-pick is O(m + n) — state it first.", "The median splits the combined array into two equal halves. If you choose how many elements come from A (i), how many come from B? (half − i)", "The split is valid when A_left_max ≤ B_right_min and B_left_max ≤ A_right_min — binary search i on the smaller array.", "Use ±Infinity for empty sides."],
    complexity: "O(log(min(m, n))) time, O(1) space",
    fnName: "findMedianSortedArrays",
    starter: "function findMedianSortedArrays(nums1, nums2) {\n  \n}\n",
    tests: [[[[1, 3], [2]], 2], [[[1, 2], [3, 4]], 2.5], [[[], [1]], 1], [[[0, 0], [0, 0]], 0, true], [[[2], []], 2, true], [[[1, 3, 8, 9, 15], [7, 11, 18, 19, 21, 25]], 11, true], [[[1, 2, 3, 4, 5, 6], [7]], 4, true]],
    hints: ["Binary search on the smaller array.", "half = (m + n + 1) >> 1.", "Compare boundary elements, move lo/hi."],
    explain: "Partition binary search.",
    code: `function findMedianSortedArrays(nums1, nums2) {
  let A = nums1, B = nums2;
  if (A.length > B.length) [A, B] = [B, A];
  const m = A.length, n = B.length, half = (m + n + 1) >> 1;
  let lo = 0, hi = m;
  while (lo <= hi) {
    const i = (lo + hi) >> 1, j = half - i;
    const aL = i ? A[i - 1] : -Infinity, aR = i < m ? A[i] : Infinity;
    const bL = j ? B[j - 1] : -Infinity, bR = j < n ? B[j] : Infinity;
    if (aL <= bR && bL <= aR) {
      const left = Math.max(aL, bL);
      return (m + n) % 2 ? left : (left + Math.min(aR, bR)) / 2;
    }
    if (aL > bR) hi = i - 1; else lo = i + 1;
  }
  return 0;
}`,
    java: `class Main {
    static double findMedianSortedArrays(int[] a, int[] b) {
        // your code: binary search the partition in the smaller array
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(findMedianSortedArrays(new int[]{1,3}, new int[]{2}));   // 2.0
        System.out.println(findMedianSortedArrays(new int[]{1,2}, new int[]{3,4})); // 2.5
    }
}
`,
    python: `def findMedianSortedArrays(nums1, nums2):
    # your code
    return 0.0


if __name__ == "__main__":
    print(findMedianSortedArrays([1,3], [2]))  # 2
`,
  },
]);
