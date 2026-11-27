import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ProjectBriefSchema,
  analyzeProject,
  ResearchReferencesSchema,
  researchReferences,
  InspectReferenceSchema,
  inspectReference,
  ExtractPatternsSchema,
  extractDesignPatterns,
} from "./research.js";
import {
  GenerateDesignDnaSchema,
  generateDesignDna,
  AuditDesignTokensSchema,
  auditDesignTokens,
} from "./design-tokens.js";
import {
  AnalyzeRepetitionSchema,
  analyzeDesignRepetition,
  AuditVisualPatternsSchema,
  auditVisualPatterns,
} from "./pattern-audit.js";
import {
  AuditIconUsageSchema,
  auditIconUsage,
  GenerateCustomSvgSchema,
  generateCustomSvg,
} from "./icon-audit.js";
import {
  ValidateResponsiveSchema,
  validateResponsiveLayout,
  CompareScreenshotsSchema,
  compareScreenshots,
  CreateDesignReportSchema,
  createDesignReport,
  GenerateRefinementTasksSchema,
  generateRefinementTasks,
} from "./visual-audit.js";

export { ProjectBriefSchema, analyzeProject };

function jsonResponse(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function createFormaServer(): McpServer {
  const server = new McpServer({
    name: "forma-design",
    version: "0.6.0",
  });

  server.tool(
    "project_analyze",
    "Analyze project context, detect missing strategic details, and determine industry-specific reference discovery targets.",
    ProjectBriefSchema.shape,
    async (args) => jsonResponse(analyzeProject(ProjectBriefSchema.parse(args)))
  );

  server.tool(
    "research_references",
    "Generate industry-tailored research queries and inspect public reference URLs with caching and access-control respect.",
    ResearchReferencesSchema.shape,
    async (args) => jsonResponse(await researchReferences(ResearchReferencesSchema.parse(args)))
  );

  server.tool(
    "inspect_reference",
    "Inspect a single public website reference and separate actual DOM/CSS observations from design interpretations.",
    InspectReferenceSchema.shape,
    async (args) => jsonResponse(await inspectReference(InspectReferenceSchema.parse(args)))
  );

  server.tool(
    "extract_design_patterns",
    "Synthesize strong decisions, industry conventions, and overused patterns to avoid from inspected references.",
    ExtractPatternsSchema.shape,
    async (args) => jsonResponse(extractDesignPatterns(ExtractPatternsSchema.parse(args)))
  );

  server.tool(
    "generate_design_dna",
    "Generate a project-specific Design DNA (typography, accessible color system, grid, spacing, motion, and hero architecture).",
    GenerateDesignDnaSchema.shape,
    async (args) => jsonResponse(generateDesignDna(GenerateDesignDnaSchema.parse(args)))
  );

  server.tool(
    "audit_design_tokens",
    "Audit CSS or design tokens against FORMA typography, contrast, gradient, and radius standards.",
    AuditDesignTokensSchema.shape,
    async (args) => jsonResponse(auditDesignTokens(AuditDesignTokensSchema.parse(args)))
  );

  server.tool(
    "analyze_design_repetition",
    "Detect repeated hero patterns, 3-column card grids, badge-above-heading clutter, and flat centered sections.",
    AnalyzeRepetitionSchema.shape,
    async (args) => jsonResponse(analyzeDesignRepetition(AnalyzeRepetitionSchema.parse(args)))
  );

  server.tool(
    "audit_visual_patterns",
    "Run deterministic anti-AI pattern audit and compute a transparent 100-point observable quality heuristic.",
    AuditVisualPatternsSchema.shape,
    async (args) => jsonResponse(auditVisualPatterns(AuditVisualPatternsSchema.parse(args)))
  );

  server.tool(
    "audit_icon_usage",
    "Detect UI emojis, mixed icon libraries, decorative heading icons, and invalid inline SVGs.",
    AuditIconUsageSchema.shape,
    async (args) => jsonResponse(auditIconUsage(AuditIconUsageSchema.parse(args)))
  );

  server.tool(
    "generate_custom_svg",
    "Generate clean, accessible, currentColor custom SVG icons aligned with Design DNA.",
    GenerateCustomSvgSchema.shape,
    async (args) => jsonResponse(generateCustomSvg(GenerateCustomSvgSchema.parse(args)))
  );

  server.tool(
    "create_design_report",
    "Generate a structured DESIGN AUDIT REPORT and record audit history in .forma/ design memory.",
    CreateDesignReportSchema.shape,
    async (args) => jsonResponse(createDesignReport(CreateDesignReportSchema.parse(args)))
  );

  server.tool(
    "compare_screenshots",
    "Compare before/after screenshot PNG files for dimension parity and rendered byte differences.",
    CompareScreenshotsSchema.shape,
    async (args) => jsonResponse(compareScreenshots(CompareScreenshotsSchema.parse(args)))
  );

  server.tool(
    "validate_responsive_layout",
    "Validate responsive measurements across 1440, 1280, 1024, 768, 390, and 360px breakpoints.",
    ValidateResponsiveSchema.shape,
    async (args) => jsonResponse(validateResponsiveLayout(ValidateResponsiveSchema.parse(args)))
  );

  server.tool(
    "generate_refinement_tasks",
    "Convert prioritized audit findings into actionable, verifiable refinement tasks.",
    GenerateRefinementTasksSchema.shape,
    async (args) => jsonResponse(generateRefinementTasks(GenerateRefinementTasksSchema.parse(args)))
  );

  return server;
}

const isMainModule =
  typeof process !== "undefined" &&
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop() || "");

if (isMainModule) {
  const server = createFormaServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
