'use client';

import { useCallback, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  closeModal,
  startAnalysis,
  setAnalysisStage,
  setCurrentAnalysis,
  setUploadedFileName,
  setError,
  resetAnalysis,
  setSavedAnalyses,
  saveCurrentAnalysis,
  loadSavedAnalysis,
  deleteSavedAnalysis,
} from '@/store/codebaseSlice';
import { analyzeCodebase, loadAnalysesFromStorage } from '@/services/codebaseAnalyzer';
import { UploadDropZone } from './codebase/UploadDropZone';
import { AnalysisProgress } from './codebase/AnalysisProgress';
import { AnalysisResults } from './codebase/AnalysisResults';

export function CodebaseAnalyzerModal() {
  const dispatch = useAppDispatch();
  const {
    isModalOpen,
    currentAnalysis,
    savedAnalyses,
    isAnalyzing,
    analysisStage,
    analysisProgress,
    analysisMessage,
    currentFile,
    uploadedFileName,
    error,
  } = useAppSelector((state) => state.codebase);

  // Load saved analyses on mount
  useEffect(() => {
    if (isModalOpen) {
      const saved = loadAnalysesFromStorage();
      dispatch(setSavedAnalyses(saved));
    }
  }, [isModalOpen, dispatch]);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      dispatch(setUploadedFileName(file.name));
      dispatch(startAnalysis());

      const result = await analyzeCodebase(file, {
        onProgress: (progress) => {
          dispatch(
            setAnalysisStage({
              stage: progress.stage,
              progress: progress.progress,
              message: progress.message,
            })
          );
        },
      });

      if (result.success && result.analysis) {
        dispatch(setCurrentAnalysis(result.analysis));
        dispatch(saveCurrentAnalysis());
        // Refresh saved analyses
        const saved = loadAnalysesFromStorage();
        dispatch(setSavedAnalyses(saved));
      } else {
        dispatch(setError(result.error || 'Analysis failed'));
      }
    },
    [dispatch]
  );

  // Handle close
  const handleClose = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  // Handle reset
  const handleReset = useCallback(() => {
    dispatch(resetAnalysis());
  }, [dispatch]);

  // Handle load saved
  const handleLoadSaved = useCallback(
    (id: string) => {
      dispatch(loadSavedAnalysis(id));
    },
    [dispatch]
  );

  // Handle delete saved
  const handleDeleteSaved = useCallback(
    (id: string) => {
      dispatch(deleteSavedAnalysis(id));
      // Refresh from storage
      const saved = loadAnalysesFromStorage();
      dispatch(setSavedAnalyses(saved));
    },
    [dispatch]
  );

  if (!isModalOpen) return null;

  // Determine which view to show
  const showUpload = !currentAnalysis && !isAnalyzing && !error;
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
          ${showResults ? 'w-[90vw] max-w-6xl h-[85vh]' : 'w-[600px] max-h-[85vh]'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-primary"
              >
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8" />
                <path d="M15 18h-5" />
                <path d="M10 6h8v4h-8V6Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Codebase Analyzer</h2>
              <p className="text-sm text-muted-foreground">
                Analyze your project structure and components
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
              <UploadDropZone
                onFileSelect={handleFileSelect}
                disabled={isAnalyzing}
              />

              {/* Saved analyses */}
              {savedAnalyses.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium mb-3">Recent Analyses</h3>
                  <div className="space-y-2">
                    {savedAnalyses.slice(0, 5).map((saved) => (
                      <div
                        key={saved.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <button
                          onClick={() => handleLoadSaved(saved.id)}
                          className="flex-1 text-left"
                        >
                          <p className="font-medium">{saved.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {saved.framework} • {saved.componentCount} components •{' '}
                            {new Date(saved.analyzedAt).toLocaleDateString()}
                          </p>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSaved(saved.id);
                          }}
                          className="p-2 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Delete"
                        >
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
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress View */}
          {showProgress && (
            <div className="p-6">
              <AnalysisProgress
                stage={analysisStage}
                progress={analysisProgress}
                message={analysisMessage}
                currentFile={currentFile}
                fileName={uploadedFileName}
              />
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
          {showResults && <AnalysisResults analysis={currentAnalysis} />}
        </div>
      </div>
    </div>
  );
}
