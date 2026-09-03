import type { Reward } from "@/game/rewards";
import { RewardIcon, rewardName } from "./RewardIcon";
import { Confetti } from "./Confetti";

interface RewardPopupProps {
  reward: Reward;
  onClose: () => void;
}

/** Something new for the shop! */
export function RewardPopup({ reward, onClose }: RewardPopupProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm p-4">
      <Confetti />
      <div className="bounce-in modal-card rounded-3xl p-6 max-w-sm w-full text-center border-4 border-pink-300">
        <div className="text-2xl font-black text-pink-500 tracking-wide">✨ New! ✨</div>
        <div className="reward-big my-3 flex items-center justify-center">
          <RewardIcon item={reward} className="reward-big-icon" />
        </div>
        <h2 className="title-candy text-4xl mb-5">{rewardName(reward)}</h2>
        <button
          type="button"
          onClick={onClose}
          className="game-btn candy candy-rose w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black text-4xl"
          aria-label="Hooray! Back to the shop"
        >
          🎉
        </button>
      </div>
    </div>
  );
}
