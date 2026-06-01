import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '../../../components/Button';
import { LISTING_TYPE_LABELS } from '../constants';
import { useBrowseFilterStore } from '../stores/browseFilterStore';

import type { BathFilter, BrowseSort, ListingType } from '../types';

interface FilterSheetProps {
  visible: boolean;
  resultCount: number;
  onClose: () => void;
}

const BATH_OPTIONS: { value: BathFilter; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'own', label: 'Own bath' },
  { value: 'shared', label: 'Shared bath' },
];

const SORT_OPTIONS: { value: BrowseSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
];

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      className={`rounded-full px-md py-sm border ${
        selected
          ? 'border-accent-500 bg-accent-500'
          : 'border-neutral-200 bg-neutral-0 dark:border-neutral-700 dark:bg-neutral-900'
      }`}
    >
      <Text
        className={`text-caption font-medium ${
          selected ? 'text-neutral-0' : 'text-neutral-700 dark:text-neutral-200'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean | null;
  onToggle: (v: boolean | null) => void;
}) {
  const next = (): boolean | null => {
    if (value === null) return true;
    if (value === true) return false;
    return null;
  };

  const display = value === true ? 'Yes' : value === false ? 'No' : 'Any';

  return (
    <View className="flex-row items-center justify-between py-sm">
      <Text className="text-body text-neutral-900 dark:text-neutral-0">{label}</Text>
      <Pressable
        onPress={() => onToggle(next())}
        className="rounded-md border border-neutral-200 px-md py-xs dark:border-neutral-700"
      >
        <Text className="text-body text-neutral-700 dark:text-neutral-200">{display}</Text>
      </Pressable>
    </View>
  );
}

export function FilterSheet({ visible, resultCount, onClose }: FilterSheetProps) {
  const {
    filters,
    setTypes,
    setPriceRange,
    setBath,
    setFurnished,
    setPets,
    setAvailableAfter,
    setSort,
    resetFilters,
    activeFilterCount,
  } = useBrowseFilterStore();

  const [priceMinText, setPriceMinText] = useState(
    filters.priceMin !== null ? String(filters.priceMin) : '',
  );
  const [priceMaxText, setPriceMaxText] = useState(
    filters.priceMax !== null ? String(filters.priceMax) : '',
  );
  const [dateText, setDateText] = useState(filters.availableAfter ?? '');

  const toggleType = (type: ListingType) => {
    const next = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    setTypes(next);
  };

  const applyPrice = () => {
    const min = priceMinText ? parseInt(priceMinText, 10) : null;
    const max = priceMaxText ? parseInt(priceMaxText, 10) : null;
    setPriceRange(
      min !== null && !isNaN(min) ? min : null,
      max !== null && !isNaN(max) ? max : null,
    );
  };

  const applyDate = () => {
    setAvailableAfter(dateText || null);
  };

  const handleReset = () => {
    setPriceMinText('');
    setPriceMaxText('');
    setDateText('');
    resetFilters();
  };

  const activeCount = activeFilterCount();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-neutral-0 dark:bg-neutral-900">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-neutral-100 px-lg py-md dark:border-neutral-800">
          <Pressable onPress={handleReset}>
            <Text className="text-body text-accent-500">Reset</Text>
          </Pressable>
          <Text className="text-title font-semibold text-neutral-900 dark:text-neutral-0">
            Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </Text>
          <Pressable onPress={onClose}>
            <Text className="text-body font-medium text-accent-500">Done</Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-lg"
          contentContainerClassName="gap-lg py-lg"
          keyboardShouldPersistTaps="handled"
        >
          {/* Property type */}
          <View className="gap-sm">
            <Text className="text-caption font-semibold uppercase text-neutral-500">Type</Text>
            <View className="flex-row flex-wrap gap-sm">
              {(Object.keys(LISTING_TYPE_LABELS) as ListingType[]).map((type) => (
                <FilterChip
                  key={type}
                  label={LISTING_TYPE_LABELS[type]}
                  selected={filters.types.includes(type)}
                  onPress={() => toggleType(type)}
                />
              ))}
            </View>
          </View>

          {/* Price range */}
          <View className="gap-sm">
            <Text className="text-caption font-semibold uppercase text-neutral-500">
              Price range ($/mo)
            </Text>
            <View className="flex-row gap-md">
              <TextInput
                className="flex-1 rounded-md border border-neutral-200 px-md py-sm text-body text-neutral-900 dark:border-neutral-700 dark:text-neutral-0"
                placeholder="Min"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={priceMinText}
                onChangeText={setPriceMinText}
                onBlur={applyPrice}
              />
              <TextInput
                className="flex-1 rounded-md border border-neutral-200 px-md py-sm text-body text-neutral-900 dark:border-neutral-700 dark:text-neutral-0"
                placeholder="Max"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={priceMaxText}
                onChangeText={setPriceMaxText}
                onBlur={applyPrice}
              />
            </View>
          </View>

          {/* Bath */}
          <View className="gap-sm">
            <Text className="text-caption font-semibold uppercase text-neutral-500">Bath</Text>
            <View className="flex-row gap-sm">
              {BATH_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  selected={filters.bath === opt.value}
                  onPress={() => setBath(opt.value)}
                />
              ))}
            </View>
          </View>

          {/* Toggles */}
          <View className="gap-sm rounded-lg border border-neutral-100 p-md dark:border-neutral-800">
            <ToggleRow label="Furnished" value={filters.furnished} onToggle={setFurnished} />
            <View className="h-px bg-neutral-100 dark:bg-neutral-800" />
            <ToggleRow label="Pets allowed" value={filters.pets} onToggle={setPets} />
          </View>

          {/* Available after */}
          <View className="gap-sm">
            <Text className="text-caption font-semibold uppercase text-neutral-500">
              Available after
            </Text>
            <TextInput
              className="rounded-md border border-neutral-200 px-md py-sm text-body text-neutral-900 dark:border-neutral-700 dark:text-neutral-0"
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={dateText}
              onChangeText={setDateText}
              onBlur={applyDate}
              autoCapitalize="none"
            />
          </View>

          {/* Sort */}
          <View className="gap-sm">
            <Text className="text-caption font-semibold uppercase text-neutral-500">Sort</Text>
            <View className="gap-sm">
              {SORT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setSort(opt.value)}
                  className="flex-row items-center gap-md"
                >
                  <View
                    className={`h-5 w-5 rounded-full border-2 ${
                      filters.sort === opt.value
                        ? 'border-accent-500 bg-accent-500'
                        : 'border-neutral-300 dark:border-neutral-600'
                    } items-center justify-center`}
                  >
                    {filters.sort === opt.value && (
                      <View className="h-2 w-2 rounded-full bg-neutral-0" />
                    )}
                  </View>
                  <Text className="text-body text-neutral-900 dark:text-neutral-0">
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="border-t border-neutral-100 px-lg py-md dark:border-neutral-800">
          <Button
            label={`Show ${resultCount} result${resultCount !== 1 ? 's' : ''}`}
            onPress={onClose}
            disabled={resultCount === 0}
            testID="filter-show-results"
          />
        </View>
      </View>
    </Modal>
  );
}
