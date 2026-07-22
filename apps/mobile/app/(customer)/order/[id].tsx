import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchOrder, formatPrice } from '../../../lib/api';
import { MapPin, Search, CheckCircle, Clock, Package } from 'lucide-react-native';

const PRIMARY = '#006e25';
const PRIMARY_CONTAINER = '#00b241';
const ON_SURFACE = '#191c1d';
const ON_SURFACE_VARIANT = '#3d4a3c';
const SURFACE = '#f8f9fa';

export default function OrderSuccessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => fetchOrder(id),
    enabled: !!id,
  });

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </SafeAreaView>
    );
  }

  const itemsCount = order.items?.length || 0;
  const firstItem = order.items?.[0];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MapPin color={PRIMARY} size={24} />
          <Text style={styles.headerTitle}>LocalConnect</Text>
        </View>
        <TouchableOpacity style={styles.searchBtn}>
          <Search color={PRIMARY} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Animation & Hero */}
        <View style={styles.heroSection}>
          <View style={styles.successIconWrap}>
            <CheckCircle color={PRIMARY_CONTAINER} size={80} strokeWidth={1.5} />
          </View>
          <Text style={styles.heroTitle}>Order Placed Successfully!</Text>
          <Text style={styles.heroSubtitle}>
            Your connection with the local community just got stronger. We've notified the merchant.
          </Text>
        </View>

        {/* Bento Style Info Cards */}
        <View style={styles.gridContainer}>
          {/* Order ID Card */}
          <View style={styles.smallCard}>
            <Text style={styles.cardLabel}>Order ID</Text>
            <Text style={styles.cardValuePrimary}>#{order.orderNumber || order.id.slice(0,6).toUpperCase()}</Text>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
          </View>

          {/* Arrival Time Card */}
          <View style={styles.smallCard}>
            <Text style={styles.cardLabel}>Estimated Arrival</Text>
            <Text style={styles.cardValueSecondary}>30 - 45 mins</Text>
            <View style={styles.statusRow}>
              <Clock color={PRIMARY} size={16} />
              <Text style={styles.statusText}>On Schedule</Text>
            </View>
          </View>

          {/* Detailed Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.itemsBadge}>
                <Text style={styles.itemsBadgeText}>{itemsCount} Items</Text>
              </View>
            </View>

            <View style={styles.summaryContent}>
              <View style={styles.itemPreviewRow}>
                <View style={styles.itemPreviewImage}>
                  {firstItem?.product?.imageUrl ? (
                    <Image source={{ uri: firstItem.product.imageUrl }} style={styles.image} />
                  ) : (
                    <Package color="#a9c7ff" size={24} />
                  )}
                </View>
                <View style={styles.itemPreviewInfo}>
                  <Text style={styles.itemName}>{firstItem?.product?.name || 'Multiple Items'}</Text>
                  <Text style={styles.itemMeta}>Qty: {firstItem?.quantity || 1} • {formatPrice(Number(firstItem?.totalPrice || 0))}</Text>
                </View>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalValue}>{formatPrice(Number(order.totalAmount))}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.primaryBtn}
            onPress={() => router.push(`/(customer)/track/${order.id}`)}
          >
            <Package color="#fff" size={20} />
            <Text style={styles.primaryBtnText}>Track Your Order</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(customer)')}
          >
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SURFACE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: -0.5,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    alignItems: 'center',
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    maxWidth: 320,
  },
  successIconWrap: {
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ON_SURFACE,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: ON_SURFACE_VARIANT,
    textAlign: 'center',
    lineHeight: 20,
  },
  gridContainer: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  smallCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(188, 203, 183, 0.3)',
    shadowColor: PRIMARY,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ON_SURFACE_VARIANT,
    marginBottom: 4,
  },
  cardValuePrimary: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY,
  },
  cardValueSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff8a00',
  },
  progressBarBg: {
    marginTop: 16,
    width: '100%',
    height: 4,
    backgroundColor: '#edeeef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    width: '33%',
    backgroundColor: PRIMARY,
    borderRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(188, 203, 183, 0.3)',
    shadowColor: PRIMARY,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ON_SURFACE,
  },
  itemsBadge: {
    backgroundColor: '#ffdcc4', // secondary-fixed
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6f3900',
  },
  summaryContent: {
    gap: 12,
  },
  itemPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemPreviewImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemPreviewInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: ON_SURFACE,
  },
  itemMeta: {
    fontSize: 12,
    color: ON_SURFACE_VARIANT,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(188, 203, 183, 0.2)',
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: ON_SURFACE,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 500,
    marginTop: 24,
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e7e8e9',
    paddingVertical: 16,
    borderRadius: 16,
  },
  secondaryBtnText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
});
