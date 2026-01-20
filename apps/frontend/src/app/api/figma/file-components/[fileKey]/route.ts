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
}

interface ComponentInfo {
    nodeId: string;
    name: string;
    type: string;
    properties: Record<string, {
        name: string;
        type: 'BOOLEAN' | 'VARIANT' | 'TEXT' | 'INSTANCE_SWAP';
        defaultValue: boolean | string;
        options?: string[];
    }>;
}

// Recursively find all COMPONENT_SET nodes and their properties
function findComponentSetsWithProperties(node: FigmaNode, results: Map<string, ComponentInfo> = new Map()): Map<string, ComponentInfo> {
    // Check if this node is a COMPONENT_SET with property definitions
    if (node.type === 'COMPONENT_SET' && node.componentPropertyDefinitions) {
        const properties: ComponentInfo['properties'] = {};

        for (const [key, prop] of Object.entries(node.componentPropertyDefinitions)) {
            // Clean the property name (remove Figma ID suffix like #123:456)
            const cleanKey = key.replace(/#\d+:\d+$/, '');

            properties[cleanKey] = {
                name: cleanKey,
                type: prop.type === 'INSTANCE_SWAP' ? 'INSTANCE_SWAP' : prop.type,
                defaultValue: prop.defaultValue,
                options: prop.variantOptions,
            };
        }

        // Store by component set name for easy lookup
        results.set(node.name, {
            nodeId: node.id,
            name: node.name,
            type: node.type,
            properties,
        });

        // Also index each child component/variant by name
        if (node.children) {
            for (const child of node.children) {
                if (child.type === 'COMPONENT') {
                    // Map child component name to parent properties
                    results.set(child.name, {
                        nodeId: child.id,
                        name: child.name,
                        type: child.type,
                        properties, // Inherit parent's properties
                    });
                }
            }
        }
    }

    // Recurse into children
    if (node.children) {
        for (const child of node.children) {
            findComponentSetsWithProperties(child, results);
        }
    }

    return results;
}

// Also extract properties from variant names (e.g., "Size=Large, State=Enabled")
function parseVariantName(name: string): Record<string, string> {
    const properties: Record<string, string> = {};
    // Match patterns like "Property=Value" separated by comma or space
    const regex = /([^=,\s]+)=([^=,\s]+)/g;
    let match;
    while ((match = regex.exec(name)) !== null) {
        properties[match[1]] = match[2];
    }
    return properties;
}

// Build a comprehensive component map including variant options discovered from component names
function buildComponentMap(node: FigmaNode): Map<string, ComponentInfo> {
    const componentSets = findComponentSetsWithProperties(node);

    // For component sets without explicit componentPropertyDefinitions,
    // try to discover properties from child component names
    const discoverFromChildren = (csNode: FigmaNode) => {
        if (csNode.type !== 'COMPONENT_SET' || !csNode.children) return;
        if (componentSets.has(csNode.name)) return; // Already processed

        const discoveredProps: Record<string, Set<string>> = {};

        for (const child of csNode.children) {
            if (child.type === 'COMPONENT') {
                const parsed = parseVariantName(child.name);
                for (const [propName, propValue] of Object.entries(parsed)) {
                    if (!discoveredProps[propName]) {
                        discoveredProps[propName] = new Set();
                    }
                    discoveredProps[propName].add(propValue);
                }
            }
        }

        if (Object.keys(discoveredProps).length > 0) {
            const properties: ComponentInfo['properties'] = {};
            for (const [propName, values] of Object.entries(discoveredProps)) {
                const options = Array.from(values);
                properties[propName] = {
                    name: propName,
                    type: 'VARIANT',
                    defaultValue: options[0],
                    options,
                };
            }

            componentSets.set(csNode.name, {
                nodeId: csNode.id,
                name: csNode.name,
                type: csNode.type,
                properties,
            });

            // Also map children
            for (const child of csNode.children) {
                if (child.type === 'COMPONENT') {
                    componentSets.set(child.name, {
                        nodeId: child.id,
                        name: child.name,
                        type: child.type,
                        properties,
                    });
                }
            }
        }
    };

    // Second pass: discover from children
    const traverse = (n: FigmaNode) => {
        discoverFromChildren(n);
        if (n.children) {
            for (const child of n.children) {
                traverse(child);
            }
        }
    };
    traverse(node);

    return componentSets;
}

// Fetch all component property definitions from a Figma file
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fileKey: string }> }
) {
    try {
        const { fileKey } = await params;

        // Try user's OAuth token first, fall back to PAT
        const userToken = request.cookies.get('token')?.value;
        let figmaToken = process.env.FIGMA_ACCESS_TOKEN;

        // If user is logged in, proxy through Railway which has user's OAuth token
        if (userToken) {
            try {
                const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://uiforge-demo-production.up.railway.app';

                const fileResponse = await fetch(`${BACKEND_URL}/api/v1/figma/file-components/${fileKey}`, {
                    headers: {
                        'Authorization': `Bearer ${userToken}`,
                    },
                });

                if (fileResponse.ok) {
                    const data = await fileResponse.json();
                    console.log(`[Figma File Components API] Found ${data.componentCount} components via Railway`);
                    return NextResponse.json(data);
                } else {
                    console.log(`[Figma File Components API] Railway returned ${fileResponse.status}, falling back to PAT`);
                }
            } catch (err) {
                console.log('[Figma File Components API] Railway proxy failed, falling back to PAT:', err);
            }
        }

        if (!figmaToken) {
            return NextResponse.json(
                { error: 'Figma access token not configured' },
                { status: 500 }
            );
        }

        console.log(`[Figma File Components API] Fetching component properties for file ${fileKey} using PAT`);

        // Fetch the file with depth to get component sets and their definitions
        const response = await fetch(
            `https://api.figma.com/v1/files/${fileKey}?depth=3`,
            {
                headers: {
                    'Authorization': `Bearer ${figmaToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Figma File Components API] Error:', response.status, errorData);
            return NextResponse.json(
                { error: errorData.message || 'Failed to fetch file data' },
                { status: response.status }
            );
        }

        const data = await response.json();
        const componentMap = buildComponentMap(data.document);

        // Convert Map to object for JSON response
        const components: Record<string, ComponentInfo> = {};
        for (const [name, info] of componentMap.entries()) {
            components[name] = info;
        }

        console.log(`[Figma File Components API] Found ${Object.keys(components).length} components with properties`);

        return NextResponse.json({
            fileKey,
            fileName: data.name,
            components,
            componentCount: Object.keys(components).length,
        });
    } catch (error) {
        console.error('[Figma File Components API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
