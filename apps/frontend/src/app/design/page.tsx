'use client';
import { useState } from 'react';
import ComponentCanvas from '@/components/ComponentCanvas';
import PropertiesPanel from '@/components/PropertiesPanel';
import { ComponentProperties } from '@/types/component';

export default function DesignPage() {
    const [componentProperties, setComponentProperties] = useState<ComponentProperties>({
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
    });

    const handlePropertyChange = (property: keyof ComponentProperties, value: string | number | boolean) => {
        setComponentProperties(prev => ({
            ...prev,
            [property]: value
        }));
    };

    const handleCanvasUpdate = (properties: ComponentProperties) => {
        setComponentProperties(properties);
    };

    return (
        <div className="h-full flex">
            {/* Main Canvas Area */}
            <div className="flex-1 relative">
                <ComponentCanvas 
                    onUpdateProperties={handleCanvasUpdate}
                    externalProperties={componentProperties}
                />
            </div>

            {/* Properties Panel */}
            <div className="w-80 border-l border-border bg-background overflow-y-auto">
                <PropertiesPanel 
                    properties={componentProperties}
                    onPropertyChange={handlePropertyChange}
                />
            </div>
        </div>
    );
}