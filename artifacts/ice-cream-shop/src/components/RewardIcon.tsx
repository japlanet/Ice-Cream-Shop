import { CONES, CUSTOMERS, FLAVORS, TOPPINGS } from "@/game/catalog";
import type { RewardItem } from "@/game/rewards";
import { ConeIcon, ScoopIcon, ToppingIcon } from "./IceCreamView";

/** A picture of a reward: an empty cone, a scoop, a topping on a scoop, or a friend. */
export function RewardIcon({ item, className }: { item: RewardItem; className?: string }) {
  switch (item.kind) {
    case "cone":
      return <ConeIcon cone={item.id} className={className} />;
    case "flavor":
      return <ScoopIcon flavor={item.id} className={className} />;
    case "topping":
      return <ToppingIcon topping={item.id} className={className} />;
    case "customer":
      return (
        <span className={`reward-emoji ${className ?? ""}`} role="img" aria-label={CUSTOMERS[item.id].name}>
          {CUSTOMERS[item.id].emoji}
        </span>
      );
  }
}

export function rewardName(item: RewardItem): string {
  switch (item.kind) {
    case "cone":
      return CONES[item.id].name;
    case "flavor":
      return FLAVORS[item.id].name + " ice cream";
    case "topping":
      return TOPPINGS[item.id].name;
    case "customer":
      return CUSTOMERS[item.id].name + " is coming to visit";
  }
}
