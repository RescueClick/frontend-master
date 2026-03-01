import React, { useEffect, useMemo, useState } from "react";
import { Eye, Download, Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  activatePartner,
  fetchPartners,
  reassignCustomersAndDeactivatePartner,
} from "../../../feature/thunks/adminThunks";
import { getAuthData,saveAuthData } from "../../../utils/localStorage";
import axios from "axios";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import { backendurl } from "../../../feature/urldata";


const colors = {
  primary: "#12B99C",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};


export default function PartnerTable() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, data } = useSelector((state) => state.admin.partners);

  const [PartnerData, setPartnerData] = useState(null);
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);

  const [selectedPartner, setSelectedPartner] = useState(null);
  const [newPartnerId, setNewPartnerId] = useState("");

  const [PartneractiveModel, setPartneractiveModel] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  console.log(" partners : ", data);



  useEffect(() => {
    const { adminToken } = getAuthData();
    if (adminToken) {
      dispatch(fetchPartners(adminToken));
    }
  }, [dispatch]);

  const toggleActivation = (partner) => {
    if (partner.status === "ACTIVE") {
      setSelectedPartner(partner);
      setModalOpen(true);
    } else {
      // Optionally handle re-activation here
    }
  };

  const otherPartners = data.filter((p) => p._id !== selectedPartner?._id);

  const handleConfirmDeactivation = () => {
    dispatch(
      reassignCustomersAndDeactivatePartner({
        oldPartnerId: selectedPartner._id,
      })
    );

    setModalOpen(false);
    setSelectedPartner(null);
  };

  const handleCancelDeactivation = () => {
    setModalOpen(false);
    setSelectedPartner(null);
  };

  const handleExport = () => {
    // Format data before exporting
    const formattedData = data.map((user) => ({
      "First Name": user.firstName,
      "Middle Name": user.middleName || "",
      "Last Name": user.lastName,
      "Date of Birth": new Date(user.dob).toLocaleDateString(),
      Email: user.email,
      Phone: user.phone,
      Address: user.address,
      Region: user.region,
      Pincode: user.pincode,
      "Home Type": user.homeType || "",
      "Address Stability": user.addressStability || "",
      Landmark: user.landmark || "",
      "Employment Type": user.employmentType || "",
      "Bank Name": user.bankName || "",
      "Account Number": user.accountNumber || "",
      IFSC: user.ifscCode || "",
      Role: user.role,
      Status: user.status,
      "Employee ID": user.employeeId,
      "Partner Code": user.partnerCode,
      "Aadhar Number": user.aadharNumber || "",
      "PAN Number": user.panNumber || "",
      "ASM Name": user.asmName,
      "ASM Employee ID": user.asmEmployeeId,
      "RM Name": user.rmName,
      "RM Employee ID": user.rmEmployeeId,
      Documents: user.docs.map((doc) => doc.docType).join(", "), // list all doc types
    }));

    // Convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Partners");

    // Write workbook and save as Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blobData = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(blobData, "partners.xlsx");
  };

  const handlePartneractive = () => {
    dispatch(activatePartner(PartneractiveModel));
    setTimeout(() => {
      setPartneractiveModel(null);
    }, 100);
  };

  const filteredPartners = useMemo(() => {
    if (!data || data.length === 0) return [];

    console.log(JSON.stringify(data));

    const term = searchQuery.trim().toLowerCase();
    if (!term) return data;

    return data.filter((partner) => {
      const fullName = `${partner.firstName || ""} ${
        partner.middleName || ""
      } ${partner.lastName || ""}`.toLowerCase();
      const email = (partner.email || "").toLowerCase();
      const phone = (partner.phone || "").toLowerCase();
      const partnerId = (partner._id || "").toLowerCase();
      const partnerCode = (partner.partnerCode || "").toLowerCase();
      const employeeId = (partner.employeeId || "").toLowerCase();
      const rmName = (partner.rmName || "").toLowerCase();
      const rmEmployeeId = (partner.rmEmployeeId || "").toLowerCase();
      const asmName = (partner.asmName || "").toLowerCase();
      const asmEmployeeId = (partner.asmEmployeeId || "").toLowerCase();
      const rmId = (partner.rmId || "").toLowerCase();
      const asmId = (partner.asmId || "").toLowerCase();

      return (
        fullName.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        partnerId.includes(term) ||
        partnerCode.includes(term) ||
        employeeId.includes(term) ||
        rmName.includes(term) ||
        rmEmployeeId.includes(term) ||
        asmName.includes(term) ||
        asmEmployeeId.includes(term) ||
        rmId.includes(term) ||
        asmId.includes(term)
      );
    });
  }, [data, searchQuery]);

  
  const loginAsUser = async (userId, navigate) => {
    try {
      const { adminToken, asmToken, rmToken, partnerToken } = getAuthData();
      
      // Determine which token to use (prioritize current role token)
      let currentToken = adminToken || asmToken || rmToken || partnerToken;
      if (!currentToken) {
        alert("Not authenticated");
        return;
      }
  
      const res = await axios.post(
        `${backendurl}/auth/login-as/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
  
      const { token, user, parent } = res.data;
  
      // Get current user info to store as parent
      const currentAuth = getAuthData();
      let currentUser = currentAuth.adminUser || currentAuth.asmUser || currentAuth.rmUser || currentAuth.partnerUser;
      let currentUserToken = currentAuth.adminToken || currentAuth.asmToken || currentAuth.rmToken || currentAuth.partnerToken;
      
      // If parent info is provided from backend, use it; otherwise use current user
      const parentInfo = parent || (currentUser ? { ...currentUser, token: currentUserToken } : null);
  
      // Save impersonated token - this will automatically clear parent token
      saveAuthData(token, user, true, parentInfo);
  
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
loginAsUser(userId, navigate);
};


  return (
    <>
      {PartnerData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setPartnerData(null)}
          ></div>

          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-11/12 max-w-6xl overflow-y-auto max-h-[90vh] p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Partner Details
              </h2>
              <button
                onClick={() => setPartnerData(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Three-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1 - Personal Info */}
              <div className="bg-[#F8FAFC] rounded-xl p-4 shadow-sm flex flex-col gap-3 text-sm">
                <h3 className="font-semibold text-gray-700 border-b border-gray-300 pb-1 mb-2">
                  Personal Info
                </h3>
                {[
                  [
                    "Full Name",
                    `${PartnerData.firstName} ${PartnerData.middleName || ""} ${
                      PartnerData.lastName
                    }`,
                  ],
                  [
                    "DOB",
                    PartnerData.dob
                      ? new Date(PartnerData.dob).toLocaleDateString()
                      : "-",
                  ],
                  ["Phone", PartnerData.phone],
                  ["Email", PartnerData.email],
                  ["Region", PartnerData.region],
                  [
                    "Address",
                    `${PartnerData.address} (${PartnerData.landmark})`,
                  ],
                  ["Pincode", PartnerData.pincode],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between border-b border-gray-200 last:border-b-0 py-0.5"
                  >
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-800 font-semibold">{value}</span>
                  </div>
                ))}
              </div>

              {/* Column 2 - Employment & Bank Info */}
              <div className="bg-[#F8FAFC] rounded-xl p-4 shadow-sm flex flex-col gap-3 text-sm">
                <h3 className="font-semibold text-gray-700 border-b border-gray-300 pb-1 mb-2">
                  Employment & Bank Info
                </h3>
                {[
                  ["Employee ID", PartnerData.employeeId],
                  ["Partner Code", PartnerData.partnerCode],
                  ["RM", `${PartnerData.rmName} (${PartnerData.rmEmployeeId})`],
                  [
                    "ASM",
                    `${PartnerData.asmName} (${PartnerData.asmEmployeeId})`,
                  ],
                  ["Employment Type", PartnerData.employmentType],
                  [
                    "Bank",
                    `${PartnerData.bankName} | ${PartnerData.accountNumber} | ${PartnerData.ifscCode}`,
                  ],
                  ["Home Type", PartnerData.homeType],
                  [
                    "Address Stability",
                    `${PartnerData.addressStability} years`,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between border-b border-gray-200 last:border-b-0 py-0.5"
                  >
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-800 font-semibold">{value}</span>
                  </div>
                ))}
              </div>

              {/* Column 3 - Status & Codes */}
              <div className="bg-[#F8FAFC] rounded-xl p-4 shadow-sm flex flex-col gap-3 text-sm">
                <h3 className="font-semibold text-gray-700 border-b border-gray-300 pb-1 mb-2">
                  Status & Codes
                </h3>
                {[
                  ["Role", PartnerData.role],
                  ["Status", PartnerData.status],
                  ["PAN", PartnerData.panNumber],
                  ["Aadhar", PartnerData.aadharNumber],
                  ["Created At", new Date(PartnerData.createdAt).toLocaleDateString()],
                  ["Updated At", new Date(PartnerData.updatedAt).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between border-b border-gray-200 last:border-b-0 py-0.5"
                  >
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-800 font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                onClick={() => setPartnerData(null)}
                className="px-5 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-colors"
                style={{ backgroundColor: colors.primary }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="p-2"
        style={{ background: colors.background, color: colors.text }}
      >
        {/* Modal for Partner Deactivation */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">


        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Suspend Partner
          </h3>
          <p className="text-gray-700 mb-6">
            Are you sure you want to <span className="font-semibold text-red-600">suspend</span> the partner{" "}
            <span className="font-semibold">{selectedPartner?.name}</span>?<br />
            This will deactivate their account and they will not be able to log in.
          </p>
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition"
              onClick={handleCancelDeactivation}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              onClick={() => {
                handleConfirmDeactivation();
                setModalOpen(false);
                setSelectedPartner(null);
              }}
            >
              Yes, Suspend
            </button>
          </div>
        </div>
         
        </div>
      )}

        {PartneractiveModel && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-80 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Are you sure?
              </h3>
              <p className="text-gray-600 mb-5">
                Do you really want to proceed?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setPartneractiveModel(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                >
                  No
                </button>
                <button
                  onClick={() => {
                    handlePartneractive(PartneractiveModel);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#12B99C] text-white "
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
            {/* Left side - Text */}
            <div>
              <h2 className="text-lg font-medium mb-2">Partner</h2>
              <p className="text-xs mb-3">
                {loading ? "Loading..." : `Total ${data.length} records found`}
              </p>
            </div>

            {/* Right side - Export button */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  className="border border-gray-300 rounded-md pl-7 pr-2 py-2 text-sm w-100 focus:outline-none focus:ring-2 focus:ring-[#12B99C]"
                  placeholder="Search by name, RM code, or ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                onClick={() => {
                  handleExport();
                }}
              >
                <Download size={16} className="mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg shadow-sm">
          <table className="w-full border-collapse bg-white text-sm">
            <thead style={{ background: colors.primary, color: "white" }}>
              <tr>
                <th className="px-2 py-4 text-left">User Name</th>
                <th className="px-2 py-4 text-left">User ID</th>
                <th className="px-2 py-4 text-left">Contact</th>
                <th className="px-2 py-4 text-left">Created on</th>
                <th className="px-2 py-4 text-left">RM Name</th>
                <th className="px-2 py-4 text-left">Login As</th>
                <th className="px-2 py-4 text-left">Activation</th>
                <th className="px-2 py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    No partners found.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((p) => (
                  <tr key={p._id} className="border-b hover:bg-gray-50">
                    <td
                      className="px-2 py-3 align-top"
                      onClick={() =>
                        navigate("/admin/Analytics", {
                          state: { id: p._id, role: "Partner" },
                        })
                      }
                    >
                      <div>
                        <span className="font-semibold"></span> {p.firstName}{" "}
                        {p.lastName}
                      </div>
                    </td>
                    <td className="px-2 py-3 font-medium align-middle">
                      {p.employeeId || p._id}
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div>{p.phone}</div>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-2 py-3 align-middle">
                      {p.rmName || "-"}
                    </td>
                    <td className="px-2 py-3 align-middle">
                    <button
                        className="px-2 py-1 border rounded text-xs"
                        style={{
                          borderColor: colors.secondary,
                          color: colors.secondary,
                        }}
                        onClick={()=> handleLoginAs(p._id)}
                      >
                        Login
                      </button>                    </td>

                    <td className="px-2 py-3 align-middle">
                      <div
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                          p.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"
                        }`}
                        onClick={() => {
                          if (p.status === "ACTIVE") {
                            toggleActivation(p);
                          } else {
                            setPartneractiveModel(p._id);
                          }
                        }}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                            p.status === "ACTIVE"
                              ? "translate-x-6"
                              : "translate-x-0"
                          }`}
                        ></div>
                      </div>
                    </td>

                    <td className="px-2 py-3 align-middle">
                      <div className="flex items-center gap-1 h-full">
                        <button
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                          onClick={() => {
                            setPartnerData(p);
                          }}
                        >
                          <Eye size={14} />
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
    </>
  );
}
