'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { IdentifiedComponent } from '@/types/screenshotAnalyzer';

interface ScreenshotPreviewProps {
  imageDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  components: IdentifiedComponent[];
  selectedId: string | null;
  hoveredId?: string | null;
  onSelectComponent: (id: string) => void;
}

export function ScreenshotPreview({
  imageDataUrl,
  imageWidth,
  imageHeight,
  components,
  selectedId,
  hoveredId,
  onSelectComponent,
}: ScreenshotPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [localHoveredId, setLocalHoveredId] = useState<string | null>(null);

  // Calculate scale to fit container
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const scaleX = containerWidth / imageWidth;
        const scaleY = containerHeight / imageHeight;
        setScale(Math.min(scaleX, scaleY, 1)); // Don't scale up
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [imageWidth, imageHeight]);

  const effectiveHoveredId = hoveredId ?? localHoveredId;

  // Get box color based on state
  const getBoxColor = useCallback(
    (componentId: string) => {
      if (selectedId === componentId) return 'rgba(59, 130, 246, 0.8)'; // Blue
      if (effectiveHoveredId === componentId) return 'rgba(147, 51, 234, 0.6)'; // Purple
      return 'rgba(34, 197, 94, 0.4)'; // Green
    },
    [selectedId, effectiveHoveredId]
  );

  const getBoxBorderWidth = useCallback(
    (componentId: string) => {
      if (selectedId === componentId) return 3;
      if (effectiveHoveredId === componentId) return 2;
      return 1;
    },
    [selectedId, effectiveHoveredId]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-auto bg-[#1a1a1a] flex items-center justify-center"
    >
      <div
        className="relative"
        style={{
          width: imageWidth * scale,
          height: imageHeight * scale,
        }}
      >
        {/* Screenshot Image */}
        <img
          src={imageDataUrl}
          alt="Uploaded screenshot"
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />

        {/* SVG Overlay for bounding boxes */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${imageWidth} ${imageHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Render boxes from back to front (lower depth first) */}
          {[...components]
            .sort((a, b) => a.depth - b.depth)
            .map((component) => {
              const { boundingBox, id, name } = component;
              const isSelected = selectedId === id;
              const isHovered = effectiveHoveredId === id;
              const color = getBoxColor(id);
              const borderWidth = getBoxBorderWidth(id);

              return (
                <g key={id}>
                  {/* Bounding box rectangle */}
                  <rect
                    x={boundingBox.x}
                    y={boundingBox.y}
                    width={boundingBox.width}
                    height={boundingBox.height}
                    fill={isSelected || isHovered ? `${color.replace(')', ', 0.1)')}` : 'transparent'}
                    stroke={color}
                    strokeWidth={borderWidth}
                    strokeDasharray={isSelected ? 'none' : '4 2'}
                    className="cursor-pointer pointer-events-auto transition-all"
                    onClick={() => onSelectComponent(id)}
                    onMouseEnter={() => setLocalHoveredId(id)}
                    onMouseLeave={() => setLocalHoveredId(null)}
                  />

                  {/* Label background */}
                  {(isSelected || isHovered) && (
                    <>
                      <rect
                        x={boundingBox.x}
                        y={boundingBox.y - 20}
                        width={Math.min(name.length * 8 + 16, boundingBox.width)}
                        height={18}
                        fill={color}
                        rx={2}
                      />
                      <text
                        x={boundingBox.x + 8}
                        y={boundingBox.y - 6}
                        fill="white"
                        fontSize="12"
                        fontFamily="system-ui, sans-serif"
                        fontWeight="500"
                      >
                        {name.length > 20 ? name.substring(0, 20) + '...' : name}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
        </svg>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/70 text-white text-xs rounded">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}

// ============================================
// Mini Map Component (optional)
// ============================================

interface MiniMapProps {
  imageDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  components: IdentifiedComponent[];
  selectedId: string | null;
  onSelectComponent: (id: string) => void;
}

export function MiniMap({
  imageDataUrl,
  imageWidth,
  imageHeight,
  components,
  selectedId,
  onSelectComponent,
}: MiniMapProps) {
  const maxWidth = 200;
  const maxHeight = 150;
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);

  return (
    <div
      className="relative border border-border rounded-lg overflow-hidden bg-muted/50"
      style={{
        width: imageWidth * scale,
        height: imageHeight * scale,
      }}
    >
      <img
        src={imageDataUrl}
        alt="Mini map"
        className="absolute inset-0 w-full h-full object-contain opacity-50"
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      >
        {components.map((component) => (
          <rect
            key={component.id}
            x={component.boundingBox.x}
            y={component.boundingBox.y}
            width={component.boundingBox.width}
            height={component.boundingBox.height}
            fill={selectedId === component.id ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}
            stroke={selectedId === component.id ? '#3b82f6' : '#22c55e'}
            strokeWidth={selectedId === component.id ? 2 : 1}
            className="cursor-pointer"
            onClick={() => onSelectComponent(component.id)}
          />
        ))}
      </svg>
    </div>
  );
}
