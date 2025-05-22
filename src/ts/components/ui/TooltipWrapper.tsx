import * as React from "react";
import { ThemeContext } from "../themeContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

interface TooltipWrapperProps {
  tip: string;
  children: React.ReactNode;
  delayDuration?: number;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  tip,
  children,
  delayDuration = 300,
  side = "top",
  align = "center",
}) => {
  const theme = React.useContext(ThemeContext);
  
  // Only render tooltip if there's a tip to show
  if (!tip) {
    return <>{children}</>;
  }

  // Determine if we're using dark theme based on background color
  const isDarkTheme = theme.background === "#1e1e1e";
  const backgroundColor = isDarkTheme ? "#444" : "#333";
  const textColor = "#fff";

  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent 
        side={side} 
        align={align} 
        backgroundColor={backgroundColor} 
        textColor={textColor}
      >
        {tip}
      </TooltipContent>
    </Tooltip>
  );
};