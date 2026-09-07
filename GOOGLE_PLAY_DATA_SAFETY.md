# MoneyLive — Google Play Data Safety Analysis

Status key used throughout: **CONFIRMED** (verified directly in the app's source code) · **NEEDS VERIFICATION** (plausible but not directly confirmed in code — check before submitting to Play Console) · **NOT PRESENT** (checked, not found in the codebase).

Source reviewed: `currency-converter` repo (MoneyLive app) — `src/context/AuthContext.tsx`, `src/services/supabaseAuthService.ts`, `src/services/portfolioService.ts`, `src/services/leaderboardService.ts`, `src/app/(tabs)/leaderboard.tsx`, `src/services/locationService.ts`, `src/services/aiInsightService.ts`, `src/services/aiContextService.ts`, `src/services/aiChatService.ts`, `src/services/marketHistoryService.ts` + provider files (`src/services/providers.ts`), `server/*/src/index.ts`, `server/*/wrangler.toml`, `package.json`, `.env`. Reviewed September 2026 (re-verified against current code, not just re-confirmed from the prior pass).

## 1. What data is collected, and where it lives

| Data type | Collected? | Local (device) or server? | Purpose | Optional/Required | Deletion |
|---|---|---|---|---|---|
| Email address | Yes — **CONFIRMED** | Server (Supabase `auth.users`) | Account authentication | Optional (guest mode fully supported) | Real, via account deletion (in-app or web) |
| Password | Yes — **CONFIRMED** | Server, hashed by Supabase Auth | Account authentication | Optional | Deleted with account |
| Username / display name | Yes — **CONFIRMED** | Server (`profiles` table) | Shown on leaderboard, profile | Optional (only if signed up) | Deleted with account |
| Avatar URL | Yes, if set — **CONFIRMED** | Server (`profiles` table) | Profile display | Optional | Deleted with account |
| Portfolio value / performance % | Yes, while signed in and leaderboard viewed — **CONFIRMED** (`leaderboardService.ts` → `submit_leaderboard_entry` RPC), throttled client-side to at most ~once per 60 seconds regardless of how long the screen stays open | Server (`leaderboard_entries`) | Leaderboard ranking | Optional (only signed-in users, only on leaderboard view) | Deleted with account |
| Paper-trading portfolio (cash, trades, snapshots) | Yes — **CONFIRMED** | Local device only (AsyncStorage); not synced server-side | App functionality (paper trading) | Required for that feature, but the feature itself is optional to use | Local: uninstall/clear app storage. Not touched by account deletion. |
| Currency conversions, favorites, history | Yes — **CONFIRMED** | Local device only | App functionality | Core feature | Local: uninstall/clear app storage |
| App settings (theme, language, decimals) | Yes — **CONFIRMED** | Local device only | App functionality | Core feature | Local: uninstall/clear app storage |
| Precise location (GPS) | Yes, only with explicit OS permission — **CONFIRMED** | Resolved to a currency code on-device; only that code stored locally. Coordinates never sent to our servers. | Suggest a home currency | Optional (declining keeps EUR default) | Local: uninstall/clear app storage |
| Approximate location (IP-based) | Present in code as a function (`locationService.ts` `detectByIp`) but **confirmed not called from anywhere in the app** — `detectLocalCountry()` only ever calls `detectByGps()` — **CONFIRMED** dead/unreachable code, not just unverified | — | — | — | — |
| Market/asset symbols viewed | Yes — **CONFIRMED** | Sent to market-data providers per request; not stored server-side by us | Show live prices/charts | Core feature | N/A — not attributable to a person |
| Asset market data sent to AI Insights | Yes, only when the AI Insights section is opened — **CONFIRMED** | Sent via our `ai-proxy` server proxy to an **Anthropic Claude** model (`claude-haiku-4-5`); contains only public asset data (name, sector, country, description, quote, metrics, headlines), no user identifiers. Currently unconfigured in `.env` (`EXPO_PUBLIC_AI_PROXY_URL` empty) — the code path is real, but the feature does not run in the current build until that URL is set. | Generate a plain-language asset explanation | Optional (feature only runs when opened, and only if configured) | N/A — no personal data in the request |
| Chat messages + screen context sent to MIA Chat | Yes, only when a chat with MIA is opened — **CONFIRMED** | Sent via a separate `ai-chat-proxy` server proxy to a **Google Gemini** model (`gemini-3.5-flash-lite`); contains the typed message plus, if applicable, a compact summary of the asset/portfolio/learning-article context already on screen (e.g. portfolio total value, positions, margin — never an account id, email, password, or auth token). Currently configured and active (`EXPO_PUBLIC_AI_CHAT_PROXY_URL` set). Messages are not persisted anywhere — session memory only. | Generate a chat reply | Optional (feature only runs when a chat is opened) | N/A — nothing is stored; gone when the chat/app closes |
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
| Twelve Data, CoinGecko, Frankfurter, ExchangeRate-API | Asset symbol / currency-pair requests, called directly from the device | Quotes, historical charts, FX rates |
| ~~Alpha Vantage~~ | **Not an active recipient** — `alphaVantageHistoryProvider.supports()` always returns `false` in the current code (`src/services/providers.ts`); the shipped app never calls this provider, despite an unused API key still present in some env configs. | — |
| logo.dev (optional, only if configured) | Asset symbol/ticker | Logo image lookup |
| Anthropic (via our `ai-proxy` Cloudflare Worker) | Public asset market data already fetched by the app (no user identifiers) — only when AI Insights is opened, and only if `EXPO_PUBLIC_AI_PROXY_URL` is configured (currently empty) | Generate the AI Insights explanation text |
| Google / Gemini (via our separate `ai-chat-proxy` Cloudflare Worker) | The MIA chat message plus, when applicable, a compact summary of on-screen asset/portfolio/learning context (never an account id, email, password, or auth token) — only when a MIA chat is opened; currently configured and active | Generate the MIA chat reply |
| Cloudflare | Standard request metadata (IP address, etc.) to operate our four proxy Workers | Hosting/operating the finnhub-proxy, ai-proxy, ai-chat-proxy, and account-delete Workers |

None of these recipients are used for advertising or cross-app/cross-site tracking. **NEEDS VERIFICATION**: confirm each provider's own data-processing terms (especially Anthropic's, Google's, and Supabase's DPA) are reviewed and, where required, a formal Data Processing Agreement is in place before a production launch that processes EU users' data at scale.

## 3. Encryption & security

- All network requests use HTTPS/TLS in transit — **CONFIRMED** (every provider/service URL in the codebase is `https://`).
- Passwords are hashed by Supabase Auth, never handled or stored in plain text by MoneyLive's own code — **CONFIRMED**.
- Database-level access is restricted with Postgres Row Level Security so a user can only read/write their own rows — **CONFIRMED** (`supabase/migrations/`).
- Secrets with real reach (Anthropic key, Gemini key, Finnhub key, Supabase service-role key) live only in server-side Cloudflare Workers, never bundled in the app — **CONFIRMED** (`.env.example` comments, `server/*/src/index.ts`).
- Encryption at rest for the Supabase database: **NEEDS VERIFICATION** (this is a property of Supabase's own infrastructure — check their current documentation/SOC 2 report for a definitive answer to put in the Play Console).

## 4. Account deletion

- **In-app**: Profile → Delete Account, calls the `server/account-delete` Cloudflare Worker, which verifies the caller's real Supabase session and deletes the `auth.users` row with the service-role key. `profiles`/`leaderboard_entries` cascade automatically — **CONFIRMED** in code.
- **Web (external, no app required)**: this website's `/delete-account/` page, which re-authenticates the visitor directly against Supabase and calls the same Worker — **CONFIRMED deployed and configured** (`assets/js/delete-account.js`'s `ACCOUNT_DELETE_PROXY_URL` and the app's `EXPO_PUBLIC_ACCOUNT_DELETE_PROXY_URL` both point at the live Worker). Both the in-app path and this website's form are real, working deletion flows, not placeholders.
- If the Worker's URL were ever unset again, both surfaces are still built to honestly report that full deletion isn't available rather than pretending it works — `serverDeletionNotConfigured` handling in `supabaseAuthService.ts`; the website's own JS-required fallback notice — but that is not the current state.

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
