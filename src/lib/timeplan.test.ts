import assert from "node:assert/strict";
import test from "node:test";
import { computePlan, touchOwned } from "./timeplan.ts";

const now = 1_700_000_000_000;

test("nothing owned puts the newest at now and steps back one second", () => {
  const plan = computePlan({ n: 10, now, owned: [], startMs: null, endMs: null, intervalMs: null });
  assert.equal(plan.error, null);
  assert.equal(plan.times[0], now);
  assert.equal(plan.times[9], now - 9000);
  assert.equal(plan.intervalMs, 1000);
  assert.equal(plan.usesNow, true);
});

test("only start is the earliest corner", () => {
  const plan = computePlan({ n: 10, now, owned: ["start"], startMs: 5000, endMs: null, intervalMs: null });
  assert.equal(plan.times[9], 5000);
  assert.equal(plan.times[0], 5000 + 9000);
  assert.equal(plan.intervalMs, 1000);
});

test("only interval anchors the newest at now", () => {
  const plan = computePlan({ n: 10, now, owned: ["interval"], startMs: null, endMs: null, intervalMs: 60_000 });
  assert.equal(plan.times[0], now);
  assert.equal(plan.times[1], now - 60_000);
  assert.equal(plan.times[9], now - 9 * 60_000);
});

test("start and end distribute evenly and ignore a stale interval", () => {
  const plan = computePlan({
    n: 4,
    now,
    owned: ["start", "end"],
    startMs: 0,
    endMs: 3000,
    intervalMs: 999,
  });
  assert.deepEqual(plan.times, [3000, 2000, 1000, 0]);
  assert.equal(plan.intervalMs, 1000);
  assert.equal(plan.autoInterval, true);
});

test("end must be later than start", () => {
  const plan = computePlan({ n: 3, now, owned: ["start", "end"], startMs: 5000, endMs: 4000, intervalMs: null });
  assert.match(plan.error ?? "", /晚于/);
});

test("the third field replaces the oldest owned field", () => {
  assert.deepEqual(touchOwned(touchOwned(touchOwned([], "start"), "end"), "interval"), ["end", "interval"]);
});
