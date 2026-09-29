# Ice Cream Shop 🍦

A gentle ice cream shop for a toddler on an iPad. Animal friends come to the counter and show
what they would like in a speech bubble; the child taps a cone, the scoops and the toppings,
then rings the bell. There is no timer, no score to lose, and no reading needed.

- **Orders are pictures.** The friend's bubble shows the exact ice cream. The friends are drawn
  animals that blink, beam when served and look puzzled when the order is wrong.
- **Four ways to play**, picked on the home screen and remembered. None has a timer.
  - ⭐ **Easy**: one or two scoops, stacked any way up, at most one topping.
  - ⭐⭐ **Medium**: up to three scoops that must be stacked bottom to top as shown, two toppings.
  - ⭐⭐⭐ **Hard**: as Medium, with two friends waiting at once, and sundaes and milkshakes on
    the menu. Whichever friend's order the treat matches takes it; the helper points at the one
    in front (yellow name tag).
  - ⭐⭐⭐⭐ **Super**: three friends waiting, up to four scoops and three toppings, and about a
    third of friends order two things at once (each gets a ✅ as it is served). Orders show for a
    few seconds and then hide in a thought cloud: tap the friend to see it again. The helper
    stays off here, since the point is remembering.
- **Sundaes and milkshakes** (Hard and Super). A sundae bowl holds up to three scoops side by
  side, in any order. A milkshake takes one or two scoops, then a tap on the blender, then its
  toppings.
- **Coins and decorating.** Each thing served pays coins: one for the container, one per scoop
  and topping, two more for a treat, and a tip of two for getting it right first time. On the
  🎨 screen coins buy awnings, wallpaper, counters, and hats that every friend wears (party
  hats, bows, flowers, chef hats, crowns). Tapping something already bought puts it up again.
- **The little helper** (on by default) lights up the things the order still needs and dims the
  rest. A wrong tap just wobbles with a soft boop and nothing goes on. With the helper off
  (Parents panel), anything can be built; a wrong order makes the friend go "hmm?" with a ❓ and
  the child can fix it with the ↩️ button. Nothing is ever lost.
- **Every ice cream served is a heart.** Every 10 to 20 hearts something new arrives, with
  confetti: a topping, a flavour, a cone, or a new friend who starts visiting. The very next
  order uses the new thing. The shop opens with a cone, a cup and three flavours and grows to
  four cones, eleven flavours, seven toppings and fifteen friends over 405 hearts.
- **Orders grow gently.** One scoop and no toppings for the first ten customers, then two
  scoops sometimes, then three from thirty hearts (on Medium and Hard).
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
- Keeps itself up to date: the page loads network-first, and an installed app that iOS only
  resumes (never relaunches) checks for a new version when it comes back after 5+ minutes away and
  reloads into it. The Parents panel has **Check for update** for doing it on demand, with the build
  date underneath (`src/update.ts`). No need to delete and re-add the Home Screen icon.
- Fonts (Nunito and Fredoka, SIL Open Font License) are bundled with the game from `@fontsource`, so it
  makes no requests to Google or any other site, and they work offline too.

## Layout

Same pnpm workspace shape as Cake-Sort-Fun, Tile-Match-Fun and Snakes-Ladders-Fun. The game
lives in `artifacts/ice-cream-shop`.

| Path | What |
| --- | --- |
| `src/game/catalog.ts` | Cones, flavours, toppings and friends: names, colours, the starter set. |
| `src/game/rewards.ts` | The reward ladder and what is unlocked at a given number of hearts. |
| `src/game/levels.ts` | Easy, Medium, Hard and Super: scoop counts, order-matters, queue, treats, doubles, memory. |
| `src/game/decor.ts` | The decorations shop: prices, buying and putting things up, save checking. |
| `src/game/engine.ts` | The rules: building, undo, matching, the helper, order generation. Pure functions. |
| `src/game/*.test.ts` | Unit tests, including a random-play check that following the helper always completes an order. |
| `src/game/save.ts` | Hearts in localStorage, and erase-all. |
| `src/pages/Shop.tsx` | The play screen: the customer flow, serving, rewards. |
| `src/components/IceCreamView.tsx` | Draws an ice cream, and the tubs, jars and cone holders on the trays, as SVG. |
| `src/components/Critter.tsx` | The twelve animal friends, drawn as SVG with moods and blinking. |
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
