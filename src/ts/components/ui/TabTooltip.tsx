import * as React from "react";
import { TooltipWrapper } from "./TooltipWrapper";

interface TabTooltipProps {
  title: string;
  url: string;
  lastActive?: number | null;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

/**
 * A specialized tooltip component for displaying tab information with a formatted layout
 * - Shows title, URL, and optional last active time in a structured format
 * - Provides consistent styling for tab tooltips across the application
 */
export const TabTooltip: React.FC<TabTooltipProps> = ({
  title,
  url,
  lastActive,
  children,
  side = "right",
  align = "start",
}) => {
  const lastActiveStr = lastActive 
    ? `\nLast Active: ${new Date(lastActive).toLocaleString()}`
    : '';
  
  const tooltipContent = title + '\n' + url + lastActiveStr;

  return (
    <TooltipWrapper
      tip={tooltipContent}
      isTabTooltip={true}
      side={side}
      align={align}
    >
      {children}
    </TooltipWrapper>
  );
};