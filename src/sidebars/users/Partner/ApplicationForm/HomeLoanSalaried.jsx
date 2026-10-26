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
  LOAN_DOC_LABEL,
  buildLoanReviewSections,
  getLoanSteps,
  resolveLoanNextStep,
  LOAN_BACK_TO_REVIEW_LABEL,
  LOAN_REVIEW_EDIT_HINT,
  LOAN_STEP_LAYOUT_VERSION,
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
  houseStatusOptionValue,
  isMarriedStatus,
  normalizeGenderForApi,
  normalizeMaritalStatusForApi,
} from "../../../../utils/normalizeLoanPayload";

export default function HomeLoanSalaried({ embed = false, actorRole = "auto" } = {}) {
  const [documentModel, setdocumentModel] = useState(null);
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

    // Employeement information
    totalExperience: "",
    currentExperience: "",
    salaryInHand: "",
    companyIdCard: "",
    salarySlip1: "",
    salarySlip2: "",
    salarySlip3: "",
    form16_26as: "",


    salarySlip: "",
    bankStatement: "",
    photoCopy: "",
    propertyType: "NEW_PROPERTY",
    propertyValue: "",
    propertyAddress: "",
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

    // Co-applicant
    hasCoApplicant: true,
    coApplicantMobile: "",
    coApplicantAadharFront: null,
    coApplicantAadharBack: null,
    coApplicantPan: null,
    coApplicantSelfie: null,

    // Document
    aadharFront: "",
    aadharBack: "",
    panCard: "",
    passportPhoto: "",


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
  const [docUploadStatus, setDocUploadStatus] = useState({});
  const [docUploadProgress, setDocUploadProgress] = useState({});
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [isCheckingExistence, setIsCheckingExistence] = useState(false);
  const abortControllerRef = useRef(null);
  const objectUrlsRef = useRef([]); // Store all created object URLs

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
    ? "dhansource.homeLoanSalariedDraft.embed.v1"
    : "dhansource.homeLoanSalariedDraft.v1";
  const steps = getLoanSteps({ profile: LOAN_PROFILE.SALARIED, hasProperty: true });
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

  const stepFirstFieldName = useMemo(
    () => [
      "loanAmount",
      "currentAddress",
      "companyName",
      "reference1Name",
      isPartnerLoggedIn ? "password" : "partnerReferralCode",
    ],
    [isPartnerLoggedIn]
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

  // Cleanup function to cancel pending requests and revoke object URLs
  useEffect(() => {
    return () => {
      // Cancel pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Revoke all object URLs to prevent memory leaks
      objectUrlsRef.current.forEach(url => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      objectUrlsRef.current = [];
      // Close document modal if open
      if (documentModel) {
        setdocumentModel(null);
      }
    };
  }, []);

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

  // Load draft
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

  // Persist draft
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

  const stepFieldKeys = [
    [
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
      "otherDocument",
      ...(formData.hasCoApplicant
        ? ["coApplicantMobile", "coApplicantPan", "coApplicantSelfie", "coApplicantAadharFront", "coApplicantAadharBack"]
        : []),
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
      "salaryReceiptMode",
      "officialEmail",
      "propertyType",
      "propertyValue",
      "propertyAddress",
      "allotmentLetter",
      "titleDeeds",
      "newPropertyPaymentReceipts",
      "resalePaymentReceipts",
      "agreementCopy",
      "bankStatement1",
      "bankStatement2",
      "bankStatementPassword",
    ],
    ["reference1Name", "reference1Contact", "reference2Name", "reference2Contact"],
    [...(showPasswordFields ? ["password", "confirmPassword"] : []), "partnerReferralCode"],
  ];

  function validateHomeLoanSalariedStep(stepIndex) {
    const fullErrors = validateRegistrationForm(formData, sameAddress);

    const stepFields = stepFieldKeys[stepIndex] || [];

    const errors = {};
    for (const key of stepFields) {
      if (fullErrors[key]) errors[key] = fullErrors[key];
    }

    // Zod overlays for fintech-level niceties (names + patterns)
    if (stepIndex === LOAN_STEP.PERSONAL) {
      const rFirst = min3("First name must be at least 3 characters.").safeParse(formData.firstName);
      if (!rFirst.success) errors.firstName = rFirst.error.issues[0].message;

      const rLast = min3("Last name must be at least 3 characters.").safeParse(formData.lastName);
      if (!rLast.success) errors.lastName = rLast.error.issues[0].message;

      const rMother = min3("Mother name must be at least 3 characters.").safeParse(formData.motherName);
      if (!rMother.success) errors.motherName = rMother.error.issues[0].message;

      const rPhone = phoneSchema.safeParse(formData.contactNo);
      if (!rPhone.success) errors.contactNo = rPhone.error.issues[0].message;

      const rEmail = emailSchema.safeParse(formData.email);
      if (!rEmail.success) errors.email = rEmail.error.issues[0].message;

      const rPan = panSchema.safeParse(formData.pan);
      if (!rPan.success) errors.pan = rPan.error.issues[0].message;
    }

    if (stepIndex === LOAN_STEP.ADDRESS) {
      const rPin = pinSchema.safeParse(String(formData.currentAddressPinCode ?? ""));
      if (!rPin.success) errors.currentAddressPinCode = rPin.error.issues[0].message;
      if (!sameAddress) {
        const rPermPin = pinSchema.safeParse(String(formData.permanentAddressPinCode ?? ""));
        if (!rPermPin.success) errors.permanentAddressPinCode = rPermPin.error.issues[0].message;
      }
    }

    return errors;
  }
  const stepErrorCounts = steps.map((_, idx) =>
    Object.keys(validateHomeLoanSalariedStep(idx)).length
  );

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
      if (sameAddress) {
        if (name === "currentAddress") next.permanentAddress = value;
        if (name === "currentHouseStatus") next.permanentHouseStatus = value;
        if (name === "currentLandmark") next.permanentLandmark = value;
        if (name === "stabilityOfResidency") next.permanentStability = value;
        if (name === "currentAddressPinCode") next.permanentAddressPinCode = value;
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

  const handleFileChangeAddressProofs = async (e) => {
    const input = e.target;
    const picked = input.files?.[0];
    if (!picked) return;
    const err = validateLoanDocumentUpload(picked, "addressProof");
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
      addressProof: file,
    }));

    const toastId = toast.loading(`Uploading ${file.name}...`);
    setDocUploadStatus((p) => ({ ...p, addressProof: "uploading" }));
    setDocUploadProgress((p) => ({ ...p, addressProof: 25 }));

    if (applicationId) {
      uploadLeadDocumentEarly({
        applicationId,
        partnerToken,
        isPartnerLoggedIn,
        fieldName: "addressProof",
        file,
        onProgress: (pct) => setDocUploadProgress((p) => ({ ...p, addressProof: pct })),
      }).then((res) => {
        if (res?.ok) {
          setDocUploadStatus((p) => ({ ...p, addressProof: "uploaded" }));
          setDocUploadProgress((p) => ({ ...p, addressProof: 100 }));
          toast.success(`${file.name} uploaded successfully!`, { id: toastId });
        } else {
          setDocUploadStatus((p) => ({ ...p, addressProof: "failed" }));
          toast.error(`Upload failed for ${file.name}`, { id: toastId });
        }
      });
    } else {
      setTimeout(() => setDocUploadProgress((p) => ({ ...p, addressProof: 65 })), 180);
      setTimeout(() => {
        setDocUploadProgress((p) => ({ ...p, addressProof: 100 }));
        setDocUploadStatus((p) => ({ ...p, addressProof: "uploaded" }));
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
    const checked = e.target.checked;
    setSameAddress(checked);

    if (checked) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: prev.currentAddress,
        permanentHouseStatus: prev.currentHouseStatus,
        permanentLandmark: prev.currentLandmark,
        permanentAddressPinCode: prev.currentAddressPinCode,
        permanentStability: prev.stabilityOfResidency,
      }));

      // ✅ Clear previous permanent field errors
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.permanentAddress;
        delete newErrors.permanentHouseStatus;
        delete newErrors.permanentLandmark;
        delete newErrors.permanentAddressPinCode;
        delete newErrors.permanentStability;
        return newErrors;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: "",
        permanentHouseStatus: "",
        permanentLandmark: "",
        permanentAddressPinCode: "",
        permanentStability: "",
      }));
    }
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
    return null;
  };

  function validateRegistrationForm(formData, sameAddress) {
    const errors = {};

    // Personal fields
    if (!formData.firstName) errors.firstName = "First name is required.";
    if (!formData.lastName) errors.lastName = "Last name is required.";
    if (!formData.motherName) errors.motherName = "Mother's name is required.";
    // if (!formData.pan) errors.pan = "PAN number is required.";
    if (!formData.gender) errors.gender = "Gender is required.";
    if (!formData.maritalStatus) errors.maritalStatus = "Marital status is required.";
    if (isMarriedStatus(formData.maritalStatus) && !String(formData.wifeName || "").trim()) {
      errors.wifeName = "Spouse name is required for married applicants.";
    }

    if (!formData.loanPurpose) {
      errors.loanPurpose = "Loan purpose is required.";
    }
    if (formData.hasRunningLoan === "YES" && (!formData.monthlyEmiPaying || Number(formData.monthlyEmiPaying) <= 0)) {
      errors.monthlyEmiPaying = "Monthly EMI is required when running loan is Yes.";
    }
    Object.assign(errors, validatePersonFinancialFields(formData));

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

    // Address Validation
    if (!formData.currentAddress)
      errors.currentAddress = "Current address is required.";

    if (!formData.stabilityOfResidency)
      errors.stabilityOfResidency = "Stability of residency is required.";

    if (!formData.currentLandmark)
      errors.currentLandmark = "Current landmark is required.";

    if (!formData.currentHouseStatus)
      errors.currentHouseStatus = "Current house status is required.";

    // Current Address Pin Code Validation

    const pin = String(formData.currentAddressPinCode ?? "").trim();

    if (!pin) {
      errors.currentAddressPinCode = "Current Address Pin is required.";
    } else if (!/^[1-9][0-9]{5}$/.test(pin)) {
      errors.currentAddressPinCode = "Enter a valid 6-digit PIN code.";
    }

    // Permanent Address — YOU WANT THESE ALWAYS VALIDATED
    if (!sameAddress) {
      if (!formData.permanentAddress)
        errors.permanentAddress = "Permanent address is required.";

      if (!formData.permanentStability)
        errors.permanentStability = "Permanent stability of residency is required.";

      if (!formData.permanentLandmark)
        errors.permanentLandmark = "Permanent landmark is required.";

      if (!formData.permanentHouseStatus)
        errors.permanentHouseStatus = "Permanent house status is required.";

      // Permanent Address Pin Code Validation
      const permanentPin = String(formData.permanentAddressPinCode ?? "").trim();

      if (!permanentPin) {
        errors.permanentAddressPinCode = "Permanent Address Pin is required.";
      } else if (!/^[1-9][0-9]{5}$/.test(permanentPin)) {
        errors.permanentAddressPinCode = "Enter a valid 6-digit PIN code.";
      }

    }
    // Document

    if (!formData.aadharFront) errors.aadharFront = "Aadhar Front is required";
    if (!formData.aadharBack) errors.aadharBack = "Aadhar Back is required";
    if (!formData.panCard) errors.panCard = "PAN card document is required";

    // PAN Card validation
    if (!formData.pan) {
      errors.pan = "PAN Card is required";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(formData.pan).toUpperCase())) {
      errors.pan = "Enter a valid PAN Card number (e.g., ABCDE1234F)";
    }

    if (!formData.passportPhoto && !formData.selfie) {
      errors.passportPhoto = "Applicant photo is required";
    }

    if (!formData.addressProof) {
      errors.addressProof = "Address proof is required.";
    }

    // Co-applicant validation
    if (formData.hasCoApplicant) {
      if (!formData.coApplicantAadharFront)
        errors.coApplicantAadharFront = "Co-applicant Aadhar front is required.";
      if (!formData.coApplicantAadharBack)
        errors.coApplicantAadharBack = "Co-applicant Aadhar back is required.";
      if (!formData.coApplicantPan)
        errors.coApplicantPan = "Co-applicant PAN is required.";
      if (!formData.coApplicantMobile) {
        errors.coApplicantMobile = "Co-applicant mobile is required.";
      } else if (!/^\d{10}$/.test(formData.coApplicantMobile)) {
        errors.coApplicantMobile = "Mobile must be 10 digits.";
      }
      if (!formData.coApplicantSelfie)
        errors.coApplicantSelfie = "Co-applicant selfie is required.";
    }


    // Employment
    if (!formData.companyName) errors.companyName = "Company name is required.";
    if (!formData.designation) errors.designation = "Designation is required.";
    if (!formData.companyAddress) errors.companyAddress = "Company address is required.";
    if (!formData.monthlySalary) errors.monthlySalary = "Monthly salary is required.";
    if (!formData.totalExperience) errors.totalExperience = "Total Experience is required";
    if (!formData.currentExperience) errors.currentExperience = "Current Experience is required";
    if (!formData.salaryInHand) errors.salaryInHand = "Salary in hand is required";
    if (!formData.companyIdCard) errors.companyIdCard = "Company Id card is required";
    if (!formData.salarySlip1) errors.salarySlip1 = "Salary slip 1 is required";
    if (!formData.salarySlip2) errors.salarySlip2 = "Salary slip 2 is required";
    if (!formData.salarySlip3) errors.salarySlip3 = "Salary slip 3 is required";

    // Property Details
    if (!formData.propertyType) errors.propertyType = "Property type is required.";
    if (!(Number(formData.propertyValue) > 0)) errors.propertyValue = "Property estimated value must be greater than zero.";
    if (!formData.propertyAddress) errors.propertyAddress = "Property address is required.";

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

    const loanAmountError = loanAmountRangeError(formData.loanAmount);
    if (loanAmountError) errors.loanAmount = loanAmountError;
    

    if (!formData.bankStatement1) errors.bankStatement1 = "Bank Statement 1 is required.";

    return errors;
  }

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setFieldErrors({});
    setValidationErrors([]);
    setSuccessMessage("");
    setSavedApplication(null);

    try {
      const errors = validateRegistrationForm(formData, sameAddress);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setValidationErrors(Object.values(errors));
        setLoading(false);
        return;
      }

      // ✅ Prepare JSON structure
      const applicationData = {
        loanType: "HOME_LOAN_SALARIED",
        partnerReferralCode: isPartnerLoggedIn
          ? undefined
          : formData.partnerReferralCode?.trim() || undefined,
        customer: {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName || formData.surname,
          email: formData.email,
          officialEmail: formData.officialEmail,
          phone: formData.contactNo,
          alternatePhone: formData.alternateContact || undefined,
          mothersName: formData.motherName,
          panNumber: String(formData.pan || "").trim().toUpperCase(),
          dateOfBirth: formData.dob,
          gender: normalizeGenderForApi(formData.gender),
          maritalStatus: normalizeMaritalStatusForApi(formData.maritalStatus),
          spouseName: isMarriedStatus(formData.maritalStatus) ? formData.wifeName : "",
          currentAddress: formData.currentAddress,
          currentAddressLandmark: formData.currentLandmark,
          currentAddressPinCode: formData.currentAddressPinCode,
          currentAddressHouseStatus: formData.currentHouseStatus,
          permanentAddress: formData.permanentAddress,
          permanentAddressLandmark: formData.permanentLandmark,
          permanentAddressPinCode: formData.permanentAddressPinCode,
          permanentAddressHouseStatus: formData.permanentHouseStatus,
          stabilityOfResidency: formData.stabilityOfResidency,
          permanentAddressStability: formData.permanentStability,
          loanAmount: formData.loanAmount || 0,
          password: formData.password || undefined,
          bankStatementPassword: formData.bankStatementPassword,
          hasRunningLoan: formData.hasRunningLoan || "NO",
          monthlyEmiPaying: Number(formData.monthlyEmiPaying) || 0,
          loanPurpose: formData.loanPurpose || "",
          ...personFinancialCustomerFields(formData),
        },
        product: {
          companyName: formData.companyName,
          designation: formData.designation,
          companyAddress: formData.companyAddress,
          monthlySalary: formData.monthlySalary,
          totalExperience: formData.totalExperience,
          currentExperience: formData.currentExperience,
          salaryInHand: formData.salaryInHand,
          propertyType: formData.propertyType,
          propertyValue: formData.propertyValue ? Number(formData.propertyValue) : undefined,
          propertyAddress: formData.propertyAddress,
        },
        references: [
          { name: formData.reference1Name, phone: formData.reference1Contact },
          { name: formData.reference2Name, phone: formData.reference2Contact },
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
        docs: [], // files will be appended separately
        propertyType: formData.propertyType,
        propertyValue: formData.propertyValue ? Number(formData.propertyValue) : undefined,
        propertyAddress: formData.propertyAddress,
      };

      // ✅ Prepare FormData
      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(applicationData));

      // Append files
      const applicantPhoto = formData.passportPhoto || formData.selfie;
      const docsQueue = [
        { file: formData.aadharFront, type: "AADHAR_FRONT" },
        { file: formData.aadharBack, type: "AADHAR_BACK" },
        { file: formData.panCard, type: "PAN" },
        { file: applicantPhoto, type: "PHOTO" },
        { file: formData.addressProof, type: "ADDRESS_PROOF" },
        { file: formData.otherDocument, type: "OTHER_DOCS" },
        { file: formData.companyIdCard, type: "COMPANY_ID_CARD" },
        { file: formData.salarySlip1, type: "SALARY_SLIP_1" },
        { file: formData.salarySlip2, type: "SALARY_SLIP_2" },
        { file: formData.salarySlip3, type: "SALARY_SLIP_3" },
        { file: formData.form16_26as, type: "FORM_16_26AS" },
        { file: formData.bankStatement1, type: "BANK_STATEMENT_1" },
        { file: formData.bankStatement2, type: "BANK_STATEMENT_2" },
        { file: formData.allotmentLetter, type: "ALLOTMENT_LETTER" },
        {
          file: formData.newPropertyPaymentReceipts,
          type: "NEW_PROPERTY_PAYMENT_RECEIPTS",
        },
        { file: formData.titleDeeds, type: "TITLE_DEEDS" },
        {
          file: formData.resalePaymentReceipts,
          type: "RESALE_PAYMENT_RECEIPTS",
        },
        { file: formData.agreementCopy, type: "AGREEMENT_COPY" },
      ];

      if (formData.hasCoApplicant) {
        if (formData.coApplicantAadharFront)
          docsQueue.push({ file: formData.coApplicantAadharFront, type: "CO_APPLICANT_AADHAR_FRONT" });
        if (formData.coApplicantAadharBack)
          docsQueue.push({ file: formData.coApplicantAadharBack, type: "CO_APPLICANT_AADHAR_BACK" });
        if (formData.coApplicantPan)
          docsQueue.push({ file: formData.coApplicantPan, type: "CO_APPLICANT_PAN" });
        if (formData.coApplicantSelfie)
          docsQueue.push({ file: formData.coApplicantSelfie, type: "CO_APPLICANT_SELFIE" });
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

      // Do NOT set Content-Type — browser must add multipart boundary
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
        const backendMessage = error.response?.data?.message;
        const backendError = error.response?.data?.error || "";

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
          // Server responded with error status
          setError(
            backendMessage || "Failed to save application. Try again."
          );
          setValidationErrors(error.response?.data?.errors || []);
        }
      } else if (error.request) {
        // Request was made but no response received
        setError("Network error. Please check your connection and try again.");
      } else {
        // Something else happened
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

      hasCoApplicant: true,
      coApplicantMobile: "",
      coApplicantAadharFront: null,
      coApplicantAadharBack: null,
      coApplicantPan: null,
      coApplicantSelfie: null,

      password: "",
      confirmPassword: "",
    });
    setCurrentStep(0);
    setMaxStep(0);
    setFieldErrors({});
    setValidationErrors([]);
    setError("");
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

  const docChecklist = buildLoanDocChecklist(
    [
      { key: "panCard", label: "PAN Card", required: true, step: LOAN_STEP.PERSONAL },
      { key: "aadharFront", label: "Aadhaar Front", required: true, step: LOAN_STEP.PERSONAL },
      { key: "aadharBack", label: "Aadhaar Back", required: true, step: LOAN_STEP.PERSONAL },
      { key: "passportPhoto", altKeys: ["selfie"], label: "Applicant Photo", required: true, step: LOAN_STEP.PERSONAL },
      { key: "otherDocument", label: "Other Document", required: false, step: LOAN_STEP.PERSONAL },
      ...(formData.hasCoApplicant
        ? [
            { key: "coApplicantPan", label: "Co-Applicant PAN Card", required: true, step: LOAN_STEP.PERSONAL },
            { key: "coApplicantSelfie", label: "Co-Applicant Photo", required: true, step: LOAN_STEP.PERSONAL },
            { key: "coApplicantAadharFront", label: "Co-Applicant Aadhaar Front", required: true, step: LOAN_STEP.PERSONAL },
            { key: "coApplicantAadharBack", label: "Co-Applicant Aadhaar Back", required: true, step: LOAN_STEP.PERSONAL },
          ]
        : []),
      { key: "addressProof", label: "Address Proof", required: true, step: LOAN_STEP.ADDRESS },
      { key: "companyIdCard", label: "Company ID Card", required: true, step: LOAN_STEP.INCOME },
      { key: "salarySlip1", label: "Salary Slip 1", required: true, step: LOAN_STEP.INCOME },
      { key: "salarySlip2", label: "Salary Slip 2", required: true, step: LOAN_STEP.INCOME },
      { key: "salarySlip3", label: "Salary Slip 3", required: true, step: LOAN_STEP.INCOME },
      { key: "form16_26as", label: "Form 16 / 26AS", required: false, step: LOAN_STEP.INCOME },
      { key: "allotmentLetter", label: "Allotment Letter / Agreement Copy", required: false, step: LOAN_STEP.INCOME },
      { key: "titleDeeds", label: "Title Deeds / Chain Documents", required: false, step: LOAN_STEP.INCOME },
      { key: "newPropertyPaymentReceipts", label: "Property Payment Receipts", required: false, step: LOAN_STEP.INCOME },
      { key: "resalePaymentReceipts", label: "Resale Payment Receipts", required: false, step: LOAN_STEP.INCOME },
      { key: "agreementCopy", label: "Registered Agreement / Draft Agreement", required: false, step: LOAN_STEP.INCOME },
      { key: "bankStatement1", label: "Bank Statement 1", required: true, step: LOAN_STEP.INCOME },
      { key: "bankStatement2", label: "Bank Statement 2", required: false, step: LOAN_STEP.INCOME },
    ],
    formData
  );

  const previewDoc = (name) => {
    let url = "";
    if (formData[name]?.preview) {
      url = formData[name].preview;
    } else if (formData[name] instanceof File) {
      url = URL.createObjectURL(formData[name]);
      objectUrlsRef.current.push(url);
    }
    setdocumentModel(url);
  };

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
      onPreview={() => previewDoc(name)}
    />
  );

  const reviewSections = buildLoanReviewSections(formData, {
    profile: LOAN_PROFILE.SALARIED,
    hasProperty: true,
    hasCoApplicant: Boolean(formData.hasCoApplicant),
    sameAddress,
    loanTitle: "Home Loan (Salaried)",
  });

  const stabilityOptionsFor = (value) =>
    value && !LOAN_STABILITY_OPTIONS.some((o) => o.value === value)
      ? [{ label: value, value }, ...LOAN_STABILITY_OPTIONS]
      : LOAN_STABILITY_OPTIONS;

  const scrollToStep = (idx) => {
    const stepId = stepAnchorIds[idx];
    if (!stepId) return;
    const el = document.getElementById(stepId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToStep = (idx) => {
    setError("");
    setFieldErrors({});
    setValidationErrors([]);
    setEditingFromReview(idx !== LOAN_STEP.REVIEW);
    setCurrentStep(idx);
    scrollToStep(idx);
  };

  return (
    <>
      <DocumentPreviewModal
        url={documentModel}
        onClose={() => {
          if (documentModel && documentModel.startsWith("blob:")) {
            URL.revokeObjectURL(documentModel);
            objectUrlsRef.current = objectUrlsRef.current.filter(
              (url) => url !== documentModel
            );
          }
          setdocumentModel(null);
        }}
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

          {/* Customer Trust Banner & Partner Certificate Info */}
          {!isPartnerLoggedIn && (
            <PublicLoanPartnerTrustBanner
              partner={partnerInfo || (defaultReferralCode ? { partnerCode: defaultReferralCode } : null)}
              loanTitle="Home Loan (Salaried)"
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
                  Home Loan Application (Salaried)
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
                helperText="Step-by-step wizard. Draft is saved locally (text fields only)."
                onStepClick={(idx) => {
                  setCurrentStep(idx);
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
                  {/* Referral moved to end */}
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
                    {formData.pan ? "" : renderError("pan")}
                    <div className="mt-3">
                      {renderDocCard("panCard", LOAN_DOC_LABEL.panCard, { required: true })}
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
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      required
                    >
                      <option value="">Select status</option>
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
                    {renderDocCard("aadharFront", LOAN_DOC_LABEL.aadharFront, { required: true })}
                    {renderDocCard("aadharBack", LOAN_DOC_LABEL.aadharBack, { required: true })}
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-200 mt-6">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "#111827" }}>
                    <FileText className="w-5 h-5 text-teal-600" />
                    {LOAN_DOC_GROUP.PHOTO}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderDocCard("passportPhoto", LOAN_DOC_LABEL.photo, { required: true, accept: ".jpg,.jpeg,.png" })}
                    {renderDocCard("otherDocument", LOAN_DOC_LABEL.otherDoc, { hint: OPTIONAL_EXTRA_DOC_CAPTION })}
                  </div>
                </div>

                {/* Co-Applicant */}
                <div className="pt-6 border-t border-slate-200 mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-teal-600" />
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: "#111827" }}>
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
                            {LOAN_FIELD_LABEL.coApplicantMobile} *
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
                          {renderDocCard("coApplicantPan", LOAN_DOC_LABEL.coPanCard, { required: true })}
                          {renderDocCard("coApplicantSelfie", LOAN_DOC_LABEL.coPhoto, { required: true, accept: ".jpg,.jpeg,.png" })}
                          {renderDocCard("coApplicantAadharFront", LOAN_DOC_LABEL.coAadharFront, { required: true })}
                          {renderDocCard("coApplicantAadharBack", LOAN_DOC_LABEL.coAadharBack, { required: true })}
                        </div>
                      </div>
                    </div>
                  )}
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
                      onChange={handleFileChangeAddressProofs}
                      onRemove={handleFileRemove}
                      renderError={renderError}
                      uploadStatus={docUploadStatus.addressProof}
                      uploadProgress={docUploadProgress.addressProof}
                      onPreview={() => {
                        const doc = formData.addressProof;
                        if (!doc) return;
                        let url = doc.preview || doc.url || "";
                        if (!url && doc instanceof File) {
                          url = URL.createObjectURL(doc);
                          objectUrlsRef.current.push(url);
                        }
                        if (url) setdocumentModel(url);
                      }}
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
                    {renderDocCard("companyIdCard", LOAN_DOC_LABEL.companyIdCard, { required: true })}
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

                    {renderError('monthlySalary')}
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
                    {renderError('salaryInHand')}
                  </div>
                  <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "#111827" }}>
                      <FileText className="w-5 h-5 text-teal-600" />
                      {LOAN_DOC_GROUP.SALARY}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderDocCard("salarySlip1", LOAN_DOC_LABEL.salarySlip1, { required: true, accept: ".pdf,application/pdf" })}
                      {renderDocCard("salarySlip2", LOAN_DOC_LABEL.salarySlip2, { required: true, accept: ".pdf,application/pdf" })}
                      {renderDocCard("salarySlip3", LOAN_DOC_LABEL.salarySlip3, { required: true, accept: ".pdf,application/pdf" })}
                      {renderDocCard("form16_26as", LOAN_DOC_LABEL.form16)}
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

                      {renderError('totalExperience')}
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

                    {renderError('currentExperience')}
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

                <div className="mt-8 pt-6 border-t border-slate-200">
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
                        Estimated Property Value (₹) *
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
                        Complete Property Address *
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

                <div className="pt-6 border-t border-slate-200 mt-6">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "#111827" }}>
                    <FileText className="w-5 h-5 text-teal-600" />
                    {LOAN_DOC_GROUP.BANK}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Upload statements in sequence: Bank Statement 1, then Bank Statement 2.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderDocCard("bankStatement1", LOAN_DOC_LABEL.bankStatement1, { required: true, accept: ".pdf,application/pdf" })}
                    {renderDocCard("bankStatement2", LOAN_DOC_LABEL.bankStatement2, { accept: ".pdf,application/pdf" })}
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

                        {renderError('reference1Name')}
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

                        {renderError('reference1Contact')}
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

                        {renderError('reference2Name')}
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
                        {renderError('reference2Contact')}
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

                        {renderError('password')}
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
                        {renderError('confirmPassword')}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Partner Referral — public applicants only */}
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
                    if (currentStep === 0) return;
                    setError("");
                    setFieldErrors({});
                    setValidationErrors([]);
                    const next = currentStep - 1;
                    setCurrentStep(next);
                    requestAnimationFrame(() => {
                      const el = document.querySelector(`[name="${stepFirstFieldName[next]}"]`);
                      if (el && typeof el.focus === "function") el.focus();
                    });
                  }}
                  className={`px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors ${editingFromReview ? "hidden" : ""}`}
                  disabled={loading || currentStep === 0}
                >
                  Back
                </button>

                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (loading || isCheckingExistence) return;
                      setError("");
                      const stepErrors = validateHomeLoanSalariedStep(currentStep);
                      setFieldErrors(stepErrors);
                      setValidationErrors(Object.values(stepErrors));

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
                          loanType: "HOME_LOAN_SALARIED",
                          formData,
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
                        const el = document.querySelector(`[name="${stepFirstFieldName[nextStep]}"]`);
                        if (el && typeof el.focus === "function") el.focus();
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
    </div>

      {isPartnerLoggedIn && (
        <ShareLoanModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          loan={{
            id: "home-salaried",
            title: "Home Loan (Salaried)",
            badge: "Upto ₹5Cr",
            route: "/partner/application/home-loan-salaried",
            hasSubTypes: false,
          }}
          partnerCode={currentPartnerCode}
          partnerName={currentPartnerName}
        />
      )}
    </>
  );
}
