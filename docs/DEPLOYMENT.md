# Deployment

## 1. Target topology

- Application: Vercel running the Next.js Node.js application, if compatibility and cost remain appropriate
- Database: Neon PostgreSQL in the same practical region as the application
- Local database: Docker PostgreSQL; run the Next.js dev server directly on the host for a faster Windows/macOS workflow
- Source/CI: GitHub with required pull-request checks

This is a plan, not an active deployment. No service should be provisioned or connected without explicit owner approval.

## 2. Environments

### Local

Developer-owned Docker database and `.env.local`. Fictional seed data only. Destructive resets are permitted only against a positively identified local database.

### Preview

Per-pull-request application preview where useful. Database strategy must prevent arbitrary preview branches from mutating production. Prefer an isolated preview database/branch or read-only/no-database previews until automation is safely designed.

### Production demo

Public portfolio application and isolated demo database. It is not a real restaurant service. All content is fictional; guest-entered data has a documented retention/reset policy.

## 3. Configuration contract

Expected server-only variables:

- `DATABASE_URL` — pooled runtime PostgreSQL connection as supported by the selected Prisma/Neon setup
- A direct migration URL if the current Prisma/Neon architecture requires it
- `AUTH_SECRET` — high-entropy environment-specific secret
- `AUTH_URL` or current Auth.js host-trust configuration where required

Public variables are introduced only for values safe to freeze into a browser bundle. Secrets must never use the `NEXT_PUBLIC_` prefix.

The committed `.env.example` is documentation, not usable credentials. Validate required variables during server startup/build where compatible with the chosen runtime.

## 4. Build and release pipeline

Proposed protected-branch pipeline:

1. Use Node 24 and `npm ci` from the lockfile.
2. Run lint and TypeScript checks.
3. Run unit and integration tests with ephemeral PostgreSQL.
4. Validate Prisma schema/migrations and build the application.
5. Create a preview for reviewed pull requests when safe.
6. Merge only after required checks and review.
7. Apply production migrations through one controlled, serialized step.
8. Deploy the compatible application build.
9. Run post-deployment health and critical-journey smoke tests.

Application/schema changes should be expand-and-contract compatible when a rolling or non-atomic deployment could temporarily run old and new versions together.

## 5. Database operations

- Commit migrations; never use ad-hoc production schema pushes.
- Review migration SQL for destructive/locking operations and take a restore point when risk warrants it.
- Use least-privilege application credentials and separate migration authority if the platform supports it.
- Confirm connection pooling and serverless connection limits with current official Prisma and Neon guidance.
- Seed production demo content through an explicit fictional-data process. Never auto-create an admin with a committed password.

## 6. Admin provisioning

Production admin creation requires a one-time controlled command or protected job that accepts the email/password through secret input, hashes it, reports only the created identity, and refuses unsafe duplicate behavior. Rotate/remove temporary provisioning access after use. Never place a production password in seed files, shell history, CI logs, or the repository.

## 7. Health, monitoring, and recovery

- A shallow health check confirms the app process; a private readiness check may confirm database reachability.
- Monitor elevated errors, latency, failed order creation, authentication abuse, and database resource limits without logging customer data.
- Define alert ownership before public launch.
- Test database restore/recovery and document Neon retention/branch capabilities selected at provisioning time.
- Roll back application code only when schema compatibility allows it; otherwise deploy a forward fix.

## 8. Demo data lifecycle

- Clearly label the service as a demonstration and discourage real personal information.
- Run a scheduled/manual purge or redaction process for guest contact/address fields after the approved retention interval.
- Preserve aggregate/synthetic portfolio evidence without retaining identifiable submissions.
- Reset catalog/orders only through an authenticated maintenance process with a dry run and target-environment guard.

## 9. Launch checklist

- Owner approves provider accounts, region, currency/timezone, cost limits, and public demo disclaimer.
- Required checks pass from a clean checkout on Node 24.
- Environment validation passes with no secrets exposed to the client or logs.
- Migrations apply successfully to a production-like database and recovery is understood.
- Admin is provisioned securely; staff/admin role journeys pass.
- Guest order, confirmation/status, menu change, and historical snapshot journeys pass.
- Accessibility, responsive, security, rate-limit, and performance reviews are complete.
- Contact retention/reset and incident/rollback procedures are recorded.

## 10. Rollback outline

1. Stop/limit new deployments and identify the failing release.
2. If the schema is backward-compatible, redeploy the last known-good application build.
3. If data/schema is involved, avoid destructive reversal; use a reviewed forward migration/fix or restore into an isolated environment before any production action.
4. Validate order creation/status, authentication, and data integrity.
5. Record impact, remediation, and follow-up tests.
