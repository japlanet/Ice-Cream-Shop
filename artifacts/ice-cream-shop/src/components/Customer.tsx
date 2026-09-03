import { CUSTOMERS } from "@/game/catalog";
import type { CustomerId } from "@/game/catalog";
import type { Order } from "@/game/engine";
import { IceCreamView } from "./IceCreamView";

export type Phase = "arriving" | "order" | "serving" | "happy" | "leaving";

interface CustomerProps {
  id: CustomerId;
  order: Order;
  phase: Phase;
  /** A gentle "hmm?" when the wrong thing is served. */
  hmm: boolean;
}

const PHASE_CLASS: Record<Phase, string> = {
  arriving: "is-arriving",
  order: "is-waiting",
  serving: "is-waiting",
  happy: "is-happy",
  leaving: "is-leaving",
};

/** An animal friend at the counter with the order in a speech bubble. */
export function Customer({ id, order, phase, hmm }: CustomerProps) {
  const c = CUSTOMERS[id];
  const happy = phase === "happy";
  return (
    <div className={`customer ${PHASE_CLASS[phase]} ${hmm ? "is-hmm" : ""}`} aria-live="polite">
      <div className={`bubble ${happy ? "is-yum" : ""}`} role="img" aria-label={happy ? `${c.name} says yum` : describe(order, c.name)}>
        {happy ? (
          <span className="yum">😋</span>
        ) : (
          <IceCreamView cone={order.cone} scoops={order.scoops} toppings={order.toppings} className="bubble-ice" />
        )}
        {hmm && <span className="hmm-badge">❓</span>}
      </div>
      <div className="face" style={{ background: c.color }}>
        <span className="face-emoji">{c.emoji}</span>
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
