import { dealerIdOf } from './access'

export async function requireUser(payload: any, req: Request) {
  const { user } = await payload.auth({ headers: req.headers })
  return user ?? null
}

/** The dealer a request acts for: the user's own dealership, or (for HQ) the one named in the request. */
export async function actingDealer(payload: any, user: any, dealerId?: string | number) {
  const id = user?.role === 'dealer' ? dealerIdOf(user) : dealerId ?? dealerIdOf(user)
  if (!id) return null
  return payload.findByID({ collection: 'dealers', id, depth: 0 }).catch(() => null)
}

/** A dealer may only touch their own pages. */
export function canTouch(user: any, page: any) {
  if (!user) return false
  if (user.role === 'hq') return true
  const pid = page.dealer && typeof page.dealer === 'object' ? page.dealer.id : page.dealer
  return String(pid) === String(dealerIdOf(user))
}
