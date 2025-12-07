import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserCoins, removeFromCollection } from '../../services/database';
import { useAuthStore } from '../../stores/authStore';

export default function CollectionScreen() {
  const router = useRouter();
  const isGuest = useAuthStore((state) => state.isGuest);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadCollection();
    }, [])
  );

  const loadCollection = async () => {
    try {
      const data = await getUserCoins(false); // isWishlist = false
      setCoins(data);
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (coin) => {
    const doRemove = async () => {
      await removeFromCollection(coin.catalogCoinId);
      loadCollection();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Удалить "${coin.name}" из коллекции?`)) {
        await doRemove();
      }
      return;
    }

    Alert.alert(
      'Удалить из коллекции?',
      `${coin.name}`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: doRemove,
        },
      ]
    );
  };

  const renderCoinItem = ({ item }) => (
    <TouchableOpacity
      style={styles.coinCard}
      onPress={() => router.push(`/coin/${item.catalogCoinId}`)}
      onLongPress={() => handleRemove(item)}
    >
      <View style={styles.coinImageContainer}>
        {item.obverseImage ? (
          <Image source={{ uri: item.obverseImage }} style={styles.coinImage} />
        ) : (
          <View style={styles.coinImagePlaceholder}>
            <Ionicons name="ellipse-outline" size={40} color="#ccc" />
          </View>
        )}
        <View style={styles.ownedBadge}>
          <Ionicons name="checkmark" size={12} color="#fff" />
        </View>
      </View>
      <View style={styles.coinInfo}>
        <Text style={styles.coinName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.coinDetails}>
          {item.denomination} • {item.year}
        </Text>
        <Text style={styles.coinCondition}>
          Состояние: {item.condition || 'Не указано'}
        </Text>
        {item.purchasePrice && (
          <Text style={styles.coinPrice}>
            Куплено за: {item.purchasePrice.toLocaleString()} ₽
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  // Calculate collection stats
  const totalValue = coins.reduce((sum, c) => sum + (c.purchasePrice || 0), 0);

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{coins.length}</Text>
          <Text style={styles.statLabel}>Монет</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {totalValue > 0 ? `${totalValue.toLocaleString()} ₽` : '—'}
          </Text>
          <Text style={styles.statLabel}>Стоимость</Text>
        </View>
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
            <Ionicons name="albums-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Коллекция пуста</Text>
            <Text style={styles.emptyText}>
              Добавляйте монеты из каталога в свою коллекцию
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
          Удерживайте монету для удаления из коллекции
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B8860B',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
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
  ownedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
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
  coinCondition: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  coinPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8860B',
    marginTop: 4,
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
