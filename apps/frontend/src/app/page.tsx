'use client';
import { useAppSelector } from '@/store/hooks';
import { FigmaAccordionDarkMode } from '@/components/figma-components/FigmaAccordionDarkMode';

export default function HomePage() {
    const { selectedComponent, selectedComponentName, selectedComponentType } = useAppSelector((state) => state.figma);

    // Render component based on selection
    const renderComponent = () => {
        if (!selectedComponent) {
            return (
                <div className="text-white/30 text-sm">
                    Select a component from the tree to preview it
                </div>
            );
        }

        // Check if this is the Accordion/DarkMode component set
        const isDarkModeAccordion = selectedComponentName === 'Accordion/DarkMode';
        const isLightModeAccordion = selectedComponentName === 'Accordion/LightMode';

        if (isDarkModeAccordion) {
            return (
                <div className="flex flex-col items-center gap-6">
                    {/* Render the Figma-extracted component */}
                    <FigmaAccordionDarkMode
                        heading="Heading"
                        secondaryHeading="Secondary heading"
                    />

                    {/* Info label */}
                    <div className="text-white/50 text-xs mt-2 text-center">
                        <p>Component: {selectedComponentName}</p>
                        <p className="text-white/30 mt-1">Generated from Figma Node ID: 1:46</p>
                    </div>
                </div>
            );
        }

        if (isLightModeAccordion) {
            return (
                <div className="flex flex-col items-center gap-6">
                    {/* Render the same component for LightMode (same design) */}
                    <FigmaAccordionDarkMode
                        heading="Heading"
                        secondaryHeading="Secondary heading"
                    />

                    {/* Info label */}
                    <div className="text-white/50 text-xs mt-2 text-center">
                        <p>Component: {selectedComponentName}</p>
                        <p className="text-white/30 mt-1">Generated from Figma Node ID: 1:136</p>
                    </div>
                </div>
            );
        }

        // For other components, show a placeholder
        return (
            <div className="text-white/50 text-sm text-center">
                <p className="mb-2">Component: {selectedComponentName || selectedComponent}</p>
                <p className="text-xs">Type: {selectedComponentType || 'Unknown'}</p>
                <p className="text-xs mt-4">React rendering for this component type is not yet implemented.</p>
            </div>
        );
    };

    // Debug info
    const debugInfo = {
        selectedComponent,
        selectedComponentName,
        selectedComponentType,
    };

    return (
        <div className="h-full w-full flex flex-col bg-[#1e1e1e] overflow-auto p-8">
            {/* VERY VISIBLE BANNER - to verify deployment */}
            <div className="mb-4 p-4 bg-red-600 rounded text-white text-center font-bold text-lg">
                🚀 NEW VERSION DEPLOYED - Jan 18, 2026 🚀
            </div>

            {/* Debug Panel */}
            <div className="mb-4 p-3 bg-yellow-900/50 rounded text-xs text-yellow-200 font-mono">
                <p className="font-bold mb-2">DEBUG INFO:</p>
                <p>selectedComponent: {debugInfo.selectedComponent || 'null'}</p>
                <p>selectedComponentName: "{debugInfo.selectedComponentName || ''}"</p>
                <p>selectedComponentType: {debugInfo.selectedComponentType || 'null'}</p>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex items-center justify-center">
                {renderComponent()}
            </div>
        </div>
    );
}
