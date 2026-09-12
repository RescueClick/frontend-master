import React, { useState } from "react";
import LapLoanSalaried from "./LapLoanSalaried";
import LapLoanSelfEmployee from "./LapLoanSelfEmployee";
import { User, Store } from "lucide-react";

export default function LapLoan({ embed = false } = {}) {
  const [activeTab, setActiveTab] = useState("salaried"); // 'salaried' | 'self-employed'

  return (
    <div className="w-full">
      {/* Switcher Tab Header */}
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-2">
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-2 max-w-md mx-auto mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("salaried")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === "salaried"
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/25"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <User className="w-4 h-4" />
            LAP (Salaried)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("self-employed")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === "self-employed"
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/25"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Store className="w-4 h-4" />
            LAP (Self-Employed)
          </button>
        </div>
      </div>

      {/* Render selected form */}
      {activeTab === "salaried" ? (
        <LapLoanSalaried embed={embed} />
      ) : (
        <LapLoanSelfEmployee embed={embed} />
      )}
    </div>
  );
}
