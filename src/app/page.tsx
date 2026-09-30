import LeadsView from "@/components/LeadsView";
import { listLeads } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <LeadsView initial={await listLeads()} />;
}
