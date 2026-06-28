"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type Props = {
  url: string;
  title: string;
  watermarkName: string;
  watermarkEmail: string;
};

export default function PdfViewer({ url, title, watermarkName, watermarkEmail }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageWidth, setPageWidth] = useState(700);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setPageWidth(Math.min(containerRef.current.clientWidth - 32, 800));
      }
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("selectstart", prevent);
    document.addEventListener("dragstart", prevent);

    const handleKey = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && ["p", "s", "a", "u"].includes(e.key.toLowerCase())) ||
        e.key === "F12" ||
        e.key === "PrintScreen"
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("selectstart", prevent);
      document.removeEventListener("dragstart", prevent);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  }, []);

  const watermarkText = `${watermarkName} · ${watermarkEmail}`;

  return (
    <div ref={containerRef} className="w-full max-w-[860px]" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      {/* Book title */}
      <div className="text-center mb-6">
        <h2 className="font-playfair text-lg font-semibold" style={{ color: "var(--gold)" }}>
          {title}
        </h2>
        {numPages > 0 && (
          <p className="text-xs mt-1" style={{ color: "var(--cream-dim)" }}>
            {numPages} pages · Watermarked for {watermarkName}
          </p>
        )}
      </div>

      {/* Page */}
      {url ? (
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div
              className="flex flex-col items-center justify-center h-96 gap-3"
              style={{ color: "var(--cream-dim)" }}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }}
              />
              <span className="text-sm tracking-widest uppercase">Loading…</span>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-96 text-sm" style={{ color: "#fca5a5" }}>
              Failed to load — please refresh or contact support.
            </div>
          }
        >
          <div className="relative rounded-xl overflow-hidden shadow-2xl" style={{ border: "1px solid var(--gold-border)" }}>
            <Page
              pageNumber={currentPage}
              width={pageWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
            <WatermarkOverlay text={watermarkText} />
          </div>
        </Document>
      ) : (
        <div className="flex items-center justify-center h-96 text-sm" style={{ color: "var(--cream-dim)" }}>
          Book unavailable — contact support.
        </div>
      )}

      {/* Navigation */}
      {numPages > 0 && (
        <div className="flex items-center justify-center gap-4 mt-7">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
            style={{ border: "1px solid var(--gold-border)", color: "var(--cream-dim)" }}
            onMouseOver={e => { if (currentPage > 1) { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--gold)"; } }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--cream-dim)"; }}
          >
            ← Prev
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: "var(--cream-dim)" }}>Page</span>
            <input
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (v >= 1 && v <= numPages) setCurrentPage(v);
              }}
              className="w-14 text-center text-sm rounded-lg py-1.5"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--gold-border)",
                color: "var(--cream)",
                outline: "none",
              }}
            />
            <span className="text-sm" style={{ color: "var(--cream-dim)" }}>of {numPages}</span>
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
            style={{ border: "1px solid var(--gold-border)", color: "var(--cream-dim)" }}
            onMouseOver={e => { if (currentPage < numPages) { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--gold)"; } }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--cream-dim)"; }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function WatermarkOverlay({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.15 }}>
        <defs>
          <pattern id="wm" x="0" y="0" width="340" height="160" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
            <text x="20" y="80" fontFamily="'Playfair Display', Georgia, serif" fontSize="12" fill="#C9A447" fontWeight="600" letterSpacing="1">
              {text}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wm)" />
      </svg>
      <div
        className="absolute bottom-3 right-3 text-right leading-tight"
        style={{ fontSize: "9px", color: "#C9A447", opacity: 0.6, fontFamily: "monospace" }}
      >
        {text}<br />BrilliantLabsPh Affiliate Copy
      </div>
    </div>
  );
}
