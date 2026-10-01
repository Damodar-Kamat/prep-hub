# -*- coding: utf-8 -*-
"""SQL practice: a seeded in-memory SQLite sandbox + graded challenges.

Every run builds a fresh in-memory database, so user queries can't damage anything.
A challenge is graded by comparing the user's result set to the reference solution's
(order-insensitive unless the challenge says order matters)."""
import sqlite3
import time

SCHEMA = """
CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT NOT NULL, location TEXT);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, department_id INTEGER REFERENCES departments(id),
  manager_id INTEGER REFERENCES employees(id), salary INTEGER NOT NULL, hired_on TEXT NOT NULL
);
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT, signed_up TEXT NOT NULL);
CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price REAL NOT NULL);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), ordered_on TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE order_items (order_id INTEGER REFERENCES orders(id), product_id INTEGER REFERENCES products(id), qty INTEGER NOT NULL,
  PRIMARY KEY (order_id, product_id));
CREATE TABLE logins (user_id INTEGER NOT NULL, login_date TEXT NOT NULL);
"""

SEED = """
INSERT INTO departments VALUES (1,'Engineering','Bangalore'),(2,'Data','Bangalore'),(3,'Sales','Mumbai'),(4,'HR','Pune'),(5,'Legal','Delhi');
INSERT INTO employees VALUES
 (1,'Asha',1,NULL,300000,'2015-03-01'),(2,'Ravi',1,1,210000,'2017-06-15'),(3,'Meera',1,1,210000,'2018-01-10'),
 (4,'Karan',1,2,150000,'2020-09-01'),(5,'Divya',1,2,145000,'2021-02-20'),(6,'Arjun',2,1,230000,'2016-11-11'),
 (7,'Sneha',2,6,160000,'2019-04-04'),(8,'Vikram',2,6,120000,'2022-07-19'),(9,'Pooja',3,NULL,180000,'2014-08-08'),
 (10,'Rahul',3,9,90000,'2021-05-05'),(11,'Neha',3,10,95000,'2022-12-01'),(12,'Imran',4,NULL,110000,'2019-10-10'),
 (13,'Lata',4,12,70000,'2023-01-15'),(14,'Sameer',NULL,13,130000,'2023-06-01');
INSERT INTO customers VALUES
 (1,'Acme Corp','Bangalore','2023-01-05'),(2,'Globex','Mumbai','2023-02-11'),(3,'Initech','Pune','2023-03-20'),
 (4,'Umbrella','Delhi','2023-05-02'),(5,'Hooli','Bangalore','2023-07-14'),(6,'Stark Ltd','Mumbai','2024-01-09');
INSERT INTO products VALUES
 (1,'Laptop','Electronics',80000),(2,'Monitor','Electronics',15000),(3,'Keyboard','Accessories',2500),
 (4,'Mouse','Accessories',1200),(5,'Desk','Furniture',12000),(6,'Chair','Furniture',9000),(7,'Headset','Accessories',4000),(8,'Webcam','Accessories',3500);
INSERT INTO orders VALUES
 (1,1,'2024-01-10','DELIVERED'),(2,1,'2024-02-15','DELIVERED'),(3,2,'2024-02-20','CANCELLED'),(4,2,'2024-03-01','DELIVERED'),
 (5,3,'2024-03-05','SHIPPED'),(6,1,'2024-03-18','DELIVERED'),(7,4,'2024-04-02','DELIVERED'),(8,5,'2024-04-10','PENDING'),
 (9,3,'2024-04-22','DELIVERED'),(10,2,'2024-05-01','DELIVERED');
INSERT INTO order_items VALUES
 (1,1,2),(1,4,2),(2,2,3),(2,3,3),(3,5,1),(4,1,1),(4,7,2),(5,6,4),(5,5,2),(6,3,10),(6,4,10),
 (7,1,1),(7,2,2),(8,7,1),(9,6,2),(9,4,1),(10,2,1),(10,3,1),(10,4,1);
INSERT INTO logins VALUES
 (1,'2024-05-01'),(1,'2024-05-02'),(1,'2024-05-03'),(1,'2024-05-05'),(2,'2024-05-01'),(2,'2024-05-03'),
 (3,'2024-05-02'),(3,'2024-05-03'),(3,'2024-05-04'),(3,'2024-05-05'),(3,'2024-05-06'),(4,'2024-05-04'),(1,'2024-05-03');
"""

# (id, title, level, prompt, solution, ordered, hint, topic)
_RAW = [
    ("sql-1", "Engineers earning above 150k", 1, "List name and salary of employees in department 1 earning more than 150000, highest salary first.",
     "SELECT name, salary FROM employees WHERE department_id = 1 AND salary > 150000 ORDER BY salary DESC, name", True, "WHERE with two conditions + ORDER BY.", "basics"),
    ("sql-2", "Headcount per department", 1, "Return each department name and its number of employees (include departments with zero employees).",
     "SELECT d.name, COUNT(e.id) AS headcount FROM departments d LEFT JOIN employees e ON e.department_id = d.id GROUP BY d.id, d.name", False, "LEFT JOIN so empty departments survive; COUNT(e.id) not COUNT(*).", "joins"),
    ("sql-3", "Employees without a department", 1, "Return the names of employees who have no department.",
     "SELECT name FROM employees WHERE department_id IS NULL", False, "NULL needs IS NULL, not = NULL.", "basics"),
    ("sql-4", "Second highest salary", 2, "Return the second highest DISTINCT salary in the company as a single value column named second_highest.",
     "SELECT MAX(salary) AS second_highest FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)", False, "Max of salaries below the max — or DENSE_RANK() = 2.", "subqueries"),
    ("sql-5", "Employees earning more than their manager", 2, "Return the names of employees whose salary is greater than their manager's salary.",
     "SELECT e.name FROM employees e JOIN employees m ON e.manager_id = m.id WHERE e.salary > m.salary", False, "Self-join employees to employees on manager_id.", "joins"),
    ("sql-6", "Top earner per department", 2, "For each department (by name), return the employee(s) with the highest salary: department, name, salary. Include ties.",
     "SELECT d.name AS department, e.name, e.salary FROM employees e JOIN departments d ON d.id = e.department_id "
     "WHERE e.salary = (SELECT MAX(salary) FROM employees x WHERE x.department_id = e.department_id)", False,
     "Correlated subquery for the max per department, or RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) = 1.", "window"),
    ("sql-7", "Rank salaries within departments", 2, "Return department_id, name, salary and dense_rank of salary within the department (highest = 1) as rnk, for employees with a department. Order by department_id, rnk, name.",
     "SELECT department_id, name, salary, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk FROM employees WHERE department_id IS NOT NULL ORDER BY department_id, rnk, name", True,
     "DENSE_RANK() OVER (PARTITION BY … ORDER BY salary DESC).", "window"),
    ("sql-8", "Revenue per order", 1, "Return order id and total amount (sum of qty × price) for every order, ordered by id.",
     "SELECT o.id, SUM(oi.qty * p.price) AS total FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id GROUP BY o.id ORDER BY o.id", True,
     "Join orders → order_items → products and SUM(qty*price).", "aggregation"),
    ("sql-9", "Customers who never ordered", 1, "Return names of customers with no orders at all.",
     "SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL", False, "Anti-join: LEFT JOIN … WHERE right side IS NULL (or NOT EXISTS).", "joins"),
    ("sql-10", "Best customers by delivered revenue", 2, "Return customer name and total revenue from DELIVERED orders only, highest first, top 3.",
     "SELECT c.name, SUM(oi.qty * p.price) AS revenue FROM customers c JOIN orders o ON o.customer_id = c.id AND o.status = 'DELIVERED' "
     "JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id GROUP BY c.id, c.name ORDER BY revenue DESC LIMIT 3", True,
     "Filter status before aggregating, ORDER BY revenue DESC LIMIT 3.", "aggregation"),
    ("sql-11", "Categories with revenue over 100k", 2, "Return product category and total revenue (all non-cancelled orders), only for categories whose revenue exceeds 100000.",
     "SELECT p.category, SUM(oi.qty * p.price) AS revenue FROM order_items oi JOIN products p ON p.id = oi.product_id JOIN orders o ON o.id = oi.order_id "
     "WHERE o.status <> 'CANCELLED' GROUP BY p.category HAVING SUM(oi.qty * p.price) > 100000", False, "WHERE filters rows, HAVING filters groups.", "aggregation"),
    ("sql-12", "Monthly revenue with running total", 3, "For non-cancelled orders, return month (YYYY-MM) as month, that month's revenue, and the running total up to that month as running_total, ordered by month.",
     "WITH m AS (SELECT substr(o.ordered_on, 1, 7) AS month, SUM(oi.qty * p.price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id "
     "JOIN products p ON p.id = oi.product_id WHERE o.status <> 'CANCELLED' GROUP BY month) "
     "SELECT month, revenue, SUM(revenue) OVER (ORDER BY month) AS running_total FROM m ORDER BY month", True,
     "CTE for monthly totals, then SUM() OVER (ORDER BY month).", "window"),
    ("sql-13", "Month-over-month change", 3, "Using monthly non-cancelled revenue, return month, revenue and the difference from the previous month as change (NULL for the first month), ordered by month.",
     "WITH m AS (SELECT substr(o.ordered_on, 1, 7) AS month, SUM(oi.qty * p.price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id "
     "JOIN products p ON p.id = oi.product_id WHERE o.status <> 'CANCELLED' GROUP BY month) "
     "SELECT month, revenue, revenue - LAG(revenue) OVER (ORDER BY month) AS change FROM m ORDER BY month", True, "LAG(revenue) OVER (ORDER BY month).", "window"),
    ("sql-14", "Repeat customers", 2, "Return names of customers with at least 2 non-cancelled orders.",
     "SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status <> 'CANCELLED' GROUP BY c.id, c.name HAVING COUNT(*) >= 2", False,
     "GROUP BY customer, HAVING COUNT(*) >= 2.", "aggregation"),
    ("sql-15", "Products never sold", 1, "Return names of products that appear in no order.",
     "SELECT name FROM products p WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id)", False, "NOT EXISTS subquery.", "subqueries"),
    ("sql-16", "Duplicate logins", 1, "Return user_id and login_date for rows that appear more than once in logins, with the count as n.",
     "SELECT user_id, login_date, COUNT(*) AS n FROM logins GROUP BY user_id, login_date HAVING COUNT(*) > 1", False, "GROUP BY all columns, HAVING COUNT(*) > 1.", "aggregation"),
    ("sql-17", "Longest login streak", 3, "For each user, return user_id and their longest streak of consecutive login days as streak (ignore duplicate rows).",
     "WITH d AS (SELECT DISTINCT user_id, login_date FROM logins), g AS (SELECT user_id, login_date, "
     "julianday(login_date) - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) AS grp FROM d), "
     "s AS (SELECT user_id, grp, COUNT(*) AS len FROM g GROUP BY user_id, grp) SELECT user_id, MAX(len) AS streak FROM s GROUP BY user_id", False,
     "Gaps-and-islands: date − row_number is constant within a streak.", "window"),
    ("sql-18", "Org chart depth", 3, "Using a recursive CTE, return every employee name with their level in the hierarchy (top-level managers = 1) as level, ordered by level then name.",
     "WITH RECURSIVE t(id, name, level) AS (SELECT id, name, 1 FROM employees WHERE manager_id IS NULL "
     "UNION ALL SELECT e.id, e.name, t.level + 1 FROM employees e JOIN t ON e.manager_id = t.id) SELECT name, level FROM t ORDER BY level, name", True,
     "WITH RECURSIVE: anchor = manager_id IS NULL, recursive step joins children.", "recursive"),
    ("sql-19", "Percent of company payroll", 2, "Return each department name and its share of total payroll as pct (rounded to 1 decimal), for employees with a department.",
     "SELECT d.name, ROUND(100.0 * SUM(e.salary) / (SELECT SUM(salary) FROM employees WHERE department_id IS NOT NULL), 1) AS pct "
     "FROM employees e JOIN departments d ON d.id = e.department_id GROUP BY d.id, d.name", False, "Multiply by 100.0 to avoid integer division.", "aggregation"),
    ("sql-20", "Order status pivot", 2, "Return one row per customer name with columns delivered and cancelled counting orders in each status (0 if none), for customers who have orders.",
     "SELECT c.name, SUM(CASE WHEN o.status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered, SUM(CASE WHEN o.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled "
     "FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name", False, "Conditional aggregation: SUM(CASE WHEN … THEN 1 ELSE 0 END).", "aggregation"),
    ("sql-21", "Nth order per customer", 2, "Return customer_id and the ordered_on date of each customer's FIRST order as first_order.",
     "SELECT customer_id, ordered_on AS first_order FROM (SELECT customer_id, ordered_on, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_on) rn FROM orders) WHERE rn = 1", False,
     "ROW_NUMBER() per customer ordered by date, keep rn = 1 (or MIN).", "window"),
    ("sql-22", "Above department average", 2, "Return names of employees whose salary is above their department's average salary.",
     "SELECT name FROM employees e WHERE department_id IS NOT NULL AND salary > (SELECT AVG(salary) FROM employees x WHERE x.department_id = e.department_id)", False,
     "Correlated subquery or AVG() OVER (PARTITION BY department_id).", "subqueries"),
]

CHALLENGES = [{"id": r[0], "title": r[1], "level": r[2], "prompt": r[3], "solution": r[4], "ordered": r[5], "hint": r[6], "topic": r[7]} for r in _RAW]
BY_ID = {c["id"]: c for c in CHALLENGES}
MAX_ROWS = 200


def _db():
    c = sqlite3.connect(":memory:")
    c.executescript(SCHEMA + SEED)
    return c


def _run(conn, sql, budget=2.0):
    deadline = time.time() + budget
    conn.set_progress_handler(lambda: 1 if time.time() > deadline else 0, 10000)
    cur = conn.execute(sql)
    cols = [d[0] for d in cur.description] if cur.description else []
    rows = cur.fetchmany(MAX_ROWS + 1)
    return cols, [list(r) for r in rows]


def _norm(v):
    if isinstance(v, float):
        return round(v, 4) if v != int(v) else int(v)
    return v


def run(sql, challenge_id=None):
    sql = (sql or "").strip().rstrip(";").strip()
    if not sql:
        return {"ok": False, "error": "empty query"}
    if ";" in sql:
        return {"ok": False, "error": "run one statement at a time"}
    conn = _db()
    t0 = time.time()
    try:
        cols, rows = _run(conn, sql)
    except sqlite3.OperationalError as e:
        msg = str(e)
        return {"ok": False, "error": "query took too long (2s limit)" if "interrupted" in msg else msg}
    except Exception as e:
        return {"ok": False, "error": str(e)}
    out = {"ok": True, "columns": cols, "rows": rows[:MAX_ROWS], "truncated": len(rows) > MAX_ROWS, "ms": int((time.time() - t0) * 1000)}
    ch = BY_ID.get(challenge_id or "")
    if ch:
        ecols, erows = _run(_db(), ch["solution"])
        got = [tuple(_norm(v) for v in r) for r in rows]
        exp = [tuple(_norm(v) for v in r) for r in erows]
        same = got == exp if ch["ordered"] else sorted(got, key=repr) == sorted(exp, key=repr)
        out["correct"] = bool(same)
        out["expected"] = {"columns": ecols, "rows": erows}
        if not same:
            if len(got) != len(exp):
                out["feedback"] = "Expected %d row(s), got %d." % (len(exp), len(got))
            elif len(cols) != len(ecols):
                out["feedback"] = "Expected %d column(s), got %d." % (len(ecols), len(cols))
            elif ch["ordered"] and sorted(got, key=repr) == sorted(exp, key=repr):
                out["feedback"] = "Right rows, wrong order — check ORDER BY."
            else:
                out["feedback"] = "Some values differ from the expected result."
    return out


def schema_info():
    conn = _db()
    tables = []
    for (name,) in conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"):
        cols = [(r[1], r[2]) for r in conn.execute("PRAGMA table_info(%s)" % name)]
        n = conn.execute("SELECT COUNT(*) FROM %s" % name).fetchone()[0]
        tables.append({"name": name, "columns": cols, "rows": n})
    return tables


def public_challenges():
    return [{k: c[k] for k in ("id", "title", "level", "prompt", "hint", "topic", "ordered")} for c in CHALLENGES]
