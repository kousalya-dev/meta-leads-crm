import { NextResponse } from "next/server";
import { fetchAllMetaLeads, mapGraphLead } from "@/lib/meta";
import { addLead, listLeads } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Pulls every lead from every lead form on the Page and saves the new ones.
// Safe to run repeatedly: leads are deduplicated by Meta's lead id.
export async function POST() {
  if (!process.env.META_PAGE_ACCESS_TOKEN) {
    return NextResponse.json({ error: "META_PAGE_ACCESS_TOKEN is not set" }, { status: 400 });
  }
  try {
    const known = new Set((await listLeads()).map((l) => l.metaLeadId).filter(Boolean));
    const { forms, leads } = await fetchAllMetaLeads();
    let added = 0;
    for (const lead of leads) {
      if (known.has(lead.id)) continue;
      await addLead(mapGraphLead(lead));
      added++;
    }
    return NextResponse.json({ forms, fetched: leads.length, added });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
