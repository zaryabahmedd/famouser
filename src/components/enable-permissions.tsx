import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
  background: '#fbf9f9',
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f6f2f7',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  outline: '#7d7761',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  onPrimaryFixed: '#211b00',
};

type Permission = {
  key: 'location' | 'notifications';
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
};

const PERMISSIONS: Permission[] = [
  {
    key: 'location',
    icon: 'location-on',
    title: 'Location',
    description: 'Real-time tracking for parcels.',
  },
  {
    key: 'notifications',
    icon: 'notifications',
    title: 'Notifications',
    description: 'Status updates and alerts.',
  },
];

type EnablePermissionsProps = {
  onContinue: () => void;
  onSkip: () => void;
};

export function EnablePermissions({ onContinue, onSkip }: EnablePermissionsProps) {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState<Record<Permission['key'], boolean>>({
    location: true,
    notifications: true,
  });

  const toggle = (key: Permission['key']) =>
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image
          source={require('@/assets/images/FAMO-logo-dark.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 160 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>Enable Permissions</Text>
          <Text style={styles.subtitle}>
            To provide the best delivery experience, FAMO needs access to a few things.
          </Text>
        </View>

        {/* Permission list */}
        <View style={styles.list}>
          {PERMISSIONS.map((perm) => {
            const isOn = enabled[perm.key];
            return (
              <View key={perm.key} style={styles.item}>
                <View style={styles.itemIcon}>
                  <MaterialIcons name={perm.icon} size={24} color={COLORS.primary} />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemTitle}>{perm.title}</Text>
                  <Text style={styles.itemDesc} numberOfLines={1}>
                    {perm.description}
                  </Text>
                </View>
                <Pressable
                  onPress={() => toggle(perm.key)}
                  style={[styles.switch, isOn ? styles.switchOn : styles.switchOff]}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: isOn }}
                  accessibilityLabel={`Toggle ${perm.title}`}>
                  <View
                    style={[styles.knob, isOn ? styles.knobOn : styles.knobOff]}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Decorative image */}
        <View style={styles.media}>
          <Image
            source={require('@/assets/images/Bike4.png')}
            style={styles.mediaImage}
            contentFit="cover"
          />
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>CONTINUE</Text>
        </Pressable>
        <Pressable onPress={onSkip} style={styles.skip} accessibilityRole="button">
          <Text style={styles.skipText}>Not Now</Text>
        </Pressable>
      </View>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  logo: {
    width: 132,
    height: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  heading: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 320,
  },
  list: {
    gap: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.7,
    color: COLORS.onSurface,
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  switch: {
    width: 48,
    height: 24,
    borderRadius: 999,
    padding: 4,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'flex-end',
  },
  switchOff: {
    backgroundColor: COLORS.outlineVariant,
    alignItems: 'flex-start',
  },
  knob: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  knobOn: {},
  knobOff: {},
  media: {
    marginTop: 32,
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  dots: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  dotActive: {
    width: 32,
    backgroundColor: COLORS.primaryContainer,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  cta: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.onPrimaryFixed,
  },
  skip: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.7,
    color: COLORS.onSurfaceVariant,
  },
});
