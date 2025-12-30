import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FloatingSelectProps {
  label: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}

export function FloatingSelect({
  label,
  value,
  onValueChange,
  placeholder = " ",
  children,
  className,
}: FloatingSelectProps) {
  const hasValue = Boolean(value);

  return (
    <div className={cn("relative w-full", className)}>
      <Select value={value} onValueChange={onValueChange}>
        {/* <SelectTrigger
          className={cn(
            "peer h-10 w-full rounded-md border border-input bg-background px-3 pt-4 text-sm",
            "focus:border-primary",
            "focus:ring-0 focus:outline-none focus:shadow-none",
            "focus-visible:ring-0 focus-visible:outline-none focus-visible:shadow-none"
          )}
        > */}
        <SelectTrigger
          className={cn(
            "peer h-10 w-full rounded-md border border-input bg-background px-3 pt-4 text-sm outline-none",
          "focus:border-none focus:ring-1 focus:ring-primary",
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>{children}</SelectContent>
      </Select>

      <label
        className={cn(
          "pointer-events-none absolute left-3 px-1 transition-all",
          "text-muted-foreground bg-background",
          hasValue
            ? "-top-2 text-xs font-semibold text-primary"
            : "top-2.5 text-sm",
          "peer-focus:-top-2 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-primary"
        )}
      >
        {label}
      </label>
    </div>
  );
}