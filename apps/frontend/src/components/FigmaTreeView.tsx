'use client';
import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedFile, setSelectedPage, setSelectedComponent, setError, clearError, setLoading, setFileTree, setCurrentFileKey, setCurrentFileUrl, setInstanceData, toggleNodeExpansion, setExpandedNodes, addRecentFile } from '@/store/figmaSlice';
import { figmaService } from '@/services/figma';
import { activityLogger } from '@/services/activityLogger';
import { RecentFilesPanel } from './RecentFilesPanel';

interface TreeNodeProps {
    node: {
        id: string;
        name: string;
        type: string;
        children?: any[];
    };
    level: number;
    onSelect: (nodeId: string, nodeType: string) => void;
    expandedNodes: string[];
    onToggleExpand: (nodeId: string) => void;
}

function TreeNode({ node, level, onSelect, expandedNodes, onToggleExpand }: TreeNodeProps) {
    const isExpanded = expandedNodes.includes(node.id);
    const { selectedFile, selectedPage, selectedComponent } = useAppSelector((state) => state.figma);


    const isSelected =
        selectedFile === node.id ||
        selectedPage === node.id ||
        selectedComponent === node.id;

    const handleClick = () => {
        console.log('🖱️ TreeNode clicked:', { id: node.id, type: node.type, name: node.name });
        onSelect(node.id, node.type);
        if (node.children && node.children.length > 0 && node.type !== 'INSTANCE') {
            onToggleExpand(node.id);
        }
    };

    return (
        <div>
            <div
                className={`flex items-center py-2 px-3 cursor-pointer hover:bg-accent transition-colors ${
                    isSelected ? 'bg-accent text-accent-foreground' : ''
                }`}
                style={{ paddingLeft: `${level * 16 + 12}px` }}
                onClick={handleClick}
            >
                {node.children && node.children.length > 0 && node.type !== 'INSTANCE' && (
                    <span className="mr-2 text-xs text-muted-foreground">
                        {isExpanded ? '▼' : '▶'}
                    </span>
                )}
                
                {/* Icon based on node type */}
                <span className="mr-2 text-xs">
                    {node.type === 'COMPONENT' && '🧩'}
                    {node.type === 'INSTANCE' && '📦'}
                    {node.type === 'FRAME' && '🖼️'}
                    {node.type === 'GROUP' && '📁'}
                    {node.type === 'CANVAS' && '🎨'}
                    {node.type === 'DOCUMENT' && '📄'}
                </span>
                
                <span className={`text-xs mr-2 uppercase font-medium ${
                    node.type === 'COMPONENT' || node.type === 'INSTANCE' 
                        ? 'text-blue-600' 
                        : 'text-muted-foreground'
                }`}>
                    {node.type}
                </span>
                <span className="text-sm truncate">{node.name}</span>
            </div>

            {isExpanded && node.children && node.type !== 'INSTANCE' && (
                <div>
                    {node.children.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            expandedNodes={expandedNodes}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FigmaTreeView() {
    const dispatch = useAppDispatch();
    const { fileTree, selectedFile, selectedPage, selectedComponent, loading, currentFileKey, currentFileUrl, expandedNodes } = useAppSelector((state) => state.figma);

    const [url, setURL] = useState(currentFileUrl || '');
    const [nodeObj, setNodeObj] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    // Auto-load last file on mount if exists
    useEffect(() => {
        if (currentFileUrl && !fileTree) {
            setURL(currentFileUrl);
            // Optionally auto-load here
        }
    }, []);

    const handleToggleExpand = (nodeId: string) => {
        dispatch(toggleNodeExpansion(nodeId));

        // Log expansion activity (batched)
        if (currentFileKey) {
            const isExpanded = !expandedNodes.includes(nodeId);
            activityLogger.logNodeExpanded(currentFileKey, nodeId, isExpanded);
        }
    };

    // Log search activity (debounced)
    useEffect(() => {
        if (searchQuery && currentFileKey) {
            const timer = setTimeout(() => {
                activityLogger.logSearch(currentFileKey, searchQuery);
            }, 500); // Debounce 500ms

            return () => clearTimeout(timer);
        }
    }, [searchQuery, currentFileKey]);

    // Filter tree based on search query - only search through currently visible/expanded nodes
    const filterTree = (node: any, query: string): any => {
        if (!query) return node;

        const regex = new RegExp(query, 'i');
        const matchesQuery = regex.test(node.name) || regex.test(node.type);

        // Only recursively filter children if this node is expanded
        let filteredChildren: any[] = [];
        const isNodeExpanded = expandedNodes.includes(node.id);

        if (node.children && node.children.length > 0 && isNodeExpanded) {
            filteredChildren = node.children
                .map((child: any) => filterTree(child, query))
                .filter((child: any) => child !== null);
        }

        // Include this node if it directly matches the query
        if (matchesQuery) {
            return {
                ...node,
                children: node.children
            };
        } else if (node.type === 'DOCUMENT' && filteredChildren.length > 0) {
            // Keep DOCUMENT as root if it has matching children
            return {
                ...node,
                children: filteredChildren
            };
        }

        return null;
    };

    const handleNodeSelect = (nodeId: string, nodeType: string) => {
        console.log('🔵 FigmaTreeView: handleNodeSelect called', { nodeId, nodeType, currentFileKey });

        // Log component selection (batched)
        if (currentFileKey) {
            activityLogger.logComponentSelected(currentFileKey, nodeId, nodeType);
        }

        switch (nodeType) {
            case 'DOCUMENT':
                console.log('📁 Selected DOCUMENT:', nodeId);
                dispatch(setSelectedFile(nodeId));
                break;
            case 'CANVAS':
                console.log('📄 Selected CANVAS:', nodeId);
                dispatch(setSelectedPage(nodeId));
                break;
            case 'COMPONENT':
                console.log('🧩 Selected COMPONENT:', nodeId);
                dispatch(setSelectedComponent(nodeId));
                break;
            case 'INSTANCE':
                console.log('🎯 Selected INSTANCE:', nodeId);
                dispatch(setSelectedComponent(nodeId));
                // Load instance data
                if (currentFileKey) {
                    console.log('📡 Making API call to load instance data...');
                    dispatch(setLoading(true));
                    figmaService.loadInstance(currentFileKey, nodeId)
                        .then((data) => {
                            console.log('✅ Instance data received:', data);
                            dispatch(setInstanceData(data));
                        })
                        .catch((err) => {
                            console.error('❌ Failed to load instance:', err);
                            dispatch(setError(err.message || 'Failed to load instance data'));
                        })
                        .finally(() => {
                            dispatch(setLoading(false));
                        });
                } else {
                    console.warn('⚠️ No currentFileKey available for loading instance');
                }
                break;
            default:
                console.log('❓ Unknown node type:', nodeType);
        }
    };

    const loadFileFileByUrl = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!url) return;

        dispatch(setLoading(true));
        dispatch(setError(''));

        // Extract file key from URL and store it
        const fileKeyMatch = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
        if (!fileKeyMatch) {
            dispatch(setError('Invalid Figma URL'));
            dispatch(setLoading(false));
            return;
        }

        const fileKey = fileKeyMatch[1];
        dispatch(setCurrentFileKey(fileKey));
        dispatch(setCurrentFileUrl(url));

        figmaService.loadFileWithFallback(url).then((res) => {
            console.log(res)

            // Show warning if partial load
            if (res.isPartialLoad) {
                dispatch(setError(res.message));
                // Clear error after 5 seconds since it's just a warning
                setTimeout(() => dispatch(clearError()), 5000);
            }

            dispatch(setFileTree(res.tree));
            setNodeObj(res);

            // Auto-expand the DOCUMENT node when file is loaded
            if (res.tree && res.tree.id) {
                dispatch(setExpandedNodes([res.tree.id]));
            }

            // Add to recent files
            dispatch(addRecentFile({
                fileKey,
                fileUrl: url,
                fileName: res.tree?.name || 'Untitled',
                lastOpened: Date.now(),
            }));

            // Log file opened (critical - real-time)
            activityLogger.logFileOpened(fileKey, url);
        })
            .catch((err) => {
                // Handle document size errors with specific message
                if (err.isDocumentSizeError) {
                    dispatch(setError(err.friendlyMessage));
                    // Log additional details for debugging
                    console.error('Document size error:', {
                        status: err.response?.status,
                        data: err.response?.data,
                        fileUrl: url
                    });
                } else {
                    dispatch(setError(err.response?.data?.message || err.message || 'Failed to load file'));
                    console.error('Error loading file:', err);
                }
            })
            .finally(() => {
                dispatch(setLoading(false));
            })
    }

    // Get filtered tree
    const filteredTree = fileTree && Object.keys(fileTree).length > 0
        ? filterTree(fileTree, searchQuery)
        : null;

    return (
        <div className="h-full flex flex-col">
            {/* Recently Opened Files */}
            <RecentFilesPanel />

            {/* File input */}
            <div className="p-4 border-b border-border">
                <div className="space-y-3">
                    <input
                        value={url}
                        onChange={(e: any) => {
                            setURL(e.target.value)
                        }}
                        type="url"
                        placeholder="Enter Figma file URL..."
                        className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                        className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        onClick={loadFileFileByUrl}
                        disabled={loading}
                    >
                        {loading && (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                        )}
                        {loading ? 'Loading...' : 'Load File'}
                    </button>
                </div>
            </div>

            {/* Search input */}
            {fileTree && Object.keys(fileTree).length > 0 && (
                <div className="p-4 border-b border-border">
                    <div className="relative">
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            type="text"
                            placeholder="Search tree items..."
                            className="w-full px-3 py-2 pr-8 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Clear search"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                >
                                    <line x1="4" y1="4" x2="12" y2="12" />
                                    <line x1="12" y1="4" x2="4" y2="12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Tree view */}
            <div className="flex-1 overflow-auto">
                {filteredTree ? (
                    <TreeNode
                        node={filteredTree}
                        level={0}
                        onSelect={handleNodeSelect}
                        expandedNodes={expandedNodes}
                        onToggleExpand={handleToggleExpand}
                    />
                ) : fileTree && Object.keys(fileTree).length > 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No items match your search
                    </div>
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No file loaded
                    </div>
                )}
            </div>

            {/* Selection display */}
            {(selectedFile || selectedPage || selectedComponent) && (
                <div className="p-4 border-t border-border text-xs text-muted-foreground space-y-1">
                    {selectedFile && <div>File: {selectedFile}</div>}
                    {selectedPage && <div>Page: {selectedPage}</div>}
                    {selectedComponent && <div>Component: {selectedComponent}</div>}
                </div>
            )}
        </div>
    );
}