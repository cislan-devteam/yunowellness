"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { trackSearch, trackFilterUsed } from "@/lib/analytics";

interface PeptideCard {
  slug: string;
  name: string;
  subtitle: string | null;
  type_badge: string | null;
  difficulty: string | null;
  administration_route: string | null;
  hero_tags: string[];
}

export default function PeptideLibrary({
  peptides,
}: {
  peptides: PeptideCard[];
}) {
  const [search, setSearch] = useState("");
  const [activeRoute, setActiveRoute] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const routes = useMemo(
    () =>
      [...new Set(peptides.map((p) => p.administration_route).filter(Boolean))] as string[],
    [peptides]
  );

  const difficulties = useMemo(
    () =>
      [...new Set(peptides.map((p) => p.difficulty).filter(Boolean))] as string[],
    [peptides]
  );

  const filtered = useMemo(() => {
    let result = peptides;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
          (p.hero_tags &&
            p.hero_tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (activeRoute) {
      result = result.filter((p) => p.administration_route === activeRoute);
    }

    if (activeDifficulty) {
      result = result.filter((p) => p.difficulty === activeDifficulty);
    }

    return result;
  }, [peptides, search, activeRoute, activeDifficulty]);

  // Track search (debounced)
  useEffect(() => {
    if (!search.trim()) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      trackSearch(search, "library", filtered.length);
    }, 800);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, filtered.length]);

  return (
    <>
      {/* Search */}
      <div className="relative mb-6">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          <svg
            width="18"
            height="18"
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
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search peptides by name, use, or tag..."
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-plum/10 text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-pink focus:ring-2 focus:ring-pink/20 transition-all shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-pink transition-colors text-lg leading-none"
          >
            &times;
          </button>
        )}
      </div>

      {/* Route filter pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => setActiveRoute(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
            !activeRoute
              ? "bg-pink text-white"
              : "bg-cream text-text-muted hover:bg-pink-pale hover:text-pink"
          }`}
        >
          All ({peptides.length})
        </button>
        {routes.map((r) => (
          <button
            key={r}
            onClick={() => { const next = activeRoute === r ? null : r; setActiveRoute(next); if (next) trackFilterUsed("route", next); }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              activeRoute === r
                ? "bg-pink text-white"
                : "bg-cream text-text-muted hover:bg-pink-pale hover:text-pink"
            }`}
          >
            {r} (
            {peptides.filter((p) => p.administration_route === r).length})
          </button>
        ))}
      </div>

      {/* Difficulty filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {difficulties.map((d) => (
          <button
            key={d}
            onClick={() => {
              const next = activeDifficulty === d ? null : d; setActiveDifficulty(next); if (next) trackFilterUsed("difficulty", next);
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              activeDifficulty === d
                ? "bg-sage text-white"
                : "bg-sage-pale text-sage hover:bg-sage-light"
            }`}
          >
            {d}
          </button>
        ))}
        {activeDifficulty && (
          <button
            onClick={() => setActiveDifficulty(null)}
            className="px-3 py-1 rounded-full text-xs font-semibold text-text-muted hover:text-pink transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results count */}
      {(search || activeRoute || activeDifficulty) && (
        <p className="text-sm text-text-muted mb-4">
          Showing {filtered.length} of {peptides.length} peptides
          {search && (
            <>
              {" "}
              matching &ldquo;<span className="text-pink font-semibold">{search}</span>&rdquo;
            </>
          )}
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((p) => (
          <Link
            key={p.slug}
            href={`/peptides/${p.slug}`}
            className="group bg-white rounded-2xl p-6 shadow-sm border border-plum/5 hover:-translate-y-1 hover:shadow-md transition-all no-underline"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[0.68rem] font-semibold text-pink bg-pink-pale px-2.5 py-0.5 rounded-full">
                {p.type_badge || "Peptide"}
              </span>
              {p.difficulty && (
                <span className="text-[0.68rem] font-semibold text-sage bg-sage-pale px-2.5 py-0.5 rounded-full">
                  {p.difficulty}
                </span>
              )}
            </div>
            <h3 className="font-heading text-plum text-xl font-bold mb-1 group-hover:text-pink transition-colors">
              {p.name}
            </h3>
            <p className="text-text-muted text-sm leading-relaxed line-clamp-2">
              {p.subtitle}
            </p>
            {p.hero_tags && p.hero_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {p.hero_tags.slice(0, 3).map((tag: string) => (
                  <span
                    key={tag}
                    className="text-[0.65rem] text-text-muted bg-cream px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-lg text-text-muted mb-2">No peptides found.</p>
          <p className="text-sm text-text-muted">
            Try a different search term or clear your filters.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setActiveRoute(null);
              setActiveDifficulty(null);
            }}
            className="mt-4 text-pink font-semibold text-sm hover:underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}
    </>
  );
}
