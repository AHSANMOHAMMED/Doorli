import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  Star,
} from 'lucide-react-native';
import { DoorliColors } from '../../constants/colors';
import { apiClient } from '../../lib/axios';
import {
  CardField,
  CardFieldInput,
  confirmSetupIntent,
  initStripe,
} from '@stripe/stripe-react-native';

interface PaymentCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  cardholderName?: string;
  isDefault: boolean;
  fingerprint?: string;
}

function getCardBrandColor(brand: string): string {
  switch (brand) {
    case 'visa': return '#1a1f71';
    case 'mastercard': return '#eb001b';
    case 'amex': return '#006fcf';
    default: return DoorliColors.sky;
  }
}

function getCardBrandLabel(brand: string): string {
  switch (brand) {
    case 'visa': return 'VISA';
    case 'mastercard': return 'MASTERCARD';
    case 'amex': return 'AMEX';
    case 'discover': return 'DISCOVER';
    default: return 'CARD';
  }
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [cardholderName, setCardholderName] = useState('');
  const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      const res = await apiClient.get('/payments/methods');
      const data = res.data?.data;
      setCards(Array.isArray(data) ? data : []);
    } catch {
      setCards([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchCards().finally(() => setLoading(false));
  }, [fetchCards]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCards();
    setRefreshing(false);
  }, [fetchCards]);

  async function handleAddCard() {
    if (!cardholderName.trim() || !cardDetails?.complete) {
      Alert.alert('Invalid card', 'Enter the cardholder name and complete card details.');
      return;
    }

    setAdding(true);
    try {
      const setupRes = await apiClient.post('/payments/setup-intent');
      const clientSecret = setupRes.data?.data?.clientSecret;
      if (!clientSecret) {
        throw new Error('Failed to initialize payment setup');
      }

      const publishableKeyRes = await apiClient.get('/payments/config');
      const publishableKey = publishableKeyRes.data?.data?.stripePublishableKey;
      if (!publishableKey) {
        throw new Error('Stripe is not configured');
      }

      await initStripe({ publishableKey });
      const { setupIntent, error: stripeError } = await confirmSetupIntent(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: { billingDetails: { name: cardholderName.trim() } },
      });
      if (stripeError) throw new Error(stripeError.message);
      if (!setupIntent?.paymentMethodId) throw new Error('Stripe did not return a payment method');

      await apiClient.post('/payments/methods', {
        paymentMethodId: setupIntent.paymentMethodId,
        cardholderName,
        setAsDefault: cards.length === 0,
      });

      Alert.alert('Card added', 'Your card has been saved successfully.');
      setCardholderName('');
      setCardDetails(null);
      setShowForm(false);
      await fetchCards();
    } catch (e: unknown) {
      Alert.alert('Failed to add card', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteCard(card: PaymentCard) {
    Alert.alert(
      'Remove card',
      `Remove ${getCardBrandLabel(card.brand)} ending in ${card.last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/payments/methods/${card.id}`);
              await fetchCards();
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to remove card');
            }
          },
        },
      ],
    );
  }

  async function handleSetDefault(card: PaymentCard) {
    if (card.isDefault) return;
    try {
      await apiClient.patch(`/payments/methods/${card.id}/default`);
      await fetchCards();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to set default');
    }
  }

  const maskedNumber = cardDetails?.last4 ? `•••• •••• •••• ${cardDetails.last4}` : '•••• •••• •••• ••••';
  const displayName = cardholderName || 'CARDHOLDER NAME';
  const displayExpiry = cardDetails?.expiryMonth && cardDetails?.expiryYear
    ? `${String(cardDetails.expiryMonth).padStart(2, '0')}/${String(cardDetails.expiryYear).slice(-2)}`
    : 'MM/YY';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color="#ffffff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DoorliColors.sky} />
          }
        >
          {!showForm && (
            <TouchableOpacity style={styles.addCardBtn} onPress={() => setShowForm(true)}>
              <Plus color={DoorliColors.sky} size={22} />
              <Text style={styles.addCardBtnText}>Add New Card</Text>
            </TouchableOpacity>
          )}

          {showForm && (
            <View style={styles.formSection}>
              <View style={styles.cardPreview}>
                <View style={styles.cardBlur} />
                <View style={styles.cardTopRow}>
                  <CreditCard color="#ffffff" size={28} />
                  <Text style={styles.cardBrand}>
                    {getCardBrandLabel(cardDetails?.brand?.toLowerCase() || 'unknown')}
                  </Text>
                </View>
                <View>
                  <Text style={styles.previewNumber}>{maskedNumber}</Text>
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

              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Cardholder Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor="#6b7280"
                    value={cardholderName}
                    onChangeText={setCardholderName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Card Details</Text>
                  <CardField
                    postalCodeEnabled={false}
                    placeholders={{ number: '4242 4242 4242 4242' }}
                    cardStyle={{
                      backgroundColor: '#182839',
                      borderColor: '#334155',
                      borderRadius: 12,
                      borderWidth: 1,
                      textColor: '#ffffff',
                      placeholderColor: '#6b7280',
                    }}
                    style={styles.stripeCardContainer}
                    onCardChange={setCardDetails}
                  />
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setShowForm(false);
                      setCardholderName('');
                      setCardDetails(null);
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, adding && { opacity: 0.6 }]}
                    onPress={handleAddCard}
                    disabled={adding}
                  >
                    {adding ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Card</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <View style={styles.savedSection}>
            <Text style={styles.sectionTitle}>Saved Cards</Text>

            {loading ? (
              <ActivityIndicator size="large" color={DoorliColors.sky} style={{ marginTop: 32 }} />
            ) : cards.length === 0 ? (
              <View style={styles.emptyState}>
                <CreditCard color="rgba(255,255,255,0.2)" size={48} />
                <Text style={styles.emptyText}>No saved cards yet</Text>
                <Text style={styles.emptySubtext}>Add a card to speed up checkout</Text>
              </View>
            ) : (
              <View style={styles.cardsList}>
                {cards.map((card) => (
                  <View
                    key={card.id}
                    style={[
                      styles.savedCard,
                      card.isDefault && styles.savedCardDefault,
                    ]}
                  >
                    <View
                      style={[
                        styles.brandBadge,
                        { backgroundColor: getCardBrandColor(card.brand) },
                      ]}
                    >
                      <Text style={styles.brandBadgeText}>
                        {getCardBrandLabel(card.brand)}
                      </Text>
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.cardNumberText}>
                        •••• •••• •••• {card.last4}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {card.cardholderName || 'Cardholder'}  •  {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
                      </Text>
                    </View>

                    <View style={styles.cardActions}>
                      {card.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Star color="#fac775" size={12} fill="#fac775" />
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                      {!card.isDefault && (
                        <TouchableOpacity
                          style={styles.setDefaultBtn}
                          onPress={() => handleSetDefault(card)}
                        >
                          <CheckCircle color={DoorliColors.textMuted} size={18} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteCard(card)}
                      >
                        <Trash2 color={DoorliColors.rose} size={18} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.securityNote}>
            <CreditCard color={DoorliColors.textDim} size={16} />
            <Text style={styles.securityText}>
              Cards are processed securely via Stripe. We never store your full card number.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1B2B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0B1B2B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(55, 138, 221, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(55, 138, 221, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 24,
  },
  addCardBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: DoorliColors.sky,
  },
  formSection: {
    marginBottom: 24,
  },
  cardPreview: {
    height: 208,
    borderRadius: 16,
    backgroundColor: '#185fa5',
    padding: 24,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardBlur: {
    position: 'absolute',
    top: -64,
    right: -64,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginBottom: 2,
  },
  previewValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#ffffff',
  },
  stripeCardContainer: {
    width: '100%',
    height: 52,
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
  row: {
    flexDirection: 'row',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: DoorliColors.sky,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  savedSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  emptySubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
  },
  cardsList: {
    gap: 12,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  savedCardDefault: {
    borderColor: 'rgba(55, 138, 221, 0.4)',
    backgroundColor: 'rgba(55, 138, 221, 0.08)',
  },
  brandBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  cardInfo: {
    flex: 1,
  },
  cardNumberText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(250, 199, 117, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fac775',
  },
  setDefaultBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(242, 102, 139, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    lineHeight: 17,
  },
});
