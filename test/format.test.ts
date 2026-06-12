import { describe, expect, test } from "vitest"
import {
  formatDuration,
  formatIntervalSummary,
} from "../src/test-helpers"

import type { IntervalState } from "../src/test-helpers"

describe("formatDuration", () => {
  test.each([
    [0, "0s"],
    [1_000, "1s"],
    [59_000, "59s"],
    [60_000, "1m"],
    [30 * 60_000, "30m"],
    [90 * 60_000, "1h 30m"],
    [2 * 60 * 60_000, "2h"],
    [23 * 60 * 60_000 + 59 * 60_000, "23h 59m"],
    [24 * 60 * 60_000, "24h"],
  ])("formats %d ms", (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected)
  })
})

describe("formatIntervalSummary", () => {
  test("shows interval info", () => {
    const state: IntervalState = {
      startTime: Date.now() - 5 * 60 * 1000, // 5 min ago
      intervalMs: 30 * 60 * 1000, // every 30 min
      message: "check progress",
      active: true,
      dwellTimer: null,
    }

    const summary = formatIntervalSummary(state)
    expect(summary).toContain("Interval")
    expect(summary).toContain("30m")
    expect(summary).toContain("Elapsed:")
    expect(summary).toContain("check progress")
  })

  test("truncates long messages", () => {
    const state: IntervalState = {
      startTime: Date.now(),
      intervalMs: 60 * 1000,
      message: "a".repeat(100),
      active: true,
      dwellTimer: null,
    }

    const summary = formatIntervalSummary(state)
    expect(summary).toContain("…")
  })
})
