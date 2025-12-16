import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAuthData } from "../../../utils/localStorage";


import {
  User,
  FileText,
  CreditCard,
  MapPin,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MessageSquare,
  Send,
  Clock,
  Plus,
  Download,
  Camera,
  Building2,
  Receipt,
  FileImage,
  ChevronDown,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { backendurl } from "../../../feature/urldata";

const CustomerApplication = () => {
  // State for API data
  
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const location = useLocation();
  const { customerId, applicationId } = location.state || {};

  

  // Fetch application data from API
  const fetchApplicationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { rmToken } = getAuthData();
      const response = await axios.get(
        `${backendurl}/rm/customers/${customerId}/applications/${applicationId}`,
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
          },
        }
      );

     
      setApplicationData(response.data);
    } catch (err) {
      console.error("Error fetching application data:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch application data"
      );
      // Keep using static data on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchApplicationData();
  }, []);

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      if (selectedDoc?.previewUrl) {
        window.URL.revokeObjectURL(selectedDoc.previewUrl);
      }
    };
  }, [selectedDoc]);

  

  const handleView = async (doc) => {
    setPreviewLoading(true);
    try {
      const { rmToken } = getAuthData();
  
      const response = await axios.get(
        `${backendurl}/rm/applications/${applicationData._id}/docs/${doc.docType}/download`,
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
          },
          responseType: "blob",
        }
      );

      // Check if response is an error (blob with JSON error message)
      if (response.data.type === "application/json" || response.status >= 400) {
        // Try to parse error message from blob
        const text = await response.data.text();
        let errorMessage = `Failed to load ${doc.docType}`;
        try {
          const errorJson = JSON.parse(text);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          // If not JSON, use the text or default message
          if (text && text.length < 200) {
            errorMessage = text;
          }
        }
        setModalMessage(errorMessage);
        setShowModal(true);
        setSelectedDoc(null);
        return;
      }
  
      // Prefer response.headers, fallback to blob.type
      let contentType =
        response.headers["content-type"] || response.data.type || "application/octet-stream";
  
      // If axios already gives a blob, no need to wrap again
      const fileBlob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: contentType });
  
      const url = window.URL.createObjectURL(fileBlob);
  
      // Decide if preview is an image
      const isImage =
        contentType.startsWith("image/") ||
        ["photo", "selfie", "aadhar", "pan", "profile"].some((key) =>
          doc.docType?.toLowerCase().includes(key)
        );
  
      setSelectedDoc({
        ...doc,
        previewUrl: url,
        contentType,
        isImage,
      });
      setShowModal(true);
    } catch (err) {
      console.error(`Error previewing ${doc.docType}:`, err);
      console.error("Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
      });
      
      // Try to extract error message from response
      let errorMessage = `Failed to load ${doc.docType}. Please try downloading the document instead.`;
      
      if (err.response) {
        // If response is a blob (error with blob responseType), try to parse it
        if (err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            console.log("Error blob text:", text);
            
            // Try to parse as JSON
            try {
              const errorJson = JSON.parse(text);
              errorMessage = errorJson.message || errorMessage;
              if (errorJson.error) {
                errorMessage += `: ${errorJson.error}`;
              }
            } catch (parseErr) {
              // If not JSON, check if it's a readable error message
              if (text && text.length < 500 && text.trim().length > 0) {
                errorMessage = text;
              }
            }
          } catch (blobErr) {
            console.error("Error reading blob:", blobErr);
            // Fall back to status text or default message
            errorMessage = err.response.statusText || errorMessage;
          }
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.statusText) {
          errorMessage = `${err.response.status} ${err.response.statusText}`;
        }
      } else if (err.message) {
        errorMessage = `${err.message}. Please try downloading the document instead.`;
      }
      
      setModalMessage(errorMessage);
      setShowModal(true);
      setSelectedDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",

      currency: "INR",

      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",

      month: "short",

      day: "numeric",

      hour: "2-digit",

      minute: "2-digit",
    });
  };

  const [docs, setDocs] = useState([]);

  // Update docs when applicationData changes
  useEffect(() => {
    if (applicationData && applicationData.docs) {
      setDocs(applicationData.docs);
    }
  }, [applicationData]);

  const [expandedDocs, setExpandedDocs] = useState(false);

  const [approvalAmount, setApprovalAmount] = useState("");

  const handleApprovalSubmit = async () => {
    if (!approvalAmount || approvalAmount <= 0) {
      alert("Please enter a valid approval amount");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { rmToken } = getAuthData();

      const response = await axios.post(
        `${backendurl}/rm/applications/${applicationData._id}/transition`,
        {
          to: "DISBURSED",
          note: "Disbursing approved loan to customer",
          approvedLoanAmount: parseInt(approvalAmount),
        },
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

     

      // Update local state
      setSubmittedStatus((prev) => ({
        ...prev,
        approvedLoanAmount: approvalAmount,
      }));

      // Clear form
      setApprovalAmount("");

      // Show success message
      alert(`Approval amount of ₹${approvalAmount} saved successfully!`);
    } catch (err) {
      console.error("Error saving approval amount:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save approval amount"
      );
      alert(
        `Error: ${
          err.response?.data?.message ||
          err.message ||
          "Failed to save approval amount"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    setDownloading(true);
    try {
      const { rmToken } = getAuthData();
      const response = await axios.get(
        `${backendurl}/rm/applications/${applicationData._id}/docs/${doc.docType}/download`,
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
          },
          responseType: "blob", // Important for file downloads
        }
      );

      // Get file extension from Content-Type header
      const contentType = response.headers["content-type"];
      let fileExtension = ".pdf"; // default fallback

      if (contentType) {
        if (
          contentType.includes("image/jpeg") ||
          contentType.includes("image/jpg")
        ) {
          fileExtension = ".jpg";
        } else if (contentType.includes("image/png")) {
          fileExtension = ".png";
        } else if (contentType.includes("image/gif")) {
          fileExtension = ".gif";
        } else if (contentType.includes("image/webp")) {
          fileExtension = ".webp";
        } else if (contentType.includes("application/pdf")) {
          fileExtension = ".pdf";
        } else if (contentType.includes("text/plain")) {
          fileExtension = ".txt";
        } else if (contentType.includes("application/msword")) {
          fileExtension = ".doc";
        } else if (
          contentType.includes(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          )
        ) {
          fileExtension = ".docx";
        }
      } else {
        // If no content-type header, try to detect from file content
        const blob = new Blob([response.data]);
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Check file signatures (magic numbers)
        if (uint8Array.length >= 4) {
          // PNG signature: 89 50 4E 47
          if (
            uint8Array[0] === 0x89 &&
            uint8Array[1] === 0x50 &&
            uint8Array[2] === 0x4e &&
            uint8Array[3] === 0x47
          ) {
            fileExtension = ".png";
          }
          // JPEG signature: FF D8 FF
          else if (
            uint8Array[0] === 0xff &&
            uint8Array[1] === 0xd8 &&
            uint8Array[2] === 0xff
          ) {
            fileExtension = ".jpg";
          }
          // PDF signature: 25 50 44 46 (%PDF)
          else if (
            uint8Array[0] === 0x25 &&
            uint8Array[1] === 0x50 &&
            uint8Array[2] === 0x44 &&
            uint8Array[3] === 0x46
          ) {
            fileExtension = ".pdf";
          }
          // GIF signature: 47 49 46 38 (GIF8)
          else if (
            uint8Array[0] === 0x47 &&
            uint8Array[1] === 0x49 &&
            uint8Array[2] === 0x46 &&
            uint8Array[3] === 0x38
          ) {
            fileExtension = ".gif";
          }
        }
      }

      // Try to get filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${doc.docType}_${applicationData.appNo}${fileExtension}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // Create a download link with proper extension
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Error downloading ${doc.docType}:`, err);
      console.error("Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
      });
      
      // Try to extract error message from response
      let errorMessage = `Failed to download ${doc.docType}`;
      
      if (err.response) {
        // If response is a blob (error with blob responseType), try to parse it
        if (err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            console.log("Error blob text:", text);
            
            // Try to parse as JSON
            try {
              const errorJson = JSON.parse(text);
              errorMessage = errorJson.message || errorMessage;
              if (errorJson.error) {
                errorMessage += `: ${errorJson.error}`;
              }
            } catch (parseErr) {
              // If not JSON, check if it's a readable error message
              if (text && text.length < 500 && text.trim().length > 0) {
                errorMessage = text;
              }
            }
          } catch (blobErr) {
            console.error("Error reading blob:", blobErr);
            // Fall back to status text or default message
            errorMessage = err.response.statusText || errorMessage;
          }
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.statusText) {
          errorMessage = `${err.response.status} ${err.response.statusText}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      const { rmToken } = getAuthData();
      const response = await axios.get(
        `${backendurl}/rm/applications/${applicationData._id}/docs/download-all`,
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
          },
          responseType: "blob", // Important for file downloads
        }
      );

      // Try to get filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `All_Documents_${applicationData.appNo}.zip`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // Create a download link for all documents
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

     
    } catch (err) {
      console.error("Error downloading all documents:", err);
      alert("Failed to download all documents");
    } finally {
      setDownloading(false);
    }
  };

  // status

  const [status, setStatus] = useState("SUBMITTED");

  const [remark, setRemark] = useState("");

  const [submittedStatus, setSubmittedStatus] = useState(null);

  const statusColors = {
    KYC_PENDING: "bg-orange-100 text-orange-700 border border-orange-300",
    KYC_COMPLETE: "bg-emerald-100 text-emerald-700 border border-emerald-300",
    UNDER_REVIEW: "bg-indigo-100 text-indigo-700 border border-indigo-300",
    IN_PROCESS: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    SUBMITTED: "bg-blue-100 text-blue-700 border border-blue-300",
    APPROVED: "bg-green-100 text-green-700 border border-green-300",
    AGREEMENT: "bg-cyan-100 text-cyan-700 border border-cyan-300",
    DISBURSED: "bg-purple-100 text-purple-700 border border-purple-300",
    REJECTED: "bg-red-100 text-red-700 border border-red-300",
  };

  const getDocStatusColor = (status) => {
    switch (status) {
      case "VERIFIED":
        return "bg-green-100 text-green-800 border-green-200";

      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";

      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";

      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDocStatusIcon = (status) => {
    switch (status) {
      case "VERIFIED":
        return <CheckCircle className="w-4 h-4" />;

      case "PENDING":
        return <Clock className="w-4 h-4" />;

      case "REJECTED":
        return <AlertCircle className="w-4 h-4" />;

      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validation
      if (!status) {
        alert("Please select a status");
        setLoading(false);
        return;
      }

      if (!remark.trim()) {
        alert("Please add a remark");
        setLoading(false);
        return;
      }

      if (status === "DISBURSED" && (!approvalAmount || approvalAmount <= 0)) {
        alert("Please enter a valid approval amount for DISBURSED status");
        setLoading(false);
        return;
      }

      const { rmToken } = getAuthData();

      // Prepare the request body
      const requestBody = {
        to: status,
        note: remark,
      };

      // Add approvedLoanAmount only if status is DISBURSED
      if (status === "DISBURSED" && approvalAmount) {
        requestBody.approvedLoanAmount = parseInt(approvalAmount);
      }

      const response = await axios.post(
        `${backendurl}/rm/applications/${applicationData._id}/transition`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

     

      // Update local state
      setSubmittedStatus({
        status,
        remark,
        approvedLoanAmount: approvalAmount,
      });

      // Clear form
      setRemark("");
      setApprovalAmount("");

      // Show success message
      alert(`Application status updated to ${status} successfully!`);

      // Optionally refresh the application data
      // fetchApplicationData();
    } catch (err) {
      console.error("Error updating application status:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update application status"
      );
      alert(
        `Error: ${
          err.response?.data?.message ||
          err.message ||
          "Failed to update application status"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "KYC_PENDING":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "KYC_COMPLETE":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "UNDER_REVIEW":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "IN_PROCESS":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "AGREEMENT":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "DISBURSED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Don't render anything if no data and still loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#12B99C]"></div>
            <span className="text-gray-700 text-lg">
              Loading application data...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if there's an error and no data
  if (error && !applicationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Application
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchApplicationData}
            className="px-6 py-2 bg-[#12B99C] text-white rounded-lg hover:bg-[#0FA485] transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Don't render anything if no data
  if (!applicationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Application Data
          </h2>
          <p className="text-gray-600">Application data not available</p>
        </div>
      </div>
    );
  }

  
// Define field groups
// const fieldGroups = {
//   PERSONAL: [
//     { label: "Company Name", value: (data) => data?.employmentInfo?.companyName },
//     { label: "Company Address", value: (data) => data?.employmentInfo?.companyAddress },
//     { label: "Designation", value: (data) => data?.employmentInfo?.designation },
//     { label: "Monthly Salary", value: (data) => data?.employmentInfo?.monthlySalary },
//     { label: "Salary In Hand", value: (data) => data?.employmentInfo?.salaryInHand },
//     { label: "Total Experience", value: (data) => data?.employmentInfo?.totalExperience },
//     { label: "Current Experience", value: (data) => data?.employmentInfo?.currentExperience },
//   ],
//   BUSINESS: [
//     { label: "Business Name", value: (data) => data?.businessInfo?.businessName },
//     { label: "Business Address", value: (data) => data?.businessInfo?.businessAddress },
//     { label: "Landmark", value: (data) => data?.businessInfo?.businessLandmark },
//     { label: "Business Vintage", value: (data) => data?.businessInfo?.businessVintage },
//     { label: "GST Number", value: (data) => data?.businessInfo?.gstNumber },
//     { label: "Annual Turnover (INR)", value: (data) => data?.businessInfo?.annualTurnoverInINR },
//     { label: "Years in Business", value: (data) => data?.businessInfo?.yearsInBusiness },
//   ],
// };

// ================== CUSTOMER FIELDS ==================
const customerFields = [
  { label: "Full Name", value: (c) => `${c.firstName || ""} ${c.middleName || ""} ${c.lastName || ""}`.trim() },
  { label: "Email", value: (c) => c.email },
  { label: "Official Email", value: (c) => c.officialEmail },
  { label: "Phone", value: (c) => c.phone },
  { label: "Alternate Phone", value: (c) => c.alternatePhone },
  { label: "Mother's Name", value: (c) => c.mothersName },
  { label: "PAN Number", value: (c) => c.panNumber },
  { label: "Date of Birth", value: (c) => c.dateOfBirth ? new Date(c.dateOfBirth).toLocaleDateString() : "N/A" },
  { label: "Gender", value: (c) => c.gender },
  { label: "Marital Status", value: (c) => c.maritalStatus },
  { label: "Spouse Name", value: (c) => c.spouseName },
  { label: "Loan Amount", value: (c) => c.loanAmount },
  { label: "Current Address", value: (c) => c.currentAddress },
  { label: "Current Address Landmark", value: (c) => c.currentAddressLandmark },
  { label: "Current Address Pin", value: (c) => c.currentAddressPinCode },
  { label: "Current House Status", value: (c) => c.currentAddressHouseStatus },
  { label: "Stability of Residency", value: (c) => c.stabilityOfResidency },
  { label: "Permanent Address", value: (c) => c.permanentAddress },
  { label: "Permanent Landmark", value: (c) => c.permanentAddressLandmark },
  { label: "Permanent Pin", value: (c) => c.permanentAddressPinCode },
  { label: "Permanent House Status", value: (c) => c.permanentAddressHouseStatus },
  { label: "Permanent Stability", value: (c) => c.permanentAddressStability },
];

// ================== EMPLOYMENT FIELDS ==================
const employmentFields = [
  { label: "Company Name", value: (e) => e?.companyName },
  { label: "Designation", value: (e) => e?.designation },
  { label: "Company Address", value: (e) => e?.companyAddress },
  { label: "Monthly Salary", value: (e) => e?.monthlySalary },
  { label: "Salary In Hand", value: (e) => e?.salaryInHand },
  { label: "Total Experience", value: (e) => e?.totalExperience },
  { label: "Current Experience", value: (e) => e?.currentExperience },
];

// ================== BUSINESS FIELDS ==================
const businessFields = [
  { label: "Business Name", value: (b) => b?.businessName },
  { label: "Business Address", value: (b) => b?.businessAddress },
  { label: "Landmark", value: (b) => b?.businessLandmark },
  { label: "Business Vintage", value: (b) => b?.businessVintage },
  { label: "GST Number", value: (b) => b?.gstNumber },
  { label: "Annual Turnover (INR)", value: (b) => b?.annualTurnoverInINR },
  { label: "Years in Business", value: (b) => b?.yearsInBusiness },
];



// Renderer for dynamic fields
// const renderDynamicFields = (loanType, applicationData) => {
//   const fields = fieldGroups[loanType] || [];
//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//       {fields.map((field, idx) => (
//         <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
//           <p className="text-sm font-medium text-gray-500 mb-2">{field.label}</p>
//           <p className="font-bold text-gray-900">
//             {field.value(applicationData) || "N/A"}
//           </p>
//         </div>
//       ))}
//     </div>
//   );
// };

// Generic renderer for any field group
const renderFields = (fields, data) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {fields.map((field, idx) => (
      <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-500 mb-1">{field.label}</p>
        <p className="font-bold text-gray-900">{field.value(data) || "N/A"}</p>
      </div>
    ))}
  </div>
);

const renderReferences = (references = []) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {references.map((ref, idx) => (
      <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-500 mb-1">Reference {idx + 1}</p>
        <p className="font-bold text-gray-900">{ref.name || "N/A"}</p>
        <p className="text-gray-600">{ref.phone || "N/A"}</p>
      </div>
    ))}
  </div>
);


  return (
    <>
      {/* Error message banner */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40 z-50">
          <div className="bg-white rounded-xl p-6 w-[800px] max-h-[90vh] shadow-lg overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedDoc ? selectedDoc.docType : "Document Preview"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  // Clean up preview URL to prevent memory leaks
                  if (selectedDoc?.previewUrl) {
                    window.URL.revokeObjectURL(selectedDoc.previewUrl);
                  }
                  setSelectedDoc(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {selectedDoc ? (
              <div className="space-y-4">
                {/* Document Preview */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Document Type: {selectedDoc.docType}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getDocStatusColor(
                        selectedDoc.status
                      )}`}
                    >
                      {selectedDoc.status}
                    </span>
                  </div>

                  {/* Loading state */}
                  {previewLoading && (
                    <div className="w-full h-96 flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#12B99C] mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading preview...</p>
                      </div>
                    </div>
                  )}

                  {/* Document Preview */}
                  {!previewLoading && selectedDoc.previewUrl && (
                    <div className="w-full h-96 border rounded overflow-hidden bg-gray-50">
                      {selectedDoc.isImage ? (
                        // Image preview
                        <img
                          src={selectedDoc.previewUrl}
                          alt={`Preview of ${selectedDoc.docType}`}
                          className="w-full h-full object-contain bg-white"
                          onError={(e) => {
                            console.error("Image preview failed:", e);
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : (
                        // PDF or other document preview
                        <iframe
                          src={selectedDoc.previewUrl}
                          className="w-full h-full bg-white"
                          title={`Preview of ${selectedDoc.docType}`}
                          onError={(e) => {
                            console.error("Iframe preview failed:", e);
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      )}

                      {/* Fallback message */}
                      <div
                        className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500"
                        style={{ display: "none" }}
                      >
                        <div className="text-center">
                          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-lg font-medium">
                            Preview not available
                          </p>
                          <p className="text-sm">
                            Click Download to view the document
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Content Type: {selectedDoc.contentType || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => handleDownload(selectedDoc)}
                    className="px-4 py-2 bg-[#12B99C] text-white rounded-lg hover:bg-[#0FA485] transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      if (selectedDoc?.previewUrl) {
                        window.URL.revokeObjectURL(selectedDoc.previewUrl);
                      }
                      setSelectedDoc(null);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">{modalMessage}</p>
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-4 px-4 py-2 bg-[#12B99C] text-white rounded-lg hover:bg-[#0FA485] transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Enhanced Header with Gradient */}

            <div className="bg-gradient-to-r from-[#12B99C] to-[#0FA485] px-6 sm:px-8 py-6 sm:py-8">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="text-white">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                    Loan Application #{applicationData.appNo}
                  </h1>

                  <p className="text-teal-100 text-sm sm:text-base opacity-90">
                    Application ID: {applicationData._id}
                  </p>
                </div>

                <div className="text-white text-right">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                    <p className="text-sm font-medium opacity-90 mb-1">
                      Applied Date
                    </p>

                    <div className="flex items-center justify-end">
                      <Clock className="w-4 h-4 mr-2" />

                      <span className="text-sm font-semibold">
                        {formatDate(applicationData.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}

            <div className="p-6 sm:p-8">
              {/* Customer, Partner, Loan Summary Grid */}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Customer Information */}

                <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="p-2 rounded-lg bg-[#12B99C]/10">
                      <User className="w-6 h-6 text-[#12B99C]" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 ml-3">
                      Customer Details
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Full Name
                      </p>

                      <p className="font-semibold text-gray-900">
                        {applicationData.customer?.firstName
                          ? `${applicationData.customer.firstName} ${
                              applicationData.customer.lastName || ""
                            }`.trim()
                          : applicationData.customer?.name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Email Address
                      </p>

                      <p className="font-medium text-gray-700 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-[#12B99C]" />

                        {applicationData.customer?.email || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Phone Number
                      </p>

                      <p className="font-medium text-gray-700 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-[#12B99C]" />

                        {applicationData.customer?.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Partner Information */}

                <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <User className="w-6 h-6 text-amber-600" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 ml-3">
                      Partner Details
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Partner Name
                      </p>

                      <p className="font-semibold text-gray-900">
                        {applicationData.partnerId?.firstName ||
                          applicationData.partner?.firstName ||
                          "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Email Address
                      </p>

                      <p className="font-medium text-gray-700 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-amber-600" />

                        {applicationData.partnerId?.email ||
                          applicationData.partner?.email ||
                          "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Phone Number
                      </p>

                      <p className="font-medium text-gray-700 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-amber-600" />

                        {applicationData.partnerId?.phone ||
                          applicationData.partner?.phone ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Loan Summary */}

                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 ml-3">
                      Loan Summary
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Loan Type
                      </p>

                      <p className="font-semibold text-gray-900">
                        {applicationData.loanType ||
                          applicationData.loan?.type ||
                          "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Loan Amount
                      </p>

                      <p className="font-bold text-3xl text-[#12B99C]">
                        {formatCurrency(
                          applicationData.customer?.loanAmount ||
                            applicationData.loan?.amount ||
                            0
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Tenure
                        </p>

                        <p className="font-semibold text-gray-900">
  {applicationData.loan?.tenorMonths || 'N/A'} months
</p>



                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Interest Rate
                        </p>

                        <p className="font-semibold text-gray-900">
                          {applicationData.loan?.roiPercent || 'N/A'}%
                        </p>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Details */}



{/* Customer Section */}
<div className="mb-8 bg-gradient-to-r from-slate-50 to-white rounded-xl p-6 border border-gray-100">
  <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Details</h2>
  {renderFields(customerFields, applicationData.customer)}
</div>

{/* Loan Type Conditional Section */}
<div className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-gray-100">
  <h2 className="text-xl font-bold text-gray-900 mb-4">
    {applicationData.loanType === "PERSONAL" ? "Employment Information" : "Business Information"}
  </h2>
  {applicationData.loanType === "PERSONAL"
    ? renderFields(employmentFields, applicationData.employmentInfo)
    : renderFields(businessFields, applicationData.businessInfo)}
</div>

{/* References Section */}
<div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-gray-100">
  <h2 className="text-xl font-bold text-gray-900 mb-4">References</h2>
  {renderReferences(applicationData.references)}
</div>

{/* Co-Applicant Section (only if Female + Business loan) */}
{applicationData.customer?.gender === "Female" &&
  applicationData.loanType === "BUSINESS" &&
  applicationData.coApplicant && (
    <div className="mb-8 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Co-Applicant Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
          <p className="font-bold text-gray-900">
            {applicationData.coApplicant.phone || "N/A"}
          </p>
        </div>
      </div>
    </div>
  )}


              {/* Address Information */}

              <div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 ml-3">
                    Address Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                      Current Address
                    </p>

                    <p className="font-medium text-gray-900 mb-2">
                      {applicationData.customer?.currentAddress ||
                        applicationData.product?.currentAddress ||
                        applicationData.loan?.currentAddress ||
                        "N/A"}
                    </p>

                    <p className="text-sm text-gray-600">
                      PIN:{" "}
                      <span className="font-medium">
                        {applicationData?.customer?.currentAddressPinCode || "N/A"}
                      </span>
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                      Permanent Address
                    </p>

                    <p className="font-medium text-gray-900 mb-2">
                      {applicationData.customer?.permanentAddress ||
                        applicationData.product?.permanentAddress ||
                        applicationData.loan?.permanentAddress ||
                        "N/A"}
                    </p>

                    <p className="text-sm text-gray-600">
                      PIN:{" "}
                      <span className="font-medium">
                        {applicationData.customer?.permanentAddressPinCode || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Documents Section */}

              <div className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 ml-3">
                      Document Portfolio
                    </h2>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 transition-all duration-300">
                  {docs.map((doc, index) => {
                    // Map document types to appropriate icons
                    const getDocIcon = (docType) => {
                      const docTypeLower = docType?.toLowerCase() || "";
                      if (docTypeLower.includes("pan")) return FileText;
                      if (docTypeLower.includes("aadhar")) return FileText;
                      if (docTypeLower.includes("salary")) return Receipt;
                      if (docTypeLower.includes("address")) return Building2;
                      if (docTypeLower.includes("bank")) return CreditCard;
                      if (
                        docTypeLower.includes("photo") ||
                        docTypeLower.includes("selfie")
                      )
                        return Camera;
                      if (docTypeLower.includes("agreement")) return FileText;
                      if (docTypeLower.includes("receipt")) return Receipt;
                      if (docTypeLower.includes("deed")) return FileText;
                      if (docTypeLower.includes("allotment")) return FileText;
                      return FileText;
                    };

                    const IconComponent = getDocIcon(doc.docType);

                    return (
                      <div
                        key={index}
                        className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-orange-100 transition-colors">
                              <IconComponent className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors" />
                            </div>

                            <div className="ml-3">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {doc.docType || "Document"}
                              </h3>

                              {/* <p className="text-xs text-gray-500">
                                {doc.size || "Unknown size"}
                              </p> */}
                            </div>
                          </div>

                          {/* <div
                            className={`flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getDocStatusColor(
                              doc.status
                            )}`}
                          >
                            {getDocStatusIcon(doc.status)}
                            <span className="ml-1">{doc.status}</span>
                          </div> */}
                        </div>

                        <p className="text-xs text-gray-500 mb-4 truncate">
                          {doc.url ? doc.url.split(/[\\\/]/).pop() : "No file"}
                        </p>

                        {/* Action buttons (Download + View) */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloading}
                            className="w-1/2 flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#12B99C] to-[#0FA485] rounded-lg hover:from-[#0ea889] hover:to-[#0d8a73] transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {downloading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            {downloading ? "Downloading..." : "Download"}
                          </button>

                          <button
                            onClick={() => handleView(doc)}
                            disabled={previewLoading}
                            className="w-1/2 flex items-center justify-center px-3 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {previewLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                            ) : (
                              "View"
                            )}
                            {/* {previewLoading ? "Loading..." : "View"} */}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Download All Button */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleDownloadAll}
                    disabled={downloading}
                    className="flex items-center px-6 py-3 text-sm font-semibold text-white rounded-xl hover:shadow-xl bg-gradient-to-r from-[#12B99C] to-[#0FA485] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Download className="w-5 h-5 mr-2" />
                    )}
                    {downloading
                      ? "Downloading All..."
                      : "Download All Documents"}
                  </button>
                </div>
              </div>

              {/* Enhanced Stage History */}

              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 ml-3">
                    Application Management
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Update Application Status
                    </h3>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Select New Status
                      </label>

                      <select
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#12B99C] focus:border-transparent transition-all duration-300"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="">Select Status</option>
                        <option value="SUBMITTED">SUBMITTED</option>
                        <option value="DOC_INCOMPLETE">DOC_INCOMPLETE</option>
                        <option value="DOC_COMPLETE">DOC_COMPLETE</option>
                        <option value="DOC_SUBMITTED">SUBMITTED</option>
                        <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="AGREEMENT">AGREEMENT</option>
                        <option value="DISBURSED">DISBURSED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Add Remark
                      </label>

                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />

                        <textarea
                          placeholder="Enter your remarks here..."
                          className="w-full border border-gray-300 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#12B99C] focus:border-transparent transition-all duration-300 resize-none h-20"
                          value={remark}
                          onChange={(e) => setRemark(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Approval Amount Field - Only show when DISBURSED is selected */}
                    {status === "DISBURSED" && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Approved Loan Amount (₹) *
                        </label>
                        <input
                          type="number"
                          placeholder="Enter approved loan amount"
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#12B99C] focus:border-transparent transition-all duration-300"
                          value={approvalAmount}
                          onChange={(e) => setApprovalAmount(e.target.value)}
                          min="0"
                          required
                        />
                      </div>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full flex items-center justify-center bg-gradient-to-r from-[#12B99C] to-[#0FA485] text-white py-3 px-6 rounded-xl shadow-lg hover:from-[#0ea889] hover:to-[#0d8a73] transition-all duration-300 hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Send className="w-5 h-5 mr-2" />
                      )}
                      {loading ? "Updating..." : "Update Application Status"}
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                      Current Status
                    </h3>

                    <div className="space-y-4">
                      {submittedStatus ? (
                        <div className="space-y-3">
                          {/* Status Display */}
                          <div
                            className={`inline-flex items-center px-4 py-2 rounded-xl font-semibold text-sm ${
                              statusColors[submittedStatus.status]
                            }`}
                          >
                            {submittedStatus.status}
                          </div>

                          {/* Remark Display */}
                          {submittedStatus.remark && (
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Latest Remark:
                              </p>
                              <p className="text-gray-600">
                                {submittedStatus.remark}
                              </p>
                            </div>
                          )}

                          {/* Approved Amount Display */}
                          {submittedStatus.approvedLoanAmount && (
                            <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                              <p className="text-sm font-medium text-green-700 mb-1">
                                Approved Loan Amount:
                              </p>
                              <p className="text-green-800 font-semibold text-lg">
                                ₹
                                {formatCurrency(
                                  submittedStatus.approvedLoanAmount
                                )}
                              </p>
                            </div>
                          )}

                          {/* Extra Input + Button ONLY when DISBURSED */}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">
                            Current Status: {applicationData.status || "N/A"}
                          </p>
                          <p className="text-gray-500 font-medium">
                            Approved Loan Amount: {applicationData.approvedLoanAmount || "N/A"}
                          </p>
                        
                          {applicationData.stageHistory && applicationData.stageHistory.length > 0 && (
                            <div className="mt-4 text-left">
                              <p className="text-sm font-medium text-gray-700 mb-2">Stage History:</p>
                              <div className="space-y-2">
                                {applicationData.stageHistory.map((stage, index) => (
                                  <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                    <span className="font-medium">{stage.from} → {stage.to}</span>
                                    <br />
                                    <span>{stage.note} - {new Date(stage.at).toLocaleDateString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerApplication;






// {applicationData.loanType === "PERSONAL" ? (
//   <div className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-gray-100 ">
//     <div className="flex items-center mb-6">
//       <div className="p-2 rounded-lg bg-emerald-100">
//         <MapPin className="w-6 h-6 text-emerald-600" />
//       </div>

//       <h2 className="text-xl font-bold text-gray-900 ml-3">
//         Company Information
//       </h2>
//     </div>

//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//       {/* Company Name */}

//       <div className="bg-white rounded-lg p-5 shadow-sm">
//         <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//           <MapPin className="w-4 h-4 mr-2 text-emerald-600" />
//           Company Name
//         </p>

//         <p className="font-medium text-gray-900 mb-2">
//           {applicationData.employmentInfo?.companyName ||
          
//             "N/A"}
//         </p>
//       </div>

//       {/* Company Address */}

//       <div className="bg-white rounded-lg p-5 shadow-sm">
//         <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//           <MapPin className="w-4 h-4 mr-2 text-emerald-600" />
//           Company Address
//         </p>

//         <p className="font-medium text-gray-900 mb-2">
//           {applicationData.employmentInfo?.companyAddress ||
       
//             "N/A"}
//         </p>
// {/* 
//         <p className="text-sm text-gray-600">
//           PIN:{" "}
//           <span className="font-medium">
//             {applicationData.employmentInfo?.permanentPin || "N/A"}
//           </span>
//         </p> */}
//       </div>
//     </div>

//     {/* ✅ One row for Experience & Designation */}

//     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Total Experience
//         </p>

//         <p className="font-bold text-gray-900">
//           {
//             applicationData.employmentInfo?.totalExperience ||
        
//             "N/A"}{" "}
//           years
//         </p>
//       </div>

//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Current Experience
//         </p>

//         <p className="font-bold text-gray-900">
//           {applicationData?.employmentInfo?.currentExperience ??
//             "N/A"}
//         </p>
//       </div>

//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Current Designation
//         </p>

//         <p className="font-bold text-gray-900">
//           {
//             applicationData.employmentInfo?.designation ||
 
//             "N/A"}
//         </p>
//       </div>
//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Monthly Salary
//         </p>

//         <p className="font-bold text-gray-900">
//           {
//             applicationData.employmentInfo?.monthlySalary ||
 
//             "N/A"}
//         </p>
//       </div>
//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Salary In Hand
//         </p>

//         <p className="font-bold text-gray-900">
//           {
//             applicationData.employmentInfo?.salaryInHand ||
 
//             "N/A"}
//         </p>
//       </div>
//     </div>
//   </div>
// ) : (
//   <div className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-gray-100 ">
//     <div className="flex items-center mb-6">
//       <div className="p-2 rounded-lg bg-emerald-100">
//         <MapPin className="w-6 h-6 text-emerald-600" />
//       </div>

//       <h2 className="text-xl font-bold text-gray-900 ml-3">
//         Bussiness Information
//       </h2>
//     </div>

//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//       {/* Company Name */}

//       <div className="bg-white rounded-lg p-5 shadow-sm">
//         <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//           <MapPin className="w-4 h-4 mr-2 text-emerald-600" />
//           Business Name
//         </p>

//         <p className="font-medium text-gray-900 mb-2">
//           {applicationData.product?.companyName ||
//             applicationData.employmentInfo?.companyName ||
//             applicationData.loan?.currentAddress ||
//             "N/A"}
//         </p>
//       </div>

//       {/* Company Address */}

//       <div className="bg-white rounded-lg p-5 shadow-sm">
//         <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//           <MapPin className="w-4 h-4 mr-2 text-emerald-600" />
//           Company Address
//         </p>

//         <p className="font-medium text-gray-900 mb-2">
//           {applicationData.product?.currentAddress ||
//             applicationData.employmentInfo?.companyAddress ||
//             applicationData.loan?.permanentAddress ||
//             "N/A"}
//         </p>

//         <p className="text-sm text-gray-600">
//           PIN:{" "}
//           <span className="font-medium">
//             {applicationData.loan?.permanentPin || "N/A"}
//           </span>
//         </p>
//       </div>
//     </div>

//     {/* ✅ One row for Experience & Designation */}

//     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Total Experience
//         </p>

//         <p className="font-bold text-gray-900">
//           {applicationData.product?.totalExperience ||
//             applicationData.employmentInfo?.totalExperience ||
//             applicationData.loan?.totalExperience ||
//             "N/A"}{" "}
//           years
//         </p>
//       </div>

//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Current Experience
//         </p>

//         <p className="font-bold text-gray-900">
//           {applicationData?.employmentInfo?.currentExperience ??
//             "N/A"}
//         </p>
//       </div>

//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Current Designation
//         </p>

//         <p className="font-bold text-gray-900">
//           {applicationData.product?.designation ||
//             applicationData.employmentInfo?.designation ||
//             applicationData.loan?.currentDesignation ||
//             "N/A"}
//         </p>
//       </div>
//     </div>
//   </div>
// )}