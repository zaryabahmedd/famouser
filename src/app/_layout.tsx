import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Onboarding } from '@/components/onboarding';
import { SignUpFlow } from '@/components/sign-up-flow';
import { AuthContext } from '@/hooks/use-auth';
import { DraftOrderProvider } from '@/hooks/use-draft-order';
import { getSavedRoute, clearSavedRoute, useSaveRoute } from '@/hooks/use-nav-persistence';
import { ProfileContext, useProfileProvider } from '@/hooks/use-profile';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { supabase } from '@/lib/supabase';

const ONBOARDING_KEY = 'famo.onboardingComplete';
const AUTH_KEY = 'famo.authComplete';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [authDone, setAuthDone] = useState<boolean | null>(null);
  const profileValue = useProfileProvider();
  const restoredRef = useRef(false);
  usePushNotifications();
  useSaveRoute();

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ONBOARDING_KEY),
      AsyncStorage.getItem(AUTH_KEY),
    ])
      .then(([onboarding, auth]) => {
        setOnboardingDone(onboarding === 'true');
        setAuthDone(auth === 'true');
      })
      .catch(() => {
        setOnboardingDone(false);
        setAuthDone(false);
      });
  }, []);

  const completeOnboarding = () => {
    setOnboardingDone(true);
    AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => {});
  };

  // Restore the last screen once per cold-start, after auth is confirmed.
  useEffect(() => {
    if (!authDone || restoredRef.current) return;
    restoredRef.current = true;
    getSavedRoute().then((route) => {
      if (route) router.replace(route as Parameters<typeof router.replace>[0]);
    });
  }, [authDone, router]);

  const completeAuth = () => {
    setAuthDone(true);
    AsyncStorage.setItem(AUTH_KEY, 'true').catch(() => {});
  };

  const logout = () => {
    setAuthDone(false);
    restoredRef.current = false;
    AsyncStorage.removeItem(AUTH_KEY).catch(() => {});
    clearSavedRoute();
    supabase.auth.signOut().catch(() => {});
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthContext.Provider value={{ logout }}>
        <ProfileContext.Provider value={profileValue}>
          <DraftOrderProvider>
          <AnimatedSplashOverlay />
          <Slot />
          {onboardingDone === true && authDone === false && (
            <View style={StyleSheet.absoluteFill}>
              <SignUpFlow onComplete={completeAuth} />
            </View>
          )}
          {onboardingDone === false && (
            <View style={StyleSheet.absoluteFill}>
              <Onboarding onDone={completeOnboarding} />
            </View>
          )}
          </DraftOrderProvider>
        </ProfileContext.Provider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
