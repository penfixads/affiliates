import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-14">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/apply"
          className="inline-flex items-center gap-1.5 text-xs tracking-widest uppercase mb-8 transition-colors"
          style={{ color: "var(--cream-dim)" }}
        >
          ← Back to application
        </Link>

        <div className="glass-card p-10">
          <div className="mb-6">
            <div className="font-playfair text-3xl font-bold mb-1" style={{ color: "var(--gold)" }}>
              Terms & Conditions
            </div>
            <p className="text-xs tracking-widest uppercase" style={{ color: "var(--cream-dim)" }}>
              BrilliantLabsPh Affiliate Program · June 2025
            </p>
          </div>

          <div className="gold-divider" />

          <div className="space-y-7 text-sm leading-relaxed" style={{ color: "var(--cream-dim)" }}>
            {[
              {
                title: "1. Access & Use",
                body: "Your affiliate account grants you personal, non-transferable access to designated BrilliantLabsPh digital content. Access is strictly for your personal review and promotion purposes only.",
              },
              {
                title: "2. Content Protection",
                body: "You may not copy, download, screenshot, print, screen-record, or distribute any content accessed through the affiliate portal. All sessions are watermarked and monitored.",
              },
              {
                title: "3. Watermarking & Tracking",
                body: "Every page you view is dynamically watermarked with your name and email address. Any unauthorized copy found online will be traceable to your account, which will result in immediate termination and possible legal action.",
              },
              {
                title: "4. Account Security",
                body: "You are responsible for keeping your login credentials secure. Do not share your account with others. BrilliantLabsPh reserves the right to revoke access at any time.",
              },
              {
                title: "5. Termination",
                body: "Violation of any of these terms will result in immediate account termination and may result in legal proceedings for intellectual property infringement.",
              },
            ].map(({ title, body }) => (
              <section key={title}>
                <h2 className="font-playfair font-semibold text-base mb-2" style={{ color: "var(--cream)" }}>
                  {title}
                </h2>
                <p>{body}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
