import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const AUTH_KEY = 'coin_catalog_auth';
const isWeb = Platform.OS === 'web';

// Storage helpers for cross-platform
const storage = {
  getItem: async (key) => {
    if (isWeb) {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key, value) => {
    if (isWeb) {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key) => {
    if (isWeb) {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const useAuthStore = create((set, get) => ({
  user: null,
  isGuest: true,
  isLoading: true,

  // Load user from storage on app start
  loadUser: async () => {
    try {
      const stored = await storage.getItem(AUTH_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({ user: data.user, isGuest: false, isLoading: false });
      } else {
        set({ isGuest: true, isLoading: false });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      set({ isGuest: true, isLoading: false });
    }
  },

  // Login
  login: async (email, password) => {
    try {
      const user = { email, name: email.split('@')[0] };
      await storage.setItem(AUTH_KEY, JSON.stringify({ user }));
      set({ user, isGuest: false });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Register
  register: async (email, password, name) => {
    try {
      const user = { email, name: name || email.split('@')[0] };
      await storage.setItem(AUTH_KEY, JSON.stringify({ user }));
      set({ user, isGuest: false });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout: async () => {
    try {
      await storage.removeItem(AUTH_KEY);
      set({ user: null, isGuest: true });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  },
}));
