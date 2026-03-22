"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function Footer() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <footer className="bg-plum border-t border-white/5 px-[5%] py-10">
      <div className="max-w-[1100px] mx-auto">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div className="font-heading text-[1.1rem] text-white">
            YuNo<span className="text-pink">Wellness</span> PH
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/peptides" className="text-[0.82rem] text-white/45 hover:text-pink-light no-underline transition-colors">
              Peptide Library
            </Link>
            <Link href="/calculator" className="text-[0.82rem] text-white/45 hover:text-pink-light no-underline transition-colors">
              Calculator
            </Link>
            <Link href="#" className="text-[0.82rem] text-white/45 hover:text-pink-light no-underline transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-[0.82rem] text-white/45 hover:text-pink-light no-underline transition-colors">
              Disclaimer
            </Link>
            <Link href="#" className="text-[0.82rem] text-white/45 hover:text-pink-light no-underline transition-colors">
              Contact
            </Link>
          </div>
        </div>

        {/* Auth section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-6 border-t border-white/8">
          {user ? (
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-[0.8rem] text-white/40">
                Logged in as <span className="text-white/60">{user.email}</span>
              </span>
              <Link href="/shop" className="text-[0.82rem] text-pink-light hover:text-pink font-semibold no-underline transition-colors">
                Go to Shop
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/");
                  router.refresh();
                }}
                className="text-[0.82rem] text-white/45 hover:text-pink-light transition-colors cursor-pointer"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-[0.8rem] text-white/40">Members area</span>
              <Link href="/auth/login" className="text-[0.82rem] text-pink-light hover:text-pink font-semibold no-underline transition-colors">
                Log in
              </Link>
              <Link href="/auth/signup" className="text-[0.82rem] text-white/45 hover:text-pink-light no-underline transition-colors">
                Sign up with invite code
              </Link>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-[0.72rem] text-white/25 leading-relaxed pt-6 border-t border-white/5">
          For educational purposes only. Not medical advice. Always consult a
          healthcare professional before starting any peptide protocol.
          YuNoWellness PH does not sell, distribute, or endorse any specific
          peptide products.
        </p>
      </div>
    </footer>
  );
}
