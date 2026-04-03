import React, { useEffect, useState, useCallback, useMemo } from "react";

import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Download,
  Settings,
  Lock,
  LogOut,
  Save,
  X,
  Link2 as LinkIcon,
  GitBranch,
  Share2,
  Copy,
  MessageCircle,
  Gift,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchPartnerProfile } from "../feature/thunks/partnerThunks";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthData, getAuthData } from "../utils/localStorage";
import { useRealtimeData } from "../utils/useRealtimeData";
import { backendurl } from "../feature/urldata";
import {
  COMPANY_NAME,
  SUPPORT_EMAIL,
  PARTNER_APP_PLAY_STORE_URL,
  PUBLIC_WEB_ORIGIN,
  appendPartnerShareUtm,
  whatsAppShareUrl,
  canonicalPartnerReferralCode,
  legacyReferralAlternate,
} from "../config/branding";
import { PARTNER_REGISTRATION_ROUTE } from "../config/publicReferral.js";

import axios from "axios"

/** One share text: web registration URL + app install / referral link + PT code. */
function buildCombinedPartnerReferralMessage({
  webRegistrationUrl,
  appInviteUrl,
  playStoreUrl,
  code,
  legacyAlt,
}) {
  const c = (code || "").trim() || "—";
  const web = (webRegistrationUrl || "").trim();
  const store = (playStoreUrl || "").trim();
  const invite = (appInviteUrl || "").trim();
  const lines = [
    `Join ${COMPANY_NAME} as a channel partner!`,
    ``,
    `🌐 Register on the web:`,
    web || "—",
  ];
  lines.push(``);
  if (invite) {
    lines.push(`📱 Partner app — install & signup (referral rewards):`, invite);
    if (store && !invite.includes("play.google.com")) {
      lines.push(``, `Or install from Google Play:`, store);
    }
  } else {
    lines.push(`📱 Install the Partner app from Google Play:`, store || "—");
  }
  lines.push(``, `Your PT referral code (enter if a form asks): ${c}`);
  const alt = (legacyAlt || "").trim();
  if (alt && alt.toUpperCase() !== c.toUpperCase()) {
    lines.push(``, `If a form still expects an older code, try: ${alt}`);
  }
  lines.push(``, `Questions? ${SUPPORT_EMAIL}`);
  return lines.join("\n");
}

async function shareOrCopyText({ title, text, onOk, onErr }) {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, text });
      onOk("shared");
      return;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      onOk("copied");
      return;
    }
    window.prompt("Copy this message:", text);
    onOk("copied");
  } catch (err) {
    if (err?.name === "AbortError") return;
    try {
      await navigator.clipboard.writeText(text);
      onOk("copied");
    } catch {
      onErr();
    }
  }
}

const PartnerProfile = ({ inModal = false }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("password");
  const [profileImage, setProfileImage] = useState(null);
  const [inviteShareHint, setInviteShareHint] = useState("");
  const { data } = useSelector((state) => state.partner.profile);

  const referralCodeCanonical = useMemo(
    () => canonicalPartnerReferralCode(data?.partnerCode, data?.referralCode),
    [data?.partnerCode, data?.referralCode]
  );

  const referralLegacyAlt = useMemo(
    () => legacyReferralAlternate(data?.partnerCode, data?.referralCode),
    [data?.partnerCode, data?.referralCode]
  );

  /**
   * Always build `?ref=` and invite `?code=` from the same canonical value (partnerCode first).
   * Do not use API `referralLink` / `appInviteLink` as-is — legacy rows can embed different codes per field.
   */
  const webRegistrationUrl = useMemo(() => {
    if (!referralCodeCanonical) {
      return appendPartnerShareUtm(`${PUBLIC_WEB_ORIGIN}${PARTNER_REGISTRATION_ROUTE}`, "web");
    }
    return appendPartnerShareUtm(
      `${PUBLIC_WEB_ORIGIN}${PARTNER_REGISTRATION_ROUTE}?ref=${encodeURIComponent(referralCodeCanonical)}`,
      "web"
    );
  }, [referralCodeCanonical]);

  const playStoreUrlResolved = useMemo(
    () => String(data?.playStoreUrl || PARTNER_APP_PLAY_STORE_URL).trim(),
    [data?.playStoreUrl]
  );

  const appInviteUrlResolved = useMemo(() => {
    if (!referralCodeCanonical) return "";
    return appendPartnerShareUtm(
      `${PUBLIC_WEB_ORIGIN}/invite?code=${encodeURIComponent(referralCodeCanonical)}`,
      "invite"
    );
  }, [referralCodeCanonical]);

  const combinedReferralMessage = useMemo(
    () =>
      buildCombinedPartnerReferralMessage({
        webRegistrationUrl,
        appInviteUrl: appInviteUrlResolved,
        playStoreUrl: playStoreUrlResolved,
        code: referralCodeCanonical,
        legacyAlt: referralLegacyAlt,
      }),
    [
      webRegistrationUrl,
      appInviteUrlResolved,
      playStoreUrlResolved,
      referralCodeCanonical,
      referralLegacyAlt,
    ]
  );

  const shareCombinedReferral = useCallback(async () => {
    setInviteShareHint("");
    await shareOrCopyText({
      title: `${COMPANY_NAME} — Partner referral invite`,
      text: combinedReferralMessage,
      onOk: (mode) =>
        setInviteShareHint(
          mode === "shared"
            ? "Invite shared."
            : "Invite copied — paste in WhatsApp, SMS, or email."
        ),
      onErr: () => setInviteShareHint("Could not share — try Copy message."),
    });
  }, [combinedReferralMessage]);

  const copyCombinedReferral = useCallback(async () => {
    setInviteShareHint("");
    try {
      await navigator.clipboard.writeText(combinedReferralMessage);
      setInviteShareHint("Invite message copied.");
    } catch {
      setInviteShareHint("Copy failed.");
    }
  }, [combinedReferralMessage]);

  const whatsAppCombinedUrl = useMemo(
    () => whatsAppShareUrl(combinedReferralMessage),
    [combinedReferralMessage]
  );

  const copyReferralCode = useCallback(async () => {
    setInviteShareHint("");
    if (!referralCodeCanonical) {
      setInviteShareHint("No code available.");
      return;
    }
    try {
      await navigator.clipboard.writeText(referralCodeCanonical);
      setInviteShareHint("Referral code copied.");
    } catch {
      setInviteShareHint("Could not copy code.");
    }
  }, [referralCodeCanonical]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Real-time profile updates with 60 second polling
  useRealtimeData(fetchPartnerProfile, {
    interval: 60000, // 60 seconds for profile (less frequent)
    enabled: true,
  });



  const [settingsForm, setSettingsForm] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });

  const handleDownload =  (document) => {
    console.log(`Downloading ${document}...`);
    alert(`${document} download initiated!`);
  };

  const handleSettingsSubmit = useCallback(async (type) => {
    try {
      const { partnerToken } = getAuthData();
      
      await axios.post(
        `${backendurl}/auth/change-password`,
        {
          oldPassword: settingsForm.currentPassword,
          newPassword: settingsForm.password,
          confirmPassword: settingsForm.confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${partnerToken}`,
          },
        }
      );

      alert(`${type} updated successfully!`);
      
      // Reset form
      setSettingsForm({
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
      
      // Optionally close modal
      setIsSettingsOpen(false);
    } catch (err) {
      console.error("API error:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to update password");
    }
  }, [settingsForm, setIsSettingsOpen]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };


    // Logout function for admin
    const handleLogout = () => {

      clearAuthData();
  
      navigate('/');
    };



  return (
    <div className={inModal ? "bg-transparent" : "min-h-screen bg-slate-50"}>
      <div className="w-full">
        {/* Profile Content (always visible) */}

        <div className="bg-white rounded-xl shadow-2xl border border-gray-200">
          {/* Profile Image + Name Section */}

          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between ">
              <h3 className="text-lg font-semibold text-gray-800">
                Profile Picture
              </h3>

              <div className="flex items-center flex-wrap gap-2 justify-end">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              {/* Profile Image */}

              <div className="relative flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-teal-500 flex items-center justify-center overflow-hidden">
                  {data?.profilePic ? (
                    <img
                      src={data?.profilePic}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>

              
              </div>

              {/* First, Middle & Last Name fields beside profile */}

              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h1 className="block text-sm font-medium text-gray-700 mb-1">
                    {data?.firstName} {data?.middleName} {data?.lastName}
                  </h1>
                  <p className="mt-3 text-sm font-medium text-gray-700">
                  Partner ID: {data?.employeeId}
                </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}

          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Contact Information
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <Phone className="w-4 h-4 text-teal-500" />
                </div>

                <div>
                  <p className="text-gray-600 text-xs">Mobile</p>

                  <p className="text-gray-800 font-medium text-sm">
                    {data?.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <Mail className="w-4 h-4 text-teal-500" />
                </div>

                <div>
                  <p className="text-gray-600 text-xs">Email</p>

                  <p className="text-gray-800 font-medium text-sm">
                    {data?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-teal-500" />
                </div>

                <div>
                  <p className="text-gray-600 text-xs">Date of Birth</p>

                  <p className="text-gray-800 font-medium text-sm">
                    {new Date(data?.dob).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-teal-500" />
                </div>

                <div>
                  <p className="text-gray-600 text-xs">Partnership Date</p>

                  <p className="text-gray-800 font-medium text-sm">
                    {new Date(data?.partnershipDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="mt-5 flex items-start space-x-3">
              <div className="bg-teal-100 p-2 rounded-lg shrink-0">
                <MapPin className="w-4 h-4 text-teal-500" />
              </div>
              <div className="min-w-0">
                <p className="text-gray-600 text-xs">Address</p>
                <p className="text-gray-800 font-medium text-sm">{data?.address}</p>
              </div>
            </div>

            {/* Referral program — one PT code; partnerCode & referralCode in API are the same value when synced */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h4 className="text-base font-semibold text-gray-900 tracking-tight">Referrals &amp; invites</h4>
              <p className="text-xs text-gray-500 mt-1.5 mb-4 max-w-2xl leading-relaxed">
                You have <span className="font-medium text-gray-700">one referral code</span> (always{" "}
                <span className="font-medium text-gray-700">PT-…</span>). Use{" "}
                <span className="font-medium text-gray-700">Share invite</span> to send both your web registration link
                and Partner app install link in a single message.
              </p>

              <div className="mb-5 rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/90 to-white px-4 py-4 shadow-sm ring-1 ring-teal-100/60">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800/90">Your PT referral code</p>
                <p className="text-[11px] text-gray-500 mt-0.5 mb-3">
                  Web <span className="font-medium">?ref=</span> and app invite use this same PT code.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-mono text-lg font-bold tracking-wide text-gray-900 break-all">
                    {referralCodeCanonical || "—"}
                  </span>
                  <button
                    type="button"
                    onClick={copyReferralCode}
                    disabled={!referralCodeCanonical}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                    Copy referral code
                  </button>
                </div>
                {referralLegacyAlt ? (
                  <p className="mt-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
                    An older value is still stored:{" "}
                    <span className="font-mono font-medium">{referralLegacyAlt}</span>. Always share the PT code above.
                    Ask support to run the partner code sync if this message stays.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate("/partner/referral-rewards")}
                  className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-left text-sm font-medium text-slate-800 transition hover:border-teal-300 hover:bg-teal-50/50"
                >
                  <span className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-teal-600 shrink-0" />
                    View referral rewards &amp; history
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/40 p-4">
                <div className="flex items-start gap-2 mb-1">
                  <LinkIcon className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Share invite</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      One message with your web registration link, Partner app link, and referral code. Use Share, Copy,
                      or WhatsApp.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={shareCombinedReferral}
                    className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    <Share2 className="h-4 w-4" />
                    Share invite
                  </button>
                  <button
                    type="button"
                    onClick={copyCombinedReferral}
                    className="inline-flex items-center gap-1.5 rounded-full border border-teal-600 bg-white px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50"
                  >
                    <Copy className="h-4 w-4" />
                    Copy message
                  </button>
                  <a
                    href={whatsAppCombinedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/50 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </div>
                {inviteShareHint ? (
                  <p className="text-xs text-teal-800 mt-3" role="status">
                    {inviteShareHint}
                  </p>
                ) : null}
              </div>
            </div>

            {/* RM Details */}

            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-700 mb-3">
                Relationship Manager Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-teal-500" />

                    <span className="text-gray-500 text-sm">Name:</span>

                    <span className="text-gray-800 font-semibold text-sm">
                      {data?.rmName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-teal-500" />

                    <span className="text-gray-500 text-sm">Contact:</span>

                    <span className="text-gray-800 font-semibold text-sm">
                      {data?.rmPhone}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-4 h-4 text-teal-500" />

                    <span className="text-gray-500 text-sm">Id:</span>

                    <span className="text-gray-800 font-semibold text-sm">
                      {data?.rmEmployeeId}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-teal-500" />

                    <span className="text-gray-500 text-sm">Mail:</span>

                    <span className="text-gray-800 font-semibold text-sm">
                      {data?.rmEmail}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reporting hierarchy: ASM → RSM → RM → Partner (top = senior) */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-5 h-5 text-slate-600" />
                <h4 className="text-md font-semibold text-gray-800">
                  Reporting hierarchy
                </h4>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Order from top to bottom: ASM (Area Sales Manager) oversees RSM,
                RSM oversees RM, RM oversees you. IDs are employee codes where
                shown.
              </p>
              <ol className="space-y-4 text-sm">
                {data?.asmName || data?.asmEmployeeId ? (
                  <li className="border-l-2 border-teal-400 pl-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      ASM (top)
                    </p>
                    <p className="font-medium text-gray-900">{data.asmName || "—"}</p>
                    <p className="text-gray-600">
                      ASM ID:{" "}
                      <span className="font-mono text-xs">{data.asmEmployeeId || "—"}</span>
                    </p>
                    {(data.asmEmail || data.asmPhone) && (
                      <p className="text-gray-600 text-xs mt-1">
                        {[data.asmEmail, data.asmPhone].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </li>
                ) : null}

                {(() => {
                  const pId = data?.personalRsmId;
                  const bId = data?.businessHomeRsmId;
                  const sameRsm =
                    pId &&
                    bId &&
                    String(pId) === String(bId);
                  if (sameRsm && (data?.personalRsmName || data?.businessHomeRsmName)) {
                    return (
                      <li className="border-l-2 border-teal-400 pl-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          RSM (Regional Sales Manager)
                        </p>
                        <p className="font-medium text-gray-900">
                          {data.personalRsmName || data.businessHomeRsmName}
                        </p>
                        <p className="text-gray-600">
                          RSM ID:{" "}
                          <span className="font-mono text-xs">
                            {data.personalRsmEmployeeId || "—"}
                          </span>
                        </p>
                        {(data.personalRsmEmail || data.personalRsmPhone) && (
                          <p className="text-gray-600 text-xs mt-1">
                            {[data.personalRsmEmail, data.personalRsmPhone]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                        {data.personalRsmAsmName && (
                          <p className="text-xs text-gray-500 mt-2">
                            Reports to ASM: {data.personalRsmAsmName}{" "}
                            <span className="font-mono">
                              ({data.personalRsmAsmEmployeeId || "—"})
                            </span>
                          </p>
                        )}
                      </li>
                    );
                  }
                  return (
                    <>
                      {data?.personalRsmName || data?.personalRsmEmployeeId ? (
                        <li className="border-l-2 border-teal-400 pl-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            RSM — Personal loans
                          </p>
                          <p className="font-medium text-gray-900">
                            {data.personalRsmName || "—"}
                          </p>
                          <p className="text-gray-600">
                            RSM ID:{" "}
                            <span className="font-mono text-xs">
                              {data.personalRsmEmployeeId || "—"}
                            </span>
                          </p>
                          {(data.personalRsmEmail || data.personalRsmPhone) && (
                            <p className="text-gray-600 text-xs mt-1">
                              {[data.personalRsmEmail, data.personalRsmPhone]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                          {data.personalRsmAsmName && (
                            <p className="text-xs text-gray-500 mt-2">
                              ASM: {data.personalRsmAsmName}{" "}
                              <span className="font-mono">
                                ({data.personalRsmAsmEmployeeId || "—"})
                              </span>
                            </p>
                          )}
                        </li>
                      ) : null}
                      {data?.businessHomeRsmName || data?.businessHomeRsmEmployeeId ? (
                        <li className="border-l-2 border-teal-400 pl-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            RSM — Business &amp; home loans
                          </p>
                          <p className="font-medium text-gray-900">
                            {data.businessHomeRsmName || "—"}
                          </p>
                          <p className="text-gray-600">
                            RSM ID:{" "}
                            <span className="font-mono text-xs">
                              {data.businessHomeRsmEmployeeId || "—"}
                            </span>
                          </p>
                          {(data.businessHomeRsmEmail || data.businessHomeRsmPhone) && (
                            <p className="text-gray-600 text-xs mt-1">
                              {[data.businessHomeRsmEmail, data.businessHomeRsmPhone]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                          {data.businessHomeRsmAsmName && (
                            <p className="text-xs text-gray-500 mt-2">
                              ASM: {data.businessHomeRsmAsmName}{" "}
                              <span className="font-mono">
                                ({data.businessHomeRsmAsmEmployeeId || "—"})
                              </span>
                            </p>
                          )}
                        </li>
                      ) : null}
                    </>
                  );
                })()}

                {data?.rmName || data?.rmEmployeeId ? (
                  <li className="border-l-2 border-teal-400 pl-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      RM (Relationship Manager)
                    </p>
                    <p className="font-medium text-gray-900">{data.rmName || "—"}</p>
                    <p className="text-gray-600">
                      RM ID:{" "}
                      <span className="font-mono text-xs">{data.rmEmployeeId || "—"}</span>
                    </p>
                  </li>
                ) : null}

                <li className="border-l-2 border-slate-300 pl-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    You (Partner)
                  </p>
                  <p className="font-medium text-gray-900">
                    {data?.firstName} {data?.lastName}
                  </p>
                  <p className="text-gray-600">
                    Partner ID:{" "}
                    <span className="font-mono text-xs">{data?.employeeId || "—"}</span>
                  </p>
                </li>
              </ol>
              {!data?.rmName &&
                !data?.asmName &&
                !data?.personalRsmName &&
                !data?.businessHomeRsmName && (
                  <p className="text-sm text-gray-500 mt-2">
                    No reporting chain is linked to your account yet.
                  </p>
                )}
            </div>
          </div>

          {/* Documents Section (kept original) */}

          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Documents
            </h3>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  navigate("/IdCard", {
                    state: {
                      employeeData: {
                        name: `${data?.firstName} ${data?.lastName}`,
                        designation: "Partner",
                        id: `${data?.employeeId}`,
                        location: `${data?.address}`,
                        initials: `${data?.firstName[0]}${data?.lastName[0]}`,
                        photo: `${data?.profilePic}`,
                      },
                    },
                  });
                }}
                className="bg-teal-500 text-white px-4 py-3 rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <Download className="w-4 h-4" />

                <span>ID Card</span>
              </button>

              <button
                onClick={() => {
                  navigate("/AuthLetter", {
                    state: {
                      name: ` ${data?.firstName} ${data?.middleName} ${data?.lastName} `,
                    },
                  });
                }}
                className="bg-amber-500 text-white px-4 py-3 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <Download className="w-4 h-4" />

                <span>AuthLetter</span>
              </button>

              <button
                onClick={() => {
                  navigate("/Agreement" ,
                    {
                    state: {
                      employeeData: {
                        name: `${data?.firstName} ${data?.lastName}`,
                        IDNo : `${data?.employeeId}`,
                        Aadhar_Number : `${data?.aadharNumber}`,
                        PAN_Number :`${data?.panNumber}`,    
                        address : `${ data?.address }` 
                      },
                    },
                  }
                  );
                }}
                className="bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <Download className="w-4 h-4" />

                <span>Agreement</span>
              </button>
            </div>
          </div>
        </div>

        {/* Settings Modal */}

        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
              {/* Modal Header */}

              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-2xl font-semibold text-gray-800">
                  Account Settings
                </h3>

                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Settings Tabs */}

              <div className="flex border-b">
                <button
                  onClick={() => setActiveSettingsTab("password")}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeSettingsTab === "password"
                      ? "text-teal-500 border-b-2 border-teal-500"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Lock className="w-5 h-5 inline mr-2" />
                  Change Password
                </button>
              </div>

              {/* Settings Content */}

              <div className="p-6">
                {activeSettingsTab === "password" && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Change Password
                    </h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>

                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        value={settingsForm.currentPassword}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,

                            currentPassword: e.target.value,
                          })
                        }
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>

                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        value={settingsForm.password}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,

                            password: e.target.value,
                          })
                        }
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>

                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        value={settingsForm.confirmPassword}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,

                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Confirm new password"
                      />
                    </div>

                    <button
                      onClick={() => handleSettingsSubmit("Password")}
                      className="bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors flex items-center space-x-2"
                    >
                      <Save className="w-5 h-5" />

                      <span>Update Password</span>
                    </button>
                  </div>
                )}

             
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerProfile;
