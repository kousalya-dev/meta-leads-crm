import { NextResponse } from "next/server";
import { fetchMetaLead, verifySignature } from "@/lib/meta";
import { addLead } from "@/lib/store";

export const dynamic = "force-dynamic";

// Step 1: Meta calls this once when you save the webhook in the App Dashboard.
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === process.env.META_VERIFY_TOKEN) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Step 2: Meta POSTs here every time someone submits your Lead Ad form.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }
  const payload = JSON.parse(raw);
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;
      try {
        await addLead(await fetchMetaLead(change.value.leadgen_id));
      } catch (e) {
        console.error("Meta lead failed", change.value?.leadgen_id, e);
      }
    }
  }
  return NextResponse.json({ ok: true }); // always 200 so Meta doesn't disable the webhook
}
