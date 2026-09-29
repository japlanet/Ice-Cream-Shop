import { CUSTOMERS } from "@/game/catalog";
import type { CustomerId } from "@/game/catalog";
import type { Order } from "@/game/engine";
import { Critter } from "./Critter";
import type { Hat } from "./Critter";
import { IceCreamView } from "./IceCreamView";

export type Phase = "arriving" | "order" | "serving" | "happy" | "leaving";

interface CustomerProps {
  id: CustomerId;
  /** One order, or two when the friend is buying for someone else too. */
  orders: Order[];
  /** Which of the orders have been served already. */
  served: boolean[];
  phase: Phase;
  /** A gentle "hmm?" when the wrong thing is served. */
  hmm: boolean;
  /** The friend the helper is pointing at when several are waiting. */
  front: boolean;
  /** On Super the order hides after a moment: a thought cloud shows instead until the friend is tapped. */
  hidden: boolean;
  hat: Hat;
  onPeek?: () => void;
}

const PHASE_CLASS: Record<Phase, string> = {
  arriving: "is-arriving",
  order: "is-waiting",
  serving: "is-waiting",
  happy: "is-happy",
  leaving: "is-leaving",
};

/** An animal friend at the counter with the order in a speech bubble. */
export function Customer({ id, orders, served, phase, hmm, front, hidden, hat, onPeek }: CustomerProps) {
  const c = CUSTOMERS[id];
  const happy = phase === "happy";
  const mood = happy ? "happy" : hmm ? "hmm" : "waiting";
  const label = happy ? `${c.name} says yum` : hidden ? `${c.name} is thinking. Tap to see the order again.` : describe(orders, served, c.name);
  return (
    <div className={`customer ${PHASE_CLASS[phase]} ${hmm ? "is-hmm" : ""} ${front ? "is-front" : ""}`} aria-live="polite">
      <button
        type="button"
        className={`bubble ${happy ? "is-yum" : ""} ${hidden && !happy ? "is-thinking" : ""} ${orders.length > 1 ? "is-double" : ""}`}
        onClick={onPeek}
        aria-label={label}
      >
        {happy ? (
          <span className="yum">😋</span>
        ) : hidden ? (
          <span className="think" aria-hidden="true">
            <span className="think-dot" />
            <span className="think-dot" />
            <span className="think-dot" />
          </span>
        ) : (
          orders.map((o, i) => (
            <span key={i} className={`bubble-item ${served[i] ? "is-served" : ""}`}>
              <IceCreamView cone={o.cone} scoops={o.scoops} toppings={o.toppings} blended className="bubble-ice" />
              {served[i] && <span className="served-tick">✅</span>}
            </span>
          ))
        )}
        {hmm && <span className="hmm-badge">❓</span>}
      </button>
      <button type="button" className="critter-wrap" onClick={onPeek} aria-label={`${c.name}${hidden ? ": tap to see the order again" : ""}`} tabIndex={hidden ? 0 : -1}>
        <Critter id={id} mood={mood} hat={hat} className="critter" />
        {happy && (
          <span className="hearts" aria-hidden="true">
            <span style={{ left: "10%", animationDelay: "0s" }}>❤️</span>
            <span style={{ left: "45%", animationDelay: "0.2s" }}>💖</span>
            <span style={{ left: "75%", animationDelay: "0.4s" }}>❤️</span>
          </span>
        )}
      </button>
      <div className="customer-name">{c.name}</div>
    </div>
  );
}

function describe(orders: Order[], served: boolean[], name: string): string {
  const left = orders.filter((_, i) => !served[i]);
  const one = (o: Order) => `${o.scoops.length} scoop${o.scoops.length === 1 ? "" : "s"} in a ${o.cone}`;
  return `${name} would like ${left.map(one).join(" and ")}`;
}
