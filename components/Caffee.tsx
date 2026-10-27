"use client";
import { useState } from "react";
import { useGadaa, DisputeCategory } from "@/lib/store";

export default function Caffee() {
  const disputes = useGadaa((s) => s.disputes);
  const createDispute = useGadaa((s) => s.createDispute);
  const vote = useGadaa((s) => s.vote);
  const triggerSiqqee = useGadaa((s) => s.triggerSiqqee);
  const [form, setForm] = useState({ title: "", claim: "", category: "Resource" as DisputeCategory, evidence: "", pa: "", pb: "" });
  return (
    <section id="caffee" className="py-14 border-t border-white/10">
      <div className="mb-6">
        <div className="text-[11px] tracking-[0.25em] text-gadaa-ochre">DIGITAL CAFFEE • ASSEMBLY</div>
        <h2 className="text-4xl font-bold mt-1">Where disputes become law</h2>
        <p className="text-sm text-white/60 mt-2 max-w-2xl">Create a dispute, deliberate, and reach Supermajority (75% — 90% if Siqqee veto). Ethical votes heal the Odaa; selfish spam fractures it.</p>
      </div>
      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
          <h3 className="font-semibold">Create Dispute</h3>
          <p className="text-xs text-white/50">Anyone can seed a conflict. Evidence is required.</p>
          <div className="mt-4 space-y-3">
            <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm outline-none focus:border-gadaa-ochre" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as DisputeCategory })} className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm"><option>Resource</option><option>Economic</option><option>Social</option><option>Rights</option></select>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Party A" value={form.pa} onChange={e => setForm({ ...form, pa: e.target.value })} className="px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm outline-none" />
              <input placeholder="Party B" value={form.pb} onChange={e => setForm({ ...form, pb: e.target.value })} className="px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm outline-none" />
            </div>
            <textarea placeholder="Claim" value={form.claim} onChange={e => setForm({ ...form, claim: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm outline-none" />
            <textarea placeholder="Evidence" value={form.evidence} onChange={e => setForm({ ...form, evidence: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm outline-none" />
            <button onClick={() => { if (!form.title || !form.claim) return; createDispute({ title: form.title, claim: form.claim, category: form.category, evidence: form.evidence || "No evidence — will be challenged.", parties: { a: form.pa || "Anonymous A", b: form.pb || "Anonymous B" } }); setForm({ title: "", claim: "", category: "Resource", evidence: "", pa: "", pb: "" }); }} className="w-full py-3 rounded-xl bg-gadaa-ochre text-black font-semibold text-sm hover:bg-[#E9A24A] transition">Plant Dispute Seed</button>
            <p className="text-[11px] text-white/40">Live demo. Your dispute appears instantly and can be voted on.</p>
          </div>
        </div>
        <div className="space-y-4">
          {disputes.map((d) => {
            const total = d.votesFor + d.votesAgainst;
            const pctFor = total ? Math.round((d.votesFor / total) * 100) : 0;
            const isResolved = d.status === "resolved";
            const isGridlock = d.status === "gridlock";
            return (
              <div key={d.id} className={`rounded-2xl border p-5 backdrop-blur ${isResolved ? "border-emerald-500/30 bg-emerald-500/[0.06]" : isGridlock ? "border-red-500/30 bg-red-500/[0.06]" : "border-white/10 bg-white/[0.04]"}`}>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10 font-mono">{d.id}</span>
                  <span className="px-2 py-1 rounded-full bg-gadaa-ochre text-black font-bold">{d.category}</span>
                  <span className={`px-2 py-1 rounded-full border ${d.siqqeeVeto ? "bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-200" : "bg-white/5 border-white/10 text-white/60"}`}>{d.siqqeeVeto ? "SIQQEE VETO — 90%" : `Threshold ${d.requiredThreshold}%`}</span>
                  <span className={`ml-auto px-2 py-1 rounded-full text-xs font-bold ${isResolved ? "bg-emerald-500 text-black" : isGridlock ? "bg-red-500 text-white" : "bg-amber-400 text-black"}`}>{d.status.toUpperCase()}</span>
                </div>
                <h3 className="text-lg font-serif font-bold mt-3">{d.title}</h3>
                <p className="text-sm text-white/80 mt-1">{d.claim}</p>
                <div className="mt-3 grid md:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-black/40 border border-white/10 p-3"><div className="text-white/50 tracking-widest text-[10px]">PARTIES</div><div className="mt-1"><span className="text-gadaa-ochre">A</span> {d.parties.a}</div><div><span className="text-white/60">B</span> {d.parties.b}</div></div>
                  <div className="rounded-xl bg-black/40 border border-white/10 p-3"><div className="text-white/50 tracking-widest text-[10px]">EVIDENCE</div><div className="mt-1 text-white/80 line-clamp-3">{d.evidence}</div></div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-mono text-white/60"><span>For {d.votesFor} • {pctFor}%</span><span>Against {d.votesAgainst} • {100 - pctFor}%</span></div>
                  <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden flex"><div className="bg-emerald-500 transition-all" style={{ width: `${pctFor}%` }} /><div className="bg-white/30" style={{ width: `${100 - pctFor}%` }} /></div>
                  <div className="mt-1 text-[11px] text-white/50 font-mono">Need {d.requiredThreshold}% • Votes: {total}</div>
                  {isGridlock && <div className="mt-2 text-xs text-red-300">Gridlock — no consensus after 11 votes.</div>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button disabled={isResolved} onClick={() => vote(d.id, "for", false)} className="px-4 py-2 rounded-full bg-emerald-500 text-black text-xs font-bold disabled:opacity-40 hover:bg-emerald-400 transition">Ethical For</button>
                  <button disabled={isResolved} onClick={() => vote(d.id, "against", false)} className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold disabled:opacity-40">Ethical Against</button>
                  <button disabled={isResolved} onClick={() => vote(d.id, "for", true)} className="px-4 py-2 rounded-full border border-red-500/30 text-red-300 text-xs hover:bg-red-500/10 disabled:opacity-40">Selfish Random (+fracture)</button>
                  {!d.siqqeeVeto && !isResolved && <button onClick={() => triggerSiqqee(d.id)} className="ml-auto px-4 py-2 rounded-full bg-fuchsia-600 text-white text-xs font-bold hover:bg-fuchsia-500">Invoke Siqqee → 90%</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
