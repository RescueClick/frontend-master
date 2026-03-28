import React, { useEffect, useState, useMemo } from "react";
import { Eye, Download, Trash2, Search, X } from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { getAllCustomers } from "../../../feature/thunks/adminThunks";
import { getAuthData,saveAuthData } from "../../../utils/localStorage";
import axios from "axios"
import { useNavigate, useLocation } from "react-router-dom";
import { backendurl } from "../../../feature/urldata";
import LoanStatusBadge from "../../../components/shared/LoanStatusBadge";
import AppAntTable from "../../../components/shared/AppAntTable";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";
import { getLoanStatusLabel } from "../../../utils/loanStatus";
import { loanTypeToTableShort } from "../../../utils/loanTypeShort";

 

const colors = {
  primary: "var(--color-brand-primary)",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  text: "#111827",
};
 

 
export default function CustomerTable() {


  const [model, setModel] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // Customer to delete
  const [deleting, setDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()
  const location = useLocation()



  const dispatch = useDispatch();
  const { loading, data, error } = useSelector((state) => state.admin.allCustomers);

  console.log("data : ",data);

  const sortedData = useMemo(() => {
    return [...(data || [])].sort((a, b) => {
      const aTime = a?.applicationDate ? new Date(a.applicationDate).getTime() : (a?.createdAt ? new Date(a.createdAt).getTime() : 0);
      const bTime = b?.applicationDate ? new Date(b.applicationDate).getTime() : (b?.createdAt ? new Date(b.createdAt).getTime() : 0);
      return bTime - aTime;
    });
  }, [data]);

  const filteredCustomers = useMemo(() => {
    if (!sortedData.length) return [];
    const term = searchQuery.trim().toLowerCase();
    if (!term) return sortedData;
    return sortedData.filter((c) => {
      const fullName = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
      const employeeId = (c.employeeId || "").toLowerCase();
      const phone = String(c.phone || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const mongoId = (c._id || "").toLowerCase();
      const appNo = String(c.appNo ?? "").toLowerCase();
      const loanType = (c.loanType || "").toLowerCase();
      const asmName = (c.asmName || "").toLowerCase();
      const rmName = (c.rmName || "").toLowerCase();
      const partnerName = (c.partnerName || "").toLowerCase();
      const status = String(c.status || "").toLowerCase();
      return (
        fullName.includes(term) ||
        employeeId.includes(term) ||
        phone.includes(term) ||
        email.includes(term) ||
        mongoId.includes(term) ||
        appNo.includes(term) ||
        loanType.includes(term) ||
        asmName.includes(term) ||
        rmName.includes(term) ||
        partnerName.includes(term) ||
        status.includes(term)
      );
    });
  }, [sortedData, searchQuery]);

  useEffect(() => {
    dispatch(getAllCustomers());
  }, [dispatch]);

  useEffect(() => {
    if (!location?.state) return;
    const incoming = location.state;
    if (typeof incoming === "string") {
      setSearchQuery(incoming);
    } else if (typeof incoming === "object" && incoming !== null) {
      const possible = incoming.employeeId || incoming.query;
      if (possible) setSearchQuery(String(possible));
    }
  }, [location]);

      // Format date
      const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString();
      };


      const loginAsUser = async (userId, navigate) => {
        try {
          const { adminToken } = getAuthData();
          if (!adminToken) throw new Error("Admin not authenticated");
      
          const res = await axios.post(
            `${backendurl}/auth/login-as/${userId}`,
            {},
            { headers: { Authorization: `Bearer ${adminToken}` } }
          );
      
          const { token, user } = res.data;
      
          // Save impersonated token without removing admin token
          saveAuthData(token, user, true);
      
          // Navigate to role
          switch (user.role) {
            case "ASM": navigate("/asm"); break;
            case "RM": navigate("/rm"); break;
            case "PARTNER": navigate("/partner"); break;
            case "CUSTOMER": navigate("/customer"); break;
            default: navigate("/"); break;
          }
        } catch (err) {
          console.error("Login as user failed:", err.response?.data || err.message);
          alert(err.response?.data?.message || err.message || "Login as user failed");
        }
      };
      
     // Usage in component
    const handleLoginAs = (userId) => {
      console.log("userId", userId)
    loginAsUser(userId, navigate);
    };

    // ✅ Delete customer and all their loan applications
    const handleDeleteCustomer = async (customerId, customerName) => {
      try {
        setDeleting(true);
        const { adminToken } = getAuthData();
        if (!adminToken) {
          throw new Error("Admin not authenticated");
        }

        const response = await axios.delete(
          `${backendurl}/admin/customer/${customerId}`,
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }
        );

        // Show success message
        alert(`Customer "${customerName}" and all associated loan applications deleted successfully.`);
        
        // Close delete confirmation modal
        setDeleteConfirm(null);
        
        // Refresh the customer list
        dispatch(getAllCustomers());
      } catch (error) {
        console.error("Error deleting customer:", error);
        alert(
          error.response?.data?.message || 
          error.message || 
          "Failed to delete customer"
        );
      } finally {
        setDeleting(false);
      }
    };

  const columns = useMemo(
    () => [
      {
        title: "User Name",
        key: "name",
        render: (_, c) => `${c.firstName} ${c.lastName}`,
      },
      { title: "User ID", dataIndex: "employeeId", key: "eid" },
      { title: "Contact", dataIndex: "phone", key: "phone" },
      {
        title: "Application Date",
        key: "ad",
        render: (_, c) =>
          c.applicationDate
            ? new Date(c.applicationDate).toLocaleDateString("en-IN")
            : "—",
      },
      {
        title: "Loan Type",
        dataIndex: "loanType",
        key: "lt",
        render: (v) => loanTypeToTableShort(v),
      },
      {
        title: "Loan",
        dataIndex: "loanAmount",
        key: "la",
        render: (v) => v || "-",
      },
      {
        title: "Disburse",
        dataIndex: "disburseAmount",
        key: "da",
        render: (v) => v || "-",
      },
      {
        title: "Login As",
        key: "login",
        render: (_, c) => (
          <button
            type="button"
            className="px-2 py-1 border rounded text-xs"
            style={{
              borderColor: colors.secondary,
              color: colors.secondary,
            }}
            onClick={() => handleLoginAs(c._id)}
          >
            Login
          </button>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (s) => <LoanStatusBadge status={s} />,
      },
      {
        title: "Action",
        key: "act",
        render: (_, c) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => {
                setModel(c);
              }}
              title="View Details"
            >
              <Eye size={14} />
            </button>
            <button
              type="button"
              className="p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
              onClick={() => setDeleteConfirm(c)}
              title="Delete Customer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (


    <>


    
{/* ✅ Delete Confirmation Modal */}
{deleteConfirm && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[60] overflow-y-auto">
    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 relative mx-4">
      {/* Warning Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <Trash2 className="w-8 h-8 text-red-600" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-center text-gray-800 mb-2">
        Delete Customer?
      </h2>

      {/* Warning Message */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-red-800 font-medium mb-2">
          ⚠️ This action cannot be undone!
        </p>
        <p className="text-sm text-gray-700">
          You are about to permanently delete:
        </p>
        <ul className="text-sm text-gray-700 mt-2 ml-4 list-disc">
          <li>Customer: <strong>{deleteConfirm.firstName} {deleteConfirm.lastName}</strong></li>
          <li>Customer ID: <strong>{deleteConfirm.employeeId}</strong></li>
          <li>All associated loan applications</li>
          <li>All uploaded documents</li>
        </ul>
      </div>

      {/* Confirmation Text */}
      <p className="text-center text-gray-600 mb-6">
        Are you sure you want to proceed?
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setDeleteConfirm(null)}
          disabled={deleting}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={() => handleDeleteCustomer(deleteConfirm._id, `${deleteConfirm.firstName} ${deleteConfirm.lastName}`)}
          disabled={deleting}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {deleting ? (
            <>
              <span className="animate-spin">⏳</span>
              Deleting...
            </>
          ) : (
            <>
              <Trash2 size={16} />
              Delete Permanently
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}

{model && (
  <div
    className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center p-0 sm:p-4 md:p-6 bg-black/55 backdrop-blur-[2px] overflow-y-auto overscroll-contain"
    role="dialog"
    aria-modal="true"
    aria-labelledby="customer-detail-title"
    onClick={(e) => {
      if (e.target === e.currentTarget) setModel(null);
    }}
  >
    <div
      className="flex flex-col w-full max-w-5xl min-h-0 sm:min-h-0 sm:max-h-[min(90dvh,880px)] max-h-[100dvh] sm:rounded-2xl bg-white shadow-2xl border border-gray-200/90 sm:my-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <header className="relative shrink-0 flex items-start gap-3 px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4 border-b border-gray-100 bg-gradient-to-b from-slate-50/80 to-white">
        <div className="flex-1 min-w-0 pr-10 sm:pr-12">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
            Customer record
          </p>
          <h2
            id="customer-detail-title"
            className="text-lg sm:text-xl font-semibold text-slate-900 truncate"
          >
            {[model.firstName, model.lastName].filter(Boolean).join(" ") || model.userName || "Customer details"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 truncate">
            App no.{" "}
            <span className="font-mono text-slate-800">{model.appNo ?? "—"}</span>
            {model.employeeId ? (
              <>
                {" "}
                · ID <span className="font-mono text-slate-800">{model.employeeId}</span>
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModel(null)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          aria-label="Close"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
          {/* Personal Info */}
          <section className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-200/90">
              Personal info
            </h3>
            <dl className="space-y-3">
              {[
                ["Application no.", model.appNo ?? "—"],
                ["Application date", formatDate(model.applicationDate)],
                ["User name", model.userName ?? "—"],
                ["User ID", model.userId || "N/A"],
                ["Phone", model.phone ?? "—"],
                ["Email", model.email ?? "—"],
                ["Customer ID", model.employeeId ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white px-3 py-2.5 border border-slate-100 shadow-sm">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
                  <dd className="mt-0.5 text-sm text-slate-900 font-medium break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Management Team */}
          <section className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-200/90">
              Management team
            </h3>
            <dl className="space-y-3">
              {[
                ["ASM employee ID", model.asmEmployeeId ?? "—"],
                ["ASM name", model.asmName ?? "—"],
                ["RM employee ID", model.rmEmployeeId ?? "—"],
                ["RM name", model.rmName ?? "—"],
                ["Partner employee ID", model.partnerEmployeeId ?? "—"],
                ["Partner name", model.partnerName ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white px-3 py-2.5 border border-slate-100 shadow-sm">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
                  <dd className="mt-0.5 text-sm text-slate-900 font-medium break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Loan Info — full width on md, third column on xl */}
          <section className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 sm:p-5 md:col-span-2 xl:col-span-1">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-200/90">
              Loan info
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3 xl:grid-cols-1">
              {[
                ["Loan amount", model.loanAmount ?? "—"],
                ["Disburse amount", model.disburseAmount ?? "—"],
                ["Loan type", loanTypeToTableShort(model.loanType)],
                ["Status", getLoanStatusLabel(model.status)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white px-3 py-2.5 border border-slate-100 shadow-sm">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
                  <dd className="mt-0.5 text-sm text-slate-900 font-medium break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-100 bg-slate-50/50">
        <button
          type="button"
          onClick={() => setModel(null)}
          className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setModel(null)}
          className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-sm font-semibold rounded-lg text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary/40"
          style={{ backgroundColor: colors.secondary }}
        >
          Close
        </button>
      </footer>
    </div>
  </div>
)}


<DashboardTablePage
      title="Customer Applications"
      subtitle={
        loading ? "Loading..." : `Total ${filteredCustomers.length} records found`
      }
      headerRight={
        <>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              className="border border-gray-300 rounded-md pl-8 pr-2 py-2 text-sm w-[min(100vw-2rem,280px)] sm:w-64 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Search by name, ID, phone, email, app no…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search customers"
            />
          </div>
          <button
            type="button"
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Download size={16} className="mr-2" />
            Export
          </button>
        </>
      }
    >
      <AppAntTable
        rowKey={(row) => row._id || `${row.employeeId}-${row.applicationDate}`}
        columns={columns}
        dataSource={filteredCustomers}
        loading={loading}
        size="small"
        locale={{ emptyText: searchQuery.trim() ? "No customers match your search" : "No records" }}
      />
    </DashboardTablePage>


    </>

  


  );
}