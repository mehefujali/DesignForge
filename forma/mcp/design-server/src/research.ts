import { z } from "zod";
import { readMemory, writeMemory } from "./memory.js";

export const ProjectBriefSchema = z.object({
  productName: z.string().min(1, "productName is required"),
  businessCategory: z.string().min(1, "businessCategory is required"),
  industry: z.string().min(1, "industry is required"),
  targetAudience: z.string().min(1, "targetAudience is required"),
  websitePurpose: z.string().min(1, "websitePurpose is required"),
  primaryPersonas: z.array(z.string()).default([]),
  productPositioning: z.string().optional(),
  businessObjectives: z.array(z.string()).default([]),
  requiredPages: z.array(z.string()).default(["home"]),
  functionalRequirements: z.array(z.string()).default([]),
  brandPersonality: z.array(z.string()).default([]),
  competitivePositioning: z.string().optional(),
  projectRoot: z.string().optional(),
});

export type ProjectBriefInput = z.infer<typeof ProjectBriefSchema>;

export interface ProjectAnalysisResult {
  brief: ProjectBriefInput;
  missingFields: string[];
  clarifyingQuestions: string[];
  recommendedReferenceCategories: string[];
  targetReferenceCount: { min: number; max: number };
  readyForResearch: boolean;
  savedTo?: string;
}

export function analyzeProject(input: ProjectBriefInput): ProjectAnalysisResult {
  const missingFields: string[] = [];
  const clarifyingQuestions: string[] = [];

  if (input.primaryPersonas.length === 0) {
    missingFields.push("primaryPersonas");
    clarifyingQuestions.push("Who are the 1–3 primary user personas and what tasks do they need to complete?");
  }
  if (!input.productPositioning) {
    missingFields.push("productPositioning");
    clarifyingQuestions.push("What differentiates this product from established alternatives in the same market?");
  }
  if (input.businessObjectives.length === 0) {
    missingFields.push("businessObjectives");
    clarifyingQuestions.push("What is the primary conversion or business objective of the website?");
  }
  if (input.brandPersonality.length === 0) {
    missingFields.push("brandPersonality");
    clarifyingQuestions.push("Which 3–5 adjectives best describe the intended brand personality (e.g., clinical, editorial, authoritative)?");
  }

  const industryLower = input.industry.toLowerCase();
  const categoryLower = input.businessCategory.toLowerCase();

  const categories = new Set<string>([
    `${input.industry} platforms`,
    `${input.businessCategory} leaders`,
  ]);

  if (industryLower.includes("fin") || industryLower.includes("bank") || industryLower.includes("pay")) {
    categories.add("fintech infrastructure companies");
    categories.add("enterprise financial analytics platforms");
    categories.add("regulated banking software");
  } else if (industryLower.includes("edu") || industryLower.includes("school") || industryLower.includes("learn")) {
    categories.add("education technology platforms");
    categories.add("institution management software");
    categories.add("modern B2B SaaS products");
  } else if (categoryLower.includes("agency") || categoryLower.includes("studio") || industryLower.includes("design")) {
    categories.add("editorial digital agencies");
    categories.add("brand identity studios");
    categories.add("technology consultancies");
  } else {
    categories.add("production B2B/B2C web applications");
    categories.add("editorial product websites");
  }

  const targetReferenceCount =
    input.requiredPages.length >= 6 ? { min: 20, max: 25 } : { min: 15, max: 20 };

  let savedTo: string | undefined;
  if (input.projectRoot) {
    savedTo = writeMemory(input.projectRoot, "brief", input);
  }

  return {
    brief: input,
    missingFields,
    clarifyingQuestions,
    recommendedReferenceCategories: Array.from(categories),
    targetReferenceCount,
    readyForResearch: clarifyingQuestions.length <= 2,
    savedTo,
  };
}

/**
 * Validates that a URL is public HTTP/HTTPS and blocks private/loopback/metadata
 * addresses unless explicitly allowed for local test fixtures.
 */
export function validateReferenceUrl(rawUrl: string, allowLocal = false): URL {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Unsupported URL protocol: ${parsed.protocol}`);
  }
  if (!allowLocal) {
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host === "169.254.169.254" ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      throw new Error(`Blocked private or loopback host: ${host}`);
    }
  }
  return parsed;
}

export const InspectReferenceSchema = z.object({
  url: z.string().url(),
  industry: z.string().optional(),
  projectRoot: z.string().optional(),
  useCache: z.boolean().default(true),
  timeoutMs: z.number().int().min(1000).max(30000).default(10000),
  allowLocalForTest: z.boolean().default(false),
});

export interface ReferenceRecord {
  url: string;
  title: string;
  industry?: string;
  inspectedAt: string;
  accessible: boolean;
  statusCode?: number;
  error?: string;
  observations: {
    navLinkCount: number;
    headingHierarchy: string[];
    fontFamilies: string[];
    colors: string[];
    sectionCount: number;
    svgCount: number;
    imageCount: number;
    hasGradientBackground: boolean;
    badgeLikeElements: number;
  };
  interpretations: {
    heroComposition: string;
    layoutCharacter: string;
    strongDecisions: string[];
    patternsToAvoid: string[];
  };
}

/**
 * Extracts observable structural and styling signals from HTML without
 * inventing unverified claims.
 */
export function parseHtmlObservations(html: string): {
  title: string;
  observations: ReferenceRecord["observations"];
  interpretations: ReferenceRecord["interpretations"];
  blockedByGate: boolean;
} {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : "Untitled";

  const lower = html.toLowerCase();
  const blockedByGate =
    lower.includes("cf-turnstile") ||
    lower.includes("g-recaptcha") ||
    lower.includes("hcaptcha") ||
    lower.includes("verify you are human");

  const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
  const navLinkCount = navMatch ? (navMatch[0].match(/<a\b/gi) || []).length : 0;

  const headingHierarchy: string[] = [];
  const headingRegex = /<(h[1-4])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let hMatch: RegExpExecArray | null;
  while ((hMatch = headingRegex.exec(html)) !== null && headingHierarchy.length < 15) {
    const cleanText = hMatch[2].replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ");
    if (cleanText) {
      headingHierarchy.push(`${hMatch[1].toUpperCase()}: ${cleanText.slice(0, 80)}`);
    }
  }

  const fontFamilies = new Set<string>();
  const fontRegex = /font-family\s*:\s*([^;}]+)/gi;
  let fMatch: RegExpExecArray | null;
  while ((fMatch = fontRegex.exec(html)) !== null) {
    const cleaned = fMatch[1].replace(/["']/g, "").trim().slice(0, 60);
    if (cleaned) fontFamilies.add(cleaned);
  }

  const colors = new Set<string>();
  const hexRegex = /#[0-9a-fA-F]{3,8}\b/g;
  let cMatch: RegExpExecArray | null;
  while ((cMatch = hexRegex.exec(html)) !== null && colors.size < 20) {
    colors.add(cMatch[0].toLowerCase());
  }

  const sectionCount = (html.match(/<section\b/gi) || []).length;
  const svgCount = (html.match(/<svg\b/gi) || []).length;
  const imageCount = (html.match(/<img\b/gi) || []).length;
  const hasGradientBackground = /linear-gradient|radial-gradient|bg-gradient-to-/i.test(html);
  const badgeLikeElements = (html.match(/class=["'][^"']*\b(badge|pill|tag)\b[^"']*["']/gi) || []).length;

  const strongDecisions: string[] = [];
  const patternsToAvoid: string[] = [];

  if (navLinkCount > 0 && navLinkCount <= 7) {
    strongDecisions.push(`Focused top-level navigation (${navLinkCount} links)`);
  } else if (navLinkCount > 10) {
    patternsToAvoid.push(`Crowded navigation (${navLinkCount} links in <nav>)`);
  }

  if (badgeLikeElements > 4) {
    patternsToAvoid.push(`Heavy badge/pill usage (${badgeLikeElements} badge-like elements)`);
  }

  if (hasGradientBackground) {
    patternsToAvoid.push("Uses CSS/utility gradient backgrounds (evaluate if brand-justified)");
  }

  const heroComposition =
    sectionCount === 0
      ? "No <section> landmarks detected; structure relies on generic containers"
      : imageCount > 0 && svgCount < 10
        ? "Content and photography/product-media balanced composition"
        : "Vector/typographic composition";

  const layoutCharacter =
    sectionCount >= 5 ? "Multi-band marketing/product architecture" : "Compact single-flow layout";

  return {
    title,
    blockedByGate,
    observations: {
      navLinkCount,
      headingHierarchy,
      fontFamilies: Array.from(fontFamilies),
      colors: Array.from(colors),
      sectionCount,
      svgCount,
      imageCount,
      hasGradientBackground,
      badgeLikeElements,
    },
    interpretations: {
      heroComposition,
      layoutCharacter,
      strongDecisions,
      patternsToAvoid,
    },
  };
}

export async function inspectReference(
  input: z.infer<typeof InspectReferenceSchema>
): Promise<ReferenceRecord> {
  const parsedUrl = validateReferenceUrl(input.url, input.allowLocalForTest);
  const normalizedUrl = parsedUrl.toString();

  if (input.projectRoot && input.useCache) {
    const cached = readMemory<ReferenceRecord[]>(input.projectRoot, "references", []);
    const hit = cached.find((r) => r.url === normalizedUrl && r.accessible);
    if (hit) {
      return hit;
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs);

  try {
    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "FORMA-Design-Research/0.1 (public-reference-inspection)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return {
        url: normalizedUrl,
        title: "Inaccessible",
        industry: input.industry,
        inspectedAt: new Date().toISOString(),
        accessible: false,
        statusCode: response.status,
        error: `HTTP ${response.status} ${response.statusText}`,
        observations: {
          navLinkCount: 0,
          headingHierarchy: [],
          fontFamilies: [],
          colors: [],
          sectionCount: 0,
          svgCount: 0,
          imageCount: 0,
          hasGradientBackground: false,
          badgeLikeElements: 0,
        },
        interpretations: {
          heroComposition: "Unavailable",
          layoutCharacter: "Unavailable",
          strongDecisions: [],
          patternsToAvoid: [],
        },
      };
    }

    const html = await response.text();
    const parsed = parseHtmlObservations(html);

    if (parsed.blockedByGate) {
      return {
        url: normalizedUrl,
        title: parsed.title,
        industry: input.industry,
        inspectedAt: new Date().toISOString(),
        accessible: false,
        statusCode: response.status,
        error: "Blocked by anti-bot or CAPTCHA gate; FORMA does not bypass access controls.",
        observations: parsed.observations,
        interpretations: parsed.interpretations,
      };
    }

    const record: ReferenceRecord = {
      url: normalizedUrl,
      title: parsed.title,
      industry: input.industry,
      inspectedAt: new Date().toISOString(),
      accessible: true,
      statusCode: response.status,
      observations: parsed.observations,
      interpretations: parsed.interpretations,
    };

    if (input.projectRoot) {
      const existing = readMemory<ReferenceRecord[]>(input.projectRoot, "references", []);
      const updated = [...existing.filter((r) => r.url !== normalizedUrl), record];
      writeMemory(input.projectRoot, "references", updated);
    }

    return record;
  } catch (err) {
    return {
      url: normalizedUrl,
      title: "Fetch Failed",
      industry: input.industry,
      inspectedAt: new Date().toISOString(),
      accessible: false,
      error: err instanceof Error ? err.message : String(err),
      observations: {
        navLinkCount: 0,
        headingHierarchy: [],
        fontFamilies: [],
        colors: [],
        sectionCount: 0,
        svgCount: 0,
        imageCount: 0,
        hasGradientBackground: false,
        badgeLikeElements: 0,
      },
      interpretations: {
        heroComposition: "Unavailable",
        layoutCharacter: "Unavailable",
        strongDecisions: [],
        patternsToAvoid: [],
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export const ResearchReferencesSchema = z.object({
  industry: z.string().min(1),
  businessCategory: z.string().min(1),
  candidateUrls: z.array(z.string().url()).default([]),
  projectRoot: z.string().optional(),
  allowLocalForTest: z.boolean().default(false),
});

export async function researchReferences(
  input: z.infer<typeof ResearchReferencesSchema>
): Promise<{
  searchQueries: string[];
  recommendedDirectories: string[];
  inspected: ReferenceRecord[];
  accessibleCount: number;
  failedCount: number;
}> {
  const searchQueries = [
    `${input.industry} ${input.businessCategory} official product website`,
    `${input.industry} enterprise software design system`,
    `site:godly.website ${input.industry}`,
    `site:land-book.com ${input.businessCategory}`,
    `site:refero.design ${input.industry}`,
  ];

  const recommendedDirectories = [
    "https://godly.website",
    "https://land-book.com",
    "https://refero.design",
    "https://mobbin.com",
    "https://www.awwwards.com",
  ];

  const inspected: ReferenceRecord[] = [];
  for (const url of input.candidateUrls) {
    const rec = await inspectReference({
      url,
      industry: input.industry,
      projectRoot: input.projectRoot,
      useCache: true,
      timeoutMs: 10000,
      allowLocalForTest: input.allowLocalForTest,
    });
    inspected.push(rec);
  }

  return {
    searchQueries,
    recommendedDirectories,
    inspected,
    accessibleCount: inspected.filter((r) => r.accessible).length,
    failedCount: inspected.filter((r) => !r.accessible).length,
  };
}

export const ExtractPatternsSchema = z.object({
  projectRoot: z.string().optional(),
  references: z
    .array(
      z.object({
        url: z.string(),
        title: z.string(),
        accessible: z.boolean(),
        observations: z.object({
          navLinkCount: z.number(),
          fontFamilies: z.array(z.string()),
          colors: z.array(z.string()),
          sectionCount: z.number(),
          svgCount: z.number(),
          imageCount: z.number(),
          hasGradientBackground: z.boolean(),
          badgeLikeElements: z.number(),
        }),
        interpretations: z.object({
          strongDecisions: z.array(z.string()),
          patternsToAvoid: z.array(z.string()),
        }),
      })
    )
    .default([]),
});

export function extractDesignPatterns(input: z.infer<typeof ExtractPatternsSchema>) {
  let refs = input.references;
  if (refs.length === 0 && input.projectRoot) {
    refs = readMemory<ReferenceRecord[]>(input.projectRoot, "references", []);
  }
  const accessible = refs.filter((r) => r.accessible);

  const fontCounts = new Map<string, number>();
  const strongDecisions = new Set<string>();
  const patternsToAvoid = new Set<string>();
  let totalNav = 0;

  for (const ref of accessible) {
    totalNav += ref.observations.navLinkCount;
    for (const f of ref.observations.fontFamilies) {
      fontCounts.set(f, (fontCounts.get(f) ?? 0) + 1);
    }
    for (const s of ref.interpretations.strongDecisions) strongDecisions.add(s);
    for (const a of ref.interpretations.patternsToAvoid) patternsToAvoid.add(a);
  }

  const avgNavLinks = accessible.length > 0 ? Math.round(totalNav / accessible.length) : 0;

  return {
    analyzedReferenceCount: accessible.length,
    averageNavLinks: avgNavLinks,
    observedFontFamilies: Array.from(fontCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([font, count]) => ({ font, count })),
    strongDecisions: Array.from(strongDecisions),
    overusedPatternsToAvoid: Array.from(patternsToAvoid),
    guidance:
      accessible.length === 0
        ? "No accessible inspected references provided. Inspect live references before synthesizing Design DNA."
        : "Synthesize an original visual direction from these principles without copying any reference layout.",
  };
}
