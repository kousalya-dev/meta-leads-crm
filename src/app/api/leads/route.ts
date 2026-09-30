import { NextResponse } from "next/server";
import { addLead, listLeads } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listLeads());
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  return NextResponse.json(await addLead(body), { status: 201 });
}
