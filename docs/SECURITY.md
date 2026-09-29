# Security

## 1. Security goals

Protect staff access, order/customer data, database integrity, credentials, and the reliability of the ordering workflow. The hosted portfolio demo contains fictional restaurant data, but guest-submitted contact fields must still be treated as sensitive.

## 2. Trust boundaries

- Browser data is untrusted, including hidden fields, totals, role/status values, IDs, and cart content.
- The versioned local cart schema limits and sanitizes browser persistence for resilient rendering only; it does not make stored item/option IDs, availability, names, prices, or totals authoritative.
- Server Actions and Route Handlers are network-reachable boundaries, even when only referenced by protected UI.
- Sessions prove identity but sensitive operations also confirm active account state and authorization.
- Database values rendered into HTML still require safe framework rendering and intentional DTO selection.
- CI, Vercel, Neon, and local Docker credentials are separate secret domains.

## 3. Authentication

- Auth.js credentials authentication with bcrypt cost-12 password hashes.
- Encrypted JWT sessions expire after eight hours. Safe role/status claims support UI and optimistic checks, but protected work re-reads current database state so disabled accounts lose access on their next protected request.
- Generic login failures avoid account enumeration. Durable fixed-window limits apply per keyed client digest and per normalized account digest: 10 login attempts per 15 minutes.
- Secure, HTTP-only, same-site cookies in production and documented session expiration.
- Disabled users cannot create new sessions. High-impact operations re-check current database status/role.
- No public registration, hard-coded password, shared production credential, or password in logs/URLs.
- Admin provisioning is a deliberate command/process with secret input and audit output, not an automatic production seed.
- Development provisioning requires `NODE_ENV=development`. Production provisioning requires `NODE_ENV=production`, `ADMIN_PROVISION_MODE=production`, and the exact one-time confirmation value. Both use validated environment-only input, refuse existing email addresses without modification, hash at cost 12, and never log passwords.

## 4. Authorization

- Capabilities derive from `ADMIN` and `STAFF`, centralized in server-only helpers.
- Every protected query/mutation performs authorization near the data operation.
- Route/layout guards are defense-in-depth and UX, not the only enforcement.
- Next.js Proxy performs session-presence checks only; it never performs database authorization.
- Admin-only: menu/category writes, staff administration, and settings.
- Staff/admin: dashboard analytics, order reads, and permitted status changes.
- Prevent disabling/demoting the final active admin unless a safe recovery path exists.

## 5. Input and transaction security

- Validate and normalize all form/query/path input with Zod; enforce length, format, enum, and conditional rules.
- Reprice orders from database records and use a transaction for order/items/options/events.
- Use Prisma parameterization; raw SQL requires a documented need and parameter binding.
- Limit quantities, note lengths, item counts, and request sizes to control abuse.
- Maintain checkout idempotency/replay protection and add optimistic concurrency to status updates.
- Checkout uses a unique UUID submission token, bounded cart identifiers/quantities, current-record validation, server-only repricing, a serializable transaction, and 12-attempt-per-10-minute client rate limiting.
- Enforce state-machine transitions server-side.

## 6. Data protection

- Collect only name, email, phone, necessary delivery address, fulfilment details, and an optional note.
- Never collect card numbers/CVV; `DEMO_CARD` is visibly simulated.
- Public status responses hide unnecessary contact/address fields and use a high-entropy identifier.
- The implemented confirmation query accepts only a database-format `CS-` bearer code and selects snapshots/status/totals without customer contact, delivery address, internal IDs, staff data, or notes.
- Public order lookup normalizes only format-valid codes, performs one indexed uncached read, and uses identical not-found language for malformed and unknown values. The dedicated DTO excludes checkout tokens, event notes, staff actors, and mutable catalog records. Codes remain bearer credentials; a 60-attempt-per-10-minute client limit runs before the order read and a throttled response reveals no order existence.
- Admin order reads require `orders:read`; the update action independently requires an active user with `orders:update-status`. Actor identity/role and the current order status are loaded server-side. Hidden IDs, desired status, timestamps, and cancellation text are treated as untrusted input.
- Status writes enforce one-edge progression, terminal-state rules, role-specific cancellation limits, bounded mandatory cancellation reasons, and a conditional `updatedAt` predicate. The order row and internal actor-attributed event commit atomically, while the public projection never selects the event note or actor.
- Catalog overview reads require `menu:read`; category and menu/option mutations independently require admin-only `categories:write` or `menu:write`. Direct Server Action calls by staff are denied even when write controls are absent from their UI.
- Catalog actions validate all identifiers and relationships server-side, normalize unique slugs, parse decimal money without floating-point persistence, allow only safe `/images/...` asset paths, and map Prisma uniqueness/relationship failures to non-diagnostic messages. Archive is non-destructive and cannot modify order snapshots.
- Logs redact passwords, session/cookie values, connection strings, authorization headers, and customer contact/address data.
- Define hosted-demo retention and periodic purge/redaction before deployment.
- Backups, if enabled, inherit the same access/retention expectations.

## 7. Secrets and environment

- Commit `.env.example` placeholders only. `.env`, `.env.*`, certificates, keys, and credentials remain ignored.
- Server secrets never use `NEXT_PUBLIC_`.
- Use distinct least-privilege credentials per environment and rotate suspected exposures.
- Do not expose database ports publicly in hosted environments.
- CI secrets are scoped to required jobs/environments; pull requests from untrusted forks do not receive deployment secrets.

## 8. Web controls

- Rely on React escaping; avoid raw HTML. Sanitize any future rich content.
- Maintain same-origin mutation patterns and Auth.js CSRF/session protections; assess explicit CSRF controls for any custom cookie-authenticated handler.
- Every route receives a same-origin CSP, clickjacking denial, MIME sniffing prevention, strict referrer policy, restricted browser permissions, opener isolation, and production HSTS. The static CSP permits only the inline script/style behavior currently required by Next.js; development alone permits `unsafe-eval`.
- Validate/allowlist remote image origins before configuring them.
- PostgreSQL-backed atomic rate-limit buckets protect login, checkout, and public status lookup across serverless instances. HMAC digests—not plaintext IP/email/order/customer values—are stored, expired buckets are pruned opportunistically, and protected surfaces fail closed when the limiter is unavailable.
- Avoid open redirects and user-controlled URLs.

## 9. Error handling and observability

- Users receive safe validation or generic failure messages, never stack traces, SQL, internal IDs, or secret configuration.
- Security-relevant events include repeated login failures, denied capabilities, provisioning, staff-role/status changes, invalid transitions, and unusual order rates.
- Staff-management pages and Server Actions require `staff:manage`; a `STAFF` caller is rejected server-side. Account DTOs explicitly omit `passwordHash`, and plaintext passwords are neither logged nor returned.
- Email is normalized before the database's unique constraint. Creation and admin-driven replacement reuse the strong password policy and bcrypt cost 12. Existing passwords are never displayed.
- Self-disable and self-role changes are forbidden. Last-active-admin demotion/disable checks and writes share a serializable transaction; account deletion is not exposed. Disabled sessions fail the next database-backed active-user authorization check.
- Audit records should identify actor/action/target/time without capturing secrets or excessive PII.

## 10. Dependency and delivery security

- Lock dependencies, review update diffs, and run vulnerability scanning in CI once configured.
- Review official version-specific Next.js/Prisma/Auth.js guidance before implementation and upgrades.
- Protect the main branch with review and required checks when the remote repository is configured.
- Run migrations through a controlled deployment step and never reset a shared database.

The 2026-09-29 production dependency audit reports zero critical and four high-severity findings, all through the Prisma 7.10 CLI/config dependency tree (`deepmerge-ts`, `mysql2`, `@prisma/config`, and `prisma`). Copper Spoon uses PostgreSQL, does not import the CLI at runtime, and does not accept user-controlled Prisma configuration. npm offers Prisma 6.19.3 as a semver-major downgrade rather than a compatible fix. Track the upstream Prisma release and update after compatibility review; do not use `npm audit fix --force` or override the transitive packages blindly.

## 11. Residual risks and release blockers

- The rate-limit table migration must be applied through the controlled deployment step before the hardened application is released; the public actions intentionally fail closed if storage is unavailable.
- Hosted-demo contact retention/redaction duration, purge automation, monitoring provider, alert ownership, and recovery rehearsal remain owner-approved deployment decisions.
- The pragmatic static CSP retains `unsafe-inline` for Next.js compatibility. Moving to a nonce-based CSP would force dynamic rendering and should be evaluated only with measured performance evidence.
- A distributed adversary can rotate source addresses. The limiter is a bounded abuse control, not a bot-management or DDoS service.
- Manual keyboard/screen-reader/browser profiling and production-like database migration rehearsal remain release evidence; local automated gates do not substitute for them.

## 12. Pre-deployment threat-review checklist

- Test direct calls to every protected action/handler as anonymous, staff, disabled staff, and admin.
- Verify checkout ignores forged totals/status/payment fields and handles replay/concurrency.
- Verify public order enumeration and data minimization defenses.
- Inspect client bundles/network responses for secrets and over-broad DTOs.
- Exercise logging/error paths and confirm redaction.
- Review headers, cookies, CSP, rate limits, dependency findings, demo-data reset, and admin recovery.

Report suspected vulnerabilities privately to the repository owner; do not include exploitable production details in public issues.
