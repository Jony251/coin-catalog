import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRulerById, getDenominationsByRuler } from '../../services/database';
import { useAuthStore } from '../../stores/authStore';
import { getRulerImage } from '../../utils/images';

export default function RulerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isGuest = useAuthStore((state) => state.isGuest);
  const insets = useSafeAreaInsets();
  
  const [ruler, setRuler] = useState(null);
  const [denominations, setDenominations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const rulerData = await getRulerById(id);
      setRuler(rulerData);
      
      const denomData = await getDenominationsByRuler(id);
      setDenominations(denomData);
    } catch (error) {
      console.error('Error loading ruler:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get icon for denomination type
  const getDenominationIcon = (type) => {
    switch (type) {
      case 'gold': return { name: 'star', color: '#FFD700' };
      case 'silver_ruble': return { name: 'ellipse', color: '#C0C0C0' };
      case 'silver_small': return { name: 'ellipse-outline', color: '#A8A8A8' };
      case 'copper': return { name: 'ellipse', color: '#B87333' };
      case 'commemorative': return { name: 'trophy', color: '#9C27B0' };
      default: return { name: 'disc', color: '#607D8B' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  if (!ruler) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Правитель не найден</Text>
      </View>
    );
  }

  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 80) : insets.bottom + 20;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: bottomPadding }}>
      {/* Ruler header with image */}
      <View style={styles.headerContainer}>
        <View style={styles.rulerImageContainer}>
          <Image 
            source={getRulerImage(ruler.id, ruler.imageUrl)}
            style={styles.rulerImage}
          />
        </View>
        
        <View style={styles.rulerTitleContainer}>
          <Text style={styles.rulerName}>{ruler.name}</Text>
          <Text style={styles.rulerNameEn}>{ruler.nameEn}</Text>
          {ruler.title && (
            <Text style={styles.rulerTitleText}>{ruler.title}</Text>
          )}
          <View style={styles.yearsContainer}>
            <View style={styles.yearBadge}>
              <Text style={styles.yearLabel}>Правление</Text>
              <Text style={styles.yearValue}>{ruler.startYear} — {ruler.endYear}</Text>
            </View>
            <View style={styles.yearBadge}>
              <Text style={styles.yearLabel}>Жизнь</Text>
              <Text style={styles.yearValue}>{ruler.birthYear} — {ruler.deathYear}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Description */}
      {ruler.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>О правителе</Text>
          <Text style={styles.descriptionText}>{ruler.description}</Text>
        </View>
      )}

      {/* Succession */}
      {ruler.succession && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Престолонаследие</Text>
          <Text style={styles.descriptionText}>{ruler.succession}</Text>
        </View>
      )}

      {/* Coinage info */}
      {ruler.coinage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Монетное дело</Text>
          <Text style={styles.descriptionText}>{ruler.coinage}</Text>
        </View>
      )}

      {/* Denominations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Номиналы монет</Text>
        <Text style={styles.sectionSubtitle}>
          Выберите тип монет для просмотра каталога
        </Text>
        
        <View style={styles.denominationsGrid}>
          {denominations.map((denom) => {
            const icon = getDenominationIcon(denom.type);
            return (
              <TouchableOpacity
                key={denom.type}
                style={styles.denominationCard}
                onPress={() => router.push(`/denomination/${id}/${denom.type}`)}
              >
                <View style={[styles.denominationIcon, { backgroundColor: icon.color + '20' }]}>
                  <Ionicons name={icon.name} size={32} color={icon.color} />
                </View>
                <Text style={styles.denominationName}>{denom.name}</Text>
                <Text style={styles.denominationCount}>{denom.count} монет</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {denominations.length === 0 && (
          <View style={styles.emptyDenominations}>
            <Ionicons name="albums-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Монеты не добавлены</Text>
          </View>
        )}
      </View>
      </ScrollView>

      {/* Fixed button at bottom */}
      <TouchableOpacity
        style={[styles.viewAllButton, { bottom: bottomPadding }]}
        onPress={() => router.push(`/ruler/${id}/coins`)}
      >
        <Text style={styles.viewAllButtonText}>Все монеты правителя</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
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
  headerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  rulerImageContainer: {
    width: 150,
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  rulerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  rulerImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rulerTitleContainer: {
    alignItems: 'center',
  },
  rulerName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  rulerNameEn: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  rulerTitleText: {
    fontSize: 14,
    color: '#B8860B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  yearsContainer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  yearBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  yearLabel: {
    fontSize: 11,
    color: '#888',
  },
  yearValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  denominationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  denominationCard: {
    width: '31%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    margin: '1%',
    alignItems: 'center',
  },
  denominationIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  denominationName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  denominationCount: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  emptyDenominations: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
  },
  viewAllButton: {
    position: 'absolute',
    left: 10,
    right: 10,
    flexDirection: 'row',
    backgroundColor: '#B8860B',
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});
