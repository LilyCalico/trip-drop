import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import Header from "@/components/custom/layout/Header";
import Spinner from "@/components/custom/Spinner";
import useGetTrips from "@/hooks/trips/useGetTrips";
import supabase from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/useAuthStore";
import { useTripsStore } from "@/store/useTripsStore";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { loading, isAuthenticated, session } = useAuthStore();
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);
  const { fetchTrips } = useGetTrips();
  const setTrips = useTripsStore((s) => s.setTrips);

  // 1. セッションを取得
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    (async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);

      const { data: listener } = supabase.auth.onAuthStateChange(
        (_e, session) => setSession(session ?? null),
      );
      unsubscribe = () => listener.subscription.unsubscribe();
      setLoading(false);
    })();

    return () => unsubscribe?.();
  }, [setSession, setLoading]);

  // 2. 認証チェック(認証済みで非authページの場合はリダイレクト)
  useEffect(() => {
    if (loading) return;

    const currentPath = router.pathname;
    const isAuthPage = currentPath.startsWith("/auth/");

    if (!isAuthenticated && !isAuthPage) {
      router.replace("/auth/login");
    } else if (isAuthenticated && isAuthPage) {
      router.replace("/");
    }
    // 認証済みで非authページの場合は何もしない（そのまま表示）
  }, [loading, isAuthenticated, router]);

  // 3. tripsを取得(セッションがある場合はtripsを取得)
  useEffect(() => {
    if (!session?.access_token) return;

    const fetchTripsData = async () => {
      const trips = await fetchTrips();
      setTrips(trips ?? []);
    };

    fetchTripsData();
  }, [session?.access_token, fetchTrips, setTrips]);

  // 認証確認中はローディング表示
  if (loading) {
    return <Spinner />;
  }

  return (
    <>
      <Head>
        <title>Trip Drop</title>
      </Head>
      <Header />
      <div className="max-w-[140rem] mx-auto">
        <Component {...pageProps} />
      </div>
      <Toaster />
    </>
  );
}
