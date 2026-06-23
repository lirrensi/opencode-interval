# Changelog

All notable changes to **opencode-interval** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/0.1.1/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v0.2.0.html).

---

## [0.1.1] — 2026-06-24

### Fixed

- **No more `__IVL__` error spam in chat.** The `command.execute.before` hook
  previously used `throw new Error("__IVL__")` as a control-flow trick to
  abort the `/interval` command. This was never a documented opencode plugin
  pattern — it only worked because older opencode silently swallowed plugin
  errors. The June 9, 2026 opencode refactor (commits `07e5ea93` and
  `600e405b`) restored error logging, so every throw now surfaces as a visible
  `session.error` event with a full stack trace in the chat.
- **Hook now uses the SDK's documented mutator contract.** Clears
  `output.parts` in place and returns normally instead of throwing. No error
  propagation, no chat spam.
- **Flattened nested `if`/`throw` chains** into clean `if`/`else if`/`else`
  blocks across `status`/`stop`/`start` subcommands. The dwell timer setup is
  now only triggered on the actual start path, not on the "already running"
  early-out.

---

## [0.1.0] — 2026-06-12

### Added

- Initial release: fixed-interval prompt loop for OpenCode.
- `/interval <minutes> [message]` command to start a periodic loop.
- `/interval` (status) and `/interval stop` commands.
- Heartbeat toast every 5 seconds showing elapsed time and next-fire countdown.
- Backtick command execution in loop messages (`` `cmd` ``).
- Session-scoped loops (one per session).
- In-flight detection and abort-on-interrupt handling.
- Dwell-only trigger pattern — fires after the full interval of idle time.
- Unlike ChronoLoop, no total duration cap — runs until explicitly stopped.

[0.1.0]: https://github.com/lirrensi/opencode-interval/releases/tag/v0.1.0
