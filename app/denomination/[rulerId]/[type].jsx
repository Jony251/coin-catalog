import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCoinsByDenomination, isInCollection, addToCollection, removeFromCollection } from '../../../services/database';
import { useAuthStore } from '../../../stores/authStore';

export default function DenominationScreen() {
  const { rulerId, type } = useLocalSearchParams();
  const router = useRouter();
  const isGuest = useAuthStore((state) => state.isGuest);
  
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collectionStatus, setCollectionStatus] = useState({});

  useEffect(() => {
    loadCoins();
  }, [rulerId, type]);

  const loadCoins = async () => {
    try {
      const data = await getCoinsByDenomination(rulerId, type);
      setCoins(data);
      
      // Check collection status for each coin
      const status = {};
      for (const coin of data) {
        status[coin.id] = await isInCollection(coin.id);
      }
      setCollectionStatus(status);
    } catch (error) {
      console.error('Error loading coins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCollection = async (coinId) => {
    const current = collectionStatus[coinId];
    try {
      if (current?.owned) {
        // Find userCoinId and remove
        // For now, just toggle the state
        setCollectionStatus(prev => ({
          ...prev,
          [coinId]: { ...prev[coinId], owned: false }
        }));
      } else {
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

  const getDenominationTitle = () => {
    switch (type) {
      case 'gold': return 'Золотые монеты';
      case 'silver_ruble': return 'Серебряные рубли';
      case 'silver_small': return 'Серебряная мелочь';
      case 'copper': return 'Медные монеты';
      case 'commemorative': return 'Памятные монеты';
      default: return 'Монеты';
    }
  };

  const renderCoinItem = ({ item }) => {
    const status = collectionStatus[item.id] || {};
    
    return (
      <TouchableOpacity
        style={styles.coinCard}
        onPress={() => router.push(`/coin/${item.id}`)}
      >
        {/* TODO: Добавить изображение монеты в assets/images/coins/{item.id}_obverse.jpg */}
        <View style={styles.coinImageContainer}>
          {item.obverseImage ? (
            <Image source={{ uri: item.obverseImage }} style={styles.coinImage} />
          ) : (
            <View style={styles.coinImagePlaceholder}>
              <Ionicons name="ellipse-outline" size={40} color="#ccc" />
            </View>
          )}
          {status.owned && (
            <View style={styles.ownedBadge}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          )}
        </View>
        
        <View style={styles.coinInfo}>
          <Text style={styles.coinName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.coinYear}>{item.year} г.</Text>
          
          <View style={styles.coinDetails}>
            {item.metal && (
              <Text style={styles.detailText}>{item.metal}</Text>
            )}
            {item.weight && (
              <Text style={styles.detailText}>{item.weight} г</Text>
            )}
            {item.mint && (
              <Text style={styles.detailText}>{item.mint}</Text>
            )}
          </View>
          
          {item.estimatedValueMin && (
            <Text style={styles.coinPrice}>
              {item.estimatedValueMin.toLocaleString()} — {item.estimatedValueMax?.toLocaleString()} ₽
            </Text>
          )}
          
          {item.rarity && item.rarity !== 'Common' && (
            <View style={styles.rarityBadge}>
              <Text style={styles.rarityText}>{item.rarity}</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.collectionButton, status.owned && styles.collectionButtonActive]}
          onPress={(e) => {
            e.stopPropagation();
            handleToggleCollection(item.id);
          }}
        >
          <Ionicons 
            name={status.owned ? 'checkmark-circle' : 'add-circle-outline'} 
            size={28} 
            color={status.owned ? '#4CAF50' : '#B8860B'} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getDenominationTitle()}</Text>
        <Text style={styles.headerSubtitle}>{coins.length} монет в каталоге</Text>
      </View>

      {/* Coins list */}
      <FlatList
        data={coins}
        renderItem={renderCoinItem}
        keyExtractor={(item) => item.id}
        style={styles.coinsList}
        contentContainerStyle={styles.coinsContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={48} color="#ccc" />
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
  coinsList: {
    flex: 1,
  },
  coinsContent: {
    padding: 10,
    paddingBottom: 100,
  },
  coinCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  coinImageContainer: {
    width: 70,
    height: 70,
    marginRight: 12,
    position: 'relative',
  },
  coinImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  coinImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  coinInfo: {
    flex: 1,
  },
  coinName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  coinYear: {
    fontSize: 14,
    color: '#B8860B',
    fontWeight: '500',
  },
  coinDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#888',
    marginRight: 10,
  },
  coinPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  rarityBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  rarityText: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '600',
  },
  collectionButton: {
    padding: 8,
  },
  collectionButtonActive: {
    opacity: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
});
