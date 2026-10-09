import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { profileSchema, type Profile } from "@shared";
import { api, setAccessToken, setApiHandlers } from "@/lib/api";
import { keys } from "@/lib/keys";
import { supabase } from "@/lib/supabase";

type AuthValue = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<"session" | "confirm">;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    setApiHandlers({
      onUnauthorized: () => {
        const here = `${window.location.pathname}${window.location.search}`;
        void supabase.auth.signOut();
        if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/signup")) {
          sessionStorage.setItem("post-login-path", here);
          window.location.assign("/login");
        }
      },
    });
  }, []);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAccessToken(data.session?.access_token ?? null);
      setBooted(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAccessToken(next?.access_token ?? null);
      if (!next) queryClient.removeQueries({ queryKey: keys.me });
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [queryClient]);

  const me = useQuery({
    queryKey: keys.me,
    queryFn: () => api.get("/me", profileSchema, undefined, { silent: true, redirectOn401: false }),
    enabled: Boolean(session),
    retry: false,
  });

  useEffect(() => {
    if (!me.isError) return;
    void supabase.auth.signOut();
  }, [me.isError]);

  const value = useMemo<AuthValue>(
    () => ({
      loading: !booted || (Boolean(session) && me.isLoading),
      session,
      profile: me.data ?? null,
      async signIn(email, password) {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw new Error(result.error.message);
        const profile = await api.get("/me", profileSchema, undefined, { silent: true, redirectOn401: false });
        queryClient.setQueryData(keys.me, profile);
      },
      async signUp(email, password) {
        const result = await supabase.auth.signUp({ email, password });
        if (result.error) throw new Error(result.error.message);
        if (!result.data.session) return "confirm";
        const profile = await api.get("/me", profileSchema, undefined, { silent: true, redirectOn401: false });
        queryClient.setQueryData(keys.me, profile);
        return "session";
      },
      async signOut() {
        await supabase.auth.signOut();
        queryClient.clear();
      },
    }),
    [booted, me.data, me.isLoading, queryClient, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is missing");
  return value;
}
