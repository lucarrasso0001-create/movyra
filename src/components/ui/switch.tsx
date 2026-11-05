import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  className?: string;
}

export const Switch = ({ checked, onCheckedChange, className }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
      checked ? "bg-primary" : "bg-muted",
      className,
    )}
  >
    <span className={cn("inline-block h-5 w-5 rounded-full bg-background shadow transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
  </button>
);
