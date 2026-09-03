import { useState } from "react";
import { ParentPanel } from "./ParentPanel";
import { RewardBar } from "./RewardBar";

interface HomeProps {
  hearts: number;
  onPlay: () => void;
  onMenu: () => void;
  helper: boolean;
  smallOrders: boolean;
  onToggleHelper: () => void;
  onToggleSmall: () => void;
  onEraseAll: () => void;
}

export function Home({ hearts, onPlay, onMenu, helper, smallOrders, onToggleHelper, onToggleSmall, onEraseAll }: HomeProps) {
  const [parents, setParents] = useState(false);

  return (
    <div className="screen shop-bg">
      <div className="safe-top px-4 pb-2 text-center">
        <div className="text-6xl mb-1" role="img" aria-label="ice cream">
          <span className="wiggle-slow">🍦</span>
          <span className="bob">🍨</span>
          <span className="wiggle-slow" style={{ animationDelay: "0.6s" }}>
            🍧
          </span>
        </div>
        <h1 className="title-candy text-5xl">Ice Cream Shop</h1>
        <p className="text-base font-bold text-pink-700 mt-1">Who wants ice cream?</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col items-center justify-center gap-5">
        <button
          onClick={onPlay}
          className="game-btn candy candy-rose mode-card rounded-3xl px-10 py-6 bg-gradient-to-b from-pink-200 to-rose-300 flex flex-col items-center max-w-md w-full"
          aria-label="Open the shop and play"
        >
          <div className="text-8xl mb-1" role="img" aria-hidden="true">
            <span className="bob">🐻</span>
            <span className="text-5xl mx-1 align-middle">🍦</span>
            <span className="bob" style={{ animationDelay: "0.4s" }}>
              🐰
            </span>
          </div>
          <div className="text-4xl font-black text-rose-900 drop-shadow-sm">Play</div>
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

      <div className="safe-bottom px-4 pt-2 flex items-end justify-end">
        <button
          type="button"
          onClick={() => setParents(true)}
          className="text-xs font-semibold text-gray-500/70 underline-offset-2 hover:underline px-2 py-1"
          aria-label="Settings for grown-ups"
        >
          Parents
        </button>
      </div>
      {parents && (
        <ParentPanel
          helper={helper}
          smallOrders={smallOrders}
          onToggleHelper={onToggleHelper}
          onToggleSmall={onToggleSmall}
          onErase={onEraseAll}
          onClose={() => setParents(false)}
        />
      )}
    </div>
  );
}
