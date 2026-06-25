# Admin Panel Handoff — Profile Change Approval

**For the Admin Panel Claude Code instance.**
This describes a feature already built on the **shared Supabase backend** by the User App side. Your job is the **Admin Panel UI** that reviews and resolves the requests. The database contract below already exists — do not recreate it; build against it.

- **Supabase project ref:** `yoyscueorzeapqolutvp`
- **Schema:** `public`

---

## What this feature does

Users can no longer edit their profile directly. On the User App's **Edit Profile** screen, a save now creates a **pending change request**. Nothing on the live profile (`public.users`) changes until an **admin approves** it in the Admin Panel. Rules already enforced on the user side and in the database:

1. **Admin approval required** — name, phone, and profile photo all go through review.
2. **30-day limit** — a user can only submit a profile change once every 30 days. The clock starts at **submission**. If a request is **rejected**, the lock is cleared so the user can resubmit immediately.

---

## Database objects (already created — just use them)

### Table: `public.profile_change_requests`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `user_id` | uuid | FK → `public.users(id)` |
| `full_name` | text | proposed new value (nullable) |
| `phone_number` | text | proposed new value (nullable) |
| `avatar_url` | text | proposed new value, already uploaded to the `avatars` storage bucket (nullable) |
| `status` | text | `pending` \| `approved` \| `rejected` |
| `rejection_reason` | text | set when rejected |
| `requested_at` | timestamptz | submission time |
| `reviewed_at` | timestamptz | set on approve/reject |
| `reviewed_by` | text | whatever admin identifier you pass in |

- There is a **unique partial index**: at most **one `pending` request per user**.
- **RLS:** users can only read their own rows. The admin side should use the **service role key** (bypasses RLS) to read the full queue.

### Column added to `public.users`

- `profile_locked_until timestamptz` — when in the future, the user is blocked from submitting. Set to `now() + 30 days` on submission; cleared on rejection. **You don't need to touch this directly** — the functions below manage it.

---

## The two functions you call from the Admin Panel

Both are `SECURITY DEFINER` and **granted to `service_role` only**. Call them from your server/admin context (service role key) — e.g. `supabase.rpc(...)` on a server client, or `SELECT` in SQL.

### Approve

```sql
select * from public.approve_profile_change(
  p_request_id => '<uuid>',
  p_reviewer   => 'admin@famo'   -- optional label stored in reviewed_by
);
```
Copies the request's non-null `full_name` / `phone_number` / `avatar_url` into `public.users`, marks the request `approved`. The 30-day lock (set at submission) stays in force.

### Reject

```sql
select * from public.reject_profile_change(
  p_request_id => '<uuid>',
  p_reviewer   => 'admin@famo',  -- optional
  p_reason     => 'Photo unclear' -- optional, shown to the user
);
```
Marks the request `rejected`, stores the reason, and **clears `profile_locked_until`** so the user can resubmit right away.

Both raise `request_not_found` or `request_not_pending` if called on a bad/already-resolved id.

---

## What to build in the Admin Panel

1. **A queue view** — list `profile_change_requests` where `status = 'pending'`, newest first, joined to `public.users` so you can show the user's **current** name/phone/avatar next to the **proposed** values (diff view).
   ```sql
   select r.*, u.full_name as current_name, u.phone_number as current_phone, u.avatar_url as current_avatar
   from public.profile_change_requests r
   join public.users u on u.id = r.user_id
   where r.status = 'pending'
   order by r.requested_at desc;
   ```
2. **Approve / Reject buttons** that call the two functions above. Reject should prompt for an optional reason.
3. Optionally, a **history view** filtering `status in ('approved','rejected')`.
4. For the avatar, render `avatar_url` directly — it's a public URL in the `avatars` bucket.

---

## One thing to confirm with me (User App side)

The admin functions are currently granted to **`service_role` only**, which assumes your Admin Panel talks to Supabase with the **service role key** (server-side). If your Admin Panel instead authenticates admins as regular Supabase `authenticated` users (e.g. an `admins` table or a role claim), tell me your admin-auth model and I'll add an `is_admin` check inside the functions and grant `execute` to `authenticated`. Don't grant these functions to `authenticated` without that check, or any logged-in user could approve their own request.
