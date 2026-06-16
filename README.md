# DrapeSoul — Premium Clothing E-Commerce Platform

Production-ready fashion e-commerce with Telegram Web App integration, admin/owner RBAC, and Cloudflare-ready infrastructure.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                          │
│  CDN · DNS · SSL · WAF · Rate Limiting · Bot Protection    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      Nginx (VPS)                            │
│  shop.* → Frontend │ admin.* → Frontend │ api.* → Backend   │
└──────┬──────────────────────┬──────────────────┬──────────┘
       │                      │                  │
┌──────▼──────┐        ┌──────▼──────┐    ┌──────▼──────┐
│   React     │        │  Telegram   │    │   FastAPI   │
│   Vite      │        │  Bot        │    │   Backend   │
│   Tailwind  │        │  (aiogram)  │    │             │
└─────────────┘        └─────────────┘    └──────┬──────┘
                                                  │
                    ┌─────────────────────────────┼─────────────┐
                    │                             │             │
              ┌─────▼─────┐               ┌───────▼───┐  ┌─────▼─────┐
              │ PostgreSQL │               │   Redis   │  │  Storage  │
              └───────────┘               └───────────┘  │ Local/R2  │
                                                         └───────────┘
```

## Features

- **Storefront**: Hero, categories, product grid, filters, cart, checkout
- **Telegram Web App**: initData verification, bot `/start` with shop button
- **Admin Dashboard**: Products, orders, analytics, audit logs
- **Owner RBAC**: Env-based owner + permission-based admins
- **Storage Abstraction**: Local VPS → Cloudflare R2 migration path
- **Notifications**: Order alerts via Telegram bot
- **Backups**: Daily PostgreSQL + image backups with optional R2 upload

## Quick Start (Development)

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.12+ (for local backend dev)

### 1. Configure Environment

```bash
cp .env.example .env
```

Generate owner password hash:

```bash
cd backend && pip install passlib bcrypt
python scripts/hash_password.py your_secure_password
# Copy output to OWNER_PASSWORD_HASH in .env
```

Set required values in `.env`:
- `SECRET_KEY` — long random string
- `OWNER_PASSWORD_HASH` — bcrypt hash
- `OWNER_TELEGRAM_ID` — your Telegram user ID
- `BOT_TOKEN` — from [@BotFather](https://t.me/BotFather)
- `TELEGRAM_CHANNEL_ID` — channel ID for product publishing

### 2. Start with Docker

```bash
docker compose up -d --build
```

Services:
- Frontend: http://localhost (via nginx)
- API: http://api.localhost/api/health
- API Docs (DEBUG=true): http://localhost:8000/api/docs

### 3. Seed Sample Data

```bash
docker compose exec backend python scripts/seed_data.py
```

### 4. Local Frontend Development

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

## Telegram Bot Setup

1. Create bot via [@BotFather](https://t.me/BotFather)
2. Set `BOT_TOKEN` in `.env`
3. Configure Web App URL in BotFather: `WEBAPP_URL` (e.g. `https://shop.yourdomain.com`)
4. Set menu button: `/setmenubutton` → Web App → your shop URL
5. Start bot: included in `docker compose` as `telegram-bot` service

Bot commands:
- `/start` — Welcome message + "🛍 Open Shop" WebApp button

## Admin Access

- **Owner**: username `owner`, password set via `OWNER_PASSWORD_HASH`
- **Admins**: created by owner at `/admin/admins`

Permissions: `manage_products`, `manage_orders`, `publish_products`, `view_statistics`, `view_logs`, `manage_admins`, `developer_access`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | Public | Health check |
| GET | `/api/products` | Public | List products |
| GET | `/api/products/{slug}` | Public | Product detail |
| GET | `/api/categories` | Public | Categories |
| POST | `/api/orders` | Public | Create order |
| POST | `/api/telegram/verify-init-data` | Public | Verify Telegram auth |
| POST | `/api/admin/login` | Public | Admin login |
| GET | `/api/admin/me` | JWT | Current user |
| CRUD | `/api/products/*` | JWT + perm | Product management |
| CRUD | `/api/orders/*` | JWT + perm | Order management |
| GET | `/api/analytics/overview` | JWT + perm | Dashboard stats |
| GET | `/api/logs/audit` | JWT + perm | Audit logs |
| GET | `/api/system/health` | JWT + perm | System health |

## Storage

Default: local filesystem at `backend/static/uploads/products/`

Switch to Cloudflare R2:

```env
STORAGE_BACKEND=r2
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_R2_BUCKET=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_PUBLIC_URL=https://media.yourdomain.com
```

See [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md) for full Cloudflare setup.

## Deployment (VPS + Cloudflare)

### 1. VPS Setup

```bash
# Clone repo
git clone <repo> /opt/drapesoul
cd /opt/drapesoul
cp .env.example .env
# Edit .env with production values

docker compose up -d --build
```

### 2. Cloudflare DNS

Point `shop`, `admin`, `api` subdomains to VPS IP (proxied).

### 3. SSL

**Recommended**: Cloudflare Full (Strict) — no Certbot needed.

**Alternative**: Uncomment Certbot in docker-compose and obtain Let's Encrypt certs.

### 4. Production Hardening

- Set `ENV=production`, `DEBUG=false`
- Use strong `SECRET_KEY`
- Restrict `CORS_ORIGINS` to your domains
- Enable Cloudflare WAF rules
- Schedule backups: `0 3 * * * /opt/drapesoul/scripts/backup.sh`

## Backups

```bash
# Manual backup
./scripts/backup.sh

# Restore database
./scripts/restore.sh /backup/db/drapesoul_YYYYMMDD_HHMMSS.sql.gz
```

Backups include:
- PostgreSQL dump (gzip)
- Product images archive
- Optional upload to Cloudflare R2

## Logos & Branding

Replace placeholder logos with your designs:

- Light mode: `frontend/public/assets/logos/logo-light.svg`
- Dark mode: `frontend/public/assets/logos/logo-dark.svg`

Supported formats: SVG (recommended), PNG, WebP.

## Project Structure

```
drapesoul/
├── backend/          # FastAPI + SQLAlchemy + Alembic
├── frontend/         # React + Vite + TailwindCSS
├── telegram-bot/     # aiogram 3.x bot
├── nginx/            # Reverse proxy config
├── scripts/          # Backup & restore
├── docs/             # Cloudflare & deployment guides
└── docker-compose.yml
```

## Security

- JWT authentication with bcrypt password hashing
- Telegram initData HMAC verification (server-side only)
- RBAC on all admin routes
- Rate limiting (SlowAPI + Cloudflare)
- File upload validation (type, size, compression)
- Path traversal protection in storage layer
- Audit logging for sensitive actions
- Security headers via middleware

## License

Proprietary — DrapeSoul © 2026
