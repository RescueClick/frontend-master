import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { Building2, Plus, RefreshCw, Search, X } from "lucide-react";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";
import { INDIAN_STATES } from "../../../utils/indianStates";
import BankRmResultsTable from "../../../components/shared/BankRmResultsTable";

const EMPTY_FORM = {
  bankNbfcName: "",
  loginCode: "",
  product: "",
  marketType: "",
  city: "",
  state: "",
  company: "",
  rmName: "",
  rmPhone: "",
  rmEmail: "",
  asmName: "",
  asmPhone: "",
  asmEmail: "",
  rsmName: "",
  rsmPhone: "",
  rsmEmail: "",
};

const BANK_REQUIRED = [
  "bankNbfcName",
  "loginCode",
  "product",
  "marketType",
  "city",
  "state",
  "company",
];

const pickContactFromRow = (row, role) => ({
  name: row?.[role]?.name || (role === "rm" ? row?.rmName : "") || "",
  phone: row?.[role]?.phone || (role === "rm" ? row?.rmPhone : "") || "",
  email: row?.[role]?.email || (role === "rm" ? row?.rmEmail : "") || "",
});

const FindBankRm = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedLoginCodeId, setCopiedLoginCodeId] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const auth = getAuthData() || {};
    const token = isAdminRoute
      ? auth.adminToken || auth.token
      : auth.rsmToken || auth.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [isAdminRoute]);

  const apiBase = isAdminRoute
    ? `${backendurl}/admin/bank-rms`
    : `${backendurl}/rsm/bank-rms`;

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiBase, {
        headers: getAuthHeaders(),
      });
      setRows(Array.isArray(res.data?.bankRms) ? res.data.bankRms : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load Bank RMs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase, getAuthHeaders]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const filteredRows = useMemo(() => {
    const list = (rows || []).filter((r) => r?.isActive !== false);
    const q = String(searchQuery || "").trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const hay = [
        r.bankNbfcName,
        r.loginCode,
        r.product,
        r.marketType,
        r.city,
        r.state,
        r.company,
        r.rmName,
        r.rmPhone,
        r.rmEmail,
        r.rm?.name,
        r.rm?.phone,
        r.rm?.email,
        r.asm?.name,
        r.asm?.phone,
        r.asm?.email,
        r.rsm?.name,
        r.rsm?.phone,
        r.rsm?.email,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      return hay.includes(q);
    });
  }, [rows, searchQuery]);

  const openCreate = () => {
    setModalMode("create");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    const rm = pickContactFromRow(row, "rm");
    const asm = pickContactFromRow(row, "asm");
    const rsm = pickContactFromRow(row, "rsm");
    setModalMode("edit");
    setEditingId(row._id);
    setForm({
      bankNbfcName: row.bankNbfcName || "",
      loginCode: row.loginCode || "",
      product: row.product || "",
      marketType: row.marketType || "",
      city: row.city || "",
      state: row.state || "",
      company: row.company || "",
      rmName: rm.name,
      rmPhone: rm.phone,
      rmEmail: rm.email,
      asmName: asm.name,
      asmPhone: asm.phone,
      asmEmail: asm.email,
      rsmName: rsm.name,
      rsmPhone: rsm.phone,
      rsmEmail: rsm.email,
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missing = BANK_REQUIRED.find((key) => !String(form[key] || "").trim());
    if (missing) {
      toast.error("Please fill all bank details (required)");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        bankNbfcName: form.bankNbfcName.trim(),
        loginCode: form.loginCode.trim(),
        product: form.product.trim(),
        marketType: form.marketType.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        company: form.company.trim(),
        rmName: form.rmName.trim(),
        rmPhone: form.rmPhone.trim(),
        rmEmail: form.rmEmail.trim(),
        asmName: form.asmName.trim(),
        asmPhone: form.asmPhone.trim(),
        asmEmail: form.asmEmail.trim(),
        rsmName: form.rsmName.trim(),
        rsmPhone: form.rsmPhone.trim(),
        rsmEmail: form.rsmEmail.trim(),
      };

      if (modalMode === "create") {
        await axios.post(apiBase, payload, { headers: getAuthHeaders() });
        toast.success("Bank RM created successfully");
      } else {
        await axios.put(`${apiBase}/${editingId}`, payload, {
          headers: getAuthHeaders(),
        });
        toast.success("Bank RM updated successfully");
      }
      setModalOpen(false);
      fetchRows();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save Bank RM");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    setDeleting(true);
    try {
      await axios.delete(`${apiBase}/${deleteTarget._id}`, {
        headers: getAuthHeaders(),
      });
      toast.success("Bank RM deleted successfully");
      setDeleteTarget(null);
      fetchRows();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete Bank RM");
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyLoginCode = async (code, id) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedLoginCodeId(id);
      toast.success("Login code copied");
      setTimeout(() => {
        setCopiedLoginCodeId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {
      toast.error("Failed to copy login code");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

  const ContactSection = ({ title, hint, nameKey, phoneKey, emailKey }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 md:col-span-2">
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{hint}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Name</span>
          <input
            name={nameKey}
            value={form[nameKey]}
            onChange={handleChange}
            className={inputClass}
            placeholder="Full name"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Phone</span>
          <input
            name={phoneKey}
            type="tel"
            value={form[phoneKey]}
            onChange={handleChange}
            className={inputClass}
            placeholder="10-digit mobile"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Email</span>
          <input
            name={emailKey}
            type="email"
            value={form[emailKey]}
            onChange={handleChange}
            className={inputClass}
            placeholder="name@example.com"
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Find Bank RM</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Add bank details plus RM / ASM / RSM contacts for that bank
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchRows}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              Add Bank RM
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bank, product, RM / ASM / RSM name or phone..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <BankRmResultsTable
            rows={filteredRows}
            loading={loading}
            showActions
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            copiedLoginCodeId={copiedLoginCodeId}
            onCopyLoginCode={handleCopyLoginCode}
          />
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {modalMode === "create" ? "Add Bank RM" : "Edit Bank RM"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bank fields are required. RM / ASM / RSM contacts are optional.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4">
                <p className="text-sm font-semibold text-teal-900 mb-3">1. Bank Details</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Bank NBFC Name *</span>
                    <input
                      name="bankNbfcName"
                      value={form.bankNbfcName}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Login Code *</span>
                    <input
                      name="loginCode"
                      value={form.loginCode}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Product *</span>
                    <input
                      name="product"
                      value={form.product}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="e.g. PL"
                      required
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Market Type *</span>
                    <input
                      name="marketType"
                      value={form.marketType}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="e.g. PL PRIME"
                      required
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">State *</span>
                    <select
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Please Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">City *</span>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </label>
                  <label className="space-y-1 text-sm md:col-span-2">
                    <span className="font-medium text-slate-700">Company *</span>
                    <input
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="e.g. RuLoans"
                      required
                    />
                  </label>
                </div>
              </div>

              <ContactSection
                title="2. RM Contact (for this bank)"
                hint="Optional — bank relationship manager name, phone, email"
                nameKey="rmName"
                phoneKey="rmPhone"
                emailKey="rmEmail"
              />
              <ContactSection
                title="3. ASM Contact (for this bank)"
                hint="Optional — area sales manager linked to this bank / city"
                nameKey="asmName"
                phoneKey="asmPhone"
                emailKey="asmEmail"
              />
              <ContactSection
                title="4. RSM Contact (for this bank)"
                hint="Optional — regional sales manager linked to this bank / city"
                nameKey="rsmName"
                phoneKey="rsmPhone"
                emailKey="rsmEmail"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : modalMode === "create" ? "Create" : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Delete Bank RM?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Soft-delete{" "}
              <span className="font-medium text-slate-800">{deleteTarget.bankNbfcName}</span>{" "}
              ({deleteTarget.loginCode})? ASM search will no longer show this record.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindBankRm;
