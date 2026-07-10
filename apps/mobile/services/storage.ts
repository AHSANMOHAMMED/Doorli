import Constants from 'expo-constants';

// For local testing on an emulator, localhost works. For physical devices, we need the IP.
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000/api/v1';

export const uploadImage = async (imageUri: string, token: string | null): Promise<string> => {
  if (!token) throw new Error('Unauthorized: No token provided');

  const filename = imageUri.split('/').pop() || 'upload.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;

  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  try {
    const response = await fetch(`${API_URL}/storage/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success || !data.url) {
      throw new Error('Upload failed: Server did not return a valid URL');
    }

    return data.url;
  } catch (error) {
    console.error('Storage upload error:', error);
    throw error;
  }
};
