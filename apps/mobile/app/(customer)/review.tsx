import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';
import { DoorliColors } from '../../constants/colors';
import { ArrowLeft, Star, Send } from 'lucide-react-native';
import React from 'react';

const PRIMARY = DoorliColors.primary;

export default function ReviewScreen() {
  const { vendorId, orderId } = useLocalSearchParams<{ vendorId: string; orderId?: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (rating < 1) {
      Alert.alert('Select rating', 'Please tap a star to rate.');
      return;
    }
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

  const ratingLabel =
    rating === 5 ? 'Excellent' :
    rating === 4 ? 'Great' :
    rating === 3 ? 'Good' :
    rating === 2 ? 'Fair' :
    rating === 1 ? 'Poor' : '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color={DoorliColors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write a Review</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.prompt}>How was your experience?</Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(n)} style={styles.starBtn}>
                <Star
                  color={n <= rating ? DoorliColors.gold : DoorliColors.textDim}
                  size={40}
                  fill={n <= rating ? DoorliColors.gold : 'transparent'}
                  strokeWidth={n <= rating ? 0 : 1.5}
                />
              </TouchableOpacity>
            ))}
          </View>
          {ratingLabel ? (
            <Text style={styles.ratingLabel}>{ratingLabel}</Text>
          ) : null}

          <View style={styles.textAreaWrap}>
            <TextInput
              style={styles.textArea}
              placeholder="Tell others about this shop..."
              placeholderTextColor={DoorliColors.textDim}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <Text style={styles.submitText}>Submitting...</Text>
            ) : (
              <>
                <Send color="#fff" size={18} />
                <Text style={styles.submitText}>Submit Review</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DoorliColors.navy },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DoorliColors.text },
  content: { flex: 1, padding: 20 },
  prompt: { fontSize: 24, fontWeight: '800', color: DoorliColors.text, marginBottom: 24 },
  starsContainer: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 8 },
  starBtn: { padding: 4 },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: DoorliColors.gold,
    marginBottom: 28,
  },
  textAreaWrap: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  textArea: {
    minHeight: 140,
    padding: 16,
    color: DoorliColors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    padding: 16,
    borderRadius: 14,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
