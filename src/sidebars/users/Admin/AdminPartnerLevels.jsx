import React, { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

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
  { name: "Platinum / Dark", color: "#0F172A", bg: "#F8FAFC", accent: "#E2E8F0" },
  { name: "Emerald / Teal", color: "#0D9488", bg: "#F0FDF4", accent: "#CCFBF1" },
  { name: "Purple / Royal", color: "#7C3AED", bg: "#FAF5FF", accent: "#F3E8FF" },
  { name: "Rose / Ruby", color: "#E11D48", bg: "#FFF1F2", accent: "#FFE4E6" },
  { name: "Blue / Sapphire", color: "#2563EB", bg: "#EFF6FF", accent: "#DBEAFE" },
];

const DEFAULT_CONFIG = {
  hero: {
    label: "PERFORMANCE & MILESTONE REWARDS",
    title: "Unlock Milestone Bonuses",
    subtitle: "Achieve higher monthly disbursement targets to unlock bigger cash bonuses, VIP badges, and priority perks.",
    bgColor: "#0D9488",
  },
  levels: [
    {
      id: "BRONZE",
      name: "Bronze",
      iconName: "Shield",
      color: "#B45309",
      bgColor: "#FFFBEB",
      accentColor: "#FEF3C7",
      criteria: "Default level for all new partners (Up to ₹10L volume)",
      minDisbursement: 0,
      rewardAmount: 0,
      benefits: [
        "Standard commission payouts on every loan",
        "Basic partner support channels",
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
      rewardAmount: 2500,
      benefits: [
        "Earn ₹2,500+ monthly milestone cash bonus",
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
      criteria: "Achieve ₹50L+ monthly disbursement volume",
      minDisbursement: 5000000,
      rewardAmount: 7500,
      benefits: [
        "Earn ₹7,500+ monthly milestone cash bonus",
        "Dedicated Relationship Manager (RM)",
        "Priority payout settlement & fast-track clearance",
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
      rewardAmount: 20000,
      benefits: [
        "Earn ₹20,000+ monthly milestone cash bonus",
        "24/7 VIP desk support & relationship priority",
        "Eligible for 'Partner of the Month' cash rewards",
        "Executive certificates & festival bonus perks",
      ],
    },
  ],
};

const formatInr = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`;

export default function AdminPartnerLevels() {
  const [hero, setHero] = useState(DEFAULT_CONFIG.hero);
  const [levels, setLevels] = useState(DEFAULT_CONFIG.levels);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
    minDisbursement: 0,
    rewardAmount: 0,
    benefits: [""],
  });

  const [newBenefitInput, setNewBenefitInput] = useState("");

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const { adminToken } = getAuthData();
      const res = await axios.get(`${backendurl}/admin/partner-levels`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.data?.levels && Array.isArray(res.data.levels)) {
        setLevels(res.data.levels);
      }
      if (res.data?.hero) {
        setHero(res.data.hero);
      }
    } catch (err) {
      console.error("Failed to load partner levels config:", err);
      toast.error("Using default partner levels template");
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
      const { adminToken } = getAuthData();
      const res = await axios.put(
        `${backendurl}/admin/partner-levels`,
        { hero, levels },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success(res.data?.message || "Levels & Perks saved and live across all apps!");
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
    if (window.confirm("Reset all tiers and hero banner to DhanSource default values?")) {
      setHero(DEFAULT_CONFIG.hero);
      setLevels(DEFAULT_CONFIG.levels);
      toast.success("Reset to defaults in preview. Click 'Save All Changes' to apply.");
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
      criteria: "",
      minDisbursement: 2500000,
      rewardAmount: 5000,
      benefits: ["Standard commission payouts", "Priority file processing"],
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
      minDisbursement: Number(levelForm.minDisbursement || 0),
      rewardAmount: Number(levelForm.rewardAmount || 0),
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Layers size={15} />
            <span>Partner Gamification & Tier Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Partner Levels, Badges & Perks (CRUD)
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure every single text, badge, criteria, and milestone cash bonus reward displayed on the mobile app.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
          >
            <RotateCcw size={14} className="text-gray-500" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
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

      {/* Hero Banner Editor & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <Palette size={16} />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Hero Banner Text & Theme</h2>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">Mobile Hero Card</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Top Label Badge
              </label>
              <input
                type="text"
                value={hero.label}
                onChange={(e) => setHero({ ...hero, label: e.target.value })}
                placeholder="e.g. PERFORMANCE & MILESTONE REWARDS"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Main Headline Title
              </label>
              <input
                type="text"
                value={hero.title}
                onChange={(e) => setHero({ ...hero, title: e.target.value })}
                placeholder="e.g. Unlock Milestone Bonuses"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Subtitle Description
              </label>
              <textarea
                rows={2}
                value={hero.subtitle}
                onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                placeholder="Brief explanation of how climbing levels benefits the partner..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-800 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Banner Background Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={hero.bgColor || "#0D9488"}
                  onChange={(e) => setHero({ ...hero, bgColor: e.target.value })}
                  className="h-9 w-12 rounded-md border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={hero.bgColor || "#0D9488"}
                  onChange={(e) => setHero({ ...hero, bgColor: e.target.value })}
                  className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-mono text-gray-900 uppercase"
                />
                <div className="flex items-center gap-1.5">
                  {["#0D9488", "#1E3A8A", "#0F172A", "#7C3AED", "#B45309"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setHero({ ...hero, bgColor: c })}
                      className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition shadow-2xs"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Mobile Hero Card Preview */}
        <div className="lg:col-span-6 bg-slate-900 rounded-2xl p-5 sm:p-6 text-white flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5 font-bold">
                <Smartphone size={14} className="text-teal-400" />
                Live Mobile Hero Preview
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Partner App</span>
            </div>

            {/* Rendered Hero Card exactly like React Native */}
            <div
              className="rounded-2xl p-6 relative overflow-hidden text-white shadow-xl transition-all"
              style={{ backgroundColor: hero.bgColor || "#0D9488" }}
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

              <span className="text-[10px] font-black uppercase tracking-widest text-white/70 block mb-1">
                {hero.label || "PERFORMANCE & MILESTONE REWARDS"}
              </span>
              <h3 className="text-2xl font-black text-white mb-2 leading-tight">
                {hero.title || "Unlock Milestone Bonuses"}
              </h3>
              <p className="text-xs text-white/90 leading-relaxed max-w-md">
                {hero.subtitle || "Perform better each month to climb the tiers and maximize your payouts."}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
            <span className="flex items-center gap-1.5">
              <Info size={13} className="text-amber-400" />
              Synced in real-time with the DhanSource Partner mobile app
            </span>
            <span className="font-bold text-slate-200">{levels.length} Active Tiers</span>
          </div>
        </div>
      </div>

      {/* Tier / Level Cards Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Configured Partner Tiers ({levels.length})</h2>
            <p className="text-xs text-gray-500">
              Each tier card controls the badge, criteria, bonus cash rewards, and bullet point perks on mobile.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">Click "Edit" on any tier to modify any single text or perk</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {levels.map((lvl, idx) => {
            const IconComponent = ICON_MAP[lvl.iconName] || Shield;
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
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: lvl.accentColor || "#E2E8F0" }}
                      >
                        <IconComponent size={20} style={{ color: lvl.color || "#0D9488" }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-base text-gray-900">{lvl.name}</h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-gray-200 text-gray-600 font-bold">
                            {lvl.id}
                          </span>
                        </div>
                        <span
                          className="text-xs font-black block mt-0.5"
                          style={{ color: lvl.color || "#0D9488" }}
                        >
                          {lvl.rewardAmount > 0 ? `+${formatInr(lvl.rewardAmount)} Bonus` : "Standard Tier"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => openEditModal(idx)}
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-gray-700 hover:text-brand-primary border border-gray-200 shadow-2xs transition"
                        title="Edit tier details"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLevel(idx)}
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
                    <p className="text-xs font-semibold text-gray-800 leading-snug">{lvl.criteria || "—"}</p>
                    {lvl.minDisbursement > 0 && (
                      <span className="text-[11px] font-mono text-emerald-700 font-bold block mt-1">
                        Min Volume: {formatInr(lvl.minDisbursement)}
                      </span>
                    )}
                  </div>

                  {/* Benefits Bullet Points */}
                  <div className="p-4 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                      Perks & Benefits ({lvl.benefits?.length || 0})
                    </span>
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
                    onClick={() => openEditModal(idx)}
                    className="font-bold text-brand-primary hover:underline"
                  >
                    Edit All Fields →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit / Add Level Modal (CRUD) */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold">
                  {editingIndex === -1 ? "Add New Partner Tier Level" : `Edit Tier: ${levelForm.name || levelForm.id}`}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure tier ID, badge icons, colors, criteria, milestone cash reward, and perks.
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
                    onChange={(e) => setLevelForm({ ...levelForm, id: e.target.value.toUpperCase() })}
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
                  <div className="grid grid-cols-4 gap-2">
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
                        className="flex items-center gap-1.5 p-1.5 rounded-lg border border-gray-200 hover:border-gray-400 text-[10px] font-bold text-gray-700 bg-white"
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
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Milestone Cash Bonus Reward (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="e.g. 2500"
                    value={levelForm.rewardAmount}
                    onChange={(e) => setLevelForm({ ...levelForm, rewardAmount: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-emerald-700 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
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
