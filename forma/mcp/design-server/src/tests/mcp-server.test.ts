import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

describe("Phase 8 MCP Server Stdio Integration", () => {
  it("starts over stdio, exposes all 14 tools, and executes tools end-to-end", async () => {
    const serverEntry = resolve(import.meta.dirname, "../index.js");
    const transport = new StdioClientTransport({
      command: "node",
      args: [serverEntry],
    });
    const client = new Client({ name: "forma-test-client", version: "1.0.0" });

    try {
      await client.connect(transport);
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name).sort();

      const expected = [
        "analyze_design_repetition",
        "audit_design_tokens",
        "audit_icon_usage",
        "audit_visual_patterns",
        "compare_screenshots",
        "create_design_report",
        "extract_design_patterns",
        "generate_custom_svg",
        "generate_design_dna",
        "generate_refinement_tasks",
        "inspect_reference",
        "project_analyze",
        "research_references",
        "validate_responsive_layout",
      ];

      assert.deepEqual(names, expected);

      const dnaRes = await client.callTool({
        name: "generate_design_dna",
        arguments: {
          productName: "Helios",
          industry: "Financial SaaS",
          brandPersonality: ["institutional", "clear"],
        },
      });
      const content = dnaRes.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0].text);
      assert.equal(parsed.productName, "Helios");
      assert.notEqual(parsed.typography.bodyFont, "Inter");
    } finally {
      await client.close();
    }
  });
});
