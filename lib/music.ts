// KHAOS composer: genres, scales, and the generative brain.

export const DRUMS = ["kick", "snare", "clap", "hat", "ohat", "perc"] as const;
export type DrumId = (typeof DRUMS)[number];
export type TrackId = DrumId | "bass" | "pad" | "lead" | "arp";
export const TRACKS: TrackId[] = [...DRUMS, "bass", "pad", "lead", "arp"];

// y = which user melody layer the note belongs to, p = instrument override for that layer.
export type Note = { s: number; l: number; m: number; v: number; g?: boolean; w?: number; y?: number; p?: string };
export type Chord = { s: number; l: number; ms: number[]; v: number; d: number };
export type DrumTrack = { v: number[]; r: number[] };
export type Drums = Record<DrumId, DrumTrack>;

export type Genre = {
  id: string;
  name: string;
  tag: string;
  bpm: [number, number];
  swing: number;
  scales: string[];
  drum: string;
  bass: string;
  chord: string;
  bassP: string;
  padP: string;
  leadP: string;
  arpP: string;
  liveP: string;
  arp: number;
  density: number;
  ext: number;
  kit: string;
  perc: string;
  sidechain: number;
  colors: [string, string, string];
  spb?: number;
  progs?: number[][];
  thirds?: boolean;
};

export type Song = {
  genre: Genre;
  seed: number;
  bpm: number;
  swing: number;
  spb: number;
  root: number;
  scale: string;
  prog: number[];
  chords: number[][];
  drumBars: Drums[];
  bass: Note[];
  pad: Chord[];
  lead: Note[];
  arp: Note[];
  custom?: boolean;
  auto?: boolean;
  // Beat-four material parked while the song sits in a 3/4 genre.
  hidden?: { bass?: Note[]; lead?: Note[]; arp?: Note[]; pad?: Chord[] };
  mutes: Partial<Record<TrackId, boolean>>;
};

export const SCALES: Record<string, number[]> = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
};

// Progressions per mode, chosen to dodge diminished chords.
const PROGS: Record<string, number[][]> = {
  minor: [[0, 5, 2, 6], [0, 5, 3, 4], [0, 3, 5, 6], [0, 6, 5, 4], [0, 0, 5, 6], [0, 2, 6, 5], [5, 6, 0, 0], [0, 3, 0, 4]],
  major: [[0, 3, 4, 0], [0, 4, 5, 3], [0, 5, 3, 4], [3, 0, 4, 5], [0, 3, 5, 4], [5, 3, 0, 4], [0, 2, 3, 4]],
  dorian: [[0, 3, 0, 3], [0, 2, 3, 3], [0, 6, 3, 0], [0, 1, 3, 4], [0, 3, 6, 4]],
  phrygian: [[0, 1, 0, 6], [0, 1, 2, 1], [0, 5, 1, 0], [0, 6, 1, 0], [0, 0, 1, 0]],
  harmonic: [[0, 5, 3, 4], [0, 3, 4, 0], [0, 5, 4, 4], [0, 3, 5, 4]],
  mixolydian: [[0, 6, 3, 0], [0, 3, 6, 3], [0, 4, 6, 3], [0, 6, 0, 3]],
  lydian: [[0, 1, 0, 1], [0, 1, 5, 4], [0, 4, 1, 0], [0, 5, 1, 4]],
};

export const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
export const mod = (n: number, m: number) => ((n % m) + m) % m;
export const deg2midi = (root: number, sc: number[], d: number) =>
  root + 12 * Math.floor(d / 7) + sc[mod(d, 7)];
export const leadRoot = (root: number) => (root > 7 ? 48 + root : 60 + root);

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type R = () => number;
const pick = <T,>(r: R, a: T[]): T => a[Math.floor(r() * a.length)];

const G = (
  id: string, name: string, tag: string, bpm: [number, number], swing: number, scales: string[],
  drum: string, bass: string, chord: string, bassP: string, padP: string, leadP: string, arpP: string,
  liveP: string, arp: number, density: number, ext: number, kit: string, perc: string, sidechain: number,
  colors: [string, string, string],
  x: Partial<Genre> = {},
): Genre => ({ id, name, tag, bpm, swing, scales, drum, bass, chord, bassP, padP, leadP, arpP, liveP, arp, density, ext, kit, perc, sidechain, colors, ...x });

export const GENRES: Genre[] = [
  G("trap", "Trap", "808s & hi-hat rolls", [136, 150], 0, ["minor", "phrygian", "harmonic"], "trap", "808", "pad", "sub808", "darkpad", "bell", "arp", "keys", 0.2, 0.45, 3, "trap", "rim", 0.25, ["#ff2d55", "#7a1cff", "#ffd60a"]),
  G("house", "House", "four on the floor", [122, 128], 0.04, ["minor", "dorian", "major"], "four", "offbeat", "stab", "housebass", "stab", "pluck", "arp", "stab", 0.5, 0.5, 4, "house", "conga", 0.6, ["#ff9f0a", "#ff375f", "#fff3c4"]),
  G("techno", "Techno", "warehouse hypnosis", [130, 140], 0, ["phrygian", "minor"], "techno", "roll16", "stab", "technobass", "stab", "acid", "arp", "stab", 0.75, 0.55, 3, "hard", "rim", 0.5, ["#30d158", "#0a84ff", "#d4ffe4"]),
  G("dnb", "Drum & Bass", "liquid breaks", [170, 176], 0, ["minor", "dorian"], "dnb", "reese", "pad", "reese", "pad", "pluck", "arp", "keys", 0.4, 0.4, 4, "acoustic", "rim", 0.3, ["#64d2ff", "#bf5af2", "#ffffff"]),
  G("dubstep", "Dubstep", "wobble & weight", [140, 140], 0, ["minor", "phrygian"], "dubstep", "wobble", "pad", "wobble", "darkpad", "sawlead", "arp", "stab", 0.15, 0.3, 3, "hard", "tom", 0.35, ["#a6ff00", "#00c853", "#f4ff81"]),
  G("future", "Future Bass", "supersaw euphoria", [150, 160], 0, ["major", "lydian"], "half", "sub", "pump", "subbass", "supersaw", "bell", "arp", "supersaw", 0.45, 0.5, 5, "trap", "rim", 0.7, ["#ff6bd6", "#5e5ce6", "#aef9ff"]),
  G("synthwave", "Synthwave", "neon night drive", [100, 116], 0, ["minor", "dorian"], "synthwave", "roll8", "pad", "synthbass", "pad", "sawlead", "arp", "stab", 0.85, 0.5, 4, "acoustic", "tom", 0.4, ["#ff2a9d", "#7b2dff", "#00f0ff"]),
  G("lofi", "Lo-Fi", "dusty & warm", [72, 88], 0.2, ["dorian", "major", "minor"], "boombap", "sub", "keys", "subbass", "epiano", "flute", "arp", "epiano", 0.15, 0.35, 5, "lofi", "rim", 0.2, ["#ffb38a", "#b78cff", "#ffe9c7"]),
  G("hiphop", "Boom Bap", "golden era swing", [86, 96], 0.16, ["minor", "dorian"], "boombap", "funk", "keys", "subbass", "keys", "keys", "arp", "keys", 0.1, 0.4, 4, "acoustic", "rim", 0.15, ["#ffcc00", "#ff6a00", "#fff1c1"]),
  G("drill", "Drill", "sliding 808s", [140, 146], 0, ["minor", "harmonic"], "drill", "808", "pad", "sub808", "darkpad", "keys", "arp", "keys", 0.15, 0.4, 3, "trap", "rim", 0.2, ["#00e5ff", "#1b3cff", "#e0f7ff"]),
  G("reggaeton", "Reggaetón", "dembow heat", [90, 100], 0, ["minor", "harmonic"], "dembow", "tres", "stab", "synthbass", "stab", "pluck", "arp", "stab", 0.3, 0.5, 3, "house", "conga", 0.3, ["#ffd60a", "#ff453a", "#32d74b"]),
  G("afro", "Afrobeats", "sun-soaked groove", [100, 114], 0.06, ["major", "mixolydian", "minor"], "afro", "tres", "keys", "subbass", "epiano", "marimba", "arp", "epiano", 0.3, 0.55, 4, "house", "conga", 0.2, ["#ff9500", "#34c759", "#ffe08a"]),
  G("ukg", "UK Garage", "2-step shuffle", [130, 136], 0.2, ["minor", "dorian"], "garage", "offbeat", "stab", "housebass", "organ", "pluck", "arp", "organ", 0.3, 0.5, 4, "house", "rim", 0.35, ["#5ac8fa", "#af52de", "#f5f5ff"]),
  G("phonk", "Phonk", "cowbell drift", [140, 155], 0, ["phrygian", "minor"], "phonk", "808", "pad", "sub808", "darkpad", "cowbell", "arp", "cowbell", 0.1, 0.65, 3, "hard", "cowbell", 0.4, ["#ff0033", "#7a0019", "#ff8fa3"]),
  G("hyperpop", "Hyperpop", "sugar-rush overload", [155, 175], 0, ["major", "lydian"], "hyper", "808", "pump", "sub808", "supersaw", "square", "arp", "square", 0.6, 0.7, 4, "hard", "rim", 0.5, ["#ff3df2", "#3dffe0", "#fff95b"]),
  G("disco", "Disco Funk", "mirrorball strut", [112, 122], 0.05, ["dorian", "mixolydian", "major"], "disco", "funk", "stab", "funkbass", "stab", "brass", "arp", "stab", 0.3, 0.5, 4, "acoustic", "cowbell", 0.3, ["#ffd166", "#ef476f", "#06d6a0"]),
  G("jersey", "Jersey Club", "bounce bounce bounce", [136, 144], 0, ["minor", "major"], "jersey", "808", "stab", "sub808", "stab", "pluck", "arp", "stab", 0.3, 0.5, 3, "trap", "rim", 0.3, ["#ff5e3a", "#ffdb4c", "#ff2d95"]),
  G("corridos", "Corridos", "requinto & tololoche · 3/4", [128, 150], 0, ["major", "harmonic"], "corrido", "waltz", "chop", "tololoche", "nylon", "requinto", "nylon", "nylon", 0, 0.75, 3, "acoustic", "rim", 0, ["#00a86b", "#d4213d", "#f5e9c8"], { spb: 12, thirds: true, progs: [[0, 0, 4, 4], [0, 4, 4, 0], [0, 3, 4, 0], [3, 0, 4, 0]] }),
  G("regional", "Regional Mexicano", "norteño polka", [108, 126], 0, ["major"], "banda", "polka", "chop", "tuba", "nylon", "accordion", "nylon", "accordion", 0, 0.65, 3, "acoustic", "rim", 0, ["#ff7a00", "#e6007e", "#ffe14d"], { thirds: true, progs: [[0, 0, 4, 4], [0, 4, 4, 0], [0, 3, 4, 0], [3, 0, 4, 0]] }),
  G("ambient", "Ambient", "weightless drift", [70, 90], 0, ["lydian", "major", "dorian"], "ambient", "sub", "pad", "subbass", "lush", "bell", "bell", "bell", 0.95, 0.25, 5, "lofi", "shaker", 0, ["#5e9bff", "#2be4c8", "#e7f0ff"]),
];

// ───────────────────────── harmony

export function voice(root: number, scale: string, d: number, ext: number): number[] {
  const sc = SCALES[scale];
  const ms = Array.from({ length: ext }, (_, i) => deg2midi(48 + root, sc, d + i * 2)).map(
    (m) => mod(m - 53, 12) + 53,
  );
  return [...new Set(ms)].sort((a, b) => a - b);
}

export function chordName(root: number, scale: string, d: number): string {
  const sc = SCALES[scale];
  const a = deg2midi(root, sc, d), b = deg2midi(root, sc, d + 2), c = deg2midi(root, sc, d + 4);
  const q = c - a === 6 ? "°" : b - a === 3 ? "m" : "";
  return NOTE_NAMES[mod(a, 12)] + q;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
export function roman(scale: string, d: number): string {
  const sc = SCALES[scale];
  const third = mod(sc[mod(d + 2, 7)] - sc[mod(d, 7)], 12);
  return third === 3 ? ROMAN[mod(d, 7)].toLowerCase() : ROMAN[mod(d, 7)];
}

// ───────────────────────── drums

const mk = (): DrumTrack => ({ v: Array(16).fill(0), r: Array(16).fill(1) });
const cloneDrums = (d: Drums): Drums =>
  Object.fromEntries(DRUMS.map((k) => [k, { v: [...d[k].v], r: [...d[k].r] }])) as Drums;

function genDrums(g: Genre, r: R, e: number, c: number): Drums[] {
  const d: Drums = { kick: mk(), snare: mk(), clap: mk(), hat: mk(), ohat: mk(), perc: mk() };
  const on = (t: DrumId, steps: number[], v = 1) => steps.forEach((s) => (d[t].v[mod(s, 16)] = v));
  const maybe = (t: DrumId, steps: number[], p: number, v = 0.7) =>
    steps.forEach((s) => { if (r() < p) d[t].v[s] = v; });
  const hats = (p8: number, p16: number) => {
    for (let i = 0; i < 16; i++) {
      if (i % 2 === 0 ? r() < p8 : r() < p16) d.hat.v[i] = i % 4 === 0 ? 0.75 : i % 2 === 0 ? 0.55 : 0.35 + r() * 0.15;
    }
  };
  const rolls = (n: number) => {
    for (let i = 0; i < n; i++) {
      const s = pick(r, [3, 6, 7, 10, 11, 13, 14, 15]);
      d.hat.v[s] = d.hat.v[s] || 0.6;
      d.hat.r[s] = pick(r, [2, 2, 3, 4]);
    }
  };
  const four = [0, 4, 8, 12], back = [4, 12], off = [2, 6, 10, 14];
  switch (g.drum) {
    case "four":
      on("kick", four); on("clap", back, 0.9); on("ohat", off, 0.7); hats(0.3 + e * 0.5, e * 0.9);
      maybe("perc", [3, 7, 10, 11, 13, 15], 0.15 + c * 0.35); maybe("snare", [7, 15], 0.15 + c * 0.2, 0.3); break;
    case "techno":
      on("kick", four); on("ohat", off, 0.65); hats(1, 0.4 + e * 0.6);
      on(r() < 0.6 ? "clap" : "snare", back, 0.8); maybe("perc", [3, 6, 9, 11, 14], 0.3 + c * 0.3);
      maybe("kick", [14, 15], c * 0.3, 0.8); break;
    case "trap":
      on("kick", pick(r, [[0, 6, 10], [0, 3, 10], [0, 7, 10, 13], [0, 10, 11], [0, 6, 8, 14]]));
      on("snare", [8]); on("clap", [8], 0.8); hats(1, e * 0.35); rolls(1 + Math.round(c * 3 + e));
      maybe("ohat", [6, 14], 0.3); maybe("perc", [3, 11, 13], 0.15 + c * 0.3); maybe("snare", [13, 15], c * 0.4, 0.4); break;
    case "drill":
      on("kick", pick(r, [[0, 7, 10], [0, 3, 10, 13], [0, 6, 10]]));
      on("snare", [8]); on("clap", [8], 0.7); on("hat", [0, 3, 6, 8, 11, 14], 0.65);
      maybe("hat", [2, 5, 10, 13], 0.25 + e * 0.3, 0.35); rolls(1 + Math.round(c * 2));
      maybe("perc", [5, 13, 15], 0.2 + c * 0.3); maybe("ohat", [12], 0.3); break;
    case "boombap":
      on("kick", pick(r, [[0, 7, 10], [0, 3, 10], [0, 10, 11], [0, 6, 10]]));
      on("snare", back); hats(1, 0.1 + e * 0.2); maybe("ohat", [6, 14], 0.2);
      maybe("snare", [7, 9, 15], 0.12 + c * 0.2, 0.3); maybe("perc", [3, 11], 0.15 + c * 0.2); break;
    case "dnb":
      on("kick", pick(r, [[0, 10], [0, 6, 10], [0, 10, 13]]));
      on("snare", back); hats(1, 0.2 + e * 0.6); maybe("snare", [7, 9, 14, 15], 0.2 + c * 0.3, 0.32);
      maybe("ohat", [2, 10], 0.3); maybe("perc", [3, 6, 11], 0.2 + c * 0.2); break;
    case "dubstep":
      on("kick", pick(r, [[0], [0, 10], [0, 6], [0, 3, 10]])); on("snare", [8]); on("clap", [8], 0.8);
      hats(0.5 + e * 0.5, e * 0.25); rolls(Math.round(c * 2)); maybe("perc", [5, 11, 14], 0.2 + c * 0.3); maybe("ohat", [14], 0.3); break;
    case "dembow":
      on("kick", four); on("snare", [3, 6, 11, 14], 0.85); hats(0.4 + e * 0.6, e * 0.3);
      maybe("clap", [6, 14], 0.5, 0.6); maybe("perc", [2, 10, 13], 0.25 + c * 0.3); break;
    case "afro":
      on("kick", pick(r, [[0, 6, 10], [0, 4, 8, 12], [0, 7, 8, 10]])); on("perc", [3, 6, 10, 13], 0.75);
      on("clap", back, 0.65); hats(1, 0.5 + e * 0.5); maybe("ohat", [2, 10], 0.35); maybe("snare", [7, 15], 0.2 + c * 0.2, 0.35); break;
    case "garage":
      on("kick", [0, 10]); maybe("kick", [7, 13], 0.25 + c * 0.2, 0.8); on("snare", back); on("clap", back, 0.6);
      on("hat", off, 0.7); maybe("hat", [1, 3, 5, 7, 9, 11, 13, 15], 0.25 + e * 0.35, 0.35);
      maybe("perc", [3, 7, 9, 15], 0.25); maybe("ohat", [14], 0.4); break;
    case "jersey":
      on("kick", [0, 4, 8, 11, 14]); on("clap", back); hats(1, e * 0.3); maybe("perc", [3, 7, 15], 0.3);
      maybe("snare", [15], 0.3, 0.5); maybe("ohat", [2, 10], 0.3); break;
    case "half":
      on("kick", pick(r, [[0, 10], [0, 6, 10], [0, 3, 10]])); on("snare", [8]); on("clap", [8], 0.85);
      hats(1, e * 0.3); rolls(Math.round(c * 2 + e)); maybe("ohat", [14], 0.4); maybe("perc", [5, 13], 0.2); break;
    case "disco":
      on("kick", four); on("snare", back, 0.9); on("clap", back, 0.6); on("ohat", off, 0.7); hats(1, 0.5 + e * 0.5);
      maybe("perc", [3, 6, 11, 14], 0.2 + c * 0.3); break;
    case "synthwave":
      on("kick", r() < 0.6 ? four : [0, 8, 10]); on("snare", back); hats(1, e * 0.3); maybe("ohat", [14], 0.4);
      maybe("perc", [13, 14, 15], 0.15 + c * 0.3); break;
    case "phonk":
      on("kick", pick(r, [[0, 4, 8, 12], [0, 3, 8, 11], [0, 6, 8, 14]])); on("clap", back); on("snare", back, 0.6);
      hats(1, 0.3 + e * 0.5); rolls(1 + Math.round(c * 2)); on("perc", pick(r, [[0, 3, 6, 10], [2, 6, 10, 14], [0, 3, 6, 8, 11, 14]]), 0.6); break;
    case "hyper":
      on("kick", pick(r, [[0, 4, 8, 12], [0, 3, 6, 8, 11, 14]])); on("snare", back); on("clap", back, 0.8);
      hats(1, 0.5 + e * 0.5); rolls(2 + Math.round(c * 3)); maybe("ohat", off, 0.3); maybe("perc", [3, 7, 13], 0.3); break;
    case "corrido":
      // Sierreño: no drum kit at all. At high energy a soft tap marks beats 2 and 3.
      if (e > 0.75) on("perc", [4, 8], 0.4);
      break;
    case "banda":
      // Tambora on the beat, tarola and cymbals answering on the off-beat.
      on("kick", four, 0.9); on("hat", off, 0.7); on("snare", off, 0.55); maybe("ohat", [0, 8], 0.3 + e * 0.4, 0.5);
      maybe("snare", [3, 7, 11, 15], 0.2 + e * 0.3, 0.35); d.snare.r[14] = r() < 0.4 + c * 0.5 ? 3 : 1; break;
    default:
      maybe("kick", [0], 0.6, 0.6); maybe("hat", [2, 6, 10, 14], 0.2 + e * 0.3, 0.25);
      maybe("perc", [0, 3, 6, 8, 11, 14], 0.15 + e * 0.2, 0.4);
  }
  // Four bars: A, A', A, fill.
  const alt = cloneDrums(d);
  if (g.drum === "drill") { alt.snare.v[8] = 0; alt.clap.v[8] = 0; alt.snare.v[12] = 1; alt.clap.v[12] = 0.7; }
  else if (g.drum !== "ambient" && g.spb !== 12 && r() < 0.3 + c * 0.5) alt.kick.v[pick(r, [11, 13, 14])] = 0.85;
  const fill = cloneDrums(g.drum === "drill" ? alt : d);
  if (g.drum !== "ambient" && g.spb !== 12 && r() < 0.5 + c * 0.5) {
    const f = pick(r, [[14, 15], [12, 14, 15], [13, 15], [12, 13, 14, 15]]);
    f.forEach((s, i) => (fill.snare.v[s] = 0.5 + (i / f.length) * 0.5));
    fill.hat.r[14] = 3; fill.hat.v[14] = 0.6;
    if (!["four", "techno", "disco"].includes(g.drum)) fill.kick.v[15] = 0;
  }
  return [d, alt, cloneDrums(d), fill];
}

// ───────────────────────── bass / chords / lead / arp

type S = Pick<Song, "root" | "scale" | "prog" | "chords" | "bpm" | "genre" | "drumBars" | "spb">;
const FUNK = [[0, 3, 6, 8, 11, 14], [0, 2, 6, 8, 10, 13], [0, 3, 4, 8, 11, 12]];

function genBass(s: S, r: R, e: number, c: number): Note[] {
  const out: Note[] = [];
  const funk = pick(r, FUNK);
  for (let b = 0; b < 4; b++) {
    const pc = mod(s.root + SCALES[s.scale][mod(s.prog[b], 7)], 12);
    const r0 = pc + 36 > 43 ? pc + 24 : pc + 36;
    // Two scale steps walking up into the next bar's root.
    const sc = SCALES[s.scale], nd = mod(s.prog[(b + 1) % 4], 7), npc = mod(s.root + sc[nd], 12);
    const nr = npc + 36 > 43 ? npc + 24 : npc + 36, off = nr - deg2midi(s.root, sc, nd);
    const walk = [deg2midi(s.root, sc, nd - 2) + off, deg2midi(s.root, sc, nd - 1) + off];
    const moves = s.prog[(b + 1) % 4] !== s.prog[b], same = b > 0 && s.prog[b - 1] === s.prog[b];
    const fifth = r0 + 7 <= 45 ? r0 + 7 : r0 - 5;
    const add = (st: number, l: number, m = r0, v = 0.9, x: Partial<Note> = {}) =>
      out.push({ s: b * s.spb + st, l, m, v, ...x });
    switch (s.genre.bass) {
      case "808": {
        const ks: number[] = [];
        s.drumBars[b].kick.v.forEach((v, i) => v && ks.push(i));
        if (!ks.length) ks.push(0);
        ks.forEach((st, i) => {
          const nx = i < ks.length - 1 ? ks[i + 1] : 16;
          const up = i === ks.length - 1 && i > 0 && r() < 0.25 + c * 0.5;
          add(st, Math.min(nx - st, 8), up ? r0 + (r() < 0.5 ? 12 : 7) : r0, 1, up ? { g: true } : {});
        });
        break;
      }
      case "polka":
        // Oom-pah: root and fifth trading on the beat, walking up when the chord changes.
        add(0, 3, r0, 1); add(4, 3, fifth, 0.85); add(8, 3, r0, 1);
        if (moves) { add(12, 2, walk[0], 0.85); add(14, 2, walk[1], 0.9); } else add(12, 3, fifth, 0.85);
        break;
      case "waltz":
        // Beat one only; the guitars answer on two and three.
        add(0, 4, same ? fifth : r0, 1);
        if (moves) { add(8, 2, walk[0], 0.8); add(10, 2, walk[1], 0.88); }
        else if (r() < 0.3 + c * 0.3) add(8, 3, same ? r0 : fifth, 0.7);
        break;
      case "offbeat": [2, 6, 10, 14].forEach((st, i) => add(st, 2, i === 3 && r() < 0.3 + c * 0.3 ? r0 + 12 : r0)); break;
      case "roll8": for (let st = 0; st < 16; st += 2) add(st, 2, (st === 6 || st === 14) && r() < 0.5 ? r0 + 12 : r0, st % 4 === 0 ? 0.95 : 0.75); break;
      case "roll16": for (let st = 0; st < 16; st++) if (st % 4 !== 0) add(st, 1, r() < c * 0.25 ? r0 + 12 : r0, st % 4 === 2 ? 0.95 : 0.7); break;
      case "reese":
        if (r() < 0.5) add(0, 16);
        else { add(0, 10); add(10, 6, r0 + (r() < 0.5 ? 7 : 12), 0.9, { g: true }); }
        break;
      case "wobble":
        if (r() < 0.5) { add(0, 8, r0, 1, { w: pick(r, [1, 2, 2, 3, 4]) }); add(8, 8, r0, 1, { w: pick(r, [2, 3, 4, 6]) }); }
        else { add(0, 6, r0, 1, { w: pick(r, [2, 3, 4]) }); add(6, 2, r0 + 12, 1, { w: 4 }); add(8, 8, r0, 1, { w: pick(r, [1, 2, 4]) }); }
        break;
      case "funk": funk.forEach((st, i) => add(st, 1 + (r() < 0.4 ? 1 : 0), i % 3 === 2 ? r0 + 12 : r() < 0.2 ? r0 + 7 : r0, st % 4 === 0 ? 0.95 : 0.8)); break;
      case "tres": [0, 3, 6, 8, 11, 14].forEach((st, i) => add(st, 2, (i === 2 || i === 5) && r() < 0.5 ? r0 + 7 : r0, i % 3 === 0 ? 0.95 : 0.8)); break;
      default:
        if (e > 0.5 && r() < 0.6) { add(0, 10); add(10, 6); } else add(0, 16);
    }
  }
  return out;
}

function genPad(s: S, r: R): Chord[] {
  const out: Chord[] = [];
  const style = s.genre.chord;
  const tpl =
    style === "stab" ? pick(r, [[2, 6, 10, 14], [0, 3, 6, 10, 13], [3, 6, 11, 14], [0, 6, 10]])
    : style === "pump" ? pick(r, [[0, 2, 4, 6, 8, 10, 12, 14], [0, 3, 6, 8, 11, 14], [0, 4, 6, 10, 12]])
    : style === "keys" ? pick(r, [[0, 10], [0, 6, 12], [0, 7], [0, 3, 10]])
    : style === "chop" ? (s.spb === 12 ? [4, 8] : [2, 6, 10, 14])
    : [0];
  for (let b = 0; b < 4; b++) {
    tpl.forEach((st, i) => {
      const nx = i < tpl.length - 1 ? tpl[i + 1] : s.spb;
      const l = style === "stab" || style === "chop" ? 2 : style === "keys" ? Math.min(nx - st, 8) : nx - st;
      out.push({ s: b * s.spb + st, l, ms: s.chords[b], v: st % 4 === 0 ? 0.8 : 0.68, d: s.prog[b] });
    });
  }
  return out;
}

const RHY = [[0, 8], [0, 6, 12], [0, 3, 8, 11], [0, 6, 8, 14], [0, 3, 6, 10, 12], [0, 4, 8, 10, 12], [0, 3, 6, 8, 11, 14], [0, 2, 4, 7, 10, 12], [2, 4, 6, 10, 12, 14], [0, 2, 3, 6, 8, 10, 11, 14], [0, 2, 4, 6, 8, 10, 12, 14]];

const RHY12 = [[0, 4, 8], [0, 4, 8, 10], [0, 6, 8, 10], [0, 2, 4, 8], [0, 4, 6, 8, 10], [4, 6, 8, 10], [0, 2, 4, 6, 8], [0, 2, 4, 6, 8, 10]];

function genLead(s: S, r: R, density: number, c: number, user?: number[]): Note[] {
  const sc = SCALES[s.scale], lr = leadRoot(s.root), W = s.spb, half = W / 2;
  const target = user ? Math.min(8, user.length > 8 ? Math.ceil(user.length / 2) : Math.max(2, user.length)) : 2 + density * 6 + (r() - 0.5) * 2;
  const sorted = [...(W === 12 ? RHY12 : RHY)].sort((a, b) => Math.abs(a.length - target) - Math.abs(b.length - target));
  const rh = sorted[Math.floor(r() * (user ? 2 : 3))];
  const snap = (d: number, cd: number) => {
    let best = d, bd = 99;
    for (let k = -4; k <= 4; k++) if ([0, 2, 4].includes(mod(d + k - cd, 7)) && Math.abs(k) < bd) { bd = Math.abs(k); best = d + k; }
    return best;
  };
  const out: Note[] = [];
  if (user) {
    let k = 0;
    const bars = [0, 1].map(() => rh.map(() => user[k++ % user.length]));
    for (let b = 0; b < 4; b++) {
      rh.forEach((st, i) => {
        const last = b === 3 && i === rh.length - 1;
        const nx = i < rh.length - 1 ? rh[i + 1] : W;
        out.push({ s: b * W + st, l: last ? W - st : Math.min(nx - st, 4), m: bars[b % 2][i], v: st % 4 === 0 ? 0.95 : 0.78 });
      });
    }
    return out;
  }
  let d = snap(pick(r, [2, 4, 7]), s.prog[0]);
  const steps = [-2, -1, -1, 1, 1, 2, c > 0.5 ? 4 : 1, c > 0.5 ? -3 : -1];
  const motif = rh.map((_, i) => { if (i) d = Math.max(-2, Math.min(11, d + pick(r, steps))); return d; });
  const shift = pick(r, [0, 1, -1, 2]);
  for (let b = 0; b < 4; b++) {
    let on = rh.map((st, i) => ({ st, d: motif[i] + (b % 2 ? shift : 0) }));
    if (density < 0.4 && b % 2) on = on.filter((o) => o.st < half);
    if (b === 3) on = on.filter((o) => o.st <= half);
    on.forEach((o, i) => {
      const last = b === 3 && i === on.length - 1;
      const strong = o.st % half === 0 || i === 0 || last;
      const dd = strong ? snap(o.d, s.prog[b]) : o.d;
      const nx = i < on.length - 1 ? on[i + 1].st : W;
      const n = { s: b * W + o.st, l: last ? 6 : Math.min(nx - o.st, 4), m: deg2midi(lr, sc, dd), v: o.st % 4 === 0 ? 0.95 : 0.75 };
      out.push(n);
      // Segunda voz: the same line a diatonic third below.
      if (s.genre.thirds) out.push({ ...n, m: deg2midi(lr, sc, dd - 2), v: n.v * 0.7 });
    });
  }
  return out;
}

const GATES = [[1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 1, 0, 1, 1, 0], [1, 1, 1, 0, 1, 1, 1, 0]];

function genArp(s: S, r: R): Note[] {
  const out: Note[] = [];
  const rate = s.bpm > 150 || s.bpm < 95 ? 2 : 1;
  const mode = Math.floor(r() * 3);
  const gate = pick(r, GATES);
  for (let b = 0; b < 4; b++) {
    const t = [...s.chords[b], ...s.chords[b].map((m) => m + 12)];
    const seq = mode === 0 ? t : mode === 1 ? [...t, ...t.slice(1, -1).reverse()] : t.map((_, i) => t[(i * 3) % t.length]);
    let k = 0;
    for (let st = 0; st < s.spb; st += rate) {
      if (!gate[(st / rate) % 8]) continue;
      out.push({ s: b * s.spb + st, l: rate, m: seq[k++ % seq.length] + 12, v: st % 4 === 0 ? 0.75 : 0.5 });
    }
  }
  return out;
}

// ───────────────────────── public API

export function compose(g: Genre, seed: number, e: number, c: number, keep?: { bpm?: number; lead?: Note[]; mutes?: Song["mutes"] }): Song {
  const r = rng(seed);
  const root = Math.floor(r() * 12);
  const scale = pick(r, g.scales);
  const prog = pick(r, g.progs ?? PROGS[scale]);
  const bpm = keep?.bpm ?? Math.round(g.bpm[0] + r() * (g.bpm[1] - g.bpm[0]));
  const chords = prog.map((d) => voice(root, scale, d, g.ext));
  const base = { genre: g, root, scale, prog, chords, bpm, spb: g.spb ?? 16 };
  const drumBars = genDrums(g, rng(seed + 1), e, c);
  const s: S = { ...base, drumBars };
  const arpOn = rng(seed + 6)() < g.arp;
  return {
    ...s, seed, swing: g.swing,
    bass: genBass(s, rng(seed + 2), e, c),
    pad: genPad(s, rng(seed + 3)),
    lead: keep?.lead ?? genLead(s, rng(seed + 4), g.density * (0.6 + e * 0.8), c),
    arp: genArp(s, rng(seed + 5)),
    custom: !!keep?.lead,
    mutes: keep?.mutes ?? { arp: !arpOn },
  };
}

// An empty canvas in the genre's key, tempo and sounds: nothing plays until the user adds it.
export function blank(g: Genre, seed: number): Song {
  const s = compose(g, seed, 0.5, 0.5);
  const drumBars = s.drumBars.map(() => Object.fromEntries(DRUMS.map((k) => [k, mk()])) as Drums);
  return { ...s, drumBars, bass: [], pad: [], lead: [], arp: [], mutes: {}, custom: false, auto: false, hidden: undefined };
}

// Carry the whole beat into another genre: same key, chords and patterns, new sounds, kit, tempo and feel.
export function transfer(song: Song, g: Genre): Song {
  const from = song.spb, to = g.spb ?? 16;
  const base: Song = { ...song, genre: g, bpm: Math.round((g.bpm[0] + g.bpm[1]) / 2), swing: g.swing, spb: to };
  if (from === to) return base;
  const h = song.hidden ?? {};
  const conv = <T extends { s: number; l: number }>(notes: T[], stash?: T[]): [T[], T[]] => {
    if (to > from) {
      const moved = notes.map((n) => ({ ...n, s: Math.floor(n.s / from) * to + (n.s % from) }));
      return [[...moved, ...(stash ?? [])].sort((a, b) => a.s - b.s), []];
    }
    // 4/4 → 3/4: keep beats one to three, park beat four so it comes back later.
    const keep: T[] = [], hid: T[] = [];
    for (const n of notes) {
      const st = n.s % from;
      if (st < to) keep.push({ ...n, s: Math.floor(n.s / from) * to + st, l: Math.min(n.l, to - st) });
      else hid.push(n);
    }
    return [keep, hid];
  };
  const [bass, hb] = conv(song.bass, h.bass), [lead, hl] = conv(song.lead, h.lead);
  const [arp, ha] = conv(song.arp, h.arp), [pad, hp] = conv(song.pad, h.pad);
  return { ...base, bass, lead, arp, pad, hidden: { bass: hb, lead: hl, arp: ha, pad: hp } };
}

export function regenPart(song: Song, part: TrackId, e: number, c: number): Song {
  const s = regenInner(song, part, e, c);
  return s.hidden && part in s.hidden ? { ...s, hidden: { ...s.hidden, [part]: [] } } : s;
}

function regenInner(song: Song, part: TrackId, e: number, c: number): Song {
  const seed = Math.floor(Math.random() * 1e9);
  const r = rng(seed);
  const g = song.genre;
  if ((DRUMS as readonly string[]).includes(part)) {
    const drumBars = genDrums(g, r, e, c);
    const s = { ...song, drumBars };
    return g.bass === "808" ? { ...s, bass: genBass(s, rng(seed + 2), e, c) } : s;
  }
  if (part === "bass") return { ...song, bass: genBass(song, r, e, c) };
  if (part === "pad") return { ...song, pad: genPad(song, r) };
  if (part === "arp") return { ...song, arp: genArp(song, r), mutes: { ...song.mutes, arp: false } };
  return { ...song, lead: genLead(song, r, g.density * (0.6 + e * 0.8), c), custom: false, mutes: { ...song.mutes, lead: false } };
}

export const MAX_LAYERS = 4;
export const layerCount = (song: Song) => (song.custom ? new Set(song.lead.map((n) => n.y ?? 0)).size : 0);

// Turn tapped notes into a looping melody. The first one replaces the generated lead;
// each one after that is layered on top, optionally on a different instrument.
export function melodize(song: Song, midis: number[], preset?: string): Song {
  const r = rng(Math.floor(Math.random() * 1e9));
  const prev = song.custom ? song.lead : [];
  const top = prev.reduce((a, n) => Math.max(a, n.y ?? 0), -1);
  const y = Math.min(top + 1, MAX_LAYERS - 1);
  const kept = prev.filter((n) => (n.y ?? 0) !== y);
  const layer = genLead(song, r, 0.5, 0, midis).map((n) => ({ ...n, y, v: n.v * (y ? 0.85 : 1), p: y ? preset : undefined }));
  const lead = [...kept, ...layer].sort((a, b) => a.s - b.s);
  return { ...song, lead, custom: true, mutes: { ...song.mutes, lead: false }, hidden: { ...song.hidden, lead: [] } };
}

// Remove the most recently added melody layer.
export function unmelodize(song: Song): Song {
  if (!song.custom) return song;
  const top = song.lead.reduce((a, n) => Math.max(a, n.y ?? 0), 0);
  const lead = song.lead.filter((n) => (n.y ?? 0) !== top);
  return { ...song, lead, custom: lead.length > 0 };
}
