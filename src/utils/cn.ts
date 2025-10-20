import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes with clsx and tailwind-merge.
 * Used throughout the UI components for conditional and dynamic class names.
 *
 * @param inputs - ClassValue inputs (strings, objects, arrays)
 * @returns Merged and deduplicated class string
 *
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500') // => conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
