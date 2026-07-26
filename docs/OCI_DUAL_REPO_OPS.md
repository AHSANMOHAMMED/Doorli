# Dual-repo + OCI ops notes (follow-ups that need DNS console / second-node access)

## Marketplace OCI (`140.245.207.93`) — done this pass
- API rebuilt; `/api/v1/rides/estimate` uses in-process route again
- firewalld public edge: `ssh` + `http` + `443/tcp` only (infra + app ports blocked from internet)
- smoke script has connect/max timeouts
- Dual-vendor ERP: `ERP_EMBEDDED_URL` (simple) + `ERP_ENTERPRISE_URL` (enterprise) + shared `ERP_INTERNAL_SECRET`
- Vendor model: `erp_provider` / `erp_provision_status`; admin `POST /api/v1/admin/vendors` accepts `tier`

## DNS / TLS (manual — DNS provider) — REQUIRED for doorli.me to work
`doorli.me` currently resolves to **both** GitHub Pages IPs (`185.199.*`) and `140.245.207.93`.
That is why `http://doorli.me` often returns GitHub Pages **404**, while `http://140.245.207.93` works.

Fix at your DNS provider (Namecheap / Cloudflare / etc.):
1. Delete every GitHub Pages A/AAAA record for `doorli.me` and `www`
2. Keep only A → `140.245.207.93` (and AAAA if any)
3. Wait for TTL, then verify: `dig +short doorli.me A` shows only the OCI IP
4. Optional HTTPS: open OCI ingress TCP 443 on the marketplace VCN, then `certbot --nginx -d doorli.me`

Until DNS is fixed, use the IP URLs:
- Customer: http://140.245.207.93/
- Vendor: http://140.245.207.93/vendor
- Admin: http://140.245.207.93/admin
- Embedded ERP: http://140.245.207.93/erp/

## Enterprise OCI (`enterprise.doorli.me` → `129.159.232.216`)
- SSH works with `~/Downloads/ssh-key-2026-07-24 (1).key` as `opc` (copy kept at `~/.ssh/doorli_enterprise.key`)
- Host firewalld: `http` + `https` + `ssh` open
- Site renamed to `enterprise.doorli.me`; `doorli_core` installed + migrated
- Shared secret set in Enterprise `.env` as `DOORLI_WEBHOOK_SECRET` (must match marketplace `ERP_INTERNAL_SECRET`)
- E2E smoke (provision + create_order + idempotent replay) verified via SSH tunnel `marketplace:18000 → enterprise:8000`
- **Still blocked publicly:** OCI VCN Security List / NSG does not allow ingress 80/443 (host listens; internet + marketplace cannot reach those ports)

### Open public 80/443 (OCI Console — required for live Traefik/TLS)
1. OCI Console → Compute → instance `instance-20260724-1545` → Primary VNIC → Subnet → Security Lists (or NSG)
2. Add Ingress rules: source `0.0.0.0/0`, TCP **80** and **443**
3. Verify from laptop: `curl -I https://enterprise.doorli.me`
4. On marketplace, switch `.env` from the tunnel URL to:
   `ERP_ENTERPRISE_URL=https://enterprise.doorli.me/api/method/doorli_core.api.create_order`
   then restart `@doorli/api`

### Interim tunnel (already running for smoke)
On marketplace: SSH local forward `18000 → enterprise 127.0.0.1:8000` using the Enterprise key.
Backend publishes `127.0.0.1:8000:8000` for that tunnel only.

## CI note
- Marketplace turbo build excludes `@doorli/erp` until Next 15 monorepo dual-React `/404` prerender is fixed.
- Deployed OCI ERP continues to run from the existing VM build.
