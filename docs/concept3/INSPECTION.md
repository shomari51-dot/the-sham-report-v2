# Concept 3 — Pass 1 inspection

Inspected October 22, 2026. Read the complete binding BRIEF.md and SCO-001 audit and visually inspected all seven supplied reference images. Scope: rebuilt home, shared navigation/footer on seven existing routes; inner-page redesign remains for later passes.

## Existing implementation

Static HTML, global css/styles.css (Inter/Playfair, gold palette, rounded cards), page-local CSS and inline JavaScript. No build step, test runner, or frontend dependencies. package.json specifies Node 24 and MongoDB 6. Existing index had CMS-driven hero, static article cards, published-grade rail, player spotlight and browser-local newsletter capture. js/main.js manages subscription overlays, localStorage signup records, mobile overlay and scroll shadow. js/cms-content.js GETs /api/content?page=homepage and patches hero, brand, footer and other matching selectors, silently retaining markup when requests fail. Those scripts are not used on the rebuilt home; legacy content applier is removed from the six shared-shell routes to keep branding stable.

Routes retained: /index.html, /news.html, /tsr-score-calculator.html, /tournaments.html, /hosted-games.html, /media.html, /about.html, /trailblazer-stop-2-kick-off-results.html, /rungood-houston-preview.html. Vercel rewrites /admin to /admin/index.html and /post/:slug to /api/post?slug=:slug. No routing/deployment configuration changed. Article pages and assets preserved.

## Scoring engine (preserved)

Embedded in tsr-score-calculator.html, not a separate module. Orbit cost = small blind + big blind + ante. At least 18 levels required. Denominator = O10/O6 + O14/O10 + O18/O14. Playable depth ends at the last level whose orbit cost fits the starting stack plus optional add-on chips; numerator is accumulated level minutes through that level. Per-level minutes override a scheduled level-length change, which overrides base minutes. Raw score = depth minutes / denominator. Base and add-on scores calculated separately.

Every transition from level 2 is scanned. A jump is material only when its orbit-cost increment is at least 5% of effective stack. Maximum material jump >60% subtracts 4 points; >100% subtracts 8. Exactly 60/100 remain in the lower penalty category. Score = raw minus penalty. Fee share is fees / buy-in; effective fee share is fees / (buy-in + add-on cost). Fees inform commentary, not the numeric score. Guarantee informs commentary. PLO does not numerically alter score.

Tier 1: A ≥48, B ≥40, C ≥32, D ≥24, F <24. Tier 2: A ≥85, B ≥65, C ≥50, D ≥38, F <38. Non-F bands split into thirds for minus/plain/plus. Top-band modifier spans end at 56 / 105 but scores are not capped. Scores are not percentages or out of 100.

**Unresolved policy mismatch (SCO-001):** total buy-in >$300 selects Tier 2; $300 or less selects Tier 1. The code comment incorrectly says prize-pool portion. Weekly/series toggle changes dates/publication type, not curve. Do not silently implement event-type selection without an approved decision. Audit reports low-buy-in series graded on Tier 1, duplicate/stale records and server trust of client scores. These live-data findings were not independently reverified or modified in this pass. The homepage uses explicitly illustrative, internally consistent Tier 1 grades; sample rows are not live event listings.

## API/content sources

- api/content.js: MongoDB tsrcms.pages; public GET with default-content fallback; authenticated POST replacement. Default hero includes unverified legacy copy. Rebuilt home uses only static js/concept3-data.js and makes no API requests.
- api/grades.js: public GET with seed fallback; authenticated POST/DELETE. Sanitizes fields, trusts submitted score/grade/tier, does not recalculate. Stores structure hash for calculator links.
- api/articles.js: published article reads, authenticated draft access and writes/deletion in MongoDB. Fails with database-unavailable response if connection fails.
- api/post.js: server-rendered CMS article route from published article slug.
- api/auth.js: POST password comparison against ADMIN_PASSWORD, returns ADMIN_SECRET token on success. Not called in this pass.
- Real home reporting: two existing static article pages and their original images. Headlines/decks drawn from existing index/article content, no added authors or quotes.
- Media: existing media.html supplies eight Facebook reel URLs, descriptions and images/reels assets; first three reused on home. No fabricated runtimes.
- Remaining editorial slots: labeled “Sample story — development preview”; reused existing schedule/room/event images. No invented reporting/bylines.

## Preview decisions and limits

Shared static markup in all seven pages; no runtime header injection. Navigation uses original URLs and current-page attributes. Search links to the News route (its full functional search is deferred to its redesign). Social icons route to a transparent verification note on About because legacy profile links are placeholders; no invented handles. Footer anchors resolve to draft policy/methodology/contact notes on About. Newsletter is explicitly a local UI demonstration: no storage, network submission or subscription claim. No Hosted Games home section.

Not verified: live CMS/database contents, production deployment and domain, official social handles, newsletter service, availability/accuracy of existing hosted listings, external Facebook availability, or official approval of scoring policy. No authenticated requests, API mutations, deployment, commits, or .vercel changes. Existing non-home page bodies retain legacy styling/features pending later passes.

## Validation performed

JavaScript syntax: node --check passed for concept3.js and concept3-data.js. git diff --check passed. Static HTML parser verified seven shared headers, one main landmark per route, and existing local href/src targets. Home contains no API fetch or write path. Working branch verified as redesign/concept3.

Attempted live-site inspection at https://www.theshamreport.com; browser fetch returned inaccessible. Attempted local HTTP server and Playwright screenshots at 1440/1024/768/390/320; sandbox denied socket creation and Chromium exited with setsockopt Operation not permitted. Therefore screenshots, visual comparison iterations, runtime console checks, keyboard interaction and measured overflow remain unverified. CSS includes explicit responsive breakpoints but those are not evidence of browser validation. No screenshot artifacts claimed.
