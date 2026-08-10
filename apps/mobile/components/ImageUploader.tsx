import React, { useState } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, Text, StyleSheet } from 'react-native';
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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 8,
  },
  hintText: {
    color: '#6b7280',
    fontSize: 10,
    marginTop: 8,
    fontWeight: '500',
  },
});

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
      setImage(uploadedUrl);
      onUploadSuccess(uploadedUrl);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={pickImage}
        disabled={uploading}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: rounded ? size / 2 : 12,
            borderWidth: 2,
            borderColor: '#e5e7eb',
          },
        ]}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Ionicons name="camera-outline" size={size / 3} color="#9ca3af" />
        )}

        {uploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#ffffff" size="large" />
          </View>
        )}
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {!uploading && !error && (
        <Text style={styles.hintText}>Tap to change</Text>
      )}
    </View>
  );
}