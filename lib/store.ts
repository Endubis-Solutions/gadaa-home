import { create } from "zustand";

export type DisputeStatus = "open" | "deliberation" | "resolved" | "gridlock";
export type DisputeCategory = "Resource" | "Economic" | "Social" | "Rights";
export type UserTier = 1 | 2 | 3 | 4 | 5;

export interface Dispute {
  id: string; title: string; claim: string; category: DisputeCategory; evidence: string;
  parties: { a: string; b: string }; status: DisputeStatus;
  votesFor: number; votesAgainst: number; requiredThreshold: number; siqqeeVeto: boolean; createdAt: number;
}

export interface SeeraProposal {
  id: string; title: string; article: string; votes: number; cost: number; siqqeeFlagged: boolean; threshold: number;
}

interface GadaaState {
  trustHealth: number; ethicalActions: number; selfishActions: number;
  totalDisputes: number; resolvedDisputes: number; reputation: number; tier: UserTier;
  lubaCycle: number; lubaProgress: number; disputes: Dispute[]; proposals: SeeraProposal[];
  createDispute: (d: Omit<Dispute, "id" | "status" | "votesFor" | "votesAgainst" | "requiredThreshold" | "siqqeeVeto" | "createdAt">) => void;
  vote: (id: string, side: "for" | "against", isSelfish: boolean) => void;
  triggerSiqqee: (id: string) => void; selfishAction: () => void; ethicalAction: (a?: number) => void;
  tickLuba: () => void; addProposal: (p: Pick<SeeraProposal, "title" | "article">) => void;
  voteQuadratic: (id: string, votes: number) => void;
}

const tierForRep = (rep: number): UserTier => {
  if (rep >= 800) return 5;
  if (rep >= 400) return 4;
  if (rep >= 150) return 3;
  if (rep >= 50) return 2;
  return 1;
};

export const useGadaa = create<GadaaState>((set) => ({
  trustHealth: 64, ethicalActions: 127, selfishActions: 44, totalDisputes: 9, resolvedDisputes: 6,
  reputation: 85, tier: 2, lubaCycle: 3, lubaProgress: 38,
  disputes: [
    { id: "ODAA-001", title: "Grazing Rights: Borena Well Access", claim: "Party A alleges Party B diverted communal well water to private plot, violating Seera 4.2", category: "Resource", evidence: "Satellite imagery shows new trench (Jan 2026). Elders testify well is communal per 2018 Caffee ruling. Party B claims drought emergency.", parties: { a: "Borena Pastoral Collective", b: "Guji Agro Coop" }, status: "deliberation", votesFor: 8, votesAgainst: 3, requiredThreshold: 75, siqqeeVeto: false, createdAt: Date.now() - 86400000 },
    { id: "ODAA-002", title: "Digital Labor Payment Withheld", claim: "Archivist completed 40h oral history digitization; client claims quality below threshold", category: "Economic", evidence: "WAV files + 12-page transcript delivered. Client refused assembly. Comparable work accepted in case #004.", parties: { a: "H. Bekele (archivist)", b: "Addis Media Lab" }, status: "open", votesFor: 2, votesAgainst: 1, requiredThreshold: 75, siqqeeVeto: false, createdAt: Date.now() - 3600000*5 },
    { id: "ODAA-003", title: "Siqqee Review: Automated Compensation", claim: "Proposed Seera encodes compensation without Siqqee consultation", category: "Rights", evidence: "Proposal #S-07 flagged for equity review. Requires 90% threshold if veto stands.", parties: { a: "Core Council", b: "Siqqee Council" }, status: "open", votesFor: 5, votesAgainst: 7, requiredThreshold: 90, siqqeeVeto: true, createdAt: Date.now() - 3600000*12 },
  ],
  proposals: [
    { id: "S-08", title: "Amend Seera 3.1: Quadratic Cost Curve", article: "Reduce QV coefficient 1.0 -> 0.85 for Tier 1-2.", votes: 34, cost: 122, siqqeeFlagged: false, threshold: 75 },
    { id: "S-07", title: "Seera 5.4: Automated Compensation", article: "Encode bride price mediation as smart contract. SIQQEE FLAGGED.", votes: 12, cost: 48, siqqeeFlagged: true, threshold: 90 },
  ],
  createDispute: (d) => set((s) => ({ disputes: [{ id: `ODAA-${String(s.totalDisputes+1).padStart(3,"0")}`, status: "open" as const, votesFor: 0, votesAgainst: 0, requiredThreshold: 75, siqqeeVeto: false, createdAt: Date.now(), ...d }, ...s.disputes], totalDisputes: s.totalDisputes+1, trustHealth: Math.max(0,s.trustHealth-2) })),
  vote: (id, side, isSelfish) => set((s) => {
    const disputes = s.disputes.map(dis => {
      if (dis.id !== id) return dis;
      const nf = side === "for" ? dis.votesFor+1 : dis.votesFor;
      const na = side === "against" ? dis.votesAgainst+1 : dis.votesAgainst;
      const total = nf+na; const pctFor = total ? (nf/total)*100 : 0;
      let status: DisputeStatus = "deliberation";
      if (total >= 5) { if (pctFor >= dis.requiredThreshold) status="resolved"; else if ((100-pctFor) >= dis.requiredThreshold) status="resolved"; else if (total>=11) status="gridlock"; else status="deliberation"; } else status="open";
      return { ...dis, votesFor: nf, votesAgainst: na, status };
    });
    const justResolved = disputes.find(d=>d.id===id && d.status==="resolved" && s.disputes.find(o=>o.id===id)?.status!=="resolved");
    let { trustHealth, ethicalActions, selfishActions, reputation, resolvedDisputes } = s;
    if (isSelfish) { selfishActions+=1; trustHealth=Math.max(0,trustHealth-4); reputation=Math.max(0,reputation-8); }
    else { ethicalActions+=1; trustHealth=Math.min(100,trustHealth+(justResolved?7:2)); reputation+=justResolved?15:3; if(justResolved) resolvedDisputes+=1; }
    return { disputes, trustHealth, ethicalActions, selfishActions, reputation, tier: tierForRep(reputation), resolvedDisputes };
  }),
  triggerSiqqee: (id) => set(s => ({ disputes: s.disputes.map(d=>d.id===id?{...d, siqqeeVeto:true, requiredThreshold:90}:d) })),
  selfishAction: () => set(s=>({ selfishActions:s.selfishActions+1, trustHealth:Math.max(0,s.trustHealth-5), reputation:Math.max(0,s.reputation-10), tier:tierForRep(Math.max(0,s.reputation-10)) })),
  ethicalAction: (amount=1) => set(s=>({ ethicalActions:s.ethicalActions+amount, trustHealth:Math.min(100,s.trustHealth+amount*2), reputation:s.reputation+amount*4, tier:tierForRep(s.reputation+amount*4) })),
  tickLuba: () => set(s=>{ const np=s.lubaProgress+2; if(np>=100) return { lubaProgress:0, lubaCycle:(s.lubaCycle%8)+1 }; return { lubaProgress:np }; }),
  addProposal: (p) => set(s=>({ proposals: [{ id:`S-${String(s.proposals.length+8).padStart(2,"0")}`, votes:0, cost:0, siqqeeFlagged:false, threshold:75, ...p }, ...s.proposals] })),
  voteQuadratic: (id, votes) => set(s=>{ const cost=votes*votes; return { proposals:s.proposals.map(pp=>pp.id===id?{...pp,votes:pp.votes+votes,cost:pp.cost+cost}:pp), reputation:Math.max(0,s.reputation-Math.floor(cost/10)) }; }),
}));
