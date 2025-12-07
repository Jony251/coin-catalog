import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from '../services/database';
import { useAuthStore } from '../stores/authStore';

// Fixed height for Android navigation bar
const ANDROID_NAV_BAR_HEIGHT = 48;

export default function RootLayout() {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    // Initialize database and load user on app start
    const init = async () => {
      await initDatabase();
      await loadUser();
    };
    init();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#B8860B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="coin/[id]" 
          options={{ 
            title: 'Монета',
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="ruler/[id]" 
          options={{ 
            title: 'Правитель',
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="ruler/[id]/coins" 
          options={{ 
            title: 'Монеты',
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="denomination/[rulerId]/[type]" 
          options={{ 
            title: 'Номиналы',
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="auth/login" 
          options={{ 
            title: 'Вход',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="auth/register" 
          options={{ 
            title: 'Регистрация',
            presentation: 'modal',
          }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}
