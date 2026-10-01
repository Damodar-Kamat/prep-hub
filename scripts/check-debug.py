#!/usr/bin/env python3
"""Every debugging exercise: buggy code must FAIL its tests, the solution must PASS."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from interview_os import debugbank, tools

bad = 0
for e in debugbank.EXERCISES:
    r1 = tools.run_code(e["lang"], e["code"] + "\n" + e["test"], timeout=10)
    r2 = tools.run_code(e["lang"], e["solution"] + "\n" + e["test"], timeout=10)
    buggy_passes = debugbank.PASS in r1.get("stdout", "")
    fixed_passes = debugbank.PASS in r2.get("stdout", "")
    ok = (not buggy_passes) and fixed_passes
    bad += not ok
    print("%s %-28s buggy=%s fixed=%s %s" % ("✓" if ok else "✗", e["id"], "fail" if not buggy_passes else "PASS!", "pass" if fixed_passes else "FAIL!",
                                         "" if fixed_passes else (r2.get("stderr", "")[-300:])))
print("%d/%d ok" % (len(debugbank.EXERCISES) - bad, len(debugbank.EXERCISES)))
sys.exit(1 if bad else 0)
