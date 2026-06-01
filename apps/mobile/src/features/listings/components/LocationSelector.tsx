import * as Location from 'expo-location';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '../../../components/Button';
import { useBrowseFilterStore } from '../stores/browseFilterStore';

interface LocationSelectorProps {
  visible: boolean;
  onClose: () => void;
}

/** Simple list of preloaded cities for quick selection. */
const POPULAR_CITIES = [
  { label: 'New York, NY', lat: 40.7128, lng: -74.006 },
  { label: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
  { label: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
  { label: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
  { label: 'Phoenix, AZ', lat: 33.4484, lng: -112.074 },
  { label: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
  { label: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
  { label: 'Miami, FL', lat: 25.7617, lng: -80.1918 },
  { label: 'Atlanta, GA', lat: 33.749, lng: -84.388 },
  { label: 'Boston, MA', lat: 42.3601, lng: -71.0589 },
  { label: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
  { label: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
  { label: 'Portland, OR', lat: 45.5152, lng: -122.6784 },
  { label: 'Washington, DC', lat: 38.9072, lng: -77.0369 },
  { label: 'Nashville, TN', lat: 36.1627, lng: -86.7816 },
];

export function LocationSelector({ visible, onClose }: LocationSelectorProps) {
  const { location, setLocation } = useBrowseFilterStore();
  const [search, setSearch] = useState(location?.label ?? '');

  const selectLocation = (label: string, lat: number, lng: number) => {
    setLocation({ label, lat, lng });
    onClose();
  };

  const handleUseCurrent = () => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        label: 'Near me',
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      onClose();
    })();
  };

  const handleSearch = () => {
    const trimmed = search.trim();
    if (trimmed) {
      // Without a full geocoding API, we store the label and leave lat/lng at 0.
      // The browse API will fall back to an unfiltered query when lat/lng are 0.
      setLocation({ label: trimmed, lat: 0, lng: 0 });
    }
    onClose();
  };

  const handleClear = () => {
    setSearch('');
    setLocation(null);
    onClose();
  };

  const filteredCities = search
    ? POPULAR_CITIES.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()))
    : POPULAR_CITIES;

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
          <Pressable onPress={onClose}>
            <Text className="text-body text-accent-500">Cancel</Text>
          </Pressable>
          <Text className="text-title font-semibold text-neutral-900 dark:text-neutral-0">
            Location
          </Text>
          {location ? (
            <Pressable onPress={handleClear}>
              <Text className="text-body text-accent-500">Clear</Text>
            </Pressable>
          ) : (
            <View className="w-12" />
          )}
        </View>

        <View className="gap-lg p-lg">
          {/* Search */}
          <View className="flex-row gap-md">
            <TextInput
              className="flex-1 rounded-md border border-neutral-200 px-md py-sm text-body text-neutral-900 dark:border-neutral-700 dark:text-neutral-0"
              placeholder="City, neighborhood, or ZIP"
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <Button label="Search" variant="secondary" onPress={handleSearch} />
          </View>

          {/* Current location */}
          <Button
            label="Use my current location"
            variant="ghost"
            onPress={handleUseCurrent}
            testID="location-use-current"
          />
        </View>

        {/* City list */}
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {filteredCities.map((city) => {
            const isSelected =
              location?.label === city.label &&
              location?.lat === city.lat &&
              location?.lng === city.lng;
            return (
              <Pressable
                key={city.label}
                onPress={() => selectLocation(city.label, city.lat, city.lng)}
                className={`flex-row items-center justify-between px-lg py-md border-b border-neutral-50 dark:border-neutral-800 ${
                  isSelected ? 'bg-accent-50 dark:bg-accent-900/20' : ''
                }`}
              >
                <Text className="text-body text-neutral-900 dark:text-neutral-0">{city.label}</Text>
                {isSelected && <Text className="text-body text-accent-500">✓</Text>}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}
