/** Stub — Doorli vendor auth uses OTP/JWT via @/lib/api, not Supabase. */
export function createClient() {
  const err = () => {
    throw new Error('Supabase removed — use Doorli OTP auth (/login)');
  };
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signInWithPassword: err,
      signUp: err,
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
          single: async () => ({ data: null, error: null }),
        }),
        order: () => ({ data: [], error: null }),
      }),
      upsert: err,
      insert: err,
      update: () => ({ eq: err }),
      delete: () => ({ eq: err }),
    }),
  };
}
