import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { css } from '@emotion/css';
import { cn } from './utils';

// Styled with Emotion CSS to match existing styles
const tooltipContentStyle = (backgroundColor: string, textColor: string) =>
    css({
        zIndex: 50,
        overflow: 'visible',
        borderRadius: '4px',
        padding: '8px 12px',
        fontSize: '0.85rem',
        lineHeight: '1.4',
        color: textColor,
        backgroundColor: backgroundColor,
        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)',
        maxWidth: '500px',
        maxHeight: '400px',
        width: 'auto',
        textAlign: 'left',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
    });

// Style specifically for tab tooltips with title, URL, and last active time
const tabTooltipStyle = css({
    '& strong': {
        display: 'block',
        marginBottom: '4px',
        fontSize: '0.9rem',
    },
    '& .url': {
        display: 'block',
        marginBottom: '4px',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
    },
    '& .meta': {
        display: 'block',
        marginTop: '4px',
        fontSize: '0.9rem',
        opacity: 0.8,
    },
});

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
        backgroundColor?: string;
        textColor?: string;
        tabTooltip?: boolean;
    }
>(
    (
        {
            className,
            backgroundColor = '#333',
            textColor = '#fff',
            tabTooltip = false,
            sideOffset = 4,
            ...props
        },
        ref,
    ) => (
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                tooltipContentStyle(backgroundColor, textColor),
                tabTooltip ? tabTooltipStyle : null,
                className,
            )}
            {...props}
        />
    ),
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
