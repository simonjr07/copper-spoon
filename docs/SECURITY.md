# Security

## Security goals

Copper Spoon protects staff access, customer order data, credentials, database integrity, and ordering workflow reliability. The restaurant and catalog are fictional, but guest-submitted contact and delivery data are treated as sensitive.

## Trust boundaries

- Browser data is untrusted, including hidden fields, IDs, prices, totals, roles, status values, and cart content.
- Server Actions and Route Handlers are network-reachable endpoints.
- Session claims support identity and navigation; protected work re-checks the current database user and capability.
- Public and administrative responses use bounded view models rather than unrestricted database records.
- Local, CI, Vercel, and Supabase credentials are separate secret domains.

## Authentication

- Auth.js credentials authentication
- bcrypt cost-12 password hashes
- Encrypted JWT sessions with an eight-hour lifetime
- Generic failures for unknown, invalid, disabled, and throttled login attempts
- Database-backed active-user checks on protected requests
- No public registration or customer authentication
- No shared, hard-coded, or automatically seeded administrator credentials

Administrator provisioning accepts validated environment input and creates a new account only. Production mode requires an exact confirmation value. Passwords are never logged or returned.

## Authorization

Capabilities are defined centrally for ADMIN and STAFF.

- Both roles can read orders, update permitted order states, view the catalog, and view dashboard analytics.
- ADMIN can write catalog data and manage staff accounts.
- Route and layout guards improve navigation but do not replace authorization in server queries and mutations.
- Staff management prevents self-disable, self-role changes, and removal of the final active administrator.

## Validation and transactions

- Zod validates form, path, and query input at server boundaries.
- Checkout reloads catalog and settings data and calculates all prices on the server.
- Order creation uses a serializable transaction and a unique checkout token.
- Status updates enforce the state machine, compare a concurrency token, and write the audit event atomically.
- Staff role/status changes and final-admin checks share a serializable transaction.
- Prisma parameterization is used for database input; raw SQL is limited to reviewed parameterized queries and migrations.

## Public data protection

Public tracking returns order status, immutable item snapshots, totals, and event timestamps. It excludes:

- Customer contact and delivery address
- Checkout token
- Internal order IDs
- Staff actors
- Event and cancellation notes
- Current catalog administration fields

Malformed and unknown order codes use the same response. Public codes remain bearer credentials and are protected by rate limiting.

The application does not collect card numbers or CVV. DEMO_CARD is a simulated option.

## Rate limiting

Login, checkout, and public order lookup use atomic PostgreSQL fixed-window buckets so limits work across Vercel instances.

Identity keys are HMAC digests scoped to each action. Plaintext IP addresses, emails, order codes, and customer fields are not stored in RateLimitBucket. Expired rows are pruned opportunistically. Protected actions fail closed if the limiter is unavailable.

## Browser and HTTP controls

Responses include:

- Content Security Policy
- Frame denial
- MIME sniffing prevention
- Referrer policy
- Permissions policy
- Opener isolation
- Production HSTS

The static CSP permits the inline script/style behavior required by the current Next.js setup. Development also permits unsafe-eval. A nonce-based policy would require a measured rendering and caching tradeoff.

React escaping is the default. The project does not render untrusted raw HTML or allow user-controlled redirect URLs.

## Secrets and logs

- Commit placeholders in .env.example only.
- Keep database URLs, Auth.js secrets, rate-limit keys, passwords, cookies, and tokens server-side.
- Never expose secrets through NEXT_PUBLIC_ variables.
- Redact credentials, authorization headers, contact details, addresses, and internal database errors from logs.
- Scope CI and deployment credentials to the jobs and environments that need them.

## Dependency security

Dependencies are locked and updated through reviewed changes. CI performs deterministic install, migration, lint, type, test, and build gates.

The 2026-09-29 audit reported four high-severity findings in the Prisma CLI/config dependency tree and no critical findings. Copper Spoon uses PostgreSQL and does not ship the Prisma CLI as application runtime code. The findings require upstream-compatible updates; forced downgrades or unreviewed transitive overrides are not accepted fixes.

## Residual risks

- Contact-data retention and purge operations must be finalized before public traffic.
- Monitoring provider and alert ownership are not yet selected.
- The static CSP retains framework-required inline allowances.
- The rate limiter does not replace platform-level DDoS or bot protection.
- Hosted keyboard, screen-reader, browser, performance, and recovery evidence is still required.

Security issues should be reported privately rather than disclosed with exploitable production detail.
