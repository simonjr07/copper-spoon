# Architecture Decisions

This lightweight decision log records choices that materially constrain future work. New decisions should include context, choice, consequences, and date. Do not rewrite accepted history; mark an entry superseded and add a replacement.

## ADR-001: One Next.js full-stack application

- Status: Accepted
- Date: 2026-09-27
- Decision: Use the Next.js App Router for UI, server rendering, first-party mutations, and intentional HTTP handlers. Do not create a separate Express backend.
- Why: The product has one client and a controlled scope. One deployable keeps types, authorization, transactions, CI, and operations coherent.
- Consequence: Server boundaries must still be explicit; route files should not become an unstructured service layer.

## ADR-002: PostgreSQL and Prisma

- Status: Accepted and implemented
- Date: 2026-09-27
- Decision: Use PostgreSQL 17 locally through Docker and later in the hosted demo through Neon. Use stable Prisma ORM 7.10 with `@prisma/adapter-pg`/`pg`, a generated ESM client, and reviewed SQL migrations.
- Why: Orders, catalog relationships, authorization, and analytics are relational and need strong transactions/constraints.
- Consequence: The generated client is recreated rather than committed; runtime connections require the driver adapter. Prisma 8 remains deferred while it is a release candidate.

## ADR-003: Immutable order snapshots

- Status: Accepted
- Date: 2026-09-27
- Decision: Persist item/option display names and prices on order-owned rows at submission, plus persisted order totals.
- Why: Mutable catalog values cannot be a historical commercial record.
- Consequence: Some data is intentionally duplicated. All historical display and analytics paths use snapshot/order values.

## ADR-004: Integer minor-unit money

- Status: Accepted
- Date: 2026-09-27
- Decision: Store monetary values as integers in the smallest currency unit plus an explicit currency code.
- Why: Avoid floating-point rounding and make calculations/test assertions deterministic.
- Consequence: Formatting and currency compatibility are centralized; initial release has one ordering currency.

## ADR-005: Credentials auth with explicit roles

- Status: Accepted and implemented
- Date: 2026-09-27
- Decision: Use Auth.js v5 credentials authentication, bcrypt cost 12, encrypted eight-hour JWT sessions, active/disabled account status, and centralized `ADMIN`/`STAFF` capabilities. No public registration.
- Why: It demonstrates appropriate staff security while matching the brief.
- Consequence: Auth.js v5 remains a beta package even though it provides the current App Router/Next.js 16 API. Track updates deliberately. JWT role/status is advisory; secure helpers re-read `User` before protected work. Development provisioning is explicit and environment-driven; production bootstrap and password replacement remain controlled future work.

## ADR-006: Server-first UI and narrow client boundaries

- Status: Accepted
- Date: 2026-09-27
- Decision: Use Server Components for reads/views by default and Client Components only for necessary interactivity.
- Why: This limits shipped JavaScript and prevents accidental server-data exposure.
- Consequence: Data passed into client islands must be explicitly shaped and serializable.

## ADR-007: Server Actions for first-party mutations

- Status: Accepted
- Date: 2026-09-27
- Decision: Prefer validated, authorized Server Actions for UI mutations. Reserve Route Handlers for Auth.js or a real HTTP-interface requirement.
- Why: It fits the single Next.js client without creating a redundant internal REST layer.
- Consequence: Actions are treated as externally reachable POST endpoints and must never rely on hidden UI controls for security.

## ADR-008: No real payments

- Status: Accepted
- Date: 2026-09-27
- Decision: Support only `PAY_ON_PICKUP`, `PAY_ON_DELIVERY`, and `DEMO_CARD`; do not integrate a processor or collect card details.
- Why: Real payments add compliance and operational risk outside the portfolio goal.
- Consequence: UI and documentation must clearly label simulated behavior, and analytics must not imply settled real revenue.

## ADR-009: Database defaults and public order identity

- Status: Accepted and implemented
- Date: 2026-09-27
- Decision: Use USD integer cents, UTC database instants, default restaurant timezone `America/New_York`, CUID internal IDs, and a separate unique non-sequential `CS-…` order code. Snapshot delivery address columns directly on `Order`.
- Why: These choices give deterministic money/history, timezone-safe operations, non-enumerable customer references, and a stable delivery receipt without premature address abstractions.
- Consequence: Order creation must generate the public code securely, normalize email, and populate conditional delivery fields. The database enforces code shape, address completeness, and totals.

## ADR-010: Database checks beyond Prisma schema

- Status: Accepted and implemented
- Date: 2026-09-27
- Decision: Add reviewed PostgreSQL check constraints to migration SQL for invariants Prisma Schema Language cannot express.
- Why: Critical money, quantity, option-bound, fulfilment, snapshot, and singleton rules should fail closed even if an application path is defective.
- Consequence: Migration SQL is part of the data contract and must be reviewed whenever the Prisma schema changes; schema validation alone does not validate custom checks.

## ADR-011: Public catalog visibility and caching

- Status: Accepted and implemented
- Date: 2026-09-28
- Decision: Public catalog DTOs include only published categories and published, non-archived items. Published unavailable items remain visible as sold out. Inactive option groups and unavailable choices are omitted. Server-only Prisma reads use a five-minute cache plus `public-menu` / `restaurant-settings` tags.
- Why: Guests need an honest view of recognizable dishes even during temporary sell-outs, while draft/archive/admin state must remain private. A short cache reduces repeated catalog reads without making availability indefinitely stale.
- Consequence: Task 9 catalog/settings mutations must invalidate the relevant cache tags after commit. Order creation in Task 6 must independently re-read price/publication/availability and never trust the browse DTO or cached client state.

## ADR-012: Repository-local generated food imagery

- Status: Accepted and implemented
- Date: 2026-09-28
- Decision: Use one cohesive AI-generated editorial food-photography set, retain only optimized WebP derivatives under `public/images`, and reference menu assets through the existing optional `MenuItem.imageUrl`. Serve imagery with `next/image`; preload only the homepage hero and provide a branded fallback for missing images.
- Why: Local generated assets avoid hotlink, licensing, availability, and remote-host configuration risks while establishing a stable image contract before cart work.
- Consequence: New menu items need a descriptive local filename, safe `/images/menu/...` seed path, meaningful alt text, web optimization, and a visual review against the established shoot. Source generation prompts/mapping are recorded in `IMAGE_ASSETS.md`; a future replacement must preserve filenames or update seed data deliberately.

## ADR-013: Versioned browser cart with server-authoritative checkout

- Status: Accepted and implemented
- Date: 2026-09-28
- Decision: Keep the pre-checkout guest cart in a small React context/reducer and persist a versioned, strictly validated display snapshot in `localStorage`. Use item plus sorted option IDs as configuration identity and integer cents for estimates.
- Why: Guests get fast cross-page cart behavior without accounts, database writes, or another state dependency, while corrupt/stale browser data can be discarded safely.
- Consequence: The cart is device/browser-local and can become stale. Stored names, prices, images, availability, and totals are never trusted by order creation; checkout re-reads all referenced catalog records, revalidates selection bounds, reprices, and creates snapshots atomically.

## ADR-014: Serializable, idempotent checkout transaction

- Status: Accepted and implemented
- Date: 2026-09-28
- Decision: Execute settings/catalog reads, authoritative repricing, and nested order/snapshot/event creation in one serializable Prisma transaction. Use a client-generated UUID protected by a nullable unique `Order.checkoutToken`, plus a 50-bit cryptographically random `CS-` public code.
- Why: The browser cart can be stale or hostile, concurrent catalog changes must not create mixed snapshots, lost responses must be safely retryable, and customers must never receive an internal database identifier.
- Consequence: Uniqueness and serialization conflicts retry up to four complete transactions. Existing rows can retain a null checkout token. Task 13 still adds request-rate limiting and hosted retention; the bearer-code route now provides the customer order-status experience.

## ADR-015: Fresh, minimal bearer-code order status

- Status: Accepted and implemented
- Date: 2026-09-28
- Decision: Extend `/order/[orderCode]` into confirmation plus durable status rather than creating another order-detail route. Use an uncached server-only Prisma query and an explicit customer DTO; add `/track-order` as a progressive-enhancement code entry point.
- Why: Customers need current recorded state without accounts, while a separate public model prevents accidental exposure of contact, address, staff, notes, internal IDs, or mutable catalog data.
- Consequence: Every refresh performs a small indexed order/settings query and shows only real `OrderStatusEvent` rows. Public codes remain bearer credentials. Task 13 must rate-limit lookup attempts; no automatic polling, notifications, driver tracking, or ETA is claimed.

## ADR-016: Explicit order workflow and bounded cancellation

- Status: Accepted and implemented
- Date: 2026-09-28
- Decision: Normal processing advances exactly one edge through `PENDING → CONFIRMED → PREPARING → READY → COMPLETED`. Staff cancellation ends after `CONFIRMED`; admins may additionally cancel `PREPARING`. No role may cancel `READY` or a terminal order, and every cancellation requires a stored reason.
- Why: A small explicit state machine is easier to operate, audit, and test than arbitrary status writes. Admin late-stage authority handles exceptional kitchen cases without allowing cancellation after the order is ready.
- Consequence: The server re-reads current state, uses `updatedAt` only as a stale-screen token, conditionally updates the row, and inserts the actor-attributed event in one serializable transaction. Public DTOs continue to omit internal notes and actors.

## ADR-017: Non-destructive catalog lifecycle and targeted cache expiry

- Status: Accepted and implemented
- Date: 2026-09-28
- Decision: Categories leave the public menu by unpublishing rather than deletion. Menu items distinguish draft, published, temporarily unavailable, and archived states; archive also unpublishes. Option groups become inactive and options unavailable instead of being destructively removed. Every successful catalog mutation immediately expires only the `public-menu` cache tag.
- Why: Catalog relationships and historical orders need stable references, sold-out dishes should remain discoverable, and operators need public changes to appear immediately without clearing unrelated site/settings caches.
- Consequence: Admin forms expose lifecycle toggles and an explicit archive confirmation. Active option selection bounds cannot exceed available choices. Catalog mutations never update order-owned snapshots, and `restaurant-settings` is not invalidated by catalog-only changes.

## ADR-018: Transactional staff lifecycle and strict self-protection

- Status: Accepted and implemented
- Date: 2026-09-28
- Decision: Staff accounts are disabled rather than deleted. Removing an active admin role/status is guarded inside a serializable transaction so at least one active admin remains. Admins may edit their own name/email but cannot change their own role/status or use the admin password-replacement path on themselves.
- Why: History-bearing actor references and operational recovery require durable accounts, while strict self-controls reduce accidental lockout. Serializable isolation prevents concurrent count-then-update write skew.
- Consequence: Another active admin is required for an admin's demotion, disablement, or controlled password replacement. Self-password recovery remains a separate future operational process. Database serialization conflicts require a fresh review/retry.

## ADR-019: Fresh timezone-aware operational analytics

- Status: Accepted and implemented
- Date: 2026-09-28
- Decision: Render `/admin` from uncached, server-only aggregate queries available to both active staff roles. Define "today" and seven-day buckets in the restaurant's configured IANA timezone, and compute popular items from immutable order-item name snapshots while excluding cancelled orders.
- Why: Restaurant operators need current workload and fulfilment signals, calendar days must match the restaurant rather than the server, and historical item reporting must survive catalog renames or archival.
- Consequence: Each dashboard request performs bounded concurrent aggregates and a small recent-order query. Missing statuses/days become explicit zeroes, invalid timezone settings fall back to UTC, private order fields never enter the dashboard DTO, and no metric is described as settled revenue or payment performance.

## Pending decisions

| ID | Decision | Needed by |
| --- | --- | --- |
| P-005 | Hosted-demo contact retention/redaction | Task 13/15 |
| P-006 | Monitoring/error-reporting provider | Task 13/15 |
