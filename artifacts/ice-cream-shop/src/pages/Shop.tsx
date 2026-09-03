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
import { LEVELS } from "@/game/levels";
import type { Level } from "@/game/levels";
import { rewardsBetween, unlocked } from "@/game/rewards";
import type { Reward, RewardItem } from "@/game/rewards";
import { storeHearts } from "@/game/save";
import { audio } from "@/audio/engine";
import { useStoredFlag } from "@/hooks/useStoredFlag";

interface ShopProps {
  hearts: number;
  onHearts: (hearts: number) => void;
  helper: boolean;
  level: Level;
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
  key: number;
  customer: CustomerId;
  order: Order;
  /** Hearts when the friend came in: the trays only change after a reward has been shown. */
  hearts: number;
  phase: Phase;
  hmm: boolean;
}

/** The shop: friends at the counter, the ice cream being made, the trays. No timer, ever. */
export function Shop({ hearts, onHearts, helper, level, onHome }: ShopProps) {
  const spec = LEVELS[level];
  const [visits, setVisits] = useState<Visit[]>([]);
  const [build, setBuild] = useState<Build>(emptyBuild);
  const [nope, setNope] = useState<string | null>(null);
  const [bellShake, setBellShake] = useState(false);
  const [flyTo, setFlyTo] = useState(0);
  const [reward, setReward] = useState<Reward | null>(null);
  const [sfx, setSfx] = useStoredFlag("ice-cream-sfx", true);
  const [music, setMusic] = useStoredFlag("ice-cream-music", true);

  const heartsRef = useRef(hearts);
  const visitsRef = useRef<Visit[]>([]);
  const nextKey = useRef(1);
  const busy = useRef(false);
  const alive = useRef(true);
  const nopeTimer = useRef<number | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const updateVisits = useCallback((f: (vs: Visit[]) => Visit[]) => {
    visitsRef.current = f(visitsRef.current);
    setVisits(visitsRef.current);
  }, []);

  const patch = useCallback(
    (key: number, change: Partial<Visit>) => updateVisits(vs => vs.map(v => (v.key === key ? { ...v, ...change } : v))),
    [updateVisits],
  );

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
      const here = visitsRef.current.map(v => v.customer);
      const customer = pickCustomer(rng, h, here);
      const order = makeOrder(rng, h, { maxScoops: spec.maxScoops, minScoops: spec.minScoops, maxToppings: spec.maxToppings, mustInclude });
      const key = nextKey.current++;
      updateVisits(vs => [...vs, { key, customer, order, hearts: h, phase: "arriving", hmm: false }]);
      audio.playDoor();
      await sleep(ARRIVE_MS);
      if (!alive.current) return;
      patch(key, { phase: "order" });
    },
    [spec, updateVisits, patch],
  );

  /** Keep the counter as full as the level wants. */
  const fill = useCallback(
    async (mustInclude?: RewardItem) => {
      let first = true;
      while (visitsRef.current.length < spec.queue) {
        await bringCustomer(first ? mustInclude : undefined);
        first = false;
        if (!alive.current) return;
      }
      busy.current = false;
    },
    [spec.queue, bringCustomer],
  );

  useEffect(() => {
    busy.current = true;
    void fill();
    // Only on mount: later visits are started by the serve flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- building ------------------------------------------------------------

  const front = visits.find(v => v.phase === "order") ?? null;

  const refuse = useCallback((item: Item) => {
    audio.playNope();
    setNope(itemKey(item));
    if (nopeTimer.current !== null) clearTimeout(nopeTimer.current);
    nopeTimer.current = window.setTimeout(() => setNope(null), NOPE_MS);
  }, []);

  const tapItem = useCallback(
    (item: Item) => {
      if (!front || busy.current) return;
      audio.unlock();
      if (helper && !helperAllows(front.order, build, item, spec.orderMatters)) {
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
    [front, helper, build, spec.orderMatters, refuse],
  );

  const tapUndo = useCallback(() => {
    if (!front || busy.current) return;
    audio.unlock();
    if (isEmpty(build)) {
      audio.playNope();
      return;
    }
    audio.playTick();
    setBuild(undo(build));
  }, [front, build]);

  // ---- serving -------------------------------------------------------------

  const serve = useCallback(async () => {
    if (!front || busy.current) return;
    audio.unlock();
    if (isEmpty(build)) {
      audio.playNope();
      setBellShake(true);
      await sleep(NOPE_MS);
      if (alive.current) setBellShake(false);
      return;
    }
    busy.current = true;

    // Any waiting friend whose order this is may have it.
    const target = visitsRef.current.find(v => v.phase === "order" && matches(v.order, build, spec.orderMatters));
    if (!target) {
      // Not quite. The friend at the front looks puzzled and shows the order again. Nothing is lost.
      audio.playHmm();
      patch(front.key, { hmm: true });
      await sleep(HMM_MS);
      if (!alive.current) return;
      patch(front.key, { hmm: false });
      busy.current = false;
      return;
    }

    setFlyTo(visitsRef.current.indexOf(target));
    patch(target.key, { phase: "serving" });
    audio.playBell();
    await sleep(FLY_MS);
    if (!alive.current) return;

    const before = heartsRef.current;
    const after = before + 1;
    heartsRef.current = after;
    storeHearts(after);
    onHearts(after);
    setBuild(emptyBuild());
    patch(target.key, { phase: "happy" });
    audio.playYum();
    await sleep(HAPPY_MS);
    if (!alive.current) return;

    patch(target.key, { phase: "leaving" });
    audio.playBye();
    await sleep(LEAVE_MS);
    if (!alive.current) return;
    updateVisits(vs => vs.filter(v => v.key !== target.key));

    const won = rewardsBetween(before, after);
    if (won.length > 0) {
      setReward(won[0]);
      audio.playReward();
      return;
    }
    void fill();
  }, [front, build, spec.orderMatters, patch, updateVisits, onHearts, fill]);

  const closeReward = useCallback(() => {
    if (!reward) return;
    audio.playTick();
    const item: RewardItem = reward;
    setReward(null);
    // The next order uses the new thing (a new friend just comes in).
    void fill(item.kind === "customer" ? undefined : item);
  }, [reward, fill]);

  // ---- render --------------------------------------------------------------

  const have = unlocked(visits.length > 0 ? Math.min(...visits.map(v => v.hearts)) : heartsRef.current);
  const ready = front !== null && helper && visits.some(v => v.phase === "order" && matches(v.order, build, spec.orderMatters));
  const serving = visits.some(v => v.phase === "serving");
  const trayDisabled = front === null || busy.current || reward !== null;

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
        <div className="awning" aria-hidden="true" />
        <div className="floor" aria-hidden="true" />
        <div className={`stage stage-customer ${spec.queue > 1 ? "is-queue" : ""}`}>
          {visits.map((v, i) => (
            <Customer key={v.key} id={v.customer} order={v.order} phase={v.phase} hmm={v.hmm} front={spec.queue > 1 && v === front && !serving} />
          ))}
        </div>
        <div className="stage stage-counter">
          <div className="counter-top">
            <IceCreamView
              cone={build.cone}
              scoops={build.scoops}
              toppings={build.toppings}
              ghost={front !== null && level < 3}
              className={`build ${serving ? "is-flying" : ""}`}
              style={{ ["--fly-x" as string]: spec.queue > 1 ? (flyTo === 0 ? "-75%" : "-165%") : "-90%" }}
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
          <div className="counter" aria-hidden="true">
            <div className="counter-front" />
          </div>
        </div>
      </div>

      <Palette
        have={have}
        order={front?.order ?? null}
        build={build}
        helper={helper}
        orderMatters={spec.orderMatters}
        disabled={trayDisabled}
        nope={nope}
        onTap={tapItem}
      />

      {reward && <RewardPopup reward={reward} onClose={closeReward} />}
    </div>
  );
}
