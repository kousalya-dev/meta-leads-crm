import { NextResponse } from "next/server";
import { mapGraphLead, type GraphLead } from "@/lib/meta";
import { addLead } from "@/lib/store";

export const dynamic = "force-dynamic";

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// Builds a fake lead in exactly the shape Meta's Graph API returns, then runs it through
// the same mapping + storage as a real webhook lead. Disable with META_DISABLE_SIMULATION=true.
export async function POST() {
  if (process.env.META_DISABLE_SIMULATION === "true") {
    return NextResponse.json({ error: "Simulation disabled" }, { status: 403 });
  }
  const people = [
    ["Arjun Nair", "Kochi"], ["Divya Menon", "Thrissur"], ["Rahul Pillai", "Kollam"],
    ["Sneha Varghese", "Kottayam"], ["Mohammed Faisal", "Kozhikode"], ["Lakshmi Iyer", "Palakkad"],
  ];
  const [name, city] = pick(people);
  const id = `sim_${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const lead: GraphLead = {
    id,
    created_time: new Date().toISOString(),
    ad_id: "120210000000001",
    ad_name: pick(["Rooftop Solar - Video", "Free Solar Quote - Carousel"]),
    adset_id: "120210000000002",
    adset_name: pick(["Kerala 25-55", "Kochi Homeowners"]),
    campaign_id: "120210000000003",
    campaign_name: pick(["Solar Leads - Oct", "Rooftop Solar - Kerala"]),
    form_id: "1234567890",
    is_organic: false,
    platform: pick(["facebook", "instagram"]),
    field_data: [
      { name: "full_name", values: [name] },
      { name: "phone_number", values: [`+9198${Math.floor(10000000 + Math.random() * 89999999)}`] },
      { name: "email", values: [`${name.split(" ")[0].toLowerCase()}@example.com`] },
      { name: "city", values: [city] },
      { name: "street_address", values: [`${Math.floor(1 + Math.random() * 99)}, MG Road`] },
    ],
  };
  return NextResponse.json(await addLead(mapGraphLead(lead)), { status: 201 });
}
