# TSR methodology v1.0 — Curve by Event Type

## Public methodology

TSR Score measures a tournament’s published structure, not profitability, room quality or personal experience. Scores are uncapped and are not percentages. Compare events on the same curve. Inputs must come from official structure sheets; record the source, verification timestamp and event identity. A structure grade does not verify that an event is still running.

Weekly events use Tier 1 (Weekly curve). Series and Major events use Tier 2 (Series curve), regardless of buy-in. Unknown or ambiguous classifications receive no letter grade or tier: status needs_review, editorial status Needs Verification. A human must establish event type before publication. Legacy type fields weekly/series remain accepted; missing classification is never inferred from cost, title or calculator hash.

## Internal technical reference

For each level, orbit cost O = small blind + big blind + stated ante. Do not assume an ante absent from the source. Sample levels 6, 10, 14 and 18. At least 18 levels are required. Growth denominator D = O10/O6 + O14/O10 + O18/O14.

Effective chips = starting stack + add-on chips. Find the last level whose orbit cost fits within effective chips. Playable depth T is the sum of all level minutes through that level. A per-level duration overrides the scheduled duration change, which overrides base minutes. Breaks are not playing minutes. Base depth is also reported without add-on chips. A duration change beyond the playable-depth window does not change depth.

Raw score = T / D. Final score = raw score − jump penalty. Scan every consecutive transition from level 2 through the full supplied schedule, including transitions beyond the depth window. A jump is material when its additional orbit cost is at least 5% of effective chips. Of those material jumps, take the largest percentage rise over the previous orbit: strictly above 60% subtracts 4 points; strictly above 100% subtracts 8 points. Penalties are not cumulative. Exactly 60% has no penalty; exactly 100% has the 4-point penalty. No scoring math, weights, bands or jump rules were changed for v1.0; only editorial curve selection changes outside the engine.

## Curves and letters

| Curve | A | B | C | D | F |
| --- | --- | --- | --- | --- | --- |
| Weekly / Tier 1 | ≥48 | ≥40 | ≥32 | ≥24 | <24 |
| Series / Tier 2 | ≥85 | ≥65 | ≥50 | ≥38 | <38 |

Each non-F band splits into equal thirds for minus, plain and plus. A modifier span ends at 56 for Weekly and 105 for Series; these are not score caps. F has no modifier. Letter selection uses the unrounded numeric score. Display rounding does not change band placement.

## Buy-in accounting

buyin_parts stores total, prize_pool (per-entry contribution), fee, addons [{cost, chips, fee}], reentry_rules, guarantee, actual_prize_pool, entries and unique_players. Unknown values remain null, never invented zeroes. When total and fee are supplied and total ≥ fee, omitted prize_pool is total − fee. When both components are supplied, total is their sum; discrepancies above $1 are rejected. Add-on cost and chips are separate: only chips affect structural depth. Reentries and unique players are distinct counts. Guarantee is an advertised minimum; actual_prize_pool is the observed final total and must not be confused with per-entry contribution.

Entry vig = fee / total × 100. Engine effective vig = fee / (total + add-on cost) × 100. Separately declared add-on fees must be disclosed in accounting, not silently injected into the preserved engine. Fees/vig, guarantees and field size do not alter numeric score because this metric measures time and blind progression, not a complete economic evaluation. They must be reported alongside it for informed comparison.

## Versioning, publication and audit

methodology_version is v1.0. Legacy tsr-2026.10-curve-by-type is accepted and normalized to v1.0. Retain original score, grade, curve, status, inputs, source, reason, actor and timestamp for every revision. Stored records without a full structure are labeled stored-score reletterings; they cannot establish a fresh numeric recomputation. The staged 17-record comparison is a review artifact, not permission to alter production. Resolve duplicate identities before superseding any record; preserve history and public substantive correction notes.

Automated output is labeled Data-Based Structure Analysis, with no attendance claim. Sham’s Take is separate firsthand commentary requiring verified played/attended/observed experience, publisher approval metadata and reviewed edited text. Experience ratings never feed the score.
