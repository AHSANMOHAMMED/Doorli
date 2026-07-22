import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { homeForRole, useAuthStore } from '../../store/auth';
import { useI18nStore } from '../../lib/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';

type AuthTab = 'password' | 'otp';
type AuthMode = 'signin' | 'signup';
type Role = 'customer' | 'vendor' | 'driver';

const PRIMARY = '#006e25';
const PRIMARY_CONTAINER = '#00b241';
const ON_SURFACE = '#191c1d';
const ON_SURFACE_VARIANT = '#3d4a3c';
const SURFACE = '#f8f9fa';
const OUTLINE_VARIANT = '#bccbb7';

export default function LoginScreen() {
  const router = useRouter();
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const verifyOtpAndLogin = useAuthStore((s) => s.verifyOtpAndLogin);
  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const { t } = useI18nStore();

  const [authTab, setAuthTab] = useState<AuthTab>('password');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [identifier, setIdentifier] = useState('customer@doorli.test');
  const [password, setPassword] = useState('Doorli123!');
  const [expectedRole, setExpectedRole] = useState<Role>('customer');
  const [businessKey, setBusinessKey] = useState('Corner Grocery');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('customer');
  const [loading, setLoading] = useState(false);

  function goHome(roleHint?: string | null) {
    const r = roleHint || useAuthStore.getState().user?.role;
    router.replace(homeForRole(r) as any);
  }

  async function handlePasswordLogin() {
    if (!identifier.trim() || !password) return alert('Enter your email and password');
    setLoading(true);
    try {
      const { error } = await loginWithPassword(
        identifier.trim(),
        password,
        expectedRole,
        expectedRole === 'vendor' ? businessKey.trim() : undefined,
      );
      if (error) alert(error);
      else goHome(expectedRole);
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    if (!phone || phone.length < 9) return alert('Enter a valid phone number');
    if (mode === 'signup' && !fullName) return alert('Enter your full name');
    setLoading(true);
    try {
      const { error } = await sendOtp(phone);
      if (error) alert(error);
      else setOtpSent(true);
    } catch (err: any) {
      alert(err.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!code || code.length !== 6) return alert('Enter a valid 6-digit OTP code');
    setLoading(true);
    try {
      const { error } = await verifyOtpAndLogin(
        phone,
        code,
        mode === 'signup' ? fullName : undefined,
        mode === 'signup' ? role : undefined,
      );
      if (error) alert(error);
      else goHome(useAuthStore.getState().user?.role || (mode === 'signup' ? role : 'customer'));
    } catch (err: any) {
      alert(err.message || 'Error verifying OTP');
    } finally {
      setLoading(false);
    }
  }

  const renderSegmentedControl = (
    options: { label: string; value: string }[],
    selectedValue: string,
    onSelect: (val: any) => void
  ) => (
    <View style={styles.segmentContainer}>
      {options.map((opt) => {
        const isActive = selectedValue === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segmentBtn, isActive && styles.segmentActive]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Logo Anchor */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <MapPin color={PRIMARY} size={32} />
              <Text style={styles.title}>LocalConnect</Text>
            </View>
            <Text style={styles.subtitle}>Your community super-app for everything local.</Text>
          </View>

          {/* High-Quality 3D Illustration Area */}
          <View style={styles.illustrationContainer}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfei4BAIv0TFouF0vK7sxBa0Ejo8GVkKuoYMJ1bU6NDCsP5NKnDGN4KtG8ucWG4LOIE52xaEdCLV1CQe3qa0--GBA3--KbkEPvclp9V7rMJlHe1ZAqWmdfBtTcafSfvBMRa7nkWypoCe0kmjMH4ZfBoqtaQ9r9O6Dbw9KQcHGC7mOZVjb4mtkDBD5AjzZlo8XENp0V9RJ4yII6QKUyh51cwQTpTIpl7zWp_rz2E9k8m3AL_Vajd0j1dRbPH6WHC268EvdG5Nr8bhU' }} 
              style={styles.illustration} 
            />
          </View>

          <View style={styles.inputSection}>
            {renderSegmentedControl(
              [
                { label: 'Password', value: 'password' },
                { label: 'OTP', value: 'otp' },
              ],
              authTab,
              setAuthTab
            )}

            {authTab === 'password' ? (
              <>
                <Text style={styles.label}>Log in as</Text>
                {renderSegmentedControl(
                  [
                    { label: 'Customer', value: 'customer' },
                    { label: 'Vendor', value: 'vendor' },
                    { label: 'Driver', value: 'driver' },
                  ],
                  expectedRole,
                  setExpectedRole
                )}
                
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={identifier}
                  onChangeText={setIdentifier}
                />
                
                {expectedRole === 'vendor' && (
                  <>
                    <Text style={styles.label}>Business ID</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Your Business ID"
                      placeholderTextColor="#9ca3af"
                      value={businessKey}
                      onChangeText={setBusinessKey}
                    />
                  </>
                )}
                
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                
                <TouchableOpacity style={styles.primaryBtn} onPress={handlePasswordLogin} disabled={loading}>
                  {loading ? <ActivityIndicator color="#003b10" /> : <Text style={styles.primaryBtnText}>Continue</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {!otpSent ? (
                  <>
                    <Text style={styles.sectionTitle}>Ready to get started?</Text>
                    <Text style={styles.sectionSubtitle}>Enter your mobile number to join the community.</Text>

                    {renderSegmentedControl(
                      [
                        { label: 'Sign In', value: 'signin' },
                        { label: 'Sign Up', value: 'signup' },
                      ],
                      mode,
                      setMode
                    )}

                    {mode === 'signup' && (
                      <>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="John Doe"
                          placeholderTextColor="#9ca3af"
                          value={fullName}
                          onChangeText={setFullName}
                        />
                        <Text style={styles.label}>Register as</Text>
                        {renderSegmentedControl(
                          [
                            { label: 'Customer', value: 'customer' },
                            { label: 'Vendor', value: 'vendor' },
                            { label: 'Driver', value: 'driver' },
                          ],
                          role,
                          setRole
                        )}
                      </>
                    )}
                    
                    <View style={styles.phoneInputContainer}>
                      <View style={styles.phonePrefixBox}>
                        <View style={styles.flagPlaceholder}>
                          <View style={styles.flagLine} />
                        </View>
                        <Text style={styles.phonePrefixText}>+971</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="50 000 0000"
                        placeholderTextColor="#6d7b6a"
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        value={phone}
                        onChangeText={setPhone}
                        maxLength={9}
                      />
                    </View>
                    
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp} disabled={loading}>
                      {loading ? <ActivityIndicator color="#003b10" /> : <Text style={styles.primaryBtnText}>Continue</Text>}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.sectionTitle}>Check your phone</Text>
                    <Text style={styles.sectionSubtitle}>We sent a 6-digit code to +971 {phone}</Text>

                    <TextInput
                      style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 8 }]}
                      placeholder="123456"
                      placeholderTextColor="#9ca3af"
                      keyboardType="number-pad"
                      value={code}
                      onChangeText={setCode}
                      maxLength={6}
                    />
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={loading}>
                      {loading ? <ActivityIndicator color="#003b10" /> : <Text style={styles.primaryBtnText}>Verify & Login</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ghostBtn} onPress={() => setOtpSent(false)}>
                      <Text style={styles.ghostBtnText}>Change Phone Number</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: SURFACE },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: ON_SURFACE_VARIANT,
    marginTop: 8,
    textAlign: 'center',
  },
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  illustration: {
    width: 240,
    height: 240,
    resizeMode: 'contain',
  },
  inputSection: {
    width: '100%',
    maxWidth: 400,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ON_SURFACE,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: ON_SURFACE_VARIANT,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#edeeef',
    borderRadius: 12,
    padding: 4,
    width: '100%',
    marginBottom: 24,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: ON_SURFACE_VARIANT,
  },
  segmentTextActive: {
    color: ON_SURFACE,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: ON_SURFACE_VARIANT,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: ON_SURFACE,
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  phonePrefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderColor: OUTLINE_VARIANT,
  },
  flagPlaceholder: {
    width: 24,
    height: 16,
    backgroundColor: '#dc2626', // red-600
    borderRadius: 2,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  flagLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#ffffff',
    opacity: 0.5,
  },
  phonePrefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: ON_SURFACE,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: ON_SURFACE,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: PRIMARY_CONTAINER,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY_CONTAINER,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#003b10', // on-primary-container
    fontSize: 18,
    fontWeight: '600',
  },
  ghostBtn: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  ghostBtnText: {
    color: ON_SURFACE_VARIANT,
    fontSize: 15,
    fontWeight: '600',
  },
});
