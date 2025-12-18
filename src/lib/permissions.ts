export enum Role {
  ADMIN = 'ADMIN',
  POSTER = 'POSTER'
}

export const hasRole = (userRole: Role | undefined, requiredRole: Role): boolean => {
  if (!userRole) return false
  if (userRole === Role.ADMIN) return true
  return userRole === requiredRole
}

export const isAdmin = (userRole: Role | undefined): boolean => {
  return userRole === Role.ADMIN
}

export const canManagePosts = (userRole: Role | undefined): boolean => {
  return hasRole(userRole, Role.POSTER)
}

export const canManageAllPosts = (userRole: Role | undefined): boolean => {
  return isAdmin(userRole)
}

export const canManageUsers = (userRole: Role | undefined): boolean => {
  return isAdmin(userRole)
}

export const canAccessAdmin = (userRole: Role | undefined): boolean => {
  return isAdmin(userRole)
}