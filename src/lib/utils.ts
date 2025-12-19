import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to yyyy/MM/dd HH:mm format
 */
export function formatDate(date: string | Date): string {
  const dateObj = new Date(date)

  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')

  return `${year}/${month}/${day} ${hours}:${minutes}`
}

/**
 * Format date to yyyy/MM/dd HH:mm format with timezone consideration
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return formatDate(date)
}
