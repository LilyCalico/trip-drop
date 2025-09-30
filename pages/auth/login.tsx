import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AuthWrapper from "@/components/custom/auth/AuthWrapper";
import ErrorMessage from "@/components/custom/auth/ErrorMessage";
import Label from "@/components/custom/auth/Label";
import Button from "@/components/custom/Button";
import Input from "@/components/custom/Input";
import Spinner from "@/components/custom/Spinner";
import { useSignin } from "@/hooks/auth/useSignin";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, loading: signingIn, error: signInError } = useSignin();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, router]);

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn(email, password);

      if (!res) {
        setError(signInError ?? "Failed to sign in");
        return;
      }
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || isAuthenticated) {
    return <Spinner />;
  }

  return (
    <AuthWrapper title="Log in">
      <form onSubmit={signInWithPassword} className="space-y-[3.2rem]">
        <div>
          <Label id="login-email" text="Email" />
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
        <div>
          <Label id="login-password" text="Password" />
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="off"
          />
        </div>

        {error && <ErrorMessage message={error} className="text-center" />}

        <div className="flex justify-center">
          <Button type="submit" disabled={loading || signingIn}>
            {loading || signingIn ? "Loading..." : "Log in"}
          </Button>
        </div>
      </form>
    </AuthWrapper>
  );
}
