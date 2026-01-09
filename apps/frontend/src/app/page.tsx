'use client';
import ComponentCanvas from '@/components/ComponentCanvas';
import { useComponentProperties } from '@/contexts/ComponentPropertiesContext';

export default function HomePage() {
    const { componentProperties, setComponentProperties } = useComponentProperties();

    const handleCanvasUpdate = (properties: typeof componentProperties) => {
        setComponentProperties(properties);
    };

    return (
        <div className="h-full w-full">
            {/* Main Canvas Area - Properties are now in RightSidebar */}
            <ComponentCanvas
                onUpdateProperties={handleCanvasUpdate}
                externalProperties={componentProperties}
            />
        </div>
    );
}