---
name: custom-icons
description: >-
  Use when adding or auditing UI icons to eliminate emoji icons, mixed icon
  libraries, and decorative icon clutter, and to generate clean custom SVGs
  under src/assets/icons/.
---

# Custom Icon Intelligence

1. Before adding any icon, confirm it improves recognition, navigation, or status/action clarity—otherwise use typography.
2. Run `audit_icon_usage` on existing HTML to flag UI emojis, mixed icon libraries (`lucide`, `font-awesome`, `heroicons`, `material-icons`), heading icons, missing `viewBox`, filter bloat, or missing `aria-*` attributes.
3. When a custom icon is needed, call `generate_custom_svg` with consistent `style`, `strokeWidth`, `category`, and `projectRoot` so it is saved centrally in `src/assets/icons/<category>/<name>.svg`.
