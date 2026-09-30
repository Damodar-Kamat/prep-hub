/* DSA practice — batch 4: graphs, trees, linked lists (big-tech frequent).
   Trees are given as level-order arrays with null for missing nodes (LeetCode format);
   linked lists as plain arrays. Starters include tiny build helpers. */
(function () {
  const TREE_JS = `// helper: level-order array (with nulls) -> TreeNode
function TreeNode(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
function buildTree(a) {
  if (!a.length || a[0] === null) return null;
  const root = new TreeNode(a[0]), q = [root];
  for (let i = 1, h = 0; i < a.length; h++) {
    const node = q[h];
    if (a[i] !== null && a[i] !== undefined) { node.left = new TreeNode(a[i]); q.push(node.left); } i++;
    if (i < a.length && a[i] !== null && a[i] !== undefined) { node.right = new TreeNode(a[i]); q.push(node.right); } i++;
  }
  return root;
}
`;
  const LIST_JS = `// helpers: array <-> linked list
function ListNode(val, next = null) { this.val = val; this.next = next; }
function toList(a) { let head = null; for (let i = a.length - 1; i >= 0; i--) head = new ListNode(a[i], head); return head; }
function toArray(h) { const out = []; while (h) { out.push(h.val); h = h.next; } return out; }
`;
  const TREE_JAVA = `    static class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }
    static TreeNode build(Integer[] a) {
        if (a.length == 0 || a[0] == null) return null;
        TreeNode root = new TreeNode(a[0]);
        java.util.Deque<TreeNode> q = new java.util.ArrayDeque<>(); q.add(root);
        for (int i = 1; i < a.length; ) {
            TreeNode n = q.poll();
            if (a[i] != null) { n.left = new TreeNode(a[i]); q.add(n.left); } i++;
            if (i < a.length && a[i] != null) { n.right = new TreeNode(a[i]); q.add(n.right); } i++;
        }
        return root;
    }
`;
  const TREE_PY = `class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def build(a):
    if not a or a[0] is None: return None
    from collections import deque
    root = TreeNode(a[0]); q = deque([root]); i = 1
    while i < len(a):
        n = q.popleft()
        if a[i] is not None: n.left = TreeNode(a[i]); q.append(n.left)
        i += 1
        if i < len(a) and a[i] is not None: n.right = TreeNode(a[i]); q.append(n.right)
        i += 1
    return root
`;
  const LIST_JAVA = `    static class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }
    static ListNode toList(int... a) { ListNode d = new ListNode(0), t = d; for (int x : a) { t.next = new ListNode(x); t = t.next; } return d.next; }
    static String str(ListNode h) { StringBuilder sb = new StringBuilder("["); for (; h != null; h = h.next) sb.append(h.val).append(h.next != null ? ", " : ""); return sb.append("]").toString(); }
`;
  const LIST_PY = `class ListNode:
    def __init__(self, val, next=None):
        self.val, self.next = val, next

def to_list(a):
    head = None
    for v in reversed(a): head = ListNode(v, head)
    return head

def to_array(h):
    out = []
    while h: out.append(h.val); h = h.next
    return out
`;

  window.__addProblems([
    // ---------------------------------------------------------------- Graphs
    {
      id: "course-schedule", title: "Course Schedule (can you finish?)", difficulty: "Medium", lc: "course-schedule",
      tags: ["Graph", "Topological Sort", "BFS"], companies: ["Amazon", "Meta", "Google", "Microsoft", "Uber"], pattern: "Cycle detection via Kahn's topological sort",
      relatedTopic: "/topic/dsa/dsa-graphs?m=deep",
      statement: `<p><code>numCourses</code> courses, <code>prerequisites[i] = [a, b]</code> means take b before a. Return true if all courses can be finished.</p>`,
      examples: [{ in: "numCourses = 2, prerequisites = [[1,0]]", out: "true" }, { in: "numCourses = 2, prerequisites = [[1,0],[0,1]]", out: "false" }],
      constraints: ["1 <= numCourses <= 2000", "0 <= prerequisites.length <= 5000"],
      concept: `<p>Courses are nodes, prerequisites are directed edges b → a. All courses can be finished iff the graph has <b>no cycle</b>. Kahn's algorithm: repeatedly take nodes with in-degree 0; if you process all n nodes there's no cycle. (DFS with 3 colors also works.)</p>`,
      stuck: ["Model it: what are the nodes and edges? (courses; edge b → a)", "When is it impossible? When prerequisites form a cycle.", "Kahn: compute in-degrees, queue all 0-in-degree nodes, pop and decrement neighbours.", "Count processed nodes; compare with numCourses."],
      complexity: "O(V + E) time and space",
      fnName: "canFinish",
      starter: "function canFinish(numCourses, prerequisites) {\n  \n}\n",
      tests: [[[2, [[1, 0]]], true], [[2, [[1, 0], [0, 1]]], false], [[1, []], true], [[4, [[1, 0], [2, 1], [3, 2]]], true, true], [[3, [[0, 1], [1, 2], [2, 0]]], false, true], [[5, [[1, 4], [2, 4], [3, 1], [3, 2]]], true, true]],
      hints: ["Build adjacency list and in-degree array.", "BFS from all in-degree-0 nodes.", "processed === numCourses ⇔ no cycle."],
      explain: "Kahn's algorithm.",
      code: `function canFinish(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []), indeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) { adj[b].push(a); indeg[a]++; }
  const q = []; for (let i = 0; i < numCourses; i++) if (!indeg[i]) q.push(i);
  let done = 0;
  for (let h = 0; h < q.length; h++) { done++; for (const v of adj[q[h]]) if (--indeg[v] === 0) q.push(v); }
  return done === numCourses;
}`,
      java: `import java.util.*;

class Main {
    static boolean canFinish(int numCourses, int[][] prerequisites) {
        // your code: adjacency list + in-degree + BFS queue
        return false;
    }

    public static void main(String[] args) {
        System.out.println(canFinish(2, new int[][]{{1,0}}));        // true
        System.out.println(canFinish(2, new int[][]{{1,0},{0,1}}));  // false
    }
}
`,
      python: `from collections import deque

def canFinish(numCourses, prerequisites):
    # your code
    return False


if __name__ == "__main__":
    print(canFinish(2, [[1,0]]))        # True
    print(canFinish(2, [[1,0],[0,1]]))  # False
`,
    },
    {
      id: "course-schedule-ii", title: "Course Schedule II (return an order)", difficulty: "Medium", lc: "course-schedule-ii",
      tags: ["Graph", "Topological Sort"], companies: ["Amazon", "Meta", "Google", "Microsoft", "Airbnb"], pattern: "Topological order (Kahn)",
      relatedTopic: "/topic/dsa/dsa-graphs?m=deep",
      statement: `<p>Same input as Course Schedule; return a valid order to take all courses, or <code>[]</code> if impossible. When several courses are available, take the <b>smallest number first</b> (makes the answer unique for this app).</p>`,
      examples: [{ in: "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]", out: "[0,1,2,3]" }],
      constraints: ["1 <= numCourses <= 2000"],
      concept: `<p>Kahn's algorithm outputs a topological order as it pops nodes. Using a min-heap (or sorted queue) instead of a FIFO queue gives the lexicographically smallest order.</p>`,
      stuck: ["Solve Course Schedule first — the processing order of Kahn's algorithm is the answer.", "Record each popped node.", "For 'smallest first', always pick the smallest available node (min-heap).", "Return [] if you couldn't process every node."],
      complexity: "O((V + E) log V) with a heap; O(V + E) with a plain queue",
      fnName: "findOrder",
      starter: "function findOrder(numCourses, prerequisites) {\n  \n}\n",
      tests: [[[4, [[1, 0], [2, 0], [3, 1], [3, 2]]], [0, 1, 2, 3]], [[2, [[1, 0]]], [0, 1]], [[2, [[0, 1], [1, 0]]], []], [[3, []], [0, 1, 2], true], [[4, [[0, 3], [1, 3], [2, 0], [2, 1]]], [3, 0, 1, 2], true]],
      hints: ["Kahn's algorithm.", "Keep available nodes sorted.", "Empty array on cycle."],
      explain: "Kahn's algorithm with a sorted frontier.",
      code: `function findOrder(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []), indeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) { adj[b].push(a); indeg[a]++; }
  const avail = []; for (let i = 0; i < numCourses; i++) if (!indeg[i]) avail.push(i);
  const order = [];
  while (avail.length) {
    avail.sort((x, y) => x - y);
    const u = avail.shift(); order.push(u);
    for (const v of adj[u]) if (--indeg[v] === 0) avail.push(v);
  }
  return order.length === numCourses ? order : [];
}`,
      java: `import java.util.*;

class Main {
    static int[] findOrder(int numCourses, int[][] prerequisites) {
        // your code: Kahn's algorithm with PriorityQueue<Integer> for smallest-first
        return new int[0];
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(findOrder(4, new int[][]{{1,0},{2,0},{3,1},{3,2}}))); // [0, 1, 2, 3]
    }
}
`,
      python: `import heapq

def findOrder(numCourses, prerequisites):
    # your code
    return []


if __name__ == "__main__":
    print(findOrder(4, [[1,0],[2,0],[3,1],[3,2]]))  # [0, 1, 2, 3]
`,
    },
    {
      id: "rotting-oranges", title: "Rotting Oranges", difficulty: "Medium", lc: "rotting-oranges",
      tags: ["Graph", "BFS", "Matrix"], companies: ["Amazon", "Microsoft", "Google", "Meta"], pattern: "Multi-source BFS by levels",
      relatedTopic: "/topic/dsa/dsa-graphs?m=deep",
      statement: `<p>Grid cells: 0 empty, 1 fresh, 2 rotten. Each minute, fresh oranges adjacent (4-directionally) to rotten ones rot. Return minutes until none are fresh, or −1 if impossible.</p>`,
      examples: [{ in: "grid = [[2,1,1],[1,1,0],[0,1,1]]", out: "4" }, { in: "grid = [[2,1,1],[0,1,1],[1,0,1]]", out: "-1" }],
      constraints: ["1 <= m, n <= 10"],
      concept: `<p>All rotten oranges spread simultaneously → start BFS from <b>all</b> of them at once (multi-source). Each BFS level is one minute. Count fresh oranges; if any remain after BFS, return −1.</p>`,
      stuck: ["Rot spreads in 'waves' — which traversal processes things in waves? (BFS by levels)", "Where does BFS start? From every rotten orange simultaneously.", "Track the number of fresh oranges; decrement as they rot.", "Minutes = number of levels processed after the start (careful with off-by-one)."],
      complexity: "O(m·n) time and space",
      fnName: "orangesRotting",
      starter: "function orangesRotting(grid) {\n  \n}\n",
      tests: [[[[[2, 1, 1], [1, 1, 0], [0, 1, 1]]], 4], [[[[2, 1, 1], [0, 1, 1], [1, 0, 1]]], -1], [[[[0, 2]]], 0], [[[[0]]], 0, true], [[[[1]]], -1, true], [[[[2, 2], [1, 1], [0, 0], [2, 0]]], 1, true]],
      hints: ["Queue all rotten cells first.", "Process level by level; minutes++ per level that rots something.", "Return −1 if fresh > 0 at the end."],
      explain: "Multi-source BFS.",
      code: `function orangesRotting(grid) {
  const m = grid.length, n = grid[0].length;
  let q = [], fresh = 0, minutes = 0;
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) { if (grid[i][j] === 2) q.push([i, j]); else if (grid[i][j] === 1) fresh++; }
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (q.length && fresh) {
    const next = [];
    for (const [i, j] of q) for (const [di, dj] of dirs) {
      const a = i + di, b = j + dj;
      if (a >= 0 && b >= 0 && a < m && b < n && grid[a][b] === 1) { grid[a][b] = 2; fresh--; next.push([a, b]); }
    }
    q = next; minutes++;
  }
  return fresh ? -1 : minutes;
}`,
      java: `import java.util.*;

class Main {
    static int orangesRotting(int[][] grid) {
        // your code: multi-source BFS with ArrayDeque<int[]>
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(orangesRotting(new int[][]{{2,1,1},{1,1,0},{0,1,1}})); // 4
    }
}
`,
      python: `from collections import deque

def orangesRotting(grid):
    # your code
    return 0


if __name__ == "__main__":
    print(orangesRotting([[2,1,1],[1,1,0],[0,1,1]]))  # 4
`,
    },
    {
      id: "word-ladder", title: "Word Ladder", difficulty: "Hard", lc: "word-ladder",
      tags: ["Graph", "BFS", "String"], companies: ["Amazon", "Meta", "Google", "LinkedIn", "Microsoft"], pattern: "BFS over implicit graph (wildcard buckets)",
      relatedTopic: "/topic/dsa/dsa-graphs?m=deep",
      statement: `<p>Transform <code>beginWord</code> into <code>endWord</code> changing one letter at a time; every intermediate word must be in <code>wordList</code>. Return the number of words in the shortest sequence, or 0.</p>`,
      examples: [{ in: 'begin = "hit", end = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', out: "5", explain: "hit → hot → dot → dog → cog" }],
      constraints: ["1 <= wordList.length <= 5000", "words length <= 10"],
      concept: `<p>Shortest path in an unweighted graph where words differ by one letter ⇒ BFS. Build neighbours efficiently with wildcard patterns: "hot" belongs to buckets "*ot", "h*t", "ho*". Words sharing a bucket are neighbours.</p>`,
      stuck: ["'Shortest sequence' + 'each step is one move' → which algorithm? (BFS)", "What are the nodes and edges? (words; edge if they differ by one letter)", "Comparing all pairs is O(N²·L). Generate neighbours instead: try every position × 26 letters, or group by wildcard patterns.", "Mark words visited when enqueued; return level when you reach endWord."],
      complexity: "O(N · L²) time with wildcard buckets, O(N · L) space",
      fnName: "ladderLength",
      starter: "function ladderLength(beginWord, endWord, wordList) {\n  \n}\n",
      tests: [[["hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]], 5], [["hit", "cog", ["hot", "dot", "dog", "lot", "log"]], 0], [["a", "c", ["a", "b", "c"]], 2], [["hot", "dog", ["hot", "dog"]], 0, true], [["lost", "cost", ["most", "fist", "lost", "cost", "fish"]], 2, true], [["red", "tax", ["ted", "tex", "red", "tax", "tad", "den", "rex", "pee"]], 4, true]],
      hints: ["BFS from beginWord.", "Neighbour generation via wildcard buckets.", "Count levels (words), not edges."],
      explain: "BFS with wildcard buckets.",
      code: `function ladderLength(beginWord, endWord, wordList) {
  const words = new Set(wordList);
  if (!words.has(endWord)) return 0;
  const buckets = new Map();
  for (const w of [...words, beginWord]) for (let i = 0; i < w.length; i++) {
    const k = w.slice(0, i) + "*" + w.slice(i + 1);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(w);
  }
  const seen = new Set([beginWord]);
  let q = [beginWord], level = 1;
  while (q.length) {
    const next = [];
    for (const w of q) {
      if (w === endWord) return level;
      for (let i = 0; i < w.length; i++) {
        const k = w.slice(0, i) + "*" + w.slice(i + 1);
        for (const v of buckets.get(k) || []) if (!seen.has(v)) { seen.add(v); next.push(v); }
        buckets.set(k, []);
      }
    }
    q = next; level++;
  }
  return 0;
}`,
      java: `import java.util.*;

class Main {
    static int ladderLength(String begin, String end, List<String> wordList) {
        // your code: BFS; neighbours via wildcard buckets or trying 26 letters per position
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(ladderLength("hit", "cog", List.of("hot","dot","dog","lot","log","cog"))); // 5
    }
}
`,
      python: `from collections import deque, defaultdict

def ladderLength(beginWord, endWord, wordList):
    # your code
    return 0


if __name__ == "__main__":
    print(ladderLength("hit", "cog", ["hot","dot","dog","lot","log","cog"]))  # 5
`,
    },
    {
      id: "network-delay-time", title: "Network Delay Time (Dijkstra)", difficulty: "Medium", lc: "network-delay-time",
      tags: ["Graph", "Shortest Path", "Heap"], companies: ["Google", "Amazon", "Meta", "Microsoft"], pattern: "Dijkstra with a min-heap",
      relatedTopic: "/topic/dsa/dsa-graphs?m=deep",
      statement: `<p><code>times[i] = [u, v, w]</code> is a directed edge with travel time w. A signal starts at node <code>k</code> (nodes 1..n). Return the time for all nodes to receive it, or −1.</p>`,
      examples: [{ in: "times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2", out: "2" }],
      constraints: ["1 <= n <= 100", "weights >= 0"],
      concept: `<p>Single-source shortest paths with non-negative weights ⇒ <b>Dijkstra</b>. The answer is the maximum shortest distance; −1 if some node is unreachable.</p>`,
      stuck: ["Which shortest-path algorithm fits non-negative weights? (Dijkstra)", "Keep dist[]; start with dist[k] = 0; repeatedly settle the unvisited node with the smallest distance.", "A min-heap makes 'smallest distance' O(log n).", "Answer = max(dist) or −1 if any is Infinity."],
      complexity: "O(E log V) time, O(V + E) space",
      fnName: "networkDelayTime",
      starter: "function networkDelayTime(times, n, k) {\n  \n}\n",
      tests: [[[[[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2], 2], [[[[1, 2, 1]], 2, 1], 1], [[[[1, 2, 1]], 2, 2], -1], [[[[1, 2, 1], [2, 3, 2], [1, 3, 4]], 3, 1], 3, true], [[[[1, 2, 1], [2, 1, 3]], 2, 2], 3, true]],
      hints: ["Dijkstra.", "Skip stale heap entries (d > dist[u]).", "Max over distances."],
      explain: "Dijkstra (simple O(V²) selection is fine for n ≤ 100; use a heap in interviews).",
      code: `function networkDelayTime(times, n, k) {
  const adj = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) adj[u].push([v, w]);
  const dist = new Array(n + 1).fill(Infinity), done = new Array(n + 1).fill(false);
  dist[k] = 0;
  for (let it = 0; it < n; it++) {
    let u = -1;
    for (let i = 1; i <= n; i++) if (!done[i] && (u === -1 || dist[i] < dist[u])) u = i;
    if (dist[u] === Infinity) break;
    done[u] = true;
    for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
  }
  const ans = Math.max(...dist.slice(1));
  return ans === Infinity ? -1 : ans;
}`,
      java: `import java.util.*;

class Main {
    static int networkDelayTime(int[][] times, int n, int k) {
        // your code: Dijkstra with PriorityQueue<int[]> {dist, node}
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(networkDelayTime(new int[][]{{2,1,1},{2,3,1},{3,4,1}}, 4, 2)); // 2
    }
}
`,
      python: `import heapq

def networkDelayTime(times, n, k):
    # your code
    return 0


if __name__ == "__main__":
    print(networkDelayTime([[2,1,1],[2,3,1],[3,4,1]], 4, 2))  # 2
`,
    },
    {
      id: "number-of-provinces", title: "Number of Provinces (Union-Find)", difficulty: "Medium", lc: "number-of-provinces",
      tags: ["Graph", "Union Find", "DFS"], companies: ["Amazon", "Meta", "Google", "Microsoft", "Bloomberg"], pattern: "Union-Find (disjoint set union)",
      relatedTopic: "/topic/dsa/dsa-advanced?m=deep",
      statement: `<p>Given an n×n adjacency matrix <code>isConnected</code>, return the number of connected components (provinces).</p>`,
      examples: [{ in: "isConnected = [[1,1,0],[1,1,0],[0,0,1]]", out: "2" }],
      constraints: ["1 <= n <= 200"],
      concept: `<p>Count connected components: DFS/BFS from each unvisited node, or <b>Union-Find</b> — start with n components, union each connected pair, decrementing when two different roots merge. Use path compression + union by rank for near-O(1) operations.</p>`,
      stuck: ["This is 'count connected components'.", "DFS: for each unvisited node, flood-fill its component and count.", "Union-Find: find(x) with path compression; union(a,b) merges roots and decrements the count."],
      complexity: "O(n² α(n)) time, O(n) space",
      fnName: "findCircleNum",
      starter: "function findCircleNum(isConnected) {\n  \n}\n",
      tests: [[[[[1, 1, 0], [1, 1, 0], [0, 0, 1]]], 2], [[[[1, 0, 0], [0, 1, 0], [0, 0, 1]]], 3], [[[[1]]], 1], [[[[1, 0, 0, 1], [0, 1, 1, 0], [0, 1, 1, 1], [1, 0, 1, 1]]], 1, true], [[[[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 1, 1], [0, 0, 1, 1]]], 2, true]],
      hints: ["Components.", "Union-Find with path compression.", "Only iterate j > i."],
      explain: "Union-Find.",
      code: `function findCircleNum(isConnected) {
  const n = isConnected.length, parent = [...Array(n).keys()];
  const find = x => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  let count = n;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++)
    if (isConnected[i][j]) { const a = find(i), b = find(j); if (a !== b) { parent[a] = b; count--; } }
  return count;
}`,
      java: `class Main {
    static int[] parent;
    static int find(int x) { return parent[x] == x ? x : (parent[x] = find(parent[x])); }

    static int findCircleNum(int[][] isConnected) {
        // your code: union-find over the matrix
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(findCircleNum(new int[][]{{1,1,0},{1,1,0},{0,0,1}})); // 2
    }
}
`,
      python: `def findCircleNum(isConnected):
    # your code
    return 0


if __name__ == "__main__":
    print(findCircleNum([[1,1,0],[1,1,0],[0,0,1]]))  # 2
`,
    },
    {
      id: "redundant-connection", title: "Redundant Connection", difficulty: "Medium", lc: "redundant-connection",
      tags: ["Graph", "Union Find"], companies: ["Google", "Amazon", "Meta"], pattern: "Union-Find cycle detection",
      relatedTopic: "/topic/dsa/dsa-advanced?m=deep",
      statement: `<p>A tree with n nodes (1..n) had one extra edge added. Return the edge that can be removed to restore a tree; if several, return the one that appears last in the input.</p>`,
      examples: [{ in: "edges = [[1,2],[1,3],[2,3]]", out: "[2,3]" }],
      constraints: ["3 <= n <= 1000"],
      concept: `<p>Process edges in order with Union-Find. The first edge whose endpoints are already connected closes a cycle — and it's the last edge of that cycle in input order, so it's the answer.</p>`,
      stuck: ["Adding an edge between two already-connected nodes creates a cycle.", "How do you check 'already connected' quickly as edges arrive? (Union-Find)", "Return the first edge that fails to union."],
      complexity: "O(n α(n)) time, O(n) space",
      fnName: "findRedundantConnection",
      starter: "function findRedundantConnection(edges) {\n  \n}\n",
      tests: [[[[[1, 2], [1, 3], [2, 3]]], [2, 3]], [[[[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]], [1, 4]], [[[[1, 4], [3, 4], [1, 3], [1, 2], [4, 5]]], [1, 3], true], [[[[2, 3], [1, 2], [1, 3]]], [1, 3], true]],
      hints: ["Union-Find.", "find(u) === find(v) ⇒ that's the edge.", "Process in input order."],
      explain: "First edge that connects two nodes already in the same set.",
      code: `function findRedundantConnection(edges) {
  const parent = [...Array(edges.length + 1).keys()];
  const find = x => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const [u, v] of edges) {
    const a = find(u), b = find(v);
    if (a === b) return [u, v];
    parent[a] = b;
  }
  return [];
}`,
      java: `import java.util.*;

class Main {
    static int[] findRedundantConnection(int[][] edges) {
        // your code: union-find, return first edge whose ends share a root
        return new int[0];
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(findRedundantConnection(new int[][]{{1,2},{1,3},{2,3}}))); // [2, 3]
    }
}
`,
      python: `def findRedundantConnection(edges):
    # your code
    return []


if __name__ == "__main__":
    print(findRedundantConnection([[1,2],[1,3],[2,3]]))  # [2, 3]
`,
    },
    {
      id: "alien-dictionary", title: "Alien Dictionary", difficulty: "Hard", lc: "alien-dictionary",
      tags: ["Graph", "Topological Sort", "String"], companies: ["Meta", "Airbnb", "Google", "Amazon", "Uber"], pattern: "Build precedence graph from adjacent words, then topo sort",
      relatedTopic: "/topic/dsa/dsa-graphs?m=deep",
      statement: `<p>Words are sorted lexicographically in an alien language. Return a string of its letters in order. If invalid, return "". When several letters are available, pick the alphabetically smallest (unique answer here).</p>`,
      examples: [{ in: 'words = ["wrt","wrf","er","ett","rftt"]', out: '"wertf"' }, { in: 'words = ["z","x","z"]', out: '""' }],
      constraints: ["1 <= words.length <= 100"],
      concept: `<p>Compare each adjacent pair of words: the first differing letter gives an edge a → b. If a word is followed by its own prefix (e.g. "abc" then "ab"), the input is invalid. Then topologically sort all letters that appear; a cycle ⇒ invalid.</p>`,
      stuck: ["Where does ordering information come from? Only from adjacent words.", "For each adjacent pair, find the first position where they differ — that gives one edge. Stop there.", "Edge case: 'abc' before 'ab' is impossible → return ''.", "Topological sort over all letters present; if you can't place all of them there's a cycle."],
      complexity: "O(total characters) time",
      fnName: "alienOrder",
      starter: "function alienOrder(words) {\n  \n}\n",
      tests: [[[["wrt", "wrf", "er", "ett", "rftt"]], "wertf"], [[["z", "x"]], "zx"], [[["z", "x", "z"]], ""], [[["abc", "ab"]], "", true], [[["z", "z"]], "z", true], [[["ab", "adc"]], "abcd", true]],
      hints: ["Edges from first differing letters of adjacent words.", "Prefix check for invalid input.", "Kahn's algorithm over all letters."],
      explain: "Precedence graph + topological sort.",
      code: `function alienOrder(words) {
  const adj = new Map(), indeg = new Map();
  for (const w of words) for (const c of w) { if (!adj.has(c)) adj.set(c, new Set()); if (!indeg.has(c)) indeg.set(c, 0); }
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i], b = words[i + 1];
    if (a.length > b.length && a.startsWith(b)) return "";
    for (let j = 0; j < Math.min(a.length, b.length); j++) {
      if (a[j] !== b[j]) {
        if (!adj.get(a[j]).has(b[j])) { adj.get(a[j]).add(b[j]); indeg.set(b[j], indeg.get(b[j]) + 1); }
        break;
      }
    }
  }
  const avail = [...indeg].filter(([, d]) => d === 0).map(([c]) => c);
  let out = "";
  while (avail.length) {
    avail.sort();
    const c = avail.shift(); out += c;
    for (const v of adj.get(c)) { indeg.set(v, indeg.get(v) - 1); if (indeg.get(v) === 0) avail.push(v); }
  }
  return out.length === indeg.size ? out : "";
}`,
      java: `import java.util.*;

class Main {
    static String alienOrder(String[] words) {
        // your code: edges from adjacent words, then Kahn's algorithm
        return "";
    }

    public static void main(String[] args) {
        System.out.println(alienOrder(new String[]{"wrt","wrf","er","ett","rftt"})); // wertf
    }
}
`,
      python: `def alienOrder(words):
    # your code
    return ""


if __name__ == "__main__":
    print(alienOrder(["wrt","wrf","er","ett","rftt"]))  # wertf
`,
    },
    {
      id: "pacific-atlantic", title: "Pacific Atlantic Water Flow", difficulty: "Medium", lc: "pacific-atlantic-water-flow",
      tags: ["Graph", "DFS", "BFS", "Matrix"], companies: ["Google", "Amazon", "Meta"], pattern: "Reverse flood-fill from both oceans",
      relatedTopic: "/topic/dsa/dsa-graphs?m=deep",
      statement: `<p>Water flows to neighbours with height ≤ current. Pacific touches the top/left edges, Atlantic the bottom/right. Return all cells (sorted) from which water can reach both oceans.</p>`,
      examples: [{ in: "heights = [[1,2],[4,3]]", out: "[[0,1],[1,0],[1,1]]" }],
      constraints: ["1 <= m, n <= 200"],
      concept: `<p>Instead of simulating from every cell, reverse the flow: from each ocean's border cells, DFS/BFS "uphill" (to neighbours with height ≥ current). Cells reached by both searches are the answer.</p>`,
      stuck: ["Simulating from every cell is O((mn)²). Can you start from the oceans instead?", "Reverse the rule: from an ocean, you can 'climb' to neighbours that are at least as high.", "Run two flood fills (Pacific border, Atlantic border); intersect the visited sets."],
      complexity: "O(m·n) time and space",
      fnName: "pacificAtlantic",
      starter: "function pacificAtlantic(heights) {\n  \n}\n",
      tests: [[[[[1, 2], [4, 3]]], [[0, 1], [1, 0], [1, 1]]], [[[[1]]], [[0, 0]]], [[[[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]]], [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]], true]],
      hints: ["Reverse flood-fill from the borders.", "Two visited grids.", "Collect cells in both, row-major order."],
      explain: "Two reverse DFS flood fills.",
      code: `function pacificAtlantic(heights) {
  const m = heights.length, n = heights[0].length;
  const fill = (starts) => {
    const seen = Array.from({ length: m }, () => new Array(n).fill(false)), st = [...starts];
    for (const [i, j] of st) seen[i][j] = true;
    while (st.length) {
      const [i, j] = st.pop();
      for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]])
        if (a >= 0 && b >= 0 && a < m && b < n && !seen[a][b] && heights[a][b] >= heights[i][j]) { seen[a][b] = true; st.push([a, b]); }
    }
    return seen;
  };
  const pac = [], atl = [];
  for (let i = 0; i < m; i++) { pac.push([i, 0]); atl.push([i, n - 1]); }
  for (let j = 0; j < n; j++) { pac.push([0, j]); atl.push([m - 1, j]); }
  const P = fill(pac), A = fill(atl), out = [];
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (P[i][j] && A[i][j]) out.push([i, j]);
  return out;
}`,
      java: `import java.util.*;

class Main {
    static List<List<Integer>> pacificAtlantic(int[][] heights) {
        // your code: DFS from both borders "uphill", intersect
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        System.out.println(pacificAtlantic(new int[][]{{1,2},{4,3}})); // [[0, 1], [1, 0], [1, 1]]
    }
}
`,
      python: `def pacificAtlantic(heights):
    # your code
    return []


if __name__ == "__main__":
    print(pacificAtlantic([[1,2],[4,3]]))  # [[0, 1], [1, 0], [1, 1]]
`,
    },
    // ---------------------------------------------------------------- Trees
    {
      id: "level-order", title: "Binary Tree Level Order Traversal", difficulty: "Medium", lc: "binary-tree-level-order-traversal",
      tags: ["Tree", "BFS"], companies: ["Amazon", "Meta", "Microsoft", "LinkedIn", "Apple"], pattern: "BFS by levels",
      relatedTopic: "/topic/dsa/dsa-trees?m=deep",
      statement: `<p>Return the node values level by level. The tree is given as a level-order array (use <code>buildTree</code> from the starter).</p>`,
      examples: [{ in: "root = [3,9,20,null,null,15,7]", out: "[[3],[9,20],[15,7]]" }],
      constraints: ["0 <= nodes <= 2000"],
      concept: `<p>BFS with a queue; process exactly <code>queue.length</code> nodes per iteration to separate levels.</p>`,
      stuck: ["Which traversal visits nodes level by level? (BFS)", "How do you know where one level ends? Snapshot the queue size at the start of each level.", "Push children while processing the current level."],
      complexity: "O(n) time, O(width) space",
      fnName: "levelOrder",
      starter: `${TREE_JS}
function levelOrder(rootArr) {
  const root = buildTree(rootArr);
  // your code
}
`,
      tests: [[[[3, 9, 20, null, null, 15, 7]], [[3], [9, 20], [15, 7]]], [[[1]], [[1]]], [[[]], []], [[[1, 2, 3, 4, null, null, 5]], [[1], [2, 3], [4, 5]], true], [[[1, null, 2, null, 3]], [[1], [2], [3]], true]],
      hints: ["Queue.", "Loop per level over the current size.", "Empty tree → []."],
      explain: "BFS level by level.",
      code: `${TREE_JS}
function levelOrder(rootArr) {
  const root = buildTree(rootArr), out = [];
  let q = root ? [root] : [];
  while (q.length) {
    out.push(q.map(n => n.val));
    q = [].concat(...q.map(n => [n.left, n.right].filter(Boolean)));
  }
  return out;
}`,
      java: `import java.util.*;

class Main {
${TREE_JAVA}
    static List<List<Integer>> levelOrder(TreeNode root) {
        // your code: BFS with ArrayDeque, one inner loop per level
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        System.out.println(levelOrder(build(new Integer[]{3, 9, 20, null, null, 15, 7}))); // [[3], [9, 20], [15, 7]]
    }
}
`,
      python: `${TREE_PY}
def levelOrder(root):
    # your code
    return []


if __name__ == "__main__":
    print(levelOrder(build([3, 9, 20, None, None, 15, 7])))  # [[3], [9, 20], [15, 7]]
`,
    },
    {
      id: "validate-bst", title: "Validate Binary Search Tree", difficulty: "Medium", lc: "validate-binary-search-tree",
      tags: ["Tree", "DFS", "BST"], companies: ["Amazon", "Meta", "Microsoft", "Bloomberg", "Google"], pattern: "DFS with (low, high) bounds",
      relatedTopic: "/topic/dsa/dsa-trees?m=deep",
      statement: `<p>Return true if the tree is a valid BST: left subtree values < node < right subtree values, recursively (strict).</p>`,
      examples: [{ in: "root = [2,1,3]", out: "true" }, { in: "root = [5,1,4,null,null,3,6]", out: "false" }],
      constraints: ["1 <= nodes <= 10^4"],
      concept: `<p>Checking only parent-child pairs is wrong: a node deep in the left subtree must be less than all ancestors it's left of. Pass down an allowed (low, high) range, or check that an in-order traversal is strictly increasing.</p>`,
      stuck: ["Why is checking node.left.val < node.val < node.right.val not enough? Try [5,4,6,null,null,3,7].", "Each node must fit in a range defined by its ancestors.", "Recurse with (low, high): left child gets (low, node.val), right gets (node.val, high).", "Alternative: in-order traversal must be strictly increasing."],
      complexity: "O(n) time, O(h) space",
      fnName: "isValidBST",
      starter: `${TREE_JS}
function isValidBST(rootArr) {
  const root = buildTree(rootArr);
  // your code
}
`,
      tests: [[[[2, 1, 3]], true], [[[5, 1, 4, null, null, 3, 6]], false], [[[5, 4, 6, null, null, 3, 7]], false], [[[1]], true, true], [[[2, 2, 2]], false, true], [[[10, 5, 15, 3, 7, 12, 20]], true, true]],
      hints: ["Bounds per node.", "Use -Infinity / Infinity initially.", "Strict inequalities."],
      explain: "DFS with bounds.",
      code: `${TREE_JS}
function isValidBST(rootArr) {
  const ok = (n, lo, hi) => !n || (n.val > lo && n.val < hi && ok(n.left, lo, n.val) && ok(n.right, n.val, hi));
  return ok(buildTree(rootArr), -Infinity, Infinity);
}`,
      java: `class Main {
${TREE_JAVA}
    static boolean isValidBST(TreeNode root) {
        // your code: helper(node, Long low, Long high)
        return false;
    }

    public static void main(String[] args) {
        System.out.println(isValidBST(build(new Integer[]{2, 1, 3})));                    // true
        System.out.println(isValidBST(build(new Integer[]{5, 1, 4, null, null, 3, 6})));  // false
    }
}
`,
      python: `${TREE_PY}
def isValidBST(root):
    # your code
    return False


if __name__ == "__main__":
    print(isValidBST(build([2, 1, 3])))  # True
`,
    },
    {
      id: "lca-binary-tree", title: "Lowest Common Ancestor of a Binary Tree", difficulty: "Medium", lc: "lowest-common-ancestor-of-a-binary-tree",
      tags: ["Tree", "DFS"], companies: ["Meta", "Amazon", "Microsoft", "Google", "LinkedIn"], pattern: "Post-order DFS returning found nodes",
      relatedTopic: "/topic/dsa/dsa-trees?m=deep",
      statement: `<p>Given a binary tree (unique values) and two values p and q present in it, return the value of their lowest common ancestor.</p>`,
      examples: [{ in: "root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1", out: "3" }, { in: "same tree, p = 5, q = 4", out: "5" }],
      constraints: ["2 <= nodes <= 10^5"],
      concept: `<p>Recursive search returns the node if it's p or q, otherwise what its subtrees return. If both subtrees return non-null, the current node is the LCA; otherwise pass up the non-null one.</p>`,
      stuck: ["What does 'lowest common ancestor' mean in terms of where p and q sit relative to a node?", "If p is in the left subtree and q in the right, the current node is the LCA.", "Write dfs(node): return node if node is p/q or null; combine left and right results."],
      complexity: "O(n) time, O(h) space",
      fnName: "lowestCommonAncestor",
      starter: `${TREE_JS}
function lowestCommonAncestor(rootArr, p, q) {
  const root = buildTree(rootArr);
  // return the LCA's value
}
`,
      tests: [[[[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 1], 3], [[[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 4], 5], [[[1, 2], 1, 2], 1], [[[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 7, 8], 3, true], [[[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 6, 4], 5, true]],
      hints: ["Post-order recursion.", "Both sides non-null ⇒ current node.", "Return the value, not the node, in this harness."],
      explain: "Classic recursive LCA.",
      code: `${TREE_JS}
function lowestCommonAncestor(rootArr, p, q) {
  const dfs = n => {
    if (!n || n.val === p || n.val === q) return n;
    const l = dfs(n.left), r = dfs(n.right);
    return l && r ? n : l || r;
  };
  return dfs(buildTree(rootArr)).val;
}`,
      java: `class Main {
${TREE_JAVA}
    static TreeNode lca(TreeNode root, int p, int q) {
        // your code
        return null;
    }

    public static void main(String[] args) {
        TreeNode root = build(new Integer[]{3, 5, 1, 6, 2, 0, 8, null, null, 7, 4});
        System.out.println(lca(root, 5, 1).val); // 3
        System.out.println(lca(root, 5, 4).val); // 5
    }
}
`,
      python: `${TREE_PY}
def lowestCommonAncestor(root, p, q):
    # your code: return the node
    return None


if __name__ == "__main__":
    r = build([3, 5, 1, 6, 2, 0, 8, None, None, 7, 4])
    print(lowestCommonAncestor(r, 5, 1).val)  # 3
`,
    },
    {
      id: "right-side-view", title: "Binary Tree Right Side View", difficulty: "Medium", lc: "binary-tree-right-side-view",
      tags: ["Tree", "BFS", "DFS"], companies: ["Meta", "Amazon", "Microsoft", "Bloomberg"], pattern: "BFS, take the last node per level",
      relatedTopic: "/topic/dsa/dsa-trees?m=deep",
      statement: `<p>Return the values visible when looking at the tree from the right side, top to bottom.</p>`,
      examples: [{ in: "root = [1,2,3,null,5,null,4]", out: "[1,3,4]" }],
      constraints: ["0 <= nodes <= 100"],
      concept: `<p>The visible node at each depth is the last node of that level in BFS order (or the first visited by a right-first DFS).</p>`,
      stuck: ["Which node is visible at depth d? The rightmost one at that depth.", "Level-order traversal gives you each level — take its last element.", "Note: a left node can be visible if the right side is shorter."],
      complexity: "O(n) time, O(width) space",
      fnName: "rightSideView",
      starter: `${TREE_JS}
function rightSideView(rootArr) {
  const root = buildTree(rootArr);
  // your code
}
`,
      tests: [[[[1, 2, 3, null, 5, null, 4]], [1, 3, 4]], [[[1, null, 3]], [1, 3]], [[[]], []], [[[1, 2, 3, 4]], [1, 3, 4], true], [[[1, 2, null, 3]], [1, 2, 3], true]],
      hints: ["BFS per level.", "Last node of each level.", "Or DFS right-first recording the first node per depth."],
      explain: "Last value of each BFS level.",
      code: `${TREE_JS}
function rightSideView(rootArr) {
  const root = buildTree(rootArr), out = [];
  let q = root ? [root] : [];
  while (q.length) { out.push(q[q.length - 1].val); q = [].concat(...q.map(n => [n.left, n.right].filter(Boolean))); }
  return out;
}`,
      java: `import java.util.*;

class Main {
${TREE_JAVA}
    static List<Integer> rightSideView(TreeNode root) {
        // your code
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        System.out.println(rightSideView(build(new Integer[]{1, 2, 3, null, 5, null, 4}))); // [1, 3, 4]
    }
}
`,
      python: `${TREE_PY}
def rightSideView(root):
    # your code
    return []


if __name__ == "__main__":
    print(rightSideView(build([1, 2, 3, None, 5, None, 4])))  # [1, 3, 4]
`,
    },
    {
      id: "diameter-binary-tree", title: "Diameter of Binary Tree", difficulty: "Easy", lc: "diameter-of-binary-tree",
      tags: ["Tree", "DFS"], companies: ["Meta", "Amazon", "Google", "Microsoft"], pattern: "DFS returning height, update global best",
      relatedTopic: "/topic/dsa/dsa-trees?m=deep",
      statement: `<p>Return the length (in edges) of the longest path between any two nodes.</p>`,
      examples: [{ in: "root = [1,2,3,4,5]", out: "3", explain: "4 → 2 → 1 → 3" }],
      constraints: ["1 <= nodes <= 10^4"],
      concept: `<p>The longest path through a node = height(left) + height(right). Compute heights bottom-up and track the maximum sum. The path need not pass through the root.</p>`,
      stuck: ["For a fixed 'highest' node of the path, how long can the path be? (left height + right height)", "Compute heights with a post-order DFS.", "Keep a global best while returning 1 + max(left, right)."],
      complexity: "O(n) time, O(h) space",
      fnName: "diameterOfBinaryTree",
      starter: `${TREE_JS}
function diameterOfBinaryTree(rootArr) {
  const root = buildTree(rootArr);
  // your code
}
`,
      tests: [[[[1, 2, 3, 4, 5]], 3], [[[1, 2]], 1], [[[1]], 0], [[[1, 2, null, 3, 4, 5, null, null, 6, 7, null, null, 8]], 6, true], [[[4, -7, -3, null, null, -9, -3, 9, -7, -4, null, 6, null, -6, -6, null, null, 0, 6, 5, null, 9, null, null, -1, -4, null, null, null, -2]], 8, true]],
      hints: ["Height function.", "best = max(best, lh + rh).", "Return 1 + max(lh, rh)."],
      explain: "Post-order heights with a global maximum.",
      code: `${TREE_JS}
function diameterOfBinaryTree(rootArr) {
  let best = 0;
  const h = n => { if (!n) return 0; const l = h(n.left), r = h(n.right); best = Math.max(best, l + r); return 1 + Math.max(l, r); };
  h(buildTree(rootArr));
  return best;
}`,
      java: `class Main {
${TREE_JAVA}
    static int best = 0;
    static int diameterOfBinaryTree(TreeNode root) {
        // your code: height() helper updating best
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(diameterOfBinaryTree(build(new Integer[]{1, 2, 3, 4, 5}))); // 3
    }
}
`,
      python: `${TREE_PY}
def diameterOfBinaryTree(root):
    # your code
    return 0


if __name__ == "__main__":
    print(diameterOfBinaryTree(build([1, 2, 3, 4, 5])))  # 3
`,
    },
    {
      id: "max-path-sum", title: "Binary Tree Maximum Path Sum", difficulty: "Hard", lc: "binary-tree-maximum-path-sum",
      tags: ["Tree", "DFS", "Dynamic Programming"], companies: ["Meta", "Amazon", "Google", "Microsoft", "DoorDash"], pattern: "DFS returning best downward gain",
      relatedTopic: "/topic/dsa/dsa-trees?m=deep",
      statement: `<p>A path is any sequence of connected nodes (each used once, doesn't need the root). Return the maximum path sum. Values can be negative.</p>`,
      examples: [{ in: "root = [1,2,3]", out: "6" }, { in: "root = [-10,9,20,null,null,15,7]", out: "42" }],
      constraints: ["1 <= nodes <= 3*10^4", "-1000 <= val <= 1000"],
      concept: `<p>Same shape as the diameter problem, with sums. dfs(node) returns the best <b>downward</b> path sum starting at node (clamping negative child gains to 0). At each node, the best path that 'peaks' there is val + leftGain + rightGain — update the global answer.</p>`,
      stuck: ["Solve diameter first — this is the weighted version.", "A path peaks at exactly one node. If that node is fixed, what's the best path? (val + best left gain + best right gain)", "What should dfs return to its parent? Only one branch can continue upward: val + max(leftGain, rightGain).", "Ignore negative gains with max(0, gain). Initialize the answer to -Infinity (all-negative trees)."],
      complexity: "O(n) time, O(h) space",
      fnName: "maxPathSum",
      starter: `${TREE_JS}
function maxPathSum(rootArr) {
  const root = buildTree(rootArr);
  // your code
}
`,
      tests: [[[[1, 2, 3]], 6], [[[-10, 9, 20, null, null, 15, 7]], 42], [[[-3]], -3], [[[2, -1]], 2, true], [[[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]], 48, true], [[[-2, -1]], -1, true]],
      hints: ["Downward gain per node.", "Clamp negative gains to 0.", "Global best = max(val + l + r)."],
      explain: "DFS returning max downward gain.",
      code: `${TREE_JS}
function maxPathSum(rootArr) {
  let best = -Infinity;
  const gain = n => {
    if (!n) return 0;
    const l = Math.max(0, gain(n.left)), r = Math.max(0, gain(n.right));
    best = Math.max(best, n.val + l + r);
    return n.val + Math.max(l, r);
  };
  gain(buildTree(rootArr));
  return best;
}`,
      java: `class Main {
${TREE_JAVA}
    static int best = Integer.MIN_VALUE;
    static int maxPathSum(TreeNode root) {
        // your code: gain(node) helper updating best
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(maxPathSum(build(new Integer[]{-10, 9, 20, null, null, 15, 7}))); // 42
    }
}
`,
      python: `${TREE_PY}
def maxPathSum(root):
    # your code
    return 0


if __name__ == "__main__":
    print(maxPathSum(build([-10, 9, 20, None, None, 15, 7])))  # 42
`,
    },
    {
      id: "kth-smallest-bst", title: "Kth Smallest Element in a BST", difficulty: "Medium", lc: "kth-smallest-element-in-a-bst",
      tags: ["Tree", "BST", "DFS"], companies: ["Amazon", "Meta", "Google", "Uber"], pattern: "In-order traversal (iterative)",
      relatedTopic: "/topic/dsa/dsa-trees?m=deep",
      statement: `<p>Return the k-th smallest value (1-indexed) in a BST.</p>`,
      examples: [{ in: "root = [3,1,4,null,2], k = 1", out: "1" }, { in: "root = [5,3,6,2,4,null,null,1], k = 3", out: "3" }],
      constraints: ["1 <= k <= nodes <= 10^4"],
      concept: `<p>In-order traversal of a BST yields sorted values. Traverse iteratively with a stack and stop at the k-th visit — O(h + k). Follow-up (frequent updates): store subtree sizes in nodes.</p>`,
      stuck: ["What order does an in-order traversal visit BST values in? (ascending)", "So the answer is the k-th node visited in-order.", "Iterative in-order: push left chain, pop, count, move to right."],
      complexity: "O(h + k) time, O(h) space",
      fnName: "kthSmallest",
      starter: `${TREE_JS}
function kthSmallest(rootArr, k) {
  const root = buildTree(rootArr);
  // your code
}
`,
      tests: [[[[3, 1, 4, null, 2], 1], 1], [[[5, 3, 6, 2, 4, null, null, 1], 3], 3], [[[1], 1], 1], [[[5, 3, 6, 2, 4, null, null, 1], 6], 6, true], [[[2, 1, 3], 2], 2, true]],
      hints: ["In-order is sorted.", "Stack-based traversal.", "Stop early at count k."],
      explain: "Iterative in-order with early exit.",
      code: `${TREE_JS}
function kthSmallest(rootArr, k) {
  const st = [];
  let cur = buildTree(rootArr);
  while (cur || st.length) {
    while (cur) { st.push(cur); cur = cur.left; }
    cur = st.pop();
    if (--k === 0) return cur.val;
    cur = cur.right;
  }
  return -1;
}`,
      java: `import java.util.*;

class Main {
${TREE_JAVA}
    static int kthSmallest(TreeNode root, int k) {
        // your code: iterative in-order with Deque<TreeNode>
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(kthSmallest(build(new Integer[]{5, 3, 6, 2, 4, null, null, 1}), 3)); // 3
    }
}
`,
      python: `${TREE_PY}
def kthSmallest(root, k):
    # your code
    return 0


if __name__ == "__main__":
    print(kthSmallest(build([5, 3, 6, 2, 4, None, None, 1]), 3))  # 3
`,
    },
    {
      id: "build-tree-pre-in", title: "Construct Binary Tree from Preorder and Inorder", difficulty: "Medium", lc: "construct-binary-tree-from-preorder-and-inorder-traversal",
      tags: ["Tree", "Divide and Conquer", "Hashing"], companies: ["Amazon", "Microsoft", "Google", "Meta", "Bloomberg"], pattern: "Recursion with index map",
      relatedTopic: "/topic/dsa/dsa-trees?m=deep",
      statement: `<p>Given preorder and inorder traversals (unique values), build the tree and return it as a level-order array without trailing nulls.</p>`,
      examples: [{ in: "preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]", out: "[3,9,20,null,null,15,7]" }],
      constraints: ["1 <= n <= 3000"],
      concept: `<p>preorder[0] is the root; its position in inorder splits left and right subtrees (sizes known). Recurse with index ranges; a hash map value → inorder index makes each split O(1).</p>`,
      stuck: ["Which element of preorder is always the root? (the first)", "Where is the root in inorder, and what's to its left/right? (left/right subtrees)", "Recurse with a moving preorder pointer and inorder bounds; map values to inorder indices."],
      complexity: "O(n) time, O(n) space",
      fnName: "buildTree",
      starter: `function buildTree(preorder, inorder) {
  // build the tree, then return it as a level-order array (no trailing nulls)
}
`,
      tests: [[[[3, 9, 20, 15, 7], [9, 3, 15, 20, 7]], [3, 9, 20, null, null, 15, 7]], [[[-1], [-1]], [-1]], [[[1, 2], [2, 1]], [1, 2]], [[[1, 2], [1, 2]], [1, null, 2], true], [[[1, 2, 4, 5, 3, 6], [4, 2, 5, 1, 6, 3]], [1, 2, 3, 4, 5, 6], true]],
      hints: ["Root = next preorder element.", "Index map for inorder.", "Serialize with BFS and trim trailing nulls."],
      explain: "Recursive construction, then level-order serialization.",
      code: `function buildTree(preorder, inorder) {
  const idx = new Map(inorder.map((v, i) => [v, i]));
  let p = 0;
  const make = (lo, hi) => {
    if (lo > hi) return null;
    const v = preorder[p++], m = idx.get(v);
    const node = { val: v, left: null, right: null };
    node.left = make(lo, m - 1); node.right = make(m + 1, hi);
    return node;
  };
  const root = make(0, inorder.length - 1), out = [], q = [root];
  for (let h = 0; h < q.length; h++) {
    const n = q[h];
    if (n) { out.push(n.val); q.push(n.left, n.right); } else out.push(null);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}`,
      java: `import java.util.*;

class Main {
    static class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }
    static TreeNode buildTree(int[] preorder, int[] inorder) {
        // your code: HashMap value -> inorder index, recursive helper with bounds
        return null;
    }

    public static void main(String[] args) {
        TreeNode r = buildTree(new int[]{3,9,20,15,7}, new int[]{9,3,15,20,7});
        System.out.println(r == null ? "null" : r.val + " " + r.left.val + " " + r.right.val); // 3 9 20
    }
}
`,
      python: `def buildTree(preorder, inorder):
    # your code: return the root node (class with val/left/right)
    return None
`,
    },
    // ---------------------------------------------------------------- Linked lists
    {
      id: "reverse-linked-list", title: "Reverse Linked List", difficulty: "Easy", lc: "reverse-linked-list",
      tags: ["Linked List"], companies: ["Amazon", "Microsoft", "Apple", "Meta", "Google"], pattern: "Three-pointer iterative reversal",
      relatedTopic: "/topic/dsa/dsa-linkedlist?m=deep",
      statement: `<p>Reverse a singly linked list (given and returned as arrays here; use the helpers to work with real nodes).</p>`,
      examples: [{ in: "head = [1,2,3,4,5]", out: "[5,4,3,2,1]" }],
      constraints: ["0 <= n <= 5000"],
      concept: `<p>Walk the list keeping <code>prev</code>; for each node save next, point node.next to prev, advance. Recursive version: reverse the rest, then make head.next.next = head.</p>`,
      stuck: ["Draw 3 nodes and the arrows you want at the end.", "You need to remember the next node before you overwrite node.next.", "Loop: next = cur.next; cur.next = prev; prev = cur; cur = next. Return prev."],
      complexity: "O(n) time, O(1) space",
      fnName: "reverseList",
      starter: `${LIST_JS}
function reverseList(arr) {
  let head = toList(arr);
  // reverse, then return toArray(newHead)
}
`,
      tests: [[[[1, 2, 3, 4, 5]], [5, 4, 3, 2, 1]], [[[1, 2]], [2, 1]], [[[]], []], [[[7]], [7], true]],
      hints: ["prev / cur / next.", "Don't lose the rest of the list.", "Return the new head (prev)."],
      explain: "Iterative pointer reversal.",
      code: `${LIST_JS}
function reverseList(arr) {
  let cur = toList(arr), prev = null;
  while (cur) { const nx = cur.next; cur.next = prev; prev = cur; cur = nx; }
  return toArray(prev);
}`,
      java: `class Main {
${LIST_JAVA}
    static ListNode reverseList(ListNode head) {
        // your code
        return head;
    }

    public static void main(String[] args) {
        System.out.println(str(reverseList(toList(1, 2, 3, 4, 5)))); // [5, 4, 3, 2, 1]
    }
}
`,
      python: `${LIST_PY}
def reverseList(head):
    # your code
    return head


if __name__ == "__main__":
    print(to_array(reverseList(to_list([1, 2, 3, 4, 5]))))  # [5, 4, 3, 2, 1]
`,
    },
    {
      id: "merge-k-sorted-lists", title: "Merge k Sorted Lists", difficulty: "Hard", lc: "merge-k-sorted-lists",
      tags: ["Linked List", "Heap", "Divide and Conquer"], companies: ["Amazon", "Meta", "Google", "Microsoft", "Uber"], pattern: "Min-heap of list heads / pairwise merging",
      relatedTopic: "/topic/dsa/dsa-heaps?m=deep",
      statement: `<p>Merge k sorted linked lists into one sorted list (lists given/returned as arrays).</p>`,
      examples: [{ in: "lists = [[1,4,5],[1,3,4],[2,6]]", out: "[1,1,2,3,4,4,5,6]" }],
      constraints: ["0 <= k <= 10^4", "total nodes <= 10^4"],
      concept: `<p>Keep a min-heap of the current head of each list; pop the smallest, append it, push its successor — O(N log k). Alternative: merge lists pairwise like merge sort — also O(N log k).</p>`,
      stuck: ["Start with merging two sorted lists (dummy head + two pointers).", "Merging one by one is O(k·N). Can you always grab the smallest current head quickly? (min-heap of k heads)", "Or divide and conquer: merge pairs, then pairs of pairs → log k rounds."],
      complexity: "O(N log k) time, O(k) space for the heap",
      fnName: "mergeKLists",
      starter: `${LIST_JS}
function mergeKLists(arrays) {
  const lists = arrays.map(toList);
  // merge, return as array
}
`,
      tests: [[[[[1, 4, 5], [1, 3, 4], [2, 6]]], [1, 1, 2, 3, 4, 4, 5, 6]], [[[]], []], [[[[]]], []], [[[[5], [1], [3], [2], [4]]], [1, 2, 3, 4, 5], true], [[[[1, 2, 3], [], [0, 10]]], [0, 1, 2, 3, 10], true]],
      hints: ["Merge two lists first.", "Pairwise merging halves the count each round.", "Or a min-heap of heads."],
      explain: "Divide and conquer pairwise merging.",
      code: `${LIST_JS}
function mergeKLists(arrays) {
  let lists = arrays.map(toList);
  const merge2 = (a, b) => {
    const d = new ListNode(0); let t = d;
    while (a && b) { if (a.val <= b.val) { t.next = a; a = a.next; } else { t.next = b; b = b.next; } t = t.next; }
    t.next = a || b; return d.next;
  };
  if (!lists.length) return [];
  while (lists.length > 1) {
    const next = [];
    for (let i = 0; i < lists.length; i += 2) next.push(i + 1 < lists.length ? merge2(lists[i], lists[i + 1]) : lists[i]);
    lists = next;
  }
  return toArray(lists[0]);
}`,
      java: `import java.util.*;

class Main {
${LIST_JAVA}
    static ListNode mergeKLists(ListNode[] lists) {
        // your code: PriorityQueue<ListNode> by val
        return null;
    }

    public static void main(String[] args) {
        System.out.println(str(mergeKLists(new ListNode[]{toList(1,4,5), toList(1,3,4), toList(2,6)}))); // [1, 1, 2, 3, 4, 4, 5, 6]
    }
}
`,
      python: `import heapq
${LIST_PY}
def mergeKLists(lists):
    # your code (heap entries: (val, idx, node))
    return None


if __name__ == "__main__":
    print(to_array(mergeKLists([to_list([1,4,5]), to_list([1,3,4]), to_list([2,6])])))
`,
    },
    {
      id: "remove-nth-from-end", title: "Remove Nth Node From End of List", difficulty: "Medium", lc: "remove-nth-node-from-end-of-list",
      tags: ["Linked List", "Two Pointers"], companies: ["Meta", "Amazon", "Microsoft", "Google"], pattern: "Fast/slow pointers with an n-gap + dummy head",
      relatedTopic: "/topic/dsa/dsa-linkedlist?m=deep",
      statement: `<p>Remove the n-th node from the end in one pass (given/returned as arrays).</p>`,
      examples: [{ in: "head = [1,2,3,4,5], n = 2", out: "[1,2,3,5]" }],
      constraints: ["1 <= n <= length <= 30"],
      concept: `<p>Advance a fast pointer n steps, then move fast and slow together until fast reaches the last node; slow is just before the node to delete. A dummy head handles deleting the first node.</p>`,
      stuck: ["Two-pass solution: count length, then walk to length − n. Say it first.", "One pass: keep two pointers exactly n apart.", "Start both at a dummy node so removing the head needs no special case."],
      complexity: "O(L) time, O(1) space",
      fnName: "removeNthFromEnd",
      starter: `${LIST_JS}
function removeNthFromEnd(arr, n) {
  const head = toList(arr);
  // your code, return toArray(newHead)
}
`,
      tests: [[[[1, 2, 3, 4, 5], 2], [1, 2, 3, 5]], [[[1], 1], []], [[[1, 2], 1], [1]], [[[1, 2], 2], [2], true], [[[1, 2, 3], 3], [2, 3], true]],
      hints: ["Dummy head.", "Move fast n+1 steps from dummy.", "Then move both until fast is null; slow.next = slow.next.next."],
      explain: "Two pointers with a gap.",
      code: `${LIST_JS}
function removeNthFromEnd(arr, n) {
  const dummy = new ListNode(0, toList(arr));
  let fast = dummy, slow = dummy;
  for (let i = 0; i <= n; i++) fast = fast.next;
  while (fast) { fast = fast.next; slow = slow.next; }
  slow.next = slow.next.next;
  return toArray(dummy.next);
}`,
      java: `class Main {
${LIST_JAVA}
    static ListNode removeNthFromEnd(ListNode head, int n) {
        // your code: dummy + fast/slow gap
        return head;
    }

    public static void main(String[] args) {
        System.out.println(str(removeNthFromEnd(toList(1, 2, 3, 4, 5), 2))); // [1, 2, 3, 5]
    }
}
`,
      python: `${LIST_PY}
def removeNthFromEnd(head, n):
    # your code
    return head


if __name__ == "__main__":
    print(to_array(removeNthFromEnd(to_list([1,2,3,4,5]), 2)))  # [1, 2, 3, 5]
`,
    },
    {
      id: "reorder-list", title: "Reorder List", difficulty: "Medium", lc: "reorder-list",
      tags: ["Linked List", "Two Pointers"], companies: ["Amazon", "Meta", "Microsoft", "Adobe"], pattern: "Find middle + reverse second half + weave",
      relatedTopic: "/topic/dsa/dsa-linkedlist?m=deep",
      statement: `<p>Reorder L0→L1→…→Ln into L0→Ln→L1→Ln−1→L2→… in place (given/returned as arrays).</p>`,
      examples: [{ in: "head = [1,2,3,4,5]", out: "[1,5,2,4,3]" }],
      constraints: ["1 <= n <= 5*10^4"],
      concept: `<p>Three classic sub-steps: find the middle (slow/fast), reverse the second half, then merge the two halves alternately. Each is O(n), O(1) space.</p>`,
      stuck: ["Look at the output: it interleaves the first half with the reversed second half.", "Step 1: find the middle with slow/fast pointers.", "Step 2: reverse the second half. Step 3: weave the two lists."],
      complexity: "O(n) time, O(1) space",
      fnName: "reorderList",
      starter: `${LIST_JS}
function reorderList(arr) {
  const head = toList(arr);
  // reorder in place, return toArray(head)
}
`,
      tests: [[[[1, 2, 3, 4]], [1, 4, 2, 3]], [[[1, 2, 3, 4, 5]], [1, 5, 2, 4, 3]], [[[1]], [1]], [[[1, 2]], [1, 2], true], [[[1, 2, 3]], [1, 3, 2], true]],
      hints: ["Middle via slow/fast.", "Reverse from slow.next and cut.", "Alternate merge."],
      explain: "Middle, reverse, weave.",
      code: `${LIST_JS}
function reorderList(arr) {
  const head = toList(arr);
  if (!head) return [];
  let slow = head, fast = head;
  while (fast.next && fast.next.next) { slow = slow.next; fast = fast.next.next; }
  let second = slow.next, prev = null; slow.next = null;
  while (second) { const nx = second.next; second.next = prev; prev = second; second = nx; }
  let a = head, b = prev;
  while (b) { const an = a.next, bn = b.next; a.next = b; b.next = an; a = an; b = bn; }
  return toArray(head);
}`,
      java: `class Main {
${LIST_JAVA}
    static void reorderList(ListNode head) {
        // your code
    }

    public static void main(String[] args) {
        ListNode h = toList(1, 2, 3, 4, 5); reorderList(h);
        System.out.println(str(h)); // [1, 5, 2, 4, 3]
    }
}
`,
      python: `${LIST_PY}
def reorderList(head):
    # your code (in place)
    return head


if __name__ == "__main__":
    print(to_array(reorderList(to_list([1,2,3,4,5]))))  # [1, 5, 2, 4, 3]
`,
    },
  ]);
})();
