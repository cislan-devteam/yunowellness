import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import PeptideLibrary from "@/components/peptide/PeptideLibrary";
import { supabase } from "@/lib/supabase";

export const revalidate = 3600;

async function getPeptides() {
  const { data } = await supabase
    .from("peptides")
    .select(
      "slug, name, subtitle, type_badge, difficulty, administration_route, hero_tags"
    )
    .eq("is_published", true)
    .order("name");
  return data || [];
}

export default async function PeptidesPage() {
  const peptides = await getPeptides();

  return (
    <>
      <Nav />
      <div className="pt-[110px] pb-16 px-[5%] max-w-[1100px] mx-auto">
        <p className="text-pink text-xs font-semibold tracking-[2px] uppercase mb-2">
          Complete Library
        </p>
        <h1 className="font-heading text-plum text-4xl mb-2">
          Peptide Library
        </h1>
        <p className="text-text-muted mb-8">
          {peptides.length} educational guides covering dosing, benefits, side
          effects, and reconstitution.
        </p>

        <PeptideLibrary peptides={peptides} />
      </div>
      <Footer />
    </>
  );
}
