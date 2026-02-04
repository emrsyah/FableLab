import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface HangingBannerProps {
  text: string;
  className?: string;
  onAnimationComplete?: () => void;
}

export function HangingBanner({ text, className, onAnimationComplete }: HangingBannerProps) {
  return (
    <div className={cn("flex justify-center mb-12 relative z-30", className)}>
        <div className="relative min-w-[300px] px-12 py-4 flex items-center justify-center">
            {/* SVG Background Layer */}
            <div className="absolute inset-0 w-full h-full drop-shadow-[0_4px_6px_rgba(59,130,246,0.25)]">
               <svg 
                  viewBox="0 0 400 60" 
                  preserveAspectRatio="none" 
                  className="w-full h-full"
                  width="100%" 
                  height="100%"
                >
                  <defs>
                        <radialGradient id="banner-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" stopColor="#6FA0F6" />
                            <stop offset="48.96%" stopColor="#568DEF" />
                            <stop offset="100%" stopColor="#3C7AE8" />
                        </radialGradient>
                    </defs>
                  <path 
                    d="M 20 0 
                       L 380 0 
                       Q 400 0 395 15 
                       L 385 50 
                       Q 380 60 360 60 
                       L 40 60 
                       Q 20 60 15 50 
                       L 5 15 
                       Q 0 0 20 0 Z" 
                    fill="url(#banner-gradient)" 
                  />
               </svg>
            </div>
            
            {/* Text Content */}
            <h2 className="relative z-10 text-white font-bold text-xl text-center">
               {text}
            </h2>
            
             {/* Connector Lines */}
             <motion.div 
               className="absolute top-4 left-1/2 -translate-x-1/2 w-[200px] flex justify-between px-8 h-[124px] -z-10"
               initial={{ scaleY: 0, opacity: 0 }}
               animate={{ scaleY: 1, opacity: 1 }}
               style={{ originY: 0 }}
               transition={{ duration: 0.8, ease: "easeIn" }}
               onAnimationComplete={() => onAnimationComplete?.()}
             >
               <div className="w-4 h-full bg-[#dbeafe] shadow-inner border-x border-[#bfdbfe]"></div>
               <div className="w-4 h-full bg-[#dbeafe] shadow-inner border-x border-[#bfdbfe]"></div>
            </motion.div>
        </div>
      </div>
  );
}
