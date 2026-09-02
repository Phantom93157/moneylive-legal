# MoneyLive Website — Deployment Notes

## Repository & hosting

- **GitHub repository**: [Phantom93157/moneylive-legal](https://github.com/Phantom93157/moneylive-legal)
- **Hosting**: Cloudflare Pages, already connected to this repository (confirmed by the user before this work began).
- **Deploy trigger**: pushing to the `main` branch. Cloudflare Pages builds and deploys automatically — no build command is configured or needed, since this is a plain static site (no framework, no `package.json`).
- **HTTPS**: provided automatically by Cloudflare Pages for both the `*.pages.dev` domain and any custom domain added later.
- **Current public URL**: `https://moneylive-legal.pages.dev`

## URL structure

Every route is a real directory with its own `index.html`, so it works identically on Cloudflare Pages, and would also work unmodified on any other static host (GitHub Pages, Netlify, S3+CDN, etc.) without needing clean-URL rewrite rules:

```
/                     → index.html
/features/            → features/index.html
/about/                → about/index.html
/privacy/              → privacy/index.html
/terms/                → terms/index.html
/imprint/              → imprint/index.html
/delete-account/       → delete-account/index.html
```

Once live, the URLs Google Play needs are:

```
https://moneylive-legal.pages.dev/privacy/
https://moneylive-legal.pages.dev/terms/
https://moneylive-legal.pages.dev/imprint/
https://moneylive-legal.pages.dev/delete-account/
```

## Custom domain (future)

No custom domain has been registered or configured yet — none is invented here. The Imprint page currently lists `https://moneylive.app` as "coming soon", matching what the app's own existing legal text already said before this work began (`src/i18n/index.ts`). Once a real domain is live, update:

1. Cloudflare Pages → Custom domains → add the domain.
2. The `<link rel="canonical">` and Open Graph URLs at the top of every `index.html` (currently pointing at `moneylive-legal.pages.dev`).
3. The `EXPO_PUBLIC_PRIVACY_URL` / `_TERMS_URL` / `_IMPRINT_URL` / `_ACCOUNT_DELETE_URL` values in the app's own `.env` (see the "App Legal Integration" section of the final report / `currency-converter/.env.example`).
4. The Play Console listing's Privacy Policy and Account Deletion URLs.

Then the final URLs become, for example:

```
https://YOUR-DOMAIN/privacy
https://YOUR-DOMAIN/terms
https://YOUR-DOMAIN/imprint
https://YOUR-DOMAIN/delete-account
```

## Environment configuration

This site needs **no environment variables at build time** — it's static HTML/CSS/JS with no server-side rendering step. The only "configuration" it carries is:

- **Supabase URL + public anon key**, hardcoded in `assets/js/delete-account.js` — these are the same public values already shipped inside the MoneyLive Android app (`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), safe to expose because access control is enforced server-side by Postgres Row Level Security, not by keeping this key secret.
- **Account-deletion Worker URL**, left empty in `assets/js/delete-account.js` until `server/account-delete` (in the app repo) is deployed with `wrangler deploy`. See `GOOGLE_PLAY_LEGAL_CHECKLIST.md` for this outstanding step.

No Cloudflare Worker, secret, or Wrangler configuration was added to *this* repository — the site is 100% static, exactly as the spec for this work required ("keine Wrangler-Worker-Deployment-Struktur hinzufügen, wenn sie für die statische Website nicht notwendig ist"). The account-deletion Worker this site calls already lives in the app repo (`currency-converter/server/account-delete`) and is deployed from there, independently.

## What was NOT set up (by design)

- No CI/build pipeline — unnecessary for static HTML.
- No analytics, no tracking, no cookies.
- No package manager / `node_modules` — nothing to install.
- No custom domain — not registered yet, not invented.
