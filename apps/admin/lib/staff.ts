import { createClient } from './supabase/server';

export type StaffGateResult =
  | { ok: true; userId: string; staffRole: 'admin' | 'moderator' }
  | { ok: false; error: string };

/** Ensures the session user is admin or moderator. */
export async function requireStaff(): Promise<StaffGateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Not signed in.' };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('staff_role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  const role = profile?.staff_role;
  if (role !== 'admin' && role !== 'moderator') {
    return { ok: false, error: 'Staff role required.' };
  }

  return { ok: true, userId: user.id, staffRole: role };
}
