import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { getAuthData } from "../../../utils/localStorage";
import toast from "react-hot-toast";
import {
  User,
  FileText,
  CreditCard,
  MapPin,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Send,
  Plus,
  Download,
  Camera,
  Building2,
  Receipt,
  FileImage,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Copy,
  Check,
  KeyRound,
  ExternalLink,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Maximize,
  Clock,
  Search,
  X
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { backendurl } from "../../../feature/urldata";
import { fetchRsmApplication, transitionRsmApplication } from "../../../feature/thunks/rsmThunks";
import { useDispatch } from "react-redux";
import { getLoanStatusLabel } from "../../../utils/loanStatus";
import LoanStatusBadge from "../../../components/shared/LoanStatusBadge";
import BankRmResultsTable from "../../../components/shared/BankRmResultsTable";

// ================== FIELD DEFINITIONS (Outside component) ==================
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

const employmentFields = [
  { label: "Company Name", value: (e) => e?.companyName },
  { label: "Designation", value: (e) => e?.designation },
  { label: "Company Address", value: (e) => e?.companyAddress },
  { label: "Monthly Salary", value: (e) => e?.monthlySalary },
  { label: "Salary In Hand", value: (e) => e?.salaryInHand },
  { label: "Total Experience", value: (e) => e?.totalExperience },
  { label: "Current Experience", value: (e) => e?.currentExperience },
];

const businessFields = [
  { label: "Business Name", value: (b) => b?.businessName },
  { label: "Business Address", value: (b) => b?.businessAddress },
  { label: "Landmark", value: (b) => b?.businessLandmark },
  { label: "Business Vintage", value: (b) => b?.businessVintage },
  { label: "GST Number", value: (b) => b?.gstNumber },
  { label: "Annual Turnover (INR)", value: (b) => b?.annualTurnoverInINR },
  { label: "Years in Business", value: (b) => b?.yearsInBusiness },
];

const toIndianWords = (num) => {
  if (isNaN(num) || num <= 0) return "";
  const n = Math.floor(num);
  if (n === 0) return "Zero Rupees";

  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatGroup = (v) => {
    let s = "";
    if (v >= 100) {
      s += units[Math.floor(v / 100)] + " Hundred ";
      v %= 100;
    }
    if (v >= 20) {
      s += tens[Math.floor(v / 10)] + " ";
      v %= 10;
    }
    if (v > 0) {
      s += units[v] + " ";
    }
    return s.trim();
  };

  let res = "";
  let crores = Math.floor(n / 10000000);
  let remaining = n % 10000000;
  let lakhs = Math.floor(remaining / 100000);
  remaining %= 100000;
  let thousands = Math.floor(remaining / 1000);
  remaining %= 1000;
  let hundreds = remaining;

  if (crores > 0) {
    res += formatGroup(crores) + " Crore ";
  }
  if (lakhs > 0) {
    res += formatGroup(lakhs) + " Lakh ";
  }
  if (thousands > 0) {
    res += formatGroup(thousands) + " Thousand ";
  }
  if (hundreds > 0) {
    res += formatGroup(hundreds) + " ";
  }

  return res.trim() + " Rupees Only";
};

const RsmApplicationView = () => {
  const [applicationData, setApplicationData] = useState(null);
  const [requiredDocRules, setRequiredDocRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [previewLoadingDoc, setPreviewLoadingDoc] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  // Document Viewer State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const imageContainerRef = useRef(null);
  
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Allow native scrolling (panning) if Ctrl is not held
      if (!e.ctrlKey && !e.metaKey) return;
      
      e.preventDefault();
      
      const now = Date.now();
      if (now - (window.lastZoomTime || 0) < 50) return; 
      window.lastZoomTime = now;
      
      const direction = Math.sign(e.deltaY);
      setZoomLevel(prev => {
        const step = 0.1; 
        let nextZoom = direction < 0 ? prev + step : prev - step;
        return Math.min(Math.max(nextZoom, 0.1), 5); 
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [showModal, selectedDoc, previewLoadingDoc]);
  
  const [status, setStatus] = useState("");
  const [remark, setRemark] = useState("");
  const [approvalAmount, setApprovalAmount] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(null);
  
  // Bank Matcher State
  const [eligibleBanks, setEligibleBanks] = useState([]);
  const [fetchingBanks, setFetchingBanks] = useState(false);
  const [banksFetched, setBanksFetched] = useState(false);
  const [searchPincode, setSearchPincode] = useState("");
  const [showBankPassword, setShowBankPassword] = useState({});
  const [copiedBankField, setCopiedBankField] = useState(null);

  // Find Bank RM (directory) state
  const [rmSearchQuery, setRmSearchQuery] = useState("");
  const [rmAllRows, setRmAllRows] = useState([]);
  const [rmFilters, setRmFilters] = useState({
    bank: "",
    product: "",
    marketType: "",
    state: "",
    city: "",
  });
  const [rmOptions, setRmOptions] = useState({
    banks: [],
    products: [],
    marketTypes: [],
    states: [],
    cities: [],
  });
  const [rmOptionsLoading, setRmOptionsLoading] = useState(false);
  const [rmSearching, setRmSearching] = useState(false);
  const [copiedRmCode, setCopiedRmCode] = useState(null);

  const getAppAuthToken = useCallback(() => {
    const auth = getAuthData() || {};
    return auth.asmToken || auth.rsmToken || auth.adminToken || auth.token || "";
  }, []);

  const toggleBankPassword = (bankId) => {
    setShowBankPassword((prev) => ({
      ...prev,
      [bankId]: !prev[bankId],
    }));
  };

  const handleCopyBankCred = async (text, label, key) => {
    if (!text || String(text).trim() === "") {
      toast.error(`No ${label} configured for this bank`);
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedBankField(key);
      toast.success(`${label} copied to clipboard!`, { duration: 1800 });
      setTimeout(() => {
        setCopiedBankField((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error(`Failed to copy ${label}`);
    }
  };

  const handleCopyBothBankCreds = (bank) => {
    const loginId = bank.portalLoginId || "N/A";
    const password = bank.portalPassword || "N/A";
    const portalLink = bank.portalLink || "N/A";
    const formatted = `Bank: ${bank.bankName}\nLoan Type: ${bank.loanType}\nPortal URL: ${portalLink}\nLogin ID: ${loginId}\nPassword: ${password}`;
    handleCopyBankCred(formatted, "Bank Credentials (ID & Password)", `${bank._id}-both`);
  };

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { applicationId, customerId } = location.state || {};

  const normalizeDocType = (value) => String(value || "").trim().toUpperCase();

  const getLocalRequiredDocRules = (loanType, gender) => {
    const isFemale = String(gender || "").toLowerCase() === "female";

    if (loanType === "PERSONAL" || loanType === "HOME_LOAN_SALARIED" || loanType === "LAP_SALARIED") {
      return [
        { key: "AADHAR_FRONT", acceptedDocTypes: ["AADHAR_FRONT"] },
        { key: "AADHAR_BACK", acceptedDocTypes: ["AADHAR_BACK"] },
        { key: "PAN", acceptedDocTypes: ["PAN"] },
        { key: "PHOTO_OR_SELFIE", acceptedDocTypes: ["PHOTO", "SELFIE"] },
        { key: "ADDRESS_PROOF", acceptedDocTypes: ["ADDRESS_PROOF", "LIGHT_BILL", "UTILITY_BILL", "RENT_AGREEMENT"] },
        { key: "COMPANY_ID_CARD", acceptedDocTypes: ["COMPANY_ID_CARD"] },
        { key: "SALARY_SLIP_1", acceptedDocTypes: ["SALARY_SLIP_1"] },
        { key: "SALARY_SLIP_2", acceptedDocTypes: ["SALARY_SLIP_2"] },
        { key: "SALARY_SLIP_3", acceptedDocTypes: ["SALARY_SLIP_3"] },
        { key: "FORM_16_26AS", acceptedDocTypes: ["FORM_16_26AS"] },
        { key: "BANK_STATEMENT_1", acceptedDocTypes: ["BANK_STATEMENT_1", "BANK_STATEMENT"] },
        { key: "BANK_STATEMENT_2", acceptedDocTypes: ["BANK_STATEMENT_2"] },
      ];
    }

    const baseRules = [
      { key: "ADDRESS_PROOF", acceptedDocTypes: ["ADDRESS_PROOF", "LIGHT_BILL", "UTILITY_BILL", "RENT_AGREEMENT"] },
      { key: "AADHAR_FRONT", acceptedDocTypes: ["AADHAR_FRONT"] },
      { key: "AADHAR_BACK", acceptedDocTypes: ["AADHAR_BACK"] },
      { key: "BUSINESS_OTHER_DOCS", acceptedDocTypes: ["BUSINESS_OTHER_DOCS"] },
      { key: "PAN", acceptedDocTypes: ["PAN"] },
      { key: "PHOTO_OR_SELFIE", acceptedDocTypes: ["PHOTO", "SELFIE"] },
      { key: "SHOP_ACT", acceptedDocTypes: ["SHOP_ACT"] },
      { key: "UDHYAM_AADHAR", acceptedDocTypes: ["UDHYAM_AADHAR"] },
      { key: "ITR", acceptedDocTypes: ["ITR"] },
      { key: "GST_DOCUMENT", acceptedDocTypes: ["GST_DOCUMENT", "GST_CERTIFICATE"] },
      { key: "SHOP_PHOTO", acceptedDocTypes: ["SHOP_PHOTO"] },
      { key: "BANK_STATEMENT_1", acceptedDocTypes: ["BANK_STATEMENT_1", "BANK_STATEMENT"] },
      { key: "BANK_STATEMENT_2", acceptedDocTypes: ["BANK_STATEMENT_2"] },
    ];

    if (isFemale && (loanType === "BUSINESS" || loanType === "HOME_LOAN_SELF_EMPLOYED" || loanType === "LAP_SELF_EMPLOYED")) {
      baseRules.push(
        { key: "CO_APPLICANT_AADHAR_FRONT", acceptedDocTypes: ["CO_APPLICANT_AADHAR_FRONT"] },
        { key: "CO_APPLICANT_AADHAR_BACK", acceptedDocTypes: ["CO_APPLICANT_AADHAR_BACK"] },
        { key: "CO_APPLICANT_PAN", acceptedDocTypes: ["CO_APPLICANT_PAN"] },
        { key: "CO_APPLICANT_SELFIE_OR_PHOTO", acceptedDocTypes: ["CO_APPLICANT_SELFIE"] }
      );
    }

    return baseRules;
  };

  const getEffectiveRules = () => {
    if (Array.isArray(requiredDocRules) && requiredDocRules.length) return requiredDocRules;
    return getLocalRequiredDocRules(applicationData?.loanType, applicationData?.customer?.gender);
  };

  const findDocForRule = (rule, docs = []) => {
    if (!rule) return undefined;
    const normRuleKey = String(rule.key || "").trim().toUpperCase();
    const accepted = Array.isArray(rule.acceptedDocTypes)
      ? rule.acceptedDocTypes.map((t) => String(t).trim().toUpperCase())
      : [normRuleKey];

    return docs.find((doc) => {
      if (!doc || !doc.docType) return false;
      const docType = String(doc.docType).trim().toUpperCase();
      if (docType === normRuleKey || accepted.includes(docType)) return true;
      if (
        (normRuleKey === "PHOTO_OR_SELFIE" || normRuleKey === "PHOTO" || normRuleKey === "SELFIE") &&
        (docType === "PHOTO_OR_SELFIE" || docType === "PHOTO" || docType === "SELFIE" || docType === "PASSPORT_PHOTO")
      ) return true;
      if (
        (normRuleKey === "AADHAR_FRONT" || normRuleKey === "AADHAAR_FRONT") &&
        (docType === "AADHAR_FRONT" || docType === "AADHAAR_FRONT")
      ) return true;
      if (
        (normRuleKey === "AADHAR_BACK" || normRuleKey === "AADHAAR_BACK") &&
        (docType === "AADHAR_BACK" || docType === "AADHAAR_BACK")
      ) return true;
      return false;
    });
  };

  const hasRuleUpload = (rule, docs = []) => {
    const matched = findDocForRule(rule, docs);
    return Boolean(matched?.url);
  };

  const hasRuleVerified = (rule, docs = []) => {
    const matched = findDocForRule(rule, docs);
    return matched?.status === "VERIFIED";
  };

  const docTypeDisplayNames = {
    PAN: "PAN Card",
    AADHAR_FRONT: "Aadhaar Front",
    AADHAAR_FRONT: "Aadhaar Front",
    AADHAR_BACK: "Aadhaar Back",
    AADHAAR_BACK: "Aadhaar Back",
    PHOTO: "Photo",
    SELFIE: "Selfie",
    PHOTO_OR_SELFIE: "Photo or Selfie",
    ADDRESS_PROOF: "Address Proof",
    LIGHT_BILL: "Light Bill",
    UTILITY_BILL: "Utility Bill",
    RENT_AGREEMENT: "Rent Agreement",
    OTHER_DOCS: "Other Documents",
    BUSINESS_OTHER_DOCS: "Business Other Documents",
    COMPANY_ID_CARD: "Company ID Card",
    SALARY_SLIP_1: "Salary Slip 1",
    SALARY_SLIP_2: "Salary Slip 2",
    SALARY_SLIP_3: "Salary Slip 3",
    FORM_16_26AS: "Form 16 / 26AS",
    BANK_STATEMENT_1: "Bank Statement 1",
    BANK_STATEMENT_2: "Bank Statement 2",
    BANK_STATEMENT: "Bank Statement",
    SHOP_ACT: "Shop Act / Gumasta",
    UDHYAM_AADHAR: "Udyam Aadhaar",
    ITR: "ITR",
    GST_DOCUMENT: "GST Document",
    GST_CERTIFICATE: "GST Certificate",
    SHOP_PHOTO: "Shop Photo",
    CO_APPLICANT_AADHAR_FRONT: "Co-applicant Aadhaar Front",
    CO_APPLICANT_AADHAR_BACK: "Co-applicant Aadhaar Back",
    CO_APPLICANT_PAN: "Co-applicant PAN",
    CO_APPLICANT_SELFIE: "Co-applicant Selfie",
    CO_APPLICANT_SELFIE_OR_PHOTO: "Co-applicant Selfie or Photo",
  };

  const toDocLabel = (docType) => {
    const key = normalizeDocType(docType);
    return docTypeDisplayNames[key] || key || "Document";
  };

  const getCanonicalRuleKeyForDoc = (docType) => {
    const match = getEffectiveRules().find((rule) =>
      Array.isArray(rule?.acceptedDocTypes) &&
      rule.acceptedDocTypes.some((type) => normalizeDocType(type) === normalizeDocType(docType))
    );
    return normalizeDocType(match?.key) || normalizeDocType(docType);
  };

  const toDocLabelByRule = (docType) => toDocLabel(getCanonicalRuleKeyForDoc(docType));

  const fetchRequiredDocRules = async (appData) => {
    try {
      const token = getAppAuthToken();
      const response = await axios.get(`${backendurl}/partner/loan-doc-rules`, {
        params: {
          loanType: appData?.loanType,
          gender: appData?.customer?.gender || "",
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (Array.isArray(response?.data?.rules) && response.data.rules.length) {
        return response.data.rules;
      }
    } catch (_err) {}
    return getLocalRequiredDocRules(appData?.loanType, appData?.customer?.gender);
  };

  // Fetch application data from API
  const fetchApplicationData = async () => {
    if (!applicationId) {
      setError("Application ID is missing");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await dispatch(fetchRsmApplication(applicationId));
      if (fetchRsmApplication.fulfilled.match(result)) {
        setApplicationData(result.payload);
        const rules = await fetchRequiredDocRules(result.payload);
        setRequiredDocRules(rules);
        setStatus(result.payload.status || "");
        if (result.payload.customer?.currentAddressPinCode) {
          setSearchPincode(result.payload.customer.currentAddressPinCode);
        }
      } else {
        setError(result.payload || "Failed to fetch application data");
      }
    } catch (err) {
      console.error("Error fetching application data:", err);
      setError(err.message || "Failed to fetch application data");
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleBanks = async () => {
    if (!searchPincode || !applicationData?.loanType) return;
    setFetchingBanks(true);
    try {
      const token = getAppAuthToken();
      const response = await axios.get(`${backendurl}/rsm/banks`, {
        params: {
          pincode: searchPincode,
          loanType: applicationData.loanType,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setEligibleBanks(response.data || []);
      setBanksFetched(true);
    } catch (err) {
      console.error("Error fetching eligible banks:", err);
      toast.error("Failed to fetch eligible banks");
    } finally {
      setFetchingBanks(false);
    }
  };

  const fetchAllBankRms = useCallback(async () => {
    try {
      setRmSearching(true);
      const token = getAppAuthToken();
      const res = await axios.get(`${backendurl}/rsm/bank-rms`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = Array.isArray(res.data?.bankRms) ? res.data.bankRms : [];
      setRmAllRows(data);
    } catch (err) {
      console.error("Failed to load bank RMs:", err);
      setRmAllRows([]);
    } finally {
      setRmSearching(false);
    }
  }, [getAppAuthToken]);

  const fetchRmFilterOptions = useCallback(async (nextFilters = rmFilters) => {
    try {
      setRmOptionsLoading(true);
      const token = getAppAuthToken();
      const params = {};
      if (nextFilters.bank) params.bank = nextFilters.bank;
      if (nextFilters.product) params.product = nextFilters.product;
      if (nextFilters.marketType) params.marketType = nextFilters.marketType;
      if (nextFilters.state) params.state = nextFilters.state;

      const res = await axios.get(`${backendurl}/rsm/bank-rms/filter-options`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      });

      setRmOptions({
        banks: res.data?.banks || [],
        products: res.data?.products || [],
        marketTypes: res.data?.marketTypes || [],
        states: res.data?.states || [],
        cities: res.data?.cities || [],
      });
    } catch (err) {
      console.error("Error fetching Bank RM filters:", err);
    } finally {
      setRmOptionsLoading(false);
    }
  }, [getAppAuthToken, rmFilters]);

  const handleRmFilterChange = async (field, value) => {
    let next = { ...rmFilters, [field]: value };
    if (field === "bank") {
      next = { ...rmFilters, bank: value, product: "", marketType: "" };
    } else if (field === "state") {
      const isPan = value === "PAN India" || value === "Open India";
      next = { ...rmFilters, state: value, city: isPan ? "All Cities" : "" };
    }

    setRmFilters(next);
    await fetchRmFilterOptions(next);
  };

  const handleResetRmFilters = () => {
    const empty = { bank: "", product: "", marketType: "", state: "", city: "" };
    setRmFilters(empty);
    setRmSearchQuery("");
    fetchRmFilterOptions(empty);
  };

  const rmFilteredResults = useMemo(() => {
    let list = (rmAllRows || []).filter((r) => r?.isActive !== false);

    if (rmFilters.bank) {
      const b = rmFilters.bank.trim().toLowerCase();
      list = list.filter((r) => String(r.bankNbfcName || "").trim().toLowerCase() === b);
    }
    if (rmFilters.product) {
      const p = rmFilters.product.trim().toLowerCase();
      list = list.filter((r) => String(r.product || "").trim().toLowerCase() === p);
    }
    if (rmFilters.marketType) {
      const m = rmFilters.marketType.trim().toLowerCase();
      list = list.filter((r) => String(r.marketType || "").trim().toLowerCase() === m);
    }
    if (rmFilters.state) {
      const s = rmFilters.state.trim().toLowerCase();
      const isPan = s === "pan india" || s === "open india";
      if (isPan) {
        list = list.filter((r) => r.isPanIndia || /pan\s*india|open\s*india/i.test(r.state || ""));
      } else {
        list = list.filter((r) => String(r.state || "").trim().toLowerCase() === s);
      }
    }
    if (rmFilters.city) {
      const c = rmFilters.city.trim().toLowerCase();
      if (c !== "all cities") {
        list = list.filter((r) => String(r.city || "").trim().toLowerCase() === c);
      }
    }

    if (rmSearchQuery.trim()) {
      const q = rmSearchQuery.trim().toLowerCase();
      list = list.filter((r) => {
        const hay = [
          r.bankNbfcName,
          r.product,
          r.loginCode,
          r.marketType,
          r.subType,
          r.city,
          r.state,
          r.company,
          r.rmName,
          r.asmName,
          r.rsmName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    return list;
  }, [rmAllRows, rmFilters, rmSearchQuery]);

  const handleCopyRmLoginCode = async (code, id) => {
    if (!code) {
      toast.error("No login code available");
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedRmCode(id);
      toast.success("Login code copied");
      setTimeout(() => {
        setCopiedRmCode((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error("Failed to copy login code");
    }
  };

  useEffect(() => {
    if (searchPincode && applicationData?.loanType && !banksFetched) {
      fetchEligibleBanks();
    }
  }, [searchPincode, applicationData?.loanType, banksFetched]);

  useEffect(() => {
    fetchRmFilterOptions({
      bank: "",
      product: "",
      marketType: "",
      state: "",
      city: "",
    });
    fetchAllBankRms();
  }, [fetchRmFilterOptions, fetchAllBankRms]);

  useEffect(() => {
    if (applicationId) {
      fetchApplicationData();
    } else {
      setError("Application ID not provided");
    }
  }, [applicationId, dispatch]);

  useEffect(() => {
    return () => {
      if (selectedDoc?.previewUrl) {
        window.URL.revokeObjectURL(selectedDoc.previewUrl);
      }
    };
  }, [selectedDoc]);

  const handleView = async (doc) => {
    setPreviewLoadingDoc(doc.docType);
    setZoomLevel(1);
    setRotation(0);
    try {
      const token = getAppAuthToken();
      const response = await axios.get(
        `${backendurl}/rsm/applications/${applicationData._id}/docs/${doc.docType}/download`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          responseType: "blob",
        }
      );

      if (response.data.type === "application/json" || response.status >= 400) {
        const text = await response.data.text();
        let errorMessage = `Failed to load ${doc.docType}`;
        try {
          const errorJson = JSON.parse(text);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          if (text && text.length < 200) {
            errorMessage = text;
          }
        }
        setModalMessage(errorMessage);
        setShowModal(true);
        setSelectedDoc(null);
        return;
      }

      let contentType = response.headers["content-type"] || response.data.type || "application/octet-stream";
      const fileBlob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: contentType });

      const url = window.URL.createObjectURL(fileBlob);
      const isImage = contentType.startsWith("image/") ||
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
      let errorMessage = `Failed to load ${doc.docType}. Please try downloading the document instead.`;
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setModalMessage(errorMessage);
      setShowModal(true);
      setSelectedDoc(null);
    } finally {
      setPreviewLoadingDoc(null);
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

  const handleDownload = async (doc) => {
    setDownloading(true);
    try {
      const { rsmToken } = getAuthData();
      const response = await axios.get(
        `${backendurl}/rsm/applications/${applicationData._id}/docs/${doc.docType}/download`,
        {
          headers: {
            Authorization: `Bearer ${rsmToken}`,
          },
          responseType: "blob",
        }
      );

      const contentType = response.headers["content-type"];
      let fileExtension = ".pdf";
      if (contentType) {
        if (contentType.includes("image/jpeg") || contentType.includes("image/jpg")) {
          fileExtension = ".jpg";
        } else if (contentType.includes("image/png")) {
          fileExtension = ".png";
        } else if (contentType.includes("application/pdf")) {
          fileExtension = ".pdf";
        }
      }

      const contentDisposition = response.headers["content-disposition"];
      let filename = `${doc.docType}_${applicationData.appNo}${fileExtension}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

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
      toast.error(err.response?.data?.message || `Failed to download ${doc.docType}`, {
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError("");
    const previousAppData = applicationData ? { ...applicationData } : null;

    try {
      if (!status) {
        toast.error("Please select a status");
        setSubmitLoading(false);
        return;
      }

      if (!remark.trim()) {
        toast.error("Please add a remark");
        setSubmitLoading(false);
        return;
      }

      // ✅ RSM/ASM allowed statuses
      const RSM_ALLOWED_STATUSES = [
        "LOGIN",
        "UNDER_REVIEW",
        "APPROVED",
        "AGREEMENT",
        "REJECTED",
        "DISBURSED",
        "DOC_COMPLETE",
        "DOC_INCOMPLETE",
      ];
      if (!RSM_ALLOWED_STATUSES.includes(status)) {
        toast.error(`Allowed statuses: ${RSM_ALLOWED_STATUSES.join(", ")}`);
        setSubmitLoading(false);
        return;
      }

      // Validate transitions
      const currentStatus = applicationData.status;
      const allowedTransitions = {
        SUBMITTED: ["DOC_COMPLETE", "LOGIN", "UNDER_REVIEW", "DOC_INCOMPLETE", "REJECTED"],
        DOC_INCOMPLETE: ["DOC_COMPLETE", "LOGIN", "UNDER_REVIEW", "REJECTED"],
        DOC_COMPLETE: ["LOGIN", "UNDER_REVIEW", "DOC_INCOMPLETE", "REJECTED"],
        LOGIN: ["UNDER_REVIEW", "APPROVED", "DOC_COMPLETE", "DOC_INCOMPLETE", "REJECTED"],
        UNDER_REVIEW: ["APPROVED", "LOGIN", "AGREEMENT", "DISBURSED", "DOC_INCOMPLETE", "REJECTED"],
        APPROVED: ["AGREEMENT", "DISBURSED", "UNDER_REVIEW", "DOC_INCOMPLETE", "REJECTED"],
        AGREEMENT: ["DISBURSED", "APPROVED", "UNDER_REVIEW", "DOC_INCOMPLETE", "REJECTED"],
        REJECTED: ["UNDER_REVIEW", "LOGIN", "DOC_COMPLETE", "DOC_INCOMPLETE", "APPROVED"],
        DISBURSED: ["UNDER_REVIEW", "REJECTED"],
      };

      if (!allowedTransitions[currentStatus]?.includes(status)) {
        toast.error(`Cannot transition from ${currentStatus} to ${status}. Allowed: ${allowedTransitions[currentStatus]?.join(", ") || "none"}`);
        setSubmitLoading(false);
        return;
      }

      // For APPROVED status, approved amount is mandatory
      if (status === "APPROVED" && (!approvalAmount || Number(approvalAmount) <= 0)) {
        toast.error("Please enter a valid approved loan amount for APPROVED status");
        setSubmitLoading(false);
        return;
      }

      if (applicationData) {
        setApplicationData({
          ...applicationData,
          status: status,
        });
      }

      const requestBody = {
        to: status,
        note: remark,
      };

      // Only send approvedLoanAmount when moving to APPROVED
      if (status === "APPROVED" && approvalAmount) {
        requestBody.approvedLoanAmount = parseInt(approvalAmount, 10);
      }

      const result = await dispatch(transitionRsmApplication({
        applicationId: applicationData._id,
        ...requestBody,
      }));

      if (transitionRsmApplication.fulfilled.match(result)) {
        if (result.payload && applicationData) {
          setApplicationData({
            ...applicationData,
            status: result.payload.status || status,
            approvedLoanAmount: result.payload.approvedLoanAmount || applicationData.approvedLoanAmount,
          });
        }

        setSubmittedStatus({
          status,
          remark,
          approvedLoanAmount: approvalAmount,
        });

        setRemark("");
        setApprovalAmount("");

        toast.success(`Application status updated to ${status} successfully!`, {
          duration: 3000,
          position: "top-right",
        });
      } else {
        if (previousAppData) {
          setApplicationData(previousAppData);
        }
        toast.error(result.payload || "Failed to update application status", {
          duration: 4000,
          position: "top-right",
        });
      }
    } catch (err) {
      console.error("Error updating application status:", err);
      toast.error(err.message || "Failed to update application status", {
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const getDocStatusColor = (status) => {
    switch (status) {
      case "VERIFIED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "UPDATED":
        return "bg-blue-100 text-blue-800 border-blue-300";
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
      case "UPDATED":
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Helper functions for rendering
  const renderFields = (fields, data) => (
    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {fields.map((field, idx) => (
        <div key={idx} className="bg-white rounded-lg border border-gray-100 p-2.5 shadow-sm hover:shadow-md transition">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5 truncate" title={field.label}>{field.label}</p>
          <p className="text-sm font-bold text-gray-900 break-words leading-tight">{field.value(data) || "N/A"}</p>
        </div>
      ))}
    </div>
  );

  const renderReferences = (references = []) => (
    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {references.map((ref, idx) => (
        <div key={idx} className="bg-white rounded-lg border border-gray-100 p-2.5 shadow-sm hover:shadow-md transition">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Reference {idx + 1}</p>
          <p className="text-sm font-bold text-gray-900">{ref.name || "N/A"}</p>
          <p className="text-[13px] font-medium text-brand-primary">{ref.phone || "N/A"}</p>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            <span className="text-gray-700 text-lg">Loading application data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !applicationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Application</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchApplicationData}
            className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!applicationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Application Data</h2>
          <p className="text-gray-600">Application data not available</p>
        </div>
      </div>
    );
  }

  // ✅ Get allowed statuses based on current status
  const getAllowedStatuses = () => {
    const currentStatus = applicationData?.status;
    const allowedTransitions = {
      SUBMITTED: ["DOC_COMPLETE", "LOGIN", "UNDER_REVIEW", "DOC_INCOMPLETE", "REJECTED"],
      DOC_INCOMPLETE: ["DOC_COMPLETE", "LOGIN", "UNDER_REVIEW", "REJECTED"],
      DOC_COMPLETE: ["LOGIN", "UNDER_REVIEW", "DOC_INCOMPLETE", "REJECTED"],
      LOGIN: ["UNDER_REVIEW", "APPROVED", "DOC_COMPLETE", "DOC_INCOMPLETE", "REJECTED"],
      UNDER_REVIEW: ["APPROVED", "LOGIN", "AGREEMENT", "DISBURSED", "DOC_INCOMPLETE", "REJECTED"],
      APPROVED: ["AGREEMENT", "DISBURSED", "UNDER_REVIEW", "DOC_INCOMPLETE", "REJECTED"],
      AGREEMENT: ["DISBURSED", "APPROVED", "UNDER_REVIEW", "DOC_INCOMPLETE", "REJECTED"],
      REJECTED: ["UNDER_REVIEW", "LOGIN", "DOC_COMPLETE", "DOC_INCOMPLETE", "APPROVED"],
      DISBURSED: ["UNDER_REVIEW", "REJECTED"],
    };
    return allowedTransitions[currentStatus] || [];
  };

  const allowedStatuses = getAllowedStatuses();

  return (
    <>
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
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 z-50 transition-all duration-300">
          <div className="bg-white rounded-xl w-full max-w-[96vw] h-[96vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200/60 ring-1 ring-slate-900/5">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-6">
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedDoc ? toDocLabelByRule(selectedDoc.docType) : "Document Preview"}
                </h3>
                
                {/* Viewer Tools (Only if image) */}
                {selectedDoc?.isImage && (
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:flex items-center text-[11px] text-slate-400 font-medium">
                      <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded shadow-sm mr-1">Ctrl</span> + Scroll to zoom
                    </span>
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm space-x-1">
                      <button 
                      onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 5))}
                      title="Zoom In"
                      className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-primary rounded transition-colors"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.1))}
                      title="Zoom Out"
                      className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-primary rounded transition-colors"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <button 
                      onClick={() => setRotation(prev => prev - 90)}
                      title="Rotate Left"
                      className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-primary rounded transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setRotation(prev => prev + 90)}
                      title="Rotate Right"
                      className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-primary rounded transition-colors"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <button 
                      onClick={() => { setZoomLevel(1); setRotation(0); }}
                      title="Reset View"
                      className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-primary rounded transition-colors"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  if (selectedDoc?.previewUrl) {
                    window.URL.revokeObjectURL(selectedDoc.previewUrl);
                  }
                  setSelectedDoc(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {selectedDoc ? (
              <div className="flex-1 flex flex-col min-h-0 space-y-0">
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="px-6 py-3 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-slate-500">
                        File Type: <span className="text-slate-800 font-bold">{selectedDoc.contentType || "Document"}</span>
                      </span>
                      {selectedDoc?.docType?.includes("BANK_STATEMENT") && (
                        <span className="font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          Password: <span className="font-bold tracking-wider">{(applicationData?.customer?.bankStatementPassword || applicationData?.bankStatementPassword) || "Not Provided"}</span>
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1.5 font-bold">
                      Status: 
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getDocStatusColor(selectedDoc.status)}`}>
                        {selectedDoc.status}
                      </span>
                    </span>
                  </div>

                  {previewLoadingDoc === selectedDoc.docType && (
                    <div className="w-full flex-1 flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading preview...</p>
                      </div>
                    </div>
                  )}

                  {previewLoadingDoc !== selectedDoc.docType && selectedDoc.previewUrl && (
                    <div className="w-full flex-1 border rounded bg-gray-100 overflow-hidden relative flex flex-col">
                      {selectedDoc.isImage ? (
                        <div 
                          ref={imageContainerRef}
                          className="w-full flex-1 overflow-auto p-4"
                        >
                          <div style={{
                            width: `${zoomLevel * 100}%`,
                            height: `${zoomLevel * 100}%`,
                            minWidth: '100%',
                            minHeight: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'width 0.1s ease-out, height 0.1s ease-out'
                          }}>
                            <img
                              src={selectedDoc.previewUrl}
                              alt={`Preview of ${selectedDoc.docType}`}
                              className="shadow-md"
                              style={{ 
                                transform: `rotate(${rotation}deg)`,
                                transformOrigin: 'center center',
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain'
                              }}
                              onError={(e) => {
                                console.error("Image preview failed:", e);
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <iframe
                          src={selectedDoc.previewUrl}
                          className="w-full h-full bg-white"
                          title={`Preview of ${selectedDoc.docType}`}
                        />
                      )}
                    </div>
                  )}
                </div>

                <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex gap-3 justify-center">
                  <button
                    onClick={() => handleDownload(selectedDoc)}
                    className="px-6 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover shadow-md hover:shadow-lg transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Document
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      if (selectedDoc?.previewUrl) {
                        window.URL.revokeObjectURL(selectedDoc.previewUrl);
                      }
                      setSelectedDoc(null);
                    }}
                    className="px-6 py-2.5 bg-gray-500 text-white font-bold rounded-xl hover:bg-gray-600 shadow-md hover:shadow-lg transition"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">{modalMessage}</p>
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="min-h-screen bg-slate-50">
        <div className="w-full max-w-[98%] mx-auto py-4">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-primary-hover px-4 py-3 border-b border-brand-primary">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2">
                <div className="text-white flex items-center gap-3">
                  <h1 className="text-lg sm:text-xl font-bold">
                    Loan Application #{applicationData.appNo}
                  </h1>
                  <span className="text-white/50">|</span>
                  <p className="text-teal-100 text-xs sm:text-sm opacity-90">
                    ID: {applicationData._id}
                  </p>
                </div>
                <div className="text-white text-right flex items-center gap-2">
                  <span className="text-xs font-medium opacity-90">Applied:</span>
                  <div className="flex items-center bg-white/20 px-2.5 py-1 rounded-md border border-white/30">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    <span className="text-sm font-semibold">{formatDate(applicationData.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-4">
              {/* Compact Summary Row — stacked fields so name/email never overlap */}
              {(() => {
                const customerInfo =
                  applicationData.customer ||
                  (applicationData.customerId && typeof applicationData.customerId === "object"
                    ? applicationData.customerId
                    : null);
                const partnerInfo =
                  (applicationData.partnerId && typeof applicationData.partnerId === "object"
                    ? applicationData.partnerId
                    : null) || applicationData.partner || null;
                const customerName = customerInfo?.firstName
                  ? `${customerInfo.firstName} ${customerInfo.lastName || ""}`.trim()
                  : customerInfo?.name || "N/A";
                const partnerName = partnerInfo?.firstName
                  ? `${partnerInfo.firstName} ${partnerInfo.lastName || ""}`.trim()
                  : "N/A";

                return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {/* Customer Compact */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 min-w-0 overflow-hidden">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-1.5 rounded bg-brand-primary/10 shrink-0">
                      <User className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">Customer</p>
                      <p className="font-bold text-sm text-gray-900 truncate" title={customerName}>
                        {customerName}
                      </p>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1.5 min-w-0">
                        <Mail className="w-3 h-3 text-brand-primary shrink-0"/>
                        <span className="truncate">{customerInfo?.email || "N/A"}</span>
                      </p>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-brand-primary shrink-0"/>
                        <span>{customerInfo?.phone || "N/A"}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Partner Compact */}
                <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-100 min-w-0 overflow-hidden">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-1.5 rounded bg-amber-100 shrink-0">
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-amber-700/70 uppercase">Partner</p>
                      <p className="font-bold text-sm text-gray-900 truncate" title={partnerName}>
                        {partnerName}
                      </p>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1.5 min-w-0">
                        <Mail className="w-3 h-3 text-amber-600 shrink-0"/>
                        <span className="truncate">{partnerInfo?.email || "N/A"}</span>
                      </p>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-amber-600 shrink-0"/>
                        <span>{partnerInfo?.phone || "N/A"}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Loan Summary Compact */}
                <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 min-w-0 overflow-hidden">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-1.5 rounded bg-blue-100 shrink-0">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-blue-600/70 uppercase">Loan Type</p>
                      <p className="font-bold text-sm text-gray-900 truncate">
                        {applicationData.loanType || "N/A"}
                      </p>
                      <p className="text-[11px] font-semibold text-blue-600/70 uppercase mt-1.5">Amount</p>
                      <p className="font-bold text-lg text-brand-primary leading-none">
                        {formatCurrency(applicationData.customer?.loanAmount || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
                );
              })()}

              {/* Data Grids */}
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2"><User className="w-4 h-4 text-slate-500"/> Customer Details</h2>
                  {renderFields(
                    customerFields,
                    applicationData.customer || applicationData.customerId
                  )}
                </div>

                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                  <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600"/>
                    {applicationData.loanType === "PERSONAL" ? "Employment Information" : "Business Information"}
                  </h2>
                  {applicationData.loanType === "PERSONAL"
                    ? renderFields(employmentFields, applicationData.employmentInfo)
                    : renderFields(businessFields, applicationData.businessInfo)}
                </div>

                <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
                  <h2 className="text-sm font-bold text-purple-800 uppercase tracking-wider mb-3 flex items-center gap-2"><User className="w-4 h-4 text-purple-600"/> References</h2>
                  {renderReferences(applicationData.references)}
                </div>

                {/* Address Information */}
                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                  <h2 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-600"/> Address Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded border border-gray-100 p-2.5 shadow-sm hover:shadow-md transition">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Current Address</p>
                      <p className="text-sm font-bold text-gray-900 mb-1">{applicationData.customer?.currentAddress || "N/A"}</p>
                      <p className="text-[11px] text-gray-500">PIN: <span className="font-semibold text-gray-700">{applicationData?.customer?.currentAddressPinCode || "N/A"}</span></p>
                    </div>
                    <div className="bg-white rounded border border-gray-100 p-2.5 shadow-sm hover:shadow-md transition">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Permanent Address</p>
                      <p className="text-sm font-bold text-gray-900 mb-1">{applicationData.customer?.permanentAddress || "N/A"}</p>
                      <p className="text-[11px] text-gray-500">PIN: <span className="font-semibold text-gray-700">{applicationData.customer?.permanentAddressPinCode || "N/A"}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Section - READ ONLY for RSM */}
              <div className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 ml-3">Document Portfolio</h2>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <Lock className="w-4 h-4 text-yellow-700" />
                    <span className="text-sm font-medium text-yellow-800">Read Only - Documents managed by RM</span>
                  </div>
                </div>

                {(() => {
                  const rules = getEffectiveRules();
                  const docs = applicationData.docs || [];
                  const requiredCount = rules.length;
                  const uploadedCount = rules.filter((rule) => hasRuleUpload(rule, docs)).length;
                  const verifiedCount = rules.filter((rule) => hasRuleVerified(rule, docs)).length;
                  const pendingCount = Math.max(requiredCount - verifiedCount, 0);

                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-gray-500">Required</p>
                          <p className="text-lg font-bold text-gray-900">{requiredCount}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-gray-500">Uploaded</p>
                          <p className="text-lg font-bold text-blue-700">{uploadedCount}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-gray-500">Verified</p>
                          <p className="text-lg font-bold text-green-700">{verifiedCount}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-gray-500">Pending</p>
                          <p className="text-lg font-bold text-amber-700">{pendingCount}</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Required Documents Checklist</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {rules.map((rule, idx) => {
                            const isUploaded = hasRuleUpload(rule, docs);
                            const isVerified = hasRuleVerified(rule, docs);
                            const stateText = isVerified ? "Verified" : isUploaded ? "Uploaded" : "Missing";
                            const stateClass = isVerified
                              ? "text-green-700 bg-green-100"
                              : isUploaded
                              ? "text-blue-700 bg-blue-100"
                              : "text-amber-700 bg-amber-100";
                            return (
                              <div
                                key={`${rule?.key || "rule"}-${idx}`}
                                className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2"
                              >
                                <span className="text-sm font-medium text-gray-800">{toDocLabel(rule?.key)}</span>
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${stateClass}`}>
                                  {stateText}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}

                <div className="grid gap-3 grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 transition-all duration-300">
                  {(applicationData.docs || []).map((doc, index) => {
                    const getDocIcon = (docType) => {
                      const docTypeLower = docType?.toLowerCase() || "";
                      if (docTypeLower.includes("pan")) return FileText;
                      if (docTypeLower.includes("aadhar")) return FileText;
                      if (docTypeLower.includes("salary")) return Receipt;
                      if (docTypeLower.includes("address")) return Building2;
                      if (docTypeLower.includes("bank")) return CreditCard;
                      if (docTypeLower.includes("photo") || docTypeLower.includes("selfie")) return Camera;
                      return FileText;
                    };

                    const IconComponent = getDocIcon(doc.docType);

                    return (
                      <div
                        key={index}
                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col group hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex items-start flex-1 min-w-0">
                            <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-orange-100 transition-colors shrink-0">
                              <IconComponent className="w-4 h-4 text-gray-600 group-hover:text-orange-600 transition-colors" />
                            </div>
                            <div className="ml-2 flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-xs truncate" title={toDocLabelByRule(doc.docType)}>
                                {toDocLabelByRule(doc.docType)}
                              </h3>
                              {doc.remarks && (
                                <p className="text-xs text-gray-600 mt-1">Remark: {doc.remarks}</p>
                              )}
                              {doc.uploadedAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              )}
                              {doc.docType && doc.docType.includes("BANK_STATEMENT") && (
                                <p className="text-[10px] font-semibold text-gray-700 mt-1">
                                  Pwd: {(applicationData?.customer?.bankStatementPassword || applicationData?.bankStatementPassword) || "Not Provided"}
                                </p>
                              )}
                            </div>
                          </div>
                          <div 
                            title={doc.status}
                            className={`flex items-center justify-center p-1.5 rounded-md border shrink-0 ${getDocStatusColor(doc.status)}`}
                          >
                            {getDocStatusIcon(doc.status)}
                          </div>
                        </div>

                        <p className="text-[10px] text-gray-500 mb-2 truncate">
                          {doc.url ? doc.url.split(/[\\\/]/).pop() : "No file"}
                        </p>

                        <div className="flex flex-col gap-2 mt-auto">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownload(doc)}
                              disabled={downloading}
                              title="Download"
                              className="flex-1 flex items-center justify-center py-2 text-white bg-gradient-to-r from-brand-primary to-brand-primary-hover rounded-lg hover:from-brand-primary-hover hover:to-brand-primary transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {downloading ? (
                                <Loader2 className="animate-spin w-4 h-4" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleView(doc)}
                              disabled={previewLoadingDoc !== null}
                              title="View"
                              className="flex-1 flex items-center justify-center py-2 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {previewLoadingDoc === doc.docType ? (
                                <Loader2 className="animate-spin w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Application Management - RSM can only change processing statuses */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 sm:p-5 border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 ml-2.5">Application Management</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-stretch">
                    {/* 1. Current Status */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col h-[420px]">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                      <div className="flex items-center justify-between gap-2 mb-2.5 pl-1 shrink-0">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                          <Clock className="w-4 h-4 mr-1.5 text-blue-500" />
                          Current Status
                        </h3>
                        {submittedStatus ? (
                          <LoanStatusBadge
                            status={submittedStatus.status}
                            className="!px-2.5 !py-1 !rounded-lg !text-xs"
                          />
                        ) : (
                          <LoanStatusBadge
                            status={applicationData.status}
                            className="!px-2.5 !py-1 !rounded-lg !text-xs"
                          />
                        )}
                      </div>
                      <div className="pl-1 space-y-2 flex-1 min-h-0 overflow-y-auto">
                        {submittedStatus ? (
                          <>
                            {submittedStatus.remark && (
                              <div className="bg-gray-50 px-2.5 py-2 rounded-lg border border-gray-100">
                                <p className="text-[11px] font-semibold text-gray-500 mb-0.5">Latest Remark</p>
                                <p className="text-gray-700 text-xs leading-snug">{submittedStatus.remark}</p>
                              </div>
                            )}
                            {submittedStatus.approvedLoanAmount && (
                              <div className="bg-emerald-50 px-2.5 py-2 rounded-lg border border-emerald-200 flex items-center justify-between gap-2">
                                <p className="text-[11px] font-semibold text-emerald-800">Approved</p>
                                <p className="text-emerald-700 font-bold text-sm">
                                  ₹{formatCurrency(submittedStatus.approvedLoanAmount)}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {applicationData.approvedLoanAmount && (
                              <p className="text-xs font-semibold text-gray-800">
                                Approved: ₹{formatCurrency(applicationData.approvedLoanAmount)}
                              </p>
                            )}
                            {applicationData.stageHistory && applicationData.stageHistory.length > 0 && (
                              <div className="border-t border-gray-100 pt-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Timeline</p>
                                <div className="space-y-1.5">
                                  {applicationData.stageHistory.map((stage, index) => (
                                    <div key={index} className="relative pl-3 border-l-2 border-blue-200">
                                      <div className="absolute w-1.5 h-1.5 bg-blue-500 rounded-full -left-[5px] top-1"></div>
                                      <p className="text-[11px] font-semibold text-gray-900 leading-tight">{stage.to}</p>
                                      <p className="text-[10px] text-gray-500">{new Date(stage.at).toLocaleDateString()} — {stage.note}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* 2. Update Application Status */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[420px] overflow-hidden">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center shrink-0 mb-2.5">
                        <Send className="w-4 h-4 mr-1.5 text-brand-primary" />
                        Update Status
                      </h3>

                      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-0.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Select New Status
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-medium text-sm text-gray-700 bg-gray-50 hover:bg-white"
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          disabled={allowedStatuses.length === 0}
                        >
                          <option value="">Select Status</option>
                          {allowedStatuses.map((allowedStatus) => (
                            <option key={allowedStatus} value={allowedStatus}>
                              {allowedStatus}
                            </option>
                          ))}
                        </select>

                        {allowedStatuses.length === 0 && (
                          <div className="mt-2 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
                            <AlertCircle className="w-4 h-4 text-yellow-600 mr-1.5 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-yellow-800 font-medium">
                              No further transitions are allowed from {getLoanStatusLabel(applicationData.status)}.
                            </p>
                          </div>
                        )}

                        {status && allowedStatuses.includes(status) && (
                          <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
                            <AlertCircle className="w-4 h-4 text-blue-600 mr-1.5 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-blue-800 font-medium">
                              {status === "REJECTED"
                                ? "Please enter a rejection reason. This cannot be done after Disbursed."
                                : status === "DISBURSED"
                                ? "Please enter the approved loan amount below."
                                : "Please add a remark explaining this status change."}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Add Remark
                        </label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                          <textarea
                            placeholder="Enter your remarks here..."
                            className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all resize-none h-16 text-sm"
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                          />
                        </div>
                      </div>

                      {status === "APPROVED" && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-semibold text-gray-700">
                              Approved Loan Amount (₹) *
                            </label>
                            <span className="text-[10px] text-gray-600 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                              Requested: ₹{(applicationData.customer?.loanAmount || applicationData.loan?.amount || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <input
                            type="number"
                            placeholder="Enter approved loan amount"
                            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all font-medium text-sm ${
                              approvalAmount && parseInt(approvalAmount) <= 0 ? "border-red-500 ring-2 ring-red-200" : "border-gray-300"
                            }`}
                            value={approvalAmount}
                            onChange={(e) => setApprovalAmount(e.target.value)}
                            min="1"
                            required
                          />
                          {approvalAmount && (
                            <div className="space-y-0.5">
                              {parseInt(approvalAmount) > (applicationData.customer?.loanAmount || applicationData.loan?.amount || 0) && (
                                <p className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  Amount exceeds requested amount.
                                </p>
                              )}
                              <p className="text-[11px] font-medium text-brand-primary italic">
                                In words: {toIndianWords(parseInt(approvalAmount))}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={submitLoading || !status || !remark.trim() || (status === "APPROVED" && !approvalAmount)}
                        className="mt-2.5 w-full flex items-center justify-center bg-gray-900 text-white py-2.5 px-4 rounded-lg shadow-sm hover:bg-gray-800 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      >
                        {submitLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <span>Submit Update</span>
                        )}
                      </button>
                    </div>

                  {/* 3. Smart Bank Matcher — same row, same size, scrollable */}
                  <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden flex flex-col h-[420px] md:col-span-2 xl:col-span-1">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 shrink-0">
                      <h3 className="text-sm font-bold text-white flex items-center">
                        <Building2 className="w-4 h-4 mr-1.5 text-emerald-100" />
                        Smart Bank Matcher
                      </h3>
                      <p className="text-emerald-100 text-[11px] mt-0.5 opacity-90">Auto-matching eligible banks for this applicant.</p>
                    </div>

                    <div className="p-3.5 flex flex-col flex-1 min-h-0 overflow-hidden">
                      <div className="flex gap-2 mb-2 relative shrink-0">
                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={searchPincode}
                          onChange={(e) => setSearchPincode(e.target.value)}
                          placeholder="Search Pincode"
                          className="flex-1 border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                        />
                        <button
                          onClick={fetchEligibleBanks}
                          disabled={fetchingBanks || !searchPincode}
                          className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          {fetchingBanks ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                        </button>
                      </div>

                      {fetchingBanks && !banksFetched ? (
                        <div className="py-8 flex flex-col items-center justify-center text-emerald-600 flex-1">
                          <Loader2 className="w-7 h-7 animate-spin mb-2" />
                          <p className="text-sm font-medium">Finding best matches...</p>
                        </div>
                      ) : banksFetched && (
                        <div className="space-y-2.5 mt-1 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5">
                          {eligibleBanks.length > 0 ? (
                            eligibleBanks.map(bank => {
                              const isPwVisible = showBankPassword[bank._id] === true;
                              const idCopied = copiedBankField === `${bank._id}-id`;
                              const pwCopied = copiedBankField === `${bank._id}-pw`;
                              const bothCopied = copiedBankField === `${bank._id}-both`;

                              return (
                                <div
                                  key={bank._id}
                                  className="border border-gray-200/90 hover:border-emerald-300 rounded-xl p-3 bg-white shadow-2xs space-y-2.5 transition-all"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      {bank.bankLogoUrl ? (
                                        <img
                                          src={bank.bankLogoUrl}
                                          alt={bank.bankName}
                                          className="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-gray-200/80 p-1 shrink-0"
                                        />
                                      ) : (
                                        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                                          {bank.bankName?.slice(0, 2) || <Building2 className="w-4 h-4 text-emerald-600" />}
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <p className="font-bold text-gray-900 text-xs sm:text-sm leading-tight truncate">
                                          {bank.bankName}
                                        </p>
                                        <span className="inline-block mt-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] px-1.5 py-0.2 rounded font-semibold truncate max-w-[150px]">
                                          {bank.loanType}
                                        </span>
                                      </div>
                                    </div>

                                    {bank.portalLink && bank.portalLink !== "#" && (
                                      <a
                                        href={bank.portalLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 px-2 py-1.5 rounded-lg transition shrink-0"
                                        title="Open official bank portal"
                                      >
                                        <span>Portal</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>

                                  <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded px-2 py-1 shadow-2xs">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide shrink-0">
                                        ID:
                                      </span>
                                      <span className="font-mono text-xs font-bold text-slate-800 tracking-wide truncate flex-1 select-all">
                                        {bank.portalLoginId || (
                                          <span className="text-slate-400 font-normal italic">Not Set</span>
                                        )}
                                      </span>
                                      {bank.portalLoginId && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleCopyBankCred(
                                              bank.portalLoginId,
                                              "Login ID",
                                              `${bank._id}-id`
                                            )
                                          }
                                          className={`p-1 rounded transition ${
                                            idCopied
                                              ? "text-emerald-600 bg-emerald-50"
                                              : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                          }`}
                                          title="Copy Login ID"
                                        >
                                          {idCopied ? (
                                            <Check className="w-3.5 h-3.5" />
                                          ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded px-2 py-1 shadow-2xs">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide shrink-0">
                                        Password:
                                      </span>
                                      <span
                                        className={`font-mono text-xs font-bold tracking-wide truncate flex-1 select-all ${
                                          isPwVisible
                                            ? "text-emerald-700"
                                            : "text-slate-500 tracking-widest"
                                        }`}
                                      >
                                        {isPwVisible
                                          ? bank.portalPassword || (
                                              <span className="text-slate-400 font-normal italic tracking-normal">
                                                Not Set
                                              </span>
                                            )
                                          : bank.portalPassword
                                          ? "••••••••"
                                          : (
                                              <span className="text-slate-400 font-normal italic tracking-normal">
                                                Not Set
                                              </span>
                                            )}
                                      </span>
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        {bank.portalPassword && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => toggleBankPassword(bank._id)}
                                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                              title={isPwVisible ? "Hide Password" : "Show Password"}
                                            >
                                              {isPwVisible ? (
                                                <EyeOff className="w-3.5 h-3.5" />
                                              ) : (
                                                <Eye className="w-3.5 h-3.5" />
                                              )}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleCopyBankCred(
                                                  bank.portalPassword,
                                                  "Password",
                                                  `${bank._id}-pw`
                                                )
                                              }
                                              className={`p-1 rounded transition ${
                                                pwCopied
                                                  ? "text-emerald-600 bg-emerald-50"
                                                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                              }`}
                                              title="Copy Password"
                                            >
                                              {pwCopied ? (
                                                <Check className="w-3.5 h-3.5" />
                                              ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                              )}
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {(bank.portalLoginId || bank.portalPassword) && (
                                      <div className="flex justify-end pt-0.5">
                                        <button
                                          type="button"
                                          onClick={() => handleCopyBothBankCreds(bank)}
                                          className={`inline-flex items-center gap-1 text-[10px] font-semibold transition px-1.5 py-0.5 rounded ${
                                            bothCopied
                                              ? "text-emerald-700 bg-emerald-100"
                                              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                                          }`}
                                          title="Copy Bank ID & Password together"
                                        >
                                          {bothCopied ? (
                                            <>
                                              <Check className="w-3 h-3 text-emerald-600" />
                                              <span>Both Copied!</span>
                                            </>
                                          ) : (
                                            <>
                                              <KeyRound className="w-3 h-3 text-slate-400" />
                                              <span>Copy ID &amp; Password</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
                              <p className="text-sm font-semibold text-gray-700">No matching banks</p>
                              <p className="text-xs text-gray-500 mt-1">Try a different pincode or check bank configurations.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Find Bank RM — full-width bottom card */}
                  <div className="md:col-span-2 xl:col-span-3 bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center">
                          <Search className="w-4 h-4 mr-1.5 text-rose-100" />
                          Find Bank RM
                        </h3>
                        <p className="text-rose-100 text-[11px] mt-0.5 opacity-90">
                          Search bank RM login codes by bank name, product, RM, market type, or location.
                        </p>
                      </div>
                      <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur-xs">
                        {rmFilteredResults.length} Available
                      </span>
                    </div>

                    <div className="p-3.5 space-y-3">
                      {/* Instant Search Bar */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="relative flex-1 min-w-[240px]">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Quick search by Bank, RM name, Login code, City or State..."
                            value={rmSearchQuery}
                            onChange={(e) => setRmSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs"
                          />
                          {rmSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setRmSearchQuery("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleResetRmFilters}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          Reset Filters
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            fetchAllBankRms();
                            fetchRmFilterOptions(rmFilters);
                          }}
                          disabled={rmSearching || rmOptionsLoading}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${rmSearching || rmOptionsLoading ? "animate-spin" : ""}`} />
                          Refresh
                        </button>
                      </div>

                      {/* Dropdown Filters */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2.5">
                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-600 text-xs">Bank</span>
                          <select
                            value={rmFilters.bank}
                            onChange={(e) => handleRmFilterChange("bank", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-rose-500 focus:border-rose-500"
                          >
                            <option value="">All Banks</option>
                            {rmOptions.banks.map((bank) => (
                              <option key={bank} value={bank}>
                                {bank}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-600 text-xs">Product</span>
                          <select
                            value={rmFilters.product}
                            onChange={(e) => handleRmFilterChange("product", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-rose-500 focus:border-rose-500"
                          >
                            <option value="">All Products</option>
                            {rmOptions.products.map((product) => (
                              <option key={product} value={product}>
                                {product}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-600 text-xs">Market Type</span>
                          <select
                            value={rmFilters.marketType}
                            onChange={(e) => handleRmFilterChange("marketType", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-rose-500 focus:border-rose-500"
                          >
                            <option value="">All Market Types</option>
                            {rmOptions.marketTypes.map((marketType) => (
                              <option key={marketType} value={marketType}>
                                {marketType}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-600 text-xs">State</span>
                          <select
                            value={rmFilters.state}
                            onChange={(e) => handleRmFilterChange("state", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-rose-500 focus:border-rose-500"
                          >
                            <option value="">All States</option>
                            {rmOptions.states.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-600 text-xs">City</span>
                          <select
                            value={rmFilters.city}
                            onChange={(e) => handleRmFilterChange("city", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-rose-500 focus:border-rose-500"
                          >
                            <option value="">All Cities</option>
                            {rmOptions.cities.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <BankRmResultsTable
                          rows={rmFilteredResults}
                          loading={rmSearching}
                          compact
                          emptyMessage="No matching Bank RM records found"
                          copiedLoginCodeId={copiedRmCode}
                          onCopyLoginCode={handleCopyRmLoginCode}
                        />
                      </div>
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

export default RsmApplicationView;

