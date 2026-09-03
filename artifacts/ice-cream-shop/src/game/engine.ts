/**
 * The rules of the shop. Pure functions, no DOM.
 *
 * A customer asks for an Order; the player assembles a Build by tapping a
 * cone, then scoops, then toppings. On Easy the scoop order does not matter
 * (a toddler counting "two pink, one brown" should not be told off for
 * stacking them the other way round). On Medium and Hard the stack has to
 * match bottom to top. Topping order never matters.
 */
import type { ConeId, CustomerId, FlavorId, ToppingId } from "./catalog.ts";
import { unlocked } from "./rewards.ts";
import type { RewardItem } from "./rewards.ts";

export const MAX_SCOOPS = 3;
export const MAX_TOPPINGS = 2;

export interface Order {
  cone: ConeId;
  scoops: FlavorId[];
  toppings: ToppingId[];
}

export type Item = { kind: "cone"; id: ConeId } | { kind: "scoop"; id: FlavorId } | { kind: "topping"; id: ToppingId };

export interface Build {
  cone: ConeId | null;
  scoops: FlavorId[];
  toppings: ToppingId[];
  /** What was added, in order, so undo takes off the most recent thing. */
  history: Item["kind"][];
}

export function emptyBuild(): Build {
  return { cone: null, scoops: [], toppings: [], history: [] };
}

export function isEmpty(b: Build): boolean {
  return b.cone === null && b.scoops.length === 0 && b.toppings.length === 0;
}

/**
 * Add an item. Returns the new build, or null when the item cannot go on:
 * a scoop with no cone under it, a fourth scoop, a topping on a bare cone,
 * the same topping twice, or a third topping. Tapping another cone swaps it.
 */
export function addItem(b: Build, item: Item): Build | null {
  switch (item.kind) {
    case "cone": {
      if (b.cone === item.id) return null;
      const history = b.cone === null ? [...b.history, "cone" as const] : b.history;
      return { ...b, cone: item.id, history };
    }
    case "scoop": {
      if (b.cone === null || b.scoops.length >= MAX_SCOOPS) return null;
      return { ...b, scoops: [...b.scoops, item.id], history: [...b.history, "scoop"] };
    }
    case "topping": {
      if (b.scoops.length === 0 || b.toppings.length >= MAX_TOPPINGS || b.toppings.includes(item.id)) return null;
      return { ...b, toppings: [...b.toppings, item.id], history: [...b.history, "topping"] };
    }
  }
}

/** Take off whatever went on last. Taking the cone off takes everything with it. */
export function undo(b: Build): Build {
  if (b.history.length === 0) return b;
  const last = b.history[b.history.length - 1];
  const history = b.history.slice(0, -1);
  switch (last) {
    case "topping":
      return { ...b, toppings: b.toppings.slice(0, -1), history };
    case "scoop":
      // Toppings sit on the scoops, so they come off with the last scoop.
      return { ...b, scoops: b.scoops.slice(0, -1), toppings: [], history: history.filter(h => h !== "topping") };
    case "cone":
      return emptyBuild();
  }
}

function sameMultiset(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((x, i) => x === sb[i]);
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/** True when the build is what was ordered. With `orderMatters` the scoops must be stacked as shown. */
export function matches(order: Order, b: Build, orderMatters = false): boolean {
  if (b.cone !== order.cone || !sameMultiset(order.toppings, b.toppings)) return false;
  return orderMatters ? sameList(order.scoops, b.scoops) : sameMultiset(order.scoops, b.scoops);
}

const count = <T>(xs: T[], x: T) => xs.filter(y => y === x).length;

/**
 * Would adding this item move the build towards the order? Used by the
 * little helper to light up the right things and dim the rest.
 */
export function isUseful(order: Order, b: Build, item: Item, orderMatters = false): boolean {
  switch (item.kind) {
    case "cone":
      return b.cone !== item.id && item.id === order.cone;
    case "scoop": {
      if (b.cone === null || b.scoops.length >= order.scoops.length) return false;
      if (orderMatters) {
        // Only helps when what is already stacked is right so far.
        const prefixOk = b.scoops.every((s, i) => s === order.scoops[i]);
        return prefixOk && order.scoops[b.scoops.length] === item.id;
      }
      return count(b.scoops, item.id) < count(order.scoops, item.id);
    }
    case "topping":
      return (
        b.scoops.length > 0 &&
        b.scoops.length === order.scoops.length &&
        order.toppings.includes(item.id) &&
        !b.toppings.includes(item.id)
      );
  }
}

/** A tap that the helper would refuse: either it cannot go on, or it is not what was ordered. */
export function helperAllows(order: Order, b: Build, item: Item, orderMatters = false): boolean {
  return addItem(b, item) !== null && isUseful(order, b, item, orderMatters);
}

export interface OrderOptions {
  /** Cap on scoops, 1 to MAX_SCOOPS. */
  maxScoops?: number;
  /** Floor on scoops once past the first ten customers. */
  minScoops?: number;
  /** Cap on toppings, 0 to MAX_TOPPINGS. */
  maxToppings?: number;
  /** Make sure the order uses this (the thing just unlocked). */
  mustInclude?: RewardItem;
}

type Rng = () => number;

function pick<T>(rng: Rng, xs: T[]): T {
  return xs[Math.floor(rng() * xs.length) % xs.length];
}

/**
 * Orders grow gently with the hearts earned: one scoop and no toppings for
 * the first ten customers, then two scoops sometimes, then three.
 */
export function makeOrder(rng: Rng, hearts: number, opts: OrderOptions = {}): Order {
  const have = unlocked(hearts);
  const maxScoops = Math.max(1, Math.min(MAX_SCOOPS, opts.maxScoops ?? MAX_SCOOPS));
  const minScoops = hearts >= 10 ? Math.max(1, Math.min(maxScoops, opts.minScoops ?? 1)) : 1;
  const maxToppings = Math.max(0, Math.min(MAX_TOPPINGS, opts.maxToppings ?? MAX_TOPPINGS));

  let n = 1;
  if (hearts >= 30) {
    const r = rng();
    n = r < 0.3 ? 1 : r < 0.7 ? 2 : 3;
  } else if (hearts >= 10) {
    n = rng() < 0.6 ? 1 : 2;
  }
  n = Math.max(minScoops, Math.min(n, maxScoops));

  const cone = pick(rng, have.cones);
  const scoops: FlavorId[] = [];
  for (let i = 0; i < n; i++) scoops.push(pick(rng, have.flavors));

  const toppings: ToppingId[] = [];
  if (have.toppings.length > 0 && maxToppings > 0) {
    const r = rng();
    let t = 0;
    if (hearts >= 50) t = r < 0.4 ? 0 : r < 0.8 ? 1 : 2;
    else t = r < 0.5 ? 0 : 1;
    t = Math.min(t, have.toppings.length, maxToppings);
    const pool = [...have.toppings];
    for (let i = 0; i < t; i++) {
      const c = pick(rng, pool);
      toppings.push(c);
      pool.splice(pool.indexOf(c), 1);
    }
  }

  const order: Order = { cone, scoops, toppings };
  const must = opts.mustInclude;
  if (must) {
    if (must.kind === "cone") order.cone = must.id;
    if (must.kind === "flavor" && !scoops.includes(must.id)) scoops[0] = must.id;
    if (must.kind === "topping" && !toppings.includes(must.id)) {
      if (toppings.length < Math.max(1, maxToppings)) toppings.push(must.id);
      else toppings[0] = must.id;
    }
  }
  return order;
}

/** Who comes in next: any unlocked friend not already at the counter. */
export function pickCustomer(rng: Rng, hearts: number, exclude: (CustomerId | null)[]): CustomerId {
  const all = unlocked(hearts).customers;
  const pool = all.filter(c => !exclude.includes(c));
  return pick(rng, pool.length > 0 ? pool : all);
}

/** Small seeded generator for tests. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
