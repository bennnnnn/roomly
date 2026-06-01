'use server';

import { revalidatePath } from 'next/cache';

import { writeAuditLog } from '../../lib/audit';
import { requireStaff } from '../../lib/staff';
import { createServiceClient } from '../../lib/supabase/service';

export async function clearMessageFlag(messageId: string): Promise<{ error?: string }> {
  const staff = await requireStaff();
  if (!staff.ok) return { error: staff.error };

  const svc = createServiceClient();
  const { data: before, error: readError } = await svc
    .from('messages')
    .select('flagged, deleted_at')
    .eq('id', messageId)
    .maybeSingle();

  if (readError || !before) {
    return { error: 'Message not found.' };
  }

  const { error } = await svc.from('messages').update({ flagged: false }).eq('id', messageId);

  if (error) {
    return { error: error.message };
  }

  await writeAuditLog(svc, {
    actorId: staff.userId,
    action: 'message.clear_flag',
    targetType: 'message',
    targetId: messageId,
    metadata: { before },
  });

  revalidatePath('/reports');
  return {};
}

export async function deleteFlaggedMessage(messageId: string): Promise<{ error?: string }> {
  const staff = await requireStaff();
  if (!staff.ok) return { error: staff.error };

  const svc = createServiceClient();
  const { data: before, error: readError } = await svc
    .from('messages')
    .select('body, flagged, deleted_at')
    .eq('id', messageId)
    .maybeSingle();

  if (readError || !before) {
    return { error: 'Message not found.' };
  }

  const deletedAt = new Date().toISOString();
  const { error } = await svc
    .from('messages')
    .update({ deleted_at: deletedAt, flagged: false })
    .eq('id', messageId);

  if (error) {
    return { error: error.message };
  }

  await writeAuditLog(svc, {
    actorId: staff.userId,
    action: 'message.soft_delete',
    targetType: 'message',
    targetId: messageId,
    metadata: { before, deleted_at: deletedAt },
  });

  revalidatePath('/reports');
  return {};
}

export async function updateReportStatus(
  reportId: string,
  status: 'actioned' | 'dismissed',
): Promise<{ error?: string }> {
  const staff = await requireStaff();
  if (!staff.ok) return { error: staff.error };

  const svc = createServiceClient();
  const { data: before, error: readError } = await svc
    .from('reports')
    .select('status, target_type, target_id')
    .eq('id', reportId)
    .maybeSingle();

  if (readError || !before) {
    return { error: 'Report not found.' };
  }

  const { error } = await svc.from('reports').update({ status }).eq('id', reportId);

  if (error) {
    return { error: error.message };
  }

  await writeAuditLog(svc, {
    actorId: staff.userId,
    action: `report.${status}`,
    targetType: 'report',
    targetId: reportId,
    metadata: { before, status },
  });

  revalidatePath('/reports');
  return {};
}
