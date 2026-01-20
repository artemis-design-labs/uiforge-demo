import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface FigmaContext {
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
}

interface DesignContext {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  colors: Array<{ hex: string; usedIn: string[] }>;
  typography: Array<{ node: string; style: any }>;
  dimensions: any;
  effects: any[];
  structure: any;
}

interface ChatRequest {
  message: string;
  figmaContext: FigmaContext;
  messageHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

async function fetchDesignContext(fileKey: string, nodeId: string): Promise<DesignContext | null> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : 'http://localhost:3000';

    // URL-encode the nodeId as it may contain colons (e.g., "1:234")
    const encodedNodeId = encodeURIComponent(nodeId);
    const url = `${baseUrl}/api/figma/design-context/${fileKey}/${encodedNodeId}`;

    console.log('[Chat API] Fetching design context from:', url);

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Chat API] Failed to fetch design context:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[Chat API] Design context received:', {
      nodeId: data.nodeId,
      nodeName: data.nodeName,
      colorsCount: data.colors?.length || 0,
      typographyCount: data.typography?.length || 0
    });
    return data;
  } catch (error) {
    console.error('[Chat API] Error fetching design context:', error);
    return null;
  }
}

function buildSystemPrompt(figmaContext: FigmaContext, designContext: DesignContext | null): string {
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

  // Build design details section from design context
  let designDetails = '';
  if (designContext) {
    // Colors section
    if (designContext.colors && designContext.colors.length > 0) {
      designDetails += `
### Colors Used in Component
${designContext.colors.map(c => `- **${c.hex}** - Used in: ${c.usedIn.join(', ')}`).join('\n')}
`;
    }

    // Typography section
    if (designContext.typography && designContext.typography.length > 0) {
      designDetails += `
### Typography Styles
${designContext.typography.map(t =>
  `- **${t.node}**: ${t.style.fontFamily} ${t.style.fontSize}px, weight ${t.style.fontWeight}${t.style.text ? ` ("${t.style.text}")` : ''}`
).join('\n')}
`;
    }

    // Dimensions section
    if (designContext.dimensions) {
      const dims = designContext.dimensions;
      let dimInfo = [];
      if (dims.width && dims.height) dimInfo.push(`Size: ${dims.width}x${dims.height}px`);
      if (dims.borderRadius) dimInfo.push(`Border radius: ${Array.isArray(dims.borderRadius) ? dims.borderRadius.join(', ') : dims.borderRadius}px`);
      if (dims.strokeWeight) dimInfo.push(`Stroke weight: ${dims.strokeWeight}px`);

      if (dimInfo.length > 0) {
        designDetails += `
### Dimensions
${dimInfo.map(d => `- ${d}`).join('\n')}
`;
      }
    }

    // Effects section
    if (designContext.effects && designContext.effects.length > 0) {
      designDetails += `
### Effects (Shadows/Blurs)
${designContext.effects.map(e => {
  let effectDesc = `- **${e.type}**`;
  if (e.color) effectDesc += `: ${e.color}`;
  if (e.radius) effectDesc += `, radius: ${e.radius}px`;
  if (e.offset) effectDesc += `, offset: (${e.offset.x}, ${e.offset.y})`;
  return effectDesc;
}).join('\n')}
`;
    }

    // Component structure overview
    if (designContext.structure) {
      designDetails += `
### Component Structure
\`\`\`
${JSON.stringify(designContext.structure, null, 2).substring(0, 2000)}
\`\`\`
`;
    }
  }

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

${designDetails}

${generatedCodeSection}

## Your Capabilities
1. **Design Questions**: Answer questions about colors (hex codes), spacing, typography, component structure, and design tokens in the Figma file. You have access to the actual color values, fonts, and dimensions.
2. **Code Generation**: Help generate React component code, explain implementations, and suggest best practices.
3. **Component Properties**: Explain what each property does and how to use variants.
4. **Implementation Guidance**: Provide guidance on how to implement the design in code.

## Guidelines
- Be concise and helpful
- When asked about colors, provide the exact hex codes from the design context
- When asked about typography, provide the exact font family, size, and weight
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

    // Fetch design context if we have fileKey and nodeId
    let designContext: DesignContext | null = null;
    console.log('[Chat API] FigmaContext received:', {
      fileKey: figmaContext.fileKey,
      nodeId: figmaContext.nodeId,
      selectedComponentName: figmaContext.selectedComponentName,
      selectedComponentType: figmaContext.selectedComponentType,
      hasComponentProperties: Object.keys(figmaContext.componentProperties || {}).length,
      hasFileComponentDefinitions: Object.keys(figmaContext.fileComponentDefinitions || {}).length
    });

    if (figmaContext.fileKey && figmaContext.nodeId) {
      console.log('[Chat API] Fetching design context for', figmaContext.fileKey, figmaContext.nodeId);
      designContext = await fetchDesignContext(figmaContext.fileKey, figmaContext.nodeId);
      if (!designContext) {
        console.log('[Chat API] Design context returned null - check FIGMA_ACCESS_TOKEN env var');
      }
    } else {
      console.log('[Chat API] Skipping design context fetch - missing fileKey or nodeId');
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = buildSystemPrompt(figmaContext, designContext);

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
