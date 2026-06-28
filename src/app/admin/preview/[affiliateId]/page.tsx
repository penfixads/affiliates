import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import DashboardShell from "@/app/dashboard/DashboardShell";
import Link from "next/link";

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function AffiliatePreviewPage({
  params,
}: {
  params: Promise<{ affiliateId: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect("/login");

  const { affiliateId } = await params;
  const svc = db();

  const { data: affiliate } = await svc
    .from("affiliates")
    .select("*")
    .eq("id", affiliateId)
    .single();

  if (!affiliate) redirect("/admin");

  const [
    { data: affiliatePrograms },
    { data: clicks },
    { data: sales },
  ] = await Promise.all([
    svc.from("affiliate_programs")
      .select("*, program:programs(*)")
      .eq("affiliate_id", affiliateId),
    svc.from("referral_clicks")
      .select("referral_code")
      .eq("affiliate_id", affiliateId),
    svc.from("sales")
      .select("*")
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false }),
  ]);

  const clickCounts: Record<string, number> = {};
  (clicks ?? []).forEach((c) => {
    clickCounts[c.referral_code] = (clickCounts[c.referral_code] ?? 0) + 1;
  });

  return (
    <div>
      {/* Admin preview banner */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-2 text-xs font-medium"
        style={{ background: "rgba(201,164,71,0.15)", borderBottom: "1px solid var(--gold-border)", color: "var(--gold)" }}>
        <span>👁 Admin preview — viewing as <strong>{affiliate.full_name}</strong></span>
        <Link href="/admin"
          className="px-3 py-1 rounded-lg transition-all text-xs"
          style={{ background: "var(--gold)", color: "#0D1B2A", fontWeight: 600 }}>
          ← Back to Admin
        </Link>
      </div>
      <DashboardShell
        affiliate={affiliate}
        affiliatePrograms={affiliatePrograms ?? []}
        clickCounts={clickCounts}
        sales={sales ?? []}
      />
    </div>
  );
}
