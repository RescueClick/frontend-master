import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Tooltip } from "antd";
import { backendurl } from "../../feature/urldata";
import { getAuthData } from "../../utils/localStorage";

const MAX_REVIEW = 500;

function reviewToken(scope) {
  const auth = getAuthData() || {};
  if (scope === "admin") return auth.adminToken || "";
  if (scope === "asm") return auth.asmToken || auth.rsmToken || "";
  return auth.asmToken || auth.rsmToken || auth.adminToken || "";
}

function roleLabel(role) {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return "Admin";
  return role || "Staff";
}

function formatWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function LoanFileReviewCell({
  applicationId,
  review,
  scope,
  onSaved,
  readOnly = false,
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(review?.text || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setText(review?.text || "");
  }, [review?.text, open]);

  const byline = review?.text
    ? `By ${review.updatedByName || "Staff"} (${roleLabel(review.updatedByRole)})${
        formatWhen(review.updatedAt) ? ` · ${formatWhen(review.updatedAt)}` : ""
      }`
    : "";

  const save = async () => {
    const next = text.trim();
    if (!applicationId) {
      toast.error("Loan file id is missing");
      return;
    }
    if (!next) {
      toast.error("Review text is required");
      return;
    }
    if (next.length > MAX_REVIEW) {
      toast.error(`Review must be ${MAX_REVIEW} characters or fewer`);
      return;
    }
    const token = reviewToken(scope);
    if (!token) {
      toast.error("Not signed in");
      return;
    }
    try {
      setSaving(true);
      const response = await axios.patch(
        `${backendurl}/${scope}/applications/${applicationId}/file-review`,
        { text: next },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const saved = response.data?.fileReview || response.data?.data?.fileReview;
      toast.success("Review saved");
      setOpen(false);
      if (onSaved) onSaved(saved);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="max-w-[220px]">
        <Tooltip
          placement="topLeft"
          color="#ffffff"
          title={
            <div className="max-w-[260px] space-y-1 py-0.5 text-xs text-gray-800">
              <p className="font-semibold text-gray-900">{review?.text || "No review"}</p>
              {byline ? <p className="text-gray-500">{byline}</p> : null}
            </div>
          }
        >
          <div>
            {review?.text ? (
              <>
                <p className="text-sm text-slate-800 line-clamp-2">{review.text}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{byline}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">No review</p>
            )}
          </div>
        </Tooltip>
        {!readOnly ? (
        <button
          type="button"
          className="mt-1 text-xs font-semibold text-teal-700 hover:text-teal-900"
          onClick={() => {
            setText(review?.text || "");
            setOpen(true);
          }}
        >
          Update review
        </button>
        ) : null}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loan-file-review-title"
          onClick={(event) => {
            if (event.target === event.currentTarget && !saving) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 id="loan-file-review-title" className="text-base font-semibold text-slate-900">
              Loan file review
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Internal note for Admin, RSM, and ASM. The latest save replaces the column.
            </p>
            {byline ? <p className="mt-2 text-xs text-slate-600">{byline}</p> : null}
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value.slice(0, MAX_REVIEW))}
              rows={5}
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              placeholder="Write the review for this loan file"
            />
            <p className="mt-1 text-right text-[11px] text-slate-400">
              {text.trim().length}/{MAX_REVIEW}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
