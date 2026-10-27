"use client";
import { useState } from "react";
import { useGadaa } from "@/lib/store";

export default function Seera() {
  const proposals = useGadaa(s => s.proposals);
  const add = useGadaa(s => s.addProposal);
  const voteQ = useGadaa(s => s.voteQuadratic);
  const [title, setTitle] = useState("");
  const [article, setArticle] = useState("");
  return (
    <section id="seera" className="py-14 border-t border-white/10">
      <div className="text-[11px] tracking-[0.25em] text-gadaa-ochre">SEERA • THE LAW</div>
      <h2 className="text-4xl font-bold mt-1">A living constitution</h2>
      <p className="text-sm text-white/60 mt-2 max-w-2xl">Quadratic Voting reveals intensity, not just preference. Buying 2 votes costs 4 RT, 3 votes costs 9. Siqqee-flagged articles require 90% Supermajority. This is formal on-chain logic, simulated live.</p>
      <div className="mt-6 grid lg:grid-cols-[360px_1fr] gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="font-semibold">Propose Amendment</h3>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title e.g. Seera 6.1: Treasury" className="mt-3 w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm outline-none" />
          <textarea value={article} onChange={e=>setArticle(e.target.value)} placeholder="Article body" rows={4} className="mt-3 w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm outline-none" />
          <button onClick={()=>{ if(!title) return; add({title, article}); setTitle(""); setArticle("");}} className="mt-3 w-full py-3 rounded-xl bg-white text-black font-bold text-sm">Submit to Caffee</button>
        </div>
        <div className="space-y-3">
          {proposals.map(p=>(
            <div key={p.id} className={`rounded-2xl border p-5 ${p.siqqeeFlagged? "border-fuchsia-500/30 bg-fuchsia-500/[0.06]":"border-white/10 bg-white/[0.04]"}`}>
              <div className="flex items-center gap-2 text-[11px]"><span className="px-2 py-1 rounded-full bg-white/10 font-mono">{p.id}</span><span className={`px-2 py-1 rounded-full font-bold ${p.threshold===90?"bg-fuchsia-600 text-white":"bg-gadaa-ochre text-black"}`}>{p.threshold}% THRESHOLD</span>{p.siqqeeFlagged && <span className="px-2 py-1 rounded-full bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/20">SIQQEE FLAGGED</span>}</div>
              <h4 className="font-bold mt-2">{p.title}</h4>
              <p className="text-sm text-white/70 mt-1">{p.article}</p>
              <div className="mt-3 flex items-center gap-2 text-xs font-mono"><span className="text-white/60">Votes {p.votes}</span><span className="text-white/40">• Cost {p.cost} RT</span></div>
              <div className="mt-3 flex gap-2">
                <button onClick={()=>voteQ(p.id,1)} className="px-3 py-2 rounded-full bg-white text-black text-xs font-bold">+1 vote (1 RT)</button>
                <button onClick={()=>voteQ(p.id,2)} className="px-3 py-2 rounded-full bg-gadaa-ochre text-black text-xs font-bold">+2 votes (4 RT)</button>
                <button onClick={()=>voteQ(p.id,3)} className="px-3 py-2 rounded-full border border-white/20 text-xs">+3 votes (9 RT)</button>
              </div>
              <p className="text-[11px] text-white/40 mt-2">Quadratic cost prevents whale capture — the Gadaa principle of consensual equity.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
