import { describe, expect, test } from "vitest"
import { parseIntervalCommand, parseDurationMs, DEFAULT_MESSAGE } from "../src/test-helpers"

describe("parseDurationMs", () => {
  test("bare number = minutes", () => {
    expect(parseDurationMs("30")).toBe(30 * 60_000)
    expect(parseDurationMs("1")).toBe(60_000)
    expect(parseDurationMs("120")).toBe(120 * 60_000)
  })

  test("explicit minutes", () => {
    expect(parseDurationMs("30m")).toBe(30 * 60_000)
    expect(parseDurationMs("1m")).toBe(60_000)
    expect(parseDurationMs("5M")).toBe(5 * 60_000) // case insensitive
  })

  test("hours", () => {
    expect(parseDurationMs("1h")).toBe(3_600_000)
    expect(parseDurationMs("2h")).toBe(7_200_000)
    expect(parseDurationMs("1H")).toBe(3_600_000)
  })

  test("seconds", () => {
    expect(parseDurationMs("30s")).toBe(30_000)
    expect(parseDurationMs("90s")).toBe(90_000)
    expect(parseDurationMs("5S")).toBe(5_000)
  })

  test("zero returns null", () => {
    expect(parseDurationMs("0")).toBeNull()
    expect(parseDurationMs("0m")).toBeNull()
    expect(parseDurationMs("0h")).toBeNull()
    expect(parseDurationMs("0s")).toBeNull()
  })

  test("invalid returns null", () => {
    expect(parseDurationMs("")).toBeNull()
    expect(parseDurationMs("abc")).toBeNull()
    expect(parseDurationMs("-5")).toBeNull()
    expect(parseDurationMs("5x")).toBeNull()
    expect(parseDurationMs("5mm")).toBeNull()
    expect(parseDurationMs("1.5h")).toBeNull()
  })

  test("whitespace is trimmed", () => {
    expect(parseDurationMs(" 30m ")).toBe(30 * 60_000)
    expect(parseDurationMs("  1h  ")).toBe(3_600_000)
  })
})

describe("parseIntervalCommand", () => {
  test("empty input returns status", () => {
    expect(parseIntervalCommand("")).toEqual({ kind: "status" })
    expect(parseIntervalCommand("   ")).toEqual({ kind: "status" })
  })

  test("'stop' returns stop command", () => {
    expect(parseIntervalCommand("stop")).toEqual({ kind: "stop" })
    expect(parseIntervalCommand(" STOP ")).toEqual({ kind: "stop" })
  })

  test("bare number starts interval (backward compat)", () => {
    const result = parseIntervalCommand("30")
    expect(result).toEqual({
      kind: "start",
      minutes: 30,
      message: DEFAULT_MESSAGE,
    })
  })

  test("explicit minutes suffix", () => {
    const result = parseIntervalCommand("45m")
    expect(result).toEqual({ kind: "start", minutes: 45, message: DEFAULT_MESSAGE })
  })

  test("hours suffix", () => {
    const result = parseIntervalCommand("1h")
    expect(result).toEqual({ kind: "start", minutes: 60, message: DEFAULT_MESSAGE })
  })

  test("seconds suffix", () => {
    const result = parseIntervalCommand("90s")
    expect(result).toEqual({ kind: "start", minutes: 2, message: DEFAULT_MESSAGE })
    // 90s = 1.5 min, rounds to 2
  })

  test("seconds suffix with message", () => {
    const result = parseIntervalCommand('90s "quick check"')
    expect(result).toEqual({ kind: "start", minutes: 2, message: "quick check" })
  })

  test("number with quoted message", () => {
    const result = parseIntervalCommand('30 "ping me every half hour"')
    expect(result).toEqual({
      kind: "start",
      minutes: 30,
      message: "ping me every half hour",
    })
  })

  test("number with single-quoted message", () => {
    const result = parseIntervalCommand("30 'ping me'")
    expect(result).toEqual({
      kind: "start",
      minutes: 30,
      message: "ping me",
    })
  })

  test("number with unquoted message", () => {
    const result = parseIntervalCommand("15 check on progress")
    expect(result).toEqual({
      kind: "start",
      minutes: 15,
      message: "check on progress",
    })
  })

  test("hours with message", () => {
    const result = parseIntervalCommand("2h review the entire codebase")
    expect(result).toEqual({
      kind: "start",
      minutes: 120,
      message: "review the entire codebase",
    })
  })

  test("small numbers work", () => {
    const result = parseIntervalCommand("5")
    expect(result).toEqual({
      kind: "start",
      minutes: 5,
      message: DEFAULT_MESSAGE,
    })
  })

  test("zero or negative returns status", () => {
    expect(parseIntervalCommand("0")).toEqual({ kind: "status" })
    expect(parseIntervalCommand("-5")).toEqual({ kind: "status" })
    expect(parseIntervalCommand("0m")).toEqual({ kind: "status" })
    expect(parseIntervalCommand("0h")).toEqual({ kind: "status" })
  })

  test("garbage input returns status", () => {
    expect(parseIntervalCommand("hello world")).toEqual({ kind: "status" })
    expect(parseIntervalCommand("5x")).toEqual({ kind: "status" })
  })

  test("lone quote treated as literal message", () => {
    const result = parseIntervalCommand('30 "')
    expect(result.kind).toBe("start")
    if (result.kind === "start") {
      expect(result.minutes).toBe(30)
      expect(result.message).toBe('"')
    }
  })
})
