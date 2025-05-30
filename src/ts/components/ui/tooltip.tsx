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
        maxWidth: '250px',
        maxHeight: '400px',
        width: 'auto',
        textAlign: 'left',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
    });


// Style for the tooltip arrow
const tooltipArrowStyle = (backgroundColor: string) =>
    css({
        fill: backgroundColor,
        height: 6,
        width: 12,
    });

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipArrow = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Arrow>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow> & {
        backgroundColor?: string;
    }
>(
    (
        {
            className,
            backgroundColor = '#333',
            width = 12,
            height = 6,
            ...props
        },
        ref,
    ) => (
        <TooltipPrimitive.Arrow
            ref={ref}
            width={width}
            height={height}
            className={cn(tooltipArrowStyle(backgroundColor), className)}
            {...props}
        />
    ),
);
TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName;

const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
        backgroundColor?: string;
        textColor?: string;
        showArrow?: boolean;
    }
>(
    (
        {
            className,
            backgroundColor = '#333',
            textColor = '#fff',
            showArrow = true,
            sideOffset = 4,
            children,
            ...props
        },
        ref,
    ) => (
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                tooltipContentStyle(backgroundColor, textColor),
                className,
            )}
            {...props}
        >
            {children}
            {showArrow && <TooltipArrow backgroundColor={backgroundColor} />}
        </TooltipPrimitive.Content>
    ),
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
    TooltipArrow,
};
