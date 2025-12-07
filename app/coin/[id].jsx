import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCoinById, addToCollection, isInCollection, removeFromCollection } from '../../services/database';
import { useAuthStore } from '../../stores/authStore';

export default function CoinDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isGuest = useAuthStore((state) => state.isGuest);
  const insets = useSafeAreaInsets();
  
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [owned, setOwned] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    loadCoin();
  }, [id]);

  const loadCoin = async () => {
    try {
      const data = await getCoinById(id);
      setCoin(data);
      
      const status = await isInCollection(id);
      setOwned(status.owned);
      setWishlisted(status.wishlisted);
    } catch (error) {
      console.error('Error loading coin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = async () => {
    try {
      await addToCollection(id, false); // isWishlist = false
      setOwned(true);
      setWishlisted(false);
      Alert.alert('Готово!', 'Монета добавлена в коллекцию');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить монету');
    }
  };

  const handleAddToWishlist = async () => {
    try {
      await addToCollection(id, true); // isWishlist = true
      setWishlisted(true);
      Alert.alert('Готово!', 'Монета добавлена в желаемые');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить монету');
    }
  };

  const handleRemoveFromCollection = async () => {
    // For web, use window.confirm since Alert.alert may not work properly
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Удалить монету из коллекции?');
      if (confirmed) {
        try {
          await removeFromCollection(id);
          setOwned(false);
          setWishlisted(false);
        } catch (error) {
          window.alert('Не удалось удалить монету');
        }
      }
      return;
    }
    
    // For native platforms
    Alert.alert(
      'Удалить из коллекции?',
      'Монета будет удалена из вашей коллекции',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromCollection(id);
              setOwned(false);
              setWishlisted(false);
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить монету');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  if (!coin) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Монета не найдена</Text>
      </View>
    );
  }

  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 80) : insets.bottom + 20;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: owned ? 20 : bottomPadding + 80 }}
      >

      {/* Coin images */}
      <View style={styles.imagesContainer}>
        <View style={styles.imageWrapper}>
          {coin.obverseImage ? (
            <Image source={{ uri: coin.obverseImage }} style={styles.coinImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="ellipse-outline" size={80} color="#ccc" />
              <Text style={styles.placeholderText}>Аверс</Text>
            </View>
          )}
        </View>
        <View style={styles.imageWrapper}>
          {coin.reverseImage ? (
            <Image source={{ uri: coin.reverseImage }} style={styles.coinImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="ellipse-outline" size={80} color="#ccc" />
              <Text style={styles.placeholderText}>Реверс</Text>
            </View>
          )}
        </View>
      </View>

      {/* Status badges */}
      {(owned || wishlisted) && (
        <View style={styles.statusContainer}>
          {owned && (
            <TouchableOpacity 
              style={[styles.statusBadge, styles.ownedBadge]}
              onPress={handleRemoveFromCollection}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.statusText}>В коллекции</Text>
              <Ionicons name="close" size={14} color="rgba(255,255,255,0.7)" style={{marginLeft: 6}} />
            </TouchableOpacity>
          )}
          {wishlisted && !owned && (
            <TouchableOpacity 
              style={[styles.statusBadge, styles.wishlistBadge]}
              onPress={handleRemoveFromCollection}
            >
              <Ionicons name="heart" size={16} color="#fff" />
              <Text style={styles.statusText}>В желаемых</Text>
              <Ionicons name="close" size={14} color="rgba(255,255,255,0.7)" style={{marginLeft: 6}} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Coin name */}
      <View style={styles.titleContainer}>
        <Text style={styles.coinName}>{coin.name}</Text>
        {coin.nameEn && <Text style={styles.coinNameEn}>{coin.nameEn}</Text>}
      </View>

      {/* Price estimate */}
      {(coin.estimatedValueMin || coin.estimatedValueMax) && (
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Оценочная стоимость</Text>
          <Text style={styles.priceValue}>
            {coin.estimatedValueMin?.toLocaleString()} — {coin.estimatedValueMax?.toLocaleString()} ₽
          </Text>
          {coin.rarity && (
            <Text style={styles.rarityText}>Редкость: {coin.rarity}</Text>
          )}
        </View>
      )}

      {/* Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Характеристики</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Номинал</Text>
          <Text style={styles.detailValue}>{coin.denomination}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Год</Text>
          <Text style={styles.detailValue}>{coin.year}</Text>
        </View>
        
        {coin.ruler && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Правитель</Text>
            <Text style={styles.detailValue}>{coin.ruler}</Text>
          </View>
        )}
        
        {coin.metal && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Металл</Text>
            <Text style={styles.detailValue}>{coin.metal}</Text>
          </View>
        )}
        
        {coin.weight && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Вес</Text>
            <Text style={styles.detailValue}>{coin.weight} г</Text>
          </View>
        )}
        
        {coin.diameter && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Диаметр</Text>
            <Text style={styles.detailValue}>{coin.diameter} мм</Text>
          </View>
        )}
        
        {coin.mint && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Монетный двор</Text>
            <Text style={styles.detailValue}>{coin.mint}</Text>
          </View>
        )}
        
        {coin.mintage && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Тираж</Text>
            <Text style={styles.detailValue}>{coin.mintage.toLocaleString()} шт.</Text>
          </View>
        )}
        
        {coin.catalogNumber && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Каталог</Text>
            <Text style={styles.detailValue}>{coin.catalogNumber}</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {coin.description && (
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>Описание</Text>
          <Text style={styles.descriptionText}>{coin.description}</Text>
        </View>
      )}

      </ScrollView>

      {/* Fixed action buttons */}
      {!owned && (
        <View style={[styles.fixedActionsContainer, { paddingBottom: bottomPadding }]}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddToCollection}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.addButtonText}>В коллекцию</Text>
          </TouchableOpacity>
          
          {!wishlisted && (
            <TouchableOpacity
              style={styles.wishlistButton}
              onPress={handleAddToWishlist}
            >
              <Ionicons name="heart-outline" size={24} color="#B8860B" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  imageWrapper: {
    marginHorizontal: 10,
  },
  coinImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  imagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  ownedBadge: {
    backgroundColor: '#4CAF50',
  },
  wishlistBadge: {
    backgroundColor: '#E91E63',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  titleContainer: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  coinName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  coinNameEn: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  priceCard: {
    backgroundColor: '#FFF8E1',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B8860B',
    marginTop: 5,
  },
  rarityText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  detailsCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  descriptionCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  fixedActionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    paddingTop: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#B8860B',
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  wishlistButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#B8860B',
  },
  bottomPadding: {
    height: 80,
  },
});
