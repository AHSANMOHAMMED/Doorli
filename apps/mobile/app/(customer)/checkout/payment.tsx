import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, CreditCard, Info, Shield, Landmark, BadgeCheck } from 'lucide-react-native';

export default function SecurePaymentScreen() {
  const router = useRouter();
  const { amount = '142.50', orderId } = useLocalSearchParams<{ amount: string, orderId: string }>();

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  // Formatters
  const formatCardNumber = (text: string) => {
    let value = text.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += value[i];
    }
    setCardNumber(formatted);
  };

  const formatExpiry = (text: string) => {
    let value = text.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setExpiry(value);
  };

  // Preview logic
  const displayNumber = cardNumber || '•••• •••• •••• ••••';
  const displayName = cardName || 'Full Name';
  const displayExpiry = expiry || 'MM/YY';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color="#006e25" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Trust & Security Header */}
          <View style={styles.trustHeader}>
            <View style={styles.lockIconContainer}>
              <Lock color="#ffffff" size={32} strokeWidth={2.5} />
            </View>
            <Text style={styles.trustTitle}>Secure Payment</Text>
            <Text style={styles.trustSubtitle}>
              Your transaction is encrypted and secured by bank-grade technology.
            </Text>
          </View>

          {/* Payment Form Container */}
          <View style={styles.formContainer}>
            {/* Dynamic Card Preview */}
            <View style={styles.cardPreview}>
              {/* Blur accent - emulated with absolute view */}
              <View style={styles.cardBlur} />
              
              <View style={styles.cardTopRow}>
                <CreditCard color="#ffffff" size={28} />
                <Text style={styles.cardBrand}>VISA</Text>
              </View>

              <View>
                <Text style={styles.previewNumber}>{displayNumber}</Text>
                
                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={styles.previewLabel}>CARD HOLDER</Text>
                    <Text style={styles.previewValue}>{displayName.toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.previewLabel}>EXPIRES</Text>
                    <Text style={styles.previewValue}>{displayExpiry}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Input Fields Card */}
            <View style={styles.inputCard}>
              {/* Cardholder Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#6b7280"
                  value={cardName}
                  onChangeText={setCardName}
                />
              </View>

              {/* Card Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <View style={styles.iconInputWrapper}>
                  <CreditCard color="#6d7b6a" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingLeft: 48 }]}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor="#6b7280"
                    value={cardNumber}
                    onChangeText={formatCardNumber}
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>
              </View>

              {/* Expiry & CVV */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#6b7280"
                    value={expiry}
                    onChangeText={formatExpiry}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <View style={styles.iconInputWrapper}>
                    <TextInput
                      style={[styles.input, { paddingRight: 40 }]}
                      placeholder="•••"
                      placeholderTextColor="#6b7280"
                      value={cvv}
                      onChangeText={setCvv}
                      keyboardType="numeric"
                      secureTextEntry
                      maxLength={3}
                    />
                    <Info color="#6d7b6a" size={18} style={styles.inputIconRight} />
                  </View>
                </View>
              </View>

              {/* Save Card */}
              <TouchableOpacity
                style={styles.saveCardRow}
                activeOpacity={0.7}
                onPress={() => setSaveCard(!saveCard)}
              >
                <View style={[styles.checkbox, saveCard && styles.checkboxActive]}>
                  {saveCard && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                </View>
                <Text style={styles.saveCardText}>Save card details for faster checkout</Text>
              </TouchableOpacity>
            </View>

            {/* Order Summary & Pay Button */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValue}>${amount}</Text>
              </View>

              <TouchableOpacity style={styles.payButton} activeOpacity={0.8} onPress={() => {}}>
                <Lock color="#ffffff" size={20} />
                <Text style={styles.payButtonText}>Pay ${amount} Now</Text>
              </TouchableOpacity>

              <View style={styles.encryptionRow}>
                <Lock color="#6d7b6a" size={14} />
                <Text style={styles.encryptionText}>Encrypted with 256-bit SSL</Text>
              </View>
            </View>

            {/* Trust Badges */}
            <View style={styles.trustBadges}>
              <View style={styles.trustBadge}>
                <Shield color="#191c1d" size={32} strokeWidth={1.5} />
                <Text style={styles.trustBadgeText}>PCI COMPLIANT</Text>
              </View>
              <View style={styles.trustBadge}>
                <Landmark color="#191c1d" size={32} strokeWidth={1.5} />
                <Text style={styles.trustBadgeText}>BANK SECURED</Text>
              </View>
              <View style={styles.trustBadge}>
                <BadgeCheck color="#191c1d" size={32} strokeWidth={1.5} />
                <Text style={styles.trustBadgeText}>VERIFIED MERCHANT</Text>
              </View>
            </View>

          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 LocalConnect. Powered by Stripe.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e3e4',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#006e25',
    letterSpacing: -0.5,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  trustHeader: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 24,
  },
  lockIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00b241',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  trustTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#191c1d',
    marginBottom: 8,
  },
  trustSubtitle: {
    fontSize: 14,
    color: '#3d4a3c',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  formContainer: {
    gap: 24,
  },
  cardPreview: {
    height: 208,
    borderRadius: 12,
    backgroundColor: '#006e25',
    padding: 24,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    overflow: 'hidden',
  },
  cardBlur: {
    position: 'absolute',
    top: -64,
    right: -64,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardBrand: {
    fontSize: 20,
    fontStyle: 'italic',
    fontWeight: '800',
    color: '#fff',
  },
  previewNumber: {
    fontSize: 20,
    color: '#fff',
    letterSpacing: 4,
    marginBottom: 16,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  previewLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    marginBottom: 2,
  },
  previewValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  inputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3d4a3c',
    paddingHorizontal: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bccbb7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#191c1d',
  },
  iconInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  inputIconRight: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  saveCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#bccbb7',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#006e25',
    borderColor: '#006e25',
  },
  saveCardText: {
    fontSize: 14,
    color: '#3d4a3c',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#191c1d',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191c1d',
  },
  payButton: {
    backgroundColor: '#00b241',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  encryptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
  },
  encryptionText: {
    fontSize: 12,
    color: '#6d7b6a',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 32,
    opacity: 0.6,
  },
  trustBadge: {
    alignItems: 'center',
    gap: 4,
  },
  trustBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#191c1d',
    letterSpacing: 0.5,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#3d4a3c',
  }
});
