import { env } from '../../../lib/env';
import { supabase } from '../../../lib/supabaseClient';

interface PaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  paymentType: 'listing_create' | 'listing_multi' | 'listing_renew';
}

/** Derive the Supabase Functions base URL from the project URL. */
function functionsBaseUrl(): string {
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  // URL is https://<ref>.supabase.co — functions are at /functions/v1
  return `${url}/functions/v1`;
}

/**
 * Calls the create-payment-intent Edge Function to get a Stripe
 * client secret for the PaymentSheet. Pricing is server-computed.
 */
export async function createPaymentIntent(listingId: string): Promise<PaymentIntentResponse> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) throw new Error('Sign in to publish');

  const resp = await fetch(`${functionsBaseUrl()}/create-payment-intent`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ listingId }),
  });

  if (!resp.ok) {
    const body = (await resp.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'payment_intent_failed');
  }

  return resp.json() as Promise<PaymentIntentResponse>;
}

/** Format a cent amount into a dollar string. */
export function formatAmount(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
