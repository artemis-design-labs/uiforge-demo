'use client';

import React, { useState } from 'react';

interface CodeDisplayProps {
    code: string;
    language?: 'typescript' | 'tsx' | 'jsx' | 'javascript';
    title?: string;
    showLineNumbers?: boolean;
}

/**
 * CodeDisplay Component
 *
 * Displays syntax-highlighted code with copy functionality.
 * Uses basic regex-based highlighting for TypeScript/React code.
 */
export function CodeDisplay({
    code,
    language = 'tsx',
    title,
    showLineNumbers = true,
}: CodeDisplayProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Basic syntax highlighting
    const highlightCode = (sourceCode: string): string => {
        let highlighted = sourceCode
            // Escape HTML first
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Comments (single line)
            .replace(/(\/\/.*$)/gm, '<span class="text-gray-500">$1</span>')
            // Comments (multi-line)
            .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-gray-500">$1</span>')
            // Strings (single quotes)
            .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="text-green-400">$1</span>')
            // Strings (double quotes)
            .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="text-green-400">$1</span>')
            // Template literals
            .replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="text-green-400">$1</span>')
            // Keywords
            .replace(
                /\b(import|export|from|const|let|var|function|return|if|else|switch|case|break|default|for|while|do|try|catch|finally|throw|new|typeof|instanceof|in|of|class|extends|implements|interface|type|enum|async|await|yield|static|public|private|protected|readonly|abstract|as|is)\b/g,
                '<span class="text-purple-400">$1</span>'
            )
            // React specific
            .replace(
                /\b(React|useState|useEffect|useMemo|useCallback|useRef|useContext|useReducer|Children|Fragment)\b/g,
                '<span class="text-cyan-400">$1</span>'
            )
            // Types
            .replace(
                /\b(string|number|boolean|any|void|null|undefined|never|unknown|object|Record|Array|Promise|Partial|Required|Readonly|Pick|Omit)\b/g,
                '<span class="text-yellow-400">$1</span>'
            )
            // Numbers
            .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-orange-400">$1</span>')
            // JSX tags
            .replace(
                /(&lt;\/?)([A-Z][a-zA-Z0-9]*)/g,
                '$1<span class="text-blue-400">$2</span>'
            )
            // HTML tags
            .replace(
                /(&lt;\/?)([a-z][a-zA-Z0-9]*)/g,
                '$1<span class="text-red-400">$2</span>'
            )
            // Props/attributes in JSX
            .replace(
                /\s([a-zA-Z][a-zA-Z0-9]*)=/g,
                ' <span class="text-cyan-300">$1</span>='
            )
            // Function calls
            .replace(
                /([a-zA-Z_][a-zA-Z0-9_]*)\(/g,
                '<span class="text-yellow-300">$1</span>('
            );

        return highlighted;
    };

    const lines = code.split('\n');
    const lineNumberWidth = lines.length.toString().length;

    return (
        <div className="rounded-lg overflow-hidden bg-[#1e1e1e] border border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
                <div className="flex items-center gap-2">
                    {/* Traffic light dots */}
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    {title && (
                        <span className="ml-2 text-xs text-gray-400">{title}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase">{language}</span>
                    <button
                        onClick={handleCopy}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    >
                        {copied ? (
                            <span className="flex items-center gap-1">
                                <CheckIcon className="w-3 h-3" />
                                Copied!
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <CopyIcon className="w-3 h-3" />
                                Copy
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Code area */}
            <div className="overflow-x-auto">
                <pre className="p-4 text-sm leading-relaxed">
                    <code className="font-mono">
                        {lines.map((line, index) => (
                            <div key={index} className="flex">
                                {showLineNumbers && (
                                    <span
                                        className="select-none text-gray-600 text-right pr-4 min-w-[2.5rem]"
                                        style={{ width: `${lineNumberWidth + 1.5}rem` }}
                                    >
                                        {index + 1}
                                    </span>
                                )}
                                <span
                                    className="text-gray-300 flex-1"
                                    dangerouslySetInnerHTML={{
                                        __html: highlightCode(line) || '&nbsp;',
                                    }}
                                />
                            </div>
                        ))}
                    </code>
                </pre>
            </div>
        </div>
    );
}

// Icon components
function CopyIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

export default CodeDisplay;
