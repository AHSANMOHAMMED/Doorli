import React, { useState } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploadImage } from '../services/storage';

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  token: string | null;
  defaultImage?: string | null;
  size?: number;
  rounded?: boolean;
}

export default function ImageUploader({ 
  onUploadSuccess, 
  token, 
  defaultImage, 
  size = 120, 
  rounded = true 
}: ImageUploaderProps) {
  const [image, setImage] = useState<string | null>(defaultImage || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImage(uri);
      handleUpload(uri);
    }
  };

  const handleUpload = async (uri: string) => {
    try {
      setUploading(true);
      setError(null);
      const uploadedUrl = await uploadImage(uri, token);
      setImage(uploadedUrl); // Switch to remote URL once uploaded
      onUploadSuccess(uploadedUrl);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      // If it fails, revert to previous state or keep local image but show error
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="items-center">
      <TouchableOpacity 
        onPress={pickImage}
        disabled={uploading}
        className={`bg-gray-100 items-center justify-center relative overflow-hidden`}
        style={{
          width: size,
          height: size,
          borderRadius: rounded ? size / 2 : 12,
          borderWidth: 2,
          borderColor: '#e5e7eb',
        }}
      >
        {image ? (
          <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Ionicons name="camera-outline" size={size / 3} color="#9ca3af" />
        )}

        {uploading && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center">
            <ActivityIndicator color="#ffffff" size="large" />
          </View>
        )}
      </TouchableOpacity>

      {error && (
        <Text className="text-red-500 text-sm mt-2">{error}</Text>
      )}
      
      {!uploading && !error && (
        <Text className="text-gray-500 text-xs mt-2 font-medium">Tap to change</Text>
      )}
    </View>
  );
}
