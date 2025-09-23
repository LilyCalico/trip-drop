import { useState } from "react";
import AuthWrapper from "@/components/custom/auth/AuthWrapper";
import ErrorMessage from "@/components/custom/auth/ErrorMessage";
import Label from "@/components/custom/auth/Label";
import Button from "@/components/custom/Button";
import Input from "@/components/custom/Input";
import supabase from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      alert("Login successful");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWrapper title="Sign in">
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
          <Button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Sign in"}
          </Button>
        </div>
      </form>
    </AuthWrapper>
  );
}
