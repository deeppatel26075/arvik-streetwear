'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, Download } from 'lucide-react';
import type { Order } from '@/lib/orders';
import { buildInvoiceHtml, downloadInvoice, getInvoiceQrDataUrl, INVOICE_WIDTH_PX } from '@/lib/invoice';

interface InvoiceViewModalProps {
  order: Order;
  onClose: () => void;
}

// Reuses the exact same buildInvoiceHtml() markup the PDF download uses —
// this is a live, on-page rendering of that HTML rather than a second
// invoice design, so the two never drift apart. Printing (Ctrl+P or the
// button below) uses the classic "hide everything except this element"
// @media print trick, which works regardless of the surrounding page's
// DOM structure (navbar, footers, etc. all disappear on paper/PDF-from-
// print without needing to touch those components).
export default function InvoiceViewModal({ order, onClose }: InvoiceViewModalProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [scale, setScale] = useState(1);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const measureRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getInvoiceQrDataUrl(order, window.location.origin).then((qrDataUrl) => {
      if (!cancelled) setHtml(buildInvoiceHtml(order, { qrDataUrl }));
    });
    return () => {
      cancelled = true;
    };
  }, [order]);

  // The invoice document is a fixed INVOICE_WIDTH_PX wide, matching A4
  // proportions for the PDF path — on screen it's scaled down to fit
  // narrower viewports (phones, a narrow browser window) via CSS
  // transform rather than reflowing the shared markup, so the PDF layout
  // this same HTML produces never changes.
  useEffect(() => {
    if (!html) return;
    const measure = () => {
      const available = viewportRef.current?.clientWidth || window.innerWidth;
      const nextScale = Math.min(1, (available - 24) / INVOICE_WIDTH_PX);
      setScale(nextScale > 0 ? nextScale : 1);
      if (measureRef.current) setNaturalHeight(measureRef.current.scrollHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [html]);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadInvoice(order);
    } catch (err) {
      console.error('Failed to generate invoice PDF:', err);
      alert('Could not generate the invoice right now. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950/60 backdrop-blur-xs">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #arviik-invoice-print, #arviik-invoice-print * { visibility: visible; }
          #arviik-invoice-print {
            position: absolute; top: 0; left: 0;
            transform: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white border-b border-stone-200 shadow-sm">
        <h2 className="font-syne font-extrabold text-xs sm:text-sm uppercase tracking-wider text-stone-900">
          Invoice
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border border-stone-300 text-stone-700 rounded-xs hover:bg-stone-50 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-stone-950 text-white rounded-xs hover:bg-stone-800 transition-colors disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{downloading ? 'Generating...' : 'Download'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-stone-900 transition-colors"
            aria-label="Close invoice"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <div ref={viewportRef} className="flex-1 overflow-y-auto p-3 sm:p-8 flex justify-center">
        {html ? (
          <div style={{ width: INVOICE_WIDTH_PX * scale, height: naturalHeight * scale || undefined }}>
            <div
              id="arviik-invoice-print"
              ref={measureRef}
              className="bg-white shadow-2xl"
              style={{ width: INVOICE_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: 'top left' }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        ) : (
          <div className="no-print text-white text-xs font-bold uppercase tracking-widest py-20">Loading invoice...</div>
        )}
      </div>
    </div>
  );
}
