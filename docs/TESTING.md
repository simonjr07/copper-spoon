# Testing Strategy

## Objectives

Testing focuses on the invariants that carry the most product and security risk: pricing, snapshots, transactions, status transitions, authentication, authorization, staff safety, and public data minimization.

## Automated checks

### Static checks

- npm run lint
- npm run typecheck
- npm run build
- git diff --check

### Unit and service tests

Vitest covers:

- Money formatting and integer-cent calculations
- Cart identity, quantities, persistence validation, and option bounds
- Checkout validation, repricing, availability, fulfilment/payment compatibility, and idempotency
- Order-code generation and collision retry
- Immutable snapshot mapping
- Status-transition and cancellation policy
- Optimistic concurrency and event atomicity
- Auth.js credential outcomes and disabled-account handling
- bcrypt hashing and password policy
- ADMIN/STAFF capabilities
- Current-database active-user checks
- Catalog visibility, ordering, validation, and cache invalidation
- Staff lifecycle, self-protection, and final-active-admin behavior
- Dashboard aggregation and timezone boundaries
- Rate-limit thresholds and HMAC identity privacy
- Public DTO privacy and private-route noindex policy
- Production provisioning and demo-catalog bootstrap guards

Pure business rules are separated from framework code so they can be tested deterministically.

### Database and CI checks

GitHub Actions starts an ephemeral PostgreSQL 17 service, then runs:

1. npm ci
2. Prisma Client generation
3. Prisma schema validation
4. The full migration history
5. Lint
6. Type checking
7. Vitest
8. The production build

CI uses fictional database credentials and has no access to production secrets.

## Critical invariants

- Checkout ignores client-supplied prices and totals.
- Catalog changes cannot alter submitted order history.
- Invalid or unavailable cart data cannot create partial orders.
- Reusing a committed checkout token does not create a duplicate order.
- Only valid one-step status transitions succeed.
- Terminal orders cannot transition.
- Concurrent status updates return a conflict.
- STAFF cannot use administrator-only mutations.
- Disabled accounts cannot sign in or continue protected work.
- The final active administrator cannot be disabled or demoted.
- Public tracking responses exclude contact, address, staff, note, and internal-ID fields.
- Production catalog bootstrap leaves existing records and non-catalog data unchanged.

## Test data

Tests use fictional names, example domains, and synthetic phone/address values. Time-sensitive tests use controlled clocks. Database tests must target an isolated test database, never development or production data.

## Manual verification

Before release, verify:

- Guest menu, item configuration, cart, pickup checkout, delivery checkout, confirmation, and tracking
- STAFF and ADMIN sign-in, navigation, and authorization differences
- Order queue filters, pagination, status progression, cancellation, and stale-write handling
- Catalog publication, availability, archive behavior, and snapshot preservation
- Staff account creation, disable/reactivate, password replacement, self-protection, and final-admin protection
- Dashboard counts, timezone boundaries, fulfilment mix, recent orders, and popular items
- Keyboard navigation, visible focus, screen-reader names, error association, and reduced motion
- Layouts at 320, 375, 768, 1024, and desktop widths
- Security headers, generic errors, rate-limit recovery, log redaction, and absence of secrets in client output

The deployed environment uses the detailed [Hosted QA Checklist](HOSTED_QA.md).

## Browser automation

Playwright is not currently configured. Critical journeys are covered by service-level tests and hosted/manual verification. End-to-end automation is a future improvement and should use isolated data with deterministic cleanup.

## Release evidence

Automated checks do not prove hosted performance, assistive-technology compatibility, Supabase connection behavior, or Vercel configuration. Record those results during hosted QA rather than inferring them from local tests.
