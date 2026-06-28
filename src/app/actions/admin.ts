"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateCode(length = 8) {
  return Math.random().toString(36).substr(2, length).toUpperCase();
}

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email === process.env.ADMIN_EMAIL;
}

export async function deleteApplication(applicationId: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = db();

  // Get email so we can also remove the auth user if they have no approved programs
  const { data: app } = await supabase
    .from("affiliate_applications")
    .select("email")
    .eq("id", applicationId)
    .single();

  // Delete application (cascades to application_programs)
  const { error } = await supabase
    .from("affiliate_applications")
    .delete()
    .eq("id", applicationId);

  if (error) return { error: error.message };

  // If they have no affiliate_programs (never approved), delete the auth user too
  if (app?.email) {
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const authUser = existingUsers?.users.find((u) => u.email === app.email);
    if (authUser) {
      const { data: affPrograms } = await supabase
        .from("affiliate_programs")
        .select("id")
        .eq("affiliate_id", authUser.id)
        .limit(1);
      if (!affPrograms || affPrograms.length === 0) {
        await supabase.auth.admin.deleteUser(authUser.id);
      }
    }
  }

  return { success: true };
}

export async function approveProgram(applicationId: string, programId: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = db();

  const { data: app } = await supabase
    .from("affiliate_applications")
    .select("*")
    .eq("id", applicationId)
    .single();
  if (!app) return { error: "Application not found" };

  // Auth user was created at application time — just look them up
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const userId = existingUsers?.users.find((u) => u.email === app.email)?.id;
  if (!userId) return { error: "Auth user not found. The applicant may not have completed sign-up." };

  // Ensure affiliates row exists
  const { data: existingAffiliate } = await supabase
    .from("affiliates").select("id").eq("id", userId).single();
  if (!existingAffiliate) {
    await supabase.from("affiliates").insert({
      id: userId,
      full_name: app.full_name,
      email: app.email,
      phone: app.phone,
      referral_code: generateCode(),
    });
  }

  // Create affiliate_programs row with unique referral code
  const programReferralCode = generateCode();
  const { error: apErr } = await supabase.from("affiliate_programs").upsert({
    affiliate_id: userId,
    program_id: programId,
    referral_code: programReferralCode,
  });
  if (apErr) return { error: apErr.message };

  // Update application_programs status
  await supabase
    .from("application_programs")
    .update({ status: "approved" })
    .eq("application_id", applicationId)
    .eq("program_id", programId);

  await updateApplicationOverallStatus(supabase, applicationId);
  return { success: true, referral_code: programReferralCode };
}

export async function rejectProgram(applicationId: string, programId: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = db();

  await supabase
    .from("application_programs")
    .update({ status: "rejected" })
    .eq("application_id", applicationId)
    .eq("program_id", programId);

  await updateApplicationOverallStatus(supabase, applicationId);
  return { success: true };
}

async function updateApplicationOverallStatus(supabase: ReturnType<typeof db>, applicationId: string) {
  const { data: progs } = await supabase
    .from("application_programs")
    .select("status")
    .eq("application_id", applicationId);

  if (!progs) return;
  const statuses = progs.map((p) => p.status);
  const allReviewed = statuses.every((s) => s !== "pending");
  const anyApproved = statuses.some((s) => s === "approved");

  if (allReviewed) {
    await supabase
      .from("affiliate_applications")
      .update({ status: anyApproved ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", applicationId);
  }
}

export async function addProgram(formData: FormData) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = db();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const commission_rate = Number(formData.get("commission_rate"));
  const type = formData.get("type") as string;
  const product_url = formData.get("product_url") as string;

  const { error } = await supabase.from("programs").insert({ name, slug, commission_rate, type, product_url });
  if (error) return { error: error.message };
  return { success: true };
}

export async function markSalesPaid(saleIds: string[]) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = db();
  const { error } = await supabase
    .from("sales")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .in("id", saleIds);
  if (error) return { error: error.message };
  return { success: true };
}
