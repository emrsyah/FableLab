"use client";

import { cn } from "@/lib/utils";

interface IosLoaderProps {
  className?: string; // For sizing and positioning
  color?: string; // For bar color
}

export function IosLoader({ className, color = "#326BFF" }: IosLoaderProps) {
  const bars = Array.from({ length: 12 });

  return (
    <div className={cn("relative w-10 h-10", className)}>
      {bars.map((_, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-0 w-[8%] h-[28%] -ml-[4%] rounded-full origin-[50%_179%]"
          style={{
            transform: `rotate(${i * 30}deg)`,
            backgroundColor: color,
            animation: "ios-spinner 1.2s linear infinite",
            animationDelay: `${-1.1 + i * 0.1}s`,
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes ios-spinner {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0.15;
          }
        }
      `}</style>
    </div>
  );
}
