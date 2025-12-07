import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCoinsByRuler, getRulerById, isInCollection, addToCollection } from '../../../services/database';
import { useAuthStore } from '../../../stores/authStore';

export default function RulerCoinsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isGuest = useAuthStore((state) => state.isGuest);
  const insets = useSafeAreaInsets();
  
  const [ruler, setRuler] = useState(null);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collectionStatus, setCollectionStatus] = useState({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const rulerData = await getRulerById(id);
      setRuler(rulerData);
      
      const coinsData = await getCoinsByRuler(id);
      setCoins(coinsData);
      
      // Check collection status
      const status = {};
      for (const coin of coinsData) {
        status[coin.id] = await isInCollection(coin.id);
      }
      setCollectionStatus(status);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCollection = async (coinId) => {
    const current = collectionStatus[coinId];
    try {
      if (!current?.owned) {
        await addToCollection(coinId, false);
        setCollectionStatus(prev => ({
          ...prev,
          [coinId]: { owned: true, wishlisted: false }
        }));
      }
    } catch (error) {
      console.error('Error toggling collection:', error);
    }
  };

  const renderCoinItem = ({ item }) => {
    const status = collectionStatus[item.id] || {};
    
    return (
      <TouchableOpacity
        style={styles.coinCard}
        onPress={() => router.push(`/coin/${item.id}`)}
      >
        <View style={styles.coinImageContainer}>
          {item.obverseImage ? (
            <Image source={{ uri: item.obverseImage }} style={styles.coinImage} />
          ) : (
            <View style={styles.coinImagePlaceholder}>
              <Ionicons name="ellipse-outline" size={35} color="#ccc" />
            </View>
          )}
          {status.owned && (
            <View style={styles.ownedBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          )}
        </View>
        
        <View style={styles.coinInfo}>
          <Text style={styles.coinName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.coinDenom}>{item.denomination} • {item.year}</Text>
          <Text style={styles.coinMetal}>{item.metal}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation();
            handleToggleCollection(item.id);
          }}
        >
          <Ionicons 
            name={status.owned ? 'checkmark-circle' : 'add-circle-outline'} 
            size={24} 
            color={status.owned ? '#4CAF50' : '#B8860B'} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {ruler?.name || 'Монеты'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {coins.length} монет • {ruler?.startYear}—{ruler?.endYear}
        </Text>
      </View>

      <FlatList
        data={coins}
        renderItem={renderCoinItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Загрузка...' : 'Монеты не найдены'}
            </Text>
          </View>
        }
      />
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
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 10,
    paddingBottom: 100,
  },
  coinCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  coinImageContainer: {
    width: 55,
    height: 55,
    marginRight: 10,
    position: 'relative',
  },
  coinImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  coinImagePlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  coinInfo: {
    flex: 1,
  },
  coinName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  coinDenom: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  coinMetal: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  addButton: {
    padding: 5,
  },
  emptyContainer: {
    paddingTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});
