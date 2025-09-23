import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import AuthWrapper from "@/components/custom/auth/AuthWrapper";
import ErrorMessage from "@/components/custom/auth/ErrorMessage";
import Label from "@/components/custom/auth/Label";
import Button from "@/components/custom/Button";
import Input from "@/components/custom/Input";
import supabase from "@/lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be 8 characters or more");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/`
            : undefined
      }
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setMessage(
        "A confirmation email has been sent. Please check your email and click the link to verify your account."
      );
    }
    setLoading(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setPassword(v);
    setPasswordError(
      v.length > 0 && v.length < 8
        ? "Password must be at least 8 characters"
        : null
    );

    // パスワード変更時は確認一致も再評価
    setConfirmError(confirm && v !== confirm ? "Passwords do not match" : null);
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setConfirm(v);
    setConfirmError(v && v !== password ? "Passwords do not match" : null);
  };

  return (
    <AuthWrapper title="Sign up">
      <form onSubmit={onSubmit} className="space-y-[3.2rem]">
        <div>
          <Label id="signup-email" text="Email" />
          <Input
            id="signup-email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label id="signup-password" text="Password" />
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="8 characters or more"
              value={password}
              onChange={handlePasswordChange}
              aria-invalid={Boolean(passwordError)}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-[1.2rem] top-[56%] -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff className="size-6" />
              ) : (
                <Eye className="size-6" />
              )}
            </button>
          </div>
          {passwordError && <ErrorMessage message={passwordError} />}
        </div>
        <div>
          <Label id="signup-confirm" text="Password(Confirm)" />
          <div className="relative">
            <Input
              id="signup-confirm"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={handleConfirmChange}
              aria-invalid={Boolean(confirmError)}
              required
            />
            <button
              type="button"
              aria-label={
                showConfirm ? "Hide confirm password" : "Show confirm password"
              }
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute right-[1.2rem] top-[56%] -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirm ? (
                <EyeOff className="size-6" />
              ) : (
                <Eye className="size-6" />
              )}
            </button>
          </div>
          {confirmError && <ErrorMessage message={confirmError} />}
        </div>
        {error && <ErrorMessage message={error} />}
        <div className="flex justify-center">
          <Button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Signup"}
          </Button>
        </div>
      </form>

      {/* Login Link */}
      <div className="mt-[3.2rem] text-center">
        <Link href="/auth/login" className="underline">
          Already have an account?
        </Link>
      </div>

      {message && (
        <div className="mt-[3.2rem] text-muted-foreground">{message}</div>
      )}
    </AuthWrapper>
  );
}
