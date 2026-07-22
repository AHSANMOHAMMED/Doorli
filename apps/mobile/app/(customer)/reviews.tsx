import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react-native';

const PRIMARY = '#00B241';
const ON_SURFACE = '#002b5b';

const MOCK_REVIEWS = [
  {
    id: '1',
    vendorName: 'Burger King',
    date: 'Oct 12, 2026',
    rating: 5,
    comment: 'The food was amazing and the delivery was super fast! Will definitely order again.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: '2',
    vendorName: 'Fresh Mart Grocery',
    date: 'Sep 28, 2026',
    rating: 4,
    comment: 'Good selection of vegetables. Delivery was slightly delayed but the quality made up for it.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200&auto=format&fit=crop'
  },
];

export default function ReviewsScreen() {
  const router = useRouter();

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

      <ScrollView contentContainerStyle={styles.content}>
        {MOCK_REVIEWS.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare color="#9ca3af" size={48} />
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptySubtitle}>You haven't left any reviews for your past orders.</Text>
          </View>
        ) : (
          MOCK_REVIEWS.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.cardHeader}>
                <Image source={{ uri: review.image }} style={styles.vendorImage} />
                <View style={styles.headerInfo}>
                  <Text style={styles.vendorName}>{review.vendorName}</Text>
                  <Text style={styles.dateText}>{review.date}</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Star color="#914c00" size={14} fill="#914c00" />
                  <Text style={styles.ratingText}>{review.rating}.0</Text>
                </View>
              </View>
              <Text style={styles.commentText}>{review.comment}</Text>
            </View>
          ))
        )}
      </ScrollView>
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
