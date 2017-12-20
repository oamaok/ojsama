// this is free and unencumbered software released into the public
// domain. refer to the attached UNLICENSE or http://unlicense.org/
//
// [![Build Status](
// https://travis-ci.org/Francesco149/ojsama.svg?branch=master)](
// https://travis-ci.org/Francesco149/ojsama)
//
// pure javascript implementation of
// https://github.com/Francesco149/oppai-ng intended to be easier
// to use and set up for js developers as well as more portable
// than straight up bindings at the cost of some performance
//
// installation:
// ----------------------------------------------------------------
// since this is a single-file library, you can just drop the file
// into your project:
// ```sh
// cd my/project
// curl https://waa.ai/ojsama > ojsama.js
// ```
//
// or include it directly in a html page:
// ```html
// <script type="text/javascript" src="ojsama.min.js"></script>
// ```
//
// it's also available as a npm package:
// ```sh
// npm install ojsama
// ```
//
// you can find full documentation of the code at
// http://hnng.moe/stuff/ojsama.html or simply read ojsama.js
//
// usage (nodejs):
// ----------------------------------------------------------------
// (change ./ojsama to ojsama if you installed through npm)
//
// ```js
// var readline = require("readline");
// var osu = require("./ojsama");
//
// var parser = new osu.parser();
// readline.createInterface({
//     input: process.stdin, terminal: falsei
// })
// .on("line", parser.feed_line.bind(parser))
// .on("close", function() {
//     console.log(osu.ppv2({map: parser.map}).toString());
// });
// ```
//
// ```sh
// $ curl https://osu.ppy.sh/osu/67079 | node minexample.js
// 133.24 pp (36.23 aim, 40.61 speed, 54.42 acc)
// ```
//
// advanced usage (nodejs with acc, mods, combo...):
// ----------------------------------------------------------------
// ```js
// var readline = require("readline");
// var osu = require("./ojsama");
//
// var mods = osu.MOD_CONSTANTS.none;
// var accuracyPercent;
// var combo;
// var missCount;
//
// // get mods, acc, combo, misses from command line arguments
// // format: +HDDT 95% 300x 1m
// var argv = process.argv;
//
// for (var i = 2; i < argv.length; ++i)
// {
//     if (argv[i].startsWith("+")) {
//         mods = osu.MOD_CONSTANTS.from_string(argv[i].slice(1) || "");
//     }
//
//     else if (argv[i].endsWith("%")) {
//         accuracyPercent = parseFloat(argv[i]);
//     }
//
//     else if (argv[i].endsWith("x")) {
//         combo = parseInt(argv[i]);
//     }
//
//     else if (argv[i].endsWith("m")) {
//         missCount = parseInt(argv[i]);
//     }
// }
//
// var parser = new osu.parser();
// readline.createInterface({
//   input: process.stdin, terminal: false
// })
// .on("line", parser.feed_line.bind(parser))
// .on("close", function() {
//     var map = parser.map;
//     console.log(map.toString());
//
//     if (mods) {
//         console.log("+" + osu.MOD_CONSTANTS.string(mods));
//     }
//
//     var stars = new osu.diff().calc({map: map, mods: mods});
//     console.log(stars.toString());
//
//     var pp = osu.ppv2({
//         stars: stars,
//         combo: combo,
//         missCount: missCount,
//         accuracyPercent: accuracyPercent,
//     });
//
//     var maxCombo = map.maxCombo();
//     combo = combo || maxCombo;
//
//     console.log(pp.computed_accuracy.toString());
//     console.log(combo + "/" + maxCombo + "x");
//
//     console.log(pp.toString());
// });
// ```
//
// ```sh
// $ curl https://osu.ppy.sh/osu/67079 | node example.js
// TERRA - Tenjou no Hoshi ~Reimeiki~ [BMax] mapped by ouranhshc
//
// AR5 OD8 CS4 HP8
// 262 circles, 69 sliders, 5 spinners
// 469 max combo
//
// 4.33 stars (2.09 aim, 2.19 speed)
// 100.00% 0x100 0x50 0xmiss
// 469/469x
// 133.24 pp (36.23 aim, 40.61 speed, 54.42 acc)
//
// $ curl https://osu.ppy.sh/osu/67079 \
// | node example.js +HDDT 98% 400x 1m
// ...
// +HDDT
// 6.13 stars (2.92 aim, 3.11 speed)
// 97.92% 9x100 0x50 1xmiss
// 400/469x
// 266.01 pp (99.70 aim, 101.68 speed, 60.41 acc)
// ```
//
// usage (in the browser)
// ----------------------------------------------------------------
// ```html
// <!DOCTYPE html>
// <html>
// <head>
//   <meta charset="utf-8" />
//   <script type="text/javascript" src="ojsama.min.js"></script>
//   <script type="text/javascript">
//   function load_file()
//   {
//       var frame = document.getElementById("osufile");
//       var contents = frame.contentWindow
//           .document.body.childNodes[0].innerHTML;
//
//       var parser = new osu.parser().feed(contents);
//       console.log(parser.toString());
//
//       var str = parser.map.toString();
//       str += osu.ppv2({map: parser.map}).toString();
//
//       document.getElementById("result").innerHTML = str;
//   }
//   </script>
// </head>
// <body>
//   <iframe id="osufile" src="test.osu" onload="load_file();"
//     style="display: none;">
//   </iframe>
//   <blockquote><pre id="result">calculating...</pre></blockquote>
// </body>
// </html>
// ```
//
// (this example assumes you have a test.osu beatmap in the same
// directory)
//
// performance
// ----------------------------------------------------------------
// this is around 50-60% slower than the C implementation and uses
// ~10 times more memory.
// ```sh
// $ busybox time -v node --use_strict test.js
// ...
// User time (seconds): 16.58
// System time (seconds): 0.43
// Percent of CPU this job got: 101%
// Elapsed (wall clock) time (h:mm:ss or m:ss): 0m 16.70s
// ...
// Maximum resident set size (kbytes): 314080
// Minor (reclaiming a frame) page faults: 20928
// Voluntary context switches: 72138
// Involuntary context switches: 16689
// ```

// # code documentation

// when used outside of node, a osu namespace will be exposed
// without polluting the global scope

let osu = {};

if (typeof exports !== 'undefined') {
  osu = exports;
}

(function () {
  osu.VERSION_MAJOR = 1;
  osu.VERSION_MINOR = 0;
  osu.VERSION_PATCH = 5;

  // internal utilities
  // ----------------------------------------------------------------

  // override console with nop when running in a browser

  let log = { warn: Function.prototype };

  if (typeof exports !== 'undefined') {
    log = console;
  }

  const arrayToFixed = (arr, n) => arr.map(a => a.toFixed(n));

  // timing point
  // ----------------------------------------------------------------
  // defines parameters such as timing and sampleset for an interval.
  // for pp calculation we only need time and msPerBeat
  //
  // it can inherit from its preceeding point by having
  // change = false and setting msPerBeat to a negative value which
  // represents the bpm multiplier as ```-100 * bpm_multiplier```

  class Timing {
    constructor({ time = 0.0, msPerBeat = 600.0, change = true }) {
      this.time = time;
      this.msPerBeat = msPerBeat;
      this.change = change;
    }

    toString() {
      return JSON.stringify({
        time: this.time.toFixed(2),
        msPerBeat: this.msPerBeat.toFixed(2),
      });
    }
  }

  // hit objects
  // ----------------------------------------------------------------
  // partial structure of osu! hitobjects with just enough data for
  // pp calculation

  // bitmask constants for object types. note that the type can
  // contain other flags so you should always check type with
  // ```if (type & objectTypes.circle) { ... }```

  const objectTypes = {
    circle: 1 << 0,
    slider: 1 << 1,
    spinner: 1 << 3,
  };

  // all we need from circles is their position. all positions
  // stored in the objects are in playfield coordinates (512*384
  // rect)

  class Circle {
    constructor({ pos = [0, 0] }) {
      this.pos = pos;
    }

    toString() {
      return JSON.stringify({
        pos: this.pos.map(p => p.toFixed(2)),
      });
    }
  }

  // to calculate max combo we need to compute slider ticks
  //
  // the beatmap stores the distance travelled in one repetition and
  // the number of repetitions. this is enough to calculate distance
  // per tick using timing information and slider velocity.
  //
  // note that 1 repetition means no repeats (1 loop)

  class Slider {
    constructor({ pos = [0, 0], distance = 0.0, repetitions = 1 }) {
      this.pos = pos;
      this.distance = distance;
      this.repetitions = repetitions;
    }


    toString() {
      const { pos, distance, repetitions } = this;

      return JSON.stringify({
        pos: pos.map(p => p.toFixed(2)),
        distance: distance.toFixed(2),
        repetitions,
      });
    }
  }

  // generic hitobject
  //
  // the only common property is start time (in millisecond).
  // object-specific properties are stored in data, which can be
  // an instance of circle, slider, or null

  class HitObject {
    constructor({ time = 0.0, type = 0, data = null }) {
      this.time = time;
      this.type = type;
      this.data = data;
    }

    typeString() {
      // TODO
    }

    toString() {
      // TODO
    }
  }

  /*
  hitobject.prototype.typestr = function () {
    let res = '';
    if (this.type & objectTypes.circle) res += 'circle | ';
    if (this.type & objectTypes.slider) res += 'slider | ';
    if (this.type & objectTypes.spinner) res += 'spinner | ';
    return res.substring(0, Math.max(0, res.length - 3));
  };

  hitobject.prototype.toString = function () {
    return `{ time: ${this.time.toFixed(2)}, ` +
        `type: ${this.typestr()
        }${this.data ? `, ${this.data.toString()}` : ''
        } }`;
  };
  */

  // beatmap
  // ----------------------------------------------------------------

  // gamemode constants

  const modes = {
    std: 0,
  };

  // partial beatmap structure with just enough data for pp
  // calculation

  class Beatmap {
    constructor() {
      this.reset();
    }

    reset() {
      this.formatVersion = 1;

      this.mode = modes.std;

      this.title = '';
      this.titleUnicode = '';
      this.artist = '';
      this.artistUnicode = '';
      this.creator = '';
      this.version = '';

      this.cs = 5.0;
      this.ar = 5.0;
      this.od = 5.0;
      this.hp = 5.0;

      this.sv = 1.0;
      this.tickRate = 1.0;

      this.circleCount = 0;
      this.sliderCount = 0;
      this.spinnerCount = 0;

      this.objects = [];

      this.timingPoints = [];

      return this;
    }


    // max combo calculation
    //
    // this is given by circleCount + spinnerCount + sliderCount * 2
    // (heads and tails) + nsliderticks
    //
    // we approximate slider ticks by calculating the
    // playfield pixels per beat for the current section
    // and dividing the total distance travelled by
    // pixels per beat. this gives us the number of beats,
    // which multiplied by the tick rate gives use the
    // tick count.
    maxCombo() {
      let res = this.circleCount + this.spinnerCount;
      let tindex = -1;
      let tnext = Number.NEGATIVE_INFINITY;
      let pixelsPerBeat = 0.0;

      this.objects
        .filter(object => object.type & objectTypes.slider)
        .forEach((object) => {
        // keep track of the current timing point without
        // looping through all of them for every object

          while (object.time >= tnext) {
            ++tindex;

            if (this.timingPoints.length > tindex + 1) {
              tnext = this.timingPoints[tindex + 1].time;
            } else {
              tnext = Number.POSITIVE_INFINITY;
            }

            const t = this.timingPoints[tindex];

            let svMultiplier = 1.0;

            if (!t.change && t.msPerBeat < 0) {
              svMultiplier = -100.0 / t.msPerBeat;
            }

            // beatmaps older than format v8 don't apply
            // the bpm multiplier to slider ticks

            if (this.formatVersion < 8) {
              pixelsPerBeat = this.sv * 100.0;
            } else {
              pixelsPerBeat = this.sv * 100.0 * svMultiplier;
            }
          }

          const sl = object.data;

          const beatCount =
              (sl.distance * sl.repetitions) / pixelsPerBeat;

          // subtract an epsilon to prevent accidental
          // ceiling of whole values such as 2.00....1 -> 3 due
          // to rounding errors

          let ticks = Math.ceil((beatCount - 0.1) / sl.repetitions * this.tickRate) - 1;

          ticks *= sl.repetitions;
          ticks += sl.repetitions + 1;

          res += Math.max(0, ticks);
        });


      return res;
    }

    toString() {
      // TODO
    }
  }

  /*
  beatmap.prototype.toString = function () {
    let res = `${this.artist} - ${this.title} [`;

    if (this.titleUnicode || this.artistUnicode) {
      res += `(${this.artistUnicode} - ${
        this.titleUnicode})`;
    }

    res += `${this.version}] mapped by ${this.creator}\n`
        + '\n'
        + `AR${parseFloat(this.ar.toFixed(2))} `
        + `OD${parseFloat(this.od.toFixed(2))} `
        + `CS${parseFloat(this.cs.toFixed(2))} `
        + `HP${parseFloat(this.hp.toFixed(2))}\n${
          this.circleCount} circles, ${
          this.sliderCount} sliders, ${
          this.spinnerCount} spinners` + `\n${
        this.maxCombo()} max combo` + '\n';

    return res;
  };
  */

  // beatmap parser
  // ----------------------------------------------------------------

  // this is supposed to be the format's magic string, however .osu
  // files with random spaces or a BOM before this have been found
  // in the wild so in practice we still have to trim the first line

  const OSU_MAGIC_REGEX = /^osu file format v(\d+)$/;

  // partial .osu file parser built around pp calculation


  Beatmap.parse = (file) => {
    const commentFilter = line => !!line.match(/^(\/\/|[ _])/);

    const lines = file.split('\n')
      // Filter out comments
      .filter(commentFilter)
      .map(line => line.trim())
      // Filter out empty lines
      .filter(line => line.length);

    const map = new Beatmap();

    const parseKeyValuePair = (line) => {
      const match = line.match(/^([^:]+)\s*:\s*(.+)$/);

      if (!match) return {};

      const [, key, value] = match;
      return { key, value };
    };

    const metaToPropMap = {
      Title: 'title',
      TitleUnicode: 'titleUnicode',
      Artist: 'artist',
      ArtistUnicode: 'artistUnicode',
      Creator: 'creator',
      Version: 'version',
      Mode: 'mode',
    };

    const parseMetadata = (line) => {
      const { key, value } = parseKeyValuePair(line);

      const prop = metaToPropMap[key];

      if (prop) {
        map[prop] = value;
      }
    };

    const diffToPropMap = {
      CircleSize: 'cs',
      OverallDifficulty: 'od',
      ApproachRate: 'ar',
      HPDrainRate: 'hp',
      SliderMultiplier: 'sv',
      SliderTickRate: 'tickRate',
    };

    const parseDifficulty = (line) => {
      const { key, value } = diffToPropMap(line);

      const prop = metaToPropMap[key];

      if (prop) {
        map[prop] = parseFloat(value);
      }
    };

    const parseTimingPoints = (line) => {
      const [time, msPerBeat, ...rest] = line.split(',').map(v => v.trim());

      const timing = new Timing({
        time: parseFloat(time),
        msPerBeat: parseFloat(msPerBeat),
      });

      if (rest.length >= 5) {
        timing.change = rest[4] !== '0';
      }

      map.timingPoints.push(timing);
    };

    const parseHitObjects = (line) => {
      const [posX, posY, time, type, ,,, repetitions, distance] = line.split(',');

      const obj = new HitObject({
        time: parseFloat(time),
        type: parseInt(type, 10),
      });

      const pos = [parseFloat(posX), parseFloat(posY)];

      if (obj.type & objectTypes.circle) {
        ++this.map.circleCount;
        obj.data = new Circle({ pos });
      } else if (obj.type & osu.objectTypes.spinner) {
        ++this.map.spinnerCount;
      } else if (obj.type & osu.objectTypes.slider) {
        ++this.map.sliderCount;
        obj.data = new Slider({
          pos,
          repetitions: parseInt(repetitions, 10),
          distance: parseFloat(distance),
        });
      }

      this.map.objects.push(obj);
    };

    const sectionParsers = {
      Metadata: parseMetadata,
      General: parseMetadata,
      Difficulty: parseDifficulty,
      TimingPoints: parseTimingPoints,
      HitObjects: parseHitObjects,
    };

    let currentSection;

    lines.forEach((line, index) => {
      if (index === 0) {
        const match = line.match(OSU_MAGIC_REGEX);
        if (match) {
          throw new SyntaxError('Invalid .osu file!');
        }

        [, map.formatVersion] = match;

        return;
      }

      const sectionMatch = line.match(/^\[([^\]]+)\]$/);

      if (sectionMatch) {
        [, currentSection] = sectionMatch;
        return;
      }

      (sectionParsers[currentSection] || (() => {}))(line);
    });

    return map;
  };


  // difficulty calculation
  // ----------------------------------------------------------------

  // mods bitmask constants
  // NOTE: td is touch device, but it's also the value for the
  // legacy no video mod

  const MOD_CONSTANTS = {
    NOMOD: 0,
    NF: 1 << 0,
    EZ: 1 << 1,
    TD: 1 << 2,
    HD: 1 << 3,
    HR: 1 << 4,
    DT: 1 << 6,
    HT: 1 << 8,
    NC: 1 << 9,
    FL: 1 << 10,
    SO: 1 << 12,
  };

  // construct the mods bitmask from a string such as "HDHR"
  MOD_CONSTANTS.fromString = (str) => {
    if (str.toUpperCase() === 'NOMOD') {
      return MOD_CONSTANTS.NOMOD;
    }

    const abbrevs = str.toUpperCase().match(/(\w{2})/g);

    return abbrevs.reduce((mask, abbrev) => mask | (MOD_CONSTANTS[abbrev] || 0), 0);
  };

  // convert mods bitmask into a string, such as "HDHR"
  MOD_CONSTANTS.string = mods => Object.keys(MOD_CONSTANTS)
    .reduce((str, key) => str + (MOD_CONSTANTS[key] & mods ? key : ''), '');

  MOD_CONSTANTS.speedChanging = MOD_CONSTANTS.DT | MOD_CONSTANTS.HT | MOD_CONSTANTS.NC;
  MOD_CONSTANTS.mapChanging = MOD_CONSTANTS.HR | MOD_CONSTANTS.EZ | MOD_CONSTANTS.speedChanging;

  // _(internal)_
  // osu!standard stats constants

  const OD0_MS = 79.5;
  const OD10_MS = 19.5;
  const AR0_MS = 1800.0;
  const AR5_MS = 1200.0;
  const AR10_MS = 450.0;

  const OD_MS_STEP = (OD0_MS - OD10_MS) / 10.0;
  const AR_MS_STEP1 = (AR0_MS - AR5_MS) / 5.0;
  const AR_MS_STEP2 = (AR5_MS - AR10_MS) / 5.0;

  // _(internal)_
  // utility functions to apply speed and flat multipliers to
  // stats where speed changes apply (ar and od)

  function recalculateApproachRate(baseAR, speedMultiplier, multiplier) {
    let ar = baseAR;
    ar *= multiplier;

    // convert AR into milliseconds window

    let arms = ar < 5.0 ?
      AR0_MS - AR_MS_STEP1 * ar
      : AR5_MS - AR_MS_STEP2 * (ar - 5.0);

    // stats must be capped to 0-10 before HT/DT which
    // brings them to a range of -4.42->11.08 for OD and
    // -5->11 for AR

    arms = Math.min(AR0_MS, Math.max(AR10_MS, arms));
    arms /= speedMultiplier;

    ar = arms > AR5_MS ?
      (AR0_MS - arms) / AR_MS_STEP1
      : 5.0 + (AR5_MS - arms) / AR_MS_STEP2;

    return ar;
  }

  function recalculateOverallDifficulty(baseOD, speedMultiplier, multiplier) {
    let od = baseOD;
    od *= multiplier;
    let odms = OD0_MS - Math.ceil(OD_MS_STEP * od);
    odms = Math.min(OD0_MS, Math.max(OD10_MS, odms));
    odms /= speedMultiplier;
    od = (OD0_MS - odms) / OD_MS_STEP;
    return od;
  }

  // stores osu!standard beatmap stats

  class StdBeatmapStats {
    constructor({
      ar,
      od,
      hp,
      cs,
    }) {
      this.ar = ar;
      this.od = od;
      this.hp = hp;
      this.cs = cs;
      this.speedMultiplier = 1.0;

      // previously calculated mod combinations are cached in a map

      this.precalculatedMods = {};
    }

    withMods(mods) {
      if (this.precalculatedMods[mods]) {
        return this.precalculatedMods[mods];
      }

      const stats = new StdBeatmapStats(this);
      this.precalculatedMods[mods] = stats;

      if (!(mods & MOD_CONSTANTS.mapChanging)) {
        return stats;
      }

      if (mods & (MOD_CONSTANTS.DT | MOD_CONSTANTS.NC)) { stats.speedMultiplier = 1.5; }

      if (mods & MOD_CONSTANTS.HT) { stats.speedMultiplier *= 0.75; }

      let mul = 1.0;
      if (mods & MOD_CONSTANTS.HR) mul = 1.4;
      if (mods & MOD_CONSTANTS.EZ) mul *= 0.5;

      if (stats.ar) {
        stats.ar = recalculateApproachRate(stats.ar, stats.speedMultiplier, mul);
      }

      if (stats.od) {
        stats.od = recalculateOverallDifficulty(stats.od, stats.speedMultiplier, mul);
      }

      if (stats.cs) {
        if (mods & MOD_CONSTANTS.HR) stats.cs *= 1.3;
        if (mods & MOD_CONSTANTS.EZ) stats.cs *= 0.5;
        stats.cs = Math.min(10.0, stats.cs);
      }

      if (stats.hp) {
        stats.hp *= mul;
        stats.hp = Math.min(10.0, stats.hp);
      }

      return stats;
    }
  }

  // osu! standard hit object with difficulty calculation values
  // obj is the underlying hitobject

  class StdDifficultyHitObject {
    constructor(obj) {
      this.obj = obj;
      this.strains = [0.0, 0.0];
      this.normpos = [0.0, 0.0];
      this.isSingle = false;
    }
  }
  // _(internal)_
  // 2D point operations

  function vec_sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function vec_mul(a, b) { return [a[0] * b[0], a[1] * b[1]]; }

  function vec_len(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
  }

  // _(internal)_
  // difficulty calculation constants

  const DIFF_SPEED = 0;
  const DIFF_AIM = 1;
  const ALMOST_DIAMETER = 90.0;
  const STREAM_SPACING = 110.0;
  const SINGLE_SPACING = 125.0;
  const DECAY_BASE = [0.3, 0.15];
  const WEIGHT_SCALING = [1400.0, 26.25];
  const DECAY_WEIGHT = 0.9;
  const STRAIN_STEP = 400.0;
  const CIRCLESIZE_BUFF_THRESHOLD = 30.0;
  const STAR_SCALING_FACTOR = 0.0675;
  const PLAYFIELD_SIZE = [512.0, 384.0];
  const PLAYFIELD_CENTER = vec_mul(PLAYFIELD_SIZE, [0.5, 0.5]);
  const EXTREME_SCALING_FACTOR = 0.5;

  // osu!standard difficulty calculator
  //
  // does not account for sliders because slider calculations are
  // expensive and not worth the small accuracy increase

  class StdDifficulty {
    constructor() {
    // difficulty hitobjects array

      this.objects = [];
      this.reset();

      // make some parameters persist so they can be
      // re-used in subsequent calls if no new value is specified

      this.map = null;
      this.mods = MOD_CONSTANTS.NOMOD;
      this.singletapThreshold = 125.0;
    }

    reset() {
    // star rating

      this.total = 0.0;
      this.aim = 0.0;
      this.speed = 0.0;

      // number of notes that are seen as singletaps by the
      // difficulty calculator

      this.nsingles = 0;

      // number of notes that are faster than the interval given
      // in calc(). these singletap statistic are not required in
      // star rating, but they are a free byproduct of the
      // calculation which could be useful

      this.nsingles_threshold = 0;
    }

    // calculate difficulty and return current instance, which
    // contains the results
    //
    // params:
    // * map: the beatmap we want to calculate difficulty for. if
    //   unspecified, it will default to the last map used
    //   in previous calls.
    // * mods: mods bitmask, defaults to MOD_CONSTANTS.NOMOD
    // * singletapThreshold: interval threshold in milliseconds
    //   for singletaps. defaults to 240 bpm 1/2 singletaps
    //   ```(60000 / 240) / 2``` .
    //   see nsingles_threshold

    calc(params) {
      const map = this.map = params.map || this.map;
      if (!map) {
        throw new TypeError('no map given');
      }

      const mods = this.mods = params.mods || this.mods;
      var singletapThreshold = this.singletapThreshold
        = params.singletapThreshold || singletapThreshold;

      // apply mods to the beatmap's stats

      const stats =
        new StdBeatmapStats({ cs: map.cs })
          .with_mods(mods);

      const speedMultiplier = stats.speedMultiplier;
      this._init_objects(this.objects, map, stats.cs);

      this.speed = this._calc_individual(DIFF_SPEED, this.objects, speedMultiplier);

      this.aim = this._calc_individual(DIFF_AIM, this.objects, speedMultiplier);

      this.speed = Math.sqrt(this.speed) * STAR_SCALING_FACTOR;
      this.aim = Math.sqrt(this.aim) * STAR_SCALING_FACTOR;
      if (mods & MOD_CONSTANTS.TD) {
        this.aim = Math.pow(this.aim, 0.8);
      }

      // total stars mixes speed and aim in such a way that
      // heavily aim or speed focused maps get a bonus

      this.total = this.aim + this.speed
        + Math.abs(this.speed - this.aim)
        * EXTREME_SCALING_FACTOR;

      // singletap stats

      this.nsingles = 0;
      this.nsingles_threshold = 0;

      for (let i = 1; i < this.objects.length; ++i) {
        const obj = this.objects[i].obj;
        const prev = this.objects[i - 1].obj;

        if (this.objects[i].isSingle) {
          ++this.nsingles;
        }

        if (!(obj.type & (objectTypes.circle | objectTypes.slider))) {
          continue;
        }

        const interval = (obj.time - prev.time) / speedMultiplier;

        if (interval >= singletapThreshold) {
          ++this.nsingles_threshold;
        }
      }

      return this;
    }

    toString() {
      return `${this.total.toFixed(2)} stars (${this.aim.toFixed(2)
      } aim, ${this.speed.toFixed(2)} speed)`;
    }


    // _(internal)_
    // calculate spacing weight for a difficulty type

    _spacing_weight(type, distance) {
      switch (type) {
        case DIFF_AIM:
          return Math.pow(distance, 0.99);

        case DIFF_SPEED:
          if (distance > SINGLE_SPACING) {
            return 2.5;
          } else if (distance > STREAM_SPACING) {
            return 1.6 + 0.9 * (distance - STREAM_SPACING) / (SINGLE_SPACING - STREAM_SPACING);
          } else if (distance > ALMOST_DIAMETER) {
            return 1.2 + 0.4 * (distance - ALMOST_DIAMETER) / (STREAM_SPACING - ALMOST_DIAMETER);
          } else if (distance > ALMOST_DIAMETER / 2.0) {
            return 0.95 + 0.25 * (distance - ALMOST_DIAMETER / 2.0) / (ALMOST_DIAMETER / 2.0);
          }

          return 0.95;
      }

      throw {
        name: 'NotImplementedError',
        message: 'this difficulty type does not exist',
      };
    }


    // _(internal)_
    // calculate a single strain and store it in the diffobj

    _calc_strain(
      type, diffobj,
      prev_diffobj, speedMultiplier,
    ) {
      const obj = diffobj.obj;
      const prev_obj = prev_diffobj.obj;

      let value = 0.0;
      const timeElapsed = (obj.time - prev_obj.time) / speedMultiplier;
      const decay = Math.pow(
        DECAY_BASE[type],
        timeElapsed / 1000.0,
      );

      if ((obj.type & (objectTypes.slider | objectTypes.circle)) != 0) {
        const distance = vec_len(vec_sub(diffobj.normpos, prev_diffobj.normpos));

        if (type == DIFF_SPEED) {
          diffobj.isSingle = distance > SINGLE_SPACING;
        }

        value = this._spacing_weight(type, distance);
        value *= WEIGHT_SCALING[type];
      }

      value /= Math.max(timeElapsed, 50.0);

      diffobj.strains[type]
        = prev_diffobj.strains[type] * decay + value;
    }

    // _(internal)_
    // calculate a specific type of difficulty
    //
    // the map is analyzed in chunks of STRAIN_STEP duration.
    // for each chunk the highest hitobject strains are added to
    // a list which is then collapsed into a weighted sum, much
    // like scores are weighted on a user's profile.
    //
    // for subsequent chunks, the initial max strain is calculated
    // by decaying the previous hitobject's strain until the
    // beginning of the new chunk

    _calc_individual(
      type, difficultyObjects,
      speedMultiplier,
    ) {
      const strains = [];
      const strainStep = STRAIN_STEP * speedMultiplier;
      let intervalEnd = strainStep;
      let maxStrain = 0.0;
      let i;

      for (i = 0; i < difficultyObjects.length; ++i) {
        if (i > 0) {
          this._calc_strain(
            type, difficultyObjects[i], difficultyObjects[i - 1],
            speedMultiplier,
          );
        }

        while (difficultyObjects[i].obj.time > intervalEnd) {
          strains.push(maxStrain);

          if (i > 0) {
            const decay = Math.pow(
              DECAY_BASE[type],
              (intervalEnd - difficultyObjects[i - 1].obj.time) / 1000.0,
            );

            maxStrain = difficultyObjects[i - 1].strains[type]
                    * decay;
          } else {
            maxStrain = 0.0;
          }

          intervalEnd += strainStep;
        }

        maxStrain
            = Math.max(maxStrain, difficultyObjects[i].strains[type]);
      }

      let weight = 1.0;
      let difficulty = 0.0;

      strains.SOrt((a, b) => b - a);

      for (i = 0; i < strains.length; ++i) {
        difficulty += strains[i] * weight;
        weight *= DECAY_WEIGHT;
      }

      return difficulty;
    }

    // _(internal)_
    // positions are normalized on circle radius so that we can
    // calc as if everything was the same circlesize.
    //
    // this creates a scaling vector that normalizes positions

    _normalizer_vector(circlesize) {
      const radius = (PLAYFIELD_SIZE[0] / 16.0)
        * (1.0 - 0.7 * (circlesize - 5.0) / 5.0);

      let scalingFactor = 52.0 / radius;

      // high circlesize (small circles) bonus

      if (radius < CIRCLESIZE_BUFF_THRESHOLD) {
        scalingFactor *= 1.0
            + Math.min(CIRCLESIZE_BUFF_THRESHOLD - radius, 5.0) / 50.0;
      }

      return [scalingFactor, scalingFactor];
    }

    // _(internal)_
    // initialize difficultyObjects (or reset if already initialized) and
    // populate it with the normalized position of the map's
    // objects

    _init_objects(
      difficultyObjects, map,
      circlesize,
    ) {
      if (difficultyObjects.length != map.objects.length) {
        difficultyObjects.length = map.objects.length;
      }

      const scalingVector = this._normalizer_vector(circlesize);
      const normalized_center
        = vec_mul(PLAYFIELD_CENTER, scalingVector);

      for (let i = 0; i < difficultyObjects.length; ++i) {
        if (!difficultyObjects[i]) {
          difficultyObjects[i] = new StdDifficultyHitObject(map.objects[i]);
        } else {
          difficultyObjects[i] = new StdDifficultyHitObject(difficultyObjects[i].obj);
        }

        const obj = difficultyObjects[i].obj;

        if (obj.type & objectTypes.spinner) {
          difficultyObjects[i].normpos = normalized_center.slice();
          continue;
        }

        var pos;

        if (obj.type & (objectTypes.slider | objectTypes.circle)) {
          pos = obj.data.pos;
        } else {
          log.warn(
            'unknown object type ',
            obj.type.toString(16),
          );

          pos = [0.0, 0.0];
        }

        difficultyObjects[i].normpos = vec_mul(pos, scalingVector);
      }
    }
  }
  // generic difficulty calculator that creates and uses
  // mode-specific calculators based on the map's mode field

  class Difficulty {
    constructor() {
    // calculators for different modes are cached for reuse within
    // this instance

      this.calculators = [];
      this.map = null;
    }

    // figures out what difficulty calculator to use based on the
    // beatmap's gamemode and calls it with params
    //
    // if no map is specified in params, the last map used in
    // previous calls will be used. this simplifies subsequent
    // calls for the same beatmap
    //
    // see gamemode-specific calculators above for params
    //
    // returns the chosen gamemode-specific difficulty calculator

    calc(params) {
      let calculator = null;
      const map = this.map = params.map || this.map;
      if (!map) {
        throw new TypeError('no map given');
      }

      if (!this.calculators[map.mode]) {
        switch (map.mode) {
          case modes.std:
            calculator = new StdDifficulty();
            break;

          default:
            throw {
              name: 'NotImplementedError',
              message: 'this gamemode is not yet supported',
            };
        }

        this.calculators[map.mode] = calculator;
      } else {
        calculator = this.calculators[map.mode];
      }

      return calculator.calc(params);
    }
  }
  // pp calculation
  // ----------------------------------------------------------------

  // osu!standard accuracy calculator
  //
  // if percent and objectCount are specified, n300, n100 and n50 will
  // be automatically calculated to be the closest to the given
  // acc percent

  class StdAccuracy {
    constructor({
      missCount = 0,
      n300 = -1,
      n100 = 0,
      n50 = 0,
      objectCount,
      percent,
    }) {
      this.missCount = missCount;
      this.n300 = n300;
      this.n100 = n100;
      this.n50 = n50;

      if (percent) {
        if (objectCount === undefined) {
          throw new TypeError('objectCount is required when specifying percent');
        }

        this.missCount = Math.min(objectCount, this.missCount);
        const max300 = objectCount - this.missCount;

        const maxAccuracy = new StdAccuracy({
          n300: max300, n100: 0, n50: 0, missCount: this.missCount,
        }).value() * 100.0;

        let accuracyPercent = percent;
        accuracyPercent = Math.max(0.0, Math.min(maxAccuracy, accuracyPercent));

        // just some black magic maths from wolfram alpha

        this.n100 = Math.round(-3.0 *
            ((accuracyPercent * 0.01 - 1.0) * objectCount + this.missCount) *
            0.5);

        if (this.n100 > max300) {
        // acc lower than all 100s, use 50s

          this.n100 = 0;

          this.n50 = Math.round(-6.0 *
                ((accuracyPercent * 0.01 - 1.0) * objectCount +
                    this.missCount) * 0.5);

          this.n50 = Math.min(max300, this.n50);
        }

        this.n300 = objectCount - this.n100 - this.n50 - this.missCount;
      }
    }


    // computes the accuracy value (0.0-1.0)
    //
    // if n300 was specified in the constructor, objectCount is not
    // required and will be automatically computed

    value(objectCount) {
      let n300 = this.n300;

      if (n300 < 0) {
        if (!objectCount) {
          throw new TypeError('either n300 or objectCount must be specified');
        }

        n300 = objectCount - this.n100 - this.n50 - this.missCount;
      } else {
        objectCount = n300 + this.n100 + this.n50 + this.missCount;
      }

      const res = (n300 * 300.0 + this.n100 * 100.0 + this.n50 * 50.0) / (objectCount * 300.0);

      return Math.max(0, Math.min(res, 1.0));
    }

    toString() {
      return `${(this.value() * 100.0).toFixed(2)}% ${
        this.n100}x100 ${this.n50}x50 ${
        this.missCount}xmiss`;
    }
  }

  // osu! standard ppv2 calculator

  class StdPPv2 {
    constructor() {
      this.aim = 0.0;
      this.speed = 0.0;
      this.acc = 0.0;

      // accuracy used in the last calc() call

      this.computed_accuracy = null;
    }

    // metaparams:
    // map, stars, accuracyPercent
    //
    // params:
    // aimStars, speedStars, maxCombo, sliderCount, circleCount,
    // objectCount, baseAR = 5, baseOD = 5, mode = modes.std,
    // mods = MOD_CONSTANTS.NOMOD, combo = maxCombo - missCount,
    // n300 = objectCount - n100 - n50 - missCount, n100 = 0, n50 = 0,
    // missCount = 0, scoreVersion = 1
    //
    // if stars is defined, map and mods are obtained from stars as
    // well as aimStars and speedStars
    //
    // if map is defined, maxCombo, sliderCount, circleCount, objectCount,
    // baseAR, baseOD will be obtained from this beatmap
    //
    // if map is defined and stars is not defined, a new difficulty
    // calculator will be created on the fly to compute stars for map
    //
    // if accuracyPercent is defined, n300, n100, n50 will be automatically
    // calculated to be as close as possible to this value

    calc(params) {
    // parameters handling

      let stars = params.stars;
      let map = params.map;
      let maxCombo,
        sliderCount,
        circleCount,
        objectCount,
        baseAR,
        baseOD;
      let mods;
      let aimStars,
        speedStars;

      if (stars) {
        map = stars.map;
      }

      if (map) {
        maxCombo = map.maxCombo();
        sliderCount = map.sliderCount;
        circleCount = map.circleCount;
        objectCount = map.objects.length;
        baseAR = map.ar;
        baseOD = map.od;

        if (!stars) {
          stars = new StdDifficulty().calc(params);
        }
      } else {
        maxCombo = params.maxCombo;
        if (!maxCombo || maxCombo < 0) {
          throw new TypeError('maxCombo must be > 0');
        }

        sliderCount = params.sliderCount;
        circleCount = params.circleCount;
        objectCount = params.objectCount;
        if (!sliderCount || !circleCount || !objectCount) {
          throw new TypeError('sliderCount, circleCount, objectCount are required');
        }
        if (objectCount < sliderCount + circleCount) {
          throw new TypeError('objectCount must be >= sliderCount + circleCount');
        }

        baseAR = params.baseAR;
        if (baseAR === undefined) baseAR = 5;
        baseOD = params.baseOD;
        if (baseOD === undefined) baseOD = 5;
      }

      if (stars) {
        mods = stars.mods;
        aimStars = stars.aim;
        speedStars = stars.speed;
      } else {
        mods = params.mods || MOD_CONSTANTS.NOMOD;
        aimStars = params.aimStars;
        speedStars = params.speedStars;
      }

      if (aimStars === undefined || speedStars === undefined) {
        throw new TypeError('aim and speed stars required');
      }

      const missCount = params.missCount || 0;
      let n50 = params.n50 || 0;
      let n100 = params.n100 || 0;

      let n300 = params.n300;
      if (n300 === undefined) { n300 = objectCount - n100 - n50 - missCount; }

      let combo = params.combo;
      if (combo === undefined) combo = maxCombo - missCount;

      const scoreVersion = params.scoreVersion || 1;

      // common values used in all pp calculations

      const objectCount_over_2k = objectCount / 2000.0;

      let lengthBonus = 0.95 + 0.4 *
        Math.min(1.0, objectCount_over_2k);

      if (objectCount > 2000) {
        lengthBonus += Math.log10(objectCount_over_2k) * 0.5;
      }

      const missPenalty = 0.97 ** missCount;
      const comboBreak = combo ** 0.8 / maxCombo ** 0.8;

      const mapstats
        = new StdBeatmapStats({ ar: baseAR, od: baseOD })
          .with_mods(mods);

      this.computed_accuracy = new StdAccuracy({
        percent: params.accuracyPercent,
        objectCount,
        n300,
        n100,
        n50,
        missCount,
      });

      n300 = this.computed_accuracy.n300;
      n100 = this.computed_accuracy.n100;
      n50 = this.computed_accuracy.n50;

      const accuracy = this.computed_accuracy.value();

      // high/low ar bonus

      let arBonus = 1.0;

      if (mapstats.ar > 10.33) {
        arBonus += 0.45 * (mapstats.ar - 10.33);
      } else if (mapstats.ar < 8.0) {
        let lowArBonus = 0.01 * (8.0 - mapstats.ar);

        if (mods & MOD_CONSTANTS.HD) {
          lowArBonus *= 2.0;
        }

        arBonus += lowArBonus;
      }

      // aim pp

      let aim = this._base(aimStars);
      aim *= lengthBonus;
      aim *= missPenalty;
      aim *= comboBreak;
      aim *= arBonus;

      if (mods & MOD_CONSTANTS.HD) aim *= 1.18;
      if (mods & MOD_CONSTANTS.FL) aim *= 1.45 * lengthBonus;

      const accuracyBonus = 0.5 + accuracy / 2.0;
      const odBonus =
        0.98 + (mapstats.od * mapstats.od) / 2500.0;

      aim *= accuracyBonus;
      aim *= odBonus;

      this.aim = aim;

      // speed pp

      let speed = this._base(speedStars);
      speed *= lengthBonus;
      speed *= missPenalty;
      speed *= comboBreak;
      speed *= accuracyBonus;
      speed *= odBonus;

      this.speed = speed;

      // accuracy pp
      //
      // scorev1 ignores sliders and spinners since they are free
      // 300s

      let realAccuracy = accuracy;

      switch (scoreVersion) {
        case 1:
          var spinnerCount = objectCount - sliderCount - circleCount;

          realAccuracy = new StdAccuracy({
            n300: Math.max(0, n300 - sliderCount - spinnerCount),
            n100,
            n50,
            missCount,
          }).value();

          realAccuracy = Math.max(0.0, realAccuracy);
          break;

        case 2:
          circleCount = objectCount;
          break;

        default:
          throw new {
            name: 'NotImplementedError',
            message: `unsupported scorev${scoreVersion}`,
          }();
      }

      let acc = (1.52163 ** mapstats.od) * (realAccuracy ** 24.0) * 2.83;

      acc *= Math.min(1.15, (circleCount / 1000.0) ** 0.3);

      if (mods & MOD_CONSTANTS.HD) acc *= 1.02;
      if (mods & MOD_CONSTANTS.FL) acc *= 1.02;

      this.acc = acc;

      // total pp

      let finalMultiplier = 1.12;

      if (mods & MOD_CONSTANTS.NF) finalMultiplier *= 0.90;
      if (mods & MOD_CONSTANTS.SO) finalMultiplier *= 0.95;

      this.total = ((aim ** 1.1 + speed ** 1.1 + acc ** 1.1) ** (1.0 / 1.1)) * finalMultiplier;

      return this;
    }

    toString() {
      return `${this.total.toFixed(2)} pp (${this.aim.toFixed(2)
      } aim, ${this.speed.toFixed(2)} speed, ${
        this.acc.toFixed(2)} acc)`;
    }

    // _(internal)_ base pp value for stars
    _base(stars) {
      return (5.0 * Math.max(1.0, stars / 0.0675) - 4.0) ** 3.0 / 100000.0;
    }
  }
  // generic pp calc function that figures out what calculator to use
  // based on the params' mode and passes through params and
  // return value for calc()

  function ppv2(params) {
    let mode;

    if (params.map) {
      mode = params.map.mode;
    } else {
      mode = params.mode || modes.std;
    }

    switch (mode) {
      case modes.std:
        return new StdPPv2().calc(params);
    }

    throw {
      name: 'NotImplementedError',
      message: 'this gamemode is not yet supported',
    };
  }

  // exports
  // ----------------------------------------------------------------

  osu.Timing = Timing;
  osu.objectTypes = objectTypes;
  osu.Circle = Circle;
  osu.Slider = Slider;
  osu.HitObject = HitObject;
  osu.modes = modes;
  osu.Beatmap = Beatmap;
  osu.MOD_CONSTANTS = MOD_CONSTANTS;
  osu.StdBeatmapStats = StdBeatmapStats;
  osu.StdDifficultyHitObject = StdDifficultyHitObject;
  osu.StdDifficulty = StdDifficulty;
  osu.diff = diff;
  osu.StdAccuracy = StdAccuracy;
  osu.StdPPv2 = StdPPv2;
  osu.ppv2 = ppv2;
}());
