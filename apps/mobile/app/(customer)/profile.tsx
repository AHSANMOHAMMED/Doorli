import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/auth';
import { fetchLoyalty, fetchProfile } from '../../lib/api';
import {
  User,
  MapPin,
  Bell,
  Settings,
  Star,
  ShoppingBag,
  Edit2,
  Menu,
} from 'lucide-react-native';

const PRIMARY = '#006e25';
const PRIMARY_CONTAINER = '#00b241';
const SECONDARY = '#914c00';
const TERTIARY = '#405f91';
const ERROR = '#ba1a1a';
const ON_SURFACE = '#191c1d';
const ON_SURFACE_VARIANT = '#3d4a3c';
const SURFACE = '#f8f9fa';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, isAuthenticated } = useAuthStore();

  const { data: loyalty } = useQuery({
    queryKey: ['loyalty'],
    queryFn: fetchLoyalty,
    enabled: isAuthenticated,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: isAuthenticated,
  });

  async function handleLogout() {
    await signOut();
    router.replace('/(auth)/login');
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.guest}>
          <Text style={styles.title}>Community Hub</Text>
          <Text style={styles.subtitle}>Sign in to manage orders, loyalty & bookings</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const avatarUrl = profile?.avatarUrl || user?.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2B5ptg-0FrGRTQYokMN37hI94QvtVFRfxRhVy85fx2ZZ7YTygIQtZLACu4JHqrvtJSnRBXveHIxFV3d_neNmyw0Mmj8AjaDoXNaj-871MGIZDHiYoj1n6WEJdLAz_mtqMbgXpAV5NqVG67rtLpcSFU_1ExYjvMYl0Th8TP7YXI3EoiuarUJe8L4k6O8n7y40O9_HxMZhkh0ci_pcslM3SNAneAEfy4DGGLRULETkjh1QKCGOy2oEDURwDZeUow2I-gq05Ep6wqvE';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.menuBtn}>
            <Menu color={PRIMARY} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community Hub</Text>
        </View>
        <View style={styles.smallAvatar}>
          <Image source={{ uri: avatarUrl }} style={styles.image} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.largeAvatar}>
              <Image source={{ uri: avatarUrl }} style={styles.image} />
            </View>
            <TouchableOpacity 
              style={styles.editBadge}
              onPress={() => router.push('/(customer)/profile-edit')}
            >
              <Edit2 color="#ffffff" size={16} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.nameText}>
            {profile?.fullName || user?.fullName || 'Customer'}
          </Text>
          
          <View style={styles.loyaltyPill}>
            <Star color="#2f1500" size={14} fill="#2f1500" />
            <Text style={styles.loyaltyPillText}>
              {loyalty ? `${loyalty.tier} Member` : 'Member'}
            </Text>
          </View>
        </View>

        {/* Stats Bento Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: PRIMARY }]}>{profile?.reviewsCount || '12'}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: SECONDARY }]}>{profile?.savedPlacesCount || '8'}</Text>
            <Text style={styles.statLabel}>Saved Places</Text>
          </View>
        </View>

        {/* Menu Items List */}
        <View style={styles.menuList}>
          {/* Personal Info */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(customer)/profile-edit')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 110, 37, 0.1)' }]}>
                <User color={PRIMARY} size={20} />
              </View>
              <Text style={styles.menuItemText}>Personal Information</Text>
            </View>
            <Settings color={ON_SURFACE_VARIANT} size={20} />
          </TouchableOpacity>

          {/* My Orders */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(customer)/orders')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(145, 76, 0, 0.1)' }]}>
                <ShoppingBag color={SECONDARY} size={20} />
              </View>
              <Text style={styles.menuItemText}>My Orders</Text>
            </View>
            <Settings color={ON_SURFACE_VARIANT} size={20} />
          </TouchableOpacity>

          {/* My Reviews */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(customer)/reviews' as any)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(64, 95, 145, 0.1)' }]}>
                <Star color={TERTIARY} size={20} />
              </View>
              <Text style={styles.menuItemText}>My Reviews</Text>
            </View>
            <Settings color={ON_SURFACE_VARIANT} size={20} />
          </TouchableOpacity>

          {/* Saved Addresses */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(customer)/addresses')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 110, 37, 0.1)' }]}>
                <MapPin color={PRIMARY} size={20} />
              </View>
              <Text style={styles.menuItemText}>Saved Addresses</Text>
            </View>
            <Settings color={ON_SURFACE_VARIANT} size={20} />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(customer)/notifications')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(186, 26, 26, 0.1)' }]}>
                <Bell color={ERROR} size={20} />
              </View>
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <View style={styles.notificationBadgeWrap}>
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
              <Settings color={ON_SURFACE_VARIANT} size={20} />
            </View>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(customer)/settings' as any)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(61, 74, 60, 0.1)' }]}>
                <Settings color={ON_SURFACE_VARIANT} size={20} />
              </View>
              <Text style={styles.menuItemText}>Settings</Text>
            </View>
            <Settings color={ON_SURFACE_VARIANT} size={20} />
          </TouchableOpacity>
        </View>

        {/* Logout Action */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: SURFACE 
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: SURFACE,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuBtn: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY,
  },
  smallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: PRIMARY_CONTAINER,
    overflow: 'hidden',
  },
  largeAvatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 60,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: PRIMARY_CONTAINER,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: ON_SURFACE,
    marginBottom: 8,
  },
  loyaltyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffdcc4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  loyaltyPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2f1500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    maxWidth: 500,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(225, 227, 228, 0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ON_SURFACE_VARIANT,
    marginTop: 4,
  },
  menuList: {
    width: '100%',
    maxWidth: 500,
    gap: 8,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e7e8e9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: ON_SURFACE,
  },
  notificationBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationBadge: {
    backgroundColor: ERROR,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  logoutBtn: {
    width: '100%',
    maxWidth: 500,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(186, 26, 26, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '600',
    color: ERROR,
  },
  guest: { 
    padding: 24, 
    flex: 1, 
    justifyContent: 'center' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: PRIMARY 
  },
  subtitle: { 
    color: ON_SURFACE_VARIANT, 
    marginTop: 6, 
    marginBottom: 20 
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { 
    fontWeight: '700', 
    color: '#ffffff', 
    fontSize: 16 
  },
});
