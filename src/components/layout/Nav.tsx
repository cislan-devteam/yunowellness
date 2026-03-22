"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

interface SearchResult {
  slug: string;
  name: string;
  subtitle: string | null;
  type_badge: string | null;
}

export default function Nav() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    setIsMac(/Mac/.test(navigator.userAgent));
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setQuery("");
        setResults([]);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
        setQuery("");
        setResults([]);
      }
    }
    if (searchOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [searchOpen]);

  // Search Supabase
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("peptides")
        .select("slug, name, subtitle, type_badge")
        .eq("is_published", true)
        .or(
          `name.ilike.%${query}%,subtitle.ilike.%${query}%,description.ilike.%${query}%`
        )
        .order("name")
        .limit(8);
      setResults(data || []);
      setLoading(false);
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  function handleSelect(slug: string) {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/peptides/${slug}`);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[68px] flex items-center justify-between px-[5%] bg-ivory/92 backdrop-blur-[16px] border-b border-pink/12">
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <span className="font-heading text-[1.3rem] font-bold text-plum">
          YuNo<span className="text-pink">Wellness</span> PH
        </span>
        <span className="bg-gradient-to-br from-pink to-pink-hover text-white text-[0.55rem] font-body font-semibold tracking-[1.5px] uppercase px-2 py-0.5 rounded-full">
          Peptides
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {/* Search trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cream border border-plum/8 text-text-muted text-sm hover:border-pink/30 hover:bg-white transition-all cursor-pointer"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline text-[0.6rem] text-text-muted/50 bg-ivory px-1.5 py-0.5 rounded border border-plum/8 font-mono">
              {isMac ? '\u2318' : 'Ctrl+'}K
            </kbd>
          </button>

          {/* Search dropdown */}
          {searchOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-[380px] bg-white rounded-2xl shadow-lg border border-plum/10 overflow-hidden z-50">
              <div className="p-3 border-b border-cream">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && results.length > 0) {
                      handleSelect(results[0].slug);
                    }
                  }}
                  placeholder="Search peptides..."
                  className="w-full px-3 py-2 rounded-xl bg-cream/50 text-sm text-text placeholder:text-text-muted/40 focus:outline-none"
                />
              </div>

              {loading && (
                <div className="p-4 text-center text-sm text-text-muted">
                  Searching...
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <div className="p-4 text-center text-sm text-text-muted">
                  No peptides found for &ldquo;{query}&rdquo;
                </div>
              )}

              {results.length > 0 && (
                <div className="max-h-[320px] overflow-y-auto">
                  {results.map((r) => (
                    <button
                      key={r.slug}
                      onClick={() => handleSelect(r.slug)}
                      className="w-full text-left px-4 py-3 hover:bg-pink-pale/50 transition-colors cursor-pointer border-b border-cream/50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[0.6rem] font-semibold text-pink bg-pink-pale px-2 py-0.5 rounded-full">
                          {r.type_badge || "Peptide"}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-plum mt-1">
                        {r.name}
                      </p>
                      {r.subtitle && (
                        <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                          {r.subtitle}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!query && (
                <div className="p-4 text-center text-xs text-text-muted/50">
                  Type to search 63 peptides by name, description, or use case
                </div>
              )}
            </div>
          )}
        </div>

        <Link
          href="/peptides"
          className="text-sm text-text-muted hover:text-pink transition-colors no-underline hidden sm:block"
        >
          Library
        </Link>
        <Link
          href="/calculator"
          className="text-sm text-text-muted hover:text-pink transition-colors no-underline hidden sm:block"
        >
          Calculator
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="text-sm font-semibold text-white bg-gradient-to-br from-pink to-pink-hover px-4 py-2 rounded-full hover:shadow-lg transition-shadow no-underline"
            >
              Shop
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/");
                router.refresh();
              }}
              className="text-sm text-text-muted hover:text-pink transition-colors cursor-pointer"
            >
              Log out
            </button>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-white bg-gradient-to-br from-pink to-pink-hover px-4 py-2 rounded-full hover:shadow-lg transition-shadow no-underline"
          >
            Members Login
          </Link>
        )}
      </div>
    </nav>
  );
}
