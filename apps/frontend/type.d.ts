// AUTH
interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
}


// FIGMA 
interface TreeNode {
    id: string;
    name: string;
    type: string;
    children?: TreeNode[];
}

interface RecentFile {
    fileKey: string;
    fileUrl: string;
    fileName: string;
    lastOpened: number;
}

interface FigmaState {
    fileTree: TreeNode | null;
    currentFileKey: string | null;
    currentFileUrl: string | null;
    selectedFile: string | null;
    selectedPage: string | null;
    selectedComponent: string | null;
    componentData: any | null;
    instanceData: any | null;
    expandedNodes: string[];
    recentFiles: RecentFile[];
    loading: boolean;
    error: string | null;
}