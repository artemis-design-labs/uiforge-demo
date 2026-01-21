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
        preferredValues?: Array<{ type: string; key: string }>;
    }>;
}

// Icon registry entry
interface IconEntry {
    nodeId: string;
    name: string;
    type: string;
}

// List of component prefixes to include (for performance on large files)
const ALLOWED_COMPONENT_PREFIXES = [
    'accordion',
    'breadcrumb',
    'button',
    'chip',
    'dropdown',
    'progress',
    'icons',       // For instance swap
    'icon',        // Alternative icon naming
    'checkbox',
    'avatar',
    'card',
    'badge',
];

// Helper to check if a component name matches allowed list
function isAllowedComponent(name: string | null | undefined): boolean {
    if (!name) return false;
    const lowerName = name.toLowerCase();
    return ALLOWED_COMPONENT_PREFIXES.some(prefix =>
        lowerName.startsWith(prefix) ||
        lowerName.includes('/' + prefix) ||
        lowerName.includes(prefix + '/')
    );
}

// PASS 1: Collect all COMPONENT_SETs first (they have the properties)
function collectComponentSets(
    node: FigmaNode,
    results: Map<string, ComponentInfo>,
    standaloneComponents: FigmaNode[],
    iconRegistry: Map<string, IconEntry>
): void {
    if (node.type === 'COMPONENT_SET') {
        // Skip components not in allowed list (for performance)
        if (!isAllowedComponent(node.name)) {
            // Still recurse to find nested allowed components
            if (node.children) {
                for (const child of node.children) {
                    collectComponentSets(child, results, standaloneComponents, iconRegistry);
                }
            }
            return;
        }

        const properties: ComponentInfo['properties'] = {};

        // Extract ALL property types from componentPropertyDefinitions
        // This includes VARIANT, BOOLEAN, TEXT, and INSTANCE_SWAP
        if (node.componentPropertyDefinitions) {
            console.log(`[Frontend][${node.name}] componentPropertyDefinitions keys:`, Object.keys(node.componentPropertyDefinitions));

            for (const [key, prop] of Object.entries(node.componentPropertyDefinitions)) {
                // Clean the property name (remove Figma ID suffix like #123:456)
                const cleanKey = key.replace(/#\d+:\d+$/, '');

                // Build property object based on type
                const propData: ComponentInfo['properties'][string] = {
                    name: cleanKey,
                    type: prop.type === 'INSTANCE_SWAP' ? 'INSTANCE_SWAP' : prop.type,
                    defaultValue: prop.defaultValue,
                };

                // Add type-specific fields
                if (prop.type === 'VARIANT' && prop.variantOptions) {
                    propData.options = prop.variantOptions;
                }
                if (prop.type === 'INSTANCE_SWAP' && prop.preferredValues) {
                    // Store preferred values for instance swap (will need UI support)
                    (propData as any).preferredValues = prop.preferredValues;
                }

                properties[cleanKey] = propData;
                console.log(`[Frontend]  - ${cleanKey}: ${prop.type}`);
            }
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
    // Collect standalone COMPONENT nodes for second pass
    else if (node.type === 'COMPONENT') {
        // Only collect if in allowed list
        if (isAllowedComponent(node.name)) {
            standaloneComponents.push(node);
        }

        // Build icon registry for instance swap support
        const lowerName = node.name.toLowerCase();
        if (lowerName.startsWith('icon') || lowerName.includes('/icon')) {
            iconRegistry.set(node.id, {
                nodeId: node.id,
                name: node.name,
                type: node.type,
            });
        }
    }

    // Recurse into children
    if (node.children) {
        for (const child of node.children) {
            collectComponentSets(child, results, standaloneComponents, iconRegistry);
        }
    }
}

// PASS 2: Process standalone components with full inheritance lookup
function processStandaloneComponents(
    standaloneComponents: FigmaNode[],
    results: Map<string, ComponentInfo>
): void {
    for (const node of standaloneComponents) {
        // Skip if already mapped (as child of COMPONENT_SET)
        if (results.has(node.name)) {
            continue;
        }

        let properties: ComponentInfo['properties'] = {};

        // Extract properties from componentPropertyDefinitions if available
        if (node.componentPropertyDefinitions) {
            for (const [key, prop] of Object.entries(node.componentPropertyDefinitions)) {
                const cleanKey = key.replace(/#\d+:\d+$/, '');
                properties[cleanKey] = {
                    name: cleanKey,
                    type: prop.type === 'INSTANCE_SWAP' ? 'INSTANCE_SWAP' : prop.type,
                    defaultValue: prop.defaultValue,
                    options: prop.variantOptions,
                };
            }
        }

        // If no properties found, try to find a related COMPONENT_SET
        // Now we have ALL component sets collected, so inheritance will work
        if (Object.keys(properties).length === 0) {
            const baseName = node.name.split('/')[0];
            const baseNameLower = baseName.toLowerCase();

            // Try multiple matching strategies
            for (const [existingName, existingComp] of results.entries()) {
                if (existingComp.type === 'COMPONENT_SET' &&
                    Object.keys(existingComp.properties).length > 0) {
                    const existingBase = existingName.split('/')[0];
                    const existingBaseLower = existingBase.toLowerCase();
                    const existingBaseNoVariant = existingBaseLower.replace('variant', '');

                    // Match strategies:
                    // 1. "ButtonVariant" contains "Button"
                    // 2. "Button" contains "Button" (after removing "Variant")
                    // 3. Base names match exactly (case-insensitive)
                    // 4. One is a prefix of the other (e.g., "Checkbox" ~ "CheckboxItem")
                    if (existingBaseLower.includes(baseNameLower) ||
                        baseNameLower.includes(existingBaseNoVariant) ||
                        existingBaseLower === baseNameLower ||
                        baseNameLower.startsWith(existingBaseNoVariant) ||
                        existingBaseNoVariant.startsWith(baseNameLower)) {
                        console.log(`[Frontend] Inheritance match: "${node.name}" -> "${existingName}"`);
                        properties = { ...existingComp.properties };
                        break;
                    }
                }
            }
        }

        results.set(node.name, {
            nodeId: node.id,
            name: node.name,
            type: node.type,
            properties,
        });
    }
}

// Result type for component discovery
interface ComponentSetsResult {
    components: Map<string, ComponentInfo>;
    iconRegistry: Map<string, IconEntry>;
}

// Two-pass component discovery
function findComponentSetsWithProperties(node: FigmaNode): ComponentSetsResult {
    const results = new Map<string, ComponentInfo>();
    const standaloneComponents: FigmaNode[] = [];
    const iconRegistry = new Map<string, IconEntry>();

    // Pass 1: Collect all COMPONENT_SETs
    collectComponentSets(node, results, standaloneComponents, iconRegistry);

    console.log(`[Frontend] Pass 1: Found ${results.size} COMPONENT_SET entries`);
    console.log(`[Frontend] Pass 1: Found ${standaloneComponents.length} standalone COMPONENTs to process`);
    console.log(`[Frontend] Pass 1: Found ${iconRegistry.size} icons for instance swap`);

    // Pass 2: Process standalone components with full inheritance
    processStandaloneComponents(standaloneComponents, results);

    return { components: results, iconRegistry };
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

// Result type for buildComponentMap
interface BuildResult {
    components: Map<string, ComponentInfo>;
    iconRegistry: Map<string, IconEntry>;
}

// Build a comprehensive component map including variant options discovered from component names
function buildComponentMap(node: FigmaNode): BuildResult {
    // Use the two-pass approach that collects all COMPONENT_SETs first
    const { components: componentSets, iconRegistry } = findComponentSetsWithProperties(node);

    // Additional pass: For component sets without explicit componentPropertyDefinitions,
    // try to discover properties from child component names
    const discoverFromChildren = (csNode: FigmaNode) => {
        if (csNode.type !== 'COMPONENT_SET' || !csNode.children) return;

        // Check if this COMPONENT_SET already has properties
        const existing = componentSets.get(csNode.name);
        if (existing && Object.keys(existing.properties).length > 0) return;

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

    // Third pass: discover from children for COMPONENT_SETs without explicit properties
    const traverse = (n: FigmaNode) => {
        discoverFromChildren(n);
        if (n.children) {
            for (const child of n.children) {
                traverse(child);
            }
        }
    };
    traverse(node);

    return { components: componentSets, iconRegistry };
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
                    cache: 'no-store', // Always fetch fresh data
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
        // Using depth=10 to ensure we capture components in deeply nested structures
        const response = await fetch(
            `https://api.figma.com/v1/files/${fileKey}?depth=10`,
            {
                headers: {
                    'Authorization': `Bearer ${figmaToken}`,
                },
                cache: 'no-store', // Always fetch fresh data
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
        const { components: componentMap, iconRegistry: iconMap } = buildComponentMap(data.document);

        // Convert Maps to objects for JSON response
        const components: Record<string, ComponentInfo> = {};
        for (const [name, info] of componentMap.entries()) {
            components[name] = info;
        }

        const iconRegistry: Record<string, IconEntry> = {};
        for (const [id, entry] of iconMap.entries()) {
            iconRegistry[id] = entry;
        }

        console.log(`[Figma File Components API] Found ${Object.keys(components).length} components with properties`);
        console.log(`[Figma File Components API] Found ${Object.keys(iconRegistry).length} icons for instance swap`);

        return NextResponse.json({
            fileKey,
            fileName: data.name,
            components,
            componentCount: Object.keys(components).length,
            iconRegistry,
            iconCount: Object.keys(iconRegistry).length,
        });
    } catch (error) {
        console.error('[Figma File Components API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
