import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Parse socialLinks from DB: stored as JSON string; returns array of { platform, url } for frontend */
export function parseSocialLinks(
  value: string | { platform?: string | null; url?: string | null }[] | null | undefined,
): { platform: string; url: string }[] {
  if (value == null || value === '') return []
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      if (!Array.isArray(parsed)) return []
      return parsed.map((item) => ({
        platform: typeof item?.platform === 'string' ? item.platform : '',
        url: typeof item?.url === 'string' ? item.url : '',
      }))
    } catch {
      return []
    }
  }
  if (Array.isArray(value)) {
    return value.map((item) => ({
      platform: typeof item?.platform === 'string' ? item.platform : '',
      url: typeof item?.url === 'string' ? item.url : '',
    }))
  }
  return []
}
