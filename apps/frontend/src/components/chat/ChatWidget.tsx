'use client';

import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  toggleChat,
  addMessage,
  appendToLastMessage,
  setLoading,
  setError,
  clearChat,
} from '@/store/chatSlice';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { sendChatMessage, type FigmaContext } from '@/services/chat';

export function ChatWidget() {
  const dispatch = useAppDispatch();
  const { messages, isOpen, isLoading, error } = useAppSelector((state) => state.chat);
  const {
    selectedComponentName,
    selectedComponentType,
    figmaComponentProps,
    fileComponentDefinitions,
  } = useAppSelector((state) => state.figma);

  const handleToggle = useCallback(() => {
    dispatch(toggleChat());
  }, [dispatch]);

  const handleClear = useCallback(() => {
    dispatch(clearChat());
  }, [dispatch]);

  const handleSend = useCallback(
    async (message: string) => {
      // Add user message
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        content: message,
        timestamp: Date.now(),
      };
      dispatch(addMessage(userMessage));

      // Prepare placeholder for assistant message
      const assistantMessageId = `assistant-${Date.now()}`;
      dispatch(
        addMessage({
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        })
      );

      dispatch(setLoading(true));
      dispatch(setError(null));

      // Build Figma context
      const figmaContext: FigmaContext = {
        selectedComponentName,
        selectedComponentType,
        componentProperties: figmaComponentProps,
        fileComponentDefinitions,
      };

      // Build message history (last 10 messages)
      const messageHistory = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      await sendChatMessage(
        { message, figmaContext, messageHistory },
        (chunk) => {
          dispatch(appendToLastMessage(chunk));
        },
        () => {
          dispatch(setLoading(false));
        },
        (errorMsg) => {
          dispatch(setError(errorMsg));
          dispatch(setLoading(false));
        }
      );
    },
    [dispatch, selectedComponentName, selectedComponentType, figmaComponentProps, fileComponentDefinitions, messages]
  );

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-label="Open chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl transition-all duration-300 ease-out ${
          isOpen
            ? 'h-[500px] w-[400px] opacity-100'
            : 'h-0 w-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-primary"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Design Assistant</h3>
              <p className="text-xs text-muted-foreground">
                {selectedComponentName ? `Viewing: ${selectedComponentName}` : 'Ask about your design'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear chat"
                title="Clear chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            )}
            <button
              onClick={handleToggle}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Messages */}
        <ChatMessages messages={messages} isLoading={isLoading} />

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </>
  );
}
