import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import type { Peptide, PeptideBenefit, PeptideSideEffect } from "@/types/database";

export const revalidate = 3600;

const FREQ_LABELS: Record<string, string> = {
  very_common: "Very Common",
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
};

const FREQ_STYLES: Record<string, string> = {
  very_common: "bg-gold-pale text-[#C8880A]",
  common: "bg-gold-pale text-[#C8880A]",
  uncommon: "bg-sage-pale text-sage",
  rare: "bg-pink-pale text-pink",
};

const STRENGTH_LABELS: Record<number, string> = {
  5: "Very Strong Effect",
  4: "Strong Effect",
  3: "Moderate Effect",
  2: "Mild Effect",
  1: "Minimal Effect",
};

function StrengthDots({ strength }: { strength: number }) {
  return (
    <div className="flex items-center gap-1 mt-2.5 text-[0.7rem] uppercase tracking-wide text-text-muted font-medium">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-[7px] h-[7px] rounded-full ${
              i <= strength ? "bg-pink" : "bg-cream"
            }`}
          />
        ))}
      </div>
      <span>{STRENGTH_LABELS[strength] || "Moderate Effect"}</span>
    </div>
  );
}

async function getPeptide(slug: string) {
  const { data: peptide } = await supabase
    .from("peptides")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!peptide) return null;

  const [{ data: benefits }, { data: sideEffects }] = await Promise.all([
    supabase
      .from("peptide_benefits")
      .select("*")
      .eq("peptide_id", peptide.id)
      .order("sort_order"),
    supabase
      .from("peptide_side_effects")
      .select("*")
      .eq("peptide_id", peptide.id)
      .order("sort_order"),
  ]);

  return { peptide: peptide as Peptide, benefits: (benefits || []) as PeptideBenefit[], sideEffects: (sideEffects || []) as PeptideSideEffect[] };
}

export async function generateStaticParams() {
  const { data } = await supabase
    .from("peptides")
    .select("slug")
    .eq("is_published", true);
  return (data || []).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPeptide(slug);
  if (!result) return { title: "Not Found — YuNoWellness PH" };
  return {
    title: `${result.peptide.name} Guide — YuNoWellness PH`,
    description: result.peptide.description,
  };
}

export default async function PeptidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPeptide(slug);
  if (!result) notFound();

  const { peptide: p, benefits, sideEffects } = result;

  const tocSections = [
    { id: "what", label: `What is ${p.name}?` },
    { id: "benefits", label: "Key Benefits" },
    { id: "sideeffects", label: "Side Effects" },
    { id: "dosing", label: "Dosing Guide" },
    { id: "reconstitution", label: "Reconstitution" },
    { id: "supplies", label: "What You'll Need" },
  ];

  return (
    <>
      <Nav />

      {/* Hero */}
      <div className="bg-gradient-to-br from-plum via-[#5C2E59] to-[#7A3A77] pt-[110px] pb-[60px] px-[5%] relative overflow-hidden">
        <div className="absolute -top-[100px] -right-[100px] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,107,138,0.2)_0%,transparent_70%)]" />
        <div className="absolute -bottom-[80px] left-[30%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(125,184,154,0.15)_0%,transparent_70%)]" />
        <div className="relative z-10 max-w-[1100px] grid grid-cols-1 lg:grid-cols-[1fr_auto] items-start gap-10">
          <div>
            <div className="flex items-center gap-2 text-[0.78rem] text-white/45 mb-5">
              <Link href="/" className="text-white/45 hover:text-pink-light no-underline">Home</Link>
              <span>&rsaquo;</span>
              <Link href="/peptides" className="text-white/45 hover:text-pink-light no-underline">Peptide Library</Link>
              <span>&rsaquo;</span>
              <span className="text-white/60">{p.name}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-pink/20 border border-pink/35 rounded-full px-3.5 py-1 text-[0.78rem] text-pink-light font-semibold tracking-wide mb-4">
              {p.type_badge}
            </div>
            <h1 className="font-heading text-white text-[clamp(2.8rem,5vw,4.5rem)] leading-none mb-2">
              {p.name}
            </h1>
            <p className="font-heading italic text-[1.2rem] text-white/55 mb-5">
              {p.subtitle}
            </p>
            <p className="text-white/70 leading-relaxed max-w-[560px] mb-7">
              {p.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {(p.hero_tags || []).map((tag) => (
                <span key={tag} className="px-3.5 py-1.5 rounded-full text-[0.78rem] font-semibold bg-white/10 text-white/80 border border-white/15">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Hero Stats Card */}
          <div className="hidden lg:block bg-white/7 border border-white/12 rounded-3xl p-7 min-w-[220px] backdrop-blur-sm">
            {(p.hero_stats || []).map((stat, i) => (
              <div key={i} className={`py-3 ${i < p.hero_stats.length - 1 ? "border-b border-white/8" : ""}`}>
                <div className="text-[0.72rem] uppercase tracking-wider text-white/40 mb-1">{stat.label}</div>
                <div className="text-white font-semibold">
                  <span className="text-pink-light">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1100px] mx-auto px-[5%] py-[60px] grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 items-start">
        <main>
          {/* What Is It */}
          <section id="what" className="mb-[60px]">
            <p className="text-[0.72rem] uppercase tracking-[2px] text-pink font-semibold mb-2">
              {p.what_is_it_label || "Understanding"} {p.name}
            </p>
            <h2 className="font-heading text-plum text-[1.9rem] leading-tight mb-5">
              {p.what_is_it_title || "So... what exactly is it?"}
            </h2>
            <div className="text-[0.95rem] text-text-muted leading-relaxed space-y-3.5">
              {p.what_is_it_body ? (
                <div dangerouslySetInnerHTML={{ __html: p.what_is_it_body }} />
              ) : (
                <p>{p.description}</p>
              )}
            </div>
            {p.what_is_it_cards && p.what_is_it_cards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {p.what_is_it_cards.map((card, i) => (
                  <div key={i} className={`bg-white rounded-2xl p-7 shadow-sm border-l-4 ${i === 0 ? "border-pink" : "border-sage"}`}>
                    <div className="text-[2.5rem] mb-3">{card.emoji}</div>
                    <h3 className="font-heading text-plum text-[1.2rem] mb-2">{card.headline}</h3>
                    <p className="text-text-muted text-[0.9rem] leading-relaxed">{card.text}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <hr className="h-px border-0 bg-gradient-to-r from-transparent via-pink/20 to-transparent my-12" />

          {/* Benefits */}
          <section id="benefits" className="mb-[60px]">
            <p className="text-[0.72rem] uppercase tracking-[2px] text-pink font-semibold mb-2">What it Does</p>
            <h2 className="font-heading text-plum text-[1.9rem] leading-tight mb-5">Key Benefits</h2>
            <p className="text-text-muted mb-7">{p.benefits_intro || `Here's what ${p.name} is commonly used for.`}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((b) => (
                <div key={b.id} className="bg-white rounded-[18px] p-5 shadow-sm border border-plum/5 hover:-translate-y-1 hover:shadow-md transition-all">
                  <div className="text-[1.8rem] mb-2.5">{b.icon}</div>
                  <h3 className="font-semibold text-plum text-[0.95rem] mb-1.5">{b.title}</h3>
                  <p className="text-text-muted text-[0.82rem] leading-relaxed">{b.description}</p>
                  <StrengthDots strength={b.strength} />
                </div>
              ))}
            </div>
          </section>

          <hr className="h-px border-0 bg-gradient-to-r from-transparent via-pink/20 to-transparent my-12" />

          {/* Side Effects */}
          <section id="sideeffects" className="mb-[60px]">
            <p className="text-[0.72rem] uppercase tracking-[2px] text-pink font-semibold mb-2">Safety Profile</p>
            <h2 className="font-heading text-plum text-[1.9rem] leading-tight mb-5">Common Side Effects</h2>
            {p.side_effects_intro && (
              <div className="text-text-muted mb-6" dangerouslySetInnerHTML={{ __html: p.side_effects_intro }} />
            )}
            <div className="space-y-3">
              {sideEffects.map((se) => (
                <div key={se.id} className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-plum/5 flex items-start gap-4">
                  <span className="text-[1.5rem] shrink-0 mt-0.5">{se.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-plum text-[0.92rem] mb-1">{se.name}</h4>
                    <p className="text-text-muted text-[0.83rem] leading-relaxed">{se.description}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[0.7rem] font-semibold uppercase tracking-wide whitespace-nowrap ${FREQ_STYLES[se.frequency] || FREQ_STYLES.common}`}>
                    {FREQ_LABELS[se.frequency] || "Common"}
                  </span>
                </div>
              ))}
            </div>
            {p.side_effects_bottom_line && (
              <div className="bg-sage-pale rounded-[14px] p-5 mt-5 border border-sage-light">
                <p className="text-[0.85rem] text-[#4A7D65] leading-relaxed">
                  <strong>The bottom line:</strong> {p.side_effects_bottom_line}
                </p>
              </div>
            )}
          </section>

          <hr className="h-px border-0 bg-gradient-to-r from-transparent via-pink/20 to-transparent my-12" />

          {/* Dosing */}
          <section id="dosing" className="mb-[60px]">
            <p className="text-[0.72rem] uppercase tracking-[2px] text-pink font-semibold mb-2">How Much to Take</p>
            <h2 className="font-heading text-plum text-[1.9rem] leading-tight mb-5">Dosing Guide</h2>
            {p.dosing_intro && (
              <div className="text-text-muted mb-7" dangerouslySetInnerHTML={{ __html: p.dosing_intro }} />
            )}
            {p.dosing_cards && p.dosing_cards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                {p.dosing_cards.map((d, i) => (
                  <div key={i} className={`bg-white rounded-[18px] p-5 text-center shadow-sm border ${d.recommended ? "border-pink bg-pink-pale" : "border-plum/5"}`}>
                    <div className="text-[0.72rem] uppercase tracking-widest text-text-muted font-semibold mb-2">{d.level}</div>
                    <div className={`font-heading text-[1.6rem] mb-1 ${d.recommended ? "text-pink" : "text-plum"}`}>{d.amount}</div>
                    <div className="text-[0.78rem] text-text-muted">{d.unit}</div>
                    {d.recommended && <span className="text-[0.7rem] text-pink font-semibold mt-1.5 block">Most Popular</span>}
                    <p className={`text-[0.75rem] mt-2 leading-snug ${d.recommended ? "text-pink/80" : "text-text-muted"}`}>{d.description}</p>
                  </div>
                ))}
              </div>
            )}
            {p.dosing_info && p.dosing_info.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
                {p.dosing_info.map((d, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-plum/5">
                    <div className="text-[0.72rem] uppercase tracking-wider text-text-muted font-semibold mb-1.5">{d.label}</div>
                    <div className="font-semibold text-plum">{d.value}</div>
                    {d.note && <p className="text-[0.78rem] text-text-muted mt-1">{d.note}</p>}
                  </div>
                ))}
              </div>
            )}
            {p.dosing_tip && (
              <div className="bg-gold-pale rounded-[14px] p-5 border border-[#FFE0A0]">
                <p className="text-[0.85rem] text-[#8A5E10] leading-relaxed">
                  <strong>Dosing tip:</strong> {p.dosing_tip}
                </p>
              </div>
            )}
          </section>

          <hr className="h-px border-0 bg-gradient-to-r from-transparent via-pink/20 to-transparent my-12" />

          {/* Reconstitution */}
          <section id="reconstitution" className="mb-[60px]">
            <p className="text-[0.72rem] uppercase tracking-[2px] text-pink font-semibold mb-2">Preparing Your Peptide</p>
            <h2 className="font-heading text-plum text-[1.9rem] leading-tight mb-5">How to Reconstitute {p.name}</h2>
            {p.recon_intro && <p className="text-text-muted mb-6">{p.recon_intro}</p>}
            {p.recon_steps && p.recon_steps.length > 0 && (
              <div className="bg-white rounded-2xl p-7 shadow-sm">
                {p.recon_steps.map((step, i) => (
                  <div key={i} className={`flex gap-4 py-4 items-start ${i < p.recon_steps.length - 1 ? "border-b border-cream" : ""}`}>
                    <div className="w-8 h-8 bg-gradient-to-br from-pink to-pink-hover text-white rounded-full flex items-center justify-center font-bold text-[0.85rem] shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-[0.88rem] text-text-muted leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            )}
            {p.recon_tip && (
              <div className="bg-pink-pale rounded-[14px] p-4 mt-4 border border-pink-light">
                <p className="text-[0.84rem] text-plum leading-relaxed">
                  <strong>Tip:</strong> {p.recon_tip}
                </p>
              </div>
            )}
          </section>

          <hr className="h-px border-0 bg-gradient-to-r from-transparent via-pink/20 to-transparent my-12" />

          {/* Supplies */}
          <section id="supplies" className="mb-[60px]">
            <p className="text-[0.72rem] uppercase tracking-[2px] text-pink font-semibold mb-2">Before You Start</p>
            <h2 className="font-heading text-plum text-[1.9rem] leading-tight mb-5">What You&apos;ll Need</h2>
            {p.supplies && p.supplies.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {p.supplies.map((s, i) => (
                  <div key={i} className="bg-white rounded-[14px] p-4 text-center shadow-sm border border-plum/5">
                    <div className="text-[1.8rem] mb-2">{s.emoji}</div>
                    <h4 className="text-[0.84rem] font-semibold text-plum mb-1">{s.name}</h4>
                    <p className="text-[0.74rem] text-text-muted leading-snug">{s.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Disclaimer */}
          <div className="bg-gradient-to-br from-plum/5 to-plum/2 border border-plum/10 rounded-2xl p-7 flex gap-4 mt-12">
            <span className="text-[2rem] shrink-0">&#9877;&#65039;</span>
            <div>
              <h3 className="font-heading text-plum text-[1.1rem] mb-2">Important Disclaimer</h3>
              <p className="text-text-muted text-[0.85rem] leading-relaxed">
                This guide is for <strong>educational purposes only</strong>. This is a research compound and is not approved by the FDA or Philippine FDA as a medical treatment. Nothing here constitutes medical advice. Always consult a licensed healthcare professional before starting any peptide protocol. Use responsibly, understand your local regulations, and prioritize your safety above all else.
              </p>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-plum/5 sticky top-[88px]">
            <h3 className="font-heading text-plum mb-4">On This Page</h3>
            <ul className="space-y-1.5">
              {tocSections.map((s, i) => (
                <li key={s.id} className="border-b border-cream pb-1.5 last:border-0">
                  <a href={`#${s.id}`} className="text-[0.84rem] text-text-muted hover:text-pink flex items-center gap-2 no-underline transition-colors">
                    <span className="w-5 h-5 bg-cream rounded-full flex items-center justify-center text-[0.68rem] text-plum-mid font-bold shrink-0">
                      {i + 1}
                    </span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {p.quick_facts && p.quick_facts.length > 0 && (
            <div className="bg-pink-pale rounded-2xl p-6 mt-5 border border-pink-light">
              <h3 className="text-[0.78rem] uppercase tracking-widest text-pink font-semibold mb-3.5">Quick Facts</h3>
              {p.quick_facts.map((qf, i) => (
                <div key={i} className={`flex justify-between text-[0.83rem] py-1.5 ${i < p.quick_facts.length - 1 ? "border-b border-pink/12" : ""}`}>
                  <span className="text-text-muted">{qf.label}</span>
                  <span className="text-plum font-semibold text-right max-w-[55%]">{qf.value}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      <Footer />
    </>
  );
}
