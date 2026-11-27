# Custom Iconography Rules

1. **Function over filler:** Never add icons beside every heading, inside every card, or as decorative clusters. Ask if typography communicates better.
2. **No UI emojis:** Never use emojis as UI icons.
3. **Single coherent style:** Choose one style per project (`minimal-outline`, `geometric-solid`, `refined-duotone`, or `brand-custom`) and never mix icon libraries.
4. **Custom SVG first:** Store project SVGs centrally in `src/assets/icons/<category>/` with `viewBox`, `currentColor`, consistent `stroke-width`, no `<filter>` bloat, and `aria-hidden="true"` or `aria-label`.
5. Verify with `audit_icon_usage` and generate with `generate_custom_svg`.
