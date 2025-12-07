import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const AUTH_KEY = 'coin_catalog_auth';
const isWeb = Platform.OS === 'web';

// API URL из .env или localhost
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

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
      // Отправляем запрос на сервер
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Ошибка входа' };
      }

      // Сохраняем пользователя и токен локально
      await storage.setItem(AUTH_KEY, JSON.stringify({
        user: data.user,
        token: data.token,
      }));

      set({ user: data.user, isGuest: false });
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      // Fallback на локальную авторизацию если сервер недоступен
      const user = { email, name: email.split('@')[0] };
      await storage.setItem(AUTH_KEY, JSON.stringify({ user }));
      set({ user, isGuest: false });
      return { success: true, warning: 'Работа в офлайн режиме' };
    }
  },

  // Register
  register: async (email, password, name) => {
    try {
      // Отправляем запрос на сервер
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Ошибка регистрации' };
      }

      // Сохраняем пользователя и токен локально
      await storage.setItem(AUTH_KEY, JSON.stringify({
        user: data.user,
        token: data.token,
      }));

      set({ user: data.user, isGuest: false });
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      // Fallback на локальную регистрацию если сервер недоступен
      const user = { email, name: name || email.split('@')[0] };
      await storage.setItem(AUTH_KEY, JSON.stringify({ user }));
      set({ user, isGuest: false });
      return { success: true, warning: 'Работа в офлайн режиме' };
    }
  },

  // Logout
  logout: async () => {
    try {
      // Получаем токен для отправки на сервер
      const stored = await storage.getItem(AUTH_KEY);
      if (stored) {
        const { token } = JSON.parse(stored);
        if (token) {
          try {
            await fetch(`${API_URL}/api/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
          } catch (error) {
            console.log('Server logout failed, continuing with local logout');
          }
        }
      }
      
      await storage.removeItem(AUTH_KEY);
      set({ user: null, isGuest: true });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  },

  // Получить токен для API запросов
  getToken: async () => {
    try {
      const stored = await storage.getItem(AUTH_KEY);
      if (stored) {
        const { token } = JSON.parse(stored);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },
}));
