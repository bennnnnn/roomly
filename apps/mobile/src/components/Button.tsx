import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

/**
 * Primary action button using NativeWind tokens from @roomly/ui-tokens.
 *
 * Variants:
 *   - primary (default): filled, accent-500 background.
 *   - secondary: outlined, neutral-300 border.
 *   - ghost: text-only.
 *
 * Accessibility: always renders an accessible label (defaults to children if
 * not provided); honors `loading` and `disabled` via `accessibilityState`.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'accessibilityRole'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  testID?: string;
}

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-accent-500 active:bg-accent-700',
  secondary:
    'bg-neutral-0 border border-neutral-300 active:bg-neutral-100 dark:bg-neutral-900 dark:border-neutral-700',
  ghost: 'bg-transparent active:bg-neutral-100 dark:active:bg-neutral-800',
};

const TEXT: Record<ButtonVariant, string> = {
  primary: 'text-neutral-0',
  secondary: 'text-neutral-900 dark:text-neutral-0',
  ghost: 'text-accent-500',
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  testID,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled ?? loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      testID={testID}
      className={`min-h-[44px] flex-row items-center justify-center rounded-md px-lg py-sm ${CONTAINER[variant]} ${isDisabled ? 'opacity-50' : ''}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator testID={testID ? `${testID}-spinner` : undefined} />
      ) : (
        <Text className={`text-body font-medium ${TEXT[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
