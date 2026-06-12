# Changelog

All notable changes to **opencode-interval** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
