---
name: project-research
description: >-
  Use before designing any website or web app to extract product context,
  discover 15-25 industry-specific references, inspect accessible sites, and
  synthesize design principles without copying layouts.
---

# Project Research

1. Call `project_analyze` with product name, business category, industry, target audience, website purpose, and required pages.
2. If essential strategic fields are missing, ask focused clarifying questions before proceeding.
3. Call `research_references` to generate industry-tailored queries and inspect public URLs (use browser automation or `search_web` to find 15–25 real production references).
4. Never fabricate reference inspections or bypass authentication/CAPTCHA gates.
5. Call `extract_design_patterns` to separate actual DOM/CSS observations from design interpretations and document strong decisions vs. patterns to avoid using [research-report.md](../../templates/research-report.md).
