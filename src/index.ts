import type { Plugin } from "@opencode-ai/plugin"
import { execSync } from "child_process"

// ═══════════════════════════════════════════
//  Interval — pnpm run deploy to install.
// ═══════════════════════════════════════════

// ── internal types ──

type IntervalState = {
  startTime: number; intervalMs: number; message: string; active: boolean
  dwellTimer: ReturnType<typeof setTimeout> | null
}

// ── internal helpers ──

const BACKTICK_TIMEOUT_MS = 300_000

const DEFAULT_COMMAND_DESCRIPTION = "fire a prompt on a fixed interval — supports 30, 30m, 1h, 90s"
const NO_INTERVAL = "No active interval.\nUsage: /interval <duration> [message]  (bare=mins, 30m, 1h, 90s)"
const MSG_STOPPED = "Interval stopped."
const MSG_NO_INTERVAL_TO_STOP = "No active interval to stop."

function parseDurationMs(raw: string): number | null {
  const m = /^(\d+)([smh]?)$/i.exec(raw.trim())
  if (!m) return null
  const v = parseInt(m[1]!, 10)
  if (v <= 0) return null
  const u = (m[2] || "m").toLowerCase()
  if (u === "s") return v * 1000
  if (u === "m") return v * 60_000
  if (u === "h") return v * 3_600_000
  return null
}

function parseCommand(input: string): { kind: "start"; minutes: number; message: string } | { kind: "stop" } | { kind: "status" } {
  const text = input.trim()
  if (!text) return { kind: "status" }
  if (text.toLowerCase() === "stop") return { kind: "stop" }
  const match = /^(\d+[smh]?)(?:\s+(.+))?$/si.exec(text)
  if (!match) return { kind: "status" }
  const durMs = parseDurationMs(match[1]!)
  if (durMs === null) return { kind: "status" }
  const raw = match[2]?.trim() ?? ""
  const msg = raw.length >= 2 && ((raw.startsWith('"')&&raw.endsWith('"'))||(raw.startsWith("'")&&raw.endsWith("'")))
    ? raw.slice(1,-1).trim() : raw
  return { kind: "start", minutes: Math.round(durMs / 60_000), message: msg || "Continue working autonomously." }
}

function fmt(ms: number): string {
  const s=Math.max(0,Math.round(ms/1000)),m=Math.floor(s/60),h=Math.floor(m/60)
  if(s<60)return`${s}s`;if(m<60)return`${m}m`;if(m%60===0)return`${h}h`;return`${h}h ${m%60}m`
}

function fmtSummary(st: IntervalState): string {
  const e = Date.now() - st.startTime
  return `Interval\nRunning — fires every ${fmt(st.intervalMs)}\nElapsed: ${fmt(e)}`
}

function evalBackticks(msg: string): string {
  return msg.replace(/`([^`]+)`/g, (_m: string, cmd: string) => {
    const c = cmd.trim(); if (!c) return ""
    try { const o = (execSync(c, { encoding: "utf-8", timeout: BACKTICK_TIMEOUT_MS, windowsHide: true, stdio: ["pipe","pipe","pipe"] }) as string).trim(); return o || "(no output)" }
    catch (e: any) { return `(error: ${e.message.split("\n")[0]})` }
  })
}

// ═══════════════════════════════════════════
//  Plugin — the ONLY export
// ═══════════════════════════════════════════

export const IntervalPlugin: Plugin = async ({ client }: any) => {
  let loop: IntervalState | null = null
  let isIdle = false
  let inFlight = false
  let dwellStartedAt = 0
  let hb: any = null

  const toast = (m: string, v = "info", d = 5000) =>
    client.tui.showToast({ body: { message: m, variant: v, duration: d } }).catch(() => {})

  const cancelDwell = () => { if (loop?.dwellTimer) { clearTimeout(loop.dwellTimer); loop.dwellTimer = null; dwellStartedAt = 0 } }

  const startDwell = () => {
    if (!loop?.active) return
    cancelDwell()
    dwellStartedAt = Date.now()
    loop.dwellTimer = setTimeout(() => {
      loop!.dwellTimer = null; dwellStartedAt = 0
      if (!loop?.active) return
      fire()
    }, loop.intervalMs)
  }

  const fire = async () => {
    if (inFlight || !loop) return; inFlight = true
    try {
      const msg = evalBackticks(loop.message)
      await client.tui.clearPrompt(); await client.tui.appendPrompt({ body: { text: msg } }); await client.tui.submitPrompt()
    } catch (e: any) { toast(`Interval fail: ${e.message}`, "error") }
    finally { inFlight = false }
  }

  const doStop = () => { cancelDwell(); loop = null; inFlight = false; refreshHb() }

  const refreshHb = () => {
    if (loop?.active && !hb) {
      hb = setInterval(() => {
        if (!loop?.active) return
        const elapsed = Date.now() - loop.startTime
        const dwellLeft = dwellStartedAt > 0 ? Math.round((loop.intervalMs - (Date.now() - dwellStartedAt)) / 1000) : 0
        const status = dwellStartedAt > 0
          ? `⏳ next fire in ${fmt(dwellLeft * 1000)}`
          : isIdle ? "🟢 idle — waiting" : "🔴 active — processing"
        toast(`Interval ${fmt(elapsed)} | ${status}`, "info", 4000)
      }, 5_000)
    } else if (!loop?.active && hb) { clearInterval(hb); hb = null }
  }

  return {
    config: async (cfg: any) => {
      cfg.command ??= {}
      cfg.command.interval = { template: "<duration> [message]", description: DEFAULT_COMMAND_DESCRIPTION }
    },
    event: async ({ event }: any) => {
      const t = event.type, p = event.properties || event.data || {}
      if (t === "message.updated") {
        if (p?.info?.role === "assistant") {
          isIdle = false; cancelDwell()
          if (p?.info?.error?.name === "MessageAbortedError" && loop?.active) { doStop(); toast("Interval stopped after interrupt", "info") }
        }
        return
      }
      if (t === "session.idle") { isIdle = true; inFlight = false; startDwell() }
      if (t === "session.created") {
        if (loop?.active) {
          const e = fmt(Date.now() - loop.startTime); doStop()
          toast(`Interval auto-stopped (new session) — ran ${e}`, "info")
        }
      }
    },
    "command.execute.before": async (input: any, output: any) => {
      if (input.command !== "interval") return
      const op = parseCommand((input.arguments ?? "").trim())
      if (op.kind === "status") {
        if (!loop?.active) { toast(NO_INTERVAL, "error") }
        else { toast(fmtSummary(loop)) }
      } else if (op.kind === "stop") {
        if (!loop?.active) { toast(MSG_NO_INTERVAL_TO_STOP, "error") }
        else { const e = fmt(Date.now() - loop.startTime); doStop(); toast(`${MSG_STOPPED} Elapsed: ${e}`) }
      } else {
        // start
        if (loop?.active) { toast(`Already running. /interval stop first.`, "error") }
        else {
          loop = { startTime: Date.now(), intervalMs: op.minutes * 60_000, message: op.message, active: true, dwellTimer: null }
          refreshHb()
          toast(`Interval armed — fires every ${fmt(op.minutes * 60_000)} after idle`, "info", 5000)
          startDwell()
        }
      }

      // Silently abort the original /interval command by clearing its output parts.
      // Throwing is NOT supported by the opencode plugin contract — recent opencode
      // versions (June 2026 refactor) propagate unhandled errors to the chat UI as a
      // visible error block, which is the "spam" this guard avoids.
      if (output && Array.isArray(output.parts)) {
        output.parts.length = 0
      }
    },
  }
}

export default IntervalPlugin
