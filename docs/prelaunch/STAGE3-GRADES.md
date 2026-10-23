# Stage 3: Additive grade model

Existing fields remain, including type, buyin, score, tier, grade, base, calculator hash, and custom fields. Shared database helper uses MONGODB_DB, default tsrcms. Tests point this helper only at mongodb-memory-server.

New fields:

- event_type: weekly, series, major, or unknown. Explicit valid value wins, then legacy type weekly/series, otherwise unknown. Price never classifies an event.
- curve: weekly (Tier 1), series_under_400 (Tier 2: strictly sub-$400 single-day series), or series (Tier 3: $400+, multi-day series and major); null for unknown. Methodology v1.1 uses a D− floor on every curve; multi_day is stored as a boolean.
- buyin_parts: total, prize_pool, fee, addons [{cost,chips,fee}], reentry_rules, guarantee, actual_prize_pool, entries, unique_players. Missing numeric values and reentry_rules are null; missing addons is an empty list. Legacy buyin supplies total only. Numeric values must be finite and nonnegative. When pool and fee are both known their sum becomes total; an explicit total must match within $1.
- methodology_version: tsr-2026.10-curve-by-type.
- status: published, draft, needs_review, retracted, superseded. Unknown event types force needs_review with a review_reason and null grade/base/tier.
- superseded_by: id or null; review_reason: string or null.
- history: entries {at, by, change, previous:{score,grade,tier,curve,methodology_version,status}}. The server retains history and appends on document change. Repeated identical normalization does not append.
- score_source: engine if recalculated, otherwise stored.

assets/tsr-engine.js is copied verbatim from the extracted engine. No weights, thresholds, penalties, or depth formula changed. lib/grading re-runs engine.grade when inputs or a calculator URL fragment are supplied. Invalid supplied inputs fail rather than silently trusting score. Otherwise a finite stored score is retained. Letter/base/tier always come from event curve and engine.letterFor; client letters/tier/base are ignored. Score retains engine precision. 73 becomes A+ weekly and B series.

POST merges existing fields, normalizes server-side, and appends history. Public GET returns published and legacy documents lacking status; authenticated `?include=all` returns every status. DELETE retains a document as retracted and records history. Unknown types still require classification before any letter can be assigned. Empty public queries return an empty list; database failure retains the existing seed fallback.

Migration defaults to dry-run, producing the before/after table without writes. A file-only dry run needs no database connection:

```sh
node scripts/migrate-grades-v2.js --dry-run --backup tests/fixtures/grades.json
```

For a separately authorized preview database (not run in this task):

```sh
node scripts/migrate-grades-v2.js --db-uri-env PREVIEW_MONGODB_URI --confirm-preview --db tsrcms_preview
node scripts/migrate-grades-v2.js --apply --db-uri-env PREVIEW_MONGODB_URI --confirm-preview --db tsrcms_preview
node scripts/seed-preview-from-backup.js --folder /path/to/ejson --db-uri-env PREVIEW_MONGODB_URI --confirm-preview --db tsrcms_preview
```

Both database scripts accept only PREVIEW_MONGODB_URI, reject MONGODB_URI, require --confirm-preview, and refuse target tsrcms. If MONGODB_DB or the URI database is tsrcms, an explicit `--allow-db=tsrcms_preview` matching the non-production target is also required. Never supply production credentials. Seeding reads grades/articles/pages .json or .ejson files containing EJSON arrays, collection wrappers, individual documents, or newline-delimited EJSON. It upserts by _id or collection natural key.

Migration is idempotent, preserves existing fields, and appends history only for changed documents. Bigger One entries are listed as “duplicate candidates — Sham decision D8”; none are auto-retracted or superseded. Missing event types become needs_review under the universal classification rule.

Tests use the 17-document public export copied to tests/fixtures/grades.json. No migration apply or seed was run against an external database. The sandbox denies local socket binding, so the memory-server integration tests remain blocked here; rerun npm test in a Node 24 environment permitting loopback sockets with an existing mongod binary.
