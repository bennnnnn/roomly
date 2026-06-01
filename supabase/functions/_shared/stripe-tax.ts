import type Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

export interface PaymentIntentTaxInput {
  amount: number;
  currency: string;
  metadata: Record<string, string>;
  description: string;
  listingReference: string;
}

/** When STRIPE_TAX_ENABLED=true, runs Stripe Tax calculation and links it to the PaymentIntent. */
export async function createListingPaymentIntent(
  stripe: Stripe,
  input: PaymentIntentTaxInput,
): Promise<Stripe.PaymentIntent> {
  const taxEnabled = Deno.env.get('STRIPE_TAX_ENABLED') === 'true';

  if (!taxEnabled) {
    return stripe.paymentIntents.create({
      amount: input.amount,
      currency: input.currency,
      metadata: input.metadata,
      description: input.description,
    });
  }

  const taxCode = Deno.env.get('STRIPE_TAX_CODE') ?? 'txcd_10000000';

  const calculation = await stripe.tax.calculations.create({
    currency: input.currency,
    line_items: [
      {
        amount: input.amount,
        reference: input.listingReference,
        tax_code: taxCode,
      },
    ],
    customer_details: {
      address: { country: 'US' },
      address_source: 'billing',
    },
  });

  return stripe.paymentIntents.create({
    amount: calculation.amount_total,
    currency: input.currency,
    metadata: {
      ...input.metadata,
      tax_calculation_id: calculation.id,
    },
    description: input.description,
    hooks: {
      inputs: {
        tax: {
          calculation: calculation.id,
        },
      },
    },
  });
}
