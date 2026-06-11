import type { Access, FieldAccess } from 'payload'
import type { User } from '@/payload.types'

type Role = NonNullable<User['roles']>[number]

export const hasRole = (user: unknown, role: Role): boolean => Boolean((user as User | null)?.roles?.includes(role))

// The multi-tenant plugin wraps each access of the users collection (withTenantAccess) and for
// non-super-admins adds the condition "own account OR users of shared tenants",
// so admin does not need its own tenant restriction here — just `true`.
export const readUsers: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole(user, 'super-admin') || hasRole(user, 'admin')) return true
  return { id: { equals: user.id } }
}

export const updateUsers: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole(user, 'super-admin')) return true
  return { id: { equals: user.id } }
}

export const superAdminOnly: Access = ({ req: { user } }) => hasRole(user, 'super-admin')

export const superAdminOnlyField: FieldAccess = ({ req: { user } }) => hasRole(user, 'super-admin')
