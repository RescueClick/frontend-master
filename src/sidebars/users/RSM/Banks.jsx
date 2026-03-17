import React, { useState } from "react";
import { Copy, ExternalLink, Eye, EyeOff } from "lucide-react";

const bankData = [
    {
        id: 1,
        name: "DMI Finance",
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVXsf9Q2820foCibdlTtxo1nmxvyMBg5uGdA&s",
        loginId: "dmi.partner@loan.com",
        password: "DMI@1234",
        loanType: "Personal Loan",
        link: "https://portal.dmifinance.com/apply",
    },
    {
        id: 2,
        name: "IndusInd Bank",
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvhv54BCIZTc_imhpq7Us0LQwuEYVuWKTDEA&s",
        loginId: "indus.partner@loan.com",
        password: "Indus@456",
        loanType: "Business Loan",
        link: "https://partner.indusind.com/apply",
    },
    {
        id: 3,
        name: "Muthoot Finance",
        logo: "https://upload.wikimedia.org/wikipedia/en/2/20/Muthoot_Finance_Logo.svg",
        loginId: "muthoot.partner@loan.com",
        password: "Muthoot@789",
        loanType: "Home Loan",
        link: "https://muthootfinance.com/apply",
    },
];

const Banks = () => {

    const [showPassword, setShowPassword] = useState({});
    const [showId, setShowId] = useState({});

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bankData.map((bank) => (
                        <div
                            key={bank.id}
                            className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-200 flex flex-col gap-4"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={bank.logo}
                                        alt={bank.name}
                                        className="w-11 h-11 object-contain"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-base font-semibold text-gray-900 truncate">
                                        {bank.name}
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
                                        {showId[bank.id]
                                            ? bank.loginId
                                            : maskText(bank.loginId)}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => toggleId(bank.id)}
                                            className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                        >
                                            {showId[bank.id] ? (
                                                <EyeOff size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => copyText(bank.loginId)}
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
                                        {showPassword[bank.id]
                                            ? bank.password
                                            : maskText(bank.password)}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => togglePassword(bank.id)}
                                            className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                        >
                                            {showPassword[bank.id] ? (
                                                <EyeOff size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => copyText(bank.password)}
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
                                    {bank.loanType}
                                </span>

                                {/* </div> */}
                                <a
                                    href={bank.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs md:text-sm px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition"
                                >
                                    Visit
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Banks;