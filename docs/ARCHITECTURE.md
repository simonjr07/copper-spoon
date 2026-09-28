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
    menu/                  Public catalog list/detail routes
    cart/                  Browser-persisted guest cart route
    checkout/              Customer checkout route
    order/[orderCode]/     Public bearer-code confirmation route
    track-order/           Public order-code entry route
    admin/
      (protected)/         Protected dashboard plus order queue/detail routes
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

1. `/menu` and `/menu/[slug]` Server Components call the server-only public catalog module.
2. Prisma selects only catalog/settings fields; a pure policy layer applies publication/archive checks and returns purpose-built DTOs.
3. `unstable_cache` caches catalog reads for five minutes under `public-menu` and `restaurant-settings` tags. Task 9 mutations will revalidate those tags after commit.
4. The list page passes only its public DTO to the narrow `MenuBrowser` Client Component for live search and category filtering. Item-detail reads and rendering remain server-side.
5. Published unavailable items remain visible as sold out; unpublished/archived items, unpublished categories, inactive option groups, and unavailable choices are omitted.
6. Public image paths are allowlisted to repository-local `/images/...` assets before crossing the server/client boundary. `MenuVisual` uses responsive `next/image` fill/sizes and switches to the branded fallback after a missing path or load error.

### Order creation

1. Checkout submits a typed payload to a Server Action.
2. Zod validates shape and conditional fulfilment/payment rules.
3. A serializable PostgreSQL transaction first resolves the unique checkout token, then loads current restaurant settings and complete item/group/option records.
4. Pure domain logic rejects disabled fulfilment/payment choices; unpublished, archived, sold-out, or hidden-category items; inactive/unavailable/wrong-item options; selection-bound violations; currency mismatches; and unmet delivery minimums.
5. The service recalculates base, option, line, subtotal, delivery-fee, and total cents and creates the order, immutable item/option snapshots, and initial `PENDING` event through one nested write.
6. A cryptographically random `CS-` code is retried on a uniqueness collision. A repeated checkout token returns the already-created public code rather than creating a duplicate order.
7. The Client Component clears the browser cart only after success and navigates to a dynamic confirmation route that selects no contact/address/internal-ID fields.

### Guest cart

1. The server-rendered item detail passes its purpose-built public DTO to a narrow configurator Client Component.
2. The configurator enforces currently rendered group types and min/max selection bounds, then snapshots only display data and integer-cent estimates into a cart line.
3. A root React context/reducer owns cart actions so the header, detail configurator, and `/cart` route share state without a separate client store dependency.
4. After client hydration, a versioned strict Zod schema restores `localStorage` data. Invalid, mixed-currency, unsafe-image, or unknown-version payloads fail closed to an empty cart; storage failures leave the in-memory cart usable.
5. A line identity is the item ID plus sorted group/option IDs. Identical configurations merge quantities, while different choices remain separate lines.
6. All cart content and totals remain untrusted convenience data. Checkout sends only item/option IDs and quantities; order creation independently re-reads publication, availability, choices, settings, and prices before an order can exist.

### Customer order status

1. `/track-order` normalizes a submitted code to uppercase and redirects only when it matches the public `CS-` format; malformed and unknown codes converge on the same safe not-found experience.
2. `/order/[orderCode]` is forced dynamic. Each page load calls a dedicated server-only public-order repository directly, without `unstable_cache`, so a normal refresh reads current `Order.status` and `OrderStatusEvent` rows.
3. The Prisma query allowlists only the public code, lifecycle/payment/fulfilment labels, placed time, immutable item/option snapshots, persisted totals, and event status/time. It never selects contact/address data, internal IDs, staff actors, or notes.
4. A pure mapper returns a purpose-built customer DTO, orders actual recorded events chronologically, and adds the restaurant timezone from settings. Formatting falls back to UTC if settings contain an invalid timezone.
5. The page labels pickup and delivery `READY` states honestly and does not imply polling, notifications, live kitchen telemetry, driver dispatch, or an ETA.

### Staff mutation

1. The protected route verifies a session and `orders:read` permission for early UX redirection and fresh server-only queue/detail reads.
2. The mutation independently calls `requirePermission("orders:update-status")`, deriving actor ID and role from the current active database user.
3. Zod parses the order ID, desired status, concurrency timestamp, and bounded optional reason. Inside the transaction the service re-reads the authoritative status and applies the explicit transition/cancellation policy.
4. A conditional `id + status + updatedAt` update detects a concurrent write. The update and actor-attributed `OrderStatusEvent` are committed together at serializable isolation; either both happen or neither happens.
5. Admin paths are revalidated and the action returns a safe success, validation, policy, or stale-state message. The public reader remains uncached and never projects event notes/actors.

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
- Repository-local WebP food imagery is delivered through `next/image` with fixed-ratio containers to prevent layout shift. Only the homepage hero is preloaded; menu-card and detail images retain lazy loading.
- Generated source PNGs remain outside the repository. The selected, optimized WebP derivatives and reproducible prompt/mapping notes are the maintained application assets.
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
