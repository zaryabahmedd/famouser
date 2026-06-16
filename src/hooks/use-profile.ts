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
  avatar_url?: string;
};

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  reload: () => Promise<void>;
  updateProfile: (update: ProfileUpdate) => Promise<string | null>;
  // Uploads the image to storage and returns its public URL. Does NOT persist it
  // to the profile — call updateProfile({ avatar_url }) to save it. This keeps a
  // freshly picked photo from showing app-wide before the user taps "Save".
  uploadAvatarFile: (
    base64: string,
    mimeType?: string,
  ) => Promise<{ url: string | null; error: string | null }>;
};

export const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  reload: async () => {},
  updateProfile: async () => null,
  uploadAvatarFile: async () => ({ url: null, error: null }),
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
    const user = auth.user;
    if (!user) return 'You must be signed in.';

    // Upsert (not update) so the profile saves even when the user has no
    // public.users row yet — e.g. accounts created before the row was seeded.
    // A plain UPDATE would match zero rows and .single() would throw
    // "Cannot coerce the result to a single JSON object". The id/email are
    // included so the INSERT path (and its RLS check auth.uid() = id) succeeds.
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: user.id, email: user.email ?? null, ...update }, { onConflict: 'id' })
      .select('id, full_name, email, phone_number, avatar_url')
      .single();

    if (error) return error.message;
    if (data) setProfile(data);
    return null;
  }, []);

  // Uploads the picked image to the avatars bucket and returns its public URL.
  // Intentionally does NOT write users.avatar_url or touch the shared profile —
  // that only happens when the user saves (via updateProfile), so the new photo
  // stays local to the Edit Profile screen until then.
  const uploadAvatarFile = useCallback(
    async (
      base64: string,
      mimeType = 'image/jpeg',
    ): Promise<{ url: string | null; error: string | null }> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return { url: null, error: 'You must be signed in.' };

      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const bytes = base64ToBytes(base64);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, bytes, { contentType: mimeType, upsert: true });
      if (uploadError) return { url: null, error: uploadError.message };

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      return { url: pub.publicUrl, error: null };
    },
    [],
  );

  return { profile, loading, reload: load, updateProfile, uploadAvatarFile };
}
