import { MaterialIcons } from '@expo/vector-icons';
import { Image, type ImageStyle } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

// Renders an avatar from a stored photo URL, falling back to a neutral person
// icon when no URL is set. Used for both the signed-in user and assigned
// riders, replacing the old hardcoded randomuser.me placeholder images.
// `style` carries per-screen extras like borders; `size` drives both the
// circle and the fallback icon.
export function Avatar({
  uri,
  size,
  style,
}: {
  uri?: string | null;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  const circle = { width: size, height: size, borderRadius: 999 } as const;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[circle, style as StyleProp<ImageStyle>]}
        contentFit="cover"
      />
    );
  }

  return (
    <View style={[circle, styles.placeholder, style]}>
      <MaterialIcons name="person" size={Math.round(size * 0.6)} color="#7d7761" />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eae7eb',
  },
});
