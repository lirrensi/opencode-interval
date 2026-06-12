# opencode-interval

[![npm version](https://img.shields.io/npm/v/opencode-interval?color=6b48ff)](https://www.npmjs.com/package/opencode-interval)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Fixed-interval prompt loop for OpenCode.** Fires a continuation message every N minutes after the session goes idle. Runs until you tell it to stop.

---

## What's the difference from ChronoLoop?

| | ChronoLoop | Interval |
|---|---|---|
| **What it does** | "Run for 60 minutes total" — fires on idle until total time expires | "Fire every 30 minutes" — waits the full interval between fires, runs forever |
| **Dwell time** | 30 seconds (just enough to confirm idle) | Your chosen interval (e.g., 30 minutes) |
| **Exit condition** | Time-based — duration expires | Manual — `/interval stop` |
| **Best for** | "Work on this for the next hour" | "Check in on me every 30 minutes" |

---

## Commands

### `/interval <minutes> [message]`

Start a periodic loop that fires every N minutes after the session goes idle.

```
/interval 30
/interval 15 "Check the build status and report back"
```

### `/interval`

Show current interval status — elapsed time and interval.

### `/interval stop`

Stop the interval loop.

---

## Backtick commands

Your message supports backtick-enclosed shell commands:

```
/interval 30 "Check `git log --oneline -3` then continue"
/interval 15 "`pnpm test --reporter=dot 2>&1 | tail -5` — fix failures"
```

---

## Install

```jsonc
// opencode.jsonc
{
  "plugin": [
    "opencode-interval",
  ]
}
```

Restart OpenCode.

---

## Development

```sh
git clone https://github.com/lirrensi/opencode-interval
cd opencode-interval
pnpm install
pnpm typecheck
pnpm test
```

---

## License

MIT
