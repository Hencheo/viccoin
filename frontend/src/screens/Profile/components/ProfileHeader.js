import React from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Text } from 'react-native-paper';

// Componente memoizado para evitar re-renderizações desnecessárias
const ProfileHeader = React.memo(({ 
  user = {}, 
  onEditPress 
}) => {
  // Valores padrão para usuários sem dados completos
  const nome = user?.nome || 'Usuário';
  const email = user?.email || 'usuario@exemplo.com';
  const fotoUrl = user?.fotoUrl || null;
  
  // Iniciais do usuário para avatar padrão
  const getInitials = () => {
    if (!nome) return '?';
    
    const parts = nome.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {fotoUrl ? (
            <Image 
              source={{ uri: fotoUrl }} 
              style={styles.avatar} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.initialsAvatar}>
              <Text style={styles.initialsText}>{getInitials()}</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.editAvatarButton}
            onPress={onEditPress}
          >
            <Icon name="camera-outline" size={16} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.userInfoContainer}>
          <Text style={styles.userName}>{nome}</Text>
          <Text style={styles.userEmail}>{email}</Text>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={onEditPress}
          >
            <Text style={styles.editProfileText}>Editar Perfil</Text>
            <Icon name="pencil-outline" size={16} color="#A239FF" style={{marginLeft: 4}} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  profileCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2C2C2C',
  },
  initialsAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#A239FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#A239FF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E1E1E',
  },
  userInfoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 12,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(162, 57, 255, 0.1)',
    borderRadius: 20,
  },
  editProfileText: {
    fontSize: 12,
    color: '#A239FF',
    fontWeight: '500',
  },
});

export default ProfileHeader; 