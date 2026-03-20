import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { backendurl } from "../feature/urldata";
import logo from "../assets/logo.png";

export function ConfirmResetForm() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");   // ✅ token from URL
    const email = queryParams.get("email");   // ✅ email from URL
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!token || !email) {
            setMessage("Invalid or missing reset link");
            return;
        }

        try {
            const res = await fetch(`${backendurl}/auth/reset-password/confirm/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, newPassword, confirmPassword }),
            });
            const data = await res.json();
            setMessage(data.message);

            if (res.ok) {
                setTimeout(() => navigate("/LoginPage"), 1500);
            }
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
                                    src={logo}
                                    alt="Trustline Fintech"
                                    className="w-12 h-12 object-contain"
                                />
                            </div>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                            Set a new password
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                            Choose a strong password you haven&apos;t used before on this platform.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                New password
                            </label>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#12B99C] focus:border-[#12B99C] text-slate-900 placeholder:text-slate-400"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Confirm new password
                            </label>
                            <input
                                type="password"
                                placeholder="Re-enter new password"
                                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#12B99C] focus:border-[#12B99C] text-slate-900 placeholder:text-slate-400"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2.5 rounded-lg font-semibold text-white bg-[#12B99C] hover:bg-[#0f9e82] transition-colors duration-200"
                        >
                            Reset password
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
