import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type BottomNavTab = 'home' | 'orders' | 'profile' | 'support';

const TABS: { key: BottomNavTab; icon: keyof typeof MaterialIcons.glyphMap; label: string }[] = [
  { key: 'home', icon: 'home', label: 'Home' },
  { key: 'orders', icon: 'inventory-2', label: 'Orders' },
  { key: 'profile', icon: 'person', label: 'Profile' },
  { key: 'support', icon: 'support-agent', label: 'Support' },
];

const C = {
  surfaceLowest: '#ffffff',
  outlineVariant: '#cec6ad',
  secondary: '#5e5e5e',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#726300',
};

export function BottomNav({ active }: { active: BottomNavTab }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.nav,
        { paddingBottom: insets.bottom + 8 },
        Platform.OS === 'web' && ({ boxShadow: '0 -4px 16px rgba(0,0,0,0.07)' } as object),
      ]}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => {
              if (isActive) return;
              if (tab.key === 'home') router.dismissTo('/');
              else if (tab.key === 'orders') router.push('/orders');
              else if (tab.key === 'profile') router.push('/profile');
              else if (tab.key === 'support') router.push('/help-support');
            }}
            style={({ pressed }) => [
              styles.navItem,
              isActive && styles.navItemActive,
              pressed && !isActive && styles.navItemPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}>
            <MaterialIcons
              name={tab.icon}
              size={24}
              color={isActive ? C.onPrimaryContainer : C.secondary}
            />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: C.surfaceLowest,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.outlineVariant,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 14,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  navItemActive: {
    backgroundColor: C.primaryContainer,
    paddingHorizontal: 24,
  },
  navItemPressed: {
    opacity: 0.6,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.secondary,
  },
  navLabelActive: {
    color: C.onPrimaryContainer,
    fontWeight: '700',
  },
});
