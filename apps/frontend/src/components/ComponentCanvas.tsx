'use client';
import dynamic from 'next/dynamic';
import { ComponentProperties } from '@/types/component';

// Dynamically import the client-only canvas component
const ComponentCanvasClient = dynamic(
    () => import('./ComponentCanvasClient'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500 text-sm">Loading canvas...</div>
            </div>
        )
    }
);

interface ComponentCanvasProps {
    onUpdateProperties?: (properties: ComponentProperties) => void;
    externalProperties?: ComponentProperties;
}

const ComponentCanvas: React.FC<ComponentCanvasProps> = (props) => {
    return <ComponentCanvasClient {...props} />;
};

export default ComponentCanvas;