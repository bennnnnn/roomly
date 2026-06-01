import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

import { createServiceClient } from '../_shared/supabase.ts';
import { logger } from '../_shared/logger.ts';
import { httpError, httpOk } from '../_shared/http.ts';
import { escapeHtml } from '../_shared/html.ts';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return httpError(405, 'method_not_allowed');

  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeSecret || !webhookSecret) {
    logger.error('Stripe secrets not configured');
    return httpError(500, 'config_error');
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  });

  // --- Verify webhook signature ---
  const signature = req.headers.get('stripe-signature');
  if (!signature) return httpError(400, 'missing_signature');

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch {
    return httpError(400, 'invalid_signature');
  }

  const svc = createServiceClient();

  // --- Idempotency: skip already-processed events ---
  const { error: idempotencyError } = await svc
    .from('webhook_events')
    .insert({ provider: 'stripe', event_id: event.id });

  if (idempotencyError) {
    // 23505 = unique violation → already processed
    if (idempotencyError.code === '23505') {
      return httpOk({ idempotent: true });
    }
    logger.error('webhook_events insert failed', { cause: idempotencyError });
    return httpError(500, 'db_error');
  }

  // --- Handle payment_intent.succeeded ---
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const listingId = pi.metadata.listing_id;
    const userId = pi.metadata.user_id;
    const paymentType = pi.metadata.payment_type ?? 'listing_create';

    if (!listingId || !userId) {
      logger.error('Missing metadata on PaymentIntent', { piId: pi.id });
      return httpOk({ skipped: true, reason: 'missing_metadata' });
    }

    try {
      // Publish the listing (server-only RPC)
      const { error: publishError } = await svc.rpc('publish_listing', {
        p_listing_id: listingId,
        p_user_id: userId,
      });

      if (publishError) {
        logger.error('publish_listing failed', { listingId, userId, cause: publishError });
        // Don't throw — record the payment anyway so we have a trail.
      }

      // Record the payment
      const { error: paymentError } = await svc.from('payments').insert({
        user_id: userId,
        listing_id: listingId,
        amount_cents: pi.amount,
        currency: pi.currency,
        type: paymentType,
        stripe_payment_intent_id: pi.id,
        status: 'succeeded',
      });

      if (paymentError) {
        logger.error('payment insert failed', { piId: pi.id, cause: paymentError });
      }

      // --- Send receipt email via Resend ---
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey) {
        try {
          const userEmail = pi.receipt_email ?? undefined;
          if (userEmail) {
            const amountFormatted = (pi.amount / 100).toFixed(2);
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'Roomly <receipts@roomly.app>',
                to: [userEmail],
                subject: `Roomly — payment receipt ($${amountFormatted})`,
                html: `<p>Your listing has been published!</p>
<p>Amount: $${escapeHtml(amountFormatted)}</p>
<p>Your listing is now active for 30 days.</p>`,
              }),
            });
          }
        } catch (emailError) {
          logger.error('receipt email failed', { piId: pi.id, cause: String(emailError) });
        }
      }

      logger.info('payment_intent.succeeded processed', {
        listingId,
        userId,
        piId: pi.id,
        amount: pi.amount,
      });

      return httpOk({ published: true });
    } catch (cause) {
      logger.error('Webhook processing failed', { piId: pi.id, cause: String(cause) });
      return httpError(500, 'webhook_processing_failed');
    }
  }

  // --- Handle payment_intent.payment_failed ---
  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const { error: paymentError } = await svc.from('payments').insert({
      user_id: pi.metadata.user_id ?? '00000000-0000-0000-0000-000000000000',
      listing_id: pi.metadata.listing_id ?? '00000000-0000-0000-0000-000000000000',
      amount_cents: pi.amount,
      currency: pi.currency,
      type: 'listing_create',
      stripe_payment_intent_id: pi.id,
      status: 'failed',
    });

    if (paymentError) {
      logger.error('failed payment insert failed', { piId: pi.id, cause: paymentError });
    }

    logger.info('payment_intent.payment_failed recorded', { piId: pi.id });
    return httpOk({ recorded: true });
  }

  // Unhandled event type
  return httpOk({ skipped: true, type: event.type });
});
