import { useState } from "react";
import { backendurl } from "../feature/urldata";
import { brandLogo, COMPANY_NAME } from "../config/branding";

export function RequestResetForm() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            const res = await fetch(`${backendurl}/auth/reset-password/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            setMessage(data.message);
        } catch (err) {
            setMessage("Something went wrong!");
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="w-full min-h-screen flex items-center justify-center px-4">
                <div className="max-w-xl w-full bg-white/95 rounded-3xl shadow-2xl border border-slate-100 px-6 py-8 sm:px-8 sm:py-10">
                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-white border border-gray-100">
                                <img
                                    src={brandLogo}
                                    alt={COMPANY_NAME}
                                    className="w-12 h-12 object-contain"
                                />
                            </div>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                            Forgot your password?
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                            Enter the email address associated with your account and we&apos;ll send you a secure link to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Email address
                            </label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-slate-900 placeholder:text-slate-400"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2.5 rounded-lg font-semibold text-white bg-brand-primary hover:bg-[#0f9e82] transition-colors duration-200"
                        >
                            Send reset link
                        </button>
                    </form>

                    {message && (
                        <p className="mt-4 text-center text-sm text-amber-600">
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}