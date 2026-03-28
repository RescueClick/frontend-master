import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Filter, Eye, Users, Phone, Download } from "lucide-react";
import { fetchAsmCustomers } from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import { useRealtimeData } from "../../../utils/useRealtimeData";
import axios from "axios"
import { useNavigate } from "react-router-dom";
import { backendurl } from "../../../feature/urldata";
import LoanStatusBadge from "../../../components/shared/LoanStatusBadge";
import AppAntTable from "../../../components/shared/AppAntTable";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";
import { getLoanStatusLabel, normalizeLoanStatus } from "../../../utils/loanStatus";
import toast from "react-hot-toast";
import { downloadXlsx } from "../../../utils/downloadXlsx";
import { loanTypeToTableShort } from "../../../utils/loanTypeShort";




const Customer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [model, setModel] = useState(null)

  const dispatch = useDispatch();
  const navigate = useNavigate()

  const { data, loading, success, error } = useSelector(
    (state) => state.asm.customers
  );

  // Real-time customer updates with 30 second polling
  useRealtimeData(fetchAsmCustomers, {
    interval: 30000, // 30 seconds
    enabled: true,
  });

  // Memoized customer data
  const customers = useMemo(() => {
    return Array.isArray(data)
      ? data.map((c) => ({
          name: c.userName,
          id: c.employeeId,
          phone: c.phone || "-",
          applicationDateRaw: c.applicationDate,
          applicationDate: new Date(c.applicationDate).toLocaleDateString(), // formatted
          loanType: c.loanType,
          loanAmount: c.loanAmount || 0,
          disburseAmount: c.disburseAmount || 0,
          status: c.status, // comes as "DISBURSED"
          customerId: c.customerId,
          _asmRow: c,
        }))
      : [];
  }, [data]);

  // Memoized filtered customers
  const filteredCustomers = useMemo(() => {
    const filtered = customers.filter((customer) => {
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        customer.name?.toLowerCase().includes(term) ||
        customer.id?.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term);

      // Normalize loan status for consistent filtering
      const normalizedStatus = normalizeLoanStatus(customer.status);
      const matchesFilter =
        filterStatus === "All" ||
        normalizedStatus?.toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesFilter;
    });
    return [...filtered].sort((a, b) => {
      const aTime = a?.applicationDateRaw ? new Date(a.applicationDateRaw).getTime() : 0;
      const bTime = b?.applicationDateRaw ? new Date(b.applicationDateRaw).getTime() : 0;
      return bTime - aTime; // newest first
    });
  }, [customers, searchTerm, filterStatus]);

  const handleExport = useCallback(() => {
    const rows = filteredCustomers.map((c) => ({
      Name: c.name || "",
      "Employee ID": c.id || "",
      Phone: c.phone || "",
      "Application Date": c.applicationDate || "",
      "Loan Type": loanTypeToTableShort(c.loanType),
      "Loan Amount": c.loanAmount ?? "",
      "Disburse Amount": c.disburseAmount ?? "",
      Status: getLoanStatusLabel(c.status) || String(c.status || ""),
    }));
    if (!downloadXlsx(rows, "asm-customers.xlsx", "Customers")) {
      toast.error("No rows to export");
    }
  }, [filteredCustomers]);

    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString();
    };


    const loginAsUser = async (userId, navigate) => {
      try {
        const { asmToken } = getAuthData();
        if (!asmToken) throw new Error("Admin not authenticated");
    
        const res = await axios.post(
          `${backendurl}/auth/login-as/${userId}`,
          {},
          { headers: { Authorization: `Bearer ${asmToken}` } }
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
    console.log(userId)
  loginAsUser(userId, navigate);
  };

  const columns = useMemo(
    () => [
      { title: "User Name", dataIndex: "name", key: "name" },
      {
        title: "User ID",
        dataIndex: "id",
        key: "id",
        render: (v) => v || "N/A",
      },
      {
        title: "Contact",
        key: "contact",
        render: (_, row) => (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone size={14} /> {row.phone}
          </div>
        ),
      },
      { title: "Application Date", dataIndex: "applicationDate", key: "ad" },
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
        render: (v) => <span className="font-semibold">{v}</span>,
      },
      {
        title: "Disburse",
        dataIndex: "disburseAmount",
        key: "da",
        render: (v) => <span className="font-semibold">{v}</span>,
      },
      {
        title: "Login As",
        key: "login",
        render: (_, row) => (
          <button
            type="button"
            className="px-2 py-1 border border-[#1E3A8A] text-[#1E3A8A] text-sm font-medium cursor-pointer rounded"
            onClick={() => loginAsUser(row.customerId, navigate)}
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
        key: "action",
        width: 72,
        render: (_, row) => (
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded"
            onClick={() => setModel(row._asmRow)}
          >
            <Eye size={16} />
          </button>
        ),
      },
    ],
    [navigate]
  );

  return (

    <>
{model && 
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 overflow-y-auto">
    <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl p-6 relative mx-4 my-8">
      
      {/* Close Button */}
      <button
        onClick={() => setModel(null)}
        className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl"
      >
        ×
      </button>

      {/* Header */}
      <h2 className="text-xl font-bold mb-6 text-center text-brand-primary">
        Customer Details
      </h2>

      {/* 3 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Personal Info */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-center">Personal Info</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Application No</p>
              <p className="font-medium text-gray-800">{model.appNo}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Application Date</p>
              <p className="font-medium text-gray-800">{formatDate(model.applicationDate)}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">User Name</p>
              <p className="font-medium text-gray-800">{model.userName}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">User ID</p>
              <p className="font-medium text-gray-800">{model.userId || "N/A"}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-medium text-gray-800">{model.phone}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{model.email}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Custromers ID</p>
              <p className="font-medium text-gray-800">{model.employeeId}</p>
            </div>
          </div>
        </div>

        {/* Management Team */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-center">Management Team</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">ASM Employee ID</p>
              <p className="font-medium text-gray-800">{model.asmEmployeeId}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">ASM Name</p>
              <p className="font-medium text-gray-800">{model.asmName}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">RM Employee ID</p>
              <p className="font-medium text-gray-800">{model.rmEmployeeId}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">RM Name</p>
              <p className="font-medium text-gray-800">{model.rmName}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Partner Employee ID</p>
              <p className="font-medium text-gray-800">{model.partnerEmployeeId}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Partner Name</p>
              <p className="font-medium text-gray-800">{model.partnerName}</p>
            </div>

          
          </div>
        </div>

        {/* Loan Info */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-center">Loan Info</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Loan Amount</p>
              <p className="font-medium text-gray-800">{model.loanAmount}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Disburse Amount</p>
              <p className="font-medium text-gray-800">{model.disburseAmount}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Loan Type</p>
              <p className="font-medium text-gray-800">
                {loanTypeToTableShort(model.loanType)}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Status</p>
              <p className="font-medium text-gray-800">{getLoanStatusLabel(model.status)}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setModel(null)}
          className="bg-[#1E3A8A] text-white px-6 py-2 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  </div>
}



    
<DashboardTablePage
      title="Customers"
      subtitle={`${filteredCustomers.length} record${filteredCustomers.length !== 1 ? "s" : ""} found`}
      toolbar={
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by name, ID, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-100 md:py-3"
              />
            </div>
            <div className="relative">
              <Filter
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="min-w-[160px] rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-8 text-sm md:py-3"
              >
                <option value="All">All Status</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="DOC_INCOMPLETE">Document Incomplete</option>
                <option value="DOC_COMPLETE">Document Complete</option>
                <option value="DOC_SUBMITTED">Document Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="AGREEMENT">Agreement</option>
                <option value="REJECTED">Rejected</option>
                <option value="DISBURSED">Disbursed</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 md:py-3"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      }
    >
      <AppAntTable
        rowKey={(row) =>
          `${row.id ?? "row"}-${row.applicationDateRaw ?? ""}-${row.customerId ?? ""}`
        }
        columns={columns}
        dataSource={filteredCustomers}
        locale={{
          emptyText: (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No customers found</h3>
              <p className="text-gray-600">Try adjusting your search or filters.</p>
            </div>
          ),
        }}
      />
    </DashboardTablePage>


    </>






  );
};

export default Customer;
