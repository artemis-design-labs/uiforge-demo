# UI Forge Project

UI Forge is a Figma-to-code tool that converts Figma designs into production-ready React components and npm packages.

> **Note:** For experimental features (Screenshot Analyzer, Codebase Analyzer, Accessibility Knowledge Base, MCP Server, etc.), see `TEST-FEATURES.md` in the `test-features` branch.

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
├── CLAUDE.md              # This documentation file (stable features)
└── TEST-FEATURES.md       # Experimental features documentation
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

### API Routes (Backend - Express)
| Route | Purpose |
|-------|---------|
| `/api/v1/figma/file/:fileKey` | Load Figma file structure |
| `/api/v1/figma/instance/:fileKey/:nodeId` | Load specific component data |

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

### Auto-Discovery Feature
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
- `IconButton/LightMode`, `IconButton/DarkMode`
- `NavItem/LightMode`, `NavItem/DarkMode`
- `ProgressLinear/LightMode`
- `SearchInput/LightMode`, `SearchInput/DarkMode`
- `Tabs/LightMode`, `Tabs/DarkMode`
- `TextArea/LightMode`, `TextArea/DarkMode`
- `TextField/LightMode`, `TextField/DarkMode`

---

## Adding New Components

### Step 1: Create React Component
Create `/apps/frontend/src/components/figma-components/FigmaNewComponent.tsx`:

```typescript
'use client';
import React from 'react';

export interface FigmaNewComponentProps {
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

## Known Limitations

1. **React Components Manual**: New Figma components need React implementations added to `COMPONENT_REGISTRY` for interactive preview
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
- **Debug**: Check console for `getFigmaProperties` logs

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

## Vision: AI Designer Intelligence Layer

### Ultimate Goal

Build an AI that understands everything from a Figma file like a seasoned designer. The goal is to build an AI designer that takes over the designer's role after the handoff to a developer.

### Why LLMs Instead of Custom Neural Nets?

**LLMs already know design principles.** Claude and GPT-4 are trained on:
- Design principles (typography, color theory, spacing, hierarchy)
- Figma's JSON structure
- Component-based design systems
- Accessibility guidelines

**The bottleneck isn't AI understanding - it's data extraction.**

### Figma API Access (Pro Plan)

| Can Access | Cannot Access (Enterprise Only) |
|------------|--------------------------------|
| Component structure & properties | Variables API |
| Node hierarchy & layout | Dev Mode APIs |
| Colors, typography, effects | Some advanced features |
| Export images (PNG/SVG) | |
| Auto-layout settings | |
| Component variants | |

### What This AI Could Do

1. **Answer design questions** - "What button variant should I use for destructive actions?"
2. **Generate components** - Create new components following your patterns
3. **Review code** - "This doesn't match our design system because..."
4. **Suggest improvements** - "Based on your spacing tokens, this should be 16px not 14px"
5. **Handle edge cases** - "Here's how to handle this scenario based on similar patterns"

> For detailed implementation plans, roadmap, and experimental features, see `TEST-FEATURES.md` in the `test-features` branch.
