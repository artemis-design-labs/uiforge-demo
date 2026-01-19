'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedVariantId } from '@/store/figmaSlice';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ComponentProperties } from '@/types/component';
import { CodeGenModal } from '@/components/CodeGenModal';
import { FigmaPropertiesPanel } from '@/components/FigmaPropertiesPanel';

interface PropertiesPanelProps {
    properties: ComponentProperties;
    onPropertyChange: (property: keyof ComponentProperties, value: string | number | boolean) => void;
}

// Parse variant name like "Size=Large, State=Hover" into object { Size: "Large", State: "Hover" }
function parseVariantName(name: string): Record<string, string> {
    const result: Record<string, string> = {};
    if (!name) return result;

    const parts = name.split(',').map(p => p.trim());
    for (const part of parts) {
        const [key, value] = part.split('=').map(s => s.trim());
        if (key && value) {
            result[key] = value;
        }
    }
    return result;
}

// Extract all variant options from children of a COMPONENT_SET
function extractVariantOptions(children: any[]): Record<string, string[]> {
    const options: Record<string, Set<string>> = {};

    for (const child of children) {
        const parsed = parseVariantName(child.name);
        for (const [key, value] of Object.entries(parsed)) {
            if (!options[key]) {
                options[key] = new Set();
            }
            options[key].add(value);
        }
    }

    // Convert Sets to sorted arrays
    const result: Record<string, string[]> = {};
    for (const [key, values] of Object.entries(options)) {
        result[key] = Array.from(values).sort();
    }
    return result;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ properties, onPropertyChange }) => {
    const dispatch = useAppDispatch();
    const { instanceData, selectedVariantId } = useAppSelector((state) => state.figma);
    const [localProps, setLocalProps] = useState(properties);
    const [showCodeGenModal, setShowCodeGenModal] = useState(false);
    const [selectedVariantProps, setSelectedVariantProps] = useState<Record<string, string>>({});

    useEffect(() => {
        setLocalProps(properties);
        // Debug log to see what properties we're receiving
        if (properties.componentProperties) {
            console.log('📊 Component Properties received:', properties.componentProperties);
            Object.entries(properties.componentProperties).forEach(([key, prop]) => {
                if (prop.type === 'VARIANT') {
                    console.log(`  - ${key}:`, {
                        value: prop.value,
                        hasVariantOptions: !!prop.variantOptions,
                        optionsCount: prop.variantOptions?.length || 0,
                        options: prop.variantOptions
                    });
                }
            });
        }
    }, [properties]);

    // For COMPONENT_SET: compute variant options from children
    const isComponentSet = instanceData?.data?.type === 'COMPONENT_SET';
    const variantChildren = instanceData?.data?.children || [];
    const variantOptions = useMemo(() => {
        if (!isComponentSet || variantChildren.length === 0) return {};
        return extractVariantOptions(variantChildren);
    }, [isComponentSet, variantChildren]);

    // Initialize selectedVariantProps from current selectedVariantId
    useEffect(() => {
        if (!isComponentSet || !selectedVariantId || variantChildren.length === 0) return;

        const selectedChild = variantChildren.find((c: any) => c.id === selectedVariantId);
        if (selectedChild) {
            const parsed = parseVariantName(selectedChild.name);
            setSelectedVariantProps(parsed);
        }
    }, [isComponentSet, selectedVariantId, variantChildren]);

    // When user changes a variant property, find matching child and update selection
    const handleVariantChange = (propName: string, value: string) => {
        const newProps = { ...selectedVariantProps, [propName]: value };
        setSelectedVariantProps(newProps);

        // Find the child that matches all selected properties
        const matchingChild = variantChildren.find((child: any) => {
            const childProps = parseVariantName(child.name);
            return Object.entries(newProps).every(([k, v]) => childProps[k] === v);
        });

        if (matchingChild) {
            console.log('🎯 Switching to variant:', matchingChild.name, matchingChild.id);
            dispatch(setSelectedVariantId(matchingChild.id));
        } else {
            console.log('⚠️ No matching variant found for:', newProps);
        }
    };

    const handleChange = (property: keyof ComponentProperties, value: string | number | boolean) => {
        setLocalProps({ ...localProps, [property]: value });
        onPropertyChange(property, value);
    };

    const handleColorChange = (property: 'bgColor' | 'textColor', value: string) => {
        // Validate hex color
        if (/^#[0-9A-F]{6}$/i.test(value) || value.length < 7) {
            handleChange(property, value);
        }
    };

    // Get figma component props from Redux
    const { figmaComponentProps } = useAppSelector((state) => state.figma);
    const hasFigmaProps = figmaComponentProps && Object.keys(figmaComponentProps).length > 0;

    // Show message only if no component is selected AND no figma props
    if (!instanceData && !hasFigmaProps) {
        return (
            <div className="p-4 text-sm text-gray-500">
                Select a component to view its properties
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            {/* Figma Component Properties Panel - Always show if we have figma props */}
            <FigmaPropertiesPanel />

            {/* Instance-specific properties - only show if instanceData exists */}
            {instanceData && (
            <div>
                <h3 className="text-sm font-semibold mb-4">Component Properties</h3>

                {/* Component Info */}
                <div className="space-y-2 mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-xs">
                        <span className="font-medium">Name:</span> {instanceData.data?.name || 'Unknown'}
                    </div>
                    <div className="text-xs">
                        <span className="font-medium">Type:</span> {instanceData.data?.type || 'Unknown'}
                    </div>
                    {instanceData.data?.componentId && (
                        <div className="text-xs">
                            <span className="font-medium">Component ID:</span> {instanceData.data.componentId}
                        </div>
                    )}
                    {isComponentSet && (
                        <div className="text-xs">
                            <span className="font-medium">Variants:</span> {variantChildren.length}
                        </div>
                    )}
                </div>

                {/* Variant Switcher for COMPONENT_SET */}
                {isComponentSet && Object.keys(variantOptions).length > 0 && (
                    <div className="space-y-4 mb-6">
                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Variants</h4>
                        {Object.entries(variantOptions).map(([propName, options]) => (
                            <div key={propName} className="space-y-2">
                                <Label className="text-xs capitalize">{propName}</Label>
                                <select
                                    className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                                    value={selectedVariantProps[propName] || options[0]}
                                    onChange={(e) => handleVariantChange(propName, e.target.value)}
                                >
                                    {options.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 mb-6">
                    <Button
                        onClick={() => setShowCodeGenModal(true)}
                        className="w-full"
                        variant="default"
                    >
                        Generate Code
                    </Button>
                </div>

                {/* Dimensions */}
                <div className="space-y-4">
                    <h4 className="text-xs font-medium text-gray-700 uppercase">Dimensions</h4>
                    
                    <div className="space-y-2">
                        <Label htmlFor="width" className="text-xs">Width</Label>
                        <Input
                            id="width"
                            type="number"
                            value={localProps.width || 0}
                            onChange={(e) => handleChange('width', parseInt(e.target.value) || 0)}
                            className="h-8"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="height" className="text-xs">Height</Label>
                        <Input
                            id="height"
                            type="number"
                            value={localProps.height || 0}
                            onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
                            className="h-8"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cornerRadius" className="text-xs">Corner Radius</Label>
                        <Slider
                            id="cornerRadius"
                            min={0}
                            max={20}
                            step={1}
                            value={[localProps.cornerRadius || 0]}
                            onValueChange={(value) => handleChange('cornerRadius', value[0])}
                            className="w-full"
                        />
                        <span className="text-xs text-gray-500">{localProps.cornerRadius || 0}px</span>
                    </div>
                </div>

                {/* Colors */}
                <div className="space-y-4 mt-6">
                    <h4 className="text-xs font-medium text-gray-700 uppercase">Colors</h4>
                    
                    <div className="space-y-2">
                        <Label htmlFor="bgColor" className="text-xs">Background Color</Label>
                        <div className="flex gap-2">
                            <Input
                                id="bgColor"
                                type="text"
                                value={localProps.bgColor || '#000000'}
                                onChange={(e) => handleColorChange('bgColor', e.target.value)}
                                className="h-8 flex-1"
                            />
                            <input
                                type="color"
                                value={localProps.bgColor || '#000000'}
                                onChange={(e) => handleChange('bgColor', e.target.value)}
                                className="w-8 h-8 border rounded cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="textColor" className="text-xs">Text Color</Label>
                        <div className="flex gap-2">
                            <Input
                                id="textColor"
                                type="text"
                                value={localProps.textColor || '#FFFFFF'}
                                onChange={(e) => handleColorChange('textColor', e.target.value)}
                                className="h-8 flex-1"
                            />
                            <input
                                type="color"
                                value={localProps.textColor || '#FFFFFF'}
                                onChange={(e) => handleChange('textColor', e.target.value)}
                                className="w-8 h-8 border rounded cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-4 mt-6">
                    <h4 className="text-xs font-medium text-gray-700 uppercase">Text</h4>
                    
                    <div className="space-y-2">
                        <Label htmlFor="text" className="text-xs">Button Text</Label>
                        <Input
                            id="text"
                            type="text"
                            value={localProps.text || ''}
                            onChange={(e) => handleChange('text', e.target.value)}
                            className="h-8"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fontSize" className="text-xs">Font Size</Label>
                        <Slider
                            id="fontSize"
                            min={12}
                            max={24}
                            step={1}
                            value={[localProps.fontSize || 16]}
                            onValueChange={(value) => handleChange('fontSize', value[0])}
                            className="w-full"
                        />
                        <span className="text-xs text-gray-500">{localProps.fontSize || 16}px</span>
                    </div>
                </div>

                {/* Icons */}
                <div className="space-y-4 mt-6">
                    <h4 className="text-xs font-medium text-gray-700 uppercase">Icons</h4>
                    
                    <div className="flex items-center justify-between">
                        <Label htmlFor="showLeftIcon" className="text-xs">Show Left Icon</Label>
                        <Switch
                            id="showLeftIcon"
                            checked={localProps.showLeftIcon || false}
                            onCheckedChange={(checked) => handleChange('showLeftIcon', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="showRightIcon" className="text-xs">Show Right Icon</Label>
                        <Switch
                            id="showRightIcon"
                            checked={localProps.showRightIcon || false}
                            onCheckedChange={(checked) => handleChange('showRightIcon', checked)}
                        />
                    </div>
                </div>

                {/* Position */}
                <div className="space-y-4 mt-6">
                    <h4 className="text-xs font-medium text-gray-700 uppercase">Position</h4>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                            <Label htmlFor="x" className="text-xs">X</Label>
                            <Input
                                id="x"
                                type="number"
                                value={localProps.x || 0}
                                onChange={(e) => handleChange('x', parseInt(e.target.value) || 0)}
                                className="h-8"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="y" className="text-xs">Y</Label>
                            <Input
                                id="y"
                                type="number"
                                value={localProps.y || 0}
                                onChange={(e) => handleChange('y', parseInt(e.target.value) || 0)}
                                className="h-8"
                            />
                        </div>
                    </div>
                </div>

                {/* Component Properties (Variants, Booleans, etc.) */}
                {localProps.componentProperties && Object.keys(localProps.componentProperties).length > 0 && (
                    <div className="space-y-4 mt-6">
                        <h4 className="text-xs font-medium text-gray-700 uppercase">Component Properties</h4>
                        {Object.entries(localProps.componentProperties).map(([key, prop]) => (
                            <div key={key} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{prop.type}</span>
                                </div>
                                {prop.type === 'BOOLEAN' && (
                                    <Switch
                                        checked={prop.value as boolean}
                                        onCheckedChange={(checked) => {
                                            const newProps = { ...localProps };
                                            if (newProps.componentProperties && newProps.componentProperties[key]) {
                                                newProps.componentProperties[key].value = checked;
                                            }
                                            setLocalProps(newProps);
                                        }}
                                    />
                                )}
                                {(prop.type === 'TEXT' || prop.type === 'INSTANCE_SWAP') && (
                                    <Input
                                        type="text"
                                        value={prop.value as string}
                                        onChange={(e) => {
                                            const newProps = { ...localProps };
                                            if (newProps.componentProperties && newProps.componentProperties[key]) {
                                                newProps.componentProperties[key].value = e.target.value;
                                            }
                                            setLocalProps(newProps);
                                        }}
                                        className="h-8"
                                        placeholder={`Enter ${key}...`}
                                    />
                                )}
                                {prop.type === 'VARIANT' && (
                                    <>
                                        {prop.variantOptions && prop.variantOptions.length > 0 ? (
                                            <select
                                                className="w-full h-8 px-2 text-xs border rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                value={prop.value as string}
                                                onChange={(e) => {
                                                    const newProps = { ...localProps };
                                                    if (newProps.componentProperties && newProps.componentProperties[key]) {
                                                        newProps.componentProperties[key].value = e.target.value;
                                                    }
                                                    setLocalProps(newProps);
                                                }}
                                            >
                                                {prop.variantOptions.map(option => (
                                                    <option key={option} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                                ⚠️ No variant options available. Current value: {prop.value as string}
                                                <br />
                                                <button
                                                    onClick={() => console.log('Component Property:', { key, prop })}
                                                    className="text-blue-600 underline mt-1"
                                                >
                                                    Debug in console
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Effects (Shadows, Blurs) */}
                {localProps.effects && localProps.effects.length > 0 && (
                    <div className="space-y-4 mt-6">
                        <h4 className="text-xs font-medium text-gray-700 uppercase">Effects</h4>
                        {localProps.effects.map((effect, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">{effect.type.replace(/_/g, ' ')}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${effect.visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {effect.visible ? 'Visible' : 'Hidden'}
                                    </span>
                                </div>
                                {effect.radius !== undefined && (
                                    <div className="text-xs text-gray-600">Blur: {effect.radius}px</div>
                                )}
                                {effect.offset && (
                                    <div className="text-xs text-gray-600">
                                        Offset: X={effect.offset.x}px, Y={effect.offset.y}px
                                    </div>
                                )}
                                {effect.color && (
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded border"
                                            style={{
                                                backgroundColor: `rgba(${Math.round(effect.color.r * 255)}, ${Math.round(effect.color.g * 255)}, ${Math.round(effect.color.b * 255)}, ${effect.color.a})`
                                            }}
                                        />
                                        <span className="text-xs text-gray-600">Shadow Color</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Strokes */}
                {localProps.strokes && localProps.strokes.length > 0 && (
                    <div className="space-y-4 mt-6">
                        <h4 className="text-xs font-medium text-gray-700 uppercase">Strokes</h4>
                        {localProps.strokes.map((stroke, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded space-y-2">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-6 h-6 rounded border"
                                        style={{
                                            backgroundColor: `rgba(${Math.round(stroke.color.r * 255)}, ${Math.round(stroke.color.g * 255)}, ${Math.round(stroke.color.b * 255)}, ${stroke.color.a})`
                                        }}
                                    />
                                    <div className="flex-1">
                                        <div className="text-xs font-medium">Stroke Color</div>
                                        {stroke.strokeWeight !== undefined && (
                                            <div className="text-xs text-gray-600">Weight: {stroke.strokeWeight}px</div>
                                        )}
                                        {stroke.strokeAlign && (
                                            <div className="text-xs text-gray-600">Align: {stroke.strokeAlign}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Constraints */}
                {localProps.constraints && (
                    <div className="space-y-4 mt-6">
                        <h4 className="text-xs font-medium text-gray-700 uppercase">Constraints</h4>
                        <div className="p-3 bg-gray-50 rounded space-y-2">
                            <div className="text-xs">
                                <span className="font-medium">Horizontal:</span>{' '}
                                <span className="text-gray-600">{localProps.constraints.horizontal}</span>
                            </div>
                            <div className="text-xs">
                                <span className="font-medium">Vertical:</span>{' '}
                                <span className="text-gray-600">{localProps.constraints.vertical}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* Code Generation Modal */}
            <CodeGenModal
                isOpen={showCodeGenModal}
                onClose={() => setShowCodeGenModal(false)}
                componentData={instanceData?.data}
            />
        </div>
    );
};

export default PropertiesPanel;