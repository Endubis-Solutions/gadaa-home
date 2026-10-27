"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useGadaa } from "@/lib/store";

const OdaaField = dynamic(() => import("@/components/hero/OdaaField"), { ssr: false });

export interface HeroProps {
  paper: boolean;
  onTogglePaper: () => void;
}

/**
 * Full-bleed "Odaa Field" hero.
 * The artwork owns the centre of the viewport; every piece of UI is pushed to
 * the edges and drawn with hairlines only — no cards, no radii, no shadows.
 */
export default function Hero({ paper, onTogglePaper }: HeroProps) {
  const health = useGadaa((s) => s.trustHealth);
  const ethical = useGadaa((s) => s.ethicalActions);
  const selfish = useGadaa((s) => s.selfishActions);
  const total = useGadaa((s) => s.totalDisputes);
  const resolved = useGadaa((s) => s.resolvedDisputes);
  const ethicalAct = useGadaa((s) => s.ethicalAction);
  const selfishAct = useGadaa((s) => s.selfishAction);

  const sectionRef = useRef<HTMLElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const [pulse, setPulse] = useState(0);

  /* [space] splashs the field, [p] flips the paper — only while the hero holds the view */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName)) return;
      if (window.scrollY > window.innerHeight * 0.75) return;

      if (e.code === "Space") {
        e.preventDefault();
        setPulse((p) => p + 1);
      } else if (e.key === "p" || e.key === "P") {
        onTogglePaper();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onTogglePaper]);

  /* a stale rect only ever costs one measurement, so clear it on layout changes */
  useEffect(() => {
    const clear = () => {
      rectRef.current = null;
    };
    window.addEventListener("scroll", clear, { passive: true });
    window.addEventListener("resize", clear);
    return () => {
      window.removeEventListener("scroll", clear);
      window.removeEventListener("resize", clear);
    };
  }, []);

  /* the crosshair follows the pointer without touching React state */
  const measure = useCallback(() => {
    rectRef.current = sectionRef.current?.getBoundingClientRect() ?? null;
  }, []);

  const moveCursor = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const rect = rectRef.current ?? sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    rectRef.current = rect;
    cursor.style.transform = `translate3d(${e.clientX - rect.left}px, ${e.clientY - rect.top}px, 0)`;
  }, []);

  const verdict = health < 45 ? "FRACTURED" : health < 70 ? "STRESSED" : "FLOURISHING";

  return (
    <section
      ref={sectionRef}
      data-paper={paper ? "light" : "dark"}
      className="hero relative isolate -mt-16 h-[100svh] min-h-[680px] w-full overflow-hidden bg-hero-ground text-hero-ink"
      onPointerEnter={measure}
      onPointerMove={moveCursor}
    >
      {/* layer 0 — the artwork */}
      <OdaaField health={health} paper={paper} pulse={pulse} />

      {/* legibility scrims */}
      <div aria-hidden className="hero-scrim pointer-events-none absolute inset-0 z-10" />

      {/* ── edge rails ───────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between px-5 pb-[64px] pt-[88px] md:px-10 md:pb-[84px] md:pt-[100px]">
        {/* top rail */}
        <div className="flex items-start justify-between gap-6">
          <div className="hero-rise flex items-start gap-3">
            <span className="mt-[2px] block h-9 w-px bg-hero-accent" />
            <div>
              <p className="hero-micro text-hero-dim">NODE 2 · BORENA &amp; GUJI</p>
              <p className="hero-micro mt-1.5 leading-[1.75]">
                THE GADAA CODE
                <br />
                LIVING DISTRIBUTED NETWORK
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onTogglePaper}
            aria-pressed={paper}
            aria-label={paper ? "Switch to dark ground" : "Switch to paper ground"}
            className="hero-rise pointer-events-auto group flex items-center gap-2.5 border border-hero-hair px-3 py-2 transition-colors duration-500 hover:border-hero-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hero-accent"
          >
            <span className="relative block h-3.5 w-3.5">
              <span className="absolute inset-0 rounded-full border border-hero-dim transition-transform duration-700 group-hover:rotate-180" />
              <span
                className={`absolute inset-[3.5px] rounded-full bg-hero-accent transition-transform duration-700 ${
                  paper ? "scale-100" : "scale-0"
                }`}
              />
            </span>
            <span className="hero-micro text-hero-dim">{paper ? "LIGHT" : "DARK"}</span>
          </button>
        </div>

        {/* bottom rail */}
        <div className="flex items-end justify-between gap-8">
          <div className="max-w-[560px]">
            <h1 className="hero-rise hero-rise-1 font-serif text-[clamp(32px,4.4vw,60px)] font-normal leading-[0.98] tracking-[-0.015em]">
              The Gadaa Code:
              <br />
              <span className="text-gadaa-ochre">A Living</span> Distributed Network
            </h1>

            <p className="hero-rise hero-rise-2 mt-4 max-w-[500px] text-[12.5px] leading-[1.75] text-hero-dim md:text-[13.5px]">
              An interactive Decentralized Justice Protocol (DJP) based on 500 years of Oromo{" "}
              <em>Gadaa</em> governance. It arbitrates disputes through{" "}
              <strong className="font-medium text-hero-ink">
                consensual Supermajority, cyclical rotation, and reputation over stake
              </strong>
              . Every interaction is ethical or selfish. The Odaa tree grows — or fractures — in
              real time.
            </p>

            {/* telemetry — a hairline row, not a card */}
            <div className="hero-rise hero-rise-3 mt-6 max-w-[400px]">
              <div className="h-px w-full bg-hero-hair">
                <div
                  className="h-px bg-gadaa-ochre transition-[width] duration-700 ease-out"
                  style={{ width: `${health}%` }}
                />
              </div>
              <div className="mt-2.5 flex flex-wrap items-baseline gap-x-5 gap-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="hero-micro">TRUST HEALTH</span>
                  <span className="hero-num text-hero-ink">
                    {health}
                    <span className="text-hero-faint">%</span>
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="hero-micro">DISPUTES</span>
                  <span className="hero-num text-hero-ink">
                    {resolved}/{total}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="hero-micro">ETHICAL / SELFISH</span>
                  <span className="hero-num text-hero-ink">
                    {ethical} / {selfish}
                  </span>
                </div>
              </div>
              <p className="hero-micro mt-2 text-hero-faint">CANOPY · {verdict}</p>
            </div>

            {/* the demo mechanic survives the restyle */}
            <div className="hero-rise hero-rise-3 pointer-events-auto mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <button
                type="button"
                onClick={() => ethicalAct(2)}
                className="hero-link"
                title="Adds trust health, reputation and canopy density"
              >
                <span className="mr-1.5 text-hero-accent">+</span>ETHICAL ACT
              </button>
              <span aria-hidden className="h-2.5 w-px bg-hero-hair" />
              <button
                type="button"
                onClick={() => selfishAct()}
                className="hero-link"
                title="Drains trust health and thins the canopy"
              >
                <span className="mr-1.5 text-hero-accent">−</span>SELFISH ACT
              </button>
            </div>

            <a
              href="#caffee"
              className="hero-rise hero-rise-3 pointer-events-auto mt-6 flex w-full items-center justify-between border border-hero-hair px-4 py-3 transition-colors duration-500 hover:border-hero-accent md:hidden"
            >
              <span className="hero-micro text-hero-ink">ENTER THE CAFFEE</span>
              <span className="text-[13px] text-hero-accent">↗</span>
            </a>
          </div>

          <div className="hero-rise hero-rise-4 hidden shrink-0 flex-col items-end gap-4 md:flex">
            <p className="hero-micro text-right leading-[1.75] text-hero-faint">
              12 SEATS · ONE CIRCLE
              <br />
              CONSENSUS OVER COERCION
            </p>
            <a
              href="#caffee"
              className="group pointer-events-auto flex items-center gap-10 border border-hero-hair px-5 py-4 transition-colors duration-500 hover:border-hero-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hero-accent"
            >
              <span className="hero-micro text-hero-ink">ENTER THE CAFFEE</span>
              <span className="text-[13px] text-hero-accent transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                ↗
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* transport bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <div className="mx-5 h-px bg-hero-hair md:mx-10" />
        <div className="flex h-11 items-center justify-between px-5 md:px-10">
          <p className="hero-micro">
            <span className="hidden sm:inline">DRAG TO CAST LIGHT · </span>CLICK TO SPLASH
          </p>
          <p className="hero-micro hidden md:block">[SPACE] SPLASH · [P] PAPER</p>
        </div>
      </div>

      <div ref={cursorRef} aria-hidden className="hero-cursor" />
    </section>
  );
}
