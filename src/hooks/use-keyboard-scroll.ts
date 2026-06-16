// Keeps the focused field visible above the keyboard on a form screen, and
// restores the scroll position once the keyboard is dismissed.
//
// Expo SDK 54 forces edge-to-edge on Android, so the window no longer resizes
// when the keyboard opens (it overlays the content). That means a plain
// `scrollTo` on a low field gets clamped because there's nothing below it to
// scroll into view. To work around that we add bottom padding equal to the
// keyboard height while it's open, giving the ScrollView room to lift any field
// above the keyboard, then scroll once the keyboard has actually appeared.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
} from 'react-native';

// Space to leave above a focused field once it's scrolled into view.
const FIELD_TOP_OFFSET = 16;

export function useKeyboardScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const fieldOffsets = useRef<Record<string, number>>({});
  const scrollY = useRef(0);
  // Which field is currently focused, so the keyboard-show handler knows what to
  // bring into view.
  const focusedKey = useRef<string | null>(null);
  // The scroll position right before the keyboard opened, restored once it
  // closes.
  const savedScrollY = useRef<number | null>(null);
  // Extra bottom padding (= keyboard height) applied while the keyboard is open
  // so there's always room to scroll the focused field above it.
  const [keyboardPadding, setKeyboardPadding] = useState(0);

  const scrollToFocused = useCallback(() => {
    const key = focusedKey.current;
    if (key == null) return;
    const y = fieldOffsets.current[key];
    if (y != null) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - FIELD_TOP_OFFSET), animated: true });
    }
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      // Only Android needs the manual padding; iOS shrinks via KeyboardAvoidingView.
      if (Platform.OS === 'android') {
        setKeyboardPadding(e.endCoordinates?.height ?? 0);
      }
      // Wait a tick so the new padding is laid out before scrolling, otherwise
      // the scroll offset gets clamped to the old (shorter) content height.
      setTimeout(scrollToFocused, 50);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardPadding(0);
      focusedKey.current = null;
      if (savedScrollY.current != null) {
        const y = savedScrollY.current;
        savedScrollY.current = null;
        scrollRef.current?.scrollTo({ y, animated: true });
      }
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToFocused]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  }, []);

  const registerField = useCallback(
    (key: string) => (event: LayoutChangeEvent) => {
      fieldOffsets.current[key] = event.nativeEvent.layout.y;
    },
    [],
  );

  const focusField = useCallback(
    (key: string) => {
      // Remember where we were the first time a field is focused, so we can
      // return there after the keyboard closes.
      if (savedScrollY.current == null) {
        savedScrollY.current = scrollY.current;
      }
      focusedKey.current = key;
      // When moving between fields while the keyboard is already open there's no
      // new show event, so scroll right away (padding is already in place).
      scrollToFocused();
    },
    [scrollToFocused],
  );

  return { scrollRef, onScroll, registerField, focusField, keyboardPadding };
}
