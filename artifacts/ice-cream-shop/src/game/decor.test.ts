import { test } from "node:test";
import assert from "node:assert/strict";
import { DECOR, DECOR_KINDS, addCoins, freshDecor, isDecorState, owns, tapDecor } from "./decor.ts";

test("a fresh shop owns and shows the free decorations", () => {
  const s = freshDecor();
  assert.equal(s.coins, 0);
  for (const k of DECOR_KINDS) {
    const item = DECOR.find(d => d.id === s.equipped[k]);
    assert.equal(item?.kind, k);
    assert.equal(item?.price, 0);
  }
  assert.ok(isDecorState(s));
});

test("every kind has exactly one free item, and ids are unique", () => {
  for (const k of DECOR_KINDS) assert.equal(DECOR.filter(d => d.kind === k && d.price === 0).length, 1, k);
  assert.equal(new Set(DECOR.map(d => d.id)).size, DECOR.length);
});

test("buying: needs the coins, takes them once, and puts the item up", () => {
  let s = freshDecor();
  assert.equal(tapDecor(s, "awning-mint"), null, "cannot afford it yet");
  s = addCoins(s, 30);
  const bought = tapDecor(s, "awning-mint")!;
  assert.equal(bought.coins, 5);
  assert.ok(owns(bought, "awning-mint"));
  assert.equal(bought.equipped.awning, "awning-mint");
  const back = tapDecor(bought, "awning-pink")!;
  assert.equal(back.equipped.awning, "awning-pink");
  assert.equal(back.coins, 5, "switching back is free");
  const again = tapDecor(back, "awning-mint")!;
  assert.equal(again.coins, 5, "owned things are never paid for twice");
  assert.equal(tapDecor(s, "no-such-thing"), null);
  assert.equal(addCoins(s, -5).coins, 30, "coins never go down by adding");
});

test("saved shops are checked before use", () => {
  assert.ok(!isDecorState(null));
  assert.ok(!isDecorState({ coins: -1, owned: [], equipped: freshDecor().equipped }));
  assert.ok(!isDecorState({ ...freshDecor(), equipped: { ...freshDecor().equipped, hat: "hat-crown" } }), "cannot wear what is not owned");
  assert.ok(!isDecorState({ ...freshDecor(), equipped: { ...freshDecor().equipped, hat: "awning-mint" } }), "an awning is not a hat");
});
