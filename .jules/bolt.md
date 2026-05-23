## 2024-05-23 - Concurrent PDF Parsing Performance Fix
**Learning:** Sequential file processing (like PDF parsing) in a Node.js single thread limits throughput unnecessarily when multiple files exist.
**Action:** Implemented a concurrent worker pool loop using an iterator and `Promise.all` to limit concurrency but still process multiple PDFs asynchronously in parallel, vastly improving overall processing speed for multiple invoices without hanging the single thread.
