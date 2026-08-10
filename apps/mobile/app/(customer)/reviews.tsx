import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react-native';
import { fetchMyReviews, type Review } from '../../lib/api';
import { DoorliColors } from '../../constants/colors';

const PRIMARY = DoorliColors.primary;

export default function ReviewsScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchMyReviews();
      setReviews(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReviews();
  }, [fetchReviews]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={DoorliColors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>My Reviews</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MessageSquare color={DoorliColors.textDim} size={48} />
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity onPress={fetchReviews} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />
          }
          showsVerticalScrollIndicator={false}
        >
          {reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <MessageSquare color={DoorliColors.textDim} size={40} />
              </View>
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptySubtitle}>You haven't left any reviews for your past orders.</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.cardHeader}>
                  {review.vendor?.logoUrl ? (
                    <Image source={{ uri: review.vendor.logoUrl }} style={styles.vendorImage} />
                  ) : (
                    <View style={[styles.vendorImage, styles.vendorPlaceholder]}>
                      <Text style={styles.vendorPlaceholderText}>
                        {(review.vendor?.businessName || 'Vendor').charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.headerInfo}>
                    <Text style={styles.vendorName}>{review.vendor?.businessName || 'Vendor'}</Text>
                    <Text style={styles.dateText}>{formatDate(review.createdAt)}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Star color={DoorliColors.gold} size={14} fill={DoorliColors.gold} />
                    <Text style={styles.ratingText}>{review.rating}.0</Text>
                  </View>
                </View>
                {review.comment && (
                  <Text style={styles.commentText}>{review.comment}</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DoorliColors.navy },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  title: { fontSize: 18, fontWeight: '700', color: DoorliColors.text },
  content: { padding: 16, paddingBottom: 100 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: DoorliColors.text, marginTop: 12 },
  emptySubtitle: {
    fontSize: 14,
    color: DoorliColors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendorImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  vendorPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
  },
  vendorPlaceholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: { flex: 1, marginLeft: 12 },
  vendorName: { fontSize: 15, fontWeight: '700', color: DoorliColors.text },
  dateText: { fontSize: 12, color: DoorliColors.textDim, marginTop: 2 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250,199,117,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  ratingText: { fontSize: 13, fontWeight: '700', color: DoorliColors.gold },
  commentText: {
    fontSize: 14,
    color: DoorliColors.textMuted,
    lineHeight: 20,
  },
});
