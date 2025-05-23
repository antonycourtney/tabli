declare module 'opengraph-react' {
    import * as React from 'react';

    export interface OpenGraphProps {
        site: string;
        appId: string;
        component?: 'x' | 'card' | 'compact' | 'large';
        onError?: () => void;
        onLoad?: () => void;
        className?: string;
    }

    const OpenGraph: React.FC<OpenGraphProps>;
    export default OpenGraph;
}
