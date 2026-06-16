// Strips anything that isn't an English letter or space, so contact name
// fields can't contain numbers, symbols, or emoji.
export function sanitizeName(text: string): string {
  return text.replace(/[^a-zA-Z\s]/g, '');
}

// Keeps digits, allowing a leading "+" only as the very first character.
export function sanitizePhone(text: string): string {
  const hasLeadingPlus = text.startsWith('+');
  const digits = text.replace(/[^\d]/g, '');
  return hasLeadingPlus ? `+${digits}` : digits;
}
