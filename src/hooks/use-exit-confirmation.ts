// Standard mobile "press back on the home screen to exit" behavior. While the
// calling screen is focused, the Android hardware back button is intercepted and
// an "Exit App" confirmation is shown instead of the app closing immediately.
//
// This is meant only for the root/home screen. Every other screen keeps the
// default platform behavior (back / swipe-back pops the navigation stack),
// because the listener is bound to *focus*: it's registered when the screen
// gains focus and removed when it loses focus or unmounts. That matters here —
// with a native stack the Home component stays mounted underneath pushed
// screens, so a plain mount-time listener would also fire on those screens.
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, BackHandler, Platform } from 'react-native';

export function useExitConfirmation() {
  useFocusEffect(
    useCallback(() => {
      // iOS has no hardware back button, apps shouldn't terminate themselves,
      // and the root screen can't be swiped back (there's nothing beneath it),
      // so this only needs to do anything on Android.
      if (Platform.OS !== 'android') return;

      const onBackPress = () => {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: true },
        );
        // Returning true tells Android we've handled the press, suppressing the
        // default action (closing the app) so the dialog can decide instead.
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      // Cleanup: remove the listener when the screen blurs/unmounts so it can't
      // leak or fire on top of another screen.
      return () => subscription.remove();
    }, []),
  );
}
