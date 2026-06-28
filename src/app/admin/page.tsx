import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AdminDashboard from "./AdminDashboard";

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect("/login");

  const svc = db();

  const [
    { data: applications },
    { data: programs },
    { data: affiliates },
    { data: sales },
  ] = await Promise.all([
    svc.from("affiliate_applications").select(`
      *,
      application_programs (
        id, status,
        program:programs ( id, name, slug, type )
      )
    `).order("created_at", { ascending: false }),
    svc.from("programs").select("*").order("created_at"),
    svc.from("affiliates").select(`
      *,
      affiliate_programs (
        id, referral_code,
        program:programs ( id, name, slug, type )
      )
    `).order("created_at", { ascending: false }),
    svc.from("sales").select("*, program:programs(name), affiliate:affiliates(full_name, email)")
      .order("created_at", { ascending: false }),
  ]);

  // Attach click counts per referral_code
  const { data: clicks } = await svc
    .from("referral_clicks")
    .select("referral_code");

  const clickCounts: Record<string, number> = {};
  (clicks ?? []).forEach((c) => {
    clickCounts[c.referral_code] = (clickCounts[c.referral_code] ?? 0) + 1;
  });

  return (
    <AdminDashboard
      applications={applications ?? []}
      programs={programs ?? []}
      affiliates={affiliates ?? []}
      sales={sales ?? []}
      clickCounts={clickCounts}
    />
  );
}
