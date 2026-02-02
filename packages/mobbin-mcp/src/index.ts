#!/usr/bin/env node

/**
 * Mobbin MCP Server
 * Connects Claude to Mobbin's UI design pattern library
 *
 * Usage:
 *   1. Set MOBBIN_EMAIL environment variable
 *   2. Run the server
 *   3. Complete email verification on first run
 *   4. Use tools to search apps, screens, and flows
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { getMobbinAuth } from './auth.js';
import { getMobbinAPI } from './api.js';
import * as path from 'path';
import * as os from 'os';

// Token storage location
const TOKEN_FILE = path.join(os.homedir(), '.mobbin-mcp', 'tokens.json');

// Initialize auth and API
const auth = getMobbinAuth(TOKEN_FILE);
const api = getMobbinAPI(auth);

// Track if we're in verification mode
let pendingVerification = false;

// =============================================================================
// Tool Definitions
// =============================================================================

const TOOLS: Tool[] = [
  {
    name: 'mobbin_auth_status',
    description: 'Check Mobbin authentication status. Returns whether you are logged in and user details.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'mobbin_login',
    description: 'Start Mobbin login process. Sends a verification code to the provided email address. After calling this, check your email and use mobbin_verify to complete login.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Your Mobbin account email address',
        },
      },
      required: ['email'],
    },
  },
  {
    name: 'mobbin_verify',
    description: 'Complete Mobbin login by providing the verification code from your email.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The 6-digit verification code from your email',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'mobbin_search_apps',
    description: 'Search Mobbin for apps by name, category, or keywords. Returns app details including preview screenshots.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (app name, category, or keyword)',
        },
        platform: {
          type: 'string',
          enum: ['ios', 'android', 'web'],
          description: 'Platform to search (default: ios)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10, max: 50)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'mobbin_get_app_screens',
    description: 'Get all UI screens from a specific app. Returns screen URLs, patterns, and UI elements.',
    inputSchema: {
      type: 'object',
      properties: {
        appName: {
          type: 'string',
          description: 'Name of the app (e.g., "Spotify", "Airbnb")',
        },
        screenType: {
          type: 'string',
          description: 'Filter by screen type/pattern (e.g., "onboarding", "settings", "profile")',
        },
      },
      required: ['appName'],
    },
  },
  {
    name: 'mobbin_get_app_flows',
    description: 'Get user journey flows from an app. Returns sequences of screens showing how users navigate through features.',
    inputSchema: {
      type: 'object',
      properties: {
        appName: {
          type: 'string',
          description: 'Name of the app',
        },
        flowType: {
          type: 'string',
          description: 'Filter by flow type (e.g., "onboarding", "checkout", "signup")',
        },
      },
      required: ['appName'],
    },
  },
  {
    name: 'mobbin_browse_apps',
    description: 'Browse apps by category and platform. Returns a paginated list of apps.',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['ios', 'android', 'web'],
          description: 'Platform to browse (default: ios)',
        },
        category: {
          type: 'string',
          description: 'App category (e.g., "Finance", "Social Networking", "Productivity")',
        },
        limit: {
          type: 'number',
          description: 'Number of apps to return (default: 24)',
        },
      },
      required: [],
    },
  },
  {
    name: 'mobbin_get_categories',
    description: 'Get list of available app categories on Mobbin.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'mobbin_get_patterns',
    description: 'Get list of available UI patterns/screen types on Mobbin.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

async function handleAuthStatus() {
  const state = auth.getAuthState();

  if (state.isAuthenticated && state.user) {
    return {
      status: 'authenticated',
      user: {
        email: state.user.email,
        name: state.user.fullName || 'Unknown',
      },
      message: 'You are logged in to Mobbin. You can now search apps, screens, and flows.',
    };
  }

  if (pendingVerification) {
    return {
      status: 'pending_verification',
      message: 'Verification code sent. Check your email and use mobbin_verify with the code.',
    };
  }

  return {
    status: 'not_authenticated',
    message: 'Not logged in. Use mobbin_login with your email to start authentication.',
  };
}

async function handleLogin(email: string) {
  try {
    await auth.sendVerificationEmail(email);
    pendingVerification = true;

    return {
      success: true,
      message: `Verification email sent to ${email}. Check your inbox (and spam folder) for a code from Mobbin. Use mobbin_verify with the code to complete login.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send verification email',
    };
  }
}

async function handleVerify(code: string) {
  try {
    const user = await auth.verifyCode(code);
    pendingVerification = false;

    return {
      success: true,
      message: `Successfully logged in as ${user.email}. You can now search Mobbin for UI patterns.`,
      user: {
        email: user.email,
        name: user.fullName || 'Unknown',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify code',
    };
  }
}

async function handleSearchApps(query: string, platform: string = 'ios', limit: number = 10) {
  if (!auth.isAuthenticated()) {
    return { error: 'Not authenticated. Please login first using mobbin_login.' };
  }

  try {
    const apps = await api.searchApps(
      query,
      platform as 'ios' | 'android' | 'web',
      Math.min(limit, 50)
    );

    return {
      count: apps.length,
      apps: apps.map(app => ({
        id: app.id,
        name: app.appName,
        category: app.appCategory,
        tagline: app.appTagline,
        platform: app.platform,
        logoUrl: app.appLogoUrl,
        previewScreens: app.previewScreenUrls.slice(0, 3),
        companyStage: app.companyStage,
        region: app.companyHqRegion,
      })),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to search apps',
    };
  }
}

async function handleGetAppScreens(appName: string, screenType?: string) {
  if (!auth.isAuthenticated()) {
    return { error: 'Not authenticated. Please login first using mobbin_login.' };
  }

  try {
    const screens = await api.getAppScreens(appName);

    // Filter by screen type if provided
    let filteredScreens = screens;
    if (screenType) {
      const typeLower = screenType.toLowerCase();
      filteredScreens = screens.filter(screen =>
        screen.pageType?.toLowerCase().includes(typeLower) ||
        screen.screenPatterns.some(p => p.toLowerCase().includes(typeLower)) ||
        screen.pagePatterns.some(p => p.toLowerCase().includes(typeLower))
      );
    }

    return {
      appName,
      totalScreens: screens.length,
      filteredCount: filteredScreens.length,
      screens: filteredScreens.slice(0, 20).map(screen => ({
        id: screen.id,
        number: screen.screenNumber,
        url: screen.screenUrl,
        fullPageUrl: screen.fullpageScreenUrl,
        pageType: screen.pageType,
        patterns: screen.screenPatterns,
        elements: screen.screenElements,
      })),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get app screens',
    };
  }
}

async function handleGetAppFlows(appName: string, flowType?: string) {
  if (!auth.isAuthenticated()) {
    return { error: 'Not authenticated. Please login first using mobbin_login.' };
  }

  try {
    const flows = await api.getAppFlows(appName);

    // Filter by flow type if provided
    let filteredFlows = flows;
    if (flowType) {
      const typeLower = flowType.toLowerCase();
      filteredFlows = flows.filter(flow =>
        flow.name.toLowerCase().includes(typeLower) ||
        flow.actions.some(a => a.toLowerCase().includes(typeLower))
      );
    }

    return {
      appName,
      totalFlows: flows.length,
      filteredCount: filteredFlows.length,
      flows: filteredFlows.slice(0, 10).map(flow => ({
        id: flow.id,
        name: flow.name,
        actions: flow.actions,
        screenCount: flow.screens.length,
        screens: flow.screens.map(s => ({
          url: s.screenUrl,
          order: s.order,
          hasHotspot: !!(s.hotspotX && s.hotspotY),
        })),
      })),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get app flows',
    };
  }
}

async function handleBrowseApps(platform: string = 'ios', category?: string, limit: number = 24) {
  if (!auth.isAuthenticated()) {
    return { error: 'Not authenticated. Please login first using mobbin_login.' };
  }

  try {
    const response = await api.getApps({
      platform: platform as 'ios' | 'android' | 'web',
      categories: category ? [category] : null,
      pageSize: Math.min(limit, 50),
    });

    return {
      count: response.data.length,
      hasMore: response.hasMore,
      apps: response.data.map(app => ({
        id: app.id,
        name: app.appName,
        category: app.appCategory,
        tagline: app.appTagline,
        logoUrl: app.appLogoUrl,
        previewScreens: app.previewScreenUrls.slice(0, 3),
      })),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to browse apps',
    };
  }
}

async function handleGetCategories() {
  const categories = await api.getCategories();
  return { categories };
}

async function handleGetPatterns() {
  const patterns = await api.getScreenPatterns();
  return { patterns };
}

// =============================================================================
// MCP Server Setup
// =============================================================================

const server = new Server(
  {
    name: 'mobbin-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case 'mobbin_auth_status':
        result = await handleAuthStatus();
        break;

      case 'mobbin_login':
        result = await handleLogin(args?.email as string);
        break;

      case 'mobbin_verify':
        result = await handleVerify(args?.code as string);
        break;

      case 'mobbin_search_apps':
        result = await handleSearchApps(
          args?.query as string,
          args?.platform as string,
          args?.limit as number
        );
        break;

      case 'mobbin_get_app_screens':
        result = await handleGetAppScreens(
          args?.appName as string,
          args?.screenType as string
        );
        break;

      case 'mobbin_get_app_flows':
        result = await handleGetAppFlows(
          args?.appName as string,
          args?.flowType as string
        );
        break;

      case 'mobbin_browse_apps':
        result = await handleBrowseApps(
          args?.platform as string,
          args?.category as string,
          args?.limit as number
        );
        break;

      case 'mobbin_get_categories':
        result = await handleGetCategories();
        break;

      case 'mobbin_get_patterns':
        result = await handleGetPatterns();
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
      ],
      isError: true,
    };
  }
});

// =============================================================================
// Server Startup
// =============================================================================

async function main() {
  // Try to load persisted tokens on startup
  const hasTokens = await auth.loadPersistedTokens();

  if (hasTokens) {
    console.error('[mobbin-mcp] Loaded saved authentication tokens');
  } else {
    console.error('[mobbin-mcp] No saved tokens found. Use mobbin_login to authenticate.');
  }

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[mobbin-mcp] Mobbin MCP server started');
}

main().catch((error) => {
  console.error('[mobbin-mcp] Fatal error:', error);
  process.exit(1);
});
