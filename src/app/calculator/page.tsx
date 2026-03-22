import type { Metadata } from "next";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import Calculator from "@/components/peptide/Calculator";

export const metadata: Metadata = {
  title: "Peptide Reconstitution Calculator — YuNoWellness PH",
  description:
    "Free peptide calculator. Enter your vial strength, BAC water volume, and desired dose — we tell you exactly how many units to draw. No math required.",
};

export default function CalculatorPage() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <div className="bg-gradient-to-br from-plum via-[#5C2E59] to-[#7A3A77] pt-[108px] pb-14 px-[5%] relative overflow-hidden">
        <div className="absolute -top-[120px] -right-[120px] w-[480px] h-[480px] rounded-full bg-[radial-gradient(circle,rgba(255,107,138,0.18)_0%,transparent_70%)]" />
        <div className="absolute -bottom-[80px] left-[20%] w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(125,184,154,0.12)_0%,transparent_70%)]" />
        <div className="relative z-10 max-w-[700px]">
          <div className="inline-flex items-center gap-2 bg-pink/18 border border-pink/30 rounded-full px-4 py-1.5 text-[0.78rem] text-pink-light font-semibold tracking-wide mb-5">
            Free Tool
          </div>
          <h1 className="font-heading text-white text-[clamp(2.2rem,4vw,3.2rem)] leading-tight mb-3.5">
            Peptide Reconstitution
            <br />
            Calculator
          </h1>
          <p className="text-white/65 leading-relaxed max-w-[560px]">
            Enter your peptide vial strength, how much bacteriostatic water you
            added, and your desired dose — we&apos;ll tell you exactly how many
            units to draw in your syringe. No math required.
          </p>
        </div>
      </div>

      <Calculator />

      <Footer />
    </>
  );
}
