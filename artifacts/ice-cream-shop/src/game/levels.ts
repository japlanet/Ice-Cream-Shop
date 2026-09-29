/**
 * Four ways to play, picked on the home screen. None of them has a timer:
 * the challenge is in bigger, trickier orders, never in speed.
 */
export type Level = 1 | 2 | 3 | 4;

export interface LevelSpec {
  level: Level;
  name: string;
  hint: string;
  /** Most scoops an order can ask for. */
  maxScoops: number;
  /** Fewest scoops once the first ten customers are served. */
  minScoops: number;
  maxToppings: number;
  /** Scoops must be stacked bottom to top exactly as shown. */
  orderMatters: boolean;
  /** How many friends wait at the counter at once. */
  queue: number;
  /** Sundaes and milkshakes are on the menu. */
  treats: boolean;
  /** How often a friend orders two things at once, 0 to 1. */
  doubles: number;
  /** The order bubble hides after a moment; tap the friend to see it again. */
  memory: boolean;
}

export const LEVELS: Record<Level, LevelSpec> = {
  1: { level: 1, name: "Easy", hint: "One or two scoops, any way up", maxScoops: 2, minScoops: 1, maxToppings: 1, orderMatters: false, queue: 1, treats: false, doubles: 0, memory: false },
  2: { level: 2, name: "Medium", hint: "Up to three scoops, stacked in order", maxScoops: 3, minScoops: 1, maxToppings: 2, orderMatters: true, queue: 1, treats: false, doubles: 0, memory: false },
  3: { level: 3, name: "Hard", hint: "Two friends waiting, sundaes and milkshakes", maxScoops: 3, minScoops: 2, maxToppings: 2, orderMatters: true, queue: 2, treats: true, doubles: 0, memory: false },
  4: {
    level: 4,
    name: "Super",
    hint: "Three friends, four scoops, double orders, and remember what they asked for",
    maxScoops: 4,
    minScoops: 2,
    maxToppings: 3,
    orderMatters: true,
    queue: 3,
    treats: true,
    doubles: 0.35,
    memory: true,
  },
};

export const LEVEL_ORDER: Level[] = [1, 2, 3, 4];

export function isLevel(x: unknown): x is Level {
  return x === 1 || x === 2 || x === 3 || x === 4;
}
