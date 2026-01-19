import { NextRequest, NextResponse } from 'next/server';

interface ComponentPropertyDefinition {
    type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
    defaultValue: boolean | string;
    variantOptions?: string[];
    preferredValues?: Array<{ type: string; key: string }>;
}

interface FigmaNode {
    id: string;
    name: string;
    type: string;
    componentPropertyDefinitions?: Record<string, ComponentPropertyDefinition>;
    children?: FigmaNode[];
    componentProperties?: Record<string, { value: string | boolean; type: string }>;
}

interface FigmaNodesResponse {
    nodes: Record<string, { document: FigmaNode }>;
}

// Recursively find component property definitions from a node and its ancestors
function extractComponentProperties(node: FigmaNode): Record<string, ComponentPropertyDefinition> {
    let properties: Record<string, ComponentPropertyDefinition> = {};

    // Get properties from this node if it's a component set
    if (node.componentPropertyDefinitions) {
        properties = { ...node.componentPropertyDefinitions };
    }

    return properties;
}

// Get the parent component set for an instance to find variant properties
async function getComponentSetProperties(
    fileKey: string,
    node: FigmaNode,
    figmaToken: string
): Promise<Record<string, ComponentPropertyDefinition>> {
    // If node has componentProperties, it means it's an instance with variant values
    // We need to find the parent COMPONENT_SET to get all variant options

    // For instances, try to get properties from the component set they belong to
    // The name format is usually "ComponentName/VariantValue"
    const nameParts = node.name.split('/');
    if (nameParts.length >= 1) {
        // Search for the component set in the file
        // This is a simplified approach - in production, you'd want to cache this
        const fileResponse = await fetch(
            `https://api.figma.com/v1/files/${fileKey}?depth=2`,
            {
                headers: { 'Authorization': `Bearer ${figmaToken}` },
            }
        );

        if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            const componentSets = findComponentSets(fileData.document);

            // Find matching component set by name prefix
            const baseComponentName = nameParts[0];
            for (const cs of componentSets) {
                if (cs.name === baseComponentName || cs.name.startsWith(baseComponentName)) {
                    if (cs.componentPropertyDefinitions) {
                        return cs.componentPropertyDefinitions;
                    }
                }
            }
        }
    }

    return {};
}

// Recursively find all COMPONENT_SET nodes in the document
function findComponentSets(node: any): any[] {
    const sets: any[] = [];

    if (node.type === 'COMPONENT_SET') {
        sets.push(node);
    }

    if (node.children) {
        for (const child of node.children) {
            sets.push(...findComponentSets(child));
        }
    }

    return sets;
}

// Fetch component properties from Figma API
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fileKey: string; nodeId: string }> }
) {
    try {
        const { fileKey, nodeId } = await params;

        const figmaToken = process.env.FIGMA_ACCESS_TOKEN;
        if (!figmaToken) {
            return NextResponse.json(
                { error: 'Figma access token not configured' },
                { status: 500 }
            );
        }

        console.log(`[Figma Component API] Fetching properties for node ${nodeId} in file ${fileKey}`);

        // Fetch the specific node data from Figma
        const response = await fetch(
            `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`,
            {
                headers: {
                    'Authorization': `Bearer ${figmaToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Figma Component API] Error:', response.status, errorData);
            return NextResponse.json(
                { error: errorData.message || 'Failed to fetch component data' },
                { status: response.status }
            );
        }

        const data: FigmaNodesResponse = await response.json();
        const nodeData = data.nodes[nodeId];

        if (!nodeData || !nodeData.document) {
            return NextResponse.json(
                { error: 'Node not found' },
                { status: 404 }
            );
        }

        const node = nodeData.document;
        let properties = extractComponentProperties(node);

        // If this is a COMPONENT or INSTANCE and doesn't have its own property definitions,
        // try to get properties from the parent component set
        if (
            (node.type === 'COMPONENT' || node.type === 'INSTANCE') &&
            Object.keys(properties).length === 0
        ) {
            properties = await getComponentSetProperties(fileKey, node, figmaToken);
        }

        // Also check for nested component properties (instance swap, etc.)
        // These are stored in componentProperties on instances
        const instanceProperties = node.componentProperties || {};

        // Convert to a standardized format for the frontend
        const formattedProperties: Record<string, {
            name: string;
            type: 'BOOLEAN' | 'VARIANT' | 'TEXT' | 'INSTANCE_SWAP';
            value: boolean | string;
            options?: string[];
            defaultValue: boolean | string;
        }> = {};

        // Add component property definitions
        for (const [key, prop] of Object.entries(properties)) {
            const cleanKey = key.replace(/#\d+:\d+$/, ''); // Remove Figma ID suffix if present
            formattedProperties[cleanKey] = {
                name: cleanKey,
                type: prop.type === 'INSTANCE_SWAP' ? 'INSTANCE_SWAP' : prop.type,
                value: prop.defaultValue,
                options: prop.variantOptions,
                defaultValue: prop.defaultValue,
            };
        }

        // Override with current instance property values if available
        for (const [key, prop] of Object.entries(instanceProperties)) {
            const cleanKey = key.replace(/#\d+:\d+$/, '');
            if (formattedProperties[cleanKey]) {
                formattedProperties[cleanKey].value = prop.value;
            } else {
                // Add instance-specific properties that weren't in the definitions
                formattedProperties[cleanKey] = {
                    name: cleanKey,
                    type: prop.type as 'BOOLEAN' | 'VARIANT' | 'TEXT' | 'INSTANCE_SWAP',
                    value: prop.value,
                    defaultValue: prop.value,
                };
            }
        }

        console.log(`[Figma Component API] Found ${Object.keys(formattedProperties).length} properties for ${node.name}`);

        return NextResponse.json({
            nodeId,
            nodeName: node.name,
            nodeType: node.type,
            properties: formattedProperties,
        });
    } catch (error) {
        console.error('[Figma Component API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
