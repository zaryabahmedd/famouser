// A drop-in replacement for ScrollView that keeps the focused text field visible
// above the on-screen keyboard, then restores the scroll position once the
// keyboard is dismissed — with zero per-field wiring.
//
// Why this is needed: Expo SDK 54+ forces edge-to-edge on Android, so the window
// no longer resizes when the keyboard opens (it overlays the content). A field
// near the bottom therefore sits hidden behind the keyboard. iOS overlays the
// keyboard on a ScrollView too. This component listens for the keyboard, measures
// whichever TextInput is currently focused, and scrolls just enough to lift it
// above the keyboard. It adds temporary bottom padding equal to the keyboard
// height so there is always room to scroll the lowest field into view.
//
// Usage: replace `<ScrollView>` with `<KeyboardAwareScrollView>`. No other props
// are required; existing ScrollView props (contentContainerStyle, ref, etc.)
// still work.
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  TextInput,
} from 'react-native';

// Gap left between the bottom of the focused field and the top of the keyboard.
const FIELD_GAP = 24;

export const KeyboardAwareScrollView = forwardRef<ScrollView, ScrollViewProps>(
  function KeyboardAwareScrollView(
    { children, contentContainerStyle, onScroll, scrollEventThrottle, keyboardShouldPersistTaps, ...rest },
    ref,
  ) {
    const scrollRef = useRef<ScrollView>(null);
    useImperativeHandle(ref, () => scrollRef.current as ScrollView, []);

    // Live scroll offset, the position to restore on dismiss, and the current
    // top edge of the keyboard in screen coordinates.
    const scrollY = useRef(0);
    const savedScrollY = useRef<number | null>(null);
    const keyboardTop = useRef<number | null>(null);
    const [keyboardPadding, setKeyboardPadding] = useState(0);

    const scrollFocusedIntoView = useCallback(() => {
      const top = keyboardTop.current;
      const input = TextInput.State.currentlyFocusedInput?.();
      if (top == null || !input || !scrollRef.current) return;
      // measureInWindow gives the field's position in the same screen-coordinate
      // space as the keyboard's top edge, so we can scroll by exactly the overlap.
      input.measureInWindow((_x, y, _w, height) => {
        const overlap = y + height + FIELD_GAP - top;
        if (overlap > 0) {
          scrollRef.current?.scrollTo({ y: scrollY.current + overlap, animated: true });
        }
      });
    }, []);

    useEffect(() => {
      const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

      const showSub = Keyboard.addListener(showEvent, (e) => {
        keyboardTop.current = e.endCoordinates?.screenY ?? null;
        setKeyboardPadding(e.endCoordinates?.height ?? 0);
        // Remember where we were the first time the keyboard opens.
        if (savedScrollY.current == null) savedScrollY.current = scrollY.current;
        // Wait a tick so the new bottom padding is laid out before scrolling,
        // otherwise the target offset gets clamped to the old content height.
        setTimeout(scrollFocusedIntoView, 50);
      });

      const hideSub = Keyboard.addListener(hideEvent, () => {
        keyboardTop.current = null;
        setKeyboardPadding(0);
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
    }, [scrollFocusedIntoView]);

    // Re-run when focus moves between fields while the keyboard is already open
    // (no new keyboard event fires in that case).
    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollY.current = event.nativeEvent.contentOffset.y;
        onScroll?.(event);
      },
      [onScroll],
    );

    return (
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle ?? 16}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? 'handled'}
        contentContainerStyle={[
          contentContainerStyle,
          keyboardPadding > 0 ? { paddingBottom: keyboardPadding } : null,
        ]}
        {...rest}>
        {children}
      </ScrollView>
    );
  },
);
