'use server';

import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth/guards';
import { revalidatePath } from 'next/cache';
import { getKillSwitches, KillSwitchKey, KillSwitches } from '@/lib/killSwitches';

/**
 * Kill Switch Actions
 * 
 * Owner-only controls for emergency system features
 */

// Toggle a specific kill switch
export async function toggleKillSwitch(key: KillSwitchKey, enabled: boolean): Promise<{ success: boolean; switches: KillSwitches }> {
  const admin = await requireAdminPermission('system.kill_switches');
  
  // Get current switches
  const current = await getKillSwitches();
  
  // Update the specific switch
  const updated: KillSwitches = {
    ...current,
    [key]: enabled
  };
  
  // Save to database
  await prisma.storeConfig.upsert({
    where: { key: 'system_kill_switches' },
    create: {
      key: 'system_kill_switches',
      value: updated as object
    },
    update: {
      value: updated as object
    }
  });
  
  // Log the action
  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: enabled ? 'KILL_SWITCH_ENABLED' : 'KILL_SWITCH_DISABLED',
      entityType: 'SYSTEM',
      entityId: key,
      metadata: JSON.stringify({ switch: key, enabled }),
    }
  });
  
  revalidatePath('/admin/config/security');
  
  return { success: true, switches: updated };
}
