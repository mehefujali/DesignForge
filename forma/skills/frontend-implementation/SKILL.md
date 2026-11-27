---
name: frontend-implementation
description: >-
  Use when implementing an approved Design DNA into an existing or new web
  codebase while preserving business logic, semantic HTML, accessibility,
  purposeful motion, and intentional responsive breakpoints.
---

# Frontend Implementation

1. Inspect the existing repository architecture and preserve all business logic, routes, and framework conventions.
2. Load `.forma/design-dna.json` and map its typography, color, spacing, border, radius, and shadow tokens directly into CSS variables or theme config.
3. Build semantic HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`) with purposeful, `prefers-reduced-motion`-aware transitions.
4. Implement intentional responsive compositions for `1440px`, `1280px`, `1024px`, `768px`, `390px`, and `360px` viewports.
5. Run `audit_design_tokens`, `audit_visual_patterns`, and `audit_icon_usage` immediately after implementation.
