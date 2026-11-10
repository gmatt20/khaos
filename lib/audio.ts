// KHAOS audio engine: everything is synthesized live with the Web Audio API.
import { DRUMS, type Chord, type DrumId, type Note, type Song } from "./music";

type Preset = {
  osc: OscillatorType;
  n?: number; det?: number; ratios?: number[];
  a: number; d: number; s: number; r: number;
  cut: number; env?: number; q?: number; fd?: number;
  sub?: number; fm?: [number, number]; vib?: number; lfo?: number;
  rev?: number; dly?: number; gain: number; drive?: number;
  ks?: [number, number]; twelve?: boolean;
  // Recorded instrument (General MIDI name). The synth definition is the fallback while it loads or offline.
  sf?: string; sfGain?: number; strum?: boolean;
};

export const PRESETS: Record<string, Preset> = {
  sub808: { osc: "sine", a: 0.002, d: 0.5, s: 0.55, r: 0.12, cut: 18000, gain: 0.85, drive: 3 },
  subbass: { osc: "triangle", a: 0.01, d: 0.3, s: 0.8, r: 0.12, cut: 320, sub: 0.6, gain: 0.6 },
  housebass: { osc: "sawtooth", a: 0.002, d: 0.15, s: 0.2, r: 0.08, cut: 420, env: 1100, q: 4, sub: 0.5, gain: 0.5 },
  technobass: { osc: "sawtooth", a: 0.002, d: 0.1, s: 0, r: 0.05, cut: 240, env: 800, q: 6, sub: 0.4, gain: 0.5 },
  synthbass: { osc: "sawtooth", n: 2, det: 8, a: 0.002, d: 0.18, s: 0.3, r: 0.08, cut: 480, env: 1300, q: 3, sub: 0.3, gain: 0.4 },
  funkbass: { sf: "slap_bass_1", sfGain: 1.6, osc: "sawtooth", a: 0.002, d: 0.12, s: 0.15, r: 0.06, cut: 380, env: 1700, q: 5, sub: 0.3, gain: 0.48 },
  reese: { osc: "sawtooth", n: 3, det: 22, a: 0.01, d: 0.3, s: 0.9, r: 0.1, cut: 520, env: 300, q: 2, sub: 0.6, gain: 0.36 },
  wobble: { osc: "sawtooth", n: 3, det: 18, a: 0.005, d: 0.2, s: 1, r: 0.06, cut: 160, lfo: 1500, q: 7, sub: 0.6, gain: 0.36, drive: 2 },
  acid: { osc: "sawtooth", a: 0.002, d: 0.15, s: 0.1, r: 0.08, cut: 300, env: 2600, q: 12, gain: 0.2, dly: 0.3, rev: 0.15 },
  pluck: { osc: "sawtooth", n: 2, det: 10, a: 0.002, d: 0.18, s: 0, r: 0.15, cut: 700, env: 4500, q: 2, rev: 0.25, dly: 0.3, gain: 0.26 },
  supersaw: { osc: "sawtooth", n: 7, det: 28, a: 0.01, d: 0.4, s: 0.8, r: 0.25, cut: 2200, env: 3000, rev: 0.3, gain: 0.1 },
  sawlead: { osc: "sawtooth", n: 3, det: 14, a: 0.01, d: 0.3, s: 0.7, r: 0.2, cut: 1800, env: 2600, vib: 8, rev: 0.25, dly: 0.3, gain: 0.17 },
  square: { osc: "square", n: 2, det: 8, a: 0.003, d: 0.2, s: 0.6, r: 0.12, cut: 2500, env: 2000, dly: 0.25, rev: 0.2, gain: 0.12 },
  bell: { osc: "sine", fm: [3.5, 2.2], a: 0.002, d: 0.9, s: 0, r: 0.6, cut: 18000, rev: 0.45, dly: 0.25, gain: 0.26 },
  epiano: { sf: "electric_piano_1", sfGain: 1.3, osc: "triangle", fm: [1, 0.7], a: 0.003, d: 0.6, s: 0.25, r: 0.3, cut: 1400, env: 1200, rev: 0.3, gain: 0.26 },
  keys: { sf: "acoustic_grand_piano", sfGain: 1.4, osc: "triangle", fm: [2, 0.6], a: 0.002, d: 0.5, s: 0.15, r: 0.25, cut: 3000, rev: 0.22, gain: 0.26 },
  pad: { osc: "sawtooth", n: 4, det: 16, a: 0.5, d: 1, s: 0.85, r: 1.2, cut: 900, rev: 0.5, gain: 0.085 },
  darkpad: { osc: "sawtooth", n: 3, det: 12, a: 0.6, d: 1, s: 0.85, r: 1.5, cut: 520, rev: 0.5, gain: 0.11 },
  lush: { osc: "triangle", n: 4, det: 14, a: 1.2, d: 1, s: 0.9, r: 2.5, cut: 1600, rev: 0.7, dly: 0.3, gain: 0.14 },
  stab: { osc: "sawtooth", n: 3, det: 14, a: 0.003, d: 0.16, s: 0, r: 0.12, cut: 900, env: 2800, q: 2, rev: 0.3, dly: 0.2, gain: 0.14 },
  organ: { sf: "percussive_organ", sfGain: 0.8, osc: "sine", ratios: [1, 2, 3], a: 0.003, d: 0.1, s: 0.7, r: 0.06, cut: 4000, rev: 0.2, gain: 0.13 },
  flute: { sf: "flute", sfGain: 1.1, osc: "sine", vib: 12, a: 0.05, d: 0.2, s: 0.8, r: 0.2, cut: 6000, rev: 0.4, dly: 0.2, gain: 0.26 },
  marimba: { sf: "marimba", sfGain: 1.5, osc: "sine", fm: [4, 1.2], a: 0.001, d: 0.25, s: 0, r: 0.2, cut: 9000, rev: 0.22, dly: 0.15, gain: 0.36 },
  cowbell: { osc: "square", ratios: [1, 1.503], a: 0.001, d: 0.14, s: 0, r: 0.1, cut: 3200, q: 3, rev: 0.15, dly: 0.15, gain: 0.15 },
  brass: { sf: "brass_section", sfGain: 1.0, osc: "sawtooth", n: 2, det: 8, a: 0.03, d: 0.25, s: 0.6, r: 0.12, cut: 600, env: 2400, rev: 0.2, gain: 0.18 },
  // Plucked strings (ks = [brightness, damping]) are physically modelled, not oscillators.
  nylon: { sf: "acoustic_guitar_nylon", sfGain: 1.5, strum: true, osc: "sine", ks: [0.5, 0.996], twelve: true, a: 0, d: 0, s: 0, r: 0.3, cut: 5200, rev: 0.16, gain: 0.2 },
  requinto: { sf: "acoustic_guitar_steel", sfGain: 1.7, osc: "sine", ks: [0.85, 0.998], a: 0, d: 0, s: 0, r: 0.3, cut: 8000, rev: 0.2, dly: 0.08, gain: 0.34 },
  tololoche: { sf: "acoustic_bass", sfGain: 2.0, osc: "sine", ks: [0.3, 0.996], a: 0, d: 0, s: 0, r: 0.15, cut: 1400, sub: 0.5, gain: 0.75 },
  tuba: { sf: "tuba", sfGain: 2.3, osc: "sawtooth", a: 0.012, d: 0.15, s: 0.55, r: 0.07, cut: 280, env: 520, sub: 0.5, gain: 0.55 },
  accordion: { sf: "accordion", sfGain: 1.5, osc: "sawtooth", n: 3, det: 16, a: 0.015, d: 0.2, s: 0.9, r: 0.08, cut: 3000, env: 800, rev: 0.15, gain: 0.12 },
  arp: { osc: "sawtooth", a: 0.002, d: 0.09, s: 0, r: 0.08, cut: 900, env: 3000, q: 2, dly: 0.35, rev: 0.2, gain: 0.15 },
};

type Kit = { k0: number; k1: number; kp: number; kd: number; kdrv: number; st: number; sd: number; sh: number; hf: number; hd: number };
const KITS: Record<string, Kit> = {
  trap: { k0: 150, k1: 43, kp: 0.06, kd: 0.4, kdrv: 1.5, st: 190, sd: 0.16, sh: 1800, hf: 8500, hd: 0.035 },
  house: { k0: 170, k1: 48, kp: 0.09, kd: 0.3, kdrv: 2, st: 200, sd: 0.14, sh: 1500, hf: 9000, hd: 0.04 },
  hard: { k0: 240, k1: 46, kp: 0.12, kd: 0.28, kdrv: 5, st: 210, sd: 0.15, sh: 1600, hf: 9500, hd: 0.03 },
  lofi: { k0: 110, k1: 50, kp: 0.05, kd: 0.2, kdrv: 1, st: 170, sd: 0.12, sh: 900, hf: 5500, hd: 0.04 },
  acoustic: { k0: 140, k1: 52, kp: 0.05, kd: 0.22, kdrv: 1.2, st: 185, sd: 0.2, sh: 1200, hf: 7500, hd: 0.045 },
};

type Sampled = { start(e: { note: number; velocity: number; time: number; duration: number }): (time?: number) => void };
export type Release = (at: number) => void;
const hold = (g: AudioParam, at: number) => (g.cancelAndHoldAtTime ? g.cancelAndHoldAtTime(at) : g.cancelScheduledValues(at));
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
export type Ev = { t: number; k: string; m?: number };

class Engine {
  ctx: AudioContext | null = null;
  analyser!: AnalyserNode;
  private pre!: GainNode; private music!: GainNode; private drums!: GainNode;
  private lpf!: BiquadFilterNode; private hpf!: BiquadFilterNode; private shaper!: WaveShaperNode;
  private rev!: GainNode; private dly!: GainNode; private revRet!: GainNode; private dlyRet!: GainNode;
  private delay!: DelayNode; private noiseBuf!: AudioBuffer; private recDest!: MediaStreamAudioDestinationNode;
  private curves = new Map<number, Float32Array<ArrayBuffer>>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextT = 0;
  private ix: { bass: Note[][]; lead: Note[][]; arp: Note[][]; pad: Chord[][] } | null = null;
  private lastBass = 0;
  private build: { left: number; total: number } | null = null;
  private recorder: MediaRecorder | null = null;
  song: Song | null = null;
  pending = 0; // sampled instruments still downloading
  private samplers = new Map<string, { inst: Sampled | null }>();
  step = 0;
  playing = false;
  ev: Ev[] = [];

  init() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const ctx = (this.ctx = new AudioContext({ latencyHint: "interactive" }));
    const g = (v: number) => { const n = ctx.createGain(); n.gain.value = v; return n; };
    this.pre = g(0.8); this.music = g(1); this.drums = g(1);
    this.lpf = ctx.createBiquadFilter(); this.lpf.type = "lowpass"; this.lpf.frequency.value = 20000; this.lpf.Q.value = 0.9;
    this.hpf = ctx.createBiquadFilter(); this.hpf.type = "highpass"; this.hpf.frequency.value = 20; this.hpf.Q.value = 0.9;
    this.shaper = ctx.createWaveShaper(); this.shaper.curve = this.curve(1); this.shaper.oversample = "2x";
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.006; comp.release.value = 0.18;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -2; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.08; lim.knee.value = 0;
    this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 2048; this.analyser.smoothingTimeConstant = 0.78;
    const out = g(0.9);
    this.music.connect(this.pre); this.drums.connect(this.pre);
    this.pre.connect(this.lpf); this.lpf.connect(this.hpf); this.hpf.connect(this.shaper);
    this.shaper.connect(comp); comp.connect(lim); lim.connect(out); out.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    this.recDest = ctx.createMediaStreamDestination(); out.connect(this.recDest);

    // Noise + generated reverb impulse.
    this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const len = Math.floor(ctx.sampleRate * 3);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const conv = ctx.createConvolver(); conv.buffer = ir;
    this.rev = g(1); this.revRet = g(0.55); this.rev.connect(conv); conv.connect(this.revRet); this.revRet.connect(this.pre);
    this.dly = g(1); this.dlyRet = g(0.45); this.delay = ctx.createDelay(2); this.delay.delayTime.value = 0.3;
    const fb = g(0.38); const dlp = ctx.createBiquadFilter(); dlp.type = "lowpass"; dlp.frequency.value = 3200;
    this.dly.connect(this.delay); this.delay.connect(dlp); dlp.connect(fb); fb.connect(this.delay);
    dlp.connect(this.dlyRet); this.dlyRet.connect(this.pre);
  }

  private curve(k: number) {
    let c = this.curves.get(k);
    if (!c) {
      c = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; c[i] = Math.tanh(x * k) / Math.tanh(k); }
      this.curves.set(k, c);
    }
    return c;
  }

  // ───────── macros
  setFilter(x: number) { this.lpf?.frequency.setTargetAtTime(80 * Math.pow(250, x), this.ctx!.currentTime, 0.04); }
  setSpace(x: number) { this.revRet?.gain.setTargetAtTime(x * 1.3, this.ctx!.currentTime, 0.05); }
  setEcho(x: number) { this.dlyRet?.gain.setTargetAtTime(x * 1.1, this.ctx!.currentTime, 0.05); }
  setDrive(x: number) { if (this.shaper) this.shaper.curve = this.curve(1 + Math.round(x * 14)); }

  setSong(s: Song) {
    this.song = s;
    this.step %= s.spb * 4;
    const ix = { bass: [], lead: [], arp: [], pad: [] } as NonNullable<Engine["ix"]>;
    for (let i = 0; i < 64; i++) { ix.bass.push([]); ix.lead.push([]); ix.arp.push([]); ix.pad.push([]); }
    s.bass.forEach((n) => ix.bass[n.s & 63].push(n));
    s.lead.forEach((n) => ix.lead[n.s & 63].push(n));
    s.arp.forEach((n) => ix.arp[n.s & 63].push(n));
    s.pad.forEach((n) => ix.pad[n.s & 63].push(n));
    this.ix = ix;
    if (!this.ctx) return;
    this.delay.delayTime.setTargetAtTime((60 / s.bpm) * 0.75, this.ctx.currentTime, 0.05);
    const g = s.genre;
    for (const k of [g.bassP, g.padP, g.leadP, g.arpP, g.liveP]) if (PRESETS[k].sf) this.sampler(PRESETS[k]);
  }

  // ───────── transport
  start() {
    if (!this.ctx || !this.song || this.playing) return;
    void this.ctx.resume();
    this.step = 0; this.nextT = this.ctx.currentTime + 0.08; this.playing = true;
    this.timer = setInterval(() => this.tick(), 25);
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null; this.playing = false; this.build = null; this.ev = [];
    if (this.ctx) { this.hpf.frequency.cancelScheduledValues(0); this.hpf.frequency.setValueAtTime(20, this.ctx.currentTime); }
  }
  private tick() {
    const ctx = this.ctx!, s = this.song!;
    while (this.nextT < ctx.currentTime + 0.12) {
      if (this.build && this.build.left <= 0) { this.build = null; this.step = 0; this.drop(this.nextT); }
      this.sched(this.step, this.nextT);
      if (this.build) this.build.left--;
      this.nextT += 60 / s.bpm / 4;
      this.step = (this.step + 1) % (s.spb * 4);
      if (this.step === 0) this.ev.push({ t: this.nextT, k: "loop" });
    }
  }
  drain(): Ev[] {
    if (!this.ctx || !this.ev.length) return [];
    const now = this.ctx.currentTime, due: Ev[] = [], rest: Ev[] = [];
    for (const e of this.ev) (e.t <= now ? due : rest).push(e);
    this.ev = rest;
    return due;
  }

  triggerBuild() {
    if (!this.ctx || !this.song || !this.playing || this.build) return;
    const sp = 60 / this.song.bpm / 4, spb = this.song.spb, total = spb - (this.step % spb) + spb, t = this.ctx.currentTime, d = total * sp;
    this.build = { left: total, total };
    this.riser(t, d);
    this.hpf.frequency.cancelScheduledValues(t); this.hpf.frequency.setValueAtTime(20, t);
    this.hpf.frequency.exponentialRampToValueAtTime(1400, t + d);
  }
  private drop(t: number) {
    this.hpf.frequency.cancelScheduledValues(t); this.hpf.frequency.setValueAtTime(20, t);
    this.crash(t); this.boom(t);
    this.ev.push({ t, k: "drop" });
  }

  private sched(gs: number, t0: number) {
    const s = this.song!, ix = this.ix!, g = s.genre, mu = s.mutes, bl = this.build;
    const sp = 60 / s.bpm / 4, t = t0 + (gs % 2 ? s.swing * sp : 0), bar = Math.floor(gs / s.spb), st = gs % s.spb;
    this.ev.push({ t, k: "step", m: gs });
    const D = s.drumBars[bar];
    for (const id of DRUMS) {
      if (mu[id] || (bl && id === "kick")) continue;
      const v = D[id].v[st];
      if (!v) continue;
      const r = D[id].r[st] || 1;
      for (let k = 0; k < r; k++) this.drum(id, t + (k * sp) / r, v * (k ? 0.7 : 1) * (0.9 + Math.random() * 0.1));
      this.ev.push({ t, k: id });
      if (id === "kick" && g.sidechain) {
        this.music.gain.setValueAtTime(1 - g.sidechain, t);
        this.music.gain.linearRampToValueAtTime(1, t + sp * 3);
      }
    }
    if (bl) {
      const p = 1 - bl.left / bl.total;
      if (p >= 0.5 || st % 2 === 0) {
        const r = bl.left <= 4 ? 2 : 1;
        for (let k = 0; k < r; k++) this.drum("snare", t + (k * sp) / r, 0.35 + p * 0.65);
        this.ev.push({ t, k: "snare" });
      }
    }
    if (!mu.bass && !bl) for (const n of ix.bass[gs]) {
      this.synth(PRESETS[g.bassP], t, n.m, n.l * sp * 0.95, n.v, { from: n.g ? this.lastBass : 0, wob: n.w ? (s.bpm / 60) * n.w * 0.5 : 0 });
      this.lastBass = n.m; this.ev.push({ t, k: "808" });
    }
    if (!mu.pad) for (const c of ix.pad[gs]) {
      const pp = PRESETS[g.padP];
      c.ms.forEach((m, i) => this.synth(pp, t + (pp.ks || pp.strum ? i * 0.014 : 0), m, c.l * sp * 0.96, c.v)); // strum
      this.ev.push({ t, k: "chord", m: c.d });
    }
    if (!mu.lead) for (const n of ix.lead[gs]) { this.synth(PRESETS[n.p ?? g.leadP], t + Math.random() * 0.006, n.m, n.l * sp * 0.9, n.v * (0.82 + Math.random() * 0.18)); this.ev.push({ t, k: "note", m: n.m }); }
    if (!mu.arp) for (const n of ix.arp[gs]) this.synth(PRESETS[g.arpP], t, n.m, n.l * sp * 0.8, n.v * (0.8 + Math.random() * 0.2));
  }

  // ───────── live pads
  now() { return (this.ctx?.currentTime ?? 0) + 0.004; }
  // Notes ring for as long as the pad is held; the returned function lets go of them.
  noteOn(preset: string, ms: number[], vel = 0.92): () => void {
    if (!this.ctx) return () => {};
    const p = PRESETS[preset], t = this.now();
    const rel = ms.map((m, i) => this.synth(p, t + (p.ks || p.strum ? i * 0.014 : 0), m, 8, vel * (0.9 + Math.random() * 0.1)));
    const min = t + 0.09; // even a tap gets a full attack
    return () => rel.forEach((r) => r(Math.max(this.now(), min)));
  }
  playDrum(id: string) { if (!this.ctx) return; if (id === "crash") this.crash(this.now()); else this.drum(id as DrumId, this.now(), 1); }

  // ───────── voices
  private synth(p: Preset, t: number, midi: number, dur: number, vel: number, o: { from?: number; wob?: number } = {}): Release {
    if (p.sf) {
      const inst = this.sampler(p);
      if (inst) return inst.start({ note: midi, velocity: Math.round(Math.min(1, vel) * 115), time: t, duration: dur });
    }
    if (p.ks) return this.pluck(p, t, midi, dur, vel);
    const ctx = this.ctx!, f = mtof(midi), end = t + dur + p.r * 1.6 + 0.05;
    const amp = ctx.createGain(), filt = ctx.createBiquadFilter();
    filt.type = "lowpass"; filt.Q.value = p.q ?? 0.8;
    if (p.env) {
      filt.frequency.setValueAtTime(Math.min(18000, p.cut + p.env * (0.4 + vel * 0.6)), t);
      filt.frequency.setTargetAtTime(p.cut, t, (p.fd ?? p.d) / 3);
    } else filt.frequency.value = p.lfo ? p.cut + p.lfo : p.cut;
    const ratios = p.ratios ?? Array.from({ length: p.n ?? 1 }, () => 1);
    const n = ratios.length, mix = ctx.createGain();
    mix.gain.value = 1 / Math.sqrt(n);
    const oscs: OscillatorNode[] = [];
    ratios.forEach((ra, i) => {
      const osc = ctx.createOscillator();
      osc.type = p.osc;
      if (o.from) { osc.frequency.setValueAtTime(mtof(o.from) * ra, t); osc.frequency.exponentialRampToValueAtTime(f * ra, t + 0.09); }
      else osc.frequency.value = f * ra;
      if (!p.ratios && n > 1) osc.detune.value = (i / (n - 1) - 0.5) * 2 * (p.det ?? 0);
      osc.connect(mix); oscs.push(osc);
    });
    const extra: OscillatorNode[] = [];
    if (p.fm) {
      const mo = ctx.createOscillator(), mg = ctx.createGain();
      mo.frequency.value = f * p.fm[0];
      mg.gain.setValueAtTime(f * p.fm[1], t); mg.gain.setTargetAtTime(f * p.fm[1] * 0.25, t, p.d / 2);
      mo.connect(mg); oscs.forEach((x) => mg.connect(x.frequency)); extra.push(mo);
    }
    if (p.vib) {
      const lo = ctx.createOscillator(), lg = ctx.createGain();
      lo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(p.vib, t + 0.25);
      lo.connect(lg); oscs.forEach((x) => lg.connect(x.detune)); extra.push(lo);
    }
    if (p.lfo) {
      const lo = ctx.createOscillator(), lg = ctx.createGain();
      lo.frequency.value = o.wob || 4; lg.gain.value = p.lfo * 0.95;
      lo.connect(lg); lg.connect(filt.frequency); extra.push(lo);
    }
    mix.connect(filt);
    if (p.sub) {
      const so = ctx.createOscillator(), sg = ctx.createGain();
      so.type = "sine"; so.frequency.value = f; sg.gain.value = p.sub;
      so.connect(sg); sg.connect(amp); extra.push(so);
    }
    let src: AudioNode = filt;
    if (p.drive) { const ws = ctx.createWaveShaper(); ws.curve = this.curve(p.drive); filt.connect(ws); src = ws; }
    src.connect(amp);
    const peak = vel * p.gain;
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(peak, t + p.a);
    amp.gain.setTargetAtTime(peak * p.s, t + p.a, p.d / 3);
    amp.gain.setTargetAtTime(0, t + Math.max(dur, p.a), p.r / 4);
    amp.connect(this.music);
    const sends: GainNode[] = [];
    if (p.rev) { const sg = ctx.createGain(); sg.gain.value = p.rev; amp.connect(sg); sg.connect(this.rev); sends.push(sg); }
    if (p.dly) { const sg = ctx.createGain(); sg.gain.value = p.dly; amp.connect(sg); sg.connect(this.dly); sends.push(sg); }
    [...oscs, ...extra].forEach((x) => { x.start(t); x.stop(end); });
    oscs[0].onended = () => { amp.disconnect(); sends.forEach((x) => x.disconnect()); };
    return (at) => {
      hold(amp.gain, at); amp.gain.setTargetAtTime(0, at, p.r / 4);
      [...oscs, ...extra].forEach((x) => x.stop(at + p.r * 1.6 + 0.05));
    };
  }

  // Lazily fetch a recorded instrument and wire it into the mix; returns null until it is ready.
  private sampler(p: Preset): Sampled | null {
    const name = p.sf!;
    let e = this.samplers.get(name);
    if (!e) {
      const entry = (e = { inst: null as Sampled | null });
      this.samplers.set(name, entry);
      const ctx = this.ctx!, out = ctx.createGain();
      out.gain.value = p.sfGain ?? 1; out.connect(this.music);
      if (p.rev) { const sg = ctx.createGain(); sg.gain.value = p.rev; out.connect(sg); sg.connect(this.rev); }
      if (p.dly) { const sg = ctx.createGain(); sg.gain.value = p.dly; out.connect(sg); sg.connect(this.dly); }
      this.pending++;
      import("smplr")
        .then(({ Soundfont }) => {
          const inst = Soundfont(ctx, { instrument: name, kit: "MusyngKite", destination: out });
          return inst.load.then(() => { entry.inst = inst as unknown as Sampled; });
        })
        .catch((err) => console.warn(`KHAOS: could not load ${name}, using the synth version`, err))
        .finally(() => { this.pending--; });
    }
    return e.inst;
  }

  // Karplus-Strong string, rendered once per pitch and cached.
  private ksCache = new Map<string, AudioBuffer>();
  private ksBuf(midi: number, bright: number, damp: number) {
    const key = `${midi}:${bright}:${damp}`;
    let buf = this.ksCache.get(key);
    if (buf) return buf;
    const sr = this.ctx!.sampleRate, N = Math.max(2, Math.round(sr / mtof(midi))), len = Math.floor(sr * 2.2);
    buf = this.ctx!.createBuffer(1, len, sr);
    const o = buf.getChannelData(0), d = new Float32Array(N);
    let prev = 0, mean = 0, peak = 0;
    for (let i = 0; i < N; i++) { prev += bright * (Math.random() * 2 - 1 - prev); d[i] = prev; mean += prev / N; }
    for (let i = 0; i < N; i++) d[i] -= mean;
    for (let i = 0; i < len; i++) {
      const j = i % N, v = d[j];
      o[i] = v; peak = Math.max(peak, Math.abs(v));
      d[j] = damp * 0.5 * (v + d[(j + 1) % N]);
    }
    for (let i = 0; i < len; i++) o[i] *= (0.9 / peak) * Math.min(1, (len - i) / 3000);
    this.ksCache.set(key, buf);
    return buf;
  }
  private pluck(p: Preset, t: number, midi: number, dur: number, vel: number): Release {
    const ctx = this.ctx!, sr = ctx.sampleRate, end = t + dur + p.r * 1.6 + 0.05;
    const filt = this.filter("lowpass", p.cut * (0.6 + vel * 0.4)), amp = ctx.createGain();
    const string = (m: number, at: number, g: number) => {
      const src = ctx.createBufferSource(), sg = ctx.createGain(), N = Math.max(2, Math.round(sr / mtof(m)));
      src.buffer = this.ksBuf(m, p.ks![0], p.ks![1]);
      src.playbackRate.value = (mtof(m) * (N + 0.5)) / sr; // correct the integer-delay tuning error
      sg.gain.value = g; src.connect(sg); sg.connect(filt);
      src.start(at); src.stop(end);
      return src;
    };
    const main = string(midi, t, 1), strings = [main];
    if (p.twelve) strings.push(string(midi + 12, t + 0.007, 0.4));
    filt.connect(amp);
    if (p.sub) {
      const so = ctx.createOscillator();
      so.frequency.value = mtof(midi);
      so.connect(this.env(t, p.sub, 0.45, amp)); so.start(t); so.stop(t + 0.5);
    }
    amp.gain.setValueAtTime(vel * p.gain, t);
    amp.gain.setTargetAtTime(0, t + dur, p.r / 4);
    amp.connect(this.music);
    const sends: GainNode[] = [];
    if (p.rev) { const sg = ctx.createGain(); sg.gain.value = p.rev; amp.connect(sg); sg.connect(this.rev); sends.push(sg); }
    if (p.dly) { const sg = ctx.createGain(); sg.gain.value = p.dly; amp.connect(sg); sg.connect(this.dly); sends.push(sg); }
    main.onended = () => { amp.disconnect(); sends.forEach((x) => x.disconnect()); };
    return (at) => {
      hold(amp.gain, at); amp.gain.setTargetAtTime(0, at, p.r / 4);
      strings.forEach((x) => x.stop(at + p.r * 1.6 + 0.05));
    };
  }

  private noise(t: number, dur: number) {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true;
    src.start(t, Math.random() * 1.5); src.stop(t + dur);
    return src;
  }
  private env(t: number, peak: number, dec: number, dest: AudioNode = this.drums) {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dec);
    g.connect(dest);
    return g;
  }
  private filter(type: BiquadFilterType, f: number, q = 0.8) {
    const b = this.ctx!.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b;
  }
  private blip(t: number, type: OscillatorType, f0: number, f1: number, pd: number, peak: number, dec: number, dest?: AudioNode) {
    const o = this.ctx!.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + pd);
    o.connect(this.env(t, peak, dec, dest)); o.start(t); o.stop(t + dec + 0.02);
  }

  private drum(id: DrumId, t: number, v: number) {
    const ctx = this.ctx!, g = this.song?.genre, k = KITS[g?.kit ?? "trap"];
    switch (id) {
      case "kick": {
        const ws = ctx.createWaveShaper(); ws.curve = this.curve(k.kdrv); ws.connect(this.drums);
        this.blip(t, "sine", k.k0, k.k1, k.kp, v, k.kd, ws);
        this.blip(t, "triangle", k.k0 * 4, k.k0, 0.015, v * 0.3, 0.03);
        break;
      }
      case "snare": {
        const n = this.noise(t, k.sd + 0.05), hp = this.filter("highpass", k.sh);
        n.connect(hp); hp.connect(this.env(t, v * 0.55, k.sd));
        this.blip(t, "triangle", k.st * 1.4, k.st, 0.04, v * 0.4, 0.1);
        const sg = ctx.createGain(); sg.gain.value = 0.12; hp.connect(sg); const e = this.env(t, v * 0.5, k.sd, this.rev); sg.connect(e);
        break;
      }
      case "clap": {
        const n = this.noise(t, 0.3), bp = this.filter("bandpass", 1150, 1.3), g2 = ctx.createGain();
        g2.gain.setValueAtTime(0, t);
        [0, 0.011, 0.023].forEach((o) => { g2.gain.setValueAtTime(v * 0.75, t + o); g2.gain.exponentialRampToValueAtTime(0.05, t + o + 0.009); });
        g2.gain.setValueAtTime(v * 0.6, t + 0.032); g2.gain.exponentialRampToValueAtTime(0.0008, t + 0.2);
        n.connect(bp); bp.connect(g2); g2.connect(this.drums);
        const sg = ctx.createGain(); sg.gain.value = 0.2; g2.connect(sg); sg.connect(this.rev);
        break;
      }
      case "hat": case "ohat": {
        const dec = id === "hat" ? k.hd : 0.24, n = this.noise(t, dec + 0.03);
        const hp = this.filter("highpass", k.hf), bp = this.filter("peaking", 10500, 1.2); bp.gain.value = 6;
        n.connect(hp); hp.connect(bp); bp.connect(this.env(t, v * (id === "hat" ? 0.26 : 0.2), dec));
        break;
      }
      case "perc": {
        const pt = g?.perc ?? "rim";
        if (pt === "conga") this.blip(t, "sine", 330, 210, 0.08, v * 0.5, 0.18);
        else if (pt === "tom") this.blip(t, "sine", 190, 90, 0.18, v * 0.6, 0.3);
        else if (pt === "cowbell") {
          const bp = this.filter("bandpass", 2600, 2.5); bp.connect(this.drums);
          this.blip(t, "square", 800, 800, 0.1, v * 0.22, 0.16, bp); this.blip(t, "square", 540, 540, 0.1, v * 0.22, 0.16, bp);
        } else if (pt === "shaker") {
          const n = this.noise(t, 0.1), hp = this.filter("highpass", 6000); n.connect(hp); hp.connect(this.env(t, v * 0.2, 0.07));
        } else {
          this.blip(t, "triangle", 1700, 900, 0.01, v * 0.4, 0.035);
          const n = this.noise(t, 0.04), bp = this.filter("bandpass", 2400, 3); n.connect(bp); bp.connect(this.env(t, v * 0.3, 0.025));
        }
        break;
      }
    }
  }
  private crash(t: number) {
    const n = this.noise(t, 2), hp = this.filter("highpass", 4500);
    n.connect(hp); const e = this.env(t, 0.32, 1.8); hp.connect(e);
    const sg = this.ctx!.createGain(); sg.gain.value = 0.5; e.connect(sg); sg.connect(this.rev);
  }
  private boom(t: number) { this.blip(t, "sine", 110, 30, 0.5, 0.9, 1.6); }
  private riser(t: number, d: number) {
    const n = this.noise(t, d + 0.05), bp = this.filter("bandpass", 300, 1.5), g = this.ctx!.createGain();
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(9000, t + d);
    g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.4, t + d); g.gain.setValueAtTime(0, t + d + 0.01);
    n.connect(bp); bp.connect(g); g.connect(this.drums); g.connect(this.rev);
  }

  // ───────── recording
  startRec() {
    if (!this.ctx || this.recorder) return;
    const chunks: Blob[] = [];
    const rec = (this.recorder = new MediaRecorder(this.recDest.stream));
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => {
      const type = rec.mimeType || "audio/webm";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(chunks, { type }));
      a.download = `khaos-${this.song?.genre.id ?? "beat"}-${Date.now()}.${type.includes("mp4") ? "m4a" : "webm"}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    };
    rec.start();
  }
  stopRec() { this.recorder?.stop(); this.recorder = null; }
}

export const engine = new Engine();
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") (window as unknown as { __khaos: Engine }).__khaos = engine;
