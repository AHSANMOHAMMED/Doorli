import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';

export default function ReviewScreen() {
  const { vendorId, orderId } = useLocalSearchParams<{ vendorId: string; orderId?: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await apiClient.post('/reviews', {
        vendorId,
        orderId,
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert('Thanks!', 'Your review was submitted.');
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Rate your experience</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setRating(n)}>
            <Text style={[styles.star, n <= rating && styles.starOn]}>{n <= rating ? '★' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Tell others about this shop..."
        placeholderTextColor="#94a3b8"
        value={comment}
        onChangeText={setComment}
        multiline
      />
      <TouchableOpacity style={styles.btn} onPress={submit} disabled={submitting}>
        <Text style={styles.btnText}>{submitting ? 'Submitting...' : 'Submit review'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  stars: { flexDirection: 'row', gap: 8, marginVertical: 20 },
  star: { fontSize: 36, color: '#475569' },
  starOn: { color: '#fbbf24' },
  input: {
    minHeight: 100,
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#fff',
    textAlignVertical: 'top',
  },
  btn: { marginTop: 20, backgroundColor: '#0ea5e9', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
