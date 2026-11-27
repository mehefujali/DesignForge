import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  validateResponsiveLayout,
  compareScreenshots,
  createDesignReport,
  generateRefinementTasks,
} from "../visual-audit.js";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function makeMinimalPng(width: number, height: number): Buffer {
  const buf = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(buf, 0);
  buf.writeUInt32BE(13, 8);
  buf.write("IHDR", 12, "ascii");
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

describe("Phase 6 Visual QA & Refinement Engine", () => {
  it("flags horizontal overflow, small mobile touch targets, and missing breakpoints", () => {
    const res = validateResponsiveLayout({
      measurements: [
        { widthPx: 1440, scrollWidthPx: 1440, bodyFontSizePx: 16, minTouchTargetPx: 44, consoleErrors: [], failedRequests: [] },
        { widthPx: 390, scrollWidthPx: 430, bodyFontSizePx: 15, minTouchTargetPx: 32, consoleErrors: [], failedRequests: [] },
      ],
    });
    assert.equal(res.passed, false);
    assert.ok(res.missingRequiredWidths.includes(360));
    assert.ok(res.findings.some((f) => f.affectedElement === "viewport-390px-overflow"));
    assert.ok(res.findings.some((f) => f.affectedElement === "touch-targets-390px"));
  });

  it("compares PNG dimensions and generates structured report + refinement tasks", () => {
    const dir = mkdtempSync(join(tmpdir(), "forma-qa-"));
    tempDirs.push(dir);
    const before = join(dir, "before.png");
    const after = join(dir, "after.png");
    writeFileSync(before, makeMinimalPng(1440, 900));
    writeFileSync(after, makeMinimalPng(1440, 900));

    const cmp = compareScreenshots({ beforePath: before, afterPath: after });
    assert.equal(cmp.comparable, true);
    assert.equal(cmp.identicalBytes, true);
    assert.deepEqual(cmp.beforeDimensions, { width: 1440, height: 900 });

    const findings = [
      {
        severity: "critical" as const,
        affectedElement: "hero-overflow",
        explanation: "Overflows at 390px",
        recommendation: "Set max-w-full on hero container",
      },
    ];
    const report = createDesignReport({
      projectName: "LedgerCore",
      pagesInspected: ["/"],
      viewportsTested: [1440, 390],
      totalScore: 84,
      findings,
      verifiedCorrections: [],
      projectRoot: dir,
    });
    assert.ok(report.markdown.includes("DESIGN AUDIT REPORT"));
    assert.ok(report.savedTo);

    const tasks = generateRefinementTasks({ findings });
    assert.equal(tasks.taskCount, 1);
    assert.equal(tasks.tasks[0].id, "REFINE-1");
  });
});
