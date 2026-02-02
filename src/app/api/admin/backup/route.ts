import { NextRequest, NextResponse } from 'next/server';
import { backupService } from '@/lib/services/backupService';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Security Check
    // Backups are critical data. Only specific roles should access this.
    // Assuming 'SYSTEM_SETTINGS' or SUPER_ADMIN permission covers this.
    // For now, using a high-level permission intent.
    await requireAdminPermission(AdminPermissions.SYSTEM.MANAGE);

    // 2. Generate Backup
    const backupData = await backupService.generateBackup();

    // 3. Create Filename
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `legecy-store-backup-${dateStr}.json`;

    // 4. Return Response
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Backup API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate backup' },
      { status: 500 }
    );
  }
}
