import { z } from "zod";
import { readMemory, type MemoryException } from "./memory.js";

export interface AuditFinding {
  severity: "critical" | "major" | "minor";
  affectedElement: string;
  explanation: string;
  recommendation: string;
}

export interface ScoreDimension {
  category: string;
  weight: number;
  score: number;
  rationale: string;
}

export const AnalyzeRepetitionSchema = z.object({
  html: z.string().min(1),
});

export function analyzeDesignRepetition(input: z.infer<typeof AnalyzeRepetitionSchema>): {
  sectionCount: number;
  threeColumnGridCount: number;
  repeatedBadgeCompositions: number;
  findings: AuditFinding[];
} {
  const html = input.html;
  const sections = html.match(/<section\b[\s\S]*?<\/section>/gi) || [];
  const threeColGrids = (html.match(/grid-cols-3|repeat\(\s*3\s*,/gi) || []).length;
  const badgeCompositions = (
    html.match(/<(span|div)[^>]*class=["'][^"']*(rounded-full|pill|badge)[^"']*["'][^>]*>[\s\S]{0,160}?<h[1-3]/gi) || []
  ).length;

  const findings: AuditFinding[] = [];

  if (threeColGrids >= 2) {
    findings.push({
      severity: "major",
      affectedElement: "section > .grid-cols-3",
      explanation: `Detected ${threeColGrids} three-column feature/card grids on the same page.`,
      recommendation: "Vary section rhythm using asymmetric splits, editorial lists, or structured tables.",
    });
  }

  if (badgeCompositions >= 2) {
    findings.push({
      severity: "major",
      affectedElement: "badge-above-heading",
      explanation: `Repeated pill/badge-above-heading composition (${badgeCompositions} occurrences).`,
      recommendation: "Remove decorative eyebrow pills and rely on typographic hierarchy.",
    });
  }

  if (sections.length >= 4) {
    const centeredSections = sections.filter((s) => /text-center/i.test(s)).length;
    if (centeredSections >= sections.length - 1) {
      findings.push({
        severity: "major",
        affectedElement: "section.text-center",
        explanation: `${centeredSections} of ${sections.length} sections use centered alignment, flattening visual hierarchy.`,
        recommendation: "Introduce left-aligned editorial columns or asymmetric grid anchors.",
      });
    }
  }

  return {
    sectionCount: sections.length,
    threeColumnGridCount: threeColGrids,
    repeatedBadgeCompositions: badgeCompositions,
    findings,
  };
}

export const AuditVisualPatternsSchema = z.object({
  html: z.string().min(1),
  css: z.string().default(""),
  projectRoot: z.string().optional(),
});

export function auditVisualPatterns(input: z.infer<typeof AuditVisualPatternsSchema>): {
  totalScore: number;
  breakdown: ScoreDimension[];
  findings: AuditFinding[];
  disclaimer: string;
} {
  const combined = `${input.html}\n${input.css}`;
  const exceptions = input.projectRoot
    ? readMemory<MemoryException[]>(input.projectRoot, "exceptions", []).map((e) => e.pattern)
    : [];
  const isExempt = (pattern: string) => exceptions.includes(pattern);

  const findings: AuditFinding[] = [];

  if (
    !isExempt("purple-blue-gradient") &&
    (/from-(purple|violet|indigo)-\d+[\s\S]{0,80}to-(blue|cyan|indigo)-\d+/i.test(combined) ||
      /linear-gradient\([^)]*(#6366f1|#8b5cf6|#a855f7|purple|violet)[^)]*(#3b82f6|#2563eb|blue)/i.test(combined))
  ) {
    findings.push({
      severity: "critical",
      affectedElement: "background-gradient",
      explanation: "Generic purple-to-blue gradient background detected.",
      recommendation: "Use an industry-grounded solid surface or neutral tonal shift from Design DNA.",
    });
  }

  if (
    !isExempt("glowing-blobs") &&
    (/blur-(2xl|3xl)/i.test(combined) && /rounded-full/i.test(combined))
  ) {
    findings.push({
      severity: "major",
      affectedElement: ".blur-3xl.rounded-full",
      explanation: "Decorative blurred/glowing circular blob detected behind content.",
      recommendation: "Remove ambient decorative blobs and create depth through spacing and typography.",
    });
  }

  if (
    !isExempt("pill-dot-tagline") &&
    /rounded-full[\s\S]{0,160}?(animate-ping|animate-pulse|w-2\s+h-2|rounded-full[^>]*>[\s]*<\/span>)[\s\S]{0,200}?<h1/i.test(
      input.html
    )
  ) {
    findings.push({
      severity: "critical",
      affectedElement: "hero > .rounded-full + h1",
      explanation: "Detected generic pill-shaped tagline with decorative status dot above hero H1.",
      recommendation: "Remove the pill-and-dot cliché; open directly with a strong headline or editorial lead.",
    });
  }

  if (/bg-clip-text[\s\S]{0,60}text-transparent/i.test(combined)) {
    findings.push({
      severity: "minor",
      affectedElement: ".bg-clip-text.text-transparent",
      explanation: "Gradient-clipped heading text detected.",
      recommendation: "Use solid high-contrast ink colors for primary headings to maximize legibility.",
    });
  }

  const glassCount = (combined.match(/backdrop-blur/gi) || []).length;
  if (glassCount >= 3) {
    findings.push({
      severity: "minor",
      affectedElement: ".backdrop-blur",
      explanation: `Glassmorphism used ${glassCount} times as a default surface treatment.`,
      recommendation: "Reserve translucency for genuine overlays/modals; use crisp solid surfaces for cards.",
    });
  }

  const repetition = analyzeDesignRepetition({ html: input.html });
  findings.push(...repetition.findings);

  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const majorCount = findings.filter((f) => f.severity === "major").length;
  const minorCount = findings.filter((f) => f.severity === "minor").length;

  const hasH1 = /<h1\b/i.test(input.html);
  const hasMain = /<main\b/i.test(input.html);
  const hasNav = /<nav\b/i.test(input.html);
  const hasViewportMeta = /<meta[^>]+name=["']viewport["']/i.test(input.html);

  const breakdown: ScoreDimension[] = [
    {
      category: "Visual hierarchy",
      weight: 15,
      score: Math.max(0, 15 - (hasH1 ? 0 : 6) - criticalCount * 3),
      rationale: hasH1 ? "Primary H1 landmark present." : "Missing primary H1 landmark.",
    },
    {
      category: "Typography",
      weight: 15,
      score: Math.max(0, 15 - (/font-family:\s*['"]?Inter/i.test(combined) ? 5 : 0) - minorCount * 2),
      rationale: /font-family:\s*['"]?Inter/i.test(combined)
        ? "Defaults to Inter without explicit project rationale."
        : "No default Inter override detected.",
    },
    {
      category: "Layout and spacing",
      weight: 15,
      score: Math.max(0, 15 - repetition.threeColumnGridCount * 3 - (repetition.sectionCount === 0 ? 4 : 0)),
      rationale: `Evaluated ${repetition.sectionCount} sections and ${repetition.threeColumnGridCount} 3-col grids.`,
    },
    {
      category: "Brand differentiation",
      weight: 15,
      score: Math.max(0, 15 - criticalCount * 5 - majorCount * 2),
      rationale:
        criticalCount === 0 && majorCount === 0
          ? "No generic AI visual clichés detected."
          : `Penalized for ${criticalCount} critical and ${majorCount} major generic patterns.`,
    },
    {
      category: "Visual consistency",
      weight: 10,
      score: Math.max(0, 10 - minorCount * 2 - (glassCount >= 3 ? 2 : 0)),
      rationale: "Assessed surface, shadow, and glassmorphism consistency.",
    },
    {
      category: "Responsive quality",
      weight: 10,
      score: hasViewportMeta ? 10 : 5,
      rationale: hasViewportMeta
        ? "Viewport meta present; run validate_responsive_layout for full breakpoint verification."
        : "Missing viewport meta tag.",
    },
    {
      category: "Iconography",
      weight: 5,
      score: 5,
      rationale: "Baseline; run audit_icon_usage for SVG and emoji checks.",
    },
    {
      category: "Accessibility",
      weight: 5,
      score: (hasMain ? 2.5 : 0) + (hasNav ? 2.5 : 0),
      rationale: `Landmarks: main=${hasMain}, nav=${hasNav}.`,
    },
    {
      category: "Interaction quality",
      weight: 5,
      score: /prefers-reduced-motion/i.test(combined) ? 5 : 3.5,
      rationale: /prefers-reduced-motion/i.test(combined)
        ? "Includes prefers-reduced-motion handling."
        : "No explicit prefers-reduced-motion rule found.",
    },
    {
      category: "Content presentation",
      weight: 5,
      score: Math.max(0, 5 - repetition.repeatedBadgeCompositions * 2),
      rationale: "Evaluated heading/badge clutter.",
    },
  ];

  const totalScore = Math.round(breakdown.reduce((acc, d) => acc + d.score, 0) * 10) / 10;

  return {
    totalScore,
    breakdown,
    findings,
    disclaimer:
      "Internal heuristic evaluating observable design quality, structural variety, and pattern discipline — not a detector of human vs. AI authorship.",
  };
}
