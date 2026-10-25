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
  Camera,
  UploadCloud,
  File,
  PenTool,
  Calendar,
  CreditCard,
  Hash,
  IndianRupee,
  Phone,
  Mail,
  Type,
  AlignLeft,
  FolderPlus,
  ArrowLeft,
  ArrowRight,
  Edit3,
} from "lucide-react";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

const FIELD_TYPES = [
  {
    value: "text",
    label: "Short Text",
    icon: "🔤",
    category: "Text & Numbers",
    desc: "Single-line text (e.g. Applicant Name, City, Father's Name)",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    value: "textarea",
    label: "Long Address / Notes",
    icon: "📝",
    category: "Text & Numbers",
    desc: "Multi-line text for detailed full addresses & remarks",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    value: "phone",
    label: "Phone / Mobile",
    icon: "📞",
    category: "Identity & Contact",
    desc: "10-digit mobile number with 🇮🇳 +91 verification",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    value: "email",
    label: "Email Address",
    icon: "📧",
    category: "Identity & Contact",
    desc: "Valid email address with @ check",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    value: "currency",
    label: "Currency / Amount (₹)",
    icon: "💰",
    category: "Text & Numbers",
    desc: "Indian Rupee (₹) amount with comma formatting",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "number",
    label: "Number / Quantity",
    icon: "🔢",
    category: "Text & Numbers",
    desc: "Numeric digits only (e.g. Dependents, Age, Years)",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    value: "date",
    label: "Date Picker",
    icon: "📅",
    category: "Text & Numbers",
    desc: "Calendar date (e.g. Date of Birth, Work Since)",
    badgeColor: "bg-pink-50 text-pink-700 border-pink-200",
  },
  {
    value: "pan",
    label: "PAN Card",
    icon: "💳",
    category: "Identity & Contact",
    desc: "10-character PAN number with auto-uppercase (ABCDE1234F)",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  {
    value: "aadhaar",
    label: "Aadhaar Number",
    icon: "🆔",
    category: "Identity & Contact",
    desc: "12-digit Indian Aadhaar card number",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    value: "image",
    label: "Photo / Image Upload",
    icon: "📸",
    category: "Uploads & Media",
    desc: "Camera & gallery photo upload (Selfie, Shop, Cheque, Asset)",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    value: "file",
    label: "Document / PDF File",
    icon: "📄",
    category: "Uploads & Media",
    desc: "Upload PDF or document file (Bank statement, salary slips)",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    value: "signature",
    label: "Digital Signature",
    icon: "✍️",
    category: "Uploads & Media",
    desc: "Customer draws signature on screen or uploads signature photo",
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
  },
  {
    value: "select",
    label: "Dropdown Menu",
    icon: "📋",
    category: "Choices & Agreements",
    desc: "Select one option from a clean dropdown list",
    badgeColor: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  {
    value: "radio",
    label: "Single Choice (Radio)",
    icon: "🔘",
    category: "Choices & Agreements",
    desc: "Click one option among radio buttons (e.g. Yes/No)",
    badgeColor: "bg-lime-50 text-lime-700 border-lime-200",
  },
  {
    value: "checkbox",
    label: "Checkbox / Toggle",
    icon: "☑️",
    category: "Choices & Agreements",
    desc: "Yes/No confirmation checkbox or declaration agreement",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
];

const getFieldTypeMeta = (type) => {
  return (
    FIELD_TYPES.find((f) => f.value === type) || {
      value: type,
      label: type || "Short Text",
      icon: "🔤",
      category: "Text & Numbers",
      desc: "Input field",
      badgeColor: "bg-gray-100 text-gray-700 border-gray-200",
    }
  );
};

const getFieldTypeLabel = (type) => {
  const meta = getFieldTypeMeta(type);
  return `${meta.icon} ${meta.label}`;
};

const DEFAULT_STEPS = [
  { stepIndex: 0, title: "1. Personal & KYC", icon: "👤", description: "Basic personal & contact information" },
  { stepIndex: 1, title: "2. Address", icon: "🏠", description: "Current and permanent address" },
  { stepIndex: 2, title: "3. Income & Job", icon: "💼", description: "Income, employer, and banking details" },
  { stepIndex: 3, title: "4. Loan & Bank", icon: "🏦", description: "Required loan amount and banking" },
];

const SECTION_ICONS = ["👤", "🏠", "💼", "🏦", "🚗", "🏡", "📄", "📑", "👥", "💳", "🛒", "🏢", "📋", "📍", "🛡️", "💰", "🎓", "💍"];

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

  // Section Management State (Full CRUD)
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionIcon, setNewSectionIcon] = useState("📁");

  const [editingSectionIndex, setEditingSectionIndex] = useState(null);
  const [editSectionTitle, setEditSectionTitle] = useState("");
  const [editSectionIcon, setEditSectionIcon] = useState("📋");

  // Visual Answer Type Picker Modal
  const [showTypePickerModal, setShowTypePickerModal] = useState(false);
  const [typePickerTarget, setTypePickerTarget] = useState("new"); // "new" or "edit"

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

  const currentSteps = formData.steps && formData.steps.length > 0 ? formData.steps : DEFAULT_STEPS;

  // ==================== SECTION CRUD OPERATIONS ====================
  const handleCreateSection = () => {
    if (!newSectionTitle.trim()) {
      showToast("Please enter a section title", "error");
      return;
    }
    const nextIndex = currentSteps.length;
    const cleanTitle = newSectionTitle.trim().replace(/^\d+\.\s*/, "");
    const newSection = {
      stepIndex: nextIndex,
      title: `${nextIndex + 1}. ${cleanTitle}`,
      icon: newSectionIcon || "📁",
      description: "",
    };
    const updatedSteps = [...currentSteps, newSection];
    setFormData((prev) => ({
      ...prev,
      steps: updatedSteps,
    }));
    setNewSectionTitle("");
    setNewSectionIcon("📁");
    setIsAddingSection(false);
    setSelectedStepFilter(String(nextIndex));
    setNewField((prev) => ({ ...prev, stepIndex: nextIndex }));
    showToast(`Section '${newSection.title}' created!`);
  };

  const handleStartEditSection = (index) => {
    const target = currentSteps[index];
    setEditingSectionIndex(index);
    setEditSectionTitle(target.title || "");
    setEditSectionIcon(target.icon || "📋");
  };

  const handleSaveEditSection = () => {
    if (!editSectionTitle.trim()) {
      showToast("Section title cannot be empty", "error");
      return;
    }
    const updatedSteps = currentSteps.map((step, idx) =>
      idx === editingSectionIndex
        ? { ...step, title: editSectionTitle.trim(), icon: editSectionIcon }
        : step
    );
    setFormData((prev) => ({
      ...prev,
      steps: updatedSteps,
    }));
    setEditingSectionIndex(null);
    showToast("Section updated!");
  };

  const handleDeleteSection = (indexToDelete) => {
    if (currentSteps.length <= 1) {
      showToast("You must keep at least one section in the form.", "error");
      return;
    }
    const sectionTitle = currentSteps[indexToDelete]?.title;
    if (
      !window.confirm(
        `Delete section '${sectionTitle}'? Any questions inside this section will be safely moved to Section 1 so you don't lose them.`
      )
    ) {
      return;
    }

    // Safely reassign any fields in this section to step 0
    const updatedFields = formData.customFields.map((f) => {
      if (f.stepIndex === indexToDelete) {
        return { ...f, stepIndex: 0 };
      } else if (f.stepIndex > indexToDelete) {
        return { ...f, stepIndex: f.stepIndex - 1 };
      }
      return f;
    });

    // Remove section and re-index
    const updatedSteps = currentSteps
      .filter((_, idx) => idx !== indexToDelete)
      .map((s, idx) => ({ ...s, stepIndex: idx }));

    setFormData((prev) => ({
      ...prev,
      steps: updatedSteps,
      customFields: updatedFields,
    }));

    if (selectedStepFilter === String(indexToDelete)) {
      setSelectedStepFilter("ALL");
    } else if (Number(selectedStepFilter) > indexToDelete) {
      setSelectedStepFilter(String(Number(selectedStepFilter) - 1));
    }
    showToast(`Section '${sectionTitle}' deleted.`);
  };

  const handleMoveSection = (index, direction) => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSteps.length) return;

    const newSteps = [...currentSteps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;

    // Re-index stepIndex
    const reindexedSteps = newSteps.map((s, idx) => ({ ...s, stepIndex: idx }));

    // Re-map field stepIndices
    const updatedFields = formData.customFields.map((f) => {
      if (f.stepIndex === index) {
        return { ...f, stepIndex: targetIndex };
      } else if (f.stepIndex === targetIndex) {
        return { ...f, stepIndex: index };
      }
      return f;
    });

    setFormData((prev) => ({
      ...prev,
      steps: reindexedSteps,
      customFields: updatedFields,
    }));

    if (selectedStepFilter === String(index)) {
      setSelectedStepFilter(String(targetIndex));
    } else if (selectedStepFilter === String(targetIndex)) {
      setSelectedStepFilter(String(index));
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
    if (!fieldEditDraft.label.trim()) {
      showToast("Question label is required", "error");
      return;
    }

    const autoKey = (fieldEditDraft.fieldKey || fieldEditDraft.label)
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "");
    const formattedKey = autoKey || `field_${Date.now()}`;

    const optionsArray = fieldEditDraft.options
      ? fieldEditDraft.options
          .split(",")
          .map((opt) => opt.trim())
          .filter(Boolean)
          .map((opt) => ({ label: opt, value: opt.toUpperCase().replace(/\s+/g, "_") }))
      : [];

    const updatedField = {
      fieldKey: formattedKey,
      label: fieldEditDraft.label.trim(),
      fieldType: fieldEditDraft.fieldType || "text",
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
    if (!newField.label.trim()) {
      showToast("Question Name is required", "error");
      return;
    }

    const autoKey = (newField.fieldKey || newField.label)
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "");
    const formattedKey = autoKey || `field_${Date.now()}`;

    const optionsArray = newField.options
      ? newField.options
          .split(",")
          .map((opt) => opt.trim())
          .filter(Boolean)
          .map((opt) => ({ label: opt, value: opt.toUpperCase().replace(/\s+/g, "_") }))
      : [];

    const fieldToAdd = {
      fieldKey: formattedKey,
      label: newField.label.trim(),
      fieldType: newField.fieldType || "text",
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

    setNewField((prev) => ({
      fieldKey: "",
      label: "",
      fieldType: "text",
      placeholder: "",
      required: true,
      options: "",
      stepIndex: prev.stepIndex,
      gridCol: 12,
    }));
    showToast(`Added '${fieldToAdd.label}' to Section ${(fieldToAdd.stepIndex || 0) + 1}`);
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
                  {/* Clean Section Filter Bar WITH FULL CRUD */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-gray-500 tracking-wider">
                          Form Sections
                        </span>
                        <span className="text-[11px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {currentSteps.length} Sections
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingSection(true);
                            setEditingSectionIndex(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          <Plus size={14} /> + Add New Section
                        </button>
                        <span className="text-xs text-gray-400 font-medium">
                          Showing <strong>{visibleFieldsWithIndices.length}</strong> questions
                        </span>
                      </div>
                    </div>

                    {/* Section Navigation Pills with Reorder, Edit & Delete */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedStepFilter("ALL")}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                          selectedStepFilter === "ALL"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        All Questions ({formData.customFields.length})
                      </button>

                      {currentSteps.map((step, idx) => {
                        const count = formData.customFields.filter((f) => f.stepIndex === step.stepIndex).length;
                        const isSelected = selectedStepFilter === String(step.stepIndex);

                        return (
                          <div
                            key={step.stepIndex}
                            className={`flex items-center rounded-xl transition border ${
                              isSelected
                                ? "bg-emerald-50 border-emerald-500 shadow-xs"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedStepFilter(String(step.stepIndex))}
                              className={`px-3 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                                isSelected ? "text-emerald-800" : "text-gray-700"
                              }`}
                            >
                              <span>{step.icon || "📋"}</span>
                              <span>{step.title}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                  isSelected ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"
                                }`}
                              >
                                {count}
                              </span>
                            </button>

                            {/* Section CRUD Actions: Move, Edit, Delete */}
                            <div className="flex items-center gap-0.5 pr-1.5 border-l border-gray-200/80 pl-1">
                              <button
                                type="button"
                                onClick={() => handleMoveSection(idx, "left")}
                                disabled={idx === 0}
                                className="p-1 text-gray-400 hover:text-emerald-700 disabled:opacity-20 cursor-pointer"
                                title="Move Section Left"
                              >
                                <ArrowLeft size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveSection(idx, "right")}
                                disabled={idx === currentSteps.length - 1}
                                className="p-1 text-gray-400 hover:text-emerald-700 disabled:opacity-20 cursor-pointer"
                                title="Move Section Right"
                              >
                                <ArrowRight size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEditSection(idx)}
                                className="p-1 text-gray-400 hover:text-blue-600 cursor-pointer"
                                title="Edit / Rename Section"
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSection(idx)}
                                className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                                title="Delete Section"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* INLINE ADD SECTION DRAWER */}
                    {isAddingSection && (
                      <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                            <FolderPlus size={15} /> Create New Form Section
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAddingSection(false)}
                            className="text-gray-400 hover:text-gray-700 cursor-pointer"
                          >
                            <X size={15} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-700">Section Title *</label>
                            <input
                              type="text"
                              placeholder="e.g. Vehicle Details or Co-Applicant KYC"
                              value={newSectionTitle}
                              onChange={(e) => setNewSectionTitle(e.target.value)}
                              className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1 font-semibold text-gray-900"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-gray-700">Choose Section Icon</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {SECTION_ICONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => setNewSectionIcon(emoji)}
                                  className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center cursor-pointer transition ${
                                    newSectionIcon === emoji
                                      ? "bg-emerald-600 text-white scale-110 shadow-xs"
                                      : "bg-white border border-gray-200 hover:bg-gray-100"
                                  }`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setIsAddingSection(false)}
                            className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleCreateSection}
                            className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 shadow-xs cursor-pointer"
                          >
                            Save Section
                          </button>
                        </div>
                      </div>
                    )}

                    {/* INLINE EDIT SECTION DRAWER */}
                    {editingSectionIndex !== null && (
                      <div className="p-4 bg-blue-50/70 border border-blue-300 rounded-xl space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                            <Pencil size={14} /> Rename Section #{editingSectionIndex + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingSectionIndex(null)}
                            className="text-gray-400 hover:text-gray-700 cursor-pointer"
                          >
                            <X size={15} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-700">Section Title *</label>
                            <input
                              type="text"
                              value={editSectionTitle}
                              onChange={(e) => setEditSectionTitle(e.target.value)}
                              className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1 font-semibold text-gray-900"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-gray-700">Choose Section Icon</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {SECTION_ICONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => setEditSectionIcon(emoji)}
                                  className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center cursor-pointer transition ${
                                    editSectionIcon === emoji
                                      ? "bg-blue-600 text-white scale-110 shadow-xs"
                                      : "bg-white border border-gray-200 hover:bg-gray-100"
                                  }`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingSectionIndex(null)}
                            className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEditSection}
                            className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-xs cursor-pointer"
                          >
                            Update Section
                          </button>
                        </div>
                      </div>
                    )}
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
                                  <label className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                                    <span>Real Answer Type</span>
                                    <span className="text-[10px] text-emerald-700 font-extrabold">Tap to change</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTypePickerTarget("edit");
                                      setShowTypePickerModal(true);
                                    }}
                                    className="w-full flex items-center justify-between p-2 mt-1 bg-white border border-gray-300 hover:border-emerald-500 rounded-lg transition cursor-pointer text-left shadow-xs"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <span className="text-lg p-0.5 bg-gray-50 rounded shrink-0">
                                        {getFieldTypeMeta(fieldEditDraft.fieldType).icon}
                                      </span>
                                      <span className="text-xs font-bold text-gray-800 truncate">
                                        {getFieldTypeMeta(fieldEditDraft.fieldType).label}
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                                      Change ▾
                                    </span>
                                  </button>
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-gray-700">Form Section</label>
                                  <select
                                    value={fieldEditDraft.stepIndex}
                                    onChange={(e) => setFieldEditDraft({ ...fieldEditDraft, stepIndex: Number(e.target.value) })}
                                    className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1 font-medium"
                                  >
                                    {currentSteps.map((s) => (
                                      <option key={s.stepIndex} value={s.stepIndex}>
                                        {s.icon || "📋"} {s.title}
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

                        const fieldMeta = getFieldTypeMeta(field.fieldType);

                        // CLEAN, SIMPLE FIELD ROW (WITH REAL INPUT PREVIEW)
                        return (
                          <div
                            key={realIndex}
                            className="p-4 bg-white border border-gray-200 rounded-2xl hover:border-emerald-400 hover:shadow-xs transition space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                                    <span className="text-sm font-extrabold text-gray-900">{field.label}</span>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${fieldMeta.badgeColor}`}>
                                      {fieldMeta.icon} {fieldMeta.label}
                                    </span>
                                    {field.stepIndex !== undefined && (
                                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                        {currentSteps.find((s) => s.stepIndex === field.stepIndex)?.title || `Section ${field.stepIndex + 1}`}
                                      </span>
                                    )}
                                  </div>
                                  {field.placeholder && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      Placeholder: "{field.placeholder}"
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

                            {/* REAL VISUAL INPUT PREVIEW (SUPER CLEAR FOR UNEDUCATED / NON-TECHNICAL ADMINS) */}
                            <div className="pt-2 border-t border-gray-100">
                              {field.fieldType === "image" && (
                                <div className="p-3 bg-rose-50/50 border-2 border-dashed border-rose-300 rounded-xl flex items-center justify-center gap-2 text-rose-700 text-xs font-bold">
                                  <Camera size={16} />
                                  <span>📸 Take Photo or Upload Image (Selfie, Shop photo, Vehicle, Cheque leaf)</span>
                                </div>
                              )}
                              {field.fieldType === "file" && (
                                <div className="p-3 bg-orange-50/50 border-2 border-dashed border-orange-300 rounded-xl flex items-center justify-center gap-2 text-orange-700 text-xs font-bold">
                                  <FileText size={16} />
                                  <span>📄 Choose PDF or Document File to Upload (Max 10MB)</span>
                                </div>
                              )}
                              {field.fieldType === "signature" && (
                                <div className="p-3 bg-violet-50/50 border-2 border-dashed border-violet-300 rounded-xl flex items-center justify-center gap-2 text-violet-700 text-xs font-bold">
                                  <PenTool size={16} />
                                  <span>✍️ Customer Signature Pad (Sign with finger / stylus)</span>
                                </div>
                              )}
                              {field.fieldType === "phone" && (
                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-500 max-w-sm">
                                  <span className="font-bold text-gray-700">🇮🇳 +91</span>
                                  <span className="text-gray-400">{field.placeholder || "98765 43210"}</span>
                                </div>
                              )}
                              {field.fieldType === "currency" && (
                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-500 max-w-sm">
                                  <span className="font-bold text-emerald-700">₹</span>
                                  <span className="text-gray-400">{field.placeholder || "0.00"}</span>
                                </div>
                              )}
                              {field.fieldType === "pan" && (
                                <div className="flex items-center gap-2 bg-cyan-50/60 border border-cyan-300 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-800 max-w-sm">
                                  <span className="font-bold">💳 PAN:</span>
                                  <span className="tracking-widest font-bold uppercase">{field.placeholder || "ABCDE1234F"}</span>
                                </div>
                              )}
                              {field.fieldType === "aadhaar" && (
                                <div className="flex items-center gap-2 bg-teal-50/60 border border-teal-300 rounded-lg px-3 py-1.5 text-xs font-mono text-teal-800 max-w-sm">
                                  <span className="font-bold">🆔 UID:</span>
                                  <span className="tracking-widest font-bold">{field.placeholder || "XXXX-XXXX-XXXX"}</span>
                                </div>
                              )}
                              {field.fieldType === "date" && (
                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-500 max-w-sm">
                                  <Calendar size={14} className="text-pink-600" />
                                  <span className="text-gray-400">{field.placeholder || "DD / MM / YYYY"}</span>
                                </div>
                              )}
                              {field.fieldType === "checkbox" && (
                                <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                                  <div className="w-4 h-4 border-2 border-emerald-600 rounded bg-emerald-50 flex items-center justify-center text-emerald-700 text-[10px]">✓</div>
                                  <span>{field.placeholder || "I agree and confirm this declaration"}</span>
                                </div>
                              )}
                              {(field.fieldType === "select" || field.fieldType === "radio") && (
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  <span className="text-[11px] font-bold text-gray-400">Options:</span>
                                  {(field.options || []).length > 0 ? (
                                    field.options.map((opt, oi) => (
                                      <span key={oi} className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200">
                                        {opt.label || opt.value || opt}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[11px] text-gray-400 italic">No options added yet</span>
                                  )}
                                </div>
                              )}
                              {(field.fieldType === "text" || field.fieldType === "textarea" || field.fieldType === "number" || field.fieldType === "email") && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-400 max-w-sm truncate">
                                  {field.placeholder || `Customer fills ${field.label.toLowerCase()} here...`}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* + ADD NEW QUESTION BOX (WITH VISUAL TYPE PICKER & LIVE PREVIEW) */}
                  <div className="p-5 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-300 rounded-2xl shadow-xs space-y-4">
                    <h4 className="text-sm font-extrabold text-emerald-900 flex items-center gap-2">
                      <Plus size={16} className="text-emerald-700" /> + Add a New Question to This Form
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700">Question Name (What customer sees) *</label>
                        <input
                          type="text"
                          placeholder="e.g. Applicant Selfie or Father's Name"
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

                      {/* Visual Answer Type Button (Replaces ugly native select) */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                          <span>Real Input / Answer Type *</span>
                          <span className="text-[10px] text-emerald-700 font-extrabold">Tap to change</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setTypePickerTarget("new");
                            setShowTypePickerModal(true);
                          }}
                          className="w-full flex items-center justify-between p-2 mt-1 bg-white border-2 border-emerald-400 hover:border-emerald-600 rounded-xl transition cursor-pointer text-left shadow-xs group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-lg p-0.5 bg-emerald-50 rounded shrink-0">
                              {getFieldTypeMeta(newField.fieldType).icon}
                            </span>
                            <div className="truncate">
                              <p className="text-xs font-black text-gray-900 group-hover:text-emerald-700 truncate">
                                {getFieldTypeMeta(newField.fieldType).label}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate">
                                {getFieldTypeMeta(newField.fieldType).desc}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 shrink-0">
                            Change ▾
                          </span>
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-700">Add to Section</label>
                        <select
                          value={newField.stepIndex}
                          onChange={(e) => setNewField({ ...newField, stepIndex: Number(e.target.value) })}
                          className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg mt-1 font-medium"
                        >
                          {currentSteps.map((s) => (
                            <option key={s.stepIndex} value={s.stepIndex}>
                              {s.icon || "📋"} {s.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700">Example Text (Shown inside input)</label>
                        <input
                          type="text"
                          placeholder="e.g. As per Aadhaar or PAN"
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

                    {/* LIVE REAL INPUT PREVIEW IN ADD BOX */}
                    <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                          Live Preview: Real input format for "{getFieldTypeMeta(newField.fieldType).label}"
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${getFieldTypeMeta(newField.fieldType).badgeColor}`}>
                          {getFieldTypeMeta(newField.fieldType).icon} {getFieldTypeMeta(newField.fieldType).label}
                        </span>
                      </div>

                      {newField.fieldType === "image" && (
                        <div className="p-3 bg-rose-50/50 border-2 border-dashed border-rose-300 rounded-xl flex items-center justify-center gap-2 text-rose-700 text-xs font-bold">
                          <Camera size={16} />
                          <span>📸 Take Photo or Upload Image (Selfie, Shop, Vehicle, Cheque leaf)</span>
                        </div>
                      )}
                      {newField.fieldType === "file" && (
                        <div className="p-3 bg-orange-50/50 border-2 border-dashed border-orange-300 rounded-xl flex items-center justify-center gap-2 text-orange-700 text-xs font-bold">
                          <FileText size={16} />
                          <span>📄 Choose PDF or Document File to Upload (Max 10MB)</span>
                        </div>
                      )}
                      {newField.fieldType === "signature" && (
                        <div className="p-3 bg-violet-50/50 border-2 border-dashed border-violet-300 rounded-xl flex items-center justify-center gap-2 text-violet-700 text-xs font-bold">
                          <PenTool size={16} />
                          <span>✍️ Customer Signature Pad (Sign with finger / stylus)</span>
                        </div>
                      )}
                      {newField.fieldType === "phone" && (
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-500 max-w-sm">
                          <span className="font-bold text-gray-700">🇮🇳 +91</span>
                          <span className="text-gray-400">{newField.placeholder || "98765 43210"}</span>
                        </div>
                      )}
                      {newField.fieldType === "currency" && (
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-500 max-w-sm">
                          <span className="font-bold text-emerald-700">₹</span>
                          <span className="text-gray-400">{newField.placeholder || "0.00"}</span>
                        </div>
                      )}
                      {newField.fieldType === "pan" && (
                        <div className="flex items-center gap-2 bg-cyan-50/60 border border-cyan-300 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-800 max-w-sm">
                          <span className="font-bold">💳 PAN:</span>
                          <span className="tracking-widest font-bold uppercase">{newField.placeholder || "ABCDE1234F"}</span>
                        </div>
                      )}
                      {newField.fieldType === "aadhaar" && (
                        <div className="flex items-center gap-2 bg-teal-50/60 border border-teal-300 rounded-lg px-3 py-1.5 text-xs font-mono text-teal-800 max-w-sm">
                          <span className="font-bold">🆔 UID:</span>
                          <span className="tracking-widest font-bold">{newField.placeholder || "XXXX-XXXX-XXXX"}</span>
                        </div>
                      )}
                      {newField.fieldType === "date" && (
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-500 max-w-sm">
                          <Calendar size={14} className="text-pink-600" />
                          <span className="text-gray-400">{newField.placeholder || "DD / MM / YYYY"}</span>
                        </div>
                      )}
                      {newField.fieldType === "checkbox" && (
                        <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                          <div className="w-4 h-4 border-2 border-emerald-600 rounded bg-emerald-50 flex items-center justify-center text-emerald-700 text-[10px]">✓</div>
                          <span>{newField.placeholder || "I agree and confirm this declaration"}</span>
                        </div>
                      )}
                      {(newField.fieldType === "select" || newField.fieldType === "radio") && (
                        <div className="text-xs text-gray-500">
                          {newField.options ? (
                            <div className="flex flex-wrap gap-1.5">
                              {newField.options.split(",").map((o, idx) => (
                                <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-semibold text-[11px]">
                                  {o.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="italic text-gray-400">Type comma-separated options above to preview chips</span>
                          )}
                        </div>
                      )}
                      {(newField.fieldType === "text" || newField.fieldType === "textarea" || newField.fieldType === "number" || newField.fieldType === "email") && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-400 max-w-sm truncate">
                          {newField.placeholder || "Customer fills text answer here..."}
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
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <Plus size={14} /> + Add Question to Form
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

      {/* VISUAL ANSWER TYPE PICKER MODAL (ALL REAL INPUT TYPES) */}
      {showTypePickerModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-600" />
                  Choose Real Answer / Input Type
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select how customers or partners will answer this question.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTypePickerModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content: Categorized Grid */}
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
              {[
                { title: "📸 Photos, Documents & Signature", category: "Uploads & Media" },
                { title: "🆔 Identity & Contact Verification", category: "Identity & Contact" },
                { title: "💰 Loan Amount, Numbers & Dates", category: "Text & Numbers" },
                { title: "🔘 Choices & Agreements", category: "Choices & Agreements" },
              ].map((grp) => {
                const typesInGroup = FIELD_TYPES.filter((t) => t.category === grp.category);
                if (typesInGroup.length === 0) return null;

                return (
                  <div key={grp.title}>
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">
                      {grp.title}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {typesInGroup.map((typeObj) => {
                        const isCurrent =
                          typePickerTarget === "new"
                            ? newField.fieldType === typeObj.value
                            : fieldEditDraft?.fieldType === typeObj.value;

                        return (
                          <div
                            key={typeObj.value}
                            onClick={() => {
                              if (typePickerTarget === "new") {
                                setNewField({ ...newField, fieldType: typeObj.value });
                              } else if (fieldEditDraft) {
                                setFieldEditDraft({ ...fieldEditDraft, fieldType: typeObj.value });
                              }
                              setShowTypePickerModal(false);
                            }}
                            className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-start gap-3 select-none ${
                              isCurrent
                                ? "bg-emerald-50/80 border-emerald-500 shadow-xs"
                                : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                            }`}
                          >
                            <span className="text-2xl p-2 bg-gray-50 rounded-xl border border-gray-200 shrink-0">
                              {typeObj.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-gray-900">
                                  {typeObj.label}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                                    Selected ✓
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                                {typeObj.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTypePickerModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
