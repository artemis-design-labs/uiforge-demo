import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface RecentFile {
    fileKey: string;
    fileUrl: string;
    fileName: string;
    lastOpened: number; // timestamp
}

interface TreeNode {
    id: string;
    name: string;
    type: string;
    children?: TreeNode[];
}

// Figma component property definition
interface FigmaComponentProperty {
    name: string;
    type: 'BOOLEAN' | 'VARIANT' | 'TEXT';
    value: boolean | string;
    options?: string[]; // For VARIANT type
}

interface FigmaState {
    fileTree: TreeNode | null;
    currentFileKey: string | null;
    currentFileUrl: string | null;
    selectedFile: string | null;
    selectedPage: string | null;
    selectedComponent: string | null;
    selectedComponentName: string | null;
    selectedComponentType: string | null;
    selectedVariantId: string | null;
    componentData: any;
    instanceData: any;
    expandedNodes: string[];
    recentFiles: RecentFile[];
    loading: boolean;
    error: string | null;
    // Figma component properties for the currently selected component
    figmaComponentProps: Record<string, FigmaComponentProperty>;
}

const initialState: FigmaState = {
    fileTree: null,
    currentFileKey: null,
    currentFileUrl: null,
    selectedFile: null,
    selectedPage: null,
    selectedComponent: null,
    selectedComponentName: null,
    selectedComponentType: null,
    selectedVariantId: null, // For displaying specific variant from COMPONENT_SET
    componentData: null,
    instanceData: null,
    expandedNodes: [],
    recentFiles: [],
    loading: false,
    error: null,
    figmaComponentProps: {},
};

const figmaSlice = createSlice({
    name: 'figma',
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        setFileTree: (state, action: PayloadAction<TreeNode>) => {
            state.fileTree = action.payload;
        },
        setCurrentFileKey: (state, action: PayloadAction<string>) => {
            state.currentFileKey = action.payload;
        },
        setCurrentFileUrl: (state, action: PayloadAction<string>) => {
            state.currentFileUrl = action.payload;
        },
        setSelectedFile: (state, action: PayloadAction<string>) => {
            state.selectedFile = action.payload;
            // Clear downstream selections
            state.selectedPage = null;
            state.selectedComponent = null;
            state.componentData = null;
        },
        setSelectedPage: (state, action: PayloadAction<string>) => {
            state.selectedPage = action.payload;
            // Clear component selection
            state.selectedComponent = null;
            state.componentData = null;
        },
        setSelectedComponent: (state, action: PayloadAction<string | { id: string; name: string; type: string }>) => {
            if (typeof action.payload === 'string') {
                state.selectedComponent = action.payload;
            } else {
                state.selectedComponent = action.payload.id;
                state.selectedComponentName = action.payload.name;
                state.selectedComponentType = action.payload.type;
            }
            state.selectedVariantId = null; // Reset variant when component changes
        },
        setSelectedVariantId: (state, action: PayloadAction<string | null>) => {
            state.selectedVariantId = action.payload;
        },
        setComponentData: (state, action: PayloadAction<any>) => {
            state.componentData = action.payload;
        },
        setInstanceData: (state, action: PayloadAction<any>) => {
            state.instanceData = action.payload;
        },
        clearSelections: (state) => {
            state.selectedFile = null;
            state.selectedPage = null;
            state.selectedComponent = null;
            state.componentData = null;
            state.instanceData = null;
        },
        setExpandedNodes: (state, action: PayloadAction<string[]>) => {
            state.expandedNodes = action.payload;
        },
        toggleNodeExpansion: (state, action: PayloadAction<string>) => {
            const nodeId = action.payload;
            const index = state.expandedNodes.indexOf(nodeId);
            if (index > -1) {
                state.expandedNodes.splice(index, 1);
            } else {
                state.expandedNodes.push(nodeId);
            }
        },
        addRecentFile: (state, action: PayloadAction<RecentFile>) => {
            const newFile = action.payload;
            // Remove existing entry if present
            state.recentFiles = state.recentFiles.filter(f => f.fileKey !== newFile.fileKey);
            // Add to beginning
            state.recentFiles.unshift(newFile);
            // Keep only 5 most recent
            if (state.recentFiles.length > 5) {
                state.recentFiles = state.recentFiles.slice(0, 5);
            }
        },
        setRecentFiles: (state, action: PayloadAction<RecentFile[]>) => {
            state.recentFiles = action.payload.slice(0, 5);
        },
        // Figma component properties actions
        setFigmaComponentProps: (state, action: PayloadAction<Record<string, FigmaComponentProperty>>) => {
            state.figmaComponentProps = action.payload;
        },
        updateFigmaComponentProp: (state, action: PayloadAction<{ name: string; value: boolean | string }>) => {
            const { name, value } = action.payload;
            if (state.figmaComponentProps[name]) {
                state.figmaComponentProps[name].value = value;
            }
        },
        clearFigmaComponentProps: (state) => {
            state.figmaComponentProps = {};
        },
    },
});

export const {
    setLoading,
    setError,
    clearError,
    setFileTree,
    setCurrentFileKey,
    setCurrentFileUrl,
    setSelectedFile,
    setSelectedPage,
    setSelectedComponent,
    setSelectedVariantId,
    setComponentData,
    setInstanceData,
    clearSelections,
    setExpandedNodes,
    toggleNodeExpansion,
    addRecentFile,
    setRecentFiles,
    setFigmaComponentProps,
    updateFigmaComponentProp,
    clearFigmaComponentProps,
} = figmaSlice.actions;

export default figmaSlice.reducer;