import { CONES, CONE_ORDER, CUSTOMERS, CUSTOMER_ORDER, FLAVORS, FLAVOR_ORDER, TOPPINGS, TOPPING_ORDER } from "@/game/catalog";
import { unlockAt, unlocked } from "@/game/rewards";
import type { RewardItem } from "@/game/rewards";
import { RewardBar } from "./RewardBar";
import { RewardIcon } from "./RewardIcon";

interface MenuBoardProps {
  hearts: number;
  onBack: () => void;
}

/** Everything the shop has, and what is still to come. */
export function MenuBoard({ hearts, onBack }: MenuBoardProps) {
  const have = unlocked(hearts);
  const sections: { title: string; emoji: string; items: RewardItem[]; owned: string[]; names: Record<string, { name: string }> }[] = [
    { title: "Cones", emoji: "🍦", items: CONE_ORDER.map(id => ({ kind: "cone", id })), owned: have.cones, names: CONES },
    { title: "Ice cream", emoji: "🍨", items: FLAVOR_ORDER.map(id => ({ kind: "flavor", id })), owned: have.flavors, names: FLAVORS },
    { title: "Toppings", emoji: "🍒", items: TOPPING_ORDER.map(id => ({ kind: "topping", id })), owned: have.toppings, names: TOPPINGS },
    { title: "Friends", emoji: "🐻", items: CUSTOMER_ORDER.map(id => ({ kind: "customer", id })), owned: have.customers, names: CUSTOMERS },
  ];

  return (
    <div className="screen shop-bg">
      <div className="safe-top px-4 pb-2 flex items-center gap-3">
        <button
          onClick={onBack}
          className="game-btn w-14 h-14 rounded-2xl bg-white/80 shadow flex items-center justify-center text-3xl font-black border-b-4 border-gray-200"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="title-candy text-3xl flex-1">Menu board</h1>
        <RewardBar hearts={hearts} />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {sections.map(s => (
          <section key={s.title} className="mb-5">
            <h2 className="text-xl font-black text-pink-600 mb-2">
              <span aria-hidden="true">{s.emoji}</span> {s.title}
            </h2>
            <div className="menu-grid">
              {s.items.map(item => {
                const got = s.owned.includes(item.id);
                const at = unlockAt(item.kind, item.id);
                return (
                  <div key={item.id} className={`menu-item ${got ? "" : "is-locked"}`} aria-label={`${s.names[item.id].name}${got ? "" : `, needs ${at} hearts`}`}>
                    <div className="menu-icon">
                      <RewardIcon item={item} className="menu-icon-svg" />
                      {!got && (
                        <span className="menu-lock" aria-hidden="true">
                          🔒
                        </span>
                      )}
                    </div>
                    <div className="menu-name">{s.names[item.id].name}</div>
                    {!got && at !== null && (
                      <div className="menu-need" aria-hidden="true">
                        ❤️ {at}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
