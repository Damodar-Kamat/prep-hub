/* Language-specific starter code for the DSA Practice workspace.
   JavaScript starters live in problems.js and are auto-graded locally.
   Java / Python / C++ starters below are COMPLETE runnable programs: a solution
   stub plus a main() that runs the visible example(s) and prints the result, so
   you can hit Run (remote sandbox) and eyeball the output against the examples. */
window.STUDY_STARTERS = {
  "two-sum": {
    java: `import java.util.*;

public class Main {
    static int[] twoSum(int[] nums, int target) {
        // your code

        return new int[]{};
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9))); // [0, 1]
        System.out.println(Arrays.toString(twoSum(new int[]{3, 2, 4}, 6)));      // [1, 2]
    }
}
`,
    python: `def twoSum(nums, target):
    # your code
    return []


if __name__ == "__main__":
    print(twoSum([2, 7, 11, 15], 9))  # [0, 1]
    print(twoSum([3, 2, 4], 6))       # [1, 2]
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // your code
    return {};
}

int main() {
    vector<int> a = {2, 7, 11, 15};
    for (int x : twoSum(a, 9)) cout << x << ' ';  // 0 1
    cout << '\\n';
}
`,
  },

  "valid-anagram": {
    java: `import java.util.*;

public class Main {
    static boolean isAnagram(String s, String t) {
        // your code
        return false;
    }

    public static void main(String[] args) {
        System.out.println(isAnagram("anagram", "nagaram")); // true
        System.out.println(isAnagram("rat", "car"));         // false
    }
}
`,
    python: `def isAnagram(s, t):
    # your code
    return False


if __name__ == "__main__":
    print(isAnagram("anagram", "nagaram"))  # True
    print(isAnagram("rat", "car"))          # False
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

bool isAnagram(string s, string t) {
    // your code
    return false;
}

int main() {
    cout << boolalpha;
    cout << isAnagram("anagram", "nagaram") << '\\n'; // true
    cout << isAnagram("rat", "car") << '\\n';         // false
}
`,
  },

  "contains-duplicate": {
    java: `import java.util.*;

public class Main {
    static boolean containsDuplicate(int[] nums) {
        // your code
        return false;
    }

    public static void main(String[] args) {
        System.out.println(containsDuplicate(new int[]{1, 2, 3, 1})); // true
        System.out.println(containsDuplicate(new int[]{1, 2, 3, 4})); // false
    }
}
`,
    python: `def containsDuplicate(nums):
    # your code
    return False


if __name__ == "__main__":
    print(containsDuplicate([1, 2, 3, 1]))  # True
    print(containsDuplicate([1, 2, 3, 4]))  # False
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

bool containsDuplicate(vector<int>& nums) {
    // your code
    return false;
}

int main() {
    cout << boolalpha;
    vector<int> a = {1, 2, 3, 1}, b = {1, 2, 3, 4};
    cout << containsDuplicate(a) << '\\n'; // true
    cout << containsDuplicate(b) << '\\n'; // false
}
`,
  },

  "best-time-stock": {
    java: `import java.util.*;

public class Main {
    static int maxProfit(int[] prices) {
        // your code
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(maxProfit(new int[]{7, 1, 5, 3, 6, 4})); // 5
        System.out.println(maxProfit(new int[]{7, 6, 4, 3, 1}));    // 0
    }
}
`,
    python: `def maxProfit(prices):
    # your code
    return 0


if __name__ == "__main__":
    print(maxProfit([7, 1, 5, 3, 6, 4]))  # 5
    print(maxProfit([7, 6, 4, 3, 1]))     # 0
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int maxProfit(vector<int>& prices) {
    // your code
    return 0;
}

int main() {
    vector<int> a = {7, 1, 5, 3, 6, 4}, b = {7, 6, 4, 3, 1};
    cout << maxProfit(a) << '\\n'; // 5
    cout << maxProfit(b) << '\\n'; // 0
}
`,
  },

  "max-subarray": {
    java: `import java.util.*;

public class Main {
    static int maxSubArray(int[] nums) {
        // your code
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(maxSubArray(new int[]{-2, 1, -3, 4, -1, 2, 1, -5, 4})); // 6
        System.out.println(maxSubArray(new int[]{5, 4, -1, 7, 8}));                // 23
    }
}
`,
    python: `def maxSubArray(nums):
    # your code
    return 0


if __name__ == "__main__":
    print(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]))  # 6
    print(maxSubArray([5, 4, -1, 7, 8]))                 # 23
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int maxSubArray(vector<int>& nums) {
    // your code
    return 0;
}

int main() {
    vector<int> a = {-2, 1, -3, 4, -1, 2, 1, -5, 4}, b = {5, 4, -1, 7, 8};
    cout << maxSubArray(a) << '\\n'; // 6
    cout << maxSubArray(b) << '\\n'; // 23
}
`,
  },

  "valid-parentheses": {
    java: `import java.util.*;

public class Main {
    static boolean isValid(String s) {
        // your code
        return false;
    }

    public static void main(String[] args) {
        System.out.println(isValid("()[]{}")); // true
        System.out.println(isValid("(]"));     // false
        System.out.println(isValid("([)]"));   // false
    }
}
`,
    python: `def isValid(s):
    # your code
    return False


if __name__ == "__main__":
    print(isValid("()[]{}"))  # True
    print(isValid("(]"))      # False
    print(isValid("([)]"))    # False
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

bool isValid(string s) {
    // your code
    return false;
}

int main() {
    cout << boolalpha;
    cout << isValid("()[]{}") << '\\n'; // true
    cout << isValid("(]") << '\\n';     // false
    cout << isValid("([)]") << '\\n';   // false
}
`,
  },

  "move-zeroes": {
    java: `import java.util.*;

public class Main {
    static int[] moveZeroes(int[] nums) {
        // modify nums in place, then return it
        return nums;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(moveZeroes(new int[]{0, 1, 0, 3, 12}))); // [1, 3, 12, 0, 0]
        System.out.println(Arrays.toString(moveZeroes(new int[]{0})));              // [0]
    }
}
`,
    python: `def moveZeroes(nums):
    # modify nums in place, then return it
    return nums


if __name__ == "__main__":
    print(moveZeroes([0, 1, 0, 3, 12]))  # [1, 3, 12, 0, 0]
    print(moveZeroes([0]))               # [0]
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

vector<int> moveZeroes(vector<int>& nums) {
    // modify nums in place, then return it
    return nums;
}

int main() {
    vector<int> a = {0, 1, 0, 3, 12};
    for (int x : moveZeroes(a)) cout << x << ' ';  // 1 3 12 0 0
    cout << '\\n';
}
`,
  },

  "longest-substring": {
    java: `import java.util.*;

public class Main {
    static int lengthOfLongestSubstring(String s) {
        // your code
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(lengthOfLongestSubstring("abcabcbb")); // 3
        System.out.println(lengthOfLongestSubstring("bbbbb"));    // 1
        System.out.println(lengthOfLongestSubstring("pwwkew"));   // 3
    }
}
`,
    python: `def lengthOfLongestSubstring(s):
    # your code
    return 0


if __name__ == "__main__":
    print(lengthOfLongestSubstring("abcabcbb"))  # 3
    print(lengthOfLongestSubstring("bbbbb"))     # 1
    print(lengthOfLongestSubstring("pwwkew"))    # 3
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int lengthOfLongestSubstring(string s) {
    // your code
    return 0;
}

int main() {
    cout << lengthOfLongestSubstring("abcabcbb") << '\\n'; // 3
    cout << lengthOfLongestSubstring("bbbbb") << '\\n';    // 1
    cout << lengthOfLongestSubstring("pwwkew") << '\\n';   // 3
}
`,
  },

  "product-except-self": {
    java: `import java.util.*;

public class Main {
    static int[] productExceptSelf(int[] nums) {
        // your code
        return new int[]{};
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(productExceptSelf(new int[]{1, 2, 3, 4})));       // [24, 12, 8, 6]
        System.out.println(Arrays.toString(productExceptSelf(new int[]{-1, 1, 0, -3, 3}))); // [0, 0, 9, 0, 0]
    }
}
`,
    python: `def productExceptSelf(nums):
    # your code
    return []


if __name__ == "__main__":
    print(productExceptSelf([1, 2, 3, 4]))        # [24, 12, 8, 6]
    print(productExceptSelf([-1, 1, 0, -3, 3]))   # [0, 0, 9, 0, 0]
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

vector<int> productExceptSelf(vector<int>& nums) {
    // your code
    return {};
}

int main() {
    vector<int> a = {1, 2, 3, 4};
    for (int x : productExceptSelf(a)) cout << x << ' ';  // 24 12 8 6
    cout << '\\n';
}
`,
  },

  "top-k-frequent": {
    java: `import java.util.*;

public class Main {
    static int[] topKFrequent(int[] nums, int k) {
        // your code (order of the answer doesn't matter)
        return new int[]{};
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(topKFrequent(new int[]{1, 1, 1, 2, 2, 3}, 2))); // [1, 2] (any order)
        System.out.println(Arrays.toString(topKFrequent(new int[]{1}, 1)));                // [1]
    }
}
`,
    python: `def topKFrequent(nums, k):
    # your code (order of the answer doesn't matter)
    return []


if __name__ == "__main__":
    print(topKFrequent([1, 1, 1, 2, 2, 3], 2))  # [1, 2] (any order)
    print(topKFrequent([1], 1))                 # [1]
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

vector<int> topKFrequent(vector<int>& nums, int k) {
    // your code (order of the answer doesn't matter)
    return {};
}

int main() {
    vector<int> a = {1, 1, 1, 2, 2, 3};
    for (int x : topKFrequent(a, 2)) cout << x << ' ';  // 1 2 (any order)
    cout << '\\n';
}
`,
  },

  "binary-search": {
    java: `import java.util.*;

public class Main {
    static int search(int[] nums, int target) {
        // your code — O(log n)
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(search(new int[]{-1, 0, 3, 5, 9, 12}, 9)); // 4
        System.out.println(search(new int[]{-1, 0, 3, 5, 9, 12}, 2)); // -1
    }
}
`,
    python: `def search(nums, target):
    # your code — O(log n)
    return -1


if __name__ == "__main__":
    print(search([-1, 0, 3, 5, 9, 12], 9))  # 4
    print(search([-1, 0, 3, 5, 9, 12], 2))  # -1
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int search(vector<int>& nums, int target) {
    // your code — O(log n)
    return -1;
}

int main() {
    vector<int> a = {-1, 0, 3, 5, 9, 12};
    cout << search(a, 9) << '\\n'; // 4
    cout << search(a, 2) << '\\n'; // -1
}
`,
  },

  "search-rotated": {
    java: `import java.util.*;

public class Main {
    static int search(int[] nums, int target) {
        // rotated sorted array — O(log n)
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(search(new int[]{4, 5, 6, 7, 0, 1, 2}, 0)); // 4
        System.out.println(search(new int[]{4, 5, 6, 7, 0, 1, 2}, 3)); // -1
    }
}
`,
    python: `def search(nums, target):
    # rotated sorted array — O(log n)
    return -1


if __name__ == "__main__":
    print(search([4, 5, 6, 7, 0, 1, 2], 0))  # 4
    print(search([4, 5, 6, 7, 0, 1, 2], 3))  # -1
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int search(vector<int>& nums, int target) {
    // rotated sorted array — O(log n)
    return -1;
}

int main() {
    vector<int> a = {4, 5, 6, 7, 0, 1, 2};
    cout << search(a, 0) << '\\n'; // 4
    cout << search(a, 3) << '\\n'; // -1
}
`,
  },

  "climbing-stairs": {
    java: `import java.util.*;

public class Main {
    static int climbStairs(int n) {
        // your code
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(climbStairs(2)); // 2
        System.out.println(climbStairs(3)); // 3
        System.out.println(climbStairs(5)); // 8
    }
}
`,
    python: `def climbStairs(n):
    # your code
    return 0


if __name__ == "__main__":
    print(climbStairs(2))  # 2
    print(climbStairs(3))  # 3
    print(climbStairs(5))  # 8
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int climbStairs(int n) {
    // your code
    return 0;
}

int main() {
    cout << climbStairs(2) << '\\n'; // 2
    cout << climbStairs(3) << '\\n'; // 3
    cout << climbStairs(5) << '\\n'; // 8
}
`,
  },

  "coin-change": {
    java: `import java.util.*;

public class Main {
    static int coinChange(int[] coins, int amount) {
        // fewest coins to make amount, or -1
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(coinChange(new int[]{1, 2, 5}, 11)); // 3
        System.out.println(coinChange(new int[]{2}, 3));        // -1
    }
}
`,
    python: `def coinChange(coins, amount):
    # fewest coins to make amount, or -1
    return -1


if __name__ == "__main__":
    print(coinChange([1, 2, 5], 11))  # 3
    print(coinChange([2], 3))         # -1
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int coinChange(vector<int>& coins, int amount) {
    // fewest coins to make amount, or -1
    return -1;
}

int main() {
    vector<int> a = {1, 2, 5}, b = {2};
    cout << coinChange(a, 11) << '\\n'; // 3
    cout << coinChange(b, 3) << '\\n';  // -1
}
`,
  },

  "house-robber": {
    java: `import java.util.*;

public class Main {
    static int rob(int[] nums) {
        // your code
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(rob(new int[]{1, 2, 3, 1}));    // 4
        System.out.println(rob(new int[]{2, 7, 9, 3, 1})); // 12
    }
}
`,
    python: `def rob(nums):
    # your code
    return 0


if __name__ == "__main__":
    print(rob([1, 2, 3, 1]))     # 4
    print(rob([2, 7, 9, 3, 1]))  # 12
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int rob(vector<int>& nums) {
    // your code
    return 0;
}

int main() {
    vector<int> a = {1, 2, 3, 1}, b = {2, 7, 9, 3, 1};
    cout << rob(a) << '\\n'; // 4
    cout << rob(b) << '\\n'; // 12
}
`,
  },

  "num-islands": {
    java: `import java.util.*;

public class Main {
    static int numIslands(char[][] grid) {
        // your code (you may mutate grid)
        return 0;
    }

    public static void main(String[] args) {
        char[][] g = {
            {'1', '1', '0'},
            {'1', '0', '0'},
            {'0', '0', '1'},
        };
        System.out.println(numIslands(g)); // 2
    }
}
`,
    python: `def numIslands(grid):
    # your code (you may mutate grid)
    return 0


if __name__ == "__main__":
    g = [
        ["1", "1", "0"],
        ["1", "0", "0"],
        ["0", "0", "1"],
    ]
    print(numIslands(g))  # 2
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int numIslands(vector<vector<char>>& grid) {
    // your code (you may mutate grid)
    return 0;
}

int main() {
    vector<vector<char>> g = {
        {'1', '1', '0'},
        {'1', '0', '0'},
        {'0', '0', '1'},
    };
    cout << numIslands(g) << '\\n'; // 2
}
`,
  },

  "valid-palindrome": {
    java: `import java.util.*;

public class Main {
    static boolean isPalindrome(String s) {
        // alphanumeric only, case-insensitive
        return false;
    }

    public static void main(String[] args) {
        System.out.println(isPalindrome("A man, a plan, a canal: Panama")); // true
        System.out.println(isPalindrome("race a car"));                     // false
    }
}
`,
    python: `def isPalindrome(s):
    # alphanumeric only, case-insensitive
    return False


if __name__ == "__main__":
    print(isPalindrome("A man, a plan, a canal: Panama"))  # True
    print(isPalindrome("race a car"))                      # False
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

bool isPalindrome(string s) {
    // alphanumeric only, case-insensitive
    return false;
}

int main() {
    cout << boolalpha;
    cout << isPalindrome("A man, a plan, a canal: Panama") << '\\n'; // true
    cout << isPalindrome("race a car") << '\\n';                     // false
}
`,
  },

  "three-sum": {
    java: `import java.util.*;

public class Main {
    static List<List<Integer>> threeSum(int[] nums) {
        // unique triplets summing to 0
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        System.out.println(threeSum(new int[]{-1, 0, 1, 2, -1, -4})); // [[-1, -1, 2], [-1, 0, 1]]
        System.out.println(threeSum(new int[]{0, 1, 1}));             // []
    }
}
`,
    python: `def threeSum(nums):
    # unique triplets summing to 0
    return []


if __name__ == "__main__":
    print(threeSum([-1, 0, 1, 2, -1, -4]))  # [[-1, -1, 2], [-1, 0, 1]]
    print(threeSum([0, 1, 1]))              # []
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> threeSum(vector<int>& nums) {
    // unique triplets summing to 0
    return {};
}

int main() {
    vector<int> a = {-1, 0, 1, 2, -1, -4};
    for (auto& t : threeSum(a)) {
        cout << '[';
        for (int x : t) cout << x << ' ';
        cout << "] ";
    }
    cout << '\\n'; // [-1 -1 2 ] [-1 0 1 ]
}
`,
  },

  "merge-intervals": {
    java: `import java.util.*;

public class Main {
    static int[][] merge(int[][] intervals) {
        // merge overlapping intervals, sorted by start
        return new int[][]{};
    }

    public static void main(String[] args) {
        int[][] a = {{1, 3}, {2, 6}, {8, 10}, {15, 18}};
        System.out.println(Arrays.deepToString(merge(a))); // [[1, 6], [8, 10], [15, 18]]
    }
}
`,
    python: `def merge(intervals):
    # merge overlapping intervals, sorted by start
    return []


if __name__ == "__main__":
    print(merge([[1, 3], [2, 6], [8, 10], [15, 18]]))  # [[1, 6], [8, 10], [15, 18]]
    print(merge([[1, 4], [4, 5]]))                     # [[1, 5]]
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> merge(vector<vector<int>>& intervals) {
    // merge overlapping intervals, sorted by start
    return {};
}

int main() {
    vector<vector<int>> a = {{1, 3}, {2, 6}, {8, 10}, {15, 18}};
    for (auto& iv : merge(a)) cout << '[' << iv[0] << ',' << iv[1] << "] ";
    cout << '\\n'; // [1,6] [8,10] [15,18]
}
`,
  },

  "lcs": {
    java: `import java.util.*;

public class Main {
    static int longestCommonSubsequence(String text1, String text2) {
        // your code
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(longestCommonSubsequence("abcde", "ace")); // 3
        System.out.println(longestCommonSubsequence("abc", "def"));   // 0
    }
}
`,
    python: `def longestCommonSubsequence(text1, text2):
    # your code
    return 0


if __name__ == "__main__":
    print(longestCommonSubsequence("abcde", "ace"))  # 3
    print(longestCommonSubsequence("abc", "def"))    # 0
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int longestCommonSubsequence(string text1, string text2) {
    // your code
    return 0;
}

int main() {
    cout << longestCommonSubsequence("abcde", "ace") << '\\n'; // 3
    cout << longestCommonSubsequence("abc", "def") << '\\n';   // 0
}
`,
  },
};
