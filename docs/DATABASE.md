# Database Design

## Overview

Copper Spoon uses PostgreSQL 17 and Prisma ORM 7.10. The schema is defined in prisma/schema.prisma; reviewed migrations are stored in prisma/migrations.

Timestamps use TIMESTAMPTZ(3) and are treated as UTC instants. The restaurant timezone, currently America/New_York, is used for display and operational day boundaries.

## Money and identifiers

- Monetary values are stored as integer USD cents.
- Primary keys are Prisma-generated CUID strings.
- Order.publicCode is a unique customer code in the form CS- plus 6-12 uppercase alphanumeric characters.
- Order.checkoutToken stores a unique UUID for retry-safe checkout.

Public order codes use cryptographic randomness and uniqueness retry.

## Main models

### User

Stores normalized email, display name, bcrypt password hash, role, active/disabled status, last login, and timestamps. Users are disabled rather than deleted in normal operation.

### Catalog

Category, MenuItem, MenuItemOptionGroup, and MenuItemOption define the menu hierarchy, ordering, publication, availability, archive state, selection bounds, and price adjustments.

Catalog records are unpublished, disabled, or archived instead of being deleted. Category deletion is restricted while menu items refer to it.

### Order

Stores lifecycle, fulfilment, simulated payment state, customer contact, delivery snapshot, notes, currency, persisted totals, and operational timestamps.

Database checks cover checkout-token format, normalized email, complete delivery addresses, payment/fulfilment compatibility, non-negative amounts, the total equation, and zero delivery fee for pickup.

### Order snapshots

OrderItem stores the item name, unit price, quantity, option total, and line total at checkout. OrderItemOption stores the option-group name, option name, and adjustment price.

Current catalog changes cannot alter these values. Historical views and analytics use snapshot columns and persisted order totals.

### OrderStatusEvent

Stores the previous status, next status, optional staff actor, note, and timestamp. Initial events may have no previous status. Other events cannot record the same source and destination status.

### RestaurantSettings

Uses the fixed primary key restaurant-settings to enforce a single row. It stores restaurant identity, contact/address fields, currency, timezone, fulfilment/payment switches, delivery fee, and delivery minimum.

### RateLimitBucket

Stores an action name, a 64-character HMAC identity digest, aligned window start, attempt count, and expiry. It does not store plaintext IP addresses, emails, order codes, or customer fields.

## Relationships

~~~text
Category 1 --- * MenuItem
MenuItem 1 --- * MenuItemOptionGroup
MenuItemOptionGroup 1 --- * MenuItemOption
Order 1 --- * OrderItem
OrderItem 1 --- * OrderItemOption
Order 1 --- * OrderStatusEvent
User 1 --- * OrderStatusEvent (optional actor)
~~~

Order-owned children cascade only when an order is deliberately deleted. Catalog and staff references on historical records become null if their source is removed, while snapshot data remains intact.

## Transactional workflows

### Order creation

One serializable transaction resolves the checkout token, loads current settings and catalog data, validates the request, calculates all amounts, and creates the order, snapshots, and initial PENDING event. Supported uniqueness and serialization conflicts are retried.

### Order status changes

The service validates the next state and compares the current status and updatedAt value. The order update and status event commit together.

### Staff role and status changes

Last-active-admin checks and role/status updates share a serializable transaction to prevent concurrent lockout.

## Constraints and indexes

Migration SQL adds checks that Prisma Schema Language cannot express, including amount equations, quantity bounds, option selection bounds, delivery requirements, payment compatibility, public-code format, and the settings singleton.

Indexes cover staff identity/status, catalog slugs and ordering, public order codes, checkout tokens, recent orders, order children, event timelines, and rate-limit expiry.

## Migrations

The migration history includes:

- Initial schema, relationships, indexes, enums, and checks
- Checkout idempotency token
- Durable rate-limit buckets
- Idempotent restaurant-settings bootstrap

The settings bootstrap inserts minimal fictional defaults only when the singleton is absent. It does not overwrite settings or create catalog, user, credential, or order data.

Production uses prisma migrate deploy through DIRECT_URL. Development uses prisma migrate dev. Shared environments must not use schema reset or db push.

## Seed and demo catalog

npm run db:seed is for development. It updates the settings singleton and normalizes the known fictional catalog by slug/name.

The hosted demo uses npm run demo:catalog:bootstrap. This guarded command:

- Connects through DIRECT_URL.
- Requires production mode and an exact confirmation value.
- Runs in one transaction.
- Creates missing fictional categories, items, groups, and options.
- Leaves matching records, settings, users, credentials, and orders unchanged.

The catalog contains five categories, seven items, three option groups, and six options.

## Local workflow

~~~powershell
Copy-Item .env.example .env
docker compose up -d postgres
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:smoke
~~~

Local DATABASE_URL and DIRECT_URL use localhost:5433. Docker maps 127.0.0.1:5433 to PostgreSQL port 5432 inside the container.

Stop the service with docker compose stop. docker compose down retains the named volume unless -v is supplied.

## Integration testing

CI starts an isolated PostgreSQL 17 service, generates and validates Prisma, applies the complete migration history, and then runs the test and build gates. Production credentials are not used in CI.
