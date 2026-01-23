'use client';

import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import { setTokenExportConfig } from '@/store/figmaSlice';
import type { ExportFormat, TokenType, ExportOptions } from '@/types/tokens';
import { generatePreview } from '@/services/tokenExporter';

interface TokenExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FORMAT_OPTIONS: { id: ExportFormat; name: string; description: string }[] = [
  { id: 'style-dictionary', name: 'Style Dictionary', description: 'Industry standard token format' },
  { id: 'w3c-dtcg', name: 'W3C DTCG', description: 'Design Tokens Community Group format' },
  { id: 'css', name: 'CSS Custom Properties', description: 'Native CSS variables' },
  { id: 'tailwind', name: 'Tailwind CSS', description: 'Tailwind theme configuration' },
  { id: 'typescript', name: 'TypeScript', description: 'Typed theme object' },
];

const TOKEN_TYPE_OPTIONS: { id: TokenType; name: string }[] = [
  { id: 'color', name: 'Colors' },
  { id: 'spacing', name: 'Spacing' },
  { id: 'fontSize', name: 'Font Sizes' },
  { id: 'fontFamily', name: 'Font Families' },
  { id: 'fontWeight', name: 'Font Weights' },
  { id: 'borderRadius', name: 'Border Radius' },
  { id: 'shadow', name: 'Shadows' },
  { id: 'opacity', name: 'Opacity' },
];

type ExportStage = 'idle' | 'generating' | 'downloading' | 'complete' | 'error';

export function TokenExportModal({ isOpen, onClose }: TokenExportModalProps) {
  const dispatch = useDispatch();
  const tokenCollection = useSelector((state: RootState) => state.figma.tokenCollection);
  const exportConfig = useSelector((state: RootState) => state.figma.tokenExportConfig);

  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>(exportConfig.formats);
  const [selectedTypes, setSelectedTypes] = useState<TokenType[]>(exportConfig.includeTypes);
  const [groupByCategory, setGroupByCategory] = useState(exportConfig.groupByCategory);
  const [includeTypeDefs, setIncludeTypeDefs] = useState(exportConfig.includeTypeDefinitions);
  const [generateDocs, setGenerateDocs] = useState(exportConfig.generateDocs);
  const [previewFormat, setPreviewFormat] = useState<ExportFormat>('typescript');
  const [stage, setStage] = useState<ExportStage>('idle');
  const [error, setError] = useState<string | null>(null);

  // Filter tokens by selected types for preview
  const filteredTokens = useMemo(() => {
    if (!tokenCollection) return [];
    return tokenCollection.tokens.filter(t => selectedTypes.includes(t.type));
  }, [tokenCollection, selectedTypes]);

  // Generate preview
  const preview = useMemo(() => {
    if (filteredTokens.length === 0) return '';
    try {
      return generatePreview(filteredTokens, previewFormat, {
        formats: [previewFormat],
        includeTypes: selectedTypes,
        groupByCategory,
        includeTypeDefinitions: includeTypeDefs,
        generateDocs,
      });
    } catch {
      return '// Preview unavailable';
    }
  }, [filteredTokens, previewFormat, selectedTypes, groupByCategory, includeTypeDefs, generateDocs]);

  const toggleFormat = (format: ExportFormat) => {
    setSelectedFormats(prev =>
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const toggleType = (type: TokenType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleExport = async () => {
    if (!tokenCollection || selectedFormats.length === 0) return;

    setStage('generating');
    setError(null);

    // Save config to Redux
    const config: ExportOptions = {
      formats: selectedFormats,
      includeTypes: selectedTypes,
      groupByCategory,
      includeTypeDefinitions: includeTypeDefs,
      generateDocs,
    };
    dispatch(setTokenExportConfig(config));

    try {
      setStage('downloading');

      const response = await fetch('/api/tokens/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: tokenCollection,
          config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Export failed');
      }

      // Download the zip
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tokenCollection.name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()}-tokens.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setStage('complete');

      // Auto-close after success
      setTimeout(() => {
        setStage('idle');
        onClose();
      }, 1500);
    } catch (err) {
      setStage('error');
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  if (!isOpen) return null;

  const hasTokens = tokenCollection && tokenCollection.tokens.length > 0;
  const canExport = hasTokens && selectedFormats.length > 0 && selectedTypes.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1e1e1e] rounded-lg border border-gray-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Export Design Tokens</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!hasTokens ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No tokens to export.</p>
              <p className="text-gray-500 text-sm mt-2">Import tokens first to export them.</p>
            </div>
          ) : (
            <>
              {/* Output Formats */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Output Formats</label>
                <div className="space-y-2">
                  {FORMAT_OPTIONS.map(format => (
                    <label
                      key={format.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedFormats.includes(format.id)
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFormats.includes(format.id)}
                        onChange={() => toggleFormat(format.id)}
                        className="w-4 h-4 rounded text-purple-500 bg-gray-800 border-gray-600"
                      />
                      <div className="flex-1">
                        <span className="text-white text-sm">{format.name}</span>
                        <p className="text-gray-500 text-xs">{format.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Token Types */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Token Types</label>
                <div className="flex flex-wrap gap-2">
                  {TOKEN_TYPE_OPTIONS.map(type => {
                    const count = tokenCollection.tokens.filter(t => t.type === type.id).length;
                    return (
                      <button
                        key={type.id}
                        onClick={() => toggleType(type.id)}
                        disabled={count === 0}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          selectedTypes.includes(type.id)
                            ? 'bg-purple-500 text-white'
                            : count === 0
                              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {type.name} {count > 0 && <span className="text-xs opacity-70">({count})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Options</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={groupByCategory}
                      onChange={(e) => setGroupByCategory(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-500 bg-gray-800 border-gray-600"
                    />
                    <span className="text-gray-300 text-sm">Group by category</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTypeDefs}
                      onChange={(e) => setIncludeTypeDefs(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-500 bg-gray-800 border-gray-600"
                    />
                    <span className="text-gray-300 text-sm">Include type definitions</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateDocs}
                      onChange={(e) => setGenerateDocs(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-500 bg-gray-800 border-gray-600"
                    />
                    <span className="text-gray-300 text-sm">Generate documentation</span>
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Preview</label>
                  <select
                    value={previewFormat}
                    onChange={(e) => setPreviewFormat(e.target.value as ExportFormat)}
                    className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-300 text-sm"
                  >
                    {FORMAT_OPTIONS.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-48">
                  <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">
                    {preview || '// Select token types to preview'}
                  </pre>
                </div>
              </div>

              {/* Status */}
              {stage !== 'idle' && (
                <div className={`p-3 rounded-lg ${
                  stage === 'error'
                    ? 'bg-red-500/10 border border-red-500/30'
                    : stage === 'complete'
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-purple-500/10 border border-purple-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    {stage === 'generating' && (
                      <>
                        <SpinnerIcon className="w-4 h-4 text-purple-400 animate-spin" />
                        <span className="text-purple-400 text-sm">Generating files...</span>
                      </>
                    )}
                    {stage === 'downloading' && (
                      <>
                        <SpinnerIcon className="w-4 h-4 text-purple-400 animate-spin" />
                        <span className="text-purple-400 text-sm">Preparing download...</span>
                      </>
                    )}
                    {stage === 'complete' && (
                      <>
                        <CheckIcon className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm">Export complete!</span>
                      </>
                    )}
                    {stage === 'error' && (
                      <>
                        <XIcon className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 text-sm">{error || 'Export failed'}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
          <div className="text-gray-500 text-sm">
            {filteredTokens.length} tokens selected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={!canExport || stage === 'generating' || stage === 'downloading'}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {stage === 'generating' || stage === 'downloading' ? (
                <>
                  <SpinnerIcon className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <DownloadIcon className="w-4 h-4" />
                  Download ({selectedFormats.length} format{selectedFormats.length !== 1 ? 's' : ''})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
