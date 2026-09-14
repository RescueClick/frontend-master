import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Sparkles,
  Gift,
  Award,
  Zap,
  TrendingUp,
  Percent,
  Users,
  Wallet,
  CheckCircle2,
  RefreshCw,
  Search,
  Image as ImageIcon,
  IndianRupee,
  Layers,
  X,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Smartphone,
  MapPin,
} from "lucide-react";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";

const GRADIENT_PRESETS = [
  { id: "teal", label: "Teal (Brand)", bg: "from-teal-600 to-teal-800", hexStart: "#0D9488", hexEnd: "#0F766E" },
  { id: "emerald", label: "Emerald (Cash)", bg: "from-emerald-600 to-emerald-800", hexStart: "#059669", hexEnd: "#047857" },
  { id: "blue", label: "Blue (Trust)", bg: "from-blue-600 to-blue-800", hexStart: "#2563EB", hexEnd: "#1D4ED8" },
  { id: "indigo", label: "Indigo (Royal)", bg: "from-indigo-600 to-indigo-800", hexStart: "#4F46E5", hexEnd: "#3730A3" },
  { id: "purple", label: "Purple (Growth)", bg: "from-purple-600 to-purple-800", hexStart: "#7C3AED", hexEnd: "#5B21B6" },
  { id: "amber", label: "Amber (Bonus)", bg: "from-amber-500 to-amber-700", hexStart: "#D97706", hexEnd: "#B45309" },
  { id: "rose", label: "Rose (Perk)", bg: "from-rose-600 to-rose-800", hexStart: "#E11D48", hexEnd: "#BE123C" },
  { id: "dark", label: "Dark (Midnight)", bg: "from-slate-800 to-slate-950", hexStart: "#1E293B", hexEnd: "#0F172A" },
];

const ICONS_MAP = {
  gift: Gift,
  award: Award,
  zap: Zap,
  "trending-up": TrendingUp,
  percent: Percent,
  users: Users,
  wallet: Wallet,
  sparkles: Sparkles,
};

const getIconComponent = (iconName) => {
  return ICONS_MAP[iconName] || Gift;
};

export default function AdminReferralBanners({ embedded = false }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table' | 'slider'
  const [sliderIndex, setSliderIndex] = useState(0);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formState, setFormState] = useState({
    title: "",
    subtitle: "",
    description: "",
    rewardAmount: "",
    badgeText: "",
    gradientPreset: "teal",
    iconName: "gift",
    ctaText: "Refer & Earn",
    displayOrder: 1,
    isActive: true,
    terms: "",
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch banners
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { adminToken } = getAuthData();
      const res = await axios.get(`${backendurl}/referral-banners/admin/list`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setBanners(res.data?.banners || []);
    } catch (err) {
      console.error("Failed to fetch referral banners:", err);
      toast.error(err?.response?.data?.message || "Failed to load referral banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingBannerId(null);
    setFormState({
      title: "",
      subtitle: "",
      description: "",
      rewardAmount: "",
      badgeText: "Instant Reward",
      gradientPreset: "teal",
      iconName: "gift",
      ctaText: "Refer & Earn",
      displayOrder: banners.length + 1,
      isActive: true,
      terms: "",
      imageUrl: "",
    });
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  };

  const openEditModal = (banner) => {
    setModalMode("edit");
    setEditingBannerId(banner._id);
    setFormState({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      rewardAmount: banner.rewardAmount || "",
      badgeText: banner.badgeText || "",
      gradientPreset: banner.gradientPreset || "teal",
      iconName: banner.iconName || "gift",
      ctaText: banner.ctaText || "Refer & Earn",
      displayOrder: banner.displayOrder ?? 1,
      isActive: banner.isActive !== undefined ? banner.isActive : true,
      terms: banner.terms || "",
      imageUrl: banner.imageUrl || "",
    });
    setImageFile(null);
    setImagePreview(banner.imageUrl || "");
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image file is too large. Max limit is 10MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImageSelection = () => {
    setImageFile(null);
    setImagePreview("");
    setFormState((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      toast.error("Please enter a banner title");
      return;
    }

    setSaving(true);
    try {
      const { adminToken } = getAuthData();
      const headers = { Authorization: `Bearer ${adminToken}` };

      // Prepare payload
      let payload;
      if (imageFile) {
        payload = new FormData();
        payload.append("title", formState.title);
        payload.append("subtitle", formState.subtitle);
        payload.append("description", formState.description);
        payload.append("rewardAmount", formState.rewardAmount);
        payload.append("badgeText", formState.badgeText);
        payload.append("gradientPreset", formState.gradientPreset);
        payload.append("iconName", formState.iconName);
        payload.append("ctaText", formState.ctaText);
        payload.append("displayOrder", String(formState.displayOrder));
        payload.append("isActive", String(formState.isActive));
        payload.append("terms", formState.terms);
        payload.append("image", imageFile);
      } else {
        payload = { ...formState };
      }

      if (modalMode === "create") {
        await axios.post(`${backendurl}/referral-banners/admin`, payload, { headers });
        toast.success("Referral banner created successfully!");
      } else {
        await axios.put(`${backendurl}/referral-banners/admin/${editingBannerId}`, payload, { headers });
        toast.success("Referral banner updated successfully!");
      }

      setModalOpen(false);
      fetchBanners();
    } catch (err) {
      console.error("Failed to save referral banner:", err);
      toast.error(err?.response?.data?.message || "Failed to save referral banner");
    } finally {
      setSaving(false);
    }
  };

  const toggleBannerStatus = async (banner) => {
    try {
      const { adminToken } = getAuthData();
      await axios.patch(
        `${backendurl}/referral-banners/admin/${banner._id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success(`Banner is now ${!banner.isActive ? "active" : "inactive"}`);
      setBanners((prev) =>
        prev.map((b) => (b._id === banner._id ? { ...b, isActive: !b.isActive } : b))
      );
    } catch (err) {
      toast.error("Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!bannerToDelete) return;
    setDeleting(true);
    try {
      const { adminToken } = getAuthData();
      await axios.delete(`${backendurl}/referral-banners/admin/${bannerToDelete._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      toast.success("Referral banner deleted");
      setDeleteModalOpen(false);
      setBannerToDelete(null);
      fetchBanners();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete banner");
    } finally {
      setDeleting(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!window.confirm("Seed default referral benefits? This will add high-converting template benefit cards.")) {
      return;
    }
    try {
      const { adminToken } = getAuthData();
      await axios.post(
        `${backendurl}/referral-banners/admin/seed-defaults`,
        { force: true },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success("Default referral benefits loaded!");
      fetchBanners();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load defaults");
    }
  };

  // Filtered banners
  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      const matchesSearch =
        (b.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.subtitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.badgeText || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.rewardAmount || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? b.isActive
          : !b.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [banners, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = banners.length;
    const active = banners.filter((b) => b.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [banners]);

  // Selected gradient config
  const selectedGradient =
    GRADIENT_PRESETS.find((p) => p.id === formState.gradientPreset) || GRADIENT_PRESETS[0];
  const IconComp = getIconComponent(formState.iconName);

  return (
    <div className={embedded ? "w-full" : "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"}>
      {/* Top Header & Breadcrumbs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          {!embedded && (
            <Link
              to="/admin/referral-rewards"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back to Referral Rewards
            </Link>
          )}
          <div className={`${embedded ? "" : "mt-2"} flex items-center gap-3`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-200/70 shadow-sm">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Referral Benefits & Banners
              </h1>
              <p className="text-sm text-slate-500">
                Manage promotional banners and perk cards displayed on the mobile app{" "}
                <span className="font-semibold text-slate-700">Refer & Earn</span> screen.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSeedDefaults}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            title="Load default referral templates"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" />
            Load Defaults
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-teal-700/20 transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <Plus className="h-4 w-4" />
            Add Referral Banner
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Benefits
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-500">Configured in system</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Active in App
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-950">{stats.active}</p>
          <p className="mt-1 text-xs text-emerald-700 font-medium">Visible to partners on mobile</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Inactive / Draft
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <EyeOff className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-700">{stats.inactive}</p>
          <p className="mt-1 text-xs text-slate-500">Hidden from mobile app</p>
        </div>
      </div>

      {/* HOW THIS WORKS IN MOBILE APP EXPLANATION BANNER */}
      <div className="mb-6 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/90 via-emerald-50/50 to-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
            <Sparkles size={20} />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Where Are These Cards Located in the App?
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  These cards are located in the <strong>Partner Mobile App</strong> on the <strong>Referral Rewards</strong> screen. You do <strong>NOT</strong> need to select just one card — <strong>all cards marked "ACTIVE" (#1, #2, #3, #4) appear together as a horizontal swipeable slider</strong> at the top of that screen.
                </p>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-teal-100/90 px-3 py-1.5 text-xs font-bold text-teal-800 border border-teal-200 shadow-2xs shrink-0">
                <Smartphone size={14} className="text-teal-700" />
                <span>Screen: Partner App ➔ Referral Rewards</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="rounded-lg border border-teal-200/80 bg-white/95 p-2.5 text-xs text-slate-700 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-teal-800 mb-0.5">
                  <MapPin size={13} className="text-teal-600" />
                  <span>Exact Location:</span>
                </div>
                <p className="text-[11px] text-slate-600">Partner App ➔ Menu ➔ <strong>Referral Rewards</strong> ➔ Top Slider (Slide #1 to #4).</p>
              </div>
              <div className="rounded-lg border border-teal-200/80 bg-white/95 p-2.5 text-xs text-slate-700 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-teal-800 mb-0.5">
                  <Eye size={13} className="text-teal-600" />
                  <span>Want only 1 card?</span>
                </div>
                <p className="text-[11px] text-slate-600">Click <strong>"Hide"</strong> on the other 3. Only the remaining Active card will show.</p>
              </div>
              <div className="rounded-lg border border-teal-200/80 bg-white/95 p-2.5 text-xs text-slate-700 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-teal-800 mb-0.5">
                  <Edit3 size={13} className="text-teal-600" />
                  <span>Change Text or Reward:</span>
                </div>
                <p className="text-[11px] text-slate-600">Click the <strong>Pencil (Edit)</strong> to change amounts (e.g. ₹100), titles, or colors.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[260px]">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, badge, reward amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="all">All Status ({stats.total})</option>
            <option value="active">Active Only ({stats.active})</option>
            <option value="inactive">Inactive Only ({stats.inactive})</option>
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode("slider")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "slider"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone size={13} className="text-teal-600" />
            Live Mobile Swipe
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "cards"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Card Previews
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "table"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Table View
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading referral benefits...</p>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 ring-1 ring-teal-200/50">
            <Gift className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">No Referral Banners Found</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {searchQuery || statusFilter !== "all"
              ? "No banners match your current search/filter criteria."
              : "Create your first referral benefit banner or load default templates to display in the mobile app."}
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleSeedDefaults}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              Load Default Templates
            </button>
            <button
              onClick={openCreateModal}
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-teal-700"
            >
              + Create New Banner
            </button>
          </div>
        </div>
      ) : viewMode === "slider" ? (
        /* Interactive Mobile Slider Simulator */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/70 p-6 sm:p-10 shadow-xs">
          <div className="mb-5 text-center max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-200 mb-2">
              <Smartphone size={13} className="text-teal-700" /> Live Mobile Swipe Simulator
            </span>
            <h3 className="text-base font-bold text-slate-900">Partner App Referral Screen Preview</h3>
            <p className="text-xs text-slate-500 mt-1">
              Click the arrows or dots below to test how these cards slide on a partner's phone screen:
            </p>
          </div>

          {/* Smartphone Frame */}
          <div className="w-full max-w-sm rounded-[36px] bg-slate-900 p-3.5 shadow-2xl ring-1 ring-slate-800 relative">
            {/* Phone Notch */}
            <div className="mx-auto mb-2.5 h-4 w-28 rounded-full bg-slate-800 flex items-center justify-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-slate-900" />
              <div className="h-1.5 w-10 rounded-full bg-slate-900" />
            </div>

            {/* Phone Screen Mock */}
            <div className="overflow-hidden rounded-[26px] bg-slate-50 border border-slate-200 min-h-[420px] flex flex-col justify-between shadow-inner">
              {/* App Screen Header */}
              <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowLeft size={16} className="text-slate-700" />
                  <span className="text-xs font-bold text-slate-800">Referral Rewards</span>
                </div>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Slide {Math.min(sliderIndex, filteredBanners.length - 1) + 1} of {filteredBanners.length}
                </span>
              </div>

              {/* Slider Area */}
              <div className="p-4 relative">
                <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center justify-between">
                  <span>WHY REFER PARTNERS?</span>
                  <span className="text-teal-600 font-semibold cursor-pointer">All Perks &gt;</span>
                </div>

                {/* Animated Card */}
                {(() => {
                  const safeIndex = Math.min(sliderIndex, Math.max(0, filteredBanners.length - 1));
                  const banner = filteredBanners[safeIndex] || filteredBanners[0];
                  if (!banner) return null;
                  const gradient = GRADIENT_PRESETS.find((p) => p.id === banner.gradientPreset) || GRADIENT_PRESETS[0];
                  const CardIcon = getIconComponent(banner.iconName);

                  return (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={banner._id || safeIndex}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.22 }}
                        className={`relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-2xl p-4 text-white shadow-md bg-gradient-to-br ${gradient.bg}`}
                      >
                        {banner.imageUrl && (
                          <div
                            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-35"
                            style={{ backgroundImage: `url(${banner.imageUrl})` }}
                          />
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10" />

                        {/* Top badge */}
                        <div className="relative z-10 flex items-start justify-between gap-2">
                          {banner.badgeText && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase backdrop-blur-md">
                              <CardIcon className="h-3 w-3" />
                              {banner.badgeText}
                            </span>
                          )}
                          <span className="rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-semibold">
                            #{banner.displayOrder ?? safeIndex + 1}
                          </span>
                        </div>

                        {/* Middle info */}
                        <div className="relative z-10 mt-2">
                          {banner.rewardAmount && (
                            <div className="text-lg font-extrabold tracking-tight drop-shadow-xs">
                              {banner.rewardAmount}
                            </div>
                          )}
                          <h4 className="text-sm font-bold leading-snug drop-shadow-xs line-clamp-2">
                            {banner.title}
                          </h4>
                          {banner.subtitle && (
                            <p className="mt-1 text-[11px] text-white/90 line-clamp-2 leading-relaxed">
                              {banner.subtitle}
                            </p>
                          )}
                        </div>

                        {/* Bottom CTA */}
                        <div className="relative z-10 mt-3 flex items-center justify-between border-t border-white/20 pt-2 text-[11px]">
                          <span className="text-white/80 font-medium capitalize">
                            {gradient.label.split(" ")[0]} theme
                          </span>
                          <span className="flex items-center gap-1 font-bold text-white">
                            {banner.ctaText || "Invite"} <ChevronRight size={12} />
                          </span>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  );
                })()}

                {/* Slider Controls */}
                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSliderIndex((prev) => (prev > 0 ? prev - 1 : filteredBanners.length - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-100 transition active:scale-95"
                    title="Previous Slide"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Dots */}
                  <div className="flex items-center gap-1.5">
                    {filteredBanners.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={() => setSliderIndex(dotIdx)}
                        className={`h-2 rounded-full transition-all ${
                          dotIdx === Math.min(sliderIndex, filteredBanners.length - 1)
                            ? "w-6 bg-teal-600"
                            : "w-2 bg-slate-300 hover:bg-slate-400"
                        }`}
                        title={`Go to Slide ${dotIdx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSliderIndex((prev) => (prev < filteredBanners.length - 1 ? prev + 1 : 0))}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-100 transition active:scale-95"
                    title="Next Slide"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Below-Slider Mobile Mock Body */}
              <div className="p-4 bg-white border-t border-slate-100 flex-1 flex flex-col justify-between">
                <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/50 p-3 text-center">
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Invite Partners & Earn</span>
                  <span className="text-xs text-slate-600 mt-0.5 block">Share your referral code to earn cash rewards on every loan disbursed.</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      const safeIndex = Math.min(sliderIndex, Math.max(0, filteredBanners.length - 1));
                      const banner = filteredBanners[safeIndex];
                      if (banner) toggleBannerStatus(banner);
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Toggle Active/Hide
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const safeIndex = Math.min(sliderIndex, Math.max(0, filteredBanners.length - 1));
                      const banner = filteredBanners[safeIndex];
                      if (banner) openEditModal(banner);
                    }}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    <Edit3 size={12} /> Edit This Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === "cards" ? (
        /* Cards Preview Grid */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBanners.map((banner) => {
            const gradient =
              GRADIENT_PRESETS.find((p) => p.id === banner.gradientPreset) || GRADIENT_PRESETS[0];
            const CardIcon = getIconComponent(banner.iconName);

            return (
              <div
                key={banner._id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-md ${
                  banner.isActive
                    ? "border-slate-200/90 bg-white shadow-xs"
                    : "border-slate-200 bg-slate-50/80 opacity-75"
                }`}
              >
                {/* App Screen Location Tag Header */}
                <div className="bg-teal-50/90 border-b border-teal-100 px-4 py-2 flex items-center justify-between text-[11px] font-bold text-teal-800">
                  <span className="flex items-center gap-1.5">
                    <Smartphone size={13} className="text-teal-600" />
                    <span>Partner App ➔ Referral Rewards</span>
                  </span>
                  <span className="bg-teal-200/60 text-teal-900 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                    Slide #{banner.displayOrder ?? 0}
                  </span>
                </div>

                {/* Visual Banner Preview Card (Mobile replica) */}
                <div
                  className={`relative flex min-h-[170px] flex-col justify-between overflow-hidden p-5 text-white bg-gradient-to-br ${gradient.bg}`}
                >
                  {/* Optional Background Image */}
                  {banner.imageUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30 transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url(${banner.imageUrl})` }}
                    />
                  ) : null}

                  {/* Gradient sheen overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10" />

                  {/* Top Row: Badge & Status */}
                  <div className="relative z-10 flex items-start justify-between gap-2">
                    {banner.badgeText ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase backdrop-blur-md">
                        <CardIcon className="h-3 w-3" />
                        {banner.badgeText}
                      </span>
                    ) : (
                      <span />
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-xs">
                        #{banner.displayOrder ?? 0}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs ${
                          banner.isActive ? "bg-emerald-500/90 text-white" : "bg-slate-700/90 text-slate-200"
                        }`}
                      >
                        {banner.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Middle Content */}
                  <div className="relative z-10 mt-3">
                    {banner.rewardAmount ? (
                      <div className="inline-block text-xl font-extrabold tracking-tight drop-shadow-xs">
                        {banner.rewardAmount}
                      </div>
                    ) : null}
                    <h4 className="mt-0.5 text-base font-bold leading-snug drop-shadow-xs line-clamp-2">
                      {banner.title}
                    </h4>
                    {banner.subtitle ? (
                      <p className="mt-1 text-xs text-white/90 line-clamp-2 leading-relaxed">
                        {banner.subtitle}
                      </p>
                    ) : null}
                  </div>

                  {/* Bottom Row */}
                  <div className="relative z-10 mt-4 flex items-center justify-between pt-2 border-t border-white/20 text-xs">
                    <span className="text-white/80 font-medium capitalize">
                      {gradient.label} Theme
                    </span>
                    <div className="flex items-center gap-1 font-semibold text-white">
                      <span>{banner.ctaText || "Invite"}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>

                {/* Card Management Footer */}
                <div className="flex flex-1 flex-col justify-between p-4 bg-white">
                  <div>
                    {banner.description ? (
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {banner.description}
                      </p>
                    ) : (
                      <p className="text-xs italic text-slate-400">No extended description.</p>
                    )}

                    {banner.terms ? (
                      <div className="mt-3 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-500 border border-slate-100">
                        <span className="font-semibold text-slate-700">Terms: </span>
                        <span className="line-clamp-2">{banner.terms}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Admin Controls */}
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleBannerStatus(banner)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        banner.isActive
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {banner.isActive ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          Show
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(banner)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        title="Edit Banner"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBannerToDelete(banner);
                          setDeleteModalOpen(true);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        title="Delete Banner"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Order</th>
                  <th className="px-4 py-3.5">Banner Preview</th>
                  <th className="px-4 py-3.5">Title & Subtitle</th>
                  <th className="px-4 py-3.5">App Screen Location</th>
                  <th className="px-4 py-3.5">Reward Highlight</th>
                  <th className="px-4 py-3.5">Badge & Theme</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBanners.map((banner) => {
                  const gradient =
                    GRADIENT_PRESETS.find((p) => p.id === banner.gradientPreset) || GRADIENT_PRESETS[0];
                  const CardIcon = getIconComponent(banner.iconName);

                  return (
                    <tr key={banner._id} className="transition hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                        #{banner.displayOrder ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className={`relative flex h-14 w-28 items-center justify-center overflow-hidden rounded-xl text-white shadow-2xs bg-gradient-to-br ${gradient.bg}`}
                        >
                          {banner.imageUrl ? (
                            <img
                              src={banner.imageUrl}
                              alt={banner.title}
                              className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-40"
                            />
                          ) : null}
                          <CardIcon className="h-5 w-5 text-white/90 drop-shadow-xs" />
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1">{banner.title}</div>
                        {banner.subtitle ? (
                          <div className="text-xs text-slate-500 line-clamp-1">{banner.subtitle}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 border border-teal-200/80">
                            <Smartphone className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                            Partner App ➔ Referral Rewards
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 pl-1">
                            Top Carousel · Slide #{banner.displayOrder ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {banner.rewardAmount ? (
                          <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
                            {banner.rewardAmount}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {banner.badgeText && (
                            <span className="inline-block text-xs font-semibold text-slate-700">
                              {banner.badgeText}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 capitalize">
                            {gradient.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleBannerStatus(banner)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                            banner.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              banner.isActive ? "bg-emerald-600" : "bg-slate-400"
                            }`}
                          />
                          {banner.isActive ? "Active" : "Hidden"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(banner)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Edit Banner"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBannerToDelete(banner);
                              setDeleteModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Delete Banner"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Banner */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {modalMode === "create" ? "Add Referral Benefit Banner" : "Edit Referral Banner"}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure perks, rewards, and visual layout shown on mobile Referral screen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Left Column: Form Fields */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Earn ₹1,000 on Every Loan Disbursal"
                      value={formState.title}
                      onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Subtitle / Catchphrase
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cash reward on every single loan disbursed by your partner"
                      value={formState.subtitle}
                      onChange={(e) => setFormState({ ...formState, subtitle: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  {/* Reward Amount & Badge Text */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Reward Highlight
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ₹1,000 / Disbursal"
                        value={formState.rewardAmount}
                        onChange={(e) => setFormState({ ...formState, rewardAmount: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Badge Chip Text
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Every Disbursed Loan"
                        value={formState.badgeText}
                        onChange={(e) => setFormState({ ...formState, badgeText: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Detailed Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Explain how the partner earns this benefit..."
                      value={formState.description}
                      onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  {/* Terms & CTA */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        CTA Button Label
                      </label>
                      <input
                        type="text"
                        placeholder="Refer & Earn"
                        value={formState.ctaText}
                        onChange={(e) => setFormState({ ...formState, ctaText: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Display Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formState.displayOrder}
                        onChange={(e) => setFormState({ ...formState, displayOrder: Number(e.target.value) })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>

                  {/* Terms */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Terms / Eligibility Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Valid on verified partner disbursed files."
                      value={formState.terms}
                      onChange={(e) => setFormState({ ...formState, terms: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                    <div>
                      <span className="text-sm font-semibold text-slate-900">Active in Mobile App</span>
                      <p className="text-xs text-slate-500">Enable to show on partner Referral screen</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={formState.isActive}
                        onChange={(e) => setFormState({ ...formState, isActive: e.target.checked })}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                    </label>
                  </div>
                </div>

                {/* Right Column: Visual Theme & Live Mobile Preview */}
                <div className="space-y-4">
                  {/* Gradient Theme Picker */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Gradient Card Theme
                    </label>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {GRADIENT_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormState({ ...formState, gradientPreset: p.id })}
                          className={`relative flex flex-col items-center justify-center rounded-xl p-2.5 text-white transition bg-gradient-to-br ${
                            p.bg
                          } ${
                            formState.gradientPreset === p.id
                              ? "ring-2 ring-teal-500 ring-offset-2 scale-102"
                              : "opacity-80 hover:opacity-100"
                          }`}
                        >
                          <span className="text-[11px] font-bold drop-shadow-xs capitalize">{p.id}</span>
                          {formState.gradientPreset === p.id && (
                            <CheckCircle2 className="mt-1 h-3.5 w-3.5 text-white drop-shadow-xs" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icon Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Badge Icon
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.keys(ICONS_MAP).map((k) => {
                        const Icon = ICONS_MAP[k];
                        const isSelected = formState.iconName === k;
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setFormState({ ...formState, iconName: k })}
                            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                              isSelected
                                ? "border-teal-600 bg-teal-50 text-teal-800 ring-1 ring-teal-600"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span className="capitalize">{k}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Banner Image (File upload or direct URL) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Optional Background Image
                    </label>
                    <div className="mt-2 space-y-2">
                      {imagePreview ? (
                        <div className="relative overflow-hidden rounded-xl border border-slate-200">
                          <img
                            src={imagePreview}
                            alt="Banner Preview"
                            className="h-28 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImageSelection}
                            className="absolute right-2 top-2 rounded-lg bg-black/60 p-1 text-white hover:bg-black/80"
                            title="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-4 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/20">
                          <UploadCloud className="h-6 w-6 text-slate-400" />
                          <span className="mt-1 text-xs font-semibold text-slate-700">
                            Upload Banner Image (JPG, PNG)
                          </span>
                          <span className="text-[11px] text-slate-400">Max size: 10MB</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Or Image URL:</span>
                        <input
                          type="url"
                          placeholder="https://example.com/banner.png"
                          value={formState.imageUrl}
                          onChange={(e) => {
                            setFormState({ ...formState, imageUrl: e.target.value });
                            if (e.target.value) setImagePreview(e.target.value);
                          }}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* LIVE MOBILE PREVIEW */}
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Live Mobile Card Preview
                    </span>
                    <div className="mt-2 overflow-hidden rounded-2xl border border-slate-300 shadow-md">
                      <div
                        className={`relative flex min-h-[175px] flex-col justify-between p-4 text-white bg-gradient-to-br ${selectedGradient.bg}`}
                      >
                        {imagePreview ? (
                          <div
                            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-35"
                            style={{ backgroundImage: `url(${imagePreview})` }}
                          />
                        ) : null}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10" />

                        {/* Top row */}
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase backdrop-blur-md">
                            <IconComp className="h-3 w-3" />
                            {formState.badgeText || "BENEFIT"}
                          </span>
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase backdrop-blur-xs">
                            Preview
                          </span>
                        </div>

                        {/* Middle */}
                        <div className="relative z-10 my-2">
                          {formState.rewardAmount && (
                            <span className="inline-block text-xl font-extrabold tracking-tight drop-shadow-xs">
                              {formState.rewardAmount}
                            </span>
                          )}
                          <div className="text-base font-bold leading-snug drop-shadow-xs">
                            {formState.title || "Referral Benefit Title"}
                          </div>
                          {formState.subtitle && (
                            <p className="mt-0.5 text-xs text-white/90 line-clamp-2">
                              {formState.subtitle}
                            </p>
                          )}
                        </div>

                        {/* Bottom CTA */}
                        <div className="relative z-10 flex items-center justify-between border-t border-white/20 pt-2 text-[11px] font-semibold text-white/95">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-amber-300" />
                            {formState.ctaText || "Refer & Earn"}
                          </span>
                          <span className="text-[10px] opacity-80">Tap to Share</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {modalMode === "create" ? "Create Benefit Banner" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && bannerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/60">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Delete Referral Banner</h3>
            <p className="mt-1 text-sm text-slate-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-800">"{bannerToDelete.title}"</span>? This
              will remove it from the mobile app Referral screen.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setBannerToDelete(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting && <RefreshCw className="h-4 w-4 animate-spin" />}
                Delete Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
