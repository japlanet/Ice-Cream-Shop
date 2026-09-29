import { test } from "node:test";
import assert from "node:assert/strict";
import { REWARDS, nextReward, rewardProgress, rewardsBetween, unlockAt, unlocked } from "./rewards.ts";
import { CONE_ORDER, CUSTOMER_ORDER, FLAVOR_ORDER, STARTER, TOPPING_ORDER, TREATS } from "./catalog.ts";

test("rewards come every 10 to 20 hearts, in increasing order", () => {
  let prev = 0;
  for (const r of REWARDS) {
    const gap = r.at - prev;
    assert.ok(gap >= 10 && gap <= 20, `gap of ${gap} before ${r.kind} ${r.id}`);
    prev = r.at;
  }
});

test("every reward is a real catalogue item, given once, and not a starter", () => {
  const seen = new Set<string>();
  for (const r of REWARDS) {
    const key = r.kind + ":" + r.id;
    assert.ok(!seen.has(key), `duplicate ${key}`);
    seen.add(key);
    const list = { cone: CONE_ORDER, flavor: FLAVOR_ORDER, topping: TOPPING_ORDER, customer: CUSTOMER_ORDER }[r.kind] as string[];
    assert.ok(list.includes(r.id), `unknown ${key}`);
    const starter = { cone: STARTER.cones, flavor: STARTER.flavors, topping: STARTER.toppings, customer: STARTER.customers }[r.kind] as string[];
    assert.ok(!starter.includes(r.id), `${key} is already a starter`);
  }
});

test("starters plus rewards cover the whole catalogue", () => {
  const all = unlocked(REWARDS[REWARDS.length - 1].at);
  assert.deepEqual(all.cones, CONE_ORDER.filter(c => !TREATS.includes(c)), "treats come with the level, not with hearts");
  assert.deepEqual(all.flavors, FLAVOR_ORDER);
  assert.deepEqual(all.toppings, TOPPING_ORDER);
  assert.deepEqual(all.customers, CUSTOMER_ORDER);
});

test("unlocked grows with hearts and starts with the starter set", () => {
  const start = unlocked(0);
  assert.deepEqual(start.cones, STARTER.cones);
  assert.deepEqual(start.flavors, STARTER.flavors);
  assert.deepEqual(start.toppings, []);
  assert.deepEqual(start.customers, STARTER.customers);
  assert.deepEqual(unlocked(9).toppings, []);
  assert.deepEqual(unlocked(10).toppings, ["sprinkles"]);
  assert.ok(unlocked(20).flavors.includes("mint"));
  assert.equal(unlockAt("flavor", "mint"), 20);
  assert.equal(unlockAt("flavor", "vanilla"), null);
});

test("next reward, crossings and progress", () => {
  assert.equal(nextReward(0)?.at, 10);
  assert.equal(nextReward(10)?.at, 20);
  assert.equal(nextReward(10_000), null);
  assert.deepEqual(
    rewardsBetween(9, 10).map(r => r.id),
    ["sprinkles"],
  );
  assert.deepEqual(rewardsBetween(10, 11), []);
  assert.deepEqual(rewardProgress(0), { done: 0, total: 10 });
  assert.deepEqual(rewardProgress(13), { done: 3, total: 10 });
  assert.deepEqual(rewardProgress(55), { done: 5, total: 15 });
  assert.deepEqual(rewardProgress(10_000), { done: 1, total: 1 });
});
