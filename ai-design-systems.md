# AI as a Design Systems Architect

## Vision

Build an AI that understands everything from a Figma file like a seasoned designer. The goal is to create an AI design systems architect that can onboard onto any design system, analyze components comprehensively, and provide expert-level insights.

---

## Figma MCP Data Extraction Capabilities

Using Figma's MCP (Model Context Protocol) tools, AI assistants can extract comprehensive design system data directly from Figma URLs.

### Available MCP Tools

| Tool | Purpose |
|------|---------|
| `get_screenshot` | Capture visual screenshot of any Figma node |
| `get_metadata` | Extract component structure in XML format (hierarchy, node IDs, positions, dimensions) |
| `get_design_context` | Generate React + Tailwind code with full design specifications |
| `get_variable_defs` | Extract design tokens/variables (colors, spacing, typography, elevation) |
| `get_code_connect_map` | Get code-to-Figma mappings (Enterprise only) |

### What Data Can Be Extracted

| Data Type | Available | Source Tool |
|-----------|-----------|-------------|
| Component structure | ✅ | `get_metadata` |
| Variant matrix | ✅ | `get_metadata` |
| Design tokens | ✅ | `get_variable_defs` |
| Generated React code | ✅ | `get_design_context` |
| TypeScript interfaces | ✅ | `get_design_context` |
| Typography styles | ✅ | `get_design_context` |
| Elevation/shadows | ✅ | `get_design_context` |
| Component descriptions | ✅ | `get_design_context` |
| Documentation links | ✅ | `get_design_context` |
| Screenshots | ✅ | `get_screenshot` |
| Asset URLs (icons) | ✅ | `get_design_context` |
| Node IDs | ✅ | All tools |

### Limitations (Enterprise/Code Connect Required)

| Data Type | Status |
|-----------|--------|
| Code Connect mappings | ❌ Enterprise only |
| Figma Variables API | ❌ Enterprise only |
| Dev Mode data | ❌ Enterprise only |
| Interaction/prototype data | ❌ Not exposed via API |
| Animation specifications | ❌ Not in REST API |

---

## Case Study: Accordion Component Audit

**Source:** Artemis Modular Design System
**Figma URL:** `https://www.figma.com/design/qyrtCkpQQ1yq1Nv3h0mbkq/Artemis---Modular-Design-System?node-id=16408-26546`

### Overview

| Property | Value |
|----------|-------|
| **Component Name** | AccordionTextVariant |
| **Modes** | Light Mode, Dark Mode |
| **Documentation** | [MUI Accordion API](https://mui.com/api/accordion) |
| **Purpose** | Show and hide sections of related content on a page |

---

### Variant Matrix (18 Total Variants)

The component uses a **4-property variant system**:

| Property | Values | Description |
|----------|--------|-------------|
| `Expanded` | `True`, `False` | Whether content is visible |
| `Disabled` | `True`, `False` | Interactive state |
| `First-of-type` | `True`, `False` | Position styling (top border radius) |
| `Last-of-type` | `True`, `False` | Position styling (bottom border radius) |

#### Light Mode Variants (9)
```
6583:46085  → Expanded=False, Disabled=False, First-of-type=False, Last-of-type=False
6583:46093  → Expanded=True,  Disabled=False, First-of-type=False, Last-of-type=False
7270:41460  → Expanded=False, Disabled=False, First-of-type=True,  Last-of-type=False
7270:41464  → Expanded=True,  Disabled=False, First-of-type=True,  Last-of-type=False
7270:41526  → Expanded=False, Disabled=False, First-of-type=False, Last-of-type=True
7270:41530  → Expanded=True,  Disabled=False, First-of-type=False, Last-of-type=True
7270:41853  → Expanded=False, Disabled=True,  First-of-type=False, Last-of-type=False
7270:41857  → Expanded=False, Disabled=True,  First-of-type=True,  Last-of-type=False
7270:41861  → Expanded=False, Disabled=True,  First-of-type=False, Last-of-type=True
```

#### Dark Mode Variants (9)
Same matrix with node IDs `16408:27482` through `16408:27562`

---

### Design Tokens Extracted

#### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `Component Tokens/color-accordiontext-primary-enabled-contained-bg` | `#ffffff` | Light mode background |
| `Component Tokens/color-accordiontext-primary-enabled-contained-text` | `#000000de` (87% black) | Light mode text |
| `Semantic Tokens/background/paper` | `black` | Dark mode background |
| `Semantic Tokens/text/primary` | `white` | Dark mode primary text |
| `Semantic Tokens/text/secondary` | `rgba(255,255,255,0.7)` | Dark mode secondary text |
| `Semantic Tokens/Action/Active` | `#0000008a` (54% black) | Active state |

#### Spacing
| Token | Value | Usage |
|-------|-------|-------|
| `padding-top-accordiontext` | `12px` | Vertical padding |
| `padding-bottom-accordiontext` | `12px` | Vertical padding |
| `padding-left-accordiontext` | `48px` | Content indent (when expanded) |
| `padding-right-accordiontext` | `48px` | Content right padding |
| `radius-unstylediconbutton` | `48px` | Icon button border radius |

#### Typography
| Token | Value |
|-------|-------|
| `Font/Family/Primary` | `Roboto` |
| `Font/Weight/Regular` | `Regular (400)` |
| `Global Tokens/XS` | `16px` (font size) |
| `Font/Letter-Spacing/S` | `0.15px` |
| `Line Height` | `1.5` |

#### Elevation
| Token | Shadow Stack |
|-------|--------------|
| `Elevation/1` | `0px 2px 1px -1px rgba(0,0,0,0.2)`, `0px 1px 1px rgba(0,0,0,0.14)`, `0px 1px 3px rgba(0,0,0,0.12)` |

---

### Component Props (TypeScript Interface)

```typescript
interface AccordionTextVariantProps {
  // Content
  heading?: string;              // Default: "Heading"
  secondaryHeading?: string;     // Default: "Secondary heading"
  content?: string;              // Default: "Content" (shown when expanded)

  // State
  expanded?: boolean;            // Default: false
  disabled?: "True" | "False";   // Default: "False"

  // Position (for grouped accordions)
  firstOfType?: "True" | "False"; // Default: "False"
  lastOfType?: "True" | "False";  // Default: "False"

  // Optional
  secondaryHeading1?: boolean;   // Show/hide secondary heading
  className?: string;            // Custom styling
}
```

---

### Component Anatomy

```
┌─────────────────────────────────────────────────────────────┐
│ AccordionTextVariant                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ AccordionTextSummary                     [Elevation/1]  │ │
│ │ ┌──────┐ ┌─────────────────┐ ┌────────────────────────┐ │ │
│ │ │ Icon │ │ Heading         │ │ Secondary Heading      │ │ │
│ │ │ ↓/→  │ │ (primary text)  │ │ (secondary text)       │ │ │
│ │ └──────┘ └─────────────────┘ └────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ AccordionContent (visible when expanded=true)           │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Content text (padded 48px left/right)               │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Sub-Components Used
- `IconButton/Medium*/Primary/Enabled/False` - Expand/collapse trigger
- `Icons/ChevronLeftOutlined` - Rotated -90° (collapsed) or 90° (expanded)

---

### Behavioral Specifications

| Behavior | Implementation |
|----------|----------------|
| **Expand/Collapse** | Chevron rotates from -90° to 90° |
| **Content reveal** | Content div added to DOM when expanded |
| **Shadow change** | Expanded state uses slightly different shadow offset |
| **Disabled state** | Only available in collapsed state (no expanded+disabled) |

---

### Accessibility Considerations

| Requirement | Status |
|-------------|--------|
| Semantic element | ✅ Uses `<button>` |
| Keyboard navigation | ⚠️ `tabIndex="0"` added dynamically |
| ARIA attributes | ⚠️ `role="button"` added dynamically |
| Focus indicators | ❓ Not visible in extracted code |
| Screen reader | ❓ No `aria-expanded` or `aria-controls` |

**Recommendation**: Add proper ARIA attributes:
```typescript
aria-expanded={expanded}
aria-controls={`accordion-content-${id}`}
```

---

### Extracted Visual Specifications

```css
/* Typography */
font-family: var(--font/family/primary, 'Roboto:Regular', sans-serif);
font-size: var(--global-tokens/xs, 16px);
line-height: 1.5;
letter-spacing: var(--font/letter-spacing/s, 0.15px);

/* Colors - Light Mode */
--light-mode-bg: white;
--light-mode-text: rgba(0, 0, 0, 0.87);

/* Colors - Dark Mode */
--dark-mode-bg: black;
--dark-mode-text: white;
--dark-mode-secondary: rgba(255, 255, 255, 0.7);

/* Elevation */
box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2),
            0px 1px 1px 0px rgba(0,0,0,0.14),
            0px 1px 3px 0px rgba(0,0,0,0.12);
```

---

## Use Cases for AI Design Systems Architect

### 1. Design System Onboarding
AI can analyze any component and provide comprehensive documentation for new team members joining a project.

### 2. Code Generation
Extract design specs and generate production-ready React components with proper TypeScript types.

### 3. Accessibility Auditing
Cross-reference extracted code against WCAG criteria for compliance checks.

### 4. Token Extraction
Pull design tokens directly from components for theme file generation.

### 5. Component Diffing
Compare extracted data over time to detect design system changes.

### 6. Documentation Generation
Automatically generate comprehensive documentation from Figma components.

### 7. Design Review
AI can review new components against established patterns and flag inconsistencies.

---

## Summary

From a single Figma URL, the AI Design Systems Architect extracted:

- **18 component variants** across 2 themes
- **15+ design tokens** (colors, spacing, typography, elevation)
- **Full TypeScript interfaces** with prop types
- **Generated React + Tailwind code** for implementation
- **Component documentation** and external references
- **Visual reference** screenshot
- **Accessibility audit** with recommendations

This demonstrates the capability to onboard onto any design system and provide expert-level analysis comparable to a seasoned design systems architect.
