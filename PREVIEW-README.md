# The Sham Report redesign preview

Branch: `redesign-preview`, based on main commit `1cfb3d1`.
No production deployment or database write is part of this work. Preview APIs serve a committed public-content snapshot and deny mutations. Admin authentication is disabled. Preview pages are noindex.

Open `index.html` directly to browse locally, or run `node scripts/serve-preview.cjs` for http://127.0.0.1:4173. All page assets, photos and Bebas Neue are local. Only the existing YouTube video requires internet.

Build: `node scripts/build-preview.cjs`. Calculator engine source is preserved from committed main in `scripts/calculator-source.html`; the engine is extracted unchanged on build. Tests: `node scripts/test-preview.cjs` (Playwright path in script reflects this workstation).

## Completed pages

| Page | File |
| --- | --- |
| Homepage | index.html |
| Tournaments | tournaments.html |
| Tournament detail | tournament-detail.html?event=g-the-bigger-one-250k-gtd |
| Comparison | comparison.html (select 2–3 tournaments first) |
| Calculator | calculator.html |
| Calculator structure | calculator-structure.html |
| Calculator result | calculator-result.html |
| Legacy calculator URL | tsr-score-calculator.html |
| Poker rooms | poker-rooms.html |
| Room detail | room-detail.html?room=tch-dallas |
| News | news.html |
| Article | article.html?slug=lodge-raid-coverage-tom-dwan-enters-the-chat |
| Trailblazer results | trailblazer-stop-2-kick-off-results.html |
| Media | media.html |
| About | about.html |
| Methodology | methodology.html |
| Editorial standards | editorial-standards.html |
| Alerts | alerts.html |
| Hosted Games | hosted-games.html |

## Content provenance and limitations

Snapshot captured October 9, 2026 from published public live API articles and grades. Includes two full CMS articles, the main-branch Trailblazer Stop 2 results article, two published hosted-game profiles and 17 grades. Four grade records include complete structures and are recalculated with the main engine; 13 preserve published scores and derive their letters from the current tier bands. All existing letters agree. Historical series records are not advertised as upcoming. A malformed existing verification date is preserved, not silently repaired.

Remaining data/decisions:
- Recheck recurring schedules; obtain current dates, starts, late registration, guarantee conditions, membership/seat charges and dated verification records.
- Obtain the missing 13 full structures. Consolidate the two published Bigger One records once the owner confirms whether they are duplicates.
- Verify room addresses, hours, current operating status, fees and official URLs. Supply room photographs and a Shomari portrait. The Lodge image is reporting context, not proof of current operation.
- Confirm hosted-game schedules, real host contact routes and notification service. No live seat/list state is claimed.
- Connect an email provider and approve consent/privacy copy. Forms clearly state TODO and never fake subscriptions.
- Approve editorial, corrections, sponsorship and funding policies; select contact/Signal details. Editorial standards are explicitly proposed.
- Provide a verified media catalogue, transcripts and podcast feed. The existing YouTube video is preserved; legacy placeholder episode cards are omitted.
- Choose how redesigned pages should read fresh production CMS data before any eventual merge. Snapshot APIs are deliberately read-only and are not a production CMS replacement.

Validation: 19 HTML pages at 1440px and 390px, no horizontal page overflow, loaded images, calculator parity against original engine including invalid and altered inputs, comparison selection, filters/search, three-stage calculation and honest email status. Main and original local checkout remain untouched.
