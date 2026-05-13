"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function AuthModal({ isOpen, onClose }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }
      setLoading(false);
      router.refresh();
      onClose();
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username },
        },
      });
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }
      setLoading(false);
      setVerificationSent(true);
    }
  };

  const handleGoogleAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md px-8 py-10 rounded-2xl shadow-2xl"
        style={{ background: "var(--card)", boxShadow: "var(--shadow)" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-5 transition hover:opacity-60"
          style={{ color: "var(--muted)" }}
        >
          ✕
        </button>

        {verificationSent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2
              className="text-2xl font-semibold mb-2"
              style={{ color: "var(--text)" }}
            >
              Check your email
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              We sent a verification link to{" "}
              <span className="font-medium" style={{ color: "var(--text)" }}>
                {email}
              </span>
              .
              <br />
              Click the link to activate your account.
            </p>
          </div>
        ) : (
          <>
            <h2
              className="text-2xl font-semibold text-center mb-6"
              style={{ color: "var(--text)" }}
            >
              {isLogin ? "Log In" : "Sign Up"}
            </h2>

            {errorMessage && (
              <div
                className="text-sm p-3 rounded-xl text-center mb-4"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleAuth} className="flex flex-col gap-3">
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border"
                  style={{
                    background: "var(--bg)",
                    color: "var(--text)",
                    borderColor: "rgba(0,0,0,0.1)",
                  }}
                />
              )}
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none border"
                style={{
                  background: "var(--bg)",
                  color: "var(--text)",
                  borderColor: "rgba(0,0,0,0.1)",
                }}
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none border"
                style={{
                  background: "var(--bg)",
                  color: "var(--text)",
                  borderColor: "rgba(0,0,0,0.1)",
                }}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm transition hover:opacity-90 disabled:opacity-60 mt-1"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  boxShadow:
                    "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)",
                }}
              >
                {loading ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
              </button>
            </form>

            {/* Toggle */}
            <p
              className="text-sm text-center mt-5"
              style={{ color: "var(--muted)" }}
            >
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 font-medium hover:underline"
                style={{ color: "var(--accent)" }}
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div
                className="flex-1 h-px"
                style={{ background: "rgba(0,0,0,0.08)" }}
              />
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                OR
              </span>
              <div
                className="flex-1 h-px"
                style={{ background: "rgba(0,0,0,0.08)" }}
              />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleAuth}
              className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-medium transition hover:opacity-90 gap-2 border"
              style={{
                background: "var(--bg)",
                color: "var(--text)",
                borderColor: "rgba(0,0,0,0.1)",
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
