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

        // Generate the zip buffer
        const zipBuffer = await zip.generateAsync({
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 },
        });

        // Return the zip file
        return new NextResponse(zipBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${config.packageName.replace('@', '').replace('/', '-')}-${config.version}.zip"`,
                'Content-Length': zipBuffer.length.toString(),
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
