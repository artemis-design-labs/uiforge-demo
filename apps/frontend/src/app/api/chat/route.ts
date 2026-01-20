import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface FigmaContext {
  selectedComponentName: string | null;
  selectedComponentType: string | null;
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
}

interface ChatRequest {
  message: string;
  figmaContext: FigmaContext;
  messageHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

function buildSystemPrompt(figmaContext: FigmaContext): string {
  const componentList = Object.entries(figmaContext.fileComponentDefinitions)
    .map(([key, def]) => `- ${def.name} (${def.type})`)
    .join('\n');

  const currentComponentInfo = figmaContext.selectedComponentName
    ? `
## Currently Selected Component
- Name: ${figmaContext.selectedComponentName}
- Type: ${figmaContext.selectedComponentType || 'Unknown'}

### Properties:
${Object.entries(figmaContext.componentProperties)
  .map(([key, prop]) => {
    let propInfo = `- **${prop.name}** (${prop.type}): ${prop.value}`;
    if (prop.options && prop.options.length > 0) {
      propInfo += `\n  Options: ${prop.options.join(', ')}`;
    }
    return propInfo;
  })
  .join('\n') || 'No properties defined'}
`
    : '';

  const generatedCodeSection = figmaContext.generatedCode
    ? `
## Generated Code
\`\`\`tsx
${figmaContext.generatedCode}
\`\`\`
`
    : '';

  return `You are a helpful design system assistant for UI Forge, a tool that converts Figma designs into React components.

You have access to the following context about the user's Figma file:

## Available Components in File
${componentList || 'No components loaded yet'}

${currentComponentInfo}

${generatedCodeSection}

## Your Capabilities
1. **Design Questions**: Answer questions about colors, spacing, typography, component structure, and design tokens in the Figma file.
2. **Code Generation**: Help generate React component code, explain implementations, and suggest best practices.
3. **Component Properties**: Explain what each property does and how to use variants.
4. **Implementation Guidance**: Provide guidance on how to implement the design in code.

## Guidelines
- Be concise and helpful
- When showing code, use proper TypeScript/React syntax
- Reference specific component names and properties from the context
- If you don't have enough context to answer a question, say so and ask for clarification
- Format code blocks with appropriate language tags (tsx, css, etc.)`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, figmaContext, messageHistory = [] } = body;

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = buildSystemPrompt(figmaContext);

    // Build messages array with history
    const messages: Anthropic.MessageParam[] = [
      ...messageHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: systemPrompt,
            messages,
            stream: true,
          });

          for await (const event of response) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta;
              if ('text' in delta) {
                const data = JSON.stringify({ content: delta.text });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('[Chat API] Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorData = JSON.stringify({ error: errorMessage });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
