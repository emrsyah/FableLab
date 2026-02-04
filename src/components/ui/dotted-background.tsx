import React from "react";
import { cn } from "@/lib/utils";

interface DottedBackgroundProps {
  className?: string;
}

export function DottedBackground({ className }: DottedBackgroundProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none opacity-60 mix-blend-multiply",
        className
      )}
      style={{
        backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />
  );
}
