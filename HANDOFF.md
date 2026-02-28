# S4 Commerce Handoff

## Project
- Name: S4 commerce storefront (fast-launch build)
- Path: `/Users/salmanshanavas/Desktop/S4 Foods/website/shop`
- Main objective: conversion-first launch flow
  - Browse products
  - Add to cart
  - Checkout (`Stripe` + `COD`)
  - Track orders

## Core Context
- This codebase was heavily iterated in a long chat thread and includes multiple direction changes.
- Keep continuity. Do not redesign from scratch.
- Prior launch direction repeatedly chosen:
  - Ramadan-focused catalog for launch
  - Hide/de-emphasize non-core features from public journey
  - Keep the experience clean, credible, and conversion-focused

## Key Files To Inspect First
- `src/app/page.tsx`
- `src/app/api/checkout/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/lib/supabase-rest.ts`
- `src/lib/supabase-browser.ts`
- `src/lib/cart-store.ts`
- `supabase/migrations/20260215_init_turnkey.sql`
- `supabase/seed.sql`
- `public/product-images/`

## What Was Implemented (historical)
- Cart and checkout flow built in app.
- Stripe checkout redirect integrated.
- Stripe webhook endpoint added with signature verification.
- COD path added.
- Supabase integration added progressively for products/orders.
- Supabase OTP auth and order ownership flows implemented in later passes.
- Repeated UI cleanup and branding passes.

## Known Failure Patterns (avoid rediscovery)
- Local dependency/runtime corruption (`node_modules`, `next` shims).
- Node version mismatch (Node 23 caused repeated issues; Node 20 LTS expected).
- `.next` cache artifacts causing misleading errors.
- Supabase seed run before migration caused missing `public.users`.
- Live domain showing old app due process/port routing mismatch.
- Mixed catalog image mappings when DB not reseeded after mapping changes.

## Deployment Notes
- Infra pattern used: Hetzner VM + Docker + Cloudflare tunnel.
- Prior root cause for wrong live output:
  - another service bound to `3000`
  - S4 moved to `3010` and tunnel ingress updated.
- Always verify running process/container and tunnel target before blaming code.

## Security Notes
- Secrets were shared during earlier debugging in chat context.
- Treat keys as exposed and rotate:
  - Stripe keys
  - Supabase service role / other sensitive env secrets

## Immediate Priorities For New Session
1. Audit current repo state and confirm exactly what works now.
2. Fix P0 reliability only:
   - deterministic local run on Node 20
   - webhook idempotency (dedup events)
   - strict production behavior for Supabase availability
   - auth/order ownership consistency
   - catalog/image consistency verification
3. Provide exact commands + smoke-test checklist.
4. Avoid non-essential UI churn until P0 is green.

## Reliability Additions (2026-02-28)
- New migration: `supabase/migrations/20260228_reliability_marketing.sql`
  - `stripe_webhook_events` for webhook idempotency
  - `order_email_events` for one-time confirmation sends
  - `marketing_leads` and `marketing_events`
  - `checkout_attempts` bootstrap table + indexes
- New diagnostics endpoint: `GET /api/diagnostics`
- New marketing endpoints:
  - `POST /api/marketing/lead`
  - `POST /api/marketing/event`
  - `GET /api/marketing/metrics`
- Product operations policy: Medusa Admin is source of truth.
  - Validation command: `npm run check:medusa:store`
  - Sales channel required: `S4 B2B`

## Copy/Paste Prompt For New Chat
```text
You are continuing an existing S4 commerce build. Do not redesign from scratch.

Project path:
- /Users/salmanshanavas/Desktop/S4 Foods/website/shop

Context:
- We built a fast-launch commerce site with core flow: browse -> cart -> checkout (Stripe/COD) -> order tracking.
- Stripe webhook endpoint was added for payment finalization.
- Supabase integration was added for products/orders/auth in later passes.
- OTP auth + order ownership + my-orders/reorder were also implemented in later iterations.
- Deployment used Hetzner + Docker + Cloudflare tunnel; prior issue was wrong app served because port 3000 was occupied by another service, and 3010 was used for S4.

Critical files to inspect first:
- src/app/page.tsx
- src/app/api/checkout/route.ts
- src/app/api/stripe/webhook/route.ts
- src/lib/supabase-rest.ts
- src/lib/supabase-browser.ts
- src/lib/cart-store.ts
- supabase/migrations/20260215_init_turnkey.sql
- supabase/seed.sql
- public/product-images/

What I need from you now:
1) Audit the current codebase state and summarize exactly what is currently true (not historical assumptions).
2) Identify gaps for production readiness in priority order (P0/P1/P2).
3) Implement only P0 first:
- deterministic Node20 local run stability
- Stripe webhook idempotency
- strict prod behavior for Supabase availability
- auth/order ownership consistency
- catalog/image consistency checks
4) Give me exact commands and verification steps.
5) Keep scope conversion-focused and avoid non-essential UI churn.

Constraints:
- No broad redesign unless it fixes a conversion blocker.
- Preserve existing working flows.
- Provide concrete file-level edits and final smoke test checklist.
```
