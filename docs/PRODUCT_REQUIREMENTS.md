# Product Requirements

## Product overview

Copper Spoon is a fictional ordering and restaurant-operations system for one restaurant. It demonstrates a complete guest transaction and the operational work that follows an order.

The product is a portfolio application, but its data model, authorization, validation, testing, and deployment practices follow production-oriented standards.

## Goals

- Let guests browse a menu and place pickup or delivery orders on mobile devices.
- Preserve an accurate historical record of every submitted order.
- Give staff a clear workflow for reviewing and progressing orders.
- Give administrators control over the catalog, staff accounts, and operational reporting.
- Demonstrate secure full-stack engineering without real payments or real customer data.

## Users

### Guest

Guests can browse the menu, configure items, maintain a cart, submit pickup or delivery details, and track an order with a public code. No customer account is required.

### Staff

Active STAFF users can view dashboard analytics, work with the order queue, open operational order details, apply permitted status changes, and read the complete catalog.

### Administrator

Active ADMIN users have staff capabilities plus category, menu, option, and staff-account management. Restaurant settings are stored in the database; a settings-editing interface is outside the current release.

## Functional scope

### Public ordering

- Published menu browsing, search, and category filtering
- Required and optional item choices
- Browser-persisted cart
- Pickup and delivery checkout
- Simulated payment choices
- Server-authoritative pricing and availability checks
- Public confirmation and status tracking

### Restaurant operations

- Credentials authentication
- Status counts, recent orders, seven-day activity, fulfilment mix, and popular items
- Searchable and filterable order queue
- Controlled status transitions with audit events
- Category, item, option, publication, availability, and archive management
- Staff account creation, role/status management, and password replacement

## Out of scope

- Multiple restaurants or marketplace discovery
- Real payment processing or stored card data
- Customer accounts, saved addresses, or order history
- Driver dispatch or GPS tracking
- Loyalty, gift cards, reservations, inventory, or kitchen hardware
- Production email or SMS notifications
- Multi-currency ordering and jurisdiction-specific tax calculation

## Order lifecycle

Supported statuses are PENDING, CONFIRMED, PREPARING, READY, COMPLETED, and CANCELLED.

~~~text
PENDING -> CONFIRMED -> PREPARING -> READY -> COMPLETED
    |          |            |
    +----------+------------+-> CANCELLED
~~~

Normal processing advances one step at a time. COMPLETED and CANCELLED are terminal. STAFF may cancel PENDING or CONFIRMED orders; ADMIN may also cancel PREPARING orders. Every cancellation requires a reason.

## Business rules

- Money is stored as integer minor units with an ISO 4217 currency code.
- Checkout recalculates prices from current database records.
- Cart names, prices, totals, and availability are advisory.
- Order items and selected options store immutable names and prices.
- Historical views and analytics use snapshots and persisted totals.
- Order creation writes the order, items, options, totals, and initial event atomically.
- Catalog records are unpublished, disabled, or archived instead of being deleted from normal workflows.
- The restaurant has one settings record and one active ordering currency.
- Demo data is fictional and does not represent real credentials or customer records.

## Quality requirements

- Public flows work from 320 px through desktop widths.
- Forms support keyboard operation, clear labels, visible focus, and associated errors.
- Protected operations authenticate, authorize, and validate at the server boundary.
- Public responses expose only fields required for their use case.
- Failures cannot create partial orders or expose stack traces, secrets, or database details.
- Logs exclude passwords, tokens, connection strings, and unnecessary customer data.
- The hosted public menu targets a p75 LCP below 2.5 seconds after deployment and measurement.

## Success criteria

- A guest can complete a fictional pickup or delivery order on mobile.
- A staff member can progress the order through the supported lifecycle.
- Public tracking reflects status changes without exposing private data.
- Catalog changes do not alter historical orders.
- Direct route or action access cannot bypass role restrictions.
- A new developer can run the project and its quality checks from the documentation.

## Open operational decisions

- Guest contact-data retention and redaction schedule
- Monitoring and error-reporting provider
- Alert ownership
- Whether restaurant settings need an admin interface in a future release
