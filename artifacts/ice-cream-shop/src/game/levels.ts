/**
 * Three ways to play, picked on the home screen. None of them has a timer.
 */
export type Level = 1 | 2 | 3;

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
}

export const LEVELS: Record<Level, LevelSpec> = {
  1: { level: 1, name: "Easy", hint: "One or two scoops, any way up", maxScoops: 2, minScoops: 1, maxToppings: 1, orderMatters: false, queue: 1 },
  2: { level: 2, name: "Medium", hint: "Up to three scoops, stacked in order", maxScoops: 3, minScoops: 1, maxToppings: 2, orderMatters: true, queue: 1 },
  3: { level: 3, name: "Hard", hint: "Two friends waiting, orders in order", maxScoops: 3, minScoops: 2, maxToppings: 2, orderMatters: true, queue: 2 },
};

export const LEVEL_ORDER: Level[] = [1, 2, 3];

export function isLevel(x: unknown): x is Level {
  return x === 1 || x === 2 || x === 3;
}
