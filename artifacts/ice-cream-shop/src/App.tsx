import { useCallback, useState } from "react";
import { Home } from "./components/Home";
import { MenuBoard } from "./components/MenuBoard";
import { Shop } from "./pages/Shop";
import { isLevel } from "./game/levels";
import type { Level } from "./game/levels";
import { eraseAllProgress, loadHearts, loadLevel, storeLevel } from "./game/save";
import { useStoredFlag } from "./hooks/useStoredFlag";
import { audio } from "./audio/engine";

type Screen = "home" | "shop" | "menu";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [hearts, setHearts] = useState<number>(loadHearts);
  const [level, setLevelState] = useState<Level>(loadLevel);
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
    return <Shop key={run} hearts={hearts} onHearts={setHearts} helper={helper} level={level} onHome={handleHome} />;
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
      helper={helper}
      onToggleHelper={() => setHelper(v => !v)}
      onEraseAll={handleEraseAll}
    />
  );
}
