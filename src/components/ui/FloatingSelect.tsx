// FloatingSelect.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FloatingSelectProps {
  label: string;
  value?: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
  onTouched?: () => void;
}

export function FloatingSelect({
  label,
  value,
  onValueChange,
  placeholder = ' ',
  children,
  className,
  error,
  onTouched,
}: FloatingSelectProps) {
  const hasValue = Boolean(value);
  const [open, setOpen] = React.useState(false);

  // ✅ track if a value was selected while dropdown is open
  const selectedWhileOpenRef = React.useRef(false);

  return (
    <div className={cn('relative w-full', className)}>
      <Select
        value={value}
        onValueChange={(v) => {
          selectedWhileOpenRef.current = true;
          onValueChange(v);
        }}
        onOpenChange={(isOpen) => {
          // reset flag on open
          if (isOpen) {
            selectedWhileOpenRef.current = false;
          }

          // closing without selecting anything
          if (open && !isOpen && !selectedWhileOpenRef.current && !value) {
            onTouched?.();
          }

          setOpen(isOpen);
        }}
      >
        <SelectTrigger
          className={cn(
            'peer h-10 w-full rounded-md border border-input bg-background px-3 pt-4 text-sm outline-none',
            'focus:border-none focus:ring-1 focus:ring-primary',
            error ? 'border-red-500' : '',
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent className="max-h-40 overflow-y-scroll scrollbar-visible">
          {children}
        </SelectContent>
      </Select>

      <label
        className={cn(
          'pointer-events-none absolute left-3 px-1 transition-all',
          'text-muted-foreground bg-background',
          hasValue ? '-top-2 text-xs font-semibold text-primary' : 'top-2.5 text-sm',
          'peer-focus:-top-2 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-primary'
        )}
      >
        {label}
      </label>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
