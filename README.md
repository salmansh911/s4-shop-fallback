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

- `COMMERCE_PROVIDER=supabase`
- `NEXT_PUBLIC_SITE_URL=https://shop.s4trading.com`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

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
