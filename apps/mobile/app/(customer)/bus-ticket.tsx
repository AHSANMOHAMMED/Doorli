import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiClient } from '../../lib/axios';
import { GlassButton } from '../../components/GlassButton';
import { DoorliColors } from '../../constants/colors';

export default function BusTicketScreen() {
  const [routeId, setRouteId] = useState('r2');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('09:30');
  const [seat, setSeat] = useState('01');
  const [message, setMessage] = useState('');
  async function book() {
    try {
      const reservation = await apiClient.post('/transit/bus/seats/reserve', { routeId, date, time, seatNumber: seat });
      const booking = await apiClient.post('/transit/bus/bookings', { reservationToken: reservation.data.data.reservationToken });
      setMessage(`Ticket ${booking.data.data.bookingRef} confirmed. QR saved in your account.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Booking failed.'); }
  }
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}><Text style={styles.eyebrow}>TRANSIT TICKETS</Text><Text style={styles.title}>Bus ticket</Text><View style={styles.panel}><TextInput value={routeId} onChangeText={setRouteId} style={styles.input} placeholder="Route id" placeholderTextColor="#6b86a6" /><TextInput value={date} onChangeText={setDate} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#6b86a6" /><TextInput value={time} onChangeText={setTime} style={styles.input} placeholder="Departure time" placeholderTextColor="#6b86a6" /><TextInput value={seat} onChangeText={setSeat} style={styles.input} placeholder="Seat number" placeholderTextColor="#6b86a6" /><GlassButton title="Reserve and pay" onPress={book} />{message ? <Text style={styles.message}>{message}</Text> : null}</View></ScrollView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: DoorliColors.deep }, content: { padding: 20, paddingTop: 55, gap: 16 }, eyebrow: { color: DoorliColors.mint, fontSize: 11, letterSpacing: 2 }, title: { color: '#fff', fontSize: 32, fontWeight: '800' }, panel: { backgroundColor: 'rgba(255,255,255,.08)', borderRadius: 24, padding: 20, gap: 12 }, input: { backgroundColor: 'rgba(0,0,0,.2)', color: '#fff', borderRadius: 14, padding: 15, fontSize: 16 }, message: { color: DoorliColors.mint, fontSize: 13 } });
