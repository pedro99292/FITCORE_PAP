import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';

export default function HeaderStats() {
  // These values would typically come from your app's state management
  const streakCount = 7; // Example streak count
  const currencyCount = 350; // Example currency count

  return (
    <View style={styles.container}>
      {/* Streaks Counter on the Left */}
      <View style={styles.counterContainer}>
        <Image 
          source={require('../assets/images/streaks.png')} 
          style={styles.icon} 
          resizeMode="contain"
        />
        <Text style={styles.counterText}>{streakCount}</Text>
        <Text style={styles.labelText}>dias</Text>
      </View>

      {/* Title in the Center */}
      <Text style={styles.title}>FitCore</Text>

      {/* Currency Counter on the Right */}
      <View style={styles.counterContainer}>
        <Image 
          source={require('../assets/images/coin.png')} 
          style={styles.icon} 
          resizeMode="contain"
        />
        <Text style={styles.counterText}>{currencyCount}</Text>
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
    backgroundColor: '#2D2B3F',
    borderBottomWidth: 1,
    borderBottomColor: 'white',
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
    color: 'white',
  },
  labelText: {
    fontSize: 15,
    color: '#ccc',
    marginLeft: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
}); 