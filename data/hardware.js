/* Computer organization & hardware. */
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
        "Von Neumann: shared memory for code + data (bottleneck). Harvard: separate — modern CPUs are 'modified Harvard' at the L1 cache level.",
        "Instruction cycle: Fetch → Decode → Execute → Memory → Write-back.",
        "Pipelining overlaps stages so ~1 instruction retires per cycle (ideal CPI = 1). Deeper pipeline = higher clock, costlier stalls.",
        "Hazards: structural (resource conflict), data (RAW/WAR/WAW — solved by forwarding/stalls), control (branches — solved by branch prediction + speculation).",
        "Superscalar = multiple pipelines (issue &gt;1/cycle). Out-of-order execution + register renaming hide latency. SIMD does one op on many data lanes.",
        "RISC (fixed-length, load/store, many registers) vs CISC (variable-length, rich instructions). x86 decodes CISC into RISC-like µops internally.",
      ],
      detail: `
<h2>The 5-stage pipeline</h2>
<pre><code>cycle:   1    2    3    4    5    6    7
I1:      IF   ID   EX   MEM  WB
I2:           IF   ID   EX   MEM  WB
I3:                IF   ID   EX   MEM  WB</code></pre>
<p>Without pipelining, I3 finishes at cycle 15. With it, cycle 7. Throughput ≈ 1 instr/cycle once the pipe is full.</p>
<h2>Hazards</h2>
<ul>
<li><b>Data (RAW)</b>: <code>add r1, r2, r3</code> then <code>sub r4, r1, r5</code> — r1 isn't written back yet. <i>Forwarding</i> routes the ALU result directly to the next instruction; a load-use still needs a 1-cycle stall.</li>
<li><b>Control</b>: a branch isn't resolved until EX, so the CPU guesses. A <i>branch predictor</i> (2-bit saturating counter, tournament, TAGE) reaches &gt;95% accuracy. A misprediction flushes the pipeline (~15–20 cycles on modern cores).</li>
<li><b>Structural</b>: two instructions want the same unit — replicate or schedule.</li>
</ul>
<h2>ILP techniques</h2>
<p>Out-of-order execution keeps a window of instructions and runs whichever have ready operands. Register renaming removes false (WAR/WAW) dependencies by mapping architectural registers to a larger physical file. Speculative execution runs past unresolved branches (and caused Spectre/Meltdown).</p>
<h2>Amdahl's Law</h2>
<p>Speedup ≤ 1 / ((1−p) + p/s), where p is the parallelizable fraction. If 10% is serial, max speedup is 10× no matter how many cores.</p>`,
      pitfalls: [
        "Assuming branchy code is free — mispredicts cost ~15–20 cycles; branchless / sorted data can be much faster.",
        "Ignoring that 'clock speed' alone doesn't rank CPUs — IPC, cache, and memory latency dominate real workloads.",
        "Thinking more pipeline stages always help — stall and mispredict penalties grow with depth (Pentium 4 lesson).",
      ],
      interviewQs: [
        "What is a pipeline hazard and how is each type handled?",
        "RISC vs CISC — and why does the line blur today?",
        "Explain Amdahl's law and its implication for multicore.",
      ],
    },
    {
      id: "hw-memory-hierarchy",
      title: "Memory Hierarchy & Caches",
      tags: ["memory", "cache", "performance"],
      brushup: [
        "Registers → L1 (~1 ns) → L2 (~4 ns) → L3 (~15 ns) → DRAM (~100 ns) → SSD (~100 µs) → HDD (~10 ms). Each level: bigger, slower, cheaper/byte.",
        "Locality: temporal (reuse soon) + spatial (nearby addresses) — caches exploit both; cache line is typically 64 bytes.",
        "Cache mapping: direct-mapped, set-associative (N-way), fully associative. Replacement: LRU/pseudo-LRU.",
        "Write policies: write-through (simple, slow) vs write-back (fast, needs dirty bits). Write-allocate vs no-allocate on a miss.",
        "Miss types (3 C's): compulsory (first access), capacity (working set &gt; cache), conflict (mapping collisions).",
        "Cache-friendly code: row-major traversal, contiguous data (arrays over linked lists), struct-of-arrays, blocking/tiling, avoid false sharing.",
      ],
      detail: `
<h2>Why the hierarchy exists</h2>
<p>Fast memory is expensive and small; large memory is slow. The hierarchy gives the illusion of a large, fast memory because most programs touch a small working set repeatedly (locality). Effective access time = hit_time + miss_rate × miss_penalty.</p>
<h2>Row-major vs column-major</h2>
<pre><code>// Fast: consecutive memory, one line load serves ~16 ints
for (let i = 0; i &lt; N; i++) for (let j = 0; j &lt; N; j++) sum += a[i][j];
// Slow: strides by a whole row each step → a cache miss per access
for (let j = 0; j &lt; N; j++) for (let i = 0; i &lt; N; i++) sum += a[i][j];</code></pre>
<h2>False sharing</h2>
<p>Two threads write different variables that sit on the <i>same 64-byte cache line</i>. Every write invalidates the other core's copy (cache-coherence ping-pong), killing scalability. Fix: pad/align hot per-thread data to separate lines.</p>
<h2>Cache coherence (MESI)</h2>
<p>Each line in each core's cache is Modified / Exclusive / Shared / Invalid. A write requires the line in M or E state; other copies are invalidated over the interconnect. This is what makes cross-core sharing expensive.</p>
<h2>TLB</h2>
<p>A cache of virtual→physical page translations. A TLB miss triggers a page-table walk (can be tens of cycles). Huge pages reduce TLB pressure for big datasets.</p>`,
      diagram: `<svg viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="11">
<polygon points="150,10 210,50 90,50" fill="#3b82f6"/><text x="150" y="40" fill="#fff" text-anchor="middle">Reg</text>
<rect x="90" y="50" width="120" height="24" fill="#4f8ff0"/><text x="150" y="66" fill="#fff" text-anchor="middle">L1 / L2 / L3</text>
<rect x="60" y="74" width="180" height="30" fill="#7aa9e0"/><text x="150" y="93" fill="#fff" text-anchor="middle">DRAM</text>
<rect x="30" y="104" width="240" height="30" fill="#a9c6ea"/><text x="150" y="123" fill="#333" text-anchor="middle">SSD</text>
<rect x="0" y="134" width="300" height="30" fill="#cfdcee"/><text x="150" y="153" fill="#333" text-anchor="middle">HDD / Network</text>
<text x="285" y="20" fill="#888" text-anchor="end">faster ↑  larger ↓</text>
</svg>`,
      diagramCaption: "Memory hierarchy — latency roughly 10× per level down.",
      pitfalls: [
        "Linked lists / pointer-chasing structures thrash the cache — arrays win despite 'worse' Big-O for small n.",
        "Ignoring false sharing when parallelizing a counter/accumulator per thread.",
        "Assuming an O(n log n) algorithm beats O(n²) on tiny inputs — constants and cache behavior dominate.",
      ],
      interviewQs: [
        "Why is iterating a 2D array row-major faster than column-major?",
        "What is false sharing and how do you fix it?",
        "Explain the three types of cache misses.",
      ],
    },
    {
      id: "hw-numbers",
      title: "Number Representation & Floating Point",
      tags: ["binary", "encoding"],
      brushup: [
        "Unsigned n bits: 0 … 2ⁿ−1. Two's complement signed: −2ⁿ⁻¹ … 2ⁿ⁻¹−1; negate = invert bits + 1; one zero; MSB is the sign.",
        "Overflow: unsigned wraps mod 2ⁿ; signed overflow is undefined behavior in C/C++.",
        "IEEE-754 double: 1 sign + 11 exponent (bias 1023) + 52 mantissa. ~15–17 significant decimal digits.",
        "0.1 + 0.2 ≠ 0.3 — decimals aren't exact in binary. Compare floats with an epsilon; use integers/decimal types for money.",
        "Special values: +0/−0, ±Infinity (overflow, x/0), NaN (0/0, sqrt(−1)); NaN ≠ NaN.",
        "Hex/octal/binary literals; bit shifts multiply/divide by powers of two; sign-extension on arithmetic right shift.",
      ],
      detail: `
<h2>Two's complement</h2>
<pre><code>  5  = 0000 0101
 -5  = 1111 1011   (invert 0000 0101 → 1111 1010, then +1)
  5 + (-5) = 1 0000 0000 → carry out discarded → 0  ✓</code></pre>
<p>One representation for zero, and the same adder hardware works for signed and unsigned — that's why every modern CPU uses it.</p>
<h2>IEEE-754</h2>
<pre><code>value = (-1)^sign × 1.mantissa × 2^(exponent - bias)</code></pre>
<p>0.1 in binary is <code>0.0001100110011…</code> repeating — it gets rounded to 53 bits, so it's slightly off. The error compounds across operations.</p>
<pre><code>0.1 + 0.2                // 0.30000000000000004
Math.abs((0.1 + 0.2) - 0.3) &lt; 1e-9   // true — the right way to compare</code></pre>
<h2>Money</h2>
<p>Store cents as integers, or use a decimal/BigDecimal type. Never accumulate currency in a float.</p>
<h2>Bit shifts</h2>
<pre><code>x &lt;&lt; 3   // x * 8
x &gt;&gt; 1   // floor(x / 2) for non-negative; arithmetic shift keeps sign
x &gt;&gt;&gt; 1  // logical shift (JS) — fills 0, treats x as unsigned 32-bit</code></pre>`,
      pitfalls: [
        "Using == on floats; accumulating rounding error in loops.",
        "Signed integer overflow in C/C++ is UB — compilers optimize assuming it can't happen.",
        "`int` overflow in hash functions / sums for large n — use 64-bit.",
        "JS bitwise operators coerce to 32-bit signed; `2**31 << 1` is wrong.",
      ],
      interviewQs: [
        "How is −7 stored in 8-bit two's complement?",
        "Why does 0.1 + 0.2 !== 0.3, and how do you handle currency?",
        "What is NaN and how do you test for it?",
      ],
    },
    {
      id: "hw-storage",
      title: "Storage — HDD, SSD, RAID",
      tags: ["storage", "io"],
      brushup: [
        "HDD: spinning platters + head. Latency = seek (~5–10 ms) + rotational (~2–4 ms) + transfer. Sequential ≫ random. ~100–200 IOPS.",
        "SSD: NAND flash, no moving parts. ~50–100 µs latency, 10k–1M IOPS. Reads/writes in pages; erases in larger blocks.",
        "SSD wear: flash cells have limited P/E cycles; controller does wear leveling + garbage collection; TRIM tells it which blocks are free.",
        "Write amplification: one logical write causes several physical writes (GC, metadata). Over-provisioning helps.",
        "RAID: 0 (stripe, speed, no redundancy), 1 (mirror), 5 (stripe + distributed parity, survive 1 disk), 6 (2 parity), 10 (mirror+stripe).",
        "Durability layers: RAID ≠ backup. Add snapshots, off-site copies, checksums (bit rot).",
      ],
      detail: `
<h2>Why sequential I/O matters</h2>
<p>On an HDD, random reads pay the full seek + rotation each time. Databases and log-structured systems (LSM trees, append-only logs, Kafka) are designed to turn random writes into sequential ones. Even on SSDs, sequential access is friendlier to the flash translation layer and prefetchers.</p>
<h2>SSD internals</h2>
<p>You can't overwrite a flash page in place — the block must be erased first (and a block is many pages). The controller writes new data elsewhere, remaps the logical address (FTL), and later garbage-collects stale pages. This is why a full SSD slows down and why TRIM/over-provisioning matter.</p>
<h2>RAID trade-offs</h2>
<table>
<tr><th>Level</th><th>Usable capacity</th><th>Fault tolerance</th><th>Notes</th></tr>
<tr><td>0</td><td>100%</td><td>none</td><td>fastest, risky</td></tr>
<tr><td>1</td><td>50%</td><td>1 disk</td><td>simple, read-fast</td></tr>
<tr><td>5</td><td>(n−1)/n</td><td>1 disk</td><td>write penalty (parity); slow rebuilds</td></tr>
<tr><td>6</td><td>(n−2)/n</td><td>2 disks</td><td>safer for large arrays</td></tr>
<tr><td>10</td><td>50%</td><td>1 per mirror</td><td>fast + resilient, expensive</td></tr>
</table>
<h2>Access-time ladder (rules of thumb)</h2>
<p>L1 ~1 ns · RAM ~100 ns · SSD ~100 µs · HDD seek ~10 ms · same-DC round trip ~0.5 ms · cross-continent ~150 ms.</p>`,
      pitfalls: [
        "Treating RAID as a backup — a bad delete or ransomware replicates instantly.",
        "RAID 5 with large modern disks: rebuild time is long and stresses the other disks (second-failure risk).",
        "Benchmarking with sequential I/O then being surprised by random-I/O production latency.",
      ],
      interviewQs: [
        "Why is random I/O so much slower than sequential on an HDD?",
        "How do SSDs handle writes, and what is write amplification?",
        "Compare RAID 5, 6, and 10.",
      ],
    },
    {
      id: "hw-io",
      title: "I/O, Interrupts, DMA & Buses",
      tags: ["io", "architecture"],
      brushup: [
        "Polling: CPU repeatedly checks a device status — simple, wastes cycles. Interrupts: device signals the CPU when ready — efficient.",
        "Interrupt flow: device raises IRQ → CPU finishes current instruction → saves context → runs the ISR (handler) → restores → resumes.",
        "DMA: a controller moves data between device and memory without the CPU copying each byte; CPU is interrupted only on completion.",
        "Memory-mapped I/O (device registers in the address space) vs port-mapped I/O (special IN/OUT instructions).",
        "Buses: address + data + control lines. PCIe is point-to-point serial lanes (not a shared bus); NVMe rides PCIe for SSDs.",
        "Interrupt vs trap vs exception: async hardware signal vs deliberate syscall vs error (page fault, div-by-zero).",
      ],
      detail: `
<h2>Why interrupts beat polling</h2>
<p>A disk read takes milliseconds — millions of CPU cycles. Polling burns all of them. With an interrupt, the CPU schedules another thread and gets a signal when the data has landed.</p>
<h2>DMA</h2>
<pre><code>1. CPU programs the DMA controller: source, destination, length.
2. CPU goes off and does other work.
3. DMA controller transfers data bus-master style, memory ⇄ device.
4. On completion, DMA raises an interrupt; the ISR wakes the waiting thread.</code></pre>
<p>Without DMA ("programmed I/O") the CPU copies every word — fine for a keyboard, hopeless for a 10 GbE NIC.</p>
<h2>Interrupt handling details</h2>
<ul>
<li>An <b>interrupt vector table</b> maps IRQ number → handler address.</li>
<li>Handlers run with interrupts partly masked; keep them short (top half), defer work to a bottom half / tasklet / workqueue.</li>
<li>Priorities decide which interrupt preempts which.</li>
</ul>
<h2>Syscall path</h2>
<p>User code executes a trap instruction (<code>syscall</code>) → CPU switches to kernel mode, jumps to the syscall handler → kernel validates args, does the work → returns to user mode. The mode switch (not a full context switch) still costs hundreds of cycles, which is why batching syscalls (e.g. <code>writev</code>, <code>io_uring</code>) helps.</p>`,
      pitfalls: [
        "Doing heavy work in an interrupt handler (blocks other interrupts, hurts latency).",
        "Forgetting cache coherence with DMA — buffers may need flushing/invalidating so the CPU sees fresh data.",
        "Assuming a syscall is 'free' — the user/kernel transition and copies add up in hot loops.",
      ],
      interviewQs: [
        "Polling vs interrupt-driven I/O — trade-offs.",
        "What does DMA do and why does it matter for throughput?",
        "Difference between an interrupt, a trap, and an exception.",
      ],
    },
  ],
});
