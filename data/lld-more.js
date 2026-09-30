/* More Low-Level Design problems — appended to the existing LLD section. */
(function () {
  const lld = (window.STUDY_SECTIONS || []).find((s) => s.id === "lld");
  if (!lld) return;
  lld.topics.push(
    {
      id: "lld-tictactoe-chess",
      title: "Design: Tic-Tac-Toe / Chess (Game Engines)",
      summary: "Board-game OOD: board, pieces, players, move validation and win detection — with O(1) tic-tac-toe win checks and polymorphic chess moves.",
      tags: ["lld", "game", "polymorphism"],
      brushup: [
        "Entities: Game, Board, Cell/Square, Piece (abstract), Player, Move, GameStatus.",
        "Tic-tac-toe O(1) win check: keep row/column/diagonal counters (+1 for X, −1 for O); a counter reaching ±n wins.",
        "Chess: each Piece subclass implements canMove(board, from, to) (polymorphism); Board validates path blocking, checks and special moves.",
        "Game loop: current player → get move → validate → apply → check end state → switch player.",
        "Keep move history (Command pattern) for undo and replay.",
        "Separate rules from UI; make players pluggable (Human, AI via Strategy).",
      ],
      detail: `
<h2>Tic-tac-toe with O(1) win detection</h2>
<pre><code>class TicTacToe {
    private final int n;
    private final int[] rows, cols;
    private int diag, anti, moves;
    private final char[][] grid;
    TicTacToe(int n) { this.n = n; rows = new int[n]; cols = new int[n]; grid = new char[n][n]; }

    /** @return 'X' or 'O' if that move wins, 'D' for draw, 0 to continue */
    char move(int r, int c, char p) {
        if (grid[r][c] != 0) throw new IllegalStateException("occupied");
        grid[r][c] = p; moves++;
        int d = p == 'X' ? 1 : -1;
        rows[r] += d; cols[c] += d;
        if (r == c) diag += d;
        if (r + c == n - 1) anti += d;
        if (Math.abs(rows[r]) == n || Math.abs(cols[c]) == n || Math.abs(diag) == n || Math.abs(anti) == n) return p;
        return moves == n * n ? 'D' : 0;
    }
}</code></pre>

<h2>Chess class sketch</h2>
<pre><code>abstract class Piece {
    final Color color;
    abstract boolean canMove(Board b, Square from, Square to);   // shape of the move only
}
class Knight extends Piece {
    boolean canMove(Board b, Square f, Square t) {
        int dx = Math.abs(f.x - t.x), dy = Math.abs(f.y - t.y);
        return dx * dy == 2 &amp;&amp; (t.piece == null || t.piece.color != color);
    }
}
class Rook extends Piece {
    boolean canMove(Board b, Square f, Square t) {
        return (f.x == t.x || f.y == t.y) &amp;&amp; b.pathClear(f, t) &amp;&amp; (t.piece == null || t.piece.color != color);
    }
}
class Game {
    Board board; Player white, black, turn; Deque&lt;Move&gt; history = new ArrayDeque&lt;&gt;(); GameStatus status;
    void play(Move m) {
        if (!m.piece().canMove(board, m.from(), m.to()) || board.leavesKingInCheck(m, turn)) throw new IllegalMoveException();
        board.apply(m); history.push(m);
        status = board.evaluate(opponent());       // CHECK, CHECKMATE, STALEMATE, ACTIVE
        turn = opponent();
    }
}</code></pre>

<h2>Discussion points</h2>
<ul><li>Special moves (castling, en passant, promotion) as Move subtypes.</li><li>Undo via history of Moves storing captured piece.</li><li>AI player via Strategy (minimax with alpha-beta).</li></ul>`,
      pitfalls: ["Scanning the whole board after every tic-tac-toe move when O(1) is possible.", "A giant switch on piece type instead of polymorphism.", "Mixing console I/O into game logic."],
      interviewQs: ["Design tic-tac-toe for an n×n board with O(1) win check.", "Design chess — how do pieces validate moves?", "How would you support undo?"],
      resources: [{ t: "LeetCode 348 — Design Tic-Tac-Toe", u: "https://leetcode.com/problems/design-tic-tac-toe/", k: "practice" }],
    },
    {
      id: "lld-library",
      title: "Design: Library Management System",
      summary: "Classic entity-heavy OOD: books vs copies, members, loans, reservations, fines and search.",
      tags: ["lld", "ood"],
      brushup: [
        "Separate <b>Book</b> (title, ISBN, authors) from <b>BookItem/Copy</b> (barcode, status, rack).",
        "Member (limits, active loans), Librarian, Loan (copy, member, due date, returned_at), Reservation (queue per book), Fine.",
        "Services: Catalog/Search (by title, author, subject), LoanService (checkout, return, renew), NotificationService (Observer).",
        "Rules as strategies: loan period/fine policy per member type.",
        "Concurrency: two members checking out the last copy → lock/compare-and-set on copy status.",
      ],
      detail: `
<pre><code>enum CopyStatus { AVAILABLE, LOANED, RESERVED, LOST }
record Book(String isbn, String title, List&lt;String&gt; authors, String subject) {}
class BookCopy { String barcode; Book book; volatile CopyStatus status; }
class Member { String id; MemberType type; List&lt;Loan&gt; activeLoans = new ArrayList&lt;&gt;(); }
class Loan { BookCopy copy; Member member; LocalDate issued, due; LocalDate returned; }

class LoanService {
    private final FinePolicy finePolicy;           // Strategy
    private final ReservationService reservations;
    private final Notifier notifier;                // Observer / event publisher

    synchronized Loan checkout(Member m, BookCopy c) {
        if (m.activeLoans.size() &gt;= m.type.maxLoans()) throw new LimitExceeded();
        if (c.status != CopyStatus.AVAILABLE &amp;&amp; !reservations.isFirstInQueue(m, c.book)) throw new NotAvailable();
        c.status = CopyStatus.LOANED;
        Loan l = new Loan(c, m, LocalDate.now(), LocalDate.now().plusDays(m.type.loanDays()));
        m.activeLoans.add(l);
        return l;
    }
    Money giveBack(Loan l) {
        l.returned = LocalDate.now();
        l.member.activeLoans.remove(l);
        Money fine = finePolicy.fineFor(l);
        if (reservations.hasWaiting(l.copy.book)) { l.copy.status = CopyStatus.RESERVED; notifier.bookReady(reservations.next(l.copy.book)); }
        else l.copy.status = CopyStatus.AVAILABLE;
        return fine;
    }
}</code></pre>`,
      pitfalls: ["Treating a book title and a physical copy as the same entity.", "Hard-coding fine rules.", "Ignoring the race on the last available copy."],
      interviewQs: ["Design a library management system.", "Book vs BookItem — why separate?", "How do reservations work when a book is returned?"],
      resources: [{ t: "awesome-low-level-design (GitHub)", u: "https://github.com/ashishps1/awesome-low-level-design", k: "repo" }],
    },
    {
      id: "lld-atm",
      title: "Design: ATM Machine",
      summary: "A State-pattern design with hardware abstractions: card reader, PIN validation, cash dispenser (Chain of Responsibility for denominations) and bank integration.",
      tags: ["lld", "state-pattern"],
      brushup: [
        "States: Idle → CardInserted → Authenticated → TransactionSelected → Dispensing → Idle (State pattern).",
        "Components: CardReader, Keypad, Screen, CashDispenser, ReceiptPrinter, BankService (remote).",
        "Transactions: Withdraw, Deposit, BalanceInquiry, Transfer (Command-like objects).",
        "Cash dispensing with <b>Chain of Responsibility</b>: 2000 → 500 → 200 → 100 handlers.",
        "Consistency with the bank: debit account first (idempotent request id), dispense, reverse on dispense failure.",
        "Security: PIN attempts limit, card retention, session timeout.",
      ],
      detail: `
<pre><code>interface AtmState {
    default void insertCard(Atm a, Card c) { throw new IllegalStateException(); }
    default void enterPin(Atm a, String pin) { throw new IllegalStateException(); }
    default void withdraw(Atm a, int amount) { throw new IllegalStateException(); }
    default void eject(Atm a) { a.setState(new IdleState()); }
}
class AuthenticatedState implements AtmState {
    public void withdraw(Atm a, int amount) {
        String txId = UUID.randomUUID().toString();
        if (!a.bank().debit(a.card(), amount, txId)) { a.screen().show("Insufficient funds"); return; }
        if (!a.dispenser().canDispense(amount) || !a.dispenser().dispense(amount)) {
            a.bank().reverse(txId);                        // compensate
            a.screen().show("Unable to dispense");
        }
        a.setState(new IdleState());
    }
}
abstract class NoteHandler {                           // Chain of Responsibility
    NoteHandler next; final int note; int count;
    void dispense(int amount) {
        int n = Math.min(amount / note, count);
        count -= n; int rest = amount - n * note;
        if (rest &gt; 0) { if (next == null) throw new IllegalStateException(); next.dispense(rest); }
    }
}</code></pre>`,
      pitfalls: ["Dispensing cash before the bank confirms the debit.", "No reversal path when dispensing fails.", "Unlimited PIN attempts."],
      interviewQs: ["Design an ATM.", "How do you dispense an amount with minimal notes?", "What happens if cash dispensing fails after the debit?"],
      resources: [{ t: "Refactoring.Guru — State pattern", u: "https://refactoring.guru/design-patterns/state", k: "article" }, { t: "Refactoring.Guru — Chain of Responsibility", u: "https://refactoring.guru/design-patterns/chain-of-responsibility", k: "article" }],
    },
    {
      id: "lld-pubsub",
      title: "Design: In-Memory Pub/Sub / Message Queue",
      summary: "A thread-safe publish-subscribe system with topics, subscribers, offsets and delivery threads — a concurrency-focused LLD favourite.",
      tags: ["lld", "concurrency", "observer"],
      brushup: [
        "Entities: Broker, Topic (append-only list of messages), Subscriber (callback), Subscription (offset per subscriber per topic).",
        "Publishing appends under a lock (or lock-free queue); subscribers consume from their own offset (Kafka-like) → independent speeds, replay.",
        "Each subscriber served by its own worker thread that waits on a condition/blocking queue.",
        "Delivery semantics: at-least-once (advance offset after callback success), retries, DLQ.",
        "Backpressure: bounded buffers; slow subscribers don't block publishers.",
        "Extensions: filtering, partitions for parallelism, persistence.",
      ],
      detail: `
<pre><code>class Topic {
    final String name;
    private final List&lt;Message&gt; log = new ArrayList&lt;&gt;();
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition hasNew = lock.newCondition();
    void publish(Message m) { lock.lock(); try { log.add(m); hasNew.signalAll(); } finally { lock.unlock(); } }
    Message awaitAt(int offset) throws InterruptedException {
        lock.lock();
        try { while (offset &gt;= log.size()) hasNew.await(); return log.get(offset); }
        finally { lock.unlock(); }
    }
}
class SubscriberWorker implements Runnable {
    private final Topic topic; private final Subscriber sub; private int offset;   // own offset
    public void run() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                Message m = topic.awaitAt(offset);
                sub.onMessage(m);            // retry/DLQ policy here
                offset++;                    // at-least-once: advance after success
            } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }
    }
}
class Broker {
    Map&lt;String, Topic&gt; topics = new ConcurrentHashMap&lt;&gt;();
    ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();
    void subscribe(String topic, Subscriber s) { pool.submit(new SubscriberWorker(topics.get(topic), s)); }
    void publish(String topic, Message m) { topics.get(topic).publish(m); }
}</code></pre>`,
      pitfalls: ["Publisher calling subscribers synchronously (one slow subscriber blocks all).", "await() without a while loop.", "Unbounded memory growth without retention."],
      interviewQs: ["Design an in-memory pub/sub.", "How do subscribers consume at different speeds?", "How do you support replay?", "How do you make it thread-safe?"],
      resources: [{ t: "Refactoring.Guru — Observer", u: "https://refactoring.guru/design-patterns/observer", k: "article" }],
    },
    {
      id: "lld-filesystem",
      title: "Design: In-Memory File System (Composite Pattern)",
      summary: "Files and directories as a tree using the Composite pattern — path resolution, ls/mkdir/read/write, sizes and permissions.",
      tags: ["lld", "composite"],
      brushup: [
        "<b>Composite</b>: abstract Entry (name, parent, size()) with File (content) and Directory (children map) subclasses.",
        "Directory.size() = sum of children sizes (recursive); File.size() = content length.",
        "Path resolution: split by '/', walk from root; create intermediate dirs for mkdir -p.",
        "Children in a TreeMap for sorted ls output.",
        "Extensions: permissions, symlinks, search by name/extension (Visitor or Specification pattern), locking for concurrency.",
      ],
      detail: `
<pre><code>abstract class Entry {
    final String name; Directory parent;
    Entry(String name) { this.name = name; }
    abstract long size();
}
class FileEntry extends Entry {
    private final StringBuilder content = new StringBuilder();
    FileEntry(String n) { super(n); }
    void append(String s) { content.append(s); }
    String read() { return content.toString(); }
    long size() { return content.length(); }
}
class Directory extends Entry {
    final Map&lt;String, Entry&gt; children = new TreeMap&lt;&gt;();
    Directory(String n) { super(n); }
    long size() { return children.values().stream().mapToLong(Entry::size).sum(); }
}
class FileSystem {
    private final Directory root = new Directory("");
    private Directory mkdirs(String[] parts, int upto) {
        Directory cur = root;
        for (int i = 0; i &lt; upto; i++) {
            if (parts[i].isEmpty()) continue;
            Entry e = cur.children.computeIfAbsent(parts[i], Directory::new);
            if (!(e instanceof Directory d)) throw new IllegalArgumentException(parts[i] + " is a file");
            d.parent = cur; cur = d;
        }
        return cur;
    }
    void mkdir(String path) { String[] p = path.split("/"); mkdirs(p, p.length); }
    void addContent(String path, String s) {
        String[] p = path.split("/");
        Directory dir = mkdirs(p, p.length - 1);
        ((FileEntry) dir.children.computeIfAbsent(p[p.length - 1], FileEntry::new)).append(s);
    }
    List&lt;String&gt; ls(String path) { /* resolve; if file → [name], else children keys */ return List.of(); }
}</code></pre>`,
      pitfalls: ["instanceof checks everywhere instead of polymorphic methods.", "Recomputing directory sizes on every call for huge trees (cache + invalidate on write).", "Not handling '/' root and trailing slashes."],
      interviewQs: ["Design an in-memory file system (LeetCode 588).", "Why is Composite a good fit?", "How would you implement find by extension?"],
      resources: [{ t: "LeetCode 588 — Design In-Memory File System", u: "https://leetcode.com/problems/design-in-memory-file-system/", k: "practice" }, { t: "Refactoring.Guru — Composite", u: "https://refactoring.guru/design-patterns/composite", k: "article" }],
    },
    {
      id: "lld-movie-booking",
      title: "Design: Movie Ticket Booking (BookMyShow LLD)",
      summary: "The object model and concurrency control for booking seats in shows — the LLD twin of the ticketing HLD problem.",
      tags: ["lld", "concurrency", "booking"],
      brushup: [
        "Entities: City, Cinema, Screen, Seat (type), Movie, Show (movie + screen + time), ShowSeat (per-show seat state), Booking, Payment, User.",
        "ShowSeat status: AVAILABLE → LOCKED (with expiry, userId) → BOOKED.",
        "Seat locking: a SeatLockProvider interface (in-memory with ConcurrentHashMap, or Redis/DB) — Strategy for testability.",
        "Booking flow: select seats → lock atomically (all or none) → pay → confirm → release on failure/timeout.",
        "Pricing strategy per seat type/show time; Observer for notifications.",
      ],
      detail: `
<pre><code>interface SeatLockProvider {
    boolean lock(Show show, List&lt;Seat&gt; seats, String user);      // all-or-nothing
    void unlock(Show show, List&lt;Seat&gt; seats, String user);
    boolean isLockedBy(Show show, Seat seat, String user);
}
class InMemorySeatLockProvider implements SeatLockProvider {
    private final Duration ttl;
    private final Map&lt;String, SeatLock&gt; locks = new ConcurrentHashMap&lt;&gt;();   // key = showId:seatId
    public synchronized boolean lock(Show show, List&lt;Seat&gt; seats, String user) {
        Instant now = Instant.now();
        for (Seat s : seats) {
            SeatLock l = locks.get(key(show, s));
            if (l != null &amp;&amp; l.expires().isAfter(now) &amp;&amp; !l.user().equals(user)) return false;
        }
        for (Seat s : seats) locks.put(key(show, s), new SeatLock(user, now.plus(ttl)));
        return true;
    }
    ...
}
class BookingService {
    Booking create(String user, Show show, List&lt;Seat&gt; seats) {
        if (show.bookedSeats().stream().anyMatch(seats::contains)) throw new SeatTaken();
        if (!locks.lock(show, seats, user)) throw new SeatTemporarilyUnavailable();
        return repo.save(new Booking(user, show, seats, BookingStatus.CREATED));
    }
    void confirm(Booking b, PaymentResult p) {
        for (Seat s : b.seats()) if (!locks.isLockedBy(b.show(), s, b.user())) throw new LockExpired();
        b.confirm(); b.show().markBooked(b.seats()); locks.unlock(b.show(), b.seats(), b.user());
    }
}</code></pre>`,
      pitfalls: ["Seat status on the Seat entity instead of per show.", "Locking seats one by one without all-or-nothing semantics.", "Confirming after the lock expired."],
      interviewQs: ["Design BookMyShow classes.", "How do you lock seats safely for concurrent users?", "Where does seat state live — Seat or ShowSeat?"],
      resources: [{ t: "awesome-low-level-design — BookMyShow", u: "https://github.com/ashishps1/awesome-low-level-design", k: "repo" }],
    },
    {
      id: "lld-snake-ladder-cache",
      title: "Design: Snake & Ladder and a TTL Cache with Eviction Policies",
      summary: "Two quick machine-coding rounds: a configurable board game and a generic cache with pluggable eviction and expiry.",
      tags: ["lld", "machine-coding"],
      brushup: [
        "Snake & ladder: Board (size, jumps map start→end), Dice (Strategy: normal, crooked), Players queue, winner detection.",
        "Model snakes and ladders uniformly as <b>jumps</b>; validate no cycles.",
        "Cache: Cache&lt;K,V&gt; with Storage + EvictionPolicy (LRU/LFU/FIFO as Strategy) + optional TTL per entry.",
        "LRU via doubly linked list + map; LFU via frequency buckets; TTL via expiry timestamps + lazy expiry on get + periodic cleanup (DelayQueue/scheduled task).",
        "Machine-coding rubric: working code, clean interfaces, extensibility, tests/demo main.",
      ],
      detail: `
<h2>Snake & Ladder core</h2>
<pre><code>class Game {
    private final int size; private final Map&lt;Integer, Integer&gt; jumps; private final Dice dice;
    private final Deque&lt;Player&gt; turns;
    Player play() {
        while (true) {
            Player p = turns.poll();
            int next = p.position() + dice.roll();
            if (next &lt;= size) p.moveTo(jumps.getOrDefault(next, next));
            if (p.position() == size) return p;
            turns.offer(p);
        }
    }
}</code></pre>
<h2>Cache with pluggable eviction and TTL</h2>
<pre><code>interface EvictionPolicy&lt;K&gt; { void accessed(K k); void removed(K k); K evict(); }
class Cache&lt;K, V&gt; {
    record Entry&lt;V&gt;(V value, long expiresAt) {}
    private final Map&lt;K, Entry&lt;V&gt;&gt; map = new HashMap&lt;&gt;();
    private final EvictionPolicy&lt;K&gt; policy; private final int capacity;
    synchronized V get(K k) {
        Entry&lt;V&gt; e = map.get(k);
        if (e == null) return null;
        if (e.expiresAt() &lt; System.currentTimeMillis()) { map.remove(k); policy.removed(k); return null; }  // lazy expiry
        policy.accessed(k); return e.value();
    }
    synchronized void put(K k, V v, long ttlMs) {
        if (!map.containsKey(k) &amp;&amp; map.size() &gt;= capacity) { K victim = policy.evict(); map.remove(victim); }
        map.put(k, new Entry&lt;&gt;(v, System.currentTimeMillis() + ttlMs)); policy.accessed(k);
    }
}</code></pre>`,
      pitfalls: ["Hard-coding the eviction algorithm into the cache.", "Only lazy expiry → memory filled with expired entries.", "Game loops that never end on invalid boards (cycles)."],
      interviewQs: ["Design snake and ladder.", "Design a cache with pluggable eviction policies and TTL.", "How would you make the cache thread-safe with high concurrency?"],
      resources: [{ t: "LeetCode 460 — LFU Cache", u: "https://leetcode.com/problems/lfu-cache/", k: "practice" }],
    },
  );
})();
