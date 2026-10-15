/** A page is live only if published, started, and not past its end date. Checked on every request, so an offer never shows late. */
export function liveState(page: any, now = new Date()): 'live' | 'scheduled' | 'ended' | 'offline' {
  if (page._status !== 'published') return 'offline'
  const o = page.offer ?? {}
  if (o.endsAt && new Date(o.endsAt) <= now) return 'ended'
  if (o.startsAt && new Date(o.startsAt) > now) return 'scheduled'
  return 'live'
}
