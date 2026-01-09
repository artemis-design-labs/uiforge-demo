#!/bin/bash

# UI Forge Demo - Setup Script
# This script clones all UI Forge repositories and organizes them into a monorepo structure

set -e

echo "🔧 UI Forge Demo Setup"
echo "======================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is available
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed${NC}"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📁 Working directory: $ROOT_DIR"
echo ""

# Create temp directory for cloning
TEMP_DIR="$ROOT_DIR/.temp-clone"
mkdir -p "$TEMP_DIR"

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Clone repositories
echo "📥 Cloning repositories..."
echo ""

# Frontend
echo "1/4 Cloning uiforge-frontend..."
if [ -d "$ROOT_DIR/apps/frontend/.git" ] || [ -f "$ROOT_DIR/apps/frontend/package.json" ]; then
    echo -e "${YELLOW}   Skipping - frontend already exists${NC}"
else
    git clone https://github.com/artemis-design-labs/uiforge-frontend.git "$TEMP_DIR/frontend" 2>/dev/null || {
        echo -e "${RED}   Failed to clone frontend. Make sure you have access to the repo.${NC}"
        echo "   Run: gh auth login (if using GitHub CLI)"
        exit 1
    }
    # Move contents (excluding .git)
    rsync -av --exclude='.git' "$TEMP_DIR/frontend/" "$ROOT_DIR/apps/frontend/"
    echo -e "${GREEN}   ✓ Frontend cloned successfully${NC}"
fi

# Backend
echo "2/4 Cloning uiforge-backend..."
if [ -d "$ROOT_DIR/apps/backend/.git" ] || [ -f "$ROOT_DIR/apps/backend/package.json" ]; then
    echo -e "${YELLOW}   Skipping - backend already exists${NC}"
else
    git clone https://github.com/artemis-design-labs/uiforge-backend.git "$TEMP_DIR/backend" 2>/dev/null || {
        echo -e "${RED}   Failed to clone backend. Make sure you have access to the repo.${NC}"
        exit 1
    }
    rsync -av --exclude='.git' "$TEMP_DIR/backend/" "$ROOT_DIR/apps/backend/"
    echo -e "${GREEN}   ✓ Backend cloned successfully${NC}"
fi

# Codegen
echo "3/4 Cloning uiforge-codegen..."
if [ -d "$ROOT_DIR/packages/codegen/.git" ] || [ -f "$ROOT_DIR/packages/codegen/package.json" ]; then
    echo -e "${YELLOW}   Skipping - codegen already exists${NC}"
else
    git clone https://github.com/artemis-design-labs/uiforge-codegen.git "$TEMP_DIR/codegen" 2>/dev/null || {
        echo -e "${RED}   Failed to clone codegen. Make sure you have access to the repo.${NC}"
        exit 1
    }
    rsync -av --exclude='.git' "$TEMP_DIR/codegen/" "$ROOT_DIR/packages/codegen/"
    echo -e "${GREEN}   ✓ Codegen cloned successfully${NC}"
fi

# Component Tester
echo "4/4 Cloning uiforge-component-tester..."
if [ -d "$ROOT_DIR/apps/component-tester/.git" ] || [ -f "$ROOT_DIR/apps/component-tester/package.json" ]; then
    echo -e "${YELLOW}   Skipping - component-tester already exists${NC}"
else
    git clone https://github.com/artemis-design-labs/uiforge-component-tester.git "$TEMP_DIR/component-tester" 2>/dev/null || {
        echo -e "${RED}   Failed to clone component-tester. Make sure you have access to the repo.${NC}"
        exit 1
    }
    rsync -av --exclude='.git' "$TEMP_DIR/component-tester/" "$ROOT_DIR/apps/component-tester/"
    echo -e "${GREEN}   ✓ Component tester cloned successfully${NC}"
fi

echo ""
echo "📦 Installing dependencies..."
cd "$ROOT_DIR"
npm install

echo ""
echo "🔧 Setting up environment files..."

# Create frontend .env if it doesn't exist
if [ ! -f "$ROOT_DIR/apps/frontend/.env.local" ]; then
    cat > "$ROOT_DIR/apps/frontend/.env.local" << 'EOF'
# Figma OAuth Configuration
NEXT_PUBLIC_FIGMA_CLIENT_ID=your_figma_client_id
FIGMA_CLIENT_SECRET=your_figma_client_secret

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# OAuth Redirect URI (update for production)
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/login
EOF
    echo "   Created apps/frontend/.env.local (update with your Figma credentials)"
fi

# Create backend .env if it doesn't exist
if [ ! -f "$ROOT_DIR/apps/backend/.env" ]; then
    cat > "$ROOT_DIR/apps/backend/.env" << 'EOF'
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/uiforge

# Figma API
FIGMA_ACCESS_TOKEN=your_figma_access_token
FIGMA_CLIENT_ID=your_figma_client_id
FIGMA_CLIENT_SECRET=your_figma_client_secret

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
EOF
    echo "   Created apps/backend/.env (update with your credentials)"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update the .env files with your Figma API credentials"
echo "2. Start MongoDB locally or update MONGODB_URI"
echo "3. Run 'npm run dev' to start the development servers"
echo ""
echo "Demo Commands:"
echo "  npm run dev           - Start frontend + backend"
echo "  npm run dev:frontend  - Start frontend only"
echo "  npm run dev:backend   - Start backend only"
echo "  npm run dev:tester    - Start component tester"
echo ""
