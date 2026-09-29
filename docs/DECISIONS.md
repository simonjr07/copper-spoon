# Architecture Decisions

This log records decisions that materially constrain the application. Superseded decisions should be marked and replaced rather than silently rewritten.

## ADR-001: Single Next.js application

- Status: Accepted
- Decision: Use the Next.js App Router for rendering, first-party mutations, authentication endpoints, and server-side application logic.
- Rationale: One deployable keeps types, authorization, transactions, and operations coherent for a single client.
- Consequence: Route files delegate to feature and server modules rather than becoming a second service layer.

## ADR-002: PostgreSQL and Prisma

- Status: Accepted
- Decision: Use PostgreSQL 17 with Prisma ORM 7, the pg driver adapter, generated ESM client, and reviewed SQL migrations.
- Rationale: Orders, catalog relationships, staff authorization, analytics, and rate limits require relational constraints and transactions.
- Consequence: Prisma Client is generated rather than committed. Runtime and CLI connections are configured separately.

## ADR-003: Integer money and immutable order snapshots

- Status: Accepted
- Decision: Store money as integer minor units. Store item and option names/prices on order-owned rows at submission.
- Rationale: Floating-point values are unsuitable for money, and mutable catalog records are not a reliable historical record.
- Consequence: Snapshot data is duplicated by design. Historical views and analytics use snapshots and persisted totals.

## ADR-004: Credentials authentication with roles

- Status: Accepted
- Decision: Use Auth.js credentials authentication, bcrypt cost 12, encrypted eight-hour JWT sessions, active/disabled account status, and ADMIN/STAFF capabilities.
- Rationale: The restaurant workspace needs controlled staff access without public registration.
- Consequence: Protected operations re-read the database user instead of relying only on session claims.

## ADR-005: Server-first rendering and Server Actions

- Status: Accepted
- Decision: Use Server Components for reads and Server Actions for first-party mutations. Client Components are limited to interactive boundaries.
- Rationale: This limits browser JavaScript and keeps data and authorization logic on the server.
- Consequence: Server Actions are treated as network-reachable endpoints and perform their own validation and authorization.

## ADR-006: Simulated payments only

- Status: Accepted
- Decision: Support PAY_ON_PICKUP, PAY_ON_DELIVERY, and DEMO_CARD without a payment processor.
- Rationale: Real payments add compliance and operational risk outside the portfolio scope.
- Consequence: The application does not collect card data or claim payment settlement.

## ADR-007: Public order identity

- Status: Accepted
- Decision: Use CUID internal IDs and a separate random CS- public code. Store delivery address fields on the order.
- Rationale: Customers need a stable non-sequential reference, and the delivery record must survive later changes.
- Consequence: Public queries use the code and return a restricted customer view model.

## ADR-008: Database checks beyond Prisma schema

- Status: Accepted
- Decision: Add PostgreSQL check constraints for invariants not expressible in Prisma Schema Language.
- Rationale: Amount equations, quantity bounds, selection rules, delivery requirements, and singleton behavior should fail closed in the database.
- Consequence: Migration SQL is part of the reviewed data contract.

## ADR-009: Public catalog caching

- Status: Accepted
- Decision: Cache public catalog reads for five minutes under public-menu and restaurant-settings tags. Keep order and administrative reads fresh.
- Rationale: Catalog traffic benefits from caching, while availability and operational data require predictable freshness.
- Consequence: Successful catalog mutations invalidate public-menu after commit.

## ADR-010: Repository-local food imagery

- Status: Accepted
- Decision: Store optimized WebP food images under public/images and serve them through next/image.
- Rationale: Local assets avoid hotlink, licensing, availability, and remote-host configuration risks.
- Consequence: Catalog image paths are limited to safe local /images/... values and missing images use a fallback.

## ADR-011: Versioned browser cart

- Status: Accepted
- Decision: Keep the pre-checkout cart in a React context/reducer and persist a validated versioned snapshot in localStorage.
- Rationale: Guests get responsive cross-page cart behavior without accounts or pre-checkout database writes.
- Consequence: Stored names, prices, totals, and availability are advisory; checkout reloads authoritative records.

## ADR-012: Serializable and idempotent checkout

- Status: Accepted
- Decision: Validate and create an order in one serializable transaction. Use a client-generated UUID stored as a unique checkout token.
- Rationale: Concurrent catalog changes and lost responses must not create mixed snapshots or duplicate orders.
- Consequence: Supported uniqueness and serialization conflicts retry. A committed token resolves to the existing public code.

## ADR-013: Public order tracking

- Status: Accepted
- Decision: Use /order/[orderCode] for confirmation and status, with an uncached restricted query and /track-order as the code-entry route.
- Rationale: Customers need current recorded status without an account.
- Consequence: The public view omits contact, address, staff, notes, tokens, internal IDs, polling, notifications, and live delivery claims.

## ADR-014: Controlled order state machine

- Status: Accepted
- Decision: Normal processing follows PENDING -> CONFIRMED -> PREPARING -> READY -> COMPLETED. STAFF may cancel through CONFIRMED; ADMIN may also cancel PREPARING.
- Rationale: A small state machine is easier to operate, audit, and test than arbitrary status writes.
- Consequence: Updates use optimistic concurrency and append an actor-attributed event in the same transaction.

## ADR-015: Non-destructive catalog lifecycle

- Status: Accepted
- Decision: Categories are unpublished, items are archived/unpublished, groups are deactivated, and options become unavailable instead of being deleted through normal workflows.
- Rationale: Historical references and order snapshots must remain stable.
- Consequence: Catalog mutations cannot modify order-owned snapshot rows.

## ADR-016: Staff lifecycle and administrator safety

- Status: Accepted
- Decision: Staff accounts are disabled rather than deleted. Role/status changes preserve at least one active administrator in a serializable transaction.
- Rationale: Actor history and recovery require durable accounts, and concurrent changes must not lock out administration.
- Consequence: Administrators cannot disable themselves, change their own role, or replace their own password through the staff-management workflow.

## ADR-017: Operational analytics

- Status: Accepted
- Decision: Compute fresh dashboard aggregates in the restaurant timezone and derive popular items from immutable order snapshots, excluding cancelled orders.
- Rationale: Operators need current workload data that survives catalog changes.
- Consequence: Dashboard results do not represent payment settlement or revenue.

## ADR-018: Responsive interface system

- Status: Accepted
- Decision: Use a small Tailwind-based design system with shared layout, control, focus, loading, error, and responsive patterns.
- Rationale: The application needs consistent behavior from 320 px through desktop without a large UI dependency.
- Consequence: Operational tables adapt to mobile cards and motion respects user preferences.

## ADR-019: Durable rate limits and static security headers

- Status: Accepted
- Decision: Protect login, checkout, and public tracking with atomic PostgreSQL fixed-window buckets keyed by HMAC digests. Apply a static route-wide security-header set.
- Rationale: In-memory counters do not coordinate across Vercel instances, and plaintext identities are unnecessary.
- Consequence: Protected surfaces fail closed when rate-limit storage is unavailable. The CSP retains the inline allowances required by the current Next.js setup.

## ADR-020: Controlled production administration

- Status: Accepted
- Decision: Provision production administrators through a confirmed one-time command that only creates a new active account.
- Rationale: Automatic seeds and shared credentials are unsafe for bootstrap and recovery.
- Consequence: Duplicate emails are rejected and credentials are supplied only through the protected execution environment.

## ADR-021: Minimal settings bootstrap

- Status: Accepted
- Decision: Insert the RestaurantSettings singleton through an idempotent migration when it is absent.
- Rationale: A clean deployment requires settings but must not depend on the development seed.
- Consequence: The migration does not overwrite settings or create catalog, user, order, or credential data.

## ADR-022: Supabase connection split

- Status: Accepted
- Decision: Use Supabase PostgreSQL as the hosted database. Application traffic uses the Transaction Pooler through DATABASE_URL; Prisma CLI and migrations use the Session Pooler through DIRECT_URL.
- Rationale: Serverless application traffic and administrative migration sessions have different connection behavior.
- Consequence: Environments that run Prisma CLI commands provide DIRECT_URL. Runtime environments provide DATABASE_URL. Supabase Auth and client libraries are not part of the application.

## ADR-023: Guarded production demo catalog

- Status: Accepted
- Decision: Use a separately confirmed catalog bootstrap that performs create-only upserts through DIRECT_URL in one transaction.
- Rationale: The development seed updates settings and matching catalog records, which is not suitable for an established hosted database.
- Consequence: The command creates missing fictional catalog records and leaves matching records, settings, users, credentials, and orders unchanged.

## Open decisions

| Topic | Required before |
| --- | --- |
| Guest contact-data retention and redaction | Public traffic |
| Monitoring/error-reporting provider and alert ownership | Public launch |
