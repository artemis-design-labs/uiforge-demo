# UI Forge - Experimental Features (test-features branch)

This document covers experimental and in-development features available in the `test-features` branch. For core/stable features, see `CLAUDE.md`.

---

## Table of Contents

- [Screenshot Analyzer](#screenshot-analyzer)
- [Codebase Analyzer](#codebase-analyzer)
- [Accessibility Knowledge Base](#accessibility-knowledge-base)
- [Design Token Management](#design-token-management)
- [Deep Component Extraction](#deep-component-extraction)
- [MCP Server Architecture](#mcp-server-architecture)
- [Storybook Integration](#storybook-integration)
- [Zeroheight Integration](#zeroheight-integration)
- [Product Strategy & Roadmap](#product-strategy--roadmap)
- [External Codebase Analysis](#external-codebase-analysis-creative-hire-case-study)

---

# Screenshot Analyzer

## Overview

Upload PNG/JPG screenshots of any web UI and let AI identify all UI components with bounding boxes. Cross-references against BOTH codebase AND Figma components.

## Three-Panel Layout

- **Left**: Screenshot preview with bounding box overlays + hierarchical component tree
- **Center**: Live component preview
- **Right**: Properties panel + generated React code

## Features

- Click-to-select components (highlights in screenshot)
- Confidence scores for each identified component
- Fuzzy matching using Fuse.js
- Editable component props
- Copyable generated React code

## Access

Modal accessible via orange "Screenshot Analyzer" button in header.

## How It Works

1. User uploads a PNG/JPG screenshot
2. Claude Vision API analyzes the image and identifies UI components with bounding boxes
3. Components are cross-referenced against codebase AND Figma components using fuzzy matching
4. Results displayed in three-panel layout with tree view, preview, and code generation

## Key Files

| File | Purpose |
|------|---------|
| `/apps/frontend/src/types/screenshotAnalyzer.ts` | TypeScript interfaces (BoundingBox, IdentifiedComponent, ComponentMatch, ScreenshotAnalysis) |
| `/apps/frontend/src/store/screenshotSlice.ts` | Redux state management for screenshot analyzer |
| `/apps/frontend/src/app/api/screenshot/analyze/route.ts` | Claude Vision API endpoint |
| `/apps/frontend/src/services/screenshotAnalyzer.ts` | Analysis orchestration and code generation |
| `/apps/frontend/src/services/componentMatcher.ts` | Fuzzy matching using Fuse.js |
| `/apps/frontend/src/components/screenshot/ScreenshotAnalyzerModal.tsx` | Main modal (three-panel layout) |
| `/apps/frontend/src/components/screenshot/ImageUploadZone.tsx` | Drag-drop image upload |
| `/apps/frontend/src/components/screenshot/ComponentTree.tsx` | Hierarchical tree view with confidence badges |
| `/apps/frontend/src/components/screenshot/ScreenshotPreview.tsx` | Screenshot with SVG bounding box overlays |
| `/apps/frontend/src/components/screenshot/ComponentPreview.tsx` | Sandpack live preview |
| `/apps/frontend/src/components/screenshot/IdentifiedComponentDetail.tsx` | Props editor and code panel |

## Dependencies

- `@codesandbox/sandpack-react` - Live React component preview
- `fuse.js` - Fuzzy string matching

---

# Codebase Analyzer

## Overview

Analyze existing React codebases to extract component information.

## Input Methods

- Upload ZIP file (drag-drop)
- Enter GitHub URL (automatically fetched via backend proxy)

## Extracted Information

- Component names
- Props
- File paths
- Dependencies

## Access

Modal accessible via purple "Analyze Codebase" button in header.

## Key Files

| File | Purpose |
|------|---------|
| `/apps/frontend/src/components/CodebaseAnalyzerModal.tsx` | Main modal for codebase analysis |
| `/apps/frontend/src/services/codebaseAnalyzer.ts` | Codebase analysis service |
| `/apps/frontend/src/services/githubFetcher.ts` | GitHub repo fetching (via backend proxy) |
| `/apps/backend/routes/github.js` | Backend proxy for GitHub ZIP downloads (CORS bypass) |

## GitHub Repo Fetching

**Problem:** CORS restrictions prevented fetching GitHub repos directly from the browser

**Solution:** Created backend proxy endpoint `/api/v1/github/fetch-repo` that downloads repo ZIP and streams to frontend.

---

# Accessibility Knowledge Base

## Overview

Comprehensive accessibility knowledge base that enables AI to act as a seasoned accessibility expert. Built on encyclopedic knowledge from WCAG 2.0, 2.1, and 2.2 guidelines, ADA compliance requirements, and ARIA Authoring Practices Guide (APG).

**Key Capability:** The AI can identify potential accessibility violations in components by cross-checking generated code against WCAG success criteria, providing actionable remediation guidance.

## ADA Compliance Timeline

| Deadline | Requirement |
|----------|-------------|
| **April 24, 2026** | State/local government websites must meet WCAG 2.1 Level AA |
| **April 24, 2027** | Smaller entities (under 50,000 population) must comply |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              ACCESSIBILITY KNOWLEDGE BASE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ WCAG Knowledge  │  │ Component Rules │  │   Validator     │  │
│  │     Base        │  │   Database      │  │    Service      │  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤  │
│  │ • 40+ criteria  │  │ • 16 component  │  │ • Code analysis │  │
│  │ • 4 principles  │  │   types         │  │ • Color contrast│  │
│  │ • 3 levels      │  │ • ARIA patterns │  │ • Score (0-100) │  │
│  │ • Techniques    │  │ • Violations    │  │ • Reports       │  │
│  │ • Failures      │  │ • Code examples │  │ • Keyboard test │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `/apps/frontend/src/services/accessibility/wcagKnowledgeBase.ts` | Complete WCAG 2.0/2.1/2.2 criteria database |
| `/apps/frontend/src/services/accessibility/componentAccessibilityRules.ts` | Component-specific accessibility rules for 16 components |
| `/apps/frontend/src/services/accessibility/accessibilityValidator.ts` | Validation service with code analysis and color contrast |
| `/apps/frontend/src/services/accessibility/index.ts` | Module exports and convenience functions |

## WCAG Criteria Coverage

### Principles Covered (POUR)

| Principle | Criteria Count | Key Success Criteria |
|-----------|----------------|----------------------|
| **Perceivable** | 12 | 1.1.1 Non-text Content, 1.4.3 Contrast, 1.4.11 Non-text Contrast |
| **Operable** | 15 | 2.1.1 Keyboard, 2.4.7 Focus Visible, 2.5.8 Target Size |
| **Understandable** | 8 | 3.2.1 On Focus, 3.3.1 Error Identification |
| **Robust** | 5 | 4.1.2 Name Role Value, 4.1.3 Status Messages |

### WCAG Version Coverage

| Version | New Criteria | Status |
|---------|-------------|--------|
| WCAG 2.0 | Core criteria | Complete |
| WCAG 2.1 | Mobile + cognitive | Complete |
| WCAG 2.2 | 9 new criteria (focus, authentication, dragging) | Complete |

### WCAG 2.2 New Criteria Included

- **2.4.11** Focus Not Obscured (Minimum) - AA
- **2.4.12** Focus Not Obscured (Enhanced) - AAA
- **2.4.13** Focus Appearance - AAA
- **2.5.7** Dragging Movements - AA
- **2.5.8** Target Size (Minimum) - AA
- **3.2.6** Consistent Help - A
- **3.3.7** Redundant Entry - A
- **3.3.8** Accessible Authentication (Minimum) - AA
- **3.3.9** Accessible Authentication (Enhanced) - AAA

## Component Accessibility Rules

16 component types with detailed accessibility rules:

| Component | WCAG Criteria | ARIA Pattern | Keyboard Keys |
|-----------|---------------|--------------|---------------|
| **Button** | 1.1.1, 1.4.1, 1.4.3, 1.4.11, 2.1.1, 2.4.7, 2.5.3, 2.5.8, 4.1.2 | button | Enter, Space |
| **IconButton** | 1.1.1, 2.1.1, 2.4.7, 2.5.8, 4.1.2 | button | Enter, Space |
| **TextField** | 1.3.1, 1.3.5, 1.4.3, 2.1.1, 2.4.7, 3.3.1, 3.3.2, 4.1.2 | textbox | Standard text input |
| **TextArea** | 1.3.1, 1.4.3, 2.1.1, 2.4.7, 3.3.1, 3.3.2, 4.1.2 | textbox (multiline) | Standard + Enter |
| **Checkbox** | 1.3.1, 1.4.1, 1.4.11, 2.1.1, 2.4.7, 4.1.2 | checkbox | Space |
| **Tabs** | 1.3.1, 2.1.1, 2.4.7, 4.1.2 | tablist/tab/tabpanel | Arrow keys, Home, End |
| **Alert** | 1.3.1, 1.4.1, 1.4.3, 4.1.3 | alert/status | - |
| **Accordion** | 1.3.1, 2.1.1, 2.4.7, 4.1.2 | accordion | Enter, Space, Arrows |
| **NavItem** | 1.3.1, 2.1.1, 2.4.4, 2.4.7, 4.1.2 | link/menuitem | Enter, Space |
| **SearchInput** | 1.3.1, 1.3.5, 2.1.1, 2.4.7, 3.3.1, 4.1.2 | searchbox | Esc to clear |
| **Dropdown** | 1.3.1, 2.1.1, 2.4.7, 4.1.2 | listbox | Arrows, Enter, Esc |
| **Badge** | 1.3.1, 1.4.1, 1.4.3 | status | - |
| **Chip** | 1.4.1, 1.4.11, 2.1.1, 2.4.7, 4.1.2 | button | Enter, Space, Delete |
| **Avatar** | 1.1.1, 1.4.3, 1.4.11 | img | - |
| **Breadcrumb** | 1.3.1, 2.4.4, 2.4.8, 4.1.2 | navigation | Enter |
| **ProgressLinear** | 1.3.1, 4.1.2 | progressbar | - |

## Accessibility Validator

### Features

| Feature | Description |
|---------|-------------|
| **Code Analysis** | Detects accessible names, roles, keyboard handlers, focus indicators, ARIA states |
| **Color Contrast** | WCAG AA/AAA checks for normal text (4.5:1), large text (3:1), UI components (3:1) |
| **Scoring** | 0-100 accessibility score based on issues found |
| **Reports** | Detailed reports with issues, warnings, recommendations |
| **Keyboard Checklist** | Validates required keyboard interactions per component |

### Color Contrast Functions

```typescript
import { checkColorContrast, getContrastRatio, meetsAAContrast } from '@/services/accessibility';

// Full contrast check
const result = checkColorContrast('#FFFFFF', '#3B82F6');
console.log(result.ratio);              // 3.42
console.log(result.passes.normalTextAA); // false (needs 4.5:1)
console.log(result.passes.largeTextAA);  // true (needs 3:1)
console.log(result.passes.uiComponentAA); // true (needs 3:1)

// Quick AA check
const meetsAA = meetsAAContrast('#000000', '#FFFFFF'); // true
```

### Validation Functions

```typescript
import {
  validateComponent,
  quickA11yCheck,
  getA11yScore,
  getCriticalIssues,
  formatReportAsMarkdown
} from '@/services/accessibility';

// Full validation
const report = validateComponent('Button', buttonCode, 'AA');
console.log(report.passed);        // boolean
console.log(report.score);         // 0-100
console.log(report.issues);        // Critical issues
console.log(report.warnings);      // Non-critical issues
console.log(report.recommendations); // Best practices
console.log(report.keyboardChecklist); // Keyboard requirements

// Quick checks
const passes = quickA11yCheck('TextField', code);  // boolean
const score = getA11yScore('Checkbox', code);      // number
const critical = getCriticalIssues('Tabs', code);  // string[]

// Generate markdown report
const markdown = formatReportAsMarkdown(report);
```

## WCAG Knowledge Base Functions

```typescript
import {
  WCAG_CRITERIA,
  getAllCriteria,
  getCriteriaByLevel,
  getCriteriaByPrinciple,
  getCriteriaByComponent,
  getWCAG22NewCriteria,
  getLevelAACriteria
} from '@/services/accessibility';

// Get all criteria
const all = getAllCriteria();

// Filter by level
const levelAA = getCriteriaByLevel('AA');

// Filter by principle
const perceivable = getCriteriaByPrinciple('Perceivable');

// Get criteria for a component
const buttonCriteria = getCriteriaByComponent('Button');

// Get WCAG 2.2 new criteria
const wcag22New = getWCAG22NewCriteria();
```

## Component Rule Functions

```typescript
import {
  getComponentRules,
  getComponentsForCriterion,
  getAllViolations,
  getViolationsBySeverity,
  getKeyboardRequirements,
  getCodeExamples,
  getComponentNames
} from '@/services/accessibility';

// Get rules for specific component
const buttonRules = getComponentRules('Button');

// Find components affected by a criterion
const components111 = getComponentsForCriterion('1.1.1');

// Get all violations across components
const allViolations = getAllViolations();
const criticalOnly = getViolationsBySeverity('critical');

// Get keyboard requirements for a component
const tabsKeyboard = getKeyboardRequirements('Tabs');

// Get code examples
const examples = getCodeExamples('Checkbox');

// List all supported components
const componentNames = getComponentNames();
```

---

# Design Token Management

## Token Import Flow

1. Export Variables from Figma as JSON (Light.tokens.json, Dark.tokens.json)
2. Import via TokenImportModal - auto-detects Figma Variables format
3. Tokens stored in Redux state, validated automatically
4. Export to code-ready formats or include in generated npm packages

## Token Formats Supported

### Import

- **Figma Variables** (manual JSON export) - Auto-detected, handles complex `$value` objects
- **Style Dictionary** - Standard JSON format
- **Token Studio** - Figma Token Studio exports
- **W3C DTCG** - Design Token Community Group format
- **CSV** - Simple name,value,type format

### Export

- **CSS Custom Properties** - `:root { --color-primary: #3B82F6; }`
- **Tailwind Config** - Theme extension for tailwind.config.js
- **TypeScript theme** - Typed theme object with full IntelliSense
- **Style Dictionary JSON** - For build pipelines
- **W3C DTCG format** - Standards-compliant output

## Key Token Service Files

| File | Purpose |
|------|---------|
| `/apps/frontend/src/services/tokenService.ts` | Import parsers (Figma Variables, Style Dictionary, Token Studio, W3C DTCG, CSV) |
| `/apps/frontend/src/services/tokenExporter.ts` | Export generators for all formats |
| `/apps/frontend/src/services/tokenValidator.ts` | Naming conventions and WCAG contrast validation |
| `/apps/frontend/src/types/tokens.ts` | TypeScript interfaces |
| `/apps/frontend/src/components/TokenImportModal.tsx` | Import UI |
| `/apps/frontend/src/components/TokenExportModal.tsx` | Export UI |
| `/apps/frontend/src/components/TokensSection.tsx` | Token display panel |

---

# Deep Component Extraction

## Overview

The deep extraction API extracts comprehensive design data from a Figma component for AI training and analysis. This is the foundation of the AI Designer Vision - extracting everything possible so an LLM can understand components like a seasoned designer.

## API Endpoint

```
GET /api/figma/deep-extract/{fileKey}/{nodeId}
```

**Requires**: OAuth authentication (user must be logged in via Figma)

## What Gets Extracted

### 1. Component Information
- **Properties**: All VARIANT, BOOLEAN, TEXT, and INSTANCE_SWAP properties with their options
- **Variants**: All variant combinations in a COMPONENT_SET
- **Node IDs**: For referencing specific variants

### 2. Visual Properties
- **Colors**: All fills, strokes, and effect colors with hex, rgba, and hsl values
- **Borders**: Stroke colors, weights, and alignment
- **Corners**: Border radius (uniform or per-corner)
- **Effects**: Drop shadows, inner shadows, blurs with CSS values

### 3. Layout Properties
- **Auto-Layout**: Direction, alignment, padding, gap
- **Spacing**: Extracted padding and gap values across all variants
- **Sizing**: Width/height modes (fixed, auto, hug), min/max constraints

### 4. Typography
- **Font Styles**: Family, weight, size, line height, letter spacing
- **Text Content**: Sample text from text nodes
- **All variations**: Across different component sizes/states

### 5. Structure Tree
- **Complete hierarchy**: All children with their properties
- **Component references**: Instance swap connections
- **Visibility states**: Which elements are shown/hidden per variant

### 6. Inferred Tokens
- **Colors**: Grouped by usage count with suggested names
- **Spacing**: Identified spacing scale with token suggestions
- **Typography**: Font size scale with token suggestions
- **Border Radius**: Radius scale with token suggestions
- **Shadows**: Shadow values with CSS strings

## Usage in Frontend

```typescript
import { figmaService } from '@/services/figma';

// Deep extract a component
const extraction = await figmaService.deepExtract(fileKey, nodeId);

// Access extracted data
console.log(extraction.component.properties); // All component properties
console.log(extraction.visual.colors.unique);  // Unique colors used
console.log(extraction.inferredTokens);        // Suggested tokens
console.log(extraction.structure);             // Full node tree
```

## AI Profile Generation

The extracted data enables generating comprehensive AI profiles:

```json
{
  "aiContext": {
    "summary": "Button component with 9 properties following Material Design patterns...",
    "designPatterns": ["Uses auto-layout", "Follows 4px spacing grid"],
    "colorSemantics": { "Primary": "#3B82F6 - Blue 500 (main action)" },
    "spacingScale": { "small": "8px", "medium": "16px" },
    "accessibilityNotes": ["Focus ring visible", "4.5:1 contrast ratio"]
  }
}
```

## Key Files

| File | Purpose |
|------|---------|
| `/apps/frontend/src/app/api/figma/deep-extract/[fileKey]/[nodeId]/route.ts` | API endpoint |
| `/apps/frontend/src/services/figma.ts` | `figmaService.deepExtract()` method |
| `/docs/sample-button-extraction.json` | Sample output |

---

# MCP Server Architecture

## Overview

UI Forge can expose its functionality as an MCP server, allowing AI coding assistants (Claude Code, Cursor, Copilot) to programmatically generate components, sync documentation, and manage design systems.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        UI FORGE AS MCP HUB                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                           ┌──────────────┐                                   │
│                           │   UI Forge   │                                   │
│                           │  MCP Server  │                                   │
│                           └──────┬───────┘                                   │
│                                  │                                           │
│         ┌────────────────────────┼────────────────────────┐                  │
│         │                        │                        │                  │
│         ▼                        ▼                        ▼                  │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐          │
│  │   Figma     │          │  Storybook  │          │  Zeroheight │          │
│  │   (OAuth)   │          │   (API)     │          │    (API)    │          │
│  └─────────────┘          └─────────────┘          └─────────────┘          │
│                                                                              │
│  AI Clients (Claude Code, Cursor, Copilot) can call UI Forge MCP tools      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## MCP Tools to Expose

```typescript
// UI Forge MCP Server - Tool Definitions
{
  "tools": [
    {
      "name": "uiforge_generate_component",
      "description": "Generate React code from a Figma component",
      "parameters": {
        "figmaUrl": "string - Figma component URL with node-id",
        "framework": "react | vue | svelte - Target framework",
        "includeStories": "boolean - Generate Storybook stories"
      }
    },
    {
      "name": "uiforge_get_design_tokens",
      "description": "Extract design tokens from Figma file",
      "parameters": {
        "figmaUrl": "string - Figma file URL",
        "format": "css | tailwind | typescript | style-dictionary"
      }
    },
    {
      "name": "uiforge_push_to_storybook",
      "description": "Generate and push Storybook stories for a component",
      "parameters": {
        "componentName": "string - Name of the component",
        "storybookPath": "string - Path to Storybook directory"
      }
    },
    {
      "name": "uiforge_sync_zeroheight",
      "description": "Sync component documentation to Zeroheight",
      "parameters": {
        "componentName": "string - Name of the component",
        "zeroheightPageId": "string - Zeroheight page ID",
        "includeCode": "boolean - Include code examples"
      }
    },
    {
      "name": "uiforge_analyze_screenshot",
      "description": "Analyze a UI screenshot and identify components",
      "parameters": {
        "imagePath": "string - Path to screenshot image",
        "matchAgainst": "figma | codebase | both"
      }
    },
    {
      "name": "uiforge_get_component_registry",
      "description": "Get list of all available components in the design system",
      "parameters": {
        "figmaFileKey": "string - Figma file key"
      }
    }
  ]
}
```

## Usage Example

With UI Forge MCP configured, developers can use natural language in AI assistants:

```
Developer: "Generate a Button component from my Figma design system,
            create Storybook stories, and push docs to Zeroheight"

AI Agent calls:
1. uiforge_generate_component({ figmaUrl: "...", includeStories: true })
2. uiforge_push_to_storybook({ componentName: "Button", storybookPath: "./stories" })
3. uiforge_sync_zeroheight({ componentName: "Button", zeroheightPageId: "..." })
```

## Implementation Files (Planned)

| File | Purpose |
|------|---------|
| `/packages/mcp-server/src/index.ts` | MCP server entry point |
| `/packages/mcp-server/src/tools/` | Tool implementations |
| `/packages/mcp-server/package.json` | Package configuration |

## Installation for Users (Planned)

```json
// claude_desktop_config.json or .cursor/mcp.json
{
  "mcpServers": {
    "uiforge": {
      "command": "npx",
      "args": ["@uiforge/mcp-server"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "your_token"
      }
    }
  }
}
```

---

# Storybook Integration

## Overview

UI Forge can automatically generate Storybook stories alongside React components, providing instant visual documentation and testing capabilities.

## Generated Story Format

```typescript
// Auto-generated: Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { FigmaButton } from './FigmaButton';

const meta: Meta<typeof FigmaButton> = {
  title: 'Components/Button',
  component: FigmaButton,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://figma.com/design/xxx?node-id=14-3737',
    },
    docs: {
      description: {
        component: 'Button component from Artemis Design System.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['Small', 'Medium', 'Large'],
    },
    color: {
      control: 'select',
      options: ['Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof FigmaButton>;

export const Primary: Story = {
  args: {
    label: 'Button',
    color: 'Primary',
    size: 'Medium',
    type: 'Filled',
  },
};
```

## Storybook Integration Features

| Feature | Description |
|---------|-------------|
| **Auto-generated stories** | Stories created from Figma property definitions |
| **Figma embed** | Link to original Figma component in Storybook |
| **Controls** | Interactive controls for all VARIANT/BOOLEAN/TEXT props |
| **Docs** | Auto-generated documentation with prop tables |
| **Visual variants** | All color/size/state combinations as separate stories |

## Implementation Files (Planned)

| File | Purpose |
|------|---------|
| `/apps/frontend/src/services/storybookGenerator.ts` | Generate .stories.tsx files |
| `/apps/frontend/src/templates/storybook/` | Story templates |

## Storybook Addons to Include

```json
// Generated package.json devDependencies
{
  "@storybook/addon-essentials": "^7.6.0",
  "@storybook/addon-designs": "^7.0.0",
  "@storybook/addon-a11y": "^7.6.0",
  "@storybook/react": "^7.6.0",
  "@storybook/react-vite": "^7.6.0"
}
```

---

# Zeroheight Integration

## Overview

Zeroheight is a design system documentation platform. UI Forge can push component documentation, code examples, and design tokens to Zeroheight pages automatically.

## Zeroheight API Integration

```typescript
// Zeroheight API endpoints used by UI Forge
const ZEROHEIGHT_API = {
  pushContent: 'POST /api/v1/pages/{pageId}/content',
  getPage: 'GET /api/v1/pages/{pageId}',
  syncTokens: 'POST /api/v1/styleguide/{styleguideId}/tokens',
  getComponents: 'GET /api/v1/styleguide/{styleguideId}/components',
  updateComponent: 'PUT /api/v1/components/{componentId}',
};
```

## What UI Forge Pushes to Zeroheight

### Component Documentation

```markdown
## Button

A versatile button component supporting multiple variants, sizes, and states.

### Figma Source
[View in Figma](https://figma.com/design/xxx?node-id=14-3737)

### Installation
npm install @artemis/design-system

### Usage
import { Button } from '@artemis/design-system';

<Button label="Click me" color="Primary" size="Medium" type="Filled" />

### Properties
| Property | Type | Default | Options |
|----------|------|---------|---------|
| label | TEXT | "Button" | - |
| size | VARIANT | Medium | Small, Medium, Large |

### Accessibility
- Minimum touch target: 44x44px
- Color contrast ratio: 4.5:1 minimum
- Focus ring visible on keyboard navigation
```

## Two-Way Sync Capabilities

| Direction | What Syncs |
|-----------|------------|
| **Figma → UI Forge → Zeroheight** | Component properties, design tokens, visual specs |
| **Zeroheight → UI Forge** | Usage guidelines, do's/don'ts, accessibility notes |
| **Webhook Updates** | Auto-sync when Figma file changes |

## Implementation Files (Planned)

| File | Purpose |
|------|---------|
| `/apps/frontend/src/services/zeroheightService.ts` | Zeroheight API client |
| `/apps/frontend/src/services/zeroheightSync.ts` | Sync orchestration |
| `/apps/backend/routes/zeroheight.js` | API proxy for Zeroheight |

## Environment Variables

```bash
# Add to .env.local
ZEROHEIGHT_API_KEY=your_zeroheight_api_key
ZEROHEIGHT_STYLEGUIDE_ID=your_styleguide_id
```

---

# Product Strategy & Roadmap

## Design Systems Pain Points (AI Opportunities)

Based on analysis of Design Systems podcast transcripts:

### 1. Design-to-Code Translation & Handoff Friction
**AI Opportunity:** Generate production-ready code directly from design intent, with full state coverage built in

### 2. Token Data Format Fragmentation & Naming Chaos
**AI Opportunity:** Automatic mapping/translation between token formats, naming validation

### 3. Documentation That Doesn't Serve Its Audience
**AI Opportunity:** Context-aware, queryable documentation for humans and machines

### 4. Scaling Accessibility Remains Painful
**AI Opportunity:** Automated accessibility auditing at scale, proactive WCAG enforcement

### 5. Contribution Never Scaled
**AI Opportunity:** Natural-language contribution to design systems

### 6. Legacy Product Drift & Migration
**AI Opportunity:** Automated auditing that identifies inconsistencies

### 7. Business Value & Alignment Gaps
**AI Opportunity:** Analytics that demonstrate usage and adoption

### 8. Process & Workflow Observability
**AI Opportunity:** AI that observes actual workflows and surfaces deviations

### 9. Platform & Tooling Complexity
**AI Opportunity:** Framework-agnostic component generation

### 10. The Human Skills Gap in an AI-Native Future
**AI Opportunity:** AI as a learning partner that helps designers iterate faster

## Pain Point to AI Solution Mapping

| Pain Point | AI Solution Category |
|------------|---------------------|
| Design-to-code translation | **Generation** |
| Token fragmentation | **Translation** |
| Documentation gaps | **Intelligence** |
| Accessibility at scale | **Auditing** |
| Contribution bottlenecks | **Democratization** |
| Legacy drift | **Detection** |
| Business value proof | **Analytics** |
| Process observability | **Synthesis** |
| Platform complexity | **Abstraction** |
| Skills gap | **Augmentation** |

## Feature Priority Analysis

### Priority #1: Token Management & Translation
**Status:** Implemented

### Priority #2: AI-Consumable Documentation
**Status:** Planned

### Priority #3: Multi-Framework Support
**Status:** Future consideration

### Priority #4: MCP Server + Storybook + Zeroheight
**Status:** Planned

---

# External Codebase Analysis: Creative Hire Case Study

## Overview

Analyzed the [Creative Hire](https://github.com/Electromau5/creative-hire) codebase - a Next.js 14 application for AI-powered resume optimization.

## Tech Stack Analysis

| Aspect | Details |
|--------|---------|
| **Framework** | Next.js 14 (App Router) + TypeScript 5.3 |
| **Styling** | Tailwind CSS (utility-first, no CSS modules) |
| **UI Library** | None - all 14 components built from scratch |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **State** | React hooks + props drilling (no Redux/Zustand) |
| **AI** | Anthropic Claude SDK |

## Component Inventory

| Component | Type | Figma Equivalent |
|-----------|------|------------------|
| FileUpload | Input | Button + Card + Input |
| JobDescriptionInput | Input | TextArea |
| ThemeSelector | Input | Chip / Button Group |
| ResumePreview | Display | Card + Typography |
| OptimizationStats | Display | Card + Badge |
| Navigation | Layout | NavItem |
| SkillsChart | Viz | Chart wrapper |
| CompatibilityScores | Display | ProgressLinear |

## Transition Readiness

Creative Hire is an **ideal candidate** for UI Forge transition because:

- No existing component library (clean slate)
- Tailwind-based (easy token integration)
- TypeScript props match Figma properties
- Already has theme system to enhance
- Functional components with hooks

## Migration Strategy

1. **Generate** npm package from Figma design system
2. **Install** Add to Creative Hire dependencies
3. **Replace** Swap Tailwind components with Figma components
4. **Validate** Use Screenshot Analyzer to verify visual parity

## Component Gap Analysis

| UI Forge Component | Status | Creative Hire Usage |
|--------------------|--------|---------------------|
| Button | Available | Primary actions |
| TextField | Available | Form inputs |
| TextArea | Available | JobDescriptionInput |
| Tabs | Available | Step navigation |
| NavItem | Available | Navigation |
| IconButton | Available | Toolbar actions |
| SearchInput | Available | Search functionality |
| Card | Needed | Glass containers |
| Select | Needed | Dropdowns |

This case study validates that UI Forge's component coverage (~73%) can support real-world application migrations with minimal gaps.

---

# Implementation Roadmap

## Phase 1: Storybook Story Generation
**Effort:** ~2-3 days

1. Create `storybookGenerator.ts` service
2. Add story templates for each component type
3. Include Storybook generation in package export
4. Add Figma design addon configuration

## Phase 2: UI Forge MCP Server
**Effort:** ~1 week

1. Create MCP server using `@modelcontextprotocol/sdk`
2. Expose core tools (generate_component, get_tokens, etc.)
3. Add authentication handling
4. Publish as npm package: `@uiforge/mcp-server`

## Phase 3: Zeroheight Integration
**Effort:** ~1 week

1. Integrate Zeroheight API
2. Create documentation templates
3. Implement two-way sync
4. Add webhook support for auto-updates

## Phase 4: Full Integration & Testing
**Effort:** ~3-4 days

1. End-to-end testing of MCP → Storybook → Zeroheight flow
2. Documentation and examples
3. Error handling and edge cases
4. Performance optimization

---

# Benefits of MCP Hub Architecture

| Benefit | Description |
|---------|-------------|
| **AI-Native Workflow** | Developers can use natural language to generate and document components |
| **Single Source of Truth** | Figma remains the source, everything else syncs automatically |
| **Reduced Manual Work** | No more manual Storybook stories or documentation updates |
| **Consistency** | Generated code, stories, and docs always match Figma |
| **Scalability** | AI agents can process entire design systems in minutes |
| **Discoverability** | AI assistants can query the design system for guidance |
