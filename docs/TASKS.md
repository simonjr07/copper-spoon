# Implementation Roadmap

This document summarizes the completed delivery phases and the remaining operational work.

## Completed

### Foundation

- Established the Next.js application, TypeScript rules, project structure, environment template, and core documentation.
- Added PostgreSQL 17 with Docker Compose, Prisma ORM 7, reviewed migrations, a server-only client, a fictional development seed, and smoke checks.

### Authentication and authorization

- Added Auth.js credentials authentication with bcrypt password hashing.
- Added ADMIN and STAFF capabilities, active-user checks, protected routes, login/logout, and controlled administrator provisioning.

### Public menu and visual identity

- Added cached public menu and item routes with search, filters, availability states, options, metadata, and safe public view models.
- Added repository-local WebP food imagery, responsive next/image usage, and fallback visuals.

### Cart, checkout, and tracking

- Added a versioned browser cart with item configuration and integer-cent estimates.
- Added pickup/delivery checkout with server-authoritative pricing, serializable order creation, immutable snapshots, and retry idempotency.
- Added public confirmation and order tracking through non-sequential order codes.

### Restaurant operations

- Added the order queue, filters, detail views, role-aware transitions, cancellation policy, optimistic concurrency, and audit events.
- Added category, item, option, publication, availability, and archive management.
- Added staff account creation, role/status controls, password replacement, self-protection, and final-active-admin protection.
- Added operational dashboard analytics for status, daily activity, recent orders, fulfilment mix, and popular item snapshots.

### Interface and hardening

- Standardized responsive public and administrative layouts, focus behavior, loading/empty/error states, reduced motion, and private-route indexing policy.
- Added PostgreSQL-backed rate limits, security headers, bounded database pooling, generic operational errors, and production administrator provisioning.

### Deployment preparation

- Added GitHub Actions with PostgreSQL-backed migration, lint, typecheck, test, and build gates.
- Added Vercel configuration and Supabase PostgreSQL connection guidance.
- Added an idempotent settings migration and a guarded production-demo catalog bootstrap.
- Added deployment, hosted QA, screenshot, and portfolio case-study documentation.

## Remaining before public launch

- Complete the Vercel deployment and verify the canonical URL.
- Run the hosted QA checklist.
- Confirm contact-data retention and redaction procedures.
- Assign monitoring and alert ownership.
- Rehearse database recovery.
- Record deployed accessibility and performance measurements.
- Capture verified screenshots and update the README/case study with deployment evidence.

## Ongoing maintenance

- Review dependency and framework updates against the installed Next.js, Prisma, and Auth.js versions.
- Keep migrations forward-compatible with rolling deployments.
- Re-run security, accessibility, and performance checks after material changes.
- Keep demo data fictional and remove guest submissions according to the approved retention policy.
