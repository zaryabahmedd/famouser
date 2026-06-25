import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
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

import { useGoBack } from '@/hooks/use-go-back';
import { markChatRead } from '@/hooks/use-chat-unread';
import { useDeliveryChat } from '@/hooks/use-delivery-chat';
import { useDeliveryRider } from '@/hooks/use-delivery-rider';
import { useDeliveryStatus } from '@/hooks/use-delivery-status';
import { supabase } from '@/lib/supabase';

import { Avatar } from './avatar';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

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

const QUICK = ['On my way!', 'Please wait', 'Call me', 'Thank you'];

export function Chat() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const params = useLocalSearchParams<{ deliveryId?: string }>();
  const deliveryId = typeof params.deliveryId === 'string' && params.deliveryId ? params.deliveryId : null;

  const { delivery } = useDeliveryStatus(deliveryId);
  const { messages, sendMessage } = useDeliveryChat(deliveryId);
  const { rider } = useDeliveryRider(deliveryId, delivery?.rider_id);
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Clear the unread badge while the chat is open and as new messages arrive.
  useEffect(() => {
    if (deliveryId) markChatRead(deliveryId);
  }, [deliveryId, messages.length]);

  const send = (text: string) => {
    if (!text.trim()) return;
    sendMessage(text);
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
          onPress={() => goBack()}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Avatar uri={rider?.avatar_url} size={40} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerName}>{rider?.full_name ?? 'Your rider'}</Text>
            <Text style={styles.headerStatus}>Your rider</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/call', params: { deliveryId: deliveryId ?? '' } })}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Call rider">
          <MaterialIcons name="call" size={22} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.daySep}>Today</Text>
        {messages.map((m) => {
          const mine = m.sender_role === 'user' && m.sender_id === userId;
          return (
            <View
              key={m.id}
              style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{m.body}</Text>
                <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                  {formatTime(m.created_at)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Quick replies */}
      <ScrollView
        horizontal
        style={styles.quickScroll}
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
  messagesScroll: {
    flex: 1,
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
  quickScroll: {
    flexGrow: 0,
    flexShrink: 0,
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
