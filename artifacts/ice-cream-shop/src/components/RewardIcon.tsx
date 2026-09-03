import { CONES, CUSTOMERS, FLAVORS, TOPPINGS } from "@/game/catalog";
import type { RewardItem } from "@/game/rewards";
import { Critter } from "./Critter";
import { ConeIcon, JarIcon, TubIcon } from "./IceCreamView";

/** A picture of a reward: a cone in its holder, a tub, a jar, or a friend. */
export function RewardIcon({ item, className }: { item: RewardItem; className?: string }) {
  switch (item.kind) {
    case "cone":
      return <ConeIcon cone={item.id} className={className} />;
    case "flavor":
      return <TubIcon flavor={item.id} className={className} />;
    case "topping":
      return <JarIcon topping={item.id} className={className} />;
    case "customer":
      return <Critter id={item.id} mood="happy" className={className} />;
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
