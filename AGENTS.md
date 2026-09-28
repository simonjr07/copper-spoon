<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Copper Spoon repository guidance

## Scope and sources of truth

- Read `docs/PRODUCT_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, and the relevant roadmap item in `docs/TASKS.md` before implementing a feature.
- Keep this a single Next.js full-stack application. Do not introduce a separate API server without an accepted decision record.
- Do not implement out-of-scope marketplace, real-payment, customer-account, delivery-driver, loyalty, or reservation features.

## Engineering conventions

- Use strict TypeScript and the `@/*` import alias.
- Prefer Server Components. Add `"use client"` only at the smallest interactive boundary.
- Keep database and credential access in server-only modules under `src/server`.
- Validate all untrusted input at the server boundary with Zod once it is installed.
- Authenticate and authorize inside every protected Server Action and Route Handler; UI visibility is not authorization.
- Store money as integer minor units and immutable order snapshots. Never reconstruct historical order totals from current menu data.
- Use database transactions for order creation and other multi-write invariants.
- Return safe user-facing errors and keep sensitive diagnostic details server-side.

## Delivery conventions

- Use feature-sized branches and keep `main` releasable.
- Add or update tests with behavior changes.
- Run `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check` before handoff.
- Do not commit, push, create credentials, or connect production services unless the user explicitly requests it.
- All committed seed/demo data must be clearly fictional.
