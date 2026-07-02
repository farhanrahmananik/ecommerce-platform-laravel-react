const adminRoleKeys = new Set(['super_admin', 'store_manager', 'admin'])

function normalizeRole(role) {
  if (typeof role === 'string') {
    return role.toLowerCase().trim().replace(/[\s-]+/g, '_')
  }

  const roleKey = role?.slug || role?.name

  return typeof roleKey === 'string'
    ? roleKey.toLowerCase().trim().replace(/[\s-]+/g, '_')
    : null
}

export function getUserRoleKeys(user) {
  const roles = [
    user?.role,
    user?.role_slug,
    ...(Array.isArray(user?.roles) ? user.roles : []),
  ]

  return roles.map(normalizeRole).filter(Boolean)
}

export function hasRoleData(user) {
  return Boolean(
    user &&
      (Object.prototype.hasOwnProperty.call(user, 'role') ||
        Object.prototype.hasOwnProperty.call(user, 'role_slug') ||
        Object.prototype.hasOwnProperty.call(user, 'roles')),
  )
}

export function isAdminUser(user) {
  return getUserRoleKeys(user).some((role) => adminRoleKeys.has(role))
}

export function getPrimaryRoleLabel(user) {
  const role = user?.roles?.[0] || user?.role || user?.role_slug
  const roleName = typeof role === 'string' ? role : role?.name || role?.slug

  if (!roleName) {
    return 'Customer'
  }

  return roleName
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}
