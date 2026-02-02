/**
 * Mobbin Authentication Module
 * Handles Supabase-based authentication with magic link verification
 */

import { MobbinTokens, MobbinUser, AuthState } from './types.js';

// Supabase API configuration (from reverse-engineered Mobbin API)
const SUPABASE_URL = 'https://ujasntkfphywizsdaapi.supabase.co';

// This is a public anon key used by the Mobbin web app
// It's safe to include as it only allows authenticated operations
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYXNudGtmcGh5d2l6c2RhYXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTQ1MzIxNjEsImV4cCI6MTk3MDEwODE2MX0.36e8FfSVUGBHxUvLXpHCNOLFLNMPWEkEsMftCqNhfQI';

const DEFAULT_HEADERS = {
  'X-Client-Info': 'supabase-js/1.35.7',
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Origin': 'https://mobbin.com',
  'Referer': 'https://mobbin.com/',
};

export class MobbinAuth {
  private tokens: MobbinTokens | null = null;
  private user: MobbinUser | null = null;
  private email: string | null = null;
  private tokenFilePath: string | null = null;

  constructor(tokenFilePath?: string) {
    this.tokenFilePath = tokenFilePath || null;
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return {
      tokens: this.tokens,
      user: this.user,
      isAuthenticated: this.isAuthenticated(),
    };
  }

  /**
   * Check if user is authenticated with valid tokens
   */
  isAuthenticated(): boolean {
    if (!this.tokens) return false;
    return new Date() < this.tokens.expiresAt;
  }

  /**
   * Get current access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    if (!this.tokens) {
      throw new Error('Not authenticated. Call sendVerificationEmail first.');
    }

    // Check if token is expired or about to expire (5 min buffer)
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    if (new Date().getTime() + bufferTime > this.tokens.expiresAt.getTime()) {
      await this.refreshTokens();
    }

    return this.tokens.accessToken;
  }

  /**
   * Step 1: Check if email requires password authentication
   */
  async checkPasswordRequired(email: string): Promise<boolean> {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/get_should_use_password_for_email`,
      {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Content-Profile': 'public',
        },
        body: JSON.stringify({ target_email: email }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check password requirement: ${response.status}`);
    }

    return (await response.json()) as boolean;
  }

  /**
   * Step 2: Send magic link verification email
   */
  async sendVerificationEmail(email: string): Promise<void> {
    this.email = email;

    const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify({
        email: email,
        create_user: true,
        gotrue_meta_security: {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send verification email: ${response.status} - ${errorText}`);
    }
  }

  /**
   * Step 3: Verify the code from email and get tokens
   */
  async verifyCode(code: string): Promise<MobbinUser> {
    if (!this.email) {
      throw new Error('No email set. Call sendVerificationEmail first.');
    }

    const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        email: this.email,
        token: code,
        type: 'magiclink',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to verify code: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      user: {
        id: string;
        email: string;
        user_metadata?: {
          full_name?: string;
          avatar_url?: string;
        };
      };
    };

    // Store tokens
    this.tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      // Tokens typically expire in 1 hour, but we'll be conservative
      expiresAt: new Date(Date.now() + 55 * 60 * 1000),
    };

    // Store user info
    this.user = {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.user_metadata?.full_name,
      avatarUrl: data.user.user_metadata?.avatar_url,
    };

    // Persist tokens if file path is set
    await this.persistTokens();

    return this.user;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        refresh_token: this.tokens.refreshToken,
      }),
    });

    if (!response.ok) {
      // If refresh fails, clear tokens
      this.tokens = null;
      this.user = null;
      throw new Error('Token refresh failed. Please re-authenticate.');
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
    };

    this.tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + 55 * 60 * 1000),
    };

    await this.persistTokens();
  }

  /**
   * Load tokens from environment or file
   */
  async loadPersistedTokens(): Promise<boolean> {
    // Try environment variables first
    const envAccessToken = process.env.MOBBIN_ACCESS_TOKEN;
    const envRefreshToken = process.env.MOBBIN_REFRESH_TOKEN;

    if (envAccessToken && envRefreshToken) {
      this.tokens = {
        accessToken: envAccessToken,
        refreshToken: envRefreshToken,
        // Assume token might be expired, will refresh on first use
        expiresAt: new Date(Date.now() - 1000),
      };

      try {
        await this.refreshTokens();
        return true;
      } catch {
        this.tokens = null;
        return false;
      }
    }

    // Try loading from file if path is set
    if (this.tokenFilePath) {
      try {
        const fs = await import('fs/promises');
        const data = await fs.readFile(this.tokenFilePath, 'utf-8');
        const parsed = JSON.parse(data);

        this.tokens = {
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken,
          expiresAt: new Date(parsed.expiresAt),
        };

        if (parsed.user) {
          this.user = parsed.user;
          this.email = parsed.user.email;
        }

        // Try to refresh if expired
        if (!this.isAuthenticated()) {
          await this.refreshTokens();
        }

        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Persist tokens to file
   */
  private async persistTokens(): Promise<void> {
    if (!this.tokenFilePath || !this.tokens) return;

    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      // Ensure directory exists
      const dir = path.dirname(this.tokenFilePath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(
        this.tokenFilePath,
        JSON.stringify({
          accessToken: this.tokens.accessToken,
          refreshToken: this.tokens.refreshToken,
          expiresAt: this.tokens.expiresAt.toISOString(),
          user: this.user,
        }, null, 2)
      );
    } catch (error) {
      console.error('Failed to persist tokens:', error);
    }
  }

  /**
   * Clear authentication state
   */
  logout(): void {
    this.tokens = null;
    this.user = null;
    this.email = null;
  }
}

// Singleton instance
let authInstance: MobbinAuth | null = null;

export function getMobbinAuth(tokenFilePath?: string): MobbinAuth {
  if (!authInstance) {
    authInstance = new MobbinAuth(tokenFilePath);
  }
  return authInstance;
}
