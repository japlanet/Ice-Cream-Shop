import { useState } from "react";
import { LEVELS, LEVEL_ORDER } from "@/game/levels";
import type { Level } from "@/game/levels";
import { Critter } from "./Critter";
import { IceCreamView } from "./IceCreamView";
import { ParentPanel } from "./ParentPanel";
import { RewardBar } from "./RewardBar";

interface HomeProps {
  hearts: number;
  level: Level;
  onLevel: (level: Level) => void;
  onPlay: () => void;
  onMenu: () => void;
  helper: boolean;
  onToggleHelper: () => void;
  onEraseAll: () => void;
}

/** A picture of each level: one scoop, two scoops in order, three with toppings and a queue. */
const LEVEL_PICTURES: Record<Level, { cone: "cone" | "cup"; scoops: ("strawberry" | "chocolate" | "vanilla")[]; toppings: "sprinkles"[] }> = {
  1: { cone: "cone", scoops: ["strawberry"], toppings: [] },
  2: { cone: "cup", scoops: ["chocolate", "vanilla"], toppings: [] },
  3: { cone: "cone", scoops: ["vanilla", "strawberry", "chocolate"], toppings: ["sprinkles"] },
};

export function Home({ hearts, level, onLevel, onPlay, onMenu, helper, onToggleHelper, onEraseAll }: HomeProps) {
  const [parents, setParents] = useState(false);

  return (
    <div className="screen shop-bg home">
      <div className="awning" aria-hidden="true" />
      <div className="safe-top px-4 pb-1 text-center relative">
        <h1 className="title-candy text-5xl mt-6">Ice Cream Shop</h1>
        <p className="text-base font-bold text-pink-700 mt-1">Who wants ice cream?</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col items-center justify-center gap-4 relative">
        <div className="level-row" role="radiogroup" aria-label="How to play">
          {LEVEL_ORDER.map(l => {
            const spec = LEVELS[l];
            const pic = LEVEL_PICTURES[l];
            return (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={level === l}
                aria-label={`${spec.name}: ${spec.hint}`}
                onClick={() => onLevel(l)}
                className={`game-btn candy level-card ${level === l ? "is-picked" : ""}`}
              >
                <div className="level-pic">
                  <IceCreamView cone={pic.cone} scoops={pic.scoops} toppings={pic.toppings} className="level-ice" />
                  {l === 3 && <span className="level-queue">👥</span>}
                </div>
                <div className="level-stars" aria-hidden="true">
                  {"⭐".repeat(l)}
                </div>
                <div className="level-name">{spec.name}</div>
              </button>
            );
          })}
        </div>

        <button onClick={onPlay} className="game-btn candy candy-rose play-btn" aria-label={`Open the shop and play on ${LEVELS[level].name}`}>
          <Critter id="bear" mood="happy" className="play-critter" />
          <div className="play-label">
            <span className="text-5xl" aria-hidden="true">
              🍦
            </span>
            <span className="text-4xl font-black text-rose-900 drop-shadow-sm">Play</span>
          </div>
          <Critter id="bunny" mood="happy" className="play-critter" />
        </button>

        <div className="flex items-center gap-4 max-w-md w-full justify-center">
          <button
            onClick={onMenu}
            className="game-btn candy candy-sky rounded-3xl px-6 py-3 bg-gradient-to-b from-sky-200 to-blue-300 flex items-center gap-3"
            aria-label="Menu board: what the shop has earned"
          >
            <span className="text-4xl" role="img" aria-hidden="true">
              📋
            </span>
            <span className="text-2xl font-black text-sky-900">Menu</span>
          </button>
          <div className="bg-white/70 rounded-3xl px-4 py-3">
            <RewardBar hearts={hearts} />
          </div>
        </div>
      </div>

      <div className="safe-bottom px-4 pt-2 flex items-end justify-end relative">
        <button
          type="button"
          onClick={() => setParents(true)}
          className="text-xs font-semibold text-gray-500/70 underline-offset-2 hover:underline px-2 py-1"
          aria-label="Settings for grown-ups"
        >
          Parents
        </button>
      </div>
      {parents && <ParentPanel helper={helper} onToggleHelper={onToggleHelper} onErase={onEraseAll} onClose={() => setParents(false)} />}
    </div>
  );
}
