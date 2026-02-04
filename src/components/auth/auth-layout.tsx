"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

interface AuthLayoutProps {
  children: React.ReactNode
  marketingContent?: React.ReactNode
  className?: string
}

/**
 * Split-screen layout for authentication pages.
 * Left panel (70%): Form content
 * Right panel (30%): Marketing/carousel content (hidden on mobile)
 */
export function AuthLayout({
  children,
  marketingContent,
  className,
}: AuthLayoutProps) {
  return (
    <div
      className={cn(
        "flex h-screen w-full overflow-hidden bg-[#EDF3FD]",
        className
      )}
    >
      {/* Left Panel - Form */}
      <div className="flex w-full flex-col justify-center p-2 lg:w-[65%]">
        {/* Outer layer - subtle border/shadow effect */}
        <div className="h-full w-full rounded-3xl bg-white/70 p-1 shadow-sm">
          {/* Inner layer - pure white */}
          <div className="flex h-full w-full flex-col rounded-2xl bg-white p-4 lg:p-6">
            {/* Logo area - top left */}
            <div className="mb-auto">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100">
                  <svg
                    className="size-5 text-blue-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M9 3L5 7l4 4" />
                    <path d="M15 3l4 4-4 4" />
                    <path d="M12 21V9" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-gray-900">FableLab AI</span>
              </div>
            </div>
            {/* Form content - centered */}
            <div className="my-auto">
              <div className="mx-auto w-full max-w-xl">
                {children}
              </div>
            </div>
            {/* Bottom spacer for balance */}
            <div className="mt-auto" />
          </div>
        </div>
      </div>

      {/* Right Panel - Marketing (hidden on mobile/tablet) */}
      <div className="hidden p-2 lg:flex lg:w-[35%]">
        <div className="relative h-full w-full overflow-hidden rounded-3xl bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
          {marketingContent}
        </div>
      </div>
    </div>
  )
}
