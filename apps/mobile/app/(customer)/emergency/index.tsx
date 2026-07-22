import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertTriangle, Phone, ShieldAlert, ChevronLeft } from 'lucide-react-native';

export default function EmergencyScreen() {
  const router = useRouter();
  const [sosActive, setSosActive] = useState(false);

  const triggerSOS = () => {
    Alert.alert(
      'Trigger SOS?',
      'This will alert nearby responders, community leaders, and emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'ACTIVATE', 
          style: 'destructive',
          onPress: () => setSosActive(true) 
        }
      ]
    );
  };

  const cancelSOS = () => {
    Alert.alert(
      'Cancel SOS?',
      'Are you safe now?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, cancel', 
          style: 'default',
          onPress: () => setSosActive(false) 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Center</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.sosCard}>
          <Text style={styles.sosTitle}>Emergency SOS</Text>
          <Text style={styles.sosDesc}>
            Press to immediately share your location with nearby responders and trusted contacts.
          </Text>
          
          <TouchableOpacity 
            style={[styles.sosButton, sosActive && styles.sosButtonActive]} 
            onLongPress={sosActive ? cancelSOS : triggerSOS}
            delayLongPress={800}
          >
            <ShieldAlert color="#fff" size={48} />
            <Text style={styles.sosButtonText}>
              {sosActive ? 'SOS ACTIVE\nLong press to cancel' : 'HOLD FOR SOS'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionRow} onPress={() => {}}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <AlertTriangle color="#ef4444" size={24} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Report an Incident</Text>
              <Text style={styles.actionDesc}>Fire, accident, or suspicious activity</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={() => {}}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Phone color="#00B241" size={24} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Emergency Contacts</Text>
              <Text style={styles.actionDesc}>Manage your trusted contacts</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Alerts</Text>
          
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <AlertTriangle color="#f59e0b" size={16} />
              <Text style={styles.alertType}>Road Closure</Text>
              <Text style={styles.alertTime}>10m ago</Text>
            </View>
            <Text style={styles.alertBody}>
              Main Street is currently blocked due to a water main break. Please use alternate routes.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scroll: { padding: 16, gap: 24, paddingBottom: 40 },
  sosCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  sosTitle: { fontSize: 24, fontWeight: '800', color: '#ef4444', marginBottom: 8 },
  sosDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  sosButtonActive: {
    backgroundColor: '#991b1b',
  },
  sosButtonText: {
    color: '#fff',
    fontWeight: '800',
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  section: { gap: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  actionDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  alertCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 16,
    padding: 16,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  alertType: { color: '#f59e0b', fontWeight: '700', marginLeft: 8, flex: 1 },
  alertTime: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  alertBody: { color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
});
