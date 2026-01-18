'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedVariantId } from '@/store/figmaSlice';
import { AccordionItem, ACCORDION_VARIANTS, AccordionProps } from '@/components/figma-components/AccordionComponent';
import { FigmaAccordionDarkMode } from '@/components/figma-components/FigmaAccordionDarkMode';

// Parse variant name like "Expanded=True, Disabled=False" into props object
function parseVariantName(name: string): Record<string, any> {
    const props: Record<string, any> = {};
    if (!name) return props;

    const parts = name.split(',').map(p => p.trim());
    for (const part of parts) {
        const [key, value] = part.split('=').map(s => s.trim());
        if (key && value) {
            // Convert to camelCase
            const camelKey = key.toLowerCase().replace(/-/g, '').replace(/oftype/g, 'OfType');
            // Convert string booleans
            if (value.toLowerCase() === 'true') {
                props[camelKey] = true;
            } else if (value.toLowerCase() === 'false') {
                props[camelKey] = false;
            } else {
                props[camelKey] = value;
            }
        }
    }
    return props;
}

// Extract variant options from component children
function extractVariantOptions(children: any[]): Record<string, any[]> {
    const options: Record<string, Set<any>> = {};

    for (const child of children) {
        const parsed = parseVariantName(child.name);
        for (const [key, value] of Object.entries(parsed)) {
            if (!options[key]) {
                options[key] = new Set();
            }
            options[key].add(value);
        }
    }

    const result: Record<string, any[]> = {};
    for (const [key, values] of Object.entries(options)) {
        result[key] = Array.from(values);
    }
    return result;
}

export default function HomePage() {
    const dispatch = useAppDispatch();
    const { selectedComponent, selectedVariantId, currentFileKey, instanceData } = useAppSelector((state) => state.figma);

    const [variantProps, setVariantProps] = useState<AccordionProps>({
        heading: "Heading",
        secondaryHeading: "Secondary heading",
        content: "This is the accordion content that appears when expanded.",
        expanded: false,
        disabled: false,
        firstOfType: false,
        lastOfType: false,
        darkMode: false
    });

    // Determine if we're viewing a COMPONENT_SET
    const isComponentSet = instanceData?.data?.type === 'COMPONENT_SET';
    const componentSetName = instanceData?.data?.name || '';
    const isAccordion = componentSetName.toLowerCase().includes('accordion');

    // Get variant children and options
    const variantChildren = instanceData?.data?.children || [];
    const variantOptions = useMemo(() => {
        if (!isComponentSet || variantChildren.length === 0) return {};
        return extractVariantOptions(variantChildren);
    }, [isComponentSet, variantChildren]);

    // Initialize variant props from first child when component set is selected
    useEffect(() => {
        if (isComponentSet && variantChildren.length > 0 && !selectedVariantId) {
            const firstVariant = variantChildren[0];
            dispatch(setSelectedVariantId(firstVariant.id));

            const parsed = parseVariantName(firstVariant.name);
            setVariantProps(prev => ({
                ...prev,
                expanded: parsed.expanded ?? false,
                disabled: parsed.disabled ?? false,
                firstOfType: parsed.firstoftype ?? false,
                lastOfType: parsed.lastoftype ?? false,
                darkMode: componentSetName.toLowerCase().includes('light') ? false : componentSetName.toLowerCase().includes('dark') ? false : false
            }));
        }
    }, [isComponentSet, variantChildren, selectedVariantId, componentSetName, dispatch]);

    // Update props when selectedVariantId changes
    useEffect(() => {
        if (selectedVariantId && variantChildren.length > 0) {
            const selectedChild = variantChildren.find((c: any) => c.id === selectedVariantId);
            if (selectedChild) {
                const parsed = parseVariantName(selectedChild.name);
                setVariantProps(prev => ({
                    ...prev,
                    expanded: parsed.expanded ?? false,
                    disabled: parsed.disabled ?? false,
                    firstOfType: parsed.firstoftype ?? false,
                    lastOfType: parsed.lastoftype ?? false,
                }));
            }
        }
    }, [selectedVariantId, variantChildren]);

    // Render component based on selection
    const renderComponent = () => {
        if (!selectedComponent || !instanceData) {
            return (
                <div className="text-white/30 text-sm">
                    Select a component from the tree to preview it
                </div>
            );
        }

        // Check if this is the Accordion/DarkMode component set
        const isDarkModeAccordion = componentSetName === 'Accordion/DarkMode' ||
            componentSetName.toLowerCase().includes('accordion') && componentSetName.toLowerCase().includes('dark');

        if (isComponentSet && isDarkModeAccordion) {
            return (
                <div className="flex flex-col items-center gap-6">
                    {/* Render the Figma-extracted component */}
                    <FigmaAccordionDarkMode
                        heading="Heading"
                        secondaryHeading="Secondary heading"
                    />

                    {/* Info label */}
                    <div className="text-white/50 text-xs mt-2 text-center">
                        <p>Component: {componentSetName}</p>
                        <p className="text-white/30 mt-1">Generated from Figma Node ID: 1:46</p>
                    </div>
                </div>
            );
        }

        if (isComponentSet && isAccordion) {
            return (
                <div className="flex flex-col items-center gap-4">
                    <AccordionItem {...variantProps} />
                    <div className="text-white/50 text-xs mt-4">
                        Rendering: {componentSetName}
                    </div>
                </div>
            );
        }

        // For non-accordion components, show a placeholder
        return (
            <div className="text-white/50 text-sm text-center">
                <p className="mb-2">Component: {instanceData.data?.name}</p>
                <p className="text-xs">Type: {instanceData.data?.type}</p>
                <p className="text-xs mt-4">React rendering for this component type is not yet implemented.</p>
            </div>
        );
    };

    // Debug info
    const debugInfo = {
        selectedComponent,
        hasInstanceData: !!instanceData,
        instanceDataType: instanceData?.data?.type,
        componentSetName,
        isComponentSet,
        isAccordion,
        variantChildrenCount: variantChildren.length,
    };

    return (
        <div className="h-full w-full flex flex-col bg-[#1e1e1e] overflow-auto p-8">
            {/* Debug Panel - Remove after troubleshooting */}
            <div className="mb-4 p-3 bg-yellow-900/50 rounded text-xs text-yellow-200 font-mono">
                <p className="font-bold mb-2">DEBUG INFO:</p>
                <p>selectedComponent: {debugInfo.selectedComponent || 'null'}</p>
                <p>hasInstanceData: {debugInfo.hasInstanceData ? 'true' : 'false'}</p>
                <p>instanceDataType: {debugInfo.instanceDataType || 'null'}</p>
                <p>componentSetName: "{debugInfo.componentSetName}"</p>
                <p>isComponentSet: {debugInfo.isComponentSet ? 'true' : 'false'}</p>
                <p>isAccordion: {debugInfo.isAccordion ? 'true' : 'false'}</p>
                <p>variantChildrenCount: {debugInfo.variantChildrenCount}</p>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex items-center justify-center">
                {renderComponent()}
            </div>
        </div>
    );
}
