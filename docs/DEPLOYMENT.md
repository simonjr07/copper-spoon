# Deployment

## Status and topology

The application is deployed to Vercel with Supabase PostgreSQL, and the hosted QA and portfolio screenshot passes are complete.

~~~text
Vercel -> Next.js -> Prisma -> Supabase PostgreSQL
~~~

- Vercel runs the Node.js application.
- Supabase provides managed PostgreSQL in a compatible region.
- GitHub Actions provides pre-merge quality gates.
- Docker PostgreSQL supports local development.

Supabase is used only as the PostgreSQL provider. Authentication remains in Auth.js.

## Environments

### Local

Uses the Docker database and an ignored .env file. Development seed data is fictional.

### Preview

Preview builds must not mutate the production database. Use an isolated database, a read-only strategy, or a no-database preview until safe branch automation exists.

### Production demo

Uses an isolated Supabase database and fictional restaurant/catalog data. Guest submissions require an approved retention and redaction policy.

## Environment variables

Server-only production variables:

| Variable | Purpose |
| --- | --- |
| DATABASE_URL | Supabase Transaction Pooler URL for application traffic |
| DIRECT_URL | Supabase Session Pooler URL for Prisma CLI and migrations |
| DATABASE_POOL_MAX | Per-instance application pool limit; default 5 |
| AUTH_SECRET | Auth.js encryption/signing secret |
| RATE_LIMIT_SECRET | HMAC key for rate-limit identities |
| AUTH_URL | Canonical origin only when Auth.js cannot infer the deployed host |

Connection strings and secrets must not be exposed to client bundles, logs, screenshots, or source control.

## CI and release gates

The GitHub Actions workflow uses Node 24 and an ephemeral PostgreSQL 17 service. It installs from the lockfile, generates and validates Prisma, applies migrations, then runs lint, type checking, tests, and the production build.

The Vercel configuration uses the repository root, Next.js framework preset, npm ci, and npm run build. package.json selects Node 24 and postinstall generates Prisma Client.

## Database operations

- Application requests use the Transaction Pooler through DATABASE_URL.
- Prisma status and migration commands use the Session Pooler through DIRECT_URL.
- Migrations run once from a controlled shell or serialized job, not during application startup.
- Production uses prisma migrate deploy.
- Production does not use migrate dev, db push, migrate reset, or the development seed.
- Migration SQL is reviewed for locking and destructive operations before release.

## Administrator provisioning

Production provisioning creates a new active administrator and refuses to modify an existing email address.

Required values:

~~~text
NODE_ENV=production
ADMIN_PROVISION_MODE=production
ADMIN_PROVISION_CONFIRM=CREATE_PRODUCTION_ADMIN
ADMIN_PROVISION_NAME=<injected value>
ADMIN_PROVISION_EMAIL=<injected value>
ADMIN_PROVISION_PASSWORD=<injected value>
npm run admin:provision
~~~

The password must be 12-72 UTF-8 bytes and contain a letter, number, and symbol. Temporary provisioning values should be removed after the command completes.

## Production demo catalog

The settings migration creates the RestaurantSettings singleton only when it is absent. It does not create a catalog or user.

The hosted catalog is created with the guarded npm run demo:catalog:bootstrap command. It requires:

~~~text
NODE_ENV=production
PRODUCTION_DEMO_CATALOG_CONFIRM=BOOTSTRAP_PRODUCTION_DEMO_CATALOG
~~~

The command uses DIRECT_URL and one transaction. It creates missing fictional categories, items, option groups, and options. Existing matching catalog records, settings, users, credentials, and orders are unchanged.

## Deployment sequence

1. Create the Supabase project in the selected region.
2. Obtain the Transaction Pooler and Session Pooler connection strings.
3. Configure DATABASE_URL, DIRECT_URL, DATABASE_POOL_MAX, AUTH_SECRET, and RATE_LIMIT_SECRET. Set AUTH_URL only if host inference requires it.
4. Run npm ci, npm run db:generate, npm run db:validate, and npm run db:status.
5. Run npm run db:deploy.
6. Run npm run db:status again and confirm every committed migration is applied.
7. Deploy the Vercel application from the reviewed commit.
8. Provision the production administrator.
9. Run the production demo catalog bootstrap and review settings/catalog data.
10. Complete the [Hosted QA Checklist](HOSTED_QA.md).

## Monitoring and recovery

Monitor application errors, latency, failed order creation, authentication abuse, rate-limit failures, and database connection pressure without logging customer data.

Before public launch:

- Assign monitoring and alert ownership.
- Record Supabase backup/retention settings.
- Rehearse database recovery in an isolated environment.
- Define guest contact-data retention and redaction.

Application rollback is safe only while the database remains backward-compatible. Otherwise, use a reviewed forward fix or restore into an isolated environment before changing production.

## Demo data lifecycle

- Label the service as a demonstration.
- Encourage fictional contact details.
- Purge or redact guest contact/address fields after the approved interval.
- Preserve only synthetic or aggregate portfolio evidence.
- Use authenticated maintenance procedures for catalog/order cleanup.

## Launch checklist

- Production variables are configured and absent from client output.
- All migrations are applied.
- The administrator and fictional catalog are present.
- Public and staff journeys pass hosted QA.
- HTTPS and security headers are correct.
- Accessibility, responsive, and performance evidence is recorded.
- Monitoring, retention, recovery, and rollback responsibilities are assigned.
