import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  ScreenshotAnalysis,
  ScreenshotAnalysisStage,
  PreviewConfig,
} from '../types/screenshotAnalyzer';

// ============================================
// State Interface
// ============================================

interface ScreenshotState {
  // Modal state
  isModalOpen: boolean;

  // Upload state
  uploadedImage: string | null;      // Base64 data URL
  uploadedFileName: string | null;

  // Analysis state
  isAnalyzing: boolean;
  analysisStage: ScreenshotAnalysisStage;
  analysisProgress: number;
  analysisMessage: string | null;

  // Results
  currentAnalysis: ScreenshotAnalysis | null;

  // Selection
  selectedComponentId: string | null;
  expandedNodeIds: string[];

  // Preview
  previewConfig: PreviewConfig | null;
  previewProps: Record<string, unknown>;

  // Error
  error: string | null;
}

// ============================================
// Initial State
// ============================================

const initialState: ScreenshotState = {
  isModalOpen: false,
  uploadedImage: null,
  uploadedFileName: null,
  isAnalyzing: false,
  analysisStage: 'idle',
  analysisProgress: 0,
  analysisMessage: null,
  currentAnalysis: null,
  selectedComponentId: null,
  expandedNodeIds: [],
  previewConfig: null,
  previewProps: {},
  error: null,
};

// ============================================
// Slice Definition
// ============================================

const screenshotSlice = createSlice({
  name: 'screenshot',
  initialState,
  reducers: {
    // Modal actions
    openModal(state) {
      state.isModalOpen = true;
    },
    closeModal(state) {
      state.isModalOpen = false;
    },

    // Upload actions
    setUploadedImage(
      state,
      action: PayloadAction<{ image: string; fileName: string }>
    ) {
      state.uploadedImage = action.payload.image;
      state.uploadedFileName = action.payload.fileName;
      state.error = null;
    },
    clearUploadedImage(state) {
      state.uploadedImage = null;
      state.uploadedFileName = null;
    },

    // Analysis actions
    startAnalysis(state) {
      state.isAnalyzing = true;
      state.analysisStage = 'uploading';
      state.analysisProgress = 0;
      state.analysisMessage = 'Starting analysis...';
      state.error = null;
      state.currentAnalysis = null;
      state.selectedComponentId = null;
      state.previewConfig = null;
    },
    setAnalysisStage(
      state,
      action: PayloadAction<{
        stage: ScreenshotAnalysisStage;
        progress: number;
        message?: string;
      }>
    ) {
      state.analysisStage = action.payload.stage;
      state.analysisProgress = action.payload.progress;
      if (action.payload.message) {
        state.analysisMessage = action.payload.message;
      }
    },
    setAnalysis(state, action: PayloadAction<ScreenshotAnalysis>) {
      state.currentAnalysis = action.payload;
      state.isAnalyzing = false;
      state.analysisStage = 'complete';
      state.analysisProgress = 100;
      state.analysisMessage = 'Analysis complete';

      // Auto-expand root components
      state.expandedNodeIds = [...action.payload.rootComponents];
    },
    clearAnalysis(state) {
      state.currentAnalysis = null;
      state.selectedComponentId = null;
      state.expandedNodeIds = [];
      state.previewConfig = null;
      state.previewProps = {};
    },

    // Selection actions
    selectComponent(state, action: PayloadAction<string | null>) {
      state.selectedComponentId = action.payload;

      // If selecting a component, set up preview config
      if (action.payload && state.currentAnalysis) {
        const component = state.currentAnalysis.components.find(
          (c) => c.id === action.payload
        );
        if (component) {
          // Use inferred props as initial preview props
          state.previewProps = { ...component.inferredProps };
        }
      } else {
        state.previewProps = {};
      }
    },
    toggleNodeExpansion(state, action: PayloadAction<string>) {
      const nodeId = action.payload;
      const index = state.expandedNodeIds.indexOf(nodeId);
      if (index === -1) {
        state.expandedNodeIds.push(nodeId);
      } else {
        state.expandedNodeIds.splice(index, 1);
      }
    },
    expandAllNodes(state) {
      if (state.currentAnalysis) {
        state.expandedNodeIds = state.currentAnalysis.components.map((c) => c.id);
      }
    },
    collapseAllNodes(state) {
      state.expandedNodeIds = [];
    },

    // Preview actions
    setPreviewConfig(state, action: PayloadAction<PreviewConfig | null>) {
      state.previewConfig = action.payload;
    },
    setPreviewProps(state, action: PayloadAction<Record<string, unknown>>) {
      state.previewProps = action.payload;
    },
    updatePreviewProp(
      state,
      action: PayloadAction<{ key: string; value: unknown }>
    ) {
      state.previewProps[action.payload.key] = action.payload.value;
    },

    // Error actions
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isAnalyzing = false;
      state.analysisStage = 'error';
    },
    clearError(state) {
      state.error = null;
    },

    // Reset action
    resetAnalysis(state) {
      state.uploadedImage = null;
      state.uploadedFileName = null;
      state.isAnalyzing = false;
      state.analysisStage = 'idle';
      state.analysisProgress = 0;
      state.analysisMessage = null;
      state.currentAnalysis = null;
      state.selectedComponentId = null;
      state.expandedNodeIds = [];
      state.previewConfig = null;
      state.previewProps = {};
      state.error = null;
    },
  },
});

// ============================================
// Export Actions
// ============================================

export const {
  openModal,
  closeModal,
  setUploadedImage,
  clearUploadedImage,
  startAnalysis,
  setAnalysisStage,
  setAnalysis,
  clearAnalysis,
  selectComponent,
  toggleNodeExpansion,
  expandAllNodes,
  collapseAllNodes,
  setPreviewConfig,
  setPreviewProps,
  updatePreviewProp,
  setError,
  clearError,
  resetAnalysis,
} = screenshotSlice.actions;

// ============================================
// Selectors
// ============================================

export const selectIsModalOpen = (state: { screenshot: ScreenshotState }) =>
  state.screenshot.isModalOpen;

export const selectUploadedImage = (state: { screenshot: ScreenshotState }) =>
  state.screenshot.uploadedImage;

export const selectUploadedFileName = (state: { screenshot: ScreenshotState }) =>
  state.screenshot.uploadedFileName;

export const selectIsAnalyzing = (state: { screenshot: ScreenshotState }) =>
  state.screenshot.isAnalyzing;

export const selectAnalysisStage = (state: { screenshot: ScreenshotState }) =>
  state.screenshot.analysisStage;

export const selectAnalysisProgress = (state: { screenshot: ScreenshotState }) => ({
  stage: state.screenshot.analysisStage,
  progress: state.screenshot.analysisProgress,
  message: state.screenshot.analysisMessage,
});

export const selectCurrentAnalysis = (state: { screenshot: ScreenshotState }) =>
  state.screenshot.currentAnalysis;

export const selectSelectedComponentId = (state: { screenshot: ScreenshotState }) =>
  state.screenshot.selectedComponentId;

export const selectSelectedComponent = (state: { screenshot: ScreenshotState }) => {
  const { currentAnalysis, selectedComponentId } = state.screenshot;
  if (!currentAnalysis || !selectedComponentId) return null;
  return currentAnalysis.components.find((c) => c.id === selectedComponentId) || null;
};

export const selectExpandedNodeIds = (state: { screenshot: ScreenshotState }) =>
  state.screenshot.expandedNodeIds;

export const selectPreviewConfig = (state: { screenshot: ScreenshotState }) =>
  state.screenshot.previewConfig;

export const selectPreviewProps = (state: { screenshot: ScreenshotState }) =>
  state.screenshot.previewProps;

export const selectError = (state: { screenshot: ScreenshotState }) =>
  state.screenshot.error;

export default screenshotSlice.reducer;
