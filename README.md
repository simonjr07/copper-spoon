# Copper Spoon

Copper Spoon is a fictional, single-restaurant ordering system built as a production-style portfolio project. It combines a responsive customer ordering experience with a role-protected restaurant operations dashboard.

This repository currently contains the application/database foundation, staff authentication, a database-backed public menu, a browser-persisted guest cart, authoritative pickup/delivery checkout and customer tracking, plus the staff order queue and status workflow.

## Product scope

- Public menu browsing, item customization, cart, checkout, confirmation, and order tracking
- Staff order processing with `ADMIN` and `STAFF` authorization
- Menu, category, availability, settings, staff, and analytics administration
- Simulated payment methods only; no real payment processing or real customer data
- One restaurant; no marketplace, customer accounts, drivers, loyalty, or reservations

See [Product Requirements](docs/PRODUCT_REQUIREMENTS.md) and [Tasks](docs/TASKS.md) for the complete scope.

## Technology

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4
- PostgreSQL 17 with Prisma ORM 7 and the PostgreSQL driver adapter
- Auth.js credentials authentication, bcrypt, and Zod validation
- Vitest for unit and integration tests
- Docker PostgreSQL for local development, Neon for the hosted demo, and Vercel for the app (subject to deployment validation)

## Requirements

- Node.js 24 LTS (see `.nvmrc`)
- npm 11+
- Docker Desktop with Compose

## Local setup

```bash
nvm use
npm ci
Copy-Item .env.example .env
docker compose up -d postgres
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

The public catalog is available at `http://localhost:3000/menu`. It shows only published, non-archived catalog data; published sold-out dishes remain visible with a clear unavailable state.

Available dishes can be configured on their detail pages and added to `http://localhost:3000/cart`. The cart is stored locally in the browser and uses integer-cent estimates. `/checkout` accepts fictional pickup/delivery orders, re-reads the current catalog and restaurant settings, recalculates every amount server-side, and atomically stores immutable order snapshots. Confirmation is available only through the generated non-sequential `CS-…` public code. No real card details or payment processing are used.

Customers can reopen `/order/[orderCode]` or use `/track-order` to fetch the latest recorded status and timeline. The public view uses immutable order snapshots, formats timestamps in the restaurant timezone, and excludes contact details, delivery addresses, internal IDs, staff actors, and notes. It does not promise polling, notifications, live kitchen telemetry, driver tracking, or precise ETAs.

Active `STAFF` and `ADMIN` users can use `/admin/orders` to search and filter the fresh operational queue, inspect contact, fulfilment, snapshots, totals, and internal status history, and advance one state at a time. Staff may cancel only `PENDING` or `CONFIRMED` orders; admins may additionally cancel `PREPARING` orders. Every cancellation requires a reason. `READY`, `COMPLETED`, and `CANCELLED` orders cannot be cancelled.

Customer-facing food imagery is stored locally under `public/images/hero` and `public/images/menu`. The homepage preloads only its above-the-fold hero; menu images use responsive `next/image` sizing and lazy loading. Seeded `MenuItem.imageUrl` values are repository-local `/images/...` paths, and missing or invalid paths render an accessible visual fallback.

On macOS/Linux, copy the environment template with `cp .env.example .env` instead. Replace the local-only database password in both relevant variables before starting PostgreSQL.

Copper Spoon binds PostgreSQL only to `127.0.0.1:5433`; PostgreSQL continues to listen on port `5432` inside the container.

Generate a unique `AUTH_SECRET` in the ignored `.env` before using staff authentication. No staff user is seeded and there is no registration route.

## Development admin provisioning

Provision an initial local admin only after the database migration is applied. Supply all values through the current shell; do not add real credentials to `.env.example` or Git.

PowerShell:

```powershell
$env:NODE_ENV = "development"
$env:ADMIN_PROVISION_NAME = "Fictional Demo Admin"
$env:ADMIN_PROVISION_EMAIL = "admin@copperspoon.example"
$env:ADMIN_PROVISION_PASSWORD = "choose-a-unique-local-password"
npm run admin:provision
Remove-Item Env:ADMIN_PROVISION_PASSWORD
```

The password must be 12–72 UTF-8 bytes and contain a letter, number, and symbol. The command uses bcrypt cost 12, creates an `ACTIVE` `ADMIN`, refuses to run outside development, and refuses to change an existing account with the same normalized email. It never prints the password and is never run automatically.

## Database commands

```bash
npm run db:validate   # validate the Prisma schema
npm run db:generate   # regenerate the ignored Prisma Client output
npm run db:migrate    # create/apply development migrations
npm run db:deploy     # apply existing migrations without creating new ones
npm run db:status     # inspect migration state
npm run db:seed       # upsert fictional development catalog data
npm run db:smoke      # query settings/category/item counts
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
npm test
git diff --check
```

The production build does not run ESLint in Next.js 16, so lint and type checking remain explicit CI gates.

## Repository map

```text
docs/                 Product, architecture, operations, and delivery guidance
public/               Static public assets
src/app/              App Router routes, layouts, and route handlers
src/components/       Reusable cross-feature UI
src/features/         Feature-owned UI, schemas, actions, and domain helpers
src/lib/              Shared framework-agnostic utilities
src/server/           Server-only auth, data access, and services
src/types/            Shared TypeScript declarations
tests/                 Cross-feature integration and test support
prisma/                Schema, migrations, fictional seed, and DB smoke check
```

Route-specific code may be colocated beneath `src/app`. Shared business behavior belongs in feature or server modules rather than route files.

## Documentation

- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database design](docs/DATABASE.md)
- [Application interfaces](docs/API.md)
- [Public image assets](docs/IMAGE_ASSETS.md)
- [Implementation roadmap](docs/TASKS.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Testing strategy](docs/TESTING.md)
- [Security model](docs/SECURITY.md)
- [Deployment plan](docs/DEPLOYMENT.md)
- [Definition of done](docs/DEFINITION_OF_DONE.md)

## Workflow

Keep `main` releasable. Develop each roadmap task on a `codex/<task-name>` or `feat/<task-name>` branch, open a focused pull request, pass quality gates, review, and merge. Do not commit credentials, production data, generated output, or local environment files.

All names, menu content, users, orders, and contact details used in this project must be obviously fictional.
