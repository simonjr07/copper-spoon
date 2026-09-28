# Definition of Done

This project is done when the agreed product works end to end, is reviewable and operable, and the evidence below exists. Individual tasks use the applicable subset plus their own acceptance criteria.

## Product

- Guest can browse/search/filter an available categorized menu, configure items, manage a cart, and submit pickup or delivery checkout with a compatible simulated payment method.
- Confirmation and a non-enumerable public status experience accurately reflect the submitted order.
- Staff can securely sign in, view/process orders, and apply only valid status transitions.
- Admin can manage catalog, availability, staff, restaurant settings, and basic analytics.
- Active staff and admins can use a fresh operational dashboard whose status, fulfilment, recent-order, seven-day, and popular-item metrics are timezone-aware, snapshot-safe, empty-state-safe, and free of customer-private fields or misleading revenue claims.
- Staff management creates only validated normalized accounts, exposes no password hashes, supports confirmed disable/reactivate instead of deletion, blocks self-lockout, and transactionally preserves at least one active administrator.
- No out-of-scope real payments, customer accounts, marketplace, drivers, loyalty, or reservations have slipped in.

## Data integrity

- Server-authoritative pricing, integer minor-unit calculations, immutable item/option snapshots, persisted totals, and atomic order creation are implemented and tested.
- Historical orders remain unchanged after catalog edits or archiving.
- State transitions and concurrent updates preserve an auditable history.
- Migrations apply cleanly to an empty database and the fictional seed is safe/repeatable.
- Database check constraints protect non-negative cents, total equations, selection bounds, delivery requirements, compatible pay-later methods, public-code shape, and the singleton settings row.

## Security and privacy

- Credentials are bcrypt-hashed; sessions/cookies use safe production settings; disabled accounts are denied.
- JWT claims never replace current database checks for protected operations, and no password hash is serialized into a session.
- Every protected read/mutation enforces server-side authentication and role/capability authorization.
- Inputs are validated, errors are safe, logs redact secrets/contact data, and direct-access abuse cases are tested.
- No secrets, hard-coded production passwords, card data, or real portfolio seed identities exist in the repository.
- Public order lookup resists enumeration and exposes only necessary data.
- Rate limits, security headers/CSP decision, dependency review, admin provisioning, and demo-data retention are complete.

## User experience

- Public menu list/detail routes expose only published catalog content, preserve configured order, distinguish sold-out items without implying orderability, and handle search/no-data/not-found states.
- Public food imagery is repository-local, web-optimized, responsive, meaningfully described, visually cohesive, stable during loading, and resilient to missing assets.
- The guest cart distinguishes item configurations, enforces visible option bounds, persists safely in the browser, exposes accessible quantity/removal controls, and clearly labels totals as estimates pending checkout revalidation.
- Checkout conditionally validates pickup/delivery and demo payment input, ignores browser prices, reprices current catalog/settings data in one idempotent transaction, persists immutable snapshots plus the initial event, and confirms through a non-sequential public code without exposing private/internal fields.
- Customer order status reloads fresh recorded state by bearer code, exposes only a purpose-built snapshot/timeline DTO, handles invalid/unknown codes uniformly, uses fulfilment-honest accessible messaging, and does not imply unimplemented telemetry or delivery tracking.
- Restaurant staff can search/filter a fresh responsive order queue, inspect complete operational snapshots/history, advance only one valid lifecycle edge, receive safe stale-state feedback, and cancel only within the documented role window with a required internal reason.
- Staff can inspect the current catalog read-only; admins can manage category/item/option lifecycle, ordering, exact prices, and safe local imagery. Successful writes immediately refresh public catalog data, destructive relationship deletion is avoided, and historical order snapshots remain unchanged.
- Critical public flow works from 320 px mobile through desktop; dashboard is usable at its target breakpoints.
- Semantic structure, keyboard access, focus management, names/labels, errors, contrast, and reduced motion pass review.
- Loading, empty, success, stale/conflict, and unexpected-error states are intentional.
- Visual design feels warm, modern, approachable, and internationally neutral rather than like an unchanged starter/template.
- Representative deployed pages meet agreed performance targets or have documented, accepted exceptions.

## Engineering quality

- Architecture remains a cohesive single Next.js application with server-only data access and narrow client boundaries.
- Code is strictly typed, reasonably factored by feature, and has no unexplained dead code or warnings.
- Unit, component, integration, and end-to-end tests cover the critical invariant/journey list in `TESTING.md`.
- Lint, typecheck, tests, production build, migration validation, and `git diff --check` pass locally and in CI.
- Dependencies are locked and current enough to have no unaccepted high/critical vulnerabilities.

## Documentation and operations

- README setup works from a clean checkout with documented Node/Docker prerequisites.
- Product, architecture, database, interface, decision, testing, security, deployment, and task docs match implementation.
- Environment variables, migrations, seed, provisioning, deployment, rollback, recovery, monitoring, and data purge are documented and rehearsed proportionally to demo risk.
- Public demo limitations and fictional nature are clearly communicated.

## Delivery evidence

- Work reached `main` through focused reviewed pull requests with green required checks.
- Hosted demo is smoke-tested after deployment.
- Case study includes architecture and schema reasoning, snapshot proof, authorization matrix, test/CI evidence, accessibility/performance results, responsive screenshots, and known limitations.
- No unresolved release-blocking defects or undocumented high-risk exceptions remain.

## Task-level handoff checklist

- Acceptance criteria are met without unrelated scope.
- Relevant docs/decisions are updated.
- Tests were added or the absence is explicitly justified.
- Required commands and results are reported.
- Files changed and follow-up/approval needs are reported.
- No commit, push, migration against shared data, service provisioning, or production change occurred without explicit authorization.
