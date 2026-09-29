import { useCallback, useEffect, useRef, useState } from "react";
import { CoinCount } from "@/components/Coins";
import { Customer } from "@/components/Customer";
import type { Phase } from "@/components/Customer";
import type { Hat } from "@/components/Critter";
import { BlenderIcon, IceCreamView } from "@/components/IceCreamView";
import { Palette, itemKey } from "@/components/Palette";
import { RewardBar } from "@/components/RewardBar";
import { RewardPopup } from "@/components/RewardPopup";
import type { CustomerId } from "@/game/catalog";
import { BLEND, addItem, coinsFor, emptyBuild, helperAllows, isEmpty, makeOrder, matches, pickCustomer, undo } from "@/game/engine";
import type { Build, Item, Order } from "@/game/engine";
import type { DecorState } from "@/game/decor";
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
  decor: DecorState;
  onCoins: (coins: number) => void;
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
const BLEND_MS = 700;
/** On Super the order shows for this long, then hides until the friend is tapped. Nobody is waiting on a clock. */
const MEMORY_SHOW_MS = 4500;
const PEEK_MS = 3000;

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const rng = () => Math.random();

interface Visit {
  key: number;
  customer: CustomerId;
  /** One order, or two when the friend is buying for someone else too. */
  orders: Order[];
  served: boolean[];
  /** Hearts when the friend came in: the trays only change after a reward has been shown. */
  hearts: number;
  phase: Phase;
  hmm: boolean;
  /** Wrong serves to this friend; any at all and there is no tip. */
  wrongs: number;
  /** The order bubble is showing a thought cloud (Super only). */
  hidden: boolean;
}

const hatOf = (decor: DecorState) => decor.equipped.hat.replace("hat-", "") as Hat;

/** The shop: friends at the counter, the ice cream being made, the trays. No timer, ever. */
export function Shop({ hearts, onHearts, decor, onCoins, helper: helperSetting, level, onHome }: ShopProps) {
  const spec = LEVELS[level];
  // On Super the child is remembering the order, so nothing lights up to give it away.
  const helper = helperSetting && !spec.memory;
  const [visits, setVisits] = useState<Visit[]>([]);
  const [build, setBuild] = useState<Build>(emptyBuild);
  const [nope, setNope] = useState<string | null>(null);
  const [bellShake, setBellShake] = useState(false);
  const [blending, setBlending] = useState(false);
  const [flyTo, setFlyTo] = useState(0);
  const [gain, setGain] = useState({ coins: 0, key: 0 });
  const [reward, setReward] = useState<Reward | null>(null);
  const [sfx, setSfx] = useStoredFlag("ice-cream-sfx", true);
  const [music, setMusic] = useStoredFlag("ice-cream-music", true);

  const heartsRef = useRef(hearts);
  const visitsRef = useRef<Visit[]>([]);
  const nextKey = useRef(1);
  const busy = useRef(false);
  const alive = useRef(true);
  const nopeTimer = useRef<number | null>(null);
  const hideTimers = useRef(new Map<number, number>());

  useEffect(() => {
    alive.current = true;
    const timers = hideTimers.current;
    return () => {
      alive.current = false;
      for (const t of timers.values()) clearTimeout(t);
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

  // ---- remembering the order (Super) ----------------------------------------

  /** Show a friend's order, then (on Super) tuck it away again after a while. */
  const showOrder = useCallback(
    (key: number, ms: number) => {
      patch(key, { hidden: false });
      if (!spec.memory) return;
      const old = hideTimers.current.get(key);
      if (old !== undefined) clearTimeout(old);
      hideTimers.current.set(
        key,
        window.setTimeout(() => {
          hideTimers.current.delete(key);
          if (alive.current && visitsRef.current.some(v => v.key === key)) patch(key, { hidden: true });
        }, ms),
      );
    },
    [patch, spec.memory],
  );

  const peek = useCallback(
    (key: number) => {
      const v = visitsRef.current.find(x => x.key === key);
      if (!v || !v.hidden || v.phase !== "order") return;
      audio.unlock();
      audio.playTick();
      showOrder(key, PEEK_MS);
    },
    [showOrder],
  );

  // ---- customers -----------------------------------------------------------

  const bringCustomer = useCallback(
    async (mustInclude?: RewardItem) => {
      const h = heartsRef.current;
      const here = visitsRef.current.map(v => v.customer);
      const customer = pickCustomer(rng, h, here);
      const opts = { maxScoops: spec.maxScoops, minScoops: spec.minScoops, maxToppings: spec.maxToppings, treats: spec.treats };
      const orders = [makeOrder(rng, h, { ...opts, mustInclude })];
      if (h >= 10 && rng() < spec.doubles) orders.push(makeOrder(rng, h, opts));
      const key = nextKey.current++;
      updateVisits(vs => [...vs, { key, customer, orders, served: orders.map(() => false), hearts: h, phase: "arriving", hmm: false, wrongs: 0, hidden: false }]);
      audio.playDoor();
      await sleep(ARRIVE_MS);
      if (!alive.current) return;
      patch(key, { phase: "order" });
      showOrder(key, MEMORY_SHOW_MS);
    },
    [spec, updateVisits, patch, showOrder],
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
  const frontOrder = front ? front.orders[front.served.indexOf(false)] ?? null : null;

  const refuse = useCallback((item: Item) => {
    audio.playNope();
    setNope(itemKey(item));
    if (nopeTimer.current !== null) clearTimeout(nopeTimer.current);
    nopeTimer.current = window.setTimeout(() => setNope(null), NOPE_MS);
  }, []);

  const tapItem = useCallback(
    (item: Item) => {
      if (!frontOrder || busy.current) return;
      audio.unlock();
      if (helper && !helperAllows(frontOrder, build, item, spec.orderMatters)) {
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
      else if (item.kind === "blend") {
        audio.playBlend();
        setBlending(true);
        window.setTimeout(() => alive.current && setBlending(false), BLEND_MS);
      } else audio.playTopping();
    },
    [frontOrder, helper, build, spec.orderMatters, refuse],
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

    // Any waiting friend with an unserved order like this one may have it.
    let target: Visit | undefined;
    let slot = -1;
    for (const v of visitsRef.current) {
      if (v.phase !== "order") continue;
      slot = v.orders.findIndex((o, i) => !v.served[i] && matches(o, build, spec.orderMatters));
      if (slot >= 0) {
        target = v;
        break;
      }
    }
    if (!target) {
      // Not quite. The friend at the front looks puzzled and shows the order again. Nothing is lost but the tip.
      audio.playHmm();
      patch(front.key, { hmm: true, wrongs: front.wrongs + 1 });
      showOrder(front.key, PEEK_MS);
      await sleep(HMM_MS);
      if (!alive.current) return;
      patch(front.key, { hmm: false });
      busy.current = false;
      return;
    }

    const order = target.orders[slot];
    const served = target.served.map((s, i) => s || i === slot);
    const done = served.every(Boolean);
    setFlyTo(visitsRef.current.indexOf(target));
    patch(target.key, { phase: "serving" });
    audio.playBell();
    await sleep(FLY_MS);
    if (!alive.current) return;

    // Every ice cream served is a heart, and coins (with a tip for getting it right first time).
    const coins = coinsFor(order, target.wrongs === 0);
    onCoins(coins);
    setGain(g => ({ coins, key: g.key + 1 }));
    audio.playCoin();
    const before = heartsRef.current;
    const after = before + 1;
    heartsRef.current = after;
    storeHearts(after);
    onHearts(after);
    setBuild(emptyBuild());

    if (!done) {
      // One down, one to go: the friend stays, ticking off what they have.
      patch(target.key, { phase: "order", served });
      showOrder(target.key, PEEK_MS);
      audio.playYum();
      busy.current = false;
      const won = rewardsBetween(before, after);
      if (won.length > 0) {
        busy.current = true;
        setReward(won[0]);
        audio.playReward();
      }
      return;
    }

    patch(target.key, { phase: "happy", served, hidden: false });
    audio.playYum();
    await sleep(HAPPY_MS);
    if (!alive.current) return;

    patch(target.key, { phase: "leaving" });
    audio.playBye();
    await sleep(LEAVE_MS);
    if (!alive.current) return;
    const leftKey = target.key;
    const t = hideTimers.current.get(leftKey);
    if (t !== undefined) clearTimeout(t);
    hideTimers.current.delete(leftKey);
    updateVisits(vs => vs.filter(v => v.key !== leftKey));

    const won = rewardsBetween(before, after);
    if (won.length > 0) {
      setReward(won[0]);
      audio.playReward();
      return;
    }
    void fill();
  }, [front, build, spec.orderMatters, patch, showOrder, updateVisits, onHearts, onCoins, fill]);

  const closeReward = useCallback(() => {
    if (!reward) return;
    audio.playTick();
    const item: RewardItem = reward;
    setReward(null);
    // The next friend's order uses the new thing (a new friend just comes in).
    busy.current = true;
    void fill(item.kind === "customer" ? undefined : item);
  }, [reward, fill]);

  // ---- render --------------------------------------------------------------

  const have = unlocked(visits.length > 0 ? Math.min(...visits.map(v => v.hearts)) : heartsRef.current);
  const waiting = visits.filter(v => v.phase === "order");
  const ready =
    front !== null && helper && waiting.some(v => v.orders.some((o, i) => !v.served[i] && matches(o, build, spec.orderMatters)));
  const serving = visits.some(v => v.phase === "serving");
  const trayDisabled = front === null || busy.current || reward !== null;
  const blendReady = helper && frontOrder !== null && helperAllows(frontOrder, build, BLEND, spec.orderMatters);
  const flyX = spec.queue === 1 ? "-90%" : `-${Math.round(40 + (flyTo + 0.5) * (130 / spec.queue) * (spec.queue === 2 ? 1 : 1.1))}%`;
  const hat = hatOf(decor);

  return (
    <div className="screen shop-bg" data-awning={decor.equipped.awning} data-wall={decor.equipped.wall} data-counter={decor.equipped.counter}>
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
          <CoinCount coins={decor.coins} gained={gain.coins} gainKey={gain.key} />
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

      <div className={`scene ${spec.queue > 1 ? "is-crowd" : ""}`}>
        <div className="awning" aria-hidden="true" />
        <div className="floor" aria-hidden="true" />
        <div className={`stage stage-customer queue-${spec.queue}`}>
          {visits.map(v => (
            <Customer
              key={v.key}
              id={v.customer}
              orders={v.orders}
              served={v.served}
              phase={v.phase}
              hmm={v.hmm}
              front={spec.queue > 1 && v === front && !serving}
              hidden={v.hidden}
              hat={hat}
              onPeek={() => peek(v.key)}
            />
          ))}
        </div>
        <div className="stage stage-counter">
          <div className="counter-top">
            <IceCreamView
              cone={build.cone}
              scoops={build.scoops}
              toppings={build.toppings}
              blended={build.blended}
              ghost={front !== null && level < 3}
              className={`build ${serving ? "is-flying" : ""} ${blending ? "is-blending" : ""}`}
              style={{ ["--fly-x" as string]: flyX }}
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
            {spec.treats && (
              <button
                type="button"
                onClick={() => tapItem(BLEND)}
                disabled={trayDisabled}
                className={`game-btn candy candy-rose round-btn blender bg-gradient-to-b from-pink-100 to-pink-300 ${blendReady ? "is-ready" : ""} ${nope === itemKey(BLEND) ? "is-nope" : ""} ${blending ? "is-blending" : ""}`}
                aria-label="Blend the milkshake"
              >
                <BlenderIcon className="blender-icon" />
              </button>
            )}
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
        order={frontOrder}
        build={build}
        helper={helper}
        orderMatters={spec.orderMatters}
        treats={spec.treats}
        disabled={trayDisabled}
        nope={nope}
        onTap={tapItem}
      />

      {reward && <RewardPopup reward={reward} onClose={closeReward} />}
    </div>
  );
}
