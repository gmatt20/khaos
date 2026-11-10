"use client";
import { useEffect, useRef, type RefObject } from "react";
import { engine } from "@/lib/audio";

export type VizBus = { kick: number; snare: number; burst: number; drop: number };

const FRAG = `
precision highp float;
uniform vec2 uRes; uniform vec2 uCen;
uniform float uT, uFly, uBass, uMid, uHigh, uKick, uSpin;
uniform vec3 uA, uB, uC;
uniform float uShock[4];
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=.5; } return v; }
float starLayer(vec2 p){ vec2 id=floor(p), f=fract(p)-.5; float h=hash(id);
  vec2 o=vec2(hash(id+11.3),hash(id+27.1))-.5; float d=length(f-o*.6);
  float tw=.6+.4*sin(uT*(1.+h*5.)+h*60.);
  return step(.72,h)*tw*smoothstep(.045,0.,d); }
void main(){
  vec2 uv=(gl_FragCoord.xy-uCen)/uRes.y;
  float ca=cos(.42), sa=sin(.42);
  vec2 q=vec2(ca*uv.x-sa*uv.y, (sa*uv.x+ca*uv.y)*1.85);
  float rq=length(q), aq=atan(q.y,q.x);
  float sw=aq+uSpin-2.4*log(rq+.04);
  float arms=pow(.5+.5*cos(2.*sw),2.5);
  vec2 sp=vec2(cos(sw),sin(sw))*rq;
  float n=fbm(sp*3.+vec2(0.,uT*.02));
  float n2=fbm(uv*2.2+n*1.2+vec2(uT*.015,-uT*.01));
  float disk=exp(-rq*2.3);
  vec3 col=vec3(0.);
  col+=mix(uA,uB,n2)*pow(n2,3.)*(.55+uBass*1.1);
  col+=uA*.06*fbm(uv*1.2-uT*.01);
  col+=mix(uB,uC,n)*arms*disk*(n*1.7+.2)*(.9+uMid*2.4);
  col+=uC*pow(n,4.)*arms*disk*uHigh*4.;
  float core=.02/(rq*rq+.012);
  col+=mix(uC,vec3(1.),.6)*core*(.3+uKick*.55+uBass*.3)*.5;
  for(int i=0;i<4;i++){
    float fi=float(i); float z=fract(uFly+fi*.25); float sc=mix(26.,1.5,z);
    float fade=smoothstep(0.,.25,z)*smoothstep(1.,.8,z);
    col+=vec3(.8,.9,1.)*starLayer(uv*sc+fi*17.3)*fade*(.7+uHigh*1.6);
  }
  for(int i=0;i<4;i++){
    float ag=uShock[i]; float rad=.1+ag*.95;
    float w=exp(-pow((rq-rad)*(26.-min(ag,2.)*8.),2.));
    col+=mix(uC,uB,min(ag,1.))*w*exp(-ag*3.)*.6;
  }
  vec2 sv=gl_FragCoord.xy/uRes-.5;
  col*=1.-dot(sv,sv)*.9;
  col=1.-exp(-col*1.55);
  col=pow(col,vec3(.92));
  col+=(hash(gl_FragCoord.xy+uT)-.5)/255.;
  gl_FragColor=vec4(col,1.);
}`;
const VERT = `attribute vec2 p; void main(){ gl_Position=vec4(p,0.,1.); }`;

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

type Particle = { x: number; y: number; vx: number; vy: number; life: number; c: number };

export default function Visualizer({ bus, colors, anchor, centered }: {
  bus: RefObject<VizBus>;
  colors: string[];
  anchor: RefObject<HTMLElement | null>;
  centered: boolean;
}) {
  const glRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ colors, centered });
  live.current = { colors, centered };

  useEffect(() => {
    const glc = glRef.current!, fxc = fxRef.current!;
    const gl = glc.getContext("webgl", { antialias: false, alpha: false });
    const fx = fxc.getContext("2d")!;
    let prog: WebGLProgram | null = null;
    const U: Record<string, WebGLUniformLocation | null> = {};
    if (gl) {
      const sh = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
        return s;
      };
      prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog); gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const n of ["uRes", "uCen", "uT", "uFly", "uBass", "uMid", "uHigh", "uKick", "uSpin", "uA", "uB", "uC", "uShock"])
        U[n] = gl.getUniformLocation(prog, n);
    }

    let W = 0, H = 0, scale = 0.6, dpr = 1;
    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      scale = Math.min(0.75, 1000 / W);
      glc.width = Math.floor(W * scale); glc.height = Math.floor(H * scale);
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      fxc.width = Math.floor(W * dpr); fxc.height = Math.floor(H * dpr);
      gl?.viewport(0, 0, glc.width, glc.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const freq = new Uint8Array(1024);
    const bars = new Float32Array(72);
    const col = [hex(colors[0]), hex(colors[1]), hex(colors[2])];
    const shock = [9, 9, 9, 9];
    const parts: Particle[] = [];
    const seen = { kick: 0, snare: 0, burst: 0, drop: 0 };
    let bass = 0, mid = 0, high = 0, kick = 0, fly = 0, spin = 0, si = 0;
    let cx = W / 2, cy = H / 2, last = performance.now(), raf = 0;
    const t0 = last;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const b = bus.current, lv = live.current;
      if (engine.ctx) engine.analyser.getByteFrequencyData(freq);
      const avg = (a: number, z: number) => { let s = 0; for (let i = a; i < z; i++) s += freq[i]; return s / (z - a) / 255; };
      bass += (avg(1, 9) - bass) * 0.35; mid += (avg(10, 90) - mid) * 0.25; high += (avg(90, 380) - high) * 0.25;
      kick *= Math.pow(0.004, dt);
      for (let i = 0; i < 4; i++) shock[i] += dt;
      const spawn = (n: number, speed: number, c: number) => {
        for (let i = 0; i < n; i++) {
          const a = Math.random() * 6.283, v = speed * (0.4 + Math.random());
          parts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c });
        }
      };
      if (b.kick !== seen.kick) { seen.kick = b.kick; kick = 1; shock[si++ % 4] = 0; spawn(8, 240, 2); }
      if (b.snare !== seen.snare) { seen.snare = b.snare; spawn(10, 420, 1); }
      if (b.burst !== seen.burst) { seen.burst = b.burst; spawn(16, 520, 0); shock[si++ % 4] = 0; }
      if (b.drop !== seen.drop) { seen.drop = b.drop; spawn(120, 900, 2); kick = 1.6; for (let i = 0; i < 4; i++) shock[i] = i * 0.12; }
      fly += dt * (0.025 + bass * 0.22 + kick * 0.08);
      spin += dt * (0.06 + mid * 0.5);
      // Glide the galaxy core to the anchor (or screen centre in visual mode).
      const r = anchor.current?.getBoundingClientRect();
      const tx = lv.centered || !r ? W / 2 : r.left + r.width / 2;
      const ty = lv.centered || !r ? H / 2 : r.top + r.height / 2;
      cx += (tx - cx) * Math.min(1, dt * 5); cy += (ty - cy) * Math.min(1, dt * 5);
      for (let i = 0; i < 3; i++) { const t = hex(lv.colors[i]); for (let j = 0; j < 3; j++) col[i][j] += (t[j] - col[i][j]) * Math.min(1, dt * 3); }

      if (gl && prog) {
        gl.uniform2f(U.uRes, glc.width, glc.height);
        gl.uniform2f(U.uCen, cx * scale, (H - cy) * scale);
        gl.uniform1f(U.uT, (now - t0) / 1000); gl.uniform1f(U.uFly, fly); gl.uniform1f(U.uSpin, spin);
        gl.uniform1f(U.uBass, bass); gl.uniform1f(U.uMid, mid); gl.uniform1f(U.uHigh, high); gl.uniform1f(U.uKick, kick);
        gl.uniform3fv(U.uA, col[0]); gl.uniform3fv(U.uB, col[1]); gl.uniform3fv(U.uC, col[2]);
        gl.uniform1fv(U.uShock, shock);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      // Spectrum halo + particles.
      fx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fx.clearRect(0, 0, W, H);
      fx.globalCompositeOperation = "lighter";
      const rgb = (c: number[], a: number) => `rgba(${(c[0] * 255) | 0},${(c[1] * 255) | 0},${(c[2] * 255) | 0},${a})`;
      const base = (lv.centered ? Math.min(W, H) * 0.16 : 84) * (1 + kick * 0.06);
      const reach = lv.centered ? Math.min(W, H) * 0.24 : 90;
      const N = bars.length;
      fx.lineCap = "round";
      for (let pass = 0; pass < 2; pass++) {
        fx.lineWidth = pass ? 2 : 7;
        for (let i = 0; i < N; i++) {
          const k = i < N / 2 ? i : N - 1 - i;
          const bin = 2 + Math.floor(Math.pow(k / (N / 2), 1.7) * 300);
          if (!pass) bars[i] += (freq[bin] / 255 - bars[i]) * 0.4;
          const v = bars[i], a = (i / N) * 6.283 - 1.5708 + spin * 0.3;
          const c = k / (N / 2);
          const mixc = [0, 1, 2].map((j) => col[1][j] * (1 - c) + col[2][j] * c);
          fx.strokeStyle = rgb(mixc, pass ? 0.35 + v * 0.65 : 0.1 * v);
          fx.beginPath();
          fx.moveTo(cx + Math.cos(a) * base, cy + Math.sin(a) * base);
          fx.lineTo(cx + Math.cos(a) * (base + 3 + v * v * reach), cy + Math.sin(a) * (base + 3 + v * v * reach));
          fx.stroke();
        }
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt * 1.1; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; p.vy *= 0.985;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        fx.fillStyle = rgb(col[p.c], p.life * 0.9);
        fx.beginPath(); fx.arc(p.x, p.y, 1 + p.life * 2.2, 0, 6.283); fx.fill();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <canvas ref={glRef} className="fixed inset-0 h-full w-full" />
      <canvas ref={fxRef} className="pointer-events-none fixed inset-0 h-full w-full" />
    </>
  );
}
