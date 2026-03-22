import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-plum border-t border-white/5 px-[5%] py-10 flex justify-between items-center flex-wrap gap-5">
      <div className="font-heading text-[1.1rem] text-white">
        YuNo<span className="text-pink">Wellness</span> PH
      </div>
      <p className="text-[0.78rem] text-white/35 max-w-[500px] leading-relaxed text-center">
        For educational purposes only. Not medical advice. Always consult a
        healthcare professional. YuNoWellness PH does not sell, distribute, or
        endorse any specific peptide products.
      </p>
      <div className="flex gap-5">
        <Link href="#" className="text-[0.82rem] text-white/45 no-underline">
          Privacy
        </Link>
        <Link href="#" className="text-[0.82rem] text-white/45 no-underline">
          Disclaimer
        </Link>
        <Link href="#" className="text-[0.82rem] text-white/45 no-underline">
          Contact
        </Link>
      </div>
    </footer>
  );
}
