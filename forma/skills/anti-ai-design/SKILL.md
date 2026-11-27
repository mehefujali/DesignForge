---
name: anti-ai-design
description: >-
  Use to audit HTML/CSS pages for generic AI-generated visual clichés,
  repetitive section structures, pill-and-dot hero taglines, and compute a
  transparent 100-point observable design quality score.
---

# Anti-AI Design Audit

1. Call `audit_visual_patterns` with the page HTML, CSS, and `projectRoot` (so approved exceptions in `.forma/exceptions.json` are respected).
2. Call `analyze_design_repetition` to check for repeated 3-column grids, centered-only sections, and repeated badge-above-heading compositions.
3. Review every finding (`severity`, `affectedElement`, `explanation`, `recommendation`).
4. Treat the 100-point score as an internal observable-quality heuristic, never as proof of human vs. AI authorship.
5. Fix all `critical` and `major` findings before moving to visual QA.
