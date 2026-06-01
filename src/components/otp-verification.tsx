import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  background: '#fbf9f9',
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  primary: '#715d00',
  primaryContainer: '#fbd103',
};

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

type OtpVerificationProps = {
  onVerify: (code: string) => Promise<string | null> | void;
  onResend?: () => Promise<string | null> | void;
  onBack?: () => void;
  destination?: string;
};

export function OtpVerification({ onVerify, onResend, onBack, destination }: OtpVerificationProps) {
  const insets = useSafeAreaInsets();
  const inputs = useRef<(TextInput | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const handleChange = (text: string, index: number) => {
    const value = text.replace(/[^0-9]/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const isComplete = digits.every((d) => d !== '');

  const handleVerify = async () => {
    if (submitting || !isComplete) return;
    setError(null);
    setSubmitting(true);
    const result = await onVerify(digits.join(''));
    if (result) {
      setError(result);
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (seconds > 0) return;
    setError(null);
    const result = onResend ? await onResend() : null;
    if (result) {
      setError(result);
    } else {
      setSeconds(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="chevron-left" size={26} color={COLORS.onSurface} />
        </Pressable>
        <View style={styles.stepWrap}>
          <Text style={styles.stepText}>SIGN UP · STEP 2/2</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}>
          <View style={styles.brand}>
            <Image
              source={require('@/assets/images/FAMO-logo-dark.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <View style={styles.heading}>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              Enter the {OTP_LENGTH}-digit code we sent to{' '}
              <Text style={styles.dest}>{destination ?? 'your email'}</Text>.
            </Text>
          </View>

          <View style={styles.otpRow}>
            {digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputs.current[index] = ref;
                }}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                accessibilityLabel={`Digit ${index + 1}`}
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            onPress={handleVerify}
            disabled={!isComplete || submitting}
            style={({ pressed }) => [
              styles.cta,
              (!isComplete || submitting) && styles.ctaDisabled,
              pressed && isComplete && !submitting && styles.ctaPressed,
            ]}
            accessibilityRole="button">
            {submitting ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <>
                <Text style={styles.ctaText}>Verify</Text>
                <MaterialIcons name="check" size={20} color="#000000" />
              </>
            )}
          </Pressable>

          <View style={styles.resendRow}>
            {seconds > 0 ? (
              <Text style={styles.resendText}>
                Resend code in <Text style={styles.resendTimer}>0:{String(seconds).padStart(2, '0')}</Text>
              </Text>
            ) : (
              <Pressable
                onPress={handleResend}
                accessibilityRole="button">
                <Text style={styles.resendLink}>Resend code</Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: COLORS.background,
    zIndex: 1500,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(208, 198, 171, 0.4)',
    backgroundColor: COLORS.surface,
  },
  backButton: {
    position: 'absolute',
    left: 14,
    bottom: 8,
    padding: 6,
    borderRadius: 999,
    zIndex: 2,
  },
  stepWrap: {
    alignItems: 'center',
    gap: 6,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
    letterSpacing: 2,
  },
  progressTrack: {
    width: 128,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(208, 198, 171, 0.35)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 150,
    height: 56,
  },
  heading: {
    gap: 6,
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  dest: {
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  otpInput: {
    width: 46,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#b3261e',
    textAlign: 'center',
    marginBottom: 16,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(109, 94, 0, 0.06)',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryContainer,
    paddingVertical: 15,
    borderRadius: 14,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
  },
  resendTimer: {
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  resendLink: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
