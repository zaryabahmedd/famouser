import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardAwareScrollView } from '@/components/keyboard-aware-scroll-view';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
};

type ForgotPasswordProps = {
  onBack?: () => void;
  onSubmit: (email: string) => Promise<string | null>;
};

export function ForgotPassword({ onBack, onSubmit }: ForgotPasswordProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (submitting) return;
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await onSubmit(trimmed);
    if (result) {
      setError(result);
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Reset password</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.lockIcon}>
              <MaterialIcons name="lock-reset" size={36} color={COLORS.onPrimaryContainer} />
            </View>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>
              Enter the email linked to your account and we&apos;ll send you a 6-digit code to reset your password.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="mail" size={20} color={COLORS.outline} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.outline}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                editable={!submitting}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.primaryBtn,
              submitting && styles.primaryBtnDisabled,
              pressed && !submitting && styles.primaryBtnPressed,
            ]}
            accessibilityRole="button">
            {submitting ? (
              <ActivityIndicator color={COLORS.onPrimaryContainer} />
            ) : (
              <Text style={styles.primaryText}>Send 6-digit code</Text>
            )}
          </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: COLORS.surface,
    zIndex: 1700,
  },
  flex: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 28,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: { alignItems: 'center', gap: 12 },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: COLORS.onSurface, textAlign: 'center' },
  subtitle: { fontSize: 15, lineHeight: 22, color: COLORS.onSurfaceVariant, textAlign: 'center' },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
  },
  input: { flex: 1, fontSize: 16, color: COLORS.onSurface, paddingVertical: 0, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null) },
  errorText: { fontSize: 13, lineHeight: 18, color: '#b3261e' },
  primaryBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryText: { fontSize: 16, fontWeight: '700', color: COLORS.onPrimaryContainer },
});
