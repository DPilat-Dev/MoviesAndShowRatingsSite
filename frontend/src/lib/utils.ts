import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getCurrentYear(): number {
  return new Date().getFullYear()
}

export function generateYears(startYear: number = 2020): number[] {
  const currentYear = getCurrentYear()
  const years = []
  for (let year = startYear; year <= currentYear; year++) {
    years.push(year)
  }
  return years.reverse()
}