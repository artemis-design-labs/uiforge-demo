'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store';
import {
  setTokenCollection,
  setTokenValidation,
  mergeTokenCollection,
  setTokenCollectionError,
} from '@/store/figmaSlice';
import { importTokens, detectFormat, getTokenStats } from '@/services/tokenService';
import { validateTokens } from '@/services/tokenValidator';
import type { DesignToken, TokenSource } from '@/types/tokens';

interface TokenImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportMode = 'replace' | 'merge';

export function TokenImportModal({ isOpen, onClose }: TokenImportModalProps) {
  const dispatch = useDispatch();
  const existingCollection = useSelector((state: RootState) => state.figma.tokenCollection);

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<TokenSource | 'unknown' | null>(null);
  const [previewTokens, setPreviewTokens] = useState<DesignToken[] | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>(existingCollection ? 'merge' : 'replace');
  const [collectionName, setCollectionName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  }, []);

  const processFile = async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);

    try {
      const content = await selectedFile.text();
      setFileContent(content);

      // Detect format
      const format = detectFormat(content, selectedFile.name);
      setDetectedFormat(format);

      if (format === 'unknown') {
        setError('Could not detect file format. Please use Style Dictionary, Token Studio, W3C DTCG, or CSV format.');
        return;
      }

      // Parse and preview tokens
      const collection = importTokens(content, {
        mode: 'replace',
        fileName: selectedFile.name,
      });

      setPreviewTokens(collection.tokens);
      setCollectionName(collection.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setPreviewTokens(null);
    }
  };

  const handleImport = async () => {
    if (!fileContent || !previewTokens) return;

    setIsImporting(true);
    setError(null);

    try {
      const collection = importTokens(fileContent, {
        mode: importMode,
        fileName: file?.name,
        collectionName: collectionName || undefined,
      });

      // Validate tokens
      const validation = validateTokens(collection);

      if (importMode === 'merge' && existingCollection) {
        dispatch(mergeTokenCollection(collection));
      } else {
        dispatch(setTokenCollection(collection));
      }

      dispatch(setTokenValidation(validation));

      // Close modal on success
      onClose();
      resetState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      dispatch(setTokenCollectionError(err instanceof Error ? err.message : 'Import failed'));
    } finally {
      setIsImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setFileContent(null);
    setDetectedFormat(null);
    setPreviewTokens(null);
    setCollectionName('');
    setError(null);
    setImportMode(existingCollection ? 'merge' : 'replace');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  const stats = previewTokens ? getPreviewStats(previewTokens) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1e1e1e] rounded-lg border border-gray-700 w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Import Design Tokens</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${isDragging
                ? 'border-purple-500 bg-purple-500/10'
                : file
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div className="space-y-2">
                <FileIcon className="w-10 h-10 mx-auto text-green-400" />
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-gray-400 text-sm">Click to change file</p>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadIcon className="w-10 h-10 mx-auto text-gray-400" />
                <p className="text-gray-300">Drop file here or click to browse</p>
                <p className="text-gray-500 text-sm">
                  Supports: Figma Variables, Style Dictionary, Token Studio, W3C DTCG, CSV
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Detected Format */}
          {detectedFormat && detectedFormat !== 'unknown' && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Detected Format:</span>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                {formatDisplayName(detectedFormat)}
              </span>
            </div>
          )}

          {/* Preview */}
          {previewTokens && stats && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">
                  Preview ({previewTokens.length} tokens found)
                </span>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 capitalize">{type}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                ))}
              </div>

              {/* Sample Tokens */}
              <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                <span className="text-gray-500 text-xs uppercase">Sample Tokens</span>
                {previewTokens.slice(0, 5).map((token, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {token.type === 'color' && (
                      <div
                        className="w-4 h-4 rounded border border-gray-600"
                        style={{ backgroundColor: String(token.value) }}
                      />
                    )}
                    <span className="text-purple-400">{token.name}</span>
                    <span className="text-gray-500 ml-auto truncate max-w-[120px]">
                      {String(token.value)}
                    </span>
                  </div>
                ))}
                {previewTokens.length > 5 && (
                  <div className="text-gray-500 text-xs">
                    +{previewTokens.length - 5} more tokens
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collection Name */}
          {previewTokens && (
            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Collection Name</label>
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="My Design System"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {/* Import Mode */}
          {previewTokens && existingCollection && (
            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Import Mode</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="w-4 h-4 text-purple-500"
                  />
                  <div>
                    <span className="text-white text-sm">Replace all existing tokens</span>
                    <p className="text-gray-500 text-xs">Remove current tokens and use imported ones</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="w-4 h-4 text-purple-500"
                  />
                  <div>
                    <span className="text-white text-sm">Merge with existing (keep both)</span>
                    <p className="text-gray-500 text-xs">Add new tokens, keep existing ones</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!previewTokens || isImporting}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <SpinnerIcon className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>Import {previewTokens?.length || 0} Tokens</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function getPreviewStats(tokens: DesignToken[]): { byType: Record<string, number> } {
  const byType: Record<string, number> = {};
  for (const token of tokens) {
    byType[token.type] = (byType[token.type] || 0) + 1;
  }
  return { byType };
}

function formatDisplayName(format: TokenSource): string {
  const names: Record<TokenSource, string> = {
    'style-dictionary': 'Style Dictionary',
    'token-studio': 'Token Studio',
    'w3c-dtcg': 'W3C DTCG',
    'csv': 'CSV',
    'manual': 'Manual JSON',
    'figma': 'Figma',
    'figma-variables': 'Figma Variables',
  };
  return names[format] || format;
}

// Icons
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}
