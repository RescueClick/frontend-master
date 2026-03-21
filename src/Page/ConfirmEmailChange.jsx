import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { backendurl } from "../feature/urldata";
import { brandLogo, COMPANY_NAME } from "../config/branding";

/**
 * Public page: user opens link from email ?token=...
 * Confirms new email via POST /api/auth/email-change/confirm
 */
export default function ConfirmEmailChange() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ok | err

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("err");
      setMessage("Invalid or missing link. Open the link from your confirmation email.");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${backendurl}/auth/email-change/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        setMessage(data.message || (res.ok ? "Email updated." : "Something went wrong."));
        setStatus(res.ok ? "ok" : "err");
        if (res.ok) {
          setTimeout(() => navigate("/LoginPage", { replace: true }), 2200);
        }
      } catch {
        setStatus("err");
        setMessage("Network error. Try again later.");
      }
    })();
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full min-h-screen flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white/95 rounded-3xl shadow-2xl border border-slate-100 px-6 py-8 sm:px-8 sm:py-10">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-white border border-gray-100">
                <img src={brandLogo} alt={COMPANY_NAME} className="w-12 h-12 object-contain" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {status === "loading" ? "Confirming email…" : status === "ok" ? "Email confirmed" : "Could not confirm"}
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              {status === "loading"
                ? "Please wait while we verify your link."
                : status === "ok"
                  ? "Redirecting you to sign in with your new email."
                  : "You can close this page or try opening the link from your email again."}
            </p>
          </div>

          {message && (
            <p
              className={`text-center text-sm ${
                status === "ok" ? "text-emerald-700" : status === "err" ? "text-red-600" : "text-slate-600"
              }`}
            >
              {message}
            </p>
          )}

          {status === "err" && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate("/LoginPage")}
                className="text-sm font-semibold text-brand-primary hover:underline"
              >
                Go to login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
