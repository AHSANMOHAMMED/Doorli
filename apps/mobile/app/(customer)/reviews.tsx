import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react-native';
import { fetchMyReviews } from '../../lib/api';

const PRIMARY = '#00B241';
const ON_SURFACE = '#002b5b';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  photos: string[] | null;
  createdAt: string;
  vendor: {
    id: string;
    businessName: string;
    logoUrl: string | null;
  };
}

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
      console.error('Failed to fetch reviews:', err);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft color={ON_SURFACE} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>My Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MessageSquare color="#9ca3af" size={48} />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />
          }
        >
          {reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageSquare color="#9ca3af" size={48} />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptySubtitle}>You haven't left any reviews for your past orders.</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.cardHeader}>
                  {review.vendor.logoUrl ? (
                    <Image source={{ uri: review.vendor.logoUrl }} style={styles.vendorImage} />
                  ) : (
                    <View style={[styles.vendorImage, styles.vendorPlaceholder]}>
                      <Text style={styles.vendorPlaceholderText}>
                        {review.vendor.businessName.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.headerInfo}>
                    <Text style={styles.vendorName}>{review.vendor.businessName}</Text>
                    <Text style={styles.dateText}>{formatDate(review.createdAt)}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Star color="#914c00" size={14} fill="#914c00" />
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
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  content: {
    padding: 16,
  },
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ON_SURFACE,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendorImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  vendorPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
  },
  vendorPlaceholderText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 220, 196, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#914c00',
    marginLeft: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});
