import { StripeProvider as StripeProviderNative } from '@stripe/stripe-react-native';

import { env } from '../lib/env';

import type { ReactElement, ReactNode } from 'react';

export interface AppStripeProviderProps {
  children: ReactNode;
}

/**
 * Wraps the app so PaymentSheet hooks work. Publishable key is public (ADR-0009).
 * Tests set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in jest.setup-env.ts.
 */
export function AppStripeProvider({ children }: AppStripeProviderProps) {
  const key = env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_placeholder';
  return (
    <StripeProviderNative publishableKey={key} merchantIdentifier="merchant.com.roomly">
      {children as ReactElement}
    </StripeProviderNative>
  );
}
