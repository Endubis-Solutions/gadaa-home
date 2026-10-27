"use client";
import { useEffect } from "react";
import { useGadaa } from "@/lib/store";

const tiers = [
  { n: 1, name: "Dabballee", label: "Learner", req: 0, color: "bg-white/10" },
  { n: 2, name: "Follee", label: "Initiate", req: 50, color: "bg-amber-400" },
  { n: 3, name: "Qondala", label: "Warrior / Builder", req: 150, color: "bg-orange-500" },
  { n: 4, name: "Luba", label: "Ruling Class", req: 400, color: "bg-gadaa-ochre" },
  { n: 5, name: "Hayyu", label: "Elder / Advisory", req: 800, color: "bg-emerald-500" },
];

export default function LubaSection(){
  const { tier, reputation, lubaCycle, lubaProgress, tickLuba, ethicalAction } = useGadaa();
  useEffect(()=>{ const id=setInterval(tickLuba, 800); return ()=>clearInterval(id); }, [tickLuba]);
  return (
    <section id="luba" className="py-14 border-t border-white/10">
      <div className="text-[11px] tracking-[0.25em] text-gadaa-ochre">LUBA • GENERATIONAL ROTATION</div>
      <h2 className="text-4xl font-bold mt-1">You don't buy power. You earn it.</h2>
      <p className="text-sm text-white/60 mt-2 max-w-2xl">Reputation Tokens (RT) are non-transferable social capital. Progress through the five Gadaa grades by ethical participation. The 8-year Luba Clock rotates power automatically — encoded in the Core Governance Smart Contract.</p>
      <div className="mt-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center justify-between">
            <div className="text-xs tracking-widest text-white/50">YOUR TIER</div>
            <div className="text-xs font-mono text-white/50">{reputation} RT</div>
          </div>
          <div className="mt-4 flex gap-2">
            {tiers.map(t=>(
              <div key={t.n} className={`flex-1 rounded-2xl border p-3 text-center ${tier>=t.n? "border-gadaa-ochre/40 bg-gadaa-ochre/10":"border-white/10 bg-black/30 opacity-60"}`}>
                <div className={`mx-auto w-10 h-10 rounded-full ${t.color} flex items-center justify-center font-bold text-sm ${t.n<=2? "text-black":"text-white"}`}>{t.n}</div>
                <div className="mt-2 text-[11px] font-bold tracking-widest">{t.name}</div>
                <div className="text-[11px] text-white/50">{t.label}</div>
                <div className="text-[10px] font-mono mt-1 text-white/40">{t.req} RT</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <button onClick={()=>ethicalAction(3)} className="px-4 py-2.5 rounded-full bg-emerald-500 text-black text-xs font-bold">Simulate Ethical Review (+12 RT, +6 health)</button>
            <span className="text-xs text-white/40 self-center">Demonstrate: ethical actions compound. Selfish ones slash.</span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F2318] to-black p-6">
          <div className="text-xs tracking-widest text-white/50">THE LUBA CLOCK • 8-YEAR TERM</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-5xl font-serif font-bold">{lubaCycle}</span><span className="text-white/50">/ 8</span><span className="ml-2 text-xs px-2 py-1 rounded-full bg-gadaa-ochre text-black font-bold">ROTATING</span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-gradient-to-r from-gadaa-ochre to-emerald-500 transition-all" style={{width: `${lubaProgress}%`}} /></div>
          <div className="mt-2 text-xs font-mono text-white/50">Cycle progress {Math.round(lubaProgress)}% • Auto-rotates • Outgoing council → Legacy Advisory Pool (time-locked vesting)</div>
          <div className="mt-4 rounded-xl bg-black/40 border border-white/10 p-3 text-xs leading-relaxed text-white/70">
            <strong className="text-white">Conditional vesting:</strong> Elders only vest Legacy Tokens if they advise the new council. No advice = vesting halts. This encodes Gadaa's peaceful transfer & institutional memory.
          </div>
        </div>
      </div>
    </section>
  );
}
