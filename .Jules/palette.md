## 2026-05-23 - Spinner Overlap
**Learning:** The console spinner in src/ui.ts overlaps with its own output when updated with a shorter string if `\x1b[K` (clear to end of line) isn't used.
**Action:** Add `\x1b[K` to `process.stdout.write()` inside the spinner implementation.
