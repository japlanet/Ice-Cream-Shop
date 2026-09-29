/**
 * Hearts (happy customers so far) live in localStorage so the shop keeps
 * everything it has earned between visits.
 */
import { freshDecor, isDecorState } from "./decor.ts";
import type { DecorState } from "./decor.ts";
import { isLevel } from "./levels.ts";
import type { Level } from "./levels.ts";

const PREFIX = "ice-cream-";
export const HEARTS_KEY = PREFIX + "hearts";

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadHearts(): number {
  try {
    const raw = storage()?.getItem(HEARTS_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function storeHearts(hearts: number): void {
  try {
    storage()?.setItem(HEARTS_KEY, String(hearts));
  } catch {}
}

/** Everything this game ever stored: hearts, coins and decorations, settings, sound toggles. */
export function eraseAllProgress(): void {
  const s = storage();
  if (!s) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    for (const k of keys) s.removeItem(k);
  } catch {}
}

export const LEVEL_KEY = PREFIX + "level";

export function loadLevel(): Level {
  try {
    const n = Number(storage()?.getItem(LEVEL_KEY));
    return isLevel(n) ? n : 1;
  } catch {
    return 1;
  }
}

export function storeLevel(level: Level): void {
  try {
    storage()?.setItem(LEVEL_KEY, String(level));
  } catch {}
}

export const DECOR_KEY = PREFIX + "decor";

/** Coins and decorations, or a fresh shop when nothing valid is saved. */
export function loadDecor(): DecorState {
  try {
    const raw = storage()?.getItem(DECOR_KEY);
    if (!raw) return freshDecor();
    const parsed: unknown = JSON.parse(raw);
    return isDecorState(parsed) ? parsed : freshDecor();
  } catch {
    return freshDecor();
  }
}

export function storeDecor(state: DecorState): void {
  try {
    storage()?.setItem(DECOR_KEY, JSON.stringify(state));
  } catch {}
}
