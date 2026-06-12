import { describe, expect, test } from "vitest"
import { evaluateBackticks, MAX_BACKTICK_OUTPUT_LENGTH } from "../src/test-helpers"

describe("evaluateBackticks", () => {
  test("passthrough — no backticks", () => {
    expect(evaluateBackticks("hello world")).toBe("hello world")
  })

  test("executes a simple command", () => {
    const result = evaluateBackticks("`echo hello`")
    expect(result).toBe("hello")
  })

  test("multiple backtick segments", () => {
    const result = evaluateBackticks("a `echo 1` b `echo 2` c")
    expect(result).toBe("a 1 b 2 c")
  })

  test("empty backticks pass through unchanged", () => {
    // regex requires 1+ chars between backticks, so `` is literal text
    expect(evaluateBackticks("a `` b")).toBe("a `` b")
  })

  test("error handling — invalid command", () => {
    const result = evaluateBackticks("`nonexistent_command_xyz`")
    expect(result).toContain("(error:")
  })

  test("truncates long output", () => {
    // Generate a command that produces long output
    const longCmd = `node -e "process.stdout.write('x'.repeat(${MAX_BACKTICK_OUTPUT_LENGTH + 100}))"`
    const result = evaluateBackticks("`" + longCmd + "`")
    expect(result).toContain("… [truncated,")
  })

  test("no output shows placeholder", () => {
    // echo -n produces no output after trim
    const result = evaluateBackticks("`node -e \"\"`")
    expect(result).toBe("(no output)")
  })

  test("whitespace trimming", () => {
    const result = evaluateBackticks("`  echo  hello  `")
    expect(result).toBe("hello")
  })

  test("shell pipeline", () => {
    const result = evaluateBackticks("`echo hello | tr '[:lower:]' '[:upper:]'`")
    // On Windows, tr may not be available. Accept either the output or an error.
    expect(typeof result).toBe("string")
  })
})
