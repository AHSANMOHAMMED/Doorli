import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DoorliColors, DoorliGradients } from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface GradientBackgroundProps {
  children: React.ReactNode;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Base deep background */}
      <View style={styles.baseBg} />

      {/* Top Right Blob — Doorli Teal */}
      <LinearGradient
        colors={DoorliGradients.bgTeal}
        style={[styles.blob, styles.blobTopRight]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Bottom Left Blob — Doorli Blue */}
      <LinearGradient
        colors={DoorliGradients.bgBlue}
        style={[styles.blob, styles.blobBottomLeft]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Center Blob — Doorli Gold accent */}
      <LinearGradient
        colors={DoorliGradients.bgGold}
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
    minHeight: height,
    width: '100%',
    backgroundColor: DoorliColors.navy,
  },
  baseBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DoorliColors.navy,
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
  },
});
