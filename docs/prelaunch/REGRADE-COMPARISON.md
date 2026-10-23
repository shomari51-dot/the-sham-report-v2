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

## The Bigger One duplicate cluster

- g-the-bigger-one-250k-gtd: weekly, Saturdays, $300, stored 78.4; full hash.
- g-the-bigger-one: missing type, $300, stored 78.4; identical blind schedule and price/stack/duration inputs to the weekly record, but missing frequency metadata. Strong duplicate candidate, not a second verified event. Hold for classification and identity confirmation.
- g-even-bigger-one-250k-gtd: series, $300, stored 73.0, no hash. Similar title/guarantee alone does not establish duplicate identity; retain separately pending official sheet/date verification.

Do not merge, delete or supersede automatically. Verify source, series name, event number, dates, format and structure. Choose canonical ID only after publisher review and preserve superseded_by plus audit history. Stored-score records are relettered, not newly structure-verified.
