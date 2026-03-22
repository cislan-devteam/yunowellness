"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Pre-fill invite code from URL param
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) setInviteCode(code);
  }, [searchParams]);

  async function validateInviteCode(code: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("invite_codes")
      .select("id, code, max_uses, times_used, is_active, expires_at")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (error || !data) return false;
    if (!data.is_active) return false;
    if (data.max_uses && data.times_used >= data.max_uses) return false;
    if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
    return true;
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate invite code
    const codeValid = await validateInviteCode(inviteCode);
    if (!codeValid) {
      setError("Invalid or expired invite code. Contact us if you need access.");
      setLoading(false);
      return;
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          display_name: displayName,
          invite_code: inviteCode.trim().toUpperCase(),
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Create member record
      await supabase.from("members").insert({
        user_id: authData.user.id,
        display_name: displayName,
        email,
        invite_code_used: inviteCode.trim().toUpperCase(),
      });

      // Increment invite code usage
      const upperCode = inviteCode.trim().toUpperCase();
      const { data: codeData } = await supabase
        .from("invite_codes")
        .select("times_used")
        .eq("code", upperCode)
        .single();

      if (codeData) {
        await supabase
          .from("invite_codes")
          .update({ times_used: codeData.times_used + 1 })
          .eq("code", upperCode);
      }
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleMagicLink() {
    setError("");
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    if (!inviteCode) {
      setError("An invite code is required to sign up.");
      return;
    }

    setLoading(true);

    const codeValid = await validateInviteCode(inviteCode);
    if (!codeValid) {
      setError("Invalid or expired invite code.");
      setLoading(false);
      return;
    }

    const { error: magicError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          display_name: displayName,
          invite_code: inviteCode.trim().toUpperCase(),
        },
      },
    });

    if (magicError) {
      setError(magicError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-5">
        <div className="bg-white rounded-3xl p-10 shadow-md border border-plum/5 max-w-[440px] w-full text-center">
          <div className="text-5xl mb-4">&#x2709;&#xfe0f;</div>
          <h1 className="font-heading text-plum text-2xl mb-3">
            Check your email
          </h1>
          <p className="text-text-muted leading-relaxed">
            We sent a confirmation link to{" "}
            <strong className="text-plum">{email}</strong>. Click the link in
            your email to activate your account.
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-6 text-pink font-semibold text-sm hover:underline"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-5">
      <div className="bg-white rounded-3xl p-10 shadow-md border border-plum/5 max-w-[480px] w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 no-underline">
          <span className="font-heading text-[1.3rem] font-bold text-plum">
            YuNo<span className="text-pink">Wellness</span> PH
          </span>
          <span className="bg-gradient-to-br from-pink to-pink-hover text-white text-[0.55rem] font-body font-semibold tracking-[1.5px] uppercase px-2 py-0.5 rounded-full">
            Peptides
          </span>
        </Link>

        <h1 className="font-heading text-plum text-2xl mb-1">
          Create your account
        </h1>
        <p className="text-text-muted text-sm mb-8">
          Invite-only membership. You&apos;ll need a valid invite code.
        </p>

        {error && (
          <div className="bg-pink-pale border border-pink-light rounded-xl px-4 py-3 mb-6 text-sm text-pink">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Invite Code */}
          <div>
            <label className="block text-[0.78rem] text-text-muted font-semibold uppercase tracking-wider mb-1.5">
              Invite Code *
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter your invite code"
              required
              className="w-full px-4 py-3 rounded-xl border-[1.5px] border-plum/12 bg-cream text-text text-sm font-mono tracking-wider placeholder:text-text-muted/40 focus:border-pink focus:ring-2 focus:ring-pink/15 outline-none transition-all"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-[0.78rem] text-text-muted font-semibold uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we call you?"
              className="w-full px-4 py-3 rounded-xl border-[1.5px] border-plum/12 bg-cream text-text text-sm placeholder:text-text-muted/40 focus:border-pink focus:ring-2 focus:ring-pink/15 outline-none transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[0.78rem] text-text-muted font-semibold uppercase tracking-wider mb-1.5">
              Email *
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

          {/* Password */}
          <div>
            <label className="block text-[0.78rem] text-text-muted font-semibold uppercase tracking-wider mb-1.5">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border-[1.5px] border-plum/12 bg-cream text-text text-sm placeholder:text-text-muted/40 focus:border-pink focus:ring-2 focus:ring-pink/15 outline-none transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-gradient-to-br from-pink to-pink-hover text-white font-semibold shadow-[0_4px_18px_rgba(255,107,138,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,107,138,0.45)] active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <hr className="flex-1 h-px border-0 bg-cream" />
          <span className="text-text-muted text-xs">or</span>
          <hr className="flex-1 h-px border-0 bg-cream" />
        </div>

        {/* Magic Link */}
        <button
          onClick={handleMagicLink}
          disabled={loading}
          className="w-full py-3.5 rounded-full border-[1.5px] border-plum/12 text-text-muted font-semibold hover:border-pink hover:text-pink transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Sending..." : "Sign up with Magic Link (no password)"}
        </button>

        <p className="text-center text-text-muted text-sm mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-pink font-semibold hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
