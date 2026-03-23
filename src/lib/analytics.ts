// GA4 Custom Event Helper
// All events are sent to Google Analytics via gtag()

type GTagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: string | number | undefined;
};

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...(args as Parameters<typeof window.gtag>));
  }
}

// Extend window type for gtag
declare global {
  interface Window {
    gtag: (...args: [string, ...unknown[]]) => void;
  }
}

// ─── PEPTIDE ENGAGEMENT ───

export function trackPeptideView(name: string, slug: string) {
  gtag("event", "view_peptide", {
    peptide_name: name,
    peptide_slug: slug,
  });
}

export function trackSearch(query: string, source: "nav" | "library", resultCount: number) {
  gtag("event", "search_peptide", {
    search_term: query,
    search_source: source,
    result_count: resultCount,
  });
}

export function trackFilterUsed(filterType: "route" | "difficulty", filterValue: string) {
  gtag("event", "filter_used", {
    filter_type: filterType,
    filter_value: filterValue,
  });
}

// ─── CALCULATOR ───

export function trackCalculatorUse(doseMg: number, strengthMg: number, waterMl: number) {
  gtag("event", "calculator_use", {
    dose_mg: doseMg,
    vial_strength_mg: strengthMg,
    water_ml: waterMl,
  });
}

export function trackCalculatorQuickfill(peptideName: string, doseMg: number) {
  gtag("event", "calculator_quickfill", {
    peptide_name: peptideName,
    dose_mg: doseMg,
  });
}

export function trackCalculatorCopy() {
  gtag("event", "calculator_copy");
}

// ─── AUTH / CONVERSION FUNNEL ───

export function trackSignupStart() {
  gtag("event", "signup_start");
}

export function trackSignupComplete(method: "password" | "magic_link") {
  gtag("event", "signup_complete", {
    signup_method: method,
  });
}

export function trackLoginComplete(method: "password" | "magic_link") {
  gtag("event", "login_complete", {
    login_method: method,
  });
}

export function trackInviteCodeEntered(valid: boolean) {
  gtag("event", "invite_code_entered", {
    code_valid: valid ? "yes" : "no",
  });
}

// ─── COMMERCE (future) ───

export function trackAddToCart(productName: string, priceCents: number) {
  gtag("event", "add_to_cart", {
    product_name: productName,
    price: priceCents / 100,
    currency: "PHP",
  });
}

export function trackCheckoutStart(totalCents: number, itemCount: number) {
  gtag("event", "begin_checkout", {
    value: totalCents / 100,
    currency: "PHP",
    item_count: itemCount,
  });
}

export function trackPurchase(orderId: string, totalCents: number) {
  gtag("event", "purchase", {
    transaction_id: orderId,
    value: totalCents / 100,
    currency: "PHP",
  });
}
