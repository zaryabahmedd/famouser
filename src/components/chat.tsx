import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
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

const AVATAR_URI = 'https://randomuser.me/api/portraits/men/75.jpg';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f6f2f7',
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

type Message = {
  id: string;
  text: string;
  mine: boolean;
  time: string;
};

const INITIAL: Message[] = [
  { id: 'm1', text: 'Hi! I’ve picked up your package and I’m on the way.', mine: false, time: '10:22' },
  { id: 'm2', text: 'Great, thank you! How long until you arrive?', mine: true, time: '10:23' },
  { id: 'm3', text: 'About 12 minutes. There’s a bit of traffic on the main road.', mine: false, time: '10:23' },
  { id: 'm4', text: 'No problem. Please call when you reach the gate.', mine: true, time: '10:24' },
];

const QUICK = ['On my way!', 'Please wait', 'Call me', 'Thank you'];

export function Chat() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [draft, setDraft] = useState('');

  const send = (text: string) => {
    const value = text.trim();
    if (!value) return;
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), text: value, mine: true, time: '10:25' },
    ]);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Image source={{ uri: AVATAR_URI }} style={styles.headerAvatar} contentFit="cover" />
          <View>
            <Text style={styles.headerName}>Rashid Ahmed</Text>
            <Text style={styles.headerStatus}>Online · Your rider</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/call')}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Call rider">
          <MaterialIcons name="call" size={22} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.daySep}>Today</Text>
        {messages.map((m) => (
          <View
            key={m.id}
            style={[styles.bubbleRow, m.mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
            <View style={[styles.bubble, m.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, m.mine && styles.bubbleTextMine]}>{m.text}</Text>
              <Text style={[styles.bubbleTime, m.mine && styles.bubbleTimeMine]}>{m.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Quick replies */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickRow}>
        {QUICK.map((q) => (
          <Pressable
            key={q}
            onPress={() => send(q)}
            style={({ pressed }) => [styles.quick, pressed && styles.quickPressed]}
            accessibilityRole="button">
            <Text style={styles.quickText}>{q}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Composer */}
      <View style={[styles.composer, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.composerInput}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            placeholderTextColor={COLORS.outline}
            style={styles.input}
            onSubmitEditing={() => send(draft)}
            returnKeyType="send"
          />
        </View>
        <Pressable
          onPress={() => send(draft)}
          style={({ pressed }) => [styles.sendBtn, pressed && styles.sendBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Send">
          <MaterialIcons name="send" size={22} color={COLORS.onPrimaryFixed} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
    gap: 8,
    paddingHorizontal: 16,
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
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  headerStatus: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 1,
  },
  messages: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  daySep: {
    alignSelf: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: COLORS.primaryContainer,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.onSurface,
  },
  bubbleTextMine: {
    color: COLORS.onPrimaryFixed,
  },
  bubbleTime: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: {
    color: 'rgba(33, 27, 0, 0.6)',
  },
  quickRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  quick: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignSelf: 'center',
  },
  quickPressed: {
    opacity: 0.7,
  },
  quickText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  composerInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: COLORS.onSurface,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnPressed: {
    transform: [{ scale: 0.95 }],
  },
});
