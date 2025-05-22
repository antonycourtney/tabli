import * as React from 'react';
import { ThemeContext } from '../themeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

interface TooltipWrapperProps {
    tip: string;
    children: React.ReactNode;
    delayDuration?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    isTabTooltip?: boolean;
    showArrow?: boolean;
}

// Helper function to format tab tooltip content
const formatTabTooltip = (content: string): React.ReactNode => {
    if (!content.includes('\n')) {
        return content;
    }

    const parts = content.split('\n');
    if (parts.length < 2) return content;

    const title = parts[0];
    const url = parts[1];
    const meta = parts.slice(2).join('\n');

    return (
        <>
            <strong>{title}</strong>
            <span className="url">{url}</span>
            {meta && <span className="meta">{meta}</span>}
        </>
    );
};

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
    tip,
    children,
    delayDuration = 300,
    side = 'top',
    align = 'center',
    isTabTooltip = false,
    showArrow = true,
}) => {
    const theme = React.useContext(ThemeContext);

    // Only render tooltip if there's a tip to show
    if (!tip) {
        return <>{children}</>;
    }

    // Determine if we're using dark theme based on background color
    const isDarkTheme = theme.background === '#1e1e1e';
    const backgroundColor = isDarkTheme ? '#444' : '#333';
    const textColor = '#fff';

    // Automatically detect if this is a tab tooltip based on content format
    // Tab tooltips typically have title, URL, and optionally last active time
    const autoDetectTabTooltip =
        !isTabTooltip &&
        tip.includes('\n') &&
        (tip.includes('http://') ||
            tip.includes('https://') ||
            tip.includes('Last Active:'));

    const isFormattedTabTooltip = isTabTooltip || autoDetectTabTooltip;
    const tooltipContent = isFormattedTabTooltip ? formatTabTooltip(tip) : tip;

    return (
        <Tooltip delayDuration={delayDuration}>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent
                side={side}
                align={align}
                backgroundColor={backgroundColor}
                textColor={textColor}
                tabTooltip={isFormattedTabTooltip}
                showArrow={showArrow}
            >
                {tooltipContent}
            </TooltipContent>
        </Tooltip>
    );
};
