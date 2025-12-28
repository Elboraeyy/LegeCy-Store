

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
    },
    TEAM: {
        READ: 'TEAM_READ',
        MANAGE: 'TEAM_MANAGE',
        DELETE: 'TEAM_DELETE'
    },
    DASHBOARD: {
        VIEW: 'DASHBOARD_VIEW'
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
 * 
 * Role Hierarchy:
 * 1. owner - Full access to everything (highest level)
 * 2. super_admin - Full access EXCEPT team management
 * 3. other roles - Based on explicit permissions
 */
export function hasPermission(
    role: { name: string; permissions: string } | null | undefined, 
    required: string | string[]
): boolean {
    if (!role) return false;

    // Normalize Requirements
    const requirements = Array.isArray(required) ? required : [required];
    
    // 1. Owner Bypass - Full access to everything
    if (role.name === 'owner') return true;

    // 2. Super Admin - Full access EXCEPT team management
    if (role.name === 'super_admin' || role.permissions === 'ALL') {
        // Check if ALL of the required permissions are team-related
        const teamPermissions = ['TEAM_READ', 'TEAM_MANAGE', 'TEAM_DELETE'];
        
        // If requesting team access specifically, deny for super_admin
        // (They can still see team page but can't add/edit/delete)
        if (requirements.every(req => teamPermissions.includes(req))) {
            return false;
        }
        
        return true;
    }

    // 3. Parse User Permissions for other roles
    const userPermissions = parsePermissions(role.permissions);

    // 4. Check (OR logic: User needs at least one of the required possibilities)
    return requirements.some(req => userPermissions.includes(req));
}
