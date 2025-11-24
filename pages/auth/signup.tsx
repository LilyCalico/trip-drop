import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AuthWrapper from "@/components/custom/auth/AuthWrapper";
import ErrorMessage from "@/components/custom/auth/ErrorMessage";
import Label from "@/components/custom/auth/Label";
import Button from "@/components/custom/button/Button";
import Input from "@/components/ui/input";
import { useSignup } from "@/hooks/auth/useSignup";
import { useAuthStore } from "@/store/useAuthStore";

export default function SignupPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [validateError, setValidateError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { signup, loading: signupLoading, error: signupError } = useSignup();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleOnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidateError(null);
    setMessage(null);

    if (password !== confirm) {
      setValidateError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setValidateError("Password must be 8 characters or more");
      return;
    }

    try {
      const result = await signup({ email, password });

      if (result) {
        setMessage(
          "A confirmation email has been sent. Please check your email and click the link to verify your account. If you didn't receive the email, this address may already be registered.",
        );
        setPasswordError(null);
        setConfirmError(null);
        setShowPassword(false);
        setShowConfirm(false);
        setEmail("");
        setPassword("");
        setConfirm("");
      }
    } catch {
      console.error(signupError);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setPassword(v);
    setPasswordError(
      v.length > 0 && v.length < 8
        ? "Password must be at least 8 characters"
        : null,
    );

    // パスワード変更時は確認一致も再評価
    setConfirmError(confirm && v !== confirm ? "Passwords do not match" : null);
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setConfirm(v);
    setConfirmError(v && v !== password ? "Passwords do not match" : null);
  };

  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  return (
    <AuthWrapper title="Sign up">
      <form onSubmit={handleOnSubmit} className="space-y-[3.2rem]">
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
        {(signupError || validateError) && (
          <ErrorMessage message={signupError || validateError || ""} />
        )}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={signupLoading || !email || !password || !confirm}
          >
            {signupLoading ? "Loading..." : "Signup"}
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
        <div className="mt-[3.2rem] text-muted-foreground text-red-500">
          {message}
        </div>
      )}
    </AuthWrapper>
  );
}
