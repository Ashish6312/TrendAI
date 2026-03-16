"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Printer, Building2, MapPin, Globe, CreditCard, ShieldCheck, CheckCircle2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: string;
    razorpay_payment_id: string;
    amount: string | number;
    currency: string;
    plan_name: string;
    billing_cycle: string;
    payment_date: string;
    status: string;
  } | null;
  userData: {
    name: string;
    email: string;
    company?: string;
    location?: string;
  };
}

export default function InvoiceModal({ isOpen, onClose, payment, userData }: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    
    try {
      const element = invoiceRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('printable-invoice');
          if (clonedElement) {
            clonedElement.style.padding = '60px';
            clonedElement.style.margin = '0';
            clonedElement.style.width = '1120px';
            clonedElement.style.minHeight = 'auto';
            clonedElement.style.boxShadow = 'none';
          }
        }
      });
      
      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`TrendAI-Invoice-${payment.razorpay_payment_id || 'DEMO'}.pdf`);
    } catch (error) {
      console.error("Critical PDF Failure:", error);
      alert("Encountered a system error during Direct PDF generation. Your browser's 'Print to PDF' engine is more reliable for complex layouts. Opening Print Dialog...");
      window.print();
    }
  };

  const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
  const currencySymbol = payment.currency === 'INR' ? '₹' : '$';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop - Immersive Depth */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 dark:bg-[#020617]/90 backdrop-blur-xl"
        />

        {/* Modal - Institutional Control Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 30 }}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Action Bar - Tactical Utility */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center gap-4 sm:justify-between backdrop-blur-md">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-500 mb-0.5">Invoice Details</span>
                <h2 className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">Your Payment Receipt</h2>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-white/5 mx-1 hidden sm:block" />
              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white text-[9px] sm:text-[11px] font-black uppercase tracking-widest transition-all border border-slate-200 dark:border-white/5 shadow-sm group"
                >
                  <Printer size={12} className="group-hover:scale-110 transition-transform" />
                  <span className="hidden xs:inline">Print / Save PDF</span>
                  <span className="xs:hidden">Print</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[9px] sm:text-[11px] font-black uppercase tracking-widest transition-all border border-blue-400/30 shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] group"
                >
                  <Download size={12} className="group-hover:-translate-y-0.5 transition-transform" />
                  <span className="hidden xs:inline">Download Direct</span>
                  <span className="xs:hidden">Save</span>
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center border border-slate-200 dark:border-white/5"
            >
              <X size={18} />
            </button>
          </div>

          {/* Invoice Body - Professional Executive Dossier */}
          <div className="flex-1 overflow-auto bg-slate-100 p-2 sm:p-4 md:p-8 custom-scrollbar">
            <div 
              className="mx-auto bg-white shadow-2xl overflow-hidden printable-area origin-top transition-transform duration-500" 
              id="printable-invoice" 
              ref={invoiceRef}
              style={{ 
                width: '210mm', 
                minHeight: '297mm', 
                color: '#0f172a', 
                backgroundColor: '#ffffff',
                padding: '10mm sm:20mm'
              }}
            >
            <div className="relative">
              {/* Institutional Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none">
                <div className="w-96 h-96 border-[30px] border-slate-900 rounded-full flex items-center justify-center">
                  <span className="text-[150px] font-black text-slate-900">T</span>
                </div>
              </div>

              {/* Master Header - Clinical Hierarchy */}
              {/* Master Header - Clinical Hierarchy */}
              <div className="grid grid-cols-2 justify-between items-start gap-12 mb-20 relative z-10 w-full">
                <div className="space-y-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#2563eb] rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl">
                      T
                    </div>
                    <div>
                      <h1 className="text-3xl font-black tracking-tighter text-[#0f172a] italic">TrendAI</h1>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Premium Services</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 border-l-4 border-[#2563eb] rounded-r-xl max-w-[280px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Billed From</p>
                    <div className="text-[11px] text-slate-600 font-bold leading-relaxed">
                      <p>TrendAI Intelligence Corp.</p>
                      <p>123 High-Alpha Way, Strategic District</p>
                      <p>Palo Alto, CA 94301, USA</p>
                      <p className="text-[#2563eb] mt-1 italic">intelligence@trendai.io</p>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-4">
                  <div>
                    <h2 className="text-6xl font-black text-slate-900 uppercase tracking-tighter opacity-10 leading-none">INVOICE</h2>
                    <p className="text-xl font-black text-slate-900 mt-[-15px] italic">Payment Record</p>
                  </div>
                  <div className="inline-flex flex-col items-end gap-2 pt-6">
                    <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-lg shadow-lg">
                      {payment.status === 'success' ? 'Settled' : 'Pending'}
                    </span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {payment.razorpay_payment_id?.toUpperCase() || 'PROV-INTEL'}</p>
                  </div>
                </div>
              </div>

              {/* Stakeholder Alignment Grid */}
              <div className="grid grid-cols-2 gap-12 mb-16 py-10 border-y border-slate-900/10 relative z-10">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#2563eb] mb-2 italic">Billed To</h3>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 min-h-[140px] flex flex-col justify-between">
                      <div>
                        <p className="font-black text-xl text-slate-900 tracking-tighter mb-0.5">{userData.name}</p>
                        <p className="text-sm text-slate-500 font-bold">{userData.email}</p>
                      </div>
                      {(userData.company || userData.location) && (
                        <div className="pt-4 border-t border-slate-200 flex flex-col gap-1.5">
                          {userData.company && (
                             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                               <Building2 size={12} /> {userData.company}
                             </div>
                          )}
                          {userData.location && (
                             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                               <MapPin size={12} /> {userData.location}
                             </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col justify-end gap-6 pb-6">
                    <div>
                      <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Issue Date</h3>
                      <p className="text-xl font-black text-slate-900">{new Date(payment.payment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div>
                      <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Payment Reference</h3>
                      <p className="font-mono text-xs font-bold text-[#2563eb] bg-blue-50 px-4 py-2 rounded-xl inline-block border border-blue-100 italic">{payment.razorpay_payment_id || 'DEMO'}</p>
                    </div>
                </div>
              </div>

              {/* Transaction Ledger */}
              <div className="mb-20 relative z-10">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-4 border-slate-900 text-slate-900">
                      <th className="pb-6 text-left text-[11px] font-black uppercase tracking-[0.4em]">Item Description</th>
                      <th className="pb-6 text-center text-[11px] font-black uppercase tracking-[0.4em]">Qty</th>
                      <th className="pb-6 text-center text-[11px] font-black uppercase tracking-[0.4em]">Rate</th>
                      <th className="pb-6 text-right text-[11px] font-black uppercase tracking-[0.4em]">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-8">
                        <div className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                              <ShieldCheck size={20} />
                           </div>
                           <div>
                              <p className="font-black text-xl text-slate-900 tracking-tighter mb-1 italic">{payment.plan_name}</p>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">TrendAI Subscription - {payment.billing_cycle} Slot</p>
                           </div>
                        </div>
                      </td>
                      <td className="py-12 text-center font-black text-slate-900 text-lg">01</td>
                      <td className="py-12 text-center font-bold text-slate-600 italic">{currencySymbol}{amount.toLocaleString()}</td>
                      <td className="py-12 text-right font-black text-slate-900 text-xl tracking-tighter">{currencySymbol}{amount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Consolidation */}
              <div className="flex flex-col md:flex-row justify-between items-end gap-12 relative z-10">
                <div className="max-w-xs space-y-4 pt-12">
                   <div className="flex items-center gap-3 text-[#10b981] bg-[#10b981]/10 px-6 py-3 rounded-2xl border border-[#10b981]/20 shadow-sm">
                      <CheckCircle2 size={18} />
                      <span className="text-xs font-black uppercase tracking-[0.2em]">Payment Successful</span>
                   </div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                     This receipt serves as proof of payment for your TrendAI subscription. 
                     All features are now active and ready to use.
                   </p>
                </div>

                <div className="w-full max-w-md bg-slate-900 p-10 rounded-[2.5rem] shadow-3xl text-white">
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Subtotal</span>
                      <span className="font-black text-lg">{currencySymbol}{amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Processing Fees</span>
                      <span className="font-black text-lg">{currencySymbol}0.00</span>
                    </div>
                  </div>
                  <div className="h-px bg-white/10 mb-8" />
                  <div className="flex justify-between items-center">
                    <div>
                       <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400 block mb-1 uppercase tracking-[0.5em]">Total Paid</span>
                       <span className="text-5xl font-black italic tracking-tighter leading-none">{currencySymbol}{amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Institutional Footer */}
              <div className="mt-40 pt-12 border-t border-slate-100 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black text-slate-300 italic">
                  <div className="flex items-center gap-2">
                     <ShieldCheck size={14} className="text-[#2563eb]" />
                     <span className="uppercase tracking-[0.3em]">Authorized Deployment Hub</span>
                  </div>
                  <div className="flex gap-10">
                    <span className="uppercase tracking-[0.3em]">TrendAI.Corp/HQ-A1</span>
                    <span className="uppercase tracking-[0.3em]">Secure UUID: {String(payment.id || '').slice(0,8)}</span>
                    <span className="uppercase tracking-[0.3em]">© 2026 Global Intelligence</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </motion.div>

        {/* Precision Print Engine - Institutional Hardening */}
        <style jsx global>{`
          @media print {
            /* Full-Page Reset */
            @page {
              size: A4;
              margin: 0;
            }
            body {
              background: white !important;
            }
            body > *:not(#portal-root) {
              display: none !important;
            }
            #printable-invoice, #printable-invoice * {
              visibility: visible !important;
              color: #000 !important;
              font-family: sans-serif !important;
            }
            #printable-invoice {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              padding: 20mm !important;
              margin: 0 !important;
              background: white !important;
              box-shadow: none !important;
              border: none !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* institutional Typography Enforcement */
            .text-slate-900 { color: #000 !important; }
            .text-slate-400 { color: #64748b !important; }
            .text-blue-600, .text-[#2563eb] { color: #2563eb !important; }
            .bg-slate-900 { background-color: #0f172a !important; color: #ffffff !important; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .border-slate-900 { border-color: #0f172a !important; }
            
            /* Remove UI Overlays */
            button, .custom-scrollbar::-webkit-scrollbar {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </AnimatePresence>
  );
}

