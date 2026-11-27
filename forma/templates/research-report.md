# Research Report: {{productName}}

- **Industry:** {{industry}}
- **Category:** {{businessCategory}}
- **Target Audience:** {{targetAudience}}
- **Reference Target:** {{targetMin}}–{{targetMax}} references

## 1. Strategic Context
- **Positioning:** {{productPositioning}}
- **Brand Personality:** {{brandPersonality}}
- **Business Objectives:** {{businessObjectives}}

## 2. Inspected References
<!-- Only list URLs actually opened and inspected. -->
{{#references}}
### {{title}} ({{url}})
- **Status:** {{statusCode}} (Inspected: {{inspectedAt}})
- **Actual Observations:**
  - Navigation links: {{navLinkCount}}
  - Fonts detected: {{fontFamilies}}
  - Colors detected: {{colors}}
  - Sections: {{sectionCount}} | SVGs: {{svgCount}} | Images: {{imageCount}}
- **Design Interpretations:**
  - Hero composition: {{heroComposition}}
  - Layout character: {{layoutCharacter}}
{{/references}}

## 3. Extracted Design Principles
### Strong Decisions
{{strongDecisions}}

### Industry Conventions
{{industryConventions}}

### Overused Patterns to Avoid
{{patternsToAvoid}}
