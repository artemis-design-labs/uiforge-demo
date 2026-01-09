'use client';
import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ComponentProperties } from '@/types/component';
import { CodeGenModal } from '@/components/CodeGenModal';

interface PropertiesPanelProps {
    properties: ComponentProperties;
    onPropertyChange: (property: keyof ComponentProperties, value: string | number | boolean) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ properties, onPropertyChange }) => {
    const instanceData = useAppSelector((state) => state.figma.instanceData);
    const [localProps, setLocalProps] = useState(properties);
    const [showCodeGenModal, setShowCodeGenModal] = useState(false);

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

    if (!instanceData) {
        return (
            <div className="p-4 text-sm text-gray-500">
                Select a component to view its properties
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-sm font-semibold mb-4">Component Properties</h3>
                
                {/* Component Info */}
                <div className="space-y-2 mb-6 p-3 bg-gray-50 rounded">
                    <div className="text-xs">
                        <span className="font-medium">Name:</span> {instanceData.data?.name || 'Unknown'}
                    </div>
                    <div className="text-xs">
                        <span className="font-medium">Type:</span> {instanceData.data?.type || 'Unknown'}
                    </div>
                    <div className="text-xs">
                        <span className="font-medium">Component ID:</span> {instanceData.data?.componentId || 'N/A'}
                    </div>
                </div>

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