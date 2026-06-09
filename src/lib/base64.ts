// Minimal base64 -> Uint8Array decoder so images picked with expo-image-picker
// (base64: true) can be uploaded to Supabase Storage without an extra dependency.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const bytes = new Uint8Array((len * 3) / 4 - (clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0));
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = B64.indexOf(clean[i]);
    const e2 = B64.indexOf(clean[i + 1]);
    const e3 = B64.indexOf(clean[i + 2]);
    const e4 = B64.indexOf(clean[i + 3]);
    const chunk = (e1 << 18) | (e2 << 12) | ((e3 & 63) << 6) | (e4 & 63);
    if (p < bytes.length) bytes[p++] = (chunk >> 16) & 255;
    if (p < bytes.length) bytes[p++] = (chunk >> 8) & 255;
    if (p < bytes.length) bytes[p++] = chunk & 255;
  }
  return bytes;
}
