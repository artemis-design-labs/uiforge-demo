import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import {
    generatePackage,
    type ComponentDefinition,
    type PackageConfig,
} from '@/services/packageGenerator';

interface GeneratePackageRequest {
    components: Record<string, ComponentDefinition>;
    config: PackageConfig;
}

export async function POST(request: NextRequest) {
    try {
        const body: GeneratePackageRequest = await request.json();
        const { components, config } = body;

        if (!components || Object.keys(components).length === 0) {
            return NextResponse.json(
                { error: 'No components provided' },
                { status: 400 }
            );
        }

        if (!config || !config.packageName) {
            return NextResponse.json(
                { error: 'Package configuration is required' },
                { status: 400 }
            );
        }

        // Generate the package
        const generatedPackage = generatePackage(components, config);

        // Create a zip file
        const zip = new JSZip();

        for (const file of generatedPackage.files) {
            zip.file(file.path, file.content);
        }

        // Generate the zip as blob
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 },
        });

        // Convert blob to array buffer for Response
        const arrayBuffer = await zipBlob.arrayBuffer();
        const fileName = `${config.packageName.replace('@', '').replace('/', '-')}-${config.version}.zip`;

        // Return the zip file
        return new Response(arrayBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': arrayBuffer.byteLength.toString(),
            },
        });
    } catch (error) {
        console.error('[Package Generate API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate package' },
            { status: 500 }
        );
    }
}
