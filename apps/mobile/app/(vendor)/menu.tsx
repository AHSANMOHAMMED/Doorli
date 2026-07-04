import { View, Text, StyleSheet } from 'react-native';

export default function VendorMenu() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product Manager</Text>
      <Text style={styles.text}>
        Manage products on the vendor web dashboard at localhost:3000
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 18, fontWeight: '600', color: '#2563eb', marginBottom: 8 },
  text: { color: '#64748b', textAlign: 'center', lineHeight: 22 },
});
