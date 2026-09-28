# Application Interfaces

## 1. Approach

Copper Spoon is a first-party Next.js application, not a public API product. Server Components perform reads through server-only query functions. Server Actions handle UI mutations. Route Handlers are added only for Auth.js or when a stable HTTP interface is genuinely useful.

Unless marked implemented, examples below are planned contracts rather than HTTP endpoints. The implementation may refine names while preserving the behavior and security properties.

## 2. Boundary rules

- Parse all untrusted input with Zod on the server.
- Do not trust IDs, prices, roles, totals, status, or availability supplied by a client.
- Protected operations require an active session and capability at the mutation/query boundary.
- Return purpose-built DTOs; never serialize password hashes, raw session data, or unrestricted Prisma records.
- Use stable safe error codes such as `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, and `INTERNAL_ERROR`.
- Log internal details with a request/correlation identifier; return only the safe message and field errors.

## 3. Planned server queries

| Query | Audience | Result |
| --- | --- | --- |
| `getPublicMenu` (implemented) | Public | Published categories and published/non-archived menu-display items plus safe restaurant display settings |
| `getPublicMenuItem` (implemented) | Public | One published/non-archived item under a published category, with active groups and available choices |
| `getCustomerOrderStatus` (implemented) | Public bearer code | Fresh status/timeline, placed time, immutable snapshots, and totals by non-sequential public code; no contact/address/internal IDs, staff actors, or notes |
| `getDashboardSummary` | Admin/Staff | Operational counts and recent orders |
| `listOrders` (implemented) | Admin/Staff | Fresh searchable, status/fulfilment-filtered, paginated order summaries |
| `getOrderDetail` (implemented) | Admin/Staff | Full operational snapshot, customer/fulfilment details, totals, and complete internal status history |
| `getMenuAdmin` | Admin | Categories/items/options including unavailable records |
| `listStaff` | Admin | Staff metadata without password hashes |
| `getAnalytics` | Admin | Period aggregates from persisted non-cancelled order totals |

## 4. Planned Server Actions

| Action | Authorization | Key behavior |
| --- | --- | --- |
| `createOrder` (implemented; rate limit pending) | Public | Validate checkout, resolve idempotency token, reprice, transactionally create snapshots/event |
| `updateOrderStatus` (implemented) | Admin/Staff | Re-read current order, enforce role/status policy and optimistic concurrency, atomically update and append actor-attributed event |
| `createCategory` / `updateCategory` | Admin | Validate slug/order/active state; revalidate menu |
| `createMenuItem` / `updateMenuItem` | Admin | Validate price/category/options; revalidate menu |
| `setMenuItemAvailability` | Admin | Fast sold-out toggle; revalidate public menu |
| `updateRestaurantSettings` | Admin | Validate fulfilment/payment compatibility |
| `createStaffUser` | Admin | Controlled account creation with bcrypt hash |
| `updateStaffUser` | Admin | Role/status update with last-admin protection |

Action result shape:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };
```

Redirecting actions may redirect after successful mutation instead of returning data. Framework-thrown redirects must not be swallowed by broad error handling.

## 5. Route Handlers

Expected route-handler surface:

- `GET|POST /api/auth/[...nextauth]` — implemented Auth.js-managed authentication endpoints.
- Optional `GET /api/health` — shallow deployment health only, with no secrets or database detail. A database readiness endpoint should be private if added.

There is no generic public menu/order CRUD REST API in the initial plan. If external clients become a real requirement, versioned handlers, explicit authentication, rate limits, idempotency, and OpenAPI documentation will be designed then.

## 6. Public order creation contract

Client input contains a random checkout token, item IDs, option IDs, quantities, customer/fulfilment fields, and payment choice. It does not contain authoritative unit prices or totals. Unknown cart fields are discarded by the Zod schema. The server returns either:

- an order number and non-enumerable public status identifier; or
- a structured validation/conflict response explaining changed availability or pricing.

Repeated submission protection uses a client-generated UUID stored as nullable unique `Order.checkoutToken`. The serializable transaction returns an existing public code when the token has already committed; a uniqueness race retries and then resolves the same order. The submit button also remains disabled while its Server Action is pending.

### Implemented client cart contract

The cart is not an HTTP or database interface. The browser stores a versioned payload under `copper-spoon:cart` containing item display snapshots, selected option display snapshots, quantities, and estimated integer-cent prices. A strict schema limits lengths/counts, allows only repository-local image paths, rejects mixed currencies, and reconstructs configuration identities during hydration.

Cart actions support add/merge, bounded quantity change, removal, and clear. This payload is never authoritative: checkout submits identifiers and quantities, discards stored prices/names/totals as authority, and rejects the whole checkout when current publication, availability, option membership, bounds, or currency no longer match.

## 7. Status transition contract

The action accepts order ID, desired status, an `updatedAt` concurrency token, and an optional cancellation reason. The token detects a stale screen; the service always re-reads the database status and never trusts a client-supplied current status. Normal processing is exactly `PENDING → CONFIRMED → PREPARING → READY → COMPLETED`, with no skips, reversals, or transitions from terminal states.

`STAFF` may cancel `PENDING` and `CONFIRMED` orders. `ADMIN` may additionally cancel `PREPARING` orders. Neither role may cancel `READY`, `COMPLETED`, or `CANCELLED` orders. A trimmed non-empty reason of at most 500 characters is mandatory. The conditional order update and actor-attributed `OrderStatusEvent` are one serializable transaction; a stale predicate or event failure rolls back the whole operation.

## 8. Caching and revalidation

- Public catalog reads may use explicit cache tags such as `menu`, `menu-item:<id>`, and `restaurant-settings`.
- Menu/settings mutations invalidate the relevant tags after a successful commit.
- Order and dashboard reads default to dynamic because freshness is operationally important.
- Customer status should not be cached across public identifiers.

Caching policy will use the APIs documented by the installed Next.js version at implementation time.

Implemented public catalog reads use a five-minute `unstable_cache` TTL and the `public-menu` / `restaurant-settings` tags. The future menu/settings mutations invalidate the relevant tag after a successful commit. Public list/detail DTOs contain display fields only and never expose publication flags, sort keys, archive state, timestamps, or other administrative metadata. A published item with `isAvailable=false` remains visible as sold out and is never presented as orderable.

Implemented customer order-status reads are deliberately uncached and run through a separate server-only repository on every `/order/[orderCode]` request. The route is forced dynamic; browser refresh is the initial freshness mechanism. Status mutations revalidate admin routes; no public status cache exists to invalidate.

## 10. Public order-status contract

`/track-order?code=...` trims and uppercases codes, validates the existing `CS-` plus 6–12 alphanumeric format, and redirects to the canonical `/order/[orderCode]` URL. Invalid-format and unknown codes expose the same safe not-found language.

The public DTO includes only public code, current status, fulfilment/payment labels, placed time, restaurant timezone, immutable item/option snapshots, persisted cents totals/currency, and recorded status/time pairs. Timeline notes, staff actor IDs, customer contact/address fields, checkout tokens, internal order IDs, operational timestamps, and current catalog records are excluded.

## 9. Authentication interfaces

- `POST` through the Auth.js credentials flow accepts validated email/password input from `/admin/login` and returns only a session cookie or a generic failure.
- The login Server Action maps unknown email, wrong password, and disabled account to the same public message.
- JWT/session callbacks expose only `id`, `name`, `email`, `role`, and `status`; the password hash never enters the token or client session.
- `src/proxy.ts` optimistically redirects anonymous requests for `/admin` and nested routes except `/admin/login`.
- Secure server queries/mutations call `requireActiveUser`, `requireRole`, or `requirePermission`, which re-read the current database account.
- No registration, password-reset, or customer-authentication interface exists.
