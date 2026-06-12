# Web app deferred work

## Shared API types package

- [ ] Add `packages/api-types` (or OpenAPI codegen) for REST DTOs shared between `apps/backend` and `apps/web`
- [ ] Replace hand-maintained frontend types in `features/*/types.ts` with generated or shared Zod schemas
- [ ] Runtime-parse critical API responses at hook boundaries once types package exists

## Auth (intentionally unchanged)

- Client-only auth gate in `AuthProvider` — **no Next.js middleware redirect** (product decision)
