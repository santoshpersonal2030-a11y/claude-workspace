import { createServerSupabase } from './supabase/server';

// Returns the Supabase client if the current user is an admin, otherwise null.
// Row Level Security also blocks non-admins at the database, but this gives us
// a clean check for guarding pages and server actions.
export async function getAdminClient() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) return null;
  return supabase;
}
