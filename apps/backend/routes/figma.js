import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import zlib from 'zlib';
import { promisify } from 'util';
import { User, FigmaFile, FigmaInstance } from './db/mongo/schemas.js';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

const router = express.Router();

// Auth middleware - supports both cookie and Authorization header
const authenticateUser = async (req, res, next) => {
    try {
        // Try cookie first, then Authorization header
        let token = req.cookies.token;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) return res.status(401).json({ error: 'Not authenticated' });

        const decoded = jwt.verify(token, process.env.BAI_JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ error: 'User not found' });

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Extract file key from Figma URL
function extractFileKey(url) {
    const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

// Helper function to calculate object size in bytes
function getObjectSize(obj) {
    const str = JSON.stringify(obj);
    return Buffer.byteLength(str, 'utf8');
}

// MongoDB document size limit (16MB minus some buffer for other fields)
const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024; // 15MB to be safe

// Get file structure
// Use depth parameter to limit tree depth for large files (default: 3)
router.get('/file/:fileKey', authenticateUser, async (req, res) => {
    try {
        const { fileKey } = req.params;
        const { depth = 3 } = req.query; // Default depth of 3 for performance

        // First, check if data exists in MongoDB cache
        const cachedFile = await FigmaFile.findOne({ fileKey });
        
        if (cachedFile) {
            console.log(`Serving cached file data for ${fileKey} (compressed: ${cachedFile.isCompressed})`);
            
            let tree;
            if (cachedFile.isCompressed) {
                // Decompress the data
                const decompressedData = await gunzip(cachedFile.compressedTree);
                tree = JSON.parse(decompressedData.toString());
            } else {
                tree = cachedFile.tree;
            }
            
            return res.status(200).json({ 
                tree, 
                fileName: cachedFile.fileName,
                cached: true,
                cachedAt: cachedFile.cachedAt,
                wasCompressed: cachedFile.isCompressed
            });
        }

        // If not cached, fetch from Figma API
        console.log(`Fetching file data from Figma API for ${fileKey} with depth=${depth}`);
        let response;
        try {
            // Use depth parameter to limit tree depth for large files
            const depthValue = Math.min(Math.max(parseInt(depth), 1), 10); // Clamp between 1 and 10
            response = await axios.get(`https://api.figma.com/v1/files/${fileKey}?depth=${depthValue}`, {
                headers: { 'Authorization': `Bearer ${req.user.figmaToken}` },
                timeout: 120000 // 2 minute timeout
            });
        } catch (apiError) {
            console.error('Figma API error:', apiError.response?.status, apiError.response?.data || apiError.message);
            if (apiError.response?.status === 403) {
                return res.status(403).json({ error: 'Access denied. You may not have permission to view this file.' });
            }
            if (apiError.code === 'ECONNABORTED') {
                return res.status(504).json({ error: 'Request timeout. The file may be too large.' });
            }
            return res.status(apiError.response?.status || 500).json({
                error: apiError.response?.data?.message || 'Failed to fetch file from Figma'
            });
        }

        const tree = buildTreeStructure(response.data.document);
        const fileName = response.data.name;
        const lastModified = new Date(response.data.lastModified);

        // Check document size
        const treeSize = getObjectSize(tree);
        console.log(`File ${fileKey} tree size: ${(treeSize / 1024 / 1024).toFixed(2)}MB`);

        let documentData;
        
        if (treeSize > MAX_DOCUMENT_SIZE) {
            // Compress the data for large files
            console.log(`Compressing large file data for ${fileKey}`);
            const compressedData = await gzip(JSON.stringify(tree));
            
            documentData = {
                fileKey,
                fileName,
                tree: null,
                compressedTree: compressedData,
                isCompressed: true,
                originalSize: treeSize,
                lastModified,
                cachedAt: new Date()
            };
        } else {
            // Store uncompressed for smaller files
            documentData = {
                fileKey,
                fileName,
                tree,
                compressedTree: null,
                isCompressed: false,
                originalSize: treeSize,
                lastModified,
                cachedAt: new Date()
            };
        }

        // Store in MongoDB cache
        await FigmaFile.findOneAndUpdate(
            { fileKey },
            documentData,
            { upsert: true, new: true }
        );

        res.status(200).json({ 
            tree, 
            fileName,
            cached: false,
            lastModified
        });
    } catch (err) {
        console.error('Error in /file endpoint:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get instance data
router.get('/instance/:fileKey/:nodeId', authenticateUser, async (req, res) => {
    try {
        const { fileKey, nodeId } = req.params;

        // First, check if data exists in MongoDB cache
        const cachedInstance = await FigmaInstance.findOne({ fileKey, nodeId });
        
        if (cachedInstance) {
            console.log(`Serving cached instance data for ${fileKey}/${nodeId} (compressed: ${cachedInstance.isCompressed})`);
            
            let data;
            if (cachedInstance.isCompressed) {
                // Decompress the data
                const decompressedData = await gunzip(cachedInstance.compressedData);
                data = JSON.parse(decompressedData.toString());
            } else {
                data = cachedInstance.data;
            }
            
            return res.status(200).json({ 
                nodeId,
                fileKey,
                data,
                lastModified: cachedInstance.lastModified,
                thumbnailUrl: cachedInstance.thumbnailUrl,
                cached: true,
                cachedAt: cachedInstance.cachedAt,
                wasCompressed: cachedInstance.isCompressed
            });
        }

        // If not cached, fetch from Figma API
        console.log(`Fetching instance data from Figma API for ${fileKey}/${nodeId}`);
        const response = await axios.get(`https://api.figma.com/v1/files/${fileKey}/nodes`, {
            headers: { 'Authorization': `Bearer ${req.user.figmaToken}` },
            params: { ids: nodeId }
        });

        const nodeData = response.data.nodes[nodeId];
        if (!nodeData) {
            return res.status(404).json({ error: 'Node not found' });
        }

        const lastModified = new Date(response.data.lastModified);
        const thumbnailUrl = response.data.thumbnailUrl;
        let data = nodeData.document;

        // Process component properties to extract variant options
        if (data.componentProperties) {
            data = await processComponentProperties(data, fileKey, req.user.figmaToken);
        }

        // Check document size
        const dataSize = getObjectSize(data);
        console.log(`Instance ${fileKey}/${nodeId} data size: ${(dataSize / 1024 / 1024).toFixed(2)}MB`);

        let documentData;
        
        if (dataSize > MAX_DOCUMENT_SIZE) {
            // Compress the data for large instances
            console.log(`Compressing large instance data for ${fileKey}/${nodeId}`);
            const compressedData = await gzip(JSON.stringify(data));
            
            documentData = {
                fileKey,
                nodeId,
                data: null,
                compressedData: compressedData,
                isCompressed: true,
                originalSize: dataSize,
                lastModified,
                thumbnailUrl,
                cachedAt: new Date()
            };
        } else {
            // Store uncompressed for smaller instances
            documentData = {
                fileKey,
                nodeId,
                data,
                compressedData: null,
                isCompressed: false,
                originalSize: dataSize,
                lastModified,
                thumbnailUrl,
                cachedAt: new Date()
            };
        }

        // Store in MongoDB cache
        await FigmaInstance.findOneAndUpdate(
            { fileKey, nodeId },
            documentData,
            { upsert: true, new: true }
        );

        res.status(200).json({ 
            nodeId,
            fileKey,
            data,
            lastModified,
            thumbnailUrl,
            cached: false
        });
    } catch (err) {
        console.error('Error in /instance endpoint:', err);
        res.status(500).json({ error: err.message });
    }
});

// Clear cache for a specific file
router.delete('/cache/file/:fileKey', authenticateUser, async (req, res) => {
    try {
        const { fileKey } = req.params;
        
        // Delete file cache
        await FigmaFile.deleteOne({ fileKey });
        // Delete all associated instance caches
        await FigmaInstance.deleteMany({ fileKey });
        
        res.status(200).json({ 
            message: `Cache cleared for file ${fileKey}`,
            fileKey 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear cache for a specific instance
router.delete('/cache/instance/:fileKey/:nodeId', authenticateUser, async (req, res) => {
    try {
        const { fileKey, nodeId } = req.params;
        
        await FigmaInstance.deleteOne({ fileKey, nodeId });
        
        res.status(200).json({ 
            message: `Cache cleared for instance ${fileKey}/${nodeId}`,
            fileKey,
            nodeId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear all cache (admin endpoint)
router.delete('/cache/all', authenticateUser, async (req, res) => {
    try {
        const fileCount = await FigmaFile.countDocuments();
        const instanceCount = await FigmaInstance.countDocuments();
        
        await FigmaFile.deleteMany({});
        await FigmaInstance.deleteMany({});
        
        res.status(200).json({ 
            message: 'All cache cleared',
            deletedFiles: fileCount,
            deletedInstances: instanceCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get cache statistics
router.get('/cache/stats', authenticateUser, async (req, res) => {
    try {
        const fileCount = await FigmaFile.countDocuments();
        const instanceCount = await FigmaInstance.countDocuments();
        
        // Get oldest and newest cache entries
        const oldestFile = await FigmaFile.findOne().sort({ cachedAt: 1 });
        const newestFile = await FigmaFile.findOne().sort({ cachedAt: -1 });
        const oldestInstance = await FigmaInstance.findOne().sort({ cachedAt: 1 });
        const newestInstance = await FigmaInstance.findOne().sort({ cachedAt: -1 });
        
        res.status(200).json({
            files: {
                count: fileCount,
                oldest: oldestFile?.cachedAt,
                newest: newestFile?.cachedAt
            },
            instances: {
                count: instanceCount,
                oldest: oldestInstance?.cachedAt,
                newest: newestInstance?.cachedAt
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Process component properties to extract variant options
async function processComponentProperties(data, fileKey, figmaToken) {
    try {
        // If this is a component instance with a componentId, fetch the component set
        if (data.componentId || data.componentSetId) {
            const componentId = data.componentSetId || data.componentId;

            console.log(`Fetching component set ${componentId} to get variant options`);

            // Fetch the component set/component data
            const componentResponse = await axios.get(`https://api.figma.com/v1/files/${fileKey}/nodes`, {
                headers: { 'Authorization': `Bearer ${figmaToken}` },
                params: { ids: componentId }
            });

            const componentNode = componentResponse.data.nodes[componentId]?.document;

            if (componentNode) {
                // Extract variant options from the component set
                const variantOptions = extractVariantOptions(componentNode);

                // Merge variant options into componentProperties
                if (data.componentProperties && variantOptions) {
                    Object.keys(data.componentProperties).forEach(key => {
                        const prop = data.componentProperties[key];
                        if (prop.type === 'VARIANT' && variantOptions[key]) {
                            prop.variantOptions = variantOptions[key];
                        }
                    });
                }

                console.log(`Processed component properties with variant options:`,
                    Object.keys(variantOptions || {}).length, 'properties');
            }
        }

        return data;
    } catch (error) {
        console.error('Error processing component properties:', error.message);
        return data; // Return original data if processing fails
    }
}

// Extract variant options from component set
function extractVariantOptions(componentNode) {
    const variantOptions = {};

    // If this is a component set, it has children which are the variants
    if (componentNode.type === 'COMPONENT_SET' && componentNode.children) {
        // Each child component represents a variant combination
        // We need to parse the variant property values from component names
        componentNode.children.forEach(variant => {
            // Variant names in Figma are like "Property1=Value1, Property2=Value2"
            if (variant.name) {
                const properties = variant.name.split(',').map(p => p.trim());
                properties.forEach(prop => {
                    const [key, value] = prop.split('=').map(p => p.trim());
                    if (key && value) {
                        if (!variantOptions[key]) {
                            variantOptions[key] = [];
                        }
                        if (!variantOptions[key].includes(value)) {
                            variantOptions[key].push(value);
                        }
                    }
                });
            }
        });
    }

    // Also check if componentProperties are defined at the component level
    if (componentNode.componentPropertyDefinitions) {
        Object.entries(componentNode.componentPropertyDefinitions).forEach(([key, def]) => {
            if (def.type === 'VARIANT' && def.variantOptions) {
                variantOptions[key] = def.variantOptions;
            }
        });
    }

    return variantOptions;
}

// Transform Figma data to tree structure
function buildTreeStructure(node) {
    return {
        id: node.id,
        name: node.name,
        type: node.type,
        children: node.children ? node.children.map(buildTreeStructure) : []
    };
}

// Get rendered image of a component/node
// Used for dynamic component preview in the design page
router.get('/image/:fileKey/:nodeId', authenticateUser, async (req, res) => {
    try {
        const { fileKey, nodeId } = req.params;
        const { scale = 2, format = 'png' } = req.query;

        console.log(`Fetching image for node ${nodeId} in file ${fileKey}`);

        const response = await axios.get(`https://api.figma.com/v1/images/${fileKey}`, {
            headers: { 'Authorization': `Bearer ${req.user.figmaToken}` },
            params: {
                ids: nodeId,
                scale: Math.min(Math.max(parseFloat(scale), 0.5), 4), // Clamp between 0.5 and 4
                format: ['png', 'jpg', 'svg', 'pdf'].includes(format) ? format : 'png'
            },
            timeout: 30000
        });

        const imageUrl = response.data.images?.[nodeId];

        if (!imageUrl) {
            return res.status(404).json({ error: 'Image not found for this node' });
        }

        res.status(200).json({
            nodeId,
            fileKey,
            imageUrl,
            scale,
            format
        });
    } catch (err) {
        console.error('Error fetching image:', err.response?.data || err.message);
        if (err.response?.status === 403) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.status(err.response?.status || 500).json({
            error: err.response?.data?.message || 'Failed to fetch image'
        });
    }
});

// Get all component property definitions from a file
// Returns component sets with their variant properties
router.get('/file-components/:fileKey', authenticateUser, async (req, res) => {
    try {
        const { fileKey } = req.params;

        console.log(`Fetching component properties for file ${fileKey}`);

        // List of component prefixes to include (for performance on large files)
        // Icons are included to support instance swap functionality
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
        const isAllowedComponent = (name) => {
            if (!name) return false;
            const lowerName = name.toLowerCase();
            return ALLOWED_COMPONENT_PREFIXES.some(prefix =>
                lowerName.startsWith(prefix) ||
                lowerName.includes('/' + prefix) ||
                lowerName.includes(prefix + '/')
            );
        };

        // Fetch file with depth=10 to get component sets in deeply nested structures
        const response = await axios.get(`https://api.figma.com/v1/files/${fileKey}?depth=10`, {
            headers: { 'Authorization': `Bearer ${req.user.figmaToken}` },
            timeout: 120000
        });

        const components = {};
        const standaloneComponents = []; // Store standalone components for second pass
        const iconRegistry = {}; // Registry of icons for instance swap

        // PASS 1: Collect all COMPONENT_SETs first (they have the properties)
        function collectComponentSets(node) {
            if (node.type === 'COMPONENT_SET') {
                // Skip components not in allowed list (for performance)
                if (!isAllowedComponent(node.name)) {
                    // Still recurse to find nested allowed components
                    if (node.children) {
                        for (const child of node.children) {
                            collectComponentSets(child);
                        }
                    }
                    return;
                }

                const properties = {};

                // Get properties from componentPropertyDefinitions
                // This should include VARIANT, BOOLEAN, TEXT, and INSTANCE_SWAP properties
                if (node.componentPropertyDefinitions) {
                    console.log(`[${node.name}] componentPropertyDefinitions keys:`, Object.keys(node.componentPropertyDefinitions));

                    for (const [key, prop] of Object.entries(node.componentPropertyDefinitions)) {
                        // Clean the property name (remove Figma ID suffix like #123:456)
                        const cleanKey = key.replace(/#\d+:\d+$/, '');

                        // Build property object based on type
                        const propData = {
                            name: cleanKey,
                            type: prop.type,
                            defaultValue: prop.defaultValue,
                        };

                        // Add type-specific fields
                        if (prop.type === 'VARIANT' && prop.variantOptions) {
                            propData.options = prop.variantOptions;
                        }
                        if (prop.type === 'INSTANCE_SWAP' && prop.preferredValues) {
                            // Include preferred values for instance swap dropdowns
                            propData.preferredValues = prop.preferredValues;
                        }

                        properties[cleanKey] = propData;
                        console.log(`  - ${cleanKey}: ${prop.type}`, prop.type === 'VARIANT' ? `options: ${prop.variantOptions?.join(', ')}` : '');
                    }
                }

                // If no VARIANT properties found in componentPropertyDefinitions,
                // discover them from child component names (e.g., "Size=Large, Color=Primary")
                const hasVariantProps = Object.values(properties).some(p => p.type === 'VARIANT');
                if (!hasVariantProps && node.children) {
                    console.log(`[${node.name}] No VARIANT props in definitions, discovering from child names...`);
                    const discovered = {};
                    for (const child of node.children) {
                        if (child.type === 'COMPONENT' && child.name) {
                            // Parse "Property=Value, Property2=Value2"
                            const parts = child.name.split(',').map(p => p.trim());
                            for (const part of parts) {
                                const [propName, propValue] = part.split('=').map(p => p.trim());
                                if (propName && propValue) {
                                    if (!discovered[propName]) {
                                        discovered[propName] = new Set();
                                    }
                                    discovered[propName].add(propValue);
                                }
                            }
                        }
                    }

                    for (const [propName, values] of Object.entries(discovered)) {
                        const options = Array.from(values);
                        properties[propName] = {
                            name: propName,
                            type: 'VARIANT',
                            defaultValue: options[0],
                            options,
                        };
                        console.log(`  - Discovered ${propName}: VARIANT options: ${options.join(', ')}`);
                    }
                }

                // Store component set by name
                components[node.name] = {
                    nodeId: node.id,
                    name: node.name,
                    type: node.type,
                    properties,
                };

                // Also map children (variant components inside COMPONENT_SET)
                if (node.children) {
                    for (const child of node.children) {
                        if (child.type === 'COMPONENT') {
                            components[child.name] = {
                                nodeId: child.id,
                                name: child.name,
                                type: child.type,
                                properties,
                            };
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
                    iconRegistry[node.id] = {
                        nodeId: node.id,
                        name: node.name,
                        type: node.type,
                    };
                }
            }

            // Recurse
            if (node.children) {
                for (const child of node.children) {
                    collectComponentSets(child);
                }
            }
        }

        // First pass: collect all COMPONENT_SETs
        collectComponentSets(response.data.document);

        console.log(`Pass 1: Found ${Object.keys(components).length} COMPONENT_SET entries`);
        console.log(`Pass 1: Found ${standaloneComponents.length} standalone COMPONENTs to process`);

        // PASS 2: Process standalone components with full inheritance lookup
        for (const node of standaloneComponents) {
            // Skip if already mapped (as child of COMPONENT_SET)
            if (components[node.name]) {
                continue;
            }

            let properties = {};

            // Get properties from componentPropertyDefinitions if available
            if (node.componentPropertyDefinitions) {
                for (const [key, prop] of Object.entries(node.componentPropertyDefinitions)) {
                    const cleanKey = key.replace(/#\d+:\d+$/, '');
                    properties[cleanKey] = {
                        name: cleanKey,
                        type: prop.type,
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
                for (const [existingName, existingComp] of Object.entries(components)) {
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
                            console.log(`Inheritance match: "${node.name}" -> "${existingName}"`);
                            properties = { ...existingComp.properties };
                            break;
                        }
                    }
                }
            }

            components[node.name] = {
                nodeId: node.id,
                name: node.name,
                type: node.type,
                properties,
            };
        }

        console.log(`Found ${Object.keys(components).length} components with properties`);

        console.log(`Found ${Object.keys(iconRegistry).length} icons for instance swap`);

        res.status(200).json({
            fileKey,
            fileName: response.data.name,
            components,
            componentCount: Object.keys(components).length,
            iconRegistry, // Icons available for instance swap
            iconCount: Object.keys(iconRegistry).length,
        });
    } catch (err) {
        console.error('Error fetching file components:', err.response?.data || err.message);
        if (err.response?.status === 403) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.status(err.response?.status || 500).json({
            error: err.response?.data?.message || 'Failed to fetch file components'
        });
    }
});

export default router;