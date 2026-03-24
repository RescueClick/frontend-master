import React, { useEffect } from "react";
import {
  Mail,
  Phone,
  Calendar,
  Home,
  Briefcase,
  MapPin,
  Users,
  Hash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function formatProfileDate(d) {
  if (!d) return "N/A";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
}

/**
 * Slide-out profile for internal roles (RM / RSM / ASM / Admin).
 * Pass `data` from Redux profile slice; `roleLabel` is shown as a badge.
 */
export default function Profile({
  setProfileOpen,
  data,
  roleLabel,
  editPath,
  onLogout,
}) {
  const navigate = useNavigate();

  const displayName =
    data?.fullName ||
    [data?.firstName, data?.lastName].filter(Boolean).join(" ").trim() ||
    "User";

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setProfileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setProfileOpen]);

  const Row = ({ icon: Icon, label, children }) => (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <div className="text-[#111827] text-sm break-words">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-brand-primary flex items-center justify-center text-white text-3xl font-bold shadow-md">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-3 text-xl font-semibold text-gray-900">{displayName}</h2>
          {roleLabel ? (
            <span className="mt-1 inline-flex items-center rounded-full bg-brand-primary/10 px-3 py-0.5 text-xs font-semibold text-brand-primary">
              {roleLabel}
            </span>
          ) : null}
          <p className="mt-2 flex items-center justify-center gap-1 text-sm text-gray-600">
            <Hash className="w-4 h-4 text-brand-primary" />
            <span className="font-medium">Employee ID</span>
            <span>{data?.employeeId ?? "N/A"}</span>
          </p>
        </div>

        <div className="space-y-4 text-gray-700 border-t border-gray-100 pt-4">
          <Row icon={Mail} label="Email">
            {data?.email ?? "N/A"}
          </Row>
          <Row icon={Phone} label="Phone">
            {data?.phone ?? "N/A"}
          </Row>
          <Row icon={Calendar} label="Date of birth">
            {data?.dob ? formatProfileDate(data.dob) : "N/A"}
          </Row>
          <Row icon={Briefcase} label="Date of joining">
            {data?.JoiningDate ? formatProfileDate(data.JoiningDate) : "N/A"}
          </Row>
          <Row icon={Home} label="Address">
            {data?.address ?? "N/A"}
          </Row>
          <Row icon={MapPin} label="Region">
            {data?.region ?? "N/A"}
          </Row>
          {data?.experience != null && String(data.experience).trim() !== "" ? (
            <Row icon={Briefcase} label="Experience">
              {String(data.experience)}
            </Row>
          ) : null}
        </div>

        {data?.personalRsmName ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-1 text-left w-full">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Users className="w-4 h-4 text-brand-primary" />
              Personal loan RSM
            </div>
            <p className="text-sm text-gray-800">{data.personalRsmName}</p>
            {data.personalRsmEmployeeId ? (
              <p className="text-xs text-gray-600">ID: {data.personalRsmEmployeeId}</p>
            ) : null}
            {data.personalRsmPhone ? (
              <p className="text-xs text-gray-600">Phone: {data.personalRsmPhone}</p>
            ) : null}
          </div>
        ) : null}

        {data?.businessHomeRsmName ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-1 text-left w-full">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Users className="w-4 h-4 text-brand-primary" />
              Business &amp; home loan RSM
            </div>
            <p className="text-sm text-gray-800">{data.businessHomeRsmName}</p>
            {data.businessHomeRsmEmployeeId ? (
              <p className="text-xs text-gray-600">ID: {data.businessHomeRsmEmployeeId}</p>
            ) : null}
            {data.businessHomeRsmPhone ? (
              <p className="text-xs text-gray-600">Phone: {data.businessHomeRsmPhone}</p>
            ) : null}
          </div>
        ) : null}

        {data?.asmName || data?.asmEmployeeId ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-left w-full">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
              <Users className="w-4 h-4 text-brand-primary" />
              ASM
            </div>
            <p className="text-sm font-medium text-gray-900">{data.asmName ?? "—"}</p>
            <p className="text-xs text-gray-600 mt-1">
              Employee ID: {data.asmEmployeeId ?? "—"}
            </p>
            {data.asmPhone ? (
              <p className="text-xs text-gray-600">Phone: {data.asmPhone}</p>
            ) : null}
          </div>
        ) : null}

        {editPath ? (
          <button
            type="button"
            onClick={() => {
              setProfileOpen(false);
              navigate(editPath);
            }}
            className="w-full px-4 py-2.5 bg-brand-primary text-white rounded-lg shadow hover:opacity-95 transition text-sm font-semibold"
          >
            Edit profile
          </button>
        ) : null}

        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Log out
          </button>
        ) : null}
      </div>
    </div>
  );
}
