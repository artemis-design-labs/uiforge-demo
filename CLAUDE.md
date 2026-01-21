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
- `/apps/frontend/src/store/figmaSlice.ts` - Figma state (components, file key, etc.)
- `/apps/frontend/src/store/layoutSlice.ts` - Layout state (sidebar widths)

## Testing Generated Packages

1. Generate package from UI Forge (click green "Generate Package" button)
2. Extract the downloaded zip
3. Run `npm install` and `npm run build` in the package directory
4. Use `npm link` to link locally
5. In test project: `npm link @myorg/design-system`

## Recent Fixes

- Fixed duplicate parameter names in generated code (deduplicateProps function)
- Fixed missing export on Props interface
- Removed hardcoded variant value assumptions in code generator
- Fixed JSZip response type for Next.js API routes

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
