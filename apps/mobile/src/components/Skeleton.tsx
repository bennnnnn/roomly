import { View } from 'react-native';

export interface SkeletonProps {
  className?: string;
  testID?: string;
}

/** Pulsing placeholder block for loading states (PRD §2.3). */
export function Skeleton({ className = 'h-4 w-full rounded-md', testID }: SkeletonProps) {
  return (
    <View
      testID={testID}
      className={`animate-pulse bg-neutral-200 dark:bg-neutral-700 ${className}`}
    />
  );
}

export function ListingCardSkeleton({ testID }: { testID?: string }) {
  return (
    <View
      testID={testID}
      className="overflow-hidden rounded-lg border border-neutral-100 bg-neutral-0 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <Skeleton className="aspect-video w-full rounded-none" />
      <View className="gap-sm p-md">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </View>
    </View>
  );
}

export function ListingDetailSkeleton({ testID }: { testID?: string }) {
  return (
    <View testID={testID} className="flex-1 bg-neutral-0 dark:bg-neutral-900">
      <Skeleton className="aspect-video w-full rounded-none" />
      <View className="gap-md p-lg">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </View>
    </View>
  );
}
