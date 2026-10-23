# Methodology v1.0 regrade preview

Staged only. No database reads or writes were used. Numeric inputs are retained from tests/fixtures/grades.json; hashes, where supplied, are recomputed by the unchanged engine. Missing classification is never inferred from a hash. Historical “Played” labels do not establish publisher-verified firsthand experience.

| ID / Event | Before score | Before grade / tier | v1.0 score | v1.0 grade / tier | Classification / status |
| --- | --- | --- | --- | --- | --- |
| g-send-off — Send Off | 48.2 | A− / 1 | 48.2 | D+ / 2 | series / published |
| g-randy-s-six-shooter-250 — Randy's Six Shooter $250 | 39.2 | C+ / 1 | 39.2 | D− / 2 | series / published |
| g-400-big-tex-giant-stack — $400 Big Tex Giant Stack | 51.4 | C− / 2 | 51.4 | C− / 2 | series / published |
| g-main-event — MAIN EVENT | 81.4 | B+ / 2 | 81.4 | B+ / 2 | series / published |
| g-lone-star-plo — Lone Star PLO | 29 | D / 1 | 29.0 | F / 2 | series / published |
| g-2-500-nlh-high-roller — $2,500 NLH High Roller | 93.9 | A / 2 | 93.9 | A / 2 | series / published |
| g-200-lone-star-stand-off — $200 Lone Star Stand-Off | 48.2 | A− / 1 | 48.2 | D+ / 2 | series / published |
| g-300-2-7-single-draw — $300 2-7 Single Draw | 46.7 | B+ / 1 | 46.7 | D+ / 2 | series / published |
| g-300-mega-stack — $300 Mega Stack | 51.4 | A / 1 | 51.4 | C− / 2 | series / published |
| g-donkey-derby-200 — Donkey Derby $200 | 40.2 | B− / 1 | 40.2 | D− / 2 | series / published |
| g-even-bigger-one-250k-gtd — Even Bigger One $250K GTD | 73 | A+ / 1 | 73.0 | B / 2 | series / published |
| g-150-deepstack — $150 Deepstack | 29 | D / 1 | 29.0 | F / 2 | series / published |
| g-400-kick-off — $400 Kick Off | 48.2 | D+ / 2 | 48.2 | D+ / 2 | series / published |
| g-the-bigger-one-250k-gtd — The Bigger One $250K GTD | 78.4 | A+ / 1 | 78.4 | A+ / 1 | weekly / published |
| g-plo-deepstack — PLO-Deepstack | 31 | D+ / 1 | 31.0 | No grade / None | unknown / needs_review |
| g-the-bigger-one — The Bigger One | 78.4 | A+ / 1 | 78.4 | No grade / None | unknown / needs_review |
| g-the-rungood-main-event — The RunGood Main Event | 69.8 | B− / 2 | 69.8 | No grade / None | unknown / needs_review |

## Review groups

Nine low-buy-in series records move from Weekly/Tier 1 to Series/Tier 2: Send Off, Randy’s Six Shooter, Lone Star PLO, Lone Star Stand-Off, 2-7 Single Draw, Mega Stack, Donkey Derby, Even Bigger One and $150 Deepstack. Four existing Tier 2 series records retain their curve: Big Tex Giant Stack, MAIN EVENT, High Roller and Kick Off.

The explicitly weekly g-the-bigger-one-250k-gtd remains on the Weekly curve pending identity verification. Three records have no classification: PLO-Deepstack, The Bigger One and The RunGood Main Event. They receive needs_review / Needs Verification, no tier and no letter. Do not confuse the historical Palace Poker record with the separately sourced Champions Houston RunGood Main Event (66.0).

## The Bigger One duplicate cluster

- g-the-bigger-one-250k-gtd: weekly, Saturdays, $300, stored 78.4; full hash.
- g-the-bigger-one: missing type, $300, stored 78.4; identical blind schedule and price/stack/duration inputs to the weekly record, but missing frequency metadata. Strong duplicate candidate, not a second verified event. Hold for classification and identity confirmation.
- g-even-bigger-one-250k-gtd: series, $300, stored 73.0, no hash. Similar title/guarantee alone does not establish duplicate identity; retain separately pending official sheet/date verification.

Do not merge, delete or supersede automatically. Verify source, series name, event number, dates, format and structure. Choose canonical ID only after publisher review and preserve superseded_by plus audit history. Stored-score records are relettered, not newly structure-verified.
