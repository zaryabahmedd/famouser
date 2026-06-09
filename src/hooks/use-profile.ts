// Loads and updates the signed-in user's profile row (public.users), including
// uploading a new avatar image to the public `avatars` storage bucket.
// Profile state lives in a shared React Context (ProfileProvider) so that all
// consumers — Home, Sidebar, EditProfile — stay in sync after any update.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { base64ToBytes } from '@/lib/base64';
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

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  reload: () => Promise<void>;
  updateProfile: (update: ProfileUpdate) => Promise<string | null>;
  uploadAvatar: (base64: string, mimeType?: string) => Promise<string | null>;
};

export const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  reload: async () => {},
  updateProfile: async () => null,
  uploadAvatar: async () => null,
});

export function useProfile() {
  return useContext(ProfileContext);
}

// Mount this once in _layout.tsx so the profile is shared across all screens.
export function useProfileProvider(): ProfileContextValue {
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

  const uploadAvatar = useCallback(async (base64: string, mimeType = 'image/jpeg'): Promise<string | null> => {
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
  }, []);

  return { profile, loading, reload: load, updateProfile, uploadAvatar };
}
