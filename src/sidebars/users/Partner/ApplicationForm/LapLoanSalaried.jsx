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
import { z } from "zod";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

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
import {
  findOversizeInLoanDocsQueue,
  formatLoanDocOversizeError,
} from "../../../../utils/docUploadLimits";
import {
  validateLoanDocumentUpload,
  loanDocumentFieldHint,
} from "../../../../utils/loanDocumentUpload";
import { OPTIONAL_EXTRA_DOC_CAPTION } from "../../../../utils/loanAddressProofCopy";
import LoanApplicantFinancialFields from "../../../../components/loan/LoanApplicantFinancialFields";
import { captureLeadOnStep1Next } from "../../../../utils/captureLeadStep1";
import {
  useRmLoanFormResume,
  rmCompleteLoanFormUrl,
} from "../../../../utils/rmLoanForm";

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
  const [maxStep, setMaxStep] = useState(0);
  const objectUrlsRef = useRef([]);
  const abortControllerRef = useRef(null);

  const { resumeMeta, loadingResume, resumeError } = useRmLoanFormResume({
    enabled: isRmMode,
    setFormData,
    setApplicationId,
  });
  useEffect(() => {
    if (resumeError) setError(resumeError);
  }, [resumeError]);

  const steps = [
    { label: "Personal", id: "personal" },
    { label: "Address", id: "address" },
    { label: "Employment & Property", id: "employment" },
    { label: "Documents", id: "documents" },
    { label: "References", id: "references" },
    { label: "Review & Security", id: "review" },
  ];

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

    const stepFields = (() => {
      if (stepIndex === 0) {
        return [
          "firstName",
          "middleName",
          "lastName",
          "motherName",
          "gender",
          "maritalStatus",
          "password",
          "confirmPassword",
          "contactNo",
          "email",
          "dob",
          "pan",
          "hasRunningLoan",
          "loanPurpose",
        ];
      }
      if (stepIndex === 1) {
        return [
          "currentAddress",
          "stabilityOfResidency",
          "currentLandmark",
          "currentHouseStatus",
          "currentAddressPinCode",
          "permanentAddress",
          "permanentStability",
          "permanentLandmark",
          "permanentHouseStatus",
          "permanentAddressPinCode",
        ];
      }
      if (stepIndex === 2) {
        return [
          "loanAmount",
          "companyName",
          "designation",
          "companyAddress",
          "monthlySalary",
          "totalExperience",
          "currentExperience",
          "salaryInHand",
          "propertyType",
          "propertyValue",
          "propertyAddress",
        ];
      }
      if (stepIndex === 3) {
        return [
          "aadharFront",
          "aadharBack",
          "panCard",
          "passportPhoto",
          "selfie",
          "companyIdCard",
          "salarySlip1",
          "salarySlip2",
          "salarySlip3",
          "form16_26as",
          "addressProof",
          "bankStatement1",
          "bankStatement2",
        ];
      }
      if (stepIndex === 4) {
        return [
          "reference1Name",
          "reference1Contact",
          "reference2Name",
          "reference2Contact",
        ];
      }
      return [];
    })();

    const errors = {};
    for (const key of stepFields) {
      if (fullErrors[key]) errors[key] = fullErrors[key];
    }

    if (stepIndex === 0) {
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

    if (stepIndex === 1) {
      const rPin = pinSchema.safeParse(formData.currentAddressPinCode);
      if (!rPin.success) errors.currentAddressPinCode = rPin.error.issues[0].message;
      const rPermPin = pinSchema.safeParse(formData.permanentAddressPinCode);
      if (!rPermPin.success) errors.permanentAddressPinCode = rPermPin.error.issues[0].message;
    }

    return errors;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "loanAmount"
          ? value === ""
            ? ""
            : parseInt(value, 10)
          : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      const err = validateLoanDocumentUpload(file, name);
      if (err) {
        toast.error(err);
        return;
      }
      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));
    }
  };

  const handleFileRemove = (fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  };

  const handleFileChangeAddressProofs = (file) => {
    if (!file) return;
    const err = validateLoanDocumentUpload(file, "addressProof");
    if (err) {
      toast.error(err);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      addressProof: file,
    }));
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
    if (!data.middleName) errors.middleName = "Middle name is required.";
    if (!data.lastName) errors.lastName = "Last name is required.";
    if (!data.motherName) errors.motherName = "Mother's name is required.";
    if (!data.gender) errors.gender = "Gender is required.";
    if (!data.maritalStatus) errors.maritalStatus = "Marital status is required.";

    if (!data.loanPurpose) {
      errors.loanPurpose = "Loan purpose is required.";
    }
    if (data.hasRunningLoan === "YES" && (!data.monthlyEmiPaying || Number(data.monthlyEmiPaying) <= 0)) {
      errors.monthlyEmiPaying = "Monthly EMI is required when running loan is Yes.";
    }

    if (!data.password) errors.password = "Password is required.";
    if (!data.confirmPassword) errors.confirmPassword = "Confirm Password is required.";
    if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (!data.contactNo) {
      errors.contactNo = "Contact number is required.";
    } else if (!/^\d{10}$/.test(data.contactNo)) {
      errors.contactNo = "Contact number must be exactly 10 digits.";
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

    const pin = data.currentAddressPinCode?.trim();
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
      const permPin = data.permanentAddressPinCode?.trim();
      if (!permPin) {
        errors.permanentAddressPinCode = "Permanent Address Pin is required.";
      } else if (!/^[1-9][0-9]{5}$/.test(permPin)) {
        errors.permanentAddressPinCode = "Enter a valid 6-digit PIN code.";
      }
    }

    if (!data.aadharFront) errors.aadharFront = "Aadhar Front is required.";
    if (!data.aadharBack) errors.aadharBack = "Aadhar Back is required.";
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

    // Collateral Property Details
    if (!data.propertyType) errors.propertyType = "Property type is required.";
    if (!data.propertyValue) errors.propertyValue = "Property estimated value is required.";
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
    }

    return errors;
  }

  const renderError = (field) => {
    return fieldErrors[field] ? (
      <p className="text-red-500 text-xs mt-1">{fieldErrors[field]}</p>
    ) : null;
  };

  const handleNextStep = () => {
    const errs = validateLapSalariedStep(currentStep);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      toast.error("Please fill in all required fields before proceeding.");
      return;
    }

    // Automatically capture Step 1 as a Lead in the system
    if (currentStep === 0 && !isRmMode) {
      captureLeadOnStep1Next({
        loanType: "LAP_SALARIED",
        formData,
        isPartnerLoggedIn,
        partnerToken,
        partnerReferralCode: currentPartnerCode,
        applicationId,
      }).then((res) => {
        if (res?.applicationId && !applicationId) {
          setApplicationId(res.applicationId);
        }
      }).catch((err) => console.warn("Step 1 lead capture non-fatal:", err));
    }

    const next = currentStep + 1;
    setCurrentStep(next);
    if (next > maxStep) setMaxStep(next);
  };

  const handlePrevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
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
          mothersName: formData.motherName,
          panNumber: formData.pan,
          dateOfBirth: formData.dob,
          gender: formData.gender,
          maritalStatus: formData.maritalStatus,
          spouseName: formData.wifeName,
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
          password: formData.password,
          bankStatementPassword: formData.bankStatementPassword,
          hasRunningLoan: formData.hasRunningLoan || "NO",
          monthlyEmiPaying: Number(formData.monthlyEmiPaying) || 0,
          loanPurpose: formData.loanPurpose || "",
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

      const oversize = findOversizeInLoanDocsQueue(docsQueue);
      if (oversize) {
        const msg = formatLoanDocOversizeError(oversize);
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      docsQueue.forEach(({ file, type }) => {
        if (file) {
          formDataToSend.append("docs", file);
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

      const endpoint = isPartnerLoggedIn
        ? `${backendurl}/partner/create-applications`
        : `${backendurl}/partner/public/create-application`;

      const headers = isPartnerLoggedIn
        ? {
            Authorization: `Bearer ${partnerToken}`,
          }
        : {};

      const response = await axios.post(endpoint, formDataToSend, { headers });

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
            onStepClick={(idx) => {
              if (idx <= maxStep) setCurrentStep(idx);
            }}
          />
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Step 0: Personal */}
          {currentStep === 0 && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                Personal Information
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
                    Middle Name *
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Enter middle name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("middleName")}
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
                    Contact Number *
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
                    Email Address *
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
                    Official Email
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
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
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
                    value={formData.maritalStatus}
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

                {formData.maritalStatus === "Married" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Spouse Name
                    </label>
                    <input
                      type="text"
                      name="wifeName"
                      value={formData.wifeName}
                      onChange={handleInputChange}
                      placeholder="Spouse full name"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                    />
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

                {/* Financial Details (Running Loan, Monthly EMI, Loan Purpose) */}
                <LoanApplicantFinancialFields
                  formData={formData}
                  handleInputChange={handleInputChange}
                  renderError={renderError}
                  fieldErrors={fieldErrors}
                />
              </div>
            </section>
          )}

          {/* Step 1: Address */}
          {currentStep === 1 && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                Current & Permanent Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Address *
                  </label>
                  <textarea
                    name="currentAddress"
                    rows="2"
                    value={formData.currentAddress}
                    onChange={handleInputChange}
                    placeholder="Full residential address"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("currentAddress")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Landmark *
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
                    Current Pincode *
                  </label>
                  <input
                    type="text"
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
                    value={formData.currentHouseStatus}
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
                    Stability of Residency (Years) *
                  </label>
                  <input
                    type="text"
                    name="stabilityOfResidency"
                    value={formData.stabilityOfResidency}
                    onChange={handleInputChange}
                    placeholder="e.g. 5 Years"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("stabilityOfResidency")}
                </div>

                <div className="md:col-span-2 pt-4 border-t border-slate-200">
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
                    Permanent Address is same as Current Address
                  </label>
                </div>

                {!sameAddress && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Permanent Address *
                      </label>
                      <textarea
                        name="permanentAddress"
                        rows="2"
                        value={formData.permanentAddress}
                        onChange={handleInputChange}
                        placeholder="Permanent residential address"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                      {renderError("permanentAddress")}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Permanent Landmark *
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
                        Permanent Pincode *
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        name="permanentAddressPinCode"
                        value={formData.permanentAddressPinCode}
                        onChange={handleInputChange}
                        placeholder="6-digit PIN code"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                      {renderError("permanentAddressPinCode")}
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Step 2: Employment, Loan & Collateral Property */}
          {currentStep === 2 && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600" />
                Employment & Collateral Property Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Requested Loan Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="loanAmount"
                    value={formData.loanAmount}
                    onChange={handleInputChange}
                    placeholder="e.g. 2500000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("loanAmount")}
                </div>

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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Gross Monthly Salary (₹) *
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

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Company Office Address *
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

                {/* Collateral Property Details */}
                <div className="md:col-span-2 pt-6 border-t border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-teal-600" />
                    Pledged Property (Collateral) Information
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
                        Estimated Market Value (₹) *
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
                        Complete Property Address *
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
                </div>
              </div>
            </section>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Upload Documents
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                    KYC Documents
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
                    <DocumentUploadCard
                      name="panCard"
                      label="PAN Card *"
                      file={formData.panCard}
                      required
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                      error={renderError("panCard")}
                    />
                    <DocumentUploadCard
                      name="passportPhoto"
                      label="Applicant Photo *"
                      file={formData.passportPhoto}
                      required
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                      error={renderError("passportPhoto")}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                    Income & Employment Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentUploadCard
                      name="companyIdCard"
                      label="Company ID Card *"
                      file={formData.companyIdCard}
                      required
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                      error={renderError("companyIdCard")}
                    />
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
                      label="Form 16 / 26AS"
                      file={formData.form16_26as}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
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
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                    Collateral Property Documents
                  </h3>
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
                  </div>
                </div>

                <LoanAddressProofBlock
                  stepLabel="4.4"
                  file={formData.addressProof}
                  onChange={handleFileChangeAddressProofs}
                  renderError={renderError}
                />
              </div>
            </section>
          )}

          {/* Step 4: References */}
          {currentStep === 4 && (
            <section className="space-y-6">
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
          )}

          {/* Step 5: Security & Review */}
          {currentStep === 5 && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Security & Review
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Account Password *
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
                    Confirm Password *
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

              {/* Review card */}
              <div className="p-6 rounded-2xl bg-teal-50/50 border border-teal-100 text-sm text-slate-700 space-y-2">
                <h3 className="font-bold text-teal-900 text-base">Application Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <p><span className="font-semibold text-slate-500">Applicant:</span> {formData.firstName} {formData.lastName}</p>
                  <p><span className="font-semibold text-slate-500">Loan Product:</span> LAP (Salaried)</p>
                  <p><span className="font-semibold text-slate-500">Loan Amount:</span> ₹{Number(formData.loanAmount || 0).toLocaleString()}</p>
                  <p><span className="font-semibold text-slate-500">Company:</span> {formData.companyName}</p>
                  <p><span className="font-semibold text-slate-500">Property:</span> {formData.propertyType}</p>
                  <p><span className="font-semibold text-slate-500">Property Value:</span> ₹{Number(formData.propertyValue || 0).toLocaleString()}</p>
                </div>
              </div>

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
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 0 || loading}
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-8 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md transition"
              >
                Next Step
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
