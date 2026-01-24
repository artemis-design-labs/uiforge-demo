'use client';

import { useCallback, useState } from 'react';

interface ImageUploadZoneProps {
  onImageSelect: (file: File, dataUrl: string) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageUploadZone({ onImageSelect, disabled }: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Please upload a PNG, JPG, or WebP image' };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'Image must be less than 10MB' };
    }
    return { valid: true };
  }, []);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      const validation = validateFile(file);

      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onImageSelect(file, dataUrl);
      };
      reader.onerror = () => {
        setError('Failed to read image file');
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect, validateFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      processFile(files[0]);
    },
    [disabled, processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      processFile(files[0]);
    },
    [processFile]
  );

  return (
    <div className="space-y-4">
      <label
        className={`
          relative flex flex-col items-center justify-center
          w-full h-64 border-2 border-dashed rounded-xl
          transition-all cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center gap-4 p-6 text-center">
          {/* Image Icon */}
          <div
            className={`
              flex items-center justify-center w-16 h-16 rounded-full
              ${isDragging ? 'bg-primary/20' : 'bg-muted'}
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>

          {/* Text */}
          <div>
            <p className="text-base font-medium">
              {isDragging ? 'Drop your screenshot here' : 'Drop a screenshot here'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
          </div>

          {/* Supported formats */}
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded bg-muted">PNG</span>
            <span className="px-2 py-1 rounded bg-muted">JPG</span>
            <span className="px-2 py-1 rounded bg-muted">WebP</span>
          </div>

          {/* Size limit */}
          <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
        </div>
      </label>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Tips */}
      <div className="p-4 rounded-lg bg-muted/50">
        <h4 className="text-sm font-medium mb-2">Tips for best results</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Use high-resolution screenshots for better accuracy</li>
          <li>• Capture the full UI without scrolling artifacts</li>
          <li>• Ensure good contrast between components</li>
          <li>• Avoid screenshots with overlays or tooltips</li>
        </ul>
      </div>
    </div>
  );
}
