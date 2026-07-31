import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { ArrowRightLeft, Search, Users } from "lucide-react";
import { INDIAN_STATE_FILTER_OPTIONS } from "../../../utils/indianStates";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";
import AppAntTable from "../../../components/shared/AppAntTable";
import EntityStatusBadge from "../../../components/shared/EntityStatusBadge";
import { fetchRMs, fetchAdminPartnersByRm, bulkMovePartnersRm } from "../../../feature/thunks/adminThunks";
import {
  fetchRmList,
  fetchAsmPartnersByRm,
  bulkMoveAsmPartnersRm,
} from "../../../feature/thunks/asmThunks";

/**
 * Shared Admin/ASM UI to bulk-move partners From RM → To RM.
 * @param {"admin"|"asm"} mode
 */
export default function MovePartnersBetweenRms({ mode = "admin" }) {
  const dispatch = useDispatch();
  const isAdmin = mode === "admin";

  const [rms, setRms] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loadingRms, setLoadingRms] = useState(true);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [stateFilter, setStateFilter] = useState("All");
  const [fromRmId, setFromRmId] = useState("");
  const [toRmId, setToRmId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [preview, setPreview] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadRms = useCallback(async () => {
    setLoadingRms(true);
    try {
      const action = isAdmin ? fetchRMs() : fetchRmList();
      const list = await dispatch(action).unwrap();
      const arr = Array.isArray(list) ? list : list?.data || [];
      setRms(
        arr.filter(
          (r) =>
            String(r.status || "").toUpperCase() === "ACTIVE" ||
            !r.status
        )
      );
    } catch (e) {
      toast.error(typeof e === "string" ? e : e?.message || "Failed to load RMs");
      setRms([]);
    } finally {
      setLoadingRms(false);
    }
  }, [dispatch, isAdmin]);

  useEffect(() => {
    loadRms();
  }, [loadRms]);

  const loadPartners = useCallback(async () => {
    if (!fromRmId) {
      setPartners([]);
      setSelectedIds([]);
      return;
    }
    setLoadingPartners(true);
    setSelectedIds([]);
    setPreview(null);
    try {
      const action = isAdmin
        ? fetchAdminPartnersByRm(fromRmId)
        : fetchAsmPartnersByRm(fromRmId);
      const list = await dispatch(action).unwrap();
      const arr = Array.isArray(list) ? list : list?.data || [];
      setPartners(
        arr.filter(
          (p) => String(p.status || "").toUpperCase() !== "PENDING"
        )
      );
    } catch (e) {
      toast.error(
        typeof e === "string" ? e : e?.message || "Failed to load partners"
      );
      setPartners([]);
    } finally {
      setLoadingPartners(false);
    }
  }, [dispatch, fromRmId, isAdmin]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const rmLabel = (rm) => {
    const name = `${rm.firstName || ""} ${rm.lastName || ""}`.trim() || "RM";
    const id = rm.employeeId || rm.rmCode || "";
    const region = rm.region ? ` · ${rm.region}` : "";
    return `${name}${id ? ` (${id})` : ""}${region}`;
  };

  const filteredPartners = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const state =
      stateFilter === "All" ? "" : stateFilter.trim().toLowerCase();
    return partners.filter((p) => {
      const region = String(p.region || "").trim().toLowerCase();
      if (state && region !== state) return false;
      if (!term) return true;
      const name = `${p.firstName || ""} ${p.lastName || ""} ${p.name || ""}`
        .trim()
        .toLowerCase();
      return (
        name.includes(term) ||
        String(p.phone || "").includes(term) ||
        String(p.employeeId || "").toLowerCase().includes(term) ||
        String(p.email || "").toLowerCase().includes(term)
      );
    });
  }, [partners, searchTerm, stateFilter]);

  const partnerRowId = (p) => String(p.id || p._id);

  const allVisibleSelected =
    filteredPartners.length > 0 &&
    filteredPartners.every((p) => selectedIds.includes(partnerRowId(p)));

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      const visible = new Set(filteredPartners.map(partnerRowId));
      setSelectedIds((prev) => prev.filter((id) => !visible.has(id)));
    } else {
      setSelectedIds((prev) => {
        const set = new Set(prev);
        filteredPartners.forEach((p) => set.add(partnerRowId(p)));
        return [...set];
      });
    }
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toRmOptions = useMemo(
    () => rms.filter((r) => String(r._id || r.id) !== String(fromRmId)),
    [rms, fromRmId]
  );

  const runPreview = async () => {
    if (!fromRmId || !toRmId || selectedIds.length === 0) {
      toast.error("Select From RM, partners, and To RM");
      return;
    }
    setSubmitting(true);
    try {
      const action = isAdmin
        ? bulkMovePartnersRm({
            partnerIds: selectedIds,
            fromRmId,
            toRmId,
            dryRun: true,
          })
        : bulkMoveAsmPartnersRm({
            partnerIds: selectedIds,
            fromRmId,
            toRmId,
            dryRun: true,
          });
      const result = await dispatch(action).unwrap();
      setPreview(result);
      setConfirmOpen(true);
    } catch (e) {
      toast.error(typeof e === "string" ? e : e?.message || "Preview failed");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmMove = async () => {
    setSubmitting(true);
    try {
      const action = isAdmin
        ? bulkMovePartnersRm({
            partnerIds: selectedIds,
            fromRmId,
            toRmId,
            dryRun: false,
          })
        : bulkMoveAsmPartnersRm({
            partnerIds: selectedIds,
            fromRmId,
            toRmId,
            dryRun: false,
          });
      const result = await dispatch(action).unwrap();
      toast.success(result.message || "Partners moved successfully");
      setConfirmOpen(false);
      setPreview(null);
      setSelectedIds([]);
      await loadPartners();
    } catch (e) {
      toast.error(typeof e === "string" ? e : e?.message || "Move failed");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: (
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={toggleAllVisible}
          aria-label="Select all visible partners"
        />
      ),
      key: "select",
      width: 48,
      render: (_, p) => {
        const id = partnerRowId(p);
        return (
          <input
            type="checkbox"
            checked={selectedIds.includes(id)}
            onChange={() => toggleOne(id)}
            aria-label={`Select ${p.name || id}`}
          />
        );
      },
    },
    {
      title: "Partner",
      key: "name",
      render: (_, p) => (
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {p.name ||
              `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
              "—"}
          </p>
          <p className="text-xs text-slate-500">{p.employeeId || "—"}</p>
        </div>
      ),
    },
    {
      title: "Contact",
      key: "phone",
      render: (_, p) => (
        <span className="text-sm">{p.phone || "—"}</span>
      ),
    },
    {
      title: "State",
      key: "region",
      render: (_, p) => (
        <span className="text-sm">{p.region || "—"}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, p) => <EntityStatusBadge status={p.status} />,
    },
  ];

  return (
    <>
      <DashboardTablePage
        title="Move Partners Between RMs"
        subtitle="Select state, From RM, partners (checkboxes), then To RM. Open applications move with the partner; disbursed/rejected history stays locked."
        toolbar={
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">State filter</span>
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                >
                  {INDIAN_STATE_FILTER_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === "All" ? "All states" : s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">From RM</span>
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  value={fromRmId}
                  disabled={loadingRms}
                  onChange={(e) => {
                    setFromRmId(e.target.value);
                    if (e.target.value === toRmId) setToRmId("");
                  }}
                >
                  <option value="">Select source RM</option>
                  {rms.map((rm) => (
                    <option key={rm._id || rm.id} value={rm._id || rm.id}>
                      {rmLabel(rm)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">To RM</span>
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  value={toRmId}
                  disabled={!fromRmId || loadingRms}
                  onChange={(e) => setToRmId(e.target.value)}
                >
                  <option value="">Select destination RM</option>
                  {toRmOptions.map((rm) => (
                    <option key={rm._id || rm.id} value={rm._id || rm.id}>
                      {rmLabel(rm)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-col justify-end gap-2">
                <button
                  type="button"
                  disabled={
                    submitting ||
                    !fromRmId ||
                    !toRmId ||
                    selectedIds.length === 0
                  }
                  onClick={runPreview}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Move {selectedIds.length || ""} selected
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search name, phone, ID..."
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Users className="h-3.5 w-3.5" />
                {filteredPartners.length} shown · {selectedIds.length} selected
              </p>
            </div>
          </div>
        }
      >
        <AppAntTable
          columns={columns}
          dataSource={filteredPartners}
          rowKey={(r) => partnerRowId(r)}
          loading={loadingPartners}
          scroll={{}}
          locale={{
            emptyText: fromRmId
              ? "No partners for this RM / filter"
              : "Select a From RM to list partners",
          }}
        />
      </DashboardTablePage>

      {confirmOpen && preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Confirm partner move
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              From <strong>{preview.fromRm?.name}</strong> → To{" "}
              <strong>{preview.toRm?.name}</strong>
            </p>
            <ul className="mt-4 space-y-1 text-sm text-slate-700">
              <li>
                Partners to move:{" "}
                <strong>{preview.movedPartners}</strong>
              </li>
              <li>
                Customers kept on same partner (RM sync):{" "}
                <strong>{preview.syncedCustomers ?? 0}</strong>
              </li>
              <li>
                Open applications that will move:{" "}
                <strong>{preview.movedApplications}</strong>
              </li>
              <li>
                Settled apps kept on history (not moved):{" "}
                <strong>{preview.skippedLockedApplications}</strong>
              </li>
            </ul>
            <p className="mt-3 text-xs text-amber-700">
              Customers stay with the same partner. Disbursed / rejected
              applications and paid payouts stay with historical records.
              Partner status is not changed.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                disabled={submitting}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={submitting}
                onClick={confirmMove}
              >
                {submitting ? "Moving…" : "Confirm move"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
