'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedFile, setSelectedPage, setSelectedComponent, setError, clearError, setLoading, setFileTree, setCurrentFileKey, setCurrentFileUrl, setInstanceData, toggleNodeExpansion, setExpandedNodes, addRecentFile } from '@/store/figmaSlice';
import { figmaService } from '@/services/figma';
import { activityLogger } from '@/services/activityLogger';
import { RecentFilesPanel } from './RecentFilesPanel';

// Page filter - set to null to show all pages, or provide an array of page names to filter
// Example: ['Button', 'Accordion', 'Alert'] - only shows pages containing these names
const ALLOWED_PAGES: string[] | null = null; // Show all pages

// Helper function to find top-level components in a tree
// Stops recursion once a component is found (doesn't look inside components)
function findComponents(node: any): any[] {
    const components: any[] = [];

    // If this node is a component, add it and DON'T recurse into its children
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'COMPONENT_SET') {
        components.push(node);
        return components; // Stop here - don't look inside components
    }

    // Otherwise, recurse into children to find components
    if (node.children && node.children.length > 0) {
        for (const child of node.children) {
            components.push(...findComponents(child));
        }
    }

    return components;
}

interface ComponentItemProps {
    node: {
        id: string;
        name: string;
        type: string;
    };
    onSelect: (nodeId: string, nodeType: string, nodeName: string) => void;
    isSelected: boolean;
}

function ComponentItem({ node, onSelect, isSelected }: ComponentItemProps) {
    return (
        <div
            className={`flex items-center py-2 px-4 cursor-pointer hover:bg-accent transition-colors ${
                isSelected ? 'bg-accent text-accent-foreground' : ''
            }`}
            onClick={() => onSelect(node.id, node.type, node.name)}
        >
            <span className="mr-2 text-xs">
                {node.type === 'COMPONENT' && '🧩'}
                {node.type === 'INSTANCE' && '📦'}
                {node.type === 'COMPONENT_SET' && '🗂️'}
            </span>
            <span className="text-sm truncate">{node.name}</span>
        </div>
    );
}

interface PageAccordionProps {
    page: {
        id: string;
        name: string;
        type: string;
        children?: any[];
    };
    isExpanded: boolean;
    onToggle: () => void;
    onSelectComponent: (nodeId: string, nodeType: string, nodeName: string) => void;
    selectedComponentId: string | null;
}

function PageAccordion({ page, isExpanded, onToggle, onSelectComponent, selectedComponentId }: PageAccordionProps) {
    const components = findComponents(page);

    return (
        <div className="border-b border-border">
            {/* Page header */}
            <div
                className="flex items-center py-3 px-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={onToggle}
            >
                <span className="mr-2 text-xs text-muted-foreground">
                    {isExpanded ? '▼' : '▶'}
                </span>
                <span className="mr-2">🎨</span>
                <span className="text-sm font-medium flex-1">{page.name}</span>
                <span className="text-xs text-muted-foreground">
                    {components.length} component{components.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Components list */}
            {isExpanded && (
                <div className="bg-muted/30">
                    {components.length > 0 ? (
                        components.map((component) => (
                            <ComponentItem
                                key={component.id}
                                node={component}
                                onSelect={onSelectComponent}
                                isSelected={selectedComponentId === component.id}
                            />
                        ))
                    ) : (
                        <div className="py-3 px-4 text-sm text-muted-foreground italic">
                            No components found
                        </div>
                    )}
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
    const [expandedPageIds, setExpandedPageIds] = useState<string[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Vertical resize state for header section
    const [headerHeight, setHeaderHeight] = useState<number | null>(null); // null = auto height
    const isResizingVertical = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const startVerticalResize = useCallback((e: React.MouseEvent) => {
        isResizingVertical.current = true;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    }, []);

    const stopVerticalResize = useCallback(() => {
        isResizingVertical.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    const handleVerticalResize = useCallback((e: MouseEvent) => {
        if (!isResizingVertical.current || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newHeight = e.clientY - containerRect.top;

        // Constrain height between min and max values
        const minHeight = 100; // Minimum header height
        const maxHeight = containerRect.height - 150; // Leave at least 150px for tree view

        setHeaderHeight(Math.min(Math.max(newHeight, minHeight), maxHeight));
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleVerticalResize);
        window.addEventListener('mouseup', stopVerticalResize);
        return () => {
            window.removeEventListener('mousemove', handleVerticalResize);
            window.removeEventListener('mouseup', stopVerticalResize);
        };
    }, [handleVerticalResize, stopVerticalResize]);

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

    // Toggle page accordion expansion
    const togglePageExpansion = (pageId: string) => {
        setExpandedPageIds(prev =>
            prev.includes(pageId)
                ? prev.filter(id => id !== pageId)
                : [...prev, pageId]
        );
    };

    // Get pages from the file tree
    // If ALLOWED_PAGES is null, shows all pages
    // If ALLOWED_PAGES is an array, filters to pages matching those names (case-insensitive)
    const getPages = (): any[] => {
        if (!fileTree || !fileTree.children) return [];
        return fileTree.children.filter((child: any) => {
            if (child.type !== 'CANVAS') return false;
            // If no filter, show all pages
            if (!ALLOWED_PAGES) return true;
            // Otherwise filter by allowed names
            const pageName = child.name.toLowerCase();
            return ALLOWED_PAGES.some(allowed =>
                pageName.includes(allowed.toLowerCase()) ||
                allowed.toLowerCase().includes(pageName)
            );
        });
    };

    // Filter pages based on search query
    const filterPages = (pages: any[], query: string): any[] => {
        if (!query) return pages;
        const regex = new RegExp(query, 'i');

        return pages.filter(page => {
            // Match page name
            if (regex.test(page.name)) return true;
            // Match any component within the page
            const components = findComponents(page);
            return components.some(c => regex.test(c.name));
        });
    };

    const handleNodeSelect = (nodeId: string, nodeType: string, nodeName: string) => {
        console.log('🔵 FigmaTreeView: handleNodeSelect called', { nodeId, nodeType, nodeName, currentFileKey });

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
                console.log('🧩 Selected COMPONENT:', nodeId, nodeName);
                dispatch(setSelectedComponent({ id: nodeId, name: nodeName, type: nodeType }));
                // Skip API call for demo - component will render based on name
                break;
            case 'INSTANCE':
                console.log('🎯 Selected INSTANCE:', nodeId, nodeName);
                dispatch(setSelectedComponent({ id: nodeId, name: nodeName, type: nodeType }));
                // Skip API call for demo - component will render based on name
                break;
            case 'COMPONENT_SET':
                console.log('🗂️ Selected COMPONENT_SET:', nodeId, nodeName);
                dispatch(setSelectedComponent({ id: nodeId, name: nodeName, type: nodeType }));
                // Skip API call for demo - component will render based on name
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

            // Extract all CANVAS pages and auto-expand first one
            const pages = res.tree.children?.filter((c: any) => c.type === 'CANVAS') || [];
            if (pages.length > 0) {
                setExpandedPageIds([pages[0].id]);
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

    // Refresh file - clear cache and reload
    const handleRefresh = () => {
        if (!currentFileUrl) return;

        setRefreshing(true);
        dispatch(setError(''));

        figmaService.clearCacheAndReload(currentFileUrl)
            .then((res) => {
                console.log('Cache cleared and file reloaded:', res);
                dispatch(setFileTree(res.tree));
                setNodeObj(res);

                // Extract all CANVAS pages and auto-expand first one
                const pages = res.tree.children?.filter((c: any) => c.type === 'CANVAS') || [];
                if (pages.length > 0) {
                    setExpandedPageIds([pages[0].id]);
                }

                // Log file refresh
                if (currentFileKey) {
                    activityLogger.logFileOpened(currentFileKey, currentFileUrl);
                }
            })
            .catch((err) => {
                dispatch(setError(err.response?.data?.message || err.message || 'Failed to refresh file'));
                console.error('Error refreshing file:', err);
            })
            .finally(() => {
                setRefreshing(false);
            });
    };

    // Get pages and filter by search
    const allPages = getPages();
    const filteredPages = filterPages(allPages, searchQuery);

    return (
        <div ref={containerRef} className="h-full flex flex-col">
            {/* Resizable Header Section */}
            <div
                ref={headerRef}
                className="flex flex-col shrink-0 overflow-auto"
                style={headerHeight ? { height: `${headerHeight}px` } : {}}
            >
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
                        <div className="flex gap-2">
                            <button
                                className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                onClick={loadFileFileByUrl}
                                disabled={loading || refreshing}
                            >
                                {loading && (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                    </svg>
                                )}
                                {loading ? 'Loading...' : 'Load File'}
                            </button>
                            {fileTree && (
                                <button
                                    className="px-3 py-2 border border-input bg-background rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    onClick={handleRefresh}
                                    disabled={loading || refreshing}
                                    title="Clear cache and reload latest version"
                                >
                                    {refreshing ? (
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                        </svg>
                                    ) : (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>
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
                                placeholder="Search pages or components..."
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
            </div>

            {/* Vertical Resize Handle */}
            <div
                className="h-2 cursor-row-resize bg-border hover:bg-primary/50 active:bg-primary transition-colors flex items-center justify-center shrink-0"
                onMouseDown={startVerticalResize}
                title="Drag to resize"
            >
                <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Pages accordion with components */}
            <div className="flex-1 overflow-auto min-h-0">
                {filteredPages.length > 0 ? (
                    filteredPages.map((page) => (
                        <PageAccordion
                            key={page.id}
                            page={page}
                            isExpanded={expandedPageIds.includes(page.id)}
                            onToggle={() => togglePageExpansion(page.id)}
                            onSelectComponent={handleNodeSelect}
                            selectedComponentId={selectedComponent}
                        />
                    ))
                ) : fileTree && Object.keys(fileTree).length > 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No pages match your search
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