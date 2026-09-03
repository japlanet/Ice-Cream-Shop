/**
 * Draws an ice cream (cone or cup, up to three scoops, toppings) as SVG.
 * The same pieces make the tubs, jars and cones on the trays and the menu board.
 */
import { useId } from "react";
import type { CSSProperties } from "react";
import { CONES, FLAVORS, TOPPINGS } from "@/game/catalog";
import type { ConeId, FlavorId, ToppingId } from "@/game/catalog";

const CX = 100;
const R = 46;
const SCOOP_Y: Record<"cone" | "cup", number[]> = { cone: [168, 120, 72], cup: [158, 110, 62] };
const CONE_PATH = "M52 176 L148 176 L100 292 Z";
const CUP_PATH = "M44 176 L156 176 L142 292 L58 292 Z";
const DIP_PATH =
  "M40 170 L160 170 L160 195 Q150 212 140 195 Q130 214 120 196 Q110 216 100 198 Q90 214 80 196 Q70 212 60 195 Q50 210 40 195 Z";

/** Positions inside a unit circle for flecks in the ice cream. */
const SPECKS: [number, number][] = [
  [-0.4, -0.1], [0.2, -0.45], [0.45, 0.2], [-0.15, 0.4], [0.1, 0.05], [-0.5, 0.35], [0.5, -0.2], [-0.2, -0.55], [0.3, 0.5],
];
/** Sprinkles: position in the unit circle, rotation, colour index. */
const SPRINKLES: [number, number, number, number][] = [
  [-0.55, -0.2, 20, 0], [-0.3, -0.55, -40, 1], [0.05, -0.7, 70, 2], [0.4, -0.5, 10, 3], [0.62, -0.1, -60, 4],
  [0.45, 0.3, 35, 5], [0.1, 0.1, -20, 0], [-0.25, 0.25, 80, 1], [-0.6, 0.35, -15, 2], [0.2, 0.55, 50, 3],
  [-0.1, -0.3, -75, 4], [0.3, -0.15, 15, 5], [-0.45, 0.6, 40, 0], [0.6, 0.55, -35, 1],
];
const SPRINKLE_COLORS = ["#f43f5e", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#f97316"];

function useUid(): string {
  return "ic" + useId().replace(/[^a-zA-Z0-9]/g, "");
}

/** A scoop: round on top, four soft bumps underneath like a real scoop. */
function scoopPath(cx: number, cy: number, r: number): string {
  let d = `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const bumps = 4;
  for (let k = 0; k < bumps; k++) {
    const mid = (Math.PI * (k + 0.5)) / bumps;
    const end = (Math.PI * (k + 1)) / bumps;
    const qx = cx + 1.24 * r * Math.cos(mid);
    const qy = cy + 1.24 * r * Math.sin(mid);
    d += ` Q${qx.toFixed(1)} ${qy.toFixed(1)} ${(cx + r * Math.cos(end)).toFixed(1)} ${(cy + r * Math.sin(end)).toFixed(1)}`;
  }
  return d + " Z";
}

interface ScoopProps {
  flavor: FlavorId;
  cx: number;
  cy: number;
  r: number;
  uid: string;
  /** Plain circle (for tubs, where the bottom is hidden anyway). */
  round?: boolean;
}

export function Scoop({ flavor, cx, cy, r, uid, round }: ScoopProps) {
  const f = FLAVORS[flavor];
  const gid = `${uid}-${flavor}`;
  return (
    <g>
      <defs>
        {f.stripes ? (
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            {f.stripes.flatMap((c, i, arr) => [
              <stop key={i + "a"} offset={i / arr.length} stopColor={c} />,
              <stop key={i + "b"} offset={(i + 1) / arr.length} stopColor={c} />,
            ])}
          </linearGradient>
        ) : (
          <radialGradient id={gid} cx="0.38" cy="0.3" r="0.8">
            <stop offset="0" stopColor={f.light} />
            <stop offset="0.5" stopColor={f.color} />
            <stop offset="1" stopColor={f.dark} />
          </radialGradient>
        )}
      </defs>
      {round ? (
        <circle cx={cx} cy={cy} r={r} fill={`url(#${gid})`} stroke={f.dark} strokeWidth={r * 0.05} strokeOpacity="0.55" />
      ) : (
        <path d={scoopPath(cx, cy, r)} fill={`url(#${gid})`} stroke={f.dark} strokeWidth={r * 0.05} strokeOpacity="0.55" strokeLinejoin="round" />
      )}
      {f.specks && SPECKS.map(([dx, dy], i) => <circle key={i} cx={cx + dx * r} cy={cy + dy * r} r={r * 0.05} fill={f.specks} opacity="0.85" />)}
      <ellipse
        cx={cx - r * 0.32}
        cy={cy - r * 0.42}
        rx={r * 0.24}
        ry={r * 0.13}
        fill="#fff"
        opacity="0.55"
        transform={`rotate(-30 ${cx - r * 0.32} ${cy - r * 0.42})`}
      />
    </g>
  );
}

function Cone({ cone, uid }: { cone: ConeId; uid: string }) {
  const c = CONES[cone];
  const clip = `${uid}-clip-${cone}`;
  if (c.shape === "cup") {
    return (
      <g>
        <defs>
          <clipPath id={clip}>
            <path d={CUP_PATH} />
          </clipPath>
        </defs>
        <path d={CUP_PATH} fill={c.fill} />
        <g clipPath={`url(#${clip})`}>
          {[0, 1, 2, 3, 4].map(i => (
            <rect key={i} x={50 + i * 22} y="170" width="11" height="130" fill={c.dark} opacity="0.7" />
          ))}
          <path d="M44 176 L80 176 L70 292 L58 292 Z" fill="#fff" opacity="0.35" />
        </g>
        <path d={CUP_PATH} fill="none" stroke={c.dark} strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx={CX} cy={176} rx={56} ry={9} fill="#fff" stroke={c.dark} strokeWidth="3" />
      </g>
    );
  }
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={CONE_PATH} />
        </clipPath>
      </defs>
      <path d={CONE_PATH} fill={c.fill} />
      <g clipPath={`url(#${clip})`}>
        {c.stripes ? (
          c.stripes.map((s, i) => <rect key={i} x="40" y={176 + i * 20} width="120" height="20" fill={s} />)
        ) : (
          <g stroke={c.dark} strokeWidth="2.5" opacity="0.6">
            {[-2, -1, 0, 1, 2, 3, 4].map(i => (
              <line key={"a" + i} x1={40 + i * 24} y1="170" x2={100 + i * 24} y2="300" />
            ))}
            {[-2, -1, 0, 1, 2, 3, 4].map(i => (
              <line key={"b" + i} x1={160 - i * 24} y1="170" x2={100 - i * 24} y2="300" />
            ))}
          </g>
        )}
        <path d="M52 176 L84 176 L100 292 Z" fill="#fff" opacity="0.22" />
        <path d="M120 176 L148 176 L100 292 Z" fill="#000" opacity="0.1" />
        {c.dip && <path d={DIP_PATH} fill={c.dip} />}
      </g>
      <path d={CONE_PATH} fill="none" stroke={c.dark} strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx={CX} cy={176} rx={48} ry={8} fill={c.dip ?? c.fill} stroke={c.dip ? "#3b2412" : c.dark} strokeWidth="3" />
    </g>
  );
}

const COVER_TOPPINGS: ToppingId[] = ["sauce", "sprinkles"];

interface ToppingProps {
  id: ToppingId;
  cx: number;
  cy: number;
  r: number;
}

function Topping({ id, cx, cy, r }: ToppingProps) {
  const t = TOPPINGS[id];
  if (id === "sprinkles") {
    return (
      <g>
        {SPRINKLES.map(([dx, dy, rot, ci], i) => (
          <rect
            key={i}
            x={cx + dx * r - r * 0.11}
            y={cy + dy * r - r * 0.04}
            width={r * 0.22}
            height={r * 0.08}
            rx={r * 0.04}
            fill={SPRINKLE_COLORS[ci]}
            transform={`rotate(${rot} ${cx + dx * r} ${cy + dy * r})`}
          />
        ))}
      </g>
    );
  }
  if (id === "sauce") {
    const y = cy - 0.1 * r;
    const L = cx - 0.92 * r;
    const Rt = cx + 0.92 * r;
    const d =
      `M${L} ${y} C ${cx - 0.75 * r} ${cy - 1.34 * r}, ${cx + 0.75 * r} ${cy - 1.34 * r}, ${Rt} ${y} ` +
      `Q ${Rt - 0.05 * r} ${y + 0.45 * r} ${Rt - 0.2 * r} ${y + 0.15 * r} ` +
      `Q ${cx + 0.5 * r} ${y + 0.75 * r} ${cx + 0.35 * r} ${y + 0.2 * r} ` +
      `Q ${cx + 0.1 * r} ${y + 0.5 * r} ${cx - 0.05 * r} ${y + 0.15 * r} ` +
      `Q ${cx - 0.25 * r} ${y + 0.85 * r} ${cx - 0.45 * r} ${y + 0.2 * r} ` +
      `Q ${cx - 0.65 * r} ${y + 0.5 * r} ${cx - 0.8 * r} ${y + 0.1 * r} ` +
      `Q ${L + 0.02 * r} ${y + 0.3 * r} ${L} ${y} Z`;
    return (
      <g>
        <path d={d} fill="#5b3a1e" stroke="#3b2412" strokeWidth={r * 0.03} strokeLinejoin="round" />
        <ellipse cx={cx - r * 0.3} cy={cy - r * 0.85} rx={r * 0.2} ry={r * 0.08} fill="#fff" opacity="0.3" />
      </g>
    );
  }
  if (id === "cherry") {
    const cy2 = cy - r * 0.98;
    const cr = r * 0.24;
    return (
      <g>
        <path
          d={`M${cx} ${cy2 - cr * 0.6} Q ${cx + cr * 0.6} ${cy2 - cr * 2.4} ${cx + cr * 1.6} ${cy2 - cr * 2.6}`}
          fill="none"
          stroke="#3f6212"
          strokeWidth={r * 0.06}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy2} r={cr} fill="#e11d48" stroke="#9f1239" strokeWidth={r * 0.03} />
        <circle cx={cx - cr * 0.35} cy={cy2 - cr * 0.35} r={cr * 0.28} fill="#fff" opacity="0.6" />
      </g>
    );
  }
  return (
    <text x={cx} y={cy - r * 0.72} fontSize={r * 0.95} textAnchor="middle" dominantBaseline="central">
      {t.emoji}
    </text>
  );
}

function Toppings({ toppings, cx, cy, r }: { toppings: ToppingId[]; cx: number; cy: number; r: number }) {
  const covers = toppings.filter(t => COVER_TOPPINGS.includes(t)).sort((a, b) => COVER_TOPPINGS.indexOf(a) - COVER_TOPPINGS.indexOf(b));
  const points = toppings.filter(t => !COVER_TOPPINGS.includes(t));
  return (
    <g>
      {covers.map(t => (
        <Topping key={t} id={t} cx={cx} cy={cy} r={r} />
      ))}
      {points.map((t, i) => (
        <Topping key={t} id={t} cx={points.length === 2 ? cx + (i === 0 ? -0.42 : 0.42) * r : cx} cy={cy} r={r} />
      ))}
    </g>
  );
}

export interface IceCreamViewProps {
  cone: ConeId | null;
  scoops: FlavorId[];
  toppings: ToppingId[];
  className?: string;
  style?: CSSProperties;
  /** Show a faint outline when there is nothing yet. */
  ghost?: boolean;
}

/** A whole ice cream, in a 200 by 300 box. New pieces pop in. */
export function IceCreamView({ cone, scoops, toppings, className, style, ghost }: IceCreamViewProps) {
  const uid = useUid();
  const shape = cone ? CONES[cone].shape : "cone";
  const ys = SCOOP_Y[shape];
  const top = scoops.length > 0 ? ys[scoops.length - 1] : null;
  const scoopAt = (i: number) => (
    <g key={`${i}-${scoops[i]}`} className="pop" style={{ transformOrigin: `${CX}px ${ys[i] + R}px` }}>
      <Scoop flavor={scoops[i]} cx={CX} cy={ys[i]} r={R} uid={uid} />
    </g>
  );
  return (
    <svg viewBox="0 0 200 300" className={className} style={style} aria-hidden="true">
      {!cone && ghost && (
        <g fill="none" stroke="#9ca3af" strokeWidth="3" strokeDasharray="8 8" opacity="0.5">
          <path d={CONE_PATH} />
          <circle cx={CX} cy={168} r={R} />
        </g>
      )}
      {shape === "cup" ? (
        <>
          {scoops[0] && scoopAt(0)}
          {cone && (
            <g key={cone} className="pop" style={{ transformOrigin: `${CX}px 292px` }}>
              <Cone cone={cone} uid={uid} />
            </g>
          )}
          {scoops.slice(1).map((_, i) => scoopAt(i + 1))}
        </>
      ) : (
        <>
          {cone && (
            <g key={cone} className="pop" style={{ transformOrigin: `${CX}px 292px` }}>
              <Cone cone={cone} uid={uid} />
            </g>
          )}
          {scoops.map((_, i) => scoopAt(i))}
        </>
      )}
      {top !== null && (
        <g key={toppings.join(",")} className={toppings.length ? "pop" : ""} style={{ transformOrigin: `${CX}px ${top}px` }}>
          <Toppings toppings={toppings} cx={CX} cy={top} r={R} />
        </g>
      )}
    </svg>
  );
}

/** A tub of one flavour with a scoop sitting in it, for the flavour tray and the menu board. */
export function TubIcon({ flavor, className }: { flavor: FlavorId; className?: string }) {
  const uid = useUid();
  const f = FLAVORS[flavor];
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <ellipse cx={50} cy={48} rx={30} ry={9} fill={f.dark} opacity="0.5" />
      <Scoop flavor={flavor} cx={50} cy={30} r={25} uid={uid} round />
      <path d="M20 48 L26 92 Q50 99 74 92 L80 48 Z" fill="#fafafa" stroke="#cbd5e1" strokeWidth="2" strokeLinejoin="round" />
      <path d="M23 62 L77 62 L75 77 Q50 83 25 77 Z" fill={f.stripes ? f.stripes[0] : f.color} />
      {f.stripes && <path d="M24 70 L76 70 L75 77 Q50 83 25 77 Z" fill={f.stripes[3]} />}
      <ellipse cx={50} cy={48} rx={30} ry={9} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
      <ellipse cx={50} cy={48} rx={22} ry={5} fill={f.stripes ? f.stripes[2] : f.color} opacity="0.8" />
    </svg>
  );
}

/** A glass bowl of one topping, for the topping tray and the menu board. */
export function JarIcon({ topping, className }: { topping: ToppingId; className?: string }) {
  const point = topping === "cherry" || topping === "candy" || topping === "cookie";
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d="M16 50 A34 34 0 0 0 84 50 Z" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2.5" />
      {topping !== "sauce" && <ellipse cx={50} cy={54} rx={28} ry={9} fill="#fff7ed" stroke="#fed7aa" strokeWidth="1.5" />}
      {topping === "sauce" ? (
        <g>
          <ellipse cx={50} cy={52} rx={30} ry={10} fill="#5b3a1e" />
          <ellipse cx={42} cy={49} rx={9} ry={3} fill="#fff" opacity="0.3" />
        </g>
      ) : (
        <Toppings toppings={[topping]} cx={50} cy={point ? 72 : 62} r={point ? 22 : 24} />
      )}
      <ellipse cx={50} cy={50} rx={34} ry={7} fill="none" stroke="#bfdbfe" strokeWidth="2" />
      <path d="M24 60 Q28 76 40 82" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

/** An empty cone or cup standing in a holder, for the cone tray and the menu board. */
export function ConeIcon({ cone, className }: { cone: ConeId; className?: string }) {
  const uid = useUid();
  return (
    <svg viewBox="26 150 148 156" className={className} aria-hidden="true">
      <ellipse cx={100} cy={224} rx={58} ry={14} fill="#fbbf24" stroke="#b45309" strokeWidth="3" />
      <Cone cone={cone} uid={uid} />
      <path d="M42 224 A58 14 0 0 0 158 224" fill="none" stroke="#f59e0b" strokeWidth="9" />
      <path d="M42 224 A58 14 0 0 0 158 224" fill="none" stroke="#b45309" strokeWidth="2" transform="translate(0 5)" opacity="0.6" />
    </svg>
  );
}
