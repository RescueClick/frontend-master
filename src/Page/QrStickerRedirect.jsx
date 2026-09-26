import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Loader2, QrCode, AlertCircle } from "lucide-react";
import { backendurl } from "../feature/urldata";
import { brandLogo, COMPANY_NAME } from "../config/branding";

/**
 * Public page for pre-printed partner QR stickers.
 * /q/:serial → resolve → redirect to /advisor/:partnerCode
 */
export default function QrStickerRedirect() {
  const { serial } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!serial) {
        setState({ loading: false, error: "Invalid QR code", data: null });
        return;
      }
      try {
        const { data } = await axios.get(
          `${backendurl}/qr/${encodeURIComponent(serial)}`
        );
        if (cancelled) return;
        if (data?.status === "ASSIGNED" && data.redirectUrl) {
          // Prefer in-app navigate if same origin path
          try {
            const u = new URL(data.redirectUrl, window.location.origin);
            if (u.origin === window.location.origin) {
              navigate(`${u.pathname}${u.search}`, { replace: true });
              return;
            }
          } catch {
            /* fall through */
          }
          window.location.replace(data.redirectUrl);
          return;
        }
        setState({ loading: false, error: null, data });
      } catch (e) {
        if (cancelled) return;
        setState({
          loading: false,
          error:
            e.response?.data?.message ||
            "Could not open this QR code. Please try again.",
          data: e.response?.data || null,
        });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [serial, navigate]);

  if (state.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white px-4">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600 mb-4" />
        <p className="text-stone-600 text-sm">Opening partner link…</p>
      </div>
    );
  }

  const title =
    state.data?.status === "UNASSIGNED"
      ? "QR not activated yet"
      : state.data?.status === "DISABLED" || state.data?.status === "NOT_FOUND"
        ? "QR unavailable"
        : state.error
          ? "Something went wrong"
          : "QR status";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm text-center">
        <img src={brandLogo} alt={COMPANY_NAME} className="mx-auto h-10 mb-6" />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
          {state.error || state.data?.status !== "ASSIGNED" ? (
            <AlertCircle className="h-7 w-7 text-amber-600" />
          ) : (
            <QrCode className="h-7 w-7 text-teal-700" />
          )}
        </div>
        <h1 className="text-xl font-bold text-stone-900 mb-2">{title}</h1>
        <p className="text-sm text-stone-600 mb-4">
          {state.error ||
            state.data?.message ||
            "This QR code is not ready for customers yet."}
        </p>
        {serial && (
          <p className="font-mono text-xs text-stone-400 mb-6">Serial: {String(serial).toUpperCase()}</p>
        )}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Go to home
        </button>
      </div>
    </div>
  );
}
