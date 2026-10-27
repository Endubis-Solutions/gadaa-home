"use client";
export default function Siqqee(){
  return (
    <section id="siqqee" className="py-14 border-t border-white/10">
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
        <div className="rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-900/20 via-black to-black p-6">
          <div className="text-[11px] tracking-[0.25em] text-fuchsia-300">SIQQEE PROTOCOL • BALANCE COUNCIL</div>
          <h2 className="text-3xl font-bold mt-1">Where consultation becomes power</h2>
          <p className="text-sm text-white/70 mt-3">In Gadaa, the <em>Haadha Siiqqee</em> hold the ritual stick — a symbol of women's inviolable rights. Our Siqqee Sub-DAO translates that into code: a delegated veto key that raises any flagged proposal to 90% Supermajority.</p>
          <ul className="mt-4 space-y-2 text-sm text-white/70 list-disc list-inside">
            <li>Reviews every Seera & resource allocation through an equity lens</li>
            <li>Can halt a proposal until near-unanimous consent is proven</li>
            <li>Visualized as the protective root system of the Odaa</li>
          </ul>
          <div className="mt-5 rounded-xl bg-black/50 border border-fuchsia-500/20 p-4">
            <div className="text-xs font-mono text-fuchsia-200">Try it: In the Caffee above, click "Invoke Siqqee → 90%" on any dispute.</div>
            <div className="text-xs text-white/50 mt-1">Watch the threshold jump. The Odaa's roots glow. Consensus must now be broader — exactly as Gadaa intends.</div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h3 className="font-semibold">Commons Treasury • Resource Protocol</h3>
          <p className="text-xs text-white/50">Gadaa regulates grazing land & water communally. Here the treasury does the same.</p>
          <div className="mt-4 space-y-3">
            {[
              { name: "Communal Well Reserve", amount: "42,800 RT", share: 68 },
              { name: "Oral History Digitization Fund", amount: "18,200 RT", share: 52 },
              { name: "Siqqee Rights Endowment", amount: "27,500 RT", share: 44 },
            ].map(r=>(
              <div key={r.name} className="rounded-xl bg-black/40 border border-white/10 p-3">
                <div className="flex justify-between text-sm"><span className="font-semibold">{r.name}</span><span className="font-mono text-gadaa-ochre">{r.amount}</span></div>
                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-gadaa-ochre" style={{width: `${r.share}%`}} /></div>
                <div className="text-[11px] text-white/40 mt-1">{r.share}% allocated by Caffee Supermajority</div>
              </div>
            ))}
          </div>
          <p id="treasury" className="text-[11px] text-white/40 mt-4">All movements require Caffee ratification. No Core Council can move funds alone — polycentric checks by design.</p>
        </div>
      </div>
    </section>
  );
}
