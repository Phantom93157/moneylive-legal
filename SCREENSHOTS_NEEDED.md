# MoneyLive Website — Screenshots Needed

No real MoneyLive app screenshots exist in this repository yet. Nothing was invented or faked to fill the gap — every screenshot slot on the site is a drawn placeholder (a small abstract icon + filename label inside a phone frame) that **automatically** shows the real image the moment it's dropped at the path below, with zero code changes needed.

## How the fallback works

Every screenshot slot in the HTML looks like this:

```html
<img class="screenshot-img" src="/assets/screenshots/markets.png" alt="…"
     onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
<div class="screenshot-placeholder" style="display:flex;">…</div>
```

Drop a real file at `assets/screenshots/markets.png` (same filename) and redeploy — the `<img>` loads successfully, the placeholder `onerror` never fires, and the real screenshot appears everywhere that slot is used. No other file needs to change.

## Files needed

| File | Used on | Suggested size / aspect ratio | Notes |
|---|---|---|---|
| `assets/screenshots/markets.png` | Homepage Markets section, Showcase gallery, Features page context | 1080×2340 px (9:19.5, real device screenshot) | Markets overview screen with live quotes |
| `assets/screenshots/portfolio.png` | Homepage Portfolio section, Showcase gallery | 1080×2340 px | Portfolio overview: total value, positions |
| `assets/screenshots/trading.png` | Homepage hero, Paper Trading section, Showcase gallery | 1080×2340 px | Trading dashboard / buy-sell ticket |
| `assets/screenshots/converter.png` | Homepage Converter section, Showcase gallery | 1080×2340 px | Currency converter screen |
| `assets/screenshots/asset-detail.png` | Homepage AI section, Showcase gallery | 1080×2340 px | Asset detail page, ideally with AI Insights visible |
| `assets/screenshots/learning.png` | Showcase gallery | 1080×2340 px | Learn &amp; Help / glossary screen |

Any modern phone screenshot aspect ratio (roughly 9:19.5 to 9:20) will look correct in the phone-frame component — exact pixel dimensions aren't critical, but a real on-device PNG or WebP export (not a simulator chrome screenshot with OS status bars cropped oddly) will look best.

## Format

- PNG or WebP, whichever is smaller for a similar visual quality — WebP preferred for page-weight.
- No status bar chrome/notification icons if avoidable (cleaner in the phone-frame mockup, which already draws its own notch).
- Real, actual app content — no fabricated numbers or fake data. If a screen shows portfolio figures, use a real (even freshly created, near-zero) paper-trading account rather than staging fake big numbers.

The website functions correctly and looks intentional with zero screenshots in place — the placeholders are a real design, not a broken state — so shipping without them is not blocking.
