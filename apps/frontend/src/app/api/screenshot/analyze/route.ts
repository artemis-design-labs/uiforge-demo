import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type {
  ScreenshotAnalysis,
  IdentifiedComponent,
  AnalysisStats,
  ConfidenceLevel,
} from '@/types/screenshotAnalyzer';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================
// Types
// ============================================

interface AnalyzeRequest {
  image: string; // Base64 encoded image (with or without data URL prefix)
  fileName?: string;
  codebaseComponents?: Array<{
    name: string;
    filePath: string;
    type: string;
    props: Array<{ name: string; type: string; required: boolean }>;
  }>;
  figmaComponents?: Record<string, {
    name: string;
    nodeId: string;
    properties: Record<string, unknown>;
  }>;
}

interface ClaudeComponentResult {
  id: string;
  name: string;
  type: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  inferredProps: Record<string, string | boolean | number>;
  parentId: string | null;
  childrenIds: string[];
  visualDescription: string;
}

// ============================================
// Helper Functions
// ============================================

function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 80) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
}

function generateId(): string {
  return `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function extractBase64Data(dataUrl: string): { base64: string; mediaType: string } {
  // Handle both full data URL and raw base64
  if (dataUrl.startsWith('data:')) {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return {
        mediaType: match[1],
        base64: match[2],
      };
    }
  }
  // Assume JPEG if no prefix
  return {
    mediaType: 'image/jpeg',
    base64: dataUrl,
  };
}

function buildSystemPrompt(
  codebaseComponents?: AnalyzeRequest['codebaseComponents'],
  figmaComponents?: AnalyzeRequest['figmaComponents']
): string {
  let prompt = `You are a UI component analyzer. Your task is to analyze screenshots of web user interfaces and identify all UI components within them.

For each component you identify, provide:
1. A unique ID (e.g., "comp_1", "comp_2")
2. Component name (e.g., "Button", "Card", "NavigationBar")
3. Component type (lowercase: "button", "input", "card", "nav", "header", "footer", "form", "list", "modal", "dropdown", etc.)
4. Bounding box coordinates (x, y, width, height in pixels from the image)
5. Confidence score (0-100)
6. Inferred props based on visual appearance (variant, size, color, label, placeholder, disabled state, etc.)
7. Parent-child relationships (parentId for nested components)
8. A brief visual description

IMPORTANT GUIDELINES:
- Identify ALL visible UI components, including nested ones
- Be specific about component types (e.g., "primary-button" vs "secondary-button")
- Infer props from visual appearance (e.g., a blue button might have variant: "primary")
- Establish proper parent-child relationships for nested components
- Include common UI patterns: navigation, sidebars, cards, forms, tables, modals, etc.
`;

  // Add codebase components for matching
  if (codebaseComponents && codebaseComponents.length > 0) {
    prompt += `\n\nAVAILABLE CODEBASE COMPONENTS TO MATCH AGAINST:
When identifying components, try to match them to these existing components from the user's codebase:

`;
    const componentList = codebaseComponents.slice(0, 50).map((c) => {
      const propsStr = c.props.slice(0, 5).map((p) => `${p.name}: ${p.type}`).join(', ');
      return `- ${c.name} (${c.type}) - Props: ${propsStr || 'none'}`;
    });
    prompt += componentList.join('\n');
  }

  // Add Figma components for matching
  if (figmaComponents && Object.keys(figmaComponents).length > 0) {
    prompt += `\n\nAVAILABLE FIGMA COMPONENTS TO MATCH AGAINST:
Also try to match to these Figma design system components:

`;
    const figmaList = Object.entries(figmaComponents).slice(0, 30).map(([key, comp]) => {
      return `- ${comp.name} (nodeId: ${comp.nodeId})`;
    });
    prompt += figmaList.join('\n');
  }

  prompt += `\n\nRESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "components": [
    {
      "id": "comp_1",
      "name": "NavigationBar",
      "type": "nav",
      "boundingBox": { "x": 0, "y": 0, "width": 1200, "height": 64 },
      "confidence": 95,
      "inferredProps": { "variant": "horizontal", "sticky": true },
      "parentId": null,
      "childrenIds": ["comp_2", "comp_3"],
      "visualDescription": "Horizontal navigation bar with logo and menu items"
    }
  ],
  "imageWidth": 1200,
  "imageHeight": 800
}

Return ONLY the JSON object, no markdown formatting or additional text.`;

  return prompt;
}

// ============================================
// Main Handler
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: AnalyzeRequest = await request.json();

    if (!body.image) {
      return NextResponse.json(
        { success: false, error: 'Image is required' },
        { status: 400 }
      );
    }

    // Extract base64 and media type
    const { base64, mediaType } = extractBase64Data(body.image);

    // Build the system prompt with available components
    const systemPrompt = buildSystemPrompt(
      body.codebaseComponents,
      body.figmaComponents
    );

    // Call Claude Vision API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64,
              },
            },
            {
              type: 'text',
              text: 'Analyze this UI screenshot and identify all components. Return the JSON response as specified.',
            },
          ],
        },
      ],
      system: systemPrompt,
    });

    // Extract text content from response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse the JSON response
    let parsedResponse: {
      components: ClaudeComponentResult[];
      imageWidth: number;
      imageHeight: number;
    };

    try {
      // Try to extract JSON from the response (handle potential markdown wrapping)
      let jsonStr = textContent.text.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      parsedResponse = JSON.parse(jsonStr.trim());
    } catch {
      console.error('Failed to parse Claude response:', textContent.text);
      throw new Error('Failed to parse component analysis response');
    }

    // Transform Claude results to our format
    const components: IdentifiedComponent[] = parsedResponse.components.map(
      (comp, index) => ({
        id: comp.id || `comp_${index + 1}`,
        name: comp.name,
        type: comp.type,
        boundingBox: comp.boundingBox,
        confidence: comp.confidence,
        confidenceLevel: getConfidenceLevel(comp.confidence),
        inferredProps: comp.inferredProps || {},
        parentId: comp.parentId,
        childrenIds: comp.childrenIds || [],
        depth: calculateDepth(comp.id, parsedResponse.components),
        matches: [], // Will be populated by componentMatcher service
        bestMatch: null,
        visualDescription: comp.visualDescription,
      })
    );

    // Find root components (those with no parent)
    const rootComponents = components
      .filter((c) => c.parentId === null)
      .map((c) => c.id);

    // Calculate stats
    const stats: AnalysisStats = {
      totalIdentified: components.length,
      highConfidence: components.filter((c) => c.confidenceLevel === 'high').length,
      mediumConfidence: components.filter((c) => c.confidenceLevel === 'medium').length,
      lowConfidence: components.filter((c) => c.confidenceLevel === 'low').length,
      matchedToCodebase: 0, // Will be updated after matching
      matchedToFigma: 0,
      unmatchedCount: components.length,
    };

    const processingTimeMs = Date.now() - startTime;

    // Build the analysis result
    const analysis: ScreenshotAnalysis = {
      id: generateId(),
      fileName: body.fileName || 'screenshot.png',
      uploadedAt: new Date().toISOString(),
      imageWidth: parsedResponse.imageWidth || 1200,
      imageHeight: parsedResponse.imageHeight || 800,
      imageDataUrl: body.image.startsWith('data:') ? body.image : `data:${mediaType};base64,${base64}`,
      components,
      rootComponents,
      analysisModel: 'claude-sonnet-4-20250514',
      processingTimeMs,
      stats,
    };

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Screenshot analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    );
  }
}

// Helper to calculate nesting depth
function calculateDepth(
  componentId: string,
  allComponents: ClaudeComponentResult[]
): number {
  const component = allComponents.find((c) => c.id === componentId);
  if (!component || !component.parentId) return 0;

  return 1 + calculateDepth(component.parentId, allComponents);
}
