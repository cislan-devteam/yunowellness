export interface Peptide {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  type_badge: string | null;
  administration_route: string | null;
  difficulty: string | null;
  hero_tags: string[];
  hero_stats: { label: string; value: string }[];
  quick_facts: { label: string; value: string }[];
  what_is_it_label: string | null;
  what_is_it_title: string | null;
  what_is_it_body: string | null;
  what_is_it_cards: { emoji: string; headline: string; text: string }[];
  benefits_intro: string | null;
  side_effects_intro: string | null;
  side_effects_bottom_line: string | null;
  dosing_intro: string | null;
  dosing_cards: {
    level: string;
    amount: string;
    unit: string;
    description: string;
    recommended: boolean;
  }[];
  dosing_info: { label: string; value: string; note: string }[];
  dosing_tip: string | null;
  recon_intro: string | null;
  recon_steps: { text: string }[];
  recon_tip: string | null;
  supplies: { emoji: string; name: string; description: string }[];
  inject_intro: string | null;
  inject_steps: {
    emoji: string;
    label: string;
    title: string;
    desc: string;
    tip?: string;
    warn?: string;
  }[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PeptideBenefit {
  id: string;
  peptide_id: string;
  icon: string | null;
  title: string;
  description: string | null;
  strength: number;
  sort_order: number;
}

export interface PeptideSideEffect {
  id: string;
  peptide_id: string;
  icon: string | null;
  name: string;
  description: string | null;
  frequency: "very_common" | "common" | "uncommon" | "rare";
  sort_order: number;
}

// Commerce types
export interface Member {
  id: string;
  user_id: string;
  display_name: string | null;
  invite_code_used: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  peptide_id: string | null;
  image_url: string | null;
  stock_qty: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  member_id: string;
  stripe_payment_intent_id: string | null;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  total_cents: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      peptides: { Row: Peptide };
      peptide_benefits: { Row: PeptideBenefit };
      peptide_side_effects: { Row: PeptideSideEffect };
      members: { Row: Member };
      products: { Row: Product };
      orders: { Row: Order };
    };
  };
}
