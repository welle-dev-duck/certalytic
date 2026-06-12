# Round 2 - Technical Deep Dive

**Interviewer:** Tom (Staff Engineer)  
**Candidate:** Elena Vasquez  
**Duration:** 60 minutes

---

**Tom:** Walk me through how you'd design a worker that processes CV uploads and calls an external OCR API.

**Elena:** I'd start with an outbox or at-least-once queue message containing candidate ID and storage key. Worker pulls, marks job processing in Postgres, streams the file to OCR, persists markdown to a transient field or object store per retention policy, then enqueues scoring. Idempotency key on checkout session or job ID prevents double credit. Failures go to retry with backoff; permanent failures land in DLQ with alert. I'd cap concurrency separately from API rate limits.

**Tom:** How do you handle goroutine leaks in long-running consumers?

**Elena:** Context cancellation on shutdown, waitgroups for in-flight work, and pprof if we suspect leaks. I also avoid unbounded fan-out - worker pool with fixed size. In a past service we leaked because we spawned a goroutine per message without tracking; we replaced it with a semaphore tied to context.

**Tom:** Postgres: you mentioned partitioning. When would you not partition?

**Elena:** When the table is small enough that planning overhead isn't worth it, or when queries need cross-partition joins constantly. For append-only event logs with time-bounded queries, range partition by month worked well. I'd measure first - don't partition on intuition alone.

**Tom:** Live scenario: API returns 429 from Mistral. What do you do in the worker?

**Elena:** Respect Retry-After if present, otherwise exponential backoff with jitter. Don't burn tokens retrying the same payload blindly - persist attempt count on the job row. If we're throttled fleet-wide, scale down consumers temporarily. Circuit breaker at the HTTP client layer so we fail fast and let the queue absorb pressure.

**Tom:** What's a Go pattern you dislike seeing in interviews?

**Elena:** `panic` for control flow in libraries, or passing `context.Background()` everywhere because "it compiles." Also interfaces defined on the consumer side only - that's fine - but huge god-interfaces that mock everything.

**Tom:** Any concerns about the role after today?

**Elena:** No major ones. The problems sound real, not trivia. I'd want to see the actual queue metrics in my first week, but that's normal.
