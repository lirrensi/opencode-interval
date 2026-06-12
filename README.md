# opencode-interval

[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js)](package.json)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](package.json)

**Fixed-interval prompt loop for OpenCode.** Fires a continuation message every N minutes after the session goes idle. Runs until you tell it to stop.

A plugin companion to [ChronoLoop](https://github.com/lirrensi/opencode-chronoloop) — same family, different rhythm.

## Features

- **Flexible durations** — `30`, `30m`, `1h`, `90s` — whatever suits your cadence
- **Custom prompt** — every fire sends your message (or a default "Continue working autonomously.")
- **Backtick commands** — `` `git status` `` in your message gets evaluated before firing
- **Heartbeat toast** — live status every 5s showing elapsed time and countdown to next fire
- **Idle-only firing** — fires only after the full interval of idle time, never interrupts active work
- **Session-scoped** — one loop per session; auto-stops on new session or interrupt
- **No expiry** — runs forever until you call `/interval stop`

## ChronoLoop vs Interval

| | ChronoLoop | Interval |
|---|---|---|
| **What it does** | "Run for 60 minutes total" — fires on idle until total time expires | "Fire every 30 minutes" — waits the full interval between fires, runs forever |
| **Dwell time** | 30 seconds (just enough to confirm idle) | Your chosen interval (e.g., 30 minutes) |
| **Exit condition** | Time-based — duration expires | Manual — `/interval stop` |
| **Best for** | "Work on this for the next hour" | "Check in on me every 30 minutes" |

## Commands

### `/interval <duration> [message]`

Start a periodic loop. Duration supports suffixes — bare numbers are minutes.

```
/interval 30
/interval 30m
/interval 1h
/interval 90s
/interval 15 "Check the build status and report back"
```

### `/interval`

Show current interval status — elapsed time, interval, and message preview.

### `/interval stop`

Stop the interval loop.

## Backtick commands

Your message supports backtick-enclosed shell commands. They're evaluated each time the loop fires, with output substituted in place:

```
/interval 30 "Check `git log --oneline -3` then continue"
/interval 15 "`pnpm test --reporter=dot 2>&1 | tail -5` — fix failures"
```

Commands time out after 5 minutes; output over 2000 chars is truncated.

## Install

### Prerequisites

- [OpenCode](https://github.com/opencode-ai/opencode) (plugin host)
- [pnpm](https://pnpm.io/) (package manager)

### Setup

```sh
git clone https://github.com/lirrensi/opencode-interval
cd opencode-interval
pnpm install
pnpm deploy     # registers the plugin locally
```

Restart OpenCode. The `/interval` command will be available in any session.

> **Not published to npm yet.** `pnpm deploy` copies the plugin to `~/.config/opencode/plugins/` where OpenCode picks it up automatically.

## Development

```sh
git clone https://github.com/lirrensi/opencode-interval
cd opencode-interval
pnpm install
pnpm typecheck    # TypeScript check
pnpm test         # run tests
pnpm test:watch   # watch mode
pnpm sync         # sync local plugin registry (auto-import from src/)
```

## License

MIT — see [LICENSE](LICENSE).

---

*Set a rhythm, not a deadline.*
