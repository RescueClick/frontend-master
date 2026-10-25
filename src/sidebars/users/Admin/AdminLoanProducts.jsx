import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Globe,
  Smartphone,
  FileText,
  AlertCircle,
  HelpCircle,
  Save,
  X,
  RefreshCw,
  Sparkles,
  Sliders,
  Eye,
  Check,
} from "lucide-react";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

const FIELD_TYPES = [
  { value: "text", label: "Text Field" },
  { value: "number", label: "Number / Amount" },
  { value: "select", label: "Dropdown Select" },
  { value: "radio", label: "Radio Buttons" },
  { value: "date", label: "Date Picker" },
  { value: "textarea", label: "Long Text / Notes" },
];

export default function AdminLoanProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic"); // "basic", "fields", "documents"
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const initialForm = {
    name: "",
    code: "",
    slug: "",
    badgeText: "Instant Approval",
    description: "",
    minAmount: 50000,
    maxAmount: 5000000,
    minTenureMonths: 12,
    maxTenureMonths: 60,
    interestRateDisplay: "10.5% - 18%",
    publishToWeb: true,
    publishToPartnerApp: true,
    publishToCustomerApp: true,
    status: "ACTIVE",
    displayOrder: 1,
    customFields: [],
    requiredDocuments: [],
  };
  const [formData, setFormData] = useState(initialForm);

  // New Custom Field draft
  const [newField, setNewField] = useState({
    fieldKey: "",
    label: "",
    fieldType: "text",
    placeholder: "",
    required: true,
    options: "", // comma separated
    stepIndex: 1,
  });

  // New Document draft
  const [newDoc, setNewDoc] = useState({
    docType: "",
    label: "",
    required: true,
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getHeaders = () => {
    const { adminToken } = getAuthData();
    return {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    };
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${backendurl}/loan-products/admin/all`, {
        headers: getHeaders(),
      });
      if (res.data?.success) {
        setProducts(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching loan products:", err);
      setError(err.response?.data?.message || "Failed to load loan products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      ...initialForm,
      requiredDocuments: [
        { docType: "PAN", label: "PAN Card", required: true },
        { docType: "AADHAAR_FRONT", label: "Aadhaar Card (Front)", required: true },
        { docType: "AADHAAR_BACK", label: "Aadhaar Card (Back)", required: true },
        { docType: "SALARY_SLIP", label: "Salary Slips / Income Proof", required: true },
        { docType: "BANK_STATEMENT", label: "Bank Statement", required: true },
      ],
    });
    setActiveTab("basic");
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name || "",
      code: product.code || "",
      slug: product.slug || "",
      badgeText: product.badgeText || "",
      description: product.description || "",
      minAmount: product.minAmount || 50000,
      maxAmount: product.maxAmount || 5000000,
      minTenureMonths: product.minTenureMonths || 12,
      maxTenureMonths: product.maxTenureMonths || 60,
      interestRateDisplay: product.interestRateDisplay || "",
      publishToWeb: Boolean(product.publishToWeb),
      publishToPartnerApp: Boolean(product.publishToPartnerApp),
      publishToCustomerApp: Boolean(product.publishToCustomerApp),
      status: product.status || "ACTIVE",
      displayOrder: product.displayOrder || 1,
      customFields: product.customFields || [],
      requiredDocuments: product.requiredDocuments || [],
    });
    setActiveTab("basic");
    setIsModalOpen(true);
  };

  const handleTogglePublish = async (product, field) => {
    const updatedValue = !product[field];
    try {
      await axios.put(
        `${backendurl}/loan-products/admin/${product._id}`,
        { [field]: updatedValue },
        { headers: getHeaders() }
      );
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, [field]: updatedValue } : p))
      );
      showToast(`Updated ${product.name} publishing settings.`);
    } catch (err) {
      console.error("Failed to update publish toggle:", err);
      showToast("Failed to update settings", "error");
    }
  };

  const handleToggleStatus = async (product) => {
    const nextStatus = product.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
    try {
      await axios.put(
        `${backendurl}/loan-products/admin/${product._id}`,
        { status: nextStatus },
        { headers: getHeaders() }
      );
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, status: nextStatus } : p))
      );
      showToast(`${product.name} marked as ${nextStatus}.`);
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to archive '${product.name}'?`)) return;
    try {
      await axios.delete(`${backendurl}/loan-products/admin/${product._id}`, {
        headers: getHeaders(),
      });
      showToast(`Archived '${product.name}' successfully.`);
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete product", "error");
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast("Product name and unique code are required", "error");
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await axios.put(
          `${backendurl}/loan-products/admin/${editingId}`,
          formData,
          { headers: getHeaders() }
        );
        showToast(`'${formData.name}' updated successfully!`);
      } else {
        await axios.post(
          `${backendurl}/loan-products/admin`,
          formData,
          { headers: getHeaders() }
        );
        showToast(`'${formData.name}' created and published successfully!`);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error("Save error:", err);
      showToast(err.response?.data?.message || "Failed to save product", "error");
    } finally {
      setSaving(false);
    }
  };

  // Add custom field
  const handleAddCustomField = () => {
    if (!newField.fieldKey.trim() || !newField.label.trim()) {
      showToast("Field key and label are required", "error");
      return;
    }

    const formattedKey = newField.fieldKey.trim().replace(/\s+/g, "");
    const optionsArray = newField.options
      .split(",")
      .map((opt) => opt.trim())
      .filter(Boolean)
      .map((opt) => ({ label: opt, value: opt.toUpperCase().replace(/\s+/g, "_") }));

    const fieldToAdd = {
      fieldKey: formattedKey,
      label: newField.label.trim(),
      fieldType: newField.fieldType,
      placeholder: newField.placeholder.trim(),
      validation: { required: newField.required },
      options: optionsArray,
      stepIndex: Number(newField.stepIndex) || 1,
      order: formData.customFields.length + 1,
    };

    setFormData((prev) => ({
      ...prev,
      customFields: [...prev.customFields, fieldToAdd],
    }));

    setNewField({
      fieldKey: "",
      label: "",
      fieldType: "text",
      placeholder: "",
      required: true,
      options: "",
      stepIndex: 1,
    });
  };

  const handleRemoveCustomField = (index) => {
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }));
  };

  // Add document requirement
  const handleAddDoc = () => {
    if (!newDoc.docType.trim() || !newDoc.label.trim()) {
      showToast("Document type and label are required", "error");
      return;
    }

    const docToAdd = {
      docType: newDoc.docType.trim().toUpperCase().replace(/\s+/g, "_"),
      label: newDoc.label.trim(),
      required: newDoc.required,
    };

    setFormData((prev) => ({
      ...prev,
      requiredDocuments: [...prev.requiredDocuments, docToAdd],
    }));

    setNewDoc({ docType: "", label: "", required: true });
  };

  const handleRemoveDoc = (index) => {
    setFormData((prev) => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.filter((_, i) => i !== index),
    }));
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === "ACTIVE").length;
  const partnerAppCount = products.filter((p) => p.publishToPartnerApp && p.status === "ACTIVE").length;
  const customerAppCount = products.filter((p) => p.publishToCustomerApp && p.status === "ACTIVE").length;

  return (
    <div className="min-h-screen bg-gray-50/60 p-4 sm:p-6 lg:p-8">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toast.type === "error" ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles size={14} /> Server-Driven Dynamic Loan Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Loan Products & Schema Builder
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, configure, and publish loan products. Form fields & document rules update instantly on Web & Mobile apps without rebuilding.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all shrink-0 cursor-pointer"
        >
          <Plus size={18} /> Add New Loan Product
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Total Products</div>
            <div className="text-2xl font-black text-gray-900 mt-1">{totalProducts}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-700 uppercase">Active Published</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{activeProducts}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-700 uppercase">Partner Mobile App</div>
            <div className="text-2xl font-black text-blue-700 mt-1">{partnerAppCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Smartphone size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-purple-700 uppercase">Customer App / Web</div>
            <div className="text-2xl font-black text-purple-700 mt-1">{customerAppCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Globe size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by loan name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button
            onClick={fetchProducts}
            title="Refresh"
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">
          <RefreshCw size={28} className="animate-spin mx-auto text-emerald-600 mb-2" />
          Loading dynamic loan products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100">
          <Layers size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-800">No Loan Products Found</h3>
          <p className="text-sm text-gray-500 mt-1">
            Click "Add New Loan Product" to create your first dynamic loan product.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const isActive = product.status === "ACTIVE";
            const customFieldsCount = product.customFields?.length || 0;
            const docsCount = product.requiredDocuments?.length || 0;

            return (
              <div
                key={product._id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md ${
                  isActive ? "border-gray-200" : "border-gray-200 bg-gray-50/50 opacity-80"
                }`}
              >
                {/* Card Top */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                        <span className="px-2 py-0.5 text-[11px] font-extrabold bg-gray-100 text-gray-700 rounded-md tracking-wider">
                          {product.code}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {product.description || "No description provided."}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(product)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider shrink-0 cursor-pointer ${
                        isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                    >
                      {product.status}
                    </button>
                  </div>

                  {/* Financial Bounds Tagline */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-gray-50 rounded-xl my-3 text-center">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">Amount Limit</div>
                      <div className="text-xs font-bold text-gray-800 mt-0.5">
                        ₹{(product.minAmount / 1000).toFixed(0)}k - ₹{(product.maxAmount / 100000).toFixed(0)}L
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">Tenure</div>
                      <div className="text-xs font-bold text-gray-800 mt-0.5">
                        {product.minTenureMonths} - {product.maxTenureMonths} Mo
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">Interest</div>
                      <div className="text-xs font-bold text-emerald-700 mt-0.5">
                        {product.interestRateDisplay || "Flexible"}
                      </div>
                    </div>
                  </div>

                  {/* Form & Docs Pill */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-medium border border-teal-100">
                      <Sliders size={13} /> {customFieldsCount} Dynamic Fields
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-medium border border-blue-100">
                      <FileText size={13} /> {docsCount} KYC / Docs
                    </span>
                  </div>

                  {/* Publishing Toggles */}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Live Channels Visibility
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleTogglePublish(product, "publishToPartnerApp")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition ${
                          product.publishToPartnerApp
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-gray-100 text-gray-400 border-gray-200"
                        }`}
                      >
                        <Smartphone size={13} /> Partner App {product.publishToPartnerApp ? "✓" : "✗"}
                      </button>

                      <button
                        onClick={() => handleTogglePublish(product, "publishToCustomerApp")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition ${
                          product.publishToCustomerApp
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-gray-100 text-gray-400 border-gray-200"
                        }`}
                      >
                        <Smartphone size={13} /> Customer App {product.publishToCustomerApp ? "✓" : "✗"}
                      </button>

                      <button
                        onClick={() => handleTogglePublish(product, "publishToWeb")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition ${
                          product.publishToWeb
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-400 border-gray-200"
                        }`}
                      >
                        <Globe size={13} /> Web {product.publishToWeb ? "✓" : "✗"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Order #{product.displayOrder || 1}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 shadow-xs transition"
                    >
                      <Pencil size={13} /> Configure Schema
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition"
                      title="Archive Product"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCHEMA BUILDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 my-8 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId ? `Edit Product Schema: ${formData.name}` : "Create New Dynamic Loan Product"}
                </h2>
                <p className="text-xs text-gray-500">
                  Configure loan parameters, dynamic custom fields, and required KYC documents.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-200 text-gray-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-200 px-6 gap-6 bg-white text-sm font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`py-3 border-b-2 transition ${
                  activeTab === "basic"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                1. General & Financials
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("fields")}
                className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === "fields"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                2. Dynamic Form Fields ({formData.customFields.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === "documents"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                3. Required Documents ({formData.requiredDocuments.length})
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* TAB 1: BASIC & FINANCIALS */}
              {activeTab === "basic" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Loan Product Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Commercial Vehicle Loan"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full text-sm px-3.5 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Product Code (Unique identifier) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CAR_LOAN"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            code: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                          })
                        }
                        className="w-full text-sm px-3.5 py-2 border border-gray-200 rounded-xl uppercase font-mono focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Badge Tagline</label>
                      <input
                        type="text"
                        placeholder="e.g. Instant Approval"
                        value={formData.badgeText}
                        onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                        className="w-full text-sm px-3.5 py-2 border border-gray-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Interest Display</label>
                      <input
                        type="text"
                        placeholder="e.g. 10.5% - 16%"
                        value={formData.interestRateDisplay}
                        onChange={(e) =>
                          setFormData({ ...formData, interestRateDisplay: e.target.value })
                        }
                        className="w-full text-sm px-3.5 py-2 border border-gray-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) =>
                          setFormData({ ...formData, displayOrder: Number(e.target.value) })
                        }
                        className="w-full text-sm px-3.5 py-2 border border-gray-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Brief customer-facing summary of this loan product..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full text-sm px-3.5 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>

                  {/* Financial Bounds */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                    <h4 className="text-xs font-extrabold uppercase text-gray-700 mb-3 tracking-wider">
                      Financial Eligibility Bounds
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-500">Min Loan Amount (₹)</label>
                        <input
                          type="number"
                          value={formData.minAmount}
                          onChange={(e) =>
                            setFormData({ ...formData, minAmount: Number(e.target.value) })
                          }
                          className="w-full text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500">Max Loan Amount (₹)</label>
                        <input
                          type="number"
                          value={formData.maxAmount}
                          onChange={(e) =>
                            setFormData({ ...formData, maxAmount: Number(e.target.value) })
                          }
                          className="w-full text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500">Min Tenure (Mo)</label>
                        <input
                          type="number"
                          value={formData.minTenureMonths}
                          onChange={(e) =>
                            setFormData({ ...formData, minTenureMonths: Number(e.target.value) })
                          }
                          className="w-full text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500">Max Tenure (Mo)</label>
                        <input
                          type="number"
                          value={formData.maxTenureMonths}
                          onChange={(e) =>
                            setFormData({ ...formData, maxTenureMonths: Number(e.target.value) })
                          }
                          className="w-full text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Channel Visibility Switches */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                    <h4 className="text-xs font-extrabold uppercase text-gray-700 mb-3 tracking-wider">
                      Publish to Apps & Web
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.publishToPartnerApp}
                          onChange={(e) =>
                            setFormData({ ...formData, publishToPartnerApp: e.target.checked })
                          }
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        Partner Mobile App
                      </label>

                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.publishToCustomerApp}
                          onChange={(e) =>
                            setFormData({ ...formData, publishToCustomerApp: e.target.checked })
                          }
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        Customer Mobile App
                      </label>

                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.publishToWeb}
                          onChange={(e) =>
                            setFormData({ ...formData, publishToWeb: e.target.checked })
                          }
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        Web Portal
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DYNAMIC FORM FIELDS */}
              {activeTab === "fields" && (
                <div className="space-y-6">
                  {/* Existing Fields List */}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider mb-2">
                      Configured Dynamic Fields ({formData.customFields.length})
                    </h4>
                    {formData.customFields.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No custom fields added yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {formData.customFields.map((field, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                  {field.label}
                                  <span className="text-xs font-mono text-gray-400">
                                    ({field.fieldKey})
                                  </span>
                                  {field.validation?.required && (
                                    <span className="text-[10px] font-bold text-red-500 uppercase">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Type: <span className="font-semibold">{field.fieldType}</span> | Step:{" "}
                                  {field.stepIndex}
                                  {field.options?.length > 0 &&
                                    ` | Options: ${field.options.map((o) => o.label).join(", ")}`}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomField(idx)}
                              className="text-red-500 hover:text-red-700 p-1.5"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add New Field Box */}
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                    <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider mb-3">
                      + Add New Field to Form Schema
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-600">Field Key (Unique variable) *</label>
                        <input
                          type="text"
                          placeholder="e.g. carModel"
                          value={newField.fieldKey}
                          onChange={(e) => setNewField({ ...newField, fieldKey: e.target.value })}
                          className="w-full text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg mt-1 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-600">Label displayed to user *</label>
                        <input
                          type="text"
                          placeholder="e.g. Vehicle Model / Make"
                          value={newField.label}
                          onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                          className="w-full text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-600">Field Input Type</label>
                        <select
                          value={newField.fieldType}
                          onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })}
                          className="w-full text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg mt-1"
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-600">Placeholder Text</label>
                        <input
                          type="text"
                          placeholder="e.g. Enter car model"
                          value={newField.placeholder}
                          onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                          className="w-full text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg mt-1"
                        />
                      </div>

                      {newField.fieldType === "select" || newField.fieldType === "radio" ? (
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-gray-600">
                            Options (Comma-separated)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Petrol, Diesel, Electric, Hybrid"
                            value={newField.options}
                            onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                            className="w-full text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg mt-1"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="text-[11px] font-bold text-gray-600">Step Index (0-3)</label>
                          <input
                            type="number"
                            value={newField.stepIndex}
                            onChange={(e) =>
                              setNewField({ ...newField, stepIndex: Number(e.target.value) })
                            }
                            className="w-full text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg mt-1"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-100">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newField.required}
                          onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        Mandatory Field (Required to submit)
                      </label>

                      <button
                        type="button"
                        onClick={handleAddCustomField}
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                      >
                        + Add Field
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: REQUIRED DOCUMENTS */}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  {/* Documents List */}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider mb-2">
                      Required Documents ({formData.requiredDocuments.length})
                    </h4>
                    {formData.requiredDocuments.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No document requirements defined.</p>
                    ) : (
                      <div className="space-y-2">
                        {formData.requiredDocuments.map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                  {doc.label}
                                  <span className="text-xs font-mono text-gray-400">
                                    [{doc.docType}]
                                  </span>
                                  {doc.required ? (
                                    <span className="text-[10px] font-bold text-red-500 uppercase">
                                      Mandatory
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                                      Optional
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(idx)}
                              className="text-red-500 hover:text-red-700 p-1.5"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Document Box */}
                  <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
                    <h4 className="text-xs font-extrabold text-blue-800 uppercase tracking-wider mb-3">
                      + Add Required Document Rule
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-600">Doc Type Code *</label>
                        <input
                          type="text"
                          placeholder="e.g. RC_BOOK, GST_CERTIFICATE"
                          value={newDoc.docType}
                          onChange={(e) =>
                            setNewDoc({
                              ...newDoc,
                              docType: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                            })
                          }
                          className="w-full text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg mt-1 font-mono uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-600">Document Label *</label>
                        <input
                          type="text"
                          placeholder="e.g. Vehicle Registration Certificate (RC)"
                          value={newDoc.label}
                          onChange={(e) => setNewDoc({ ...newDoc, label: e.target.value })}
                          className="w-full text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-100">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newDoc.required}
                          onChange={(e) => setNewDoc({ ...newDoc, required: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        Mandatory Document
                      </label>

                      <button
                        type="button"
                        onClick={handleAddDoc}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                      >
                        + Add Document
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Saving Schema...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save & Publish Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
