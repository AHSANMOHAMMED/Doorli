import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiClient } from '../../lib/axios';

export default function KycScreen() {
  const [status, setStatus] = useState<any>(null);
  const [idNumber, setIdNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [message, setMessage] = useState('');
  async function load() { try { setStatus((await apiClient.get('/wallet/kyc')).data?.data); } catch { setMessage('Sign in to manage KYC.'); } }
  useEffect(() => { load(); }, []);
  async function submitBasic() { try { await apiClient.post('/wallet/kyc/basic', { idNumber }); setMessage('Basic KYC submitted for review.'); setIdNumber(''); load(); } catch (error: any) { Alert.alert('KYC failed', error.response?.data?.error || 'Try again.'); } }
  async function submitFull() { try { await apiClient.post('/wallet/kyc/full', { documentUrl }); setMessage('Full KYC submitted for review.'); load(); } catch (error: any) { Alert.alert('KYC failed', error.response?.data?.error || 'Try again.'); } }
  return <SafeAreaView style={styles.screen}><Text style={styles.title}>Wallet Verification</Text><Text style={styles.subtitle}>Payouts require approved identity verification.</Text><View style={styles.status}><Text style={styles.label}>Current status</Text><Text style={styles.value}>{status ? `${status.status} · Level ${status.level}` : 'Not submitted'}</Text></View><View style={styles.card}><Text style={styles.heading}>Basic KYC</Text><TextInput style={styles.input} value={idNumber} onChangeText={setIdNumber} placeholder="National ID number" placeholderTextColor="#94a3b8" secureTextEntry /><TouchableOpacity style={styles.button} onPress={submitBasic}><Text style={styles.buttonText}>Submit basic KYC</Text></TouchableOpacity></View><View style={styles.card}><Text style={styles.heading}>Full KYC document</Text><TextInput style={styles.input} value={documentUrl} onChangeText={setDocumentUrl} placeholder="Uploaded document URL" placeholderTextColor="#94a3b8" autoCapitalize="none" /><TouchableOpacity style={styles.button} onPress={submitFull}><Text style={styles.buttonText}>Submit full KYC</Text></TouchableOpacity></View>{message ? <Text style={styles.message}>{message}</Text> : null}</SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#060b1c', padding: 20 }, title: { color: '#fff', fontSize: 30, fontWeight: '800' }, subtitle: { color: '#94a3b8', marginTop: 8 }, status: { backgroundColor: '#14213b', padding: 16, borderRadius: 14, marginTop: 20 }, label: { color: '#94a3b8' }, value: { color: '#5dcaa5', fontSize: 18, fontWeight: '800', marginTop: 6 }, card: { backgroundColor: '#101c35', padding: 16, borderRadius: 14, marginTop: 14, gap: 10 }, heading: { color: '#fff', fontSize: 18, fontWeight: '800' }, input: { color: '#fff', backgroundColor: '#182744', padding: 14, borderRadius: 10 }, button: { backgroundColor: '#1d9e75', padding: 14, borderRadius: 10, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '800' }, message: { color: '#5dcaa5', marginTop: 14 } });
