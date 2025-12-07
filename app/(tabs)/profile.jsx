import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { clearAllData } from '../../services/database';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isGuest, logout } = useAuthStore();

  const handleClearData = () => {
    Alert.alert(
      'Очистить все данные?',
      'Это удалит вашу коллекцию и список желаний. Каталог останется.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Готово', 'Данные очищены');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Выйти из аккаунта?',
      '',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* User info */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Ionicons 
            name={isGuest ? 'person-outline' : 'person'} 
            size={40} 
            color={isGuest ? '#888' : '#B8860B'} 
          />
        </View>
        <View style={styles.userInfo}>
          {isGuest ? (
            <>
              <Text style={styles.userName}>Гость</Text>
              <Text style={styles.userStatus}>Без регистрации</Text>
            </>
          ) : (
            <>
              <Text style={styles.userName}>{user?.name || user?.email}</Text>
              <Text style={styles.userStatus}>Зарегистрирован</Text>
            </>
          )}
        </View>
        {!isGuest && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={16} color="#B8860B" />
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}
      </View>

      {/* Guest benefits */}
      {isGuest && (
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Преимущества регистрации:</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Без рекламы</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Расширенный каталог</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Синхронизация между устройствами</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Детальная информация о монетах</Text>
          </View>
          
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerButtonText}>Зарегистрироваться</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Уже есть аккаунт? Войти</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menu items */}
      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={24} color="#333" />
          <Text style={styles.menuText}>О приложении</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="star-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Оценить приложение</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="share-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Поделиться</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
          <Ionicons name="trash-outline" size={24} color="#E91E63" />
          <Text style={[styles.menuText, { color: '#E91E63' }]}>Очистить данные</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {!isGuest && (
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#E91E63" />
            <Text style={[styles.menuText, { color: '#E91E63' }]}>Выйти</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {/* Version */}
      <Text style={styles.version}>Версия 1.0.0</Text>
      <Text style={styles.copyright}>Каталог монет Царской России</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userStatus: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  premiumText: {
    color: '#B8860B',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 12,
  },
  benefitsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  registerButton: {
    backgroundColor: '#B8860B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    padding: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#B8860B',
    fontSize: 14,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  version: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    marginTop: 20,
  },
  copyright: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 11,
    marginTop: 5,
  },
});
