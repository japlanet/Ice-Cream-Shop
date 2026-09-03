/**
 * The reward ladder. Each happy customer is a heart; every ten to twenty
 * hearts something new arrives: a flavour, a topping, a cone, or a new
 * friend who starts visiting the shop.
 */
import { CONE_ORDER, CUSTOMER_ORDER, FLAVOR_ORDER, STARTER, TOPPING_ORDER } from "./catalog.ts";
import type { ConeId, CustomerId, FlavorId, ToppingId } from "./catalog.ts";

export type RewardItem =
  | { kind: "cone"; id: ConeId }
  | { kind: "flavor"; id: FlavorId }
  | { kind: "topping"; id: ToppingId }
  | { kind: "customer"; id: CustomerId };

export type Reward = RewardItem & { at: number };

/** In the order they are earned. The gap between two rewards is always 10 to 20 hearts. */
export const REWARDS: Reward[] = [
  { at: 10, kind: "topping", id: "sprinkles" },
  { at: 20, kind: "flavor", id: "mint" },
  { at: 30, kind: "cone", id: "choco" },
  { at: 40, kind: "customer", id: "fox" },
  { at: 50, kind: "topping", id: "cherry" },
  { at: 65, kind: "flavor", id: "blueberry" },
  { at: 80, kind: "customer", id: "panda" },
  { at: 95, kind: "topping", id: "sauce" },
  { at: 110, kind: "flavor", id: "lemon" },
  { at: 125, kind: "cone", id: "rainbow" },
  { at: 140, kind: "customer", id: "lion" },
  { at: 160, kind: "flavor", id: "bubblegum" },
  { at: 180, kind: "topping", id: "candy" },
  { at: 200, kind: "customer", id: "koala" },
  { at: 220, kind: "flavor", id: "mango" },
  { at: 240, kind: "topping", id: "cookie" },
  { at: 260, kind: "customer", id: "unicorn" },
  { at: 280, kind: "flavor", id: "rainbow" },
  { at: 300, kind: "customer", id: "dragon" },
];

export interface Unlocked {
  cones: ConeId[];
  flavors: FlavorId[];
  toppings: ToppingId[];
  customers: CustomerId[];
}

/** Everything available with this many hearts, in catalogue order. */
export function unlocked(hearts: number): Unlocked {
  const have = new Set<string>();
  for (const k of ["cones", "flavors", "toppings", "customers"] as const) for (const id of STARTER[k]) have.add(k + ":" + id);
  for (const r of REWARDS) if (hearts >= r.at) have.add(KIND_KEY[r.kind] + ":" + r.id);
  return {
    cones: CONE_ORDER.filter(id => have.has("cones:" + id)),
    flavors: FLAVOR_ORDER.filter(id => have.has("flavors:" + id)),
    toppings: TOPPING_ORDER.filter(id => have.has("toppings:" + id)),
    customers: CUSTOMER_ORDER.filter(id => have.has("customers:" + id)),
  };
}

const KIND_KEY = { cone: "cones", flavor: "flavors", topping: "toppings", customer: "customers" } as const;

/** When an item is earned, or null when it is there from the start. */
export function unlockAt(kind: RewardItem["kind"], id: string): number | null {
  const r = REWARDS.find(r => r.kind === kind && r.id === id);
  return r ? r.at : null;
}

/** The next reward still to earn, or null when everything is unlocked. */
export function nextReward(hearts: number): Reward | null {
  return REWARDS.find(r => r.at > hearts) ?? null;
}

/** Rewards whose threshold was crossed going from `before` to `after` hearts. */
export function rewardsBetween(before: number, after: number): Reward[] {
  return REWARDS.filter(r => r.at > before && r.at <= after);
}

/** Progress towards the next reward as {done, total}. Full when everything is earned. */
export function rewardProgress(hearts: number): { done: number; total: number } {
  const next = nextReward(hearts);
  if (!next) return { done: 1, total: 1 };
  const i = REWARDS.indexOf(next);
  const start = i === 0 ? 0 : REWARDS[i - 1].at;
  return { done: hearts - start, total: next.at - start };
}
