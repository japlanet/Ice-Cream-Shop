import { useCallback, useState } from "react";
import { Home } from "./components/Home";
import { MenuBoard } from "./components/MenuBoard";
import { Shop } from "./pages/Shop";
import { eraseAllProgress, loadHearts } from "./game/save";
import { useStoredFlag } from "./hooks/useStoredFlag";
import { audio } from "./audio/engine";

type Screen = "home" | "shop" | "menu";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [hearts, setHearts] = useState<number>(loadHearts);
  const [helper, setHelper] = useStoredFlag("ice-cream-helper", true);
  const [smallOrders, setSmallOrders] = useStoredFlag("ice-cream-small", false);
  const [run, setRun] = useState(0);

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
    return <Shop key={run} hearts={hearts} onHearts={setHearts} helper={helper} smallOrders={smallOrders} onHome={handleHome} />;
  }
  if (screen === "menu") {
    return <MenuBoard hearts={hearts} onBack={handleHome} />;
  }
  return (
    <Home
      hearts={hearts}
      onPlay={handlePlay}
      onMenu={() => {
        audio.unlock();
        audio.playTick();
        setScreen("menu");
      }}
      helper={helper}
      smallOrders={smallOrders}
      onToggleHelper={() => setHelper(v => !v)}
      onToggleSmall={() => setSmallOrders(v => !v)}
      onEraseAll={handleEraseAll}
    />
  );
}
