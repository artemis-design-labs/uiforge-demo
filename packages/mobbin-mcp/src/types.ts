/**
 * Mobbin MCP Server - Type Definitions
 * Based on reverse-engineered Mobbin API (Supabase backend)
 */

// ============================================================================
// Authentication Types
// ============================================================================

export interface MobbinTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface MobbinUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface AuthState {
  tokens: MobbinTokens | null;
  user: MobbinUser | null;
  isAuthenticated: boolean;
}

// ============================================================================
// App Types
// ============================================================================

export interface MobbinApp {
  id: string;
  appName: string;
  appCategory: string;
  appStyle: string | null;
  appLogoUrl: string;
  appTagline: string;
  companyHqRegion: string;
  companyStage: string;
  platform: 'ios' | 'android' | 'web';
  appVersionId: string;
  createdAt: string;
  appVersionCreatedAt: string;
  appVersionUpdatedAt: string;
  appVersionPublishedAt: string;
  previewScreenUrls: string[];
}

export interface AppFilters {
  platform: 'ios' | 'android' | 'web';
  categories?: string[] | null;
  companyStages?: string[] | null;
  styles?: string[] | null;
  regions?: string[] | null;
  pageSize?: number;
  lastAppId?: string | null;
  lastAppVersionUpdatedAt?: string | null;
  lastAppVersionPublishedAt?: string | null;
}

// ============================================================================
// Screen Types
// ============================================================================

export interface MobbinScreen {
  id: string;
  screenNumber: number;
  screenUrl: string;
  fullpageScreenUrl: string | null;
  appVersionId: string;
  screenElements: string[];
  screenPatterns: string[];
  pagePatterns: string[];
  pageType: string;
  pageUrl: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface ScreenFilters {
  appVersionId: string;
  screenElements?: string[] | null;
  screenPatterns?: string[] | null;
  pagePatterns?: string[] | null;
  pageTypes?: string[] | null;
  keywords?: string[] | null;
}

// ============================================================================
// Flow Types
// ============================================================================

export interface FlowScreen {
  appScreenId: string;
  order: number;
  hotspotX: number | null;
  hotspotY: number | null;
  hotspotWidth: number | null;
  hotspotHeight: number | null;
  hotspotType: string | null;
  screenUrl: string;
}

export interface MobbinFlow {
  id: string;
  name: string;
  actions: string[];
  parentAppSectionId: string | null;
  order: number;
  updatedAt: string;
  appVersionId: string;
  screens: FlowScreen[];
}

export interface FlowFilters {
  appVersionId: string;
  flowTitles?: string[] | null;
  screenPatterns?: string[] | null;
  pagePatterns?: string[] | null;
  flowActions?: string[] | null;
  pageTypes?: string[] | null;
  keywords?: string[] | null;
  screenElements?: string[] | null;
}

// ============================================================================
// Collection Types
// ============================================================================

export interface MobbinCollection {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  cursor?: {
    lastId: string;
    lastUpdatedAt: string;
    lastPublishedAt: string;
  };
}

// ============================================================================
// MCP Tool Parameter Types
// ============================================================================

export interface SearchAppsParams {
  query?: string;
  platform?: 'ios' | 'android' | 'web';
  category?: string;
  limit?: number;
}

export interface GetAppScreensParams {
  appId: string;
  screenType?: string;
  pattern?: string;
}

export interface GetAppFlowsParams {
  appId: string;
  flowType?: string;
}

export interface AnalyzePatternParams {
  pattern: string;
  platform?: 'ios' | 'android' | 'web';
  sampleSize?: number;
}
