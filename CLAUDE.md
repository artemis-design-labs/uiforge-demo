# UI Forge Project

UI Forge is a Figma-to-code tool that converts Figma designs into production-ready React components and npm packages.

## Project Structure

- **Frontend**: `/apps/frontend` - Next.js application
- **Backend**: `/apps/backend` - Express API (deployed on Railway)
- **Test Project**: `/Users/prits6/Desktop/Wealth/Artemis Design Labs/Artemis Design Labs/UI Forge/test-design-system` - For testing generated packages

## Key Features Implemented

### 1. Figma Integration
- OAuth authentication with Figma
- Load components from any Figma file
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

### 3. NPM Package Generation (MUI-style)
- Generate complete npm packages from Figma components
- Includes: package.json, tsconfig.json, theme.ts, README.md
- Downloads as zip file
- Uses tsup for building (ESM, CJS, DTS)

## Key Files

### Services
- `/apps/frontend/src/services/codeGenerator.ts` - Generates React component code from Figma properties
- `/apps/frontend/src/services/packageGenerator.ts` - Generates complete npm package structure

### API Routes
- `/apps/frontend/src/app/api/package/generate/route.ts` - API endpoint for package generation (returns zip)
- `/apps/frontend/src/app/api/figma/` - Figma API proxy routes

### Components
- `/apps/frontend/src/components/PackageGeneratorModal.tsx` - Modal for configuring package (name, version, etc.)
- `/apps/frontend/src/components/FigmaPropertiesPanel.tsx` - Right panel with properties and code display
- `/apps/frontend/src/components/layout/AppHeader.tsx` - Header with "Generate Package" button

### State Management
- `/apps/frontend/src/store/figmaSlice.ts` - Figma state (components, file key, iconRegistry, etc.)
- `/apps/frontend/src/store/layoutSlice.ts` - Layout state (sidebar widths)

### Figma Component Registry
- `/apps/frontend/src/components/figma-components/index.tsx` - Component registry with:
  - `COMPONENT_REGISTRY` - Maps Figma component names to React components
  - `NAME_ALIASES` - Handles naming variations (e.g., ButtonVariant → Button)
  - `resolveComponentName()` - Flexible name matching
  - `getFigmaProperties()` - Returns property definitions for a component
  - Supported components: Accordion, Button, Breadcrumb, Dropdown, ProgressLinear

## Testing Generated Packages

1. Generate package from UI Forge (click green "Generate Package" button)
2. Extract the downloaded zip
3. Run `npm install` and `npm run build` in the package directory
4. Use `npm link` to link locally
5. In test project: `npm link @myorg/design-system`

## Recent Fixes & Improvements

### Session: January 2026

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

### Earlier Fixes
- Fixed duplicate parameter names in generated code (deduplicateProps function)
- Fixed missing export on Props interface
- Removed hardcoded variant value assumptions in code generator
- Fixed JSZip response type for Next.js API routes

## Recent Git Commits

```
38f7a46 Update component properties panel UI styling
5947f99 Remove inner container - single white/black background only
2ea942c Add white/black container for LightMode/DarkMode components
3c24d5d Add all 9 Button properties and fix component name matching
a07653c Add depth limit to file fetch endpoint for large files
b166332 Auto-refresh component definitions and increase API depth
```

## Environment

- Frontend deployed on Vercel
- Backend deployed on Railway
- Figma API requires valid access token (stored in cookies)

## Commands

```bash
# Run frontend locally
cd apps/frontend && npm run dev

# Run backend locally
cd apps/backend && npm run dev

# Build frontend
cd apps/frontend && npm run build
```
