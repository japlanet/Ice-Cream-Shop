import { useCallback, useEffect, useRef, useState } from "react";
import { Customer } from "@/components/Customer";
import type { Phase } from "@/components/Customer";
import { IceCreamView } from "@/components/IceCreamView";
import { Palette, itemKey } from "@/components/Palette";
import { RewardBar } from "@/components/RewardBar";
import { RewardPopup } from "@/components/RewardPopup";
import type { CustomerId } from "@/game/catalog";
import { addItem, emptyBuild, helperAllows, isEmpty, makeOrder, matches, pickCustomer, undo } from "@/game/engine";
import type { Build, Item, Order } from "@/game/engine";
import { rewardsBetween, unlocked } from "@/game/rewards";
import type { Reward, RewardItem } from "@/game/rewards";
import { storeHearts } from "@/game/save";
import { audio } from "@/audio/engine";
import { useStoredFlag } from "@/hooks/useStoredFlag";

interface ShopProps {
  hearts: number;
  onHearts: (hearts: number) => void;
  helper: boolean;
  smallOrders: boolean;
  onHome: () => void;
}

const ARRIVE_MS = 750;
const FLY_MS = 650;
const HAPPY_MS = 1400;
const LEAVE_MS = 600;
const HMM_MS = 900;
const NOPE_MS = 450;

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const rng = () => Math.random();

interface Visit {
  customer: CustomerId;
  order: Order;
  /** Hearts when the friend came in: the trays only change after a reward has been shown. */
  hearts: number;
}

/** The shop: a friend at the counter, the ice cream being made, the trays. No timer, ever. */
export function Shop({ hearts, onHearts, helper, smallOrders, onHome }: ShopProps) {
  const [visit, setVisit] = useState<Visit | null>(null);
  const [phase, setPhase] = useState<Phase>("arriving");
  const [build, setBuild] = useState<Build>(emptyBuild);
  const [hmm, setHmm] = useState(false);
  const [nope, setNope] = useState<string | null>(null);
  const [bellShake, setBellShake] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const [sfx, setSfx] = useStoredFlag("ice-cream-sfx", true);
  const [music, setMusic] = useStoredFlag("ice-cream-music", true);

  const heartsRef = useRef(hearts);
  const lastCustomer = useRef<CustomerId | null>(null);
  const busy = useRef(false);
  const alive = useRef(true);
  const nopeTimer = useRef<number | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // ---- sound ---------------------------------------------------------------

  useEffect(() => {
    audio.sfxEnabled = sfx;
  }, [sfx]);
  useEffect(() => {
    audio.setMusic(music);
  }, [music]);
  useEffect(() => {
    const onVis = () => audio.setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      audio.stopMusic();
    };
  }, []);

  // ---- customers -----------------------------------------------------------

  const bringCustomer = useCallback(
    async (mustInclude?: RewardItem) => {
      const h = heartsRef.current;
      const customer = pickCustomer(rng, h, lastCustomer.current);
      lastCustomer.current = customer;
      const order = makeOrder(rng, h, { maxScoops: smallOrders ? 2 : 3, mustInclude });
      setVisit({ customer, order, hearts: h });
      setBuild(emptyBuild());
      setHmm(false);
      setPhase("arriving");
      audio.playDoor();
      await sleep(ARRIVE_MS);
      if (!alive.current) return;
      setPhase("order");
      busy.current = false;
    },
    [smallOrders],
  );

  useEffect(() => {
    void bringCustomer();
    // Only on mount: later visits are started by the serve flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- building ------------------------------------------------------------

  const refuse = useCallback((item: Item) => {
    audio.playNope();
    setNope(itemKey(item));
    if (nopeTimer.current !== null) clearTimeout(nopeTimer.current);
    nopeTimer.current = window.setTimeout(() => setNope(null), NOPE_MS);
  }, []);

  const tapItem = useCallback(
    (item: Item) => {
      if (!visit || phase !== "order" || busy.current) return;
      audio.unlock();
      if (helper && !helperAllows(visit.order, build, item)) {
        refuse(item);
        return;
      }
      const next = addItem(build, item);
      if (!next) {
        refuse(item);
        return;
      }
      setBuild(next);
      if (item.kind === "cone") audio.playCone();
      else if (item.kind === "scoop") audio.playScoop(next.scoops.length - 1);
      else audio.playTopping();
    },
    [visit, phase, helper, build, refuse],
  );

  const tapUndo = useCallback(() => {
    if (phase !== "order" || busy.current) return;
    audio.unlock();
    if (isEmpty(build)) {
      audio.playNope();
      return;
    }
    audio.playTick();
    setBuild(undo(build));
  }, [phase, build]);

  // ---- serving -------------------------------------------------------------

  const serve = useCallback(async () => {
    if (!visit || phase !== "order" || busy.current) return;
    audio.unlock();
    if (isEmpty(build)) {
      audio.playNope();
      setBellShake(true);
      await sleep(NOPE_MS);
      if (alive.current) setBellShake(false);
      return;
    }
    busy.current = true;

    if (!matches(visit.order, build)) {
      // Not quite. The friend looks puzzled and shows the order again. Nothing is lost.
      audio.playHmm();
      setHmm(true);
      await sleep(HMM_MS);
      if (!alive.current) return;
      setHmm(false);
      busy.current = false;
      return;
    }

    setPhase("serving");
    audio.playBell();
    await sleep(FLY_MS);
    if (!alive.current) return;

    const before = heartsRef.current;
    const after = before + 1;
    heartsRef.current = after;
    storeHearts(after);
    onHearts(after);
    setPhase("happy");
    audio.playYum();
    await sleep(HAPPY_MS);
    if (!alive.current) return;

    setPhase("leaving");
    audio.playBye();
    await sleep(LEAVE_MS);
    if (!alive.current) return;

    const won = rewardsBetween(before, after);
    if (won.length > 0) {
      setVisit(null);
      setReward(won[0]);
      audio.playReward();
      return;
    }
    void bringCustomer();
  }, [visit, phase, build, onHearts, bringCustomer]);

  const closeReward = useCallback(() => {
    if (!reward) return;
    audio.playTick();
    const item: RewardItem = reward;
    setReward(null);
    // The first order after a reward uses the new thing (a new friend just comes in).
    void bringCustomer(item.kind === "customer" ? undefined : item);
  }, [reward, bringCustomer]);

  // ---- render --------------------------------------------------------------

  const have = unlocked(visit ? visit.hearts : heartsRef.current);
  const ready = visit !== null && phase === "order" && helper && matches(visit.order, build);
  const trayDisabled = phase !== "order" || reward !== null;

  return (
    <div className="screen shop-bg">
      <div className="safe-top topbar">
        <button
          onClick={() => {
            audio.playTick();
            onHome();
          }}
          className="game-btn icon-btn"
          aria-label="Home"
        >
          🏠
        </button>
        <div className="topbar-middle">
          <RewardBar hearts={hearts} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              audio.unlock();
              setSfx(v => !v);
            }}
            className={`game-btn icon-btn ${sfx ? "" : "is-off"}`}
            aria-label={sfx ? "Turn sound effects off" : "Turn sound effects on"}
            aria-pressed={sfx}
          >
            {sfx ? "🔊" : "🔇"}
          </button>
          <button
            onClick={() => {
              audio.unlock();
              setMusic(v => !v);
            }}
            className={`game-btn icon-btn ${music ? "" : "is-off"}`}
            aria-label={music ? "Turn music off" : "Turn music on"}
            aria-pressed={music}
          >
            🎵
          </button>
        </div>
      </div>

      <div className="scene">
        <div className="stage stage-customer">
          {visit && <Customer id={visit.customer} order={visit.order} phase={phase} hmm={hmm} />}
        </div>
        <div className="stage stage-counter">
          <div className="counter-top">
            <IceCreamView
              cone={build.cone}
              scoops={build.scoops}
              toppings={build.toppings}
              ghost={phase === "order"}
              className={`build ${phase === "serving" ? "is-flying" : ""} ${phase === "happy" || phase === "leaving" ? "is-gone" : ""}`}
            />
          </div>
          <div className="counter-buttons">
            <button
              type="button"
              onClick={tapUndo}
              disabled={trayDisabled}
              className="game-btn candy candy-sky round-btn bg-gradient-to-b from-sky-200 to-blue-300"
              aria-label="Take the last thing off"
            >
              ↩️
            </button>
            <button
              type="button"
              onClick={() => void serve()}
              disabled={trayDisabled}
              className={`game-btn candy candy-amber round-btn bell bg-gradient-to-b from-amber-200 to-amber-400 ${ready ? "is-ready" : ""} ${bellShake ? "is-nope" : ""}`}
              aria-label="Ring the bell to serve"
            >
              🔔
            </button>
          </div>
          <div className="counter" aria-hidden="true" />
        </div>
      </div>

      <Palette have={have} order={visit?.order ?? null} build={build} helper={helper} disabled={trayDisabled} nope={nope} onTap={tapItem} />

      {reward && <RewardPopup reward={reward} onClose={closeReward} />}
    </div>
  );
}
