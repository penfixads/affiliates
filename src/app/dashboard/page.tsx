import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import DashboardShell from "./DashboardShell";
import { logout } from "@/app/actions/auth";

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = db();

  const { data: affiliate } = await svc
    .from("affiliates")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!affiliate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="glass-card p-12 max-w-md w-full text-center">
          <div className="text-4xl mb-4" style={{ color: "var(--gold)" }}>⏳</div>
          <h1 className="font-playfair text-2xl mb-2" style={{ color: "var(--gold)" }}>Pending Approval</h1>
          <div className="gold-divider" />
          <p style={{ color: "var(--cream-dim)" }}>
            Your application is under review. You'll receive an email once approved.
          </p>
          <form action={logout} className="mt-8">
            <button
              type="submit"
              className="text-sm px-5 py-2 rounded-lg border transition-all"
              style={{ borderColor: "var(--gold-border)", color: "var(--cream-dim)" }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    );
  }

  const [
    { data: affiliatePrograms },
    { data: clicks },
    { data: sales },
  ] = await Promise.all([
    svc.from("affiliate_programs")
      .select("*, program:programs(*)")
      .eq("affiliate_id", user.id),
    svc.from("referral_clicks")
      .select("referral_code")
      .eq("affiliate_id", user.id),
    svc.from("sales")
      .select("*")
      .eq("affiliate_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const clickCounts: Record<string, number> = {};
  (clicks ?? []).forEach((c) => {
    clickCounts[c.referral_code] = (clickCounts[c.referral_code] ?? 0) + 1;
  });

  return (
    <DashboardShell
      affiliate={affiliate}
      affiliatePrograms={affiliatePrograms ?? []}
      clickCounts={clickCounts}
      sales={sales ?? []}
    />
  );
}
