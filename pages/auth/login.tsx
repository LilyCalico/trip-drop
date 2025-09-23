import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import supabase from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setUserEmail(data.session?.user?.email ?? null);
      const { data: listener } = supabase.auth.onAuthStateChange(
        (_e, session) => {
          setUserEmail(session?.user?.email ?? null);
        }
      );
      unsubscribe = () => listener.subscription.unsubscribe();
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (signInError) {
      setError(signInError.message);
    } else {
      setMessage("ログイン成功");
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto mt-[12rem] max-w-[70vw] bg-red-200">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form onSubmit={signInWithPassword} className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="login-email">Email</label>
          <Input
            id="login-email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="login-password">Password</label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="off"
          />
        </div>
      </form>

      {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
      {message && (
        <div className="mt-3 text-sm text-muted-foreground">{message}</div>
      )}
    </div>
  );
}
