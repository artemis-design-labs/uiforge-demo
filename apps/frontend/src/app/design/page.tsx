'use client';
import { useAppSelector } from '@/store/hooks';
import { ComponentRenderer, isComponentSupported, getSupportedComponentNames } from '@/components/figma-components';

export default function DesignPage() {
    const { selectedComponent, selectedComponentName, selectedComponentType } = useAppSelector((state) => state.figma);

    const renderContent = () => {
        // No component selected
        if (!selectedComponent || !selectedComponentName) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="text-muted-foreground mb-4">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                        <p className="text-lg font-medium mb-2">No Component Selected</p>
                        <p className="text-sm opacity-75">
                            Load a Figma file and select a component from the sidebar to preview it here.
                        </p>
                    </div>

                    {/* Show supported components */}
                    <div className="mt-8 text-left">
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Supported Components:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {getSupportedComponentNames().map((name) => (
                                <span
                                    key={name}
                                    className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground"
                                >
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        // Component selected - render it
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <ComponentRenderer componentName={selectedComponentName} />
            </div>
        );
    };

    return (
        <div className="h-full w-full bg-[#1a1a1a] flex items-center justify-center">
            {/* Main rendering area with subtle grid background */}
            <div
                className="w-full h-full"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                }}
            >
                {renderContent()}
            </div>
        </div>
    );
}
