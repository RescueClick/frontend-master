import React, { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRsmPartners } from "../../../feature/thunks/rsmThunks";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import AppAntTable from "../../../components/shared/AppAntTable";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";
import EntityStatusBadge from "../../../components/shared/EntityStatusBadge";
import toast from "react-hot-toast";
import { downloadXlsx } from "../../../utils/downloadXlsx";
import { INDIAN_STATE_FILTER_OPTIONS } from "../../../utils/indianStates";

export default function RsmPartners() {
  const dispatch = useDispatch();
  const { data = [], loading, error } = useSelector(
    (state) => state.rsm?.partners || { data: [], loading: false, error: null }
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("All");

  useEffect(() => {
    dispatch(fetchRsmPartners());
  }, [dispatch]);

  const stateOptions = INDIAN_STATE_FILTER_OPTIONS;

  const filteredPartners = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    const selectedState =
      stateFilter === "All" ? "" : stateFilter.trim().toLowerCase();

    return (data || []).filter((partner) => {
      const partnerRegion = String(partner.region || "").trim().toLowerCase();
      if (selectedState && partnerRegion !== selectedState) return false;
      if (!term) return true;

      const fullName = `${partner.firstName || ""} ${partner.lastName || ""}`
        .trim()
        .toLowerCase();
      return (
        fullName.includes(term) ||
        String(partner.email || "").toLowerCase().includes(term) ||
        String(partner.phone || "").toLowerCase().includes(term) ||
        String(partner.employeeId || "").toLowerCase().includes(term) ||
        String(partner.partnerCode || "").toLowerCase().includes(term) ||
        String(partner.rmName || "").toLowerCase().includes(term) ||
        partnerRegion.includes(term)
      );
    });
  }, [data, searchQuery, stateFilter]);

  const sortedPartners = sortNewestFirst(filteredPartners, {
    dateKeys: ["createdAt"],
  });

  const handleExport = () => {
    const rows = sortedPartners.map((p) => ({
      Name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
      "Employee ID": p.employeeId || "",
      Phone: p.phone || "",
      Email: p.email || "",
      "State / Region": p.region || "",
      Status: p.status || "",
      "RM Name": p.rmName || "",
      "Created On": p.createdAt
        ? new Date(p.createdAt).toLocaleDateString("en-IN")
        : "",
    }));
    if (!downloadXlsx(rows, "rsm-partners.xlsx", "Partners")) {
      toast.error("No rows to export");
    }
  };

  const columns = [
    {
      title: "Partner name",
      key: "name",
      render: (_, p) => (
        <span className="text-sm font-semibold text-gray-900">
          {`${p.firstName || ""} ${p.lastName || ""}`.trim() || "—"}
        </span>
      ),
    },
    {
      title: "User ID",
      key: "employeeId",
      render: (_, p) => (
        <span className="font-medium">{p.employeeId || p._id || "—"}</span>
      ),
    },
    {
      title: "Contact",
      key: "phone",
      render: (_, p) => <span className="text-sm">{p.phone || "—"}</span>,
    },
    {
      title: "State / Region",
      key: "region",
      render: (_, p) => <span className="text-sm">{p.region || "—"}</span>,
    },
    {
      title: "RM name",
      key: "rmName",
      render: (_, p) => p.rmName || "—",
    },
    {
      title: "Status",
      key: "status",
      render: (_, p) => <EntityStatusBadge status={p.status} />,
    },
    {
      title: "Created on",
      key: "createdAt",
      render: (_, p) =>
        p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "—",
    },
  ];

  return (
    <DashboardTablePage
      title="Partners"
      subtitle={
        loading
          ? "Loading..."
          : `Total ${sortedPartners.length} record${sortedPartners.length !== 1 ? "s" : ""} found`
      }
      error={error}
      headerRight={
        <>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              className="w-64 rounded-md border border-gray-300 py-2 pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Search by name, phone, or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            aria-label="Filter by state"
          >
            {stateOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "All" ? "All states" : opt}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            onClick={handleExport}
          >
            <Download size={16} className="mr-2" />
            Export
          </button>
        </>
      }
    >
      <AppAntTable
        columns={columns}
        dataSource={sortedPartners}
        rowKey="_id"
        loading={loading}
        locale={{ emptyText: "No partners found" }}
      />
    </DashboardTablePage>
  );
}
