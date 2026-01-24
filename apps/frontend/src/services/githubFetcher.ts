/**
 * GitHub Repository Fetcher
 * Downloads GitHub repositories as ZIP files for analysis
 * Uses backend proxy to avoid CORS issues
 */

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  branch: string;
  isValid: boolean;
  error?: string;
}

/**
 * Parse a GitHub URL and extract owner, repo, and branch
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch
 * - github.com/owner/repo
 * - owner/repo
 */
export function parseGitHubUrl(url: string): GitHubRepoInfo {
  const trimmedUrl = url.trim();

  // Handle shorthand format: owner/repo
  if (/^[\w-]+\/[\w.-]+$/.test(trimmedUrl)) {
    const [owner, repo] = trimmedUrl.split('/');
    return {
      owner,
      repo: repo.replace(/\.git$/, ''),
      branch: 'main',
      isValid: true,
    };
  }

  // Handle full GitHub URLs
  const patterns = [
    // https://github.com/owner/repo/tree/branch
    /^(?:https?:\/\/)?github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)/,
    // https://github.com/owner/repo
    /^(?:https?:\/\/)?github\.com\/([^\/]+)\/([^\/]+)/,
  ];

  for (const pattern of patterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      const [, owner, repoWithExt, branch] = match;
      const repo = repoWithExt.replace(/\.git$/, '');
      return {
        owner,
        repo,
        branch: branch || 'main',
        isValid: true,
      };
    }
  }

  return {
    owner: '',
    repo: '',
    branch: '',
    isValid: false,
    error: 'Invalid GitHub URL format. Use: https://github.com/owner/repo or owner/repo',
  };
}

/**
 * Get the backend API URL for fetching GitHub repos
 */
function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
}

export interface FetchGitHubRepoResult {
  success: boolean;
  file?: File;
  error?: string;
  repoInfo?: GitHubRepoInfo;
}

/**
 * Fetch a GitHub repository as a ZIP file via backend proxy
 * This avoids CORS issues by routing through our backend
 */
export async function fetchGitHubRepo(
  url: string,
  onProgress?: (message: string) => void
): Promise<FetchGitHubRepoResult> {
  // Parse the URL for display purposes
  const repoInfo = parseGitHubUrl(url);

  if (!repoInfo.isValid) {
    return {
      success: false,
      error: repoInfo.error,
    };
  }

  onProgress?.(`Fetching ${repoInfo.owner}/${repoInfo.repo}...`);

  try {
    // Use backend proxy to fetch the repository
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/v1/github/fetch-repo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ url }),
    });

    // Check for error responses (JSON)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to fetch repository',
        repoInfo,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch repository: ${response.status} ${response.statusText}`,
        repoInfo,
      };
    }

    onProgress?.('Downloading repository...');

    // Get the ZIP data as a blob
    const blob = await response.blob();

    // Get repo info from response headers (set by backend)
    const repoName = response.headers.get('X-Repo-Name') || repoInfo.repo;
    const repoBranch = response.headers.get('X-Repo-Branch') || repoInfo.branch;

    // Create a File object from the blob
    const file = new File(
      [blob],
      `${repoName}-${repoBranch}.zip`,
      { type: 'application/zip' }
    );

    // Check file size
    if (file.size === 0) {
      return {
        success: false,
        error: 'Downloaded file is empty. The repository might be empty or the branch might not exist.',
        repoInfo,
      };
    }

    onProgress?.('Download complete!');

    return {
      success: true,
      file,
      repoInfo,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch repository',
      repoInfo,
    };
  }
}

/**
 * Validate a GitHub URL without fetching
 */
export function validateGitHubUrl(url: string): { valid: boolean; error?: string; info?: GitHubRepoInfo } {
  if (!url.trim()) {
    return { valid: false, error: 'Please enter a GitHub URL' };
  }

  const info = parseGitHubUrl(url);

  if (!info.isValid) {
    return { valid: false, error: info.error };
  }

  return { valid: true, info };
}
