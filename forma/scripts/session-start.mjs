import { existsSync } from "node:fs";
import { join } from "node:path";

let raw = "";
for await (const chunk of process.stdin) {
  raw += chunk;
}

let cwd = "";
try {
  const payload = JSON.parse(raw || "{}");
  cwd = payload.cwd ?? "";
} catch {
  cwd = "";
}

const hasDna = cwd ? existsSync(join(cwd, ".forma", "design-dna.json")) : false;
const statusNote = hasDna
  ? "FORMA Design Memory (.forma/design-dna.json) detected in this workspace."
  : "No .forma/design-dna.json found yet — run project_analyze and research_references before UI implementation.";

const output = {
  injectSteps: [
    {
      systemMessage: {
        systemMessage: `FORMA Design Engineering plugin is active. ${statusNote}`,
      },
    },
  ],
};

process.stdout.write(JSON.stringify(output));
