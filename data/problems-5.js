/* DSA practice — batch 5: backtracking and dynamic programming (big-tech frequent). */
window.__addProblems([
  // ---------------------------------------------------------------- Backtracking
  {
    id: "subsets", title: "Subsets", difficulty: "Medium", lc: "subsets",
    tags: ["Backtracking", "Bit Manipulation"], companies: ["Meta", "Amazon", "Google", "Microsoft", "Uber"], pattern: "Include / exclude recursion",
    relatedTopic: "/topic/dsa/dsa-recursion?m=deep",
    statement: `<p>Return all subsets (the power set) of distinct integers. Order doesn't matter.</p>`,
    examples: [{ in: "nums = [1,2,3]", out: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]" }],
    constraints: ["1 <= n <= 10"],
    concept: `<p>Each element is either in or out → 2ⁿ subsets. Backtracking template: at index i, add the current path to the answer, then for j ≥ i choose nums[j], recurse with j + 1, undo. Iterative alternative: start with [[]] and for each number append it to copies of all existing subsets.</p>`,
    stuck: ["How many subsets exist? (2ⁿ) — each element has two choices.", "Draw the decision tree for [1,2,3]: include 1 or not, then 2, then 3.", "Backtracking: path array, push, recurse, pop.", "Record a copy of the path (not the reference!)."],
    complexity: "O(n · 2ⁿ) time and output",
    fnName: "subsets",
    starter: "function subsets(nums) {\n  \n}\n",
    tests: [[[[1, 2, 3]], [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]], false, true], [[[0]], [[], [0]], false, true], [[[5, 9]], [[], [5], [9], [5, 9]], true, true]],
    hints: ["2ⁿ subsets.", "Backtrack with a start index.", "Push a copy of the path at every node."],
    explain: "Backtracking with a start index.",
    code: `function subsets(nums) {
  const out = [], path = [];
  const bt = (i) => {
    out.push([...path]);
    for (let j = i; j < nums.length; j++) { path.push(nums[j]); bt(j + 1); path.pop(); }
  };
  bt(0);
  return out;
}`,
    java: `import java.util.*;

class Main {
    static List<List<Integer>> subsets(int[] nums) {
        // your code: backtrack(start, path)
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        System.out.println(subsets(new int[]{1, 2, 3})); // 8 subsets
    }
}
`,
    python: `def subsets(nums):
    # your code
    return []


if __name__ == "__main__":
    print(subsets([1, 2, 3]))
`,
  },
  {
    id: "permutations", title: "Permutations", difficulty: "Medium", lc: "permutations",
    tags: ["Backtracking"], companies: ["Meta", "Microsoft", "Amazon", "LinkedIn", "Google"], pattern: "Backtracking with a used[] set",
    relatedTopic: "/topic/dsa/dsa-recursion?m=deep",
    statement: `<p>Return all permutations of distinct integers. Order doesn't matter.</p>`,
    examples: [{ in: "nums = [1,2,3]", out: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]" }],
    constraints: ["1 <= n <= 6"],
    concept: `<p>Build the permutation position by position; at each step choose any unused number, recurse, then un-choose. When the path length equals n, record it.</p>`,
    stuck: ["How many permutations? (n!)", "At each position, which numbers can go there? (any not used yet)", "Track used numbers in a boolean array; backtrack by unmarking."],
    complexity: "O(n · n!) time",
    fnName: "permute",
    starter: "function permute(nums) {\n  \n}\n",
    tests: [[[[1, 2, 3]], [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]], false, true], [[[0, 1]], [[0, 1], [1, 0]], false, true], [[[1]], [[1]], true, true]],
    hints: ["used[] array.", "Record when path.length === n.", "Undo after recursion."],
    explain: "Choose / explore / un-choose.",
    code: `function permute(nums) {
  const out = [], path = [], used = new Array(nums.length).fill(false);
  const bt = () => {
    if (path.length === nums.length) { out.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true; path.push(nums[i]); bt(); path.pop(); used[i] = false;
    }
  };
  bt();
  return out;
}`,
    java: `import java.util.*;

class Main {
    static List<List<Integer>> permute(int[] nums) {
        // your code
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        System.out.println(permute(new int[]{1, 2, 3})); // 6 permutations
    }
}
`,
    python: `def permute(nums):
    # your code
    return []


if __name__ == "__main__":
    print(permute([1, 2, 3]))
`,
  },
  {
    id: "combination-sum", title: "Combination Sum", difficulty: "Medium", lc: "combination-sum",
    tags: ["Backtracking"], companies: ["Amazon", "Airbnb", "Meta", "Uber", "Microsoft"], pattern: "Backtracking with reuse + pruning",
    relatedTopic: "/topic/dsa/dsa-recursion?m=deep",
    statement: `<p>Given distinct candidates and a target, return all unique combinations that sum to target; a candidate may be reused unlimited times. Each combination in non-decreasing order.</p>`,
    examples: [{ in: "candidates = [2,3,6,7], target = 7", out: "[[2,2,3],[7]]" }],
    constraints: ["1 <= candidates.length <= 30", "1 <= target <= 40"],
    concept: `<p>Sort candidates. Recurse with (start, remaining): for i ≥ start, if candidates[i] > remaining break (pruning); otherwise take it and recurse with the <b>same</b> i (reuse allowed). Using a start index prevents permutations of the same combination.</p>`,
    stuck: ["Why do you get [2,3,2] and [3,2,2] as duplicates in naive recursion? Fix with a start index.", "Reuse is allowed → recurse with i, not i + 1.", "Sort so you can stop early when a candidate exceeds the remainder."],
    complexity: "Exponential (bounded by target/min candidate depth)",
    fnName: "combinationSum",
    starter: "function combinationSum(candidates, target) {\n  \n}\n",
    tests: [[[[2, 3, 6, 7], 7], [[2, 2, 3], [7]], false, true], [[[2, 3, 5], 8], [[2, 2, 2, 2], [2, 3, 3], [3, 5]], false, true], [[[2], 1], [], false, true], [[[7, 3, 2], 18], [[2, 2, 2, 2, 2, 2, 2, 2, 2], [2, 2, 2, 2, 2, 2, 3, 3], [2, 2, 2, 2, 3, 7], [2, 2, 2, 3, 3, 3, 3], [2, 2, 7, 7], [2, 3, 3, 3, 7], [3, 3, 3, 3, 3, 3]], true, true]],
    hints: ["Sort candidates.", "Recurse with the same index to allow reuse.", "Break when candidate > remaining."],
    explain: "Backtracking with start index and pruning.",
    code: `function combinationSum(candidates, target) {
  const c = [...candidates].sort((a, b) => a - b), out = [], path = [];
  const bt = (start, rem) => {
    if (rem === 0) { out.push([...path]); return; }
    for (let i = start; i < c.length && c[i] <= rem; i++) { path.push(c[i]); bt(i, rem - c[i]); path.pop(); }
  };
  bt(0, target);
  return out;
}`,
    java: `import java.util.*;

class Main {
    static List<List<Integer>> combinationSum(int[] candidates, int target) {
        // your code
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        System.out.println(combinationSum(new int[]{2, 3, 6, 7}, 7)); // [[2, 2, 3], [7]]
    }
}
`,
    python: `def combinationSum(candidates, target):
    # your code
    return []


if __name__ == "__main__":
    print(combinationSum([2, 3, 6, 7], 7))  # [[2, 2, 3], [7]]
`,
  },
  {
    id: "word-search", title: "Word Search", difficulty: "Medium", lc: "word-search",
    tags: ["Backtracking", "Matrix", "DFS"], companies: ["Amazon", "Microsoft", "Meta", "Bloomberg", "Snap"], pattern: "Grid DFS with in-place visited marking",
    relatedTopic: "/topic/dsa/dsa-recursion?m=deep",
    statement: `<p>Return true if <code>word</code> can be formed by sequentially adjacent (4-directional) cells, using each cell at most once.</p>`,
    examples: [{ in: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', out: "true" }],
    constraints: ["1 <= m, n <= 6", "1 <= word.length <= 15"],
    concept: `<p>Try DFS from every cell matching word[0]. In the DFS, mark the cell as used (e.g. replace with '#'), explore 4 neighbours for the next character, then restore it (backtrack).</p>`,
    stuck: ["Where can the word start? Any cell equal to word[0].", "From a cell at word index k, where can you go for index k + 1? (4 neighbours with the right letter, not already used)", "Mark visited in place and restore after exploring (backtracking).", "Prune: return false as soon as a letter doesn't match."],
    complexity: "O(m·n·3^L) time, O(L) recursion",
    fnName: "exist",
    starter: "function exist(board, word) {\n  \n}\n",
    tests: [[[[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "ABCCED"], true], [[[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "SEE"], true], [[[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "ABCB"], false], [[[["a"]], "a"], true, true], [[[["a", "b"], ["c", "d"]], "abdc"], true, true], [[[["a", "a"]], "aaa"], false, true]],
    hints: ["DFS from each start cell.", "Mark and unmark cells.", "Index k === word.length ⇒ found."],
    explain: "Backtracking DFS on the grid.",
    code: `function exist(board, word) {
  const m = board.length, n = board[0].length;
  const dfs = (i, j, k) => {
    if (k === word.length) return true;
    if (i < 0 || j < 0 || i >= m || j >= n || board[i][j] !== word[k]) return false;
    const c = board[i][j]; board[i][j] = "#";
    const ok = dfs(i + 1, j, k + 1) || dfs(i - 1, j, k + 1) || dfs(i, j + 1, k + 1) || dfs(i, j - 1, k + 1);
    board[i][j] = c;
    return ok;
  };
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (dfs(i, j, 0)) return true;
  return false;
}`,
    java: `class Main {
    static boolean exist(char[][] board, String word) {
        // your code: dfs(i, j, k) with in-place marking
        return false;
    }

    public static void main(String[] args) {
        char[][] b = {{'A','B','C','E'},{'S','F','C','S'},{'A','D','E','E'}};
        System.out.println(exist(b, "ABCCED")); // true
        System.out.println(exist(b, "ABCB"));   // false
    }
}
`,
    python: `def exist(board, word):
    # your code
    return False


if __name__ == "__main__":
    b = [list("ABCE"), list("SFCS"), list("ADEE")]
    print(exist(b, "ABCCED"))  # True
`,
  },
  {
    id: "letter-combinations", title: "Letter Combinations of a Phone Number", difficulty: "Medium", lc: "letter-combinations-of-a-phone-number",
    tags: ["Backtracking", "String"], companies: ["Amazon", "Meta", "Google", "Microsoft", "Uber"], pattern: "Cartesian product via backtracking",
    relatedTopic: "/topic/dsa/dsa-recursion?m=deep",
    statement: `<p>Given digits 2–9, return all letter combinations the number could represent (phone keypad), in lexicographic generation order.</p>`,
    examples: [{ in: 'digits = "23"', out: '["ad","ae","af","bd","be","bf","cd","ce","cf"]' }],
    constraints: ["0 <= digits.length <= 4"],
    concept: `<p>For each digit pick one of its letters → a Cartesian product. Backtrack over positions, or iteratively extend a list of prefixes.</p>`,
    stuck: ["Map digits to letters.", "For 2 digits it's a nested loop — for k digits use recursion over positions.", "Empty input returns []."],
    complexity: "O(4ⁿ · n) time",
    fnName: "letterCombinations",
    starter: "function letterCombinations(digits) {\n  \n}\n",
    tests: [[["23"], ["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"]], [[""], []], [["2"], ["a", "b", "c"]], [["79"], ["pw", "px", "py", "pz", "qw", "qx", "qy", "qz", "rw", "rx", "ry", "rz", "sw", "sx", "sy", "sz"], true]],
    hints: ["Keypad map.", "Recurse over digit positions.", "Build strings incrementally."],
    explain: "Iterative prefix expansion.",
    code: `function letterCombinations(digits) {
  if (!digits) return [];
  const map = { 2: "abc", 3: "def", 4: "ghi", 5: "jkl", 6: "mno", 7: "pqrs", 8: "tuv", 9: "wxyz" };
  let out = [""];
  for (const d of digits) {
    const next = [];
    for (const p of out) for (const c of map[d]) next.push(p + c);
    out = next;
  }
  return out;
}`,
    java: `import java.util.*;

class Main {
    static List<String> letterCombinations(String digits) {
        // your code
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        System.out.println(letterCombinations("23")); // [ad, ae, af, bd, be, bf, cd, ce, cf]
    }
}
`,
    python: `def letterCombinations(digits):
    # your code
    return []


if __name__ == "__main__":
    print(letterCombinations("23"))
`,
  },
  {
    id: "n-queens-ii", title: "N-Queens (count solutions)", difficulty: "Hard", lc: "n-queens-ii",
    tags: ["Backtracking"], companies: ["Amazon", "Microsoft", "Google", "Apple"], pattern: "Row-by-row backtracking with column/diagonal sets",
    relatedTopic: "/topic/dsa/dsa-recursion?m=deep",
    statement: `<p>Return the number of ways to place n queens on an n×n board so none attack each other.</p>`,
    examples: [{ in: "n = 4", out: "2" }, { in: "n = 1", out: "1" }],
    constraints: ["1 <= n <= 9"],
    concept: `<p>Place one queen per row. A square (r, c) is attacked if its column, its diagonal (r − c) or anti-diagonal (r + c) is already used. Keep three sets, backtrack row by row.</p>`,
    stuck: ["Each row must contain exactly one queen — so recurse over rows.", "How do you check diagonals in O(1)? Cells on the same diagonal share r − c; anti-diagonal share r + c.", "Three sets: cols, diag, anti. Add, recurse to next row, remove."],
    complexity: "O(n!) time, O(n) space",
    fnName: "totalNQueens",
    starter: "function totalNQueens(n) {\n  \n}\n",
    tests: [[[4], 2], [[1], 1], [[5], 10], [[6], 4, true], [[8], 92, true]],
    hints: ["Row by row.", "Sets for columns and both diagonals.", "Count when row === n."],
    explain: "Backtracking with O(1) conflict checks.",
    code: `function totalNQueens(n) {
  const cols = new Set(), d1 = new Set(), d2 = new Set();
  let count = 0;
  const bt = (r) => {
    if (r === n) { count++; return; }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || d1.has(r - c) || d2.has(r + c)) continue;
      cols.add(c); d1.add(r - c); d2.add(r + c);
      bt(r + 1);
      cols.delete(c); d1.delete(r - c); d2.delete(r + c);
    }
  };
  bt(0);
  return count;
}`,
    java: `import java.util.*;

class Main {
    static int totalNQueens(int n) {
        // your code
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(totalNQueens(4)); // 2
        System.out.println(totalNQueens(8)); // 92
    }
}
`,
    python: `def totalNQueens(n):
    # your code
    return 0


if __name__ == "__main__":
    print(totalNQueens(4))  # 2
`,
  },
  {
    id: "palindrome-partitioning", title: "Palindrome Partitioning", difficulty: "Medium", lc: "palindrome-partitioning",
    tags: ["Backtracking", "String", "Dynamic Programming"], companies: ["Amazon", "Google", "Meta", "Bloomberg"], pattern: "Backtracking over cut positions",
    relatedTopic: "/topic/dsa/dsa-recursion?m=deep",
    statement: `<p>Partition s so every substring is a palindrome; return all partitions.</p>`,
    examples: [{ in: 's = "aab"', out: '[["a","a","b"],["aa","b"]]' }],
    constraints: ["1 <= s.length <= 16"],
    concept: `<p>Choose the first piece s[start..end] if it's a palindrome, then recurse on the rest. Optional: precompute an isPal[i][j] DP table to make checks O(1).</p>`,
    stuck: ["The first cut can be anywhere — try every prefix.", "Only continue if the prefix is a palindrome.", "When start reaches the end, record the current partition."],
    complexity: "O(n · 2ⁿ) time",
    fnName: "partition",
    starter: "function partition(s) {\n  \n}\n",
    tests: [[["aab"], [["a", "a", "b"], ["aa", "b"]], false, true], [["a"], [["a"]], false, true], [["aba"], [["a", "b", "a"], ["aba"]], true, true], [["abba"], [["a", "b", "b", "a"], ["a", "bb", "a"], ["abba"]], true, true]],
    hints: ["Recurse on start index.", "Try every end index.", "Check palindrome before recursing."],
    explain: "Backtracking over cuts.",
    code: `function partition(s) {
  const out = [], path = [];
  const isPal = (l, r) => { while (l < r) if (s[l++] !== s[r--]) return false; return true; };
  const bt = (start) => {
    if (start === s.length) { out.push([...path]); return; }
    for (let end = start; end < s.length; end++) if (isPal(start, end)) { path.push(s.slice(start, end + 1)); bt(end + 1); path.pop(); }
  };
  bt(0);
  return out;
}`,
    java: `import java.util.*;

class Main {
    static List<List<String>> partition(String s) {
        // your code
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        System.out.println(partition("aab")); // [[a, a, b], [aa, b]]
    }
}
`,
    python: `def partition(s):
    # your code
    return []


if __name__ == "__main__":
    print(partition("aab"))
`,
  },
  // ---------------------------------------------------------------- Dynamic programming
  {
    id: "unique-paths", title: "Unique Paths", difficulty: "Medium", lc: "unique-paths",
    tags: ["Dynamic Programming", "Math"], companies: ["Google", "Amazon", "Meta", "Bloomberg"], pattern: "2-D grid DP (rolling row)",
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p>A robot at the top-left of an m×n grid moves only right or down. How many unique paths reach the bottom-right?</p>`,
    examples: [{ in: "m = 3, n = 7", out: "28" }, { in: "m = 3, n = 2", out: "3" }],
    constraints: ["1 <= m, n <= 100 (answer fits in 2*10^9)"],
    concept: `<p>paths[i][j] = paths[i−1][j] + paths[i][j−1], first row/column = 1. Only the previous row is needed → O(n) space. Closed form: C(m+n−2, m−1).</p>`,
    stuck: ["How can you arrive at cell (i, j)? From above or from the left.", "So paths(i, j) = paths(i−1, j) + paths(i, j−1). Base cases?", "Fill row by row; keep only one row."],
    complexity: "O(m·n) time, O(n) space",
    fnName: "uniquePaths",
    starter: "function uniquePaths(m, n) {\n  \n}\n",
    tests: [[[3, 7], 28], [[3, 2], 3], [[1, 1], 1], [[7, 3], 28, true], [[10, 10], 48620, true]],
    hints: ["dp[j] += dp[j−1].", "Initialize with 1s.", "m−1 rows of updates."],
    explain: "Rolling 1-D DP.",
    code: `function uniquePaths(m, n) {
  const dp = new Array(n).fill(1);
  for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) dp[j] += dp[j - 1];
  return dp[n - 1];
}`,
    java: `class Main {
    static int uniquePaths(int m, int n) {
        // your code
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(uniquePaths(3, 7)); // 28
    }
}
`,
    python: `def uniquePaths(m, n):
    # your code
    return 0


if __name__ == "__main__":
    print(uniquePaths(3, 7))  # 28
`,
  },
  {
    id: "edit-distance", title: "Edit Distance", difficulty: "Medium", lc: "edit-distance",
    tags: ["Dynamic Programming", "String"], companies: ["Google", "Amazon", "Microsoft", "Meta", "LinkedIn"], pattern: "2-D string DP (insert / delete / replace)",
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p>Return the minimum number of insertions, deletions and replacements to convert word1 into word2.</p>`,
    examples: [{ in: 'word1 = "horse", word2 = "ros"', out: "3" }, { in: 'word1 = "intention", word2 = "execution"', out: "5" }],
    constraints: ["0 <= lengths <= 500"],
    concept: `<p>dp[i][j] = edits to turn word1[0..i) into word2[0..j). If the last chars match, dp[i][j] = dp[i−1][j−1]; else 1 + min(dp[i−1][j] (delete), dp[i][j−1] (insert), dp[i−1][j−1] (replace)). Base: dp[i][0] = i, dp[0][j] = j.</p>`,
    stuck: ["Define the subproblem on prefixes: dp[i][j] for the first i and j characters.", "Look at the last characters: if equal, nothing to do. Otherwise which three operations could have been last?", "Write the recurrence and base cases (empty strings).", "Fill the table row by row (or keep two rows)."],
    complexity: "O(m·n) time, O(n) space with rolling rows",
    fnName: "minDistance",
    starter: "function minDistance(word1, word2) {\n  \n}\n",
    tests: [[["horse", "ros"], 3], [["intention", "execution"], 5], [["", "abc"], 3], [["abc", "abc"], 0, true], [["kitten", "sitting"], 3, true], [["a", ""], 1, true]],
    hints: ["Prefix subproblems.", "Three operations → min of three neighbours + 1.", "Base row/column are i and j."],
    explain: "Classic Levenshtein DP.",
    code: `function minDistance(word1, word2) {
  const m = word1.length, n = word2.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = word1[i - 1] === word2[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], cur[j - 1], prev[j - 1]);
    prev = cur;
  }
  return prev[n];
}`,
    java: `class Main {
    static int minDistance(String a, String b) {
        // your code: dp[i][j]
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(minDistance("horse", "ros")); // 3
    }
}
`,
    python: `def minDistance(word1, word2):
    # your code
    return 0


if __name__ == "__main__":
    print(minDistance("horse", "ros"))  # 3
`,
  },
  {
    id: "decode-ways", title: "Decode Ways", difficulty: "Medium", lc: "decode-ways",
    tags: ["Dynamic Programming", "String"], companies: ["Meta", "Google", "Amazon", "Microsoft", "Uber"], pattern: "1-D DP like climbing stairs with validity checks",
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p>'A'→1 … 'Z'→26. Given a digit string, return the number of ways to decode it.</p>`,
    examples: [{ in: 's = "12"', out: "2" }, { in: 's = "226"', out: "3" }, { in: 's = "06"', out: "0" }],
    constraints: ["1 <= s.length <= 100"],
    concept: `<p>ways[i] = (s[i−1] ≠ '0' ? ways[i−1] : 0) + (s[i−2..i−1] ∈ [10, 26] ? ways[i−2] : 0). It's climbing stairs where each step's validity depends on the digits. Two variables suffice.</p>`,
    stuck: ["At each position you decode either 1 digit or 2 digits — like climbing stairs.", "When is a single digit valid? (not '0') When is a pair valid? (10..26)", "ways[i] = single-valid·ways[i−1] + pair-valid·ways[i−2]. Base ways[0] = 1."],
    complexity: "O(n) time, O(1) space",
    fnName: "numDecodings",
    starter: "function numDecodings(s) {\n  \n}\n",
    tests: [[["12"], 2], [["226"], 3], [["06"], 0], [["11106"], 2, true], [["10"], 1, true], [["2101"], 1, true], [["27"], 1, true]],
    hints: ["Like Fibonacci with conditions.", "'0' can only be part of 10 or 20.", "Two rolling variables."],
    explain: "Rolling DP.",
    code: `function numDecodings(s) {
  let prev2 = 1, prev1 = s[0] === "0" ? 0 : 1;
  for (let i = 2; i <= s.length; i++) {
    let cur = 0;
    if (s[i - 1] !== "0") cur += prev1;
    const two = +s.slice(i - 2, i);
    if (two >= 10 && two <= 26) cur += prev2;
    prev2 = prev1; prev1 = cur;
  }
  return prev1;
}`,
    java: `class Main {
    static int numDecodings(String s) {
        // your code
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(numDecodings("226")); // 3
    }
}
`,
    python: `def numDecodings(s):
    # your code
    return 0


if __name__ == "__main__":
    print(numDecodings("226"))  # 3
`,
  },
  {
    id: "partition-equal-subset", title: "Partition Equal Subset Sum", difficulty: "Medium", lc: "partition-equal-subset-sum",
    tags: ["Dynamic Programming", "Knapsack"], companies: ["Meta", "Amazon", "Google", "Microsoft"], pattern: "0/1 knapsack on a boolean array",
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p>Return true if the array can be split into two subsets with equal sums.</p>`,
    examples: [{ in: "nums = [1,5,11,5]", out: "true" }, { in: "nums = [1,2,3,5]", out: "false" }],
    constraints: ["1 <= n <= 200", "1 <= nums[i] <= 100"],
    concept: `<p>Equivalent to: is there a subset summing to total/2 (total must be even)? 0/1 knapsack: reachable[s] booleans; for each number iterate s from high to low so each number is used once.</p>`,
    stuck: ["If two halves are equal, what must each sum to? (total / 2 — so total must be even)", "Now it's 'subset sum = target'. Which DP? (0/1 knapsack)", "dp[s] = can we make sum s. For each num, for s from target down to num: dp[s] ||= dp[s − num].", "Why iterate downwards? So each number is used at most once."],
    complexity: "O(n · target) time, O(target) space",
    fnName: "canPartition",
    starter: "function canPartition(nums) {\n  \n}\n",
    tests: [[[[1, 5, 11, 5]], true], [[[1, 2, 3, 5]], false], [[[2, 2]], true], [[[1]], false, true], [[[3, 3, 3, 4, 5]], true, true], [[[100, 100, 100, 100, 100, 100, 100, 100, 100, 99, 97]], false, true]],
    hints: ["Odd total ⇒ false.", "Boolean DP over sums.", "Iterate sums backwards."],
    explain: "Subset-sum DP.",
    code: `function canPartition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2) return false;
  const target = total / 2, dp = new Array(target + 1).fill(false);
  dp[0] = true;
  for (const x of nums) for (let s = target; s >= x; s--) if (dp[s - x]) dp[s] = true;
  return dp[target];
}`,
    java: `class Main {
    static boolean canPartition(int[] nums) {
        // your code
        return false;
    }

    public static void main(String[] args) {
        System.out.println(canPartition(new int[]{1, 5, 11, 5})); // true
    }
}
`,
    python: `def canPartition(nums):
    # your code
    return False


if __name__ == "__main__":
    print(canPartition([1, 5, 11, 5]))  # True
`,
  },
  {
    id: "max-product-subarray", title: "Maximum Product Subarray", difficulty: "Medium", lc: "maximum-product-subarray",
    tags: ["Dynamic Programming", "Array"], companies: ["Amazon", "LinkedIn", "Google", "Microsoft"], pattern: "Track both max and min ending here",
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p>Return the largest product of a contiguous subarray.</p>`,
    examples: [{ in: "nums = [2,3,-2,4]", out: "6" }, { in: "nums = [-2,0,-1]", out: "0" }],
    constraints: ["1 <= n <= 2*10^4"],
    concept: `<p>Like Kadane, but a negative number flips the biggest product into the smallest and vice versa. Track both the max and min product ending at each index; the new max is the max of (x, x·maxPrev, x·minPrev).</p>`,
    stuck: ["Kadane's algorithm works for sums — why does it fail for products? (negatives)", "A very negative product can become the maximum after one more negative number.", "Keep curMax and curMin; update both from x, x·curMax, x·curMin."],
    complexity: "O(n) time, O(1) space",
    fnName: "maxProduct",
    starter: "function maxProduct(nums) {\n  \n}\n",
    tests: [[[[2, 3, -2, 4]], 6], [[[-2, 0, -1]], 0], [[[-2, 3, -4]], 24], [[[-2]], -2, true], [[[0, 2]], 2, true], [[[2, -5, -2, -4, 3]], 24, true]],
    hints: ["Track min too.", "Swap roles on negative numbers.", "Answer = max over curMax."],
    explain: "Kadane variant with min and max.",
    code: `function maxProduct(nums) {
  let hi = nums[0], lo = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const x = nums[i], a = x * hi, b = x * lo;
    hi = Math.max(x, a, b); lo = Math.min(x, a, b);
    best = Math.max(best, hi);
  }
  return best;
}`,
    java: `class Main {
    static int maxProduct(int[] nums) {
        // your code
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(maxProduct(new int[]{2, 3, -2, 4})); // 6
    }
}
`,
    python: `def maxProduct(nums):
    # your code
    return 0


if __name__ == "__main__":
    print(maxProduct([2, 3, -2, 4]))  # 6
`,
  },
  {
    id: "coin-change-ii", title: "Coin Change II (number of ways)", difficulty: "Medium", lc: "coin-change-ii",
    tags: ["Dynamic Programming", "Knapsack"], companies: ["Amazon", "Google", "Microsoft", "Bloomberg"], pattern: "Unbounded knapsack counting (coins outer loop)",
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p>Return the number of combinations of coins (unlimited supply) that make up <code>amount</code>.</p>`,
    examples: [{ in: "amount = 5, coins = [1,2,5]", out: "4" }],
    constraints: ["0 <= amount <= 5000"],
    concept: `<p>ways[0] = 1. For each coin (outer loop) and each sum s from coin to amount: ways[s] += ways[s − coin]. Putting coins in the outer loop counts combinations (not permutations).</p>`,
    stuck: ["Start with Coin Change I (minimum coins). What changes when counting ways?", "If you loop over amounts outside and coins inside, you count [1,2] and [2,1] separately. Swap the loops.", "ways[s] += ways[s − coin], iterating s upward (unlimited reuse)."],
    complexity: "O(amount · coins) time, O(amount) space",
    fnName: "change",
    starter: "function change(amount, coins) {\n  \n}\n",
    tests: [[[5, [1, 2, 5]], 4], [[3, [2]], 0], [[10, [10]], 1], [[0, [7]], 1, true], [[500, [3, 5, 7, 8, 9, 10, 11]], 35502874, true]],
    hints: ["ways[0] = 1.", "Coins in the outer loop.", "Iterate sums upward."],
    explain: "Unbounded knapsack counting.",
    code: `function change(amount, coins) {
  const ways = new Array(amount + 1).fill(0);
  ways[0] = 1;
  for (const c of coins) for (let s = c; s <= amount; s++) ways[s] += ways[s - c];
  return ways[amount];
}`,
    java: `class Main {
    static int change(int amount, int[] coins) {
        // your code
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(change(5, new int[]{1, 2, 5})); // 4
    }
}
`,
    python: `def change(amount, coins):
    # your code
    return 0


if __name__ == "__main__":
    print(change(5, [1, 2, 5]))  # 4
`,
  },
  {
    id: "regex-matching", title: "Regular Expression Matching", difficulty: "Hard", lc: "regular-expression-matching",
    tags: ["Dynamic Programming", "String", "Recursion"], companies: ["Google", "Meta", "Amazon", "Microsoft", "Uber"], pattern: "2-D DP over (text index, pattern index)",
    relatedTopic: "/topic/dsa/dsa-dp?m=deep",
    statement: `<p>Implement matching with '.' (any single char) and '*' (zero or more of the preceding element) over the entire string.</p>`,
    examples: [{ in: 's = "aa", p = "a"', out: "false" }, { in: 's = "aa", p = "a*"', out: "true" }, { in: 's = "ab", p = ".*"', out: "true" }],
    constraints: ["1 <= s.length, p.length <= 20"],
    concept: `<p>dp[i][j] = does s[i:] match p[j:]. first = i < |s| and p[j] ∈ {s[i], '.'}. If p[j+1] is '*': dp[i][j] = dp[i][j+2] (use zero) or (first and dp[i+1][j]) (use one more). Else dp[i][j] = first and dp[i+1][j+1]. Memoized recursion is the easiest to write under pressure.</p>`,
    stuck: ["Handle '.' first (no stars): simple character-by-character match.", "A '*' always pairs with the character before it — look ahead one position in the pattern.", "With x*: either skip 'x*' entirely (zero occurrences) or consume one char of s if it matches x and stay on the same pattern position.", "Memoize on (i, j) to avoid exponential time."],
    complexity: "O(|s| · |p|) time and space",
    fnName: "isMatch",
    starter: "function isMatch(s, p) {\n  \n}\n",
    tests: [[["aa", "a"], false], [["aa", "a*"], true], [["ab", ".*"], true], [["aab", "c*a*b"], true, true], [["mississippi", "mis*is*p*."], false, true], [["", "a*b*"], true, true], [["ab", ".*c"], false, true]],
    hints: ["Recursive match(i, j) with memo.", "Look ahead for '*'.", "Base: j === p.length ⇒ i === s.length."],
    explain: "Top-down DP with memoization.",
    code: `function isMatch(s, p) {
  const memo = new Map();
  const m = (i, j) => {
    const key = i * 100 + j;
    if (memo.has(key)) return memo.get(key);
    let ans;
    if (j === p.length) ans = i === s.length;
    else {
      const first = i < s.length && (p[j] === s[i] || p[j] === ".");
      if (j + 1 < p.length && p[j + 1] === "*") ans = m(i, j + 2) || (first && m(i + 1, j));
      else ans = first && m(i + 1, j + 1);
    }
    memo.set(key, ans);
    return ans;
  };
  return m(0, 0);
}`,
    java: `class Main {
    static boolean isMatch(String s, String p) {
        // your code: memoized match(i, j)
        return false;
    }

    public static void main(String[] args) {
        System.out.println(isMatch("aa", "a*"));  // true
        System.out.println(isMatch("aab", "c*a*b")); // true
    }
}
`,
    python: `from functools import lru_cache

def isMatch(s, p):
    # your code
    return False


if __name__ == "__main__":
    print(isMatch("aa", "a*"))  # True
`,
  },
]);
