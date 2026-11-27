---
name: visual-audit
description: >-
  Use after frontend implementation to inspect the live rendered site in a
  browser across 6 viewports, check console/network errors, compare screenshots,
  and produce an evidence-backed DESIGN AUDIT REPORT.
---

# Visual QA & Refinement

1. Open the local running application using browser automation (never mark complete based on compilation alone).
2. Inspect desktop (`1440px`, `1280px`), tablet (`1024px`, `768px`), and mobile (`390px`, `360px`) viewports; capture screenshots and record `scrollWidth`, `bodyFontSizePx`, `minTouchTargetPx`, console errors, and failed network requests.
3. Call `validate_responsive_layout` with the measured viewport data.
4. For any issues found, call `generate_refinement_tasks`, fix the root cause in code, reload the browser, capture a new screenshot, and call `compare_screenshots` to verify the fix.
5. Call `create_design_report` to generate the final `DESIGN AUDIT REPORT` and persist it to `.forma/audit-history.json`.
