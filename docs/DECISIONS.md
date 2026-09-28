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

## Pending decisions

| ID | Decision | Needed by |
| --- | --- | --- |
| P-004 | Late-stage cancellation authorization | Task 8 |
| P-005 | Hosted-demo contact retention/redaction | Task 13/15 |
| P-006 | Monitoring/error-reporting provider | Task 13/15 |
