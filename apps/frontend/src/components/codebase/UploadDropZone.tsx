'use client';

import { useCallback, useState } from 'react';
import { validateZipFile } from '@/services/zipProcessor';
import { validateGitHubUrl, fetchGitHubRepo } from '@/services/githubFetcher';

type UploadMode = 'zip' | 'github';

interface UploadDropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function UploadDropZone({ onFileSelect, disabled }: UploadDropZoneProps) {
  const [mode, setMode] = useState<UploadMode>('zip');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);
  const [fetchProgress, setFetchProgress] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && mode === 'zip') {
      setIsDragging(true);
    }
  }, [disabled, mode]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setError(null);

      if (disabled || mode !== 'zip') return;

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      const file = files[0];
      const validation = validateZipFile(file);

      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      onFileSelect(file);
    },
    [disabled, mode, onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const validation = validateZipFile(file);

      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleGitHubSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (disabled || isFetchingGithub) return;

      // Validate URL
      const validation = validateGitHubUrl(githubUrl);
      if (!validation.valid) {
        setError(validation.error || 'Invalid GitHub URL');
        return;
      }

      setIsFetchingGithub(true);
      setFetchProgress('Connecting to GitHub...');

      try {
        const result = await fetchGitHubRepo(githubUrl, (message) => {
          setFetchProgress(message);
        });

        if (result.success && result.file) {
          onFileSelect(result.file);
        } else {
          setError(result.error || 'Failed to fetch repository');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch repository');
      } finally {
        setIsFetchingGithub(false);
        setFetchProgress(null);
      }
    },
    [disabled, githubUrl, isFetchingGithub, onFileSelect]
  );

  const isDisabled = disabled || isFetchingGithub;

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => { setMode('zip'); setError(null); }}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors
            flex items-center justify-center gap-2
            ${mode === 'zip'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
            }
          `}
          disabled={isDisabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          Upload ZIP
        </button>
        <button
          type="button"
          onClick={() => { setMode('github'); setError(null); }}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors
            flex items-center justify-center gap-2
            ${mode === 'github'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
            }
          `}
          disabled={isDisabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub URL
        </button>
      </div>

      {/* ZIP Upload Mode */}
      {mode === 'zip' && (
        <label
          className={`
            relative flex flex-col items-center justify-center
            w-full h-56 border-2 border-dashed rounded-xl
            transition-all cursor-pointer
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".zip"
            onChange={handleFileInput}
            disabled={isDisabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          <div className="flex flex-col items-center gap-3 p-6 text-center">
            {/* Upload Icon */}
            <div
              className={`
                flex items-center justify-center w-14 h-14 rounded-full
                ${isDragging ? 'bg-primary/20' : 'bg-muted'}
              `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-7 h-7 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
            </div>

            {/* Text */}
            <div>
              <p className="text-base font-medium">
                {isDragging ? 'Drop your ZIP file here' : 'Drop your project ZIP here'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                or click to browse
              </p>
            </div>

            {/* Size limit */}
            <p className="text-xs text-muted-foreground">
              Maximum file size: 100MB
            </p>
          </div>
        </label>
      )}

      {/* GitHub URL Mode */}
      {mode === 'github' && (
        <form onSubmit={handleGitHubSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="github-url" className="text-sm font-medium">
              Repository URL
            </label>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <input
                id="github-url"
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/owner/repo or owner/repo"
                disabled={isDisabled}
                className="w-full pl-11 pr-4 py-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a public GitHub repository URL. Private repos are not supported.
            </p>
          </div>

          {/* Fetch progress */}
          {isFetchingGithub && fetchProgress && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{fetchProgress}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isDisabled || !githubUrl.trim()}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingGithub ? 'Fetching...' : 'Analyze Repository'}
          </button>
        </form>
      )}

      {/* Supported frameworks */}
      <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground pt-2">
        <span className="px-2 py-1 rounded bg-muted">React</span>
        <span className="px-2 py-1 rounded bg-muted">Vue</span>
        <span className="px-2 py-1 rounded bg-muted">Angular</span>
        <span className="px-2 py-1 rounded bg-muted">Svelte</span>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
