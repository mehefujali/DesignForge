# FORMA — Intelligent Design Engineering Plugin for Google Antigravity

**Tagline:** Beyond Templates. Beyond Generic.

FORMA is a native Antigravity plugin, MCP server, and design intelligence system that helps AI coding agents research, plan, implement, audit, and visually verify production-grade web interfaces.

## Architecture

- **Manifest:** `plugin.json`
- **MCP Server (`mcp_config.json` -> `forma-design`):** `mcp/design-server/` (TypeScript, ESM, Zod-validated)
- **Skills (`skills/`):**
  - `project-research` — Strategic brief extraction, 15–25 reference discovery, pattern synthesis
  - `design-system` — Project-specific Design DNA & WCAG-checked token auditing
  - `anti-ai-design` — Repetition & generic cliché detection with 100-point observable quality heuristic
  - `custom-icons` — UI emoji/mixed-library auditing & centralized custom SVG generation
  - `frontend-implementation` — Logic-preserving, semantic, `prefers-reduced-motion` implementation
  - `visual-audit` — 6-breakpoint browser QA, screenshot comparison, and `DESIGN AUDIT REPORT`
- **Agents (`agents/`):** `research-agent`, `design-director`, `anti-pattern-auditor`, `implementation-agent`, `visual-qa-agent`
- **Rules (`rules/AGENTS.md`):** Composes `design-principles.md`, `anti-patterns.md`, `typography.md`, `iconography.md`, and `implementation.md`
- **Hooks (`hooks.json`):** `SessionStart` hook (`scripts/session-start.mjs`) checks `.forma/design-dna.json` presence in the active workspace
- **Schemas & Templates:** `schemas/` (`design-dna.schema.json`, `reference.schema.json`, `audit.schema.json`) and `templates/` (`research-report.md`, `design-brief.md`, `audit-report.md`)

## MCP Tools (`forma-design`)

1. `project_analyze`
2. `research_references`
3. `inspect_reference`
4. `extract_design_patterns`
5. `generate_design_dna`
6. `audit_design_tokens`
7. `analyze_design_repetition`
8. `audit_visual_patterns`
9. `audit_icon_usage`
10. `generate_custom_svg`
11. `create_design_report`
12. `compare_screenshots`
13. `validate_responsive_layout`
14. `generate_refinement_tasks`

## Development & Testing

```powershell
cd forma/mcp/design-server
npm install
npm test
```

## Design Memory

Project-scoped artifacts are stored under `<projectRoot>/.forma/` (`brief.json`, `references.json`, `design-dna.json`, `exceptions.json`, `audit-history.json`).
