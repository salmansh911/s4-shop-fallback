# TurnKey (S4 Platform)

AI-powered ordering platform for modern distributors.

## Run locally

```bash
nvm use 20
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Real data (Supabase)

1. Copy `.env.example` to `.env.local` and set keys.
2. Run `supabase/migrations/20260215_init_turnkey.sql`.
3. Run `supabase/migrations/20260228_reliability_marketing.sql`.
3. Run `supabase/seed.sql`.

When env vars are set, app routes read from Supabase REST.
If env vars are missing, app uses seeded fallback data.

## API routes

- `GET /api/products`
- `GET /api/orders/mine?userId=<uuid-or-demo-customer-001>`
- `GET /api/insights?userId=<uuid-or-demo-customer-001>`
- `GET /api/diagnostics`
- `POST /api/marketing/lead`
- `POST /api/marketing/event`
- `GET /api/marketing/metrics`

## Production deploy (Hetzner + Git)

This project is ready for Git-based deploys to `shop.s4trading.com`.

### One-time server setup

```bash
sudo apt update
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

### First deploy

```bash
sudo mkdir -p /var/www/s4-shop
sudo chown -R $USER:$USER /var/www/s4-shop
git clone https://github.com/salmansh911/s4-shop-fallback.git /var/www/s4-shop
cd /var/www/s4-shop
cp .env.example .env.local
```

Set production values in `.env.local`:

- `COMMERCE_PROVIDER=medusa`
- `NEXT_PUBLIC_SITE_URL=https://shop.s4trading.com`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `MEDUSA_ADMIN_AUTH_MODE=auto` (when switching provider to Medusa)
- `EMAIL_PROVIDER=resend`
- `EMAIL_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO` (optional)
- `ANALYTICS_ENABLED=true`
- `NEXT_PUBLIC_ANALYTICS_ENABLED=true`

Then deploy:

```bash
cd /var/www/s4-shop
./scripts/deploy-prod.sh main
sudo cp ops/nginx/shop.s4trading.com.conf /etc/nginx/sites-available/s4-shop
sudo ln -sf /etc/nginx/sites-available/s4-shop /etc/nginx/sites-enabled/s4-shop
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d shop.s4trading.com
sudo pm2 startup
```

### Future deploys (after `git push`)

```bash
cd /var/www/s4-shop
./scripts/deploy-prod.sh main
```

## Medusa product visibility validation

```bash
npm run check:medusa:store
```

If this fails, ensure products are:
- `Published`
- assigned to sales channel `S4 B2B`
- priced in active AED region/currency

## Core ecom smoke checklist

1. Cart: add/remove/update quantity and refresh persistence.
2. Checkout (COD): place order, receive confirmation email, see in My Orders.
3. Checkout (Stripe test): complete payment, webhook marks paid once.
4. Tracking: open order URL and verify timeline/status.
5. Marketing: submit footer lead form and confirm `/api/marketing/metrics` increments.
6. Diagnostics: `GET /api/diagnostics` returns provider/env checks true for production.
