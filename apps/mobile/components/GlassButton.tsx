import { TouchableOpacity, TouchableOpacityProps, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DoorliColors, DoorliGradients, DoorliGlass, DoorliRadius } from '../constants/colors';

interface GlassButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'accent';
  icon?: React.ReactNode;
}

export function GlassButton({ title, variant = 'primary', icon, style, ...props }: GlassButtonProps) {
  const gradientColors =
    variant === 'primary'   ? DoorliGradients.primary :
    variant === 'accent'    ? DoorliGradients.teal :
    /* secondary */           ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.05)'] as const;

  const isGhost = variant === 'secondary';

  return (
    <TouchableOpacity activeOpacity={0.8} style={[styles.container, style]} {...props}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, isGhost && styles.ghostBorder]}
      >
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: DoorliRadius.lg,
    overflow: 'hidden',
    shadowColor: DoorliColors.deep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  ghostBorder: {
    borderWidth: 1,
    borderColor: DoorliGlass.borderStrong,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
