import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { css } from "@emotion/css";
import { cn } from "./utils";

const triggerStyle = (color: string) => css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  border: `1px solid ${color}`,
  borderRadius: "3px",
  background: "transparent",
  cursor: "pointer",
  fontSize: "0.75rem",
  padding: "2px 4px",
  width: 90,
  color: color,
  height: "1.5rem",
  outline: "none",
});

const contentStyle = (color: string) => css({
  overflow: "hidden",
  backgroundColor: "#fff",
  borderRadius: "3px",
  boxShadow: "0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)",
  zIndex: 50,
  fontSize: "0.75rem",
  color: "#222",
  border: `1px solid ${color}`,
});

const itemStyle = css({
  fontSize: "0.75rem",
  padding: "4px 8px",
  position: "relative",
  display: "flex",
  cursor: "pointer",
  alignItems: "center",
  userSelect: "none",
  "&:hover": {
    backgroundColor: "#f5f5f5",
  },
  "&[data-highlighted]": {
    backgroundColor: "#f0f0f0",
    outline: "none",
  },
});

export interface SelectProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> {
  color?: string;
}

export const Select = SelectPrimitive.Root;

export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { color: string }
>(({ className, children, color, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(triggerStyle(color), className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon>
      <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.26618 11.9026 7.38064 11.95 7.49999 11.95C7.61933 11.95 7.73379 11.9026 7.81819 11.8182L10.0682 9.56819Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
      </svg>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & { color: string }
>(({ className, children, color, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(contentStyle(color), className)}
      position="popper"
      {...props}
    >
      <SelectPrimitive.Viewport>
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(itemStyle, className)}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;