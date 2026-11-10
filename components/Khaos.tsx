"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { engine } from "@/lib/audio";
import {
  DRUMS, GENRES, MAX_LAYERS, NOTE_NAMES, SCALES, TRACKS, blank, chordName, compose, deg2midi, leadRoot, melodize, mod,
  layerCount, regenPart, roman, transfer, unmelodize, voice, type DrumId, type Song, type TrackId,
} from "@/lib/music";
import Visualizer, { type VizBus } from "./Visualizer";

const KEY_ROWS = ["12345678", "qwertyui", "asdfghjk", "zxcvbnm,"];
const TRACK_LABEL: Record<TrackId, string> = {
  kick: "Kick", snare: "Snare", clap: "Clap", hat: "Hat", ohat: "Open", perc: "Perc",
  bass: "Bass", pad: "Chords", lead: "Lead", arp: "Arp",
};
const TRACK_COLOR: Record<TrackId, string> = {
  kick: "var(--c1)", snare: "var(--c1)", clap: "var(--c1)", hat: "var(--c2)", ohat: "var(--c2)", perc: "var(--c2)",
  bass: "var(--c3)", pad: "var(--c3)", lead: "#fff", arp: "#fff",
};

type Pad = {
  id: string; key: string; label: string; sub: string; color: string; flash: string;
  type: "lead" | "chord" | "drum" | "bass"; midi?: number; ms?: number[]; drum?: string; preset?: string;
};

const noteName = (m: number) => NOTE_NAMES[mod(m, 12)];
const LABELS: Record<string, string> = {
  sawlead: "Saw lead", epiano: "Electric piano", keys: "Piano", nylon: "Guitar", requinto: "Requinto", supersaw: "Supersaw",
  darkpad: "Dark pad", lush: "Lush pad", square: "Square lead", sub808: "808", brass: "Brass",
};
const label = (preset: string) => LABELS[preset] ?? preset[0].toUpperCase() + preset.slice(1);
// The second melody row gets a contrasting instrument so the two rows never sound alike.
const secondVoice = (s: Song) => [s.genre.liveP, s.genre.padP, "keys", "pluck"].find((x) => x !== s.genre.leadP && !["pad", "darkpad", "lush"].includes(x))!;
const newSeed = () => Math.floor(Math.random() * 1e9);

export default function Khaos() {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [song, setSong] = useState<Song | null>(null);
  const [step, setStep] = useState(0);
  const [energy, setEnergy] = useState(0.65);
  const [chaos, setChaos] = useState(0.5);
  const [filter, setFilter] = useState(1);
  const [space, setSpace] = useState(0.42);
  const [echo, setEcho] = useState(0.4);
  const [drive, setDrive] = useState(0);
  const [captured, setCaptured] = useState<number[]>([]);
  const [visual, setVisual] = useState(false);
  const [rec, setRec] = useState(false);
  const [auto, setAuto] = useState(false);
  const [building, setBuilding] = useState(false);
  const [loading, setLoading] = useState(false);

  const songRef = useRef<Song | null>(null);
  const live = useRef({ energy, chaos, auto, captured });
  live.current = { energy, chaos, auto, captured };
  const padEls = useRef<Record<string, HTMLElement | null>>({});
  const coreRef = useRef<HTMLButtonElement>(null);
  const bus = useRef<VizBus>({ kick: 0, snare: 0, burst: 0, drop: 0 });
  const loops = useRef(0);

  const apply = useCallback((s: Song) => { songRef.current = s; engine.setSong(s); setSong(s); }, []);

  const generate = useCallback((gid?: string) => {
    const g = GENRES.find((x) => x.id === (gid ?? songRef.current?.genre.id)) ?? GENRES[0];
    apply({ ...compose(g, newSeed(), live.current.energy, live.current.chaos), auto: true });
    setCaptured([]);
    if (!engine.playing) { engine.init(); engine.start(); setPlaying(true); }
    bus.current.burst++;
    coreRef.current?.animate([{ transform: "scale(.9)" }, { transform: "scale(1)" }], { duration: 500, easing: "cubic-bezier(.2,1.6,.4,1)" });
  }, [apply]);

  // Switching genre keeps the beat and re-voices it with the new genre's sounds, kit and tempo.
  const pickGenre = useCallback((gid: string) => {
    const g = GENRES.find((x) => x.id === gid) ?? GENRES[0], s = songRef.current;
    apply(s ? transfer(s, g) : blank(g, newSeed()));
    bus.current.burst++;
  }, [apply]);

  const togglePlay = useCallback(() => {
    if (engine.playing) { engine.stop(); setPlaying(false); setBuilding(false); }
    else { engine.init(); engine.start(); setPlaying(true); }
  }, []);

  const ignite = useCallback(() => {
    engine.init();
    engine.setSpace(0.42); engine.setEcho(0.4);
    apply(blank(GENRES[0], newSeed()));
    setStarted(true);
  }, [apply]);

  // ───────── pads
  const pads = useMemo<Pad[][]>(() => {
    if (!song) return [];
    const sc = SCALES[song.scale], lr = leadRoot(song.root), voice2 = secondVoice(song);
    const lead = (row: number, off: number): Pad[] => Array.from({ length: 8 }, (_, i) => {
      const midi = deg2midi(lr, sc, off + i);
      return { preset: row ? voice2 : song.genre.leadP, id: `r${row}c${i}`, key: KEY_ROWS[row][i], label: noteName(midi), sub: mod(off + i, 7) === 0 ? "root" : "", color: row ? "var(--c2)" : "var(--c3)", flash: "n" + midi, type: "lead", midi };
    });
    const chords: Pad[] = Array.from({ length: 8 }, (_, i) => {
      // Full voicing: bass root underneath, the chord, and its top note doubled an octave up.
      const mid = voice(song.root, song.scale, i, Math.max(4, song.genre.ext)).map((m) => (i === 7 ? m + 12 : m));
      const ms = [36 + mod(song.root + sc[i % 7], 12), ...mid, mid[0] + 12];
      return { id: `r2c${i}`, key: KEY_ROWS[2][i], label: chordName(song.root, song.scale, i), sub: roman(song.scale, i), color: "var(--c1)", flash: "c" + (i === 7 ? 99 : i), type: "chord", ms, preset: song.genre.liveP };
    });
    const pc = song.root + 36 > 43 ? song.root + 24 : song.root + 36;
    const d = (i: number, drum: string, label: string): Pad => ({ id: `r3c${i}`, key: KEY_ROWS[3][i], label, sub: "", color: "#ffffff", flash: "d" + drum, type: "drum", drum });
    const drums: Pad[] = [
      d(0, "kick", "Kick"), d(1, "snare", "Snare"), d(2, "clap", "Clap"), d(3, "hat", "Hat"), d(4, "ohat", "Open"), d(5, "perc", "Perc"),
      { id: "r3c6", key: "m", label: "808", sub: noteName(pc), color: "#ffffff", flash: "d808", type: "bass", midi: pc, preset: song.genre.bassP },
      d(7, "crash", "Crash"),
    ];
    return [lead(0, 7), lead(1, 0), chords, drums];
  }, [song]);

  const flashMap = useMemo(() => {
    const m: Record<string, string[]> = {};
    pads.flat().forEach((p) => (m[p.flash] ??= []).push(p.id));
    return m;
  }, [pads]);
  const flashRef = useRef(flashMap);
  flashRef.current = flashMap;

  const flash = useCallback((key: string, strong = false) => {
    for (const id of flashRef.current[key] ?? []) {
      const el = padEls.current[id];
      if (!el) continue;
      el.querySelector(".glow")?.animate([{ opacity: strong ? 1 : 0.55 }, { opacity: 0 }], { duration: strong ? 520 : 300, easing: "ease-out" });
      if (strong) el.animate([{ transform: "scale(.93)" }, { transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(.2,1.8,.4,1)" });
    }
  }, []);

  const held = useRef<Record<string, () => void>>({});
  const release = useCallback((id: string) => { held.current[id]?.(); delete held.current[id]; }, []);
  const hit = useCallback((p: Pad) => {
    if (!songRef.current || held.current[p.id]) return;
    engine.init();
    if (p.type === "drum") { engine.playDrum(p.drum!); if (p.drum === "kick") bus.current.kick++; else bus.current.snare++; }
    else {
      held.current[p.id] = engine.noteOn(p.preset!, p.ms ?? [p.midi!]);
      if (p.type === "lead") setCaptured((c) => [...c, p.midi!].slice(-32));
      bus.current.burst++;
    }
    flash(p.flash, true);
  }, [flash]);

  // ───────── engine → UI sync
  useEffect(() => {
    if (!started) return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      setLoading(engine.pending > 0);
      for (const e of engine.drain()) {
        if (e.k === "step") {
          setStep(e.m!);
          // Auto-evolve: rewrite one part every two bars.
          const s = songRef.current;
          if (live.current.auto && s && e.m! % (s.spb * 2) === 0 && loops.current++ > 0) {
            const part = (["lead", "kick", "bass", "arp", "pad"] as TrackId[])[Math.floor(Math.random() * 5)];
            if (!(part === "lead" && s.custom)) apply(regenPart(s, part, live.current.energy, live.current.chaos));
          }
        }
        else if (e.k === "note") flash("n" + e.m);
        else if (e.k === "chord") flash("c" + e.m);
        else if (e.k === "drop") { bus.current.drop++; setBuilding(false); }
        else if (e.k === "loop") {
        } else {
          flash("d" + e.k);
          if (e.k === "kick") {
            bus.current.kick++;
            coreRef.current?.animate([{ transform: "scale(1.06)" }, { transform: "scale(1)" }], { duration: 220, easing: "ease-out" });
          } else if (e.k === "snare" || e.k === "clap") bus.current.snare++;
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, flash, apply]);

  // ───────── keyboard
  const padsRef = useRef(pads);
  padsRef.current = pads;
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!started) { if (!e.repeat) ignite(); return; }
      if (e.key === " ") { e.preventDefault(); if (!e.repeat) togglePlay(); return; }
      if (e.key === "Enter") { e.preventDefault(); if (!e.repeat) generate(); return; }
      if (e.key === "Escape") { setVisual(false); return; }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const i = GENRES.findIndex((g) => g.id === songRef.current?.genre.id);
        pickGenre(GENRES[mod(i + (e.key === "ArrowRight" ? 1 : -1), GENRES.length)].id);
        return;
      }
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      for (let r = 0; r < 4; r++) {
        const c = KEY_ROWS[r].indexOf(k);
        if (c >= 0 && padsRef.current[r]) { hit(padsRef.current[r][c]); return; }
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      for (let r = 0; r < 4; r++) { const c = KEY_ROWS[r].indexOf(k); if (c >= 0) release(`r${r}c${c}`); }
    };
    const drop = () => Object.keys(held.current).forEach(release);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", drop);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", drop); };
  }, [started, ignite, togglePlay, generate, pickGenre, hit, release]);

  // ───────── edits
  const toggleStep = (id: DrumId, i: number) => {
    const s = songRef.current;
    if (!s) return;
    const bar = engine.playing ? Math.floor(step / s.spb) : 0;
    const v = s.drumBars[bar][id].v[i] ? 0 : 0.9;
    const drumBars = s.drumBars.map((b) => ({ ...b, [id]: { v: b[id].v.map((x, j) => (j === i ? v : x)), r: b[id].r.map((x, j) => (j === i ? 1 : x)) } }));
    apply({ ...s, drumBars });
    if (v && !engine.playing) togglePlay();
    else if (v) engine.playDrum(id);
  };
  const toggleMute = (t: TrackId) => { const s = songRef.current; if (s) apply({ ...s, mutes: { ...s.mutes, [t]: !s.mutes[t] } }); };
  const reroll = (t: TrackId) => { const s = songRef.current; if (!s) return; apply(regenPart(s, t, energy, chaos)); if (!engine.playing) togglePlay(); };
  const recompose = (e: number, c: number) => {
    const s = songRef.current;
    if (s?.auto) apply({ ...compose(s.genre, s.seed, e, c, { bpm: s.bpm, lead: s.custom ? s.lead : undefined, mutes: s.mutes }), auto: true });
  };
  const setBpm = (d: number) => { const s = songRef.current; if (s) apply({ ...s, bpm: Math.max(60, Math.min(200, s.bpm + d)) }); };
  const doMelodize = () => {
    const s = songRef.current;
    if (!s || !captured.length) return;
    // Every other layer plays on the second-row instrument so stacked melodies stay distinct.
    apply(melodize(s, captured, layerCount(s) % 2 ? secondVoice(s) : undefined));
    setCaptured([]); // ready for the next phrase
    bus.current.burst++;
    if (!engine.playing) togglePlay();
  };

  const melSteps = useMemo(() => {
    const m: Record<string, Map<number, number>> = { bass: new Map(), pad: new Map(), lead: new Map(), arp: new Map() };
    if (song) for (const k of ["bass", "pad", "lead", "arp"] as const) song[k].forEach((n) => m[k].set(n.s, n.v));
    return m;
  }, [song]);

  const g = song?.genre;
  const layers = song ? layerCount(song) : 0;
  const colors = g?.colors ?? GENRES[0].colors;
  const spb = song?.spb ?? 16;
  const bar = playing ? Math.floor(step / spb) : 0;
  const cur = playing ? step % spb : -1;
  const rootStyle = { "--c1": colors[0], "--c2": colors[1], "--c3": colors[2] } as CSSProperties;

  return (
    <div style={rootStyle} className="khaos relative min-h-dvh overflow-x-hidden text-white">
      <Visualizer bus={bus} colors={colors} anchor={coreRef} centered={visual || !started} />

      {/* Intro */}
      <div className={`fixed inset-0 z-30 flex flex-col items-center justify-center transition-all duration-700 ${started ? "pointer-events-none scale-110 opacity-0" : "opacity-100"}`}>
        <div className="mb-5 text-[11px] font-medium uppercase tracking-[0.5em] text-white/50">Personal AI DJ</div>
        <h1 className="logo-text text-[clamp(72px,17vw,240px)] font-semibold leading-none tracking-[-0.04em]">KHAOS</h1>
        <p className="mt-5 max-w-md text-center text-[17px] leading-relaxed text-white/60">
          Zero music theory. Every pad is in key. Pick a genre, mash some keys, and walk away with a beat.
        </p>
        <button onClick={ignite} className="cta mt-10 rounded-full px-9 py-4 text-[15px] font-semibold tracking-wide text-black">
          Start the KHAOS
        </button>
        <div className="mt-5 text-xs text-white/35">or press any key</div>
      </div>

      {visual && (
        <button onClick={() => setVisual(false)} className="fixed inset-0 z-20 cursor-zoom-out">
          <span className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-xs text-white/60 backdrop-blur-xl">
            {g?.name} · {song?.bpm} BPM — click or press Esc to return
          </span>
        </button>
      )}

      {/* App */}
      <div className={`relative z-10 mx-auto flex min-h-dvh max-w-[1560px] flex-col gap-3 px-4 pb-4 transition-all duration-700 sm:px-6 ${started && !visual ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}>
        <header className="flex h-14 shrink-0 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="logo-dot h-3 w-3 rounded-full" />
            <span className="text-[15px] font-semibold tracking-[0.32em]">KHAOS</span>
          </div>
          <div className="glass flex items-center gap-1 !rounded-full p-1">
            <button onClick={togglePlay} aria-label={playing ? "Stop" : "Play"} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition active:scale-90">
              {playing ? <svg width="12" height="12"><rect width="12" height="12" rx="2" /></svg> : <svg width="12" height="14"><path d="M1 0l11 7-11 7z" /></svg>}
            </button>
            <button onClick={() => setBpm(-2)} className="chip-btn">−</button>
            <div className="w-[70px] text-center text-[13px] font-medium tabular-nums">{song?.bpm ?? "—"} <span className="text-white/40">BPM</span></div>
            <button onClick={() => setBpm(2)} className="chip-btn">+</button>
            <div className="mx-1 h-5 w-px bg-white/10" />
            <div className="px-3 text-[13px] font-medium">{song ? `${NOTE_NAMES[song.root]} ${song.scale}` : ""}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAuto((a) => !a)} className={`tog ${auto ? "on" : ""}`} title="Let KHAOS keep evolving the beat">Auto-evolve</button>
            <button onClick={() => { engine.triggerBuild(); if (engine.playing) setBuilding(true); }} className={`tog ${building ? "on pulse" : ""}`} title="Build-up, then drop">{building ? "Building…" : "Build → Drop"}</button>
            <button onClick={() => { if (rec) engine.stopRec(); else engine.startRec(); setRec(!rec); }} className={`tog ${rec ? "rec" : ""}`}>
              <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${rec ? "animate-pulse bg-white" : "bg-red-500"}`} />{rec ? "Save" : "Rec"}
            </button>
            <button onClick={() => setVisual(true)} className="tog">Visual</button>
          </div>
        </header>

        {/* Hero */}
        <section className="grid shrink-0 grid-cols-1 items-center gap-4 py-2 lg:grid-cols-[1fr_auto_1fr]">
          <div key={`${song?.seed}-${g?.id}`} className="rise order-2 text-center lg:order-1 lg:text-left">
            <div className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/45">{g?.tag}{loading && <span className="animate-pulse"> · loading real instruments…</span>}</div>
            <div className="mt-1 text-[clamp(40px,5.2vw,76px)] font-semibold leading-[1.02] tracking-[-0.03em]">{g?.name}</div>
            <div className="mt-2 text-[13px] text-white/55">
              {song && (song.auto || playing
                ? <>{NOTE_NAMES[song.root]} {song.scale} · {song.prog.map((d) => roman(song.scale, d)).join(" – ")} · bar {bar + 1}/4</>
                : <>Empty canvas — click steps, hit ⟳ on a track, or play the pads. KHAOS fills in a full beat.</>)}
            </div>
          </div>
          <div className="order-1 flex h-[200px] w-[260px] items-center justify-center justify-self-center lg:order-2">
            <button ref={coreRef} onClick={() => generate()} className="core group" aria-label="Generate a new beat">
              <span className="text-[15px] font-semibold tracking-[0.28em]">KHAOS</span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/55">new beat ↵</span>
            </button>
          </div>
          <div className="glass order-3 grid grid-cols-3 gap-x-4 gap-y-3 justify-self-stretch p-4 lg:w-[460px] lg:justify-self-end">
            <Macro label="Energy" v={energy} set={setEnergy} commit={(v) => recompose(v, chaos)} />
            <Macro label="Khaos" v={chaos} set={setChaos} commit={(v) => recompose(energy, v)} />
            <Macro label="Filter" v={filter} set={(v) => { setFilter(v); engine.setFilter(v); }} />
            <Macro label="Space" v={space} set={(v) => { setSpace(v); engine.setSpace(v); }} />
            <Macro label="Echo" v={echo} set={(v) => { setEcho(v); engine.setEcho(v); }} />
            <Macro label="Drive" v={drive} set={(v) => { setDrive(v); engine.setDrive(v); }} />
          </div>
        </section>

        {/* Genres */}
        <nav className="no-sb -mx-4 flex shrink-0 gap-2 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6">
          {GENRES.map((x) => (
            <button key={x.id} onClick={() => pickGenre(x.id)} className={`genre ${g?.id === x.id ? "on" : ""}`} style={{ "--g1": x.colors[0], "--g2": x.colors[1] } as CSSProperties}>
              <span className="dot" />{x.name}
            </button>
          ))}
        </nav>

        {/* Pads + sequencer */}
        <main className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
          <section className="glass flex flex-col p-4">
            <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/45">
              <span>Launchpad</span>
              <span className="normal-case tracking-normal text-white/40">
                {song && <>1–8 <b className="font-medium text-white/70">{label(song.genre.leadP)}</b> · Q–I <b className="font-medium text-white/70">{label(secondVoice(song))}</b> · A–K <b className="font-medium text-white/70">{label(song.genre.liveP)} chords</b> · hold to sustain</>}
              </span>
            </div>
            <div className="grid flex-1 grid-rows-4 gap-2">
              {pads.map((row, ri) => (
                <div key={ri} className="grid grid-cols-8 gap-2">
                  {row.map((p) => (
                    <button key={p.id} ref={(el) => { padEls.current[p.id] = el; }} onPointerDown={(e) => { e.preventDefault(); hit(p); }} onPointerUp={() => release(p.id)} onPointerLeave={() => release(p.id)} onPointerCancel={() => release(p.id)}
                      className="pad" style={{ "--pc": p.color } as CSSProperties}>
                      <span className="glow" />
                      <span className="absolute left-2 top-1.5 text-[10px] font-medium uppercase text-white/35">{p.key}</span>
                      {p.sub && <span className="absolute right-2 top-1.5 text-[10px] text-white/40">{p.sub}</span>}
                      <span className="relative text-[13px] font-semibold tracking-tight sm:text-[15px]">{p.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="glass flex-1 p-4">
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/45">
                <span>Sequencer</span>
                <span className="flex gap-1">{[0, 1, 2, 3].map((b) => <i key={b} className={`h-1 w-5 rounded-full transition-colors ${b === bar ? "bg-white" : "bg-white/15"}`} />)}</span>
              </div>
              <div className="flex flex-col gap-[5px]">
                {TRACKS.map((t) => {
                  const isDrum = (DRUMS as readonly string[]).includes(t);
                  const muted = !!song?.mutes[t];
                  return (
                    <div key={t} className={`flex items-center gap-2 transition-opacity ${muted ? "opacity-35" : ""}`}>
                      <button onClick={() => toggleMute(t)} className="w-[58px] shrink-0 truncate text-left text-[11px] font-medium text-white/70 hover:text-white" title="Mute / unmute">{TRACK_LABEL[t]}</button>
                      <div className="grid flex-1 gap-[3px]" style={{ gridTemplateColumns: `repeat(${spb}, minmax(0, 1fr))` }}>
                        {Array.from({ length: spb }, (_, i) => {
                          const v = !song ? 0 : isDrum ? song.drumBars[bar][t as DrumId].v[i] : melSteps[t].get(bar * spb + i) ?? 0;
                          const roll = isDrum && song ? song.drumBars[bar][t as DrumId].r[i] > 1 && v > 0 : false;
                          return (
                            <button key={i} disabled={!isDrum} onClick={() => toggleStep(t as DrumId, i)}
                              className={`cell ${v ? "on" : ""} ${i === cur ? "now" : ""} ${i % 4 === 0 ? "beat" : ""} ${roll ? "roll" : ""}`}
                              style={{ "--tc": TRACK_COLOR[t], "--v": v ? 0.45 + v * 0.55 : 0 } as CSSProperties} />
                          );
                        })}
                      </div>
                      <button onClick={() => reroll(t)} className="dice" title={`New ${isDrum ? "drums" : TRACK_LABEL[t].toLowerCase()}`}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass flex items-center gap-3 p-3 pl-4">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                  Notes → Melody{layers > 0 && <span className="text-white/70"> · {layers} of {MAX_LAYERS} layered</span>}
                </div>
                <div className="no-sb mt-1.5 flex h-7 items-center gap-1 overflow-x-auto">
                  {captured.length === 0 && <span className="text-[13px] text-white/40">
                    {layers ? "Tap more notes and add another melody on top — Auto-evolve leaves yours alone." : "Tap any notes on the top two rows — KHAOS turns them into a hook."}
                  </span>}
                  {captured.map((m, i) => <span key={i} className="note-chip">{noteName(m)}</span>)}
                </div>
              </div>
              {captured.length > 0 && <button onClick={() => setCaptured([])} className="tog">Clear</button>}
              {layers > 0 && <button onClick={() => { const s = songRef.current; if (s) apply(unmelodize(s)); }} className="tog" title="Remove the last melody you added">Undo</button>}
              <button onClick={doMelodize} disabled={!captured.length} className="cta rounded-full px-5 py-2.5 text-[13px] font-semibold text-black disabled:opacity-30">{layers ? "Add melody" : "Melodize"}</button>
            </div>
          </section>
        </main>

        <footer className="shrink-0 pt-1 text-center text-[11px] text-white/30">
          Space play/stop · Enter new beat · ← → genre · 1–8 / Q–I melody · A–K chords · Z–, drums
        </footer>
      </div>
    </div>
  );
}

function Macro({ label, v, set, commit }: { label: string; v: number; set: (v: number) => void; commit?: (v: number) => void }) {
  return (
    <label className="macro block">
      <div className="mb-1.5 flex justify-between gap-2 text-[10px] uppercase tracking-[0.12em] text-white/50">
        <span>{label}</span><span className="tabular-nums text-white/35">{Math.round(v * 100)}</span>
      </div>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
          <div className="fill h-full rounded-full" style={{ width: `${v * 100}%` }} />
        </div>
        <div className="knob" style={{ left: `calc(${v * 100}% - ${v * 14}px)` }} />
        <input type="range" min={0} max={1} step={0.01} value={v} aria-label={label}
          onChange={(e) => set(+e.target.value)}
          onPointerUp={(e) => commit?.(+e.currentTarget.value)} onKeyUp={(e) => commit?.(+e.currentTarget.value)}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      </div>
    </label>
  );
}
