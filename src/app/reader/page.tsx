import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReaderShell from "./ReaderShell";

export default async function ReaderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check affiliate is approved (has a row in affiliates table)
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  if (!affiliate) {
    // Logged in but not yet approved
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Pending Approval</h1>
          <p className="text-gray-500">
            Your affiliate application is still under review. You'll receive an email once
            approved.
          </p>
        </div>
      </div>
    );
  }

  // Generate signed URLs for both PDFs (1-hour expiry)
  const books = [
    { id: "sbwe", title: "Still Broke While Earning", path: "still-broke-while-earning.pdf" },
    {
      id: "21day",
      title: "21-Day Financial Freedom Challenge",
      path: "21-day-financial-freedom.pdf",
    },
  ];

  const signedUrls: Record<string, string> = {};
  for (const book of books) {
    const { data } = await supabase.storage
      .from("affiliate-books")
      .createSignedUrl(book.path, 3600);
    if (data?.signedUrl) signedUrls[book.id] = data.signedUrl;
  }

  return (
    <ReaderShell
      affiliateName={affiliate.full_name}
      affiliateEmail={affiliate.email}
      books={books}
      signedUrls={signedUrls}
    />
  );
}
