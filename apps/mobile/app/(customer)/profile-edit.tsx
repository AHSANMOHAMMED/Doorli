import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, User, Phone, Mail } from 'lucide-react-native';
import { fetchProfile, updateProfile } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import ImageUploader from '../../components/ImageUploader';

const PRIMARY = '#00B241';
const ON_SURFACE = '#002b5b';

export default function ProfileEditScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const profile = await fetchProfile();
        if (profile) {
          setName(profile.fullName ?? '');
          setPhone(profile.phone ?? '');
          setEmail(profile.email ?? '');
          setProfilePhotoUrl(profile.profilePhotoUrl ?? '');
        }
      } catch {
        Alert.alert('Error', 'Could not load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        fullName: name.trim(),
        email: email.trim() || undefined,
        profilePhotoUrl: profilePhotoUrl || undefined,
      });
      Alert.alert('Saved', 'Profile updated successfully.');
      router.back();
    } catch (e: unknown) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft color={ON_SURFACE} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, saving && { opacity: 0.6 }]} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 48 }} />
        ) : (
        <>
        <View style={styles.avatarSection}>
          <ImageUploader
            token={token}
            defaultImage={profilePhotoUrl}
            onUploadSuccess={(url) => setProfilePhotoUrl(url)}
            size={100}
            rounded
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputContainer}>
            <User color="#9ca3af" size={20} />
            <TextInput 
              style={styles.input} 
              value={name} 
              onChangeText={setName} 
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <Phone color="#9ca3af" size={20} />
            <TextInput 
              style={styles.input} 
              value={phone} 
              onChangeText={setPhone} 
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Mail color="#9ca3af" size={20} />
            <TextInput 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        </>
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
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: PRIMARY,
    borderRadius: 20,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    shadowColor: '#002b5b',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: PRIMARY,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: ON_SURFACE,
    fontWeight: '500',
  },
});
