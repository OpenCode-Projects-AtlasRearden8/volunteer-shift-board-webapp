# STATUS.md — Volunteer Shift Board

Built: November 6, 2026 by Asdale Dynamics, LLC.

## What was built

A fully offline, single-file volunteer shift coordination app:

- **`index.html`** — the entire app (HTML + CSS + JS, zero dependencies),
  designed to be opened directly from `file://`.
  - Event-shift cards with per-shift open-slot counts, fill bars, and totals.
  - Slot-claiming with guardrails: required name, no double-booking a shift,
    no overlapping time windows within an event, capacity respected (`FULL`).
  - First-timer handling: shifts can be flagged "first-timers warmly welcome"
    and a volunteer's first signup on an event is tagged "first time with us."
  - Private group-admin notes: saved notes stay hidden ("saved — kept
    private") until unlocked with the admin lock code set in Settings; editing
    re-locks them. Only a privacy screen, not real security (documented
    in-app).
  - Recurring-event templates: weekly / every-2 / every-3-week cadence; each
    template computes its next occurrence date from the most recent event with
    the same name and can stamp a fresh, empty event.
  - Return-the-favor pairing log: helper/covered pairs with a running net
    balance per person.
  - Printable day-of shift sheets: per-event print view with times, signed-up
    volunteers, blank "walk-in" underline slots, and an open-slot column;
    admin notes are deliberately never printed.
  - Data: one localStorage key (`volunteerShiftBoardV1`), JSON export button,
    wipe button. No accounts, no network calls, no third-party code.
- **`tests/slot-filling-test.js`** — 20 tests for the slot-filling and board
  logic (capacity/fill order, duplicate and overlap rejection, cancel-and-
  refill, event summary/first-timer counts, first-time tagging, time/overlap
  helpers, weekly & N-week `nextOccurrence`, template stamping, favor
  balancing). The tests extract the marked pure-logic block directly out of
  `index.html`, so they always exercise the real shipped code.
- **`README.md`** — how to run, feature tour, privacy notes, credits.
- **`LICENSE`** — MIT, Copyright (c) 2026 Asdale Dynamics, LLC.

## How to run it

- App: open `index.html` in any modern browser (double-click; runs from
  `file://`).
- Tests: `node --test tests/` (Node 18+; built-in runner, nothing to install).

## Verification results

- `node --test tests/` — **20/20 pass** (2026-11-06, Node 20.19.2).
- Syntax check: the page's single inline script parses cleanly (`new Function`
  compile) under Node 20.
- Every `getElementById(...)` target referenced by the script exists in the
  markup (automated cross-check, all present).
- Runtime smoke test with a minimal DOM/localStorage stub loaded the page's
  full script, executed initial render, then exercised: sign-up,
  double-booking block, overlap block, first-timer tagging, template stamping,
  print-sheet generation, admin-note lock/unlock rendering, favor balances,
  and localStorage persistence — **11/11 checks pass**.
- Verified the admin note renders publicly as "saved — kept private", shows
  the content only when the correct unlock code is entered, and that the
  print sheet contains no admin notes.

## Known gaps

- The admin lock code is a device-local privacy screen, not security;
  localStorage content can be read by anyone using the same browser profile.
- No multi-device sync or import UI yet (export exists; paste-back requires
  editing the localStorage key manually).
- No volunteer count cap per event beyond per-shift capacities, and no
  email/contact fields — by design (privacy, personal data kept out).
- First-timer slots are marked and welcome anyone; they are not *reserved*
  exclusively for first-timers.
- Print styling relies on browser defaults for margins; tested layouts assume
  standard US Letter/A4 portrait.
