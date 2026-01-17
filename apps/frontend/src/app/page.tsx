'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedVariantId } from '@/store/figmaSlice';
import { AccordionItem, ACCORDION_VARIANTS, AccordionProps } from '@/components/figma-components/AccordionComponent';

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

    return (
        <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] overflow-auto p-8">
            {renderComponent()}
        </div>
    );
}
