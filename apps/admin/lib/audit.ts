import type { Database, Json } from '@roomly/db-types';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuditLogInput {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Json;
}

/** Append-only moderation audit row (service role only). */
export async function writeAuditLog(
  svc: SupabaseClient<Database>,
  input: AuditLogInput,
): Promise<void> {
  const { error } = await svc.from('audit_log').insert({
    actor_id: input.actorId,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`audit_log insert failed: ${error.message}`);
  }
}
