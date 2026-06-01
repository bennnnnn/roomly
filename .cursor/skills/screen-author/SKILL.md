---
name: screen-author
description: Add a new Expo Router screen to apps/mobile following Roomly's thin-screen pattern (under 300 lines, no business logic, no inline styles, optimistic UI). Use whenever a task requires a new file under apps/mobile/app/.
---

# Screen author (Roomly mobile)

Screens are thin: they wire data to presentational components. Business logic lives in hooks (`src/features/<area>/hooks/`) and stores (`src/stores/`).

## Checklist

```
- [ ] 1. Decide route path. File-based: app/(group)/segment.tsx.
- [ ] 2. Identify required data. Use existing TanStack Query hook or add one in src/features/<area>/hooks/.
- [ ] 3. Render loading skeleton, error state with retry, empty state.
- [ ] 4. Use NativeWind classes; no inline style={{}} object literals.
- [ ] 5. If user can act: optimistic mutation, with rollback on error.
- [ ] 6. If on a list: paginate server-side; never fetch all rows.
- [ ] 7. Add an RNTL test for: initial render, loading, error retry, primary action.
- [ ] 8. Stay under 300 lines. Extract <Header>, <Body>, <ActionRow> when growing.
```

## Screen template

```tsx
// apps/mobile/app/(listing)/[id].tsx
import { useLocalSearchParams, Stack } from 'expo-router';
import { ListingDetail } from '@/features/listings/components/ListingDetail';
import { ListingSkeleton } from '@/features/listings/components/ListingSkeleton';
import { ListingError } from '@/features/listings/components/ListingError';
import { useListing } from '@/features/listings/hooks/useListing';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useListing(id);

  return (
    <>
      <Stack.Screen options={{ title: query.data?.title ?? 'Listing' }} />
      {query.isLoading && <ListingSkeleton />}
      {query.error && <ListingError onRetry={query.refetch} />}
      {query.data && <ListingDetail listing={query.data} />}
    </>
  );
}
```

## Hook template

```ts
// apps/mobile/src/features/listings/hooks/useListing.ts
import { useQuery } from '@tanstack/react-query';
import { fetchListing } from '../api/fetchListing';

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id),
    staleTime: 30_000,
    enabled: Boolean(id),
  });
}
```

## Test template

```tsx
// apps/mobile/src/features/listings/__tests__/ListingDetailScreen.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ListingDetailScreen from '../../../app/(listing)/[id]';
import { mockListing } from '../__fixtures__/listing';

it('renders skeleton then the listing', async () => { /* ... */ });
it('shows error and retries on tap', async () => { /* ... */ });
```

## Do not

- Do not put data fetching, sorting, or validation logic in the screen file.
- Do not use `useEffect` to fetch data — use TanStack Query.
- Do not subscribe to Realtime without a server-side `filter:`.
- Do not exceed 300 lines. The hard cap is 600 (ESLint) but you should split well before that.
