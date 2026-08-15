import { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiClient } from '../../lib/axios';

type Profile = { id: string; name: string; relationship: string; phone?: string };
export default function FamilyScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  async function load() { try { setProfiles((await apiClient.get('/family-profiles')).data?.data || []); } catch { setMessage('Sign in to manage family profiles.'); } }
  useEffect(() => { load(); }, []);
  async function add() { if (!name.trim() || !relationship.trim()) return Alert.alert('Family profile', 'Name and relationship are required.'); try { await apiClient.post('/family-profiles', { name: name.trim(), relationship: relationship.trim(), phone: phone.trim() || undefined }); setName(''); setRelationship(''); setPhone(''); setMessage('Profile added.'); load(); } catch (error: any) { Alert.alert('Could not add profile', error.response?.data?.error || 'Try again.'); } }
  return <SafeAreaView style={styles.screen}><Text style={styles.title}>Family Profiles</Text><Text style={styles.subtitle}>Save people you regularly book rides, health appointments, and services for.</Text><FlatList data={profiles} keyExtractor={(item) => item.id} renderItem={({ item }) => <View style={styles.profile}><Text style={styles.name}>{item.name}</Text><Text style={styles.muted}>{item.relationship}{item.phone ? ` · ${item.phone}` : ''}</Text></View>} ListEmptyComponent={<Text style={styles.muted}>No profiles yet.</Text>} ListFooterComponent={<View style={styles.form}><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor="#94a3b8" /><TextInput style={styles.input} value={relationship} onChangeText={setRelationship} placeholder="Relationship" placeholderTextColor="#94a3b8" /><TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone (optional)" placeholderTextColor="#94a3b8" keyboardType="phone-pad" /><TouchableOpacity style={styles.button} onPress={add}><Text style={styles.buttonText}>Add family member</Text></TouchableOpacity>{message ? <Text style={styles.message}>{message}</Text> : null}</View>} contentContainerStyle={styles.list} /></SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#060b1c', padding: 16 }, title: { color: '#fff', fontSize: 30, fontWeight: '800' }, subtitle: { color: '#94a3b8', marginTop: 8, lineHeight: 20 }, list: { gap: 10, paddingVertical: 20 }, profile: { backgroundColor: '#101c35', padding: 16, borderRadius: 14 }, name: { color: '#fff', fontWeight: '800', fontSize: 17 }, muted: { color: '#94a3b8', marginTop: 5 }, form: { marginTop: 15, gap: 10 }, input: { backgroundColor: '#182744', color: '#fff', padding: 14, borderRadius: 12 }, button: { backgroundColor: '#1d9e75', padding: 15, borderRadius: 12, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '800' }, message: { color: '#5dcaa5' } });
