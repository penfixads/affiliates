"use client";

import { useState } from "react";
import { submitApplication } from "@/app/actions/apply";
import Link from "next/link";

type Program = { id: string; name: string; slug: string; type: string };

const TYPE_LABELS: Record<string, string> = {
  bibliotech: "Bibliotech",
  solutions: "Solutions",
};

export default function ApplyForm({ programs }: { programs: Program[] }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function toggleProgram(id: string) {
    setSelectedPrograms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordError(null);
    if (!agreed || selectedPrograms.length === 0) return;
    if (password.length < 8) { setPasswordError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
    setPending(true);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    selectedPrograms.forEach((id) => fd.append("program_ids", id));
    const res = await submitApplication(fd);
    setResult(res ?? { success: true });
    setPending(false);
  }

  if (result?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-12 max-w-md w-full text-center">
          <div className="text-4xl mb-6" style={{ color: "var(--gold)" }}>✦</div>
          <h1 className="font-playfair text-3xl mb-3" style={{ color: "var(--gold)" }}>
            Application Received
          </h1>
          <div className="gold-divider" />
          <p style={{ color: "var(--cream-dim)" }} className="leading-relaxed">
            Thank you for applying to the BrilliantLabsPh Affiliate Program. We'll review your
            application and reach out within 2–3 business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="font-cinzel text-3xl font-semibold tracking-[0.2em]" style={{ color: "var(--gold)" }}>
            BrilliantLabsPh
          </div>
          <div className="font-cinzel text-xs tracking-[0.25em] uppercase mt-1" style={{ color: "var(--cream-dim)" }}>
            Affiliate Program
          </div>
          <div className="gold-divider mt-5 mb-0" />
        </div>

        <div className="glass-card p-8">
          <h1 className="font-playfair text-2xl font-semibold mb-1" style={{ color: "var(--gold)" }}>
            Apply for Access
          </h1>
          <p className="text-sm mb-7" style={{ color: "var(--cream-dim)" }}>
            Already approved?{" "}
            <Link href="/login" className="underline underline-offset-2" style={{ color: "var(--gold)" }}>
              Sign in here
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Program selection */}
            <div>
              <label className="block text-xs font-medium tracking-widest uppercase mb-3" style={{ color: "var(--cream-dim)" }}>
                Select Programs to Promote <span style={{ color: "var(--gold)" }}>*</span>
              </label>
              <div className="space-y-2">
                {programs.map((p) => {
                  const checked = selectedPrograms.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 cursor-pointer rounded-lg px-4 py-3 transition-all"
                      style={{
                        border: `1px solid ${checked ? "var(--gold)" : "var(--gold-border)"}`,
                        background: checked ? "rgba(201,164,71,0.07)" : "rgba(255,255,255,0.02)",
                      }}
                    >
                      {/* Custom checkbox */}
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          border: `1px solid ${checked ? "var(--gold)" : "rgba(201,164,71,0.4)"}`,
                          background: checked ? "var(--gold)" : "transparent",
                        }}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#0D1B2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleProgram(p.id)}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{ color: "var(--cream)" }}>
                          {p.name}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--cream-dim)" }}>
                          {TYPE_LABELS[p.type] ?? p.type}
                        </div>
                      </div>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "var(--gold-dim)", color: "var(--gold)" }}
                      >
                        20% commission
                      </span>
                    </label>
                  );
                })}
              </div>
              {selectedPrograms.length === 0 && (
                <p className="text-xs mt-2" style={{ color: "rgba(232,224,208,0.35)" }}>
                  Select at least one program to continue.
                </p>
              )}
            </div>

            <div className="gold-divider !my-2" />

            {/* Personal details */}
            <div>
              <label className="block text-xs font-medium tracking-widest uppercase mb-2" style={{ color: "var(--cream-dim)" }}>
                Full Name
              </label>
              <input name="full_name" required placeholder="Maria Santos" className="field" />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-widest uppercase mb-2" style={{ color: "var(--cream-dim)" }}>
                Email Address
              </label>
              <input name="email" type="email" required placeholder="you@example.com" className="field" />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-widest uppercase mb-2" style={{ color: "var(--cream-dim)" }}>
                Phone Number
              </label>
              <input name="phone" type="tel" required placeholder="+63 912 345 6789" className="field" />
            </div>

            <div className="gold-divider !my-1" />

            <div>
              <label className="block text-xs font-medium tracking-widest uppercase mb-2" style={{ color: "var(--cream-dim)" }}>
                Create Password
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-widest uppercase mb-2" style={{ color: "var(--cream-dim)" }}>
                Confirm Password
              </label>
              <input
                name="confirm_password"
                type="password"
                required
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="field"
              />
              {passwordError && (
                <p className="text-xs mt-1.5" style={{ color: "#fca5a5" }}>{passwordError}</p>
              )}
            </div>

            <div className="gold-divider !my-1" />

            <div>
              <label className="block text-xs font-medium tracking-widest uppercase mb-2" style={{ color: "var(--cream-dim)" }}>
                Why do you want to be an affiliate?
              </label>
              <textarea name="reason" required rows={4} placeholder="Tell us about yourself and your goals…" className="field resize-none" />
            </div>

            {/* T&C */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 flex-shrink-0">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="sr-only" />
                <div
                  className="w-4 h-4 rounded flex items-center justify-center transition-all"
                  style={{
                    border: `1px solid ${agreed ? "var(--gold)" : "var(--gold-border)"}`,
                    background: agreed ? "var(--gold)" : "transparent",
                  }}
                >
                  {agreed && (
                    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#0D1B2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm leading-relaxed" style={{ color: "var(--cream-dim)" }}>
                I agree to the{" "}
                <Link href="/terms" className="underline underline-offset-2" style={{ color: "var(--gold)" }}>
                  Terms & Conditions
                </Link>{" "}
                of the BrilliantLabsPh Affiliate Program, including the content access and non-distribution agreement.
              </span>
            </label>

            {result?.error && (
              <div className="rounded-lg px-4 py-3 text-sm border" style={{ background: "rgba(220,38,38,0.1)", borderColor: "rgba(220,38,38,0.3)", color: "#fca5a5" }}>
                {result.error}
              </div>
            )}

            <button
              type="submit"
              disabled={!agreed || selectedPrograms.length === 0 || pending}
              className="w-full py-3 text-sm font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--gold)", color: "#0D1B2A", letterSpacing: "0.05em" }}
              onMouseOver={e => { if (agreed && selectedPrograms.length > 0 && !pending) (e.currentTarget.style.boxShadow = "0 0 24px rgba(201,164,71,0.5)"); }}
              onMouseOut={e => { (e.currentTarget.style.boxShadow = "none"); }}
            >
              {pending ? "Submitting…" : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
