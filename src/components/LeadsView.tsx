"use client";
import { useEffect, useMemo, useState } from "react";
import type { Lead, Stage } from "@/lib/types";

const TABS = ["All", "Unassigned", "New", "Site Visit Scheduled", "Won", "Lost"] as const;
type Tab = (typeof TABS)[number];

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function LeadsView({ initial }: { initial: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [tab, setTab] = useState<Tab>("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  // Poll so new Meta leads appear without a manual refresh.
  useEffect(() => {
    const t = setInterval(async () => {
      const r = await fetch("/api/leads", { cache: "no-store" });
      if (r.ok) setLeads(await r.json());
    }, 10000);
    return () => clearInterval(t);
  }, []);

  const matchTab = (l: Lead, t: Tab) =>
    t === "All" ? true : t === "Unassigned" ? !l.assignedTo : l.stage === (t as Stage);
  const count = (t: Tab) => leads.filter((l) => matchTab(l, t)).length;

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return leads.filter(
      (l) =>
        matchTab(l, tab) &&
        [l.name, l.address, l.phone, l.email].some((v) => v.toLowerCase().includes(s))
    );
  }, [leads, tab, q]);

  const today = new Date().toDateString();
  const stats = [
    ["New leads today", leads.filter((l) => new Date(l.createdAt).toDateString() === today).length, "leads today"],
    ["Open leads", leads.filter((l) => l.stage !== "Won" && l.stage !== "Lost").length, "in pipeline"],
    ["Unassigned", count("Unassigned"), "needs to assigned"],
    ["Hot leads", leads.filter((l) => l.intent === "HOT").length, "hot leads"],
  ] as const;

  return (
    <>
      <div className="head">
        <div>
          <h1>Leads</h1>
          <p className="muted">Every lead across sources, their status and assignees in one place</p>
        </div>
        <button className="btn-green" onClick={() => setOpen(true)}>+ Add Lead</button>
      </div>

      <div className="stats">
        {stats.map(([label, n, sub]) => (
          <div className="card" key={label}>
            <div className="label">{label}</div>
            <div><span className="big">{n}</span> <span className="muted">{sub}</span></div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t} className={"tab" + (t === tab ? " on" : "")} onClick={() => setTab(t)}>
              {t} <span className="pill">{count(t)}</span>
            </button>
          ))}
        </div>
        <input className="search" placeholder="Search name, location, phone or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <table>
          <thead>
            <tr>
              {["Intent", "Lead ID", "Lead", "Contact", "Assigned to", "Source", "Segment", "Stage", "Date Created"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id}>
                <td><span className={"badge " + l.intent.toLowerCase()}>{l.intent}</span></td>
                <td className="mono">{l.id}</td>
                <td><b>{l.name}</b><div className="muted sm">{l.address}</div></td>
                <td>{l.phone}<div className="muted sm">{l.email}</div></td>
                <td>{l.assignedTo ?? <span className="muted">Unassigned</span>}</td>
                <td>{l.source}</td>
                <td>{l.segment}</td>
                <td><span className="stage">{l.stage}</span></td>
                <td>{fmt(l.createdAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="empty">No leads yet. Add one or wait for Meta Ads leads to arrive.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && <AddLead onClose={() => setOpen(false)} onAdded={(l) => { setLeads([l, ...leads]); setOpen(false); }} />}
    </>
  );
}

function AddLead({ onClose, onAdded }: { onClose: () => void; onAdded: (l: Lead) => void }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", address: "", source: "Direct", segment: "Residential", intent: "WARM" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    if (r.ok) onAdded(await r.json());
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Add Lead</h2>
        <input required placeholder="Name" value={f.name} onChange={set("name")} />
        <input placeholder="Phone" value={f.phone} onChange={set("phone")} />
        <input type="email" placeholder="Email" value={f.email} onChange={set("email")} />
        <input placeholder="Address / location" value={f.address} onChange={set("address")} />
        <select value={f.source} onChange={set("source")}>
          {["Direct", "Meta Ads", "Google Ads", "Referral"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={f.segment} onChange={set("segment")}>
          <option>Residential</option><option>Commercial</option>
        </select>
        <select value={f.intent} onChange={set("intent")}>
          <option>HOT</option><option>WARM</option><option>COLD</option>
        </select>
        <div className="row">
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="btn-green" type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}
