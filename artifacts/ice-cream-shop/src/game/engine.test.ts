import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_SCOOPS,
  MAX_TOPPINGS,
  addItem,
  emptyBuild,
  helperAllows,
  isEmpty,
  isUseful,
  makeOrder,
  matches,
  mulberry32,
  pickCustomer,
  undo,
} from "./engine.ts";
import type { Build, Item, Order } from "./engine.ts";
import { unlocked } from "./rewards.ts";

function build(items: Item[]): Build {
  let b = emptyBuild();
  for (const it of items) {
    const next = addItem(b, it);
    assert.ok(next, `could not add ${it.kind} ${it.id}`);
    b = next;
  }
  return b;
}

test("building: cone first, then scoops, then toppings", () => {
  const b0 = emptyBuild();
  assert.ok(isEmpty(b0));
  assert.equal(addItem(b0, { kind: "scoop", id: "vanilla" }), null, "no scoop without a cone");
  assert.equal(addItem(b0, { kind: "topping", id: "cherry" }), null, "no topping on nothing");
  const b1 = build([{ kind: "cone", id: "cone" }]);
  assert.equal(addItem(b1, { kind: "topping", id: "cherry" }), null, "no topping on a bare cone");
  assert.equal(addItem(b1, { kind: "cone", id: "cone" }), null, "same cone again does nothing");
  const swapped = addItem(b1, { kind: "cone", id: "cup" });
  assert.equal(swapped?.cone, "cup");
  assert.deepEqual(swapped?.history, ["cone"], "swapping a cone is not a second history entry");

  const full = build([
    { kind: "cone", id: "cone" },
    { kind: "scoop", id: "vanilla" },
    { kind: "scoop", id: "chocolate" },
    { kind: "scoop", id: "vanilla" },
  ]);
  assert.equal(full.scoops.length, MAX_SCOOPS);
  assert.equal(addItem(full, { kind: "scoop", id: "mint" }), null, "no fourth scoop");
  const t1 = addItem(full, { kind: "topping", id: "cherry" })!;
  assert.equal(addItem(t1, { kind: "topping", id: "cherry" }), null, "no topping twice");
  const t2 = addItem(t1, { kind: "topping", id: "sprinkles" })!;
  assert.equal(t2.toppings.length, MAX_TOPPINGS);
  assert.equal(addItem(t2, { kind: "topping", id: "sauce" }), null, "no third topping");
});

test("undo takes off the last thing; toppings come off with their scoop; the cone takes it all", () => {
  const b = build([
    { kind: "cone", id: "cup" },
    { kind: "scoop", id: "vanilla" },
    { kind: "topping", id: "cherry" },
    { kind: "scoop", id: "mint" },
  ]);
  const u1 = undo(b);
  assert.deepEqual(u1.scoops, ["vanilla"]);
  assert.deepEqual(u1.toppings, [], "toppings sat on the scoop that came off");
  assert.deepEqual(u1.history, ["cone", "scoop"]);
  const u2 = undo(u1);
  assert.deepEqual(u2.scoops, []);
  assert.equal(u2.cone, "cup");
  const u3 = undo(u2);
  assert.ok(isEmpty(u3));
  assert.ok(isEmpty(undo(u3)), "undo on empty is harmless");
});

test("matching ignores stacking order and topping order", () => {
  const order: Order = { cone: "cone", scoops: ["vanilla", "chocolate"], toppings: ["cherry", "sprinkles"] };
  const ok = build([
    { kind: "cone", id: "cone" },
    { kind: "scoop", id: "chocolate" },
    { kind: "scoop", id: "vanilla" },
    { kind: "topping", id: "sprinkles" },
    { kind: "topping", id: "cherry" },
  ]);
  assert.ok(matches(order, ok));
  assert.ok(!matches(order, undo(ok)), "missing topping");
  assert.ok(!matches(order, addItem(ok, { kind: "cone", id: "cup" })!), "wrong cone");
  const twoVanilla = build([
    { kind: "cone", id: "cone" },
    { kind: "scoop", id: "vanilla" },
    { kind: "scoop", id: "vanilla" },
    { kind: "topping", id: "sprinkles" },
    { kind: "topping", id: "cherry" },
  ]);
  assert.ok(!matches(order, twoVanilla), "counts matter");
});

test("the helper lights up only what still helps", () => {
  const order: Order = { cone: "cup", scoops: ["vanilla", "vanilla", "mint"], toppings: ["cherry"] };
  const b0 = emptyBuild();
  assert.ok(isUseful(order, b0, { kind: "cone", id: "cup" }));
  assert.ok(!isUseful(order, b0, { kind: "cone", id: "cone" }));
  assert.ok(!isUseful(order, b0, { kind: "scoop", id: "vanilla" }), "cone first");
  const b1 = build([{ kind: "cone", id: "cup" }]);
  assert.ok(!isUseful(order, b1, { kind: "cone", id: "cup" }), "already have it");
  assert.ok(isUseful(order, b1, { kind: "scoop", id: "vanilla" }));
  assert.ok(isUseful(order, b1, { kind: "scoop", id: "mint" }));
  assert.ok(!isUseful(order, b1, { kind: "scoop", id: "chocolate" }));
  assert.ok(!isUseful(order, b1, { kind: "topping", id: "cherry" }), "scoops before toppings");
  const b2 = build([
    { kind: "cone", id: "cup" },
    { kind: "scoop", id: "vanilla" },
    { kind: "scoop", id: "vanilla" },
  ]);
  assert.ok(!isUseful(order, b2, { kind: "scoop", id: "vanilla" }), "enough vanilla");
  assert.ok(isUseful(order, b2, { kind: "scoop", id: "mint" }));
  assert.ok(!isUseful(order, b2, { kind: "topping", id: "cherry" }), "one scoop still to go");
  const b3 = addItem(b2, { kind: "scoop", id: "mint" })!;
  assert.ok(isUseful(order, b3, { kind: "topping", id: "cherry" }));
  assert.ok(!isUseful(order, b3, { kind: "topping", id: "sprinkles" }));
  assert.ok(helperAllows(order, b3, { kind: "topping", id: "cherry" }));
  const done = addItem(b3, { kind: "topping", id: "cherry" })!;
  assert.ok(matches(order, done));
  for (const it of [
    { kind: "cone", id: "cone" },
    { kind: "scoop", id: "mint" },
    { kind: "topping", id: "sprinkles" },
  ] as Item[]) {
    assert.ok(!isUseful(order, done, it), `nothing useful once done: ${it.kind} ${it.id}`);
  }
});

test("following the helper always ends in a matching build", () => {
  const rng = mulberry32(7);
  const all: Item[] = [
    ...(["cone", "cup", "choco", "rainbow"] as const).map(id => ({ kind: "cone", id }) as Item),
    ...(["vanilla", "chocolate", "strawberry", "mint", "blueberry", "lemon", "bubblegum", "mango", "rainbow"] as const).map(
      id => ({ kind: "scoop", id }) as Item,
    ),
    ...(["sprinkles", "cherry", "sauce", "candy", "cookie"] as const).map(id => ({ kind: "topping", id }) as Item),
  ];
  for (let i = 0; i < 300; i++) {
    const hearts = Math.floor(rng() * 320);
    const order = makeOrder(rng, hearts);
    let b = emptyBuild();
    let steps = 0;
    while (!matches(order, b)) {
      const useful = all.filter(it => helperAllows(order, b, it));
      assert.ok(useful.length > 0, `stuck on ${JSON.stringify(order)} with ${JSON.stringify(b)}`);
      b = addItem(b, useful[Math.floor(rng() * useful.length)])!;
      assert.ok(++steps <= 1 + MAX_SCOOPS + MAX_TOPPINGS);
    }
  }
});

test("orders only use what is unlocked and grow gently", () => {
  const rng = mulberry32(42);
  for (let i = 0; i < 1000; i++) {
    const hearts = Math.floor(rng() * 320);
    const have = unlocked(hearts);
    const o = makeOrder(rng, hearts);
    assert.ok(have.cones.includes(o.cone));
    assert.ok(o.scoops.length >= 1 && o.scoops.length <= MAX_SCOOPS);
    for (const s of o.scoops) assert.ok(have.flavors.includes(s));
    assert.ok(o.toppings.length <= MAX_TOPPINGS);
    assert.equal(new Set(o.toppings).size, o.toppings.length, "toppings are distinct");
    for (const t of o.toppings) assert.ok(have.toppings.includes(t));
    if (hearts < 10) {
      assert.equal(o.scoops.length, 1);
      assert.equal(o.toppings.length, 0);
    }
    if (hearts < 30) assert.ok(o.scoops.length <= 2);
  }
});

test("order options: scoop cap and must-include", () => {
  const rng = mulberry32(3);
  for (let i = 0; i < 300; i++) {
    assert.ok(makeOrder(rng, 300, { maxScoops: 2 }).scoops.length <= 2);
    assert.ok(makeOrder(rng, 300, { maxScoops: 0 }).scoops.length === 1, "cap never below one");
    assert.equal(makeOrder(rng, 300, { mustInclude: { kind: "cone", id: "rainbow" } }).cone, "rainbow");
    assert.ok(makeOrder(rng, 300, { mustInclude: { kind: "flavor", id: "mango" } }).scoops.includes("mango"));
    const t = makeOrder(rng, 300, { mustInclude: { kind: "topping", id: "cookie" } });
    assert.ok(t.toppings.includes("cookie"));
    assert.ok(t.toppings.length <= MAX_TOPPINGS);
    assert.equal(new Set(t.toppings).size, t.toppings.length);
  }
});

test("customers come from the unlocked set and never twice in a row", () => {
  const rng = mulberry32(11);
  let last = pickCustomer(rng, 0, null);
  for (let i = 0; i < 500; i++) {
    const hearts = Math.floor(rng() * 320);
    const next = pickCustomer(rng, hearts, last);
    assert.notEqual(next, last);
    assert.ok(unlocked(hearts).customers.includes(next));
    last = next;
  }
});
