import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart } from 'lucide-react-native';

export default function Cart() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ShoppingCart color="#525252" size={48} />
        <Text style={styles.title}>Your Cart is Empty</Text>
        <Text style={styles.subtitle}>Add items from local businesses to get started.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    color: '#a3a3a3',
    fontSize: 15,
    textAlign: 'center',
  },
});
