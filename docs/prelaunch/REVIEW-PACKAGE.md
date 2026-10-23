# Pre-Launch Staging Review Package (Phase 8, Steps 5 & 6)
**Owner:** Cyborg (Technical Lead & Website Developer) · **Date:** Thursday, Oct 22, 2026, ~7:56 PM CT
**Branch:** `prelaunch/staging` (`0502ec1`, merges `redesign/concept3`, `prelaunch/api-hardening`, and `rungood-tsr-grades` into `/workspace/wt-prelaunch`)
**Staging Preview URL:** https://the-sham-report-v2-35cl2wg0q-sham-god-media-s-projects.vercel.app (Deployment ID `dpl_BQeoC9uKi5Fqk1TJitLYkFWxcYUN`, target `preview` — Vercel login required as `shomari51-dot`)
**Production Status:** Untouched (`main` remains at `062700c`; zero production database writes; code-level `PROD_DB_WRITE_BLOCKED` guard active on non-production deployments).

---

## 1. Staging Routes & Deliverables
- **Home:** `/index.html` (leads with real Trailblazer Kick Off report, RunGood Houston preview + 2 Lodge CMS articles, real Series TSR Score table, 8 Facebook poker reels)
- **News:** `/news.html` (4 real published articles by Shomari Williams; zero fictional/sample stories; includes Staged Facebook Import Preview section)
- **TSR Score Calculator:** `/tsr-score-calculator.html` (Methodology `v1.1` — 3-Curve A–D Scale; separated buy-in/prize-pool/fee/add-on/re-entry/entries fields; `Unknown` withholds letter grade; automated output labeled **Data-Based Structure Analysis**, never "Sham's Take")
- **Tournaments:** `/tournaments.html` (real graded Series events + real ungraded event archive; clean Weekly curve empty state; staged 20-record Methodology `v1.1` regrade comparison table; all event details show **Data-Based Structure Analysis**)
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
- `TSR-METHODOLOGY.md` — Public + internal technical reference for TSR Score `v1.1`
- `REGRADE-COMPARISON.md` — Full 20-grade before-and-after comparison table + duplicate & missing-type analysis
- `POLICIES.md` — Full draft Editorial Policy, Editorial Independence & Conflict-of-Interest Policy, and Corrections Policy (with internal correction schema)
- `SAMPLE-FB-IMPORT.md` + `tests/fixtures/fb-import-lodge-mar11.json` — Staged March 11, 2026 Lodge Facebook post import (`Ready for Review`)
- `STAGE2-AUTH.md` & `STAGE3-GRADES.md` — Auth token hardening, secret rotation steps, and additive grades schema

### Updated Screenshots (`/workspace/shots-prelaunch/`)
- Desktop (1440px) & Mobile (390px) full-page screenshots for `home`, `news`, `tsr-score`, `tournaments`, `hosted-games`, `media`, `about`, `article-lodge`, and `admin` (18 PNGs total)
- Archive: `/workspace/shots-prelaunch/prelaunch-staging-screenshots.zip`

---

## 2. Approved Methodology v1.1

# Methodology v1.1 · 3-Curve A–D Scale

Numeric score math is unchanged. Stored scores are relettered; full hashes retain engine recomputation. No production database connection or writes. Weekly uses Curve 1; strictly sub-$400 single-day series use Curve 2; $400+ and multi-day series and Major use Curve 3. All curves have a D− floor. Unknown classification withholds letters.

| Event / ID | Before score / grade / tier | v1.1 score / grade / tier | Classification / status |
| --- | --- | --- | --- |
| Send Off / g-send-off | 48.2 / A− / 1 | 48.2 / B / 2 | series / published |
| Randy's Six Shooter $250 / g-randy-s-six-shooter-250 | 39.2 / C+ / 1 | 39.2 / C / 2 | series / published |
| $400 Big Tex Giant Stack / g-400-big-tex-giant-stack | 51.4 / C− / 2 | 51.4 / C− / 3 | series / published |
| MAIN EVENT / g-main-event | 81.4 / B+ / 2 | 81.4 / B+ / 3 | series / published |
| Lone Star PLO / g-lone-star-plo | 29 / D / 1 | 29.0 / D / 2 | series / published |
| $2,500 NLH High Roller / g-2-500-nlh-high-roller | 93.9 / A / 2 | 93.9 / A / 3 | series / published |
| $200 Lone Star Stand-Off / g-200-lone-star-stand-off | 48.2 / A− / 1 | 48.2 / B / 2 | series / published |
| $300 2-7 Single Draw / g-300-2-7-single-draw | 46.7 / B+ / 1 | 46.7 / B− / 2 | series / published |
| $300 Mega Stack / g-300-mega-stack | 51.4 / A / 1 | 51.4 / B+ / 2 | series / published |
| Donkey Derby $200 / g-donkey-derby-200 | 40.2 / B− / 1 | 40.2 / C / 2 | series / published |
| Even Bigger One $250K GTD / g-even-bigger-one-250k-gtd | 73 / A+ / 1 | 73.0 / A+ / 2 | series / published |
| $150 Deepstack / g-150-deepstack | 29 / D / 1 | 29.0 / D / 2 | series / published |
| $400 Kick Off / g-400-kick-off | 48.2 / D+ / 2 | 48.2 / D+ / 3 | series / published |
| The Bigger One $250K GTD / g-the-bigger-one-250k-gtd | 78.4 / A+ / 1 | 78.4 / A+ / 1 | weekly / published |
| PLO-Deepstack / g-plo-deepstack | 31 / D+ / 1 | 31.0 / No grade / None | unknown / needs_review |
| The Bigger One / g-the-bigger-one | 78.4 / A+ / 1 | 78.4 / No grade / None | unknown / needs_review |
| The RunGood Main Event / g-the-rungood-main-event | 69.8 / B− / 2 | 69.8 / No grade / None | unknown / needs_review |
| RunGood Monster Stack Opener / rg-1 | 69.8 / B− / 2 | 69.8 / B− / 3 | series / published |
| RunGood PokerNews PowerStack / rg-5 | 46.6 / D+ / 2 | 46.6 / D+ / 3 | series / published |
| RunGood Main Event / rg-8 | 66 / B− / 2 | 66.0 / B− / 3 | series / published |

Even Bigger One $250K GTD ($300, 73.0) is A+ on Curve 2 single-day; if multi_day is true, it is B on Curve 3. The explicitly weekly Bigger One record is held out of public weekly grading until verified sheets are published.



## 3. Verification & Automated Test Results
- **Unit & Integration Suite (`npm test`):** Pending full rerun in an environment that permits local sockets. Engine: **200 checks passing**; direct hardening run: **25 passing**, with three integration tests blocked by their setup hook. Syntax checks, offline backup migration dry run, and `git diff --check` pass. The current sandbox blocks the local MongoDB memory server with `listen EPERM`:
  - Production write guard (`isWritableEnv`, `assertWritableDb`, and `409 PROD_DB_WRITE_BLOCKED` on `/api/grades`, `/api/articles`, `/api/content` when targeting `tsrcms` outside production).
  - `v1.1` event classification (`weekly`, `series`, `major`, `unknown`), separated buy-in accounting (`total`, `prize_pool`, `fee`, `addons`, `reentry_rules`, `guarantee`, `actual_prize_pool`, `entries`, `unique_players`), curve boundaries, and recalculation from inputs/hash.
  - Sham's Take & Experience Record guardrail: experience ratings never change the numeric TSR Score; `shams_take` cannot be marked `Approved` or `Published` without verified firsthand attendance (`played`, `attended`, or `observed`) + `verified_by_publisher: true`; public helper outputs **Data-Based Structure Analysis** whenever firsthand approval is absent.
  - Facebook Article Import validator & CLI (`scripts/import-fb-post.js --dry-run --input tests/fixtures/fb-import-lodge-mar11.json`): preserves verbatim original post text, validates dates/source/fact flags/outdated flags/image rights/SEO, and blocks direct publication without editorial review.
  - Public DOM & asset audit: confirms `Hosted Games` is absent from `<nav class="c3-nav">` on all 10 HTML pages, zero active `mailto:editor@`/`news@`/`corrections@` links, zero unverified social links, and zero fictional/sample stories or sample grades in `js/concept3-data.js` and `js/concept3-events.js`.
- **Prior build Responsive Layout & Image Check (Headless Chrome; not rerun for v1.1):** **50 / 50 passing** across 10 routes × 5 viewports (`320px`, `390px`, `768px`, `1024px`, `1440px`) with zero horizontal overflow and zero broken images.

---

## 4. Decisions Requiring Shomari's Approval Before Production Launch
1. **Historical Regrade & Curve Calibration — Approved:** Sham approved Methodology v1.1, the 3-Curve A–D Scale, with strictly sub-$400 single-day series on Curve 2. Implemented in staging; coordinator handles commit, push and deployment. Even Bigger One is A+ single-day on Curve 2, B if multi-day on Curve 3.
2. **Duplicate Retirement & Missing Event Types:** Approve marking `g-the-bigger-one` and `g-the-bigger-one-250k-gtd` (78.4) as `superseded` by `g-even-bigger-one-250k-gtd` (73.0), and confirm `event_type` for `PLO-Deepstack` ($150, Palace Poker) and `The RunGood Main Event` ($600, Palace Poker).
3. **Policies Sign-Off:** Review and approve the draft Editorial Policy, Editorial Independence & Conflict-of-Interest Policy, and Corrections Policy (`docs/prelaunch/POLICIES.md` / `/about.html`) to remove the `Draft — Pending Publisher Approval` badges.
4. **March 11 Lodge Facebook Import Approval:** Review the staged March 11 Lodge post import in `/admin` (`docs/prelaunch/SAMPLE-FB-IMPORT.md`), supply the canonical Facebook post URL/ID, and confirm image rights for `images/The_Lodge_Photo.jpg`.
5. **Mailboxes & Official Social Profiles:** Confirm when `editor@theshamreport.com`, `news@theshamreport.com`, and `corrections@theshamreport.com` are live to flip `enabled: true` in `js/concept3-config.js`, and supply verified URLs for X, Facebook, Instagram, and YouTube.
6. **Production Database Isolation & Secret Rotation:** When back at his desktop, create `tsrcms_preview` in MongoDB Atlas for Preview/Development, rotate `ADMIN_SECRET` and `ADMIN_PASSWORD` in Vercel Production, reconnect GitHub auto-deploy in Vercel (`Settings → Git`), and give explicit approval in Cyborg's chat to merge `prelaunch/staging` to `main` and run `vercel deploy --prod`.

---

Ready for Shomari's review. The live website has not been replaced. Publication requires Shomari's explicit approval.
