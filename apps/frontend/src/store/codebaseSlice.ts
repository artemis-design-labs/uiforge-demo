import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CodebaseAnalysis,
  AnalysisStage,
  SavedAnalysis,
  ExtractedComponent,
} from '../types/codebaseAnalyzer';

// ============================================
// State Interface
// ============================================

interface CodebaseState {
  // Current analysis
  currentAnalysis: CodebaseAnalysis | null;

  // Saved analyses (stored in localStorage)
  savedAnalyses: SavedAnalysis[];

  // Upload state
  isUploading: boolean;
  uploadProgress: number;
  uploadedFileName: string | null;

  // Analysis state
  isAnalyzing: boolean;
  analysisStage: AnalysisStage;
  analysisProgress: number;
  currentFile: string | null;
  analysisMessage: string | null;

  // UI state
  selectedComponentPath: string | null;
  isModalOpen: boolean;
  activeTab: 'components' | 'patterns' | 'files';

  // Error state
  error: string | null;
}

// ============================================
// Initial State
// ============================================

const initialState: CodebaseState = {
  // Current analysis
  currentAnalysis: null,

  // Saved analyses
  savedAnalyses: [],

  // Upload state
  isUploading: false,
  uploadProgress: 0,
  uploadedFileName: null,

  // Analysis state
  isAnalyzing: false,
  analysisStage: 'idle',
  analysisProgress: 0,
  currentFile: null,
  analysisMessage: null,

  // UI state
  selectedComponentPath: null,
  isModalOpen: false,
  activeTab: 'components',

  // Error state
  error: null,
};

// ============================================
// Slice Definition
// ============================================

const codebaseSlice = createSlice({
  name: 'codebase',
  initialState,
  reducers: {
    // ========== Modal State ==========
    openModal: (state) => {
      state.isModalOpen = true;
    },
    closeModal: (state) => {
      state.isModalOpen = false;
      // Don't reset analysis when closing - user might want to reopen
    },

    // ========== Upload State ==========
    setUploading: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload;
      if (action.payload) {
        state.uploadProgress = 0;
        state.error = null;
      }
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = Math.min(100, Math.max(0, action.payload));
    },
    setUploadedFileName: (state, action: PayloadAction<string | null>) => {
      state.uploadedFileName = action.payload;
    },

    // ========== Analysis State ==========
    startAnalysis: (state) => {
      state.isAnalyzing = true;
      state.analysisStage = 'extracting';
      state.analysisProgress = 0;
      state.currentFile = null;
      state.analysisMessage = 'Starting analysis...';
      state.error = null;
    },
    setAnalysisStage: (
      state,
      action: PayloadAction<{
        stage: AnalysisStage;
        progress?: number;
        message?: string;
      }>
    ) => {
      const { stage, progress, message } = action.payload;
      state.analysisStage = stage;
      if (progress !== undefined) {
        state.analysisProgress = Math.min(100, Math.max(0, progress));
      }
      if (message !== undefined) {
        state.analysisMessage = message;
      }
      if (stage === 'complete') {
        state.isAnalyzing = false;
      }
      if (stage === 'error') {
        state.isAnalyzing = false;
      }
    },
    setCurrentFile: (state, action: PayloadAction<string | null>) => {
      state.currentFile = action.payload;
    },
    setAnalysisProgress: (state, action: PayloadAction<number>) => {
      state.analysisProgress = Math.min(100, Math.max(0, action.payload));
    },

    // ========== Analysis Results ==========
    setCurrentAnalysis: (state, action: PayloadAction<CodebaseAnalysis | null>) => {
      state.currentAnalysis = action.payload;
      state.isAnalyzing = false;
      state.analysisStage = action.payload ? 'complete' : 'idle';
      state.analysisProgress = action.payload ? 100 : 0;
    },

    // ========== Saved Analyses ==========
    setSavedAnalyses: (state, action: PayloadAction<SavedAnalysis[]>) => {
      state.savedAnalyses = action.payload;
    },
    saveCurrentAnalysis: (state) => {
      if (!state.currentAnalysis) return;

      const savedAnalysis: SavedAnalysis = {
        id: state.currentAnalysis.id,
        name: state.currentAnalysis.name,
        framework: state.currentAnalysis.framework.detected,
        componentCount: state.currentAnalysis.components.length,
        analyzedAt: state.currentAnalysis.analyzedAt,
        // Compress the full analysis as JSON string
        data: JSON.stringify(state.currentAnalysis),
      };

      // Remove existing entry with same ID
      state.savedAnalyses = state.savedAnalyses.filter(
        (a) => a.id !== savedAnalysis.id
      );

      // Add to beginning
      state.savedAnalyses.unshift(savedAnalysis);

      // Keep only 10 most recent
      if (state.savedAnalyses.length > 10) {
        state.savedAnalyses = state.savedAnalyses.slice(0, 10);
      }
    },
    loadSavedAnalysis: (state, action: PayloadAction<string>) => {
      const saved = state.savedAnalyses.find((a) => a.id === action.payload);
      if (saved) {
        try {
          state.currentAnalysis = JSON.parse(saved.data);
          state.analysisStage = 'complete';
          state.analysisProgress = 100;
        } catch {
          state.error = 'Failed to load saved analysis';
        }
      }
    },
    deleteSavedAnalysis: (state, action: PayloadAction<string>) => {
      state.savedAnalyses = state.savedAnalyses.filter(
        (a) => a.id !== action.payload
      );
      // Clear current if it was the deleted one
      if (state.currentAnalysis?.id === action.payload) {
        state.currentAnalysis = null;
        state.analysisStage = 'idle';
      }
    },

    // ========== UI State ==========
    selectComponent: (state, action: PayloadAction<string | null>) => {
      state.selectedComponentPath = action.payload;
    },
    setActiveTab: (
      state,
      action: PayloadAction<'components' | 'patterns' | 'files'>
    ) => {
      state.activeTab = action.payload;
    },

    // ========== Error State ==========
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.isAnalyzing = false;
        state.analysisStage = 'error';
      }
    },
    clearError: (state) => {
      state.error = null;
    },

    // ========== Reset State ==========
    resetAnalysis: (state) => {
      state.currentAnalysis = null;
      state.isUploading = false;
      state.uploadProgress = 0;
      state.uploadedFileName = null;
      state.isAnalyzing = false;
      state.analysisStage = 'idle';
      state.analysisProgress = 0;
      state.currentFile = null;
      state.analysisMessage = null;
      state.selectedComponentPath = null;
      state.error = null;
    },
    resetState: () => initialState,
  },
});

// ============================================
// Selectors
// ============================================

// Helper selectors that can be used in components
export const selectCurrentAnalysis = (state: { codebase: CodebaseState }) =>
  state.codebase.currentAnalysis;

export const selectIsAnalyzing = (state: { codebase: CodebaseState }) =>
  state.codebase.isAnalyzing;

export const selectAnalysisProgress = (state: { codebase: CodebaseState }) => ({
  stage: state.codebase.analysisStage,
  progress: state.codebase.analysisProgress,
  message: state.codebase.analysisMessage,
  currentFile: state.codebase.currentFile,
});

export const selectSelectedComponent = (state: { codebase: CodebaseState }): ExtractedComponent | null => {
  const { currentAnalysis, selectedComponentPath } = state.codebase;
  if (!currentAnalysis || !selectedComponentPath) return null;
  return (
    currentAnalysis.components.find((c) => c.filePath === selectedComponentPath) ||
    null
  );
};

export const selectSavedAnalyses = (state: { codebase: CodebaseState }) =>
  state.codebase.savedAnalyses;

export const selectIsModalOpen = (state: { codebase: CodebaseState }) =>
  state.codebase.isModalOpen;

// ============================================
// Exports
// ============================================

export const {
  // Modal
  openModal,
  closeModal,
  // Upload
  setUploading,
  setUploadProgress,
  setUploadedFileName,
  // Analysis
  startAnalysis,
  setAnalysisStage,
  setCurrentFile,
  setAnalysisProgress,
  setCurrentAnalysis,
  // Saved
  setSavedAnalyses,
  saveCurrentAnalysis,
  loadSavedAnalysis,
  deleteSavedAnalysis,
  // UI
  selectComponent,
  setActiveTab,
  // Error
  setError,
  clearError,
  // Reset
  resetAnalysis,
  resetState,
} = codebaseSlice.actions;

export default codebaseSlice.reducer;
