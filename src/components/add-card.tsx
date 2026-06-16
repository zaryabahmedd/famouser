import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/hooks/use-go-back';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainerHigh: '#eae7eb',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  secondary: '#5e5e5e',
  outline: '#7d7761',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#726300',
  onPrimaryFixed: '#211b00',
};

export function AddCard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => goBack()}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Add card</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}>
        {/* Card preview */}
        <View style={styles.preview}>
          <View style={styles.previewTop}>
            <MaterialIcons name="contactless" size={26} color={COLORS.onPrimaryFixed} />
            <Text style={styles.previewBrand}>FAMO</Text>
          </View>
          <Text style={styles.previewNumber}>{number || '•••• •••• •••• ••••'}</Text>
          <View style={styles.previewBottom}>
            <View>
              <Text style={styles.previewLabel}>CARD HOLDER</Text>
              <Text style={styles.previewValue}>{name || 'Your Name'}</Text>
            </View>
            <View>
              <Text style={styles.previewLabel}>EXPIRES</Text>
              <Text style={styles.previewValue}>{expiry || 'MM/YY'}</Text>
            </View>
          </View>
        </View>

        {/* Fields */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Card number</Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="credit-card" size={20} color={COLORS.outline} />
            <TextInput
              value={number}
              onChangeText={setNumber}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={COLORS.outline}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Cardholder name</Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="person" size={20} color={COLORS.outline} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ahmed Khan"
              placeholderTextColor={COLORS.outline}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.field, styles.fieldHalf]}>
            <Text style={styles.fieldLabel}>Expiry</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="event" size={20} color={COLORS.outline} />
              <TextInput
                value={expiry}
                onChangeText={setExpiry}
                placeholder="MM/YY"
                placeholderTextColor={COLORS.outline}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>
          <View style={[styles.field, styles.fieldHalf]}>
            <Text style={styles.fieldLabel}>CVV</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="lock" size={20} color={COLORS.outline} />
              <TextInput
                value={cvv}
                onChangeText={setCvv}
                placeholder="123"
                placeholderTextColor={COLORS.outline}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                style={styles.input}
              />
            </View>
          </View>
        </View>

        <View style={styles.secure}>
          <MaterialIcons name="lock" size={16} color={COLORS.secondary} />
          <Text style={styles.secureText}>Your card details are encrypted and stored securely.</Text>
        </View>
      </ScrollView>

      {/* Save */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => goBack()}
          style={({ pressed }) => [styles.save, pressed && styles.savePressed]}
          accessibilityRole="button">
          <Text style={styles.saveText}>Add card</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === 'web' ? ({ position: 'fixed', inset: 0 } as object) : null),
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 18,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  preview: {
    height: 200,
    borderRadius: 20,
    backgroundColor: COLORS.primaryContainer,
    padding: 24,
    justifyContent: 'space-between',
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewBrand: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: COLORS.onPrimaryFixed,
  },
  previewNumber: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.onPrimaryFixed,
  },
  previewBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(33, 27, 0, 0.6)',
  },
  previewValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onPrimaryFixed,
    marginTop: 2,
  },
  field: {
    gap: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    paddingHorizontal: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  secure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  secureText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  save: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePressed: {
    transform: [{ scale: 0.98 }],
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onPrimaryFixed,
  },
});
