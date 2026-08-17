# Doorli Mobile (Expo)

## EAS preview

`eas.json` preview/production profiles point at the HTTPS Marketplace API root (`https://doorli.me`). The mobile client appends `/api/v1` for API calls.

```bash
cd apps/mobile
npx eas-cli build --profile preview --platform android
```

Assets: `assets/icon.png`, `splash-icon.png`, `adaptive-icon.png` (Doorli mark).
