import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

import { createListingPaymentIntent } from '../_shared/stripe-tax.ts';
import { createUserClient, createServiceClient } from '../_shared/supabase.ts';
import { logger } from '../_shared/logger.ts';
import { httpError, httpOk } from '../_shared/http.ts';

const Input = z.object({
  listingId: z.string().uuid(),
});

const FALLBACK_CENTS: Record<'first_listing' | 'additional_listing' | 'renew', number> = {
  first_listing: 999,
  additional_listing: 1799,
  renew: 999,
};

async function amountForTier(
  svc: ReturnType<typeof createServiceClient>,
  tierKey: keyof typeof FALLBACK_CENTS,
): Promise<number> {
  const { data, error } = await svc
    .from('pricing_tiers')
    .select('amount_cents')
    .eq('tier_key', tierKey)
    .maybeSingle();
  if (error || !data?.amount_cents) {
    return FALLBACK_CENTS[tierKey];
  }
  return data.amount_cents as number;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return httpError(405, 'method_not_allowed');

  // --- Auth ---
  const userClient = createUserClient(req);
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) return httpError(401, 'unauthorized');

  // --- Validate ---
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return httpError(400, 'invalid_input', parsed.error.format());
  const { listingId } = parsed.data;

  // --- Verify listing ownership + status ---
  const svc = createServiceClient();
  const { data: listing, error: listingError } = await svc
    .from('listings')
    .select('id, status, owner_id, title')
    .eq('id', listingId)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (listingError || !listing) {
    return httpError(404, 'listing_not_found');
  }

  if (listing.status === 'active') {
    return httpError(409, 'listing_already_active');
  }

  // --- Determine price (server-computed from pricing_tiers, ADR-0008) ---
  let amount: number;
  let paymentType: 'listing_create' | 'listing_multi' | 'listing_renew';
  let tierKey: keyof typeof FALLBACK_CENTS;

  const activeCount = await svc
    .rpc('get_active_listing_count', { p_user_id: user.id })
    .then(({ data, error }) => {
      if (error) throw error;
      return (data as number) ?? 0;
    })
    .catch(() => 0);

  if (listing.status === 'expired') {
    tierKey = 'renew';
    paymentType = 'listing_renew';
  } else if (activeCount === 0) {
    tierKey = 'first_listing';
    paymentType = 'listing_create';
  } else {
    tierKey = 'additional_listing';
    paymentType = 'listing_multi';
  }

  amount = await amountForTier(svc, tierKey);

  // --- Create Stripe PaymentIntent ---
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecret) {
    logger.error('STRIPE_SECRET_KEY not set');
    return httpError(500, 'config_error');
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    const paymentIntent = await createListingPaymentIntent(stripe, {
      amount,
      currency: 'usd',
      metadata: {
        listing_id: listingId,
        user_id: user.id,
        payment_type: paymentType,
      },
      description: `Roomly listing: ${listing.title}`,
      listingReference: listingId,
    });

    logger.info('PaymentIntent created', {
      userId: user.id,
      listingId,
      amount,
      paymentType,
      piId: paymentIntent.id,
    });

    return httpOk({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      paymentType,
    });
  } catch (cause) {
    logger.error('Stripe PaymentIntent creation failed', {
      userId: user.id,
      listingId,
      cause: String(cause),
    });
    return httpError(500, 'payment_intent_failed');
  }
});
