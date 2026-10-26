import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Building,
  Briefcase,
  Users,
  Home,
  X,
  Eye,
  EyeOff,
  Share2,
} from "lucide-react";

import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams, useLocation, useParams } from "react-router-dom";

import { loanAmountRangeError } from "../../../../utils/loanAmountRule";
import { getAuthData } from "../../../../utils/localStorage";
import { backendurl } from "../../../../feature/urldata";
import {
  fetchPublicDefaultPartnerReferralCode,
  fetchPublicPartnerInfo,
  PUBLIC_LOAN_REFERRAL_FALLBACK,
} from "../../../../feature/publicLoanReferral";
import { canonicalPartnerReferralCode } from "../../../../config/branding";
import LoanStepper from "../../../../components/loan/LoanStepper";
import DocumentUploadCard from "../../../../components/loan/DocumentUploadCard";
import LoanAddressProofBlock from "../../../../components/loan/LoanAddressProofBlock";
import LoanReviewSummary, { LoanDocsProgress } from "../../../../components/loan/LoanReviewSummary";
import LoanRequirementFields from "../../../../components/loan/LoanRequirementFields";
import {
  LOAN_FIELD_LABEL,
  LOAN_PROFILE,
  LOAN_SECTION,
  LOAN_STABILITY_OPTIONS,
  LOAN_STEP,
  LOAN_STEP_LAYOUT_VERSION,
  buildLoanDocChecklist,
  docChecklistForStep,
  LOAN_DOC_GROUP,
  buildLoanReviewSections,
  getLoanSteps,
  resolveLoanNextStep,
  LOAN_BACK_TO_REVIEW_LABEL,
  LOAN_REVIEW_EDIT_HINT,
} from "../../../../components/loan/loanFormSpec";
import DocumentPreviewModal from "../../../../components/loan/DocumentPreviewModal";
import PublicLoanPartnerTrustBanner from "../../../../components/loan/PublicLoanPartnerTrustBanner";
import ShareLoanModal from "../../../../components/loan/ShareLoanModal";
import {
  findOversizeInLoanDocsQueue,
  formatLoanDocOversizeError,
} from "../../../../utils/docUploadLimits";
import {
  validateLoanDocumentUpload,
  loanDocumentFieldHint,
  snapshotLoanFile,
  UNREADABLE_LOAN_FILE_MESSAGE,
} from "../../../../utils/loanDocumentUpload";
import { uploadLeadDocumentEarly } from "../../../../utils/earlyLeadDocUpload";
import { postLoanFormWithRetry } from "../../../../utils/loanSubmitRetry";
import { OPTIONAL_EXTRA_DOC_CAPTION } from "../../../../utils/loanAddressProofCopy";
import LoanApplicantFinancialFields from "../../../../components/loan/LoanApplicantFinancialFields";
import {
  SALARY_RECEIPT_OPTIONS,
  validatePersonFinancialFields,
} from "../../../../utils/personFinancial";
import { persistLeadWizardProgress } from "../../../../utils/saveLeadProgress";
import { captureLeadOnStep1Next } from "../../../../utils/captureLeadStep1";
import {
  useRmLoanFormResume,
  rmCompleteLoanFormUrl,
  partnerCompleteLoanFormUrl,
} from "../../../../utils/rmLoanForm";
import {
  buildCanonicalLoanPayload,
  customerPasswordErrors,
  houseStatusOptionValue,
  isMarriedStatus,
  isValidPanFormat,
} from "../../../../utils/normalizeLoanPayload";
import {
  fetchLeadDocuments,
  buildHydratedDocFields,
  serializeDraftWithDocs,
} from "../../../../utils/rehydrateLeadDocuments";

const formatDocTypeName = (docType) => {
  const map = {
    AADHAR_FRONT: "Aadhaar Card (Front)",
    AADHAR_BACK: "Aadhaar Card (Back)",
    PAN: "PAN Card",
    PHOTO: "Applicant Photo / Selfie",
    SELFIE: "Applicant Photo / Selfie",
    PHOTO_OR_SELFIE: "Applicant Photo / Selfie",
    ADDRESS_PROOF: "Address Proof (Electricity Bill / Rent Agreement)",
    LIGHT_BILL: "Electricity Bill",
    COMPANY_ID_CARD: "Company ID Card",
    SALARY_SLIP_1: "Salary Slip (Month 1)",
    SALARY_SLIP_2: "Salary Slip (Month 2)",
    SALARY_SLIP_3: "Salary Slip (Month 3)",
    FORM_16_26AS: "Form 16 / 26AS",
    BANK_STATEMENT_1: "Bank Statement (Latest 6 Months)",
    BANK_STATEMENT_2: "Bank Statement 2",
    SHOP_ACT: "Shop Act / Gumasta License",
    UDHYAM_AADHAR: "Udyam Aadhaar",
    ITR: "ITR (Last 3 Years — one file)",
    SHOP_PHOTO: "Shop / Office Photo",
    GST_DOCUMENT: "GST Certificate",
    CO_APPLICANT_AADHAR_FRONT: "Co-Applicant Aadhaar (Front)",
    CO_APPLICANT_AADHAR_BACK: "Co-Applicant Aadhaar (Back)",
    CO_APPLICANT_PAN: "Co-Applicant PAN Card",
    CO_APPLICANT_SELFIE: "Co-Applicant Photo / Selfie",
    CO_APPLICANT_SELFIE_OR_PHOTO: "Co-Applicant Photo / Selfie",
  };
  return map[docType] || String(docType || "").replace(/_/g, " ");
};

export default function PersonalLoan({ embed = false, actorRole = "auto" } = {}) {
  const [documentModel, setdocumentModel] = useState(null);
  const navigate = useNavigate();

  const openDocumentPreview = (docValue) => {
    if (!docValue) return;
    const file = docValue instanceof File ? docValue : docValue?.file;
    const rawUrl = docValue?.preview
      ? docValue.preview
      : docValue?.url
      ? docValue.url
      : file instanceof File
      ? URL.createObjectURL(file)
      : typeof docValue === "string"
      ? docValue
      : "";
    if (rawUrl) {
      const isPdf = Boolean(
        file?.type?.includes("pdf") ||
        docValue?.type?.includes("pdf") ||
        (file?.name || docValue?.name || "").toLowerCase().endsWith(".pdf") ||
        rawUrl.toLowerCase().includes(".pdf")
      );
      setdocumentModel({
        url: rawUrl,
        name: file?.name || docValue?.name || "Document Preview",
        type: isPdf ? "application/pdf" : (file?.type || docValue?.type || "image/jpeg"),
        file,
      });
    }
  };

  const { partnerToken, partnerUser, rmToken } = getAuthData();
  const isRmMode = actorRole === "rm" || (actorRole === "auto" && Boolean(rmToken) && !partnerToken);
  const isPartnerLoggedIn = Boolean(partnerToken) && !isRmMode;
  const profileState = useSelector((state) => state?.partner?.profile?.data);

  const currentPartnerCode =
    canonicalPartnerReferralCode(
      profileState?.partnerCode,
      profileState?.referralCode
    ) ||
    canonicalPartnerReferralCode(
      partnerUser?.partnerCode,
      partnerUser?.referralCode
    ) ||
    "";

  const currentPartnerName =
    profileState?.fullName ||
    [profileState?.firstName, profileState?.middleName, profileState?.lastName]
      .filter(Boolean)
      .join(" ") ||
    [partnerUser?.firstName, partnerUser?.lastName].filter(Boolean).join(" ") ||
    "Authorized Partner";

  const [partnerInfo, setPartnerInfo] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [defaultReferralCode, setDefaultReferralCode] = useState(
    PUBLIC_LOAN_REFERRAL_FALLBACK
  );

  const [searchParams] = useSearchParams();
  const { code: routeCode } = useParams();
  const queryTypeCode = (
    routeCode ||
    searchParams.get("type") ||
    searchParams.get("loanType") ||
    searchParams.get("code") ||
    ""
  ).toUpperCase().trim();
  const loanTypeCode = queryTypeCode || "PERSONAL";

  const [dynamicProduct, setDynamicProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!loanTypeCode || loanTypeCode === "PERSONAL") {
      setDynamicProduct(null);
      return;
    }
    setLoadingProduct(true);
    axios
      .get(`${backendurl}/loan-products/code/${loanTypeCode}`, { timeout: 8000 })
      .then((res) => {
        if (!cancelled && res.data?.data) {
          setDynamicProduct(res.data.data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch loan product details:", err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingProduct(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loanTypeCode]);

  const dynamicLoanTitle = useMemo(() => {
    if (dynamicProduct?.name) return dynamicProduct.name;
    if (loanTypeCode === "PERSONAL") return "Personal Loan";
    return loanTypeCode
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }, [dynamicProduct, loanTypeCode]);

  const dynamicPageTitle = `${dynamicLoanTitle} Application`;
  const dynamicSubtitle =
    dynamicProduct?.description ||
    "Complete all fields to process your loan application";

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    officialEmail: "",
    stabilityOfResidency: "",
    currentHouseStatus: "",
    currentLandmark: "",
    permanentHouseStatus: "",
    permanentLandmark: "",
    permanentStability: "",
    currentAddressPinCode: "",
    permanentAddressPinCode: "",
    maritalStatus: "",
    wifeName: "",
    motherName: "",
    companyIdCard: "",
    selfie: "",
    contactNo: "",
    alternateContact: "",
    email: "",
    dob: "",
    pan: "",
    currentAddress: "",
    permanentAddress: "",
    addressProofType: "",
    addressProof: "",
    otherDocument: "",
    aadhar: "",
    companyName: "",
    designation: "",
    companyAddress: "",
    monthlySalary: "",
    totalExperience: "",
    currentExperience: "",
    salarySlip: "",
    bankStatement: "",
    photoCopy: "",
    propertyType: "",
    reference1Name: "",
    reference1Contact: "",
    reference2Name: "",
    reference2Contact: "",
    loanAmount: "",

    aadharFront: "",
    aadharBack: "",
    panCard: "",
    passportPhoto: "",
    salarySlip1: "",
    salarySlip2: "",
    salarySlip3: "",
    salaryInHand: "",
    bankStatement1: "",
    bankStatement2: "",
    bankStatement3: "",

    password: "",
    confirmPassword: "",
    bankStatementPassword: "",
    partnerReferralCode: "",
    hasRunningLoan: "NO",
    monthlyEmiPaying: "",
    loanPurpose: "",
    salaryReceiptMode: "",
    cibilScoreBand: "",
    hasBounce: "NO",
    bounceCount: "",
  });

  const [sameAddress, setSameAddress] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [savedApplication, setSavedApplication] = useState(null);
  const [docUploadProgress, setDocUploadProgress] = useState({});
  const [docUploadStatus, setDocUploadStatus] = useState({});
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [isCheckingExistence, setIsCheckingExistence] = useState(false);

  const applicationIdQuery = searchParams.get("applicationId");
  const isEditingExistingApp = Boolean(applicationIdQuery);
  const showPasswordFields = !isRmMode && !isEditingExistingApp;

  const { resumeMeta, loadingResume, resumeError } = useRmLoanFormResume({
    enabled: isRmMode || (isPartnerLoggedIn && isEditingExistingApp),
    setFormData,
    setApplicationId,
    preferPartner: isPartnerLoggedIn,
  });

  useEffect(() => {
    if (resumeError) setError(resumeError);
  }, [resumeError]);

  const steps = getLoanSteps({ profile: LOAN_PROFILE.SALARIED });
  const [currentStep, setCurrentStep] = useState(0);
  const [editingFromReview, setEditingFromReview] = useState(false);
  const [maxStep, setMaxStep] = useState(0);
  const stepAnchorIds = [
    "loan-personal-step",
    "loan-address-step",
    "loan-income-step",
    "loan-references-step",
    "loan-review-step",
  ];
  const loanDraftStorageKey = embed
    ? `loanDraft_${loanTypeCode.toLowerCase()}_embed_v1`
    : `loanDraft_${loanTypeCode.toLowerCase()}_v1`;

  const stepFirstFieldName = useMemo(
    () => [
      "loanAmount",
      "currentAddress",
      "companyName",
      "reference1Name",
      showPasswordFields
        ? (isPartnerLoggedIn ? "password" : "partnerReferralCode")
        : "loanAmount",
    ],
    [showPasswordFields, isPartnerLoggedIn]
  );

  useEffect(() => {
    if (isPartnerLoggedIn) return;
    let cancelled = false;
    fetchPublicDefaultPartnerReferralCode().then(async (code) => {
      if (cancelled) return;
      if (code) {
        setDefaultReferralCode(code);
        setFormData((prev) => {
          const existing = String(prev.partnerReferralCode ?? "").trim();
          if (existing) return prev;
          return { ...prev, partnerReferralCode: code };
        });

        const info = await fetchPublicPartnerInfo(code);
        if (!cancelled && info) {
          setPartnerInfo(info);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isPartnerLoggedIn]);

  const abortControllerRef = useRef(null);

  const fileLike = (v) =>
    v &&
    typeof v === "object" &&
    (v instanceof File ||
      v.isExistingDoc ||
      v.uploaded ||
      Boolean(v.url) ||
      (typeof v.name === "string" &&
        typeof v.size === "number" &&
        typeof v.type === "string"));

  const scrollToStep = (idx) => {
    const stepId = stepAnchorIds[idx];
    if (!stepId) return;
    const el = document.getElementById(stepId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToFirstError = (errorMap) => {
    if (!errorMap || typeof errorMap !== "object") return;
    const firstField = Object.keys(errorMap)[0];
    if (!firstField) return;
    const el = document.querySelector(`[name="${firstField}"]`);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (el && typeof el.focus === "function") {
      try {
        el.focus();
      } catch (e) {
        // ignore focus errors
      }
    }
  };

  // Load draft & restore uploaded documents state from localStorage
  useEffect(() => {
    if (isEditingExistingApp) return;
    try {
      const raw = localStorage.getItem(loanDraftStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.applicationId) {
        setApplicationId(parsed.applicationId);
      }
      if (parsed?.formData && typeof parsed.formData === "object") {
        setFormData((prev) => ({
          ...prev,
          ...parsed.formData,
          loanAmount:
            parsed.formData.loanAmount === "" || parsed.formData.loanAmount == null
              ? prev.loanAmount
              : parsed.formData.loanAmount,
        }));

        const initialStatuses = {};
        for (const [k, v] of Object.entries(parsed.formData)) {
          if (parsed.formData[`${k}_uploaded`] || (v && typeof v === "object" && (v.url || v.isExistingDoc))) {
            initialStatuses[k] = "uploaded";
          }
        }
        if (Object.keys(initialStatuses).length > 0) {
          setDocUploadStatus((prev) => ({ ...prev, ...initialStatuses }));
        }
      }
      const sameLayout = parsed?.stepLayout === LOAN_STEP_LAYOUT_VERSION;
      if (sameLayout && typeof parsed?.currentStep === "number") {
        setCurrentStep(
          Math.max(0, Math.min(parsed.currentStep, steps.length - 1))
        );
      }
      if (sameLayout && typeof parsed?.maxStep === "number") {
        setMaxStep(Math.max(0, Math.min(parsed.maxStep, steps.length - 1)));
      }
    } catch (e) {
      // ignore draft load errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Authoritative sync: rehydrate verified/uploaded documents from server on refresh
  useEffect(() => {
    if (!applicationId) return;
    let isCancelled = false;

    fetchLeadDocuments(applicationId, { partnerToken, isPartnerLoggedIn }).then((res) => {
      if (!isCancelled && res.ok && Array.isArray(res.docs) && res.docs.length > 0) {
        const { fields, statuses } = buildHydratedDocFields(res.docs);
        setFormData((prev) => ({
          ...prev,
          ...fields,
        }));
        setDocUploadStatus((prev) => ({
          ...prev,
          ...statuses,
        }));
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [applicationId, partnerToken, isPartnerLoggedIn]);

  // Persist draft with throttling (including applicationId and uploaded doc descriptors)
  useEffect(() => {
    if (isEditingExistingApp) return undefined;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          loanDraftStorageKey,
          JSON.stringify({
            applicationId,
            currentStep,
            maxStep,
            stepLayout: LOAN_STEP_LAYOUT_VERSION,
            formData: serializeDraftWithDocs(formData),
          })
        );
      } catch (e) {
        // ignore storage errors
      }
    }, 600);
    return () => clearTimeout(t);
  }, [formData, currentStep, maxStep, applicationId, isEditingExistingApp]);

  // Cleanup function to cancel pending requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (successMessage) toast.success(successMessage);
  }, [successMessage]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const nextVal = name === "loanAmount" ? parseInt(value, 10) || 0 : value;
      const updated = {
        ...prev,
        [name]: nextVal,
      };
      if (sameAddress) {
        if (name === "currentAddress") updated.permanentAddress = nextVal;
        if (name === "currentHouseStatus") updated.permanentHouseStatus = nextVal;
        if (name === "currentLandmark") updated.permanentLandmark = nextVal;
        if (name === "stabilityOfResidency") updated.permanentStability = nextVal;
        if (name === "currentAddressPinCode") updated.permanentAddressPinCode = nextVal;
      }
      return updated;
    });

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        if (sameAddress) {
          if (name === "currentAddress") delete next.permanentAddress;
          if (name === "currentHouseStatus") delete next.permanentHouseStatus;
          if (name === "currentLandmark") delete next.permanentLandmark;
          if (name === "stabilityOfResidency") delete next.permanentStability;
          if (name === "currentAddressPinCode") delete next.permanentAddressPinCode;
        }
        return next;
      });
    }
  };

  const handleFileChange = async (e) => {
    const input = e.target;
    const { name, files } = input;
    const picked = files?.[0];
    if (!picked) return;

    const err = validateLoanDocumentUpload(picked, name);
    if (err) {
      toast.error(err);
      input.value = "";
      return;
    }

    let file;
    try {
      file = await snapshotLoanFile(picked);
    } catch {
      toast.error(UNREADABLE_LOAN_FILE_MESSAGE);
      input.value = "";
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: file,
      [`${name}_uploaded`]: false,
    }));

    // Auto-create lead if applicationId is missing so background upload ALWAYS starts on select!
    let targetAppId = applicationId;
    if (!targetAppId && !isRmMode && !isEditingExistingApp) {
      try {
        const leadRes = await captureLeadOnStep1Next({
          loanType: "PERSONAL",
          formData,
          isPartnerLoggedIn,
          partnerToken,
          partnerReferralCode: currentPartnerCode,
          applicationId: null,
        });
        if (leadRes?.applicationId) {
          targetAppId = leadRes.applicationId;
          setApplicationId(targetAppId);
        }
      } catch (err) {
        console.warn("Auto-lead creation before doc upload non-fatal:", err);
      }
    }

    const toastId = toast.loading(`Uploading ${file.name}...`);
    setDocUploadStatus((p) => ({ ...p, [name]: "uploading" }));
    setDocUploadProgress((p) => ({ ...p, [name]: 25 }));

    if (targetAppId) {
      const res = await uploadLeadDocumentEarly({
        applicationId: targetAppId,
        partnerToken,
        isPartnerLoggedIn,
        fieldName: name,
        file,
        onProgress: (pct) => setDocUploadProgress((p) => ({ ...p, [name]: pct })),
      });

      if (res?.ok) {
        setDocUploadStatus((p) => ({ ...p, [name]: "uploaded" }));
        setDocUploadProgress((p) => ({ ...p, [name]: 100 }));
        toast.success(`${file.name} uploaded successfully!`, { id: toastId });
        const uploadedUrl = res.uploadedUrl || res.doc?.url;
        const isPdf = Boolean(
          file.type?.includes("pdf") ||
          file.name?.toLowerCase().endsWith(".pdf") ||
          uploadedUrl?.toLowerCase().includes(".pdf")
        );
        const docObj = {
          name: file.name,
          size: file.size,
          type: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
          url: uploadedUrl,
          preview: uploadedUrl || (file instanceof Blob ? URL.createObjectURL(file) : undefined),
          file: res.file || file,
        };
        setFormData((prev) => ({
          ...prev,
          [name]: docObj,
          [`${name}_uploaded`]: true,
          [`${name}_url`]: uploadedUrl,
          [`${name}_name`]: file.name,
        }));
      } else {
        setDocUploadStatus((p) => ({ ...p, [name]: "failed" }));
        toast.error(`Upload failed for ${file.name}`, { id: toastId });
      }
    } else {
      setTimeout(() => setDocUploadProgress((p) => ({ ...p, [name]: 65 })), 180);
      setTimeout(() => {
        setDocUploadProgress((p) => ({ ...p, [name]: 100 }));
        setDocUploadStatus((p) => ({ ...p, [name]: "uploaded" }));
        toast.success(`${file.name} attached successfully!`, { id: toastId });
      }, 400);
    }
  };

  const handleFileRemove = (fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: null,
      [`${fieldName}_uploaded`]: false,
    }));
    setDocUploadStatus((p) => ({ ...p, [fieldName]: "idle" }));
    setDocUploadProgress((p) => ({ ...p, [fieldName]: 0 }));
    const fileInput = document.querySelector(`input[name="${fieldName}"]`);
    if (fileInput) fileInput.value = "";
  };

  const renderError = (field) =>
    fieldErrors[field] ? (
      <p className="text-xs text-red-600 mt-1">{fieldErrors[field]}</p>
    ) : null;

  const renderDocUploadBadge = (fieldName) => {
    const status = docUploadStatus[fieldName] || (formData[`${fieldName}_uploaded`] ? "uploaded" : "idle");
    const progress = docUploadProgress[fieldName] || 0;
    if (status === "uploading") {
      return (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] text-blue-700 font-semibold whitespace-nowrap">{progress}%</span>
        </div>
      );
    }
    if (status === "uploaded" || formData[`${fieldName}_uploaded`]) {
      return (
        <span className="text-[11px] text-green-700 font-medium bg-green-50 border border-green-200 px-2 py-0.5 rounded inline-flex items-center gap-1 mt-1">
          ✓ Uploaded & Secured
        </span>
      );
    }
    if (status === "failed") {
      return (
        <span className="text-[11px] text-red-600 font-medium inline-flex items-center gap-1 mt-1">
          ⚠️ Upload retry pending
        </span>
      );
    }
    return null;
  };

  const handleSameAddressChange = (e) => {
    const isSame = e.target.checked;
    setSameAddress(isSame);
    if (isSame) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: prev.currentAddress || "",
        permanentHouseStatus: prev.currentHouseStatus || "",
        permanentLandmark: prev.currentLandmark || "",
        permanentStability: prev.stabilityOfResidency || "",
        permanentAddressPinCode: prev.currentAddressPinCode || "",
      }));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.permanentAddress;
        delete next.permanentHouseStatus;
        delete next.permanentLandmark;
        delete next.permanentStability;
        delete next.permanentAddressPinCode;
        return next;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: "",
        permanentHouseStatus: "",
        permanentLandmark: "",
        permanentStability: "",
        permanentAddressPinCode: "",
      }));
    }
  };

  function validateRegistrationForm(formData) {
    const errors = {};

    // Personal fields
    if (!formData.firstName) errors.firstName = "First name is required.";
    if (!formData.lastName) errors.lastName = "Last name is required.";
    if (!formData.motherName) errors.motherName = "Mother's name is required.";
    if (!formData.pan) {
      errors.pan = "PAN number is required.";
    } else if (!isValidPanFormat(formData.pan)) {
      errors.pan = "Enter a valid PAN card number (e.g., ABCDE1234F).";
    }
    if (!formData.gender) errors.gender = "Gender is required.";
    if (!formData.maritalStatus) errors.maritalStatus = "Marital status is required.";
    if (isMarriedStatus(formData.maritalStatus) && !String(formData.wifeName || "").trim()) {
      errors.wifeName = "Spouse name is required for married applicants.";
    }
    if (showPasswordFields) {
      Object.assign(errors, customerPasswordErrors(formData));
    }

    // Contact info
    if (!formData.contactNo) {
      errors.contactNo = "Contact number is required.";
    } else if (!/^\d{10}$/.test(formData.contactNo)) {
      errors.contactNo = "Contact number must be exactly 10 digits.";
    }
    if (formData.alternateContact && !/^\d{10}$/.test(formData.alternateContact)) {
      errors.alternateContact = "Alternate number must be exactly 10 digits.";
    }

    if (!formData.email) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Invalid email format.";
    }

    if (!formData.dob) {
      errors.dob = "Date of Birth is required.";
    } else if (getAgeFromDOB(formData.dob) < 18) {
      errors.dob = "You must be at least 18 years old to proceed.";
    }

    // Address
    if (!formData.currentAddress) errors.currentAddress = "Current address is required.";
    if (!formData.permanentAddress) errors.permanentAddress = "Permanent address is required.";
    if (!formData.stabilityOfResidency) errors.stabilityOfResidency = "Stability of Residency is required.";
    if (!formData.currentHouseStatus) errors.currentHouseStatus = "Current House Status is required.";
    if (!formData.currentLandmark) errors.currentLandmark = "Landmark is required.";
    if (!formData.currentAddressPinCode) {
      errors.currentAddressPinCode = "Pin Code is required.";
    } else if (!/^[1-9][0-9]{5}$/.test(String(formData.currentAddressPinCode).trim())) {
      errors.currentAddressPinCode = "Enter a valid 6-digit PIN code.";
    }
    if (!formData.permanentHouseStatus) errors.permanentHouseStatus = "Permanent House Status is required.";
    if (!formData.permanentLandmark) errors.permanentLandmark = "Landmark is required.";
    if (!formData.permanentStability) errors.permanentStability = "Stability is required.";
    if (!formData.permanentAddressPinCode) {
      errors.permanentAddressPinCode = "Pincode is required.";
    } else if (!/^[1-9][0-9]{5}$/.test(String(formData.permanentAddressPinCode).trim())) {
      errors.permanentAddressPinCode = "Enter a valid 6-digit PIN code.";
    }


    // Employment
    if (!formData.companyName) errors.companyName = "Company name is required.";
    if (!formData.designation) errors.designation = "Designation is required.";
    if (!formData.companyAddress) errors.companyAddress = "Company address is required.";
    if (!formData.monthlySalary) errors.monthlySalary = "Monthly salary is required.";
    if (!formData.totalExperience) errors.totalExperience = "Total Experience is required.";
    if (!formData.currentExperience) errors.currentExperience = "Current Experience is required.";
    if (!formData.salaryInHand) errors.salaryInHand = "salary In Hand is required.";
    if (!formData.companyIdCard) errors.companyIdCard = "Company Id Card is required.";
    if (!formData.salarySlip1) errors.salarySlip1 = "salarySlip1 is required.";
    if (!formData.salarySlip2) errors.salarySlip2 = "salarySlip2 is required.";
    if (!formData.salarySlip3) errors.salarySlip3 = "salarySlip3 is required.";

    if (!formData.addressProof) {
      errors.addressProof = "Address proof document is required.";
    }

    // Bank Statement
    if (!formData.bankStatement1) errors.bankStatement1 = "Bank Statement 1 is required.";

    // References
    if (!formData.reference1Name) errors.reference1Name = "Reference 1 name is required.";
    if (!formData.reference1Contact) {
      errors.reference1Contact = "Reference 1 contact is required.";
    } else if (!/^\d{10}$/.test(formData.reference1Contact)) {
      errors.reference1Contact = "Reference 1 contact must be exactly 10 digits.";
    }

    if (!formData.reference2Name) errors.reference2Name = "Reference 2 name is required.";
    if (!formData.reference2Contact) {
      errors.reference2Contact = "Reference 2 contact is required.";
    } else if (!/^\d{10}$/.test(formData.reference2Contact)) {
      errors.reference2Contact = "Reference 2 contact must be exactly 10 digits.";
    } else if (formData.reference2Contact === formData.reference1Contact) {
      errors.reference2Contact = "Reference 2 contact cannot be the same as Reference 1.";
    }

    // Loan
    const loanAmountError = loanAmountRangeError(formData.loanAmount);
    if (loanAmountError) errors.loanAmount = loanAmountError;

    if (!formData.loanPurpose) {
      errors.loanPurpose = "Loan purpose is required.";
    }
    if (formData.hasRunningLoan === "YES" && (!formData.monthlyEmiPaying || Number(formData.monthlyEmiPaying) <= 0)) {
      errors.monthlyEmiPaying = "Monthly EMI is required when running loan is Yes.";
    }
    Object.assign(errors, validatePersonFinancialFields(formData));

    // Mandatory document validation
    if (!formData.aadharFront) errors.aadharFront = "Aadhar front is required.";
    if (!formData.aadharBack) errors.aadharBack = "Aadhar back is required.";
    if (!formData.panCard) errors.panCard = "PAN card is required.";
    if (!formData.passportPhoto && !formData.selfie) {
      errors.passportPhoto = "Applicant photo is required.";
    }

    return errors;
  }

  const stepFieldKeys = useMemo(
    () => [
      [
        "loanAmount",
        "loanPurpose",
        "hasRunningLoan",
        "monthlyEmiPaying",
        "cibilScoreBand",
        "hasBounce",
        "bounceCount",
        "firstName",
        "lastName",
        "contactNo",
        "alternateContact",
        "email",
        "pan",
        "panCard",
        "dob",
        "gender",
        "maritalStatus",
        "wifeName",
        "motherName",
        "aadharFront",
        "aadharBack",
        "passportPhoto",
        "selfie",
      ],
      [
        "currentAddress",
        "currentLandmark",
        "currentAddressPinCode",
        "currentHouseStatus",
        "stabilityOfResidency",
        "addressProof",
        "permanentAddress",
        "permanentLandmark",
        "permanentAddressPinCode",
        "permanentHouseStatus",
        "permanentStability",
      ],
      [
        "companyName",
        "designation",
        "companyAddress",
        "companyIdCard",
        "monthlySalary",
        "salaryInHand",
        "salarySlip1",
        "salarySlip2",
        "salarySlip3",
        "form16_26as",
        "totalExperience",
        "currentExperience",
        "officialEmail",
        ...(dynamicProduct?.customFields || []).map((f) => f.fieldKey),
        "bankStatement1",
        "bankStatement2",
        ...(dynamicProduct?.requiredDocuments || []).map((d) => d.docType),
      ],
      ["reference1Name", "reference1Contact", "reference2Name", "reference2Contact"],
      showPasswordFields ? ["password", "confirmPassword"] : [],
    ],
    [showPasswordFields, dynamicProduct]
  );

  const docChecklist = buildLoanDocChecklist(
    [
      { key: "panCard", label: "PAN Card", required: true, step: LOAN_STEP.PERSONAL },
      { key: "aadharFront", label: "Aadhaar Front", required: true, step: LOAN_STEP.PERSONAL },
      { key: "aadharBack", label: "Aadhaar Back", required: true, step: LOAN_STEP.PERSONAL },
      { key: "passportPhoto", altKeys: ["selfie"], label: "Applicant Photo", required: true, step: LOAN_STEP.PERSONAL },
      { key: "otherDocument", label: "Other Document", required: false, step: LOAN_STEP.PERSONAL },
      { key: "addressProof", label: "Address Proof", required: true, step: LOAN_STEP.ADDRESS },
      { key: "companyIdCard", label: "Company ID Card", required: true, step: LOAN_STEP.INCOME },
      { key: "salarySlip1", label: "Salary Slip 1", required: true, step: LOAN_STEP.INCOME },
      { key: "salarySlip2", label: "Salary Slip 2", required: true, step: LOAN_STEP.INCOME },
      { key: "salarySlip3", label: "Salary Slip 3", required: true, step: LOAN_STEP.INCOME },
      { key: "form16_26as", label: "Form 16 / 26AS", required: false, step: LOAN_STEP.INCOME },
      { key: "bankStatement1", label: "Bank Statement 1", required: true, step: LOAN_STEP.INCOME },
      { key: "bankStatement2", label: "Bank Statement 2", required: false, step: LOAN_STEP.INCOME },
      ...(dynamicProduct?.requiredDocuments || []).map((d) => ({
        key: d.docType,
        label: d.label,
        required: false,
        step: LOAN_STEP.INCOME,
      })),
    ],
    formData
  );

  const renderDocCard = (name, label, { required = false, accept = ".pdf,.jpg,.jpeg,.png", hint } = {}) => (
    <DocumentUploadCard
      key={name}
      name={name}
      label={label}
      file={formData[name]}
      accept={accept}
      required={required}
      hint={hint || loanDocumentFieldHint(name)}
      onChange={handleFileChange}
      onRemove={handleFileRemove}
      error={renderError(name)}
      uploadStatus={docUploadStatus[name] || (formData[`${name}_uploaded`] ? "uploaded" : "idle")}
      uploadProgress={docUploadProgress[name] || 0}
      onPreview={() => openDocumentPreview(formData[name])}
    />
  );

  const reviewSections = buildLoanReviewSections(formData, {
    profile: LOAN_PROFILE.SALARIED,
    sameAddress,
    loanTitle: dynamicLoanTitle,
  });

  const stabilityOptionsFor = (value) =>
    value && !LOAN_STABILITY_OPTIONS.some((o) => o.value === value)
      ? [{ label: value, value }, ...LOAN_STABILITY_OPTIONS]
      : LOAN_STABILITY_OPTIONS;

  const goToStep = (idx) => {
    setError("");
    setFieldErrors({});
    setValidationErrors([]);
    setEditingFromReview(idx !== LOAN_STEP.REVIEW);
    setCurrentStep(idx);
    scrollToStep(idx);
  };

  const validateStep = (stepIdx) => {
    const errors = validateRegistrationForm(formData);
    const keys = stepFieldKeys[stepIdx] || [];
    return keys.reduce((acc, key) => {
      if (errors[key]) acc[key] = errors[key];
      return acc;
    }, {});
  };

  const canSubmit = useMemo(
    () => Object.keys(validateRegistrationForm(formData)).length === 0,
    [formData, showPasswordFields]
  );
  const stepErrorCounts = useMemo(
    () => steps.map((_, idx) => Object.keys(validateStep(idx)).length),
    [formData, showPasswordFields]
  );

  const handleNext = async () => {
    if (loading || isCheckingExistence) return;
    setError("");
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setError("Please fix the highlighted fields to continue.");
      setFieldErrors(stepErrors);
      setValidationErrors(Object.values(stepErrors));
      scrollToFirstError(stepErrors);
      return;
    }

    // New: Check if customer exists after Step 1 (Personal Info)
    if (currentStep === 0 && isPartnerLoggedIn && !isRmMode && !isEditingExistingApp) {
      setIsCheckingExistence(true);
      try {
        const { data } = await axios.get(`${backendurl}/partner/check-customer`, {
          params: {
            email: formData.email,
            phone: formData.contactNo,
          },
          headers: { Authorization: `Bearer ${partnerToken}` },
        });

        if (data.exists) {
          setError(data.message);
          setIsCheckingExistence(false);
          return;
        }
      } catch (err) {
        console.error("Error checking customer existence:", err);
        // Fallback: allow proceeding if the check itself fails, 
        // as the final submit will still catch duplicates.
      } finally {
        setIsCheckingExistence(false);
      }
    }

    // Sync filled wizard fields to LEAD so RM sees progress (Personal → Documents)
    const leavingStep = currentStep;
    const nextIdx = Math.min(
      resolveLoanNextStep(currentStep, { editingFromReview }),
      steps.length - 1
    );

    if (!isRmMode && !isEditingExistingApp) {
      const leadProgress = persistLeadWizardProgress({
        applicationId,
        setApplicationId,
        leavingStepIndex: leavingStep,
        nextStepIndex: nextIdx,
        steps,
        loanType: dynamicProduct?.code || loanTypeCode,
        formData,
        isPartnerLoggedIn,
        partnerToken,
        partnerReferralCode: currentPartnerCode,
        isRmMode,
      }).catch((err) => console.warn("Lead progress sync non-fatal:", err));
      if (leavingStep === 0) {
        setIsCheckingExistence(true);
        const result = await leadProgress;
        setIsCheckingExistence(false);
        if (result?.blocked) {
          setError(result.message);
          toast.error(result.message);
          return;
        }
      }
    }

    setFieldErrors({});
    setValidationErrors([]);
    setEditingFromReview(false);
    setCurrentStep(nextIdx);
    setMaxStep((m) => Math.max(m, nextIdx));
    scrollToStep(nextIdx);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[name="${stepFirstFieldName[nextIdx]}"]`);
      if (el && typeof el.focus === "function") el.focus();
    });
  };

  const handleBack = () => {
    if (loading) return;
    if (currentStep === 0) return;
    setError("");
    setFieldErrors({});
    setValidationErrors([]);
    const prevIdx = Math.max(0, currentStep - 1);
    setCurrentStep(prevIdx);
    scrollToStep(prevIdx);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[name="${stepFirstFieldName[prevIdx]}"]`);
      if (el && typeof el.focus === "function") el.focus();
    });
  };

  const handleSubmit = async () => {
    if (loading) return;
    console.log("working");
    
    setLoading(true);
    setError("");
    setFieldErrors({});
    setValidationErrors([]);
    setSuccessMessage("");
    setSavedApplication(null);

    try {
      const errors = validateRegistrationForm(formData);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setValidationErrors(Object.values(errors));
        setLoading(false);
        return;
      }

      // ✅ Prepare canonical JSON structure matching backend schema
      const activeLoanCode = dynamicProduct?.code || loanTypeCode;
      const applicationData = buildCanonicalLoanPayload(formData, activeLoanCode, {
        isPartnerLoggedIn,
      });

      if (dynamicProduct?.code) {
        applicationData.loanType = dynamicProduct.code;
        applicationData.dynamicProductCode = dynamicProduct.code;
      }
      if (dynamicProduct?.customFields?.length > 0) {
        const customResponses = {};
        dynamicProduct.customFields.forEach((f) => {
          if (formData[f.fieldKey] !== undefined) {
            customResponses[f.fieldKey] = formData[f.fieldKey];
          }
        });
        applicationData.customFieldResponses = customResponses;
      }

      // ✅ Prepare FormData
      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(applicationData));

      // Append files (only upload docs that were not already sent early via background upload)
      const applicantPhoto = formData.passportPhoto || formData.selfie;
      const docsQueue = [
        { file: formData.aadharFront, type: "AADHAR_FRONT", key: "aadharFront" },
        { file: formData.aadharBack, type: "AADHAR_BACK", key: "aadharBack" },
        { file: formData.panCard, type: "PAN", key: "panCard" },
        { file: applicantPhoto, type: "PHOTO", key: formData.passportPhoto ? "passportPhoto" : "selfie" },
        { file: formData.addressProof, type: "ADDRESS_PROOF", key: "addressProof" },
        { file: formData.otherDocument, type: "OTHER_DOCS", key: "otherDocument" },
        { file: formData.companyIdCard, type: "COMPANY_ID_CARD", key: "companyIdCard" },
        { file: formData.salarySlip1, type: "SALARY_SLIP_1", key: "salarySlip1" },
        { file: formData.salarySlip2, type: "SALARY_SLIP_2", key: "salarySlip2" },
        { file: formData.salarySlip3, type: "SALARY_SLIP_3", key: "salarySlip3" },
        { file: formData.form16_26as, type: "FORM_16_26AS", key: "form16_26as" },
        { file: formData.bankStatement1, type: "BANK_STATEMENT_1", key: "bankStatement1" },
        { file: formData.bankStatement2, type: "BANK_STATEMENT_2", key: "bankStatement2" },
        { file: formData.allotmentLetter, type: "ALLOTMENT_LETTER", key: "allotmentLetter" },
        {
          file: formData.newPropertyPaymentReceipts,
          type: "NEW_PROPERTY_PAYMENT_RECEIPTS",
          key: "newPropertyPaymentReceipts",
        },
        { file: formData.titleDeeds, type: "TITLE_DEEDS", key: "titleDeeds" },
        {
          file: formData.resalePaymentReceipts,
          type: "RESALE_PAYMENT_RECEIPTS",
          key: "resalePaymentReceipts",
        },
        { file: formData.agreementCopy, type: "AGREEMENT_COPY", key: "agreementCopy" },
      ];

      // Dynamic documents configured for this loan product (e.g. CAR_QUOTATION, RC_BOOK, etc.)
      if (dynamicProduct?.requiredDocuments?.length > 0) {
        dynamicProduct.requiredDocuments.forEach((doc) => {
          const docFile = formData[doc.docType];
          if (docFile && !docsQueue.some((q) => q.type === doc.docType)) {
            docsQueue.push({
              file: docFile,
              type: doc.docType,
              key: doc.docType,
            });
          }
        });
      }

      // If already uploaded in background to lead, backend preserves existing docs on submit.
      // We only append pending files to make final submission fast (<1 second).
      docsQueue.forEach(({ file, type, key }) => {
        if (file) {
          const isUploadedEarly = Boolean(applicationId && formData[`${key}_uploaded`]);
          if (!isUploadedEarly) {
            const rawFile = file instanceof File ? file : file?.file;
            if (rawFile instanceof File) {
              formDataToSend.append("docs", rawFile);
              formDataToSend.append("docTypes", type);
            }
          }
        }
      });

      const pendingUploads = docsQueue
        .map(({ file, type, key }) => ({
          file: file instanceof File ? file : file?.file,
          type,
          key,
        }))
        .filter(
          ({ file, key }) => file instanceof File && !(applicationId && formData[`${key}_uploaded`])
        );
      if (!checkFileSize(pendingUploads)) {
        setLoading(false);
        return;
      }

      // ✅ Send FormData to backend
      if (isRmMode) {
        if (!applicationId) {
          setError("Missing application id. Open this form from Leads → Complete form yourself.");
          setLoading(false);
          return;
        }
        abortControllerRef.current = new AbortController();
        const response = await axios.post(
          rmCompleteLoanFormUrl(applicationId),
          formDataToSend,
          {
            headers: { Authorization: `Bearer ${rmToken}` },
            timeout: 120000,
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024,
            signal: abortControllerRef.current.signal,
          }
        );
        const data = response.data;
        setSavedApplication(data);
        setSuccessMessage(
          data.message || "Application form completed successfully."
        );
        toast.success(data.message || "Loan form completed");
        setTimeout(() => navigate("/rm/leads"), 1200);
        return;
      }

      if (isPartnerLoggedIn && isEditingExistingApp) {
        const targetAppId = applicationIdQuery || applicationId;
        abortControllerRef.current = new AbortController();
        const response = await axios.post(
          partnerCompleteLoanFormUrl(targetAppId),
          formDataToSend,
          {
            headers: { Authorization: `Bearer ${partnerToken}` },
            timeout: 120000,
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024,
            signal: abortControllerRef.current.signal,
          }
        );
        const data = response.data;
        setSavedApplication(data);
        setSuccessMessage(data.message || "Application form updated successfully.");
        toast.success(data.message || "Loan form updated successfully");
        setTimeout(() => navigate("/partner/applications"), 1200);
        return;
      }

      const endpoint = isPartnerLoggedIn
        ? `${backendurl}/partner/create-applications`
        : `${backendurl}/partner/public/create-application`;

      const headers = isPartnerLoggedIn
        ? {
          Authorization: `Bearer ${partnerToken}`,
        }
        : {};

      // Create AbortController for request cancellation
      abortControllerRef.current = new AbortController();

      const response = await postLoanFormWithRetry(endpoint, formDataToSend, {
        headers,
        timeout: 120000, // 120 seconds timeout for file uploads
        maxContentLength: 100 * 1024 * 1024, // 100MB max content length
        maxBodyLength: 100 * 1024 * 1024, // 100MB max body length
        signal: abortControllerRef.current.signal,
        onUploadProgress: (progressEvent) => {
          // Optional: You can add progress tracking here if needed
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            // console.log(`Upload progress: ${percentCompleted}%`);
          }
        },
      });

      const data = response.data;
      setApplicationId(data.id);
      setSavedApplication(data);
      setSuccessMessage(
        data.message || "Application saved successfully. Submitting now."
      );
      await handleApplyNow(data.id);
    } catch (error) {
      console.error(error);
      
      // Handle different error types
      if (axios.isCancel(error)) {
        setError("Request was cancelled. Please try again.");
      } else if (error.code === "ECONNABORTED") {
        setError("Request timeout. Please check your connection and try again.");
      } else if (error.response) {
        const backendData = error.response?.data;
        const backendMessage = backendData?.message;
        const backendError = backendData?.error || "";
        const missingDocs = backendData?.missingDocs;
        const errorsList = backendData?.errors;

        if (Array.isArray(missingDocs) && missingDocs.length > 0) {
          setError("Mandatory documents are missing. Please upload the required documents:");
          setValidationErrors(missingDocs.map((doc) => `Missing Document: ${formatDocTypeName(doc)}`));
        } else if (Array.isArray(errorsList) && errorsList.length > 0) {
          setError(backendMessage || "Please fix the following validation errors:");
          setValidationErrors(errorsList);
        } else if (typeof backendError === "string" && backendError.includes("E11000")) {
          if (backendError.includes("email_1")) {
            setError(
              "An account with this email already exists. Please login or use a different email."
            );
          } else if (backendError.includes("phone_1")) {
            setError(
              "An account with this mobile number already exists. Please login or use a different number."
            );
          } else {
            setError(
              "A record with these details already exists. Please login or use different details."
            );
          }
          setValidationErrors([]);
        } else {
          setError(
            backendMessage || "Failed to save application. Please try again."
          );
          setValidationErrors([]);
        }
      } else if (error.request) {
        setError("Network error. Please check your internet connection and try again.");
      } else {
        setError(error.message || "An unexpected error occurred. Please try again.");
      }

      // Auto-scroll to top so user sees error banner
      setTimeout(() => {
        const topEl = document.getElementById("loan-application-form-top");
        if (topEl) {
          topEl.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 100);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleApplyNow = async (forcedApplicationId) => {
    if (loading) return;
    const targetApplicationId = forcedApplicationId || applicationId;
    if (!targetApplicationId) return;
    setLoading(true);
    setError("");
    try {
      const { partnerToken } = getAuthData();
      if (!partnerToken) {
        setSuccessMessage("Application submitted successfully.");
        resetFields();
        return;
      }
      abortControllerRef.current = new AbortController();

      await postLoanFormWithRetry(
        `${backendurl}/partner/applications/${targetApplicationId}/submit`,
        {},
        {
          headers: {
            Authorization: `Bearer ${partnerToken}`,
          },
          timeout: 30000,
          signal: abortControllerRef.current.signal,
        }
      );
      setSuccessMessage("Application submitted successfully.");
      resetFields();
    } catch (err) {
      if (axios.isCancel(err)) {
        setError("Request was cancelled. Please try again.");
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please check your connection and try again.");
      } else if (err.response) {
        const backendData = err.response?.data;
        const missingDocs = backendData?.missingDocs;
        const errorsList = backendData?.errors;

        if (Array.isArray(missingDocs) && missingDocs.length > 0) {
          setError("Mandatory documents missing:");
          setValidationErrors(missingDocs.map((doc) => `Missing Document: ${formatDocTypeName(doc)}`));
        } else if (Array.isArray(errorsList) && errorsList.length > 0) {
          setError(backendData?.message || "Validation errors:");
          setValidationErrors(errorsList);
        } else {
          setError(backendData?.message || err.message || "Something went wrong.");
          setValidationErrors([]);
        }
      } else if (err.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err.message || "An unexpected error occurred. Please try again.");
      }

      setTimeout(() => {
        const topEl = document.getElementById("loan-application-form-top");
        if (topEl) {
          topEl.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 100);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  function getAgeFromDOB(dobString) {
    if (!dobString) return null; // handle empty or invalid input

    const dob = new Date(dobString);
    if (isNaN(dob)) return null; // handle invalid date format

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();

    // If birthday hasn't occurred yet this year, subtract one
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age;
  }

  const resetFields = () => {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      officialEmail: "",
      stabilityOfResidency: "",
      currentHouseStatus: "",
      currentLandmark: "",
      permanentHouseStatus: "",
      permanentLandmark: "",
      permanentStability: "",
      currentAddressPinCode: "",
      permanentAddressPinCode: "",
      maritalStatus: "",
      wifeName: "",
      motherName: "",
      companyIdCard: "",
      selfie: "",
      contactNo: "",
      email: "",
      dob: "",
      pan: "",
      currentAddress: "",
      permanentAddress: "",
      addressProofType: "",
      addressProof: "",
      otherDocument: "",
      aadhar: "",
      companyName: "",
      designation: "",
      companyAddress: "",
      monthlySalary: "",
      totalExperience: "",
      currentExperience: "",
      salarySlip: "",
      bankStatement: "",
      photoCopy: "",
      propertyType: "",
      reference1Name: "",
      reference1Contact: "",
      reference2Name: "",
      reference2Contact: "",
      loanAmount: "",

      // New property documents
      allotmentLetter: "",
      newPropertyPaymentReceipts: "",

      // Resale property documents
      titleDeeds: "",
      resalePaymentReceipts: "",
      agreementCopy: "",
      aadharFront: "",
      aadharBack: "",
      panCard: "",
      salarySlip1: "",
      salarySlip2: "",
      salarySlip3: "",
      salaryInHand: "",
      bankStatement1: "",
      bankStatement2: "",
      bankStatement3: "",

      password: "",
      confirmPassword: "",
    });
    setCurrentStep(0);
    setMaxStep(0);
    setError("");
    setFieldErrors({});
    setValidationErrors([]);
    try {
      localStorage.removeItem(loanDraftStorageKey);
    } catch (e) {
      // ignore
    }
  };

  const checkFileSize = (docsQueue) => {
    const viol = findOversizeInLoanDocsQueue(docsQueue);
    if (viol) {
      setError(formatLoanDocOversizeError(viol));
      return false;
    }
    return true;
  };

  return (
    <>
      <DocumentPreviewModal
        url={documentModel}
        onClose={() => setdocumentModel(null)}
      />

      <div
        className={
          embed
            ? "py-4 px-0 sm:px-2"
            : "min-h-screen py-8 px-0 sm:px-4"
        }
        style={{ backgroundColor: embed ? "transparent" : "#F8FAFC" }}
      >
        <div className="max-w-4xl mx-auto">
          {isRmMode && (
            <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-teal-900">
              <p className="font-semibold">
                Completing loan form as RM
                {resumeMeta?.appNo ? ` · App ${resumeMeta.appNo}` : ""}
                {resumeMeta?.status ? ` · ${resumeMeta.status}` : ""}
              </p>
              <p className="text-sm mt-1">
                Prefill any half-filled customer/partner details, finish remaining fields and documents, then submit.
              </p>
              {loadingResume && (
                <p className="text-sm mt-1 text-teal-700">Loading existing application…</p>
              )}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{successMessage}</p>
                  {savedApplication?.appNo && (
                    <p className="text-sm mt-1">
                      Application ID: {savedApplication.appNo}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="text-sm underline"
                  onClick={() => setSuccessMessage("")}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-red-900 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-red-200 p-1 text-red-700 mt-0.5">
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-red-900 text-base">{error}</p>
                    {Array.isArray(validationErrors) && validationErrors.length > 0 && (
                      <ul className="list-disc list-inside mt-2 text-sm space-y-1 bg-white/70 rounded-lg p-3 border border-red-200 font-medium">
                        {validationErrors.map((msg, idx) => (
                          <li key={idx} className="text-red-800">{msg}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:text-red-800 underline font-semibold"
                  onClick={() => { setError(""); setValidationErrors([]); }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Edit Mode Banner for Partner / RM */}
          {isEditingExistingApp && (
            <div className="mb-4 rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4 text-emerald-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-900">
                    Editing Application: {resumeMeta?.appNo || applicationIdQuery}
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Review and update applicant details, loan amounts, and answers below.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-200 text-emerald-800 self-start sm:self-auto">
                Status: {resumeMeta?.status || "In-Progress"}
              </span>
            </div>
          )}

          {/* Customer Trust Banner & Partner Certificate Info */}
          {!isPartnerLoggedIn && (
            <PublicLoanPartnerTrustBanner
              partner={partnerInfo || (defaultReferralCode ? { partnerCode: defaultReferralCode } : null)}
              loanTitle={dynamicLoanTitle}
            />
          )}

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div
              className="px-6 sm:px-8 py-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ backgroundColor: "var(--color-brand-primary)" }}
            >
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {dynamicPageTitle}
                </h1>
                <p className="mt-1 opacity-90 text-xs sm:text-sm">
                  {dynamicSubtitle}
                </p>
              </div>

              {isPartnerLoggedIn && (
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-teal-800 hover:bg-teal-50 font-bold text-xs shadow-md transition transform hover:scale-105 active:scale-95 flex-shrink-0"
                  title="Share customer application link"
                >
                  <Share2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Share Customer Link</span>
                </button>
              )}
            </div>

            <div className="p-6 space-y-6">
              <div id="loan-application-form-top"></div>
              <LoanStepper
                steps={steps}
                currentStep={currentStep}
                maxStep={maxStep}
                loading={loading}
                stepErrorCounts={stepErrorCounts}
                helperText="Step-by-step wizard. Draft is saved locally (text fields only)."
                onStepClick={(idx) => {
                  setError("");
                  setFieldErrors({});
                  setValidationErrors([]);
                  setCurrentStep(idx);
                  requestAnimationFrame(() => {
                    const el = document.querySelector(`[name="${stepFirstFieldName[idx]}"]`);
                    if (el && typeof el.focus === "function") el.focus();
                  });
                }}
              />

              {/* Personal Information */}
              <section id="loan-personal-step" hidden={currentStep !== LOAN_STEP.PERSONAL}>
                <LoanDocsProgress checklist={docChecklistForStep(docChecklist, LOAN_STEP.PERSONAL)} />
                <LoanRequirementFields
                  formData={formData}
                  handleInputChange={handleInputChange}
                  onAmountChange={(digits) =>
                    setFormData((prev) => ({
                      ...prev,
                      loanAmount: digits === "" ? "" : parseInt(digits, 10),
                    }))
                  }
                  renderError={renderError}
                />
                <LoanApplicantFinancialFields
                  formData={formData}
                  handleInputChange={handleInputChange}
                  renderError={renderError}
                  fieldErrors={fieldErrors}
                  showLoanPurpose={false}
                />
                <h2
                  className="text-2xl font-semibold mb-6 flex items-center gap-3"
                  style={{ color: "#111827" }}
                >
                  <User className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                  {LOAN_SECTION.PERSONAL}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* name */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your first name"
                      required
                    />
                    {renderError("firstName")}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Middle Name (Optional)
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your middle name"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your last name"
                      required
                    />
                    {renderError("lastName")}
                  </div>
                  {/* name end */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                        style={{ color: "var(--color-brand-primary)" }}
                      />
                      <input
                        type="tel"
                        name="contactNo"
                        value={formData.contactNo}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        placeholder="Enter your contact number"
                        required
                      />
                    </div>
                    {renderError("contactNo")}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Alternate Mobile (Optional)
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                        style={{ color: "var(--color-brand-primary)" }}
                      />
                      <input
                        type="tel"
                        name="alternateContact"
                        value={formData.alternateContact || ""}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        placeholder="Enter alternate contact number"
                      />
                    </div>
                    {renderError("alternateContact")}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Email *
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                        style={{ color: "var(--color-brand-primary)" }}
                      />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                    {renderError("email")}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      PAN Number *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="pan"
                        value={formData.pan}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        placeholder="Enter pan number"
                        required
                      />
                    </div>
                    {renderError("pan")}
                    <div className="mt-3">
                      {renderDocCard("panCard", "Upload PAN Card", { required: true })}
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                        style={{ color: "var(--color-brand-primary)" }}
                      />
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        required
                      />
                    </div>
                    {renderError("dob")}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={String(formData.gender || "").toLowerCase()}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {renderError("gender")}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Marital Status *
                    </label>
                    <select
                      name="maritalStatus"
                      value={String(formData.maritalStatus || "").toLowerCase()}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: fieldErrors.maritalStatus ? "#EF4444" : "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                    >
                      <option value="">Select Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                    {renderError("maritalStatus")}
                  </div>
                  {isMarriedStatus(formData.maritalStatus) && (
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Spouse Name *
                      </label>
                      <input
                        type="text"
                        name="wifeName"
                        value={formData.wifeName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        placeholder="Enter spouse name"
                        required
                      />
                      {renderError("wifeName")}
                    </div>
                  )}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Mother's Name *
                    </label>
                    <input
                      type="text"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter mother name"
                      required
                    />
                    {renderError("motherName")}
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-200 mt-6">
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "#111827" }}>
                      <FileText className="w-5 h-5 text-teal-600" />
                      {LOAN_DOC_GROUP.AADHAAR}
                    </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderDocCard("aadharFront", "Aadhaar Card (Front)", { required: true })}
                    {renderDocCard("aadharBack", "Aadhaar Card (Back)", { required: true })}
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-200 mt-6">
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "#111827" }}>
                      <FileText className="w-5 h-5 text-teal-600" />
                      {LOAN_DOC_GROUP.PHOTO}
                    </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderDocCard("passportPhoto", "Applicant Photo", { required: true, accept: ".jpg,.jpeg,.png" })}
                    {renderDocCard("otherDocument", "Other Document (Optional)", { hint: OPTIONAL_EXTRA_DOC_CAPTION })}
                  </div>
                </div>
              </section>

              {/* Address Information */}
              <section id="loan-address-step" hidden={currentStep !== LOAN_STEP.ADDRESS}>
                <LoanDocsProgress checklist={docChecklistForStep(docChecklist, LOAN_STEP.ADDRESS)} />
                <h2
                  className="text-2xl font-semibold mb-6 flex items-center gap-3"
                  style={{ color: "#111827" }}
                >
                  <MapPin className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                  {LOAN_SECTION.CURRENT_ADDRESS}
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                      Address (House / Flat / Area) *
                    </label>
                    <textarea
                      name="currentAddress"
                      value={formData.currentAddress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors resize-none"
                      style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                      rows="3"
                      placeholder="House / flat no, building, street, area"
                      required
                    />
                    {renderError("currentAddress")}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                        Landmark *
                      </label>
                      <input
                        type="text"
                        name="currentLandmark"
                        value={formData.currentLandmark ?? ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                        placeholder="Nearby landmark"
                        required
                      />
                      {renderError("currentLandmark")}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        name="currentAddressPinCode"
                        value={formData.currentAddressPinCode ?? ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="6-digit PIN code"
                        required
                      />
                      {renderError("currentAddressPinCode")}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                        House Status *
                      </label>
                      <select
                        name="currentHouseStatus"
                        value={houseStatusOptionValue(formData.currentHouseStatus, ["own", "rented", "parental"])}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                        required
                      >
                        <option value="">Select status</option>
                        <option value="own">Owned</option>
                        <option value="rented">Rented</option>
                        <option value="parental">Parental</option>
                      </select>
                      {renderError("currentHouseStatus")}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                        Years at this Address *
                      </label>
                      <select
                        name="stabilityOfResidency"
                        value={formData.stabilityOfResidency || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                        required
                      >
                        <option value="">Select</option>
                        {stabilityOptionsFor(formData.stabilityOfResidency).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {renderError("stabilityOfResidency")}
                    </div>
                  </div>

                  <div className="pt-2">
                    <LoanAddressProofBlock
                      stepLabel=""
                      file={formData.addressProof}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                      renderError={renderError}
                      uploadStatus={docUploadStatus.addressProof || (formData.addressProof_uploaded ? "uploaded" : "idle")}
                      uploadProgress={docUploadProgress.addressProof || 0}
                      onPreview={() => openDocumentPreview(formData.addressProof)}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="sameAddress"
                      checked={sameAddress}
                      onChange={handleSameAddressChange}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: "var(--color-brand-primary)" }}
                    />
                    <label htmlFor="sameAddress" className="text-sm font-medium" style={{ color: "#111827" }}>
                      {LOAN_FIELD_LABEL.sameAddress}
                    </label>
                  </div>

                  {!sameAddress && (
                    <>
                      <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "#111827" }}>
                        <MapPin className="w-5 h-5 text-teal-600" />
                        {LOAN_SECTION.PERMANENT_ADDRESS}
                      </h3>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                      Address (House / Flat / Area) *
                    </label>
                    <textarea
                      name="permanentAddress"
                      value={formData.permanentAddress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors resize-none"
                      style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                      rows="3"
                      placeholder="House / flat no, building, street, area"
                      required
                    />
                    {renderError("permanentAddress")}
                  </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                        Landmark *
                      </label>
                      <input
                        type="text"
                        name="permanentLandmark"
                        value={formData.permanentLandmark ?? ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                        placeholder="Nearby landmark"
                        required
                      />
                      {renderError("permanentLandmark")}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        name="permanentAddressPinCode"
                        value={formData.permanentAddressPinCode ?? ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="6-digit PIN code"
                        required
                      />
                      {renderError("permanentAddressPinCode")}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                        House Status *
                      </label>
                      <select
                        name="permanentHouseStatus"
                        value={houseStatusOptionValue(formData.permanentHouseStatus, ["own", "rented", "parental"])}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                        required
                      >
                        <option value="">Select status</option>
                        <option value="own">Owned</option>
                        <option value="rented">Rented</option>
                        <option value="parental">Parental</option>
                      </select>
                      {renderError("permanentHouseStatus")}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                        Years at this Address *
                      </label>
                      <select
                        name="permanentStability"
                        value={formData.permanentStability || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                        required
                      >
                        <option value="">Select</option>
                        {stabilityOptionsFor(formData.permanentStability).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {renderError("permanentStability")}
                    </div>
                      </div>
                    </>
                  )}
                </div>
              </section>

              <section id="loan-income-step" hidden={currentStep !== LOAN_STEP.INCOME}>
                <LoanDocsProgress checklist={docChecklistForStep(docChecklist, LOAN_STEP.INCOME)} />
                {/* Employment Information */}
                <div>
                  <h2
                    className="text-2xl font-semibold mb-6 flex items-center gap-3"
                    style={{ color: "#111827" }}
                  >
                    <Building className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                    {LOAN_SECTION.EMPLOYMENT}
                  </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your company name"
                      required
                    />
                    {renderError("companyName")}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Designation *
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your designation"
                      required
                    />
                    {renderError("designation")}
                  </div>
                  <div className="md:col-span-2">
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Company Address *
                    </label>
                    <textarea
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors resize-none"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      rows="2"
                      placeholder="Enter your company address"
                      required
                    />
                    {renderError("companyAddress")}
                  </div>
                  <div className="md:col-span-2">
                    {renderDocCard("companyIdCard", "Company ID Card", { required: true })}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Monthly Salary (₹) *
                    </label>
                    <input
                      type="number"
                      name="monthlySalary"
                      value={formData.monthlySalary}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your monthly salary"
                      min="0"
                      required
                    />
                    {renderError("monthlySalary")}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Salary in Hand (₹) *
                    </label>
                    <input
                      type="number"
                      name="salaryInHand"
                      value={formData.salaryInHand}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your salary in hand"
                      min="0"
                      required
                    />
                    {renderError("salaryInHand")}
                  </div>
                  <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "#111827" }}>
                      <FileText className="w-5 h-5 text-teal-600" />
                      {LOAN_DOC_GROUP.SALARY}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderDocCard("salarySlip1", "Salary Slip (Month 1)", { required: true, accept: ".pdf,application/pdf" })}
                      {renderDocCard("salarySlip2", "Salary Slip (Month 2)", { required: true, accept: ".pdf,application/pdf" })}
                      {renderDocCard("salarySlip3", "Salary Slip (Month 3)", { required: true, accept: ".pdf,application/pdf" })}
                      {renderDocCard("form16_26as", "Form 16 / 26AS (Optional)")}
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Total Experience (Years) *
                    </label>
                    <div className="relative">
                      <Briefcase
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                        style={{ color: "var(--color-brand-primary)" }}
                      />
                      <input
                        type="number"
                        name="totalExperience"
                        value={formData.totalExperience}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        placeholder="0"
                        min="0"
                        required
                      />
                      {renderError("totalExperience")}
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Current Company Experience (Years) *
                    </label>
                    <input
                      type="number"
                      name="currentExperience"
                      value={formData.currentExperience}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="0"
                      min="0"
                      required
                    />
                    {renderError("currentExperience")}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Salary Receipt Mode (Optional)
                    </label>
                    <select
                      name="salaryReceiptMode"
                      value={formData.salaryReceiptMode || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                    >
                      <option value="">Select salary receipt mode</option>
                      {SALARY_RECEIPT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Official Email (Optional)
                    </label>
                    <input
                      type="email"
                      name="officialEmail"
                      value={formData.officialEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your official email"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Product Custom Fields */}
              {dynamicProduct?.customFields?.length > 0 && (
                <div>
                  <div className="pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2.5 py-1 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 text-xs font-bold uppercase tracking-wider">
                        {dynamicLoanTitle} Specific
                      </span>
                      <h3 className="text-base font-bold text-slate-800">
                        Additional Loan Information
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {dynamicProduct.customFields.map((field) => (
                        <div
                          key={field.fieldKey}
                          className={field.gridCol === 12 ? "col-span-1 md:col-span-2" : "col-span-1"}
                        >
                          <label className="block text-sm font-medium mb-2 text-slate-900">
                            {field.label} {field.validation?.required ? "*" : ""}
                          </label>
                          {field.fieldType === "select" ? (
                            <select
                              name={field.fieldKey}
                              value={formData[field.fieldKey] || ""}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors"
                              style={{
                                borderColor: fieldErrors[field.fieldKey]
                                  ? "#EF4444"
                                  : "var(--color-brand-primary)",
                                backgroundColor: "#F8FAFC",
                              }}
                              required={field.validation?.required}
                            >
                              <option value="">{field.placeholder || `Select ${field.label}`}</option>
                              {field.options?.map((opt, oIdx) => (
                                <option key={oIdx} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : field.fieldType === "textarea" ? (
                            <textarea
                              name={field.fieldKey}
                              value={formData[field.fieldKey] || ""}
                              onChange={handleInputChange}
                              rows="3"
                              placeholder={field.placeholder || `Enter ${field.label}`}
                              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors resize-none"
                              style={{
                                borderColor: fieldErrors[field.fieldKey]
                                  ? "#EF4444"
                                  : "var(--color-brand-primary)",
                                backgroundColor: "#F8FAFC",
                              }}
                              required={field.validation?.required}
                            />
                          ) : (
                            <input
                              type={
                                field.fieldType === "number" || field.fieldType === "currency"
                                  ? "number"
                                  : "text"
                              }
                              name={field.fieldKey}
                              value={formData[field.fieldKey] || ""}
                              onChange={handleInputChange}
                              placeholder={field.placeholder || `Enter ${field.label}`}
                              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors"
                              style={{
                                borderColor: fieldErrors[field.fieldKey]
                                  ? "#EF4444"
                                  : "var(--color-brand-primary)",
                                backgroundColor: "#F8FAFC",
                              }}
                              required={field.validation?.required}
                            />
                          )}
                          {renderError(field.fieldKey)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

                {/* Bank Details Section */}
                <div className="pt-6 border-t border-slate-200 mt-6">
                  <h3
                    className="text-lg font-semibold mb-2 flex items-center gap-2"
                    style={{ color: "#111827" }}
                  >
                    <FileText className="w-5 h-5 text-teal-600" />
                    Bank Statements
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Upload statements in sequence: Bank Statement 1, then Bank Statement 2.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { name: "bankStatement1", label: "Bank Statement 1", required: true, accept: ".pdf,application/pdf" },
                      { name: "bankStatement2", label: "Bank Statement 2", required: false, accept: ".pdf,application/pdf" },
                    ].map((doc) => (
                      <DocumentUploadCard
                        key={doc.name}
                        name={doc.name}
                        label={doc.label}
                        file={formData[doc.name]}
                        accept={doc.accept}
                        required={doc.required}
                        hint={loanDocumentFieldHint(doc.name)}
                        onChange={handleFileChange}
                        onRemove={handleFileRemove}
                        error={renderError(doc.name)}
                        uploadStatus={docUploadStatus[doc.name] || (formData[`${doc.name}_uploaded`] ? "uploaded" : "idle")}
                        uploadProgress={docUploadProgress[doc.name] || 0}
                        onPreview={() => openDocumentPreview(formData[doc.name])}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Bank Statement Password (Optional)
                      </label>
                      <input
                        type="text"
                        name="bankStatementPassword"
                        value={formData.bankStatementPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        placeholder="Password (if protected)"
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Product Required Documents */}
                {dynamicProduct?.requiredDocuments?.length > 0 && (
                  <div className="pt-6 border-t border-slate-200 mt-6">
                    <h3
                      className="text-lg font-semibold mb-2 flex items-center gap-2"
                      style={{ color: "#111827" }}
                    >
                      <FileText className="w-5 h-5 text-teal-600" />
                      {dynamicLoanTitle} Specific Documents
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Upload documents configured specifically for this loan application.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {dynamicProduct.requiredDocuments.map((doc) => (
                        <DocumentUploadCard
                          key={doc.docType}
                          name={doc.docType}
                          label={`${doc.label}${doc.required ? " *" : ""}`}
                          file={formData[doc.docType]}
                          accept={doc.acceptTypes?.join(",") || ".pdf,.jpg,.jpeg,.png"}
                          required={doc.required}
                          hint={doc.description || loanDocumentFieldHint(doc.docType)}
                          onChange={handleFileChange}
                          onRemove={handleFileRemove}
                          error={renderError(doc.docType)}
                          uploadStatus={
                            docUploadStatus[doc.docType] ||
                            (formData[`${doc.docType}_uploaded`] ? "uploaded" : "idle")
                          }
                          uploadProgress={docUploadProgress[doc.docType] || 0}
                          onPreview={() => openDocumentPreview(formData[doc.docType])}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>


              {/* References */}
              <section id="loan-references-step" hidden={currentStep !== LOAN_STEP.REFERENCES}>
                <h2
                  className="text-2xl font-semibold mb-6 flex items-center gap-3"
                  style={{ color: "#111827" }}
                >
                  <Users className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                  References
                </h2>
                <div className="space-y-6">
                  <div
                    className="p-6 rounded-lg border-2"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                  >
                    <h3
                      className="text-lg font-semibold mb-4"
                      style={{ color: "#F59E0B" }}
                    >
                      Reference 1
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Name *
                        </label>
                        <input
                          type="text"
                          name="reference1Name"
                          value={formData.reference1Name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "white",
                          }}
                          placeholder="Enter reference name"
                          required
                        />
                        {renderError("reference1Name")}
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Contact Number *
                        </label>
                        <input
                          type="tel"
                          name="reference1Contact"
                          value={formData.reference1Contact}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "white",
                          }}
                          placeholder="Enter contact number"
                          required
                        />
                        {renderError("reference1Contact")}
                      </div>
                    </div>
                  </div>
                  <div
                    className="p-6 rounded-lg border-2"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                  >
                    <h3
                      className="text-lg font-semibold mb-4"
                      style={{ color: "#F59E0B" }}
                    >
                      Reference 2
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Name *
                        </label>
                        <input
                          type="text"
                          name="reference2Name"
                          value={formData.reference2Name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "white",
                          }}
                          placeholder="Enter reference name"
                          required
                        />
                        {renderError("reference2Name")}
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Contact Number *
                        </label>
                        <input
                          type="tel"
                          name="reference2Contact"
                          value={formData.reference2Contact}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "white",
                          }}
                          placeholder="Enter contact number"
                          required
                        />
                        {renderError("reference2Contact")}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Review & Password Section */}
              <section id="loan-review-step" hidden={currentStep !== LOAN_STEP.REVIEW}>
                <LoanReviewSummary
                  sections={reviewSections}
                  docChecklist={docChecklist}
                  onEdit={goToStep}
                  editable={!loading}
                />

                {showPasswordFields && (
                  <div className="mt-8">
                    <h2
                      className="text-2xl font-semibold mb-6 flex items-center gap-3"
                      style={{ color: "#111827" }}
                    >
                      {LOAN_SECTION.ACCOUNT}
                    </h2>
                    <p className="text-sm text-slate-500 -mt-4 mb-4">
                      Optional. Leave blank and a customer password will be generated automatically.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.password ? "text" : "password"}
                            name="password"
                            value={formData.password || ""}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                            style={{
                              borderColor: "var(--color-brand-primary)",
                              backgroundColor: "white",
                            }}
                            placeholder="Enter password (min 6 characters)"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((prev) => ({
                                ...prev,
                                password: !prev.password,
                              }))
                            }
                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword.password ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {renderError("password")}
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.confirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword || ""}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                            style={{
                              borderColor: "var(--color-brand-primary)",
                              backgroundColor: "white",
                            }}
                            placeholder="Re-enter password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((prev) => ({
                                ...prev,
                                confirmPassword: !prev.confirmPassword,
                              }))
                            }
                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword.confirmPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {renderError("confirmPassword")}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Partner Referral — public applicants only (e.g. from home); hidden in partner dashboard */}
              {!isPartnerLoggedIn && (
                <section hidden={currentStep !== LOAN_STEP.REVIEW}>
                  <h2
                    className="text-2xl font-semibold mb-6 flex items-center gap-3"
                    style={{ color: "#111827" }}
                  >
                    <FileText className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                    Partner Referral
                  </h2>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Partner Referral Code (optional) - use {defaultReferralCode} if you don&apos;t have a partner code
                      </label>
                      <input
                        type="text"
                        name="partnerReferralCode"
                        value={formData.partnerReferralCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        placeholder="Enter partner code"
                      />
                    </div>
                  </div>
                </section>
              )}

            {/* Submit + Wizard Navigation */}
            <div className="pt-8">
              {currentStep === steps.length - 1 && successMessage && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                  <p className="font-semibold">{successMessage}</p>
                  {savedApplication?.appNo && (
                    <p className="text-sm mt-1">
                      Application ID: {savedApplication.appNo}
                    </p>
                  )}
                </div>
              )}

              {currentStep === steps.length - 1 && error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                  <p className="font-semibold">{error}</p>
                  {Array.isArray(validationErrors) && validationErrors.length > 0 && (
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                      {validationErrors.map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {editingFromReview && (
                <p className="mb-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
                  {LOAN_REVIEW_EDIT_HINT}
                </p>
              )}
              <div className={`flex items-center gap-4 ${editingFromReview ? "justify-end" : "justify-between"}`}>
                {!editingFromReview && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  disabled={loading || currentStep === 0}
                >
                  Back
                </button>
                )}

                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-8 py-3 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-200"
                    style={{ backgroundColor: "var(--color-brand-primary)" }}
                    disabled={loading}
                  >
                    {editingFromReview ? LOAN_BACK_TO_REVIEW_LABEL : "Next"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-12 py-4 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-200"
                    style={{ backgroundColor: "var(--color-brand-primary)" }}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Submit Loan"}
                  </button>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {isPartnerLoggedIn && (
        <ShareLoanModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          loan={{
            id: dynamicProduct?.code?.toLowerCase() || loanTypeCode.toLowerCase(),
            title: dynamicLoanTitle,
            badge: dynamicProduct?.badgeText || "Instant Approval",
            route: `/partner/personal-loan?type=${dynamicProduct?.code || loanTypeCode}`,
            hasSubTypes: false,
          }}
          partnerCode={currentPartnerCode}
          partnerName={currentPartnerName}
        />
      )}
    </>
  );
}
