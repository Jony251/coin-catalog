import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Fixed Android navigation bar height
const ANDROID_NAV_BAR_HEIGHT = 50;

export default function TabsLayout() {
  const isGuest = useAuthStore((state) => state.isGuest);
  const insets = useSafeAreaInsets();
  
  // Use fixed height for Android, insets for iOS
  const bottomPadding = Platform.OS === 'android' ? ANDROID_NAV_BAR_HEIGHT : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#B8860B',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
          paddingBottom: bottomPadding,
          paddingTop: 5,
          height: 60 + bottomPadding,
        },
        headerStyle: {
          backgroundColor: '#B8860B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Каталог',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Коллекция',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Желаемые',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          tabBarBadge: isGuest ? '!' : undefined,
        }}
      />
    </Tabs>
  );
}
