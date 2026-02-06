'use client';

import { useState, useRef, useCallback } from 'react';
import { Sandpack, SandpackPreview, SandpackProvider } from '@codesandbox/sandpack-react';
import { downloadAsSvg, downloadAsPng, extractComponentName } from '@/services/svgExporter';

interface ReactToFigmaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CODE = `export default function Component() {
  return (
    <div style={{
      padding: 24,
      background: '#ffffff',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{
        margin: 0,
        fontSize: 24,
        fontWeight: 600,
        color: '#1a1a1a'
      }}>
        Hello World
      </h1>
      <p style={{
        margin: '12px 0 0',
        fontSize: 16,
        color: '#666666'
      }}>
        Edit this component and export to Figma
      </p>
      <button style={{
        marginTop: 16,
        padding: '10px 20px',
        background: '#3B82F6',
        color: 'white',
        border: 'none',
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer'
      }}>
        Click Me
      </button>
    </div>
  );
}`;

type ExportFormat = 'svg' | 'png';

export function ReactToFigmaModal({ isOpen, onClose }: ReactToFigmaModalProps) {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('svg');
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async () => {
    setError(null);
    setIsExporting(true);

    try {
      // Find the Sandpack preview iframe
      const iframe = previewRef.current?.querySelector('iframe');
      if (!iframe) {
        throw new Error('Preview not ready. Please wait for the component to render.');
      }

      // Try to access the iframe content
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDocument) {
        throw new Error('Cannot access preview content. This may be a security restriction.');
      }

      // Find the rendered component in the iframe
      const previewElement = iframeDocument.body;
      if (!previewElement) {
        throw new Error('No content found in preview.');
      }

      const componentName = extractComponentName(code);
      const filename = `${componentName}-figma`;

      if (exportFormat === 'svg') {
        await downloadAsSvg(previewElement, filename, {
          backgroundColor: '#ffffff',
        });
      } else {
        await downloadAsPng(previewElement, filename, {
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        });
      }
    } catch (err) {
      console.error('Export failed:', err);

      // Fallback: try to capture the preview container itself
      try {
        const previewContainer = previewRef.current?.querySelector('.sp-preview-container') as HTMLElement;
        if (previewContainer) {
          const componentName = extractComponentName(code);
          const filename = `${componentName}-figma`;

          if (exportFormat === 'svg') {
            await downloadAsSvg(previewContainer, filename, {
              backgroundColor: '#ffffff',
            });
          } else {
            await downloadAsPng(previewContainer, filename, {
              backgroundColor: '#ffffff',
              pixelRatio: 2,
            });
          }
          setIsExporting(false);
          return;
        }
      } catch {
        // Fallback also failed
      }

      setError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [code, exportFormat]);

  const handleClose = useCallback(() => {
    setError(null);
    setCode(DEFAULT_CODE);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-[95vw] max-w-7xl h-[90vh] bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <FigmaIcon className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-semibold text-white">React to Figma</h2>
            <span className="text-xs bg-teal-900/50 text-teal-300 px-2 py-1 rounded-full">
              Export as {exportFormat.toUpperCase()}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded-md transition-colors"
          >
            <CloseIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          <SandpackProvider
            template="react-ts"
            theme="dark"
            files={{
              '/App.tsx': {
                code: code,
                active: true,
              },
            }}
            options={{
              externalResources: [
                'https://cdn.tailwindcss.com',
              ],
            }}
          >
            <div className="h-full grid grid-cols-2" style={{ minHeight: 0 }}>
              {/* Code Editor Panel */}
              <div className="border-r border-gray-700 flex flex-col min-h-0">
                <div className="px-4 py-2 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
                  <span className="text-sm text-gray-400">Code Editor</span>
                </div>
                <div className="flex-1 overflow-hidden min-h-0">
                  {/* @ts-expect-error Sandpack types incompatible with React 19 */}
                  <Sandpack
                    template="react-ts"
                    theme="dark"
                    files={{
                      '/App.tsx': {
                        code: code,
                        active: true,
                      },
                    }}
                    options={{
                      showNavigator: false,
                      showTabs: false,
                      showLineNumbers: true,
                      editorHeight: '100%',
                      editorWidthPercentage: 100,
                    }}
                    customSetup={{
                      dependencies: {},
                    }}
                  />
                </div>
              </div>

              {/* Preview Panel */}
              <div className="flex flex-col min-h-0" ref={previewRef}>
                <div className="px-4 py-2 border-b border-gray-700 bg-gray-800/50 flex items-center justify-between flex-shrink-0">
                  <span className="text-sm text-gray-400">Live Preview</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">This will be exported</span>
                  </div>
                </div>
                <div className="flex-1 bg-white overflow-auto min-h-0">
                  <SandpackPreview
                    showNavigator={false}
                    showRefreshButton={true}
                    style={{ height: '100%', minHeight: '400px' }}
                  />
                </div>
              </div>
            </div>
          </SandpackProvider>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3 bg-red-900/30 border-t border-red-700">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800/30">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Export format:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExportFormat('svg')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  exportFormat === 'svg'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                SVG
              </button>
              <button
                onClick={() => setExportFormat('png')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  exportFormat === 'png'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                PNG
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
            >
              {isExporting ? (
                <>
                  <LoadingSpinner className="w-4 h-4" />
                  Exporting...
                </>
              ) : (
                <>
                  <DownloadIcon className="w-4 h-4" />
                  Export {exportFormat.toUpperCase()}
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
function FigmaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
      <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
      <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
      <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
      <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default ReactToFigmaModal;
