import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const SECURE_PREFIX = 'roomly.auth.';

/**
 * Persists Supabase session tokens in the device keychain (PRD §2.2).
 * Falls back to AsyncStorage when SecureStore is unavailable (e.g. web/tests).
 */
export const authStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(SECURE_PREFIX + key);
    } catch {
      return AsyncStorage.getItem(key);
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(SECURE_PREFIX + key, value);
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(SECURE_PREFIX + key);
    } catch {
      await AsyncStorage.removeItem(key);
    }
  },
};
