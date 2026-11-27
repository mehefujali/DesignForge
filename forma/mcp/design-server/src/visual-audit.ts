import { existsSync, readFileSync } from "node:fs";
import { z } from "zod";
import { readMemory, writeMemory } from "./memory.js";
import type { AuditFinding } from "./pattern-audit.js";

export const REQUIRED_VIEWPORTS = [1440, 1280, 1024, 768, 390, 360] as const;

export const ViewportMeasurementSchema = z.object({
  widthPx: z.number().int().positive(),
  scrollWidthPx: z.number().int().nonnegative(),
  bodyFontSizePx: z.number().positive().default(16),
  minTouchTargetPx: z.number().positive().default(44),
  consoleErrors: z.array(z.string()).default([]),
  failedRequests: z.array(z.string()).default([]),
});

export const ValidateResponsiveSchema = z.object({
  measurements: z.array(ViewportMeasurementSchema).min(1),
});

export function validateResponsiveLayout(input: z.infer<typeof ValidateResponsiveSchema>): {
  passed: boolean;
  testedWidths: number[];
  missingRequiredWidths: number[];
  findings: AuditFinding[];
} {
  const findings: AuditFinding[] = [];
  const testedWidths = input.measurements.map((m) => m.widthPx);
  const missingRequiredWidths = REQUIRED_VIEWPORTS.filter((w) => !testedWidths.includes(w));

  if (missingRequiredWidths.length > 0) {
    findings.push({
      severity: "minor",
      affectedElement: "viewport-coverage",
      explanation: `Missing required FORMA breakpoints: ${missingRequiredWidths.join("px, ")}px.`,
      recommendation: "Inspect all 6 breakpoints (1440, 1280, 1024, 768, 390, 360) via browser automation.",
    });
  }

  for (const m of input.measurements) {
    if (m.scrollWidthPx > m.widthPx) {
      findings.push({
        severity: "critical",
        affectedElement: `viewport-${m.widthPx}px-overflow`,
        explanation: `Horizontal overflow at ${m.widthPx}px (scrollWidth=${m.scrollWidthPx}px > viewport=${m.widthPx}px).`,
        recommendation: "Fix overflowing container widths, tables, or grid tracks at this breakpoint.",
      });
    }
    if (m.widthPx <= 768 && m.minTouchTargetPx < 44) {
      findings.push({
        severity: "major",
        affectedElement: `touch-targets-${m.widthPx}px`,
        explanation: `Minimum interactive target is ${m.minTouchTargetPx}px (< 44px) at ${m.widthPx}px.`,
        recommendation: "Increase button/link hit area to at least 44x44px on mobile and tablet.",
      });
    }
    if (m.bodyFontSizePx < 14) {
      findings.push({
        severity: "major",
        affectedElement: `body-font-${m.widthPx}px`,
        explanation: `Body font size ${m.bodyFontSizePx}px is below 14px readability floor.`,
        recommendation: "Maintain >= 15px–16px body font size across viewports.",
      });
    }
    if (m.consoleErrors.length > 0) {
      findings.push({
        severity: "critical",
        affectedElement: `console-${m.widthPx}px`,
        explanation: `${m.consoleErrors.length} browser console error(s) at ${m.widthPx}px: ${m.consoleErrors[0]}`,
        recommendation: "Resolve runtime console errors before marking QA complete.",
      });
    }
    if (m.failedRequests.length > 0) {
      findings.push({
        severity: "major",
        affectedElement: `network-${m.widthPx}px`,
        explanation: `${m.failedRequests.length} failed network request(s) at ${m.widthPx}px: ${m.failedRequests[0]}`,
        recommendation: "Fix missing assets, fonts, or API endpoints.",
      });
    }
  }

  return {
    passed: findings.filter((f) => f.severity === "critical").length === 0,
    testedWidths,
    missingRequiredWidths,
    findings,
  };
}

function readPngDimensions(buffer: Buffer): { width: number; height: number } | null {
  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(pngSig)) {
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

export const CompareScreenshotsSchema = z.object({
  beforePath: z.string().min(1),
  afterPath: z.string().min(1),
});

export function compareScreenshots(input: z.infer<typeof CompareScreenshotsSchema>): {
  comparable: boolean;
  identicalBytes: boolean;
  beforeDimensions: { width: number; height: number } | null;
  afterDimensions: { width: number; height: number } | null;
  byteDeltaRatio: number;
  summary: string;
} {
  if (!existsSync(input.beforePath) || !existsSync(input.afterPath)) {
    return {
      comparable: false,
      identicalBytes: false,
      beforeDimensions: null,
      afterDimensions: null,
      byteDeltaRatio: 1,
      summary: "One or both screenshot files do not exist.",
    };
  }

  const bufA = readFileSync(input.beforePath);
  const bufB = readFileSync(input.afterPath);
  const dimA = readPngDimensions(bufA);
  const dimB = readPngDimensions(bufB);
  const identicalBytes = bufA.equals(bufB);
  const maxLen = Math.max(bufA.length, bufB.length, 1);
  const lenDiff = Math.abs(bufA.length - bufB.length);
  const byteDeltaRatio = identicalBytes ? 0 : Math.round((lenDiff / maxLen) * 1000) / 1000 || 0.01;

  const dimsMatch =
    dimA && dimB ? dimA.width === dimB.width && dimA.height === dimB.height : false;

  return {
    comparable: true,
    identicalBytes,
    beforeDimensions: dimA,
    afterDimensions: dimB,
    byteDeltaRatio,
    summary: identicalBytes
      ? "Screenshots are byte-identical."
      : dimsMatch
        ? `Screenshots share dimensions (${dimA!.width}x${dimA!.height}) and differ in rendered content.`
        : "Screenshots differ in dimensions or file format.",
  };
}

const FindingInputSchema = z.object({
  severity: z.enum(["critical", "major", "minor"]),
  affectedElement: z.string(),
  explanation: z.string(),
  recommendation: z.string(),
});

export const CreateDesignReportSchema = z.object({
  projectName: z.string().min(1),
  pagesInspected: z.array(z.string()).default(["/"]),
  viewportsTested: z.array(z.number().int()).default([]),
  totalScore: z.number().min(0).max(100),
  findings: z.array(FindingInputSchema).default([]),
  verifiedCorrections: z.array(z.string()).default([]),
  projectRoot: z.string().optional(),
});

export function createDesignReport(input: z.infer<typeof CreateDesignReportSchema>): {
  markdown: string;
  savedTo?: string;
} {
  const critical = input.findings.filter((f) => f.severity === "critical");
  const major = input.findings.filter((f) => f.severity === "major");
  const minor = input.findings.filter((f) => f.severity === "minor");

  const fmtList = (items: AuditFinding[]) =>
    items.length === 0
      ? "- None"
      : items.map((f) => `- [${f.affectedElement}] ${f.explanation}`).join("\n");

  const recs =
    input.findings.length === 0
      ? "- None"
      : input.findings.map((f) => `- (${f.severity}) ${f.recommendation}`).join("\n");

  const verified =
    input.verifiedCorrections.length === 0
      ? "- None recorded yet"
      : input.verifiedCorrections.map((v) => `- ${v}`).join("\n");

  const markdown = [
    "DESIGN AUDIT REPORT",
    "",
    `Project: ${input.projectName}`,
    `Pages inspected: ${input.pagesInspected.join(", ")}`,
    `Viewports tested: ${input.viewportsTested.length > 0 ? input.viewportsTested.map((v) => `${v}px`).join(", ") : "None recorded"}`,
    `Heuristic Quality Score: ${input.totalScore}/100`,
    "",
    "Critical issues:",
    fmtList(critical),
    "",
    "Major issues:",
    fmtList(major),
    "",
    "Minor issues:",
    fmtList(minor),
    "",
    "Recommended corrections:",
    recs,
    "",
    "Verified corrections:",
    verified,
  ].join("\n");

  let savedTo: string | undefined;
  if (input.projectRoot) {
    const history = readMemory<Array<{ createdAt: string; totalScore: number; findingCount: number }>>(
      input.projectRoot,
      "audit-history",
      []
    );
    history.push({
      createdAt: new Date().toISOString(),
      totalScore: input.totalScore,
      findingCount: input.findings.length,
    });
    savedTo = writeMemory(input.projectRoot, "audit-history", history);
  }

  return { markdown, savedTo };
}

export const GenerateRefinementTasksSchema = z.object({
  findings: z.array(FindingInputSchema),
});

export function generateRefinementTasks(input: z.infer<typeof GenerateRefinementTasksSchema>) {
  const priorityOrder = { critical: 1, major: 2, minor: 3 };
  const sorted = [...input.findings].sort(
    (a, b) => priorityOrder[a.severity] - priorityOrder[b.severity]
  );

  return {
    taskCount: sorted.length,
    tasks: sorted.map((f, idx) => ({
      id: `REFINE-${idx + 1}`,
      priority: f.severity,
      target: f.affectedElement,
      problem: f.explanation,
      action: f.recommendation,
      verificationStep: "Reload local preview, capture updated screenshot, and confirm issue no longer reproduces.",
    })),
  };
}
