'use client';
import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateFigmaComponentProp } from '@/store/figmaSlice';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

/**
 * FigmaPropertiesPanel - Displays and allows editing of Figma component properties
 * This panel shows properties like boolean toggles and variant selectors
 * that match the Figma component's configurable options.
 */
export function FigmaPropertiesPanel() {
    const dispatch = useAppDispatch();
    const { figmaComponentProps, selectedComponentName } = useAppSelector((state) => state.figma);

    // Debug logging
    console.log('🎛️ FigmaPropertiesPanel render:', {
        selectedComponentName,
        figmaComponentProps,
        propCount: Object.keys(figmaComponentProps || {}).length
    });

    const handlePropertyChange = (name: string, value: boolean | string) => {
        dispatch(updateFigmaComponentProp({ name, value }));
        console.log('🎨 Property changed:', name, '=', value);
    };

    // Don't render if no props available
    if (!figmaComponentProps || Object.keys(figmaComponentProps).length === 0) {
        console.log('🎛️ FigmaPropertiesPanel: No props, not rendering');
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Figma Properties
                </h4>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                    {Object.keys(figmaComponentProps).length} props
                </span>
            </div>

            <div className="space-y-3">
                {Object.entries(figmaComponentProps).map(([key, prop]) => (
                    <div key={key} className="space-y-2">
                        {/* Property label and type badge */}
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-gray-700 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </Label>
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {prop.type}
                            </span>
                        </div>

                        {/* BOOLEAN property - Switch toggle */}
                        {prop.type === 'BOOLEAN' && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                <span className="text-xs text-gray-600">
                                    {prop.value ? 'Enabled' : 'Disabled'}
                                </span>
                                <Switch
                                    checked={prop.value as boolean}
                                    onCheckedChange={(checked) => handlePropertyChange(key, checked)}
                                />
                            </div>
                        )}

                        {/* VARIANT property - Dropdown selector */}
                        {prop.type === 'VARIANT' && prop.options && (
                            <select
                                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                value={prop.value as string}
                                onChange={(e) => handlePropertyChange(key, e.target.value)}
                            >
                                {prop.options.map((option: string) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* TEXT property - Text input */}
                        {prop.type === 'TEXT' && (
                            <input
                                type="text"
                                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={prop.value as string}
                                onChange={(e) => handlePropertyChange(key, e.target.value)}
                                placeholder={`Enter ${key}...`}
                            />
                        )}

                        {/* INSTANCE_SWAP property - Dropdown for swappable instances */}
                        {prop.type === 'INSTANCE_SWAP' && prop.options && (
                            <select
                                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                value={prop.value as string}
                                onChange={(e) => handlePropertyChange(key, e.target.value)}
                            >
                                {prop.options.map((option: string) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* INSTANCE_SWAP without options - show as text */}
                        {prop.type === 'INSTANCE_SWAP' && !prop.options && (
                            <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs text-gray-600">
                                Instance: {prop.value as string}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Component name info */}
            {selectedComponentName && (
                <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        Component: <span className="text-gray-700">{selectedComponentName}</span>
                    </p>
                </div>
            )}
        </div>
    );
}

export default FigmaPropertiesPanel;
