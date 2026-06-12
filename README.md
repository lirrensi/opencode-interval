# opencode-interval

[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js)](package.json)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](package.json)

**Fixed-interval prompt loop for OpenCode.** Fires a message every N minutes after the session goes idle. Runs until you tell it to stop.

A plugin companion to [ChronoLoop](https://github.com/lirrensi/opencode-chronoloop) — same family, different rhythm.

> **Think of it as cron for your agent.** Every interval tick, the agent checks in — looks at something, reports, acts. Not a continuous work session. Just periodic check-ins.

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
| **Dwell time** | Short (3s idle / 10s busy) — just enough to confirm idle | Your chosen interval (e.g., 30 minutes) |
| **Exit condition** | Time-based — duration expires | Manual — `/interval stop` |
| **Session model** | Single long-lived session — agent works continuously | Same session, periodic check-ins — agent inspects and reports |
| **Message pattern** | "Continue what you were doing" — loop-aware context | "Check X and report" — fresh task each fire |
| **Best for** | Long-running autonomous work (hours) | Periodic check-ins, monitoring, babysitting |

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

---

## Crafting your interval message 🎯📝

Unlike ChronoLoop (where the agent works continuously), interval fires are **discrete check-ins**. Each fire is a fresh inspection — the agent doesn't carry state between them. Your message should tell the agent what to inspect, how to report, and what action to take.

### The interval message template

```
/interval <duration> "Check [what]. If [condition], do [action]. Otherwise, [fallback]."
```

Each fire is independent. The agent reads the instruction, does the check, and responds. If you want it to remember what it found last time, use backtick commands to read from a file.

### Pattern: PR babysitting

```
/interval 15 "Check open PRs via `gh pr list --json number,title,state`.
If any PR has been waiting for review for more than 1 hour, review it and leave comments.
Summarize current PR status in a toast."
```

The agent periodically checks PR status and acts when conditions are met. Useful when you're deep in work and don't want to context-switch.

### Pattern: Build health monitor

```
/interval 30 "Run `pnpm test --reporter=dot 2>&1 | tail -20`.
If any tests are failing, diagnose and fix them.
If all tests pass, report 'Build green' and do nothing further."
```

Keeps the build green while you work on other things. Agent only acts when there's a problem.

### Pattern: Log tailing / error monitoring

```
/interval 10 "Check `tail -50 logs/app.log` for ERROR-level entries.
If new errors since last check, analyze the stack trace and file a fix.
Track seen errors in LOG_MONITOR.md to avoid duplicates."
```

Periodic log inspection. Agent learns what's normal, raises flags on anomalies.

### Pattern: Dependency freshness check

```
/interval 120 "Run `pnpm outdated --format json`.
If any major-version updates are available, research the changelog and open an issue.
Summarize overall dependency health."
```

Longer interval (2h) for background dep maintenance. Agent checks, researches, and documents — doesn't update automatically.

### Pattern: Simple periodic reminder

```
/interval 60 "Read `cat DAILY_NOTES.md` and report today's context.
If there are any urgent items, flag them.
Otherwise continue with your current task."
```

The simplest pattern — just a nudge to keep the agent oriented.

---

## Use cases 🎯🔍📊

| Use Case | Interval | Message Focus |
|---|---|---|
| **PR babysitting** | 10–30 min | Check PR status, review when needed |
| **Build monitor** | 15–30 min | Run tests, fix failures, report green |
| **Log monitoring** | 5–15 min | Tail logs, detect errors, file fixes |
| **Deploy watchdog** | 5–10 min | Check deploy status, rollback if failed |
| **Metric reporting** | 60 min | Gather metrics, write to report file |
| **Dependency audit** | 120 min | Check outdated packages, research upgrades |
| **Health check** | 30 min | Ping services, verify uptime, report status |
| **Reminder nudge** | 60 min | Read scratchpad, reorient, keep going |

### When to choose Interval over ChronoLoop

| Use Interval when... | Use ChronoLoop when... |
|---|---|
| You want periodic check-ins | You want continuous autonomous work |
| Each fire is independent | Each fire continues from the last |
| The agent should inspect and report | The agent should make progress |
| You're monitoring something | You're building something |
| The interval matters (precision) | The duration matters (total time) |

---

## Best practices 🧠💎🎯

### 1. Match interval to task granularity

| Task | Recommended interval | Why |
|---|---|---|
| Log monitoring | 5–15 min | Fast detection of errors |
| Build health | 15–30 min | Tests take time to run |
| PR babysitting | 10–30 min | Reviews need thought |
| Dependency audit | 2–6 hours | Research takes time |
| Metric reporting | 60 min | Data accumulates slowly |

Set the interval long enough that the agent can complete its inspection before the next fire, but short enough that issues don't linger. If the agent is consistently interrupted mid-task, increase the interval.

### 2. Each message should be self-contained

Unlike ChronoLoop, interval fires don't share context. The agent won't remember what it did last fire. Design each message to work independently:

```
✅ Good:  /interval 15 "Check `tail -20 server.log` for errors. If found, file them."
❌ Bad:   /interval 15 "Continue from where you left off."  ← there's no "where"
```

If you need cross-fire memory, use a file:

```
/interval 30 "Read `cat INTERVAL_STATE.md`. Check the build. Update the file with findings."
```

### 3. Use backtick commands for self-contained state

Since interval fires are independent, backtick commands are your best tool for injecting fresh context:

```
/interval 15 "Check `gh pr list --json number,title,createdAt --jq '.[] | select(.createdAt | fromdateiso8601 < now - 7200) | .title'` for stale PRs and nudge them."
```

The command output is captured at fire time, so the agent always acts on current data.

### 4. Keep actions narrow and decisive

Interval should not initiate open-ended work. Each fire should:
1. Check a condition
2. Decide: act or skip
3. If acting, do the smallest useful thing
4. Report

Open-ended work belongs in ChronoLoop. Interval is for watchful waiting.

### 5. Know when to stop

Interval runs forever until you call `/interval stop`. Set a reminder for yourself if you only want it for a limited period. Or chain it with your own external time — start it, work, stop it when done.

---

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
