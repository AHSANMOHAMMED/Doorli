import { TouchableOpacity, TouchableOpacityProps, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

export function GlassButton({ title, variant = 'primary', icon, style, ...props }: GlassButtonProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <TouchableOpacity activeOpacity={0.8} style={[styles.container, style]} {...props}>
      <LinearGradient
        colors={isPrimary ? ['rgba(37, 99, 235, 0.8)', 'rgba(14, 165, 233, 0.8)'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          !isPrimary && styles.secondaryBorder,
        ]}
      >
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={[styles.text, !isPrimary && styles.textSecondary]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSecondary: {
    color: 'rgba(255,255,255,0.9)',
  },
});
