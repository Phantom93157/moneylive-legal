# MoneyLive — Google Play Legal Readiness Checklist

Status: **DONE** · **TODO** · **NEEDS VERIFICATION**. Reviewed September 2026, against this repo (`moneylive-legal`) and the app repo (`currency-converter`).

## Privacy Policy

- [x] **DONE** — Publicly reachable, no login required: `/privacy/` on this site.
- [x] **DONE** — Working URL once deployed: `https://moneylive-legal.pages.dev/privacy/` (see `LEGAL_WEBSITE_DEPLOYMENT.md`).
- [x] **DONE** — Not a PDF; a normal web page.
- [x] **DONE** — Covers account data, local data, leaderboard, market-data providers, AI feature, location, cookies/analytics/ads (all explicitly "not present"), legal basis, retention, security, deletion, GDPR rights.
- [x] **DONE** — Developer/operator identity and contact email present (links to `/imprint/`).
- [ ] **NEEDS VERIFICATION** — Exact provider log-retention windows (Supabase/Cloudflare) — flagged in the policy itself, not yet confirmed.
- [ ] **NEEDS VERIFICATION** — Minimum-age / children's-data handling: no formal age gate exists in the app today; decide whether one is needed before launch.

## Terms of Use

- [x] **DONE** — Published at `/terms/`, covers paper-trading-is-simulated, no real money, no investment advice, market-data disclaimer, AI-outputs disclaimer, liability, termination, changes.
- [ ] **NEEDS VERIFICATION** — Governing law/jurisdiction stated as "intended to be Germany" — not formally confirmed; recommend legal review before public launch.

## Imprint (Impressum)

- [x] **DONE** — Operator name (Talal Khodr) and contact email present, sourced from the app's own existing legal text — not invented.
- [ ] **TODO** — Postal address (ladungsfähige Anschrift), required under § 5 TMG, is not yet provided anywhere in the codebase or by the user. The Imprint page marks this clearly as TODO rather than omitting or inventing it.
- [ ] **NEEDS VERIFICATION** — Whether a TMG imprint is even the correct legal requirement for this specific offering (a free app with an optional account) — recommend a one-time legal check.

## Account Deletion

- [x] **DONE** — In-app path exists and is wired to a real server-side deletion Worker (`server/account-delete`), already present in the app repo.
- [x] **DONE** — External web path built at `/delete-account/`: re-authenticates the visitor via Supabase directly (no app/session required), then calls the same Worker.
- [ ] **TODO** — The Worker itself must actually be deployed (`wrangler deploy` from `server/account-delete`) and its printed URL pasted into **both**:
  - the app's `EXPO_PUBLIC_ACCOUNT_DELETE_PROXY_URL` (already wired, just needs the value), and
  - `assets/js/delete-account.js`'s `ACCOUNT_DELETE_PROXY_URL` constant on this site.
  Until then, both surfaces honestly report "not yet configured" rather than a fake success.
- [x] **DONE** — Deletion is real: it removes the Supabase `auth.users` row (service-role key only ever used server-side inside the Worker), with `profiles`/`leaderboard_entries` cascading automatically.
- [x] **DONE** — The web page documents exactly what is and isn't deleted (see its "What this deletes" table), including that on-device local data is unaffected.

## Data Safety (Play Console form)

- [x] **DONE** — Full analysis prepared in `GOOGLE_PLAY_DATA_SAFETY.md`, matched against actual app implementation, not assumptions.
- [ ] **TODO** — Someone must actually transcribe that analysis into the Play Console Data Safety form itself; this repo does not submit it automatically.
- [ ] **NEEDS VERIFICATION** — Confirm Supabase's/Anthropic's own data-handling terms satisfy whatever the Play Console form asks about sub-processor encryption/deletion guarantees.

## Play Store Listing

- [ ] **TODO** — Privacy Policy URL for Play Console: `https://moneylive-legal.pages.dev/privacy/` (or the future custom domain — update if/when one is set).
- [ ] **TODO** — Account Deletion URL for Play Console: `https://moneylive-legal.pages.dev/delete-account/`.
- [ ] **TODO** — Data Safety form: fill in using `GOOGLE_PLAY_DATA_SAFETY.md`.
- [ ] **TODO** — Terms of Use URL, if the listing/store requires one: `https://moneylive-legal.pages.dev/terms/`.
- [ ] **TODO** — App screenshots for the Play listing itself (separate from this website's screenshots — see `SCREENSHOTS_NEEDED.md`, which covers the website only).
- [ ] **TODO** — Google Play Developer account + app listing creation (outside the scope of this repo).

## Website Technical Readiness

- [x] **DONE** — All required URLs exist and are directly reachable: `/`, `/features/`, `/about/`, `/privacy/`, `/terms/`, `/imprint/`, `/delete-account/`.
- [x] **DONE** — Static site, Cloudflare Pages-compatible, no build step required.
- [x] **DONE** — No secrets committed to this repo (only the public Supabase anon key, which is designed to be public — see `privacy/index.html` and `assets/js/delete-account.js` comments).
- [ ] **TODO** — Deploy the account-delete Worker and wire its URL in (see above) before this checklist can be marked fully DONE.
