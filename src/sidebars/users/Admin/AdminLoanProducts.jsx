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
  Save,
  X,
  RefreshCw,
  Sparkles,
  Sliders,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Check,
  ListFilter,
  CheckSquare,
  Square,
  Info,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

const FIELD_TYPES = [
  { value: "text", label: "Text Field" },
  { value: "number", label: "Number / Quantity" },
  { value: "currency", label: "Currency / Amount (₹)" },
  { value: "phone", label: "📞 Phone / Mobile" },
  { value: "email", label: "📧 Email Address" },
  { value: "pan", label: "💳 PAN Card" },
  { value: "aadhaar", label: "🆔 Aadhaar Number" },
  { value: "select", label: "📋 Dropdown List" },
  { value: "radio", label: "🔘 Single Choice" },
  { value: "date", label: "📅 Date Picker" },
  { value: "textarea", label: "📝 Long Address" },
];

const getFieldTypeLabel = (type) => {
  switch (type) {
    case "number": return "🔢 Number";
    case "phone": return "📞 Phone";
    case "email": return "📧 Email";
    case "pan": return "💳 PAN";
    case "aadhaar": return "🆔 Aadhaar";
    case "select": return "📋 Dropdown";
    case "radio": return "🔘 Choice";
    case "date": return "📅 Date";
    case "textarea": return "📝 Address";
    default: return "🔤 Text";
  }
};

const DEFAULT_STEPS = [
  { stepIndex: 0, title: "1. Personal & KYC", icon: "👤" },
  { stepIndex: 1, title: "2. Address", icon: "🏠" },
  { stepIndex: 2, title: "3. Income & Job", icon: "💼" },
  { stepIndex: 3, title: "4. Loan & Bank", icon: "🏦" },
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
  const [selectedStepFilter, setSelectedStepFilter] = useState("ALL"); // For filtering fields by step
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Field Editing State
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  const [fieldEditDraft, setFieldEditDraft] = useState(null);

  // Document Editing State
  const [editingDocIndex, setEditingDocIndex] = useState(null);
  const [docEditDraft, setDocEditDraft] = useState(null);

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
    isComingSoon: false,
    isUnderMaintenance: false,
    maintenanceMessage: "We are currently upgrading this loan service. Please check back shortly.",
    displayOrder: 1,
    steps: DEFAULT_STEPS,
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
    stepIndex: 0,
    gridCol: 12,
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
    setFormData(initialForm);
    setActiveTab("basic");
    setSelectedStepFilter("ALL");
    setEditingFieldIndex(null);
    setEditingDocIndex(null);
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
      isComingSoon: product.status === "COMING_SOON" || Boolean(product.isComingSoon),
      isUnderMaintenance: product.status === "MAINTENANCE" || Boolean(product.isUnderMaintenance),
      maintenanceMessage:
        product.maintenanceMessage ||
        "We are currently upgrading this loan service. Please check back shortly.",
      displayOrder: product.displayOrder || 1,
      steps: product.steps?.length ? product.steps : DEFAULT_STEPS,
      customFields: product.customFields || [],
      requiredDocuments: product.requiredDocuments || [],
    });
    setActiveTab("fields"); // Open directly to fields tab as requested!
    setSelectedStepFilter("ALL");
    setEditingFieldIndex(null);
    setEditingDocIndex(null);
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

  const handleSetStatus = async (product, nextStatus) => {
    try {
      await axios.put(
        `${backendurl}/loan-products/admin/${product._id}`,
        { status: nextStatus },
        { headers: getHeaders() }
      );
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, status: nextStatus } : p))
      );
      showToast(`'${product.name}' status set to ${nextStatus}.`);
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const handleToggleStatus = async (product) => {
    const nextStatus = product.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
    await handleSetStatus(product, nextStatus);
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
    if (e && e.preventDefault) e.preventDefault();
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
        showToast(`'${formData.name}' schema saved successfully!`);
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

  // ==================== FIELD CRUD OPERATIONS ====================

  // Start editing a field
  const handleStartEditField = (index) => {
    const target = formData.customFields[index];
    setEditingFieldIndex(index);
    setFieldEditDraft({
      fieldKey: target.fieldKey || "",
      label: target.label || "",
      fieldType: target.fieldType || "text",
      placeholder: target.placeholder || "",
      required: Boolean(target.validation?.required),
      stepIndex: target.stepIndex !== undefined ? target.stepIndex : 0,
      gridCol: target.gridCol || 12,
      options: target.options?.map((o) => o.label).join(", ") || "",
    });
  };

  // Save the edited field
  const handleSaveEditedField = () => {
    if (!fieldEditDraft.label.trim() || !fieldEditDraft.fieldKey.trim()) {
      showToast("Field label and key are required", "error");
      return;
    }

    const optionsArray = fieldEditDraft.options
      ? fieldEditDraft.options
          .split(",")
          .map((opt) => opt.trim())
          .filter(Boolean)
          .map((opt) => ({ label: opt, value: opt.toUpperCase().replace(/\s+/g, "_") }))
      : [];

    const updatedField = {
      fieldKey: fieldEditDraft.fieldKey.trim().replace(/\s+/g, ""),
      label: fieldEditDraft.label.trim(),
      fieldType: fieldEditDraft.fieldType,
      placeholder: fieldEditDraft.placeholder.trim(),
      validation: { required: fieldEditDraft.required },
      stepIndex: Number(fieldEditDraft.stepIndex) || 0,
      gridCol: Number(fieldEditDraft.gridCol) || 12,
      options: optionsArray,
    };

    setFormData((prev) => {
      const copy = [...prev.customFields];
      copy[editingFieldIndex] = updatedField;
      return { ...prev, customFields: copy };
    });

    setEditingFieldIndex(null);
    setFieldEditDraft(null);
    showToast(`Updated field '${updatedField.label}'`);
  };

  // Cancel field edit
  const handleCancelFieldEdit = () => {
    setEditingFieldIndex(null);
    setFieldEditDraft(null);
  };

  // Move field up/down
  const handleMoveField = (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.customFields.length) return;

    setFormData((prev) => {
      const list = [...prev.customFields];
      const item = list[index];
      list.splice(index, 1);
      list.splice(newIndex, 0, item);
      return { ...prev, customFields: list };
    });
  };

  // Quick toggle field required / optional
  const handleToggleFieldRequired = (index) => {
    setFormData((prev) => {
      const list = [...prev.customFields];
      const isReq = Boolean(list[index].validation?.required);
      list[index] = {
        ...list[index],
        validation: {
          ...list[index].validation,
          required: !isReq,
        },
      };
      return { ...prev, customFields: list };
    });
    const fieldName = formData.customFields[index]?.label;
    const nowReq = !Boolean(formData.customFields[index]?.validation?.required);
    showToast(`'${fieldName}' is now ${nowReq ? "Mandatory (Required)" : "Optional (Not Required)"}`);
  };

  // Quick toggle doc required / optional
  const handleToggleDocRequired = (index) => {
    setFormData((prev) => {
      const list = [...prev.requiredDocuments];
      list[index] = {
        ...list[index],
        required: !Boolean(list[index].required),
      };
      return { ...prev, requiredDocuments: list };
    });
    const docName = formData.requiredDocuments[index]?.label;
    const nowReq = !Boolean(formData.requiredDocuments[index]?.required);
    showToast(`'${docName}' is now ${nowReq ? "Mandatory" : "Optional"}`);
  };

  // Remove field
  const handleRemoveCustomField = (index) => {
    const fieldName = formData.customFields[index]?.label;
    if (!window.confirm(`Delete field '${fieldName}' from this loan form?`)) return;
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }));
    showToast(`Removed field '${fieldName}'`);
  };

  // Add new field
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
      stepIndex: Number(newField.stepIndex) || 0,
      gridCol: Number(newField.gridCol) || 12,
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
      stepIndex: 0,
      gridCol: 12,
    });
    showToast(`Added '${fieldToAdd.label}' to Step ${fieldToAdd.stepIndex}`);
  };

  // ==================== DOCUMENT CRUD OPERATIONS ====================

  const handleStartEditDoc = (index) => {
    const target = formData.requiredDocuments[index];
    setEditingDocIndex(index);
    setDocEditDraft({
      docType: target.docType || "",
      label: target.label || "",
      required: Boolean(target.required),
    });
  };

  const handleSaveEditedDoc = () => {
    if (!docEditDraft.docType.trim() || !docEditDraft.label.trim()) {
      showToast("Document type and label are required", "error");
      return;
    }

    const updatedDoc = {
      docType: docEditDraft.docType.trim().toUpperCase().replace(/\s+/g, "_"),
      label: docEditDraft.label.trim(),
      required: Boolean(docEditDraft.required),
    };

    setFormData((prev) => {
      const copy = [...prev.requiredDocuments];
      copy[editingDocIndex] = updatedDoc;
      return { ...prev, requiredDocuments: copy };
    });

    setEditingDocIndex(null);
    setDocEditDraft(null);
    showToast(`Updated document requirement '${updatedDoc.label}'`);
  };

  const handleCancelDocEdit = () => {
    setEditingDocIndex(null);
    setDocEditDraft(null);
  };

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
    showToast(`Added document requirement '${docToAdd.label}'`);
  };

  const handleRemoveDoc = (index) => {
    const docName = formData.requiredDocuments[index]?.label;
    if (!window.confirm(`Delete document rule '${docName}'?`)) return;
    setFormData((prev) => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.filter((_, i) => i !== index),
    }));
    showToast(`Removed document rule '${docName}'`);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Fields in Tab 2
  const visibleFieldsWithIndices = formData.customFields
    .map((field, realIndex) => ({ field, realIndex }))
    .filter(({ field }) => {
      if (selectedStepFilter === "ALL") return true;
      return field.stepIndex === Number(selectedStepFilter);
    });

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
            Complete Loan Form Designer & Products Hub
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Full CRUD power: design every field of the loan application, edit existing fields, reorder steps, and configure documents with instant sync across Apps & Web.
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
            <div className="text-2xl font-black text-gray-900 mt-1">{products.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-700 uppercase">Active Published</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {products.filter((p) => p.status === "ACTIVE").length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-700 uppercase">Partner Mobile App</div>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {products.filter((p) => p.publishToPartnerApp && p.status === "ACTIVE").length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Smartphone size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-purple-700 uppercase">Customer App / Web</div>
            <div className="text-2xl font-black text-purple-700 mt-1">
              {products.filter((p) => p.publishToCustomerApp && p.status === "ACTIVE").length}
            </div>
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
            <option value="ACTIVE">Active (Live)</option>
            <option value="COMING_SOON">Coming Soon</option>
            <option value="MAINTENANCE">Under Maintenance</option>
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

      {/* Products Grid */}
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
                  isActive ? "border-gray-200" : "border-gray-200 bg-gray-50/50 opacity-90"
                }`}
              >
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

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                          product.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : product.status === "COMING_SOON"
                            ? "bg-purple-100 text-purple-800"
                            : product.status === "MAINTENANCE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.status === "COMING_SOON" ? "Coming Soon" : product.status === "MAINTENANCE" ? "Maintenance" : product.status}
                      </span>

                      {/* Quick 1-click status switch pills */}
                      <div className="flex items-center gap-1 bg-gray-100/90 p-0.5 rounded-lg border border-gray-200">
                        <button
                          type="button"
                          onClick={() => handleSetStatus(product, "ACTIVE")}
                          title="Make Live & Active"
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition ${
                            product.status === "ACTIVE"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          Live
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(product, "COMING_SOON")}
                          title="Set Coming Soon"
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition ${
                            product.status === "COMING_SOON"
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          Soon
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(product, "MAINTENANCE")}
                          title="Set Under Maintenance"
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition ${
                            product.status === "MAINTENANCE"
                              ? "bg-amber-600 text-white shadow-xs"
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          Maint
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(product, "DRAFT")}
                          title="Set Draft (Hidden)"
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition ${
                            product.status === "DRAFT"
                              ? "bg-gray-700 text-white shadow-xs"
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          Draft
                        </button>
                      </div>
                    </div>
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

                  {/* Complete Form & Docs Pill */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-bold border border-teal-100">
                      <Sliders size={13} /> {customFieldsCount} Form Fields
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-bold border border-blue-100">
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 shadow-xs transition"
                    >
                      <Pencil size={13} /> Edit Full Schema
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                  <Sliders size={20} className="text-emerald-600" />
                  {editingId ? `Edit Loan Form: ${formData.name}` : "Create New Loan Product"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Easily add, change, or remove questions, mark fields as Required or Optional, and configure loan limits.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-gray-200 px-6 gap-6 bg-white text-sm font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("fields")}
                className={`py-3.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
                  activeTab === "fields"
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <Sliders size={16} /> 1. Form Questions ({formData.customFields.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className={`py-3.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
                  activeTab === "documents"
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <FileText size={16} /> 2. Required Documents ({formData.requiredDocuments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`py-3.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
                  activeTab === "basic"
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <Layers size={16} /> 3. Loan Settings & Status
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
              {/* TAB: DYNAMIC FORM FIELDS */}
              {activeTab === "fields" && (
                <div className="space-y-5">
                  {/* Clean Section Filter Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-500">Show Section:</span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedStepFilter("ALL")}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                            selectedStepFilter === "ALL"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          All Questions ({formData.customFields.length})
                        </button>
                        {DEFAULT_STEPS.map((step) => {
                          const count = formData.customFields.filter((f) => f.stepIndex === step.stepIndex).length;
                          return (
                            <button
                              key={step.stepIndex}
                              type="button"
                              onClick={() => setSelectedStepFilter(String(step.stepIndex))}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                                selectedStepFilter === String(step.stepIndex)
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {step.icon || "📋"} {step.title} ({count})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <span className="text-xs text-gray-400 font-medium">
                      Showing <strong>{visibleFieldsWithIndices.length}</strong> questions
                    </span>
                  </div>

                  {/* List of Form Questions */}
                  <div className="space-y-2.5">
                    {visibleFieldsWithIndices.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-xl border border-gray-200 text-gray-500">
                        No questions in this section yet. Use the simple form below to add questions.
                      </div>
                    ) : (
                      visibleFieldsWithIndices.map(({ field, realIndex }) => {
                        const isEditingThis = editingFieldIndex === realIndex;

                        if (isEditingThis) {
                          // INLINE EDIT FORM FOR THIS QUESTION
                          return (
                            <div
                              key={realIndex}
                              className="p-5 bg-emerald-50/90 border-2 border-emerald-500 rounded-2xl shadow-md space-y-4"
                            >
                              <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                                <span className="text-xs font-black uppercase text-emerald-900 tracking-wider">
                                  ✏️ Edit Question #{realIndex + 1}: {field.label}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleSaveEditedField}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
                                  >
                                    <Check size={14} /> Save Changes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelFieldEdit}
                                    className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[11px] font-bold text-gray-700">Question Name (Display Label) *</label>
                                  <input
                                    type="text"
                                    value={fieldEditDraft.label}
                                    onChange={(e) => setFieldEditDraft({ ...fieldEditDraft, label: e.target.value })}
                                    className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1 font-semibold text-gray-900"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-gray-700">Question Answer Type</label>
                                  <select
                                    value={fieldEditDraft.fieldType}
                                    onChange={(e) => setFieldEditDraft({ ...fieldEditDraft, fieldType: e.target.value })}
                                    className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1 font-medium"
                                  >
                                    {FIELD_TYPES.map((t) => (
                                      <option key={t.value} value={t.value}>
                                        {t.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-gray-700">Form Section</label>
                                  <select
                                    value={fieldEditDraft.stepIndex}
                                    onChange={(e) => setFieldEditDraft({ ...fieldEditDraft, stepIndex: Number(e.target.value) })}
                                    className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1 font-medium"
                                  >
                                    {DEFAULT_STEPS.map((s) => (
                                      <option key={s.stepIndex} value={s.stepIndex}>
                                        {s.title}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[11px] font-bold text-gray-700">Example / Placeholder (Help text)</label>
                                  <input
                                    type="text"
                                    value={fieldEditDraft.placeholder}
                                    onChange={(e) => setFieldEditDraft({ ...fieldEditDraft, placeholder: e.target.value })}
                                    className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1"
                                    placeholder="e.g. As per Aadhaar card"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-gray-700">Question Required Status</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => setFieldEditDraft({ ...fieldEditDraft, required: true })}
                                      className={`px-3 py-2 text-xs font-bold rounded-lg border cursor-pointer transition ${
                                        fieldEditDraft.required
                                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                      }`}
                                    >
                                      ● Mandatory * (Customer must answer)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setFieldEditDraft({ ...fieldEditDraft, required: false })}
                                      className={`px-3 py-2 text-xs font-bold rounded-lg border cursor-pointer transition ${
                                        !fieldEditDraft.required
                                          ? "bg-gray-700 text-white border-gray-700 shadow-xs"
                                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                      }`}
                                    >
                                      ○ Optional (Can be skipped)
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {(fieldEditDraft.fieldType === "select" || fieldEditDraft.fieldType === "radio") && (
                                <div>
                                  <label className="text-[11px] font-bold text-gray-700">
                                    Choice Options (Separate with commas)
                                  </label>
                                  <input
                                    type="text"
                                    value={fieldEditDraft.options}
                                    onChange={(e) => setFieldEditDraft({ ...fieldEditDraft, options: e.target.value })}
                                    className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1"
                                    placeholder="e.g. Salaried, Self-Employed, Business Owner"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        }

                        // CLEAN, SIMPLE FIELD ROW (SUPER EASY FOR ANY USER TO UNDERSTAND)
                        return (
                          <div
                            key={realIndex}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-xs transition gap-3"
                          >
                            <div className="flex items-start sm:items-center gap-3">
                              {/* Clean Order Pill & Arrows */}
                              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 shrink-0">
                                <span className="text-xs font-extrabold text-gray-700 w-4 text-center">{realIndex + 1}</span>
                                <div className="flex flex-col">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveField(realIndex, "up")}
                                    disabled={realIndex === 0}
                                    className="text-gray-400 hover:text-emerald-600 disabled:opacity-20 cursor-pointer p-0.5"
                                    title="Move Up"
                                  >
                                    <ChevronUp size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveField(realIndex, "down")}
                                    disabled={realIndex === formData.customFields.length - 1}
                                    className="text-gray-400 hover:text-emerald-600 disabled:opacity-20 cursor-pointer p-0.5"
                                    title="Move Down"
                                  >
                                    <ChevronDown size={12} />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-gray-900">{field.label}</span>
                                  <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                    {getFieldTypeLabel(field.fieldType)}
                                  </span>
                                  {field.stepIndex !== undefined && (
                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                      {DEFAULT_STEPS.find((s) => s.stepIndex === field.stepIndex)?.title || `Section ${field.stepIndex + 1}`}
                                    </span>
                                  )}
                                </div>
                                {field.placeholder && (
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Example: "{field.placeholder}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right Side: Simple Toggle Switch & Action Buttons */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                              {/* Clean iOS-Style Toggle Switch */}
                              <div
                                onClick={() => handleToggleFieldRequired(realIndex)}
                                className="flex items-center gap-2 cursor-pointer select-none group"
                                title={field.validation?.required ? "Mandatory field. Click to make Optional." : "Optional field. Click to make Mandatory."}
                              >
                                <span className={`text-xs font-extrabold transition ${
                                  field.validation?.required ? "text-emerald-700" : "text-gray-400 font-medium"
                                }`}>
                                  {field.validation?.required ? "Mandatory *" : "Optional"}
                                </span>
                                <div className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                                  field.validation?.required ? "bg-emerald-600" : "bg-gray-300"
                                }`}>
                                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${
                                    field.validation?.required ? "translate-x-5" : "translate-x-0"
                                  }`} />
                                </div>
                              </div>

                              <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditField(realIndex)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition"
                                  title="Edit Field"
                                >
                                  <Pencil size={12} /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomField(realIndex)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg cursor-pointer transition"
                                  title="Delete Field"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* + ADD NEW QUESTION BOX (SUPER EASY) */}
                  <div className="p-5 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-300 rounded-2xl shadow-xs">
                    <h4 className="text-sm font-extrabold text-emerald-900 mb-3 flex items-center gap-2">
                      <Plus size={16} className="text-emerald-700" /> + Add a New Question to This Form
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700">Question Name (What customer sees) *</label>
                        <input
                          type="text"
                          placeholder="e.g. Father's Full Name"
                          value={newField.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            const autoKey = val.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
                            setNewField({
                              ...newField,
                              label: val,
                              fieldKey: newField.fieldKey ? newField.fieldKey : autoKey,
                            });
                          }}
                          className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1 font-semibold text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-700">Answer Type</label>
                        <select
                          value={newField.fieldType}
                          onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })}
                          className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1 font-medium"
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-700">Add to Section</label>
                        <select
                          value={newField.stepIndex}
                          onChange={(e) => setNewField({ ...newField, stepIndex: Number(e.target.value) })}
                          className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1 font-medium"
                        >
                          {DEFAULT_STEPS.map((s) => (
                            <option key={s.stepIndex} value={s.stepIndex}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700">Example Text (Shown inside input)</label>
                        <input
                          type="text"
                          placeholder="e.g. As per PAN card"
                          value={newField.placeholder}
                          onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                          className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1"
                        />
                      </div>

                      {(newField.fieldType === "select" || newField.fieldType === "radio") && (
                        <div>
                          <label className="text-[11px] font-bold text-gray-700">
                            Options (Comma-separated)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Salaried, Self-Employed, Business"
                            value={newField.options}
                            onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                            className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-emerald-200">
                      <div
                        onClick={() => setNewField({ ...newField, required: !newField.required })}
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        <div className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                          newField.required ? "bg-emerald-600" : "bg-gray-300"
                        }`}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${
                            newField.required ? "translate-x-5" : "translate-x-0"
                          }`} />
                        </div>
                        <span className="text-xs font-bold text-gray-700">
                          {newField.required ? "Mandatory * (Customer must fill)" : "Optional (Can be skipped)"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddCustomField}
                        className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shadow-sm"
                      >
                        + Add Question to Form
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: REQUIRED DOCUMENTS */}
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
                        {formData.requiredDocuments.map((doc, idx) => {
                          const isEditingThisDoc = editingDocIndex === idx;

                          if (isEditingThisDoc) {
                            return (
                              <div
                                key={idx}
                                className="p-3 bg-blue-50/80 border-2 border-blue-500 rounded-xl space-y-3"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[11px] font-bold text-gray-700">Document Label *</label>
                                    <input
                                      type="text"
                                      value={docEditDraft.label}
                                      onChange={(e) => setDocEditDraft({ ...docEditDraft, label: e.target.value })}
                                      className="w-full text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-lg mt-1"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-bold text-gray-700">Doc Type Code *</label>
                                    <input
                                      type="text"
                                      value={docEditDraft.docType}
                                      onChange={(e) => setDocEditDraft({ ...docEditDraft, docType: e.target.value })}
                                      className="w-full text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-lg mt-1 font-mono uppercase"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={docEditDraft.required}
                                      onChange={(e) => setDocEditDraft({ ...docEditDraft, required: e.target.checked })}
                                      className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    Mandatory Document
                                  </label>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={handleSaveEditedDoc}
                                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                                    >
                                      Save Doc
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelDocEdit}
                                      className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <div>
                                  <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    {doc.label}
                                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                      {doc.docType}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleDocRequired(idx)}
                                      title="Click to toggle Mandatory / Optional"
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide cursor-pointer border transition-all ${
                                        doc.required
                                          ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                          : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                                      }`}
                                    >
                                      {doc.required ? "● Mandatory (Click to make Optional)" : "○ Optional (Click to make Mandatory)"}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditDoc(idx)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                                >
                                  <Pencil size={12} /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDoc(idx)}
                                  className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                                  title="Delete Document"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
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
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                      >
                        + Add Document
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: GENERAL & FINANCIALS */}
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
                        className="w-full text-sm px-3.5 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
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
                        className="w-full text-sm px-3.5 py-2 border border-gray-200 rounded-xl uppercase font-mono focus:ring-2 focus:ring-emerald-500 font-bold"
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

                  {/* Product Status & Availability Mode */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase text-gray-700 tracking-wider">
                      Product Status & Availability Mode
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-600">Product Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1 font-bold text-gray-800"
                        >
                          <option value="ACTIVE">🟢 Active (Live & open for applications)</option>
                          <option value="COMING_SOON">🟣 Coming Soon (Visible in apps/web, applications blocked)</option>
                          <option value="MAINTENANCE">🟠 Under Maintenance (Visible in apps/web, applications blocked)</option>
                          <option value="DRAFT">⚪ Draft (Hidden from users)</option>
                          <option value="ARCHIVED">🔴 Archived (Hidden)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-600">Display Order</label>
                        <input
                          type="number"
                          value={formData.displayOrder}
                          onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                          className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1"
                        />
                      </div>
                    </div>

                    {(formData.status === "COMING_SOON" || formData.status === "MAINTENANCE") && (
                      <div className="pt-2 border-t border-gray-200 space-y-1">
                        <label className="text-[11px] font-bold text-amber-800">
                          {formData.status === "COMING_SOON" ? "Coming Soon Notice Message" : "Under Maintenance Notice Message"}
                        </label>
                        <input
                          type="text"
                          placeholder={
                            formData.status === "COMING_SOON"
                              ? "e.g. This loan product will be available soon. Stay tuned!"
                              : "e.g. We are currently upgrading this loan service. Please check back shortly."
                          }
                          value={formData.maintenanceMessage || ""}
                          onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                          className="w-full text-sm px-3 py-2 bg-white border border-amber-300 rounded-lg"
                        />
                        <p className="text-[11px] text-gray-500">
                          When users tap this product on the mobile app or web, this message is displayed and the application is blocked.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
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
