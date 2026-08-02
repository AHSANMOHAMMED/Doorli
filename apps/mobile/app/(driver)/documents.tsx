import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../lib/axios';
import { uploadImage } from '../../services/storage';

type DocumentType = 'driver_license' | 'vehicle_registration' | 'insurance_certificate' | 'vehicle_photo';

const DOCUMENTS: { type: DocumentType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'driver_license', label: 'Driver License', icon: 'card-outline' },
  { type: 'vehicle_registration', label: 'Vehicle Registration', icon: 'car-outline' },
  { type: 'insurance_certificate', label: 'Insurance Certificate', icon: 'shield-checkmark-outline' },
  { type: 'vehicle_photo', label: 'Vehicle Photo', icon: 'camera-outline' },
];

export default function DriverDocuments() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);

  const { data: documents, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-documents'],
    queryFn: async () => {
      const res = await apiClient.get('/drivers/me/documents');
      return res.data?.data ?? {};
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ type, url }: { type: DocumentType; url: string }) => {
      await apiClient.post('/drivers/me/documents', { type, url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-documents'] });
    },
  });

  const pickImage = useCallback(
    async (type: DocumentType) => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled || !result.assets?.[0]) return null;
      return result.assets[0].uri;
    },
    [],
  );

  const handleUpload = useCallback(
    async (type: DocumentType) => {
      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Please allow access to your photos.');
          return;
        }

        Alert.alert('Upload Document', 'Choose a source', [
          {
            text: 'Gallery',
            onPress: async () => {
              setUploadingType(type);
              try {
                const uri = await pickImage(type);
                if (!uri) {
                  setUploadingType(null);
                  return;
                }
                const url = await uploadImage(uri, accessToken);
                await saveMutation.mutateAsync({ type, url });
                Alert.alert('Success', 'Document uploaded successfully');
              } catch (err) {
                Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Try again');
              } finally {
                setUploadingType(null);
              }
            },
          },
          {
            text: 'Camera',
            onPress: async () => {
              const camPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (!camPermission.granted) {
                Alert.alert('Permission Required', 'Please allow camera access.');
                return;
              }

              setUploadingType(type);
              try {
                const camResult = await ImagePicker.launchCameraAsync({
                  quality: 0.8,
                  allowsEditing: true,
                });

                if (camResult.canceled || !camResult.assets?.[0]) {
                  setUploadingType(null);
                  return;
                }

                const url = await uploadImage(camResult.assets[0].uri, accessToken);
                await saveMutation.mutateAsync({ type, url });
                Alert.alert('Success', 'Document uploaded successfully');
              } catch (err) {
                Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Try again');
              } finally {
                setUploadingType(null);
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } catch (err) {
        Alert.alert('Error', 'Something went wrong');
        setUploadingType(null);
      }
    },
    [accessToken, pickImage, saveMutation],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#00B241" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#00B241" />}
      >
        <Text style={styles.title}>Documents</Text>
        <Text style={styles.subtitle}>Upload required documents to start delivering</Text>

        <View style={styles.list}>
          {DOCUMENTS.map((doc) => {
            const isUploaded = !!documents?.[doc.type];
            const isUploading = uploadingType === doc.type;

            return (
              <TouchableOpacity
                key={doc.type}
                style={[styles.docCard, isUploaded && styles.docCardUploaded]}
                onPress={() => !isUploading && handleUpload(doc.type)}
                activeOpacity={0.7}
              >
                <View style={styles.docLeft}>
                  <View style={[styles.docIcon, isUploaded && styles.docIconUploaded]}>
                    <Ionicons name={doc.icon} size={24} color={isUploaded ? '#86efac' : '#94a3b8'} />
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docLabel}>{doc.label}</Text>
                    <View style={styles.statusRow}>
                      {isUploading ? (
                        <ActivityIndicator size="small" color="#00B241" />
                      ) : (
                        <Ionicons
                          name={isUploaded ? 'checkmark-circle' : 'time-outline'}
                          size={16}
                          color={isUploaded ? '#00B241' : '#f59e0b'}
                        />
                      )}
                      <Text style={[styles.statusText, isUploaded && styles.statusUploaded]}>
                        {isUploading ? 'Uploading...' : isUploaded ? 'Uploaded' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#475569" />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  list: { marginTop: 20, gap: 10 },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  docCardUploaded: { borderColor: '#064e3b' },
  docLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIconUploaded: { backgroundColor: '#064e3b' },
  docInfo: { flex: 1 },
  docLabel: { fontSize: 15, fontWeight: '600', color: '#f8fafc' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statusText: { fontSize: 12, color: '#f59e0b', fontWeight: '500' },
  statusUploaded: { color: '#00B241' },
});
