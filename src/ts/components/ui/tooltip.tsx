import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { css } from '@emotion/css';
import { cn } from './utils';

// Styled with Emotion CSS to match existing styles
const tooltipContentStyle = (backgroundColor: string, textColor: string) =>
    css({
        zIndex: 50,
        overflow: 'hidden',
        borderRadius: '3px',
        padding: '6px 10px',
        fontSize: '1rem',
        lineHeight: '1',
        color: textColor,
        backgroundColor: backgroundColor,
        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
        maxWidth: '200px',
        textAlign: 'center',
    });

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
        backgroundColor?: string;
        textColor?: string;
    }
>(
    (
        {
            className,
            backgroundColor = '#333',
            textColor = '#fff',
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
                className,
            )}
            {...props}
        />
    ),
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
