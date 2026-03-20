import React, { useEffect, useState } from "react";
import { Copy, ExternalLink, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

const Banks = () => {

    // const [bankData, setBankData] = useState([]);

    const [showPassword, setShowPassword] = useState({});
    const [showId, setShowId] = useState({});
    const [banks, setBanks] = useState([]);


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
                        id: b._id || b.id || index,
                        // backend uses bankName
                        name: b.bankName || b.name || "Unnamed Bank",
                        // backend stores logo as bankLogoUrl
                        logo: b.bankLogoUrl || b.logoUrl || b.logo || "",
                        // backend uses portalLoginId / portalPassword / portalLink
                        loginId: b.portalLoginId || b.loginId || "",
                        password: b.portalPassword || b.password || "",
                        loanType: b.loanType || "",
                        link: b.portalLink || b.link || "#",
                        // rsmTypes may be array or single string
                        rsmTypes: Array.isArray(b.rsmTypes)
                            ? b.rsmTypes
                            : b.rsmTypes
                            ? [b.rsmTypes]
                            : [],
                    }));

                // UI safety filter (same as backend) aligned with Application.js LOAN_TYPES.
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

    const dispatch = useDispatch();


    const { data: banksData, loading, error } = useSelector((state) => state.rsm.banksData);

    console.log("Banks Data:", banksData);

    useEffect(()=>{
        dispatch(fetchBanks());
    }, [dispatch]);
    
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
            <div className="max-w-6xl mx-auto">
                {/* Page header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">
                        Lending Partner Access
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Manage and access portals of all partnered banks and NBFCs for loan applications.
                    </p>
                </div>

                {/* Banks grid */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banks.map((bank) => (
                        <div
                            key={bank?._id}
                            className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-200 flex flex-col gap-4"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={bank.bankLogoUrl}
                                        alt={bank.bankName}
                                        className="w-11 h-11 object-contain"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-base font-semibold text-gray-900 truncate">
                                        {bank.bankName}
                                    </h2>
                                    {/* <p className="mt-0.5 text-xs text-gray-500">
                                        Loan Partner Portal
                                    </p> */}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-100" />

                            {/* Login ID */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Login ID
                                    </span>
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl">
                                    <span className="font-medium text-gray-800 text-xs md:text-sm break-all max-w-[70%]">
                                        {showId[bank?._id]
                                            ? bank.portalLoginId
                                            : maskText(bank.portalLoginId)}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => toggleId(bank?._id)}
                                            className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                        >
                                            {showId[bank?._id] ? (
                                                <EyeOff size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => copyText(bank.portalLoginId)}
                                            className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Password
                                    </span>
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl">
                                    <span className="font-medium text-gray-800 text-xs md:text-sm break-all max-w-[70%]">
                                        {showPassword[bank?._id]
                                            ? bank.portalPassword
                                            : maskText(bank.portalPassword)}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => togglePassword(bank?._id)}
                                            className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                        >
                                            {showPassword[bank?._id] ? (
                                                <EyeOff size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => copyText(bank.portalPassword)}
                                            className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* NOTE: Link UI is intentionally kept commented to preserve existing behavior */}
                            <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
                                {/* <div className="flex items-center justify-between border-t mt-4 pt-3"> */}

                                {/* <span className="text-xs md:text-sm font-medium text-gray-600">
                                        Loan Type
                                    </span> */}

                                <span className="px-3 py-2 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-700">
                                    {bank.loanType || "N/A"}
                                </span>

                                {/* </div> */}
                                <a
                                    href={bank.portalLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 bg-purple-500 text-white text-xs md:text-sm px-3 py-1.5 rounded-lg hover:bg-purple-600 transition"
                                >
                                    Visit
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
                )}
            </div>
        </div>
    );
};

export default Banks;