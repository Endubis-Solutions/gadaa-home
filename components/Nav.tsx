"use client";
import { useEffect, useState } from "react";
import { useGadaa } from "@/lib/store";

const LINKS = [
  { href: "#caffee", label: "CAFFEE" },
  { href: "#seera", label: "SEERA" },
  { href: "#luba", label: "LUBA" },
  { href: "#siqqee", label: "SIQQEE" },
  { href: "#treasury", label: "COMMONS" },
];

export default function Nav({ paper = false }: { paper?: boolean }){
  const health = useGadaa(s=>s.trustHealth);
  const rep = useGadaa(s=>s.reputation);
  const tier = useGadaa(s=>s.tier);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // over the hero the bar stays transparent and borrows the hero's ink
  const onPaper = paper && !scrolled;
  const dim = onPaper ? "text-black/60" : "text-white/60";
  const strong = onPaper ? "text-black" : "text-white";
  const hair = onPaper ? "border-black/20" : "border-white/20";

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
      scrolled ? "bg-black/70 backdrop-blur-xl border-b border-white/10" : "bg-transparent border-b border-transparent"
    }`}>
      <div className="max-w-[1280px] mx-auto px-6 h-[64px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 border flex items-center justify-center text-[10px] leading-none transition-colors duration-500 ${hair} ${onPaper ? "text-black/70" : "text-gadaa-ochre"}`}>◉</div>
          <div className={`leading-none text-[11px] font-medium uppercase tracking-[0.42em] transition-colors duration-500 ${strong}`}>Gadaa DJP</div>
        </div>

        <div className={`hidden md:flex items-center gap-7 text-[9px] font-medium uppercase tracking-[0.3em] transition-colors duration-500 ${dim}`}>
          {LINKS.map(l => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-gadaa-ochre">{l.label}</a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end leading-none">
            <span className={`text-[8px] uppercase tracking-[0.3em] transition-colors duration-500 ${dim}`}>Trust Health</span>
            <span className={`mt-1 text-[11px] font-mono tabular-nums ${health<45?"text-red-400": health<70?"text-amber-300":"text-emerald-300"}`}>{health}%</span>
          </div>
          <div className={`w-20 md:w-24 h-[2px] transition-colors duration-500 ${onPaper ? "bg-black/15" : "bg-white/15"}`}>
            <div className="h-full bg-gadaa-ochre transition-all duration-700" style={{width: `${health}%`}} />
          </div>
          <div className={`px-2.5 py-1.5 border text-[9px] font-medium uppercase tracking-[0.24em] tabular-nums transition-colors duration-500 ${hair} ${onPaper ? "text-black/70" : "text-white/80"}`}>
            T{tier} · {rep} RT
          </div>
        </div>
      </div>
    </nav>
  )
}

