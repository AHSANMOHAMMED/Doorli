import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface GradientBackgroundProps {
  children: React.ReactNode;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Base deep background */}
      <View style={styles.baseBg} />
      
      {/* Top Right Blob (Teal) */}
      <LinearGradient
        colors={['rgba(13, 148, 136, 0.4)', 'transparent']}
        style={[styles.blob, styles.blobTopRight]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Bottom Left Blob (Primary Blue) */}
      <LinearGradient
        colors={['rgba(26, 86, 219, 0.4)', 'transparent']}
        style={[styles.blob, styles.blobBottomLeft]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0, y: 1 }}
      />
      
      {/* Center Blob (Amber/Warm) */}
      <LinearGradient
        colors={['rgba(217, 119, 6, 0.15)', 'transparent']}
        style={[styles.blob, styles.blobCenter]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 0 }}
      />

      {/* Content overlay */}
      <View style={StyleSheet.absoluteFillObject}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1A', // Very dark blue/slate base
  },
  baseBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0F1A',
  },
  blob: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
  },
  blobTopRight: {
    top: -width * 0.5,
    right: -width * 0.5,
  },
  blobBottomLeft: {
    bottom: -width * 0.5,
    left: -width * 0.5,
  },
  blobCenter: {
    top: height * 0.2,
    left: -width * 0.2,
    width: width * 2,
    height: width * 2,
    borderRadius: width,
  }
});
