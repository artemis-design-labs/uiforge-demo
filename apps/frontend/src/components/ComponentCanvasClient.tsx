'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { ComponentProperties, FigmaNode } from '@/types/component';
import { Stage, Layer, Rect, Text, Group, Arrow } from 'react-konva';

interface ComponentCanvasProps {
    onUpdateProperties?: (properties: ComponentProperties) => void;
    externalProperties?: ComponentProperties;
}

const DEFAULT_COMPONENT_PROPS = {
    x: 100,
    y: 100,
    width: 156,
    height: 40,
    text: 'Button',
    bgColor: '#1976D2',
    textColor: '#FFFFFF',
    cornerRadius: 4,
    showLeftIcon: true,
    showRightIcon: true,
    fontSize: 16,
};

const GRID_SIZE = 20;
const GRID_COLOR = '#e5e7eb';

const ComponentCanvasClient: React.FC<ComponentCanvasProps> = ({ onUpdateProperties, externalProperties }) => {
    const instanceData = useAppSelector((state) => state.figma.instanceData);
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    const [componentProps, setComponentProps] = useState<ComponentProperties>(DEFAULT_COMPONENT_PROPS);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle client-side mounting and resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                setStageSize({
                    width: Math.max(offsetWidth, 400),
                    height: Math.max(offsetHeight, 300),
                });
            }
        };

        updateSize();

        const resizeObserver = new ResizeObserver(updateSize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Update component props when external properties change (from PropertiesPanel)
    useEffect(() => {
        if (externalProperties) {
            setComponentProps(prev => ({ ...prev, ...externalProperties }));
        }
    }, [externalProperties]);

    // Process Figma data and update component properties
    useEffect(() => {
        console.log('🎨 ComponentCanvas: instanceData updated', {
            hasData: !!instanceData,
            dataExists: !!instanceData?.data,
            fullInstanceData: instanceData
        });

        // Skip if no instance data
        if (!instanceData?.data) {
            console.log('⚠️ ComponentCanvas: No instance data available');
            return;
        }

        const data = instanceData.data;
        console.log('📊 ComponentCanvas: Processing data structure:', {
            type: data.type,
            id: data.id,
            name: data.name,
            hasChildren: !!data.children,
            childrenCount: data.children?.length,
            hasBounds: !!data.absoluteBoundingBox,
            bounds: data.absoluteBoundingBox
        });

        const newProps = extractComponentProperties(data, stageSize);
        console.log('🎯 ComponentCanvas: Extracted props:', newProps);

        // Always update componentProps when new instanceData arrives
        setComponentProps(newProps);
        console.log('✅ ComponentCanvas: State updated with new props');

        // Notify parent of the new properties (using stable reference)
        if (onUpdateProperties) {
            console.log('📤 ComponentCanvas: Notifying parent of property updates');
            onUpdateProperties(newProps);
        }
    }, [instanceData, stageSize]); // Removed onUpdateProperties from dependencies to prevent infinite loop

    // Helper function to extract component properties from Figma data
    const extractComponentProperties = (data: FigmaNode, stageSize: { width: number; height: number }): ComponentProperties => {
        // For INSTANCE nodes, the absoluteBoundingBox might be on the first child
        let absoluteBounds = data.absoluteBoundingBox;
        if (!absoluteBounds && data.type === 'INSTANCE' && data.children && data.children.length > 0) {
            absoluteBounds = data.children[0].absoluteBoundingBox;
            console.log('ComponentCanvas: Using child absoluteBoundingBox', absoluteBounds);
        }

        // For INSTANCE nodes, fills might be on the first child or deeper
        let fills = data.fills?.[0];
        if (!fills && data.children && data.children.length > 0) {
            fills = data.children[0].fills?.[0];
        }

        // Extract background color
        const bgColor = fills?.color
            ? `rgba(${Math.round(fills.color.r * 255)}, ${Math.round(fills.color.g * 255)}, ${Math.round(fills.color.b * 255)}, ${fills.color.a})`
            : DEFAULT_COMPONENT_PROPS.bgColor;

        // Find and extract text properties
        const textNode = findTextNode(data);
        const textContent = textNode?.characters || DEFAULT_COMPONENT_PROPS.text;
        const textFill = textNode?.fills?.[0];
        const textColor = textFill?.color
            ? `rgba(${Math.round(textFill.color.r * 255)}, ${Math.round(textFill.color.g * 255)}, ${Math.round(textFill.color.b * 255)}, ${textFill.color.a})`
            : DEFAULT_COMPONENT_PROPS.textColor;
        const fontSize = textNode?.style?.fontSize || DEFAULT_COMPONENT_PROPS.fontSize;

        // Check for icons
        const hasLeftIcon = hasIcon(data, 'ArrowLeft');
        const hasRightIcon = hasIcon(data, 'ArrowRight');

        // Extract component properties (variants, booleans, text, etc.)
        const componentProperties = data.componentProperties
            ? Object.entries(data.componentProperties).reduce((acc, [key, prop]) => {
                acc[key] = {
                    type: prop.type,
                    value: prop.value,
                    defaultValue: prop.defaultValue,
                    variantOptions: prop.variantOptions,
                };
                return acc;
            }, {} as Record<string, any>)
            : undefined;

        // Extract effects (shadows, blurs)
        const effects = data.effects?.map(effect => ({
            type: effect.type,
            visible: effect.visible,
            radius: effect.radius,
            color: effect.color,
            offset: effect.offset,
            spread: effect.spread,
        }));

        // Extract strokes
        const strokes = data.strokes?.map(stroke => ({
            color: stroke.color!,
            strokeWeight: data.strokeWeight,
            strokeAlign: data.strokeAlign,
        }));

        // Extract constraints
        const constraints = data.constraints;

        return {
            x: stageSize.width / 2 - (absoluteBounds?.width || DEFAULT_COMPONENT_PROPS.width) / 2,
            y: stageSize.height / 2 - (absoluteBounds?.height || DEFAULT_COMPONENT_PROPS.height) / 2,
            width: absoluteBounds?.width || DEFAULT_COMPONENT_PROPS.width,
            height: absoluteBounds?.height || DEFAULT_COMPONENT_PROPS.height,
            text: textContent,
            bgColor,
            textColor,
            cornerRadius: data.cornerRadius || DEFAULT_COMPONENT_PROPS.cornerRadius,
            showLeftIcon: hasLeftIcon,
            showRightIcon: hasRightIcon,
            fontSize,
            componentProperties,
            effects,
            strokes,
            constraints,
        };
    };

    // Helper function to find text nodes recursively
    const findTextNode = (node: FigmaNode): FigmaNode | null => {
        if (node.type === 'TEXT') return node;

        if (node.children) {
            for (const child of node.children) {
                const textNode = findTextNode(child);
                if (textNode) return textNode;
            }
        }

        return null;
    };

    // Helper function to check for icons
    const hasIcon = (data: FigmaNode, iconType: string): boolean => {
        const children = (data as FigmaNode).children?.[0]?.children?.[0]?.children;
        return children?.some((child: FigmaNode) =>
            child.name?.includes(iconType) || child.componentProperties?.Type?.value === iconType
        ) || false;
    };

    const renderArrow = (direction: 'left' | 'right', x: number, y: number) => {
        const points = direction === 'left'
            ? [x + 16, y + 8, x + 8, y + 8] // Left arrow
            : [x + 8, y + 8, x + 16, y + 8]; // Right arrow

        return (
            <Arrow
                points={points}
                pointerLength={6}
                pointerWidth={6}
                fill={componentProps.textColor}
                stroke={componentProps.textColor}
                strokeWidth={2}
            />
        );
    };

    // Memoize grid lines for performance
    const gridLines = React.useMemo(() => {
        const verticalLines = Array.from({ length: Math.ceil(stageSize.width / GRID_SIZE) }, (_, i) => (
            <Rect
                key={`v-${i}`}
                x={i * GRID_SIZE}
                y={0}
                width={1}
                height={stageSize.height}
                fill={GRID_COLOR}
            />
        ));

        const horizontalLines = Array.from({ length: Math.ceil(stageSize.height / GRID_SIZE) }, (_, i) => (
            <Rect
                key={`h-${i}`}
                x={0}
                y={i * GRID_SIZE}
                width={stageSize.width}
                height={1}
                fill={GRID_COLOR}
            />
        ));

        return [...verticalLines, ...horizontalLines];
    }, [stageSize]);

    console.log('🖼️ ComponentCanvas: Rendering component', {
        hasInstanceData: !!instanceData,
        instanceDataStructure: instanceData ? Object.keys(instanceData) : null,
        componentProps,
        stageSize
    });

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-gray-50 overflow-hidden"
        >
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                className="cursor-crosshair"
            >
                <Layer>
                    {/* Grid background */}
                    {gridLines}

                    {/* Component rendering */}
                    {instanceData ? (
                        <Group
                            onMouseEnter={() => console.log('ComponentCanvas: Mouse over component')}
                        >
                            {/* Button background */}
                            <Rect
                                x={componentProps.x}
                                y={componentProps.y}
                                width={componentProps.width}
                                height={componentProps.height}
                                fill={componentProps.bgColor}
                                cornerRadius={componentProps.cornerRadius}
                                shadowColor="black"
                                shadowBlur={4}
                                shadowOpacity={0.1}
                                shadowOffsetY={2}
                                stroke="#000"
                                strokeWidth={0.5}
                                strokeOpacity={0.1}
                            />

                            {/* Left icon */}
                            {componentProps.showLeftIcon &&
                                renderArrow('left', componentProps.x + 12, componentProps.y + componentProps.height / 2 - 8)
                            }

                            {/* Component text */}
                            <Text
                                x={componentProps.x}
                                y={componentProps.y}
                                width={componentProps.width}
                                height={componentProps.height}
                                text={componentProps.text}
                                fontSize={componentProps.fontSize}
                                fontFamily="Roboto, sans-serif"
                                fill={componentProps.textColor}
                                align="center"
                                verticalAlign="middle"
                                fontStyle="400"
                            />

                            {/* Right icon */}
                            {componentProps.showRightIcon &&
                                renderArrow('right', componentProps.x + componentProps.width - 28, componentProps.y + componentProps.height / 2 - 8)
                            }
                        </Group>
                    ) : (
                        /* No data placeholder */
                        <Group>
                            <Rect
                                x={stageSize.width / 2 - 200}
                                y={stageSize.height / 2 - 50}
                                width={400}
                                height={100}
                                fill="rgba(243, 244, 246, 0.8)"
                                cornerRadius={8}
                                stroke="#d1d5db"
                                strokeWidth={1}
                                dash={[5, 5]}
                            />
                            <Text
                                x={stageSize.width / 2}
                                y={stageSize.height / 2}
                                text="Load a component from the sidebar to begin editing"
                                fontSize={14}
                                fontFamily="Roboto, sans-serif"
                                fill="#6b7280"
                                align="center"
                                offsetX={200}
                                offsetY={7}
                            />
                        </Group>
                    )}
                </Layer>
            </Stage>
        </div>
    );
};

export default ComponentCanvasClient;