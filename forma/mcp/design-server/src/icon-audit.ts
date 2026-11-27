import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { z } from "zod";
import type { AuditFinding } from "./pattern-audit.js";

export const AuditIconUsageSchema = z.object({
  html: z.string().min(1),
});

export function auditIconUsage(input: z.infer<typeof AuditIconUsageSchema>): {
  svgCount: number;
  emojiIconCount: number;
  detectedLibraries: string[];
  findings: AuditFinding[];
} {
  const html = input.html;
  const findings: AuditFinding[] = [];

  const svgs = html.match(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi) || [];
  const emojiMatches =
    html.match(/<(h[1-4]|button|a|li|span)[^>]*>\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || [];

  if (emojiMatches.length > 0) {
    findings.push({
      severity: "major",
      affectedElement: "emoji-as-ui-icon",
      explanation: `Found ${emojiMatches.length} emoji(s) used as UI icons inside headings/controls.`,
      recommendation: "Replace UI emojis with typography or project-specific custom SVGs.",
    });
  }

  const libraries: string[] = [];
  if (/class=["'][^"']*\blucide\b/i.test(html)) libraries.push("lucide");
  if (/class=["'][^"']*\bfa-(solid|regular|brands)\b/i.test(html)) libraries.push("font-awesome");
  if (/material-icons|material-symbols/i.test(html)) libraries.push("material-icons");
  if (/heroicon/i.test(html)) libraries.push("heroicons");

  if (libraries.length > 1) {
    findings.push({
      severity: "major",
      affectedElement: "icon-libraries",
      explanation: `Mixed icon libraries detected (${libraries.join(", ")}).`,
      recommendation: "Standardize on a single custom SVG icon system aligned with Design DNA.",
    });
  }

  const headingWithSvg = (html.match(/<h[1-4]\b[^>]*>[\s\S]{0,120}?<svg\b/gi) || []).length;
  if (headingWithSvg >= 2) {
    findings.push({
      severity: "minor",
      affectedElement: "h1-h4 > svg",
      explanation: `Icons placed beside ${headingWithSvg} headings.`,
      recommendation: "Remove decorative heading icons unless they communicate critical status or navigation.",
    });
  }

  let missingViewBox = 0;
  let hasFilters = 0;
  let missingA11y = 0;

  for (const svg of svgs) {
    const openTag = svg.match(/<svg\b[^>]*>/i)?.[0] ?? "";
    if (!/viewBox=/i.test(openTag)) missingViewBox++;
    if (/<filter\b|feDropShadow/i.test(svg)) hasFilters++;
    if (!/aria-hidden=|aria-label=|<title\b/i.test(svg)) missingA11y++;
  }

  if (missingViewBox > 0) {
    findings.push({
      severity: "major",
      affectedElement: "svg[viewBox]",
      explanation: `${missingViewBox} inline SVG(s) missing a viewBox attribute.`,
      recommendation: "Add consistent viewBox (e.g. '0 0 24 24') to every SVG icon.",
    });
  }
  if (hasFilters > 0) {
    findings.push({
      severity: "minor",
      affectedElement: "svg > filter",
      explanation: `${hasFilters} SVG(s) contain filter/drop-shadow effects.`,
      recommendation: "Remove SVG filter bloat and keep vector paths clean.",
    });
  }
  if (missingA11y > 0) {
    findings.push({
      severity: "minor",
      affectedElement: "svg[aria-*]",
      explanation: `${missingA11y} SVG(s) lack aria-hidden, aria-label, or <title>.`,
      recommendation: "Mark decorative icons aria-hidden='true' and functional icons with aria-label.",
    });
  }

  return {
    svgCount: svgs.length,
    emojiIconCount: emojiMatches.length,
    detectedLibraries: libraries,
    findings,
  };
}

export const GenerateCustomSvgSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Icon name must be lowercase alphanumeric with hyphens"),
  category: z.enum(["navigation", "actions", "status", "product", "custom"]).default("custom"),
  style: z
    .enum(["minimal-outline", "geometric-solid", "refined-duotone", "brand-custom"])
    .default("minimal-outline"),
  primitive: z
    .enum(["arrow-right", "check", "grid", "layers", "shield", "terminal", "spark-mark"])
    .default("arrow-right"),
  strokeWidth: z.number().min(1).max(2.5).default(1.75),
  ariaLabel: z.string().optional(),
  projectRoot: z.string().optional(),
});

const PRIMITIVE_PATHS: Record<string, string> = {
  "arrow-right": '<path d="M5 12h14M13 6l6 6-6 6" />',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" />',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />',
  layers: '<path d="M12 4L3.5 8.5 12 13l8.5-4.5L12 4Z" /><path d="M3.5 12.5L12 17l8.5-4.5" /><path d="M3.5 16.5L12 21l8.5-4.5" />',
  shield: '<path d="M12 3.5L5 6.5v5.2c0 4.3 3 7.9 7 8.8 4-.9 7-4.5 7-8.8V6.5l-7-3Z" />',
  terminal: '<rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M7.5 10l2.5 2-2.5 2M12 14h4.5" />',
  "spark-mark": '<path d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5" /><circle cx="12" cy="12" r="2" />',
};

export function generateCustomSvg(input: z.infer<typeof GenerateCustomSvgSchema>): {
  svg: string;
  savedTo?: string;
} {
  const body = PRIMITIVE_PATHS[input.primitive] ?? PRIMITIVE_PATHS["arrow-right"];
  const a11yAttr = input.ariaLabel
    ? `role="img" aria-label="${input.ariaLabel.replace(/"/g, "&quot;")}"`
    : 'aria-hidden="true"';

  const styleAttrs =
    input.style === "geometric-solid"
      ? 'fill="currentColor" stroke="none"'
      : `fill="none" stroke="currentColor" stroke-width="${input.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" ${styleAttrs} ${a11yAttr}>\n  ${body}\n</svg>\n`;

  let savedTo: string | undefined;
  if (input.projectRoot) {
    const absRoot = resolve(input.projectRoot);
    const iconsBase = resolve(absRoot, "src", "assets", "icons");
    const targetDir = resolve(iconsBase, input.category);
    const targetFile = resolve(targetDir, `${input.name}.svg`);
    if (!targetFile.startsWith(iconsBase + sep)) {
      throw new Error("Invalid icon output path");
    }
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }
    writeFileSync(targetFile, svg, "utf8");
    savedTo = targetFile;
  }

  return { svg, savedTo };
}
