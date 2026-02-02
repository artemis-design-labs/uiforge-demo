# Mobbin MCP Server

Connect Claude directly to your Mobbin account to search UI design patterns, app screens, and user flows.

## Features

- **Search Apps**: Find apps by name, category, or keywords
- **Browse Screens**: View all UI screens from any app in Mobbin's database
- **Explore Flows**: Access user journey flows showing navigation patterns
- **Filter by Pattern**: Filter screens by UI patterns (onboarding, settings, etc.)

## Installation

### Option 1: From Source

```bash
cd packages/mobbin-mcp
npm install
npm run build
```

### Option 2: npx (coming soon)

```bash
npx @uiforge/mobbin-mcp
```

## Configuration

### Claude Code

Add to your `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mobbin": {
      "command": "node",
      "args": ["/path/to/uiforge-demo/packages/mobbin-mcp/dist/index.js"]
    }
  }
}
```

### Cursor / VS Code

Add to your `.cursor/mcp.json` or workspace settings:

```json
{
  "mcpServers": {
    "mobbin": {
      "command": "node",
      "args": ["./packages/mobbin-mcp/dist/index.js"]
    }
  }
}
```

## Authentication

The MCP server uses Mobbin's email verification flow:

1. Call `mobbin_login` with your email
2. Check your email for a verification code
3. Call `mobbin_verify` with the code
4. Tokens are saved to `~/.mobbin-mcp/tokens.json` for future sessions

## Available Tools

### `mobbin_auth_status`
Check if you're logged in to Mobbin.

### `mobbin_login`
Start the login process by sending a verification email.

**Parameters:**
- `email` (required): Your Mobbin account email

### `mobbin_verify`
Complete login with the verification code from your email.

**Parameters:**
- `code` (required): 6-digit verification code

### `mobbin_search_apps`
Search for apps by name, category, or keywords.

**Parameters:**
- `query` (required): Search term
- `platform`: ios, android, or web (default: ios)
- `limit`: Max results (default: 10, max: 50)

**Example:**
```
Search for "fintech" apps on iOS
```

### `mobbin_get_app_screens`
Get all UI screens from a specific app.

**Parameters:**
- `appName` (required): Name of the app
- `screenType`: Filter by pattern (e.g., "onboarding", "settings")

**Example:**
```
Get all onboarding screens from Spotify
```

### `mobbin_get_app_flows`
Get user journey flows from an app.

**Parameters:**
- `appName` (required): Name of the app
- `flowType`: Filter by flow type (e.g., "signup", "checkout")

**Example:**
```
Get the signup flow from Airbnb
```

### `mobbin_browse_apps`
Browse apps by category and platform.

**Parameters:**
- `platform`: ios, android, or web
- `category`: App category (e.g., "Finance", "Social Networking")
- `limit`: Number of results (default: 24)

### `mobbin_get_categories`
Get list of available app categories.

### `mobbin_get_patterns`
Get list of available UI patterns/screen types.

## Example Conversations

### Finding Design Inspiration

> "Show me the best onboarding flows from social media apps"

The AI will:
1. Search for social networking apps
2. Get onboarding flows from top results
3. Return screen sequences with URLs

### Analyzing Competitors

> "Compare the checkout flows of Uber, Lyft, and DoorDash"

The AI will:
1. Get checkout flows from each app
2. Analyze the patterns and steps
3. Provide comparison insights

### Building a Feature

> "I need to design a profile settings screen. Show me how Spotify, Instagram, and Twitter do it"

The AI will:
1. Get settings screens from each app
2. Identify common patterns
3. Suggest implementation approaches

## Troubleshooting

### "Not authenticated" errors
Run `mobbin_login` with your email and complete verification.

### Tokens expired
Tokens refresh automatically, but if issues persist, delete `~/.mobbin-mcp/tokens.json` and re-authenticate.

### Rate limiting
The server doesn't implement explicit rate limiting. If you hit Mobbin's limits, wait a few minutes.

## Legal Notice

This MCP server uses an unofficial API based on reverse-engineering Mobbin's web application. It requires a valid Mobbin account. Use responsibly and in accordance with Mobbin's terms of service.

## License

MIT
