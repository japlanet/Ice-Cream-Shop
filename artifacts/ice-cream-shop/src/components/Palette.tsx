import { CONES, FLAVORS, TOPPINGS } from "@/game/catalog";
import { helperAllows } from "@/game/engine";
import type { Build, Item, Order } from "@/game/engine";
import type { Unlocked } from "@/game/rewards";
import { ConeIcon, ScoopIcon, ToppingIcon } from "./IceCreamView";

interface PaletteProps {
  have: Unlocked;
  order: Order | null;
  build: Build;
  /** The little helper: only what the order needs lights up. */
  helper: boolean;
  disabled: boolean;
  /** Item that was just refused, so it can wobble. */
  nope: string | null;
  onTap: (item: Item) => void;
}

export const itemKey = (item: Item) => item.kind + ":" + item.id;

/** The trays of cones, scoops and toppings along the bottom. Tap to add. */
export function Palette({ have, order, build, helper, disabled, nope, onTap }: PaletteProps) {
  const items: { label: string; list: Item[] }[] = [
    { label: "Cones", list: have.cones.map(id => ({ kind: "cone", id })) },
    { label: "Ice cream", list: have.flavors.map(id => ({ kind: "scoop", id })) },
    { label: "Toppings", list: have.toppings.map(id => ({ kind: "topping", id })) },
  ];

  return (
    <div className="tray safe-bottom">
      {items
        .filter(row => row.list.length > 0)
        .map(row => (
          <div key={row.label} className="tray-row" role="group" aria-label={row.label}>
            {row.list.map(item => {
              const useful = order ? helperAllows(order, build, item) : false;
              const dim = helper && order !== null && !useful;
              const key = itemKey(item);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onTap(item)}
                  className={`tray-item candy ${dim ? "is-dim" : ""} ${helper && useful ? "is-hint" : ""} ${nope === key ? "is-nope" : ""}`}
                  aria-label={name(item)}
                >
                  {item.kind === "cone" && <ConeIcon cone={item.id} className="tray-icon" />}
                  {item.kind === "scoop" && <ScoopIcon flavor={item.id} className="tray-icon" />}
                  {item.kind === "topping" && <ToppingIcon topping={item.id} className="tray-icon" />}
                </button>
              );
            })}
          </div>
        ))}
    </div>
  );
}

function name(item: Item): string {
  switch (item.kind) {
    case "cone":
      return CONES[item.id].name;
    case "scoop":
      return FLAVORS[item.id].name + " scoop";
    case "topping":
      return TOPPINGS[item.id].name;
  }
}
