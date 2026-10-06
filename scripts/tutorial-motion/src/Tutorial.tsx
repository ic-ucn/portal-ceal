
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/* ============================ TIPOS ============================ */

export type Format = 'desktop' | 'mobile';

/** Rectángulo en coordenadas del espacio de la escena (px de screenshot). */
export type Rect = { x: number; y: number; w: number; h: number };

/** Estado real capturado. t = segundos relativos al inicio de la escena. */
export type SourceState = {
  t: number;
  image: string; // ruta relativa a public/, ej. 'captures/desktop-02-marked.png'
  width: number; // tamaño intrínseco del PNG
  height: number;
  /** cómo entra este estado: 'fade' (0.22 s por defecto) o 'cut' */
  transition?: 'fade' | 'cut';
  fade?: number;
};

/** Keyframe de cámara. El rect se ajusta al aspecto del panel sin deformar. */
export type CameraKey = Rect & {
  t: number; // relativo a la escena
  /** curva usada para LLEGAR a este keyframe */
  ease?: 'inOut' | 'out' | 'linear' | 'cut';
};

export type CursorKey = { t: number; x: number; y: number; click?: boolean };

export type Focus = {
  start: number; // relativo a la escena
  end: number;
  rect: Rect;
  label?: string;
  labelSide?: 'top' | 'bottom';
  dim?: boolean; // oscurece suavemente el resto (por defecto true)
};

export type Scene = {
  id: string;
  title: string; // aparece en el breadcrumb
  start: number; // segundos absolutos
  end: number;
  /** espacio de coordenadas; por defecto el tamaño del primer estado */
  space?: { width: number; height: number };
  states: SourceState[];
  camera: CameraKey[];
  cursor?: CursorKey[];
  focus?: Focus[];
  transitionIn?: number; // fundido de entrada en s (0.35 por defecto)
  showInProgress?: boolean; // false para la apertura
};

export type Caption = { start: number; end: number; text: string };

export type TutorialProps = {
  format: Format;
  scenes: Scene[];
  captions: Caption[];
};

/* ============================ LAYOUT ============================ */

type Layout = {
  panel: Rect;
  radius: number;
  crumbY: number;
  crumbSize: number;
  captionTop: number;
  captionHeight: number;
  captionSize: number;
  captionMaxWidth: number;
  cursorSize: number;
  labelSize: number;
};

const LAYOUTS: Record<Format, Layout> = {
  desktop: {
    panel: { x: 64, y: 60, w: 1792, h: 900 },
    radius: 14,
    crumbY: 16,
    crumbSize: 17,
    captionTop: 972,
    captionHeight: 96,
    captionSize: 42,
    captionMaxWidth: 1500,
    cursorSize: 30,
    labelSize: 22,
  },
  mobile: {
    panel: { x: 36, y: 150, w: 1008, h: 1530 },
    radius: 28,
    crumbY: 62,
    crumbSize: 24,
    captionTop: 1700,
    captionHeight: 190,
    captionSize: 50,
    captionMaxWidth: 960,
    cursorSize: 44,
    labelSize: 30,
  },
};

const COLORS = {
  bg: '#e9ebe6',
  panelBg: '#f4f4f1',
  ink: '#173a3d',
  inkSoft: '#5d6f70',
  accent: '#1f5f63',
  line: '#c9d0cb',
};

const EASE = {
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  linear: (x: number) => x,
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/* ============================ CÁMARA ============================ */

type Cam = { x: number; y: number; w: number; h: number; s: number };

/** Ajusta el rect al aspecto del panel conservando su centro (contiene el rect pedido). */
const fitToAspect = (r: Rect, aspect: number) => {
  let w = r.w;
  let h = r.h;
  if (w / h < aspect) w = h * aspect;
  else h = w / aspect;
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2, w, h };
};

const cameraAt = (
  keys: CameraKey[],
  lt: number,
  panel: Rect,
  space: { width: number; height: number },
): Cam => {
  const aspect = panel.w / panel.h;
  const sorted = [...keys].sort((a, b) => a.t - b.t);
  const fallback: CameraKey = { t: 0, x: 0, y: 0, w: space.width, h: space.height };
  const list = sorted.length ? sorted : [fallback];

  let cx: number;
  let cy: number;
  let w: number;
  if (lt <= list[0].t || list.length === 1) {
    const f = fitToAspect(list[0], aspect);
    ({ cx, cy, w } = f);
  } else if (lt >= list[list.length - 1].t) {
    const f = fitToAspect(list[list.length - 1], aspect);
    ({ cx, cy, w } = f);
  } else {
    let i = 0;
    while (i < list.length - 1 && list[i + 1].t <= lt) i++;
    const a = list[i];
    const b = list[i + 1];
    const fa = fitToAspect(a, aspect);
    const fb = fitToAspect(b, aspect);
    const mode = b.ease ?? 'inOut';
    const raw = clamp01((lt - a.t) / Math.max(0.0001, b.t - a.t));
    const p = mode === 'cut' ? 0 : EASE[mode](raw);
    cx = lerp(fa.cx, fb.cx, p);
    cy = lerp(fa.cy, fb.cy, p);
    // interpolación logarítmica del zoom: velocidad perceptual constante
    w = Math.exp(lerp(Math.log(fa.w), Math.log(fb.w), p));
  }
  const h = w / aspect;
  let x = cx - w / 2;
  let y = cy - h / 2;
  // nunca mostrar fuera de la captura salvo que el encuadre sea mayor que ella
  x = w >= space.width ? (space.width - w) / 2 : Math.min(Math.max(x, 0), space.width - w);
  y = h >= space.height ? (space.height - h) / 2 : Math.min(Math.max(y, 0), space.height - h);
  return { x, y, w, h, s: panel.w / w };
};

const toPanel = (cam: Cam, px: number, py: number) => ({
  x: (px - cam.x) * cam.s,
  y: (py - cam.y) * cam.s,
});

/* ============================ CURSOR ============================ */

const cursorAt = (keys: CursorKey[], lt: number) => {
  const list = [...keys].sort((a, b) => a.t - b.t);
  const first = list[0];
  const last = list[list.length - 1];
  const opacity = Math.min(
    interpolate(lt, [first.t - 0.3, first.t], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    interpolate(lt, [last.t + 0.6, last.t + 1.0], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  let x = first.x;
  let y = first.y;
  if (lt >= last.t) {
    x = last.x;
    y = last.y;
  } else if (lt > first.t) {
    let i = 0;
    while (i < list.length - 1 && list[i + 1].t <= lt) i++;
    const a = list[i];
    const b = list[i + 1];
    // llega a destino un poco antes del clic: se mueve y luego actúa
    const travel = Math.max(0.0001, (b.t - a.t) * 0.85);
    const p = EASE.inOut(clamp01((lt - a.t) / travel));
    x = lerp(a.x, b.x, p);
    y = lerp(a.y, b.y, p);
  }
  let press = 0;
  let ring = -1;
  for (const k of list) {
    if (!k.click) continue;
    const d = lt - k.t;
    if (d >= -0.08 && d <= 0.14) press = Math.max(press, 1 - Math.abs(d - 0.03) / 0.11);
    if (d >= 0 && d <= 0.5) ring = d / 0.5;
  }
  return { x, y, opacity, press: clamp01(press), ring };
};

const Cursor: React.FC<{
  format: Format;
  x: number;
  y: number;
  opacity: number;
  press: number;
  ring: number;
  size: number;
}> = ({ format, x, y, opacity, press, ring, size }) => {
  if (opacity <= 0.001) return null;
  const scale = 1 - press * 0.12;
  const ringEl =
    ring >= 0 ? (
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: lerp(size * 0.5, size * 1.7, EASE.out(ring)),
          height: lerp(size * 0.5, size * 1.7, EASE.out(ring)),
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: `2px solid ${COLORS.accent}`,
          opacity: (1 - ring) * 0.55 * opacity,
        }}
      />
    ) : null;
  if (format === 'mobile') {
    return (
      <>
        {ringEl}
        <div
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: size,
            height: size,
            transform: `translate(-50%, -50%) scale(${scale})`,
            borderRadius: '50%',
            background: 'rgba(23,58,61,0.28)',
            border: '2px solid rgba(255,255,255,0.9)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            opacity,
          }}
        />
      </>
    );
  }
  return (
    <>
      {ringEl}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: `translate(-3px, -2px) scale(${scale})`,
          transformOrigin: '3px 2px',
          opacity,
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))',
        }}
      >
        <path
          d="M3 2 L3 19 L7.6 14.8 L10.6 21.4 L13.4 20.2 L10.5 13.7 L16.8 13.7 Z"
          fill="#1b2b2d"
          stroke="#ffffff"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};

/* ============================ ESCENA ============================ */

const SceneView: React.FC<{
  scene: Scene;
  t: number;
  format: Format;
  layout: Layout;
}> = ({ scene, t, format, layout }) => {
  const lt = t - scene.start;
  const { panel } = layout;
  const first = scene.states[0];
  const space = scene.space ?? { width: first.width, height: first.height };
  const cam = cameraAt(scene.camera, lt, panel, space);

  const states = [...scene.states].sort((a, b) => a.t - b.t);
  let idx = 0;
  for (let i = 0; i < states.length; i++) if (states[i].t <= lt) idx = i;
  const cur = states[idx];
  const prev = idx > 0 ? states[idx - 1] : null;
  const fade = cur.transition === 'cut' ? 0 : cur.fade ?? 0.22;
  const curOpacity =
    prev && fade > 0 ? EASE.inOut(clamp01((lt - cur.t) / fade)) : 1;

  const imgStyle = (op: number): React.CSSProperties => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: space.width,
    height: 'auto',
    opacity: op,
  });

  const focusEls = (scene.focus ?? []).map((f, i) => {
    const op = Math.min(
      interpolate(lt, [f.start, f.start + 0.35], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: EASE.out,
      }),
      interpolate(lt, [f.end - 0.3, f.end], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    );
    if (op <= 0.001) return null;
    const pad = 6;
    const tl = toPanel(cam, f.rect.x, f.rect.y);
    const w = f.rect.w * cam.s;
    const h = f.rect.h * cam.s;
    const side = f.labelSide ?? 'bottom';

    const dim = f.dim ?? true;
    const labelEl = f.label ? (
      <div
        style={{
          position: 'absolute',
          left: tl.x - pad,
          top: side === 'bottom' ? tl.y + h + pad + 10 : undefined,
          bottom: side === 'top' ? panel.h - tl.y + pad + 10 : undefined,
          maxWidth: Math.max(220, panel.w * 0.45),
          padding: '8px 14px',
          borderRadius: 10,
          background: COLORS.ink,
          color: '#ffffff',
          fontSize: layout.labelSize,
          fontWeight: 600,
          lineHeight: 1.25,
          boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          transform: `translateY(${(1 - op) * (side === 'bottom' ? -6 : 6)}px)`,
        }}
      >
        {f.label}
      </div>
    ) : null;
    return (
      <div key={`focus-${i}`} style={{ position: 'absolute', inset: 0, opacity: op }}>
        <div
          style={{
            position: 'absolute',
            left: tl.x - pad,
            top: tl.y - pad,
            width: w + pad * 2,
            height: h + pad * 2,
            borderRadius: 10,
            border: `2px solid ${COLORS.accent}`,
            boxShadow: dim ? '0 0 0 9999px rgba(15,30,32,0.26)' : undefined,
          }}
        />
        {labelEl}
      </div>
    );
  });

  let cursorEl: React.ReactNode = null;
  if (scene.cursor && scene.cursor.length) {
    const c = cursorAt(scene.cursor, lt);
    const p = toPanel(cam, c.x, c.y);
    cursorEl = (
      <Cursor
        format={format}
        x={p.x}
        y={p.y}
        opacity={c.opacity}
        press={c.press}
        ring={c.ring}
        size={layout.cursorSize}
      />
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: panel.x,
        top: panel.y,
        width: panel.w,
        height: panel.h,
        borderRadius: layout.radius,
        overflow: 'hidden',
        background: COLORS.panelBg,
        boxShadow: '0 10px 40px rgba(23,58,61,0.16), 0 0 0 1px rgba(23,58,61,0.08)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: space.width,
          height: space.height,
          transform: `translate(${-cam.x * cam.s}px, ${-cam.y * cam.s}px) scale(${cam.s})`,
          transformOrigin: '0 0',
        }}
      >
        {prev && curOpacity < 1 ? (
          <Img src={staticFile(prev.image)} style={imgStyle(1)} />
        ) : null}
        <Img src={staticFile(cur.image)} style={imgStyle(curOpacity)} />
      </div>
      {focusEls}
      {cursorEl}
    </div>
  );
};

const Breadcrumb: React.FC<{ scenes: Scene[]; t: number; layout: Layout }> = ({ scenes, t, layout }) => {
  const { panel } = layout;
  const shown = scenes.filter((s) => s.showInProgress !== false);
  if (!shown.length) return null;
  const s0 = shown[0].start;
  const total = shown[shown.length - 1].end - s0;
  const prog = clamp01((t - s0) / total);
  return (
    <div style={{ position: 'absolute', left: panel.x, top: layout.crumbY, width: panel.w }}>
      <div
        style={{
          display: 'flex',
          gap: 18,
          fontSize: layout.crumbSize,
          fontFamily: 'Inter, system-ui, sans-serif',
          color: COLORS.inkSoft,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        <span style={{color: COLORS.ink, fontWeight: 700, flex: 1}}>
          {String(Math.max(0, shown.findIndex(s => t >= s.start && t < s.end))+1).padStart(2,'0')}
          {' / '}{String(shown.length).padStart(2,'0')}{'  ·  '}
          {(shown.find(s => t >= s.start && t < s.end) ?? shown.at(-1))?.title}
        </span>
        <span>CEIC UCN</span>
      </div>
      <div style={{ position: 'relative', marginTop: 8, height: 4, borderRadius: 2, background: COLORS.line }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: 4,
            width: `${prog * 100}%`,
            borderRadius: 2,
            background: COLORS.accent,
          }}
        />
        {shown.slice(1).map((s) => (
          <div
            key={`tick-${s.id}`}
            style={{
              position: 'absolute',
              left: `${((s.start - s0) / total) * 100}%`,
              top: -2,
              width: 2,
              height: 8,
              background: COLORS.bg,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const CaptionBar: React.FC<{ captions: Caption[]; t: number; layout: Layout }> = ({ captions, t, layout }) => {
  const c = captions.find((x) => t >= x.start && t < x.end);
  if (!c) return null;
  const op = Math.min(clamp01((t - c.start) / 0.2), clamp01((c.end - t) / 0.2));
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: layout.captionTop,
        height: layout.captionHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: layout.captionMaxWidth,
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: layout.captionSize,
          fontWeight: 600,
          lineHeight: 1.25,
          color: COLORS.ink,
          opacity: op,
        }}
      >
        {c.text}
      </div>
    </div>
  );
};

export const Tutorial: React.FC<TutorialProps> = ({ format, scenes, captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const layout = LAYOUTS[format];
  const list = [...scenes].sort((a, b) => a.start - b.start);

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {list.map((s, i) => {
        const next = list[i + 1];
        const tail = next ? next.transitionIn ?? 0.35 : 0;
        if (t < s.start || t >= s.end + tail) return null;
        const tin = s.transitionIn ?? 0.35;
        const op = i === 0 || tin <= 0 ? 1 : EASE.inOut(clamp01((t - s.start) / tin));
        return (
          <div key={s.id} style={{ position: 'absolute', inset: 0, opacity: op }}>
            <SceneView scene={s} t={t} format={format} layout={layout} />
          </div>
        );
      })}
      <Breadcrumb scenes={list} t={t} layout={layout} />
      <CaptionBar captions={captions} t={t} layout={layout} />
    </AbsoluteFill>
  );
};
