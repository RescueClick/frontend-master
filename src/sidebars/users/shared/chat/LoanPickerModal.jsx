import React, { useState, useEffect } from "react";
import { Search, X, FileText, Loader2 } from "lucide-react";
import { chatService } from "./chatService";

const STATUS_STYLE = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  DISBURSED: "bg-emerald-100 text-emerald-700",
  AGREEMENT: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  DOC_COMPLETE: "bg-amber-100 text-amber-800",
  UNDER_REVIEW: "bg-orange-100 text-orange-700",
  LOGIN: "bg-sky-100 text-sky-700",
  SUBMITTED: "bg-slate-100 text-slate-700",
};

export default function LoanPickerModal({ isOpen, onClose, onSelectLoan }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setResults([]);
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const data = await chatService.searchLoans(searchTerm);
        setResults(data.loans || []);
      } catch (err) {
        console.error("Error searching loans:", err);
        setError("Failed to search applications");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                Attach Loan Application
              </h3>
              <p className="text-xs text-slate-500">
                Search by App No, name, mobile, PAN or email
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              placeholder="e.g. TLC0192, applicant name, mobile…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {loading ? (
              <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-teal-600 animate-spin" />
            ) : searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {searchTerm.trim().length < 2 && (
            <div className="py-10 text-center text-slate-400 text-sm">
              Type at least 2 characters to search…
            </div>
          )}

          {searchTerm.trim().length >= 2 && !loading && results.length === 0 && !error && (
            <div className="py-10 text-center text-slate-400 text-sm">
              No applications matching &quot;{searchTerm}&quot;
            </div>
          )}

          {results.map((loan) => (
            <button
              key={loan.applicationId}
              type="button"
              onClick={() => {
                onSelectLoan(loan);
                onClose();
              }}
              className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-teal-50/70 border border-slate-100 hover:border-teal-200 transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="font-mono text-sm font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                    {loan.applicationNumber}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                    {(loan.loanType || "").replace(/_/g, " ")}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      STATUS_STYLE[loan.status] || "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {loan.status}
                  </span>
                </div>
                <p className="mt-1.5 font-semibold text-slate-900 text-sm truncate">
                  {loan.applicantName}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  {loan.phone ? <span>📱 {loan.phone}</span> : null}
                  {loan.panNumber ? <span>PAN {loan.panNumber}</span> : null}
                  {loan.amount ? (
                    <span className="font-medium text-slate-700">
                      ₹{Number(loan.amount).toLocaleString("en-IN")}
                    </span>
                  ) : null}
                </div>
              </div>
              <span className="shrink-0 text-xs font-semibold text-teal-700 bg-white border border-teal-200 group-hover:bg-teal-600 group-hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                Attach
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
