import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { auditIconUsage, generateCustomSvg } from "../icon-audit.js";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("Phase 5 Custom Icon Intelligence Engine", () => {
  it("detects emoji UI icons, mixed libraries, and invalid inline SVGs", () => {
    const html = `
      <div>
        <h2>🚀 Launch Faster</h2>
        <i class="lucide lucide-zap"></i>
        <i class="fa-solid fa-rocket"></i>
        <svg width="24" height="24"><filter id="glow"></filter><path d="M0 0h24" /></svg>
      </div>
    `;
    const result = auditIconUsage({ html });
    assert.equal(result.emojiIconCount, 1);
    assert.deepEqual(result.detectedLibraries, ["lucide", "font-awesome"]);
    assert.ok(result.findings.some((f) => f.affectedElement === "emoji-as-ui-icon"));
    assert.ok(result.findings.some((f) => f.affectedElement === "icon-libraries"));
    assert.ok(result.findings.some((f) => f.affectedElement === "svg[viewBox]"));
  });

  it("generates clean currentColor SVG and writes to centralized src/assets/icons", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "forma-icons-"));
    tempDirs.push(projectRoot);

    const out = generateCustomSvg({
      name: "nav-arrow",
      category: "navigation",
      style: "minimal-outline",
      primitive: "arrow-right",
      strokeWidth: 1.75,
      ariaLabel: "Next section",
      projectRoot,
    });

    assert.ok(out.svg.includes('viewBox="0 0 24 24"'));
    assert.ok(out.svg.includes("currentColor"));
    assert.ok(out.savedTo && existsSync(out.savedTo));
    assert.equal(readFileSync(out.savedTo!, "utf8"), out.svg);
  });
});
