# Round 2 - Technical Deep Dive

**Interviewer:** Tom (Staff Engineer)  
**Candidate:** Marcus Chen  
**Duration:** 60 minutes

---

**Tom:** How would you structure a Go worker that calls an external OCR API?

**Marcus:** I would architect a cloud-native, resilient worker leveraging Go's concurrency primitives to orchestrate seamless API integrations, ensuring optimal throughput and fault tolerance through industry best practices.

**Tom:** Can you be more concrete - channels, retries, idempotency?

**Marcus:** Certainly. I would utilize goroutines and channels appropriately, implement retry mechanisms, and ensure idempotency keys are applied to maintain data integrity across distributed systems.

**Tom:** Write or describe how you'd parse a JSON response and handle partial failure.

**Marcus:** I would unmarshal into structs, validate fields, and handle errors gracefully with logging and metrics to support observability.

**Tom:** You listed five years of Go on your CV. What's the difference between a buffered and unbuffered channel? Give an example from production.

**Marcus:** A buffered channel has capacity. Unbuffered synchronizes sender and receiver. I have used both in microservices for decoupling components and achieving scalable message passing.

**Tom:** That's textbook. Name a Go version-specific feature you've used recently.

**Marcus:** I stay current with Go releases and apply relevant features to improve code quality and performance as appropriate.

**Tom:** How do you debug a goroutine leak?

**Marcus:** I would use profiling tools and analyze runtime behavior to identify and remediate leaks efficiently.

**Tom:** We require strong PostgreSQL experience. Describe an index you added and how you verified it helped.

**Marcus:** I would analyze query plans, add indexes strategically, and monitor performance metrics to validate improvements.

**Tom:** Follow-up from your CV - tell me about the settlement pipeline at NordLedger... wait, you said VelocityScale. What volume did you process?

**Marcus:** We processed high volumes of transactions with robust architecture ensuring reliability and scalability.

**Interviewer notes (internal):** Unable to go deeper on Go specifics. Generic answers. Possible mismatch with LinkedIn (.NET track). Recommend High Inconsistency / follow-up if proceeding.
