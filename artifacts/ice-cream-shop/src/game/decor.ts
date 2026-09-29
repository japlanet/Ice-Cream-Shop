/**
 * The decorations shop: coins earned from serving buy a new awning,
 * wallpaper, counter, or a hat that every friend wears. Pure functions;
 * saving lives in save.ts.
 */
export type DecorKind = "awning" | "wall" | "counter" | "hat";

export interface DecorItem {
  id: string;
  kind: DecorKind;
  name: string;
  price: number;
}

export const DECOR: DecorItem[] = [
  { id: "awning-pink", kind: "awning", name: "Strawberry awning", price: 0 },
  { id: "awning-mint", kind: "awning", name: "Mint awning", price: 25 },
  { id: "awning-lemon", kind: "awning", name: "Lemon awning", price: 25 },
  { id: "awning-blue", kind: "awning", name: "Blueberry awning", price: 35 },
  { id: "awning-rainbow", kind: "awning", name: "Rainbow awning", price: 80 },
  { id: "wall-dots", kind: "wall", name: "Dotty wallpaper", price: 0 },
  { id: "wall-hearts", kind: "wall", name: "Heart wallpaper", price: 30 },
  { id: "wall-stars", kind: "wall", name: "Star wallpaper", price: 40 },
  { id: "wall-sprinkles", kind: "wall", name: "Sprinkle wallpaper", price: 50 },
  { id: "wall-stripes", kind: "wall", name: "Candy stripe wallpaper", price: 60 },
  { id: "counter-pink", kind: "counter", name: "Pink counter", price: 0 },
  { id: "counter-mint", kind: "counter", name: "Mint counter", price: 30 },
  { id: "counter-choc", kind: "counter", name: "Chocolate counter", price: 45 },
  { id: "counter-rainbow", kind: "counter", name: "Rainbow counter", price: 90 },
  { id: "hat-none", kind: "hat", name: "No hats", price: 0 },
  { id: "hat-party", kind: "hat", name: "Party hats", price: 40 },
  { id: "hat-bow", kind: "hat", name: "Bows", price: 40 },
  { id: "hat-flower", kind: "hat", name: "Flowers", price: 50 },
  { id: "hat-chef", kind: "hat", name: "Chef hats", price: 70 },
  { id: "hat-crown", kind: "hat", name: "Crowns", price: 120 },
];

export const DECOR_KINDS: DecorKind[] = ["awning", "wall", "counter", "hat"];

export interface DecorState {
  coins: number;
  owned: string[];
  equipped: Record<DecorKind, string>;
}

export function decorById(id: string): DecorItem | undefined {
  return DECOR.find(d => d.id === id);
}

export function freshDecor(): DecorState {
  const free = DECOR.filter(d => d.price === 0);
  const equipped = Object.fromEntries(DECOR_KINDS.map(k => [k, free.find(d => d.kind === k)!.id])) as Record<DecorKind, string>;
  return { coins: 0, owned: free.map(d => d.id), equipped };
}

export function owns(state: DecorState, id: string): boolean {
  return decorById(id)?.price === 0 || state.owned.includes(id);
}

/**
 * Tap an item in the shop: an owned item is put up straight away; one that is
 * not owned is bought and put up if there are enough coins. Returns null when
 * it cannot be afforded (or does not exist), so the shop can wobble it.
 */
export function tapDecor(state: DecorState, id: string): DecorState | null {
  const item = decorById(id);
  if (!item) return null;
  if (owns(state, id)) return { ...state, equipped: { ...state.equipped, [item.kind]: id } };
  if (state.coins < item.price) return null;
  return { coins: state.coins - item.price, owned: [...state.owned, id], equipped: { ...state.equipped, [item.kind]: id } };
}

export function addCoins(state: DecorState, coins: number): DecorState {
  return { ...state, coins: state.coins + Math.max(0, Math.floor(coins)) };
}

/** True when `x` looks like a DecorState we wrote, so a stale or fiddled value cannot break the shop. */
export function isDecorState(x: unknown): x is DecorState {
  if (typeof x !== "object" || x === null) return false;
  const s = x as Record<string, unknown>;
  if (!Number.isInteger(s.coins) || (s.coins as number) < 0) return false;
  if (!Array.isArray(s.owned) || !s.owned.every(id => typeof id === "string")) return false;
  if (typeof s.equipped !== "object" || s.equipped === null) return false;
  const e = s.equipped as Record<string, unknown>;
  return DECOR_KINDS.every(k => typeof e[k] === "string" && decorById(e[k] as string)?.kind === k && owns(s as unknown as DecorState, e[k] as string));
}
