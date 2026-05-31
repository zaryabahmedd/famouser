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
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f6f2f7',
  surfaceContainerHigh: '#eae7eb',
  surfaceContainerHighest: '#e4e1e6',
  surfaceVariant: '#e4e1e6',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  secondary: '#5e5e5e',
  outline: '#7d7761',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#726300',
  error: '#ba1a1a',
};

type Mode = 'now' | 'later';

type DayOption = {
  key: string;
  day: string;
  date: string;
  weekend?: boolean;
};

const DAYS: DayOption[] = [
  { key: 'tue', day: 'Tue', date: '14' },
  { key: 'wed', day: 'Wed', date: '15' },
  { key: 'thu', day: 'Thu', date: '16' },
  { key: 'fri', day: 'Fri', date: '17' },
  { key: 'sat', day: 'Sat', date: '18' },
  { key: 'sun', day: 'Sun', date: '19', weekend: true },
];

const SLOTS = ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00'];

export function PickupTime() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('now');
  const [selectedDay, setSelectedDay] = useState('wed');
  const [selectedSlot, setSelectedSlot] = useState('10:30');

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
        <Text style={styles.headerTitle}>When?</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        {/* Headline */}
        <View style={styles.headline}>
          <Text style={styles.headlineTitle}>Pickup time</Text>
          <Text style={styles.headlineSub}>Choose when our rider should collect the parcel.</Text>
        </View>

        {/* Deliver Now */}
        <Pressable
          onPress={() => setMode('now')}
          style={[styles.optionCard, mode === 'now' && styles.optionCardSelected]}
          accessibilityRole="button">
          <View style={[styles.optionIcon, mode === 'now' && styles.optionIconActive]}>
            <MaterialIcons
              name="moped"
              size={24}
              color={mode === 'now' ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant}
            />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Deliver Now</Text>
            <Text style={styles.optionSub}>Rider arrives in ~10 min</Text>
          </View>
          <View style={[styles.radioOuter, mode === 'now' && styles.radioOuterActive]}>
            {mode === 'now' ? <View style={styles.radioInner} /> : null}
          </View>
        </Pressable>

        {/* Schedule for Later */}
        <Pressable
          onPress={() => setMode('later')}
          style={[
            styles.optionCard,
            styles.optionCardOutlined,
            mode === 'later' && styles.optionCardSelected,
          ]}
          accessibilityRole="button">
          <View style={[styles.optionIcon, mode === 'later' && styles.optionIconActive]}>
            <MaterialIcons
              name="calendar-month"
              size={24}
              color={mode === 'later' ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant}
            />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Schedule for Later</Text>
            <Text style={styles.optionSub}>Pick a date & time</Text>
          </View>
          <View style={[styles.radioOuter, mode === 'later' && styles.radioOuterActive]}>
            {mode === 'later' ? <View style={styles.radioInner} /> : null}
          </View>
        </Pressable>

        {/* Date & time picker */}
        {mode === 'later' ? (
          <View style={styles.picker}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayScroller}>
              {DAYS.map((d) => {
                const isSelected = selectedDay === d.key;
                return (
                  <Pressable
                    key={d.key}
                    onPress={() => setSelectedDay(d.key)}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                    accessibilityRole="button">
                    <Text style={styles.dayName}>{d.day}</Text>
                    <Text style={[styles.dayDate, d.weekend && styles.dayDateWeekend]}>
                      {d.date}
                    </Text>
                    {isSelected ? <View style={styles.dayDot} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.pickerDivider} />

            <View style={styles.slotsSection}>
              <View style={styles.slotsHeader}>
                <Text style={styles.slotsTitle}>Available slots</Text>
                <Text style={styles.slotsDate}>May 15, 2024</Text>
              </View>
              <View style={styles.slotGrid}>
                {SLOTS.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => setSelectedSlot(slot)}
                      style={[styles.slot, isSelected && styles.slotSelected]}
                      accessibilityRole="button">
                      <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                        {slot}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        ) : null}

        {/* Continue */}
        <Pressable
          onPress={() => router.push('/quote-summary')}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </ScrollView>
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
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceVariant,
    overflow: 'hidden',
    marginBottom: 32,
  },
  progressFill: {
    width: '80%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  headline: {
    marginBottom: 32,
  },
  headlineTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 6,
  },
  headlineSub: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLow,
    marginBottom: 16,
  },
  optionCardOutlined: {
    backgroundColor: COLORS.surface,
  },
  optionCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  optionIconActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurface,
  },
  optionSub: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  picker: {
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(206, 198, 173, 0.3)',
    marginTop: 8,
    marginBottom: 32,
  },
  dayScroller: {
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  dayCell: {
    width: 56,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(206, 198, 173, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayCellSelected: {
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    backgroundColor: 'rgba(253, 224, 71, 0.1)',
  },
  dayName: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
  },
  dayDate: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  dayDateWeekend: {
    color: COLORS.error,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
  pickerDivider: {
    height: 1,
    backgroundColor: 'rgba(206, 198, 173, 0.2)',
    marginHorizontal: 16,
  },
  slotsSection: {
    padding: 16,
  },
  slotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  slotsTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurface,
  },
  slotsDate: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    width: '31.5%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(206, 198, 173, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotSelected: {
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    backgroundColor: 'rgba(253, 224, 71, 0.05)',
  },
  slotText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    opacity: 0.6,
  },
  slotTextSelected: {
    fontWeight: '700',
    opacity: 1,
  },
  cta: {
    height: 56,
    borderRadius: 999,
    backgroundColor: '#fde047',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#23200f',
  },
});
