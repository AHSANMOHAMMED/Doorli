# @doorli/super-admin — DEPRECATED

**Do not use this app as the product Super Admin.**

The live Doorli Super Admin control plane is:

- App: [`apps/admin`](../admin)
- URL: **http://doorli.me/admin** (nginx `/admin` → port 3005)

This package was a ported 31-screen design dump with mostly stub APIs. Its home route now redirects to `/admin`. It is not proxied in production nginx and should not be started on OCI.

## Why it still exists

Kept in the monorepo so historical local routes and Docker references do not break builds. Prefer deleting the docker service later; until then leave it stopped.
