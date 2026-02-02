/**
 * Mobbin API Client
 * Interfaces with Mobbin's Supabase backend
 */

import { MobbinAuth, getMobbinAuth } from './auth.js';
import {
  MobbinApp,
  MobbinScreen,
  MobbinFlow,
  AppFilters,
  ScreenFilters,
  FlowFilters,
  PaginatedResponse,
} from './types.js';

const SUPABASE_URL = 'https://ujasntkfphywizsdaapi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYXNudGtmcGh5d2l6c2RhYXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTQ1MzIxNjEsImV4cCI6MTk3MDEwODE2MX0.36e8FfSVUGBHxUvLXpHCNOLFLNMPWEkEsMftCqNhfQI';

export class MobbinAPI {
  private auth: MobbinAuth;

  constructor(auth?: MobbinAuth) {
    this.auth = auth || getMobbinAuth();
  }

  /**
   * Build headers for API requests
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const accessToken = await this.auth.getAccessToken();

    return {
      'X-Client-Info': 'supabase-js/1.35.7',
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Profile': 'public',
      'apikey': SUPABASE_ANON_KEY,
      'Origin': 'https://mobbin.com',
      'Referer': 'https://mobbin.com/',
    };
  }

  /**
   * Make authenticated POST request to Supabase RPC endpoint
   */
  private async rpc<T>(
    functionName: string,
    params: Record<string, unknown>,
    select?: string
  ): Promise<T> {
    const headers = await this.getHeaders();
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`);

    if (select) {
      url.searchParams.set('select', select);
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mobbin API error (${functionName}): ${response.status} - ${errorText}`);
    }

    return (await response.json()) as T;
  }

  // ==========================================================================
  // App Methods
  // ==========================================================================

  /**
   * Get apps with optional filters and pagination
   */
  async getApps(filters: Partial<AppFilters> = {}): Promise<PaginatedResponse<MobbinApp>> {
    const params = {
      filterAppCategories: filters.categories || null,
      filterAppCompanyStages: filters.companyStages || null,
      filterAppPlatform: filters.platform || 'ios',
      filterOperator: 'and',
      filterAppStyles: filters.styles || null,
      filterAppRegions: filters.regions || null,
      pageSize: filters.pageSize || 24,
      lastAppId: filters.lastAppId || null,
      lastAppVersionUpdatedAt: filters.lastAppVersionUpdatedAt || null,
      lastAppVersionPublishedAt: filters.lastAppVersionPublishedAt || null,
    };

    const data = await this.rpc<MobbinApp[]>(
      'get_apps_with_preview_screens_filter',
      params,
      '*'
    );

    const hasMore = data.length === (filters.pageSize || 24);
    const lastApp = data[data.length - 1];

    return {
      data,
      hasMore,
      cursor: hasMore && lastApp ? {
        lastId: lastApp.id,
        lastUpdatedAt: lastApp.appVersionUpdatedAt,
        lastPublishedAt: lastApp.appVersionPublishedAt,
      } : undefined,
    };
  }

  /**
   * Search apps by name (client-side filtering)
   */
  async searchApps(
    query: string,
    platform: 'ios' | 'android' | 'web' = 'ios',
    limit: number = 10
  ): Promise<MobbinApp[]> {
    const results: MobbinApp[] = [];
    let cursor: AppFilters['lastAppId'] = null;
    let lastUpdatedAt: string | null = null;
    let lastPublishedAt: string | null = null;
    const queryLower = query.toLowerCase();

    // Paginate through results until we find enough matches or run out
    while (results.length < limit) {
      const response = await this.getApps({
        platform,
        pageSize: 24,
        lastAppId: cursor,
        lastAppVersionUpdatedAt: lastUpdatedAt,
        lastAppVersionPublishedAt: lastPublishedAt,
      });

      for (const app of response.data) {
        if (
          app.appName.toLowerCase().includes(queryLower) ||
          app.appCategory.toLowerCase().includes(queryLower) ||
          app.appTagline.toLowerCase().includes(queryLower)
        ) {
          results.push(app);
          if (results.length >= limit) break;
        }
      }

      if (!response.hasMore || !response.cursor) break;

      cursor = response.cursor.lastId;
      lastUpdatedAt = response.cursor.lastUpdatedAt;
      lastPublishedAt = response.cursor.lastPublishedAt;
    }

    return results.slice(0, limit);
  }

  /**
   * Get app count by platform
   */
  async getAppCount(platform: 'ios' | 'android' | 'web' = 'ios'): Promise<number> {
    const data = await this.rpc<{ count: number }>(
      'get_apps_count',
      { filterAppPlatform: platform }
    );
    return data.count;
  }

  // ==========================================================================
  // Screen Methods
  // ==========================================================================

  /**
   * Get screens for a specific app version
   */
  async getScreens(filters: ScreenFilters): Promise<MobbinScreen[]> {
    const params = {
      filterAppVersionId: filters.appVersionId,
      filterOperator: 'and',
      filterScreenElements: filters.screenElements || null,
      filterScreenPatterns: filters.screenPatterns || null,
      filterPagePatterns: filters.pagePatterns || null,
      filterPageTypes: filters.pageTypes || null,
      filterScreenKeywords: filters.keywords || null,
    };

    const select = [
      'screenNumber',
      'screenUrl',
      'appVersionId',
      'id',
      'screenElements',
      'screenPatterns',
      'pagePatterns',
      'pageType',
      'pageUrl',
      'fullpageScreenUrl',
      'updatedAt',
      'createdAt',
    ].join(',');

    return this.rpc<MobbinScreen[]>('get_app_screens_filter', params, select);
  }

  /**
   * Get screens for an app by app ID (convenience method)
   */
  async getAppScreens(appId: string): Promise<MobbinScreen[]> {
    // First, we need to find the app to get its version ID
    // This is a limitation - we need to search for the app first
    const apps = await this.searchApps(appId, 'ios', 100);
    const app = apps.find(a => a.id === appId || a.appName.toLowerCase() === appId.toLowerCase());

    if (!app) {
      throw new Error(`App not found: ${appId}`);
    }

    return this.getScreens({ appVersionId: app.appVersionId });
  }

  // ==========================================================================
  // Flow Methods
  // ==========================================================================

  /**
   * Get flows (user journeys) for a specific app version
   */
  async getFlows(filters: FlowFilters): Promise<MobbinFlow[]> {
    const params = {
      filterAppVersionId: filters.appVersionId,
      filterOperator: 'and',
      filterFlowTitles: filters.flowTitles || null,
      filterScreenPatterns: filters.screenPatterns || null,
      filterPagePatterns: filters.pagePatterns || null,
      filterFlowActions: filters.flowActions || null,
      filterPageTypes: filters.pageTypes || null,
      filterScreenKeywords: filters.keywords || null,
      filterScreenElements: filters.screenElements || null,
    };

    return this.rpc<MobbinFlow[]>('get_app_sections_filter', params, '*');
  }

  /**
   * Get flows for an app by app ID (convenience method)
   */
  async getAppFlows(appId: string): Promise<MobbinFlow[]> {
    const apps = await this.searchApps(appId, 'ios', 100);
    const app = apps.find(a => a.id === appId || a.appName.toLowerCase() === appId.toLowerCase());

    if (!app) {
      throw new Error(`App not found: ${appId}`);
    }

    return this.getFlows({ appVersionId: app.appVersionId });
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get the Mobbin build ID (used for some direct API calls)
   */
  async getMobbinBuildId(): Promise<string> {
    const response = await fetch('https://mobbin.com/', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Mobbin homepage: ${response.status}`);
    }

    const html = await response.text();
    const match = html.match(/"buildId":"([\w\d]+)"/);

    if (!match) {
      throw new Error('Could not find Mobbin build ID');
    }

    return match[1];
  }

  /**
   * Get available app categories
   */
  async getCategories(): Promise<string[]> {
    // These are the known categories from Mobbin
    return [
      'Business',
      'Developer Tools',
      'Education',
      'Entertainment',
      'Finance',
      'Food & Drink',
      'Games',
      'Graphics & Design',
      'Health & Fitness',
      'Kids',
      'Lifestyle',
      'Magazines & Newspapers',
      'Medical',
      'Music',
      'Navigation',
      'News',
      'Photo & Video',
      'Productivity',
      'Reference',
      'Shopping',
      'Social Networking',
      'Sports',
      'Stickers',
      'Travel',
      'Utilities',
      'Weather',
    ];
  }

  /**
   * Get available screen patterns
   */
  async getScreenPatterns(): Promise<string[]> {
    // Common patterns from Mobbin
    return [
      'Cards',
      'Charts',
      'Empty States',
      'Forms',
      'Lists',
      'Maps',
      'Media Players',
      'Modals',
      'Navigation',
      'Onboarding',
      'Profiles',
      'Search',
      'Settings',
      'Social',
      'Tables',
      'Tabs',
    ];
  }
}

// Singleton instance
let apiInstance: MobbinAPI | null = null;

export function getMobbinAPI(auth?: MobbinAuth): MobbinAPI {
  if (!apiInstance) {
    apiInstance = new MobbinAPI(auth);
  }
  return apiInstance;
}
