# Architecture

## 1. System shape

Copper Spoon is one deployable Next.js App Router application backed by one PostgreSQL database. The browser, public routes, protected dashboard, authentication endpoints, server mutations, and read models live in the same codebase. A separate Express service would add operational and authorization complexity without a current requirement.

```text
Browser
  -> Next.js App Router
       -> Server Components (reads and rendered views)
       -> Server Actions (first-party form mutations)
       -> Route Handlers (Auth.js and intentional HTTP interfaces)
       -> Domain/service layer
       -> Prisma data access
  -> PostgreSQL
```

Vercel and Neon are the likely hosted-demo targets. Deployment remains portable to any supported Node.js host with PostgreSQL.

The implemented database boundary uses stable Prisma ORM 7.10, `@prisma/adapter-pg`, and `pg`. Prisma Client is generated as ESM TypeScript into ignored `src/generated/prisma`; `src/server/db/prisma.ts` is the reusable server-only singleton and fails closed when `DATABASE_URL` is absent. The CLI loads `.env` through `prisma7.config.ts`; Next.js loads runtime environment variables through its normal server environment support.

## 2. Rendering and interaction

- Server Components are the default for pages, layouts, data reads, and authorization-sensitive views.
- Client Components are limited to interactive islands such as cart state, filters, dialogs, and optimistic controls.
- Public menu reads may be cached with explicit tags. Availability/order/admin reads are dynamic or deliberately revalidated after mutation.
- Server Actions serve first-party form mutations. Route Handlers are reserved for Auth.js, health/integration needs, or an interface that genuinely benefits from HTTP semantics.
- Every Server Action and Route Handler is treated as directly callable: it validates input and performs its own authentication/authorization.

## 3. Code organization

```text
src/
  app/
    (public)/              Public route group (introduced with public features)
    admin/
      (protected)/         Protected dashboard route group
    api/                   Auth.js and explicit HTTP handlers
    layout.tsx
    page.tsx
  components/              Reusable, domain-neutral UI
  features/
    auth/
    cart/
    checkout/
    menu/
    orders/
    settings/
    staff/
  lib/                     Pure utilities, constants, formatting
  server/
    auth/                   Session and authorization helpers
    db/                     Prisma client and database helpers
    repositories/           Persistence operations where useful
    services/               Transactional use cases and policies
  types/                    Shared declarations only
tests/                      Cross-feature integration fixtures/tests
prisma/                     Schema, migrations, and fictional seed
```

Feature folders may own UI, Zod schemas, Server Actions, and pure domain helpers. Dependencies point inward: routes call feature/application behavior; application behavior calls server persistence; database-specific types do not leak into client bundles.

## 4. Request flows

### Public menu read

1. A Server Component calls a server-only menu query.
2. The query returns an intentionally selected DTO, not an unrestricted model object.
3. Cache policy/tag is explicit so admin availability edits can invalidate the menu.
4. Only serializable, public fields cross a Client Component boundary.

### Order creation

1. Checkout submits a typed payload to a Server Action.
2. Zod validates shape and conditional fulfilment/payment rules.
3. The service loads active menu items/options and recalculates all prices.
4. A PostgreSQL transaction creates the order, item snapshots, option snapshots, and initial status event.
5. The service returns a safe result with order number and public tracking identifier.
6. The action clears/updates client cart state and redirects to confirmation.

### Staff mutation

1. The protected route verifies a session for early UX redirection.
2. The mutation independently requires an active user and the necessary role/capability.
3. Zod parses input; the service checks current state and allowed transition.
4. The transaction updates the order and appends the status event.
5. Relevant views/tags are revalidated and the UI receives a safe result.

## 5. Authentication and authorization

Auth.js v5 credentials authentication verifies bcrypt cost-12 hashes for active users only. It uses encrypted JWT sessions with an eight-hour maximum age and Auth.js-managed secure cookie behavior. The session exposes only safe user identity, role, and status; it never serializes `passwordHash`.

`src/proxy.ts` performs only an optimistic session-presence redirect for protected `/admin/*` routes. The protected route group and reusable server authorization helpers then re-read the current `User` row. Consequently, a deleted or `DISABLED` user is rejected on the next protected request even if an older JWT remains valid.

Authorization uses `requireAuthenticatedUser`, `requireActiveUser`, `requireRole`, `requirePermission`, and the centralized role-capability map rather than scattered string comparisons. Page/layout protection improves navigation but does not replace checks at each data access, Server Action, or Route Handler boundary.

Development admin provisioning is an explicit CLI use case, never startup or seed behavior. It requires `NODE_ENV=development`, validated environment input, a unique email, and bcrypt cost 12. Production bootstrap remains deferred.

## 6. Data integrity

- Prisma migrations are the versioned database contract.
- PostgreSQL 17 is the local/deployment compatibility baseline; timestamps use `TIMESTAMPTZ(3)`.
- Multi-record writes use database transactions.
- Unique/check constraints and foreign keys enforce invariants where PostgreSQL can do so reliably.
- Money uses integer minor units; quantities and option bounds are positive/non-negative constrained values.
- Orders retain snapshot fields and persisted totals.
- Custom checks in migration SQL enforce cents/quantity bounds, total equations, option bounds, delivery requirements, payment/fulfilment compatibility, public-code shape, and the settings singleton.
- Status updates use optimistic concurrency (for example `updatedAt` or current-status predicate) to prevent silent staff overwrite.
- Menu entities use availability/active/archive semantics when history refers to them.

See [Database Design](DATABASE.md).

## 7. Error and observability approach

Expected validation, conflict, unauthorized, and not-found cases return stable safe errors. Unexpected exceptions are logged server-side with correlation context, then reduced to a generic user response. Logging redacts secrets and customer contact fields by default.

Operational events worth observing include login failures, denied authorization, order creation failures, invalid status transitions, and seed/provisioning actions. Vendor selection for monitoring is deferred.

## 8. Performance and accessibility

- Stream route sections when it improves meaningful rendering; avoid client waterfalls.
- Query only required columns and index frequent filters.
- Optimize food imagery through `next/image` once assets exist.
- Keep cart interactions local and responsive, with server reconciliation at checkout.
- Build semantic HTML first and test keyboard, screen-reader naming, focus behavior, contrast, responsive layout, and reduced motion.

## 9. Architecture constraints

- No separate backend, microservices, event bus, or background worker until a demonstrated requirement exists.
- No database access from Client Components.
- No generic public CRUD API by default.
- No real payment SDK or card data.
- No secrets in `NEXT_PUBLIC_*` variables or source control.
- No historical totals calculated from mutable menu tables.

## 10. Evolution points

Potential future additions—notification delivery, queued work, external POS integration, or object storage—must be introduced behind clear service interfaces and documented in `DECISIONS.md`. They are not part of the initial delivery.
