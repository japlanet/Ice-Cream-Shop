/**
 * Draws an ice cream (cone or cup, up to three scoops, toppings) as SVG.
 * The same pieces make the tubs, jars and cones on the trays and the menu board.
 */
import { useId } from "react";
import type { CSSProperties } from "react";
import { CONES, FLAVORS, TOPPINGS } from "@/game/catalog";
import type { ConeId, ConeStyle, FlavorId, ToppingId } from "@/game/catalog";

const CX = 100;
const R = 46;
const CONE_PATH = "M52 176 L148 176 L100 292 Z";
const CUP_PATH = "M44 176 L156 176 L142 292 L58 292 Z";
const BOWL_PATH = "M26 204 Q32 262 100 266 Q168 262 174 204 Z";
const BOWL_FOOT = "M80 262 L120 262 L132 292 L68 292 Z";
const GLASS_PATH = "M56 112 L144 112 L128 292 L72 292 Z";
const LIQUID_PATH = "M59 128 L141 128 L127 289 L73 289 Z";

interface Spot {
  cx: number;
  cy: number;
  r: number;
}

/** Where each scoop sits: stacked on cones and cups, side by side in a bowl, dropped into a glass. */
function scoopSpots(shape: ConeStyle["shape"], n: number): Spot[] {
  if (shape === "bowl") {
    if (n === 1) return [{ cx: 100, cy: 190, r: 42 }];
    if (n === 2) return [{ cx: 74, cy: 194, r: 36 }, { cx: 126, cy: 194, r: 36 }].slice(0, n);
    return [{ cx: 68, cy: 198, r: 34 }, { cx: 132, cy: 198, r: 34 }, { cx: 100, cy: 160, r: 36 }].slice(0, n);
  }
  if (shape === "glass") return [{ cx: 100, cy: 256, r: 28 }, { cx: 100, cy: 212, r: 28 }].slice(0, n);
  // Four scoops squeeze a little closer so the tower still fits.
  const base = shape === "cup" ? 162 : 168;
  const gap = n >= 4 ? 42 : 48;
  const r = n >= 4 ? 44 : R;
  return Array.from({ length: n }, (_, i) => ({ cx: CX, cy: base - i * gap, r }));
}

/** Where the toppings go: on the top scoop, across the whole sundae, or on the blended shake. */
function toppingSpot(shape: ConeStyle["shape"], spots: Spot[], blended: boolean): Spot | null {
  if (spots.length === 0) return null;
  if (shape === "glass") return blended ? { cx: 100, cy: 150, r: 38 } : null;
  if (shape === "bowl") return { cx: 100, cy: Math.min(...spots.map(s => s.cy)), r: spots.length === 1 ? 42 : 44 };
  return spots[spots.length - 1];
}
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

/** Drawn first, so the scoops sit on them and the point toppings above them. */
const COVER_TOPPINGS: ToppingId[] = ["sauce", "whip", "sprinkles"];

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
  if (id === "whip") {
    // A swirl of whipped cream: three soft tiers and a curl on top.
    const y = cy - r * 0.72;
    return (
      <g stroke="#e7e2d8" strokeWidth={r * 0.035}>
        <ellipse cx={cx} cy={y + r * 0.1} rx={r * 0.8} ry={r * 0.3} fill="#fffdf7" />
        <ellipse cx={cx} cy={y - r * 0.16} rx={r * 0.6} ry={r * 0.25} fill="#fffefa" />
        <ellipse cx={cx} cy={y - r * 0.38} rx={r * 0.38} ry={r * 0.2} fill="#ffffff" />
        <path d={`M${cx - r * 0.12} ${y - r * 0.52} Q ${cx + r * 0.05} ${y - r * 0.9} ${cx + r * 0.2} ${y - r * 0.62}`} fill="#ffffff" strokeLinejoin="round" />
        <ellipse cx={cx - r * 0.3} cy={y - r * 0.05} rx={r * 0.18} ry={r * 0.06} fill="#fff" stroke="none" opacity="0.9" />
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
  if (id === "wafer") {
    // A wafer stuck in at a jaunty angle, with its criss-cross pattern.
    const w = r * 0.34;
    const h = r * 1.05;
    const x = cx - w / 2;
    const y = cy - r * 1.35;
    return (
      <g transform={`rotate(16 ${cx} ${cy - r * 0.6})`}>
        <rect x={x} y={y} width={w} height={h} rx={r * 0.05} fill="#f3c27a" stroke="#b7803a" strokeWidth={r * 0.035} />
        {[0.25, 0.5, 0.75].map(f => (
          <line key={"h" + f} x1={x} y1={y + h * f} x2={x + w} y2={y + h * f} stroke="#c98f45" strokeWidth={r * 0.025} />
        ))}
        <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#c98f45" strokeWidth={r * 0.025} />
        <rect x={x + w * 0.12} y={y + h * 0.05} width={w * 0.2} height={h * 0.9} fill="#fff" opacity="0.25" />
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
  // Cherries and the like sit up on the cream when there is some.
  const lift = toppings.includes("whip") ? r * 0.55 : 0;
  return (
    <g>
      {covers.map(t => (
        <Topping key={t} id={t} cx={cx} cy={cy} r={r} />
      ))}
      {points.map((t, i) => (
        <Topping key={t} id={t} cx={cx + (i - (points.length - 1) / 2) * 0.46 * r} cy={cy - lift} r={r} />
      ))}
    </g>
  );
}

/** The inside of a sundae bowl or milkshake glass: drawn behind the scoops. */
function ContainerBack({ cone }: { cone: ConeId }) {
  const c = CONES[cone];
  if (c.shape === "bowl") return <ellipse cx={100} cy={204} rx={74} ry={13} fill="#bae6fd" stroke={c.dark} strokeWidth="3" />;
  if (c.shape === "glass") return <path d={GLASS_PATH} fill="#eff6ff" opacity="0.75" />;
  return null;
}

/** The front of a sundae bowl or milkshake glass: drawn over the scoops, so they sit inside. */
function ContainerFront({ cone, uid, liquid }: { cone: ConeId; uid: string; liquid: FlavorId[] | null }) {
  const c = CONES[cone];
  if (c.shape === "bowl") {
    return (
      <g>
        <path d={BOWL_FOOT} fill="#e0f2fe" stroke={c.dark} strokeWidth="3" strokeLinejoin="round" />
        <path d={BOWL_PATH} fill="#e0f2fe" fillOpacity="0.92" stroke={c.dark} strokeWidth="3" strokeLinejoin="round" />
        <path d="M40 214 Q48 248 84 256" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity="0.8" />
        <path d="M26 204 Q100 222 174 204" fill="none" stroke={c.dark} strokeWidth="3" />
      </g>
    );
  }
  if (c.shape !== "glass") return null;
  const gid = `${uid}-shake`;
  const colors = liquid?.map(f => FLAVORS[f].stripes?.[0] ?? FLAVORS[f].color) ?? [];
  return (
    <g>
      {liquid && (
        <g>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0.35" y2="1">
              {colors.length === 1 ? (
                <>
                  <stop offset="0" stopColor={FLAVORS[liquid[0]].light} />
                  <stop offset="1" stopColor={colors[0]} />
                </>
              ) : (
                colors.map((col, i) => <stop key={i} offset={i / (colors.length - 1)} stopColor={col} />)
              )}
            </linearGradient>
          </defs>
          <path d={LIQUID_PATH} fill={`url(#${gid})`} />
          <path d="M59 128 Q80 138 100 128 Q120 138 141 128 L140 142 Q120 150 100 142 Q80 150 60 142 Z" fill="#fff" opacity="0.45" />
          {colors.length > 1 && (
            <path d="M70 170 Q100 150 128 176 Q96 196 76 214 Q104 228 122 250" fill="none" stroke={colors[0]} strokeWidth="6" strokeLinecap="round" opacity="0.7" />
          )}
          {/* The straw. */}
          <g transform="rotate(12 112 120)">
            <rect x={106} y={40} width={12} height={200} rx={6} fill="#fff" stroke="#f472b6" strokeWidth="2" />
            {[48, 76, 104, 132].map(y => (
              <path key={y} d={`M106 ${y} L118 ${y + 12} L118 ${y + 22} L106 ${y + 10} Z`} fill="#f472b6" />
            ))}
          </g>
        </g>
      )}
      <path d={GLASS_PATH} fill="none" stroke={c.dark} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M66 124 L78 280" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      <ellipse cx={100} cy={112} rx={44} ry={7} fill="none" stroke={c.dark} strokeWidth="3" />
      <path d="M72 292 L128 292 L132 298 L68 298 Z" fill={c.dark} opacity="0.6" />
    </g>
  );
}

export interface IceCreamViewProps {
  cone: ConeId | null;
  scoops: FlavorId[];
  toppings: ToppingId[];
  /** A milkshake that has been through the blender. */
  blended?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Show a faint outline when there is nothing yet. */
  ghost?: boolean;
}

/** A whole ice cream, sundae or milkshake. New pieces pop in. */
export function IceCreamView({ cone, scoops, toppings, blended = false, className, style, ghost }: IceCreamViewProps) {
  const uid = useUid();
  const shape = cone ? CONES[cone].shape : "cone";
  const spots = scoopSpots(shape, scoops.length);
  const liquid = shape === "glass" && blended ? scoops : null;
  const top = toppingSpot(shape, spots, blended);
  const inside = shape === "bowl" || shape === "glass";
  const scoopAt = (i: number) => (
    <g key={`${i}-${scoops[i]}-${scoops.length >= 4 ? 4 : 3}`} className="pop" style={{ transformOrigin: `${spots[i].cx}px ${spots[i].cy + spots[i].r}px` }}>
      <Scoop flavor={scoops[i]} cx={spots[i].cx} cy={spots[i].cy} r={spots[i].r} uid={uid} />
    </g>
  );
  return (
    <svg viewBox="0 -30 200 330" className={className} style={style} aria-hidden="true">
      {!cone && ghost && (
        <g fill="none" stroke="#9ca3af" strokeWidth="3" strokeDasharray="8 8" opacity="0.5">
          <path d={CONE_PATH} />
          <circle cx={CX} cy={168} r={R} />
        </g>
      )}
      {cone && inside && <ContainerBack cone={cone} />}
      {cone && !inside && (
        <g key={cone} className="pop" style={{ transformOrigin: `${CX}px 292px` }}>
          <Cone cone={cone} uid={uid} />
        </g>
      )}
      {!liquid && scoops.map((_, i) => scoopAt(i))}
      {cone && inside && (
        <g key={cone + (liquid ? "-blended" : "")} className="pop" style={{ transformOrigin: `${CX}px 292px` }}>
          <ContainerFront cone={cone} uid={uid} liquid={liquid} />
        </g>
      )}
      {top !== null && (
        <g key={toppings.join(",")} className={toppings.length ? "pop" : ""} style={{ transformOrigin: `${top.cx}px ${top.cy}px` }}>
          <Toppings toppings={toppings} cx={top.cx} cy={top.cy} r={top.r} />
        </g>
      )}
    </svg>
  );
}

/** A tub of one flavour with a scoop sitting in it, for the flavour tray and the menu board. */
export function TubIcon({ flavor, className }: { flavor: FlavorId; className?: string }) {
  const uid = useUid();
  const f = FLAVORS[flavor];
  const band = f.stripes ? f.stripes[0] : f.color;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d="M20 52 L26 93 Q50 100 74 93 L80 52 Z" fill="#fafafa" stroke="#cbd5e1" strokeWidth="2" strokeLinejoin="round" />
      <path d="M23 68 L77 68 L75 84 Q50 90 25 84 Z" fill={band} />
      {f.stripes && <path d="M24 76 L76 76 L75 84 Q50 90 25 84 Z" fill={f.stripes[3]} />}
      <ellipse cx={50} cy={52} rx={30} ry={9} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
      <ellipse cx={50} cy={52} rx={22} ry={5} fill={f.stripes ? f.stripes[2] : f.color} opacity="0.5" />
      <Scoop flavor={flavor} cx={50} cy={36} r={25} uid={uid} />
    </svg>
  );
}

/** A glass bowl of one topping, for the topping tray and the menu board. */
export function JarIcon({ topping, className }: { topping: ToppingId; className?: string }) {
  const point = !COVER_TOPPINGS.includes(topping);
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
        <Toppings toppings={[topping]} cx={50} cy={point ? 72 : topping === "whip" ? 74 : 62} r={point ? 22 : 24} />
      )}
      <ellipse cx={50} cy={50} rx={34} ry={7} fill="none" stroke="#bfdbfe" strokeWidth="2" />
      <path d="M24 60 Q28 76 40 82" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

/** An empty cone or cup standing in a holder (or an empty sundae bowl or milkshake glass), for the trays and the menu board. */
export function ConeIcon({ cone, className }: { cone: ConeId; className?: string }) {
  const uid = useUid();
  const shape = CONES[cone].shape;
  if (shape === "bowl" || shape === "glass") {
    return (
      <svg viewBox={shape === "bowl" ? "14 150 172 150" : "30 96 140 206"} className={className} aria-hidden="true">
        <ContainerBack cone={cone} />
        {shape === "glass" && (
          <g transform="rotate(12 112 120)">
            <rect x={106} y={60} width={12} height={200} rx={6} fill="#fff" stroke="#f472b6" strokeWidth="2" />
            {[68, 96].map(y => (
              <path key={y} d={`M106 ${y} L118 ${y + 12} L118 ${y + 22} L106 ${y + 10} Z`} fill="#f472b6" />
            ))}
          </g>
        )}
        <ContainerFront cone={cone} uid={uid} liquid={null} />
      </svg>
    );
  }
  return (
    <svg viewBox="26 150 148 156" className={className} aria-hidden="true">
      <ellipse cx={100} cy={224} rx={58} ry={14} fill="#fbbf24" stroke="#b45309" strokeWidth="3" />
      <Cone cone={cone} uid={uid} />
      <path d="M42 224 A58 14 0 0 0 158 224" fill="none" stroke="#f59e0b" strokeWidth="9" />
      <path d="M42 224 A58 14 0 0 0 158 224" fill="none" stroke="#b45309" strokeWidth="2" transform="translate(0 5)" opacity="0.6" />
    </svg>
  );
}

/** The blender, for the button that blends a milkshake. */
export function BlenderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d="M28 14 L72 14 L66 62 L34 62 Z" fill="#e0f2fe" fillOpacity="0.9" stroke="#60a5fa" strokeWidth="3" strokeLinejoin="round" />
      <path d="M33 36 Q50 26 67 38 L65 60 L35 60 Z" fill="#f9a8d4" />
      <path d="M40 46 Q50 38 60 48" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <rect x={24} y={8} width={52} height={9} rx={4} fill="#60a5fa" />
      <path d="M30 62 L70 62 L76 90 L24 90 Z" fill="#fb7185" stroke="#be123c" strokeWidth="3" strokeLinejoin="round" />
      <circle cx={50} cy={76} r={6} fill="#fff" />
    </svg>
  );
}
