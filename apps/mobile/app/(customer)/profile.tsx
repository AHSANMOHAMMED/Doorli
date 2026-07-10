import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth';
import GradientBackground from '../../components/GradientBackground';
import ImageUploader from '../../components/ImageUploader';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000/api/v1';

export default function ProfileScreen() {
  const { user, token, logout, setUser } = useAuthStore();
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const handleAvatarUpload = async (url: string) => {
    if (!token) return;
    try {
      setUpdating(true);
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: url })
      });

      if (!res.ok) throw new Error('Failed to update profile');
      
      const updatedUser = await res.json();
      setUser(updatedUser);
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (err) {
      Alert.alert('Error', 'Could not save profile picture.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View className="flex-1">
      <GradientBackground />
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-4 pt-16">
          <View className="bg-white/90 p-6 rounded-3xl mt-4 items-center">
            
            <ImageUploader 
              onUploadSuccess={handleAvatarUpload}
              token={token}
              defaultImage={user?.avatar}
              size={140}
              rounded={true}
            />

            <View className="mt-6 items-center">
              <Text className="text-2xl font-bold text-gray-800">{user?.name || 'Guest User'}</Text>
              <Text className="text-gray-500 mt-1">{user?.phone || 'No phone number'}</Text>
            </View>

            <View className="w-full h-px bg-gray-200 my-6" />

            <View className="w-full space-y-4">
              <TouchableOpacity className="flex-row items-center p-3 bg-gray-50 rounded-2xl">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-4">
                  <Ionicons name="person-outline" size={20} color="#3b82f6" />
                </View>
                <Text className="flex-1 font-medium text-gray-700">Account Details</Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center p-3 bg-gray-50 rounded-2xl">
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-4">
                  <Ionicons name="location-outline" size={20} color="#10b981" />
                </View>
                <Text className="flex-1 font-medium text-gray-700">Saved Addresses</Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleLogout}
                className="flex-row items-center p-3 bg-red-50 rounded-2xl mt-4"
              >
                <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-4">
                  <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                </View>
                <Text className="flex-1 font-medium text-red-500">Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
