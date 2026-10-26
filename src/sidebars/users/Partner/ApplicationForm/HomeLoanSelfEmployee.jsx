//updTED CODE

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Building,
  Store,
  Users,
  Receipt,
  Home,
  X,
  Eye,
  EyeOff,
  Share2,
} from "lucide-react";
import axios from "axios";
import { loanAmountRangeError } from "../../../../utils/loanAmountRule";
import toast from "react-hot-toast";
import { z } from "zod";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import DocumentPreviewModal from "../../../../components/loan/DocumentPreviewModal";
import PublicLoanPartnerTrustBanner from "../../../../components/loan/PublicLoanPartnerTrustBanner";
import ShareLoanModal from "../../../../components/loan/ShareLoanModal";
import LoanReviewSummary, { LoanDocsProgress } from "../../../../components/loan/LoanReviewSummary";
import LoanRequirementFields from "../../../../components/loan/LoanRequirementFields";
import {
  LOAN_FIELD_LABEL,
  LOAN_PROFILE,
  LOAN_SECTION,
  LOAN_STABILITY_OPTIONS,
  LOAN_STEP,
  buildLoanDocChecklist,
  docChecklistForStep,
  LOAN_DOC_GROUP,
  buildLoanReviewSections,
  getLoanSteps,
  resolveLoanNextStep,
  LOAN_BACK_TO_REVIEW_LABEL,
  LOAN_REVIEW_EDIT_HINT,
  LOAN_STEP_LAYOUT_VERSION,
} from "../../../../components/loan/loanFormSpec";
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
  personFinancialCustomerFields,
  validatePersonFinancialFields,
} from "../../../../utils/personFinancial";
import { persistLeadWizardProgress } from "../../../../utils/saveLeadProgress";
import {
  useRmLoanFormResume,
  rmCompleteLoanFormUrl,
  partnerCompleteLoanFormUrl,
} from "../../../../utils/rmLoanForm";
import {
  customerPasswordErrors,
  dobError,
  houseStatusOptionValue,
  isMarriedStatus,
  normalizeGenderForApi,
  normalizeMaritalStatusForApi,
} from "../../../../utils/normalizeLoanPayload";

export default function HomeLoanSelfEmployee({ embed = false, actorRole = "auto" } = {}) {
  const navigate = useNavigate();
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

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    alternateContact: "",
    email: "",
    gender: "",


    motherName: "",
    maritalStatus: "",
    SpouseName: "",
    panNumber: "",

    // Address Information
    currentAddress: "",
    currentAddressPincode: "",
    currentAddressOwnRented: "",
    currentAddressStability: "",
    currentAddressLandmark: "",
    permanentAddress: "",
    permanentAddressPincode: "",
    permanentAddressOwnRented: "",
    permanentAddressStability: "",
    permanentAddressLandmark: "",

    // Business Information
    businessName: "",
    businessAddress: "",
    businessLandmark: "",
    businessVintage: "",

    // Property Information
    propertyType: "NEW_PROPERTY",
    propertyValue: "",
    propertyAddress: "",

    // Property Documents
    allotmentLetter: null,
    agreementCopy: null,
    titleDeeds: null,
    newPropertyPaymentReceipts: null,
    resalePaymentReceipts: null,

    // Documents
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    addressProof: null,


    shopPhoto: null,
    shopAct: null,
    udhyamAadhar: null,
    itr: null,

    gstNumber: "",
    gstDoc: null,
    bankStatementFile1: null,
    bankStatementFile2: null,
    businessOtherDocs: null,
    selfie: null,

    // Co-applicant
    hasCoApplicant: true,
    coApplicantAadharFront: null,
    coApplicantAadharBack: null,
    coApplicantPan: null,
    coApplicantMobile: "",
    coApplicantSelfie: null,

    // Legacy fields (keeping for compatibility)
    password: "",
    confirmPassword: "",
    fullName: "",
    dob: "",
    shopName: "",
    reference1Name: "",
    reference1Contact: "",
    reference2Name: "",
    reference2Contact: "",
    otherDocs: null,
    annualTurnover: "",
    partnerReferralCode: "",
    loanAmount: "",
    bankStatementPassword: "",
    hasRunningLoan: "NO",
    monthlyEmiPaying: "",
    loanPurpose: "",
    salaryInHand: "",
    salaryReceiptMode: "",
    cibilScoreBand: "",
    hasBounce: "NO",
    bounceCount: "",
  });

  const [sameAddress, setSameAddress] = useState(false);
  const [documentModel, setdocumentModel] = useState(null);
  const [applicationId, setApplicationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [savedApplication, setSavedApplication] = useState(null);
  const [docUploadStatus, setDocUploadStatus] = useState({});
  const [docUploadProgress, setDocUploadProgress] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [isCheckingExistence, setIsCheckingExistence] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const abortControllerRef = useRef(null);

  const [searchParams] = useSearchParams();
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

  const loanDraftStorageKey = embed
    ? "dhansource.homeLoanSelfEmployeeDraft.embed.v1"
    : "dhansource.homeLoanSelfEmployeeDraft.v1";
  const steps = getLoanSteps({ profile: LOAN_PROFILE.BUSINESS, hasProperty: true });
  const [currentStep, setCurrentStep] = useState(0);
  const [editingFromReview, setEditingFromReview] = useState(false);
  const [maxStep, setMaxStep] = useState(0);

  const stepFirstFieldName = useMemo(
    () => [
      "loanAmount",
      "currentAddress",
      "businessName",
      "reference1Name",
      showPasswordFields ? "password" : isPartnerLoggedIn ? "reference2Contact" : "partnerReferralCode",
    ],
    [isPartnerLoggedIn, showPasswordFields]
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

  const stepAnchorIds = [
    "loan-personal-step",
    "loan-address-step",
    "loan-income-step",
    "loan-references-step",
    "loan-review-step",
  ];

  // Cleanup function to cancel pending requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (documentModel && documentModel.startsWith("blob:")) {
        URL.revokeObjectURL(documentModel);
      }
    };
  }, [documentModel]);

  const openDocumentPreview = (docValue) => {
    if (!docValue) return;
    const url =
      docValue?.preview
        ? docValue.preview
        : docValue instanceof File
        ? URL.createObjectURL(docValue)
        : "";
    if (url) setdocumentModel(url);
  };
  useEffect(() => {
    if (successMessage) toast.success(successMessage);
  }, [successMessage]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const serializeDraftFormData = (data) => {
    const copy = { ...data };
    for (const key of Object.keys(copy)) {
      const v = copy[key];
      if (v instanceof File) copy[key] = null;
    }
    return copy;
  };

  useEffect(() => {
    if (isEditingExistingApp) return;
    try {
      const raw = localStorage.getItem(loanDraftStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.formData) setFormData((prev) => ({ ...prev, ...parsed.formData, hasCoApplicant: true }));
      if (parsed?.stepLayout === LOAN_STEP_LAYOUT_VERSION && typeof parsed?.currentStep === "number") {
        setCurrentStep(Math.max(0, Math.min(parsed.currentStep, steps.length - 1)));
      }
      if (parsed?.stepLayout === LOAN_STEP_LAYOUT_VERSION && typeof parsed?.maxStep === "number") {
        setMaxStep(Math.max(0, Math.min(parsed.maxStep, steps.length - 1)));
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEditingExistingApp) return undefined;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          loanDraftStorageKey,
          JSON.stringify({
            currentStep,
            stepLayout: LOAN_STEP_LAYOUT_VERSION,
            maxStep,
            formData: serializeDraftFormData(formData),
          })
        );
      } catch (e) {
        // ignore
      }
    }, 400);
    return () => clearTimeout(t);
  }, [currentStep, maxStep, formData, isEditingExistingApp]);

  const scrollToFirstError = (errorMap) => {
    const keys = Object.keys(errorMap || {});
    if (keys.length === 0) return;
    const firstKey = keys[0];
    const el = document.querySelector(`[name="${firstKey}"]`);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof el.focus === "function") el.focus();
    }
  };

  const phoneSchema = z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits.");
  const emailSchema = z.string().trim().email("Invalid email format.");
  const pinSchema = z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code.");
  const panSchema = z
    .string()
    .trim()
    .regex(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/, "Enter a valid PAN card number (e.g., ABCDE1234F).")
    .transform((s) => s.toUpperCase());

  const min3 = (msg) => z.string().trim().min(3, msg);

  function validateHomeLoanSelfEmployeeStep(stepIndex) {
    const fullErrors = validateForm(formData, sameAddress);

    const stepFields = (() => {
      if (stepIndex === LOAN_STEP.PERSONAL) {
        return [
          "loanAmount",
          "loanPurpose",
          "hasRunningLoan",
          "monthlyEmiPaying",
          "cibilScoreBand",
          "hasBounce",
          "bounceCount",
          "firstName",
          "middleName",
          "lastName",
          "phone",
          "alternateContact",
          "email",
          "panNumber",
          "panCard",
          "dob",
          "gender",
          "maritalStatus",
          "SpouseName",
          "motherName",
          "aadharFront",
          "aadharBack",
          "selfie",
          "passportPhoto",
          "otherDocs",
          ...(formData.hasCoApplicant
            ? [
                "coApplicantMobile",
                "coApplicantPan",
                "coApplicantSelfie",
                "coApplicantAadharFront",
                "coApplicantAadharBack",
              ]
            : []),
        ];
      }
      if (stepIndex === LOAN_STEP.ADDRESS) {
        return [
          "currentAddress",
          "currentAddressLandmark",
          "currentAddressPincode",
          "currentAddressOwnRented",
          "currentAddressStability",
          "addressProof",
          "permanentAddress",
          "permanentAddressLandmark",
          "permanentAddressPincode",
          "permanentAddressOwnRented",
          "permanentAddressStability",
        ];
      }
      if (stepIndex === LOAN_STEP.INCOME) {
        return [
          "businessName",
          "businessAddress",
          "businessLandmark",
          "shopAct",
          "udhyamAadhar",
          "shopPhoto",
          "businessOtherDocs",
          "businessVintage",
          "annualTurnover",
          "itr",
          "gstNumber",
          "gstDoc",
          "propertyType",
          "propertyValue",
          "propertyAddress",
          "allotmentLetter",
          "titleDeeds",
          "newPropertyPaymentReceipts",
          "resalePaymentReceipts",
          "agreementCopy",
          "bankStatementFile1",
          "bankStatementFile2",
          "bankStatementPassword",
        ];
      }
      if (stepIndex === LOAN_STEP.REFERENCES) {
        return ["reference1Name", "reference1Contact", "reference2Name", "reference2Contact"];
      }
      // Review step — password lives here
      if (stepIndex === LOAN_STEP.REVIEW) {
        return [
          ...(showPasswordFields ? ["password", "confirmPassword"] : []),
          ...(!isPartnerLoggedIn ? ["partnerReferralCode"] : []),
        ];
      }
      return [];
    })();

    const errors = {};
    for (const key of stepFields) {
      if (fullErrors[key]) errors[key] = fullErrors[key];
    }

    // Zod overlays for fintech-level niceties
    if (stepIndex === LOAN_STEP.PERSONAL) {
      const rFirst = min3("First name must be at least 3 characters.").safeParse(formData.firstName);
      if (!rFirst.success) errors.firstName = rFirst.error.issues[0].message;
      const rLast = min3("Last name must be at least 3 characters.").safeParse(formData.lastName);
      if (!rLast.success) errors.lastName = rLast.error.issues[0].message;
      const rMother = min3("Mother name must be at least 3 characters.").safeParse(formData.motherName);
      if (!rMother.success) errors.motherName = rMother.error.issues[0].message;

      const rPhone = phoneSchema.safeParse(formData.phone);
      if (!rPhone.success) errors.phone = rPhone.error.issues[0].message;
      const rEmail = emailSchema.safeParse(formData.email);
      if (!rEmail.success) errors.email = rEmail.error.issues[0].message;
      const rPan = panSchema.safeParse(formData.panNumber);
      if (!rPan.success) errors.panNumber = rPan.error.issues[0].message;
    }

    if (stepIndex === LOAN_STEP.ADDRESS) {
      const rPin = pinSchema.safeParse(String(formData.currentAddressPincode ?? ""));
      if (!rPin.success) errors.currentAddressPincode = rPin.error.issues[0].message;
      if (!sameAddress) {
        const rPermPin = pinSchema.safeParse(String(formData.permanentAddressPincode ?? ""));
        if (!rPermPin.success) errors.permanentAddressPincode = rPermPin.error.issues[0].message;
      }
    }

    return errors;
  }
  const stepErrorCounts = steps.map((_, idx) =>
    Object.keys(validateHomeLoanSelfEmployeeStep(idx)).length
  );

  const docChecklist = buildLoanDocChecklist(
    [
      { key: "panCard", label: "PAN Card", required: true, step: LOAN_STEP.PERSONAL },
      { key: "selfie", altKeys: ["passportPhoto"], label: "Applicant Photo", required: true, step: LOAN_STEP.PERSONAL },
      { key: "aadharFront", label: "Aadhaar Front", required: true, step: LOAN_STEP.PERSONAL },
      { key: "aadharBack", label: "Aadhaar Back", required: true, step: LOAN_STEP.PERSONAL },
      { key: "otherDocs", label: "Other Document", required: false, step: LOAN_STEP.PERSONAL },
      { key: "addressProof", label: "Address Proof", required: true, step: LOAN_STEP.ADDRESS },
      { key: "shopAct", label: "Shop Act / Gumasta License", required: true, step: LOAN_STEP.INCOME },
      { key: "udhyamAadhar", label: "Udhyam Aadhar", required: true, step: LOAN_STEP.INCOME },
      { key: "itr", label: "ITR (Last 3 Years)", required: true, step: LOAN_STEP.INCOME },
      { key: "gstDoc", label: "GST Document", required: false, step: LOAN_STEP.INCOME },
      { key: "shopPhoto", label: "Shop Photo", required: true, step: LOAN_STEP.INCOME },
      { key: "businessOtherDocs", label: "Other Business Docs", required: false, step: LOAN_STEP.INCOME },
      { key: "bankStatementFile1", label: "Bank Statement 1", required: true, step: LOAN_STEP.INCOME },
      { key: "bankStatementFile2", label: "Bank Statement 2", required: false, step: LOAN_STEP.INCOME },
      { key: "allotmentLetter", label: "Allotment Letter / Agreement Copy", required: false, step: LOAN_STEP.INCOME },
      { key: "titleDeeds", label: "Title Deeds / Chain Documents", required: false, step: LOAN_STEP.INCOME },
      { key: "newPropertyPaymentReceipts", label: "Property Payment Receipts", required: false, step: LOAN_STEP.INCOME },
      { key: "resalePaymentReceipts", label: "Resale Payment Receipts", required: false, step: LOAN_STEP.INCOME },
      { key: "agreementCopy", label: "Registered Agreement / Draft Agreement", required: false, step: LOAN_STEP.INCOME },
      ...(formData.hasCoApplicant
        ? [
            { key: "coApplicantAadharFront", label: "Co-Applicant Aadhaar Front", required: true, step: LOAN_STEP.PERSONAL },
            { key: "coApplicantAadharBack", label: "Co-Applicant Aadhaar Back", required: true, step: LOAN_STEP.PERSONAL },
            { key: "coApplicantPan", label: "Co-Applicant PAN Card", required: true, step: LOAN_STEP.PERSONAL },
            { key: "coApplicantSelfie", label: "Co-Applicant Selfie", required: true, step: LOAN_STEP.PERSONAL },
          ]
        : []),
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
    profile: LOAN_PROFILE.BUSINESS,
    hasProperty: true,
    hasCoApplicant: Boolean(formData.hasCoApplicant),
    sameAddress,
    loanTitle: "Home Loan (Self-Employed)",
  });

  const stabilityOptionsFor = (value) =>
    value && !LOAN_STABILITY_OPTIONS.some((o) => o.value === value)
      ? [{ label: value, value }, ...LOAN_STABILITY_OPTIONS]
      : LOAN_STABILITY_OPTIONS;

  const scrollToStep = (idx) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(stepAnchorIds[idx]);
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  const goToStep = (idx) => {
    setError("");
    setFieldErrors({});
    setValidationErrors([]);
    setEditingFromReview(idx !== LOAN_STEP.REVIEW);
    setCurrentStep(idx);
    scrollToStep(idx);
  };

  // const handleInputChange = (e) => {
  //     const { name, value } = e.target;
  //     setFormData((prev) => ({
  //       ...prev,
  //       [name]: value,
  //     }));
  //   };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]:
          name === "loanAmount"
            ? value === ""      // if empty, keep empty string
              ? ""
              : parseInt(value, 10)
            : value,
      };
      if (sameAddress && name.startsWith("currentAddress")) {
        next[name.replace(/^currentAddress/, "permanentAddress")] = value;
      }
      return next;
    });
  
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
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
    }));

    const toastId = toast.loading(`Uploading ${file.name}...`);
    setDocUploadStatus((p) => ({ ...p, [name]: "uploading" }));
    setDocUploadProgress((p) => ({ ...p, [name]: 25 }));

    if (applicationId) {
      uploadLeadDocumentEarly({
        applicationId,
        partnerToken,
        isPartnerLoggedIn,
        fieldName: name,
        file,
        onProgress: (pct) => setDocUploadProgress((p) => ({ ...p, [name]: pct })),
      }).then((res) => {
        if (res?.ok) {
          setDocUploadStatus((p) => ({ ...p, [name]: "uploaded" }));
          setDocUploadProgress((p) => ({ ...p, [name]: 100 }));
          toast.success(`${file.name} uploaded successfully!`, { id: toastId });
        } else {
          setDocUploadStatus((p) => ({ ...p, [name]: "failed" }));
          toast.error(`Upload failed for ${file.name}`, { id: toastId });
        }
      });
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
    }));
    setDocUploadStatus((p) => ({ ...p, [fieldName]: "idle" }));
    setDocUploadProgress((p) => ({ ...p, [fieldName]: 0 }));
    const fileInput = document.querySelector(`input[name="${fieldName}"]`);
    if (fileInput) fileInput.value = "";
  };

  const handleSameAddressChange = (e) => {
    setSameAddress(e.target.checked);
    if (e.target.checked) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: prev.currentAddress,
        permanentAddressPincode: prev.currentAddressPincode,
        permanentAddressOwnRented: prev.currentAddressOwnRented,
        permanentAddressStability: prev.currentAddressStability,
        permanentAddressLandmark: prev.currentAddressLandmark,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: "",
        permanentAddressPincode: "",
        permanentAddressOwnRented: "",
        permanentAddressStability: "",
        permanentAddressLandmark: "",
      }));
    }
  };

  const renderError = (field) =>
    fieldErrors[field] ? (
      <p className="text-xs text-red-600 mt-1">{fieldErrors[field]}</p>
    ) : null;



  function validateForm(formData, sameAddress) {
    const errors = {};

    // Personal info
    if (!formData.firstName) errors.firstName = "First name is required.";
    if (!formData.lastName) errors.lastName = "Last name is required.";
    if (!formData.motherName) errors.motherName = "Mother name is required.";

    if (!formData.gender) errors.gender = "Gender is required.";
    if (!formData.maritalStatus) errors.maritalStatus = "Marital status is required.";
    // Spouse name required if married
    if (isMarriedStatus(formData.maritalStatus) && !String(formData.SpouseName || "").trim()) {
      errors.SpouseName = "Spouse name is required for married applicants.";
    }
    const dobMessage = dobError(formData.dob);
    if (dobMessage) errors.dob = dobMessage;
    if (showPasswordFields) {
      Object.assign(errors, customerPasswordErrors(formData));
    }

    if (!formData.loanPurpose) {
      errors.loanPurpose = "Loan purpose is required.";
    }
    if (formData.hasRunningLoan === "YES" && (!formData.monthlyEmiPaying || Number(formData.monthlyEmiPaying) <= 0)) {
      errors.monthlyEmiPaying = "Monthly EMI is required when running loan is Yes.";
    }
    Object.assign(errors, validatePersonFinancialFields(formData));


    if (!formData.phone) {
      errors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      errors.phone = "Phone number must be 10 digits.";
    }
    if (formData.alternateContact && !/^\d{10}$/.test(String(formData.alternateContact).trim())) {
      errors.alternateContact = "Alternate number must be exactly 10 digits.";
    }

    if (!formData.email) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Invalid email format.";
    }
    // if (!formData.panNumber) errors.panNumber = "Pan Card Number is required."

    if (!formData.panNumber) {
      errors.panNumber = "PAN Card Number is required";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(formData.panNumber).toUpperCase())) {
      errors.panNumber = "Enter a valid PAN Card number (e.g., ABCDE1234F)";
    }


    // Current address
    if (!formData.currentAddress)
      errors.currentAddress = "Current address is required.";

    // if (!formData.currentAddressPincode)
    //   errors.currentAddressPincode = "Pincode is required.";

    const pin = String(formData.currentAddressPincode ?? "").trim();

    if (!pin) {
      errors.currentAddressPincode = "Current Address Pin is required.";
    } else if (!/^[1-9][0-9]{5}$/.test(pin)) {
      errors.currentAddressPincode = "Enter a valid 6-digit PIN code.";
    }


    if (!formData.currentAddressOwnRented)
      errors.currentAddressOwnRented = "Ownership status is required.";
    if (!formData.currentAddressStability)
      errors.currentAddressStability = "Stability is required.";
    if (!String(formData.currentAddressLandmark || "").trim())
      errors.currentAddressLandmark = "Landmark is required.";

    // Permanent address if not same
    if (!sameAddress) {
      if (!formData.permanentAddress)
        errors.permanentAddress = "Permanent address is required.";
      if (!String(formData.permanentAddressLandmark || "").trim())
        errors.permanentAddressLandmark = "Landmark is required.";

      // if (!formData.permanentAddressPincode)
      //   errors.permanentAddressPincode = "Pincode is required.";

      const permanentPin = String(formData.permanentAddressPincode ?? "").trim();

      if (!permanentPin) {
        errors.permanentAddressPincode = "Permanent Address Pin is required.";
      } else if (!/^[1-9][0-9]{5}$/.test(permanentPin)) {
        errors.permanentAddressPincode = "Enter a valid 6-digit PIN code.";
      }


      if (!formData.permanentAddressOwnRented)
        errors.permanentAddressOwnRented = "Ownership status is required.";
      if (!formData.permanentAddressStability)
        errors.permanentAddressStability = "Stability is required.";
    }


    const loanAmountError = loanAmountRangeError(formData.loanAmount);
    if (loanAmountError) errors.loanAmount = loanAmountError;


    // At least one address proof
    if (!formData.addressProof) {
      errors.addressProof = "Address proof is required.";
    }

    
    if (!formData.aadharFront) errors.aadharFront = "Aadhar Front is required";
    if (!formData.aadharBack) errors.aadharBack = "Aadhar Back is required";
    if (!formData.panCard) errors.panCard = "Pan card document is required.";
    if (!formData.selfie && !formData.passportPhoto) {
      errors.selfie = "Applicant photo is required.";
    }


    // Business info
    if (!formData.businessName)
      errors.businessName = "Business name is required.";
    if (!formData.businessAddress)
      errors.businessAddress = "Business address is required.";
    if (!(Number(formData.businessVintage) > 0))
      errors.businessVintage = "Business vintage must be greater than zero.";
    if (!(Number(formData.annualTurnover) > 0))
      errors.annualTurnover = "Annual turnover must be greater than zero.";

    // Property info
    if (!formData.propertyType)
      errors.propertyType = "Property type is required.";
    if (!(Number(formData.propertyValue) > 0))
      errors.propertyValue = "Property estimated value must be greater than zero.";
    if (!formData.propertyAddress)
      errors.propertyAddress = "Property address is required.";


    // Co-applicant validation
    if (formData.hasCoApplicant) {
      if (!formData.coApplicantAadharFront)
        errors.coApplicantAadharFront = "Co-applicant Aadhar front is required.";
      if (!formData.coApplicantAadharBack)
        errors.coApplicantAadharBack = "Co-applicant Aadhar back is required.";
      if (!formData.coApplicantPan)
        errors.coApplicantPan = "Co-applicant PAN is required.";
      if (!formData.coApplicantMobile)
        errors.coApplicantMobile = "Co-applicant mobile is required.";
      else if (!/^\d{10}$/.test(formData.coApplicantMobile)) {
        errors.coApplicantMobile = "Mobile must be 10 digits.";
      }
      if (!formData.coApplicantSelfie)
        errors.coApplicantSelfie = "Co-applicant selfie is required.";
    }

     // Reference 1
     if (!formData.reference1Name)
      errors.reference1Name = "Reference 1 name is required.";

    if (!formData.reference1Contact) {
      errors.reference1Contact = "Reference 1 contact is required.";
    } else if (!/^\d{10}$/.test(formData.reference1Contact)) {
      errors.reference1Contact = "Reference 1 contact must be exactly 10 digits.";
    }

    // Reference 2
    if (!formData.reference2Name)
      errors.reference2Name = "Reference 2 name is required.";

    if (!formData.reference2Contact) {
      errors.reference2Contact = "Reference 2 contact is required.";
    } else if (!/^\d{10}$/.test(formData.reference2Contact)) {
      errors.reference2Contact = "Reference 2 contact must be exactly 10 digits.";
    }

    if (
      formData.reference1Contact &&
      formData.reference2Contact &&
      formData.reference1Contact === formData.reference2Contact
    ) {
      errors.reference2Contact = "Reference 2 contact cannot be same as Reference 1 contact.";
    }


    if (!formData.bankStatementFile1) errors.bankStatementFile1 = "Bank Statement is required.";

    // business document

    //  shopPhoto: null,
    // shopAct: null,
    // udhyamAadhar: null,
    // itr: null,

    if (!formData.shopPhoto)
      errors.shopPhoto = "Shop Photo is required.";

    if (!formData.shopAct)
      errors.shopAct = "Shop and Establishment Act/ Gumasta License is required.";

    if (!formData.itr)
      errors.itr = "ITR (last 3 years) is required.";

    if (!formData.udhyamAadhar)
      errors.udhyamAadhar = "Udhyam Aadhar is required."



    return errors;
  }



  const handleSubmit = async () => {
    if (loading) return;
    console.log("=== Form Submit Started ===");
    setLoading(true);
    setError("");
    setValidationErrors([]);
    setSuccessMessage("");
    setSavedApplication(null);
    try {
      console.log("Validating form data...", formData);
      const errors = validateForm(formData, sameAddress);
      console.log("Validation errors:", errors);
      if (Object.keys(errors).length > 0) {
        console.log("Form validation failed, stopping submission");
        setFieldErrors(errors);
        setValidationErrors(Object.values(errors));
        setError("Please fix the highlighted fields to submit your application.");
        setLoading(false);
        return;
      }
      console.log("Validation passed, building application data...");

      // Build nested JSON structure
      const applicationData = {
        partnerReferralCode: isPartnerLoggedIn
          ? undefined
          : formData.partnerReferralCode?.trim() || undefined,
        customer: {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          alternatePhone: formData.alternateContact || undefined,
          dateOfBirth: formData.dob,
          gender: normalizeGenderForApi(formData.gender),
          motherName: formData.motherName,
          maritalStatus: normalizeMaritalStatusForApi(formData.maritalStatus),
          SpouseName: isMarriedStatus(formData.maritalStatus) ? formData.SpouseName : "",
          panNumber: String(formData.panNumber || "").trim().toUpperCase(),
          loanAmount: formData.loanAmount ? Number(formData.loanAmount) : 0,
          currentAddress: formData.currentAddress,
          currentAddressPincode: formData.currentAddressPincode,
          currentAddressOwnRented: formData.currentAddressOwnRented,
          currentAddressStability: formData.currentAddressStability,
          currentAddressLandmark: formData.currentAddressLandmark,
          permanentAddress: sameAddress ? formData.currentAddress : formData.permanentAddress,
          permanentAddressPincode: sameAddress ? formData.currentAddressPincode : formData.permanentAddressPincode,
          permanentAddressOwnRented: sameAddress ? formData.currentAddressOwnRented : formData.permanentAddressOwnRented,
          permanentAddressStability: sameAddress ? formData.currentAddressStability : formData.permanentAddressStability,
          permanentAddressLandmark: sameAddress ? formData.currentAddressLandmark : formData.permanentAddressLandmark,
          password: formData.password || undefined,
          bankStatementPassword: formData.bankStatementPassword,
          hasRunningLoan: formData.hasRunningLoan || "NO",
          monthlyEmiPaying: Number(formData.monthlyEmiPaying) || 0,
          loanPurpose: formData.loanPurpose || "",
          ...personFinancialCustomerFields(formData),
        },
        product: {
          businessName: formData.businessName,
          businessAddress: formData.businessAddress,
          businessLandmark: formData.businessLandmark,
          businessVintage: formData.businessVintage,
          gstNumber: formData.gstNumber,
          annualTurnoverInINR: formData.annualTurnover,
          propertyType: formData.propertyType,
          propertyValue: formData.propertyValue ? Number(formData.propertyValue) : undefined,
          propertyAddress: formData.propertyAddress,
        },
        propertyType: formData.propertyType,
        propertyValue: formData.propertyValue ? Number(formData.propertyValue) : undefined,
        propertyAddress: formData.propertyAddress,
        loanType: "HOME_LOAN_SELF_EMPLOYED",
        references: [
          {
            name: formData.reference1Name,
            relation: "Reference 1",
            phone: formData.reference1Contact,
          },
          {
            name: formData.reference2Name,
            relation: "Reference 2",
            phone: formData.reference2Contact,
          },
        ],
        coApplicant: formData.hasCoApplicant
          ? {
              aadharFront: formData.coApplicantAadharFront,
              aadharBack: formData.coApplicantAadharBack,
              panCard: formData.coApplicantPan,
              phone: formData.coApplicantMobile,
              selfie: formData.coApplicantSelfie,
            }
          : undefined,
      };

      // Prepare FormData with ordered docs/docTypes
      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(applicationData));

      const docsQueue = [];
      if (formData.aadharFront)
        docsQueue.push({ file: formData.aadharFront, type: "AADHAR_FRONT" });
      if (formData.aadharBack)
        docsQueue.push({ file: formData.aadharBack, type: "AADHAR_BACK" });
      if (formData.otherDocs)
        docsQueue.push({ file: formData.otherDocs, type: "OTHER_DOCS" });
      if (formData.panCard)
        docsQueue.push({ file: formData.panCard, type: "PAN" });
      if (formData.addressProof)
        docsQueue.push({ file: formData.addressProof, type: "ADDRESS_PROOF" });
      if (formData.shopAct)
        docsQueue.push({ file: formData.shopAct, type: "SHOP_ACT" });
      if (formData.udhyamAadhar)
        docsQueue.push({ file: formData.udhyamAadhar, type: "UDHYAM_AADHAR" });
      if (formData.itr) docsQueue.push({ file: formData.itr, type: "ITR" });
      if (formData.gstDoc)
        docsQueue.push({ file: formData.gstDoc, type: "GST" });
      if (formData.businessOtherDocs)
        docsQueue.push({
          file: formData.businessOtherDocs,
          type: "BUSINESS_OTHER_DOCS",
        });
      if (formData.shopPhoto)
        docsQueue.push({ file: formData.shopPhoto, type: "SHOP_PHOTO" });
      if (formData.bankStatementFile1)
        docsQueue.push({
          file: formData.bankStatementFile1,
          type: "BANK_STATEMENT_1",
        });
      if (formData.bankStatementFile2)
        docsQueue.push({
          file: formData.bankStatementFile2,
          type: "BANK_STATEMENT_2",
        });
      if (formData.passportPhoto || formData.selfie) {
        docsQueue.push({
          file: formData.passportPhoto || formData.selfie,
          type: "PHOTO",
        });
      }

      // Property documents
      if (formData.allotmentLetter)
        docsQueue.push({ file: formData.allotmentLetter, type: "ALLOTMENT_LETTER" });
      if (formData.newPropertyPaymentReceipts)
        docsQueue.push({ file: formData.newPropertyPaymentReceipts, type: "NEW_PROPERTY_PAYMENT_RECEIPTS" });
      if (formData.titleDeeds)
        docsQueue.push({ file: formData.titleDeeds, type: "TITLE_DEEDS" });
      if (formData.resalePaymentReceipts)
        docsQueue.push({ file: formData.resalePaymentReceipts, type: "RESALE_PAYMENT_RECEIPTS" });
      if (formData.agreementCopy)
        docsQueue.push({ file: formData.agreementCopy, type: "AGREEMENT_COPY" });

      // Co-applicant documents
      if (formData.hasCoApplicant) {
        if (formData.coApplicantAadharFront)
          docsQueue.push({
            file: formData.coApplicantAadharFront,
            type: "CO_APPLICANT_AADHAR_FRONT",
          });
        if (formData.coApplicantAadharBack)
          docsQueue.push({
            file: formData.coApplicantAadharBack,
            type: "CO_APPLICANT_AADHAR_BACK",
          });
        if (formData.coApplicantPan)
          docsQueue.push({
            file: formData.coApplicantPan,
            type: "CO_APPLICANT_PAN",
          });
        if (formData.coApplicantSelfie)
          docsQueue.push({
            file: formData.coApplicantSelfie,
            type: "CO_APPLICANT_SELFIE",
          });
      }

      docsQueue.forEach(({ file, type }) => {
        const rawFile = file instanceof File ? file : file?.file;
        if (rawFile instanceof File) {
          formDataToSend.append("docs", rawFile);
          formDataToSend.append("docTypes", type);
        }
      });

      const pendingUploads = docsQueue
        .map(({ file, type }) => ({
          file: file instanceof File ? file : file?.file,
          type,
        }))
        .filter(({ file }) => file instanceof File);

      if (pendingUploads.length > 0 && !checkFileSize(pendingUploads)) {
        console.log("File size check failed");
        setLoading(false);
        return;
      }
      
      console.log("Preparing API request...");
      console.log("Docs queue length:", docsQueue.length);
      console.log("Application data:", JSON.stringify(applicationData, null, 2));

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
        setSuccessMessage(data.message || "Application form completed successfully.");
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
      
      console.log("API Endpoint:", endpoint);
      console.log("Is Partner Logged In:", isPartnerLoggedIn);

      const headers = isPartnerLoggedIn
        ? {
          Authorization: `Bearer ${partnerToken}`,
        }
        : {};

      // Create AbortController for request cancellation
      abortControllerRef.current = new AbortController();

      console.log("Making API POST request...");
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
      console.log("API Response received:", response);
      const data = response.data;
      console.log("Response data:", data);

      setApplicationId(data.id);
      setSavedApplication(data);
      setSuccessMessage(
        data.message || "Application saved successfully. Submitting now."
      );
      await handleApplyNow(data.id);
      console.log("=== Form Submit Success ===");
    } catch (err) {
      console.error("=== Form Submit Error ===", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        request: err.request,
      });
      
      // Handle different error types
      if (axios.isCancel(err)) {
        console.log("Request was cancelled");
        setError("Request was cancelled. Please try again.");
      } else if (err.code === "ECONNABORTED") {
        console.log("Request timeout");
        setError("Request timeout. Please check your connection and try again.");
      } else if (err.response) {
        const backendMessage = err.response?.data?.message;
        const backendError = err.response?.data?.error || "";

        // Friendly messages for duplicate keys (email / phone)
        if (typeof backendError === "string" && backendError.includes("E11000")) {
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
        } else {
          console.log("Server error response:", err.response.status, err.response.data);
          setError(
            backendMessage || err.message || "Something went wrong."
          );
          setValidationErrors(err.response?.data?.errors || []);
        }
      } else if (err.request) {
        // Request was made but no response received
        console.log("No response received from server");
        setError("Network error. Please check your connection and try again.");
      } else {
        // Something else happened
        console.log("Unexpected error:", err);
        setError("An unexpected error occurred. Please try again.");
      }
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
      // Create AbortController for request cancellation
      abortControllerRef.current = new AbortController();

      await postLoanFormWithRetry(
        `${backendurl}/partner/applications/${targetApplicationId}/submit`,
        {},
        {
          headers: {
            Authorization: `Bearer ${partnerToken}`,
          },
          timeout: 30000, // 30 seconds timeout
          signal: abortControllerRef.current.signal,
        }
      );
      setSuccessMessage("Application submitted successfully.");
      resetFields();
    } catch (err) {
      // Handle different error types
      if (axios.isCancel(err)) {
        setError("Request was cancelled. Please try again.");
      } else if (err.code === 'ECONNABORTED') {
        setError("Request timeout. Please check your connection and try again.");
      } else if (err.response) {
        setError(
          err.response?.data?.message || err.message || "Something went wrong."
        );
        setValidationErrors(err.response?.data?.errors || []);
      } else if (err.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };



  const resetFields = () => {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      alternateContact: "",
      email: "",
      gender: "",
      motherName: "",
      maritalStatus: "",
      SpouseName: "",
      panNumber: "",

      // Address Information
      currentAddress: "",
      currentAddressPincode: "",
      currentAddressOwnRented: "",
      currentAddressStability: "",
      currentAddressLandmark: "",
      permanentAddress: "",
      permanentAddressPincode: "",
      permanentAddressOwnRented: "",
      permanentAddressStability: "",
      permanentAddressLandmark: "",

      // Business Information
      businessName: "",
      businessAddress: "",
      businessLandmark: "",
      businessVintage: "",

      // Documents
      aadharFront: null,
      aadharBack: null,
      panCard: null,
      addressProof: null,
      shopPhoto: null,
      shopAct: null,
      udhyamAadhar: null,
      itr: null,
      gstNumber: "",
      gstDoc: null,
      bankStatementFile1: null,
      bankStatementFile2: null,
      businessOtherDocs: null,
      selfie: null,

      // Co-applicant
      hasCoApplicant: true,
      coApplicantAadharFront: null,
      coApplicantAadharBack: null,
      coApplicantPan: null,
      coApplicantMobile: "",
      coApplicantSelfie: null,

      // Legacy fields (keeping for compatibility)
      password: "",
      confirmPassword: "",
      fullName: "",
      dob: "",
      shopName: "",
      reference1Name: "",
      reference1Contact: "",
      reference2Name: "",
      reference2Contact: "",
      otherDocs: null,
      annualTurnover: "",
      loanAmount: "",
    })
    setCurrentStep(LOAN_STEP.PERSONAL);
    setMaxStep(0);
    setFieldErrors({});
    setValidationErrors([]);
    setError("");
    try {
      localStorage.removeItem(loanDraftStorageKey);
    } catch (e) {
      // ignore
    }
  }


  const checkFileSize = (docsQueue) => {
    const viol = findOversizeInLoanDocsQueue(docsQueue);
    if (viol) {
      setError(formatLoanDocOversizeError(viol));
      return false;
    }
    return true;
  };

  return (
    <div
      className={
        embed
          ? "py-4 px-0 sm:px-2"
          : "min-h-screen py-8 px-4"
      }
      style={{ backgroundColor: embed ? "transparent" : "#F8FAFC" }}
    >
      <DocumentPreviewModal
        url={documentModel}
        onClose={() => {
          if (documentModel && documentModel.startsWith("blob:")) {
            URL.revokeObjectURL(documentModel);
          }
          setdocumentModel(null);
        }}
      />
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

        {/* Customer Trust Banner & Partner Certificate Info */}
        {!isPartnerLoggedIn && (
          <PublicLoanPartnerTrustBanner
            partner={partnerInfo || (defaultReferralCode ? { partnerCode: defaultReferralCode } : null)}
            loanTitle="Home Loan (Self-Employed)"
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
                Home Loan Application (Self Employed)
              </h1>
              <p className="mt-1 opacity-90 text-xs sm:text-sm">
                Complete all fields to process your loan application
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
            <LoanStepper
              steps={steps}
              currentStep={currentStep}
              maxStep={maxStep}
              loading={loading}
              stepErrorCounts={stepErrorCounts}
              helperText="Complete step-by-step. Your progress is saved locally."
              onStepClick={(idx) => {
                setCurrentStep(idx);
                requestAnimationFrame(() => {
                  const el = document.getElementById(stepAnchorIds[idx]);
                  if (el && typeof el.scrollIntoView === "function") {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                });
              }}
            />

            {/* Loan & Personal */}
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
                {/* First Name */}
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

                  {formData.firstName ? " " : renderError('firstName')}

                </div>
                {/* Middle Name */}
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
                {/* Last Name */}
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

                  {formData.lastName ? "" : renderError('lastName')}
                </div>
                {/* Contact Number */}
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
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your contact number"
                      required
                    />

                    {formData.phone ? "" : renderError('phone')}
                  </div>
                </div>
                {/* Alternate Contact */}
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
                      value={formData.alternateContact}
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
                {/* Email ID */}
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

                    {renderError("email")}
                  </div>
                </div>
                {/* PAN Number */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter your PAN number"
                    required
                  />

                  {renderError('panNumber')}
                  <div className="mt-3">
                    {renderDocCard("panCard", "Upload PAN Card", { required: true })}
                  </div>
                </div>
                {/* Date of Birth */}
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
                      value={formData.dob || ""}
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
                {/* Gender */}
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
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>

                  {formData.gender ? "" : renderError('gender')}
                </div>
                {/* Marital Status */}
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
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>

                  {formData.maritalStatus ? "" : renderError('maritalStatus')}
                </div>
                {/* Wife Name (conditional for married) */}
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
                      name="SpouseName"
                      value={formData.SpouseName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter Spouse's name"
                      required
                    />

                    {renderError('SpouseName')}
                  </div>
                )}
                {/* Mother Name */}
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
                    placeholder="Enter your mother's name"
                    required
                  />

                  {formData.motherName ? "" : renderError('motherName')}
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
                  {renderDocCard("selfie", "Applicant Photo", { required: true, accept: ".jpg,.jpeg,.png" })}
                  {renderDocCard("otherDocs", "Other Document (Optional)", { hint: OPTIONAL_EXTRA_DOC_CAPTION })}
                </div>
              </div>

              {/* Co-Applicant */}
              <div className="pt-6 border-t border-slate-200 mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" />
                    <div>
                      <h3
                        className="text-lg font-semibold"
                        style={{ color: "#111827" }}
                      >
                        {LOAN_SECTION.CO_APPLICANT}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Co-applicant details are mandatory for this loan
                      </p>
                    </div>
                  </div>
                </div>

                {formData.hasCoApplicant && (
                  <div
                    className="p-6 rounded-xl border-2"
                    style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 max-w-sm">
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Co-Applicant Mobile *
                        </label>
                        <div className="relative">
                          <Phone
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                            style={{ color: "var(--color-brand-primary)" }}
                          />
                          <input
                            type="tel"
                            maxLength={10}
                            name="coApplicantMobile"
                            value={formData.coApplicantMobile}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                            style={{
                              borderColor: "var(--color-brand-primary)",
                              backgroundColor: "white",
                            }}
                            placeholder="Enter 10-digit mobile number"
                            required
                          />
                          {renderError("coApplicantMobile")}
                        </div>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-200 mt-6">
                      <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "#111827" }}>
                        <FileText className="w-5 h-5 text-teal-600" />
                        {LOAN_DOC_GROUP.CO_APPLICANT}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderDocCard("coApplicantPan", "Co-Applicant PAN Card", { required: true })}
                        {renderDocCard("coApplicantSelfie", "Co-Applicant Selfie", { required: true, accept: ".jpg,.jpeg,.png" })}
                        {renderDocCard("coApplicantAadharFront", "Co-Applicant Aadhaar Front", { required: true })}
                        {renderDocCard("coApplicantAadharBack", "Co-Applicant Aadhaar Back", { required: true })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Address */}
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
                      name="currentAddressLandmark"
                      value={formData.currentAddressLandmark ?? ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                      placeholder="Nearby landmark"
                      required
                    />
                    {renderError("currentAddressLandmark")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      name="currentAddressPincode"
                      value={formData.currentAddressPincode ?? ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit PIN code"
                      required
                    />
                    {renderError("currentAddressPincode")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                      House Status *
                    </label>
                    <select
                      name="currentAddressOwnRented"
                      value={houseStatusOptionValue(formData.currentAddressOwnRented, ["own", "rented", "parental"])}
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
                    {renderError("currentAddressOwnRented")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                      Years at this Address *
                    </label>
                    <select
                      name="currentAddressStability"
                      value={formData.currentAddressStability || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                      required
                    >
                      <option value="">Select</option>
                      {stabilityOptionsFor(formData.currentAddressStability).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {renderError("currentAddressStability")}
                  </div>
                </div>

                <div className="pt-2">
                  <LoanAddressProofBlock
                    stepLabel=""
                    file={formData.addressProof}
                    onChange={handleFileChange}
                    onRemove={handleFileRemove}
                    renderError={renderError}
                    uploadStatus={docUploadStatus.addressProof}
                    uploadProgress={docUploadProgress.addressProof}
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
                      name="permanentAddressLandmark"
                      value={formData.permanentAddressLandmark ?? ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                      placeholder="Nearby landmark"
                      required
                    />
                    {renderError("permanentAddressLandmark")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      name="permanentAddressPincode"
                      value={formData.permanentAddressPincode ?? ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit PIN code"
                      required
                    />
                    {renderError("permanentAddressPincode")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                      House Status *
                    </label>
                    <select
                      name="permanentAddressOwnRented"
                      value={houseStatusOptionValue(formData.permanentAddressOwnRented, ["own", "rented", "parental"])}
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
                    {renderError("permanentAddressOwnRented")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                      Years at this Address *
                    </label>
                    <select
                      name="permanentAddressStability"
                      value={formData.permanentAddressStability || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                      required
                    >
                      <option value="">Select</option>
                      {stabilityOptionsFor(formData.permanentAddressStability).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {renderError("permanentAddressStability")}
                  </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Business & Property */}
            <section id="loan-income-step" hidden={currentStep !== LOAN_STEP.INCOME}>
              <LoanDocsProgress checklist={docChecklistForStep(docChecklist, LOAN_STEP.INCOME)} />
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <Store className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                {LOAN_SECTION.BUSINESS}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Business Name *
                  </label>
                  <div className="relative">
                    <Building
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: "var(--color-brand-primary)" }}
                    />
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your business name"
                      required
                    />
                    {formData.businessName ? "" : renderError('businessName')}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Business Address *
                  </label>
                  <textarea
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors resize-none"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    rows="3"
                    placeholder="Enter your business address"
                    required
                  />

                  {formData.businessAddress ? "" : renderError('businessAddress')}
                </div>
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Business Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    name="businessLandmark"
                    value={formData.businessLandmark}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter business landmark"
                  />
                </div>
                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "#111827" }}>
                    <FileText className="w-5 h-5 text-teal-600" />
                    {LOAN_DOC_GROUP.BUSINESS_PROOF}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderDocCard("shopAct", "Shops and Establishment Act/Gumasta License", { required: true })}
                    {renderDocCard("udhyamAadhar", "Udhyam Aadhar", { required: true })}
                    {renderDocCard("shopPhoto", "Shop Photo", { required: true, accept: ".jpg,.jpeg,.png" })}
                    {renderDocCard("businessOtherDocs", "Other Business Docs (Optional)")}
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Years in Business *
                  </label>
                  <input
                    type="number"
                    name="businessVintage"
                    value={formData.businessVintage}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter business vintage in years"
                    min="0"
                    required
                  />
                  {formData.businessVintage ? "" : renderError('businessVintage')}
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Annual Turnover (₹) *
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg"
                      style={{ color: "var(--color-brand-primary)" }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      name="annualTurnover"
                      value={formData.annualTurnover || ""}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter annual turnover in INR"
                      required
                    />

                    {formData.annualTurnover ? " " : renderError('annualTurnover')}
                  </div>
                  <div className="mt-3">
                    {renderDocCard("itr", "ITR (Last 3 Years)", {
                      required: true,
                      hint: `Upload all 3 years ITR in this one file (combined PDF preferred). ${loanDocumentFieldHint("itr")}`,
                    })}
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    GST Number (Optional)
                  </label>
                  <div className="relative">
                    <Receipt
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: "var(--color-brand-primary)" }}
                    />
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter GST number (if applicable)"
                    />
                  </div>
                  <div className="mt-3">
                    {renderDocCard("gstDoc", "GST Document (Optional)")}
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="pt-6 border-t border-slate-200 mt-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: "#111827" }}>
                  <Home className="w-5 h-5 text-teal-600" />
                  {LOAN_SECTION.PROPERTY}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                      Property Type *
                    </label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      required
                    >
                      <option value="NEW_PROPERTY">New Property / Under Construction / Builder</option>
                      <option value="RESALE_PROPERTY">Resale Property</option>
                    </select>
                    {renderError("propertyType")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                      Property Value (₹) *
                    </label>
                    <input
                      type="number"
                      name="propertyValue"
                      value={formData.propertyValue}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="e.g. 5000000"
                      min="0"
                      required
                    />
                    {renderError("propertyValue")}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: "#111827" }}>
                      Property Address *
                    </label>
                    <textarea
                      name="propertyAddress"
                      value={formData.propertyAddress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors resize-none"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      rows="2"
                      placeholder="Enter the complete address of the property being purchased"
                      required
                    />
                    {renderError("propertyAddress")}
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-200 mt-6">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "#111827" }}>
                    <FileText className="w-5 h-5 text-teal-600" />
                    {LOAN_DOC_GROUP.PROPERTY}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Upload allotment letter, sale deed / title deeds, payment receipts, or agreement copy.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderDocCard("allotmentLetter", "Allotment Letter / Agreement Copy")}
                    {renderDocCard("titleDeeds", "Title Deeds / Chain Documents")}
                    {renderDocCard("newPropertyPaymentReceipts", "Property Payment Receipts")}
                    {renderDocCard("resalePaymentReceipts", "Resale Payment Receipts")}
                    {renderDocCard("agreementCopy", "Registered Agreement / Draft Agreement")}
                  </div>
                </div>
              </div>

              {/* Bank Statements */}
              <div className="pt-6 border-t border-slate-200 mt-6">
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2" style={{ color: "#111827" }}>
                  <FileText className="w-5 h-5 text-teal-600" />
                  {LOAN_DOC_GROUP.BANK}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Upload statements in sequence: Bank Statement 1, then Bank Statement 2.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderDocCard("bankStatementFile1", "Bank Statement 1", {
                    required: true,
                    accept: ".pdf,application/pdf",
                    hint: `Upload last 12 months bank statement. ${loanDocumentFieldHint("bankStatementFile1")}`,
                  })}
                  {renderDocCard("bankStatementFile2", "Bank Statement 2 (Optional)", { accept: ".pdf,application/pdf" })}
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
                  style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
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

                      {formData.reference1Name ? "" : renderError('reference1Name')}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Contact Number *
                      </label>
                      <div className="relative">
                        <Phone
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                          style={{ color: "var(--color-brand-primary)" }}
                        />
                        <input
                          type="tel"
                          name="reference1Contact"
                          value={formData.reference1Contact}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "white",
                          }}
                          placeholder="Enter contact number"
                          required
                        />

                        {renderError('reference1Contact')}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="p-6 rounded-lg border-2"
                  style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
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

                      {formData.reference2Name ? "" : renderError('reference2Name')}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Contact Number *
                      </label>
                      <div className="relative">
                        <Phone
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                          style={{ color: "var(--color-brand-primary)" }}
                        />
                        <input
                          type="tel"
                          name="reference2Contact"
                          value={formData.reference2Contact}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "white",
                          }}
                          placeholder="Enter contact number"
                          required
                        />

                        {renderError('reference2Contact')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Review & Submit */}
            <section id="loan-review-step" hidden={currentStep !== LOAN_STEP.REVIEW}>
              <LoanReviewSummary
                sections={reviewSections}
                docChecklist={docChecklist}
                onEdit={goToStep}
                editable={!loading}
              />
              {showPasswordFields && (
                <div className="mt-8 mb-8">
                  <h2
                    className="text-2xl font-semibold mb-2 flex items-center gap-3"
                    style={{ color: "#111827" }}
                  >
                    {LOAN_SECTION.ACCOUNT}
                  </h2>
                  <p className="text-sm text-slate-500 mb-4">
                    Optional. Leave blank and a customer password will be generated automatically.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { name: "password", label: "Password", placeholder: "Enter password (min 6 characters)" },
                      { name: "confirmPassword", label: "Confirm Password", placeholder: "Re-enter password" },
                    ].map((field) => (
                      <div key={field.name}>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          {field.label}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword[field.name] ? "text" : "password"}
                            name={field.name}
                            value={formData[field.name] || ""}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                            style={{
                              borderColor: "var(--color-brand-primary)",
                              backgroundColor: "white",
                            }}
                            placeholder={field.placeholder}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((prev) => ({
                                ...prev,
                                [field.name]: !prev[field.name],
                              }))
                            }
                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword[field.name] ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {renderError(field.name)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!isPartnerLoggedIn && (
                <>
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
                </>
              )}
            </section>

            {/* Submit Button + inline messages */}
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
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === LOAN_STEP.PERSONAL) return;
                    setError("");
                    setFieldErrors({});
                    setValidationErrors([]);
                    const next = currentStep - 1;
                    setCurrentStep(next);
                    requestAnimationFrame(() => {
                      const el = document.getElementById(stepAnchorIds[next]);
                      if (el && typeof el.scrollIntoView === "function") {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                      const first = document.querySelector(`[name="${stepFirstFieldName[next]}"]`);
                      if (first && typeof first.focus === "function") first.focus();
                    });
                  }}
                  className={`px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors ${editingFromReview ? "hidden" : ""}`}
                  disabled={loading || currentStep === LOAN_STEP.PERSONAL}
                >
                  Back
                </button>

                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (loading || isCheckingExistence) return;
                      setError("");
                      const stepErrors = validateHomeLoanSelfEmployeeStep(currentStep);
                      setFieldErrors(stepErrors);

                      if (Object.keys(stepErrors).length > 0) {
                        setError("Please fix the highlighted fields to continue.");
                        scrollToFirstError(stepErrors);
                        return;
                      }

                      // New: Check if customer exists after Step 1 (Personal Info)
                      if (currentStep === LOAN_STEP.PERSONAL && isPartnerLoggedIn && !isRmMode && !isEditingExistingApp) {
                        setIsCheckingExistence(true);
                        try {
                          const { data } = await axios.get(`${backendurl}/partner/check-customer`, {
                            params: {
                              email: formData.email,
                              phone: formData.phone,
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
                        } finally {
                          setIsCheckingExistence(false);
                        }
                      }

                      // Sync filled wizard fields to LEAD so RM sees progress
                      const leavingStep = currentStep;
                      const nextStep = resolveLoanNextStep(currentStep, { editingFromReview });
                      if (!isRmMode && !isEditingExistingApp) {
                        const leadProgress = persistLeadWizardProgress({
                          applicationId,
                          setApplicationId,
                          leavingStepIndex: leavingStep,
                          nextStepIndex: nextStep,
                          steps,
                          loanType: "HOME_LOAN_SELF_EMPLOYED",
                          formData: { ...formData, contactNo: formData.phone || formData.contactNo },
                          isPartnerLoggedIn,
                          partnerToken,
                          partnerReferralCode: currentPartnerCode,
                          isRmMode,
                        }).catch((err) => console.warn("Lead progress sync non-fatal:", err));
                        if (leavingStep === LOAN_STEP.PERSONAL) {
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

                      setEditingFromReview(false);
                      setCurrentStep(nextStep);
                      setMaxStep((m) => Math.max(m, nextStep));
                      setFieldErrors({});
                      setValidationErrors([]);
                      requestAnimationFrame(() => {
                        const el = document.getElementById(stepAnchorIds[nextStep]);
                        if (el && typeof el.scrollIntoView === "function") {
                          el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                        const first = document.querySelector(`[name="${stepFirstFieldName[nextStep]}"]`);
                        if (first && typeof first.focus === "function") first.focus();
                      });
                    }}
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

      {isPartnerLoggedIn && (
        <ShareLoanModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          loan={{
            id: "home-business",
            title: "Home Loan (Self-Employed)",
            badge: "Upto ₹5Cr",
            route: "/partner/application/home-loan-self-employed",
            hasSubTypes: false,
          }}
          partnerCode={currentPartnerCode}
          partnerName={currentPartnerName}
        />
      )}
    </div>
  );
}
