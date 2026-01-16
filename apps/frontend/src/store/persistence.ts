import { Middleware } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Define state shape locally to avoid circular import with index.ts
interface PersistedFigmaState {
    currentFileKey: string | null;
    currentFileUrl: string | null;
    selectedFile: unknown;
    selectedPage: unknown;
    selectedComponent: unknown;
    expandedNodes: string[];
    recentFiles: unknown[];
    loading?: boolean;
    error?: string | null;
}

interface AppState {
    figma: PersistedFigmaState;
    auth: unknown;
    layout: unknown;
}

// Keys for localStorage
const STORAGE_KEYS = {
    FIGMA_STATE: 'uiforge_figma_state',
    RECENT_FILES: 'uiforge_recent_files',
};

// Debounce timer for backend sync
let syncTimer: NodeJS.Timeout | null = null;
const SYNC_DELAY = 30000; // 30 seconds

/**
 * Load persisted state from localStorage
 */
export function loadPersistedState(): Partial<AppState> | undefined {
    if (typeof window === 'undefined') return undefined;

    try {
        const figmaStateJSON = localStorage.getItem(STORAGE_KEYS.FIGMA_STATE);
        const recentFilesJSON = localStorage.getItem(STORAGE_KEYS.RECENT_FILES);

        const persistedState: Partial<AppState> = {};

        if (figmaStateJSON) {
            const figmaState = JSON.parse(figmaStateJSON);
            persistedState.figma = {
                ...figmaState,
                // Don't persist loading/error states
                loading: false,
                error: null,
            };
        }

        if (recentFilesJSON) {
            const recentFiles = JSON.parse(recentFilesJSON);
            if (persistedState.figma) {
                persistedState.figma.recentFiles = recentFiles;
            }
        }

        return persistedState;
    } catch (error) {
        console.error('Failed to load persisted state:', error);
        return undefined;
    }
}

/**
 * Save state to localStorage
 */
function saveToLocalStorage(state: AppState): void {
    if (typeof window === 'undefined') return;

    try {
        const figmaStateToPersist = {
            currentFileKey: state.figma.currentFileKey,
            currentFileUrl: state.figma.currentFileUrl,
            selectedFile: state.figma.selectedFile,
            selectedPage: state.figma.selectedPage,
            selectedComponent: state.figma.selectedComponent,
            expandedNodes: state.figma.expandedNodes,
            // Don't persist fileTree (too large), loading, error
        };

        localStorage.setItem(
            STORAGE_KEYS.FIGMA_STATE,
            JSON.stringify(figmaStateToPersist)
        );

        localStorage.setItem(
            STORAGE_KEYS.RECENT_FILES,
            JSON.stringify(state.figma.recentFiles)
        );
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

/**
 * Sync state to backend (debounced)
 */
function syncToBackend(state: AppState): void {
    if (syncTimer) {
        clearTimeout(syncTimer);
    }

    syncTimer = setTimeout(async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) return;

            await axios.post(
                `${API_URL}/api/user/sync-state`,
                {
                    figmaState: {
                        currentFileKey: state.figma.currentFileKey,
                        currentFileUrl: state.figma.currentFileUrl,
                        expandedNodes: state.figma.expandedNodes,
                        recentFiles: state.figma.recentFiles,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );
        } catch (error) {
            console.error('Failed to sync state to backend:', error);
        }
    }, SYNC_DELAY);
}

/**
 * Redux middleware for state persistence
 */
export const persistenceMiddleware: Middleware<{}, AppState> =
    (store) => (next) => (action) => {
        const result = next(action);
        const state = store.getState();

        // Save to localStorage on every action
        saveToLocalStorage(state);

        // Debounced sync to backend
        syncToBackend(state);

        return result;
    };

/**
 * Clear all persisted state
 */
export function clearPersistedState(): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(STORAGE_KEYS.FIGMA_STATE);
        localStorage.removeItem(STORAGE_KEYS.RECENT_FILES);
    } catch (error) {
        console.error('Failed to clear persisted state:', error);
    }
}
