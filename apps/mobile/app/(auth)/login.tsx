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
} from 'react-native';
import { useRouter } from 'expo-router';
import { homeForRole, useAuthStore } from '../../store/auth';

type AuthTab = 'password' | 'otp';

export default function LoginScreen() {
  const router = useRouter();
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const verifyOtpAndLogin = useAuthStore((s) => s.verifyOtpAndLogin);
  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);

  const [authTab, setAuthTab] = useState<AuthTab>('password');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [identifier, setIdentifier] = useState('customer@doorli.test');
  const [password, setPassword] = useState('Doorli123!');
  const [expectedRole, setExpectedRole] = useState<'customer' | 'vendor' | 'driver'>('customer');
  const [businessKey, setBusinessKey] = useState('Corner Grocery');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'customer' | 'vendor' | 'driver'>('customer');
  const [loading, setLoading] = useState(false);

  function goHome(roleHint?: string | null) {
    const r = roleHint || useAuthStore.getState().user?.role;
    router.replace(homeForRole(r) as any);
  }

  async function handlePasswordLogin() {
    if (!identifier.trim() || !password) {
      alert('Enter email/username and password');
      return;
    }
    setLoading(true);
    try {
      const { error } = await loginWithPassword(
        identifier.trim(),
        password,
        expectedRole,
        expectedRole === 'vendor' ? businessKey.trim() : undefined,
      );
      if (error) {
        alert(error);
      } else {
        goHome(expectedRole);
      }
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    if (!phone || phone.length < 9) {
      alert('Please enter a valid phone number (e.g., +94771234567)');
      return;
    }
    if (mode === 'signup' && !fullName) {
      alert('Please enter your full name');
      return;
    }
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
    if (!code || code.length !== 6) {
      alert('Please enter a valid 6-digit OTP code');
      return;
    }
    setLoading(true);
    try {
      const { error } = await verifyOtpAndLogin(
        phone,
        code,
        mode === 'signup' ? fullName : undefined,
        mode === 'signup' ? role : undefined,
      );
      if (error) {
        alert(error);
      } else {
        const u = useAuthStore.getState().user;
        goHome(u?.role || (mode === 'signup' ? role : 'customer'));
      }
    } catch (err: any) {
      alert(err.message || 'Error verifying OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.logo}>Doorli</Text>
        <Text style={styles.tagline}>Everything Local. Delivered.</Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, authTab === 'password' && styles.tabActive]}
            onPress={() => setAuthTab('password')}
          >
            <Text style={[styles.tabText, authTab === 'password' && styles.tabTextActive]}>
              Password
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, authTab === 'otp' && styles.tabActive]}
            onPress={() => setAuthTab('otp')}
          >
            <Text style={[styles.tabText, authTab === 'otp' && styles.tabTextActive]}>Phone OTP</Text>
          </TouchableOpacity>
        </View>

        {authTab === 'password' ? (
          <>
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Sign in as</Text>
              <View style={styles.roleButtons}>
                {(['customer', 'vendor', 'driver'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleBtn, expectedRole === r && styles.roleBtnActive]}
                    onPress={() => setExpectedRole(r)}
                  >
                    <Text style={[styles.roleBtnText, expectedRole === r && styles.roleBtnTextActive]}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email or username"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
            />
            {expectedRole === 'vendor' && (
              <TextInput
                style={styles.input}
                placeholder="Business name (e.g. Corner Grocery)"
                placeholderTextColor="#94a3b8"
                value={businessKey}
                onChangeText={setBusinessKey}
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handlePasswordLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.hint}>
              Demo customer: customer@doorli.test / Doorli123!{'\n'}
              Demo vendor: vendor@doorli.test + business Corner Grocery
            </Text>
          </>
        ) : (
          <>
            {!otpSent && (
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, mode === 'signin' && styles.tabActive]}
                  onPress={() => setMode('signin')}
                >
                  <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, mode === 'signup' && styles.tabActive]}
                  onPress={() => setMode('signup')}
                >
                  <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!otpSent ? (
              <>
                {mode === 'signup' && (
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#94a3b8"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                )}
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (e.g. +9477...)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  value={phone}
                  onChangeText={setPhone}
                />
                {mode === 'signup' && (
                  <View style={styles.roleContainer}>
                    <Text style={styles.roleLabel}>I am a...</Text>
                    <View style={styles.roleButtons}>
                      {(['customer', 'vendor', 'driver'] as const).map((r) => (
                        <TouchableOpacity
                          key={r}
                          style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                          onPress={() => setRole(r)}
                        >
                          <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.instruction}>Enter the OTP sent to {phone}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="OTP Code"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  value={code}
                  onChangeText={setCode}
                />
                <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Login</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkButton} onPress={() => setOtpSent(false)}>
                  <Text style={styles.linkText}>Change Phone Number</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#2563eb', textAlign: 'center' },
  tagline: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32 },
  instruction: { fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 20 },
  hint: { marginTop: 12, textAlign: 'center', color: '#94a3b8', fontSize: 12 },
  tabs: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  roleContainer: { marginBottom: 12 },
  roleLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  roleButtons: { flexDirection: 'row', gap: 8 },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  roleBtnActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  roleBtnText: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  roleBtnTextActive: { color: '#2563eb' },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkButton: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
});
