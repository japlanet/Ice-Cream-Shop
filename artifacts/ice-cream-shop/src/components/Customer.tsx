import { CUSTOMERS } from "@/game/catalog";
import type { CustomerId } from "@/game/catalog";
import type { Order } from "@/game/engine";
import { Critter } from "./Critter";
import { IceCreamView } from "./IceCreamView";

export type Phase = "arriving" | "order" | "serving" | "happy" | "leaving";

interface CustomerProps {
  id: CustomerId;
  order: Order;
  phase: Phase;
  /** A gentle "hmm?" when the wrong thing is served. */
  hmm: boolean;
  /** The friend the helper is pointing at when two are waiting. */
  front: boolean;
}

const PHASE_CLASS: Record<Phase, string> = {
  arriving: "is-arriving",
  order: "is-waiting",
  serving: "is-waiting",
  happy: "is-happy",
  leaving: "is-leaving",
};

/** An animal friend at the counter with the order in a speech bubble. */
export function Customer({ id, order, phase, hmm, front }: CustomerProps) {
  const c = CUSTOMERS[id];
  const happy = phase === "happy";
  const mood = happy ? "happy" : hmm ? "hmm" : "waiting";
  return (
    <div className={`customer ${PHASE_CLASS[phase]} ${hmm ? "is-hmm" : ""} ${front ? "is-front" : ""}`} aria-live="polite">
      <div className={`bubble ${happy ? "is-yum" : ""}`} role="img" aria-label={happy ? `${c.name} says yum` : describe(order, c.name)}>
        {happy ? (
          <span className="yum">😋</span>
        ) : (
          <IceCreamView cone={order.cone} scoops={order.scoops} toppings={order.toppings} className="bubble-ice" />
        )}
        {hmm && <span className="hmm-badge">❓</span>}
      </div>
      <div className="critter-wrap">
        <Critter id={id} mood={mood} className="critter" />
        {happy && (
          <span className="hearts" aria-hidden="true">
            <span style={{ left: "10%", animationDelay: "0s" }}>❤️</span>
            <span style={{ left: "45%", animationDelay: "0.2s" }}>💖</span>
            <span style={{ left: "75%", animationDelay: "0.4s" }}>❤️</span>
          </span>
        )}
      </div>
      <div className="customer-name">{c.name}</div>
    </div>
  );
}

function describe(order: Order, name: string): string {
  return `${name} would like ${order.scoops.length} scoop${order.scoops.length === 1 ? "" : "s"} in a ${order.cone}`;
}
