# Crime Statistics (AU) — Build Review

This file exists only to create a reviewable PR. All code is already deployed on `main`.

**Merge this PR to acknowledge the build.** Closing without merging is also fine.

## Links

- **GitHub Pages:** https://ben-gy.github.io/au-crime/ *(redirects to custom domain)*
- **Custom domain:** https://au-crime.benrichardson.dev *(live, TLS cert issued)*

## DNS setup

Done automatically via Cloudflare API during the build. CNAME record created:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `au-crime` | `ben-gy.github.io` | DNS only (grey cloud) |
