import React from "react";
import MetaLeadSheetPanel from "../../../components/shared/MetaLeadSheetPanel";

export default function MetaLeadAuditorPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          Meta Leads & Bulk Data Auditor
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload Facebook/Meta lead ad exports or partner campaign sheets to filter existing partners and customers, download fresh leads, and trace lead history.
        </p>
      </div>

      <MetaLeadSheetPanel defaultOpen={true} />
    </div>
  );
}
