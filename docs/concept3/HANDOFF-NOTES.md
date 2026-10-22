# Concept 3 — Pass 3 handoff

October 22, 2026. Worktree-only development preview. No commit, deployment, authenticated request, write API call, production data change, or `.vercel/` change was made.

## Pass 3 visual critique fixes

- Inspected repository photos as a contact sheet. All six interior heroes now use actual room, table or chip photographs with cover crops, explicit aspect ratios, dark left gradients and solid white headlines. News filters sit below the hero; About has the same photographic hero treatment. “How scoring works” is an outlined button inside the calculator hero.
- Hosted listing and detail images now use room/table scenes rather than Aaron/Rebecca portraits. Host names and all legacy listing text remain intact; image alternatives identify illustrative room photographs.
- Calculator initially shows a structured empty result: Score breakdown (depth, jumps, pace, fees), Strengths, Tradeoffs and Sham’s Take. No invented grade is shown. Successful calculation replaces it; edits/reset restore it. Added illustrated Depth/Pace/Fees and Weekly/Series format sections, retaining actual buy-in curve rules.
- Tournament groups initially show at most ten events each. Independent Show more buttons add ten rows per group; filtering/reset restores limits. Sorting and selection remain intact.
- Audited responsive CSS for all seven review routes: shrinkable grid children, wrapping headings, single-column phone filters/fields, and stacked home score-table rows at 380px and below. Existing tournament rows stack on phones. No overflow-hiding workaround was added.
- Validation: engine tests pass all 53 checks; changed JavaScript syntax checks and whitespace checks pass. Headless Chrome was retried and still crashes at launch with `setsockopt: Operation not permitted`. Therefore measured 320px overflow and desktop screenshot comparison remain unverified, despite the CSS audit. Coordinator should repeat the seven-route browser check in its browser-capable environment.
- No commit, deployment or `.vercel/` modification was performed. Earlier pass notes follow for context; their browser-verification limitations remain applicable.

## Implemented

- Preserved the Pass 1 home composition and content. Desktop hero is now 610px; Big Read image uses a larger 46% column and a 16:9 crop.
- Rebuilt all six interior routes with the existing black/white/red system, Archivo Narrow headings, shared header/footer, thin rules and responsive layouts.
- News: featured reporting, secondary items, latest list, category/search filters, item count, incremental Load more, empty state/reset. Both original articles remain linked. Missing authors are explicitly marked, never invented.
- Article template: `article-template.html`, linked from News, with author, sources, captions, disclosures and corrections placeholders.
- Calculator: extracted the original engine to `assets/tsr-engine.js`; CFG values, bands, parsing, scoring and letter modifiers preserved. Corrected only the misleading tier-split comment to describe total advertised buy-in. No publisher/admin code remains on this route.
- Calculator UI: Weekly/Series radios; buy-in-selected official curve and explanation; visible SCO-001 mismatch; required fields and optional details; per-level minutes, scheduled changes, add-on support; missing-data, invalid-data, calculating, result, edited-needs-recalc and failure/retry states. Breakdown, strengths, tradeoffs and “Sham’s Take — Automated draft.” Load example, Reset, Copy (with manual fallback), Print and methodology link. Original calculator hash-format links load for review/recalculation.
- Tournaments: separate `js/concept3-events.js` data; date/search/location/venue/game/buy-in/type filters, within-curve sorting and reset; selected event details; sources, last verification status, known structure details, original structure PDF and official links when supplied. Groups explicitly separate tiers; missing scores display “No score.” Low-buy-in series carry the curve mismatch note.
- Retained Trailblazer Kick Off and all 11 RunGood schedule entries from the existing articles, including published price/stack/level/guarantee details. These are archives, not current live schedules. The complete original articles and their source links remain unchanged and reachable at their original URLs.
- Hosted Games: retained the three public-room appearances described by the two legacy host listings; selectable details, host, schedule, stakes, format, rules and source/verification status. No seat availability, booking, notifications or invented contacts. Submit a listing uses mailto.
- Media: all eight original reel images, URLs, titles, dates and descriptions preserved in `js/concept3-reels.js`; compact previews, featured reel, text search/reset, explicit “opens Facebook” labels; no autoplay, podcast or fabricated runtimes.
- About: mission, verified founder role and Champions Social Club commentary with Hayden Fortini, editorial approach, proposed independence/disclosure and corrections policies, current methodology/curve thresholds and pending SCO-001 decision. All footer anchors resolve.
- Semantic labels, native controls, focus indicators, visible grade letters plus scores, and responsive breakpoints for requested viewport sizes. Authored text uses solid white; red headings use the brighter shared accent. Measured browser accessibility/overflow verification remains blocked as described below.

## Mocked / sample content

- News: Reading the structure sheet, Around the Texas tables, The tournament notebook, Behind the broadcast, The weekly structure notebook. All link to an explicitly unpublished template or are marked as samples; no fabricated authors, quotes or reporting.
- Four tournament score fixtures: two weekly and two series examples. Scores are illustrative, not computed from verified event structures. Details explicitly state that full blind schedules and component breakdowns are not supplied.
- Calculator Load example is an illustrative structure, not a claim about an actual event. Automated commentary is browser-generated; no editor assessment is implied.
- All hosted listings are “Unverified — sample.” Their legacy claims are retained for review, with no current availability asserted. Room contact and verification date remain “Not provided.”
- Home’s existing sample editorial slots/grade rows and disconnected newsletter demonstration remain as in Pass 1.

## Blocked

- Chromium/Playwright launch fails with `setsockopt: Operation not permitted` under this sandbox. No screenshots, screenshot ZIP, browser console audit, measured overflow, keyboard walkthrough, clipboard permission test, printed-page review or visual pixel comparison is claimed.
- No hosted preview URL was provisioned; publishing was expressly excluded. Review the local routes with your usual static preview server.
- Verified editorial email and social profile handles were not present in supplied materials. Mailto links prepare a message without a recipient and visibly require the user to add the verified address. Individual real Facebook reel links work as external destinations; availability was not reverified.

## Deferred

- CMS integration, editor commentary overrides, live schedule verification and feed integration, production newsletter, approved contact inbox, and full editorial policies.
- Save/compare/booking features omitted; no inactive promotional buttons were introduced.
- Original two article bodies retain their existing layouts. The new template is ready for future articles; this pass does not rewrite original reporting.
- Desktop and mobile screenshots (all seven routes), image ZIP, runtime checks at 1440/1024/768/390/320, and final contrast/accessibility audit require a browser-capable preview environment.

## Visual differences from references

The references use fabricated rooms, stock scenes, sample reporting, inconsistent scores and more content than the real inventory. This implementation uses existing photographs and eight portrait reel covers cropped into compact landscape previews. Real headlines have different line lengths. News sidebar uses an uncommissioned notebook slot rather than invented investigations. Media has only supported reel content; no fabricated interviews, durations or extra video sections. Hosted Games has three retained room appearances instead of four fictional listings, and no fake confirmation button. Tournaments omits the comparison tray and shows verified-from-repository archival fields or “Not provided.” Calculator retains the actual model rather than the reference’s contradictory B+ / 78.4 weekly result. About uses available repository photography and truthful review/contact states instead of a disconnected message form. Actual visual matching remains unverified due to browser restriction.

## Validation

- `node tests/engine.test.js` — PASS, 53 checks: both tiers’ boundaries and thirds, just-below band transitions, uncapped grades, 73.0 → Tier 1 A+ / Tier 2 B, $300 / $300.01 boundary, known sample score 51.42857142857142 (A), missing levels, invalid fees, per-level minute precedence, strict 60% / 100% jump penalties.
- Extracted/original engine parity — PASS on 12 stack/buy-in fixtures, comparing complete returned objects using the original page’s engine in an isolated Node VM.
- Calculator state smoke checks in a minimal DOM stub — PASS: missing data, example result, mismatched curve, edits invalidating result, forced engine failure and retry visibility. This is not a browser interaction audit.
- `node --check` — PASS on all Concept 3 JavaScript and the engine.
- Static HTML validation — PASS: eight pages, exactly one main landmark, no duplicate IDs, existing local links/assets and footer/search anchor targets.
- `git diff --check` — PASS.
- Read-only static data; no fetch, POST, database or authentication path in the new modules.

## Decisions for Sham

1. SCO-001: keep buy-in-selected curves, switch to event type, or approve another explicit policy. Until approved, the official buy-in rule remains unchanged.
2. Approve/refine weekly-vs-series rationale and automated commentary wording; decide where editor overrides belong in CMS.
3. Review editorial independence, disclosure and correction policies, currently marked “Proposed — pending Sham’s review.”
4. Supply verified editorial/listing contact and official profile handles; verify legacy public-room listings before publication.
5. Commission or remove sample editorial slots and replace illustrative event scores with sourced structures before launch.

## Review routes and release / rollback

`index.html`, `news.html`, `tsr-score-calculator.html`, `tournaments.html`, `hosted-games.html`, `media.html`, `about.html`; additional `article-template.html`. Existing `trailblazer-stop-2-kick-off-results.html` and `rungood-houston-preview.html` remain available.

No release occurred, so no production rollback is needed. Before a separately authorized launch: obtain policy/content approval, supply verified contacts, remove or clearly retain sample labels, run the deferred browser checks and capture the full screenshot set, then record the approved revision and prior deployment for rollback. Do not publish this preview without explicit approval.

Ready for Shomari's review. The live website has not been replaced. Publication requires Shomari's explicit approval.
