import { nextReward, rewardProgress } from "@/game/rewards";
import { RewardIcon } from "./RewardIcon";

/** Hearts earned and how far it is to the next new thing. */
export function RewardBar({ hearts }: { hearts: number }) {
  const next = nextReward(hearts);
  const { done, total } = rewardProgress(hearts);
  return (
    <div className="reward-bar" aria-label={`${hearts} happy customers${next ? `, ${next.at - hearts} more until the next reward` : ""}`}>
      <span className="reward-count">
        <span aria-hidden="true">❤️</span> {hearts}
      </span>
      <div className="reward-track" aria-hidden="true">
        <div className="reward-fill" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <div className="reward-next" aria-hidden="true">
        {next ? <RewardIcon item={next} className="reward-next-icon" /> : <span className="reward-next-icon reward-emoji">⭐</span>}
      </div>
    </div>
  );
}
