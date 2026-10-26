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

export default function LapLoanSalaried({ embed = false, actorRole = "auto" } = {}) {
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

    // Employment information
    totalExperience: "",
    currentExperience: "",
    salaryInHand: "",
    companyIdCard: "",
    salarySlip1: "",
    salarySlip2: "",
    salarySlip3: "",
    form16_26as: "",

    // Collateral Property information
    propertyType: "RESIDENTIAL",
    propertyValue: "",
    propertyAddress: "",

    reference1Name: "",
    reference1Contact: "",
    reference2Name: "",
    reference2Contact: "",
    loanAmount: "",

    // LAP Property documents
    titleDeeds: "",
    sanctionedPlan: "",
    propertyTaxReceipt: "",
    agreementCopy: "",
    allotmentLetter: "",

    // Co-applicant
    hasCoApplicant: true,
    coApplicantMobile: "",
    coApplicantAadharFront: null,
    coApplicantAadharBack: null,
    coApplicantPan: null,
    coApplicantSelfie: null,

    // KYC Documents
    aadharFront: "",
    aadharBack: "",
    panCard: "",
    passportPhoto: "",

    bankStatement1: "",
    bankStatement2: "",

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

  const [applicationId, setApplicationId] = useState(null);
  const [sameAddress, setSameAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [savedApplication, setSavedApplication] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [editingFromReview, setEditingFromReview] = useState(false);
  const [maxStep, setMaxStep] = useState(0);
  const objectUrlsRef = useRef([]);
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

  const steps = getLoanSteps({ profile: LOAN_PROFILE.SALARIED, hasProperty: true });
  const hasCoApplicant = Boolean(formData.hasCoApplicant);

  const stepAnchorIds = [
    "loan-personal-step",
    "loan-address-step",
    "loan-income-step",
    "loan-references-step",
    "loan-review-step",
  ];

  const stepFirstFieldName = [
    "loanAmount",
    "currentAddress",
    "companyName",
    "reference1Name",
    showPasswordFields
      ? "password"
      : (isPartnerLoggedIn ? "loanAmount" : "partnerReferralCode"),
  ];

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
      ...(hasCoApplicant
        ? [
            "coApplicantMobile",
            "coApplicantPan",
            "coApplicantSelfie",
            "coApplicantAadharFront",
            "coApplicantAadharBack",
          ]
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
      "titleDeeds",
      "sanctionedPlan",
      "propertyTaxReceipt",
      "agreementCopy",
      "allotmentLetter",
      "bankStatement1",
      "bankStatement2",
      "bankStatementPassword",
    ],
    ["reference1Name", "reference1Contact", "reference2Name", "reference2Contact"],
    [
      ...(showPasswordFields ? ["password", "confirmPassword"] : []),
      ...(!isPartnerLoggedIn ? ["partnerReferralCode"] : []),
    ],
  ];

  const scrollToStep = (idx) => {
    const stepId = stepAnchorIds[idx];
    if (!stepId) return;
    const el = document.getElementById(stepId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // ignore
        }
      });
      objectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (isPartnerLoggedIn) return;
    let cancelled = false;
    (async () => {
      const code = await fetchPublicDefaultPartnerReferralCode();
      if (!cancelled && code) {
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
    })();
    return () => {
      cancelled = true;
    };
  }, [isPartnerLoggedIn]);

  const phoneSchema = z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits.");
  const emailSchema = z.string().trim().email("Invalid email format.");
  const pinSchema = z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code.");
  const panSchema = z
    .string()
    .trim()
    .regex(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/, "Enter a valid PAN card number (e.g., ABCDE1234F).")
    .transform((s) => s.toUpperCase());

  const min3 = (msg) => z.string().trim().min(3, msg);

  function validateLapSalariedStep(stepIndex) {
    const fullErrors = validateRegistrationForm(formData, sameAddress);

    const stepFields = stepFieldKeys[stepIndex] || [];

    const errors = {};
    for (const key of stepFields) {
      if (fullErrors[key]) errors[key] = fullErrors[key];
    }

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]:
          name === "loanAmount"
            ? value === ""
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
    if (picked) {
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
      setFieldErrors((prev) => {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });

      const toastId = toast.loading(`Uploading ${file.name}...`);
      if (applicationId) {
        uploadLeadDocumentEarly({ applicationId, partnerToken, isPartnerLoggedIn, fieldName: name, file })
          .then((res) => {
            if (res?.ok) {
              toast.success(`${file.name} uploaded successfully!`, { id: toastId });
            } else {
              toast.error(`Upload failed for ${file.name}`, { id: toastId });
            }
          });
      } else {
        setTimeout(() => {
          toast.success(`${file.name} attached successfully!`, { id: toastId });
        }, 400);
      }
    }
  };

  const handleFileRemove = (fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  };

  const handleFileChangeAddressProofs = async (eOrFile) => {
    const input = eOrFile?.target;
    const picked = input?.files ? input.files[0] : (eOrFile instanceof File ? eOrFile : null);
    if (!picked) return;
    const err = validateLoanDocumentUpload(picked, "addressProof");
    if (err) {
      toast.error(err);
      if (input) input.value = "";
      return;
    }
    let file;
    try {
      file = await snapshotLoanFile(picked);
    } catch {
      toast.error(UNREADABLE_LOAN_FILE_MESSAGE);
      if (input) input.value = "";
      return;
    }
    setFormData((prev) => ({
      ...prev,
      addressProof: file,
    }));
    setFieldErrors((prev) => {
      if (!prev.addressProof) return prev;
      const next = { ...prev };
      delete next.addressProof;
      return next;
    });

    const toastId = toast.loading(`Uploading ${file.name}...`);
    if (applicationId) {
      uploadLeadDocumentEarly({ applicationId, partnerToken, isPartnerLoggedIn, fieldName: "addressProof", file })
        .then((res) => {
          if (res?.ok) {
            toast.success(`${file.name} uploaded successfully!`, { id: toastId });
          } else {
            toast.error(`Upload failed for ${file.name}`, { id: toastId });
          }
        });
    } else {
      setTimeout(() => {
        toast.success(`${file.name} attached successfully!`, { id: toastId });
      }, 400);
    }
  };

  function getAgeFromDOB(dobString) {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  function validateRegistrationForm(data, isSameAddress = sameAddress) {
    const errors = {};

    if (!data.firstName) errors.firstName = "First name is required.";
    if (!data.lastName) errors.lastName = "Last name is required.";
    if (!data.motherName) errors.motherName = "Mother's name is required.";
    if (!data.gender) errors.gender = "Gender is required.";
    if (!data.maritalStatus) errors.maritalStatus = "Marital status is required.";
    if (isMarriedStatus(data.maritalStatus) && !String(data.wifeName || "").trim()) {
      errors.wifeName = "Spouse name is required for married applicants.";
    }

    if (!data.loanPurpose) {
      errors.loanPurpose = "Loan purpose is required.";
    }
    if (data.hasRunningLoan === "YES" && (!data.monthlyEmiPaying || Number(data.monthlyEmiPaying) <= 0)) {
      errors.monthlyEmiPaying = "Monthly EMI is required when running loan is Yes.";
    }
    Object.assign(errors, validatePersonFinancialFields(data));

    const loanAmountError = loanAmountRangeError(data.loanAmount);
    if (loanAmountError) errors.loanAmount = loanAmountError;

    if (showPasswordFields) {
      Object.assign(errors, customerPasswordErrors(data));
    }

    if (!data.contactNo) {
      errors.contactNo = "Contact number is required.";
    } else if (!/^\d{10}$/.test(data.contactNo)) {
      errors.contactNo = "Contact number must be exactly 10 digits.";
    }
    if (data.alternateContact && !/^\d{10}$/.test(data.alternateContact)) {
      errors.alternateContact = "Alternate number must be exactly 10 digits.";
    }

    if (!data.email) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
      errors.email = "Invalid email format.";
    }

    if (!data.dob) {
      errors.dob = "Date of Birth is required.";
    } else if (getAgeFromDOB(data.dob) < 18) {
      errors.dob = "You must be at least 18 years old to proceed.";
    }

    if (!data.currentAddress) errors.currentAddress = "Current address is required.";
    if (!data.stabilityOfResidency) errors.stabilityOfResidency = "Stability of residency is required.";
    if (!data.currentLandmark) errors.currentLandmark = "Current landmark is required.";
    if (!data.currentHouseStatus) errors.currentHouseStatus = "Current house status is required.";

    const pin = String(data.currentAddressPinCode ?? "").trim();
    if (!pin) {
      errors.currentAddressPinCode = "Current Address Pin is required.";
    } else if (!/^[1-9][0-9]{5}$/.test(pin)) {
      errors.currentAddressPinCode = "Enter a valid 6-digit PIN code.";
    }

    if (!isSameAddress) {
      if (!data.permanentAddress) errors.permanentAddress = "Permanent address is required.";
      if (!data.permanentStability) errors.permanentStability = "Permanent stability is required.";
      if (!data.permanentLandmark) errors.permanentLandmark = "Permanent landmark is required.";
      if (!data.permanentHouseStatus) errors.permanentHouseStatus = "Permanent house status is required.";
      const permPin = String(data.permanentAddressPinCode ?? "").trim();
      if (!permPin) {
        errors.permanentAddressPinCode = "Permanent Address Pin is required.";
      } else if (!/^[1-9][0-9]{5}$/.test(permPin)) {
        errors.permanentAddressPinCode = "Enter a valid 6-digit PIN code.";
      }
    }

    if (!data.aadharFront) errors.aadharFront = "Aadhar Front is required.";
    if (!data.aadharBack) errors.aadharBack = "Aadhar Back is required.";
    if (!data.panCard) errors.panCard = "PAN card document is required.";
    if (!data.pan) {
      errors.pan = "PAN Card is required.";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(data.pan).toUpperCase())) {
      errors.pan = "Enter a valid PAN Card number (e.g., ABCDE1234F).";
    }

    if (!data.passportPhoto && !data.selfie) {
      errors.passportPhoto = "Applicant photo is required.";
    }
    if (!data.addressProof) {
      errors.addressProof = "Address proof is required.";
    }

    // Co-applicant validation
    if (data.hasCoApplicant) {
      if (!data.coApplicantAadharFront) errors.coApplicantAadharFront = "Co-applicant Aadhar front is required.";
      if (!data.coApplicantAadharBack) errors.coApplicantAadharBack = "Co-applicant Aadhar back is required.";
      if (!data.coApplicantPan) errors.coApplicantPan = "Co-applicant PAN is required.";
      if (!data.coApplicantMobile) {
        errors.coApplicantMobile = "Co-applicant mobile is required.";
      } else if (!/^\d{10}$/.test(data.coApplicantMobile)) {
        errors.coApplicantMobile = "Mobile must be 10 digits.";
      }
      if (!data.coApplicantSelfie) errors.coApplicantSelfie = "Co-applicant selfie is required.";
    }

    if (!data.companyName) errors.companyName = "Company name is required.";
    if (!data.designation) errors.designation = "Designation is required.";
    if (!data.companyAddress) errors.companyAddress = "Company address is required.";
    if (!data.monthlySalary) errors.monthlySalary = "Monthly salary is required.";
    if (!data.totalExperience) errors.totalExperience = "Total Experience is required.";
    if (!data.currentExperience) errors.currentExperience = "Current Experience is required.";
    if (!data.salaryInHand) errors.salaryInHand = "Salary in hand is required.";
    if (!data.companyIdCard) errors.companyIdCard = "Company Id card is required.";
    if (!data.salarySlip1) errors.salarySlip1 = "Salary slip 1 is required.";
    if (!data.salarySlip2) errors.salarySlip2 = "Salary slip 2 is required.";
    if (!data.salarySlip3) errors.salarySlip3 = "Salary slip 3 is required.";
    if (!data.bankStatement1) errors.bankStatement1 = "Bank Statement 1 is required.";

    // Collateral Property Details
    if (!data.propertyType) errors.propertyType = "Property type is required.";
    if (!(Number(data.propertyValue) > 0)) errors.propertyValue = "Property estimated value must be greater than zero.";
    if (!data.propertyAddress) errors.propertyAddress = "Property address is required.";

    if (!data.reference1Name) errors.reference1Name = "Reference 1 name is required.";
    if (!data.reference1Contact) {
      errors.reference1Contact = "Reference 1 contact is required.";
    } else if (!/^\d{10}$/.test(data.reference1Contact)) {
      errors.reference1Contact = "Reference 1 contact must be exactly 10 digits.";
    }

    if (!data.reference2Name) errors.reference2Name = "Reference 2 name is required.";
    if (!data.reference2Contact) {
      errors.reference2Contact = "Reference 2 contact is required.";
    } else if (!/^\d{10}$/.test(data.reference2Contact)) {
      errors.reference2Contact = "Reference 2 contact must be exactly 10 digits.";
    } else if (data.reference2Contact === data.reference1Contact) {
      errors.reference2Contact = "Reference 2 contact cannot be the same as Reference 1.";
    }

    return errors;
  }

  const renderError = (field) => {
    return fieldErrors[field] ? (
      <p className="text-red-500 text-xs mt-1">{fieldErrors[field]}</p>
    ) : null;
  };

  const handleNextStep = async () => {
    const errs = validateLapSalariedStep(currentStep);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      toast.error("Please fill in all required fields before proceeding.");
      return;
    }
    setFieldErrors({});

    // Sync filled wizard fields to LEAD so RM sees progress
    const leavingStep = currentStep;
    const next = resolveLoanNextStep(currentStep, { editingFromReview });
    if (!isRmMode && !isEditingExistingApp) {
      const leadProgress = persistLeadWizardProgress({
        applicationId,
        setApplicationId,
        leavingStepIndex: leavingStep,
        nextStepIndex: next,
        steps,
        loanType: "LAP_SALARIED",
        formData,
        isPartnerLoggedIn,
        partnerToken,
        partnerReferralCode: currentPartnerCode,
        isRmMode,
      }).catch((err) => console.warn("Lead progress sync non-fatal:", err));
      if (leavingStep === LOAN_STEP.PERSONAL) {
        const result = await leadProgress;
        if (result?.blocked) {
          setError(result.message);
          toast.error(result.message);
          return;
        }
      }
    }

    setEditingFromReview(false);
    setCurrentStep(next);
    if (next > maxStep) setMaxStep(next);
  };

  const handlePrevStep = () => {
    if (currentStep > LOAN_STEP.PERSONAL) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (loading) return;
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
        setError(`Please fix the highlighted fields: ${Object.values(errors).join(" ")}`);
        setLoading(false);
        return;
      }

      const applicationData = {
        loanType: "LAP_SALARIED",
        partnerReferralCode: isPartnerLoggedIn
          ? undefined
          : formData.partnerReferralCode?.trim() || undefined,
        customer: {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
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
        docs: [],
        propertyType: formData.propertyType,
        propertyValue: formData.propertyValue ? Number(formData.propertyValue) : undefined,
        propertyAddress: formData.propertyAddress,
      };

      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(applicationData));

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
        { file: formData.titleDeeds, type: "TITLE_DEEDS" },
        { file: formData.sanctionedPlan, type: "SANCTIONED_PLAN" },
        { file: formData.propertyTaxReceipt, type: "PROPERTY_TAX_RECEIPT" },
        { file: formData.agreementCopy, type: "AGREEMENT_COPY" },
        { file: formData.allotmentLetter, type: "ALLOTMENT_LETTER" },
      ];

      if (formData.hasCoApplicant) {
        if (formData.coApplicantAadharFront) docsQueue.push({ file: formData.coApplicantAadharFront, type: "CO_APPLICANT_AADHAR_FRONT" });
        if (formData.coApplicantAadharBack) docsQueue.push({ file: formData.coApplicantAadharBack, type: "CO_APPLICANT_AADHAR_BACK" });
        if (formData.coApplicantPan) docsQueue.push({ file: formData.coApplicantPan, type: "CO_APPLICANT_PAN" });
        if (formData.coApplicantSelfie) docsQueue.push({ file: formData.coApplicantSelfie, type: "CO_APPLICANT_SELFIE" });
      }

      const rawDocs = docsQueue.filter(({ file }) => (file instanceof File || file?.file instanceof File));
      const oversize = findOversizeInLoanDocsQueue(rawDocs);
      if (oversize) {
        const msg = formatLoanDocOversizeError(oversize);
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      docsQueue.forEach(({ file, type }) => {
        const rawFile = file instanceof File ? file : file?.file;
        if (rawFile instanceof File) {
          formDataToSend.append("docs", rawFile);
          formDataToSend.append("docTypes", type);
        }
      });

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

      const headers = isPartnerLoggedIn
        ? {
            Authorization: `Bearer ${partnerToken}`,
          }
        : {};

      const response = await postLoanFormWithRetry(endpoint, formDataToSend, { headers });

      if (response.data.success || response.data.application) {
        setSuccessMessage("LAP application submitted successfully!");
        setSavedApplication(response.data.application);
        toast.success("Application created successfully!");
      }
    } catch (err) {
      console.error("Submission error:", err);
      const msg = err.response?.data?.message || "Failed to submit application.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepErrorCounts = useMemo(() => {
    const counts = {};
    for (let idx = 0; idx < LOAN_STEP.REVIEW; idx += 1) {
      const e = validateLapSalariedStep(idx);
      counts[idx] = Object.keys(e).length;
    }
    return counts;
  }, [formData, sameAddress]);

  const docChecklist = buildLoanDocChecklist(
    [
      { key: "panCard", label: "PAN Card", required: true, step: LOAN_STEP.PERSONAL },
      { key: "passportPhoto", altKeys: ["selfie"], label: "Applicant Photo", required: true, step: LOAN_STEP.PERSONAL },
      { key: "aadharFront", label: "Aadhaar Front", required: true, step: LOAN_STEP.PERSONAL },
      { key: "aadharBack", label: "Aadhaar Back", required: true, step: LOAN_STEP.PERSONAL },
      { key: "otherDocument", label: "Other Document", required: false, step: LOAN_STEP.PERSONAL },
      { key: "addressProof", label: "Address Proof", required: true, step: LOAN_STEP.ADDRESS },
      { key: "companyIdCard", label: "Company ID Card", required: true, step: LOAN_STEP.INCOME },
      { key: "salarySlip1", label: "Salary Slip 1", required: true, step: LOAN_STEP.INCOME },
      { key: "salarySlip2", label: "Salary Slip 2", required: true, step: LOAN_STEP.INCOME },
      { key: "salarySlip3", label: "Salary Slip 3", required: true, step: LOAN_STEP.INCOME },
      { key: "form16_26as", label: "Form 16 / 26AS", required: false, step: LOAN_STEP.INCOME },
      { key: "bankStatement1", label: "Bank Statement 1", required: true, step: LOAN_STEP.INCOME },
      { key: "bankStatement2", label: "Bank Statement 2", required: false, step: LOAN_STEP.INCOME },
      { key: "titleDeeds", label: "Title Deeds / Sale Deed", required: false, step: LOAN_STEP.INCOME },
      { key: "sanctionedPlan", label: "Sanctioned Plan", required: false, step: LOAN_STEP.INCOME },
      { key: "propertyTaxReceipt", label: "Property Tax Receipt", required: false, step: LOAN_STEP.INCOME },
      { key: "agreementCopy", label: "Agreement Copy", required: false, step: LOAN_STEP.INCOME },
      { key: "allotmentLetter", label: "Allotment Letter", required: false, step: LOAN_STEP.INCOME },
      ...(hasCoApplicant
        ? [
            { key: "coApplicantAadharFront", label: "Co-Applicant Aadhaar Front", required: true, step: LOAN_STEP.PERSONAL },
            { key: "coApplicantAadharBack", label: "Co-Applicant Aadhaar Back", required: true, step: LOAN_STEP.PERSONAL },
            { key: "coApplicantPan", label: "Co-Applicant PAN Card", required: true, step: LOAN_STEP.PERSONAL },
            { key: "coApplicantSelfie", label: "Co-Applicant Photo", required: true, step: LOAN_STEP.PERSONAL },
          ]
        : []),
    ],
    formData
  );

  const reviewSections = buildLoanReviewSections(formData, {
    profile: LOAN_PROFILE.SALARIED,
    hasProperty: true,
    hasCoApplicant,
    sameAddress,
    loanTitle: "Loan Against Property (Salaried)",
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

  return (
    <div className={`w-full max-w-5xl mx-auto ${embed ? "p-0" : "p-4 sm:p-6"}`}>
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

      {/* Customer Trust Banner & Partner Certificate Info */}
      {!isPartnerLoggedIn && (
        <PublicLoanPartnerTrustBanner
          partner={partnerInfo || (defaultReferralCode ? { partnerCode: defaultReferralCode } : null)}
          loanTitle="LAP Loan (Salaried)"
        />
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white">
                <Building className="w-6 h-6" />
              </span>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-teal-300">
                  Loan Against Property · Salaried
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold">
                  LAP Loan Application
                </h1>
              </div>
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
          <p className="text-sm text-teal-100 max-w-2xl">
            Loan Against Property for salaried professionals pledging owned residential, commercial, or industrial properties.
          </p>
        </div>

        {/* Stepper */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <LoanStepper
            steps={steps}
            currentStep={currentStep}
            maxStep={maxStep}
            stepErrorCounts={stepErrorCounts}
            onStepClick={(idx) => {
              if (idx <= maxStep) setCurrentStep(idx);
            }}
          />
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Step 0: Loan & Personal */}
            <section id="loan-personal-step" hidden={currentStep !== LOAN_STEP.PERSONAL} className="space-y-6">
              <LoanDocsProgress checklist={docChecklistForStep(docChecklist, LOAN_STEP.PERSONAL)} />
              <LoanRequirementFields
                formData={formData}
                handleInputChange={handleInputChange}
                renderError={renderError}
              />
              <LoanApplicantFinancialFields
                formData={formData}
                handleInputChange={handleInputChange}
                renderError={renderError}
                fieldErrors={fieldErrors}
                showLoanPurpose={false}
              />
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                {LOAN_SECTION.PERSONAL}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("firstName")}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Middle Name (Optional)
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Enter middle name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("lastName")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="contactNo"
                    maxLength={10}
                    value={formData.contactNo}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("contactNo")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Alternate Mobile (Optional)
                  </label>
                  <input
                    type="tel"
                    name="alternateContact"
                    maxLength={10}
                    value={formData.alternateContact || ""}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("alternateContact")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="applicant@email.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("email")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    name="pan"
                    maxLength={10}
                    value={formData.pan}
                    onChange={(e) =>
                      handleInputChange({
                        target: { name: "pan", value: e.target.value.toUpperCase() },
                      })
                    }
                    placeholder="ABCDE1234F"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm uppercase"
                  />
                  {renderError("pan")}
                  <div className="mt-3">
                    <DocumentUploadCard
                      name="panCard"
                      label="Upload PAN Card *"
                      file={formData.panCard}
                      required
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                      error={renderError("panCard")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("dob")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender ? (formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1).toLowerCase()) : ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {renderError("gender")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Marital Status *
                  </label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus ? (formData.maritalStatus.charAt(0).toUpperCase() + formData.maritalStatus.slice(1).toLowerCase()) : ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                  {renderError("maritalStatus")}
                </div>

                {isMarriedStatus(formData.maritalStatus) && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Spouse Name *
                    </label>
                    <input
                      type="text"
                      name="wifeName"
                      value={formData.wifeName}
                      onChange={handleInputChange}
                      placeholder="Spouse full name"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                    {renderError("wifeName")}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mother's Name *
                  </label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleInputChange}
                    placeholder="Mother's full name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("motherName")}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-slate-900">
                  <FileText className="w-5 h-5 text-teal-600" />
                  {LOAN_DOC_GROUP.AADHAAR}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DocumentUploadCard
                    name="aadharFront"
                    label="Aadhaar Front *"
                    file={formData.aadharFront}
                    required
                    onChange={handleFileChange}
                    onRemove={handleFileRemove}
                    error={renderError("aadharFront")}
                  />
                  <DocumentUploadCard
                    name="aadharBack"
                    label="Aadhaar Back *"
                    file={formData.aadharBack}
                    required
                    onChange={handleFileChange}
                    onRemove={handleFileRemove}
                    error={renderError("aadharBack")}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-slate-900">
                  <FileText className="w-5 h-5 text-teal-600" />
                  {LOAN_DOC_GROUP.PHOTO}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DocumentUploadCard
                    name="passportPhoto"
                    label="Applicant Photo *"
                    file={formData.passportPhoto}
                    required
                    onChange={handleFileChange}
                    onRemove={handleFileRemove}
                    error={renderError("passportPhoto")}
                  />
                  <DocumentUploadCard
                    name="otherDocument"
                    label="Other Document (Optional)"
                    file={formData.otherDocument}
                    hint={OPTIONAL_EXTRA_DOC_CAPTION}
                    onChange={handleFileChange}
                    onRemove={handleFileRemove}
                  />
                </div>
              </div>

              {/* Co-Applicant */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {LOAN_SECTION.CO_APPLICANT}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Co-applicant details are mandatory for this loan
                    </p>
                  </div>
                </div>

                {formData.hasCoApplicant && (
                  <div className="mt-4 p-5 rounded-xl border border-teal-200 bg-teal-50/20">
                    <div className="max-w-sm">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Co-Applicant Mobile *
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        name="coApplicantMobile"
                        value={formData.coApplicantMobile}
                        onChange={handleInputChange}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                      />
                      {renderError("coApplicantMobile")}
                    </div>

                    <div className="pt-6 mt-6 border-t border-teal-200">
                      <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-slate-900">
                        <Users className="w-5 h-5 text-teal-600" />
                        {LOAN_DOC_GROUP.CO_APPLICANT}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DocumentUploadCard
                          name="coApplicantPan"
                          label="Co-Applicant PAN Card *"
                          file={formData.coApplicantPan}
                          required
                          onChange={handleFileChange}
                          onRemove={handleFileRemove}
                          error={renderError("coApplicantPan")}
                        />
                        <DocumentUploadCard
                          name="coApplicantSelfie"
                          label="Co-Applicant Photo / Selfie *"
                          file={formData.coApplicantSelfie}
                          required
                          onChange={handleFileChange}
                          onRemove={handleFileRemove}
                          error={renderError("coApplicantSelfie")}
                        />
                        <DocumentUploadCard
                          name="coApplicantAadharFront"
                          label="Co-Applicant Aadhaar Front *"
                          file={formData.coApplicantAadharFront}
                          required
                          onChange={handleFileChange}
                          onRemove={handleFileRemove}
                          error={renderError("coApplicantAadharFront")}
                        />
                        <DocumentUploadCard
                          name="coApplicantAadharBack"
                          label="Co-Applicant Aadhaar Back *"
                          file={formData.coApplicantAadharBack}
                          required
                          onChange={handleFileChange}
                          onRemove={handleFileRemove}
                          error={renderError("coApplicantAadharBack")}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

          {/* Step 1: Address */}
            <section id="loan-address-step" hidden={currentStep !== LOAN_STEP.ADDRESS} className="space-y-6">
              <LoanDocsProgress checklist={docChecklistForStep(docChecklist, LOAN_STEP.ADDRESS)} />
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                {LOAN_SECTION.CURRENT_ADDRESS}
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Address (House / Flat / Area) *
                </label>
                <textarea
                  name="currentAddress"
                  rows="2"
                  value={formData.currentAddress}
                  onChange={handleInputChange}
                  placeholder="House / flat no, building, street, area"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                />
                {renderError("currentAddress")}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Landmark *
                  </label>
                  <input
                    type="text"
                    name="currentLandmark"
                    value={formData.currentLandmark}
                    onChange={handleInputChange}
                    placeholder="Nearby landmark"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("currentLandmark")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    name="currentAddressPinCode"
                    value={formData.currentAddressPinCode}
                    onChange={handleInputChange}
                    placeholder="6-digit PIN code"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("currentAddressPinCode")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    House Status *
                  </label>
                  <select
                    name="currentHouseStatus"
                    value={houseStatusOptionValue(formData.currentHouseStatus, ["Owned", "Rented", "Parental"])}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Select Status</option>
                    <option value="Owned">Owned</option>
                    <option value="Rented">Rented</option>
                    <option value="Parental">Parental / Family Owned</option>
                  </select>
                  {renderError("currentHouseStatus")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Years at this Address *
                  </label>
                  <select
                    name="stabilityOfResidency"
                    value={formData.stabilityOfResidency || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
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
                />
              </div>

              <div className="pt-4 border-t border-slate-200">
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={sameAddress}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSameAddress(checked);
                      if (checked) {
                        setFormData((p) => ({
                          ...p,
                          permanentAddress: p.currentAddress,
                          permanentLandmark: p.currentLandmark,
                          permanentAddressPinCode: p.currentAddressPinCode,
                          permanentHouseStatus: p.currentHouseStatus,
                          permanentStability: p.stabilityOfResidency,
                        }));
                      }
                    }}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  {LOAN_FIELD_LABEL.sameAddress}
                </label>
              </div>

              {!sameAddress && (
                <>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-600" />
                    {LOAN_SECTION.PERMANENT_ADDRESS}
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Address (House / Flat / Area) *
                    </label>
                    <textarea
                      name="permanentAddress"
                      rows="2"
                      value={formData.permanentAddress}
                      onChange={handleInputChange}
                      placeholder="House / flat no, building, street, area"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                    {renderError("permanentAddress")}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Landmark *
                      </label>
                      <input
                        type="text"
                        name="permanentLandmark"
                        value={formData.permanentLandmark}
                        onChange={handleInputChange}
                        placeholder="Nearby landmark"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                      {renderError("permanentLandmark")}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        name="permanentAddressPinCode"
                        value={formData.permanentAddressPinCode}
                        onChange={handleInputChange}
                        placeholder="6-digit PIN code"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                      {renderError("permanentAddressPinCode")}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        House Status *
                      </label>
                      <select
                        name="permanentHouseStatus"
                        value={houseStatusOptionValue(formData.permanentHouseStatus, ["Owned", "Rented", "Parental"])}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                      >
                        <option value="">Select Status</option>
                        <option value="Owned">Owned</option>
                        <option value="Rented">Rented</option>
                        <option value="Parental">Parental / Family Owned</option>
                      </select>
                      {renderError("permanentHouseStatus")}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Years at this Address *
                      </label>
                      <select
                        name="permanentStability"
                        value={formData.permanentStability || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
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
            </section>

          {/* Step 2: Work & Property */}
            <section id="loan-income-step" hidden={currentStep !== LOAN_STEP.INCOME} className="space-y-6">
              <LoanDocsProgress checklist={docChecklistForStep(docChecklist, LOAN_STEP.INCOME)} />
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600" />
                {LOAN_SECTION.EMPLOYMENT}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Employer / company name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("companyName")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Designation *
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    placeholder="Your designation"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("designation")}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Company Address *
                  </label>
                  <textarea
                    name="companyAddress"
                    rows="2"
                    value={formData.companyAddress}
                    onChange={handleInputChange}
                    placeholder="Office complete address"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("companyAddress")}
                </div>

                <div className="md:col-span-2">
                  <DocumentUploadCard
                    name="companyIdCard"
                    label="Company ID Card *"
                    file={formData.companyIdCard}
                    required
                    onChange={handleFileChange}
                    onRemove={handleFileRemove}
                    error={renderError("companyIdCard")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Monthly Salary (₹) *
                  </label>
                  <input
                    type="number"
                    name="monthlySalary"
                    value={formData.monthlySalary}
                    onChange={handleInputChange}
                    placeholder="e.g. 75000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("monthlySalary")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Salary in Hand (₹) *
                  </label>
                  <input
                    type="number"
                    name="salaryInHand"
                    value={formData.salaryInHand}
                    onChange={handleInputChange}
                    placeholder="Net salary credited"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("salaryInHand")}
                </div>

                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-slate-900">
                    <FileText className="w-5 h-5 text-teal-600" />
                    {LOAN_DOC_GROUP.SALARY}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentUploadCard
                      name="salarySlip1"
                      label="Salary Slip (Month 1) *"
                      file={formData.salarySlip1}
                      required
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                      error={renderError("salarySlip1")}
                    />
                    <DocumentUploadCard
                      name="salarySlip2"
                      label="Salary Slip (Month 2) *"
                      file={formData.salarySlip2}
                      required
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                      error={renderError("salarySlip2")}
                    />
                    <DocumentUploadCard
                      name="salarySlip3"
                      label="Salary Slip (Month 3) *"
                      file={formData.salarySlip3}
                      required
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                      error={renderError("salarySlip3")}
                    />
                    <DocumentUploadCard
                      name="form16_26as"
                      label="Form 16 / 26AS (Optional)"
                      file={formData.form16_26as}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Total Experience (Years) *
                  </label>
                  <input
                    type="number"
                    name="totalExperience"
                    value={formData.totalExperience}
                    onChange={handleInputChange}
                    placeholder="e.g. 5"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("totalExperience")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Company Experience (Years) *
                  </label>
                  <input
                    type="number"
                    name="currentExperience"
                    value={formData.currentExperience}
                    onChange={handleInputChange}
                    placeholder="Years with current employer"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("currentExperience")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Salary Receipt Mode (Optional)
                  </label>
                  <select
                    name="salaryReceiptMode"
                    value={formData.salaryReceiptMode || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Official Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="officialEmail"
                    value={formData.officialEmail}
                    onChange={handleInputChange}
                    placeholder="official@company.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              {/* Property Details */}
              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-teal-600" />
                  {LOAN_SECTION.PROPERTY}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Property Type *
                    </label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                    >
                      <option value="RESIDENTIAL">Residential (Flat / House / Villa)</option>
                      <option value="COMMERCIAL">Commercial (Shop / Office / Building)</option>
                      <option value="INDUSTRIAL">Industrial (Factory / Warehouse / Shed)</option>
                      <option value="PLOT">Residential / Commercial Plot</option>
                    </select>
                    {renderError("propertyType")}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Property Value (₹) *
                    </label>
                    <input
                      type="number"
                      name="propertyValue"
                      value={formData.propertyValue}
                      onChange={handleInputChange}
                      placeholder="Estimated value in ₹"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                    {renderError("propertyValue")}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Property Address *
                    </label>
                    <textarea
                      name="propertyAddress"
                      rows="2"
                      value={formData.propertyAddress}
                      onChange={handleInputChange}
                      placeholder="Address of property offered as collateral"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                    {renderError("propertyAddress")}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200">
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-slate-900">
                    <Home className="w-5 h-5 text-teal-600" />
                    {LOAN_DOC_GROUP.PROPERTY}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Upload documents related to the property pledged as collateral
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentUploadCard
                      name="titleDeeds"
                      label="Title Deeds / Sale Deed / Conveyance"
                      file={formData.titleDeeds}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                    <DocumentUploadCard
                      name="sanctionedPlan"
                      label="Sanctioned Map / Building Plan"
                      file={formData.sanctionedPlan}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                    <DocumentUploadCard
                      name="propertyTaxReceipt"
                      label="Latest Property Tax Receipt / Utility Bill"
                      file={formData.propertyTaxReceipt}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                    <DocumentUploadCard
                      name="agreementCopy"
                      label="Prior Chain Documents / Agreement Copy"
                      file={formData.agreementCopy}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                    <DocumentUploadCard
                      name="allotmentLetter"
                      label="Allotment Letter"
                      file={formData.allotmentLetter}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-slate-900">
                  <FileText className="w-5 h-5 text-teal-600" />
                  {LOAN_DOC_GROUP.BANK}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Upload statements in sequence: Bank Statement 1 (salary account), then Bank Statement 2.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DocumentUploadCard
                    name="bankStatement1"
                    label="Bank Statement 1 (Salary A/C) *"
                    file={formData.bankStatement1}
                    required
                    onChange={handleFileChange}
                    onRemove={handleFileRemove}
                    error={renderError("bankStatement1")}
                  />
                  <DocumentUploadCard
                    name="bankStatement2"
                    label="Bank Statement 2 (Optional)"
                    file={formData.bankStatement2}
                    onChange={handleFileChange}
                    onRemove={handleFileRemove}
                  />
                </div>
                <div className="mt-4 max-w-sm">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bank Statement Password (Optional)
                  </label>
                  <input
                    type="text"
                    name="bankStatementPassword"
                    value={formData.bankStatementPassword}
                    onChange={handleInputChange}
                    placeholder="Password (if protected)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>
            </section>

          {/* Step 3: References */}
            <section id="loan-references-step" hidden={currentStep !== LOAN_STEP.REFERENCES} className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                References
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold text-sm text-slate-800 mb-3">Reference 1</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="reference1Name"
                        value={formData.reference1Name}
                        onChange={handleInputChange}
                        placeholder="Reference full name"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                      {renderError("reference1Name")}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        name="reference1Contact"
                        value={formData.reference1Contact}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                      {renderError("reference1Contact")}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold text-sm text-slate-800 mb-3">Reference 2</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="reference2Name"
                        value={formData.reference2Name}
                        onChange={handleInputChange}
                        placeholder="Reference full name"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                      {renderError("reference2Name")}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        name="reference2Contact"
                        value={formData.reference2Contact}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                      {renderError("reference2Contact")}
                    </div>
                  </div>
                </div>
              </div>
            </section>

          {/* Step 4: Review & Submit */}
            <section id="loan-review-step" hidden={currentStep !== LOAN_STEP.REVIEW} className="space-y-6">
              <LoanReviewSummary
                sections={reviewSections}
                docChecklist={docChecklist}
                onEdit={goToStep}
                editable={!loading}
              />

              {(showPasswordFields || !isPartnerLoggedIn) && (
                <div className="pt-6 border-t border-slate-200">
                  {showPasswordFields && (
                    <>
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                        <FileText className="w-5 h-5 text-teal-600" />
                        {LOAN_SECTION.ACCOUNT}
                      </h2>
                      <p className="text-xs text-slate-500 mb-4">
                        Optional. Leave blank and a customer password will be generated automatically.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Account Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              placeholder="Enter strong password"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {renderError("password")}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              placeholder="Repeat password"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {renderError("confirmPassword")}
                        </div>
                      </div>
                    </>
                  )}

                  {!isPartnerLoggedIn && (
                    <div className="mt-4">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Partner Referral Code (optional) - use {defaultReferralCode} if you don't have a partner code
                      </label>
                      <input
                        type="text"
                        name="partnerReferralCode"
                        value={formData.partnerReferralCode}
                        onChange={handleInputChange}
                        placeholder="Enter partner code"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                  {successMessage}
                  {savedApplication?.appNo && (
                    <span className="block font-bold mt-1">Application No: {savedApplication.appNo}</span>
                  )}
                </div>
              )}
            </section>

          {/* Navigation Buttons */}
          {editingFromReview && (
            <p className="mt-6 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
              {LOAN_REVIEW_EDIT_HINT}
            </p>
          )}
          <div className={`flex items-center pt-6 border-t border-slate-200 ${editingFromReview ? "justify-end" : "justify-between"}`}>
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === LOAN_STEP.PERSONAL || loading}
              className={`px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50 ${editingFromReview ? "hidden" : ""}`}
            >
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-8 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md transition"
              >
                {editingFromReview ? LOAN_BACK_TO_REVIEW_LABEL : "Next Step"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-60"
              >
                {loading ? "Submitting Application..." : "Submit LAP Application"}
              </button>
            )}
          </div>
        </div>
      </div>

      {isPartnerLoggedIn && (
        <ShareLoanModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          loan={{
            id: "lap-salaried",
            title: "LAP (Salaried)",
            badge: "Upto ₹5Cr",
            route: "/partner/application/lap-loan-salaried",
            hasSubTypes: false,
          }}
          partnerCode={currentPartnerCode}
          partnerName={currentPartnerName}
        />
      )}
    </div>
  );
}
