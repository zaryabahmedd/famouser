import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

import { BottomNav } from '@/components/bottom-nav';

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
};

type Action = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
};

const ACTIONS: Action[] = [
  { key: 'chat', icon: 'chat', title: 'Live Chat', subtitle: 'Typically replies in 2 min' },
  { key: 'call', icon: 'call', title: 'Call Support', subtitle: 'Mon–Sun · 8am–10pm' },
  { key: 'email', icon: 'mail', title: 'Email Us', subtitle: 'support@famo.app' },
];

type Faq = {
  q: string;
  a: string;
};

const FAQS: Faq[] = [
  {
    q: 'How do I track my delivery?',
    a: 'Open the order from Home or the Orders tab and tap “Track” to see your rider live on the map with real-time ETA updates.',
  },
  {
    q: 'How is the delivery price calculated?',
    a: 'Pricing is based on distance, package size and weight, and the vehicle type. You always see the full quote before you confirm and pay.',
  },
  {
    q: 'Can I cancel a delivery?',
    a: 'Yes. You can cancel before a rider picks up the package from the tracking screen. Cancellation fees may apply once a rider is assigned.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'We accept Visa, Mastercard, JazzCash and cash on delivery. You can manage your cards under Payment Methods in your profile.',
  },
  {
    q: 'My package arrived damaged. What do I do?',
    a: 'Report the issue from the order receipt within 48 hours. Our support team will review and resolve eligible claims quickly.',
  },
];

const TOPICS = ['Orders', 'Payments', 'Tracking', 'Account', 'Refunds'];

export function HelpSupport() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <View style={styles.root}>
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Text style={styles.heroTitle}>How can we help?</Text>
        <View style={styles.search}>
          <MaterialIcons name="search" size={22} color={COLORS.outline} />
          <TextInput
            placeholder="Search help articles"
            placeholderTextColor={COLORS.outline}
            style={styles.searchInput}
          />
        </View>

        {/* Contact actions */}
        <View style={styles.actions}>
          {ACTIONS.map((a) => (
            <Pressable
              key={a.key}
              onPress={() => {
                if (a.key === 'chat') router.push('/chat');
                else if (a.key === 'call') router.push('/call');
              }}
              style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
              accessibilityRole="button">
              <View style={styles.actionIcon}>
                <MaterialIcons name={a.icon} size={24} color={COLORS.primary} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{a.title}</Text>
                <Text style={styles.actionSubtitle}>{a.subtitle}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.onSurfaceVariant} />
            </Pressable>
          ))}
        </View>

        {/* Topics */}
        <Text style={styles.sectionTitle}>Browse topics</Text>
        <View style={styles.topics}>
          {TOPICS.map((t) => (
            <Pressable
              key={t}
              onPress={() => router.push('/chat')}
              style={({ pressed }) => [styles.topic, pressed && styles.cardPressed]}
              accessibilityRole="button">
              <Text style={styles.topicText}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Frequently asked</Text>
        <View style={styles.faqList}>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <Pressable
                key={f.q}
                onPress={() => setOpen(isOpen ? null : i)}
                style={styles.faqItem}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}>
                <View style={styles.faqRow}>
                  <Text style={styles.faqQuestion}>{f.q}</Text>
                  <MaterialIcons
                    name={isOpen ? 'expand-less' : 'expand-more'}
                    size={24}
                    color={COLORS.onSurfaceVariant}
                  />
                </View>
                {isOpen && <Text style={styles.faqAnswer}>{f.a}</Text>}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <BottomNav active="support" />
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
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.onSurface,
    marginBottom: 16,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
  },
  actions: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  actionSubtitle: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
    marginTop: 28,
    marginBottom: 14,
  },
  topics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topic: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  topicText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  faqList: {
    gap: 12,
  },
  faqItem: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  faqAnswer: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
    marginTop: 12,
  },
});
