import * as React from "react";
import { TooltipProvider as Provider } from "./tooltip";

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <Provider delayDuration={300} skipDelayDuration={0}>
      {children}
    </Provider>
  );
};