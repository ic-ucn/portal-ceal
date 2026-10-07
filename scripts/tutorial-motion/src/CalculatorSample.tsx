import React from "react";
import {AbsoluteFill, Easing, Img, staticFile, useCurrentFrame, useVideoConfig} from "remotion";

type Box = {x: number; y: number; w: number; h: number};
export type SampleProps = {
  format?: string;
  shots: {image: string; at: number}[];
  cues: {start: number; end: number; text: string}[];
  duration: number;
  source: {width: number; height: number};
  targets: {goal: Box; grade: Box; weight: Box; result: Box};
  beats: {goal: number; grade: number; weight: number; result: number};
};

const INK = "#23201b";
const PAPER = "#f6f1e7";
const ACCENT = "#8a5a2b";
const SERIF = "Georgia, 'Times New Roman', serif";
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);
const prog = (t: number, a: number, b: number) => clamp((t - a) / Math.max(b - a, 1e-6), 0, 1);
const fade = (t: number, a: number, b: number) => prog(t, a, b);

type Key = {t: number; cx: number; cy: number; cw: number};

// Split caption into at most two balanced lines.
const wrap = (text: string): string[] => {
  const words = text.trim().split(/\s+/);
  if (text.length <= 44 || words.length < 2) return [text];
  let best = 1;
  let diff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (d < diff) {
      diff = d;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
};

export const CalculatorSample: React.FC<SampleProps> = ({shots, cues, duration, source, targets, beats}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = clamp(frame / fps, 0, duration);
  const mobile = width < height;
  const k = mobile ? 1.15 : width / 1920;
  const W = source.width;
  const H = source.height;
  const aspect = mobile ? 0.66 : W / H;

  // Panel: same aspect as the source so any crop with that aspect never distorts.
  const maxW = width - (mobile ? 72 : 240 * k);
  const maxH = height - (mobile ? 390 : 330);
  const panelW = Math.min(maxW, maxH * aspect);
  const panelH = panelW / aspect;
  const panelTop = mobile ? 160 : 150;

  // ---- Camera keyframes derived from voice beats ----
  const order = ["goal", "grade", "weight", "result"] as const;
  const center = (b: Box) => ({cx: b.x + b.w / 2, cy: b.y + b.h / 2, cw: clamp(Math.max(W * 0.34, b.w * 1.15), W * 0.3, W)});
  const keys: Key[] = [{t: 0, cx: W / 2, cy: H / 2, cw: W}];
  order.forEach((name) => {
    const prev = keys[keys.length - 1];
    const f = center(targets[name]);
    if (mobile) { f.cw = name === "result" ? W : 300; if (name !== "result") f.cy -= 60; }
    if (!mobile && (name === "grade" || name === "weight")) f.cy -= 55;
    if (!mobile && name === "result") { f.cy = 515; f.cx = 920; f.cw = 1050; }
    const start = Math.max(prev.t + 0.01, beats[name] - 0.9);
    keys.push({...prev, t: start});
    keys.push({...f, t: Math.max(start + 0.5, beats[name] - 0.1)});
  });
  keys.push({...keys[keys.length - 1], t: Math.max(duration, keys[keys.length - 1].t + 0.01)});

  let cam = keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t >= a.t && t <= b.t) {
      const p = ease(prog(t, a.t, b.t));
      cam = {t, cx: lerp(a.cx, b.cx, p), cy: lerp(a.cy, b.cy, p), cw: lerp(a.cw, b.cw, p)};
      break;
    }
    if (t > b.t) cam = b;
  }
  const cw = clamp(cam.cw, W * 0.3, W);
  const ch = cw / aspect;
  const cx = clamp(cam.cx, cw / 2, W - cw / 2);
  const cy = clamp(cam.cy, ch / 2, H - ch / 2);
  const s = panelW / cw;
  const toP = (x: number, y: number): [number, number] => [(x - (cx - cw / 2)) * s, (y - (cy - ch / 2)) * s];

  // ---- Screenshot selection (latest shot with at <= t) ----
  const sorted = [...shots].sort((a, b) => a.at - b.at);
  let current = 0;
  sorted.forEach((sh, i) => {
    if (sh.at <= t) current = i;
  });

  // ---- Cursor: arrives at each target exactly on its beat ----
  const tip = (b: Box) => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
  let pos = {x: W * 0.55, y: H * 0.78};
  let prevPos = pos;
  let prevBeat = -Infinity;
  let firstDepart = Infinity;
  order.forEach((name, i) => {
    const arr = beats[name];
    const dep = Math.max(prevBeat + 0.3, arr - 0.8);
    if (i === 0) firstDepart = dep;
    const tg = tip(targets[name]);
    if (t >= dep) pos = {x: lerp(prevPos.x, tg.x, ease(prog(t, dep, arr))), y: lerp(prevPos.y, tg.y, ease(prog(t, dep, arr)))};
    prevPos = tg;
    prevBeat = arr;
  });
  const cursorOpacity = fade(t, firstDepart - 0.3, firstDepart + 0.1);
  const [cpx, cpy] = toP(pos.x, pos.y);

  // ---- Captions ----
  const cue = cues.find((c) => t >= c.start && t < c.end);
  const capOpacity = cue ? clamp(Math.min((t - cue.start) / 0.15, (cue.end - t) / 0.15), 0, 1) : 0;
  const lines = cue ? wrap(cue.text) : [];

  const [rx, ry] = toP(targets.result.x, targets.result.y);
  const pad = 8 * s * 0.5;
  const endFade = 1 - fade(t, duration - 0.4, duration);

  return (
    <AbsoluteFill style={{background: PAPER, opacity: endFade, fontFamily: SERIF, color: INK}}>
      <div style={{position: "absolute", top: 36 * (height / 1080), width: "100%", textAlign: "center", opacity: fade(t, 0, 0.6)}}>
        <div style={{fontSize: 54 * k, letterSpacing: 0.5}}>¿Qué nota necesito?</div>
        <div style={{width: 90 * k, height: 2, background: ACCENT, margin: `${12 * k}px auto 0`, opacity: 0.7}} />
      </div>

      <div
        style={{
          position: "absolute",
          left: (width - panelW) / 2,
          top: panelTop,
          width: panelW,
          height: panelH,
          overflow: "hidden",
          background: "#fff",
          border: "1px solid #d8cfbd",
          borderRadius: 6,
          boxShadow: "0 18px 40px rgba(60,45,25,0.14)",
        }}
      >
        {sorted.map((sh, i) => (
          <Img
            key={sh.image + i}
            src={staticFile(sh.image)}
            style={{
              position: "absolute",
              left: -(cx - cw / 2) * s,
              top: -(cy - ch / 2) * s,
              width: W * s,
              height: "auto",
              opacity: i === current ? 1 : 0,
              maxWidth: "none",
            }}
          />
        ))}

        {(["goal", "grade", "weight"] as const).map((name) => {
          const q = (t - beats[name]) / 0.45;
          if (q < 0 || q > 1) return null;
          const tg = tip(targets[name]);
          const [px, py] = toP(tg.x, tg.y);
          const r = (10 + 22 * q) * k;
          return (
            <div
              key={name}
              style={{
                position: "absolute",
                left: px - r,
                top: py - r,
                width: r * 2,
                height: r * 2,
                borderRadius: "50%",
                border: `2px solid ${ACCENT}`,
                opacity: 0.6 * (1 - q),
              }}
            />
          );
        })}


      </div>

      <div
        style={{
          position: "absolute",
          left: mobile ? 50 : 160 * k,
          right: mobile ? 50 : 160 * k,
          bottom: 36 * (height / 1080),
          height: 120 * (height / 1080),
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          opacity: capOpacity,
          fontSize: 40 * k,
          lineHeight: 1.3,
        }}
      >
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
