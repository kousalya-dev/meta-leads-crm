import { promises as fs } from "fs";
import path from "path";
import type { Lead, NewLead } from "./types";

// Simple JSON-file store so the project runs with zero setup.
// Swap these functions for Postgres/Prisma/Supabase when you deploy (Vercel's filesystem is read-only).
const FILE = path.join(process.cwd(), "data", "leads.json");

async function read(): Promise<Lead[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

async function write(leads: Lead[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(leads, null, 2));
}

export async function listLeads(): Promise<Lead[]> {
  const leads = await read();
  return leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addLead(input: NewLead): Promise<Lead> {
  const leads = await read();
  if (input.metaLeadId) {
    const existing = leads.find((l) => l.metaLeadId === input.metaLeadId);
    if (existing) return existing; // Meta retries webhooks; don't duplicate
  }
  const n = leads.length + 1;
  const lead: Lead = {
    id: `MPN-LD-${String(n).padStart(4, "0")}`,
    intent: "WARM",
    address: "",
    phone: "",
    email: "",
    assignedTo: null,
    source: "Direct",
    segment: "Residential",
    stage: "New",
    ...input,
    createdAt: new Date().toISOString(),
  };
  leads.push(lead);
  await write(leads);
  return lead;
}
