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
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { homeForRole, useAuthStore } from '../../store/auth';
import { useI18nStore } from '../../lib/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';

// Required so the browser session can be resumed after redirect on Android
WebBrowser.maybeCompleteAuthSession();

type AuthTab = 'password' | 'otp';
type AuthMode = 'signin' | 'signup';
type Role = 'customer' | 'vendor' | 'driver' | 'admin' | 'super_admin';

import { DoorliColors, DoorliGlass } from '../../constants/colors';
import { MOBILE_APP_HOME, MOBILE_APP_ROLE, MOBILE_AUTH_ROLE, MOBILE_DEFAULT_IDENTIFIER } from '../../role-config';

const PRIMARY = DoorliColors.primary;
const PRIMARY_CONTAINER = DoorliColors.sky;
const ON_SURFACE = DoorliColors.text;
const ON_SURFACE_VARIANT = DoorliColors.textMuted;
const INPUT_TEXT = '#0f172a';
const INPUT_PLACEHOLDER = '#64748b';
const SURFACE = DoorliColors.navyMid;
const OUTLINE_VARIANT = DoorliGlass.borderStrong;

export default function LoginScreen() {
  const router = useRouter();
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const verifyOtpAndLogin = useAuthStore((s) => s.verifyOtpAndLogin);
  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const registerCustomer = useAuthStore((s) => s.registerCustomer);
  const registerVendor = useAuthStore((s) => s.registerVendor);
  const { t } = useI18nStore();

  const [authTab, setAuthTab] = useState<AuthTab>('password');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [identifier, setIdentifier] = useState(MOBILE_DEFAULT_IDENTIFIER[MOBILE_APP_ROLE]);
  const [password, setPassword] = useState('Doorli123!');
  const [expectedRole, setExpectedRole] = useState<Role>(MOBILE_AUTH_ROLE as Role);
  const [businessKey, setBusinessKey] = useState('Corner Grocery');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('grocery');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>(MOBILE_AUTH_ROLE as Role);
  const [loading, setLoading] = useState(false);

  const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_URL ?? 'http://localhost:4001';

  function goHome(role?: string) {
    const r = role || useAuthStore.getState().user?.role || 'customer';
    router.replace((MOBILE_APP_ROLE === 'cashier' ? MOBILE_APP_HOME.cashier : homeForRole(r)) as any);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const redirectUri = Linking.createURL('auth/callback');

      const result = await WebBrowser.openAuthSessionAsync(
        `${AUTH_URL}/auth/google?mobile_redirect=${encodeURIComponent(redirectUri)}`,
        redirectUri,
      );

      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        const token = parsed.queryParams?.token as string | undefined;
        const refresh = parsed.queryParams?.refresh as string | undefined;
        const newUser = parsed.queryParams?.newUser as string | undefined;
        const tempToken = parsed.queryParams?.tempToken as string | undefined;

        if (token && refresh) {
          useAuthStore.getState().setTokens(token, refresh);
          const payload = JSON.parse(atob(token.split('.')[1]));
          router.replace(homeForRole(payload.role) as any);
        } else if (newUser === 'true' && tempToken) {
          router.push({
            pathname: '/(auth)/select-role',
            params: { tempToken },
          } as any);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
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

  async function handleRegistration() {
    if (!fullName.trim() || !identifier.trim() || !password) {
      return alert('Enter your full name, email, and password');
    }
    if (password.length < 6) return alert('Password must be at least 6 characters');
    setLoading(true);
    try {
      const result = expectedRole === 'vendor'
        ? await registerVendor({
            fullName: fullName.trim(),
            email: identifier.trim(),
            password,
            businessName: businessName.trim(),
            category,
          })
        : await registerCustomer({
            fullName: fullName.trim(),
            email: identifier.trim(),
            password,
          });
      if (result.error) alert(result.error);
      else goHome(expectedRole);
    } catch (err: any) {
      alert(err.message || 'Registration failed');
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
              <Text style={styles.title}>Doorli</Text>
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
            <Text style={styles.label}>Account Type</Text>
            {renderSegmentedControl(
              [
                { label: 'Sign In', value: 'signin' },
                { label: 'Create Account', value: 'signup' },
              ],
              mode,
              setMode,
            )}

            <Text style={styles.label}>Application</Text>
            <View style={styles.lockedRole}>
              <Text style={styles.lockedRoleText}>{MOBILE_APP_ROLE.replace('_', ' ')} app</Text>
              <Text style={styles.lockedRoleHint}>This build is locked to this role.</Text>
            </View>

            {mode === 'signup' && (
              <>
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} placeholder="Your full name" placeholderTextColor={INPUT_PLACEHOLDER} value={fullName} onChangeText={setFullName} />
              </>
            )}

            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} placeholder="name@example.com" placeholderTextColor={INPUT_PLACEHOLDER} autoCapitalize="none" keyboardType="email-address" value={identifier} onChangeText={setIdentifier} />

            {mode === 'signup' && expectedRole === 'vendor' && (
              <>
                <Text style={styles.label}>Business Name</Text>
                <TextInput style={styles.input} placeholder="Your business name" placeholderTextColor={INPUT_PLACEHOLDER} value={businessName} onChangeText={setBusinessName} />
                <Text style={styles.label}>Business Category</Text>
                {renderSegmentedControl(
                  [{ label: 'Grocery', value: 'grocery' }, { label: 'Restaurant', value: 'restaurant' }, { label: 'Service', value: 'service' }],
                  category,
                  setCategory,
                )}
              </>
            )}

            {mode === 'signin' && expectedRole === 'vendor' && (
              <>
                <Text style={styles.label}>Business ID or Name</Text>
                <TextInput style={styles.input} placeholder="Corner Grocery" placeholderTextColor={INPUT_PLACEHOLDER} value={businessKey} onChangeText={setBusinessKey} />
              </>
            )}

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} placeholder="At least 6 characters" placeholderTextColor={INPUT_PLACEHOLDER} secureTextEntry value={password} onChangeText={setPassword} />

            {mode === 'signup' && (expectedRole === 'driver' || expectedRole === 'admin') && (
              <Text style={styles.helperText}>
                {expectedRole === 'driver'
                  ? 'Driver accounts are created by Doorli after vehicle and identity verification. Use Sign In after your account is issued.'
                  : 'Admin accounts are created by Doorli operations. Use Sign In with the account provided to you.'}
              </Text>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={mode === 'signup' && expectedRole === 'customer' || mode === 'signup' && expectedRole === 'vendor' ? handleRegistration : handlePasswordLogin} disabled={loading || (mode === 'signup' && expectedRole !== 'customer' && expectedRole !== 'vendor')}>
              {loading ? <ActivityIndicator color="#003b10" /> : <Text style={styles.primaryBtnText}>{mode === 'signup' ? 'Create Account' : 'Continue'}</Text>}
            </TouchableOpacity>
          </View>

          {/* ── Google OAuth ──────────────────────────── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {/* Google G SVG rendered as a simple coloured block for RN */}
            <View style={styles.googleIcon}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

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
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: ON_SURFACE_VARIANT,
    marginBottom: 16,
  },
  lockedRole: {
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 24,
  },
  lockedRoleText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  lockedRoleHint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 3,
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
    color: '#334155',
  },
  segmentTextActive: {
    color: '#0f172a',
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
    color: INPUT_TEXT,
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
    color: INPUT_TEXT,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: INPUT_TEXT,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
    maxWidth: 400,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: OUTLINE_VARIANT,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: ON_SURFACE_VARIANT,
  },
  googleBtn: {
    width: '100%',
    maxWidth: 400,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
