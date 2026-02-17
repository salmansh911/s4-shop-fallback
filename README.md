# TurnKey (S4 Platform)

AI-powered ordering platform for modern distributors.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Real data (Supabase)

1. Copy `.env.example` to `.env.local` and set keys.
2. Run `supabase/migrations/20260215_init_turnkey.sql`.
3. Run `supabase/seed.sql`.

When env vars are set, app routes read from Supabase REST.
If env vars are missing, app uses seeded fallback data.

## API routes

- `GET /api/products`
- `GET /api/orders/mine?userId=<uuid-or-demo-customer-001>`
- `GET /api/insights?userId=<uuid-or-demo-customer-001>`
