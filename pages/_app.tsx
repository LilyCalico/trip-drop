import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import Header from "@/components/custom/Header";
import supabase from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/useAuthStore";

export default function App({ Component, pageProps }: AppProps) {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    (async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);

      const { data: listener } = supabase.auth.onAuthStateChange(
        (_e, session) => setSession(session ?? null)
      );
      unsubscribe = () => listener.subscription.unsubscribe();
      setLoading(false);
    })();

    return () => unsubscribe?.();
  }, [setSession, setLoading]);

  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}
