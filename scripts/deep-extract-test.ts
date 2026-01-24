/**
 * Deep Extract Test Script
 *
 * This script tests the deep extraction API on a Button component
 * from the Artemis Design System Figma file.
 *
 * Usage: npx ts-node scripts/deep-extract-test.ts
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from frontend
const envPath = path.join(__dirname, '../apps/frontend/.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FILE_KEY = 'qyrtCkpQQ1yq1Nv3h0mbkq'; // Artemis Design System

if (!FIGMA_ACCESS_TOKEN) {
  console.error('❌ FIGMA_ACCESS_TOKEN not found in environment');
  console.log('Please add FIGMA_ACCESS_TOKEN to apps/frontend/.env.local');
  process.exit(1);
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  componentPropertyDefinitions?: Record<string, any>;
}

interface FigmaFileResponse {
  name: string;
  document: FigmaNode;
}

// Helper function to make Figma API requests
async function figmaFetch(endpoint: string): Promise<any> {
  const response = await fetch(`https://api.figma.com/v1${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${FIGMA_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Figma API error (${response.status}): ${error.message || JSON.stringify(error)}`);
  }

  return response.json();
}

// Find all components matching a name pattern
function findComponents(node: FigmaNode, pattern: RegExp, results: FigmaNode[] = []): FigmaNode[] {
  if ((node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') && pattern.test(node.name)) {
    results.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      findComponents(child, pattern, results);
    }
  }

  return results;
}

// Main execution
async function main() {
  console.log('🔍 Deep Extract Test Script');
  console.log('===========================\n');

  try {
    // Step 1: Load file structure
    console.log('📂 Loading Figma file structure...');
    const file: FigmaFileResponse = await figmaFetch(`/files/${FILE_KEY}?depth=5`);
    console.log(`✅ Loaded file: "${file.name}"\n`);

    // Step 2: Find Button components
    console.log('🔎 Searching for Button components...');
    const buttonPattern = /^Button$/i;
    const buttons = findComponents(file.document, buttonPattern);

    if (buttons.length === 0) {
      // Try broader search
      console.log('   No exact match, trying broader search...');
      const broaderPattern = /button/i;
      const allButtons = findComponents(file.document, broaderPattern);
      console.log(`   Found ${allButtons.length} button-related components:`);

      // Show first 10
      allButtons.slice(0, 10).forEach(b => {
        console.log(`   - "${b.name}" (${b.type}) [${b.id}]`);
      });

      if (allButtons.length > 10) {
        console.log(`   ... and ${allButtons.length - 10} more`);
      }

      // Use the first COMPONENT_SET if available, otherwise first COMPONENT
      const target = allButtons.find(b => b.type === 'COMPONENT_SET') || allButtons[0];
      if (target) {
        console.log(`\n📍 Selecting: "${target.name}" (${target.id})`);
        await extractComponent(target.id);
      }
    } else {
      console.log(`✅ Found ${buttons.length} Button component(s):`);
      buttons.forEach(b => {
        console.log(`   - "${b.name}" (${b.type}) [${b.id}]`);
      });

      // Extract the first one (preferring COMPONENT_SET)
      const target = buttons.find(b => b.type === 'COMPONENT_SET') || buttons[0];
      console.log(`\n📍 Extracting: "${target.name}" (${target.id})`);
      await extractComponent(target.id);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function extractComponent(nodeId: string) {
  console.log('\n🔬 Deep Extracting Component...\n');

  try {
    // Fetch node with geometry
    const nodeData = await figmaFetch(`/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(nodeId)}&geometry=paths`);

    const node = nodeData.nodes[nodeId]?.document;
    if (!node) {
      console.error('❌ Node not found');
      return;
    }

    console.log('📋 Component Info:');
    console.log(`   Name: ${node.name}`);
    console.log(`   Type: ${node.type}`);
    console.log(`   ID: ${node.id}`);

    // Count children
    function countNodes(n: any): number {
      let count = 1;
      if (n.children) {
        for (const child of n.children) {
          count += countNodes(child);
        }
      }
      return count;
    }
    console.log(`   Total nodes: ${countNodes(node)}`);

    // Component properties
    if (node.componentPropertyDefinitions) {
      console.log('\n📊 Component Properties:');
      for (const [key, def] of Object.entries(node.componentPropertyDefinitions)) {
        const cleanKey = key.replace(/#\d+:\d+$/, '');
        const propDef = def as any;
        console.log(`   - ${cleanKey}: ${propDef.type}`);
        if (propDef.variantOptions) {
          console.log(`     Options: ${propDef.variantOptions.join(', ')}`);
        }
        if (propDef.defaultValue !== undefined) {
          console.log(`     Default: ${propDef.defaultValue}`);
        }
      }
    }

    // Variants (children of COMPONENT_SET)
    if (node.type === 'COMPONENT_SET' && node.children) {
      console.log(`\n🎨 Variants (${node.children.length}):`);
      node.children.slice(0, 5).forEach((variant: any) => {
        console.log(`   - ${variant.name} [${variant.id}]`);
      });
      if (node.children.length > 5) {
        console.log(`   ... and ${node.children.length - 5} more`);
      }
    }

    // Extract colors
    const colors = new Set<string>();
    function extractColors(n: any) {
      if (n.fills) {
        for (const fill of n.fills) {
          if (fill.type === 'SOLID' && fill.color) {
            const { r, g, b } = fill.color;
            const hex = `#${Math.round(r*255).toString(16).padStart(2,'0')}${Math.round(g*255).toString(16).padStart(2,'0')}${Math.round(b*255).toString(16).padStart(2,'0')}`.toUpperCase();
            colors.add(hex);
          }
        }
      }
      if (n.strokes) {
        for (const stroke of n.strokes) {
          if (stroke.type === 'SOLID' && stroke.color) {
            const { r, g, b } = stroke.color;
            const hex = `#${Math.round(r*255).toString(16).padStart(2,'0')}${Math.round(g*255).toString(16).padStart(2,'0')}${Math.round(b*255).toString(16).padStart(2,'0')}`.toUpperCase();
            colors.add(hex);
          }
        }
      }
      if (n.children) {
        for (const child of n.children) {
          extractColors(child);
        }
      }
    }
    extractColors(node);
    console.log(`\n🎨 Colors Found (${colors.size}):`);
    Array.from(colors).slice(0, 10).forEach(c => console.log(`   ${c}`));
    if (colors.size > 10) {
      console.log(`   ... and ${colors.size - 10} more`);
    }

    // Extract typography
    const fonts = new Set<string>();
    const fontSizes = new Set<number>();
    function extractTypography(n: any) {
      if (n.type === 'TEXT' && n.style) {
        fonts.add(n.style.fontFamily);
        fontSizes.add(n.style.fontSize);
      }
      if (n.children) {
        for (const child of n.children) {
          extractTypography(child);
        }
      }
    }
    extractTypography(node);
    console.log(`\n📝 Typography:`);
    console.log(`   Fonts: ${Array.from(fonts).join(', ') || 'none'}`);
    console.log(`   Sizes: ${Array.from(fontSizes).sort((a,b) => a-b).join(', ') || 'none'}`);

    // Save full extraction to file
    const outputPath = path.join(__dirname, '../extracted-button.json');
    fs.writeFileSync(outputPath, JSON.stringify(node, null, 2));
    console.log(`\n💾 Full extraction saved to: ${outputPath}`);

    console.log('\n✅ Deep extraction complete!');
    console.log('\n📌 To use the deep-extract API:');
    console.log(`   GET /api/figma/deep-extract/${FILE_KEY}/${nodeId}`);

  } catch (error) {
    console.error('❌ Extraction error:', error);
  }
}

// Run
main();
