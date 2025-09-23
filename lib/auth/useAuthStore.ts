import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

type AuthState = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  loading: true,
  setSession: (session) =>
    set(() => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.user)
    })),
  setLoading: (loading) => set(() => ({ loading })),
  clear: () =>
    set(() => ({ user: null, session: null, isAuthenticated: false }))
}));
