/** Role-based access helpers. HQ sees everything; a dealer only sees documents that belong to their dealership. */
export const dealerIdOf = (user: any): string | number | null =>
  user?.dealer && typeof user.dealer === 'object' ? user.dealer.id : user?.dealer ?? null

export const isHQ = ({ req: { user } }: any) => user?.role === 'hq'

export const dealerScoped = ({ req: { user } }: any) => {
  if (!user) return false
  if (user.role === 'hq') return true
  const id = dealerIdOf(user)
  return id ? { dealer: { equals: id } } : false
}

export const hiddenFromDealers = ({ user }: any) => user?.role === 'dealer'
