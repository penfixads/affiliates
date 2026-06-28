"use client";

import { useState } from "react";
import { login } from "@/app/actions/auth";
import Link from "next/link";

export default function LoginPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await login(fd);
    if (res?.error) {
      setError(res.error);
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="font-cinzel text-3xl font-semibold tracking-[0.2em]" style={{ color: "var(--gold)" }}>
            BrilliantLabsPh
          </div>
          <div className="font-cinzel text-xs tracking-[0.25em] uppercase mt-1" style={{ color: "var(--cream-dim)" }}>
            Affiliate Portal
          </div>
          <div className="gold-divider mt-5 mb-0" />
        </div>

        <div className="glass-card p-8">
          <h1 className="font-playfair text-2xl font-semibold mb-1" style={{ color: "var(--gold)" }}>
            Welcome back
          </h1>
          <p className="text-sm mb-7" style={{ color: "var(--cream-dim)" }}>
            Sign in to access your affiliate content
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium tracking-widest uppercase mb-2" style={{ color: "var(--cream-dim)" }}>
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-widest uppercase mb-2" style={{ color: "var(--cream-dim)" }}>
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="field"
              />
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm border" style={{ background: "rgba(220,38,38,0.1)", borderColor: "rgba(220,38,38,0.3)", color: "#fca5a5" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={pending} className="btn-gold w-full py-3 text-sm mt-2">
              {pending ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="gold-divider" />

          <p className="text-center text-sm" style={{ color: "var(--cream-dim)" }}>
            Not an affiliate yet?{" "}
            <Link href="/apply" className="underline underline-offset-2" style={{ color: "var(--gold)" }}>
              Apply here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
