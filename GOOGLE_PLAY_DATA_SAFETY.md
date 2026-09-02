# MoneyLive — Google Play Data Safety Analysis

Status key used throughout: **CONFIRMED** (verified directly in the app's source code) · **NEEDS VERIFICATION** (plausible but not directly confirmed in code — check before submitting to Play Console) · **NOT PRESENT** (checked, not found in the codebase).

Source reviewed: `currency-converter` repo (MoneyLive app) — `src/context/AuthContext.tsx`, `src/services/supabaseAuthService.ts`, `src/services/portfolioService.ts`, `src/services/leaderboardService.ts`, `src/services/locationService.ts`, `src/services/aiInsightService.ts`, `src/services/marketHistoryService.ts` + provider files, `server/*`, `package.json`, `.env.example`. Reviewed September 2026.

## 1. What data is collected, and where it lives

| Data type | Collected? | Local (device) or server? | Purpose | Optional/Required | Deletion |
|---|---|---|---|---|---|
| Email address | Yes — **CONFIRMED** | Server (Supabase `auth.users`) | Account authentication | Optional (guest mode fully supported) | Real, via account deletion (in-app or web) |
| Password | Yes — **CONFIRMED** | Server, hashed by Supabase Auth | Account authentication | Optional | Deleted with account |
| Username / display name | Yes — **CONFIRMED** | Server (`profiles` table) | Shown on leaderboard, profile | Optional (only if signed up) | Deleted with account |
| Avatar URL | Yes, if set — **CONFIRMED** | Server (`profiles` table) | Profile display | Optional | Deleted with account |
| Portfolio value / performance % | Yes, while signed in and leaderboard viewed — **CONFIRMED** | Server (`leaderboard_entries`) | Leaderboard ranking | Optional (only signed-in users, only on leaderboard view) | Deleted with account |
| Paper-trading portfolio (cash, trades, snapshots) | Yes — **CONFIRMED** | Local device only (AsyncStorage); not synced server-side | App functionality (paper trading) | Required for that feature, but the feature itself is optional to use | Local: uninstall/clear app storage. Not touched by account deletion. |
| Currency conversions, favorites, history | Yes — **CONFIRMED** | Local device only | App functionality | Core feature | Local: uninstall/clear app storage |
| App settings (theme, language, decimals) | Yes — **CONFIRMED** | Local device only | App functionality | Core feature | Local: uninstall/clear app storage |
| Precise location (GPS) | Yes, only with explicit OS permission — **CONFIRMED** | Resolved to a currency code on-device; only that code stored locally. Coordinates never sent to our servers. | Suggest a home currency | Optional (declining keeps EUR default) | Local: uninstall/clear app storage |
| Approximate location (IP-based) | Present in code (`locationService.ts` `detectByIp`) but **not currently invoked** by the active detection path — **NEEDS VERIFICATION** before Play Console submission (confirm it is genuinely unreachable, or remove the dead code) | — | — | — | — |
| Market/asset symbols viewed | Yes — **CONFIRMED** | Sent to market-data providers per request; not stored server-side by us | Show live prices/charts | Core feature | N/A — not attributable to a person |
| Asset market data sent to AI provider | Yes, only when AI Insights section is opened — **CONFIRMED** | Sent via our server proxy to Anthropic; contains only public market data, no user identifiers | Generate a plain-language asset explanation | Optional (feature only runs when opened) | N/A — no personal data in the request |
| Advertising ID | No — **NOT PRESENT** | — | — | — | — |
| Analytics / usage events | No — **NOT PRESENT** | — | — | — | — |
| Crash logs | Not implemented — **NOT PRESENT** (no crash-reporting SDK in `package.json`) | — | — | — | — |
| Cookies (website) | No — **NOT PRESENT**. Only a language preference (`localStorage`, not a cookie) on this legal/marketing site. | — | — | — | — |
| Contacts, SMS, camera, microphone, files | No permission requested for any of these — **NOT PRESENT** | — | — | — | — |

## 2. Third-party data recipients

| Recipient | What it receives | Why |
|---|---|---|
| Supabase | Email, hashed password, username/display name, avatar URL, portfolio value/performance (leaderboard only) | Authentication + backend database (our sub-processor) |
| Finnhub | Asset symbol/ticker requests (via our Cloudflare Worker proxy — Finnhub never sees the requester directly) | Stock/ETF quotes, profiles, news |
| Twelve Data, Alpha Vantage, CoinGecko, Frankfurter, ExchangeRate-API | Asset symbol / currency-pair requests, called directly from the device | Quotes, historical charts, FX rates |
| logo.dev (optional, only if configured) | Asset symbol/ticker | Logo image lookup |
| Anthropic (via our Cloudflare Worker proxy) | Public asset market data already fetched by the app (no user identifiers) — only when AI Insights is opened | Generate the AI explanation text |
| Cloudflare | Standard request metadata (IP address, etc.) to operate our three proxy Workers | Hosting/operating the finnhub-proxy, ai-proxy, account-delete Workers |

None of these recipients are used for advertising or cross-app/cross-site tracking. **NEEDS VERIFICATION**: confirm each provider's own data-processing terms (especially Anthropic's and Supabase's DPA) are reviewed and, where required, a formal Data Processing Agreement is in place before a production launch that processes EU users' data at scale.

## 3. Encryption & security

- All network requests use HTTPS/TLS in transit — **CONFIRMED** (every provider/service URL in the codebase is `https://`).
- Passwords are hashed by Supabase Auth, never handled or stored in plain text by MoneyLive's own code — **CONFIRMED**.
- Database-level access is restricted with Postgres Row Level Security so a user can only read/write their own rows — **CONFIRMED** (`supabase/migrations/`).
- Secrets with real reach (Anthropic key, Finnhub key, Supabase service-role key) live only in server-side Cloudflare Workers, never bundled in the app — **CONFIRMED** (`.env.example` comments, `server/*/src/index.ts`).
- Encryption at rest for the Supabase database: **NEEDS VERIFICATION** (this is a property of Supabase's own infrastructure — check their current documentation/SOC 2 report for a definitive answer to put in the Play Console).

## 4. Account deletion

- **In-app**: Profile → Delete Account, calls the `server/account-delete` Cloudflare Worker, which verifies the caller's real Supabase session and deletes the `auth.users` row with the service-role key. `profiles`/`leaderboard_entries` cascade automatically — **CONFIRMED** in code.
- **Web (external, no app required)**: this website's `/delete-account/` page, which re-authenticates the visitor directly against Supabase and calls the same Worker — **implemented, gated on the Worker's public URL being deployed and configured**. See `LEGAL_WEBSITE_DEPLOYMENT.md` and `GOOGLE_PLAY_LEGAL_CHECKLIST.md` for the outstanding deployment step.
- Until that Worker is deployed with a known URL, both the in-app flow and this website honestly report that full deletion isn't available yet rather than pretending it works — **CONFIRMED** (`serverDeletionNotConfigured` handling in `supabaseAuthService.ts`; the website's own "needs backend configuration" state).

## 5. Play Console Data Safety form — mapping notes

Use this table's rows directly for the "Data collected" and "Data shared" sections of the Play Console Data Safety form. Suggested category mapping:

- **Personal info → Email address**: Collected, not shared with third parties for their own purposes (Supabase is a processor acting on our instructions). Optional. Deletable.
- **Personal info → User IDs / Name**: Collected (username/display name), same terms as above.
- **Financial info → User payment info**: **NOT PRESENT** — MoneyLive never collects real payment/card data; paper trading uses virtual capital only.
- **Financial info → Purchase history**: **NOT PRESENT**.
- **Location → Approximate/Precise location**: Collected on-device only with permission, not transmitted to our servers — declare as collected-but-not-shared, processed ephemerally.
- **App activity → App interactions**: **NOT PRESENT** (no analytics SDK).
- **Device or other IDs**: **NOT PRESENT** (no advertising ID usage found).

**Final Play Console submission should be cross-checked by whoever fills out the form directly in Play Console, using this document as the source of truth — this file does not submit anything itself.**
