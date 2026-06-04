// Loads and updates the signed-in user's profile row (public.users), including
// uploading a new avatar image to the public `avatars` storage bucket.
import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  avatar_url: string | null;
};

export type ProfileUpdate = {
  full_name?: string;
  phone_number?: string;
};

// Minimal base64 -> Uint8Array decoder so we can upload an image picked with
// expo-image-picker (base64: true) without pulling in an extra dependency.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToBytes(base64: string): Uint8Array {
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

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, phone_number, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    setProfile(
      data ?? {
        id: user.id,
        full_name: (user.user_metadata?.full_name as string) ?? null,
        email: user.email ?? null,
        phone_number: (user.user_metadata?.phone_number as string) ?? null,
        avatar_url: null,
      },
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Persist name / phone changes to the users row.
  const updateProfile = useCallback(async (update: ProfileUpdate): Promise<string | null> => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return 'You must be signed in.';

    const { data, error } = await supabase
      .from('users')
      .update(update)
      .eq('id', userId)
      .select('id, full_name, email, phone_number, avatar_url')
      .single();

    if (error) return error.message;
    if (data) setProfile(data);
    return null;
  }, []);

  // Upload a base64 image to the avatars bucket and save its public URL.
  const uploadAvatar = useCallback(
    async (base64: string, mimeType = 'image/jpeg'): Promise<string | null> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return 'You must be signed in.';

      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const bytes = base64ToBytes(base64);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, bytes, { contentType: mimeType, upsert: true });
      if (uploadError) return uploadError.message;

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { data, error } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)
        .select('id, full_name, email, phone_number, avatar_url')
        .single();
      if (error) return error.message;
      if (data) setProfile(data);
      return null;
    },
    [],
  );

  return { profile, loading, reload: load, updateProfile, uploadAvatar };
}
