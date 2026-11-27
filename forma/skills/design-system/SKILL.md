---
name: design-system
description: >-
  Use after project research to generate a project-specific Design DNA
  (typography, accessible color palette, spacing, grid, motion, and hero/layout
  architecture) and audit design tokens.
---

# Design System & DNA

1. Review the research findings in `.forma/references.json` before defining visual tokens.
2. Call `generate_design_dna` with `productName`, `industry`, `brandPersonality`, and `projectRoot` to persist `.forma/design-dna.json`.
3. Verify typography avoids defaulting to `Inter`, limits weights to 2–3 values, and meets WCAG AA contrast (>= 4.5:1 for body text).
4. Select a non-generic hero composition (`editorial`, `split-screen`, `product-first`, `typography-led`, `asymmetric`, `structured-enterprise`).
5. Run `audit_design_tokens` on CSS/Tailwind token definitions to catch regressions before implementation.
6. Document the approved system using [design-brief.md](../../templates/design-brief.md).
