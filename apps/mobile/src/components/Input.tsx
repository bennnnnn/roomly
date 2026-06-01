import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

/**
 * Text input with optional label and error message.
 *
 * `errorMessage` (when present) renders a red helper line below and sets
 * `accessibilityInvalid` so screen readers announce the error.
 */

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string | undefined;
  errorMessage?: string | undefined;
  testID?: string | undefined;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, errorMessage, testID, editable = true, ...rest },
  ref,
) {
  const hasError = Boolean(errorMessage);
  return (
    <View className="w-full">
      {label ? (
        <Text className="mb-xs text-caption font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        editable={editable}
        accessibilityLabel={label}
        accessibilityState={{ disabled: !editable }}
        // RN exposes invalid state via aria-invalid on web; native readers
        // surface the textContent of the helper line below.
        aria-invalid={hasError}
        testID={testID}
        placeholderTextColor="#9CA3AF"
        className={`min-h-[44px] rounded-md border px-md py-sm text-body text-neutral-900 dark:text-neutral-0 ${
          hasError ? 'border-semantic-danger' : 'border-neutral-300 dark:border-neutral-700'
        } ${!editable ? 'opacity-50' : ''}`}
        {...rest}
      />
      {hasError ? (
        <Text
          className="mt-xs text-caption text-semantic-danger"
          testID={testID ? `${testID}-error` : undefined}
        >
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
});
