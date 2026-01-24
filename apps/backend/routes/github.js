import express from 'express';

const router = express.Router();

/**
 * Parse a GitHub URL and extract owner, repo, and branch
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch
 * - github.com/owner/repo
 * - owner/repo
 */
function parseGitHubUrl(url) {
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
 * POST /api/v1/github/fetch-repo
 * Fetches a GitHub repository as a ZIP file and returns it
 */
router.post('/fetch-repo', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'GitHub URL is required',
      });
    }

    // Parse the URL
    const repoInfo = parseGitHubUrl(url);

    if (!repoInfo.isValid) {
      return res.status(400).json({
        success: false,
        error: repoInfo.error,
      });
    }

    // Try to fetch the ZIP file from GitHub
    const zipUrl = `https://github.com/${repoInfo.owner}/${repoInfo.repo}/archive/refs/heads/${repoInfo.branch}.zip`;
    const altZipUrl = `https://codeload.github.com/${repoInfo.owner}/${repoInfo.repo}/zip/refs/heads/${repoInfo.branch}`;

    let response = await fetch(zipUrl);

    // Try alternative URL if primary fails
    if (!response.ok) {
      response = await fetch(altZipUrl);
    }

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          error: `Repository not found or is private. Make sure the repository exists and is public: ${repoInfo.owner}/${repoInfo.repo}`,
        });
      }

      return res.status(response.status).json({
        success: false,
        error: `Failed to fetch repository: ${response.status} ${response.statusText}`,
      });
    }

    // Get the ZIP data as a buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if the file is empty
    if (buffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Downloaded file is empty. The repository might be empty or the branch might not exist.',
      });
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        error: `Repository is too large (${Math.round(buffer.length / 1024 / 1024)}MB). Maximum size is 100MB.`,
      });
    }

    // Set response headers for ZIP file
    const filename = `${repoInfo.repo}-${repoInfo.branch}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('X-Repo-Owner', repoInfo.owner);
    res.setHeader('X-Repo-Name', repoInfo.repo);
    res.setHeader('X-Repo-Branch', repoInfo.branch);

    // Send the ZIP file
    res.send(buffer);
  } catch (error) {
    console.error('GitHub fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch repository',
    });
  }
});

/**
 * POST /api/v1/github/validate-url
 * Validates a GitHub URL without fetching
 */
router.post('/validate-url', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      valid: false,
      error: 'GitHub URL is required',
    });
  }

  const info = parseGitHubUrl(url);

  if (!info.isValid) {
    return res.status(400).json({
      valid: false,
      error: info.error,
    });
  }

  res.json({
    valid: true,
    info: {
      owner: info.owner,
      repo: info.repo,
      branch: info.branch,
    },
  });
});

export default router;
