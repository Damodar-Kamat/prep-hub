"""Local knowledge: the prep-hub library (compiled to JSON), a skills taxonomy used for
JD analysis / topic detection, famous LeetCode problems, and company values."""
import json
import os
import re
import shutil
import subprocess
from collections import Counter

from . import DATA_DIR, ROOT, nlp

LIB_PATH = os.path.join(DATA_DIR, "library.json")
_lib = {"data": None, "mtime": 0, "index": None}


def _data_mtime():
    d = os.path.join(ROOT, "data")
    try:
        return max(os.path.getmtime(os.path.join(d, f)) for f in os.listdir(d) if f.endswith(".js"))
    except ValueError:
        return 0


def build_library(force=False):
    if not force and os.path.exists(LIB_PATH) and os.path.getmtime(LIB_PATH) >= _data_mtime():
        return True
    node = shutil.which("node")
    if not node:
        return os.path.exists(LIB_PATH)
    try:
        subprocess.run([node, os.path.join(ROOT, "interview_os", "build_library.js"), ROOT, LIB_PATH],
                       check=True, capture_output=True, timeout=60)
        return True
    except Exception:
        return os.path.exists(LIB_PATH)


def library():
    if _lib["data"] is None or (os.path.exists(LIB_PATH) and os.path.getmtime(LIB_PATH) != _lib["mtime"]):
        build_library()
        try:
            with open(LIB_PATH) as f:
                _lib["data"] = json.load(f)
            _lib["mtime"] = os.path.getmtime(LIB_PATH)
        except Exception:
            _lib["data"] = {"sections": [], "problems": [], "roadmap": []}
        _lib["index"] = None
    return _lib["data"]


def _index():
    if _lib["index"] is None:
        lib = library()
        docs = []
        for s in lib["sections"]:
            for t in s["topics"]:
                body = t.get("summary", "") + " " + " ".join(t["brushup"]) + " " + t["text"][:6000]
                docs.append({"kind": "topic", "section": s["id"], "section_title": s["title"], "id": t["id"], "title": t["title"],
                             "href": "/index.html#/topic/%s/%s?m=deep" % (s["id"], t["id"]),
                             "toks": nlp.tokens(t["title"]) * 4 + nlp.tokens(" ".join(t.get("tags", []))) * 2 + nlp.tokens(t.get("summary", "")) * 2 + nlp.tokens(body),
                             "brushup": ([t["summary"]] if t.get("summary") else []) + t["brushup"][:3]})
        for p in lib["problems"]:
            docs.append({"kind": "problem", "id": p["id"], "title": p["title"], "section_title": "DSA Practice · " + (p.get("difficulty") or ""),
                         "href": "/index.html#/problem/" + p["id"], "toks": nlp.tokens(p["title"]) * 4 + nlp.tokens(" ".join(p["tags"])) * 2 + nlp.tokens(p["statement"]),
                         "brushup": [p["statement"][:220]]})
        tf = nlp.TfIdf([d["toks"] for d in docs])
        for d in docs:
            d["vec"] = tf.vec(d["toks"])
        _lib["index"] = (tf, docs)
    return _lib["index"]


def local_topic_hits(query, k=6):
    tf, docs = _index()
    if not docs:
        return []
    qv = tf.vec(nlp.tokens(query))
    scored = sorted(((nlp.cos(qv, d["vec"]), d) for d in docs), key=lambda x: -x[0])
    return [{"kind": d["kind"], "title": d["title"], "section": d["section_title"], "href": d["href"], "score": round(s, 3),
             "brushup": d["brushup"]} for s, d in scored[:k] if s > 0.08]


# ------------------------------------------------------------------ skills taxonomy
# canonical: (category, [aliases/regex fragments], study query)
SKILLS = {
    # languages
    "Java": ("Languages", [r"\bjava\b(?!script)", r"\bjvm\b", r"\bj2ee\b", r"\bjdk\b"], "Java interview questions JVM collections concurrency"),
    "Python": ("Languages", [r"\bpython\b", r"\bdjango\b", r"\bflask\b", r"\bfastapi\b"], "Python interview questions"),
    "Go": ("Languages", [r"\bgolang\b", r"\bgo\b(?= |,|/)(?=.*(lang|goroutine|developer|engineer))"], "Go goroutines channels interview"),
    "C++": ("Languages", [r"c\+\+", r"\bstl\b"], "C++ interview questions"),
    "JavaScript/TypeScript": ("Languages", [r"\bjavascript\b", r"\btypescript\b", r"\bnode\.?js\b", r"\bes6\b"], "JavaScript event loop closures interview"),
    "Scala": ("Languages", [r"\bscala\b"], "Scala interview questions"),
    "Kotlin": ("Languages", [r"\bkotlin\b"], "Kotlin interview questions"),
    "Rust": ("Languages", [r"\brust\b"], "Rust ownership borrowing interview"),
    "SQL": ("Data", [r"\bsql\b", r"\bjoins?\b", r"window functions?"], "SQL interview questions joins window functions"),
    # backend / frameworks
    "Spring Boot": ("Backend", [r"\bspring\b", r"spring boot", r"\bhibernate\b", r"\bjpa\b"], "Spring Boot interview questions"),
    "REST APIs": ("Backend", [r"\brest(ful)?\b", r"\bapi design\b", r"\bopenapi\b"], "REST API design best practices"),
    "gRPC": ("Backend", [r"\bgrpc\b", r"protocol buffers|protobuf"], "gRPC vs REST"),
    "GraphQL": ("Backend", [r"\bgraphql\b"], "GraphQL interview questions"),
    "Microservices": ("Architecture", [r"micro-?services?", r"service mesh", r"\bistio\b"], "microservices patterns saga circuit breaker"),
    "Distributed Systems": ("Architecture", [r"distributed (systems?|computing)", r"\bconsensus\b", r"\braft\b", r"\bpaxos\b", r"\bcap theorem\b"], "distributed systems fundamentals consensus replication"),
    "System Design": ("Architecture", [r"system design", r"scalab(le|ility)", r"high availability", r"large[- ]scale", r"architect(ure|ing)"], "system design interview framework"),
    "Low-Level Design / OOP": ("Architecture", [r"object[- ]oriented", r"\boop\b", r"design patterns?", r"(?-i:\bSOLID\b)", r"\blld\b"], "low level design interview SOLID design patterns"),
    "Concurrency": ("CS Core", [r"concurren(cy|t)", r"multi-?thread", r"\bparallel", r"\block-free\b", r"\basync"], "concurrency interview questions threads locks"),
    "Data Structures & Algorithms": ("CS Core", [r"data structures?", r"algorithms?", r"\bdsa\b", r"problem[- ]solving", r"\bleetcode\b"], "DSA patterns"),
    "Operating Systems": ("CS Core", [r"operating systems?", r"\blinux\b", r"\bunix\b", r"\bkernel\b"], "operating systems interview questions"),
    "Networking": ("CS Core", [r"\bnetwork(ing)?\b", r"\btcp\b", r"\bhttp/?[23]?\b", r"\bdns\b", r"load balanc"], "networking interview questions TCP HTTP DNS"),
    # data
    "PostgreSQL/MySQL": ("Data", [r"postgres(ql)?", r"\bmysql\b", r"\brdbms\b", r"relational databases?", r"\boracle\b"], "database indexing transactions isolation levels"),
    "NoSQL": ("Data", [r"\bnosql\b", r"\bmongo(db)?\b", r"\bcassandra\b", r"\bdynamo(db)?\b", r"\bhbase\b", r"\bcouchbase\b"], "NoSQL data modeling Cassandra DynamoDB"),
    "Redis/Caching": ("Data", [r"\bredis\b", r"\bmemcached\b", r"\bcach(e|ing)\b"], "caching strategies Redis interview"),
    "Elasticsearch": ("Data", [r"elastic ?search", r"\bopensearch\b", r"\blucene\b", r"\bsolr\b"], "Elasticsearch inverted index interview"),
    "Kafka": ("Data Engineering", [r"\bkafka\b", r"\bkinesis\b", r"\bpulsar\b"], "Kafka interview questions partitions consumer groups exactly once"),
    "Message Queues": ("Data Engineering", [r"rabbit ?mq", r"\bsqs\b", r"message (queues?|brokers?)", r"pub/?sub", r"\bactivemq\b"], "message queue vs pub sub"),
    "Flink": ("Data Engineering", [r"\bflink\b"], "Apache Flink interview checkpointing watermarks state"),
    "Spark": ("Data Engineering", [r"\bspark\b", r"\bpyspark\b", r"\bdatabricks\b"], "Apache Spark interview questions shuffle partitions"),
    "Stream Processing": ("Data Engineering", [r"stream(ing)? processing", r"real[- ]time (data|pipelines?|analytics)", r"event[- ]driven", r"\bcdc\b", r"debezium"], "stream processing event time windows"),
    "Data Warehousing": ("Data Engineering", [r"data ?warehous", r"\bsnowflake\b", r"\bbigquery\b", r"\bredshift\b", r"\betl\b", r"\belt\b", r"\bdbt\b", r"data lake(house)?", r"\biceberg\b", r"\bdelta lake\b"], "data warehouse star schema ETL interview"),
    "Airflow/Orchestration": ("Data Engineering", [r"\bairflow\b", r"\bdagster\b", r"\bprefect\b", r"orchestration"], "Airflow interview questions"),
    "Hadoop": ("Data Engineering", [r"\bhadoop\b", r"\bhdfs\b", r"\bhive\b", r"mapreduce"], "Hadoop HDFS MapReduce interview"),
    # cloud / devops
    "AWS": ("Cloud & DevOps", [r"\baws\b", r"amazon web services", r"\bec2\b", r"\bs3\b", r"\blambda\b", r"\becs\b", r"\beks\b"], "AWS interview questions for developers"),
    "GCP": ("Cloud & DevOps", [r"\bgcp\b", r"google cloud"], "GCP services interview"),
    "Azure": ("Cloud & DevOps", [r"\bazure\b"], "Azure interview questions"),
    "Docker": ("Cloud & DevOps", [r"\bdocker\b", r"containers?"], "Docker interview questions"),
    "Kubernetes": ("Cloud & DevOps", [r"kubernetes", r"\bk8s\b", r"\bhelm\b"], "Kubernetes interview questions"),
    "CI/CD": ("Cloud & DevOps", [r"ci/?cd", r"\bjenkins\b", r"github actions", r"gitlab ci", r"continuous (integration|delivery|deployment)"], "CI/CD pipeline interview"),
    "Terraform/IaC": ("Cloud & DevOps", [r"terraform", r"infrastructure as code", r"\biac\b", r"cloudformation", r"\bpulumi\b"], "Terraform interview questions"),
    "Observability": ("Cloud & DevOps", [r"observability", r"monitoring", r"\bprometheus\b", r"\bgrafana\b", r"opentelemetry", r"\bdatadog\b", r"\bsplunk\b", r"logging"], "observability metrics logs traces SLO"),
    "Security": ("Cloud & DevOps", [r"\bsecurity\b", r"\boauth\b", r"\bjwt\b", r"\bsso\b", r"encryption", r"\bowasp\b", r"\bauth(n|z|entication|orization)\b"], "web security OAuth JWT interview"),
    # frontend
    "React": ("Frontend", [r"\breact\b", r"\bredux\b", r"next\.?js"], "React interview questions hooks"),
    "HTML/CSS": ("Frontend", [r"\bhtml5?\b", r"\bcss3?\b", r"\btailwind\b"], "CSS layout interview"),
    # ML
    "Machine Learning": ("ML/AI", [r"machine learning", r"\bml\b", r"deep learning", r"\bpytorch\b", r"tensorflow", r"scikit"], "machine learning interview questions"),
    "LLMs/GenAI": ("ML/AI", [r"\bllms?\b", r"generative ai", r"\bgenai\b", r"\brag\b", r"vector (db|database|search)", r"prompt engineering", r"embeddings?"], "RAG architecture LLM system design interview"),
    # practices
    "Testing": ("Practices", [r"unit test", r"\btdd\b", r"integration test", r"\bjunit\b", r"\bpytest\b", r"test automation"], "testing strategy interview unit integration"),
    "Agile": ("Practices", [r"\bagile\b", r"\bscrum\b", r"\bkanban\b"], "agile scrum interview"),
    "Leadership/Mentoring": ("Soft Skills", [r"mentor", r"lead(ership|ing)? (a )?team", r"tech(nical)? lead", r"ownership", r"stakeholder", r"cross-?functional"], "leadership behavioral interview questions"),
    "Communication": ("Soft Skills", [r"communicat", r"collaborat", r"written and verbal"], "communication behavioral interview"),
}
_SKILL_RX = {k: re.compile("|".join(v[1]), re.I) for k, v in SKILLS.items()}


def detect_skills(text):
    """Return {skill: count} for skills mentioned in text."""
    out = {}
    for k, rx in _SKILL_RX.items():
        n = len(rx.findall(text or ""))
        if n:
            out[k] = n
    return out


DSA_TOPICS = {
    "Arrays & Hashing": r"\b(hash ?maps?|hash ?sets?|arrays?|prefix sums?)\b",
    "Two Pointers / Sliding Window": r"\b(two pointers?|sliding window)\b",
    "Binary Search": r"\bbinary search\b",
    "Linked Lists": r"\blinked ?lists?\b",
    "Trees / BST": r"\b(binary tree|bst|trees?|lca|lowest common ancestor|traversal)\b",
    "Tries": r"\btries|\btrie\b",
    "Heaps / Priority Queue": r"\b(heaps?|priority queue|top ?k)\b",
    "Graphs (BFS/DFS)": r"\b(graphs?|bfs|dfs|topological|dijkstra|union[- ]find|islands?)\b",
    "Dynamic Programming": r"\b(dynamic programming|\bdp\b|memoi[sz]ation|knapsack)\b",
    "Backtracking": r"\b(backtracking|permutations?|subsets?|n-queens)\b",
    "Greedy / Intervals": r"\b(greedy|intervals?|meeting rooms?)\b",
    "Stacks / Monotonic": r"\b(stacks?|monotonic|parenthes[ie]s)\b",
    "Bit Manipulation": r"\b(bit manipulation|bitwise|xor)\b",
    "Strings": r"\b(strings?|anagrams?|palindromes?|substrings?)\b",
    "Matrix": r"\b(matrix|matrices|2d grid|grid)\b",
    "LRU / Design DS": r"\b(lru cache|lfu|design (a )?(data structure|hashmap|cache))\b",
}
_DSA_RX = {k: re.compile(v, re.I) for k, v in DSA_TOPICS.items()}


def topic_mentions(text):
    c = Counter()
    for k, rx in _DSA_RX.items():
        n = len(rx.findall(text))
        if n:
            c["DSA · " + k] = n
    for k, n in detect_skills(text).items():
        if SKILLS[k][0] not in ("Soft Skills", "Practices", "Languages"):
            c[k] += n
    return [{"topic": k, "mentions": n} for k, n in c.most_common(40)]


FAMOUS = ["Two Sum", "LRU Cache", "Number of Islands", "Merge Intervals", "Trapping Rain Water", "Longest Substring Without Repeating Characters",
          "Median of Two Sorted Arrays", "Word Ladder", "Course Schedule", "Top K Frequent Elements", "Kth Largest Element", "Merge K Sorted Lists",
          "Rotting Oranges", "Word Search", "Serialize and Deserialize Binary Tree", "Lowest Common Ancestor", "Valid Parentheses", "Min Stack",
          "Sliding Window Maximum", "Meeting Rooms", "Coin Change", "Longest Increasing Subsequence", "Edit Distance", "Word Break",
          "Product of Array Except Self", "3Sum", "Container With Most Water", "Group Anagrams", "Search in Rotated Sorted Array",
          "Clone Graph", "Alien Dictionary", "Minimum Window Substring", "Reorganize String", "Task Scheduler", "Design Hit Counter",
          "Insert Delete GetRandom", "Find Median from Data Stream", "Jump Game", "House Robber", "Decode Ways", "Unique Paths",
          "Longest Palindromic Substring", "Rotate Image", "Spiral Matrix", "Set Matrix Zeroes", "Binary Tree Right Side View",
          "Diameter of Binary Tree", "Validate Binary Search Tree", "Kth Smallest Element in a BST", "Reverse Linked List",
          "Linked List Cycle", "Copy List with Random Pointer", "Add Two Numbers", "Daily Temperatures", "Largest Rectangle in Histogram",
          "Evaluate Reverse Polish Notation", "Car Fleet", "Koko Eating Bananas", "Time Based Key-Value Store", "Network Delay Time",
          "Cheapest Flights Within K Stops", "Pacific Atlantic Water Flow", "Surrounded Regions", "Accounts Merge", "Snakes and Ladders",
          "Burst Balloons", "Regular Expression Matching", "Maximum Subarray", "Best Time to Buy and Sell Stock", "Subarray Sum Equals K",
          "Longest Consecutive Sequence", "Asteroid Collision", "Basic Calculator", "Design Twitter", "Implement Trie", "Word Search II",
          "Palindrome Partitioning", "N-Queens", "Combination Sum", "Permutations", "Subsets", "Letter Combinations of a Phone Number",
          "Gas Station", "Partition Labels", "Non-overlapping Intervals", "Insert Interval", "Minimum Number of Arrows",
          "Rotting Oranges", "Walls and Gates", "Graph Valid Tree", "Redundant Connection", "Longest Common Subsequence",
          "Target Sum", "Interleaving String", "Distinct Subsequences", "Maximal Square", "Count Islands", "Flood Fill"]


def problem_mentions(text):
    lib = library()
    names = {p["title"] for p in lib.get("roadmap", [])} | {p["title"] for p in lib.get("problems", [])} | set(FAMOUS)
    c = Counter()
    low = text.lower()
    for n in names:
        k = n.lower()
        if len(k) < 6:
            continue
        cnt = low.count(k)
        if cnt:
            c[n] += cnt
    for m in re.findall(r"\b(?:leetcode|lc)\s*#?\s*(\d{1,4})\b", text, re.I):
        c["LeetCode #" + m] += 1
    rm = {p["title"]: p for p in lib.get("roadmap", [])}
    out = []
    for n, k in c.most_common(40):
        r = rm.get(n)
        out.append({"title": n, "mentions": k, "lc": r["lc"] if r else re.sub(r"[^a-z0-9]+", "-", n.lower()).strip("-") if not n.startswith("LeetCode #") else "",
                    "local": r.get("local") if r else None})
    return out


VALUES = {
    "amazon": ("Leadership Principles", ["Customer Obsession", "Ownership", "Invent and Simplify", "Are Right, A Lot", "Learn and Be Curious",
               "Hire and Develop the Best", "Insist on the Highest Standards", "Think Big", "Bias for Action", "Frugality", "Earn Trust",
               "Dive Deep", "Have Backbone; Disagree and Commit", "Deliver Results", "Strive to be Earth's Best Employer",
               "Success and Scale Bring Broad Responsibility"]),
    "google": ("What Google looks for", ["General Cognitive Ability", "Role-Related Knowledge", "Leadership (emergent)", "Googleyness: comfort with ambiguity",
               "Googleyness: bias to action", "Googleyness: collaborative, humble, conscientious", "Doing the right thing for users"]),
    "meta": ("Meta values", ["Move Fast", "Focus on Long-Term Impact", "Build Awesome Things", "Live in the Future", "Be Direct and Respect Your Colleagues",
             "Meta, Metamates, Me"]),
    "microsoft": ("Microsoft culture", ["Growth Mindset", "Customer Obsessed", "Diverse & Inclusive", "One Microsoft", "Making a Difference",
                  "Respect, Integrity, Accountability"]),
    "netflix": ("Netflix culture", ["Judgment", "Communication", "Curiosity", "Courage", "Passion", "Selflessness", "Innovation", "Inclusion",
                "Integrity", "Impact", "Freedom & Responsibility", "Context, not Control", "Highly aligned, loosely coupled"]),
    "apple": ("Apple values", ["Attention to detail / craftsmanship", "Secrecy & focus", "Collaboration across functions", "Accessibility",
              "Privacy", "Environment", "Inclusion & diversity"]),
    "uber": ("Uber values", ["We build globally, we live locally", "We are customer obsessed", "We celebrate differences", "We do the right thing",
             "We act like owners", "We persevere", "We value ideas over hierarchy", "We make big bold bets"]),
    "stripe": ("Stripe operating principles", ["Users first", "Move with urgency and focus", "Be meticulous in your craft", "Seek feedback",
               "Stay curious", "Be open-minded", "Optimise globally"]),
    "airbnb": ("Airbnb core values", ["Champion the Mission", "Be a Host", "Embrace the Adventure", "Be a Cereal Entrepreneur"]),
    "atlassian": ("Atlassian values", ["Open company, no bullshit", "Build with heart and balance", "Don't #@!% the customer", "Play, as a team",
                  "Be the change you seek"]),
    "salesforce": ("Salesforce values", ["Trust", "Customer Success", "Innovation", "Equality", "Sustainability"]),
    "flipkart": ("Flipkart values", ["Customer first", "Integrity", "Bias for action", "Ownership", "Audacity"]),
    "linkedin": ("LinkedIn values", ["Members first", "Relationships matter", "Be open, honest and constructive", "Demand excellence",
                 "Take intelligent risks", "Act like an owner"]),
    "oracle": ("Oracle values", ["Integrity", "Mutual respect", "Teamwork", "Communication", "Innovation", "Customer satisfaction", "Quality"]),
    "adobe": ("Adobe values", ["Genuine", "Exceptional", "Innovative", "Involved"]),
    "nvidia": ("NVIDIA culture", ["Innovation", "Intellectual honesty", "Speed and agility", "Excellence and determination", "One team"]),
    "goldman": ("Goldman Sachs values", ["Client Service", "Excellence", "Integrity", "Partnership"]),
    "walmart": ("Walmart values", ["Respect for the individual", "Act with integrity", "Service to the customer", "Strive for excellence"]),
}


def company_values(name):
    n = name.lower()
    for k, (title, vals) in VALUES.items():
        if k in n:
            return {"title": title, "values": vals}
    return None
