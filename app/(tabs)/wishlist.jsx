import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserCoins, removeFromCollection, moveToCollection } from '../../services/database';
import { useAuthStore } from '../../stores/authStore';

export default function WishlistScreen() {
  const router = useRouter();
  const isGuest = useAuthStore((state) => state.isGuest);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [])
  );

  const loadWishlist = async () => {
    try {
      const data = await getUserCoins(true); // isWishlist = true
      setCoins(data);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (coin) => {
    Alert.alert(
      coin.name,
      'Что сделать с этой монетой?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Купил! В коллекцию',
          onPress: async () => {
            await moveToCollection(coin.userCoinId);
            loadWishlist();
          },
        },
        {
          text: 'Удалить из желаемых',
          style: 'destructive',
          onPress: async () => {
            await removeFromCollection(coin.userCoinId);
            loadWishlist();
          },
        },
      ]
    );
  };

  const renderCoinItem = ({ item }) => (
    <TouchableOpacity
      style={styles.coinCard}
      onPress={() => router.push(`/coin/${item.catalogCoinId}`)}
      onLongPress={() => handleAction(item)}
    >
      <View style={styles.coinImageContainer}>
        {item.obverseImage ? (
          <Image source={{ uri: item.obverseImage }} style={styles.coinImage} />
        ) : (
          <View style={styles.coinImagePlaceholder}>
            <Ionicons name="ellipse-outline" size={40} color="#ccc" />
          </View>
        )}
        <View style={styles.wishlistBadge}>
          <Ionicons name="heart" size={12} color="#fff" />
        </View>
      </View>
      <View style={styles.coinInfo}>
        <Text style={styles.coinName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.coinDetails}>
          {item.denomination} • {item.year}
        </Text>
        {item.estimatedValueMin && (
          <Text style={styles.coinPrice}>
            ~{item.estimatedValueMin.toLocaleString()} - {item.estimatedValueMax?.toLocaleString()} ₽
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.buyButton}
        onPress={() => handleAction(item)}
      >
        <Ionicons name="checkmark-circle-outline" size={28} color="#4CAF50" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="heart" size={24} color="#E91E63" />
        <Text style={styles.headerText}>
          {coins.length} {coins.length === 1 ? 'монета' : 'монет'} в списке желаний
        </Text>
      </View>

      {/* Coins list */}
      <FlatList
        data={coins}
        renderItem={renderCoinItem}
        keyExtractor={(item) => item.userCoinId}
        style={styles.coinsList}
        contentContainerStyle={styles.coinsContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Список желаний пуст</Text>
            <Text style={styles.emptyText}>
              Добавляйте монеты, которые хотите приобрести
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/')}
            >
              <Text style={styles.emptyButtonText}>Открыть каталог</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {coins.length > 0 && (
        <Text style={styles.hint}>
          Нажмите ✓ когда купите монету
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  adBanner: {
    backgroundColor: '#fff3cd',
    padding: 10,
    alignItems: 'center',
  },
  adText: {
    color: '#856404',
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  headerText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  coinsList: {
    flex: 1,
  },
  coinsContent: {
    padding: 10,
    paddingBottom: 100,
    flexGrow: 1,
  },
  coinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  coinImageContainer: {
    width: 60,
    height: 60,
    marginRight: 12,
    position: 'relative',
  },
  coinImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  coinImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E91E63',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinInfo: {
    flex: 1,
  },
  coinName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  coinDetails: {
    fontSize: 13,
    color: '#666',
  },
  coinPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8860B',
    marginTop: 4,
  },
  buyButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: '#B8860B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    padding: 10,
  },
});
