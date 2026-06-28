import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = db();

  // Look up affiliate_programs by referral_code
  const { data: ap } = await supabase
    .from("affiliate_programs")
    .select("affiliate_id, program_id, program:programs(product_url, slug)")
    .eq("referral_code", code)
    .single();

  if (!ap) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Hash IP for privacy
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const ip_hash = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  const user_agent = request.headers.get("user-agent") ?? "";

  // Log click (fire-and-forget)
  supabase.from("referral_clicks").insert({
    referral_code: code,
    program_id: ap.program_id,
    affiliate_id: ap.affiliate_id,
    ip_hash,
    user_agent,
  }).then(() => {});

  // Redirect to product URL
  const program = ap.program as unknown as { product_url: string; slug: string };
  const destination = program?.product_url ?? "/";
  return NextResponse.redirect(destination);
}
