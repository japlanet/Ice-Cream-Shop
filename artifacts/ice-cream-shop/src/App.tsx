import { useCallback, useState } from "react";
import { Home } from "./components/Home";
import { DecorShop } from "./components/DecorShop";
import { MenuBoard } from "./components/MenuBoard";
import { Shop } from "./pages/Shop";
import { isLevel } from "./game/levels";
import type { Level } from "./game/levels";
import { addCoins } from "./game/decor";
import type { DecorState } from "./game/decor";
import { eraseAllProgress, loadDecor, loadHearts, loadLevel, storeDecor, storeLevel } from "./game/save";
import { useStoredFlag } from "./hooks/useStoredFlag";
import { audio } from "./audio/engine";

type Screen = "home" | "shop" | "menu" | "decor";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [hearts, setHearts] = useState<number>(loadHearts);
  const [level, setLevelState] = useState<Level>(loadLevel);
  const [decor, setDecorState] = useState<DecorState>(loadDecor);

  const setDecor = useCallback((next: DecorState) => {
    storeDecor(next);
    setDecorState(next);
  }, []);

  const earnCoins = useCallback((coins: number) => {
    setDecorState(d => {
      const next = addCoins(d, coins);
      storeDecor(next);
      return next;
    });
  }, []);
  const [helper, setHelper] = useStoredFlag("ice-cream-helper", true);
  const [run, setRun] = useState(0);

  const setLevel = useCallback((l: Level) => {
    if (!isLevel(l)) return;
    audio.unlock();
    audio.playTick();
    storeLevel(l);
    setLevelState(l);
  }, []);

  const handlePlay = useCallback(() => {
    audio.unlock();
    setRun(r => r + 1);
    setScreen("shop");
  }, []);

  const handleHome = useCallback(() => setScreen("home"), []);

  const handleEraseAll = useCallback(() => {
    eraseAllProgress();
    window.location.reload();
  }, []);

  if (screen === "shop") {
    return <Shop key={run} hearts={hearts} onHearts={setHearts} decor={decor} onCoins={earnCoins} helper={helper} level={level} onHome={handleHome} />;
  }
  if (screen === "decor") {
    return <DecorShop decor={decor} onChange={setDecor} onBack={handleHome} />;
  }
  if (screen === "menu") {
    return <MenuBoard hearts={hearts} onBack={handleHome} />;
  }
  return (
    <Home
      hearts={hearts}
      level={level}
      onLevel={setLevel}
      onPlay={handlePlay}
      onMenu={() => {
        audio.unlock();
        audio.playTick();
        setScreen("menu");
      }}
      onDecorate={() => {
        audio.unlock();
        audio.playTick();
        setScreen("decor");
      }}
      decor={decor}
      helper={helper}
      onToggleHelper={() => setHelper(v => !v)}
      onEraseAll={handleEraseAll}
    />
  );
}
