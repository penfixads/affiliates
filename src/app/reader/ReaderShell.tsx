"use client";

import { useState } from "react";
import { logout } from "@/app/actions/auth";
import PdfViewer from "./PdfViewer";

type Book = { id: string; title: string; path: string };

export default function ReaderShell({
  affiliateName,
  affiliateEmail,
  books,
  signedUrls,
}: {
  affiliateName: string;
  affiliateEmail: string;
  books: Book[];
  signedUrls: Record<string, string>;
}) {
  const [activeBook, setActiveBook] = useState<Book>(books[0]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Security banner */}
      <div
        className="text-center py-2.5 px-4 text-xs font-medium tracking-wide border-b"
        style={{ background: "rgba(201,164,71,0.08)", borderColor: "var(--gold-border)", color: "var(--gold)" }}
      >
        🔒 This session is tracked and watermarked with your identity. Sharing or distributing this content violates your affiliate agreement.
      </div>

      {/* Top nav */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ borderColor: "var(--gold-border)", background: "rgba(13,27,42,0.97)", backdropFilter: "blur(12px)" }}
      >
        <div>
          <span className="font-cinzel text-lg font-semibold tracking-widest" style={{ color: "var(--gold)" }}>
            BrilliantLabsPh
          </span>
          <span className="ml-3 text-xs tracking-widest uppercase" style={{ color: "var(--cream-dim)" }}>
            Affiliate Reader
          </span>
        </div>

        {/* Book tabs */}
        <div className="flex gap-2 hidden sm:flex">
          {books.map((book) => (
            <button
              key={book.id}
              onClick={() => setActiveBook(book)}
              className="px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all"
              style={
                activeBook.id === book.id
                  ? { background: "var(--gold)", color: "#0D1B2A" }
                  : { color: "var(--cream-dim)", border: "1px solid var(--gold-border)" }
              }
            >
              {book.id === "sbwe" ? "Still Broke While Earning" : "21-Day Challenge"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <span className="text-xs hidden lg:block" style={{ color: "var(--cream-dim)" }}>
            {affiliateName}
          </span>
          <form action={logout}>
            <button
              className="text-xs tracking-wide transition-colors"
              style={{ color: "var(--cream-dim)" }}
              onMouseOver={e => (e.currentTarget.style.color = "var(--gold)")}
              onMouseOut={e => (e.currentTarget.style.color = "var(--cream-dim)")}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Mobile book switcher */}
      <div className="flex sm:hidden gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--gold-border)" }}>
        {books.map((book) => (
          <button
            key={book.id}
            onClick={() => setActiveBook(book)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
            style={
              activeBook.id === book.id
                ? { background: "var(--gold)", color: "#0D1B2A" }
                : { color: "var(--cream-dim)", border: "1px solid var(--gold-border)" }
            }
          >
            {book.id === "sbwe" ? "Still Broke" : "21-Day"}
          </button>
        ))}
      </div>

      {/* Reader */}
      <main className="flex-1 flex flex-col items-center py-8 px-4">
        <PdfViewer
          key={activeBook.id}
          url={signedUrls[activeBook.id]}
          title={activeBook.title}
          watermarkName={affiliateName}
          watermarkEmail={affiliateEmail}
        />
      </main>
    </div>
  );
}
