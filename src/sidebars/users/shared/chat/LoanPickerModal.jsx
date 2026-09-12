import React, { useState, useEffect } from "react";
import { Search, X, FileText, CheckCircle2, Loader2, IndianRupee } from "lucide-react";
import { chatService } from "./chatService";

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
      return;
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
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
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
                Share a loan file for credit/documentation queries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
              placeholder="Search by Application No., Applicant Name, Mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {loading ? (
              <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-teal-600 animate-spin" />
            ) : searchTerm ? (
              <button
                onClick={() => setSearchTerm("")}
                className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-100">
          {searchTerm.trim().length < 2 && (
            <div className="py-10 text-center text-slate-400 text-xs sm:text-sm">
              Type at least 2 characters to search applications...
            </div>
          )}

          {searchTerm.trim().length >= 2 && !loading && results.length === 0 && (
            <div className="py-10 text-center text-slate-400 text-xs sm:text-sm">
              No applications matching "{searchTerm}"
            </div>
          )}

          {results.map((loan) => (
            <div
              key={loan.applicationId}
              onClick={() => {
                onSelectLoan(loan);
                onClose();
              }}
              className="pt-2 first:pt-0 pb-2 flex items-center justify-between p-3 rounded-xl hover:bg-teal-50/60 cursor-pointer transition-colors border border-transparent hover:border-teal-100 group"
            >
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-800 text-sm truncate">
                    {loan.applicantName}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                    {loan.loanType}
                  </span>
                </div>
                <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                  <span className="font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                    {loan.applicationNumber}
                  </span>
                  {loan.amount ? (
                    <span className="flex items-center text-slate-700 font-medium">
                      ₹{Number(loan.amount).toLocaleString("en-IN")}
                    </span>
                  ) : null}
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      loan.status === "APPROVED" || loan.status === "DISBURSED"
                        ? "bg-emerald-100 text-emerald-700"
                        : loan.status === "REJECTED"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {loan.status}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-teal-600 bg-white border border-teal-200 group-hover:bg-teal-600 group-hover:text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Attach
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
