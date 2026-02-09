# Manual Setup Guide

If you prefer to set things up manually (or the automated script doesn't work), follow these steps:

## Step 1: Clone All Repositories

Open a terminal and run:

```bash
# Create the project directory
mkdir uiforge-demo
cd uiforge-demo

# Clone frontend
git clone https://github.com/artemis-design-labs/uiforge-frontend.git apps/frontend

# Clone backend
git clone https://github.com/artemis-design-labs/uiforge-backend.git apps/backend

# Clone codegen
git clone https://github.com/artemis-design-labs/uiforge-codegen.git packages/codegen

# Clone component tester
git clone https://github.com/artemis-design-labs/uiforge-component-tester.git apps/component-tester
```

## Step 2: Remove Individual Git Histories (Optional)

If you want a single unified git history:

```bash
# Remove .git from each subdirectory
rm -rf apps/frontend/.git
rm -rf apps/backend/.git
rm -rf packages/codegen/.git
rm -rf apps/component-tester/.git

# Initialize new git repo at root
git init
git add .
git commit -m "Initial commit: Combined UI Forge demo repository"
```

## Step 3: Copy Root Configuration Files

Copy these files from this guide or the template:

1. `package.json` (root monorepo config)
2. `.gitignore`
3. `docker-compose.yml` (optional)

## Step 4: Install Dependencies

```bash
# Install root dependencies (concurrently)
npm install

# Install workspace dependencies
npm install --workspaces
```

Or install each individually:

```bash
cd apps/frontend && npm install && cd ../..
cd apps/backend && npm install && cd ../..
cd packages/codegen && npm install && cd ../..
cd apps/component-tester && npm install && cd ../..
```

## Step 5: Configure Environment Variables

### Frontend (.env.local)

Create `apps/frontend/.env.local`:

```env
# Figma OAuth
NEXT_PUBLIC_FIGMA_CLIENT_ID=<your-figma-client-id>
FIGMA_CLIENT_SECRET=<your-figma-client-secret>

# API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/login
```

### Backend (.env)

Create `apps/backend/.env`:

```env
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/uiforge

# Figma
FIGMA_ACCESS_TOKEN=<your-figma-personal-access-token>
FIGMA_CLIENT_ID=<your-figma-client-id>
FIGMA_CLIENT_SECRET=<your-figma-client-secret>

# JWT
JWT_SECRET=<generate-a-random-string>

# CORS
FRONTEND_URL=http://localhost:3000
```

## Step 6: Start MongoDB

Option A - Docker:
```bash
docker-compose up -d mongodb
```

Option B - Local Install:
```bash
# macOS
brew services start mongodb-community

# Ubuntu
sudo systemctl start mongod
```

## Step 7: Start Development Servers

Terminal 1 - Backend:
```bash
cd apps/backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd apps/frontend
npm run dev
```

## Step 8: Verify Setup

1. Open http://localhost:3000
2. You should see the UI Forge login page
3. Backend API should respond at http://localhost:3001/health

## Troubleshooting

### "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
```

### MongoDB connection errors
```bash
# Check if MongoDB is running
docker ps | grep mongo
# or
brew services list | grep mongo
```

### Figma OAuth not working
1. Verify redirect URI matches exactly
2. Check client ID/secret are correct
3. Ensure the Figma app is published (not in draft)

### Port already in use
```bash
# Find and kill the process
lsof -i :3000  # or :3001
kill -9 <PID>
```

## Getting Figma API Credentials

1. Go to https://www.figma.com/developers/apps
2. Click "Create a new app"
3. Fill in:
   - App name: "UI Forge Local"
   - Website URL: http://localhost:3000
   - Redirect URI: http://localhost:3000/login
4. Save and copy Client ID + Client Secret
5. Generate a Personal Access Token for backend use

## Demo Without Figma

If you don't have Figma credentials yet, you can run in demo mode:

```bash
# This creates mock data
npm run setup:demo
npm run dev
```

The demo mode uses pre-generated component data so you can still demonstrate the UI flow.
