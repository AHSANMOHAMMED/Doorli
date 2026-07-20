# Doorli Mobile (Expo)

## EAS preview

`eas.json` preview/production profiles point at the OCI demo API over **HTTP** (`http://140.245.207.93`).

**Follow-up:** terminate TLS (HTTPS) on nginx / load balancer before App Store / Play production builds; then flip `EXPO_PUBLIC_API_URL` / `extra.apiUrl` to `https://…`.

```bash
cd apps/mobile
npx eas-cli build --profile preview --platform android
```

Assets: `assets/icon.png`, `splash-icon.png`, `adaptive-icon.png` (Doorli mark).
