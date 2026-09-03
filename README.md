# Ice Cream Shop 🍦

A gentle ice cream shop for a toddler on an iPad. Animal friends come to the counter and show
what they would like in a speech bubble; the child taps a cone, the scoops and the toppings,
then rings the bell. There is no timer, no score to lose, and no reading needed.

- **Orders are pictures.** The friend's bubble shows the exact ice cream. Scoops can be stacked
  in any order; only the cone, the number of each flavour and the toppings have to match.
- **The little helper** (on by default) lights up the things the order still needs and dims the
  rest. A wrong tap just wobbles with a soft boop and nothing goes on. With the helper off
  (Parents panel), anything can be built; a wrong order makes the friend go "hmm?" with a ❓ and
  the child can fix it with the ↩️ button. Nothing is ever lost.
- **Every happy customer is a heart.** Every 10 to 20 hearts something new arrives, with
  confetti: a topping, a flavour, a cone, or a new friend who starts visiting. The very next
  order uses the new thing. The shop opens with a cone, a cup and three flavours and grows to
  four cones, nine flavours, five toppings and twelve friends over 300 hearts.
- **Orders grow gently.** One scoop and no toppings for the first ten customers, then two
  scoops sometimes, then three from thirty hearts. Parents can cap orders at two scoops.
- The **menu board** on the home screen shows everything earned and what is still locked, with
  the hearts needed.
- All sound is synthesised in the browser (`src/audio/engine.ts`): plops for scoops, a sparkle
  for toppings, the counter bell, a "yum", a soft "hmm", a fanfare for rewards and a slow
  music-box waltz. Effects and music have separate toggles on the play screen.
- The Parents panel has a hold-for-two-seconds button that erases all hearts and settings, so
  a child cannot do it by accident.
- Installs to the iPad Home Screen with a proper icon and **plays offline** after the first
  visit (`public/manifest.webmanifest`, `public/sw.js`). Nothing is downloaded during play: the
  ice creams are drawn as SVG, the friends are emoji, and the sound is generated.

## Layout

Same pnpm workspace shape as Cake-Sort-Fun, Tile-Match-Fun and Snakes-Ladders-Fun. The game
lives in `artifacts/ice-cream-shop`.

| Path | What |
| --- | --- |
| `src/game/catalog.ts` | Cones, flavours, toppings and friends: names, colours, the starter set. |
| `src/game/rewards.ts` | The reward ladder and what is unlocked at a given number of hearts. |
| `src/game/engine.ts` | The rules: building, undo, matching, the helper, order generation. Pure functions. |
| `src/game/*.test.ts` | Unit tests, including a random-play check that following the helper always completes an order. |
| `src/game/save.ts` | Hearts in localStorage, and erase-all. |
| `src/pages/Shop.tsx` | The play screen: the customer flow, serving, rewards. |
| `src/components/IceCreamView.tsx` | Draws an ice cream (and the tray icons) as SVG. |
| `src/components/` | Customer with speech bubble, trays, reward bar and popup, menu board, home, parents panel. |
| `src/audio/engine.ts` | Synthesised sound effects and the background tune. |

## Commands

```bash
pnpm install
pnpm --filter @workspace/ice-cream-shop run test        # rules tests (node --test, no extra deps)
pnpm --filter @workspace/ice-cream-shop run typecheck
PORT=5175 BASE_PATH=/ pnpm --filter @workspace/ice-cream-shop run dev
pnpm run build                                          # typecheck + tests + vite build
```

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and publishes on every push to `main`. `BASE_PATH` in
that file must match the repository name (`/Ice-Cream-Shop/` by default). In the repository
settings, Pages is set to deploy from GitHub Actions. Then open the Pages URL in Safari on the
iPad, tap Share, and "Add to Home Screen". After that first visit it works with no internet.
