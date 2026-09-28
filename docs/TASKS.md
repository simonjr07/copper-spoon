# Implementation Roadmap

Each task should be a focused branch and pull request from an up-to-date, green `main`. Suggested branch names are illustrative; follow the repository/user convention in effect when work begins.

## 1. Repository and architecture foundation

Branch: `feat/repository-foundation`

- Establish documentation, source folders, environment template, Node version, scripts, and a non-generic foundation page.
- Define product, architecture, data, security, testing, deployment, and completion contracts.
- Gate: lint, typecheck, production build, and diff check.

Status: complete.

## 2. Database foundation

Branch: `feat/database-foundation`

- Install/configure current Prisma tooling after checking its official docs and Node compatibility.
- Add Docker Compose PostgreSQL for local development.
- Implement reviewed schema, first migration, Prisma client boundary, fictional catalog seed, and database scripts.
- Add integration-test database strategy and snapshot/invariant tests where possible.
- Resolve the deferred database decisions in `DATABASE.md`.

Status: implemented. Runtime container/migration/seed/smoke verification is pending on any machine where Docker Desktop is available; Docker is not installed on the current host.

Implemented with PostgreSQL 17 Compose configuration, stable Prisma 7.10, driver adapter, schema, custom-constraint migration, server-only client, idempotent fictional seed, smoke query, scripts, and documentation.

Depends on: Task 1. The approved USD, timezone, identifier, address, port, and credential-template decisions are recorded in `DECISIONS.md`.

## 3. Authentication and staff authorization

Branch: `feat/staff-auth`

- Add Auth.js credentials flow, bcrypt hashing, active/disabled checks, secure session configuration, login/logout UI, and protected staff route group.
- Add `requireStaff`/`requireAdmin` helpers and controlled development/admin provisioning.
- Test authentication, role matrix, disabled users, and direct mutation access.

Depends on: Task 2.

Status: implemented. Auth.js credentials/JWT sessions, login/logout UI, optimistic proxy redirect, database-backed active-user checks, centralized roles/capabilities, development-only admin provisioning, and focused tests are present. Production provisioning, password reset, and login rate limiting remain later hardening/deployment work.

## 4. Public menu browsing

Branch: `feat/public-menu`

- Build public layout, home/menu routes, category navigation, item detail, search/filtering, loading/error/empty states, and responsive menu presentation.
- Create cache/revalidation contract and public DTOs.
- Include realistic fictional content and accessible interaction.

Depends on: Task 2.

## 5. Cart

Branch: `feat/cart`

- Implement item customization rules, cart add/edit/remove, quantity controls, persisted local cart, money utilities, and accessible feedback.
- Treat displayed client totals as estimates pending checkout revalidation.
- Unit test reducers/calculations and option selection rules.

Depends on: Task 4.

## 6. Checkout and order creation

Branch: `feat/checkout`

- Build contact, fulfilment, address, note, and simulated-payment forms.
- Add Zod validation, server repricing, idempotency protection, atomic snapshot creation, and confirmation.
- Handle stale price/availability and submission retry safely.
- Add integration tests for transaction rollback and snapshot invariants.

Depends on: Tasks 2 and 5.

## 7. Customer order status

Branch: `feat/order-status`

- Add non-enumerable tracking route, minimal order DTO, timeline/status presentation, refresh strategy, and privacy/rate-limit controls.
- Test invalid identifiers and data minimization.

Depends on: Task 6.

## 8. Restaurant order management

Branch: `feat/order-management`

- Build order queue/filtering, order detail, authorized status transitions, concurrency conflicts, audit timeline, and actionable states.
- Finalize cancellation policy and test the state machine.

Depends on: Tasks 3 and 6.

## 9. Menu and category management

Branch: `feat/menu-management`

- Build admin category/item/option CRUD, ordering, validation, archive behavior, and fast availability controls.
- Connect cache revalidation and verify historical orders remain unchanged.

Depends on: Tasks 3, 4, and 8.

## 10. Staff management

Branch: `feat/staff-management`

- Build admin-only listing, creation, role/status changes, secure password setup/reset process, and last-active-admin safeguards.
- Audit high-impact changes and test all role paths.

Depends on: Task 3.

## 11. Restaurant settings and analytics

Branch: `feat/settings-analytics`

- Build admin settings form for restaurant, fulfilment, demo payments, delivery fee, and timezone.
- Add basic period/order/status aggregates using persisted order values and documented cancellation policy.
- Test timezone and boundary calculations.

Depends on: Tasks 8–10.

## 12. Frontend polish and responsive UX

Branch: `feat/ux-polish`

- Refine design system, imagery, navigation, responsive layouts, skeleton/empty/error states, micro-interactions, and dashboard density.
- Preserve performance and reduced-motion behavior; avoid generic-template styling.

Depends on: feature-complete flows.

## 13. Security, accessibility, and performance hardening

Branch: `chore/hardening`

- Perform authorization/input/data-exposure review, headers/CSP plan, rate limits, logging redaction, dependency audit, and abuse-case tests.
- Complete keyboard/screen-reader/contrast review and run performance profiling on representative routes.
- Record residual risks and remediation.

Depends on: feature-complete flows.

## 14. Testing and CI/CD

Branch: `chore/testing-ci`

- Complete Vitest/Testing Library coverage, database integration suite, and Playwright critical journeys.
- Add GitHub Actions for install, lint, typecheck, test, build, migration validation, and dependency/security checks as appropriate.
- Define coverage expectations around business invariants rather than a vanity percentage.

Testing is incremental in every prior task; this task closes gaps and establishes the full pipeline.

## 15. Production demo deployment

Branch: `chore/demo-deployment`

- Provision isolated Neon and Vercel resources, configure secrets, run migrations, provision admin safely, seed fictional demo data, and validate rollback/backup/health behavior.
- Add demo-data reset/retention procedure and smoke-test all role journeys.

Depends on: Tasks 13–14. Requires explicit owner approval and credentials/service connections.

## 16. Case study and portfolio proof

Branch: `docs/case-study`

- Document problem, constraints, architecture, major decisions, schema snapshot behavior, role/security model, testing evidence, screenshots, performance/accessibility results, and live-demo limitations.
- Remove internal-only or sensitive operational material from public artifacts.

Depends on: deployed, verified release.

## Pull-request checklist for every task

- Scope and acceptance criteria are stated.
- Database/API/security documentation is updated when contracts change.
- Tests cover changed business behavior and authorization.
- `npm run lint`, `npm run typecheck`, relevant tests, `npm run build`, and `git diff --check` pass.
- No secrets, real customer data, generated build output, or unrelated changes are included.
- Reviewer can run and verify the feature from the PR description.
