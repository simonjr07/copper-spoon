# Definition of Done

Copper Spoon is release-ready when the following checks are satisfied.

## Product

- Guests can browse, configure, order, and track fictional pickup and delivery orders.
- STAFF can review and progress orders within the allowed state machine.
- ADMIN can manage the catalog and staff accounts.
- Dashboard analytics use persisted order data and immutable item snapshots.
- No interface implies real payment processing, driver tracking, or customer accounts.

## Data integrity

- Checkout recalculates prices from current database records.
- Order creation is atomic and retry-safe.
- Submitted orders retain immutable item and option snapshots.
- Status changes write an audit event in the same transaction.
- Catalog changes cannot rewrite order history.
- Final-active-admin protection is enforced transactionally.

## Security

- Protected operations authenticate, authorize, and validate at the server boundary.
- Passwords use bcrypt cost 12 and are never logged or returned.
- Disabled accounts lose access on the next protected request.
- Public order responses exclude private and internal fields.
- Login, checkout, and order lookup use durable rate limits.
- Security headers and production cookies are verified over HTTPS.
- Secrets are absent from source control, client bundles, logs, and screenshots.

## User experience

- Critical public and administrative flows work from 320 px through desktop widths.
- Keyboard focus is visible and controls have accessible names.
- Errors are associated with their inputs and do not expose technical details.
- Reduced-motion preferences are respected.
- Loading, empty, success, conflict, and error states are usable.

## Engineering quality

- npm run lint passes.
- npm run typecheck passes.
- npm test passes.
- npm run build passes.
- npm run db:validate and npm run db:generate pass.
- git diff --check passes.
- CI applies migrations and completes all quality gates.

## Documentation and operations

- Setup, architecture, database, interfaces, security, testing, and deployment docs match the repository.
- Production variables, migrations, administrator provisioning, demo catalog creation, rollback, recovery, and retention are documented.
- Hosted QA is complete and recorded.
- The public URL and screenshots are added only after verification.
- Known limitations and unresolved operational risks are documented.
