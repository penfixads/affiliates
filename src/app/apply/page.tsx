import { createClient as createServiceClient } from "@supabase/supabase-js";
import ApplyForm from "./ApplyForm";

async function getPrograms() {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from("programs")
    .select("id, name, slug, type")
    .eq("active", true)
    .order("created_at");
  return data ?? [];
}

export default async function ApplyPage() {
  const programs = await getPrograms();
  return <ApplyForm programs={programs} />;
}
