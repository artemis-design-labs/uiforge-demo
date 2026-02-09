# UI Forge Demo

> **Design-to-Code Platform** - Convert Figma designs to production-ready React components

![Status](https://img.shields.io/badge/Status-Demo-blue)
![Platform](https://img.shields.io/badge/Platform-Web-green)
![License](https://img.shields.io/badge/License-Proprietary-red)

## 🎯 Overview

UI Forge is an enterprise SaaS platform that revolutionizes the design-to-development handoff process by automatically converting Figma designs into production-ready React components. This repository contains a combined demo version of all UI Forge components for presentation purposes.

### Key Features Demo'd

- ✅ **Figma Integration** - OAuth authentication and file access
- ✅ **Component Detection** - Hierarchical tree view of Figma components
- ✅ **Canvas Rendering** - Real-time component visualization with Konva
- ✅ **Properties Panel** - Full property inspection (dimensions, colors, effects, variants)
- 🔄 **Code Generation** - React component output (mock for demo)
- 📦 **NPM Publishing** - Package generation workflow (conceptual)

## 📁 Repository Structure

```
uiforge-demo/
├── apps/
│   ├── frontend/          # Next.js React application
│   │   ├── src/
│   │   │   ├── app/       # Next.js app router pages
│   │   │   ├── components/# UI components
│   │   │   ├── contexts/  # React contexts
│   │   │   ├── lib/       # Utilities
│   │   │   ├── services/  # API services
│   │   │   ├── store/     # State management
│   │   │   └── types/     # TypeScript types
│   │   └── public/        # Static assets
│   │
│   ├── backend/           # Express.js API server
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Express middleware
│   │   └── server.js      # Main server file
│   │
│   └── component-tester/  # Component testing app
│       ├── app/           # Test pages
│       └── generated/     # Sample generated components
│
├── packages/
│   └── codegen/           # Code generation service
│       └── services/
│           └── generator/ # React code generator
│
├── scripts/
│   ├── setup.sh           # Full setup script
│   └── setup-demo.sh      # Demo mode setup
│
└── package.json           # Root monorepo config
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- Access to artemis-design-labs GitHub repos

### Setup

1. **Clone this demo repo:**
   ```bash
   git clone <this-repo-url>
   cd uiforge-demo
   ```

2. **Run the setup script:**
   ```bash
   chmod +x scripts/setup.sh
   npm run setup
   ```

   This will:
   - Clone all 4 UI Forge repositories
   - Organize them into the monorepo structure
   - Install all dependencies
   - Create environment file templates

3. **Configure environment variables:**
   
   Edit `apps/frontend/.env.local`:
   ```env
   NEXT_PUBLIC_FIGMA_CLIENT_ID=your_figma_client_id
   FIGMA_CLIENT_SECRET=your_figma_client_secret
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

   Edit `apps/backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/uiforge
   FIGMA_ACCESS_TOKEN=your_figma_token
   JWT_SECRET=your_secret
   ```

4. **Start the development servers:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Demo Mode (No External Dependencies)

For presentations without Figma/MongoDB setup:

```bash
npm run setup:demo
npm run dev
```

This uses mock data and doesn't require external services.

## 🎪 Demo Flow

### 1. Authentication
- Click "Login with Figma"
- Authorize the application
- Redirected to main dashboard

### 2. Load Figma File
- Paste a Figma file URL in the left sidebar
- Click "Load" to fetch the file structure
- Browse the component tree

### 3. Explore Components
- Click on a COMPONENT or INSTANCE node
- View renders on the central canvas
- Inspect all properties in the right panel

### 4. View Generated Code
- Select a component
- Click "Generate Code"
- View the React component output
- Copy or download the code

### 5. Export Package
- Configure package settings
- Generate npm-ready package
- View installation instructions

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Tree View   │  │   Canvas    │  │  Properties Panel   │ │
│  │ (Figma Nav) │  │  (Konva)    │  │  (Editable Props)   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Backend API                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Figma API   │  │  MongoDB    │  │   Code Generator    │ │
│  │  Proxy      │  │   Cache     │  │    (AI/Rules)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Figma API   │  │   NPM       │  │    AI/ML Service    │ │
│  │             │  │  Registry   │  │    (Future)         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Clone repos and install dependencies |
| `npm run setup:demo` | Setup with mock data for demos |
| `npm run dev` | Start all development servers |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run dev:tester` | Start component tester |
| `npm run build` | Build all packages |
| `npm run lint` | Lint all packages |

## 🔧 Configuration

### Figma API Setup

1. Go to [Figma Developers](https://www.figma.com/developers)
2. Create a new app
3. Set redirect URI to `http://localhost:3000/login`
4. Copy Client ID and Client Secret
5. Add to environment files

### MongoDB Setup (Optional for Demo)

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install locally
brew install mongodb-community  # macOS
```

## 🎨 Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Konva.js (Canvas rendering)
- shadcn/ui components

**Backend:**
- Node.js
- Express.js
- MongoDB
- Figma API

**Code Generation:**
- Lerna monorepo
- Custom React generator
- Template-based output

## 📝 MVP Demo Checklist

- [x] Figma OAuth authentication
- [x] File URL input and loading
- [x] Component tree navigation
- [x] Canvas rendering with Konva
- [x] Properties panel display
- [x] Basic property editing
- [x] Component variants display
- [x] Effects (shadows, blurs) display
- [ ] AI-powered code generation (mock for demo)
- [ ] NPM package publishing (conceptual)
- [ ] Team collaboration features

## 🤝 Contributing

This is a demo repository. For contributing to the main project:

1. Contact Artemis Design Labs
2. Review the product documentation
3. Submit proposals through proper channels

## 📄 License

Proprietary - Artemis Design Labs

---

**Company:** Artemis Design Labs  
**Product:** UI Forge  
**Website:** [artemisdesignlabs.com](https://artemisdesignlabs.com)  
**Product URL:** [uiforge.ai](https://uiforge.ai)

*Last Updated: January 2025*
