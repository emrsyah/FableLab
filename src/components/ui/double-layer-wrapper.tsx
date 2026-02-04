import React from "react";
import { cn } from "@/lib/utils";

interface DoubleLayerWrapperProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export function DoubleLayerWrapper({ 
  children, 
  className,
  innerClassName 
}: DoubleLayerWrapperProps) {
  return (
    // Outer Layer
    <div className={cn("h-full w-full rounded-3xl bg-white/70 p-1 shadow-sm", className)}>
      {/* Inner Layer */}
      <div className={cn(
        "relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white border border-white/50",
        innerClassName
      )}>
        {children}
      </div>
    </div>
  );
}
