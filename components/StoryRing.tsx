import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface StoryRingProps {
  size?: number;
  seen?: boolean;
  hasStories?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}

const StoryRing: React.FC<StoryRingProps> = ({ 
  size = 80, 
  seen = false, 
  hasStories = true,
  style,
  children 
}) => {
  const ringSize = size + 4; // Ring is slightly larger than the avatar (made thinner)

  if (!hasStories) {
    // No ring for users without stories
    return (
      <View style={[style, { width: size, height: size }]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, style, { width: ringSize, height: ringSize }]}>
      {seen ? (
        // Gray ring for seen stories
        <View style={[
          styles.seenRing, 
          { 
            width: ringSize, 
            height: ringSize, 
            borderRadius: ringSize / 2,
          }
        ]} />
      ) : (
        // Gradient ring for unseen stories
        <LinearGradient
          colors={['#f2709c', '#ff9472', '#4776E6', '#8E54E9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientRing, 
            { 
              width: ringSize, 
              height: ringSize, 
              borderRadius: ringSize / 2,
            }
          ]}
        />
      )}
      <View style={[styles.content, { width: size, height: size }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gradientRing: {
    position: 'absolute',
  },
  seenRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100, // Large value ensures circle
  },
});

export default StoryRing; 