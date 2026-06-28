"use server";

import { createClient } from "@supabase/supabase-js";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function submitApplication(formData: FormData) {
  const supabase = db();

  const full_name   = formData.get("full_name") as string;
  const email       = formData.get("email") as string;
  const phone       = formData.get("phone") as string;
  const reason      = formData.get("reason") as string;
  const password    = formData.get("password") as string;
  const program_ids = formData.getAll("program_ids") as string[];

  if (!full_name || !email || !phone || !reason || !password) return { error: "All fields are required." };
  if (program_ids.length === 0) return { error: "Select at least one program." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  // Check for duplicate application
  const { data: existing } = await supabase
    .from("affiliate_applications")
    .select("id")
    .eq("email", email)
    .single();
  if (existing) return { error: "An application with this email already exists." };

  // Create auth user immediately so they can log in (but see "pending" until approved)
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification
    user_metadata: { full_name, phone },
  });
  if (authErr) return { error: authErr.message };

  // Insert application
  const { data: app, error: appErr } = await supabase
    .from("affiliate_applications")
    .insert({ full_name, email, phone, reason, status: "pending", program_ids })
    .select("id")
    .single();

  if (appErr || !app) {
    // Rollback: delete the auth user we just created
    await supabase.auth.admin.deleteUser(authData.user!.id);
    return { error: appErr?.message ?? "Failed to submit." };
  }

  // Create per-program application rows
  const rows = program_ids.map((program_id) => ({
    application_id: app.id,
    program_id,
    status: "pending",
  }));
  const { error: progErr } = await supabase.from("application_programs").insert(rows);
  if (progErr) return { error: progErr.message };

  return { success: true };
}
