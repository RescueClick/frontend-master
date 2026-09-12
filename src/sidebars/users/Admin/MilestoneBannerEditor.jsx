import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Zap,
  Palette,
  RotateCcw,
  Smartphone,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  Calendar,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

export const DEFAULT_BANNER_CONFIG = {
  label: "EXTRA CASH BONUS",
  badgeText: "EXTRA CASH BONUS",
  title: "Unlock Milestone Bonuses",
  subtitle:
    "Achieve higher monthly disbursement targets to unlock bigger cash bonuses, VIP badges, and priority perks.",
  bgColor: "#064E3B",
  borderColor: "#047857",
  badgeBgColor: "#A7F3D0",
  badgeTextColor: "#065F46",
  textColor: "#FFFFFF",
  subtextColor: "#D1FAE5",
  monthColor: "#A7F3D0",
  showMonthBadge: true,
  showTag: true,
  showFormulaPills: true,
  formulaPills: [],
  isActive: true,
  targetTab: "ladder",
  monthLabel: "",
};

export const COLOR_THEMES = [
  {
    name: "DhanSource Emerald (App Default)",
    bgColor: "#064E3B",
    borderColor: "#047857",
    badgeBgColor: "#A7F3D0",
    badgeTextColor: "#065F46",
    textColor: "#FFFFFF",
    subtextColor: "#D1FAE5",
    monthColor: "#A7F3D0",
  },
  {
    name: "Deep Teal",
    bgColor: "#0F766E",
    borderColor: "#14B8A6",
    badgeBgColor: "#CCFBF1",
    badgeTextColor: "#0F766E",
    textColor: "#FFFFFF",
    subtextColor: "#E6FFFA",
    monthColor: "#CCFBF1",
  },
  {
    name: "Royal Navy Blue",
    bgColor: "#1E3A8A",
    borderColor: "#3B82F6",
    badgeBgColor: "#DBEAFE",
    badgeTextColor: "#1E40AF",
    textColor: "#FFFFFF",
    subtextColor: "#EFF6FF",
    monthColor: "#DBEAFE",
  },
  {
    name: "Midnight Slate",
    bgColor: "#0F172A",
    borderColor: "#334155",
    badgeBgColor: "#F1F5F9",
    badgeTextColor: "#0F172A",
    textColor: "#FFFFFF",
    subtextColor: "#E2E8F0",
    monthColor: "#94A3B8",
  },
  {
    name: "Imperial Purple",
    bgColor: "#581C87",
    borderColor: "#9333EA",
    badgeBgColor: "#F3E8FF",
    badgeTextColor: "#6B21A8",
    textColor: "#FFFFFF",
    subtextColor: "#FAF5FF",
    monthColor: "#E9D5FF",
  },
  {
    name: "Ruby Crimson",
    bgColor: "#881337",
    borderColor: "#E11D48",
    badgeBgColor: "#FFE4E6",
    badgeTextColor: "#9F1239",
    textColor: "#FFFFFF",
    subtextColor: "#FFF1F2",
    monthColor: "#FECDD3",
  },
];

export default function MilestoneBannerEditor({
  hero: propHero,
  setHero: propSetHero,
  levels = [],
  standalone = false,
  onSaveSuccess,
}) {
  const [internalHero, setInternalHero] = useState(DEFAULT_BANNER_CONFIG);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customPillMode, setCustomPillMode] = useState(false);
  const [newPillVol, setNewPillVol] = useState("");
  const [newPillRew, setNewPillRew] = useState("");

  const hero = propHero !== undefined ? propHero : internalHero;
  const setHero = propSetHero !== undefined ? propSetHero : setInternalHero;

  // Initialize or fetch if standalone
  useEffect(() => {
    if (standalone && !propHero) {
      fetchBannerConfig();
    }
  }, [standalone]);

  useEffect(() => {
    if (hero?.formulaPills && Array.isArray(hero.formulaPills) && hero.formulaPills.length > 0) {
      setCustomPillMode(true);
    }
  }, [hero?.formulaPills]);

  const fetchBannerConfig = async () => {
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
      if (res.data?.hero) {
        setHero({ ...DEFAULT_BANNER_CONFIG, ...res.data.hero });
      }
    } catch (err) {
      console.warn("Could not load banner config:", err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const auth = getAuthData();
      const token =
        auth?.adminToken ||
        auth?.asmToken ||
        localStorage.getItem("super_admin_token") ||
        localStorage.getItem("token");

      const res = await axios.put(
        `${backendurl}/admin/milestone-banner`,
        { hero },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data?.message || "Milestone Bonus Banner updated & synced to mobile app!");
      if (res.data?.hero) {
        setHero(res.data.hero);
      }
      if (onSaveSuccess) onSaveSuccess(res.data?.hero);
    } catch (err) {
      console.error("Failed to save banner config:", err);
      toast.error(err.response?.data?.message || "Failed to save milestone banner config");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        "Reset Milestone Banner Card to standard DhanSource green theme ('Unlock Milestone Bonuses')?"
      )
    ) {
      setHero(DEFAULT_BANNER_CONFIG);
      setCustomPillMode(false);
      toast.success(
        standalone
          ? "Reset to DhanSource standard defaults in editor. Click 'Save Banner Changes' to apply live!"
          : "Reset to DhanSource standard defaults in editor. Click 'Save All Changes' to apply live!"
      );
    }
  };

  const handleApplyTheme = (theme) => {
    setHero((prev) => ({
      ...prev,
      bgColor: theme.bgColor,
      borderColor: theme.borderColor,
      badgeBgColor: theme.badgeBgColor,
      badgeTextColor: theme.badgeTextColor,
      textColor: theme.textColor,
      subtextColor: theme.subtextColor,
      monthColor: theme.monthColor,
    }));
    toast.success(`Applied ${theme.name} palette!`);
  };

  // Compute live formula pills
  const previewPills = useMemo(() => {
    if (customPillMode && Array.isArray(hero?.formulaPills) && hero.formulaPills.length > 0) {
      return hero.formulaPills;
    }
    if (levels && levels.length > 0) {
      return levels.slice(0, 4).map((lvl) => {
        const volLakh = Math.round((lvl.minDisbursement || 0) / 100000);
        const volLabel = volLakh >= 100 ? `₹${(volLakh / 100).toFixed(0)}Cr` : `₹${volLakh}L`;
        const rewLabel = `₹${Number(lvl.rewardAmount || 0).toLocaleString("en-IN")}`;
        return { vol: volLabel, reward: rewLabel };
      });
    }
    return [
      { vol: "₹10L", reward: "₹1,000" },
      { vol: "₹20L", reward: "₹2,000" },
      { vol: "₹30L", reward: "₹3,000" },
      { vol: "₹40L", reward: "₹4,000" },
    ];
  }, [customPillMode, hero?.formulaPills, levels]);

  const addCustomPill = () => {
    if (!newPillVol.trim() || !newPillRew.trim()) {
      toast.error("Please provide both Volume target (e.g. ₹10L) and Reward (e.g. ₹1,000)");
      return;
    }
    const current = Array.isArray(hero?.formulaPills) ? hero.formulaPills : [];
    if (current.length >= 6) {
      toast.error("Maximum 6 milestone highlight pills recommended for mobile layout.");
      return;
    }
    const updated = [...current, { vol: newPillVol.trim(), reward: newPillRew.trim() }];
    setHero({ ...hero, formulaPills: updated });
    setNewPillVol("");
    setNewPillRew("");
  };

  const removeCustomPill = (idx) => {
    const current = Array.isArray(hero?.formulaPills) ? hero.formulaPills : [];
    const updated = current.filter((_, i) => i !== idx);
    setHero({ ...hero, formulaPills: updated });
  };

  // Formatted Current Month & Year
  const currentMonthYear = useMemo(() => {
    const date = new Date();
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
        <Sparkles className="animate-spin mx-auto mb-2 text-teal-600" size={24} />
        Loading Milestone Banner Configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Control Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
            <Zap size={20} className="fill-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">
                Milestone Bonus Highlight Banner Card
              </h2>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  hero.isActive !== false
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}
              >
                {hero.isActive !== false ? "● Visible in Mobile App" : "○ Hidden in App"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Edit the live dynamic bonus promotion card displayed on the Partner mobile home screen &amp; wallet ladder.
            </p>
          </div>
        </div>

        {standalone ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center gap-1.5"
              title="Reset to official DhanSource defaults"
            >
              <RotateCcw size={14} />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Live...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Banner Changes</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 shadow-2xs">
              <Sparkles size={13} className="text-emerald-600" />
              Saved via <span className="font-bold">"Save All Changes"</span> above
            </span>
          </div>
        )}
      </div>

      {/* Main Grid: Form Controls (Left) & Mobile Simulator (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ======================================================== */}
        {/* LEFT COLUMN: EDIT FORM */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Visibility & Core Content */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Layers size={15} className="text-emerald-600" />
                Banner Content &amp; Headlines
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                <input
                  type="checkbox"
                  checked={hero.isActive !== false}
                  onChange={(e) => setHero({ ...hero, isActive: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className={hero.isActive !== false ? "text-emerald-700" : "text-gray-400"}>
                  Card Enabled on App
                </span>
              </label>
            </div>

            {/* Main Title / Headline */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Main Headline Title
              </label>
              <input
                type="text"
                value={hero.title || ""}
                onChange={(e) => setHero({ ...hero, title: e.target.value })}
                placeholder="e.g. Unlock Milestone Bonuses"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Prominently displayed at the top of the card in bold font.
              </p>
            </div>

            {/* Subtitle Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Subtitle Description
              </label>
              <textarea
                rows={2}
                value={hero.subtitle || ""}
                onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                placeholder="Achieve higher monthly disbursement targets to unlock bigger cash bonuses, VIP badges, and priority perks."
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            {/* Tap Action / Destination */}
            <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-gray-700 block">Tap Destination</span>
                <span className="text-[11px] text-gray-400">Where partner goes when tapping card</span>
              </div>
              <select
                value={hero.targetTab || "ladder"}
                onChange={(e) => setHero({ ...hero, targetTab: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ladder">Tier Ladder (All 8 Slabs &amp; Perks)</option>
                <option value="incentive">Milestone Achievement Ledger</option>
              </select>
            </div>
          </div>

          {/* Section 2: Badge Tag & Date Header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <Zap size={15} className="text-emerald-600" />
              Tag Pill &amp; Month Badge Header
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Badge Tag Settings */}
              <div className="space-y-3 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Tag Pill Label
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-gray-500">
                    <input
                      type="checkbox"
                      checked={hero.showTag !== false}
                      onChange={(e) => setHero({ ...hero, showTag: e.target.checked })}
                      className="rounded text-emerald-600 h-3.5 w-3.5"
                    />
                    <span>Show</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={hero.badgeText || hero.label || ""}
                  onChange={(e) =>
                    setHero({
                      ...hero,
                      badgeText: e.target.value,
                      label: e.target.value,
                    })
                  }
                  placeholder="e.g. EXTRA CASH BONUS"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-900 uppercase"
                />
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">
                      Pill Bg
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={hero.badgeBgColor || "#A7F3D0"}
                        onChange={(e) => setHero({ ...hero, badgeBgColor: e.target.value })}
                        className="h-7 w-8 rounded border border-gray-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={hero.badgeBgColor || "#A7F3D0"}
                        onChange={(e) => setHero({ ...hero, badgeBgColor: e.target.value })}
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-[11px] font-mono uppercase"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">
                      Pill Text
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={hero.badgeTextColor || "#065F46"}
                        onChange={(e) => setHero({ ...hero, badgeTextColor: e.target.value })}
                        className="h-7 w-8 rounded border border-gray-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={hero.badgeTextColor || "#065F46"}
                        onChange={(e) => setHero({ ...hero, badgeTextColor: e.target.value })}
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-[11px] font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Month & Date Header */}
              <div className="space-y-3 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Month &amp; Date Badge
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-gray-500">
                    <input
                      type="checkbox"
                      checked={hero.showMonthBadge !== false}
                      onChange={(e) => setHero({ ...hero, showMonthBadge: e.target.checked })}
                      className="rounded text-emerald-600 h-3.5 w-3.5"
                    />
                    <span>Show</span>
                  </label>
                </div>
                <div>
                  <input
                    type="text"
                    value={hero.monthLabel || ""}
                    onChange={(e) => setHero({ ...hero, monthLabel: e.target.value })}
                    placeholder={`e.g. ${currentMonthYear} (Leave blank for auto)`}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-800"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Default: Dynamically shows current month ({currentMonthYear})
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">
                    Month Font Color
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={hero.monthColor || "#A7F3D0"}
                      onChange={(e) => setHero({ ...hero, monthColor: e.target.value })}
                      className="h-7 w-8 rounded border border-gray-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={hero.monthColor || "#A7F3D0"}
                      onChange={(e) => setHero({ ...hero, monthColor: e.target.value })}
                      className="w-20 rounded border border-gray-300 px-2 py-1 text-[11px] font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Colors & Theme Presets */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <Palette size={15} className="text-emerald-600" />
              Theme Colors &amp; Styling
            </span>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase block mb-2">
                Quick Theme Presets:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLOR_THEMES.map((theme) => {
                  const isSelected = hero.bgColor?.toUpperCase() === theme.bgColor.toUpperCase();
                  return (
                    <button
                      key={theme.name}
                      type="button"
                      onClick={() => handleApplyTheme(theme)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/50 shadow-2xs ring-1 ring-emerald-500"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                        style={{ backgroundColor: theme.bgColor }}
                      />
                      <span className="text-[11px] font-bold text-gray-800 line-clamp-1">
                        {theme.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Hex Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Card Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hero.bgColor || "#064E3B"}
                    onChange={(e) => setHero({ ...hero, bgColor: e.target.value })}
                    className="h-8 w-10 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={hero.bgColor || "#064E3B"}
                    onChange={(e) => setHero({ ...hero, bgColor: e.target.value })}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-mono uppercase text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Card Border Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hero.borderColor || "#047857"}
                    onChange={(e) => setHero({ ...hero, borderColor: e.target.value })}
                    className="h-8 w-10 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={hero.borderColor || "#047857"}
                    onChange={(e) => setHero({ ...hero, borderColor: e.target.value })}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-mono uppercase text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Milestone Formula Highlights (Pills) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={15} className="text-emerald-600" />
                Milestone Formula Highlights
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                <input
                  type="checkbox"
                  checked={hero.showFormulaPills !== false}
                  onChange={(e) => setHero({ ...hero, showFormulaPills: e.target.checked })}
                  className="rounded text-emerald-600 h-4 w-4"
                />
                <span className={hero.showFormulaPills !== false ? "text-emerald-700" : "text-gray-400"}>
                  Show Formula Row
                </span>
              </label>
            </div>

            {/* Pill Source Mode Switcher */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setCustomPillMode(false);
                  setHero({ ...hero, formulaPills: [] });
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  !customPillMode
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Auto-generate from Top 4 Tiers (₹10L, ₹20L, etc.)
              </button>
              <button
                type="button"
                onClick={() => setCustomPillMode(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  customPillMode
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Custom Formula Slabs
              </button>
            </div>

            {/* If Custom Pills Mode */}
            {customPillMode ? (
              <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                <span className="text-xs font-bold text-gray-700 block">
                  Configured Custom Milestone Pills:
                </span>
                <div className="flex flex-wrap gap-2">
                  {hero.formulaPills && hero.formulaPills.length > 0 ? (
                    hero.formulaPills.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 bg-emerald-950 text-white px-3 py-1.5 rounded-lg text-xs border border-emerald-800 shadow-xs"
                      >
                        <span className="font-bold text-emerald-200">{p.vol}</span>
                        <span className="text-emerald-400">➔</span>
                        <span className="font-extrabold text-white">{p.reward}</span>
                        <button
                          type="button"
                          onClick={() => removeCustomPill(idx)}
                          className="ml-1 text-gray-400 hover:text-red-400 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      No custom pills added yet. Add items below or switch to Auto mode.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newPillVol}
                    onChange={(e) => setNewPillVol(e.target.value)}
                    placeholder="Volume (e.g. ₹10L)"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-900"
                  />
                  <input
                    type="text"
                    value={newPillRew}
                    onChange={(e) => setNewPillRew(e.target.value)}
                    placeholder="Bonus (e.g. ₹1,000)"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={addCustomPill}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-2">
                <Info size={15} className="text-emerald-600 shrink-0" />
                Formula pills are automatically kept in 100% sync with the top 4 configured partner tiers in the table below.
              </p>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: LIVE MOBILE PHONE SIMULATOR */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-6 w-full max-w-[380px]">
            {/* Phone Shell */}
            <div className="bg-slate-950 rounded-[44px] p-3.5 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-900">
              {/* Phone Speaker Notch */}
              <div className="flex justify-center mb-2">
                <div className="w-20 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                  <div className="w-10 h-1 bg-slate-700 rounded-full" />
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between px-4 py-1 text-[11px] font-bold text-slate-400">
                <span>9:41</span>
                <span className="text-[10px] text-teal-400 uppercase tracking-widest font-black">
                  App Simulator
                </span>
                <div className="flex items-center gap-1 text-[10px]">
                  <span>5G</span>
                  <div className="w-4 h-2 border border-slate-400 rounded-2xs p-0.5 flex items-center">
                    <div className="w-full h-full bg-slate-300 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* Mobile App Screen Content */}
              <div className="bg-slate-900 rounded-[32px] p-4 text-white min-h-[460px] flex flex-col justify-between border border-slate-800/80 mt-1">
                <div>
                  {/* Partner App Top Header Bar */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold text-[11px]">
                        DS
                      </div>
                      <span className="text-xs font-bold text-slate-200">DhanSource Partner</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      Home Tab
                    </span>
                  </div>

                  {/* PIXEL-PERFECT REPLICA OF THE BANNER CARD */}
                  <div
                    className="rounded-2xl p-4 relative overflow-hidden transition-all shadow-lg select-none"
                    style={{
                      backgroundColor: hero.bgColor || "#064E3B",
                      border: `1px solid ${hero.borderColor || "#047857"}`,
                    }}
                  >
                    {/* Top Tag & Month Row */}
                    <div className="flex items-center justify-between mb-2.5">
                      {hero.showTag !== false && (
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md shadow-2xs"
                          style={{
                            backgroundColor: hero.badgeBgColor || "#A7F3D0",
                          }}
                        >
                          <Zap
                            size={10}
                            style={{
                              color: hero.badgeTextColor || "#065F46",
                              fill: hero.badgeTextColor || "#065F46",
                            }}
                          />
                          <span
                            className="text-[9.5px] font-black uppercase tracking-wider"
                            style={{
                              color: hero.badgeTextColor || "#065F46",
                            }}
                          >
                            {hero.badgeText || hero.label || "EXTRA CASH BONUS"}
                          </span>
                        </div>
                      )}

                      {hero.showMonthBadge !== false && (
                        <span
                          className="text-[11.5px] font-bold"
                          style={{
                            color: hero.monthColor || "#A7F3D0",
                          }}
                        >
                          {hero.monthLabel || currentMonthYear}
                        </span>
                      )}
                    </div>

                    {/* Main Headline Title */}
                    <h3
                      className="text-[17px] font-black leading-snug mb-1"
                      style={{
                        color: hero.textColor || "#FFFFFF",
                      }}
                    >
                      {hero.title || "Unlock Milestone Bonuses"}
                    </h3>

                    {/* Subtitle Description */}
                    <p
                      className="text-[11.5px] leading-relaxed mb-3 font-normal"
                      style={{
                        color: hero.subtextColor || "#D1FAE5",
                      }}
                    >
                      {hero.subtitle ||
                        "Achieve higher monthly disbursement targets to unlock bigger cash bonuses, VIP badges, and priority perks."}
                    </p>

                    {/* Formula Pills Row (2x2 Grid) */}
                    {hero.showFormulaPills !== false && (
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        {previewPills.map((pill, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-extrabold shadow-2xs"
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.12)",
                              borderColor: "rgba(255, 255, 255, 0.18)",
                            }}
                          >
                            <span className="text-white">{pill.vol}</span>
                            <span className="text-emerald-400 font-bold">➔</span>
                            <span className="text-white">{pill.reward}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hidden Badge Overlay */}
                    {hero.isActive === false && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xs flex flex-col items-center justify-center p-4 text-center">
                        <EyeOff size={24} className="text-amber-400 mb-1" />
                        <span className="text-xs font-bold text-amber-300 uppercase">
                          Card Hidden in App
                        </span>
                        <span className="text-[10px] text-slate-300 mt-0.5">
                          Turn on 'Card Enabled on App' to display live
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Simulated App Next Element */}
                  <div className="mt-4 p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold">Live Partner Achievement</span>
                      <span className="text-amber-400 font-bold">Bronze Tier</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Home Indicator */}
                <div className="flex justify-center pt-3">
                  <div className="w-28 h-1 bg-slate-700 rounded-full" />
                </div>
              </div>
            </div>

            <p className="text-center text-[11px] text-gray-500 font-medium mt-2">
              Preview matches mobile app pixel-by-pixel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}