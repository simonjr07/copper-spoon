# Hosted QA Checklist

Run this checklist after migrations, Vercel deployment, administrator provisioning, and fictional catalog setup. Record the deployment URL and commit. Use fictional test identities and avoid copying secrets or customer fields into tickets.

## Public journey

- [ ] Homepage loads over HTTPS with the hero image and primary navigation.
- [ ] Menu loads published categories and items without broken images.
- [ ] Search and category filters work with keyboard and pointer input.
- [ ] Published item details load; unknown and unpublished slugs return the safe not-found view.
- [ ] Required and optional choices enforce their configured bounds.
- [ ] Sold-out items remain visible but cannot be added.
- [ ] Cart configurations, quantities, and persistence survive refresh.
- [ ] A fictional pickup checkout creates exactly one order.
- [ ] A fictional delivery checkout enforces address, minimum, fee, and payment rules.
- [ ] Confirmation shows authoritative snapshots and totals without private fields.
- [ ] Tracking shows the current status and public timeline.
- [ ] Malformed and unknown order codes use the same response.
- [ ] Rate-limited public surfaces recover after the configured window.

## Staff and administration

- [ ] The provisioned ADMIN can sign in; invalid credentials return a generic failure.
- [ ] Dashboard metrics and recent activity load.
- [ ] The order queue supports search, filters, pagination, and detail links.
- [ ] An order progresses one valid state at a time and public tracking updates.
- [ ] STAFF and ADMIN cancellation rules match the documented policy.
- [ ] Catalog changes appear publicly after cache invalidation.
- [ ] Option ownership and selection bounds are enforced.
- [ ] ADMIN can create, edit, disable/reactivate, and replace another staff password.
- [ ] STAFF cannot access administrator-only routes or actions.
- [ ] A disabled user's existing session is rejected on the next protected request.
- [ ] Self-lockout and removal of the final active administrator are rejected.

## Security and hosting

- [ ] All public and authenticated traffic uses HTTPS.
- [ ] CSP, HSTS, frame, MIME, referrer, permissions, and opener headers are present.
- [ ] Private and bearer-code routes emit noindex metadata.
- [ ] Client output exposes no credentials, connection strings, password hashes, or server-only fields.
- [ ] Database failures produce generic UI errors.
- [ ] Vercel logs exclude passwords, secrets, addresses, contact fields, cookies, and cancellation reasons.
- [ ] Rate-limit counts persist across separate serverless invocations.
- [ ] Application traffic remains stable through the Supabase Transaction Pooler.
- [ ] npm run db:status succeeds through the Session Pooler without logging its URL.

## Responsive and accessibility evidence

- [ ] Complete the public critical path at 320 px.
- [ ] Complete it at 375 px.
- [ ] Check public and administrative layouts at 768 px.
- [ ] Check the full experience at desktop width.
- [ ] Complete keyboard-only navigation.
- [ ] Perform a screen-reader spot check.
- [ ] Verify reduced-motion behavior.
- [ ] Record representative Lighthouse or Web Vitals measurements.

Store the completed checklist and measurements with the release evidence. Do not claim results that were not measured.
