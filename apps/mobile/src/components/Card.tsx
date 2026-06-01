import { View, type ViewProps } from 'react-native';

/**
 * Card container. Visual baseline for grouped content (listing rows, profile
 * blocks, settings sections, etc.). Inherits NativeWind className override so
 * callers can adjust spacing/padding without forking the component.
 */
// className comes from NativeWind's ViewProps augmentation — we don't need
// to redeclare it. testID is optional with the exact-optional-property
// shape RN expects.
export interface CardProps extends Omit<ViewProps, 'style'> {
  testID?: string | undefined;
}

export function Card({ className, testID, children, ...rest }: CardProps) {
  return (
    <View
      testID={testID}
      className={`rounded-lg border border-neutral-100 bg-neutral-0 p-md dark:border-neutral-700 dark:bg-neutral-900 ${className ?? ''}`}
      {...rest}
    >
      {children}
    </View>
  );
}
