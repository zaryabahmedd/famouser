import { useGoBack } from '@/hooks/use-go-back';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
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
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  outline: '#7d7761',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',
};

export function DeleteAccount() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const { logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const handleDelete = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    // Re-authenticate to confirm the person owns this account.
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError || !data.user) {
      setError(signInError?.message ?? 'Incorrect email or password.');
      setSubmitting(false);
      return;
    }

    // Delete the account (cascades to the public.users profile row).
    const { error: deleteError } = await supabase.rpc('delete_current_user');
    if (deleteError) {
      setError(deleteError.message);
      setSubmitting(false);
      return;
    }

    await supabase.auth.signOut();
    setSubmitting(false);
    router.replace('/');
    logout();
  };

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
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={styles.iconButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Warning */}
          <View style={styles.warning}>
            <MaterialIcons name="warning-amber" size={24} color={COLORS.error} />
            <Text style={styles.warningText}>
              This will permanently delete your account and all associated data. This action cannot
              be undone.
            </Text>
          </View>

          <Text style={styles.subtitle}>
            Please confirm your email and password to delete your account.
          </Text>

          {/* Email */}
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
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="lock" size={20} color={COLORS.outline} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.outline}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={styles.input}
              />
              <Pressable
                onPress={() => setShowPassword((s) => !s)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={COLORS.outline}
                />
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Delete button */}
          <Pressable
            onPress={handleDelete}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.deleteBtn,
              !canSubmit && styles.deleteBtnDisabled,
              pressed && canSubmit && styles.deleteBtnPressed,
            ]}
            accessibilityRole="button">
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name="delete-forever" size={20} color="#ffffff" />
                <Text style={styles.deleteBtnText}>Delete My Account</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => goBack()}
            style={styles.cancelBtn}
            accessibilityRole="button">
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === 'web' ? ({ position: 'fixed', inset: 0 } as object) : null),
    backgroundColor: COLORS.surface,
  },
  flex: { flex: 1 },
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
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.errorContainer,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.onErrorContainer,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
    marginBottom: 20,
  },
  field: {
    gap: 6,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
    color: COLORS.onSurface,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.error,
    marginBottom: 12,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.error,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 8,
  },
  deleteBtnDisabled: {
    opacity: 0.5,
  },
  deleteBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
});
