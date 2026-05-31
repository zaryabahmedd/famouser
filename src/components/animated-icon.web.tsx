import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import classes from './animated-icon.module.css';
const DURATION = 300;
const SPLASH_DURATION = 1800;

function RadarRing({ delay, size }: { delay: number; size: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      progress.value = withRepeat(
        withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    }, delay);
    return () => clearTimeout(t);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.15, 0.7, 1], [0, 0.5, 0.18, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.15, 1]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: 'rgba(214, 169, 0, 0.85)',
        },
        animStyle,
      ]}
    />
  );
}

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), SPLASH_DURATION);

    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  const logoSplashKeyframe = new Keyframe({
    0: {
      opacity: 0,
      transform: [{ scale: 0.95 }],
    },
    100: {
      opacity: 1,
      transform: [{ scale: 1 }],
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    },
  });

  return (
    <Animated.View style={styles.splashScreen}>
      <View style={styles.splashContent}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RadarRing delay={0} size={300} />
          <RadarRing delay={800} size={300} />
          <RadarRing delay={1600} size={300} />
        </View>
        <Animated.View
          entering={logoSplashKeyframe.duration(1200)}
          style={styles.splashLogoContainer}
        >
          <Image
            accessibilityLabel="FAMO Logo"
            contentFit="contain"
            source={require('@/assets/images/FAMO-logo-dark.png')}
            style={styles.splashLogo}
          />
        </Animated.View>
      </View>
      <Text style={styles.splashFooter}>User App by FAMO</Text>
    </Animated.View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: 0 }],
  },
  60: {
    transform: [{ scale: 1.2 }],
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(1.2),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    opacity: 0,
  },
  60: {
    transform: [{ scale: 1.2 }],
    opacity: 0,
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(1.2),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '-180deg' }, { scale: 0.8 }],
    opacity: 0,
  },
  [DURATION / 1000]: {
    transform: [{ rotateZ: '0deg' }, { scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(0.7),
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View style={styles.background} entering={keyframe.duration(DURATION)}>
        <div className={classes.expoLogoBackground} />
      </Animated.View>

      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashScreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    padding: 24,
    zIndex: 1000,
  },
  splashContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  splashLogoContainer: {
    maxWidth: 240,
    width: '100%',
  },
  splashLogo: {
    aspectRatio: 2821 / 1102,
    width: '100%',
  },
  splashFooter: {
    bottom: 48,
    color: 'rgba(90, 65, 54, 0.5)',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 20,
    position: 'absolute',
    textAlign: 'center',
    textTransform: 'uppercase',
    width: '100%',
  },
  container: {
    alignItems: 'center',
    width: '100%',
    zIndex: 1000,
    position: 'absolute',
    top: 128 / 2 + 138,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    width: 128,
    height: 128,
    position: 'absolute',
  },
});
