# Anti-AI Pattern Restrictions

Unless explicitly justified and recorded in `.forma/exceptions.json`, avoid:
1. Purple-to-blue gradient backgrounds and gradient-clipped heading text.
2. Random decorative floating circles, glowing blobs behind headings, and ambient ornaments.
3. Glassmorphism (`backdrop-blur`) as a default card surface.
4. Centered hero + pill-with-dot eyebrow + 2-line description + 2 CTAs + floating screenshot clichés.
5. Repetitive 3-column feature grids and identical section alignments.
6. Excessive border radii (`>16px` on cards) and heavy drop shadows.

Always run `audit_visual_patterns` and `analyze_design_repetition` before finalizing any page.
