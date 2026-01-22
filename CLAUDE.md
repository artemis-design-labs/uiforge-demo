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
│   │   │   │   ├── ui/                # shadcn/ui components
│   │   │   │   └── FigmaPropertiesPanel.tsx  # Right sidebar
│   │   │   ├── services/
│   │   │   │   ├── figma.ts           # Figma API service
│   │   │   │   ├── codeGenerator.ts   # React code generation
│   │   │   │   └── packageGenerator.ts # NPM package generation
│   │   │   └── store/
│   │   │       ├── figmaSlice.ts      # Figma state (Redux)
│   │   │       └── layoutSlice.ts     # Layout state (Redux)
│   │   └── .env.local     # Frontend environment variables
│   │
│   └── backend/           # Express API (Railway)
│       ├── routes/
│       │   └── figma.js   # Figma API proxy routes
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
- `Alert/LightMode`, `Alert/DarkMode` (NEW)
- `Avatar/LightMode`, `Avatar/DarkMode` (NEW)
- `Badge/LightMode`, `Badge/DarkMode` (NEW)
- `Button/LightMode`, `Button/DarkMode`
- `Breadcrumb/Light Mode`, `Breadcrumb/Dark Mode`
- `Checkbox/LightMode`, `Checkbox/DarkMode` (NEW)
- `Chip/LightMode`, `Chip/DarkMode` (NEW)
- `Dropdown/LightMode`
- `ProgressLinear/LightMode`

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

### Session: January 21, 2026 (Current)

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
  1. **Removed ALLOWED_COMPONENT_PREFIXES filter** - All components from Figma file are now processed
  2. **Reversed property priority** - Figma API (`fileComponentDefinitions`) is now the PRIMARY source
  3. **Added `convertPropsToState` helper** - Automatically converts INSTANCE_SWAP node IDs to icon names and extracts options from `preferredValues`
  4. **COMPONENT_REGISTRY role changed** - Now only used for React component rendering, not property definitions
- Files modified:
  - `apps/frontend/src/app/api/figma/file-components/[fileKey]/route.ts` - Removed filter, processes ALL components
  - `apps/frontend/src/app/design/page.tsx` - Changed priority order, added conversion helper

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
