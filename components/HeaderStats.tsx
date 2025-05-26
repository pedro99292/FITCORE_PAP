import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function HeaderStats() {
  // These values would typically come from your app's state management
  const streakCount = 7; // Example streak count
  const currencyCount = 350; // Example currency count
  const { isDarkMode, colors } = useTheme();

  // Format value with K suffix if over 1000
  const formatValue = (val: number): string => {
    if (val >= 1000) {
      if (val < 10000) {
        // Format with one decimal place (like 1.2K)
        return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      } else {
        // Format without decimal places (like 10K)
        return Math.floor(val / 1000) + 'K';
      }
    }
    return val.toString();
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: isDarkMode ? '#2D2B3F' : colors.surface,
        borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
      }
    ]}>
      {/* Streaks Counter on the Left */}
      <View style={styles.counterContainer}>
        <Image 
          source={require('../assets/images/streaks.png')} 
          style={styles.icon} 
          resizeMode="contain"
        />
        <Text style={[styles.counterText, { color: colors.text }]}>{streakCount}</Text>
        <Text style={[styles.labelText, { color: isDarkMode ? '#ccc' : '#666' }]}>dias</Text>
      </View>

      {/* Title in the Center */}
      <Text style={[styles.title, { color: colors.text }]}>FitCore</Text>

      {/* Currency Counter on the Right */}
      <View style={styles.counterContainer}>
        <Image 
          source={require('../assets/images/coin.png')} 
          style={styles.icon} 
          resizeMode="contain"
        />
        <Text style={[styles.counterText, { color: colors.text }]}>{formatValue(currencyCount)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 36,
    height: 36,
    marginRight: 8,
  },
  counterText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  labelText: {
    fontSize: 15,
    marginLeft: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
}); 