/** A gold coin, drawn so it looks the same on every iPad. */
export function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx={20} cy={21} r={17} fill="#d97706" />
      <circle cx={20} cy={19} r={17} fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
      <circle cx={20} cy={19} r={11.5} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
      <path d="M17 12 L23 12 L23 26 M17 26 L27 26" fill="none" stroke="#b45309" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={13} cy={12} rx={4} ry={2.2} fill="#fff" opacity="0.6" transform="rotate(-30 13 12)" />
    </svg>
  );
}

/** How many coins there are, with the last few popping up when earned. */
export function CoinCount({ coins, gained, gainKey }: { coins: number; gained?: number; gainKey?: number }) {
  return (
    <span className="coin-count" aria-label={`${coins} coins`}>
      <CoinIcon className="coin-icon" />
      <span className="coin-number">{coins}</span>
      {gained ? (
        <span key={gainKey} className="coin-gain" aria-hidden="true">
          +{gained}
        </span>
      ) : null}
    </span>
  );
}
