import { supabase } from '../../../lib/supabaseClient';

import type { AccountType } from '@roomly/db-types';

export interface AccountProfile {
  accountType: AccountType;
  companyName: string | null;
}

export async function fetchAccountProfile(): Promise<AccountProfile> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Sign in to manage account type');

  const { data, error } = await supabase
    .from('profiles')
    .select('account_type, company_name')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Profile not found');

  return {
    accountType: data.account_type,
    companyName: data.company_name,
  };
}

export async function updateAccountProfile(
  accountType: AccountType,
  companyName: string | null,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Sign in to manage account type');

  if (accountType === 'company') {
    const trimmed = companyName?.trim() ?? '';
    if (trimmed.length < 2) {
      throw new Error('Company name is required for company accounts.');
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      account_type: accountType,
      company_name: accountType === 'company' ? (companyName?.trim() ?? null) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
}
