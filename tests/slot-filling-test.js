/**
 * Slot-filling and board-logic tests for the Volunteer Shift Board.
 * Zero dependencies: uses Node's built-in test runner and the pure-logic
 * block extracted straight out of index.html, so tests always match the app.
 *
 * Run:  node --test tests/
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const match = html.match(/\/\*__LOGIC_START__\*\/([\s\S]*?)\/\*__LOGIC_END__\*\//);
assert.ok(match, "index.html must contain a __LOGIC_START__/__LOGIC_END__ block");

const sandbox = {};
vm.runInThisContext(
  match[1] +
    ";globalThis.__vsbLogic={normalizeName,isShiftFull,openSlotCount,fillPercent,parseHM,timesOverlap," +
    "signUp,cancelSignup,eventFillSummary,nextOccurrence,buildEventFromTemplate,favorBalances};",
  { filename: "index.html#logic" }
);
const { normalizeName, isShiftFull, openSlotCount, fillPercent, parseHM, timesOverlap,
  signUp, cancelSignup, eventFillSummary, nextOccurrence, buildEventFromTemplate,
  favorBalances } = globalThis.__vsbLogic;

function makeShift(overrides) {
  return Object.assign({
    id: "sh1", role: "Greeter", start: "09:00", end: "10:00",
    capacity: 2, firstTimerFriendly: false, signups: []
  }, overrides);
}
function makeEvent(shifts) {
  return { id: "ev1", name: "Saturday Pantry", date: "2026-11-07", location: "", shifts };
}

test("open slots count respects remaining capacity", () => {
  const sh = makeShift({ capacity: 3 });
  assert.equal(openSlotCount(sh), 3);
  sh.signups.push({ name: "Priya" });
  assert.equal(openSlotCount(sh), 2);
  assert.equal(isShiftFull(sh), false);
  sh.signups.push({ name: "Sam" }, { name: "Ana" });
  assert.equal(openSlotCount(sh), 0);
  assert.equal(isShiftFull(sh), true);
  assert.equal(fillPercent(sh), 100);
});

test("name is normalized for identity (trim + case)", () => {
  assert.equal(normalizeName("  Sam  "), "sam");
  assert.equal(normalizeName(null), "");
  assert.equal(normalizeName("SAMANTHA"), "samantha");
});

test("first signup fills the first open slot and returns OK", () => {
  const ev = makeEvent([makeShift()]);
  const res = signUp(ev, ev.shifts[0], " Priya ");
  assert.deepEqual(
    { ok: res.ok, code: res.code },
    { ok: true, code: "OK" }
  );
  assert.equal(ev.shifts[0].signups[0].name, "Priya");
});

test("blank names are rejected, not silently accepted", () => {
  const ev = makeEvent([makeShift()]);
  assert.equal(signUp(ev, ev.shifts[0], "   ").code, "NO_NAME");
  assert.equal(signUp(ev, ev.shifts[0], "").code, "NO_NAME");
  assert.equal(signUp(ev, ev.shifts[0], null).code, "NO_NAME");
  assert.equal(ev.shifts[0].signups.length, 0);
});

test("shift fills in request order and the next request sees FULL", () => {
  const ev = makeEvent([makeShift({ capacity: 2 })]);
  assert.equal(signUp(ev, ev.shifts[0], "A").ok, true);
  assert.equal(signUp(ev, ev.shifts[0], "B").ok, true);
  assert.equal(ev.shifts[0].signups.length, 2);
  const over = signUp(ev, ev.shifts[0], "C");
  assert.equal(over.ok, false);
  assert.equal(over.code, "FULL");
  assert.equal(ev.shifts[0].signups.length, 2);
  assert.equal(openSlotCount(ev.shifts[0]), 0);
});

test("same person cannot double-book a shift, different people can share one", () => {
  const ev = makeEvent([makeShift()]);
  assert.equal(signUp(ev, ev.shifts[0], "sam").ok, true);
  const again = signUp(ev, ev.shifts[0], "Sam");
  assert.equal(again.code, "ALREADY_SIGNED");
  assert.equal(ev.shifts[0].signups.length, 1);
  assert.equal(signUp(ev, ev.shifts[0], "Sammy J.").ok, true); // distinct person, distinct name
});

test("person cannot land in two overlapping same-event shifts", () => {
  const ev = makeEvent([makeShift(), makeShift({ id: "sh2", role: "Sorting", start: "09:30", end: "11:00" })]);
  assert.equal(signUp(ev, ev.shifts[0], "ana").ok, true);
  const conflict = signUp(ev, ev.shifts[1], "Ana");
  assert.equal(conflict.code, "TIME_CONFLICT");
  assert.equal(ev.shifts[1].signups.length, 0);
});

test("non-overlapping shifts in the same event are fine", () => {
  const ev = makeEvent([makeShift(), makeShift({ id: "sh2", role: "Sorting", start: "10:00", end: "12:00" })]);
  assert.equal(signUp(ev, ev.shifts[0], "lee").ok, true);
  const second = signUp(ev, ev.shifts[1], "Lee");
  assert.equal(second.ok, true);
});

test("a missing end time still counts as a one-hour window for overlap checks", () => {
  const ev = makeEvent([makeShift({ end: "" }), makeShift({ id: "sh2", role: "Runner", start: "09:30" })]);
  assert.equal(signUp(ev, ev.shifts[0], "jo").ok, true);
  assert.equal(signUp(ev, ev.shifts[1], "Jo").code, "TIME_CONFLICT");
});

test("overlaps are checked only against signed-up people, not empty shifts", () => {
  const ev = makeEvent([makeShift(), makeShift({ id: "sh2", role: "Sorting", start: "09:30" })]);
  assert.equal(signUp(ev, ev.shifts[1], "kim").ok, true); // sh1 empty -> no conflict
});

test("cancel frees the slot for the next volunteer", () => {
  const ev = makeEvent([makeShift()]);
  signUp(ev, ev.shifts[0], "dana");
  signUp(ev, ev.shifts[0], "ravi");
  assert.equal(ev.shifts[0].signups.length, 2);
  assert.equal(cancelSignup(ev.shifts[0], "DANA"), true);
  assert.equal(ev.shifts[0].signups.length, 1);
  assert.equal(openSlotCount(ev.shifts[0]), 1);
  assert.equal(signUp(ev, ev.shifts[0], "Ravi ").code, "ALREADY_SIGNED"); // still on
  assert.equal(signUp(ev, ev.shifts[0], "nadia").ok, true); // freed slot filled again
});

test("canceling a name that never signed up is a no-op", () => {
  const sh = makeShift();
  assert.equal(cancelSignup(sh, "nobody"), false);
  assert.equal(sh.signups.length, 0);
});

test("event summary totals every shift and flags open first-timer slots", () => {
  const ev = makeEvent([
    makeShift({ capacity: 2, firstTimerFriendly: true }),
    makeShift({ id: "sh2", role: "Sorting", capacity: 2 })
  ]);
  signUp(ev, ev.shifts[0], "a"); // 1 of 2 filled -> the friendly shift still shows an open slot
  signUp(ev, ev.shifts[1], "b");
  signUp(ev, ev.shifts[1], "c");
  assert.deepEqual(eventFillSummary(ev), { total: 4, filled: 3, open: 1, firstTimerOpen: 1 });
  cancelSignup(ev.shifts[0], "A");
  assert.deepEqual(eventFillSummary(ev), { total: 4, filled: 2, open: 2, firstTimerOpen: 1 });
  signUp(ev, ev.shifts[0], "d");
  signUp(ev, ev.shifts[0], "e");
  assert.deepEqual(eventFillSummary(ev), { total: 4, filled: 4, open: 0, firstTimerOpen: 0 });
});

test("first-timer-friendly slots stay open to everyone; the flag is just kept kindly", () => {
  const ev = makeEvent([makeShift({ firstTimerFriendly: true, capacity: 1 })]);
  assert.equal(eventFillSummary(ev).firstTimerOpen, 1);
  assert.equal(signUp(ev, ev.shifts[0], "returning-volunteer").code, "OK"); // anyone may claim it
  assert.equal(eventFillSummary(ev).firstTimerOpen, 0);
});

test("first-time flag marks people whose only signup is this one", () => {
  const ev = makeEvent([makeShift(), makeShift({ id: "sh2", role: "Sorting", start: "10:00" })]);
  const r1 = signUp(ev, ev.shifts[0], "newcomer");
  assert.equal(r1.firstTime, true);
  const r2 = signUp(ev, ev.shifts[1], "Newcomer");
  assert.equal(r2.firstTime, false); // already on this event today
  assert.equal(signUp(ev, ev.shifts[0], "old-timer").firstTime, true);
  assert.equal(signUp(ev, ev.shifts[1], "Old-Timer").firstTime, false);
});

test("time helpers", () => {
  assert.equal(parseHM("09:30"), 570);
  assert.equal(parseHM("9:05"), 545);
  assert.equal(parseHM("24:00"), null);
  assert.equal(parseHM("10:60"), null);
  assert.equal(timesOverlap("09:00", "10:00", "10:00", "11:00"), false);
  assert.equal(timesOverlap("09:00", "10:00", "09:59", "11:00"), true);
  assert.equal(timesOverlap("09:00", "", "08:30", "09:20"), true);
  assert.equal(timesOverlap("", "10:00", "09:30", "10:30"), false); // no start -> not comparable
});

test("nextOccurrence steps weekly to the requested weekday", () => {
  assert.equal(nextOccurrence("2026-11-06", 5, 1), "2026-11-13"); // Fri -> next Fri
  assert.equal(nextOccurrence("2026-11-06", 6, 1), "2026-11-07"); // Fri -> tomorrow is Sat
  assert.equal(nextOccurrence("2026-11-07", 6, 1), "2026-11-14"); // same-day event -> next week
  assert.equal(nextOccurrence("2026-11-06", 0, 1), "2026-11-08");
});

test("nextOccurrence honors every-N-weeks cadence", () => {
  assert.equal(nextOccurrence("2026-11-06", 5, 2), "2026-11-20");
  assert.equal(nextOccurrence("2026-11-06", 5, 3), "2026-11-27");
  assert.equal(nextOccurrence("2026-11-06", 5, 4), "2026-11-13"); // unknown cadence falls back to weekly
  assert.equal(nextOccurrence("not-a-date", 5, 1), null);
  assert.equal(nextOccurrence("", 5, 1), null);
});

test("buildEventFromTemplate makes an empty, signable event", () => {
  const tp = {
    name: "Saturday Pantry",
    location: "125 Main St.",
    shifts: [
      { role: "Greeter", start: "09:00", end: "10:30", capacity: 2, firstTimerFriendly: true },
      { role: "Sorting", start: "09:00", end: "11:00", capacity: 3 }
    ]
  };
  const ev = buildEventFromTemplate(tp, "2026-11-14");
  assert.equal(ev.name, "Saturday Pantry");
  assert.equal(ev.date, "2026-11-14");
  assert.equal(ev.shifts.length, 2);
  assert.equal(ev.shifts.every((s) => s.signups.length === 0), true);
  assert.equal(ev.shifts[0].firstTimerFriendly, true);
  assert.equal(signUp(ev, ev.shifts[0], "first guest").ok, true);
  assert.equal(ev.shifts[0].signups[0].firstTime, true);
});

test("favorBalances nets helped vs covered", () => {
  const net = favorBalances([
    { helper: "Priya", covered: "Sam" },
    { helper: "Priya", covered: "Sam" },
    { helper: " Sam ", covered: "PRIYA" } // one trade back
  ]);
  assert.deepEqual(net, { priya: 1, sam: -1 }); // two favors given, one returned
  const even = favorBalances([{ helper: "Jo", covered: "Kim" }, { helper: "Kim", covered: "Jo" }]);
  assert.deepEqual(even, { jo: 0, kim: 0 });
  assert.deepEqual(favorBalances([{ helper: "Jo", covered: "jo" }]), {}); // covering yourself
  assert.deepEqual(favorBalances([{ helper: "", covered: "Kim" }]), {}); // no helper
  assert.deepEqual(favorBalances([]), {});
});
