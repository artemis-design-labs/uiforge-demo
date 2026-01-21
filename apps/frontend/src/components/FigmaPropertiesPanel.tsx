'use client';

import React, { useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateFigmaComponentProp } from '@/store/figmaSlice';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';
import { CodeDisplay } from '@/components/CodeDisplay';
import { generateComponentCode, type FigmaComponentProp } from '@/services/codeGenerator';

/**
 * FigmaPropertiesPanel - Displays and allows editing of Figma component properties
 * This panel shows properties like boolean toggles and variant selectors
 * that match the Figma component's configurable options.
 *
 * Now includes collapsible accordions for Properties and Generated Code sections.
 */
export function FigmaPropertiesPanel() {
    const dispatch = useAppDispatch();
    const { figmaComponentProps, selectedComponentName, iconRegistry } = useAppSelector((state) => state.figma);

    // Helper to get icon name from node ID using the icon registry
    const getIconName = (nodeId: string): string => {
        const iconEntry = iconRegistry[nodeId];
        if (iconEntry) {
            // Extract clean name (e.g., "Icons/Arrow Left" -> "Arrow Left")
            const name = iconEntry.name;
            return name.includes('/') ? name.split('/').pop() || name : name;
        }
        // Fallback: format the node ID for display
        return nodeId.split(':').join('-');
    };

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

    // Generate code based on current component and props
    const generatedCode = useMemo(() => {
        if (!selectedComponentName || !figmaComponentProps || Object.keys(figmaComponentProps).length === 0) {
            return null;
        }

        // Convert Redux props format to the generator's expected format
        const propsForGenerator: Record<string, FigmaComponentProp> = {};
        for (const [key, prop] of Object.entries(figmaComponentProps)) {
            propsForGenerator[key] = {
                name: prop.name || key,
                type: prop.type as 'BOOLEAN' | 'VARIANT' | 'TEXT' | 'INSTANCE_SWAP',
                value: prop.value,
                options: prop.options,
                defaultValue: prop.defaultValue ?? prop.value,
            };
        }

        try {
            return generateComponentCode(selectedComponentName, propsForGenerator);
        } catch (error) {
            console.error('Code generation error:', error);
            return null;
        }
    }, [selectedComponentName, figmaComponentProps]);

    // Don't render if no props available
    if (!figmaComponentProps || Object.keys(figmaComponentProps).length === 0) {
        console.log('🎛️ FigmaPropertiesPanel: No props, not rendering');
        return null;
    }

    return (
        <div className="space-y-2">
            <Accordion type="multiple" defaultValue={['properties', 'code']} className="w-full">
                {/* Properties Section */}
                <AccordionItem value="properties" className="border-gray-700">
                    <AccordionTrigger className="text-gray-300 hover:text-white hover:no-underline">
                        <div className="flex items-center gap-2">
                            <PropertiesIcon className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium">Component Properties</span>
                            <span className="text-xs text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded ml-2">
                                {Object.keys(figmaComponentProps).length}
                            </span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pt-2">
                            {Object.entries(figmaComponentProps).map(([key, prop]) => (
                                <div key={key} className="flex items-center gap-3">
                                    {/* Property label */}
                                    <Label className="text-xs text-gray-400 capitalize min-w-[80px] shrink-0">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </Label>

                                    {/* BOOLEAN property - Switch toggle */}
                                    {prop.type === 'BOOLEAN' && (
                                        <div className="flex items-center gap-2 flex-1">
                                            <Switch
                                                checked={prop.value as boolean}
                                                onCheckedChange={(checked) => handlePropertyChange(key, checked)}
                                            />
                                            <span className="text-xs text-gray-400">
                                                {prop.value ? 'On' : 'Off'}
                                            </span>
                                        </div>
                                    )}

                                    {/* VARIANT property - Dropdown selector */}
                                    {prop.type === 'VARIANT' && prop.options && (
                                        <select
                                            className="flex-1 h-8 px-3 text-sm border border-gray-400 rounded-md bg-white text-gray-800 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
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
                                            className="flex-1 h-8 px-3 text-sm border border-gray-400 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={prop.value as string}
                                            onChange={(e) => handlePropertyChange(key, e.target.value)}
                                            placeholder={`Enter ${key}...`}
                                        />
                                    )}

                                    {/* INSTANCE_SWAP property - Dropdown for swappable instances */}
                                    {prop.type === 'INSTANCE_SWAP' && (prop.options || prop.preferredValues) && (
                                        <select
                                            className="flex-1 h-8 px-3 text-sm border border-gray-400 rounded-md bg-white text-gray-800 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                            value={prop.value as string}
                                            onChange={(e) => handlePropertyChange(key, e.target.value)}
                                        >
                                            {prop.options ? (
                                                prop.options.map((option: string) => (
                                                    <option key={option} value={option}>
                                                        {getIconName(option)}
                                                    </option>
                                                ))
                                            ) : (
                                                prop.preferredValues?.map((pv: { type: string; key: string }) => (
                                                    <option key={pv.key} value={pv.key}>
                                                        {getIconName(pv.key)}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    )}

                                    {/* INSTANCE_SWAP without options - show current value */}
                                    {prop.type === 'INSTANCE_SWAP' && !prop.options && !prop.preferredValues && (
                                        <span className="flex-1 text-xs text-gray-400">
                                            {getIconName(String(prop.value)) || 'None'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Generated Code Section */}
                <AccordionItem value="code" className="border-gray-700">
                    <AccordionTrigger className="text-gray-300 hover:text-white hover:no-underline">
                        <div className="flex items-center gap-2">
                            <CodeIcon className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-medium">React Code</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 pt-2">
                            {generatedCode ? (
                                <>
                                    {/* Component Code */}
                                    <div>
                                        <h5 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                                            Component
                                        </h5>
                                        <CodeDisplay
                                            code={generatedCode.componentCode}
                                            language="tsx"
                                            title={`${selectedComponentName?.split('/')[0] || 'Component'}.tsx`}
                                        />
                                    </div>

                                    {/* Usage Example */}
                                    <div>
                                        <h5 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                                            Usage Example
                                        </h5>
                                        <CodeDisplay
                                            code={generatedCode.usageExample}
                                            language="tsx"
                                            title="usage.tsx"
                                            showLineNumbers={false}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <CodeIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No code generated</p>
                                    <p className="text-xs mt-1 opacity-75">
                                        Select a component with properties to generate code
                                    </p>
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Component name info */}
            {selectedComponentName && (
                <div className="pt-3 border-t border-gray-700 mt-4">
                    <p className="text-xs text-gray-500">
                        Component: <span className="text-gray-300">{selectedComponentName}</span>
                    </p>
                </div>
            )}
        </div>
    );
}

// Icon components
function PropertiesIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function CodeIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    );
}

export default FigmaPropertiesPanel;
