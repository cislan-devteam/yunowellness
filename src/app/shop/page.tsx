import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import { createSupabaseServer } from "@/lib/supabase-server";

export default async function ShopPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Nav />
      <div className="pt-[110px] pb-16 px-[5%] max-w-[1100px] mx-auto">
        <p className="text-pink text-xs font-semibold tracking-[2px] uppercase mb-2">
          Members Only
        </p>
        <h1 className="font-heading text-plum text-4xl mb-2">Shop</h1>
        <p className="text-text-muted mb-10">
          Welcome back, {user?.user_metadata?.display_name || user?.email}. Browse our private peptide catalog below.
        </p>

        <div className="bg-white rounded-3xl p-12 shadow-sm border border-plum/5 text-center">
          <div className="text-5xl mb-4">&#x1f6d2;</div>
          <h2 className="font-heading text-plum text-2xl mb-3">
            Coming Soon
          </h2>
          <p className="text-text-muted max-w-[400px] mx-auto leading-relaxed">
            We&apos;re setting up the product catalog. Check back soon for our curated peptide selection available exclusively for members.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
