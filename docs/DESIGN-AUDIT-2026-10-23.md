# Reference layout repair — October 23, 2026

The first seven supplied screenshots are the design references. They contain illustrative stories and scores; the repair retains the publication's real content and calculation rules.

## Findings and changes

- **Homepage hero:** measured 1,156px tall on production at a 1,280px viewport. Four `1fr` sidebar rows expanded to accommodate long imported text, stretching the adjacent hero. The desktop hero and sidebar are now 560px tall, with `minmax(0, 1fr)` rows and bounded text previews. On small phones the hero can grow with its text so the story button is never clipped.
- **Content density:** home now shows four news previews and four scores, matching the reference composition. Full reporting and scores remain on their section pages.
- **News:** the initial list was 50 items. It now starts with six, adds six per click, and resets pagination on filtering. The text introduction and search share a row; a photo feature, three-story rail, latest reporting and investigations sidebar establish hierarchy.
- **Media:** removed the redundant photographic intro, retained one featured video, added a three-column latest-video grid and a compact additional-clips section. Mobile uses two columns. Search still covers the complete reel catalogue.
- **Tournaments:** removed the extra photographic banner; retained filters, curve groups and selected-event details. Groups initially show four events with expansion controls. Lengthy structure/regrade context is in an accessible disclosure.
- **About:** bounded introduction and founder photos, three-column coverage cards and two-column policies. All policy and methodology text remains available in native disclosures.
- **TSR Score and Hosted Games:** bounded banners and consistent image, form and column proportions. No scores, formulas, publication statuses, verification criteria or contact settings were changed.
- **Typography and spacing:** condensed Oswald display headlines, Archivo Narrow text, bright red accents, narrower content shell and compact dividers follow the supplied visual direction.

## Validation

- Browser checked all seven pages at 1280px, 390px and 320px: no page-level horizontal overflow.
- Desktop images loaded without broken-image errors.
- Production hero 1156px → repaired hero 560px at 1280px width.
- Checked the story button remains inside the hero at 320px.
- News pagination 6 → 12, no-results search and reset to 6 passed.
- Media no-results search and reset to six main cards plus additional clips passed.
- Tournament selection changes the detail panel; long detail disclosure starts closed.
- Calculator example returned 51.4 / A on Curve 1; engine suite passed 200 checks.

## Content differences from the concept

The concepts' sample photos, fictitious room listings, interviews, social links and newsletter functionality were not invented. Hosted games remains a verification-state page, and newsletter/contact/social configuration remains as it was. These content and service gaps prevent literal pixel-for-pixel reproduction of every sample section; the layout repair follows the reference proportions with the actual catalogue.
