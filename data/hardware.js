/* Computer organization & hardware (deep-dive edition). */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "hw",
  title: "Computer Hardware",
  icon: "🔩",
  blurb: "Computer organization: CPU pipeline, memory hierarchy & caches, number representation, storage and I/O.",
  topics: [
    {
      id: "hw-cpu",
      title: "CPU Architecture & Pipelining",
      tags: ["cpu", "architecture"],
      brushup: [
        "Von Neumann: one memory for code + data (the 'von Neumann bottleneck'). Modern CPUs are 'modified Harvard' — split L1 instruction/data caches over unified lower levels.",
        "Instruction cycle: Fetch → Decode → Execute → Memory access → Write-back.",
        "Pipelining overlaps stages so ideal throughput ≈ 1 instruction/cycle (CPI → 1). Deeper pipeline = higher clock, but bigger stall/mispredict penalties.",
        "Hazards: structural (resource conflict), data (RAW/WAR/WAW — forwarding, stalls, renaming), control (branches — prediction + speculation).",
        "Superscalar = issue &gt;1 instruction/cycle. Out-of-order execution + register renaming hide latency. SIMD (SSE/AVX/NEON) = one op over many lanes.",
        "RISC (fixed-length, load/store, many registers, simple decode) vs CISC (variable-length, memory operands, microcoded). x86 cracks CISC into RISC-like µops internally.",
        "Amdahl's Law: speedup ≤ 1 / ((1−p) + p/s). Gustafson's Law: bigger problems get more parallel benefit.",
      ],
      detail: `
<h2>The classic 5-stage pipeline</h2>
<pre><code>cycle:   1    2    3    4    5    6    7
I1:      IF   ID   EX   MEM  WB
I2:           IF   ID   EX   MEM  WB
I3:                IF   ID   EX   MEM  WB
I4:                     IF   ID   EX   MEM  WB</code></pre>
<p>Non-pipelined, 4 instructions × 5 cycles = 20 cycles. Pipelined, once the pipe is full one instruction retires every cycle → ~8 cycles. Pipelining doesn't reduce a single instruction's latency; it increases throughput.</p>

<h2>Hazards and their fixes</h2>
<h3>Data hazard (RAW — read after write)</h3>
<pre><code>add r1, r2, r3     // r1 written in WB (cycle 5)
sub r4, r1, r5     // needs r1 in EX (cycle 4) — too early!</code></pre>
<ul>
<li><b>Forwarding/bypassing</b>: route the ALU output straight to the next instruction's input, before write-back. Solves most cases with zero stall.</li>
<li><b>Load-use hazard</b>: a value coming from memory (MEM stage) still isn't ready for the very next instruction — needs a 1-cycle stall (or the compiler schedules an independent instruction into the slot).</li>
</ul>
<h3>Control hazard (branches)</h3>
<p>The branch outcome isn't known until EX, so the CPU has already fetched 1–3 wrong instructions. A <b>branch predictor</b> guesses:</p>
<ul>
<li>Static: "backward branches taken" (loops), forward not taken.</li>
<li>Dynamic: 2-bit saturating counters per branch; tournament/perceptron/TAGE predictors reach &gt;95–99%.</li>
</ul>
<p>A misprediction flushes the wrongly-fetched instructions — ~15–20 cycles on a deep modern core. This is why branchless code or sorted data can be dramatically faster in hot loops.</p>
<h3>Structural hazard</h3>
<p>Two instructions want the same unit in the same cycle (e.g. a single memory port for both IF and MEM). Fixed by duplicating the resource (split caches) or pipelining/scheduling access.</p>
<h3>WAR / WAW (false dependencies)</h3>
<p>Not real data flow — just reuse of the same register name. <b>Register renaming</b> maps architectural registers to a large physical register file, so independent instructions that happen to name the same register don't serialize.</p>

<h2>Extracting instruction-level parallelism</h2>
<ul>
<li><b>Superscalar</b>: multiple execution ports; issue e.g. 4–6 µops/cycle.</li>
<li><b>Out-of-order execution</b>: a reservation station / scheduler holds a window (100s) of decoded instructions and dispatches any whose operands are ready; a reorder buffer retires them in program order (so exceptions and architectural state stay precise).</li>
<li><b>Speculative execution</b>: run past unresolved branches and even past potential faults; squash on misprediction. (This is what Spectre/Meltdown abused — speculative loads left measurable cache traces.)</li>
</ul>

<h2>SIMD & vectorization</h2>
<pre><code>// scalar: 8 iterations
for (i = 0; i &lt; 8; i++) c[i] = a[i] + b[i];
// SIMD (AVX2, 256-bit): one instruction adds 8 int32 lanes at once</code></pre>
<p>Compilers auto-vectorize simple loops; misaligned data, aliasing, and branches inside the loop block it. Explicit intrinsics or libraries (BLAS) push further.</p>

<h2>Amdahl vs Gustafson</h2>
<p><b>Amdahl</b> (fixed problem size): if a fraction <code>p</code> is parallelizable and the rest serial, max speedup with s processors is <code>1 / ((1−p) + p/s)</code>. 10% serial ⇒ ≤ 10× no matter how many cores. <b>Gustafson</b> (scale the problem with the machine): in practice bigger machines tackle bigger problems, where the serial fraction shrinks relatively, so real-world scaling is better than Amdahl's pessimism.</p>

<h2>RISC vs CISC today</h2>
<table>
<tr><th></th><th>RISC (ARM, RISC-V)</th><th>CISC (x86-64)</th></tr>
<tr><td>Instruction length</td><td>fixed (2/4 bytes)</td><td>variable (1–15 bytes)</td></tr>
<tr><td>Memory operands</td><td>load/store only</td><td>most instructions</td></tr>
<tr><td>Decode</td><td>simple, parallel</td><td>complex; splits into µops</td></tr>
<tr><td>Registers</td><td>many (31+)</td><td>fewer architecturally (16), many physical via renaming</td></tr>
</table>
<p>The line is blurry: x86 chips are RISC-like microarchitectures behind a CISC decoder; ARM has added rich instructions. Power efficiency and licensing, more than raw ISA, drive the ARM-in-servers/laptops trend.</p>`,
      diagram: `<svg viewBox="0 0 380 130" xmlns="http://www.w3.org/2000/svg" font-family="monospace" font-size="11">
<g text-anchor="middle">
<rect x="10" y="20" width="60" height="26" fill="#3b82f6"/><text x="40" y="37" fill="#fff">IF</text>
<rect x="80" y="20" width="60" height="26" fill="#3b82f6"/><text x="110" y="37" fill="#fff">ID</text>
<rect x="150" y="20" width="60" height="26" fill="#3b82f6"/><text x="180" y="37" fill="#fff">EX</text>
<rect x="220" y="20" width="60" height="26" fill="#3b82f6"/><text x="250" y="37" fill="#fff">MEM</text>
<rect x="290" y="20" width="60" height="26" fill="#3b82f6"/><text x="320" y="37" fill="#fff">WB</text>
</g>
<g stroke="#888"><line x1="70" y1="33" x2="80" y2="33"/><line x1="140" y1="33" x2="150" y2="33"/><line x1="210" y1="33" x2="220" y2="33"/><line x1="280" y1="33" x2="290" y2="33"/></g>
<text x="190" y="75" text-anchor="middle" fill="#d97706">forwarding: EX/MEM output → EX input of the next instr</text>
<path d="M250 46 C250 62 180 62 180 46" stroke="#d97706" fill="none" stroke-width="1.5"/>
<text x="190" y="105" text-anchor="middle" fill="#888">one instruction retires per cycle when the pipe is full</text>
</svg>`,
      diagramCaption: "5-stage pipeline with a forwarding path that resolves most read-after-write hazards without stalling.",
      pitfalls: [
        "Assuming branchy code is free — a mispredict costs ~15–20 cycles; branchless or sorted data can win big.",
        "Ranking CPUs by clock speed alone — IPC, cache size, and memory latency dominate real workloads.",
        "Thinking more pipeline stages always help — stall and flush penalties scale with depth (the Pentium 4 lesson).",
        "Ignoring that speculative/OoO execution makes microbenchmarks lie (warm-up, dead-code elimination).",
        "Forgetting that false sharing / memory latency, not the ALU, is usually the real bottleneck.",
      ],
      interviewQs: [
        "What is a pipeline hazard? Name the three types and how each is handled.",
        "How does branch prediction work and what does a misprediction cost?",
        "What do out-of-order execution and register renaming buy you?",
        "RISC vs CISC — and why has the distinction blurred?",
        "State Amdahl's law and its implication for multicore scaling.",
        "Why can sorting an array before a branchy loop make it faster?",
      ],
    },

    {
      id: "hw-memory-hierarchy",
      title: "Memory Hierarchy & Caches",
      tags: ["memory", "cache", "performance"],
      brushup: [
        "Registers (~0.3 ns) → L1 (~1 ns) → L2 (~4 ns) → L3 (~15 ns) → DRAM (~80–100 ns) → SSD (~50–100 µs) → HDD (~5–10 ms). Each level: bigger, slower, cheaper per byte.",
        "Locality: temporal (reuse soon) + spatial (nearby addresses next). Caches exploit both; a cache line is typically 64 bytes.",
        "Mapping: direct-mapped (1 slot per set), N-way set-associative (N slots), fully associative. Replacement: LRU / pseudo-LRU.",
        "Write policy: write-through (simple, more traffic) vs write-back (dirty bit, less traffic). Allocate vs no-allocate on a write miss.",
        "3 C's of misses: compulsory (first touch), capacity (working set > cache), conflict (too many hot addresses map to one set).",
        "Cache-friendly code: sequential/row-major access, contiguous data (arrays > linked lists), struct-of-arrays, loop blocking/tiling, avoid false sharing, prefetch-friendly strides.",
        "Cache coherence (MESI/MOESI) keeps multicore caches consistent — cross-core sharing of a written line is expensive.",
      ],
      detail: `
<h2>Why the hierarchy exists</h2>
<p>SRAM (cache) is fast but ~$$$ per bit and physically large per cell; DRAM is dense and cheap but slower; flash/disk are cheaper still and slower again. No single technology gives "large AND fast AND cheap". The hierarchy fakes it: because programs exhibit locality, a small fast cache serves the vast majority of accesses.</p>
<p><b>Average memory access time</b> = hit_time + miss_rate × miss_penalty. With a 1 ns L1, 3% miss rate, 100 ns penalty: 1 + 0.03×100 = 4 ns. Cut the miss rate to 1% and it's 2 ns — a 2× speedup from code layout alone.</p>

<h2>How a cache lookup works (set-associative)</h2>
<pre><code>address = [ tag | set index | block offset ]
           ↑      ↑            ↑ which byte in the 64B line
           ↑      ↑ which set (row of N ways)
           ↑ compared against the tags of all N ways in that set (in parallel)</code></pre>
<p>Direct-mapped is fast and cheap but two hot addresses that map to the same set evict each other repeatedly (conflict misses). Higher associativity reduces conflicts at the cost of power and a slightly slower hit. L1 is usually 8-way; L3 can be 16-way+.</p>

<h2>Row-major vs column-major traversal</h2>
<pre><code>// FAST: consecutive addresses; one 64B line load serves ~16 int32s
for (let i = 0; i &lt; N; i++)
  for (let j = 0; j &lt; N; j++) sum += a[i][j];

// SLOW: stride of a whole row (N×4 bytes) — a cache miss almost every access
for (let j = 0; j &lt; N; j++)
  for (let i = 0; i &lt; N; i++) sum += a[i][j];</code></pre>
<p>For a large matrix the difference is often 5–10×. Matrix multiply gets another big win from <b>blocking/tiling</b>: process sub-blocks that fit in L1 so each loaded element is reused many times before eviction.</p>

<h2>False sharing</h2>
<p>Two threads on two cores write two <em>different</em> variables that happen to share one 64-byte cache line. Every write forces the other core's copy of the line to Invalid (coherence), so the line ping-pongs across the interconnect and both threads stall — even though there's no logical contention.</p>
<pre><code>// bad: per-thread counters packed together
struct { long a; long b; } counters;   // a and b on the same line

// fix: pad to a full line
struct { long value; char pad[56]; } counter;   // one per thread, own line
</code></pre>

<h2>Cache coherence (MESI)</h2>
<p>Each cached line is in one of: <b>M</b>odified (dirty, this core owns it exclusively), <b>E</b>xclusive (clean, only this core has it), <b>S</b>hared (clean, multiple cores may have it), <b>I</b>nvalid. To write, a core must get the line into M, which invalidates every other copy via a coherence message. This is precisely why lock-free counters and shared flags across cores are costly — every write is a coherence transaction.</p>

<h2>Prefetching</h2>
<p>Hardware prefetchers detect sequential and simple strided patterns and fetch ahead of the CPU. Random or pointer-chasing access defeats them. Software prefetch intrinsics (<code>__builtin_prefetch</code>) can help for known-ahead-of-time addresses (e.g. linked-list traversal where you can peek two nodes ahead).</p>

<h2>The TLB (a cache for the page table)</h2>
<p>Translating a virtual address needs a page-table walk (up to 4 memory accesses on x86-64). The TLB caches recent translations. A TLB miss on a large working set is a real cost; <b>huge pages</b> (2 MB / 1 GB instead of 4 KB) cover more memory per TLB entry and cut misses for big datasets (databases, JVMs).</p>

<h2>Practical takeaways</h2>
<ul>
<li>Prefer arrays and contiguous layouts; a linked list's pointer-chasing misses on every node.</li>
<li>For hot structs, put the fields you access together <em>near</em> each other; consider struct-of-arrays for bulk processing.</li>
<li>An O(n²) algorithm on a cache-friendly array can beat an O(n log n) one that thrashes, for small–medium n.</li>
<li>When parallelizing accumulators, give each thread its own cache line.</li>
</ul>`,
      diagram: `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="11">
<polygon points="160,8 210,44 110,44" fill="#3b82f6"/><text x="160" y="34" fill="#fff" text-anchor="middle">Registers</text>
<rect x="110" y="44" width="100" height="22" fill="#4f8ff0"/><text x="160" y="59" fill="#fff" text-anchor="middle">L1 / L2 / L3</text>
<rect x="80" y="66" width="160" height="26" fill="#7aa9e0"/><text x="160" y="83" fill="#fff" text-anchor="middle">DRAM  ~100 ns</text>
<rect x="50" y="92" width="220" height="26" fill="#a9c6ea"/><text x="160" y="109" fill="#333" text-anchor="middle">SSD  ~100 µs</text>
<rect x="20" y="118" width="280" height="26" fill="#cfdcee"/><text x="160" y="135" fill="#333" text-anchor="middle">HDD / Network  ~10 ms</text>
<text x="308" y="16" text-anchor="end" fill="#888">faster, smaller ↑</text>
<text x="308" y="168" text-anchor="end" fill="#888">cheaper, larger ↓  (~10× latency per step)</text>
</svg>`,
      diagramCaption: "Each level down is roughly an order of magnitude slower and larger; locality keeps most accesses near the top.",
      pitfalls: [
        "Linked lists / trees of small nodes thrash the cache — arrays win for small n despite 'worse' asymptotics.",
        "Ignoring false sharing when parallelizing per-thread counters/accumulators.",
        "Column-major traversal of a row-major array (or vice versa).",
        "Assuming an O(n log n) algorithm always beats O(n²) — constants and cache behavior dominate at small n.",
        "Benchmarking with a working set that fits in L2, then being surprised in production when it doesn't.",
        "Forgetting the recursion/DFS stack and pointer overhead in memory-bound analysis.",
      ],
      interviewQs: [
        "Why is row-major traversal of a 2D array faster than column-major?",
        "What is false sharing and how do you eliminate it?",
        "Explain the three types of cache misses (compulsory/capacity/conflict).",
        "Write-through vs write-back caching — trade-offs.",
        "What does the MESI protocol do and why does cross-core sharing cost?",
        "How does loop tiling/blocking improve cache behavior in matrix multiply?",
      ],
    },

    {
      id: "hw-numbers",
      title: "Number Representation & Floating Point",
      tags: ["binary", "encoding"],
      brushup: [
        "Unsigned n bits: 0 … 2ⁿ−1. Two's complement signed: −2ⁿ⁻¹ … 2ⁿ⁻¹−1; negate = invert all bits + 1; single zero; MSB is the sign.",
        "Overflow: unsigned wraps mod 2ⁿ (defined); signed overflow is undefined behavior in C/C++ (compilers optimize assuming it can't happen).",
        "IEEE-754 double = 1 sign + 11 exponent (bias 1023) + 52 fraction bits ⇒ ~15–17 significant decimal digits. float = 1+8+23 ⇒ ~7 digits.",
        "0.1 + 0.2 ≠ 0.3 exactly — most decimal fractions aren't representable in binary. Compare with an epsilon; use integers or a decimal type for money.",
        "Special values: +0 / −0, ±Infinity (overflow, x/0), NaN (0/0, √−1, ∞−∞). NaN ≠ NaN; use isNaN / x !== x.",
        "Shifts: <code>x&lt;&lt;k</code> = ×2ᵏ; arithmetic <code>&gt;&gt;</code> keeps the sign; logical <code>&gt;&gt;&gt;</code> fills 0. JS bitwise ops are 32-bit signed.",
        "Text: ASCII (7-bit), UTF-8 (1–4 bytes, ASCII-compatible, dominant on the web), UTF-16 (JS/Java strings, surrogate pairs), endianness matters for multi-byte binary formats.",
      ],
      detail: `
<h2>Two's complement — why every CPU uses it</h2>
<pre><code>  5  = 0000 0101
 -5  = 1111 1011      (invert 0000 0101 → 1111 1010, then + 1)
  5 + (-5):
       0000 0101
     + 1111 1011
     = 1 0000 0000    → drop the carry-out → 0000 0000 = 0  ✓</code></pre>
<p>One representation of zero (sign-magnitude and one's complement have +0 and −0), and the <em>same</em> adder/subtractor hardware works for signed and unsigned values — you just interpret the bits differently. The range is asymmetric: for 8 bits, −128 has no positive counterpart, so <code>-INT_MIN</code> overflows.</p>

<h2>IEEE-754 floating point</h2>
<pre><code>value = (-1)^sign × 1.fraction × 2^(exponent - bias)</code></pre>
<p>0.1 in binary is <code>0.0001100110011…</code> (repeating). It gets rounded to fit 52 fraction bits, so the stored value is slightly more than 0.1. Errors accumulate across operations, and they're not associative: <code>(a + b) + c</code> can differ from <code>a + (b + c)</code>.</p>
<pre><code>0.1 + 0.2                              // 0.30000000000000004
0.1 + 0.2 === 0.3                      // false
Math.abs((0.1 + 0.2) - 0.3) &lt; 1e-9     // true — compare with a tolerance
(0.1).toFixed(20)                      // "0.10000000000000000555"</code></pre>
<h3>Money</h3>
<p>Never accumulate currency in a float. Store integer minor units (cents/paise), or use <code>BigDecimal</code> / <code>decimal</code> / a dedicated money type. For display, format at the very end.</p>
<h3>Precision limits</h3>
<p>A double represents every integer exactly up to 2⁵³ (9,007,199,254,740,992). Beyond that, consecutive integers can't all be stored — which is why JSON with large 64-bit IDs sent to JavaScript must use strings, and why <code>BigInt</code> exists.</p>

<h2>Special values</h2>
<table>
<tr><th>Result</th><th>Produced by</th></tr>
<tr><td>+Infinity / −Infinity</td><td>overflow, <code>1/0</code>, <code>Math.log(0)</code></td></tr>
<tr><td>NaN</td><td><code>0/0</code>, <code>Infinity - Infinity</code>, <code>Math.sqrt(-1)</code>, <code>parseInt("x")</code></td></tr>
<tr><td>−0</td><td><code>-1 * 0</code>, <code>1/-Infinity</code> — equals +0 with <code>===</code> but <code>Object.is(-0, 0)</code> is false</td></tr>
</table>
<p>NaN propagates: any arithmetic with NaN yields NaN, and <code>NaN !== NaN</code>. Test with <code>Number.isNaN(x)</code>.</p>

<h2>Bit operations</h2>
<pre><code>x &lt;&lt; 3       // x * 8
x &gt;&gt; 1       // floor(x / 2) for non-negative; arithmetic shift preserves sign for negatives
x &gt;&gt;&gt; 1      // logical shift (JS): fills with 0, treats x as unsigned 32-bit
x &amp; (x - 1)  // clear the lowest set bit
x &amp; -x       // isolate the lowest set bit
(x ^ y) &lt; 0  // true iff x and y have opposite signs
</code></pre>
<p><b>JS caveat</b>: <code>&amp; | ^ ~ &lt;&lt; &gt;&gt;</code> coerce operands to 32-bit signed integers. <code>1 &lt;&lt; 31</code> is −2147483648; <code>2 ** 32 | 0</code> is 0. Use <code>&gt;&gt;&gt; 0</code> to read a value as unsigned, or <code>BigInt</code> for 64-bit work.</p>

<h2>Character encodings</h2>
<ul>
<li><b>ASCII</b>: 0–127, one byte, English only.</li>
<li><b>UTF-8</b>: variable 1–4 bytes; ASCII bytes are unchanged; self-synchronizing; the web default. A "character" (code point) may be multiple bytes, and a user-perceived glyph (grapheme) may be multiple code points (emoji + skin tone).</li>
<li><b>UTF-16</b>: JS and Java <code>String</code>; characters above U+FFFF use two 16-bit surrogates, so <code>str.length</code> counts UTF-16 units, not code points. Iterate with <code>for…of</code> or <code>[...str]</code> for code points.</li>
</ul>
<h3>Endianness</h3>
<p>Big-endian stores the most-significant byte first; little-endian (x86, ARM default) stores the least-significant first. Matters when reading/writing binary file formats, network protocols (network byte order = big-endian), or memory-mapping a struct across machines.</p>`,
      pitfalls: [
        "Using == / === on floats; accumulating rounding error across a loop.",
        "Storing or summing money as a float.",
        "Signed integer overflow in C/C++ is UB — the compiler may assume `i + 1 > i` always.",
        "`int` overflow in hash functions / prefix sums for large n — use 64-bit / BigInt.",
        "Assuming `str.length` is the number of characters (it's UTF-16 code units).",
        "JS bitwise ops on values ≥ 2³¹ — they silently truncate to 32-bit signed.",
        "Comparing with NaN and expecting a sensible result.",
      ],
      interviewQs: [
        "How is −7 represented in 8-bit two's complement? What is −128 + −1?",
        "Why does 0.1 + 0.2 !== 0.3, and how should you handle currency?",
        "What is NaN, how is it produced, and how do you test for it?",
        "Difference between arithmetic and logical right shift.",
        "Why must large 64-bit IDs be sent to JavaScript as strings?",
        "What is endianness and when do you have to care?",
      ],
    },

    {
      id: "hw-storage",
      title: "Storage — HDD, SSD, RAID",
      tags: ["storage", "io"],
      brushup: [
        "HDD: spinning platters + moving head. Access = seek (~5–10 ms) + rotational latency (~2–4 ms) + transfer. Sequential ≫ random; ~100–200 IOPS.",
        "SSD: NAND flash, no moving parts. ~50–100 µs latency, 10K–1M IOPS. Reads/programs at page granularity; erases at (larger) block granularity.",
        "Flash wear: cells survive limited program/erase cycles; the controller does wear leveling + garbage collection; TRIM tells it which LBAs are free.",
        "Write amplification: one logical write triggers several physical writes (GC, metadata, read-modify-write). Over-provisioning and sequential writes reduce it.",
        "RAID: 0 (stripe — speed, zero redundancy), 1 (mirror), 5 (stripe + distributed parity, survives 1 disk), 6 (2 parity, survives 2), 10 (stripe of mirrors).",
        "RAID is availability, not backup. Add snapshots, off-site copies, checksums for bit rot (ZFS/Btrfs).",
        "Durability terms: RPO (how much data you can lose), RTO (how fast you recover).",
      ],
      detail: `
<h2>Why sequential I/O dominates design</h2>
<p>On an HDD, a random read pays a full seek + rotation before any data moves — milliseconds, i.e. millions of CPU cycles. So storage engines are built to turn random writes into sequential ones: <b>write-ahead logs</b>, <b>LSM trees</b> (buffer in memory, flush sorted runs, compact in the background), append-only segment files (Kafka). Even on SSDs, sequential access is kinder to the flash translation layer, the internal parallelism, and read-ahead.</p>

<h2>SSD internals</h2>
<p>You cannot overwrite a flash page in place — the whole erase block (often 128–256 pages) must be erased first. So the controller writes new data to a fresh page elsewhere and updates the <b>FTL</b> (flash translation layer) mapping logical → physical. Stale pages pile up until <b>garbage collection</b> relocates the still-valid pages of a block and erases it. Consequences:</p>
<ul>
<li>A near-full SSD slows down (little room for GC to work) — keep ~10–20% free / over-provisioned.</li>
<li><b>TRIM</b>: the OS tells the SSD "these LBAs are deleted" so GC doesn't bother copying them.</li>
<li><b>Wear leveling</b> spreads writes so no block dies early; SMART attributes report remaining life.</li>
<li>Sudden power loss can lose the FTL's in-flight mapping unless the drive has power-loss protection (capacitors) — enterprise SSDs have it, most consumer ones don't.</li>
</ul>

<h2>RAID trade-offs</h2>
<table>
<tr><th>Level</th><th>Usable capacity</th><th>Fault tolerance</th><th>Read</th><th>Write</th><th>Notes</th></tr>
<tr><td>0</td><td>100%</td><td>none</td><td>fast</td><td>fast</td><td>any disk fails → all data lost</td></tr>
<tr><td>1</td><td>50%</td><td>1 disk</td><td>fast (2 copies)</td><td>~1 disk</td><td>simple, common for OS drives</td></tr>
<tr><td>5</td><td>(n−1)/n</td><td>1 disk</td><td>fast</td><td>slow (parity read-modify-write)</td><td>long, risky rebuilds on large disks</td></tr>
<tr><td>6</td><td>(n−2)/n</td><td>2 disks</td><td>fast</td><td>slower (2 parities)</td><td>preferred for big arrays</td></tr>
<tr><td>10</td><td>50%</td><td>1 per mirror pair</td><td>fast</td><td>fast</td><td>best performance + resilience, pricey</td></tr>
</table>
<p>RAID 5's weakness with modern multi-TB disks: a rebuild reads every other disk in full for many hours, and an unrecoverable read error or a second disk failure during that window loses the array. RAID 6 or RAID 10 is the safer choice at scale.</p>

<h2>Access-time ladder (rules of thumb)</h2>
<table>
<tr><td>L1 cache reference</td><td>~1 ns</td></tr>
<tr><td>Main memory reference</td><td>~100 ns</td></tr>
<tr><td>SSD random read</td><td>~16–100 µs</td></tr>
<tr><td>Round trip within a datacenter</td><td>~0.5 ms</td></tr>
<tr><td>HDD seek</td><td>~5–10 ms</td></tr>
<tr><td>Round trip CA ↔ Netherlands</td><td>~150 ms</td></tr>
</table>

<h2>Storage interfaces</h2>
<p>SATA (AHCI, one command queue, ~600 MB/s) → SAS (enterprise, dual-port) → <b>NVMe</b> (rides PCIe lanes directly, thousands of deep queues, µs latency, GB/s). NVMe removed the SCSI/AHCI software stack overhead that used to dominate SSD latency.</p>`,
      pitfalls: [
        "Treating RAID as a backup — an accidental delete, corruption, or ransomware replicates instantly to all disks.",
        "RAID 5 on large modern drives — rebuild time + second-failure risk; use RAID 6 or 10.",
        "Benchmarking with sequential I/O, then being surprised by random-I/O latency in production.",
        "Running an SSD near full and blaming the drive for slowdowns (GC starvation).",
        "Assuming a consumer SSD survives power loss with data intact (no PLP capacitors).",
        "Ignoring RPO/RTO — 'we have backups' means nothing without a tested restore.",
      ],
      interviewQs: [
        "Why is random I/O so much slower than sequential on an HDD? On an SSD?",
        "How do SSDs handle writes, and what is write amplification?",
        "Compare RAID 5, 6, and 10 — capacity, fault tolerance, performance.",
        "Why do log-structured storage engines (LSM trees, WAL) prefer sequential writes?",
        "What does TRIM do?",
        "What are RPO and RTO?",
      ],
    },

    {
      id: "hw-io",
      title: "I/O, Interrupts, DMA & System Calls",
      tags: ["io", "architecture"],
      brushup: [
        "Polling: CPU repeatedly checks a device status register — simple, wastes cycles. Interrupt-driven: the device signals the CPU when ready — efficient for slow/infrequent events.",
        "Interrupt flow: device raises IRQ → CPU finishes the current instruction → saves minimal context → jumps via the interrupt vector table to the ISR → ISR runs (interrupts partly masked) → restore → resume.",
        "DMA: a controller moves data device⇄memory without the CPU copying each byte; the CPU is interrupted only on completion.",
        "Memory-mapped I/O (device registers appear in the address space) vs port-mapped I/O (special IN/OUT instructions).",
        "Interrupt vs trap vs exception: async hardware signal vs deliberate software trap (syscall) vs synchronous error (page fault, divide-by-zero).",
        "Top half / bottom half: keep the ISR tiny; defer real work to a softirq / tasklet / workqueue / DPC.",
        "Buses: PCIe is point-to-point serial lanes (not a shared bus); NVMe, GPUs, NICs ride PCIe.",
      ],
      detail: `
<h2>Polling vs interrupts</h2>
<p>A disk read takes milliseconds; a keypress is seconds apart. Polling those burns the whole wait in a spin loop. With interrupts the CPU schedules other work and is notified asynchronously. But interrupts have overhead (context save, cache disturbance), so for <em>very high-rate</em> devices (10/100 GbE NICs, NVMe) systems switch to <b>polling</b> under load (Linux NAPI, DPDK, io_uring) — hybrid: interrupt to start, then poll while the queue stays busy.</p>

<h2>Interrupt handling in detail</h2>
<pre><code>1. Device asserts its IRQ line (or sends an MSI-X message over PCIe).
2. Interrupt controller (APIC) prioritizes and delivers it to a CPU.
3. CPU finishes the current instruction, pushes minimal state, masks equal/lower priority IRQs.
4. Looks up the handler in the Interrupt Descriptor / Vector Table by IRQ number.
5. ISR ("top half"): acknowledge the device, grab data quickly, schedule deferred work, return.
6. "Bottom half" (softirq/tasklet/workqueue) runs later with interrupts enabled to do the heavy lifting.
7. IRET restores state; the interrupted thread (or a newly scheduled one) resumes.</code></pre>
<p>Rules: ISRs must be short and must not block (no sleeping, no mutex that could be held by a thread). Long ISRs delay other interrupts and hurt latency.</p>

<h2>DMA</h2>
<pre><code>1. CPU programs the DMA engine: source address, destination address, byte count, direction.
2. CPU continues with other work.
3. DMA controller becomes bus master and streams data memory ⇄ device.
4. On completion (or error), DMA raises an interrupt; the ISR wakes the waiting thread.</code></pre>
<p>Without DMA ("programmed I/O") the CPU executes a load/store per word — acceptable for a UART, hopeless for a NIC at line rate. Caveats: the CPU's cached copy of a DMA buffer can be stale after a device write (or the device can read stale data before a cache flush), so drivers issue cache flush/invalidate or rely on cache-coherent DMA / an IOMMU.</p>

<h2>The system call path</h2>
<pre><code>user code: set up args in registers, execute the 'syscall' instruction
  → CPU switches to kernel mode (ring 0), jumps to the syscall entry point
  → kernel validates arguments (pointers, permissions), does the work
  → returns a result in a register, executes 'sysret' back to user mode</code></pre>
<p>A syscall is a <b>mode switch</b>, not a full context switch — cheaper, but still hundreds of cycles plus the pipeline/cache disturbance and (post-Spectre) mitigation costs. This is why batching matters: <code>writev</code>/<code>readv</code> (scatter-gather), <code>sendmmsg</code>, <code>epoll</code> (one syscall reports many ready sockets), and <code>io_uring</code> (submit/complete queues shared with the kernel, near-zero syscalls in steady state).</p>

<h2>Interrupt vs trap vs exception</h2>
<table>
<tr><th>Type</th><th>Trigger</th><th>Timing</th><th>Example</th></tr>
<tr><td>Interrupt (IRQ)</td><td>external device</td><td>asynchronous</td><td>packet arrived, timer tick, key press</td></tr>
<tr><td>Trap</td><td>deliberate instruction</td><td>synchronous</td><td>syscall, breakpoint, <code>int 0x80</code></td></tr>
<tr><td>Exception / fault</td><td>error during execution</td><td>synchronous</td><td>page fault, divide by zero, invalid opcode</td></tr>
</table>
<p>A page fault is often <em>recoverable</em> (the OS maps the page and restarts the instruction); a divide-by-zero usually delivers a signal that kills the process.</p>`,
      pitfalls: [
        "Doing heavy work in an interrupt handler — blocks other interrupts, wrecks latency. Defer to a bottom half.",
        "Forgetting DMA cache coherence — flush/invalidate buffers or use coherent DMA so the CPU and device agree.",
        "Treating a syscall as free — user/kernel transitions and copies add up in hot loops; batch them.",
        "Interrupt storms from a misbehaving device saturating a CPU — rate-limit / switch to polling.",
        "Assuming interrupts are cheaper than polling at 10GbE line rate — they aren't; NAPI/polling wins.",
        "Sleeping or taking a blocking lock inside an ISR.",
      ],
      interviewQs: [
        "Polling vs interrupt-driven I/O — trade-offs, and when does polling win?",
        "What does DMA do and why does it matter for throughput?",
        "Walk through what happens when a device raises an interrupt.",
        "Why split interrupt handling into top and bottom halves?",
        "What happens during a system call, and why is batching (epoll, io_uring) faster?",
        "Difference between an interrupt, a trap, and an exception.",
      ],
    },
  ],
});
