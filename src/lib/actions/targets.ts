'use server';

import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';
import { promises as fs } from 'fs';
import path from 'path';

// Target types
export interface AnalyticsTargets {
    revenueTarget: number;
    ordersTarget: number;
    customersTarget: number;
    aovTarget: number;
    fulfillmentRateTarget: number;
    repeatCustomerRateTarget: number;
}

const DEFAULT_TARGETS: AnalyticsTargets = {
    revenueTarget: 100000,
    ordersTarget: 500,
    customersTarget: 200,
    aovTarget: 500,
    fulfillmentRateTarget: 90,
    repeatCustomerRateTarget: 30
};

const TARGETS_FILE = path.join(process.cwd(), 'data', 'analytics-targets.json');

// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = path.join(process.cwd(), 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Get targets from file
export async function getAnalyticsTargets(): Promise<AnalyticsTargets> {
    try {
        await ensureDataDir();
        const fileContent = await fs.readFile(TARGETS_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return { ...DEFAULT_TARGETS, ...parsed };
    } catch {
        // File doesn't exist or is invalid, return defaults
        return DEFAULT_TARGETS;
    }
}

// Save targets to file
export async function saveAnalyticsTargets(targets: AnalyticsTargets): Promise<{ success: boolean; error?: string }> {
    await requireAdminPermission(AdminPermissions.ALL);

    try {
        await ensureDataDir();
        await fs.writeFile(TARGETS_FILE, JSON.stringify(targets, null, 2), 'utf-8');

        revalidatePath('/admin/analytics');
        revalidatePath('/admin/analytics/targets');

        return { success: true };
    } catch (error) {
        console.error('Failed to save targets:', error);
        return { success: false, error: 'Failed to save targets' };
    }
}
