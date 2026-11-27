import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { analyzeProject, ProjectBriefSchema } from "../index.js";

describe("Phase 1 Foundation", () => {
  it("validates plugin.json manifest fields", () => {
    const manifestPath = resolve(import.meta.dirname, "../../../../plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    assert.equal(manifest.name, "design-forge");
    assert.equal(manifest.displayName, "Design Forge");
    assert.deepEqual(manifest.author, { name: "mehefujali" });
    assert.ok(typeof manifest.description === "string" && manifest.description.length > 20);
    assert.ok(Array.isArray(manifest.suggestedPrompts) && manifest.suggestedPrompts.length === 3);
  });

  it("analyzes a fintech project brief and produces industry-specific categories", () => {
    const input = ProjectBriefSchema.parse({
      productName: "LedgerCore",
      businessCategory: "B2B SaaS",
      industry: "Financial Infrastructure",
      targetAudience: "Treasury teams and CFOs",
      websitePurpose: "Product marketing and developer onboarding",
      requiredPages: ["home", "pricing", "docs", "security", "customers", "contact"],
    });

    const result = analyzeProject(input);
    assert.equal(result.targetReferenceCount.min, 20);
    assert.ok(result.recommendedReferenceCategories.includes("fintech infrastructure companies"));
    assert.ok(result.missingFields.includes("primaryPersonas"));
    assert.ok(result.clarifyingQuestions.length > 0);
  });
});
