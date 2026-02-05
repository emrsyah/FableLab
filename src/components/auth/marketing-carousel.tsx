"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MarketingCarouselProps {
  images: {
    src: string;
    alt: string;
  }[];
  autoPlayInterval?: number;
  className?: string;
}

/**
 * Marketing carousel for auth pages right panel.
 * Features auto-play, dot navigation, and smooth transitions.
 */
export function MarketingCarousel({
  images,
  autoPlayInterval = 5000,
  className,
}: MarketingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Auto-play
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [images.length, autoPlayInterval, goToNext]);

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden text-white",
        className,
      )}
    >
      {/* Dot Navigation - Absolute Top, Full Width */}
      {images.length > 1 && (
        <div className="absolute top-6 left-0 right-0 z-10 flex w-full gap-2 px-6">
          {images.map((img, index) => (
            <button
              key={`${img.src}-${index}`}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300 shadow-sm backdrop-blur-sm",
                index === currentIndex
                  ? "bg-white"
                  : "bg-white/40 hover:bg-white/60",
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Carousel */}
      <div className="relative h-full w-full flex-1">
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div
              key={`${image.src}-${index}`}
              className="h-full w-full shrink-0"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="h-full w-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
