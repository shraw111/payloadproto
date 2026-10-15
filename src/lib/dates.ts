/** Date helpers for offers. All times are UK local, kept simple for the demo. */
export const money = (n: number) => `£${n.toLocaleString('en-GB')}`

export function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 0, 0)
  return x
}

/** The coming Sunday at 23:59 (today, if today is Sunday). */
export function thisSunday(now = new Date()): Date {
  const x = new Date(now)
  x.setDate(x.getDate() + ((7 - x.getDay()) % 7))
  return endOfDay(x)
}

export function dateLabel(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function shortDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
/** "31 October" or "31st oct" → the next such date at 23:59, or null. */
export function parseDayMonth(text: string, now = new Date()): Date | null {
  const m = text.toLowerCase().match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/)
  if (!m) return null
  const month = MONTHS.findIndex((n) => n.startsWith(m[2]))
  const d = new Date(now.getFullYear(), month, Number(m[1]), 23, 59)
  if (d < now) d.setFullYear(d.getFullYear() + 1)
  return d
}
