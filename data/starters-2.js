/* Java / Python / C++ starters for practice batch 2. Merges into STUDY_STARTERS. */
window.STUDY_STARTERS = Object.assign(window.STUDY_STARTERS || {}, {
  "longest-consecutive": {
    java: `import java.util.*;\n\nclass Main {\n    static int longestConsecutive(int[] nums) {\n        return 0;\n    }\n    public static void main(String[] a) {\n        System.out.println(longestConsecutive(new int[]{100,4,200,1,3,2})); // 4\n    }\n}\n`,
    python: `def longestConsecutive(nums):\n    return 0\n\n\nif __name__ == "__main__":\n    print(longestConsecutive([100, 4, 200, 1, 3, 2]))  # 4\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint longestConsecutive(vector<int>& nums) {\n    return 0;\n}\n\nint main() {\n    vector<int> a = {100,4,200,1,3,2};\n    cout << longestConsecutive(a) << '\\n'; // 4\n}\n`,
  },
  "two-sum-ii": {
    java: `import java.util.*;\n\nclass Main {\n    static int[] twoSum(int[] numbers, int target) {\n        return new int[]{};\n    }\n    public static void main(String[] a) {\n        System.out.println(Arrays.toString(twoSum(new int[]{2,7,11,15}, 9))); // [1, 2]\n    }\n}\n`,
    python: `def twoSum(numbers, target):\n    return []\n\n\nif __name__ == "__main__":\n    print(twoSum([2, 7, 11, 15], 9))  # [1, 2]\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& numbers, int target) {\n    return {};\n}\n\nint main() {\n    vector<int> a = {2,7,11,15};\n    for (int x : twoSum(a, 9)) cout << x << ' '; // 1 2\n    cout << '\\n';\n}\n`,
  },
  "container-with-most-water": {
    java: `import java.util.*;\n\nclass Main {\n    static int maxArea(int[] height) {\n        return 0;\n    }\n    public static void main(String[] a) {\n        System.out.println(maxArea(new int[]{1,8,6,2,5,4,8,3,7})); // 49\n    }\n}\n`,
    python: `def maxArea(height):\n    return 0\n\n\nif __name__ == "__main__":\n    print(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7]))  # 49\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint maxArea(vector<int>& height) {\n    return 0;\n}\n\nint main() {\n    vector<int> a = {1,8,6,2,5,4,8,3,7};\n    cout << maxArea(a) << '\\n'; // 49\n}\n`,
  },
  "trapping-rain-water": {
    java: `import java.util.*;\n\nclass Main {\n    static int trap(int[] height) {\n        return 0;\n    }\n    public static void main(String[] a) {\n        System.out.println(trap(new int[]{0,1,0,2,1,0,1,3,2,1,2,1})); // 6\n    }\n}\n`,
    python: `def trap(height):\n    return 0\n\n\nif __name__ == "__main__":\n    print(trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]))  # 6\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint trap(vector<int>& height) {\n    return 0;\n}\n\nint main() {\n    vector<int> a = {0,1,0,2,1,0,1,3,2,1,2,1};\n    cout << trap(a) << '\\n'; // 6\n}\n`,
  },
  "longest-repeating-char-replacement": {
    java: `import java.util.*;\n\nclass Main {\n    static int characterReplacement(String s, int k) {\n        return 0;\n    }\n    public static void main(String[] a) {\n        System.out.println(characterReplacement("AABABBA", 1)); // 4\n    }\n}\n`,
    python: `def characterReplacement(s, k):\n    return 0\n\n\nif __name__ == "__main__":\n    print(characterReplacement("AABABBA", 1))  # 4\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint characterReplacement(string s, int k) {\n    return 0;\n}\n\nint main() {\n    cout << characterReplacement("AABABBA", 1) << '\\n'; // 4\n}\n`,
  },
  "permutation-in-string": {
    java: `import java.util.*;\n\nclass Main {\n    static boolean checkInclusion(String s1, String s2) {\n        return false;\n    }\n    public static void main(String[] a) {\n        System.out.println(checkInclusion("ab", "eidbaooo")); // true\n        System.out.println(checkInclusion("ab", "eidboaoo")); // false\n    }\n}\n`,
    python: `def checkInclusion(s1, s2):\n    return False\n\n\nif __name__ == "__main__":\n    print(checkInclusion("ab", "eidbaooo"))  # True\n    print(checkInclusion("ab", "eidboaoo"))  # False\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nbool checkInclusion(string s1, string s2) {\n    return false;\n}\n\nint main() {\n    cout << boolalpha;\n    cout << checkInclusion("ab", "eidbaooo") << '\\n'; // true\n    cout << checkInclusion("ab", "eidboaoo") << '\\n'; // false\n}\n`,
  },
  "min-window-substring": {
    java: `import java.util.*;\n\nclass Main {\n    static String minWindow(String s, String t) {\n        return "";\n    }\n    public static void main(String[] a) {\n        System.out.println(minWindow("ADOBECODEBANC", "ABC")); // BANC\n    }\n}\n`,
    python: `def minWindow(s, t):\n    return ""\n\n\nif __name__ == "__main__":\n    print(minWindow("ADOBECODEBANC", "ABC"))  # BANC\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nstring minWindow(string s, string t) {\n    return "";\n}\n\nint main() {\n    cout << minWindow("ADOBECODEBANC", "ABC") << '\\n'; // BANC\n}\n`,
  },
  "evaluate-rpn": {
    java: `import java.util.*;\n\nclass Main {\n    static int evalRPN(String[] tokens) {\n        return 0;\n    }\n    public static void main(String[] a) {\n        System.out.println(evalRPN(new String[]{"4","13","5","/","+"})); // 6\n    }\n}\n`,
    python: `def evalRPN(tokens):\n    return 0\n\n\nif __name__ == "__main__":\n    print(evalRPN(["4", "13", "5", "/", "+"]))  # 6\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint evalRPN(vector<string>& tokens) {\n    return 0;\n}\n\nint main() {\n    vector<string> t = {"4","13","5","/","+"};\n    cout << evalRPN(t) << '\\n'; // 6\n}\n`,
  },
  "generate-parentheses": {
    java: `import java.util.*;\n\nclass Main {\n    static List<String> generateParenthesis(int n) {\n        return new ArrayList<>();\n    }\n    public static void main(String[] a) {\n        System.out.println(generateParenthesis(3)); // 5 combinations\n    }\n}\n`,
    python: `def generateParenthesis(n):\n    return []\n\n\nif __name__ == "__main__":\n    print(generateParenthesis(3))  # 5 combinations\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nvector<string> generateParenthesis(int n) {\n    return {};\n}\n\nint main() {\n    for (auto& s : generateParenthesis(3)) cout << s << ' ';\n    cout << '\\n';\n}\n`,
  },
  "daily-temperatures": {
    java: `import java.util.*;\n\nclass Main {\n    static int[] dailyTemperatures(int[] temperatures) {\n        return new int[]{};\n    }\n    public static void main(String[] a) {\n        System.out.println(Arrays.toString(dailyTemperatures(new int[]{73,74,75,71,69,72,76,73}))); // [1, 1, 4, 2, 1, 1, 0, 0]\n    }\n}\n`,
    python: `def dailyTemperatures(temperatures):\n    return []\n\n\nif __name__ == "__main__":\n    print(dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]))  # [1, 1, 4, 2, 1, 1, 0, 0]\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> dailyTemperatures(vector<int>& temperatures) {\n    return {};\n}\n\nint main() {\n    vector<int> a = {73,74,75,71,69,72,76,73};\n    for (int x : dailyTemperatures(a)) cout << x << ' '; // 1 1 4 2 1 1 0 0\n    cout << '\\n';\n}\n`,
  },
  "koko-eating-bananas": {
    java: `import java.util.*;\n\nclass Main {\n    static int minEatingSpeed(int[] piles, int h) {\n        return 0;\n    }\n    public static void main(String[] a) {\n        System.out.println(minEatingSpeed(new int[]{3,6,7,11}, 8)); // 4\n    }\n}\n`,
    python: `def minEatingSpeed(piles, h):\n    return 0\n\n\nif __name__ == "__main__":\n    print(minEatingSpeed([3, 6, 7, 11], 8))  # 4\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint minEatingSpeed(vector<int>& piles, int h) {\n    return 0;\n}\n\nint main() {\n    vector<int> a = {3,6,7,11};\n    cout << minEatingSpeed(a, 8) << '\\n'; // 4\n}\n`,
  },
  "find-min-rotated": {
    java: `import java.util.*;\n\nclass Main {\n    static int findMin(int[] nums) {\n        return 0;\n    }\n    public static void main(String[] a) {\n        System.out.println(findMin(new int[]{4,5,6,7,0,1,2})); // 0\n    }\n}\n`,
    python: `def findMin(nums):\n    return 0\n\n\nif __name__ == "__main__":\n    print(findMin([4, 5, 6, 7, 0, 1, 2]))  # 0\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint findMin(vector<int>& nums) {\n    return 0;\n}\n\nint main() {\n    vector<int> a = {4,5,6,7,0,1,2};\n    cout << findMin(a) << '\\n'; // 0\n}\n`,
  },
  "search-2d-matrix": {
    java: `import java.util.*;\n\nclass Main {\n    static boolean searchMatrix(int[][] matrix, int target) {\n        return false;\n    }\n    public static void main(String[] a) {\n        int[][] m = {{1,3,5,7},{10,11,16,20},{23,30,34,60}};\n        System.out.println(searchMatrix(m, 3));  // true\n        System.out.println(searchMatrix(m, 13)); // false\n    }\n}\n`,
    python: `def searchMatrix(matrix, target):\n    return False\n\n\nif __name__ == "__main__":\n    m = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]\n    print(searchMatrix(m, 3))   # True\n    print(searchMatrix(m, 13))  # False\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nbool searchMatrix(vector<vector<int>>& matrix, int target) {\n    return false;\n}\n\nint main() {\n    vector<vector<int>> m = {{1,3,5,7},{10,11,16,20},{23,30,34,60}};\n    cout << boolalpha;\n    cout << searchMatrix(m, 3) << '\\n';  // true\n    cout << searchMatrix(m, 13) << '\\n'; // false\n}\n`,
  },
  "min-cost-climbing-stairs": {
    java: `import java.util.*;\n\nclass Main {\n    static int minCostClimbingStairs(int[] cost) {\n        return 0;\n    }\n    public static void main(String[] a) {\n        System.out.println(minCostClimbingStairs(new int[]{10,15,20})); // 15\n    }\n}\n`,
    python: `def minCostClimbingStairs(cost):\n    return 0\n\n\nif __name__ == "__main__":\n    print(minCostClimbingStairs([10, 15, 20]))  # 15\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint minCostClimbingStairs(vector<int>& cost) {\n    return 0;\n}\n\nint main() {\n    vector<int> a = {10,15,20};\n    cout << minCostClimbingStairs(a) << '\\n'; // 15\n}\n`,
  },
  "house-robber-ii": {
    java: `import java.util.*;\n\nclass Main {\n    static int rob(int[] nums) {\n        return 0;\n    }\n    public static void main(String[] a) {\n        System.out.println(rob(new int[]{2,3,2}));    // 3\n        System.out.println(rob(new int[]{1,2,3,1}));  // 4\n    }\n}\n`,
    python: `def rob(nums):\n    return 0\n\n\nif __name__ == "__main__":\n    print(rob([2, 3, 2]))     # 3\n    print(rob([1, 2, 3, 1]))  # 4\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint rob(vector<int>& nums) {\n    return 0;\n}\n\nint main() {\n    vector<int> a = {2,3,2}, b = {1,2,3,1};\n    cout << rob(a) << '\\n'; // 3\n    cout << rob(b) << '\\n'; // 4\n}\n`,
  },
  "word-break": {
    java: `import java.util.*;\n\nclass Main {\n    static boolean wordBreak(String s, List<String> wordDict) {\n        return false;\n    }\n    public static void main(String[] a) {\n        System.out.println(wordBreak("leetcode", Arrays.asList("leet", "code")));       // true\n        System.out.println(wordBreak("catsandog", Arrays.asList("cats","dog","sand","and","cat"))); // false\n    }\n}\n`,
    python: `def wordBreak(s, wordDict):\n    return False\n\n\nif __name__ == "__main__":\n    print(wordBreak("leetcode", ["leet", "code"]))  # True\n    print(wordBreak("catsandog", ["cats", "dog", "sand", "and", "cat"]))  # False\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nbool wordBreak(string s, vector<string>& wordDict) {\n    return false;\n}\n\nint main() {\n    vector<string> d1 = {"leet","code"}, d2 = {"cats","dog","sand","and","cat"};\n    cout << boolalpha;\n    cout << wordBreak("leetcode", d1) << '\\n';  // true\n    cout << wordBreak("catsandog", d2) << '\\n'; // false\n}\n`,
  },
  "longest-increasing-subsequence": {
    java: `import java.util.*;\n\nclass Main {\n    static int lengthOfLIS(int[] nums) {\n        return 0;\n    }\n    public static void main(String[] a) {\n        System.out.println(lengthOfLIS(new int[]{10,9,2,5,3,7,101,18})); // 4\n    }\n}\n`,
    python: `def lengthOfLIS(nums):\n    return 0\n\n\nif __name__ == "__main__":\n    print(lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18]))  # 4\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint lengthOfLIS(vector<int>& nums) {\n    return 0;\n}\n\nint main() {\n    vector<int> a = {10,9,2,5,3,7,101,18};\n    cout << lengthOfLIS(a) << '\\n'; // 4\n}\n`,
  },
  "jump-game": {
    java: `import java.util.*;\n\nclass Main {\n    static boolean canJump(int[] nums) {\n        return false;\n    }\n    public static void main(String[] a) {\n        System.out.println(canJump(new int[]{2,3,1,1,4})); // true\n        System.out.println(canJump(new int[]{3,2,1,0,4})); // false\n    }\n}\n`,
    python: `def canJump(nums):\n    return False\n\n\nif __name__ == "__main__":\n    print(canJump([2, 3, 1, 1, 4]))  # True\n    print(canJump([3, 2, 1, 0, 4]))  # False\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nbool canJump(vector<int>& nums) {\n    return false;\n}\n\nint main() {\n    vector<int> a = {2,3,1,1,4}, b = {3,2,1,0,4};\n    cout << boolalpha;\n    cout << canJump(a) << '\\n'; // true\n    cout << canJump(b) << '\\n'; // false\n}\n`,
  },
  "gas-station": {
    java: `import java.util.*;\n\nclass Main {\n    static int canCompleteCircuit(int[] gas, int[] cost) {\n        return -1;\n    }\n    public static void main(String[] a) {\n        System.out.println(canCompleteCircuit(new int[]{1,2,3,4,5}, new int[]{3,4,5,1,2})); // 3\n        System.out.println(canCompleteCircuit(new int[]{2,3,4}, new int[]{3,4,3}));         // -1\n    }\n}\n`,
    python: `def canCompleteCircuit(gas, cost):\n    return -1\n\n\nif __name__ == "__main__":\n    print(canCompleteCircuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]))  # 3\n    print(canCompleteCircuit([2, 3, 4], [3, 4, 3]))              # -1\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint canCompleteCircuit(vector<int>& gas, vector<int>& cost) {\n    return -1;\n}\n\nint main() {\n    vector<int> g1 = {1,2,3,4,5}, c1 = {3,4,5,1,2}, g2 = {2,3,4}, c2 = {3,4,3};\n    cout << canCompleteCircuit(g1, c1) << '\\n'; // 3\n    cout << canCompleteCircuit(g2, c2) << '\\n'; // -1\n}\n`,
  },
  "single-number": {
    java: `import java.util.*;\n\nclass Main {\n    static int singleNumber(int[] nums) {\n        return 0;\n    }\n    public static void main(String[] a) {\n        System.out.println(singleNumber(new int[]{4,1,2,1,2})); // 4\n    }\n}\n`,
    python: `def singleNumber(nums):\n    return 0\n\n\nif __name__ == "__main__":\n    print(singleNumber([4, 1, 2, 1, 2]))  # 4\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint singleNumber(vector<int>& nums) {\n    return 0;\n}\n\nint main() {\n    vector<int> a = {4,1,2,1,2};\n    cout << singleNumber(a) << '\\n'; // 4\n}\n`,
  },
});
