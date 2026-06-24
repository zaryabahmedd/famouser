// Loads and updates the signed-in user's profile row (public.users), including
// uploading a new avatar image to the public `avatars` storage bucket.
// Profile state lives in a shared React Context (ProfileProvider) so that all
// consumers — Home, Sidebar, EditProfile — stay in sync after any update.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { base64ToBytes } from '@/lib/base64';
import { supabase } from '@/lib/supabase';

// Cached copy of the last loaded profile. Hydrated synchronously-ish on startup
// so screens show the user's real avatar/name immediately instead of the default
// fallback while the network fetch (auth + DB) completes in the background.
const PROFILE_CACHE_KEY = 'famo:cached-profile:v1';

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  // When set to a future time, the user cannot submit another profile change
  // request (30-day limit). Set on submission, cleared on admin rejection.
  profile_locked_until: string | null;
};

export type ProfileUpdate = {
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
};

// The most recent profile-edit request the user submitted. Profile changes are
// not applied directly — they wait for admin approval through the Admin Panel.
export type ProfileChangeRequest = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  requested_at: string;
  reviewed_at: string | null;
};

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  // The latest change request (any status), or null if the user never submitted
  // one. Used to show "awaiting approval" / "declined" states on Edit Profile.
  latestChangeRequest: ProfileChangeRequest | null;
  reload: () => Promise<void>;
  // Submits an edit for admin approval instead of writing it live. Returns null
  // on success or a human-readable error (e.g. still within the 30-day window,
  // or a request is already pending).
  requestProfileChange: (update: ProfileUpdate) => Promise<string | null>;
  // Uploads the image to storage and returns its public URL. Does NOT persist it
  // to the profile — pass the URL to requestProfileChange() so it only goes live
  // once an admin approves the change.
  uploadAvatarFile: (
    base64: string,
    mimeType?: string,
  ) => Promise<{ url: string | null; error: string | null }>;
};

export const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  latestChangeRequest: null,
  reload: async () => {},
  requestProfileChange: async () => null,
  uploadAvatarFile: async () => ({ url: null, error: null }),
});

export function useProfile() {
  return useContext(ProfileContext);
}

// Mount this once in _layout.tsx so the profile is shared across all screens.
// Translates the raw error codes raised by the request_profile_change() RPC
// into messages a user can understand.
function mapRequestError(message: string): string {
  if (message.includes('profile_change_pending')) {
    return 'You already have a profile change awaiting admin approval. Please wait for it to be reviewed.';
  }
  if (message.includes('profile_edit_locked_until')) {
    const iso = message.split('profile_edit_locked_until:')[1]?.trim();
    const when = iso ? new Date(iso) : null;
    if (when && !Number.isNaN(when.getTime())) {
      return `You can only change your profile once every 30 days. You can edit again on ${when.toLocaleDateString()}.`;
    }
    return 'You can only change your profile once every 30 days.';
  }
  if (message.includes('not_authenticated')) {
    return 'You must be signed in.';
  }
  return message;
}

export function useProfileProvider(): ProfileContextValue {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [latestChangeRequest, setLatestChangeRequest] = useState<ProfileChangeRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      setProfile(null);
      setLatestChangeRequest(null);
      AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch(() => {});
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, phone_number, avatar_url, profile_locked_until')
      .eq('id', user.id)
      .maybeSingle();

    const resolved: Profile = data ?? {
      id: user.id,
      full_name: (user.user_metadata?.full_name as string) ?? null,
      email: user.email ?? null,
      phone_number: (user.user_metadata?.phone_number as string) ?? null,
      avatar_url: null,
      profile_locked_until: null,
    };
    setProfile(resolved);
    // Persist for the next cold start so the avatar/name appear instantly.
    AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(resolved)).catch(() => {});

    // Most recent change request, so Edit Profile can show pending/declined state.
    const { data: req } = await supabase
      .from('profile_change_requests')
      .select('id, status, rejection_reason, requested_at, reviewed_at')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setLatestChangeRequest((req as ProfileChangeRequest) ?? null);

    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Show the cached profile right away so the real avatar/name render on the
    // first frame. Only applies if the network load hasn't already filled it in.
    AsyncStorage.getItem(PROFILE_CACHE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const cached = JSON.parse(raw) as Profile;
          setProfile((prev) => prev ?? cached);
        } catch {
          // Ignore a corrupt cache entry; the network load below is the source of truth.
        }
      })
      .catch(() => {});
    load();

    // Reload (or clear) when the user signs in/out so we never show a previous
    // account's cached avatar after an account switch.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLatestChangeRequest(null);
        AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch(() => {});
      } else if (event === 'SIGNED_IN') {
        load();
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  // Submits the edit for admin approval rather than writing it to the live
  // profile. The database enforces the 30-day limit and the "one pending request
  // at a time" rule; on success the profile only changes once an admin approves.
  const requestProfileChange = useCallback(
    async (update: ProfileUpdate): Promise<string | null> => {
      const { error } = await supabase.rpc('request_profile_change', {
        p_full_name: update.full_name ?? null,
        p_phone_number: update.phone_number ?? null,
        p_avatar_url: update.avatar_url ?? null,
      });
      if (error) return mapRequestError(error.message);
      // Refresh so the lock timestamp and the new pending request are reflected.
      await load();
      return null;
    },
    [load],
  );

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

  return {
    profile,
    loading,
    latestChangeRequest,
    reload: load,
    requestProfileChange,
    uploadAvatarFile,
  };
}
