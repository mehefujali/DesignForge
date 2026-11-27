import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contrastRatio, generateDesignDna, auditDesignTokens } from "../design-tokens.js";

describe("Phase 3 Design Intelligence Engine", () => {
  it("computes accurate WCAG contrast ratios", () => {
    assert.equal(contrastRatio("#000000", "#FFFFFF"), 21);
    assert.ok(contrastRatio("#111827", "#FAF9F6") >= 15);
  });

  it("generates industry-specific Design DNA without Inter default and with WCAG AA contrast", () => {
    const finDna = generateDesignDna({
      productName: "VaultFlow",
      industry: "Financial SaaS",
      brandPersonality: ["precise", "regulated"],
    });
    assert.notEqual(finDna.typography.bodyFont, "Inter");
    assert.ok(finDna.colors.contrastRatios.textOnBackground >= 4.5);
    assert.equal(finDna.layoutArchitecture.heroType, "structured-enterprise");

    const agencyDna = generateDesignDna({
      productName: "Atelier Nord",
      industry: "Brand Design Agency",
      brandPersonality: ["editorial", "restrained"],
    });
    assert.notEqual(agencyDna.typography.displayFont, finDna.typography.displayFont);
    assert.equal(agencyDna.layoutArchitecture.heroType, "typography-led");
  });

  it("flags Inter default and purple-blue gradients in token audit", () => {
    const result = auditDesignTokens({
      cssOrTokensText: `
        :root { --font-sans: 'Inter', sans-serif; }
        .hero { background: linear-gradient(135deg, #8b5cf6, #3b82f6); }
      `,
      expectedBodyFont: "IBM Plex Sans",
    });
    assert.equal(result.passed, false);
    assert.equal(result.findings.length, 2);
  });
});
