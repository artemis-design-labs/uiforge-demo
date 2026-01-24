// Design token from imported token collection
export interface DesignToken {
  name: string;
  value: string | number;
  type: string;
  category?: string;
  description?: string;
}

export interface TokenCollection {
  name: string;
  version: string;
  tokens: DesignToken[];
  metadata?: {
    source: string;
    importedAt: string;
  };
}

export interface FigmaContext {
  selectedComponentName: string | null;
  selectedComponentType: string | null;
  fileKey: string | null;
  nodeId: string | null;
  componentProperties: Record<string, {
    name: string;
    type: string;
    value: boolean | string;
    options?: string[];
  }>;
  fileComponentDefinitions: Record<string, {
    nodeId: string;
    name: string;
    type: string;
    properties: Record<string, unknown>;
  }>;
  generatedCode?: string;
  // Design tokens from imported collection (if available)
  tokenCollection?: TokenCollection | null;
}

export interface ChatRequest {
  message: string;
  figmaContext: FigmaContext;
  messageHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export async function sendChatMessage(
  request: ChatRequest,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onComplete();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onChunk(parsed.content);
            }
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
          } catch {
            // Not JSON, might be raw text
            if (data.trim()) {
              onChunk(data);
            }
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}
