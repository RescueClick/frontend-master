import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Calendar, Mail, Phone, User, CheckCircle2, XCircle } from "lucide-react";
import {
  fetchDeleteAccountRequests,
  updateDeleteAccountRequestStatus,
} from "../../../feature/thunks/adminThunks";

const DeleteAccountRequests = () => {
  const dispatch = useDispatch();
  const { loading, error, data } = useSelector(
    (state) => state.admin.deleteAccountRequests || { data: [] }
  );

  useEffect(() => {
    dispatch(fetchDeleteAccountRequests());
  }, [dispatch]);

  const handleUpdateStatus = (id, status) => {
    if (
      !window.confirm(
        `Mark this delete-account request as ${status}? Make sure you have already handled the account in the Partner/Customer list.`
      )
    ) {
      return;
    }
    dispatch(updateDeleteAccountRequestStatus({ id, status }));
  };

  const getStatusBadge = (status) => {
    const base =
      "inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full";
    if (status === "COMPLETED") {
      return (
        <span className={`${base} bg-emerald-50 text-emerald-700`}>
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className={`${base} bg-rose-50 text-rose-700`}>
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </span>
      );
    }
    return (
      <span className={`${base} bg-amber-50 text-amber-800`}>
        Pending
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Delete Account Requests
            </h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              Review and track user requests to delete their accounts. After
              deleting/suspending the account in the relevant section, mark the
              request as completed.
            </p>
          </div>
          <div className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <p className="font-semibold text-gray-700 mb-1">Admin Note</p>
            <p>
              This list is informational. Actual deletion / suspension should be
              done from the Partner / Customer / RM / ASM pages.
            </p>
          </div>
        </div>

        {/* Error / loading */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-teal-600 text-white">
              <tr>
                <th className="px-3 py-3 text-left">User</th>
                <th className="px-3 py-3 text-left">Contact</th>
                <th className="px-3 py-3 text-left">Role</th>
                <th className="px-3 py-3 text-left">Reason</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">Requested At</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">
                  Processed
                </th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-4 text-center text-gray-500"
                  >
                    Loading delete-account requests...
                  </td>
                </tr>
              ) : !data || data.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No delete-account requests found.
                  </td>
                </tr>
              ) : (
                data.map((req) => (
                  <tr
                    key={req._id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    {/* User */}
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          <User className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {req.user
                              ? `${req.user.firstName || ""} ${
                                  req.user.lastName || ""
                                }`.trim() || "Unknown User"
                              : "Unknown User"}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {req.user?.employeeId || req.user?._id || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-3 py-3 align-top">
                      <div className="space-y-1 text-xs text-gray-700">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-500" />
                          <span>{req.user?.email || "-"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-500" />
                          <span>{req.user?.phone || "-"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-3 py-3 align-top">
                      <span className="inline-flex px-2 py-1 text-xs rounded bg-slate-100 text-slate-700 font-medium">
                        {req.role || req.user?.role || "-"}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="px-3 py-3 align-top max-w-xs">
                      <p className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-3">
                        {req.reason || "-"}
                      </p>
                    </td>

                    {/* Requested At */}
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-1 text-xs text-gray-700">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span>
                          {req.createdAt
                            ? new Date(req.createdAt).toLocaleString()
                            : "-"}
                        </span>
                      </div>
                    </td>

                    {/* Processed */}
                    <td className="px-3 py-3 align-top text-xs text-gray-700">
                      {req.processedAt ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span>
                              {new Date(req.processedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 align-top">
                      {getStatusBadge(req.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateStatus(req._id, "COMPLETED")
                          }
                          disabled={req.status === "COMPLETED"}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Mark Completed
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateStatus(req._id, "REJECTED")
                          }
                          disabled={req.status === "REJECTED"}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Mark Rejected
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountRequests;


