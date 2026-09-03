/**
 * Everything the shop can sell and everyone who can come in. The starting
 * set is deliberately small; the rest is earned (see rewards.ts).
 */

export type ConeId = "cone" | "cup" | "choco" | "rainbow";
export type FlavorId = "vanilla" | "chocolate" | "strawberry" | "mint" | "blueberry" | "lemon" | "bubblegum" | "mango" | "rainbow";
export type ToppingId = "sprinkles" | "cherry" | "sauce" | "candy" | "cookie";
export type CustomerId = "bear" | "bunny" | "cat" | "dog" | "pig" | "frog" | "fox" | "panda" | "lion" | "koala" | "unicorn" | "dragon";

export interface ConeStyle {
  id: ConeId;
  name: string;
  shape: "cone" | "cup";
  fill: string;
  dark: string;
  /** Chocolate dip band on the rim. */
  dip?: string;
  /** Bands of colour instead of a plain fill. */
  stripes?: string[];
}

export interface FlavorStyle {
  id: FlavorId;
  name: string;
  color: string;
  light: string;
  dark: string;
  /** Little flecks (vanilla seeds, choc chips, bubblegum bits). */
  specks?: string;
  /** Bands of colour instead of a plain fill. */
  stripes?: string[];
}

export interface ToppingStyle {
  id: ToppingId;
  name: string;
  /** Drawn in SVG when there is no emoji. */
  emoji?: string;
}

export interface CustomerStyle {
  id: CustomerId;
  name: string;
  emoji: string;
  color: string;
}

export const CONES: Record<ConeId, ConeStyle> = {
  cone: { id: "cone", name: "Cone", shape: "cone", fill: "#e6b06a", dark: "#b8813a" },
  cup: { id: "cup", name: "Cup", shape: "cup", fill: "#fff7fa", dark: "#f9a8d4" },
  choco: { id: "choco", name: "Choc dip cone", shape: "cone", fill: "#e6b06a", dark: "#b8813a", dip: "#5b3a1e" },
  rainbow: {
    id: "rainbow",
    name: "Rainbow cone",
    shape: "cone",
    fill: "#e6b06a",
    dark: "#b8813a",
    stripes: ["#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#c084fc"],
  },
};

export const FLAVORS: Record<FlavorId, FlavorStyle> = {
  vanilla: { id: "vanilla", name: "Vanilla", color: "#fdf3cf", light: "#fffdf4", dark: "#e9d59a", specks: "#6b4a2a" },
  chocolate: { id: "chocolate", name: "Chocolate", color: "#7b4a2d", light: "#a06a45", dark: "#4f2c17" },
  strawberry: { id: "strawberry", name: "Strawberry", color: "#fb8bb0", light: "#ffc0d6", dark: "#e35b8c" },
  mint: { id: "mint", name: "Mint chip", color: "#a8ecc8", light: "#d8f9e8", dark: "#6dcf9d", specks: "#3d2314" },
  blueberry: { id: "blueberry", name: "Blueberry", color: "#8f80f7", light: "#bdb2fb", dark: "#6455d8" },
  lemon: { id: "lemon", name: "Lemon", color: "#fde68a", light: "#fef6cf", dark: "#f3c43a" },
  bubblegum: { id: "bubblegum", name: "Bubblegum", color: "#7dd3fc", light: "#c0eaff", dark: "#38b6f0", specks: "#f472b6" },
  mango: { id: "mango", name: "Mango", color: "#fdba74", light: "#fedcb0", dark: "#f59a3a" },
  rainbow: {
    id: "rainbow",
    name: "Rainbow",
    color: "#facc15",
    light: "#fff5c2",
    dark: "#c084fc",
    stripes: ["#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#c084fc"],
  },
};

export const TOPPINGS: Record<ToppingId, ToppingStyle> = {
  sprinkles: { id: "sprinkles", name: "Sprinkles" },
  cherry: { id: "cherry", name: "Cherry" },
  sauce: { id: "sauce", name: "Chocolate sauce" },
  candy: { id: "candy", name: "Candy", emoji: "🍬" },
  cookie: { id: "cookie", name: "Cookie", emoji: "🍪" },
};

export const CUSTOMERS: Record<CustomerId, CustomerStyle> = {
  bear: { id: "bear", name: "Bear", emoji: "🐻", color: "#f5d0a9" },
  bunny: { id: "bunny", name: "Bunny", emoji: "🐰", color: "#fbd5e0" },
  cat: { id: "cat", name: "Cat", emoji: "🐱", color: "#fde3b6" },
  dog: { id: "dog", name: "Dog", emoji: "🐶", color: "#e7d2b8" },
  pig: { id: "pig", name: "Pig", emoji: "🐷", color: "#fbc6d6" },
  frog: { id: "frog", name: "Frog", emoji: "🐸", color: "#d3f59b" },
  fox: { id: "fox", name: "Fox", emoji: "🦊", color: "#fed0a6" },
  panda: { id: "panda", name: "Panda", emoji: "🐼", color: "#e5e7eb" },
  lion: { id: "lion", name: "Lion", emoji: "🦁", color: "#fde68a" },
  koala: { id: "koala", name: "Koala", emoji: "🐨", color: "#d4d4d8" },
  unicorn: { id: "unicorn", name: "Unicorn", emoji: "🦄", color: "#ead9ff" },
  dragon: { id: "dragon", name: "Dragon", emoji: "🐲", color: "#bbf7d0" },
};

export const CONE_ORDER = Object.keys(CONES) as ConeId[];
export const FLAVOR_ORDER = Object.keys(FLAVORS) as FlavorId[];
export const TOPPING_ORDER = Object.keys(TOPPINGS) as ToppingId[];
export const CUSTOMER_ORDER = Object.keys(CUSTOMERS) as CustomerId[];

/** What the shop opens with. */
export const STARTER = {
  cones: ["cone", "cup"] as ConeId[],
  flavors: ["vanilla", "chocolate", "strawberry"] as FlavorId[],
  toppings: [] as ToppingId[],
  customers: ["bear", "bunny", "cat", "dog", "pig", "frog"] as CustomerId[],
};
