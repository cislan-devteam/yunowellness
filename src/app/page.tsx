import Link from "next/link";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";

export const revalidate = 3600; // revalidate every hour

async function getPeptides() {
  const { data } = await supabase
    .from("peptides")
    .select("slug, name, subtitle, type_badge, difficulty, hero_tags")
    .eq("is_published", true)
    .order("name");
  return data || [];
}

export default async function HomePage() {
  const peptides = await getPeptides();

  return (
    <>
      <Nav />

      {/* Hero */}
      <section className="relative pt-[140px] pb-20 px-[5%] bg-gradient-to-br from-plum via-[#5C2E59] to-[#7A3A77] overflow-hidden">
        <div className="absolute -top-[100px] -right-[100px] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,107,138,0.2)_0%,transparent_70%)]" />
        <div className="absolute -bottom-[80px] left-[30%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(125,184,154,0.15)_0%,transparent_70%)]" />
        <div className="relative z-10 max-w-[900px] mx-auto text-center">
          <p className="text-pink-light text-sm font-semibold tracking-widest uppercase mb-4">
            Filipino Peptide Education
          </p>
          <h1 className="font-heading text-white text-[clamp(2.5rem,5vw,4.5rem)] leading-tight mb-6">
            Your Trusted Guide to{" "}
            <span className="text-pink-light italic">Peptide Wellness</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-[600px] mx-auto mb-10">
            Plain-English guides on peptides, dosing, reconstitution, and
            wellness. Written for real people — no medical jargon, no fluff.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/peptides"
              className="bg-gradient-to-br from-pink to-pink-hover text-white font-semibold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-shadow no-underline"
            >
              Browse Peptide Library
            </Link>
            <Link
              href="/calculator"
              className="bg-white/10 text-white/80 border border-white/15 font-semibold px-8 py-3.5 rounded-full hover:bg-white/15 transition-colors no-underline"
            >
              Reconstitution Calculator
            </Link>
          </div>
        </div>
      </section>

      {/* Peptide Grid */}
      <section className="max-w-[1100px] mx-auto px-[5%] py-16">
        <p className="text-pink text-xs font-semibold tracking-[2px] uppercase mb-2">
          Peptide Library
        </p>
        <h2 className="font-heading text-plum text-3xl mb-2">
          Explore Our Guides
        </h2>
        <p className="text-text-muted mb-10">
          {peptides.length} peptides and counting. Click any card to read the
          full guide.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {peptides.map((p) => (
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

        {peptides.length === 0 && (
          <div className="text-center py-20 text-text-muted">
            <p className="text-lg mb-2">No peptides published yet.</p>
            <p className="text-sm">Check back soon!</p>
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
