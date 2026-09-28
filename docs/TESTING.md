# Testing Strategy

## 1. Objectives

Tests should protect money calculations, snapshot history, order transactions, status transitions, authentication/authorization, and the customer/staff journeys most likely to fail. Tests are added with each feature; a later testing task completes cross-cutting coverage and CI.

## 2. Layers

### Static checks

- TypeScript strict checking with `npm run typecheck`
- ESLint/Next.js rules with zero warnings
- Production build to catch framework, route, and bundling failures
- `git diff --check` for whitespace/conflict artifacts

### Unit tests (Vitest)

- Money arithmetic and formatting
- Cart reducer/quantity behavior
- Option selection constraints
- Zod schemas and conditional checkout rules
- Order transition policy and role capability helpers
- Analytics range helpers/timezone boundaries
- Credential normalization and valid/invalid/unknown/disabled authentication outcomes
- Bcrypt verification and cost-12 hashing
- Current-database ACTIVE-user resolution for stale JWT defense
- ADMIN/STAFF capability policy and development provisioning guards

Pure business behavior should be separated from framework code for fast deterministic tests.

### Component tests (Vitest + Testing Library)

- Synchronous components/client interactions, accessible names, error messages, focus, and pending state
- Avoid using Vitest as the primary tool for async Server Components; the bundled Next.js guidance recommends end-to-end coverage for those paths.

### Database integration tests

- Prisma queries against an isolated PostgreSQL test database
- Order creation transaction, rollback, constraints, snapshot immutability, and concurrent status conflicts
- Role/status persistence and menu availability behavior
- Each test is isolated through transactions, schema reset, or unique fixtures; never points at development/production data.
- The foundation supplies `compose.yaml`, committed migrations, an explicit idempotent seed, and `npm run db:smoke`. Behavior-level integration tests begin when transactional order services exist rather than testing Prisma-generated accessors in isolation.

### End-to-end tests (planned Playwright)

- Guest browse -> customize -> cart -> checkout -> confirmation -> status
- Staff login -> process order through valid statuses
- Admin manages menu/availability and historical order remains unchanged
- Staff is denied admin routes/actions, including direct requests
- Disabled user cannot authenticate or retain privileged access
- Responsive smoke tests for mobile ordering and dashboard breakpoints

## 3. Required business-invariant cases

- Submitted totals ignore client-supplied prices and match authoritative catalog values.
- A catalog price/name change after submission cannot change order history.
- Invalid/unavailable items or options reject the entire order; no partial rows remain.
- Duplicate/retried submission does not accidentally create multiple orders once idempotency is implemented.
- Only allowed status edges succeed; terminal orders cannot move.
- Concurrent status updates produce a conflict instead of silent last-write-wins behavior.
- `STAFF` cannot change staff accounts, settings, categories, or menu items.
- Disabled accounts are denied at sign-in and sensitive operations.
- Public tracking identifiers are non-enumerable and responses minimize contact data.

## 4. Fixtures and data

Use factories with explicit fictional names/domains/phone ranges. Tests must not depend on seed ordering unless that is the behavior under test. Time-sensitive tests use an injected/frozen clock. Money examples include zero adjustments, multiple quantities, and boundary totals.

## 5. Environment

- If a shared `.env.test` is introduced, explicitly allowlist it in `.gitignore` only after confirming it contains safe deterministic defaults; `.env.test.local` remains ignored.
- Database URLs for tests must identify a dedicated test database and include a guard that refuses suspicious/shared targets.
- CI starts an ephemeral PostgreSQL service and applies migrations before integration tests.

## 6. Quality gate evolution

Current authentication gate: Prisma validate/generate when relevant, `npm test`, lint, typecheck, build, and diff check. The authentication unit suite uses repository boundaries and real bcrypt without mutating PostgreSQL; database wiring is type/build checked. Database-dependent gates require the isolated Copper Spoon PostgreSQL service on host port 5433. When end-to-end support lands, add a separate `test:e2e` gate and keep browser artifacts out of Git.

Coverage thresholds may be introduced after meaningful tests exist. Passing a percentage is never a substitute for covering the invariant list above.

## 7. Manual verification

Every feature PR includes a short reproducible verification path. Before release, run keyboard-only flows, browser responsive checks, screen-reader spot checks, slow/error states, a clean-database migration/seed, and the hosted-demo smoke suite.

For staff authentication, verify that anonymous `/admin` navigation redirects to `/admin/login`; unknown email, wrong password, and disabled account all show the same public failure; a provisioned active admin reaches the dashboard; sign-out returns to login; and changing the signed-in database user to `DISABLED` causes the next protected request to be rejected. Check the form with keyboard-only navigation and its password visibility, pending, and validation states.
