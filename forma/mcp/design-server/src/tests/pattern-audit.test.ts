import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { auditVisualPatterns } from "../pattern-audit.js";

describe("Phase 4 Anti-AI Engine & Quality Scoring", () => {
  it("penalizes generic AI landing page patterns with concrete findings", () => {
    const genericHtml = `
      <!doctype html>
      <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body class="bg-gradient-to-r from-purple-600 to-blue-500">
          <div class="blur-3xl rounded-full"></div>
          <section class="text-center">
            <div class="rounded-full"><span class="w-2 h-2 rounded-full animate-pulse"></span>NEW FEATURE</div>
            <h1 class="bg-clip-text text-transparent">Build Faster With AI</h1>
          </section>
          <section class="text-center grid-cols-3"></section>
          <section class="text-center grid-cols-3"></section>
        </body>
      </html>
    `;

    const result = auditVisualPatterns({ html: genericHtml, css: "" });
    assert.ok(result.totalScore < 70, `Expected low score, got ${result.totalScore}`);
    assert.ok(result.findings.some((f) => f.severity === "critical"));
    assert.ok(result.findings.some((f) => f.affectedElement.includes("background-gradient")));
    assert.ok(result.findings.some((f) => f.affectedElement.includes("rounded-full + h1")));
  });

  it("rewards clean, non-repetitive editorial markup", () => {
    const cleanHtml = `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: "IBM Plex Sans", sans-serif; }
            @media (prefers-reduced-motion: reduce) { * { transition: none; } }
          </style>
        </head>
        <body>
          <nav><a href="/">Home</a></nav>
          <main>
            <section><h1>Treasury control without spreadsheet drift.</h1></section>
            <section class="grid-cols-2"><h2>Auditability</h2></section>
            <section><h2>Security architecture</h2></section>
          </main>
        </body>
      </html>
    `;

    const result = auditVisualPatterns({ html: cleanHtml, css: "" });
    assert.ok(result.totalScore >= 95, `Expected high score, got ${result.totalScore}`);
    assert.equal(result.findings.length, 0);
  });
});
