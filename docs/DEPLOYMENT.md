# DrapeSoul — Production Deployment Guide

## Prerequisites

- VPS with Ubuntu 22.04+ (your VPS: `77.83.206.179`)
- Domain `drapesoul.uz` on Cloudflare
- Docker & Docker Compose installed on VPS

## Step 1 — Cloudflare DNS

In Cloudflare → DNS, add these records (all **Proxied** orange cloud):

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `77.83.206.179` | Proxied |
| A | `www` | `77.83.206.179` | Proxied |
| A | `api` | `77.83.206.179` | Proxied |
| A | `admin` | `77.83.206.179` | Proxied |

## Step 2 — Cloudflare SSL

1. SSL/TLS → **Full (strict)**
2. Enable **Always Use HTTPS**
3. Edge Certificates → enable **Always Use HTTPS**

Cloudflare terminates HTTPS; your VPS nginx listens on port **80**.

## Step 3 — VPS Setup

SSH into your VPS:

```bash
ssh user@77.83.206.179
```

Install Docker:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in
```

## Step 4 — Upload Project

```bash
# On your local machine
rsync -avz --exclude node_modules --exclude .venv --exclude pgdata \
  /home/codedilmurod/drapesoul/ user@77.83.206.179:/opt/drapesoul/
```

Or clone from git if you pushed the repo.

## Step 5 — Configure `.env`

On the VPS, ensure `.env` has production values:

```env
ENV=production
DEBUG=false
FRONTEND_URL=https://drapesoul.uz
BACKEND_URL=https://api.drapesoul.uz
WEBAPP_URL=https://drapesoul.uz
CORS_ORIGINS=https://drapesoul.uz,https://admin.drapesoul.uz
```

## Step 6 — Deploy

```bash
cd /opt/drapesoul
chmod +x scripts/*.sh
./scripts/deploy.sh
```

## Step 7 — Telegram Bot (BotFather)

1. Open [@BotFather](https://t.me/BotFather)
2. `/setmenubutton` → select your bot → Web App → `https://drapesoul.uz`
3. `/setdomain` → `drapesoul.uz`

## Step 8 — Verify

- https://drapesoul.uz — shop loads
- https://admin.drapesoul.uz/admin/login — admin login works
- https://api.drapesoul.uz/api/health — returns `{"status":"healthy"}`
- Telegram bot `/start` → Open Shop button works

## Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Updates (re-deploy)

```bash
cd /opt/drapesoul
git pull   # or rsync again
./scripts/deploy.sh
```

## Backups (cron)

```bash
crontab -e
# Daily at 3 AM
0 3 * * * /opt/drapesoul/scripts/backup.sh >> /var/log/drapesoul-backup.log 2>&1
```

## Troubleshooting

```bash
docker compose ps
docker compose logs backend
docker compose logs nginx
docker compose restart backend
```
