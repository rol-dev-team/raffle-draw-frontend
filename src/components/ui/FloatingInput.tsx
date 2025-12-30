import * as React from "react";
import { cn } from "@/lib/utils";

interface FloatingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const FloatingInput = React.forwardRef<
  HTMLInputElement,
  FloatingInputProps
>(({ label, className, ...props }, ref) => {
  return (
    <div className="relative w-full">
        <input
            ref={ref}
            placeholder=" "
            className={cn(
            "peer h-11 w-full rounded-md border border-input bg-background",
            "px-3 pt-5 pb-1 text-sm leading-5",
            "focus:border-primary focus:ring-0 focus:outline-none focus:shadow-none",
            "focus-visible:ring-0 focus-visible:outline-none focus-visible:shadow-none",
            className
            )}
            {...props}
        />
        <label
          className="
            pointer-events-none absolute left-3
            top-3 text-sm text-muted-foreground
            transition-all duration-200
            
            /* Current logic: label is in middle if placeholder is shown */
            peer-placeholder-shown:top-3
            peer-placeholder-shown:text-sm
            peer-placeholder-shown:font-normal

            /* NEW LOGIC: Move to top if focused OR if the input is NOT empty */
            peer-focus:-top-2
            peer-focus:text-xs
            peer-focus:font-semibold
            peer-focus:text-primary
            peer-focus:bg-background

            /* Added this: Keeps label at top even after focus is lost if text exists */
            peer-[:not(:placeholder-shown)]:-top-2
            peer-[:not(:placeholder-shown)]:text-xs
            peer-[:not(:placeholder-shown)]:font-semibold
            
            px-1
          "
        >
          {label}
        </label>
    </div>

  );
});

FloatingInput.displayName = "FloatingInput";