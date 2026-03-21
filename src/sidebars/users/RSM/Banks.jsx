import React, { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Eye, EyeOff, Search } from "lucide-react";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

const Banks = () => {
    const [showPassword, setShowPassword] = useState({});
    const [showId, setShowId] = useState({});
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [nameSearch, setNameSearch] = useState("");

    const filteredBanks = useMemo(() => {
        const q = String(nameSearch || "").trim().toLowerCase();
        if (!q) return banks;
        return banks.filter((b) =>
            String(b.bankName || "")
                .toLowerCase()
                .includes(q)
        );
    }, [banks, nameSearch]);

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                setLoading(true);
                setError("");

                const { rsmToken } = getAuthData() || {};
                if (!rsmToken) {
                    setError("Not authenticated as RSM");
                    setLoading(false);
                    return;
                }

                const response = await axios.get(`${backendurl}/rsm/banks`, {
                    headers: {
                        Authorization: `Bearer ${rsmToken}`,
                    },
                });

                const { rsmUser } = getAuthData() || {};
                const rsmType = String(rsmUser?.rsmType || "").trim().toUpperCase();

                const normalizeLoanType = (lt) => {
                    const raw = String(lt || "").trim().toUpperCase();
                    if (raw === "PERSONAL_LOAN") return "PERSONAL";
                    if (raw === "BUSINESS_LOAN") return "BUSINESS";
                    return raw;
                };

                const data = Array.isArray(response.data?.banks)
                    ? response.data.banks
                    : Array.isArray(response.data)
                    ? response.data
                    : [];

                const mapped = data.map((b, index) => ({
                    _id: b._id || b.id || index,
                    bankName: b.bankName || b.name || "Unnamed Bank",
                    bankLogoUrl: b.bankLogoUrl || b.logoUrl || b.logo || "",
                    portalLoginId: b.portalLoginId || b.loginId || "",
                    portalPassword: b.portalPassword || b.password || "",
                    loanType: b.loanType || "",
                    portalLink: b.portalLink || b.link || "#",
                    rsmTypes: Array.isArray(b.rsmTypes)
                        ? b.rsmTypes
                        : b.rsmTypes
                        ? [b.rsmTypes]
                        : [],
                }));

                const filtered = mapped.filter((bank) => {
                    const lt = normalizeLoanType(bank.loanType);
                    if (rsmType === "PERSONAL") return lt === "PERSONAL";
                    if (rsmType === "BUSINESS_HOME") return lt === "BUSINESS" || lt.startsWith("HOME_LOAN_");
                    return true;
                });

                setBanks(filtered);
            } catch (err) {
                setError(
                    err?.response?.data?.message ||
                        "Failed to load banks for RSM"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchBanks();
    }, []);

    const togglePassword = (id) => {
        setShowPassword((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const toggleId = (id) => {
        setShowId((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const copyText = (text) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard");
    };

    const maskText = (text) => {
        if (!text || typeof text !== "string") return "";
        return "*".repeat(text.length);
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6">
            <div className="max-w-[100rem] mx-auto">
                <div className="mb-6 flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Lending Partner Access
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-600">
                            Manage and access portals of all partnered banks and NBFCs for loan applications.
                        </p>
                    </div>
                    {!loading && banks.length > 0 && (
                        <div className="flex w-full shrink-0 flex-col gap-2 sm:min-w-[18rem] lg:max-w-md lg:pt-0.5">
                            <label className="relative block w-full">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    value={nameSearch}
                                    onChange={(e) => setNameSearch(e.target.value)}
                                    placeholder="Search by bank name..."
                                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    autoComplete="off"
                                />
                            </label>
                            <p className="text-right text-xs text-gray-500 sm:text-left lg:text-right">
                                Showing{" "}
                                <span className="font-semibold text-gray-700">{filteredBanks.length}</span>
                                {" / "}
                                {banks.length} bank{banks.length === 1 ? "" : "s"}
                            </p>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center text-gray-600 text-sm">
                        Loading banks...
                    </div>
                ) : banks.length === 0 ? (
                    <div className="text-center text-gray-600 text-sm">
                        No banks available for your profile yet.
                    </div>
                ) : (
                    <>
                    {filteredBanks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-600">
                            No banks match &quot;{nameSearch.trim()}&quot;. Try a different name.
                        </div>
                    ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                        {filteredBanks.map((bank) => (
                            <div
                                key={bank._id}
                                className="group bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 flex flex-col gap-2.5 min-w-0"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-10 h-10 shrink-0 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={bank.bankLogoUrl}
                                            alt={bank.bankName}
                                            className="w-8 h-8 object-contain"
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                                            {bank.bankName}
                                        </h2>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100" />

                                <div className="space-y-1">
                                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                        Login ID
                                    </span>
                                    <div className="flex items-center justify-between gap-1 bg-gray-50 px-2 py-1.5 rounded-lg">
                                        <span className="font-medium text-gray-800 text-[11px] break-all min-w-0 flex-1 line-clamp-2">
                                            {showId[bank._id]
                                                ? bank.portalLoginId
                                                : maskText(bank.portalLoginId)}
                                        </span>
                                        <div className="flex items-center shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => toggleId(bank._id)}
                                                className="inline-flex items-center justify-center rounded-full p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                            >
                                                {showId[bank._id] ? (
                                                    <EyeOff size={14} />
                                                ) : (
                                                    <Eye size={14} />
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => copyText(bank.portalLoginId)}
                                                className="inline-flex items-center justify-center rounded-full p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                        Password
                                    </span>
                                    <div className="flex items-center justify-between gap-1 bg-gray-50 px-2 py-1.5 rounded-lg">
                                        <span className="font-medium text-gray-800 text-[11px] break-all min-w-0 flex-1 line-clamp-2">
                                            {showPassword[bank._id]
                                                ? bank.portalPassword
                                                : maskText(bank.portalPassword)}
                                        </span>
                                        <div className="flex items-center shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => togglePassword(bank._id)}
                                                className="inline-flex items-center justify-center rounded-full p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                            >
                                                {showPassword[bank._id] ? (
                                                    <EyeOff size={14} />
                                                ) : (
                                                    <Eye size={14} />
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => copyText(bank.portalPassword)}
                                                className="inline-flex items-center justify-center rounded-full p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-2 border-t border-dashed border-gray-200 flex items-center justify-between gap-2">
                                    <span className="px-2 py-1 text-[10px] font-semibold rounded-md bg-emerald-100 text-emerald-700 truncate max-w-[55%]">
                                        {bank.loanType || "N/A"}
                                    </span>
                                    <a
                                        href={bank.portalLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-0.5 bg-purple-500 text-white text-[11px] px-2 py-1 rounded-md hover:bg-purple-600 transition shrink-0"
                                    >
                                        Visit
                                        <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                    )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Banks;
