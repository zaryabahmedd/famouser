import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AVATAR_URI = 'https://randomuser.me/api/portraits/men/75.jpg';

const COLORS = {
  bg: '#1b1b1e',
  surfaceVariant: '#2c2c30',
  onDark: '#ffffff',
  onDarkVariant: 'rgba(255, 255, 255, 0.7)',
  primaryContainer: '#fde047',
  onPrimaryFixed: '#211b00',
  error: '#ba1a1a',
  active: 'rgba(255, 255, 255, 0.18)',
};

function fmt(total: number) {
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function Call() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
      <StatusBar style="light" />

      {/* Caller */}
      <View style={styles.callerBlock}>
        <View style={styles.avatarRing}>
          <Image source={{ uri: AVATAR_URI }} style={styles.avatar} contentFit="cover" />
        </View>
        <Text style={styles.name}>Rashid Ahmed</Text>
        <Text style={styles.role}>Your rider</Text>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{fmt(seconds)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Pressable
            onPress={() => setMuted((m) => !m)}
            style={[styles.control, muted && styles.controlActive]}
            accessibilityRole="button"
            accessibilityLabel="Mute">
            <MaterialIcons name={muted ? 'mic-off' : 'mic'} size={26} color={COLORS.onDark} />
            <Text style={styles.controlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
          </Pressable>
          <Pressable
            onPress={() => setSpeaker((s) => !s)}
            style={[styles.control, speaker && styles.controlActive]}
            accessibilityRole="button"
            accessibilityLabel="Speaker">
            <MaterialIcons name={speaker ? 'volume-up' : 'volume-down'} size={26} color={COLORS.onDark} />
            <Text style={styles.controlLabel}>Speaker</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/chat')}
            style={styles.control}
            accessibilityRole="button"
            accessibilityLabel="Message">
            <MaterialIcons name="chat-bubble-outline" size={24} color={COLORS.onDark} />
            <Text style={styles.controlLabel}>Message</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.endBtn, pressed && styles.endBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="End call">
          <MaterialIcons name="call-end" size={30} color={COLORS.onDark} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === 'web' ? ({ position: 'fixed', inset: 0 } as object) : null),
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  callerBlock: {
    alignItems: 'center',
    marginTop: 40,
  },
  avatarRing: {
    width: 156,
    height: 156,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primaryContainer,
    padding: 6,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.surfaceVariant,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.onDark,
    marginTop: 24,
  },
  role: {
    fontSize: 16,
    color: COLORS.onDarkVariant,
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceVariant,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onDark,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    width: '100%',
    alignItems: 'center',
    gap: 36,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
  },
  control: {
    width: 76,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 20,
  },
  controlActive: {
    backgroundColor: COLORS.active,
  },
  controlLabel: {
    fontSize: 13,
    color: COLORS.onDarkVariant,
  },
  endBtn: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtnPressed: {
    transform: [{ scale: 0.95 }],
  },
});
