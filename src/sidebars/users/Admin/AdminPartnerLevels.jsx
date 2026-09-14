import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Award,
  Shield,
  Star,
  Trophy,
  Crown,
  Sparkles,
  Zap,
  Gem,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  RotateCcw,
  Save,
  Palette,
  Layers,
  ArrowRight,
  Info,
  X,
  Smartphone,
  ArrowUp,
  ArrowDown,
  Copy,
  Search,
  ArrowUpDown,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";
import { DEFAULT_BANNER_CONFIG } from "./MilestoneBannerEditor";

const ICON_MAP = {
  Shield: Shield,
  Award: Award,
  Star: Star,
  Trophy: Trophy,
  Crown: Crown,
  Sparkles: Sparkles,
  Gem: Gem,
  Zap: Zap,
};

const COLOR_PRESETS = [
  { name: "Bronze / Amber", color: "#B45309", bg: "#FFFBEB", accent: "#FEF3C7" },
  { name: "Silver / Slate", color: "#64748B", bg: "#F8FAFC", accent: "#F1F5F9" },
  { name: "Gold / Yellow", color: "#CA8A04", bg: "#FEFCE8", accent: "#FEF9C3" },
  { name: "Ruby / Red", color: "#E11D48", bg: "#FFF1F2", accent: "#FFE4E6" },
  { name: "Diamond / Teal", color: "#0D9488", bg: "#F0FDF4", accent: "#CCFBF1" },
  { name: "Platinum / Dark", color: "#0F172A", bg: "#F8FAFC", accent: "#E2E8F0" },
  { name: "Titanium / Purple", color: "#7C3AED", bg: "#FAF5FF", accent: "#F3E8FF" },
  { name: "Crown Elite / Blue", color: "#2563EB", bg: "#EFF6FF", accent: "#DBEAFE" },
];

const QUICK_VOLUME_PRESETS = [
  { label: "₹10 Lakhs", min: 1000000, bonus: 1000, name: "Bronze", id: "BRONZE", icon: "Shield", colorPreset: COLOR_PRESETS[0] },
  { label: "₹20 Lakhs", min: 2000000, bonus: 2000, name: "Silver", id: "SILVER", icon: "Award", colorPreset: COLOR_PRESETS[1] },
  { label: "₹30 Lakhs", min: 3000000, bonus: 3000, name: "Gold", id: "GOLD", icon: "Star", colorPreset: COLOR_PRESETS[2] },
  { label: "₹40 Lakhs", min: 4000000, bonus: 4000, name: "Ruby", id: "RUBY", icon: "Gem", colorPreset: COLOR_PRESETS[3] },
  { label: "₹50 Lakhs", min: 5000000, bonus: 5000, name: "Diamond", id: "DIAMOND", icon: "Sparkles", colorPreset: COLOR_PRESETS[4] },
  { label: "₹1 Crore", min: 10000000, bonus: 10000, name: "Platinum", id: "PLATINUM", icon: "Trophy", colorPreset: COLOR_PRESETS[5] },
  { label: "₹2 Crores", min: 20000000, bonus: 20000, name: "Titanium", id: "TITANIUM", icon: "Crown", colorPreset: COLOR_PRESETS[6] },
  { label: "₹5 Crores", min: 50000000, bonus: 50000, name: "Crown Elite", id: "CROWN_ELITE", icon: "Crown", colorPreset: COLOR_PRESETS[7] },
];

const DEFAULT_CONFIG = {
  hero: DEFAULT_BANNER_CONFIG,
  levels: [
    {
      id: "BRONZE",
      name: "Bronze",
      iconName: "Shield",
      color: "#B45309",
      bgColor: "#FFFBEB",
      accentColor: "#FEF3C7",
      criteria: "Achieve ₹10L+ monthly disbursement volume",
      minDisbursement: 1000000,
      rewardAmount: 1000,
      benefits: [
        "Earn ₹1,000 monthly milestone cash bonus",
        "Standard commission payouts on every loan",
        "Access to all standard loan products & banks",
        "Eligible for monthly milestone incentives",
      ],
    },
    {
      id: "SILVER",
      name: "Silver",
      iconName: "Award",
      color: "#64748B",
      bgColor: "#F8FAFC",
      accentColor: "#F1F5F9",
      criteria: "Achieve ₹20L+ monthly disbursement volume",
      minDisbursement: 2000000,
      rewardAmount: 2000,
      benefits: [
        "Earn ₹2,000 monthly milestone cash bonus",
        "Priority file processing & fast-track approval",
        "Exclusive Silver dashboard badge",
        "Dedicated email & support helpline",
      ],
    },
    {
      id: "GOLD",
      name: "Gold",
      iconName: "Star",
      color: "#CA8A04",
      bgColor: "#FEFCE8",
      accentColor: "#FEF9C3",
      criteria: "Achieve ₹30L+ monthly disbursement volume",
      minDisbursement: 3000000,
      rewardAmount: 3000,
      benefits: [
        "Earn ₹3,000 monthly milestone cash bonus",
        "Dedicated Relationship Manager (RM)",
        "Faster loan logins & desk clearance",
        "Special festive campaigns & booster incentives",
      ],
    },
    {
      id: "RUBY",
      name: "Ruby",
      iconName: "Gem",
      color: "#E11D48",
      bgColor: "#FFF1F2",
      accentColor: "#FFE4E6",
      criteria: "Achieve ₹40L+ monthly disbursement volume",
      minDisbursement: 4000000,
      rewardAmount: 4000,
      benefits: [
        "Earn ₹4,000 monthly milestone cash bonus",
        "Priority underwriting & fast turnaround",
        "Exclusive Ruby tier dashboard badge",
        "Direct credit coordinator support",
      ],
    },
    {
      id: "DIAMOND",
      name: "Diamond",
      iconName: "Sparkles",
      color: "#0D9488",
      bgColor: "#F0FDF4",
      accentColor: "#CCFBF1",
      criteria: "Achieve ₹50L+ monthly disbursement volume",
      minDisbursement: 5000000,
      rewardAmount: 5000,
      benefits: [
        "Earn ₹5,000 monthly milestone cash bonus",
        "Senior Relationship Manager (RM) assigned",
        "Priority payout clearance & same-day validation",
        "Early access to exclusive high-ticket loan products",
      ],
    },
    {
      id: "PLATINUM",
      name: "Platinum",
      iconName: "Trophy",
      color: "#0F172A",
      bgColor: "#F8FAFC",
      accentColor: "#E2E8F0",
      criteria: "Achieve ₹1Cr+ monthly disbursement volume",
      minDisbursement: 10000000,
      rewardAmount: 10000,
      benefits: [
        "Earn ₹10,000 monthly milestone cash bonus",
        "24/7 VIP desk support & relationship priority",
        "Fast-track instant payout settlement",
        "Executive partner certificates & VIP recognition",
      ],
    },
    {
      id: "TITANIUM",
      name: "Titanium",
      iconName: "Crown",
      color: "#7C3AED",
      bgColor: "#FAF5FF",
      accentColor: "#F3E8FF",
      criteria: "Achieve ₹2Cr+ monthly disbursement volume",
      minDisbursement: 20000000,
      rewardAmount: 20000,
      benefits: [
        "Earn ₹20,000 monthly milestone cash bonus",
        "VIP partner status across all lender banks",
        "Direct escalation line to DhanSource credit heads",
        "Quarterly awards & luxury networking invitations",
      ],
    },
    {
      id: "CROWN_ELITE",
      name: "Crown Elite",
      iconName: "Crown",
      color: "#2563EB",
      bgColor: "#EFF6FF",
      accentColor: "#DBEAFE",
      criteria: "Achieve ₹5Cr+ monthly disbursement volume",
      minDisbursement: 50000000,
      rewardAmount: 50000,
      benefits: [
        "Earn ₹50,000 monthly milestone cash bonus (+unlimited scaling)",
        "Highest commission tier & top revenue share",
        "DhanSource Elite Council membership",
        "All-inclusive Annual Gala VIP invitation",
      ],
    },
  ],
};

const formatInr = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`;

const formatInrWords = (amount) => {
  const num = Number(amount || 0);
  if (num >= 10000000) {
    const cr = num / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Crore${cr > 1 ? "s" : ""}`;
  }
  if (num >= 100000) {
    const lakh = num / 100000;
    return `₹${lakh % 1 === 0 ? lakh : lakh.toFixed(2)} Lakh${lakh > 1 ? "s" : ""}`;
  }
  return formatInr(num);
};

export default function AdminPartnerLevels() {
  const [hero, setHero] = useState(DEFAULT_CONFIG.hero);
  const [levels, setLevels] = useState(DEFAULT_CONFIG.levels);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPreviewLevelIdx, setSelectedPreviewLevelIdx] = useState(0);
  const [previewTab, setPreviewTab] = useState("hero"); // 'hero' | 'tierCard'

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1); // -1 = adding new
  const [levelForm, setLevelForm] = useState({
    id: "",
    name: "",
    iconName: "Shield",
    color: "#B45309",
    bgColor: "#FFFBEB",
    accentColor: "#FEF3C7",
    criteria: "",
    minDisbursement: 1000000,
    rewardAmount: 1000,
    benefits: [""],
  });

  const [newBenefitInput, setNewBenefitInput] = useState("");

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const auth = getAuthData();
      const token =
        auth?.adminToken ||
        auth?.asmToken ||
        localStorage.getItem("super_admin_token") ||
        localStorage.getItem("token");

      const res = await axios.get(`${backendurl}/admin/partner-levels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.levels && Array.isArray(res.data.levels) && res.data.levels.length > 0) {
        setLevels(res.data.levels);
      } else {
        setLevels(DEFAULT_CONFIG.levels);
      }
      if (res.data?.hero) {
        setHero(res.data.hero);
      }
    } catch (err) {
      console.warn("Notice: Loaded default DhanSource milestone tiers template:", err?.message);
      setLevels(DEFAULT_CONFIG.levels);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      const auth = getAuthData();
      const token =
        auth?.adminToken ||
        auth?.asmToken ||
        localStorage.getItem("super_admin_token") ||
        localStorage.getItem("token");

      const res = await axios.put(
        `${backendurl}/admin/partner-levels`,
        { hero, levels },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data?.message || "Levels & Perks saved! Live-synced with Mobile App & Incentive Ledger.");
      if (res.data?.levels) setLevels(res.data.levels);
      if (res.data?.hero) setHero(res.data.hero);
    } catch (err) {
      console.error("Failed to save levels config:", err);
      toast.error(err.response?.data?.message || "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        "Reset all tiers to the current standard policy (8 tiers: ₹1,000 cash bonus per ₹10L volume)?"
      )
    ) {
      setHero(DEFAULT_CONFIG.hero);
      setLevels(DEFAULT_CONFIG.levels);
      toast.success("Reset to 8 standard tiers in preview. Click 'Save All Changes' to apply live!");
    }
  };

  const handleSortByVolume = () => {
    const sorted = [...levels].sort(
      (a, b) => Number(a.minDisbursement || 0) - Number(b.minDisbursement || 0)
    );
    setLevels(sorted);
    toast.success("Sorted all tiers ascending by disbursement volume");
  };

  const handleMoveLevel = (idx, direction) => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= levels.length) return;
    const reordered = [...levels];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);
    setLevels(reordered);
    toast.success(`Moved "${moved.name}" tier ${direction === "up" ? "left" : "right"}`);
  };

  const handleDuplicateLevel = (idx) => {
    const original = levels[idx];
    const clone = {
      ...original,
      id: `${original.id}_COPY`,
      name: `${original.name} (Copy)`,
      minDisbursement: original.minDisbursement ? original.minDisbursement + 1000000 : 1000000,
      rewardAmount: original.rewardAmount ? original.rewardAmount + 1000 : 1000,
      benefits: [...(original.benefits || [])],
    };
    const updated = [...levels];
    updated.splice(idx + 1, 0, clone);
    setLevels(updated);
    toast.success(`Cloned "${original.name}" tier. Click Edit to customize.`);
  };

  const handleDeleteLevel = (idx) => {
    if (levels.length <= 1) {
      toast.error("You must have at least one active tier level");
      return;
    }
    const target = levels[idx];
    if (window.confirm(`Are you sure you want to delete the "${target.name}" tier?`)) {
      const updated = levels.filter((_, i) => i !== idx);
      setLevels(updated);
      toast.success(`Removed "${target.name}" tier. Click 'Save All Changes' to persist.`);
    }
  };

  const openAddModal = () => {
    setEditingIndex(-1);
    setLevelForm({
      id: `TIER_${levels.length + 1}`,
      name: "",
      iconName: "Star",
      color: "#0D9488",
      bgColor: "#F0FDF4",
      accentColor: "#CCFBF1",
      criteria: "Achieve ₹25L+ monthly disbursement volume",
      minDisbursement: 2500000,
      rewardAmount: 2500,
      benefits: [
        "Earn ₹2,500 monthly milestone cash bonus",
        "Priority file processing & fast-track approval",
        "Dedicated support line",
      ],
    });
    setNewBenefitInput("");
    setEditModalOpen(true);
  };

  const openEditModal = (idx) => {
    setEditingIndex(idx);
    const target = levels[idx];
    setLevelForm({
      id: target.id || "",
      name: target.name || "",
      iconName: target.iconName || "Shield",
      color: target.color || "#0D9488",
      bgColor: target.bgColor || "#F8FAFC",
      accentColor: target.accentColor || "#E2E8F0",
      criteria: target.criteria || "",
      minDisbursement: target.minDisbursement || 0,
      rewardAmount: target.rewardAmount || 0,
      benefits: target.benefits ? [...target.benefits] : [],
    });
    setNewBenefitInput("");
    setEditModalOpen(true);
  };

  const applyPresetToForm = (preset) => {
    setLevelForm((prev) => ({
      ...prev,
      id: preset.id || prev.id,
      name: preset.name || prev.name,
      minDisbursement: preset.min,
      rewardAmount: preset.bonus,
      iconName: preset.icon || prev.iconName,
      color: preset.colorPreset?.color || prev.color,
      bgColor: preset.colorPreset?.bg || prev.bgColor,
      accentColor: preset.colorPreset?.accent || prev.accentColor,
      criteria: `Achieve ${formatInrWords(preset.min)}+ monthly disbursement volume`,
      benefits: [
        `Earn ${formatInr(preset.bonus)} monthly milestone cash bonus`,
        "Priority file processing & fast-track approval",
        `Exclusive ${preset.name} dashboard badge`,
        "Dedicated partner support channels",
      ],
    }));
    toast.success(`Applied ${preset.label} preset`);
  };

  const handleAddBenefitToForm = () => {
    if (!newBenefitInput.trim()) return;
    setLevelForm((prev) => ({
      ...prev,
      benefits: [...prev.benefits, newBenefitInput.trim()],
    }));
    setNewBenefitInput("");
  };

  const handleRemoveBenefitFromForm = (bIdx) => {
    setLevelForm((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== bIdx),
    }));
  };

  const handleSaveLevelModal = (e) => {
    e.preventDefault();
    if (!levelForm.name.trim() || !levelForm.id.trim()) {
      toast.error("Please provide a Level Name and Unique Level ID");
      return;
    }

    const cleanLevel = {
      ...levelForm,
      id: levelForm.id.toUpperCase().trim(),
      name: levelForm.name.trim(),
      minDisbursement: Math.max(0, Number(levelForm.minDisbursement || 0)),
      rewardAmount: Math.max(0, Number(levelForm.rewardAmount || 0)),
      benefits: levelForm.benefits.filter((b) => b && b.trim().length > 0),
    };

    if (editingIndex === -1) {
      setLevels([...levels, cleanLevel]);
      toast.success(`Added "${cleanLevel.name}" tier to preview`);
    } else {
      const updated = [...levels];
      updated[editingIndex] = cleanLevel;
      setLevels(updated);
      toast.success(`Updated "${cleanLevel.name}" tier in preview`);
    }

    setEditModalOpen(false);
  };

  // Filtered tiers for quick search
  const filteredLevels = useMemo(() => {
    if (!searchTerm.trim()) return levels;
    const term = searchTerm.toLowerCase();
    return levels.filter(
      (lvl) =>
        lvl.name?.toLowerCase().includes(term) ||
        lvl.id?.toLowerCase().includes(term) ||
        lvl.criteria?.toLowerCase().includes(term)
    );
  }, [levels, searchTerm]);

  const activePreviewTier = levels[selectedPreviewLevelIdx] || levels[0] || DEFAULT_CONFIG.levels[0];
  const ActivePreviewIcon = ICON_MAP[activePreviewTier.iconName] || Shield;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Layers size={15} />
            <span>Partner Gamification & Tier Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Partner Levels, Badges & Perks (CRUD)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Full Admin Power: Configure every badge, volume target, cash bonus, and bullet-point perk displayed in the mobile app & incentive engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSortByVolume}
            title="Sort tiers from lowest volume to highest"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-2xs"
          >
            <ArrowUpDown size={14} className="text-gray-500" />
            <span>Sort by Volume</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            title="Reset to current 8 standard tiers (₹1k / 10L rule)"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-2xs"
          >
            <RotateCcw size={14} className="text-gray-500" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
          >
            <Plus size={15} className="text-emerald-700" />
            <span>Add New Tier</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2 text-xs font-bold text-white shadow-md hover:opacity-90 disabled:opacity-50 transition"
          >
            <Save size={15} />
            <span>{isSaving ? "Saving Live..." : "Save All Changes"}</span>
          </button>
        </div>
      </div>

      {/* Power Metrics / Sync Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="p-2.5 bg-slate-50 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
            Active Tiers
          </span>
          <span className="text-lg font-black text-gray-900 mt-0.5 block">
            {levels.length} Tiers Configured
          </span>
        </div>

        <div className="p-2.5 bg-teal-50/70 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-teal-600 block tracking-wider">
            Standard Policy Rule
          </span>
          <span className="text-sm font-black text-teal-900 mt-0.5 block truncate">
            ₹1,000 Bonus / ₹10L Volume
          </span>
        </div>

        <div className="p-2.5 bg-amber-50/70 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-amber-700 block tracking-wider">
            Milestone Bonus Range
          </span>
          <span className="text-sm font-black text-amber-900 mt-0.5 block">
            {formatInr(Math.min(...levels.map((l) => l.rewardAmount || 0)))} ➔{" "}
            {formatInr(Math.max(...levels.map((l) => l.rewardAmount || 0)))}
          </span>
        </div>

        <div className="p-2.5 bg-emerald-50/70 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
              Mobile App Sync
            </span>
            <span className="text-xs font-black text-emerald-900 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live & Synchronized
            </span>
          </div>
          <Zap size={18} className="text-emerald-600 shrink-0 opacity-80" />
        </div>
      </div>

      {/* Tier / Level Cards Section (Power CRUD Grid) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>Configured Partner Tiers ({filteredLevels.length})</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                8 Milestone Ladder
              </span>
            </h2>
            <p className="text-xs text-gray-500">
              Each tier card controls the badge, monthly criteria, bonus cash rewards, and bullet point perks on mobile.
            </p>
          </div>

          {/* Search bar & quick tools */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tier by name, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 text-xs w-52 sm:w-60 focus:outline-none focus:border-brand-primary"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:opacity-90 shadow-2xs transition"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* The Tier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {filteredLevels.map((lvl, idx) => {
            const IconComponent = ICON_MAP[lvl.iconName] || Shield;
            const originalIndex = levels.findIndex((l) => l.id === lvl.id);
            const actualIdx = originalIndex !== -1 ? originalIndex : idx;

            return (
              <div
                key={lvl.id || idx}
                className="bg-white rounded-2xl border-2 border-gray-200/90 hover:border-brand-primary/50 transition-all duration-200 flex flex-col justify-between shadow-xs overflow-hidden group"
              >
                <div>
                  {/* Card Header */}
                  <div
                    className="p-4 border-b border-gray-100 flex items-start justify-between"
                    style={{ backgroundColor: lvl.bgColor || "#F8FAFC" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0"
                        style={{ backgroundColor: lvl.accentColor || "#E2E8F0" }}
                      >
                        <IconComponent size={20} style={{ color: lvl.color || "#0D9488" }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-1 rounded bg-black/10 text-gray-700 font-bold">
                            #{actualIdx + 1}
                          </span>
                          <h3 className="font-extrabold text-base text-gray-900 leading-tight">
                            {lvl.name}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 font-bold block mt-0.5">
                          ID: {lvl.id}
                        </span>
                        <span
                          className="text-xs font-black block mt-0.5"
                          style={{ color: lvl.color || "#0D9488" }}
                        >
                          {lvl.rewardAmount > 0 ? `+${formatInr(lvl.rewardAmount)} Bonus` : "Standard Tier"}
                        </span>
                      </div>
                    </div>

                    {/* Power Action Buttons: Reorder, Duplicate, Edit, Delete */}
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      <button
                        type="button"
                        disabled={actualIdx === 0}
                        onClick={() => handleMoveLevel(actualIdx, "up")}
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-gray-500 hover:text-gray-900 border border-gray-200 shadow-2xs transition disabled:opacity-30"
                        title="Move left/up"
                      >
                        <ArrowUp size={12} />
                      </button>

                      <button
                        type="button"
                        disabled={actualIdx === levels.length - 1}
                        onClick={() => handleMoveLevel(actualIdx, "down")}
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-gray-500 hover:text-gray-900 border border-gray-200 shadow-2xs transition disabled:opacity-30"
                        title="Move right/down"
                      >
                        <ArrowDown size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateLevel(actualIdx)}
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-gray-600 hover:text-brand-primary border border-gray-200 shadow-2xs transition"
                        title="Clone tier"
                      >
                        <Copy size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(actualIdx)}
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-gray-700 hover:text-brand-primary border border-gray-200 shadow-2xs transition"
                        title="Edit tier details"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLevel(actualIdx)}
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-gray-400 hover:text-red-600 border border-gray-200 shadow-2xs transition"
                        title="Delete tier"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Criteria Box */}
                  <div className="p-4 border-b border-gray-100 bg-slate-50/50">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                      Unlock Target / Criteria
                    </span>
                    <p className="text-xs font-semibold text-gray-800 leading-snug">
                      {lvl.criteria || "—"}
                    </p>
                    {lvl.minDisbursement > 0 && (
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-emerald-700 font-bold">
                          Min: {formatInr(lvl.minDisbursement)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {formatInrWords(lvl.minDisbursement)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Benefits Bullet Points */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                        Perks & Benefits ({lvl.benefits?.length || 0})
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        +{formatInr(lvl.rewardAmount)} Reward
                      </span>
                    </div>

                    <ul className="space-y-1.5">
                      {(lvl.benefits || []).map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2 text-xs text-gray-700 leading-tight">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 font-medium">Icon: {lvl.iconName || "Shield"}</span>
                  <button
                    type="button"
                    onClick={() => openEditModal(actualIdx)}
                    className="font-bold text-brand-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>Edit Tier</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit / Add Level Modal (Full Power CRUD) */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-gray-100 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold">
                  {editingIndex === -1 ? "Add New Partner Tier Level" : `Edit Tier: ${levelForm.name || levelForm.id}`}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure tier ID, badge icons, colors, monthly volume criteria, milestone cash reward, and perks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLevelModal} className="p-6 overflow-y-auto space-y-4">
              {/* Quick Volume & Rule Presets */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
                  ⚡ Quick Volume & Rule Presets (1-Click Fill)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_VOLUME_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPresetToForm(preset)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-teal-50 hover:border-teal-300 text-[11px] font-bold text-slate-700 transition"
                    >
                      {preset.label} (+₹{preset.bonus.toLocaleString("en-IN")})
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Level Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Silver, Gold, Platinum, Diamond"
                    value={levelForm.name}
                    onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Unique Level ID / Key
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SILVER, GOLD, PLATINUM, DIAMOND"
                    value={levelForm.id}
                    onChange={(e) => setLevelForm({ ...levelForm, id: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono uppercase focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Icon Symbol
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.keys(ICON_MAP).map((iconKey) => {
                      const IconC = ICON_MAP[iconKey];
                      const selected = levelForm.iconName === iconKey;
                      return (
                        <button
                          key={iconKey}
                          type="button"
                          onClick={() => setLevelForm({ ...levelForm, iconName: iconKey })}
                          className={`flex items-center justify-center gap-1 p-2 rounded-lg border text-xs font-semibold transition ${
                            selected
                              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <IconC size={14} />
                          <span className="text-[10px]">{iconKey}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Theme Color Preset
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          setLevelForm({
                            ...levelForm,
                            color: preset.color,
                            bgColor: preset.bg,
                            accentColor: preset.accent,
                          })
                        }
                        className="flex items-center gap-1 p-1.5 rounded-lg border border-gray-200 hover:border-gray-400 text-[10px] font-bold text-gray-700 bg-white"
                      >
                        <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: preset.color }} />
                        <span className="truncate">{preset.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Criteria / Qualification Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Achieve ₹20L+ monthly disbursement volume"
                    value={levelForm.criteria}
                    onChange={(e) => setLevelForm({ ...levelForm, criteria: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Min Disbursed Volume (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    placeholder="e.g. 2000000"
                    value={levelForm.minDisbursement}
                    onChange={(e) => setLevelForm({ ...levelForm, minDisbursement: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                  <span className="text-[11px] font-bold text-teal-700 mt-1 block">
                    {formatInrWords(levelForm.minDisbursement)} ({formatInr(levelForm.minDisbursement)})
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Milestone Cash Bonus Reward (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="e.g. 2000"
                    value={levelForm.rewardAmount}
                    onChange={(e) => setLevelForm({ ...levelForm, rewardAmount: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-emerald-700 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                  <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                    Reward: {formatInr(levelForm.rewardAmount)} Cash Bonus
                  </span>
                </div>
              </div>

              {/* Perks & Benefits Bullet Points Editor */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Perks & Benefits Bullet Points ({levelForm.benefits.length})
                  </label>
                  <span className="text-[11px] text-gray-400">Displayed with green checkmarks on mobile</span>
                </div>

                <div className="space-y-2">
                  {levelForm.benefits.map((bText, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      <input
                        type="text"
                        value={bText}
                        onChange={(e) => {
                          const updated = [...levelForm.benefits];
                          updated[bIdx] = e.target.value;
                          setLevelForm({ ...levelForm, benefits: updated });
                        }}
                        placeholder="Benefit text..."
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-800 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefitFromForm(bIdx)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Remove perk"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Benefit Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newBenefitInput}
                    onChange={(e) => setNewBenefitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddBenefitToForm();
                      }
                    }}
                    placeholder="Type a new benefit (e.g. Dedicated RM, ₹5,000 Milestone Bonus) and click Add..."
                    className="flex-1 rounded-lg border border-dashed border-gray-300 bg-slate-50 px-3 py-1.5 text-xs text-gray-800 focus:bg-white focus:border-brand-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefitToForm}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                  >
                    <Plus size={13} />
                    <span>Add Perk</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-primary px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition"
                >
                  {editingIndex === -1 ? "Add Tier to Preview" : "Update Tier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
