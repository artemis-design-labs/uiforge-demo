# UIForge Code Generation Service

A powerful LLM-based code generation service that transforms Figma designs into production-ready React/Next.js components.

## Architecture

```
uiforge-codegen/
├── services/
│   └── generator/        # LLM service that generates code
│       ├── index.js      # Express server with API endpoints
│       └── lib/
│           ├── componentGenerator.js  # Claude AI integration
│           ├── npmPublisher.js       # NPM publishing logic
│           └── validator.js          # Input validation
└── packages/            # Generated component packages (monorepo)
```

## Features

- **AI-Powered Generation**: Uses Claude AI to generate high-quality React components from Figma JSON data
- **Multiple Frameworks**: Support for React and Next.js (Angular/Vue coming soon)
- **Styling Options**: Styled Components, Tailwind CSS, CSS Modules, Emotion, SASS
- **TypeScript Support**: Full TypeScript definitions and types
- **Testing**: Automatically generates unit tests with React Testing Library
- **NPM Publishing**: Direct publishing to npm registry with configurable scope
- **Monorepo Structure**: Lerna-based monorepo for managing multiple component packages

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key (for Claude AI)

### Installation

1. Clone the repository:
```bash
cd /home/kryotasin/Documents/Github/uiforge/uiforge-codegen
```

2. Install dependencies:
```bash
npm install
cd services/generator
npm install
```

3. Configure environment variables:
```bash
cd services/generator
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

4. Start the service:
```bash
npm run dev
# Service runs on http://localhost:8081
```

## API Endpoints

### Generate Component
```
POST /api/generate
```

Request body:
```json
{
  "componentData": {/* Figma JSON */},
  "componentImage": "base64_string", // Optional
  "config": {
    "framework": "react",
    "typescript": true,
    "styling": "styled-components",
    "includeTests": true,
    "packageScope": "@yourcompany",
    "componentName": "Button"
  }
}
```

### Generate and Publish
```
POST /api/generate-and-publish
```

Same request body as `/api/generate`, but automatically publishes to npm.

### Get Options
```
GET /api/codegen/options
```

Returns available frameworks, styling methods, and features.

### Health Check
```
GET /health
```

## Integration with UIForge

The codegen service integrates with the UIForge platform:

1. **Frontend** sends component data to Backend
2. **Backend** forwards request to Codegen service
3. **Codegen** uses LLM to generate component code
4. **NPM** package is published (optional)

## Component Generation Flow

1. User selects a Figma component in UIForge
2. Clicks "Generate Code" button in properties panel
3. Configures generation options (framework, styling, etc.)
4. Component is generated using Claude AI
5. User can download or publish to npm

## Generated Component Structure

Each generated component includes:
- Main component file (.tsx/.jsx)
- TypeScript definitions (.d.ts)
- Unit tests (.test.tsx)
- Styles (based on selected method)
- README documentation
- package.json for npm

## Publishing to NPM

Components can be published with custom scopes:
- Default: `@uiforge/componentname`
- Custom: `@yourcompany/componentname`

Users can then install:
```bash
npm install @yourcompany/button
```

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Adding New Features

1. Add new styling methods in `lib/componentGenerator.js`
2. Add new frameworks by extending the prompt builder
3. Add validation rules in `lib/validator.js`

## Environment Variables

```env
# LLM Configuration
ANTHROPIC_API_KEY=your_key_here

# Service Configuration
CODEGEN_PORT=8081
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# NPM Publishing
NPM_TOKEN=your_npm_token
DEFAULT_PACKAGE_SCOPE=@uiforge
```

## Troubleshooting

### Service not starting
- Check if port 8081 is available
- Verify ANTHROPIC_API_KEY is set

### Generation fails
- Check Figma data structure
- Verify API key has sufficient credits

### NPM publish fails
- Ensure NPM_TOKEN is set
- Check package name availability

## License

MIT