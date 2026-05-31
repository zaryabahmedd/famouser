import Svg, {
    Circle,
    Defs,
    G,
    LinearGradient,
    Path,
    Rect,
    Stop,
} from 'react-native-svg';

type IllustrationProps = {
  size?: number;
};

const ACCENT = '#fde047';
const ACCENT_DEEP = '#e2c62d';
const INK = '#6d5e00';
const LINE = '#cec6ad';
const PAPER = '#ffffff';
const SOFT = '#f6f2f7';

/** Get Quote — a price document with a tag, soft and whitish. */
export function QuoteIllustration({ size = 88 }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <Defs>
        <LinearGradient id="quotePaper" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={PAPER} />
          <Stop offset="1" stopColor={SOFT} />
        </LinearGradient>
      </Defs>

      {/* soft pedestal */}
      <Circle cx="48" cy="80" r="22" fill={SOFT} />

      {/* document */}
      <G>
        <Rect
          x="24"
          y="16"
          width="40"
          height="54"
          rx="8"
          fill="url(#quotePaper)"
          stroke={LINE}
          strokeWidth="2"
        />
        {/* lines */}
        <Rect x="32" y="27" width="24" height="4" rx="2" fill={LINE} />
        <Rect x="32" y="37" width="18" height="4" rx="2" fill={LINE} />
        <Rect x="32" y="47" width="22" height="4" rx="2" fill={ACCENT_DEEP} />
        <Rect x="32" y="57" width="14" height="4" rx="2" fill={LINE} />
      </G>

      {/* price tag */}
      <G>
        <Path
          d="M58 50l16 16a6 6 0 0 1 0 8l-8 8a6 6 0 0 1-8 0L42 74a6 6 0 0 1-1.7-4.2V58a6 6 0 0 1 6-6h11.7A6 6 0 0 1 58 50z"
          fill={ACCENT}
          stroke={INK}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <Circle cx="51" cy="63" r="3.5" fill={PAPER} stroke={INK} strokeWidth="2" />
      </G>
    </Svg>
  );
}

/** Support — a friendly headset/chat bubble, soft and whitish. */
export function SupportIllustration({ size = 88 }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <Defs>
        <LinearGradient id="supportBubble" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={PAPER} />
          <Stop offset="1" stopColor={SOFT} />
        </LinearGradient>
      </Defs>

      {/* soft pedestal */}
      <Circle cx="48" cy="80" r="22" fill={SOFT} />

      {/* headset band */}
      <Path
        d="M24 56v-8a24 24 0 0 1 48 0v8"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* ear cups */}
      <Rect x="18" y="52" width="12" height="20" rx="6" fill={ACCENT} stroke={INK} strokeWidth="2.5" />
      <Rect x="66" y="52" width="12" height="20" rx="6" fill={ACCENT} stroke={INK} strokeWidth="2.5" />

      {/* mic */}
      <Path
        d="M72 66v6a8 8 0 0 1-8 8h-8"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* chat bubble */}
      <G>
        <Rect
          x="38"
          y="34"
          width="32"
          height="22"
          rx="7"
          fill="url(#supportBubble)"
          stroke={LINE}
          strokeWidth="2"
        />
        <Circle cx="46" cy="45" r="2.2" fill={ACCENT_DEEP} />
        <Circle cx="54" cy="45" r="2.2" fill={ACCENT_DEEP} />
        <Circle cx="62" cy="45" r="2.2" fill={ACCENT_DEEP} />
      </G>
    </Svg>
  );
}
