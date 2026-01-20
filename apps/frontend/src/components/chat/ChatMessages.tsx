'use client';

import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/store/chatSlice';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

// Simple code syntax highlighting using regex (matching existing CodeDisplay pattern)
function highlightCode(code: string, language: string): string {
  // Basic keyword highlighting for TypeScript/JavaScript
  const keywords = /\b(const|let|var|function|return|if|else|for|while|class|interface|type|export|import|from|async|await|try|catch|throw|new|this|true|false|null|undefined)\b/g;
  const strings = /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g;
  const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
  const numbers = /\b(\d+)\b/g;
  const jsx = /(<\/?[A-Z][a-zA-Z]*)/g;

  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  highlighted = highlighted
    .replace(comments, '<span class="text-gray-500">$1</span>')
    .replace(strings, '<span class="text-green-400">$&</span>')
    .replace(keywords, '<span class="text-purple-400">$1</span>')
    .replace(numbers, '<span class="text-orange-400">$1</span>')
    .replace(/&lt;(\/?[A-Z][a-zA-Z]*)/g, '&lt;<span class="text-blue-400">$1</span>');

  return highlighted;
}

// Parse markdown-like content
function parseContent(content: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeContent = '';
  let codeLanguage = '';
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block start
    if (line.startsWith('```') && !inCodeBlock) {
      inCodeBlock = true;
      codeLanguage = line.slice(3).trim() || 'text';
      codeContent = '';
      continue;
    }

    // Code block end
    if (line.startsWith('```') && inCodeBlock) {
      inCodeBlock = false;
      elements.push(
        <div key={key++} className="my-2 overflow-hidden rounded-lg border border-border">
          <div className="flex items-center justify-between bg-muted px-3 py-1.5">
            <span className="text-xs text-muted-foreground">{codeLanguage}</span>
            <button
              onClick={() => navigator.clipboard.writeText(codeContent)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Copy
            </button>
          </div>
          <pre className="overflow-x-auto bg-[#1a1a1a] p-3 text-sm">
            <code
              dangerouslySetInnerHTML={{
                __html: highlightCode(codeContent, codeLanguage),
              }}
            />
          </pre>
        </div>
      );
      continue;
    }

    // Inside code block
    if (inCodeBlock) {
      codeContent += (codeContent ? '\n' : '') + line;
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={key++} className="mt-3 mb-1 font-semibold text-sm">
          {line.slice(4)}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={key++} className="mt-3 mb-1 font-semibold">
          {line.slice(3)}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={key++} className="mt-3 mb-2 font-bold text-lg">
          {line.slice(2)}
        </h2>
      );
      continue;
    }

    // List items
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={key++} className="ml-4 list-disc">
          {formatInlineCode(line.slice(2))}
        </li>
      );
      continue;
    }

    // Numbered list
    const numberedMatch = line.match(/^(\d+)\.\s/);
    if (numberedMatch) {
      elements.push(
        <li key={key++} className="ml-4 list-decimal">
          {formatInlineCode(line.slice(numberedMatch[0].length))}
        </li>
      );
      continue;
    }

    // Bold text and regular paragraphs
    if (line.trim()) {
      elements.push(
        <p key={key++} className="my-1">
          {formatInlineCode(line)}
        </p>
      );
    } else if (i < lines.length - 1) {
      // Empty line (paragraph break)
      elements.push(<div key={key++} className="h-2" />);
    }
  }

  // Handle unclosed code block
  if (inCodeBlock && codeContent) {
    elements.push(
      <div key={key++} className="my-2 overflow-hidden rounded-lg border border-border">
        <pre className="overflow-x-auto bg-[#1a1a1a] p-3 text-sm">
          <code
            dangerouslySetInnerHTML={{
              __html: highlightCode(codeContent, codeLanguage),
            }}
          />
        </pre>
      </div>
    );
  }

  return elements;
}

// Format inline code and bold text
function formatInlineCode(text: string): React.ReactNode {
  const parts: (string | React.ReactNode)[] = [];
  let remaining = text;
  let partKey = 0;

  // Process inline code first
  while (remaining) {
    const codeMatch = remaining.match(/`([^`]+)`/);
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

    if (!codeMatch && !boldMatch) {
      parts.push(remaining);
      break;
    }

    const codeIndex = codeMatch ? remaining.indexOf(codeMatch[0]) : Infinity;
    const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;

    if (codeIndex < boldIndex && codeMatch) {
      parts.push(remaining.slice(0, codeIndex));
      parts.push(
        <code key={partKey++} className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeIndex + codeMatch[0].length);
    } else if (boldMatch) {
      parts.push(remaining.slice(0, boldIndex));
      parts.push(
        <strong key={partKey++} className="font-semibold">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldIndex + boldMatch[0].length);
    }
  }

  return <>{parts}</>;
}

export function ChatMessages({ messages, isLoading = false }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-2 text-4xl">💬</div>
          <p className="text-sm text-muted-foreground">
            Ask questions about your Figma design
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            I can help with colors, spacing, component properties, and code generation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] rounded-lg px-3 py-2 ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}
          >
            {msg.role === 'user' ? (
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            ) : (
              <div className="text-sm prose-sm">{parseContent(msg.content)}</div>
            )}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-lg px-3 py-2">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
