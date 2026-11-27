# Frontend Implementation & Visual QA Rules

1. **Preserve architecture:** Inspect the existing repository first, keep existing business logic, and avoid unnecessary dependencies or framework swaps.
2. **Purposeful motion:** Animate state transitions only, never continuous floating or decorative scroll parallax; always respect `prefers-reduced-motion`.
3. **Intentional responsiveness:** Design and test `1440px`, `1280px`, `1024px`, `768px`, `390px`, and `360px` viewports.
4. **Never ship on compilation alone:** Inspect the live rendered app in a browser, check console/network errors, run `validate_responsive_layout`, fix issues, reload, and verify with updated screenshots.
