import { promises as fs } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import type { Lead, NewLead } from "./types";

// Uses Postgres (Neon / Vercel Postgres) when DATABASE_URL is set,
// otherwise falls back to a local JSON file so `npm run dev` works with zero setup.
const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.STORAGE_URL;
const usePg = !!DB_URL;
const sql = usePg ? neon(DB_URL!) : null;

let ready: Promise<unknown> | null = null;
function init() {
  ready ??= sql!`
    CREATE TABLE IF NOT EXISTS leads (
      seq SERIAL PRIMARY KEY,
      intent TEXT NOT NULL DEFAULT 'WARM',
      name TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      assigned_to TEXT,
      source TEXT NOT NULL DEFAULT 'Direct',
      segment TEXT NOT NULL DEFAULT 'Residential',
      stage TEXT NOT NULL DEFAULT 'New',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      meta_lead_id TEXT UNIQUE,
      campaign TEXT
    )`;
  return ready;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromRow = (r: any): Lead => ({
  id: `MPN-LD-${String(r.seq).padStart(4, "0")}`,
  intent: r.intent,
  name: r.name,
  address: r.address,
  phone: r.phone,
  email: r.email,
  assignedTo: r.assigned_to,
  source: r.source,
  segment: r.segment,
  stage: r.stage,
  createdAt: new Date(r.created_at).toISOString(),
  metaLeadId: r.meta_lead_id ?? undefined,
  campaign: r.campaign ?? undefined,
});

// ---- JSON-file fallback (local dev only) ----
const FILE = path.join(process.cwd(), "data", "leads.json");
async function readFile(): Promise<Lead[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

export async function listLeads(): Promise<Lead[]> {
  if (sql) {
    await init();
    return (await sql`SELECT * FROM leads ORDER BY created_at DESC`).map(fromRow);
  }
  return (await readFile()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addLead(input: NewLead): Promise<Lead> {
  if (sql) {
    await init();
    const rows = await sql`
      INSERT INTO leads (intent, name, address, phone, email, assigned_to, source, segment, stage, meta_lead_id, campaign)
      VALUES (${input.intent ?? "WARM"}, ${input.name}, ${input.address ?? ""}, ${input.phone ?? ""},
              ${input.email ?? ""}, ${input.assignedTo ?? null}, ${input.source ?? "Direct"},
              ${input.segment ?? "Residential"}, ${input.stage ?? "New"}, ${input.metaLeadId ?? null},
              ${input.campaign ?? null})
      ON CONFLICT (meta_lead_id) DO NOTHING
      RETURNING *`;
    if (rows.length) return fromRow(rows[0]);
    // Meta retried the webhook: return the existing lead instead of duplicating.
    return fromRow((await sql`SELECT * FROM leads WHERE meta_lead_id = ${input.metaLeadId!}`)[0]);
  }

  const leads = await readFile();
  const existing = input.metaLeadId && leads.find((l) => l.metaLeadId === input.metaLeadId);
  if (existing) return existing;
  const lead: Lead = {
    id: `MPN-LD-${String(leads.length + 1).padStart(4, "0")}`,
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
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify([...leads], null, 2));
  return lead;
}
