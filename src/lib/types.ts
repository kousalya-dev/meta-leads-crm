export type Intent = "HOT" | "WARM" | "COLD";
export type Stage =
  | "New"
  | "Contacted"
  | "Site Visit Scheduled"
  | "Quoted"
  | "Negotiation"
  | "Won"
  | "Lost";

export interface Lead {
  id: string; // e.g. MPN-LD-0001
  intent: Intent;
  name: string;
  address: string;
  phone: string;
  email: string;
  assignedTo: string | null;
  source: string; // "Meta Ads", "Google Ads", "Direct", ...
  segment: "Residential" | "Commercial";
  stage: Stage;
  createdAt: string; // ISO
  metaLeadId?: string; // dedupe key for Meta leads
  campaign?: string;
}

export type NewLead = Partial<Omit<Lead, "id" | "createdAt">> & { name: string };
