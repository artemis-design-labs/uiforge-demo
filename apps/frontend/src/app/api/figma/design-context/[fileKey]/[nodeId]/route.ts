import { NextRequest, NextResponse } from 'next/server';

interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface Paint {
  type: string;
  color?: Color;
  opacity?: number;
  gradientStops?: Array<{ color: Color; position: number }>;
}

interface TypeStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeightPx?: number;
  letterSpacing?: number;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  cornerRadius?: number;
  rectangleCornerRadii?: number[];
  effects?: Array<{
    type: string;
    color?: Color;
    offset?: { x: number; y: number };
    radius?: number;
    spread?: number;
  }>;
  style?: TypeStyle;
  characters?: string;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  children?: FigmaNode[];
  componentPropertyDefinitions?: Record<string, any>;
}

// Convert Figma color (0-1) to hex
function colorToHex(color: Color): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

// Convert Figma color to rgba
function colorToRgba(color: Color, opacity?: number): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = opacity ?? color.a ?? 1;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

// Extract all colors from a node and its children
function extractColors(node: FigmaNode, colors: Map<string, { hex: string; usage: string[] }>): void {
  // Extract fill colors
  if (node.fills && Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      if (fill.type === 'SOLID' && fill.color) {
        const hex = colorToHex(fill.color);
        const existing = colors.get(hex) || { hex, usage: [] };
        existing.usage.push(`${node.name} (fill)`);
        colors.set(hex, existing);
      }
    }
  }

  // Extract stroke colors
  if (node.strokes && Array.isArray(node.strokes)) {
    for (const stroke of node.strokes) {
      if (stroke.type === 'SOLID' && stroke.color) {
        const hex = colorToHex(stroke.color);
        const existing = colors.get(hex) || { hex, usage: [] };
        existing.usage.push(`${node.name} (stroke)`);
        colors.set(hex, existing);
      }
    }
  }

  // Recurse into children
  if (node.children) {
    for (const child of node.children) {
      extractColors(child, colors);
    }
  }
}

// Extract typography styles
function extractTypography(node: FigmaNode, styles: Array<{ node: string; style: any }>): void {
  if (node.type === 'TEXT' && node.style) {
    styles.push({
      node: node.name,
      style: {
        fontFamily: node.style.fontFamily,
        fontSize: node.style.fontSize,
        fontWeight: node.style.fontWeight,
        lineHeight: node.style.lineHeightPx,
        letterSpacing: node.style.letterSpacing,
        text: node.characters?.substring(0, 50) + (node.characters && node.characters.length > 50 ? '...' : ''),
      },
    });
  }

  if (node.children) {
    for (const child of node.children) {
      extractTypography(child, styles);
    }
  }
}

// Extract spacing and dimensions
function extractDimensions(node: FigmaNode): any {
  const dimensions: any = {};

  if (node.absoluteBoundingBox) {
    dimensions.width = Math.round(node.absoluteBoundingBox.width);
    dimensions.height = Math.round(node.absoluteBoundingBox.height);
  }

  if (node.cornerRadius !== undefined) {
    dimensions.borderRadius = node.cornerRadius;
  } else if (node.rectangleCornerRadii) {
    dimensions.borderRadius = node.rectangleCornerRadii;
  }

  if (node.strokeWeight !== undefined) {
    dimensions.strokeWeight = node.strokeWeight;
  }

  return dimensions;
}

// Extract effects (shadows, blurs)
function extractEffects(node: FigmaNode): any[] {
  const effects: any[] = [];

  if (node.effects) {
    for (const effect of node.effects) {
      const effectData: any = {
        type: effect.type,
      };

      if (effect.color) {
        effectData.color = colorToHex(effect.color);
        effectData.rgba = colorToRgba(effect.color);
      }

      if (effect.offset) {
        effectData.offset = effect.offset;
      }

      if (effect.radius !== undefined) {
        effectData.radius = effect.radius;
      }

      if (effect.spread !== undefined) {
        effectData.spread = effect.spread;
      }

      effects.push(effectData);
    }
  }

  return effects;
}

// Recursively build a simplified structure of the component
function buildStructure(node: FigmaNode, depth: number = 0): any {
  if (depth > 5) return null; // Limit depth to avoid huge responses

  const structure: any = {
    name: node.name,
    type: node.type,
  };

  // Add fills
  if (node.fills && Array.isArray(node.fills)) {
    const solidFills = node.fills.filter(f => f.type === 'SOLID' && f.color);
    if (solidFills.length > 0) {
      structure.fills = solidFills.map(f => ({
        color: colorToHex(f.color!),
        opacity: f.opacity ?? f.color?.a ?? 1,
      }));
    }
  }

  // Add strokes
  if (node.strokes && Array.isArray(node.strokes)) {
    const solidStrokes = node.strokes.filter(s => s.type === 'SOLID' && s.color);
    if (solidStrokes.length > 0) {
      structure.strokes = solidStrokes.map(s => ({
        color: colorToHex(s.color!),
        weight: node.strokeWeight,
      }));
    }
  }

  // Add dimensions
  if (node.absoluteBoundingBox) {
    structure.size = {
      width: Math.round(node.absoluteBoundingBox.width),
      height: Math.round(node.absoluteBoundingBox.height),
    };
  }

  // Add corner radius
  if (node.cornerRadius) {
    structure.cornerRadius = node.cornerRadius;
  }

  // Add text content
  if (node.type === 'TEXT') {
    structure.text = node.characters;
    if (node.style) {
      structure.font = {
        family: node.style.fontFamily,
        size: node.style.fontSize,
        weight: node.style.fontWeight,
      };
    }
  }

  // Add children (limited depth)
  if (node.children && node.children.length > 0) {
    structure.children = node.children
      .map(child => buildStructure(child, depth + 1))
      .filter(Boolean);
  }

  return structure;
}

// Helper function to fetch node from Figma with authorization
async function fetchFigmaNode(
  fileKey: string,
  nodeId: string,
  authHeader: string
): Promise<{ ok: boolean; data?: any; status?: number; error?: string }> {
  try {
    const response = await fetch(
      `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}&geometry=paths`,
      {
        headers: {
          'Authorization': authHeader,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { ok: false, status: response.status, error: errorData.message || 'API error' };
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileKey: string; nodeId: string }> }
) {
  try {
    const { fileKey, nodeId } = await params;

    console.log(`[Design Context API] Request received - fileKey: ${fileKey}, nodeId: ${nodeId}`);

    // For design context, we always use direct Figma API with geometry=paths
    // This ensures we get fresh data with all visual properties (fills, strokes, etc.)
    // Railway's cached data might not include these properties
    const figmaToken = process.env.FIGMA_ACCESS_TOKEN;
    if (!figmaToken) {
      console.error('[Design Context API] FIGMA_ACCESS_TOKEN not configured');
      return NextResponse.json(
        { error: 'Figma access token not configured. Please add FIGMA_ACCESS_TOKEN to environment variables.' },
        { status: 500 }
      );
    }

    console.log(`[Design Context API] Fetching via direct Figma API for node ${nodeId} in file ${fileKey}`);

    const result = await fetchFigmaNode(fileKey, nodeId, `Bearer ${figmaToken}`);
    if (!result.ok) {
      console.error('[Design Context API] Figma API error:', result.status, result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to fetch design data' },
        { status: result.status || 500 }
      );
    }
    const figmaData = result.data;

    const nodeData = figmaData.nodes?.[nodeId] || figmaData;

    if (!nodeData || !nodeData.document) {
      console.error('[Design Context API] Node not found in response');
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }

    const node = nodeData.document;

    console.log(`[Design Context API] Processing node: ${node.name} (${node.type})`);
    console.log(`[Design Context API] Node has:`, {
      hasFills: !!node.fills,
      fillsCount: node.fills?.length || 0,
      hasStrokes: !!node.strokes,
      strokesCount: node.strokes?.length || 0,
      hasChildren: !!node.children,
      childrenCount: node.children?.length || 0,
      nodeKeys: Object.keys(node).slice(0, 20) // First 20 keys to see structure
    });

    // Extract all design information
    const colors = new Map<string, { hex: string; usage: string[] }>();
    extractColors(node, colors);

    const typography: Array<{ node: string; style: any }> = [];
    extractTypography(node, typography);

    const dimensions = extractDimensions(node);
    const effects = extractEffects(node);
    const structure = buildStructure(node);

    // Convert colors map to array
    const colorsList = Array.from(colors.values()).map(c => ({
      hex: c.hex,
      usedIn: c.usage.slice(0, 5), // Limit to 5 usages
    }));

    const designContext = {
      nodeId,
      nodeName: node.name,
      nodeType: node.type,
      colors: colorsList,
      typography: typography.slice(0, 10), // Limit typography entries
      dimensions,
      effects,
      structure,
    };

    console.log(`[Design Context API] Found ${colorsList.length} colors, ${typography.length} text styles`);
    if (colorsList.length > 0) {
      console.log(`[Design Context API] Colors found:`, colorsList.slice(0, 5));
    } else {
      console.log(`[Design Context API] No colors found - check if node has fills/strokes`);
    }

    return NextResponse.json(designContext);
  } catch (error) {
    console.error('[Design Context API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
