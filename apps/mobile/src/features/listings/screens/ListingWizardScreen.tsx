import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';

import { dollarsToCents, hasContactInfo, LISTING_TYPES, validateListingStep } from '@roomly/lib';

import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { logger } from '../../../lib/logger';
import { useUser } from '../../../state/session';
import {
  createListingDraft,
  fetchOwnerListingDraft,
  upsertListingDraft,
  type ListingDraftUpdate,
} from '../api/listingDraft';
import { uploadListingPhoto } from '../api/uploadListingPhoto';
import { LISTING_TYPE_LABELS, WIZARD_STEP_COUNT } from '../constants';
import { useListingWizardStore } from '../stores/listingWizardStore';

export interface ListingWizardScreenProps {
  mode: 'create' | 'edit';
  listingId?: string | undefined;
}

export default function ListingWizardScreen({ mode, listingId }: ListingWizardScreenProps) {
  const router = useRouter();
  const user = useUser();
  const store = useListingWizardStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const initKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const initKey = `${mode}:${listingId ?? 'new'}:${user.id}`;
    if (initKeyRef.current === initKey) return;
    initKeyRef.current = initKey;

    let cancelled = false;
    const { patch, reset, setListingId } = useListingWizardStore.getState();

    void (async () => {
      setBusy(true);
      setError(undefined);
      try {
        if (mode === 'edit' && listingId) {
          const loaded = await fetchOwnerListingDraft(listingId);
          if (cancelled) return;
          if (!loaded) {
            setError('Listing not found.');
            return;
          }
          const p = loaded.payload;
          patch({
            listingId,
            type: p.type,
            areaLabel: p.areaLabel,
            addressLine: p.addressLine,
            lat: String(p.lat),
            lng: String(p.lng),
            priceDollars: String(p.priceCents / 100),
            depositDollars: p.depositCents != null ? String(p.depositCents / 100) : '',
            availableFrom: p.availableFrom,
            minMonths: String(p.minMonths),
            hasOwnBath: p.hasOwnBath,
            hasSharedBath: p.hasSharedBath,
            noSmoking: p.noSmoking,
            petsAllowed: p.petsAllowed,
            furnished: p.furnished,
            utilitiesIncluded: p.utilitiesIncluded,
            hasParking: p.hasParking,
            hasLaundry: p.hasLaundry,
            title: p.title,
            description: p.description,
            photos: Array.from({ length: loaded.photoCount }, (_, i) => ({
              id: `existing-${String(i)}`,
            })),
          });
        } else {
          const id = await createListingDraft(user.id);
          if (cancelled) return;
          reset();
          setListingId(id);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        logger.error('wizard init failed', { message: e instanceof Error ? e.message : 'unknown' });
        setError('Could not start the listing wizard.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [listingId, mode, user?.id]);

  async function pickPhoto(): Promise<void> {
    if (!user?.id || !store.listingId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Photo library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return;

    setBusy(true);
    try {
      const sortOrder = store.photos.length;
      const uploaded = await uploadListingPhoto(
        user.id,
        store.listingId,
        result.assets[0]?.uri ?? '',
        sortOrder,
        sortOrder === 0,
      );
      store.patch({
        photos: [
          ...store.photos,
          { id: uploaded.id, storagePath: uploaded.storagePath, localUri: result.assets[0]?.uri },
        ],
      });
    } catch (e: unknown) {
      logger.warn('photo upload failed', { message: e instanceof Error ? e.message : 'unknown' });
      setError('Photo upload failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function buildPayloadForStep(step: number): ListingDraftUpdate {
    switch (step) {
      case 1:
        return { type: store.type ?? 'single_bedroom' };
      case 2:
        return {};
      case 3:
        return {
          areaLabel: store.areaLabel.trim(),
          addressLine: store.addressLine.trim(),
          lat: Number(store.lat),
          lng: Number(store.lng),
        };
      case 4:
        return {
          priceCents: dollarsToCents(Number(store.priceDollars)),
          depositCents: store.depositDollars ? dollarsToCents(Number(store.depositDollars)) : null,
          availableFrom: store.availableFrom,
          minMonths: Number(store.minMonths),
        };
      case 5:
        return {
          hasOwnBath: store.hasOwnBath,
          hasSharedBath: store.hasSharedBath,
          noSmoking: store.noSmoking,
          petsAllowed: store.petsAllowed,
          furnished: store.furnished,
          utilitiesIncluded: store.utilitiesIncluded,
          hasParking: store.hasParking,
          hasLaundry: store.hasLaundry,
        };
      case 6:
        return {
          title: store.title.trim(),
          description: store.description.trim(),
        };
      default:
        return {};
    }
  }

  function fieldsForStep() {
    return {
      type: store.type ?? undefined,
      photoCount: store.photos.length,
      areaLabel: store.areaLabel,
      addressLine: store.addressLine,
      lat: Number(store.lat),
      lng: Number(store.lng),
      priceCents: dollarsToCents(Number(store.priceDollars)),
      depositCents: store.depositDollars ? dollarsToCents(Number(store.depositDollars)) : null,
      availableFrom: store.availableFrom,
      minMonths: Number(store.minMonths),
      title: store.title,
      description: store.description,
    };
  }

  async function saveDraft(): Promise<boolean> {
    if (!store.listingId) return false;
    setBusy(true);
    setError(undefined);
    try {
      const patch = buildPayloadForStep(store.step);
      if (Object.keys(patch).length > 0) {
        await upsertListingDraft(store.listingId, patch);
      }
      return true;
    } catch (e: unknown) {
      logger.error('save draft failed', { message: e instanceof Error ? e.message : 'unknown' });
      setError('Could not save draft.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onNext(): Promise<void> {
    const step = store.step as 1 | 2 | 3 | 4 | 5 | 6;
    if (step <= 6) {
      const issues = validateListingStep(step, fieldsForStep());
      if (issues.length > 0) {
        setError(issues[0]?.message ?? 'Fix the highlighted fields.');
        return;
      }
    }
    if (step === 6 && hasContactInfo(store.description)) {
      setError('Remove contact info from the description (email, phone, links).');
      return;
    }
    const ok = await saveDraft();
    if (!ok) return;
    if (store.step < WIZARD_STEP_COUNT) {
      store.setStep(store.step + 1);
      setError(undefined);
    }
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center p-xl">
        <Text className="text-body">Sign in to create a listing.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      testID="listing-wizard"
      className="flex-1 bg-neutral-0 p-lg dark:bg-neutral-900"
      contentContainerClassName="gap-md pb-xxl"
    >
      <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
        {mode === 'edit' ? 'Edit listing' : 'New listing'} · Step {String(store.step)}/
        {String(WIZARD_STEP_COUNT)}
      </Text>

      {store.step === 1 ? <StepType /> : null}
      {store.step === 2 ? (
        <StepPhotos onAdd={() => void pickPhoto()} count={store.photos.length} />
      ) : null}
      {store.step === 3 ? <StepLocation /> : null}
      {store.step === 4 ? <StepPrice /> : null}
      {store.step === 5 ? <StepRules /> : null}
      {store.step === 6 ? <StepCopy /> : null}
      {store.step === 7 ? <StepReview /> : null}

      {error ? <Text className="text-caption text-semantic-danger">{error}</Text> : null}

      <View className="flex-row gap-sm">
        {store.step > 1 ? (
          <Button
            label="Back"
            variant="secondary"
            disabled={busy}
            onPress={() => store.setStep(store.step - 1)}
            testID="wizard-back"
          />
        ) : null}
        {store.step < WIZARD_STEP_COUNT ? (
          <Button
            label={busy ? 'Saving…' : 'Next'}
            loading={busy}
            onPress={() => void onNext()}
            testID="wizard-next"
          />
        ) : (
          <Button
            label="Save draft"
            variant="secondary"
            loading={busy}
            onPress={() => {
              void saveDraft().then((ok) => {
                if (ok) router.back();
              });
            }}
            testID="wizard-save-exit"
          />
        )}
      </View>
    </ScrollView>
  );
}

function StepType() {
  const { type, patch } = useListingWizardStore();
  return (
    <View className="gap-sm">
      <Text className="text-body text-neutral-600 dark:text-neutral-300">Property type</Text>
      {LISTING_TYPES.map((t) => (
        <Button
          key={t}
          label={LISTING_TYPE_LABELS[t]}
          variant={type === t ? 'primary' : 'secondary'}
          onPress={() => patch({ type: t })}
          testID={`wizard-type-${t}`}
        />
      ))}
    </View>
  );
}

function StepPhotos({ onAdd, count }: { onAdd: () => void; count: number }) {
  return (
    <View className="gap-sm">
      <Text className="text-body text-neutral-600 dark:text-neutral-300">
        Photos ({String(count)}/8)
      </Text>
      <Button label="Add photo" onPress={onAdd} testID="wizard-add-photo" />
    </View>
  );
}

function StepLocation() {
  const s = useListingWizardStore();
  return (
    <View className="gap-sm">
      <Input
        label="Area label (public)"
        value={s.areaLabel}
        onChangeText={(v) => s.patch({ areaLabel: v })}
        testID="wizard-area"
      />
      <Input
        label="Address (private)"
        value={s.addressLine}
        onChangeText={(v) => s.patch({ addressLine: v })}
        testID="wizard-address"
      />
      <Input
        label="Latitude"
        value={s.lat}
        onChangeText={(v) => s.patch({ lat: v })}
        keyboardType="numeric"
        testID="wizard-lat"
      />
      <Input
        label="Longitude"
        value={s.lng}
        onChangeText={(v) => s.patch({ lng: v })}
        keyboardType="numeric"
        testID="wizard-lng"
      />
      <Text className="text-caption text-neutral-500">
        Renters only see the general area on the map.
      </Text>
    </View>
  );
}

function StepPrice() {
  const s = useListingWizardStore();
  return (
    <View className="gap-sm">
      <Input
        label="Rent / month (USD)"
        value={s.priceDollars}
        onChangeText={(v) => s.patch({ priceDollars: v })}
        keyboardType="decimal-pad"
        testID="wizard-price"
      />
      <Input
        label="Deposit (optional)"
        value={s.depositDollars}
        onChangeText={(v) => s.patch({ depositDollars: v })}
        keyboardType="decimal-pad"
        testID="wizard-deposit"
      />
      <Input
        label="Available from (YYYY-MM-DD)"
        value={s.availableFrom}
        onChangeText={(v) => s.patch({ availableFrom: v })}
        testID="wizard-available"
      />
      <Input
        label="Minimum stay (months)"
        value={s.minMonths}
        onChangeText={(v) => s.patch({ minMonths: v })}
        keyboardType="number-pad"
        testID="wizard-min-months"
      />
    </View>
  );
}

function StepRules() {
  const s = useListingWizardStore();
  const toggles: { key: keyof typeof s; label: string }[] = [
    { key: 'hasOwnBath', label: 'Own bathroom' },
    { key: 'hasSharedBath', label: 'Shared bathroom' },
    { key: 'noSmoking', label: 'No smoking' },
    { key: 'petsAllowed', label: 'Pets allowed' },
    { key: 'furnished', label: 'Furnished' },
    { key: 'utilitiesIncluded', label: 'Utilities included' },
    { key: 'hasParking', label: 'Parking' },
    { key: 'hasLaundry', label: 'Laundry' },
  ];
  return (
    <View className="gap-sm">
      {toggles.map(({ key, label }) => (
        <View key={key} className="flex-row items-center justify-between">
          <Text className="text-body text-neutral-800 dark:text-neutral-100">{label}</Text>
          <Switch
            value={Boolean(s[key])}
            onValueChange={(v) => s.patch({ [key]: v })}
            testID={`wizard-rule-${key}`}
          />
        </View>
      ))}
    </View>
  );
}

function StepCopy() {
  const s = useListingWizardStore();
  return (
    <View className="gap-sm">
      <Input
        label="Title"
        value={s.title}
        onChangeText={(v) => s.patch({ title: v })}
        testID="wizard-title"
      />
      <Input
        label="Description"
        value={s.description}
        onChangeText={(v) => s.patch({ description: v })}
        multiline
        testID="wizard-description"
      />
    </View>
  );
}

function StepReview() {
  return (
    <View className="gap-sm rounded-lg border border-neutral-200 p-md dark:border-neutral-700">
      <Text className="text-body font-medium text-neutral-900 dark:text-neutral-0">Review</Text>
      <Text className="text-body text-neutral-600 dark:text-neutral-300">
        Your draft is saved. Pay & publish arrives in Slice 4 (Stripe PaymentSheet).
      </Text>
      <Text className="text-caption text-neutral-500">
        Active listings appear in Browse after payment confirms.
      </Text>
    </View>
  );
}
