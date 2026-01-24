'use client';

import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  closeModal,
  setUploadedImage,
  startAnalysis,
  setAnalysisStage,
  setAnalysis,
  selectComponent,
  toggleNodeExpansion,
  expandAllNodes,
  collapseAllNodes,
  setPreviewProps,
  setError,
  resetAnalysis,
} from '@/store/screenshotSlice';
import { analyzeScreenshot } from '@/services/screenshotAnalyzer';
import { ImageUploadZone } from './ImageUploadZone';
import { ComponentTree, TreeControls } from './ComponentTree';
import { ScreenshotPreview } from './ScreenshotPreview';
import { SimplePreview, NoComponentSelected } from './ComponentPreview';
import { IdentifiedComponentDetail, NoComponentSelectedDetail } from './IdentifiedComponentDetail';

export function ScreenshotAnalyzerModal() {
  const dispatch = useAppDispatch();

  // Redux state
  const isModalOpen = useAppSelector((state) => state.screenshot.isModalOpen);
  const uploadedImage = useAppSelector((state) => state.screenshot.uploadedImage);
  const uploadedFileName = useAppSelector((state) => state.screenshot.uploadedFileName);
  const isAnalyzing = useAppSelector((state) => state.screenshot.isAnalyzing);
  const analysisStage = useAppSelector((state) => state.screenshot.analysisStage);
  const analysisProgress = useAppSelector((state) => state.screenshot.analysisProgress);
  const analysisMessage = useAppSelector((state) => state.screenshot.analysisMessage);
  const currentAnalysis = useAppSelector((state) => state.screenshot.currentAnalysis);
  const selectedComponentId = useAppSelector((state) => state.screenshot.selectedComponentId);
  const expandedNodeIds = useAppSelector((state) => state.screenshot.expandedNodeIds);
  const previewProps = useAppSelector((state) => state.screenshot.previewProps);
  const error = useAppSelector((state) => state.screenshot.error);

  // Get codebase and Figma components for matching
  const codebaseAnalysis = useAppSelector((state) => state.codebase.currentAnalysis);
  const figmaComponents = useAppSelector((state) => state.figma.fileComponentDefinitions);

  // Find selected component
  const selectedComponent = currentAnalysis?.components.find(
    (c) => c.id === selectedComponentId
  );

  // Handle image upload
  const handleImageSelect = useCallback(
    async (file: File, dataUrl: string) => {
      dispatch(setUploadedImage({ image: dataUrl, fileName: file.name }));
      dispatch(startAnalysis());

      // Run analysis
      const result = await analyzeScreenshot(dataUrl, file.name, {
        codebaseComponents: codebaseAnalysis?.components,
        figmaComponents: figmaComponents || undefined,
        onProgress: (stage, progress, message) => {
          dispatch(setAnalysisStage({ stage, progress, message }));
        },
      });

      if (result.success && result.analysis) {
        dispatch(setAnalysis(result.analysis));
      } else {
        dispatch(setError(result.error || 'Analysis failed'));
      }
    },
    [dispatch, codebaseAnalysis, figmaComponents]
  );

  // Handlers
  const handleClose = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  const handleReset = useCallback(() => {
    dispatch(resetAnalysis());
  }, [dispatch]);

  const handleSelectComponent = useCallback(
    (id: string) => {
      dispatch(selectComponent(id));
    },
    [dispatch]
  );

  const handleToggleExpand = useCallback(
    (id: string) => {
      dispatch(toggleNodeExpansion(id));
    },
    [dispatch]
  );

  const handleExpandAll = useCallback(() => {
    dispatch(expandAllNodes());
  }, [dispatch]);

  const handleCollapseAll = useCallback(() => {
    dispatch(collapseAllNodes());
  }, [dispatch]);

  const handlePropsChange = useCallback(
    (props: Record<string, unknown>) => {
      dispatch(setPreviewProps(props));
    },
    [dispatch]
  );

  if (!isModalOpen) return null;

  // Determine view state
  const showUpload = !uploadedImage && !currentAnalysis;
  const showProgress = isAnalyzing;
  const showError = error && !isAnalyzing;
  const showResults = currentAnalysis && !isAnalyzing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`
          relative bg-background rounded-xl shadow-2xl border border-border
          overflow-hidden flex flex-col
          ${showResults ? 'w-[95vw] max-w-7xl h-[90vh]' : 'w-[600px] max-h-[85vh]'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-orange-500"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Screenshot Analyzer</h2>
              <p className="text-sm text-muted-foreground">
                Identify components from UI screenshots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentAnalysis && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-sm rounded-lg hover:bg-muted transition-colors"
              >
                New Analysis
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Upload View */}
          {showUpload && (
            <div className="p-6">
              <ImageUploadZone onImageSelect={handleImageSelect} disabled={isAnalyzing} />

              {/* Info about matching */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="text-sm font-medium mb-2">Component Matching</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  {codebaseAnalysis ? (
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {codebaseAnalysis.components.length} codebase components available
                    </p>
                  ) : (
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      No codebase analyzed yet. Use Codebase Analyzer first for better matching.
                    </p>
                  )}
                  {figmaComponents && Object.keys(figmaComponents).length > 0 ? (
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {Object.keys(figmaComponents).length} Figma components available
                    </p>
                  ) : (
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      No Figma file loaded. Connect to Figma for design system matching.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress View */}
          {showProgress && (
            <div className="p-8 flex flex-col items-center justify-center h-full">
              <div className="w-full max-w-md space-y-6">
                {/* Progress stages */}
                <div className="flex justify-between">
                  {['uploading', 'analyzing', 'matching', 'complete'].map((stage, index) => {
                    const stageOrder = ['uploading', 'analyzing', 'matching', 'complete'];
                    const currentIndex = stageOrder.indexOf(analysisStage);
                    const isComplete = index < currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                      <div key={stage} className="flex flex-col items-center">
                        <div
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center
                            ${isComplete ? 'bg-primary text-primary-foreground' : ''}
                            ${isCurrent ? 'bg-primary/20 text-primary border-2 border-primary' : ''}
                            ${!isComplete && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
                          `}
                        >
                          {isComplete ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span className="text-xs mt-1 capitalize">{stage}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>

                {/* Message */}
                <p className="text-center text-muted-foreground">{analysisMessage}</p>

                {/* Spinner */}
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            </div>
          )}

          {/* Error View */}
          {showError && (
            <div className="p-6">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                  <div>
                    <p className="font-medium text-destructive">Analysis Failed</p>
                    <p className="text-sm text-destructive/80 mt-1">{error}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="mt-4 w-full py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Results View */}
          {showResults && (
            <div className="flex h-full">
              {/* Left Panel: Screenshot + Tree */}
              <div className="w-1/3 border-r border-border flex flex-col">
                {/* Screenshot preview */}
                <div className="h-1/2 border-b border-border">
                  <ScreenshotPreview
                    imageDataUrl={currentAnalysis.imageDataUrl}
                    imageWidth={currentAnalysis.imageWidth}
                    imageHeight={currentAnalysis.imageHeight}
                    components={currentAnalysis.components}
                    selectedId={selectedComponentId}
                    onSelectComponent={handleSelectComponent}
                  />
                </div>

                {/* Component tree */}
                <div className="h-1/2 flex flex-col overflow-hidden">
                  <TreeControls
                    onExpandAll={handleExpandAll}
                    onCollapseAll={handleCollapseAll}
                    totalCount={currentAnalysis.stats.totalIdentified}
                    matchedCount={
                      currentAnalysis.stats.matchedToCodebase +
                      currentAnalysis.stats.matchedToFigma
                    }
                  />
                  <div className="flex-1 overflow-y-auto">
                    <ComponentTree
                      components={currentAnalysis.components}
                      selectedId={selectedComponentId}
                      expandedIds={expandedNodeIds}
                      onSelect={handleSelectComponent}
                      onToggleExpand={handleToggleExpand}
                    />
                  </div>
                </div>
              </div>

              {/* Center Panel: Preview */}
              <div className="w-1/3 border-r border-border">
                {selectedComponent ? (
                  <SimplePreview component={selectedComponent} />
                ) : (
                  <NoComponentSelected />
                )}
              </div>

              {/* Right Panel: Details */}
              <div className="w-1/3">
                {selectedComponent ? (
                  <IdentifiedComponentDetail
                    component={selectedComponent}
                    props={previewProps}
                    onPropsChange={handlePropsChange}
                  />
                ) : (
                  <NoComponentSelectedDetail />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
