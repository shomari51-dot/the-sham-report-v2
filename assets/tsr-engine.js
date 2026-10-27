(function(root){
"use strict";
function fmtNum(n){return Number(n).toLocaleString("en-US");}
  var CFG = {
    // The score samples these four levels (1-indexed).
    SAMPLE: [6, 10, 14, 18],
    // Spoofing guard thresholds, as a percentage increase in Orbit Cost
    // over the previous level.
    JUMP_WARN: 60,   // > 60%  -> -4
    JUMP_HARD: 100,  // > 100% -> -8
    PENALTY_WARN: 4,
    PENALTY_HARD: 8,
    // First transition the jump detector examines. 2 means "compare
    // level 2 against level 1", i.e. read every level, per spec.
    JUMP_SCAN_FROM_LEVEL: 2,
    // A jump only counts once the extra it costs per orbit is at least
    // this share of the starting stack.
    //
    // Without it the detector measured almost nothing but the opening
    // level. Blind steps are quantised by the chips on the table - there
    // is no denomination between 100 and 200 - so the first two or three
    // transitions are forced into 67-100% rises that take well under 2%
    // of a stack. Every one of the five reference structures, the A and
    // the lowest grade alike, had its largest "jump" at level 2 for that reason, so
    // the flag separated nothing and cost honest structures 4 points.
    // Materiality is what the guard was always reaching for: a spike
    // matters when it shortens the event, and one that takes 1% of your
    // stack does not.
    JUMP_MATERIAL_PCT: 5,
    // Tier split on total advertised buy-in (fees included), in dollars.
    SERIES_SPLIT: 400,
    TIER_SPLIT: 400
  };

  // Grade bands per tier. `max` on the top band is not a ceiling on the
  // score, only the span used to place the +/- modifier.
  var BANDS = {
    1: [{g:"A",min:48,max:56,cuts:[50.67,53.34]}, {g:"B",min:40,max:48,cuts:[42.67,45.34]}, {g:"C",min:32,max:40,cuts:[34.67,37.34]}, {g:"D",min:-Infinity,max:32,cuts:[24,28]}],
    2: [{g:"A",min:55,max:67,cuts:[59,63]}, {g:"B",min:44,max:55,cuts:[47.67,51.34]}, {g:"C",min:34,max:44,cuts:[37.34,40.67]}, {g:"D",min:-Infinity,max:34,cuts:[25,30]}],
    3: [{g:"A",min:85,max:105,cuts:[91.67,98.34]}, {g:"B",min:65,max:85,cuts:[71.67,78.34]}, {g:"C",min:50,max:65,cuts:[55,60]}, {g:"D",min:-Infinity,max:50,cuts:[40,45]}]
  };
  BANDS.weekly=BANDS[1];
  BANDS.series_under_400=BANDS.series_sub400=BANDS[2];
  BANDS.series=BANDS.major=BANDS[3];
  var GRADE_COLOR = { A:"var(--g-a)", B:"var(--g-b)", C:"var(--g-c)", D:"var(--g-d)" };
  function resolveCurve(doc) {
    var type=doc.event_type || doc.curve || 'unknown';
    var total=doc.buyin_parts ? doc.buyin_parts.total : doc.buyin;
    if(type==='weekly') return {curve:'weekly',tier:1};
    if(type==='major') return {curve:'series',tier:3};
    if(type==='series' || type==='series_under_400' || type==='series_sub400') {
      var middle=doc.multi_day!==true && (total!=null ? total<CFG.SERIES_SPLIT : doc.curve==='series_under_400');
      return {curve:middle?'series_under_400':'series',tier:middle?2:3};
    }
    return {curve:null,tier:null,status:'needs_review',editorial_status:'Needs Verification'};
  }

  /**
   * Parse a pasted blind structure into levels.
   * Accepts "SB / BB / Ante", "SB BB Ante", "SB,BB,Ante", with or
   * without a leading level number, with or without thousands commas.
   */
  function parseStructure(text) {
    var rows = [];
    var bad = [];
    var lines = String(text || "").split(/\r?\n/);

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      if (/(^|[\s/,])[-−]\s*\d/.test(line)) { bad.push(line); continue; }
      if (/break|colou?r\s*up|registration\s*closes/i.test(line)) continue;

      // 1,000 -> 1000 so thousands separators don't split into tokens.
      var nums = line.replace(/(\d),(?=\d{3}\b)/g, "$1").match(/\d+(?:\.\d+)?/g);
      if (!nums || nums.length < 2) { bad.push(line); continue; }
      rows.push(nums.map(Number));
    }

    // If every row opens with its own 1-based position, that column is a
    // level number pasted from a structure sheet — drop it.
    var hasIndex = rows.length > 0 && rows.every(function (r, i) {
      return r.length >= 3 && r[0] === i + 1;
    });
    if (hasIndex) rows = rows.map(function (r) { return r.slice(1); });

    // Structure sheets usually carry the level length in its own column,
    // right after the level number. Left in place it reads as the small
    // blind, so every orbit cost comes out wrong while still looking
    // entirely plausible. Recognise that column and drop it too.
    var lengthCol = rows.length > 1 && rows.every(function (r) {
      return r.length >= 4 && r[0] >= 3 && r[0] <= 180;
    });
    if (lengthCol) {
      var maxLen = 0, minSb = Infinity, rising = true;
      for (var k = 0; k < rows.length; k++) {
        if (rows[k][0] > maxLen) maxLen = rows[k][0];
        if (rows[k][1] < minSb) minSb = rows[k][1];
        if (k > 0 && rows[k][2] < rows[k - 1][2]) rising = false;
      }
      // A level length sits below the smallest small blind and, unlike a
      // blind, does not climb through the structure. Both must hold.
      lengthCol = maxLen < minSb && rising;
    }
    if (lengthCol) rows = rows.map(function (r) { return r.slice(1); });

    // An optional 4th column is that level's length in minutes. Only
    // trust it when every row carries one and they all look like a
    // plausible duration — otherwise it is an ante we would be misreading.
    var perLevelMins = rows.length > 0 && rows.every(function (r) {
      return r.length === 4 && r[3] >= 3 && r[3] <= 180;
    });

    var levels = rows.map(function (r, i) {
      var sb = r[0], bb = r[1], ante = r.length > 2 ? r[2] : 0;
      return {
        level: i + 1, sb: sb, bb: bb, ante: ante, orbit: sb + bb + ante,
        mins: perLevelMins ? r[3] : 0
      };
    });

    return {
      levels: levels, unparsed: bad,
      perLevelMins: perLevelMins, droppedLengthCol: lengthCol
    };
  }

  /**
   * The ante a level carries under the shorthand convention.
   * `from` is the 1-based level antes begin at.
   */
  function anteValue(bb, idx, mode, from) {
    if (mode === "none" || (idx + 1) < from) return 0;
    return mode === "half" ? Math.round(bb / 2) : bb;
  }

  /**
   * Parse "big blinds only" shorthand into the same level shape
   * parseStructure returns.
   *
   * Every real structure is two-thirds redundant: the small blind is
   * half the big blind and, under big-blind-ante, so is the ante. One
   * number per level therefore reconstructs the whole table, which is
   * what makes this usable on a phone. Because every level is still
   * built, the blind-jump scan reads the structure in full — nothing
   * about the grade is estimated or skipped.
   */
  function parseShorthand(text, anteMode, anteFrom) {
    var raw = String(text || "").replace(/(\d),(?=\d{3}\b)/g, "$1");
    var lines = raw.split(/\r?\n/);
    var kept = [];
    var bad = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      if (/(^|[\s/,])[-−]\s*\d/.test(line)) { bad.push(line); continue; }
      if (/break|colou?r\s*up|registration\s*closes/i.test(line)) continue;
      if (!/\d/.test(line)) { bad.push(line); continue; }
      kept.push(line);
    }

    // A token is either a lone big blind or an explicit "SB/BB" pair.
    // Rooms break the half-blind rule where the chips make it awkward -
    // TCH Dallas opens 100/100 and runs a 1000/1500 level - so the pair
    // form exists to state those exactly rather than approximate them.
    // Everything else stays one number per level, which is the point.
    var tokens = kept.join("\n").match(
      /\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?/g) || [];

    var levels = tokens.map(function (tok, k) {
      var bb, sb, explicit = false;
      var slash = tok.indexOf("/");
      if (slash !== -1) {
        sb = Number(tok.slice(0, slash));
        bb = Number(tok.slice(slash + 1));
        explicit = sb !== Math.round(bb / 2);
      } else {
        bb = Number(tok);
        sb = Math.round(bb / 2);
      }
      var ante = anteValue(bb, k, anteMode, anteFrom);
      return {
        level: k + 1, sb: sb, bb: bb, ante: ante,
        orbit: sb + bb + ante, mins: 0, sbExplicit: explicit
      };
    });

    return { levels: levels, unparsed: bad, perLevelMins: false };
  }

  /** Render one level as shorthand: a lone BB, or "SB/BB" when the small
      blind does not follow from it. */
  function shorthandToken(l) {
    return l.sb === Math.round(l.bb / 2) ? String(l.bb) : l.sb + "/" + l.bb;
  }

  /**
   * Can a full table be re-expressed as big blinds only? Returns the
   * matching ante settings, or null when the antes follow no convention
   * the selectors can state - in which case shorthand would silently
   * change the grade and the switch is refused.
   *
   * Small blinds are not checked here: any that break the half-blind
   * rule survive the trip as explicit "SB/BB" tokens.
   */
  function detectConvention(levels) {
    if (!levels.length) return { ante: "bb", from: 1 };
    var i;
    var first = -1;
    for (i = 0; i < levels.length; i++) {
      if (levels[i].ante > 0) { first = i; break; }
    }
    if (first === -1) return { ante: "none", from: 1 };
    if (first > 7) return null;  // outside the range the selector offers
    var mode;
    if (levels[first].ante === levels[first].bb) mode = "bb";
    else if (levels[first].ante === Math.round(levels[first].bb / 2)) mode = "half";
    else return null;
    for (i = first; i < levels.length; i++) {
      if (levels[i].ante !== anteValue(levels[i].bb, i, mode, first + 1)) return null;
    }
    return { ante: mode, from: first + 1 };
  }

  /** Run the full TSR grading on a parsed input set. */
  function grade(input) {
    var errs = [];
    var buyin = input.buyin, fees = input.fees, stack = input.stack;
    var levelLen = input.levelLen, levels = input.levels;

    if (!(buyin > 0)) errs.push("Enter the total buy-in — the advertised price, fees included.");
    if (!(fees >= 0)) errs.push("Enter total fees. Use 0 if the event genuinely has none.");
    if (buyin > 0 && fees >= buyin) errs.push("Fees ($" + fmtNum(fees) + ") cannot be the whole buy-in ($" + fmtNum(buyin) + "). Fees are the part of the buy-in that does not reach the prize pool.");
    if (!(stack > 0)) errs.push("Enter the starting stack in chips.");
    if (!levels.length) errs.push("Enter the blind structure, one level per line.");
    else if (levels.length < 18) {
      errs.push("The score samples levels 6, 10, 14 and 18, so it needs at least 18 levels. You entered " + levels.length + ".");
    }
    if (levels.length && levels.some(function (l) { return !(l.sb > 0) || !(l.bb > 0) || !(l.ante >= 0) || !(l.orbit > 0); })) {
      errs.push("Every level needs a small blind and a big blind greater than zero.");
    }
    if (input.len2 > 0 && !(input.len2From >= 2)) {
      errs.push("Say which level the new length starts at — it has to be level 2 or later.");
    }
    if (errs.length) return { ok: false, errors: errs };

    var O = levels.map(function (l) { return l.orbit; });
    var o6 = O[5], o10 = O[9], o14 = O[13], o18 = O[17];

    var denom = (o10 / o6) + (o14 / o10) + (o18 / o14);
    if (!(denom > 0) || !isFinite(denom)) {
      return { ok: false, errors: ["Levels 6, 10, 14 and 18 must all have a real orbit cost."] };
    }

    // Playable depth: the last level whose orbit cost still fits inside
    // the stack. An add-on buys chips, so it moves this — the add-on is
    // a structural input, not just a change to the fee.
    // Minutes for each level: an explicit 4th column wins, then a
    // scheduled change ("40 min from level 21"), then the base length.
    var len2 = input.len2 > 0 ? input.len2 : 0;
    var len2From = input.len2From > 0 ? input.len2From : 0;
    var minsAt = levels.map(function (l, i) {
      if (l.mins > 0) return l.mins;
      if (len2 > 0 && len2From > 0 && (i + 1) >= len2From) return len2;
      return levelLen;
    });

    function depthFor(chips) {
      var last = 0;
      for (var i = O.length - 1; i >= 0; i--) {
        if (O[i] <= chips) { last = i + 1; break; }
      }
      var mins = 0;
      for (var j = 0; j < last; j++) mins += minsAt[j];
      return { lastDeep: last, depthMin: mins };
    }

    var addonChips = input.addonChips > 0 ? input.addonChips : 0;
    var addonCost = input.addonCost > 0 ? input.addonCost : 0;
    var hasAddon = addonChips > 0 || addonCost > 0;

    var dBase = depthFor(stack);
    var dEff = depthFor(stack + addonChips);
    var lastDeep = dEff.lastDeep;
    var depthMin = dEff.depthMin;
    var raw = depthMin / denom;
    var rawBase = dBase.depthMin / denom;

    // Spoofing guard: read every level, not just the four samples.
    // Every transition is still examined - the scan is never truncated,
    // which is the whole point of it - but a rise is only counted once
    // it is material against the stack the player actually holds.
    var jumpStack = stack + addonChips;
    var maxJump = 0, maxJumpAt = null;
    for (var j = CFG.JUMP_SCAN_FROM_LEVEL - 1; j < O.length; j++) {
      if (!(O[j - 1] > 0)) continue;
      var costs = ((O[j] - O[j - 1]) / jumpStack) * 100;
      if (costs < CFG.JUMP_MATERIAL_PCT) continue;
      var pct = ((O[j] - O[j - 1]) / O[j - 1]) * 100;
      if (pct > maxJump) { maxJump = pct; maxJumpAt = j + 1; }
    }
    var penalty = 0;
    if (maxJump > CFG.JUMP_HARD) penalty = CFG.PENALTY_HARD;
    else if (maxJump > CFG.JUMP_WARN) penalty = CFG.PENALTY_WARN;

    var score = raw - penalty;
    var scoreBase = rawBase - penalty;
    var resolved = resolveCurve(input);
    var tier = resolved.tier;
    var g = tier ? letterFor(score, tier) : {letter:null,base:null};
    var gBase = tier ? letterFor(scoreBase, tier) : {letter:null,base:null};

    // Entry vig is fees over the advertised buy-in. Effective vig spreads
    // the same fees over everything the player actually hands over, since
    // the add-on adds prize pool without adding fee.
    var entryVig = (fees / buyin) * 100;
    var effVig = (fees / (buyin + addonCost)) * 100;

    return {
      ok: true,
      tier: tier,
      curve: resolved.curve,
      methodology_version: "v1.1",
      score: score,
      raw: raw,
      penalty: penalty,
      letter: g.letter,
      base: g.base,
      hasAddon: hasAddon,
      addonCost: addonCost,
      addonChips: addonChips,
      effStack: stack + addonChips,
      scoreBase: scoreBase,
      letterBase: gBase.letter,
      lastDeepBase: dBase.lastDeep,
      vig: effVig,
      entryVig: entryVig,
      lastDeep: lastDeep,
      depthMin: depthMin,
      minsAt: minsAt,
      // A speed change past the depth window cannot move the score, and
      // saying so out loud is better than letting it look ignored.
      len2: len2,
      len2From: len2From,
      len2OutsideWindow: len2 > 0 && len2From > lastDeep,
      maxJump: maxJump,
      maxJumpAt: maxJumpAt,
      smooth: maxJump <= CFG.JUMP_WARN,
      samples: { o6: o6, o10: o10, o14: o14, o18: o18 },
      denom: denom,
      levelCount: levels.length
    };
  }

  /** Methodology v1.1: explicit inclusive letter thresholds; D− is the floor. */
  function letterFor(score, curveOrTier) {
    var bands=BANDS[curveOrTier];
    if(!bands) throw new TypeError("Unknown grading curve");
    for(var i=0;i<bands.length;i++) {
      var b=bands[i];
      if(score>=b.min) return {letter:b.g+(score<b.cuts[0]?"−":score<b.cuts[1]?"":"+"),base:b.g};
    }
    return {letter:"D−",base:"D"};
  }


const api={VERSION:"v1.1",CFG,BANDS,GRADE_COLOR,resolveCurve,parseStructure,grade,letterFor}; if(typeof module!=="undefined") module.exports=api; else root.TSREngine=api;
})(typeof window!=="undefined"?window:globalThis);
