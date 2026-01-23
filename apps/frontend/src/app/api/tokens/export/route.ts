import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import type {
  TokenCollection,
  ExportOptions,
  DesignToken,
} from '@/types/tokens';
import { exportTokens } from '@/services/tokenExporter';

interface ExportRequestBody {
  tokens: TokenCollection;
  config: ExportOptions;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequestBody = await request.json();
    const { tokens, config } = body;

    // Validate request
    if (!tokens || !tokens.tokens || !Array.isArray(tokens.tokens)) {
      return NextResponse.json(
        { error: 'Invalid token collection' },
        { status: 400 }
      );
    }

    if (!config || !config.formats || config.formats.length === 0) {
      return NextResponse.json(
        { error: 'At least one export format is required' },
        { status: 400 }
      );
    }

    console.log(`[Token Export API] Exporting ${tokens.tokens.length} tokens to formats: ${config.formats.join(', ')}`);

    // Generate export files
    const result = exportTokens(tokens, config);

    if (result.files.length === 0) {
      return NextResponse.json(
        { error: 'No files generated. Check if tokens match the selected types.' },
        { status: 400 }
      );
    }

    console.log(`[Token Export API] Generated ${result.files.length} files`);

    // Create zip file
    const zip = new JSZip();

    // Group files by format for better organization
    for (const file of result.files) {
      // Create folder structure by format
      const folderName = formatToFolderName(file.format);
      zip.file(`${folderName}/${file.path}`, file.content);
    }

    // Add a README
    const readme = generateReadme(tokens, config, result);
    zip.file('README.md', readme);

    // Generate zip
    const zipBlob = await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    // Generate filename
    const safeName = tokens.name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const fileName = `${safeName}-tokens.zip`;

    console.log(`[Token Export API] Created ${fileName} (${(zipBlob.byteLength / 1024).toFixed(1)} KB)`);

    // Return zip file
    return new Response(zipBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('[Token Export API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}

function formatToFolderName(format: string): string {
  const folderNames: Record<string, string> = {
    'style-dictionary': 'style-dictionary',
    'w3c-dtcg': 'w3c-dtcg',
    'css': 'css',
    'tailwind': 'tailwind',
    'typescript': 'typescript',
  };
  return folderNames[format] || format;
}

function generateReadme(
  collection: TokenCollection,
  config: ExportOptions,
  result: { files: Array<{ path: string; format: string }>; tokenCount: number; formats: string[] }
): string {
  const lines: string[] = [
    `# ${collection.name} - Design Tokens`,
    '',
    `Generated: ${new Date().toISOString()}`,
    `Total tokens: ${result.tokenCount}`,
    '',
    '## Included Formats',
    '',
  ];

  for (const format of result.formats) {
    lines.push(`### ${formatDisplayName(format)}`);
    lines.push('');

    const formatFiles = result.files.filter(f => f.format === format);
    for (const file of formatFiles) {
      lines.push(`- \`${formatToFolderName(format)}/${file.path}\``);
    }
    lines.push('');
    lines.push(getFormatUsage(format));
    lines.push('');
  }

  lines.push('## Token Types Included');
  lines.push('');
  for (const type of config.includeTypes) {
    lines.push(`- ${type}`);
  }
  lines.push('');

  if (collection.metadata) {
    lines.push('## Source Information');
    lines.push('');
    lines.push(`- Source: ${collection.metadata.source}`);
    if (collection.metadata.fileName) {
      lines.push(`- Original file: ${collection.metadata.fileName}`);
    }
    lines.push(`- Imported: ${collection.metadata.importedAt}`);
  }

  return lines.join('\n');
}

function formatDisplayName(format: string): string {
  const names: Record<string, string> = {
    'style-dictionary': 'Style Dictionary',
    'w3c-dtcg': 'W3C Design Token Community Group (DTCG)',
    'css': 'CSS Custom Properties',
    'tailwind': 'Tailwind CSS',
    'typescript': 'TypeScript',
  };
  return names[format] || format;
}

function getFormatUsage(format: string): string {
  const usage: Record<string, string> = {
    'style-dictionary': `Usage:
\`\`\`bash
npm install style-dictionary
npx style-dictionary build --config config.json
\`\`\``,
    'w3c-dtcg': `Usage:
Import the tokens.json file into any tool that supports W3C DTCG format.`,
    'css': `Usage:
\`\`\`html
<link rel="stylesheet" href="tokens.css">
\`\`\`
Or import in your CSS/SCSS:
\`\`\`css
@import './tokens.css';
\`\`\``,
    'tailwind': `Usage:
\`\`\`javascript
// tailwind.config.js
const tokens = require('./tailwind.tokens.js');
module.exports = {
  theme: {
    extend: tokens.theme.extend,
  },
};
\`\`\``,
    'typescript': `Usage:
\`\`\`typescript
import { theme, colors, spacing } from './theme';

// Use individual tokens
const primary = colors.primary['500'];

// Or use the full theme
const myTheme = theme;
\`\`\``,
  };
  return usage[format] || '';
}
