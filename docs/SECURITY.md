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
- Generic login failures to avoid account enumeration; rate limiting/backoff for repeated attempts.
- Secure, HTTP-only, same-site cookies in production and documented session expiration.
- Disabled users cannot create new sessions. High-impact operations re-check current database status/role.
- No public registration, hard-coded password, shared production credential, or password in logs/URLs.
- Admin provisioning is a deliberate command/process with secret input and audit output, not an automatic production seed.
- Development provisioning requires `NODE_ENV=development`, validated environment-only input, refuses existing email addresses without modification, never logs passwords, and is not a production bootstrap mechanism.

## 4. Authorization

- Capabilities derive from `ADMIN` and `STAFF`, centralized in server-only helpers.
- Every protected query/mutation performs authorization near the data operation.
- Route/layout guards are defense-in-depth and UX, not the only enforcement.
- Next.js Proxy performs session-presence checks only; it never performs database authorization.
- Admin-only: menu/category writes, staff administration, settings, analytics.
- Staff/admin: order reads and permitted status changes.
- Prevent disabling/demoting the final active admin unless a safe recovery path exists.

## 5. Input and transaction security

- Validate and normalize all form/query/path input with Zod; enforce length, format, enum, and conditional rules.
- Reprice orders from database records and use a transaction for order/items/options/events.
- Use Prisma parameterization; raw SQL requires a documented need and parameter binding.
- Limit quantities, note lengths, item counts, and request sizes to control abuse.
- Maintain checkout idempotency/replay protection and add optimistic concurrency to status updates.
- Checkout now uses a unique UUID submission token, bounded cart identifiers/quantities, current-record validation, server-only repricing, and a serializable transaction. Task 13 still adds request-rate limiting.
- Enforce state-machine transitions server-side.

## 6. Data protection

- Collect only name, email, phone, necessary delivery address, fulfilment details, and an optional note.
- Never collect card numbers/CVV; `DEMO_CARD` is visibly simulated.
- Public status responses hide unnecessary contact/address fields and use a high-entropy identifier.
- The implemented confirmation query accepts only a database-format `CS-` bearer code and selects snapshots/status/totals without customer contact, delivery address, internal IDs, staff data, or notes.
- Public order lookup normalizes only format-valid codes, performs one indexed uncached read, and uses identical not-found language for malformed and unknown values. The dedicated DTO excludes checkout tokens, event notes, staff actors, and mutable catalog records. Codes remain bearer credentials; Task 13 must add rate limiting before hosted launch.
- Admin order reads require `orders:read`; the update action independently requires an active user with `orders:update-status`. Actor identity/role and the current order status are loaded server-side. Hidden IDs, desired status, timestamps, and cancellation text are treated as untrusted input.
- Status writes enforce one-edge progression, terminal-state rules, role-specific cancellation limits, bounded mandatory cancellation reasons, and a conditional `updatedAt` predicate. The order row and internal actor-attributed event commit atomically, while the public projection never selects the event note or actor.
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
- Add security headers and a practical Content Security Policy during hardening, accounting for Next.js requirements and external image hosts.
- Validate/allowlist remote image origins before configuring them.
- Apply rate limits to login, checkout, and public status lookup. Fail safely if the rate-limit service is unavailable according to endpoint risk.
- Avoid open redirects and user-controlled URLs.

## 9. Error handling and observability

- Users receive safe validation or generic failure messages, never stack traces, SQL, internal IDs, or secret configuration.
- Security-relevant events include repeated login failures, denied capabilities, provisioning, staff-role/status changes, invalid transitions, and unusual order rates.
- Audit records should identify actor/action/target/time without capturing secrets or excessive PII.

## 10. Dependency and delivery security

- Lock dependencies, review update diffs, and run vulnerability scanning in CI once configured.
- Review official version-specific Next.js/Prisma/Auth.js guidance before implementation and upgrades.
- Protect the main branch with review and required checks when the remote repository is configured.
- Run migrations through a controlled deployment step and never reset a shared database.

Current foundation note: npm reports four high-severity advisories through the stable Prisma 7.10 CLI dependency tree (`deepmerge-ts` and the unused MySQL driver). Copper Spoon uses PostgreSQL only, does not import the CLI at runtime, and does not process user-controlled Prisma configuration. npm currently suggests Prisma 6.19.3 as the automated fix, but that would undo the supported Node 24/Prisma 7 architecture. Track the upstream Prisma patch and update promptly; do not force a major transitive override without compatibility verification.

## 11. Pre-deployment threat-review checklist

- Test direct calls to every protected action/handler as anonymous, staff, disabled staff, and admin.
- Verify checkout ignores forged totals/status/payment fields and handles replay/concurrency.
- Verify public order enumeration and data minimization defenses.
- Inspect client bundles/network responses for secrets and over-broad DTOs.
- Exercise logging/error paths and confirm redaction.
- Review headers, cookies, CSP, rate limits, dependency findings, demo-data reset, and admin recovery.

Report suspected vulnerabilities privately to the repository owner; do not include exploitable production details in public issues.
