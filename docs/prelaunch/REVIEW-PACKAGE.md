# Pre-Launch Staging Review Package (Phase 8, Steps 5 & 6)
**Owner:** Cyborg (Technical Lead & Website Developer) · **Date:** Thursday, Oct 22, 2026, ~7:56 PM CT
**Branch:** `prelaunch/staging` (`0502ec1`, merges `redesign/concept3`, `prelaunch/api-hardening`, and `rungood-tsr-grades` into `/workspace/wt-prelaunch`)
**Staging Preview URL:** https://the-sham-report-v2-cso57zuqd-sham-god-media-s-projects.vercel.app (Deployment ID `dpl_EyirRjEXBR9Fvd3NxQEcJnWhWxJD`, target `preview` — Vercel login required as `shomari51-dot`)
**Production Status:** Untouched (`main` remains at `062700c`; zero production database writes; code-level `PROD_DB_WRITE_BLOCKED` guard active on non-production deployments).

---

## 1. Staging Routes & Deliverables
- **Home:** `/index.html` (leads with real Trailblazer Kick Off report, RunGood Houston preview + 2 Lodge CMS articles, real Series TSR Score table, 8 Facebook poker reels)
- **News:** `/news.html` (4 real published articles by Shomari Williams; zero fictional/sample stories; includes Staged Facebook Import Preview section)
- **TSR Score Calculator:** `/tsr-score-calculator.html` (Methodology `v1.0` — Curve by Event Type; separated buy-in/prize-pool/fee/add-on/re-entry/entries fields; `Unknown` withholds letter grade; automated output labeled **Data-Based Structure Analysis**, never "Sham's Take")
- **Tournaments:** `/tournaments.html` (real graded Series events + real ungraded event archive; clean Weekly curve empty state; staged 17-record Methodology `v1.0` regrade comparison table; all event details show **Data-Based Structure Analysis**)
- **Media:** `/media.html` (8 real Facebook poker reels with verified covers and explicit external Facebook links)
- **About & Policies:** `/about.html` (`#editorial-standards`, `#independence`, `#methodology`, `#corrections`, `#contact` — full draft policies marked `Draft — Pending Publisher Approval`, TSR Score Revisions & Corrections Log, staged contact notices, hidden unverified social profiles)
- **Article View (CMS / Imported Posts):**
  - `/article-template.html?slug=the-lodge-raid-first-reaction-march-11-2026`
  - `/article-template.html?slug=lodge-raid-coverage-tom-dwan-enters-the-chat`
  - `/trailblazer-stop-2-kick-off-results.html` (unsourced 1h35m sentence removed per WRI-001 F5; updated Concept 3 nav)
  - `/rungood-houston-preview.html` (includes 3 real Champions Club TSR grades: Monster Stack Opener 69.8 B−, RunGood Main Event 66.0 B−, PokerNews PowerStack 46.6 D+; updated Concept 3 nav)
- **Hosted Games (Preserved, Hidden from Public Nav):** `/hosted-games.html` (removed from `<nav class="c3-nav">` across all pages; page displays "Hosted Games Directory — Verification in Progress" with the 5 verification criteria; legacy host schema preserved in `js/concept3-hosts.js` with `verified: false, status: 'Needs Verification'`)
- **Admin Editorial Review Dashboard:** `/admin` (`/admin/index.html` — 5 review sections: Stories & Facebook Import Review, TSR Grades & Regrade Comparison, Sham's Take & Experience Records, Corrections & Score Revision Log, and Contact & Social Placeholders; banner confirms `PROD_DB_WRITE_BLOCKED` on non-production deployments)

### Documentation & Technical Artifacts in Repo (`/workspace/wt-prelaunch/docs/prelaunch/`)
- `TSR-METHODOLOGY.md` — Public + internal technical reference for TSR Score `v1.0`
- `REGRADE-COMPARISON.md` — Full 17-grade before-and-after comparison table + duplicate & missing-type analysis
- `POLICIES.md` — Full draft Editorial Policy, Editorial Independence & Conflict-of-Interest Policy, and Corrections Policy (with internal correction schema)
- `SAMPLE-FB-IMPORT.md` + `tests/fixtures/fb-import-lodge-mar11.json` — Staged March 11, 2026 Lodge Facebook post import (`Ready for Review`)
- `STAGE2-AUTH.md` & `STAGE3-GRADES.md` — Auth token hardening, secret rotation steps, and additive grades schema

### Updated Screenshots (`/workspace/shots-prelaunch/`)
- Desktop (1440px) & Mobile (390px) full-page screenshots for `home`, `news`, `tsr-score`, `tournaments`, `hosted-games`, `media`, `about`, `article-lodge`, and `admin` (18 PNGs total)
- Archive: `/workspace/shots-prelaunch/prelaunch-staging-screenshots.zip`

---

## 2. Phase 1 Deliverable: Historical Regrade Comparison & Duplicate Analysis (Staged — Not Applied to Production)

### A. 9 Low-Buy-In Series Events (`type: series`, `$150–$300`, TCH Dallas)
Numeric scores are curve-independent and unchanged; only the letter grade changes when moved from the legacy buy-in rule (`≤ $300` → Tier 1) to `v1.0` Curve by Event Type (`series` → Tier 2 Series curve):

| ID | Event | Buy-In | Numeric Score | Current Live (Tier 1 Weekly Curve) | Staged `v1.0` (Tier 2 Series Curve) | Letter Delta |
|---|---|---:|---:|---|---|---|
| `g-even-bigger-one-250k-gtd` | Even Bigger One $250K GTD | $300 | 73.0 | **A+** | **B** | −2 steps |
| `g-300-mega-stack` | $300 Mega Stack | $300 | 51.4 | **A** | **C−** | −7 steps |
| `g-send-off` | Send Off | $200 | 48.2 | **A−** | **D+** | −8 steps |
| `g-200-lone-star-stand-off` | $200 Lone Star Stand-Off | $200 | 48.2 | **A−** | **D+** | −8 steps |
| `g-300-2-7-single-draw` | $300 2-7 Single Draw | $300 | 46.7 | **B+** | **D+** | −6 steps |
| `g-donkey-derby-200` | Donkey Derby $200 | $200 | 40.2 | **B−** | **D−** | −6 steps |
| `g-randy-s-six-shooter-250` | Randy's Six Shooter $250 | $250 | 39.2 | **C+** | **D−** | −5 steps |
| `g-lone-star-plo` | Lone Star PLO | $300 | 29.0 | **D** | **F** | −2 steps |
| `g-150-deepstack` | $150 Deepstack | $150 | 29.0 | **D** | **F** | −2 steps |

### B. 4 Series Events Above $300 (Unchanged under `v1.0`)
- `$2,500 NLH High Roller` ($2,500, TCH Dallas): **93.9 → A** (Series / Tier 2)
- `MAIN EVENT` ($600, TCH Dallas): **81.4 → B+** (Series / Tier 2)
- `$400 Big Tex Giant Stack` ($400, TCH Dallas): **51.4 → C−** (Series / Tier 2)
- `$400 Kick Off` ($400, TCH Dallas): **48.2 → D+** (Series / Tier 2)

### C. 3 Events Missing `event_type` (Flagged `needs_review` / `Needs Verification` under `v1.0`)
- `g-plo-deepstack` — **PLO-Deepstack** (Palace Poker, $150, score 31.0, legacy 1/D+): missing `type` → `event_type: 'unknown'`, `grade: null`, `status: 'needs_review'` until Sham confirms Weekly vs Series.
- `g-the-rungood-main-event` — **The RunGood Main Event** (Palace Poker, $600, score 69.8, legacy 2/B−): missing `type` → `event_type: 'unknown'`, `grade: null`, `status: 'needs_review'` until Sham confirms `series`.
- `g-the-bigger-one` — **The Bigger One** (TCH Dallas, $300, score 78.4, legacy 1/A+): missing `type` AND part of the duplicate cluster below.

### D. Duplicate Cluster Analysis: "The Bigger One" (TCH Dallas, $300)
1. `g-the-bigger-one` (published 2026-08-19, `type: null`, score `78.4`, grade `A+`): early entry using an uncorrected level length.
2. `g-the-bigger-one-250k-gtd` (published 2026-08-21, `type: 'weekly'`, score `78.4`, grade `A+`): duplicate entry with the uncorrected 78.4 score and misclassified as `weekly`.
3. `g-even-bigger-one-250k-gtd` (published 2026-08-21, `type: 'series'`, score `73.0`, grade `A+` on Tier 1 / `B` on Tier 2): corrected level-length calculation noted in `admin/bulk-publish.html`.
- **Recommendation (awaiting Sham's approval):** Keep `g-even-bigger-one-250k-gtd` as canonical; mark `g-the-bigger-one` and `g-the-bigger-one-250k-gtd` as `status: 'superseded'`, `editorial_status: 'Archived'`, `superseded_by: 'g-even-bigger-one-250k-gtd'` with a public revision note (never hard-deleted).

---

## 3. Verification & Automated Test Results
- **Unit & Integration Suite (`npm test`):** **27 / 27 passing** (plus **53 / 53** engine checks in `tests/engine.test.js`):
  - Production write guard (`isWritableEnv`, `assertWritableDb`, and `409 PROD_DB_WRITE_BLOCKED` on `/api/grades`, `/api/articles`, `/api/content` when targeting `tsrcms` outside production).
  - `v1.0` event classification (`weekly`, `series`, `major`, `unknown`), separated buy-in accounting (`total`, `prize_pool`, `fee`, `addons`, `reentry_rules`, `guarantee`, `actual_prize_pool`, `entries`, `unique_players`), curve boundaries, and recalculation from inputs/hash.
  - Sham's Take & Experience Record guardrail: experience ratings never change the numeric TSR Score; `shams_take` cannot be marked `Approved` or `Published` without verified firsthand attendance (`played`, `attended`, or `observed`) + `verified_by_publisher: true`; public helper outputs **Data-Based Structure Analysis** whenever firsthand approval is absent.
  - Facebook Article Import validator & CLI (`scripts/import-fb-post.js --dry-run --input tests/fixtures/fb-import-lodge-mar11.json`): preserves verbatim original post text, validates dates/source/fact flags/outdated flags/image rights/SEO, and blocks direct publication without editorial review.
  - Public DOM & asset audit: confirms `Hosted Games` is absent from `<nav class="c3-nav">` on all 10 HTML pages, zero active `mailto:editor@`/`news@`/`corrections@` links, zero unverified social links, and zero fictional/sample stories or sample grades in `js/concept3-data.js` and `js/concept3-events.js`.
- **Responsive Layout & Image Check (Headless Chrome):** **50 / 50 passing** across 10 routes × 5 viewports (`320px`, `390px`, `768px`, `1024px`, `1440px`) with zero horizontal overflow and zero broken images.

---

## 4. Decisions Requiring Shomari's Approval Before Production Launch
1. **Historical Regrade & Curve Calibration:** Approve applying `v1.0` (Curve by Event Type) to the 9 TCH Dallas `$150–$300` series events (which drops 8 of 9 from A/B/C on the Weekly curve to C−/D+/D−/F on the Series curve), or introduce a Single-Day / Sub-$400 Series sub-curve before relettering historical records.
2. **Duplicate Retirement & Missing Event Types:** Approve marking `g-the-bigger-one` and `g-the-bigger-one-250k-gtd` (78.4) as `superseded` by `g-even-bigger-one-250k-gtd` (73.0), and confirm `event_type` for `PLO-Deepstack` ($150, Palace Poker) and `The RunGood Main Event` ($600, Palace Poker).
3. **Policies Sign-Off:** Review and approve the draft Editorial Policy, Editorial Independence & Conflict-of-Interest Policy, and Corrections Policy (`docs/prelaunch/POLICIES.md` / `/about.html`) to remove the `Draft — Pending Publisher Approval` badges.
4. **March 11 Lodge Facebook Import Approval:** Review the staged March 11 Lodge post import in `/admin` (`docs/prelaunch/SAMPLE-FB-IMPORT.md`), supply the canonical Facebook post URL/ID, and confirm image rights for `images/The_Lodge_Photo.jpg`.
5. **Mailboxes & Official Social Profiles:** Confirm when `editor@theshamreport.com`, `news@theshamreport.com`, and `corrections@theshamreport.com` are live to flip `enabled: true` in `js/concept3-config.js`, and supply verified URLs for X, Facebook, Instagram, and YouTube.
6. **Production Database Isolation & Secret Rotation:** When back at his desktop, create `tsrcms_preview` in MongoDB Atlas for Preview/Development, rotate `ADMIN_SECRET` and `ADMIN_PASSWORD` in Vercel Production, reconnect GitHub auto-deploy in Vercel (`Settings → Git`), and give explicit approval in Cyborg's chat to merge `prelaunch/staging` to `main` and run `vercel deploy --prod`.

---

Ready for Shomari's review. The live website has not been replaced. Publication requires Shomari's explicit approval.
