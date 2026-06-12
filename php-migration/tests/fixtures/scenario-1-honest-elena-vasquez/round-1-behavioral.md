# Round 1 - Get to know & Behavioral

**Interviewer:** Sarah (Engineering Manager)  
**Candidate:** Elena Vasquez  
**Duration:** 45 minutes

---

**Sarah:** Thanks for joining. What drew you to this platform role?

**Elena:** Honestly, two things. I've spent the last few years on payment pipelines where correctness and auditability matter a lot, and your product sits in a similar space - high-stakes decisions, strict EU constraints. Second, the stack description matches what I actually do day to day: Go services, Postgres, queue workers. I'm not looking to pivot languages again.

**Sarah:** Tell me about a time you owned a production incident.

**Elena:** Last year our settlement consumer started lagging during a partner outage. I was on-call. First I checked queue depth and error rates - retries were amplifying because upstream returned 503s with no jitter. I temporarily lowered concurrency, added exponential backoff in the worker, and posted updates every twenty minutes in the incident channel. Root cause was their rate limit change; we added a circuit breaker and a runbook entry. Recovery took about two hours; no duplicate settlements because our idempotency keys held.

**Sarah:** How do you collaborate with non-engineering teams?

**Elena:** On GDPR work I paired with our DPO early instead of throwing documentation over the wall. We whiteboarded data flows - what touches transient memory, what gets persisted - and I adjusted the design before writing code. Legal cared about sub-processor clarity; engineering cared about not blocking the queue. Weekly thirty-minute syncs kept both sides aligned.

**Sarah:** What would your current manager say you should keep working on?

**Elena:** Probably "say no sooner." I volunteer for platform cleanup that isn't always on the critical path. I'm better than I was, but I still need to check priority with my EM before picking up nice-to-have refactors.

**Sarah:** Any questions for us?

**Elena:** How do you split on-call between the Laravel monolith and the Go workers today? And where do you want the boundary in twelve months?
