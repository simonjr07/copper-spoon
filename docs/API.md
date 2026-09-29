# Application Interfaces

Copper Spoon is a first-party Next.js application, not a public API product. Server Components call server-only queries, Server Actions handle UI mutations, and Route Handlers are limited to Auth.js and interfaces that benefit from HTTP semantics.

## Boundary rules

- Validate untrusted input with Zod on the server.
- Treat client IDs, prices, totals, availability, roles, and statuses as untrusted.
- Check active-user state and capabilities at each protected query or mutation.
- Return bounded view models rather than unrestricted Prisma records.
- Keep password hashes, raw sessions, internal errors, and unnecessary customer data on the server.
- Return stable validation, authentication, authorization, not-found, conflict, and generic error states.

## Server queries

| Query | Access | Result |
| --- | --- | --- |
| getPublicMenu | Public | Published categories and orderable/displayable menu data |
| getPublicMenuItem | Public | One published item with active groups and available choices |
| getCustomerOrderStatus | Public order code | Current status, immutable snapshots, totals, and public timeline |
| getDashboardSummary | STAFF, ADMIN | Operational counts, activity, fulfilment mix, recent orders, and popular items |
| listOrders | STAFF, ADMIN | Searchable and paginated order summaries |
| getOrderDetail | STAFF, ADMIN | Customer, fulfilment, snapshot, total, and internal event data |
| getMenuAdmin | STAFF read, ADMIN write | Complete catalog including draft and archived records |
| listStaff | ADMIN | Staff identity, role, status, creation, and last-login data |

## Server Actions

| Action | Access | Behavior |
| --- | --- | --- |
| createOrder | Public, rate limited | Validate, reprice, resolve idempotency, and create the order transactionally |
| updateOrderStatus | STAFF, ADMIN | Enforce state and role rules, detect stale writes, and append an audit event |
| saveCategory | ADMIN | Validate category data and invalidate the public catalog cache |
| saveMenuItem | ADMIN | Validate item data, price, image path, and lifecycle state |
| archiveMenuItem | ADMIN | Archive and unpublish without deleting history |
| saveOptionGroup / saveMenuOption | ADMIN | Validate ownership, selection bounds, availability, and prices |
| createStaffUser | ADMIN | Create an active account with a normalized email and bcrypt hash |
| updateStaffUser | ADMIN | Update safe profile/role fields with self and last-admin protection |
| setStaffUserStatus | ADMIN | Disable or reactivate an account with lockout protection |
| resetStaffPassword | ADMIN | Replace another user's password without returning plaintext or hashes |

Restaurant settings do not currently have an editing action.

## Route Handlers

- GET/POST /api/auth/[...nextauth] is managed by Auth.js.
- No generic public menu or order CRUD API is exposed.
- A future health endpoint should expose process status only; database readiness details should remain private.

## Cart and checkout contract

The browser stores a versioned cart under copper-spoon:cart. It contains item and option display snapshots, quantities, and estimated integer-cent prices.

Checkout submits identifiers, quantities, a UUID token, customer/fulfilment fields, and a simulated payment choice. The server discards client prices as authority, reloads current data, validates compatibility, and calculates all totals.

Repeated submissions with the same committed checkout token return the original public order code.

## Order status contract

Normal progression is:

~~~text
PENDING -> CONFIRMED -> PREPARING -> READY -> COMPLETED
~~~

STAFF may cancel PENDING or CONFIRMED orders. ADMIN may also cancel PREPARING orders. READY and terminal orders cannot be cancelled. Cancellation requires a trimmed reason of at most 500 characters.

The order update and actor-attributed event commit in one serializable transaction.

## Public tracking contract

/track-order normalizes valid codes and redirects to /order/[orderCode]. Malformed and unknown codes use the same not-found response.

The public response includes the code, current status, fulfilment/payment labels, placed time, restaurant timezone, immutable item/option snapshots, totals, and event status/timestamps.

It excludes customer contact/address fields, checkout tokens, staff actors, event notes, internal IDs, and current catalog records.

## Authentication interfaces

The Auth.js credentials flow accepts a validated email and password and returns a session cookie or a generic failure. Unknown email, incorrect password, disabled account, and rate-limited attempts do not reveal account existence.

JWT/session callbacks expose only safe identity, role, and status fields. Protected server work re-reads the current database account.

There is no public registration, customer authentication, or self-service password reset.

## Caching

- Public catalog reads use a five-minute cache with public-menu and restaurant-settings tags.
- Successful catalog writes invalidate public-menu.
- Order, tracking, staff, and dashboard reads remain dynamic.
- Customer order status is never cached across public identifiers.
