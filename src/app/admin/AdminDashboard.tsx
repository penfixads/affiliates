"use client";

import { useState, useTransition } from "react";
import { approveProgram, rejectProgram, addProgram, markSalesPaid, deleteApplication } from "@/app/actions/admin";
import { logout } from "@/app/actions/auth";

type Program = { id: string; name: string; slug: string; type: string; commission_rate: number; product_url: string; active: boolean };
type AppProgram = { id: string; status: string; program: Program };
type Application = { id: string; full_name: string; email: string; phone: string; reason: string; status: string; created_at: string; application_programs: AppProgram[] };
type AffiliateProgram = { id: string; referral_code: string; program: Program };
type Affiliate = { id: string; full_name: string; email: string; phone: string; referral_code: string; created_at: string; affiliate_programs: AffiliateProgram[] };
type Sale = { id: string; affiliate_id: string; program_id: string; referral_code: string; amount: number; commission: number; status: string; created_at: string; program: { name: string }; affiliate: { full_name: string; email: string } };

const STATUS_PILL: Record<string, string> = {
  pending:  "bg-yellow-900/40 text-yellow-300 border border-yellow-600/30",
  approved: "bg-green-900/40 text-green-300 border border-green-600/30",
  rejected: "bg-red-900/40 text-red-300 border border-red-600/30",
  paid:     "bg-blue-900/40 text-blue-300 border border-blue-600/30",
};

const TABS = ["Applications", "Affiliates", "Programs", "Payouts"];

export default function AdminDashboard({ applications, programs, affiliates, sales, clickCounts }: {
  applications: Application[];
  programs: Program[];
  affiliates: Affiliate[];
  sales: Sale[];
  clickCounts: Record<string, number>;
}) {
  const [tab, setTab] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [apps, setApps] = useState(applications);
  const [progs, setProgs] = useState(programs);
  const [saleList, setSaleList] = useState(sales);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

  function handleApprove(appId: string, progId: string) {
    startTransition(async () => {
      const res = await approveProgram(appId, progId);
      if (res?.error) { flash(`Error: ${res.error}`); return; }
      setApps((prev) => prev.map((a) => a.id !== appId ? a : {
        ...a,
        application_programs: a.application_programs.map((ap) =>
          ap.program.id === progId ? { ...ap, status: "approved" } : ap
        ),
      }));
      flash("Program approved — affiliate account created.");
    });
  }

  function handleReject(appId: string, progId: string) {
    startTransition(async () => {
      const res = await rejectProgram(appId, progId);
      if (res?.error) { flash(`Error: ${res.error}`); return; }
      setApps((prev) => prev.map((a) => a.id !== appId ? a : {
        ...a,
        application_programs: a.application_programs.map((ap) =>
          ap.program.id === progId ? { ...ap, status: "rejected" } : ap
        ),
      }));
      flash("Program rejected.");
    });
  }

  function handleDelete(appId: string) {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteApplication(appId);
      if (res?.error) { flash(`Error: ${res.error}`); return; }
      setApps((prev) => prev.filter((a) => a.id !== appId));
      setExpanded(null);
      flash("Application deleted.");
    });
  }

  async function handleAddProgram(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addProgram(fd);
      if (res?.error) { flash(`Error: ${res.error}`); return; }
      flash("Program added.");
      (e.target as HTMLFormElement).reset();
    });
  }

  function handlePayoutSelect(id: string) {
    setSelectedSales((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  function handleMarkPaid() {
    startTransition(async () => {
      const res = await markSalesPaid(selectedSales);
      if (res?.error) { flash(`Error: ${res.error}`); return; }
      setSaleList((prev) => prev.map((s) => selectedSales.includes(s.id) ? { ...s, status: "paid" } : s));
      setSelectedSales([]);
      flash("Commissions marked as paid.");
    });
  }

  const pendingApps = apps.filter((a) => a.application_programs.some((ap) => ap.status === "pending")).length;
  const pendingSales = saleList.filter((s) => s.status === "pending");
  const totalPending = pendingSales.reduce((sum, s) => sum + s.commission, 0);

  const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://affiliates.brilliantlabsph.com";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ borderColor: "var(--gold-border)", background: "rgba(13,27,42,0.97)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <span className="font-cinzel text-lg font-semibold tracking-widest" style={{ color: "var(--gold)" }}>BrilliantLabs</span>
          <span className="text-xs tracking-widest uppercase" style={{ color: "var(--cream-dim)" }}>Admin</span>
        </div>
        <form action={logout}>
          <button className="text-xs tracking-wide transition-colors" style={{ color: "var(--cream-dim)" }}
            onMouseOver={e => (e.currentTarget.style.color = "var(--gold)")}
            onMouseOut={e => (e.currentTarget.style.color = "var(--cream-dim)")}>
            Sign out
          </button>
        </form>
      </header>

      {/* Tabs */}
      <div className="border-b px-6 flex gap-1" style={{ borderColor: "var(--gold-border)" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className="px-4 py-3 text-sm font-medium transition-all relative"
            style={{ color: tab === i ? "var(--gold)" : "var(--cream-dim)" }}>
            {t}
            {i === 0 && pendingApps > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--gold)", color: "#0D1B2A" }}>{pendingApps}</span>
            )}
            {i === 3 && pendingSales.length > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--gold)", color: "#0D1B2A" }}>{pendingSales.length}</span>
            )}
            {tab === i && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--gold)" }} />}
          </button>
        ))}
      </div>

      {message && (
        <div className="mx-6 mt-4 rounded-lg px-4 py-3 text-sm border"
          style={{ background: "rgba(201,164,71,0.1)", borderColor: "var(--gold-border)", color: "var(--gold)" }}>
          {message}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* ── TAB 0: APPLICATIONS ── */}
        {tab === 0 && (
          <div className="space-y-3">
            <h2 className="font-playfair text-2xl mb-6" style={{ color: "var(--gold)" }}>Applications</h2>
            {apps.length === 0 && <div className="glass-card p-16 text-center" style={{ color: "var(--cream-dim)" }}>No applications yet.</div>}
            {apps.map((app) => (
              <div key={app.id} className="glass-card overflow-hidden">
                <div className="flex items-center gap-4 px-6 py-4 cursor-pointer"
                  onClick={() => setExpanded(expanded === app.id ? null : app.id)}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-playfair font-bold text-sm flex-shrink-0"
                    style={{ background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}>
                    {app.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium" style={{ color: "var(--cream)" }}>{app.full_name}</div>
                    <div className="text-xs" style={{ color: "var(--cream-dim)" }}>{app.email}</div>
                  </div>
                  <div className="hidden sm:flex gap-1.5 flex-wrap">
                    {app.application_programs.map((ap) => (
                      <span key={ap.id} className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_PILL[ap.status]}`}>
                        {ap.program.slug} · {ap.status}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs" style={{ color: "var(--cream-dim)" }}>
                    {new Date(app.created_at).toLocaleDateString()}
                  </div>
                  <svg className="w-4 h-4 flex-shrink-0 transition-transform" style={{ color: "var(--cream-dim)", transform: expanded === app.id ? "rotate(180deg)" : "rotate(0)" }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {expanded === app.id && (
                  <div className="px-6 pb-6 border-t" style={{ borderColor: "var(--gold-border)" }}>
                    <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
                      <div>
                        <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--cream-dim)" }}>Phone</div>
                        <div style={{ color: "var(--cream)" }}>{app.phone}</div>
                      </div>
                      <div>
                        <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--cream-dim)" }}>Applied</div>
                        <div style={{ color: "var(--cream)" }}>{new Date(app.created_at).toLocaleString()}</div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--cream-dim)" }}>Why they want to join</div>
                        <div className="leading-relaxed" style={{ color: "var(--cream)" }}>{app.reason}</div>
                      </div>
                    </div>

                    {/* Delete application */}
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => handleDelete(app.id)}
                        disabled={isPending}
                        className="text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50"
                        style={{ borderColor: "rgba(220,38,38,0.35)", color: "#fca5a5" }}
                      >
                        🗑 Delete Application
                      </button>
                    </div>

                    {/* Per-program approval */}
                    <div className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--cream-dim)" }}>Programs Applied For</div>
                    <div className="space-y-2">
                      {app.application_programs.map((ap) => (
                        <div key={ap.id} className="flex items-center justify-between rounded-lg px-4 py-3"
                          style={{ border: "1px solid var(--gold-border)", background: "rgba(255,255,255,0.02)" }}>
                          <div>
                            <div className="text-sm font-medium" style={{ color: "var(--cream)" }}>{ap.program.name}</div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--cream-dim)" }}>{ap.program.type}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_PILL[ap.status]}`}>
                              {ap.status}
                            </span>
                            {ap.status === "pending" && (
                              <>
                                <button onClick={() => handleApprove(app.id, ap.program.id)} disabled={isPending}
                                  className="btn-gold px-3 py-1.5 text-xs disabled:opacity-50">Approve</button>
                                <button onClick={() => handleReject(app.id, ap.program.id)} disabled={isPending}
                                  className="px-3 py-1.5 text-xs rounded-lg border transition-all disabled:opacity-50"
                                  style={{ borderColor: "rgba(220,38,38,0.4)", color: "#fca5a5" }}>Reject</button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── TAB 1: AFFILIATES ── */}
        {tab === 1 && (
          <div>
            <h2 className="font-playfair text-2xl mb-6" style={{ color: "var(--gold)" }}>All Affiliates</h2>
            {affiliates.length === 0 && <div className="glass-card p-16 text-center" style={{ color: "var(--cream-dim)" }}>No approved affiliates yet.</div>}
            <div className="space-y-3">
              {affiliates.map((aff) => {
                const totalClicks = aff.affiliate_programs.reduce((sum, ap) => sum + (clickCounts[ap.referral_code] ?? 0), 0);
                const affSales = saleList.filter((s) => s.affiliate_id === aff.id);
                const totalComm = affSales.reduce((sum, s) => sum + s.commission, 0);
                return (
                  <div key={aff.id} className="glass-card overflow-hidden">
                    <div className="flex items-center gap-4 px-6 py-4 cursor-pointer"
                      onClick={() => setExpanded(expanded === aff.id ? null : aff.id)}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-playfair font-bold text-sm flex-shrink-0"
                        style={{ background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}>
                        {aff.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium" style={{ color: "var(--cream)" }}>{aff.full_name}</div>
                        <div className="text-xs" style={{ color: "var(--cream-dim)" }}>{aff.email}</div>
                      </div>
                      <div className="hidden sm:flex gap-6 text-center">
                        <div>
                          <div className="font-playfair text-lg font-bold" style={{ color: "var(--gold)" }}>{totalClicks}</div>
                          <div className="text-xs" style={{ color: "var(--cream-dim)" }}>Clicks</div>
                        </div>
                        <div>
                          <div className="font-playfair text-lg font-bold" style={{ color: "var(--gold)" }}>{affSales.length}</div>
                          <div className="text-xs" style={{ color: "var(--cream-dim)" }}>Sales</div>
                        </div>
                        <div>
                          <div className="font-playfair text-lg font-bold" style={{ color: "var(--gold)" }}>₱{totalComm.toFixed(0)}</div>
                          <div className="text-xs" style={{ color: "var(--cream-dim)" }}>Commission</div>
                        </div>
                      </div>
                      <svg className="w-4 h-4 flex-shrink-0 transition-transform" style={{ color: "var(--cream-dim)", transform: expanded === aff.id ? "rotate(180deg)" : "rotate(0)" }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {expanded === aff.id && (
                      <div className="px-6 pb-6 border-t space-y-3" style={{ borderColor: "var(--gold-border)" }}>
                        <div className="pt-5 text-xs tracking-widest uppercase mb-3" style={{ color: "var(--cream-dim)" }}>Referral Links</div>
                        {aff.affiliate_programs.map((ap) => (
                          <div key={ap.id} className="rounded-lg px-4 py-3 flex items-center justify-between gap-4"
                            style={{ border: "1px solid var(--gold-border)", background: "rgba(255,255,255,0.02)" }}>
                            <div>
                              <div className="text-sm font-medium" style={{ color: "var(--cream)" }}>{ap.program.name}</div>
                              <div className="text-xs font-mono mt-0.5" style={{ color: "var(--gold)" }}>
                                {BASE_URL}/ref/{ap.referral_code}
                              </div>
                            </div>
                            <div className="text-right text-sm" style={{ color: "var(--cream-dim)" }}>
                              {clickCounts[ap.referral_code] ?? 0} clicks
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: PROGRAMS ── */}
        {tab === 2 && (
          <div>
            <h2 className="font-playfair text-2xl mb-6" style={{ color: "var(--gold)" }}>Programs</h2>
            <div className="grid gap-4 mb-10">
              {progs.map((p) => (
                <div key={p.id} className="glass-card px-6 py-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium" style={{ color: "var(--cream)" }}>{p.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--cream-dim)" }}>
                      /{p.slug} · {p.type} · {p.commission_rate}% commission
                    </div>
                    {p.product_url && p.product_url !== "#" && (
                      <div className="text-xs mt-1 font-mono" style={{ color: "rgba(201,164,71,0.6)" }}>{p.product_url}</div>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.active ? STATUS_PILL.approved : STATUS_PILL.rejected}`}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>

            {/* Add program form */}
            <div className="glass-card p-6">
              <h3 className="font-playfair text-lg mb-5" style={{ color: "var(--gold)" }}>Add New Program</h3>
              <form onSubmit={handleAddProgram} className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--cream-dim)" }}>Program Name</label>
                  <input name="name" required placeholder="e.g. My Product" className="field" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--cream-dim)" }}>Slug</label>
                  <input name="slug" required placeholder="e.g. my-product" className="field" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--cream-dim)" }}>Commission Rate (%)</label>
                  <input name="commission_rate" type="number" defaultValue={20} min={1} max={100} required className="field" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--cream-dim)" }}>Type</label>
                  <select name="type" required className="field">
                    <option value="bibliotech">Bibliotech</option>
                    <option value="solutions">Solutions</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--cream-dim)" }}>Product URL</label>
                  <input name="product_url" type="url" placeholder="https://..." className="field" />
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" disabled={isPending} className="btn-gold px-6 py-2.5 text-sm disabled:opacity-50">
                    {isPending ? "Adding…" : "Add Program"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── TAB 3: PAYOUTS ── */}
        {tab === 3 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-playfair text-2xl" style={{ color: "var(--gold)" }}>Payouts</h2>
                <p className="text-sm mt-1" style={{ color: "var(--cream-dim)" }}>
                  Pending: ₱{totalPending.toFixed(2)} across {pendingSales.length} sale{pendingSales.length !== 1 ? "s" : ""}
                </p>
              </div>
              {selectedSales.length > 0 && (
                <button onClick={handleMarkPaid} disabled={isPending} className="btn-gold px-5 py-2.5 text-sm disabled:opacity-50">
                  Mark {selectedSales.length} as Paid
                </button>
              )}
            </div>

            {saleList.length === 0 && (
              <div className="glass-card p-16 text-center" style={{ color: "var(--cream-dim)" }}>No sales recorded yet.</div>
            )}

            <div className="glass-card overflow-hidden">
              {saleList.length > 0 && (
                <table className="w-full text-sm">
                  <thead className="border-b" style={{ borderColor: "var(--gold-border)" }}>
                    <tr>
                      <th className="text-left px-4 py-3 text-xs tracking-widest uppercase" style={{ color: "var(--cream-dim)" }}>
                        <input type="checkbox" className="accent-amber-500"
                          onChange={(e) => setSelectedSales(e.target.checked ? pendingSales.map((s) => s.id) : [])}
                          checked={selectedSales.length === pendingSales.length && pendingSales.length > 0} />
                      </th>
                      <th className="text-left px-4 py-3 text-xs tracking-widest uppercase" style={{ color: "var(--cream-dim)" }}>Affiliate</th>
                      <th className="text-left px-4 py-3 text-xs tracking-widest uppercase" style={{ color: "var(--cream-dim)" }}>Program</th>
                      <th className="text-left px-4 py-3 text-xs tracking-widest uppercase" style={{ color: "var(--cream-dim)" }}>Sale</th>
                      <th className="text-left px-4 py-3 text-xs tracking-widest uppercase" style={{ color: "var(--cream-dim)" }}>Commission</th>
                      <th className="text-left px-4 py-3 text-xs tracking-widest uppercase" style={{ color: "var(--cream-dim)" }}>Status</th>
                      <th className="text-left px-4 py-3 text-xs tracking-widest uppercase" style={{ color: "var(--cream-dim)" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--gold-border)" }}>
                    {saleList.map((sale) => (
                      <tr key={sale.id} className="transition-colors" style={{ background: selectedSales.includes(sale.id) ? "rgba(201,164,71,0.05)" : "transparent" }}>
                        <td className="px-4 py-3">
                          {sale.status === "pending" && (
                            <input type="checkbox" className="accent-amber-500"
                              checked={selectedSales.includes(sale.id)}
                              onChange={() => handlePayoutSelect(sale.id)} />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div style={{ color: "var(--cream)" }}>{sale.affiliate?.full_name}</div>
                          <div className="text-xs" style={{ color: "var(--cream-dim)" }}>{sale.affiliate?.email}</div>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--cream-dim)" }}>{sale.program?.name}</td>
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--cream)" }}>₱{sale.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--gold)" }}>₱{sale.commission.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_PILL[sale.status]}`}>{sale.status}</span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--cream-dim)" }}>
                          {new Date(sale.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
