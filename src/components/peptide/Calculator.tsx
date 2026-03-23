"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { trackCalculatorUse, trackCalculatorQuickfill, trackCalculatorCopy } from "@/lib/analytics";

// Dose presets in mcg (displayed as mg)
const DOSE_PRESETS_MCG = [100, 250, 500, 750, 1000, 1500, 2000, 2500, 5000];
const STRENGTH_PRESETS = [1, 2, 5, 10, 15, 20, 50];
const WATER_PRESETS = [0.5, 1, 1.5, 2, 2.5, 3];

interface PeptideDose {
  name: string;
  slug: string;
  dosing_cards: { level: string; amount: string; unit: string; recommended: boolean }[];
  hero_stats: { label: string; value: string }[];
  difficulty: string | null;
  administration_route: string | null;
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full border-[1.5px] text-[0.88rem] font-medium cursor-pointer transition-all select-none ${
        active
          ? "bg-gradient-to-br from-pink to-pink-hover text-white border-transparent shadow-[0_4px_16px_rgba(255,107,138,0.38)] -translate-y-px"
          : "bg-cream text-text-muted border-plum/12 hover:border-pink-light hover:text-plum hover:bg-pink-pale"
      }`}
    >
      {children}
    </button>
  );
}

export default function Calculator() {
  const [dose, setDose] = useState(250);
  const [strength, setStrength] = useState(5);
  const [water, setWater] = useState(1);
  const [toast, setToast] = useState(false);
  const [peptideSearch, setPeptideSearch] = useState("");
  const [peptides, setPeptides] = useState<PeptideDose[]>([]);
  const [peptidesLoaded, setPeptidesLoaded] = useState(false);
  const syringeRef = useRef<HTMLDivElement>(null);
  const supabase = createSupabaseBrowser();

  // Load all peptide dosing data once
  useEffect(() => {
    if (peptidesLoaded) return;
    supabase
      .from("peptides")
      .select("name, slug, dosing_cards, hero_stats, difficulty, administration_route")
      .eq("is_published", true)
      .order("name")
      .then(({ data }) => {
        if (data) setPeptides(data as PeptideDose[]);
        setPeptidesLoaded(true);
      });
  }, [peptidesLoaded, supabase]);

  const filteredPeptides = useMemo(() => {
    if (!peptideSearch.trim()) return peptides.slice(0, 8);
    const q = peptideSearch.toLowerCase();
    return peptides.filter((p) => p.name.toLowerCase().includes(q));
  }, [peptides, peptideSearch]);

  // Calculations
  const concentrationMcg = (strength * 1000) / water;
  const concentration = strength / water; // mg/mL
  const volumeToInject = dose / concentrationMcg;
  const unitsOnSyringe = volumeToInject * 100;
  const shotsPerVial = dose > 0 ? Math.floor((strength * 1000) / dose) : 0;
  const drawDisplay =
    unitsOnSyringe % 1 === 0
      ? unitsOnSyringe.toString()
      : unitsOnSyringe.toFixed(1);
  const fillPct = Math.min((unitsOnSyringe / 100) * 100, 100);
  const overLimit = unitsOnSyringe > 100;

  const handleQuickFill = useCallback(
    (d: number, s: number, w: number) => {
      setDose(d);
      setStrength(s);
      setWater(w);
    },
    []
  );

  const handleReset = useCallback(() => {
    setDose(250);
    setStrength(5);
    setWater(1);
  }, []);

  const doseMg = dose / 1000;

  // Track calculator usage (debounced)
  const calcTimer = useRef<ReturnType<typeof setTimeout>>(null);
  useEffect(() => {
    if (calcTimer.current) clearTimeout(calcTimer.current);
    calcTimer.current = setTimeout(() => {
      trackCalculatorUse(doseMg, strength, water);
    }, 1500);
    return () => { if (calcTimer.current) clearTimeout(calcTimer.current); };
  }, [doseMg, strength, water]);

  const handleCopy = useCallback(() => {
    const text = `YuNoWellness PH \u2014 Peptide Calculator Results
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
Dose: ${doseMg} mg (${dose} mcg)
Vial Strength: ${strength} mg
BAC Water Added: ${water} mL
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
Concentration: ${concentration % 1 === 0 ? concentration : concentration.toFixed(2)} mg/mL
Draw Syringe To: ${drawDisplay} units
Volume to Inject: ${volumeToInject.toFixed(3)} mL
Doses per Vial: ~${shotsPerVial}
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
For educational purposes only. Not medical advice.`;
    navigator.clipboard.writeText(text);
    trackCalculatorCopy();
    setToast(true);
    setTimeout(() => setToast(false), 2800);
  }, [dose, doseMg, strength, water, concentration, drawDisplay, volumeToInject, shotsPerVial]);

  // Build syringe ticks
  const [ticksBuilt, setTicksBuilt] = useState(false);
  useEffect(() => setTicksBuilt(true), []);

  return (
    <div className="max-w-[1100px] mx-auto px-[5%] py-12 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-9 items-start">
      {/* LEFT: Calculator */}
      <div>
        <div className="bg-white rounded-[28px] p-10 shadow-md border border-plum/5">
          {/* Step 1: Dose */}
          <div>
            <h2 className="font-heading text-plum text-[1.05rem] flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 bg-gradient-to-br from-pink to-pink-hover text-white rounded-full text-[0.75rem] font-bold flex items-center justify-center shrink-0 shadow-[0_3px_10px_rgba(255,107,138,0.4)]">
                1
              </span>
              How much do you want to inject?
              <span className="text-text-muted text-[0.8rem] font-body font-normal ml-1">
                (your dose)
              </span>
            </h2>
            <div className="mb-2">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-heading text-pink text-2xl font-bold">
                    {dose / 1000}
                  </span>
                  <span className="text-text-muted text-[0.78rem] ml-1">
                    mg
                  </span>
                  <span className="text-text-muted text-[0.68rem] ml-2">
                    ({dose.toLocaleString()} mcg)
                  </span>
                </div>
                <span className="text-text-muted text-[0.78rem]">
                  milligrams
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={10000}
                step={50}
                value={dose}
                onChange={(e) => setDose(+e.target.value)}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-pink"
                style={{
                  background: `linear-gradient(90deg, var(--color-pink) ${((dose - 50) / 9950) * 100}%, var(--color-cream) ${((dose - 50) / 9950) * 100}%)`,
                }}
              />
              <div className="flex justify-between mt-1.5">
                {["0.05 mg", "2.5", "5", "7.5", "10 mg"].map((t) => (
                  <span key={t} className="text-[0.68rem] text-text-muted">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3.5">
              {DOSE_PRESETS_MCG.map((d) => (
                <PillButton
                  key={d}
                  active={dose === d}
                  onClick={() => setDose(d)}
                >
                  {d >= 1000 ? `${d / 1000} mg` : `${d / 1000} mg`}
                </PillButton>
              ))}
            </div>
            <div className="flex items-center gap-2.5 mt-3">
              <span className="text-[0.82rem] text-text-muted whitespace-nowrap">
                Custom:
              </span>
              <input
                type="number"
                placeholder="e.g. 0.3"
                min={0.01}
                step={0.01}
                className="max-w-[140px] px-4 py-2.5 rounded-xl border-[1.5px] border-plum/12 bg-cream text-[0.9rem] text-text focus:border-pink focus:ring-2 focus:ring-pink/12 outline-none transition-all"
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (v > 0) setDose(Math.round(v * 1000));
                }}
              />
              <span className="text-[0.82rem] text-text-muted">mg</span>
            </div>
          </div>

          <hr className="h-px border-0 bg-cream my-7" />

          {/* Step 2: Vial Strength */}
          <div>
            <h2 className="font-heading text-plum text-[1.05rem] flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 bg-gradient-to-br from-pink to-pink-hover text-white rounded-full text-[0.75rem] font-bold flex items-center justify-center shrink-0 shadow-[0_3px_10px_rgba(255,107,138,0.4)]">
                2
              </span>
              How much peptide is in your vial?
              <span className="text-text-muted text-[0.8rem] font-body font-normal ml-1">
                (vial strength)
              </span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {STRENGTH_PRESETS.map((s) => (
                <PillButton
                  key={s}
                  active={strength === s}
                  onClick={() => setStrength(s)}
                >
                  {s} mg
                </PillButton>
              ))}
            </div>
            <div className="flex items-center gap-2.5 mt-3">
              <span className="text-[0.82rem] text-text-muted whitespace-nowrap">
                Custom:
              </span>
              <input
                type="number"
                placeholder="e.g. 7.5"
                min={0.1}
                step={0.1}
                className="max-w-[140px] px-4 py-2.5 rounded-xl border-[1.5px] border-plum/12 bg-cream text-[0.9rem] text-text focus:border-pink focus:ring-2 focus:ring-pink/12 outline-none transition-all"
                onChange={(e) => {
                  const v = +e.target.value;
                  if (v > 0) setStrength(v);
                }}
              />
              <span className="text-[0.82rem] text-text-muted">mg</span>
            </div>
          </div>

          <hr className="h-px border-0 bg-cream my-7" />

          {/* Step 3: BAC Water */}
          <div>
            <h2 className="font-heading text-plum text-[1.05rem] flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 bg-gradient-to-br from-pink to-pink-hover text-white rounded-full text-[0.75rem] font-bold flex items-center justify-center shrink-0 shadow-[0_3px_10px_rgba(255,107,138,0.4)]">
                3
              </span>
              How much BAC Water did you add?
            </h2>
            <div className="flex flex-wrap gap-2">
              {WATER_PRESETS.map((w) => (
                <PillButton
                  key={w}
                  active={water === w}
                  onClick={() => setWater(w)}
                >
                  {w} mL
                </PillButton>
              ))}
            </div>
            <div className="flex items-center gap-2.5 mt-3">
              <span className="text-[0.82rem] text-text-muted whitespace-nowrap">
                Custom:
              </span>
              <input
                type="number"
                placeholder="e.g. 2.5"
                min={0.1}
                step={0.1}
                className="max-w-[140px] px-4 py-2.5 rounded-xl border-[1.5px] border-plum/12 bg-cream text-[0.9rem] text-text focus:border-pink focus:ring-2 focus:ring-pink/12 outline-none transition-all"
                onChange={(e) => {
                  const v = +e.target.value;
                  if (v > 0) setWater(v);
                }}
              />
              <span className="text-[0.82rem] text-text-muted">mL</span>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-gradient-to-br from-plum to-[#5A2857] rounded-3xl p-8 mt-8 relative overflow-hidden">
            <div className="absolute -top-[60px] -right-[60px] w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(255,107,138,0.2)_0%,transparent_70%)]" />
            <p className="text-[0.72rem] uppercase tracking-[2px] text-white/50 font-semibold mb-5">
              Your Results
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
              <div className="bg-white/7 border border-white/10 rounded-2xl p-4">
                <p className="text-[0.7rem] uppercase tracking-wider text-white/45 mb-1.5">
                  Your Dose
                </p>
                <p className="font-heading text-pink-light text-[1.6rem] leading-none">
                  {doseMg}
                  <span className="text-[0.85rem] font-body font-normal opacity-70 ml-1">
                    mg
                  </span>
                </p>
                <p className="text-[0.72rem] text-white/40 mt-1">
                  {dose.toLocaleString()} mcg per injection
                </p>
              </div>
              <div className="bg-white/7 border border-white/10 rounded-2xl p-4">
                <p className="text-[0.7rem] uppercase tracking-wider text-white/45 mb-1.5">
                  Concentration
                </p>
                <p className="font-heading text-white text-[1.6rem] leading-none">
                  {concentration % 1 === 0
                    ? concentration
                    : concentration.toFixed(2)}
                  <span className="text-[0.85rem] font-body font-normal opacity-70 ml-1">
                    mg/mL
                  </span>
                </p>
                <p className="text-[0.72rem] text-white/40 mt-1">
                  Peptide per 1 mL of solution
                </p>
              </div>
              <div className="bg-white/7 border border-white/10 rounded-2xl p-4">
                <p className="text-[0.7rem] uppercase tracking-wider text-white/45 mb-1.5">
                  Draw Syringe To
                </p>
                <p className="font-heading text-pink-light text-[1.6rem] leading-none">
                  {overLimit ? (
                    <span className="text-pink text-[1rem]">
                      Over 100 units!
                    </span>
                  ) : (
                    <>
                      {drawDisplay}
                      <span className="text-[0.85rem] font-body font-normal opacity-70 ml-1">
                        units
                      </span>
                    </>
                  )}
                </p>
                <p className="text-[0.72rem] text-white/40 mt-1">
                  On a 100-unit insulin syringe
                </p>
              </div>
              <div className="bg-white/7 border border-white/10 rounded-2xl p-4">
                <p className="text-[0.7rem] uppercase tracking-wider text-white/45 mb-1.5">
                  Volume to Inject
                </p>
                <p className="font-heading text-white text-[1.6rem] leading-none">
                  {volumeToInject.toFixed(3)}
                  <span className="text-[0.85rem] font-body font-normal opacity-70 ml-1">
                    mL
                  </span>
                </p>
                <p className="text-[0.72rem] text-white/40 mt-1">
                  Actual liquid you&apos;re injecting
                </p>
              </div>
            </div>

            {/* Syringe Visual */}
            <div className="relative z-10">
              <p className="text-[0.72rem] uppercase tracking-[1.5px] text-white/45 font-semibold mb-4">
                100-Unit Insulin Syringe
              </p>

              {/* Dose pointer */}
              <div className="relative mb-1" style={{ marginLeft: "60px", marginRight: "40px" }}>
                <div
                  className="absolute -top-1 text-[0.65rem] text-white font-bold whitespace-nowrap bg-pink px-2.5 py-1 rounded-full shadow-[0_2px_10px_rgba(255,107,138,0.6)] transition-all duration-500 z-10"
                  style={{
                    left: `${Math.min(Math.max(fillPct, 2), 98)}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {drawDisplay} units
                  <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-pink rotate-45 -translate-x-1/2" />
                </div>
              </div>

              {/* Syringe body */}
              <div className="flex items-center mt-5">
                {/* Needle */}
                <div className="flex items-center shrink-0">
                  {/* Needle tip (triangle) */}
                  <div className="w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-r-[10px] border-r-white/40" />
                  {/* Needle shaft */}
                  <div className="w-[28px] h-[2px] bg-gradient-to-r from-white/30 to-white/50" />
                  {/* Needle hub */}
                  <div className="w-[22px] h-[20px] bg-gradient-to-b from-white/25 to-white/15 rounded-[2px] border border-white/20 flex items-center justify-center">
                    <div className="w-[2px] h-full bg-white/10" />
                  </div>
                </div>

                {/* Barrel */}
                <div className="flex-1 h-[52px] relative">
                  {/* Barrel body */}
                  <div className="absolute inset-0 bg-white/8 border-y-[2px] border-white/20 overflow-hidden">
                    {/* Liquid fill */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-pink/30 via-pink/50 to-pink/70 transition-all duration-500"
                      style={{ width: `${fillPct}%` }}
                    >
                      {/* Liquid surface shine */}
                      <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-pink shadow-[0_0_8px_rgba(255,107,138,0.8)]" />
                      {/* Liquid highlight */}
                      <div className="absolute inset-x-0 top-[3px] h-[6px] bg-gradient-to-b from-white/15 to-transparent" />
                    </div>

                    {/* Barrel highlight (glass effect) */}
                    <div className="absolute inset-x-0 top-0 h-[8px] bg-gradient-to-b from-white/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-[4px] bg-gradient-to-t from-white/5 to-transparent" />

                    {/* Tick marks */}
                    {ticksBuilt &&
                      [10, 20, 30, 40, 50, 60, 70, 80, 90].map((t) => (
                        <div key={t} className="absolute top-0 bottom-0 flex flex-col justify-between" style={{ left: `${t}%` }}>
                          <div className={`w-px ${t === 50 ? "h-[14px] bg-white/35" : t % 20 === 0 ? "h-[10px] bg-white/25" : "h-[7px] bg-white/15"}`} />
                          <div className={`w-px ${t === 50 ? "h-[14px] bg-white/35" : t % 20 === 0 ? "h-[10px] bg-white/25" : "h-[7px] bg-white/15"}`} />
                        </div>
                      ))}
                  </div>

                  {/* Barrel flanges (finger grips) at the end */}
                  <div className="absolute -right-[2px] top-[-6px] bottom-[-6px] w-[4px] bg-white/20 rounded-r" />
                </div>

                {/* Plunger */}
                <div className="flex items-center shrink-0">
                  {/* Plunger stopper */}
                  <div className="w-[8px] h-[48px] bg-gradient-to-r from-white/25 to-white/15 border border-white/20 rounded-[1px]" />
                  {/* Plunger rod */}
                  <div className="w-[24px] h-[6px] bg-gradient-to-b from-white/20 to-white/10 border-y border-white/15" />
                  {/* Plunger thumb rest */}
                  <div className="w-[6px] h-[22px] bg-gradient-to-r from-white/20 to-white/10 border border-white/15 rounded-r-sm" />
                </div>
              </div>

              {/* Scale labels */}
              <div className="flex justify-between mt-2" style={{ marginLeft: "60px", marginRight: "40px" }}>
                {["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"].map((l) => (
                  <span key={l} className="text-[0.6rem] text-white/30 w-0 text-center">
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div
              className={`rounded-[14px] p-4 mt-4 relative z-10 text-[0.84rem] leading-relaxed ${
                overLimit
                  ? "bg-pink/10 border border-pink/30 text-pink-light"
                  : "bg-white/6 border border-white/10 text-white/75"
              }`}
            >
              {overLimit ? (
                <p>
                  <strong className="text-pink-light">Warning:</strong> Your
                  dose exceeds what a single 100-unit insulin syringe can hold.
                  Consider adding more BAC water to reduce the concentration, or
                  splitting into two injections.
                </p>
              ) : (
                <p>
                  Draw your syringe to the{" "}
                  <strong className="text-pink-light">
                    {drawDisplay}-unit mark
                  </strong>{" "}
                  for a dose of{" "}
                  <strong className="text-pink-light">
                    {doseMg} mg ({dose.toLocaleString()} mcg)
                  </strong>
                  . Your solution has a concentration of{" "}
                  <strong className="text-pink-light">
                    {concentration % 1 === 0
                      ? concentration
                      : concentration.toFixed(2)}{" "}
                    mg per mL
                  </strong>
                  . At this dose, your{" "}
                  <strong className="text-pink-light">
                    {strength} mg vial
                  </strong>{" "}
                  contains approximately{" "}
                  <strong className="text-pink-light">
                    {shotsPerVial} dose{shotsPerVial !== 1 ? "s" : ""}
                  </strong>
                  .
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-7">
            <button
              onClick={handleReset}
              className="flex-1 py-3 rounded-full border-[1.5px] border-plum/14 text-text-muted text-[0.88rem] font-medium cursor-pointer hover:border-pink hover:text-pink transition-all"
            >
              Reset
            </button>
            <button
              onClick={handleCopy}
              className="flex-[2] py-3 rounded-full bg-gradient-to-br from-pink to-pink-hover text-white text-[0.88rem] font-semibold cursor-pointer shadow-[0_4px_18px_rgba(255,107,138,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,107,138,0.45)] active:translate-y-0 transition-all"
            >
              Copy Results to Clipboard
            </button>
          </div>
        </div>

        {/* How to Read Your Syringe */}
        <div className="bg-white rounded-[28px] p-10 shadow-md border border-plum/5 mt-6">
          <h2 className="font-heading text-plum text-[1.15rem] flex items-center gap-2.5 mb-5">
            <span className="text-[1.4rem]">&#x1f52c;</span> How to Read Your
            Syringe
          </h2>
          <p className="text-[0.88rem] text-text-muted leading-relaxed mb-5">
            Most people use a{" "}
            <strong className="text-text">1 mL insulin syringe</strong> (also
            called a 100-unit syringe). Each small line on the syringe = 1 unit
            = 0.01 mL.
          </p>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Syringe Units", "Volume (mL)", "What it means"].map((h) => (
                  <th
                    key={h}
                    className="text-[0.7rem] uppercase tracking-wider text-text-muted font-semibold p-2 text-left border-b border-cream"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["10 units", "0.10 mL", "2nd big line on a 100-unit syringe"],
                ["20 units", "0.20 mL", "Common starting dose level"],
                ["50 units", "0.50 mL", "Halfway mark on the syringe"],
                ["100 units", "1.00 mL", "Full syringe"],
              ].map(([u, v, m]) => (
                <tr key={u}>
                  <td className="text-[0.82rem] p-2 border-b border-cream font-semibold text-pink">
                    {u}
                  </td>
                  <td className="text-[0.82rem] p-2 border-b border-cream text-text">
                    {v}
                  </td>
                  <td className="text-[0.78rem] p-2 border-b border-cream text-text-muted">
                    {m}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-pink-pale rounded-xl px-4 py-3.5 mt-4 border border-pink-light text-[0.82rem] text-plum leading-relaxed">
            <strong>Tip:</strong> Always double-check your math before drawing.
            When in doubt, go smaller — you can always take a second injection,
            but you can&apos;t undo an overdose.
          </div>
        </div>
      </div>

      {/* SIDEBAR */}
      <aside className="flex flex-col gap-5 lg:sticky lg:top-[88px]">
        {/* Formula */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-plum/5">
          <h3 className="font-heading text-plum flex items-center gap-2 mb-3.5">
            <span className="text-[1.2rem]">&#x2697;&#xfe0f;</span> The Formula
          </h3>
          <p className="text-[0.82rem] text-text-muted leading-relaxed mb-3.5">
            This is how the calculator works under the hood — simple math, done
            for you.
          </p>
          <div className="bg-plum rounded-2xl p-5 text-center">
            <p className="font-heading italic text-white/85 text-[0.95rem] leading-loose">
              <span className="text-pink-light font-bold not-italic">
                Conc
              </span>{" "}
              ={" "}
              <span className="text-pink-light font-bold not-italic">
                Vial mg
              </span>{" "}
              &times; 1000 &divide;{" "}
              <span className="text-pink-light font-bold not-italic">
                Water mL
              </span>
              <br />
              <br />
              <span className="text-pink-light font-bold not-italic">
                Draw
              </span>{" "}
              ={" "}
              <span className="text-pink-light font-bold not-italic">
                Dose mcg
              </span>{" "}
              &divide;{" "}
              <span className="text-pink-light font-bold not-italic">
                Conc
              </span>{" "}
              &times; 100
            </p>
          </div>
          <div className="bg-cream rounded-[10px] p-3 mt-3 text-[0.78rem] text-text-muted leading-relaxed">
            <strong className="text-plum">Example:</strong> 5mg vial + 1mL
            water = 5000 mcg/mL. For a 250 mcg dose: 250 &divide; 5000 &times;
            100 ={" "}
            <strong className="text-pink">5 units</strong>
          </div>
        </div>

        {/* Starting Doses — Searchable */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-plum/5">
          <h3 className="font-heading text-plum flex items-center gap-2 mb-3.5">
            <span className="text-[1.2rem]">&#x1f48a;</span> Starting Doses
          </h3>
          <p className="text-[0.8rem] text-text-muted leading-relaxed mb-3">
            Search any peptide to see its starting dose and auto-fill the calculator:
          </p>

          {/* Search input */}
          <div className="relative mb-3">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/40 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <input
              type="text"
              value={peptideSearch}
              onChange={(e) => setPeptideSearch(e.target.value)}
              placeholder="Search peptides..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cream border border-plum/8 text-[0.85rem] text-text placeholder:text-text-muted/40 focus:border-pink focus:ring-2 focus:ring-pink/15 outline-none transition-all"
            />
            {peptideSearch && (
              <button
                onClick={() => setPeptideSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-pink transition-colors text-sm cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          {/* Results count when searching */}
          {peptideSearch && (
            <p className="text-[0.72rem] text-text-muted mb-2">
              {filteredPeptides.length} peptide{filteredPeptides.length !== 1 ? "s" : ""} found
            </p>
          )}

          {/* Peptide list */}
          <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto">
            {filteredPeptides.map((p) => {
              const startingCard = p.dosing_cards?.find(
                (c) => c.level?.toLowerCase().includes("start") || c.level?.toLowerCase().includes("recommended")
              ) || p.dosing_cards?.[0];

              const doseStr = startingCard
                ? `${startingCard.amount} ${startingCard.unit}`
                : "See guide";

              return (
                <button
                  key={p.slug}
                  onClick={() => {
                    // Try to parse dose from the starting card
                    if (startingCard) {
                      const amountStr = startingCard.amount.replace(/[^0-9.]/g, "");
                      const amountNum = parseFloat(amountStr);
                      if (amountNum > 0) {
                        // Detect if amount is in mg or mcg based on unit text
                        const unitLower = startingCard.unit.toLowerCase();
                        if (unitLower.includes("mcg") || unitLower.includes("micro")) {
                          setDose(Math.round(amountNum));
                        } else if (unitLower.includes("mg") || unitLower.includes("milli")) {
                          setDose(Math.round(amountNum * 1000));
                        } else {
                          // Default: assume mcg if small number, mg if larger context
                          setDose(amountNum >= 50 ? Math.round(amountNum) : Math.round(amountNum * 1000));
                        }
                      }
                    }
                    trackCalculatorQuickfill(p.name, dose / 1000);
                    setPeptideSearch("");
                  }}
                  className="group flex justify-between items-start px-3 py-2.5 rounded-xl bg-cream/60 border border-transparent hover:bg-pink-pale hover:border-pink-light transition-all cursor-pointer text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-[0.85rem] font-semibold text-plum truncate">
                        {p.name}
                      </p>
                      {p.difficulty && (
                        <span className="text-[0.55rem] font-semibold text-sage bg-sage-pale px-1.5 py-0.5 rounded-full shrink-0">
                          {p.difficulty}
                        </span>
                      )}
                    </div>
                    <p className="text-[0.75rem] text-text-muted truncate">
                      {doseStr}
                    </p>
                    {p.administration_route && (
                      <p className="text-[0.65rem] text-text-muted/60 mt-0.5">
                        {p.administration_route}
                      </p>
                    )}
                  </div>
                  <span className="text-pink text-[0.75rem] opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0 ml-2">
                    Apply &rarr;
                  </span>
                </button>
              );
            })}

            {filteredPeptides.length === 0 && (
              <p className="text-[0.8rem] text-text-muted text-center py-4">
                No peptides match &ldquo;{peptideSearch}&rdquo;
              </p>
            )}
          </div>

          {!peptideSearch && peptides.length > 8 && (
            <p className="text-[0.7rem] text-text-muted/50 text-center mt-2">
              Showing 8 of {peptides.length} &mdash; search to find more
            </p>
          )}
        </div>

        {/* BAC Water Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-plum/5">
          <h3 className="font-heading text-plum flex items-center gap-2 mb-3.5">
            <span className="text-[1.2rem]">&#x1f4e6;</span> What is BAC Water?
          </h3>
          <p className="text-[0.83rem] text-text-muted leading-relaxed">
            <strong className="text-text">
              Bacteriostatic Water (BAC Water)
            </strong>{" "}
            is sterile water with 0.9% benzyl alcohol added. The benzyl alcohol
            prevents bacteria from growing, which makes your reconstituted
            peptide last up to{" "}
            <strong className="text-text">4-6 weeks in the fridge</strong>.
          </p>
          <hr className="h-px border-0 bg-cream my-3.5" />
          <p className="text-[0.83rem] text-text-muted leading-relaxed">
            <strong className="text-text">Sterile Water</strong> (without benzyl
            alcohol) can also be used, but your peptide will only last{" "}
            <strong className="text-text">24-48 hours</strong> once mixed.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-gold-pale border border-[rgba(240,194,116,0.5)] rounded-[14px] px-4 py-4 text-[0.8rem] text-[#7A5C10] leading-relaxed">
          <strong className="text-[#5A3C00]">
            Educational use only.
          </strong>{" "}
          This calculator is a math tool to assist with dosing calculations. It
          is not medical advice. Always consult a licensed healthcare
          professional. Verify all calculations independently before injecting.
        </div>
      </aside>

      {/* Toast */}
      <div
        className={`fixed bottom-[30px] left-1/2 bg-plum text-white px-7 py-3 rounded-full text-[0.88rem] font-medium shadow-md z-[999] pointer-events-none transition-transform duration-300 ${
          toast
            ? "-translate-x-1/2 translate-y-0"
            : "-translate-x-1/2 translate-y-20"
        }`}
      >
        Results copied to clipboard!
      </div>
    </div>
  );
}
