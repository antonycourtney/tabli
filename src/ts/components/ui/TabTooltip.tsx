import * as React from "react";
import { ThemeContext } from '../themeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { css } from '@emotion/css';

interface TabTooltipProps {
  title: string;
  url: string;
  lastActive?: number | null;
  children: React.ReactNode;
  delayDuration?: number;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  showArrow?: boolean;
}

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

// Helper function to format tab tooltip content
const formatTabTooltip = (title: string, url: string, lastActive?: number | null): React.ReactNode => {
    const meta = lastActive 
        ? `Last Active: ${new Date(lastActive).toLocaleString()}`
        : null;

    return (
        <>
            <strong>{title}</strong>
            <span className="url">{url}</span>
            {meta && <span className="meta">{meta}</span>}
        </>
    );
};

/**
 * A specialized tooltip component for displaying tab information with a formatted layout
 * - Shows title, URL, and optional last active time in a structured format
 * - Provides consistent styling for tab tooltips across the application
 * - Includes an arrow pointing to the triggering element
 */
export const TabTooltip: React.FC<TabTooltipProps> = ({
  title,
  url,
  lastActive,
  children,
  delayDuration = 300,
  side = "right",
  align = "start",
  showArrow = true
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

  const tooltipContent = formatTabTooltip(title, url, lastActive);

  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        backgroundColor={backgroundColor}
        textColor={textColor}
        showArrow={showArrow}
        className={tabTooltipStyle}
      >
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
};