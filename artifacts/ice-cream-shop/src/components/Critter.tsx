/**
 * The animal friends, drawn as SVG so they can blink, smile and look puzzled.
 * One body shape with ears, markings and extras chosen per animal.
 */
import type { CSSProperties } from "react";
import type { CustomerId } from "@/game/catalog";
import { CUSTOMER_ORDER } from "@/game/catalog";

export type Mood = "waiting" | "happy" | "hmm";

type Ears = "round" | "long" | "pointy" | "floppy" | "fluffy" | "none";
type Extra = "mane" | "horn" | "whiskers" | "eyepatches" | "spot" | "frogEyes" | "spikes" | "stripes" | "snout" | "muzzle" | "tuft" | "koalaNose" | "belly";

interface Spec {
  body: string;
  dark: string;
  light: string;
  ears: Ears;
  earColor?: string;
  earInner: string;
  nose: string;
  cheek: string;
  extras: Extra[];
}

const SPECS: Record<CustomerId, Spec> = {
  bear: { body: "#c98b5b", dark: "#8f5a33", light: "#f2d7b6", ears: "round", earInner: "#f2d7b6", nose: "#4a2c17", cheek: "#f9a8d4", extras: ["muzzle", "belly"] },
  bunny: { body: "#f7f0f4", dark: "#cdb3bf", light: "#ffffff", ears: "long", earInner: "#f9a8d4", nose: "#f472b6", cheek: "#f9a8d4", extras: ["whiskers", "belly"] },
  cat: { body: "#f7b267", dark: "#c97a2c", light: "#fde7c7", ears: "pointy", earInner: "#f9a8d4", nose: "#f472b6", cheek: "#fb7185", extras: ["whiskers", "stripes", "muzzle"] },
  dog: { body: "#dcb98f", dark: "#8b5a2b", light: "#f7e7d2", ears: "floppy", earColor: "#8b5a2b", earInner: "#8b5a2b", nose: "#3f2a1a", cheek: "#f9a8d4", extras: ["spot", "muzzle", "belly"] },
  pig: { body: "#f9b4cf", dark: "#d9679a", light: "#fddbe8", ears: "pointy", earInner: "#f48fb1", nose: "#ee8fb9", cheek: "#f472b6", extras: ["snout", "belly"] },
  frog: { body: "#8fd66a", dark: "#4f9a33", light: "#dcf7c9", ears: "none", earInner: "#8fd66a", nose: "#4f9a33", cheek: "#fb7185", extras: ["frogEyes", "belly"] },
  fox: { body: "#f98a3c", dark: "#c25a12", light: "#fff3e8", ears: "pointy", earInner: "#3f2a1a", nose: "#3f2a1a", cheek: "#fb7185", extras: ["muzzle", "belly", "tuft"] },
  panda: { body: "#fafafa", dark: "#2b2b2b", light: "#ffffff", ears: "round", earColor: "#2b2b2b", earInner: "#2b2b2b", nose: "#2b2b2b", cheek: "#f9a8d4", extras: ["eyepatches"] },
  lion: { body: "#f6c76b", dark: "#c9862c", light: "#fde9bd", ears: "round", earInner: "#fde9bd", nose: "#7c4a1e", cheek: "#fb923c", extras: ["mane", "muzzle", "belly"] },
  koala: { body: "#aaaab0", dark: "#66666c", light: "#e4e4e7", ears: "fluffy", earInner: "#e8c6cf", nose: "#2b2b2b", cheek: "#f9a8d4", extras: ["koalaNose", "belly"] },
  unicorn: { body: "#fcf4ff", dark: "#c4b5fd", light: "#ffffff", ears: "pointy", earInner: "#f9a8d4", nose: "#e879f9", cheek: "#f9a8d4", extras: ["horn", "tuft", "belly"] },
  dragon: { body: "#72d19a", dark: "#2f8a58", light: "#dcfce7", ears: "none", earInner: "#72d19a", nose: "#2f8a58", cheek: "#fb7185", extras: ["spikes", "belly", "muzzle"] },
};

const HEAD = { cx: 100, cy: 95, r: 62 };

function star(cx: number, cy: number, outer: number, inner: number, points: number): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

interface CritterProps {
  id: CustomerId;
  mood?: Mood;
  className?: string;
  style?: CSSProperties;
}

export function Critter({ id, mood = "waiting", className, style }: CritterProps) {
  const s = SPECS[id];
  const has = (e: Extra) => s.extras.includes(e);
  const earColor = s.earColor ?? s.body;
  const frog = has("frogEyes");
  const eyeY = frog ? 46 : 92;
  const eyes = [78, 122];
  const lidColor = (i: number) => (has("eyepatches") ? s.dark : has("spot") && i === 1 ? s.dark : s.body);
  const outline = { stroke: s.dark, strokeWidth: 2, strokeOpacity: 0.45 };
  // Blink at a slightly different moment for each friend so a queue does not blink in unison.
  const blinkDelay = `${(CUSTOMER_ORDER.indexOf(id) * 0.7) % 4}s`;

  return (
    <svg viewBox="0 -12 200 244" className={className} style={{ ...style, ["--blink" as string]: blinkDelay }} aria-hidden="true">
      <ellipse cx={100} cy={226} rx={56} ry={6} fill="#000" opacity="0.12" />

      {has("mane") && <polygon points={star(HEAD.cx, HEAD.cy + 2, 88, 74, 14)} fill={s.dark} />}

      {s.ears === "round" && (
        <g>
          <circle cx={48} cy={44} r={20} fill={earColor} {...outline} />
          <circle cx={48} cy={44} r={11} fill={s.earInner} />
          <circle cx={152} cy={44} r={20} fill={earColor} {...outline} />
          <circle cx={152} cy={44} r={11} fill={s.earInner} />
        </g>
      )}
      {s.ears === "long" && (
        <g>
          <ellipse cx={72} cy={26} rx={15} ry={38} fill={earColor} transform="rotate(-8 72 26)" {...outline} />
          <ellipse cx={72} cy={28} rx={8} ry={27} fill={s.earInner} transform="rotate(-8 72 26)" />
          <ellipse cx={128} cy={26} rx={15} ry={38} fill={earColor} transform="rotate(8 128 26)" {...outline} />
          <ellipse cx={128} cy={28} rx={8} ry={27} fill={s.earInner} transform="rotate(8 128 26)" />
        </g>
      )}
      {s.ears === "pointy" && (
        <g>
          <path d="M42 72 L56 4 L92 46 Z" fill={earColor} strokeLinejoin="round" {...outline} />
          <path d="M52 62 L59 24 L80 46 Z" fill={s.earInner} />
          <path d="M158 72 L144 4 L108 46 Z" fill={earColor} strokeLinejoin="round" {...outline} />
          <path d="M148 62 L141 24 L120 46 Z" fill={s.earInner} />
        </g>
      )}
      {s.ears === "fluffy" && (
        <g>
          <circle cx={40} cy={60} r={28} fill={earColor} {...outline} />
          <circle cx={40} cy={60} r={17} fill={s.earInner} />
          <circle cx={160} cy={60} r={28} fill={earColor} {...outline} />
          <circle cx={160} cy={60} r={17} fill={s.earInner} />
        </g>
      )}
      {has("horn") && (
        <g>
          <path d="M90 40 L100 -8 L110 40 Z" fill="#fcd34d" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
          <path d="M93 26 L107 22 M95 14 L105 11" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {has("spikes") && (
        <g>
          <path d="M58 52 L66 22 L80 46 Z M88 40 L100 8 L112 40 Z M120 46 L134 22 L142 52 Z" fill="#fde68a" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
        </g>
      )}

      <path d="M52 232 L52 180 Q52 138 100 138 Q148 138 148 180 L148 232 Z" fill={s.body} {...outline} />
      {has("belly") && <ellipse cx={100} cy={196} rx={28} ry={26} fill={s.light} />}
      <ellipse cx={48} cy={184} rx={12} ry={22} fill={s.body} transform="rotate(18 48 184)" {...outline} />
      <ellipse cx={152} cy={184} rx={12} ry={22} fill={s.body} transform="rotate(-18 152 184)" {...outline} />
      <ellipse cx={78} cy={225} rx={17} ry={8} fill={s.dark} opacity="0.55" />
      <ellipse cx={122} cy={225} rx={17} ry={8} fill={s.dark} opacity="0.55" />

      <circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} fill={s.body} {...outline} />
      {frog && (
        <g>
          <circle cx={72} cy={46} r={21} fill={s.body} {...outline} />
          <circle cx={128} cy={46} r={21} fill={s.body} {...outline} />
        </g>
      )}
      {has("tuft") && (
        <g>
          <path d="M84 40 Q96 6 112 36 Q104 26 96 42 Z" fill={id === "unicorn" ? "#c084fc" : s.light} />
          {id === "unicorn" && <path d="M104 38 Q120 10 132 40 Q120 30 110 44 Z" fill="#f9a8d4" />}
        </g>
      )}
      {has("stripes") && <path d="M84 42 L88 58 M100 36 L100 54 M116 42 L112 58" stroke={s.dark} strokeWidth="5" strokeLinecap="round" opacity="0.7" />}
      {has("eyepatches") && (
        <g fill={s.dark}>
          <ellipse cx={78} cy={94} rx={17} ry={21} transform="rotate(-14 78 94)" />
          <ellipse cx={122} cy={94} rx={17} ry={21} transform="rotate(14 122 94)" />
        </g>
      )}
      {has("spot") && <ellipse cx={122} cy={92} rx={18} ry={22} fill={s.dark} opacity="0.9" />}
      {has("muzzle") && <ellipse cx={100} cy={117} rx={24} ry={17} fill={s.light} />}
      {s.ears === "floppy" && (
        <g>
          <ellipse cx={42} cy={94} rx={16} ry={36} fill={earColor} transform="rotate(8 42 94)" {...outline} />
          <ellipse cx={158} cy={94} rx={16} ry={36} fill={earColor} transform="rotate(-8 158 94)" {...outline} />
        </g>
      )}

      <ellipse cx={64} cy={114} rx={10} ry={6} fill={s.cheek} opacity="0.55" />
      <ellipse cx={136} cy={114} rx={10} ry={6} fill={s.cheek} opacity="0.55" />

      {mood === "happy"
        ? eyes.map((x, i) => (
            <path key={i} d={`M${x - 12} ${eyeY + 2} Q${x} ${eyeY - 12} ${x + 12} ${eyeY + 2}`} fill="none" stroke={s.dark === "#2b2b2b" ? "#fff" : "#3b2a20"} strokeWidth="4.5" strokeLinecap="round" />
          ))
        : eyes.map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={eyeY} r={12} fill="#fff" />
              <circle cx={x + 1} cy={eyeY + 1} r={6.5} fill="#2b2b2b" />
              <circle cx={x - 2} cy={eyeY - 3} r={2.6} fill="#fff" />
              <ellipse className="lid" cx={x} cy={eyeY} rx={12.5} ry={12.5} fill={lidColor(i)} />
            </g>
          ))}
      {mood === "hmm" && <path d="M110 70 Q122 62 134 70" fill="none" stroke="#3b2a20" strokeWidth="3.5" strokeLinecap="round" />}

      {has("snout") ? (
        <g>
          <ellipse cx={100} cy={113} rx={20} ry={13} fill={s.nose} {...outline} />
          <ellipse cx={93} cy={113} rx={3.5} ry={4.5} fill={s.dark} />
          <ellipse cx={107} cy={113} rx={3.5} ry={4.5} fill={s.dark} />
        </g>
      ) : has("koalaNose") ? (
        <ellipse cx={100} cy={111} rx={13} ry={16} fill={s.nose} />
      ) : frog ? (
        <g fill={s.dark}>
          <circle cx={93} cy={100} r={2.5} />
          <circle cx={107} cy={100} r={2.5} />
        </g>
      ) : (
        <ellipse cx={100} cy={108} rx={7} ry={5} fill={s.nose} />
      )}
      {has("whiskers") && (
        <g stroke={s.dark} strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
          <path d="M74 110 L46 104 M74 117 L46 120 M126 110 L154 104 M126 117 L154 120" />
        </g>
      )}

      {mood === "happy" ? (
        <g>
          <path d="M82 118 Q100 146 118 118 Z" fill="#7a2e3b" />
          <ellipse cx={100} cy={132} rx={8} ry={5} fill="#f472b6" />
        </g>
      ) : mood === "hmm" ? (
        <path d="M88 126 Q94 119 100 126 Q106 133 112 126" fill="none" stroke="#3b2a20" strokeWidth="3.5" strokeLinecap="round" />
      ) : frog ? (
        <path d="M80 120 Q100 138 120 120" fill="none" stroke="#3b2a20" strokeWidth="3.5" strokeLinecap="round" />
      ) : (
        <path d="M90 122 Q100 131 110 122" fill="none" stroke="#3b2a20" strokeWidth="3.5" strokeLinecap="round" />
      )}
    </svg>
  );
}
