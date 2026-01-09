'use client';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentFileUrl, setLoading, setError, clearError, setFileTree, setCurrentFileKey, setExpandedNodes, addRecentFile } from '@/store/figmaSlice';
import { figmaService } from '@/services/figma';
import { activityLogger } from '@/services/activityLogger';

export function RecentFilesPanel() {
    const dispatch = useAppDispatch();
    const { recentFiles, loading } = useAppSelector((state) => state.figma);

    const handleFileClick = async (fileUrl: string, fileKey: string) => {
        dispatch(setLoading(true));
        dispatch(setError(''));
        dispatch(setCurrentFileKey(fileKey));
        dispatch(setCurrentFileUrl(fileUrl));

        try {
            const res = await figmaService.loadFileWithFallback(fileUrl);

            if (res.isPartialLoad) {
                dispatch(setError(res.message));
                setTimeout(() => dispatch(clearError()), 5000);
            }

            dispatch(setFileTree(res.tree));

            // Auto-expand the DOCUMENT node
            if (res.tree && res.tree.id) {
                dispatch(setExpandedNodes([res.tree.id]));
            }

            // Update recent files with new timestamp
            dispatch(addRecentFile({
                fileKey,
                fileUrl,
                fileName: res.tree?.name || 'Untitled',
                lastOpened: Date.now(),
            }));

            // Log file opened (critical - real-time)
            activityLogger.logFileOpened(fileKey, fileUrl);
        } catch (err: any) {
            if (err.isDocumentSizeError) {
                dispatch(setError(err.friendlyMessage));
            } else {
                dispatch(setError(err.response?.data?.message || err.message || 'Failed to load file'));
            }
        } finally {
            dispatch(setLoading(false));
        }
    };

    const formatRelativeTime = (timestamp: number): string => {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    if (!recentFiles || recentFiles.length === 0) {
        return null;
    }

    return (
        <div className="p-4 border-b border-border">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Recently Opened</h4>
            <div className="space-y-1">
                {recentFiles.map((file) => (
                    <button
                        key={file.fileKey}
                        onClick={() => handleFileClick(file.fileUrl, file.fileKey)}
                        disabled={loading}
                        className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="font-medium truncate">{file.fileName}</div>
                        <div className="text-muted-foreground text-[10px]">
                            {formatRelativeTime(file.lastOpened)}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
