import { cn } from "@/lib/utils"

interface AuthDividerProps {
  text?: string
  className?: string
}

/**
 * Horizontal divider with centered text, typically used for "or" separator.
 */
export function AuthDivider({ text = "or", className }: AuthDividerProps) {
  return (
    <div className={cn("relative flex items-center py-4", className)}>
      <div className="flex-1 border-t border-gray-200" />
      <span className="px-4 text-sm text-gray-500">{text}</span>
      <div className="flex-1 border-t border-gray-200" />
    </div>
  )
}
