"use client";
import { useCallback, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Hero from "@/components/hero/Hero";
import Caffee from "@/components/Caffee";
import Seera from "@/components/Seera";
import LubaSection from "@/components/LubaSection";
import Siqqee from "@/components/Siqqee";

const PAPER_KEY = "gadaa.paper";

export default function ClientShell(){
  const [paper, setPaper] = useState<"dark" | "light">("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(PAPER_KEY) === "light") setPaper("light");
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(PAPER_KEY, paper);
    } catch {}
  }, [paper, ready]);

  const togglePaper = useCallback(() => {
    setPaper((p) => (p === "light" ? "dark" : "light"));
  }, []);

  return (
    <>
      <Nav paper={paper === "light"} />
      <main className="pt-[64px]">
        <Hero paper={paper === "light"} onTogglePaper={togglePaper} />
        <div className="max-w-[1280px] mx-auto px-6">
          <Caffee />
          <Seera />
          <LubaSection />
          <Siqqee />
          <footer className="py-10 border-t border-white/10 text-xs text-white/40">
            <div className="flex flex-wrap gap-4 justify-between">
              <div>© 2026 Seera Circle • Dreaming New Worlds — Node 2 • Borena & Guji field research informs all Seera.</div>
              <div>Built with Next.js + Three.js + Zustand • Ready for Aiken / Cardano</div>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
