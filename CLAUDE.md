# UI Forge Project

UI Forge is a Figma-to-code tool that converts Figma designs into production-ready React components and npm packages.

## Table of Contents
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Authentication Flow](#authentication-flow)
- [Data Flow](#data-flow)
- [Key Features](#key-features)
- [Key Files Reference](#key-files-reference)
- [API Endpoints](#api-endpoints)
- [Component Registry System](#component-registry-system)
- [Adding New Components](#adding-new-components)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Testing Generated Packages](#testing-generated-packages)
- [Recent Fixes & Improvements](#recent-fixes--improvements)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Commands](#commands)

---

## Project Structure

```
uiforge-demo/
├── apps/
│   ├── frontend/          # Next.js 16 application (Vercel)
│   │   ├── src/
│   │   │   ├── app/       # Next.js app router pages
│   │   │   │   ├── api/   # API routes (Figma proxy, package generation)
│   │   │   │   ├── design/page.tsx  # Main design editor page
│   │   │   │   └── login/page.tsx   # Login page
│   │   │   ├── components/
│   │   │   │   ├── figma-components/  # React implementations of Figma components
│   │   │   │   │   ├── FigmaIcons.tsx # Icon library with 50+ icons
│   │   │   │   │   ├── FigmaButton.tsx # Button component
│   │   │   │   │   └── index.tsx      # Component registry
│   │   │   │   ├── screenshot/        # Screenshot analyzer components
│   │   │   │   │   ├── ScreenshotAnalyzerModal.tsx
│   │   │   │   │   ├── ImageUploadZone.tsx
│   │   │   │   │   ├── ComponentTree.tsx
│   │   │   │   │   ├── ScreenshotPreview.tsx
│   │   │   │   │   ├── ComponentPreview.tsx
│   │   │   │   │   └── IdentifiedComponentDetail.tsx
│   │   │   │   ├── codebase/          # Codebase analyzer components
│   │   │   │   ├── ui/                # shadcn/ui components
│   │   │   │   └── FigmaPropertiesPanel.tsx  # Right sidebar
│   │   │   ├── services/
│   │   │   │   ├── figma.ts           # Figma API service
│   │   │   │   ├── codeGenerator.ts   # React code generation
│   │   │   │   ├── packageGenerator.ts # NPM package generation
│   │   │   │   ├── screenshotAnalyzer.ts # Screenshot analysis orchestration
│   │   │   │   ├── componentMatcher.ts # Fuzzy component matching
│   │   │   │   ├── codebaseAnalyzer.ts # Codebase analysis service
│   │   │   │   └── githubFetcher.ts   # GitHub repo fetching
│   │   │   └── store/
│   │   │       ├── figmaSlice.ts      # Figma state (Redux)
│   │   │       ├── layoutSlice.ts     # Layout state (Redux)
│   │   │       ├── codebaseSlice.ts   # Codebase analyzer state
│   │   │       └── screenshotSlice.ts # Screenshot analyzer state
│   │   └── .env.local     # Frontend environment variables
│   │
│   └── backend/           # Express API (Railway)
│       ├── routes/
│       │   ├── figma.js   # Figma API proxy routes
│       │   └── github.js  # GitHub repo proxy (CORS bypass)
│       ├── middleware/
│       │   └── auth.js    # JWT authentication middleware
│       └── server.js      # Express server entry
│
└── CLAUDE.md              # This documentation file
```

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Figma Design   │────▶│   UI Forge      │────▶│  Generated      │
│  File           │     │   App           │     │  NPM Package    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               │ OAuth
                               ▼
                        ┌─────────────────┐
                        │                 │
                        │   Figma API     │
                        │                 │
                        └─────────────────┘
```

### Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Redux Toolkit, shadcn/ui
- **Backend**: Express.js, Node.js
- **Authentication**: Figma OAuth 2.0
- **Deployment**: Vercel (frontend), Railway (backend)

---

## Authentication Flow

1. User clicks "Login with Figma" on `/login` page
2. Redirects to Figma OAuth consent screen
3. Figma redirects back to `/api/auth/callback` with authorization code
4. Backend exchanges code for access token
5. Access token stored in HTTP-only cookie (`figma_access_token`)
6. All subsequent Figma API calls include this token

### Key Files
- `/apps/frontend/src/app/api/auth/callback/route.ts` - OAuth callback handler
- `/apps/frontend/src/app/api/auth/me/route.ts` - Get current user
- `/apps/backend/middleware/auth.js` - JWT verification middleware

---

## Data Flow

### Loading a Figma File
```
User enters Figma URL
       │
       ▼
figmaService.loadFile(url)
       │
       ▼
Backend: GET /api/v1/figma/file/:fileKey?depth=3
       │
       ▼
Figma API: GET /v1/files/:fileKey
       │
       ▼
Parse document tree → Extract components
       │
       ▼
Store in Redux: figmaSlice.setFileData()
       │
       ▼
Render component tree in left sidebar
```

### Selecting a Component
```
User clicks component in tree
       │
       ▼
dispatch(setSelectedComponent(nodeId, name))
       │
       ▼
Fetch component image: figmaService.getComponentImage()
       │
       ▼
Load properties from COMPONENT_REGISTRY (fallback)
  or from Figma API componentPropertyDefinitions
       │
       ▼
Display in FigmaPropertiesPanel (right sidebar)
       │
       ▼
Generate React code via codeGenerator.ts
```

### Generating NPM Package
```
User clicks "Generate Package" button
       │
       ▼
PackageGeneratorModal opens → Configure name, version
       │
       ▼
POST /api/package/generate
       │
       ▼
packageGenerator.ts creates:
  - package.json
  - tsconfig.json
  - src/index.ts (exports)
  - src/components/*.tsx (React components)
  - src/theme.ts (design tokens)
  - README.md
       │
       ▼
JSZip bundles files → Download as .zip
```

---

## Key Features

### 1. Figma Integration
- OAuth authentication with Figma
- Load components from any Figma file via URL
- Display component properties and preview images
- Figma property types supported:
  - `BOOLEAN` - Toggle switches (e.g., Icon left, Icon right)
  - `VARIANT` - Dropdown selectors (e.g., Size, Color, State, Type)
  - `TEXT` - Text input fields (e.g., Button label)
  - `INSTANCE_SWAP` - Instance swappable components (e.g., icons)

### 2. Code Generation
- Generate React component code from Figma properties
- Display code in collapsible accordion panels
- Resizable right sidebar for better code visibility
- Live preview of component with current property values

### 3. NPM Package Generation (MUI-style)
- Generate complete npm packages from Figma components
- Includes: package.json, tsconfig.json, theme.ts, README.md
- Downloads as zip file
- Uses tsup for building (ESM, CJS, DTS)

### 4. UI Features
- LightMode components render on white background
- DarkMode components render on black background
- Grid pattern shown when no component selected
- Resizable sidebars (left: file tree, right: properties)

### 5. Codebase Analyzer
- Analyze existing React codebases to extract component information
- **Two input methods:**
  - Upload ZIP file (drag-drop)
  - Enter GitHub URL (automatically fetched via backend proxy)
- Extracts: Component names, props, file paths, dependencies
- Results stored in Redux for cross-referencing with other features
- Modal accessible via purple "Analyze Codebase" button in header

### 6. Screenshot Analyzer (NEW - January 2026)
- Upload PNG/JPG screenshots of any web UI
- AI (Claude Vision) identifies all UI components with bounding boxes
- Cross-references against BOTH codebase AND Figma components
- **Three-panel layout:**
  - Left: Screenshot preview with bounding box overlays + hierarchical component tree
  - Center: Live component preview
  - Right: Properties panel + generated React code
- Features:
  - Click-to-select components (highlights in screenshot)
  - Confidence scores for each identified component
  - Fuzzy matching using Fuse.js
  - Editable component props
  - Copyable generated React code
- Modal accessible via orange "Screenshot Analyzer" button in header

---

## Key Files Reference

### Services
| File | Purpose |
|------|---------|
| `/apps/frontend/src/services/figma.ts` | Figma API service (load files, images, properties) |
| `/apps/frontend/src/services/codeGenerator.ts` | Generates React component code from Figma properties |
| `/apps/frontend/src/services/packageGenerator.ts` | Generates complete npm package structure |

### API Routes (Frontend - Next.js)
| Route | Purpose |
|-------|---------|
| `/api/auth/callback` | Figma OAuth callback |
| `/api/auth/me` | Get current authenticated user |
| `/api/auth/logout` | Clear auth cookies |
| `/api/figma/image/[fileKey]/[nodeId]` | Get component image URL |
| `/api/figma/component/[fileKey]/[nodeId]` | Get component properties |
| `/api/figma/file-components/[fileKey]` | Get all component definitions |
| `/api/package/generate` | Generate and download npm package |
| `/api/screenshot/analyze` | Analyze screenshot with Claude Vision API |

### API Routes (Backend - Express)
| Route | Purpose |
|-------|---------|
| `/api/v1/figma/file/:fileKey` | Load Figma file structure |
| `/api/v1/figma/instance/:fileKey/:nodeId` | Load specific component data |
| `/api/v1/github/fetch-repo` | Proxy for fetching GitHub repos (CORS bypass) |

### Components
| File | Purpose |
|------|---------|
| `/apps/frontend/src/components/FigmaPropertiesPanel.tsx` | Right sidebar with properties and code display |
| `/apps/frontend/src/components/PackageGeneratorModal.tsx` | Modal for configuring package generation |
| `/apps/frontend/src/components/CodeDisplay.tsx` | Syntax-highlighted code block with copy button |
| `/apps/frontend/src/components/layout/AppHeader.tsx` | Header with "Generate Package" button |

### State Management (Redux)
| File | State |
|------|-------|
| `/apps/frontend/src/store/figmaSlice.ts` | `fileKey`, `fileData`, `selectedComponentId`, `selectedComponentName`, `figmaComponentProps`, `iconRegistry`, `componentImageUrl` |
| `/apps/frontend/src/store/layoutSlice.ts` | `leftSidebarWidth`, `rightSidebarWidth` |
| `/apps/frontend/src/store/codebaseSlice.ts` | `isModalOpen`, `isAnalyzing`, `currentAnalysis`, `uploadedFiles`, `error` |
| `/apps/frontend/src/store/screenshotSlice.ts` | `isModalOpen`, `uploadedImage`, `isAnalyzing`, `currentAnalysis`, `selectedComponentId`, `expandedNodeIds`, `previewProps` |

### Screenshot Analyzer Files
| File | Purpose |
|------|---------|
| `/apps/frontend/src/types/screenshotAnalyzer.ts` | TypeScript interfaces for screenshot analysis |
| `/apps/frontend/src/app/api/screenshot/analyze/route.ts` | Claude Vision API endpoint for screenshot analysis |
| `/apps/frontend/src/services/screenshotAnalyzer.ts` | Analysis orchestration, code generation |
| `/apps/frontend/src/services/componentMatcher.ts` | Fuzzy matching with Fuse.js |
| `/apps/frontend/src/components/screenshot/ScreenshotAnalyzerModal.tsx` | Main modal container |
| `/apps/frontend/src/components/screenshot/ImageUploadZone.tsx` | Drag-drop image upload |
| `/apps/frontend/src/components/screenshot/ComponentTree.tsx` | Hierarchical tree view |
| `/apps/frontend/src/components/screenshot/ScreenshotPreview.tsx` | Screenshot with bounding box overlays |
| `/apps/frontend/src/components/screenshot/ComponentPreview.tsx` | Live component preview (Sandpack) |
| `/apps/frontend/src/components/screenshot/IdentifiedComponentDetail.tsx` | Props and code panel |

### Codebase Analyzer Files
| File | Purpose |
|------|---------|
| `/apps/frontend/src/components/CodebaseAnalyzerModal.tsx` | Main modal for codebase analysis |
| `/apps/frontend/src/services/codebaseAnalyzer.ts` | Codebase analysis service |
| `/apps/frontend/src/services/githubFetcher.ts` | GitHub repo fetching (via backend proxy) |
| `/apps/backend/routes/github.js` | Backend proxy for GitHub ZIP downloads (CORS bypass) |

---

## API Endpoints

### Backend (Express - Railway)

#### `GET /api/v1/figma/file/:fileKey`
Load Figma file structure.

**Query params:**
- `depth` (optional, default: 3) - Tree depth limit (1-10)
- `partial` (optional) - Load partial data for large files

**Response:** Figma file document tree

#### `GET /api/v1/figma/instance/:fileKey/:nodeId`
Load specific instance/component data.

#### `DELETE /api/v1/figma/cache/file/:fileKey`
Clear cached data for a file.

---

## Component Registry System

The app uses an **auto-discovery** system for component properties:

1. **Primary Source**: Figma API `componentPropertyDefinitions` - Properties are automatically extracted from the Figma file
2. **Fallback**: `COMPONENT_REGISTRY` in `/apps/frontend/src/components/figma-components/index.tsx` for React rendering

### Auto-Discovery Feature (January 2026)
Properties are now automatically discovered from the Figma API rather than manually defined in `COMPONENT_REGISTRY`. This ensures:
- Properties ALWAYS match the Figma file exactly
- No manual property definitions needed when adding new components
- INSTANCE_SWAP options are automatically populated from `preferredValues`
- Node IDs are automatically converted to icon names using the icon registry

### Registry Structure
```typescript
export const COMPONENT_REGISTRY: Record<string, {
    component: React.ComponentType<any>;  // React component
    defaultProps: Record<string, any>;     // Default property values
    nodeId: string;                         // Figma node ID
    figmaProperties?: FigmaPropertyDefinition[];  // Property definitions
}> = {
    'Button/LightMode': {
        component: FigmaButton,
        defaultProps: { label: 'Button', size: 'Large', ... },
        nodeId: '14:3737',
        figmaProperties: [
            { name: 'Text', type: 'TEXT', defaultValue: 'Button' },
            { name: 'Size', type: 'VARIANT', defaultValue: 'Large', options: ['Small', 'Medium', 'Large'] },
            // ...
        ]
    }
};
```

### Name Aliases
Handle Figma naming variations:
```typescript
const NAME_ALIASES: Record<string, string> = {
    'ButtonVariant/LightMode': 'Button/LightMode',
    'ButtonVariant/DarkMode': 'Button/DarkMode',
};
```

### Currently Supported Components
- `Accordion/LightMode`, `Accordion/DarkMode`
- `Alert/LightMode`, `Alert/DarkMode`
- `Avatar/LightMode`, `Avatar/DarkMode`
- `Badge/LightMode`, `Badge/DarkMode`
- `Button/LightMode`, `Button/DarkMode`
- `Breadcrumb/Light Mode`, `Breadcrumb/Dark Mode`
- `Checkbox/LightMode`, `Checkbox/DarkMode`
- `Chip/LightMode`, `Chip/DarkMode`
- `Dropdown/LightMode`
- `IconButton/LightMode`, `IconButton/DarkMode` (NEW - January 2026)
- `NavItem/LightMode`, `NavItem/DarkMode` (NEW - January 2026)
- `ProgressLinear/LightMode`
- `SearchInput/LightMode`, `SearchInput/DarkMode` (NEW - January 2026)
- `Tabs/LightMode`, `Tabs/DarkMode` (NEW - January 2026)
- `TextArea/LightMode`, `TextArea/DarkMode` (NEW - January 2026)
- `TextField/LightMode`, `TextField/DarkMode` (NEW - January 2026)

### New Components Added (January 2026)

#### Alert Component
- **Properties**: Title (TEXT), Description (TEXT), Severity (VARIANT), Variant (VARIANT), Show Icon (BOOLEAN), Show Close (BOOLEAN), Show Title (BOOLEAN), Icon (INSTANCE_SWAP)
- **Variants**: Severity (Error, Warning, Info, Success), Variant (Filled, Outlined, Standard)
- **Files**: `FigmaAlert.tsx`

#### Avatar Component
- **Properties**: Initials (TEXT), Alt (TEXT), Size (VARIANT), Variant (VARIANT), Color (VARIANT), Show Image (BOOLEAN), Show Icon (BOOLEAN)
- **Variants**: Size (Small, Medium, Large), Variant (Circular, Rounded, Square), Color (Primary, Secondary, Error, Warning, Info, Success)
- **Files**: `FigmaAvatar.tsx`

#### Badge Component
- **Properties**: Content (TEXT), Color (VARIANT), Variant (VARIANT), Position (VARIANT), Size (VARIANT), Show Badge (BOOLEAN), Show Zero (BOOLEAN)
- **Variants**: Color (Primary-Success), Variant (Standard, Dot), Position (Top/Bottom Right/Left), Size (Small, Medium, Large)
- **Files**: `FigmaBadge.tsx`

#### Checkbox Component
- **Properties**: Label (TEXT), Color (VARIANT), Size (VARIANT), State (VARIANT), Checked (BOOLEAN), Indeterminate (BOOLEAN), Disabled (BOOLEAN), Show Label (BOOLEAN)
- **Variants**: Color (Primary-Success), Size (Small, Medium, Large), State (Enabled, Hovered, Focused, Disabled)
- **Files**: `FigmaCheckbox.tsx`

#### Chip Component
- **Properties**: Label (TEXT), Color (VARIANT), Variant (VARIANT), Size (VARIANT), State (VARIANT), Disabled (BOOLEAN), Deletable (BOOLEAN), Clickable (BOOLEAN), Show Icon (BOOLEAN), Show Avatar (BOOLEAN), Icon (INSTANCE_SWAP)
- **Variants**: Color (Primary-Success + Default), Variant (Filled, Outlined), Size (Small, Medium), State (Enabled, Hovered, Focused, Disabled)
- **Files**: `FigmaChip.tsx`

---

## Adding New Components

### Step 1: Create React Component
Create `/apps/frontend/src/components/figma-components/FigmaNewComponent.tsx`:

```typescript
'use client';
import React from 'react';

export interface FigmaNewComponentProps {
    // Map Figma properties to React props
    label?: string;
    variant?: 'Primary' | 'Secondary';
    disabled?: boolean;
    darkMode?: boolean;
}

export function FigmaNewComponent({
    label = 'Default',
    variant = 'Primary',
    disabled = false,
    darkMode = false,
}: FigmaNewComponentProps) {
    // Implementation
    return (
        <div data-node-id="XX:XXXX" data-figma-props={JSON.stringify({ variant, disabled })}>
            {/* Component JSX */}
        </div>
    );
}

export default FigmaNewComponent;
```

### Step 2: Register in Component Registry
Update `/apps/frontend/src/components/figma-components/index.tsx`:

```typescript
import { FigmaNewComponent } from './FigmaNewComponent';

// Add to COMPONENT_REGISTRY
'NewComponent/LightMode': {
    component: FigmaNewComponent,
    defaultProps: {
        label: 'Default',
        variant: 'Primary',
        disabled: false,
        darkMode: false,
    },
    nodeId: 'XX:XXXX',  // Get from Figma
    figmaProperties: [
        { name: 'Label', type: 'TEXT', defaultValue: 'Default' },
        { name: 'Variant', type: 'VARIANT', defaultValue: 'Primary', options: ['Primary', 'Secondary'] },
        { name: 'Disabled', type: 'BOOLEAN', defaultValue: false },
    ],
},

// Export the component
export { FigmaNewComponent } from './FigmaNewComponent';
```

### Step 3: Add Name Aliases (if needed)
```typescript
const NAME_ALIASES: Record<string, string> = {
    // Add if Figma uses different naming
    'NewComponentVariant/LightMode': 'NewComponent/LightMode',
};
```

---

## Environment Variables

### Frontend (`/apps/frontend/.env.local`)
```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Figma OAuth (for direct API calls)
FIGMA_CLIENT_ID=your_figma_client_id
FIGMA_CLIENT_SECRET=your_figma_client_secret
FIGMA_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

### Backend (`/apps/backend/.env`)
```bash
# Server
PORT=3001

# Figma OAuth
FIGMA_CLIENT_ID=your_figma_client_id
FIGMA_CLIENT_SECRET=your_figma_client_secret
FIGMA_REDIRECT_URI=http://localhost:3000/api/auth/callback

# JWT Secret (for token signing)
JWT_SECRET=your_jwt_secret

# CORS
FRONTEND_URL=http://localhost:3000
```

### Production Environment Variables
Set these in Vercel (frontend) and Railway (backend) dashboards.

---

## Deployment

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set root directory to `apps/frontend`
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push to `main`

### Backend (Railway)
1. Connect GitHub repo to Railway
2. Set root directory to `apps/backend`
3. Set environment variables in Railway dashboard
4. Deploy automatically on push to `main`

### Figma App Configuration
In Figma Developer Console:
- **Callback URL**: `https://your-frontend-url.vercel.app/api/auth/callback`
- **Scopes**: `file_read`, `file_variables:read`

---

## Testing Generated Packages

1. Generate package from UI Forge (click green "Generate Package" button)
2. Extract the downloaded zip
3. Run `npm install` and `npm run build` in the package directory
4. Use `npm link` to link locally
5. In test project: `npm link @myorg/design-system`

### Test Project Location
`/Users/prits6/Desktop/Wealth/Artemis Design Labs/Artemis Design Labs/UI Forge/test-design-system`

---

## Recent Fixes & Improvements

### Session: January 24, 2026 (Current)

#### Screenshot Analysis Test & Component Gap Analysis
Performed a test of the screenshot analyzer feature using a Reddit "Create Post" page screenshot to identify which UI components could be matched against the registry.

**Test Results:**
- Screenshot analyzed: Reddit Create Post page
- Components identified: Buttons, Avatars, Badges, Dropdowns, Text Fields, Tabs, Navigation Items, Icon Buttons, Search Input
- Registry coverage before this session: ~40% (6 of 15 component types)

**Identified Component Gaps:**
| UI Element | Missing Component |
|------------|-------------------|
| Text Input (Title field) | `TextField/Input` |
| Text Area (Body text) | `TextArea` |
| Search Bar | `SearchInput` |
| Tabs (Text, Images & Video, Link, Poll) | `Tabs/TabBar` |
| Navigation List (Home, Popular, etc.) | `NavItem/ListItem` |
| Rich Text Toolbar buttons | `IconButton` |

#### Added 6 New Figma Components
Implemented 6 new components to fill the identified gaps:

1. **FigmaTextField** - Text input component
   - Variants: Outlined, Filled, Standard
   - Sizes: Small, Medium
   - States: Enabled, Hovered, Focused, Disabled, Error
   - Features: Label, helper text, required indicator, full width
   - File: `apps/frontend/src/components/figma-components/FigmaTextField.tsx`

2. **FigmaTextArea** - Multi-line text input component
   - Variants: Outlined, Filled
   - States: Enabled, Hovered, Focused, Disabled, Error
   - Features: Label, helper text, character count, rows configuration
   - File: `apps/frontend/src/components/figma-components/FigmaTextArea.tsx`

3. **FigmaTabs** - Tab navigation component
   - Variants: Standard, Fullwidth
   - Colors: Primary, Secondary
   - Orientations: Horizontal, Vertical
   - Features: Active indicator, disabled tabs, centered option
   - File: `apps/frontend/src/components/figma-components/FigmaTabs.tsx`

4. **FigmaNavItem** - Navigation list item component
   - Variants: Default, Compact
   - States: Default, Hovered, Active, Disabled
   - Features: Icon support, badge, selected state
   - File: `apps/frontend/src/components/figma-components/FigmaNavItem.tsx`

5. **FigmaIconButton** - Icon-only button component
   - Variants: Standard, Contained, Outlined
   - Sizes: Small, Medium, Large
   - Colors: Default, Primary, Secondary, Error, Warning, Info, Success
   - States: Enabled, Hovered, Focused, Disabled
   - File: `apps/frontend/src/components/figma-components/FigmaIconButton.tsx`

6. **FigmaSearchInput** - Search input with icon component
   - Variants: Outlined, Filled
   - Sizes: Small, Medium
   - States: Enabled, Hovered, Focused, Disabled
   - Features: Clear button, full width option
   - File: `apps/frontend/src/components/figma-components/FigmaSearchInput.tsx`

**Files Modified:**
- `apps/frontend/src/components/figma-components/index.tsx` - Added imports, registry entries, name aliases, and exports for all 6 new components

**Registry Coverage After This Session:** ~73% (11 of 15 component types)

---

### Session: January 23, 2026

#### Screenshot to Components Analyzer (Major Feature)
Built a complete feature for analyzing UI screenshots and identifying components:

**New Files Created:**
- `src/types/screenshotAnalyzer.ts` - TypeScript interfaces (BoundingBox, IdentifiedComponent, ComponentMatch, ScreenshotAnalysis)
- `src/store/screenshotSlice.ts` - Redux state management for screenshot analyzer
- `src/app/api/screenshot/analyze/route.ts` - Claude Vision API endpoint
- `src/services/screenshotAnalyzer.ts` - Analysis orchestration and code generation
- `src/services/componentMatcher.ts` - Fuzzy matching using Fuse.js
- `src/components/screenshot/ScreenshotAnalyzerModal.tsx` - Main modal (three-panel layout)
- `src/components/screenshot/ImageUploadZone.tsx` - Drag-drop image upload
- `src/components/screenshot/ComponentTree.tsx` - Hierarchical tree view with confidence badges
- `src/components/screenshot/ScreenshotPreview.tsx` - Screenshot with SVG bounding box overlays
- `src/components/screenshot/ComponentPreview.tsx` - Sandpack live preview
- `src/components/screenshot/IdentifiedComponentDetail.tsx` - Props editor and code panel

**Files Modified:**
- `src/store/index.ts` - Added screenshotSlice
- `src/components/layout/AppHeader.tsx` - Added orange "Screenshot Analyzer" button

**Dependencies Added:**
- `@codesandbox/sandpack-react` - Live React component preview
- `fuse.js` - Fuzzy string matching

**How It Works:**
1. User uploads a PNG/JPG screenshot
2. Claude Vision API analyzes the image and identifies UI components with bounding boxes
3. Components are cross-referenced against codebase AND Figma components using fuzzy matching
4. Results displayed in three-panel layout with tree view, preview, and code generation

#### GitHub Repo Fetching via Backend Proxy
- **Problem:** CORS restrictions prevented fetching GitHub repos directly from the browser
- **Solution:** Created backend proxy endpoint `/api/v1/github/fetch-repo`
- **File:** `apps/backend/routes/github.js` - Downloads repo ZIP and streams to frontend

#### Duplicate React Key Fix
- **Problem:** Components in same file had duplicate keys (using only `filePath`)
- **Solution:** Changed key to `${component.filePath}:${component.name}`
- **Files:** `ComponentList.tsx`, `AnalysisResults.tsx`

---

### Session: January 21, 2026

#### Added 5 New Figma Components
Implemented 5 new components following the same pattern as the Button component:

1. **FigmaAlert** - Alert/notification component with severity levels and variants
   - Supports: Error, Warning, Info, Success severities
   - Variants: Filled, Outlined, Standard
   - Features: Icon swap, title toggle, close button toggle
   - File: `apps/frontend/src/components/figma-components/FigmaAlert.tsx`

2. **FigmaAvatar** - Avatar component with initials, icons, or images
   - Sizes: Small (32px), Medium (40px), Large (56px)
   - Shapes: Circular, Rounded, Square
   - Colors: Primary, Secondary, Error, Warning, Info, Success
   - File: `apps/frontend/src/components/figma-components/FigmaAvatar.tsx`

3. **FigmaBadge** - Badge overlay component
   - Variants: Standard (with number), Dot
   - Positions: Top Right, Top Left, Bottom Right, Bottom Left
   - Features: Show/hide badge, show zero option
   - File: `apps/frontend/src/components/figma-components/FigmaBadge.tsx`

4. **FigmaCheckbox** - Checkbox with three states
   - States: Unchecked, Checked, Indeterminate
   - Interactive states: Enabled, Hovered, Focused, Disabled
   - Features: Label toggle, color variants
   - File: `apps/frontend/src/components/figma-components/FigmaCheckbox.tsx`

5. **FigmaChip** - Chip/tag component
   - Variants: Filled, Outlined
   - Features: Deletable, Clickable, Icon support, Avatar support
   - Interactive states: Enabled, Hovered, Focused, Disabled
   - File: `apps/frontend/src/components/figma-components/FigmaChip.tsx`

All components registered in `COMPONENT_REGISTRY` with both LightMode and DarkMode variants.

#### API Route Update
- Added "alert" to `ALLOWED_COMPONENT_PREFIXES` in file-components API
- File: `apps/frontend/src/app/api/figma/file-components/[fileKey]/route.ts`

#### Property Loading Priority Fix
- **Problem**: Figma API was returning nested component properties instead of the component's own `componentPropertyDefinitions`
- **Solution**: Changed priority order so `COMPONENT_REGISTRY` is checked FIRST for supported components
- This ensures components we've explicitly defined show the correct Figma properties
- File: `apps/frontend/src/app/design/page.tsx`

#### Comprehensive Name Aliases
- Added extensive `NAME_ALIASES` mapping to handle various Figma naming conventions
- Supports patterns like: `Component/LightMode`, `Component/Light Mode`, `ComponentVariant/LightMode`
- File: `apps/frontend/src/components/figma-components/index.tsx`

#### INSTANCE_SWAP Node ID to Icon Name Conversion
- **Problem**: Figma API returns node IDs (like "16959:24567") for INSTANCE_SWAP values, but React components expect icon names (like "Star")
- **Solution**: Added `getIconNameFromNodeId` helper that converts Figma node IDs to icon names using the icon registry
- Conversion happens in both `getComponentProps()` (design page) and `FigmaPropertiesPanel`
- Files modified:
  - `apps/frontend/src/app/design/page.tsx`
  - `apps/frontend/src/components/FigmaPropertiesPanel.tsx`

#### Auto-Discovery from Figma API (Major Feature)
- **Problem**: Component properties were manually defined in COMPONENT_REGISTRY, which could drift from actual Figma file
- **Solution**: Implemented auto-discovery system that fetches properties directly from Figma API
- **Changes**:
  1. **Removed ALLOWED_COMPONENT_PREFIXES filter** - All components from Figma file are now processed (both frontend and backend)
  2. **Reversed property priority** - Figma API (`fileComponentDefinitions`) is now the PRIMARY source
  3. **Added `convertPropsToState` helper** - Automatically converts INSTANCE_SWAP node IDs to icon names and extracts options from `preferredValues`
  4. **COMPONENT_REGISTRY role changed** - Now used as FALLBACK for React rendering when API fails
- Files modified:
  - `apps/frontend/src/app/api/figma/file-components/[fileKey]/route.ts` - Removed filter, processes ALL components
  - `apps/backend/routes/figma.js` - Removed filter from backend as well
  - `apps/frontend/src/app/design/page.tsx` - Changed priority order, added conversion helper, added COMPONENT_REGISTRY fallback

#### Detailed Error Logging for Authentication Issues
- **Problem**: 403 errors from Figma API were difficult to diagnose (token expiration, file access, etc.)
- **Solution**: Added comprehensive error logging with suggestions
- **Changes**:
  1. **Frontend API route** - Logs token presence, returns detailed error with `suggestion` and `debugInfo`
  2. **Backend auth middleware** - Logs token source (cookie vs header), user email, Figma token presence
  3. **Backend file-components** - Returns specific error messages with suggestions for 401/403 errors
  4. **Frontend figma service** - Logs detailed error info and shows `💡 Suggestion:` in console
- **Error response format**:
  ```json
  {
    "error": "Access denied to this Figma file",
    "suggestion": "Your Figma account may not have access...",
    "debugInfo": { "userEmail": "...", "tokenPresent": true }
  }
  ```
- Files modified:
  - `apps/frontend/src/app/api/figma/file-components/[fileKey]/route.ts`
  - `apps/backend/routes/figma.js`
  - `apps/frontend/src/services/figma.ts`

### Known Architecture Issues (Resolved January 2026)

#### ✅ RESOLVED: Ensuring Exact Figma Property Replication

1. **~~Manual COMPONENT_REGISTRY~~** ✅ RESOLVED
   - Now using auto-discovery from Figma API `componentPropertyDefinitions`
   - `COMPONENT_REGISTRY` only used for React component rendering, not property definitions

2. **Component Name Matching** (Improved)
   - Fixed with extensive NAME_ALIASES and multi-strategy partial matching
   - Future improvement: Use Figma node IDs as primary keys

3. **~~INSTANCE_SWAP Options~~** ✅ RESOLVED
   - Now automatically populated from `preferredValues` in Figma API
   - Node IDs automatically converted to icon names using icon registry

4. **Property Name Consistency** ✅ RESOLVED
   - Properties now come directly from Figma API, ensuring exact match

---

### Session: January 2026 (Previous)

#### Large File Loading (502 Fix)
- Added `depth` parameter to Figma file fetch endpoint (default: 3)
- Prevents timeout errors on large Figma files
- Files modified:
  - `apps/backend/routes/figma.js` - Added depth query parameter
  - `apps/frontend/src/services/figma.ts` - Pass depth to API

#### Button Component - All 9 Properties
- Added support for all 9 Figma Button properties:
  - **VARIANT**: Size, Color, State, Type
  - **TEXT**: Text (button label)
  - **BOOLEAN**: Icon left, Icon right
  - **INSTANCE_SWAP**: Left Icon, Right icon
- Added `INSTANCE_SWAP` type to `FigmaPropertyDefinition`
- Added name aliases for component matching (ButtonVariant → Button)
- Files modified:
  - `apps/frontend/src/components/figma-components/index.tsx`
  - `apps/frontend/src/components/figma-components/FigmaButton.tsx`

#### Icon Registry for Instance Swap
- Added `iconRegistry` to Redux store for tracking available icons
- Enables friendly names in INSTANCE_SWAP dropdowns
- Files modified:
  - `apps/frontend/src/store/figmaSlice.ts`
  - `apps/frontend/src/components/FigmaPropertiesPanel.tsx`

#### LightMode/DarkMode Container Styling
- White container for LightMode components
- Black container for DarkMode components
- Grid pattern only when no component selected
- Files modified:
  - `apps/frontend/src/app/design/page.tsx`

#### Properties Panel UI Update
- White input fields with dark borders (was dark background)
- Labels and fields side-by-side on same line
- Removed type badges (TEXT, BOOLEAN, INSTANCE_SWAP)
- Files modified:
  - `apps/frontend/src/components/FigmaPropertiesPanel.tsx`

#### Icon Swapping for Button Component
- Created comprehensive icon library with 50+ icons from Figma Icons component set
- Button component now supports dynamic icon selection via INSTANCE_SWAP properties
- Icons render dynamically in the React component based on selection
- Available icons: ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Search, Settings, Home, Add, Check, Close, Person, Star, Edit, Save, Trash, and many more
- Files created/modified:
  - `apps/frontend/src/components/figma-components/FigmaIcons.tsx` (NEW) - Icon library with ICON_REGISTRY
  - `apps/frontend/src/components/figma-components/FigmaButton.tsx` - Added leftIcon/rightIcon props
  - `apps/frontend/src/components/figma-components/index.tsx` - Added AVAILABLE_ICONS to INSTANCE_SWAP options

### Earlier Fixes
- Fixed duplicate parameter names in generated code (deduplicateProps function)
- Fixed missing export on Props interface
- Removed hardcoded variant value assumptions in code generator
- Fixed JSZip response type for Next.js API routes

---

## Recent Git Commits

```
dd6a6a0 Add icon swapping support for Button component
df2d75a Comprehensive CLAUDE.md for developer handoff
4348601 Update CLAUDE.md with recent session work
38f7a46 Update component properties panel UI styling
5947f99 Remove inner container - single white/black background only
2ea942c Add white/black container for LightMode/DarkMode components
3c24d5d Add all 9 Button properties and fix component name matching
a07653c Add depth limit to file fetch endpoint for large files
```

---

## Known Limitations

1. **React Components Manual**: New Figma components need React implementations added to `COMPONENT_REGISTRY` for interactive preview (properties auto-discovered from API)
2. **Icon Library is Manual**: New icons must be added to `FigmaIcons.tsx` and `ICON_REGISTRY` for rendering
3. **Large Files**: Files with >100 components may timeout; uses `depth=10` by default
4. **No Real-time Sync**: Changes in Figma require manual refresh in UI Forge
5. **Single File at a Time**: Cannot load multiple Figma files simultaneously

---

## Troubleshooting

### 502 Error Loading Figma File
- **Cause**: File too large, API timeout
- **Fix**: Already implemented - uses `depth=3` by default
- **Manual override**: Modify depth in `figmaService.loadFile()`

### Component Properties Not Showing
- **Cause**: Component not in `COMPONENT_REGISTRY` or name mismatch
- **Fix**: Add component to registry or add name alias
- **Debug**: Check console for `🔎 getFigmaProperties` logs

### OAuth Token Expired
- **Symptom**: 401 errors on Figma API calls
- **Fix**: Log out and log back in via Figma OAuth

### Image Not Loading
- **Cause**: Node ID mismatch or permissions
- **Fix**: Verify node ID in Figma, ensure file is accessible

---

## Commands

```bash
# Run frontend locally
cd apps/frontend && npm run dev

# Run backend locally
cd apps/backend && npm run dev

# Build frontend
cd apps/frontend && npm run build

# Build backend
cd apps/backend && npm run build

# Install dependencies (from root)
npm install

# Run both frontend and backend (if using turbo)
npm run dev
```

---

## Contact & Resources

- **Figma Test File**: `https://www.figma.com/design/lpJzZ5zV6ZAX9qTCMiASHZ/ADL-Modular-Test`
- **GitHub Repo**: `https://github.com/artemis-design-labs/uiforge-demo`
- **Figma API Docs**: `https://www.figma.com/developers/api`

---

# Vision: AI Designer Intelligence Layer

## Ultimate Goal

Build an AI that understands everything from a Figma file like a seasoned designer. The goal is to build an AI designer that takes over the designer's role after the handoff to a developer.

## Why Not Train a Custom Neural Net?

Training a custom neural net would require:
- **Thousands of labeled examples** - One Figma file isn't enough data
- **Significant compute resources** - Training costs $$$
- **Labeled "design decisions"** - Someone has to annotate what makes designs "good"

**LLMs already know design principles.** Claude and GPT-4 are trained on:
- Design principles (typography, color theory, spacing, hierarchy)
- Figma's JSON structure
- Component-based design systems
- Accessibility guidelines

**The bottleneck isn't AI understanding - it's data extraction.**

## Figma API Access (Pro Plan)

| Can Access | Cannot Access (Enterprise Only) |
|------------|--------------------------------|
| Component structure & properties | Variables API |
| Node hierarchy & layout | Dev Mode APIs |
| Colors, typography, effects | Some advanced features |
| Export images (PNG/SVG) | |
| Auto-layout settings | |
| Component variants | |

## Architecture: Design Intelligence Layer

```
┌─────────────────────────────────────────────────────────┐
│                 DESIGN INTELLIGENCE LAYER                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. EXTRACTION        2. KNOWLEDGE BASE    3. AI LAYER   │
│  ─────────────        ─────────────────    ──────────    │
│  Figma API ──────►    Components           Claude/GPT    │
│  • Components         Tokens               with context  │
│  • Styles             Patterns             about YOUR    │
│  • Layout rules       Relationships        design system │
│  • Token values       Usage examples                     │
│                                                          │
│  Result: LLM that "knows" your design system deeply      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## What This AI Could Do

1. **Answer design questions** - "What button variant should I use for destructive actions?"
2. **Generate components** - Create new components following your patterns
3. **Review code** - "This doesn't match our design system because..."
4. **Suggest improvements** - "Based on your spacing tokens, this should be 16px not 14px"
5. **Handle edge cases** - "Here's how to handle this scenario based on similar patterns"

## Implementation Approach

### 1. Deep Figma Extractor
Pull everything possible from the file:
- Component tree with all properties
- All style values (even without Variables API, extract colors from nodes)
- Layout patterns (how components are composed)
- Naming conventions

### 2. Design Knowledge Base
Store as structured data + vector embeddings:
- Components and their variants
- Design tokens (colors, spacing, typography)
- Component relationships and composition patterns
- Usage examples

### 3. Context-Aware LLM Interface
When developers ask questions, inject relevant design context into the prompt:
- "Here's our design system, here's the component structure, here's how Button works..."
- The LLM can then answer questions like a designer would

### 4. RAG (Retrieval-Augmented Generation)
Store design knowledge in a vector database, retrieve relevant parts when answering questions.

## Constraints with Pro Plan

1. **No Variables API** - Must manually export tokens as JSON
2. **Rate limits** - Can't poll Figma constantly
3. **No real-time sync** - Need to re-extract when designs change

---

# Design Token Management (New Feature - January 2026)

## Token Import Flow

1. Export Variables from Figma as JSON (Light.tokens.json, Dark.tokens.json)
2. Import via TokenImportModal - auto-detects Figma Variables format
3. Tokens stored in Redux state, validated automatically
4. Export to code-ready formats or include in generated npm packages

## Token Formats Supported

### Import:
- **Figma Variables** (manual JSON export) - Auto-detected, handles complex `$value` objects
- **Style Dictionary** - Standard JSON format
- **Token Studio** - Figma Token Studio exports
- **W3C DTCG** - Design Token Community Group format
- **CSV** - Simple name,value,type format

### Export:
- **CSS Custom Properties** - `:root { --color-primary: #3B82F6; }`
- **Tailwind Config** - Theme extension for tailwind.config.js
- **TypeScript theme** - Typed theme object with full IntelliSense
- **Style Dictionary JSON** - For build pipelines
- **W3C DTCG format** - Standards-compliant output

## Key Token Service Files

- `/apps/frontend/src/services/tokenService.ts` - Import parsers (Figma Variables, Style Dictionary, Token Studio, W3C DTCG, CSV)
- `/apps/frontend/src/services/tokenExporter.ts` - Export generators for all formats
- `/apps/frontend/src/services/tokenValidator.ts` - Naming conventions and WCAG contrast validation
- `/apps/frontend/src/types/tokens.ts` - TypeScript interfaces
- `/apps/frontend/src/components/TokenImportModal.tsx` - Import UI
- `/apps/frontend/src/components/TokenExportModal.tsx` - Export UI
- `/apps/frontend/src/components/TokensSection.tsx` - Token display panel

---

# Deep Component Extraction (AI Training Data)

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

## Sample Output

See `/docs/sample-button-extraction.json` for a complete example of what the API returns.

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
    "designPatterns": ["Uses auto-layout", "Follows 4px spacing grid", ...],
    "colorSemantics": { "Primary": "#3B82F6 - Blue 500 (main action)", ... },
    "spacingScale": { "small": "8px", "medium": "16px", ... },
    "accessibilityNotes": ["Focus ring visible", "4.5:1 contrast ratio", ...]
  }
}
```

## Key Files

- `/apps/frontend/src/app/api/figma/deep-extract/[fileKey]/[nodeId]/route.ts` - API endpoint
- `/apps/frontend/src/services/figma.ts` - `figmaService.deepExtract()` method
- `/docs/sample-button-extraction.json` - Sample output

---

# Product Strategy & Roadmap

## Design Systems Pain Points (AI Opportunities)

Based on analysis of Design Systems podcast transcripts, these are the recurring pain points that AI could solve:

### 1. Design-to-Code Translation & Handoff Friction

- Figma files remain "disposable artifacts" that don't make it to production intact
- Multiple translation layers (design → specs → code) lose fidelity and slow feedback cycles
- Figma Dev Mode provides pseudo-code that's never production-ready—requires extensive customization
- Teams spend enormous time reconciling Figma ↔ React drift
- States (loading, error, empty, permission-denied) are often missing from design specs and have to be invented by engineers

**AI Opportunity:** Generate production-ready code directly from design intent, with full state coverage built in

### 2. Token Data Format Fragmentation & Naming Chaos

- Token data comes in highly organization-specific formats that are difficult to share or reuse
- Figma variables, Style Dictionary, Token Studio, and the W3C spec don't work seamlessly together
- Token naming is inconsistent—designers across teams name tokens differently with no enforcement mechanism
- Metadata and semantic context get buried in fragile string-based naming conventions
- Tens of thousands of tokens become impossible for humans to comprehend or audit

**AI Opportunity:** Automatic mapping/translation between token formats, naming validation, and intelligent documentation that makes token libraries queryable

### 3. Documentation That Doesn't Serve Its Audience

- Docs become marketing artifacts ("a button is a clickable element") rather than practical guidance
- Engineers need guidance on how to use things (e.g., "when do I use flexbox vs. CSS Grid?"), not definitions
- Usage guidelines are disconnected from the structured data they describe
- Documentation now needs to serve AI consumers (LLMs, agents), not just humans—requiring different formats
- 75% of design system work is communication, but changes go unnoticed because awareness is manual

**AI Opportunity:** Context-aware, queryable documentation that understands how things should be used; AI help bots that can answer questions at scale; machine-readable guidelines that enforce best practices automatically

### 4. Scaling Accessibility Remains Painful

- Teams say "we don't have time" to implement accessibility properly
- Designers and engineers don't understand how screen readers actually work
- Auditing and remediating accessibility across hundreds of applications is overwhelming
- Evolving standards (WCAG 2.1 → 2.2) require manual effort to propagate changes
- Even with accessible components, implementation still requires care to make it through to production

**AI Opportunity:** Automated accessibility auditing at scale, proactive enforcement of WCAG standards through LLM-driven code review, and intelligent propagation of standards updates across products

### 5. Contribution Never Scaled

- The dream of "mini open-source communities" inside organizations never materialized
- Patterns emerge in products but aren't codified back into the system
- Non-coders (designers, PMs) can't contribute design patterns without writing code
- Token requests become bureaucratic bottlenecks—teams just want to try a color, but they have to file a request and wait for review

**AI Opportunity:** Natural-language contribution to design systems; AI that observes what teams are building and suggests pattern candidates; low-friction exploration through patterns rather than formal token requests

### 6. Legacy Product Drift & Migration

- Existing products fall out of sync when design systems or brands evolve
- Teams lack resources to audit and update legacy interfaces
- Acquired products need integration but don't match accessibility or design standards
- No systematic way to identify where products diverge from current guidelines
- Breaking changes ripple unpredictably—changing a color can introduce accessibility problems downstream

**AI Opportunity:** Automated auditing that identifies inconsistencies, migration assistants that help legacy products adopt current patterns, and impact analysis for breaking changes

### 7. Business Value & Alignment Gaps

- Design system teams become gatekeepers who say "no" too often
- Misalignment between design, engineering, and product/business priorities
- Difficulty measuring and communicating value to stakeholders
- If business doesn't care, design system work struggles to get funded
- Design is increasingly underfunded, creating power imbalances in organizations

**AI Opportunity:** Analytics that demonstrate usage and adoption; AI that helps quantify productivity gains; pattern exploration that lets teams show value before requesting formal additions

### 8. Process & Workflow Observability

- Workflows and ways of working aren't observable or extractable
- Context about why decisions were made gets lost
- Gap between defined processes and what actually happens
- Office hours and feedback are qualitative and hard to scale
- No tooling to measure design system efficacy quantitatively

**AI Opportunity:** AI that observes actual workflows and surfaces deviations; decision capture and retrieval; automated synthesis of office hours questions into pattern gaps

### 9. Platform & Tooling Complexity

- Different platforms (web, mobile, in-store kiosks, wearables) have different constraints and lead times
- Multi-framework support (React, Angular, Vue, iOS, Android) multiplies maintenance burden
- Component implementations across platforms diverge over time
- Enterprise data components (tables with 20+ columns, inline editing, virtualization) require specialized handling

**AI Opportunity:** Framework-agnostic component generation; intelligent translation between platform-specific implementations; AI that handles state management and performance optimization

### 10. The Human Skills Gap in an AI-Native Future

- Junior designers aren't getting hired because organizations want senior strategists
- Mid-career designers are caught between traditional methods and AI-native workflows
- There's a training cost to upskill existing talent, but no clear path
- The industry may end up with a "lost generation" of designers who never got foundational experience
- Humans remain responsible for design thinking, UX, and final decisions—but the definition of those roles is shifting

**AI Opportunity:** AI as a learning partner that helps designers iterate faster with less experience; tools that make strategic thinking more accessible; upskilling assistants that teach AI-native workflows

---

## Pain Point to AI Solution Mapping

| Pain Point | AI Solution Category |
|------------|---------------------|
| Design-to-code translation | **Generation** — Produce production code from intent |
| Token fragmentation | **Translation** — Bridge incompatible formats automatically |
| Documentation gaps | **Intelligence** — Queryable, context-aware docs for humans and machines |
| Accessibility at scale | **Auditing** — Automated WCAG compliance checking and remediation |
| Contribution bottlenecks | **Democratization** — Natural language pattern contributions |
| Legacy drift | **Detection** — Identify inconsistencies and migration paths |
| Business value proof | **Analytics** — Quantify adoption, usage, and productivity gains |
| Process observability | **Synthesis** — Extract patterns from actual behavior |
| Platform complexity | **Abstraction** — Generate framework-specific implementations from shared definitions |
| Skills gap | **Augmentation** — Accelerate learning and iteration for all experience levels |

---

## Feature Priority Analysis

### Priority #1: Token Management & Translation (Pain Point #2)

**Why This Is the Top Priority for UI Forge**

#### 1. It's foundational to everything else
Tokens are the substrate that components are built on. UI Forge already generates `theme.ts` — extending this to proper token management creates a complete design-to-code pipeline, not just component extraction.

#### 2. The pain is universal and acute
From the transcripts: "Token data comes in highly organization-specific formats... Figma variables, Style Dictionary, Token Studio, and the W3C spec don't work seamlessly together."

Every team has this problem. No one has solved it well.

#### 3. Natural extension of what UI Forge already has
UI Forge already:
- Connects to Figma OAuth
- Extracts component properties
- Generates a `theme.ts` file
- Packages everything into npm bundles

Adding token extraction/translation builds on all of this.

#### 4. Creates stickiness
Once tokens flow through UI Forge, it becomes the source of truth. Components without a token system are just one-off exports.

**Status:** ✅ Implemented (see Design Token Management section above)

---

### Priority #2: AI-Consumable Documentation (Pain Point #3)

This is a close second because of this insight from the transcripts:

> "Documentation now needs to serve AI consumers (LLMs, agents), not just humans—requiring different formats"

UI Forge could generate `.cursor/rules` or `CLAUDE.md` files alongside components — making generated packages immediately useful with AI coding assistants.

**Potential Features:**
- Generate component specs in machine-readable format
- Create rules files for AI coding assistants (Cursor, Copilot, Claude Code)
- Include usage examples and constraints that LLMs can understand
- Auto-generate Storybook stories for visual documentation

**Status:** 🔜 Planned

---

### Priority #3: Multi-Framework Support (Pain Point #9)

Generate code for multiple frameworks from the same Figma source:
- React (current)
- Vue
- Angular
- Svelte
- Web Components

**Status:** 🔜 Future consideration

---

### Priority #4: UI Forge MCP Server + Storybook + Zeroheight Integration

**Status:** 🔜 Planned (January 2026)

Build UI Forge as an MCP (Model Context Protocol) hub that connects to Storybook and Zeroheight, enabling AI agents to interact with the entire design-to-code pipeline.

---

# UI Forge MCP Server Architecture

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
        component: 'Button component from Artemis Design System. Supports multiple sizes, colors, and states.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['Small', 'Medium', 'Large'],
      description: 'Button size variant',
      table: { defaultValue: { summary: 'Medium' } },
    },
    color: {
      control: 'select',
      options: ['Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success'],
      description: 'Button color variant',
      table: { defaultValue: { summary: 'Primary' } },
    },
    type: {
      control: 'select',
      options: ['Filled', 'Outlined', 'Text', 'Elevated', 'Tonal'],
      description: 'Button type variant',
      table: { defaultValue: { summary: 'Filled' } },
    },
    label: {
      control: 'text',
      description: 'Button label text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    iconLeft: {
      control: 'boolean',
      description: 'Show left icon',
    },
    iconRight: {
      control: 'boolean',
      description: 'Show right icon',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FigmaButton>;

// Primary variants
export const Primary: Story = {
  args: {
    label: 'Button',
    color: 'Primary',
    size: 'Medium',
    type: 'Filled',
  },
};

export const PrimaryOutlined: Story = {
  args: {
    label: 'Button',
    color: 'Primary',
    size: 'Medium',
    type: 'Outlined',
  },
};

// Size variants
export const Small: Story = {
  args: { label: 'Small Button', size: 'Small', color: 'Primary' },
};

export const Large: Story = {
  args: { label: 'Large Button', size: 'Large', color: 'Primary' },
};

// State variants
export const Disabled: Story = {
  args: { label: 'Disabled', color: 'Primary', disabled: true },
};

// With icons
export const WithLeftIcon: Story = {
  args: { label: 'With Icon', color: 'Primary', iconLeft: true, leftIcon: 'Add' },
};

// All color variants
export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {['Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success'].map((color) => (
        <FigmaButton key={color} label={color} color={color as any} />
      ))}
    </div>
  ),
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

## Implementation Files

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
  // Push content to a page
  pushContent: 'POST /api/v1/pages/{pageId}/content',

  // Get page content
  getPage: 'GET /api/v1/pages/{pageId}',

  // Sync design tokens
  syncTokens: 'POST /api/v1/styleguide/{styleguideId}/tokens',

  // Get component list
  getComponents: 'GET /api/v1/styleguide/{styleguideId}/components',

  // Update component
  updateComponent: 'PUT /api/v1/components/{componentId}',
};
```

## What UI Forge Pushes to Zeroheight

### Component Documentation

```markdown
## Button

A versatile button component supporting multiple variants, sizes, and states.

### Figma Source
[View in Figma](https://figma.com/design/qyrtCkpQQ1yq1Nv3h0mbkq?node-id=14-3737)

### Installation
\`\`\`bash
npm install @artemis/design-system
\`\`\`

### Usage
\`\`\`tsx
import { Button } from '@artemis/design-system';

<Button
  label="Click me"
  color="Primary"
  size="Medium"
  type="Filled"
/>
\`\`\`

### Properties

| Property | Type | Default | Options |
|----------|------|---------|---------|
| label | TEXT | "Button" | - |
| size | VARIANT | Medium | Small, Medium, Large |
| color | VARIANT | Primary | Primary, Secondary, Error, Warning, Info, Success |
| type | VARIANT | Filled | Filled, Outlined, Text, Elevated, Tonal |
| state | VARIANT | Enabled | Enabled, Hovered, Focused, Pressed, Disabled |
| iconLeft | BOOLEAN | false | - |
| iconRight | BOOLEAN | false | - |
| leftIcon | INSTANCE_SWAP | - | See icon library |
| rightIcon | INSTANCE_SWAP | - | See icon library |

### Design Tokens Used

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary-500` | #3B82F6 | Primary button background |
| `--color-primary-600` | #2563EB | Primary button hover |
| `--spacing-sm` | 8px | Button padding (small) |
| `--spacing-md` | 12px | Button padding (medium) |
| `--radius-md` | 8px | Button border radius |

### Accessibility

- ✅ Minimum touch target: 44x44px (Large), 36x36px (Medium)
- ✅ Color contrast ratio: 4.5:1 minimum
- ✅ Focus ring visible on keyboard navigation
- ✅ Disabled state clearly indicated

### Do's and Don'ts

✅ **Do:**
- Use Primary for main actions
- Use one primary button per section
- Include descriptive label text

❌ **Don't:**
- Use multiple primary buttons together
- Use icon-only buttons without aria-label
- Disable buttons without explanation
```

### Design Tokens Sync

```json
// Tokens pushed to Zeroheight
{
  "colors": {
    "primary": {
      "50": { "value": "#EFF6FF", "description": "Primary lightest" },
      "500": { "value": "#3B82F6", "description": "Primary base" },
      "600": { "value": "#2563EB", "description": "Primary hover" },
      "700": { "value": "#1D4ED8", "description": "Primary pressed" }
    },
    "secondary": { ... },
    "error": { ... }
  },
  "spacing": {
    "xs": { "value": "4px" },
    "sm": { "value": "8px" },
    "md": { "value": "12px" },
    "lg": { "value": "16px" },
    "xl": { "value": "24px" }
  },
  "radius": {
    "sm": { "value": "4px" },
    "md": { "value": "8px" },
    "lg": { "value": "12px" },
    "full": { "value": "9999px" }
  }
}
```

## Two-Way Sync Capabilities

| Direction | What Syncs |
|-----------|------------|
| **Figma → UI Forge → Zeroheight** | Component properties, design tokens, visual specs |
| **Zeroheight → UI Forge** | Usage guidelines, do's/don'ts, accessibility notes |
| **Webhook Updates** | Auto-sync when Figma file changes |

## Implementation Files

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

# Implementation Roadmap

## Phase 1: Storybook Story Generation (Week 1)

**Effort:** ~2-3 days

1. Create `storybookGenerator.ts` service
2. Add story templates for each component type
3. Include Storybook generation in package export
4. Add Figma design addon configuration

**Files to create:**
- `/apps/frontend/src/services/storybookGenerator.ts`
- `/apps/frontend/src/templates/storybook/story.template.ts`

## Phase 2: UI Forge MCP Server (Week 2)

**Effort:** ~1 week

1. Create MCP server using `@modelcontextprotocol/sdk`
2. Expose core tools (generate_component, get_tokens, etc.)
3. Add authentication handling
4. Publish as npm package: `@uiforge/mcp-server`

**Files to create:**
- `/packages/mcp-server/src/index.ts`
- `/packages/mcp-server/src/tools/`
- `/packages/mcp-server/package.json`

**Installation for users:**
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

## Phase 3: Zeroheight Integration (Week 3)

**Effort:** ~1 week

1. Integrate Zeroheight API
2. Create documentation templates
3. Implement two-way sync
4. Add webhook support for auto-updates

**Files to create:**
- `/apps/frontend/src/services/zeroheightService.ts`
- `/apps/frontend/src/services/zeroheightSync.ts`
- `/apps/backend/routes/zeroheight.js`

## Phase 4: Full Integration & Testing (Week 4)

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

---

# External Codebase Analysis: Creative Hire Case Study

## Overview

As part of validating UI Forge's component generation capabilities, we analyzed the [Creative Hire](https://github.com/Electromau5/creative-hire) codebase - a Next.js 14 application for AI-powered resume optimization.

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

- ✅ No existing component library (clean slate)
- ✅ Tailwind-based (easy token integration)
- ✅ TypeScript props match Figma properties
- ✅ Already has theme system to enhance
- ✅ Functional components with hooks

## Migration Strategy

1. **Generate** → npm package from Figma design system
2. **Install** → Add to Creative Hire dependencies
3. **Replace** → Swap Tailwind components with Figma components
4. **Validate** → Use Screenshot Analyzer to verify visual parity

## Component Gap Analysis

After analyzing Creative Hire's needs vs UI Forge's registry:

| UI Forge Component | Status | Creative Hire Usage |
|--------------------|--------|---------------------|
| Button | ✅ Available | Primary actions |
| TextField | ✅ Available | Form inputs |
| TextArea | ✅ Available | JobDescriptionInput |
| Tabs | ✅ Available | Step navigation |
| NavItem | ✅ Available | Navigation |
| IconButton | ✅ Available | Toolbar actions |
| SearchInput | ✅ Available | Search functionality |
| Card | 🔜 Needed | Glass containers |
| Select | 🔜 Needed | Dropdowns |

This case study validates that UI Forge's component coverage (~73%) can support real-world application migrations with minimal gaps.
