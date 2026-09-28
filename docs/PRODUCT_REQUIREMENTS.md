# Product Requirements

## 1. Product statement

Copper Spoon is a fictional, internationally neutral restaurant ordering system for one modern restaurant. It demonstrates a credible customer transaction flow and the operational work that follows an order. It is a portfolio product, but its data model, authorization, validation, testing, and deployment practices should resemble a production system.

## 2. Goals

- Let a guest discover food and place a pickup or delivery order comfortably on a phone.
- Preserve an accurate, immutable commercial record of every submitted order.
- Let restaurant staff triage and progress incoming orders with clear state and feedback.
- Let administrators control the menu, staff, settings, and basic operational reporting.
- Demonstrate secure full-stack engineering without depending on real payments or real customer data.

## 3. Non-goals

- Multiple restaurants or marketplace discovery
- Real payment authorization, capture, refunds, or stored card data
- Customer registration, profiles, saved addresses, or order history
- Driver dispatch, GPS tracking, route planning, or delivery marketplaces
- Loyalty, gift cards, reservations, table service, inventory, or kitchen hardware integration
- Localization, multi-currency ordering, taxes by jurisdiction, or production email/SMS in the initial release

## 4. Users and permissions

### Guest customer

A guest can browse, search, filter, customize items, manage a cart, provide contact/fulfilment information, select a simulated payment method, submit an order, and view that order through a non-enumerable tracking identifier. No customer account is required.

### Staff

A staff member can sign in, view all restaurant orders and menu information, open order details, and apply permitted order-status transitions. Staff cannot administer accounts or modify protected restaurant configuration.

### Administrator

An administrator has staff permissions plus category/menu management, sold-out controls, staff account management, restaurant settings, and analytics access.

There is no public staff registration. Staff accounts are provisioned by a controlled administrative process.

## 5. Functional requirements

### Public experience

- Home page communicates the restaurant proposition and routes customers to the menu.
- Menu groups available items by active category and supports text search and useful filters.
- Menu item detail shows description, price, availability, and option groups.
- Required and optional choices enforce configured minimum/maximum selections.
- Cart supports add, remove, quantity change, option display, line totals, and a server-authoritative checkout review.
- Checkout collects name, email, phone, optional order notes, and fulfilment details.
- Pickup requires no delivery address; delivery requires the configured address fields and availability checks.
- Payment selection is restricted to `PAY_ON_PICKUP`, `PAY_ON_DELIVERY`, and `DEMO_CARD`, subject to fulfilment compatibility.
- Successful creation returns a human-readable order number and a non-enumerable status link.
- Status view shows order number, fulfilment type, submitted items/totals, current status, and timestamps without exposing unnecessary contact data.
- Unavailable or changed items/options are detected during checkout and produce an actionable correction response.

### Restaurant dashboard

- Credentials login rejects disabled users and establishes a secure session.
- Overview shows useful order counts and recent operational activity.
- Incoming orders can be filtered by status and opened for full detail.
- Status changes follow the permitted state machine and create an audit event.
- Admins can create, edit, order, activate, and deactivate categories.
- Admins can create and edit menu items, prices, options, and availability.
- Sold-out changes are quick to apply and immediately affect customer ordering.
- Admins can edit single-restaurant settings and fulfilment/payment availability.
- Admins can create staff accounts, assign roles, disable accounts, and initiate password replacement through an explicit safe process.
- Analytics provide basic order count and revenue-like totals from non-cancelled demo orders for selected periods.

## 6. Order lifecycle

Supported statuses are `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `COMPLETED`, and `CANCELLED`.

Default forward flow:

```text
PENDING -> CONFIRMED -> PREPARING -> READY -> COMPLETED
    |          |            |          |
    +----------+------------+----------+-> CANCELLED
```

`COMPLETED` and `CANCELLED` are terminal. Cancellation permissions and late-stage confirmation prompts will be finalized with the restaurant-order-management task. Every transition must be server-authorized, transactionally persisted, and auditable.

## 7. Critical business rules

- All money is represented as integer minor units with an explicit ISO 4217 currency code.
- The server recalculates prices and totals from current active menu data during checkout; client totals are advisory only.
- Once created, each order item snapshots its item name and unit price, and each selected option snapshots its name and price adjustment.
- Historical order displays and analytics use order snapshots/totals, never current menu pricing.
- An order is created atomically with its items, selected options, totals, and initial status event.
- Menu records referenced by orders are archived/disabled rather than destructively removed.
- The restaurant has one settings record and one active ordering currency for the initial release.
- Public demo data is fictional and must not resemble credentials or real customer records.

## 8. Quality attributes

- Mobile-first and usable from 320 px upward; dashboard remains usable on tablet and desktop.
- Keyboard-operable controls, semantic landmarks, visible focus, labelled errors, sufficient contrast, and reduced-motion respect.
- Protected mutations perform authentication, authorization, and validation at the server boundary.
- Common menu/status reads should feel immediate; target p75 LCP under 2.5 seconds on the deployed public menu after optimization.
- Failures must not create partial orders, disclose secrets, or expose stack traces to users.
- Structured logs must exclude passwords, secrets, raw session tokens, and unnecessary customer data.

## 9. Success criteria

- A first-time guest can place a valid demo order on mobile without assistance.
- A staff user can move that order through the valid lifecycle and the public status reflects it.
- An admin price change does not alter the historical order.
- Role restrictions are covered by automated tests and cannot be bypassed by calling server endpoints directly.
- A fresh contributor can run the project and all quality gates using repository documentation.

## 10. Open product decisions

- Default currency, delivery fee policy, and service radius/message
- Whether staff may cancel after `PREPARING`, or whether that becomes admin-only
- Whether menu dietary labels are a controlled list or free-form tags
- Demo-card interaction depth (simple simulated success is recommended)
- Retention period and redaction approach for hosted-demo guest contact data

These decisions do not block Task 2's database foundation where nullable/configurable fields can preserve options.
