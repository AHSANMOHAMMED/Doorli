# Dual-repo + OCI ops notes (follow-ups that need DNS console / second-node access)

## Marketplace OCI (`140.245.207.93`) — done this pass
- API rebuilt; `/api/v1/rides/estimate` uses in-process route again
- firewalld public edge: `ssh` + `http` + `443/tcp` only (infra + app ports blocked from internet)
- smoke script has connect/max timeouts

## DNS / TLS (manual — DNS provider)
`doorli.me` currently resolves to **both** GitHub Pages IPs and `140.245.207.93`.
For HTTPS on the marketplace:
1. Remove GitHub Pages A records for `doorli.me` / `www`
2. Keep only A → `140.245.207.93` (and AAAA if any)
3. Issue cert (certbot or OCI LB) and enable nginx `:443`

## Enterprise OCI (`enterprise.doorli.me` → `129.159.232.216`)
- SSH is open; **HTTP/HTTPS closed** from the public internet
- Current marketplace SSH key cannot log in to that host
- After opening 80/443 and deploying with `scripts/init-site.sh`, `doorli_core` installs with the site
- Point marketplace `ERP_API_URL` at Enterprise only when that node is live; until then keep OCI `.env` on embedded `/erp/api/internal`
