import * as React from 'react';
import { ThemeContext } from '../themeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { css } from '@emotion/css';
import OpenGraph from 'opengraph-react';

interface TabPreviewTooltipProps {
    title: string;
    url: string;
    lastActive?: number | null;
    children: React.ReactNode;
    delayDuration?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    showArrow?: boolean;
}

// Configuration for OpenGraph - API key placeholder
const OPENGRAPH_CONFIG = {
    apiKey: '', // API key to be filled in later
    // Using 'x' style as requested
    style: 'x' as const,
};

// Style for the preview tooltip with OpenGraph content
const previewTooltipStyle = css({
    maxWidth: '400px',
    width: 'auto',
    '& .og-container': {
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '8px',
    },
    '& .tab-info': {
        paddingTop: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
    },
    '& .tab-info strong': {
        display: 'block',
        marginBottom: '4px',
        fontSize: '0.9rem',
    },
    '& .tab-info .url': {
        display: 'block',
        marginBottom: '4px',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        opacity: 0.8,
    },
    '& .tab-info .meta': {
        display: 'block',
        marginTop: '4px',
        fontSize: '0.9rem',
        opacity: 0.8,
    },
});

// Fallback content when OpenGraph fails or is loading
const formatFallbackTooltip = (
    title: string,
    url: string,
    lastActive?: number | null,
): React.ReactNode => {
    const meta = lastActive
        ? `Last Active: ${new Date(lastActive).toLocaleString()}`
        : null;

    return (
        <div className="tab-info">
            <strong>{title}</strong>
            <span className="url">{url}</span>
            {meta && <span className="meta">{meta}</span>}
        </div>
    );
};

// Content component that handles OpenGraph preview
const PreviewContent: React.FC<{
    title: string;
    url: string;
    lastActive?: number | null;
}> = ({ title, url, lastActive }) => {
    const [showFallback, setShowFallback] = React.useState(false);

    // Show fallback if no API key is configured
    if (!OPENGRAPH_CONFIG.apiKey) {
        return formatFallbackTooltip(title, url, lastActive);
    }

    return (
        <>
            {!showFallback && (
                <div className="og-container">
                    <OpenGraph
                        site={url}
                        appId={OPENGRAPH_CONFIG.apiKey}
                        component={OPENGRAPH_CONFIG.style}
                        onError={() => setShowFallback(true)}
                    />
                </div>
            )}
            <div className="tab-info">
                <strong>{title}</strong>
                <span className="url">{url}</span>
                {lastActive && (
                    <span className="meta">
                        Last Active: {new Date(lastActive).toLocaleString()}
                    </span>
                )}
            </div>
        </>
    );
};

/**
 * An enhanced tooltip component for displaying tab information with OpenGraph site previews
 * - Shows OpenGraph preview of the site using the 'x' component style
 * - Falls back to basic tab info if OpenGraph fails or API key is not configured
 * - Includes title, URL, and optional last active time
 * - Provides consistent styling for enhanced tab tooltips
 */
export const TabPreviewTooltip: React.FC<TabPreviewTooltipProps> = ({
    title,
    url,
    lastActive,
    children,
    delayDuration = 500, // Slightly longer delay for preview loading
    side = 'right',
    align = 'start',
    showArrow = true,
}) => {
    const theme = React.useContext(ThemeContext);

    // Only render tooltip if there's a title and URL to show
    if (!title || !url) {
        return <>{children}</>;
    }

    // Determine if we're using dark theme based on background color
    const isDarkTheme = theme.background === '#1e1e1e';
    const backgroundColor = isDarkTheme ? '#444' : '#333';
    const textColor = '#fff';

    return (
        <Tooltip delayDuration={delayDuration}>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent
                side={side}
                align={align}
                backgroundColor={backgroundColor}
                textColor={textColor}
                showArrow={showArrow}
                className={previewTooltipStyle}
            >
                <PreviewContent
                    title={title}
                    url={url}
                    lastActive={lastActive}
                />
            </TooltipContent>
        </Tooltip>
    );
};
