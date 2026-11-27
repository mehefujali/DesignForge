import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  validateReferenceUrl,
  parseHtmlObservations,
  inspectReference,
  researchReferences,
  extractDesignPatterns,
} from "../research.js";
import { resolveMemoryFile } from "../memory.js";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("Phase 2 Research Engine & Design Memory", () => {
  it("blocks private/loopback/metadata URLs by default", () => {
    assert.throws(() => validateReferenceUrl("http://127.0.0.1:8080"), /Blocked private/);
    assert.throws(() => validateReferenceUrl("http://169.254.169.254/latest/meta-data"), /Blocked private/);
    assert.throws(() => validateReferenceUrl("ftp://example.com"), /Unsupported URL protocol/);
    assert.ok(validateReferenceUrl("https://example.com/design"));
  });

  it("rejects path traversal in design memory keys", () => {
    assert.throws(() => resolveMemoryFile("/tmp/proj", "../secret"), /Invalid design memory key/);
  });

  it("flags CAPTCHA-gated pages as inaccessible without bypassing", () => {
    const html = `<html><head><title>Verify</title></head><body><div class="cf-turnstile">Verify you are human</div></body></html>`;
    const parsed = parseHtmlObservations(html);
    assert.equal(parsed.blockedByGate, true);
  });

  it("inspects a live HTTP fixture, caches to .forma/references.json, and extracts patterns", async () => {
    const html = `
      <!doctype html>
      <html>
        <head>
          <title>Meridian Ledger</title>
          <style>body { font-family: "IBM Plex Sans", sans-serif; color: #111827; background: #fafaf9; }</style>
        </head>
        <body>
          <nav><a href="/">Home</a><a href="/docs">Docs</a><a href="/pricing">Pricing</a></nav>
          <section><h1>Treasury infrastructure</h1><img src="/hero.png" alt="product" /></section>
          <section><h2>Audit trail</h2></section>
        </body>
      </html>
    `;

    const server = createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    });

    await new Promise<void>((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
    const addr = server.address();
    assert.ok(addr && typeof addr === "object");
    const url = `http://127.0.0.1:${addr.port}/`;

    const projectRoot = mkdtempSync(join(tmpdir(), "forma-test-"));
    tempDirs.push(projectRoot);

    try {
      const research = await researchReferences({
        industry: "Fintech",
        businessCategory: "B2B SaaS",
        candidateUrls: [url],
        projectRoot,
        allowLocalForTest: true,
      });

      assert.equal(research.accessibleCount, 1);
      assert.equal(research.inspected[0].title, "Meridian Ledger");
      assert.equal(research.inspected[0].observations.navLinkCount, 3);
      assert.ok(research.inspected[0].observations.fontFamilies.some((f) => f.includes("IBM Plex Sans")));

      // Verify cache hit even after server closes
      await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
      const cached = await inspectReference({
        url,
        projectRoot,
        useCache: true,
        timeoutMs: 2000,
        allowLocalForTest: true,
      });
      assert.equal(cached.accessible, true);
      assert.equal(cached.title, "Meridian Ledger");

      const patterns = extractDesignPatterns({ projectRoot, references: [] });
      assert.equal(patterns.analyzedReferenceCount, 1);
      assert.equal(patterns.averageNavLinks, 3);
    } finally {
      if (server.listening) {
        server.close();
      }
    }
  });
});
