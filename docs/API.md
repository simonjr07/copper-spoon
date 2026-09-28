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
| `getOrderStatus` | Public bearer link | Minimal order snapshot and status by non-enumerable public ID |
| `getDashboardSummary` | Admin/Staff | Operational counts and recent orders |
| `listOrders` | Admin/Staff | Filtered, paginated order summaries |
| `getOrderDetail` | Admin/Staff | Full order snapshot and status history |
| `getMenuAdmin` | Admin | Categories/items/options including unavailable records |
| `listStaff` | Admin | Staff metadata without password hashes |
| `getAnalytics` | Admin | Period aggregates from persisted non-cancelled order totals |

## 4. Planned Server Actions

| Action | Authorization | Key behavior |
| --- | --- | --- |
| `createOrder` | Public, rate-limited | Validate checkout, reprice, transactionally create snapshots/event |
| `updateOrderStatus` | Admin/Staff | Check allowed transition and concurrency; append event |
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

Client input contains item IDs, option IDs, quantities, customer/fulfilment fields, payment choice, and an optional note. It does not contain authoritative unit prices or totals. The server returns either:

- an order number and non-enumerable public status identifier; or
- a structured validation/conflict response explaining changed availability or pricing.

Repeated submission protection should use a short-lived idempotency key or equivalent server-side guard. The exact mechanism is finalized with checkout.

### Implemented client cart contract

The cart is not an HTTP or database interface. The browser stores a versioned payload under `copper-spoon:cart` containing item display snapshots, selected option display snapshots, quantities, and estimated integer-cent prices. A strict schema limits lengths/counts, allows only repository-local image paths, rejects mixed currencies, and reconstructs configuration identities during hydration.

Cart actions support add/merge, bounded quantity change, removal, and clear. This payload is never authoritative: Task 6 must submit identifiers and quantities, discard stored prices/names/totals as authority, and reject the whole checkout when current publication, availability, option membership, bounds, or currency no longer match.

## 7. Status transition contract

The action accepts order ID, desired status, and an expected current status/version. It rejects stale or invalid transitions with `CONFLICT`, rather than overwriting another staff member's update. Successful updates atomically modify the order and append `OrderStatusEvent`.

## 8. Caching and revalidation

- Public catalog reads may use explicit cache tags such as `menu`, `menu-item:<id>`, and `restaurant-settings`.
- Menu/settings mutations invalidate the relevant tags after a successful commit.
- Order and dashboard reads default to dynamic because freshness is operationally important.
- Customer status should not be cached across public identifiers.

Caching policy will use the APIs documented by the installed Next.js version at implementation time.

Implemented public catalog reads use a five-minute `unstable_cache` TTL and the `public-menu` / `restaurant-settings` tags. The future menu/settings mutations invalidate the relevant tag after a successful commit. Public list/detail DTOs contain display fields only and never expose publication flags, sort keys, archive state, timestamps, or other administrative metadata. A published item with `isAvailable=false` remains visible as sold out and is never presented as orderable.

## 9. Authentication interfaces

- `POST` through the Auth.js credentials flow accepts validated email/password input from `/admin/login` and returns only a session cookie or a generic failure.
- The login Server Action maps unknown email, wrong password, and disabled account to the same public message.
- JWT/session callbacks expose only `id`, `name`, `email`, `role`, and `status`; the password hash never enters the token or client session.
- `src/proxy.ts` optimistically redirects anonymous requests for `/admin` and nested routes except `/admin/login`.
- Secure server queries/mutations call `requireActiveUser`, `requireRole`, or `requirePermission`, which re-read the current database account.
- No registration, password-reset, or customer-authentication interface exists.
