import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// DEEP COMPONENT EXTRACTOR
// Extracts comprehensive design data for AI understanding
// ============================================================================

interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

interface Paint {
  type: string;
  visible?: boolean;
  opacity?: number;
  color?: Color;
  blendMode?: string;
  gradientHandlePositions?: { x: number; y: number }[];
  gradientStops?: Array<{ color: Color; position: number }>;
  scaleMode?: string;
  imageRef?: string;
}

interface Effect {
  type: string;
  visible?: boolean;
  color?: Color;
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
  blendMode?: string;
}

interface TypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontSize: number;
  fontWeight: number;
  textCase?: string;
  textDecoration?: string;
  textAutoResize?: string;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  lineHeightUnit?: string;
  letterSpacing?: number;
  paragraphSpacing?: number;
  paragraphIndent?: number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
}

interface LayoutConstraint {
  vertical: string;
  horizontal: string;
}

interface LayoutGrid {
  pattern: string;
  sectionSize?: number;
  visible?: boolean;
  color?: Color;
  alignment?: string;
  gutterSize?: number;
  offset?: number;
  count?: number;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  blendMode?: string;

  // Geometry
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  absoluteRenderBounds?: { x: number; y: number; width: number; height: number };
  relativeTransform?: number[][];
  size?: { x: number; y: number };

  // Visual
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: string;
  strokeCap?: string;
  strokeJoin?: string;
  strokeDashes?: number[];
  strokeMiterAngle?: number;
  cornerRadius?: number;
  rectangleCornerRadii?: number[];
  effects?: Effect[];

  // Layout (Auto Layout)
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  layoutWrap?: 'NO_WRAP' | 'WRAP';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  primaryAxisAlignItems?: 'MIN' | 'MAX' | 'CENTER' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'MAX' | 'CENTER' | 'BASELINE';
  counterAxisAlignContent?: 'AUTO' | 'SPACE_BETWEEN';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  counterAxisSpacing?: number;
  layoutPositioning?: 'AUTO' | 'ABSOLUTE';

  // Constraints
  constraints?: LayoutConstraint;

  // Sizing
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  layoutGrow?: number;
  layoutAlign?: string;

  // Clipping
  clipsContent?: boolean;

  // Text
  style?: TypeStyle;
  characters?: string;
  characterStyleOverrides?: number[];
  styleOverrideTable?: Record<string, Partial<TypeStyle>>;

  // Component
  componentId?: string;
  componentSetId?: string;
  componentPropertyReferences?: Record<string, string>;
  componentProperties?: Record<string, {
    type: string;
    value: string | boolean;
    preferredValues?: Array<{ type: string; key: string }>;
  }>;
  componentPropertyDefinitions?: Record<string, {
    type: string;
    defaultValue?: string | boolean;
    variantOptions?: string[];
    preferredValues?: Array<{ type: string; key: string }>;
  }>;

  // Children
  children?: FigmaNode[];

  // Styles (references to shared styles)
  styles?: Record<string, string>;

  // Export settings
  exportSettings?: Array<{
    suffix: string;
    format: string;
    constraint: { type: string; value: number };
  }>;

  // Layout grids
  layoutGrids?: LayoutGrid[];
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

function colorToHex(color: Color): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

function colorToRgba(color: Color, opacity?: number): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = opacity ?? color.a ?? 1;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

function colorToHsl(color: Color): string {
  const r = color.r;
  const g = color.g;
  const b = color.b;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

interface ExtractedColor {
  hex: string;
  rgba: string;
  hsl: string;
  opacity: number;
  usage: string;
  nodeName: string;
  nodeType: string;
}

interface ExtractedTypography {
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
}

interface ExtractedSpacing {
  type: 'padding' | 'gap' | 'margin';
  value: number | { top: number; right: number; bottom: number; left: number };
  nodeName: string;
  nodeType: string;
}

interface ExtractedLayout {
  nodeName: string;
  nodeId: string;
  direction: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
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
}

interface ExtractedEffect {
  type: string;
  color?: { hex: string; rgba: string };
  offset?: { x: number; y: number };
  blur: number;
  spread?: number;
  nodeName: string;
  cssValue?: string;
}

interface ExtractedCorner {
  type: 'uniform' | 'individual';
  value: number | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number };
  nodeName: string;
}

interface ExtractedBorder {
  color: { hex: string; rgba: string };
  weight: number;
  align: string;
  style?: string;
  nodeName: string;
}

interface ExtractedComponent {
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
}

interface NodeStructure {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  size?: { width: number; height: number };
  position?: { x: number; y: number };
  fills?: Array<{ type: string; color?: string; opacity?: number }>;
  strokes?: Array<{ color: string; weight: number }>;
  cornerRadius?: number | number[];
  effects?: string[];
  layout?: {
    mode: string;
    padding?: { top: number; right: number; bottom: number; left: number };
    gap?: number;
    mainAxis?: string;
    crossAxis?: string;
  };
  text?: {
    content: string;
    font: { family: string; size: number; weight: number };
  };
  componentReference?: {
    componentId?: string;
    componentSetId?: string;
    properties?: Record<string, { type: string; value: string | boolean }>;
  };
  children?: NodeStructure[];
}

// Extract all colors from node tree
function extractAllColors(node: FigmaNode, colors: ExtractedColor[], path: string = ''): void {
  const currentPath = path ? `${path} > ${node.name}` : node.name;

  // Extract fill colors
  if (node.fills && Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      if (fill.visible !== false && fill.type === 'SOLID' && fill.color) {
        colors.push({
          hex: colorToHex(fill.color),
          rgba: colorToRgba(fill.color, fill.opacity),
          hsl: colorToHsl(fill.color),
          opacity: fill.opacity ?? fill.color.a ?? 1,
          usage: 'fill',
          nodeName: currentPath,
          nodeType: node.type,
        });
      }
      // Handle gradients
      if (fill.visible !== false && (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') && fill.gradientStops) {
        for (const stop of fill.gradientStops) {
          colors.push({
            hex: colorToHex(stop.color),
            rgba: colorToRgba(stop.color),
            hsl: colorToHsl(stop.color),
            opacity: stop.color.a ?? 1,
            usage: `gradient-${fill.type.replace('GRADIENT_', '').toLowerCase()}`,
            nodeName: currentPath,
            nodeType: node.type,
          });
        }
      }
    }
  }

  // Extract stroke colors
  if (node.strokes && Array.isArray(node.strokes)) {
    for (const stroke of node.strokes) {
      if (stroke.visible !== false && stroke.type === 'SOLID' && stroke.color) {
        colors.push({
          hex: colorToHex(stroke.color),
          rgba: colorToRgba(stroke.color, stroke.opacity),
          hsl: colorToHsl(stroke.color),
          opacity: stroke.opacity ?? stroke.color.a ?? 1,
          usage: 'stroke',
          nodeName: currentPath,
          nodeType: node.type,
        });
      }
    }
  }

  // Extract effect colors (shadows)
  if (node.effects && Array.isArray(node.effects)) {
    for (const effect of node.effects) {
      if (effect.visible !== false && effect.color) {
        colors.push({
          hex: colorToHex(effect.color),
          rgba: colorToRgba(effect.color),
          hsl: colorToHsl(effect.color),
          opacity: effect.color.a ?? 1,
          usage: `effect-${effect.type.toLowerCase()}`,
          nodeName: currentPath,
          nodeType: node.type,
        });
      }
    }
  }

  // Recurse into children
  if (node.children) {
    for (const child of node.children) {
      extractAllColors(child, colors, currentPath);
    }
  }
}

// Extract all typography
function extractAllTypography(node: FigmaNode, typography: ExtractedTypography[], path: string = ''): void {
  const currentPath = path ? `${path} > ${node.name}` : node.name;

  if (node.type === 'TEXT' && node.style) {
    typography.push({
      nodeName: currentPath,
      nodeId: node.id,
      text: node.characters || '',
      style: {
        fontFamily: node.style.fontFamily,
        fontWeight: node.style.fontWeight,
        fontSize: node.style.fontSize,
        lineHeight: node.style.lineHeightPx,
        lineHeightUnit: node.style.lineHeightUnit,
        letterSpacing: node.style.letterSpacing,
        textCase: node.style.textCase,
        textDecoration: node.style.textDecoration,
        textAlign: node.style.textAlignHorizontal,
      },
    });
  }

  if (node.children) {
    for (const child of node.children) {
      extractAllTypography(child, typography, currentPath);
    }
  }
}

// Extract all spacing values
function extractAllSpacing(node: FigmaNode, spacing: ExtractedSpacing[], path: string = ''): void {
  const currentPath = path ? `${path} > ${node.name}` : node.name;

  // Extract padding from auto-layout
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    const padding = {
      top: node.paddingTop ?? 0,
      right: node.paddingRight ?? 0,
      bottom: node.paddingBottom ?? 0,
      left: node.paddingLeft ?? 0,
    };

    // Only add if any padding exists
    if (padding.top || padding.right || padding.bottom || padding.left) {
      spacing.push({
        type: 'padding',
        value: padding,
        nodeName: currentPath,
        nodeType: node.type,
      });
    }

    // Extract gap
    if (node.itemSpacing && node.itemSpacing > 0) {
      spacing.push({
        type: 'gap',
        value: node.itemSpacing,
        nodeName: currentPath,
        nodeType: node.type,
      });
    }
  }

  if (node.children) {
    for (const child of node.children) {
      extractAllSpacing(child, spacing, currentPath);
    }
  }
}

// Extract all layout information
function extractAllLayouts(node: FigmaNode, layouts: ExtractedLayout[], path: string = ''): void {
  const currentPath = path ? `${path} > ${node.name}` : node.name;

  if (node.layoutMode && node.layoutMode !== 'NONE') {
    layouts.push({
      nodeName: currentPath,
      nodeId: node.id,
      direction: node.layoutMode,
      wrap: node.layoutWrap === 'WRAP',
      mainAxisAlignment: node.primaryAxisAlignItems || 'MIN',
      crossAxisAlignment: node.counterAxisAlignItems || 'MIN',
      padding: {
        top: node.paddingTop ?? 0,
        right: node.paddingRight ?? 0,
        bottom: node.paddingBottom ?? 0,
        left: node.paddingLeft ?? 0,
      },
      gap: node.itemSpacing ?? 0,
      counterAxisGap: node.counterAxisSpacing,
      sizing: {
        width: {
          mode: node.primaryAxisSizingMode || 'FIXED',
          value: node.absoluteBoundingBox?.width,
          min: node.minWidth,
          max: node.maxWidth,
        },
        height: {
          mode: node.counterAxisSizingMode || 'FIXED',
          value: node.absoluteBoundingBox?.height,
          min: node.minHeight,
          max: node.maxHeight,
        },
      },
    });
  }

  if (node.children) {
    for (const child of node.children) {
      extractAllLayouts(child, layouts, currentPath);
    }
  }
}

// Extract all effects (shadows, blurs)
function extractAllEffects(node: FigmaNode, effects: ExtractedEffect[], path: string = ''): void {
  const currentPath = path ? `${path} > ${node.name}` : node.name;

  if (node.effects && Array.isArray(node.effects)) {
    for (const effect of node.effects) {
      if (effect.visible !== false) {
        const extractedEffect: ExtractedEffect = {
          type: effect.type,
          blur: effect.radius ?? 0,
          nodeName: currentPath,
        };

        if (effect.color) {
          extractedEffect.color = {
            hex: colorToHex(effect.color),
            rgba: colorToRgba(effect.color),
          };
        }

        if (effect.offset) {
          extractedEffect.offset = effect.offset;
        }

        if (effect.spread !== undefined) {
          extractedEffect.spread = effect.spread;
        }

        // Generate CSS box-shadow value
        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
          const inset = effect.type === 'INNER_SHADOW' ? 'inset ' : '';
          const x = effect.offset?.x ?? 0;
          const y = effect.offset?.y ?? 0;
          const blur = effect.radius ?? 0;
          const spread = effect.spread ?? 0;
          const color = effect.color ? colorToRgba(effect.color) : 'rgba(0,0,0,0.25)';
          extractedEffect.cssValue = `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;
        }

        effects.push(extractedEffect);
      }
    }
  }

  if (node.children) {
    for (const child of node.children) {
      extractAllEffects(child, effects, currentPath);
    }
  }
}

// Extract all corner radii
function extractAllCorners(node: FigmaNode, corners: ExtractedCorner[], path: string = ''): void {
  const currentPath = path ? `${path} > ${node.name}` : node.name;

  if (node.cornerRadius !== undefined && node.cornerRadius > 0) {
    corners.push({
      type: 'uniform',
      value: node.cornerRadius,
      nodeName: currentPath,
    });
  } else if (node.rectangleCornerRadii && node.rectangleCornerRadii.some(r => r > 0)) {
    corners.push({
      type: 'individual',
      value: {
        topLeft: node.rectangleCornerRadii[0],
        topRight: node.rectangleCornerRadii[1],
        bottomRight: node.rectangleCornerRadii[2],
        bottomLeft: node.rectangleCornerRadii[3],
      },
      nodeName: currentPath,
    });
  }

  if (node.children) {
    for (const child of node.children) {
      extractAllCorners(child, corners, currentPath);
    }
  }
}

// Extract all borders
function extractAllBorders(node: FigmaNode, borders: ExtractedBorder[], path: string = ''): void {
  const currentPath = path ? `${path} > ${node.name}` : node.name;

  if (node.strokes && Array.isArray(node.strokes) && node.strokeWeight) {
    for (const stroke of node.strokes) {
      if (stroke.visible !== false && stroke.type === 'SOLID' && stroke.color) {
        borders.push({
          color: {
            hex: colorToHex(stroke.color),
            rgba: colorToRgba(stroke.color, stroke.opacity),
          },
          weight: node.strokeWeight,
          align: node.strokeAlign || 'INSIDE',
          nodeName: currentPath,
        });
      }
    }
  }

  if (node.children) {
    for (const child of node.children) {
      extractAllBorders(child, borders, currentPath);
    }
  }
}

// Extract component information
function extractComponentInfo(node: FigmaNode): ExtractedComponent {
  const isComponentSet = node.type === 'COMPONENT_SET';

  const properties: ExtractedComponent['properties'] = {};

  // Get property definitions (from component set or component)
  if (node.componentPropertyDefinitions) {
    for (const [key, def] of Object.entries(node.componentPropertyDefinitions)) {
      const cleanKey = key.replace(/#\d+:\d+$/, '');
      properties[cleanKey] = {
        type: def.type,
        defaultValue: def.defaultValue,
        options: def.variantOptions,
        preferredValues: def.preferredValues,
      };
    }
  }

  // Get current property values (from instance)
  if (node.componentProperties) {
    for (const [key, prop] of Object.entries(node.componentProperties)) {
      const cleanKey = key.replace(/#\d+:\d+$/, '');
      if (properties[cleanKey]) {
        properties[cleanKey].value = prop.value;
      } else {
        properties[cleanKey] = {
          type: prop.type,
          value: prop.value,
          preferredValues: prop.preferredValues,
        };
      }
    }
  }

  // Extract variants from component set children
  let variants: ExtractedComponent['variants'];
  if (isComponentSet && node.children) {
    variants = node.children
      .filter(child => child.type === 'COMPONENT')
      .map(variant => {
        const propertyValues: Record<string, string> = {};
        // Parse variant name like "Size=Large, State=Hover"
        const parts = variant.name.split(',').map(p => p.trim());
        for (const part of parts) {
          const [propName, propValue] = part.split('=').map(p => p.trim());
          if (propName && propValue) {
            propertyValues[propName] = propValue;
          }
        }
        return {
          name: variant.name,
          nodeId: variant.id,
          propertyValues,
        };
      });
  }

  return {
    nodeName: node.name,
    nodeId: node.id,
    nodeType: node.type,
    isComponentSet,
    properties,
    variants,
  };
}

// Build complete node structure tree
function buildNodeStructure(node: FigmaNode, depth: number = 0, maxDepth: number = 10): NodeStructure | null {
  if (depth > maxDepth) return null;

  const structure: NodeStructure = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible !== false,
  };

  // Size and position
  if (node.absoluteBoundingBox) {
    structure.size = {
      width: Math.round(node.absoluteBoundingBox.width),
      height: Math.round(node.absoluteBoundingBox.height),
    };
    structure.position = {
      x: Math.round(node.absoluteBoundingBox.x),
      y: Math.round(node.absoluteBoundingBox.y),
    };
  }

  // Fills
  if (node.fills && Array.isArray(node.fills)) {
    const visibleFills = node.fills.filter(f => f.visible !== false);
    if (visibleFills.length > 0) {
      structure.fills = visibleFills.map(f => ({
        type: f.type,
        color: f.color ? colorToHex(f.color) : undefined,
        opacity: f.opacity ?? f.color?.a ?? 1,
      }));
    }
  }

  // Strokes
  if (node.strokes && Array.isArray(node.strokes) && node.strokeWeight) {
    const visibleStrokes = node.strokes.filter(s => s.visible !== false && s.color);
    if (visibleStrokes.length > 0) {
      structure.strokes = visibleStrokes.map(s => ({
        color: colorToHex(s.color!),
        weight: node.strokeWeight!,
      }));
    }
  }

  // Corner radius
  if (node.cornerRadius) {
    structure.cornerRadius = node.cornerRadius;
  } else if (node.rectangleCornerRadii && node.rectangleCornerRadii.some(r => r > 0)) {
    structure.cornerRadius = node.rectangleCornerRadii;
  }

  // Effects
  if (node.effects && node.effects.length > 0) {
    structure.effects = node.effects
      .filter(e => e.visible !== false)
      .map(e => e.type);
  }

  // Layout
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    structure.layout = {
      mode: node.layoutMode,
      padding: {
        top: node.paddingTop ?? 0,
        right: node.paddingRight ?? 0,
        bottom: node.paddingBottom ?? 0,
        left: node.paddingLeft ?? 0,
      },
      gap: node.itemSpacing ?? 0,
      mainAxis: node.primaryAxisAlignItems,
      crossAxis: node.counterAxisAlignItems,
    };
  }

  // Text
  if (node.type === 'TEXT' && node.style) {
    structure.text = {
      content: node.characters || '',
      font: {
        family: node.style.fontFamily,
        size: node.style.fontSize,
        weight: node.style.fontWeight,
      },
    };
  }

  // Component reference
  if (node.componentId || node.componentSetId || node.componentProperties) {
    structure.componentReference = {
      componentId: node.componentId,
      componentSetId: node.componentSetId,
      properties: node.componentProperties ?
        Object.fromEntries(
          Object.entries(node.componentProperties).map(([k, v]) => [
            k.replace(/#\d+:\d+$/, ''),
            { type: v.type, value: v.value }
          ])
        ) : undefined,
    };
  }

  // Children
  if (node.children && node.children.length > 0) {
    structure.children = node.children
      .map(child => buildNodeStructure(child, depth + 1, maxDepth))
      .filter((s): s is NodeStructure => s !== null);
  }

  return structure;
}

// ============================================================================
// TOKEN INFERENCE
// ============================================================================

interface InferredTokens {
  colors: Record<string, { value: string; usageCount: number; suggestedName: string }>;
  spacing: Record<string, { value: number; usageCount: number; suggestedName: string }>;
  typography: Record<string, { value: any; usageCount: number; suggestedName: string }>;
  borderRadius: Record<string, { value: number | number[]; usageCount: number; suggestedName: string }>;
  shadows: Record<string, { value: string; usageCount: number; suggestedName: string }>;
}

function inferTokens(
  colors: ExtractedColor[],
  spacing: ExtractedSpacing[],
  typography: ExtractedTypography[],
  corners: ExtractedCorner[],
  effects: ExtractedEffect[]
): InferredTokens {
  const tokens: InferredTokens = {
    colors: {},
    spacing: {},
    typography: {},
    borderRadius: {},
    shadows: {},
  };

  // Infer color tokens
  const colorCounts = new Map<string, number>();
  for (const color of colors) {
    const count = colorCounts.get(color.hex) || 0;
    colorCounts.set(color.hex, count + 1);
  }
  colorCounts.forEach((count, hex) => {
    tokens.colors[hex] = {
      value: hex,
      usageCount: count,
      suggestedName: suggestColorName(hex),
    };
  });

  // Infer spacing tokens
  const spacingValues = new Set<number>();
  for (const sp of spacing) {
    if (typeof sp.value === 'number') {
      spacingValues.add(sp.value);
    } else {
      Object.values(sp.value).forEach(v => spacingValues.add(v));
    }
  }
  Array.from(spacingValues).sort((a, b) => a - b).forEach((value, index) => {
    tokens.spacing[`spacing-${index + 1}`] = {
      value,
      usageCount: spacing.filter(s => {
        if (typeof s.value === 'number') return s.value === value;
        return Object.values(s.value).includes(value);
      }).length,
      suggestedName: suggestSpacingName(value),
    };
  });

  // Infer typography tokens
  const fontSizes = new Set<number>();
  for (const typo of typography) {
    fontSizes.add(typo.style.fontSize);
  }
  Array.from(fontSizes).sort((a, b) => a - b).forEach((size, index) => {
    const sample = typography.find(t => t.style.fontSize === size);
    tokens.typography[`text-${index + 1}`] = {
      value: {
        fontSize: size,
        fontFamily: sample?.style.fontFamily,
        fontWeight: sample?.style.fontWeight,
        lineHeight: sample?.style.lineHeight,
      },
      usageCount: typography.filter(t => t.style.fontSize === size).length,
      suggestedName: suggestTypographyName(size),
    };
  });

  // Infer border radius tokens
  const radiiValues = new Set<number>();
  for (const corner of corners) {
    if (typeof corner.value === 'number') {
      radiiValues.add(corner.value);
    } else {
      Object.values(corner.value).forEach(v => radiiValues.add(v));
    }
  }
  Array.from(radiiValues).sort((a, b) => a - b).forEach((value, index) => {
    tokens.borderRadius[`radius-${index + 1}`] = {
      value,
      usageCount: corners.filter(c => {
        if (typeof c.value === 'number') return c.value === value;
        return Object.values(c.value).includes(value);
      }).length,
      suggestedName: suggestRadiusName(value),
    };
  });

  // Infer shadow tokens
  const shadowCss = new Set<string>();
  for (const effect of effects) {
    if (effect.cssValue) {
      shadowCss.add(effect.cssValue);
    }
  }
  Array.from(shadowCss).forEach((css, index) => {
    tokens.shadows[`shadow-${index + 1}`] = {
      value: css,
      usageCount: effects.filter(e => e.cssValue === css).length,
      suggestedName: `shadow-${['sm', 'md', 'lg', 'xl'][index] || index + 1}`,
    };
  });

  return tokens;
}

// Helper functions for token naming
function suggestColorName(hex: string): string {
  // Simple color name suggestions based on hue
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;

  if (l < 0.1) return 'black';
  if (l > 0.9) return 'white';
  if (max === min) return l > 0.5 ? 'gray-light' : 'gray-dark';

  let h = 0;
  const d = max - min;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  const hue = Math.round(h * 360);

  if (hue < 15 || hue >= 345) return 'red';
  if (hue < 45) return 'orange';
  if (hue < 75) return 'yellow';
  if (hue < 165) return 'green';
  if (hue < 195) return 'cyan';
  if (hue < 255) return 'blue';
  if (hue < 285) return 'purple';
  return 'pink';
}

function suggestSpacingName(value: number): string {
  if (value <= 4) return 'spacing-xs';
  if (value <= 8) return 'spacing-sm';
  if (value <= 16) return 'spacing-md';
  if (value <= 24) return 'spacing-lg';
  if (value <= 32) return 'spacing-xl';
  return 'spacing-2xl';
}

function suggestTypographyName(size: number): string {
  if (size <= 12) return 'text-xs';
  if (size <= 14) return 'text-sm';
  if (size <= 16) return 'text-base';
  if (size <= 18) return 'text-lg';
  if (size <= 20) return 'text-xl';
  if (size <= 24) return 'text-2xl';
  if (size <= 30) return 'text-3xl';
  return 'text-4xl';
}

function suggestRadiusName(value: number): string {
  if (value === 0) return 'radius-none';
  if (value <= 2) return 'radius-sm';
  if (value <= 4) return 'radius-md';
  if (value <= 8) return 'radius-lg';
  if (value <= 16) return 'radius-xl';
  if (value >= 9999) return 'radius-full';
  return 'radius-2xl';
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

async function fetchFigmaNode(
  fileKey: string,
  nodeId: string,
  authHeader: string
): Promise<{ ok: boolean; data?: any; status?: number; error?: string }> {
  try {
    const encodedNodeId = encodeURIComponent(nodeId);
    // Request with geometry=paths to get all visual data
    const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodedNodeId}&geometry=paths`;

    console.log(`[Deep Extract API] Calling Figma API: ${url}`);

    const response = await fetch(url, {
      headers: { 'Authorization': authHeader },
    });

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

    console.log(`[Deep Extract API] Request for fileKey: ${fileKey}, nodeId: ${nodeId}`);

    // Get authentication
    const userToken = request.cookies.get('token')?.value;
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://uiforge-demo-production.up.railway.app';

    let figmaData: any = null;

    // Try OAuth via backend first
    if (userToken) {
      try {
        // Use the backend instance endpoint which includes geometry
        const backendResponse = await fetch(`${BACKEND_URL}/api/v1/figma/instance/${fileKey}/${nodeId}`, {
          headers: { 'Authorization': `Bearer ${userToken}` },
        });

        if (backendResponse.ok) {
          const data = await backendResponse.json();
          figmaData = { nodes: { [nodeId]: { document: data.data } } };
        }
      } catch (err) {
        console.error('[Deep Extract API] Backend fetch failed:', err);
      }
    }

    // Fall back to direct Figma API
    if (!figmaData) {
      const figmaToken = process.env.FIGMA_ACCESS_TOKEN;
      if (!figmaToken) {
        return NextResponse.json(
          { error: 'Not authenticated. Please log in with your Figma account.' },
          { status: 401 }
        );
      }

      const result = await fetchFigmaNode(fileKey, nodeId, `Bearer ${figmaToken}`);
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error || 'Failed to fetch from Figma' },
          { status: result.status || 500 }
        );
      }
      figmaData = result.data;
    }

    const nodeData = figmaData.nodes?.[nodeId];
    if (!nodeData || !nodeData.document) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    const node: FigmaNode = nodeData.document;

    console.log(`[Deep Extract API] Processing node: ${node.name} (${node.type})`);

    // ========================================================================
    // EXTRACT EVERYTHING
    // ========================================================================

    const colors: ExtractedColor[] = [];
    const typography: ExtractedTypography[] = [];
    const spacing: ExtractedSpacing[] = [];
    const layouts: ExtractedLayout[] = [];
    const effects: ExtractedEffect[] = [];
    const corners: ExtractedCorner[] = [];
    const borders: ExtractedBorder[] = [];

    extractAllColors(node, colors);
    extractAllTypography(node, typography);
    extractAllSpacing(node, spacing);
    extractAllLayouts(node, layouts);
    extractAllEffects(node, effects);
    extractAllCorners(node, corners);
    extractAllBorders(node, borders);

    // Extract component info
    const component = extractComponentInfo(node);

    // Build complete structure tree
    const structure = buildNodeStructure(node, 0, 15);

    // Infer tokens
    const inferredTokens = inferTokens(colors, spacing, typography, corners, effects);

    // ========================================================================
    // BUILD COMPREHENSIVE RESPONSE
    // ========================================================================

    const response = {
      meta: {
        fileKey,
        nodeId,
        nodeName: node.name,
        nodeType: node.type,
        extractedAt: new Date().toISOString(),
      },

      // Component information
      component,

      // Visual properties
      visual: {
        colors: {
          all: colors,
          unique: [...new Set(colors.map(c => c.hex))],
          byUsage: {
            fill: colors.filter(c => c.usage === 'fill'),
            stroke: colors.filter(c => c.usage === 'stroke'),
            effect: colors.filter(c => c.usage.startsWith('effect-')),
          },
        },
        borders,
        corners,
        effects,
      },

      // Layout properties
      layout: {
        autoLayouts: layouts,
        spacing,
        dimensions: node.absoluteBoundingBox ? {
          width: Math.round(node.absoluteBoundingBox.width),
          height: Math.round(node.absoluteBoundingBox.height),
        } : null,
      },

      // Typography
      typography: {
        all: typography,
        fontFamilies: [...new Set(typography.map(t => t.style.fontFamily))],
        fontSizes: [...new Set(typography.map(t => t.style.fontSize))].sort((a, b) => a - b),
        fontWeights: [...new Set(typography.map(t => t.style.fontWeight))].sort((a, b) => a - b),
      },

      // Full structure tree
      structure,

      // Inferred design tokens
      inferredTokens,

      // Statistics
      stats: {
        totalColors: colors.length,
        uniqueColors: [...new Set(colors.map(c => c.hex))].length,
        totalTextNodes: typography.length,
        totalAutoLayouts: layouts.length,
        totalEffects: effects.length,
        childrenCount: structure?.children?.length || 0,
        maxDepth: calculateMaxDepth(structure),
      },
    };

    console.log(`[Deep Extract API] Extraction complete:`, response.stats);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Deep Extract API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper to calculate max depth of structure tree
function calculateMaxDepth(node: NodeStructure | null, depth: number = 0): number {
  if (!node) return depth;
  if (!node.children || node.children.length === 0) return depth;
  return Math.max(...node.children.map(c => calculateMaxDepth(c, depth + 1)));
}
