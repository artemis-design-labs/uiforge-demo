'use client';

import type { AnalysisStage } from '@/types/codebaseAnalyzer';

interface AnalysisProgressProps {
  stage: AnalysisStage;
  progress: number;
  message?: string | null;
  currentFile?: string | null;
  fileName?: string | null;
}

const STAGES: { id: AnalysisStage; label: string }[] = [
  { id: 'extracting', label: 'Extracting' },
  { id: 'detecting', label: 'Detecting' },
  { id: 'analyzing', label: 'Analyzing' },
  { id: 'complete', label: 'Complete' },
];

function getStageIndex(stage: AnalysisStage): number {
  const index = STAGES.findIndex((s) => s.id === stage);
  return index >= 0 ? index : 0;
}

export function AnalysisProgress({
  stage,
  progress,
  message,
  currentFile,
  fileName,
}: AnalysisProgressProps) {
  const currentStageIndex = getStageIndex(stage);
  const isComplete = stage === 'complete';
  const isError = stage === 'error';

  return (
    <div className="space-y-6">
      {/* File name being analyzed */}
      {fileName && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Analyzing</p>
          <p className="font-medium truncate">{fileName}</p>
        </div>
      )}

      {/* Stage indicators */}
      <div className="flex items-center justify-between">
        {STAGES.map((s, index) => {
          const isPast = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isFuture = index > currentStageIndex;

          return (
            <div key={s.id} className="flex items-center">
              {/* Stage dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full
                    transition-all duration-300
                    ${isPast || (isCurrent && isComplete) ? 'bg-primary text-primary-foreground' : ''}
                    ${isCurrent && !isComplete && !isError ? 'bg-primary/20 text-primary border-2 border-primary' : ''}
                    ${isCurrent && isError ? 'bg-destructive/20 text-destructive border-2 border-destructive' : ''}
                    ${isFuture ? 'bg-muted text-muted-foreground' : ''}
                  `}
                >
                  {isPast || (isCurrent && isComplete) ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isCurrent && !isComplete && !isError ? (
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  ) : isCurrent && isError ? (
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
                      <line x1="18" x2="6" y1="6" y2="18" />
                      <line x1="6" x2="18" y1="6" y2="18" />
                    </svg>
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium
                    ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}
                  `}
                >
                  {s.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STAGES.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 transition-all duration-300
                    ${isPast ? 'bg-primary' : 'bg-muted'}
                  `}
                  style={{ minWidth: '40px' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`
              h-full rounded-full transition-all duration-300 ease-out
              ${isError ? 'bg-destructive' : 'bg-primary'}
            `}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{message || 'Processing...'}</span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Current file being processed */}
      {currentFile && !isComplete && !isError && (
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Processing:</p>
          <p className="text-sm font-mono truncate">{currentFile}</p>
        </div>
      )}

      {/* Loading animation */}
      {!isComplete && !isError && (
        <div className="flex justify-center">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
