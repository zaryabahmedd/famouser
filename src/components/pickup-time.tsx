import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/hooks/use-go-back';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDraftOrder } from '@/hooks/use-draft-order';

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

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Builds the cells for a month grid: leading nulls pad to the first weekday,
// then the day numbers. Trailing nulls aren't needed (the grid wraps).
function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export function PickupTime() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = useGoBack();
  const { setScheduledAt } = useDraftOrder();

  const [mode, setMode] = useState<Mode>('now');

  // Calendar state: which month is on screen, and the chosen day.
  const today = useMemo(() => new Date(), []);
  // Midnight today — anything strictly before this is in the past and can't be
  // scheduled. Memoized so the comparison is stable across renders.
  const startOfToday = useMemo(() => {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today]);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Can't page back past the current month — there are no schedulable days there.
  const canGoPrevMonth =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  // Custom time picker state (12-hour clock). Defaults to the current time.
  const initialHour12 = today.getHours() % 12 === 0 ? 12 : today.getHours() % 12;
  const [hour, setHour] = useState(initialHour12);
  const [minute, setMinute] = useState(today.getMinutes());
  const [period, setPeriod] = useState<'AM' | 'PM'>(today.getHours() >= 12 ? 'PM' : 'AM');

  const cells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);

  const goPrevMonth = () => {
    if (!canGoPrevMonth) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const stepHour = (dir: 1 | -1) => setHour((h) => ((h - 1 + dir + 12) % 12) + 1);
  const stepMinute = (dir: 1 | -1) => setMinute((m) => (m + dir + 60) % 60);
  const togglePeriod = () => setPeriod((p) => (p === 'AM' ? 'PM' : 'AM'));

  // Compose the chosen date + 12-hour time into a real Date.
  const buildScheduledDate = (): Date => {
    let hour24 = hour % 12;
    if (period === 'PM') hour24 += 12;
    const d = new Date(selectedDate);
    d.setHours(hour24, minute, 0, 0);
    return d;
  };

  const scheduleSummary = useMemo(() => {
    const d = buildScheduledDate();
    const dateStr = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = `${hour}:${String(minute).padStart(2, '0')} ${period}`;
    return `${dateStr} · ${timeStr}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, hour, minute, period]);

  const handleContinue = () => {
    if (mode === 'now') {
      setScheduledAt(null);
    } else {
      setScheduledAt(buildScheduledDate().toISOString());
    }
    router.push('/quote-summary');
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

        {/* Calendar + time picker */}
        {mode === 'later' ? (
          <View style={styles.picker}>
            {/* Month navigation */}
            <View style={styles.calHeader}>
              <Pressable
                onPress={goPrevMonth}
                disabled={!canGoPrevMonth}
                hitSlop={8}
                style={[styles.calNavBtn, !canGoPrevMonth && styles.calNavBtnDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Previous month">
                <MaterialIcons
                  name="chevron-left"
                  size={24}
                  color={canGoPrevMonth ? COLORS.onSurface : COLORS.outlineVariant}
                />
              </Pressable>
              <Text style={styles.calMonth}>
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <Pressable
                onPress={goNextMonth}
                hitSlop={8}
                style={styles.calNavBtn}
                accessibilityRole="button"
                accessibilityLabel="Next month">
                <MaterialIcons name="chevron-right" size={24} color={COLORS.onSurface} />
              </Pressable>
            </View>

            {/* Weekday labels */}
            <View style={styles.weekRow}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={styles.weekday}>
                  {w}
                </Text>
              ))}
            </View>

            {/* Day grid */}
            <View style={styles.grid}>
              {cells.map((day, i) => {
                if (day == null) {
                  return <View key={`blank-${i}`} style={styles.dayCell} />;
                }
                const cellDate = new Date(viewYear, viewMonth, day);
                const isSelected = sameDay(cellDate, selectedDate);
                const isToday = sameDay(cellDate, today);
                // Past days can't be scheduled — show them greyed and inert.
                const isPast = cellDate < startOfToday;
                return (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDate(cellDate)}
                    disabled={isPast}
                    style={styles.dayCell}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: isPast }}>
                    <View style={[styles.dayInner, isSelected && styles.dayInnerSelected]}>
                      <Text
                        style={[
                          styles.dayText,
                          isToday && !isSelected && styles.dayTextToday,
                          isSelected && styles.dayTextSelected,
                          isPast && styles.dayTextPast,
                        ]}>
                        {day}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.pickerDivider} />

            {/* Custom time picker */}
            <Text style={styles.timeLabel}>Pickup time</Text>
            <View style={styles.timeRow}>
              <TimeColumn
                value={String(hour)}
                onUp={() => stepHour(1)}
                onDown={() => stepHour(-1)}
                label="Hour"
              />
              <Text style={styles.timeColon}>:</Text>
              <TimeColumn
                value={String(minute).padStart(2, '0')}
                onUp={() => stepMinute(1)}
                onDown={() => stepMinute(-1)}
                label="Min"
              />
              <Pressable
                onPress={togglePeriod}
                style={styles.periodToggle}
                accessibilityRole="button"
                accessibilityLabel={`Toggle AM/PM, currently ${period}`}>
                <Text style={styles.periodText}>{period}</Text>
                <MaterialIcons name="unfold-more" size={18} color={COLORS.onSurfaceVariant} />
              </Pressable>
            </View>

            <Text style={styles.scheduleSummary}>{scheduleSummary}</Text>
          </View>
        ) : null}

        {/* Continue */}
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// One up/value/down stepper column used for hour and minute.
function TimeColumn({
  value,
  onUp,
  onDown,
  label,
}: {
  value: string;
  onUp: () => void;
  onDown: () => void;
  label: string;
}) {
  return (
    <View style={styles.timeCol}>
      <Pressable onPress={onUp} hitSlop={8} style={styles.stepBtn} accessibilityRole="button">
        <MaterialIcons name="keyboard-arrow-up" size={28} color={COLORS.onSurfaceVariant} />
      </Pressable>
      <View style={styles.timeValueBox}>
        <Text style={styles.timeValue}>{value}</Text>
      </View>
      <Pressable onPress={onDown} hitSlop={8} style={styles.stepBtn} accessibilityRole="button">
        <MaterialIcons name="keyboard-arrow-down" size={28} color={COLORS.onSurfaceVariant} />
      </Pressable>
      <Text style={styles.timeColLabel}>{label}</Text>
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
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(206, 198, 173, 0.3)',
    marginTop: 8,
    marginBottom: 32,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  calNavBtnDisabled: {
    opacity: 0.4,
  },
  calMonth: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInnerSelected: {
    backgroundColor: COLORS.primaryContainer,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  dayTextToday: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  dayTextSelected: {
    color: COLORS.onPrimaryContainer,
    fontWeight: '800',
  },
  dayTextPast: {
    color: COLORS.outlineVariant,
    fontWeight: '500',
  },
  pickerDivider: {
    height: 1,
    backgroundColor: 'rgba(206, 198, 173, 0.25)',
    marginVertical: 16,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurface,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timeCol: {
    alignItems: 'center',
    gap: 2,
  },
  stepBtn: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValueBox: {
    width: 64,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  timeColLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  timeColon: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    marginBottom: 18,
  },
  periodToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 8,
    marginBottom: 18,
    paddingHorizontal: 14,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  periodText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  scheduleSummary: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
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
