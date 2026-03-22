"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowser();

  const [tab, setTab] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(searchParams.get("error") === "auth_failed" ? "Authentication failed. Please try again." : "");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const next = searchParams.get("next") ?? "/shop";
    router.push(next);
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setLoading(true);

    const next = searchParams.get("next") ?? "/shop";
    const { error: magicError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    });

    if (magicError) {
      setError(magicError.message);
      setLoading(false);
      return;
    }

    setMagicSent(true);
    setLoading(false);
  }

  if (magicSent) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-5">
        <div className="bg-white rounded-3xl p-10 shadow-md border border-plum/5 max-w-[440px] w-full text-center">
          <div className="text-5xl mb-4">&#x2728;</div>
          <h1 className="font-heading text-plum text-2xl mb-3">
            Magic link sent!
          </h1>
          <p className="text-text-muted leading-relaxed">
            Check your inbox for{" "}
            <strong className="text-plum">{email}</strong>. Click the link to
            log in instantly — no password needed.
          </p>
          <button
            onClick={() => setMagicSent(false)}
            className="mt-6 text-pink font-semibold text-sm hover:underline cursor-pointer"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-5">
      <div className="bg-white rounded-3xl p-10 shadow-md border border-plum/5 max-w-[480px] w-full">
        <Link href="/" className="flex items-center gap-2 mb-8 no-underline">
          <span className="font-heading text-[1.3rem] font-bold text-plum">
            YuNo<span className="text-pink">Wellness</span> PH
          </span>
          <span className="bg-gradient-to-br from-pink to-pink-hover text-white text-[0.55rem] font-body font-semibold tracking-[1.5px] uppercase px-2 py-0.5 rounded-full">
            Peptides
          </span>
        </Link>

        <h1 className="font-heading text-plum text-2xl mb-1">Welcome back</h1>
        <p className="text-text-muted text-sm mb-6">
          Log in to access the members-only shop.
        </p>

        {error && (
          <div className="bg-pink-pale border border-pink-light rounded-xl px-4 py-3 mb-6 text-sm text-pink">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-cream rounded-xl p-1 mb-6">
          <button
            onClick={() => { setTab("password"); setError(""); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              tab === "password"
                ? "bg-white text-plum shadow-sm"
                : "text-text-muted hover:text-plum"
            }`}
          >
            Email &amp; Password
          </button>
          <button
            onClick={() => { setTab("magic"); setError(""); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              tab === "magic"
                ? "bg-white text-plum shadow-sm"
                : "text-text-muted hover:text-plum"
            }`}
          >
            Magic Link
          </button>
        </div>

        {tab === "password" ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-[0.78rem] text-text-muted font-semibold uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-plum/12 bg-cream text-text text-sm placeholder:text-text-muted/40 focus:border-pink focus:ring-2 focus:ring-pink/15 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[0.78rem] text-text-muted font-semibold uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-plum/12 bg-cream text-text text-sm placeholder:text-text-muted/40 focus:border-pink focus:ring-2 focus:ring-pink/15 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-gradient-to-br from-pink to-pink-hover text-white font-semibold shadow-[0_4px_18px_rgba(255,107,138,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,107,138,0.45)] active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label className="block text-[0.78rem] text-text-muted font-semibold uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-plum/12 bg-cream text-text text-sm placeholder:text-text-muted/40 focus:border-pink focus:ring-2 focus:ring-pink/15 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-gradient-to-br from-pink to-pink-hover text-white font-semibold shadow-[0_4px_18px_rgba(255,107,138,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,107,138,0.45)] active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </button>
            <p className="text-text-muted text-xs text-center leading-relaxed">
              We&apos;ll email you a one-time login link. No password needed.
            </p>
          </form>
        )}

        <p className="text-center text-text-muted text-sm mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-pink font-semibold hover:underline"
          >
            Sign up with invite code
          </Link>
        </p>
      </div>
    </div>
  );
}
