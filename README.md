# Volunteer Shift Board

An offline, single-file web app for community groups coordinating volunteer
shifts: event-shift cards with open slots, first-timer slots marked kindly,
private group-admin notes, recurring-event templates, a return-the-favor
pairing log, and printable day-of shift sheets. Everything lives in your
browser's localStorage — no accounts, no server, no sign-up.

Built by **Asdale Dynamics, LLC** as part of a beginner-friendly, local-first
software collection.

## Quick start

1. Download `index.html` (that's the whole app).
2. Double-click it (or drag it into any modern browser). It runs straight from
   `file://` — no install, no internet needed after that.
3. Add an event with a few shifts and put it on the fridge.

To move your data, use **Settings → Download backup (JSON)**.

## What it does

- **Event-shift cards** — each event shows roles, times, and open slots with a
  fill bar; volunteers type their name and claim a slot. The board prevents
  double-booking and overlapping sign-ups.
- **Kindly marked first-timer slots** — shifts can be flagged
  "first-timers warmly welcome," and a first signup on an event is tagged
  "first time with us" so greeters know to say an extra hello.
- **Private group-admin notes** — keep reminders (who brings the pastries, who
  needs a parking spot) behind a lock code in Settings. This is a privacy
  screen on your own device, not real security: don't store sensitive or
  personal information.
- **Recurring-event templates** — save a weekly (or every-2/3-week) shift
  pattern once; each template shows the computed next date and can stamp a
  fresh, empty event in one click.
- **Return-the-favor pairing log** — log who covered for whom and the board
  keeps a running balance, so the same short-notice hero doesn't burn out.
- **Printable day-of shift sheets** — one click builds a clean per-event sheet
  (times, volunteers, blank lines for walk-ins) that prints nicely on paper
  for the clipboard by the door.
- **No accounts, ever** — data stays in your browser's localStorage on that
  device. Clearing site data or erasing from Settings wipes it, so keep
  backups of anything you'd miss.

## Tests

The slot-filling rules are pure functions inside `index.html`, marked with
`__LOGIC_START__` / `__LOGIC_END__`, and the test suite extracts them straight
from the real file, so tests always run the same code the page runs.

```bash
node --test tests/
```

Requires Node 18+ (uses the built-in test runner). No dependencies to install.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The entire app — HTML, CSS, and JavaScript in one file |
| `tests/slot-filling-test.js` | Slot-filling logic tests (Node's built-in runner) |
| `LICENSE` | MIT license |
| `STATUS.md` | Build/verification notes and known gaps |

## Privacy & security notes

- Nothing is sent anywhere; there are no network calls. Do a diff if you like.
- The admin lock code is stored locally and is a convenience screen only.
- Volunteer names are signed voluntarily by whoever types them — store only
  what your group is comfortable keeping on the shared device.

## Credits

Created by **Asdale Dynamics, LLC** — beginner-friendly AI education, books,
and practical local-first tools. See [dylanasdale.github.io](https://dylanasdale.github.io).

## License

MIT — see [LICENSE](LICENSE).
