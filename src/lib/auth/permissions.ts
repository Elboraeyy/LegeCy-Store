

export const AdminPermissions = {
    ALL: 'ALL',
    ORDERS: {
        READ: 'ORDERS_READ',
        MANAGE: 'ORDERS_MANAGE',
        DELETE: 'ORDERS_DELETE'
    },
    INVENTORY: {
        MANAGE: 'INVENTORY_MANAGE'
    },
    PRODUCTS: {
        MANAGE: 'PRODUCTS_MANAGE'
    },
    USERS: {
        READ: 'USERS_READ',
        MANAGE: 'USERS_MANAGE'
    }
} as const;

export type AdminPermission = string;

/**
 * Parses a comma-separated permission string into an array.
 */
export function parsePermissions(permissionsString: string | null | undefined): string[] {
    if (!permissionsString) return [];
    return permissionsString.split(',').map(p => p.trim()).filter(Boolean);
}

/**
 * Checks if a user (or role) has the required permission(s).
 * If required is an array, ANY of them makes it pass (OR logic).
 */
export function hasPermission(
    role: { name: string; permissions: string } | null | undefined, 
    required: string | string[]
): boolean {
    if (!role) return false;

    // 1. Super Admin Bypass
    if (role.name === 'super_admin' || role.permissions === 'ALL') return true;

    // 2. Parse User Permissions
    const userPermissions = parsePermissions(role.permissions);
    
    // 3. Normalize Requirements
    const requirements = Array.isArray(required) ? required : [required];

    // 4. Check (OR logic: User needs at least one of the required possibilities)
    return requirements.some(req => userPermissions.includes(req));
}
