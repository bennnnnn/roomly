import { supabase } from '../../../lib/supabaseClient';

import type { Database } from '@roomly/db-types';

type ReportTargetType = Database['public']['Enums']['report_target_type'];

export async function blockUser(blockedId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const myId = userData?.user?.id;
  if (!myId) throw new Error('Sign in to block users');

  const { error } = await supabase.from('blocks').insert({
    blocker_id: myId,
    blocked_id: blockedId,
  });
  if (error) throw error;
}

export async function submitReport(
  targetType: ReportTargetType,
  targetId: string,
  reason: string,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const myId = userData?.user?.id;
  if (!myId) throw new Error('Sign in to report');

  const { error } = await supabase.from('reports').insert({
    reporter_id: myId,
    target_type: targetType,
    target_id: targetId,
    reason: reason.trim(),
  });
  if (error) throw error;
}
