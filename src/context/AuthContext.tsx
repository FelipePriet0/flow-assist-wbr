
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string | null;
  role: "analista_premium" | "analista_senior" | "reanalista" | "comercial";
  company_id: string | null;
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      // eslint-disable-next-line no-console
      console.log("[Auth] onAuthStateChange:", event, !!sess?.user);
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer fetching to avoid deadlocks
        setTimeout(() => void fetchProfile(sess.user.id), 0);
      } else {
        setProfile(null);
      }
    });

    // 2) Then get existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // eslint-disable-next-line no-console
      console.log("[Auth] getSession -> has session?", !!session?.user);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    setLoading(true);
    // eslint-disable-next-line no-console
    console.log("[Auth] Fetching profile for:", userId);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, company_id")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // eslint-disable-next-line no-console
        console.warn("[Auth] No profile row found for user yet.");
        setProfile(null);
      } else {
        setProfile(data as Profile);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to load profile", e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo<AuthContextValue>(() => ({ user, session, profile, loading, signOut }), [user, session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
