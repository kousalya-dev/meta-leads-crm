import crypto from "crypto";
import type { NewLead } from "./types";

export function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !header) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

interface GraphLead {
  id: string;
  created_time: string;
  campaign_name?: string;
  field_data: { name: string; values: string[] }[];
}

// The webhook only sends a leadgen_id; the actual form answers must be fetched from the Graph API.
export async function fetchMetaLead(leadgenId: string): Promise<NewLead> {
  const v = process.env.META_GRAPH_VERSION || "v21.0";
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const res = await fetch(
    `https://graph.facebook.com/${v}/${leadgenId}?fields=id,created_time,campaign_name,field_data&access_token=${token}`
  );
  if (!res.ok) throw new Error(`Graph API ${res.status}: ${await res.text()}`);
  const data: GraphLead = await res.json();
  const f = (...keys: string[]) =>
    data.field_data.find((x) => keys.includes(x.name))?.values?.[0] ?? "";

  // Field names depend on your Lead Ad form - adjust the keys below to match yours.
  const name = f("full_name") || `${f("first_name")} ${f("last_name")}`.trim() || "Unknown";
  return {
    name,
    phone: f("phone_number", "phone"),
    email: f("email"),
    address: [f("street_address"), f("city")].filter(Boolean).join(", "),
    segment: /commercial/i.test(f("segment", "property_type")) ? "Commercial" : "Residential",
    source: "Meta Ads",
    campaign: data.campaign_name,
    metaLeadId: data.id,
  };
}
