import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface DesignToken {
  name: string;
  value: string | number;
  type: string;
  category?: string;
  description?: string;
}

interface TokenCollection {
  name: string;
  version: string;
  tokens: DesignToken[];
  metadata?: {
    source: string;
    importedAt: string;
  };
}

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
  tokenCollection?: TokenCollection | null;
}

// Legacy design context interface (for fallback)
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

// Deep extraction context interface (enhanced)
interface DeepExtractionContext {
  meta: {
    fileKey: string;
    nodeId: string;
    nodeName: string;
    nodeType: string;
    extractedAt: string;
  };
  component: {
    nodeName: string;
    nodeId: string;
    nodeType: string;
    isComponentSet: boolean;
    properties: Record<string, {
      type: string;
      value?: string | boolean;
      defaultValue?: string | boolean;
      options?: string[];
      preferredValues?: Array<{ type: string; key: string }>;
    }>;
    variants?: Array<{
      name: string;
      nodeId: string;
      propertyValues: Record<string, string>;
    }>;
  };
  visual: {
    colors: {
      all: Array<{
        hex: string;
        rgba: string;
        hsl: string;
        opacity: number;
        usage: string;
        nodeName: string;
        nodeType: string;
      }>;
      unique: string[];
      byUsage: {
        fill: Array<{ hex: string; nodeName: string }>;
        stroke: Array<{ hex: string; nodeName: string }>;
        effect: Array<{ hex: string; nodeName: string }>;
      };
    };
    borders: Array<{
      color: { hex: string; rgba: string };
      weight: number;
      align: string;
      nodeName: string;
    }>;
    corners: Array<{
      type: string;
      value: number | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number };
      nodeName: string;
    }>;
    effects: Array<{
      type: string;
      color?: { hex: string; rgba: string };
      offset?: { x: number; y: number };
      blur: number;
      spread?: number;
      nodeName: string;
      cssValue?: string;
    }>;
  };
  layout: {
    autoLayouts: Array<{
      nodeName: string;
      nodeId: string;
      direction: string;
      wrap: boolean;
      mainAxisAlignment: string;
      crossAxisAlignment: string;
      padding: { top: number; right: number; bottom: number; left: number };
      gap: number;
      counterAxisGap?: number;
      sizing: {
        width: { mode: string; value?: number; min?: number; max?: number };
        height: { mode: string; value?: number; min?: number; max?: number };
      };
    }>;
    spacing: Array<{
      type: string;
      value: number | { top: number; right: number; bottom: number; left: number };
      nodeName: string;
      nodeType: string;
    }>;
    dimensions: { width: number; height: number } | null;
  };
  typography: {
    all: Array<{
      nodeName: string;
      nodeId: string;
      text: string;
      style: {
        fontFamily: string;
        fontWeight: number;
        fontSize: number;
        lineHeight?: number;
        lineHeightUnit?: string;
        letterSpacing?: number;
        textCase?: string;
        textDecoration?: string;
        textAlign?: string;
      };
    }>;
    fontFamilies: string[];
    fontSizes: number[];
    fontWeights: number[];
  };
  structure: any;
  inferredTokens: {
    colors: Record<string, { value: string; usageCount: number; suggestedName: string }>;
    spacing: Record<string, { value: number; usageCount: number; suggestedName: string }>;
    typography: Record<string, { value: any; usageCount: number; suggestedName: string }>;
    borderRadius: Record<string, { value: number | number[]; usageCount: number; suggestedName: string }>;
    shadows: Record<string, { value: string; usageCount: number; suggestedName: string }>;
  };
  stats: {
    totalColors: number;
    uniqueColors: number;
    totalTextNodes: number;
    totalAutoLayouts: number;
    totalEffects: number;
    childrenCount: number;
    maxDepth: number;
  };
}

interface ChatRequest {
  message: string;
  figmaContext: FigmaContext;
  messageHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

function getBaseUrl(): string {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3000';
}

// Fetch deep extraction data (enhanced context)
async function fetchDeepExtraction(fileKey: string, nodeId: string, cookies?: string): Promise<DeepExtractionContext | null> {
  try {
    const baseUrl = getBaseUrl();
    const encodedNodeId = encodeURIComponent(nodeId);
    const url = `${baseUrl}/api/figma/deep-extract/${fileKey}/${encodedNodeId}`;

    console.log('[Chat API] Fetching deep extraction from:', url);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (cookies) {
      headers['Cookie'] = cookies;
    }

    const response = await fetch(url, {
      headers,
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Chat API] Failed to fetch deep extraction:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[Chat API] Deep extraction received:', {
      nodeName: data.meta?.nodeName,
      stats: data.stats
    });
    return data;
  } catch (error) {
    console.error('[Chat API] Error fetching deep extraction:', error);
    return null;
  }
}

// Fallback to legacy design context if deep extraction fails
async function fetchDesignContext(fileKey: string, nodeId: string): Promise<DesignContext | null> {
  try {
    const baseUrl = getBaseUrl();
    const encodedNodeId = encodeURIComponent(nodeId);
    const url = `${baseUrl}/api/figma/design-context/${fileKey}/${encodedNodeId}`;

    console.log('[Chat API] Fetching design context (fallback) from:', url);

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

// Build enhanced system prompt with deep extraction context
function buildSystemPromptEnhanced(figmaContext: FigmaContext, deepContext: DeepExtractionContext | null): string {
  const componentList = Object.entries(figmaContext.fileComponentDefinitions)
    .slice(0, 30) // Limit to avoid token overflow
    .map(([key, def]) => `- ${def.name} (${def.type})`)
    .join('\n');

  let currentComponentInfo = '';
  let designDetails = '';
  let tokenInfo = '';

  if (deepContext) {
    // Component information from deep extraction
    currentComponentInfo = `
## Currently Selected Component: ${deepContext.meta.nodeName}
- **Type**: ${deepContext.meta.nodeType}
- **Node ID**: ${deepContext.meta.nodeId}
${deepContext.component.isComponentSet ? `- **Variant Count**: ${deepContext.component.variants?.length || 0}` : ''}

### Component Properties
${Object.entries(deepContext.component.properties)
  .map(([name, prop]) => {
    let line = `- **${name}** (${prop.type})`;
    if (prop.defaultValue !== undefined) line += `: default="${prop.defaultValue}"`;
    if (prop.options && prop.options.length > 0) {
      line += `\n  Options: [${prop.options.join(', ')}]`;
    }
    return line;
  })
  .join('\n') || 'No properties'}
`;

    // Design details from deep extraction
    designDetails = `
## Design Specifications

### Colors (${deepContext.stats.uniqueColors} unique)
${deepContext.visual.colors.unique.slice(0, 10).map(hex => {
  const colorInfo = deepContext.inferredTokens.colors[hex];
  return `- **${hex}** → suggested token: \`${colorInfo?.suggestedName || 'color'}\` (used ${colorInfo?.usageCount || 1}x)`;
}).join('\n')}

### Typography
- **Font Families**: ${deepContext.typography.fontFamilies.join(', ') || 'None'}
- **Font Sizes**: ${deepContext.typography.fontSizes.join('px, ')}px
- **Font Weights**: ${deepContext.typography.fontWeights.join(', ')}
${deepContext.typography.all.slice(0, 3).map(t =>
  `- "${t.text?.substring(0, 20) || 'Text'}": ${t.style.fontFamily} ${t.style.fontSize}px/${t.style.lineHeight || 'auto'} weight ${t.style.fontWeight}`
).join('\n')}

### Layout & Spacing
${deepContext.layout.autoLayouts.slice(0, 3).map(l =>
  `- **${l.nodeName}**: ${l.direction} layout, gap: ${l.gap}px, padding: ${l.padding.top}/${l.padding.right}/${l.padding.bottom}/${l.padding.left}px`
).join('\n')}

### Border Radius
${deepContext.visual.corners.slice(0, 5).map(c =>
  `- **${c.nodeName}**: ${typeof c.value === 'number' ? `${c.value}px` : JSON.stringify(c.value)}`
).join('\n') || 'No border radius'}

### Effects (Shadows)
${deepContext.visual.effects.slice(0, 3).map(e =>
  `- **${e.type}**: \`${e.cssValue || `blur: ${e.blur}px`}\``
).join('\n') || 'No effects'}

### Dimensions
${deepContext.layout.dimensions ? `- Size: ${deepContext.layout.dimensions.width}x${deepContext.layout.dimensions.height}px` : 'Variable sizing'}
`;

    // Inferred tokens summary
    tokenInfo = `
## Inferred Design Tokens

### Spacing Scale
${Object.entries(deepContext.inferredTokens.spacing)
  .sort((a, b) => a[1].value - b[1].value)
  .slice(0, 8)
  .map(([key, token]) => `- \`${token.suggestedName}\`: ${token.value}px`)
  .join('\n')}

### Typography Scale
${Object.entries(deepContext.inferredTokens.typography)
  .slice(0, 5)
  .map(([key, token]) => `- \`${token.suggestedName}\`: ${token.value.fontSize}px ${token.value.fontFamily || ''}`)
  .join('\n')}

### Shadow Tokens
${Object.entries(deepContext.inferredTokens.shadows)
  .slice(0, 3)
  .map(([key, token]) => `- \`${token.suggestedName}\`: \`${token.value}\``)
  .join('\n') || 'No shadows'}
`;

  } else if (figmaContext.selectedComponentName) {
    // Fallback to basic figma context
    currentComponentInfo = `
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
`;
  }

  const generatedCodeSection = figmaContext.generatedCode
    ? `
## Generated Code
\`\`\`tsx
${figmaContext.generatedCode}
\`\`\`
`
    : '';

  // Build imported tokens section if available
  let importedTokensSection = '';
  if (figmaContext.tokenCollection && figmaContext.tokenCollection.tokens.length > 0) {
    const tokens = figmaContext.tokenCollection.tokens;
    const colorTokens = tokens.filter(t => t.type === 'color').slice(0, 15);
    const spacingTokens = tokens.filter(t => t.type === 'spacing' || t.type === 'dimension').slice(0, 10);
    const typographyTokens = tokens.filter(t => t.type === 'fontSize' || t.type === 'fontFamily' || t.type === 'fontWeight').slice(0, 10);

    importedTokensSection = `
## Official Design Tokens (Imported)
Source: ${figmaContext.tokenCollection.metadata?.source || 'Unknown'} | Total: ${tokens.length} tokens

${colorTokens.length > 0 ? `### Color Tokens
${colorTokens.map(t => `- \`${t.name}\`: ${t.value}${t.description ? ` — ${t.description}` : ''}`).join('\n')}
` : ''}

${spacingTokens.length > 0 ? `### Spacing Tokens
${spacingTokens.map(t => `- \`${t.name}\`: ${t.value}${t.description ? ` — ${t.description}` : ''}`).join('\n')}
` : ''}

${typographyTokens.length > 0 ? `### Typography Tokens
${typographyTokens.map(t => `- \`${t.name}\`: ${t.value}${t.description ? ` — ${t.description}` : ''}`).join('\n')}
` : ''}
`;
  }

  return `You are an expert design system assistant for UI Forge. You have deep knowledge of the user's Figma design system and can answer questions like a senior designer would.

# Design System Context

## Available Components (${Object.keys(figmaContext.fileComponentDefinitions).length} total)
${componentList || 'No components loaded'}
${Object.keys(figmaContext.fileComponentDefinitions).length > 30 ? `... and ${Object.keys(figmaContext.fileComponentDefinitions).length - 30} more` : ''}

${currentComponentInfo}

${designDetails}

${tokenInfo}

${importedTokensSection}

${generatedCodeSection}

# Your Expertise

You are a design system expert who can:

1. **Answer Design Questions**
   - Explain color usage and semantics (e.g., "Primary blue #3B82F6 is used for main CTAs")
   - Describe spacing scales and when to use each value
   - Explain typography hierarchy and font choices
   - Describe component anatomy and composition

2. **Guide Implementation**
   - Recommend the correct component variant for a use case
   - Explain property combinations that work well together
   - Provide CSS/React code snippets using the exact token values
   - Suggest accessibility considerations

3. **Explain Design Decisions**
   - Why certain spacing values are used (e.g., "8px grid system")
   - Why colors are paired in certain ways (contrast, hierarchy)
   - How the component scales across sizes

4. **Help with Code Generation**
   - Generate React components using the design tokens
   - Provide Tailwind/CSS classes that match the design
   - Explain how to handle different states and variants

# Guidelines

- **Be specific**: Always reference exact values (hex codes, pixel values, font names)
- **Be practical**: Give actionable advice, not just descriptions
- **Be concise**: Answer directly, then expand if needed
- **Use code**: Show code examples when relevant
- **Acknowledge limits**: If you don't have enough context, say so

When asked about colors, spacing, or typography, always reference the exact values from the design specifications above.`;
}

// Legacy system prompt builder (fallback)
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
    let deepContext: DeepExtractionContext | null = null;
    let legacyDesignContext: DesignContext | null = null;

    console.log('[Chat API] FigmaContext received:', {
      fileKey: figmaContext.fileKey,
      nodeId: figmaContext.nodeId,
      selectedComponentName: figmaContext.selectedComponentName,
      selectedComponentType: figmaContext.selectedComponentType,
      hasComponentProperties: Object.keys(figmaContext.componentProperties || {}).length,
      hasFileComponentDefinitions: Object.keys(figmaContext.fileComponentDefinitions || {}).length
    });

    if (figmaContext.fileKey && figmaContext.nodeId) {
      console.log('[Chat API] Attempting deep extraction for', figmaContext.fileKey, figmaContext.nodeId);

      // Get cookies from request to forward auth
      const cookies = request.headers.get('cookie') || '';

      // Try deep extraction first (enhanced context)
      deepContext = await fetchDeepExtraction(figmaContext.fileKey, figmaContext.nodeId, cookies);

      if (!deepContext) {
        // Fall back to legacy design context
        console.log('[Chat API] Deep extraction failed, falling back to legacy design context');
        legacyDesignContext = await fetchDesignContext(figmaContext.fileKey, figmaContext.nodeId);
      }

      if (!deepContext && !legacyDesignContext) {
        console.log('[Chat API] Both extraction methods failed - check authentication');
      }
    } else {
      console.log('[Chat API] Skipping design context fetch - missing fileKey or nodeId');
    }

    const client = new Anthropic({ apiKey });

    // Use enhanced prompt if deep context available, otherwise fall back
    const systemPrompt = deepContext
      ? buildSystemPromptEnhanced(figmaContext, deepContext)
      : buildSystemPrompt(figmaContext, legacyDesignContext);

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
