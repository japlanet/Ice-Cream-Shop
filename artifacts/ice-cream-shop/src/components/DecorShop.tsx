import { useState } from "react";
import { DECOR, DECOR_KINDS, owns, tapDecor } from "@/game/decor";
import type { DecorItem, DecorKind, DecorState } from "@/game/decor";
import { audio } from "@/audio/engine";
import { CoinCount, CoinIcon } from "./Coins";
import { Critter } from "./Critter";
import type { Hat } from "./Critter";

interface DecorShopProps {
  decor: DecorState;
  onChange: (decor: DecorState) => void;
  onBack: () => void;
}

const KIND_EMOJI: Record<DecorKind, string> = { awning: "⛱️", wall: "🖼️", counter: "🧁", hat: "🎩" };
const KIND_NAME: Record<DecorKind, string> = { awning: "Awnings", wall: "Wallpaper", counter: "Counters", hat: "Hats" };

/** A little picture of each decoration: the real awning, wallpaper or counter styles, or a friend in the hat. */
function Swatch({ item }: { item: DecorItem }) {
  if (item.kind === "hat") {
    return <Critter id="bear" mood="happy" hat={item.id.replace("hat-", "") as Hat} className="swatch-critter" />;
  }
  if (item.kind === "awning") {
    return (
      <div className="swatch swatch-awning" data-awning={item.id}>
        <div className="awning" />
      </div>
    );
  }
  if (item.kind === "wall") return <div className="swatch swatch-wall shop-bg" data-wall={item.id} />;
  return (
    <div className="swatch swatch-counter" data-counter={item.id}>
      <div className="counter">
        <div className="counter-front" />
      </div>
    </div>
  );
}

/** Spend coins on awnings, wallpaper, counters and hats. Tap to buy; tap something you own to put it up. */
export function DecorShop({ decor, onChange, onBack }: DecorShopProps) {
  const [nope, setNope] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);

  function tap(item: DecorItem) {
    audio.unlock();
    const had = owns(decor, item.id);
    const next = tapDecor(decor, item.id);
    if (!next) {
      audio.playNope();
      setNope(item.id);
      window.setTimeout(() => setNope(n => (n === item.id ? null : n)), 450);
      return;
    }
    if (had) audio.playTick();
    else {
      audio.playBuy();
      setFresh(item.id);
      window.setTimeout(() => setFresh(f => (f === item.id ? null : f)), 900);
    }
    onChange(next);
  }

  return (
    <div
      className="screen shop-bg"
      data-awning={decor.equipped.awning}
      data-wall={decor.equipped.wall}
      data-counter={decor.equipped.counter}
    >
      <div className="safe-top px-4 pb-2 flex items-center gap-3">
        <button
          onClick={onBack}
          className="game-btn w-14 h-14 rounded-2xl bg-white/80 shadow flex items-center justify-center text-3xl font-black border-b-4 border-gray-200"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="title-candy text-3xl flex-1">Decorate</h1>
        <div className="bg-white/80 rounded-2xl px-3 py-2">
          <CoinCount coins={decor.coins} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {DECOR_KINDS.map(kind => (
          <section key={kind} className="mb-5">
            <h2 className="text-xl font-black text-pink-600 mb-2">
              <span aria-hidden="true">{KIND_EMOJI[kind]}</span> {KIND_NAME[kind]}
            </h2>
            <div className="decor-grid">
              {DECOR.filter(d => d.kind === kind).map(item => {
                const got = owns(decor, item.id);
                const on = decor.equipped[kind] === item.id;
                const afford = got || decor.coins >= item.price;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => tap(item)}
                    className={`decor-item game-btn ${on ? "is-on" : ""} ${afford ? "" : "is-dear"} ${nope === item.id ? "is-nope" : ""} ${fresh === item.id ? "is-fresh" : ""}`}
                    aria-label={`${item.name}${on ? ", in use" : got ? ", yours: tap to use" : `, costs ${item.price} coins`}`}
                    aria-pressed={on}
                  >
                    <Swatch item={item} />
                    <span className="decor-tag" aria-hidden="true">
                      {on ? "✅" : got ? "👆" : (
                        <>
                          <CoinIcon className="decor-coin" />
                          {item.price}
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
