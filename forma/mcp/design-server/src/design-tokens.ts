import { z } from "zod";
import { writeMemory } from "./memory.js";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.slice(0, 6);
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const brightest = Math.max(lumA, lumB);
  const darkest = Math.min(lumA, lumB);
  return Math.round(((brightest + 0.05) / (darkest + 0.05)) * 100) / 100;
}

export const GenerateDesignDnaSchema = z.object({
  productName: z.string().min(1),
  industry: z.string().min(1),
  brandPersonality: z.array(z.string()).default(["authoritative", "clear"]),
  heroPreference: z
    .enum([
      "editorial",
      "split-screen",
      "product-first",
      "typography-led",
      "full-width-photographic",
      "asymmetric",
      "structured-enterprise",
      "minimal-navigation-led",
    ])
    .optional(),
  projectRoot: z.string().optional(),
});

export interface DesignDna {
  productName: string;
  industry: string;
  visualDirection: string;
  brandPersonality: string[];
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    textPrimary: string;
    textMuted: string;
    border: string;
    contrastRatios: {
      textOnBackground: number;
      textOnSurface: number;
      primaryOnBackground: number;
    };
  };
  typography: {
    displayFont: string;
    bodyFont: string;
    monoFont: string;
    weights: number[];
    scale: Record<string, { size: string; lineHeight: string; letterSpacing: string }>;
  };
  spacing: {
    baseUnitPx: number;
    scalePx: number[];
    sectionPaddingY: string;
  };
  grid: {
    columns: number;
    maxWidthPx: number;
    gutterPx: number;
  };
  borders: {
    hairline: string;
    emphasis: string;
  };
  radius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    flat: string;
    subtle: string;
  };
  iconStyle: "minimal-outline" | "geometric-solid" | "refined-duotone" | "brand-custom";
  imageTreatment: string;
  animation: {
    principle: string;
    durationFastMs: number;
    durationBaseMs: number;
    easing: string;
    respectsReducedMotion: true;
  };
  layoutArchitecture: {
    heroType: string;
    pagePattern: string;
    sectionVariationRule: string;
  };
  savedTo?: string;
}

interface IndustryPreset {
  visualDirection: string;
  displayFont: string;
  bodyFont: string;
  monoFont: string;
  palette: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    textPrimary: string;
    textMuted: string;
    border: string;
  };
  heroType: string;
  pagePattern: string;
  iconStyle: DesignDna["iconStyle"];
  radius: DesignDna["radius"];
}

function selectIndustryPreset(industry: string): IndustryPreset {
  const lower = industry.toLowerCase();

  if (lower.includes("fin") || lower.includes("bank") || lower.includes("pay") || lower.includes("treasury")) {
    return {
      visualDirection: "Precision institutional ledger: crisp hairlines, warm stone surfaces, high-contrast ink typography.",
      displayFont: "IBM Plex Sans",
      bodyFont: "IBM Plex Sans",
      monoFont: "IBM Plex Mono",
      palette: {
        primary: "#0F4C5C",
        secondary: "#9A6B2F",
        background: "#FAF9F6",
        surface: "#FFFFFF",
        textPrimary: "#111827",
        textMuted: "#4B5563",
        border: "#E5E2DC",
      },
      heroType: "structured-enterprise",
      pagePattern: "asymmetric-data-and-prose",
      iconStyle: "minimal-outline",
      radius: { none: "0px", sm: "2px", md: "4px", lg: "6px" },
    };
  }

  if (lower.includes("edu") || lower.includes("school") || lower.includes("learn")) {
    return {
      visualDirection: "Warm academic clarity: structured Swiss grid, readable humanist sans, calm editorial contrast.",
      displayFont: "Plus Jakarta Sans",
      bodyFont: "Source Sans 3",
      monoFont: "JetBrains Mono",
      palette: {
        primary: "#1D4E4F",
        secondary: "#C2593F",
        background: "#FDFBF7",
        surface: "#F4F0E8",
        textPrimary: "#1C1917",
        textMuted: "#57534E",
        border: "#E2DDD5",
      },
      heroType: "split-screen",
      pagePattern: "editorial-modular",
      iconStyle: "minimal-outline",
      radius: { none: "0px", sm: "4px", md: "6px", lg: "8px" },
    };
  }

  if (lower.includes("agency") || lower.includes("studio") || lower.includes("design") || lower.includes("creative")) {
    return {
      visualDirection: "Editorial typography-led monograph: generous negative space, restrained monochrome + single mineral accent.",
      displayFont: "Newsreader",
      bodyFont: "Manrope",
      monoFont: "IBM Plex Mono",
      palette: {
        primary: "#B45309",
        secondary: "#374151",
        background: "#F8F7F4",
        surface: "#FFFFFF",
        textPrimary: "#141413",
        textMuted: "#52524E",
        border: "#E4E2DD",
      },
      heroType: "typography-led",
      pagePattern: "editorial-asymmetric",
      iconStyle: "brand-custom",
      radius: { none: "0px", sm: "0px", md: "2px", lg: "4px" },
    };
  }

  return {
    visualDirection: "Functional product architecture: disciplined spacing, Geist-led hierarchy, zero decorative clutter.",
    displayFont: "Geist",
    bodyFont: "Manrope",
    monoFont: "Geist Mono",
    palette: {
      primary: "#0F5132",
      secondary: "#475569",
      background: "#FAFAFA",
      surface: "#FFFFFF",
      textPrimary: "#0F172A",
      textMuted: "#475569",
      border: "#E2E8F0",
    },
    heroType: "product-first",
    pagePattern: "split-and-structured",
    iconStyle: "minimal-outline",
    radius: { none: "0px", sm: "4px", md: "6px", lg: "8px" },
  };
}

export function generateDesignDna(input: z.infer<typeof GenerateDesignDnaSchema>): DesignDna {
  const preset = selectIndustryPreset(input.industry);
  const p = preset.palette;

  const dna: DesignDna = {
    productName: input.productName,
    industry: input.industry,
    visualDirection: preset.visualDirection,
    brandPersonality: input.brandPersonality,
    colors: {
      ...p,
      contrastRatios: {
        textOnBackground: contrastRatio(p.textPrimary, p.background),
        textOnSurface: contrastRatio(p.textPrimary, p.surface),
        primaryOnBackground: contrastRatio(p.primary, p.background),
      },
    },
    typography: {
      displayFont: preset.displayFont,
      bodyFont: preset.bodyFont,
      monoFont: preset.monoFont,
      weights: [400, 500, 600],
      scale: {
        display: { size: "clamp(2.25rem, 4vw, 3.25rem)", lineHeight: "1.1", letterSpacing: "-0.025em" },
        h2: { size: "clamp(1.625rem, 2.5vw, 2.125rem)", lineHeight: "1.2", letterSpacing: "-0.02em" },
        h3: { size: "1.25rem", lineHeight: "1.35", letterSpacing: "-0.01em" },
        body: { size: "1rem", lineHeight: "1.6", letterSpacing: "0em" },
        small: { size: "0.875rem", lineHeight: "1.5", letterSpacing: "0em" },
      },
    },
    spacing: {
      baseUnitPx: 8,
      scalePx: [4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
      sectionPaddingY: "clamp(4rem, 8vw, 6.5rem)",
    },
    grid: {
      columns: 12,
      maxWidthPx: 1240,
      gutterPx: 24,
    },
    borders: {
      hairline: `1px solid ${p.border}`,
      emphasis: `1px solid ${p.textPrimary}`,
    },
    radius: preset.radius,
    shadows: {
      flat: "none",
      subtle: "0 1px 2px rgba(15, 23, 42, 0.05)",
    },
    iconStyle: preset.iconStyle,
    imageTreatment: "Natural aspect ratios, crisp 1px border framing, zero synthetic glow or tilted mockups.",
    animation: {
      principle: "State-change feedback only; no continuous floating or decorative scroll parallax.",
      durationFastMs: 140,
      durationBaseMs: 220,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
      respectsReducedMotion: true,
    },
    layoutArchitecture: {
      heroType: input.heroPreference ?? preset.heroType,
      pagePattern: preset.pagePattern,
      sectionVariationRule: "No two consecutive sections may share the same grid column count and background treatment.",
    },
  };

  if (input.projectRoot) {
    dna.savedTo = writeMemory(input.projectRoot, "design-dna", dna);
  }

  return dna;
}

export const AuditDesignTokensSchema = z.object({
  cssOrTokensText: z.string().min(1),
  expectedDisplayFont: z.string().optional(),
  expectedBodyFont: z.string().optional(),
});

export interface TokenAuditFinding {
  severity: "critical" | "major" | "minor";
  tokenOrRule: string;
  explanation: string;
  recommendation: string;
}

export function auditDesignTokens(input: z.infer<typeof AuditDesignTokensSchema>): {
  passed: boolean;
  findings: TokenAuditFinding[];
} {
  const findings: TokenAuditFinding[] = [];
  const text = input.cssOrTokensText;

  if (/\bInter\b/i.test(text) && input.expectedBodyFont?.toLowerCase() !== "inter") {
    findings.push({
      severity: "major",
      tokenOrRule: "font-family: Inter",
      explanation: "Defaults to 'Inter' without brand justification.",
      recommendation: `Use project-specific typeface (${input.expectedBodyFont ?? "IBM Plex Sans, Manrope, or Geist"}).`,
    });
  }

  if (/linear-gradient\([^)]*(#6366f1|#8b5cf6|#a855f7|purple|violet)[^)]*(#3b82f6|#2563eb|blue)/i.test(text)) {
    findings.push({
      severity: "critical",
      tokenOrRule: "purple-to-blue gradient",
      explanation: "Detected generic purple-to-blue gradient token.",
      recommendation: "Replace with deliberate solid surface or subtle tonal neutral from Design DNA.",
    });
  }

  const radiusMatches = text.match(/border-radius\s*:\s*(\d+)px/gi) || [];
  const largeRadii = radiusMatches.filter((m) => {
    const val = parseInt(m.replace(/\D/g, ""), 10);
    return val > 16 && val < 999;
  });
  if (largeRadii.length >= 3) {
    findings.push({
      severity: "minor",
      tokenOrRule: "border-radius",
      explanation: `Found ${largeRadii.length} oversized border-radius declarations (>16px).`,
      recommendation: "Tighten radius scale to 2px–8px for sharper architectural hierarchy.",
    });
  }

  return {
    passed: findings.filter((f) => f.severity === "critical").length === 0,
    findings,
  };
}
