import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  Switch
} from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';

// Componente de item de menu individual
const MenuItem = React.memo(({
  icon,
  title,
  subtitle,
  onPress,
  chevron = false,
  toggle = false,
  value = false,
  textColor = '#FFFFFF',
  iconColor = '#A239FF',
}) => {
  return (
    <TouchableOpacity 
      style={styles.menuItem}
      onPress={onPress}
      disabled={toggle}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      
      <View style={styles.menuItemTextContainer}>
        <Text style={[styles.menuItemTitle, { color: textColor }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.menuItemSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>
      
      <View style={styles.menuItemRightContainer}>
        {toggle ? (
          <Switch
            value={value}
            onValueChange={onPress}
            trackColor={{ false: '#2C2C2C', true: '#A239FF40' }}
            thumbColor={value ? '#A239FF' : '#777777'}
            ios_backgroundColor="#2C2C2C"
          />
        ) : chevron ? (
          <Icon name="chevron-forward" size={20} color="#777777" />
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

// Componente de seção de menu
const MenuSection = React.memo(({
  title,
  items = [],
  style,
  titleColor = '#FFFFFF'
}) => {
  if (items.length === 0) return null;
  
  return (
    <View style={[styles.container, style]}>
      {title ? (
        <Text style={[styles.sectionTitle, { color: titleColor }]}>{title}</Text>
      ) : null}
      
      <View style={styles.sectionCard}>
        {items.map((item, index) => (
          <React.Fragment key={`${title}-${index}`}>
            <MenuItem {...item} />
            {index < items.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#BBBBBB',
    marginTop: 2,
  },
  menuItemRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2C',
    marginLeft: 68,
  },
});

export default MenuSection; 