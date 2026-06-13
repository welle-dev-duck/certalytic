# Async job status → UI updates

How the legacy Laravel app surfaces screening progress, and what the Turborepo stack will do instead.

**Target decision:** Use **WebSockets** to push job status to the browser. This is an intentional improvement over the legacy app (which polled every 3–4 seconds). Stripe webhooks remain **server-only** for billing.

---

## Legacy reference (PHP - polling)

The Laravel app did **not** use WebSockets. It used Inertia partial reloads:

| Surface | Mechanism | Interval |
|---|---|---|
| Candidate show | `router.reload({ only: ['candidate', 'report'] })` | 4s |
| Role PDF export | `router.reload({ only: ['latestExport'] })` | 3s |
| Candidates list | None | - |

Workers updated `candidates.status` / `role_exports.status` in PostgreSQL; each poll was a full HTTP round-trip.

**References:** `php-migration/resources/js/components/candidates/screening-processing-status.tsx`, `php-migration/resources/js/components/roles/role-export-action.tsx`

Progress stages on the screening UI (“Extracting CV Data”, etc.) were **cosmetic** (elapsed-time animation). The server only exposed enum status values.

---

## Target architecture (WebSockets)

```
BullMQ worker                    Redis pub/sub              Express WS server           Browser
     │                                │                            │                      │
     │  UPDATE candidates SET status  │                            │                      │
     │───────────────────────────────►│                            │                      │
     │  PUBLISH job:candidate:{id}   │                            │                      │
     │───────────────────────────────►│──── subscribe ────────────►│                      │
     │                                │                            │  emit to room        │
     │                                │                            │─────────────────────►│
     │                                │                            │  candidate.updated   │
```

### Why Redis pub/sub

Workers run in the same Node process as the API today (`index.ts`), but publishing through Redis keeps workers decoupled from whichever HTTP/WS process holds open connections - same Redis instance BullMQ already uses.

### Event types

| Event | When emitted | Payload (minimal) |
|---|---|---|
| `candidate.updated` | Status change on screening job | `{ candidateId, organizationId, status, errorMessage? }` |
| `candidate.completed` | `status === 'complete'` | Above + signal to fetch full report |
| `role_export.updated` | Role PDF job status change | `{ roleExportId, roleId, organizationId, status, downloadUrl?, errorMessage? }` |

On `complete`, the client **invalidates or refetches** the React Query cache for the detail endpoint (report payload is too large to push on every tick).

### Rooms / subscriptions

Clients join rooms scoped by active organization after auth:

```
org:{organizationId}
```

Optionally also subscribe to entity-specific rooms when on a detail page:

```
candidate:{candidateId}
role_export:{roleExportId}
```

Server must verify the session user is a member of `organizationId` before joining a room.

### Auth

- Authenticate the WebSocket handshake with the **same session cookie** as REST (`better-auth` session).
- Reject anonymous connections.
- On org switch, leave old org room and join the new one.

**Suggested stack:** `ws` or `socket.io` on the Express server; `@socket.io/redis-adapter` or a thin Redis subscriber if using Socket.io with multiple instances later.

---

## Backend (`apps/backend`)

### New pieces

| Piece | Location | Responsibility |
|---|---|---|
| WS server | `src/realtime/ws.server.ts` | Attach to HTTP server, auth, rooms, emit |
| Publisher | `src/realtime/publisher.ts` | `publishCandidateUpdated(...)`, `publishRoleExportUpdated(...)` |
| Redis channel | `src/realtime/channels.ts` | Channel name constants |
| Worker hooks | screening + roles export workers | Call publisher after DB commit |

### Worker contract

After every status write:

```ts
await db.update(candidates).set({ status: 'processing' }).where(...);
await realtimePublisher.candidateUpdated({
  candidateId,
  organizationId,
  status: 'processing',
});
```

Publish **after** the database transaction commits so clients never see stale state.

### REST endpoints (still required)

WebSockets notify **that something changed**; REST remains source of truth for full payloads.

```
GET /api/candidates/:id          → full candidate + report when complete
GET /api/roles/:id/exports/latest → latest export row
```

Initial page load uses React Query `useQuery`; WS events trigger `invalidateQueries` or targeted `setQueryData` for status fields only.

### Status enums (unchanged)

**Candidate:** `pending` → `processing` → `complete` | `failed`

**Role export:** `pending` → `processing` → `complete` | `failed`

---

## Frontend (`apps/web`)

### Provider

```tsx
// providers/realtime-provider.tsx
// Connect on mount when session exists; reconnect with backoff; join org room
```

### Candidate show page

```tsx
const queryClient = useQueryClient();

useRealtimeEvent('candidate.updated', (payload) => {
  if (payload.candidateId !== id) return;

  if (payload.status === 'complete' || payload.status === 'failed') {
    queryClient.invalidateQueries({ queryKey: ['candidates', id] });
    return;
  }

  queryClient.setQueryData(['candidates', id], (old) =>
    old ? { ...old, status: payload.status, errorMessage: payload.errorMessage } : old,
  );
});
```

Port `ScreeningProcessingStatus` for the in-progress UI; keep cosmetic stage animation client-side unless backend later emits real `currentStep`.

### Role export

On `role_export.updated` with `status === 'complete'`, invalidate export query and trigger download (same UX as legacy `window.location.assign(download_url)`).

### Candidates list (enhancement)

Subscribe to `org:{organizationId}` and invalidate `['candidates']` when any `candidate.updated` fires - better than legacy, which did not update the list live.

### Fallback

If the socket disconnects, use a **slow poll** (`refetchInterval: 10000`) only while any in-flight job is visible on the current page, or refetch on `visibilitychange` / reconnect. Do not use 4s polling as the primary path.

---

## Webhooks (clarification)

| Mechanism | Direction | Purpose |
|---|---|---|
| **Stripe webhooks** | Stripe → backend | Billing, subscriptions, pack credits - unchanged |
| **WebSockets** | Backend → browser | Screening + role export job status |
| **Public API webhooks** (roadmap) | Certalytic → customer systems | Future external integrations - not migration MVP |

---

## Implementation checklist

**Status: implemented** (June 2026). Keep this section as reference for the architecture.

### Backend

- [x] Redis pub/sub channel naming + publisher helper (`src/realtime/`)
- [x] WS server on Express HTTP server with session auth
- [x] Room join authorized by org membership
- [x] Screening worker publishes on each status transition
- [x] Role export worker publishes on each status transition
- [x] `GET` detail endpoints remain for full payloads

### Frontend

- [x] `RealtimeProvider` + message handling (`providers/realtime-provider.tsx`)
- [x] Candidate show: WS-driven cache updates + invalidate on terminal state
- [x] Role export: WS-driven status + auto-download on complete
- [x] List invalidation on org-level candidate events
- [x] Reconnect with exponential backoff
- [x] `ScreeningProcessingStatus` loading UI ported

### Env (example)

```env
REALTIME_ENABLED=true
# Reuses REDIS_URL for pub/sub
```

---

## Optional later

- Granular `currentStep` in WS payload (requires worker instrumentation; legacy did not have this)
- Horizontal scale: Socket.io Redis adapter + sticky sessions
- SSE instead of WS if push is strictly server→client one-way (WS is fine for subscribe + future bidirectional features)
