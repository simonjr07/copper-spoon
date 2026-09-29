# Architecture

## System overview

Copper Spoon is a single Next.js App Router application backed by PostgreSQL.

~~~text
Browser
  -> Next.js on Vercel
       -> Server Components
       -> Server Actions
       -> Auth.js Route Handlers
       -> Domain services
       -> Server-only repositories
       -> Prisma
  -> Supabase PostgreSQL
~~~

The public site, staff workspace, authentication endpoints, domain rules, and database access live in one codebase. A separate API server would add operational and authorization complexity without serving a current requirement.

## Runtime boundaries

- Server Components handle page reads and rendered views.
- Server Actions handle first-party form mutations.
- Route Handlers are limited to Auth.js and interfaces that benefit from HTTP semantics.
- Client Components are small interactive boundaries for the cart, filters, dialogs, and forms.
- Database and credential access stays in server-only modules or controlled scripts.
- Every protected query and mutation performs its own authorization.

## Data access

Prisma ORM 7 uses the pg driver through @prisma/adapter-pg.

- Runtime requests use DATABASE_URL, the Supabase Transaction Pooler connection.
- Prisma CLI and migrations use DIRECT_URL, the Supabase Session Pooler connection configured in prisma7.config.ts.
- src/server/db/prisma.ts owns the reusable runtime client.
- DATABASE_POOL_MAX bounds each application instance's pool.

Prisma Client is generated into the ignored src/generated/prisma directory.

## Code organization

~~~text
src/app/         Routes, layouts, loading/error states, and handlers
src/components/  Shared interface components
src/features/    Feature UI, schemas, actions, and domain logic
src/lib/         Framework-independent utilities
src/server/      Authorization, repositories, transactions, and data access
tests/           Automated tests
prisma/          Schema, migrations, development seed, and smoke check
scripts/         Controlled operational commands
~~~

Routes call feature or application services. Services call server-only persistence modules. Prisma records are mapped to bounded view models before crossing into UI code.

## Core request flows

### Public catalog

Public catalog queries return published categories and published, non-archived items. Sold-out items remain visible but cannot be ordered. Active option groups and available options are included.

Catalog results use a five-minute cache with public-menu and restaurant-settings tags. Successful catalog mutations invalidate public-menu.

### Cart and checkout

The cart is a versioned localStorage snapshot. It improves responsiveness but is not trusted by the server.

Checkout:

1. Validates the request with Zod.
2. Applies the PostgreSQL-backed rate limit.
3. Resolves the checkout idempotency token.
4. Reads current settings, catalog records, and option rules.
5. Recalculates all amounts in integer cents.
6. Creates the order, immutable snapshots, and initial event in one serializable transaction.
7. Returns a non-sequential public order code.

Unavailable or inconsistent data rejects the entire operation.

### Public order status

/order/[orderCode] performs an uncached indexed lookup. The public model contains the order code, status, fulfilment/payment labels, placed time, immutable item snapshots, persisted totals, and event status/timestamps.

Contact details, delivery addresses, staff actors, event notes, checkout tokens, and internal IDs are excluded.

### Staff order workflow

The order queue and details use fresh operational reads. Status updates re-read the current order, enforce the role-aware state machine, compare the submitted concurrency timestamp, and append an actor-attributed event in the same serializable transaction.

### Catalog administration

Staff can read the complete catalog. Administrators can create and edit categories, items, option groups, and options. Archive and unpublish operations preserve historical references. Catalog writes never modify order snapshots.

### Staff administration

Staff-account operations require the staff:manage capability. Passwords use bcrypt cost 12. Role/status changes use a serializable transaction to preserve at least one active administrator. Administrators cannot disable themselves or change their own role through this workflow.

### Dashboard analytics

The dashboard uses fresh server-side aggregates for status counts, the restaurant's current day, recent orders, fulfilment mix, seven-day activity, and popular immutable item snapshots. It does not report payment settlement or revenue.

## Authentication and authorization

Auth.js credentials authentication issues encrypted JWT sessions with an eight-hour lifetime. Session claims support navigation, but protected operations re-read the current database user so disabled accounts lose access on their next server request.

A centralized capability map defines ADMIN and STAFF permissions. Proxy and layout redirects improve navigation but are not authorization boundaries.

## Data integrity

- PostgreSQL migrations define the database contract.
- Money uses integer minor units.
- Orders store immutable catalog snapshots and persisted totals.
- Multi-record invariants use transactions.
- Database checks enforce amount, quantity, selection, fulfilment, payment, code, and singleton rules.
- Optimistic predicates prevent silent concurrent status overwrites.
- Catalog and staff records use non-destructive lifecycle states.

See [Database Design](DATABASE.md) and [Architecture Decisions](DECISIONS.md).

## Performance and accessibility

- Public catalog reads are cached; order and administrative reads remain fresh.
- Database queries select required fields and use indexes for common filters.
- Repository-local WebP images use responsive next/image sizing.
- Cart interactions stay client-local until checkout.
- The interface uses semantic HTML, visible focus, accessible names, reduced-motion support, and responsive layouts.
- A static Content Security Policy preserves public-page cacheability while allowing the inline behavior required by Next.js.

## Constraints and future extensions

The current architecture does not include microservices, a generic public CRUD API, background workers, real payment services, or public customer accounts.

Notifications, external POS integration, background jobs, or object storage should be added behind documented service boundaries when a verified requirement exists.
