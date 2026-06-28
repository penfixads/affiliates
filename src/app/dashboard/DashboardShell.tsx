"use client";

import { useState } from "react";
import { logout } from "@/app/actions/auth";
import Link from "next/link";

type Program = { id: string; name: string; slug: string; type: string; commission_rate: number; product_url: string };
type AffiliateProgram = { id: string; referral_code: string; program: Program };
type Sale = { id: string; program_id: string; amount: number; commission: number; status: string; created_at: string };
type Affiliate = { id: string; full_name: string; email: string; phone: string; referral_code: string };

export default function DashboardShell({ affiliate, affiliatePrograms, clickCounts, sales }: {
  affiliate: Affiliate;
  affiliatePrograms: AffiliateProgram[];
  clickCounts: Record<string, number>;
  sales: Sale[];
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://affiliates.brilliantlabsph.com";

  function copyLink(code: string) {
    navigator.clipboard.writeText(`${BASE_URL}/ref/${code}`);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const totalClicks = affiliatePrograms.reduce((sum, ap) => sum + (clickCounts[ap.referral_code] ?? 0), 0);
  const totalSales = sales.length;
  const totalEarned = sales.reduce((sum, s) => sum + s.commission, 0);
  const pendingEarned = sales.filter((s) => s.status === "pending").reduce((sum, s) => sum + s.commission, 0);

  const bibliotechPrograms = affiliatePrograms.filter((ap) => ap.program.type === "bibliotech");
  const solutionsPrograms = affiliatePrograms.filter((ap) => ap.program.type === "solutions");

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ borderColor: "var(--gold-border)", background: "rgba(13,27,42,0.97)", backdropFilter: "blur(12px)" }}>
        <div>
          <span className="font-cinzel text-lg font-semibold tracking-widest" style={{ color: "var(--gold)" }}>BrilliantLabsPh</span>
          <span className="ml-3 text-xs tracking-widest uppercase" style={{ color: "var(--cream-dim)" }}>Affiliate Portal</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-xs hidden sm:block" style={{ color: "var(--cream-dim)" }}>{affiliate.email}</span>
          <form action={logout}>
            <button className="text-xs transition-colors" style={{ color: "var(--cream-dim)" }}
              onMouseOver={e => (e.currentTarget.style.color = "var(--gold)")}
              onMouseOut={e => (e.currentTarget.style.color = "var(--cream-dim)")}>
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* Welcome */}
        <div>
          <h1 className="font-playfair text-3xl font-bold" style={{ color: "var(--gold)" }}>
            Welcome back, {affiliate.full_name.split(" ")[0]}.
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--cream-dim)" }}>
            Here's your affiliate overview.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Clicks",   value: totalClicks },
            { label: "Total Sales",    value: totalSales },
            { label: "Total Earned",   value: `₱${totalEarned.toFixed(2)}` },
            { label: "Pending Payout", value: `₱${pendingEarned.toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} className="glass-card p-5">
              <div className="font-playfair text-2xl font-bold" style={{ color: "var(--gold)" }}>{value}</div>
              <div className="text-xs tracking-widest uppercase mt-1" style={{ color: "var(--cream-dim)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* My Programs + Links */}
        <div>
          <h2 className="font-playfair text-xl mb-4" style={{ color: "var(--gold)" }}>My Affiliate Links</h2>
          {affiliatePrograms.length === 0 ? (
            <div className="glass-card p-8 text-center" style={{ color: "var(--cream-dim)" }}>
              No approved programs yet. Check back after your application is reviewed.
            </div>
          ) : (
            <div className="space-y-3">
              {affiliatePrograms.map((ap) => {
                const link = `${BASE_URL}/ref/${ap.referral_code}`;
                const clicks = clickCounts[ap.referral_code] ?? 0;
                const progSales = sales.filter((s) => s.program_id === ap.program.id);
                const earned = progSales.reduce((sum, s) => sum + s.commission, 0);

                return (
                  <div key={ap.id} className="glass-card p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium" style={{ color: "var(--cream)" }}>{ap.program.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--gold-dim)", color: "var(--gold)" }}>
                            {ap.program.commission_rate}% commission
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: "rgba(255,255,255,0.05)", color: "var(--cream-dim)" }}>
                            {ap.program.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs px-3 py-1.5 rounded-lg font-mono flex-1 min-w-0 truncate"
                            style={{ background: "rgba(0,0,0,0.3)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}>
                            {link}
                          </code>
                          <button onClick={() => copyLink(ap.referral_code)}
                            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: copied === ap.referral_code ? "var(--gold)" : "var(--gold-dim)", color: copied === ap.referral_code ? "#0D1B2A" : "var(--gold)", border: "1px solid var(--gold-border)" }}>
                            {copied === ap.referral_code ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-4 text-center flex-shrink-0">
                        <div>
                          <div className="font-cinzel text-lg font-semibold tracking-widest" style={{ color: "var(--gold)" }}>{clicks}</div>
                          <div className="text-xs" style={{ color: "var(--cream-dim)" }}>Clicks</div>
                        </div>
                        <div>
                          <div className="font-cinzel text-lg font-semibold tracking-widest" style={{ color: "var(--gold)" }}>{progSales.length}</div>
                          <div className="text-xs" style={{ color: "var(--cream-dim)" }}>Sales</div>
                        </div>
                        <div>
                          <div className="font-cinzel text-lg font-semibold tracking-widest" style={{ color: "var(--gold)" }}>₱{earned.toFixed(0)}</div>
                          <div className="text-xs" style={{ color: "var(--cream-dim)" }}>Earned</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reader access — Bibliotech only */}
        {bibliotechPrograms.length > 0 && (
          <div>
            <h2 className="font-playfair text-xl mb-4" style={{ color: "var(--gold)" }}>Read Your Books</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {bibliotechPrograms.map((ap) => (
                <Link key={ap.id} href="/reader"
                  className="glass-card p-5 flex items-center gap-4 transition-all group"
                  style={{ textDecoration: "none" }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                  onMouseOut={e => (e.currentTarget.style.borderColor = "var(--gold-border)")}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-border)" }}>
                    📖
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: "var(--cream)" }}>{ap.program.name}</div>
                    <div className="text-xs mt-0.5 transition-colors" style={{ color: "var(--gold)" }}>Open reader →</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent sales */}
        {sales.length > 0 && (
          <div>
            <h2 className="font-playfair text-xl mb-4" style={{ color: "var(--gold)" }}>Recent Sales</h2>
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b" style={{ borderColor: "var(--gold-border)" }}>
                  <tr>
                    {["Date", "Program", "Sale Amount", "Commission", "Status"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs tracking-widest uppercase" style={{ color: "var(--cream-dim)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--gold-border)" }}>
                  {sales.slice(0, 10).map((sale) => {
                    const prog = affiliatePrograms.find((ap) => ap.program.id === sale.program_id);
                    return (
                      <tr key={sale.id}>
                        <td className="px-5 py-3 text-xs" style={{ color: "var(--cream-dim)" }}>{new Date(sale.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3" style={{ color: "var(--cream)" }}>{prog?.program.name ?? "—"}</td>
                        <td className="px-5 py-3 font-medium" style={{ color: "var(--cream)" }}>₱{sale.amount.toFixed(2)}</td>
                        <td className="px-5 py-3 font-medium" style={{ color: "var(--gold)" }}>₱{sale.commission.toFixed(2)}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs capitalize ${sale.status === "paid" ? "bg-green-900/40 text-green-300 border border-green-600/30" : "bg-yellow-900/40 text-yellow-300 border border-yellow-600/30"}`}>
                            {sale.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
