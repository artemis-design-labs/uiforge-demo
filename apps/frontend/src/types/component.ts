export interface ComponentProperties {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    bgColor: string;
    textColor: string;
    cornerRadius: number;
    showLeftIcon: boolean;
    showRightIcon: boolean;
    fontSize: number;
    // New properties
    variants?: ComponentVariant[];
    componentProperties?: Record<string, ComponentPropertyValue>;
    effects?: Effect[];
    strokes?: Stroke[];
    constraints?: Constraints;
}

export interface ComponentVariant {
    id: string;
    name: string;
    properties: Record<string, string>;
}

export interface ComponentPropertyValue {
    type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
    value: string | boolean;
    defaultValue?: string | boolean;
    variantOptions?: string[];
}

export interface Effect {
    type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
    visible: boolean;
    radius?: number;
    color?: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    offset?: {
        x: number;
        y: number;
    };
    spread?: number;
}

export interface Stroke {
    color: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    strokeWeight?: number;
    strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
}

export interface Constraints {
    horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE';
    vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE';
}

export interface FigmaNode {
    id: string;
    name: string;
    type: string;
    children?: FigmaNode[];
    characters?: string;
    fills?: Array<{
        type?: string;
        color?: {
            r: number;
            g: number;
            b: number;
            a: number;
        };
        [key: string]: unknown;
    }>;
    strokes?: Array<{
        type?: string;
        color?: {
            r: number;
            g: number;
            b: number;
            a: number;
        };
        [key: string]: unknown;
    }>;
    strokeWeight?: number;
    strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
    style?: {
        fontSize?: number;
        [key: string]: unknown;
    };
    absoluteBoundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
        [key: string]: unknown;
    };
    cornerRadius?: number;
    componentProperties?: Record<string, {
        type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
        value: string | boolean;
        defaultValue?: string | boolean;
        variantOptions?: string[];
        [key: string]: unknown;
    }>;
    componentId?: string;
    componentSetId?: string;
    effects?: Array<{
        type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
        visible: boolean;
        radius?: number;
        color?: {
            r: number;
            g: number;
            b: number;
            a: number;
        };
        offset?: {
            x: number;
            y: number;
        };
        spread?: number;
        [key: string]: unknown;
    }>;
    constraints?: {
        horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE';
        vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE';
    };
    boundVariables?: Record<string, {
        id: string;
        [key: string]: unknown;
    }>;
    [key: string]: unknown;
}