# Cloudflare Integration Guide

## DNS Setup

| Subdomain | Type | Target | Proxy |
|-----------|------|--------|-------|
| `shop` | A | VPS IP | Proxied (orange cloud) |
| `admin` | A | VPS IP | Proxied |
| `api` | A | VPS IP | Proxied |

## SSL/TLS

1. Cloudflare Dashboard → SSL/TLS → **Full (strict)**
2. Enable **Always Use HTTPS**
3. Enable **Automatic HTTPS Rewrites**
4. Minimum TLS Version: 1.2

## Caching Rules

### Page Rules (or Cache Rules)

**Static assets (frontend):**
- URL: `shop.yourdomain.com/assets/*`
- Cache Level: Cache Everything
- Edge TTL: 7 days

**Product images:**
- URL: `api.yourdomain.com/static/uploads/*`
- Cache Level: Cache Everything
- Edge TTL: 30 days

**API (bypass cache):**
- URL: `api.yourdomain.com/api/*`
- Cache Level: Bypass

## WAF & Security

1. **Security → WAF** → Enable Managed Ruleset
2. **Rate Limiting Rule** for login:
   - Expression: `(http.request.uri.path eq "/api/admin/login")`
   - Rate: 10 requests per minute per IP
3. **Bot Fight Mode**: Enable for login endpoints
4. **DDoS Protection**: Enabled by default on proxied records

## Cloudflare R2 Migration

### 1. Create R2 Bucket

```bash
# Via Cloudflare Dashboard → R2 → Create bucket
# Bucket name: drapesoul-media
```

### 2. Create API Token

R2 → Manage R2 API Tokens → Create token with Object Read & Write.

### 3. Configure Public Access (optional)

R2 → Bucket → Settings → Public Access → Enable custom domain or R2.dev URL.

### 4. Update Environment

```env
STORAGE_BACKEND=r2
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_BUCKET=drapesoul-media
CLOUDFLARE_R2_ACCESS_KEY_ID=your_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret
CLOUDFLARE_R2_PUBLIC_URL=https://media.yourdomain.com
PUBLIC_MEDIA_URL=https://media.yourdomain.com
```

No frontend or API contract changes required.

## Backup to R2

Configure AWS CLI for R2:

```ini
# ~/.aws/credentials
[r2]
aws_access_key_id = YOUR_R2_KEY
aws_secret_access_key = YOUR_R2_SECRET
```

```bash
export CLOUDFLARE_ACCOUNT_ID=your_id
export CLOUDFLARE_R2_BUCKET=drapesoul-backups
./scripts/backup.sh
```

## Optional: Cloudflare Workers (Edge)

Future extension for JWT validation at edge or aggressive API caching. See `workers/` placeholder in project root for migration path.
